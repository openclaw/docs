---
read_when:
    - 모델 CLI 추가 또는 수정하기(`models list/set/scan/aliases/fallbacks`)
    - 모델 대체 경로 동작 또는 선택 UX 변경하기
    - 모델 스캔 프로브 업데이트하기(tools/images)
sidebarTitle: Models CLI
summary: 'Models CLI: 목록, 설정, 별칭, 대체 경로, 스캔, 상태'
title: 모델 CLI
x-i18n:
    generated_at: "2026-04-26T11:27:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="모델 장애 조치" href="/ko/concepts/model-failover">
    인증 프로필 순환, 쿨다운, 그리고 이것이 대체 경로와 어떻게 상호작용하는지 설명합니다.
  </Card>
  <Card title="모델 provider" href="/ko/concepts/model-providers">
    provider 개요와 예시를 빠르게 확인할 수 있습니다.
  </Card>
  <Card title="에이전트 런타임" href="/ko/concepts/agent-runtimes">
    PI, Codex, 기타 에이전트 루프 런타임.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults">
    모델 config 키.
  </Card>
</CardGroup>

모델 ref는 provider와 모델을 선택합니다. 일반적으로 저수준 에이전트 런타임까지 선택하지는 않습니다. 예를 들어 `openai/gpt-5.5`는 `agents.defaults.agentRuntime.id`에 따라 일반 OpenAI provider 경로로 실행될 수도 있고 Codex app-server 런타임으로 실행될 수도 있습니다. [에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하세요.

## 모델 선택 방식

OpenClaw는 다음 순서로 모델을 선택합니다.

<Steps>
  <Step title="기본 모델">
    `agents.defaults.model.primary`(또는 `agents.defaults.model`).
  </Step>
  <Step title="대체 경로">
    `agents.defaults.model.fallbacks`(순서대로).
  </Step>
  <Step title="Provider 인증 장애 조치">
    인증 장애 조치는 다음 모델로 이동하기 전에 provider 내부에서 발생합니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="관련 모델 표면">
    - `agents.defaults.models`는 OpenClaw가 사용할 수 있는 모델의 허용 목록/카탈로그입니다(별칭 포함).
    - `agents.defaults.imageModel`은 기본 모델이 이미지를 받을 수 없을 때에만 사용됩니다.
    - `agents.defaults.pdfModel`은 `pdf` 도구에서 사용됩니다. 생략하면 도구는 `agents.defaults.imageModel`로, 그다음 확인된 세션/기본 모델로 대체됩니다.
    - `agents.defaults.imageGenerationModel`은 공용 이미지 생성 capability에서 사용됩니다. 생략해도 `image_generate`는 인증이 있는 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 다음, provider id 순서로 나머지 등록된 이미지 생성 provider를 시도합니다. 특정 provider/모델을 설정하는 경우 해당 provider의 인증/API 키도 구성하세요.
    - `agents.defaults.musicGenerationModel`은 공용 음악 생성 capability에서 사용됩니다. 생략해도 `music_generate`는 인증이 있는 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 다음, provider id 순서로 나머지 등록된 음악 생성 provider를 시도합니다. 특정 provider/모델을 설정하는 경우 해당 provider의 인증/API 키도 구성하세요.
    - `agents.defaults.videoGenerationModel`은 공용 비디오 생성 capability에서 사용됩니다. 생략해도 `video_generate`는 인증이 있는 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 다음, provider id 순서로 나머지 등록된 비디오 생성 provider를 시도합니다. 특정 provider/모델을 설정하는 경우 해당 provider의 인증/API 키도 구성하세요.
    - 에이전트별 기본값은 `agents.list[].model`과 바인딩을 통해 `agents.defaults.model`을 재정의할 수 있습니다([다중 에이전트 라우팅](/ko/concepts/multi-agent) 참조).

  </Accordion>
</AccordionGroup>

## 빠른 모델 정책

- 사용 가능한 가장 강력한 최신 세대 모델을 기본값으로 설정하세요.
- 비용/지연 시간에 민감한 작업과 중요도가 낮은 채팅에는 대체 경로를 사용하세요.
- 도구가 활성화된 에이전트나 신뢰할 수 없는 입력에는 오래되었거나 약한 모델 계층을 피하세요.

## 온보딩(권장)

config를 직접 편집하고 싶지 않다면 온보딩을 실행하세요.

```bash
openclaw onboard
```

이 명령은 **OpenAI Code (Codex) subscription**(OAuth)과 **Anthropic**(API 키 또는 Claude CLI)을 포함한 일반적인 provider의 모델 + 인증을 설정할 수 있습니다.

## config 키(개요)

- `agents.defaults.model.primary` 및 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 및 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 및 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 및 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 및 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (허용 목록 + 별칭 + provider params)
- `models.providers` (`models.json`에 기록되는 커스텀 provider)

<Note>
모델 ref는 소문자로 정규화됩니다. `z.ai/*` 같은 provider 별칭은 `zai/*`로 정규화됩니다.

OpenCode를 포함한 provider 구성 예시는 [OpenCode](/ko/providers/opencode)에 있습니다.
</Note>

### 안전한 허용 목록 편집

`agents.defaults.models`를 수동으로 업데이트할 때는 추가 방식 쓰기를 사용하세요.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="덮어쓰기 방지 규칙">
    `openclaw config set`은 실수로 모델/provider 맵을 덮어쓰는 것을 방지합니다. `agents.defaults.models`, `models.providers`, 또는 `models.providers.<id>.models`에 대한 일반 객체 할당이 기존 항목을 제거하게 되면 거부됩니다. 추가 변경에는 `--merge`를 사용하고, 제공한 값이 전체 대상 값이 되어야 할 때만 `--replace`를 사용하세요.

    대화형 provider 설정과 `openclaw configure --section model`도 provider 범위 선택을 기존 허용 목록에 병합하므로 Codex, Ollama, 또는 다른 provider를 추가해도 관련 없는 모델 항목이 사라지지 않습니다. configure는 provider 인증을 다시 적용할 때 기존 `agents.defaults.model.primary`를 유지합니다. `openclaw models auth login --provider <id> --set-default` 및 `openclaw models set <model>` 같은 명시적 기본값 설정 명령은 여전히 `agents.defaults.model.primary`를 교체합니다.

  </Accordion>
</AccordionGroup>

## "Model is not allowed"가 발생하는 이유(그리고 응답이 멈추는 이유)

`agents.defaults.models`가 설정되면 `/model`과 세션 override에 대한 **허용 목록**이 됩니다. 사용자가 이 허용 목록에 없는 모델을 선택하면 OpenClaw는 다음을 반환합니다.

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
이 동작은 일반 응답이 생성되기 **전에** 발생하므로, 메시지가 "응답하지 않은 것처럼" 느껴질 수 있습니다. 해결 방법은 다음 중 하나입니다.

- 모델을 `agents.defaults.models`에 추가하거나
- 허용 목록을 비우거나(`agents.defaults.models` 제거)
- `/model list`에서 모델을 선택하는 것입니다.

</Warning>

허용 목록 config 예시:

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

## 채팅에서 모델 전환하기(`/model`)

재시작하지 않고 현재 세션의 모델을 전환할 수 있습니다.

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="선택기 동작">
    - `/model`(및 `/model list`)은 간단한 번호 기반 선택기입니다(모델 패밀리 + 사용 가능한 provider).
    - Discord에서는 `/model`과 `/models`가 provider와 모델 드롭다운, 그리고 제출 단계가 포함된 대화형 선택기를 엽니다.
    - `/models add`는 더 이상 권장되지 않으며, 이제 채팅에서 모델을 등록하는 대신 더 이상 권장되지 않는다는 메시지를 반환합니다.
    - `/model <#>`는 해당 선택기에서 선택합니다.

  </Accordion>
  <Accordion title="지속성 및 라이브 전환">
    - `/model`은 새 세션 선택을 즉시 저장합니다.
    - 에이전트가 유휴 상태이면 다음 실행에서 바로 새 모델을 사용합니다.
    - 실행이 이미 활성 상태라면 OpenClaw는 라이브 전환을 보류 상태로 표시하고, 정리된 재시도 지점에서만 새 모델로 다시 시작합니다.
    - 도구 활동이나 응답 출력이 이미 시작된 경우, 보류된 전환은 이후 재시도 기회나 다음 사용자 턴까지 대기 상태로 남을 수 있습니다.
    - `/model status`는 자세한 보기입니다(인증 후보, 그리고 구성된 경우 provider endpoint `baseUrl` + `api` mode).

  </Accordion>
  <Accordion title="Ref 파싱">
    - 모델 ref는 **첫 번째** `/`를 기준으로 분리해 파싱합니다. `/model <ref>`를 입력할 때는 `provider/model` 형식을 사용하세요.
    - 모델 ID 자체에 `/`가 포함된 경우(OpenRouter 스타일), provider 접두사를 포함해야 합니다(예: `/model openrouter/moonshotai/kimi-k2`).
    - provider를 생략하면 OpenClaw는 다음 순서로 입력을 확인합니다.
      1. 별칭 일치
      2. 해당 정확한 접두사 없는 모델 id에 대한 고유한 구성 provider 일치
      3. 구성된 기본 provider에 대한 더 이상 권장되지 않는 대체 경로 — 해당 provider가 더 이상 구성된 기본 모델을 제공하지 않으면, OpenClaw는 오래되어 제거된 provider 기본값이 노출되지 않도록 대신 첫 번째 구성 provider/모델로 대체합니다.
  </Accordion>
</AccordionGroup>

전체 명령 동작/config: [슬래시 명령](/ko/tools/slash-commands).

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

`openclaw models`(하위 명령 없음)은 `models status`의 바로가기입니다.

### `models list`

기본적으로 구성된 모델을 표시합니다. 유용한 플래그:

<ParamField path="--all" type="boolean">
  전체 카탈로그. 인증이 구성되기 전에도 번들된 provider 소유 정적 카탈로그 행을 포함하므로, 탐색 전용 보기에서 일치하는 provider 자격 증명을 추가하기 전까지 사용할 수 없는 모델도 표시할 수 있습니다.
</ParamField>
<ParamField path="--local" type="boolean">
  로컬 provider만 표시합니다.
</ParamField>
<ParamField path="--provider <id>" type="string">
  예를 들어 `moonshot`처럼 provider id로 필터링합니다. 대화형 선택기의 표시 라벨은 허용되지 않습니다.
</ParamField>
<ParamField path="--plain" type="boolean">
  한 줄에 모델 하나씩 표시합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기계 판독 가능한 출력.
</ParamField>

### `models status`

확인된 기본 모델, 대체 경로, 이미지 모델, 그리고 구성된 provider의 인증 개요를 보여줍니다. 또한 인증 저장소에서 발견된 프로필의 OAuth 만료 상태도 표시합니다(기본적으로 24시간 이내 만료 시 경고). `--plain`은 확인된 기본 모델만 출력합니다.

<AccordionGroup>
  <Accordion title="인증 및 프로브 동작">
    - OAuth 상태는 항상 표시되며(`--json` 출력에도 포함됨), 구성된 provider에 자격 증명이 없으면 `models status`는 **Missing auth** 섹션을 출력합니다.
    - JSON에는 `auth.oauth`(경고 창 + 프로필)와 `auth.providers`(env 기반 자격 증명을 포함한 provider별 유효 인증)가 포함됩니다. `auth.oauth`는 인증 저장소 프로필 상태 전용이며 env 전용 provider는 여기에 나타나지 않습니다.
    - 자동화에는 `--check`를 사용하세요(누락/만료 시 종료 코드 `1`, 만료 임박 시 `2`).
    - 실제 인증 검사는 `--probe`를 사용하세요. 프로브 행은 인증 프로필, env 자격 증명, 또는 `models.json`에서 올 수 있습니다.
    - 명시적 `auth.order.<provider>`가 저장된 프로필을 생략하면, 프로브는 이를 시도하는 대신 `excluded_by_auth_order`를 보고합니다. 인증은 있지만 해당 provider에 대해 프로브 가능한 모델을 확인할 수 없으면 프로브는 `status: no_model`을 보고합니다.

  </Accordion>
</AccordionGroup>

<Note>
인증 선택은 provider/계정에 따라 다릅니다. 항상 켜져 있는 Gateway 호스트에서는 API 키가 보통 가장 예측 가능하며, Claude CLI 재사용과 기존 Anthropic OAuth/토큰 프로필도 지원됩니다.
</Note>

예시(Claude CLI):

```bash
claude auth login
openclaw models status
```

## 스캔(OpenRouter 무료 모델)

`openclaw models scan`은 OpenRouter의 **무료 모델 카탈로그**를 검사하며, 선택적으로 도구 및 이미지 지원을 프로브할 수 있습니다.

<ParamField path="--no-probe" type="boolean">
  실제 프로브를 건너뜁니다(메타데이터만).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  최소 파라미터 크기(십억 단위).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  더 오래된 모델은 건너뜁니다.
</ParamField>
<ParamField path="--provider <name>" type="string">
  provider 접두사 필터.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  대체 경로 목록 크기.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary`를 첫 번째 선택 항목으로 설정합니다.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary`를 첫 번째 이미지 선택 항목으로 설정합니다.
</ParamField>

<Note>
OpenRouter `/models` 카탈로그는 공개되어 있으므로, 메타데이터 전용 스캔은 키 없이도 무료 후보를 나열할 수 있습니다. 하지만 프로빙과 추론에는 여전히 OpenRouter API 키가 필요합니다(auth 프로필 또는 `OPENROUTER_API_KEY`에서 가져옴). 사용 가능한 키가 없으면 `openclaw models scan`은 메타데이터 전용 출력으로 대체되고 config는 변경하지 않습니다. 메타데이터 전용 모드를 명시적으로 요청하려면 `--no-probe`를 사용하세요.
</Note>

스캔 결과는 다음 기준으로 순위가 매겨집니다.

1. 이미지 지원
2. 도구 지연 시간
3. 컨텍스트 크기
4. 파라미터 수

입력:

- OpenRouter `/models` 목록(필터 `:free`)
- 실제 프로브에는 auth 프로필 또는 `OPENROUTER_API_KEY`에서 가져온 OpenRouter API 키가 필요합니다([환경 변수](/ko/help/environment) 참조)
- 선택적 필터: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- 요청/프로브 제어: `--timeout`, `--concurrency`

실제 프로브가 TTY에서 실행되면 대체 경로를 대화형으로 선택할 수 있습니다. 비대화형 모드에서는 기본값을 수락하려면 `--yes`를 전달하세요. 메타데이터 전용 결과는 정보 제공용입니다. `--set-default`와 `--set-image`는 실제 프로브가 필요합니다. 그래야 OpenClaw가 사용할 수 없는 키 없는 OpenRouter 모델을 구성하지 않습니다.

## 모델 레지스트리(`models.json`)

`models.providers`의 커스텀 provider는 에이전트 디렉터리 아래의 `models.json`에 기록됩니다(기본값 `~/.openclaw/agents/<agentId>/agent/models.json`). 이 파일은 `models.mode`가 `replace`로 설정되지 않는 한 기본적으로 병합됩니다.

<AccordionGroup>
  <Accordion title="병합 모드 우선순위">
    일치하는 provider ID에 대한 병합 모드 우선순위:

    - 에이전트 `models.json`에 이미 존재하는 비어 있지 않은 `baseUrl`이 우선합니다.
    - 에이전트 `models.json`의 비어 있지 않은 `apiKey`는 현재 config/auth-profile 컨텍스트에서 해당 provider가 SecretRef 관리 대상이 아닌 경우에만 우선합니다.
    - SecretRef 관리 provider의 `apiKey` 값은 해결된 시크릿을 영속 저장하지 않고 소스 마커(`env` ref의 경우 `ENV_VAR_NAME`, file/exec ref의 경우 `secretref-managed`)에서 새로 고쳐집니다.
    - SecretRef 관리 provider 헤더 값은 소스 마커(`env` ref의 경우 `secretref-env:ENV_VAR_NAME`, file/exec ref의 경우 `secretref-managed`)에서 새로 고쳐집니다.
    - 비어 있거나 없는 에이전트 `apiKey`/`baseUrl`은 config `models.providers`로 대체됩니다.
    - 다른 provider 필드는 config와 정규화된 카탈로그 데이터에서 새로 고쳐집니다.

  </Accordion>
</AccordionGroup>

<Note>
마커 영속성은 source-authoritative입니다. OpenClaw는 해결된 런타임 시크릿 값이 아니라 활성 소스 config 스냅샷(해결 전)에서 마커를 기록합니다. 이는 `openclaw agent` 같은 명령 기반 경로를 포함해 OpenClaw가 `models.json`을 다시 생성할 때마다 적용됩니다.
</Note>

## 관련 항목

- [Agent runtimes](/ko/concepts/agent-runtimes) — PI, Codex, 기타 에이전트 루프 런타임
- [Configuration reference](/ko/gateway/config-agents#agent-defaults) — 모델 config 키
- [Image generation](/ko/tools/image-generation) — 이미지 모델 구성
- [Model failover](/ko/concepts/model-failover) — 대체 경로 체인
- [Model providers](/ko/concepts/model-providers) — provider 라우팅 및 인증
- [Music generation](/ko/tools/music-generation) — 음악 모델 구성
- [Video generation](/ko/tools/video-generation) — 비디오 모델 구성
