---
read_when:
    - 여러 모델 제공업체에 하나의 관리형 키를 사용하려는 경우
    - OpenClaw에서 ClawRouter 모델 검색 또는 할당량 보고가 필요합니다
summary: 자격 증명 범위 모델을 ClawRouter를 통해 라우팅하고 관리형 할당량 표시
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T01:06:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter는 여러 업스트림 모델 제공자에 사용할 수 있는 정책 범위 키 하나를 OpenClaw에 제공합니다. 번들 `clawrouter` Plugin은 해당 키에 허용된 모델만 검색하고, 각 모델을 선언된 프로토콜을 통해 라우팅하며, OpenClaw 사용량 화면에 키의 예산과 집계 사용량을 보고합니다.

업스트림 자격 증명과 제공자별 전달 처리는 ClawRouter에 유지되므로 OpenClaw 호스트에 각 업스트림 제공자 Plugin을 설치하거나 인증할 필요가 없습니다. 이 Plugin은 OpenClaw에 번들로 포함되어 제공되며(`enabledByDefault: true`), 발급된 ClawRouter 자격 증명만 있으면 됩니다.

| 속성          | 값                                       |
| ------------- | ---------------------------------------- |
| 제공자        | `clawrouter`                             |
| Plugin        | 번들(OpenClaw에 포함)                    |
| 인증          | `CLAWROUTER_API_KEY`                     |
| 기본 URL      | `https://clawrouter.openclaw.ai`         |
| 모델 카탈로그 | `/v1/catalog`을 통한 자격 증명 범위 지정 |
| 할당량        | `/v1/usage`를 통한 월간 예산 및 사용량   |

## 시작하기

<Steps>
  <Step title="범위가 지정된 자격 증명 받기">
    사용해야 하는 제공자, 모델, 월간 예산이 정책에 포함된 자격 증명을 ClawRouter 관리자에게 요청하세요. 자격 증명은 발급 시 한 번만 표시됩니다.
  </Step>
  <Step title="OpenClaw 구성">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter`는 번들로 제공되며 기본적으로 활성화됩니다. 구성에서 `plugins.allow`를 설정하는 경우 활성화하기 전에 해당 목록에 `clawrouter`를 추가하세요. 사용자 지정 배포에서는 `models.providers.clawrouter.baseUrl`을 ClawRouter 오리진으로 설정하세요. 기본값은 `https://clawrouter.openclaw.ai`입니다.

  </Step>
  <Step title="허용된 모델 목록 표시">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    반환된 모델 참조를 표시된 그대로 사용하세요. 예를 들어 `clawrouter/openai/gpt-5.5`, `clawrouter/anthropic/claude-sonnet-4-6`, `clawrouter/google/gemini-3.5-flash`처럼 업스트림 네임스페이스가 유지됩니다. 구성에서 `agents.defaults.models`가 허용 목록인 경우 선택한 각 ClawRouter 참조를 여기에 추가하세요.

  </Step>
  <Step title="모델 선택">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`을 사용하여 반환된 모델을 단일 실행에 선택할 수도 있습니다.

  </Step>
</Steps>

## 관리형 비대화형 배포

프록시 키는 워크로드의 시크릿 주입에 보관하고 `openclaw.json`에는 SecretRef만 저장하세요. 표준 관리 필드는 다음과 같습니다.

| 용도          | 구성 또는 환경 필드                                                      |
| ------------- | ------------------------------------------------------------------------ |
| 라우터 오리진 | `models.providers.clawrouter.baseUrl`                                    |
| 자격 증명     | `models.providers.clawrouter.apiKey` -> env SecretRef                    |
| 시크릿 값     | Gateway 프로세스 환경의 `CLAWROUTER_API_KEY`                             |
| 기본 모델     | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| 워크로드 태그 | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`(선택 사항) |

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

배포에서 `plugins.allow`를 설정하는 경우 기존 항목을 유지하고 `clawrouter`를 추가하세요. 대화형 마법사 없이 검증하고 적용합니다.

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

드라이런은 SecretRef를 확인하지만 그 값을 출력하지 않습니다. 자격 증명을 교체하려면 `CLAWROUTER_API_KEY`를 제공하는 외부 Secret을 업데이트하고, 새 프로세스 환경이 로드되도록 Gateway 워크로드를 재시작하세요. 구성 파일과 모델 참조는 변경되지 않습니다.

소스에서 빌드한 독립형 Docker Gateway의 경우 ClawRouter는 이미 루트 런타임에 포함되어 있습니다. `OPENCLAW_EXTENSIONS=clickclack`, `slack` 또는 `msteams`처럼 별도 패키징이 필요한 채널 Plugin만 선택하세요. [선택한 Plugin을 포함한 소스 빌드 이미지](/ko/install/docker#source-built-images-with-selected-plugins)를 참조하세요. 아카이브/어플라이언스 배포는 OCI 이미지를 사용하는 대신 자체 아티팩트 파이프라인을 통해 동일하게 반영된 소스를 패키징해야 합니다.

## 준비 상태 및 실제 검증

다음 검사는 서로 다른 경계를 검증하므로 서로 대체하지 마세요.

```bash
# ClawRouter 프로세스 상태만 확인하며, 자격 증명이나 업스트림 모델은 사용하지 않습니다.
curl -fsS https://clawrouter.internal.example/v1/health

# OpenClaw Gateway 시작 준비 상태만 확인하며, 모델 호출은 수행하지 않습니다.
curl -fsS http://127.0.0.1:18789/readyz

# 자격 증명 범위 카탈로그 검색.
openclaw models list --all --provider clawrouter --json

# 구성된 ClawRouter 제공자를 통한 최소 실제 추론 검사.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 정확히 허용된 모델 참조를 사용하는 워크로드 카나리.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "정확히 다음과 같이 응답하세요: CLAWROUTER_CANARY_OK" \
  --json
```

예시 모델을 그대로 복사하지 말고 범위가 지정된 카탈로그에서 반환된 모델을 사용하세요. `/readyz` 응답이 성공했다는 것은 Gateway가 요청을 처리할 수 있다는 의미이며, ClawRouter, 해당 자격 증명 또는 업스트림 제공자가 준비되었다는 의미는 아닙니다. 모델 검사와 에이전트 카나리가 추론 검증에 해당합니다.

실제 진단을 수행하려면 카나리를 실행하고 Gateway의 표준 로그를 확인하세요. 기존 메타데이터 전용 모델 전송 진단은 다음과 같은 형식의 줄을 출력합니다.

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

이 Plugin은 해당 식별자를 사용할 수 있을 때 길이가 제한된 `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id`, `X-ClawRouter-Session-Id` 헤더를 전송합니다. 또한 모델 호출의 진단용 `callId`(`<run-id>:model:<n>`)를 `X-Request-ID`에 매핑하므로 OpenClaw 모델 호출 이벤트를 ClawRouter의 메타데이터 전용 감사 추적과 연결할 수 있습니다. 128자 요청 ID 제한 이내의 값은 동일하게 유지됩니다. 더 긴 값은 `:model:<n>` 접미사와 결정적 해시를 유지하므로 서로 다른 호출을 제한된 길이로 유지하면서 연결할 수 있습니다. `X-ClawRouter-Project-Id` 같은 정적 배포 메타데이터는 제공자 `headers` 맵에서 설정할 수 있습니다. 에이전트 및 세션 귀속 헤더에는 각각 별도의 256자 제한이 유지됩니다. ClawRouter의 ASCII 식별자 집합에 속하지 않는 문자가 포함된 자동 요청 ID에도 동일한 결정적 제한 형식이 사용됩니다.
대소문자 변형을 포함하여 명시적으로 구성된 `X-Request-ID` 헤더가 자동 값보다 우선합니다. 전송 진단에는 라우팅 및 응답 메타데이터가 기록되며, 자격 증명, 요청 ID, 프롬프트 또는 완성 결과는 기록되지 않습니다. ClawRouter 자체 감사 이벤트는 선택된 업스트림 제공자와 콘텐츠 보존 상태를 제공합니다.

## 모델 검색

`GET /v1/catalog`은 `{ providers: [...] }`를 반환하며, 각 제공자 항목에는 자체 `models[]`(업스트림 ID, 기능 및 가격 포함)와 지원되는 요청 경로가 나열됩니다. OpenClaw는 별도의 고정된 ClawRouter 모델 목록을 제공하지 않습니다. 다음 조건을 충족하면 카탈로그 모델이 OpenClaw 모델로 표시됩니다.

- 자격 증명 정책에서 해당 제공자를 허용하고,
- 카탈로그 모델이 지원되는 LLM 기능(`llm.responses`, `llm.chat`, `llm.messages` 또는 일치하는 스트리밍 경로가 있는 `llm.stream`)을 알리며,
- 제공자가 아래 전송 방식 중 하나에 일치하는 경로를 노출하는 경우.

지원되는 ClawRouter 제공자에 모델을 추가하는 데 OpenClaw 릴리스는 필요하지 않습니다. 다음 카탈로그 새로 고침(자격 증명 범위별로 60초 동안 캐시됨)에서 해당 모델을 검색합니다. 새로운 와이어 프로토콜이 필요한 모델은 먼저 Plugin 지원이 필요합니다.

## 프로토콜 및 제공자 Plugin

ClawRouter가 업스트림 자격 증명을 소유하며, 해당 카탈로그가 OpenClaw에 사용할 전송 방식을 알려 주므로 모든 업스트림 회사의 인증 Plugin을 설치할 필요가 없습니다.

| 카탈로그 기능/경로                                      | OpenClaw 전송 방식     |
| ------------------------------------------------------- | ---------------------- |
| `llm.responses`(OpenAI 호환 제공자)                     | `openai-responses`     |
| `llm.chat`(OpenAI 호환 제공자)                          | `openai-completions`   |
| `llm.messages` + `anthropic.messages` 경로              | `anthropic-messages`   |
| `llm.stream` + 스트리밍 `google.generate_content` 경로  | `google-generative-ai` |

또한 이 Plugin은 해당 계열에 맞는 재생 및 도구 스키마 정책(OpenAI/DeepSeek/Gemini 도구 스키마 호환성, 네이티브 Anthropic 및 Google Gemini 재생 정책)을 적용합니다. 지원되지 않는 요청 형식만 노출하는 카탈로그 제공자는 의도적으로 OpenClaw 텍스트 모델로 표시되지 않습니다. 호환되지 않는 페이로드를 전송하는 대신 ClawRouter에서 해당 제공자를 지원되는 계약 중 하나로 정규화하세요.

## 할당량 및 사용량

ClawRouter의 `/v1/usage` 응답은 일반 OpenClaw 제공자 사용량 화면에 요청, 토큰 및 지출 합계와 함께 키에 한도가 있는 경우 월간 예산 기간을 제공합니다. 계량되지 않는 키도 백분율 기간 없이 집계 사용량을 표시합니다.

할당량 조회는 모델 검색과 동일한 범위 지정 키를 사용합니다. 할당량 조회에 실패해도 모델 실행은 차단되지 않습니다.

다음 명령으로 실시간 스냅샷을 확인하세요.

```bash
openclaw status --usage
openclaw models status
```

동일한 제공자 스냅샷을 채팅의 `/status`와 OpenClaw 사용량 UI에서도 확인할 수 있습니다. 예산은 정책 전체에 적용되므로 동일한 ClawRouter 정책을 사용하는 다른 클라이언트의 요청으로 남은 백분율이 변경될 수 있습니다.

## 문제 해결

| 증상                                     | 확인 사항                                                                                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter 모델이 없음                   | Plugin이 활성화되어 있고 `plugins.allow`에서 허용되는지 확인한 다음, 자격 증명이 활성 상태이며 준비된 제공자를 하나 이상 허용하는지 확인하세요.      |
| 구성된 ClawRouter 모델이 없음            | 해당 모델의 `/v1/catalog` 기능 및 경로 지원을 확인하세요. 지원되지 않는 전송 계약은 의도적으로 필터링됩니다.                                        |
| `Unknown model: clawrouter/...`          | 해당 구성 맵을 허용 목록으로 사용하는 경우 정확한 카탈로그 참조를 `agents.defaults.models`에 추가하세요.                                            |
| 카탈로그 또는 사용량에서 `401` 또는 `403` | ClawRouter 자격 증명을 재발급하거나 범위를 다시 지정하세요. OpenClaw는 업스트림 제공자 키로 대체하지 않습니다.                                     |
| 검색 후 모델 호출 실패                   | ClawRouter에서 제공자 연결과 업스트림 상태를 확인한 다음 준비 상태가 복구되면 다시 시도하세요.                                                       |
| 사용량 합계는 있지만 백분율은 없음       | 정책이 계량되지 않습니다. 백분율 기간을 표시하려면 ClawRouter에 월간 예산을 추가하세요.                                                             |

## 보안 동작

- 카탈로그 검색 범위는 구성된 프록시 키로 한정되며 자격 증명 범위(에이전트 디렉터리, 작업 공간 디렉터리, 인증 프로필 ID, 기본 URL)별로 캐시됩니다.
- 프록시 키는 요청을 디스패치할 때만 첨부되며 모델 메타데이터에는 저장되지 않습니다.
- 자동 기여 정보 및 요청 상관관계 값은 디스패치 전에 앞뒤 공백이 제거되며 제어 문자가 포함된 경우 거부됩니다. 기여 정보 값은 256자로, 요청 ID는 128자로 제한됩니다.
- 모델 전송 진단에는 메타데이터만 포함되며 프록시 키나 모델 콘텐츠는 절대 포함되지 않습니다.
- 네이티브 Anthropic 및 Gemini 모델 ID는 디스패치할 때만 업스트림 ID로 다시 작성됩니다.
- 지원되지 않거나 권한이 부여되지 않은 카탈로그 행은 실패 시 차단되며 선택할 수 없습니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자 구성 및 모델 선택.
  </Card>
  <Card title="사용량 추적" href="/ko/concepts/usage-tracking" icon="chart-line">
    OpenClaw 사용량 및 상태 화면.
  </Card>
</CardGroup>
