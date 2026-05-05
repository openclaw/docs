---
read_when:
    - Windows에 OpenClaw 설치하기
    - 네이티브 Windows와 WSL2 중 선택하기
    - Windows 컴패니언 앱 상태 확인 중
summary: 'Windows 지원: 네이티브 및 WSL2 설치 경로, 데몬, 현재 유의 사항'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:08:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw는 **네이티브 Windows**와 **WSL2**를 모두 지원합니다. WSL2가 더
안정적인 경로이며 전체 경험에 권장됩니다. CLI, Gateway, 도구가 Linux 내부에서
완전한 호환성으로 실행됩니다. 네이티브 Windows는 핵심 CLI와 Gateway 사용에
동작하지만, 아래에 몇 가지 주의 사항이 있습니다.

네이티브 Windows 컴패니언 앱은 계획되어 있습니다.

## WSL2(권장)

- [시작하기](/ko/start/getting-started) (WSL 내부에서 사용)
- [설치 및 업데이트](/ko/install/updating)
- 공식 WSL2 가이드(Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## 네이티브 Windows 상태

네이티브 Windows CLI 흐름은 개선되고 있지만, 여전히 WSL2가 권장 경로입니다.

현재 네이티브 Windows에서 잘 동작하는 것:

- `install.ps1`을 통한 웹사이트 설치 프로그램
- `openclaw --version`, `openclaw doctor`, `openclaw plugins list --json` 같은 로컬 CLI 사용
- 다음과 같은 내장 local-agent/provider 스모크 테스트:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

현재 주의 사항:

- `openclaw onboard --non-interactive`는 `--skip-health`를 전달하지 않는 한 여전히 연결 가능한 로컬 Gateway를 기대합니다
- `openclaw onboard --non-interactive --install-daemon`과 `openclaw gateway install`은 먼저 Windows 예약 작업을 시도합니다
- 예약 작업 생성이 거부되면 OpenClaw는 사용자별 Startup 폴더 로그인 항목으로 대체하고 즉시 Gateway를 시작합니다
- `schtasks` 자체가 멈추거나 응답하지 않으면 이제 OpenClaw는 해당 경로를 빠르게 중단하고 영원히 멈추는 대신 대체 경로로 전환합니다
- 예약 작업은 더 나은 감독자 상태를 제공하므로 사용 가능할 때는 여전히 선호됩니다

Gateway 서비스 설치 없이 네이티브 CLI만 원한다면 다음 중 하나를 사용하세요.

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

네이티브 Windows에서 관리형 시작을 원한다면:

```powershell
openclaw gateway install
openclaw gateway status --json
```

예약 작업 생성이 차단되더라도 대체 서비스 모드는 현재 사용자의 Startup 폴더를 통해 로그인 후 자동 시작됩니다.

## Gateway

- [Gateway 운영 안내서](/ko/gateway)
- [구성](/ko/gateway/configuration)

## Gateway 서비스 설치(CLI)

WSL2 내부에서:

```
openclaw onboard --install-daemon
```

또는:

```
openclaw gateway install
```

또는:

```
openclaw configure
```

프롬프트가 표시되면 **Gateway 서비스**를 선택하세요.

복구/마이그레이션:

```
openclaw doctor
```

## Windows 로그인 전 Gateway 자동 시작

헤드리스 설정의 경우 아무도 Windows에 로그인하지 않아도 전체 부팅 체인이 실행되도록 하세요.

### 1) 로그인 없이 사용자 서비스 계속 실행

WSL 내부에서:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw Gateway 사용자 서비스 설치

WSL 내부에서:

```bash
openclaw gateway install
```

### 3) Windows 부팅 시 WSL 자동 시작

관리자 권한 PowerShell에서:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu`를 다음에서 확인한 배포판 이름으로 바꾸세요.

```powershell
wsl --list --verbose
```

### 시작 체인 확인

재부팅 후(Windows 로그인 전) WSL에서 확인하세요.

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 고급: LAN을 통해 WSL 서비스 노출(portproxy)

WSL에는 자체 가상 네트워크가 있습니다. 다른 머신이 **WSL 내부**에서 실행 중인
서비스(SSH, 로컬 TTS 서버 또는 Gateway)에 접근해야 한다면 Windows 포트를 현재
WSL IP로 전달해야 합니다. WSL IP는 재시작 후 변경되므로 전달 규칙을 새로 고쳐야
할 수 있습니다.

예시(관리자 권한 **PowerShell**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Windows Firewall을 통해 포트를 허용하세요(한 번만).

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL 재시작 후 portproxy를 새로 고치세요.

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

참고:

- 다른 머신에서의 SSH는 **Windows 호스트 IP**를 대상으로 합니다(예: `ssh user@windows-host -p 2222`).
- 원격 노드는 **도달 가능한** Gateway URL을 가리켜야 합니다(`127.0.0.1` 아님). 확인하려면
  `openclaw status --all`을 사용하세요.
- LAN 접근에는 `listenaddress=0.0.0.0`을 사용하세요. `127.0.0.1`은 로컬로만 유지합니다.
- 이를 자동화하려면 로그인 시 새로 고침 단계를 실행하도록 예약 작업을 등록하세요.

## 단계별 WSL2 설치

### 1) WSL2 + Ubuntu 설치

PowerShell을 여세요(관리자).

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows가 요청하면 재부팅하세요.

### 2) systemd 활성화(Gateway 설치에 필요)

WSL 터미널에서:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

그런 다음 PowerShell에서:

```powershell
wsl --shutdown
```

Ubuntu를 다시 열고 확인하세요.

```bash
systemctl --user status
```

### 3) OpenClaw 설치(WSL 내부)

WSL 내부에서 일반적인 최초 설정을 하려면 Linux 시작하기 흐름을 따르세요.

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

최초 온보딩 대신 소스에서 개발하는 경우 [설정](/ko/start/setup)의 소스 개발 루프를
사용하세요.

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

전체 가이드: [시작하기](/ko/start/getting-started)

## Windows 컴패니언 앱

아직 Windows 컴패니언 앱은 없습니다. 구현을 돕고 싶다면 기여를 환영합니다.

## Git 및 GitHub 연결(기여자)

일부 네트워크는 GitHub로의 HTTPS를 차단하거나 제한합니다. `git clone`이 시간 초과나
연결 재설정으로 실패하면 다른 네트워크, VPN 또는 조직에서 제공하는 HTTP/HTTPS
프록시를 시도하세요.

브라우저 디바이스 흐름 중 `gh auth login`이 실패하면(예: `github.com:443`에 도달하는
시간 초과) 대신 개인 액세스 토큰으로 인증하세요.

1. 최소한 `repo` 범위(클래식 PAT) 또는 동등한 세분화된 액세스 권한이 있는 토큰을 만드세요.
2. 현재 세션의 PowerShell에서:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. `gh auth status`가 누락된 `read:org`에 대해 경고하면 해당 범위를 포함하는 토큰을 만들고 변수를 다시 할당하세요.

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org`는 `gh auth login`으로 인증했고 새로 고칠 저장된 자격 증명이
있는 경우에만 적용됩니다(`GH_TOKEN` 사용 시에는 해당하지 않음).

토큰을 커밋하거나 이슈 또는 풀 리퀘스트에 붙여넣지 마세요.

## 관련 항목

- [설치 개요](/ko/install)
- [플랫폼](/ko/platforms)
