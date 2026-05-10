---
read_when:
    - 스크립트에서 에이전트 턴 하나를 실행하려고 합니다(선택적으로 응답 전달)
summary: '`openclaw agent`용 CLI 참조(Gateway를 통해 에이전트 턴 하나 보내기)'
title: 에이전트
x-i18n:
    generated_at: "2026-05-10T19:27:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway를 통해 에이전트 턴을 실행합니다(임베디드에는 `--local` 사용).
구성된 에이전트를 직접 대상으로 지정하려면 `--agent <id>`를 사용합니다.

세션 선택자를 하나 이상 전달하세요.

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

관련 항목:

- 에이전트 전송 도구: [에이전트 전송](/ko/tools/agent-send)

## 옵션

- `-m, --message <text>`: 필수 메시지 본문
- `-t, --to <dest>`: 세션 키를 파생하는 데 사용되는 수신자
- `--session-id <id>`: 명시적 세션 id
- `--agent <id>`: 에이전트 id; 라우팅 바인딩을 재정의
- `--model <id>`: 이 실행의 모델 재정의(`provider/model` 또는 모델 id)
- `--thinking <level>`: 에이전트 사고 수준(`off`, `minimal`, `low`, `medium`, `high`, 그리고 `xhigh`, `adaptive`, `max` 같은 공급자 지원 사용자 지정 수준)
- `--verbose <on|off>`: 세션의 상세 수준을 유지
- `--channel <channel>`: 전달 채널; 기본 세션 채널을 사용하려면 생략
- `--reply-to <target>`: 전달 대상 재정의
- `--reply-channel <channel>`: 전달 채널 재정의
- `--reply-account <id>`: 전달 계정 재정의
- `--local`: 임베디드 에이전트를 직접 실행(Plugin 레지스트리 사전 로드 후)
- `--deliver`: 선택한 채널/대상으로 응답을 다시 전송
- `--timeout <seconds>`: 에이전트 제한 시간 재정의(기본값 600 또는 구성 값)
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

- Gateway 모드는 Gateway 요청이 실패하면 임베디드 에이전트로 폴백합니다. 처음부터 임베디드 실행을 강제하려면 `--local`을 사용하세요.
- `--local`은 여전히 먼저 Plugin 레지스트리를 사전 로드하므로, Plugin에서 제공하는 공급자, 도구, 채널은 임베디드 실행 중에도 계속 사용할 수 있습니다.
- `--local` 및 임베디드 폴백 실행은 일회성 실행으로 처리됩니다. 해당 로컬 프로세스를 위해 열린 번들 MCP loopback 리소스와 예열된 Claude stdio 세션은 응답 후 폐기되므로, 스크립트 호출이 로컬 자식 프로세스를 계속 살려 두지 않습니다.
- Gateway 기반 실행은 Gateway 소유 MCP loopback 리소스를 실행 중인 Gateway 프로세스 아래에 남겨 둡니다. 이전 클라이언트는 여전히 과거의 정리 플래그를 보낼 수 있지만, Gateway는 이를 호환성을 위한 무동작으로 받아들입니다.
- `--channel`, `--reply-channel`, `--reply-account`는 세션 라우팅이 아니라 응답 전달에 영향을 줍니다.
- `--json`은 stdout을 JSON 응답 전용으로 유지합니다. 스크립트가 stdout을 직접 파싱할 수 있도록 Gateway, Plugin, 임베디드 폴백 진단은 stderr로 라우팅됩니다.
- 임베디드 폴백 JSON에는 `meta.transport: "embedded"` 및 `meta.fallbackFrom: "gateway"`가 포함되어 스크립트가 폴백 실행과 Gateway 실행을 구분할 수 있습니다.
- Gateway가 에이전트 실행을 수락했지만 CLI가 최종 응답을 기다리다 시간 초과되면, 임베디드 폴백은 새로운 명시적 `gateway-fallback-*` 세션/실행 id를 사용하고 폴백 세션 필드와 함께 `meta.fallbackReason: "gateway_timeout"`을 보고합니다. 이렇게 하면 Gateway 소유 transcript 잠금과 경합하거나 원래 라우팅된 대화 세션을 조용히 대체하는 일을 피할 수 있습니다.
- 이 명령이 `models.json` 재생성을 트리거하면 SecretRef 관리 공급자 자격 증명은 확인된 비밀 평문이 아니라 비밀이 아닌 마커(예: 환경 변수 이름, `secretref-env:ENV_VAR_NAME`, 또는 `secretref-managed`)로 유지됩니다.
- 마커 쓰기는 소스 기준으로 권위가 있습니다. OpenClaw는 확인된 런타임 비밀 값이 아니라 활성 소스 구성 스냅샷의 마커를 유지합니다.

## JSON 전달 상태

`--json --deliver`를 사용할 때 CLI JSON 응답에는 스크립트가 전송 완료, 억제, 부분 실패, 실패한 전송을 구분할 수 있도록 최상위 `deliveryStatus`가 포함될 수 있습니다.

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

`deliveryStatus.status`는 `sent`, `suppressed`, `partial_failed`, `failed` 중 하나입니다. `suppressed`는 예를 들어 메시지 전송 훅이 취소했거나 표시할 결과가 없어 전달이 의도적으로 전송되지 않았음을 의미합니다. 여전히 재시도하지 않는 최종 결과입니다. `partial_failed`는 이후 페이로드가 실패하기 전에 하나 이상의 페이로드가 전송되었음을 의미합니다. `failed`는 내구성 있는 전송이 완료되지 않았거나 전달 사전 검사가 실패했음을 의미합니다.

Gateway 기반 CLI 응답은 원시 Gateway 결과 형태도 보존하며, 동일한 객체는 `result.deliveryStatus`에서 사용할 수 있습니다.

공통 필드:

- `requested`: 객체가 있으면 항상 `true`입니다.
- `attempted`: 내구성 있는 전송 경로가 실행된 후 `true`입니다. 사전 검사 실패 또는 표시할 페이로드가 없는 경우에는 `false`입니다.
- `succeeded`: `true`, `false`, 또는 `"partial"`입니다. `"partial"`은 `status: "partial_failed"`와 함께 사용됩니다.
- `reason`: 내구성 있는 전달 또는 사전 검사 검증에서 온 소문자 스네이크 케이스 이유입니다. 알려진 이유에는 `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, `no_delivery_target`가 포함됩니다. 실패한 내구성 있는 전송은 실패한 단계도 보고할 수 있습니다. 집합이 확장될 수 있으므로 알 수 없는 값은 불투명하게 취급하세요.
- `resultCount`: 사용 가능한 경우 채널 전송 결과 수입니다.
- `sentBeforeError`: 부분 실패에서 오류 전에 하나 이상의 페이로드가 전송된 경우 `true`입니다.
- `error`: 실패 또는 부분 실패 전송의 경우 boolean `true`입니다.
- `errorMessage`: 기본 전달 오류 메시지가 캡처된 경우에만 포함됩니다. 사전 검사 실패에는 `error`와 `reason`이 있지만 `errorMessage`는 없습니다.
- `payloadOutcomes`: 사용 가능한 경우 `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError`, 또는 훅 메타데이터가 포함된 선택적 페이로드별 결과입니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [에이전트 런타임](/ko/concepts/agent)
