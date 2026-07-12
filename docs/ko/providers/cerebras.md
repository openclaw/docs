---
read_when:
    - OpenClaw에서 Cerebras를 사용하려고 합니다
    - Cerebras API 키 환경 변수 또는 CLI 인증 옵션이 필요합니다
summary: Cerebras 설정(인증 + 모델 선택)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T01:06:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai)는 맞춤형 추론 하드웨어에서 고속 OpenAI 호환 추론을 제공합니다. Plugin에는 4개 모델의 정적 카탈로그가 포함되어 있습니다(실시간 검색 없음).

| 속성            | 값                                                        |
| --------------- | --------------------------------------------------------- |
| 공급자 ID       | `cerebras`                                                |
| Plugin          | 공식 외부 패키지 (`@openclaw/cerebras-provider`)          |
| 인증 환경 변수  | `CEREBRAS_API_KEY`                                        |
| 온보딩 플래그   | `--auth-choice cerebras-api-key`                          |
| 직접 CLI 플래그 | `--cerebras-api-key <key>`                                |
| API             | OpenAI 호환 (`openai-completions`)                        |
| 기본 URL        | `https://api.cerebras.ai/v1`                              |
| 기본 모델       | `cerebras/zai-glm-4.7`                                    |

## Plugin 설치

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="API 키 발급">
    [Cerebras Cloud Console](https://cloud.cerebras.ai)에서 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    <CodeGroup>

```bash 온보딩
openclaw onboard --auth-choice cerebras-api-key
```

```bash 직접 플래그
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash 환경 변수만 사용
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider cerebras
    ```

    정적 모델 4개를 모두 나열합니다. `CEREBRAS_API_KEY`를 확인할 수 없으면 `openclaw models status --json`이 `auth.unusableProfiles` 아래에 누락된 자격 증명을 보고합니다.

  </Step>
</Steps>

## 비대화형 설정

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 기본 제공 카탈로그

4개 모델은 모두 128k 컨텍스트 창과 최대 8,192개의 출력 토큰을 지원합니다.

| 모델 참조                                 | 이름                 | 추론 | 참고 사항                         |
| ----------------------------------------- | -------------------- | ---- | --------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 예   | 기본 모델, 미리 보기 추론 모델    |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 예   | 프로덕션 추론 모델                |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 아니요 | 미리 보기 비추론 모델           |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 아니요 | 프로덕션 속도 최적화 모델       |

<Warning>
Cerebras는 `zai-glm-4.7` 및 `qwen-3-235b-a22b-instruct-2507`을 미리 보기 모델로 표시하며, `llama3.1-8b`와 `qwen-3-235b-a22b-instruct-2507`은 2026년 5월 27일에 지원 중단될 예정이라고 문서에 명시되어 있습니다. 프로덕션 워크로드에 사용하기 전에 Cerebras의 [지원 모델 페이지](https://inference-docs.cerebras.ai/models/overview)를 확인하세요.
</Warning>

## 수동 구성

대부분의 설정에는 API 키만 필요합니다. 모델 메타데이터를 재정의하거나 정적 카탈로그에 대해 `mode: "merge"`로 실행하려면 명시적인 `models.providers.cerebras` 구성을 사용하세요.

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
Gateway가 데몬(launchd, systemd, Docker)으로 실행되는 경우 해당 프로세스에서 `CEREBRAS_API_KEY`를 사용할 수 있는지 확인하세요. 예를 들어 `~/.openclaw/.env`에 지정하거나 `env.shellEnv`를 통해 제공할 수 있습니다. 대화형 셸에서만 내보낸 키는 환경을 별도로 가져오지 않는 한 관리형 서비스에 적용되지 않습니다.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 공급자" href="/ko/concepts/model-providers" icon="layers">
    공급자와 모델 참조를 선택하고 장애 조치 동작을 구성하는 방법입니다.
  </Card>
  <Card title="사고 모드" href="/ko/tools/thinking" icon="brain">
    추론을 지원하는 두 Cerebras 모델의 추론 노력 수준입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값 및 모델 구성입니다.
  </Card>
  <Card title="모델 FAQ" href="/ko/help/faq-models" icon="circle-question">
    인증 프로필, 모델 전환 및 "프로필 없음" 오류 해결 방법입니다.
  </Card>
</CardGroup>
