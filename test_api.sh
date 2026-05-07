#!/bin/bash

# Configuration
API_BASE="http://localhost:8000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Credentials
AUDIENCE="audience:password123"
STAFF="staff:password123"
ADMIN="admin:password123"

echo -e "${GREEN}Starting Cinema API Comprehensive Tests...${NC}"

SETUP_CODE="
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
User = get_user_model()
staff_group, _ = Group.objects.get_or_create(name='Staff')
admin_group, _ = Group.objects.get_or_create(name='Admin')

def create_user(username, email, group_name=None):
    user, created = User.objects.get_or_create(username=username, defaults={'email': email})
    user.set_password('password123')
    user.save()
    if group_name:
        group = Group.objects.get(name=group_name)
        user.groups.add(group)
    return user

create_user('audience', 'audience@test.com')
create_user('staff', 'staff@test.com', 'Staff')
create_user('admin', 'admin@test.com', 'Admin')
print('USER_SETUP_SUCCESS')
"

echo -e "\n${GREEN}[0/4] Setting up test users...${NC}"

# Try Docker first, then local fallback
if command -v docker-compose &> /dev/null && docker-compose ps | grep -q "Up"; then
    echo "Using docker-compose exec for setup..."
    echo "$SETUP_CODE" | docker-compose exec -T backend uv run python manage.py shell
else
    echo "Using local uv run for setup (assuming DB is at localhost)..."
    cd backend && DB_HOST=localhost uv run python manage.py shell <<< "$SETUP_CODE" && cd ..
fi

# 2. AUDIENCE TESTS
echo -e "\n${GREEN}[1/4] Testing Audience (Authenticated)...${NC}"
http --ignore-stdin -a $AUDIENCE GET "$API_BASE/movies/" --check-status > /dev/null
if [ $? -eq 0 ]; then echo "✅ Audience can view movies"; else echo "❌ Audience cannot view movies"; fi

http --ignore-stdin -a $AUDIENCE POST "$API_BASE/halls/" name="Elite Hall" rows_count=5 cols_count=5 dolby_atmos=true --check-status 2>/dev/null
if [ $? -ne 0 ]; then echo "✅ Audience creation of halls blocked"; else echo "❌ Audience creation of halls allowed!"; fi

# 3. STAFF TESTS
echo -e "\n${GREEN}[2/4] Testing Staff...${NC}"
http --ignore-stdin -a $STAFF GET "$API_BASE/tickets/" --check-status > /dev/null
if [ $? -eq 0 ]; then echo "✅ Staff can list all tickets"; else echo "❌ Staff cannot list tickets"; fi

# 4. ADMIN TESTS
echo -e "\n${GREEN}[3/4] Testing Admin...${NC}"
echo "Creating movie as Admin..."
RESPONSE=$(http --ignore-stdin -a $ADMIN POST "$API_BASE/movies/" \
    title="Interstellar" \
    description="Space" \
    producer="Nolan" \
    release_date="2014-11-07" \
    duration="02:49:00" \
    rating="PG-13")
MOVIE_ID=$(echo "$RESPONSE" | grep -Po '"id":\s*\K\d+' | head -1)

if [ ! -z "$MOVIE_ID" ]; then 
    echo "✅ Admin created movie (ID: $MOVIE_ID)"
else 
    echo "❌ Admin failed to create movie"
    echo "$RESPONSE"
fi

# 5. CROSS-ROLE FLOW
echo -e "\n${GREEN}[4/4] Testing Multi-role Flow...${NC}"
# Ensure a hall exists
HALL_ID=$(http --ignore-stdin -a $ADMIN POST "$API_BASE/halls/" name="Main Hall" rows_count=10 cols_count=10 dolby_atmos=true | grep -Po '"id":\s*\K\d+' | head -1)
[ -z "$HALL_ID" ] && HALL_ID=$(http --ignore-stdin GET "$API_BASE/halls/" | grep -Po '"id":\s*\K\d+' | head -1)

# Create a screening if none exist
SCREENING_ID=$(http --ignore-stdin GET "$API_BASE/screenings/" | grep -Po '"id":\s*\K\d+' | head -1)
if [ -z "$SCREENING_ID" ] && [ ! -z "$MOVIE_ID" ] && [ ! -z "$HALL_ID" ]; then
    SCREENING_ID=$(http --ignore-stdin -a $ADMIN POST "$API_BASE/screenings/" movie=$MOVIE_ID hall=$HALL_ID start_time="2026-12-01T20:00:00Z" base_price="12.00" | grep -Po '"id":\s*\K\d+' | head -1)
fi

# Create a seat if none exist
SEAT_ID=$(http --ignore-stdin GET "$API_BASE/seats/" | grep -Po '"id":\s*\K\d+' | head -1)
if [ -z "$SEAT_ID" ] && [ ! -z "$HALL_ID" ]; then
    SEAT_ID=$(http --ignore-stdin -a $ADMIN POST "$API_BASE/seats/" hall=$HALL_ID row_label="A" seat_number=1 grid_x=1 grid_y=1 | grep -Po '"id":\s*\K\d+' | head -1)
fi

# Get Audience User ID
AUDIENCE_USER_ID=$(cd backend && docker-compose exec -T backend uv run python manage.py shell -c "from django.contrib.auth import get_user_model; print(get_user_model().objects.get(username='audience').id)" 2>/dev/null | grep -Po '\d+' | tail -1)
[ -z "$AUDIENCE_USER_ID" ] && AUDIENCE_USER_ID=1 # Fallback

if [ ! -z "$SCREENING_ID" ] && [ ! -z "$SEAT_ID" ]; then
    echo "Staff creating ticket for Audience member (ID: $AUDIENCE_USER_ID)..."
    http --ignore-stdin -a $STAFF POST "$API_BASE/tickets/" screening=$SCREENING_ID seat=$SEAT_ID client=$AUDIENCE_USER_ID --check-status > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Staff created ticket for client"
    else
        echo "❌ Staff failed to create ticket"
        # Try without client if it fails due to unique constraint or something, to see if it's permission or data
        http --ignore-stdin -a $STAFF POST "$API_BASE/tickets/" screening=$SCREENING_ID seat=$SEAT_ID --check-status > /dev/null && echo "✅ Staff created ticket for self"
    fi
else
    echo "⚠️ Skipping flow test: Could not prepare screening or seat data."
fi

echo -e "\n${GREEN}All tests complete!${NC}"
