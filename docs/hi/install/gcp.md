---
read_when:
    - आप OpenClaw को GCP पर 24/7 चलाना चाहते हैं
    - आप अपने VM पर उत्पादन-स्तर का, हमेशा चालू रहने वाला Gateway चाहते हैं
    - आप persistence, binaries, और restart व्यवहार पर पूरा नियंत्रण चाहते हैं
summary: टिकाऊ स्थिति के साथ GCP Compute Engine VM (Docker) पर OpenClaw Gateway 24/7 चलाएँ
title: GCP
x-i18n:
    generated_at: "2026-06-28T23:20:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 678253bd90f0694668400ffddba957e442f8aaed3f5308af3c2481940e104733
    source_path: install/gcp.md
    workflow: 16
---

Docker का उपयोग करके GCP Compute Engine VM पर टिकाऊ स्थिति, पहले से शामिल binaries, और सुरक्षित restart व्यवहार के साथ एक persistent OpenClaw Gateway चलाएं.

अगर आप "OpenClaw 24/7 लगभग ~$5-12/mo में" चाहते हैं, तो यह Google Cloud पर एक भरोसेमंद सेटअप है.
कीमत मशीन प्रकार और क्षेत्र के अनुसार बदलती है; अपने workload के लिए उपयुक्त सबसे छोटा VM चुनें और OOMs आने पर scale up करें.

## हम क्या कर रहे हैं (सरल शब्दों में)?

- एक GCP project बनाना और billing सक्षम करना
- एक Compute Engine VM बनाना
- Docker install करना (isolated app runtime)
- Docker में OpenClaw Gateway शुरू करना
- Host पर `~/.openclaw` + `~/.openclaw/workspace` persist करना (restarts/rebuilds के बाद भी बना रहता है)
- SSH tunnel के जरिए अपने laptop से Control UI access करना

वह mounted `~/.openclaw` state `openclaw.json`, प्रति-agent
`agents/<agentId>/agent/auth-profiles.json`, और `.env` शामिल करता है.

Gateway को इन तरीकों से access किया जा सकता है:

- आपके laptop से SSH port forwarding
- अगर आप firewalling और tokens खुद manage करते हैं, तो direct port exposure

यह guide GCP Compute Engine पर Debian का उपयोग करती है.
Ubuntu भी काम करता है; packages को उसी अनुसार map करें.
Generic Docker flow के लिए, [Docker](/hi/install/docker) देखें.

---

## तेज़ रास्ता (अनुभवी operators)

1. GCP project बनाएं + Compute Engine API सक्षम करें
2. Compute Engine VM बनाएं (e2-small, Debian 12, 20GB)
3. VM में SSH करें
4. Docker install करें
5. OpenClaw repository clone करें
6. Persistent host directories बनाएं
7. `.env` और `docker-compose.yml` configure करें
8. ज़रूरी binaries bake करें, build करें, और launch करें

---

## आपको क्या चाहिए

- GCP account (e2-micro के लिए free tier योग्य)
- gcloud CLI installed (या Cloud Console का उपयोग करें)
- आपके laptop से SSH access
- SSH + copy/paste की बुनियादी सहजता
- ~20-30 मिनट
- Docker और Docker Compose
- Model auth credentials
- Optional provider credentials
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI install करें (या Console का उपयोग करें)">
    **Option A: gcloud CLI** (automation के लिए recommended)

    [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) से install करें

    Initialize और authenticate करें:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Option B: Cloud Console**

    सभी steps web UI के जरिए [https://console.cloud.google.com](https://console.cloud.google.com) पर किए जा सकते हैं

  </Step>

  <Step title="GCP project बनाएं">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) पर billing सक्षम करें (Compute Engine के लिए required).

    Compute Engine API सक्षम करें:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAM & Admin > Create Project पर जाएं
    2. इसे name दें और create करें
    3. Project के लिए billing सक्षम करें
    4. APIs & Services > Enable APIs पर जाएं > "Compute Engine API" खोजें > Enable

  </Step>

  <Step title="VM बनाएं">
    **Machine types:**

    | Type      | Specs                    | Cost               | Notes                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/mo            | Local Docker builds के लिए सबसे भरोसेमंद        |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/mo            | Docker build के लिए minimum recommended         |
    | e2-micro  | 2 vCPU (shared), 1GB RAM | Free tier eligible | अक्सर Docker build OOM के साथ fail होता है (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Compute Engine > VM instances > Create instance पर जाएं
    2. Name: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Machine type: `e2-small`
    5. Boot disk: Debian 12, 20GB
    6. Create

  </Step>

  <Step title="VM में SSH करें">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engine dashboard में अपने VM के पास "SSH" button पर click करें.

    Note: VM creation के बाद SSH key propagation में 1-2 मिनट लग सकते हैं. अगर connection refused हो, तो प्रतीक्षा करें और retry करें.

  </Step>

  <Step title="Docker install करें (VM पर)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Group change प्रभावी करने के लिए log out और वापस log in करें:

    ```bash
    exit
    ```

    फिर वापस SSH करें:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verify करें:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw repository clone करें">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    यह guide मानती है कि आप binary persistence की guarantee के लिए custom image build करेंगे.

  </Step>

  <Step title="Persistent host directories बनाएं">
    Docker containers ephemeral होते हैं.
    सारी long-lived state host पर रहनी चाहिए.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Environment variables configure करें">
    Repository root में `.env` बनाएं.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    जब आप stable gateway token को `.env` के जरिए manage करना चाहते हैं, तो `OPENCLAW_GATEWAY_TOKEN` set करें; अन्यथा restarts के पार clients पर भरोसा करने से पहले `gateway.auth.token` configure करें. अगर कोई भी source मौजूद नहीं है, तो OpenClaw उस startup के लिए runtime-only token का उपयोग करता है. एक keyring password generate करें और उसे `GOG_KEYRING_PASSWORD` में paste करें:

    ```bash
    openssl rand -hex 32
    ```

    **इस file को commit न करें.**

    यह `.env` file container/runtime env जैसे `OPENCLAW_GATEWAY_TOKEN` के लिए है.
    Stored provider OAuth/API-key auth mounted
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` में रहता है.

  </Step>

  <Step title="Docker Compose configuration">
    `docker-compose.yml` बनाएं या update करें.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` केवल bootstrap सुविधा के लिए है, यह proper gateway configuration का replacement नहीं है. फिर भी अपने deployment के लिए auth (`gateway.auth.token` या password) set करें और safe bind settings का उपयोग करें.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    Common Docker host flow के लिए shared runtime guide का उपयोग करें:

    - [Required binaries को image में bake करें](/hi/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build और launch करें](/hi/install/docker-vm-runtime#build-and-launch)
    - [क्या कहां persist होता है](/hi/install/docker-vm-runtime#what-persists-where)
    - [Updates](/hi/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specific launch notes">
    GCP पर, अगर `pnpm install --frozen-lockfile` के दौरान build `Killed` या `exit code 137` के साथ fail होता है, तो VM में memory कम है. Minimum `e2-small` का उपयोग करें, या ज्यादा reliable first builds के लिए `e2-medium` का उपयोग करें.

    LAN (`OPENCLAW_GATEWAY_BIND=lan`) से bind करते समय, आगे बढ़ने से पहले trusted browser origin configure करें:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    अगर आपने gateway port बदला है, तो `18789` को अपने configured port से बदलें.

  </Step>

  <Step title="अपने laptop से access करें">
    Gateway port forward करने के लिए SSH tunnel बनाएं:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    अपने browser में खोलें:

    `http://127.0.0.1:18789/`

    एक clean dashboard link फिर से print करें:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    अगर UI shared-secret auth के लिए prompt करता है, तो configured token या
    password को Control UI settings में paste करें. यह Docker flow default रूप से token लिखता है; अगर आप container config को password auth पर switch करते हैं, तो इसके बजाय वह password उपयोग करें.

    अगर Control UI `unauthorized` या `disconnected (1008): pairing required` दिखाता है, तो browser device approve करें:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Shared persistence और update reference फिर चाहिए?
    [Docker VM Runtime](/hi/install/docker-vm-runtime#what-persists-where) और [Docker VM Runtime updates](/hi/install/docker-vm-runtime#updates) देखें.

  </Step>
</Steps>

---

## Troubleshooting

**SSH connection refused**

VM creation के बाद SSH key propagation में 1-2 मिनट लग सकते हैं. प्रतीक्षा करें और retry करें.

**OS Login issues**

अपना OS Login profile check करें:

```bash
gcloud compute os-login describe-profile
```

सुनिश्चित करें कि आपके account के पास required IAM permissions (Compute OS Login या Compute OS Admin Login) हैं.

**Out of memory (OOM)**

अगर Docker build `Killed` और `exit code 137` के साथ fail होता है, तो VM OOM-killed हुआ था. e2-small (minimum) या e2-medium (reliable local builds के लिए recommended) पर upgrade करें:

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service accounts (security best practice)

Personal use के लिए, आपका default user account ठीक काम करता है.

Automation या CI/CD pipelines के लिए, न्यूनतम permissions वाला dedicated service account बनाएं:

1. एक service account बनाएं:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin role (या narrower custom role) grant करें:

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Automation के लिए Owner role का उपयोग न करें. Least privilege के principle का उपयोग करें.

IAM role details के लिए [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) देखें.

---

## अगले steps

- मैसेजिंग चैनल सेट करें: [चैनल](/hi/channels)
- स्थानीय डिवाइसों को नोड के रूप में पेयर करें: [नोड](/hi/nodes)
- Gateway कॉन्फ़िगर करें: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install)
- [Azure](/hi/install/azure)
- [VPS होस्टिंग](/hi/vps)
