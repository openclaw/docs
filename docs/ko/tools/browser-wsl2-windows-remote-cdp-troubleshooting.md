---
read_when:
    - Chrome은 Windows에서 실행하고 OpenClaw Gateway는 WSL2에서 실행하기
    - WSL2와 Windows에서 중복되는 브라우저/제어 UI 오류가 나타남
    - 분리 호스트 구성에서 호스트 로컬 Chrome MCP와 원시 원격 CDP 중 선택하기
summary: WSL2 Gateway + Windows Chrome 원격 CDP 계층별 문제 해결
title: WSL2 + Windows + 원격 Chrome CDP 문제 해결
x-i18n:
    generated_at: "2026-07-12T01:19:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

일반적인 분리 호스트 구성에서는 OpenClaw Gateway가 WSL2 내부에서 실행되고 Chrome은
Windows에서 실행되며, 브라우저 제어는 WSL2/Windows 경계를 통과해야 합니다. 서로
독립적인 여러 문제가 동시에 나타날 수 있습니다(
[이슈 #39369](https://github.com/openclaw/openclaw/issues/39369) 참조). CDP
전송, Control UI 출처 보안, 토큰/페어링은 각각 독립적으로 실패하면서
서로 비슷한 오류를 생성할 수 있습니다. 어느 부분이 손상되었는지 추측하지 말고
아래 계층을 순서대로 점검하세요.

## 먼저 올바른 브라우저 모드 선택하기

### 옵션 1: WSL2에서 Windows로 원시 원격 CDP 사용

WSL2에서 Windows Chrome CDP 엔드포인트를 가리키는 원격 브라우저 프로필을
사용하세요. Gateway는 WSL2 내부에서 계속 실행되고 Chrome은 Windows에서
실행되며, 브라우저 제어가 WSL2/Windows 경계를 통과해야 할 때 선택합니다.

### 옵션 2: 호스트 로컬 Chrome MCP

Gateway가 Chrome과 동일한 호스트에서 실행되고, 로컬의 로그인된 브라우저 상태를
사용하려 하며, 호스트 간 브라우저 전송이 필요하지 않고, `responsebody`,
PDF 내보내기, 다운로드 가로채기 또는 일괄 작업이 필요하지 않을 때만
`existing-session` 드라이버(`user` 프로필)를 사용하세요(Chrome MCP 프로필은
이러한 기능을 지원하지 않습니다).

WSL2 Gateway + Windows Chrome 구성에서는 원시 원격 CDP를 사용하세요. Chrome MCP는
호스트 로컬용이며 WSL2와 Windows 사이를 연결하는 브리지가 아닙니다.

## 정상 작동 아키텍처

- WSL2는 `127.0.0.1:18789`에서 Gateway를 실행합니다
- Windows는 일반 브라우저에서 `http://127.0.0.1:18789/` 주소로 Control UI를 엽니다
- Windows Chrome은 포트 `9222`에 CDP 엔드포인트를 노출합니다
- WSL2에서 해당 Windows CDP 엔드포인트에 접근할 수 있습니다
- OpenClaw는 WSL2에서 접근 가능한 주소를 브라우저 프로필에 지정합니다

## Control UI의 핵심 규칙

Windows에서 UI를 열 때 의도적으로 HTTPS를 구성한 경우가 아니라면 Windows의
localhost를 사용하세요.

```text
http://127.0.0.1:18789/
```

LAN IP를 기본값으로 사용하지 마세요. LAN 또는 tailnet 주소에서 일반 HTTP를
사용하면 CDP 자체와 무관한 안전하지 않은 출처/기기 인증 동작이 발생할 수
있습니다. [Control UI](/ko/web/control-ui)를 참조하세요.

## 계층별 검증

위에서 아래로 진행하고 중간 단계를 건너뛰지 마세요. 한 계층을 수정한 후에도
더 아래 계층의 다른 오류가 계속 표시될 수 있습니다.

### 계층 1: Windows에서 Chrome이 CDP를 제공하는지 확인

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 이상에서는 기본 Chrome 데이터 디렉터리에 대해 원격 디버깅 명령줄
스위치를 무시합니다. 위 예시처럼 별도의 기본값이 아닌 데이터 디렉터리를
사용하세요. Chrome의
[원격 디버깅 보안 변경 사항](https://developer.chrome.com/blog/remote-debugging-port)을 참조하세요.
이렇게 해도 일반적으로 로그인된 Chrome 프로필을 원격으로 제어할 수 있게 되는
것은 아닙니다.

먼저 Windows에서 Chrome 자체를 확인하세요.

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

실패하면 아래에서 Windows 리스너를 진단하세요. 아직은 OpenClaw가 문제가
아닙니다.

#### portproxy를 변경하기 전에 IPv4 및 IPv6 진단하기

Chromium은 먼저 원격 디버깅을 `127.0.0.1`에 바인딩하려고 시도하고, IPv4 바인딩이
실패한 경우에만 `[::1]`로 대체합니다. `127.0.0.1:9222`에서 수신하는 영구
`v4tov4` 규칙은 Chrome이 시작되기 전에 해당 엔드포인트를 점유할 수 있습니다.
그러면 Chrome은 `[::1]:9222`로 대체하지만, 기존 규칙은 IPv4 트래픽을 자체
리스너로 다시 전달하여 빈 응답을 반환합니다.

Chrome 버전을 근거로 추론하지 말고 Windows에서 실제 리스너와 프록시 규칙을
확인하세요.

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

`netstat`에서 확인한 각 PID에 `tasklist /fi "PID eq <PID>"`를 사용하세요.

- `chrome.exe`가 `127.0.0.1`에서 응답하면 `127.0.0.1:9222`에서도 수신하는 모든
  portproxy 규칙을 제거하세요. WSL2에서 접근 가능한 Windows 어댑터 주소만
  `127.0.0.1`로 전달하세요.
- `chrome.exe`가 `[::1]`에서만 응답하면 사용하지 않는 IPv4 주소로 전달하는 대신
  `v4tov6`를 사용하여 WSL2에서 접근 가능한 리스너가 `::1`을 가리키도록 하세요.

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

WSL2에 필요한 어댑터 주소에 리스너를 바인딩하세요. CDP는 브라우저 세션을 제어할
수 있는 권한을 부여하므로 `0.0.0.0`, LAN 주소 또는 tailnet 주소에 CDP 포트를
노출하지 마세요.

### 계층 2: WSL2에서 해당 Windows 엔드포인트에 접근할 수 있는지 확인

WSL2에서 `cdpUrl`에 사용할 정확한 주소를 테스트하세요.

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

정상 결과:

- `/json/version`은 Browser / Protocol-Version 메타데이터가 포함된 JSON을 반환합니다
- `/json/list`는 JSON을 반환합니다(열린 페이지가 없으면 빈 배열이어도 됩니다)

실패하면 아직 Windows가 WSL2에 포트를 노출하지 않았거나, WSL2 측에서 주소가
잘못되었거나, 방화벽/포트 전달/프록시가 누락된 것입니다. OpenClaw 구성을
수정하기 전에 이 문제를 해결하세요.

### 계층 3: 올바른 브라우저 프로필 구성

WSL2에서 접근 가능한 주소를 OpenClaw에 지정하세요.

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

- Windows에서만 작동하는 주소가 아니라 WSL2에서 접근 가능한 주소를 사용하세요
- 외부에서 관리되는 브라우저에는 `attachOnly: true`를 유지하세요
- `cdpUrl`에는 `http://`, `https://`, `ws://` 또는 `wss://`를 사용할 수 있습니다
- OpenClaw가 `/json/version`을 검색하도록 하려면 HTTP(S)를 사용하세요
- 브라우저 제공자가 직접 DevTools 소켓 URL을 제공하는 경우에만 WS(S)를 사용하세요
- OpenClaw의 성공을 기대하기 전에 동일한 URL을 `curl`로 테스트하세요

### 계층 4: Control UI 계층을 별도로 확인

Windows에서 `http://127.0.0.1:18789/`를 연 다음 다음 사항을 확인하세요.

- 페이지 출처가 `gateway.controlUi.allowedOrigins`에서 요구하는 값과 일치합니다
- 토큰 인증 또는 페어링이 올바르게 구성되어 있습니다
- Control UI 인증 문제를 브라우저 문제로 오인하여 디버깅하고 있지 않습니다

도움말 페이지: [Control UI](/ko/web/control-ui).

### 계층 5: 종단 간 브라우저 제어 확인

WSL2에서 다음을 실행하세요.

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

정상 결과:

- Windows Chrome에서 탭이 열립니다
- `browser tabs`가 대상을 반환합니다
- 이후 작업(`snapshot`, `screenshot`, `navigate`)이 동일한 프로필에서 작동합니다

## 혼동하기 쉬운 일반적인 오류

| 메시지                                                                                  | 의미                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | CDP 전송 문제가 아니라 UI 출처/보안 컨텍스트 문제                                                                                                                                        |
| `token_missing`                                                                         | 인증 구성 문제                                                                                                                                                                            |
| `pairing required`                                                                      | 기기 승인 문제                                                                                                                                                                            |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2에서 구성된 `cdpUrl`에 접근할 수 없음                                                                                                                                                  |
| portproxy를 통한 빈 CDP 응답 / `other side closed`                                      | Windows 리스너 불일치 또는 자체 루프. 두 루프백 주소 체계와 `netsh interface portproxy show all`을 모두 검사하세요                                                                         |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP 엔드포인트는 응답했지만 DevTools WebSocket을 열 수 없음                                                                                                                               |
| 원격 세션 후 남아 있는 뷰포트 / 다크 모드 / 로케일 / 오프라인 재정의                   | Gateway 또는 외부 브라우저를 다시 시작하지 않고 세션을 닫고 캐시된 Playwright/CDP 연결을 해제하려면 `openclaw browser --browser-profile remote stop`을 실행하세요                            |
| `remoteCdpTimeoutMs` 관련 시간 초과(기본값 1500ms)                                      | 일반적으로 여전히 CDP 접근성 문제이거나 느리거나 접근할 수 없는 원격 엔드포인트                                                                                                           |
| `Playwright page enumeration timed out after 3000ms`                                    | 원격 CDP에는 연결되었지만 지속적인 탭 읽기가 중단됨. 제한 시간은 `remoteCdpTimeoutMs`와 `remoteCdpHandshakeTimeoutMs` 중 더 큰 값입니다                                                     |
| `No Chrome tabs found for profile="user"`                                               | 호스트 로컬 탭을 사용할 수 없는 환경에서 로컬 Chrome MCP 프로필을 선택함                                                                                                                  |

## 빠른 분류 체크리스트

1. Windows: `127.0.0.1`과 `[::1]` 중 어느 주소가 `/json/version`에 응답하며,
   해당 리스너가 `chrome.exe`에 속합니까?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version`이 작동합니까?
3. OpenClaw 구성: `browser.profiles.<name>.cdpUrl`이 WSL2에서 접근 가능한 바로 그
   주소를 사용합니까?
4. Control UI: LAN IP 대신 `http://127.0.0.1:18789/`를 열고 있습니까?
5. 원시 원격 CDP 대신 WSL2와 Windows 사이에서 `existing-session`을 사용하려고
   합니까?

먼저 Windows Chrome 엔드포인트를 로컬에서 확인하고, 다음으로 WSL2에서 동일한
엔드포인트를 확인한 후에만 OpenClaw 구성 또는 Control UI 인증을 디버깅하세요.

## 관련 문서

- [브라우저](/ko/tools/browser)
- [브라우저 로그인](/ko/tools/browser-login)
- [브라우저 Linux 문제 해결](/ko/tools/browser-linux-troubleshooting)
