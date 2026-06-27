---
read_when:
    - Windows에 OpenClaw 설치하기
    - Windows Hub, 네이티브 Windows, WSL2 중 선택하기
    - Windows 컴패니언 앱 또는 Windows 노드 모드 설정
summary: 'Windows 지원: Windows Hub, 네이티브 CLI 및 Gateway, WSL2 Gateway 설정, node 모드 및 문제 해결'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:41:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw는 기본 **Windows Hub** 컴패니언 앱과 Windows CLI 지원을 함께 제공합니다.
설정, 트레이 상태, 채팅, Command Center 진단, Windows 노드 기능을 갖춘 데스크톱 앱이 필요할 때는 Windows Hub를 사용하세요. CLI/Gateway를 직접 사용하려면 PowerShell
설치 프로그램을 사용하세요. 가장 Linux와 호환성이 높은 Gateway 런타임이 필요할 때는 WSL2를 사용하세요.

## 권장: Windows Hub

Windows Hub는 Windows 10 20H2+ 및 Windows 11용 네이티브 WinUI 컴패니언 앱입니다. 관리자 권한 없이 설치되며 OpenClaw 릴리스에서 서명된
x64 및 ARM64 설치 프로그램으로 제공됩니다.

[OpenClaw 릴리스 페이지](https://github.com/openclaw/openclaw/releases)에서 최신 안정 설치 프로그램을 다운로드하세요.

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [체크섬](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

위 다운로드 링크가 404를 반환하면 [릴리스 페이지](https://github.com/openclaw/openclaw/releases)를 방문하여 최신 릴리스의 `OpenClawCompanion-Setup-*` 자산을 찾으세요.

설치 후 시작 메뉴 또는 시스템 트레이에서 **OpenClaw Companion**을 실행하세요. 설치 프로그램은 Gateway 설정, 채팅, 설정,
업데이트 확인 및 제거 바로가기도 추가합니다.

### Windows Hub에 포함된 항목

- 시스템 트레이 상태 및 로그인 시 실행
- 로컬 앱 소유 WSL Gateway를 위한 첫 실행 설정
- 로컬, 원격, SSH 터널링된 Gateway에 대한 연결 설정
- 네이티브 채팅 창 및 브라우저 Control UI 접근
- 세션, 사용량, 채널, 노드, 페어링 및 복구 명령을 위한 Command Center 진단
- 에이전트 제어 캔버스, 화면, 카메라, 알림,
  기기 상태, 텍스트 음성 변환, 음성 텍스트 변환, 제어된 `system.run`을 위한 Windows 노드 모드
- Claude Desktop, Claude Code, Cursor 같은 MCP 클라이언트를 위한 local MCP 서버 모드

### 첫 실행

첫 실행 시 사용 가능한 저장된 Gateway가 없으면 Windows Hub가 설정을 엽니다.
가장 빠른 경로는 **로컬로 설정**이며, 앱 소유
`OpenClawGateway` WSL 배포판을 프로비저닝하고 그 안에 Gateway를 설치한 다음 앱을 페어링합니다.
이는 기존 Ubuntu 배포판을 내보내거나 변경하지 않습니다.

이미 Gateway가 있는 경우 **고급 설정**을 선택하거나 연결 탭을 여세요. 다음에 연결할 수 있습니다.

- 이 PC의 로컬 Gateway
- 이 PC의 WSL Gateway
- URL 및 토큰 또는 설정 코드로 연결하는 원격 Gateway
- SSH 터널을 통해 도달하는 Gateway

설정이 완료되면 트레이 아이콘이 녹색으로 바뀝니다. 트레이에서 **Command Center**를 열어
연결, 페어링, 노드 상태 및 채널 상태를 확인하세요.

## Windows 노드 모드

Windows Hub는 1급 OpenClaw 노드로 등록될 수 있습니다. 그러면 에이전트가 Gateway를 통해
선언된 Windows 네이티브 기능을 사용할 수 있습니다.

일반적인 명령은 다음과 같습니다.

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` 및 명시적으로 옵트인한 경우 `screen.record`
- `camera.list` 및 명시적으로 옵트인한 경우 `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

노드 모드에는 Gateway 페어링이 필요합니다. 앱에 페어링 요청이 표시되면 Gateway 호스트에서
승인하세요.

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway는 노드가 선언하고 서버 정책이 허용하는 명령만 전달합니다.
`screen.record`, `camera.snap`, `camera.clip` 같은 개인정보에 민감한 명령은 명시적인 `gateway.nodes.allowCommands` 옵트인이 필요합니다.

## local MCP 모드

Windows Hub는 동일한 Windows 네이티브 기능 레지스트리를 루프백의 local
MCP 서버로 노출할 수 있습니다. 이는 실행 중인 OpenClaw Gateway 없이 local MCP 클라이언트가
Windows 기능을 구동하게 하려는 경우에 유용합니다.

Windows Hub 설정의 개발자/고급 섹션에서 활성화하세요. 서버가 활성화되면 앱이
루프백 엔드포인트와 전달자 토큰을 표시합니다.

모드 매트릭스:

| 노드 모드 | MCP 서버 | 동작                               |
| --------- | -------- | ---------------------------------- |
| 꺼짐      | 꺼짐     | 운영자 전용 데스크톱 앱            |
| 켜짐      | 꺼짐     | Gateway에 연결된 Windows 노드      |
| 꺼짐      | 켜짐     | Local MCP 서버만                   |
| 켜짐      | 켜짐     | Gateway 노드 및 local MCP 서버     |

## 네이티브 Windows CLI 및 Gateway

터미널 우선 사용을 위해 PowerShell에서 OpenClaw를 설치하세요.

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

확인:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

네이티브 Windows CLI 및 Gateway 흐름은 지원되며 계속 개선되고 있습니다.
관리형 시작은 사용 가능한 경우 Windows 예약 작업을 사용합니다. 작업은 OpenClaw 상태 디렉터리에
읽을 수 있는 `gateway.cmd` 스크립트를 유지하지만, 생성된 `gateway.vbs` WScript 래퍼를 통해 실행하여
백그라운드 Gateway가 보이는 콘솔 창을 열지 않도록 합니다. 작업 생성이 거부되면 OpenClaw는
사용자별 시작 폴더 로그인 항목으로 대체합니다.

Gateway 서비스를 설치하려면:

```powershell
openclaw gateway install
openclaw gateway status --json
```

관리형 Gateway 서비스 없이 CLI만 사용하려면:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2는 Windows에서 가장 Linux와 호환성이 높은 Gateway 런타임으로 남아 있습니다. Windows Hub가
앱 소유 WSL Gateway를 설정해 줄 수 있으며, 사용자가 직접 자신의 배포판 안에 수동으로 설치할 수도 있습니다.

수동 설정:

```powershell
wsl --install
# 또는 배포판을 명시적으로 선택:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

WSL 안에서 systemd를 활성화하세요.

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

PowerShell에서 WSL을 다시 시작하세요.

```powershell
wsl --shutdown
```

그런 다음 Linux 빠른 시작으로 WSL 안에 OpenClaw를 설치하세요.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows 로그인 전 Gateway 자동 시작

헤드리스 WSL 설정의 경우 아무도 Windows에 로그인하지 않아도 전체 부팅 체인이 실행되도록 하세요.

WSL 안에서:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

관리자 권한 PowerShell에서:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

`Ubuntu`를 다음에서 확인한 배포판 이름으로 바꾸세요.

```powershell
wsl --list --verbose
```

> **참고:** 이전 레시피와 다른 두 가지 변경 사항:
>
> - **`/bin/true` 대신 `dbus-launch true`** — WSL ≥ 2.6.1.0에서 회귀([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))로 인해 linger가 활성화되어 있어도 마지막 클라이언트가 종료된 뒤 15~20초 후 배포판이 유휴 종료됩니다. `dbus-launch true`는 우회 방법으로 init의 자식 프로세스를 살아 있게 유지합니다([커뮤니티 논의, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru SYSTEM` 대신 `/ru "$env:USERNAME"`** — 사용자별 WSL 배포판(기본 설정)은 SYSTEM 계정에 보이지 않습니다. 작업은 실행되는 것처럼 보이지만 배포판은 시작되지 않습니다. 자신의 계정으로 실행하면 이를 피할 수 있습니다. Windows는 작업 생성 시 암호를 요청합니다.

재부팅 후 WSL에서 확인하세요.

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## LAN을 통해 WSL 서비스 노출

WSL은 자체 가상 네트워크를 가집니다. 다른 머신이 WSL 안의 서비스에 도달해야 하는 경우
Windows 포트를 현재 WSL IP로 포워딩하세요. WSL IP는 다시 시작 후 변경될 수 있으므로
필요할 때 포워딩 규칙을 새로 고치세요.

관리자 권한 PowerShell 예시:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

참고:

- 다른 머신에서 SSH는 Windows 호스트 IP를 대상으로 합니다. 예:
  `ssh user@windows-host -p 2222`.
- 원격 노드는 `127.0.0.1`이 아니라 도달 가능한 Gateway URL을 가리켜야 합니다.
- LAN 접근에는 `listenaddress=0.0.0.0`을 사용하세요. 로컬 전용
  접근에는 `127.0.0.1`을 사용하세요.

## 문제 해결

### 트레이 아이콘이 나타나지 않음

작업 관리자에서 `OpenClaw.Tray.WinUI.exe`를 확인하세요. 실행 중이면
숨겨진 트레이 아이콘 영역을 열어 고정하세요. 실행 중이 아니면 시작 메뉴에서 **OpenClaw
Companion**을 실행하세요.

### 로컬 설정 실패

Windows Hub에서 설정 로그를 열거나 다음을 확인하세요.

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

일반적인 원인은 비활성화된 WSL, 차단된 가상화, 오래된 앱 소유 WSL
상태, 또는 Gateway 패키지 설치 중 네트워크 실패입니다.

### 앱에서 페어링이 필요하다고 표시됨

Gateway에서 운영자 또는 노드 요청을 승인하세요.

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

기기에 이미 토큰이 있었다면 승인 후 연결 탭에서 다시 연결하세요.

### 웹 채팅이 원격 Gateway에 도달할 수 없음

원격 웹 채팅에는 HTTPS 또는 localhost가 필요합니다. 자체 서명 인증서의 경우
Windows에서 인증서를 신뢰하도록 설정하거나, localhost URL로 SSH 터널을 사용하세요.

### `screen.snapshot`, 카메라 또는 오디오 명령 실패

카메라, 마이크, 화면 캡처 및 알림에 대한 Windows 권한을 확인하세요. 패키징된 설치는 보호된 기능을 선언하지만,
명령이 처음 사용할 때 Windows가 여전히 프롬프트를 표시할 수 있습니다.

### Git 또는 GitHub 연결 실패

일부 네트워크는 GitHub로 가는 HTTPS를 차단하거나 제한합니다. `git clone` 또는 `gh auth
login`이 실패하면 다른 네트워크, VPN 또는 HTTP/HTTPS 프록시를 시도하세요.

현재 세션에서 토큰 기반 `gh` 인증을 사용하려면:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

토큰을 절대 커밋하거나 이슈 또는 풀 리퀘스트에 붙여넣지 마세요.

## 관련 항목

- [설치 개요](/ko/install)
- [Node.js 설정](/ko/install/node)
- [노드](/ko/nodes)
- [Control UI](/ko/web/control-ui)
- [Gateway 구성](/ko/gateway/configuration)
