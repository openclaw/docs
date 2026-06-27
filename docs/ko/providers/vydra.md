---
read_when:
    - OpenClaw에서 Vydra 미디어 생성을 원합니다
    - Vydra API 키 설정 안내가 필요합니다
summary: OpenClaw에서 Vydra 이미지, 비디오 및 음성 사용
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:05:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

번들에 포함된 Vydra Plugin은 다음을 추가합니다.

- `vydra/grok-imagine`을 통한 이미지 생성
- `vydra/veo3` 및 `vydra/kling`을 통한 동영상 생성
- Vydra의 ElevenLabs 기반 TTS 경로를 통한 음성 합성

OpenClaw는 세 가지 기능 모두에 동일한 `VYDRA_API_KEY`를 사용합니다.

| 속성            | 값                                                                        |
| --------------- | ------------------------------------------------------------------------- |
| Provider ID     | `vydra`                                                                   |
| Plugin          | 번들 포함, `enabledByDefault: true`                                       |
| 인증 환경 변수  | `VYDRA_API_KEY`                                                           |
| 온보딩 플래그   | `--auth-choice vydra-api-key`                                             |
| 직접 CLI 플래그 | `--vydra-api-key <key>`                                                   |
| 계약            | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| 기본 URL        | `https://www.vydra.ai/api/v1` (`www` 호스트 사용)                         |

<Warning>
  기본 URL로 `https://www.vydra.ai/api/v1`을 사용하세요. Vydra의 apex 호스트(`https://vydra.ai/api/v1`)는 현재 `www`로 리디렉션됩니다. 일부 HTTP 클라이언트는 해당 교차 호스트 리디렉션에서 `Authorization`을 제거하므로, 유효한 API 키가 오해의 소지가 있는 인증 실패로 바뀔 수 있습니다. 번들 Plugin은 이를 피하기 위해 `www` 기본 URL을 직접 사용합니다.
</Warning>

## 설정

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    또는 환경 변수를 직접 설정하세요.

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    아래 기능(이미지, 동영상 또는 음성) 중 하나 이상을 선택하고 일치하는 구성을 적용하세요.
  </Step>
</Steps>

## 기능

<AccordionGroup>
  <Accordion title="Image generation">
    기본 이미지 모델:

    - `vydra/grok-imagine`

    기본 이미지 provider로 설정하세요.

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    현재 번들 지원은 텍스트-이미지만 가능합니다. Vydra의 호스팅 편집 경로는 원격 이미지 URL을 요구하며, OpenClaw는 아직 번들 Plugin에 Vydra 전용 업로드 브리지를 추가하지 않습니다.

    <Note>
    공유 도구 매개변수, provider 선택, 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    등록된 동영상 모델:

    - 텍스트-동영상용 `vydra/veo3`
    - 이미지-동영상용 `vydra/kling`

    Vydra를 기본 동영상 provider로 설정하세요.

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    참고:

    - `vydra/veo3`는 텍스트-동영상 전용으로 번들됩니다.
    - `vydra/kling`은 현재 원격 이미지 URL 참조가 필요합니다. 로컬 파일 업로드는 사전에 거부됩니다.
    - Vydra의 현재 `kling` HTTP 경로는 `image_url` 또는 `video_url` 중 무엇을 요구하는지 일관적이지 않았습니다. 번들 provider는 동일한 원격 이미지 URL을 두 필드 모두에 매핑합니다.
    - 번들 Plugin은 보수적으로 유지되며 종횡비, 해상도, 워터마크, 생성된 오디오 같은 문서화되지 않은 스타일 조정값을 전달하지 않습니다.

    <Note>
    공유 도구 매개변수, provider 선택, 장애 조치 동작은 [동영상 생성](/ko/tools/video-generation)을 참조하세요.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    Provider별 라이브 커버리지:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    번들 Vydra 라이브 파일은 이제 다음을 다룹니다.

    - `vydra/veo3` 텍스트-동영상
    - 원격 이미지 URL을 사용하는 `vydra/kling` 이미지-동영상

    필요할 때 원격 이미지 fixture를 재정의하세요.

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    Vydra를 음성 provider로 설정하세요.

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    기본값:

    - 모델: `elevenlabs/tts`
    - 음성 ID: `21m00Tcm4TlvDq8ikWAM`

    번들 Plugin은 현재 검증된 기본 음성 하나를 노출하며 MP3 오디오 파일을 반환합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Provider directory" href="/ko/providers/index" icon="list">
    사용 가능한 모든 provider를 둘러봅니다.
  </Card>
  <Card title="Image generation" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="Video generation" href="/ko/tools/video-generation" icon="video">
    공유 동영상 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값 및 모델 구성.
  </Card>
</CardGroup>
