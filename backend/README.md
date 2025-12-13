# Backend - Spring Boot REST API

## Overview
This is the backend REST API for ResolveIT, built with Spring Boot 3.1.5.

## Technologies
- Spring Boot 3.1.5
- Spring Security (JWT)
- Spring Data JPA
- Hibernate
- MySQL Connector
- Lombok
- Maven

## Running Locally

### Prerequisites
- JDK 17 or higher
- Maven 3.6+
- MySQL 8.0+

### Build
```bash
mvn clean install
```

### Run
```bash
mvn spring-boot:run
```

Server starts on: http://localhost:8080

## Configuration
Edit `src/main/resources/application.properties` to configure:
- Database connection
- JWT secret
- CORS origins
- File upload settings

## API Documentation

### Authentication Endpoints
- POST `/api/auth/login` - User login
- POST `/api/auth/signup` - User registration

### Complaint Endpoints
- POST `/api/complaints/anonymous` - Anonymous complaint
- POST `/api/complaints` - Authenticated complaint
- GET `/api/complaints/my` - User's complaints

### Admin Endpoints
- GET `/api/complaints/admin/all` - All complaints
- PUT `/api/complaints/admin/{id}/status` - Update status
- POST `/api/complaints/admin/{id}/comment` - Add comment
- GET `/api/complaints/admin/filter` - Filter complaints
