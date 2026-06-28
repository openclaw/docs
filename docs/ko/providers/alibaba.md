---
read_when:
    - OpenClaw에서 Alibaba Wan 비디오 생성을 사용하려고 합니다
    - 동영상 생성을 위해 Model Studio 또는 DashScope API 키 설정이 필요합니다
summary: OpenClaw에서 Alibaba Model Studio Wan 비디오 생성
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T06:36:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw에는 Alibaba Model Studio(DashScope의 국제 이름)의 Wan 모델용 비디오 생성 공급자를 등록하는 번들 `alibaba` Plugin이 포함되어 있습니다. 이 Plugin은 기본적으로 활성화되어 있으며, API 키만 설정하면 됩니다.

| 속성             | 값                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 공급자 ID        | `alibaba`                                                                       |
| Plugin           | 번들, `enabledByDefault: true`                                                  |
| 인증 환경 변수   | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (첫 번째 일치 항목 사용) |
| 온보딩 플래그    | `--auth-choice alibaba-model-studio-api-key`                                    |
| 직접 CLI 플래그  | `--alibaba-model-studio-api-key <key>`                                          |
| 기본 모델        | `alibaba/wan2.6-t2v`                                                            |
| 기본 기본 URL    | `https://dashscope-intl.aliyuncs.com`                                           |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    온보딩을 사용하여 `alibaba` 공급자에 대한 키를 저장합니다.

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    또는 설치/온보딩 중에 키를 직접 전달합니다.

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    또는 Gateway를 시작하기 전에 허용되는 환경 변수 중 하나를 내보냅니다.

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="기본 비디오 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="공급자가 구성되었는지 확인">
    ```bash
    openclaw models list --provider alibaba
    ```

    목록에는 번들 Wan 모델 5개가 모두 포함되어야 합니다. `MODELSTUDIO_API_KEY`가 확인되지 않으면 `openclaw models status --json`은 누락된 자격 증명을 `auth.unusableProfiles` 아래에 보고합니다.

  </Step>
</Steps>

<Note>
  Alibaba Plugin과 [Qwen Plugin](/ko/providers/qwen)은 모두 DashScope에 대해 인증하며, 겹치는 환경 변수를 허용합니다. 전용 Wan 비디오 표면을 구동하려면 `alibaba/...` 모델 ID를 사용하고, Qwen의 채팅, 임베딩 또는 미디어 이해 표면을 원할 때는 `qwen/...` ID를 사용합니다.
</Note>

## 기본 제공 Wan 모델

| 모델 참조                  | 모드                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | 텍스트-비디오(기본값)     |
| `alibaba/wan2.6-i2v`       | 이미지-비디오             |
| `alibaba/wan2.6-r2v`       | 참조-비디오               |
| `alibaba/wan2.6-r2v-flash` | 참조-비디오(빠름)         |
| `alibaba/wan2.7-r2v`       | 참조-비디오               |

## 기능 및 제한

번들 공급자는 DashScope의 Wan 비디오 API 한도를 반영합니다. 세 가지 모드는 모두 요청당 비디오 수와 길이 한도를 공유하며, 입력 형태만 다릅니다.

| 모드               | 최대 출력 비디오 | 최대 입력 이미지 | 최대 입력 비디오 | 최대 길이 | 지원되는 제어                                            |
| ------------------ | ---------------- | ---------------- | ---------------- | --------- | --------------------------------------------------------- |
| 텍스트-비디오      | 1                | 해당 없음        | 해당 없음        | 10초      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 이미지-비디오      | 1                | 1                | 해당 없음        | 10초      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 참조-비디오        | 1                | 해당 없음        | 4                | 10초      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

요청에서 `durationSeconds`를 생략하면 공급자는 DashScope에서 허용하는 기본값인 **5초**를 보냅니다. 최대 10초까지 늘리려면 [비디오 생성 도구](/ko/tools/video-generation)에서 `durationSeconds`를 명시적으로 설정하세요.

<Warning>
  참조 이미지 및 비디오 입력은 원격 `http(s)` URL이어야 합니다. 로컬 파일 경로는 DashScope의 참조 모드에서 허용되지 않습니다. 먼저 객체 스토리지에 업로드하거나 이미 공개 URL을 생성하는 [미디어 도구](/ko/tools/media-overview) 흐름을 사용하세요.
</Warning>

## 고급 구성

<AccordionGroup>
  <Accordion title="DashScope 기본 URL 재정의">
    공급자는 기본적으로 국제 DashScope 엔드포인트를 사용합니다. 중국 리전 엔드포인트를 대상으로 하려면 다음을 설정하세요.

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    공급자는 AIGC 작업 URL을 구성하기 전에 끝의 슬래시를 제거합니다.

  </Accordion>

  <Accordion title="인증 환경 변수 우선순위">
    OpenClaw는 다음 순서로 환경 변수에서 Alibaba API 키를 확인하며, 비어 있지 않은 첫 번째 값을 사용합니다.

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    구성된 `auth.profiles` 항목(`openclaw models auth login`을 통해 설정)은 환경 변수 확인을 재정의합니다. 프로필 순환, 쿨다운 및 재정의 메커니즘은 [모델 FAQ의 인증 프로필](/ko/help/faq-models#what-is-an-auth-profile)을 참조하세요.

  </Accordion>

  <Accordion title="Qwen Plugin과의 관계">
    두 번들 Plugin은 모두 DashScope와 통신하며 겹치는 API 키를 허용합니다. 다음을 사용하세요.

    - 이 페이지에 문서화된 전용 Wan 비디오 공급자를 구동하려면 `alibaba/wan*.*` ID를 사용합니다.
    - Qwen 채팅, 임베딩 및 미디어 이해에는 `qwen/*` ID를 사용합니다([Qwen](/ko/providers/qwen) 참조).

    인증 환경 변수 목록이 의도적으로 겹치므로 `MODELSTUDIO_API_KEY`를 한 번 설정하면 두 Plugin이 모두 인증됩니다. 각 Plugin을 별도로 온보딩할 필요는 없습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수 및 공급자 선택.
  </Card>
  <Card title="Qwen" href="/ko/providers/qwen" icon="microchip">
    동일한 DashScope 인증에서 Qwen 채팅, 임베딩 및 미디어 이해 설정.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값 및 모델 구성.
  </Card>
  <Card title="모델 FAQ" href="/ko/help/faq-models" icon="circle-question">
    인증 프로필, 모델 전환 및 "no profile" 오류 해결.
  </Card>
</CardGroup>
