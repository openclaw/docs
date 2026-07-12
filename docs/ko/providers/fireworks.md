---
read_when:
    - OpenClaw에서 Fireworks를 사용하려고 합니다
    - Fireworks API 키 환경 변수 또는 기본 모델 ID가 필요합니다.
    - Fireworks에서 Kimi의 사고 비활성화 동작을 디버깅하고 있습니다
summary: Fireworks 설정(인증 + 모델 선택)
title: 파이어웍스
x-i18n:
    generated_at: "2026-07-12T01:11:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai)는 OpenAI 호환 API를 통해 오픈 웨이트 모델과 라우팅 모델을 제공합니다. 공식 Fireworks 제공자 Plugin을 설치하면 사전 카탈로그에 등록된 두 Kimi 모델과 모든 Fireworks 모델 또는 라우터 ID를 런타임에 사용할 수 있습니다.

| 속성                | 값                                                     |
| ------------------- | ------------------------------------------------------ |
| 제공자 ID           | `fireworks`(별칭: `fireworks-ai`)                      |
| 패키지              | `@openclaw/fireworks-provider`                         |
| 인증 환경 변수      | `FIREWORKS_API_KEY`                                    |
| 온보딩 플래그       | `--auth-choice fireworks-api-key`                      |
| 직접 CLI 플래그     | `--fireworks-api-key <key>`                            |
| API                 | OpenAI 호환(`openai-completions`)                      |
| 기본 URL            | `https://api.fireworks.ai/inference/v1`                |
| 기본 모델           | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| 기본 별칭           | `Kimi K2.5 Turbo`                                      |

## 시작하기

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Fireworks API 키 설정">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    온보딩은 인증 프로필의 `fireworks` 제공자에 키를 저장하고 **Fire Pass** Kimi K2.5 Turbo 라우터를 기본 모델로 설정합니다.

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider fireworks
    ```

    목록에 `Kimi K2.6`과 `Kimi K2.5 Turbo (Fire Pass)`가 포함되어야 합니다. `FIREWORKS_API_KEY`를 확인할 수 없으면 `openclaw models status --json`이 `auth.unusableProfiles` 아래에 누락된 자격 증명을 보고합니다.

  </Step>
</Steps>

## 비대화형 설정

스크립트 또는 CI 설치에서는 모든 항목을 명령줄에 전달합니다.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 기본 제공 카탈로그

| 모델 참조                                               | 이름                        | 입력          | 컨텍스트 | 최대 출력 | 사고                    |
| ------------------------------------------------------- | --------------------------- | ------------- | -------- | --------- | ----------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`         | Kimi K2.6                   | 텍스트 + 이미지 | 262,144  | 262,144   | 강제로 끔               |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`  | Kimi K2.5 Turbo (Fire Pass) | 텍스트 + 이미지 | 256,000  | 256,000   | 강제로 끔(기본값)       |

<Note>
  Fireworks의 Kimi는 요청에서 사고를 명시적으로 비활성화하지 않으면 사고 과정이 사용자에게 표시되는 응답에 노출될 수 있으므로, OpenClaw는 모든 Fireworks Kimi 모델을 `thinking: off`로 고정합니다. 동일한 모델을 [Moonshot](/ko/providers/moonshot)을 통해 직접 라우팅하면 Kimi의 추론 출력이 유지됩니다. 제공자 간 전환 방법은 [사고 모드](/ko/tools/thinking)를 참조하세요.
</Note>

## 사용자 지정 Fireworks 모델 ID

OpenClaw는 런타임에 모든 Fireworks 모델 또는 라우터 ID를 허용합니다. Fireworks에 표시된 정확한 ID 앞에 `fireworks/`를 붙여 사용하세요. 동적 해석은 Fire Pass 템플릿(텍스트 + 이미지 입력, OpenAI 호환 API, 기본 비용 0)을 복제하며, ID가 Kimi 패턴과 일치하면 사고를 자동으로 비활성화합니다. GLM 동적 ID는 이미지 입력을 포함하는 사용자 지정 모델 항목을 구성하지 않는 한 텍스트 전용으로 표시됩니다.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="모델 ID 접두사 지정 방식">
    OpenClaw의 모든 Fireworks 모델 참조는 `fireworks/`로 시작하며, 그 뒤에 Fireworks 플랫폼의 정확한 ID 또는 라우터 경로가 이어집니다. 예:

    - 라우터 모델: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 직접 모델: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw는 API 요청을 구성할 때 `fireworks/` 접두사를 제거하고 나머지 경로를 OpenAI 호환 `model` 필드로 Fireworks 엔드포인트에 전송합니다.

  </Accordion>

  <Accordion title="Kimi에서 사고를 강제로 끄는 이유">
    Fireworks는 별도의 추론 채널 없이 Kimi를 제공하므로 사고 과정이 사용자에게 표시되는 `content` 스트림에 나타날 수 있습니다. OpenClaw는 모든 Fireworks Kimi 요청에서 `thinking: { type: "disabled" }`를 전송하고 페이로드에서 `reasoning`, `reasoning_effort`, `reasoningEffort`를 제거합니다(`extensions/fireworks/stream.ts`). 제공자 정책(`extensions/fireworks/thinking-policy.ts`)은 Kimi 모델 ID에 대해 `off` 사고 수준만 알리므로, 수동 `/think` 전환과 제공자 정책 화면이 런타임 계약에 맞게 유지됩니다.

    Kimi 추론을 처음부터 끝까지 사용하려면 [Moonshot 제공자](/ko/providers/moonshot)를 구성하고 동일한 모델을 이를 통해 라우팅하세요.

  </Accordion>

  <Accordion title="데몬의 환경 사용 가능 여부">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우 Fireworks 키는 대화형 셸뿐 아니라 해당 프로세스에서도 확인할 수 있어야 합니다.

    <Warning>
      대화형 셸에서만 내보낸 키는 해당 환경도 함께 가져오지 않는 한 launchd 또는 systemd 데몬에서 사용할 수 없습니다. Gateway 프로세스에서 키를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`에 키를 설정하세요.
    </Warning>

    OpenClaw는 구성을 불러올 때 `~/.openclaw/.env`를 불러오므로, 그곳에 저장된 키는 모든 플랫폼의 관리형 Gateway 서비스에 전달됩니다. 키를 교체한 후 Gateway를 다시 시작하거나 `openclaw doctor --fix`를 다시 실행하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="사고 모드" href="/ko/tools/thinking" icon="brain">
    `/think` 수준, 제공자 정책, 추론 가능 모델의 라우팅입니다.
  </Card>
  <Card title="Moonshot" href="/ko/providers/moonshot" icon="moon">
    Moonshot 자체 API를 통해 Kimi를 네이티브 사고 출력과 함께 실행합니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 자주 묻는 질문입니다.
  </Card>
</CardGroup>
