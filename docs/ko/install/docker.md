---
read_when:
    - 로컬 설치 대신 컨테이너화된 Gateway를 사용하려는 경우
    - Docker 흐름을 검증하고 있습니다
summary: OpenClaw를 위한 선택적 Docker 기반 설정 및 온보딩
title: Docker
x-i18n:
    generated_at: "2026-04-30T06:36:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker는 **선택 사항**입니다. 컨테이너화된 Gateway가 필요하거나 Docker 흐름을 검증하려는 경우에만 사용하세요.

## Docker가 나에게 적합한가요?

- **예**: 격리된 일회용 Gateway 환경이 필요하거나 로컬 설치 없이 호스트에서 OpenClaw를 실행하려는 경우입니다.
- **아니요**: 자신의 머신에서 실행 중이고 가장 빠른 개발 루프만 원하는 경우입니다. 대신 일반 설치 흐름을 사용하세요.
- **샌드박싱 참고**: 기본 샌드박스 백엔드는 샌드박싱이 활성화된 경우 Docker를 사용하지만, 샌드박싱은 기본적으로 꺼져 있으며 전체 Gateway를 Docker에서 실행할 필요는 **없습니다**. SSH 및 OpenShell 샌드박스 백엔드도 사용할 수 있습니다. [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.

## 필수 조건

- Docker Desktop(또는 Docker Engine) + Docker Compose v2
- 이미지 빌드용 최소 2 GB RAM(`pnpm install`은 1 GB 호스트에서 종료 코드 137로 OOM 종료될 수 있음)
- 이미지와 로그를 저장할 충분한 디스크 공간
- VPS/공개 호스트에서 실행하는 경우
  [네트워크 노출 보안 강화](/ko/gateway/security),
  특히 Docker `DOCKER-USER` 방화벽 정책을 검토하세요.

## 컨테이너화된 Gateway

<Steps>
  <Step title="이미지 빌드">
    저장소 루트에서 설정 스크립트를 실행하세요.

    ```bash
    ./scripts/docker/setup.sh
    ```

    이 명령은 Gateway 이미지를 로컬에서 빌드합니다. 대신 미리 빌드된 이미지를 사용하려면 다음을 실행하세요.

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    미리 빌드된 이미지는
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)에 게시됩니다.
    일반적인 태그: `main`, `latest`, `<version>`(예: `2026.2.26`).

  </Step>

  <Step title="온보딩 완료">
    설정 스크립트는 온보딩을 자동으로 실행합니다. 수행 작업은 다음과 같습니다.

    - provider API 키 입력 요청
    - Gateway 토큰 생성 및 `.env`에 작성
    - Docker Compose를 통해 Gateway 시작

    설정 중에는 시작 전 온보딩과 구성 쓰기가
    `openclaw-gateway`를 통해 직접 실행됩니다. `openclaw-cli`는
    Gateway 컨테이너가 이미 존재한 뒤 실행하는 명령용입니다.

  </Step>

  <Step title="Control UI 열기">
    브라우저에서 `http://127.0.0.1:18789/`를 열고 구성된
    공유 비밀을 Settings에 붙여넣으세요. 설정 스크립트는 기본적으로 토큰을 `.env`에
    씁니다. 컨테이너 구성을 비밀번호 인증으로 전환한 경우에는 대신 해당
    비밀번호를 사용하세요.

    URL이 다시 필요하신가요?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="채널 구성(선택 사항)">
    CLI 컨테이너를 사용해 메시징 채널을 추가하세요.

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

설정 스크립트를 사용하는 대신 각 단계를 직접 실행하려면 다음을 사용하세요.

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
저장소 루트에서 `docker compose`를 실행하세요. `OPENCLAW_EXTRA_MOUNTS`
또는 `OPENCLAW_HOME_VOLUME`을 활성화한 경우 설정 스크립트가 `docker-compose.extra.yml`을 작성합니다.
`-f docker-compose.yml -f docker-compose.extra.yml`로 이를 포함하세요.
</Note>

<Note>
`openclaw-cli`는 `openclaw-gateway`의 네트워크 네임스페이스를 공유하므로
시작 후 도구입니다. `docker compose up -d openclaw-gateway` 전에
온보딩과 설정 시점의 구성 쓰기를
`--no-deps --entrypoint node`와 함께 `openclaw-gateway`를 통해 실행하세요.
</Note>

### 환경 변수

설정 스크립트는 다음 선택적 환경 변수를 허용합니다.

| 변수                                       | 목적                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 로컬 빌드 대신 원격 이미지 사용                                 |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 빌드 중 추가 apt 패키지 설치(공백으로 구분)                      |
| `OPENCLAW_EXTENSIONS`                      | 빌드 시 Plugin 의존성 미리 설치(공백으로 구분한 이름)            |
| `OPENCLAW_EXTRA_MOUNTS`                    | 추가 호스트 bind mount(쉼표로 구분한 `source:target[:opts]`)     |
| `OPENCLAW_HOME_VOLUME`                     | 이름 있는 Docker 볼륨에 `/home/node` 영구 저장                  |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | 생성된 번들 Plugin 의존성과 미러의 컨테이너 경로                 |
| `OPENCLAW_SANDBOX`                         | 샌드박스 부트스트랩 사용 선택(`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | 대화형 온보딩 단계 건너뛰기(`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker 소켓 경로 재정의                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS 광고 비활성화(Docker의 기본값은 `1`)                |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 번들 Plugin 소스 bind-mount 오버레이 비활성화                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 내보내기용 공유 OTLP/HTTP collector endpoint       |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | trace, metric 또는 log용 신호별 OTLP endpoint                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 프로토콜 재정의. 현재는 `http/protobuf`만 지원됨            |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry 리소스에 사용되는 서비스 이름                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 최신 실험적 GenAI semantic attribute 사용 선택                  |
| `OPENCLAW_OTEL_PRELOADED`                  | 하나가 미리 로드된 경우 두 번째 OpenTelemetry SDK 시작 건너뛰기  |

Maintainer는 Plugin 소스 디렉터리 하나를 패키징된 소스 경로 위에 마운트하여
패키징된 이미지에 대해 번들 Plugin 소스를 테스트할 수 있습니다. 예:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
해당 마운트된 소스 디렉터리는 동일한 Plugin id에 대해 일치하는 컴파일된
`/app/dist/extensions/synology-chat` 번들을 재정의합니다.

### 관측성

OpenTelemetry 내보내기는 Gateway 컨테이너에서 OTLP collector로 나가는 방식입니다.
게시된 Docker 포트가 필요하지 않습니다. 이미지를 로컬에서 빌드하고 번들된
OpenTelemetry exporter를 이미지 안에서 사용할 수 있게 하려면 런타임 의존성을 포함하세요.

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

공식 OpenClaw Docker 릴리스 이미지에는 번들된
`diagnostics-otel` Plugin 소스가 포함됩니다. 이미지와 캐시 상태에 따라
Plugin이 처음 활성화될 때 Gateway가 여전히 Plugin 로컬 OpenTelemetry 런타임 의존성을
스테이징할 수 있으므로, 첫 부팅이 패키지 레지스트리에 도달하도록 허용하거나
릴리스 lane에서 이미지를 미리 워밍하세요. 내보내기를 활성화하려면 구성에서
`diagnostics-otel` Plugin을 허용하고 활성화한 다음
`diagnostics.otel.enabled=true`를 설정하거나
[OpenTelemetry 내보내기](/ko/gateway/opentelemetry)의 구성 예시를 사용하세요. Collector 인증 헤더는
Docker 환경 변수가 아니라 `diagnostics.otel.headers`를 통해 구성됩니다.

Prometheus metric은 이미 게시된 Gateway 포트를 사용합니다.
`diagnostics-prometheus` Plugin을 활성화한 다음 scrape하세요.

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

이 route는 Gateway 인증으로 보호됩니다. 별도의 공개
`/metrics` 포트나 인증되지 않은 reverse-proxy 경로를 노출하지 마세요.
[Prometheus metric](/ko/gateway/prometheus)을 참조하세요.

### 상태 확인

컨테이너 probe endpoint(인증 불필요):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 이미지에는 `/healthz`를 ping하는 기본 제공 `HEALTHCHECK`가 포함되어 있습니다.
확인이 계속 실패하면 Docker는 컨테이너를 `unhealthy`로 표시하고
orchestration 시스템이 이를 다시 시작하거나 교체할 수 있습니다.

인증된 심층 상태 snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN과 loopback

`scripts/docker/setup.sh`는 기본적으로 `OPENCLAW_GATEWAY_BIND=lan`을 사용하므로 Docker 포트 게시를 통해
`http://127.0.0.1:18789`에 대한 호스트 접근이 작동합니다.

- `lan`(기본값): 호스트 브라우저와 호스트 CLI가 게시된 Gateway 포트에 도달할 수 있습니다.
- `loopback`: 컨테이너 네트워크 네임스페이스 안의 프로세스만
  Gateway에 직접 도달할 수 있습니다.

<Note>
`gateway.bind`에는 호스트 별칭인 `0.0.0.0` 또는 `127.0.0.1`가 아니라
bind mode 값(`lan` / `loopback` / `custom` /
`tailnet` / `auto`)을 사용하세요.
</Note>

### 호스트 로컬 provider

OpenClaw가 Docker에서 실행될 때 컨테이너 안의 `127.0.0.1`은 호스트 머신이 아니라
컨테이너 자체입니다. 호스트에서 실행되는 AI provider에는 `host.docker.internal`을 사용하세요.

| Provider  | 호스트 기본 URL        | Docker 설정 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

번들된 Docker 설정은 이러한 호스트 URL을 LM Studio 및 Ollama 온보딩 기본값으로 사용하며,
`docker-compose.yml`은 Linux Docker Engine에서 `host.docker.internal`을
Docker의 호스트 Gateway에 매핑합니다. Docker Desktop은 macOS 및 Windows에서
이미 동일한 호스트 이름을 제공합니다.

호스트 서비스도 Docker에서 도달할 수 있는 주소에서 수신해야 합니다.

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

자체 Compose 파일이나 `docker run` 명령을 사용하는 경우, 예를 들어
`--add-host=host.docker.internal:host-gateway`처럼 동일한 호스트 매핑을 직접 추가하세요.

### Bonjour / mDNS

Docker bridge 네트워킹은 일반적으로 Bonjour/mDNS multicast
(`224.0.0.251:5353`)를 안정적으로 전달하지 않습니다. 따라서 번들된 Compose 설정은
기본적으로 `OPENCLAW_DISABLE_BONJOUR=1`을 사용하여 bridge가 multicast traffic을
버릴 때 Gateway가 crash-loop에 빠지거나 광고를 반복적으로 다시 시작하지 않게 합니다.

Docker 호스트에는 게시된 Gateway URL, Tailscale 또는 광역 DNS-SD를 사용하세요.
host networking, macvlan 또는 mDNS multicast가 작동하는 것으로 알려진 다른 네트워크에서
실행하는 경우에만 `OPENCLAW_DISABLE_BONJOUR=0`을 설정하세요.

주의 사항과 문제 해결은 [Bonjour 검색](/ko/gateway/bonjour)을 참조하세요.

### 스토리지와 영구 저장

Docker Compose는 `OPENCLAW_CONFIG_DIR`을 `/home/node/.openclaw`에,
`OPENCLAW_WORKSPACE_DIR`을 `/home/node/.openclaw/workspace`에 bind-mount하므로
해당 경로는 컨테이너 교체 후에도 유지됩니다. 두 변수 중 하나가 설정되지 않은 경우
번들된 `docker-compose.yml`은 `${HOME}/.openclaw`(workspace mount의 경우
`${HOME}/.openclaw/workspace`)로 대체하고, `HOME` 자체도 없으면 `/tmp/.openclaw`로 대체합니다.
이렇게 하면 bare 환경에서 `docker compose up`이 빈 source volume spec을
출력하지 않습니다.

해당 마운트된 구성 디렉터리는 OpenClaw가 다음 항목을 보관하는 위치입니다.

- 동작 구성을 위한 `openclaw.json`
- 저장된 provider OAuth/API-key 인증을 위한 `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` 같은 env 기반 런타임 비밀을 위한 `.env`

번들된 Plugin 런타임 종속성과 미러링된 런타임 파일은 사용자 구성이 아니라 생성된 상태입니다. Compose는 이를 `/var/lib/openclaw/plugin-runtime-deps`에 마운트된 이름 있는 Docker 볼륨 `openclaw-plugin-runtime-deps`에 저장합니다. 변경이 잦은 이 트리를 호스트 구성 바인드 마운트 밖에 두면 콜드 Gateway 시작 중 느린 Docker Desktop/WSL 파일 작업과 오래된 Windows 핸들을 피할 수 있습니다.

기본 Compose 파일은 `openclaw-gateway`와 `openclaw-cli` 모두에 대해 `OPENCLAW_PLUGIN_STAGE_DIR`을 해당 경로로 설정하므로 `openclaw doctor --fix`, 채널 로그인/설정 명령, Gateway 시작이 모두 동일한 생성 런타임 볼륨을 사용합니다.

VM 배포의 전체 지속성 세부 정보는 [Docker VM 런타임 - 무엇이 어디에 유지되는지](/ko/install/docker-vm-runtime#what-persists-where)를 참조하세요.

**디스크 증가 핫스팟:** `media/`, 세션 JSONL 파일, `cron/runs/*.jsonl`, `openclaw-plugin-runtime-deps` Docker 볼륨, `/tmp/openclaw/` 아래의 순환 파일 로그를 주시하세요.

### 셸 도우미(선택 사항)

일상적인 Docker 관리를 더 쉽게 하려면 `ClawDock`을 설치하세요.

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이전 `scripts/shell-helpers/clawdock-helpers.sh` 원시 경로에서 ClawDock을 설치했다면, 로컬 도우미 파일이 새 위치를 따라가도록 위 설치 명령을 다시 실행하세요.

그런 다음 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` 등을 사용하세요. 모든 명령은 `clawdock-help`를 실행해 확인하세요.
전체 도우미 가이드는 [ClawDock](/ko/install/clawdock)을 참조하세요.

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

    스크립트는 샌드박스 전제 조건을 통과한 후에만 `docker.sock`을 마운트합니다. 샌드박스 설정을 완료할 수 없으면 스크립트가 `agents.defaults.sandbox.mode`를 `off`로 재설정합니다.

  </Accordion>

  <Accordion title="자동화 / CI(비대화형)">
    `-T`로 Compose 의사 TTY 할당을 비활성화합니다.

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="공유 네트워크 보안 참고">
    `openclaw-cli`는 CLI 명령이 `127.0.0.1`을 통해 Gateway에 도달할 수 있도록 `network_mode: "service:openclaw-gateway"`를 사용합니다. 이를 공유 신뢰 경계로 취급하세요. compose 구성은 `openclaw-cli`에서 `NET_RAW`/`NET_ADMIN`을 제거하고 `no-new-privileges`를 활성화합니다.
  </Accordion>

  <Accordion title="권한 및 EACCES">
    이미지는 `node`(uid 1000)로 실행됩니다. `/home/node/.openclaw`에서 권한 오류가 표시되면 호스트 바인드 마운트가 uid 1000 소유인지 확인하세요.

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="더 빠른 재빌드">
    종속성 레이어가 캐시되도록 Dockerfile 순서를 구성하세요. 이렇게 하면 lockfile이 변경되지 않는 한 `pnpm install`을 다시 실행하지 않습니다.

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

  <Accordion title="고급 사용자 컨테이너 옵션">
    기본 이미지는 보안을 우선하며 non-root `node`로 실행됩니다. 더 많은 기능을 갖춘 컨테이너를 원한다면:

    1. **`/home/node` 유지**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **시스템 종속성 베이크**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright 브라우저 설치**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **브라우저 다운로드 유지**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`를 설정하고 `OPENCLAW_HOME_VOLUME` 또는 `OPENCLAW_EXTRA_MOUNTS`를 사용하세요.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth(헤드리스 Docker)">
    마법사에서 OpenAI Codex OAuth를 선택하면 브라우저 URL이 열립니다. Docker 또는 헤드리스 설정에서는 도착한 전체 리디렉션 URL을 복사해 마법사에 다시 붙여 넣어 인증을 완료하세요.
  </Accordion>

  <Accordion title="기본 이미지 메타데이터">
    기본 Docker 런타임 이미지는 `node:24-bookworm-slim`을 사용하며 `org.opencontainers.image.base.name`, `org.opencontainers.image.source` 등을 포함한 OCI 기본 이미지 주석을 게시합니다. Node 기본 다이제스트는 Dependabot Docker 기본 이미지 PR을 통해 갱신되며, 릴리스 빌드는 배포판 업그레이드 레이어를 실행하지 않습니다. [OCI 이미지 주석](https://github.com/opencontainers/image-spec/blob/main/annotations.md)을 참조하세요.
  </Accordion>
</AccordionGroup>

### VPS에서 실행하시나요?

바이너리 베이크, 지속성, 업데이트를 포함한 공유 VM 배포 단계는 [Hetzner(Docker VPS)](/ko/install/hetzner) 및 [Docker VM 런타임](/ko/install/docker-vm-runtime)을 참조하세요.

## 에이전트 샌드박스

Docker 백엔드로 `agents.defaults.sandbox`를 활성화하면, Gateway 자체는 호스트에 유지하면서 Gateway가 에이전트 도구 실행(셸, 파일 읽기/쓰기 등)을 격리된 Docker 컨테이너 안에서 실행합니다. 이를 통해 전체 Gateway를 컨테이너화하지 않고도 신뢰할 수 없거나 멀티 테넌트 에이전트 세션 주변에 강한 장벽을 둘 수 있습니다.

샌드박스 범위는 에이전트별(기본값), 세션별 또는 공유로 설정할 수 있습니다. 각 범위는 `/workspace`에 마운트된 자체 워크스페이스를 가집니다. 허용/거부 도구 정책, 네트워크 격리, 리소스 제한, 브라우저 컨테이너도 구성할 수 있습니다.

전체 구성, 이미지, 보안 참고 사항, 멀티 에이전트 프로필은 다음을 참조하세요.

- [샌드박싱](/ko/gateway/sandboxing) -- 전체 샌드박스 참조
- [OpenShell](/ko/gateway/openshell) -- 샌드박스 컨테이너에 대한 대화형 셸 액세스
- [멀티 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의

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

기본 샌드박스 이미지를 빌드합니다.

```bash
scripts/sandbox-setup.sh
```

## 문제 해결

<AccordionGroup>
  <Accordion title="이미지가 없거나 샌드박스 컨테이너가 시작되지 않음">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)로 샌드박스 이미지를 빌드하거나 `agents.defaults.sandbox.docker.image`를 사용자 지정 이미지로 설정하세요. 컨테이너는 필요할 때 세션별로 자동 생성됩니다.
  </Accordion>

  <Accordion title="샌드박스의 권한 오류">
    `docker.user`를 마운트된 워크스페이스 소유권과 일치하는 UID:GID로 설정하거나 워크스페이스 폴더의 소유자를 변경하세요.
  </Accordion>

  <Accordion title="샌드박스에서 사용자 지정 도구를 찾을 수 없음">
    OpenClaw는 `/etc/profile`을 소싱하고 PATH를 재설정할 수 있는 `sh -lc`(로그인 셸)로 명령을 실행합니다. 사용자 지정 도구 경로를 앞에 추가하도록 `docker.env.PATH`를 설정하거나 Dockerfile의 `/etc/profile.d/` 아래에 스크립트를 추가하세요.
  </Accordion>

  <Accordion title="이미지 빌드 중 OOM으로 종료됨(exit 137)">
    VM에는 최소 2GB RAM이 필요합니다. 더 큰 머신 클래스를 사용한 뒤 다시 시도하세요.
  </Accordion>

  <Accordion title="Control UI에서 권한 없음 또는 페어링 필요">
    새 대시보드 링크를 가져오고 브라우저 기기를 승인하세요.

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    자세한 내용: [대시보드](/ko/web/dashboard), [기기](/ko/cli/devices).

  </Accordion>

  <Accordion title="Gateway 대상이 ws://172.x.x.x로 표시되거나 Docker CLI에서 페어링 오류 발생">
    Gateway 모드와 바인드를 재설정하세요.

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 관련 항목

- [설치 개요](/ko/install) — 모든 설치 방법
- [Podman](/ko/install/podman) — Docker의 Podman 대안
- [ClawDock](/ko/install/clawdock) — Docker Compose 커뮤니티 설정
- [업데이트](/ko/install/updating) — OpenClaw를 최신 상태로 유지하기
- [구성](/ko/gateway/configuration) — 설치 후 Gateway 구성
