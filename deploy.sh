#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="sisarasa-65427"
REGION="asia-southeast2"
SERVICE_NAME="sisarasa"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying ${SERVICE_NAME} to Google Cloud Run..."

# 1. Build & push image
echo "📦 Building and pushing image..."
gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}"

# 2. Deploy ke Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80 \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2-)" \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2-)" \
  --set-env-vars="FIREBASE_PROJECT_ID=${PROJECT_ID}" \
  --set-env-vars="FIREBASE_CLIENT_EMAIL=$(grep FIREBASE_CLIENT_EMAIL .env.local | cut -d= -f2-)" \
  --set-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest" \
  --project "${PROJECT_ID}"

# 3. Dapatkan URL
URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format="value(status.url)" \
  --project "${PROJECT_ID}")

echo "✅ Deployed! URL: ${URL}"
echo ""
echo "⚠️  Jangan lupa update Firebase Console -> Web Push certificates"
echo "   dengan VAPID key yang sesuai jika perlu."
