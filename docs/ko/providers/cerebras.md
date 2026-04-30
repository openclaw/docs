---
read_when:
    - OpenClaw에서 Cerebras를 사용하려고 합니다
    - Cerebras API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
summary: Cerebras 설정(인증 + 모델 선택)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T06:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai)는 고속 OpenAI 호환 추론을 제공합니다.

| 속성     | 값                           |
| -------- | ---------------------------- |
| 제공자   | `cerebras`                   |
| 인증     | `CEREBRAS_API_KEY`           |
| API      | OpenAI 호환                  |
| 기본 URL | `https://api.cerebras.ai/v1` |

## 시작하기

<Steps>
  <Step title="Get an API key">
    [Cerebras Cloud Console](https://cloud.cerebras.ai)에서 API 키를 생성합니다.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### 비대화형 설정

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 내장 카탈로그

OpenClaw는 공개 OpenAI 호환 엔드포인트를 위한 정적 Cerebras 카탈로그를 함께 제공합니다.

| 모델 ref                                 | 이름                 | 참고 사항                              |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 기본 모델, 미리 보기 추론 모델        |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 프로덕션 추론 모델                     |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 미리 보기 비추론 모델                  |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 프로덕션 속도 중심 모델                |

<Warning>
Cerebras는 `zai-glm-4.7` 및 `qwen-3-235b-a22b-instruct-2507`을 미리 보기 모델로 표시하며, `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507`은 2026년 5월 27일에 지원 중단 예정으로 문서화되어 있습니다. 프로덕션에서 사용하기 전에 Cerebras의 지원 모델 페이지를 확인하세요.
</Warning>

## 수동 구성

번들 Plugin을 사용하면 일반적으로 API 키만 있으면 됩니다. 모델 메타데이터를 재정의하려는 경우 명시적인
`models.providers.cerebras` 구성을 사용하세요.

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Gateway가 daemon(launchd/systemd)으로 실행되는 경우 `CEREBRAS_API_KEY`가
해당 프로세스에서 사용 가능해야 합니다. 예를 들어 `~/.openclaw/.env` 또는
`env.shellEnv`를 통해 제공할 수 있습니다.
</Note>
