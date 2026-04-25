---
read_when:
    - 디바이스 페어링 요청을 승인하고 있습니다
    - 디바이스 토큰을 교체하거나 폐기해야 합니다
summary: '`openclaw devices`에 대한 CLI 참조(device pairing + 토큰 교체/폐기)'
title: 디바이스
x-i18n:
    generated_at: "2026-04-25T05:58:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

디바이스 페어링 요청과 디바이스 범위 토큰을 관리합니다.

## 명령어

### `openclaw devices list`

보류 중인 페어링 요청과 페어링된 디바이스를 나열합니다.

```
openclaw devices list
openclaw devices list --json
```

디바이스가 이미 페어링된 경우, 보류 중인 요청 출력에는 디바이스의 현재
승인된 액세스 옆에 요청된 액세스가 표시됩니다. 이렇게 하면 페어링이
끊어진 것처럼 보이지 않고 범위/역할 업그레이드가 명확해집니다.

### `openclaw devices remove <deviceId>`

페어링된 디바이스 항목 하나를 제거합니다.

페어링된 디바이스 토큰으로 인증된 경우, 관리자가 아닌 호출자는
자신의 디바이스 항목만 제거할 수 있습니다. 다른 디바이스를 제거하려면
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

정확한 `requestId`로 보류 중인 디바이스 페어링 요청을 승인합니다. `requestId`를
생략하거나 `--latest`를 전달하면, OpenClaw는 선택된 보류 요청만 출력하고
종료합니다. 세부 정보를 확인한 뒤 정확한 요청 ID로 다시 승인 명령을 실행하세요.

참고: 디바이스가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 다시 시도하면,
OpenClaw는 이전 보류 항목을 대체하고 새 `requestId`를 발급합니다.
현재 ID를 사용하려면 승인 직전에 `openclaw devices list`를 실행하세요.

디바이스가 이미 페어링되어 있고 더 넓은 범위 또는 더 높은 역할을 요청하면,
OpenClaw는 기존 승인을 유지한 채 새로운 보류 업그레이드
요청을 생성합니다. `openclaw devices list`의 `Requested` 및 `Approved` 열을 검토하거나
`openclaw devices approve --latest`를 사용해 승인 전 정확한 업그레이드를 미리 확인하세요.

Gateway가 `gateway.nodes.pairing.autoApproveCidrs`로
명시적으로 구성된 경우, 일치하는 클라이언트 IP의 최초 `role: node` 요청은
이 목록에 나타나기 전에 승인될 수 있습니다. 이 정책은 기본적으로
비활성화되어 있으며, operator/browser 클라이언트나 업그레이드 요청에는 적용되지 않습니다.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

보류 중인 디바이스 페어링 요청을 거부합니다.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

특정 역할에 대한 디바이스 토큰을 교체합니다(선택적으로 범위도 업데이트).
대상 역할은 해당 디바이스의 승인된 페어링 계약에 이미 존재해야 하며,
교체로 새로 승인되지 않은 역할을 발급할 수는 없습니다.
`--scope`를 생략하면, 저장된 교체 토큰으로 이후 재연결 시 해당
토큰의 캐시된 승인 범위를 재사용합니다. 명시적인 `--scope` 값을 전달하면,
그 값이 향후 캐시된 토큰 재연결에 사용할 저장된 범위 집합이 됩니다.
관리자가 아닌 페어링된 디바이스 호출자는 자신의 디바이스 토큰만
교체할 수 있습니다. 또한 명시적인 `--scope` 값은 호출자 세션의
자체 operator 범위 내에 있어야 하며, 교체로 호출자가 이미 가진 것보다 더 넓은 operator 토큰을 발급할 수 없습니다.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

새 토큰 페이로드를 JSON으로 반환합니다.

### `openclaw devices revoke --device <id> --role <role>`

특정 역할에 대한 디바이스 토큰을 폐기합니다.

관리자가 아닌 페어링된 디바이스 호출자는 자신의 디바이스 토큰만
폐기할 수 있습니다. 다른 디바이스의 토큰을 폐기하려면 `operator.admin`이 필요합니다.

```
openclaw devices revoke --device <deviceId> --role node
```

폐기 결과를 JSON으로 반환합니다.

## 공통 옵션

- `--url <url>`: Gateway WebSocket URL(구성된 경우 기본값은 `gateway.remote.url`)
- `--token <token>`: Gateway 토큰(필요한 경우)
- `--password <password>`: Gateway 비밀번호(비밀번호 인증)
- `--timeout <ms>`: RPC 제한 시간
- `--json`: JSON 출력(스크립팅에 권장)

참고: `--url`을 설정하면 CLI는 구성이나 환경 자격 증명으로 대체하지 않습니다.
`--token` 또는 `--password`를 명시적으로 전달하세요. 명시적 자격 증명이 없으면 오류가 발생합니다.

## 참고

- 토큰 교체는 새 토큰을 반환합니다(민감함). 시크릿처럼 취급하세요.
- 이 명령어에는 `operator.pairing`(또는 `operator.admin`) 범위가 필요합니다.
- `gateway.nodes.pairing.autoApproveCidrs`는
  새 node 디바이스 페어링에만 사용하는 선택적 Gateway 정책이며, CLI 승인 권한을 변경하지 않습니다.
- 토큰 교체는 해당 디바이스에 대해 승인된 페어링 역할 집합과 승인된 범위
  기준선 안에서만 이루어집니다. 잘못된 캐시 토큰 항목이 있다고 해서 새로운
  교체 대상을 부여하지는 않습니다.
- 페어링된 디바이스 토큰 세션의 경우, 디바이스 간 관리는 관리자 전용입니다.
  `remove`, `rotate`, `revoke`는 호출자에게
  `operator.admin`이 없는 한 자기 자신에 대해서만 가능합니다.
- `devices clear`는 의도적으로 `--yes`로 게이트됩니다.
- local loopback에서 페어링 범위를 사용할 수 없는 경우(`--url`을 명시적으로 전달하지 않았을 때), list/approve는 로컬 페어링 대체 경로를 사용할 수 있습니다.
- `devices approve`는 토큰 발급 전에 명시적인 요청 ID가 필요합니다. `requestId`를 생략하거나 `--latest`를 전달하면 최신 보류 요청만 미리 볼 수 있습니다.

## 토큰 드리프트 복구 체크리스트

Control UI 또는 다른 클라이언트가 `AUTH_TOKEN_MISMATCH` 또는 `AUTH_DEVICE_TOKEN_MISMATCH`로 계속 실패할 때 사용하세요.

1. 현재 gateway 토큰 소스를 확인합니다.

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

- 일반적인 재연결 인증 우선순위는 먼저 명시적 공유 토큰/비밀번호, 그다음 명시적 `deviceToken`, 그다음 저장된 디바이스 토큰, 마지막으로 bootstrap 토큰입니다.
- 신뢰된 `AUTH_TOKEN_MISMATCH` 복구에서는 제한된 단일 재시도에 한해 공유 토큰과 저장된 디바이스 토큰을 함께 일시적으로 보낼 수 있습니다.

관련 항목:

- [Dashboard auth troubleshooting](/ko/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/ko/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 관련 항목

- [CLI reference](/ko/cli)
- [Nodes](/ko/nodes)
