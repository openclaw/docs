---
read_when:
    - 시작하기 빠른 시작 외의 설치 방법이 필요합니다
    - 클라우드 플랫폼에 배포하려는 경우
    - 업데이트, 마이그레이션 또는 제거가 필요합니다
summary: OpenClaw 설치 - 설치 스크립트, npm/pnpm/bun, 소스에서 설치, Docker 등
title: 설치
x-i18n:
    generated_at: "2026-06-27T17:36:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## 시스템 요구 사항

- **Node 24**(권장) 또는 Node 22.19+ - 설치 스크립트가 이를 자동으로 처리합니다
- **macOS, Linux 또는 Windows** - Windows 사용자는 네이티브 Windows Hub 앱, PowerShell CLI 설치 프로그램 또는 WSL2 Gateway로 시작할 수 있습니다. [Windows](/ko/platforms/windows)를 참조하세요.
- `pnpm`은 소스에서 빌드하는 경우에만 필요합니다

## 권장: 설치 스크립트

가장 빠른 설치 방법입니다. OS를 감지하고, 필요한 경우 Node를 설치하며, OpenClaw를 설치하고 온보딩을 시작합니다.

<Note>
Windows 데스크톱 사용자는 설정, 트레이 상태, 채팅, 노드 모드, 로컬 MCP 모드가 포함된 네이티브 [Windows Hub](/ko/platforms/windows#recommended-windows-hub) 컴패니언 앱도 설치할 수 있습니다.
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

온보딩을 실행하지 않고 설치하려면:

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

모든 플래그와 CI/자동화 옵션은 [설치 프로그램 내부 구조](/ko/install/installer)를 참조하세요.

## 대체 설치 방법

### 로컬 접두사 설치 프로그램(`install-cli.sh`)

시스템 전체 Node 설치에 의존하지 않고 OpenClaw와 Node를 `~/.openclaw` 같은 로컬 접두사 아래에 유지하려는 경우 사용하세요.

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

기본적으로 npm 설치를 지원하며, 같은 접두사 흐름에서 git-checkout 설치도 지원합니다. 전체 참조: [설치 프로그램 내부 구조](/ko/install/installer#install-clish).

이미 설치했나요? `openclaw update --channel dev` 및 `openclaw update --channel stable`로 패키지 설치와 git 설치 사이를 전환하세요. [업데이트](/ko/install/updating#switch-between-npm-and-git-installs)를 참조하세요.

### npm, pnpm 또는 bun

이미 Node를 직접 관리하고 있다면:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    호스팅된 설치 프로그램은 OpenClaw 패키지 설치에 대해 `min-release-age` 같은 npm 최신성 필터를 해제합니다. npm으로 수동 설치하는 경우에는 자체 npm 정책이 계속 적용됩니다.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm은 빌드 스크립트가 있는 패키지에 명시적 승인을 요구합니다. 첫 설치 후 `pnpm approve-builds -g`를 실행하세요.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun은 전역 CLI 설치 경로에서 지원됩니다. Gateway 런타임에는 Node가 계속 권장 데몬 런타임입니다.
    </Note>

  </Tab>
</Tabs>

### 소스에서 설치

기여자 또는 로컬 체크아웃에서 실행하려는 사용자는 다음을 사용하세요.

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

또는 링크를 건너뛰고 저장소 안에서 `pnpm openclaw ...`를 사용하세요. 전체 개발 워크플로는 [설정](/ko/start/setup)을 참조하세요.

### GitHub main 체크아웃에서 설치

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### 컨테이너와 패키지 관리자

<CardGroup cols={2}>
  <Card title="Docker" href="/ko/install/docker" icon="container">
    컨테이너화된 또는 헤드리스 배포.
  </Card>
  <Card title="Podman" href="/ko/install/podman" icon="container">
    Docker의 루트리스 컨테이너 대안.
  </Card>
  <Card title="Nix" href="/ko/install/nix" icon="snowflake">
    Nix flake를 통한 선언적 설치.
  </Card>
  <Card title="Ansible" href="/ko/install/ansible" icon="server">
    자동화된 플릿 프로비저닝.
  </Card>
  <Card title="Bun" href="/ko/install/bun" icon="zap">
    Bun 런타임을 통한 CLI 전용 사용.
  </Card>
</CardGroup>

## 설치 확인

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

설치 후 관리형 시작을 원한다면:

- macOS: `openclaw onboard --install-daemon` 또는 `openclaw gateway install`을 통한 LaunchAgent
- Linux/WSL2: 같은 명령을 통한 systemd 사용자 서비스
- 네이티브 Windows: 먼저 예약된 작업을 사용하고, 작업 생성이 거부되면 사용자별 시작 폴더 로그인 항목으로 대체

## 호스팅 및 배포

클라우드 서버 또는 VPS에 OpenClaw를 배포하세요.

<CardGroup cols={3}>
  <Card title="VPS" href="/ko/vps">
    모든 Linux VPS.
  </Card>
  <Card title="Docker VM" href="/ko/install/docker-vm-runtime">
    공유 Docker 단계.
  </Card>
  <Card title="Kubernetes" href="/ko/install/kubernetes">
    K8s 배포.
  </Card>
  <Card title="Fly.io" href="/ko/install/fly">
    Fly.io에 배포.
  </Card>
  <Card title="Hetzner" href="/ko/install/hetzner">
    Hetzner 배포.
  </Card>
  <Card title="GCP" href="/ko/install/gcp">
    Google Cloud 배포.
  </Card>
  <Card title="Azure" href="/ko/install/azure">
    Azure 배포.
  </Card>
  <Card title="Railway" href="/ko/install/railway">
    Railway 배포.
  </Card>
  <Card title="Render" href="/ko/install/render">
    Render 배포.
  </Card>
  <Card title="Northflank" href="/ko/install/northflank">
    Northflank 배포.
  </Card>
</CardGroup>

## 업데이트, 마이그레이션 또는 제거

<CardGroup cols={3}>
  <Card title="Updating" href="/ko/install/updating" icon="refresh-cw">
    OpenClaw를 최신 상태로 유지하세요.
  </Card>
  <Card title="Migrating" href="/ko/install/migrating" icon="arrow-right">
    새 머신으로 이동하세요.
  </Card>
  <Card title="Uninstall" href="/ko/install/uninstall" icon="trash-2">
    OpenClaw를 완전히 제거하세요.
  </Card>
</CardGroup>

## 문제 해결: `openclaw`를 찾을 수 없음

설치가 성공했지만 터미널에서 `openclaw`를 찾을 수 없다면:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

`$(npm prefix -g)/bin`이 `$PATH`에 없다면 셸 시작 파일(`~/.zshrc` 또는 `~/.bashrc`)에 추가하세요.

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

그런 다음 새 터미널을 여세요. 자세한 내용은 [Node 설정](/ko/install/node)을 참조하세요.
