---
read_when:
    - OpenClaw에서 Tencent Hy3 preview를 사용하려고 합니다
    - TokenHub API 키 설정이 필요합니다
summary: Hy3 미리보기를 위한 Tencent Cloud TokenHub 설정
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:04:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

공식 Tencent Cloud 제공자 Plugin을 설치하여 OpenAI 호환 API를 사용하는 TokenHub 엔드포인트(`tencent-tokenhub`)를 통해 Tencent Hy3 preview에 액세스합니다.

| 속성             | 값                                                    |
| ---------------- | ----------------------------------------------------- |
| 제공자 ID        | `tencent-tokenhub`                                    |
| 패키지           | `@openclaw/tencent-provider`                          |
| 인증 환경 변수   | `TOKENHUB_API_KEY`                                    |
| 온보딩 플래그    | `--auth-choice tokenhub-api-key`                      |
| 직접 CLI 플래그  | `--tokenhub-api-key <key>`                            |
| API              | OpenAI 호환(`openai-completions`)                     |
| 기본 기본 URL    | `https://tokenhub.tencentmaas.com/v1`                 |
| 전역 기본 URL    | `https://tokenhub-intl.tencentmaas.com/v1` (재정의)   |
| 기본 모델        | `tencent-tokenhub/hy3-preview`                        |

## 빠른 시작

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    Tencent Cloud TokenHub에서 API 키를 만듭니다. 키에 제한된 액세스 범위를 선택하는 경우 허용된 모델에 **Hy3 preview**를 포함하세요.
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## 비대화형 설정

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## 기본 제공 카탈로그

| 모델 참조                     | 이름                   | 입력 | 컨텍스트 | 최대 출력 | 참고                    |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | 기본값; 추론 지원 |

Hy3 preview는 추론, 긴 컨텍스트 지시 따르기, 코드, 에이전트 워크플로를 위한 Tencent Hunyuan의 대형 MoE 언어 모델입니다. Tencent의 OpenAI 호환 예제는 모델 ID로 `hy3-preview`를 사용하며, 표준 chat-completions 도구 호출과 `reasoning_effort`를 지원합니다.

<Tip>
  모델 ID는 `hy3-preview`입니다. Tencent의 `HY-3D-*` 모델과 혼동하지 마세요. 해당 모델은 3D 생성 API이며, 이 제공자가 구성하는 OpenClaw 채팅 모델이 아닙니다.
</Tip>

## 계층형 가격

제공자 카탈로그는 입력 창 길이에 따라 확장되는 계층형 비용 메타데이터를 제공하므로, 수동 재정의 없이 비용 추정치가 채워집니다.

| 입력 토큰 범위 | 입력 요율 | 출력 요율 | 캐시 읽기 |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

요율은 Tencent가 고지한 대로 백만 토큰당 USD 기준입니다. 다른 표면이 필요한 경우에만 `models.providers.tencent-tokenhub` 아래의 가격을 재정의하세요.

## 고급 구성

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw의 기본값은 Tencent Cloud의 `https://tokenhub.tencentmaas.com/v1` 엔드포인트입니다. Tencent는 국제 TokenHub 엔드포인트도 문서화하고 있습니다.

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    TokenHub 계정이나 리전에 필요한 경우에만 엔드포인트를 재정의하세요.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우 `TOKENHUB_API_KEY`가 해당 프로세스에 표시되어야 합니다. launchd, systemd 또는 Docker exec 환경에서 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 설정하세요.

    <Warning>
      대화형 셸에서만 내보낸 키는 관리형 Gateway 프로세스에 표시되지 않습니다. 지속적인 가용성을 위해 env 파일이나 구성 지점을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model providers" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration" icon="gear">
    제공자 설정을 포함한 전체 구성 스키마.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud의 TokenHub 제품 페이지.
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview 세부 정보와 벤치마크.
  </Card>
</CardGroup>
