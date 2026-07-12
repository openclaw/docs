---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux에서 OpenClaw 브라우저 제어를 위한 Chrome/Brave/Edge/Chromium CDP 시작 문제 해결
title: 브라우저 문제 해결
x-i18n:
    generated_at: "2026-07-12T01:13:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## 문제: 포트 18800에서 Chrome CDP를 시작하지 못함

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### 근본 원인

Ubuntu와 대부분의 Linux 배포판에서 `apt install chromium`은 실제 브라우저가 아니라 snap 래퍼를 설치합니다.

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Snap의 AppArmor 제한은 OpenClaw가 브라우저 프로세스를 생성하고 모니터링하는 방식을 방해합니다.

그 밖의 일반적인 Linux 실행 실패:

- `The profile appears to be in use by another Chromium process`: 관리형 프로필 디렉터리에 오래된 `Singleton*` 잠금 파일이 있습니다. 잠금이 종료된 프로세스나 다른 호스트의 프로세스를 가리키는 경우 OpenClaw는 이러한 잠금을 제거하고 한 번 다시 시도합니다.
- `Missing X server or $DISPLAY`: 데스크톱 세션이 없는 호스트에서 표시되는 브라우저를 명시적으로 요청했습니다. Linux에서는 `DISPLAY`와 `WAYLAND_DISPLAY`가 모두 설정되지 않은 경우 로컬 관리형 프로필이 헤드리스 모드로 대체됩니다. `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` 또는 `browser.profiles.<name>.headless: false`를 설정했다면 해당 표시 모드 재정의를 제거하거나, `OPENCLAW_BROWSER_HEADLESS=1`을 설정하거나, `Xvfb`를 시작하거나, 일회성 관리형 실행을 위해 `openclaw browser start --headless`를 실행하거나, 실제 데스크톱 세션에서 OpenClaw를 실행하세요.

### 해결 방법 1: Google Chrome 설치(권장)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 의존성 오류가 있는 경우
```

`~/.openclaw/openclaw.json`을 업데이트합니다.

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### 해결 방법 2: 연결 전용 모드에서 snap Chromium 사용

snap Chromium을 유지해야 한다면 OpenClaw가 브라우저를 실행하는 대신 수동으로 시작한 브라우저에 연결하도록 구성하세요.

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Chromium을 수동으로 시작합니다.

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

선택적으로 systemd 사용자 서비스로 자동 시작할 수 있습니다.

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### 브라우저 작동 확인

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 구성 참조

| 옵션                             | 설명                                                                   | 기본값                                                                  |
| -------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `browser.enabled`                | 브라우저 제어 활성화                                                   | `true`                                                                  |
| `browser.executablePath`         | Chromium 기반 브라우저 바이너리 경로(Chrome/Brave/Edge/Chromium)       | 자동 감지(Chromium 기반인 경우 OS 기본 브라우저 우선)                   |
| `browser.headless`               | GUI 없이 실행                                                          | `false`                                                                 |
| `OPENCLAW_BROWSER_HEADLESS`      | 로컬 관리형 브라우저 헤드리스 모드의 프로세스별 재정의                 | 설정되지 않음                                                           |
| `browser.noSandbox`              | `--no-sandbox` 플래그 추가(일부 Linux 환경에 필요)                     | `false`                                                                 |
| `browser.attachOnly`             | 브라우저를 실행하지 않고 기존 브라우저에만 연결                        | `false`                                                                 |
| `browser.cdpPortRangeStart`      | 자동 할당 프로필의 로컬 CDP 시작 포트                                  | `18800`(Gateway 포트에서 파생)                                          |
| `browser.localLaunchTimeoutMs`   | 로컬 관리형 Chrome 검색 제한 시간, 최대 `120000`                       | `15000`                                                                 |
| `browser.localCdpReadyTimeoutMs` | 로컬 관리형 실행 후 CDP 준비 제한 시간, 최대 `120000`                  | `8000`                                                                  |

두 제한 시간 값은 모두 `120000`ms 이하의 양의 정수여야 하며, 그 밖의 값은 구성 로드 시 거부됩니다. Raspberry Pi, 오래된 VPS 호스트 또는 느린 저장 장치에서 Chrome이 CDP HTTP 엔드포인트를 노출하는 데 시간이 더 필요하면 `browser.localLaunchTimeoutMs`를 늘리세요. 실행에는 성공하지만 `openclaw browser start`에서 계속 `not reachable after start`가 보고되면 `browser.localCdpReadyTimeoutMs`를 늘리세요.

### 문제: profile="user"에 대한 Chrome 탭을 찾을 수 없음

`user`(`existing-session` / Chrome MCP) 프로필을 사용 중이지만 연결할 수 있는 열린 탭이 없습니다.

해결 방법:

1. 대신 관리형 브라우저를 사용합니다.
   `openclaw browser --browser-profile openclaw start`를 실행하거나
   `browser.defaultProfile: "openclaw"`을 설정하세요.
2. 로컬 Chrome을 하나 이상의 탭이 열린 상태로 계속 실행한 후
   `--browser-profile user`로 다시 시도하세요.

참고:

- `user`는 호스트에서만 사용할 수 있습니다. Linux 서버, 컨테이너 또는 원격 호스트에서는 대신 CDP 프로필을 사용하는 것이 좋습니다.
- `user`와 기타 `existing-session` 프로필에는 현재 Chrome MCP 제한 사항이 공통으로 적용됩니다. 참조 기반 작업만 가능하고, 업로드당 파일 하나만 지원하며, 대화 상자의 `timeoutMs` 재정의와 `wait --load networkidle`을 지원하지 않고, `responsebody`, PDF 내보내기, 다운로드 가로채기 또는 일괄 작업을 지원하지 않습니다.
- 로컬 `openclaw` 드라이버 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 원격 CDP에만 해당 값을 수동으로 설정하세요.
- 원격 CDP 프로필은 `http://`, `https://`, `ws://`, `wss://`를 허용합니다. `/json/version` 검색에는 HTTP(S)를 사용하고, 브라우저 서비스에서 직접 DevTools 소켓 URL을 제공하는 경우에는 WS(S)를 사용하세요.

## 관련 문서

- [브라우저](/ko/tools/browser)
- [브라우저 로그인](/ko/tools/browser-login)
- [브라우저 WSL2 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
