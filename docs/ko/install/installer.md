---
read_when:
    - '`openclaw.ai/install.sh`을 이해하려고 합니다'
    - 설치를 자동화하려는 경우(CI / 헤드리스)
    - GitHub 체크아웃에서 설치하려고 합니다
summary: 설치 프로그램 스크립트(install.sh, install-cli.sh, install.ps1)의 작동 방식, 플래그 및 자동화
title: 설치 프로그램 내부 구조
x-i18n:
    generated_at: "2026-07-16T12:40:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw은 `openclaw.ai`에서 제공되는 세 가지 설치 프로그램 스크립트를 배포합니다.

| 스크립트                             | 플랫폼             | 수행 작업                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 필요한 경우 Node를 설치하고, npm(기본값) 또는 git을 통해 OpenClaw을 설치하며, 온보딩을 실행할 수 있습니다.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm 또는 git을 통해 Node와 OpenClaw을 로컬 접두사(`~/.openclaw`)에 설치합니다. 루트 권한이 필요하지 않습니다. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 필요한 경우 Node를 설치하고, npm(기본값) 또는 git을 통해 OpenClaw을 설치하며, 온보딩을 실행할 수 있습니다.       |

세 스크립트 모두 Node **22.22.3+, 24.15+ 또는 25.9+**를 지원하며, 새 설치의 기본 대상은 Node 24입니다.

## 빠른 명령어

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
설치에 성공했지만 새 터미널에서 `openclaw`을 찾을 수 없다면 [Node.js 문제 해결](/ko/install/node#troubleshooting)을 참조하십시오.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL에서 대부분의 대화형 설치에 권장합니다.
</Tip>

### 흐름(install.sh)

<Steps>
  <Step title="운영 체제 감지">
    macOS와 Linux(WSL 포함)를 지원합니다.
  </Step>
  <Step title="기본적으로 Node.js 24 확보">
    Node 버전을 확인하고 필요한 경우 Node 24를 설치합니다(macOS에서는 Homebrew, Linux에서는 NodeSource 설정 스크립트와 apt/dnf/yum 사용). macOS에서는 설치 프로그램이 Node 또는 Git을 설치하는 데 필요한 경우에만 Homebrew를 설치합니다. Node 22.22.3+, Node 24.15+, Node 25.9+를 지원하며 Node 23은 지원하지 않습니다.
    Alpine/musl Linux에서는 설치 프로그램이 NodeSource 대신 apk 패키지를 사용하고 실제로 연결된 SQLite 버전을 확인합니다. 현재 안정 버전의 Alpine 패키지 스트림은 충분히 새로운 Node와 함께 취약한 시스템 SQLite를 제공할 수 있습니다. 이 경우 공식 `node:24-alpine` 컨테이너 또는 glibc 기반 호스트를 대신 사용하십시오.
  </Step>
  <Step title="Git 확보">
    Git이 없으면 감지된 패키지 관리자를 사용하여 설치합니다. macOS에서는 Homebrew를, Alpine에서는 apk를 사용합니다.
  </Step>
  <Step title="OpenClaw 설치">
    - `npm` 방식(기본값): 전역 npm 설치
    - `git` 방식: 저장소를 복제/업데이트하고 pnpm으로 종속성을 설치한 후 빌드하고, `~/.local/bin/openclaw`에 래퍼를 설치합니다.

  </Step>
  <Step title="설치 후 작업">
    - 후속 명령을 위해 방금 설치한 `openclaw` 바이너리를 확인합니다.
    - 구성되지 않은 설치의 경우 doctor 또는 Gateway 프로브보다 먼저 온보딩을 시작합니다. `--no-onboard`이 지정되었거나 TTY가 없으면 나중에 설정을 완료할 명령을 출력합니다.
    - 구성된 설치의 경우 로드된 Gateway 서비스를 최선의 방식으로 새로 고치고 다시 시작한 후 doctor를 실행합니다. 업그레이드 시 가능한 경우 Plugin을 업데이트하며, 헤드리스 프롬프트 활성 실행에서는 수동 명령을 출력합니다.
    - `--verify`이 실행되면 설치된 버전을 확인하고, 구성이 존재하는 경우에만 Gateway 상태를 확인합니다.

  </Step>
</Steps>

### 소스 체크아웃 감지

OpenClaw 체크아웃(`package.json` + `pnpm-workspace.yaml`) 내부에서 실행하면 스크립트가 다음 옵션을 제공합니다.

- 체크아웃 사용(`git`) 또는
- 전역 설치 사용(`npm`)

사용 가능한 TTY가 없고 설치 방식이 설정되지 않은 경우 기본값으로 `npm`을 사용하고 경고합니다.

잘못된 방식 선택 또는 잘못된 `--install-method` 값이 지정되면 스크립트가 코드 `2`로 종료됩니다.

### 예시(install.sh)

<Tabs>
  <Tab title="기본값">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="온보딩 건너뛰기">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git 설치">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main 체크아웃">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="시험 실행">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="설치 후 확인">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 참조">

| 플래그                                    | 설명                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | 설치 방식 선택(기본값: `npm`)                                  |
| `--npm`                                 | npm 방식의 단축 옵션                                                 |
| `--git \| --github`                     | git 방식의 단축 옵션                                                 |
| `--version <version\|dist-tag\|spec>`   | npm 버전, 배포 태그 또는 패키지 명세(기본값: `latest`)              |
| `--beta`                                | 사용 가능한 경우 beta 배포 태그를 사용하고, 그렇지 않으면 `latest`으로 대체              |
| `--git-dir \| --dir <path>`             | 체크아웃 디렉터리(기본값: `~/openclaw`)                              |
| `--no-git-update`                       | 기존 체크아웃에 대한 `git pull` 건너뛰기                                   |
| `--no-prompt`                           | 프롬프트 비활성화                                                         |
| `--no-onboard`                          | 온보딩 건너뛰기                                                         |
| `--onboard`                             | 온보딩 활성화                                                       |
| `--verify`                              | 설치 후 스모크 확인 실행(`--version`, 로드된 경우 Gateway 상태 확인) |
| `--dry-run`                             | 변경 사항을 적용하지 않고 작업 출력                                  |
| `--verbose`                             | 디버그 출력 활성화(`set -x`, npm 알림 수준 로그)                   |
| `--help \| -h`                          | 사용법 표시                                                              |

  </Accordion>

  <Accordion title="환경 변수 참조">

| 변수                                          | 설명                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 설치 방식                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 버전, 배포 태그 또는 패키지 명세                             |
| `OPENCLAW_BETA=0\|1`                              | 사용 가능한 경우 beta 사용                                              |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 상태 및 기본 git/온보딩 경로의 기본 디렉터리 |
| `OPENCLAW_GIT_DIR=<path>`                         | 체크아웃 디렉터리                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git 업데이트 전환                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | 프롬프트 비활성화                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | 설치 후 스모크 확인 실행                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | 온보딩 건너뛰기                                                    |
| `OPENCLAW_DRY_RUN=1`                              | 시험 실행 모드                                                       |
| `OPENCLAW_VERBOSE=1`                              | 디버그 모드                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm 로그 수준(기본값: `error`, npm 사용 중단 알림 숨김)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
모든 항목을 로컬 접두사
(기본값 `~/.openclaw`) 아래에 두고 시스템 Node 종속성을 사용하지 않으려는 환경을 위해 설계되었습니다. 기본적으로 npm 설치를 지원하며
동일한 접두사 흐름 아래에서 git 체크아웃 설치도 지원합니다.
</Info>

### 흐름(install-cli.sh)

<Steps>
  <Step title="로컬 Node 런타임 설치">
    고정된 지원 Node LTS tarball(버전은 스크립트에 포함되며 독립적으로 업데이트됨, 기본값 `24.15.0`)을 `<prefix>/tools/node-v<version>`에 다운로드하고 SHA-256을 확인합니다.
    공식 Node 24+ ARMv7 바이너리를 사용할 수 없으므로 Linux ARMv7에서는 Node `22.22.3`을 사용합니다.
    Node가 고정된 런타임과 호환되는 tarball을 배포하지 않는 Alpine/musl Linux에서는 `apk`을 사용하여 `nodejs` 및 `npm`을 설치한 후 Node와 실제로 연결된 SQLite 라이브러리를 모두 확인합니다. 현재 안정 버전의 Alpine 패키지 스트림은 충분히 새로운 Node를 사용하더라도 취약한 SQLite를 연결할 수 있습니다. 안전 검사가 패키지를 거부하면 공식 `node:24-alpine` 컨테이너 또는 glibc 기반 호스트를 사용하십시오.
  </Step>
  <Step title="Git 확보">
    Git이 없으면 Linux에서는 apt/dnf/yum/apk를, macOS에서는 Homebrew를 통해 설치를 시도합니다.
  </Step>
  <Step title="접두사 아래에 OpenClaw 설치">
    - `npm` 방식(기본값): npm을 사용하여 접두사 아래에 설치한 후 `<prefix>/bin/openclaw`에 래퍼를 작성합니다.
    - `git` 방식: 체크아웃(기본값 `~/openclaw`)을 복제/업데이트하고 여전히 `<prefix>/bin/openclaw`에 래퍼를 작성합니다.

  </Step>
  <Step title="로드된 Gateway 서비스 새로 고침">
    동일한 접두사에서 Gateway 서비스가 이미 로드된 경우 스크립트가
    대체 서비스를 활성화하는 `openclaw gateway install --force`을 실행한 후,
    Gateway 상태를 최선의 방식으로 프로브합니다.
  </Step>
</Steps>

### 예시(install-cli.sh)

<Tabs>
  <Tab title="기본값">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="사용자 지정 접두사 + 버전">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git 설치">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="자동화 JSON 출력">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="온보딩 실행">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 참조">

| 플래그                                    | 설명                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | 설치 접두사(기본값: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | 설치 방법 선택(기본값: `npm`)                                          |
| `--npm`                                 | npm 방법의 바로 가기                                                         |
| `--git \| --github`                     | git 방법의 바로 가기                                                         |
| `--git-dir \| --dir <path>`             | Git 체크아웃 디렉터리(기본값: `~/openclaw`)                                  |
| `--version <ver>`                       | OpenClaw 버전 또는 dist-tag(기본값: `latest`)                                |
| `--node-version <ver>`                  | Node 버전(기본값: `24.15.0`; Linux ARMv7에서는 `22.22.3`)                     |
| `--json`                                | NDJSON 이벤트 출력                                                              |
| `--onboard`                             | 설치 후 `openclaw onboard` 실행                                            |
| `--no-onboard`                          | 온보딩 건너뛰기(기본값)                                                       |
| `--set-npm-prefix`                      | Linux에서 현재 접두사에 쓸 수 없으면 npm 접두사를 `~/.npm-global`로 강제 설정 |
| `--help \| -h`                          | 사용법 표시                                                                      |

  </Accordion>

  <Accordion title="환경 변수 참조">

| 변수                                    | 설명                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | 설치 접두사                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 설치 방법                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 버전 또는 dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 버전                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw 상태 및 기본 git/온보딩 경로의 기본 디렉터리 |
| `OPENCLAW_GIT_DIR=<path>`                   | git 설치의 Git 체크아웃 디렉터리                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 기존 체크아웃의 git 업데이트 전환                          |
| `OPENCLAW_NO_ONBOARD=1`                     | 온보딩 건너뛰기                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 로그 수준(기본값: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` 및 기타 GitHub 소스 사양은 npm 설치의 유효한 `--version` 대상이 아닙니다. 대신 `--install-method git --version main`을 사용하십시오.
</Note>

---

<a id="installps1"></a>

## install.ps1

### 흐름(install.ps1)

<Steps>
  <Step title="PowerShell 및 Windows 환경 확인">
    PowerShell 5 이상이 필요합니다.
  </Step>
  <Step title="기본적으로 Node.js 24 확인">
    없는 경우 winget, Chocolatey, Scoop 순으로 설치를 시도합니다. 사용할 수 있는 패키지 관리자가 없으면 스크립트가 공식 Node.js 24 Windows zip을 `%LOCALAPPDATA%\OpenClaw\deps\portable-node`에 다운로드하고 현재 프로세스 및 사용자 PATH에 추가합니다. Node 22.22.3+, Node 24.15+, Node 25.9+가 지원되며 Node 23은 지원되지 않습니다.
  </Step>
  <Step title="OpenClaw 설치">
    - `npm` 방법(기본값): 선택한 `-Tag`을 사용한 전역 npm 설치입니다. `C:\`과 같은 보호된 폴더에서 연 셸에서도 작동하도록 쓰기 가능한 설치 프로그램 임시 디렉터리에서 실행됩니다.
    - `git` 방법: 저장소를 복제/업데이트하고 pnpm으로 설치/빌드한 다음 `%USERPROFILE%\.local\bin\openclaw.cmd`에 래퍼를 설치합니다. Git이 없으면 스크립트가 `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 아래에 사용자 로컬 MinGit을 부트스트랩하고 현재 프로세스 및 사용자 PATH에 추가합니다.

  </Step>
  <Step title="설치 후 작업">
    - 가능한 경우 필요한 bin 디렉터리를 사용자 PATH에 추가합니다.
    - 로드된 Gateway 서비스를 최선의 방식으로 새로 고칩니다(`openclaw gateway install --force`, 이후 재시작).
    - 업그레이드 및 git 설치 시 `openclaw doctor --non-interactive`을 실행합니다(최선의 방식).

  </Step>
  <Step title="실패 처리">
    `iwr ... | iex` 및 스크립트 블록 설치는 현재 PowerShell 세션을 닫지 않고 종료 오류를 보고합니다. 직접 수행하는 `powershell -File` / `pwsh -File` 설치는 자동화를 위해 여전히 0이 아닌 코드로 종료됩니다.
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
  <Tab title="GitHub main 체크아웃">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="사용자 지정 git 디렉터리">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="드라이 런">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 참조">

| 플래그                        | 설명                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 설치 방법(기본값: `npm`)                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag, 버전 또는 패키지 사양(기본값: `latest`) |
| `-GitDir <path>`            | 체크아웃 디렉터리(기본값: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | 온보딩 건너뛰기                                            |
| `-NoGitUpdate`              | `git pull` 건너뛰기                                            |
| `-DryRun`                   | 작업만 출력                                         |

  </Accordion>

  <Accordion title="환경 변수 참조">

| 변수                           | 설명        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 설치 방법     |
| `OPENCLAW_GIT_DIR=<path>`          | 체크아웃 디렉터리 |
| `OPENCLAW_NO_ONBOARD=1`            | 온보딩 건너뛰기    |
| `OPENCLAW_GIT_UPDATE=0`            | git pull 비활성화   |
| `OPENCLAW_DRY_RUN=1`               | 드라이 런 모드       |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git`을 사용하고 Git이 없으면 스크립트는 Git for Windows 링크를 출력하기 전에 사용자 로컬 MinGit 부트스트랩을 시도합니다.
</Note>

---

## CI 및 자동화

예측 가능한 실행을 위해 비대화형 플래그/환경 변수를 사용하십시오.

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
  <Accordion title="Git이 필요한 이유는 무엇입니까?">
    `git` 설치 방법에는 Git이 필요합니다. `npm` 설치에서도 종속성이 git URL을 사용할 때 발생하는 `spawn git ENOENT` 실패를 방지하기 위해 Git을 계속 확인/설치합니다.
  </Accordion>

  <Accordion title="Linux에서 npm에 EACCES가 발생하는 이유는 무엇입니까?">
    일부 Linux 설정은 npm의 전역 접두사를 root 소유 경로로 지정합니다. `install.sh`은 접두사를 `~/.npm-global`로 변경하고 셸 rc 파일이 있는 경우 해당 파일에 PATH 내보내기를 추가할 수 있습니다.
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    사용자 로컬 MinGit을 부트스트랩할 수 있도록 설치 프로그램을 다시 실행하거나 Git for Windows를 설치하고 PowerShell을 다시 여십시오.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix`을 실행하고 해당 디렉터리를 사용자 PATH에 추가한 다음(Windows에서는 `\bin` 접미사가 필요하지 않음) PowerShell을 다시 여십시오.
  </Accordion>

  <Accordion title="Windows: 설치 프로그램의 상세 출력을 확인하는 방법">
    `install.ps1`은 `-Verbose` 스위치를 제공하지 않습니다.
    스크립트 수준 진단에는 PowerShell 추적을 사용하십시오.

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="설치 후 openclaw를 찾을 수 없음">
    일반적으로 PATH 문제입니다. [Node.js 문제 해결](/ko/install/node#troubleshooting)을 참조하십시오.
  </Accordion>
</AccordionGroup>

## 관련 문서

- [설치 개요](/ko/install)
- [업데이트](/ko/install/updating)
- [제거](/ko/install/uninstall)
