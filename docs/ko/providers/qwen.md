---
read_when:
    - OpenClaw에서 Qwen을 사용하려고 합니다
    - 이전에 Qwen OAuth를 사용했습니다
summary: OpenClaw Plugin을 통해 Qwen Cloud 사용
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:04:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw은 이제 Qwen을 정식 provider Plugin으로 취급하며 canonical id는
`qwen`입니다. 이 provider Plugin은 Qwen Cloud / Alibaba DashScope와
Coding Plan 엔드포인트를 대상으로 하며, 레거시 `modelstudio` id가 호환성
alias로 계속 동작하도록 유지하고, Qwen Portal 토큰 흐름도 provider `qwen-oauth`로
노출합니다.

- Provider: `qwen`
- Portal provider: [`qwen-oauth`](/ko/providers/qwen-oauth)
- 권장 env var: `QWEN_API_KEY`
- 호환성을 위해 함께 허용됨: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API 스타일: OpenAI 호환

<Tip>
`qwen3.6-plus`를 사용하려면 **Standard(종량제)** 엔드포인트를 우선 사용하세요.
Coding Plan 지원은 공개 catalog보다 늦어질 수 있습니다.
</Tip>

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작하세요.

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 시작하기

플랜 유형을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **적합한 용도:** Qwen Coding Plan을 통한 구독 기반 액세스.

    <Steps>
      <Step title="Get your API key">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)에서 API 키를 만들거나 복사하세요.
      </Step>
      <Step title="Run onboarding">
        **Global** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **China** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    레거시 `modelstudio-*` auth-choice id와 `modelstudio/...` model ref는 여전히
    호환성 alias로 동작하지만, 새 설정 흐름에서는 canonical `qwen-*` auth-choice id와
    `qwen/...` model ref를 우선 사용해야 합니다. 다른 `api` 값을 가진 정확한
    custom `models.providers.modelstudio` 항목을 정의하면, 해당 custom provider가
    Qwen 호환성 alias 대신 `modelstudio/...` ref를 소유합니다.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **적합한 용도:** Coding Plan에서 제공되지 않을 수 있는 `qwen3.6-plus` 같은 모델을 포함해 Standard Model Studio 엔드포인트를 통한 종량제 액세스.

    <Steps>
      <Step title="Get your API key">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)에서 API 키를 만들거나 복사하세요.
      </Step>
      <Step title="Run onboarding">
        **Global** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **China** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    레거시 `modelstudio-*` auth-choice id와 `modelstudio/...` model ref는 여전히
    호환성 alias로 동작하지만, 새 설정 흐름에서는 canonical `qwen-*` auth-choice id와
    `qwen/...` model ref를 우선 사용해야 합니다. 다른 `api` 값을 가진 정확한
    custom `models.providers.modelstudio` 항목을 정의하면, 해당 custom provider가
    Qwen 호환성 alias 대신 `modelstudio/...` ref를 소유합니다.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **적합한 용도:** `https://portal.qwen.ai/v1`에 대한 Qwen Portal 토큰.

    전용 provider 페이지와 마이그레이션 참고 사항은 [Qwen OAuth / Portal](/ko/providers/qwen-oauth)을
    참조하세요.

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth`는 DashScope provider와 동일한 `QWEN_API_KEY` env var 이름을
    사용하지만, OpenClaw 온보딩을 통해 구성하면 auth를 `qwen-oauth` provider id 아래에
    저장합니다.
    </Note>

  </Tab>
</Tabs>

## 플랜 유형 및 엔드포인트

| 플랜                       | 리전 | Auth choice                | 엔드포인트                                      |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard(종량제)           | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard(종량제)           | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan(구독)          | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan(구독)          | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

provider는 auth choice에 따라 엔드포인트를 자동으로 선택합니다. Canonical
choice는 `qwen-*` 계열을 사용하며, `modelstudio-*`는 호환성 전용으로 유지됩니다.
config에서 custom `baseUrl`로 재정의할 수 있습니다.

<Tip>
**키 관리:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**문서:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 기본 제공 catalog

OpenClaw은 현재 이 Qwen 정적 catalog를 제공합니다. 구성된 catalog는
엔드포인트를 인식합니다. Coding Plan config는 Standard 엔드포인트에서만 동작하는 것으로
알려진 모델을 제외합니다.

| Model ref                   | 입력        | Context   | 참고                                               |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | 텍스트, 이미지 | 1,000,000 | 기본 모델                                          |
| `qwen/qwen3.6-plus`         | 텍스트, 이미지 | 1,000,000 | 이 모델이 필요하면 Standard 엔드포인트를 우선 사용 |
| `qwen/qwen3-max-2026-01-23` | 텍스트      | 262,144   | Qwen Max 계열                                      |
| `qwen/qwen3-coder-next`     | 텍스트      | 262,144   | 코딩                                               |
| `qwen/qwen3-coder-plus`     | 텍스트      | 1,000,000 | 코딩                                               |
| `qwen/MiniMax-M2.5`         | 텍스트      | 1,000,000 | 추론 활성화                                        |
| `qwen/glm-5`                | 텍스트      | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | 텍스트      | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | 텍스트, 이미지 | 262,144   | Alibaba를 통한 Moonshot AI                         |
| `qwen-oauth/qwen3.5-plus`   | 텍스트, 이미지 | 1,000,000 | Qwen Portal 기본값                                 |

<Note>
모델이 정적 catalog에 있더라도 사용 가능 여부는 엔드포인트와 청구 플랜에 따라
달라질 수 있습니다.
</Note>

## Thinking 제어

추론이 활성화된 Qwen Cloud 모델의 경우, provider는 OpenClaw
thinking 수준을 DashScope의 최상위 `enable_thinking` 요청 플래그에 매핑합니다. 비활성화된
thinking은 `enable_thinking: false`를 보내고, 다른 thinking 수준은
`enable_thinking: true`를 보냅니다.

## 멀티모달 추가 기능

`qwen` Plugin은 **Standard** DashScope 엔드포인트에서도 멀티모달 기능을 노출합니다
(Coding Plan 엔드포인트 제외).

- `qwen-vl-max-latest`를 통한 **비디오 이해**
- `wan2.6-t2v`(기본값), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`를 통한 **Wan 비디오 생성**

Qwen을 기본 비디오 provider로 사용하려면:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
공유 도구 매개변수, provider 선택, failover 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Qwen Plugin은 **Standard** DashScope 엔드포인트에서 이미지와 비디오에 대한
    미디어 이해를 등록합니다(Coding Plan 엔드포인트 제외).

    | 속성          | 값                    |
    | ------------- | --------------------- |
    | 모델          | `qwen-vl-max-latest`  |
    | 지원 입력     | 이미지, 비디오        |

    미디어 이해는 구성된 Qwen auth에서 자동으로 해석되므로 추가 config가 필요하지
    않습니다. 미디어 이해 지원을 위해 Standard(종량제) 엔드포인트를 사용하고 있는지 확인하세요.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus`는 Standard(종량제) Model Studio 엔드포인트에서 사용할 수 있습니다.

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan 엔드포인트가 `qwen3.6-plus`에 대해 "unsupported model" 오류를
    반환하면 Coding Plan 엔드포인트/키 쌍 대신 Standard(종량제)로 전환하세요.

    OpenClaw의 Qwen 정적 catalog는 Coding Plan 엔드포인트에서 `qwen3.6-plus`를
    표시하지 않지만, `models.providers.qwen.models` 아래에 명시적으로 구성된
    `qwen/qwen3.6-plus` 항목은 Coding Plan baseUrl에서도 존중되므로, Aliyun이 사용자의
    구독에서 해당 모델을 활성화한 경우 opt-in할 수 있습니다. 호출 성공 여부는 여전히
    upstream API가 결정합니다.

  </Accordion>

  <Accordion title="Capability plan">
    `qwen` Plugin은 단순한 코딩/텍스트 모델이 아니라 전체 Qwen Cloud 표면을 위한
    공급업체 홈으로 자리 잡는 중입니다.

    - **텍스트/채팅 모델:** Plugin을 통해 사용 가능
    - **도구 호출, 구조화된 출력, thinking:** OpenAI 호환 transport에서 상속
    - **이미지 생성:** provider-Plugin 계층에서 계획됨
    - **이미지/비디오 이해:** Standard 엔드포인트의 Plugin을 통해 사용 가능
    - **음성/오디오:** provider-Plugin 계층에서 계획됨
    - **메모리 임베딩/reranking:** 임베딩 adapter 표면을 통해 계획됨
    - **비디오 생성:** 공유 비디오 생성 기능을 통해 Plugin에서 사용 가능

  </Accordion>

  <Accordion title="Video generation details">
    비디오 생성의 경우, OpenClaw은 작업을 제출하기 전에 구성된 Qwen 리전을 일치하는
    DashScope AIGC 호스트에 매핑합니다.

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    즉, Coding Plan 또는 Standard Qwen 호스트 중 하나를 가리키는 일반
    `models.providers.qwen.baseUrl`도 비디오 생성을 올바른 리전별 DashScope 비디오
    엔드포인트에 유지합니다.

    현재 Qwen 비디오 생성 제한:

    - 요청당 출력 비디오는 최대 **1**개
    - 입력 이미지는 최대 **1**개
    - 입력 비디오는 최대 **4**개
    - 지속 시간은 최대 **10초**
    - `size`, `aspectRatio`, `resolution`, `audio`, `watermark` 지원
    - 참조 이미지/비디오 모드는 현재 **원격 http(s) URL**이 필요합니다. DashScope 비디오 엔드포인트가
      해당 참조용으로 업로드된 로컬 버퍼를 허용하지 않기 때문에 로컬
      파일 경로는 사전에 거부됩니다.

  </Accordion>

  <Accordion title="스트리밍 사용량 호환성">
    네이티브 Model Studio 엔드포인트는 공유 `openai-completions` 전송에서 스트리밍 사용량 호환성을 알립니다. 이제 OpenClaw는 이를 엔드포인트 기능을 기준으로 판단하므로, 동일한 네이티브 호스트를 대상으로 하는 DashScope 호환 사용자 지정 공급자 ID는 기본 제공 `qwen` 공급자 ID를 특별히 요구하지 않고도 동일한 스트리밍 사용량 동작을 상속합니다.

    네이티브 스트리밍 사용량 호환성은 Coding Plan 호스트와 Standard DashScope 호환 호스트 모두에 적용됩니다.

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="멀티모달 엔드포인트 리전">
    멀티모달 표면(동영상 이해 및 Wan 동영상 생성)은 Coding Plan 엔드포인트가 아니라 **Standard** DashScope 엔드포인트를 사용합니다.

    - 글로벌/Intl Standard 기본 URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - 중국 Standard 기본 URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우, `QWEN_API_KEY`가 해당 프로세스에서 사용할 수 있는지 확인하세요(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조 및 장애 조치 동작 선택.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 동영상 도구 매개변수 및 공급자 선택.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/ko/providers/alibaba" icon="cloud">
    레거시 ModelStudio 공급자 및 마이그레이션 참고 사항.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ.
  </Card>
</CardGroup>
