---
read_when:
    - OpenClaw에서 DeepSeek를 사용하고 싶습니다
    - API 키 환경 변수 또는 CLI 인증 선택지가 필요합니다
summary: DeepSeek 설정(인증 + 모델 선택)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-12T23:30:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad06880bd1ab89f72f9e31f4927e2c099dcf6b4e0ff2b3fcc91a24468fbc089d
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com)는 OpenAI 호환 API를 갖춘 강력한 AI 모델을 제공합니다.

| Property | Value                      |
| -------- | -------------------------- |
| Provider | `deepseek`                 |
| Auth     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI 호환                |
| Base URL | `https://api.deepseek.com` |

## 시작하기

<Steps>
  <Step title="API 키 가져오기">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    이렇게 하면 API 키 입력을 요청하고 `deepseek/deepseek-chat`을 기본 모델로 설정합니다.

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="비대화형 설정">
    스크립트 또는 headless 설치의 경우, 모든 플래그를 직접 전달하세요.

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gateway가 데몬(launchd/systemd)으로 실행되는 경우, 해당 프로세스에서 `DEEPSEEK_API_KEY`를 사용할 수 있어야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`).
</Warning>

## 기본 제공 카탈로그

| Model ref                    | Name              | 입력 | 컨텍스트 | 최대 출력 | 참고                                              |
| ---------------------------- | ----------------- | ---- | -------- | --------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text | 131,072  | 8,192     | 기본 모델; DeepSeek V3.2 비thinking 표면          |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072  | 65,536    | reasoning 활성화된 V3.2 표면                      |

<Tip>
현재 두 번들 모델 모두 소스에서 스트리밍 사용 호환성을 제공하는 것으로 표시됩니다.
</Tip>

## 구성 예시

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, provider에 대한 전체 구성 참조입니다.
  </Card>
</CardGroup>
