---
read_when:
    - OpenClaw에서 Groq를 사용하고 싶습니다
    - API 키 환경 변수 또는 CLI 인증 선택지가 필요합니다
summary: Groq 설정(인증 + 모델 선택)
title: Groq
x-i18n:
    generated_at: "2026-04-12T23:31:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com)는 맞춤형 LPU 하드웨어를 사용해 오픈소스 모델(Llama, Gemma, Mistral 등)에 대해 초고속 추론을 제공합니다. OpenClaw는 OpenAI 호환 API를 통해 Groq에 연결합니다.

| Property | Value             |
| -------- | ----------------- |
| Provider | `groq`            |
| Auth     | `GROQ_API_KEY`    |
| API      | OpenAI 호환       |

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

## 사용 가능한 모델

Groq의 모델 카탈로그는 자주 변경됩니다. 현재 사용 가능한 모델을 보려면 `openclaw models list | grep groq`를 실행하거나 [console.groq.com/docs/models](https://console.groq.com/docs/models)를 확인하세요.

| Model                       | 참고                             |
| --------------------------- | -------------------------------- |
| **Llama 3.3 70B Versatile** | 범용, 큰 컨텍스트                |
| **Llama 3.1 8B Instant**    | 빠르고 가벼움                    |
| **Gemma 2 9B**              | 작고 효율적                      |
| **Mixtral 8x7B**            | MoE 아키텍처, 강력한 reasoning   |

<Tip>
계정에서 사용할 수 있는 최신 모델 목록은 `openclaw models list --provider groq`를 사용하세요.
</Tip>

## 오디오 전사

Groq는 빠른 Whisper 기반 오디오 전사도 제공합니다. 미디어 이해 provider로 구성하면, OpenClaw는 공유 `tools.media.audio` 표면을 통해 음성 메시지를 전사하기 위해 Groq의 `whisper-large-v3-turbo` 모델을 사용합니다.

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
    | Property | Value |
    |----------|-------|
    | 공유 구성 경로 | `tools.media.audio` |
    | 기본 base URL   | `https://api.groq.com/openai/v1` |
    | 기본 모델      | `whisper-large-v3-turbo` |
    | API 엔드포인트       | OpenAI 호환 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="환경 참고">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우, 해당 프로세스에서 `GROQ_API_KEY`를 사용할 수 있어야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`).

    <Warning>
    대화형 셸에만 설정된 키는 데몬이 관리하는 Gateway 프로세스에서는 보이지 않습니다. 지속적으로 사용할 수 있게 하려면 `~/.openclaw/.env` 또는 `env.shellEnv` 구성을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider 및 오디오 설정을 포함한 전체 구성 스키마입니다.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 대시보드, API 문서 및 가격 정보입니다.
  </Card>
  <Card title="Groq 모델 목록" href="https://console.groq.com/docs/models" icon="list">
    공식 Groq 모델 카탈로그입니다.
  </Card>
</CardGroup>
