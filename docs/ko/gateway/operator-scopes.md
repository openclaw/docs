---
read_when:
    - 누락된 운영자 범위 오류 디버깅
    - 기기 또는 노드 페어링 승인 검토
    - Gateway RPC 메서드 추가 또는 분류
summary: Gateway 클라이언트의 운영자 역할, 범위 및 승인 시점 검사
title: 운영자 범위
x-i18n:
    generated_at: "2026-06-27T17:30:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator 범위는 Gateway 클라이언트가 인증 후 수행할 수 있는 작업을 정의합니다.
이는 하나의 신뢰할 수 있는 Gateway 운영자 도메인 안의 제어 플레인 가드레일이며,
적대적인 다중 테넌트 격리가 아닙니다. 사람, 팀 또는 머신 사이에 강력한 분리가
필요하다면 별도의 OS 사용자 또는 호스트에서 별도의 Gateway를 실행하세요.

관련 항목: [보안](/ko/gateway/security), [Gateway 프로토콜](/ko/gateway/protocol),
[Gateway 페어링](/ko/gateway/pairing), [디바이스 CLI](/ko/cli/devices).

## 역할

Gateway WebSocket 클라이언트는 하나의 역할로 연결합니다.

- `operator`: CLI, Control UI, 자동화, 신뢰할 수 있는 헬퍼 프로세스와 같은 제어 플레인 클라이언트.
- `node`: `node.invoke`를 통해 명령을 노출하는 macOS, iOS, Android 또는 헤드리스 노드와 같은 기능 호스트.

Operator RPC 메서드에는 `operator` 역할이 필요합니다. Node에서 시작된 메서드에는
`node` 역할이 필요합니다.

## 범위 수준

| 범위                    | 의미                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | 읽기 전용 상태, 목록, 카탈로그, 로그, 세션 읽기 및 기타 변경을 일으키지 않는 제어 플레인 호출.                                                              |
| `operator.write`        | 메시지 보내기, 도구 호출, 대화/음성 설정 업데이트, 노드 명령 릴레이와 같은 일반적인 변경 operator 작업. `operator.read`도 충족합니다.                      |
| `operator.admin`        | 관리용 제어 플레인 액세스. 모든 `operator.*` 범위를 충족합니다. 구성 변경, 업데이트, 네이티브 훅, 민감한 예약 네임스페이스, 고위험 승인에 필요합니다.       |
| `operator.pairing`      | 페어링 기록 또는 디바이스 토큰의 나열, 승인, 거부, 제거, 순환, 폐지를 포함한 디바이스 및 노드 페어링 관리.                                                  |
| `operator.approvals`    | Exec 및 Plugin 승인 API.                                                                                                                                     |
| `operator.talk.secrets` | 비밀이 포함된 Talk 구성 읽기.                                                                                                                                |

알 수 없는 미래의 `operator.*` 범위는 호출자가 `operator.admin`을 보유하지 않는 한
정확한 일치가 필요합니다.

## 메서드 범위는 첫 번째 게이트일 뿐입니다

각 Gateway RPC에는 최소 권한 메서드 범위가 있습니다. 해당 메서드 범위는
요청이 핸들러에 도달할 수 있는지를 결정합니다. 일부 핸들러는 이후 승인되거나
변경되는 구체적인 대상에 따라 더 엄격한 승인 시점 검사를 적용합니다.

예시:

- `device.pair.approve`는 `operator.pairing`으로 도달할 수 있지만, operator
  디바이스를 승인할 때는 호출자가 이미 보유한 범위만 발급하거나 유지할 수 있습니다.
- `node.pair.approve`는 `operator.pairing`으로 도달할 수 있으며, 이후 대기 중인
  노드 명령 목록에서 추가 승인 범위를 파생합니다.
- `chat.send`는 일반적으로 쓰기 범위 메서드이지만, 영구적인 `/config set` 및
  `/config unset`은 명령 수준에서 `operator.admin`이 필요합니다.

이를 통해 낮은 범위의 operator가 모든 페어링 승인을 관리자 전용으로 만들지 않고도
저위험 페어링 작업을 수행할 수 있습니다.

## 디바이스 페어링 승인

디바이스 페어링 기록은 승인된 역할과 범위의 지속적인 원본입니다.
이미 페어링된 디바이스는 조용히 더 넓은 액세스를 얻지 않습니다. 더 넓은 역할이나
더 넓은 범위를 요청하는 재연결은 새로운 대기 중인 업그레이드 요청을 만듭니다.

디바이스 요청을 승인할 때:

- operator 역할이 없는 요청에는 operator 토큰 범위 승인이 필요하지 않습니다.
- `node`와 같은 비 operator 디바이스 역할 요청에는 `device.pair.approve`가
  `operator.pairing`으로 도달 가능하더라도 `operator.admin`이 필요합니다.
- `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` 또는 `operator.talk.secrets` 요청에는 호출자가 해당 범위
  또는 `operator.admin`을 보유해야 합니다.
- `operator.admin` 요청에는 `operator.admin`이 필요합니다.
- 명시적 범위가 없는 복구 요청은 기존 operator 토큰 범위를 상속할 수 있습니다.
  해당 기존 토큰이 관리자 범위라면 승인에는 여전히 `operator.admin`이 필요합니다.

관리자가 아닌 공유 비밀 및 신뢰할 수 있는 프록시 세션은 자신이 선언한 operator
범위 안에서만 operator 디바이스 요청을 승인할 수 있습니다. 이러한 세션이 그 외에는
`operator.pairing`을 사용할 수 있더라도 비 operator 역할 승인은 관리자 전용입니다.

페어링된 디바이스 토큰 세션의 경우 호출자가 `operator.admin`을 보유하지 않으면
관리도 자체 범위로 제한됩니다. 관리자가 아닌 호출자는 자신의 페어링 항목만 볼 수
있고, 자신의 대기 중인 요청만 승인하거나 거부할 수 있으며, 자신의 디바이스 항목만
순환, 폐지 또는 제거할 수 있습니다.

## Node 페어링 승인

레거시 `node.pair.*`는 별도의 Gateway 소유 노드 페어링 저장소를 사용합니다. WS 노드는
`role: node`로 디바이스 페어링을 사용하지만, 동일한 승인 수준 어휘가 적용됩니다.

`node.pair.approve`는 대기 중인 요청 명령 목록을 사용해 필요한 추가 범위를 파생합니다.

- 명령이 없는 요청: `operator.pairing`
- Exec이 아닌 노드 명령: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` 또는 `system.which`:
  `operator.pairing` + `operator.admin`

Node 페어링은 ID와 신뢰를 설정합니다. 이는 노드 자체의 `system.run` exec 승인 정책을
대체하지 않습니다.

## 공유 비밀 인증

공유 Gateway 토큰/비밀번호 인증은 해당 Gateway에 대해 신뢰할 수 있는 operator
액세스로 취급됩니다. OpenAI 호환 HTTP 표면, `/tools/invoke`, HTTP 세션 기록 엔드포인트는
호출자가 더 좁은 선언 범위를 보내더라도 공유 비밀 bearer 인증에 대해 일반적인 전체
operator 기본 범위 집합을 복원합니다.

신뢰할 수 있는 프록시 인증 또는 private-ingress `none`과 같은 ID 보유 모드는
명시적으로 선언된 범위를 계속 존중할 수 있습니다. 실제 신뢰 경계 분리에는 별도의
Gateway를 사용하세요.
