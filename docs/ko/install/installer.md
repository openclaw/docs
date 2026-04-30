---
read_when:
    - '`openclaw.ai/install.sh`을 이해하고 싶습니다'
    - 설치를 자동화하려는 경우(CI / 헤드리스)
    - GitHub 체크아웃에서 설치하려는 경우
summary: 설치 스크립트 작동 방식(install.sh, install-cli.sh, install.ps1), 플래그 및 자동화
title: 설치 관리자 내부 구조
x-i18n:
    generated_at: "2026-04-30T06:37:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw는 `openclaw.ai`에서 제공되는 세 가지 설치 스크립트를 제공합니다.

| 스크립트                           | 플랫폼              | 수행 작업                                                                                                       |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 필요한 경우 Node를 설치하고, npm(기본값) 또는 git으로 OpenClaw를 설치하며, 온보딩을 실행할 수 있습니다.        |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm 또는 git 체크아웃 모드로 Node + OpenClaw를 로컬 prefix(`~/.openclaw`)에 설치합니다. root가 필요 없습니다. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 필요한 경우 Node를 설치하고, npm(기본값) 또는 git으로 OpenClaw를 설치하며, 온보딩을 실행할 수 있습니다.        |

## 빠른 명령

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
설치가 성공했지만 새 터미널에서 `openclaw`를 찾을 수 없다면 [Node.js 문제 해결](/ko/install/node#troubleshooting)을 참조하세요.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL에서 대부분의 대화형 설치에 권장됩니다.
</Tip>

### 흐름(install.sh)

<Steps>
  <Step title="Detect OS">
    macOS 및 Linux(WSL 포함)를 지원합니다. macOS가 감지되면 Homebrew가 없는 경우 설치합니다.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Node 버전을 확인하고 필요한 경우 Node 24를 설치합니다(macOS에서는 Homebrew, Linux apt/dnf/yum에서는 NodeSource 설정 스크립트). OpenClaw는 호환성을 위해 현재 `22.14+`인 Node 22 LTS도 계속 지원합니다.
  </Step>
  <Step title="Ensure Git">
    Git이 없으면 설치합니다.
  </Step>
  <Step title="Install OpenClaw">
    - `npm` 방식(기본값): 전역 npm 설치
    - `git` 방식: 저장소를 clone/update하고, pnpm으로 의존성을 설치하고, 빌드한 다음 `~/.local/bin/openclaw`에 wrapper를 설치합니다.

  </Step>
  <Step title="Post-install tasks">
    - 로드된 gateway 서비스를 최선의 노력으로 새로 고칩니다(`openclaw gateway install --force`, 그다음 재시작).
    - 업그레이드 및 git 설치에서 `openclaw doctor --non-interactive`를 실행합니다(최선의 노력).
    - 적절한 경우 온보딩을 시도합니다(TTY 사용 가능, 온보딩이 비활성화되지 않음, bootstrap/config 검사 통과).
    - 기본값으로 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`을 설정합니다.

  </Step>
</Steps>

### 소스 체크아웃 감지

OpenClaw 체크아웃(`package.json` + `pnpm-workspace.yaml`) 안에서 실행하면 스크립트가 다음을 제안합니다.

- 체크아웃 사용(`git`), 또는
- 전역 설치 사용(`npm`)

TTY를 사용할 수 없고 설치 방식이 설정되지 않은 경우 기본값은 `npm`이며 경고를 표시합니다.

잘못된 방식 선택 또는 잘못된 `--install-method` 값의 경우 스크립트는 코드 `2`로 종료됩니다.

### 예시(install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| 플래그                                | 설명                                                         |
| ------------------------------------- | ------------------------------------------------------------ |
| `--install-method npm\|git`           | 설치 방식을 선택합니다(기본값: `npm`). 별칭: `--method`     |
| `--npm`                               | npm 방식 바로가기                                           |
| `--git`                               | git 방식 바로가기. 별칭: `--github`                         |
| `--version <version\|dist-tag\|spec>` | npm 버전, dist-tag 또는 패키지 spec(기본값: `latest`)        |
| `--beta`                              | 사용 가능한 경우 beta dist-tag를 사용하고, 아니면 `latest`로 fallback합니다 |
| `--git-dir <path>`                    | 체크아웃 디렉터리(기본값: `~/openclaw`). 별칭: `--dir`      |
| `--no-git-update`                     | 기존 체크아웃에 대해 `git pull`을 건너뜁니다                |
| `--no-prompt`                         | 프롬프트를 비활성화합니다                                   |
| `--no-onboard`                        | 온보딩을 건너뜁니다                                         |
| `--onboard`                           | 온보딩을 활성화합니다                                       |
| `--dry-run`                           | 변경 사항을 적용하지 않고 작업을 출력합니다                 |
| `--verbose`                           | 디버그 출력을 활성화합니다(`set -x`, npm notice-level 로그) |
| `--help`                              | 사용법을 표시합니다(`-h`)                                   |

  </Accordion>

  <Accordion title="Environment variables reference">

| 변수                                                    | 설명                                         |
| ------------------------------------------------------- | -------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | 설치 방식                                    |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm 버전, dist-tag 또는 패키지 spec          |
| `OPENCLAW_BETA=0\|1`                                    | 사용 가능한 경우 beta 사용                   |
| `OPENCLAW_GIT_DIR=<path>`                               | 체크아웃 디렉터리                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git 업데이트 전환                            |
| `OPENCLAW_NO_PROMPT=1`                                  | 프롬프트 비활성화                            |
| `OPENCLAW_NO_ONBOARD=1`                                 | 온보딩 건너뛰기                              |
| `OPENCLAW_DRY_RUN=1`                                    | dry run 모드                                 |
| `OPENCLAW_VERBOSE=1`                                    | 디버그 모드                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm 로그 수준                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips 동작 제어(기본값: `1`)         |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
모든 것을 로컬 prefix(기본값 `~/.openclaw`) 아래에 두고 시스템 Node 의존성이 필요 없는 환경을 위해 설계되었습니다. 기본적으로 npm 설치를 지원하며, 동일한 prefix 흐름에서 git-checkout 설치도 지원합니다.
</Info>

### 흐름(install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    고정된 지원 Node LTS tarball(버전은 스크립트에 내장되어 있으며 독립적으로 업데이트됨)을 `<prefix>/tools/node-v<version>`에 다운로드하고 SHA-256을 검증합니다.
  </Step>
  <Step title="Ensure Git">
    Git이 없으면 Linux에서는 apt/dnf/yum을 통해, macOS에서는 Homebrew를 통해 설치를 시도합니다.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm` 방식(기본값): npm으로 prefix 아래에 설치한 다음 `<prefix>/bin/openclaw`에 wrapper를 작성합니다.
    - `git` 방식: 체크아웃(기본값 `~/openclaw`)을 clone/update하고 여전히 `<prefix>/bin/openclaw`에 wrapper를 작성합니다.

  </Step>
  <Step title="Refresh loaded gateway service">
    gateway 서비스가 이미 같은 prefix에서 로드되어 있으면 스크립트는
    `openclaw gateway install --force`, 그다음 `openclaw gateway restart`를 실행하고
    최선의 노력으로 gateway 상태를 probe합니다.
  </Step>
</Steps>

### 예시(install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| 플래그                      | 설명                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | 설치 prefix(기본값: `~/.openclaw`)                                              |
| `--install-method npm\|git` | 설치 방식을 선택합니다(기본값: `npm`). 별칭: `--method`                        |
| `--npm`                     | npm 방식 바로가기                                                               |
| `--git`, `--github`         | git 방식 바로가기                                                               |
| `--git-dir <path>`          | Git 체크아웃 디렉터리(기본값: `~/openclaw`). 별칭: `--dir`                     |
| `--version <ver>`           | OpenClaw 버전 또는 dist-tag(기본값: `latest`)                                   |
| `--node-version <ver>`      | Node 버전(기본값: `22.22.0`)                                                    |
| `--json`                    | NDJSON 이벤트를 내보냅니다                                                      |
| `--onboard`                 | 설치 후 `openclaw onboard` 실행                                                 |
| `--no-onboard`              | 온보딩 건너뛰기(기본값)                                                         |
| `--set-npm-prefix`          | Linux에서 현재 prefix를 쓸 수 없는 경우 npm prefix를 `~/.npm-global`로 강제 설정 |
| `--help`                    | 사용법을 표시합니다(`-h`)                                                       |

  </Accordion>

  <Accordion title="Environment variables reference">

| 변수                                        | 설명                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | 설치 접두사                                   |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 설치 방법                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 버전 또는 dist-tag                   |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 버전                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | git 설치용 Git 체크아웃 디렉터리              |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 기존 체크아웃에 대한 git 업데이트 전환        |
| `OPENCLAW_NO_ONBOARD=1`                     | 온보딩 건너뛰기                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 로그 수준                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips 동작 제어(기본값: `1`)          |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### 흐름(install.ps1)

<Steps>
  <Step title="PowerShell + Windows 환경 확인">
    PowerShell 5+가 필요합니다.
  </Step>
  <Step title="기본적으로 Node.js 24 확인">
    없으면 winget, Chocolatey, Scoop 순서로 설치를 시도합니다. Node 22 LTS, 현재 `22.14+`도 호환성을 위해 계속 지원됩니다.
  </Step>
  <Step title="OpenClaw 설치">
    - `npm` 방법(기본값): 선택한 `-Tag`를 사용해 전역 npm 설치
    - `git` 방법: repo를 clone/update하고, pnpm으로 install/build한 다음 `%USERPROFILE%\.local\bin\openclaw.cmd`에 래퍼 설치

  </Step>
  <Step title="설치 후 작업">
    - 가능한 경우 필요한 bin 디렉터리를 사용자 PATH에 추가
    - 로드된 Gateway 서비스를 최선의 노력으로 새로 고침(`openclaw gateway install --force`, 그다음 재시작)
    - 업그레이드 및 git 설치 시 `openclaw doctor --non-interactive` 실행(최선의 노력)

  </Step>
  <Step title="실패 처리">
    `iwr ... | iex` 및 scriptblock 설치는 현재 PowerShell 세션을 닫지 않고 종료 오류를 보고합니다. 직접 실행하는 `powershell -File` / `pwsh -File` 설치는 자동화를 위해 여전히 0이 아닌 코드로 종료됩니다.
  </Step>
</Steps>

### 예시(install.ps1)

<Tabs>
  <Tab title="기본값">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git 설치">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="npm을 통한 GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="사용자 지정 git 디렉터리">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="디버그 추적">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 참조">

| 플래그                      | 설명                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 설치 방법(기본값: `npm`)                                   |
| `-Tag <tag\|version\|spec>` | npm dist-tag, 버전 또는 패키지 spec(기본값: `latest`)      |
| `-GitDir <path>`            | 체크아웃 디렉터리(기본값: `%USERPROFILE%\openclaw`)        |
| `-NoOnboard`                | 온보딩 건너뛰기                                            |
| `-NoGitUpdate`              | `git pull` 건너뛰기                                        |
| `-DryRun`                   | 작업만 출력                                                |

  </Accordion>

  <Accordion title="환경 변수 참조">

| 변수                               | 설명                  |
| ---------------------------------- | --------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 설치 방법             |
| `OPENCLAW_GIT_DIR=<path>`          | 체크아웃 디렉터리     |
| `OPENCLAW_NO_ONBOARD=1`            | 온보딩 건너뛰기       |
| `OPENCLAW_GIT_UPDATE=0`            | git pull 비활성화     |
| `OPENCLAW_DRY_RUN=1`               | Dry run 모드          |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git`을 사용하고 Git이 없으면 스크립트가 종료되고 Git for Windows 링크를 출력합니다.
</Note>

---

## CI 및 자동화

예측 가능한 실행을 위해 비대화형 플래그/env vars를 사용하세요.

<Tabs>
  <Tab title="install.sh(비대화형 npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh(비대화형 git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh(JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1(온보딩 건너뛰기)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## 문제 해결

<AccordionGroup>
  <Accordion title="Git이 필요한 이유는 무엇인가요?">
    `git` 설치 방법에는 Git이 필요합니다. `npm` 설치의 경우에도 의존성이 git URL을 사용할 때 `spawn git ENOENT` 실패를 방지하기 위해 Git을 계속 확인/설치합니다.
  </Accordion>

  <Accordion title="Linux에서 npm이 EACCES에 걸리는 이유는 무엇인가요?">
    일부 Linux 설정은 npm 전역 prefix가 root 소유 경로를 가리킵니다. `install.sh`는 prefix를 `~/.npm-global`로 전환하고 셸 rc 파일에 PATH export를 추가할 수 있습니다(해당 파일이 있는 경우).
  </Accordion>

  <Accordion title="sharp/libvips 문제">
    스크립트는 시스템 libvips에 대해 sharp가 빌드되는 것을 피하기 위해 기본적으로 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`을 사용합니다. 재정의하려면:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows를 설치하고 PowerShell을 다시 연 다음 설치 프로그램을 다시 실행하세요.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix`를 실행하고 해당 디렉터리를 사용자 PATH에 추가한 다음(Windows에서는 `\bin` 접미사가 필요 없음) PowerShell을 다시 여세요.
  </Accordion>

  <Accordion title="Windows: 자세한 설치 프로그램 출력을 얻는 방법">
    `install.ps1`은 현재 `-Verbose` 스위치를 노출하지 않습니다.
    스크립트 수준 진단에는 PowerShell 추적을 사용하세요:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="설치 후 openclaw를 찾을 수 없음">
    일반적으로 PATH 문제입니다. [Node.js 문제 해결](/ko/install/node#troubleshooting)을 참조하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [설치 개요](/ko/install)
- [업데이트](/ko/install/updating)
- [제거](/ko/install/uninstall)
