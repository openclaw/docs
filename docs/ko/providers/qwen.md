---
read_when:
    - OpenClaw에서 Qwen을 사용하려고 합니다
    - Alibaba Cloud Token Plan 구독이 있습니다
    - 이전에 Qwen OAuth를 사용했습니다
summary: OpenClaw Plugin을 통해 Qwen Cloud 사용하기
title: Qwen
x-i18n:
    generated_at: "2026-07-12T01:08:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud는 정식 외부 OpenClaw 제공자 Plugin이며 정식 ID는 `qwen`입니다. Qwen Cloud / Alibaba DashScope Standard 및 Coding Plan 엔드포인트를 대상으로 하고, Token Plan을 `qwen-token-plan`으로 제공하며, `modelstudio`를 호환성 별칭으로 유지합니다. 또한 Alibaba가 문서화한 `bailian-token-plan` 사용자 지정 제공자 ID를 독립적으로 소유하고, Qwen Portal 토큰 흐름을 [`qwen-oauth`](/ko/providers/qwen-oauth)로 제공합니다.

| 속성                        | 값                                         |
| --------------------------- | ------------------------------------------ |
| 제공자                      | `qwen`                                     |
| Token Plan 제공자           | `qwen-token-plan`                          |
| Portal 제공자               | [`qwen-oauth`](/ko/providers/qwen-oauth)      |
| 권장 환경 변수              | `QWEN_API_KEY`                             |
| Token Plan 환경 변수        | `QWEN_TOKEN_PLAN_API_KEY`                  |
| 추가 허용 항목(호환성)      | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API 방식                    | OpenAI 호환                                |

<Tip>
`qwen3.7-plus`와 `qwen3.6-plus`는 Coding Plan 및 Standard 엔드포인트에서 작동합니다.
`qwen3.7-max` 또는 `qwen3.6-flash`에는 **Standard(종량제)** 엔드포인트를 사용하세요.
</Tip>

## Plugin 설치

`qwen`은 코어에 번들로 포함되지 않은 정식 외부 Plugin으로 제공됩니다. 이를 설치하고 Gateway를 다시 시작하세요.

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 시작하기

요금제 유형을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="Coding Plan(구독)">
    **적합한 용도:** Qwen Coding Plan을 통한 구독 기반 이용.

    <Steps>
      <Step title="API 키 받기">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)에서 API 키를 만들거나 복사하세요.
      </Step>
      <Step title="온보딩 실행">
        **글로벌** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **중국** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="기본 모델 설정">
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
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    기존 `modelstudio-*` 인증 선택 ID와 `modelstudio/...` 모델 참조도 여전히
    호환성 별칭으로 작동하지만, 새 설정 흐름에서는 정식 `qwen-*` 인증 선택
    ID와 `qwen/...` 모델 참조를 사용하는 것이 좋습니다. 다른 `api` 값으로 정확히
    일치하는 사용자 지정 `models.providers.modelstudio` 항목을 정의하면 해당
    사용자 지정 제공자가 Qwen 호환성 별칭 대신 `modelstudio/...` 참조를
    소유합니다.
    </Note>

  </Tab>

  <Tab title="Standard(종량제)">
    **적합한 용도:** Coding Plan에서 사용할 수 없는 `qwen3.7-max` 및 `qwen3.6-flash`를 포함하여 Standard Model Studio 엔드포인트를 통한 종량제 이용.

    <Steps>
      <Step title="API 키 받기">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)에서 API 키를 만들거나 복사하세요.
      </Step>
      <Step title="온보딩 실행">
        **글로벌** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **중국** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="기본 모델 설정">
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
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    기존 `modelstudio-*` 인증 선택 ID와 `modelstudio/...` 모델 참조도 여전히
    호환성 별칭으로 작동하지만, 새 설정 흐름에서는 정식 `qwen-*` 인증 선택
    ID와 `qwen/...` 모델 참조를 사용하는 것이 좋습니다. 다른 `api` 값으로 정확히
    일치하는 사용자 지정 `models.providers.modelstudio` 항목을 정의하면 해당
    사용자 지정 제공자가 Qwen 호환성 별칭 대신 `modelstudio/...` 참조를
    소유합니다.
    </Note>

  </Tab>

  <Tab title="Token Plan(팀 에디션)">
    **적합한 용도:** Alibaba Cloud Model Studio를 통해 Qwen 및 지원되는 타사 모델을 이용하는 크레딧 기반 팀 구독.

    <Steps>
      <Step title="전용 키 받기">
        Token Plan 좌석을 할당하고 전용 `sk-sp-...` 키를 만드세요. Token Plan, Coding Plan 및 종량제 키는 서로 바꿔 사용할 수 없습니다. [글로벌 Token Plan 개요](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) 또는 [중국 Token Plan 개요](https://help.aliyun.com/zh/model-studio/token-plan-overview)를 참조하세요.
      </Step>
      <Step title="온보딩 실행">
        싱가포르의 **글로벌/국제** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        베이징의 **중국** 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="제공자 확인">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    Alibaba의 OpenClaw 가이드는 수동 사용자 지정 제공자에
    `bailian-token-plan`을 사용합니다. Plugin은 해당 ID를 호환성 소유자로
    등록하지만 새 구성에서는 `qwen-token-plan`을 사용해야 합니다. 정확히
    일치하는 사용자 지정 `models.providers.bailian-token-plan` 항목은 구성된
    전송 방식과 카탈로그의 소유권을 유지하며, 정식 OpenAI 카탈로그에 병합되지
    않습니다.
    </Note>

    <Warning>
    Token Plan은 대화형 OpenClaw 세션에만 사용하세요. Cron 작업, 무인 스크립트
    또는 애플리케이션 백엔드에는 선택하지 마세요. Alibaba는 비대화형으로
    사용하면 구독이 중단되거나 API 키가 취소될 수 있다고 명시합니다.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **적합한 용도:** `https://portal.qwen.ai/v1`에 대한 Qwen Portal 토큰.

    전용 제공자 페이지와 마이그레이션 참고 사항은 [Qwen OAuth / Portal](/ko/providers/qwen-oauth)을
    참조하세요.

    <Steps>
      <Step title="Portal 토큰 제공">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="기본 모델 설정">
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
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth`는 Qwen Cloud 제공자와 동일한 `QWEN_API_KEY` 환경 변수 이름을
    사용하지만, OpenClaw 온보딩을 통해 구성할 때 인증을 `qwen-oauth` 제공자
    ID 아래에 저장합니다.
    </Note>

  </Tab>
</Tabs>

## 요금제 유형 및 엔드포인트

| 요금제                     | 지역     | 인증 선택                    | 엔드포인트                                                       |
| -------------------------- | -------- | ---------------------------- | ---------------------------------------------------------------- |
| Coding Plan(구독)          | 중국     | `qwen-api-key-cn`            | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan(구독)          | 글로벌   | `qwen-api-key`               | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                | 글로벌   | `qwen-oauth`                 | `portal.qwen.ai/v1`                                              |
| Standard(종량제)           | 중국     | `qwen-standard-api-key-cn`   | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard(종량제)           | 글로벌   | `qwen-standard-api-key`      | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan(팀 에디션)      | 중국     | `qwen-token-plan-cn`         | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan(팀 에디션)      | 글로벌   | `qwen-token-plan`            | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

제공자는 인증 선택에 따라 엔드포인트를 자동으로 선택합니다. 정식 선택 항목은
`qwen-*` 계열을 사용하며, `modelstudio-*`는 호환성 용도로만 유지됩니다.
구성에서 사용자 지정 `baseUrl`을 사용하여 재정의할 수 있습니다.

<Tip>
**키 관리:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**문서:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 기본 제공 카탈로그

OpenClaw는 다음 Qwen 정적 카탈로그를 제공합니다. 카탈로그는 엔드포인트를
인식하므로 Coding Plan 구성에서는 Standard 엔드포인트에서만 작동하는 모델을
제외합니다.

| 모델 참조                   | 입력           | 컨텍스트  | 참고 사항                  |
| --------------------------- | -------------- | --------- | -------------------------- |
| `qwen/qwen3.5-plus`         | 텍스트, 이미지 | 1,000,000 | 기본 모델                  |
| `qwen/qwen3.6-flash`        | 텍스트, 이미지 | 1,000,000 | Standard 엔드포인트 전용   |
| `qwen/qwen3.6-plus`         | 텍스트, 이미지 | 1,000,000 | Coding Plan + Standard     |
| `qwen/qwen3.7-max`          | 텍스트         | 1,000,000 | Standard 엔드포인트 전용   |
| `qwen/qwen3.7-plus`         | 텍스트, 이미지 | 1,000,000 | Coding Plan + Standard     |
| `qwen/qwen3-max-2026-01-23` | 텍스트         | 262,144   | Qwen Max 계열              |
| `qwen/qwen3-coder-next`     | 텍스트         | 262,144   | 코딩                       |
| `qwen/qwen3-coder-plus`     | 텍스트         | 1,000,000 | 코딩                       |
| `qwen/MiniMax-M2.5`         | 텍스트         | 1,000,000 | 추론 활성화                |
| `qwen/glm-5`                | 텍스트         | 202,752   | GLM                        |
| `qwen/glm-4.7`              | 텍스트         | 202,752   | GLM                        |
| `qwen/kimi-k2.5`            | 텍스트, 이미지 | 262,144   | Alibaba를 통한 Moonshot AI |
| `qwen-oauth/qwen3.5-plus`   | 텍스트, 이미지 | 1,000,000 | Qwen Portal 기본값         |

<Note>
모델이 정적 카탈로그에 있어도 엔드포인트와 결제 요금제에 따라 사용 가능 여부가
달라질 수 있습니다.
</Note>

### Token Plan 카탈로그

Token Plan은 별도의 정확한 문자열 허용 목록을 사용합니다. 이미지 생성 전용
요금제 모델은 서로 다른 API를 사용하므로 여기에 포함되지 않습니다.

| 모델 참조                           | 입력           | 컨텍스트  |
| ----------------------------------- | -------------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | 텍스트         | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | 텍스트, 이미지 | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | 텍스트, 이미지 | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | 텍스트, 이미지 | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | 텍스트         | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | 텍스트         | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | 텍스트         | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | 텍스트, 이미지 | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | 텍스트, 이미지 | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | 텍스트, 이미지 | 262,144   |
| `qwen-token-plan/glm-5.2`           | 텍스트         | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | 텍스트         | 202,752   |
| `qwen-token-plan/glm-5`             | 텍스트         | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | 텍스트         | 196,608   |

## 사고 제어

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash`, `qwen3.6-plus`는 기본 제공 카탈로그에서 추론이 활성화되어 있습니다. `qwen` 계열의 추론 모델에 대해 공급자는 OpenClaw 사고 수준을 DashScope의 최상위 `enable_thinking` 요청 플래그에 매핑합니다. 사고가 비활성화되면 `enable_thinking: false`를 전송하고, 그 외의 모든 수준에서는 `enable_thinking: true`를 전송합니다. 사용자 지정 모델은 모델 항목에 `compat.thinkingFormat: "qwen-chat-template"`을 설정하여 대체 채팅 템플릿 사고 페이로드를 사용하도록 선택할 수 있습니다.

Token Plan 모델도 추론 가능 모델로 표시됩니다. `kimi-k2.7-code`와 `MiniMax-M2.5`는 사고 전용이므로 세션에서 `/think off`를 요청해도 OpenClaw는 사고를 활성화된 상태로 유지합니다. DeepSeek V4는 `minimal`부터 `high`까지를 서비스의 `high` 노력 수준에 매핑하고, `xhigh` 또는 `max`는 `max`에 매핑합니다. GLM 5.2는 `minimal`부터 `max`까지의 전체 범위를 허용합니다. GLM 5.1과 GLM 5는 `xhigh`까지 허용하며, 세 모델 모두 기본값은 `high`입니다. 그 밖의 하이브리드 모델은 요청된 켜짐/꺼짐 상태를 따릅니다.

## 멀티모달 추가 기능

`qwen` Plugin은 Coding Plan 엔드포인트가 아닌 **Standard** DashScope 엔드포인트에서만 멀티모달 기능을 제공합니다.

- `qwen-vl-max-latest`를 통한 **이미지 및 동영상 이해**
- `wan2.6-t2v`(기본값), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`를 통한 **Wan 동영상 생성**

미디어 이해 기능은 구성된 Qwen 인증에서 자동으로 확인되므로 추가 구성이 필요하지 않습니다. 미디어 이해 기능을 사용하려면 Standard(사용량 기반 요금제) 엔드포인트를 사용하고 있는지 확인하세요.

Qwen을 기본 동영상 공급자로 설정하려면 다음과 같이 구성합니다.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

동영상 생성 제한 사항: 요청당 출력 동영상 1개, 입력 이미지 최대 1개(이미지-동영상 변환), 입력 동영상 최대 4개(동영상-동영상 변환), 최대 길이 10초입니다. `size`, `aspectRatio`, `resolution`, `audio`, `watermark`를 지원합니다. 참조 이미지/동영상 입력에는 원격 http(s) URL이 필요합니다. DashScope 동영상 엔드포인트는 이러한 참조에 업로드된 로컬 버퍼를 허용하지 않으므로 로컬 파일 경로는 요청 전에 거부됩니다.

<Note>
공통 도구 매개변수, 공급자 선택 및 장애 조치 동작은 [동영상 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="Qwen 3.6 및 3.7 사용 가능 여부">
    `qwen3.7-plus`와 `qwen3.6-plus`는 Coding Plan 및 Standard 엔드포인트에서 사용할 수 있습니다. `qwen3.7-max`와 `qwen3.6-flash`는 Standard에서만 사용할 수 있습니다. Standard(사용량 기반 요금제) 엔드포인트는 다음과 같습니다.

    - 중국: `dashscope.aliyuncs.com/compatible-mode/v1`
    - 글로벌: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw는 Coding Plan 카탈로그에서 `qwen3.7-max`와 `qwen3.6-flash`를 제외합니다.
    Coding Plan 엔드포인트에서 두 모델 중 하나에 대해 "지원되지 않는 모델" 오류가 반환되면 해당하는 Standard 엔드포인트와 키로 전환하세요.

  </Accordion>

  <Accordion title="동영상 생성 리전 라우팅">
    OpenClaw는 동영상 작업을 제출하기 전에 구성된 Qwen 리전을 해당 DashScope AIGC 호스트에 매핑합니다.

    - 글로벌/국제: `https://dashscope-intl.aliyuncs.com`
    - 중국: `https://dashscope.aliyuncs.com`

    Coding Plan 또는 Standard Qwen 호스트 중 하나를 가리키는 일반적인 `models.providers.qwen.baseUrl`도 동영상 생성을 해당 리전의 DashScope 동영상 엔드포인트로 라우팅합니다.

  </Accordion>

  <Accordion title="스트리밍 사용량 호환성">
    네이티브 Qwen 엔드포인트는 공유 `openai-completions` 전송 계층에서 스트리밍 사용량 호환성을 명시하므로, 동일한 네이티브 호스트를 대상으로 하는 DashScope 호환 사용자 지정 공급자 ID는 기본 제공 `qwen` 공급자 ID를 별도로 요구하지 않고도 동일한 동작을 상속합니다. 이는 Coding Plan, Standard 및 Token Plan 엔드포인트에 적용됩니다.

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="기능 계획">
    `qwen` Plugin은 코딩/텍스트 모델뿐 아니라 전체 Qwen Cloud 기능을 담당하는 공급자 기반으로 자리매김하고 있습니다.

    - **텍스트/채팅 모델:** Plugin을 통해 사용 가능
    - **도구 호출, 구조화된 출력, 사고:** OpenAI 호환 전송 계층에서 상속
    - **이미지 생성:** 공급자 Plugin 계층에서 지원 예정
    - **이미지/동영상 이해:** Standard 엔드포인트의 Plugin을 통해 사용 가능
    - **음성/오디오:** 공급자 Plugin 계층에서 지원 예정
    - **메모리 임베딩/재순위화:** 임베딩 어댑터 기능을 통해 지원 예정
    - **동영상 생성:** 공유 동영상 생성 기능을 통해 Plugin에서 사용 가능

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 해당 프로세스에서 `QWEN_API_KEY` 또는 `QWEN_TOKEN_PLAN_API_KEY`를 사용할 수 있는지 확인하세요(예: `~/.openclaw/.env` 또는 `env.shellEnv` 사용).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 동영상 도구 매개변수 및 공급자 선택입니다.
  </Card>
  <Card title="Alibaba Model Studio" href="/ko/providers/alibaba" icon="cloud">
    동일한 DashScope 플랫폼에 기본 제공되는 Wan 동영상 생성 공급자입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 자주 묻는 질문입니다.
  </Card>
</CardGroup>
