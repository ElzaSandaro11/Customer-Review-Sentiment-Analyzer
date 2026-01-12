# AWS Deployment & Cost Optimization Strategy

## 1. Cost-Optimized Architecture (The "Free Tier" Strategy)
For a personal project or assessment, minimizing fixed costs is key. We should avoid managed services like RDS ($15+/mo) or Load Balancers ($15+/mo) if possible.

### Recommended Stack: "The Monolith on EC2"
- **Compute**: EC2 `t3.micro` (Free Tier eligible: 750 hours/month).
- **OS**: Amazon Linux 2023 or Ubuntu 24.04.
- **Orchestration**: Docker Compose (Reusing our `docker-compose.prod.yml`).
- **Database**: SQLite (mounted Docker volume) - *Zero Cost*.
- **Networking**: Public IP with Security Group (Ports 80/443).
- **SSL/Proxy**: Nginx + Certbot (Let's Encrypt) - *Zero Cost*.

### Cost Breakdown
| Service | Type | Estimated Cost | Notes |
|---------|------|----------------|-------|
| EC2 | t3.micro | $0.00 (Free Tier) | $10/mo after 1 year |
| EBS | 30GB gp3 | $0.00 (Free Tier) | Included in Free Tier |
| Data Transfer | Outbound | $0.00 | First 100GB/mo is free |
| **Total** | | **$0.00** | |

## 2. Why this is "Senior" level
- **Pragmatism**: You aren't over-engineering (e.g., K8s) for a small app.
- **Portability**: The Docker Compose file runs anywhere (AWS, Azure, DigitalOcean, Local).
- **Cost Awareness**: You explicitly chose components to fit the budget.

## 3. Implementation Plan
We will create a `terraform/` folder to provision this infrastructure automatically.

### Resources to Provision
1.  **VPC & Subnets**: Standard networking.
2.  **Security Group**: Allow TCP 22 (SSH), 80 (HTTP), 3000 (API), 3001 (Web).
3.  **EC2 Instance**: With `user_data` script to:
    - Install Docker & Docker Compose.
    - Git clone repository.
    - Run `./deploy.sh`.

## 4. Why not Serverless (Lambda)?
- **Cold Starts**: Java/NestJS on Lambda has high cold starts.
- **Complexity**: Requires splitting the generic Dockerfile into Lambda-compatible builds (Lambda Web Adapter).
- **Docker Compose**: We already have a working Docker Compose. Moving to EC2 is the path of least resistance.
