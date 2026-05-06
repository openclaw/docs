---
read_when:
    - OpenClaw에서 Groq을 사용하려는 경우
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
    - Groq에서 Whisper 오디오 전사를 구성하고 있습니다
summary: Groq 설정 (인증 + 모델 선택 + Whisper 전사)
title: Groq
x-i18n:
    generated_at: "2026-05-06T06:37:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com)는 맞춤형 LPU 하드웨어를 사용해 오픈 가중치 모델(Llama, Gemma, Kimi, Qwen, GPT OSS 등)에 초고속 추론을 제공합니다. OpenClaw에는 OpenAI 호환 채팅 Provider와 오디오 미디어 이해 Provider를 모두 등록하는 번들 Groq Plugin이 포함되어 있습니다.

| 속성                   | 값                                       |
| ---------------------- | ---------------------------------------- |
| Provider ID            | `groq`                                   |
| Plugin                 | 번들 제공, `enabledByDefault: true`      |
| 인증 환경 변수         | `GROQ_API_KEY`                           |
| 온보딩 플래그          | `--auth-choice groq-api-key`             |
| API                    | OpenAI 호환(`openai-completions`)        |
| 기본 URL               | `https://api.groq.com/openai/v1`         |
| 오디오 전사            | `whisper-large-v3-turbo`(기본값)         |
| 제안 채팅 기본값       | `groq/llama-3.3-70b-versatile`           |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [console.groq.com/keys](https://console.groq.com/keys)에서 API 키를 만듭니다.
  </Step>
  <Step title="API 키 설정">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Env only
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

  </Step>
  <Step title="기본 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="카탈로그에 연결할 수 있는지 확인">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### 설정 파일 예시

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 내장 카탈로그

OpenClaw는 추론 항목과 비추론 항목을 모두 포함하는 manifest 기반 Groq 카탈로그를 제공합니다. 설치된 버전에 번들로 포함된 행을 보려면 `openclaw models list --provider groq`를 실행하거나, Groq의 공식 목록은 [console.groq.com/docs/models](https://console.groq.com/docs/models)에서 확인하세요.

| 모델 참조                                            | 이름                          | 추론 | 입력          | 컨텍스트 |
| ---------------------------------------------------- | ----------------------------- | ---- | ------------- | -------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | 아니요 | 텍스트        | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | 아니요 | 텍스트        | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | 아니요 | 텍스트 + 이미지 | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | 아니요 | 텍스트 + 이미지 | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | 아니요 | 텍스트        | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | 아니요 | 텍스트        | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | 아니요 | 텍스트        | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | 아니요 | 텍스트        | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | 아니요 | 텍스트        | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | 아니요 | 텍스트        | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | 예   | 텍스트        | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | 예   | 텍스트        | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | 예   | 텍스트        | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | 예   | 텍스트        | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | 예   | 텍스트        | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | 예   | 텍스트        | 131,072 |
| `groq/groq/compound`                                 | Compound                      | 예   | 텍스트        | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | 예   | 텍스트        | 131,072 |

<Tip>
  카탈로그는 OpenClaw 릴리스마다 발전합니다. `openclaw models list --provider groq`는 설치된 버전이 알고 있는 행을 보여 줍니다. 새로 추가되었거나 더 이상 사용되지 않는 모델은 [console.groq.com/docs/models](https://console.groq.com/docs/models)와 대조해 확인하세요.
</Tip>

## 추론 모델

OpenClaw는 공유 `/think` 레벨을 Groq의 모델별 `reasoning_effort` 값에 매핑합니다.

- `qwen/qwen3-32b`의 경우, 생각하기를 비활성화하면 `none`을 보내고 활성화하면 `default`를 보냅니다.
- Groq GPT OSS 추론 모델(`openai/gpt-oss-*`)의 경우, OpenClaw는 `/think` 레벨에 따라 `low`, `medium`, `high`를 보냅니다. 이 모델들은 비활성화 값을 지원하지 않으므로 생각하기가 비활성화되면 `reasoning_effort`를 생략합니다.
- DeepSeek R1 Distill, Qwen QwQ, Compound는 Groq의 네이티브 추론 표면을 사용합니다. `/think`는 표시 여부를 제어하지만 모델은 항상 추론합니다.

공유 `/think` 레벨과 OpenClaw가 Provider별로 이를 변환하는 방식은 [생각하기 모드](/ko/tools/thinking)를 참고하세요.

## 오디오 전사

Groq의 번들 Plugin은 음성 메시지를 공유 `tools.media.audio` 표면을 통해 전사할 수 있도록 **오디오 미디어 이해 Provider**도 등록합니다.

| 속성             | 값                                        |
| ---------------- | ----------------------------------------- |
| 공유 설정 경로   | `tools.media.audio`                       |
| 기본 기본 URL    | `https://api.groq.com/openai/v1`          |
| 기본 모델        | `whisper-large-v3-turbo`                  |
| 자동 우선순위    | 20                                        |
| API 엔드포인트   | OpenAI 호환 `/audio/transcriptions`       |

Groq를 기본 오디오 백엔드로 설정하려면:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="daemon의 환경 사용 가능 여부">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우 `GROQ_API_KEY`는 대화형 셸뿐만 아니라 해당 프로세스에도 표시되어야 합니다.

    <Warning>
      `~/.profile`에만 있는 키는 해당 환경을 거기로도 가져오지 않는 한 launchd 또는 systemd daemon에 도움이 되지 않습니다. Gateway 프로세스에서 읽을 수 있도록 키를 `~/.openclaw/.env`에 설정하거나 `env.shellEnv`를 통해 설정하세요.
    </Warning>

  </Accordion>

  <Accordion title="사용자 지정 Groq 모델 ID">
    OpenClaw는 런타임에 모든 Groq 모델 ID를 허용합니다. Groq가 표시하는 정확한 ID를 사용하고 앞에 `groq/`를 붙이세요. 번들 카탈로그는 일반적인 경우를 다룹니다. 카탈로그에 없는 ID는 기본 OpenAI 호환 템플릿으로 넘어갑니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 Provider" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="생각하기 모드" href="/ko/tools/thinking" icon="brain">
    추론 노력 레벨과 Provider 정책 상호작용.
  </Card>
  <Card title="설정 참조" href="/ko/gateway/configuration-reference" icon="gear">
    Provider와 오디오 설정을 포함한 전체 설정 스키마.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 대시보드, API 문서, 가격.
  </Card>
</CardGroup>
