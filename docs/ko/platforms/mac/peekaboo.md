---
read_when:
    - OpenClaw.app에서 PeekabooBridge 호스팅하기
    - Swift Package Manager를 통한 Peekaboo 통합
    - PeekabooBridge 프로토콜/경로 변경
    - PeekabooBridge, Codex Computer Use, cua-driver MCP 중 선택하기
summary: macOS UI 자동화를 위한 PeekabooBridge 통합
title: 피커부 브리지
x-i18n:
    generated_at: "2026-06-27T17:40:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw는 **PeekabooBridge**를 로컬의 권한 인식 UI 자동화
브로커로 호스팅할 수 있습니다. 이를 통해 `peekaboo` CLI가 macOS 앱의 TCC
권한을 재사용하면서 UI 자동화를 구동할 수 있습니다.

## 이것의 역할(그리고 아닌 것)

- **호스트**: OpenClaw.app은 PeekabooBridge 호스트로 작동할 수 있습니다.
- **클라이언트**: `peekaboo` CLI를 사용합니다(별도의 `openclaw ui ...` 표면 없음).
- **UI**: 시각적 오버레이는 Peekaboo.app에 유지됩니다. OpenClaw는 얇은 브로커 호스트입니다.

## 컴퓨터 사용과의 관계

OpenClaw에는 세 가지 데스크톱 제어 경로가 있으며, 이들은 의도적으로 분리되어 있습니다.

- **PeekabooBridge 호스트**: OpenClaw.app은 로컬 PeekabooBridge 소켓을 호스팅할 수 있습니다.
  `peekaboo` CLI는 계속 클라이언트로 남으며, 스크린샷, 클릭,
  메뉴, 대화 상자, Dock 작업, 창 관리 같은 Peekaboo 자동화 프리미티브에
  OpenClaw.app의 macOS 권한을 사용합니다.
- **Codex 컴퓨터 사용**: 번들된 `codex` Plugin은 Codex 앱 서버를 준비하고,
  Codex의 `computer-use` MCP 서버를 사용할 수 있는지 확인한 다음,
  Codex 모드 턴 중 네이티브 데스크톱 제어 도구 호출을 Codex가 소유하도록 합니다. OpenClaw는
  이러한 작업을 PeekabooBridge를 통해 프록시하지 않습니다.
- **직접 `cua-driver` MCP**: OpenClaw는 TryCua의 업스트림
  `cua-driver mcp` 서버를 일반 MCP 서버로 등록할 수 있습니다. 이렇게 하면 에이전트가 Codex
  마켓플레이스나 PeekabooBridge 소켓을 거치지 않고 CUA
  드라이버 자체의 스키마와 pid/window/element-index 워크플로를 사용할 수 있습니다.

넓은 macOS 자동화 표면과 OpenClaw.app의 권한 인식 브리지 호스트가 필요하면 Peekaboo를 사용하세요.
Codex 모드 에이전트가 Codex의 네이티브 computer-use Plugin에 의존해야 한다면 Codex 컴퓨터 사용을 사용하세요.
CUA 드라이버를 일반 MCP 서버로 OpenClaw가 관리하는 모든 런타임에 노출하려면 직접 `cua-driver mcp`를 사용하세요.

## 브리지 활성화

macOS 앱에서:

- 설정 → **Peekaboo Bridge 활성화**

활성화하면 OpenClaw가 로컬 UNIX 소켓 서버를 시작합니다. 비활성화하면 호스트가
중지되고 `peekaboo`는 사용 가능한 다른 호스트로 폴백합니다.

## 클라이언트 검색 순서

Peekaboo 클라이언트는 일반적으로 다음 순서로 호스트를 시도합니다.

1. Peekaboo.app(전체 UX)
2. Claude.app(설치된 경우)
3. OpenClaw.app(얇은 브로커)

활성 호스트와 사용 중인 소켓 경로를 보려면 `peekaboo bridge status --verbose`를 사용하세요.
다음으로 재정의할 수 있습니다.

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 보안 및 권한

- 브리지는 **호출자 코드 서명**을 검증합니다. TeamID 허용 목록이
  적용됩니다(Peekaboo 호스트 TeamID + OpenClaw 앱 TeamID).
- 접근성에는 일반 `node` 런타임보다 서명된 브리지/앱 ID를 선호하세요.
  `node`에 접근성을 부여하면 해당 Node 실행 파일로 실행되는 모든 패키지가
  GUI 자동화 접근 권한을 상속할 수 있습니다. [macOS 권한](/ko/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)을 참조하세요.
- 요청은 약 10초 후 시간 초과됩니다.
- 필요한 권한이 없으면 브리지는 시스템 설정을 실행하는 대신 명확한 오류 메시지를
  반환합니다.

## 스냅샷 동작(자동화)

스냅샷은 메모리에 저장되며 짧은 시간 창이 지나면 자동으로 만료됩니다.
더 오래 보관해야 한다면 클라이언트에서 다시 캡처하세요.

## 문제 해결

- `peekaboo`가 "bridge client is not authorized"를 보고하면 클라이언트가
  올바르게 서명되었는지 확인하거나, **debug** 모드에서만
  `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`로 호스트를 실행하세요.
- 호스트를 찾을 수 없다면 호스트 앱 중 하나(Peekaboo.app 또는 OpenClaw.app)를 열고
  권한이 부여되었는지 확인하세요.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [macOS 권한](/ko/platforms/mac/permissions)
