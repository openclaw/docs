---
read_when:
    - OpenClaw에서 Cerebras를 사용하려고 합니다
    - Cerebras API 키 환경 변수 또는 CLI 인증 선택 항목이 필요합니다
summary: Cerebras 설정(인증 + 모델 선택)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T06:36:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai)는 맞춤형 추론 하드웨어에서 고속 OpenAI 호환 추론을 제공합니다. OpenClaw에는 정적 4개 모델 카탈로그가 포함된 번들 Cerebras 제공자 Plugin이 포함되어 있습니다.

| 속성            | 값                                       |
| --------------- | ---------------------------------------- |
| 제공자 ID       | `cerebras`                               |
| Plugin          | 번들, `enabledByDefault: true`           |
| 인증 환경 변수  | `CEREBRAS_API_KEY`                       |
| 온보딩 플래그   | `--auth-choice cerebras-api-key`         |
| 직접 CLI 플래그 | `--cerebras-api-key <key>`               |
| API             | OpenAI 호환 (`openai-completions`)       |
| 기본 URL        | `https://api.cerebras.ai/v1`             |
| 기본 모델       | `cerebras/zai-glm-4.7`                   |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [Cerebras Cloud Console](https://cloud.cerebras.ai)에서 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider cerebras
    ```

    목록에는 번들 모델 4개가 모두 포함되어야 합니다. `CEREBRAS_API_KEY`가 확인되지 않으면 `openclaw models status --json`이 누락된 자격 증명을 `auth.unusableProfiles` 아래에 보고합니다.

  </Step>
</Steps>

## 비대화형 설정

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 내장 카탈로그

OpenClaw는 공개 OpenAI 호환 엔드포인트를 반영하는 정적 Cerebras 카탈로그를 제공합니다. 네 모델 모두 128k 컨텍스트와 최대 출력 토큰 8,192개를 공유합니다.

| 모델 ref                                 | 이름                 | 추론 | 참고 사항                            |
| ----------------------------------------- | -------------------- | ---- | ------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 예   | 기본 모델; 프리뷰 추론 모델          |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 예   | 프로덕션 추론 모델                   |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 아니요 | 프리뷰 비추론 모델                   |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 아니요 | 프로덕션 속도 중심 모델              |

<Warning>
  Cerebras는 `zai-glm-4.7` 및 `qwen-3-235b-a22b-instruct-2507`을 프리뷰 모델로 표시하며, `llama3.1-8b`와 `qwen-3-235b-a22b-instruct-2507`은 2026년 5월 27일에 지원 중단 예정으로 문서화되어 있습니다. 프로덕션 워크로드에 사용하기 전에 Cerebras의 지원 모델 페이지를 확인하세요.
</Warning>

## 수동 구성

번들 Plugin 덕분에 일반적으로 API 키만 있으면 됩니다. 모델 메타데이터를 재정의하거나 정적 카탈로그에 대해 `mode: "merge"`로 실행하려는 경우 명시적인 `models.providers.cerebras` 구성을 사용하세요.

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
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
  Gateway가 데몬(launchd, systemd, Docker)으로 실행되는 경우 `CEREBRAS_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다. 예를 들어 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 제공할 수 있습니다. `~/.profile`에만 있는 키는 env를 별도로 가져오지 않는 한 관리형 서비스에 도움이 되지 않습니다.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 refs, 장애 조치 동작 선택.
  </Card>
  <Card title="사고 모드" href="/ko/tools/thinking" icon="brain">
    추론 가능 Cerebras 모델 2개에 대한 추론 노력 수준.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값 및 모델 구성.
  </Card>
  <Card title="모델 FAQ" href="/ko/help/faq-models" icon="circle-question">
    인증 프로필, 모델 전환, "no profile" 오류 해결.
  </Card>
</CardGroup>
