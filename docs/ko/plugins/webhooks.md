---
read_when:
    - 외부 시스템에서 TaskFlow를 트리거하거나 구동하려는 경우
    - 번들 Webhook Plugin을 구성하고 있습니다.
summary: 'Webhook Plugin: 신뢰할 수 있는 외부 자동화를 위한 인증된 TaskFlow 인그레스'
title: Webhook Plugin
x-i18n:
    generated_at: "2026-07-12T01:09:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks Plugin은 신뢰할 수 있는 외부 시스템(Zapier, n8n, CI 작업, 내부 서비스)이 사용자 지정 Plugin을 작성하지 않고도 HTTP를 통해 관리형 OpenClaw TaskFlow를 생성하고 제어할 수 있도록 인증된 HTTP 경로를 추가합니다.

이 Plugin은 Gateway 프로세스 내부에서 실행됩니다. 원격 Gateway의 경우 해당 호스트에 설치하고 구성한 다음 Gateway를 다시 시작하세요. 기본적으로 구성된 경로가 없으므로 경로를 하나 이상 추가하기 전까지는 아무 작업도 수행하지 않습니다.

## 경로 구성

`plugins.entries.webhooks.config` 아래에 구성을 설정합니다.

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

경로 필드:

| 필드           | 필수 여부 | 기본값                        | 참고 사항                                      |
| -------------- | --------- | ----------------------------- | ---------------------------------------------- |
| `enabled`      | 아니요    | `true`                        |                                                |
| `path`         | 아니요    | `/plugins/webhooks/<routeId>` | 경로 간에 고유해야 합니다.                     |
| `sessionKey`   | 예        | -                             | 연결된 TaskFlow를 소유하는 세션입니다.          |
| `secret`       | 예        | -                             | 일반 문자열 또는 SecretRef입니다(아래 참조).   |
| `controllerId` | 아니요    | `webhooks/<routeId>`          | 기본 `create_flow` 컨트롤러로 사용됩니다.       |
| `description`  | 아니요    | -                             | 운영자 참고용입니다.                            |

`secret`에는 일반 문자열 또는 SecretRef `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`를 사용할 수 있습니다.

구성된 모든 경로는 현재 비밀 값을 확인할 수 있는지와 관계없이 시작 시 등록됩니다. 확인할 수 없는 비밀 값으로 인해 경로가 비활성화되거나 건너뛰어지지는 않습니다. 비밀 값을 확인할 수 있을 때까지 해당 경로에 대한 요청은 인증에 실패합니다(`401`). SecretRef 값은 요청할 때마다 다시 확인되므로 기반 비밀 값(환경 변수, 파일 또는 실행 결과)을 교체하면 Gateway를 다시 시작하지 않아도 적용됩니다.

## 보안 모델

각 경로는 구성된 `sessionKey`의 TaskFlow 권한으로 작동합니다. 즉, 해당 세션이 소유한 모든 TaskFlow를 검사하고 변경할 수 있습니다. TaskFlow 접근은 항상 `api.runtime.tasks.managedFlows.bindSession(...)`을 거치므로 경로는 연결된 세션 외부에서 절대 작업할 수 없습니다. 피해 범위를 제한하려면 다음 지침을 따르세요.

- 경로마다 강력하고 고유한 비밀 값을 사용하세요.
- 인라인 일반 텍스트 비밀 값보다 SecretRef를 우선 사용하세요.
- 워크플로에 적합한 가장 제한적인 세션에 경로를 연결하세요.
- 필요한 특정 Webhook 경로만 노출하세요.

각 경로의 요청 처리 순서는 HTTP 메서드(`POST`만 허용) 및 `Content-Type: application/json` 검사, 고정 구간 속도 제한(경로+클라이언트 IP 키마다 60초 구간당 요청 120개, 최대 4,096개 키 추적), 처리 중 요청 제한(키마다 동시 요청 8개, 최대 4,096개 키 추적), 공유 비밀 인증, 256KB/15초 제한의 JSON 본문 읽기 순입니다. 앞선 검사에서 실패한 요청은 이후 단계에 도달하지 않습니다.

## 요청 형식

`Content-Type: application/json`과 함께 `Authorization: Bearer <secret>` 또는 `x-openclaw-webhook-secret: <secret>`을 사용하여 `POST` 요청을 전송합니다.

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 지원되는 작업

| 작업               | 목적                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | 경로의 세션에 대한 관리형 TaskFlow를 생성합니다.                    |
| `get_flow`         | ID로 TaskFlow 하나를 가져옵니다.                                    |
| `list_flows`       | 경로의 세션에 대한 TaskFlow 목록을 조회합니다.                      |
| `find_latest_flow` | 가장 최근에 업데이트된 TaskFlow를 가져옵니다.                       |
| `resolve_flow`     | 불투명 토큰으로 TaskFlow를 확인합니다.                              |
| `get_task_summary` | TaskFlow의 작업 요약을 가져옵니다.                                  |
| `set_waiting`      | 선택적 상태/대기 데이터와 함께 TaskFlow를 대기 상태로 표시합니다.   |
| `resume_flow`      | 대기 중이거나 차단된 TaskFlow를 재개합니다.                         |
| `finish_flow`      | TaskFlow를 완료 상태로 표시합니다.                                  |
| `fail_flow`        | TaskFlow를 실패 상태로 표시합니다.                                  |
| `request_cancel`   | 협력적 취소를 요청합니다.                                           |
| `cancel_flow`      | TaskFlow를 취소합니다(하위 작업이 아직 활성 상태이면 `202`를 반환할 수 있습니다). |
| `run_task`         | 기존 TaskFlow 내부에 관리형 하위 작업을 생성합니다.                 |

변경 작업(`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`, `request_cancel`)에는 낙관적 동시성 제어를 위해 `flowId`와 `expectedRevision`이 필요합니다. 오래된 리비전을 사용하면 `409 revision_conflict`가 반환됩니다.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

허용되는 `runtime` 값은 `subagent`, `acp`입니다. `startedAt`, `lastEventAt`, `progressSummary`는 `status`가 `"running"`일 때만 유효합니다. 다른 상태와 함께 전송하면 `400 invalid_request`가 반환됩니다.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## 응답 형식

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

흐름 및 작업 뷰에는 소유자/세션 메타데이터가 포함되지 않으므로 응답을 통해 경로에 연결된 `sessionKey`가 유출될 수 없습니다. `code` 값에는 `not_found`, `not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`, `cancel_pending`, `terminal`, `invalid_request`, `request_rejected`가 포함됩니다. 또한 위의 명명된 코드로 처리되지 않는 이유로 변경이 거부되면 작업별 대체 코드(`mutation_rejected`, `create_rejected`, `task_not_created`, `cancel_rejected`)가 사용됩니다.

## 관련 문서

- [훅](/ko/automation/hooks) - 내부 이벤트 기반 훅과 이 HTTP 기반 TaskFlow 브리지의 차이
- [Gateway Webhook(`hooks.*` 구성)](/ko/automation/cron-jobs#webhooks) - 별도의 범용 Gateway HTTP 엔드포인트 기능이며, 이 Plugin의 경로와는 다릅니다.
- [Plugin 런타임 SDK](/ko/plugins/sdk-runtime)
- [CLI Webhook](/ko/cli/webhooks)
