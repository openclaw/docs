---
read_when:
    - 스크립트에서 에이전트 턴을 한 번 실행하려고 합니다(선택적으로 응답 전달).
summary: '`openclaw agent` CLI 참조(Gateway를 통해 에이전트 턴 1회 전송)'
title: 에이전트
x-i18n:
    generated_at: "2026-07-12T00:39:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway를 통해 에이전트 턴 하나를 실행합니다. Gateway 요청이 실패하면 내장 에이전트로 대체 실행됩니다. 처음부터 내장 실행을 강제하려면 `--local`을 전달하세요.

세션 선택자 `--to`, `--session-key`, `--session-id`, `--agent` 중 하나 이상을 전달하세요.

관련 문서: [에이전트 전송 도구](/ko/tools/agent-send)

## 옵션

- `-m, --message <text>`: 메시지 본문
- `--message-file <path>`: UTF-8 파일에서 메시지 본문 읽기
- `-t, --to <dest>`: 세션 키를 파생하는 데 사용할 수신자
- `--session-key <key>`: 라우팅에 사용할 명시적 세션 키
- `--session-id <id>`: 명시적 세션 ID
- `--agent <id>`: 에이전트 ID. 라우팅 바인딩을 재정의합니다.
- `--model <id>`: 이 실행에 사용할 모델 재정의 값(`provider/model` 또는 모델 ID)
- `--thinking <level>`: 에이전트 사고 수준(`off`, `minimal`, `low`, `medium`, `high` 및 `xhigh`, `adaptive`, `max` 등 공급자가 지원하는 사용자 지정 수준)
- `--verbose <on|off>`: 세션의 상세 출력 수준 유지
- `--channel <channel>`: 전달 채널. 기본 세션 채널을 사용하려면 생략합니다.
- `--reply-to <target>`: 전달 대상 재정의
- `--reply-channel <channel>`: 전달 채널 재정의
- `--reply-account <id>`: 전달 계정 재정의
- `--local`: Plugin 레지스트리를 미리 로드한 후 내장 에이전트를 직접 실행
- `--deliver`: 선택한 채널/대상으로 응답 다시 전송
- `--timeout <seconds>`: 에이전트 제한 시간 재정의(기본값 600 또는 `agents.defaults.timeoutSeconds`). `0`은 제한 시간을 비활성화합니다.
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

## 참고 사항

- `--message`와 `--message-file` 중 정확히 하나만 전달하세요. `--message-file`은 선행 UTF-8 BOM을 제거하고 여러 줄 콘텐츠를 보존하며, 유효한 UTF-8이 아닌 파일은 거부합니다.
- 슬래시 명령(예: `/compact`)은 `--message`를 통해 실행할 수 없습니다. CLI는 이를 거부하고 대신 일급 명령을 안내합니다(Compaction의 경우 `openclaw sessions compact <key>`).
- `--local` 및 내장 대체 실행은 일회성입니다. 실행을 위해 열린 번들 MCP 루프백 리소스와 준비 상태의 Claude stdio 세션은 응답 후 종료되므로, 스크립트 방식 호출이 로컬 자식 프로세스를 실행 상태로 남기지 않습니다. 반면 Gateway 기반 실행은 실행 중인 Gateway 프로세스에서 Gateway가 소유한 MCP 루프백 리소스를 유지합니다.
- `--agent`, `--channel`, `--to`를 함께 사용하면 세션 라우팅은 채널의 정규 수신자와 `session.dmScope`를 따릅니다. 안정적인 발신 전용 수신자 ID가 있는 채널은 에이전트의 기본 세션과 격리된 공급자 소유 세션을 사용합니다. `--reply-channel`과 `--reply-account`는 전달에만 영향을 줍니다.
- `--session-key`는 명시적 세션 키를 선택합니다. 에이전트 접두사가 있는 키는 `agent:<agent-id>:<session-key>` 형식을 사용해야 하며, 둘 다 지정한 경우 `--agent`가 키의 에이전트 ID와 일치해야 합니다. 센티널이 아닌 접두사 없는 키는 `--agent`가 지정되면 해당 에이전트 범위에 속하고, 그렇지 않으면 구성된 기본 에이전트 범위에 속합니다. 예를 들어 `--agent ops --session-key incident-42`는 `agent:ops:incident-42`로 라우팅됩니다. 리터럴 키 `global`과 `unknown`은 `--agent`를 지정하지 않은 경우에만 범위가 지정되지 않은 상태로 유지됩니다.
- `--json`은 JSON 응답을 위해 stdout을 전용으로 사용합니다. 스크립트가 stdout을 직접 파싱할 수 있도록 Gateway, Plugin 및 내장 대체 실행 진단은 stderr로 출력됩니다.
- 내장 대체 실행 JSON에는 스크립트가 대체 실행을 감지할 수 있도록 `meta.transport: "embedded"`와 `meta.fallbackFrom: "gateway"`가 포함됩니다.
- Gateway가 실행을 수락했지만 CLI가 최종 응답을 기다리다가 시간 초과된 경우, 내장 대체 실행은 새로운 `gateway-fallback-*` 세션/실행 ID를 사용하고 대체 세션 필드와 함께 `meta.fallbackReason: "gateway_timeout"`을 보고합니다. 따라서 Gateway가 소유한 트랜스크립트와 경합하거나 원래 세션을 조용히 대체하지 않습니다.
- `SIGTERM`/`SIGINT`는 대기 중인 Gateway 기반 요청을 중단합니다. Gateway가 이미 실행을 수락했다면 CLI는 종료 전에 해당 실행 ID에 대해 `chat.abort`도 전송합니다. `--local` 및 내장 대체 실행은 동일한 신호를 수신하지만 `chat.abort`를 전송하지 않습니다. 내부 실행 중복 제거 키에 이 세션의 활성 실행이 이미 있으면 응답은 `status: "in_flight"`를 보고하고, 비 JSON CLI는 빈 응답 대신 stderr 진단을 출력합니다. 외부 Cron/systemd 래퍼에서는 종료 처리가 완료되지 못할 경우 감독자가 프로세스를 회수할 수 있도록 `timeout -k 60 600 openclaw agent ...` 같은 강제 종료 안전장치를 유지하세요.
- 이 명령으로 `models.json`이 재생성되면 SecretRef로 관리되는 공급자 자격 증명은 확인된 비밀 일반 텍스트가 아니라 비밀이 아닌 마커(예: 환경 변수 이름, `secretref-env:ENV_VAR_NAME`, `secretref-managed`)로 저장됩니다. 마커 쓰기는 확인된 런타임 비밀 값이 아니라 활성 원본 구성 스냅샷에서 가져옵니다.

## JSON 전달 상태

`--json --deliver`를 사용하면 스크립트가 전달 완료, 억제, 일부 실패, 실패 전송을 구분할 수 있도록 CLI JSON 응답에 최상위 `deliveryStatus`가 포함됩니다.

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

Gateway 기반 CLI 응답은 원시 Gateway 결과 형태도 `result.deliveryStatus`에 보존합니다.

`deliveryStatus.status`는 다음 중 하나입니다.

| 상태             | 의미                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | 전달이 완료되었습니다.                                                                                                                         |
| `suppressed`     | 의도적으로 전달하지 않았습니다(예: 메시지 전송 훅이 취소했거나 표시할 결과가 없는 경우). 종료 상태이며 재시도하지 않습니다.                     |
| `partial_failed` | 이후 페이로드가 실패하기 전에 하나 이상의 페이로드가 전송되었습니다.                                                                           |
| `failed`         | 지속성 있는 전송이 하나도 완료되지 않았거나 전달 사전 검사가 실패했습니다.                                                                     |

공통 필드:

- `requested`: 객체가 있으면 항상 `true`입니다.
- `attempted`: 지속성 있는 전송 경로가 실행되면 `true`이고, 사전 검사 실패 또는 표시할 페이로드가 없으면 `false`입니다.
- `succeeded`: `true`, `false` 또는 `"partial"`입니다. `"partial"`은 `status: "partial_failed"`와 함께 사용됩니다.
- `reason`: 지속성 있는 전달 또는 사전 검사 검증에서 생성된 소문자 스네이크 케이스 사유입니다. 알려진 값에는 `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, `no_delivery_target`이 있으며, 지속성 있는 전송 실패는 실패한 단계도 보고할 수 있습니다. 값 집합은 확장될 수 있으므로 알 수 없는 값은 불투명한 값으로 취급하세요.
- `resultCount`: 가능한 경우 채널 전송 결과 수입니다.
- `sentBeforeError`: 일부 실패에서 오류가 발생하기 전에 하나 이상의 페이로드가 전송되었으면 `true`입니다.
- `error`: 실패 또는 일부 실패 전송이면 `true`입니다.
- `errorMessage`: 기본 전달 오류 메시지가 수집된 경우에만 존재합니다. 사전 검사 실패에는 `error`/`reason`이 있지만 `errorMessage`는 없습니다.
- `payloadOutcomes`: 선택적인 페이로드별 결과입니다. 가능한 경우 `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` 또는 훅 메타데이터를 포함합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [에이전트 런타임](/ko/concepts/agent)
