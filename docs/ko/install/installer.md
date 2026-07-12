---
read_when:
    - '`openclaw.ai/install.sh`을 이해하고 싶습니다.'
    - 설치를 자동화하려는 경우(CI / 헤드리스)
    - GitHub 체크아웃에서 설치하려는 경우
summary: 설치 프로그램 스크립트의 작동 방식(install.sh, install-cli.sh, install.ps1), 플래그 및 자동화
title: 설치 프로그램 내부 구조
x-i18n:
    generated_at: "2026-07-12T00:54:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw은 `openclaw.ai`에서 제공되는 세 가지 설치 스크립트를 함께 배포합니다.

| 스크립트                           | 플랫폼               | 수행 작업                                                                                           |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 필요한 경우 Node를 설치하고 npm(기본값) 또는 git을 통해 OpenClaw을 설치하며, 온보딩을 실행할 수 있습니다. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm 또는 git을 통해 로컬 접두사(`~/.openclaw`)에 Node와 OpenClaw을 설치합니다. 루트 권한이 필요하지 않습니다. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 필요한 경우 Node를 설치하고 npm(기본값) 또는 git을 통해 OpenClaw을 설치하며, 온보딩을 실행할 수 있습니다. |

세 스크립트 모두 Node **22.19+, 23.11+ 또는 24+**를 지원하며, 새 설치의 기본 대상은 Node 24입니다.

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
설치에 성공했지만 새 터미널에서 `openclaw`을 찾을 수 없다면 [Node.js 문제 해결](/ko/install/node#troubleshooting)을 참조하세요.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL에서 대부분의 대화형 설치에 권장됩니다.
</Tip>

### 흐름(install.sh)

<Steps>
  <Step title="운영 체제 감지">
    macOS와 Linux(WSL 포함)를 지원합니다.
  </Step>
  <Step title="기본적으로 Node.js 24 보장">
    Node 버전을 확인하고 필요한 경우 Node 24를 설치합니다(macOS에서는 Homebrew, Linux에서는 NodeSource apt/dnf/yum 설정 스크립트 사용). macOS에서는 설치 프로그램이 Node 또는 Git을 위해 필요로 할 때만 Homebrew를 설치합니다. 호환성을 위해 Node 22.19+ 및 23.11+도 계속 지원됩니다.
    Alpine/musl Linux에서는 설치 프로그램이 NodeSource 대신 apk 패키지를 사용합니다. 설정된 Alpine 저장소에서 지원되는 Node 버전을 제공해야 합니다(작성 시점 기준 Alpine 3.21 이상).
  </Step>
  <Step title="Git 보장">
    Git이 없으면 감지된 패키지 관리자를 사용하여 설치합니다. 여기에는 macOS의 Homebrew와 Alpine의 apk가 포함됩니다.
  </Step>
  <Step title="OpenClaw 설치">
    - `npm` 방식(기본값): 전역 npm 설치
    - `git` 방식: 저장소 복제/업데이트, pnpm으로 의존성 설치, 빌드 후 `~/.local/bin/openclaw`에 래퍼 설치

  </Step>
  <Step title="설치 후 작업">
    - 후속 명령에 사용할 방금 설치된 `openclaw` 바이너리를 확인합니다.
    - 설정되지 않은 설치의 경우 doctor 또는 gateway 검사보다 먼저 온보딩을 시작합니다. `--no-onboard`를 사용하거나 TTY가 없으면 나중에 설정을 완료할 명령을 출력합니다.
    - 설정된 설치의 경우 로드된 Gateway 서비스를 최선의 방식으로 새로 고치고 다시 시작한 다음 doctor를 실행합니다. 업그레이드 시 가능한 경우 Plugin을 업데이트하거나, 프롬프트가 활성화된 헤드리스 실행에서는 수동 명령을 출력합니다.
    - `--verify` 실행 시 설치된 버전을 확인하고, 설정이 존재하는 경우에만 Gateway 상태를 확인합니다.

  </Step>
</Steps>

### 소스 체크아웃 감지

OpenClaw 체크아웃(`package.json` + `pnpm-workspace.yaml`) 내부에서 실행하면 스크립트가 다음 옵션을 제공합니다.

- 체크아웃 사용(`git`) 또는
- 전역 설치 사용(`npm`)

TTY를 사용할 수 없고 설치 방식이 설정되지 않은 경우 기본값으로 `npm`을 사용하고 경고를 표시합니다.

잘못된 방식 선택 또는 잘못된 `--install-method` 값의 경우 스크립트는 코드 `2`로 종료됩니다.

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
  <Tab title="GitHub 기본 브랜치 체크아웃">
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

| 플래그                                  | 설명                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | 설치 방식 선택(기본값: `npm`)                                          |
| `--npm`                                 | npm 방식의 단축 옵션                                                    |
| `--git \| --github`                     | git 방식의 단축 옵션                                                    |
| `--version <version\|dist-tag\|spec>`   | npm 버전, 배포 태그 또는 패키지 명세(기본값: `latest`)                  |
| `--beta`                                | 사용 가능한 경우 베타 배포 태그를 사용하고, 그렇지 않으면 `latest`로 대체 |
| `--git-dir \| --dir <path>`             | 체크아웃 디렉터리(기본값: `~/openclaw`)                                 |
| `--no-git-update`                       | 기존 체크아웃에서 `git pull` 건너뛰기                                   |
| `--no-prompt`                           | 프롬프트 비활성화                                                       |
| `--no-onboard`                          | 온보딩 건너뛰기                                                         |
| `--onboard`                             | 온보딩 활성화                                                           |
| `--verify`                              | 설치 후 스모크 검증 실행(`--version`, 로드된 경우 Gateway 상태)         |
| `--dry-run`                             | 변경 사항을 적용하지 않고 작업 출력                                    |
| `--verbose`                             | 디버그 출력 활성화(`set -x`, npm 알림 수준 로그)                        |
| `--help \| -h`                          | 사용법 표시                                                             |

  </Accordion>

  <Accordion title="환경 변수 참조">

| 변수                                              | 설명                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 설치 방식                                                           |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 버전, 배포 태그 또는 패키지 명세                                |
| `OPENCLAW_BETA=0\|1`                              | 사용 가능한 경우 베타 사용                                          |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 상태 및 기본 git/온보딩 경로의 기본 디렉터리                |
| `OPENCLAW_GIT_DIR=<path>`                         | 체크아웃 디렉터리                                                    |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git 업데이트 전환                                                    |
| `OPENCLAW_NO_PROMPT=1`                            | 프롬프트 비활성화                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | 설치 후 스모크 검증 실행                                             |
| `OPENCLAW_NO_ONBOARD=1`                           | 온보딩 건너뛰기                                                      |
| `OPENCLAW_DRY_RUN=1`                              | 시험 실행 모드                                                       |
| `OPENCLAW_VERBOSE=1`                              | 디버그 모드                                                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm 로그 수준(기본값: `error`, npm 사용 중단 경고 숨김)              |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
모든 항목을 로컬 접두사(기본값 `~/.openclaw`) 아래에 두고 시스템 Node 의존성을 사용하지 않으려는 환경을 위해 설계되었습니다. 기본적으로 npm 설치를 지원하며, 동일한 접두사 흐름에서 git 체크아웃 설치도 지원합니다.
</Info>

### 흐름(install-cli.sh)

<Steps>
  <Step title="로컬 Node 런타임 설치">
    고정된 지원 Node LTS tarball(버전은 스크립트에 포함되며 별도로 업데이트됨, 기본값 `22.22.2`)을 `<prefix>/tools/node-v<version>`에 다운로드하고 SHA-256을 확인합니다.
    고정된 런타임과 호환되는 tarball을 Node에서 배포하지 않는 Alpine/musl Linux에서는 `apk`를 사용하여 `nodejs`와 `npm`을 설치하고 해당 런타임을 접두사 래퍼 경로에 연결합니다. Alpine 저장소에서 지원되는 Node 버전(22.19+, 23.11+ 또는 24+)을 제공해야 합니다. 이전 저장소가 Node 20 또는 21만 제공하는 경우 Alpine 3.21 이상을 사용하세요.
  </Step>
  <Step title="Git 보장">
    Git이 없으면 Linux에서는 apt/dnf/yum/apk를 통해, macOS에서는 Homebrew를 통해 설치를 시도합니다.
  </Step>
  <Step title="접두사 아래에 OpenClaw 설치">
    - `npm` 방식(기본값): npm을 사용하여 접두사 아래에 설치한 다음 `<prefix>/bin/openclaw`에 래퍼 작성
    - `git` 방식: 체크아웃(기본값 `~/openclaw`)을 복제/업데이트하고 `<prefix>/bin/openclaw`에 래퍼 작성

  </Step>
  <Step title="로드된 Gateway 서비스 새로 고침">
    동일한 접두사에서 Gateway 서비스가 이미 로드된 경우 스크립트는
    `openclaw gateway install --force`, 이어서 `openclaw gateway restart`를 실행하고,
    Gateway 상태를 최선의 방식으로 검사합니다.
  </Step>
</Steps>

### 예시(install-cli.sh)

<Tabs>
  <Tab title="기본값">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="사용자 지정 접두사 및 버전">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git 설치">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="자동화용 JSON 출력">
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

| 플래그                                  | 설명                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `--prefix <path>`                       | 설치 접두 경로(기본값: `~/.openclaw`)                                                      |
| `--install-method \| --method npm\|git` | 설치 방법 선택(기본값: `npm`)                                                              |
| `--npm`                                 | npm 방법의 단축 옵션                                                                       |
| `--git \| --github`                     | git 방법의 단축 옵션                                                                       |
| `--git-dir \| --dir <path>`             | Git 체크아웃 디렉터리(기본값: `~/openclaw`)                                                |
| `--version <ver>`                       | OpenClaw 버전 또는 dist-tag(기본값: `latest`)                                              |
| `--node-version <ver>`                  | Node 버전(기본값: `22.22.2`)                                                               |
| `--json`                                | NDJSON 이벤트 출력                                                                         |
| `--onboard`                             | 설치 후 `openclaw onboard` 실행                                                            |
| `--no-onboard`                          | 온보딩 건너뛰기(기본값)                                                                    |
| `--set-npm-prefix`                      | Linux에서 현재 npm 접두 경로에 쓸 수 없으면 `~/.npm-global`로 강제 설정                    |
| `--help \| -h`                          | 사용법 표시                                                                                |

  </Accordion>

  <Accordion title="환경 변수 참조">

| 변수                                        | 설명                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | 설치 접두 경로                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 설치 방법                                                          |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 버전 또는 dist-tag                                        |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 버전                                                          |
| `OPENCLAW_HOME=<path>`                      | OpenClaw 상태 및 기본 git/온보딩 경로의 기준 디렉터리              |
| `OPENCLAW_GIT_DIR=<path>`                   | git 설치용 Git 체크아웃 디렉터리                                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 기존 체크아웃의 git 업데이트 전환                                  |
| `OPENCLAW_NO_ONBOARD=1`                     | 온보딩 건너뛰기                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 로그 수준(기본값: `error`)                                     |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` 및 기타 GitHub 소스 지정자는 npm 설치에서 유효한 `--version` 대상이 아닙니다. 대신 `--install-method git --version main`을 사용하세요.
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
    설치되어 있지 않으면 winget, Chocolatey, Scoop 순으로 설치를 시도합니다. 사용할 수 있는 패키지 관리자가 없으면 스크립트가 공식 Node.js 24 Windows zip을 `%LOCALAPPDATA%\OpenClaw\deps\portable-node`에 다운로드하고 현재 프로세스와 사용자 PATH에 추가합니다. 호환성을 위해 Node 22.19 이상 및 23.11 이상도 계속 지원됩니다.
  </Step>
  <Step title="OpenClaw 설치">
    - `npm` 방법(기본값): 선택한 `-Tag`를 사용하여 전역 npm 설치를 수행합니다. `C:\` 같은 보호된 폴더에서 열린 셸에서도 작동하도록 쓰기 가능한 설치 프로그램 임시 디렉터리에서 실행됩니다.
    - `git` 방법: 저장소를 복제하거나 업데이트하고, pnpm으로 설치 및 빌드한 다음, `%USERPROFILE%\.local\bin\openclaw.cmd`에 래퍼를 설치합니다. Git이 없으면 스크립트가 `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 아래에 사용자 로컬 MinGit을 부트스트랩하고 현재 프로세스와 사용자 PATH에 추가합니다.

  </Step>
  <Step title="설치 후 작업">
    - 가능한 경우 필요한 바이너리 디렉터리를 사용자 PATH에 추가
    - 로드된 Gateway 서비스를 최선의 방식으로 갱신(`openclaw gateway install --force` 실행 후 재시작)
    - 업그레이드 및 git 설치 시 `openclaw doctor --non-interactive` 실행(최선의 방식)

  </Step>
  <Step title="실패 처리">
    `iwr ... | iex` 및 스크립트 블록 설치는 현재 PowerShell 세션을 닫지 않고 종료 오류를 보고합니다. 직접 실행하는 `powershell -File` / `pwsh -File` 설치는 자동화를 위해 계속 0이 아닌 종료 코드로 끝납니다.
  </Step>
</Steps>

### 예제(install.ps1)

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
  <Tab title="모의 실행">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 참조">

| 플래그                      | 설명                                                        |
| --------------------------- | ----------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 설치 방법(기본값: `npm`)                                    |
| `-Tag <tag\|version\|spec>` | npm dist-tag, 버전 또는 패키지 지정자(기본값: `latest`)     |
| `-GitDir <path>`            | 체크아웃 디렉터리(기본값: `%USERPROFILE%\openclaw`)         |
| `-NoOnboard`                | 온보딩 건너뛰기                                             |
| `-NoGitUpdate`              | `git pull` 건너뛰기                                         |
| `-DryRun`                   | 작업만 출력                                                 |

  </Accordion>

  <Accordion title="환경 변수 참조">

| 변수                               | 설명                 |
| ---------------------------------- | -------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 설치 방법            |
| `OPENCLAW_GIT_DIR=<path>`          | 체크아웃 디렉터리    |
| `OPENCLAW_NO_ONBOARD=1`            | 온보딩 건너뛰기      |
| `OPENCLAW_GIT_UPDATE=0`            | git pull 비활성화    |
| `OPENCLAW_DRY_RUN=1`               | 모의 실행 모드       |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git`을 사용했지만 Git이 없으면 스크립트는 Git for Windows 링크를 표시하기 전에 사용자 로컬 MinGit 부트스트랩을 시도합니다.
</Note>

---

## CI 및 자동화

예측 가능한 실행을 위해 비대화형 플래그와 환경 변수를 사용하세요.

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
    `git` 설치 방법에는 Git이 필요합니다. `npm` 설치에서도 종속성이 git URL을 사용할 때 발생하는 `spawn git ENOENT` 오류를 방지하기 위해 Git을 확인하고 설치합니다.
  </Accordion>

  <Accordion title="Linux에서 npm에 EACCES 오류가 발생하는 이유는 무엇인가요?">
    일부 Linux 설정에서는 npm의 전역 접두 경로가 root 소유 경로를 가리킵니다. `install.sh`는 접두 경로를 `~/.npm-global`로 변경하고 셸 rc 파일이 있는 경우 해당 파일에 PATH 내보내기 구문을 추가할 수 있습니다.
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    설치 프로그램이 사용자 로컬 MinGit을 부트스트랩할 수 있도록 다시 실행하거나 Git for Windows를 설치한 후 PowerShell을 다시 여세요.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix`를 실행하고 해당 디렉터리를 사용자 PATH에 추가한 다음(Windows에서는 `\bin` 접미사가 필요하지 않음) PowerShell을 다시 여세요.
  </Accordion>

  <Accordion title="Windows: 자세한 설치 프로그램 출력을 확인하는 방법">
    `install.ps1`은 `-Verbose` 스위치를 제공하지 않습니다.
    스크립트 수준 진단에는 PowerShell 추적을 사용하세요.

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

## 관련 문서

- [설치 개요](/ko/install)
- [업데이트](/ko/install/updating)
- [제거](/ko/install/uninstall)
