---
read_when:
    - OpenClaw.app에서 PeekabooBridge 호스팅하기
    - Swift Package Manager를 통한 Peekaboo 통합
    - PeekabooBridge 프로토콜/경로 변경
    - PeekabooBridge, Codex Computer Use, cua-driver MCP 중에서 선택하기
summary: macOS UI 자동화를 위한 PeekabooBridge 통합
title: Peekaboo 브리지
x-i18n:
    generated_at: "2026-07-12T15:30:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw은 **PeekabooBridge**를 로컬 권한 인식 UI 자동화 브로커로 호스팅할 수 있습니다(`steipete/Peekaboo` Swift 패키지를 기반으로 하는 `PeekabooBridgeHostCoordinator`). 이를 통해 `peekaboo` CLI는 macOS 앱의 TCC 권한을 재사용하면서 UI 자동화를 구동할 수 있습니다.

## 개요 및 범위

- **호스트**: OpenClaw.app은 PeekabooBridge 호스트로 작동할 수 있습니다.
- **클라이언트**: `peekaboo` CLI입니다(별도의 `openclaw ui ...` 인터페이스는 없습니다).
- **UI**: 시각적 오버레이는 Peekaboo.app에 유지되며, OpenClaw은 경량 브로커 호스트입니다.

## 다른 데스크톱 제어 경로와의 관계

OpenClaw에는 의도적으로 서로 분리된 네 가지 데스크톱 제어 경로가 있습니다.

- **PeekabooBridge 호스트**: OpenClaw.app이 로컬 PeekabooBridge 소켓을 호스팅합니다. `peekaboo` CLI는 클라이언트이며, 스크린샷, 클릭, 메뉴, 대화 상자, Dock 작업 및 창 관리에 OpenClaw.app의 macOS 권한을 사용합니다.
- **에이전트 기반 컴퓨터 사용(`computer.act`)**: Gateway 에이전트에 내장된 `computer` 도구는 `screen.snapshot`을 통해 스크린샷을 캡처하고 위험한 `computer.act` Node 명령을 통해 포인터와 키보드를 제어합니다. macOS Node는 PeekabooBridge 소켓이나 `peekaboo` CLI를 거치지 않고, 이 브리지가 노출하는 내장 Peekaboo 자동화 서비스와 제한적인 CoreGraphics 기본 기능을 사용하여 프로세스 내에서 `computer.act`를 수행합니다. [컴퓨터 사용](/nodes/computer-use)을 참조하십시오.
- **Codex 컴퓨터 사용**: 번들 `codex` Plugin은 Codex의 `computer-use` MCP Plugin(`extensions/codex/src/app-server/computer-use.ts`)을 확인하고 설치할 수 있으며, 이후 Codex 모드 턴 중에 Codex가 네이티브 데스크톱 제어 도구 호출을 담당하도록 합니다. OpenClaw은 이러한 작업을 PeekabooBridge를 통해 프록시하지 않습니다.
- **직접 `cua-driver` MCP 사용**: OpenClaw은 TryCua의 업스트림 `cua-driver mcp` 서버를 일반 MCP 서버로 등록할 수 있습니다. 이를 통해 에이전트는 Codex 마켓플레이스나 PeekabooBridge 소켓을 거치지 않고 CUA 드라이버 자체의 스키마와 pid/창/요소 인덱스 워크플로를 사용할 수 있습니다.

OpenClaw.app의 권한 인식 브리지 호스트를 통해 폭넓은 macOS 자동화 기능을 사용하려면 Peekaboo를 사용하십시오. 모든 비전 모델이 구동할 수 있는 통합 `computer.act` Node 명령을 통해 Gateway 에이전트가 데스크톱을 보고 제어해야 하는 경우 에이전트 기반 컴퓨터 사용을 사용하십시오. Codex 모드 에이전트가 Codex의 네이티브 Plugin을 사용해야 하는 경우 Codex 컴퓨터 사용을 사용하십시오. 모든 OpenClaw 관리 런타임에 CUA 드라이버를 일반 MCP 서버로 노출하려면 직접 `cua-driver mcp`를 사용하십시오.

## 브리지 활성화

macOS 앱에서 **Settings -> Enable Peekaboo Bridge**로 이동하십시오.

활성화하면 OpenClaw은 `~/Library/Application Support/OpenClaw/<socket-name>`에서 로컬 UNIX 소켓 서버를 시작합니다. 비활성화하면 호스트가 중지되고 `peekaboo`는 사용 가능한 다른 호스트로 대체됩니다. 또한 코디네이터는 이전 `peekaboo` 설치를 위해 현재 소켓을 가리키는 레거시 소켓 심볼릭 링크(Application Support 아래의 `clawdbot`, `clawdis`, `moltbot`)를 유지합니다.

## 클라이언트 검색 순서

Peekaboo 클라이언트는 일반적으로 다음 순서로 호스트를 탐색합니다.

1. Peekaboo.app(전체 UX)
2. Claude.app(설치된 경우)
3. OpenClaw.app(경량 브로커)

활성 호스트와 사용 중인 소켓 경로를 확인하려면 `peekaboo bridge status --verbose`를 사용하십시오. 다음과 같이 재정의할 수 있습니다.

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 보안 및 권한

- 브리지는 **호출자 코드 서명**을 검증하며, TeamID 허용 목록(Peekaboo 호스트 TeamID와 실행 중인 앱 자체의 TeamID)이 적용됩니다.
- 손쉬운 사용 권한에는 일반 `node` 런타임보다 서명된 브리지/앱 ID를 사용하는 것이 좋습니다. `node`에 손쉬운 사용 권한을 부여하면 해당 Node 실행 파일로 시작된 모든 패키지가 GUI 자동화 접근 권한을 상속받을 수 있습니다. [macOS 권한](/ko/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)을 참조하십시오.
- 요청은 10초 후 시간 초과됩니다(`requestTimeoutSec: 10`).
- 필요한 권한이 없으면 브리지는 시스템 설정을 실행하는 대신 명확한 오류 메시지를 반환합니다.

## 스냅샷 동작(자동화)

스냅샷은 10분의 유효 기간과 최대 50개 제한으로 메모리에 저장되며(`InMemorySnapshotManager`), 정리 시 아티팩트는 삭제되지 않습니다. 더 오래 보관해야 하는 경우 클라이언트에서 다시 캡처하십시오.

## 문제 해결

- `peekaboo`에서 "bridge client is not authorized"라고 보고하면 클라이언트가 올바르게 서명되었는지 확인하거나, **디버그** 모드에서만 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`을 설정하여 호스트를 실행하십시오.
- 호스트를 찾을 수 없으면 호스트 앱 중 하나(Peekaboo.app 또는 OpenClaw.app)를 열고 권한이 부여되었는지 확인하십시오.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [macOS 권한](/ko/platforms/mac/permissions)
