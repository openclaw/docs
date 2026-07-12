---
read_when:
    - OpenCode에서 호스팅되는 모델에 액세스하려는 경우
    - Zen과 Go 카탈로그 중에서 선택하려는 경우
summary: OpenClaw에서 OpenCode Zen 및 Go 카탈로그 사용하기
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T01:07:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode는 OpenClaw에서 호스팅되는 두 가지 카탈로그를 제공합니다.

| 카탈로그 | 접두사            | 런타임 제공자 |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

두 카탈로그는 하나의 OpenCode API 키(`OPENCODE_API_KEY`, 별칭
`OPENCODE_ZEN_API_KEY`)를 공유합니다. OpenClaw는 업스트림의 모델별 라우팅이
정확하게 유지되도록 런타임 제공자 ID를 분리하지만, 온보딩과 문서에서는 이를
하나의 OpenCode 설정으로 취급합니다.

## 시작하기

<Tabs>
  <Tab title="Zen 카탈로그">
    **권장 용도:** 엄선된 OpenCode 멀티 모델 프록시(Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        또는 키를 직접 전달합니다.

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Zen 모델을 기본값으로 설정">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go 카탈로그">
    **권장 용도:** OpenCode에서 호스팅하는 Kimi, GLM, MiniMax, Qwen 및 DeepSeek 모델군.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        또는 키를 직접 전달합니다.

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Go 모델을 기본값으로 설정">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 설정 예시

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 기본 제공 카탈로그

### Zen

| 속성         | 값                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 런타임 제공자 | `opencode`                                                                                    |
| 모델 예시   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

현재 전체 목록을 보려면 `openclaw models list --provider opencode`를 실행하세요.
이 목록에는 `opencode/big-pickle` 및 `opencode/deepseek-v4-flash-free`와 같은
무료 등급 항목도 포함됩니다.

### Go

| 속성         | 값                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| 런타임 제공자 | `opencode-go`                                                            |
| 모델 예시   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

전체 Go 모델 표는 [OpenCode Go](/ko/providers/opencode-go)를 참조하세요.

## 고급 설정

<AccordionGroup>
  <Accordion title="API 키 별칭">
    `OPENCODE_ZEN_API_KEY`도 `OPENCODE_API_KEY`의 별칭으로 사용할 수 있습니다.
  </Accordion>

  <Accordion title="공유 자격 증명">
    설정 중 OpenCode 키 하나를 입력하면 두 런타임 제공자의 자격 증명이 모두
    저장됩니다. 각 카탈로그를 별도로 온보딩할 필요가 없습니다.
  </Accordion>

  <Accordion title="API 키 발급">
    OpenCode 계정을 만들고 [opencode.ai/auth](https://opencode.ai/auth)에서
    API 키를 생성하세요. 결제 및 카탈로그 사용 가능 여부는 OpenCode 대시보드에서
    관리합니다.
  </Accordion>

  <Accordion title="Gemini 재생 동작">
    Gemini 기반 OpenCode 참조는 프록시 Gemini 경로를 유지하므로, OpenClaw는
    네이티브 Gemini 재생 검증이나 부트스트랩 재작성을 활성화하지 않고 해당
    경로에서 Gemini 사고 서명 정제를 유지합니다.
  </Accordion>

  <Accordion title="Gemini 이외 모델의 재생 동작">
    Gemini 이외의 OpenCode 참조에는 최소한의 OpenAI 호환 재생 정책이 유지됩니다.
  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/ko/providers/opencode-go" icon="server">
    전체 Go 카탈로그 참조 문서입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="설정 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델 및 제공자에 대한 전체 설정 참조 문서입니다.
  </Card>
</CardGroup>
