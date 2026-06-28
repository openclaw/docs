---
read_when:
    - IPC 계약 또는 메뉴 막대 앱 IPC 편집
summary: OpenClaw 앱, Gateway 노드 전송 및 PeekabooBridge를 위한 macOS IPC 아키텍처
title: macOS IPC
x-i18n:
    generated_at: "2026-06-28T00:13:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC 아키텍처

**현재 모델:** 로컬 Unix 소켓이 **Node 호스트 서비스**를 **macOS 앱**에 연결해 실행 승인 및 `system.run`을 처리합니다. 검색/연결 검사를 위한 `openclaw-mac` 디버그 CLI가 있으며, 에이전트 작업은 여전히 Gateway WebSocket과 `node.invoke`를 통해 흐릅니다. UI 자동화는 PeekabooBridge를 사용합니다.

## 목표

- 모든 TCC 관련 작업(알림, 화면 녹화, 마이크, 음성, AppleScript)을 소유하는 단일 GUI 앱 인스턴스.
- 자동화를 위한 작은 인터페이스: Gateway 및 Node 명령, 그리고 UI 자동화를 위한 PeekabooBridge.
- 예측 가능한 권한: 항상 동일한 서명된 bundle ID를 사용하고 launchd가 실행하므로 TCC 권한 부여가 유지됩니다.

## 작동 방식

### Gateway + Node 전송

- 앱은 Gateway(로컬 모드)를 실행하고 Node로 연결합니다.
- 에이전트 작업은 `node.invoke`를 통해 수행됩니다(예: `system.run`, `system.notify`, `canvas.*`).
- 일반적인 Mac Node 명령에는 `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run`, `system.notify`가 포함됩니다.
- Node는 `permissions` 맵을 보고하므로 에이전트가 화면,
  카메라, 마이크, 음성, 자동화 또는 손쉬운 사용 접근 권한이 사용 가능한지 확인할 수 있습니다.

### Node 서비스 + 앱 IPC

- 헤드리스 Node 호스트 서비스가 Gateway WebSocket에 연결합니다.
- `system.run` 요청은 로컬 Unix 소켓을 통해 macOS 앱으로 전달됩니다.
- 앱은 UI 컨텍스트에서 실행을 수행하고, 필요한 경우 프롬프트를 표시한 뒤 출력을 반환합니다.

다이어그램(SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge(UI 자동화)

- UI 자동화는 `bridge.sock`이라는 별도 UNIX 소켓과 PeekabooBridge JSON 프로토콜을 사용합니다.
- 호스트 선호 순서(클라이언트 측): Peekaboo.app → Claude.app → OpenClaw.app → 로컬 실행.
- 보안: 브리지 호스트는 허용된 TeamID를 요구합니다. DEBUG 전용 같은 UID 탈출구는 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`로 보호됩니다(Peekaboo 규칙).
- 자세한 내용은 [PeekabooBridge 사용법](/ko/platforms/mac/peekaboo)을 참조하세요.

## 운영 흐름

- 재시작/재빌드: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 기존 인스턴스를 종료합니다
  - Swift 빌드 + 패키지
  - LaunchAgent를 작성/부트스트랩/킥스타트합니다
- 단일 인스턴스: 동일한 bundle ID를 가진 다른 인스턴스가 실행 중이면 앱이 일찍 종료됩니다.

## 강화 참고 사항

- 모든 권한 있는 인터페이스에 TeamID 일치를 요구하는 것을 선호합니다.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`(DEBUG 전용)은 로컬 개발을 위해 같은 UID 호출자를 허용할 수 있습니다.
- 모든 통신은 로컬 전용으로 유지되며, 네트워크 소켓은 노출되지 않습니다.
- TCC 프롬프트는 GUI 앱 번들에서만 시작됩니다. 재빌드 사이에도 서명된 bundle ID를 안정적으로 유지하세요.
- IPC 강화: 소켓 모드 `0600`, 토큰, 피어 UID 검사, HMAC challenge/response, 짧은 TTL.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [macOS IPC 흐름(실행 승인)](/ko/tools/exec-approvals-advanced#macos-ipc-flow)
