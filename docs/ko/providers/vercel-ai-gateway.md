---
read_when:
    - OpenClaw와 함께 Vercel AI Gateway를 사용하려는 경우
    - API 키 환경 변수 또는 CLI 인증 선택 항목이 필요합니다
summary: Vercel AI Gateway 설정(인증 + 모델 선택)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-30T06:48:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway)는 단일 엔드포인트를 통해
수백 개의 모델에 접근할 수 있는 통합 API를 제공합니다.

| 속성          | 값                               |
| ------------- | -------------------------------- |
| 제공자        | `vercel-ai-gateway`              |
| 인증          | `AI_GATEWAY_API_KEY`             |
| API           | Anthropic Messages 호환          |
| 모델 카탈로그 | `/v1/models`를 통해 자동 발견됨  |

<Tip>
OpenClaw는 Gateway `/v1/models` 카탈로그를 자동으로 발견하므로
`/models vercel-ai-gateway`에는
`vercel-ai-gateway/openai/gpt-5.5` 및
`vercel-ai-gateway/moonshotai/kimi-k2.6` 같은 현재 모델 참조가 포함됩니다.
</Tip>

## 시작하기

<Steps>
  <Step title="API 키 설정">
    온보딩을 실행하고 AI Gateway 인증 옵션을 선택합니다.

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="기본 모델 설정">
    OpenClaw 구성에 모델을 추가합니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 비대화형 예시

스크립트 또는 CI 설정의 경우 명령줄에서 모든 값을 전달합니다.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 모델 ID 축약형

OpenClaw는 Vercel Claude 축약형 모델 참조를 허용하며 런타임에
정규화합니다.

| 축약 입력                           | 정규화된 모델 참조                            |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
구성에서 축약형 또는 전체 한정 모델 참조를 사용할 수 있습니다.
OpenClaw가 표준 형식을 자동으로 해석합니다.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="데몬 프로세스용 환경 변수">
    OpenClaw Gateway가 데몬(launchd/systemd)으로 실행되는 경우
    해당 프로세스에서 `AI_GATEWAY_API_KEY`를 사용할 수 있는지 확인합니다.

    <Warning>
    `~/.profile`에만 설정된 키는 해당 환경을 명시적으로 가져오지 않는 한
    launchd/systemd 데몬에 표시되지 않습니다. Gateway 프로세스가 키를
    읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정합니다.
    </Warning>

  </Accordion>

  <Accordion title="제공자 라우팅">
    Vercel AI Gateway는 모델 참조 접두사를 기준으로 요청을 업스트림 제공자로
    라우팅합니다. 예를 들어 `vercel-ai-gateway/anthropic/claude-opus-4.6`은
    Anthropic을 통해 라우팅되고, `vercel-ai-gateway/openai/gpt-5.5`는
    OpenAI를 통해, `vercel-ai-gateway/moonshotai/kimi-k2.6`은
    MoonshotAI를 통해 라우팅됩니다. 단일 `AI_GATEWAY_API_KEY`가 모든
    업스트림 제공자의 인증을 처리합니다.
  </Accordion>
  <Accordion title="Thinking 수준">
    OpenClaw가 업스트림 제공자 계약을 알고 있는 경우 `/think` 옵션은 신뢰할 수 있는
    업스트림 모델 접두사를 따릅니다. `vercel-ai-gateway/anthropic/...`은
    Claude 4.6 모델의 적응형 기본값을 포함한 Claude thinking 프로필을 사용합니다.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5`, Codex 스타일 참조는
    직접 OpenAI/OpenAI Codex 제공자와 마찬가지로 `/think xhigh`를 노출합니다.
    다른 네임스페이스 참조는 해당 카탈로그 메타데이터가 더 많은 항목을 선언하지 않는 한
    일반 reasoning 수준을 유지합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ.
  </Card>
</CardGroup>
