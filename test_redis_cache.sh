#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Redis Caching & Invalidation — End-to-End Test Script
# ─────────────────────────────────────────────────────────

BASE="http://localhost:3000"
PASS=0
FAIL=0

green()  { printf "\e[32m✓ %s\e[0m\n" "$1"; PASS=$((PASS + 1)); }
red()    { printf "\e[31m✗ %s\e[0m\n" "$1"; FAIL=$((FAIL + 1)); }
header() { printf "\n\e[1;36m── %s ──\e[0m\n" "$1"; }

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    green "$label"
  else
    red "$label (expected: $expected, got: $actual)"
  fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -q "$needle"; then
    green "$label"
  else
    red "$label (expected to contain: $needle)"
  fi
}

assert_not_contains() {
  local label="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -q "$needle"; then
    red "$label (unexpectedly contained: $needle)"
  else
    green "$label"
  fi
}

# ═══════════════════════════════════════════════════════════
header "0. Prerequisites"
# ═══════════════════════════════════════════════════════════

REDIS_PING=$(redis-cli PING 2>&1)
assert_eq "Redis is reachable" "PONG" "$REDIS_PING"

# Flush any old dashboard cache
redis-cli DEL dashboard:summary > /dev/null 2>&1 || true
green "Cleared stale cache key"

# ═══════════════════════════════════════════════════════════
header "1. Authenticate as Admin"
# ═══════════════════════════════════════════════════════════

LOGIN_RES=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zorvyn.com","password":"Admin@1234"}')

TOKEN=$(echo "$LOGIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null || echo "")

if [[ -n "$TOKEN" ]]; then
  green "Login successful — token acquired"
else
  red "Login failed — cannot continue"
  echo "$LOGIN_RES"
  printf "\n\e[1m  Total: %d  |  \e[32mPassed: %d\e[0m  |  \e[31mFailed: %d\e[0m\n\n" "$((PASS + FAIL))" "$PASS" "$FAIL"
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"

# ═══════════════════════════════════════════════════════════
header "2. Dashboard — Cache MISS (first request)"
# ═══════════════════════════════════════════════════════════

CACHE_BEFORE=$(redis-cli GET dashboard:summary 2>&1)
if [[ -z "$CACHE_BEFORE" || "$CACHE_BEFORE" == "(nil)" ]]; then
  green "Cache is empty before first request"
else
  red "Cache unexpectedly has data before first request"
fi

DASH_RES=$(curl -s -X GET "$BASE/api/dashboard/summary" -H "$AUTH")
assert_contains "Dashboard returns totalIncome" "totalIncome" "$DASH_RES"
assert_contains "Dashboard returns totalExpenses" "totalExpenses" "$DASH_RES"
assert_contains "Dashboard returns netBalance" "netBalance" "$DASH_RES"
assert_contains "Dashboard returns categoryBreakdown" "categoryBreakdown" "$DASH_RES"
assert_contains "Dashboard returns recentActivity" "recentActivity" "$DASH_RES"

# ═══════════════════════════════════════════════════════════
header "3. Verify cache was WRITTEN to Redis"
# ═══════════════════════════════════════════════════════════

CACHE_AFTER=$(redis-cli GET dashboard:summary 2>&1)
if [[ -n "$CACHE_AFTER" && "$CACHE_AFTER" != "(nil)" ]]; then
  green "Cache key 'dashboard:summary' now exists in Redis"
else
  red "Cache key was NOT written to Redis"
fi

# Verify TTL was set
TTL=$(redis-cli TTL dashboard:summary 2>&1)
if [[ "$TTL" -gt 3500 && "$TTL" -le 3600 ]] 2>/dev/null; then
  green "TTL is correct (~3600s, actual: ${TTL}s)"
else
  red "TTL unexpected (expected ~3600, got: ${TTL}s)"
fi

assert_contains "Cached data contains totalIncome" "totalIncome" "$CACHE_AFTER"

# ═══════════════════════════════════════════════════════════
header "4. Dashboard — Cache HIT (second request)"
# ═══════════════════════════════════════════════════════════

DASH_RES2=$(curl -s -X GET "$BASE/api/dashboard/summary" -H "$AUTH")
assert_contains "Cached response has totalIncome" "totalIncome" "$DASH_RES2"

if [[ "$DASH_RES" == "$DASH_RES2" ]]; then
  green "Cached response matches original response"
else
  red "Cached response differs from original"
fi

# ═══════════════════════════════════════════════════════════
header "5. Cache Invalidation — CREATE record"
# ═══════════════════════════════════════════════════════════

CREATE_RES=$(curl -s -X POST "$BASE/api/records" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "amount": 99999.99,
    "type": "income",
    "category": "Test Cache Invalidation",
    "date": "2026-03-25",
    "notes": "Testing Redis cache invalidation on create"
  }')

assert_contains "Record created successfully" "success" "$CREATE_RES"

RECORD_ID=$(echo "$CREATE_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")

if [[ -n "$RECORD_ID" ]]; then
  green "New record ID: $RECORD_ID"
else
  red "Could not extract record ID from create response"
fi

CACHE_AFTER_CREATE=$(redis-cli GET dashboard:summary 2>&1)
if [[ -z "$CACHE_AFTER_CREATE" || "$CACHE_AFTER_CREATE" == "(nil)" ]]; then
  green "Cache invalidated after CREATE"
else
  red "Cache NOT invalidated after CREATE"
fi

# ═══════════════════════════════════════════════════════════
header "6. Dashboard — fresh data after invalidation"
# ═══════════════════════════════════════════════════════════

DASH_RES3=$(curl -s -X GET "$BASE/api/dashboard/summary" -H "$AUTH")
assert_contains "Dashboard returns fresh data" "totalIncome" "$DASH_RES3"

# Verify cache was re-populated
CACHE_REPOP=$(redis-cli GET dashboard:summary 2>&1)
if [[ -n "$CACHE_REPOP" && "$CACHE_REPOP" != "(nil)" ]]; then
  green "Cache re-populated after fresh dashboard query"
else
  red "Cache was NOT re-populated"
fi

# ═══════════════════════════════════════════════════════════
header "7. Cache Invalidation — UPDATE record"
# ═══════════════════════════════════════════════════════════

if [[ -n "$RECORD_ID" ]]; then
  UPDATE_RES=$(curl -s -X PUT "$BASE/api/records/$RECORD_ID" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"amount": 77777.77, "notes": "Updated for cache test"}')

  assert_contains "Record updated successfully" "success" "$UPDATE_RES"

  CACHE_AFTER_UPDATE=$(redis-cli GET dashboard:summary 2>&1)
  if [[ -z "$CACHE_AFTER_UPDATE" || "$CACHE_AFTER_UPDATE" == "(nil)" ]]; then
    green "Cache invalidated after UPDATE"
  else
    red "Cache NOT invalidated after UPDATE"
  fi

  # Fetch dashboard to verify + re-populate cache
  DASH_RES4=$(curl -s -X GET "$BASE/api/dashboard/summary" -H "$AUTH")
  assert_contains "Dashboard reflects updated data" "totalIncome" "$DASH_RES4"
else
  red "Skipping UPDATE test — no record ID"
fi

# ═══════════════════════════════════════════════════════════
header "8. Cache Invalidation — DELETE record"
# ═══════════════════════════════════════════════════════════

if [[ -n "$RECORD_ID" ]]; then
  DELETE_RES=$(curl -s -X DELETE "$BASE/api/records/$RECORD_ID" -H "$AUTH")
  assert_contains "Record deleted successfully" "success" "$DELETE_RES"

  CACHE_AFTER_DELETE=$(redis-cli GET dashboard:summary 2>&1)
  if [[ -z "$CACHE_AFTER_DELETE" || "$CACHE_AFTER_DELETE" == "(nil)" ]]; then
    green "Cache invalidated after DELETE"
  else
    red "Cache NOT invalidated after DELETE"
  fi

  # Fetch dashboard — deleted record should be excluded
  DASH_RES5=$(curl -s -X GET "$BASE/api/dashboard/summary" -H "$AUTH")
  assert_contains "Dashboard works after delete" "totalIncome" "$DASH_RES5"
  assert_not_contains "Deleted record amount not in dashboard" "77777.77" "$DASH_RES5"
else
  red "Skipping DELETE test — no record ID"
fi

# ═══════════════════════════════════════════════════════════
header "9. Graceful degradation — DB fallback after cache clear"
# ═══════════════════════════════════════════════════════════

redis-cli DEL dashboard:summary > /dev/null 2>&1 || true
DASH_FALLBACK=$(curl -s -X GET "$BASE/api/dashboard/summary" -H "$AUTH")
assert_contains "Dashboard works after cache clear (DB fallback)" "totalIncome" "$DASH_FALLBACK"

# ═══════════════════════════════════════════════════════════
header "RESULTS"
# ═══════════════════════════════════════════════════════════

TOTAL=$((PASS + FAIL))
printf "\n\e[1m  Total: %d  |  \e[32mPassed: %d\e[0m  |  \e[31mFailed: %d\e[0m\n\n" "$TOTAL" "$PASS" "$FAIL"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
