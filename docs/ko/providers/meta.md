---
read_when:
    - OpenClaw에서 Meta를 사용하려는 경우
    - MODEL_API_KEY 환경 변수 또는 CLI 인증 선택이 필요합니다.
summary: Meta 설정(인증 + muse-spark-1.1 모델 선택)
title: 메타
x-i18n:
    generated_at: "2026-07-12T01:08:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API**는 `muse-spark-1.1` 추론 모델에 OpenAI 호환 **Responses API**(`POST /v1/responses`)를 사용합니다. 이 제공자는 번들 OpenClaw Plugin으로 제공됩니다.

| 속성              | 값                                 |
| ----------------- | ---------------------------------- |
| 제공자 ID         | `meta`                             |
| Plugin            | 번들 제공자                        |
| 인증 환경 변수    | `MODEL_API_KEY`                    |
| 온보딩 플래그     | `--auth-choice meta-api-key`       |
| 직접 CLI 플래그   | `--meta-api-key <key>`             |
| API               | Responses API (`openai-responses`) |
| 기본 URL          | `https://api.meta.ai/v1`           |
| 기본 모델         | `meta/muse-spark-1.1`              |
| 기본 추론 수준    | `high` (`reasoning.effort`)        |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider meta
    ```

    정적 `muse-spark-1.1` 카탈로그 항목을 나열합니다. `MODEL_API_KEY`를 확인할 수 없으면 `openclaw models status --json`이 `auth.unusableProfiles` 아래에 누락된 자격 증명을 보고합니다.

  </Step>
</Steps>

## 비대화형 설정

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## 기본 제공 카탈로그

| 모델 참조             | 이름           | 추론 | 컨텍스트 창 | 최대 출력 |
| --------------------- | -------------- | ---- | ----------- | --------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | 예   | 1,048,576   | 131,072   |

기능:

- 텍스트 및 이미지 입력
- 도구 호출 및 스트리밍
- 추론 수준: `minimal`, `low`, `medium`, `high`, `xhigh`(기본값: `high`)
- 상태 비저장 암호화 추론 재생(`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1`은 `reasoning.effort: "none"`을 허용하지 않습니다. OpenClaw는 이 제공자에서 `--thinking off`를 `minimal`로 매핑합니다.
</Warning>

## 수동 구성

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Gateway가 데몬(launchd, systemd, Docker)으로 실행되는 경우 해당 프로세스에서 `MODEL_API_KEY`를 사용할 수 있는지 확인하세요. 예를 들어 `~/.openclaw/.env` 또는 `env.shellEnv`를 사용할 수 있습니다. 대화형 셸에서만 내보낸 키는 환경을 별도로 가져오지 않는 한 관리형 서비스에 적용되지 않습니다.
</Note>

## 스모크 테스트

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

라이브 테스트는 `POST /v1/responses`에 대해 `muse-spark-1.1`을 사용합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="사고 모드" href="/ko/tools/thinking" icon="brain">
    muse-spark-1.1의 추론 수준입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값 및 모델 구성입니다.
  </Card>
</CardGroup>
