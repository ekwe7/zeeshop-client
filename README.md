# ZeeShop Server

A scalable **Inventory and Sales Management System** built with **Spring Boot**, **Java**, **Gradle**, and an **Event-Driven Modular Monolith** architecture.

ZeeShop Server is a backend application for managing a small shop or retail business. It provides RESTful APIs for inventory management, sales, supplier purchases, customer debt tracking, expenses, and user authentication.

---

# Table of Contents

- Overview
- Features
- Architecture
- Project Structure
- Shared Module
- Business Domains
- Domain Communication
- Technology Stack
- Prerequisites
- Configuration
- Running the Application
- Running Tests
- API Documentation
- Design Principles
- Future Improvements
- License

---

# Overview

Unlike traditional Spring Boot applications that organize code by technical layers (controllers, services, repositories), ZeeShop Server follows a **Feature-Based Modular Monolith** architecture.

Each business domain owns its:

- Controllers
- Services
- Repositories
- Entities
- DTOs
- Events
- Validators
- Mappers
- Utilities

The entire application is deployed as a **single Spring Boot application**, while communication between modules happens through **Spring Domain Events**.

This architecture provides:

- High Cohesion
- Loose Coupling
- Better Maintainability
- Easier Testing
- Clear Separation of Responsibilities
- Future Microservice Readiness

---

# Features

- Product Inventory Management
- Stock Management
- Sales Processing
- Supplier Purchase Management
- Customer Management
- Customer Debt Tracking
- Expense Management
- User Authentication
- Role & Permission Management
- RESTful APIs
- Event-Driven Communication Between Domains

---

# Architecture

The application follows an **Event-Driven Modular Monolith** architecture.

Instead of calling services directly, domains communicate by publishing and listening to events.

Example:

```text
Sales Domain
      │
Publishes SaleCompletedEvent
      │
      ▼
ApplicationEventPublisher
      │
      ├────────► Product & Inventory Domain
      │              Reduce Stock
      │
      ├────────► Customer & Debt Domain
      │              Update Customer Debt
      │
      └────────► Expense Domain
                     Record Business Expense
```

This keeps every module independent while still running inside a single application.

---

# Project Structure

```text
src
└── main
    ├── java
    │
    └── com.ekwe_hub.zeeshopserver
        │
        ├── common
        ├── userauth
        ├── productinventory
        ├── supplierpurchase
        ├── customerdebt
        ├── sales
        ├── expense
        │
        └── ZeeshopServerApplication.java
```

---

# Shared Module

The **common** package contains reusable components shared across every business domain.

```text
common
│
├── config
├── dto
├── enums
├── event
├── exception
├── mapper
├── util
└── validator
```

### Responsibilities

- Spring Configuration
- Global Exception Handling
- Shared DTOs
- Base Domain Events
- Shared Validators
- Shared Utilities
- Common Enums
- Generic Mappers

---

# Business Domains

## User & Auth Domain

Responsible for:

- User Registration
- Login
- Authentication
- Authorization
- JWT Authentication
- Roles
- Permissions
- Password Reset

```text
userauth
│
├── controller
├── service
├── repository
├── entity
├── dto
│   ├── request
│   └── response
├── mapper
├── event
├── validator
└── util
```

Example Events

- UserCreatedEvent
- UserLoggedInEvent
- PasswordChangedEvent

---

## Product & Inventory Domain

Responsible for:

- Product Management
- Categories
- Inventory
- Stock Management
- Barcode
- Units
- Stock Adjustment
- Low Stock Monitoring

```text
productinventory
│
├── controller
├── service
├── repository
├── entity
├── dto
│   ├── request
│   └── response
├── mapper
├── event
├── validator
└── util
```

Example Events

- ProductCreatedEvent
- ProductUpdatedEvent
- StockAddedEvent
- StockReducedEvent
- LowStockEvent

---

## Supplier & Purchase Domain

Responsible for:

- Supplier Management
- Purchase Orders
- Purchase Items
- Goods Receiving
- Purchase History
- Supplier Payments

```text
supplierpurchase
│
├── controller
├── service
├── repository
├── entity
├── dto
│   ├── request
│   └── response
├── mapper
├── event
├── validator
└── util
```

Example Events

- SupplierCreatedEvent
- PurchaseCompletedEvent
- GoodsReceivedEvent

---

## Customer & Debt Domain

Responsible for:

- Customer Management
- Credit Sales
- Customer Balance
- Debt Tracking
- Debt Payment

```text
customerdebt
│
├── controller
├── service
├── repository
├── entity
├── dto
│   ├── request
│   └── response
├── mapper
├── event
├── validator
└── util
```

Example Events

- CustomerCreatedEvent
- DebtCreatedEvent
- DebtPaidEvent

---

## Sales Domain

Responsible for:

- Sales
- Sale Items
- Receipts
- Payments
- Discounts
- Taxes
- Returns

```text
sales
│
├── controller
├── service
├── repository
├── entity
├── dto
│   ├── request
│   └── response
├── mapper
├── event
├── validator
└── util
```

Example Events

- SaleCompletedEvent
- SaleCancelledEvent
- PaymentReceivedEvent

---

## Expense Domain

Responsible for:

- Expense Recording
- Expense Categories
- Operational Expenses

```text
expense
│
├── controller
├── service
├── repository
├── entity
├── dto
│   ├── request
│   └── response
├── mapper
├── event
├── validator
└── util
```

Example Events

- ExpenseCreatedEvent
- ExpenseUpdatedEvent

---

# Domain Communication

Business domains never call each other's services directly.

Instead they publish and subscribe to events.

```text
Customer Purchases Product

        │

        ▼

Sales Domain

        │

SaleCompletedEvent

        │

        ▼

ApplicationEventPublisher

        │

────────────────────────────────────────────

Product & Inventory Domain
        │
Reduce Stock

────────────────────────────────────────────

Customer & Debt Domain
        │
Update Outstanding Balance

────────────────────────────────────────────

Expense Domain
        │
Record Business Expense
```

---

# Technology Stack

- Java 21
- Spring Boot 3.3.5
- Spring Web
- Spring Data JPA
- Spring Security
- JWT Authentication
- PostgreSQL
- Lombok
- Gradle
- Flyway
- Spring Application Events

---

# Prerequisites

Before running the project, ensure you have:

- Java 21
- PostgreSQL
- Gradle Wrapper (included)

---

# Configuration

The application uses environment variables for database configuration.

Default database:

```
Database : zeeshop
Host     : localhost
Port     : 5432
```

Supported environment variables:

```
JDBC_DATABASE_URL
JDBC_DATABASE_USERNAME
JDBC_DATABASE_PASSWORD
JDBC_DATABASE_DRIVER
```

Example:

```bash
export JDBC_DATABASE_URL=jdbc:postgresql://localhost:5432/zeeshop
export JDBC_DATABASE_USERNAME=postgres
export JDBC_DATABASE_PASSWORD=postgres
```

---

# Running the Application

Linux / macOS

```bash
./gradlew bootRun
```

Windows

```bash
gradlew.bat bootRun
```

Application runs on

```
http://localhost:8083
```

---

# Running Tests

```bash
./gradlew test
```

---

# API Documentation

Once SpringDoc OpenAPI is integrated:

```
http://localhost:8083/swagger-ui/index.html
```

---

# Design Principles

This project follows:

- Event-Driven Architecture
- Modular Monolith
- Domain-Driven Design (DDD)
- SOLID Principles
- Separation of Concerns
- High Cohesion
- Loose Coupling
- Feature-Based Package Structure

---

# Future Improvements

Planned enhancements include:

- Email Notifications
- SMS Notifications
- Audit Logging
- Dashboard Analytics
- Multi-Branch Support
- Multi-Tenancy
- Docker Support
- CI/CD Pipeline
- API Versioning
- OpenAPI Documentation

---

# License

This project is currently under development.

A license (such as the MIT License) will be added before the first public release.

---

# Author

**Emmanuel Ekwe**

Designed and developed using **Spring Boot**, **Java**, and an **Event-Driven Modular Monolith** architecture.