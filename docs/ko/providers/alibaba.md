---
read_when:
    - OpenClaw에서 Alibaba Wan 동영상 생성을 사용하려고 합니다
    - 동영상 생성을 위해 Model Studio 또는 DashScope API 키를 설정해야 합니다.
summary: OpenClaw에서 Alibaba Model Studio Wan을 사용한 동영상 생성
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T15:37:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

번들 `alibaba` Plugin은 Alibaba Model Studio(DashScope의 국제 서비스명)의 Wan 모델용 동영상 생성 제공자를 등록합니다. 기본적으로 활성화되어 있으며 API 키만 있으면 됩니다.

| 속성             | 값                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 제공자 ID        | `alibaba`                                                                       |
| Plugin           | 번들, `enabledByDefault: true`                                                  |
| 인증 환경 변수   | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (첫 일치 항목 사용) |
| 온보딩 플래그    | `--auth-choice alibaba-model-studio-api-key`                                    |
| 직접 CLI 플래그  | `--alibaba-model-studio-api-key <key>`                                          |
| 기본 모델        | `alibaba/wan2.6-t2v`                                                            |
| 기본 베이스 URL  | `https://dashscope-intl.aliyuncs.com`                                           |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    온보딩을 통해 `alibaba` 제공자에 키를 저장합니다.

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    또는 키를 직접 전달합니다.

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    또는 Gateway를 시작하기 전에 허용되는 환경 변수 중 하나를 내보냅니다.

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # 또는 DASHSCOPE_API_KEY=...
    # 또는 QWEN_API_KEY=...
    ```

  </Step>
  <Step title="기본 동영상 모델 설정">
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
  <Step title="제공자 구성 확인">
    ```bash
    openclaw models list --provider alibaba
    ```

    목록에는 번들 Wan 모델 5개가 모두 포함됩니다. `MODELSTUDIO_API_KEY`를 확인할 수 없으면 `openclaw models status --json`이 `auth.unusableProfiles` 아래에 누락된 자격 증명을 보고합니다.

  </Step>
</Steps>

<Note>
  Alibaba Plugin과 [Qwen Plugin](/ko/providers/qwen)은 모두 DashScope에 인증하며 일부 환경 변수를 공통으로 허용합니다. 전용 Wan 동영상 기능에는 `alibaba/...` 모델 ID를 사용하고, Qwen 채팅, 임베딩 또는 미디어 이해에는 `qwen/...` ID를 사용하십시오.
</Note>

## 내장 Wan 모델

| 모델 참조                  | 모드                         |
| -------------------------- | ---------------------------- |
| `alibaba/wan2.6-t2v`       | 텍스트-동영상 변환(기본값)   |
| `alibaba/wan2.6-i2v`       | 이미지-동영상 변환           |
| `alibaba/wan2.6-r2v`       | 참조-동영상 변환             |
| `alibaba/wan2.6-r2v-flash` | 참조-동영상 변환(고속)       |
| `alibaba/wan2.7-r2v`       | 참조-동영상 변환             |

## 기능 및 제한

세 모드는 모두 요청당 동영상 개수와 최대 길이가 동일하며 입력 형식만 다릅니다.

| 모드               | 최대 출력 동영상 | 최대 입력 이미지 | 최대 입력 동영상 | 최대 길이 | 지원되는 제어 항목                                        |
| ------------------ | ---------------- | ---------------- | ---------------- | --------- | --------------------------------------------------------- |
| 텍스트-동영상 변환 | 1                | 해당 없음        | 해당 없음        | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 이미지-동영상 변환 | 1                | 1                | 해당 없음        | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 참조-동영상 변환   | 1                | 해당 없음        | 4                | 10 s      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

`durationSeconds`를 생략한 요청에는 DashScope에서 허용하는 기본값인 **5초**가 적용됩니다. 최대 10 s까지 연장하려면 [동영상 생성 도구](/ko/tools/video-generation)에서 `durationSeconds`를 명시적으로 설정하십시오.

<Warning>
  참조 이미지와 동영상 입력은 원격 `http(s)` URL이어야 합니다. DashScope의 참조 모드는 로컬 파일 경로를 거부합니다. 먼저 객체 스토리지에 업로드하거나, 이미 공개 URL을 생성하는 [미디어 도구](/ko/tools/media-overview) 흐름을 사용하십시오.
</Warning>

## 고급 구성

<AccordionGroup>
  <Accordion title="DashScope 베이스 URL 재정의">
    제공자는 기본적으로 DashScope 국제 엔드포인트를 사용합니다. 중국 리전 엔드포인트를 대상으로 지정하려면 다음과 같이 구성합니다.

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

    제공자는 AIGC 작업 URL을 구성하기 전에 후행 슬래시를 제거합니다.

  </Accordion>

  <Accordion title="인증 환경 변수 우선순위">
    OpenClaw는 다음 순서로 환경 변수에서 Alibaba API 키를 확인하며, 비어 있지 않은 첫 번째 값을 사용합니다.

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    구성된 `auth.profiles` 항목(`openclaw models auth login`으로 설정)은 환경 변수 확인보다 우선합니다. 프로필 순환, 쿨다운 및 재정의 방식은 [모델 FAQ의 인증 프로필](/ko/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them)을 참조하십시오.

  </Accordion>

  <Accordion title="Qwen Plugin과의 관계">
    두 번들 Plugin은 모두 DashScope와 통신하며 일부 API 키를 공통으로 허용합니다. 다음과 같이 사용하십시오.

    - 이 페이지에서 설명하는 전용 Wan 동영상 제공자에는 `alibaba/wan*.*` ID를 사용합니다.
    - Qwen 채팅, 임베딩 및 미디어 이해에는 `qwen/*` ID를 사용합니다([Qwen](/ko/providers/qwen) 참조).

    인증 환경 변수 목록은 의도적으로 중복되므로 `MODELSTUDIO_API_KEY`를 한 번 설정하면 두 Plugin이 모두 인증됩니다. 각 Plugin을 별도로 온보딩할 필요는 없습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공통 동영상 도구 매개변수 및 제공자 선택 방법입니다.
  </Card>
  <Card title="Qwen" href="/ko/providers/qwen" icon="microchip">
    동일한 DashScope 인증을 사용하는 Qwen 채팅, 임베딩 및 미디어 이해 설정입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값 및 모델 구성입니다.
  </Card>
  <Card title="모델 FAQ" href="/ko/help/faq-models" icon="circle-question">
    인증 프로필, 모델 전환 및 "no profile" 오류 해결 방법입니다.
  </Card>
</CardGroup>
