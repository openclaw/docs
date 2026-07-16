---
read_when:
    - 시작하기 빠른 시작 가이드 외의 설치 방법이 필요합니다
    - 클라우드 플랫폼에 배포하려고 합니다
    - 업데이트, 마이그레이션 또는 제거해야 합니다
summary: OpenClaw 설치 - 설치 프로그램 스크립트, npm/pnpm/bun, 소스에서 설치, Docker 등
title: 설치
x-i18n:
    generated_at: "2026-07-16T12:46:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## 시스템 요구 사항

- **Node 22.22.3+, 24.15+ 또는 25.9+** - Node 24가 기본 대상이며, 설치 프로그램 스크립트가 이를 자동으로 처리합니다.
- **macOS, Linux 또는 Windows** - Windows 사용자는 네이티브 Windows Hub 앱, PowerShell CLI 설치 프로그램 또는 WSL2 Gateway로 시작할 수 있습니다. [Windows](/ko/platforms/windows)를 참조하십시오.
- `pnpm`은 소스에서 빌드하는 경우에만 필요합니다.

## 권장 방법: 설치 프로그램 스크립트

가장 빠른 설치 방법입니다. OS를 감지하고, 필요한 경우 Node를 설치하며, OpenClaw를 설치한 후 온보딩을 시작합니다.

<Note>
Windows 데스크톱 사용자는 설정, 트레이 상태, 채팅, 노드 모드 및 로컬 MCP 모드가 포함된 네이티브 [Windows Hub](/ko/platforms/windows#recommended-windows-hub) 컴패니언 앱을 설치할 수도 있습니다.
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

온보딩을 실행하지 않고 설치하려면 다음을 사용하십시오.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

모든 플래그 및 CI/자동화 옵션은 [설치 프로그램 내부 구조](/ko/install/installer)를 참조하십시오.

## 대체 설치 방법

### 로컬 접두사 설치 프로그램(`install-cli.sh`)

시스템 전체 Node 설치에 의존하지 않고 OpenClaw와 Node를
`~/.openclaw` 같은 로컬 접두사 아래에 유지하려는 경우 사용하십시오.

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

기본적으로 npm 설치를 지원하며, 동일한 접두사 흐름에서 git 체크아웃 설치도
지원합니다. 전체 참조 문서: [설치 프로그램 내부 구조](/ko/install/installer#install-clish).

이미 설치되어 있습니까? `openclaw update --channel dev` 및 `openclaw update --channel stable`을 사용하여
패키지 설치와 git 설치 간에 전환하십시오. [업데이트](/ko/install/updating#switch-between-npm-and-git-installs)를
참조하십시오.

### npm, pnpm 또는 bun

Node를 직접 관리하고 있다면 다음을 사용하십시오.

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    호스팅된 설치 프로그램은 OpenClaw 패키지를 설치할 때 `min-release-age` 같은
    npm 최신성 필터를 해제합니다. npm으로 수동 설치하는 경우에는 자체
    npm 정책이 계속 적용됩니다.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm에서는 빌드 스크립트가 있는 패키지를 명시적으로 승인해야 합니다. 처음 설치한 후 `pnpm approve-builds -g`을 실행하십시오.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun은 전역 패키지를 설치할 수 있지만 OpenClaw 상태가 `node:sqlite`을 사용하므로, 생성되는 `openclaw` 실행 파일에는 지원되는 Node 런타임이 필요합니다.
    </Note>

  </Tab>
</Tabs>

### 소스에서 설치

기여자 또는 로컬 체크아웃에서 실행하려는 사용자는 다음을 사용하십시오.

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

또는 링크를 생략하고 저장소 내부에서 `pnpm openclaw ...`을 사용하십시오. 전체 개발 워크플로는 [설정](/ko/start/setup)을 참조하십시오.

### GitHub main 체크아웃에서 설치

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### 컨테이너 및 패키지 관리자

<CardGroup cols={2}>
  <Card title="Docker" href="/ko/install/docker" icon="container">
    컨테이너 기반 또는 헤드리스 배포입니다.
  </Card>
  <Card title="Podman" href="/ko/install/podman" icon="container">
    Docker를 대체하는 루트리스 컨테이너입니다.
  </Card>
  <Card title="Nix" href="/ko/install/nix" icon="snowflake">
    Nix flake를 통한 선언적 설치입니다.
  </Card>
  <Card title="Ansible" href="/ko/install/ansible" icon="server">
    자동화된 전체 시스템 프로비저닝입니다.
  </Card>
  <Card title="Bun" href="/ko/install/bun" icon="zap">
    선택적 종속성 설치 프로그램 및 패키지 스크립트 실행기입니다.
  </Card>
</CardGroup>

## 설치 확인

```bash
openclaw --version      # CLI를 사용할 수 있는지 확인
openclaw doctor         # 구성 문제 확인
openclaw gateway status # Gateway가 실행 중인지 확인
```

설치 후 관리형 시작을 사용하려는 경우:

- macOS: `openclaw onboard --install-daemon` 또는 `openclaw gateway install`을 통한 LaunchAgent
- Linux/WSL2: 동일한 명령을 통한 systemd 사용자 서비스
- 네이티브 Windows: 우선 Scheduled Task를 사용하며, 작업 생성이 거부되면 사용자별 Startup 폴더 로그인 항목으로 대체

## 호스팅 및 배포

클라우드 서버 또는 VPS에 OpenClaw를 배포하십시오. 전체 제공업체 선택기
(DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi 등)는 [Linux 서버](/ko/vps)를 참조하거나,
[Render](/ko/install/render)에서 선언적으로 배포하십시오.

<CardGroup cols={3}>
  <Card title="VPS" href="/ko/vps">
    제공업체를 선택합니다.
  </Card>
  <Card title="Docker VM" href="/ko/install/docker-vm-runtime">
    공유 Docker 단계입니다.
  </Card>
  <Card title="Kubernetes" href="/ko/install/kubernetes">
    K8s 배포입니다.
  </Card>
</CardGroup>

## 업데이트, 마이그레이션 또는 제거

<CardGroup cols={3}>
  <Card title="업데이트" href="/ko/install/updating" icon="refresh-cw">
    OpenClaw를 최신 상태로 유지합니다.
  </Card>
  <Card title="마이그레이션" href="/ko/install/migrating" icon="arrow-right">
    새 시스템으로 이동합니다.
  </Card>
  <Card title="제거" href="/ko/install/uninstall" icon="trash-2">
    OpenClaw를 완전히 제거합니다.
  </Card>
</CardGroup>

## 문제 해결: `openclaw`을 찾을 수 없음

거의 항상 PATH 문제입니다. npm의 전역 바이너리 디렉터리가 셸의 `PATH`에 포함되어 있지 않습니다. Windows 경로를 포함한 전체 해결 방법은 [Node.js 문제 해결](/ko/install/node#troubleshooting)을 참조하십시오.

```bash
node -v           # Node가 설치되어 있습니까?
npm prefix -g     # 전역 패키지는 어디에 있습니까?
echo "$PATH"      # 전역 바이너리 디렉터리가 PATH에 있습니까?
```
