---
read_when:
    - OpenClaw에서 개인정보 보호 중심 추론을 사용하려는 경우
    - Venice AI 설정 가이드가 필요한 경우
summary: OpenClaw에서 Venice AI의 개인정보 보호 중심 모델 사용하기
title: Venice AI
x-i18n:
    generated_at: "2026-04-26T11:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AI는 **개인정보 보호 중심 AI 추론**을 제공하며, 검열되지 않은 모델과 익명화된 프록시를 통한 주요 독점 모델 접근을 지원합니다. 모든 추론은 기본적으로 비공개이며, 데이터 학습 없음, 로그 저장 없음이 원칙입니다.

## OpenClaw에서 Venice를 사용하는 이유

- 오픈소스 모델에 대한 **비공개 추론**(로그 없음)
- 필요할 때 사용할 수 있는 **검열되지 않은 모델**
- 품질이 중요할 때 Opus/GPT/Gemini 같은 독점 모델에 대한 **익명화된 접근**
- OpenAI 호환 `/v1` 엔드포인트

## 개인정보 보호 모드

Venice는 두 가지 개인정보 보호 수준을 제공합니다. 어떤 모델을 선택할지 결정할 때 이 차이를 이해하는 것이 중요합니다.

| 모드            | 설명                                                                                                                               | 모델                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Private**     | 완전한 비공개. 프롬프트/응답이 **절대 저장되거나 기록되지 않습니다**. Ephemeral 방식입니다.                                         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored 등   |
| **Anonymized**  | Venice를 통해 프록시되며 메타데이터가 제거됩니다. 기본 provider(OpenAI, Anthropic, Google, xAI)는 익명화된 요청을 받습니다.        | Claude, GPT, Gemini, Grok                                    |

<Warning>
익명화된 모델은 **완전한 비공개가 아닙니다**. Venice가 메타데이터를 제거한 뒤 전달하지만, 기본 provider(OpenAI, Anthropic, Google, xAI)는 여전히 요청을 처리합니다. 완전한 개인정보 보호가 필요하다면 **Private** 모델을 선택하세요.
</Warning>

## 기능

- **개인정보 보호 중심**: "private"(완전 비공개)와 "anonymized"(프록시) 중 선택 가능
- **검열되지 않은 모델**: 콘텐츠 제한이 없는 모델 이용 가능
- **주요 모델 접근**: Venice의 익명화 프록시를 통해 Claude, GPT, Gemini, Grok 사용 가능
- **OpenAI 호환 API**: 쉬운 통합을 위한 표준 `/v1` 엔드포인트
- **스트리밍**: 모든 모델에서 지원
- **함수 호출**: 일부 모델에서 지원(모델 capability 확인 필요)
- **비전**: vision capability가 있는 모델에서 지원
- **엄격한 rate limit 없음**: 극단적인 사용량에는 공정 사용 기준의 제한이 적용될 수 있음

## 시작하기

<Steps>
  <Step title="API 키 받기">
    1. [venice.ai](https://venice.ai)에서 가입합니다
    2. **Settings > API Keys > Create new key**로 이동합니다
    3. API 키를 복사합니다(형식: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw 구성">
    원하는 설정 방법을 선택하세요.

    <Tabs>
      <Tab title="대화형(권장)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        이 작업은 다음을 수행합니다.
        1. API 키를 요청합니다(또는 기존 `VENICE_API_KEY` 사용)
        2. 사용 가능한 Venice 모델을 모두 표시합니다
        3. 기본 모델을 선택하게 합니다
        4. provider를 자동으로 구성합니다
      </Tab>
      <Tab title="환경 변수">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="비대화형">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="설정 확인">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "안녕하세요, 정상 작동하나요?"
    ```
  </Step>
</Steps>

## 모델 선택

설정 후 OpenClaw는 사용 가능한 모든 Venice 모델을 보여줍니다. 필요에 따라 선택하세요.

- **기본 모델**: 강력한 비공개 추론과 vision을 위해 `venice/kimi-k2-5`
- **고성능 옵션**: 가장 강력한 익명화 Venice 경로를 위해 `venice/claude-opus-4-6`
- **개인정보 보호**: 완전한 비공개 추론을 원하면 "private" 모델 선택
- **Capability**: Venice 프록시를 통해 Claude, GPT, Gemini에 접근하려면 "anonymized" 모델 선택

기본 모델은 언제든 변경할 수 있습니다.

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

사용 가능한 모든 모델 목록:

```bash
openclaw models list | grep venice
```

또는 `openclaw configure`를 실행한 후 **Model/auth**를 선택하고 **Venice AI**를 선택할 수도 있습니다.

<Tip>
아래 표를 사용해 사용 사례에 맞는 모델을 선택하세요.

| 사용 사례                  | 권장 모델                         | 이유                                           |
| -------------------------- | --------------------------------- | ---------------------------------------------- |
| **일반 채팅(기본값)**      | `kimi-k2-5`                       | 강력한 비공개 추론 + vision                    |
| **최고 전반 품질**         | `claude-opus-4-6`                 | 가장 강력한 익명화 Venice 옵션                 |
| **개인정보 보호 + 코딩**   | `qwen3-coder-480b-a35b-instruct`  | 큰 컨텍스트를 가진 비공개 코딩 모델            |
| **비공개 vision**          | `kimi-k2-5`                       | private 모드를 벗어나지 않고 vision 지원       |
| **빠르고 저렴함**          | `qwen3-4b`                        | 경량 추론 모델                                 |
| **복잡한 비공개 작업**     | `deepseek-v3.2`                   | 강력한 추론, 단 Venice tool 지원 없음          |
| **검열되지 않음**          | `venice-uncensored`               | 콘텐츠 제한 없음                               |

</Tip>

## DeepSeek V4 replay 동작

Venice가 `venice/deepseek-v4-pro` 또는 `venice/deepseek-v4-flash` 같은 DeepSeek V4 모델을 노출하는 경우, 프록시가 이를 생략하면 OpenClaw는 assistant tool-call 턴에서 필요한 DeepSeek V4 `reasoning_content` replay placeholder를 채워 넣습니다. Venice는 DeepSeek의 기본 최상위 `thinking` 제어를 거부하므로, OpenClaw는 이 provider 전용 replay 수정 로직을 기본 DeepSeek provider의 thinking 제어와 분리해 유지합니다.

## 내장 카탈로그 (총 41개)

<AccordionGroup>
  <Accordion title="Private 모델 (26개) — 완전 비공개, 로그 없음">
    | 모델 ID                               | 이름                                 | 컨텍스트 | 기능                        |
    | -------------------------------------- | ------------------------------------ | -------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                            | 256k     | 기본값, reasoning, vision   |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                     | 256k     | Reasoning                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                        | 128k     | 일반                        |
    | `llama-3.2-3b`                         | Llama 3.2 3B                         | 128k     | 일반                        |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B              | 128k     | 일반, 도구 비활성화         |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                  | 128k     | Reasoning                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                  | 128k     | 일반                        |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                     | 256k     | 코딩                        |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo               | 256k     | 코딩                        |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                      | 256k     | Reasoning, vision           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                       | 256k     | 일반                        |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)               | 256k     | Vision                      |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)              | 32k      | 빠름, reasoning             |
    | `deepseek-v3.2`                        | DeepSeek V3.2                        | 160k     | Reasoning, 도구 비활성화    |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)  | 32k      | 검열 없음, 도구 비활성화    |
    | `mistral-31-24b`                       | Venice Medium (Mistral)              | 128k     | Vision                      |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct          | 198k     | Vision                      |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                  | 128k     | 일반                        |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B           | 128k     | 일반                        |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                | 128k     | Reasoning                   |
    | `zai-org-glm-4.6`                      | GLM 4.6                              | 198k     | 일반                        |
    | `zai-org-glm-4.7`                      | GLM 4.7                              | 198k     | Reasoning                   |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                        | 128k     | Reasoning                   |
    | `zai-org-glm-5`                        | GLM 5                                | 198k     | Reasoning                   |
    | `minimax-m21`                          | MiniMax M2.1                         | 198k     | Reasoning                   |
    | `minimax-m25`                          | MiniMax M2.5                         | 198k     | Reasoning                   |
  </Accordion>

  <Accordion title="Anonymized 모델 (15개) — Venice 프록시 경유">
    | 모델 ID                        | 이름                              | 컨텍스트 | 기능                        |
    | ------------------------------- | --------------------------------- | -------- | --------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)      | 1M       | Reasoning, vision           |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)      | 198k     | Reasoning, vision           |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice)    | 1M       | Reasoning, vision           |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice)    | 198k     | Reasoning, vision           |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)              | 1M       | Reasoning, vision           |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)        | 400k     | Reasoning, vision, 코딩     |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)              | 256k     | Reasoning                   |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)        | 256k     | Reasoning, vision, 코딩     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)               | 128k     | Vision                      |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)          | 128k     | Vision                      |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)       | 1M       | Reasoning, vision           |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)         | 198k     | Reasoning, vision           |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)       | 256k     | Reasoning, vision           |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)        | 1M       | Reasoning, vision           |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)     | 256k     | Reasoning, 코딩             |
  </Accordion>
</AccordionGroup>

## 모델 검색

`VENICE_API_KEY`가 설정되면 OpenClaw는 Venice API에서 모델을 자동으로 검색합니다. API에 도달할 수 없으면 정적 카탈로그로 폴백합니다.

`/models` 엔드포인트는 공개되어 있으므로 목록 조회에는 인증이 필요 없지만, 실제 추론에는 유효한 API 키가 필요합니다.

## 스트리밍 및 도구 지원

| 기능                 | 지원                                              |
| -------------------- | ------------------------------------------------- |
| **Streaming**        | 모든 모델                                         |
| **Function calling** | 대부분의 모델(API의 `supportsFunctionCalling` 확인) |
| **Vision/Images**    | "Vision" 기능이 표시된 모델                        |
| **JSON mode**        | `response_format`을 통해 지원                      |

## 요금

Venice는 크레딧 기반 시스템을 사용합니다. 현재 요금은 [venice.ai/pricing](https://venice.ai/pricing)에서 확인하세요.

- **Private 모델**: 일반적으로 더 저렴함
- **Anonymized 모델**: 직접 API 가격 + 소액의 Venice 수수료와 유사

### Venice (익명화) vs 직접 API

| 항목         | Venice (익명화)               | 직접 API            |
| ------------ | ----------------------------- | ------------------- |
| **Privacy**  | 메타데이터 제거, 익명화됨     | 사용자 계정과 연결됨 |
| **Latency**  | +10-50ms (프록시)             | 직접 연결           |
| **Features** | 대부분의 기능 지원            | 전체 기능           |
| **Billing**  | Venice 크레딧                 | provider 과금       |

## 사용 예시

```bash
# 기본 private 모델 사용
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Venice를 통한 Claude Opus 사용 (익명화)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# 검열되지 않은 모델 사용
openclaw agent --model venice/venice-uncensored --message "Draft options"

# image와 함께 vision 모델 사용
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# 코딩 모델 사용
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## 문제 해결

<AccordionGroup>
  <Accordion title="API 키가 인식되지 않음">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    키가 `vapi_`로 시작하는지 확인하세요.

  </Accordion>

  <Accordion title="모델을 사용할 수 없음">
    Venice 모델 카탈로그는 동적으로 업데이트됩니다. 현재 사용 가능한 모델은 `openclaw models list`를 실행해 확인하세요. 일부 모델은 일시적으로 오프라인일 수 있습니다.
  </Accordion>

  <Accordion title="연결 문제">
    Venice API는 `https://api.venice.ai/api/v1`에 있습니다. 네트워크에서 HTTPS 연결이 허용되는지 확인하세요.
  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [Troubleshooting](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="Config 파일 예시">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, 페일오버 동작 선택하기.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI 홈페이지 및 계정 가입.
  </Card>
  <Card title="API 문서" href="https://docs.venice.ai" icon="book">
    Venice API 참조 및 개발자 문서.
  </Card>
  <Card title="요금" href="https://venice.ai/pricing" icon="credit-card">
    현재 Venice 크레딧 요금 및 요금제.
  </Card>
</CardGroup>
