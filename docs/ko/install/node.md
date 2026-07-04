---
read_when:
    - OpenClaw를 설치하기 전에 Node.js를 설치해야 합니다.
    - OpenClaw를 설치했지만 `openclaw` 명령을 찾을 수 없습니다
    - npm install -g가 권한 또는 PATH 문제로 실패함
summary: OpenClaw용 Node.js 설치 및 구성 - 버전 요구 사항, 설치 옵션, PATH 문제 해결
title: Node.js
x-i18n:
    generated_at: "2026-07-04T08:45:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c556593982efa7f6fcd6e24787cca7ca6af30d265f54bb927a0608d2efc58d6
    source_path: install/node.md
    workflow: 16
---

OpenClaw에는 **Node 22.19+, Node 23.11+ 또는 Node 24+**가 필요합니다. **Node 24는 설치, CI, 릴리스 워크플로의 기본 및 권장 런타임**입니다. Node 22는 활성 LTS 라인을 통해 계속 지원됩니다. [설치 스크립트](/ko/install#alternative-install-methods)는 Node를 자동으로 감지하고 설치합니다. 이 페이지는 Node를 직접 설정하고 모든 것이 올바르게 연결되었는지 확인하려는 경우(버전, PATH, 전역 설치)를 위한 것입니다.

## 버전 확인

```bash
node -v
```

이 명령이 `v24.x.x` 이상을 출력하면 권장 기본 버전을 사용 중입니다. `v22.19.x` 이상을 출력하면 지원되는 Node 22 LTS 경로를 사용 중이지만, 가능할 때 Node 24로 업그레이드하는 것을 여전히 권장합니다. `v23.11.0` 이전의 Node 23 버전은 지원되지 않습니다. Node가 설치되어 있지 않거나 버전이 지원 범위를 벗어나면 아래 설치 방법 중 하나를 선택하세요.

## Node 설치

<Tabs>
  <Tab title="macOS">
    **Homebrew**(권장):

    ```bash
    brew install node
    ```

    또는 [nodejs.org](https://nodejs.org/)에서 macOS 설치 프로그램을 다운로드하세요.

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    또는 버전 관리자를 사용하세요(아래 참조).

  </Tab>
  <Tab title="Windows">
    **winget**(권장):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    또는 [nodejs.org](https://nodejs.org/)에서 Windows 설치 프로그램을 다운로드하세요.

  </Tab>
</Tabs>

<Accordion title="버전 관리자 사용(nvm, fnm, mise, asdf)">
  버전 관리자를 사용하면 Node 버전 사이를 쉽게 전환할 수 있습니다. 인기 있는 옵션:

- [**fnm**](https://github.com/Schniz/fnm) - 빠르고 크로스 플랫폼 지원
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux에서 널리 사용됨
- [**mise**](https://mise.jdx.dev/) - 여러 언어 지원(Node, Python, Ruby 등)

fnm 예시:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  버전 관리자가 셸 시작 파일(`~/.zshrc` 또는 `~/.bashrc`)에서 초기화되는지 확인하세요. 그렇지 않으면 PATH에 Node의 bin 디렉터리가 포함되지 않아 새 터미널 세션에서 `openclaw`를 찾지 못할 수 있습니다.
  </Warning>
</Accordion>

## 문제 해결

### `openclaw: command not found`

이는 거의 항상 npm의 전역 bin 디렉터리가 PATH에 없다는 뜻입니다.

<Steps>
  <Step title="전역 npm prefix 찾기">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH에 있는지 확인">
    ```bash
    echo "$PATH"
    ```

    출력에서 `<npm-prefix>/bin`(macOS/Linux) 또는 `<npm-prefix>`(Windows)를 찾으세요.

  </Step>
  <Step title="셸 시작 파일에 추가">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` 또는 `~/.bashrc`에 추가하세요.

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        그런 다음 새 터미널을 열거나(zsh에서는 `rehash`, bash에서는 `hash -r` 실행) 적용하세요.
      </Tab>
      <Tab title="Windows">
        설정 → 시스템 → 환경 변수를 통해 `npm prefix -g`의 출력을 시스템 PATH에 추가하세요.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g`의 권한 오류(Linux)

`EACCES` 오류가 표시되면 npm의 전역 prefix를 사용자가 쓸 수 있는 디렉터리로 변경하세요.

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

영구적으로 적용하려면 `export PATH=...` 줄을 `~/.bashrc` 또는 `~/.zshrc`에 추가하세요.

## 관련 문서

- [설치 개요](/ko/install) - 모든 설치 방법
- [업데이트](/ko/install/updating) - OpenClaw를 최신 상태로 유지
- [시작하기](/ko/start/getting-started) - 설치 후 첫 단계
