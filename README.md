# Inventory Management Full-Stack Application  
**Next.js Frontend + Node.js/Express Backend + Prisma + PostgreSQL on AWS**

---

## Project Overview
This project is a **production-style full-stack inventory management system** deployed on AWS.

The goal was not only to build a working application, but to **understand and demonstrate real-world cloud deployment**, including:
- Networking
- Security
- Cost control
- Server management
- Database isolation

This mirrors how applications are deployed in real companies, not just portfolio demos.

---

## Why Everything Was Built Offline First
Before deploying anything to AWS, the entire application was built and tested locally.

This is critical because:
- AWS introduces many layers (VPCs, subnets, routing, security groups)
- If something breaks in the cloud, it becomes unclear whether the issue is:
  - Application code
  - AWS configuration

By validating everything offline first:
- Any post-deployment issue is **guaranteed to be AWS-related**
- Debugging becomes much faster and more structured
- Simple bugs are not confused with infrastructure problems

---

## Why AWS Was Chosen
AWS was intentionally chosen over “click-and-deploy” platforms.

Reasons:
- AWS is a **highly valued skill** in the job market
- It demonstrates understanding of **infrastructure**, not just frontend apps
- Employers look for engineers who can:
  - Design secure systems
  - Understand networking
  - Manage servers and costs

This project focuses on **real engineering skills**, not just visuals.

---

## AWS Free Tier & Cost Awareness
AWS provides a Free Tier, but **free does not mean safe by default**.

Free Tier types:
- **12 Months Free** (EC2, RDS)
- **Always Free** (Lambda, DynamoDB with limits)
- **Free Trials**

Even with Free Tier, charges can occur if:
- A service is misconfigured
- Limits are exceeded
- Non-free services are used accidentally

---

## Billing Protection (Very Important)
Billing was configured **before deployment**.

Actions taken:
- Enabled **Billing Dashboard**
- Created a **Monthly Zero-Spend Budget**
  - Budget limit: `$0.01`
  - Email alert when exceeded

This ensures:
- Immediate notification if anything goes wrong
- No surprise AWS bills

---

## AWS Interaction Method
AWS can be used in three ways:
1. **AWS Console (UI)** ← used in this project
2. AWS CLI
3. AWS SDK

The console was chosen so:
- All resources are visible
- Networking and security are easier to understand

---

## AWS Networking Architecture
Networking is the foundation of the deployment.

This project uses:
- Custom VPC
- Public and private subnets
- Route tables
- Internet gateway
- Security groups

This mirrors real enterprise setups where:
- Services are isolated
- Access is controlled
- Security is enforced by design

---

## Virtual Private Cloud (VPC)
A **custom VPC** was created instead of using the default one.

Why:
- Default VPCs hide important configurations
- Custom VPCs force understanding of networking

VPC CIDR:
10.1.0.0/16

This provides a large private IP range for all services.

---

## Subnets
The VPC was split into two subnets:

### Public Subnet
- CIDR: `10.0.1.0/24`
- Availability Zone: `us-east-2a`
- Hosts internet-facing services (EC2 backend)

### Private Subnet
- CIDR: `10.0.2.0/24`
- Availability Zone: `us-east-2b`
- Hosts internal services (PostgreSQL database)

Without subnets, **no AWS services can be deployed**.

---

## Internet Gateway
By default, VPCs cannot access the internet.

We created:
- An **Internet Gateway**
- Attached it to the VPC

This allows:
- External traffic to reach the public subnet
- The backend API to be accessible

---

## Route Tables
Route tables define **where traffic is allowed to go**.

### Public Route Table
Local traffic → VPC
0.0.0.0/0 → Internet Gateway

Allows full internet access.

### Private Route Table
Local traffic → VPC

No internet access (by design).

Each route table was explicitly associated with its subnet.

---

## Network ACLs
Network ACLs act as **subnet-level firewalls**.

In this project:
- Default ACLs were used
- Security groups handled most access control

---

## EC2 — Backend Server
Amazon EC2 hosts the **Node.js/Express backend**.

Think of EC2 as:
> A Linux computer in the cloud that you fully control

### EC2 Configuration
- Amazon Linux
- Instance type: `t2.micro` (Free Tier)
- Deployed in **Public Subnet**
- Auto-assign public IPv4 enabled

---

## EC2 Security Group (Critical)
Security groups act as **instance-level firewalls**.

Inbound rules allowed:
- SSH (22)
- HTTP (80)
- HTTPS (443)

This is the **#1 failure point** for AWS beginners.  
Without these rules, the backend would not be reachable.

---

## Connecting to EC2
Connected using **EC2 Instance Connect (SSH)**.

Once connected:
- Verified Amazon Linux shell
- Treated EC2 like a fresh machine

---

## EC2 Server Setup
Inside the EC2 instance:

### 1. Install Node.js using NVM
```bash
sudo su -
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
node -v
npm -v
```
### 2. Install Git and Clone Repo
```bash
sudo yum update -y
sudo yum install git -y
git clone <your-github-repo>
cd inventory-management
npm install
```
### 3. Environment Configuration
```bash
echo "PORT=80" > .env
npm start
```

PM2 — Process Manager
PM2 ensures the backend stays running even if:
- SSH disconnects
- EC2 restarts
```bash
Install PM2
npm install pm2 -g
```

Start App with PM2
```bash
pm2 start ecosystem.config.js
```

Enable Startup on Reboot
```bash
sudo env PATH=$PATH:$(which node) $(which pm2) startup systemd -u $USER --hp $(eval echo ~$USER)
```
PM2 turns the EC2 instance into a production-ready server.

## AWS RDS — PostgreSQL Database (Private)

Amazon RDS is used to host the **PostgreSQL database** for the application.  
RDS is a **managed database service**, which means AWS handles maintenance tasks such as patching, availability, and basic reliability.

### Why We Chose RDS
We selected Amazon RDS because it:
- Is a **managed service**, reducing operational overhead
- Provides **reliable backups and stability**
- Is an **industry-standard** solution used in real production systems

Using RDS reflects how databases are typically deployed in professional cloud environments.

### Security Design (Very Important)
The database was designed with **security first** principles:

- Deployed inside a **Private Subnet**
- Has **no public IP address**
- Is **not accessible from the internet**
- Can only be accessed from inside the VPC

This means the database is completely hidden from external users.

### RDS Security Group
RDS has its own dedicated security group:
- Allows inbound traffic on **port 5432** (PostgreSQL)
- Accepts traffic **only from the EC2 security group**

This setup ensures that:
- Only the backend server (EC2) can connect to the database
- Even if someone discovers the RDS endpoint, they cannot connect
- The **client (browser) never talks directly to the database**

This is how real-world backend systems are designed.

### Prisma Integration
Prisma is used as the ORM and database toolkit.

Prisma handles:
- Database schema management
- Running migrations
- Seeding initial data
- Providing safe and structured database access

All sensitive information such as:
- Database host
- Username
- Password
- Database name  

is stored securely in **environment variables**, never hard-coded in the application.

---

## AWS S3 — Image Storage

Amazon S3 is used to store and serve **static images** used by the application.

### Why We Chose S3
S3 is ideal for static assets because it is:
- **Cheap**
- **Highly scalable**
- **Extremely reliable**

It is the industry standard for storing images, videos, and static files.

### Configuration
The S3 bucket was configured with:
- **Public read access enabled**
- A bucket policy that allows `s3:GetObject`

This allows anyone to view images while preventing uploads or modifications from the public.

### What S3 Is Used For
- Product images
- UI assets
- Static media used by the frontend

Images are uploaded once and then referenced using their public URLs.

### Next.js Integration
Next.js was explicitly configured to:
- Allow the S3 bucket domain as a remote image source

This prevents image loading errors and ensures images render correctly in production.

---

## Final Architecture Summary

- **Frontend**: Next.js (hosted separately)
- **Backend**: Node.js + Express running on EC2
- **Database**: PostgreSQL on Amazon RDS (Private)
- **Storage**: Amazon S3 for static images
- **Networking**: Custom VPC, public and private subnets, route tables, security groups
- **Stability**: PM2 for process management
- **Cost Control**: AWS Free Tier + budget alerts

---

## Why This Project Matters

This project demonstrates:
- Real AWS networking knowledge
- Strong security best practices
- Production-style cloud deployment
- Cost awareness and billing control
- Infrastructure-level understanding

This goes far beyond:
> “I built a CRUD app”

And clearly shows:
> “I understand real-world cloud deployment.”

