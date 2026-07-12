---
read_when:
    - OpenClaw에서 Runway 동영상 생성을 사용하려고 합니다
    - Runway API 키/환경 변수 설정이 필요합니다
    - Runway를 기본 동영상 제공자로 설정하려는 경우
summary: OpenClaw에서 Runway 동영상 생성 설정
title: 런웨이
x-i18n:
    generated_at: "2026-07-12T01:09:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw은 호스팅형 동영상 생성을 위한 번들 `runway` 제공자와 함께 제공됩니다. 이 제공자는 기본적으로 활성화되며 `videoGenerationProviders` 계약에 등록됩니다.

| 속성            | 값                                                                |
| --------------- | ----------------------------------------------------------------- |
| 제공자 ID       | `runway`                                                          |
| Plugin          | 번들, `enabledByDefault: true`                                    |
| 인증 환경 변수  | `RUNWAYML_API_SECRET`(표준) 또는 `RUNWAY_API_KEY`                  |
| 온보딩 플래그   | `--auth-choice runway-api-key`                                    |
| 직접 CLI 플래그 | `--runway-api-key <key>`                                          |
| API             | Runway 작업 기반 동영상 생성(`GET /v1/tasks/{id}` 폴링)           |
| 기본 모델       | `runway/gen4.5`                                                   |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway를 기본 동영상 제공자로 설정">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="동영상 생성">
    에이전트에게 동영상을 생성하도록 요청합니다. Runway가 자동으로 사용됩니다.
  </Step>
</Steps>

## 지원되는 모드 및 모델

이 제공자는 세 가지 모드에 걸쳐 일곱 개의 Runway 모델을 제공합니다. 동일한 모델 ID를 둘 이상의 모드에서 사용할 수 있습니다(예: `gen4.5`는 텍스트-동영상 변환과 이미지-동영상 변환 모두에서 작동합니다).

| 모드                | 모델                                                                   | 참조 입력                    |
| ------------------- | ---------------------------------------------------------------------- | ---------------------------- |
| 텍스트-동영상 변환  | `gen4.5`(기본값), `veo3.1`, `veo3.1_fast`, `veo3`                      | 없음                         |
| 이미지-동영상 변환  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 로컬 또는 원격 이미지 1개    |
| 동영상-동영상 변환  | `gen4_aleph`                                                           | 로컬 또는 원격 동영상 1개    |

데이터 URI를 통해 로컬 이미지 및 동영상 참조를 지원합니다.

| 종횡비                  | 허용되는 값                                 |
| ----------------------- | ------------------------------------------- |
| 텍스트-동영상 변환      | `16:9`, `9:16`                              |
| 이미지 및 동영상 편집   | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  현재 동영상-동영상 변환에는 `runway/gen4_aleph`가 필요합니다. 다른 Runway 모델 ID는 동영상 참조 입력을 거부합니다.
</Warning>

<Note>
  잘못된 열에서 Runway 모델 ID를 선택하면 API 요청이 OpenClaw을 벗어나기 전에 명시적인 오류가 발생합니다. 제공자는 `extensions/runway/video-generation-provider.ts`에서 모드의 허용 목록(`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`)을 기준으로 `model`을 검증합니다.
</Note>

## 구성

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="환경 변수 별칭">
    OpenClaw은 `RUNWAYML_API_SECRET`(표준)과 `RUNWAY_API_KEY`를 모두 인식합니다.
    두 변수 중 하나로 Runway 제공자를 인증할 수 있습니다.
  </Accordion>

  <Accordion title="작업 폴링">
    Runway는 작업 기반 API를 사용합니다. 생성 요청을 제출한 후 OpenClaw은
    동영상이 준비될 때까지 `GET /v1/tasks/{id}`를 폴링합니다. 폴링 동작을 위한
    추가 구성은 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공통 도구 매개변수, 제공자 선택 및 비동기 동작입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    동영상 생성 모델을 포함한 에이전트 기본 설정입니다.
  </Card>
</CardGroup>
