---
read_when:
    - 시작하기 빠른 시작 가이드 외의 설치 방법이 필요합니다
    - 클라우드 플랫폼에 배포하려는 경우
    - 업데이트, 마이그레이션 또는 제거가 필요합니다
summary: OpenClaw 설치 - 설치 스크립트, npm/pnpm/bun, 소스에서 설치, Docker 등
title: 설치
x-i18n:
    generated_at: "2026-05-07T13:20:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5dc92d262710cc96a160b7cac2b93ee1e25f994ddcd45e274ad96c026b7d72
    source_path: install/index.md
    workflow: 16
---

## 시스템 요구 사항

- **Node 24**(권장) 또는 Node 22.16+ - 설치 스크립트가 이를 자동으로 처리합니다
- **macOS, Linux 또는 Windows** - 네이티브 Windows와 WSL2가 모두 지원되며, WSL2가 더 안정적입니다. [Windows](/ko/platforms/windows)를 참조하세요.
- 소스에서 빌드하는 경우에만 `pnpm`이 필요합니다

## 권장: 설치 스크립트

가장 빠른 설치 방법입니다. OS를 감지하고, 필요한 경우 Node를 설치하며, OpenClaw를 설치한 뒤 온보딩을 시작합니다.

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

### 로컬 prefix 설치 프로그램(`install-cli.sh`)

시스템 전역 Node 설치에 의존하지 않고, OpenClaw와 Node를
`~/.openclaw` 같은 로컬 prefix 아래에 두고 싶을 때 사용하세요.

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

기본적으로 npm 설치를 지원하며, 같은 prefix 흐름에서 git-checkout 설치도
지원합니다. 전체 참조: [설치 프로그램 내부 구조](/ko/install/installer#install-clish).

이미 설치되어 있나요? `openclaw update --channel dev` 및 `openclaw update --channel stable`로 패키지 설치와 git 설치를 전환하세요. [업데이트](/ko/install/updating#switch-between-npm-and-git-installs)를 참조하세요.

### npm, pnpm 또는 bun

Node를 직접 관리하고 있다면:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm은 빌드 스크립트가 있는 패키지에 대해 명시적 승인이 필요합니다. 첫 설치 후 `pnpm approve-builds -g`를 실행하세요.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun은 전역 CLI 설치 경로에서 지원됩니다. Gateway 런타임에는 Node가 여전히 권장되는 데몬 런타임입니다.
    </Note>

  </Tab>
</Tabs>

<Accordion title="문제 해결: sharp 빌드 오류(npm)">
  전역으로 설치된 libvips 때문에 `sharp`가 실패하는 경우:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### 소스에서 설치

기여자 또는 로컬 체크아웃에서 실행하려는 사용자를 위한 방법:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

또는 링크를 건너뛰고 리포지토리 내부에서 `pnpm openclaw ...`를 사용하세요. 전체 개발 워크플로는 [설정](/ko/start/setup)을 참조하세요.

### GitHub main에서 설치

```bash
npm install -g github:openclaw/openclaw#main
```

### 컨테이너 및 패키지 관리자

<CardGroup cols={2}>
  <Card title="Docker" href="/ko/install/docker" icon="container">
    컨테이너화되었거나 헤드리스인 배포.
  </Card>
  <Card title="Podman" href="/ko/install/podman" icon="container">
    Docker를 대체하는 루트리스 컨테이너.
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
- 네이티브 Windows: 먼저 Scheduled Task를 사용하고, 작업 생성이 거부되면 사용자별 Startup 폴더 로그인 항목으로 대체

## 호스팅 및 배포

클라우드 서버 또는 VPS에 OpenClaw를 배포하세요.

<CardGroup cols={3}>
  <Card title="VPS" href="/ko/vps">모든 Linux VPS</Card>
  <Card title="Docker VM" href="/ko/install/docker-vm-runtime">공유 Docker 단계</Card>
  <Card title="Kubernetes" href="/ko/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/ko/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/ko/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/ko/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/ko/install/azure">Azure</Card>
  <Card title="Railway" href="/ko/install/railway">Railway</Card>
  <Card title="Render" href="/ko/install/render">Render</Card>
  <Card title="Northflank" href="/ko/install/northflank">Northflank</Card>
</CardGroup>

## 업데이트, 마이그레이션 또는 제거

<CardGroup cols={3}>
  <Card title="업데이트" href="/ko/install/updating" icon="refresh-cw">
    OpenClaw를 최신 상태로 유지하세요.
  </Card>
  <Card title="마이그레이션" href="/ko/install/migrating" icon="arrow-right">
    새 머신으로 이동하세요.
  </Card>
  <Card title="제거" href="/ko/install/uninstall" icon="trash-2">
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

`$(npm prefix -g)/bin`이 `$PATH`에 없다면, 셸 시작 파일(`~/.zshrc` 또는 `~/.bashrc`)에 추가하세요.

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

그런 다음 새 터미널을 여세요. 자세한 내용은 [Node 설정](/ko/install/node)을 참조하세요.
