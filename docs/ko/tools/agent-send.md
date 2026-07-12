---
read_when:
    - 스크립트나 명령줄에서 에이전트 실행을 트리거하려고 합니다
    - 에이전트 응답을 프로그래밍 방식으로 채팅 채널에 전달해야 합니다
summary: CLI에서 에이전트 턴을 실행하고 선택적으로 채널에 응답을 전달합니다
title: 에이전트 전송
x-i18n:
    generated_at: "2026-07-12T15:46:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent`는 수신 채팅 메시지 없이 명령줄에서 단일 에이전트 턴을 실행합니다. 스크립트 워크플로, 테스트 및 프로그래밍 방식의 전달에 사용하십시오. 전체 플래그 및 동작 참고 자료:
[에이전트 CLI 참고 자료](/ko/cli/agent).

## 빠른 시작

<Steps>
  <Step title="간단한 에이전트 턴 실행">
    ```bash
    openclaw agent --agent main --message "오늘 날씨는 어떤가요?"
    ```

    Gateway를 통해 메시지를 전송하고 응답을 출력합니다.

  </Step>

  <Step title="파일에서 여러 줄 프롬프트 전송">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    유효한 UTF-8 파일을 에이전트 메시지 본문으로 읽습니다.

  </Step>

  <Step title="특정 에이전트 또는 세션 지정">
    ```bash
    # 특정 에이전트 지정
    openclaw agent --agent ops --message "로그 요약"

    # 전화번호 지정(세션 키 파생)
    openclaw agent --to +15555550123 --message "상태 업데이트"

    # 기존 세션 재사용
    openclaw agent --session-id abc123 --message "작업 계속"

    # 정확한 세션 키 지정
    openclaw agent --session-key agent:ops:incident-42 --message "상태 요약"
    ```

  </Step>

  <Step title="채널로 응답 전달">
    ```bash
    # WhatsApp으로 전달(기본 채널)
    openclaw agent --to +15555550123 --message "보고서 준비 완료" --deliver

    # Slack으로 전달
    openclaw agent --agent ops --message "보고서 생성" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 플래그

| 플래그                      | 설명                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | 전송할 인라인 메시지                                                 |
| `--message-file <path>`     | 유효한 UTF-8 파일에서 메시지 읽기                                    |
| `--to <dest>`               | 대상(전화번호, 채팅 ID)에서 세션 키 파생                             |
| `--session-key <key>`       | 명시적 세션 키 사용                                                  |
| `--agent <id>`              | 구성된 에이전트 지정(해당 에이전트의 `main` 세션 사용)               |
| `--session-id <id>`         | ID로 기존 세션 재사용                                                |
| `--model <id>`              | 이번 실행의 모델 재정의(`provider/model` 또는 모델 ID)               |
| `--local`                   | 로컬 내장 런타임 강제 사용(Gateway 건너뛰기)                         |
| `--deliver`                 | 채팅 채널로 응답 전송                                                |
| `--channel <name>`          | 전달 채널. `--agent` + `--to`와 함께 사용하면 DM 범위에도 적용       |
| `--reply-to <target>`       | 전달 대상 재정의                                                     |
| `--reply-channel <name>`    | 전달 채널 재정의                                                     |
| `--reply-account <id>`      | 전달 계정 ID 재정의                                                  |
| `--thinking <level>`        | 선택한 모델 프로필의 사고 수준 설정                                  |
| `--verbose <on\|full\|off>` | 세션의 상세 출력 수준 유지(`full`은 도구 출력도 기록)                |
| `--timeout <seconds>`       | 에이전트 제한 시간 재정의(기본값 600 또는 구성값)                    |
| `--json`                    | 구조화된 JSON 출력                                                   |

## 동작

- 기본적으로 CLI는 **Gateway를 통과합니다**. 현재 머신에서 내장 런타임을 강제로 사용하려면 `--local`을 추가하십시오.
- `--message` 또는 `--message-file` 중 정확히 하나를 전달하십시오. 파일 메시지는 선택적 UTF-8 BOM을 제거한 후 여러 줄 콘텐츠를 유지합니다.
- Gateway 요청이 실패하면 CLI는 로컬 내장 실행으로 **대체합니다**. Gateway 제한 시간이 초과되면 원래 트랜스크립트와 경합하는 대신 새 세션으로 대체합니다.
- 세션 선택: `--to`는 세션 키를 파생합니다(그룹/채널 대상은 격리를 유지하고 직접 채팅은 `main`으로 통합됩니다). `--agent`, `--channel`, `--to`를 함께 사용하면 라우팅은 채널의 정규 수신자와 `session.dmScope`를 따릅니다. 안정적인 발신 전용 ID는 에이전트의 기본 세션과 격리된 공급자 소유 세션을 사용합니다.
- `--session-key`는 명시적 키를 선택합니다. 에이전트 접두사가 있는 키는 `agent:<agent-id>:<session-key>` 형식을 사용해야 하며, 두 옵션을 모두 제공하면 `--agent`가 해당 에이전트 ID와 일치해야 합니다. 센티널이 아닌 단순 키는 `--agent`를 제공한 경우 해당 에이전트 범위로 지정됩니다. 예를 들어 `--agent ops --session-key incident-42`는 `agent:ops:incident-42`로 라우팅됩니다. `--agent`가 없으면 센티널이 아닌 단순 키는 구성된 기본 에이전트 범위로 지정됩니다. 리터럴 `global`과 `unknown`은 `--agent`가 제공되지 않은 경우에만 범위가 지정되지 않은 상태로 유지되며, 내장 대체 경로는 이러한 센티널 세션을 구성된 기본 에이전트로 해석합니다.
- `--reply-channel`과 `--reply-account`는 전달에만 영향을 줍니다.
- 사고 및 상세 출력 플래그는 세션 저장소에 유지됩니다.
- 출력: 기본값은 일반 텍스트이며, 구조화된 페이로드와 메타데이터를 출력하려면 `--json`을 사용합니다.
- `--json --deliver`를 사용하면 JSON에 전송됨, 억제됨, 부분 전송 및 전송 실패에 대한 전달 상태가 포함됩니다. [JSON 전달 상태](/ko/cli/agent#json-delivery-status)를 참조하십시오.

## 예시

```bash
# JSON 출력이 포함된 간단한 턴
openclaw agent --to +15555550123 --message "로그 추적" --verbose on --json

# 모델 재정의가 포함된 턴
openclaw agent --agent ops --model openai/gpt-5.4 --message "로그 요약"

# 사고 수준이 포함된 턴
openclaw agent --session-id 1234 --message "받은 편지함 요약" --thinking medium

# 파일의 여러 줄 프롬프트
openclaw agent --agent ops --message-file ./task.md

# 정확한 세션 키
openclaw agent --session-key agent:ops:incident-42 --message "상태 요약"

# 에이전트 범위로 지정된 레거시 키
openclaw agent --agent ops --session-key incident-42 --message "상태 요약"

# 세션과 다른 채널로 전달
openclaw agent --agent ops --message "알림" --deliver --reply-channel telegram --reply-to "@admin"
```

## 관련 항목

<CardGroup cols={2}>
  <Card title="에이전트 CLI 참고 자료" href="/ko/cli/agent" icon="terminal">
    전체 `openclaw agent` 플래그 및 옵션 참고 자료입니다.
  </Card>
  <Card title="하위 에이전트" href="/ko/tools/subagents" icon="users">
    백그라운드 하위 에이전트 생성입니다.
  </Card>
  <Card title="세션" href="/ko/concepts/session" icon="comments">
    세션 키의 작동 방식과 `--to`, `--agent`, `--session-id`가 세션 키를 해석하는 방법입니다.
  </Card>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="slash">
    에이전트 세션 내에서 사용되는 네이티브 명령 카탈로그입니다.
  </Card>
</CardGroup>
