---
read_when:
    - OpenClaw가 활성 Mac을 식별하도록 하려는 경우
    - 마지막 입력 활동 또는 활성 Node 선택을 디버깅하고 있습니다
    - Node 연결 알림 라우팅을 이해하려고 합니다.
summary: 가장 최근에 사용한 Mac을 감지하고 Node 알림을 해당 Mac으로 라우팅합니다
title: 활성 컴퓨터 상태
x-i18n:
    generated_at: "2026-07-12T15:25:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

활성 컴퓨터 프레즌스는 연결된 macOS Node 중 가장 최근에 물리적 마우스 또는 키보드 입력을 받은 Node를 Gateway에 알려줍니다. OpenClaw는 이 신호를 사용하여 하나의 Mac을 `active`로 표시하고, 에이전트에 안정적인 활성 Node 힌트를 제공하며, 사용자가 있을 가능성이 가장 높은 컴퓨터로 Node 연결 알림을 라우팅합니다.

이는 Gateway 클라이언트의 실시간 목록인 [시스템 프레즌스](/ko/concepts/presence) 및 모바일 Node를 연결된 것으로 취급하지 않으면서 마지막으로 깨어난 시점을 기록하는 지속적 `node.presence.alive` 비콘과는 별개입니다.

## 요구 사항

- OpenClaw macOS 앱이 페어링되어 Node 모드로 연결되어 있어야 합니다.
- 서명된 OpenClaw 앱에 **Accessibility** 권한이 부여되어 있어야 합니다.
- 연결 알림을 받으려면 **Notifications** 권한도 부여되어 있고 Mac Node가 `system.notify`를 노출해야 합니다.

활동 보고는 현재 네이티브 macOS Node에서 구현됩니다. iOS, Android, watchOS 및 헤드리스 Node 호스트는 연결 상태나 백그라운드에서 마지막으로 확인된 상태를 보고할 수 있지만, 활성 컴퓨터 지정 대상이 되지는 않습니다.

## 활성 컴퓨터 확인

1. macOS 앱에서 **Settings -> Permissions**를 열고 macOS 시스템 설정에서 **Accessibility**를 허용합니다.
2. Mac Node가 연결되어 있는지 확인합니다.

   ```bash
   openclaw nodes status --connected
   ```

3. 해당 Mac에서 마우스를 움직이거나 키를 누른 후 다음을 실행합니다.

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

조건을 충족하는 Mac 중 활동이 가장 최근인 Mac이 `active`로 표시됩니다. 상태 출력에는 마지막 입력 이후 경과 시간이 표시되며, `describe`는 `active`, `lastActiveAtMs`, `presenceUpdatedAtMs`를 노출합니다. 활동은 의도적으로 통합되어 보고되므로, 최근 보고 이후의 추가 입력이 표시에 반영되기까지 약 15초가 걸릴 수 있습니다.

## 활동이 프레즌스로 전환되는 방식

macOS 보고기는 2초마다 HID 시스템 유휴 시간 시계를 샘플링합니다. Node 연결이 준비되면 한 번 보고한 다음, 새 물리적 활동을 최대 15초에 한 번 보고합니다. 유휴 상태에서는 3분마다 연결 유지 신호를 보냅니다. 유휴 시간은 30일로 제한되므로 매우 오래된 샘플의 시간이 앞으로 밀려 잘못해서 가장 최신 컴퓨터가 되는 일이 없습니다.

Gateway는 다음 조건이 모두 충족될 때만 활동을 수락합니다.

- 이벤트가 해당 Node ID의 현재 인증된 연결에 속합니다.
- Node에 유효한 `accessibility: true` 권한이 있습니다.
- 페이로드에 범위가 제한된 정수 `idleSeconds` 값이 포함되어 있습니다.

Gateway는 자체 관찰 시간에서 `idleSeconds`를 빼서 `lastActiveAtMs`를 계산합니다. Node가 제공한 실제 시계 타임스탬프는 절대 신뢰하지 않습니다. 연결되어 있고 조건을 충족하는 Mac 중 `lastActiveAtMs`가 가장 최신인 Mac이 선택되며, 값이 같으면 가장 최근의 프레즌스 업데이트를 사용합니다.

프레즌스는 프로세스 로컬이며 연결에 종속됩니다. 현재 세션의 연결을 끊거나, 동일한 Node ID를 사용하는 다른 세션으로 교체하거나, Accessibility 권한을 취소하면 해당 Node의 활동 상태가 지워지고 활성 Mac이 다시 계산됩니다.

## 개인정보 보호 및 모델 컨텍스트

OpenClaw는 입력 내용이 아니라 유휴 시간을 전송합니다. 키 값, 마우스 좌표, 애플리케이션 이름, 창 제목 또는 원시 입력 이벤트는 전송하지 않습니다. macOS 보고기는 하드웨어 HID 상태를 읽으므로 합성된 컴퓨터 제어 이벤트로는 자동화된 Mac이 사용자가 물리적으로 사용한 컴퓨터로 표시되지 않습니다.

지속적인 활동은 모델에 전달되는 시스템 이벤트를 생성하지 않습니다. 동적 런타임 줄에는 인증된 Node ID만 포함됩니다.

```text
active_node=<node-id>
```

프롬프트 주입과 캐시 변동을 방지하기 위해 정확한 타임스탬프와 Node에서 제어하는 표시 이름은 프롬프트에 포함되지 않습니다. 에이전트가 현재 세부 정보가 필요한 경우 대신 `nodes` 도구로 `node.list` 또는 `node.describe`를 읽을 수 있습니다.

## 연결 알림 라우팅 방식

Node가 Gateway 핸드셰이크를 완료하면 OpenClaw는 연결 중인 Mac이 첫 번째 활동 샘플을 제출할 수 있도록 750밀리초 동안 기다립니다. 그런 다음 연결되어 있고 알림 기능을 지원하는 Mac 중 활동이 가장 최근인 Mac에 알림을 시도합니다.

- 기본 전달이 성공하면 다른 Mac은 알림을 받지 않습니다.
- 활성 Mac을 사용할 수 없거나 기본 전달에 실패하면 OpenClaw는 5초 동안 기다린 후 `system.notify`를 노출하는 나머지 모든 연결된 Mac에 시도합니다.
- 실제 전달을 시도한 후에는 같은 Node의 재연결 알림이 5분 동안 억제되어, 반복적인 재연결로 알림 폭주가 발생하지 않도록 합니다.

알림은 정확한 Node 연결에 종속됩니다. 연결이 끊겼거나 교체된 소스 세션은 이전에 예약된 알림을 완료할 수 없으며, 교체된 대상 연결은 여전히 대체 전달에 참여할 수 있습니다.

## 문제 해결

| 증상                                      | 확인 사항                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 어떤 행에도 `active`가 표시되지 않음      | 네이티브 macOS Node가 연결되어 있고 `openclaw nodes describe --node <id>`에 `permissions.accessibility: true`가 표시되는지 확인합니다.                                            |
| 잘못된 Mac이 계속 활성 상태로 유지됨      | 해당 Mac을 물리적으로 사용하고 통합 보고 대기 시간이 지난 후 `openclaw nodes status`를 다시 실행합니다. 합성된 컴퓨터 제어 동작은 활동으로 계산되지 않습니다.                    |
| 마지막 입력 데이터가 사라짐               | Mac의 연결이 끊겼는지, Node 세션이 교체되었는지 또는 Accessibility 권한이 취소되었는지 확인합니다. 각 조건은 의도적으로 활동을 지웁니다.                                         |
| 여러 Mac에 알림이 표시됨                  | 기본 전달을 사용할 수 없었거나 실패하여 지연된 대체 전달이 실행되었습니다. 활성 Mac이 연결되어 있고 알림을 허용하며 `system.notify`를 노출하는지 확인합니다.                     |
| 에이전트가 활성 Mac을 언급하지 않음       | 활동이 변경된 후 새 턴을 시작합니다. 런타임 힌트는 안정적이고 간결하게 유지되므로, 정확한 현재 메타데이터를 확인하려면 `nodes` 도구를 사용합니다.                                |

TCC 복구에 대해서는 [macOS 권한](/ko/platforms/mac/permissions)을 참조하십시오. Node 연결 및 명령 실패에 대해서는 [Node 문제 해결](/ko/nodes/troubleshooting)을 참조하십시오.

## 관련 문서

- [Node](/ko/nodes)
- [Node CLI](/ko/cli/nodes)
- [시스템 프레즌스](/ko/concepts/presence)
- [Gateway 프로토콜](/ko/gateway/protocol#presence)
- [macOS 앱](/ko/platforms/macos)
