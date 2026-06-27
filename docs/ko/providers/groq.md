---
read_when:
    - OpenClaw에서 Groq를 사용하려는 경우
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
    - Groq에서 Whisper 오디오 전사를 구성하고 있습니다.
summary: Groq 설정(인증 + 모델 선택 + Whisper 전사)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:02:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com)는 맞춤형 LPU 하드웨어를 사용하여 오픈 가중치 모델(Llama, Gemma, Kimi, Qwen, GPT OSS 등)에 초고속 추론을 제공합니다. Groq 플러그인은 OpenAI 호환 채팅 공급자와 오디오 미디어 이해 공급자를 모두 등록합니다.

| 속성                   | 값                                       |
| ---------------------- | ---------------------------------------- |
| 공급자 ID              | `groq`                                   |
| Plugin                 | 공식 외부 패키지                         |
| 인증 환경 변수         | `GROQ_API_KEY`                           |
| API                    | OpenAI 호환(`openai-completions`)        |
| 기본 URL               | `https://api.groq.com/openai/v1`         |
| 오디오 전사            | `whisper-large-v3-turbo`(기본값)         |
| 제안 채팅 기본값       | `groq/llama-3.3-70b-versatile`           |

## 플러그인 설치

공식 플러그인을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [console.groq.com/keys](https://console.groq.com/keys)에서 API 키를 만듭니다.
  </Step>
  <Step title="API 키 설정">
    ```bash
export GROQ_API_KEY=gsk_...
```
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

### 구성 파일 예시

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

## 기본 제공 카탈로그

OpenClaw는 추론 항목과 비추론 항목을 모두 포함하는 매니페스트 기반 Groq 카탈로그를 제공합니다. 설치된 버전의 정적 행을 보려면 `openclaw models list --provider groq`를 실행하거나, Groq의 공식 목록은 [console.groq.com/docs/models](https://console.groq.com/docs/models)에서 확인하세요.

| 모델 참조                                        | 이름                    | 추론 | 입력         | 컨텍스트 |
| ------------------------------------------------ | ----------------------- | ---- | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | 아니요 | text         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | 아니요 | text         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | 아니요 | text + image | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | 예   | text         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | 예   | text         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | 예   | text         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | 예   | text         | 131,072 |
| `groq/groq/compound`                             | Compound                | 예   | text         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | 예   | text         | 131,072 |

<Tip>
  카탈로그는 각 OpenClaw 릴리스와 함께 발전합니다. `openclaw models list --provider groq`는 설치된 버전에 알려진 행을 보여 줍니다. 새로 추가되었거나 사용 중단된 모델은 [console.groq.com/docs/models](https://console.groq.com/docs/models)와 대조해 확인하세요.
</Tip>

## 추론 모델

OpenClaw는 공유 `/think` 수준을 Groq의 모델별 `reasoning_effort` 값에 매핑합니다.

- `qwen/qwen3-32b`의 경우 비활성화된 사고는 `none`을 보내고 활성화된 사고는 `default`를 보냅니다.
- Groq GPT OSS 추론 모델(`openai/gpt-oss-*`)의 경우 OpenClaw는 `/think` 수준에 따라 `low`, `medium` 또는 `high`를 보냅니다. 해당 모델은 비활성화 값을 지원하지 않으므로 비활성화된 사고에서는 `reasoning_effort`를 생략합니다.
- DeepSeek R1 Distill, Qwen QwQ, Compound는 Groq의 네이티브 추론 표면을 사용합니다. `/think`는 표시 여부를 제어하지만 모델은 항상 추론합니다.

공유 `/think` 수준과 OpenClaw가 공급자별로 이를 변환하는 방식은 [사고 모드](/ko/tools/thinking)를 참조하세요.

## 오디오 전사

Groq 플러그인은 음성 메시지를 공유 `tools.media.audio` 표면을 통해 전사할 수 있도록 **오디오 미디어 이해 공급자**도 등록합니다.

| 속성             | 값                                        |
| ---------------- | ----------------------------------------- |
| 공유 구성 경로   | `tools.media.audio`                       |
| 기본 기본 URL    | `https://api.groq.com/openai/v1`          |
| 기본 모델        | `whisper-large-v3-turbo`                  |
| 자동 우선순위    | 20                                        |
| API 엔드포인트   | OpenAI 호환 `/audio/transcriptions`       |

Groq를 기본 오디오 백엔드로 만들려면 다음을 사용합니다.

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
  <Accordion title="데몬의 환경 가용성">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우 `GROQ_API_KEY`는 대화형 셸뿐 아니라 해당 프로세스에도 보여야 합니다.

    <Warning>
      대화형 셸에서만 내보낸 키는 해당 환경도 그곳으로 가져오지 않는 한 launchd 또는 systemd 데몬에 도움이 되지 않습니다. Gateway 프로세스에서 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하세요.
    </Warning>

  </Accordion>

  <Accordion title="사용자 지정 Groq 모델 ID">
    OpenClaw는 런타임에 모든 Groq 모델 ID를 허용합니다. Groq가 표시하는 정확한 ID를 사용하고 앞에 `groq/`를 붙이세요. 정적 카탈로그는 일반적인 사례를 다룹니다. 카탈로그에 없는 ID는 기본 OpenAI 호환 템플릿으로 넘어갑니다.

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
  <Card title="모델 공급자" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="사고 모드" href="/ko/tools/thinking" icon="brain">
    추론 노력 수준과 공급자 정책 상호작용.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    공급자 및 오디오 설정을 포함한 전체 구성 스키마.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 대시보드, API 문서, 가격.
  </Card>
</CardGroup>
