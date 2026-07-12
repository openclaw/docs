---
read_when:
    - 노트북이 아닌 클라우드 VPS에서 OpenClaw를 연중무휴 24시간 실행하려는 경우
    - 자체 VPS에서 프로덕션급 상시 가동 Gateway를 운영하려는 경우
    - 지속성, 바이너리 및 재시작 동작을 완전히 제어하려는 경우
    - Hetzner 또는 유사한 제공업체의 Docker에서 OpenClaw를 실행하고 있습니다.
summary: 저렴한 Hetzner VPS(Docker)에서 영구 상태와 내장 바이너리를 사용하여 OpenClaw Gateway를 연중무휴로 실행하기
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T15:23:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Docker를 사용하여 Hetzner VPS에서 영구 OpenClaw Gateway를 실행하고, 상태를 지속적으로 보존하며, 필요한 바이너리를 이미지에 내장하고, 안전한 재시작 동작을 구성합니다.

Hetzner 요금은 변경될 수 있습니다. 요구 사항을 충족하는 가장 작은 Debian/Ubuntu VPS를 선택하고 OOM이 발생하면 사양을 높이십시오.

노트북에서 SSH 포트 포워딩을 통해 Gateway에 액세스할 수 있습니다. 방화벽과 토큰을 직접 관리하는 경우 포트를 직접 노출할 수도 있습니다.

보안 모델 유의 사항:

- 모든 사용자가 동일한 신뢰 경계에 있고 런타임을 업무용으로만 사용하는 경우 회사에서 에이전트를 공유해도 괜찮습니다.
- 전용 VPS/런타임과 전용 계정을 사용하여 엄격하게 분리하십시오. 해당 호스트에서 개인 Apple/Google/브라우저/비밀번호 관리자 프로필을 사용하지 마십시오.
- 사용자들이 서로 적대적일 수 있는 경우 Gateway, 호스트 또는 OS 사용자별로 분리하십시오.

[보안](/ko/gateway/security) 및 [VPS 호스팅](/ko/vps)을 참조하십시오.

이 가이드에서는 Hetzner에서 Ubuntu 또는 Debian을 사용한다고 가정합니다. 다른 Linux VPS에서는 해당 환경에 맞는 패키지를 사용하십시오. 일반적인 Docker 절차는 [Docker](/ko/install/docker)를 참조하십시오.

## 필요한 항목

- 루트 액세스 권한이 있는 Hetzner VPS
- 노트북에서의 SSH 액세스
- Docker 및 Docker Compose
- 모델 인증 자격 증명
- 선택적 제공자 자격 증명(WhatsApp QR, Telegram 봇 토큰, Gmail OAuth)
- 약 20분

## 빠른 경로

1. Hetzner VPS 프로비저닝
2. Docker 설치
3. OpenClaw 저장소 복제
4. 영구 호스트 디렉터리 생성
5. `.env` 및 `docker-compose.yml` 구성
6. 필요한 바이너리를 이미지에 내장
7. `docker compose up -d`
8. 지속성 및 Gateway 액세스 확인

<Steps>
  <Step title="VPS 프로비저닝">
    Hetzner에서 Ubuntu 또는 Debian VPS를 생성한 후 루트로 연결합니다.

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    VPS를 폐기 가능한 인프라가 아닌 상태 유지형 인프라로 취급하십시오.

  </Step>

  <Step title="Docker 설치(VPS에서)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    확인합니다.

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

    이 가이드에서는 이미지에 내장한 바이너리가 재시작 후에도 유지되도록 사용자 지정 이미지를 빌드합니다.

  </Step>

  <Step title="영구 호스트 디렉터리 생성">
    Docker 컨테이너는 일시적이므로 장기간 유지해야 하는 모든 상태는 호스트에 저장해야 합니다.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # 소유권을 컨테이너 사용자(uid 1000)로 설정합니다.
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="환경 변수 구성">
    저장소 루트에 `.env`를 생성합니다.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    재시작 후에도 안정적으로 유지되는 Gateway 토큰을 `.env`를 통해 관리하려면
    `OPENCLAW_GATEWAY_TOKEN`을 설정하십시오. 그렇지 않으면 재시작 후 클라이언트를
    사용하기 전에 `gateway.auth.token`을 구성하십시오. 둘 다 설정하지 않으면
    OpenClaw는 해당 시작 과정에서만 유효한 런타임 전용 토큰을 사용합니다.
    `GOG_KEYRING_PASSWORD`의 키링 비밀번호를 생성합니다.

    ```bash
    openssl rand -hex 32
    ```

    **이 파일을 커밋하지 마십시오.** 이 파일에는 `OPENCLAW_GATEWAY_TOKEN`과 같은
    컨테이너/런타임 환경 변수가 포함됩니다. 저장된 제공자 OAuth/API 키 인증 정보는
    마운트된 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 있습니다.

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
          # 권장: VPS에서 Gateway가 루프백만 사용하도록 유지하고 SSH 터널을 통해 액세스합니다.
          # 공개적으로 노출하려면 `127.0.0.1:` 접두사를 제거하고 방화벽을 적절히 구성합니다.
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

    `--allow-unconfigured`는 부트스트랩 편의를 위한 옵션일 뿐, 실제 Gateway 구성을 대체하지 않습니다. 배포 환경에 맞게 인증(`gateway.auth.token` 또는 비밀번호)과 안전한 바인딩 모드를 반드시 설정하십시오.

  </Step>

  <Step title="공유 Docker VM 런타임 단계">
    일반적인 Docker 호스트 절차는 공유 런타임 가이드를 따르십시오.

    - [필요한 바이너리를 이미지에 내장](/ko/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [빌드 및 실행](/ko/install/docker-vm-runtime#build-and-launch)
    - [항목별 지속성 저장 위치](/ko/install/docker-vm-runtime#what-persists-where)
    - [업데이트](/ko/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 전용 액세스">
    공유 빌드 및 실행 단계를 완료한 후 터널을 엽니다.

    **사전 요구 사항:** VPS의 sshd 구성이 TCP 포워딩을 허용하는지 확인하십시오. SSH
    구성을 강화한 경우 `/etc/ssh/sshd_config`를 확인하고 다음과 같이 설정하십시오.

    ```text
    AllowTcpForwarding local
    ```

    `local`은 서버에서의 원격 포워딩을 차단하면서 노트북의 `ssh -L` 로컬 포워딩을
    허용합니다. 이를 `no`로 설정하면 다음 오류와 함께 터널 연결에 실패합니다.
    `channel 3: open failed: administratively prohibited: open failed`

    TCP 포워딩이 활성화된 것을 확인한 후 SSH 서비스를 다시 시작하고
    (`systemctl restart ssh`) 노트북에서 터널을 실행합니다.

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    `http://127.0.0.1:18789/`을 열고 구성된 공유 비밀을 붙여 넣으십시오.
    이 가이드에서는 기본적으로 Gateway 토큰을 사용합니다. 비밀번호 인증으로
    전환한 경우에는 대신 구성한 비밀번호를 사용하십시오.

  </Step>
</Steps>

공유 지속성 매핑은 [Docker VM 런타임](/ko/install/docker-vm-runtime#what-persists-where)에 있습니다.

## 코드형 인프라(Terraform)

코드형 인프라 워크플로를 선호하는 팀을 위해 커뮤니티에서 유지 관리하는 Terraform 설정은 다음을 제공합니다.

- 원격 상태 관리 기능이 포함된 모듈식 Terraform 구성
- cloud-init을 통한 자동 프로비저닝
- 배포 스크립트(부트스트랩, 배포, 백업/복원)
- 보안 강화(방화벽, UFW, SSH 전용 액세스)
- Gateway 액세스를 위한 SSH 터널 구성

**저장소:**

- 인프라: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 구성: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

이 접근 방식은 재현 가능한 배포, 버전 관리되는 인프라 및 자동 재해 복구를 추가하여 위의 Docker 설정을 보완합니다.

<Note>
커뮤니티에서 유지 관리합니다. 문제를 보고하거나 기여하려면 위의 저장소 링크를 참조하십시오.
</Note>

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- Gateway 구성: [Gateway 구성](/ko/gateway/configuration)
- OpenClaw 최신 상태 유지: [업데이트](/ko/install/updating)

## 관련 항목

- [설치 개요](/ko/install)
- [Fly.io](/ko/install/fly)
- [Docker](/ko/install/docker)
- [VPS 호스팅](/ko/vps)
