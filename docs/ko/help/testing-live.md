---
read_when:
    - 라이브 모델 매트릭스 / CLI 백엔드 / ACP / media-provider 스모크 테스트 실행
    - 라이브 테스트 자격 증명 해석 디버깅
    - 새 제공자별 라이브 테스트 추가
sidebarTitle: Live tests
summary: '라이브(네트워크에 접속하는) 테스트: 모델 매트릭스, CLI 백엔드, ACP, 미디어 제공자, 자격 증명'
title: '테스트: 라이브 스위트'
x-i18n:
    generated_at: "2026-05-03T06:18:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

빠른 시작, QA 러너, 유닛/통합 스위트, Docker 흐름은
[테스트](/ko/help/testing)를 참조하세요. 이 페이지는 **라이브**(네트워크에 접촉하는) 테스트
스위트인 모델 매트릭스, CLI 백엔드, ACP, 미디어 제공자 라이브 테스트와
자격 증명 처리를 다룹니다.

## 라이브: 로컬 프로필 스모크 명령

애드혹 라이브 검사 전에 `~/.profile`을 source하여 제공자 키와 로컬 도구
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

`voicecall smoke`는 `--yes`도 함께 있을 때를 제외하면 드라이 런입니다. 실제 알림 전화를 의도적으로 걸려는 경우에만 `--yes`를 사용하세요. Twilio, Telnyx, Plivo의 경우 성공적인 준비 상태 검사에는 공개 Webhook URL이 필요하며, 로컬 전용 loopback/비공개 폴백은 설계상 거부됩니다.

## 라이브: Android Node 기능 전체 점검

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android Node가 **현재 광고하는 모든 명령**을 호출하고 명령 계약 동작을 검증합니다.
- 범위:
  - 사전 조건이 있는 수동 설정(이 스위트는 앱을 설치/실행/페어링하지 않습니다).
  - 선택한 Android Node에 대해 명령별 Gateway `node.invoke` 검증.
- 필수 사전 설정:
  - Android 앱이 이미 Gateway에 연결되고 페어링되어 있어야 합니다.
  - 앱을 포그라운드에 유지해야 합니다.
  - 통과할 것으로 기대하는 기능에 대해 권한/캡처 동의가 허용되어 있어야 합니다.
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- 전체 Android 설정 세부 정보: [Android 앱](/ko/platforms/android)

## 라이브: 모델 스모크(프로필 키)

라이브 테스트는 실패를 격리할 수 있도록 두 계층으로 나뉩니다.

- “직접 모델”은 해당 제공자/모델이 주어진 키로 응답할 수 있는지 알려줍니다.
- “Gateway 스모크”는 해당 모델에서 전체 Gateway+에이전트 파이프라인(세션, 기록, 도구, 샌드박스 정책 등)이 작동하는지 알려줍니다.

### 계층 1: 직접 모델 완성(Gateway 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델 열거
  - `getApiKeyForModel`을 사용하여 자격 증명이 있는 모델 선택
  - 모델별로 작은 완성을 실행(필요한 경우 대상 회귀 포함)
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 이 스위트를 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(또는 modern의 별칭인 `all`)을 설정하세요. 그렇지 않으면 `pnpm test:live`가 Gateway 스모크에 집중하도록 건너뜁니다.
- 모델 선택 방법:
  - `OPENCLAW_LIVE_MODELS=modern`으로 현대식 허용 목록(Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)을 실행
  - `OPENCLAW_LIVE_MODELS=all`은 현대식 허용 목록의 별칭입니다.
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`(쉼표 허용 목록)
  - modern/all 전체 점검은 기본적으로 선별된 고신호 상한을 사용합니다. 완전한 modern 전체 점검에는 `OPENCLAW_LIVE_MAX_MODELS=0`을 설정하거나, 더 작은 상한에는 양수를 설정하세요.
  - 완전 전체 점검은 전체 직접 모델 테스트 제한 시간에 `OPENCLAW_LIVE_TEST_TIMEOUT_MS`를 사용합니다. 기본값: 60분.
  - 직접 모델 프로브는 기본적으로 20개 병렬로 실행됩니다. 재정의하려면 `OPENCLAW_LIVE_MODEL_CONCURRENCY`를 설정하세요.
- 제공자 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`(쉼표 허용 목록)
- 키 출처:
  - 기본값: 프로필 저장소와 env 폴백
  - **프로필 저장소**만 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`을 설정하세요.
- 존재 이유:
  - “제공자 API가 고장남 / 키가 유효하지 않음”과 “Gateway 에이전트 파이프라인이 고장남”을 분리합니다.
  - 작고 격리된 회귀를 포함합니다(예: OpenAI Responses/Codex Responses 추론 재생 + 도구 호출 흐름).

### 계층 2: Gateway + 개발 에이전트 스모크("@openclaw"가 실제로 수행하는 작업)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 인프로세스 Gateway 시작
  - `agent:dev:*` 세션 생성/패치(실행별 모델 재정의)
  - 키가 있는 모델을 순회하며 다음을 검증:
    - “의미 있는” 응답(도구 없음)
    - 실제 도구 호출이 작동함(읽기 프로브)
    - 선택적 추가 도구 프로브(exec+read 프로브)
    - OpenAI 회귀 경로(도구 호출만 → 후속)가 계속 작동함
- 프로브 세부 정보(실패를 빠르게 설명할 수 있도록):
  - `read` 프로브: 테스트가 워크스페이스에 nonce 파일을 쓰고 에이전트에게 이를 `read`하여 nonce를 다시 에코하도록 요청합니다.
  - `exec+read` 프로브: 테스트가 에이전트에게 임시 파일에 nonce를 `exec`로 쓰고, 그다음 다시 `read`하도록 요청합니다.
  - 이미지 프로브: 테스트가 생성된 PNG(고양이 + 무작위 코드)를 첨부하고 모델이 `cat <CODE>`를 반환할 것으로 기대합니다.
  - 구현 참조: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`.
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: 현대식 허용 목록(Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 현대식 허용 목록의 별칭입니다.
  - 또는 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 목록)을 설정하세요.
  - modern/all Gateway 전체 점검은 기본적으로 선별된 고신호 상한을 사용합니다. 완전한 modern 전체 점검에는 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`을 설정하거나, 더 작은 상한에는 양수를 설정하세요.
- 제공자 선택 방법(“OpenRouter 전부”를 피하기):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`(쉼표 허용 목록)
- 도구 + 이미지 프로브는 이 라이브 테스트에서 항상 켜져 있습니다.
  - `read` 프로브 + `exec+read` 프로브(도구 스트레스)
  - 모델이 이미지 입력 지원을 광고할 때 이미지 프로브 실행
  - 흐름(상위 수준):
    - 테스트가 “CAT” + 무작위 코드가 있는 작은 PNG를 생성합니다(`src/gateway/live-image-probe.ts`).
    - `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`를 통해 보냅니다.
    - Gateway가 첨부 파일을 `images[]`로 파싱합니다(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`).
    - 임베디드 에이전트가 멀티모달 사용자 메시지를 모델에 전달합니다.
    - 검증: 응답에 `cat` + 코드가 포함됨(OCR 허용 오차: 사소한 실수 허용)

<Tip>
내 머신에서 무엇을 테스트할 수 있는지(그리고 정확한 `provider/model` ID)를 보려면 다음을 실행하세요.

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 라이브: CLI 백엔드 스모크(Claude, Codex, Gemini 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 config를 건드리지 않고 로컬 CLI 백엔드를 사용하여 Gateway + 에이전트 파이프라인을 검증합니다.
- 백엔드별 스모크 기본값은 소유 extension의 `cli-backend.ts` 정의에 있습니다.
- 활성화:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 기본 제공자/모델: `claude-cli/claude-sonnet-4-6`
  - 명령/인자/이미지 동작은 소유 CLI 백엔드 Plugin 메타데이터에서 옵니다.
- 재정의(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 실제 이미지 첨부 파일을 보내려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`(경로는 프롬프트에 주입됨). Docker 레시피는 명시적으로 요청하지 않는 한 기본적으로 이를 끕니다.
  - 프롬프트 주입 대신 이미지 파일 경로를 CLI 인자로 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG`가 설정된 경우 이미지 인자를 전달하는 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`).
  - 두 번째 턴을 보내고 재개 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - 선택한 모델이 전환 대상을 지원할 때 Claude Sonnet -> Opus 동일 세션 연속성 프로브에 옵트인하려면 `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`. Docker 레시피는 집계 신뢰성을 위해 기본적으로 이를 끕니다.
  - MCP/도구 loopback 프로브에 옵트인하려면 `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`. Docker 레시피는 명시적으로 요청하지 않는 한 기본적으로 이를 끕니다.

예:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

저렴한 Gemini MCP config 스모크:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

이는 Gemini에게 응답 생성을 요청하지 않습니다. OpenClaw가 Gemini에 제공하는 것과 동일한 시스템
설정을 쓴 다음, `gemini --debug mcp list`를 실행하여 저장된
`transport: "streamable-http"` 서버가 Gemini의 HTTP MCP 형태로 정규화되고
로컬 streamable-HTTP MCP 서버에 연결할 수 있음을 증명합니다.

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

- Docker 러너는 `scripts/test-live-cli-backend-docker.sh`에 있습니다.
- 이 러너는 repo Docker 이미지 안에서 non-root `node` 사용자로 라이브 CLI 백엔드 스모크를 실행합니다.
- 소유 extension에서 CLI 스모크 메타데이터를 해석한 다음, 일치하는 Linux CLI 패키지(`@anthropic-ai/claude-code`, `@openai/codex` 또는 `@google/gemini-cli`)를 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`의 캐시된 쓰기 가능 prefix(기본값: `~/.cache/openclaw/docker-cli-tools`)에 설치합니다.
- `pnpm test:docker:live-cli-backend:claude-subscription`에는 `claudeAiOauth.subscriptionType`이 있는 `~/.claude/.credentials.json` 또는 `claude setup-token`의 `CLAUDE_CODE_OAUTH_TOKEN`을 통한 이식 가능한 Claude Code 구독 OAuth가 필요합니다. 먼저 Docker에서 직접 `claude -p`를 증명한 다음, Anthropic API-key env var를 보존하지 않고 두 번의 Gateway CLI 백엔드 턴을 실행합니다. Claude는 현재 일반 구독 플랜 제한 대신 추가 사용량 과금을 통해 서드 파티 앱 사용을 라우팅하므로, 이 구독 lane은 기본적으로 Claude MCP/도구 및 이미지 프로브를 비활성화합니다.
- 이제 라이브 CLI 백엔드 스모크는 Claude, Codex, Gemini에 대해 동일한 엔드투엔드 흐름을 실행합니다. 텍스트 턴, 이미지 분류 턴, 그다음 Gateway CLI를 통해 검증되는 MCP `cron` 도구 호출입니다.
- Claude의 기본 스모크는 또한 세션을 Sonnet에서 Opus로 패치하고 재개된 세션이 이전 메모를 여전히 기억하는지 검증합니다.

## 라이브: ACP 바인드 스모크(`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: 라이브 ACP 에이전트로 실제 ACP 대화 바인드 흐름을 검증합니다.
  - `/acp spawn <agent> --bind here` 전송
  - 합성 메시지 채널 대화를 제자리에서 바인딩
  - 같은 대화에 일반 후속 메시지 전송
  - 후속 메시지가 바인딩된 ACP 세션 transcript에 도착하는지 확인
- 활성화:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 기본값:
  - Docker의 ACP 에이전트: `claude,codex,gemini`
  - 직접 `pnpm test:live ...`용 ACP 에이전트: `claude`
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
  - 이 레인은 admin 전용 합성 originating-route 필드와 함께 gateway `chat.send` 표면을 사용하므로, 테스트가 외부 전달을 가장하지 않고 메시지 채널 컨텍스트를 연결할 수 있습니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않은 경우, 테스트는 선택한 ACP harness 에이전트에 대해 내장 `acpx` Plugin의 기본 에이전트 레지스트리를 사용합니다.
  - 바인딩된 세션 cron MCP 생성은 기본적으로 최선 노력 방식입니다. 외부 ACP harness가 바인드/이미지 증명이 통과한 뒤 MCP 호출을 취소할 수 있기 때문입니다. 해당 바인드 이후 cron 프로브를 엄격하게 만들려면 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`을 설정하세요.

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
- 기본적으로 ACP 바인드 smoke를 집계 라이브 CLI 에이전트에 대해 순서대로 실행합니다: `claude`, `codex`, 그다음 `gemini`.
- 매트릭스를 좁히려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`를 사용하세요.
- `~/.profile`을 소스로 가져오고, 일치하는 CLI 인증 자료를 컨테이너에 스테이징한 다음, 요청한 라이브 CLI(`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli`를 통한 Factory Droid, `@google/gemini-cli` 또는 `opencode-ai`)가 없으면 설치합니다. ACP 백엔드 자체는 공식 `acpx` Plugin의 내장 `acpx/runtime` 패키지입니다.
- Droid Docker 변형은 설정을 위해 `~/.factory`를 스테이징하고, `FACTORY_API_KEY`를 전달하며, 로컬 Factory OAuth/keyring 인증은 컨테이너로 이식할 수 없으므로 해당 API 키가 필요합니다. ACPX의 기본 `droid exec --output-format acp` 레지스트리 항목을 사용합니다.
- OpenCode Docker 변형은 엄격한 단일 에이전트 회귀 레인입니다. `~/.profile`을 소스로 가져온 뒤 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`의 임시 `OPENCODE_CONFIG_CONTENT` 기본 모델(기본값 `opencode/kimi-k2.6`)을 작성하며, `pnpm test:docker:live-acp-bind:opencode`는 일반적인 바인드 이후 건너뛰기를 허용하는 대신 바인딩된 어시스턴트 transcript를 요구합니다.
- 직접 `acpx` CLI 호출은 Gateway 외부의 동작을 비교하기 위한 수동/우회 경로일 뿐입니다. Docker ACP 바인드 smoke는 OpenClaw의 내장 `acpx` 런타임 백엔드를 실행합니다.

## 라이브: Codex 앱 서버 harness smoke

- 목표: 일반 gateway
  `agent` 메서드를 통해 Plugin 소유 Codex harness를 검증합니다.
  - 번들 `codex` Plugin 로드
  - `OPENCLAW_AGENT_RUNTIME=codex` 선택
  - Codex harness가 강제된 상태로 `openai/gpt-5.5`에 첫 번째 gateway 에이전트 턴 전송
  - 같은 OpenClaw 세션에 두 번째 턴을 보내고 app-server
    thread가 재개될 수 있는지 확인
  - 같은 gateway 명령
    경로를 통해 `/codex status`와 `/codex models` 실행
  - 선택적으로 Guardian 검토를 거친 escalated shell 프로브 두 개 실행: 승인되어야 하는 무해한
    명령 하나와 거부되어 에이전트가 되물어야 하는 가짜 비밀 업로드 하나
- 테스트: `src/gateway/gateway-codex-harness.live.test.ts`
- 활성화: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- 기본 모델: `openai/gpt-5.5`
- 선택적 이미지 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 선택적 MCP/도구 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 선택적 Guardian 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 이 smoke는 `agentRuntime.id: "codex"`를 사용하므로, 깨진 Codex harness가 조용히 PI로 폴백하여
  통과할 수 없습니다.
- 인증: 로컬 Codex 구독 로그인의 Codex app-server 인증입니다. Docker
  smokes는 적용 가능한 경우 비 Codex 프로브용 `OPENAI_API_KEY`도 제공할 수 있으며,
  선택적으로 복사된 `~/.codex/auth.json`과 `~/.codex/config.toml`도 사용할 수 있습니다.

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
- 마운트된 `~/.profile`을 소스로 가져오고, `OPENAI_API_KEY`를 전달하며, 존재하는 경우 Codex CLI
  인증 파일을 복사하고, `@openai/codex`를 쓰기 가능한 마운트된 npm
  prefix에 설치하고, 소스 트리를 스테이징한 다음 Codex-harness 라이브 테스트만 실행합니다.
- Docker는 이미지, MCP/도구, Guardian 프로브를 기본적으로 활성화합니다. 더 좁은 디버그
  실행이 필요하면 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 또는
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 또는
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`을 설정하세요.
- Docker는 동일한 명시적 Codex 런타임 구성을 사용하므로, 레거시 alias나 PI
  폴백이 Codex harness 회귀를 숨길 수 없습니다.

### 권장 라이브 레시피

좁고 명시적인 allowlist가 가장 빠르고 변동성이 적습니다.

- 단일 모델, 직접 실행(Gateway 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 제공자에 걸친 도구 호출:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 집중(Gemini API 키 + Antigravity):
  - Gemini(API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 적응형 사고 smoke:
  - 로컬 키가 shell profile에 있는 경우: `source ~/.profile`
  - Gemini 3 동적 기본값: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 동적 예산: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

참고:

- `google/...`은 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth bridge(Cloud Code Assist 스타일 에이전트 endpoint)를 사용합니다.
- `google-gemini-cli/...`는 사용자 머신의 로컬 Gemini CLI를 사용합니다(별도 인증 + tooling 특이점).
- Gemini API와 Gemini CLI:
  - API: OpenClaw가 HTTP를 통해 Google의 호스팅 Gemini API를 호출합니다(API 키 / profile auth). 대부분의 사용자가 “Gemini”라고 할 때 의미하는 방식입니다.
  - CLI: OpenClaw가 로컬 `gemini` binary를 shell out합니다. 자체 인증을 가지며 다르게 동작할 수 있습니다(streaming/도구 지원/버전 차이).

## 라이브: 모델 매트릭스(커버 범위)

고정된 “CI 모델 목록”은 없습니다(라이브는 opt-in). 하지만 키가 있는 개발 머신에서 정기적으로 커버하도록 **권장**하는 모델은 다음과 같습니다.

### 최신 smoke 세트(도구 호출 + 이미지)

이는 계속 동작할 것으로 기대하는 “공통 모델” 실행입니다.

- OpenAI(비 Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google(Gemini API): `google/gemini-3.1-pro-preview` 및 `google/gemini-3-flash-preview`(이전 Gemini 2.x 모델은 피하세요)
- Google(Antigravity): `google-antigravity/claude-opus-4-6-thinking` 및 `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` 및 `deepseek/deepseek-v4-pro`
- Z.AI(GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

도구 + 이미지로 Gateway smoke 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 기준선: 도구 호출(Read + 선택적 Exec)

제공자 계열당 최소 하나를 선택하세요.

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview`(또는 `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI(GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

선택적 추가 커버리지(있으면 좋음):

- xAI: `xai/grok-4.3`(또는 사용 가능한 최신 버전)
- Mistral: `mistral/`…(활성화한 “tools” 가능 모델 하나 선택)
- Cerebras: `cerebras/`…(접근 권한이 있는 경우)
- LM Studio: `lmstudio/`…(로컬, 도구 호출은 API 모드에 따라 달라짐)

### Vision: 이미지 전송(첨부 파일 → multimodal 메시지)

이미지 프로브를 실행하려면 `OPENCLAW_LIVE_GATEWAY_MODELS`에 이미지 가능 모델을 최소 하나 포함하세요(Claude/Gemini/OpenAI vision 가능 변형 등).

### Aggregators / 대체 Gateway

키가 활성화되어 있으면 다음을 통한 테스트도 지원합니다.

- OpenRouter: `openrouter/...`(수백 개 모델, 도구+이미지 가능 후보를 찾으려면 `openclaw models scan` 사용)
- OpenCode: Zen용 `opencode/...` 및 Go용 `opencode-go/...`(`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`를 통한 인증)

live matrix에 포함할 수 있는 추가 제공자(자격 증명/구성이 있는 경우):

- 기본 제공: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해(사용자 지정 endpoints): `minimax`(cloud/API), 그리고 OpenAI/Anthropic 호환 proxy(LM Studio, vLLM, LiteLLM 등)

<Tip>
문서에서 "all models"를 하드코딩하지 마세요. 권위 있는 목록은 사용자 머신에서 `discoverModels(...)`가 반환하는 것과 사용 가능한 키입니다.
</Tip>

## 자격 증명(커밋 금지)

라이브 테스트는 CLI와 같은 방식으로 자격 증명을 검색합니다. 실무적인 의미는 다음과 같습니다:

- CLI가 작동하면 라이브 테스트도 동일한 키를 찾아야 합니다.
- 라이브 테스트에서 “자격 증명 없음”이라고 나오면 `openclaw models list` / 모델 선택을 디버깅할 때와 같은 방식으로 디버깅하세요.

- 에이전트별 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (라이브 테스트에서 “프로필 키”가 의미하는 항목입니다)
- 구성: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 상태 디렉터리: `~/.openclaw/credentials/` (있으면 스테이징된 라이브 홈으로 복사되지만, 기본 프로필 키 저장소는 아닙니다)
- 라이브 로컬 실행은 기본적으로 활성 구성, 에이전트별 `auth-profiles.json` 파일, 레거시 `credentials/`, 지원되는 외부 CLI 인증 디렉터리를 임시 테스트 홈으로 복사합니다. 스테이징된 라이브 홈은 `workspace/` 및 `sandboxes/`를 건너뛰며, `agents.*.workspace` / `agentDir` 경로 오버라이드는 제거되어 프로브가 실제 호스트 작업 공간을 건드리지 않게 합니다.

환경 키(예: `~/.profile`에서 내보낸 키)에 의존하려면 `source ~/.profile` 이후에 로컬 테스트를 실행하거나, 아래 Docker 러너를 사용하세요(`~/.profile`을 컨테이너에 마운트할 수 있습니다).

## Deepgram 라이브(오디오 전사)

- 테스트: `extensions/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 코딩 계획 라이브

- 테스트: `extensions/byteplus/live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 선택적 모델 오버라이드: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 워크플로 미디어 라이브

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들된 comfy 이미지, 비디오 및 `music_generate` 경로를 실행합니다
  - `plugins.entries.comfy.config.<capability>`가 구성되어 있지 않으면 각 기능을 건너뜁니다
  - comfy 워크플로 제출, 폴링, 다운로드 또는 Plugin 등록을 변경한 뒤 유용합니다

## 이미지 생성 라이브

- 테스트: `test/image-generation.runtime.live.test.ts`
- 명령: `pnpm test:live test/image-generation.runtime.live.test.ts`
- 하니스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 이미지 생성 제공자 Plugin을 열거합니다
  - 프로브하기 전에 로그인 셸(`~/.profile`)에서 누락된 제공자 환경 변수를 로드합니다
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않습니다
  - 사용 가능한 인증/프로필/모델이 없는 제공자는 건너뜁니다
  - 구성된 각 제공자를 공유 이미지 생성 런타임을 통해 실행합니다:
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
- 선택적 축소:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 선택적 인증 동작:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`로 프로필 저장소 인증을 강제하고 환경 전용 오버라이드를 무시합니다

제공자/런타임 라이브 테스트가 통과한 뒤, 배포된 CLI 경로에 대해 `infer` 스모크를 추가하세요:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

이는 CLI 인수 파싱, 구성/기본 에이전트 해석, 번들 Plugin 활성화, 공유 이미지 생성 런타임, 라이브 제공자 요청을 포함합니다. Plugin 종속성은 런타임 로드 전에 이미 존재해야 합니다.

## 음악 생성 라이브

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하니스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 음악 생성 제공자 경로를 실행합니다
  - 현재 Google 및 MiniMax를 포함합니다
  - 프로브하기 전에 로그인 셸(`~/.profile`)에서 제공자 환경 변수를 로드합니다
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않습니다
  - 사용 가능한 인증/프로필/모델이 없는 제공자는 건너뜁니다
  - 사용 가능한 경우 선언된 두 런타임 모드를 모두 실행합니다:
    - 프롬프트 전용 입력으로 `generate`
    - 제공자가 `capabilities.edit.enabled`를 선언한 경우 `edit`
  - 현재 공유 레인 포함 범위:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 이 공유 스윕이 아니라 별도의 Comfy 라이브 파일입니다
- 선택적 축소:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 선택적 인증 동작:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`로 프로필 저장소 인증을 강제하고 환경 전용 오버라이드를 무시합니다

## 비디오 생성 라이브

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하니스: `pnpm test:live:media video`
- 범위:
  - 공유 번들 비디오 생성 제공자 경로를 실행합니다
  - 기본값은 릴리스에 안전한 스모크 경로입니다: FAL이 아닌 제공자, 제공자당 텍스트-비디오 요청 1개, 1초짜리 랍스터 프롬프트, `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`의 제공자별 작업 상한(기본값 `180000`)
  - 제공자 측 큐 지연이 릴리스 시간을 지배할 수 있으므로 기본적으로 FAL을 건너뜁니다. 명시적으로 실행하려면 `--video-providers fal` 또는 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`을 전달하세요
  - 프로브하기 전에 로그인 셸(`~/.profile`)에서 제공자 환경 변수를 로드합니다
  - 기본적으로 저장된 인증 프로필보다 라이브/환경 API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않습니다
  - 사용 가능한 인증/프로필/모델이 없는 제공자는 건너뜁니다
  - 기본적으로 `generate`만 실행합니다
  - 사용 가능한 경우 선언된 변환 모드도 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하세요:
    - 제공자가 `capabilities.imageToVideo.enabled`를 선언하고 선택한 제공자/모델이 공유 스윕에서 버퍼 기반 로컬 이미지 입력을 허용하는 경우 `imageToVideo`
    - 제공자가 `capabilities.videoToVideo.enabled`를 선언하고 선택한 제공자/모델이 공유 스윕에서 버퍼 기반 로컬 비디오 입력을 허용하는 경우 `videoToVideo`
  - 공유 스윕에서 현재 선언되었지만 건너뛰는 `imageToVideo` 제공자:
    - 번들된 `veo3`는 텍스트 전용이고 번들된 `kling`은 원격 이미지 URL이 필요하므로 `vydra`
  - Vydra 제공자별 포함 범위:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 해당 파일은 기본적으로 원격 이미지 URL 픽스처를 사용하는 `kling` 레인과 `veo3` 텍스트-비디오를 실행합니다
  - 현재 `videoToVideo` 라이브 포함 범위:
    - 선택한 모델이 `runway/gen4_aleph`인 경우에만 `runway`
  - 공유 스윕에서 현재 선언되었지만 건너뛰는 `videoToVideo` 제공자:
    - 해당 경로는 현재 원격 `http(s)` / MP4 참조 URL이 필요하므로 `alibaba`, `qwen`, `xai`
    - 현재 공유 Gemini/Veo 레인은 로컬 버퍼 기반 입력을 사용하며 해당 경로가 공유 스윕에서 허용되지 않으므로 `google`
    - 현재 공유 레인은 조직별 비디오 인페인트/리믹스 접근 보장을 갖추지 못했으므로 `openai`
- 선택적 축소:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL을 포함해 기본 스윕의 모든 제공자를 포함하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 공격적인 스모크 실행을 위해 각 제공자 작업 상한을 줄이려면 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 선택적 인증 동작:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`로 프로필 저장소 인증을 강제하고 환경 전용 오버라이드를 무시합니다

## 미디어 라이브 하니스

- 명령: `pnpm test:live:media`
- 목적:
  - 하나의 저장소 네이티브 진입점을 통해 공유 이미지, 음악, 비디오 라이브 스위트를 실행합니다
  - `~/.profile`에서 누락된 제공자 환경 변수를 자동으로 로드합니다
  - 기본적으로 현재 사용 가능한 인증이 있는 제공자로 각 스위트를 자동 축소합니다
  - `scripts/test-live.mjs`를 재사용하므로 Heartbeat 및 조용한 모드 동작이 일관되게 유지됩니다
- 예:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 관련 항목

- [테스트](/ko/help/testing) — 단위, 통합, QA 및 Docker 스위트
