terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# 0. Get Default VPC
data "aws_vpc" "default" {
  default = true
}

# 1. Security Group: Allow HTTP, SSH, and App Ports
resource "aws_security_group" "app_sg" {
  name        = "aig_sentiment_sg"
  description = "Allow inbound traffic for Sentiment Analyzer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # SSH
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # API Gateway
  }
  
  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Web Portal
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. SSH Key Pair
resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

# 3. EC2 Instance (Free Tier Compatible)
resource "aws_instance" "app_server" {
  ami           = "ami-051f7e7f6c2f40dc1" # Amazon Linux 2023 (US-East-1)
  instance_type = "t3.micro"
  key_name      = aws_key_pair.deployer.key_name
  
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  user_data              = file("userdata.sh")

  tags = {
    Name = "SentimentAnalyzer-Server"
  }
}

output "public_ip" {
  value = aws_instance.app_server.public_ip
  description = "Public IP of the EC2 instance"
}
