# Full-stack Cinema Web Information System

This is an implementation of a cinema web application and information system, built for the purposes of the Web Information Systems class @UniPi. Clients can browse movies through interactive interfaces, view their purchases and tickets and create/book new ones. Staff can view screening information, validate client tickets by scanning them (via QR code), and cancel purchases for clients. Admins can view sales information and manage movies, screenings and halls.

### Technologies Used

* **Frontend:** React (TypeScript), Vite, TailwindCSS, DaisyUI
* **Backend:** Python, Django, Django REST Framework
* **Database:** PostgreSQL

## Installation & Execution

Below are instructions on how to run the application on a development environment. Docker and docker-compose are required.

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/soulgeo/cinema-fullstack-app.git
    cd cinema-fullstack-app/
    ```

2.  **Set up environment variables:**
    Copy the example environment file to create your local configuration:
    ```bash
    cd backend/ && cp .env.example .env && cd ..
    ```

    (You can leave the default values in `.env` as-is for local development with Docker.)

3.  **Start the development server:**
    Run the application using Docker Compose:
    ```bash
    docker compose up --build
    ```

4.  **Seed the database:**
    Open a new terminal window and populate the database with sample movies, screenings, halls, and users:
    ```bash
    docker compose exec backend uv run manage.py seed_db
    ```

The frontend application will be available at `http://localhost:5173`. The backend (Django) will run at `http://localhost:8000`.

## Email Delivery (Development)

In this development environment, outbound emails (such as ticket confirmation emails with QR code details) are printed directly to the backend terminal console (Django console) instead of being sent to actual email addresses.

### How to Preview Ticket QR Codes:
1. Locate the printed email in the backend terminal console (Django container logs).
2. Scroll to the bottom to find the base64-encoded PNG image attachment block (under `Content-Type: image/png` and `Content-Transfer-Encoding: base64`).
3. Copy the base64 string block.
4. Open a browser and enter the copied string in the address bar prefixed with `data:image/png;base64,` (for example: `data:image/png;base64,iVBORw0KGgoAAAANS...`) to render the QR code on your screen, which can then be scanned by the cashier validation scanner.

## Demo Credentials

You can use the following default accounts to log in and test different user roles:

| Role | Email | Password |
|---|---|---|
| **Audience** | audience@test.com | password123 |
| **Staff Member** | staff@test.com | password123 |
| **Admin** | admin@test.com | password123 |
