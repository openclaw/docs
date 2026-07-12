---
read_when:
    - 모델 선택 또는 전환, 별칭 구성
    - 모델 장애 조치 / "모든 모델 실패" 디버깅
    - 인증 프로필 이해 및 관리 방법
sidebarTitle: Models FAQ
summary: 'FAQ: 모델 기본값, 선택, 별칭, 전환, 장애 조치 및 인증 프로필'
title: 'FAQ: 모델 및 인증'
x-i18n:
    generated_at: "2026-07-12T15:19:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  모델 및 인증 프로필 Q&A입니다. 설정, 세션, Gateway, 채널 및
  문제 해결에 대해서는 기본 [FAQ](/ko/help/faq)를 참조하십시오.

  ## 모델: 기본값, 선택, 별칭, 전환

  <AccordionGroup>
  <Accordion title='"기본 모델"이란 무엇입니까?'>
    다음 항목으로 설정합니다.

    ```text
    agents.defaults.model.primary
    ```

    모델은 `provider/model` 참조입니다(예: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). 항상 `provider/model`을 명시적으로 설정하십시오.
    제공자를 생략하면 OpenClaw는 먼저 별칭 일치를 시도한 다음, 해당 모델 ID와
    일치하는 구성된 고유 제공자를 찾고, 이후 구성된 기본 제공자로 대체합니다
    (더 이상 권장되지 않는 호환성 경로). 해당 제공자에 구성된 기본 모델이 더 이상
    없으면 OpenClaw는 오래된 기본값 대신 구성된 첫 번째 제공자/모델로 대체합니다.

  </Accordion>

  <Accordion title="어떤 모델을 권장합니까?">
    제공자 스택에서 지원하는 최신 세대 모델 중 가장 강력한 모델을 사용하십시오.
    특히 도구를 사용하거나 신뢰할 수 없는 입력을 처리하는 에이전트에는 더욱 중요합니다.
    성능이 낮거나 지나치게 양자화된 모델은 프롬프트 인젝션과 안전하지 않은 동작에
    더 취약합니다([보안](/ko/gateway/security) 참조). 일상적이거나 위험도가 낮은 채팅에는
    에이전트 역할에 따라 더 저렴한 모델을 라우팅하십시오.

    에이전트별로 모델을 라우팅하고, 하위 에이전트를 사용하여 긴 작업을 병렬화하십시오
    (각 하위 에이전트는 자체 토큰을 소비합니다). [모델](/ko/concepts/models),
    [하위 에이전트](/ko/tools/subagents), [MiniMax](/ko/providers/minimax) 및
    [로컬 모델](/ko/gateway/local-models)을 참조하십시오.

  </Accordion>

  <Accordion title="구성을 초기화하지 않고 모델을 전환하려면 어떻게 합니까?">
    모델 필드만 변경하고 전체 구성을 교체하지 마십시오.

    - 채팅에서 `/model` 사용(세션별, [슬래시 명령](/ko/tools/slash-commands) 참조)
    - `openclaw models set ...` 사용(모델 구성만 업데이트)
    - `openclaw configure --section model` 사용(대화형)
    - `~/.openclaw/openclaw.json`의 `agents.defaults.model`을 직접 편집

    RPC로 편집할 때는 먼저 `config.schema.lookup`으로 확인한 후(정규화된
    경로, 간략한 스키마 문서, 하위 항목 요약), 부분 객체와 함께 `config.apply`보다
    `config.patch`를 우선 사용하십시오. 구성을 덮어쓴 경우 백업에서 복원하거나
    `openclaw doctor`를 실행하여 복구하십시오.

    문서: [모델](/ko/concepts/models), [구성](/ko/cli/configure),
    [Config](/ko/cli/config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="자체 호스팅 모델(llama.cpp, vLLM, Ollama)을 사용할 수 있습니까?">
    예. Ollama가 가장 쉬운 방법입니다. 빠른 설정:

    1. `https://ollama.com/download`에서 Ollama 설치
    2. 로컬 모델 가져오기(예: `ollama pull gemma4`)
    3. 클라우드 모델도 사용하려면 `ollama signin` 실행
    4. `openclaw onboard`를 실행하고 `Ollama`를 선택한 다음 `Local` 또는 `Cloud + Local` 선택

    `Cloud + Local`은 클라우드 모델과 로컬 Ollama 모델을 함께 제공합니다.
    `kimi-k2.5:cloud`와 같은 클라우드 모델은 로컬에서 가져올 필요가 없습니다. 수동으로 전환하려면
    `openclaw models list`를 실행한 다음 `openclaw models set ollama/<model>`을 실행하십시오.

    더 작거나 고도로 양자화된 모델은 프롬프트 인젝션에 더 취약합니다.
    도구에 액세스할 수 있는 봇에는 대형 모델을 사용하십시오. 그래도 소형 모델을 사용하는 경우
    샌드박싱과 엄격한 도구 허용 목록을 활성화하십시오.

    문서: [Ollama](/ko/providers/ollama), [로컬 모델](/ko/gateway/local-models),
    [모델 제공자](/ko/concepts/model-providers), [보안](/ko/gateway/security),
    [샌드박싱](/ko/gateway/sandboxing).

  </Accordion>

  <Accordion title="재시작하지 않고 즉시 모델을 전환하려면 어떻게 해야 하나요?">
    `/model <name>`을 독립된 메시지로 보내십시오. 번호 선택기(`/model`, `/model
    list`, `/model 3`), 세션 재정의를 해제하는 `/model default`, 엔드포인트/API 모드 세부 정보를
    확인하는 `/model status`를 포함한 전체 명령 목록은
    [슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.

    `@profile`을 사용하여 세션별로 특정 인증 프로필을 강제로 지정할 수 있습니다.

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    `@profile`로 설정한 프로필 고정을 해제하려면 접미사 없이 `/model`을 다시 실행하거나
    (예: `/model anthropic/claude-opus-4-6`) `/model`에서 기본값을 선택하십시오.
    활성 인증 프로필을 확인하려면 `/model status`를 사용하십시오.

  </Accordion>

  <Accordion title="If two providers expose the same model id, which one does /model use?">
    `/model provider/model`은(는) 해당 공급자 경로를 정확히 선택합니다. 예를 들어
    모델 ID가 일치하더라도 `qianfan/deepseek-v4-flash`과(와) `deepseek/deepseek-v4-flash`은(는) 서로 다른
    참조입니다. OpenClaw는 단순히 ID가 일치한다는 이유로 공급자를 자동 전환하지 않습니다.

    사용자가 선택한 `/model` 참조에는 폴백이 엄격하게 적용됩니다. 해당
    공급자/모델을 사용할 수 없게 되면 `agents.defaults.model.fallbacks`로
    폴백하는 대신 응답이 명확하게 실패합니다. 구성된 폴백 체인은 구성된
    기본값, Cron 작업의 기본 모델 및 자동 선택된 폴백 상태에 계속 적용됩니다.
    세션 재정의가 아닌 실행에 폴백 사용이 허용되는 경우 OpenClaw는 먼저
    요청된 공급자/모델을 시도한 다음 구성된 폴백을 시도하고, 마지막으로 구성된
    기본 모델을 시도합니다. 따라서 중복된 단순 모델 ID가 기본 공급자로 곧바로
    되돌아가는 일은 없습니다.

    [모델](/ko/concepts/models) 및 [모델 장애 조치](/ko/concepts/model-failover)를 참조하십시오.

  </Accordion>

  <Accordion title="일상 작업에는 GPT 5.5를 사용하고 코딩에는 Codex 5.5를 사용할 수 있나요?">
    예 — 모델 선택과 런타임 선택은 서로 별개입니다.

    - **네이티브 Codex 코딩 에이전트:** `agents.defaults.model.primary`를
      `openai/gpt-5.5`로 설정합니다. ChatGPT/Codex 구독 인증을 사용하려면 `openclaw models auth login --provider
      openai`로 로그인합니다.
    - **에이전트 루프 외부의 직접 OpenAI API 작업:** 이미지, 임베딩, 음성, 실시간 및 기타
      비에이전트 OpenAI API 기능을 사용하려면 `OPENAI_API_KEY`를 구성합니다.
    - **OpenAI 에이전트 API 키 인증:** 순서가 지정된
      `openai` API 키 프로필과 함께 `/model openai/gpt-5.5`를 사용합니다.
    - **하위 에이전트:** 자체 `openai/gpt-5.5` 모델을 사용하는
      Codex 중심 에이전트로 코딩 작업을 라우팅합니다.

    [모델](/ko/concepts/models) 및 [슬래시 명령어](/ko/tools/slash-commands)를 참조하십시오.

  </Accordion>

  <Accordion title="GPT 5.5의 빠른 모드는 어떻게 구성합니까?">
    - **세션별:** `openai/gpt-5.5`를 사용하는 동안 `/fast on`을 전송합니다.
    - **모델별 기본값:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode`를
      `true`로 설정합니다.
    - **자동 종료 시점:** `/fast auto` 또는 `params.fastMode: "auto"`를 사용하면 종료
      시점까지 새 모델 호출이 빠르게 실행되고, 이후 재시도, 폴백,
      도구 결과 또는 연속 호출은 빠른 모드 없이 실행됩니다. 기본 종료 시점은
      60초이며, 모델의 `params.fastAutoOnSeconds`로 재정의할 수 있습니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    빠른 모드는 네이티브 OpenAI Responses 요청에서 `service_tier = "priority"`로
    매핑됩니다. 기존 `service_tier` 값은 유지되며, 빠른 모드는
    `reasoning` 또는 `text.verbosity`를 다시 작성하지 않습니다. 세션의 `/fast`
    재정의가 구성 기본값보다 우선합니다.

    [사고 및 빠른 모드](/ko/tools/thinking)와
    [OpenAI](/ko/providers/openai) 제공자 페이지의 고급 구성 아래에 있는 빠른 모드
    섹션을 참조하십시오.

  </Accordion>

  <Accordion title='"Model ... is not allowed"가 표시된 후 응답이 없는 이유는 무엇입니까?'>
    `agents.defaults.models`가 설정되어 있으면 `/model` 및 세션 재정의의
    **허용 목록**이 됩니다. 해당 목록에 없는 모델을 선택하면 정상적인 응답 대신
    다음이 반환됩니다.

    ```text
    모델 "provider/model"은(는) 허용되지 않습니다. 제공자 목록을 보려면 /models를 사용하고, 모델 목록을 보려면 /models <provider>를 사용하십시오.
    다음 명령으로 추가하십시오: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    해결 방법: 정확한 모델을 `agents.defaults.models`에 추가하거나, 동적 카탈로그를
    위해 `"provider/*": {}`와 같은 제공자 와일드카드를 추가하거나, 허용 목록을
    제거하거나, `/model list`에서 모델을 선택합니다. 명령에
    `--runtime codex`도 포함되어 있었다면 먼저 허용 목록을 업데이트한 다음
    동일한 `/model provider/model --runtime codex` 명령을 다시 시도합니다.

  </Accordion>

  <Accordion title='"Unknown model: minimax/MiniMax-M3"가 표시되는 이유는 무엇입니까?'>
    이전 OpenClaw 릴리스를 사용 중이라면 먼저 업그레이드하거나 소스의
    `main`에서 실행한 후 Gateway를 다시 시작하십시오. 설치된 릴리스의
    카탈로그에 아직 `MiniMax-M3`가 없을 수 있습니다. 그렇지 않다면 MiniMax
    제공자가 구성되지 않은 것입니다(제공자 항목 또는 인증 프로필을 찾을 수 없음).
    따라서 모델을 확인할 수 없습니다. 전체 해결 체크리스트, 제공자/모델 ID 표,
    구성 블록 예시는 [MiniMax](/ko/providers/minimax) 제공자 페이지의 문제 해결
    섹션을 참조하십시오.

  </Accordion>

  <Accordion title="MiniMax를 기본값으로 사용하고 복잡한 작업에는 OpenAI를 사용할 수 있습니까?">
    예. MiniMax를 기본값으로 사용하고 세션별로 모델을 전환하십시오. 폴백은
    오류를 위한 것이며 "어려운 작업"을 위한 것이 아니므로 `/model` 또는 별도의
    에이전트를 사용합니다.

    **옵션 A: 세션별 전환**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    그런 다음 `/model gpt`를 사용합니다.

    **옵션 B: 별도의 에이전트** — 에이전트 A는 기본적으로 MiniMax를 사용하고,
    에이전트 B는 기본적으로 OpenAI를 사용합니다. 에이전트별로 라우팅하거나
    `/agent`를 사용해 전환합니다.

    문서: [모델](/ko/concepts/models), [멀티 에이전트 라우팅](/ko/concepts/multi-agent),
    [MiniMax](/ko/providers/minimax), [OpenAI](/ko/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt는 기본 제공 단축 이름입니까?">
    예. 기본 제공 축약 이름이며, 대상 모델이 `agents.defaults.models`에
    존재할 때만 적용됩니다.

    | 별칭 | 확인되는 대상 |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    같은 이름으로 직접 정의한 별칭은 기본 제공 별칭을 재정의합니다.

  </Accordion>

  <Accordion title="모델 단축 이름(별칭)은 어떻게 정의하거나 재정의합니까?">
    별칭은 `agents.defaults.models.<modelId>.alias`에 있습니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    그러면 `/model sonnet`(또는 지원되는 경우 `/<alias>`)이 해당 모델 ID로
    확인됩니다.

  </Accordion>

  <Accordion title="OpenRouter 또는 Z.AI 같은 다른 제공자의 모델은 어떻게 추가합니까?">
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
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    참조된 제공자/모델의 제공자 키가 없으면 런타임 인증 오류가 발생합니다
    (예: `No API key found for provider "zai"`).

    **새 에이전트를 추가한 후 제공자의 API 키를 찾을 수 없음**

    새 에이전트의 인증 저장소는 비어 있습니다. 인증은 에이전트별로 관리되며
    다음 위치에 저장됩니다.

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    해결 방법: `openclaw agents add <id>`를 실행하고 마법사에서 인증을 구성하거나,
    기본 에이전트의 저장소에서 이식 가능한 정적 `api_key`/`token` 프로필만
    복사하십시오. OAuth의 경우 새 에이전트에 자체 계정이 필요할 때 해당
    에이전트에서 로그인하십시오. 전체 `agentDir` 재사용 및 자격 증명 공유
    규칙은 [다중 에이전트 라우팅](/ko/concepts/multi-agent)을 참조하십시오.
    에이전트 간에 `agentDir`을 절대 재사용하지 마십시오.

  </Accordion>
</AccordionGroup>

## 모델 장애 조치 및 "모든 모델 실패"

<AccordionGroup>
  <Accordion title="장애 조치는 어떻게 작동합니까?">
    다음 두 단계로 진행됩니다.

    1. 동일한 제공자 내에서 **인증 프로필 순환**.
    2. `agents.defaults.model.fallbacks`의 다음 모델로 **모델 대체**.

    실패한 프로필에는 쿨다운(지수 백오프)이 적용되므로 제공자가 속도 제한에
    걸리거나 일시적으로 실패해도 OpenClaw는 계속 응답합니다.

    속도 제한 버킷에는 단순한 `429` 외에도 더 많은 오류가 포함됩니다. `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` 및 주기적인
    사용량 기간 제한(`weekly/monthly limit reached`)은 모두 장애 조치가
    필요한 속도 제한으로 간주됩니다.

    결제 응답이 항상 `402`인 것은 아니며, 일부 `402`는 결제 경로가 아니라
    일시적 오류/속도 제한 버킷에 남습니다. `401`/`403`에 명시적인
    결제 문구가 있으면 여전히 결제 경로로 라우팅될 수 있습니다. 제공자별
    텍스트 매처(예: OpenRouter `Key limit exceeded`)는 해당 제공자에만
    적용됩니다. 재시도 가능한 사용량 기간 제한이나 조직/워크스페이스 지출
    한도처럼 보이는 `402`(`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`)는 장기간 결제 비활성화가 아니라
    `rate_limit`으로 처리됩니다.

    컨텍스트 오버플로 오류는 대체 경로에서 완전히 제외됩니다.
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model`, `ollama error: context length exceeded` 같은
    시그니처는 모델 대체를 진행하지 않고 Compaction/재시도로 이동합니다.

    일반 서버 오류 텍스트의 범위는 "unknown/error가 포함된 모든 항목"보다
    좁습니다. 장애 조치 신호로 간주되는 제공자 범위의 일시적 오류 형태는
    다음과 같습니다. Anthropic의 단독 `An unknown error occurred`,
    OpenRouter의 단독 `Provider returned error`, `Unhandled stop reason:
    error` 같은 중지 사유 오류, 일시적 서버 텍스트(`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)가
    포함된 JSON `api_error` 페이로드, 그리고 제공자 컨텍스트가 일치할 때의
    `ModelNotReadyException` 같은 제공자 사용 중 오류입니다. `LLM request failed
    with an unknown error.` 같은 일반적인 내부 대체 텍스트는 보수적으로
    처리되며, 그 자체만으로는 대체를 트리거하지 않습니다.

  </Accordion>

  <Accordion title='"anthropic:default 프로필의 자격 증명을 찾을 수 없음"은 무엇을 의미합니까?'>
    인증 프로필 ID `anthropic:default`에 예상 인증 저장소의 자격 증명이
    없습니다.

    **해결 체크리스트:**

    - 프로필이 저장된 위치를 확인하십시오. 현재 위치:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, 레거시 위치:
      `~/.openclaw/agent/*`(`openclaw doctor`로 마이그레이션됨).
    - Gateway가 환경 변수를 로드하는지 확인하십시오. 셸에서만 설정한
      `ANTHROPIC_API_KEY`는 systemd/launchd를 통한 Gateway 실행에 전달되지
      않습니다. `~/.openclaw/.env`에 넣거나 `env.shellEnv`를 활성화하십시오.
    - 올바른 에이전트를 편집하고 있는지 확인하십시오. 다중 에이전트 설정에는
      여러 `auth-profiles.json` 파일이 있습니다.
    - 구성된 모델과 제공자 인증 상태를 확인하려면 `openclaw models status`를
      실행하십시오.

    **"anthropic 프로필의 자격 증명을 찾을 수 없음"(이메일 접미사 없음)의 경우:**

    실행이 Gateway에서 찾을 수 없는 Anthropic 프로필에 고정되어 있습니다.

    - Claude CLI를 사용하십시오. Gateway 호스트에서 `openclaw models auth login --provider anthropic
      --method cli --set-default`를 실행하십시오.
    - 대신 API 키를 사용하는 것이 좋습니다. Gateway 호스트의
      `~/.openclaw/.env`에 `ANTHROPIC_API_KEY`를 넣은 다음, 누락된 프로필을
      강제하는 고정 순서를 모두 지우십시오.

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - 원격 모드에서는 인증 프로필이 노트북이 아닌 Gateway 시스템에
      저장됩니다. 해당 시스템에서 명령을 실행하고 있는지 확인하십시오.

  </Accordion>

  <Accordion title="Google Gemini도 시도한 후 실패한 이유는 무엇입니까?">
    모델 구성에 Google Gemini가 대체 모델로 포함되어 있거나 Gemini 축약형으로
    전환한 경우 OpenClaw는 대체 중에 이를 시도합니다. Google 자격 증명이
    구성되어 있지 않으면 `No API key found for provider
    "google"` 오류가 발생합니다. 해결 방법: Google 인증을 추가하거나
    `agents.defaults.model.fallbacks`/별칭에서 Google 모델을 제거하십시오.

    **LLM 요청이 거부됨: thinking 서명이 필요합니다(Google Antigravity)**

    원인: 세션 기록에 서명이 없는 thinking 블록이 있습니다(대개
    중단되었거나 불완전한 스트림에서 발생합니다). Google Antigravity는 thinking
    블록에 서명을 요구합니다. OpenClaw는 Google Antigravity Claude에 대해 서명되지 않은
    thinking 블록을 제거합니다. 그래도 이 문제가 계속 나타나면 새 세션을 시작하거나 해당
    에이전트에 `/thinking off`를 설정하십시오.

  </Accordion>
</AccordionGroup>

## 인증 프로필: 개념 및 관리 방법

관련 항목: [/concepts/oauth](/ko/concepts/oauth) (OAuth 흐름, 토큰 저장소, 다중 계정 패턴)

<AccordionGroup>
  <Accordion title="인증 프로필이란 무엇입니까?">
    제공자에 연결된 이름이 지정된 자격 증명 레코드(OAuth 또는 API 키)이며,
    다음 위치에 저장됩니다.

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    비밀을 출력하지 않고 저장된 프로필을 검사하려면 `openclaw models auth
    list`를 사용하십시오(선택적으로 `--provider <id>` 또는 `--json` 사용). 
    [모델 CLI](/ko/cli/models#auth-profiles)를 참조하십시오.

  </Accordion>

  <Accordion title="일반적인 프로필 ID는 무엇입니까?">
    제공자 접두사가 붙습니다. 이메일 ID가 없을 때 일반적으로 사용하는
    `anthropic:default`, OAuth ID용 `anthropic:<email>`, 또는 직접 선택한
    사용자 지정 ID(예: `anthropic:work`)입니다.

  </Accordion>

  <Accordion title="어떤 인증 프로필을 먼저 시도할지 제어할 수 있습니까?">
    예. `auth.order.<provider>` 구성은 제공자별 순환 순서를 설정합니다
    (메타데이터만 사용하며 비밀은 저장하지 않습니다).

    OpenClaw는 짧은 **쿨다운** 상태(속도 제한, 시간 초과,
    인증 실패) 또는 더 긴 **비활성화** 상태(결제/크레딧 부족)의 프로필을
    건너뛸 수 있습니다. `openclaw models status
    --json`으로 검사하고 `auth.unusableProfiles`를 확인하십시오.
    `auth.cooldowns.billingBackoffHours*`로 조정하십시오. 속도 제한 쿨다운은
    모델 범위로 적용될 수 있습니다. 한 모델에 대해 쿨다운 중인 프로필도 동일한
    제공자의 형제 모델에는 계속 사용될 수 있지만, 결제/비활성화 기간에는
    전체 프로필이 차단됩니다.

    에이전트별 순서 재정의를 설정합니다(해당 에이전트의 `auth-state.json`에 저장됨).

    ```bash
    # 구성된 기본 에이전트를 사용합니다(--agent 생략)
    openclaw models auth order get --provider anthropic

    # 순환을 단일 프로필로 고정합니다
    openclaw models auth order set --provider anthropic anthropic:default

    # 또는 명시적인 순서를 설정합니다(제공자 내 대체 프로필)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 재정의를 지웁니다(구성의 auth.order / 라운드 로빈으로 복귀)
    openclaw models auth order clear --provider anthropic

    # 특정 에이전트를 대상으로 지정합니다
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    실제로 어떤 항목을 시도할지 확인하려면 `openclaw models status --probe`를
    사용하십시오. 명시적인 순서에서 생략된 저장된 프로필은 조용히 시도되는 대신
    `excluded_by_auth_order`로 보고됩니다.

  </Accordion>

  <Accordion title="OAuth와 API 키의 차이점은 무엇입니까?">
    - **OAuth / CLI 로그인**은 제공자가 지원하는 경우 구독 액세스를 사용하는 경우가
      많습니다. Anthropic의 경우 OpenClaw의 Claude CLI 백엔드는 Claude Code
      `claude -p`를 사용하며, Anthropic은 현재 이를 구독 사용량 한도에서 차감되는
      Agent SDK/프로그래밍 방식 사용으로 취급합니다. 현재 결제 일시 중지 상태와
      출처 링크는 [Anthropic](/ko/providers/anthropic)을 참조하십시오.
    - **API 키**는 토큰당 사용량 기반 결제를 사용합니다.

    마법사는 Anthropic Claude CLI, OpenAI Codex OAuth 및 API
    키를 지원합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [FAQ](/ko/help/faq) — 기본 FAQ
- [FAQ — 빠른 시작 및 최초 실행 설정](/ko/help/faq-first-run)
- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
