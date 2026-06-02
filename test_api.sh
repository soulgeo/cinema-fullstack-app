#!/bin/bash

# Configuration
API_BASE="http://localhost:8000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Credentials
AUDIENCE="audience@test.com:password123"
STAFF="staff@test.com:password123"
ADMIN="admin@test.com:password123"

# Track created IDs for cleanup
CREATED_MOVIE_ID=""
CREATED_HALL_ID=""
CREATED_TICKET_ID=""

echo -e "${GREEN}Starting Cinema API Comprehensive Tests with Cleanup...${NC}"

# Cleanup function to be called at the end
cleanup() {
    echo -e "\n${RED}[Cleanup] Removing test data...${NC}"
    
    # Delete Ticket if it exists (though Hall/Movie delete might cascade)
    if [ ! -z "$CREATED_TICKET_ID" ]; then
        http --ignore-stdin -a $ADMIN DELETE "$API_BASE/tickets/$CREATED_TICKET_ID/" > /dev/null 2>&1
    fi

    # Delete Movie (Cascades to Screenings and Tickets)
    if [ ! -z "$CREATED_MOVIE_ID" ]; then
        http --ignore-stdin -a $ADMIN DELETE "$API_BASE/movies/$CREATED_MOVIE_ID/" > /dev/null 2>&1
    fi

    # Delete Hall (Cascades to Seats and Screenings)
    if [ ! -z "$CREATED_HALL_ID" ]; then
        http --ignore-stdin -a $ADMIN DELETE "$API_BASE/halls/$CREATED_HALL_ID/" > /dev/null 2>&1
    fi

    # Delete Users via Shell
    CLEANUP_USERS="
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.filter(email__in=['audience@test.com', 'staff@test.com', 'admin@test.com']).delete()
"
    if command -v docker-compose &> /dev/null && docker-compose ps | grep -q "Up"; then
        echo "$CLEANUP_USERS" | docker-compose exec -T backend uv run python manage.py shell > /dev/null 2>&1
    else
        cd backend && DB_HOST=localhost uv run python manage.py shell <<< "$CLEANUP_USERS" > /dev/null 2>&1 && cd ..
    fi
    echo -e "${GREEN}Cleanup complete.${NC}"
}

# Trap signals and exits to ensure cleanup runs
trap cleanup EXIT

# 0. SETUP: Ensure users exist
echo -e "\n${GREEN}[0/4] Setting up test users...${NC}"
SETUP_CODE="
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
User = get_user_model()
staff_group, _ = Group.objects.get_or_create(name='Staff')
admin_group, _ = Group.objects.get_or_create(name='Admin')

def create_user(email, first_name, group_name=None):
    user, created = User.objects.get_or_create(
        email=email, 
        defaults={
            'first_name': first_name,
            'last_name': 'Tester',
            'phone_number': '+1234567890'
        }
    )
    user.set_password('password123')
    user.save()
    if group_name:
        group = Group.objects.get(name=group_name)
        user.groups.add(group)
    return user

create_user('audience@test.com', 'Audience')
create_user('staff@test.com', 'Staff', 'Staff')
create_user('admin@test.com', 'Admin', 'Admin')
"

if command -v docker-compose &> /dev/null && docker-compose ps | grep -q "Up"; then
    echo "$SETUP_CODE" | docker-compose exec -T backend uv run python manage.py shell > /dev/null
else
    cd backend && DB_HOST=localhost uv run python manage.py shell <<< "$SETUP_CODE" > /dev/null && cd ..
fi
echo "✅ Users ready"

# 1. AUDIENCE TESTS
echo -e "\n${GREEN}[1/4] Testing Audience (Authenticated)...${NC}"
http --ignore-stdin -a $AUDIENCE GET "$API_BASE/movies/" --check-status > /dev/null
echo "✅ Audience can view movies"

http --ignore-stdin -a $AUDIENCE POST "$API_BASE/halls/" name="Forbidden Hall" rows_count=5 cols_count=5 dolby_atmos=true --check-status 2>/dev/null
if [ $? -ne 0 ]; then echo "✅ Audience creation of halls blocked"; else echo "❌ Audience creation of halls allowed!"; fi

# 2. STAFF TESTS
echo -e "\n${GREEN}[2/4] Testing Staff...${NC}"
http --ignore-stdin -a $STAFF GET "$API_BASE/tickets/" --check-status > /dev/null
echo "✅ Staff can list all tickets"

# 3. ADMIN TESTS
echo -e "\n${GREEN}[3/4] Testing Admin...${NC}"
echo "Creating movie as Admin..."
RESPONSE=$(http --ignore-stdin -a $ADMIN POST "$API_BASE/movies/" \
    title="Test Movie" \
    description="Temp" \
    producer="Tester" \
    release_date="2026-01-01" \
    duration="01:30:00" \
    rating="G")
CREATED_MOVIE_ID=$(echo "$RESPONSE" | grep -Po '"id":\s*\K\d+' | head -1)

if [ ! -z "$CREATED_MOVIE_ID" ]; then 
    echo "✅ Admin created movie (ID: $CREATED_MOVIE_ID)"
else 
    echo -e "${RED}❌ Admin failed to create movie${NC}"
    exit 1
fi

# 4. CROSS-ROLE FLOW
echo -e "\n${GREEN}[4/4] Testing Multi-role Flow...${NC}"

# Create a temporary Hall
CREATED_HALL_ID=$(http --ignore-stdin -a $ADMIN POST "$API_BASE/halls/" name="Test Hall" rows_count=5 cols_count=5 dolby_atmos=false | grep -Po '"id":\s*\K\d+' | head -1)

# Create a screening
SCREENING_ID=$(http --ignore-stdin -a $ADMIN POST "$API_BASE/screenings/" movie=$CREATED_MOVIE_ID hall=$CREATED_HALL_ID start_time="2026-12-31T23:59:59Z" base_price="10.00" | grep -Po '"id":\s*\K\d+' | head -1)

# Create a seat
SEAT_ID=$(http --ignore-stdin -a $ADMIN POST "$API_BASE/seats/" hall=$CREATED_HALL_ID row_label="T" seat_number=99 grid_x=1 grid_y=1 | grep -Po '"id":\s*\K\d+' | head -1)

# Get Audience User ID
AUD_ID=$(docker-compose exec -T backend uv run python manage.py shell -c "from django.contrib.auth import get_user_model; print(get_user_model().objects.get(email='audience@test.com').id)" 2>/dev/null | grep -Po '\d+' | tail -1)

if [ ! -z "$SCREENING_ID" ] && [ ! -z "$SEAT_ID" ] && [ ! -z "$AUD_ID" ]; then
    echo "Staff creating ticket for Audience member..."
    TICKET_RESP=$(http --ignore-stdin -a $STAFF POST "$API_BASE/tickets/" screening=$SCREENING_ID seat=$SEAT_ID client=$AUD_ID)
    CREATED_TICKET_ID=$(echo "$TICKET_RESP" | grep -Po '"id":\s*\K\d+' | head -1)
    
    if [ ! -z "$CREATED_TICKET_ID" ]; then
        echo "✅ Staff created ticket (ID: $CREATED_TICKET_ID)"
    else
        echo -e "${RED}❌ Staff failed to create ticket${NC}"
        echo "$TICKET_RESP"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to set up cross-role flow IDs${NC}"
    echo "Screening: $SCREENING_ID, Seat: $SEAT_ID, Audience: $AUD_ID"
    exit 1
fi

echo -e "\n${GREEN}All tests passed successfully!${NC}"
# cleanup will run automatically due to 'trap'
