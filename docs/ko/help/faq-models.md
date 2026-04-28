---
read_when:
    - 모델 선택 또는 전환, 별칭 구성
    - 모델 장애 조치 / "All models failed" 디버깅
    - auth profile이 무엇인지와 이를 관리하는 방법 이해하기
sidebarTitle: Models FAQ
summary: 'FAQ: 모델 기본값, 선택, 별칭, 전환, 장애 조치, 및 auth profile'
title: 'FAQ: 모델 및 auth'
x-i18n:
    generated_at: "2026-04-25T18:19:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  모델 및 auth profile 관련 Q&A입니다. 설정, 세션, Gateway, 채널,
  문제 해결은 메인 [FAQ](/ko/help/faq)를 참조하세요.

  ## 모델: 기본값, 선택, 별칭, 전환

  <AccordionGroup>
  <Accordion title='“기본 모델”이란 무엇인가요?'>
    OpenClaw의 기본 모델은 다음으로 설정한 값입니다:

    ```
    agents.defaults.model.primary
    ```

    모델은 `provider/model` 형식으로 참조합니다(예: `openai/gpt-5.5` 또는 `openai-codex/gpt-5.5`). provider를 생략하면 OpenClaw는 먼저 별칭을 시도하고, 그다음 해당 정확한 모델 id에 대해 고유하게 구성된 provider 일치를 시도하며, 마지막으로만 더 이상 권장되지 않는 호환성 경로로 구성된 기본 provider로 fallback합니다. 해당 provider가 더 이상 구성된 기본 모델을 제공하지 않으면, OpenClaw는 오래되어 제거된 provider 기본값을 노출하는 대신 첫 번째로 구성된 provider/model로 fallback합니다. 그래도 `provider/model`을 **명시적으로** 설정하는 것이 좋습니다.

  </Accordion>

  <Accordion title="어떤 모델을 권장하나요?">
    **권장 기본값:** 현재 provider 스택에서 사용할 수 있는 가장 강력한 최신 세대 모델을 사용하세요.
    **도구가 활성화되었거나 신뢰할 수 없는 입력을 받는 agent의 경우:** 비용보다 모델 성능을 우선하세요.
    **일상적이거나 중요도가 낮은 채팅의 경우:** 더 저렴한 fallback 모델을 사용하고 agent 역할별로 라우팅하세요.

    MiniMax에는 전용 문서가 있습니다: [MiniMax](/ko/providers/minimax) 및
    [로컬 모델](/ko/gateway/local-models).

    경험칙: 중요한 작업에는 **감당 가능한 범위에서 최고의 모델**을 사용하고, 일상적인 채팅이나 요약에는 더 저렴한
    모델을 사용하세요. agent별로 모델을 라우팅할 수 있으며, 하위 agent를 사용해 긴 작업을
    병렬화할 수 있습니다(각 하위 agent는 토큰을 소비합니다). [모델](/ko/concepts/models) 및
    [하위 agent](/ko/tools/subagents)를 참조하세요.

    강한 경고: 더 약하거나 과도하게 양자화된 모델은 prompt
    injection 및 안전하지 않은 동작에 더 취약합니다. [보안](/ko/gateway/security)을 참조하세요.

    추가 설명: [모델](/ko/concepts/models).

  </Accordion>

  <Accordion title="config를 지우지 않고 모델을 전환하려면 어떻게 하나요?">
    **모델 명령**을 사용하거나 **model** 필드만 수정하세요. 전체 config 교체는 피하세요.

    안전한 방법:

    - 채팅에서 `/model` 사용(빠름, 세션별)
    - `openclaw models set ...` (`model` config만 업데이트)
    - `openclaw configure --section model` (대화형)
    - `~/.openclaw/openclaw.json`에서 `agents.defaults.model` 편집

    전체 config를 교체할 의도가 없다면 부분 객체로 `config.apply`를 사용하지 마세요.
    RPC 편집의 경우 먼저 `config.schema.lookup`으로 확인하고 `config.patch`를 우선 사용하세요.
    lookup payload는 정규화된 경로, 얕은 schema 문서/제약 조건, 즉시 하위 항목 요약을 제공합니다.
    부분 업데이트용입니다.
    config를 덮어썼다면 백업에서 복원하거나 `openclaw doctor`를 다시 실행해 복구하세요.

    문서: [모델](/ko/concepts/models), [설정](/ko/cli/configure), [Config](/ko/cli/config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="self-hosted 모델(llama.cpp, vLLM, Ollama)을 사용할 수 있나요?">
    예. 로컬 모델에는 Ollama가 가장 쉬운 경로입니다.

    가장 빠른 설정:

    1. `https://ollama.com/download`에서 Ollama 설치
    2. `ollama pull gemma4` 같은 로컬 모델 다운로드
    3. cloud 모델도 원하면 `ollama signin` 실행
    4. `openclaw onboard`를 실행하고 `Ollama` 선택
    5. `Local` 또는 `Cloud + Local` 선택

    참고:

    - `Cloud + Local`은 cloud 모델과 로컬 Ollama 모델을 함께 제공합니다
    - `kimi-k2.5:cloud` 같은 cloud 모델은 로컬 pull이 필요하지 않습니다
    - 수동 전환은 `openclaw models list` 및 `openclaw models set ollama/<model>` 사용

    보안 참고: 더 작거나 많이 양자화된 모델은 prompt
    injection에 더 취약합니다. 도구를 사용할 수 있는 봇에는 **대형 모델**을 강력히 권장합니다.
    그래도 작은 모델을 사용하려면 sandboxing과 엄격한 도구 allowlist를 활성화하세요.

    문서: [Ollama](/ko/providers/ollama), [로컬 모델](/ko/gateway/local-models),
    [모델 provider](/ko/concepts/model-providers), [보안](/ko/gateway/security),
    [샌드박싱](/ko/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd, Krill은 모델로 무엇을 사용하나요?">
    - 이러한 배포는 서로 다를 수 있고 시간에 따라 바뀔 수 있으며, 고정된 provider 권장 사항은 없습니다.
    - 각 Gateway의 현재 런타임 설정은 `openclaw models status`로 확인하세요.
    - 보안에 민감하거나 도구가 활성화된 agent에는 사용 가능한 최신 세대의 가장 강력한 모델을 사용하세요.

  </Accordion>

  <Accordion title="재시작 없이 즉시 모델을 전환하려면 어떻게 하나요?">
    독립 메시지로 `/model` 명령을 사용하세요:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    위는 내장 별칭입니다. 사용자 지정 별칭은 `agents.defaults.models`로 추가할 수 있습니다.

    사용 가능한 모델은 `/model`, `/model list`, `/model status`로 확인할 수 있습니다.

    `/model`(및 `/model list`)은 간결한 번호 선택기를 표시합니다. 번호로 선택하세요:

    ```
    /model 3
    ```

    provider에 대해 특정 auth profile을 강제로 사용할 수도 있습니다(세션별):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    팁: `/model status`는 어떤 agent가 활성 상태인지, 어떤 `auth-profiles.json` 파일이 사용 중인지, 다음에 어떤 auth profile을 시도할지를 보여줍니다.
    또한 가능한 경우 구성된 provider endpoint(`baseUrl`)와 API 모드(`api`)도 표시합니다.

    **`@profile`로 설정한 profile 고정을 해제하려면 어떻게 하나요?**

    `@profile` 접미사 **없이** `/model`을 다시 실행하세요:

    ```
    /model anthropic/claude-opus-4-6
    ```

    기본값으로 돌아가려면 `/model`에서 기본값을 선택하세요(또는 `/model <default provider/model>` 전송).
    어떤 auth profile이 활성 상태인지 확인하려면 `/model status`를 사용하세요.

  </Accordion>

  <Accordion title="일상 작업에는 GPT 5.5를, 코딩에는 Codex 5.5를 사용할 수 있나요?">
    예. 하나를 기본값으로 설정하고 필요에 따라 전환하세요:

    - **빠른 전환(세션별):** 현재 direct OpenAI API-key 작업에는 `/model openai/gpt-5.5`, GPT-5.5 Codex OAuth 작업에는 `/model openai-codex/gpt-5.5` 사용
    - **기본값:** API-key 사용에는 `agents.defaults.model.primary`를 `openai/gpt-5.5`로, GPT-5.5 Codex OAuth 사용에는 `openai-codex/gpt-5.5`로 설정
    - **하위 agent:** 코딩 작업은 다른 기본 모델을 사용하는 하위 agent로 라우팅

    [모델](/ko/concepts/models) 및 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

  </Accordion>

  <Accordion title="GPT 5.5에서 fast mode를 구성하려면 어떻게 하나요?">
    세션 토글 또는 config 기본값 중 하나를 사용하세요:

    - **세션별:** 세션이 `openai/gpt-5.5` 또는 `openai-codex/gpt-5.5`를 사용하는 동안 `/fast on` 전송
    - **모델별 기본값:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 또는 `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode`를 `true`로 설정

    예시:

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

    OpenAI에서 fast mode는 지원되는 네이티브 Responses 요청의 `service_tier = "priority"`에 매핑됩니다. 세션 `/fast` 재정의는 config 기본값보다 우선합니다.

    [Thinking and fast mode](/ko/tools/thinking) 및 [OpenAI fast mode](/ko/providers/openai#fast-mode)를 참조하세요.

  </Accordion>

  <Accordion title='왜 "Model ... is not allowed"가 표시되고 그 뒤에 응답이 없나요?'>
    `agents.defaults.models`가 설정되어 있으면 이것이 `/model`과 모든
    세션 재정의에 대한 **allowlist**가 됩니다. 이 목록에 없는 모델을 선택하면 다음이 반환됩니다:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    이 오류는 일반 응답 **대신** 반환됩니다. 해결 방법: 모델을
    `agents.defaults.models`에 추가하거나, allowlist를 제거하거나, `/model list`에서 모델을 선택하세요.

  </Accordion>

  <Accordion title='왜 "Unknown model: minimax/MiniMax-M2.7"가 표시되나요?'>
    이는 **provider가 구성되지 않았기 때문**입니다(MiniMax provider config 또는 auth
    profile을 찾지 못함). 따라서 모델을 확인할 수 없습니다.

    해결 체크리스트:

    1. 현재 OpenClaw 릴리스로 업그레이드(또는 소스 `main`에서 실행)한 뒤 Gateway를 재시작하세요.
    2. MiniMax가 구성되어 있는지(마법사 또는 JSON), 또는 MiniMax auth가
       env/auth profiles에 존재하여 일치하는 provider가 주입될 수 있는지 확인하세요
       (`minimax`에는 `MINIMAX_API_KEY`, `minimax-portal`에는 `MINIMAX_OAUTH_TOKEN` 또는 저장된 MiniMax
       OAuth).
    3. auth 경로에 맞는 정확한 모델 id(대소문자 구분)를 사용하세요:
       API-key
       설정에는 `minimax/MiniMax-M2.7` 또는 `minimax/MiniMax-M2.7-highspeed`,
       OAuth 설정에는 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. 다음을 실행하세요:

       ```bash
       openclaw models list
       ```

       그리고 목록에서 선택하세요(또는 채팅에서 `/model list`).

    [MiniMax](/ko/providers/minimax) 및 [모델](/ko/concepts/models)을 참조하세요.

  </Accordion>

  <Accordion title="MiniMax를 기본값으로 하고 복잡한 작업에는 OpenAI를 사용할 수 있나요?">
    예. **MiniMax를 기본값으로** 사용하고 필요할 때 **세션별로** 모델을 전환하세요.
    fallback은 **오류용**이지 “어려운 작업”용이 아니므로 `/model` 또는 별도의 agent를 사용하세요.

    **옵션 A: 세션별 전환**

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

    그다음:

    ```
    /model gpt
    ```

    **옵션 B: 별도 agent**

    - Agent A 기본값: MiniMax
    - Agent B 기본값: OpenAI
    - agent별로 라우팅하거나 `/agent`로 전환

    문서: [모델](/ko/concepts/models), [멀티 agent 라우팅](/ko/concepts/multi-agent), [MiniMax](/ko/providers/minimax), [OpenAI](/ko/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt는 내장 shortcut인가요?">
    예. OpenClaw는 몇 가지 기본 shorthand를 제공합니다(`agents.defaults.models`에 해당 모델이 존재할 때만 적용됨):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API-key 설정에서는 `openai/gpt-5.5`, Codex OAuth로 구성된 경우에는 `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    같은 이름으로 직접 별칭을 설정하면 사용자 값이 우선합니다.

  </Accordion>

  <Accordion title="모델 shortcut(별칭)을 정의/재정의하려면 어떻게 하나요?">
    별칭은 `agents.defaults.models.<modelId>.alias`에서 가져옵니다. 예시:

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

    그러면 `/model sonnet`(또는 지원되는 경우 `/<alias>`)이 해당 모델 ID로 확인됩니다.

  </Accordion>

  <Accordion title="OpenRouter나 Z.AI 같은 다른 provider의 모델을 추가하려면 어떻게 하나요?">
    OpenRouter(토큰당 과금, 다양한 모델):

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

    provider/model을 참조했는데 필요한 provider 키가 없으면 런타임 auth 오류가 발생합니다(예: `No API key found for provider "zai"`).

    **새 agent를 추가한 후 No API key found for provider가 표시됨**

    이는 보통 **새 agent**에 비어 있는 auth 저장소가 있다는 뜻입니다. Auth는 agent별이며
    다음 위치에 저장됩니다:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    해결 방법:

    - `openclaw agents add <id>`를 실행하고 마법사에서 auth를 구성합니다.
    - 또는 메인 agent의 `agentDir`에서 새 agent의 `agentDir`로 `auth-profiles.json`을 복사합니다.

    agent 간에 `agentDir`를 재사용하지 마세요. auth/세션 충돌이 발생합니다.

  </Accordion>
</AccordionGroup>

## 모델 장애 조치와 "All models failed"

<AccordionGroup>
  <Accordion title="장애 조치는 어떻게 작동하나요?">
    장애 조치는 두 단계로 이루어집니다:

    1. 같은 provider 내에서 **auth profile 순환**
    2. `agents.defaults.model.fallbacks`의 다음 모델로 **모델 fallback**

    실패하는 profile에는 cooldown이 적용되며(지수 백오프), 이를 통해 provider가 rate limit에 걸리거나 일시적으로 실패해도 OpenClaw가 계속 응답할 수 있습니다.

    rate-limit bucket에는 단순한 `429` 응답만 포함되지 않습니다. OpenClaw는
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, 그리고 주기적
    사용량 창 제한(`weekly/monthly limit reached`)과 같은 메시지도
    장애 조치할 만한 rate limit으로 처리합니다.

    일부 과금 관련 응답은 `402`가 아니며, 일부 HTTP `402`
    응답도 이 일시적 bucket에 남습니다. provider가
    `401` 또는 `403`에서 명시적인 과금 텍스트를 반환하면 OpenClaw는 여전히 이를
    billing 레인에 둘 수 있지만, provider별 텍스트 matcher는 해당 provider 범위 내에서만 유지됩니다
    (예: OpenRouter `Key limit exceeded`). 대신 `402`
    메시지가 재시도 가능한 사용량 창 또는
    조직/워크스페이스 지출 한도(`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`)처럼 보이면, OpenClaw는 이를
    장기 billing 비활성화가 아니라 `rate_limit`으로 처리합니다.

    컨텍스트 초과 오류는 다릅니다. 예를 들어
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, 또는 `ollama error: context length
    exceeded`와 같은 시그니처는 모델 fallback으로 넘어가지 않고
    Compaction/재시도 경로에 남습니다.

    일반적인 서버 오류 텍스트는 의도적으로 “그 안에 unknown/error가 들어간 모든 것”보다
    더 좁게 처리됩니다. OpenClaw는 provider 컨텍스트가 일치할 때
    Anthropic의 순수 `An unknown error occurred`, OpenRouter의 순수
    `Provider returned error`, `Unhandled stop reason:
    error` 같은 stop-reason 오류, 일시적인 서버 텍스트를 포함한 JSON `api_error` payload
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), 그리고 `ModelNotReadyException` 같은 provider-busy 오류를
    장애 조치할 만한 timeout/과부하 신호로 처리합니다.
    `LLM request failed with an unknown
    error.` 같은 일반적인 내부 fallback 텍스트는 보수적으로 유지되며,
    그 자체만으로는 모델 fallback을 트리거하지 않습니다.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default”는 무슨 뜻인가요?'>
    이는 시스템이 auth profile ID `anthropic:default`를 사용하려고 했지만, 예상된 auth 저장소에서 해당 자격 증명을 찾지 못했다는 뜻입니다.

    **해결 체크리스트:**

    - **auth profile이 어디에 저장되는지 확인**(새 경로 vs 레거시 경로)
      - 현재: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 레거시: `~/.openclaw/agent/*` (`openclaw doctor`가 마이그레이션)
    - **env var가 Gateway에 로드되는지 확인**
      - 셸에서 `ANTHROPIC_API_KEY`를 설정했더라도 Gateway를 systemd/launchd로 실행하면 상속되지 않을 수 있습니다. `~/.openclaw/.env`에 넣거나 `env.shellEnv`를 활성화하세요.
    - **올바른 agent를 편집하고 있는지 확인**
      - 멀티 agent 설정에서는 `auth-profiles.json` 파일이 여러 개 있을 수 있습니다.
    - **모델/auth 상태를 기본 점검**
      - `openclaw models status`를 사용해 구성된 모델과 provider 인증 여부를 확인하세요.

    **“No credentials found for profile anthropic” 해결 체크리스트**

    이는 실행이 Anthropic auth profile에 고정되어 있지만, Gateway가
    auth 저장소에서 이를 찾지 못한다는 뜻입니다.

    - **Claude CLI 사용**
      - Gateway 호스트에서 `openclaw models auth login --provider anthropic --method cli --set-default`를 실행하세요.
    - **대신 API key를 사용하려는 경우**
      - **Gateway 호스트**의 `~/.openclaw/.env`에 `ANTHROPIC_API_KEY`를 넣으세요.
      - 없는 profile을 강제하는 고정 순서를 지우세요:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gateway 호스트에서 명령을 실행 중인지 확인**
      - 원격 모드에서는 auth profile이 노트북이 아니라 Gateway 머신에 저장됩니다.

  </Accordion>

  <Accordion title="왜 Google Gemini도 시도했다가 실패했나요?">
    모델 config에 Google Gemini가 fallback으로 포함되어 있거나(Gemini shorthand로 전환한 경우 포함), OpenClaw는 모델 fallback 중에 이를 시도합니다. Google 자격 증명을 구성하지 않았다면 `No API key found for provider "google"`가 표시됩니다.

    해결 방법: Google auth를 제공하거나, fallback이 그쪽으로 라우팅되지 않도록 `agents.defaults.model.fallbacks` / 별칭에서 Google 모델을 제거하거나 피하세요.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    원인: 세션 기록에 **서명이 없는 thinking 블록**이 포함되어 있습니다(보통
    중단되었거나 부분적인 스트림에서 발생). Google Antigravity는 thinking 블록에 서명이 필요합니다.

    해결 방법: OpenClaw는 이제 Google Antigravity Claude에 대해 서명되지 않은 thinking 블록을 제거합니다. 그래도 계속 나타나면 **새 세션**을 시작하거나 해당 agent에 `/thinking off`를 설정하세요.

  </Accordion>
</AccordionGroup>

## Auth profile: 무엇이며 어떻게 관리하나요

관련: [/concepts/oauth](/ko/concepts/oauth) (OAuth 흐름, 토큰 저장소, 멀티 계정 패턴)

<AccordionGroup>
  <Accordion title="auth profile이란 무엇인가요?">
    auth profile은 provider에 연결된 이름 있는 자격 증명 레코드(OAuth 또는 API key)입니다. profile은 다음 위치에 저장됩니다:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="일반적인 profile ID는 무엇인가요?">
    OpenClaw는 다음과 같은 provider 접두사 ID를 사용합니다:

    - `anthropic:default` (이메일 identity가 없을 때 흔함)
    - OAuth identity의 경우 `anthropic:<email>`
    - 사용자가 선택한 사용자 지정 ID(예: `anthropic:work`)

  </Accordion>

  <Accordion title="어떤 auth profile을 먼저 시도할지 제어할 수 있나요?">
    예. config는 profile의 선택적 metadata와 provider별 순서(`auth.order.<provider>`)를 지원합니다. 이는 비밀 정보를 저장하지 않고, ID를 provider/mode에 매핑하며 순환 순서를 설정합니다.

    OpenClaw는 profile이 짧은 **cooldown**(rate limit/timeout/auth 실패) 또는 더 긴 **disabled** 상태(billing/insufficient credits)에 있으면 일시적으로 건너뛸 수 있습니다. 이를 확인하려면 `openclaw models status --json`을 실행하고 `auth.unusableProfiles`를 확인하세요. 조정 항목: `auth.cooldowns.billingBackoffHours*`.

    rate-limit cooldown은 모델 범위로 적용될 수 있습니다. 한 모델에 대해 cooldown
    중인 profile이라도 같은 provider의 형제 모델에서는 여전히 사용할 수 있을 수 있지만,
    billing/disabled 기간은 여전히 profile 전체를 차단합니다.

    CLI를 통해 **agent별** 순서 재정의(`auth-state.json`에 저장)를 설정할 수도 있습니다:

    ```bash
    # 구성된 기본 agent를 기본값으로 사용(--agent 생략)
    openclaw models auth order get --provider anthropic

    # 순환을 단일 profile에 고정(이 profile만 시도)
    openclaw models auth order set --provider anthropic anthropic:default

    # 또는 명시적 순서 설정(provider 내부 fallback)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 재정의 삭제(config auth.order / round-robin으로 fallback)
    openclaw models auth order clear --provider anthropic
    ```

    특정 agent를 대상으로 하려면:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    실제로 무엇이 시도될지 확인하려면 다음을 사용하세요:

    ```bash
    openclaw models status --probe
    ```

    저장된 profile이 명시적 순서에서 빠져 있으면, probe는
    이를 조용히 시도하는 대신 해당 profile에 대해 `excluded_by_auth_order`를 보고합니다.

  </Accordion>

  <Accordion title="OAuth와 API key의 차이점은 무엇인가요?">
    OpenClaw는 둘 다 지원합니다:

    - **OAuth**는 종종 구독 기반 접근을 활용합니다(해당되는 경우).
    - **API key**는 토큰당 과금 방식을 사용합니다.

    마법사는 Anthropic Claude CLI, OpenAI Codex OAuth, API key를 명시적으로 지원합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [FAQ](/ko/help/faq) — 메인 FAQ
- [FAQ — 빠른 시작 및 첫 실행 설정](/ko/help/faq-first-run)
- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
