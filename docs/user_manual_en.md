### University of Piraeus, Department of Informatics
### Internet Information Systems — 8th Semester
**Academic Year 2025-26**

---

# User Manual
## Cinema Ticket Booking and Management System

This application is an integrated information system that allows spectators to view movies and book seats, box office staff to validate tickets and issue/cancel bookings, and administrators to configure the screening schedule, halls, movies, and monitor sales statistics.

---

## Table of Contents
1. [Architecture & User Roles](#architecture--user-roles)
2. [1. Spectator Functionalities (Audience / Spectator)](#1-spectator-functionalities-audience--spectator)
   - [1.1 Registration & Login](#11-registration--login)
   - [1.2 Account Management](#12-account-management)
   - [1.3 Searching & Filtering Screenings](#13-searching--filtering-screenings)
   - [1.4 Seat Selection & Purchase](#14-seat-selection--purchase)
   - [1.5 Ticket Viewing & Purchase History](#15-ticket-viewing--purchase-history)
3. [2. Box Office Staff Functionalities (Staff / Cashier)](#2-box-office-staff-functionalities-staff--cashier)
   - [2.1 Cashier Login & Work Dashboard](#21-cashier-login--work-dashboard)
   - [2.2 Ticket Validation (Scan Tickets)](#22-ticket-validation-scan-tickets)
   - [2.3 Issuing a New Ticket](#23-issuing-a-new-ticket)
   - [2.4 Booking Cancellation](#24-booking-cancellation)
4. [3. Administrator Functionalities (Administrator)](#3-administrator-functionalities-administrator)
   - [3.1 Sales Reports (Admin Panel)](#31-sales-reports-admin-panel)
   - [3.2 Movie Management (CRUD Movies)](#32-movie-management-crud-movies)
   - [3.3 Hall Management (CRUD Halls)](#33-hall-management-crud-halls)
   - [3.4 Screening Scheduling (CRUD Screenings)](#34-screening-scheduling-crud-screenings)
5. [Demo Credentials](#demo-credentials)

---

## Architecture & User Roles

The system supports three distinct user roles with different access levels and permissions:
- **Spectator**: Browses movies, searches screenings, selects seats, purchases tickets, and manages their profile.
- **Box Office Staff**: Has access to the physical cashier desk and the cinema entrance to scan (check-in) tickets, issue tickets, and perform cancellations.
- **Administrator**: Has full control over the system's database (movies, halls, screenings) and access to analytical sales and revenue statistics.

---

## 1. Spectator Functionalities (Audience)

### 1.1 Registration & Login
*   **Description**: Creation of a user account to save personal info and watch history.
*   **Workflow**: 
    1. The visitor opens the **Sign Up** tab from the top-right menu to register by entering their email, first name, last name, and password.
    2. After registration, they can log in via the **Login** tab in the same menu using their email and password.

![Sign Up Page](/home/twel/dev/cinema/docs/screenshots/signup.png)
*Figure 1.1: Registration Form for a New Spectator*

![Login Page](/home/twel/dev/cinema/docs/screenshots/login.png)
*Figure 1.2: User Login Form*

---

### 1.2 Account Management
*   **Description**: Updating the spectator's personal details and changing the password.
*   **Workflow**: Once logged in, the spectator can visit the **Account Settings** page from their profile menu. There, they can modify their first name, last name, email, or change their current password for security purposes.

![Account Settings](/home/twel/dev/cinema/docs/screenshots/account_settings.png)
*Figure 1.3: Personal Information and Account Security Management*

---

### 1.3 Searching & Filtering Screenings
*   **Description**: Viewing the program schedule with filtering options (e.g., by movie, date, time).
*   **Workflow**: 
    1. On the **Home Page**, the spectator views movies currently airing ("Now Showing") and those coming soon ("Coming Soon").
    2. On the **Search** page, the user can search for movies by typing the title, select a specific screening date, or filter based on the hall and screening time.

![Home Page](/home/twel/dev/cinema/docs/screenshots/home_page.png)
*Figure 1.4: Home Page displaying "Now Showing" and "Coming Soon" movies*

![Screening Search](/home/twel/dev/cinema/docs/screenshots/movie_search_page.png)
*Figure 1.5: Screening Search and Filtering Page*

---

### 1.4 Seat Selection & Purchase
*   **Description**: Selecting a screening, reserving specific seats via an interactive layout, and completing the booking/purchase.
*   **Workflow**:
    1. The spectator selects a movie to view its details (duration, summary, category) and its available showtimes on the **Movie Page**.
    2. Clicking on a showtime redirects them to the hall's virtual layout on the **Booking Page**, where they select their preferred available seats (occupied seats appear disabled).
    3. They then proceed to the **Payment Page**, where they enter their card details to complete the purchase (Note: the page is a simulation; no real transaction takes place). Upon successful payment, the tickets are issued and sent to the user's email.

![Movie Page](/home/twel/dev/cinema/docs/screenshots/movie_page.png)
*Figure 1.6: Movie Details and List of Available Showtimes*

![Hall Layout](/home/twel/dev/cinema/docs/screenshots/booking_page.png)
*Figure 1.7: Interactive Seat Selection from the Layout*

![Payment Checkout](/home/twel/dev/cinema/docs/screenshots/payment_page.png)
*Figure 1.8: Card Details Entry Form for Payment*

---

### 1.5 Ticket Viewing & Purchase History
*   **Description**: Displaying the active ticket (with a QR code or reservation number) for check-in at the entrance.
*   **Workflow**:
    1. After a successful purchase, the spectator can view their tickets on the **My Tickets** page. Each ticket contains a unique QR code to be shown at the cinema entrance.
    2. On the **My Purchases** page, a complete history of all user transactions is displayed, including booking details and payment status (Paid / Pending / Cancelled).

![Active Tickets](/home/twel/dev/cinema/docs/screenshots/my_tickets_page.png)
*Figure 1.9: Digital Tickets with Embedded QR Codes for Check-In*

![Purchase History](/home/twel/dev/cinema/docs/screenshots/my_purchases_page.png)
*Figure 1.10: Spectator Purchase and Transaction History*

---

## 2. Box Office Staff Functionalities (Staff / Cashier)

### 2.1 Cashier Login & Work Dashboard
*   **Description**: Accessing the staff workspace to view the current day's screenings.
*   **Workflow**: 
    1. Box office staff log in to their account to access the **Staff Dashboard**.
    2. The dashboard displays all screenings for the current day, sorted by time, along with the real-time seat occupancy for each hall.

![Staff Dashboard](/home/twel/dev/cinema/docs/screenshots/staff_dashboard.png)
*Figure 2.1: Staff Dashboard displaying Today's Showtimes and Occupancy Statistics*

---

### 2.2 Ticket Validation (Scan Tickets)
*   **Description**: Checking the customer's ticket (via QR scan) and marking the seat status as "Validated".
*   **Workflow**: 
    1. The staff member selects the **Scan Tickets** action.
    2. Using the device's camera, they scan the QR code from the customer's mobile phone.
    3. The system verifies the ticket's validity and displays a green success notice, automatically updating the ticket status in the database.

![Scan Prompt](/home/twel/dev/cinema/docs/screenshots/staff_scan_tickets_prompt.png)
*Figure 2.2: Awaiting Ticket QR Code Scan*

![Scan Success](/home/twel/dev/cinema/docs/screenshots/staff_scan_tickets_success.png)
*Figure 2.3: Successful Ticket Validation showing Seat and Movie Details*

---

### 2.3 Issuing a New Ticket
*   **Description**: Selecting a seat and creating a booking for customers served directly at the physical cashier desk.
*   **Workflow**:
    1. The staff member selects a screening from the dashboard and proceeds to the **Screening Overview** page.
    2. They select the desired vacant seats from the hall's layout.
    3. They search for the customer in the database by typing their email or name and select them.
    4. They click the **Book Tickets** button to complete the ticket issuance and reservation under the customer's name.

![Screening Overview and Ticket Issuance](/home/twel/dev/cinema/docs/screenshots/staff_screening_overview.png)
*Figure 2.4: Screening Overview Interface and Seat Selection for Ticket Issuance*

---

### 2.4 Booking Cancellation
*   **Description**: Locating an existing booking and cancelling it, releasing the occupied seats back to the hall.
*   **Workflow**:
    1. The staff member navigates to the **Search Purchases** page.
    2. They search for the booking/purchase by typing the Purchase ID, customer name, or email, with options to filter by status (Paid / Pending / Cancelled).
    3. They locate the entry in the table and click the **Cancel** button.
    4. Upon confirmation, the system updates the purchase status to "CANCELLED" and automatically releases the corresponding seats in the hall.

![Search Purchases and Cancellations](/home/twel/dev/cinema/docs/screenshots/staff_payment_search.png)
*Figure 2.5: Searching Transactions and Managing Purchase Cancellations*

---

## 3. Administrator Functionalities (Admin)

### 3.1 Sales Reports (Admin Panel)
*   **Description**: Exporting/viewing reports regarding the number of tickets sold per movie, screening, or time period.
*   **Workflow**:
    1. The administrator enters the **Admin Panel**.
    2. They set a date range (From Date - Till Date).
    3. The system dynamically generates charts (pie and line charts) showing total revenue per day, number of tickets sold, and sales percentages per movie.

![Admin Panel Statistics](/home/twel/dev/cinema/docs/screenshots/admin_panel.png)
*Figure 3.1: Detailed Sales and Revenue Reports with Interactive Charts*

---

### 3.2 Movie Management (CRUD Movies)
*   **Description**: Inserting, editing, and deleting movies (title, duration, category, age rating).
*   **Workflow**:
    1. On the **Manage Movies** page, the administrator views the list of all registered movies.
    2. They can add a new movie ("Add Movie") by completing the form with the title, duration, category, age rating, release date, cover image URL, and summary.
    3. They can also edit a movie's details or deactivate/delete it.

![Admin Movies List](/home/twel/dev/cinema/docs/screenshots/admin_movie_management.png)
*Figure 3.2: Movie List Management and Search Interface*

![Add Movie Form](/home/twel/dev/cinema/docs/screenshots/admin_add_movie.png)
*Figure 3.3: Form to Add a New Movie*

![Edit Movie Form](/home/twel/dev/cinema/docs/screenshots/admin_edit_movie.png)
*Figure 3.4: Form to Modify Existing Movie Details*

---

### 3.3 Hall Management (CRUD Halls)
*   **Description**: Registering available halls and defining their total capacity and seat layouts.
*   **Workflow**:
    1. On the **Manage Halls** page, the admin registers screen halls (e.g., Hall 1, VIP, 3D Max).
    2. They can edit the hall's grid layout (number of rows and seats per row), dynamically configuring the seat map shown to spectators during booking.

![Admin Halls List](/home/twel/dev/cinema/docs/screenshots/admin_hall_management.png)
*Figure 3.5: Screen Hall Management Table*

![Add Hall Form](/home/twel/dev/cinema/docs/screenshots/admin_add_hall.png)
*Figure 3.6: Form to Register a New Hall*

![Hall Layout Design](/home/twel/dev/cinema/docs/screenshots/admin_edit_hall_seats.png)
*Figure 3.7: Interactive Grid Seat and Row Layout Configuration*

---

### 3.4 Screening Scheduling (CRUD Screenings)
*   **Description**: Mapping a movie to a specific hall, date, and time to make it available for spectator bookings.
*   **Workflow**:
    1. On the **Manage Screenings** page, the administrator views the schedule calendar.
    2. To schedule a screening, they select the movie, the hall, the date, the start time, and the ticket price.
    3. The system automatically checks for schedule overlaps in the chosen hall.

![Admin Screenings Calendar](/home/twel/dev/cinema/docs/screenshots/admin_screening_management.png)
*Figure 3.8: List of Scheduled Movie Screenings*

![Add Screening Form](/home/twel/dev/cinema/docs/screenshots/admin_add_screening.png)
*Figure 3.9: Form to Schedule a New Movie Screening*

![Edit Screening Form](/home/twel/dev/cinema/docs/screenshots/admin_edit_screening.png)
*Figure 3.10: Form to Modify an Existing Screening*
