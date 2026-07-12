---
read_when:
    - 스크립트 또는 CI에서 온보딩을 자동화하고 있습니다
    - 특정 제공자를 위한 비대화형 예제가 필요합니다
sidebarTitle: CLI automation
summary: OpenClaw CLI의 스크립트 기반 온보딩 및 에이전트 설정
title: CLI 자동화
x-i18n:
    generated_at: "2026-07-12T15:47:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

설정을 스크립트로 자동화하려면 `openclaw onboard --non-interactive`를 사용하십시오. 이 명령에는 `--accept-risk`가 필요합니다. 비대화형 설정은 확인 메시지 없이 자격 증명과 데몬 구성을 기록할 수 있으므로, 이 플래그는 위험을 명시적으로 인정한다는 의미입니다.

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에서는 `--non-interactive --accept-risk`를 명시적으로 전달하십시오.
</Note>

## 기본 비대화형 예시

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

머신이 읽을 수 있는 요약을 출력하려면 `--json`을 추가하십시오.

- `--gateway-port`의 기본값은 `18789`입니다. 재정의할 때만 전달하십시오.
- `--skip-bootstrap`은 자체 워크스페이스를 미리 구성하는 자동화를 위해 기본 워크스페이스 파일 생성을 건너뜁니다.
- `--secret-input-mode ref`는 일반 텍스트 키 대신 환경 변수 기반 참조(`{ source: "env", provider: "default", id: "<ENV_VAR>" }`)를 인증 프로필에 저장합니다. 비대화형 `ref` 모드에서는 제공자 환경 변수가 프로세스 환경에 이미 설정되어 있어야 합니다. 일치하는 환경 변수 없이 인라인 키 플래그를 전달하면 즉시 실패합니다.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## 제공자별 예시

<AccordionGroup>
  <Accordion title="Anthropic API 키 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollama 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Go 카탈로그를 사용하려면 `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`로 변경하십시오.
  </Accordion>
  <Accordion title="Synthetic 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="사용자 지정 제공자 예시">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key`는 선택 사항입니다. 일부 엔드포인트에는 인증이 필요하지 않습니다. 생략하면 온보딩에서 환경의 `CUSTOM_API_KEY`를 확인합니다. `--custom-provider-id`는 선택 사항이며, 생략하면 기본 URL에서 자동으로 파생됩니다. `--custom-compatibility`의 기본값은 `openai`입니다(다른 값: `openai-responses`, `anthropic`).

    OpenClaw는 알려진 비전 모델 ID 패턴(`gpt-4o`, `claude-3/4`, `gemini`, `-vl`/`vision` 접미사 등)을 기반으로 이미지 입력 지원 여부를 추론합니다. 인식되지 않는 비전 모델에서 이미지 입력을 강제로 활성화하려면 `--custom-image-input`을 추가하고, 텍스트 전용으로 강제하려면 `--custom-text-input`을 추가하십시오.

    `apiKey`를 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`로 저장하는 참조 모드 변형은 다음과 같습니다.

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

Anthropic 설정 토큰 인증은 계속 지원되지만, 로컬 Claude CLI 로그인을 사용할 수 있으면 OpenClaw는 Claude CLI 재사용을 우선합니다. 프로덕션에서는 Anthropic API 키를 사용하는 것이 좋습니다.

## 다른 에이전트 추가

`openclaw agents add <name>`은 자체 워크스페이스, 세션, 인증 프로필을 가진 별도의 에이전트를 생성합니다. `--workspace` 없이(그리고 다른 플래그도 없이) 실행하면 대화형 마법사가 시작됩니다. `--workspace`, `--model`, `--agent-dir`, `--bind`, `--non-interactive` 중 하나라도 전달하면 비대화형으로 실행되며, 이 경우 `--workspace`가 필요합니다.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

기록되는 구성 키(새 에이전트 ID에 대한 `agents.list[]` 항목)는 다음과 같습니다.

- `name`
- `workspace`
- `agentDir`
- `model` (`--model`을 전달한 경우에만)

참고:

- 기본 워크스페이스(대화형 마법사에서 `--workspace`를 생략한 경우): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>`는 반복해서 지정할 수 있습니다. 수신 메시지를 새 에이전트로 라우팅하려면 바인딩을 추가하십시오(마법사에서도 대화형으로 설정할 수 있습니다).
- 에이전트 이름은 유효한 에이전트 ID로 정규화되며, `main`은 예약되어 있습니다.

## 관련 문서

- 온보딩 허브: [온보딩(CLI)](/ko/start/wizard)
- 전체 참조: [CLI 설정 참조](/ko/start/wizard-cli-reference)
- 명령 참조: [`openclaw onboard`](/ko/cli/onboard)
