---
read_when:
    - Gateway용 터미널 UI가 필요합니다(원격 환경에 적합)
    - 스크립트에서 url/token/session을 전달하려는 경우
    - Gateway 없이 로컬 임베디드 모드에서 TUI를 실행하려는 경우
    - openclaw chat 또는 openclaw tui --local을 사용하려고 합니다
summary: '`openclaw tui`용 CLI 참조(Gateway 기반 또는 로컬 임베디드 터미널 UI)'
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:20:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway에 연결된 터미널 UI를 열거나, 로컬 임베디드
모드에서 실행합니다.

관련 항목:

- TUI 가이드: [TUI](/ko/web/tui)

## 옵션

| 플래그                | 기본값                                    | 설명                                                                                         |
| --------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Gateway 대신 로컬 임베디드 에이전트 런타임에 대해 실행합니다.                                |
| `--url <url>`         | 구성의 `gateway.remote.url`               | Gateway WebSocket URL.                                                                       |
| `--token <token>`     | (없음)                                    | 필요한 경우 Gateway 토큰.                                                                    |
| `--password <pass>`   | (없음)                                    | 필요한 경우 Gateway 비밀번호.                                                               |
| `--session <key>`     | `main`(또는 범위가 전역이면 `global`)     | 세션 키. 에이전트 작업 영역 안에서는 접두사가 없으면 해당 에이전트를 자동 선택합니다.       |
| `--deliver`           | `false`                                   | 구성된 채널을 통해 어시스턴트 응답을 전달합니다.                                            |
| `--thinking <level>`  | (모델 기본값)                             | 사고 수준 재정의.                                                                           |
| `--message <text>`    | (없음)                                    | 연결 후 초기 메시지를 보냅니다.                                                             |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | 에이전트 제한 시간. 잘못된 값은 경고를 기록하고 무시됩니다.                                 |
| `--history-limit <n>` | `200`                                     | 연결 시 로드할 기록 항목 수.                                                                 |

별칭: `openclaw chat` 및 `openclaw terminal`은 `--local`이 암시된 동일한 명령을 호출합니다.

참고:

- `chat` 및 `terminal`은 `openclaw tui --local`의 별칭입니다.
- `--local`은 `--url`, `--token` 또는 `--password`와 함께 사용할 수 없습니다.
- `tui`는 가능한 경우 토큰/비밀번호 인증을 위해 구성된 Gateway 인증 SecretRefs를 확인합니다(`env`/`file`/`exec` 제공자).
- 구성된 에이전트 작업 영역 디렉터리 안에서 실행하면, TUI는 세션 키 기본값으로 해당 에이전트를 자동 선택합니다(`--session`이 명시적으로 `agent:<id>:...`인 경우 제외).
- 로컬이 아닌 URL 기반 연결의 푸터에 Gateway 호스트 이름을 표시하려면 `openclaw config set tui.footer.showRemoteHost true`를 실행하세요. 호스트 레이블은 기본적으로 꺼져 있으며 루프백 또는 임베디드 로컬 연결에는 절대 표시되지 않습니다.
- 로컬 모드는 임베디드 에이전트 런타임을 직접 사용합니다. 대부분의 로컬 도구는 작동하지만 Gateway 전용 기능은 사용할 수 없습니다.
- 로컬 모드는 TUI 명령 표면 안에 `/auth [provider]`를 추가합니다.
- Plugin 승인 게이트는 로컬 모드에서도 계속 적용됩니다. 승인이 필요한 도구는 터미널에서 결정을 요청합니다. Gateway가 관여하지 않는다고 해서 어떤 것도 조용히 자동 승인되지 않습니다.
- 세션 [목표](/ko/tools/goal)는 푸터에 표시되며 `/goal`로 관리할 수 있습니다.

## 예시

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# 에이전트 작업 영역 안에서 실행하면 해당 에이전트를 자동으로 추론합니다
openclaw tui --session bugfix
```

## 구성 복구 루프

현재 구성이 이미 검증을 통과하고, 임베디드 에이전트가 이를
검사하고 문서와 비교한 뒤 같은 터미널에서 복구를 돕게 하려면
로컬 모드를 사용하세요.

`openclaw config validate`가 이미 실패하는 경우 먼저 `openclaw configure` 또는
`openclaw doctor --fix`를 사용하세요. `openclaw chat`은 잘못된
구성 보호 장치를 우회하지 않습니다.

```bash
openclaw chat
```

그런 다음 TUI 안에서:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` 또는 `openclaw configure`로 대상 수정 사항을 적용한 다음
`openclaw config validate`를 다시 실행하세요. [TUI](/ko/web/tui) 및 [구성](/ko/cli/config)을 참조하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [TUI](/ko/web/tui)
- [목표](/ko/tools/goal)
