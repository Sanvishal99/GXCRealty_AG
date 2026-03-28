# GXCRealty - User System & Role Management

## Overview
This document defines the user types, hierarchy, roles, permissions, and lifecycle states for the GXCRealty platform.

The system is designed to be:
- Scalable
- Role-driven
- Permission-based
- MLM-network compatible

---

## User Types

### 1. Agent (Primary User)
Agents are the core users responsible for generating revenue.

#### Responsibilities:
- Browse property listings
- Request property visits
- Close deals
- Invite new agents (referral system)

#### Permissions:
- View properties
- Request visits
- Mark deals as closed
- Access wallet & earnings
- Invite new users

---

### 2. Real Estate Company (Builder / Agency)
Companies manage property listings and validate deals.

#### Responsibilities:
- Add and manage properties
- Approve or reject visit requests
- Verify deal closures

#### Permissions:
- Create, update, delete properties
- Approve/reject visit requests
- Approve/reject deal closures
- View agent performance

---

### 3. Admin (Platform Operator)
Admins manage the entire platform.

#### Responsibilities:
- User management
- KYC approvals
- Commission monitoring
- Fraud detection

#### Permissions:
- Full system access
- Approve/reject KYC
- Manage users and companies
- Override commissions
- Access analytics and reports

---

## Optional Roles (Future Scope)

### 4. Property Manager
Works under a company to manage operations.

#### Responsibilities:
- Handle visit approvals
- Manage schedules
- Coordinate with agents

---

### 5. Super Admin
Highest authority (Founder level).

#### Permissions:
- Platform configuration
- Commission rule management
- Financial oversight
- Full system access

---

## User Hierarchy
Super Admin
↓
Admin
↓
Real Estate Company
↓
Property Manager (optional)
↓
Agent (Network Tree)
↓
Downline Agents
