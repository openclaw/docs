---
read_when:
    - 모델 선택 또는 전환, 별칭 구성
    - 모델 장애 조치 디버깅 / "모든 모델이 실패했습니다"
    - 인증 프로필 이해 및 관리 방법
sidebarTitle: Models FAQ
summary: 'FAQ: 모델 기본값, 선택, 별칭, 전환, 장애 조치, 인증 프로필'
title: '자주 묻는 질문: 모델 및 인증'
x-i18n:
    generated_at: "2026-05-07T13:19:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  모델 및 인증 프로필 Q&A. 설정, 세션, gateway, 채널,
  troubleshooting은 기본 [FAQ](/ko/help/faq)를 참조하세요.

  ## 모델: 기본값, 선택, 별칭, 전환

  <AccordionGroup>
  <Accordion title='“기본 모델”이란 무엇인가요?'>
    OpenClaw의 기본 모델은 다음으로 설정한 값입니다.

    ```
    agents.defaults.model.primary
    ```

    모델은 `provider/model` 형식으로 참조됩니다(예: `openai/gpt-5.5` 또는 `anthropic/claude-sonnet-4-6`). provider를 생략하면 OpenClaw는 먼저 별칭을 시도한 다음, 해당 정확한 모델 ID와 일치하는 고유한 configured-provider를 찾고, 그다음에야 deprecated compatibility path로 설정된 기본 provider로 fallback합니다. 해당 provider가 더 이상 설정된 기본 모델을 노출하지 않으면 OpenClaw는 오래되어 제거된 provider 기본값을 표시하는 대신 첫 번째로 설정된 provider/model로 fallback합니다. 그래도 `provider/model`을 **명시적으로** 설정해야 합니다.

  </Accordion>

  <Accordion title="어떤 모델을 추천하나요?">
    **권장 기본값:** provider stack에서 사용할 수 있는 가장 강력한 최신 세대 모델을 사용하세요.
    **도구가 활성화되었거나 신뢰할 수 없는 입력을 받는 agent:** 비용보다 모델 성능을 우선하세요.
    **일상적이거나 낮은 위험의 채팅:** 더 저렴한 fallback 모델을 사용하고 agent 역할별로 route하세요.

    MiniMax에는 자체 문서가 있습니다: [MiniMax](/ko/providers/minimax) 및
    [로컬 모델](/ko/gateway/local-models).

    경험칙: 고위험 작업에는 **감당할 수 있는 최고의 모델**을 사용하고, 일상 채팅이나 요약에는 더 저렴한
    모델을 사용하세요. agent별로 모델을 route하고 sub-agent를 사용해
    긴 작업을 병렬화할 수 있습니다(각 sub-agent는 token을 소비합니다). [모델](/ko/concepts/models) 및
    [Sub-agents](/ko/tools/subagents)를 참조하세요.

    강력한 경고: 더 약하거나 과도하게 양자화된 모델은 prompt
    injection 및 안전하지 않은 동작에 더 취약합니다. [보안](/ko/gateway/security)을 참조하세요.

    추가 컨텍스트: [모델](/ko/concepts/models).

  </Accordion>

  <Accordion title="설정을 지우지 않고 모델을 전환하려면 어떻게 하나요?">
    **model commands**를 사용하거나 **model** 필드만 편집하세요. 전체 config 교체는 피하세요.

    안전한 옵션:

    - 채팅에서 `/model`(빠른 per-session 설정)
    - `openclaw models set ...`(모델 config만 업데이트)
    - `openclaw configure --section model`(대화형)
    - `~/.openclaw/openclaw.json`에서 `agents.defaults.model` 편집

    전체 config를 교체하려는 의도가 아니라면 partial object로 `config.apply`를 사용하지 마세요.
    RPC 편집의 경우 먼저 `config.schema.lookup`으로 검사하고 `config.patch`를 선호하세요. lookup payload는 normalized path, 얕은 schema docs/constraints, 즉시 child summaries를 제공합니다.
    partial updates용입니다.
    config를 덮어쓴 경우 backup에서 복원하거나 `openclaw doctor`를 다시 실행해 복구하세요.

    문서: [모델](/ko/concepts/models), [Configure](/ko/cli/configure), [Config](/ko/cli/config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="self-hosted 모델(llama.cpp, vLLM, Ollama)을 사용할 수 있나요?">
    예. Ollama가 로컬 모델을 위한 가장 쉬운 경로입니다.

    가장 빠른 설정:

    1. `https://ollama.com/download`에서 Ollama를 설치합니다
    2. `ollama pull gemma4` 같은 로컬 모델을 pull합니다
    3. 클라우드 모델도 원한다면 `ollama signin`을 실행합니다
    4. `openclaw onboard`를 실행하고 `Ollama`를 선택합니다
    5. `Local` 또는 `Cloud + Local`을 선택합니다

    참고:

    - `Cloud + Local`은 클라우드 모델과 로컬 Ollama 모델을 함께 제공합니다
    - `kimi-k2.5:cloud` 같은 클라우드 모델은 로컬 pull이 필요하지 않습니다
    - 수동 전환에는 `openclaw models list`와 `openclaw models set ollama/<model>`을 사용하세요

    보안 참고: 더 작거나 강하게 양자화된 모델은 prompt
    injection에 더 취약합니다. 도구를 사용할 수 있는 bot에는 **대형 모델**을 강력히 권장합니다.
    그래도 작은 모델을 사용하려면 sandboxing과 엄격한 도구 allowlist를 활성화하세요.

    문서: [Ollama](/ko/providers/ollama), [로컬 모델](/ko/gateway/local-models),
    [모델 provider](/ko/concepts/model-providers), [보안](/ko/gateway/security),
    [Sandboxing](/ko/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd, Krill은 어떤 모델을 사용하나요?">
    - 이러한 배포는 서로 다를 수 있고 시간이 지나며 변경될 수 있습니다. 고정된 provider 추천은 없습니다.
    - 각 gateway에서 현재 runtime 설정을 `openclaw models status`로 확인하세요.
    - 보안에 민감하거나 도구가 활성화된 agent에는 사용 가능한 가장 강력한 최신 세대 모델을 사용하세요.

  </Accordion>

  <Accordion title="즉시(재시작 없이) 모델을 전환하려면 어떻게 하나요?">
    `/model` command를 독립 메시지로 사용하세요.

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    이는 내장 별칭입니다. 사용자 지정 별칭은 `agents.defaults.models`를 통해 추가할 수 있습니다.

    `/model`, `/model list` 또는 `/model status`로 사용 가능한 모델을 나열할 수 있습니다.

    `/model`(및 `/model list`)은 간결한 번호 매기기 picker를 표시합니다. 번호로 선택하세요.

    ```
    /model 3
    ```

    provider에 특정 인증 프로필을 강제할 수도 있습니다(per session).

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    팁: `/model status`는 어떤 agent가 활성 상태인지, 어떤 `auth-profiles.json` 파일이 사용 중인지, 다음에 어떤 인증 프로필을 시도할지 보여줍니다.
    사용 가능한 경우 설정된 provider endpoint(`baseUrl`)와 API mode(`api`)도 표시합니다.

    **@profile로 설정한 profile 고정을 해제하려면 어떻게 하나요?**

    `@profile` suffix 없이 `/model`을 다시 실행하세요.

    ```
    /model anthropic/claude-opus-4-6
    ```

    기본값으로 돌아가려면 `/model`에서 선택하거나 `/model <default provider/model>`을 보내세요.
    어떤 인증 프로필이 활성 상태인지 확인하려면 `/model status`를 사용하세요.

  </Accordion>

  <Accordion title="일상 작업에는 GPT 5.5를, coding에는 Codex 5.5를 사용할 수 있나요?">
    예. 모델 선택과 runtime 선택을 별도로 다루세요.

    - **네이티브 Codex coding agent:** `agents.defaults.model.primary`를 `openai/gpt-5.5`로 설정하세요. ChatGPT/Codex subscription auth를 원할 때 `openclaw models auth login --provider openai-codex`로 로그인하세요.
    - **agent loop 외부의 직접 OpenAI API 작업:** images, embeddings, speech, realtime 및 기타 non-agent OpenAI API surfaces용으로 `OPENAI_API_KEY`를 설정하세요.
    - **OpenAI agent API-key auth:** ordered `openai-codex` API-key profile과 함께 `/model openai/gpt-5.5`를 사용하세요.
    - **Sub-agents:** coding 작업을 자체 모델과 `agentRuntime` 기본값을 가진 Codex-only agent로 route하세요.

    [모델](/ko/concepts/models) 및 [Slash commands](/ko/tools/slash-commands)를 참조하세요.

  </Accordion>

  <Accordion title="GPT 5.5의 fast mode를 설정하려면 어떻게 하나요?">
    session toggle 또는 config default를 사용하세요.

    - **Per session:** session이 `openai/gpt-5.5`를 사용하는 동안 `/fast on`을 보내세요.
    - **Per model default:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode`를 `true`로 설정하세요.

    예:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI의 경우 fast mode는 지원되는 native Responses requests에서 `service_tier = "priority"`로 매핑됩니다. session `/fast` override가 config default보다 우선합니다.

    [Thinking and fast mode](/ko/tools/thinking) 및 [OpenAI fast mode](/ko/providers/openai#fast-mode)를 참조하세요.

  </Accordion>

  <Accordion title='왜 “Model ... is not allowed”가 표시된 뒤 답변이 없나요?'>
    `agents.defaults.models`가 설정되어 있으면 `/model` 및 모든
    session override의 **allowlist**가 됩니다. 해당 목록에 없는 모델을 선택하면 다음이 반환됩니다.

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    이 오류는 일반 답변 **대신** 반환됩니다. 해결: 모델을
    `agents.defaults.models`에 추가하거나, allowlist를 제거하거나, `/model list`에서 모델을 선택하세요.
    command에 `--runtime codex`도 포함되어 있었다면 먼저 모델을 추가한 다음
    동일한 `/model provider/model --runtime codex` command를 다시 시도하세요.

  </Accordion>

  <Accordion title='왜 “Unknown model: minimax/MiniMax-M2.7”가 표시되나요?'>
    이는 **provider가 설정되지 않았음**을 의미합니다(MiniMax provider config 또는 auth
    profile을 찾을 수 없음). 따라서 모델을 resolve할 수 없습니다.

    해결 체크리스트:

    1. 현재 OpenClaw release로 업그레이드하거나 source `main`에서 실행한 다음 gateway를 재시작하세요.
    2. MiniMax가 설정되어 있는지(wizard 또는 JSON), 또는 matching provider가 injected될 수 있도록 env/auth profiles에 MiniMax auth가
       존재하는지 확인하세요
       (`minimax`용 `MINIMAX_API_KEY`, `minimax-portal`용 `MINIMAX_OAUTH_TOKEN` 또는 저장된 MiniMax
       OAuth).
    3. auth path에 맞는 정확한 모델 ID(대소문자 구분)를 사용하세요.
       API-key
       설정에는 `minimax/MiniMax-M2.7` 또는 `minimax/MiniMax-M2.7-highspeed`, OAuth 설정에는
       `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. 다음을 실행하세요.

       ```bash
       openclaw models list
       ```

       그리고 목록에서 선택하세요(또는 채팅에서 `/model list`).

    [MiniMax](/ko/providers/minimax) 및 [모델](/ko/concepts/models)을 참조하세요.

  </Accordion>

  <Accordion title="MiniMax를 기본값으로 사용하고 복잡한 작업에는 OpenAI를 사용할 수 있나요?">
    예. **MiniMax를 기본값으로** 사용하고 필요할 때 **per session**으로 모델을 전환하세요.
    Fallback은 **오류**용이지 “어려운 작업”용이 아니므로 `/model` 또는 별도 agent를 사용하세요.

    **옵션 A: per session 전환**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    그런 다음:

    ```
    /model gpt
    ```

    **옵션 B: 별도 agents**

    - Agent A 기본값: MiniMax
    - Agent B 기본값: OpenAI
    - agent별로 route하거나 `/agent`를 사용해 전환

    문서: [모델](/ko/concepts/models), [Multi-Agent Routing](/ko/concepts/multi-agent), [MiniMax](/ko/providers/minimax), [OpenAI](/ko/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt는 내장 shortcut인가요?">
    예. OpenClaw는 몇 가지 기본 shorthand를 제공합니다(`agents.defaults.models`에 모델이 존재할 때만 적용됨).

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    같은 이름으로 자체 별칭을 설정하면 그 값이 우선합니다.

  </Accordion>

  <Accordion title="모델 shortcut(별칭)을 정의하거나 override하려면 어떻게 하나요?">
    별칭은 `agents.defaults.models.<modelId>.alias`에서 가져옵니다. 예:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    그러면 `/model sonnet`(또는 지원되는 경우 `/<alias>`)이 해당 모델 ID로 resolve됩니다.

  </Accordion>

  <Accordion title="OpenRouter나 Z.AI 같은 다른 provider의 모델을 추가하려면 어떻게 하나요?">
    OpenRouter(토큰당 과금, 많은 모델):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI(GLM 모델):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    provider/model을 참조했지만 필요한 provider 키가 없으면 런타임 인증 오류가 발생합니다(예: `No API key found for provider "zai"`).

    **새 agent를 추가한 후 provider의 API 키를 찾을 수 없음**

    이는 보통 **새 agent**의 인증 저장소가 비어 있음을 의미합니다. 인증은 agent별로 관리되며
    다음 위치에 저장됩니다.

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    해결 옵션:

    - `openclaw agents add <id>`를 실행하고 마법사에서 인증을 구성합니다.
    - 또는 기본 agent의 인증 저장소에서 이식 가능한 정적 `api_key` / `token` 프로필만 새 agent의 인증 저장소로 복사합니다.
    - OAuth 프로필의 경우, 새 agent가 자체 계정을 필요로 할 때 해당 agent에서 로그인합니다. 그렇지 않으면 OpenClaw는 refresh token을 복제하지 않고도 기본/main agent를 통해 읽을 수 있습니다.

    agent 간에 `agentDir`을 재사용하지 **마세요**. 인증/세션 충돌이 발생합니다.

  </Accordion>
</AccordionGroup>

## 모델 장애 조치와 "모든 모델 실패"

<AccordionGroup>
  <Accordion title="장애 조치는 어떻게 작동하나요?">
    장애 조치는 두 단계로 발생합니다.

    1. 같은 provider 내에서 **인증 프로필 순환**.
    2. `agents.defaults.model.fallbacks`의 다음 모델로 **모델 폴백**.

    실패한 프로필에는 쿨다운(지수 백오프)이 적용되므로, provider가 rate limit에 걸리거나 일시적으로 실패하더라도 OpenClaw는 계속 응답할 수 있습니다.

    rate limit 버킷에는 단순한 `429` 응답보다 더 많은 항목이 포함됩니다. OpenClaw는
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, 그리고 주기적
    사용 기간 제한(`weekly/monthly limit reached`) 같은 메시지도 장애 조치할 만한
    rate limit으로 처리합니다.

    과금처럼 보이는 일부 응답은 `402`가 아니며, 일부 HTTP `402`
    응답도 해당 일시적 버킷에 남습니다. provider가 `401` 또는 `403`에서
    명시적인 과금 관련 텍스트를 반환하면 OpenClaw는 여전히 이를
    과금 경로에 둘 수 있지만, provider별 텍스트 매처는 해당 매처를 소유한
    provider 범위에만 유지됩니다(예: OpenRouter `Key limit exceeded`). `402`
    메시지가 대신 재시도 가능한 사용 기간 또는
    조직/워크스페이스 지출 제한(`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`)처럼 보이면 OpenClaw는 이를 장기 과금 비활성화가 아닌
    `rate_limit`으로 처리합니다.

    컨텍스트 오버플로 오류는 다릅니다. `request_too_large`,
    `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, 또는 `ollama error: context length
    exceeded` 같은 시그니처는 모델 폴백을 진행하는 대신 Compaction/재시도 경로에 머뭅니다.

    일반 서버 오류 텍스트는 의도적으로 "unknown/error가 들어간 모든 것"보다 좁게 처리됩니다.
    OpenClaw는 Anthropic의 단독 `An unknown error occurred`, OpenRouter의 단독
    `Provider returned error`, `Unhandled stop reason:
    error` 같은 stop-reason 오류, 일시적 서버 텍스트가 포함된 JSON `api_error` 페이로드
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), 그리고 `ModelNotReadyException` 같은 provider 사용 중 오류처럼
    provider 범위의 일시적 형태를 provider 컨텍스트가 일치할 때
    장애 조치할 만한 타임아웃/과부하 신호로 처리합니다.
    `LLM request failed with an unknown
    error.` 같은 일반 내부 폴백 텍스트는 보수적으로 유지되며 그 자체만으로 모델 폴백을 트리거하지 않습니다.

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default"은 무엇을 의미하나요?'>
    이는 시스템이 인증 프로필 ID `anthropic:default`를 사용하려 했지만, 예상된 인증 저장소에서 해당 자격 증명을 찾지 못했다는 의미입니다.

    **해결 체크리스트:**

    - **인증 프로필이 어디에 있는지 확인**(신규 경로와 레거시 경로)
      - 현재: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 레거시: `~/.openclaw/agent/*`(`openclaw doctor`로 마이그레이션됨)
    - **env var가 Gateway에 로드되었는지 확인**
      - 셸에서 `ANTHROPIC_API_KEY`를 설정했지만 systemd/launchd를 통해 Gateway를 실행하면 이를 상속하지 않을 수 있습니다. `~/.openclaw/.env`에 넣거나 `env.shellEnv`를 활성화하세요.
    - **올바른 agent를 편집하고 있는지 확인**
      - 다중 agent 설정에서는 `auth-profiles.json` 파일이 여러 개 있을 수 있습니다.
    - **모델/인증 상태를 기본 점검**
      - `openclaw models status`를 사용해 구성된 모델과 provider 인증 여부를 확인합니다.

    **"No credentials found for profile anthropic" 해결 체크리스트**

    이는 실행이 Anthropic 인증 프로필에 고정되어 있지만 Gateway가
    인증 저장소에서 이를 찾을 수 없다는 의미입니다.

    - **Claude CLI 사용**
      - gateway 호스트에서 `openclaw models auth login --provider anthropic --method cli --set-default`를 실행합니다.
    - **대신 API 키를 사용하려는 경우**
      - **gateway 호스트**의 `~/.openclaw/.env`에 `ANTHROPIC_API_KEY`를 넣습니다.
      - 누락된 프로필을 강제로 사용하는 고정 순서를 지웁니다.

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **gateway 호스트에서 명령을 실행하고 있는지 확인**
      - 원격 모드에서는 인증 프로필이 노트북이 아니라 gateway 머신에 있습니다.

  </Accordion>

  <Accordion title="왜 Google Gemini도 시도하고 실패했나요?">
    모델 구성에 Google Gemini가 폴백으로 포함되어 있거나 Gemini 축약형으로 전환한 경우, OpenClaw는 모델 폴백 중 이를 시도합니다. Google 자격 증명을 구성하지 않았다면 `No API key found for provider "google"`이 표시됩니다.

    해결: Google 인증을 제공하거나, 폴백이 그쪽으로 라우팅되지 않도록 `agents.defaults.model.fallbacks` / 별칭에서 Google 모델을 제거하거나 피하세요.

    **LLM 요청 거부됨: thinking signature 필요(Google Antigravity)**

    원인: 세션 기록에 **서명이 없는 thinking 블록**이 포함되어 있습니다(중단되었거나 부분적인 스트림에서 자주 발생).
    Google Antigravity는 thinking 블록에 서명을 요구합니다.

    해결: OpenClaw는 이제 Google Antigravity Claude에 대해 서명되지 않은 thinking 블록을 제거합니다. 여전히 나타나면 **새 세션**을 시작하거나 해당 agent에 `/thinking off`를 설정하세요.

  </Accordion>
</AccordionGroup>

## 인증 프로필: 무엇이며 어떻게 관리하나요?

관련: [/concepts/oauth](/ko/concepts/oauth)(OAuth 흐름, token 저장소, 다중 계정 패턴)

<AccordionGroup>
  <Accordion title="인증 프로필이란 무엇인가요?">
    인증 프로필은 provider에 연결된 이름 있는 자격 증명 레코드(OAuth 또는 API 키)입니다. 프로필은 다음 위치에 있습니다.

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    저장된 프로필을 비밀 정보 없이 검사하려면 `openclaw models auth list`를 실행합니다(선택적으로 `--provider <id>` 또는 `--json`). 자세한 내용은 [Models CLI](/ko/cli/models#auth-profiles)를 참조하세요.

  </Accordion>

  <Accordion title="일반적인 프로필 ID는 무엇인가요?">
    OpenClaw는 다음과 같은 provider 접두사 ID를 사용합니다.

    - `anthropic:default`(email identity가 없을 때 일반적)
    - OAuth identity의 경우 `anthropic:<email>`
    - 직접 선택한 사용자 지정 ID(예: `anthropic:work`)

  </Accordion>

  <Accordion title="어떤 인증 프로필을 먼저 시도할지 제어할 수 있나요?">
    예. 구성은 프로필에 대한 선택적 메타데이터와 provider별 순서(`auth.order.<provider>`)를 지원합니다. 이는 비밀 정보를 저장하지 않으며, ID를 provider/mode에 매핑하고 순환 순서를 설정합니다.

    프로필이 짧은 **쿨다운**(rate limit/타임아웃/인증 실패) 또는 더 긴 **비활성화** 상태(과금/크레딧 부족)에 있으면 OpenClaw가 일시적으로 건너뛸 수 있습니다. 이를 검사하려면 `openclaw models status --json`을 실행하고 `auth.unusableProfiles`를 확인합니다. 튜닝: `auth.cooldowns.billingBackoffHours*`.

    rate limit 쿨다운은 모델 범위일 수 있습니다. 한 모델에 대해 쿨다운 중인 프로필도
    같은 provider의 형제 모델에서는 여전히 사용할 수 있으며,
    과금/비활성화 기간은 여전히 전체 프로필을 차단합니다.

    CLI를 통해 **agent별** 순서 재정의(해당 agent의 `auth-state.json`에 저장됨)도 설정할 수 있습니다.

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    특정 agent를 대상으로 하려면:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    실제로 무엇이 시도될지 확인하려면 다음을 사용하세요.

    ```bash
    openclaw models status --probe
    ```

    저장된 프로필이 명시적 순서에서 생략되면 probe는 조용히 시도하는 대신
    해당 프로필에 대해 `excluded_by_auth_order`를 보고합니다.

  </Accordion>

  <Accordion title="OAuth와 API 키의 차이는 무엇인가요?">
    OpenClaw는 둘 다 지원합니다.

    - **OAuth**는 적용 가능한 경우 구독 액세스를 활용하는 경우가 많습니다.
    - **API 키**는 토큰당 과금을 사용합니다.

    마법사는 Anthropic Claude CLI, OpenAI Codex OAuth, API 키를 명시적으로 지원합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [FAQ](/ko/help/faq) — 기본 FAQ
- [FAQ — 빠른 시작 및 최초 실행 설정](/ko/help/faq-first-run)
- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
