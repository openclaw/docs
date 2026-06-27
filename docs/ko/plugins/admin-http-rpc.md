---
read_when:
    - Gateway WebSocket RPC 클라이언트를 사용할 수 없는 호스트 도구 빌드
    - 신뢰할 수 있는 비공개 인그레스 뒤에 Gateway 관리자 자동화 노출
    - Gateway 메서드에 대한 HTTP 액세스의 보안 모델 감사
summary: 선택된 Gateway 제어 플레인 메서드를 번들로 제공되는 옵트인 admin-http-rpc Plugin을 통해 노출
title: 관리자 HTTP RPC Plugin
x-i18n:
    generated_at: "2026-06-27T17:41:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

번들된 `admin-http-rpc` Plugin은 일반 Gateway WebSocket RPC 클라이언트를 사용할 수 없는 신뢰된 호스트 자동화를 위해 선택된 Gateway 제어 평면 메서드를 HTTP로 노출합니다.

이 Plugin은 OpenClaw에 포함되어 있지만 기본적으로 꺼져 있습니다. 비활성화되어 있으면 라우트가 등록되지 않습니다. 활성화하면 다음이 추가됩니다.

- `POST /api/v1/admin/rpc`
- Gateway와 동일한 리스너: `http://<gateway-host>:<port>/api/v1/admin/rpc`

비공개 호스트 도구, tailnet 자동화, 또는 신뢰된 내부 인그레스에만 활성화하세요. 이 라우트를 공개 인터넷에 직접 노출하지 마세요.

## 활성화하기 전에

관리자 HTTP RPC는 전체 운영자 제어 평면 표면입니다. Gateway HTTP 인증을 통과하는 모든 호출자는 이 페이지의 허용 목록에 있는 메서드를 호출할 수 있습니다.

다음이 모두 참일 때 사용하세요.

- 호출자가 Gateway를 운영하도록 신뢰됩니다.
- 호출자가 WebSocket RPC 클라이언트를 사용할 수 없습니다.
- 라우트가 loopback, tailnet, 또는 비공개 인증 인그레스에서만 도달 가능합니다.
- 허용된 메서드를 검토했으며 실행하려는 자동화와 일치합니다.

Gateway WebSocket 연결을 열어 둘 수 있는 OpenClaw 클라이언트와 대화형 도구에는 WebSocket RPC 경로를 사용하세요.

## 활성화

번들된 Plugin을 활성화합니다.

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
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

라우트는 Plugin 시작 중에 등록됩니다. Plugin 설정을 변경한 뒤 Gateway를 다시 시작하세요.

HTTP 표면이 더 이상 필요하지 않으면 비활성화하세요.

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## 라우트 확인

가장 작은 안전한 요청으로 `health`를 사용하세요.

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

성공한 응답에는 `ok: true`가 있습니다.

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Plugin이 비활성화되어 있으면 라우트가 등록되지 않았으므로 `404`를 반환합니다.

## 인증

Plugin 라우트는 Gateway HTTP 인증을 사용합니다.

일반적인 인증 경로:

- 공유 시크릿 인증(`gateway.auth.mode="token"` 또는 `"password"`): `Authorization: Bearer <token-or-password>`
- 신뢰된 ID 포함 HTTP 인증(`gateway.auth.mode="trusted-proxy"`): 구성된 ID 인식 프록시를 통해 라우팅하고 필요한 ID 헤더를 주입하게 합니다
- 비공개 인그레스 개방 인증(`gateway.auth.mode="none"`): 인증 헤더가 필요하지 않습니다

## 보안 모델

이 Plugin을 전체 Gateway 운영자 표면으로 취급하세요.

- Plugin을 활성화하면 `/api/v1/admin/rpc`에서 허용 목록에 있는 관리자 RPC 메서드에 대한 접근을 의도적으로 제공합니다.
- Plugin은 예약된 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 매니페스트 계약을 선언하므로, Gateway 인증 HTTP 라우트가 프로세스 내에서 제어 평면 메서드를 디스패치할 수 있습니다.
- 공유 시크릿 bearer 인증은 gateway 운영자 시크릿의 보유를 증명합니다.
- `token` 및 `password` 인증의 경우 더 좁은 `x-openclaw-scopes` 헤더는 무시되고 일반적인 전체 운영자 기본값이 복원됩니다.
- 신뢰된 ID 포함 HTTP 모드는 `x-openclaw-scopes`가 있을 때 이를 존중합니다.
- `gateway.auth.mode="none"`은 Plugin이 활성화되어 있으면 이 라우트가 인증되지 않음을 의미합니다. 완전히 신뢰하는 비공개 인그레스 뒤에서만 사용하세요.
- 요청은 Plugin 라우트 인증을 통과한 뒤 WebSocket RPC와 동일한 Gateway 메서드 핸들러 및 범위 검사를 통해 디스패치됩니다.
- 이 라우트를 loopback, tailnet, 또는 비공개 신뢰 인그레스에 유지하세요. 공개 인터넷에 직접 노출하지 마세요.
- Plugin 매니페스트 계약은 샌드박스가 아닙니다. 예약된 SDK 헬퍼의 우발적 사용을 막지만, 신뢰된 Plugin은 여전히 Gateway 프로세스에서 실행됩니다.

호출자가 신뢰 경계를 넘는 경우 별도의 gateway를 사용하세요.

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
- `params`(any, 선택 사항): 메서드별 params입니다.

기본 최대 요청 본문 크기는 1 MB입니다.

## 응답

성공 응답은 Gateway RPC 형태를 사용합니다.

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway 메서드 오류는 다음을 사용합니다.

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

가능한 경우 HTTP 상태는 Gateway 오류를 따릅니다. 예를 들어 `INVALID_REQUEST`는 `400`을 반환하고, `UNAVAILABLE`은 `503`을 반환합니다.

## 허용된 메서드

- 탐색: `commands.list`
  이 Plugin에서 허용하는 HTTP RPC 메서드 이름을 반환합니다.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- config: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- channels: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- models: `models.list`, `models.authStatus`
- agents: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- approvals: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- devices: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tasks: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostics: `doctor.memory.status`, `update.status`

다른 Gateway 메서드는 의도적으로 추가될 때까지 차단됩니다.

## WebSocket 비교

일반 Gateway WebSocket RPC 경로는 OpenClaw 클라이언트에 권장되는 제어 평면 API로 유지됩니다. 요청/응답 HTTP 표면이 필요한 호스트 도구에만 관리자 HTTP RPC를 사용하세요.

신뢰된 장치 ID가 없는 공유 토큰 WebSocket 클라이언트는 연결 중에 관리자 범위를 스스로 선언할 수 없습니다. 관리자 HTTP RPC는 기존의 신뢰된 HTTP 운영자 모델을 의도적으로 따릅니다. Plugin이 활성화되어 있으면 공유 시크릿 bearer 인증은 이 관리자 표면에 대한 전체 운영자 접근으로 취급됩니다.

## 문제 해결

`404 Not Found`

: Plugin이 비활성화되어 있거나, 활성화한 뒤 Gateway가 다시 시작되지 않았거나, 요청이 다른 Gateway 프로세스로 가고 있습니다.

`401 Unauthorized`

: 요청이 Gateway HTTP 인증을 충족하지 못했습니다. bearer 토큰 또는 trusted-proxy ID 헤더를 확인하세요.

`400 INVALID_REQUEST`

: 요청 본문이 유효한 JSON이 아니거나, `method` 필드가 누락되었거나, 메서드가 Plugin 허용 목록에 없습니다.

`503 UNAVAILABLE`

: Gateway 메서드 핸들러를 사용할 수 없습니다. Gateway 로그를 확인하고 Gateway 시작이 완료된 뒤 다시 시도하세요.

## 관련 항목

- [운영자 범위](/ko/gateway/operator-scopes)
- [Gateway 보안](/ko/gateway/security)
- [원격 접근](/ko/gateway/remote)
- [Plugin 매니페스트](/ko/plugins/manifest#contracts)
- [SDK 하위 경로](/ko/plugins/sdk-subpaths)
