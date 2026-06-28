---
read_when:
    - OpenClaw에서 Runway 비디오 생성을 사용하려는 경우
    - Runway API 키/환경 변수 설정이 필요합니다
    - Runway를 기본 비디오 제공업체로 설정하려고 합니다
summary: OpenClaw에서 Runway 동영상 생성 설정
title: 활주로
x-i18n:
    generated_at: "2026-05-06T06:38:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw는 호스팅 비디오 생성을 위한 번들 `runway` 공급자를 제공합니다. 이 Plugin은 기본적으로 활성화되어 있으며 `videoGenerationProviders` 계약에 대해 `runway` 공급자를 등록합니다.

| 속성            | 값                                                                |
| --------------- | ----------------------------------------------------------------- |
| 공급자 id       | `runway`                                                          |
| Plugin          | 번들, `enabledByDefault: true`                                    |
| 인증 환경 변수  | `RUNWAYML_API_SECRET`(표준) 또는 `RUNWAY_API_KEY`                 |
| 온보딩 플래그   | `--auth-choice runway-api-key`                                    |
| 직접 CLI 플래그 | `--runway-api-key <key>`                                          |
| API             | Runway 작업 기반 비디오 생성(`GET /v1/tasks/{id}` 폴링)          |
| 기본 모델       | `runway/gen4.5`                                                   |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway를 기본 비디오 공급자로 설정">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="비디오 생성">
    에이전트에게 비디오 생성을 요청하세요. Runway가 자동으로 사용됩니다.
  </Step>
</Steps>

## 지원되는 모드 및 모델

이 공급자는 세 가지 모드로 나뉜 일곱 개의 Runway 모델을 제공합니다. 같은 모델 id가 둘 이상의 모드에 사용될 수 있습니다. 예를 들어 `gen4.5`는 텍스트-비디오와 이미지-비디오 모두에서 작동합니다.

| 모드           | 모델                                                                   | 참조 입력                |
| -------------- | ---------------------------------------------------------------------- | ------------------------ |
| 텍스트-비디오  | `gen4.5`(기본값), `veo3.1`, `veo3.1_fast`, `veo3`                     | 없음                     |
| 이미지-비디오  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 로컬 또는 원격 이미지 1개 |
| 비디오-비디오  | `gen4_aleph`                                                           | 로컬 또는 원격 비디오 1개 |

로컬 이미지 및 비디오 참조는 데이터 URI를 통해 지원됩니다.

| 종횡비             | 허용 값                                    |
| ------------------ | ------------------------------------------ |
| 텍스트-비디오      | `16:9`, `9:16`                              |
| 이미지 및 비디오 편집 | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  비디오-비디오는 현재 `runway/gen4_aleph`가 필요합니다. 다른 Runway 모델 id는 비디오 참조 입력을 거부합니다.
</Warning>

<Note>
  잘못된 열에서 Runway 모델 id를 선택하면 API 요청이 OpenClaw를 떠나기 전에 명시적인 오류가 발생합니다. 공급자는 `extensions/runway/video-generation-provider.ts`에서 `model`을 모드의 허용 목록(`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`)과 대조하여 검증합니다.
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
    OpenClaw는 `RUNWAYML_API_SECRET`(표준)과 `RUNWAY_API_KEY`를 모두 인식합니다.
    두 변수 중 하나로 Runway 공급자를 인증할 수 있습니다.
  </Accordion>

  <Accordion title="작업 폴링">
    Runway는 작업 기반 API를 사용합니다. 생성 요청을 제출한 뒤 OpenClaw는
    비디오가 준비될 때까지 `GET /v1/tasks/{id}`를 폴링합니다. 폴링 동작에는 추가
    구성이 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 도구 매개변수, 공급자 선택, 비동기 동작입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    비디오 생성 모델을 포함한 에이전트 기본 설정입니다.
  </Card>
</CardGroup>
