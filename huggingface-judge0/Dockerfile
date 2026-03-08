# Read the doc: https://huggingface.co/docs/hub/spaces-sdks-docker
# you will also find guides on how best to write your Dockerfile

FROM judge0/judge0:latest

# Set working directory
WORKDIR /app

# Expose port 7860 (required by Hugging Face Spaces)
EXPOSE 7860

# Environment variables for Judge0
ENV RAILS_ENV=production
ENV SECRET_KEY_BASE=change-this-to-random-string
ENV POSTGRES_USER=judge0
ENV POSTGRES_PASSWORD=judge0
ENV POSTGRES_DB=judge0
ENV REDIS_URL=redis://localhost:6379

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7860/ || exit 1

# Start Judge0 on port 7860
CMD ["./scripts/server", "-p", "7860"]
