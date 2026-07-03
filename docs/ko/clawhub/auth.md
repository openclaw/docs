---
read_when:
    - ClawHub에 로그인하기
    - ClawHub CLI 사용
    - 401 디버깅
summary: ClawHub 로그인, API 토큰, CLI 로그인, 토큰 저장 및 폐기.
x-i18n:
    generated_at: "2026-07-03T09:27:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# 인증

ClawHub는 웹 로그인에 GitHub를 사용합니다. CLI는 로그인된 계정으로 생성한 ClawHub API 토큰을 사용합니다.

## 웹 로그인

[clawhub.ai](https://clawhub.ai)에서 GitHub로 로그인하세요.

삭제, 차단 또는 비활성화된 계정은 일반적인 ClawHub 로그인을 완료할 수 없습니다.
로그인 후 로그아웃된 상태로 돌아간다면 계정 상태가 양호하지 않을 수 있습니다. 계정이 차단되었거나 비활성화되었다면 이것이 실수라고 생각되는 경우 [ClawHub 이의 제기 양식](https://appeals.openclaw.ai/)을 사용하세요.

## CLI 로그인

기본 CLI 로그인 흐름은 브라우저를 엽니다.

```bash
clawhub login
clawhub whoami
```

동작 방식:

1. CLI가 `127.0.0.1`에서 임시 콜백 서버를 시작합니다.
2. 브라우저가 ClawHub 로그인 페이지를 엽니다.
3. GitHub 로그인 후 ClawHub가 API 토큰을 생성합니다.
4. 브라우저가 로컬 콜백으로 다시 리디렉션됩니다.
5. CLI가 ClawHub 구성 파일에 토큰을 저장합니다.

방화벽, VPN 또는 프록시 규칙 때문에 브라우저가 로컬 콜백에 도달할 수 없다면 헤드리스 토큰 흐름을 사용하세요.

## 헤드리스 로그인

ClawHub 웹 UI에서 토큰을 생성한 다음 CLI에 전달하세요.

```bash
clawhub login --token clh_...
```

서버, CI 작업 또는 터미널 전용 환경에서는 이 흐름을 사용하세요.

다른 곳에서 브라우저를 열 수 있는 원격 셸에서는 다음을 실행하세요.

```bash
clawhub login --device
```

CLI가 일회용 코드를 출력하고, 사용자가 `https://clawhub.ai/cli/device`에서 승인하는 동안 대기합니다.

## 토큰 저장

기본 구성 경로:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` 또는 `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

다음으로 경로를 재정의합니다.

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI 설정을 위해 저장된 토큰을 출력하려면 다음을 사용하세요.

```bash
clawhub token
```

## 취소

ClawHub 웹 UI에서 API 토큰을 취소할 수 있습니다.

취소되었거나 유효하지 않거나 누락된 토큰은 `401 Unauthorized`를 반환합니다. `clawhub login`으로 다시 로그인하거나 `clawhub login --token`으로 새 토큰을 제공하세요.

삭제, 차단 또는 비활성화된 계정은 기존 API 토큰을 계속 사용할 수 없습니다. 계정이 차단되었거나 비활성화되었다면 이것이 실수라고 생각되는 경우 [ClawHub 이의 제기 양식](https://appeals.openclaw.ai/)을 사용하세요.
