---
read_when:
    - 스크립트 또는 명령줄에서 에이전트 실행을 트리거하고 싶습니다.
    - 프로그래밍 방식으로 채팅 채널에 에이전트 응답을 전달해야 합니다.
summary: CLI에서 에이전트 턴을 실행하고 선택적으로 채널에 응답 전달하기
title: Agent Send
x-i18n:
    generated_at: "2026-04-21T13:37:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Agent Send

`openclaw agent` 는 들어오는 채팅 메시지 없이 명령줄에서 단일 에이전트 턴을 실행합니다. 스크립트 워크플로, 테스트, 프로그래밍 방식 전달에 사용하세요.

## 빠른 시작

<Steps>
  <Step title="간단한 에이전트 턴 실행">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    이 명령은 메시지를 Gateway를 통해 보내고 응답을 출력합니다.

  </Step>

  <Step title="특정 에이전트 또는 세션 지정">
    ```bash
    # 특정 에이전트 지정
    openclaw agent --agent ops --message "Summarize logs"

    # 전화번호 지정(세션 키를 파생)
    openclaw agent --to +15555550123 --message "Status update"

    # 기존 세션 재사용
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="응답을 채널로 전달">
    ```bash
    # WhatsApp으로 전달(기본 채널)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Slack으로 전달
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 플래그

| Flag                          | 설명                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 보낼 메시지(필수)                                           |
| `--to \<dest\>`               | 대상(전화번호, 채팅 id)에서 세션 키를 파생                  |
| `--agent \<id\>`              | 구성된 에이전트를 지정(해당 에이전트의 `main` 세션 사용)    |
| `--session-id \<id\>`         | id로 기존 세션 재사용                                       |
| `--local`                     | 로컬 내장 런타임 강제 사용(Gateway 건너뜀)                  |
| `--deliver`                   | 응답을 채팅 채널로 전송                                     |
| `--channel \<name\>`          | 전달 채널(whatsapp, telegram, discord, slack 등)            |
| `--reply-to \<target\>`       | 전달 대상 재정의                                            |
| `--reply-channel \<name\>`    | 전달 채널 재정의                                            |
| `--reply-account \<id\>`      | 전달 account id 재정의                                      |
| `--thinking \<level\>`        | 선택한 모델 프로필의 thinking 수준 설정                     |
| `--verbose \<on\|full\|off\>` | verbose 수준 설정                                           |
| `--timeout \<seconds\>`       | 에이전트 timeout 재정의                                     |
| `--json`                      | 구조화된 JSON 출력                                          |

## 동작

- 기본적으로 CLI는 **Gateway를 통해** 실행됩니다. 현재 머신에서 내장 런타임을 강제로 사용하려면 `--local` 을 추가하세요.
- Gateway에 연결할 수 없으면, CLI는 **로컬 내장 실행으로 대체**됩니다.
- 세션 선택: `--to` 는 세션 키를 파생합니다(group/channel 대상은 격리를 유지하고, direct chat은 `main` 으로 합쳐집니다).
- thinking 및 verbose 플래그는 세션 저장소에 유지됩니다.
- 출력: 기본적으로 일반 텍스트이며, 구조화된 payload + 메타데이터가 필요하면 `--json` 을 사용하세요.

## 예시

```bash
# JSON 출력이 포함된 간단한 턴
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# thinking 수준이 포함된 턴
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# 세션과 다른 채널로 전달
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 관련 항목

- [에이전트 CLI 참조](/cli/agent)
- [하위 에이전트](/ko/tools/subagents) — 백그라운드 하위 에이전트 생성
- [세션](/ko/concepts/session) — 세션 키가 작동하는 방식
