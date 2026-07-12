---
read_when:
    - 모델 폴백 동작 또는 선택 UX 변경
    - '"모델이 허용되지 않음" 또는 오래된 기본 프로바이더 폴백 디버깅'
    - models.json 병합/비밀 정보 동작 작업 중
sidebarTitle: Models CLI
summary: OpenClaw이 provider/model 참조, 구성 키 및 `/model` 채팅 명령을 해석하는 방식
title: 모델 CLI
x-i18n:
    generated_at: "2026-07-12T15:10:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="모델 장애 조치" href="/ko/concepts/model-failover">
    인증 프로필 순환, 쿨다운 및 대체 모델과 상호 작용하는 방식입니다.
  </Card>
  <Card title="모델 제공자" href="/ko/concepts/model-providers">
    제공자에 대한 간략한 개요와 예시입니다.
  </Card>
  <Card title="모델 CLI 참조" href="/ko/cli/models">
    전체 `openclaw models` 명령 및 플래그 참조입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults">
    모델 구성 키, 기본값 및 예시입니다.
  </Card>
</CardGroup>

모델 참조(`provider/model`)는 저수준 에이전트 런타임이 아니라 제공자와 모델을 선택합니다. 런타임 정책이 설정되지 않았거나 `auto`이면, 작성된 요청 재정의가 없는 정확한 공식 HTTPS Platform Responses 또는 ChatGPT Responses 경로에 한해서만 OpenAI의 제공자 소유 경로 정책이 Codex를 선택할 수 있습니다. `openai/*` 접두사만으로는 Codex가 선택되지 않습니다. Completions 어댑터, 사용자 지정 엔드포인트 및 작성된 요청 동작은 OpenClaw에서 계속 처리됩니다. 공식 평문 HTTP 엔드포인트는 거부됩니다. [OpenAI 암시적 에이전트 런타임](/ko/providers/openai#implicit-agent-runtime)을 참조하십시오.

구독 Copilot 참조(`github-copilot/*`)는 외부 GitHub Copilot 에이전트 런타임 Plugin을 사용하도록 설정할 수 있지만, 이 경로는 항상 명시적이며 `auto`로 선택되지 않습니다. 런타임 재정의는 전체 에이전트나 세션이 아니라 제공자/모델 정책에 속합니다. 런타임 선택은 결제 방식을 결정하지 않습니다. OpenAI API 키 자격 증명과 ChatGPT/Codex 구독 자격 증명은 서로 구분됩니다. [에이전트 런타임](/ko/concepts/agent-runtimes) 및 [GitHub Copilot 에이전트 런타임](/ko/plugins/copilot)을 참조하십시오.

## 선택 순서

<Steps>
  <Step title="기본 모델">
    `agents.defaults.model.primary`(또는 일반 문자열 형식의 `agents.defaults.model`)입니다.
  </Step>
  <Step title="대체 모델">
    `agents.defaults.model.fallbacks`를 순서대로 시도합니다.
  </Step>
  <Step title="인증 장애 조치">
    OpenClaw가 다음 대체 모델로 이동하기 전에 제공자 내부에서 인증 프로필 순환이 수행됩니다.
  </Step>
</Steps>

관련 모델 구성 영역은 다음과 같습니다.

- `agents.defaults.models`는 OpenClaw가 사용할 수 있는 모델의 허용 목록/카탈로그와 별칭입니다. 각 모델을 일일이 나열하지 않고 제공자에서 검색된 모든 모델을 허용하려면 `provider/*` 항목을 사용하십시오.
- `agents.defaults.utilityModel`은 생성된 대시보드 세션 제목, 지원되는 채널 스레드/주제 제목 및 진행 상황 설명과 같은 짧은 내부 작업에 사용할 수 있는 선택적 저비용 모델입니다. 에이전트별 `agents.list[].utilityModel`이 이를 재정의합니다. 설정하지 않으면 OpenClaw는 기본 제공자에 선언된 소형 모델 기본값이 있을 경우 이를 사용하고(OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), 그렇지 않으면 에이전트의 기본 모델을 사용합니다. 유틸리티 라우팅을 비활성화하려면 빈 문자열로 설정하십시오. 유틸리티 작업은 별도의 모델 호출이며 제한된 작업 콘텐츠를 선택된 모델 제공자에게 전송할 수 있습니다.
- `agents.defaults.imageModel`은 기본 모델이 이미지를 받을 수 없는 경우에만 사용됩니다.
- `agents.defaults.pdfModel`은 `pdf` 도구에서 사용됩니다. 설정하지 않으면 도구는 `imageModel`, 그다음 확인된 세션/기본 모델을 사용합니다.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` 및 `videoGenerationModel`은 공유 미디어 생성 도구를 지원합니다. 설정하지 않으면 각 도구는 인증이 지원되는 제공자 기본값을 추론합니다. 먼저 현재 기본 제공자를 사용한 다음, 해당 기능에 등록된 나머지 제공자를 제공자 ID 순서로 사용합니다. 명시적 대체 모델은 유지하면서 이 제공자 간 추론을 비활성화하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`로 설정하십시오.
- 에이전트별 `agents.list[].model`과 바인딩은 `agents.defaults.model`을 재정의합니다. [다중 에이전트 라우팅](/ko/concepts/multi-agent)을 참조하십시오.

전체 키 참조, 기본값 및 JSON5 예시는 [구성 참조](/ko/gateway/config-agents#agent-defaults)를 참조하십시오.

## 선택 출처 및 대체 모델 엄격성

동일한 `provider/model`이라도 출처에 따라 다르게 동작합니다.

| 출처                                                                    | 동작                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 구성된 기본값(`agents.defaults.model.primary`, 에이전트별 기본 모델)    | 정상적인 시작점이며 `agents.defaults.model.fallbacks`를 사용합니다.                                                                                                                                                                                            |
| 자동 대체 모델                                                          | `modelOverrideSource: "auto"`로 저장되는 임시 복구 상태입니다. OpenClaw는 원래 기본 모델을 주기적으로 다시 탐색하고, 복구되면 자동 선택을 해제하며, 상태가 변경될 때마다 대체/복구 전환을 한 번 알립니다.                                                         |
| 사용자 세션 선택                                                        | 정확하고 엄격합니다. `/model`, 모델 선택기, `session_status(model=...)` 및 `sessions.patch`는 `modelOverrideSource: "user"`를 저장합니다. 해당 제공자/모델에 연결할 수 없게 되면 구성된 다른 모델로 넘어가지 않고 실행이 명확하게 실패합니다.                     |
| Cron `--model` / 페이로드 `model`                                       | 작업별 기본 모델입니다. 작업에서 자체 페이로드 `fallbacks`를 제공하지 않는 한 구성된 대체 모델을 계속 사용합니다(`fallbacks: []`는 엄격한 실행을 강제합니다).                                                                                                  |

기타 선택 규칙은 다음과 같습니다.

- `agents.defaults.model.primary`를 변경해도 기존 세션 고정 설정은 다시 작성되지 않습니다. 상태에 `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`가 표시되면 `/model default`를 실행하여 고정을 해제하십시오.
- CLI 기본 모델 및 허용 목록 선택기는 전체 내장 카탈로그 대신 `models.providers.*.models`만 나열하여 `models.mode: "replace"`를 준수합니다.
- Control UI 모델 선택기는 Gateway에 구성된 모델 보기를 요청합니다. `agents.defaults.models`가 설정된 경우 이를 사용하고(`provider/*` 와일드카드 항목 포함), 그렇지 않으면 `models.providers.*.models`와 사용 가능한 인증을 보유한 제공자를 사용합니다. 전체 내장 카탈로그는 명시적 탐색 보기(`view: "all"`을 사용하는 `models.list` 또는 `openclaw models list --all`)에서만 사용됩니다.
- 제공자 인벤토리 UI는 `view: "provider-config"`를 사용하는 `models.list`를 통해 선택기 허용 목록을 적용하지 않고 소스에서 작성된 `models.providers.*.models` 행을 표시합니다.

전체 동작 방식은 [모델 장애 조치](/ko/concepts/model-failover)를 참조하십시오.

## 빠른 모델 정책

- 사용할 수 있는 가장 강력한 최신 세대 모델을 기본 모델로 설정하십시오.
- 비용/지연 시간에 민감한 작업과 중요도가 낮은 채팅에는 대체 모델을 사용하십시오.
- 도구 사용이 활성화된 에이전트 또는 신뢰할 수 없는 입력에는 이전 세대/성능이 낮은 모델 계층을 피하십시오.

## 온보딩

```bash
openclaw onboard
```

OpenAI Codex 구독 OAuth 및 Anthropic(API 키 또는 Claude CLI 재사용)을 포함하여 일반적인 제공자의 모델과 인증을 구성을 직접 편집하지 않고 설정합니다.

기본 모델이 구성되지 않은 경우 새 OpenAI API 키 설정은 `openai/gpt-5.6`을 선택하며, 접미사가 없는 직접 API ID는 Sol 계층으로 확인됩니다. 새 ChatGPT/Codex OAuth 설정은 정확한 `openai/gpt-5.6-sol` 카탈로그 참조를 선택합니다. 재인증 시 `openai/gpt-5.5`를 포함한 기존의 명시적 기본 모델이 유지됩니다. 계정에서 GPT-5.6을 사용할 수 없다면 `openai/gpt-5.5`를 명시적으로 선택하십시오. OpenClaw는 이를 자동으로 하향 조정하지 않습니다.

## "Model is not allowed"(및 응답이 중단되는 이유)

`agents.defaults.models`가 설정되면 `/model` 및 세션 재정의의 허용 목록이 됩니다. 허용 목록에 없는 모델을 선택하면 정상 응답이 생성되기 전에 다음을 반환합니다.

```text
모델 "provider/model"은(는) 허용되지 않습니다. 제공자 목록을 확인하려면 /models를 사용하고, 모델 목록을 확인하려면 /models <provider>를 사용하십시오.
다음 명령으로 추가하십시오: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

모델을 `agents.defaults.models`에 추가하거나, 허용 목록을 완전히 해제하거나(키 제거), `/model list`에서 모델을 선택하여 문제를 해결하십시오. 거부된 명령에 `/model openai/gpt-5.5 --runtime codex`와 같은 런타임 재정의가 포함된 경우 먼저 허용 목록을 수정한 다음 동일한 `/model ... --runtime ...` 명령을 다시 시도하십시오.

로컬/GGUF 모델의 경우 허용 목록에는 `ollama/gemma4:26b` 또는 `lmstudio/Gemma4-26b-a4-it-gguf`와 같이 제공자 접두사가 포함된 전체 참조가 필요합니다. 정확한 문자열은 `openclaw models list --provider <provider>`에서 확인하십시오. 허용 목록이 활성화되면 파일 이름이나 표시 이름만으로는 충분하지 않습니다.

모든 모델을 나열하지 않고 제공자를 제한하려면 `provider/*` 와일드카드 항목을 사용하십시오.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

그러면 `/model`, `/models` 및 모델 선택기에 해당 제공자에서 검색된 카탈로그만 표시되며, 허용 목록을 편집하지 않아도 새 모델이 나타날 수 있습니다. 정확한 `provider/model` 항목과 `provider/*` 항목을 함께 사용하여 다른 제공자의 특정 모델 하나를 포함할 수 있습니다.

별칭이 포함된 허용 목록 예시는 다음과 같습니다.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="CLI에서 허용 목록을 안전하게 편집하기">
항목을 추가하려면 `--merge`를 사용하십시오.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set`은 기존 항목을 삭제하게 되는 경우 `agents.defaults.models`, `models.providers` 또는 `models.providers.<id>.models`에 대한 일반 객체 할당을 거부합니다. 새 값이 전체 대상 값이 되어야 하는 경우에만 `--replace`를 사용하십시오. 대화형 제공자 설정과 `openclaw configure --section model`은 이미 제공자 범위의 선택 항목을 허용 목록에 병합하므로 제공자를 추가해도 관련 없는 항목이 삭제되지 않습니다. 또한 구성 시 기존 `agents.defaults.model.primary`가 유지됩니다. `openclaw models auth login --provider <id> --set-default` 및 `openclaw models set <model>`과 같은 명시적 명령은 계속 기본 모델을 교체합니다.
</Accordion>

## 채팅에서 `/model` 사용하기

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` 및 `/model list`는 간결한 번호 선택기(모델 계열 + 사용 가능한 제공자)를 표시하며, `/model <#>`로 항목을 선택합니다. Discord에서는 제공자/모델 드롭다운이 열리고 Submit 단계가 이어집니다. Telegram에서는 선택기에서 선택한 항목이 세션 범위에만 적용되며 `openclaw.json`에 있는 에이전트의 영구 기본값을 절대 다시 작성하지 않습니다. `/models add`는 더 이상 사용되지 않으며 채팅에서 모델을 등록하는 대신 메시지를 반환합니다.
- `/model`은 새 세션 선택을 즉시 유지합니다. 에이전트가 유휴 상태이면 다음 실행부터 바로 사용합니다. 실행이 이미 진행 중이면 다음 정상 재시도 지점으로 전환이 대기열에 추가됩니다(도구 활동이나 응답 출력이 이미 시작된 경우에는 그보다 나중 지점).
- `/model default`는 세션 선택을 지워 구성된 기본 모델을 다시 상속하도록 합니다.
- 사용자가 선택한 `/model` 참조는 해당 세션에서 엄격하게 적용됩니다. 이 참조에 접근할 수 없게 되면 `agents.defaults.model.fallbacks`를 통해 조용히 대체하는 대신 응답이 명시적으로 실패합니다. 구성된 기본값과 Cron 작업의 기본 모델에는 계속 대체 체인을 사용합니다.
- `/model status`는 상세 보기입니다. 제공자별 인증 후보와, 구성된 경우 제공자 엔드포인트 `baseUrl` 및 `api` 모드를 표시합니다.
- 모델 참조는 첫 번째 `/`를 기준으로 분할하여 구문 분석합니다. `provider/model` 형식으로 입력하십시오. 모델 ID 자체에 `/`가 포함된 경우(OpenRouter 스타일)에는 제공자 접두사를 포함하십시오(예: `/model openrouter/moonshotai/kimi-k2`). 제공자를 생략하면 OpenClaw는 (1) 별칭 일치, (2) 접두사 없는 해당 모델 ID와 정확히 일치하는 고유한 구성 제공자, (3) 구성된 기본 제공자(더 이상 사용되지 않는 대체 방식) 순서로 시도합니다. 해당 제공자가 구성된 기본 모델을 더 이상 노출하지 않으면, 제거된 제공자의 오래된 기본값이 표시되는 것을 방지하기 위해 대신 구성된 첫 번째 제공자/모델을 사용합니다.
- 모델 참조는 소문자로 정규화됩니다. 그 외에는 제공자 ID가 정확히 일치해야 하므로 Plugin이 안내하는 ID를 사용하십시오.

전체 명령 동작 및 구성: [슬래시 명령](/ko/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

하위 명령 없이 `openclaw models`를 실행하면 `models status`의 바로 가기로 동작하며, 인증 저장소 프로필의 OAuth 만료도 표시합니다(기본적으로 24h 이내이면 경고). 전체 플래그, JSON 구조 및 인증 프로필 하위 명령: [Models CLI 참조](/ko/cli/models).

<AccordionGroup>
  <Accordion title="검색(OpenRouter 무료 모델)">
    `openclaw models scan`은 OpenRouter의 공개 무료 모델 카탈로그를 검사하고 도구 및 이미지 지원 여부를 확인하기 위해 후보를 실시간으로 시험할 수 있습니다. 카탈로그 자체는 공개되어 있으므로 메타데이터만 검색할 때(`--no-probe`)는 키가 필요하지 않습니다. 실시간 시험과 `--set-default`/`--set-image`에는 OpenRouter API 키(인증 프로필 또는 `OPENROUTER_API_KEY`)가 필요하며, 키가 없으면 메타데이터 전용 출력으로 제한됩니다.

    결과는 이미지 지원, 도구 지연 시간, 컨텍스트 크기, 매개변수 수 순서로 순위를 지정합니다. TTY에서는 시험한 결과에 대해 대체 항목을 대화형으로 선택하라는 메시지가 표시됩니다. 비대화형 모드에서 기본값을 수락하려면 `--yes`가 필요합니다.

  </Accordion>
</AccordionGroup>

## 모델 레지스트리(`models.json`)

`models.providers` 아래에 구성된 사용자 지정 제공자는 에이전트 디렉터리 아래의 `models.json`에 기록됩니다(기본값: `~/.openclaw/agents/<agentId>/agent/models.json`). 제공자 Plugin 카탈로그는 Plugin이 소유하는 생성된 개별 카탈로그 파일로 별도 저장되며 자동으로 로드됩니다. 이 파일은 기본적으로 구성과 병합됩니다. 구성한 제공자만 사용하려면 `models.mode: "replace"`를 설정하십시오.

<AccordionGroup>
  <Accordion title="병합 모드 우선순위">
    제공자 ID가 일치하는 경우:

    - 에이전트 `models.json`에 이미 있는 비어 있지 않은 `baseUrl`이 우선합니다.
    - `models.json`의 비어 있지 않은 `apiKey`는 현재 구성/인증 프로필 컨텍스트에서 해당 제공자가 SecretRef로 관리되지 않는 경우에만 우선합니다.
    - SecretRef로 관리되는 `apiKey` 값은 확인된 보안 비밀을 유지하는 대신 소스 마커에서 새로 고칩니다. 환경 변수 참조에는 환경 변수 이름을, 파일/실행 참조에는 `secretref-managed`를 사용합니다.
    - SecretRef로 관리되는 헤더 값도 같은 방식으로 새로 고치며, 환경 변수 참조에는 `secretref-env:ENV_VAR_NAME`을 사용합니다.
    - `models.json`에서 비어 있거나 누락된 `apiKey`/`baseUrl`은 구성의 `models.providers`를 사용합니다.
    - 다른 제공자 필드는 구성 및 정규화된 카탈로그 데이터에서 새로 고칩니다.

  </Accordion>
</AccordionGroup>

마커 유지는 소스를 기준으로 합니다. OpenClaw는 `models.json`을 다시 생성할 때마다 확인된 런타임 보안 비밀 값이 아니라 활성 소스 구성 스냅샷(확인 전)의 마커를 기록합니다. 여기에는 `openclaw agent`와 같은 명령 기반 경로도 포함됩니다.

## 관련 항목

- [에이전트 런타임](/ko/concepts/agent-runtimes) — OpenClaw, Codex 및 기타 에이전트 루프 런타임
- [구성 참조](/ko/gateway/config-agents#agent-defaults) — 모델 구성 키
- [이미지 생성](/ko/tools/image-generation) — 이미지 모델 구성
- [모델 장애 조치](/ko/concepts/model-failover) — 대체 체인
- [모델 제공자](/ko/concepts/model-providers) — 제공자 라우팅 및 인증
- [Models CLI 참조](/ko/cli/models) — 전체 명령 및 플래그 참조
- [음악 생성](/ko/tools/music-generation) — 음악 모델 구성
- [동영상 생성](/ko/tools/video-generation) — 동영상 모델 구성
