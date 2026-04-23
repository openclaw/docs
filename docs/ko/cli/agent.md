---
read_when:
    - 스크립트에서 하나의 에이전트 턴을 실행하려고 합니다(선택적으로 답장을 전달 가능).
summary: '`openclaw agent`용 CLI 참조(Gateway를 통해 하나의 에이전트 턴 전송)'
title: 에이전트
x-i18n:
    generated_at: "2026-04-23T14:00:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway를 통해 에이전트 턴을 실행합니다(내장 모드에는 `--local` 사용).
구성된 에이전트를 직접 대상으로 지정하려면 `--agent <id>`를 사용하세요.

다음 세션 선택자 중 최소 하나를 전달해야 합니다:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

관련 항목:

- 에이전트 전송 도구: [Agent send](/ko/tools/agent-send)

## 옵션

- `-m, --message <text>`: 필수 메시지 본문
- `-t, --to <dest>`: 세션 키를 도출하는 데 사용되는 수신자
- `--session-id <id>`: 명시적 세션 ID
- `--agent <id>`: 에이전트 ID, 라우팅 바인딩보다 우선함
- `--thinking <level>`: 에이전트 사고 수준(`off`, `minimal`, `low`, `medium`, `high` 및 `xhigh`, `adaptive`, `max` 같은 provider 지원 사용자 지정 수준)
- `--verbose <on|off>`: 세션의 자세한 출력 수준을 유지
- `--channel <channel>`: 전달 채널, 생략하면 기본 세션 채널 사용
- `--reply-to <target>`: 전달 대상 재정의
- `--reply-channel <channel>`: 전달 채널 재정의
- `--reply-account <id>`: 전달 계정 재정의
- `--local`: 내장 에이전트를 직접 실행(Plugin 레지스트리 사전 로드 후)
- `--deliver`: 선택한 채널/대상으로 답장을 다시 전송
- `--timeout <seconds>`: 에이전트 타임아웃 재정의(기본값 600 또는 구성 값)
- `--json`: JSON 출력

## 예시

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 참고

- Gateway 모드는 Gateway 요청이 실패하면 내장 에이전트로 대체됩니다. 처음부터 내장 실행을 강제하려면 `--local`을 사용하세요.
- `--local`도 먼저 Plugin 레지스트리를 사전 로드하므로, Plugin이 제공하는 provider, 도구, 채널은 내장 실행 중에도 계속 사용할 수 있습니다.
- `--channel`, `--reply-channel`, `--reply-account`는 세션 라우팅이 아니라 답장 전달에 영향을 줍니다.
- 이 명령이 `models.json` 재생성을 트리거할 때, SecretRef로 관리되는 provider 자격 증명은 해석된 평문 비밀이 아니라 비밀이 아닌 마커(예: 환경 변수 이름, `secretref-env:ENV_VAR_NAME`, 또는 `secretref-managed`)로 저장됩니다.
- 마커 쓰기는 소스 권한 기준입니다. OpenClaw는 해석된 런타임 비밀 값이 아니라 활성 소스 구성 스냅샷의 마커를 저장합니다.
