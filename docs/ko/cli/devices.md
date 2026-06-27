---
read_when:
    - 기기 페어링 요청을 승인하고 있습니다
    - 기기 토큰을 교체하거나 폐기해야 합니다
summary: '`openclaw devices`에 대한 CLI 참조(기기 페어링 + 토큰 순환/폐기)'
title: 기기
x-i18n:
    generated_at: "2026-06-27T17:17:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

디바이스 페어링 요청과 디바이스 범위 토큰을 관리합니다.

## 명령

### `openclaw devices list`

대기 중인 페어링 요청과 페어링된 디바이스를 나열합니다.

```
openclaw devices list
openclaw devices list --json
```

대기 중인 요청 출력은 디바이스가 이미 페어링된 경우, 디바이스의 현재
승인된 액세스 옆에 요청된 액세스를 표시합니다. 이렇게 하면 범위/역할
업그레이드가 페어링이 사라진 것처럼 보이지 않고 명확하게 드러납니다.

### `openclaw devices remove <deviceId>`

페어링된 디바이스 항목 하나를 제거합니다.

페어링된 디바이스 토큰으로 인증된 경우, 관리자가 아닌 호출자는
**자신의** 디바이스 항목만 제거할 수 있습니다. 다른 디바이스를 제거하려면
`operator.admin`이 필요합니다.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

페어링된 디바이스를 일괄 삭제합니다.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

정확한 `requestId`로 대기 중인 디바이스 페어링 요청을 승인합니다. `requestId`가
생략되었거나 `--latest`가 전달되면, OpenClaw는 선택된 대기 중인 요청만
출력하고 종료합니다. 세부 정보를 확인한 뒤 정확한 요청 ID로 승인을
다시 실행하세요.

<Note>
디바이스가 변경된 인증 세부 정보(역할, 범위 또는 공개 키)로 페어링을 다시 시도하면, OpenClaw는 이전 대기 항목을 대체하고 새 `requestId`를 발급합니다. 승인 직전에 `openclaw devices list`를 실행해 현재 ID를 사용하세요.
</Note>

디바이스가 이미 페어링되어 있고 더 넓은 범위 또는 더 넓은 역할을 요청하면,
OpenClaw는 기존 승인을 유지하고 새 대기 중인 업그레이드 요청을 생성합니다.
승인하기 전에 `openclaw devices list`의 `Requested` 및 `Approved` 열을 검토하거나
`openclaw devices approve --latest`를 사용해 정확한 업그레이드를 미리 확인하세요.

Gateway가 명시적으로 `gateway.nodes.pairing.autoApproveCidrs`로 구성된 경우,
일치하는 클라이언트 IP에서 온 최초 `role: node` 요청은 이 목록에 나타나기 전에
승인될 수 있습니다. 이 정책은 기본적으로 비활성화되어 있으며
운영자/브라우저 클라이언트나 업그레이드 요청에는 절대 적용되지 않습니다.

노드 또는 기타 비운영자 디바이스 역할을 승인하려면 `operator.admin`이 필요합니다.
요청된 운영자 범위가 호출자 자신의 범위 안에 머무르는 경우에만
운영자 디바이스 승인에는 `operator.pairing`으로 충분합니다. 승인 시점 검사에
대해서는 [운영자 범위](/ko/gateway/operator-scopes)를 참조하세요.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Paperclip / `openclaw_gateway` 최초 실행 승인

새 Paperclip 에이전트가 처음으로 `openclaw_gateway` 어댑터를 통해 연결되면, 실행이 성공하기 전에 Gateway가 일회성 디바이스 페어링 승인을 요구할 수 있습니다. Paperclip이 `openclaw_gateway_pairing_required`를 보고하면, 대기 중인 디바이스를 승인한 뒤 다시 시도하세요.

로컬 Gateway의 경우 최신 대기 요청을 미리 봅니다.

```bash
openclaw devices approve --latest
```

미리보기는 정확한 `openclaw devices approve <requestId>` 명령을 출력합니다. 요청 세부 정보를 확인한 뒤 해당 명령을 요청 ID와 함께 다시 실행해 승인하세요.

원격 Gateway 또는 명시적 자격 증명의 경우, 미리보기와 승인 시 같은 옵션을 전달하세요.

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

재시작 후 다시 승인하지 않으려면, 실행마다 새 임시 ID를 생성하는 대신 Paperclip 어댑터 구성에 영구 디바이스 키를 유지하세요.

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

승인이 계속 실패하면, 먼저 `openclaw devices list`를 실행해 대기 중인 요청이 있는지 확인하세요.

### `openclaw devices reject <requestId>`

대기 중인 디바이스 페어링 요청을 거부합니다.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

특정 역할의 디바이스 토큰을 교체합니다(선택적으로 범위를 업데이트).
대상 역할은 해당 디바이스의 승인된 페어링 계약에 이미 존재해야 합니다.
교체로 승인되지 않은 새 역할을 발급할 수는 없습니다.
`--scope`를 생략하면, 저장된 교체 토큰으로 나중에 다시 연결할 때 해당
토큰의 캐시된 승인 범위를 재사용합니다. 명시적 `--scope` 값을 전달하면,
해당 값들이 이후 캐시된 토큰 재연결을 위한 저장 범위 집합이 됩니다.
관리자가 아닌 페어링된 디바이스 호출자는 **자신의** 디바이스 토큰만 교체할 수 있습니다.
대상 토큰 범위 집합은 호출자 세션 자체의 운영자 범위 안에 머물러야 합니다.
교체로 호출자가 이미 가진 것보다 더 넓은 운영자 토큰을 발급하거나 보존할 수는 없습니다.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

교체 메타데이터를 JSON으로 반환합니다. 호출자가 해당 디바이스 토큰으로 인증된
상태에서 자신의 토큰을 교체하는 경우, 응답에는 클라이언트가 다시 연결하기 전에
영구 저장할 수 있도록 대체 토큰도 포함됩니다. 공유/관리자 교체는 bearer 토큰을
다시 출력하지 않습니다.

### `openclaw devices revoke --device <id> --role <role>`

특정 역할의 디바이스 토큰을 폐기합니다.

관리자가 아닌 페어링된 디바이스 호출자는 **자신의** 디바이스 토큰만 폐기할 수 있습니다.
다른 디바이스의 토큰을 폐기하려면 `operator.admin`이 필요합니다.
대상 토큰 범위 집합도 호출자 세션 자체의 운영자 범위 안에 맞아야 합니다.
페어링 전용 호출자는 관리자/쓰기 운영자 토큰을 폐기할 수 없습니다.

```
openclaw devices revoke --device <deviceId> --role node
```

폐기 결과를 JSON으로 반환합니다.

## 공통 옵션

- `--url <url>`: Gateway WebSocket URL(구성된 경우 기본값은 `gateway.remote.url`).
- `--token <token>`: Gateway 토큰(필요한 경우).
- `--password <password>`: Gateway 비밀번호(비밀번호 인증).
- `--timeout <ms>`: RPC 제한 시간.
- `--json`: JSON 출력(스크립팅에 권장).

<Warning>
`--url`을 설정하면 CLI는 구성 또는 환경 자격 증명으로 대체하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하세요. 명시적 자격 증명이 없으면 오류입니다.
</Warning>

## 참고

- 토큰 교체는 새 토큰(민감 정보)을 반환합니다. 비밀처럼 취급하세요.
- 이 명령에는 `operator.pairing`(또는 `operator.admin`) 범위가 필요합니다. 일부
  승인에서는 호출자가 대상 디바이스가 발급하거나 상속할 운영자 범위도 보유해야 합니다.
  비운영자 디바이스 역할에는 `operator.admin`이 필요합니다.
  [운영자 범위](/ko/gateway/operator-scopes)를 참조하세요.
- `gateway.nodes.pairing.autoApproveCidrs`는 새 노드 디바이스 페어링에만 적용되는
  옵트인 Gateway 정책입니다. CLI 승인 권한은 변경하지 않습니다.
- 토큰 교체와 폐기는 해당 디바이스의 승인된 페어링 역할 집합 및 승인된 범위
  기준선 안에 머무릅니다. stray 캐시 토큰 항목은 토큰 관리 대상을 부여하지 않습니다.
- 페어링된 디바이스 토큰 세션의 경우, 교차 디바이스 관리는 관리자 전용입니다.
  호출자에게 `operator.admin`이 없으면 `remove`, `rotate`, `revoke`는 자기 자신에게만 적용됩니다.
- 토큰 변경도 호출자 범위 안에 제한됩니다. 페어링 전용 세션은 현재
  `operator.admin` 또는 `operator.write`를 가진 토큰을 교체하거나 폐기할 수 없습니다.
- `devices clear`는 의도적으로 `--yes`로 보호됩니다.
- local loopback에서 페어링 범위를 사용할 수 없는 경우(그리고 명시적 `--url`이 전달되지 않은 경우), list/approve는 로컬 페어링 대체 경로를 사용할 수 있습니다.
- `devices approve`는 토큰을 발급하기 전에 명시적 요청 ID가 필요합니다. `requestId`를 생략하거나 `--latest`를 전달하면 가장 최근의 대기 중인 요청만 미리 봅니다.

## 토큰 드리프트 복구 체크리스트

Control UI 또는 다른 클라이언트가 `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` 또는 `AUTH_SCOPE_MISMATCH`로 계속 실패할 때 사용하세요.

1. 현재 Gateway 토큰 소스를 확인합니다.

```bash
openclaw config get gateway.auth.token
```

2. 페어링된 디바이스를 나열하고 영향을 받는 디바이스 ID를 식별합니다.

```bash
openclaw devices list
```

3. 영향을 받는 디바이스의 운영자 토큰을 교체합니다.

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 교체만으로 충분하지 않으면 오래된 페어링을 제거하고 다시 승인합니다.

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 현재 공유 토큰/비밀번호로 클라이언트 연결을 다시 시도합니다.

참고:

- 일반적인 재연결 인증 우선순위는 명시적 공유 토큰/비밀번호, 명시적 `deviceToken`, 저장된 디바이스 토큰, 부트스트랩 토큰 순입니다.
- 신뢰할 수 있는 `AUTH_TOKEN_MISMATCH` 복구는 제한된 한 번의 재시도를 위해 공유 토큰과 저장된 디바이스 토큰을 함께 임시로 보낼 수 있습니다.
- `AUTH_SCOPE_MISMATCH`는 디바이스 토큰이 인식되었지만 요청된 범위 집합을 포함하지 않는다는 뜻입니다. 공유 Gateway 인증을 변경하기 전에 페어링/범위 승인 계약을 수정하세요.

관련 항목:

- [Dashboard 인증 문제 해결](/ko/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 문제 해결](/ko/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 관련 항목

- [CLI 참조](/ko/cli)
- [노드](/ko/nodes)
