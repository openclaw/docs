---
read_when:
    - IPC 계약 또는 메뉴 막대 앱 IPC 편집
summary: OpenClaw 앱, Gateway Node 전송 및 PeekabooBridge를 위한 macOS IPC 아키텍처
title: macOS IPC
x-i18n:
    generated_at: "2026-07-12T15:25:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC 아키텍처

로컬 Unix 소켓은 실행 승인 및 `system.run`을 위해 Node 호스트 서비스를 macOS 앱에 연결합니다. 검색/연결 확인을 위한 `openclaw-mac` 디버그 CLI(`apps/macos/Sources/OpenClawMacCLI`)가 있으며, 에이전트 작업은 여전히 Gateway WebSocket과 `node.invoke`를 통해 전달됩니다. Node 기반 `computer.act` 경로는 내장된 Peekaboo 자동화를 프로세스 내에서 실행하며, 독립 실행형 Peekaboo 클라이언트는 PeekabooBridge를 사용합니다.

## 목표

- TCC 관련 작업(알림, 화면 기록, 마이크, 음성, AppleScript)을 모두 담당하는 단일 GUI 앱 인스턴스입니다.
- 자동화를 위한 간결한 인터페이스: Gateway + Node 명령, 프로세스 내 `computer.act`, 그리고 독립 실행형 UI 자동화 클라이언트용 PeekabooBridge입니다.
- 예측 가능한 권한: 항상 동일한 서명된 번들 ID를 사용하고 launchd로 실행하여 TCC 권한 부여가 유지되도록 합니다.

## 작동 방식

### Gateway + Node 전송

- 앱은 Gateway(로컬 모드)를 실행하고 Node로 연결합니다.
- 에이전트 작업은 `node.invoke`를 통해 수행됩니다(예: `system.run`, `system.notify`, `canvas.*`).
- Node 명령에는 `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run`, `system.notify`가 포함됩니다.
- Node는 에이전트가 화면, 카메라, 마이크, 음성, 자동화 또는 손쉬운 사용 접근 권한의 사용 가능 여부를 확인할 수 있도록 `permissions` 맵을 보고합니다.

### Node 서비스 + 앱 IPC

- 헤드리스 Node 호스트 서비스가 Gateway WebSocket에 연결됩니다.
- `system.run` 요청은 로컬 Unix 소켓(`ExecApprovalsSocket.swift`)을 통해 macOS 앱으로 전달됩니다.
- 앱은 UI 컨텍스트에서 명령을 실행하고, 필요한 경우 사용자에게 확인을 요청한 후 출력을 반환합니다.

다이어그램(SCI):

```text
에이전트 -> Gateway -> Node 서비스(WS)
                         |  IPC(UDS + 토큰 + HMAC + TTL)
                         v
                     Mac 앱(UI + TCC + system.run)
```

### PeekabooBridge(UI 자동화)

- 내장 에이전트 `computer` 도구는 이 소켓을 사용하지 **않습니다**. 페어링된 macOS Node는 내장 Peekaboo 서비스를 사용하여 앱 프로세스에서 `computer.act`를 수행합니다.
- UI 자동화는 별도의 UNIX 소켓(`~/Library/Application Support/OpenClaw/<socket>`)과 PeekabooBridge JSON 프로토콜을 사용합니다.
- 호스트 우선순위(클라이언트 측): Peekaboo.app -> Claude.app -> OpenClaw.app -> 로컬 실행.
- 보안: 브리지 호스트에는 허용 목록에 등록된 TeamID가 필요합니다(번들로 제공되는 `PeekabooBridgeHostCoordinator`는 고정된 팀과 앱 자체 서명 팀을 허용 목록에 등록합니다). DEBUG 전용 동일 UID 우회 기능은 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`(Peekaboo 규칙)로 보호됩니다.
- 자세한 내용은 [PeekabooBridge 사용법](/ko/platforms/mac/peekaboo)을 참조하십시오.

## 운영 흐름

- 재시작/재빌드: `scripts/restart-mac.sh`는 기존 인스턴스를 종료하고 Swift로 재빌드한 뒤 다시 패키징하고 실행합니다. 사용 가능한 서명 ID를 자동으로 감지하며, 찾을 수 없으면 `--no-sign`으로 대체합니다. 서명을 필수로 지정하려면 `--sign`을 전달하고(사용 가능한 키가 없으면 실패), 서명되지 않은 경로를 강제하려면 `--no-sign`을 전달하십시오. 서명 경로에서는 환경에 설정된 `SIGN_IDENTITY`가 해제되므로, `scripts/codesign-mac-app.sh` 자체의 ID 자동 감지가 인증서를 선택합니다.
- 단일 인스턴스: 앱은 `NSWorkspace.runningApplications`에서 중복 번들 ID를 확인하고 둘 이상의 인스턴스가 발견되면 종료합니다(`MenuBar.swift`의 `isDuplicateInstance()`).

## 강화 참고 사항

- 모든 권한 있는 인터페이스에 TeamID 일치를 요구하는 방식을 권장합니다.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`(DEBUG 전용)을 사용하면 로컬 개발 시 동일 UID 호출자가 허용될 수 있습니다.
- 모든 통신은 로컬에서만 이루어지며, 네트워크 소켓은 노출되지 않습니다.
- TCC 프롬프트는 GUI 앱 번들에서만 시작됩니다. 재빌드 후에도 서명된 번들 ID를 안정적으로 유지하십시오.
- 실행 승인 소켓 강화: 파일 모드 `0600`, 공유 토큰, 피어 UID 확인(`getpeereid`), HMAC-SHA256 챌린지/응답, 요청의 짧은 TTL을 사용합니다.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [macOS IPC 흐름(실행 승인)](/ko/tools/exec-approvals-advanced#macos-ipc-flow)
