---
read_when:
    - OpenClaw에서 Arcee AI를 사용하려는 경우
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
summary: Arcee AI 설정(인증 + 모델 선택)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai)는 OpenAI 호환 API를 통해 전문가 혼합 모델인 Trinity 제품군에 대한 액세스를 제공합니다. 모든 Trinity 모델은 Apache 2.0 라이선스입니다.

Arcee AI 모델은 Arcee 플랫폼을 통해 직접 액세스하거나 [OpenRouter](/ko/providers/openrouter)를 통해 액세스할 수 있습니다.

| 속성 | 값                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| 제공자 | `arcee`                                                                               |
| 인증     | `ARCEEAI_API_KEY` (직접) 또는 `OPENROUTER_API_KEY` (OpenRouter 경유)                   |
| API      | OpenAI 호환                                                                     |
| 기본 URL | `https://api.arcee.ai/api/v1` (직접) 또는 `https://openrouter.ai/api/v1` (OpenRouter) |

## 시작하기

<Tabs>
  <Tab title="직접 (Arcee platform)">
    <Steps>
      <Step title="API 키 받기">
        [Arcee AI](https://chat.arcee.ai/)에서 API 키를 생성합니다.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="기본 모델 설정">
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

  <Tab title="OpenRouter 경유">
    <Steps>
      <Step title="API 키 받기">
        [OpenRouter](https://openrouter.ai/keys)에서 API 키를 생성합니다.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="기본 모델 설정">
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
  <Tab title="직접 (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="OpenRouter 경유">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 내장 카탈로그

OpenClaw는 현재 이 번들 Arcee 카탈로그를 제공합니다.

| 모델 참조                      | 이름                   | 입력 | 컨텍스트 | 비용(1M당 입력/출력) | 참고                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | 기본 모델; 추론 활성화          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 범용; 400B 파라미터, 13B 활성  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 빠르고 비용 효율적; 함수 호출 |

<Tip>
온보딩 프리셋은 `arcee/trinity-large-thinking`을 기본 모델로 설정합니다.
</Tip>

## 지원되는 기능

| 기능                                       | 지원 여부                                    |
| --------------------------------------------- | -------------------------------------------- |
| 스트리밍                                     | 예                                          |
| 도구 사용 / 함수 호출                   | 예(Trinity Mini, Trinity Large Preview)    |
| 구조화된 출력(JSON 모드 및 JSON 스키마) | 예                                          |
| 확장 사고                             | 예(Trinity Large Thinking; 도구 비활성화) |

<AccordionGroup>
  <Accordion title="환경 참고">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `ARCEEAI_API_KEY`
    (또는 `OPENROUTER_API_KEY`)가 해당 프로세스에서 사용할 수 있는지 확인하세요(예:
    `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).
  </Accordion>

  <Accordion title="OpenRouter 라우팅">
    OpenRouter를 통해 Arcee 모델을 사용할 때도 동일한 `arcee/*` 모델 참조가 적용됩니다.
    OpenClaw는 인증 선택에 따라 라우팅을 투명하게 처리합니다. OpenRouter 전용
    구성 세부 정보는 [OpenRouter 제공자 문서](/ko/providers/openrouter)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ko/providers/openrouter" icon="shuffle">
    단일 API 키로 Arcee 모델과 다양한 다른 모델에 액세스합니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
</CardGroup>
