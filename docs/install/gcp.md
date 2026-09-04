---
summary: "Deploy OpenClaw Gateway 24/7 on Google Cloud using Cloud Run Instances or Compute Engine"
doc-schema-version: 1
read_when:
  - You want OpenClaw running 24/7 on Google Cloud
  - You want a serverless, managed deployment on Cloud Run Instances
  - You want a persistent Gateway on a Compute Engine VM
  - You need GCP provisioning, Secret Manager, Cloud Storage, or firewall guidance
title: "GCP"
---

Deploy a persistent OpenClaw Gateway on Google Cloud. You can deploy using either:

1. **Cloud Run Instances (Recommended / Managed)**: Container-native, serverless deployment with automated restarts, built-in HTTPS endpoints, Secret Manager credential management, and Cloud Storage state persistence.
2. **Compute Engine VM**: Dedicated Debian Linux VM running Docker.

---

## Option 1: Cloud Run Instances (Recommended)

Run OpenClaw on Cloud Run Instances for a fully managed, containerized environment with zero VM patching, zero SSH tunnels, and persistent workspace storage.

### Prerequisites

- A GCP project with billing enabled
- The `gcloud` CLI installed and authenticated (`gcloud auth login`)
- API credentials for your primary model provider (e.g. Gemini, Anthropic, or OpenAI)
- About 10 minutes

### Deployment Steps

<Steps>
  <Step title="Enable required APIs and set project">
    ```bash
    export PROJECT_ID="my-openclaw-project"
    export REGION="us-west1"
    export BUCKET_NAME="${PROJECT_ID}-openclaw-state"
    export SERVICE_ACCOUNT="openclaw-sa@${PROJECT_ID}.iam.gserviceaccount.com"

    gcloud config set project ${PROJECT_ID}
    gcloud services enable \
      run.googleapis.com \
      storage.googleapis.com \
      secretmanager.googleapis.com
    ```
  </Step>

  <Step title="Create dedicated service account">
    Create an unprivileged service account for OpenClaw:

    ```bash
    gcloud iam service-accounts create openclaw-sa \
      --display-name="OpenClaw Gateway Service Account"
    ```
  </Step>

  <Step title="Store secrets in Secret Manager">
    Generate a random gateway password and store your model credentials securely:

    ```bash
    export OPENCLAW_GATEWAY_PASSWORD=$(openssl rand -hex 16)
    echo "Gateway Password: ${OPENCLAW_GATEWAY_PASSWORD}"

    # 1. Store Gateway Password
    echo -n "${OPENCLAW_GATEWAY_PASSWORD}" | gcloud secrets create openclaw-gateway-password \
      --data-file=- \
      --replication-policy="automatic"

    # 2. Store Model API Key (e.g. Gemini)
    echo -n "YOUR_API_KEY" | gcloud secrets create gemini-api-key \
      --data-file=- \
      --replication-policy="automatic"

    # Grant service account access to read secrets
    gcloud secrets add-iam-policy-binding openclaw-gateway-password \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/secretmanager.secretAccessor"

    gcloud secrets add-iam-policy-binding gemini-api-key \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/secretmanager.secretAccessor"
    ```
  </Step>

  <Step title="Prepare Cloud Storage state bucket">
    Create a bucket to persist OpenClaw's configuration, sessions, and SQLite database:

    ```bash
    gcloud storage buckets create gs://${BUCKET_NAME} \
      --location=${REGION} \
      --uniform-bucket-level-access

    gcloud storage buckets add-iam-policy-binding gs://${BUCKET_NAME} \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/storage.objectUser"
    ```

    Upload a minimal `openclaw.json` configured for Cloud Run's reverse proxy:

    ```bash
    cat << 'EOF' > openclaw.json
    {
      "gateway": {
        "mode": "local",
        "port": 18789,
        "trustedProxies": ["0.0.0.0/0"],
        "bind": "lan",
        "auth": {
          "password": "${OPENCLAW_GATEWAY_PASSWORD}"
        },
        "controlUi": {
          "dangerouslyDisableDeviceAuth": true,
          "allowedOrigins": ["*"],
          "enabled": true
        }
      },
      "agents": {
        "defaults": {
          "model": {
            "primary": "google/gemini-2.5-pro"
          }
        }
      }
    }
    EOF

    gcloud storage cp openclaw.json gs://${BUCKET_NAME}/openclaw.json
    ```
  </Step>

  <Step title="Deploy to Cloud Run Instances">
    Deploy OpenClaw using `gcloud beta run instances create` with the Cloud Storage volume mount:

    ```bash
    gcloud beta run instances create openclaw-gateway \
      --image alpine/openclaw:latest \
      --service-account ${SERVICE_ACCOUNT} \
      --port 18789 \
      --cpu 2 \
      --memory 2Gi \
      --no-invoker-iam-check \
      --add-volume mount-path=/home/node/.openclaw,type=cloud-storage,mount-options="uid=1000;gid=1000;file-mode=0700;dir-mode=0700",bucket=${BUCKET_NAME} \
      --set-secrets GEMINI_API_KEY=gemini-api-key:latest,OPENCLAW_GATEWAY_PASSWORD=openclaw-gateway-password:latest \
      --region ${REGION}
    ```

    <Note>
      `mount-options="uid=1000;gid=1000;file-mode=0700;dir-mode=0700"` is required because OpenClaw runs as the unprivileged `node` user (`UID 1000`) and enforces strict `0700` permissions on session directories.
    </Note>
  </Step>

  <Step title="Access the Control Web UI">
    Retrieve your service URL:

    ```bash
    gcloud beta run instances describe openclaw-gateway \
      --region ${REGION} \
      --format="value(status.urls[0])"
    ```

    1. Open the URL in your browser.
    2. Enter your generated `OPENCLAW_GATEWAY_PASSWORD` to log in.
    3. Start prompting your agent directly from the web interface!
  </Step>
</Steps>

> For an in-depth walkthrough covering optional **Telegram / WhatsApp messaging integrations**, custom skills, and gVisor sandbox execution, see the official [Deploy OpenClaw on Cloud Run Instances Codelab](https://codelabs.developers.google.com/codelabs/cloud-run/deploy-openclaw-cloud-run-instances).

---

## Option 2: Compute Engine VM (Docker VM)

Run a persistent OpenClaw Gateway on a Debian Compute Engine VM with Docker.

### What you need

- A GCP project with billing enabled
- The `gcloud` CLI or the [Cloud Console](https://console.cloud.google.com)
- SSH access from your laptop
- Model and optional channel credentials
- About 20 minutes

### Provision the VM

<Steps>
  <Step title="Initialize gcloud">
    Install the CLI from
    [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install),
    then authenticate:

    ```bash
    gcloud init
    gcloud auth login
    ```

    You can perform the same steps in the Cloud Console.

  </Step>

  <Step title="Create the project">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Enable billing in the
    [Billing console](https://console.cloud.google.com/billing). Compute Engine
    will not start without it.

  </Step>

  <Step title="Choose a machine">
    | Type          | Specs                   | Notes                                  |
    | ------------- | ----------------------- | -------------------------------------- |
    | e2-standard-2 | 2 vCPU, 8 GB RAM        | Recommended for source image builds    |
    | e2-medium     | 2 vCPU, 4 GB RAM        | Use the official pre-built image       |
    | e2-small      | 2 vCPU, 2 GB RAM        | Use the official pre-built image       |

    Create a Debian 12 VM:

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-standard-2 \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Review firewall access">
    Keep TCP 18789 closed to the public Internet. The SSH tunnel below needs
    only SSH access to the VM:

    ```bash
    gcloud compute firewall-rules list \
      --format='table(name,network,direction,sourceRanges.list():label=SOURCE_RANGES,allowed[].map().firewall_rule().list():label=ALLOW)'
    ```

    Restrict SSH source ranges to your administrative network when possible.
    If you intentionally expose the Gateway through a reverse proxy or tailnet,
    follow [Gateway security](/gateway/security) rather than adding a broad
    `0.0.0.0/0` rule for port 18789.

  </Step>

  <Step title="Connect over SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    SSH key propagation can take a minute or two after VM creation. Wait and
    retry if the first connection is refused.

  </Step>

  <Step title="Install Docker">
    On the VM:

    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    exit
    ```

    Reconnect so the group change takes effect, then verify the installation:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    docker --version
    docker compose version
    ```

  </Step>
</Steps>

### Configure the Docker runtime

On the VM, follow [Docker VM runtime](/install/docker-vm-runtime) from
**Before you begin** through **Verify and administer the Gateway**. The
maintained setup script uses these GCP host paths by default:

```bash
export OPENCLAW_CONFIG_DIR="$HOME/.openclaw"
export OPENCLAW_WORKSPACE_DIR="$HOME/.openclaw/workspace"
export OPENCLAW_AUTH_PROFILE_SECRET_DIR="$HOME/.openclaw-auth-profile-secrets"
```

If a source build ends with `Killed`, `ResourceExhausted`, or exit code 137,
resize the VM before retrying.

### Access the Control UI

From your laptop, open an SSH tunnel and leave it running:

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

Open `http://127.0.0.1:18789/`. Paste the Gateway token from the VM's `.env`
when prompted. To reprint the dashboard URL or approve a browser device, run on
the VM:

```bash
cd openclaw
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

---

## Troubleshooting

### SSH connection refused (Compute Engine)

Wait one or two minutes for SSH key propagation, then retry. Check the VM is
running and that an ingress firewall rule allows TCP 22 from your current
network.

### OS Login issues

```bash
gcloud compute os-login describe-profile
```

Ensure your account has Compute OS Login or Compute OS Admin Login permission.

### Resize after an out-of-memory build

```bash
gcloud compute instances stop openclaw-gateway --zone=us-central1-a
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-medium
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Next steps

- [Channels](/channels)
- [Nodes](/nodes)
- [Gateway configuration](/gateway/configuration)
- [Docker VM Runtime](/install/docker-vm-runtime#update-openclaw)

## Related

- [Install overview](/install)
- [Docker VM Runtime](/install/docker-vm-runtime)
- [VPS hosting](/vps)
