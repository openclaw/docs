---
read_when:
    - OpenClaw에서 Vydra 미디어 생성을 사용하려고 합니다
    - Vydra API 키 설정 안내가 필요합니다
summary: OpenClaw에서 Vydra 이미지, 동영상 및 음성 사용하기
title: Vydra
x-i18n:
    generated_at: "2026-07-12T15:41:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

번들 Vydra Plugin은 다음 기능을 추가합니다.

- `vydra/grok-imagine`을 통한 이미지 생성
- `vydra/veo3`(텍스트-비디오) 및 `vydra/kling`(이미지-비디오)을 통한 비디오 생성
- Vydra의 ElevenLabs 기반 TTS 경로를 통한 음성 합성

OpenClaw는 세 기능 모두에 동일한 `VYDRA_API_KEY`를 사용합니다.

| 속성            | 값                                                                        |
| --------------- | ------------------------------------------------------------------------- |
| 제공자 ID       | `vydra`                                                                   |
| Plugin          | 번들 제공, `enabledByDefault: true`                                       |
| 인증 환경 변수  | `VYDRA_API_KEY`                                                           |
| 온보딩 플래그   | `--auth-choice vydra-api-key`                                             |
| 직접 CLI 플래그 | `--vydra-api-key <key>`                                                   |
| 계약            | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| 기본 URL        | `https://www.vydra.ai/api/v1` (`www` 호스트 사용)                         |

<Warning>
기본 URL로 `https://www.vydra.ai/api/v1`을 사용하십시오. 현재 Vydra의 최상위 호스트(`https://vydra.ai/api/v1`)는 `www`로 리디렉션됩니다. 일부 HTTP 클라이언트는 이 호스트 간 리디렉션에서 `Authorization`을 제거하므로 유효한 API 키가 오해를 유발하는 인증 실패로 처리됩니다. 이를 방지하기 위해 번들 Plugin은 구성된 모든 `vydra.ai` 기본 URL을 `www.vydra.ai`로 정규화합니다.
</Warning>

## 설정

<Steps>
  <Step title="대화형 온보딩 실행">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    또는 환경 변수를 직접 설정합니다.

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="기본 기능 선택">
    아래 기능(이미지, 비디오 또는 음성) 중 하나 이상을 선택하고 해당 구성을 적용하십시오.
  </Step>
</Steps>

## 기능

<AccordionGroup>
  <Accordion title="이미지 생성">
    기본이자 유일한 번들 이미지 모델:

    - `vydra/grok-imagine`

    기본 이미지 제공자로 설정합니다.

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

    번들 지원은 텍스트-이미지만 제공하며 요청당 최대 이미지 한 개를 생성합니다. Vydra의 호스팅 편집 경로에는 원격 이미지 URL이 필요하며, 번들 Plugin은 Vydra 전용 업로드 브리지를 추가하지 않습니다.

    <Note>
    공통 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하십시오.
    </Note>

  </Accordion>

  <Accordion title="비디오 생성">
    등록된 비디오 모델:

    - 텍스트-비디오용 `vydra/veo3`(이미지 참조 입력 거부)
    - 이미지-비디오용 `vydra/kling`(원격 이미지 URL 정확히 한 개 필요)

    Vydra를 기본 비디오 제공자로 설정합니다.

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

    - `vydra/kling`은 로컬 파일 업로드를 처음부터 거부하며, 원격 이미지 URL 참조만 사용할 수 있습니다.
    - Vydra의 `kling` HTTP 경로는 `image_url`과 `video_url` 중 어느 것이 필요한지 일관되지 않았습니다. 번들 제공자는 두 필드 모두에 동일한 원격 이미지 URL을 전송합니다.
    - 번들 Plugin은 보수적으로 동작하며 가로세로 비율, 해상도, 워터마크 또는 생성된 오디오와 같은 문서화되지 않은 스타일 옵션을 전달하지 않습니다.

    <Note>
    공통 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하십시오.
    </Note>

  </Accordion>

  <Accordion title="비디오 라이브 테스트">
    제공자별 라이브 테스트 범위:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    번들 Vydra 라이브 파일은 다음을 다룹니다.

    - `vydra/veo3` 텍스트-비디오
    - 원격 이미지 URL을 사용하는 `vydra/kling` 이미지-비디오

    필요한 경우 원격 이미지 픽스처를 재정의합니다.

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="음성 합성">
    Vydra를 음성 제공자로 설정합니다.

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    기본값:

    - 모델: `elevenlabs/tts`
    - 음성 ID: `21m00Tcm4TlvDq8ikWAM`("Rachel")

    번들 Plugin은 정상 작동이 확인된 이 기본 음성 하나를 제공하며 MP3 오디오 파일을 반환합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="제공자 디렉터리" href="/ko/providers/index" icon="list">
    사용 가능한 모든 제공자를 살펴보십시오.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수 및 제공자 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수 및 제공자 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값 및 모델 구성.
  </Card>
</CardGroup>
