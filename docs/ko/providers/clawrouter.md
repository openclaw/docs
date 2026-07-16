---
read_when:
    - 여러 모델 제공업체에 하나의 관리형 키를 사용하려고 합니다
    - OpenClaw에서 ClawRouter 모델 검색 또는 할당량 보고가 필요합니다
summary: ClawRouter를 통해 자격 증명 범위가 지정된 모델을 라우팅하고 관리형 할당량을 표시합니다
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T13:00:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter는 여러 업스트림 모델 제공자에 대해 정책 범위가 지정된 하나의 키를 OpenClaw에 제공합니다. 번들로 제공되는 `clawrouter` Plugin은 해당 키에 허용된 모델만 검색하고, 각 모델을 선언된 프로토콜을 통해 라우팅하며, OpenClaw 사용량 화면에 키의 예산과 집계 사용량을 보고합니다.

업스트림 자격 증명과 제공자별 전달은 ClawRouter에서 처리되므로 OpenClaw 호스트에 각 업스트림 제공자 Plugin을 설치하거나 인증할 필요가 없습니다. Plugin은 OpenClaw와 함께 번들로 제공되며(`enabledByDefault: true`), 발급된 ClawRouter 자격 증명만 있으면 됩니다.

| 속성          | 값                                       |
| ------------- | ---------------------------------------- |
| 제공자        | `clawrouter`                       |
| Plugin        | 번들(OpenClaw에 포함)                    |
| 인증          | `CLAWROUTER_API_KEY`                       |
| 기본 URL      | `https://clawrouter.openclaw.ai`                       |
| 모델 카탈로그 | `/v1/catalog`을 통한 자격 증명 범위 |
| 할당량        | `/v1/usage`을 통한 월별 예산 및 사용량 |

## 시작하기

<Steps>
  <Step title="범위가 지정된 자격 증명 받기">
    사용할 제공자, 모델 및 월별 예산을 정책에 포함하는 자격 증명을 ClawRouter 관리자에게 요청하십시오. 자격 증명은 발급 시 한 번만 표시됩니다.
  </Step>
  <Step title="OpenClaw 구성하기">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter`은 번들로 제공되며 기본적으로 활성화됩니다. 구성에 `plugins.allow`이 설정되어 있다면 활성화하기 전에 해당 목록에 `clawrouter`을 추가하십시오. 사용자 지정 배포에서는 `models.providers.clawrouter.baseUrl`을 ClawRouter 원본으로 설정하십시오. 기본값은 `https://clawrouter.openclaw.ai`입니다.

  </Step>
  <Step title="허용된 모델 나열하기">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    반환된 모델 참조를 표시된 그대로 사용하십시오. 이러한 참조는 `clawrouter/openai/gpt-5.5`, `clawrouter/anthropic/claude-sonnet-4-6`, `clawrouter/google/gemini-3.5-flash`과 같은 업스트림 네임스페이스를 유지합니다. 구성에서 `agents.defaults.models`이 허용 목록이라면 선택한 각 ClawRouter 참조를 여기에 추가하십시오.

  </Step>
  <Step title="모델 선택하기">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`을 사용하여 한 번의 실행에 반환된 모델을 선택할 수도 있습니다.

  </Step>
</Steps>

## 관리형 비대화형 배포

프록시 키는 워크로드의 시크릿 주입에 보관하고 `openclaw.json`에는 SecretRef만 저장하십시오. 표준 관리형 필드는 다음과 같습니다.

| 용도          | 구성 또는 환경 필드                                                      |
| ------------- | ------------------------------------------------------------------------ |
| 라우터 원본   | `models.providers.clawrouter.baseUrl`                                                       |
| 자격 증명     | `models.providers.clawrouter.apiKey` -> 환경 변수 SecretRef                               |
| 시크릿 값     | Gateway 프로세스 환경의 `CLAWROUTER_API_KEY`                              |
| 기본 모델     | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                                |
| 워크로드 태그 | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`(선택 사항)                                            |

예를 들어 배포 컨트롤러가 다음 JSON5 패치를 관리할 수 있습니다.

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

배포에서 `plugins.allow`을 설정하는 경우 기존 항목을 유지하고 `clawrouter`을 추가하십시오. 대화형 마법사 없이 검증하고 적용하십시오.

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

시험 실행은 SecretRef를 확인하지만 그 값을 출력하지는 않습니다. 자격 증명을 교체하려면 `CLAWROUTER_API_KEY`을 제공하는 외부 Secret을 업데이트하고 새 프로세스 환경이 로드되도록 Gateway 워크로드를 다시 시작하십시오. 구성 파일과 모델 참조는 변경되지 않습니다.

소스에서 빌드한 독립형 Docker Gateway의 경우 ClawRouter는 이미 루트 런타임에 포함되어 있습니다. `OPENCLAW_EXTENSIONS=clickclack`, `slack`, `msteams`처럼 별도 패키징이 필요한 채널 Plugin만 선택하십시오. [선택한 Plugin을 포함한 소스 빌드 이미지](/ko/install/docker#source-built-images-with-selected-plugins)를 참조하십시오. 아카이브/어플라이언스 배포는 OCI 이미지를 사용하는 대신 자체 아티팩트 파이프라인을 통해 반영된 동일한 소스를 패키징해야 합니다.

## 준비 상태 및 실시간 검증

다음 검사는 서로 다른 경계를 검증하므로 서로 대체해서는 안 됩니다.

```bash
# ClawRouter 프로세스 상태만 확인하며 자격 증명이나 업스트림 모델은 사용하지 않습니다.
curl -fsS https://clawrouter.internal.example/v1/health

# OpenClaw Gateway 시작 준비 상태만 확인하며 모델 호출은 수행하지 않습니다.
curl -fsS http://127.0.0.1:18789/readyz

# 자격 증명 범위가 지정된 카탈로그 검색입니다.
openclaw models list --all --provider clawrouter --json

# 구성된 ClawRouter 제공자를 통한 최소 실제 추론 검사입니다.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 정확히 허용된 모델 참조를 사용하는 워크로드 카나리입니다.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "정확히 다음과 같이 응답하십시오: CLAWROUTER_CANARY_OK" \
  --json
```

예제 모델을 그대로 복사하지 말고 범위가 지정된 카탈로그가 반환한 모델을 사용하십시오. `/readyz` 응답이 성공했다는 것은 Gateway가 요청을 처리할 수 있다는 의미이며, ClawRouter, 해당 자격 증명 또는 업스트림 제공자가 준비되었다는 의미는 아닙니다. 모델 검사와 에이전트 카나리가 추론 검증입니다.

실시간 진단을 수행하려면 카나리를 실행하고 Gateway의 표준 로그를 확인하십시오. 기존의 메타데이터 전용 모델 전송 진단은 다음과 같은 형식의 줄을 출력합니다.

```text
[model-fetch] 시작 provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] 응답 provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin은 해당 식별자를 사용할 수 있을 때 길이가 제한된 `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id`, `X-ClawRouter-Session-Id` 헤더도 전송합니다. 또한 모델 호출의 진단 `callId`(`<run-id>:model:<n>`)을 `X-Request-ID`에 매핑하므로 OpenClaw 모델 호출 이벤트를 ClawRouter의 메타데이터 전용 감사 추적과 연결할 수 있습니다. 128자 요청 ID 제한 내의 값은 동일합니다. 더 긴 값은 `:model:<n>` 접미사와 결정적 해시를 유지하므로 서로 다른 호출의 길이가 제한되면서도 연결할 수 있습니다. `X-ClawRouter-Project-Id`와 같은 정적 배포 메타데이터는 제공자 `headers` 맵에서 설정할 수 있습니다. 에이전트 및 세션 속성 헤더에는 별도의 256자 제한이 유지됩니다. ClawRouter의 ASCII 식별자 집합에 포함되지 않는 문자가 있는 자동 요청 ID에도 동일한 결정적 길이 제한 형식이 사용됩니다.
`X-Request-ID`의 대소문자 변형을 포함해 명시적으로 구성된 헤더가 자동 값보다 우선합니다. 전송 진단은 라우팅 및 응답 메타데이터를 기록하지만 자격 증명, 요청 ID, 프롬프트 또는 완성 결과는 기록하지 않습니다. ClawRouter 자체 감사 이벤트는 선택된 업스트림 제공자와 콘텐츠 보존 상태를 제공합니다.

## 모델 검색

`GET /v1/catalog`은 `{ providers: [...] }`을 반환하며, 각 제공자 항목에는 자체 `models[]`(업스트림 ID, 기능 및 가격 포함)과 지원되는 요청 경로가 나열됩니다. OpenClaw는 별도의 고정된 ClawRouter 모델 목록을 제공하지 않습니다. 다음 조건을 충족하면 카탈로그 모델이 OpenClaw 모델로 표시됩니다.

- 자격 증명 정책이 해당 제공자를 허용합니다.
- 카탈로그 모델이 지원되는 LLM 기능(`llm.responses`, `llm.chat`, `llm.messages` 또는 일치하는 스트리밍 경로가 있는 `llm.stream`)을 알립니다.
- 제공자가 아래 전송 방식 중 하나에 일치하는 경로를 노출합니다.

지원되는 ClawRouter 제공자에 모델을 추가하는 데 OpenClaw 릴리스는 필요하지 않습니다. 다음 카탈로그 새로 고침(자격 증명 범위별로 60초 동안 캐시됨)에서 해당 모델을 검색합니다. 새로운 유선 프로토콜이 필요한 모델은 먼저 Plugin에서 지원해야 합니다.

## 프로토콜 및 제공자 Plugin

ClawRouter가 업스트림 자격 증명을 관리하며, 카탈로그가 OpenClaw에 사용할 전송 방식을 알려 주므로 모든 업스트림 회사의 인증 Plugin을 설치할 필요가 없습니다.

| 카탈로그 기능/경로                                      | OpenClaw 전송 방식     |
| ------------------------------------------------------- | ---------------------- |
| `llm.responses`(OpenAI 호환 제공자)                  | `openai-responses`     |
| `llm.chat`(OpenAI 호환 제공자)                  | `openai-completions`     |
| `llm.messages` + `anthropic.messages` 경로            | `anthropic-messages`     |
| `llm.stream` + 스트리밍 `google.generate_content` 경로   | `google-generative-ai`     |

Plugin은 해당 계열에 일치하는 재생 및 도구 스키마 정책도 적용합니다(OpenAI/DeepSeek/Gemini/Perplexity 도구 스키마 호환성, 네이티브 Anthropic 및 Google Gemini 재생 정책). Perplexity 모델에는 엄격한 스키마 재작성이 적용됩니다. Perplexity는 이러한 항목이 없는 도구 스키마를 거부하므로 `patternProperties`과 `additionalProperties`이 제거되고 모든 객체 스키마에 `properties`이 선언됩니다. 지원되지 않는 요청 형식만 노출하는 카탈로그 제공자는 의도적으로 OpenClaw 텍스트 모델로 표시되지 않습니다. 호환되지 않는 페이로드를 전송하는 대신 ClawRouter에서 해당 제공자를 지원되는 계약 중 하나로 정규화하십시오.

## 할당량 및 사용량

ClawRouter의 `/v1/usage` 응답은 일반적인 OpenClaw 제공자 사용량 화면에 반영됩니다. 여기에는 요청, 토큰 및 지출 합계와 키에 제한이 있을 때의 월별 예산 기간이 포함됩니다. 계량되지 않는 키도 백분율 기간 없이 집계 사용량을 표시합니다.

할당량 조회에는 모델 검색과 동일한 범위 지정 키가 사용됩니다. 할당량 조회가 실패해도 모델 실행은 차단되지 않습니다.

다음 명령으로 실시간 스냅샷을 확인하십시오.

```bash
openclaw status --usage
openclaw models status
```

동일한 제공자 스냅샷은 채팅의 `/status`과 OpenClaw 사용량 UI에서도 사용할 수 있습니다. 예산은 정책 전체에 적용되므로 동일한 ClawRouter 정책을 사용하는 다른 클라이언트의 요청에 따라 남은 백분율이 변경될 수 있습니다.

## 문제 해결

| 증상                                     | 확인 사항                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter 모델이 없음                   | Plugin이 활성화되어 있고 `plugins.allow`에서 허용되는지 확인한 다음, 자격 증명이 활성 상태이며 준비된 제공자를 하나 이상 허용하는지 확인하십시오. |
| 구성된 ClawRouter 모델이 누락됨          | 해당 모델의 `/v1/catalog` 기능과 경로 지원을 검사하십시오. 지원되지 않는 전송 계약은 의도적으로 필터링됩니다.                               |
| `Unknown model: clawrouter/...`                       | 해당 구성 맵을 허용 목록으로 사용하는 경우 정확한 카탈로그 참조를 `agents.defaults.models`에 추가하십시오.                                             |
| 카탈로그 또는 사용량에서 `401` 또는 `403` | ClawRouter 자격 증명을 재발급하거나 범위를 다시 지정하십시오. OpenClaw는 업스트림 제공자 키로 대체하지 않습니다.                                 |
| 검색 후 모델 호출 실패                   | ClawRouter에서 제공자 연결과 업스트림 상태를 확인한 다음 준비 상태가 복구된 후 다시 시도하십시오.                                                |
| 사용량에 합계는 있지만 백분율은 없음     | 정책이 계량되지 않습니다. 백분율 기간을 표시하려면 ClawRouter에서 월별 예산을 추가하십시오.                                                      |

## 보안 동작

- 카탈로그 검색은 구성된 프록시 키로 범위가 제한되며 자격 증명 범위(에이전트 디렉터리, 워크스페이스 디렉터리, 인증 프로필 ID 및 기본 URL)별로 캐시됩니다.
- 프록시 키는 요청을 디스패치할 때만 첨부되며 모델 메타데이터에는 저장되지 않습니다.
- 자동 귀속 및 요청 상관관계 값은 디스패치 전에 공백이 제거되고 제어 문자가 거부됩니다. 귀속 값은 256자로 제한되며 요청 ID는 128자로 제한됩니다.
- 모델 전송 진단에는 메타데이터만 포함되며 프록시 키나 모델 콘텐츠는 절대 포함되지 않습니다.
- 네이티브 Anthropic 및 Gemini 모델 ID는 디스패치할 때만 해당 업스트림 ID로 다시 작성됩니다.
- 지원되지 않거나 권한이 부여되지 않은 카탈로그 행은 실패 시 차단되며 선택할 수 없습니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자 구성 및 모델 선택입니다.
  </Card>
  <Card title="사용량 추적" href="/ko/concepts/usage-tracking" icon="chart-line">
    OpenClaw 사용량 및 상태 화면입니다.
  </Card>
</CardGroup>
