---
read_when:
    - Chrome은 Windows에 두고 WSL2에서 OpenClaw Gateway 실행하기
    - WSL2와 Windows 전반에서 겹치는 브라우저/control-ui 오류가 표시됨
    - 분리 호스트 설정에서 호스트 로컬 Chrome MCP와 원시 원격 CDP 중 결정하기
summary: WSL2 Gateway + Windows Chrome 원격 CDP 문제를 계층별로 해결하기
title: WSL2 + Windows + 원격 Chrome CDP 문제 해결
x-i18n:
    generated_at: "2026-04-30T06:52:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

일반적인 분리 호스트 설정에서는 OpenClaw Gateway가 WSL2 안에서 실행되고, Chrome은 Windows에서 실행되며, 브라우저 제어가 WSL2와 Windows 경계를 넘어야 합니다. [issue #39369](https://github.com/openclaw/openclaw/issues/39369)의 계층적 실패 패턴은 여러 독립적인 문제가 동시에 나타날 수 있음을 의미하며, 이 때문에 먼저 잘못된 계층이 고장 난 것처럼 보일 수 있습니다.

## 먼저 올바른 브라우저 모드 선택하기

두 가지 유효한 패턴이 있습니다.

### 옵션 1: WSL2에서 Windows로 원시 원격 CDP 사용

WSL2에서 Windows Chrome CDP 엔드포인트를 가리키는 원격 브라우저 프로필을 사용합니다.

다음 경우에 선택하세요.

- Gateway가 WSL2 안에 유지됩니다
- Chrome이 Windows에서 실행됩니다
- 브라우저 제어가 WSL2/Windows 경계를 넘어야 합니다

### 옵션 2: 호스트 로컬 Chrome MCP

Gateway 자체가 Chrome과 같은 호스트에서 실행될 때만 `existing-session` / `user`를 사용합니다.

다음 경우에 선택하세요.

- OpenClaw와 Chrome이 같은 머신에 있습니다
- 로컬 로그인 브라우저 상태를 사용하려고 합니다
- 호스트 간 브라우저 전송이 필요하지 않습니다
- `responsebody`, PDF 내보내기, 다운로드 가로채기, 배치 작업 같은 고급 관리형/원시-CDP 전용 경로가 필요하지 않습니다

WSL2 Gateway + Windows Chrome의 경우 원시 원격 CDP를 선호하세요. Chrome MCP는 호스트 로컬이며, WSL2에서 Windows로 이어지는 브리지가 아닙니다.

## 작동하는 아키텍처

참조 형태:

- WSL2가 `127.0.0.1:18789`에서 Gateway를 실행합니다
- Windows가 일반 브라우저에서 `http://127.0.0.1:18789/`로 Control UI를 엽니다
- Windows Chrome이 포트 `9222`에서 CDP 엔드포인트를 노출합니다
- WSL2가 해당 Windows CDP 엔드포인트에 도달할 수 있습니다
- OpenClaw가 WSL2에서 도달 가능한 주소를 브라우저 프로필에 지정합니다

## 이 설정이 혼란스러운 이유

여러 실패가 겹칠 수 있습니다.

- WSL2가 Windows CDP 엔드포인트에 도달할 수 없습니다
- Control UI가 보안이 아닌 출처에서 열렸습니다
- `gateway.controlUi.allowedOrigins`가 페이지 출처와 일치하지 않습니다
- 토큰 또는 페어링이 누락되었습니다
- 브라우저 프로필이 잘못된 주소를 가리킵니다

이 때문에 한 계층을 수정해도 다른 오류가 계속 보일 수 있습니다.

## Control UI의 중요한 규칙

UI를 Windows에서 열 때는 의도적인 HTTPS 설정이 없다면 Windows localhost를 사용하세요.

사용:

`http://127.0.0.1:18789/`

Control UI에는 기본적으로 LAN IP를 사용하지 마세요. LAN 또는 tailnet 주소의 일반 HTTP는 CDP 자체와 무관한 안전하지 않은 출처/기기 인증 동작을 유발할 수 있습니다. [Control UI](/ko/web/control-ui)를 참조하세요.

## 계층별 검증

위에서 아래로 진행하세요. 건너뛰지 마세요.

### 계층 1: Chrome이 Windows에서 CDP를 제공하는지 확인

원격 디버깅을 활성화해 Windows에서 Chrome을 시작합니다.

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows에서 먼저 Chrome 자체를 확인합니다.

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

이 단계가 Windows에서 실패하면 아직 OpenClaw 문제가 아닙니다.

### 계층 2: WSL2가 해당 Windows 엔드포인트에 도달할 수 있는지 확인

WSL2에서 `cdpUrl`에 사용할 정확한 주소를 테스트합니다.

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

정상 결과:

- `/json/version`이 Browser / Protocol-Version 메타데이터가 포함된 JSON을 반환합니다
- `/json/list`가 JSON을 반환합니다(열린 페이지가 없으면 빈 배열도 괜찮습니다)

실패하는 경우:

- Windows가 아직 포트를 WSL2에 노출하지 않고 있습니다
- WSL2 쪽에서 주소가 잘못되었습니다
- 방화벽 / 포트 포워딩 / 로컬 프록시가 아직 누락되어 있습니다

OpenClaw 설정을 건드리기 전에 이를 수정하세요.

### 계층 3: 올바른 브라우저 프로필 구성

원시 원격 CDP의 경우 WSL2에서 도달 가능한 주소를 OpenClaw에 지정합니다.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

참고:

- Windows에서만 작동하는 주소가 아니라 WSL2에서 도달 가능한 주소를 사용하세요
- 외부에서 관리되는 브라우저에는 `attachOnly: true`를 유지하세요
- `cdpUrl`은 `http://`, `https://`, `ws://`, 또는 `wss://`일 수 있습니다
- OpenClaw가 `/json/version`을 탐색하게 하려면 HTTP(S)를 사용하세요
- 브라우저 제공자가 직접 DevTools 소켓 URL을 제공할 때만 WS(S)를 사용하세요
- OpenClaw 성공을 기대하기 전에 같은 URL을 `curl`로 테스트하세요

### 계층 4: Control UI 계층을 별도로 검증

Windows에서 UI를 엽니다.

`http://127.0.0.1:18789/`

그런 다음 확인합니다.

- 페이지 출처가 `gateway.controlUi.allowedOrigins`가 기대하는 값과 일치합니다
- 토큰 인증 또는 페어링이 올바르게 구성되어 있습니다
- 브라우저 문제처럼 Control UI 인증 문제를 디버깅하고 있지 않습니다

도움이 되는 페이지:

- [Control UI](/ko/web/control-ui)

### 계층 5: 엔드투엔드 브라우저 제어 검증

WSL2에서:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

정상 결과:

- 탭이 Windows Chrome에서 열립니다
- `openclaw browser tabs`가 대상을 반환합니다
- 이후 작업(`snapshot`, `screenshot`, `navigate`)이 같은 프로필에서 작동합니다

## 흔히 오해를 부르는 오류

각 메시지를 계층별 단서로 다루세요.

- `control-ui-insecure-auth`
  - CDP 전송 문제가 아니라 UI 출처 / 보안 컨텍스트 문제입니다
- `token_missing`
  - 인증 구성 문제입니다
- `pairing required`
  - 기기 승인 문제입니다
- `Remote CDP for profile "remote" is not reachable`
  - WSL2가 구성된 `cdpUrl`에 도달할 수 없습니다
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP 엔드포인트는 응답했지만 DevTools WebSocket을 여전히 열 수 없습니다
- 원격 세션 후 오래된 뷰포트 / 다크 모드 / 로캘 / 오프라인 오버라이드
  - `openclaw browser stop --browser-profile remote`를 실행하세요
  - 이는 Gateway 또는 외부 브라우저를 다시 시작하지 않고 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제합니다
- `gateway timeout after 1500ms`
  - 여전히 CDP 도달 가능성 문제이거나 느리거나 도달할 수 없는 원격 엔드포인트인 경우가 많습니다
- `No Chrome tabs found for profile="user"`
  - 호스트 로컬 탭을 사용할 수 없는 곳에서 로컬 Chrome MCP 프로필이 선택되었습니다

## 빠른 트리아지 체크리스트

1. Windows: `curl http://127.0.0.1:9222/json/version`이 작동하나요?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version`이 작동하나요?
3. OpenClaw 설정: `browser.profiles.<name>.cdpUrl`이 정확히 그 WSL2에서 도달 가능한 주소를 사용하나요?
4. Control UI: LAN IP 대신 `http://127.0.0.1:18789/`를 열고 있나요?
5. 원시 원격 CDP 대신 WSL2와 Windows를 가로질러 `existing-session`을 사용하려고 하나요?

## 실용적인 결론

이 설정은 보통 실현 가능합니다. 어려운 점은 브라우저 전송, Control UI 출처 보안, 토큰/페어링이 각각 독립적으로 실패하면서 사용자 쪽에서는 비슷하게 보일 수 있다는 것입니다.

확실하지 않을 때는:

- 먼저 Windows Chrome 엔드포인트를 로컬에서 확인하세요
- 두 번째로 WSL2에서 같은 엔드포인트를 확인하세요
- 그다음에만 OpenClaw 설정 또는 Control UI 인증을 디버깅하세요

## 관련

- [브라우저](/ko/tools/browser)
- [브라우저 로그인](/ko/tools/browser-login)
- [브라우저 Linux 문제 해결](/ko/tools/browser-linux-troubleshooting)
