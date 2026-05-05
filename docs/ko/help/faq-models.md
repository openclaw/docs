---
read_when:
    - 모델 선택 또는 전환, 별칭 구성
    - 모델 장애 조치 / "모든 모델이 실패했습니다" 디버깅
    - 인증 프로필 이해 및 관리 방법
sidebarTitle: Models FAQ
summary: 'FAQ: 모델 기본값, 선택, 별칭, 전환, 장애 조치 및 인증 프로필'
title: '자주 묻는 질문: 모델 및 인증'
x-i18n:
    generated_at: "2026-05-05T01:47:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  모델 및 인증 프로필 Q&A. 설정, 세션, Gateway, 채널 및 문제 해결은 기본 [FAQ](/ko/help/faq)를 참조하세요.

  ## 모델: 기본값, 선택, 별칭, 전환

  <AccordionGroup>
  <Accordion title='“기본 모델”이란 무엇인가요?'>
    OpenClaw의 기본 모델은 다음으로 설정한 값입니다.

    ```
    agents.defaults.model.primary
    ```

    모델은 `provider/model` 형식으로 참조됩니다(예: `openai/gpt-5.5` 또는 `openai-codex/gpt-5.5`). 제공자를 생략하면 OpenClaw는 먼저 별칭을 시도하고, 그다음 정확한 모델 id에 대해 구성된 제공자가 하나뿐인 일치를 찾으며, 그 후에야 더 이상 권장되지 않는 호환 경로로 구성된 기본 제공자로 대체합니다. 해당 제공자가 구성된 기본 모델을 더 이상 노출하지 않으면, OpenClaw는 오래되어 제거된 제공자 기본값을 표시하는 대신 처음 구성된 provider/model로 대체합니다. 그래도 `provider/model`을 **명시적으로** 설정해야 합니다.

  </Accordion>

  <Accordion title="어떤 모델을 추천하나요?">
    **권장 기본값:** 제공자 스택에서 사용할 수 있는 가장 강력한 최신 세대 모델을 사용하세요.
    **도구를 사용할 수 있거나 신뢰할 수 없는 입력을 받는 에이전트:** 비용보다 모델 성능을 우선하세요.
    **일상적이거나 위험도가 낮은 채팅:** 더 저렴한 대체 모델을 사용하고 에이전트 역할에 따라 라우팅하세요.

    MiniMax에는 자체 문서가 있습니다. [MiniMax](/ko/providers/minimax) 및
    [로컬 모델](/ko/gateway/local-models)을 참조하세요.

    경험칙: 중요한 작업에는 **감당할 수 있는 최고의 모델**을 사용하고, 일상 채팅이나 요약에는 더 저렴한
    모델을 사용하세요. 에이전트별로 모델을 라우팅하고 하위 에이전트를 사용해
    긴 작업을 병렬화할 수 있습니다(각 하위 에이전트는 토큰을 소비합니다). [모델](/ko/concepts/models) 및
    [하위 에이전트](/ko/tools/subagents)를 참조하세요.

    강한 경고: 더 약하거나 과도하게 양자화된 모델은 프롬프트
    주입 및 안전하지 않은 동작에 더 취약합니다. [보안](/ko/gateway/security)을 참조하세요.

    추가 배경: [모델](/ko/concepts/models).

  </Accordion>

  <Accordion title="구성을 지우지 않고 모델을 어떻게 전환하나요?">
    **모델 명령**을 사용하거나 **model** 필드만 편집하세요. 전체 구성 교체는 피하세요.

    안전한 옵션:

    - 채팅에서 `/model` 사용(빠른 세션별 전환)
    - `openclaw models set ...`(모델 구성만 업데이트)
    - `openclaw configure --section model`(대화형)
    - `~/.openclaw/openclaw.json`에서 `agents.defaults.model` 편집

    전체 구성을 교체하려는 의도가 아니라면 부분 객체로 `config.apply`를 사용하는 것을 피하세요.
    RPC 편집의 경우 먼저 `config.schema.lookup`으로 검사하고 `config.patch`를 선호하세요. lookup 페이로드는 정규화된 경로, 얕은 스키마 문서/제약 조건, 즉시 하위 요약을 제공합니다.
    부분 업데이트에 사용하세요.
    구성을 덮어썼다면 백업에서 복원하거나 `openclaw doctor`를 다시 실행해 복구하세요.

    문서: [모델](/ko/concepts/models), [구성](/ko/cli/configure), [Config](/ko/cli/config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="자체 호스팅 모델(llama.cpp, vLLM, Ollama)을 사용할 수 있나요?">
    예. Ollama가 로컬 모델을 위한 가장 쉬운 경로입니다.

    가장 빠른 설정:

    1. `https://ollama.com/download`에서 Ollama를 설치합니다.
    2. `ollama pull gemma4`와 같은 로컬 모델을 가져옵니다.
    3. 클라우드 모델도 원한다면 `ollama signin`을 실행합니다.
    4. `openclaw onboard`를 실행하고 `Ollama`를 선택합니다.
    5. `Local` 또는 `Cloud + Local`을 선택합니다.

    참고:

    - `Cloud + Local`은 클라우드 모델과 로컬 Ollama 모델을 함께 제공합니다.
    - `kimi-k2.5:cloud` 같은 클라우드 모델은 로컬 pull이 필요하지 않습니다.
    - 수동 전환에는 `openclaw models list` 및 `openclaw models set ollama/<model>`을 사용하세요.

    보안 참고: 더 작거나 많이 양자화된 모델은 프롬프트
    주입에 더 취약합니다. 도구를 사용할 수 있는 모든 봇에는 **대형 모델**을 강력히 권장합니다.
    그래도 작은 모델을 사용하려면 샌드박싱과 엄격한 도구 허용 목록을 활성화하세요.

    문서: [Ollama](/ko/providers/ollama), [로컬 모델](/ko/gateway/local-models),
    [모델 제공자](/ko/concepts/model-providers), [보안](/ko/gateway/security),
    [샌드박싱](/ko/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd, Krill은 어떤 모델을 사용하나요?">
    - 이러한 배포는 서로 다를 수 있으며 시간이 지나면서 변경될 수 있습니다. 고정된 제공자 추천은 없습니다.
    - 각 Gateway에서 `openclaw models status`로 현재 런타임 설정을 확인하세요.
    - 보안에 민감하거나 도구를 사용할 수 있는 에이전트에는 사용할 수 있는 가장 강력한 최신 세대 모델을 사용하세요.

  </Accordion>

  <Accordion title="재시작하지 않고 즉시 모델을 어떻게 전환하나요?">
    `/model` 명령을 독립 메시지로 사용하세요.

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    이것들은 내장 별칭입니다. 사용자 지정 별칭은 `agents.defaults.models`를 통해 추가할 수 있습니다.

    사용 가능한 모델은 `/model`, `/model list` 또는 `/model status`로 나열할 수 있습니다.

    `/model`(및 `/model list`)은 간결한 번호 선택기를 표시합니다. 번호로 선택하세요.

    ```
    /model 3
    ```

    제공자에 대해 특정 인증 프로필을 강제로 지정할 수도 있습니다(세션별).

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    팁: `/model status`는 어떤 에이전트가 활성 상태인지, 어떤 `auth-profiles.json` 파일이 사용 중인지, 다음에 어떤 인증 프로필이 시도될지를 보여줍니다.
    또한 사용 가능한 경우 구성된 제공자 엔드포인트(`baseUrl`)와 API 모드(`api`)도 보여줍니다.

    **@profile로 설정한 프로필 고정을 어떻게 해제하나요?**

    `@profile` 접미사 **없이** `/model`을 다시 실행하세요.

    ```
    /model anthropic/claude-opus-4-6
    ```

    기본값으로 돌아가려면 `/model`에서 선택하거나 `/model <default provider/model>`을 보내세요.
    어떤 인증 프로필이 활성 상태인지 확인하려면 `/model status`를 사용하세요.

  </Accordion>

  <Accordion title="일상 작업에는 GPT 5.5를, 코딩에는 Codex 5.5를 사용할 수 있나요?">
    예. 모델 선택과 런타임 선택을 별도로 다루세요.

    - **네이티브 Codex 코딩 에이전트:** `agents.defaults.model.primary`를 `openai/gpt-5.5`로 설정하고 `agents.defaults.agentRuntime.id`를 `"codex"`로 설정하세요. ChatGPT/Codex 구독 인증을 사용하려면 `openclaw models auth login --provider openai-codex`로 로그인하세요.
    - **PI를 통한 직접 OpenAI API 작업:** Codex 런타임 재정의 없이 `/model openai/gpt-5.5`를 사용하고 `OPENAI_API_KEY`를 구성하세요.
    - **PI를 통한 Codex OAuth:** 일반 PI 러너에서 Codex OAuth를 의도적으로 사용하려는 경우에만 `/model openai-codex/gpt-5.5`를 사용하세요.
    - **하위 에이전트:** 자체 모델 및 `agentRuntime` 기본값을 가진 Codex 전용 에이전트로 코딩 작업을 라우팅하세요.

    [모델](/ko/concepts/models) 및 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

  </Accordion>

  <Accordion title="GPT 5.5의 빠른 모드는 어떻게 구성하나요?">
    세션 토글 또는 구성 기본값을 사용하세요.

    - **세션별:** 세션이 `openai/gpt-5.5` 또는 `openai-codex/gpt-5.5`를 사용하는 동안 `/fast on`을 보내세요.
    - **모델별 기본값:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 또는 `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode`를 `true`로 설정하세요.

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

    OpenAI의 경우 빠른 모드는 지원되는 네이티브 Responses 요청에서 `service_tier = "priority"`로 매핑됩니다. 세션 `/fast` 재정의가 구성 기본값보다 우선합니다.

    [사고 및 빠른 모드](/ko/tools/thinking)와 [OpenAI 빠른 모드](/ko/providers/openai#fast-mode)를 참조하세요.

  </Accordion>

  <Accordion title='왜 "Model ... is not allowed"가 표시된 뒤 답장이 없나요?'>
    `agents.defaults.models`가 설정되어 있으면 `/model` 및 모든
    세션 재정의의 **허용 목록**이 됩니다. 해당 목록에 없는 모델을 선택하면 다음이 반환됩니다.

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    이 오류는 일반 답장 **대신** 반환됩니다. 해결 방법: 모델을
    `agents.defaults.models`에 추가하거나, 허용 목록을 제거하거나, `/model list`에서 모델을 선택하세요.
    명령에 `--runtime codex`도 포함되어 있었다면 먼저 모델을 추가한 다음 동일한
    `/model provider/model --runtime codex` 명령을 다시 시도하세요.

  </Accordion>

  <Accordion title='왜 "Unknown model: minimax/MiniMax-M2.7"가 표시되나요?'>
    이는 **제공자가 구성되지 않았음**을 의미합니다(MiniMax 제공자 구성이나 인증
    프로필을 찾을 수 없음). 따라서 모델을 해석할 수 없습니다.

    해결 체크리스트:

    1. 현재 OpenClaw 릴리스로 업그레이드하거나 소스 `main`에서 실행한 다음 Gateway를 재시작하세요.
    2. MiniMax가 구성되어 있는지(마법사 또는 JSON), 또는 일치하는 제공자를 주입할 수 있도록 env/auth 프로필에 MiniMax 인증이
       존재하는지 확인하세요
       (`minimax`의 경우 `MINIMAX_API_KEY`, `minimax-portal`의 경우 `MINIMAX_OAUTH_TOKEN` 또는 저장된 MiniMax
       OAuth).
    3. 인증 경로에 맞는 정확한 모델 id(대소문자 구분)를 사용하세요.
       API 키 설정의 경우 `minimax/MiniMax-M2.7` 또는 `minimax/MiniMax-M2.7-highspeed`,
       OAuth 설정의 경우 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. 다음을 실행하세요.

       ```bash
       openclaw models list
       ```

       그리고 목록에서 선택하거나 채팅에서 `/model list`를 사용하세요.

    [MiniMax](/ko/providers/minimax) 및 [모델](/ko/concepts/models)을 참조하세요.

  </Accordion>

  <Accordion title="MiniMax를 기본값으로 사용하고 복잡한 작업에는 OpenAI를 사용할 수 있나요?">
    예. **MiniMax를 기본값**으로 사용하고 필요할 때 **세션별로** 모델을 전환하세요.
    대체 모델은 “어려운 작업”이 아니라 **오류**를 위한 것이므로 `/model` 또는 별도 에이전트를 사용하세요.

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

    그런 다음:

    ```
    /model gpt
    ```

    **옵션 B: 별도 에이전트**

    - 에이전트 A 기본값: MiniMax
    - 에이전트 B 기본값: OpenAI
    - 에이전트별로 라우팅하거나 `/agent`를 사용해 전환

    문서: [모델](/ko/concepts/models), [멀티 에이전트 라우팅](/ko/concepts/multi-agent), [MiniMax](/ko/providers/minimax), [OpenAI](/ko/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt는 내장 단축어인가요?">
    예. OpenClaw는 몇 가지 기본 단축어를 제공합니다(`agents.defaults.models`에 모델이 존재할 때만 적용됨).

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API 키 설정의 경우 `openai/gpt-5.5`, Codex OAuth용으로 구성된 경우 `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    같은 이름으로 자체 별칭을 설정하면 해당 값이 우선합니다.

  </Accordion>

  <Accordion title="모델 단축어(별칭)를 어떻게 정의하거나 재정의하나요?">
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

    그러면 `/model sonnet`(또는 지원되는 경우 `/<alias>`)이 해당 모델 ID로 해석됩니다.

  </Accordion>

  <Accordion title="OpenRouter 또는 Z.AI 같은 다른 제공자의 모델을 어떻게 추가하나요?">
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

    Z.AI (GLM 모델):

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

    제공자/모델을 참조했지만 필요한 제공자 키가 없으면 런타임 인증 오류가 발생합니다(예: `No API key found for provider "zai"`).

    **새 에이전트를 추가한 후 제공자의 API 키를 찾을 수 없음**

    이는 보통 **새 에이전트**의 인증 저장소가 비어 있음을 의미합니다. 인증은 에이전트별로 적용되며
    다음 위치에 저장됩니다.

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    해결 옵션:

    - `openclaw agents add <id>`를 실행하고 마법사에서 인증을 구성합니다.
    - 또는 주 에이전트의 인증 저장소에서 이식 가능한 정적 `api_key` / `token` 프로필만 새 에이전트의 인증 저장소로 복사합니다.
    - OAuth 프로필의 경우, 새 에이전트에 자체 계정이 필요하면 새 에이전트에서 로그인합니다. 그렇지 않으면 OpenClaw가 갱신 토큰을 복제하지 않고 기본/주 에이전트를 통해 읽을 수 있습니다.

    에이전트 간에 `agentDir`을 재사용하지 **마세요**. 인증/세션 충돌이 발생합니다.

  </Accordion>
</AccordionGroup>

## 모델 장애 조치와 "모든 모델 실패"

<AccordionGroup>
  <Accordion title="장애 조치는 어떻게 작동하나요?">
    장애 조치는 두 단계로 발생합니다.

    1. 같은 제공자 내 **인증 프로필 순환**.
    2. `agents.defaults.model.fallbacks`의 다음 모델로 **모델 대체**.

    실패한 프로필에는 쿨다운이 적용되므로(지수 백오프), 제공자가 속도 제한 중이거나 일시적으로 실패해도 OpenClaw는 계속 응답할 수 있습니다.

    속도 제한 버킷에는 일반 `429` 응답보다 더 많은 항목이 포함됩니다. OpenClaw는
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` 같은 메시지와 주기적
    사용 기간 제한(`weekly/monthly limit reached`)도 장애 조치가 필요한
    속도 제한으로 처리합니다.

    일부 결제처럼 보이는 응답은 `402`가 아니며, 일부 HTTP `402`
    응답도 해당 일시적 버킷에 남습니다. 제공자가 `401` 또는 `403`에서
    명시적인 결제 관련 텍스트를 반환하면 OpenClaw는 여전히 이를
    결제 레인에 둘 수 있지만, 제공자별 텍스트 매처는 해당 매처를 소유한
    제공자 범위로 유지됩니다(예: OpenRouter `Key limit exceeded`). `402`
    메시지가 대신 재시도 가능한 사용 기간 또는
    조직/워크스페이스 지출 한도처럼 보이면(`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw는 이를 장기 결제 비활성화가 아니라
    `rate_limit`으로 처리합니다.

    컨텍스트 초과 오류는 다릅니다.
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, 또는 `ollama error: context length
    exceeded` 같은 시그니처는 모델
    대체로 진행하지 않고 Compaction/재시도 경로에 남습니다.

    일반 서버 오류 텍스트는 의도적으로 "unknown/error가 포함된 모든 것"보다 범위가 좁습니다.
    OpenClaw는 Anthropic의 단독 `An unknown error occurred`, OpenRouter의 단독
    `Provider returned error`, `Unhandled stop reason:
    error` 같은 중지 사유 오류, 일시적 서버 텍스트가 포함된 JSON `api_error` 페이로드
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), 그리고 `ModelNotReadyException` 같은 제공자 혼잡 오류처럼
    제공자 범위의 일시적 형태를 제공자 컨텍스트가
    일치할 때 장애 조치가 필요한 타임아웃/과부하 신호로 처리합니다.
    `LLM request failed with an unknown
    error.` 같은 일반 내부 대체 텍스트는 보수적으로 유지되며, 그 자체만으로 모델 대체를 트리거하지 않습니다.

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default"는 무엇을 의미하나요?'>
    이는 시스템이 인증 프로필 ID `anthropic:default`를 사용하려 했지만, 예상 인증 저장소에서 해당 자격 증명을 찾을 수 없었음을 의미합니다.

    **해결 체크리스트:**

    - **인증 프로필이 저장되는 위치 확인**(새 경로와 레거시 경로)
      - 현재: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 레거시: `~/.openclaw/agent/*`(`openclaw doctor`로 마이그레이션됨)
    - **환경 변수가 Gateway에 로드되는지 확인**
      - 셸에서 `ANTHROPIC_API_KEY`를 설정했지만 systemd/launchd로 Gateway를 실행하면 이를 상속하지 못할 수 있습니다. `~/.openclaw/.env`에 넣거나 `env.shellEnv`를 활성화하세요.
    - **올바른 에이전트를 편집 중인지 확인**
      - 다중 에이전트 구성에서는 `auth-profiles.json` 파일이 여러 개 있을 수 있습니다.
    - **모델/인증 상태 기본 점검**
      - `openclaw models status`를 사용해 구성된 모델과 제공자 인증 여부를 확인합니다.

    **"No credentials found for profile anthropic" 해결 체크리스트**

    이는 실행이 Anthropic 인증 프로필에 고정되어 있지만 Gateway가
    인증 저장소에서 이를 찾을 수 없음을 의미합니다.

    - **Claude CLI 사용**
      - 게이트웨이 호스트에서 `openclaw models auth login --provider anthropic --method cli --set-default`를 실행합니다.
    - **대신 API 키를 사용하려는 경우**
      - **게이트웨이 호스트**의 `~/.openclaw/.env`에 `ANTHROPIC_API_KEY`를 넣습니다.
      - 누락된 프로필을 강제하는 고정 순서를 지웁니다.

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **명령을 게이트웨이 호스트에서 실행 중인지 확인**
      - 원격 모드에서는 인증 프로필이 노트북이 아니라 게이트웨이 머신에 저장됩니다.

  </Accordion>

  <Accordion title="왜 Google Gemini도 시도하고 실패했나요?">
    모델 구성에 Google Gemini가 대체 모델로 포함되어 있거나 Gemini 축약형으로 전환한 경우, OpenClaw는 모델 대체 중 이를 시도합니다. Google 자격 증명을 구성하지 않았다면 `No API key found for provider "google"`이 표시됩니다.

    해결: Google 인증을 제공하거나, 대체가 해당 경로로 라우팅되지 않도록 `agents.defaults.model.fallbacks` / 별칭에서 Google 모델을 제거하거나 피하세요.

    **LLM 요청 거부됨: 사고 시그니처 필요(Google Antigravity)**

    원인: 세션 기록에 **시그니처 없는 사고 블록**이 포함되어 있습니다(대개
    중단/부분 스트림에서 발생). Google Antigravity는 사고 블록에 시그니처를 요구합니다.

    해결: OpenClaw는 이제 Google Antigravity Claude에 대해 서명되지 않은 사고 블록을 제거합니다. 여전히 나타나면 **새 세션**을 시작하거나 해당 에이전트에 `/thinking off`를 설정하세요.

  </Accordion>
</AccordionGroup>

## 인증 프로필: 정의와 관리 방법

관련 항목: [/concepts/oauth](/ko/concepts/oauth)(OAuth 흐름, 토큰 저장소, 다중 계정 패턴)

<AccordionGroup>
  <Accordion title="인증 프로필이란 무엇인가요?">
    인증 프로필은 제공자에 연결된 이름 있는 자격 증명 레코드(OAuth 또는 API 키)입니다. 프로필은 다음 위치에 저장됩니다.

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    비밀을 출력하지 않고 저장된 프로필을 검사하려면 `openclaw models auth list`를 실행하세요(선택적으로 `--provider <id>` 또는 `--json`). 자세한 내용은 [모델 CLI](/ko/cli/models#openclaw-models-auth-list)를 참조하세요.

  </Accordion>

  <Accordion title="일반적인 프로필 ID는 무엇인가요?">
    OpenClaw는 다음과 같은 제공자 접두사 ID를 사용합니다.

    - `anthropic:default`(이메일 ID가 없을 때 흔함)
    - OAuth ID용 `anthropic:<email>`
    - 사용자가 선택한 사용자 지정 ID(예: `anthropic:work`)

  </Accordion>

  <Accordion title="어떤 인증 프로필을 먼저 시도할지 제어할 수 있나요?">
    예. 구성은 프로필의 선택적 메타데이터와 제공자별 순서(`auth.order.<provider>`)를 지원합니다. 이는 비밀을 저장하지 않으며, ID를 제공자/모드에 매핑하고 순환 순서를 설정합니다.

    OpenClaw는 프로필이 짧은 **쿨다운**(속도 제한/타임아웃/인증 실패) 또는 더 긴 **비활성화** 상태(결제/크레딧 부족)에 있으면 일시적으로 건너뛸 수 있습니다. 이를 확인하려면 `openclaw models status --json`을 실행하고 `auth.unusableProfiles`를 확인하세요. 조정: `auth.cooldowns.billingBackoffHours*`.

    속도 제한 쿨다운은 모델 범위일 수 있습니다. 한 모델에 대해 쿨다운 중인 프로필도
    같은 제공자의 형제 모델에서는 계속 사용할 수 있으며,
    결제/비활성화 기간은 여전히 전체 프로필을 차단합니다.

    CLI를 통해 **에이전트별** 순서 재정의(해당 에이전트의 `auth-state.json`에 저장)를 설정할 수도 있습니다.

    ```bash
    # 구성된 기본 에이전트가 기본값입니다(--agent 생략)
    openclaw models auth order get --provider anthropic

    # 순환을 단일 프로필로 고정(이 프로필만 시도)
    openclaw models auth order set --provider anthropic anthropic:default

    # 또는 명시적 순서 설정(제공자 내 대체)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 재정의 지우기(config auth.order / 라운드로빈으로 되돌림)
    openclaw models auth order clear --provider anthropic
    ```

    특정 에이전트를 대상으로 하려면:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    실제로 무엇을 시도할지 확인하려면 다음을 사용하세요.

    ```bash
    openclaw models status --probe
    ```

    저장된 프로필이 명시적 순서에서 생략되면, probe는 조용히 시도하지 않고
    해당 프로필에 대해 `excluded_by_auth_order`를 보고합니다.

  </Accordion>

  <Accordion title="OAuth와 API 키의 차이는 무엇인가요?">
    OpenClaw는 둘 다 지원합니다.

    - **OAuth**는 종종 구독 액세스를 활용합니다(해당되는 경우).
    - **API 키**는 토큰당 과금 방식을 사용합니다.

    마법사는 Anthropic Claude CLI, OpenAI Codex OAuth, API 키를 명시적으로 지원합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [FAQ](/ko/help/faq) — 기본 FAQ
- [FAQ — 빠른 시작 및 최초 실행 설정](/ko/help/faq-first-run)
- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
