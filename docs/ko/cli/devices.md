---
read_when:
    - 기기 페어링 요청을 승인하고 있습니다
    - 기기 토큰을 교체하거나 폐기해야 합니다
summary: '`openclaw devices`의 CLI 참조(기기 페어링 + 토큰 교체/폐기)'
title: 기기
x-i18n:
    generated_at: "2026-07-12T00:37:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

기기 페어링 요청과 기기 범위 토큰을 관리합니다.

## 공통 옵션

- `--url <url>`: Gateway WebSocket URL(구성된 경우 기본값은 `gateway.remote.url`)
- `--token <token>`: Gateway 토큰(필요한 경우)
- `--password <password>`: Gateway 비밀번호(비밀번호 인증)
- `--timeout <ms>`: RPC 시간 제한
- `--json`: JSON 출력(스크립팅에 권장)

<Warning>
`--url`을 설정하면 CLI는 구성 또는 환경의 자격 증명으로 대체하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하지 않으면 명령에서 오류가 발생합니다.
</Warning>

## 명령

### `openclaw devices list`

대기 중인 페어링 요청과 페어링된 기기를 나열합니다.

```bash
openclaw devices list
openclaw devices list --json
```

이미 페어링된 기기에 대기 중인 요청이 있으면 출력에서 요청된 액세스를 기기의 현재 승인된 액세스 옆에 표시하므로, 페어링이 손실된 것처럼 보이지 않고 범위/역할 업그레이드를 확인할 수 있습니다.

페어링된 기기의 표시 이름에는 다음 우선순위가 적용됩니다. 운영자 레이블(`devices rename`의 `operatorLabel`), 클라이언트 `displayName`, `clientId`, `deviceId` 순입니다.

### `openclaw devices approve [requestId] [--latest]`

정확한 `requestId`로 대기 중인 페어링 요청을 승인합니다. `requestId`를 생략하거나 `--latest`를 전달하면 가장 최근의 대기 중 요청을 미리 보기만 하고 종료합니다(코드 1). 승인하려면 정확한 요청 ID로 다시 실행하세요.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
기기가 변경된 인증 세부 정보(역할, 범위 또는 공개 키)로 페어링을 다시 시도하면 OpenClaw는 이전 대기 항목을 새로운 `requestId`로 대체합니다. 승인 직전에 `openclaw devices list`를 실행하여 현재 ID를 확인하세요.
</Note>

승인 동작:

- 기기가 이미 페어링되어 있고 더 넓은 범위나 역할을 요청하면 OpenClaw는 기존 승인을 유지하고 새로운 대기 중 업그레이드 요청을 생성합니다. 승인하기 전에 `openclaw devices list`에서 `Requested`와 `Approved`를 비교하거나 `--latest`로 미리 보세요.
- `node` 역할 또는 기타 비운영자 역할을 승인하려면 `operator.admin`이 필요합니다. 운영자 기기 승인에는 `operator.pairing`이면 충분하지만, 요청된 운영자 범위가 호출자 자신의 범위 내에 있는 경우에만 가능합니다. [운영자 범위](/ko/gateway/operator-scopes)를 참조하세요.
- `gateway.nodes.pairing.autoApproveCidrs`가 구성되어 있으면 일치하는 클라이언트 IP에서 처음 요청된 `role: node`는 이 목록에 나타나기 전에 자동 승인될 수 있습니다. 기본적으로 비활성화되어 있으며 운영자/브라우저 클라이언트 또는 업그레이드 요청에는 절대 적용되지 않습니다.
- `gateway.nodes.pairing.sshVerify`(기본적으로 활성화)는 Gateway가 SSH를 통해 Node 호스트의 기기 키를 확인하면 처음 요청된 `role: node`를 자동 승인합니다. 따라서 요청이 나타난 직후 승인됨 상태로 전환될 수 있습니다. SSH 확인을 비활성화하려면 `sshVerify: false`를 설정하세요. 이는 `autoApproveCidrs`와 독립적이므로 수동 전용 페어링을 사용하려면 해당 설정도 해제하세요.

### `openclaw devices reject <requestId>`

대기 중인 기기 페어링 요청을 거부합니다.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

페어링된 기기 항목 하나를 제거합니다.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

페어링된 기기 토큰으로 인증한 호출자는 **자신의** 기기 항목만 제거할 수 있습니다. 다른 기기를 제거하려면 `operator.admin`이 필요합니다.

### `openclaw devices rename --device <id> --name <label>`

페어링된 기기에 운영자 레이블을 지정합니다. 레이블은 소유자 측 상태입니다. 페어링 복구 및 역할 재승인 후에도 유지되며 안정적인 `deviceId`를 변경하지 않습니다.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name`은 필수이며, 앞뒤 공백을 제거한 후 비어 있지 않아야 하고 최대 64자로 제한됩니다.
- 표시 화면(CLI 목록, Control UI 인벤토리)은 클라이언트가 보고한 표시 이름보다 운영자 레이블을 우선합니다.
- 관리자가 아닌 페어링된 기기 호출자는 **자신의** 기기 이름만 변경할 수 있습니다. 다른 기기의 이름을 변경하려면 `operator.admin`이 필요합니다.

### `openclaw devices clear --yes [--pending]`

페어링된 기기를 일괄 삭제합니다. `--yes`가 있어야 실행됩니다.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending`은 대기 중인 모든 페어링 요청도 거부합니다.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

역할에 대한 기기 토큰을 교체하고, 선택적으로 해당 범위를 업데이트합니다.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- 대상 역할은 해당 기기의 승인된 페어링 계약에 이미 존재해야 합니다. 교체를 통해 승인되지 않은 새로운 역할을 발급할 수 없습니다.
- `--scope`를 생략하면 이후 재연결 시 저장된 토큰에 캐시된 승인 범위를 재사용합니다. 명시적인 `--scope` 값을 전달하면 향후 캐시된 토큰으로 재연결할 때 사용할 저장된 범위 집합을 대체합니다.
- 관리자가 아닌 페어링된 기기 호출자는 **자신의** 기기 토큰만 교체할 수 있으며, 대상 범위 집합은 호출자 자신의 운영자 범위 내에 있어야 합니다. 교체를 통해 호출자가 이미 보유한 것보다 더 넓은 토큰을 발급하거나 유지할 수 없습니다.

교체 메타데이터를 JSON으로 반환합니다. 호출자가 해당 기기 토큰으로 인증한 상태에서 자신의 토큰을 교체하면, 클라이언트가 재연결 전에 저장할 수 있도록 응답에 대체 토큰이 포함됩니다. 공유/관리자 교체에서는 전달자 토큰을 절대 응답에 포함하지 않습니다.

### `openclaw devices revoke --device <id> --role <role>`

역할에 대한 기기 토큰을 폐기합니다.

```bash
openclaw devices revoke --device <deviceId> --role node
```

관리자가 아닌 페어링된 기기 호출자는 **자신의** 기기 토큰만 폐기할 수 있습니다. 다른 기기의 토큰을 폐기하려면 `operator.admin`이 필요합니다. 대상 범위 집합도 호출자 자신의 운영자 범위 내에 있어야 합니다. 페어링 전용 호출자는 관리자/쓰기 운영자 토큰을 폐기할 수 없습니다.

## 참고

- 이러한 명령에는 `operator.pairing`(또는 `operator.admin`) 범위가 필요합니다. 비운영자 기기 역할에는 항상 `operator.admin`이 필요합니다. [운영자 범위](/ko/gateway/operator-scopes)를 참조하세요.
- 토큰 교체와 폐기는 기기의 승인된 페어링 역할 집합과 범위 기준선 내에서만 수행됩니다. 관련 없이 남은 캐시 토큰 항목은 토큰 관리 대상을 부여하지 않습니다.
- 페어링된 기기 토큰 세션에서 기기 간 관리(`remove`, `rename`, `rotate`, `revoke`)는 호출자에게 `operator.admin`이 없는 한 자신의 기기로만 제한됩니다.
- 토큰 교체는 새로운 토큰(민감 정보)을 반환합니다. 비밀 정보처럼 취급하세요.
- local loopback에서 페어링 범위를 사용할 수 없고 명시적인 `--url`이 전달되지 않은 경우, `list`/`approve`는 로컬 페어링 상태를 대신 사용할 수 있습니다.

## 토큰 불일치 복구 체크리스트

Control UI 또는 기타 클라이언트가 `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` 또는 `AUTH_SCOPE_MISMATCH` 오류로 계속 실패할 때 사용하세요.

1. 현재 Gateway 토큰 출처를 확인합니다.

   ```bash
   openclaw config get gateway.auth.token
   ```

2. 페어링된 기기를 나열하고 영향을 받는 기기 ID를 식별합니다.

   ```bash
   openclaw devices list
   ```

3. 영향을 받는 기기의 운영자 토큰을 교체합니다.

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. 교체로 충분하지 않으면 오래된 페어링을 제거하고 다시 승인합니다.

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. 현재 공유 토큰/비밀번호로 클라이언트 연결을 다시 시도합니다.

참고:

- 일반적인 재연결 인증 우선순위: 명시적인 공유 토큰/비밀번호, 명시적인 `deviceToken`, 저장된 기기 토큰, 부트스트랩 토큰 순입니다.
- 신뢰할 수 있는 `AUTH_TOKEN_MISMATCH` 복구에서는 제한된 한 번의 재시도를 위해 공유 토큰과 저장된 기기 토큰을 일시적으로 함께 전송할 수 있습니다.
- `AUTH_SCOPE_MISMATCH`는 기기 토큰이 인식되었지만 요청된 범위 집합을 포함하지 않는다는 의미입니다. 공유 Gateway 인증을 변경하기 전에 페어링/범위 승인 계약을 수정하세요.

관련 문서:

- [대시보드 인증 문제 해결](/ko/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 문제 해결](/ko/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip / `openclaw_gateway` 최초 실행 승인

`openclaw_gateway` 어댑터를 통해 연결하는 Paperclip 에이전트는 다른 모든 새 클라이언트와 동일한 최초 실행 기기 페어링 승인을 거칩니다. Paperclip에서 `openclaw_gateway_pairing_required`를 보고하면 대기 중인 기기를 승인하고 다시 시도하세요.

```bash
openclaw devices approve --latest
```

미리 보기에는 정확한 `openclaw devices approve <requestId>` 명령이 출력됩니다. 세부 정보를 확인한 다음 요청 ID와 함께 해당 명령을 다시 실행하여 승인하세요. 원격 Gateway 또는 명시적인 자격 증명을 사용하는 경우 미리 보기 및 승인 시 동일한 옵션을 전달하세요.

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

다시 시작할 때마다 재승인하지 않으려면 매번 새로운 임시 기기 ID를 생성하도록 두는 대신 Paperclip에 영구 `adapterConfig.devicePrivateKeyPem`을 구성하세요.

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

승인이 계속 실패하면 먼저 `openclaw devices list`를 실행하여 대기 중인 요청이 있는지 확인하세요.

## 관련 문서

- [CLI 참조](/ko/cli)
- [Node](/ko/nodes)
