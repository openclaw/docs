---
read_when:
    - OpenCode 호스팅 모델 액세스를 사용하려고 합니다
    - Zen 및 Go 카탈로그 중에서 선택하려고 합니다
summary: OpenClaw에서 OpenCode Zen 및 Go 카탈로그 사용하기
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T06:09:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode는 OpenClaw에서 두 가지 호스팅 카탈로그를 제공합니다:

| 카탈로그 | 접두사            | 런타임 provider |
| -------- | ----------------- | ---------------- |
| **Zen**  | `opencode/...`    | `opencode`       |
| **Go**   | `opencode-go/...` | `opencode-go`    |

두 카탈로그 모두 동일한 OpenCode API 키를 사용합니다. OpenClaw는 업스트림 모델별 라우팅이 올바르게 유지되도록 런타임 provider id를
분리해 두지만, 온보딩과 문서에서는 이를 하나의 OpenCode setup으로 취급합니다.

## 시작하기

<Tabs>
  <Tab title="Zen 카탈로그">
    **적합한 경우:** 엄선된 OpenCode 멀티 모델 프록시(Claude, GPT, Gemini).

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        또는 키를 직접 전달합니다:

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
    **적합한 경우:** OpenCode가 호스팅하는 Kimi, GLM, MiniMax 라인업.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        또는 키를 직접 전달합니다:

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

## config 예시

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 내장 카탈로그

### Zen

| 속성             | 값                                                                      |
| ---------------- | ----------------------------------------------------------------------- |
| 런타임 provider  | `opencode`                                                              |
| 예시 모델        | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| 속성             | 값                                                                       |
| ---------------- | ------------------------------------------------------------------------ |
| 런타임 provider  | `opencode-go`                                                            |
| 예시 모델        | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 고급 구성

<AccordionGroup>
  <Accordion title="API 키 별칭">
    `OPENCODE_ZEN_API_KEY`도 `OPENCODE_API_KEY`의 별칭으로 지원됩니다.
  </Accordion>

  <Accordion title="공유 자격 증명">
    setup 중에 하나의 OpenCode 키를 입력하면 두 런타임
    provider 모두에 대한 자격 증명이 저장됩니다. 각 카탈로그를 따로 온보딩할 필요는 없습니다.
  </Accordion>

  <Accordion title="청구 및 대시보드">
    OpenCode에 로그인하고 청구 정보를 추가한 뒤 API 키를 복사합니다. 청구
    및 카탈로그 가용성은 OpenCode 대시보드에서 관리됩니다.
  </Accordion>

  <Accordion title="Gemini 재생 동작">
    Gemini 기반 OpenCode ref는 프록시-Gemini 경로에 유지되므로, OpenClaw는
    네이티브 Gemini 재생 검증이나 bootstrap 재작성을 활성화하지 않고도 그 경로에서
    Gemini thought-signature 정리를 유지합니다.
  </Accordion>

  <Accordion title="비-Gemini 재생 동작">
    비-Gemini OpenCode ref는 최소 OpenAI 호환 재생 정책을 유지합니다.
  </Accordion>
</AccordionGroup>

<Tip>
setup 중에 하나의 OpenCode 키를 입력하면 Zen 및
Go 런타임 provider 모두에 대한 자격 증명이 저장되므로 한 번만 온보딩하면 됩니다.
</Tip>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택하기.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, provider에 대한 전체 config 참조.
  </Card>
</CardGroup>
