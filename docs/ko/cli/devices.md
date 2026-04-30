---
read_when:
    - 기기 페어링 요청을 승인하고 있습니다
    - 디바이스 토큰을 교체하거나 폐기해야 합니다
summary: '`openclaw devices`에 대한 CLI 참조(기기 페어링 + 토큰 교체/폐기)'
title: 장치
x-i18n:
    generated_at: "2026-04-30T06:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
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

대기 중인 요청 출력은 디바이스가 이미 페어링된 경우 디바이스의 현재
승인된 액세스 옆에 요청된 액세스를 표시합니다. 이렇게 하면 페어링이
사라진 것처럼 보이는 대신 스코프/역할 업그레이드가 명확해집니다.

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
생략되었거나 `--latest`가 전달된 경우, OpenClaw는 선택된 대기 중인
요청만 출력하고 종료합니다. 세부 정보를 확인한 뒤 정확한 요청 ID로
승인을 다시 실행하세요.

<Note>
디바이스가 변경된 인증 세부 정보(역할, 스코프 또는 공개 키)로 페어링을 다시 시도하면 OpenClaw는 이전 대기 항목을 대체하고 새 `requestId`를 발급합니다. 현재 ID를 사용하려면 승인 직전에 `openclaw devices list`를 실행하세요.
</Note>

디바이스가 이미 페어링되어 있고 더 넓은 스코프나 더 넓은 역할을 요청하는 경우,
OpenClaw는 기존 승인을 그대로 유지하고 새 대기 중인 업그레이드
요청을 만듭니다. 승인하기 전에 `openclaw devices list`의 `Requested`와
`Approved` 열을 검토하거나 `openclaw devices approve --latest`를 사용해
정확한 업그레이드를 미리 확인하세요.

Gateway가 명시적으로 `gateway.nodes.pairing.autoApproveCidrs`로 구성된 경우,
일치하는 클라이언트 IP에서 온 최초 `role: node` 요청은 이 목록에
나타나기 전에 승인될 수 있습니다. 이 정책은 기본적으로 비활성화되어
있으며 operator/브라우저 클라이언트나 업그레이드 요청에는 절대 적용되지 않습니다.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

대기 중인 디바이스 페어링 요청을 거부합니다.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

특정 역할의 디바이스 토큰을 교체합니다(선택적으로 스코프 업데이트).
대상 역할은 해당 디바이스의 승인된 페어링 계약에 이미 존재해야 합니다.
교체는 승인되지 않은 새 역할을 발급할 수 없습니다.
`--scope`를 생략하면, 저장된 교체 토큰으로 이후 다시 연결할 때 해당
토큰의 캐시된 승인 스코프를 재사용합니다. 명시적 `--scope` 값을 전달하면
해당 값이 향후 캐시 토큰 재연결에 사용할 저장된 스코프 세트가 됩니다.
관리자가 아닌 페어링된 디바이스 호출자는 **자신의** 디바이스 토큰만 교체할 수 있습니다.
대상 토큰 스코프 세트는 호출자 세션 자체의 operator 스코프 안에 있어야 합니다.
교체는 호출자가 이미 보유한 것보다 더 넓은 operator 토큰을 발급하거나
유지할 수 없습니다.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

교체 메타데이터를 JSON으로 반환합니다. 호출자가 해당 디바이스 토큰으로
인증된 상태에서 자신의 토큰을 교체하는 경우, 응답에는 클라이언트가
다시 연결하기 전에 저장할 수 있도록 대체 토큰도 포함됩니다. 공유/관리자
교체는 bearer 토큰을 다시 표시하지 않습니다.

### `openclaw devices revoke --device <id> --role <role>`

특정 역할의 디바이스 토큰을 취소합니다.

관리자가 아닌 페어링된 디바이스 호출자는 **자신의** 디바이스 토큰만 취소할 수 있습니다.
다른 디바이스의 토큰을 취소하려면 `operator.admin`이 필요합니다.
대상 토큰 스코프 세트도 호출자 세션 자체의 operator 스코프 안에 들어맞아야 합니다.
페어링 전용 호출자는 관리자/쓰기 operator 토큰을 취소할 수 없습니다.

```
openclaw devices revoke --device <deviceId> --role node
```

취소 결과를 JSON으로 반환합니다.

## 공통 옵션

- `--url <url>`: Gateway WebSocket URL(구성된 경우 기본값은 `gateway.remote.url`).
- `--token <token>`: Gateway 토큰(필요한 경우).
- `--password <password>`: Gateway 비밀번호(비밀번호 인증).
- `--timeout <ms>`: RPC 시간 제한.
- `--json`: JSON 출력(스크립팅에 권장).

<Warning>
`--url`을 설정하면 CLI는 구성이나 환경 자격 증명으로 폴백하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하세요. 명시적 자격 증명이 없으면 오류입니다.
</Warning>

## 참고

- 토큰 교체는 새 토큰(민감 정보)을 반환합니다. 비밀처럼 다루세요.
- 이 명령에는 `operator.pairing`(또는 `operator.admin`) 스코프가 필요합니다.
- `gateway.nodes.pairing.autoApproveCidrs`는 새 Node 디바이스 페어링에만 적용되는 선택적 Gateway 정책이며,
  CLI 승인 권한은 변경하지 않습니다.
- 토큰 교체와 취소는 해당 디바이스의 승인된 페어링 역할 세트와
  승인된 스코프 기준선 안에 머뭅니다. 이탈한 캐시 토큰 항목은
  토큰 관리 대상을 부여하지 않습니다.
- 페어링된 디바이스 토큰 세션에서 디바이스 간 관리는 관리자 전용입니다.
  호출자에게 `operator.admin`이 없는 한 `remove`, `rotate`, `revoke`는
  자기 자신에게만 적용됩니다.
- 토큰 변경도 호출자 스코프 안에 제한됩니다. 페어링 전용 세션은
  현재 `operator.admin` 또는 `operator.write`를 포함하는 토큰을
  교체하거나 취소할 수 없습니다.
- `devices clear`는 의도적으로 `--yes`로 보호됩니다.
- local loopback에서 페어링 스코프를 사용할 수 없고 명시적 `--url`이 전달되지 않은 경우, list/approve는 로컬 페어링 폴백을 사용할 수 있습니다.
- `devices approve`는 토큰을 발급하기 전에 명시적 요청 ID가 필요합니다. `requestId`를 생략하거나 `--latest`를 전달하면 최신 대기 요청을 미리 보기만 합니다.

## 토큰 드리프트 복구 체크리스트

Control UI 또는 다른 클라이언트가 `AUTH_TOKEN_MISMATCH` 또는 `AUTH_DEVICE_TOKEN_MISMATCH`로 계속 실패할 때 사용하세요.

1. 현재 Gateway 토큰 소스를 확인합니다.

```bash
openclaw config get gateway.auth.token
```

2. 페어링된 디바이스를 나열하고 영향을 받은 디바이스 ID를 식별합니다.

```bash
openclaw devices list
```

3. 영향을 받은 디바이스의 operator 토큰을 교체합니다.

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

- 일반 재연결 인증 우선순위는 명시적 공유 토큰/비밀번호가 먼저이고, 그다음 명시적 `deviceToken`, 저장된 디바이스 토큰, 부트스트랩 토큰 순입니다.
- 신뢰된 `AUTH_TOKEN_MISMATCH` 복구는 제한된 한 번의 재시도 동안 공유 토큰과 저장된 디바이스 토큰을 함께 임시로 보낼 수 있습니다.

관련 항목:

- [Dashboard 인증 문제 해결](/ko/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 문제 해결](/ko/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 관련 항목

- [CLI 참조](/ko/cli)
- [Nodes](/ko/nodes)
