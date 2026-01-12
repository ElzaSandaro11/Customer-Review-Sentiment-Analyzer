#!/bin/bash
# 1. Update and Install Dependencies
yum update -y
yum install -y git

# 2. Install Docker
yum install -y docker
service docker start
usermod -a -G docker ec2-user

# 3. Install Docker Compose
mkdir -p /usr/local/lib/docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
ln -s /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

# 4. Clone Repository (NOTE: In real scenario, use an SSH key or public repo)
# For this demo, we assume the user will scp the files or clone manually.
# But we will set up the directory structure.
mkdir -p /home/ec2-user/app
chown ec2-user:ec2-user /home/ec2-user/app

# 5. Helper Script to Start
cat <<EOF > /home/ec2-user/start_app.sh
#!/bin/bash
cd /home/ec2-user/app
# Assuming files are uploaded here
chmod +x deploy.sh
./deploy.sh
EOF
chmod +x /home/ec2-user/start_app.sh
chown ec2-user:ec2-user /home/ec2-user/start_app.sh
