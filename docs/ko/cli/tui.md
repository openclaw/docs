---
read_when:
    - 원격 친화적인 Gateway용 터미널 UI가 필요함
    - 스크립트에서 url/token/session을 전달하고 싶음
    - Gateway 없이 로컬 임베드 모드로 TUI를 실행하고 싶음
    - openclaw chat 또는 `openclaw tui --local`을 사용하고 싶음
summary: Gateway 기반 또는 로컬 임베드 터미널 UI인 `openclaw tui`용 CLI 참조
title: TUI
x-i18n:
    generated_at: "2026-04-23T14:02:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Gateway에 연결된 터미널 UI를 열거나 로컬 임베드 모드로 실행합니다.

관련 항목:

- TUI 가이드: [TUI](/ko/web/tui)

참고:

- `chat` 및 `terminal`은 `openclaw tui --local`의 별칭입니다.
- `--local`은 `--url`, `--token`, `--password`와 함께 사용할 수 없습니다.
- `tui`는 가능한 경우 토큰/비밀번호 인증에 대해 구성된 gateway auth SecretRef를 확인합니다(`env`/`file`/`exec` provider).
- 구성된 에이전트 workspace 디렉터리 내부에서 실행되면, TUI는 세션 키 기본값으로 해당 에이전트를 자동 선택합니다(`--session`이 명시적으로 `agent:<id>:...`인 경우 제외).
- 로컬 모드는 임베드된 에이전트 런타임을 직접 사용합니다. 대부분의 로컬 도구는 작동하지만 Gateway 전용 기능은 사용할 수 없습니다.
- 로컬 모드는 TUI 명령 표면에 `/auth [provider]`를 추가합니다.
- 로컬 모드에서도 Plugin 승인 게이트는 그대로 적용됩니다. 승인이 필요한 도구는 터미널에서 결정을 요청하며, Gateway가 관여하지 않는다고 해서 자동으로 승인되지는 않습니다.

## 예시

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# 에이전트 workspace 내부에서 실행하면 해당 에이전트를 자동으로 확인함
openclaw tui --session bugfix
```

## Config 복구 루프

현재 config가 이미 유효하고, 임베드된 에이전트가 같은 터미널에서 이를 검사하고 문서와 비교하며 복구를 도와주길 원할 때는 로컬 모드를 사용하세요.

이미 `openclaw config validate`가 실패하는 경우에는 먼저 `openclaw configure` 또는 `openclaw doctor --fix`를 사용하세요. `openclaw chat`은 잘못된 config 가드를 우회하지 않습니다.

```bash
openclaw chat
```

그런 다음 TUI 내부에서:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` 또는 `openclaw configure`로 필요한 수정만 적용한 뒤 `openclaw config validate`를 다시 실행하세요. 자세한 내용은 [TUI](/ko/web/tui) 및 [Config](/ko/cli/config)를 참조하세요.
