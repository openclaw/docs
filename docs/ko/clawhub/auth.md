---
read_when:
    - ClawHub에 로그인하기
    - ClawHub CLI 사용하기
    - 401 오류 디버깅
summary: ClawHub 로그인, API 토큰, CLI 로그인, 토큰 저장 및 폐기.
x-i18n:
    generated_at: "2026-05-12T23:29:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# 인증

ClawHub은 웹 로그인에 GitHub를 사용합니다. CLI는 로그인한 계정을 통해 생성된 ClawHub API 토큰을 사용합니다.

## 웹 로그인

[clawhub.ai](https://clawhub.ai)에서 GitHub로 로그인하세요.

삭제, 차단 또는 비활성화된 계정은 일반적인 ClawHub 로그인을 완료할 수 없습니다.
로그인 후 로그아웃된 상태로 돌아간다면 계정 상태가 양호하지 않을 수 있습니다.

## CLI 로그인

기본 CLI 로그인 흐름은 브라우저를 엽니다.

```bash
clawhub login
clawhub whoami
```

진행 방식:

1. CLI가 `127.0.0.1`에서 임시 콜백 서버를 시작합니다.
2. 브라우저가 ClawHub 로그인 페이지를 엽니다.
3. GitHub 로그인 후 ClawHub이 API 토큰을 생성합니다.
4. 브라우저가 로컬 콜백으로 다시 리디렉션됩니다.
5. CLI가 토큰을 ClawHub 구성 파일에 저장합니다.

방화벽, VPN 또는 프록시 규칙 때문에 브라우저가 로컬 콜백에 도달할 수 없다면 헤드리스 토큰 흐름을 사용하세요.

## 헤드리스 로그인

ClawHub 웹 UI에서 토큰을 만든 다음 CLI에 전달합니다.

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

다음으로 경로를 재정의하세요.

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## 폐기

ClawHub 웹 UI에서 API 토큰을 폐기할 수 있습니다.

폐기되었거나 유효하지 않거나 누락된 토큰은 `401 Unauthorized`를 반환합니다. `clawhub login`으로 다시 로그인하거나 `clawhub login --token`으로 새 토큰을 제공하세요.

삭제, 차단 또는 비활성화된 계정은 기존 API 토큰을 계속 사용할 수 없습니다.
