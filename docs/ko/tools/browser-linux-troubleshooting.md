---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux에서 OpenClaw 브라우저 제어를 위한 Chrome/Brave/Edge/Chromium CDP 시작 문제 해결
title: 브라우저 문제 해결
x-i18n:
    generated_at: "2026-04-26T11:39:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## 문제: "Failed to start Chrome CDP on port 18800"

OpenClaw의 브라우저 제어 서버가 다음 오류와 함께 Chrome/Brave/Edge/Chromium 실행에 실패합니다:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 근본 원인

Ubuntu(및 많은 Linux 배포판)에서는 기본 Chromium 설치가 **snap 패키지**입니다.
Snap의 AppArmor 격리는 OpenClaw가 브라우저 프로세스를 생성하고 모니터링하는 방식과 충돌합니다.

`apt install chromium` 명령은 snap으로 리디렉션하는 스텁 패키지를 설치합니다:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

이것은 실제 브라우저가 아니라 단지 래퍼입니다.

그 밖의 일반적인 Linux 실행 실패:

- `The profile appears to be in use by another Chromium process`는 Chrome이
  관리되는 프로필 디렉터리에서 오래된 `Singleton*` 잠금 파일을 발견했다는 뜻입니다. OpenClaw는
  잠금이 종료되었거나 다른 호스트의 프로세스를 가리키는 경우 해당 잠금을 제거하고
  한 번 재시도합니다.
- `Missing X server or $DISPLAY`는 데스크톱 세션이 없는 호스트에서
  표시 가능한 브라우저가 명시적으로 요청되었다는 뜻입니다. 기본적으로 Linux의 로컬 관리형
  프로필은 `DISPLAY`와 `WAYLAND_DISPLAY`가 모두 설정되지 않은 경우 이제
  headless 모드로 폴백합니다. `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false`, 또는 `browser.profiles.<name>.headless: false`를 설정한 경우,
  해당 headed 재정의를 제거하거나, `OPENCLAW_BROWSER_HEADLESS=1`을 설정하거나, `Xvfb`를 시작하거나,
  일회성 관리형 실행을 위해 `openclaw browser start --headless`를 실행하거나,
  실제 데스크톱 세션에서 OpenClaw를 실행하세요.

### 해결 방법 1: Google Chrome 설치(권장)

snap으로 샌드박싱되지 않는 공식 Google Chrome `.deb` 패키지를 설치하세요:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 의존성 오류가 있는 경우
```

그런 다음 OpenClaw 구성(`~/.openclaw/openclaw.json`)을 업데이트하세요:

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

### 해결 방법 2: Snap Chromium을 attach-only 모드로 사용

반드시 snap Chromium을 사용해야 한다면, 수동으로 시작한 브라우저에 OpenClaw가 연결하도록 구성하세요:

1. 구성 업데이트:

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

2. Chromium 수동 시작:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 선택 사항: Chrome 자동 시작용 systemd 사용자 서비스 생성:

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

다음으로 활성화: `systemctl --user enable --now openclaw-browser.service`

### 브라우저가 작동하는지 확인하기

상태 확인:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

브라우징 테스트:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 구성 참조

| 옵션 | 설명 | 기본값 |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled` | 브라우저 제어 활성화 | `true` |
| `browser.executablePath` | Chromium 기반 브라우저 바이너리 경로(Chrome/Brave/Edge/Chromium) | 자동 감지(Chromium 기반이면 기본 브라우저 우선) |
| `browser.headless` | GUI 없이 실행 | `false` |
| `OPENCLAW_BROWSER_HEADLESS` | 로컬 관리형 브라우저 headless 모드에 대한 프로세스별 재정의 | 설정되지 않음 |
| `browser.noSandbox` | `--no-sandbox` 플래그 추가(일부 Linux 설정에 필요) | `false` |
| `browser.attachOnly` | 브라우저를 실행하지 않고 기존 브라우저에만 연결 | `false` |
| `browser.cdpPort` | Chrome DevTools Protocol 포트 | `18800` |
| `browser.localLaunchTimeoutMs` | 로컬 관리형 Chrome 검색 타임아웃 | `15000` |
| `browser.localCdpReadyTimeoutMs` | 로컬 관리형 실행 후 CDP 준비 타임아웃 | `8000` |

Raspberry Pi, 오래된 VPS 호스트 또는 느린 스토리지에서는
Chrome이 CDP HTTP 엔드포인트를 노출하는 데 더 많은 시간이 필요할 경우
`browser.localLaunchTimeoutMs`를 높이세요. 실행은 성공했지만
`openclaw browser start`가 계속 `not reachable after start`를 보고하는 경우에는
`browser.localCdpReadyTimeoutMs`를 높이세요. 값은 `120000`ms 이하의 양의 정수여야 하며,
유효하지 않은 구성 값은 거부됩니다.

### 문제: "No Chrome tabs found for profile=\"user\""

`existing-session` / Chrome MCP 프로필을 사용 중입니다. OpenClaw가 로컬 Chrome은 볼 수 있지만,
연결할 수 있는 열린 탭이 없습니다.

해결 방법:

1. **관리형 브라우저 사용:** `openclaw browser start --browser-profile openclaw`
   (또는 `browser.defaultProfile: "openclaw"` 설정)
2. **Chrome MCP 사용:** 로컬 Chrome이 최소 하나의 열린 탭과 함께 실행 중인지 확인한 다음 `--browser-profile user`로 다시 시도하세요.

참고:

- `user`는 호스트 전용입니다. Linux 서버, 컨테이너 또는 원격 호스트에서는 CDP 프로필을 우선 사용하세요.
- `user` / 기타 `existing-session` 프로필은 현재 Chrome MCP 제한을 유지합니다:
  ref 기반 작업, 단일 파일 업로드 훅, dialog 타임아웃 재정의 없음,
  `wait --load networkidle` 없음, 그리고 `responsebody`, PDF 내보내기, 다운로드
  가로채기, 일괄 작업 없음.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 원격 CDP에만 이 값을 설정하세요.
- 원격 CDP 프로필은 `http://`, `https://`, `ws://`, `wss://`를 지원합니다.
  `/json/version` 검색에는 HTTP(S)를 사용하고, 브라우저
  서비스가 직접 DevTools 소켓 URL을 제공하는 경우에는 WS(S)를 사용하세요.

## 관련 항목

- [Browser](/ko/tools/browser)
- [Browser login](/ko/tools/browser-login)
- [Browser WSL2 troubleshooting](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
