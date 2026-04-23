---
read_when:
    - 로컬 설치 대신 컨테이너화된 Gateway를 사용하려고 합니다
    - Docker 흐름을 검증하고 있습니다
summary: OpenClaw용 선택적 Docker 기반 설정 및 온보딩
title: Docker
x-i18n:
    generated_at: "2026-04-23T14:04:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (선택 사항)

Docker는 **선택 사항**입니다. 컨테이너화된 Gateway를 사용하거나 Docker 흐름을 검증하려는 경우에만 사용하세요.

## Docker가 나에게 적합한가요?

- **예**: 격리되고 일회성인 Gateway 환경이 필요하거나 로컬 설치 없이 호스트에서 OpenClaw를 실행하려는 경우
- **아니요**: 자신의 머신에서 실행 중이며 가장 빠른 개발 루프만 원할 경우. 대신 일반 설치 흐름을 사용하세요.
- **샌드박싱 참고**: 기본 샌드박스 백엔드는 샌드박싱이 활성화되면 Docker를 사용하지만, 샌드박싱은 기본적으로 꺼져 있으며 전체 Gateway를 Docker에서 실행할 필요는 **없습니다**. SSH 및 OpenShell 샌드박스 백엔드도 사용할 수 있습니다. [Sandboxing](/ko/gateway/sandboxing)을 참조하세요.

## 사전 요구 사항

- Docker Desktop(또는 Docker Engine) + Docker Compose v2
- 이미지 빌드용 최소 2GB RAM (`pnpm install`은 1GB 호스트에서 exit 137로 OOM 종료될 수 있음)
- 이미지와 로그를 저장할 충분한 디스크 공간
- VPS/공개 호스트에서 실행하는 경우
  [네트워크 노출에 대한 보안 강화](/ko/gateway/security),
  특히 Docker `DOCKER-USER` 방화벽 정책을 검토하세요.

## 컨테이너화된 Gateway

<Steps>
  <Step title="이미지 빌드">
    리포지토리 루트에서 설정 스크립트를 실행하세요:

    ```bash
    ./scripts/docker/setup.sh
    ```

    이렇게 하면 Gateway 이미지가 로컬에서 빌드됩니다. 대신 사전 빌드된 이미지를 사용하려면:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    사전 빌드된 이미지는
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)에 게시됩니다.
    일반 태그: `main`, `latest`, `<version>` (예: `2026.2.26`).

  </Step>

  <Step title="온보딩 완료">
    설정 스크립트는 온보딩을 자동으로 실행합니다. 수행 내용:

    - provider API 키 입력 요청
    - Gateway 토큰 생성 후 `.env`에 기록
    - Docker Compose를 통해 Gateway 시작

    설정 중에는 시작 전 온보딩과 config 쓰기가
    `openclaw-gateway`를 통해 직접 실행됩니다. `openclaw-cli`는
    Gateway 컨테이너가 이미 존재한 후 실행하는 명령용입니다.

  </Step>

  <Step title="Control UI 열기">
    브라우저에서 `http://127.0.0.1:18789/`를 열고 설정된
    공유 비밀을 Settings에 붙여넣으세요. 설정 스크립트는 기본적으로 `.env`에 토큰을 기록합니다.
    컨테이너 구성을 비밀번호 인증으로 변경한 경우에는 해당
    비밀번호를 대신 사용하세요.

    URL이 다시 필요하신가요?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="채널 구성(선택 사항)">
    CLI 컨테이너를 사용해 메시징 채널을 추가하세요:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [Telegram](/ko/channels/telegram), [Discord](/ko/channels/discord)

  </Step>
</Steps>

### 수동 흐름

설정 스크립트 대신 각 단계를 직접 실행하려면:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose`는 리포지토리 루트에서 실행하세요. `OPENCLAW_EXTRA_MOUNTS`
또는 `OPENCLAW_HOME_VOLUME`을 활성화한 경우, 설정 스크립트가 `docker-compose.extra.yml`을 작성하므로
`-f docker-compose.yml -f docker-compose.extra.yml`와 함께 포함하세요.
</Note>

<Note>
`openclaw-cli`는 `openclaw-gateway`의 네트워크 네임스페이스를 공유하므로
시작 후 도구입니다. `docker compose up -d openclaw-gateway` 전에
온보딩과 설정 시점 config 쓰기는
`--no-deps --entrypoint node`와 함께 `openclaw-gateway`를 통해 실행하세요.
</Note>

### 환경 변수

설정 스크립트는 다음 선택적 환경 변수를 받습니다:

| Variable                       | 용도                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | 로컬 빌드 대신 원격 이미지 사용                                |
| `OPENCLAW_DOCKER_APT_PACKAGES` | 빌드 중 추가 apt 패키지 설치(공백으로 구분)                    |
| `OPENCLAW_EXTENSIONS`          | 빌드 시 Plugin 의존성 사전 설치(공백으로 구분된 이름)          |
| `OPENCLAW_EXTRA_MOUNTS`        | 추가 호스트 바인드 마운트(쉼표로 구분된 `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | `/home/node`를 이름 있는 Docker 볼륨에 유지                    |
| `OPENCLAW_SANDBOX`             | 샌드박스 부트스트랩 선택 활성화(`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_DOCKER_SOCKET`       | Docker 소켓 경로 재정의                                        |

### 상태 점검

컨테이너 probe 엔드포인트(인증 불필요):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 이미지에는 `/healthz`를 ping하는 내장 `HEALTHCHECK`가 포함되어 있습니다.
검사가 계속 실패하면 Docker는 컨테이너를 `unhealthy`로 표시하고
오케스트레이션 시스템이 이를 재시작하거나 교체할 수 있습니다.

인증된 심층 상태 스냅샷:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh`는 기본적으로 `OPENCLAW_GATEWAY_BIND=lan`을 사용하므로
Docker 포트 게시와 함께 호스트에서 `http://127.0.0.1:18789`에 접근할 수 있습니다.

- `lan`(기본값): 호스트 브라우저와 호스트 CLI가 게시된 Gateway 포트에 접근할 수 있습니다.
- `loopback`: 컨테이너 네트워크 네임스페이스 내부 프로세스만
  Gateway에 직접 접근할 수 있습니다.

<Note>
`0.0.0.0` 또는 `127.0.0.1` 같은 호스트 별칭이 아니라 `gateway.bind`의 바인드 모드 값(`lan` / `loopback` / `custom` /
`tailnet` / `auto`)을 사용하세요.
</Note>

### 저장소 및 영속성

Docker Compose는 `OPENCLAW_CONFIG_DIR`를 `/home/node/.openclaw`에,
`OPENCLAW_WORKSPACE_DIR`를 `/home/node/.openclaw/workspace`에 bind-mount하므로
이 경로들은 컨테이너 교체 후에도 유지됩니다.

마운트된 해당 config 디렉터리는 OpenClaw가 다음을 저장하는 위치입니다:

- 동작 config용 `openclaw.json`
- 저장된 provider OAuth/API 키 인증용 `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` 같은 env 기반 런타임 시크릿용 `.env`

VM 배포의 전체 영속성 세부 사항은
[Docker VM Runtime - What persists where](/ko/install/docker-vm-runtime#what-persists-where)를 참조하세요.

**디스크 증가 핫스팟:** `media/`, 세션 JSONL 파일, `cron/runs/*.jsonl`,
및 `/tmp/openclaw/` 아래의 롤링 파일 로그를 주시하세요.

### 셸 헬퍼(선택 사항)

일상적인 Docker 관리를 더 쉽게 하려면 `ClawDock`를 설치하세요:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이전 `scripts/shell-helpers/clawdock-helpers.sh` 원시 경로에서 ClawDock를 설치했다면, 위 설치 명령을 다시 실행해 로컬 헬퍼 파일이 새 위치를 따르도록 하세요.

그런 다음 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` 등을 사용하세요.
모든 명령은 `clawdock-help`를 실행하면 됩니다.
전체 헬퍼 가이드는 [ClawDock](/ko/install/clawdock)을 참조하세요.

<AccordionGroup>
  <Accordion title="Docker Gateway용 에이전트 샌드박스 활성화">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    사용자 지정 소켓 경로(예: rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    스크립트는 샌드박스 사전 요구 사항이 통과한 후에만 `docker.sock`을 마운트합니다.
    샌드박스 설정을 완료할 수 없으면 스크립트는 `agents.defaults.sandbox.mode`를
    `off`로 재설정합니다.

  </Accordion>

  <Accordion title="자동화 / CI (비대화형)">
    Compose pseudo-TTY 할당을 `-T`로 비활성화하세요:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="공유 네트워크 보안 참고">
    `openclaw-cli`는 `network_mode: "service:openclaw-gateway"`를 사용하므로
    CLI 명령이 `127.0.0.1`을 통해 Gateway에 접근할 수 있습니다. 이를 공유
    신뢰 경계로 취급하세요. compose config는 `openclaw-cli`에서 `NET_RAW`/`NET_ADMIN`을 제거하고
    `no-new-privileges`를 활성화합니다.
  </Accordion>

  <Accordion title="권한 및 EACCES">
    이미지는 `node`(uid 1000) 사용자로 실행됩니다. `/home/node/.openclaw`에서
    권한 오류가 발생하면 호스트 bind mount가 uid 1000 소유인지 확인하세요:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="더 빠른 재빌드">
    Dockerfile에서 의존성 레이어가 캐시되도록 순서를 구성하세요. 이렇게 하면
    lockfile이 바뀌지 않는 한 `pnpm install`을 다시 실행하지 않습니다:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="고급 사용자용 컨테이너 옵션">
    기본 이미지는 보안 우선이며 비루트 `node` 사용자로 실행됩니다. 더
    완전한 기능의 컨테이너를 원한다면:

    1. **`/home/node` 영속화**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **시스템 의존성 포함**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright 브라우저 설치**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **브라우저 다운로드 영속화**: 다음을 설정합니다
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`, 그리고
       `OPENCLAW_HOME_VOLUME` 또는 `OPENCLAW_EXTRA_MOUNTS`를 사용하세요.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (헤드리스 Docker)">
    마법사에서 OpenAI Codex OAuth를 선택하면 브라우저 URL이 열립니다. Docker 또는 헤드리스 설정에서는
    도착한 전체 리디렉션 URL을 복사해
    마법사에 다시 붙여넣어 인증을 완료하세요.
  </Accordion>

  <Accordion title="베이스 이미지 메타데이터">
    기본 Docker 이미지는 `node:24-bookworm`을 사용하며
    `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` 등의 OCI 베이스 이미지 주석을 게시합니다. 자세한 내용은
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)를 참조하세요.
  </Accordion>
</AccordionGroup>

### VPS에서 실행하시나요?

공유 VM 배포 단계(바이너리 포함, 영속성, 업데이트 포함)는
[Hetzner (Docker VPS)](/ko/install/hetzner) 및
[Docker VM Runtime](/ko/install/docker-vm-runtime)을 참조하세요.

## 에이전트 샌드박스

Docker 백엔드와 함께 `agents.defaults.sandbox`가 활성화되면 Gateway는
에이전트 도구 실행(셸, 파일 읽기/쓰기 등)을 격리된 Docker
컨테이너 내부에서 실행하고 Gateway 자체는 호스트에 유지됩니다. 이를 통해
전체 Gateway를 컨테이너화하지 않고도 신뢰할 수 없거나 멀티 테넌트 에이전트 세션 주위에
강한 격리 경계를 만들 수 있습니다.

샌드박스 범위는 에이전트별(기본값), 세션별 또는 공유로 설정할 수 있습니다. 각 범위는
`/workspace`에 마운트되는 자체 워크스페이스를 가집니다. 또한
허용/거부 도구 정책, 네트워크 격리, 리소스 제한, 브라우저
컨테이너도 구성할 수 있습니다.

전체 구성, 이미지, 보안 참고 사항 및 멀티 에이전트 프로필은 다음을 참조하세요:

- [Sandboxing](/ko/gateway/sandboxing) -- 전체 샌드박스 참조
- [OpenShell](/ko/gateway/openshell) -- 샌드박스 컨테이너에 대한 대화형 셸 액세스
- [Multi-Agent Sandbox and Tools](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의

### 빠른 활성화

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

기본 샌드박스 이미지를 빌드합니다:

```bash
scripts/sandbox-setup.sh
```

## 문제 해결

<AccordionGroup>
  <Accordion title="이미지가 없거나 샌드박스 컨테이너가 시작되지 않음">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)로
    샌드박스 이미지를 빌드하거나 `agents.defaults.sandbox.docker.image`를
    사용자 지정 이미지로 설정하세요.
    컨테이너는 필요 시 세션별로 자동 생성됩니다.
  </Accordion>

  <Accordion title="샌드박스에서 권한 오류 발생">
    `docker.user`를 마운트된 워크스페이스 소유권과 일치하는 UID:GID로 설정하거나,
    워크스페이스 폴더의 소유권을 변경하세요.
  </Accordion>

  <Accordion title="샌드박스에서 사용자 지정 도구를 찾을 수 없음">
    OpenClaw는 `sh -lc`(로그인 셸)로 명령을 실행하며, 이 과정에서
    `/etc/profile`을 source하고 PATH를 재설정할 수 있습니다. 사용자 지정
    도구 경로를 앞에 추가하려면 `docker.env.PATH`를 설정하거나, Dockerfile의
    `/etc/profile.d/` 아래에 스크립트를 추가하세요.
  </Accordion>

  <Accordion title="이미지 빌드 중 OOM 종료(exit 137)">
    VM에는 최소 2GB RAM이 필요합니다. 더 큰 머신 클래스를 사용한 뒤 다시 시도하세요.
  </Accordion>

  <Accordion title="Control UI에서 Unauthorized 또는 pairing required 발생">
    새 dashboard 링크를 가져오고 브라우저 디바이스를 승인하세요:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    자세한 내용: [Dashboard](/ko/web/dashboard), [Devices](/ko/cli/devices).

  </Accordion>

  <Accordion title="Gateway 대상에 ws://172.x.x.x가 표시되거나 Docker CLI에서 pairing 오류 발생">
    Gateway 모드와 bind를 재설정하세요:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 관련 문서

- [설치 개요](/ko/install) — 모든 설치 방법
- [Podman](/ko/install/podman) — Docker의 Podman 대안
- [ClawDock](/ko/install/clawdock) — Docker Compose 커뮤니티 설정
- [업데이트](/ko/install/updating) — OpenClaw를 최신 상태로 유지하기
- [구성](/ko/gateway/configuration) — 설치 후 Gateway 구성
