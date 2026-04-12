---
read_when:
    - OpenCode 호스팅 모델에 접근하고 싶습니다.
    - Zen 카탈로그와 Go 카탈로그 중에서 선택하고 싶습니다.
summary: OpenClaw에서 OpenCode Zen 및 Go 카탈로그 사용하기
title: OpenCode
x-i18n:
    generated_at: "2026-04-12T23:32:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a68444d8c403c3caba4a18ea47f078c7a4c163f874560e1fad0e818afb6e0e60
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode는 OpenClaw에서 두 가지 호스팅 카탈로그를 제공합니다.

| 카탈로그 | 접두사            | 런타임 provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

두 카탈로그는 동일한 OpenCode API 키를 사용합니다. OpenClaw는 업스트림 모델별 라우팅이 올바르게 유지되도록 런타임 provider ID를 분리해서 유지하지만, 온보딩과 문서에서는 이를 하나의 OpenCode 설정으로 다룹니다.

## 시작하기

<Tabs>
  <Tab title="Zen 카탈로그">
    **가장 적합한 용도:** 선별된 OpenCode 멀티모델 프록시(Claude, GPT, Gemini)

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        또는 키를 직접 전달하세요:

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
    **가장 적합한 용도:** OpenCode 호스팅 Kimi, GLM, MiniMax 라인업

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        또는 키를 직접 전달하세요:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Go 모델을 기본값으로 설정">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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

## 구성 예시

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 카탈로그

### Zen

| 속성             | 값                                                                      |
| ---------------- | ----------------------------------------------------------------------- |
| 런타임 provider  | `opencode`                                                              |
| 예시 모델        | `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro` |

### Go

| 속성             | 값                                                                       |
| ---------------- | ------------------------------------------------------------------------ |
| 런타임 provider  | `opencode-go`                                                            |
| 예시 모델        | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 고급 참고 사항

<AccordionGroup>
  <Accordion title="API 키 별칭">
    `OPENCODE_ZEN_API_KEY`도 `OPENCODE_API_KEY`의 별칭으로 지원됩니다.
  </Accordion>

  <Accordion title="공유 자격 증명">
    설정 중 하나의 OpenCode 키를 입력하면 두 런타임 provider 모두에 대한 자격 증명이 저장됩니다. 각 카탈로그를 따로 온보딩할 필요는 없습니다.
  </Accordion>

  <Accordion title="과금 및 대시보드">
    OpenCode에 로그인하고, 결제 정보를 추가한 뒤, API 키를 복사하면 됩니다. 과금과 카탈로그 사용 가능 여부는 OpenCode 대시보드에서 관리됩니다.
  </Accordion>

  <Accordion title="Gemini 재생 동작">
    Gemini 기반 OpenCode ref는 프록시-Gemini 경로에 머무르므로, OpenClaw는 거기에서 Gemini thought-signature 정리를 유지하지만 기본 Gemini 재생 검증이나 bootstrap 재작성은 활성화하지 않습니다.
  </Accordion>

  <Accordion title="비-Gemini 재생 동작">
    비-Gemini OpenCode ref는 최소한의 OpenAI 호환 재생 정책을 유지합니다.
  </Accordion>
</AccordionGroup>

<Tip>
설정 중 하나의 OpenCode 키를 입력하면 Zen 및 Go 런타임 provider 모두에 대한 자격 증명이 저장되므로, 온보딩은 한 번만 하면 됩니다.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 ref, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, provider에 대한 전체 구성 참조.
  </Card>
</CardGroup>
