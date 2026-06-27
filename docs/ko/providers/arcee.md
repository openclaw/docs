---
read_when:
    - OpenClaw와 함께 Arcee AI를 사용하려는 경우
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
summary: Arcee AI 설정(인증 + 모델 선택)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T17:59:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai)는 OpenAI 호환 API를 통해 mixture-of-experts 모델인 Trinity 제품군에 대한 접근을 제공합니다. 모든 Trinity 모델은 Apache 2.0 라이선스를 따릅니다.

Arcee AI 모델은 Arcee 플랫폼을 통해 직접 접근하거나 [OpenRouter](/ko/providers/openrouter)를 통해 접근할 수 있습니다.

| 속성 | 값                                                                                    |
| ---- | ------------------------------------------------------------------------------------- |
| 제공자 | `arcee`                                                                               |
| 인증 | `ARCEEAI_API_KEY`(직접) 또는 `OPENROUTER_API_KEY`(OpenRouter 경유)                    |
| API | OpenAI 호환                                                                           |
| 기본 URL | `https://api.arcee.ai/api/v1`(직접) 또는 `https://openrouter.ai/api/v1`(OpenRouter) |

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## 시작하기

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        [Arcee AI](https://chat.arcee.ai/)에서 API 키를 생성합니다.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        [OpenRouter](https://openrouter.ai/keys)에서 API 키를 생성합니다.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        동일한 모델 참조는 직접 설정과 OpenRouter 설정 모두에서 작동합니다(예: `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 비대화형 설정

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 내장 카탈로그

OpenClaw는 현재 다음 Arcee 정적 카탈로그를 제공합니다.

| 모델 참조 | 이름 | 입력 | 컨텍스트 | 비용(입력/출력 1M당) | 참고 |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | 텍스트 | 256K    | $0.25 / $0.90        | 기본 모델; reasoning 활성화 |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | 텍스트 | 128K    | $0.25 / $1.00        | 범용; 400B 매개변수, 13B 활성 |
| `arcee/trinity-mini`           | Trinity Mini 26B       | 텍스트 | 128K    | $0.045 / $0.15       | 빠르고 비용 효율적; function calling |

<Tip>
온보딩 프리셋은 `arcee/trinity-large-thinking`을 기본 모델로 설정합니다.
</Tip>

## 지원 기능

| 기능 | 지원 여부 |
| --------------------------------------------- | -------------------------------------------- |
| 스트리밍 | 예 |
| 도구 사용 / function calling | 예(Trinity Mini, Trinity Large Preview) |
| 구조화된 출력(JSON 모드 및 JSON 스키마) | 예 |
| 확장 사고 | 예(Trinity Large Thinking; 도구 비활성화) |

<AccordionGroup>
  <Accordion title="Environment note">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우, `ARCEEAI_API_KEY`
    (또는 `OPENROUTER_API_KEY`)가 해당 프로세스에서 사용할 수 있는지 확인하세요(예:
    `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).
  </Accordion>

  <Accordion title="OpenRouter routing">
    OpenRouter를 통해 Arcee 모델을 사용할 때도 동일한 `arcee/*` 모델 참조가 적용됩니다.
    OpenClaw는 인증 선택에 따라 라우팅을 투명하게 처리합니다. OpenRouter 관련
    구성 세부 정보는 [OpenRouter 제공자 문서](/ko/providers/openrouter)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ko/providers/openrouter" icon="shuffle">
    단일 API 키로 Arcee 모델과 다른 많은 모델에 접근합니다.
  </Card>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
</CardGroup>
