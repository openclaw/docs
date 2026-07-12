---
read_when:
    - GCP에서 OpenClaw를 연중무휴로 실행하려는 경우
    - 자체 VM에서 프로덕션급 상시 가동 Gateway를 운영하려는 경우
    - 지속성, 바이너리 및 재시작 동작을 완전히 제어하려는 경우
summary: GCP Compute Engine VM(Docker)에서 영구 상태를 유지하며 OpenClaw Gateway를 연중무휴로 실행하기
title: GCP
x-i18n:
    generated_at: "2026-07-12T00:54:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

내구성 있는 상태, 이미지에 내장된 바이너리, 안전한 재시작 동작을 갖춘 영구 OpenClaw Gateway를 Docker를 사용하여 GCP Compute Engine VM에서 실행합니다.

가격은 머신 유형과 리전에 따라 다릅니다. 워크로드에 적합한 가장 작은 VM을 선택하고 OOM이 발생하면 확장하세요.

노트북에서 SSH 포트 포워딩을 통해 Gateway에 액세스할 수 있으며, 방화벽과 토큰을 직접 관리하는 경우 포트를 직접 노출할 수도 있습니다.

이 가이드에서는 GCP Compute Engine의 Debian을 사용합니다. Ubuntu도 사용할 수 있으며, 패키지는 그에 맞게 대응시키세요. 일반적인 Docker 절차는 [Docker](/ko/install/docker)를 참조하세요.

## 필요한 항목

- GCP 계정(`e2-micro`는 무료 등급 대상)
- `gcloud` CLI 또는 [Cloud Console](https://console.cloud.google.com)
- 노트북에서의 SSH 액세스
- Docker 및 Docker Compose
- 모델 인증 자격 증명
- 선택적 공급자 자격 증명(WhatsApp QR, Telegram 봇 토큰, Gmail OAuth)
- 약 20~30분

## 빠른 경로

1. GCP 프로젝트를 생성하고 결제 및 Compute Engine API 활성화
2. Compute Engine VM 생성(`e2-small`, Debian 12, 20GB)
3. VM에 SSH로 접속하여 Docker 설치
4. OpenClaw 저장소 복제
5. 영구 호스트 디렉터리 생성
6. `.env` 및 `docker-compose.yml` 구성
7. 필요한 바이너리를 이미지에 내장하고 빌드한 후 실행

<Steps>
  <Step title="gcloud CLI 설치(또는 Console 사용)">
    [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)에서 설치한 후 다음을 실행합니다.

    ```bash
    gcloud init
    gcloud auth login
    ```

    또는 아래의 모든 단계를 [Cloud Console](https://console.cloud.google.com) 웹 UI에서 수행하세요.

  </Step>

  <Step title="GCP 프로젝트 생성">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    [console.cloud.google.com/billing](https://console.cloud.google.com/billing)에서 결제를 활성화합니다(Compute Engine에 필요).

    Console에서 동일한 작업: IAM & Admin > Create Project에서 프로젝트를 만들고 결제를 활성화한 다음, APIs & Services > Enable APIs > "Compute Engine API" > Enable을 선택합니다.

  </Step>

  <Step title="VM 생성">
    | 유형      | 사양                     | 비용             | 참고                                           |
    | --------- | ------------------------ | ---------------- | ---------------------------------------------- |
    | e2-medium | vCPU 2개, RAM 4GB        | 월 약 $25        | 로컬 Docker 빌드에 가장 안정적                 |
    | e2-small  | vCPU 2개, RAM 2GB        | 월 약 $12        | Docker 빌드에 권장되는 최소 사양               |
    | e2-micro  | vCPU 2개(공유), RAM 1GB  | 무료 등급 대상   | Docker 빌드 OOM으로 자주 실패함(종료 코드 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="VM에 SSH로 접속">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: Compute Engine 대시보드에서 VM 옆의 "SSH"를 클릭합니다.

    VM 생성 후 SSH 키가 전파되는 데 1~2분이 걸릴 수 있습니다. 연결이 거부되면 기다린 후 다시 시도하세요.

  </Step>

  <Step title="Docker 설치(VM에서)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    그룹 변경 사항을 적용하려면 로그아웃한 후 다시 로그인하고, SSH로 다시 접속합니다.

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    확인:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw 저장소 복제">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    이 가이드에서는 이미지에 내장한 모든 바이너리가 재시작 후에도 유지되도록 사용자 지정 이미지를 빌드합니다.

  </Step>

  <Step title="영구 호스트 디렉터리 생성">
    Docker 컨테이너는 일시적이므로 수명이 긴 모든 상태는 호스트에 저장해야 합니다.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="환경 변수 구성">
    저장소 루트에 `.env`를 생성합니다.

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

    재시작 후에도 안정적으로 유지되는 Gateway 토큰을 `.env`를 통해 관리하려면
    `OPENCLAW_GATEWAY_TOKEN`을 설정하세요. 그렇지 않으면 재시작 후에도 클라이언트를
    사용하기 전에 `gateway.auth.token`을 구성하세요. 둘 다 설정되지 않은 경우
    OpenClaw는 해당 시작 과정에서만 유효한 런타임 전용 토큰을 사용합니다.
    `GOG_KEYRING_PASSWORD`에 사용할 키링 비밀번호를 생성합니다.

    ```bash
    openssl rand -hex 32
    ```

    **이 파일을 커밋하지 마세요.** 이 파일에는
    `OPENCLAW_GATEWAY_TOKEN`과 같은 컨테이너/런타임 환경 변수가 포함됩니다.
    저장된 공급자 OAuth/API 키 인증 정보는 마운트된
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 있습니다.

  </Step>

  <Step title="Docker Compose 구성">
    `docker-compose.yml`을 생성하거나 업데이트합니다.

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
          # 권장: VM에서 Gateway가 루프백으로만 수신하도록 유지하고 SSH 터널을 통해 액세스하세요.
          # 공개적으로 노출하려면 `127.0.0.1:` 접두사를 제거하고 그에 맞게 방화벽을 구성하세요.
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

    `--allow-unconfigured`는 부트스트랩 편의를 위한 옵션일 뿐, 실제 Gateway 구성을 대체하지 않습니다. 배포 환경에 맞게 인증(`gateway.auth.token` 또는 비밀번호)과 안전한 바인딩 모드를 반드시 설정하세요.

  </Step>

  <Step title="공통 Docker VM 런타임 단계">
    일반적인 Docker 호스트 절차는 공통 런타임 가이드를 따르세요.

    - [필요한 바이너리를 이미지에 내장](/ko/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [빌드 및 실행](/ko/install/docker-vm-runtime#build-and-launch)
    - [항목별 영구 저장 위치](/ko/install/docker-vm-runtime#what-persists-where)
    - [업데이트](/ko/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 관련 실행 참고 사항">
    `pnpm install --frozen-lockfile` 실행 중 빌드가 `Killed` 또는 `exit code 137`로 실패하면 VM의 메모리가 부족한 것입니다. 최소한 `e2-small`을 사용하거나, 첫 빌드를 더 안정적으로 수행하려면 `e2-medium`을 사용하세요.

    LAN에 바인딩하는 경우(`OPENCLAW_GATEWAY_BIND=lan`), 계속하기 전에 신뢰할 수 있는 브라우저 출처를 구성하세요.

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    포트를 변경했다면 `18789`를 구성한 포트로 바꾸세요.

  </Step>

  <Step title="노트북에서 액세스">
    Gateway 포트를 포워딩할 SSH 터널을 생성합니다.

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    브라우저에서 `http://127.0.0.1:18789/`를 엽니다.

    깔끔한 대시보드 링크를 다시 출력합니다.

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI에서 공유 비밀 인증을 요구하면 구성한 토큰 또는 비밀번호를 Control UI
    설정에 붙여 넣으세요. 이 Docker 절차는 기본적으로 토큰을 기록하지만,
    비밀번호 인증으로 전환했다면 대신 구성한 비밀번호를 사용하세요.

    Control UI에 `unauthorized` 또는 `disconnected (1008): pairing required`가 표시되면 브라우저 장치를 승인하세요.

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    공통 영구 저장 위치 구성은 [Docker VM 런타임](/ko/install/docker-vm-runtime#what-persists-where)을, [업데이트 절차](/ko/install/docker-vm-runtime#updates)는 해당 링크를 참조하세요.

  </Step>
</Steps>

## 문제 해결

**SSH 연결 거부**

VM 생성 후 SSH 키가 전파되는 데 1~2분이 걸릴 수 있습니다. 기다린 후 다시 시도하세요.

**OS Login 문제**

OS Login 프로필을 확인합니다.

```bash
gcloud compute os-login describe-profile
```

계정에 필요한 IAM 권한(Compute OS Login 또는 Compute OS Admin Login)이 있는지 확인하세요.

**메모리 부족(OOM)**

Docker 빌드가 `Killed` 및 `exit code 137`로 실패하면 VM이 OOM으로 종료된 것입니다.

```bash
# 먼저 VM 중지
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# 머신 유형 변경
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM 시작
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## 서비스 계정(보안 모범 사례)

개인 용도라면 기본 사용자 계정으로 충분합니다. 자동화 또는 CI/CD에는 최소한의 권한만 가진 전용 서비스 계정을 생성하세요.

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

자동화에는 Owner 역할을 사용하지 말고, 작동하는 가장 제한적인 역할을 사용하세요. [역할 이해하기](https://cloud.google.com/iam/docs/understanding-roles)를 참조하세요.

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- 로컬 장치를 노드로 페어링: [노드](/ko/nodes)
- Gateway 구성: [Gateway 구성](/ko/gateway/configuration)

## 관련 문서

- [설치 개요](/ko/install)
- [Azure](/ko/install/azure)
- [VPS 호스팅](/ko/vps)
