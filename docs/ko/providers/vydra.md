---
read_when:
    - OpenClaw에서 Vydra 미디어 생성을 사용하려고 합니다
    - Vydra API 키 설정 안내가 필요합니다
summary: OpenClaw에서 Vydra 이미지, 비디오 및 음성을 사용하기
title: Vydra
x-i18n:
    generated_at: "2026-04-12T23:33:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab623d14b656ce0b68d648a6393fcee3bb880077d6583e0d5c1012e91757f20e
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

번들 Vydra Plugin은 다음을 추가합니다:

- `vydra/grok-imagine`을 통한 이미지 생성
- `vydra/veo3` 및 `vydra/kling`을 통한 비디오 생성
- Vydra의 ElevenLabs 기반 TTS 경로를 통한 음성 합성

OpenClaw는 이 세 가지 기능 모두에 동일한 `VYDRA_API_KEY`를 사용합니다.

<Warning>
base URL로 `https://www.vydra.ai/api/v1`을 사용하세요.

Vydra의 apex 호스트(`https://vydra.ai/api/v1`)는 현재 `www`로 리디렉션됩니다. 일부 HTTP 클라이언트는 이 교차 호스트 리디렉션에서 `Authorization`을 제거하므로, 유효한 API 키가 오해를 부르는 인증 실패로 바뀔 수 있습니다. 번들 Plugin은 이를 피하기 위해 `www` base URL을 직접 사용합니다.
</Warning>

## 설정

<Steps>
  <Step title="대화형 온보딩 실행">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    또는 환경 변수를 직접 설정하세요:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="기본 기능 선택">
    아래 기능(이미지, 비디오, 음성) 중 하나 이상을 선택하고, 해당 구성 예시를 적용하세요.
  </Step>
</Steps>

## 기능

<AccordionGroup>
  <Accordion title="이미지 생성">
    기본 이미지 모델:

    - `vydra/grok-imagine`

    기본 이미지 provider로 설정:

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

    현재 번들 지원은 텍스트-이미지 전용입니다. Vydra의 호스팅 편집 경로는 원격 이미지 URL을 기대하지만, OpenClaw는 아직 번들 Plugin에서 Vydra 전용 업로드 브리지를 추가하지 않습니다.

    <Note>
    공통 도구 매개변수, provider 선택, 장애 조치 동작은 [Image Generation](/ko/tools/image-generation)을 참조하세요.
    </Note>

  </Accordion>

  <Accordion title="비디오 생성">
    등록된 비디오 모델:

    - 텍스트-비디오용 `vydra/veo3`
    - 이미지-비디오용 `vydra/kling`

    Vydra를 기본 비디오 provider로 설정:

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

    - `vydra/veo3`는 번들에서 텍스트-비디오 전용으로 제공됩니다.
    - `vydra/kling`은 현재 원격 이미지 URL 참조가 필요합니다. 로컬 파일 업로드는 초기에 거부됩니다.
    - Vydra의 현재 `kling` HTTP 경로는 `image_url` 또는 `video_url` 중 어느 필드가 필요한지 일관되지 않았고, 번들 provider는 동일한 원격 이미지 URL을 두 필드 모두에 매핑합니다.
    - 번들 Plugin은 보수적으로 동작하며 화면비, 해상도, 워터마크, 생성된 오디오 같은 문서화되지 않은 스타일 옵션은 전달하지 않습니다.

    <Note>
    공통 도구 매개변수, provider 선택, 장애 조치 동작은 [Video Generation](/ko/tools/video-generation)을 참조하세요.
    </Note>

  </Accordion>

  <Accordion title="비디오 라이브 테스트">
    provider 전용 라이브 테스트 범위:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    현재 번들 Vydra 라이브 파일은 다음을 포함합니다:

    - `vydra/veo3` 텍스트-비디오
    - 원격 이미지 URL을 사용하는 `vydra/kling` 이미지-비디오

    필요할 경우 원격 이미지 fixture를 재정의하세요:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="음성 합성">
    음성 provider로 Vydra를 설정:

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
    - 음성 ID: `21m00Tcm4TlvDq8ikWAM`

    번들 Plugin은 현재 검증된 기본 음성 하나를 제공하며 MP3 오디오 파일을 반환합니다.

  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="Provider 디렉터리" href="/ko/providers/index" icon="list">
    사용 가능한 모든 provider 찾아보기.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference#agent-defaults" icon="gear">
    agent 기본값 및 모델 구성.
  </Card>
</CardGroup>
