---
read_when:
    - OpenClaw.app에서 PeekabooBridge 호스팅하기
    - Swift Package Manager를 통한 Peekaboo 통합
    - PeekabooBridge 프로토콜/경로 변경하기
    - PeekabooBridge, Codex Computer Use 및 cua-driver MCP 중에서 선택하기
summary: macOS UI 자동화를 위한 PeekabooBridge 통합
title: Peekaboo 브리지
x-i18n:
    generated_at: "2026-07-16T12:47:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw는 로컬에서 권한을 인식하는 UI 자동화 브로커로 **PeekabooBridge**를 호스팅할 수 있습니다(`PeekabooBridgeHostCoordinator`, `steipete/Peekaboo` Swift 패키지 기반). 이를 통해 `peekaboo` CLI가 macOS 앱의 TCC 권한을 재사용하면서 UI 자동화를 구동할 수 있습니다.

## 개요 및 범위

- **호스트**: OpenClaw.app은 PeekabooBridge 호스트로 작동할 수 있습니다.
- **클라이언트**: `peekaboo` CLI(별도의 `openclaw ui ...` 인터페이스는 없습니다).
- **UI**: 시각적 오버레이는 Peekaboo.app에 유지되며, OpenClaw는 경량 브로커 호스트입니다.

## 다른 데스크톱 제어 경로와의 관계

OpenClaw에는 의도적으로 분리된 네 가지 데스크톱 제어 경로가 있습니다.

- **PeekabooBridge 호스트**: OpenClaw.app은 로컬 PeekabooBridge 소켓을 호스팅합니다. `peekaboo` CLI는 클라이언트이며, 스크린샷, 클릭, 메뉴, 대화 상자, Dock 작업 및 창 관리에 OpenClaw.app의 macOS 권한을 사용합니다.
- **에이전트 주도 컴퓨터 사용(`computer.act`)**: Gateway 에이전트에 내장된 `computer` 도구는 `screen.snapshot`을 통해 스크린샷을 캡처하고 위험한 `computer.act` Node 명령을 통해 포인터와 키보드를 제어합니다. macOS Node는 이 브리지가 제공하는 내장 Peekaboo 자동화 서비스와 제한된 CoreGraphics 기본 기능을 사용하여 `computer.act`을 프로세스 내에서 수행하며, PeekabooBridge 소켓이나 `peekaboo` CLI를 거치지 않습니다. [컴퓨터 사용](/ko/nodes/computer-use)을 참조하십시오.
- **Codex 컴퓨터 사용**: 번들 `codex` Plugin은 Codex의 `computer-use` MCP Plugin(`extensions/codex/src/app-server/computer-use.ts`)을 확인하고 설치할 수 있으며, 이후 Codex 모드 턴 중에 Codex가 네이티브 데스크톱 제어 도구 호출을 직접 담당하도록 합니다. OpenClaw는 이러한 작업을 PeekabooBridge를 통해 프록시하지 않습니다.
- **직접 `cua-driver` MCP**: OpenClaw는 TryCua의 업스트림 `cua-driver mcp` 서버를 일반 MCP 서버로 등록할 수 있으며, 에이전트에 CUA 드라이버 자체의 스키마와 pid/창/요소 인덱스 워크플로를 제공합니다. 이때 Codex 마켓플레이스나 PeekabooBridge 소켓을 거치지 않습니다.

OpenClaw.app의 권한 인식 브리지 호스트를 통해 광범위한 macOS 자동화 기능을 사용하려면 Peekaboo를 사용하십시오. 모든 비전 모델이 구동할 수 있는 통일된 `computer.act` Node 명령을 통해 Gateway 에이전트가 데스크톱을 보고 제어해야 할 때는 에이전트 주도 컴퓨터 사용을 사용하십시오. Codex 모드 에이전트가 Codex의 네이티브 Plugin을 사용해야 할 때는 Codex 컴퓨터 사용을 사용하십시오. 모든 OpenClaw 관리 런타임에 CUA 드라이버를 일반 MCP 서버로 노출하려면 직접 `cua-driver mcp`을 사용하십시오.

## 브리지 활성화

macOS 앱에서 **Settings -> Enable Peekaboo Bridge**로 이동하십시오. 두 설정 모두 로컬 UI 자동화를 허용하므로, 이 토글을 사용하려면 **Allow Computer Control**이 켜져 있어야 합니다. Computer Control이 꺼져 있으면 토글이 비활성화되고 호스트가 실행되지 않습니다. Computer Control 없이 Peekaboo를 구동하려면 Peekaboo 자체 Mac 앱을 호스트로 실행하십시오.

활성화되어 있고 Computer Control도 켜져 있으면 OpenClaw는 `~/Library/Application Support/OpenClaw/<socket-name>`에서 로컬 UNIX 소켓 서버를 시작합니다. 비활성화하면 호스트가 중지되고 `peekaboo`은 사용 가능한 다른 호스트로 대체됩니다. 또한 코디네이터는 이전 `peekaboo` 설치를 위해 현재 소켓을 가리키는 레거시 소켓 심볼릭 링크(Application Support 아래의 `clawdbot`, `clawdis`, `moltbot`)를 유지합니다.

## 클라이언트 검색 순서

Peekaboo 클라이언트는 일반적으로 다음 순서로 호스트를 시도합니다.

1. Peekaboo.app(전체 UX)
2. Claude.app(설치된 경우)
3. OpenClaw.app(경량 브로커)

활성 호스트와 사용 중인 소켓 경로를 확인하려면 `peekaboo bridge status --verbose`을 사용하십시오. 다음과 같이 재정의할 수 있습니다.

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 보안 및 권한

- 브리지는 **호출자의 코드 서명**을 검증하며, TeamID 허용 목록(Peekaboo 호스트 TeamID와 실행 중인 앱 자체의 TeamID)을 적용합니다.
- 접근성 권한에는 범용 `node` 런타임보다 서명된 브리지/앱 ID를 사용하는 것이 좋습니다. `node`에 접근성 권한을 부여하면 해당 Node 실행 파일로 실행되는 모든 패키지가 GUI 자동화 접근 권한을 상속받습니다. [macOS 권한](/ko/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)을 참조하십시오.
- 요청은 10초 후 시간 초과됩니다(`requestTimeoutSec: 10`).
- 필수 권한이 없으면 브리지는 시스템 설정을 실행하는 대신 명확한 오류 메시지를 반환합니다.

## 스냅샷 동작(자동화)

스냅샷은 유효 기간 10분, 최대 50개 제한으로 메모리에 저장되며(`InMemorySnapshotManager`), 정리 시 아티팩트는 삭제되지 않습니다. 더 오래 보관해야 하는 경우 클라이언트에서 다시 캡처하십시오.

## 문제 해결

- `peekaboo`에서 "브리지 클라이언트가 승인되지 않았습니다"라고 보고하면 클라이언트가 올바르게 서명되었는지 확인하거나, **디버그** 모드에서만 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`을 사용하여 호스트를 실행하십시오.
- 호스트를 찾을 수 없으면 호스트 앱 중 하나(Peekaboo.app 또는 OpenClaw.app)를 열고 권한이 부여되었는지 확인하십시오.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [macOS 권한](/ko/platforms/mac/permissions)
