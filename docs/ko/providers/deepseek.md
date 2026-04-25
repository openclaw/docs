---
read_when:
    - OpenClaw에서 DeepSeek를 사용하려고 합니다
    - API 키 env var 또는 CLI 인증 선택이 필요합니다
summary: DeepSeek 설정(인증 + 모델 선택)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T06:08:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com)는 OpenAI 호환 API를 갖춘 강력한 AI 모델을 제공합니다.

| 속성 | 값                         |
| ---- | -------------------------- |
| 프로바이더 | `deepseek`         |
| 인증 | `DEEPSEEK_API_KEY`         |
| API  | OpenAI 호환                 |
| Base URL | `https://api.deepseek.com` |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys)에서 API 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    그러면 API 키를 입력하라는 프롬프트가 표시되고, 기본 모델로 `deepseek/deepseek-v4-flash`가 설정됩니다.

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider deepseek
    ```

    실행 중인 Gateway 없이 번들된 정적 카탈로그를 확인하려면 다음을 사용하세요:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="비대화형 설정">
    스크립트 기반 또는 헤드리스 설치의 경우, 모든 플래그를 직접 전달하세요:

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
Gateway가 데몬(launchd/systemd)으로 실행된다면, `DEEPSEEK_API_KEY`가
해당 프로세스에서 사용 가능해야 합니다(예: `~/.openclaw/.env` 또는
`env.shellEnv`를 통해).
</Warning>

## 내장 카탈로그

| 모델 ref                    | 이름              | 입력  | 컨텍스트 | 최대 출력 | 참고                                         |
| ---------------------------- | ----------------- | ----- | -------- | --------- | -------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000   | 기본 모델, V4 thinking 지원 표면             |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000   | V4 thinking 지원 표면                        |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072  | 8,192     | DeepSeek V3.2 비-thinking 표면               |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072  | 65,536    | reasoning 활성화 V3.2 표면                   |

<Tip>
V4 모델은 DeepSeek의 `thinking` 제어를 지원합니다. OpenClaw는 또한
후속 턴에서 DeepSeek `reasoning_content`를 재생하므로, 도구 호출이 포함된 thinking 세션도 계속 진행할 수 있습니다.
</Tip>

## Thinking 및 도구

DeepSeek V4 thinking 세션은 대부분의 OpenAI 호환 프로바이더보다 더 엄격한 replay 계약을 가집니다. thinking이 활성화된 어시스턴트 메시지에 도구 호출이 포함된 경우, DeepSeek는 후속 요청에서 이전 어시스턴트의 `reasoning_content`가 다시 전송되기를 기대합니다. OpenClaw는 이를 DeepSeek Plugin 내부에서 처리하므로, `deepseek/deepseek-v4-flash`와 `deepseek/deepseek-v4-pro`에서 일반적인 멀티턴 도구 사용이 동작합니다.

기존 세션을 다른 OpenAI 호환 프로바이더에서 DeepSeek V4 모델로 전환하면, 이전 어시스턴트 도구 호출 턴에는 네이티브 DeepSeek `reasoning_content`가 없을 수 있습니다. OpenClaw는 DeepSeek V4 thinking 요청에 대해 이 누락된 필드를 채워 넣으므로, 프로바이더가 `/new` 없이도 재생된 도구 호출 기록을 수락할 수 있습니다.

OpenClaw에서 thinking이 비활성화되면(UI의 **None** 선택 포함), OpenClaw는 DeepSeek에 `thinking: { type: "disabled" }`를 보내고, 전송되는 기록에서 재생된 `reasoning_content`를 제거합니다. 이렇게 하면 thinking이 비활성화된 세션이 DeepSeek의 비-thinking 경로를 유지합니다.

기본 빠른 경로에는 `deepseek/deepseek-v4-flash`를 사용하세요. 더 강력한 V4 모델이 필요하고 더 높은 비용 또는 지연 시간을 감수할 수 있다면 `deepseek/deepseek-v4-pro`를 사용하세요.

## 실시간 테스트

직접 실시간 모델 스위트에는 현대 모델 집합에 DeepSeek V4가 포함되어 있습니다. DeepSeek V4 직접 모델 검사만 실행하려면 다음을 사용하세요:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

이 실시간 검사는 두 V4 모델이 completion을 수행할 수 있는지, 그리고 thinking/tool 후속 턴이 DeepSeek가 요구하는 replay 페이로드를 보존하는지 검증합니다.

## config 예시

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    프로바이더, 모델 ref, failover 동작 선택하기.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, 프로바이더에 대한 전체 config 참조.
  </Card>
</CardGroup>
