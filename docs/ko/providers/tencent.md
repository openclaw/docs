---
read_when:
    - OpenClaw에서 Tencent Hy3 프리뷰를 사용하려는 경우
    - TokenHub API 키 설정이 필요합니다
summary: Hy3 preview를 위한 Tencent Cloud TokenHub 설정
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T06:38:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud는 OpenClaw에 번들 제공자 Plugin으로 포함됩니다. OpenAI 호환 API를 사용해 TokenHub 엔드포인트(`tencent-tokenhub`)를 통해 Tencent Hy3 preview에 접근할 수 있습니다.

| 속성             | 값                                                    |
| ---------------- | ----------------------------------------------------- |
| 제공자 id        | `tencent-tokenhub`                                    |
| Plugin           | 번들, `enabledByDefault: true`                        |
| 인증 env var     | `TOKENHUB_API_KEY`                                    |
| 온보딩 플래그    | `--auth-choice tokenhub-api-key`                      |
| 직접 CLI 플래그  | `--tokenhub-api-key <key>`                            |
| API              | OpenAI 호환(`openai-completions`)                     |
| 기본 base URL    | `https://tokenhub.tencentmaas.com/v1`                 |
| 전역 base URL    | `https://tokenhub-intl.tencentmaas.com/v1` (재정의)   |
| 기본 모델        | `tencent-tokenhub/hy3-preview`                        |

## 빠른 시작

<Steps>
  <Step title="TokenHub API 키 생성">
    Tencent Cloud TokenHub에서 API 키를 생성합니다. 키에 제한된 접근 범위를 선택하는 경우, 허용된 모델에 **Hy3 preview**를 포함하세요.
  </Step>
  <Step title="온보딩 실행">
    <CodeGroup>

```bash 온보딩
openclaw onboard --auth-choice tokenhub-api-key
```

```bash 직접 플래그
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env만
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="모델 확인">
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

## 내장 카탈로그

| 모델 ref                       | 이름                   | 입력 | 컨텍스트 | 최대 출력 | 참고                       |
| ------------------------------ | ---------------------- | ---- | -------- | --------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | 텍스트 | 256,000 | 64,000    | 기본값; 추론 활성화됨      |

Hy3 preview는 추론, 긴 컨텍스트 지시 따르기, 코드, 에이전트 워크플로를 위한 Tencent Hunyuan의 대형 MoE 언어 모델입니다. Tencent의 OpenAI 호환 예시는 `hy3-preview`를 모델 id로 사용하며, 표준 채팅 완성 도구 호출과 `reasoning_effort`를 지원합니다.

<Tip>
  모델 id는 `hy3-preview`입니다. 3D 생성 API이며 이 제공자가 구성하는 OpenClaw 채팅 모델이 아닌 Tencent의 `HY-3D-*` 모델과 혼동하지 마세요.
</Tip>

## 계층형 가격

번들 카탈로그에는 입력 창 길이에 따라 확장되는 계층형 비용 메타데이터가 포함되어 있어, 수동 재정의 없이 비용 추정값이 채워집니다.

| 입력 토큰 범위  | 입력 요율 | 출력 요율 | 캐시 읽기 |
| ---------------- | --------- | --------- | --------- |
| 0 - 16,000       | 0.176     | 0.587     | 0.059     |
| 16,000 - 32,000  | 0.235     | 0.939     | 0.088     |
| 32,000+          | 0.293     | 1.173     | 0.117     |

요율은 Tencent가 공시한 USD 기준 백만 토큰당 가격입니다. 다른 표면이 필요한 경우에만 `models.providers.tencent-tokenhub` 아래에서 가격을 재정의하세요.

## 고급 구성

<AccordionGroup>
  <Accordion title="엔드포인트 재정의">
    OpenClaw는 기본적으로 Tencent Cloud의 `https://tokenhub.tencentmaas.com/v1` 엔드포인트를 사용합니다. Tencent는 국제 TokenHub 엔드포인트도 문서화합니다.

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    TokenHub 계정이나 리전에서 요구하는 경우에만 엔드포인트를 재정의하세요.

  </Accordion>

  <Accordion title="데몬의 환경 사용 가능성">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우, `TOKENHUB_API_KEY`가 해당 프로세스에 보여야 합니다. launchd, systemd 또는 Docker exec 환경이 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 설정하세요.

    <Warning>
      `~/.profile`에만 설정된 키는 관리형 gateway 프로세스에 보이지 않습니다. 지속적인 사용 가능성을 위해 env 파일이나 구성 seam을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 ref, 장애 조치 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration" icon="gear">
    제공자 설정을 포함한 전체 구성 스키마.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud의 TokenHub 제품 페이지.
  </Card>
  <Card title="Hy3 preview 모델 카드" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview 세부 정보 및 벤치마크.
  </Card>
</CardGroup>
