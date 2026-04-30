---
read_when:
    - OpenClaw를 노트북이 아닌 클라우드 VPS에서 24/7 실행하려는 경우
    - 자체 VPS에서 프로덕션급 상시 실행 Gateway를 원합니다
    - 영속성, 바이너리, 재시작 동작을 완전히 제어하려는 경우
    - Hetzner 또는 유사한 제공업체에서 Docker로 OpenClaw를 실행하고 있습니다
summary: 저렴한 Hetzner VPS(Docker)에서 영속 상태와 내장 바이너리로 OpenClaw Gateway를 24시간 연중무휴 실행
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T06:37:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# Hetzner에서 OpenClaw 실행하기(Docker, 프로덕션 VPS 가이드)

## 목표

Docker를 사용해 Hetzner VPS에서 지속 실행되는 OpenClaw Gateway를 durable 상태, 내장 바이너리, 안전한 재시작 동작과 함께 실행합니다.

“약 $5로 OpenClaw를 24/7 실행”하고 싶다면, 이것이 가장 단순하고 신뢰할 수 있는 설정입니다.
Hetzner 가격은 변경될 수 있습니다. 가장 작은 Debian/Ubuntu VPS를 선택하고 OOM이 발생하면 확장하세요.

보안 모델 알림:

- 회사 공유 에이전트는 모두가 같은 신뢰 경계 안에 있고 런타임이 업무 전용일 때는 괜찮습니다.
- 엄격히 분리하세요: 전용 VPS/런타임 + 전용 계정. 해당 호스트에 개인 Apple/Google/브라우저/비밀번호 관리자 프로필을 두지 마세요.
- 사용자가 서로에게 적대적일 수 있다면 Gateway/호스트/OS 사용자 단위로 분리하세요.

[보안](/ko/gateway/security) 및 [VPS 호스팅](/ko/vps)을 참조하세요.

## 무엇을 하나요(간단히)?

- 작은 Linux 서버(Hetzner VPS)를 임대합니다
- Docker(격리된 앱 런타임)를 설치합니다
- Docker에서 OpenClaw Gateway를 시작합니다
- 호스트에 `~/.openclaw` + `~/.openclaw/workspace`를 유지합니다(재시작/재빌드 후에도 유지)
- 노트북에서 SSH 터널을 통해 제어 UI에 접근합니다

마운트된 `~/.openclaw` 상태에는 `openclaw.json`, 에이전트별
`agents/<agentId>/agent/auth-profiles.json`, 그리고 `.env`가 포함됩니다.

Gateway에는 다음 방식으로 접근할 수 있습니다:

- 노트북에서 SSH 포트 포워딩
- 방화벽과 토큰을 직접 관리하는 경우 직접 포트 노출

이 가이드는 Hetzner의 Ubuntu 또는 Debian을 기준으로 합니다.  
다른 Linux VPS를 사용한다면 패키지를 그에 맞게 대응시키세요.
일반 Docker 흐름은 [Docker](/ko/install/docker)를 참조하세요.

---

## 빠른 경로(숙련된 운영자용)

1. Hetzner VPS 프로비저닝
2. Docker 설치
3. OpenClaw 저장소 클론
4. 지속 호스트 디렉터리 생성
5. `.env` 및 `docker-compose.yml` 구성
6. 필요한 바이너리를 이미지에 포함
7. `docker compose up -d`
8. 지속성 및 Gateway 접근 확인

---

## 필요한 것

- root 접근 권한이 있는 Hetzner VPS
- 노트북에서의 SSH 접근
- SSH + 복사/붙여넣기에 대한 기본적인 익숙함
- 약 20분
- Docker 및 Docker Compose
- 모델 인증 자격 증명
- 선택적 제공자 자격 증명
  - WhatsApp QR
  - Telegram 봇 토큰
  - Gmail OAuth

---

<Steps>
  <Step title="VPS 프로비저닝">
    Hetzner에서 Ubuntu 또는 Debian VPS를 생성합니다.

    root로 연결합니다:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    이 가이드는 VPS가 상태를 유지한다고 가정합니다.
    일회용 인프라로 취급하지 마세요.

  </Step>

  <Step title="Docker 설치(VPS에서)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    확인합니다:

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

  <Step title="지속 호스트 디렉터리 생성">
    Docker 컨테이너는 일시적입니다.
    장기 유지 상태는 모두 호스트에 있어야 합니다.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
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

    명시적으로 `.env`를 통해 관리하려는 경우가 아니라면 `OPENCLAW_GATEWAY_TOKEN`은 비워 두세요. OpenClaw는 첫 시작 시 무작위 Gateway 토큰을 config에 씁니다. 키링 비밀번호를 생성하고
    `GOG_KEYRING_PASSWORD`에 붙여넣으세요:

    ```bash
    openssl rand -hex 32
    ```

    **이 파일을 커밋하지 마세요.**

    이 `.env` 파일은 `OPENCLAW_GATEWAY_TOKEN` 같은 컨테이너/런타임 환경용입니다.
    저장된 제공자 OAuth/API 키 인증은 마운트된
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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
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

    `--allow-unconfigured`는 부트스트랩 편의를 위한 것일 뿐, 올바른 Gateway 구성을 대체하지 않습니다. 배포 환경에 맞게 여전히 인증(`gateway.auth.token` 또는 비밀번호)을 설정하고 안전한 바인드 설정을 사용하세요.

  </Step>

  <Step title="공유 Docker VM 런타임 단계">
    공통 Docker 호스트 흐름은 공유 런타임 가이드를 사용하세요:

    - [필요한 바이너리를 이미지에 포함](/ko/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [빌드 및 실행](/ko/install/docker-vm-runtime#build-and-launch)
    - [무엇이 어디에 유지되는지](/ko/install/docker-vm-runtime#what-persists-where)
    - [업데이트](/ko/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 전용 접근">
    공유 빌드 및 실행 단계를 마친 뒤, 터널을 열기 위해 다음 설정을 완료합니다:

    **전제 조건:** VPS sshd config가 TCP 포워딩을 허용하는지 확인하세요. SSH config를 강화했다면 `/etc/ssh/sshd_config`를 확인하고 다음을 설정하세요:

    ```
    AllowTcpForwarding local
    ```

    `local`은 서버에서의 원격 포워딩은 차단하면서 노트북에서 `ssh -L` 로컬 포워딩을 허용합니다. 이를 `no`로 설정하면 터널이 다음 오류로 실패합니다:
    `channel 3: open failed: administratively prohibited: open failed`

    TCP 포워딩이 활성화되었음을 확인한 뒤 SSH 서비스를 재시작하고
    (`systemctl restart ssh`) 노트북에서 터널을 실행합니다:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    엽니다:

    `http://127.0.0.1:18789/`

    구성된 공유 비밀 값을 붙여넣으세요. 이 가이드는 기본적으로 Gateway 토큰을 사용합니다. 비밀번호 인증으로 전환했다면 대신 해당 비밀번호를 사용하세요.

  </Step>
</Steps>

공유 지속성 맵은 [Docker VM 런타임](/ko/install/docker-vm-runtime#what-persists-where)에 있습니다.

## 코드형 인프라(Terraform)

코드형 인프라 워크플로를 선호하는 팀을 위해, 커뮤니티에서 유지 관리하는 Terraform 설정은 다음을 제공합니다:

- 원격 상태 관리가 포함된 모듈식 Terraform 구성
- cloud-init을 통한 자동 프로비저닝
- 배포 스크립트(부트스트랩, 배포, 백업/복원)
- 보안 강화(방화벽, UFW, SSH 전용 접근)
- Gateway 접근을 위한 SSH 터널 구성

**저장소:**

- 인프라: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker config: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

이 접근 방식은 재현 가능한 배포, 버전 관리되는 인프라, 자동화된 재해 복구로 위의 Docker 설정을 보완합니다.

<Note>
커뮤니티에서 유지 관리합니다. 이슈나 기여는 위 저장소 링크를 참조하세요.
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
