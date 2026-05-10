---
read_when:
    - 스크립트나 명령줄에서 에이전트 실행을 트리거하려는 경우
    - 에이전트 응답을 프로그래밍 방식으로 채팅 채널에 전달해야 합니다
summary: CLI에서 에이전트 턴을 실행하고 선택적으로 응답을 채널에 전달
title: 에이전트 전송
x-i18n:
    generated_at: "2026-05-10T19:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent`는 인바운드 채팅 메시지 없이 명령줄에서 단일 에이전트 턴을 실행합니다. 스크립트 워크플로, 테스트, 프로그래밍 방식 전달에 사용하세요.

## 빠른 시작

<Steps>
  <Step title="간단한 에이전트 턴 실행">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    이 명령은 Gateway를 통해 메시지를 보내고 응답을 출력합니다.

  </Step>

  <Step title="특정 에이전트 또는 세션 대상으로 지정">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
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
| `--message \<text\>`          | 보낼 메시지(필수)                                          |
| `--to \<dest\>`               | 대상(전화, 채팅 ID)에서 세션 키 파생                       |
| `--agent \<id\>`              | 구성된 에이전트를 대상으로 지정(`main` 세션 사용)          |
| `--session-id \<id\>`         | ID로 기존 세션 재사용                                      |
| `--local`                     | 로컬 임베디드 런타임 강제 사용(Gateway 건너뜀)             |
| `--deliver`                   | 응답을 채팅 채널로 전송                                    |
| `--channel \<name\>`          | 전달 채널(whatsapp, telegram, discord, slack 등)           |
| `--reply-to \<target\>`       | 전달 대상 재정의                                           |
| `--reply-channel \<name\>`    | 전달 채널 재정의                                           |
| `--reply-account \<id\>`      | 전달 계정 ID 재정의                                        |
| `--thinking \<level\>`        | 선택한 모델 프로필의 사고 수준 설정                       |
| `--verbose \<on\|full\|off\>` | 상세 출력 수준 설정                                        |
| `--timeout \<seconds\>`       | 에이전트 제한 시간 재정의                                  |
| `--json`                      | 구조화된 JSON 출력                                         |

## 동작

- 기본적으로 CLI는 **Gateway를 통해** 실행됩니다. 현재 머신에서 임베디드 런타임을 강제로 사용하려면 `--local`을 추가하세요.
- Gateway에 연결할 수 없으면 CLI는 로컬 임베디드 실행으로 **대체**합니다.
- 세션 선택: `--to`는 세션 키를 파생합니다(그룹/채널 대상은 격리를 유지하고, 직접 채팅은 `main`으로 합쳐집니다).
- 사고 및 상세 출력 플래그는 세션 저장소에 유지됩니다.
- 출력: 기본값은 일반 텍스트이며, 구조화된 페이로드와 메타데이터에는 `--json`을 사용합니다.
- `--json --deliver`를 사용하면 JSON에 전송됨, 억제됨, 부분 전송, 전송 실패에 대한 전달 상태가 포함됩니다. [JSON 전달 상태](/ko/cli/agent#json-delivery-status)를 참조하세요.

## 예제

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 관련 항목

<CardGroup cols={2}>
  <Card title="에이전트 CLI 참조" href="/ko/cli/agent" icon="terminal">
    전체 `openclaw agent` 플래그 및 옵션 참조입니다.
  </Card>
  <Card title="하위 에이전트" href="/ko/tools/subagents" icon="users">
    백그라운드 하위 에이전트 생성입니다.
  </Card>
  <Card title="세션" href="/ko/concepts/session" icon="comments">
    세션 키가 작동하는 방식과 `--to`, `--agent`, `--session-id`가 이를 해석하는 방식입니다.
  </Card>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="slash">
    에이전트 세션 내에서 사용되는 네이티브 명령 카탈로그입니다.
  </Card>
</CardGroup>
