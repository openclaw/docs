---
read_when:
    - 디바이스 페어링 요청을 승인하고 있습니다.
    - 디바이스 토큰을 교체하거나 폐기해야 합니다.
summary: '`openclaw devices`용 CLI 참조(디바이스 페어링 + 토큰 교체/폐기)'
title: 디바이스
x-i18n:
    generated_at: "2026-04-23T14:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
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

디바이스가 이미 페어링된 상태라면, 대기 중인 요청 출력에는 해당 디바이스의 현재 승인된 접근 권한 옆에 요청된 접근 권한이 함께 표시됩니다. 이렇게 하면 페어링이 끊긴 것처럼 보이지 않고 범위/역할 업그레이드가 명확하게 드러납니다.

### `openclaw devices remove <deviceId>`

페어링된 디바이스 항목 하나를 제거합니다.

페어링된 디바이스 토큰으로 인증된 경우, 관리자가 아닌 호출자는 **자기 자신의** 디바이스 항목만 제거할 수 있습니다. 다른 디바이스를 제거하려면 `operator.admin`이 필요합니다.

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

정확한 `requestId`로 대기 중인 디바이스 페어링 요청을 승인합니다. `requestId`를 생략하거나 `--latest`를 전달하면, OpenClaw는 선택된 대기 요청만 출력하고 종료합니다. 세부 정보를 확인한 뒤 정확한 요청 ID로 다시 승인 명령을 실행하세요.

참고: 디바이스가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 다시 시도하면, OpenClaw는 이전 대기 항목을 대체하고 새 `requestId`를 발급합니다. 현재 ID를 사용하려면 승인 직전에 `openclaw devices list`를 실행하세요.

디바이스가 이미 페어링되어 있고 더 넓은 범위나 더 넓은 역할을 요청하면, OpenClaw는 기존 승인을 유지한 채 새 대기 업그레이드 요청을 생성합니다. 승인 전에 `openclaw devices list`의 `Requested`와 `Approved` 열을 검토하거나 `openclaw devices approve --latest`를 사용해 정확한 업그레이드를 미리 확인하세요.

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

특정 역할의 디바이스 토큰을 교체합니다(선택적으로 범위도 업데이트).
대상 역할은 해당 디바이스의 승인된 페어링 계약에 이미 존재해야 하며, 교체로 새로운 미승인 역할을 발급할 수는 없습니다.
`--scope`를 생략하면, 저장된 교체 토큰으로 이후 다시 연결할 때 그 토큰의 캐시된 승인 범위를 재사용합니다. 명시적인 `--scope` 값을 전달하면, 그 값이 이후 캐시된 토큰 재연결에 사용되는 저장 범위 세트가 됩니다.
관리자가 아닌 페어링된 디바이스 호출자는 **자기 자신의** 디바이스 토큰만 교체할 수 있습니다.
또한 명시적인 `--scope` 값은 호출자 세션의 자체 operator 범위 안에 있어야 하며, 교체로 호출자가 이미 가진 것보다 더 넓은 operator 토큰을 발급할 수는 없습니다.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

새 토큰 페이로드를 JSON으로 반환합니다.

### `openclaw devices revoke --device <id> --role <role>`

특정 역할의 디바이스 토큰을 폐기합니다.

관리자가 아닌 페어링된 디바이스 호출자는 **자기 자신의** 디바이스 토큰만 폐기할 수 있습니다.
다른 디바이스의 토큰을 폐기하려면 `operator.admin`이 필요합니다.

```
openclaw devices revoke --device <deviceId> --role node
```

폐기 결과를 JSON으로 반환합니다.

## 공통 옵션

- `--url <url>`: Gateway WebSocket URL(`gateway.remote.url`이 구성된 경우 이를 기본값으로 사용).
- `--token <token>`: Gateway 토큰(필요한 경우).
- `--password <password>`: Gateway 비밀번호(비밀번호 인증).
- `--timeout <ms>`: RPC 타임아웃.
- `--json`: JSON 출력(스크립트에 권장).

참고: `--url`을 설정하면 CLI는 config 또는 환경 자격 증명으로 대체하지 않습니다.
`--token` 또는 `--password`를 명시적으로 전달하세요. 명시적 자격 증명이 없으면 오류입니다.

## 참고

- 토큰 교체는 새 토큰을 반환합니다(민감 정보). 비밀 정보처럼 취급하세요.
- 이 명령들은 `operator.pairing`(또는 `operator.admin`) 범위가 필요합니다.
- 토큰 교체는 해당 디바이스의 승인된 페어링 역할 집합과 승인된 범위 기준선 안에서만 이루어집니다. 잘못된 캐시 토큰 항목이 새로운 교체 대상을 부여하지는 않습니다.
- 페어링된 디바이스 토큰 세션에서는 디바이스 간 관리가 관리자 전용입니다. 호출자에게 `operator.admin`이 없으면 `remove`, `rotate`, `revoke`는 자기 자신에게만 허용됩니다.
- `devices clear`는 의도적으로 `--yes`로 보호됩니다.
- local loopback에서 페어링 범위를 사용할 수 없는 경우(그리고 명시적인 `--url`을 전달하지 않은 경우), list/approve는 로컬 페어링 대체 경로를 사용할 수 있습니다.
- `devices approve`는 토큰을 발급하기 전에 명시적인 요청 ID가 필요합니다. `requestId`를 생략하거나 `--latest`를 전달하면 최신 대기 요청만 미리 보여줍니다.

## 토큰 불일치 복구 체크리스트

Control UI 또는 다른 클라이언트가 계속 `AUTH_TOKEN_MISMATCH` 또는 `AUTH_DEVICE_TOKEN_MISMATCH`로 실패할 때 사용하세요.

1. 현재 gateway 토큰 소스를 확인합니다:

```bash
openclaw config get gateway.auth.token
```

2. 페어링된 디바이스를 나열하고 영향을 받는 디바이스 ID를 확인합니다:

```bash
openclaw devices list
```

3. 영향을 받는 디바이스의 operator 토큰을 교체합니다:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 교체만으로 충분하지 않으면, 오래된 페어링을 제거하고 다시 승인합니다:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 현재 공유 토큰/비밀번호로 클라이언트 연결을 다시 시도합니다.

참고:

- 일반적인 재연결 인증 우선순위는 명시적 공유 토큰/비밀번호가 먼저이고, 그다음 명시적 `deviceToken`, 저장된 디바이스 토큰, bootstrap 토큰 순서입니다.
- 신뢰된 `AUTH_TOKEN_MISMATCH` 복구에서는 제한된 한 번의 재시도를 위해 공유 토큰과 저장된 디바이스 토큰을 함께 임시로 전송할 수 있습니다.

관련 항목:

- [Dashboard auth troubleshooting](/ko/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/ko/gateway/troubleshooting#dashboard-control-ui-connectivity)
