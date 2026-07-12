---
read_when:
    - Gateway WebSocket RPC 클라이언트를 사용할 수 없는 호스트 도구 구축
    - 신뢰할 수 있는 비공개 인그레스 뒤에 Gateway 관리 자동화 노출하기
    - Gateway 메서드에 대한 HTTP 접근 보안 모델 감사
summary: 번들로 제공되는 선택형 admin-http-rpc Plugin을 통해 선택한 Gateway 제어 영역 메서드 노출
title: 관리자 HTTP RPC Plugin
x-i18n:
    generated_at: "2026-07-12T00:59:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

번들 `admin-http-rpc` Plugin은 Gateway WebSocket 연결을 계속 열어 둘 수 없는 신뢰할 수 있는 호스트 자동화를 위해, 허용 목록에 포함된 Gateway 제어 영역 메서드 집합을 HTTP를 통해 제공합니다.

이 Plugin은 OpenClaw와 함께 제공되지만 기본적으로 비활성화되어 있으며, 비활성화된 상태에서는 경로가 등록되지 않습니다. 활성화하면 Gateway와 동일한 리스너에 `POST /api/v1/admin/rpc`가 추가됩니다(`http://<gateway-host>:<port>/api/v1/admin/rpc`).

비공개 호스트 도구, tailnet 자동화 또는 신뢰할 수 있는 내부 인그레스에만 활성화하세요. 이 경로를 공개 인터넷에 직접 노출해서는 안 됩니다.

## 활성화하기 전에

관리자 HTTP RPC는 완전한 운영자 제어 영역 표면입니다. Gateway HTTP 인증을 통과한 모든 호출자는 아래의 허용 목록에 포함된 메서드를 호출할 수 있습니다. 다음 조건을 모두 충족하는 경우에만 활성화하세요.

- 호출자가 Gateway를 운영할 수 있다고 신뢰할 수 있습니다.
- 호출자가 WebSocket RPC 클라이언트를 사용할 수 없습니다.
- 경로가 loopback, tailnet 또는 비공개 인증 인그레스에서만 접근 가능합니다.
- 허용된 메서드를 검토했으며 실행하려는 자동화와 일치합니다.

Gateway WebSocket 연결을 계속 열어 둘 수 있는 OpenClaw 클라이언트와 대화형 도구에는 대신 WebSocket RPC를 사용하세요.

## 활성화

번들 Plugin을 활성화합니다.

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="구성">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

경로는 Plugin 시작 중에 등록되므로 Plugin 구성을 변경한 후 Gateway를 다시 시작하세요.

HTTP 표면이 더 이상 필요하지 않으면 비활성화하세요.

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## 경로 확인

가장 작고 안전한 요청으로 `health`를 사용하세요.

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

성공한 응답에는 `ok: true`가 포함됩니다.

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Plugin이 비활성화된 경우 경로가 등록되지 않았으므로 `404`가 반환됩니다.

## 인증

Plugin 경로는 Gateway HTTP 인증을 사용합니다.

일반적인 인증 방식:

- 공유 비밀 인증(`gateway.auth.mode="token"` 또는 `"password"`): `Authorization: Bearer <token-or-password>`
- 신뢰할 수 있는 ID 포함 HTTP 인증(`gateway.auth.mode="trusted-proxy"`): 구성된 ID 인식 프록시를 통해 라우팅하고 프록시가 필수 ID 헤더를 주입하도록 합니다.
- 비공개 인그레스 공개 인증(`gateway.auth.mode="none"`): 인증 헤더가 필요하지 않습니다.

## 보안 모델

이 Plugin을 완전한 Gateway 운영자 표면으로 취급하세요.

- Plugin을 활성화하면 `/api/v1/admin/rpc`에서 허용 목록에 포함된 관리자 RPC 메서드에 대한 접근이 의도적으로 제공됩니다.
- Plugin은 예약된 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 매니페스트 계약을 선언하며, 이를 통해 Gateway 인증을 거친 HTTP 경로가 프로세스 내에서 제어 영역 메서드를 디스패치할 수 있습니다. 이는 샌드박스가 아닙니다. 이 계약은 예약된 SDK 도우미의 우발적인 사용을 방지하지만, 신뢰할 수 있는 Plugin은 여전히 Gateway 프로세스에서 실행됩니다.
- 공유 비밀 전달자 인증(`token`/`password` 모드)은 Gateway 운영자 비밀을 보유하고 있음을 증명합니다. 이 경로에서는 더 제한적인 `x-openclaw-scopes` 헤더가 무시되고 일반적인 전체 운영자 기본값이 복원됩니다.
- 신뢰할 수 있는 ID 포함 HTTP 인증(`trusted-proxy` 모드)은 `x-openclaw-scopes`가 있으면 이를 적용합니다.
- `gateway.auth.mode="none"`은 Plugin이 활성화된 경우 이 경로가 인증되지 않음을 의미합니다. 완전히 신뢰할 수 있는 비공개 인그레스 뒤에서만 사용하세요.
- 요청은 Plugin 경로 인증을 통과한 후 WebSocket RPC와 동일한 Gateway 메서드 처리기 및 범위 검사를 통해 디스패치됩니다.
- 준비된 일시 중단 리스 중에도 경로에 접근할 수 있습니다. 제한된 요청 검증과 로컬 `commands.list` 검색 응답은 계속 사용할 수 있습니다. Gateway로 디스패치되는 메서드 중 허용이 차단된 동안 실행할 수 있는 것은 `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`뿐이며, 허용 목록의 다른 메서드는 일반적인 재시도 가능한 Gateway `UNAVAILABLE` 응답을 반환합니다.
- 이 경로는 loopback, tailnet 또는 신뢰할 수 있는 비공개 인그레스에 두세요. 공개 인터넷에 직접 노출하지 마세요. 호출자가 신뢰 경계를 넘는 경우 별도의 Gateway를 사용하세요.

## 요청

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

필드:

- `id`(문자열, 선택 사항): 응답에 복사됩니다. 생략하면 UUID가 생성됩니다.
- `method`(문자열, 필수): 허용된 Gateway 메서드 이름입니다.
- `params`(임의 값, 선택 사항): 메서드별 매개변수입니다.

기본 최대 요청 본문 크기는 1MB입니다.

## 응답

성공 응답은 Gateway RPC 형식을 사용합니다.

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway 메서드 오류는 다음 형식을 사용합니다.

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

HTTP 상태는 오류 코드를 따릅니다.

| 오류 코드                  | HTTP 상태 |
| -------------------------- | --------- |
| `INVALID_REQUEST`          | 400       |
| `APPROVAL_NOT_FOUND`       | 404       |
| `NOT_LINKED`, `NOT_PAIRED` | 409       |
| `UNAVAILABLE`              | 503       |
| `AGENT_TIMEOUT`            | 504       |
| 기타 모든 코드             | 500       |

## 허용된 메서드

- 검색: `commands.list`
  이 Plugin이 허용하는 HTTP RPC 메서드 이름을 반환합니다.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- 구성: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- 채널: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- 웹: `web.login.start`, `web.login.wait`
- 모델: `models.list`, `models.authStatus`
- 에이전트: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- 승인: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- 기기: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Node: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- 작업: `tasks.list`, `tasks.get`, `tasks.cancel`
- 진단: `doctor.memory.status`, `update.status`

그 밖의 Gateway 메서드는 의도적으로 추가될 때까지 차단됩니다.

## WebSocket 비교

일반적인 Gateway WebSocket RPC 경로는 OpenClaw 클라이언트에 권장되는 제어 영역 API입니다. 요청/응답 HTTP 표면이 필요한 호스트 도구에만 관리자 HTTP RPC를 사용하세요.

신뢰할 수 있는 기기 ID가 없는 공유 토큰 WebSocket 클라이언트는 연결 중에 관리자 범위를 자체 선언할 수 없습니다. 관리자 HTTP RPC는 기존의 신뢰할 수 있는 HTTP 운영자 모델을 의도적으로 따릅니다. Plugin이 활성화된 경우 공유 비밀 전달자 인증은 이 관리자 표면에 대한 전체 운영자 접근 권한으로 취급됩니다.

## 문제 해결

`404 Not Found`

: Plugin이 비활성화되어 있거나, 활성화한 후 Gateway를 다시 시작하지 않았거나, 요청이 다른 Gateway 프로세스로 전달되고 있습니다.

`401 Unauthorized`

: 요청이 Gateway HTTP 인증을 충족하지 못했습니다. 전달자 토큰 또는 trusted-proxy ID 헤더를 확인하세요.

`405 Method Not Allowed`

: 요청에서 `POST` 이외의 메서드를 사용했습니다.

`413 Payload Too Large`

: 요청 본문이 1MB 제한을 초과했습니다.

`400 INVALID_REQUEST`

: 요청 본문이 유효한 JSON이 아니거나, `method` 필드가 누락되었거나, 메서드가 Plugin 허용 목록에 없거나, 일시 중단 재개 ID가 활성 리스와 일치하지 않습니다.

`503 UNAVAILABLE`

: Gateway 메서드가 시작 중이거나, 속도 제한을 받거나, 일시 중단되었거나, 경합하는 일시 중단/재개 작업을 기다리고 있습니다. `error.details`가 있으면 확인하고, 재시도하기 전에 `error.retryAfterMs`를 준수하세요.

## 관련 항목

- [운영자 범위](/ko/gateway/operator-scopes)
- [Gateway 보안](/ko/gateway/security)
- [원격 접근](/ko/gateway/remote)
- [Plugin 매니페스트](/ko/plugins/manifest#contracts-reference)
- [SDK 하위 경로](/ko/plugins/sdk-subpaths)
