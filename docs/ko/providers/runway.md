---
read_when:
    - OpenClaw에서 Runway 동영상 생성을 사용하려고 합니다
    - Runway API 키/환경 변수 설정이 필요합니다.
    - Runway를 기본 동영상 제공자로 설정하려고 합니다
summary: OpenClaw에서 Runway 동영상 생성 설정
title: Runway
x-i18n:
    generated_at: "2026-07-12T15:39:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw은 호스팅형 비디오 생성을 위한 `runway` provider를 번들로 제공하며, 기본적으로 활성화되어 있고 `videoGenerationProviders` 계약에 등록되어 있습니다.

| 속성             | 값                                                                |
| ---------------- | ----------------------------------------------------------------- |
| Provider ID      | `runway`                                                          |
| Plugin           | 번들, `enabledByDefault: true`                                    |
| 인증 환경 변수   | `RUNWAYML_API_SECRET`(표준) 또는 `RUNWAY_API_KEY`                  |
| 온보딩 플래그    | `--auth-choice runway-api-key`                                    |
| 직접 CLI 플래그  | `--runway-api-key <key>`                                          |
| API              | Runway 작업 기반 비디오 생성(`GET /v1/tasks/{id}` 폴링)           |
| 기본 모델        | `runway/gen4.5`                                                   |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway를 기본 비디오 provider로 설정">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="비디오 생성">
    에이전트에게 비디오 생성을 요청하십시오. Runway가 자동으로 사용됩니다.
  </Step>
</Steps>

## 지원 모드 및 모델

이 provider는 세 가지 모드에 걸쳐 7개의 Runway 모델을 제공합니다. 동일한 모델 ID가 둘 이상의 모드에서 사용될 수 있습니다(예: `gen4.5`는 텍스트-비디오 및 이미지-비디오 모두에서 작동합니다).

| 모드             | 모델                                                                   | 참조 입력                 |
| ---------------- | ---------------------------------------------------------------------- | ------------------------- |
| 텍스트-비디오    | `gen4.5`(기본값), `veo3.1`, `veo3.1_fast`, `veo3`                      | 없음                      |
| 이미지-비디오    | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 로컬 또는 원격 이미지 1개 |
| 비디오-비디오    | `gen4_aleph`                                                           | 로컬 또는 원격 비디오 1개 |

데이터 URI를 통해 로컬 이미지 및 비디오 참조를 지원합니다.

| 화면비                   | 허용되는 값                                 |
| ------------------------ | ------------------------------------------- |
| 텍스트-비디오            | `16:9`, `9:16`                              |
| 이미지 및 비디오 편집    | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  비디오-비디오에는 현재 `runway/gen4_aleph`가 필요합니다. 다른 Runway 모델 ID는 비디오 참조 입력을 거부합니다.
</Warning>

<Note>
  잘못된 열에서 Runway 모델 ID를 선택하면 API 요청이 OpenClaw을 벗어나기 전에 명시적 오류가 발생합니다. provider는 `extensions/runway/video-generation-provider.ts`에서 모드의 허용 목록(`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`)을 기준으로 `model`을 검증합니다.
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
    두 변수 중 어느 것이든 Runway provider를 인증할 수 있습니다.
  </Accordion>

  <Accordion title="작업 폴링">
    Runway는 작업 기반 API를 사용합니다. 생성 요청을 제출하면 OpenClaw은
    비디오가 준비될 때까지 `GET /v1/tasks/{id}`를 폴링합니다. 폴링 동작에는
    추가 구성이 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 도구 매개변수, provider 선택 및 비동기 동작을 설명합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    비디오 생성 모델을 포함한 에이전트 기본 설정을 설명합니다.
  </Card>
</CardGroup>
