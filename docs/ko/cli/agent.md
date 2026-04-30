---
read_when:
    - 스크립트에서 한 번의 에이전트 턴을 실행하려고 합니다(선택적으로 응답 전달)
summary: '`openclaw agent`의 CLI 참조 (Gateway를 통해 에이전트 턴 하나 보내기)'
title: 에이전트
x-i18n:
    generated_at: "2026-04-30T06:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway를 통해 agent turn을 실행합니다(내장형에는 `--local` 사용).
구성된 agent를 직접 대상으로 지정하려면 `--agent <id>`를 사용하세요.

session selector를 하나 이상 전달하세요:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

관련 항목:

- Agent send 도구: [Agent send](/ko/tools/agent-send)

## 옵션

- `-m, --message <text>`: 필수 메시지 본문
- `-t, --to <dest>`: session key를 도출하는 데 사용되는 수신자
- `--session-id <id>`: 명시적 session id
- `--agent <id>`: agent id; routing binding을 재정의
- `--model <id>`: 이 실행에 대한 model 재정의(`provider/model` 또는 model id)
- `--thinking <level>`: agent thinking level(`off`, `minimal`, `low`, `medium`, `high`, 그리고 `xhigh`, `adaptive`, `max` 같은 provider 지원 사용자 지정 level)
- `--verbose <on|off>`: session의 verbose level 유지
- `--channel <channel>`: delivery channel; 기본 session channel을 사용하려면 생략
- `--reply-to <target>`: delivery target 재정의
- `--reply-channel <channel>`: delivery channel 재정의
- `--reply-account <id>`: delivery account 재정의
- `--local`: 내장 agent를 직접 실행(plugin registry preload 이후)
- `--deliver`: 선택한 channel/target으로 reply 전송
- `--timeout <seconds>`: agent timeout 재정의(기본값 600 또는 config 값)
- `--json`: JSON 출력

## 예시

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 참고

- Gateway mode는 Gateway request가 실패하면 내장 agent로 대체됩니다. 처음부터 내장 실행을 강제하려면 `--local`을 사용하세요.
- `--local`도 먼저 plugin registry를 preload하므로, plugin이 제공하는 provider, 도구, channel은 내장 실행 중에도 계속 사용할 수 있습니다.
- `--local` 및 내장 fallback 실행은 one-shot 실행으로 처리됩니다. 해당 local process에 대해 열린 bundled MCP loopback resource와 warm Claude stdio session은 reply 이후 정리되므로, script invocation이 local child process를 계속 살려 두지 않습니다.
- Gateway-backed 실행은 실행 중인 Gateway process 아래에 Gateway가 소유한 MCP loopback resource를 남겨 둡니다. 이전 client는 여전히 기존 cleanup flag를 보낼 수 있지만, Gateway는 이를 compatibility no-op으로 수락합니다.
- `--channel`, `--reply-channel`, `--reply-account`는 session routing이 아니라 reply delivery에 영향을 줍니다.
- `--json`은 stdout을 JSON response 전용으로 유지합니다. Gateway, plugin, embedded-fallback diagnostic은 stderr로 route되므로 script가 stdout을 직접 parse할 수 있습니다.
- Embedded fallback JSON에는 `meta.transport: "embedded"` 및 `meta.fallbackFrom: "gateway"`가 포함되어 script가 fallback 실행을 Gateway 실행과 구분할 수 있습니다.
- Gateway가 agent run을 수락했지만 CLI가 최종 reply를 기다리다 timeout되면, embedded fallback은 새로운 명시적 `gateway-fallback-*` session/run id를 사용하고 `meta.fallbackReason: "gateway_timeout"` 및 fallback session field를 보고합니다. 이를 통해 Gateway-owned transcript lock과 경합하거나 원래 routing된 conversation session을 조용히 대체하는 일을 방지합니다.
- 이 command가 `models.json` regeneration을 trigger하면 SecretRef-managed provider credential은 resolved secret plaintext가 아니라 비밀이 아닌 marker(예: env var name, `secretref-env:ENV_VAR_NAME`, 또는 `secretref-managed`)로 persist됩니다.
- Marker write는 source-authoritative입니다. OpenClaw는 resolved runtime secret value가 아니라 active source config snapshot의 marker를 persist합니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [Agent runtime](/ko/concepts/agent)
