---
read_when:
    - OpenClaw에서 Vercel AI Gateway를 사용하려고 합니다
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다.
summary: Vercel AI Gateway 설정(인증 + 모델 선택)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-07-12T15:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway)는 단일 엔드포인트를 통해
수백 개의 모델에 액세스할 수 있는 통합 API를 제공합니다.

| 속성          | 값                                     |
| ------------- | -------------------------------------- |
| 제공자        | `vercel-ai-gateway`                    |
| 패키지        | `@openclaw/vercel-ai-gateway-provider` |
| 인증          | `AI_GATEWAY_API_KEY`                   |
| API           | Anthropic Messages 호환                |
| 기본 URL      | `https://ai-gateway.vercel.sh`         |
| 모델 카탈로그 | `/v1/models`를 통해 자동 검색          |

<Tip>
OpenClaw는 Gateway의 `/v1/models` 카탈로그를 자동으로 검색하므로,
`/models vercel-ai-gateway` 채팅 명령과
`openclaw models list --provider vercel-ai-gateway` 모두
`vercel-ai-gateway/openai/gpt-5.5` 및
`vercel-ai-gateway/moonshotai/kimi-k2.6`와 같은 현재 모델 참조를 포함합니다.
</Tip>

## 시작하기

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="기본 모델 설정">
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

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 모델 ID 축약형

OpenClaw는 런타임에 Claude 축약형 모델 참조를 정규화합니다.

| 축약형 입력                         | 정규화된 모델 참조                           |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
구성에서 어느 형식이든 사용할 수 있으며, OpenClaw가 정식
`anthropic/...` 참조를 자동으로 확인합니다.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="데몬 프로세스용 환경 변수">
    OpenClaw Gateway가 데몬(launchd/systemd)으로 실행되는 경우 해당 프로세스에서
    `AI_GATEWAY_API_KEY`를 사용할 수 있는지 확인하십시오.

    <Warning>
    대화형 셸에서만 내보낸 키는 해당 환경을 명시적으로 가져오지 않는 한
    launchd/systemd 데몬에 표시되지 않습니다. Gateway 프로세스가 키를
    읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하십시오.
    </Warning>

  </Accordion>

  <Accordion title="제공자 라우팅">
    Vercel AI Gateway는 모델 참조 접두사에 지정된 업스트림 제공자로 각 요청을
    라우팅합니다. 예를 들어 `vercel-ai-gateway/anthropic/claude-opus-4.6`은
    Anthropic을 통해 라우팅되고, `vercel-ai-gateway/openai/gpt-5.5`는 OpenAI를
    통해 라우팅되며, `vercel-ai-gateway/moonshotai/kimi-k2.6`은 MoonshotAI를
    통해 라우팅됩니다. 하나의 `AI_GATEWAY_API_KEY`로 모든 업스트림 제공자를 인증합니다.
  </Accordion>
  <Accordion title="사고 수준">
    OpenClaw가 업스트림 모델 접두사를 인식하는 경우 `/think` 옵션은 해당 접두사를
    따릅니다. `vercel-ai-gateway/anthropic/...`은 Claude 4.6 모델의 적응형
    기본값을 포함한 Claude 사고 프로필을 사용합니다. 신뢰할 수 있는
    `vercel-ai-gateway/openai/...` 참조(`gpt-5.2` 이상 및
    `gpt-5.1-codex`까지의 Codex 변형)는 `/think xhigh`를 제공합니다. 다른
    네임스페이스 참조는 카탈로그 메타데이터에서 더 많은 수준을 선언하지 않는 한
    표준 추론 수준을 유지합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 방법과 자주 묻는 질문입니다.
  </Card>
</CardGroup>
