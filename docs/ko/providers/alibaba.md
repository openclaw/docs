---
read_when:
    - OpenClaw에서 Alibaba Wan 비디오 생성을 사용하고 싶습니다
    - 비디오 생성을 위해 Model Studio 또는 DashScope API 키 설정이 필요합니다
summary: OpenClaw의 Alibaba Model Studio Wan 비디오 생성
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-12T23:29:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6e97d929952cdba7740f5ab3f6d85c18286b05596a4137bf80bbc8b54f32662
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw는 Alibaba Model Studio / DashScope의 Wan 모델용 번들 `alibaba` 비디오 생성 provider를 제공합니다.

- Provider: `alibaba`
- 권장 인증: `MODELSTUDIO_API_KEY`
- 추가로 허용됨: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: DashScope / Model Studio 비동기 비디오 생성

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
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
  <Step title="provider 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
허용되는 인증 키(`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) 중 어느 것이든 동작합니다. `qwen-standard-api-key` 온보딩 선택지는 공유 DashScope 자격 증명을 구성합니다.
</Note>

## 기본 제공 Wan 모델

번들 `alibaba` provider는 현재 다음을 등록합니다.

| Model ref                  | 모드                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | 텍스트-비디오             |
| `alibaba/wan2.6-i2v`       | 이미지-비디오             |
| `alibaba/wan2.6-r2v`       | 참조-비디오               |
| `alibaba/wan2.6-r2v-flash` | 참조-비디오(고속)         |
| `alibaba/wan2.7-r2v`       | 참조-비디오               |

## 현재 제한 사항

| Parameter             | 제한                                                     |
| --------------------- | --------------------------------------------------------- |
| 출력 비디오         | 요청당 최대 **1**개                                       |
| 입력 이미지          | 최대 **1**개                                              |
| 입력 비디오          | 최대 **4**개                                              |
| 길이              | 최대 **10초**                                             |
| 지원되는 제어 항목    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 참조 이미지/비디오 | 원격 `http(s)` URL만 지원                                 |

<Warning>
참조 이미지/비디오 모드는 현재 **원격 http(s) URL**이 필요합니다. 참조 입력에 로컬 파일 경로는 지원되지 않습니다.
</Warning>

## 고급 구성

<AccordionGroup>
  <Accordion title="Qwen과의 관계">
    번들 `qwen` provider도 Wan 비디오 생성을 위해 Alibaba 호스팅 DashScope 엔드포인트를 사용합니다. 다음과 같이 사용하세요.

    - 정식 Qwen provider 표면을 원하면 `qwen/...`
    - 공급업체가 직접 소유한 Wan 비디오 표면을 원하면 `alibaba/...`

    자세한 내용은 [Qwen provider 문서](/ko/providers/qwen)를 참조하세요.

  </Accordion>

  <Accordion title="인증 키 우선순위">
    OpenClaw는 다음 순서로 인증 키를 확인합니다.

    1. `MODELSTUDIO_API_KEY`(권장)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    이들 중 어느 것이든 `alibaba` provider를 인증할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수와 provider 선택입니다.
  </Card>
  <Card title="Qwen" href="/ko/providers/qwen" icon="microchip">
    Qwen provider 설정 및 DashScope 통합입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference#agent-defaults" icon="gear">
    에이전트 기본값과 모델 구성입니다.
  </Card>
</CardGroup>
