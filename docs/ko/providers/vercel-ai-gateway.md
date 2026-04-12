---
read_when:
    - OpenClaw에서 Vercel AI Gateway를 사용하려고 합니다
    - API 키 환경 변수 또는 CLI 인증 선택지가 필요합니다
summary: Vercel AI Gateway 설정(인증 + 모델 선택)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:33:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48c206a645d7a62e201a35ae94232323c8570fdae63129231c38d363ea78a60b
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway)는 단일 엔드포인트를 통해 수백 개의 모델에 접근할 수 있는 통합 API를 제공합니다.

| 속성 | 값 |
| ------------- | -------------------------------- |
| Provider | `vercel-ai-gateway` |
| 인증 | `AI_GATEWAY_API_KEY` |
| API | Anthropic Messages 호환 |
| 모델 카탈로그 | `/v1/models`를 통해 자동 검색 |

<Tip>
OpenClaw는 Gateway `/v1/models` 카탈로그를 자동으로 검색하므로, `/models vercel-ai-gateway`에는 `vercel-ai-gateway/openai/gpt-5.4` 같은 현재 모델 참조가 포함됩니다.
</Tip>

## 시작하기

<Steps>
  <Step title="API 키 설정">
    온보딩을 실행하고 AI Gateway 인증 옵션을 선택하세요:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="기본 모델 설정">
    OpenClaw config에 모델을 추가하세요:

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

스크립트 또는 CI 설정에서는 모든 값을 명령줄로 전달하세요:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 모델 ID 단축 표기

OpenClaw는 Vercel Claude 단축 모델 참조를 허용하고 런타임에 이를 정규화합니다:

| 단축 입력 | 정규화된 모델 참조 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
구성에서는 단축형이나 완전 수식 모델 참조 중 어느 쪽이든 사용할 수 있습니다. OpenClaw가 정식 형식을 자동으로 해석합니다.
</Tip>

## 고급 참고 사항

<AccordionGroup>
  <Accordion title="데몬 프로세스를 위한 환경 변수">
    OpenClaw Gateway가 데몬(launchd/systemd)으로 실행되면 `AI_GATEWAY_API_KEY`가 해당 프로세스에서 사용 가능하도록 해야 합니다.

    <Warning>
    `~/.profile`에만 설정된 키는 해당 환경을 명시적으로 가져오지 않는 한 launchd/systemd 데몬에서는 보이지 않습니다. gateway 프로세스가 키를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하세요.
    </Warning>

  </Accordion>

  <Accordion title="Provider 라우팅">
    Vercel AI Gateway는 모델 참조 접두사에 따라 요청을 업스트림 provider로 라우팅합니다. 예를 들어 `vercel-ai-gateway/anthropic/claude-opus-4.6`은 Anthropic를 통해 라우팅되고, `vercel-ai-gateway/openai/gpt-5.4`는 OpenAI를 통해 라우팅됩니다. 단일 `AI_GATEWAY_API_KEY`로 모든 업스트림 provider에 대한 인증을 처리합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 장애 조치 동작 선택하기.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ.
  </Card>
</CardGroup>
