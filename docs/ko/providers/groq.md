---
read_when:
    - OpenClaw와 함께 Groq를 사용하려는 경우
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
summary: Groq 설정(인증 + 모델 선택)
title: Groq
x-i18n:
    generated_at: "2026-05-02T21:11:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com)는 커스텀 LPU 하드웨어를 사용해 오픈 소스 모델
(Llama, Gemma, Mistral 등)에서 초고속 추론을 제공합니다. OpenClaw는
OpenAI 호환 API를 통해 Groq에 연결합니다.

| 속성 | 값                |
| -------- | ----------------- |
| 공급자 | `groq`            |
| 인증     | `GROQ_API_KEY`    |
| API      | OpenAI 호환 |

## 시작하기

<Steps>
  <Step title="API 키 가져오기">
    [console.groq.com/keys](https://console.groq.com/keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="API 키 설정">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

## 기본 제공 카탈로그

OpenClaw는 빠른 공급자 필터링 모델 목록 표시를 위해 매니페스트 기반 Groq 카탈로그를
제공합니다. 번들된 행을 보려면 `openclaw models list --all --provider groq`를 실행하거나
[console.groq.com/docs/models](https://console.groq.com/docs/models)를 확인하세요.

| 모델                        | 참고 사항                          |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 범용, 큰 컨텍스트                  |
| **Llama 3.1 8B Instant**    | 빠르고 경량                        |
| **Gemma 2 9B**              | 컴팩트하고 효율적                  |
| **Mixtral 8x7B**            | MoE 아키텍처, 강력한 추론          |

<Tip>
이 OpenClaw 버전에 알려진 매니페스트 기반 Groq 행을 보려면
`openclaw models list --all --provider groq`를 사용하세요.
</Tip>

## 추론 모델

OpenClaw는 공유 `/think` 수준을 Groq의 모델별 `reasoning_effort` 값에
매핑합니다. `qwen/qwen3-32b`의 경우 thinking을 비활성화하면 `none`을 보내고,
thinking을 활성화하면 `default`를 보냅니다. Groq GPT-OSS 추론 모델의 경우
OpenClaw는 `low`, `medium` 또는 `high`를 보냅니다. 비활성화된 thinking은
`reasoning_effort`를 생략하는데, 해당 모델들이 비활성화 값을 지원하지 않기 때문입니다.

## 오디오 전사

Groq는 빠른 Whisper 기반 오디오 전사도 제공합니다. 미디어 이해 공급자로 설정하면
OpenClaw는 공유 `tools.media.audio` 표면을 통해 음성 메시지를 전사하는 데
Groq의 `whisper-large-v3-turbo` 모델을 사용합니다.

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
  <Accordion title="오디오 전사 세부 정보">
    | 속성 | 값 |
    |----------|-------|
    | 공유 설정 경로 | `tools.media.audio` |
    | 기본 base URL   | `https://api.groq.com/openai/v1` |
    | 기본 모델      | `whisper-large-v3-turbo` |
    | API 엔드포인트       | OpenAI 호환 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="환경 참고 사항">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `GROQ_API_KEY`를
    해당 프로세스에서 사용할 수 있는지 확인하세요(예: `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해).

    <Warning>
    대화형 셸에서만 설정된 키는 데몬이 관리하는 gateway 프로세스에 표시되지 않습니다.
    지속적인 사용 가능성을 위해 `~/.openclaw/.env` 또는 `env.shellEnv` 설정을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="설정 참조" href="/ko/gateway/configuration-reference" icon="gear">
    공급자 및 오디오 설정을 포함한 전체 설정 스키마입니다.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 대시보드, API 문서 및 가격입니다.
  </Card>
  <Card title="Groq 모델 목록" href="https://console.groq.com/docs/models" icon="list">
    공식 Groq 모델 카탈로그입니다.
  </Card>
</CardGroup>
