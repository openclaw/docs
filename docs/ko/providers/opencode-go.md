---
read_when:
    - OpenCode Go 카탈로그를 사용하고 싶습니다.
    - Go 호스팅 모델의 런타임 모델 ref가 필요합니다.
summary: 공유 OpenCode 설정으로 OpenCode Go 카탈로그 사용하기
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-12T23:31:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f0f182de81729616ccc19125d93ba0445de2349daf7067b52e8c15b9d3539c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go는 [OpenCode](/ko/providers/opencode) 내의 Go 카탈로그입니다.
Zen 카탈로그와 동일한 `OPENCODE_API_KEY`를 사용하지만, 업스트림 모델별 라우팅이 올바르게 유지되도록 런타임 provider ID는 `opencode-go`를 유지합니다.

| 속성             | 값                              |
| ---------------- | ------------------------------- |
| 런타임 provider  | `opencode-go`                   |
| 인증             | `OPENCODE_API_KEY`              |
| 상위 설정        | [OpenCode](/ko/providers/opencode) |

## 지원되는 모델

| 모델 ref                  | 이름         |
| -------------------------- | ------------ |
| `opencode-go/kimi-k2.5`    | Kimi K2.5    |
| `opencode-go/glm-5`        | GLM 5        |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 |

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

  <Tab title="비대화형">
    <Steps>
      <Step title="키를 직접 전달">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## 고급 참고 사항

<AccordionGroup>
  <Accordion title="라우팅 동작">
    모델 ref가 `opencode-go/...`를 사용할 때 OpenClaw가 모델별 라우팅을 자동으로 처리합니다. 추가 provider 구성은 필요하지 않습니다.
  </Accordion>

  <Accordion title="런타임 ref 규칙">
    런타임 ref는 명시적으로 유지됩니다: Zen은 `opencode/...`, Go는 `opencode-go/...`.
    이렇게 하면 두 카탈로그 모두에서 업스트림 모델별 라우팅이 올바르게 유지됩니다.
  </Accordion>

  <Accordion title="공유 자격 증명">
    Zen과 Go 카탈로그 모두 동일한 `OPENCODE_API_KEY`를 사용합니다. 설정 중에 키를 입력하면 두 런타임 provider에 대한 자격 증명이 함께 저장됩니다.
  </Accordion>
</AccordionGroup>

<Tip>
공유 온보딩 개요와 전체 Zen + Go 카탈로그 참조는 [OpenCode](/ko/providers/opencode)를 참고하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="OpenCode (상위)" href="/ko/providers/opencode" icon="server">
    공유 온보딩, 카탈로그 개요, 고급 참고 사항.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 ref, 장애 조치 동작을 선택합니다.
  </Card>
</CardGroup>
