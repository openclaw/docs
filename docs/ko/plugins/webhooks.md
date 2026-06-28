---
read_when:
    - 외부 시스템에서 TaskFlows를 트리거하거나 구동하려는 경우
    - 번들된 Webhook Plugin을 구성하고 있습니다
summary: 'Webhooks Plugin: 신뢰할 수 있는 외부 자동화를 위한 인증된 TaskFlow 수신 경로'
title: Webhook Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Webhooks Plugin은 외부 자동화를 OpenClaw TaskFlow에 바인딩하는 인증된 HTTP 라우트를 추가합니다.

사용자 지정 Plugin을 먼저 작성하지 않고 Zapier, n8n, CI 작업 또는 내부 서비스 같은 신뢰할 수 있는 시스템이 관리형 TaskFlow를 생성하고 구동하도록 하려는 경우 사용하세요.

## 실행 위치

Webhooks Plugin은 Gateway 프로세스 안에서 실행됩니다.

Gateway가 다른 머신에서 실행되는 경우, 해당 Gateway 호스트에 Plugin을 설치하고 구성한 다음 Gateway를 재시작하세요.

## 라우트 구성

`plugins.entries.webhooks.config` 아래에 구성을 설정하세요.

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

라우트 필드:

- `enabled`: 선택 사항, 기본값은 `true`
- `path`: 선택 사항, 기본값은 `/plugins/webhooks/<routeId>`
- `sessionKey`: 바인딩된 TaskFlow를 소유하는 필수 세션
- `secret`: 필수 공유 시크릿 또는 SecretRef
- `controllerId`: 생성된 관리형 흐름의 선택적 컨트롤러 ID
- `description`: 선택적 운영자 메모

지원되는 `secret` 입력:

- 일반 문자열
- `source: "env" | "file" | "exec"`가 포함된 SecretRef

시크릿 기반 라우트가 시작 시 시크릿을 확인할 수 없으면, Plugin은 손상된 엔드포인트를 노출하는 대신 해당 라우트를 건너뛰고 경고를 기록합니다.

## 보안 모델

각 라우트는 구성된 `sessionKey`의 TaskFlow 권한으로 동작하도록 신뢰됩니다.

즉 라우트가 해당 세션이 소유한 TaskFlow를 검사하고 변경할 수 있으므로, 다음을 권장합니다.

- 라우트마다 강력하고 고유한 시크릿 사용
- 인라인 평문 시크릿보다 시크릿 참조 선호
- 워크플로에 맞는 가장 좁은 세션에 라우트 바인딩
- 필요한 특정 Webhook 경로만 노출

Plugin은 다음을 적용합니다.

- 공유 시크릿 인증
- 요청 본문 크기 및 제한 시간 가드
- 고정 윈도우 속도 제한
- 진행 중 요청 제한
- `api.runtime.tasks.managedFlows.bindSession(...)`를 통한 소유자 바인딩 TaskFlow 액세스

## 요청 형식

다음과 함께 `POST` 요청을 보내세요.

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` 또는 `x-openclaw-webhook-secret: <secret>`

예시:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 지원되는 작업

Plugin은 현재 다음 JSON `action` 값을 허용합니다.

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

라우트에 바인딩된 세션의 관리형 TaskFlow를 생성합니다.

예시:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

기존 관리형 TaskFlow 안에 관리형 하위 작업을 생성합니다.

허용되는 런타임은 다음과 같습니다.

- `subagent`
- `acp`

예시:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## 응답 형태

성공한 응답은 다음을 반환합니다.

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

거부된 요청은 다음을 반환합니다.

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin은 의도적으로 Webhook 응답에서 소유자/세션 메타데이터를 제거합니다.

## 관련 문서

- [Plugin 런타임 SDK](/ko/plugins/sdk-runtime)
- [후크와 Webhook 개요](/ko/automation/hooks)
- [CLI Webhook](/ko/cli/webhooks)
