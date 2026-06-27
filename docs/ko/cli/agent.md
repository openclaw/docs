---
read_when:
    - 스크립트에서 에이전트 턴 하나를 실행하려는 경우(선택적으로 답장 전달)
summary: '`openclaw agent`용 CLI 참조( Gateway를 통해 에이전트 턴 하나 보내기)'
title: 에이전트
x-i18n:
    generated_at: "2026-06-27T17:16:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway를 통해 에이전트 턴을 실행합니다(내장 실행에는 `--local` 사용).
구성된 에이전트를 직접 대상으로 지정하려면 `--agent <id>`를 사용하세요.

세션 선택자를 하나 이상 전달하세요.

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

관련 항목:

- 에이전트 전송 도구: [에이전트 전송](/ko/tools/agent-send)

## 옵션

- `-m, --message <text>`: 메시지 본문
- `--message-file <path>`: UTF-8 파일에서 메시지 본문 읽기
- `-t, --to <dest>`: 세션 키를 파생하는 데 사용하는 수신자
- `--session-key <key>`: 라우팅에 사용할 명시적 세션 키
- `--session-id <id>`: 명시적 세션 id
- `--agent <id>`: 에이전트 id; 라우팅 바인딩을 재정의
- `--model <id>`: 이 실행의 모델 재정의(`provider/model` 또는 모델 id)
- `--thinking <level>`: 에이전트 사고 수준(`off`, `minimal`, `low`, `medium`, `high` 및 `xhigh`, `adaptive`, `max` 같은 공급자 지원 사용자 지정 수준)
- `--verbose <on|off>`: 세션의 자세한 출력 수준 유지
- `--channel <channel>`: 전달 채널; 기본 세션 채널을 사용하려면 생략
- `--reply-to <target>`: 전달 대상 재정의
- `--reply-channel <channel>`: 전달 채널 재정의
- `--reply-account <id>`: 전달 계정 재정의
- `--local`: 내장 에이전트를 직접 실행(Plugin 레지스트리 사전 로드 후)
- `--deliver`: 선택한 채널/대상으로 응답 전송
- `--timeout <seconds>`: 에이전트 제한 시간 재정의(기본값 600 또는 구성 값)
- `--json`: JSON 출력

## 예시

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 참고

- `--message` 또는 `--message-file` 중 정확히 하나를 전달하세요. `--message-file`은 선택적 UTF-8 BOM을 제거한 뒤 여러 줄 파일 내용을 보존하며, 유효한 UTF-8이 아닌 파일은 거부합니다.
- Gateway 모드는 Gateway 요청이 실패하면 내장 에이전트로 대체됩니다. 처음부터 내장 실행을 강제하려면 `--local`을 사용하세요.
- `--local`도 먼저 Plugin 레지스트리를 사전 로드하므로, Plugin이 제공하는 공급자, 도구, 채널을 내장 실행 중에도 계속 사용할 수 있습니다.
- `--local` 및 내장 대체 실행은 일회성 실행으로 처리됩니다. 해당 로컬 프로세스를 위해 열린 번들 MCP loopback 리소스와 워밍된 Claude stdio 세션은 응답 후 폐기되므로, 스크립트 호출이 로컬 자식 프로세스를 계속 살려 두지 않습니다.
- Gateway 기반 실행은 실행 중인 Gateway 프로세스 아래에 Gateway 소유 MCP loopback 리소스를 남깁니다. 이전 클라이언트는 여전히 과거의 정리 플래그를 보낼 수 있지만, Gateway는 이를 호환성 no-op으로 받아들입니다.
- `--channel`, `--reply-channel`, `--reply-account`는 세션 라우팅이 아니라 응답 전달에 영향을 줍니다.
- `--session-key`는 명시적 세션 키를 선택합니다. 에이전트 접두사가 붙은 키는 `agent:<agent-id>:<session-key>`를 사용해야 하며, `--agent`와 함께 제공된 경우 키의 에이전트 id와 일치해야 합니다. 접두어가 없는 일반 비센티널 키는 제공된 경우 `--agent` 범위에 속하고, 그렇지 않으면 구성된 기본 에이전트 범위에 속합니다. 예를 들어 `--agent ops --session-key incident-42`는 `agent:ops:incident-42`로 라우팅됩니다. 리터럴 `global` 및 `unknown`은 `--agent`가 제공되지 않은 경우에만 범위가 지정되지 않은 상태로 유지됩니다. 이 경우 내장 대체 및 저장소 소유권은 구성된 기본 에이전트를 사용합니다.
- `--json`은 stdout을 JSON 응답 전용으로 유지합니다. Gateway, Plugin, 내장 대체 진단은 stderr로 라우팅되므로 스크립트가 stdout을 직접 파싱할 수 있습니다.
- 내장 대체 JSON에는 `meta.transport: "embedded"` 및 `meta.fallbackFrom: "gateway"`가 포함되어 스크립트가 대체 실행과 Gateway 실행을 구분할 수 있습니다.
- Gateway가 에이전트 실행을 수락했지만 CLI가 최종 응답을 기다리다 시간 초과되면, 내장 대체는 새로운 명시적 `gateway-fallback-*` 세션/실행 id를 사용하고 `meta.fallbackReason: "gateway_timeout"` 및 대체 세션 필드를 보고합니다. 이렇게 하면 Gateway 소유 transcript 잠금과 경합하거나 원래 라우팅된 대화 세션을 조용히 대체하지 않습니다.
- Gateway 기반 실행의 경우 `SIGTERM` 및 `SIGINT`는 대기 중인 CLI 요청을 중단합니다. Gateway가 이미 실행을 수락한 경우 CLI는 종료 전에 해당 수락된 실행 id에 대해 `chat.abort`도 보냅니다. 로컬 `--local` 실행 및 내장 대체 실행은 동일한 중단 신호를 받지만 `chat.abort`를 보내지는 않습니다. 원래 에이전트 실행이 아직 활성 상태인 동안 중복 `--run-id`가 Gateway에 도달하면, 중복 응답은 `status: "in_flight"`를 보고하고 비 JSON CLI는 빈 응답 대신 stderr 진단을 출력합니다. 외부 Cron/systemd 래퍼의 경우 `timeout -k 60 600 openclaw agent ...` 같은 외부 강제 종료 백스톱을 유지하여 종료가 완료되지 않더라도 supervisor가 프로세스를 계속 회수할 수 있게 하세요.
- 이 명령이 `models.json` 재생성을 트리거하면 SecretRef 관리 공급자 자격 증명은 해석된 비밀 평문이 아니라 비밀이 아닌 마커(예: env var 이름, `secretref-env:ENV_VAR_NAME` 또는 `secretref-managed`)로 유지됩니다.
- 마커 쓰기는 소스 권한을 따릅니다. OpenClaw는 해석된 런타임 비밀 값이 아니라 활성 소스 구성 스냅샷의 마커를 유지합니다.

## JSON 전달 상태

`--json --deliver`를 사용하면 CLI JSON 응답에 최상위 `deliveryStatus`가 포함될 수 있어 스크립트가 전달됨, 억제됨, 부분 실패, 실패한 전송을 구분할 수 있습니다.

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

`deliveryStatus.status`는 `sent`, `suppressed`, `partial_failed`, `failed` 중 하나입니다. `suppressed`는 메시지 전송 훅이 취소했거나 표시 가능한 결과가 없는 경우처럼 전달이 의도적으로 전송되지 않았음을 의미합니다. 그래도 재시도하지 않는 최종 결과입니다. `partial_failed`는 이후 payload가 실패하기 전에 하나 이상의 payload가 전송되었음을 의미합니다. `failed`는 지속 가능한 전송이 완료되지 않았거나 전달 사전 검사가 실패했음을 의미합니다.

Gateway 기반 CLI 응답은 원시 Gateway 결과 형태도 보존하며, 동일한 객체는 `result.deliveryStatus`에서 사용할 수 있습니다.

공통 필드:

- `requested`: 객체가 있으면 항상 `true`입니다.
- `attempted`: 지속 가능한 전송 경로가 실행된 후 `true`이고, 사전 검사 실패 또는 표시 가능한 payload가 없는 경우 `false`입니다.
- `succeeded`: `true`, `false` 또는 `"partial"`입니다. `"partial"`은 `status: "partial_failed"`와 함께 사용됩니다.
- `reason`: 지속 가능한 전달 또는 사전 검사 검증에서 온 소문자 snake-case 사유입니다. 알려진 사유에는 `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, `no_delivery_target`가 포함됩니다. 실패한 지속 가능한 전송은 실패한 단계도 보고할 수 있습니다. 이 집합은 확장될 수 있으므로 알 수 없는 값은 불투명하게 취급하세요.
- `resultCount`: 사용할 수 있는 경우 채널 전송 결과 수입니다.
- `sentBeforeError`: 부분 실패에서 오류 전에 하나 이상의 payload를 전송한 경우 `true`입니다.
- `error`: 실패 또는 부분 실패 전송의 경우 boolean `true`입니다.
- `errorMessage`: 기본 전달 오류 메시지가 캡처된 경우에만 포함됩니다. 사전 검사 실패는 `error` 및 `reason`을 포함하지만 `errorMessage`는 없습니다.
- `payloadOutcomes`: 사용할 수 있는 경우 `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` 또는 훅 메타데이터가 포함된 선택적 payload별 결과입니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [에이전트 런타임](/ko/concepts/agent)
