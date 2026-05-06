---
read_when:
    - OpenClaw.app에서 PeekabooBridge 호스팅하기
    - Swift Package Manager를 통한 Peekaboo 통합
    - PeekabooBridge 프로토콜/경로 변경
    - PeekabooBridge, Codex Computer Use, cua-driver MCP 중 선택하기
summary: macOS UI 자동화를 위한 PeekabooBridge 통합
title: 까꿍 브리지
x-i18n:
    generated_at: "2026-05-06T06:33:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw는 로컬의 권한 인식 UI 자동화 브로커로 **PeekabooBridge**를 호스팅할 수 있습니다.
이를 통해 `peekaboo` CLI가 macOS 앱의 TCC 권한을 재사용하면서 UI 자동화를 구동할 수 있습니다.

## 이것의 의미와 한계

- **호스트**: OpenClaw.app은 PeekabooBridge 호스트로 동작할 수 있습니다.
- **클라이언트**: `peekaboo` CLI를 사용합니다(별도의 `openclaw ui ...` 표면은 없음).
- **UI**: 시각적 오버레이는 Peekaboo.app에 남아 있으며, OpenClaw는 얇은 브로커 호스트입니다.

## Computer Use와의 관계

OpenClaw에는 세 가지 데스크톱 제어 경로가 있으며, 이들은 의도적으로 분리되어 있습니다.

- **PeekabooBridge 호스트**: OpenClaw.app은 로컬 PeekabooBridge 소켓을 호스팅할 수 있습니다.
  `peekaboo` CLI는 계속 클라이언트로 남으며, 스크린샷, 클릭,
  메뉴, 대화상자, Dock 동작, 창 관리 같은 Peekaboo 자동화 기본 요소에 OpenClaw.app의 macOS
  권한을 사용합니다.
- **Codex Computer Use**: 번들된 `codex` Plugin은 Codex 앱 서버를 준비하고,
  Codex의 `computer-use` MCP 서버를 사용할 수 있는지 확인한 다음,
  Codex 모드 턴 동안 Codex가 네이티브 데스크톱 제어 도구 호출을
  소유하게 합니다. OpenClaw는 이러한 동작을 PeekabooBridge를 통해 프록시하지 않습니다.
- **직접 `cua-driver` MCP**: OpenClaw는 TryCua의 업스트림
  `cua-driver mcp` 서버를 일반 MCP 서버로 등록할 수 있습니다. 이렇게 하면 에이전트가 Codex 마켓플레이스나 PeekabooBridge 소켓을
  거치지 않고 CUA 드라이버 자체의 스키마와 pid/창/요소 인덱스 워크플로를 사용할 수 있습니다.

넓은 macOS 자동화 표면과 OpenClaw.app의 권한 인식 브리지 호스트가 필요할 때 Peekaboo를 사용하세요. Codex 모드 에이전트가 Codex의 네이티브 computer-use Plugin에 의존해야 할 때는 Codex Computer Use를 사용하세요. CUA 드라이버를 OpenClaw가 관리하는 모든 런타임에 일반
MCP 서버로 노출하고 싶을 때는 직접 `cua-driver mcp`를 사용하세요.

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

어떤 호스트가 활성 상태인지와 어떤 소켓 경로가 사용 중인지 보려면 `peekaboo bridge status --verbose`를 사용하세요. 다음으로 재정의할 수 있습니다.

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 보안 및 권한

- 브리지는 **호출자 코드 서명**을 검증하며, TeamID 허용 목록이
  적용됩니다(Peekaboo 호스트 TeamID + OpenClaw 앱 TeamID).
- 요청은 약 10초 후 시간 초과됩니다.
- 필요한 권한이 없으면 브리지는 시스템 설정을 실행하는 대신
  명확한 오류 메시지를 반환합니다.

## 스냅샷 동작(자동화)

스냅샷은 메모리에 저장되며 짧은 시간 후 자동으로 만료됩니다.
더 오래 보존해야 한다면 클라이언트에서 다시 캡처하세요.

## 문제 해결

- `peekaboo`가 "bridge client is not authorized"를 보고하면 클라이언트가
  올바르게 서명되었는지 확인하거나 **debug** 모드에서만 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`로
  호스트를 실행하세요.
- 호스트를 찾을 수 없다면 호스트 앱(Peekaboo.app 또는 OpenClaw.app) 중 하나를 열고
  권한이 부여되었는지 확인하세요.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [macOS 권한](/ko/platforms/mac/permissions)
