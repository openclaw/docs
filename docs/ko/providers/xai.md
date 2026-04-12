---
read_when:
    - OpenClaw에서 Grok 모델을 사용하려고 합니다
    - xAI auth 또는 model ids를 구성하고 있습니다
summary: OpenClaw에서 xAI Grok 모델 사용하기
title: xAI
x-i18n:
    generated_at: "2026-04-12T23:33:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820fef290c67d9815e41a96909d567216f67ca0f01df1d325008fd04666ad255
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw에는 Grok 모델용 번들 `xai` provider Plugin이 포함되어 있습니다.

## 시작하기

<Steps>
  <Step title="API 키 생성">
    [xAI console](https://console.x.ai/)에서 API 키를 생성하세요.
  </Step>
  <Step title="API 키 설정">
    `XAI_API_KEY`를 설정하거나 다음을 실행하세요:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="모델 선택">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw는 번들된 xAI 전송 계층으로 xAI Responses API를 사용합니다. 같은
`XAI_API_KEY`로 Grok 기반 `web_search`, 기본 제공 `x_search`,
원격 `code_execution`도 사용할 수 있습니다.
`plugins.entries.xai.config.webSearch.apiKey` 아래에 xAI 키를 저장하면,
번들된 xAI 모델 provider도 그 키를 대체값으로 재사용합니다.
`code_execution` 튜닝은 `plugins.entries.xai.config.codeExecution` 아래에 있습니다.
</Note>

## 번들 모델 카탈로그

OpenClaw에는 기본으로 다음 xAI 모델 계열이 포함됩니다.

| Family | Model ids |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3 | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast` |
| Grok 4 | `grok-4`, `grok-4-0709` |
| Grok 4 Fast | `grok-4-fast`, `grok-4-fast-non-reasoning` |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning` |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code | `grok-code-fast-1` |

이 Plugin은 더 새로운 `grok-4*` 및 `grok-code-fast*` ids도
같은 API 형태를 따르는 경우 forward-resolve합니다.

<Tip>
`grok-4-fast`, `grok-4-1-fast`, 그리고 `grok-4.20-beta-*` 변형은
현재 번들 카탈로그에서 이미지 입력을 지원하는 Grok refs입니다.
</Tip>

### Fast mode 매핑

`/fast on` 또는 `agents.defaults.models["xai/<model>"].params.fastMode: true`
를 사용하면 기본 xAI 요청이 다음과 같이 다시 매핑됩니다.

| Source model | Fast-mode target |
| ------------- | ------------------ |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### 레거시 호환성 별칭

레거시 별칭은 여전히 정식 번들 ids로 정규화됩니다.

| Legacy alias | Canonical id |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning` | `grok-4-fast` |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast` |
| `grok-4.20-reasoning` | `grok-4.20-beta-latest-reasoning` |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 기능

<AccordionGroup>
  <Accordion title="Web search">
    번들된 `grok` web-search provider도 `XAI_API_KEY`를 사용합니다:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="비디오 생성">
    번들된 `xai` Plugin은 공용
    `video_generate` tool을 통해 비디오 생성을 등록합니다.

    - 기본 비디오 모델: `xai/grok-imagine-video`
    - 모드: text-to-video, image-to-video, 원격 비디오 edit/extend 흐름
    - 지원 파라미터: `aspectRatio`, `resolution`

    <Warning>
    로컬 비디오 버퍼는 허용되지 않습니다. video-reference 및 edit 입력에는
    원격 `http(s)` URL을 사용하세요.
    </Warning>

    xAI를 기본 비디오 provider로 사용하려면:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    공용 tool parameters,
    provider 선택, failover 동작은 [Video Generation](/ko/tools/video-generation)을 참고하세요.
    </Note>

  </Accordion>

  <Accordion title="x_search 구성">
    번들된 xAI Plugin은 Grok을 통해
    X(이전 Twitter) 콘텐츠를 검색하는 OpenClaw tool로 `x_search`를 노출합니다.

    config 경로: `plugins.entries.xai.config.xSearch`

    | Key | Type | Default | Description |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled` | boolean | — | `x_search` 활성화 또는 비활성화 |
    | `model` | string | `grok-4-1-fast` | `x_search` 요청에 사용할 모델 |
    | `inlineCitations` | boolean | — | 결과에 인라인 인용 포함 |
    | `maxTurns` | number | — | 최대 대화 턴 수 |
    | `timeoutSeconds` | number | — | 초 단위 요청 타임아웃 |
    | `cacheTtlMinutes` | number | — | 분 단위 캐시 TTL |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Code execution 구성">
    번들된 xAI Plugin은
    xAI의 sandbox 환경에서 원격 코드 실행을 위한 OpenClaw tool로 `code_execution`을 노출합니다.

    config 경로: `plugins.entries.xai.config.codeExecution`

    | Key | Type | Default | Description |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled` | boolean | `true` (if key available) | code execution 활성화 또는 비활성화 |
    | `model` | string | `grok-4-1-fast` | code execution 요청에 사용할 모델 |
    | `maxTurns` | number | — | 최대 대화 턴 수 |
    | `timeoutSeconds` | number | — | 초 단위 요청 타임아웃 |

    <Note>
    이것은 로컬 [`exec`](/ko/tools/exec)가 아니라 원격 xAI sandbox 실행입니다.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="알려진 제한 사항">
    - 현재 auth는 API 키만 지원합니다. OpenClaw에는 아직 xAI OAuth 또는 device-code 흐름이 없습니다.
    - `grok-4.20-multi-agent-experimental-beta-0304`는
      표준 OpenClaw xAI 전송 계층과 다른 업스트림 API 표면이 필요하므로
      일반 xAI provider 경로에서는 지원되지 않습니다.
  </Accordion>

  <Accordion title="고급 참고">
    - OpenClaw는 공용 runner 경로에서 xAI 전용 tool-schema 및 tool-call 호환성 수정을
      자동으로 적용합니다.
    - 기본 xAI 요청은 기본적으로 `tool_stream: true`를 사용합니다.
      이를 비활성화하려면
      `agents.defaults.models["xai/<model>"].params.tool_stream`을 `false`로 설정하세요.
    - 번들된 xAI 래퍼는 기본 xAI 요청을 보내기 전에
      지원되지 않는 strict tool-schema 플래그와
      reasoning payload keys를 제거합니다.
    - `web_search`, `x_search`, `code_execution`은 OpenClaw
      tools로 노출됩니다. OpenClaw는 모든 채팅 턴에 모든 기본 tools를 붙이는 대신
      각 tool 요청 안에서 필요한 특정 xAI 내장 기능만 활성화합니다.
    - `x_search`와 `code_execution`은
      코어 모델 런타임에 하드코딩된 것이 아니라 번들된 xAI Plugin이 소유합니다.
    - `code_execution`은 로컬
      [`exec`](/ko/tools/exec)가 아니라 원격 xAI sandbox 실행입니다.
  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    providers, model refs, failover 동작 선택하기.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공용 비디오 tool parameters와 provider 선택.
  </Card>
  <Card title="모든 providers" href="/ko/providers/index" icon="grid-2">
    더 넓은 provider 개요.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법.
  </Card>
</CardGroup>
