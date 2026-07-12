---
read_when:
    - Chrome은 Windows에서 실행하고 OpenClaw Gateway는 WSL2에서 실행하기
    - WSL2와 Windows에서 중복되는 브라우저/control-ui 오류 확인하기
    - 분리 호스트 설정에서 호스트 로컬 Chrome MCP와 원격 원시 CDP 중 선택하기
summary: WSL2 Gateway + Windows Chrome 원격 CDP를 계층별로 문제 해결하기
title: WSL2 + Windows + 원격 Chrome CDP 문제 해결
x-i18n:
    generated_at: "2026-07-12T15:47:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

일반적인 분리 호스트 구성에서는 OpenClaw Gateway가 WSL2 내부에서 실행되고 Chrome은
Windows에서 실행되므로, 브라우저 제어가 WSL2/Windows 경계를 넘어야 합니다. 여러
독립적인 문제가 동시에 발생할 수 있습니다([이슈 #39369](https://github.com/openclaw/openclaw/issues/39369) 참조). CDP
전송, Control UI 출처 보안, 토큰/페어링은 각각 독립적으로 실패하면서도
비슷해 보이는 오류를 생성할 수 있습니다. 어떤 부분이 고장 났는지 추측하지 말고
아래 계층을 순서대로 점검하십시오.

## 먼저 올바른 브라우저 모드를 선택하십시오

### 옵션 1: WSL2에서 Windows로 직접 원격 CDP 사용

WSL2에서 Windows Chrome CDP 엔드포인트를 가리키는 원격 브라우저 프로필을
사용하십시오. Gateway는 WSL2 내부에서 계속 실행되고 Chrome은
Windows에서 실행되며, 브라우저 제어가 WSL2/Windows 경계를 넘어야 할 때 선택하십시오.

### 옵션 2: 호스트 로컬 Chrome MCP

Gateway가 Chrome과 동일한 호스트에서 실행되고, 로컬의 로그인된 브라우저 상태를
사용하려 하며, 호스트 간 브라우저 전송이 필요하지 않고, `responsebody`,
PDF 내보내기, 다운로드 가로채기 또는 일괄 작업이 필요하지 않은 경우에만
`existing-session` 드라이버(`user` 프로필)를 사용하십시오(Chrome MCP 프로필은
이러한 기능을 지원하지 않습니다).

WSL2 Gateway + Windows Chrome 구성에는 직접 원격 CDP를 사용하십시오. Chrome MCP는
호스트 로컬 방식이며 WSL2와 Windows 사이의 브리지가 아닙니다.

## 동작하는 아키텍처

- WSL2에서 `127.0.0.1:18789`의 Gateway를 실행합니다
- Windows에서 일반 브라우저로 `http://127.0.0.1:18789/`의 Control UI를 엽니다
- Windows Chrome이 포트 `9222`에 CDP 엔드포인트를 노출합니다
- WSL2에서 해당 Windows CDP 엔드포인트에 접근할 수 있습니다
- OpenClaw가 WSL2에서 접근 가능한 주소를 브라우저 프로필로 가리킵니다

## Control UI의 중요 규칙

Windows에서 UI를 열 때 의도적으로 HTTPS를 구성한 경우가 아니라면 Windows
localhost를 사용하십시오.

```text
http://127.0.0.1:18789/
```

LAN IP를 기본값으로 사용하지 마십시오. LAN 또는 tailnet 주소에서 일반 HTTP를
사용하면 CDP 자체와 무관한 안전하지 않은 출처/기기 인증 동작이
발생할 수 있습니다. [Control UI](/ko/web/control-ui)를 참조하십시오.

## 계층별로 검증하십시오

위에서 아래로 진행하고 중간 단계를 건너뛰지 마십시오. 한 계층을 수정해도
더 아래의 다른 계층에서 발생한 오류가 계속 표시될 수 있습니다.

### 계층 1: Windows에서 Chrome이 CDP를 제공하는지 확인하십시오

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 이상은 기본 Chrome 데이터 디렉터리에 대한 원격 디버깅 명령줄
스위치를 무시합니다. 위와 같이 별도의 기본값이 아닌 데이터 디렉터리를
사용하십시오. Chrome의
[원격 디버깅 보안 변경 사항](https://developer.chrome.com/blog/remote-debugging-port)을 참조하십시오.
이렇게 해도 일반적으로 로그인된 Chrome 프로필을 원격으로 제어할 수 있게 되는 것은 아닙니다.

먼저 Windows에서 Chrome 자체를 확인하십시오.

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

실패하면 아래의 Windows 리스너를 진단하십시오. 아직은 OpenClaw가
문제가 아닙니다.

#### portproxy를 변경하기 전에 IPv4와 IPv6를 진단하십시오

Chromium은 먼저 원격 디버깅을 `127.0.0.1`에 바인딩하려고 시도하며, IPv4 바인딩에
실패한 경우에만 `[::1]`로 폴백합니다. `127.0.0.1:9222`에서 수신하는 영구
`v4tov4` 규칙이 Chrome 시작 전에 해당 엔드포인트를 점유할 수 있습니다. 그러면 Chrome은
`[::1]:9222`로 폴백하지만, 이전 규칙은 IPv4 트래픽을 자체 리스너로 다시
전달하여 빈 응답을 반환합니다.

Chrome 버전으로 추론하지 말고 Windows에서 실제 리스너와 프록시 규칙을
확인하십시오.

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

`netstat`에 표시된 각 PID에 `tasklist /fi "PID eq <PID>"`를 사용하십시오.

- `chrome.exe`가 `127.0.0.1`에서 응답하는 경우, `127.0.0.1:9222`에서도
  수신하는 모든 portproxy 규칙을 제거하십시오. WSL2에서 접근 가능한 Windows 어댑터
  주소에서 `127.0.0.1`로만 전달하십시오.
- `chrome.exe`가 `[::1]`에서만 응답하는 경우, 사용하지 않는 IPv4 주소로 전달하는 대신
  `v4tov6`를 사용하여 WSL2에서 접근 가능한 리스너가 `::1`을 가리키도록 하십시오.

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

리스너를 WSL2에 필요한 어댑터 주소에 바인딩하십시오. CDP 포트를
`0.0.0.0`, LAN 주소 또는 tailnet 주소에 노출하지 마십시오. CDP는
브라우저 세션의 제어 권한을 부여합니다.

### 계층 2: WSL2에서 해당 Windows 엔드포인트에 접근할 수 있는지 확인하십시오

WSL2에서 `cdpUrl`에 사용할 정확한 주소를 테스트하십시오.

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

정상 결과:

- `/json/version`이 Browser / Protocol-Version 메타데이터가 포함된 JSON을 반환합니다
- `/json/list`가 JSON을 반환합니다(열린 페이지가 없으면 빈 배열이어도 괜찮습니다)

실패하면 Windows가 아직 WSL2에 포트를 노출하지 않았거나, 해당 주소가
WSL2 측에서 잘못되었거나, 방화벽/포트 전달/프록시가 누락된 것입니다. OpenClaw 구성을
변경하기 전에 이 문제부터 해결하십시오.

### 계층 3: 올바른 브라우저 프로필을 구성하십시오

OpenClaw가 WSL2에서 접근 가능한 주소를 가리키도록 하십시오.

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

- Windows에서만 작동하는 주소가 아니라 WSL2에서 접근 가능한 주소를 사용하십시오
- 외부에서 관리하는 브라우저에는 `attachOnly: true`를 유지하십시오
- `cdpUrl`은 `http://`, `https://`, `ws://` 또는 `wss://`일 수 있습니다
- OpenClaw가 `/json/version`을 탐색하도록 하려면 HTTP(S)를 사용하십시오
- 브라우저 제공업체가 직접 DevTools 소켓 URL을 제공하는 경우에만 WS(S)를
  사용하십시오
- OpenClaw의 성공을 기대하기 전에 동일한 URL을 `curl`로 테스트하십시오

### 계층 4: Control UI 계층을 별도로 확인하십시오

Windows에서 `http://127.0.0.1:18789/`를 연 다음 다음 사항을 확인하십시오.

- 페이지 출처가 `gateway.controlUi.allowedOrigins`에서 예상하는 값과 일치합니다
- 토큰 인증 또는 페어링이 올바르게 구성되어 있습니다
- Control UI 인증 문제를 브라우저 문제로 오인하여 디버깅하고 있지 않습니다

도움말 페이지: [Control UI](/ko/web/control-ui).

### 계층 5: 엔드투엔드 브라우저 제어를 확인하십시오

WSL2에서 다음을 실행하십시오.

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

정상 결과:

- Windows Chrome에서 탭이 열립니다
- `browser tabs`가 대상을 반환합니다
- 이후 작업(`snapshot`, `screenshot`, `navigate`)이 동일한
  프로필에서 작동합니다

## 흔히 오해하기 쉬운 오류

| 메시지                                                                                  | 의미                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `control-ui-insecure-auth`                                                              | CDP 전송 문제가 아니라 UI 출처/보안 컨텍스트 문제입니다                                                                                                                                   |
| `token_missing`                                                                         | 인증 구성 문제입니다                                                                                                                                                                      |
| `pairing required`                                                                      | 기기 승인 문제입니다                                                                                                                                                                      |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2에서 구성된 `cdpUrl`에 접근할 수 없습니다                                                                                                                                              |
| portproxy를 통한 빈 CDP 응답 / `other side closed`                                      | Windows 리스너 불일치 또는 자체 루프입니다. 두 루프백 주소 체계와 `netsh interface portproxy show all`을 모두 확인하십시오                                                                 |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP 엔드포인트는 응답했지만 DevTools WebSocket을 열 수 없습니다                                                                                                                           |
| 원격 세션 후 남아 있는 뷰포트 / 다크 모드 / 로캘 / 오프라인 재정의                     | Gateway나 외부 브라우저를 다시 시작하지 않고 세션을 닫고 캐시된 Playwright/CDP 연결을 해제하려면 `openclaw browser --browser-profile remote stop`을 실행하십시오                            |
| `remoteCdpTimeoutMs` 관련 시간 초과(기본값 1500ms)                                      | 일반적으로 여전히 CDP 접근성 문제이거나 느리거나 접근할 수 없는 원격 엔드포인트 문제입니다                                                                                                 |
| `Playwright page enumeration timed out after 3000ms`                                    | 원격 CDP에는 연결되었지만 영구 탭 읽기가 중단되었습니다. 제한 시간은 `remoteCdpTimeoutMs`와 `remoteCdpHandshakeTimeoutMs` 중 더 큰 값입니다                                                 |
| `No Chrome tabs found for profile="user"`                                               | 호스트 로컬 탭을 사용할 수 없는 곳에서 로컬 Chrome MCP 프로필을 선택했습니다                                                                                                               |

## 빠른 분류 체크리스트

1. Windows: `127.0.0.1`과 `[::1]` 중 어느 쪽이 `/json/version`에 응답하며,
   해당 리스너가 `chrome.exe`에 속합니까?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version`이 작동합니까?
3. OpenClaw 구성: `browser.profiles.<name>.cdpUrl`이 WSL2에서 접근 가능한 바로 그
   주소를 사용합니까?
4. Control UI: LAN IP 대신 `http://127.0.0.1:18789/`를 열고 있습니까?
5. 직접 원격 CDP 대신 WSL2와 Windows 사이에서 `existing-session`을
   사용하려고 합니까?

먼저 Windows Chrome 엔드포인트를 로컬에서 확인하고, 그다음 WSL2에서 동일한 엔드포인트를
확인한 후에만 OpenClaw 구성 또는 Control UI 인증을 디버깅하십시오.

## 관련 문서

- [브라우저](/ko/tools/browser)
- [브라우저 로그인](/ko/tools/browser-login)
- [브라우저 Linux 문제 해결](/ko/tools/browser-linux-troubleshooting)
