---
read_when:
    - 모델 CLI 추가 또는 수정 (models list/set/scan/aliases/fallbacks)
    - 모델 폴백 동작 또는 선택 UX 변경
    - 모델 스캔 프로브 업데이트(도구/이미지)
sidebarTitle: Models CLI
summary: '모델 CLI: list, set, aliases, fallbacks, scan, status'
title: 모델 CLI
x-i18n:
    generated_at: "2026-05-02T20:48:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="모델 장애 조치" href="/ko/concepts/model-failover">
    인증 프로필 순환, 쿨다운, 그리고 이것이 대체 모델과 상호 작용하는 방식입니다.
  </Card>
  <Card title="모델 제공자" href="/ko/concepts/model-providers">
    빠른 제공자 개요와 예시입니다.
  </Card>
  <Card title="에이전트 런타임" href="/ko/concepts/agent-runtimes">
    PI, Codex 및 기타 에이전트 루프 런타임입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults">
    모델 구성 키입니다.
  </Card>
</CardGroup>

모델 참조는 제공자와 모델을 선택합니다. 일반적으로 저수준 에이전트 런타임을 선택하지는 않습니다. 예를 들어 `openai/gpt-5.5`는 `agents.defaults.agentRuntime.id`에 따라 일반 OpenAI 제공자 경로를 통해 실행될 수도 있고 Codex 앱 서버 런타임을 통해 실행될 수도 있습니다. Codex 런타임 모드에서 `openai/gpt-*` 참조는 API 키 과금을 의미하지 않으며, 인증은 Codex 계정 또는 `openai-codex` 인증 프로필에서 올 수 있습니다. [에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하세요.

## 모델 선택 작동 방식

OpenClaw는 다음 순서로 모델을 선택합니다.

<Steps>
  <Step title="기본 모델">
    `agents.defaults.model.primary`(또는 `agents.defaults.model`).
  </Step>
  <Step title="대체 모델">
    `agents.defaults.model.fallbacks`(순서대로).
  </Step>
  <Step title="제공자 인증 장애 조치">
    다음 모델로 이동하기 전에 제공자 내부에서 인증 장애 조치가 발생합니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="관련 모델 표면">
    - `agents.defaults.models`는 OpenClaw가 사용할 수 있는 모델의 허용 목록/카탈로그입니다(별칭 포함).
    - `agents.defaults.imageModel`은 기본 모델이 이미지를 받을 수 **없을 때만** 사용됩니다.
    - `agents.defaults.pdfModel`은 `pdf` 도구에서 사용됩니다. 생략하면 도구는 `agents.defaults.imageModel`로 대체한 다음 확인된 세션/기본 모델로 대체합니다.
    - `agents.defaults.imageGenerationModel`은 공유 이미지 생성 기능에서 사용됩니다. 생략하면 `image_generate`가 인증으로 뒷받침되는 제공자 기본값을 여전히 추론할 수 있습니다. 먼저 현재 기본 제공자를 시도한 다음, 남은 등록된 이미지 생성 제공자를 제공자 ID 순서대로 시도합니다. 특정 제공자/모델을 설정하는 경우 해당 제공자의 인증/API 키도 구성하세요.
    - `agents.defaults.musicGenerationModel`은 공유 음악 생성 기능에서 사용됩니다. 생략하면 `music_generate`가 인증으로 뒷받침되는 제공자 기본값을 여전히 추론할 수 있습니다. 먼저 현재 기본 제공자를 시도한 다음, 남은 등록된 음악 생성 제공자를 제공자 ID 순서대로 시도합니다. 특정 제공자/모델을 설정하는 경우 해당 제공자의 인증/API 키도 구성하세요.
    - `agents.defaults.videoGenerationModel`은 공유 동영상 생성 기능에서 사용됩니다. 생략하면 `video_generate`가 인증으로 뒷받침되는 제공자 기본값을 여전히 추론할 수 있습니다. 먼저 현재 기본 제공자를 시도한 다음, 남은 등록된 동영상 생성 제공자를 제공자 ID 순서대로 시도합니다. 특정 제공자/모델을 설정하는 경우 해당 제공자의 인증/API 키도 구성하세요.
    - 에이전트별 기본값은 바인딩과 함께 `agents.list[].model`을 통해 `agents.defaults.model`을 재정의할 수 있습니다([다중 에이전트 라우팅](/ko/concepts/multi-agent) 참조).

  </Accordion>
</AccordionGroup>

## 선택 소스 및 대체 동작

동일한 `provider/model`도 어디에서 왔는지에 따라 다른 의미를 가질 수 있습니다.

- 구성된 기본값(`agents.defaults.model.primary` 및 에이전트별 기본 모델)은 일반적인 시작점이며 `agents.defaults.model.fallbacks`를 사용합니다.
- 자동 대체 선택은 임시 복구 상태입니다. 나중 턴에서 알려진 불량 기본 모델을 먼저 탐색하지 않고도 대체 체인을 계속 사용할 수 있도록 `modelOverrideSource: "auto"`와 함께 저장됩니다.
- 사용자 세션 선택은 정확합니다. `/model`, 모델 선택기, `session_status(model=...)`, `sessions.patch`는 `modelOverrideSource: "user"`를 저장합니다. 선택한 제공자/모델에 접근할 수 없으면 OpenClaw는 다른 구성된 모델로 넘어가지 않고 명확하게 실패합니다.
- Cron `--model` / 페이로드 `model`은 작업별 기본 모델입니다. 작업이 명시적 페이로드 `fallbacks`를 제공하지 않는 한 구성된 대체 모델을 계속 사용합니다(엄격한 cron 실행에는 `fallbacks: []` 사용).
- CLI 기본 모델 및 허용 목록 선택기는 전체 내장 카탈로그를 로드하는 대신 명시적 `models.providers.*.models`를 나열하여 `models.mode: "replace"`를 따릅니다.
- Control UI 모델 선택기는 Gateway에 구성된 모델 뷰를 요청합니다. `agents.defaults.models`가 있으면 이를 사용하고, 그렇지 않으면 명시적 `models.providers.*.models`와 사용 가능한 인증이 있는 제공자를 사용합니다. 전체 내장 카탈로그는 `view: "all"`이 있는 `models.list` 또는 `openclaw models list --all` 같은 명시적 탐색 뷰에만 사용됩니다.

## 빠른 모델 정책

- 사용 가능한 가장 강력한 최신 세대 모델을 기본 모델로 설정하세요.
- 비용/지연 시간에 민감한 작업과 위험도가 낮은 채팅에는 대체 모델을 사용하세요.
- 도구가 활성화된 에이전트나 신뢰할 수 없는 입력에는 오래되었거나 약한 모델 등급을 피하세요.

## 온보딩(권장)

구성을 직접 편집하고 싶지 않다면 온보딩을 실행하세요.

```bash
openclaw onboard
```

**OpenAI Code (Codex) subscription**(OAuth) 및 **Anthropic**(API 키 또는 Claude CLI)을 포함한 일반 제공자의 모델 + 인증을 설정할 수 있습니다.

## 구성 키(개요)

- `agents.defaults.model.primary` 및 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 및 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 및 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 및 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 및 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`(허용 목록 + 별칭 + 제공자 매개변수)
- `models.providers`(`models.json`에 기록되는 사용자 지정 제공자)

<Note>
모델 참조는 소문자로 정규화됩니다. `z.ai/*` 같은 제공자 별칭은 `zai/*`로 정규화됩니다.

제공자 구성 예시(OpenCode 포함)는 [OpenCode](/ko/providers/opencode)에 있습니다.
</Note>

### 안전한 허용 목록 편집

`agents.defaults.models`를 직접 업데이트할 때는 추가 방식 쓰기를 사용하세요.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="덮어쓰기 방지 규칙">
    `openclaw config set`은 모델/제공자 맵을 실수로 덮어쓰지 않도록 보호합니다. `agents.defaults.models`, `models.providers`, 또는 `models.providers.<id>.models`에 일반 객체를 할당했을 때 기존 항목이 제거된다면 거부됩니다. 추가 변경에는 `--merge`를 사용하고, 제공된 값이 완전한 대상 값이 되어야 할 때만 `--replace`를 사용하세요.

    대화형 제공자 설정과 `openclaw configure --section model`도 제공자 범위 선택을 기존 허용 목록에 병합하므로 Codex, Ollama 또는 다른 제공자를 추가해도 관련 없는 모델 항목이 제거되지 않습니다. 제공자 인증을 다시 적용할 때 configure는 기존 `agents.defaults.model.primary`를 보존합니다. `openclaw models auth login --provider <id> --set-default` 및 `openclaw models set <model>` 같은 명시적 기본값 설정 명령은 여전히 `agents.defaults.model.primary`를 교체합니다.

  </Accordion>
</AccordionGroup>

## "모델이 허용되지 않음"(그리고 답장이 멈추는 이유)

`agents.defaults.models`가 설정되어 있으면 `/model`과 세션 재정의의 **허용 목록**이 됩니다. 사용자가 해당 허용 목록에 없는 모델을 선택하면 OpenClaw는 다음을 반환합니다.

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
이는 일반 답장이 생성되기 **전에** 발생하므로 메시지가 "응답하지 않은" 것처럼 느껴질 수 있습니다. 해결 방법은 다음 중 하나입니다.

- 모델을 `agents.defaults.models`에 추가하거나
- 허용 목록을 지우거나(`agents.defaults.models` 제거)
- `/model list`에서 모델을 선택하세요.

</Warning>

로컬/GGUF 모델의 경우 허용 목록에 전체 제공자 접두사 포함 참조를 저장하세요.
예: `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, 또는
`openclaw models list --provider <provider>`에 표시되는 정확한 제공자/모델입니다.
허용 목록이 활성화되어 있을 때는 접두사가 없는 로컬 파일명이나 표시 이름만으로는 충분하지 않습니다.

허용 목록 구성 예시:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## 채팅에서 모델 전환(`/model`)

다시 시작하지 않고 현재 세션의 모델을 전환할 수 있습니다.

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="선택기 동작">
    - `/model`(및 `/model list`)은 간결한 번호 매기기 선택기입니다(모델 제품군 + 사용 가능한 제공자).
    - Discord에서는 `/model` 및 `/models`가 제공자 및 모델 드롭다운과 제출 단계가 있는 대화형 선택기를 엽니다.
    - Telegram에서는 `/models` 선택기 선택이 세션 범위에만 적용되며, `openclaw.json`의 에이전트 영구 기본값을 변경하지 않습니다.
    - `/models add`는 더 이상 사용되지 않으며 이제 채팅에서 모델을 등록하는 대신 지원 중단 메시지를 반환합니다.
    - `/model <#>`는 해당 선택기에서 선택합니다.

  </Accordion>
  <Accordion title="영속성 및 실시간 전환">
    - `/model`은 새 세션 선택을 즉시 유지합니다.
    - 에이전트가 유휴 상태이면 다음 실행이 곧바로 새 모델을 사용합니다.
    - 실행이 이미 활성화되어 있으면 OpenClaw는 실시간 전환을 보류 중으로 표시하고 깔끔한 재시도 지점에서만 새 모델로 다시 시작합니다.
    - 도구 활동이나 답장 출력이 이미 시작된 경우, 보류 중인 전환은 이후 재시도 기회 또는 다음 사용자 턴까지 대기 상태로 남을 수 있습니다.
    - 사용자가 선택한 `/model` 참조는 해당 세션에서 엄격합니다. 선택한 제공자/모델에 접근할 수 없으면 `agents.defaults.model.fallbacks`에서 조용히 답하는 대신 답장이 명확하게 실패합니다. 이는 여전히 대체 체인을 사용할 수 있는 구성된 기본값 및 cron 작업 기본 모델과 다릅니다.
    - `/model status`는 상세 뷰입니다(인증 후보 및, 구성된 경우, 제공자 엔드포인트 `baseUrl` + `api` 모드).

  </Accordion>
  <Accordion title="참조 구문 분석">
    - 모델 참조는 **첫 번째** `/`를 기준으로 분리하여 구문 분석됩니다. `/model <ref>`를 입력할 때는 `provider/model`을 사용하세요.
    - 모델 ID 자체에 `/`가 포함된 경우(OpenRouter 스타일) 제공자 접두사를 포함해야 합니다(예: `/model openrouter/moonshotai/kimi-k2`).
    - 제공자를 생략하면 OpenClaw는 다음 순서로 입력을 확인합니다.
      1. 별칭 일치
      2. 접두사가 없는 정확한 모델 ID에 대한 고유한 구성된 제공자 일치
      3. 구성된 기본 제공자로의 더 이상 사용되지 않는 대체 동작 — 해당 제공자가 더 이상 구성된 기본 모델을 노출하지 않으면 OpenClaw는 오래된 제거된 제공자 기본값이 드러나지 않도록 첫 번째 구성된 제공자/모델로 대체합니다.
  </Accordion>
</AccordionGroup>

전체 명령 동작/구성: [슬래시 명령](/ko/tools/slash-commands).

## CLI 명령

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`(하위 명령 없음)는 `models status`의 바로 가기입니다.

### `models list`

기본적으로 구성되었거나 인증으로 사용 가능한 모델을 표시합니다. 유용한 플래그:

<ParamField path="--all" type="boolean">
  전체 카탈로그입니다. 인증이 구성되기 전에 번들된 제공자 소유 정적 카탈로그 행을 포함하므로, 탐색 전용 보기에서 일치하는 제공자 자격 증명을 추가하기 전까지 사용할 수 없는 모델을 표시할 수 있습니다.
</ParamField>
<ParamField path="--local" type="boolean">
  로컬 제공자만 표시합니다.
</ParamField>
<ParamField path="--provider <id>" type="string">
  제공자 ID로 필터링합니다. 예: `moonshot`. 대화형 선택기의 표시 레이블은 허용되지 않습니다.
</ParamField>
<ParamField path="--plain" type="boolean">
  한 줄에 모델 하나씩 표시합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기계가 읽을 수 있는 출력입니다.
</ParamField>

### `models status`

확인된 기본 모델, fallback, 이미지 모델, 구성된 제공자의 인증 개요를 표시합니다. 또한 인증 저장소에서 찾은 프로필의 OAuth 만료 상태도 표시합니다(기본적으로 24시간 이내에 경고). `--plain`은 확인된 기본 모델만 출력합니다.

<AccordionGroup>
  <Accordion title="인증 및 프로브 동작">
    - OAuth 상태는 항상 표시됩니다(`--json` 출력에도 포함됨). 구성된 제공자에 자격 증명이 없으면 `models status`가 **인증 누락** 섹션을 출력합니다.
    - JSON에는 `auth.oauth`(경고 기간 + 프로필)과 `auth.providers`(env 기반 자격 증명을 포함한 제공자별 유효 인증)가 포함됩니다. `auth.oauth`는 인증 저장소 프로필 상태만 나타내며, env 전용 제공자는 여기에 표시되지 않습니다.
    - 자동화에는 `--check`를 사용합니다(누락/만료 시 종료 `1`, 만료 임박 시 `2`).
    - 라이브 인증 확인에는 `--probe`를 사용합니다. 프로브 행은 인증 프로필, env 자격 증명 또는 `models.json`에서 올 수 있습니다.
    - 명시적 `auth.order.<provider>`가 저장된 프로필을 생략하면, 프로브는 이를 시도하는 대신 `excluded_by_auth_order`를 보고합니다. 인증은 있지만 해당 제공자에 대해 프로브 가능한 모델을 확인할 수 없으면 프로브는 `status: no_model`을 보고합니다.

  </Accordion>
</AccordionGroup>

<Note>
인증 선택은 제공자/계정에 따라 달라집니다. 항상 켜져 있는 Gateway 호스트의 경우 API 키가 일반적으로 가장 예측 가능합니다. Claude CLI 재사용과 기존 Anthropic OAuth/토큰 프로필도 지원됩니다.
</Note>

예시(Claude CLI):

```bash
claude auth login
openclaw models status
```

## 스캔(OpenRouter 무료 모델)

`openclaw models scan`은 OpenRouter의 **무료 모델 카탈로그**를 검사하며, 선택적으로 모델의 도구 및 이미지 지원을 프로브할 수 있습니다.

<ParamField path="--no-probe" type="boolean">
  라이브 프로브를 건너뜁니다(메타데이터만).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  최소 매개변수 크기(십억 단위).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  더 오래된 모델을 건너뜁니다.
</ParamField>
<ParamField path="--provider <name>" type="string">
  제공자 접두사 필터입니다.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  fallback 목록 크기입니다.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary`를 첫 번째 선택 항목으로 설정합니다.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary`를 첫 번째 이미지 선택 항목으로 설정합니다.
</ParamField>

<Note>
OpenRouter `/models` 카탈로그는 공개되어 있으므로, 메타데이터 전용 스캔은 키 없이도 무료 후보를 나열할 수 있습니다. 프로브와 추론에는 여전히 OpenRouter API 키(인증 프로필 또는 `OPENROUTER_API_KEY`에서)가 필요합니다. 사용할 수 있는 키가 없으면 `openclaw models scan`은 메타데이터 전용 출력으로 fallback하고 구성을 변경하지 않습니다. 메타데이터 전용 모드를 명시적으로 요청하려면 `--no-probe`를 사용하세요.
</Note>

스캔 결과는 다음 기준으로 순위가 매겨집니다.

1. 이미지 지원
2. 도구 지연 시간
3. 컨텍스트 크기
4. 매개변수 수

입력:

- OpenRouter `/models` 목록(`:free` 필터)
- 라이브 프로브에는 인증 프로필 또는 `OPENROUTER_API_KEY`의 OpenRouter API 키가 필요합니다([환경 변수](/ko/help/environment) 참고).
- 선택적 필터: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- 요청/프로브 제어: `--timeout`, `--concurrency`

라이브 프로브가 TTY에서 실행되면 fallback을 대화형으로 선택할 수 있습니다. 비대화형 모드에서는 `--yes`를 전달하여 기본값을 수락합니다. 메타데이터 전용 결과는 정보 제공용입니다. OpenClaw가 사용할 수 없는 키 없는 OpenRouter 모델을 구성하지 않도록, `--set-default`와 `--set-image`에는 라이브 프로브가 필요합니다.

## 모델 레지스트리(`models.json`)

`models.providers`의 사용자 지정 제공자는 에이전트 디렉터리 아래의 `models.json`에 기록됩니다(기본값 `~/.openclaw/agents/<agentId>/agent/models.json`). 이 파일은 `models.mode`가 `replace`로 설정되지 않는 한 기본적으로 병합됩니다.

<AccordionGroup>
  <Accordion title="병합 모드 우선순위">
    일치하는 제공자 ID에 대한 병합 모드 우선순위:

    - 에이전트 `models.json`에 이미 존재하는 비어 있지 않은 `baseUrl`이 우선합니다.
    - 에이전트 `models.json`의 비어 있지 않은 `apiKey`는 해당 제공자가 현재 구성/인증 프로필 컨텍스트에서 SecretRef로 관리되지 않을 때만 우선합니다.
    - SecretRef로 관리되는 제공자의 `apiKey` 값은 확인된 시크릿을 유지하는 대신 소스 마커(env 참조의 경우 `ENV_VAR_NAME`, file/exec 참조의 경우 `secretref-managed`)에서 새로 고쳐집니다.
    - SecretRef로 관리되는 제공자 헤더 값은 소스 마커(env 참조의 경우 `secretref-env:ENV_VAR_NAME`, file/exec 참조의 경우 `secretref-managed`)에서 새로 고쳐집니다.
    - 비어 있거나 누락된 에이전트 `apiKey`/`baseUrl`은 구성의 `models.providers`로 fallback합니다.
    - 그 밖의 제공자 필드는 구성 및 정규화된 카탈로그 데이터에서 새로 고쳐집니다.

  </Accordion>
</AccordionGroup>

<Note>
마커 지속성은 소스를 기준으로 합니다. OpenClaw는 확인된 런타임 시크릿 값이 아니라 활성 소스 구성 스냅샷(해결 전)에서 마커를 기록합니다. 이는 `openclaw agent` 같은 명령 기반 경로를 포함하여 OpenClaw가 `models.json`을 다시 생성할 때마다 적용됩니다.
</Note>

## 관련 항목

- [에이전트 런타임](/ko/concepts/agent-runtimes) — PI, Codex 및 기타 에이전트 루프 런타임
- [구성 참조](/ko/gateway/config-agents#agent-defaults) — 모델 구성 키
- [이미지 생성](/ko/tools/image-generation) — 이미지 모델 구성
- [모델 failover](/ko/concepts/model-failover) — fallback 체인
- [모델 제공자](/ko/concepts/model-providers) — 제공자 라우팅 및 인증
- [음악 생성](/ko/tools/music-generation) — 음악 모델 구성
- [비디오 생성](/ko/tools/video-generation) — 비디오 모델 구성
