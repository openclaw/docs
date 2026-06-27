---
read_when:
    - 스크립트 또는 명령줄에서 에이전트 실행을 트리거하려는 경우
    - 에이전트 응답을 채팅 채널로 프로그래밍 방식으로 전달해야 합니다
summary: CLI에서 에이전트 턴을 실행하고 선택적으로 채널에 답장을 전달합니다
title: 에이전트 전송
x-i18n:
    generated_at: "2026-06-27T18:11:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent`는 인바운드 채팅 메시지 없이 명령줄에서 단일 에이전트 턴을 실행합니다. 스크립트 기반 워크플로, 테스트, 프로그래밍 방식 전달에 사용하세요.

## 빠른 시작

<Steps>
  <Step title="간단한 에이전트 턴 실행">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    이 명령은 Gateway를 통해 메시지를 보내고 응답을 출력합니다.

  </Step>

  <Step title="파일에서 여러 줄 프롬프트 보내기">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    이 명령은 유효한 UTF-8 파일을 에이전트 메시지 본문으로 읽습니다.

  </Step>

  <Step title="특정 에이전트 또는 세션 지정">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="응답을 채널로 전달">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 플래그

| 플래그                        | 설명                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 보낼 인라인 메시지                                          |
| `--message-file \<path\>`     | 유효한 UTF-8 파일에서 메시지 읽기                           |
| `--to \<dest\>`               | 대상(전화번호, 채팅 ID)에서 세션 키 파생                    |
| `--session-key \<key\>`       | 명시적 세션 키 사용                                         |
| `--agent \<id\>`              | 구성된 에이전트 지정(`main` 세션 사용)                      |
| `--session-id \<id\>`         | ID로 기존 세션 재사용                                       |
| `--local`                     | 로컬 내장 런타임 강제 사용(Gateway 건너뜀)                  |
| `--deliver`                   | 응답을 채팅 채널로 보내기                                   |
| `--channel \<name\>`          | 전달 채널(whatsapp, telegram, discord, slack 등)            |
| `--reply-to \<target\>`       | 전달 대상 재정의                                            |
| `--reply-channel \<name\>`    | 전달 채널 재정의                                            |
| `--reply-account \<id\>`      | 전달 계정 ID 재정의                                         |
| `--thinking \<level\>`        | 선택한 모델 프로필의 사고 수준 설정                         |
| `--verbose \<on\|full\|off\>` | 상세 출력 수준 설정                                         |
| `--timeout \<seconds\>`       | 에이전트 제한 시간 재정의                                   |
| `--json`                      | 구조화된 JSON 출력                                          |

## 동작

- 기본적으로 CLI는 **Gateway를 통해** 실행됩니다. 현재 머신에서 내장 런타임을 강제로 사용하려면 `--local`을 추가하세요.
- `--message` 또는 `--message-file` 중 정확히 하나만 전달하세요. 파일 메시지는 선택적 UTF-8 BOM을 제거한 뒤 여러 줄 콘텐츠를 보존합니다.
- Gateway에 연결할 수 없으면 CLI는 로컬 내장 실행으로 **폴백**합니다.
- 세션 선택: `--to`는 세션 키를 파생합니다(그룹/채널 대상은 격리를 유지하고, 직접 채팅은 `main`으로 합쳐집니다).
- `--session-key`는 명시적 키를 선택합니다. 에이전트 접두사가 붙은 키는 `agent:<agent-id>:<session-key>`를 사용해야 하며, `--agent`도 함께 제공된 경우 해당 에이전트 ID와 일치해야 합니다. 접두사가 없는 비 sentinel 키는 `--agent`가 제공되면 해당 에이전트로 범위가 지정됩니다. 예를 들어 `--agent ops --session-key incident-42`는 `agent:ops:incident-42`로 라우팅됩니다. `--agent`가 없으면 접두사가 없는 비 sentinel 키는 구성된 기본 에이전트로 범위가 지정됩니다. 리터럴 `global` 및 `unknown`은 `--agent`가 제공되지 않은 경우에만 범위가 지정되지 않은 상태로 유지됩니다. 이 경우 내장 폴백과 스토어 소유권은 구성된 기본 에이전트를 사용합니다.
- Thinking 및 verbose 플래그는 세션 스토어에 유지됩니다.
- 출력: 기본값은 일반 텍스트이며, 구조화된 페이로드와 메타데이터가 필요하면 `--json`을 사용하세요.
- `--json --deliver`를 사용하면 JSON에 전송됨, 억제됨, 부분 전송, 실패한 전송에 대한 전달 상태가 포함됩니다. [JSON 전달 상태](/ko/cli/agent#json-delivery-status)를 참고하세요.

## 예시

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 관련 항목

<CardGroup cols={2}>
  <Card title="Agent CLI 참조" href="/ko/cli/agent" icon="terminal">
    전체 `openclaw agent` 플래그 및 옵션 참조입니다.
  </Card>
  <Card title="하위 에이전트" href="/ko/tools/subagents" icon="users">
    백그라운드 하위 에이전트 생성입니다.
  </Card>
  <Card title="세션" href="/ko/concepts/session" icon="comments">
    세션 키가 작동하는 방식과 `--to`, `--agent`, `--session-id`가 이를 해석하는 방식입니다.
  </Card>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="slash">
    에이전트 세션 안에서 사용되는 네이티브 명령 카탈로그입니다.
  </Card>
</CardGroup>
