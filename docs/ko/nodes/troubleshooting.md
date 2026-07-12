---
read_when:
    - Node가 연결되어 있지만 카메라/캔버스/화면/실행 도구가 작동하지 않습니다
    - Node 페어링과 승인 간의 개념적 차이를 이해해야 합니다.
summary: Node 페어링, 포그라운드 요구 사항, 권한 및 도구 오류 문제 해결
title: Node 문제 해결
x-i18n:
    generated_at: "2026-07-12T15:29:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

상태에는 Node가 표시되지만 Node 도구가 실패할 때 이 페이지를 사용하십시오.

## 명령 실행 순서

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그런 다음 Node별 검사를 실행하십시오.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

정상 상태 신호:

- Node가 연결되어 있으며 `node` 역할로 페어링되어 있습니다.
- `nodes describe`에 호출하려는 기능이 포함되어 있습니다.
- 실행 승인이 예상한 모드/허용 목록을 표시합니다.

## 포그라운드 요구 사항

iOS/Android Node에서 `canvas.*`, `camera.*`, `screen.*`는 포그라운드에서만 사용할 수 있습니다.

빠른 확인 및 해결 방법:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE`이 표시되면 Node 앱을 포그라운드로 전환한 후 다시 시도하십시오.

## 권한 매트릭스

| 기능                         | iOS                                     | Android                                      | macOS Node 앱                     | 일반적인 실패 코드                              |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | --------------------------------- | ----------------------------------------------- |
| `camera.snap`, `camera.clip` | 카메라(클립 오디오에는 마이크도 필요)  | 카메라(클립 오디오에는 마이크도 필요)       | 카메라(클립 오디오에는 마이크도 필요) | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | 화면 기록(마이크는 선택 사항)          | 화면 캡처 프롬프트(마이크는 선택 사항)      | 화면 기록                         | `*_PERMISSION_REQUIRED`                         |
| `computer.act`               | 해당 없음                               | 해당 없음                                    | 손쉬운 사용 + 화면 기록           | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED`   |
| `location.get`               | 앱을 사용하는 동안 또는 항상(모드에 따라 다름) | 모드에 따른 포그라운드/백그라운드 위치 권한 | 위치 권한                         | `LOCATION_PERMISSION_REQUIRED`                  |
| `system.run`                 | 해당 없음(Node 호스트 경로)            | 해당 없음(Node 호스트 경로)                 | 실행 승인 필요                    | `SYSTEM_RUN_DENIED`                             |

## 페어링과 승인 비교

Node 명령의 성공 여부는 다음 세 가지의 별도 관문으로 제어됩니다.

1. **기기 페어링**: 이 Node가 Gateway에 연결할 수 있습니까?
2. **Gateway Node 명령 정책**: RPC 명령 ID가 `gateway.nodes.allowCommands` / `denyCommands` 및 플랫폼 기본값에 의해 허용됩니까?
3. **실행 승인**: 이 Node가 특정 셸 명령을 로컬에서 실행할 수 있습니까?

Node 페어링은 ID/신뢰 관문이며, 명령별 승인 영역이 아닙니다. `system.run`의 경우 Node별 정책은 Gateway 페어링 레코드가 아니라 해당 Node의 실행 승인 파일(`openclaw approvals get --node ...`)에 있습니다.

빠른 확인:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- 페어링 누락: 먼저 Node 기기를 승인하십시오.
- `nodes describe`에 명령 누락: Gateway Node 명령 정책과 Node가 연결할 때 해당 명령을 실제로 선언했는지 확인하십시오.
- 페어링은 정상이지만 `system.run` 실패: 해당 Node에서 실행 승인/허용 목록을 수정하십시오.

승인 기반 `host=node` 실행의 경우 Gateway는 실행을 준비된 정규 `systemRunPlan`에도 바인딩합니다. 이후 호출자가 승인된 실행이 전달되기 전에 명령, cwd 또는 세션 메타데이터를 변경하면 Gateway는 수정된 페이로드를 신뢰하지 않고 승인 불일치로 실행을 거부합니다.

## 일반적인 Node 오류 코드

| 코드                                   | 의미                                                                                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | 앱이 백그라운드에 있습니다. 포그라운드로 전환하십시오.                                                                                                                                                |
| `CAMERA_DISABLED`                      | Node 설정에서 카메라 토글이 비활성화되어 있습니다.                                                                                                                                                    |
| `*_PERMISSION_REQUIRED`                | OS 권한이 없거나 거부되었습니다.                                                                                                                                                                      |
| `LOCATION_DISABLED`                    | 위치 모드가 꺼져 있습니다.                                                                                                                                                                           |
| `LOCATION_PERMISSION_REQUIRED`         | 요청된 위치 모드가 허용되지 않았습니다.                                                                                                                                                              |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | 앱이 백그라운드에 있지만 앱을 사용하는 동안 권한만 부여되어 있습니다.                                                                                                                                |
| `COMPUTER_DISABLED`                    | macOS 앱에서 **컴퓨터 제어 허용**을 활성화한 다음 페어링 업데이트를 승인하십시오.                                                                                                                     |
| `ACCESSIBILITY_REQUIRED`               | macOS 시스템 설정에서 현재 OpenClaw 앱 번들에 손쉬운 사용 권한을 부여하십시오.                                                                                                                       |
| `SYSTEM_RUN_DENIED: approval required` | 실행 요청에는 명시적인 승인이 필요합니다.                                                                                                                                                            |
| `SYSTEM_RUN_DENIED: allowlist miss`    | 허용 목록 모드에서 명령이 차단되었습니다. Windows Node 호스트에서는 `cmd.exe /c ...` 같은 셸 래퍼 형식이 요청 흐름을 통해 승인되지 않는 한 허용 목록 모드에서 허용 목록 불일치로 처리됩니다. |

## 빠른 복구 절차

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

문제가 계속되면 다음을 수행하십시오.

- 기기 페어링을 다시 승인하십시오.
- Node 앱을 다시 열어 포그라운드로 전환하십시오.
- OS 권한을 다시 부여하십시오.
- 실행 승인 정책을 다시 만들거나 조정하십시오.

컴퓨터 제어의 경우 비전 기능을 지원하는 에이전트가 `computer` 도구를 노출하는지, 화면 기록 권한이 있는 상태에서 `screen.snapshot`이 성공하는지, `/phone status`에 의도한 임시 또는 영구 Gateway 권한 부여가 표시되는지도 확인하십시오. `gateway.nodes.denyCommands` 항목은 항상 `allowCommands`보다 우선합니다.

## 관련 문서

- [Node 개요](/ko/nodes)
- [카메라 Node](/ko/nodes/camera)
- [위치 명령](/ko/nodes/location-command)
- [컴퓨터 사용](/nodes/computer-use)
- [실행 승인](/ko/tools/exec-approvals)
- [Gateway 페어링](/ko/gateway/pairing)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
- [채널 문제 해결](/ko/channels/troubleshooting)
