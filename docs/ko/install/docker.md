---
read_when:
    - 로컬 설치 대신 컨테이너화된 Gateway를 원합니다
    - Docker 흐름을 검증하고 있습니다
summary: OpenClaw를 위한 선택적 Docker 기반 설정 및 온보딩
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:36:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker는 **선택 사항**입니다. 컨테이너화된 Gateway를 원하거나 Docker 흐름을 검증하려는 경우에만 사용하세요.

## Docker가 나에게 적합한가요?

- **예**: 격리된 일회용 Gateway 환경을 원하거나 로컬 설치 없이 호스트에서 OpenClaw를 실행하려는 경우입니다.
- **아니요**: 자체 머신에서 실행 중이고 가장 빠른 개발 루프만 원하는 경우입니다. 대신 일반 설치 흐름을 사용하세요.
- **샌드박싱 참고**: 기본 샌드박스 백엔드는 샌드박싱이 활성화된 경우 Docker를 사용하지만, 샌드박싱은 기본적으로 꺼져 있으며 전체 Gateway를 Docker에서 실행할 필요가 **없습니다**. SSH 및 OpenShell 샌드박스 백엔드도 사용할 수 있습니다. [샌드박싱](/ko/gateway/sandboxing)을 참고하세요.

## 사전 요구 사항

- Docker Desktop(또는 Docker Engine) + Docker Compose v2
- 이미지 빌드를 위한 최소 2GB RAM(`pnpm install`은 1GB 호스트에서 종료 코드 137로 OOM 종료될 수 있음)
- 이미지와 로그를 위한 충분한 디스크 공간
- VPS/공개 호스트에서 실행하는 경우, 특히 Docker `DOCKER-USER` 방화벽 정책을 포함해
  [네트워크 노출을 위한 보안 강화](/ko/gateway/security)를 검토하세요.

## 컨테이너화된 Gateway

<Steps>
  <Step title="Build the image">
    저장소 루트에서 설정 스크립트를 실행하세요.

    ```bash
    ./scripts/docker/setup.sh
    ```

    이렇게 하면 Gateway 이미지가 로컬에서 빌드됩니다. 대신 미리 빌드된 이미지를 사용하려면 다음을 실행하세요.

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    미리 빌드된 이미지는
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)에 게시됩니다.
    일반적인 태그: `main`, `latest`, `<version>`(예: `2026.2.26`).

  </Step>

  <Step title="Airgapped rerun">
    오프라인 호스트에서는 먼저 이미지를 전송하고 로드하세요.

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline`은 `OPENCLAW_IMAGE`가 이미 로컬에 있는지 확인하고, 암시적 Compose pull 및 빌드를 비활성화한 다음,
    `.env` 동기화, 권한 수정, 온보딩, Gateway 구성 동기화,
    Compose 시작과 같은 일반 설정 흐름을 실행합니다.

    `OPENCLAW_SANDBOX=1`인 경우, 오프라인 설정은
    `OPENCLAW_DOCKER_SOCKET` 뒤의 데몬에서 구성된 기본 샌드박스 이미지와
    활성 에이전트별 샌드박스 이미지도 확인합니다. Docker 기반 브라우저 이미지는
    현재 OpenClaw 브라우저 계약 레이블도 포함해야 합니다. 필요한 이미지가 없거나
    호환되지 않으면, 설정은 사용할 수 없는 샌드박스로 성공을 보고하는 대신
    샌드박스 구성을 변경하지 않고 종료됩니다.

  </Step>

  <Step title="Complete onboarding">
    설정 스크립트는 온보딩을 자동으로 실행합니다. 다음 작업을 수행합니다.

    - 제공자 API 키 입력 요청
    - Gateway 토큰 생성 및 `.env`에 기록
    - 인증 프로필 비밀 키 디렉터리 생성
    - Docker Compose를 통해 Gateway 시작

    설정 중에는 시작 전 온보딩과 구성 쓰기가
    `openclaw-gateway`를 통해 직접 실행됩니다. `openclaw-cli`는
    Gateway 컨테이너가 이미 존재한 뒤 실행하는 명령을 위한 것입니다.

  </Step>

  <Step title="Open the Control UI">
    브라우저에서 `http://127.0.0.1:18789/`를 열고 구성된
    공유 비밀을 Settings에 붙여 넣으세요. 설정 스크립트는 기본적으로 `.env`에 토큰을 씁니다.
    컨테이너 구성을 비밀번호 인증으로 전환한 경우 대신 해당 비밀번호를 사용하세요.

    URL이 다시 필요한가요?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
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
또는 `OPENCLAW_HOME_VOLUME`을 활성화한 경우 설정 스크립트는 `docker-compose.extra.yml`을 씁니다.
표준 오버라이드 파일 뒤에 포함하세요. 예를 들어 두 오버라이드 파일이 모두 있는 경우
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`를 사용합니다.
</Note>

<Note>
`openclaw-cli`는 `openclaw-gateway`의 네트워크 네임스페이스를 공유하므로
시작 후 도구입니다. `docker compose up -d openclaw-gateway` 전에
온보딩과 설정 시점 구성 쓰기는 `--no-deps --entrypoint node`와 함께
`openclaw-gateway`를 통해 실행하세요.
</Note>

### 환경 변수

설정 스크립트는 다음 선택적 환경 변수를 받습니다.

| 변수                                       | 목적                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 로컬에서 빌드하는 대신 원격 이미지 사용                               |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | 빌드 중 추가 apt 패키지 설치(공백으로 구분)                           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | 빌드 중 추가 Python 패키지 설치(공백으로 구분)                        |
| `OPENCLAW_EXTENSIONS`                      | 빌드 시 Plugin 의존성 사전 설치(공백으로 구분된 이름)                 |
| `OPENCLAW_EXTRA_MOUNTS`                    | 추가 호스트 바인드 마운트(쉼표로 구분된 `source:target[:opts]`)       |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node`를 명명된 Docker 볼륨에 유지                              |
| `OPENCLAW_SANDBOX`                         | 샌드박스 부트스트랩에 옵트인(`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                 | 대화형 온보딩 단계 건너뛰기(`1`, `true`, `yes`, `on`)                 |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker 소켓 경로 재정의                                               |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS 광고 비활성화(Docker의 기본값은 `1`)                     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 번들 Plugin 소스 바인드 마운트 오버레이 비활성화                      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 내보내기를 위한 공유 OTLP/HTTP 수집기 엔드포인트       |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 추적, 메트릭 또는 로그용 신호별 OTLP 엔드포인트                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 프로토콜 재정의. 현재는 `http/protobuf`만 지원                   |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry 리소스에 사용되는 서비스 이름                           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 최신 실험적 GenAI 의미론적 속성에 옵트인                              |
| `OPENCLAW_OTEL_PRELOADED`                  | 이미 사전 로드된 경우 두 번째 OpenTelemetry SDK 시작 건너뛰기          |

공식 Docker 이미지에는 Homebrew가 포함되어 있지 않습니다. 온보딩 중 OpenClaw는
`brew`가 없는 Linux 컨테이너에서 실행 중일 때 brew 전용 skill 의존성 설치 프로그램을
숨깁니다. 이러한 의존성은 사용자 지정 이미지로 제공하거나 수동으로 설치해야 합니다.
Debian 패키지에서 제공되는 의존성의 경우 이미지 빌드 중
`OPENCLAW_IMAGE_APT_PACKAGES`를 사용하세요. 레거시
`OPENCLAW_DOCKER_APT_PACKAGES` 이름도 계속 허용됩니다.
Python 의존성의 경우 `OPENCLAW_IMAGE_PIP_PACKAGES`를 사용하세요. 이는
이미지 빌드 중 `python3 -m pip install --break-system-packages`를 실행하므로,
패키지 버전을 고정하고 신뢰하는 패키지 인덱스만 사용하세요.

관리자는 예를 들어
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`처럼
Plugin 소스 디렉터리 하나를 패키지된 소스 경로 위에 마운트하여
패키지된 이미지에 대해 번들 Plugin 소스를 테스트할 수 있습니다.
해당 마운트된 소스 디렉터리는 같은 Plugin ID에 대해 일치하는 컴파일된
`/app/dist/extensions/synology-chat` 번들을 재정의합니다.

### 관측 가능성

OpenTelemetry 내보내기는 Gateway 컨테이너에서 OTLP 수집기로 나가는 방향입니다.
게시된 Docker 포트가 필요하지 않습니다. 이미지를 로컬에서 빌드하고
번들 OpenTelemetry 내보내기를 이미지 내부에서 사용할 수 있게 하려면
런타임 의존성을 포함하세요.

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

패키지된 Docker 설치에서 내보내기를 활성화하기 전에 ClawHub에서
공식 `@openclaw/diagnostics-otel` Plugin을 설치하세요. 사용자 지정 소스 빌드 이미지는
`OPENCLAW_EXTENSIONS=diagnostics-otel`로 로컬 Plugin 소스를 계속 포함할 수 있습니다.
내보내기를 활성화하려면 구성에서 `diagnostics-otel` Plugin을 허용하고 활성화한 다음,
`diagnostics.otel.enabled=true`를 설정하거나 [OpenTelemetry
내보내기](/ko/gateway/opentelemetry)의 구성 예제를 사용하세요. 수집기 인증 헤더는
Docker 환경 변수가 아니라 `diagnostics.otel.headers`를 통해 구성됩니다.

Prometheus 메트릭은 이미 게시된 Gateway 포트를 사용합니다.
`clawhub:@openclaw/diagnostics-prometheus`를 설치하고,
`diagnostics-prometheus` Plugin을 활성화한 다음 수집하세요.

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

이 경로는 Gateway 인증으로 보호됩니다. 별도의 공개
`/metrics` 포트나 인증되지 않은 리버스 프록시 경로를 노출하지 마세요.
[Prometheus 메트릭](/ko/gateway/prometheus)을 참고하세요.

### 상태 확인

컨테이너 프로브 엔드포인트(인증 필요 없음):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 이미지에는 `/healthz`를 ping하는 내장 `HEALTHCHECK`가 포함되어 있습니다.
확인이 계속 실패하면 Docker는 컨테이너를 `unhealthy`로 표시하며
오케스트레이션 시스템은 이를 다시 시작하거나 교체할 수 있습니다.

인증된 심층 상태 스냅샷:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 대 loopback

`scripts/docker/setup.sh`는 Docker 포트 게시를 통해
`http://127.0.0.1:18789`에 대한 호스트 접근이 동작하도록
기본값을 `OPENCLAW_GATEWAY_BIND=lan`으로 설정합니다.

- `lan`(기본값): 호스트 브라우저와 호스트 CLI가 게시된 Gateway 포트에 접근할 수 있습니다.
- `loopback`: 컨테이너 네트워크 네임스페이스 내부의 프로세스만
  Gateway에 직접 접근할 수 있습니다.

<Note>
`gateway.bind`에서는 `0.0.0.0` 또는 `127.0.0.1` 같은 호스트 별칭이 아니라
바인드 모드 값(`lan` / `loopback` / `custom` /
`tailnet` / `auto`)을 사용하세요.
</Note>

### 호스트 로컬 제공자

OpenClaw가 Docker에서 실행될 때 컨테이너 내부의 `127.0.0.1`은 호스트 머신이 아니라
컨테이너 자체입니다. 호스트에서 실행되는 AI 제공자에는 `host.docker.internal`을 사용하세요.

| 제공자    | 호스트 기본 URL          | Docker 설정 URL                   |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

번들 Docker 설정은 해당 호스트 URL을 LM Studio 및 Ollama
온보딩 기본값으로 사용하며, `docker-compose.yml`은 Linux Docker Engine에서
`host.docker.internal`을 Docker의 호스트 Gateway에 매핑합니다. Docker Desktop은
macOS와 Windows에서 이미 같은 호스트 이름을 제공합니다.

호스트 서비스도 Docker에서 도달할 수 있는 주소에서 수신해야 합니다.

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

자체 Compose 파일이나 `docker run` 명령을 사용하는 경우, 예를 들어
`--add-host=host.docker.internal:host-gateway`처럼 동일한 호스트
매핑을 직접 추가하세요.

### Docker의 Claude CLI 백엔드

공식 OpenClaw Docker 이미지는 Claude Code를 사전 설치하지 않습니다. OpenClaw를
실행하는 컨테이너 사용자 안에서 Claude Code를 설치하고 로그인한 다음, 이미지
업그레이드가 바이너리나 Claude 인증 상태를 지우지 않도록 해당 컨테이너 홈을
영속화하세요.

새 Docker 설치의 경우, 설정을 실행하기 전에 영속적인 `/home/node` 볼륨을
활성화하세요.

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

기존 Docker 설치의 경우, 먼저 스택을 중지하고 설정을 다시 실행하기 전에 현재
Docker `.env` 값을 다시 로드하세요. 설정 스크립트는 자체적으로 `.env`를 읽지
않으며, 현재 셸과 기본값을 기준으로 `.env`를 다시 작성합니다. 생성된 `.env`의
경우 다음을 실행하세요.

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env`에 셸에서 source할 수 없는 값이 포함되어 있다면, 먼저 의존하는 기존 값을
수동으로 다시 export하세요. 예를 들면 `OPENCLAW_IMAGE`, 포트, 바인드 모드,
사용자 지정 경로, `OPENCLAW_EXTRA_MOUNTS`, 샌드박스, 온보딩 건너뛰기 설정 등이
있습니다. 생성된 오버레이는 `openclaw-gateway`와 `openclaw-cli` 모두에 홈
볼륨을 마운트합니다.

두 서비스 모두 영속화된 홈을 마운트하도록 생성된 Compose 오버레이와 함께 나머지
명령을 실행하세요. 설정에서 `docker-compose.override.yml`도 사용하는 경우,
`docker-compose.extra.yml`보다 먼저 포함하세요.

해당 영속화된 홈에 Claude Code를 설치하세요.

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

네이티브 설치 관리자는 `claude` 바이너리를
`/home/node/.local/bin/claude` 아래에 작성합니다. OpenClaw가 해당 컨테이너
경로를 사용하도록 지정하세요.

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

동일한 영속화된 컨테이너 홈 안에서 로그인하고 확인하세요.

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

그 후에는 번들로 제공되는 `claude-cli` 백엔드를 사용할 수 있습니다.

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME`은 `/home/node/.local/bin` 및
`/home/node/.local/share/claude` 아래의 네이티브 Claude Code 설치와
`/home/node/.claude` 및 `/home/node/.claude.json` 아래의 Claude Code 설정과
인증 상태를 영속화합니다. Claude CLI를 재사용하려면 `/home/node/.openclaw`만
영속화하는 것으로는 충분하지 않습니다. 홈 볼륨 대신 `OPENCLAW_EXTRA_MOUNTS`를
사용하는 경우, 해당 Claude 경로를 모두 두 Docker 서비스에 마운트하세요.

<Note>
공유 프로덕션 자동화나 예측 가능한 Anthropic 청구를 위해서는 Anthropic API 키
경로를 선호하세요. Claude CLI 재사용은 Claude Code의 설치된 버전, 계정 로그인,
청구, 업데이트 동작을 따릅니다.
</Note>

### Bonjour / mDNS

Docker 브리지 네트워킹은 일반적으로 Bonjour/mDNS 멀티캐스트
(`224.0.0.251:5353`)를 안정적으로 전달하지 않습니다. 따라서 번들 Compose
설정은 기본적으로 `OPENCLAW_DISABLE_BONJOUR=1`을 사용하여, 브리지가 멀티캐스트
트래픽을 드롭할 때 Gateway가 충돌 루프에 빠지거나 광고를 반복적으로 다시
시작하지 않도록 합니다.

Docker 호스트에는 게시된 Gateway URL, Tailscale 또는 광역 DNS-SD를 사용하세요.
호스트 네트워킹, macvlan 또는 mDNS 멀티캐스트가 작동하는 것으로 알려진 다른
네트워크에서 실행하는 경우에만 `OPENCLAW_DISABLE_BONJOUR=0`을 설정하세요.

주의 사항과 문제 해결은 [Bonjour 검색](/ko/gateway/bonjour)을 참조하세요.

### 스토리지 및 영속성

Docker Compose는 `OPENCLAW_CONFIG_DIR`을 `/home/node/.openclaw`에,
`OPENCLAW_WORKSPACE_DIR`을 `/home/node/.openclaw/workspace`에,
`OPENCLAW_AUTH_PROFILE_SECRET_DIR`을 `/home/node/.config/openclaw`에 바인드
마운트하므로, 해당 경로는 컨테이너 교체 후에도 유지됩니다. 변수가 설정되지
않은 경우, 번들 `docker-compose.yml`은 `${HOME}` 아래로 폴백하며, `HOME` 자체도
없는 경우 `/tmp`로 폴백합니다. 이렇게 하면 기본 환경에서 `docker compose up`이
빈 소스 볼륨 사양을 내보내지 않습니다.

해당 마운트된 구성 디렉터리는 OpenClaw가 다음을 보관하는 위치입니다.

- 동작 구성을 위한 `openclaw.json`
- 저장된 공급자 OAuth/API 키 인증을 위한 `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` 같은 env 기반 런타임 비밀을 위한 `.env`

인증 프로필 비밀 키 디렉터리는 OAuth 기반 인증 프로필 토큰 자료에 사용되는
로컬 암호화 키를 저장합니다. Docker 호스트 상태와 함께 보관하되,
`OPENCLAW_CONFIG_DIR`과는 분리하세요.

다운로드 가능한 설치된 Plugin은 마운트된 OpenClaw 홈 아래에 패키지 상태를
저장하므로, Plugin 설치 기록과 패키지 루트는 컨테이너 교체 후에도 유지됩니다.
Gateway 시작은 번들 Plugin 종속성 트리를 생성하지 않습니다.

VM 배포의 전체 영속성 세부 정보는
[Docker VM 런타임 - 무엇이 어디에 유지되는가](/ko/install/docker-vm-runtime#what-persists-where)를
참조하세요.

  **디스크 증가 주요 지점:** `/tmp/openclaw/` 아래의 `media/`, 세션 JSONL 파일, 공유 SQLite 상태 데이터베이스, 설치된 Plugin 패키지 루트, 롤링 파일 로그를 주시하세요.

  ### 셸 도우미(선택 사항)

  일상적인 Docker 관리를 더 쉽게 하려면 `ClawDock`을 설치하세요.

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  이전 `scripts/shell-helpers/clawdock-helpers.sh` 원시 경로에서 ClawDock을 설치했다면, 위 설치 명령을 다시 실행하여 로컬 도우미 파일이 새 위치를 따르도록 하세요.

  그런 다음 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` 등을 사용하세요. 모든 명령은 `clawdock-help`를 실행해 확인하세요.
  전체 도우미 가이드는 [ClawDock](/ko/install/clawdock)을 참고하세요.

  <AccordionGroup>
  <Accordion title="Docker Gateway용 에이전트 샌드박스 활성화">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    사용자 지정 소켓 경로(예: 루트리스 Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    이 스크립트는 샌드박스 전제 조건을 통과한 후에만 `docker.sock`을 마운트합니다. 샌드박스 설정을 완료할 수 없으면 스크립트가 `agents.defaults.sandbox.mode`를 `off`로 재설정합니다. OpenClaw 샌드박스가 활성화된 동안에도 Codex 코드 모드 턴은 Codex `workspace-write`로 계속 제한됩니다. 호스트 Docker 소켓을 에이전트 샌드박스 컨테이너에 마운트하지 마세요.

  </Accordion>

  <Accordion title="자동화 / CI(비대화형)">
    `-T`로 Compose 의사 TTY 할당을 비활성화하세요.

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="공유 네트워크 보안 참고 사항">
    `openclaw-cli`는 CLI 명령이 `127.0.0.1`을 통해 Gateway에 도달할 수 있도록 `network_mode: "service:openclaw-gateway"`를 사용합니다. 이를 공유 신뢰 경계로 취급하세요. Compose 구성은 `NET_RAW`/`NET_ADMIN`을 제거하고 `openclaw-gateway`와 `openclaw-cli` 모두에서 `no-new-privileges`를 활성화합니다.
  </Accordion>

  <Accordion title="openclaw-cli에서 Docker Desktop DNS 실패">
    일부 Docker Desktop 설정에서는 `NET_RAW`가 제거된 후 공유 네트워크 `openclaw-cli` 사이드카에서 DNS 조회가 실패하며, 이는 `openclaw plugins install` 같은 npm 기반 명령 중 `EAI_AGAIN`으로 나타납니다. 일반 Gateway 작업에는 기본 강화 Compose 파일을 유지하세요. 아래 로컬 오버라이드는 Docker의 기본 capabilities를 복원하여 CLI 컨테이너의 보안 태세를 완화하므로, 기본 Compose 호출로 사용하지 말고 패키지 레지스트리 접근이 필요한 일회성 CLI 명령에만 사용하세요.

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    이미 장기 실행 `openclaw-cli` 컨테이너를 만들었다면 동일한 오버라이드로 다시 생성하세요. `docker compose exec`와 `docker exec`는 이미 생성된 컨테이너의 Linux capabilities를 변경할 수 없습니다.

  </Accordion>

  <Accordion title="권한 및 EACCES">
    이미지는 `node`(uid 1000)로 실행됩니다. `/home/node/.openclaw`에서 권한 오류가 표시되면 호스트 바인드 마운트의 소유자가 uid 1000인지 확인하세요.

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    동일한 불일치는 `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`에 이어 `plugin present but blocked` 같은 Plugin 경고로 나타날 수 있습니다. 이는 프로세스 uid와 마운트된 Plugin 디렉터리 소유자가 일치하지 않는다는 뜻입니다. 컨테이너는 기본 uid 1000으로 실행하고 바인드 마운트 소유권을 수정하는 것을 권장합니다. OpenClaw를 장기적으로 root로 실행하려는 경우에만 `/path/to/openclaw-config/npm`을 `root:root`로 chown하세요.

  </Accordion>

  <Accordion title="더 빠른 재빌드">
    의존성 레이어가 캐시되도록 Dockerfile 순서를 구성하세요. 이렇게 하면 lockfile이 변경되지 않는 한 `pnpm install`을 다시 실행하지 않아도 됩니다.

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
    기본 이미지는 보안을 우선하며 non-root `node`로 실행됩니다. 더 많은 기능을 갖춘 컨테이너를 원한다면:

    1. **`/home/node` 유지**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **시스템 deps bake**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python deps bake**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium bake**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **또는 Playwright 브라우저를 영구 볼륨에 설치**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **브라우저 다운로드 유지**: `OPENCLAW_HOME_VOLUME` 또는 `OPENCLAW_EXTRA_MOUNTS`를 사용하세요. OpenClaw는 Linux에서 Docker 이미지의 Playwright 관리 Chromium을 자동 감지합니다.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth(헤드리스 Docker)">
    마법사에서 OpenAI Codex OAuth를 선택하면 브라우저 URL이 열립니다. Docker 또는 헤드리스 설정에서는 도착한 전체 리디렉션 URL을 복사해 마법사에 다시 붙여 넣어 인증을 완료하세요.
  </Accordion>

  <Accordion title="기본 이미지 메타데이터">
    기본 Docker 런타임 이미지는 `node:24-bookworm-slim`을 사용하며, 오래 실행되는 컨테이너에서 좀비 프로세스가 회수되고 신호가 올바르게 처리되도록 엔트리포인트 init 프로세스(PID 1)로 `tini`를 포함합니다. `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` 등을 포함한 OCI 기본 이미지 어노테이션을 게시합니다. Node 기본 다이제스트는
    Dependabot Docker 기본 이미지 PR을 통해 갱신됩니다. 릴리스 빌드는
    배포판 업그레이드 레이어를 실행하지 않습니다. 다음을 참고하세요:
    [OCI 이미지 어노테이션](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS에서 실행하나요?

바이너리 베이킹, 영속성, 업데이트를 포함한 공유 VM 배포 단계는
[Hetzner (Docker VPS)](/ko/install/hetzner) 및
[Docker VM 런타임](/ko/install/docker-vm-runtime)을 참고하세요.

## 에이전트 샌드박스

Docker 백엔드와 함께 `agents.defaults.sandbox`가 활성화되면 Gateway는
에이전트 도구 실행(셸, 파일 읽기/쓰기 등)을 격리된 Docker 컨테이너 안에서
실행하고, Gateway 자체는 호스트에 유지됩니다. 이렇게 하면 전체 Gateway를
컨테이너화하지 않고도 신뢰할 수 없거나 멀티 테넌트인 에이전트 세션 주위에
강한 격리 경계를 둘 수 있습니다.

샌드박스 범위는 에이전트별(기본값), 세션별 또는 공유로 설정할 수 있습니다.
각 범위에는 `/workspace`에 마운트된 자체 워크스페이스가 할당됩니다. 또한
도구 허용/거부 정책, 네트워크 격리, 리소스 제한, 브라우저 컨테이너도
구성할 수 있습니다.

전체 구성, 이미지, 보안 참고 사항, 멀티 에이전트 프로필은 다음을 참고하세요:

- [샌드박싱](/ko/gateway/sandboxing) -- 전체 샌드박스 참조
- [OpenShell](/ko/gateway/openshell) -- 샌드박스 컨테이너에 대한 대화형 셸 접근
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

기본 샌드박스 이미지를 빌드합니다(소스 체크아웃에서):

```bash
scripts/sandbox-setup.sh
```

소스 체크아웃 없이 npm으로 설치한 경우, 인라인 `docker build` 명령은 [샌드박싱 § 이미지 및 설정](/ko/gateway/sandboxing#images-and-setup)을 참고하세요.

## 문제 해결

<AccordionGroup>
  <Accordion title="이미지가 없거나 샌드박스 컨테이너가 시작되지 않음">
    샌드박스 이미지는
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (소스 체크아웃) 또는 [샌드박싱 § 이미지 및 설정](/ko/gateway/sandboxing#images-and-setup)의 인라인 `docker build` 명령(npm 설치)으로 빌드하거나,
    `agents.defaults.sandbox.docker.image`를 사용자 지정 이미지로 설정하세요.
    컨테이너는 필요할 때 세션별로 자동 생성됩니다.
  </Accordion>

  <Accordion title="샌드박스의 권한 오류">
    `docker.user`를 마운트된 워크스페이스 소유권과 일치하는 UID:GID로 설정하거나,
    워크스페이스 폴더의 소유자를 변경하세요.
  </Accordion>

  <Accordion title="샌드박스에서 사용자 지정 도구를 찾을 수 없음">
    OpenClaw는 `/etc/profile`을 소싱하고 PATH를 재설정할 수 있는
    `sh -lc`(로그인 셸)로 명령을 실행합니다. 사용자 지정 도구 경로가 앞에 오도록
    `docker.env.PATH`를 설정하거나, Dockerfile에서 `/etc/profile.d/` 아래에 스크립트를 추가하세요.
  </Accordion>

  <Accordion title="이미지 빌드 중 OOM으로 종료됨(종료 137)">
    VM에는 최소 2GB RAM이 필요합니다. 더 큰 머신 클래스를 사용한 뒤 다시 시도하세요.
  </Accordion>

  <Accordion title="Control UI에서 권한 없음 또는 페어링 필요">
    새 대시보드 링크를 가져오고 브라우저 장치를 승인하세요:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    자세한 내용: [대시보드](/ko/web/dashboard), [장치](/ko/cli/devices).

  </Accordion>

  <Accordion title="Gateway 대상에 ws://172.x.x.x가 표시되거나 Docker CLI에서 페어링 오류 발생">
    Gateway 모드와 바인드를 재설정하세요:

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
- [업데이트](/ko/install/updating) — OpenClaw를 최신 상태로 유지
- [구성](/ko/gateway/configuration) — 설치 후 Gateway 구성
