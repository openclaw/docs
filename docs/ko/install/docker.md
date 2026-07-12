---
read_when:
    - 로컬 설치 대신 컨테이너화된 Gateway를 사용하려는 경우
    - Docker 흐름을 검증하고 있습니다
summary: OpenClaw용 선택적 Docker 기반 설정 및 온보딩
title: Docker
x-i18n:
    generated_at: "2026-07-12T15:25:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker는 **선택 사항**입니다. 격리된 일회용 Gateway 환경이나 로컬 설치가 없는 호스트에서 사용하십시오. 이미 자체 머신에서 개발하고 있다면 대신 일반 설치 절차를 사용하십시오.

기본 샌드박스 백엔드는 `agents.defaults.sandbox`가 활성화되면 Docker를 사용하지만, 샌드박싱은 기본적으로 꺼져 있으며 Gateway 자체를 Docker에서 실행할 필요는 없습니다. SSH 및 OpenShell 샌드박스 백엔드도 사용할 수 있습니다. [샌드박싱](/ko/gateway/sandboxing)을 참조하십시오.

여러 사용자를 호스팅합니까? 테넌트별 단일 셀 모델은 [멀티테넌트 호스팅](/ko/gateway/multi-tenant-hosting)을 참조하십시오.

## 사전 요구 사항

- Docker Desktop(또는 Docker Engine) + Docker Compose v2
- 이미지 빌드용 RAM 최소 2 GB(`pnpm install`은 1 GB 호스트에서 종료 코드 137로 OOM 종료될 수 있음)
- 이미지와 로그를 저장할 충분한 디스크 공간
- VPS/공개 호스트에서는 [네트워크 노출을 위한 보안 강화](/ko/gateway/security), 특히 Docker `DOCKER-USER` 방화벽 체인을 검토하십시오.

## 컨테이너화된 Gateway

<Steps>
  <Step title="이미지 빌드">
    저장소 루트에서 실행합니다.

    ```bash
    ./scripts/docker/setup.sh
    ```

    이렇게 하면 Gateway 이미지가 로컬에 `openclaw:local`로 빌드됩니다. 대신 미리 빌드된 이미지를 사용하려면 다음을 실행합니다.

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    미리 빌드된 이미지는 먼저 [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)에 게시됩니다. GHCR은 릴리스 자동화, 버전 고정 배포, 출처 확인을 위한 기본 레지스트리입니다. 동일한 릴리스는 `openclaw/openclaw`에 Docker Hub 미러도 게시합니다.

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` 또는 `openclaw/openclaw`를 사용하고, OpenClaw의 릴리스 시기나 보존 정책을 공유하지 않는 비공식 미러는 피하십시오. 공식 태그는 `main`, `latest`, `<version>`(예: `2026.2.26`) 및 `2026.2.26-beta.1` 같은 베타 태그입니다(베타는 `latest`/`main`을 절대 이동시키지 않음). 기본 `main`/`latest`/`<version>` 이미지에는 `codex` 및 `diagnostics-otel` Plugin이 포함됩니다. `-browser` 변형(예: `latest-browser`)에는 Chromium도 미리 포함되어 있어, 첫 실행 시 Playwright를 설치하지 않고 [샌드박스 브라우저](/ko/gateway/sandboxing#sandboxed-browser) 도구를 사용할 때 유용합니다.

  </Step>

  <Step title="에어갭 환경에서 재실행">
    오프라인 호스트에서는 먼저 이미지를 전송하고 로드합니다.

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline`은 `OPENCLAW_IMAGE`가 이미 로컬에 존재하는지 확인하고, 암시적인 Compose 풀 및 빌드를 비활성화한 다음 일반 절차인 `.env` 동기화, 권한 수정, 온보딩, Gateway 구성 동기화, Compose 시작을 실행합니다.

    `OPENCLAW_SANDBOX=1`이면 오프라인 설정은 `OPENCLAW_DOCKER_SOCKET` 뒤의 데몬에서 구성된 기본 및 에이전트별 샌드박스 이미지도 확인하며, Docker 기반 브라우저 이미지의 브라우저 계약 레이블도 포함합니다. 필수 이미지가 없거나 오래된 경우 설정은 손상된 성공 상태를 보고하는 대신 샌드박스 구성을 변경하지 않고 종료됩니다.

  </Step>

  <Step title="온보딩 완료">
    설정 스크립트는 온보딩을 자동으로 실행합니다.

    - 제공자 API 키 입력 요청
    - Gateway 토큰을 생성하여 `.env`에 기록
    - 인증 프로필 비밀 키 디렉터리 생성
    - Docker Compose를 통해 Gateway 시작

    `openclaw-cli`는 Gateway의 네트워크 네임스페이스를 공유하며 Gateway 컨테이너가 존재한 후에만 작동하므로, 시작 전 온보딩 및 구성 쓰기는 `openclaw-gateway`를 통해 직접 실행됩니다(`--no-deps --entrypoint node` 사용).

  </Step>

  <Step title="Control UI 열기">
    `http://127.0.0.1:18789/`을 열고 `.env`에 기록된 토큰을 Settings에 붙여 넣으십시오. 컨테이너를 비밀번호 인증으로 전환했다면 대신 해당 비밀번호를 사용하십시오.

    URL이 다시 필요합니까?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="채널 구성(선택 사항)">
    ```bash
    # WhatsApp(QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [Telegram](/ko/channels/telegram), [Discord](/ko/channels/discord)

  </Step>
</Steps>

### 수동 절차

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Docker 컨텍스트는 `.git`을 제외합니다. 위와 같이 소스 식별 정보를 빌드 인수로 전달하여 이미지의 About 화면에 체크아웃된 커밋과 하나의 빌드 타임스탬프가 표시되도록 하십시오. `scripts/docker/setup.sh`는 두 값을 자동으로 확인하여 전달합니다.

<Note>
저장소 루트에서 `docker compose`를 실행하십시오. `OPENCLAW_EXTRA_MOUNTS` 또는 `OPENCLAW_HOME_VOLUME`을 활성화하면 설정 스크립트가 `docker-compose.extra.yml`을 작성합니다. 직접 관리하는 `docker-compose.override.yml`이 있다면 그 뒤에 포함하십시오. 예: `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### 컨테이너 이미지 업그레이드

마운트된 상태/구성은 그대로 유지하면서 OpenClaw 이미지를 교체하면 새 Gateway는 준비 상태가 되기 전에 시작 시 안전한 업그레이드 마이그레이션과 Plugin 수렴을 실행합니다. 일반적인 이미지 업그레이드에는 별도의 `openclaw doctor --fix` 실행이 필요하지 않습니다.

시작 중 이러한 복구를 안전하게 완료할 수 없으면 Gateway는 정상 상태를 보고하는 대신 종료됩니다. 재시작 정책을 사용하는 경우 Docker, Podman 또는 Kubernetes에서 Gateway 컨테이너가 재시작되는 것으로 표시될 수 있습니다. 마운트된 상태 볼륨을 유지한 다음, Gateway가 사용하는 것과 동일한 상태/구성 마운트를 사용하여 동일한 이미지를 한 번 실행하되 컨테이너 명령으로 `openclaw doctor --fix`를 지정하십시오.

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

doctor가 완료되면 기본 명령으로 Gateway 컨테이너를 다시 시작하십시오. Kubernetes에서는 동일한 PVC를 마운트한 일회성 Job 또는 디버그 Pod에서 동일한 명령을 실행한 다음 Deployment 또는 StatefulSet을 다시 시작하십시오.

### 환경 변수

`scripts/docker/setup.sh`가 허용하는 선택적 변수(및 Gateway 컨테이너의 경우 `docker-compose.yml`에서 직접 허용하는 변수):

| 변수                                            | 용도                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | 로컬 빌드 대신 원격 이미지 사용                                                                                           |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | 빌드 중 추가 apt 패키지 설치(공백으로 구분). 레거시 별칭: `OPENCLAW_DOCKER_APT_PACKAGES`                                  |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | 빌드 중 추가 Python 패키지 설치(공백으로 구분)                                                                            |
| `OPENCLAW_EXTENSIONS`                           | 지원되는 선택 Plugin을 컴파일/패키징하고 해당 런타임 종속성 설치(쉼표 또는 공백으로 구분된 ID)                             |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | 로컬 소스 빌드 Node 옵션 재정의(기본값 `--max-old-space-size=8192`)                                                        |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | 로컬 소스 빌드 tsdown 힙을 MB 단위로 재정의                                                                                |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | 런타임 전용 로컬 이미지 빌드 중 선언 출력 건너뛰기(기본값 `1`)                                                            |
| `OPENCLAW_INSTALL_BROWSER`                      | 빌드 시 Chromium + Xvfb를 이미지에 포함                                                                                    |
| `OPENCLAW_EXTRA_MOUNTS`                         | 추가 호스트 바인드 마운트(쉼표로 구분된 `source:target[:opts]`)                                                            |
| `OPENCLAW_HOME_VOLUME`                          | 명명된 Docker 볼륨에 `/home/node` 유지                                                                                     |
| `OPENCLAW_SANDBOX`                              | 샌드박스 부트스트랩 사용 설정(`1`, `true`, `yes`, `on`)                                                                    |
| `OPENCLAW_SKIP_ONBOARDING`                      | 대화형 온보딩 단계 건너뛰기(`1`, `true`, `yes`, `on`)                                                                      |
| `OPENCLAW_DOCKER_SOCKET`                        | Docker 소켓 경로 재정의                                                                                                    |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour/mDNS 광고를 강제로 켜거나(`0`) 끄기(`1`). [Bonjour / mDNS](#bonjour--mdns) 참조                                   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | 번들 Plugin 소스 바인드 마운트 오버레이 비활성화                                                                           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry 내보내기를 위한 공유 OTLP/HTTP 수집기 엔드포인트                                                             |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | 트레이스, 메트릭 또는 로그를 위한 신호별 OTLP 엔드포인트                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP 프로토콜 재정의. 현재는 `http/protobuf`만 지원                                                                         |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry 리소스에 사용되는 서비스 이름                                                                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 최신 실험적 GenAI 의미론적 속성 사용 설정                                                                                  |
| `OPENCLAW_OTEL_PRELOADED`                       | OpenTelemetry SDK가 미리 로드된 경우 두 번째 SDK 시작 건너뛰기                                                             |

공식 이미지에는 Homebrew가 포함되어 있지 않습니다. 온보딩 중 OpenClaw는 `brew`가 없는 Linux 컨테이너에서 brew 전용 skill 종속성 설치 프로그램을 숨깁니다. 이러한 종속성은 사용자 지정 이미지를 통해 제공하거나 수동으로 설치하십시오. Debian 패키지 종속성에는 `OPENCLAW_IMAGE_APT_PACKAGES`를, Python 종속성에는 `OPENCLAW_IMAGE_PIP_PACKAGES`를 사용하십시오(빌드 시 `python3 -m pip install --break-system-packages`를 실행하므로 버전을 고정하고 신뢰할 수 있는 인덱스만 사용하십시오).

Docker가 `ResourceExhausted`, `cannot allocate memory`를 보고하거나 `tsdown` 중 중단되면 Docker 빌더 메모리 제한을 늘리거나 더 작은 명시적 힙으로 다시 시도하십시오.

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### 선택한 Plugin으로 소스에서 빌드한 이미지

`OPENCLAW_EXTENSIONS`는 소스 체크아웃에서 Plugin 매니페스트 ID를 선택합니다.
기존 소스 디렉터리 이름이 다른 경우 해당 이름도 허용됩니다. Docker
빌드는 선택 항목을 소스 디렉터리로 한 번 변환하고 프로덕션
의존성을 설치하며, 선택한 Plugin이
`openclaw.build.bundledDist: false`로 별도 게시되는 경우 해당 런타임을 루트 번들
dist로 컴파일합니다. 이 Docker 전용 패키징은 Plugin의 npm 또는 ClawHub
아티팩트 계약을 변경하지 않습니다. 알 수 없거나 유효하지 않거나 모호한 ID는 이미지 빌드를 실패시킵니다.
알려진 의존성/소스 전용 ID는 컴파일된 루트 dist 항목을 새로 얻지 않고
기존 소스 및 의존성 스테이징을 유지합니다. 통합 빌드 항목이 있는
선택된 Plugin은 반드시 성공적으로 컴파일되어야 하며, 선택되지 않은 외부 Plugin
소스와 런타임 출력은 제거됩니다.

예를 들어 다음 명령은 ClickClack, Slack, Microsoft Teams용으로 각각 분리된
다중 아키텍처 독립 실행형 FakeCo Gateway 이미지를 빌드합니다. ClawRouter는
이미 루트 OpenClaw 런타임에 포함되어 있으므로 ClickClack 이미지는
`clickclack`만 선택합니다. 명시적인 빈 브라우저 인수는 기본 이미지에
Chromium이 포함되지 않도록 합니다.

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

단일 네이티브 로컬 빌드에는 `--platform linux/arm64 --load` 또는
`--platform linux/amd64 --load`를 사용하십시오. 다중 플랫폼 출력과 첨부된 SBOM/출처
증명에는 레지스트리 또는 증명을 보존하는 다른 Buildx 출력이 필요합니다. 푸시한
후에는 매니페스트를 검사하고 변경 가능한 소스 SHA 태그 대신 변경 불가능한
다이제스트를 배포하십시오.

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# 배포: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

이 이미지는 독립 실행형 OCI 기반 Gateway 및 일반 Docker 사용자를 위한 것입니다.
Crabhelm 관리형 Gateway는 이 이미지를 사용하지 않습니다. 해당 전달 경로는
OpenClaw npm tarball이 포함된 별도의 x86_64 어플라이언스 아카이브를 빌드하고
Node, 아카이브, 매니페스트 다이제스트를 고정합니다. 동일하게 반영된 OpenClaw
소스에서 해당 어플라이언스를 별도로 빌드하십시오.

패키징된 이미지에서 번들 Plugin 소스를 테스트하려면 Plugin 소스 디렉터리 하나를 패키징된 소스 경로 위에 마운트하십시오. 예: `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. 이렇게 하면 동일한 Plugin ID에 대응하는 컴파일된 `/app/dist/extensions/synology-chat` 번들이 재정의됩니다.

### 관측 가능성

OpenTelemetry 내보내기는 Gateway 컨테이너에서 OTLP 수집기로 나가는 방향이므로 게시된 Docker 포트가 필요하지 않습니다. 로컬에서 빌드한 이미지에 번들 내보내기를 포함하려면 다음을 실행하십시오.

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

공식 사전 빌드 이미지는 이미 `diagnostics-otel`을 번들로 포함합니다. 이를 제거한 경우에만 `clawhub:@openclaw/diagnostics-otel`을 직접 설치하십시오. 내보내기를 활성화하려면 구성에서 `diagnostics-otel` Plugin을 허용하고 활성화한 다음 `diagnostics.otel.enabled=true`를 설정하십시오([OpenTelemetry 내보내기](/ko/gateway/opentelemetry)의 전체 예 참조). 수집기 인증 헤더는 Docker 환경 변수가 아니라 `diagnostics.otel.headers`를 통해 전달됩니다.

Prometheus 메트릭은 이미 게시된 Gateway 포트를 재사용합니다. `clawhub:@openclaw/diagnostics-prometheus`를 설치하고 `diagnostics-prometheus` Plugin을 활성화한 다음 다음 주소를 스크레이핑하십시오.

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

이 경로는 Gateway 인증으로 보호됩니다. 별도의 공개 `/metrics` 포트나 인증되지 않은 리버스 프록시 경로를 노출하지 마십시오. [Prometheus 메트릭](/ko/gateway/prometheus)을 참조하십시오.

### 상태 검사

컨테이너 프로브 엔드포인트(인증 불필요):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 활성 상태
curl -fsS http://127.0.0.1:18789/readyz     # 준비 상태
```

이미지에 내장된 `HEALTHCHECK`는 `/healthz`를 핑합니다. 실패가 반복되면 컨테이너가 `unhealthy`로 표시되어 오케스트레이터가 이를 재시작하거나 교체할 수 있습니다.

인증된 심층 상태 스냅샷:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN과 루프백 비교

`scripts/docker/setup.sh`의 기본값은 `OPENCLAW_GATEWAY_BIND=lan`이므로 Docker 포트 게시를 사용할 때 호스트의 `http://127.0.0.1:18789`가 작동합니다.

- `lan`(기본값): 호스트 브라우저와 호스트 CLI가 게시된 Gateway 포트에 접근할 수 있습니다.
- `loopback`: 컨테이너 네트워크 네임스페이스 내부의 프로세스만 Gateway에 직접 접근할 수 있습니다.

<Note>
`gateway.bind`에는 `0.0.0.0` 또는 `127.0.0.1` 같은 호스트 별칭이 아니라 바인드 모드 값(`lan` / `loopback` / `custom` / `tailnet` / `auto`)을 사용하십시오.
</Note>

### 호스트 로컬 제공자

컨테이너 내부에서 `127.0.0.1`은 호스트가 아니라 컨테이너 자체입니다. 호스트에서 실행 중인 제공자에는 `host.docker.internal`을 사용하십시오.

| 제공자    | 호스트 기본 URL          | Docker 설정 URL                     |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

번들 설정은 해당 URL을 LM Studio/Ollama 온보딩 기본값으로 사용하며, `docker-compose.yml`은 Linux Docker Engine에서 `host.docker.internal`을 호스트 Gateway에 매핑합니다(Docker Desktop은 macOS/Windows에서 동일한 별칭을 제공합니다). 호스트 서비스는 Docker가 접근할 수 있는 주소에서 수신 대기해야 합니다.

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

자체 Compose 파일이나 `docker run`을 사용하십니까? `--add-host=host.docker.internal:host-gateway`와 같이 동일한 매핑을 직접 추가하십시오.

### Docker의 Claude CLI 백엔드

공식 이미지에는 Claude Code가 사전 설치되어 있지 않습니다. 컨테이너의 `node` 사용자로 설치하고 로그인한 다음, 이미지 업그레이드 시 바이너리나 인증 상태가 삭제되지 않도록 해당 컨테이너 홈을 영구 보존하십시오.

새로 설치하는 경우 설정을 실행하기 전에 영구 `/home/node` 볼륨을 활성화하십시오.

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

기존 설치의 경우 먼저 스택을 중지하고 현재 `.env` 값을 다시 불러오십시오. 설정 스크립트는 항상 현재 셸과 기본값을 사용해 `.env`를 다시 작성하며 파일을 자체적으로 읽지 않습니다.

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env`에 셸에서 불러올 수 없는 값이 있다면 먼저 필요한 값을 직접 다시 내보내십시오(`OPENCLAW_IMAGE`, 포트, 바인드 모드, 사용자 지정 경로, `OPENCLAW_EXTRA_MOUNTS`, 샌드박스, 온보딩 건너뛰기). 생성된 오버레이는 `openclaw-gateway`와 `openclaw-cli` 모두에 홈 볼륨을 마운트합니다. 나머지 명령은 해당 오버레이와 함께 실행하십시오(`docker-compose.override.yml`을 사용하는 경우 이를 먼저 지정하십시오).

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

네이티브 설치 프로그램은 `claude`를 `/home/node/.local/bin/claude`에 기록합니다. OpenClaw가 해당 경로를 사용하도록 지정하십시오.

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

동일하게 영구 보존되는 홈에서 로그인하고 확인하십시오.

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

그런 다음 번들 `claude-cli` 백엔드를 사용하십시오.

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Docker Claude CLI에서 인사해 줘"
```

`OPENCLAW_HOME_VOLUME`은 `/home/node/.local/bin` 및 `/home/node/.local/share/claude` 아래의 네이티브 설치와 `/home/node/.claude` 및 `/home/node/.claude.json` 아래의 Claude Code 설정/인증을 영구 보존합니다. `/home/node/.openclaw`만 영구 보존하는 것으로는 충분하지 않습니다. 홈 볼륨 대신 `OPENCLAW_EXTRA_MOUNTS`를 사용하는 경우 해당 Claude 경로를 모두 두 서비스에 마운트하십시오.

<Note>
공유 프로덕션 자동화 또는 예측 가능한 Anthropic 청구를 위해서는 Anthropic API 키 경로를 사용하는 것이 좋습니다. Claude CLI 재사용은 설치된 Claude Code 버전, 계정 로그인, 청구 및 업데이트 동작을 따릅니다.
</Note>

### Bonjour / mDNS

Docker 브리지 네트워킹은 일반적으로 Bonjour/mDNS 멀티캐스트(`224.0.0.251:5353`)를 안정적으로 전달하지 못합니다. `OPENCLAW_DISABLE_BONJOUR`가 설정되지 않은 경우 번들 Bonjour Plugin은 컨테이너에서 실행 중임을 감지하면 LAN 알림을 자동으로 비활성화하므로, 브리지에서 손실되는 멀티캐스트를 재시도하며 크래시 루프에 빠지지 않습니다. 감지 결과와 관계없이 강제로 비활성화하려면 `OPENCLAW_DISABLE_BONJOUR=1`을 설정하고, 강제로 활성화하려면 `0`을 설정하십시오(호스트 네트워킹, macvlan 또는 mDNS 멀티캐스트가 작동한다고 알려진 다른 네트워크에서만 사용).

그 외의 경우 Docker 호스트에는 게시된 Gateway URL, Tailscale 또는 광역 DNS-SD를 사용하십시오. 주의 사항과 문제 해결 방법은 [Bonjour 탐색](/ko/gateway/bonjour)을 참조하십시오.

### 저장소 및 영구 보존

Docker Compose는 `OPENCLAW_CONFIG_DIR`을 `/home/node/.openclaw`에, `OPENCLAW_WORKSPACE_DIR`을 `/home/node/.openclaw/workspace`에, `OPENCLAW_AUTH_PROFILE_SECRET_DIR`을 `/home/node/.config/openclaw`에 바인드 마운트하므로 해당 경로는 컨테이너 교체 후에도 유지됩니다. 변수가 설정되지 않으면 `docker-compose.yml`은 `${HOME}` 아래를 사용하고, `HOME` 자체가 없는 경우 `/tmp`를 사용하므로 기본 환경에서 `docker compose up`을 실행해도 소스가 비어 있는 볼륨 사양이 생성되지 않습니다.

마운트된 구성 디렉터리에는 다음 항목이 포함됩니다.

- 동작 구성을 위한 `openclaw.json`
- 저장된 제공자 OAuth/API 키 인증을 위한 `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` 같은 환경 변수 기반 런타임 보안 비밀을 위한 `.env`

인증 프로필 보안 비밀 디렉터리는 OAuth 기반 인증 프로필 토큰 자료에 사용하는 로컬 암호화 키를 저장합니다. 이 디렉터리는 Docker 호스트 상태와 함께 보관하되 `OPENCLAW_CONFIG_DIR`과는 분리하십시오.

설치된 다운로드 가능 Plugin은 마운트된 OpenClaw 홈 아래에 패키지 상태를 저장하므로 설치 기록과 패키지 루트가 컨테이너 교체 후에도 유지됩니다. Gateway 시작 시 번들 Plugin 의존성 트리가 다시 생성되지는 않습니다.

전체 VM 영구 보존에 관한 자세한 내용은 [Docker VM 런타임 - 영구 보존되는 항목과 위치](/ko/install/docker-vm-runtime#what-persists-where)를 참조하십시오.

**디스크 사용량 증가 지점:** `media/`, 에이전트별 SQLite 데이터베이스, 레거시 세션 JSONL 트랜스크립트, 공유 SQLite 상태 데이터베이스, 설치된 Plugin 패키지 루트 및 `/tmp/openclaw/` 아래의 순환 파일 로그입니다.

### 셸 도우미(선택 사항)

일상적인 명령을 더 짧게 사용하려면 [ClawDock](/ko/install/clawdock)을 설치하십시오.

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이전 `scripts/shell-helpers/clawdock-helpers.sh` 경로에서 설치한 경우, 로컬 헬퍼가 현재 위치를 추적하도록 위 명령을 다시 실행하십시오. 그런 다음 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` 등을 사용하십시오(전체 목록은 `clawdock-help`를 실행하여 확인하십시오).

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

    스크립트는 샌드박스 사전 요구 사항을 통과한 후에만 `docker.sock`을 마운트합니다. 샌드박스 설정을 완료할 수 없으면 `agents.defaults.sandbox.mode`를 `off`로 재설정합니다. OpenClaw 샌드박스가 활성화된 턴에서는 Codex 코드 모드가 비활성화됩니다([샌드박싱 § Docker 백엔드](/ko/gateway/sandboxing#docker-backend) 참조). 호스트 Docker 소켓을 에이전트 샌드박스 컨테이너에 절대 마운트하지 마십시오.

  </Accordion>

  <Accordion title="자동화 / CI(비대화형)">
    `-T`를 사용하여 Compose 의사 TTY 할당을 비활성화하십시오.

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="공유 네트워크 보안 참고 사항">
    `openclaw-cli`는 CLI 명령이 `127.0.0.1`을 통해 Gateway에 연결될 수 있도록 `network_mode: "service:openclaw-gateway"`를 사용합니다. 이를 공유 신뢰 경계로 취급하십시오. Compose 구성은 `openclaw-gateway`와 `openclaw-cli` 모두에서 `NET_RAW`/`NET_ADMIN`을 제거하고 `no-new-privileges`를 활성화합니다.
  </Accordion>

  <Accordion title="openclaw-cli의 Docker Desktop DNS 오류">
    일부 Docker Desktop 설정에서는 `NET_RAW`가 제거된 후 공유 네트워크의 `openclaw-cli` 사이드카에서 DNS 조회가 실패하며, `openclaw plugins install`과 같은 npm 기반 명령을 실행할 때 `EAI_AGAIN`으로 나타납니다. 일반 작업에는 기본 강화 Compose 파일을 유지하십시오. 아래 오버라이드는 `openclaw-cli` 컨테이너에 대해서만 기본 기능을 복원합니다. 기본 호출 방식으로 사용하지 말고 레지스트리 액세스가 필요한 일회성 명령에만 사용하십시오.

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    장기 실행 `openclaw-cli` 컨테이너를 이미 생성했다면 동일한 오버라이드로 다시 생성하십시오. `docker compose exec`/`docker exec`는 이미 생성된 컨테이너의 Linux 기능을 변경할 수 없습니다.

  </Accordion>

  <Accordion title="권한 및 EACCES">
    이미지는 `node`(uid 1000)로 실행됩니다. `/home/node/.openclaw`에서 권한 오류가 발생하면 호스트 바인드 마운트의 소유자가 uid 1000인지 확인하십시오.

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    동일한 불일치는 `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`에 이어 `plugin present but blocked`로 나타날 수도 있습니다. 이는 프로세스 uid와 마운트된 Plugin 디렉터리 소유자가 일치하지 않음을 의미합니다. 기본 uid 1000으로 실행하고 바인드 마운트 소유권을 수정하는 방식을 권장합니다. OpenClaw를 장기간 루트로 실행하려는 경우에만 `/path/to/openclaw-config/npm`의 소유권을 `root:root`로 변경하십시오.

  </Accordion>

  <Accordion title="더 빠른 재빌드">
    잠금 파일이 변경되지 않는 한 `pnpm install`을 다시 실행하지 않도록 종속성 레이어가 캐시되는 순서로 Dockerfile을 구성하십시오.

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
    기본 이미지는 보안을 우선하며 루트가 아닌 `node`로 실행됩니다. 더 다양한 기능을 갖춘 컨테이너를 사용하려면 다음을 따르십시오.

    1. **`/home/node` 영구 저장**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **시스템 종속성 이미지에 포함**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python 종속성 이미지에 포함**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium 이미지에 포함**: `export OPENCLAW_INSTALL_BROWSER=1` 또는 공식 `-browser` 이미지 태그 사용
    5. **또는 영구 볼륨에 Playwright 브라우저 설치**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **브라우저 다운로드 영구 저장**: `OPENCLAW_HOME_VOLUME` 또는 `OPENCLAW_EXTRA_MOUNTS`를 사용하십시오. OpenClaw는 Linux에서 이미지의 Playwright 관리형 Chromium을 자동으로 감지합니다.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth(헤드리스 Docker)">
    마법사에서 OpenAI Codex OAuth를 선택하면 브라우저 URL이 열립니다. Docker 또는 헤드리스 설정에서는 최종적으로 이동한 전체 리디렉션 URL을 복사하여 마법사에 다시 붙여 넣으면 인증이 완료됩니다.
  </Accordion>

  <Accordion title="기본 이미지 메타데이터">
    런타임 이미지는 `node:24-bookworm-slim`을 사용하고 `tini`를 PID 1로 실행하여 장기 실행 컨테이너에서 좀비 프로세스를 정리하고 신호를 올바르게 처리합니다. `org.opencontainers.image.base.name` 및 `org.opencontainers.image.source`를 포함한 OCI 기본 이미지 주석을 게시합니다. Dependabot은 고정된 Node 기본 이미지 다이제스트를 갱신하며, 릴리스 빌드는 별도의 배포판 업그레이드 레이어를 실행하지 않습니다. [OCI 이미지 주석](https://github.com/opencontainers/image-spec/blob/main/annotations.md)을 참조하십시오.
  </Accordion>
</AccordionGroup>

### VPS에서 실행하십니까?

바이너리 이미지 포함, 영구 저장, 업데이트를 비롯한 공유 VM 배포 단계는 [Hetzner(Docker VPS)](/ko/install/hetzner) 및 [Docker VM 런타임](/ko/install/docker-vm-runtime)을 참조하십시오.

## 에이전트 샌드박스

Docker 백엔드에서 `agents.defaults.sandbox`를 활성화하면 Gateway 자체는 호스트에 유지하면서 에이전트 도구 실행(셸, 파일 읽기/쓰기 등)은 격리된 Docker 컨테이너 내부에서 수행됩니다. 따라서 Gateway 전체를 컨테이너화하지 않고도 신뢰할 수 없거나 다중 테넌트인 에이전트 세션 주위에 강력한 격리 경계를 구축할 수 있습니다.

샌드박스 범위는 에이전트별(기본값), 세션별 또는 공유로 설정할 수 있으며, 각 범위에는 `/workspace`에 마운트되는 자체 작업 공간이 제공됩니다. 도구 허용/거부 정책, 네트워크 격리, 리소스 제한 및 브라우저 컨테이너도 구성할 수 있습니다.

전체 구성, 이미지, 보안 참고 사항 및 다중 에이전트 프로필은 다음을 참조하십시오.

- [샌드박싱](/ko/gateway/sandboxing) -- 전체 샌드박스 참조 문서
- [OpenShell](/ko/gateway/openshell) -- 샌드박스 컨테이너에 대한 대화형 셸 액세스
- [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 오버라이드

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

기본 샌드박스 이미지를 빌드하십시오(소스 체크아웃에서).

```bash
scripts/sandbox-setup.sh
```

소스 체크아웃 없이 npm으로 설치한 경우 인라인 `docker build` 명령은 [샌드박싱 § 이미지 및 설정](/ko/gateway/sandboxing#images-and-setup)을 참조하십시오.

## 문제 해결

<AccordionGroup>
  <Accordion title="이미지가 없거나 샌드박스 컨테이너가 시작되지 않음">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)(소스 체크아웃) 또는 [샌드박싱 § 이미지 및 설정](/ko/gateway/sandboxing#images-and-setup)의 인라인 `docker build` 명령(npm 설치)을 사용하여 샌드박스 이미지를 빌드하거나, `agents.defaults.sandbox.docker.image`를 사용자 지정 이미지로 설정하십시오. 컨테이너는 필요할 때 세션별로 자동 생성됩니다.
  </Accordion>

  <Accordion title="샌드박스의 권한 오류">
    `docker.user`를 마운트된 작업 공간 소유권과 일치하는 UID:GID로 설정하거나 작업 공간 폴더의 소유권을 변경하십시오.
  </Accordion>

  <Accordion title="샌드박스에서 사용자 지정 도구를 찾을 수 없음">
    OpenClaw는 `/etc/profile`을 로드하여 PATH를 재설정할 수 있는 `sh -lc`(로그인 셸)로 명령을 실행합니다. 사용자 지정 도구 경로가 앞에 오도록 `docker.env.PATH`를 설정하거나 Dockerfile의 `/etc/profile.d/` 아래에 스크립트를 추가하십시오.
  </Accordion>

  <Accordion title="이미지 빌드 중 OOM으로 종료됨(종료 코드 137)">
    VM에는 최소 2 GB RAM이 필요합니다. 더 큰 머신 클래스를 사용하여 다시 시도하십시오.
  </Accordion>

  <Accordion title="Control UI에서 인증되지 않았거나 페어링이 필요함">
    새 대시보드 링크를 가져오고 브라우저 기기를 승인하십시오.

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    자세한 내용은 [대시보드](/ko/web/dashboard), [기기](/ko/cli/devices)를 참조하십시오.

  </Accordion>

  <Accordion title="Gateway 대상이 ws://172.x.x.x로 표시되거나 Docker CLI에서 페어링 오류 발생">
    Gateway 모드와 바인드를 재설정하십시오.

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 관련 문서

- [설치 개요](/ko/install) — 모든 설치 방법
- [Podman](/ko/install/podman) — Docker의 대안인 Podman
- [ClawDock](/ko/install/clawdock) — Docker Compose 커뮤니티 설정
- [업데이트](/ko/install/updating) — OpenClaw를 최신 상태로 유지
- [구성](/ko/gateway/configuration) — 설치 후 Gateway 구성
