# Deployment Strategy (10-Hour Assessment)

For a senior full-stack assessment with a 10-hour limit, do **NOT** try to deploy to AWS/GCP/Vercel unless explicitly asked. It consumes too much time debugging IAM/Network issues.

**Instead, demonstrate "Deployment Readiness" via Docker Compose.**

## 1. The Strategy: "Docker is the Deployment"
Your deliverable should be a repository that any engineer can clone and run with **one command**.

## 2. Updated Docker Compose (Full Stack)
We currently only dockerize the AI Engine. To impress the interviewer, we should dockerize **everything** (Next.js, NestJS, and Database) into a single orchestration file.

### Proposed `docker-compose.prod.yml`
- **Frontend**: Multi-stage build (Next.js Standalone mode for small image).
- **Backend**: Node.js Alpine build.
- **AI Engine**: Python Slim build.
- **Database**: Postgres (Switch back from SQLite for Prod simulation if desired, or keep SQLite for simplicity).

## 3. Deployment Script
Add a `deploy.sh` script that:
1. Builds all images.
2. Runs migrations.
3. Starts the swarm.

## 4. What to Adjust for the 10-Hour Limit
- **Scope**: You have already completed the MVP.
- **Polish**: Spending the remaining time on:
    - **Unit Tests**: We hit 80%, which is great.
    - **Input Validation**: Ensure `class-validator` is strict.
    - **Documentation**: A `README.md` that looks professional is worth 2 hours of coding.

## 5. Recommendation
I will create a `docker-compose.prod.yml` now. This proves you know how to containerize the entire stack for production, which is the standard answer for "How would you deploy this?".
