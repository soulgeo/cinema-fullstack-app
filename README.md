# Full-stack Cinema Web Information System

This is an implementation of a cinema web application and information system, built for the purposes of the Web Information Systems class @UniPi. Clients can browse movies through interactive interfaces, view their purchases and tickets and create/book new ones. Staff can view screening information, validate client tickets by scanning them (via QR code), and cancel purchases for clients. Admins can view sales information and manage movies, screenings and halls.

## Installation & Execution

Below are instructions on how to run the application on a development environment. Docker and docker-compose are required.

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/soulgeo/cinema-fullstack-app.git
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

The frontend application will be available at `http://localhost:5173`. The backend (Django) will run at `http://localhost:8000`
