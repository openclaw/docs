---
read_when:
    - OpenClaw에서 DeepSeek를 사용하려는 경우
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
summary: DeepSeek 설정(인증 + 모델 선택)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T16:29:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com)는 OpenAI 호환 API를 갖춘 강력한 AI 모델을 제공합니다.

| 속성 | 값                         |
| -------- | -------------------------- |
| 제공자 | `deepseek`                 |
| 인증     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI 호환                |
| 기본 URL | `https://api.deepseek.com` |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    그러면 API 키 입력을 요청하고 `deepseek/deepseek-v4-flash`를 기본 모델로 설정합니다.

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider deepseek
    ```

    실행 중인 Gateway 없이 번들된 정적 카탈로그를 확인하려면
    다음을 사용하세요.

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="비대화형 설정">
    스크립트 또는 헤드리스 설치의 경우 모든 플래그를 직접 전달하세요.

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
Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `DEEPSEEK_API_KEY`를
해당 프로세스에서 사용할 수 있는지 확인하세요(예: `~/.openclaw/.env` 또는
`env.shellEnv`를 통해).
</Warning>

## 내장 카탈로그

| 모델 참조                    | 이름              | 입력 | 컨텍스트 | 최대 출력 | 참고                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | 기본 모델; V4 사고 가능 표면 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | V4 사고 가능 표면                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 비사고 표면         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | 추론 활성화 V3.2 표면             |

<Tip>
V4 모델은 DeepSeek의 `thinking` 제어를 지원합니다. OpenClaw는 후속 턴에서
DeepSeek `reasoning_content`도 재생하므로 도구 호출이 포함된 사고 세션을
계속할 수 있습니다.
DeepSeek V4 모델에서 DeepSeek의 최대 `reasoning_effort`를 요청하려면
`/think xhigh` 또는 `/think max`를 사용하세요.
</Tip>

## 사고와 도구

DeepSeek V4 사고 세션은 대부분의 OpenAI 호환 제공자보다 더 엄격한 재생 계약을 가집니다. 사고가 활성화된 턴에서 도구를 사용한 후에는 DeepSeek가 후속 요청에서 해당 턴의 재생된 어시스턴트 메시지에 `reasoning_content`가 포함되기를 기대합니다. OpenClaw는 DeepSeek Plugin 내부에서 이를 처리하므로 일반적인 멀티턴 도구 사용은 `deepseek/deepseek-v4-flash` 및 `deepseek/deepseek-v4-pro`에서 작동합니다.

기존 세션을 다른 OpenAI 호환 제공자에서 DeepSeek V4 모델로 전환하면 이전 어시스턴트 도구 호출 턴에 네이티브 DeepSeek `reasoning_content`가 없을 수 있습니다. OpenClaw는 DeepSeek V4 사고 요청을 위해 재생된 어시스턴트 메시지의 누락된 필드를 채워 제공자가 `/new` 없이도 기록을 수락할 수 있게 합니다.

OpenClaw에서 사고가 비활성화된 경우(UI **없음** 선택 포함), OpenClaw는 DeepSeek `thinking: { type: "disabled" }`를 보내고 나가는 기록에서 재생된 `reasoning_content`를 제거합니다. 이렇게 하면 사고 비활성화 세션이 비사고 DeepSeek 경로에 유지됩니다.

기본 빠른 경로에는 `deepseek/deepseek-v4-flash`를 사용하세요. 더 강력한 V4 모델을 원하고 더 높은 비용이나 지연 시간을 감수할 수 있다면 `deepseek/deepseek-v4-pro`를 사용하세요.

## 라이브 테스트

직접 라이브 모델 제품군에는 최신 모델 세트의 DeepSeek V4가 포함됩니다. DeepSeek V4 직접 모델 검사만 실행하려면 다음을 사용하세요.

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

이 라이브 검사는 두 V4 모델이 모두 완료할 수 있는지와 사고/도구 후속 턴이 DeepSeek에 필요한 재생 페이로드를 보존하는지 확인합니다.

## 설정 예시

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
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, 제공자에 대한 전체 구성 참조.
  </Card>
</CardGroup>
