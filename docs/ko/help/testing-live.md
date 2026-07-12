---
read_when:
    - 라이브 모델 매트릭스 / CLI 백엔드 / ACP / 미디어 제공자 스모크 테스트 실행
    - 라이브 테스트 자격 증명 확인 디버깅
    - 새 공급자 전용 라이브 테스트 추가하기
sidebarTitle: Live tests
summary: '실시간(네트워크에 연결되는) 테스트: 모델 매트릭스, CLI 백엔드, ACP, 미디어 제공자, 자격 증명'
title: '테스트: 라이브 제품군'
x-i18n:
    generated_at: "2026-07-12T00:52:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

빠른 시작, QA 실행기, 단위/통합 스위트 및 Docker 흐름은
[테스트](/ko/help/testing)를 참조하세요. 이 페이지에서는 모델 매트릭스, CLI 백엔드, ACP, 미디어 제공자 및 자격 증명 처리와 같은 **라이브**(네트워크에 접근하는) 테스트를 다룹니다.

## 라이브: 로컬 스모크 명령

임시 라이브 검사를 실행하기 전에 프로세스 환경에서 필요한 제공자 키를 내보내세요.

안전한 미디어 스모크:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

안전한 음성 통화 준비 상태 스모크:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`는 `--yes`도 함께 지정하지 않는 한 시험 실행입니다. 실제로 전화를 걸려는 경우에만 `--yes`를 사용하세요. Twilio, Telnyx 및 Plivo의 경우 준비 상태 검사를 통과하려면 공개 Webhook URL이 필요합니다. 이러한 제공자는 로컬/비공개 local loopback URL에 접근할 수 없으므로 해당 URL은 거부됩니다.

## 라이브: Android Node 기능 전체 검사

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android Node가 **현재 알리는 모든 명령**을 호출하고 명령 계약 동작을 검증합니다.
- 범위:
  - 사전 조건이 충족된 수동 설정입니다(이 스위트는 앱을 설치, 실행 또는 페어링하지 않습니다).
  - 선택한 Android Node에 대해 명령별 Gateway `node.invoke` 검증을 수행합니다.
- 필요한 사전 설정:
  - Android 앱이 이미 Gateway에 연결되고 페어링되어 있어야 합니다.
  - 앱을 포그라운드에 유지해야 합니다.
  - 통과시키려는 기능에 필요한 권한/캡처 동의를 부여해야 합니다.
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- 전체 Android 설정 세부 정보: [Android 앱](/ko/platforms/android)

## 라이브: 모델 스모크(프로필 키)

라이브 모델 테스트는 실패 원인을 격리할 수 있도록 두 계층으로 나뉩니다.

- "직접 모델"은 제공자/모델이 주어진 키로 응답할 수 있는지를 알려 줍니다.
- "Gateway 스모크"는 해당 모델에서 전체 Gateway+에이전트 파이프라인(세션, 기록, 도구, 샌드박스 정책 등)이 작동하는지를 알려 줍니다.

아래의 선별된 모델 목록은 `src/agents/live-model-filter.ts`에 있으며
시간이 지나면서 변경됩니다. 이 페이지가 아니라 해당 파일의 배열을 기준 정보로 사용하세요.

MiniMax M3는 기본 제공자/모델 참조로 `minimax/MiniMax-M3`를 사용합니다.

### 계층 1: 직접 모델 완성(Gateway 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 검색된 모델 열거
  - `getApiKeyForModel`을 사용하여 자격 증명이 있는 모델 선택
  - 모델별로 작은 완성을 실행하고 필요한 경우 대상 회귀 테스트 수행
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - 이 스위트를 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern`, `small` 또는 `all`(`modern`의 별칭)을 설정하세요. 그렇지 않으면 건너뛰므로 `pnpm test:live`만 실행하면 Gateway 스모크에 집중합니다.
- 모델 선택 방법:
  - `OPENCLAW_LIVE_MODELS=modern`은 선별된 우선순위 높은 고신호 목록을 실행합니다([라이브: 모델 매트릭스](#live-model-matrix-what-we-cover) 참조).
  - `OPENCLAW_LIVE_MODELS=small`은 선별된 소형 모델 우선순위 목록을 실행합니다.
  - `OPENCLAW_LIVE_MODELS=all`은 `modern`의 별칭입니다.
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."`(쉼표로 구분된 허용 목록)
  - 로컬 Ollama 소형 모델 실행의 기본값은 `http://127.0.0.1:11434`입니다. LAN, 사용자 지정 또는 Ollama Cloud 엔드포인트에만 `OPENCLAW_LIVE_OLLAMA_BASE_URL`을 설정하세요.
  - Modern/all 및 small 전체 검사의 기본 상한은 각각 선별된 목록의 길이입니다. 선택한 프로필을 빠짐없이 검사하려면 `OPENCLAW_LIVE_MAX_MODELS=0`을 설정하고, 상한을 더 작게 하려면 양수를 설정하세요.
  - 전체 검사에서는 전체 직접 모델 테스트 제한 시간으로 `OPENCLAW_LIVE_TEST_TIMEOUT_MS`를 사용합니다. 기본값: 60분.
  - 직접 모델 프로브는 기본적으로 20개를 병렬 실행합니다. 재정의하려면 `OPENCLAW_LIVE_MODEL_CONCURRENCY`를 설정하세요.
- 제공자 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`(쉼표로 구분된 허용 목록)
- 키를 가져오는 위치:
  - 기본값: 프로필 저장소 및 환경 대체 경로
  - **프로필 저장소**만 사용하도록 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`을 설정하세요.
- 존재 이유:
  - "제공자 API가 손상됨/키가 유효하지 않음"과 "Gateway 에이전트 파이프라인이 손상됨"을 구분합니다.
  - 작고 격리된 회귀 테스트를 포함합니다(예: OpenAI Responses/Codex Responses 추론 재생 + 도구 호출 흐름).

### 계층 2: Gateway + 개발 에이전트 스모크("@openclaw"이 실제로 수행하는 작업)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 프로세스 내부 Gateway 시작
  - `agent:dev:*` 세션 생성/패치(실행별 모델 재정의)
  - 키가 있는 모델을 순회하며 다음을 검증:
    - "의미 있는" 응답(도구 없음)
    - 실제 도구 호출이 작동함(읽기 프로브)
    - 선택적 추가 도구 프로브(실행+읽기 프로브)
    - OpenAI 회귀 경로(도구 호출만 수행 -> 후속 처리)가 계속 작동함
- 프로브 세부 정보(실패 원인을 빠르게 설명할 수 있도록):
  - `read` 프로브: 테스트가 작업 공간에 논스 파일을 작성하고 에이전트에게 해당 파일을 `read`하여 논스를 그대로 응답하도록 요청합니다.
  - `exec+read` 프로브: 테스트가 에이전트에게 `exec`로 임시 파일에 논스를 작성한 후 다시 `read`하도록 요청합니다.
  - 이미지 프로브: 테스트가 생성된 PNG(고양이 + 무작위 코드)를 첨부하고 모델이 `cat <CODE>`를 반환할 것으로 기대합니다.
  - 구현 참조: `src/gateway/gateway-models.profiles.live.test.ts` 및 `test/helpers/live-image-probe.ts`.
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: 선별된 고신호(`modern`) 우선순위 목록
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`은 전체 Gateway+에이전트 파이프라인을 통해 선별된 소형 모델 목록을 실행합니다.
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 `modern`의 별칭입니다.
  - 또는 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 구분 목록)을 설정하세요.
  - Modern/all 및 small Gateway 전체 검사의 기본 상한은 각각 선별된 목록의 길이입니다. 선택한 대상을 빠짐없이 검사하려면 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`을 설정하고, 상한을 더 작게 하려면 양수를 설정하세요.
- 제공자 선택 방법("OpenRouter 전체" 방지):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`(쉼표로 구분된 허용 목록)
- 이 라이브 테스트에서는 도구 + 이미지 프로브가 항상 활성화됩니다.
  - `read` 프로브 + `exec+read` 프로브(도구 스트레스)
  - 모델이 이미지 입력 지원을 알리는 경우 이미지 프로브 실행
  - 흐름(개요):
    - 테스트가 "CAT" + 무작위 코드가 포함된 작은 PNG를 생성합니다(`test/helpers/live-image-probe.ts`).
    - `agent`의 `attachments: [{ mimeType: "image/png", content: "<base64>" }]`를 통해 전송합니다.
    - Gateway가 첨부 파일을 `images[]`로 파싱합니다(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`).
    - 내장 에이전트가 멀티모달 사용자 메시지를 모델로 전달합니다.
    - 검증: 응답에 `cat` + 코드가 포함되어야 합니다(OCR 허용 오차: 사소한 오류 허용).

<Tip>
컴퓨터에서 테스트할 수 있는 항목과 정확한 `provider/model` ID를 확인하려면 다음을 실행하세요.

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 라이브: CLI 백엔드 스모크(Claude, Gemini 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 설정을 건드리지 않고 로컬 CLI 백엔드를 사용하여 Gateway + 에이전트 파이프라인을 검증합니다.
- 백엔드별 스모크 기본값은 소유 Plugin의 `cli-backend.ts` 정의에 있습니다.
- 활성화:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 기본 제공자/모델: `claude-cli/claude-sonnet-4-6`
  - 명령/인수/이미지 동작은 소유 CLI 백엔드 Plugin 메타데이터에서 가져옵니다.
- 재정의(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - 실제 이미지 첨부 파일을 전송하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`을 설정하세요(경로는 프롬프트에 삽입됨). Docker 절차에서는 기본적으로 비활성화됩니다.
  - 프롬프트 삽입 대신 이미지 파일 경로를 CLI 인수로 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`를 설정하세요.
  - `IMAGE_ARG`가 설정된 경우 이미지 인수 전달 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`)를 설정하세요.
  - 두 번째 턴을 전송하고 재개 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`을 설정하세요.
  - 선택한 모델이 전환 대상을 지원할 때 Claude Sonnet -> Opus 동일 세션 연속성 프로브에 참여하려면 `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`을 설정하세요. Docker 절차를 포함해 기본적으로 비활성화됩니다.
  - MCP/도구 local loopback 프로브에 참여하려면 `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`을 설정하세요. Docker 절차에서는 기본적으로 비활성화됩니다.

예:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

저비용 Gemini MCP 설정 스모크:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

이 테스트는 Gemini에 응답 생성을 요청하지 않습니다. OpenClaw가 Gemini에 제공하는 것과 동일한 시스템 설정을 작성한 다음 `gemini --debug mcp list`를 실행하여 저장된 `transport: "streamable-http"` 서버가 Gemini의 HTTP MCP 형식으로 정규화되고 로컬 스트리밍 가능 HTTP MCP 서버에 연결할 수 있음을 입증합니다.

Docker 절차:

```bash
pnpm test:docker:live-cli-backend
```

단일 제공자 Docker 절차:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

참고:

- Docker 실행기는 `scripts/test-live-cli-backend-docker.sh`에 있습니다.
- 저장소 Docker 이미지 내부에서 루트가 아닌 `node` 사용자로 라이브 CLI 백엔드 스모크를 실행합니다.
- 소유 Plugin에서 CLI 스모크 메타데이터를 확인한 후 일치하는 Linux CLI 패키지(`@anthropic-ai/claude-code` 또는 `@google/gemini-cli`)를 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`(기본값: `~/.cache/openclaw/docker-cli-tools`)의 캐시된 쓰기 가능한 접두사에 설치합니다.
- `codex-cli`는 더 이상 번들 CLI 백엔드가 아닙니다. 대신 Codex 앱 서버 런타임과 함께 `openai/*`를 사용하세요([라이브: Codex 앱 서버 하네스 스모크](#live-codex-app-server-harness-smoke) 참조).
- `pnpm test:docker:live-cli-backend:claude-subscription`에는 `claudeAiOauth.subscriptionType`이 있는 `~/.claude/.credentials.json` 또는 `claude setup-token`에서 가져온 `CLAUDE_CODE_OAUTH_TOKEN`을 통한 이식 가능한 Claude Code 구독 OAuth가 필요합니다. 먼저 Docker에서 직접 `claude -p`를 실행하여 검증한 다음, Anthropic API 키 환경 변수를 유지하지 않은 채 두 번의 Gateway CLI 백엔드 턴을 실행합니다. 이 구독 경로는 로그인된 구독의 사용량 한도를 소모하고 Anthropic이 OpenClaw 릴리스 없이 Claude Agent SDK / `claude -p`의 청구 및 속도 제한 동작을 변경할 수 있으므로, Claude MCP/도구 및 이미지 프로브를 기본적으로 비활성화합니다.
- Claude와 Gemini는 위 플래그를 통해 동일한 프로브 집합(텍스트 턴, 이미지 분류, MCP `cron` 도구 호출, 모델 전환 연속성)을 지원하지만, 기본적으로는 어떤 프로브도 실행되지 않습니다. 필요에 따라 각 플래그로 활성화하세요.

## 라이브: APNs HTTP/2 프록시 도달 가능성

- 테스트: `src/infra/push-apns-http2.live.test.ts`
- 목표: 로컬 HTTP CONNECT 프록시를 통해 Apple의 샌드박스 APNs 엔드포인트로 터널링하고 APNs HTTP/2 검증 요청을 전송한 다음, Apple의 실제 `403 InvalidProviderToken` 응답이 프록시 경로를 통해 돌아오는지 검증합니다.
- 활성화:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 선택적 제한 시간:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 라이브: ACP 바인딩 스모크(`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: 실제 ACP 에이전트를 사용해 실제 ACP 대화 바인딩 흐름을 검증합니다.
  - `/acp spawn <agent> --bind here` 전송
  - 합성 메시지 채널 대화를 현재 위치에 바인딩
  - 동일한 대화에서 일반 후속 메시지 전송
  - 후속 메시지가 바인딩된 ACP 세션 트랜스크립트에 기록되는지 확인
- 활성화:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 기본값:
  - Docker의 ACP 에이전트: `claude,codex,gemini`
  - 직접 `pnpm test:live ...` 실행 시 ACP 에이전트: `claude`
  - 합성 채널: Slack DM 형식의 대화 컨텍스트
  - ACP 백엔드: `acpx`
- 재정의:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`(또는 `on`/`true`/`yes`)로 이미지 프로브를 강제로 활성화합니다. 그 외의 값은 강제로 비활성화합니다. `opencode`를 제외한 모든 에이전트에서 기본적으로 실행됩니다.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- 참고:
  - 이 실행 경로는 관리자 전용 합성 발신 경로 필드와 함께 Gateway의 `chat.send` 인터페이스를 사용하므로, 테스트에서 외부로 메시지를 전달하는 것처럼 가장하지 않고 메시지 채널 컨텍스트를 연결할 수 있습니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않은 경우 테스트는 선택한 ACP 하네스 에이전트에 대해 내장 `acpx` Plugin의 기본 제공 에이전트 레지스트리를 사용합니다.
  - 외부 ACP 하네스가 바인딩/이미지 검증이 통과된 후 MCP 호출을 취소할 수 있으므로, 바인딩된 세션의 Cron MCP 생성은 기본적으로 최선형 방식으로 처리됩니다. 바인딩 후 Cron 프로브를 엄격하게 적용하려면 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`을 설정하세요.

예시:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 실행 방법:

```bash
pnpm test:docker:live-acp-bind
```

단일 에이전트 Docker 실행 방법:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 참고 사항:

- Docker 실행기는 `scripts/test-live-acp-bind-docker.sh`에 있습니다.
- 기본적으로 통합 라이브 CLI 에이전트에 대해 ACP 바인딩 스모크 테스트를 `claude`, `codex`, `gemini` 순서로 실행합니다.
- 매트릭스를 축소하려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`를 사용하세요.
- 일치하는 CLI 인증 자료를 컨테이너에 스테이징한 다음, 요청한 라이브 CLI(`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli`를 통한 Factory Droid, `@google/gemini-cli` 또는 `opencode-ai`)가 없으면 설치합니다. ACP 백엔드 자체는 공식 `acpx` Plugin에 내장된 `acpx/runtime` 패키지입니다.
- Droid Docker 변형은 설정을 위해 `~/.factory`를 스테이징하고 `FACTORY_API_KEY`를 전달하며, 로컬 Factory OAuth/키링 인증은 컨테이너로 이식할 수 없으므로 해당 API 키가 필수입니다. ACPX의 기본 제공 `droid exec --output-format acp` 레지스트리 항목을 사용합니다.
- OpenCode Docker 변형은 엄격한 단일 에이전트 회귀 실행 경로입니다. `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`의 값(기본값 `opencode/kimi-k2.6`)으로 임시 `OPENCODE_CONFIG_CONTENT` 기본 모델을 작성합니다.
- 직접 `acpx` CLI를 호출하는 방식은 Gateway 외부의 동작을 비교하기 위한 수동/우회 경로일 뿐입니다. Docker ACP 바인딩 스모크 테스트는 OpenClaw에 내장된 `acpx` 런타임 백엔드를 실행합니다.

## 라이브: Codex 앱 서버 하네스 스모크 테스트

- 목표: 일반 Gateway `agent` 메서드를 통해 Plugin이 소유한 Codex 하네스를 검증합니다.
  - 번들 `codex` Plugin 로드
  - `/model <ref> --runtime codex`를 통해 OpenAI 모델 선택
  - 요청한 사고 수준으로 첫 번째 Gateway 에이전트 턴 전송
  - 동일한 OpenClaw 세션에 두 번째 턴을 전송하고 앱 서버 스레드가 재개되는지 확인
  - 동일한 Gateway 명령 경로를 통해 `/codex status`와 `/codex models` 실행
  - 선택적으로 Guardian 검토를 거치는 권한 상승 셸 프로브 두 개 실행: 승인되어야 하는 정상 명령 하나와 거부되어 에이전트가 사용자에게 되물어야 하는 가짜 비밀 업로드 하나
- 테스트: `src/gateway/gateway-codex-harness.live.test.ts`
- 활성화: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- 하네스 기준 모델: `openai/gpt-5.6-luna`
- 새 OpenAI API 키 선택 기본값: `openai/gpt-5.6`
- 기본 사고 수준: `low`
- 모델 재정의: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- 사고 수준 재정의: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- 매트릭스 재정의: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- 인증 모드: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth`(기본값)는 복사된 Codex 로그인을 사용하고, `api-key`는 Codex 앱 서버를 통해 `OPENAI_API_KEY`를 사용합니다.
- 선택적 이미지 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 선택적 MCP/도구 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 선택적 Guardian 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 이 스모크 테스트는 공급자/모델의 `agentRuntime.id: "codex"`를 강제하므로, 손상된 Codex 하네스가 OpenClaw로 조용히 대체되어 테스트를 통과할 수 없습니다.
- 인증: 로컬 Codex 구독 로그인의 Codex 앱 서버 인증 또는 `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`일 때의 `OPENAI_API_KEY`를 사용합니다. Docker는 구독 실행을 위해 `~/.codex/auth.json`과 `~/.codex/config.toml`을 복사할 수 있습니다.

로컬 실행 방법:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 실행 방법:

```bash
pnpm test:docker:live-codex-harness
```

GPT-5.6 네이티브 Codex 매트릭스:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

새 OpenAI API 키 기본값:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

이 검증은 `OPENCLAW_LIVE_GATEWAY_MODELS`를 설정하지 않은 상태로 두고, 새로운 온보딩 추론 선택 경로를 통해 모델을 확인하여 `openai/gpt-5.6`인지 검증한 다음, 확인된 모델로 실제 Gateway 턴을 실행합니다.

GPT-5.6 내장 OpenClaw 매트릭스:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker 참고 사항:

- Docker 실행기는 `scripts/test-live-codex-harness-docker.sh`에 있습니다.
- `OPENAI_API_KEY`를 전달하고, Codex CLI 인증 파일이 있으면 복사하며, 쓰기 가능한 마운트된 npm 접두사에 `@openai/codex`를 설치하고, 소스 트리를 스테이징한 다음 Codex 하네스 라이브 테스트만 실행합니다.
- Docker는 이미지, MCP/도구 및 Guardian 프로브를 기본적으로 활성화합니다. 더 좁은 범위의 디버그 실행이 필요하면 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 또는 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`을 설정하세요.
- Docker는 동일한 명시적 Codex 런타임 구성을 사용하므로, 레거시 별칭이나 OpenClaw 대체 동작이 Codex 하네스 회귀를 숨길 수 없습니다.
- 매트릭스 대상은 하나의 컨테이너에서 순차적으로 실행됩니다. Docker 스크립트는 기본 35분 제한 시간을 대상 수에 맞게 조정하며, 외부 셸 또는 CI 제한 시간도 동일한 총시간을 허용해야 합니다. 표준 CI는 각 GPT-5.6 대상을 별도의 샤드로 유지합니다.

### 권장 라이브 실행 방법

범위가 좁고 명시적인 허용 목록이 가장 빠르고 불안정성이 가장 낮습니다.

- 단일 모델, 직접 실행(Gateway 미사용):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- 소형 모델 직접 프로필:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 소형 모델 Gateway 프로필:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API 스모크 테스트:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 단일 모델, Gateway 스모크 테스트:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 공급자의 도구 호출:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 직접 스모크 테스트:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google 중심(Gemini API 키 + Antigravity):
  - Gemini(API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 적응형 사고 스모크 테스트(비공개 QA CLI의 `qa manual` 사용 — `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`과 소스 체크아웃 필요. [QA 개요](/ko/concepts/qa-e2e-automation) 참조):
  - Gemini 3 동적 기본값: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 동적 예산: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

참고:

- `google/...`은 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth 브리지(Cloud Code Assist 형식 에이전트 엔드포인트)를 사용합니다.
- `google-gemini-cli/...`는 컴퓨터의 로컬 Gemini CLI를 사용합니다(별도의 인증 및 도구 관련 특이사항이 있음).
- Gemini API와 Gemini CLI의 차이:
  - API: OpenClaw가 HTTP를 통해 Google에서 호스팅하는 Gemini API를 호출합니다(API 키/프로필 인증). 대부분의 사용자가 "Gemini"라고 할 때 의미하는 방식입니다.
  - CLI: OpenClaw가 로컬 `gemini` 바이너리를 셸에서 실행합니다. 자체 인증을 사용하며 스트리밍/도구 지원/버전 차이로 인해 다르게 동작할 수 있습니다.

## 라이브: 모델 매트릭스(검증 범위)

라이브 테스트는 명시적으로 활성화해야 하므로 고정된 "CI 모델 목록"은 없습니다. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern`(및 해당 `all` 별칭)은 `src/agents/live-model-filter.ts`의 `HIGH_SIGNAL_LIVE_MODEL_PRIORITY`에 정의된 엄선된 우선순위 목록을 다음 우선순위대로 실행합니다.

| 제공자/모델                                   | 참고       |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

`SMALL_LIVE_MODEL_PRIORITY`에서 가져온 선별된 **소형 모델** 목록(`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`):

| 제공자/모델                  |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

최신 목록에 관한 참고 사항:

- `codex` 및 `codex-cli` 제공자는 기본 최신 스윕에서 제외됩니다(CLI 백엔드/ACP 동작을 다루며 위에서 별도로 테스트됨). `openai/gpt-5.5` 자체는 기본적으로 Codex 앱 서버 하네스를 통해 라우팅됩니다. [라이브: Codex 앱 서버 하네스 스모크 테스트](#live-codex-app-server-harness-smoke)를 참조하세요.
- `fireworks`, `google`, `openrouter`, `xai`는 최신 스윕에서 명시적으로 선별된 모델 ID만 실행합니다(“이 제공자의 모든 모델”을 자동으로 확장하지 않음).
- 이미지 프로브를 실행하려면 `OPENCLAW_LIVE_GATEWAY_MODELS`에 이미지 지원 모델(Claude/Gemini/OpenAI 계열 비전 변형 등)을 하나 이상 포함하세요.

직접 선택한 여러 제공자 모델 집합을 대상으로 도구와 이미지를 포함한 Gateway 스모크 테스트를 실행합니다.

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

선별된 목록 외의 선택적 추가 범위(가능하면 활성화된 “도구” 지원 모델을 선택):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...`(액세스 권한이 있는 경우)
- LM Studio: `lmstudio/...`(로컬, 도구 호출은 API 모드에 따라 달라짐)

### 애그리게이터/대체 Gateway

키가 활성화되어 있다면 다음을 통해서도 테스트할 수 있습니다.

- OpenRouter: `openrouter/...`(수백 개의 모델, 도구와 이미지를 지원하는 후보를 찾으려면 `openclaw models scan` 사용)
- OpenCode: Zen에는 `opencode/...`, Go에는 `opencode-go/...` 사용(`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`를 통한 인증)

라이브 매트릭스에 포함할 수 있는 추가 제공자(자격 증명/구성이 있는 경우):

- 기본 제공: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- `models.providers`를 통해(사용자 지정 엔드포인트): `minimax`(클라우드/API) 및 OpenAI/Anthropic 호환 프록시(LM Studio, vLLM, LiteLLM 등)

<Tip>
문서에 “모든 모델”을 하드코딩하지 마세요. 기준 목록은 컴퓨터에서 `discoverModels(...)`가 반환하는 항목과 사용 가능한 키로 결정됩니다.
</Tip>

## 자격 증명(절대 커밋하지 마세요)

라이브 테스트는 CLI와 동일한 방식으로 자격 증명을 검색합니다. 실질적인 의미는 다음과 같습니다.

- CLI가 작동하면 라이브 테스트도 동일한 키를 찾아야 합니다.
- 라이브 테스트에 “자격 증명 없음”이 표시되면 `openclaw models list` / 모델 선택을 디버깅할 때와 동일한 방식으로 디버깅하세요.

- 에이전트별 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`(라이브 테스트에서 “프로필 키”가 의미하는 항목)
- 구성: `~/.openclaw/openclaw.json`(또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 OAuth 디렉터리: `~/.openclaw/credentials/`(존재하면 스테이징된 라이브 홈으로 복사되지만 기본 프로필 키 저장소는 아님)
- 로컬 라이브 실행은 활성 구성(`agents.*.workspace` / `agentDir` 재정의 제거)과 각 에이전트의 `auth-profiles.json`만 복사합니다. 해당 에이전트 디렉터리의 나머지 부분은 복사하지 않으므로 `workspace/` 및 `sandboxes/` 데이터는 스테이징된 홈에 절대 전달되지 않습니다. 여기에 레거시 `credentials/` 디렉터리와 지원되는 외부 CLI 인증 파일/디렉터리(`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`)도 임시 테스트 홈으로 복사합니다.

환경 키를 사용하려면 로컬 테스트 전에 내보내거나 아래의 Docker 실행기를 명시적 `OPENCLAW_PROFILE_FILE`과 함께 사용하세요.

## Deepgram 라이브(오디오 전사)

- 테스트: `extensions/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 코딩 플랜 라이브

- 테스트: `extensions/byteplus/live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 선택적 모델 재정의: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 워크플로 미디어 라이브

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들 comfy 이미지, 동영상 및 `music_generate` 경로 실행
  - `plugins.entries.comfy.config.<capability>`가 구성되지 않은 경우 각 기능 건너뛰기
  - comfy 워크플로 제출, 폴링, 다운로드 또는 Plugin 등록을 변경한 후 유용함

## 이미지 생성 라이브

- 테스트: `test/image-generation.runtime.live.test.ts`
- 명령: `pnpm test:live test/image-generation.runtime.live.test.ts`
- 하네스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 이미지 생성 제공자 Plugin 열거
  - 프로브 전에 이미 내보낸 제공자 환경 변수 사용
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로 `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/프로필/모델이 없는 제공자 건너뛰기
  - 구성된 각 제공자를 공유 이미지 생성 런타임을 통해 실행:
    - `<provider>:generate`
    - 제공자가 편집 지원을 선언한 경우 `<provider>:edit`
- 현재 포함되는 번들 제공자:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 선택적 인증 동작:
  - 프로필 저장소 인증을 강제하고 환경 변수 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

제공자/런타임 라이브 테스트를 통과한 후 배포된 CLI 경로에 `infer` 스모크 테스트를 추가하세요.

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "텍스트 없이 흰색 배경에 파란색 정사각형 하나가 있는 최소한의 평면 테스트 이미지." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

이 테스트는 CLI 인수 구문 분석, 구성/기본 에이전트 확인, 번들 Plugin 활성화, 공유 이미지 생성 런타임 및 라이브 제공자 요청을 다룹니다. 런타임을 로드하기 전에 Plugin 종속성이 존재해야 합니다.

## 음악 생성 라이브

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 음악 생성 제공자 경로 실행
  - 현재 `fal`, `google`, `minimax`, `openrouter` 포함
  - 프로브 전에 이미 내보낸 제공자 환경 변수 사용
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로 `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/프로필/모델이 없는 제공자 건너뛰기
  - 사용 가능한 경우 선언된 두 런타임 모드를 모두 실행:
    - 프롬프트 전용 입력을 사용하는 `generate`
    - 제공자가 `capabilities.edit.enabled`를 선언한 경우 `edit`
  - `comfy`에는 이 공유 스윕이 아닌 별도의 라이브 파일이 있음
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 선택적 인증 동작:
  - 프로필 저장소 인증을 강제하고 환경 변수 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 동영상 생성 라이브

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media video`
- 범위:
  - `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai` 전반에서 공유 번들 동영상 생성 공급자 경로를 실행합니다
  - 기본적으로 릴리스에 안전한 스모크 경로를 사용합니다. 공급자당 텍스트-동영상 요청 하나, 1초 길이의 바닷가재 프롬프트, `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`의 공급자별 작업 제한 시간(기본값 `180000`)을 적용합니다
  - 공급자 측 대기열 지연이 릴리스 시간을 대부분 차지할 수 있으므로 기본적으로 FAL을 건너뜁니다. 명시적으로 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`을 전달하거나 건너뛰기 목록을 비우십시오
  - 프로빙 전에 이미 내보낸 공급자 환경 변수를 사용합니다
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않습니다
  - 사용 가능한 인증/프로필/모델이 없는 공급자는 건너뜁니다
  - 기본적으로 `generate`만 실행합니다
  - 사용 가능한 경우 선언된 변환 모드도 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하십시오:
    - 공급자가 `capabilities.imageToVideo.enabled`를 선언하고 선택한 공급자/모델이 공유 스윕에서 버퍼 기반 로컬 이미지 입력을 허용하는 경우 `imageToVideo`
    - 공급자가 `capabilities.videoToVideo.enabled`를 선언하고 선택한 공급자/모델이 공유 스윕에서 버퍼 기반 로컬 동영상 입력을 허용하는 경우 `videoToVideo`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `imageToVideo` 공급자:
    - `vydra`(이 실행 경로에서는 버퍼 기반 로컬 이미지 입력을 지원하지 않음)
  - Vydra 공급자별 검사 범위:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 이 파일은 `veo3` 텍스트-동영상 경로와 기본적으로 원격 이미지 URL 픽스처를 사용하는 `kling` 이미지-동영상 경로를 실행합니다(`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL`로 재정의).
  - xAI 공급자별 검사 범위:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - 클래식 사례에서는 먼저 정사각형 로컬 PNG 첫 프레임을 생성하고, 기하 정보를 생략한 뒤, 1초 길이의 이미지-동영상 클립을 요청하고, 완료될 때까지 폴링한 다음, 다운로드한 버퍼를 검증합니다.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - 1.5 사례에서는 로컬 PNG 첫 프레임을 생성하고, 1초 길이의 1080P 이미지-동영상 클립을 요청하고, 완료될 때까지 폴링한 다음, 다운로드한 버퍼를 검증합니다.
  - 현재 `videoToVideo` 라이브 검사 범위:
    - 선택한 모델이 `gen4_aleph`로 확인되는 경우에만 `runway`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `videoToVideo` 공급자:
    - 해당 경로에는 현재 버퍼 기반 로컬 입력이 아니라 원격 `http(s)` 참조 URL이 필요하므로 `alibaba`, `google`, `openai`, `qwen`, `xai`
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL을 포함하여 기본 스윕의 모든 공급자를 포함하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 적극적인 스모크 실행을 위해 각 공급자 작업 제한 시간을 줄이려면 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 선택적 인증 동작:
  - 프로필 저장소 인증을 강제하고 환경 변수 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 미디어 라이브 하네스

- 명령: `pnpm test:live:media`
- 진입점: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`. 선택한 스위트마다 `pnpm test:live -- <suite-test-file>`을 실행하므로 Heartbeat 및 저소음 모드 동작이 다른 `pnpm test:live` 실행과 일관되게 유지됩니다.
- 목적:
  - 저장소 네이티브 진입점 하나를 통해 공유 이미지, 음악, 동영상 라이브 스위트를 실행합니다
  - `~/.profile`에서 누락된 공급자 환경 변수를 자동으로 불러옵니다
  - 기본적으로 각 스위트의 범위를 현재 사용 가능한 인증이 있는 공급자로 자동 축소합니다
- 플래그:
  - `--providers <csv>` 전역 공급자 필터. `--image-providers` / `--music-providers` / `--video-providers`는 필터의 범위를 하나의 스위트로 제한합니다
  - `--all-providers`는 인증 기반 자동 필터를 건너뜁니다
  - `--allow-empty`는 필터링 후 실행 가능한 공급자가 없을 때 `0`으로 종료합니다
  - `--quiet` / `--no-quiet`는 `test:live`에 그대로 전달됩니다
- 예:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 관련 문서

- [테스트](/ko/help/testing) - 단위, 통합, QA 및 Docker 스위트
