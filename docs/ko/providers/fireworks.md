---
read_when:
    - OpenClaw에서 Fireworks를 사용하려고 합니다
    - Fireworks API 키 환경 변수 또는 기본 모델 ID가 필요합니다
    - Fireworks에서 Kimi의 추론 비활성화 동작을 디버깅하고 있습니다
summary: Fireworks 설정(인증 + 모델 선택)
title: 불꽃놀이
x-i18n:
    generated_at: "2026-06-27T18:02:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai)는 OpenAI 호환 API를 통해 오픈 웨이트 및 라우팅된 모델을 노출합니다. 공식 Fireworks 제공자 Plugin을 설치하면 미리 카탈로그화된 두 Kimi 모델과 런타임의 모든 Fireworks 모델 또는 라우터 id를 사용할 수 있습니다.

| 속성            | 값                                                     |
| --------------- | ------------------------------------------------------ |
| 제공자 id       | `fireworks` (별칭: `fireworks-ai`)                     |
| 패키지          | `@openclaw/fireworks-provider`                         |
| 인증 env var    | `FIREWORKS_API_KEY`                                    |
| 온보딩 플래그   | `--auth-choice fireworks-api-key`                      |
| 직접 CLI 플래그 | `--fireworks-api-key <key>`                            |
| API             | OpenAI 호환 (`openai-completions`)                     |
| 기본 URL        | `https://api.fireworks.ai/inference/v1`                |
| 기본 모델       | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| 기본 별칭       | `Kimi K2.5 Turbo`                                      |

## 시작하기

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
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

    온보딩은 인증 프로필의 `fireworks` 제공자에 대해 키를 저장하고 **Fire Pass** Kimi K2.5 Turbo 라우터를 기본 모델로 설정합니다.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    목록에는 `Kimi K2.6` 및 `Kimi K2.5 Turbo (Fire Pass)`가 포함되어야 합니다. `FIREWORKS_API_KEY`를 확인할 수 없으면 `openclaw models status --json`은 누락된 자격 증명을 `auth.unusableProfiles` 아래에 보고합니다.

  </Step>
</Steps>

## 비대화형 설정

스크립트 또는 CI 설치의 경우 명령줄에서 모든 항목을 전달하세요.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 기본 제공 카탈로그

| 모델 ref                                               | 이름                        | 입력         | 컨텍스트 | 최대 출력 | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | -------- | --------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | 텍스트 + 이미지 | 262,144 | 262,144   | 강제로 끔            |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | 텍스트 + 이미지 | 256,000 | 256,000   | 강제로 끔 (기본값)   |

<Note>
  Fireworks가 프로덕션에서 Kimi thinking 매개변수를 거부하므로 OpenClaw는 모든 Fireworks Kimi 모델을 `thinking: off`로 고정합니다. 동일한 모델을 [Moonshot](/ko/providers/moonshot)을 통해 직접 라우팅하면 Kimi 추론 출력을 보존합니다. 제공자 간 전환은 [thinking 모드](/ko/tools/thinking)를 참조하세요.
</Note>

## 사용자 지정 Fireworks 모델 id

OpenClaw는 런타임에 모든 Fireworks 모델 또는 라우터 id를 허용합니다. Fireworks에 표시된 정확한 id를 사용하고 앞에 `fireworks/`를 붙이세요. 동적 해석은 Fire Pass 템플릿(텍스트 + 이미지 입력, OpenAI 호환 API, 기본 비용 0)을 복제하며, id가 Kimi 패턴과 일치하면 thinking을 자동으로 비활성화합니다. GLM 동적 id는 이미지 입력이 있는 사용자 지정 모델 항목을 구성하지 않는 한 텍스트 전용으로 표시됩니다.

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
  <Accordion title="How model id prefixing works">
    OpenClaw의 모든 Fireworks 모델 ref는 `fireworks/`로 시작하고 그 뒤에 Fireworks 플랫폼의 정확한 id 또는 라우터 경로가 옵니다. 예:

    - 라우터 모델: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 직접 모델: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw는 API 요청을 구성할 때 `fireworks/` 접두사를 제거하고, 남은 경로를 OpenAI 호환 `model` 필드로 Fireworks 엔드포인트에 전송합니다.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks K2.6은 Kimi가 Moonshot 자체 API를 통해 thinking을 지원하더라도 요청에 `reasoning_*` 매개변수가 포함되면 400을 반환합니다. 제공자 정책(`extensions/fireworks/thinking-policy.ts`)은 Kimi 모델 id에 대해 `off` thinking 수준만 알리므로, 수동 `/think` 전환과 제공자 정책 표면이 런타임 계약과 정렬된 상태를 유지합니다.

    Kimi 추론을 종단 간으로 사용하려면 [Moonshot 제공자](/ko/providers/moonshot)를 구성하고 동일한 모델을 통해 라우팅하세요.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우 Fireworks 키는 대화형 셸뿐 아니라 해당 프로세스에서도 보여야 합니다.

    <Warning>
      대화형 셸에서만 내보낸 키는 해당 환경도 그곳으로 가져오지 않는 한 launchd 또는 systemd 데몬에 도움이 되지 않습니다. Gateway 프로세스에서 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하세요.
    </Warning>

    macOS에서 `openclaw gateway install`은 이미 `~/.openclaw/.env`를 LaunchAgent 환경 파일에 연결합니다. 키를 교체한 후 install을 다시 실행하거나 `openclaw doctor --fix`를 실행하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model providers" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 ref, 장애 조치 동작 선택.
  </Card>
  <Card title="Thinking modes" href="/ko/tools/thinking" icon="brain">
    `/think` 수준, 제공자 정책, 추론 가능 모델 라우팅.
  </Card>
  <Card title="Moonshot" href="/ko/providers/moonshot" icon="moon">
    Moonshot 자체 API를 통해 네이티브 thinking 출력으로 Kimi를 실행합니다.
  </Card>
  <Card title="Troubleshooting" href="/ko/help/troubleshooting" icon="wrench">
    일반 문제 해결 및 FAQ.
  </Card>
</CardGroup>
