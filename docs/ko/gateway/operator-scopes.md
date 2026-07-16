---
read_when:
    - 누락된 운영자 범위 오류 디버깅
    - 기기 또는 Node 페어링 승인 검토하기
    - Gateway RPC 메서드 추가 또는 분류하기
summary: Gateway 클라이언트의 운영자 역할, 범위 및 승인 시점 검사
title: 운영자 범위
x-i18n:
    generated_at: "2026-07-16T12:38:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

운영자 범위는 Gateway 클라이언트가 인증된 후 수행할 수 있는 작업을 제한합니다.
이는 하나의 신뢰할 수 있는 Gateway 운영자 도메인 내부의 제어 평면 보호 장치이며,
적대적인 멀티테넌트 격리를 위한 것이 아닙니다. 사람, 팀 또는 머신을 강력하게
분리하려면 별도의 OS 사용자 또는 호스트에서 각각 별도의 Gateway를 실행하십시오.

관련 문서: [보안](/ko/gateway/security), [Gateway 프로토콜](/ko/gateway/protocol),
[Gateway 페어링](/ko/gateway/pairing), [기기 CLI](/ko/cli/devices).

## 역할

모든 Gateway WebSocket 클라이언트는 다음 역할 중 하나로 연결됩니다.

- `operator`: CLI, Control UI, 자동화 및
  신뢰할 수 있는 도우미 프로세스와 같은 제어 평면 클라이언트입니다.
- `node`: `node.invoke`을 통해 명령을 노출하는
  기능 호스트(macOS, iOS, Android, 헤드리스)입니다.

운영자 RPC 메서드에는 `operator` 역할이 필요하며, Node에서 시작된 메서드에는
`node` 역할이 필요합니다.

## 범위 수준

| 범위                    | 의미                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 읽기 전용 상태, 목록, 카탈로그, 로그, 세션 읽기 및 기타 변경하지 않는 호출입니다.                                                                                  |
| `operator.write`        | 변경을 수행하는 운영자 작업: 메시지 전송, 도구 호출, 대화/음성 설정 업데이트, Node 명령 릴레이입니다. `operator.read`도 충족합니다.                               |
| `operator.admin`        | 관리 액세스입니다. 모든 `operator.*` 범위를 충족합니다. 구성 변경, 업데이트, 네이티브 훅, 예약된 네임스페이스 및 고위험 승인에 필요합니다.                     |
| `operator.pairing`      | 기기 및 Node 페어링 관리: 나열, 승인, 거부, 제거, 교체, 폐기입니다.                                                                                                 |
| `operator.approvals`    | 실행 및 Plugin 승인 API입니다.                                                                                                                                     |
| `operator.talk.secrets` | 비밀이 포함된 대화 구성을 읽습니다.                                                                                                                                |

알 수 없는 향후 `operator.*` 범위는 호출자가 이미
`operator.admin`을 보유하지 않은 한 정확히 일치해야 합니다.

## 메서드 범위는 첫 번째 관문일 뿐입니다

각 Gateway RPC에는 요청이 핸들러에 도달할 수 있는지를 결정하는 최소 권한
메서드 범위가 있습니다. 일부 핸들러는 승인하거나 변경하는 구체적인 대상에 따라
더 엄격한 검사를 적용합니다.

- `device.pair.approve`에는 `operator.pairing`으로 접근할 수 있지만, 운영자
  기기를 승인할 때는 호출자가 이미 보유한 범위만 발급하거나 유지할 수 있습니다.
- `node.pair.approve`에는 `operator.pairing`으로 접근할 수 있으며, 이후
  대기 중인 Node가 선언한 명령 목록에서 추가 승인 범위를 도출합니다.
- `chat.send`은 쓰기 범위 메서드이지만, `/config set` 및
  `/config unset` 채팅 명령에는 호출자의 채팅 전송 범위와 관계없이
  그에 더해 `operator.admin`이 필요합니다.

따라서 범위가 낮은 운영자는 모든 페어링 승인을 관리자 전용으로 만들지 않고도
위험이 낮은 페어링 작업을 수행할 수 있습니다.

## 기기 페어링 승인

기기 페어링 레코드는 승인된 역할과 범위의 영구적인 원본입니다.
이미 페어링된 기기의 액세스 권한은 자동으로 확대되지 않습니다. 더 넓은 역할이나
범위를 요청하며 다시 연결하면 새로운 대기 중 업그레이드 요청이 생성됩니다.

기기 요청을 승인할 때는 다음 규칙이 적용됩니다.

- 운영자 역할이 없는 요청에는 운영자 범위 승인이 필요하지 않습니다.
- 운영자가 아닌 기기 역할(예: `node`)에 대한 요청에는
  `device.pair.approve` 자체에는 `operator.pairing`만 필요하더라도
  `operator.admin`이 필요합니다.
- `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` 또는 `operator.talk.secrets`에 대한 요청은 호출자가 해당 범위나
  `operator.admin`을 이미 보유해야 합니다.
- `operator.admin`에 대한 요청에는 `operator.admin`이 필요합니다.
- 명시적인 범위가 없는 복구 요청은 기존 운영자 토큰의 범위를
  상속할 수 있습니다. 해당 토큰에 관리자 범위가 있으면 승인에는 여전히
  `operator.admin`이 필요합니다.

관리자가 아닌 공유 비밀 및 신뢰할 수 있는 프록시 세션은 자체적으로 선언한
운영자 범위 내에서만 운영자 기기 요청을 승인할 수 있습니다. 이러한 세션에서
그 밖의 경우 `operator.pairing`을 사용할 수 있더라도 운영자가 아닌 역할의 승인은
관리자 전용입니다.

페어링된 기기 토큰 세션의 경우 호출자에게 `operator.admin`이 없으면 관리 범위가
자기 자신으로 제한됩니다. 관리자가 아닌 호출자는 자신의 페어링 항목만 볼 수 있으며,
자신의 기기 항목만 승인, 거부, 교체, 폐기 또는 제거할 수 있습니다.

## Node 페어링 승인

레거시 `node.pair.*` 메서드는 별도의 Gateway 소유 Node 페어링 저장소를 사용합니다.
WS Node는 대신 기기 페어링(`role: node`)을 사용하지만 동일한 승인 용어가
적용됩니다. 두 저장소의 관계는 [Gateway 페어링](/ko/gateway/pairing)을 참조하십시오.

`node.pair.approve`은 대기 중인 요청의 명령 목록에서 추가 필수 범위를 도출합니다.

| 선언된 명령                                                                                                           | 필수 범위                              |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 없음                                                                                                                  | `operator.pairing`                     |
| 일반 Node 명령                                                                                                        | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` 또는 `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Node 선언을 승인해도 별도의 런타임 허용 목록 관문이 있는 명령은 활성화되지 않습니다.
예를 들어 `computer.act`을 선언하는 Node를 승인하려면 페어링 범위와 쓰기 범위가
필요하지만, 이는 해당 기능 표면만 기록합니다. 관리자 또는 소유자가 여전히
`computer.act`을 활성화해야 합니다. 활성화된 동안에는 쓰기 범위가 지정된
`node.invoke` 메서드를 통해 이를 호출할 때 각 작업에 관리자 범위가 필요하지 않습니다.

Node 페어링은 ID와 신뢰를 설정하며, Node 자체의
`system.run` 실행 승인 정책을 대체하지 않습니다.

## 공유 비밀 인증

공유 Gateway 토큰/비밀번호 인증은 해당 Gateway에 대해 신뢰할 수 있는 운영자
액세스로 취급됩니다. OpenAI 호환 HTTP 기능 표면, `/tools/invoke` 및 HTTP
세션 기록 엔드포인트는 호출자가 더 좁은 선언 범위를 보내더라도 공유 비밀 전달자
인증에 대해 전체 기본 운영자 범위 집합을 복원합니다.

신뢰할 수 있는 프록시 인증 또는 비공개 인그레스 `none`처럼 ID를 포함하는
모드에서는 명시적으로 선언된 범위를 계속 준수할 수 있습니다. 실제 신뢰 경계를
분리하려면 별도의 Gateway를 사용하십시오.
