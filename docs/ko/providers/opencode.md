---
read_when:
    - OpenCode 호스팅 모델 액세스를 원함
    - Zen과 Go 카탈로그 중에서 선택하려고 합니다
summary: OpenClaw에서 OpenCode Zen 및 Go 카탈로그 사용하기
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:44:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode는 OpenClaw에서 두 개의 호스팅 카탈로그를 제공합니다:

| 카탈로그 | 접두사            | 런타임 제공자 |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

두 카탈로그 모두 같은 OpenCode API 키를 사용합니다. OpenClaw는 업스트림 모델별 라우팅이 올바르게 유지되도록 런타임 제공자 ID를
분리해 두지만, 온보딩과 문서에서는 이를 하나의 OpenCode 설정으로 다룹니다.

## 시작하기

<Tabs>
  <Tab title="Zen catalog">
    **가장 적합한 용도:** 엄선된 OpenCode 멀티 모델 프록시(Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        또는 키를 직접 전달합니다:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **가장 적합한 용도:** OpenCode가 호스팅하는 Kimi, GLM, MiniMax 라인업.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        또는 키를 직접 전달합니다:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
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
| 예시 모델   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| 속성         | 값                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| 런타임 제공자 | `opencode-go`                                                            |
| 예시 모델   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 고급 설정

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY`도 `OPENCODE_API_KEY`의 별칭으로 지원됩니다.
  </Accordion>

  <Accordion title="Shared credentials">
    설정 중 OpenCode 키 하나를 입력하면 두 런타임
    제공자의 자격 증명이 저장됩니다. 각 카탈로그를 따로 온보딩할 필요가 없습니다.
  </Accordion>

  <Accordion title="Billing and dashboard">
    OpenCode에 로그인하고 결제 세부 정보를 추가한 뒤 API 키를 복사합니다. 결제
    및 카탈로그 사용 가능 여부는 OpenCode 대시보드에서 관리됩니다.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Gemini 기반 OpenCode 참조는 프록시-Gemini 경로에 유지되므로, OpenClaw는
    네이티브 Gemini 리플레이 검증이나 부트스트랩 재작성을 활성화하지 않고 그곳에서
    Gemini 생각 서명 정리를 유지합니다.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    Gemini가 아닌 OpenCode 참조는 최소한의 OpenAI 호환 리플레이 정책을 유지합니다.
  </Accordion>
</AccordionGroup>

<Tip>
설정 중 OpenCode 키 하나를 입력하면 Zen 및
Go 런타임 제공자 모두의 자격 증명이 저장되므로, 온보딩은 한 번만 하면 됩니다.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, 제공자를 위한 전체 설정 참조.
  </Card>
</CardGroup>
