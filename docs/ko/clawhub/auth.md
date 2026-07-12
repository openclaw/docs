---
read_when:
    - ClawHub에 로그인하기
    - ClawHub CLI 사용하기
    - 401 오류 디버깅
summary: ClawHub 로그인, API 토큰, CLI 로그인, 토큰 저장 및 폐기.
x-i18n:
    generated_at: "2026-07-12T21:33:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# 인증

ClawHub은 웹 로그인에 GitHub를 사용합니다. CLI는 로그인한 계정을 통해 생성된 ClawHub API 토큰을 사용합니다.

## 웹 로그인

[clawhub.ai](https://clawhub.ai)에서 GitHub를 사용하여 로그인합니다.

삭제되거나 차단 또는 비활성화된 계정은 정상적인 ClawHub 로그인을 완료할 수 없습니다. 로그인 후 다시 로그아웃 상태로 돌아간다면 계정이 정상 상태가 아닐 수 있습니다. 계정이 차단되거나 비활성화되었으며 이것이 실수라고 생각한다면 [ClawHub 이의 신청 양식](https://appeals.openclaw.ai/)을 사용하십시오.

## CLI 로그인

기본 CLI 로그인 흐름에서는 브라우저가 열립니다.

```bash
clawhub login
clawhub whoami
```

진행 과정:

1. CLI가 `127.0.0.1`에서 임시 콜백 서버를 시작합니다.
2. 브라우저에서 ClawHub 로그인 페이지가 열립니다.
3. GitHub 로그인 후 ClawHub이 API 토큰을 생성합니다.
4. 브라우저가 로컬 콜백으로 다시 리디렉션됩니다.
5. CLI가 ClawHub 구성 파일에 토큰을 저장합니다.

방화벽, VPN 또는 프록시 규칙으로 인해 브라우저에서 로컬 콜백에 연결할 수 없다면 헤드리스 토큰 흐름을 사용하십시오.

## 헤드리스 로그인

ClawHub 웹 UI에서 토큰을 생성한 후 CLI에 전달합니다.

```bash
clawhub login --token clh_...
```

서버, CI 작업 또는 터미널 전용 환경에서는 이 흐름을 사용하십시오.

다른 곳에서 브라우저를 열 수 있는 원격 셸에서는 다음을 실행합니다.

```bash
clawhub login --device
```

CLI는 일회용 코드를 출력하고 사용자가 `https://clawhub.ai/cli/device`에서 승인할 때까지 기다립니다.

## 토큰 저장소

기본 구성 경로:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` 또는 `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

다음과 같이 경로를 재정의합니다.

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI 설정을 위해 저장된 토큰을 출력하려면 다음을 실행합니다.

```bash
clawhub token
```

## 폐기

ClawHub 웹 UI에서 API 토큰을 폐기할 수 있습니다.

폐기되었거나 유효하지 않거나 누락된 토큰에는 `401 Unauthorized`가 반환됩니다. `clawhub login`으로 다시 로그인하거나 `clawhub login --token`으로 새 토큰을 제공하십시오.

삭제되거나 차단 또는 비활성화된 계정은 기존 API 토큰을 계속 사용할 수 없습니다. 계정이 차단되거나 비활성화되었으며 이것이 실수라고 생각한다면 [ClawHub 이의 신청 양식](https://appeals.openclaw.ai/)을 사용하십시오.
