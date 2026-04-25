---
read_when:
    - 스크립트 또는 CI에서 온보딩을 자동화하고 있음
    - 특정 provider에 대한 비대화형 예제가 필요함
sidebarTitle: CLI automation
summary: OpenClaw CLI를 위한 스크립트형 온보딩 및 agent 설정
title: CLI 자동화
x-i18n:
    generated_at: "2026-04-25T18:22:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50b6ef35554ec085012a84b8abb8d52013934ada5293d941babea56eaacf4a9f
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

`openclaw onboard`를 자동화하려면 `--non-interactive`를 사용하세요.

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에서는 `--non-interactive`(및 `--workspace`)를 사용하세요.
</Note>

## 기본 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

기계 판독 가능한 요약이 필요하면 `--json`을 추가하세요.

자동화가 workspace 파일을 미리 채워 두고 온보딩이 기본 bootstrap 파일을 만들지 않게 하려면 `--skip-bootstrap`을 사용하세요.

auth profile에 일반 텍스트 값 대신 env 기반 ref를 저장하려면 `--secret-input-mode ref`를 사용하세요.
env ref와 구성된 provider ref(`file` 또는 `exec`) 사이의 대화형 선택은 온보딩 흐름에서 사용할 수 있습니다.

비대화형 `ref` 모드에서는 provider env var가 프로세스 환경에 설정되어 있어야 합니다.
이제 일치하는 env var 없이 인라인 키 플래그를 전달하면 즉시 실패합니다.

예시:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## provider별 예시

<AccordionGroup>
  <Accordion title="Anthropic API 키 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Go 카탈로그의 경우 `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`로 바꾸세요.
  </Accordion>
  <Accordion title="Ollama 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="사용자 지정 provider 예시">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key`는 선택 사항입니다. 생략하면 온보딩이 `CUSTOM_API_KEY`를 확인합니다.

    ref 모드 변형:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    이 모드에서 온보딩은 `apiKey`를 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`로 저장합니다.

  </Accordion>
</AccordionGroup>

Anthropic setup-token은 계속 지원되는 온보딩 토큰 경로로 남아 있지만, OpenClaw는 이제 가능한 경우 Claude CLI 재사용을 우선합니다.
프로덕션에서는 Anthropic API 키를 사용하는 것이 좋습니다.

## 다른 agent 추가

별도의 workspace,
session 및 auth profile을 가진 별도 agent를 만들려면 `openclaw agents add <name>`을 사용하세요. `--workspace` 없이 실행하면 wizard가 시작됩니다.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

설정되는 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고:

- 기본 workspace는 `~/.openclaw/workspace-<agentId>` 형식을 따릅니다.
- 인바운드 메시지를 라우팅하려면 `bindings`를 추가하세요(wizard에서도 가능).
- 비대화형 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 관련 문서

- 온보딩 허브: [온보딩(CLI)](/ko/start/wizard)
- 전체 참조: [CLI 설정 참조](/ko/start/wizard-cli-reference)
- 명령 참조: [`openclaw onboard`](/ko/cli/onboard)
