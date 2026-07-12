---
read_when:
    - Gateway용 터미널 UI가 필요합니다(원격 환경에 적합)
    - 스크립트에서 URL/토큰/세션을 전달하려는 경우
    - Gateway 없이 로컬 임베디드 모드에서 TUI를 실행하려는 경우
    - openclaw chat 또는 openclaw tui --local을 사용하려는 경우
summary: '`openclaw tui`용 CLI 참조(Gateway 기반 또는 로컬 임베디드 터미널 UI)'
title: TUI
x-i18n:
    generated_at: "2026-07-12T00:39:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway에 연결된 터미널 UI를 열거나 로컬 임베디드 모드로 실행합니다.

관련 가이드: [TUI](/ko/web/tui)

## 옵션

| 플래그                       | 기본값                                    | 설명                                                                                         |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Gateway 대신 로컬 임베디드 에이전트 런타임을 대상으로 실행합니다.                            |
| `--url <url>`                | 구성의 `gateway.remote.url`               | Gateway WebSocket URL입니다.                                                                 |
| `--token <token>`            | (없음)                                    | 필요한 경우 사용할 Gateway 토큰입니다.                                                       |
| `--password <pass>`          | (없음)                                    | 필요한 경우 사용할 Gateway 비밀번호입니다.                                                   |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | 고정된 `wss://` Gateway에 대해 예상되는 TLS 인증서 지문입니다.                                |
| `--session <key>`            | `main`(범위가 전역이면 `global`)          | 세션 키입니다. 에이전트 작업 공간 내에서는 접두사가 없으면 해당 에이전트를 자동 선택합니다.  |
| `--deliver`                  | `false`                                   | 구성된 채널을 통해 어시스턴트 응답을 전달합니다.                                              |
| `--thinking <level>`         | (모델 기본값)                             | 사고 수준을 재정의합니다.                                                                    |
| `--message <text>`           | (없음)                                    | 연결 후 초기 메시지를 보냅니다.                                                               |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | 에이전트 제한 시간입니다. 잘못된 값은 경고를 기록하고 무시합니다.                             |
| `--history-limit <n>`        | `200`                                     | 연결 시 불러올 기록 항목 수입니다.                                                            |

별칭: `openclaw chat`과 `openclaw terminal`은 `--local`이 암시적으로 적용된 상태로 이 명령을 호출합니다.

## 참고 사항

- `--local`은 `--url`, `--token`, `--password` 또는 `--tls-fingerprint`와 함께 사용할 수 없습니다.
- 가능한 경우 `tui`는 토큰/비밀번호 인증을 위해 구성된 Gateway 인증 SecretRef를 확인합니다(`env`/`file`/`exec` 제공자).
- URL이나 포트를 명시하지 않으면 `tui`는 실행 중인 Gateway가 기록한 활성 로컬 Gateway 포트를 따릅니다. 명시적인 `--url`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` 및 원격 Gateway 구성이 우선합니다.
- 구성된 에이전트 작업 공간 디렉터리 내에서 실행하면 TUI는 세션 키 기본값으로 해당 에이전트를 자동 선택합니다(`--session`이 명시적으로 `agent:<id>:...`인 경우 제외).
- 로컬이 아닌 URL 기반 연결의 바닥글에 Gateway 호스트 이름을 표시하려면 `openclaw config set tui.footer.showRemoteHost true`를 실행합니다. 기본적으로 꺼져 있으며 local loopback 또는 임베디드 로컬 연결에서는 표시되지 않습니다.
- 로컬 모드는 임베디드 에이전트 런타임을 직접 사용합니다. 대부분의 로컬 도구는 작동하지만 Gateway 전용 기능은 사용할 수 없습니다.
- 로컬 모드는 TUI 명령 표면에 `/auth [provider]`를 추가합니다.
- 로컬 모드에서도 Plugin 승인 게이트가 적용됩니다. 승인이 필요한 도구는 터미널에서 결정을 요청하며, 어떤 것도 자동으로 암묵적 승인되지 않습니다.
- 세션 [목표](/ko/tools/goal)는 바닥글에 표시되며 `/goal`로 관리할 수 있습니다.

## 예시

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "내 구성을 문서와 비교하고 수정할 사항을 알려 줘"
# 에이전트 작업 공간 내에서 실행하면 해당 에이전트를 자동으로 추론함
openclaw tui --session bugfix
```

## 구성 복구 루프

로컬 모드를 사용하면 임베디드 에이전트가 현재 구성을 검사하고 문서와 비교하여 동일한 터미널에서 구성을 복구하도록 지원할 수 있습니다.

`openclaw config validate`가 이미 실패하고 있다면 먼저 `openclaw configure` 또는 `openclaw doctor --fix`를 실행하세요. `openclaw chat`은 잘못된 구성 보호 장치를 우회하지 않습니다.

```bash
openclaw chat
```

그런 다음 TUI 내부에서 다음을 실행합니다.

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` 또는 `openclaw configure`로 필요한 부분을 수정한 다음 `openclaw config validate`를 다시 실행합니다. [TUI](/ko/web/tui) 및 [구성](/ko/cli/config)을 참조하세요.

## 관련 문서

- [CLI 참조](/ko/cli)
- [TUI](/ko/web/tui)
- [목표](/ko/tools/goal)
