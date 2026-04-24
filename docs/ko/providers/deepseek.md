---
read_when:
    - OpenClaw에서 DeepSeek를 사용하려고 합니다
    - API 키 env var 또는 CLI 인증 옵션이 필요합니다
summary: DeepSeek 설정(인증 + 모델 선택)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:21:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com)는 OpenAI 호환 API와 함께 강력한 AI 모델을 제공합니다.

| 속성 | 값                         |
| ---- | -------------------------- |
| 제공업체 | `deepseek`                 |
| 인증 | `DEEPSEEK_API_KEY`         |
| API  | OpenAI 호환                 |
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

    그러면 API 키를 입력하라는 메시지가 표시되고 `deepseek/deepseek-v4-flash`가 기본 모델로 설정됩니다.

  </Step>
  <Step title="사용 가능한 모델 확인">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="비대화형 설정">
    스크립트 또는 헤드리스 설치의 경우 모든 플래그를 직접 전달하세요:

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
Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `DEEPSEEK_API_KEY`가
해당 프로세스에서 사용 가능하도록 해야 합니다(예: `~/.openclaw/.env` 또는
`env.shellEnv`를 통해).
</Warning>

## 내장 카탈로그

| 모델 ref                    | 이름              | 입력 | 컨텍스트 | 최대 출력 | 참고                                       |
| --------------------------- | ----------------- | ---- | -------- | --------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text | 1,000,000 | 384,000   | 기본 모델; V4 사고 가능 surface            |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text | 1,000,000 | 384,000   | V4 사고 가능 surface                       |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text | 131,072  | 8,192     | DeepSeek V3.2 비사고 surface               |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072  | 65,536    | 추론이 활성화된 V3.2 surface               |

<Tip>
V4 모델은 DeepSeek의 `thinking` 제어를 지원합니다. OpenClaw는 후속 턴에서도
DeepSeek `reasoning_content`를 다시 재생하므로 도구 호출이 포함된 사고 세션을
계속 이어갈 수 있습니다.
</Tip>

## 구성 예시

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
    제공업체, 모델 ref, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, 제공업체에 대한 전체 구성 참조입니다.
  </Card>
</CardGroup>
