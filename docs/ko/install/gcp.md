---
read_when:
    - GCP에서 OpenClaw를 24/7 실행하려는 경우
    - 자체 VM에서 프로덕션급 상시 가동 Gateway를 원합니다
    - 지속성, 바이너리, 재시작 동작을 완전히 제어하려는 경우
summary: 지속성 있는 상태로 GCP Compute Engine VM(Docker)에서 OpenClaw Gateway를 24/7 실행하기
title: GCP
x-i18n:
    generated_at: "2026-05-06T06:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

Docker를 사용해 GCP Compute Engine VM에서 지속 실행되는 OpenClaw Gateway를 실행합니다. 영구 상태, 내장된 바이너리, 안전한 재시작 동작을 포함합니다.

"월 약 $5-12로 OpenClaw를 24/7 실행"하고 싶다면, Google Cloud에서 신뢰할 수 있는 설정입니다.
가격은 머신 유형과 리전에 따라 달라집니다. 워크로드에 맞는 가장 작은 VM을 선택하고, OOM이 발생하면 확장하세요.

## 무엇을 하나요(간단히)?

- GCP 프로젝트를 만들고 결제를 사용 설정합니다
- Compute Engine VM을 만듭니다
- Docker를 설치합니다(격리된 앱 런타임)
- Docker에서 OpenClaw Gateway를 시작합니다
- 호스트에 `~/.openclaw` + `~/.openclaw/workspace`를 영구 저장합니다(재시작/재빌드 후에도 유지)
- SSH 터널을 통해 노트북에서 Control UI에 액세스합니다

마운트된 `~/.openclaw` 상태에는 `openclaw.json`, 에이전트별
`agents/<agentId>/agent/auth-profiles.json`, `.env`가 포함됩니다.

Gateway에는 다음 방식으로 액세스할 수 있습니다.

- 노트북에서 SSH 포트 포워딩
- 방화벽과 토큰을 직접 관리하는 경우 포트를 직접 노출

이 가이드는 GCP Compute Engine의 Debian을 사용합니다.
Ubuntu도 작동합니다. 패키지를 그에 맞게 매핑하세요.
일반 Docker 흐름은 [Docker](/ko/install/docker)를 참조하세요.

---

## 빠른 경로(숙련된 운영자)

1. GCP 프로젝트 생성 + Compute Engine API 사용 설정
2. Compute Engine VM 생성(e2-small, Debian 12, 20GB)
3. VM에 SSH로 접속
4. Docker 설치
5. OpenClaw 저장소 클론
6. 영구 호스트 디렉터리 생성
7. `.env` 및 `docker-compose.yml` 구성
8. 필요한 바이너리를 내장하고 빌드한 뒤 실행

---

## 필요한 것

- GCP 계정(e2-micro 무료 등급 사용 가능)
- gcloud CLI 설치됨(또는 Cloud Console 사용)
- 노트북에서 SSH 액세스
- SSH + 복사/붙여넣기에 대한 기본적인 익숙함
- 약 20-30분
- Docker 및 Docker Compose
- 모델 인증 자격 증명
- 선택적 제공자 자격 증명
  - WhatsApp QR
  - Telegram 봇 토큰
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI 설치(또는 Console 사용)">
    **옵션 A: gcloud CLI**(자동화에 권장)

    [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)에서 설치하세요.

    초기화하고 인증합니다.

    ```bash
    gcloud init
    gcloud auth login
    ```

    **옵션 B: Cloud Console**

    모든 단계는 [https://console.cloud.google.com](https://console.cloud.google.com)의 웹 UI를 통해 수행할 수 있습니다.

  </Step>

  <Step title="GCP 프로젝트 만들기">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)에서 결제를 사용 설정하세요(Compute Engine에 필요).

    Compute Engine API를 사용 설정합니다.

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAM & Admin > Create Project로 이동합니다
    2. 이름을 지정하고 생성합니다
    3. 프로젝트의 결제를 사용 설정합니다
    4. APIs & Services > Enable APIs로 이동 > "Compute Engine API" 검색 > 사용 설정

  </Step>

  <Step title="VM 만들기">
    **머신 유형:**

    | 유형      | 사양                    | 비용               | 참고                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | 월 약 $25          | 로컬 Docker 빌드에 가장 안정적        |
    | e2-small  | 2 vCPU, 2GB RAM          | 월 약 $12          | Docker 빌드에 권장되는 최소 사양         |
    | e2-micro  | 2 vCPU(공유), 1GB RAM | 무료 등급 사용 가능 | Docker 빌드 OOM으로 실패하는 경우가 많음(exit 137) |

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

    1. Compute Engine > VM instances > Create instance로 이동합니다
    2. 이름: `openclaw-gateway`
    3. 리전: `us-central1`, 존: `us-central1-a`
    4. 머신 유형: `e2-small`
    5. 부팅 디스크: Debian 12, 20GB
    6. 생성합니다

  </Step>

  <Step title="VM에 SSH로 접속">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engine 대시보드에서 VM 옆의 "SSH" 버튼을 클릭합니다.

    참고: VM 생성 후 SSH 키 전파에는 1-2분이 걸릴 수 있습니다. 연결이 거부되면 기다렸다가 다시 시도하세요.

  </Step>

  <Step title="Docker 설치(VM에서)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    그룹 변경 사항을 적용하려면 로그아웃했다가 다시 로그인합니다.

    ```bash
    exit
    ```

    그런 다음 다시 SSH로 접속합니다.

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    확인합니다.

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw 저장소 클론">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    이 가이드는 바이너리 지속성을 보장하기 위해 사용자 지정 이미지를 빌드한다고 가정합니다.

  </Step>

  <Step title="영구 호스트 디렉터리 만들기">
    Docker 컨테이너는 일시적입니다.
    오래 유지되어야 하는 모든 상태는 호스트에 있어야 합니다.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="환경 변수 구성">
    저장소 루트에 `.env`를 만듭니다.

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

    `.env`를 통해 명시적으로 관리하려는 경우가 아니라면 `OPENCLAW_GATEWAY_TOKEN`은 비워 두세요. OpenClaw는 첫 시작 시 무작위 Gateway 토큰을 구성에 기록합니다. 키링 비밀번호를 생성하고
    `GOG_KEYRING_PASSWORD`에 붙여넣으세요.

    ```bash
    openssl rand -hex 32
    ```

    **이 파일을 커밋하지 마세요.**

    이 `.env` 파일은 `OPENCLAW_GATEWAY_TOKEN` 같은 컨테이너/런타임 환경을 위한 것입니다.
    저장된 제공자 OAuth/API 키 인증은 마운트된
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 있습니다.

  </Step>

  <Step title="Docker Compose 구성">
    `docker-compose.yml`을 만들거나 업데이트합니다.

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

    `--allow-unconfigured`는 부트스트랩 편의를 위한 것일 뿐이며, 적절한 Gateway 구성을 대체하지 않습니다. 배포에 맞게 인증(`gateway.auth.token` 또는 비밀번호)을 설정하고 안전한 바인드 설정을 사용하세요.

  </Step>

  <Step title="공유 Docker VM 런타임 단계">
    일반적인 Docker 호스트 흐름에는 공유 런타임 가이드를 사용하세요.

    - [필요한 바이너리를 이미지에 내장](/ko/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [빌드 및 실행](/ko/install/docker-vm-runtime#build-and-launch)
    - [무엇이 어디에 유지되는지](/ko/install/docker-vm-runtime#what-persists-where)
    - [업데이트](/ko/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP별 실행 참고 사항">
    GCP에서 `pnpm install --frozen-lockfile` 중 빌드가 `Killed` 또는 `exit code 137`로 실패하면 VM의 메모리가 부족한 것입니다. 최소 `e2-small`을 사용하거나, 더 안정적인 첫 빌드를 위해 `e2-medium`을 사용하세요.

    LAN에 바인딩할 때(`OPENCLAW_GATEWAY_BIND=lan`) 계속하기 전에 신뢰할 수 있는 브라우저 출처를 구성하세요.

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Gateway 포트를 변경했다면 `18789`를 구성한 포트로 바꾸세요.

  </Step>

  <Step title="노트북에서 액세스">
    Gateway 포트를 전달하도록 SSH 터널을 만듭니다.

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    브라우저에서 엽니다.

    `http://127.0.0.1:18789/`

    깔끔한 대시보드 링크를 다시 출력합니다.

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI에서 공유 시크릿 인증을 요구하면 구성된 토큰 또는 비밀번호를 Control UI 설정에 붙여넣으세요. 이 Docker 흐름은 기본적으로 토큰을 기록합니다. 컨테이너 구성을 비밀번호 인증으로 전환했다면 대신 해당 비밀번호를 사용하세요.

    Control UI에 `unauthorized` 또는 `disconnected (1008): pairing required`가 표시되면 브라우저 기기를 승인하세요.

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    공유 지속성과 업데이트 참조가 다시 필요한가요?
    [Docker VM Runtime](/ko/install/docker-vm-runtime#what-persists-where) 및 [Docker VM Runtime 업데이트](/ko/install/docker-vm-runtime#updates)를 참조하세요.

  </Step>
</Steps>

---

## 문제 해결

**SSH 연결이 거부됨**

VM 생성 후 SSH 키 전파에는 1-2분이 걸릴 수 있습니다. 기다렸다가 다시 시도하세요.

**OS Login 문제**

OS Login 프로필을 확인하세요.

```bash
gcloud compute os-login describe-profile
```

계정에 필요한 IAM 권한(Compute OS Login 또는 Compute OS Admin Login)이 있는지 확인하세요.

**메모리 부족(OOM)**

Docker 빌드가 `Killed` 및 `exit code 137`로 실패하면 VM이 OOM으로 종료된 것입니다. e2-small(최소) 또는 e2-medium(안정적인 로컬 빌드에 권장)으로 업그레이드하세요.

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

## 서비스 계정(보안 모범 사례)

개인 사용의 경우 기본 사용자 계정으로 충분합니다.

자동화 또는 CI/CD 파이프라인의 경우 최소 권한을 가진 전용 서비스 계정을 만드세요.

1. 서비스 계정을 만듭니다.

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin 역할(또는 더 좁은 사용자 지정 역할)을 부여합니다.

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

자동화에는 Owner 역할을 사용하지 마세요. 최소 권한 원칙을 사용하세요.

IAM 역할 세부 정보는 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)를 참조하세요.

---

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- 로컬 디바이스를 노드로 페어링: [노드](/ko/nodes)
- Gateway 구성: [Gateway 구성](/ko/gateway/configuration)

## 관련 항목

- [설치 개요](/ko/install)
- [Azure](/ko/install/azure)
- [VPS 호스팅](/ko/vps)
