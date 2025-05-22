# Mini InstaPay - Microservice Payment Platform

Mini InstaPay is a digital money transfer platform designed to enable users to securely send and receive money instantly. Built with a microservice architecture, it demonstrates modern DevOps practices with Docker and Kubernetes.

## Architecture

The application is built using multiple microservices, each handling a specific business function:

1. **User Management Service**: Handles user registration, authentication, and account details
2. **Transaction Service**: Manages sending/receiving money, updating balances, and transaction logs
3. **Reporting Service**: Analyzes account usage and generates transaction summaries
4. **Frontend**: React-based user interface

## Features

- User registration and authentication
- Secure money transfers between users
- Real-time transaction history and balance tracking
- Financial reporting and analytics
- Microservice architecture with service isolation
- Multi-environment configuration (Development, Staging, Production)

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Kubernetes (for production deployment)

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mini-instapay.git
cd mini-instapay
```

2. Start the development environment:

```bash
npm run start:dev
```

This will start all services in development mode with hot reloading.

### Production Setup

1. Build and start the production environment:

```bash
npm run start:prod
```

### Kubernetes Deployment

1. Apply the Kubernetes configuration:

```bash
kubectl apply -f kubernetes/instapay-deployment.yaml
kubectl apply -f kubernetes/instapay-services.yaml
```

## Project Structure

```
/
├── src/                         # Frontend React application
├── services/                    # Backend microservices
│   ├── user-service/            # User management service
│   ├── transaction-service/     # Transaction service
│   ├── reporting-service/       # Reporting service
├── docker/                      # Docker configuration files
├── kubernetes/                  # Kubernetes deployment files
├── docker-compose.yml           # Base Docker Compose configuration
├── docker-compose.dev.yml       # Development environment config
├── docker-compose.staging.yml   # Staging environment config
├── docker-compose.prod.yml      # Production environment config
```

## API Documentation

### User Management Service (Port 4001)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/users/me` - Get current user profile
- `GET /api/users/balance` - Get user balance

### Transaction Service (Port 4002)

- `POST /api/transactions/send` - Send money to another user
- `GET /api/transactions/history` - Get transaction history
- `GET /api/transactions/balance` - Get user balance

### Reporting Service (Port 4003)

- `GET /api/reports/summary` - Get transaction summary
- `GET /api/reports/monthly` - Get monthly report

## License

This project is licensed under the MIT License - see the LICENSE file for details.