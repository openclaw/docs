---
read_when:
    - OpenClaw에서 개인정보 보호에 중점을 둔 추론을 사용하려고 합니다
    - Venice AI 설정 안내가 필요합니다
summary: OpenClaw에서 개인정보 보호에 중점을 둔 Venice AI 모델 사용하기
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T15:41:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai)는 개인정보 보호에 중점을 둔 추론을 제공합니다. 오픈 모델은
로깅 없이 실행되며, Claude, GPT, Gemini, Grok에 익명화된 프록시 액세스도 제공합니다.
모든 엔드포인트는 OpenAI와 호환됩니다(`/v1`).

## 개인정보 보호 모드

| 모드           | 동작                                                         | 모델                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **비공개**    | 프롬프트/응답은 저장되거나 기록되지 않습니다. 일시적으로만 처리됩니다.         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored 등 |
| **익명화** | 전달하기 전에 메타데이터를 제거하여 Venice를 통해 프록시됩니다. | Claude, GPT, Gemini, Grok                                     |

<Warning>
익명화 모델은 완전히 비공개가 아닙니다. Venice는 전달하기 전에 메타데이터를 제거하지만, 기반 제공자(OpenAI, Anthropic, Google, xAI)는 여전히 요청을 처리합니다. 완전한 개인정보 보호가 필요한 경우 비공개 모델을 사용하십시오.
</Warning>

## 시작하기

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="API 키 받기">
    1. [venice.ai](https://venice.ai)에서 가입합니다.
    2. **Settings > API Keys > Create new key**로 이동합니다.
    3. API 키를 복사합니다(형식: `vapi_xxxxxxxxxxxx`).
  </Step>
  <Step title="OpenClaw 구성">
    <Tabs>
      <Tab title="대화형(권장)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        API 키를 입력하라는 메시지를 표시하거나 기존 `VENICE_API_KEY`를 재사용하고, 사용 가능한 Venice 모델을 나열한 다음 기본 모델을 설정합니다.
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
    openclaw agent --model venice/kimi-k2-5 --message "안녕하세요. 정상적으로 작동하나요?"
    ```
  </Step>
</Steps>

## 모델 선택

- **기본값**: `venice/kimi-k2-5`(비공개, 추론, 비전).
- **가장 강력한 익명화 옵션**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

`openclaw configure`를 실행하고 **Model/auth provider > Venice AI**를 선택할 수도 있습니다.

<Tip>
| 사용 사례                 | 모델                             | 이유                                       |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| 일반 채팅(기본값)    | `kimi-k2-5`                        | 강력한 비공개 추론과 비전       |
| 전반적으로 가장 우수한 품질      | `claude-opus-4-6`                  | 가장 강력한 Venice 익명화 옵션         |
| 개인정보 보호 + 코딩          | `qwen3-coder-480b-a35b-instruct`   | 대규모 컨텍스트를 지원하는 비공개 코딩 모델    |
| 빠르고 저렴함              | `qwen3-4b`                         | 경량 추론 모델                |
| 복잡한 비공개 작업     | `deepseek-v3.2`                    | 강력한 추론, 도구 호출 비활성화    |
| 무검열                | `venice-uncensored`                | 콘텐츠 제한 없음                    |
</Tip>

## 기본 제공 카탈로그(38개 모델)

<AccordionGroup>
  <Accordion title="비공개 모델(26개) — 완전 비공개, 로깅 없음">
    | 모델 ID                               | 이름                                 | 컨텍스트 | 참고                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | 기본값, 추론, 비전  |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k    | 추론                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | 범용                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | 범용                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | 범용, 도구 비활성화     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | 추론                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | 범용                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k    | 코딩                      |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | 코딩                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | 추론, 비전           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | 범용                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k    | 비전                      |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k     | 빠름, 추론              |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | 추론, 도구 비활성화    |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k     | 무검열, 도구 비활성화   |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k    | 비전                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | 비전                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | 범용                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | 범용                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | 추론                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | 범용                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | 추론                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | 추론                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | 추론                    |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k    | 추론                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | 추론                    |
  </Accordion>

  <Accordion title="익명화 모델(12개) — Venice 프록시 경유">
    | 모델 ID                        | 이름                           | 컨텍스트 | 참고                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (Venice 경유)    | 1M      | 추론, 비전            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (Venice 경유)  | 1M      | 추론, 비전            |
    | `openai-gpt-54`                 | GPT-5.4 (Venice 경유)            | 1M      | 추론, 비전            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (Venice 경유)      | 400k    | 추론, 비전, 코딩     |
    | `openai-gpt-52`                 | GPT-5.2 (Venice 경유)            | 256k    | 추론                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (Venice 경유)      | 256k    | 추론, 비전, 코딩     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (Venice 경유)             | 128k    | 비전                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (Venice 경유)        | 128k    | 비전                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (Venice 경유)     | 1M      | 추론, 비전             |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (Venice 경유)       | 198k    | 추론, 비전             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (Venice 경유)     | 256k    | 추론, 비전             |
    | `grok-41-fast`                  | Grok 4.1 Fast (Venice 경유)      | 1M      | 추론, 비전             |
  </Accordion>
</AccordionGroup>

Grok 기반 Venice 모델(`grok-41-fast` 및 유사 모델)에는 네이티브 xAI 제공자와 동일한 도구 스키마
호환성 패치가 적용됩니다. 동일한 업스트림
도구 호출 형식을 공유하기 때문입니다.

## 모델 검색

위의 번들 카탈로그는 매니페스트 기반 초기 목록입니다. 런타임에 OpenClaw는
Venice `/models` API에서 카탈로그를 새로 고치며, API에 연결할 수 없으면
초기 목록을 사용합니다. `/models` 엔드포인트는 공개되어 있어 목록 조회에는 인증이 필요하지
않지만, 추론에는 유효한 API 키가 필요합니다.

## DeepSeek V4 재생 동작

Venice가 `deepseek-v4-pro` 또는
`deepseek-v4-flash`와 같은 DeepSeek V4 모델을 제공하는 경우, Venice에서 해당 필드를 생략하면 OpenClaw는 어시스턴트 메시지에 필수 `reasoning_content` 재생
필드를 채우고 요청 페이로드에서 `thinking`/
`reasoning`/`reasoning_effort`를 제거합니다(Venice는 이러한 모델에서
DeepSeek의 네이티브 `thinking` 제어를 거부합니다). 이 재생 수정은
네이티브 DeepSeek 제공자 자체의 사고 제어와는 별개입니다.

## 스트리밍 및 도구 지원

| 기능          | 지원                                           |
| ---------------- | ------------------------------------------------- |
| 스트리밍        | 모든 모델                                        |
| 함수 호출 | 대부분의 모델, 위에서 명시한 모델은 개별적으로 비활성화됨 |
| 비전/이미지    | 위에서 "비전"으로 표시된 모델                      |
| JSON 모드        | `response_format`을 통해 지원                             |

## 요금

Venice는 크레딧 기반 시스템을 사용합니다. 익명화 모델의 비용은
직접 API 요금에 소액의 Venice 수수료를 더한 수준입니다. 현재 요금은
[venice.ai/pricing](https://venice.ai/pricing)을 참조하십시오.

## 사용 예시

```bash
# 기본 비공개 모델
openclaw agent --model venice/kimi-k2-5 --message "빠른 상태 확인"

# Venice를 통한 Claude Opus(익명화)
openclaw agent --model venice/claude-opus-4-6 --message "이 작업을 요약해 주세요"

# 무검열 모델
openclaw agent --model venice/venice-uncensored --message "옵션 초안 작성"

# 이미지가 포함된 비전 모델
openclaw agent --model venice/qwen3-vl-235b-a22b --message "첨부된 이미지 검토"

# 코딩 모델
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "이 함수를 리팩터링해 주세요"
```

## 문제 해결

<AccordionGroup>
  <Accordion title="API 키가 인식되지 않음">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    키가 `vapi_`로 시작하는지 확인하십시오.

  </Accordion>

  <Accordion title="모델을 사용할 수 없음">
    현재 사용 가능한 모델을 확인하려면 `openclaw models list --all --provider venice`를 실행하십시오.
    Venice에서 모델을 추가하거나 폐기함에 따라 카탈로그가 변경됩니다.
  </Accordion>

  <Accordion title="연결 문제">
    Venice API는 `https://api.venice.ai/api/v1`에 있습니다. 네트워크에서 해당 호스트로의 HTTPS 연결을 허용하는지 확인하십시오.
  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="구성 파일 예시">
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
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI 홈페이지 및 계정 가입.
  </Card>
  <Card title="API 문서" href="https://docs.venice.ai" icon="book">
    Venice API 참조 및 개발자 문서.
  </Card>
  <Card title="요금" href="https://venice.ai/pricing" icon="credit-card">
    현재 Venice 크레딧 요율 및 요금제.
  </Card>
</CardGroup>
