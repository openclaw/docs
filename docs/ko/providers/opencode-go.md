---
read_when:
    - OpenCode Go 카탈로그를 원함
    - Go 호스팅 모델의 런타임 model ref가 필요함
summary: 공유 OpenCode 설정으로 OpenCode Go 카탈로그 사용
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T18:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go는 [OpenCode](/ko/providers/opencode) 내의 Go 카탈로그입니다.
동일한 `OPENCODE_API_KEY`를 Zen 카탈로그와 함께 사용하지만, 런타임
provider ID는 `opencode-go`를 유지하여 업스트림 모델별 라우팅이 올바르게 유지되도록 합니다.

| 속성            | 값                              |
| ---------------- | ------------------------------- |
| 런타임 provider | `opencode-go`                   |
| 인증            | `OPENCODE_API_KEY`              |
| 상위 설정       | [OpenCode](/ko/providers/opencode) |

## 내장 카탈로그

OpenClaw는 대부분의 Go 카탈로그 항목을 번들된 Pi 모델 레지스트리에서 가져오며,
레지스트리가 최신 상태를 따라잡는 동안 현재 업스트림 항목을 보완합니다.
현재 모델 목록은 `openclaw models list --provider opencode-go`를 실행하세요.

이 provider에는 다음이 포함됩니다:

| Model ref                       | 이름                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (3배 제한)  |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

## 시작하기

<Tabs>
  <Tab title="대화형">
    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Go 모델을 기본값으로 설정">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="모델이 사용 가능한지 확인">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="비대화형">
    <Steps>
      <Step title="키를 직접 전달">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="모델이 사용 가능한지 확인">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Config 예시

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="라우팅 동작">
    model ref가 `opencode-go/...`를 사용할 때 OpenClaw가 모델별 라우팅을
    자동으로 처리합니다. 추가 provider config는 필요하지 않습니다.
  </Accordion>

  <Accordion title="런타임 ref 규칙">
    런타임 ref는 명시적으로 유지됩니다: Zen은 `opencode/...`, Go는 `opencode-go/...`입니다.
    이렇게 하면 두 카탈로그 모두에서 업스트림 모델별 라우팅이 올바르게 유지됩니다.
  </Accordion>

  <Accordion title="공유 자격 증명">
    동일한 `OPENCODE_API_KEY`가 Zen 및 Go 카탈로그 모두에 사용됩니다. 설정 중
    키를 입력하면 두 런타임 provider 모두에 대한 자격 증명이 저장됩니다.
  </Accordion>
</AccordionGroup>

<Tip>
공유 온보딩 개요 및 전체
Zen + Go 카탈로그 참조는 [OpenCode](/ko/providers/opencode)를 참조하세요.
</Tip>

## 관련

<CardGroup cols={2}>
  <Card title="OpenCode(상위)" href="/ko/providers/opencode" icon="server">
    공유 온보딩, 카탈로그 개요 및 고급 참고 사항입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref 및 장애 조치 동작 선택입니다.
  </Card>
</CardGroup>
