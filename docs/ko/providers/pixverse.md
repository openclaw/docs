---
read_when:
    - OpenClaw에서 PixVerse 동영상 생성을 사용하려는 경우
    - PixVerse API 키/환경 설정이 필요합니다
    - PixVerse를 기본 동영상 제공자로 설정하려고 합니다
summary: OpenClaw에서 PixVerse 비디오 생성 설정
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:04:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw는 호스팅 PixVerse 동영상 생성을 위한 공식 외부 Plugin으로 `pixverse`를 제공합니다. 이 Plugin은 `videoGenerationProviders` 계약에 `pixverse` 공급자를 등록합니다.

| 속성               | 값                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 공급자 ID          | `pixverse`                                                           |
| Plugin 패키지      | `@openclaw/pixverse-provider`                                        |
| 인증 환경 변수     | `PIXVERSE_API_KEY`                                                   |
| 온보딩 플래그      | `--auth-choice pixverse-api-key`                                     |
| 직접 CLI 플래그    | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2 (`video_id` 제출 및 결과 폴링)              |
| 기본 모델          | `pixverse/v6`                                                        |
| 기본 API 리전      | 국제                                                                 |

## 시작하기

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    마법사는 공급자 구성에 `region`과 `baseUrl`을 쓰기 전에 국제 엔드포인트
    (`https://app-api.pixverse.ai/openapi/v2`)를 사용할지, CN 엔드포인트
    (`https://app-api.pixverseai.cn/openapi/v2`)를 사용할지 묻습니다.

  </Step>
  <Step title="PixVerse를 기본 동영상 공급자로 설정">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="동영상 생성">
    에이전트에게 동영상을 생성해 달라고 요청하세요. PixVerse가 자동으로 사용됩니다.
  </Step>
</Steps>

## 지원 모드 및 모델

공급자는 OpenClaw의 공유 동영상 도구를 통해 PixVerse 생성 모델을 노출합니다.

| 모드              | 모델                 | 참조 입력               |
| ----------------- | -------------------- | ----------------------- |
| 텍스트-동영상     | `v6`(기본값), `c1`   | 없음                    |
| 이미지-동영상     | `v6`(기본값), `c1`   | 로컬 또는 원격 이미지 1개 |

로컬 이미지 참조는 이미지-동영상 요청 전에 PixVerse에 업로드됩니다. 원격 이미지 URL은 PixVerse 이미지 업로드 엔드포인트에 `image_url`로 전달됩니다.

| 옵션             | 지원 값                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| 길이             | 1-15초                                                                       |
| 해상도           | `360P`, `540P`, `720P`, `1080P`                                              |
| 종횡비           | 텍스트-동영상의 경우 `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` |
| 생성 오디오      | `audio: true`                                                               |

<Note>
PixVerse 이미지 템플릿 생성은 아직 `image_generate`를 통해 노출되지 않습니다. 해당 API는 템플릿 ID 기반이지만, OpenClaw의 공유 이미지 생성 계약에는 현재 PixVerse 전용 타입 옵션 모음이 없습니다.
</Note>

## 공급자 옵션

동영상 공급자는 다음 선택적 공급자별 키를 허용합니다.

| 옵션                                 | 타입   | 효과                              |
| ------------------------------------ | ------ | --------------------------------- |
| `seed`                               | number | 지원되는 경우 결정적 시드        |
| `negativePrompt` / `negative_prompt` | string | 네거티브 프롬프트                |
| `quality`                            | string | `720p` 같은 PixVerse 품질         |
| `motionMode` / `motion_mode`         | string | 이미지-동영상 모션 모드          |
| `cameraMovement` / `camera_movement` | string | PixVerse 카메라 움직임 프리셋    |
| `templateId` / `template_id`         | number | 활성화된 PixVerse 템플릿 ID      |

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
    OpenClaw는 기본적으로 국제 PixVerse API를 사용합니다. 키가 특정 PixVerse 플랫폼 리전에 속하는 경우 `models.providers.pixverse.region`을
    수동으로 설정하거나, 설정 마법사에서 리전을 선택하려면
    `openclaw onboard --auth-choice pixverse-api-key`를 사용하세요.

    | 리전 값         | PixVerse API 기본 URL                         |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="사용자 지정 기본 URL">
    신뢰할 수 있는 호환 프록시를 통해 라우팅할 때만 `models.providers.pixverse.baseUrl`을 설정하세요.
    `baseUrl`은 `region`보다 우선합니다.

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
    PixVerse는 생성 요청에서 `video_id`를 반환합니다. OpenClaw는 작업이 성공하거나, 실패하거나,
    시간 초과될 때까지 `/openapi/v2/video/result/{video_id}`를 폴링합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 도구 매개변수, 공급자 선택, 비동기 동작입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    동영상 생성 모델을 포함한 에이전트 기본 설정입니다.
  </Card>
</CardGroup>
