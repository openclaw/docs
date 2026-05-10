---
read_when:
    - Node는 연결되어 있지만 camera/canvas/screen/exec 도구가 실패합니다
    - 노드 페어링과 승인을 구분하는 개념 모델이 필요합니다.
summary: Node 페어링, 포그라운드 요구 사항, 권한 및 도구 실패 문제 해결
title: Node 문제 해결
x-i18n:
    generated_at: "2026-05-10T19:40:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

상태에는 Node가 표시되지만 Node 도구가 실패할 때 이 페이지를 사용하세요.

## 명령 사다리

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그런 다음 Node별 검사를 실행합니다.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

정상 신호:

- Node가 연결되어 있고 `node` 역할로 페어링되어 있습니다.
- `nodes describe`에 호출하려는 기능이 포함되어 있습니다.
- Exec 승인에 예상 모드/허용 목록이 표시됩니다.

## 포그라운드 요구 사항

`canvas.*`, `camera.*`, `screen.*`는 iOS/Android Node에서 포그라운드에서만 사용할 수 있습니다.

빠른 확인 및 수정:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE`이 보이면 Node 앱을 포그라운드로 가져온 뒤 다시 시도하세요.

## 권한 매트릭스

| 기능                         | iOS                                     | Android                                      | macOS Node 앱                 | 일반적인 실패 코드            |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | 카메라(클립 오디오용 마이크 포함)       | 카메라(클립 오디오용 마이크 포함)            | 카메라(클립 오디오용 마이크 포함) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 화면 기록(마이크 선택 사항)             | 화면 캡처 프롬프트(마이크 선택 사항)         | 화면 기록                     | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 사용하는 동안 또는 항상(모드에 따라 다름) | 모드에 따른 포그라운드/백그라운드 위치       | 위치 권한                     | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 해당 없음(Node 호스트 경로)             | 해당 없음(Node 호스트 경로)                  | Exec 승인 필요                | `SYSTEM_RUN_DENIED`            |

## 페어링과 승인

이는 서로 다른 게이트입니다.

1. **기기 페어링**: 이 Node가 Gateway에 연결할 수 있습니까?
2. **Gateway Node 명령 정책**: RPC 명령 ID가 `gateway.nodes.allowCommands` / `denyCommands` 및 플랫폼 기본값에 의해 허용됩니까?
3. **Exec 승인**: 이 Node가 특정 셸 명령을 로컬에서 실행할 수 있습니까?

빠른 확인:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

페어링이 없으면 먼저 Node 기기를 승인하세요.
`nodes describe`에 명령이 없으면 Gateway Node 명령 정책과 Node가 연결 시 실제로 해당 명령을 선언했는지 확인하세요.
페어링은 정상인데 `system.run`이 실패하면 해당 Node의 Exec 승인/허용 목록을 수정하세요.

Node 페어링은 ID/신뢰 게이트이며, 명령별 승인 표면이 아닙니다. `system.run`의 경우 Node별 정책은 Gateway 페어링 레코드가 아니라 해당 Node의 Exec 승인 파일(`openclaw approvals get --node ...`)에 있습니다.

승인 기반 `host=node` 실행의 경우 Gateway는 실행도 준비된 정식 `systemRunPlan`에 바인딩합니다. 이후 호출자가 승인된 실행이 전달되기 전에 command/cwd 또는 세션 메타데이터를 변경하면, Gateway는 수정된 페이로드를 신뢰하지 않고 승인 불일치로 실행을 거부합니다.

## 일반적인 Node 오류 코드

- `NODE_BACKGROUND_UNAVAILABLE` → 앱이 백그라운드에 있음; 포그라운드로 가져오세요.
- `CAMERA_DISABLED` → Node 설정에서 카메라 토글이 비활성화되어 있음.
- `*_PERMISSION_REQUIRED` → OS 권한이 없거나 거부됨.
- `LOCATION_DISABLED` → 위치 모드가 꺼져 있음.
- `LOCATION_PERMISSION_REQUIRED` → 요청한 위치 모드가 허용되지 않음.
- `LOCATION_BACKGROUND_UNAVAILABLE` → 앱이 백그라운드에 있지만 사용하는 동안 권한만 있음.
- `SYSTEM_RUN_DENIED: approval required` → Exec 요청에 명시적 승인이 필요함.
- `SYSTEM_RUN_DENIED: allowlist miss` → 허용 목록 모드에서 명령이 차단됨.
  Windows Node 호스트에서는 `cmd.exe /c ...` 같은 셸 래퍼 형식이 ask 흐름으로 승인되지 않은 경우 허용 목록 모드에서 허용 목록 누락으로 처리됩니다.

## 빠른 복구 루프

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

그래도 막혀 있으면:

- 기기 페어링을 다시 승인합니다.
- Node 앱을 다시 엽니다(포그라운드).
- OS 권한을 다시 부여합니다.
- Exec 승인 정책을 다시 만들거나 조정합니다.

## 관련 항목

- [Node 개요](/ko/nodes)
- [카메라 Node](/ko/nodes/camera)
- [위치 명령](/ko/nodes/location-command)
- [Exec 승인](/ko/tools/exec-approvals)
- [Gateway 페어링](/ko/gateway/pairing)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
- [채널 문제 해결](/ko/channels/troubleshooting)
