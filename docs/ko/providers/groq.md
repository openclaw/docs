---
read_when:
    - OpenClaw와 함께 Groq을 사용하려고 합니다
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
summary: Groq 설정(인증 + 모델 선택)
title: Groq
x-i18n:
    generated_at: "2026-04-30T06:46:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com)는 맞춤형 LPU 하드웨어를 사용해 오픈 소스 모델
(Llama, Gemma, Mistral 등)에 초고속 추론을 제공합니다. OpenClaw는
OpenAI 호환 API를 통해 Groq에 연결합니다.

| 속성 | 값                |
| -------- | ----------------- |
| 제공자 | `groq`            |
| 인증     | `GROQ_API_KEY`    |
| API      | OpenAI 호환 |

## 시작하기

<Steps>
  <Step title="Get an API key">
    [console.groq.com/keys](https://console.groq.com/keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Set a default model">
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

Groq의 모델 카탈로그는 자주 변경됩니다. 현재 사용 가능한 모델을 보려면
`openclaw models list | grep groq`를 실행하거나
[console.groq.com/docs/models](https://console.groq.com/docs/models)를 확인하세요.

| 모델                        | 참고                               |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 범용, 큰 컨텍스트                  |
| **Llama 3.1 8B Instant**    | 빠르고 경량                        |
| **Gemma 2 9B**              | 컴팩트하고 효율적                  |
| **Mixtral 8x7B**            | MoE 아키텍처, 강력한 추론          |

<Tip>
계정에서 사용할 수 있는 최신 모델 목록을 보려면
`openclaw models list --provider groq`를 사용하세요.
</Tip>

## 추론 모델

OpenClaw는 공유 `/think` 수준을 Groq의 모델별 `reasoning_effort` 값에 매핑합니다.
`qwen/qwen3-32b`의 경우, 사고가 비활성화되면 `none`을 보내고 활성화되면
`default`를 보냅니다. Groq GPT-OSS 추론 모델의 경우 OpenClaw는 `low`,
`medium` 또는 `high`를 보냅니다. 사고가 비활성화되면 해당 모델이 비활성화 값을
지원하지 않으므로 `reasoning_effort`를 생략합니다.

## 오디오 전사

Groq는 빠른 Whisper 기반 오디오 전사도 제공합니다. 미디어 이해 제공자로
설정되면 OpenClaw는 Groq의 `whisper-large-v3-turbo` 모델을 사용해
공유 `tools.media.audio` 표면을 통해 음성 메시지를 전사합니다.

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
  <Accordion title="Audio transcription details">
    | 속성 | 값 |
    |----------|-------|
    | 공유 설정 경로 | `tools.media.audio` |
    | 기본 베이스 URL | `https://api.groq.com/openai/v1` |
    | 기본 모델      | `whisper-large-v3-turbo` |
    | API 엔드포인트 | OpenAI 호환 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Environment note">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `GROQ_API_KEY`를 해당
    프로세스에서 사용할 수 있는지 확인하세요(예: `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해).

    <Warning>
    대화형 셸에서만 설정한 키는 데몬으로 관리되는 Gateway 프로세스에서
    보이지 않습니다. 지속적으로 사용할 수 있게 하려면 `~/.openclaw/.env` 또는
    `env.shellEnv` 설정을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 및 오디오 설정을 포함한 전체 설정 스키마.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 대시보드, API 문서, 가격.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    공식 Groq 모델 카탈로그.
  </Card>
</CardGroup>
