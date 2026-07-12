---
read_when:
    - OpenClaw에서 Groq을 사용하려고 합니다
    - API 키 환경 변수 또는 CLI 인증 옵션이 필요합니다.
    - Groq에서 Whisper 오디오 전사를 구성하고 있습니다
summary: Groq 설정(인증 + 모델 선택 + Whisper 음성 변환)
title: Groq
x-i18n:
    generated_at: "2026-07-12T15:36:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com)은 맞춤형 LPU 하드웨어를 사용하여 오픈 웨이트 모델(Llama, Gemma, Kimi, Qwen, GPT OSS 등)에 초고속 추론을 제공합니다. Groq Plugin은 OpenAI 호환 채팅 제공자와 오디오 미디어 이해 제공자를 모두 등록합니다.

| 속성                   | 값                                       |
| ---------------------- | ---------------------------------------- |
| 제공자 ID              | `groq`                                   |
| Plugin                 | 공식 외부 패키지                         |
| 인증 환경 변수         | `GROQ_API_KEY`                           |
| API                    | OpenAI 호환(`openai-completions`)        |
| 기본 URL               | `https://api.groq.com/openai/v1`         |
| 오디오 전사            | `whisper-large-v3-turbo`(기본값)         |
| 권장 기본 채팅 모델    | `groq/llama-3.3-70b-versatile`           |

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작하십시오.

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="API 키 가져오기">
    [console.groq.com/keys](https://console.groq.com/keys)에서 API 키를 생성하십시오.
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
  <Step title="카탈로그에 접근할 수 있는지 확인">
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

OpenClaw는 추론 및 비추론 항목을 모두 포함하는 매니페스트 기반 Groq 카탈로그를 제공합니다. 설치된 버전의 정적 항목을 확인하려면 `openclaw models list --provider groq`를 실행하고, Groq의 공식 목록을 확인하려면 [console.groq.com/docs/models](https://console.groq.com/docs/models)를 참조하십시오.

| 모델 참조                                        | 이름                    | 추론      | 입력          | 컨텍스트 |
| ------------------------------------------------ | ----------------------- | --------- | ------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | 아니요    | 텍스트        | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | 아니요    | 텍스트        | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | 아니요    | 텍스트 + 이미지 | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | 예        | 텍스트        | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | 예        | 텍스트        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | 예        | 텍스트        | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | 예        | 텍스트        | 131,072  |
| `groq/groq/compound`                             | Compound                | 예        | 텍스트        | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | 예        | 텍스트        | 131,072  |

<Tip>
  카탈로그는 OpenClaw 릴리스마다 변경됩니다. `openclaw models list --provider groq`는 설치된 버전이 알고 있는 항목을 표시합니다. 새로 추가되거나 지원 중단된 모델은 [console.groq.com/docs/models](https://console.groq.com/docs/models)와 대조하여 확인하십시오.
</Tip>

## 추론 모델

Groq 추론 모델(위 표에서 `reasoning: true`)은 OpenClaw의 공통 `/think` 수준을 `low`, `medium`, `high` 중 하나의 `reasoning_effort` 값에 매핑합니다. `/think off` 또는 `/think none`은 비활성화 값을 전송하는 대신 요청에서 `reasoning_effort`를 생략합니다.

공통 `/think` 수준과 OpenClaw가 제공자별로 이를 변환하는 방법은 [사고 모드](/ko/tools/thinking)를 참조하십시오.

## 오디오 전사

Groq Plugin은 음성 메시지를 공통 `tools.media.audio` 인터페이스를 통해 전사할 수 있도록 **오디오 미디어 이해 제공자**도 등록합니다.

| 속성             | 값                                        |
| ---------------- | ----------------------------------------- |
| 공통 구성 경로   | `tools.media.audio`                       |
| 기본 URL         | `https://api.groq.com/openai/v1`          |
| 기본 모델        | `whisper-large-v3-turbo`                  |
| 자동 우선순위    | 20                                        |
| API 엔드포인트   | OpenAI 호환 `/audio/transcriptions`       |

Groq를 기본 오디오 백엔드로 설정하려면 다음과 같이 구성하십시오.

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
  <Accordion title="데몬의 환경 변수 가용성">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우 `GROQ_API_KEY`는 대화형 셸뿐만 아니라 해당 프로세스에서도 접근할 수 있어야 합니다.

    <Warning>
      대화형 셸에서만 내보낸 키는 해당 환경도 가져오도록 설정하지 않는 한 launchd 또는 systemd 데몬에 적용되지 않습니다. Gateway 프로세스에서 키를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하십시오.
    </Warning>

  </Accordion>

  <Accordion title="사용자 지정 Groq 모델 ID">
    OpenClaw는 런타임에 모든 Groq 모델 ID를 허용합니다. Groq에 표시된 정확한 ID 앞에 `groq/`를 붙여 사용하십시오. 정적 카탈로그는 일반적인 사례를 다루며, 카탈로그에 없는 ID에는 기본 OpenAI 호환 템플릿이 적용됩니다.

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
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="사고 모드" href="/ko/tools/thinking" icon="brain">
    추론 노력 수준과 제공자 정책 간의 상호작용입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 및 오디오 설정을 포함한 전체 구성 스키마입니다.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 대시보드, API 문서 및 요금입니다.
  </Card>
</CardGroup>
