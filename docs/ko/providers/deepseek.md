---
read_when:
    - OpenClaw에서 DeepSeek을 사용하려고 합니다
    - API 키 환경 변수 또는 CLI 인증 옵션이 필요합니다
summary: DeepSeek 설정(인증 + 모델 선택)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T01:06:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com)는 OpenAI 호환 API를 통해 강력한 AI 모델을 제공합니다.

| 속성     | 값                         |
| -------- | -------------------------- |
| 제공자   | `deepseek`                 |
| 인증     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI 호환                |
| 기본 URL | `https://api.deepseek.com` |

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="API 키 발급">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    API 키를 입력하라는 메시지를 표시하고 `deepseek/deepseek-v4-flash`를 기본 모델로 설정합니다.

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider deepseek
    ```

    실행 중인 Gateway 없이 Plugin의 정적 카탈로그를 확인하려면 다음을 실행합니다.

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="비대화형 설정">
    스크립트 기반 또는 헤드리스 설치에서는 모든 플래그를 직접 전달합니다.

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
해당 프로세스에서 사용할 수 있도록 설정해야 합니다(예: `~/.openclaw/.env` 또는
`env.shellEnv` 사용).
</Warning>

## 내장 카탈로그

| 모델 참조                    | 이름              | 입력   | 컨텍스트  | 최대 출력 | 참고                                               |
| ---------------------------- | ----------------- | ------ | --------- | --------- | -------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | 텍스트 | 1,000,000 | 384,000   | 기본 모델, V4 사고 지원 인터페이스                 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | 텍스트 | 1,000,000 | 384,000   | V4 사고 지원 인터페이스                            |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | 텍스트 | 1,000,000 | 384,000   | 더 이상 사용되지 않는 V4 Flash 비사고 호환 이름    |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | 텍스트 | 1,000,000 | 384,000   | 더 이상 사용되지 않는 V4 Flash 사고 호환 이름      |

<Warning>
DeepSeek는 2026년 7월 24일 15:59 UTC에 `deepseek-chat`과
`deepseek-reasoner`를 폐기합니다. 현재 두 모델은 각각 비사고 모드와
사고 모드에서 DeepSeek V4 Flash로 라우팅됩니다. 중단 시점 전에 구성된 모델 참조를
`deepseek/deepseek-v4-flash` 또는 `deepseek/deepseek-v4-pro`로 변경하세요.
</Warning>

OpenClaw의 로컬 비용 추정치는 DeepSeek가 공개한 캐시 적중, 캐시 미적중 및
출력 요금을 따릅니다. DeepSeek는 이러한 요금을 변경할 수 있으며, 청구에는
[모델 및 가격](https://api-docs.deepseek.com/quick_start/pricing/) 페이지가
기준이 됩니다.

<Tip>
V4 모델은 DeepSeek의 `thinking` 제어를 지원합니다. 또한 OpenClaw는 도구 호출이
포함된 사고 세션이 계속될 수 있도록 후속 턴에서 DeepSeek의 `reasoning_content`를
재현합니다.
DeepSeek V4 모델에서 `/think xhigh` 또는 `/think max`를 사용하면 DeepSeek의
최대 `reasoning_effort`를 요청할 수 있으며, 둘 다 `"max"`에 매핑됩니다.
</Tip>

## 사고 및 도구

DeepSeek V4 사고 세션에서는 사고가 활성화된 턴에서 재현된 어시스턴트 메시지에
후속 요청 시 `reasoning_content`가 포함되어야 합니다.
OpenClaw의 DeepSeek Plugin은 이 필드를 자동으로 보충하므로, 기록이 다른
OpenAI 호환 제공자(네이티브 `reasoning_content` 없음)나 일반 어시스턴트
메시지에서 온 경우에도 `deepseek/deepseek-v4-flash`와
`deepseek/deepseek-v4-pro`에서 일반적인 다중 턴 도구 사용이 작동합니다.
세션 도중 제공자를 전환한 후에도 `/new`가 필요하지 않습니다.

사고가 비활성화된 경우(UI의 **없음** 선택 포함), OpenClaw는
`thinking: { type: "disabled" }`를 전송하고 발신 기록에서 재현된
`reasoning_content`를 제거하여 세션이 DeepSeek의 비사고 경로를 유지하도록 합니다.

기본 고속 경로에는 `deepseek/deepseek-v4-flash`를 사용합니다. 더 높은 비용이나
지연 시간을 감수할 수 있고 더 강력한 모델이 필요한 경우
`deepseek/deepseek-v4-pro`를 사용합니다.

## 라이브 테스트

최신 모델 라이브 제품군에서 DeepSeek V4 직접 모델 검사만 실행하려면 다음을 사용합니다.

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

두 V4 모델이 모두 완료되는지, 그리고 사고/도구 후속 턴에서 DeepSeek에 필요한
재현 페이로드가 유지되는지 검증합니다.

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
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델 및 제공자의 전체 구성 참조입니다.
  </Card>
</CardGroup>
