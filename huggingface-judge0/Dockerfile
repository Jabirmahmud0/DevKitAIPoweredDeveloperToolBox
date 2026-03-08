# Read the doc: https://huggingface.co/docs/hub/spaces-sdks-docker
# you will also find guides on how best to write your Dockerfile

FROM judge0/judge0:latest

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"
ENV RAILS_ENV=production
ENV SECRET_KEY_BASE=change-this-to-random-string
ENV POSTGRES_USER=judge0
ENV POSTGRES_PASSWORD=judge0
ENV POSTGRES_DB=judge0
ENV REDIS_URL=redis://localhost:6379

WORKDIR /app

# Expose port 7860 (required by Hugging Face)
EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7860/ || exit 1

# Start Judge0 on port 7860
CMD ["./scripts/server", "-p", "7860"]
