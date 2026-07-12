---
read_when:
    - OpenClaw에서 PixVerse 동영상 생성을 사용하려고 합니다
    - PixVerse API 키/환경 변수 설정이 필요합니다.
    - PixVerse를 기본 동영상 제공업체로 설정하려고 합니다
summary: OpenClaw에서 PixVerse 동영상 생성 설정
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T01:08:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw은 호스팅형 PixVerse 동영상 생성을 위한 공식 외부 Plugin으로 `pixverse`를 제공합니다. 이 Plugin은 `videoGenerationProviders` 계약에 `pixverse` 제공자를 등록합니다.

| 속성               | 값                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 제공자 ID           | `pixverse`                                                           |
| Plugin 패키지       | `@openclaw/pixverse-provider`                                        |
| 인증 환경 변수      | `PIXVERSE_API_KEY`                                                   |
| 온보딩 플래그       | `--auth-choice pixverse-api-key`                                     |
| 직접 CLI 플래그     | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2 (`video_id` 제출 후 결과 폴링)              |
| 기본 모델           | `pixverse/v6`                                                        |
| 기본 API 리전       | 국제                                                                |

## 시작하기

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    마법사는 제공자 구성에 `region`과 `baseUrl`을 기록하기 전에 국제 또는 CN 엔드포인트를 선택하라는 메시지를 표시합니다(아래 API 리전 참조).
    비대화형 실행(`--pixverse-api-key` 또는 `PIXVERSE_API_KEY`에서 키 사용)은
    기본적으로 국제 리전을 사용합니다.

    또한 아직 기본 동영상 모델이 구성되지 않은 경우 온보딩 과정에서
    `agents.defaults.videoGenerationModel.primary`를 `pixverse/v6`로 설정합니다.

  </Step>
  <Step title="기존 기본 동영상 제공자 전환(선택 사항)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="동영상 생성">
    에이전트에게 동영상을 생성하도록 요청합니다. PixVerse가 자동으로 사용됩니다.
  </Step>
</Steps>

## 지원 모드 및 모델

이 제공자는 OpenClaw의 공유 동영상 도구를 통해 PixVerse 생성 모델을 제공합니다.

| 모드             | 모델                 | 참조 입력                  |
| ---------------- | -------------------- | -------------------------- |
| 텍스트-동영상    | `v6`(기본값), `c1`   | 없음                       |
| 이미지-동영상    | `v6`(기본값), `c1`   | 로컬 또는 원격 이미지 1개  |

로컬 이미지 참조는 이미지-동영상 요청 전에 PixVerse에 업로드됩니다. 원격 이미지 URL은 PixVerse 이미지 업로드 엔드포인트에 `image_url`로 전달됩니다.

| 옵션          | 지원 값                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 길이          | 1~15초(기본값 5초)                                                                                                                  |
| 해상도        | `360P`, `540P`, `720P`, `1080P`(기본값 `540P`; `480P` 요청은 `540P`로 매핑됨)                                                       |
| 화면비        | `16:9`(기본값), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; 텍스트-동영상 전용이며 이미지-동영상은 원본 이미지를 따름       |
| 생성 오디오   | `audio: true`                                                                                                                        |

<Note>
PixVerse 이미지 템플릿 생성은 아직 `image_generate`를 통해 제공되지 않습니다. 해당 API는 템플릿 ID 기반이지만, OpenClaw의 공유 이미지 생성 계약에는 현재 PixVerse 전용 형식화 옵션 모음이 없습니다.
</Note>

## 제공자 옵션

동영상 제공자는 다음과 같은 제공자별 선택적 키를 허용합니다.

| 옵션                                 | 유형   | 효과                                          |
| ------------------------------------ | ------ | --------------------------------------------- |
| `seed`                               | 숫자   | 결정론적 시드, 0~2147483647                   |
| `negativePrompt` / `negative_prompt` | 문자열 | 부정 프롬프트                                 |
| `quality`                            | 문자열 | `720p` 같은 PixVerse 품질                     |
| `motionMode` / `motion_mode`         | 문자열 | 이미지-동영상 모션 모드(기본값 `normal`)      |
| `cameraMovement` / `camera_movement` | 문자열 | PixVerse 카메라 움직임 프리셋                 |
| `templateId` / `template_id`         | 숫자   | 활성화된 PixVerse 템플릿 ID                   |

## 구성

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="API 리전">
    | 리전 값          | PixVerse API 기본 URL                         |
    | ---------------- | --------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`    |

    키가 특정 PixVerse 플랫폼 리전에 속하는 경우
    `models.providers.pixverse.region`을 수동으로 설정하거나,
    `openclaw onboard --auth-choice pixverse-api-key`를 실행하여
    설정 마법사에서 리전을 선택합니다.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" 또는 "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="사용자 지정 기본 URL">
    신뢰할 수 있는 호환 프록시를 통해 라우팅하는 경우에만 `models.providers.pixverse.baseUrl`을 설정합니다.
    `baseUrl`이 `region`보다 우선합니다.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="작업 폴링">
    PixVerse는 생성 요청에서 `video_id`를 반환합니다. OpenClaw은 작업이 성공하거나 실패하거나 시간 제한에 도달할 때까지
    5초마다 `/openapi/v2/video/result/{video_id}`를 폴링합니다(기본값 5분,
    `agents.defaults.videoGenerationModel.timeoutMs`로 재정의 가능).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 도구 매개변수, 제공자 선택 및 비동기 동작입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    동영상 생성 모델을 포함한 에이전트 기본 설정입니다.
  </Card>
</CardGroup>
