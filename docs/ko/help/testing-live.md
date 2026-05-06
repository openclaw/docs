---
read_when:
    - 라이브 모델 매트릭스 / CLI 백엔드 / ACP / media-provider 스모크 테스트 실행
    - 라이브 테스트 자격 증명 확인 디버깅
    - 새 제공자별 라이브 테스트 추가
sidebarTitle: Live tests
summary: '라이브(네트워크 접속) 테스트: 모델 매트릭스, CLI 백엔드, ACP, 미디어 제공자, 자격 증명'
title: '테스트: 라이브 스위트'
x-i18n:
    generated_at: "2026-05-06T06:28:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

빠른 시작, QA 실행기, 유닛/통합 스위트, Docker 흐름은
[테스트](/ko/help/testing)를 참조하세요. 이 페이지에서는 모델 매트릭스, CLI 백엔드, ACP, 미디어 제공자 라이브 테스트와
자격 증명 처리를 포함하는 **라이브**(네트워크에 접속하는) 테스트
스위트를 다룹니다.

## 라이브: 로컬 프로필 스모크 명령

임시 라이브 검사를 하기 전에 `~/.profile`을 source하여 제공자 키와 로컬 도구
경로가 셸과 일치하도록 하세요.

```bash
source ~/.profile
```

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

`voicecall smoke`는 `--yes`도 함께 있을 때를 제외하면 드라이 런입니다. 실제 알림 전화를 걸려는 의도가 있을 때만 `--yes`를 사용하세요. Twilio, Telnyx, Plivo의 경우 성공적인 준비 상태 검사에는 공개 Webhook URL이 필요하며, 로컬 전용 loopback/private 폴백은 설계상 거부됩니다.

## 라이브: Android 노드 기능 스윕

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android 노드가 **현재 알리는 모든 명령**을 호출하고 명령 계약 동작을 검증합니다.
- 범위:
  - 사전 조건이 필요한 수동 설정(이 스위트는 앱을 설치/실행/페어링하지 않습니다).
  - 선택한 Android 노드에 대한 명령별 Gateway `node.invoke` 검증.
- 필수 사전 설정:
  - Android 앱이 이미 Gateway에 연결 및 페어링되어 있어야 합니다.
  - 앱을 포그라운드에 유지합니다.
  - 통과할 것으로 기대하는 기능에 대한 권한/캡처 동의가 부여되어 있어야 합니다.
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- 전체 Android 설정 세부 정보: [Android 앱](/ko/platforms/android)

## 라이브: 모델 스모크(프로필 키)

라이브 테스트는 실패를 격리할 수 있도록 두 계층으로 나뉩니다.

- "직접 모델"은 주어진 키로 제공자/모델이 응답할 수 있는지 알려줍니다.
- "Gateway 스모크"는 해당 모델에 대해 전체 Gateway+에이전트 파이프라인(세션, 기록, 도구, 샌드박스 정책 등)이 동작하는지 알려줍니다.

### 계층 1: 직접 모델 완성(Gateway 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델 열거
  - `getApiKeyForModel`을 사용해 자격 증명이 있는 모델 선택
  - 모델별 작은 완성 실행(필요한 경우 대상 회귀 포함)
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 이 스위트를 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(또는 modern의 별칭인 `all`)을 설정하세요. 그렇지 않으면 `pnpm test:live`가 Gateway 스모크에 집중되도록 건너뜁니다.
- 모델 선택 방법:
  - `OPENCLAW_LIVE_MODELS=modern`으로 최신 허용 목록 실행(Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all`은 최신 허용 목록의 별칭입니다.
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`(쉼표 허용 목록)
  - Modern/all 스윕은 기본적으로 선별된 고신호 상한을 사용합니다. 전체 최신 스윕에는 `OPENCLAW_LIVE_MAX_MODELS=0`을 설정하고, 더 작은 상한에는 양수를 설정하세요.
  - 전체 스윕은 전체 직접 모델 테스트 제한 시간에 `OPENCLAW_LIVE_TEST_TIMEOUT_MS`를 사용합니다. 기본값: 60분.
  - 직접 모델 프로브는 기본적으로 20개 병렬로 실행됩니다. 재정의하려면 `OPENCLAW_LIVE_MODEL_CONCURRENCY`를 설정하세요.
- 제공자 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`(쉼표 허용 목록)
- 키 출처:
  - 기본값: 프로필 저장소 및 환경 폴백
  - **프로필 저장소**만 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`을 설정하세요.
- 존재 이유:
  - "제공자 API가 고장남 / 키가 유효하지 않음"과 "Gateway 에이전트 파이프라인이 고장남"을 분리합니다.
  - 작고 격리된 회귀를 포함합니다(예: OpenAI Responses/Codex Responses reasoning 재생 + 도구 호출 흐름).

### 계층 2: Gateway + 개발 에이전트 스모크("@openclaw"가 실제로 수행하는 작업)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 프로세스 내부 Gateway 시작
  - `agent:dev:*` 세션 생성/패치(실행별 모델 재정의)
  - 키가 있는 모델을 반복하고 다음을 검증:
    - "의미 있는" 응답(도구 없음)
    - 실제 도구 호출 동작(읽기 프로브)
    - 선택적 추가 도구 프로브(exec+read 프로브)
    - OpenAI 회귀 경로(도구 호출 전용 → 후속)가 계속 동작
- 프로브 세부 정보(실패를 빠르게 설명할 수 있도록):
  - `read` 프로브: 테스트가 작업 공간에 nonce 파일을 쓰고 에이전트에게 이를 `read`한 뒤 nonce를 다시 출력하라고 요청합니다.
  - `exec+read` 프로브: 테스트가 에이전트에게 temp 파일에 nonce를 `exec`로 쓰게 한 다음, 이를 다시 `read`하게 합니다.
  - 이미지 프로브: 테스트가 생성된 PNG(cat + 무작위 코드)를 첨부하고 모델이 `cat <CODE>`를 반환하기를 기대합니다.
  - 구현 참조: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`.
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: 최신 허용 목록(Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 최신 허용 목록의 별칭입니다.
  - 또는 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 목록)을 설정하세요.
  - Modern/all Gateway 스윕은 기본적으로 선별된 고신호 상한을 사용합니다. 전체 최신 스윕에는 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`을 설정하고, 더 작은 상한에는 양수를 설정하세요.
- 제공자 선택 방법("OpenRouter 전체" 방지):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`(쉼표 허용 목록)
- 도구 + 이미지 프로브는 이 라이브 테스트에서 항상 켜져 있습니다.
  - `read` 프로브 + `exec+read` 프로브(도구 스트레스)
  - 모델이 이미지 입력 지원을 알릴 때 이미지 프로브가 실행됩니다.
  - 흐름(상위 수준):
    - 테스트가 "CAT" + 무작위 코드가 있는 작은 PNG를 생성합니다(`src/gateway/live-image-probe.ts`).
    - `agent`를 통해 `attachments: [{ mimeType: "image/png", content: "<base64>" }]`로 전송합니다.
    - Gateway가 첨부 파일을 `images[]`로 파싱합니다(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`).
    - 임베디드 에이전트가 멀티모달 사용자 메시지를 모델에 전달합니다.
    - 검증: 답변에 `cat` + 코드가 포함됩니다(OCR 허용 오차: 사소한 실수 허용).

<Tip>
머신에서 테스트할 수 있는 항목(및 정확한 `provider/model` ID)을 보려면 다음을 실행하세요.

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 라이브: CLI 백엔드 스모크(Claude, Codex, Gemini 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 설정을 건드리지 않고 로컬 CLI 백엔드를 사용해 Gateway + 에이전트 파이프라인을 검증합니다.
- 백엔드별 스모크 기본값은 소유 Plugin의 `cli-backend.ts` 정의에 있습니다.
- 활성화:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 기본 제공자/모델: `claude-cli/claude-sonnet-4-6`
  - 명령/인수/이미지 동작은 소유 CLI 백엔드 Plugin 메타데이터에서 옵니다.
- 재정의(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 실제 이미지 첨부 파일을 보내려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`을 설정하세요(경로는 프롬프트에 주입됩니다). Docker 레시피는 명시적으로 요청하지 않는 한 기본적으로 이를 끕니다.
  - 프롬프트 주입 대신 이미지 파일 경로를 CLI 인수로 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`를 설정하세요.
  - `IMAGE_ARG`가 설정되었을 때 이미지 인수가 전달되는 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`)를 설정하세요.
  - 두 번째 턴을 보내고 재개 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`을 설정하세요.
  - 선택한 모델이 전환 대상을 지원할 때 Claude Sonnet -> Opus 동일 세션 연속성 프로브를 사용하려면 `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`을 설정하세요. Docker 레시피는 집계 신뢰성을 위해 기본적으로 이를 끕니다.
  - MCP/도구 loopback 프로브를 사용하려면 `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`을 설정하세요. Docker 레시피는 명시적으로 요청하지 않는 한 기본적으로 이를 끕니다.

예:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

저렴한 Gemini MCP 설정 스모크:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

이는 Gemini에게 응답 생성을 요청하지 않습니다. OpenClaw가 Gemini에 제공하는 것과 동일한 시스템
설정을 쓴 다음 `gemini --debug mcp list`를 실행하여 저장된
`transport: "streamable-http"` 서버가 Gemini의 HTTP MCP
형태로 정규화되고 로컬 streamable-HTTP MCP 서버에 연결할 수 있음을 증명합니다.

Docker 레시피:

```bash
pnpm test:docker:live-cli-backend
```

단일 제공자 Docker 레시피:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

참고:

- Docker 실행기는 `scripts/test-live-cli-backend-docker.sh`에 있습니다.
- 저장소 Docker 이미지 안에서 비루트 `node` 사용자로 라이브 CLI 백엔드 스모크를 실행합니다.
- 소유 확장에서 CLI 스모크 메타데이터를 해석한 다음, 일치하는 Linux CLI 패키지(`@anthropic-ai/claude-code`, `@openai/codex` 또는 `@google/gemini-cli`)를 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`의 캐시된 쓰기 가능 접두사(기본값: `~/.cache/openclaw/docker-cli-tools`)에 설치합니다.
- `pnpm test:docker:live-cli-backend:claude-subscription`은 `claudeAiOauth.subscriptionType`이 있는 `~/.claude/.credentials.json` 또는 `claude setup-token`의 `CLAUDE_CODE_OAUTH_TOKEN`을 통해 이식 가능한 Claude Code 구독 OAuth가 필요합니다. 먼저 Docker에서 직접 `claude -p`를 증명한 다음 Anthropic API 키 환경 변수를 보존하지 않고 두 번의 Gateway CLI 백엔드 턴을 실행합니다. 이 구독 레인은 Claude가 현재 서드파티 앱 사용을 일반 구독 플랜 한도 대신 추가 사용량 과금으로 라우팅하기 때문에 기본적으로 Claude MCP/도구 및 이미지 프로브를 비활성화합니다.
- 라이브 CLI 백엔드 스모크는 이제 Claude, Codex, Gemini에 대해 동일한 엔드 투 엔드 흐름을 실행합니다. 텍스트 턴, 이미지 분류 턴, 그리고 Gateway CLI를 통해 검증되는 MCP `cron` 도구 호출입니다.
- Claude의 기본 스모크는 세션을 Sonnet에서 Opus로 패치하고 재개된 세션이 이전 메모를 계속 기억하는지도 검증합니다.

## 라이브: APNs HTTP/2 프록시 도달 가능성

- 테스트: `src/infra/push-apns-http2.live.test.ts`
- 목표: 로컬 HTTP CONNECT 프록시를 통해 Apple의 샌드박스 APNs 엔드포인트로 터널링하고, APNs HTTP/2 검증 요청을 보낸 다음 Apple의 실제 `403 InvalidProviderToken` 응답이 프록시 경로를 통해 돌아오는지 검증합니다.
- 활성화:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 선택적 제한 시간:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 라이브: ACP 바인드 스모크(`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: 라이브 ACP 에이전트로 실제 ACP 대화 바인딩 흐름을 검증합니다:
  - `/acp spawn <agent> --bind here` 보내기
  - 합성 메시지 채널 대화를 제자리에서 바인딩하기
  - 같은 대화에서 일반 후속 메시지 보내기
  - 후속 메시지가 바인딩된 ACP 세션 transcript에 도착하는지 확인하기
- 활성화:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 기본값:
  - Docker의 ACP 에이전트: `claude,codex,gemini`
  - 직접 `pnpm test:live ...` 실행 시 ACP 에이전트: `claude`
  - 합성 채널: Slack DM 스타일 대화 컨텍스트
  - ACP 백엔드: `acpx`
- 재정의:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 참고:
  - 이 레인은 Gateway `chat.send` 표면을 관리자 전용 합성 originating-route 필드와 함께 사용하므로, 테스트가 외부 전달을 가장하지 않고도 메시지 채널 컨텍스트를 연결할 수 있습니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않은 경우, 테스트는 선택된 ACP 하네스 에이전트에 대해 내장 `acpx` Plugin의 기본 제공 에이전트 레지스트리를 사용합니다.
  - 바인딩된 세션의 Cron MCP 생성은 기본적으로 최선 노력 방식입니다. 외부 ACP 하네스가 바인딩/이미지 증명이 통과된 뒤 MCP 호출을 취소할 수 있기 때문입니다. 바인딩 이후 Cron 프로브를 엄격하게 만들려면 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`을 설정하세요.

예:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 레시피:

```bash
pnpm test:docker:live-acp-bind
```

단일 에이전트 Docker 레시피:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 참고:

- Docker 러너는 `scripts/test-live-acp-bind-docker.sh`에 있습니다.
- 기본적으로 ACP 바인딩 smoke를 집계 라이브 CLI 에이전트에 대해 순서대로 실행합니다: `claude`, `codex`, 그다음 `gemini`.
- 매트릭스를 좁히려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`를 사용하세요.
- `~/.profile`을 source하고, 일치하는 CLI 인증 자료를 컨테이너에 스테이징한 다음, 요청된 라이브 CLI(`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli`를 통한 Factory Droid, `@google/gemini-cli` 또는 `opencode-ai`)가 없으면 설치합니다. ACP 백엔드 자체는 공식 `acpx` Plugin의 내장 `acpx/runtime` 패키지입니다.
- Droid Docker 변형은 설정을 위해 `~/.factory`를 스테이징하고, `FACTORY_API_KEY`를 전달하며, 로컬 Factory OAuth/keyring 인증은 컨테이너로 이식할 수 없기 때문에 해당 API 키가 필요합니다. ACPX의 기본 제공 `droid exec --output-format acp` 레지스트리 항목을 사용합니다.
- OpenCode Docker 변형은 엄격한 단일 에이전트 회귀 레인입니다. `~/.profile`을 source한 뒤 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`의 임시 `OPENCODE_CONFIG_CONTENT` 기본 모델을 작성하며(기본값 `opencode/kimi-k2.6`), `pnpm test:docker:live-acp-bind:opencode`는 일반적인 바인딩 이후 건너뛰기를 허용하는 대신 바인딩된 어시스턴트 transcript를 요구합니다.
- 직접 `acpx` CLI 호출은 Gateway 외부 동작을 비교하기 위한 수동/우회 경로일 뿐입니다. Docker ACP 바인딩 smoke는 OpenClaw의 내장 `acpx` 런타임 백엔드를 실행합니다.

## 라이브: Codex app-server 하네스 smoke

- 목표: 일반 Gateway
  `agent` 메서드를 통해 Plugin 소유 Codex 하네스를 검증합니다:
  - 번들된 `codex` Plugin 로드하기
  - `OPENCLAW_AGENT_RUNTIME=codex` 선택하기
  - Codex 하네스를 강제한 상태로 `openai/gpt-5.5`에 첫 번째 Gateway 에이전트 턴 보내기
  - 같은 OpenClaw 세션에 두 번째 턴을 보내고 app-server
    스레드가 재개될 수 있는지 확인하기
  - 같은 Gateway 명령
    경로를 통해 `/codex status` 및 `/codex models` 실행하기
  - 선택적으로 Guardian 검토를 거친 권한 상승 셸 프로브 2개 실행하기: 승인되어야 하는 무해한 명령 하나와 거부되어 에이전트가 되물어야 하는 가짜 비밀 업로드 하나
- 테스트: `src/gateway/gateway-codex-harness.live.test.ts`
- 활성화: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- 기본 모델: `openai/gpt-5.5`
- 선택적 이미지 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 선택적 MCP/tool 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 선택적 Guardian 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke는 `agentRuntime.id: "codex"`를 사용하므로 손상된 Codex 하네스가 조용히 PI로 대체되어 통과할 수 없습니다.
- 인증: 로컬 Codex 구독 로그인에서 가져온 Codex app-server 인증입니다. Docker
  smoke는 적용 가능한 경우 비 Codex 프로브용 `OPENAI_API_KEY`도 제공할 수 있으며,
  선택적으로 복사된 `~/.codex/auth.json` 및 `~/.codex/config.toml`도 제공할 수 있습니다.

로컬 레시피:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 레시피:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 참고:

- Docker 러너는 `scripts/test-live-codex-harness-docker.sh`에 있습니다.
- 마운트된 `~/.profile`을 source하고, `OPENAI_API_KEY`를 전달하며, Codex CLI
  인증 파일이 있으면 복사하고, 쓰기 가능한 마운트된 npm
  prefix에 `@openai/codex`를 설치하며, 소스 트리를 스테이징한 다음 Codex 하네스 라이브 테스트만 실행합니다.
- Docker는 기본적으로 이미지, MCP/tool, Guardian 프로브를 활성화합니다. 더 좁은 디버그
  실행이 필요하면 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 또는
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 또는
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`을 설정하세요.
- Docker는 동일한 명시적 Codex 런타임 구성을 사용하므로 레거시 별칭이나 PI
  fallback이 Codex 하네스 회귀를 숨길 수 없습니다.

### 권장 라이브 레시피

좁고 명시적인 허용 목록이 가장 빠르고 flaky가 가장 적습니다:

- 단일 모델, 직접 실행(Gateway 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 provider에서 tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 집중(Gemini API 키 + Antigravity):
  - Gemini(API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - 로컬 키가 셸 profile에 있는 경우: `source ~/.profile`
  - Gemini 3 동적 기본값: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 동적 예산: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

참고:

- `google/...`는 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth 브리지(Cloud Code Assist 스타일 에이전트 엔드포인트)를 사용합니다.
- `google-gemini-cli/...`는 사용자의 머신에 있는 로컬 Gemini CLI를 사용합니다(별도의 인증 + 도구 관련 특이점).
- Gemini API와 Gemini CLI:
  - API: OpenClaw는 HTTP를 통해 Google의 호스팅 Gemini API를 호출합니다(API 키 / profile 인증). 대부분의 사용자가 "Gemini"라고 말할 때 의미하는 것이 이것입니다.
  - CLI: OpenClaw는 로컬 `gemini` 바이너리를 셸로 실행합니다. 자체 인증을 가지며 다르게 동작할 수 있습니다(스트리밍/tool 지원/버전 차이).

## 라이브: 모델 매트릭스(다루는 범위)

고정된 "CI 모델 목록"은 없지만(라이브는 opt-in), 키가 있는 개발 머신에서 정기적으로 다루기를 **권장하는** 모델은 다음과 같습니다.

### 최신 smoke 세트(tool calling + 이미지)

이는 계속 작동하도록 유지해야 하는 "일반 모델" 실행입니다:

- OpenAI(비 Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google(Gemini API): `google/gemini-3.1-pro-preview` 및 `google/gemini-3-flash-preview`(이전 Gemini 2.x 모델은 피하세요)
- Google(Antigravity): `google-antigravity/claude-opus-4-6-thinking` 및 `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` 및 `deepseek/deepseek-v4-pro`
- Z.AI(GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

tool + 이미지로 Gateway smoke 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 기준선: tool calling(Read + 선택적 Exec)

provider 계열마다 최소 하나를 선택하세요:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview`(또는 `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI(GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

선택적 추가 범위(있으면 좋음):

- xAI: `xai/grok-4.3`(또는 사용 가능한 최신 버전)
- Mistral: `mistral/`…(활성화된 "tools" 가능 모델 하나 선택)
- Cerebras: `cerebras/`…(액세스 권한이 있는 경우)
- LM Studio: `lmstudio/`…(로컬; tool calling은 API 모드에 따라 달라짐)

### Vision: 이미지 보내기(첨부 파일 → 멀티모달 메시지)

이미지 프로브를 실행하려면 `OPENCLAW_LIVE_GATEWAY_MODELS`에 이미지 지원 모델을 하나 이상 포함하세요(Claude/Gemini/OpenAI vision 지원 변형 등).

### Aggregator / 대체 Gateway

키가 활성화되어 있다면 다음을 통한 테스트도 지원합니다:

- OpenRouter: `openrouter/...`(수백 개 모델; tool+이미지 가능 후보를 찾으려면 `openclaw models scan` 사용)
- OpenCode: Zen에는 `opencode/...`, Go에는 `opencode-go/...` 사용(`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`를 통한 인증)

라이브 매트릭스에 포함할 수 있는 추가 provider(자격 증명/구성이 있는 경우):

- 기본 제공: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해(사용자 지정 엔드포인트): `minimax`(클라우드/API), 그리고 모든 OpenAI/Anthropic 호환 프록시(LM Studio, vLLM, LiteLLM 등)

<Tip>
문서에 "all models"를 하드코딩하지 마세요. 권위 있는 목록은 사용자의 머신에서 `discoverModels(...)`가 반환하는 항목과 사용 가능한 키입니다.
</Tip>

## 자격 증명(절대 커밋하지 마세요)

라이브 테스트는 CLI와 같은 방식으로 자격 증명을 발견합니다. 실질적인 의미는 다음과 같습니다:

- CLI가 작동하면 라이브 테스트도 같은 키를 찾아야 합니다.
- 라이브 테스트에서 "no creds"라고 나오면 `openclaw models list` / 모델 선택을 디버그하는 것과 같은 방식으로 디버그하세요.

- 에이전트별 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (라이브 테스트에서 "profile keys"가 의미하는 항목)
- 구성: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 상태 디렉터리: `~/.openclaw/credentials/` (있으면 스테이징된 라이브 홈으로 복사되지만, 기본 프로필 키 저장소는 아님)
- 라이브 로컬 실행은 기본적으로 활성 구성, 에이전트별 `auth-profiles.json` 파일, 레거시 `credentials/`, 지원되는 외부 CLI 인증 디렉터리를 임시 테스트 홈으로 복사합니다. 스테이징된 라이브 홈은 `workspace/`와 `sandboxes/`를 건너뛰며, 프로브가 실제 호스트 워크스페이스에 닿지 않도록 `agents.*.workspace` / `agentDir` 경로 재정의가 제거됩니다.

환경 키에 의존하려는 경우(예: `~/.profile`에서 export한 경우), `source ~/.profile` 후 로컬 테스트를 실행하거나 아래 Docker 실행기를 사용하세요(`~/.profile`을 컨테이너에 마운트할 수 있음).

## Deepgram 라이브(오디오 전사)

- 테스트: `extensions/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 코딩 계획 라이브

- 테스트: `extensions/byteplus/live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 선택적 모델 재정의: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 워크플로 미디어 라이브

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들 comfy 이미지, 비디오, `music_generate` 경로를 실행합니다
  - `plugins.entries.comfy.config.<capability>`가 구성되어 있지 않으면 각 기능을 건너뜁니다
  - comfy 워크플로 제출, 폴링, 다운로드 또는 Plugin 등록을 변경한 뒤 유용합니다

## 이미지 생성 라이브

- 테스트: `test/image-generation.runtime.live.test.ts`
- 명령: `pnpm test:live test/image-generation.runtime.live.test.ts`
- 하네스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 이미지 생성 제공자 Plugin을 열거합니다
  - 프로브 전에 로그인 셸(`~/.profile`)에서 누락된 제공자 환경 변수를 로드합니다
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않습니다
  - 사용 가능한 인증/프로필/모델이 없는 제공자를 건너뜁니다
  - 구성된 각 제공자를 공유 이미지 생성 런타임으로 실행합니다:
    - `<provider>:generate`
    - 제공자가 편집 지원을 선언한 경우 `<provider>:edit`
- 현재 포함된 번들 제공자:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`: 프로필 저장소 인증을 강제하고 환경 전용 재정의를 무시합니다

출시된 CLI 경로의 경우 제공자/런타임 라이브 테스트가 통과한 뒤 `infer` 스모크를 추가하세요:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

이것은 CLI 인수 파싱, 구성/기본 에이전트 해석, 번들
Plugin 활성화, 공유 이미지 생성 런타임, 라이브 제공자
요청을 다룹니다. 런타임 로드 전에 Plugin 의존성이 존재해야 합니다.

## 음악 생성 라이브

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 음악 생성 제공자 경로를 실행합니다
  - 현재 Google과 MiniMax를 다룹니다
  - 프로브 전에 로그인 셸(`~/.profile`)에서 제공자 환경 변수를 로드합니다
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않습니다
  - 사용 가능한 인증/프로필/모델이 없는 제공자를 건너뜁니다
  - 사용 가능한 경우 선언된 두 런타임 모드를 모두 실행합니다:
    - 프롬프트 전용 입력으로 `generate`
    - 제공자가 `capabilities.edit.enabled`를 선언한 경우 `edit`
  - 현재 공유 레인 적용 범위:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 이 공유 스윕이 아니라 별도의 Comfy 라이브 파일
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 선택적 인증 동작:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`: 프로필 저장소 인증을 강제하고 환경 전용 재정의를 무시합니다

## 비디오 생성 라이브

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media video`
- 범위:
  - 공유 번들 비디오 생성 제공자 경로를 실행합니다
  - 기본값은 릴리스에 안전한 스모크 경로입니다. FAL이 아닌 제공자, 제공자당 텍스트-비디오 요청 1개, 1초 분량의 랍스터 프롬프트, 그리고 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`의 제공자별 작업 한도(기본값 `180000`)를 사용합니다
  - 제공자 측 대기열 지연이 릴리스 시간을 지배할 수 있으므로 기본적으로 FAL은 건너뜁니다. 명시적으로 실행하려면 `--video-providers fal` 또는 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`을 전달하세요
  - 프로브 전에 로그인 셸(`~/.profile`)에서 제공자 환경 변수를 로드합니다
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않습니다
  - 사용 가능한 인증/프로필/모델이 없는 제공자를 건너뜁니다
  - 기본적으로 `generate`만 실행합니다
  - 사용 가능한 경우 선언된 변환 모드도 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하세요:
    - 제공자가 `capabilities.imageToVideo.enabled`를 선언하고 선택한 제공자/모델이 공유 스윕에서 버퍼 기반 로컬 이미지 입력을 허용하는 경우 `imageToVideo`
    - 제공자가 `capabilities.videoToVideo.enabled`를 선언하고 선택한 제공자/모델이 공유 스윕에서 버퍼 기반 로컬 비디오 입력을 허용하는 경우 `videoToVideo`
  - 공유 스윕에서 현재 선언되었지만 건너뛰는 `imageToVideo` 제공자:
    - `vydra`: 번들 `veo3`는 텍스트 전용이고 번들 `kling`은 원격 이미지 URL이 필요하기 때문입니다
  - 제공자별 Vydra 적용 범위:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 해당 파일은 기본적으로 원격 이미지 URL 픽스처를 사용하는 `kling` 레인과 `veo3` 텍스트-비디오를 실행합니다
  - 현재 `videoToVideo` 라이브 적용 범위:
    - 선택한 모델이 `runway/gen4_aleph`인 경우에만 `runway`
  - 공유 스윕에서 현재 선언되었지만 건너뛰는 `videoToVideo` 제공자:
    - `alibaba`, `qwen`, `xai`: 해당 경로는 현재 원격 `http(s)` / MP4 참조 URL이 필요하기 때문입니다
    - `google`: 현재 공유 Gemini/Veo 레인은 로컬 버퍼 기반 입력을 사용하며, 해당 경로는 공유 스윕에서 허용되지 않기 때문입니다
    - `openai`: 현재 공유 레인에는 조직별 비디오 인페인트/리믹스 접근 보장이 없기 때문입니다
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - 기본 스윕에 FAL을 포함한 모든 제공자를 포함하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 공격적인 스모크 실행을 위해 각 제공자 작업 한도를 줄이려면 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 선택적 인증 동작:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`: 프로필 저장소 인증을 강제하고 환경 전용 재정의를 무시합니다

## 미디어 라이브 하네스

- 명령: `pnpm test:live:media`
- 목적:
  - 하나의 저장소 네이티브 진입점을 통해 공유 이미지, 음악, 비디오 라이브 제품군을 실행합니다
  - `~/.profile`에서 누락된 제공자 환경 변수를 자동 로드합니다
  - 기본적으로 각 제품군을 현재 사용 가능한 인증이 있는 제공자로 자동 축소합니다
  - `scripts/test-live.mjs`를 재사용하므로 Heartbeat 및 조용한 모드 동작이 일관되게 유지됩니다
- 예:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 관련 항목

- [테스트](/ko/help/testing) - 단위, 통합, QA, Docker 제품군
