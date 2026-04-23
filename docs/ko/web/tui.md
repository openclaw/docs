---
read_when:
    - TUI에 대한 초보자 친화적인 안내가 필요합니다.
    - TUI 기능, 명령, 단축키의 전체 목록이 필요합니다.
summary: 'Terminal UI (TUI): Gateway에 연결하거나 내장 모드로 로컬 실행하기'
title: TUI
x-i18n:
    generated_at: "2026-04-23T14:10:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (Terminal UI)

## 빠른 시작

### Gateway 모드

1. Gateway를 시작합니다.

```bash
openclaw gateway
```

2. TUI를 엽니다.

```bash
openclaw tui
```

3. 메시지를 입력하고 Enter를 누릅니다.

원격 Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway가 비밀번호 인증을 사용한다면 `--password`를 사용하세요.

### 로컬 모드

Gateway 없이 TUI를 실행합니다:

```bash
openclaw chat
# 또는
openclaw tui --local
```

참고:

- `openclaw chat`와 `openclaw terminal`은 `openclaw tui --local`의 별칭입니다.
- `--local`은 `--url`, `--token`, `--password`와 함께 사용할 수 없습니다.
- 로컬 모드는 내장 agent 런타임을 직접 사용합니다. 대부분의 로컬 도구는 동작하지만, Gateway 전용 기능은 사용할 수 없습니다.

## 표시되는 내용

- Header: 연결 URL, 현재 agent, 현재 세션.
- 채팅 로그: 사용자 메시지, assistant 응답, 시스템 알림, 도구 카드.
- 상태 줄: 연결/실행 상태(connecting, running, streaming, idle, error).
- Footer: 연결 상태 + agent + 세션 + 모델 + think/fast/verbose/trace/reasoning + token 수 + deliver.
- 입력창: 자동완성이 있는 텍스트 편집기.

## 멘탈 모델: agent + 세션

- agent는 고유 slug입니다(예: `main`, `research`). Gateway가 목록을 노출합니다.
- 세션은 현재 agent에 속합니다.
- 세션 키는 `agent:<agentId>:<sessionKey>`로 저장됩니다.
  - `/session main`을 입력하면 TUI는 이를 `agent:<currentAgent>:main`으로 확장합니다.
  - `/session agent:other:main`을 입력하면 해당 agent 세션으로 명시적으로 전환합니다.
- 세션 범위:
  - `per-sender`(기본값): 각 agent는 여러 세션을 가집니다.
  - `global`: TUI는 항상 `global` 세션을 사용합니다(선택기는 비어 있을 수 있음).
- 현재 agent + 세션은 항상 footer에 표시됩니다.

## 전송 + 전달

- 메시지는 Gateway로 전송되며, provider로의 전달은 기본적으로 꺼져 있습니다.
- 전달을 켜려면:
  - `/deliver on`
  - 또는 Settings 패널
  - 또는 `openclaw tui --deliver`로 시작

## 선택기 + 오버레이

- 모델 선택기: 사용 가능한 모델을 나열하고 세션 재정의를 설정합니다.
- agent 선택기: 다른 agent를 선택합니다.
- 세션 선택기: 현재 agent의 세션만 표시합니다.
- Settings: deliver, 도구 출력 확장, thinking 표시를 토글합니다.

## 키보드 단축키

- Enter: 메시지 전송
- Esc: 활성 실행 중단
- Ctrl+C: 입력 지우기(두 번 누르면 종료)
- Ctrl+D: 종료
- Ctrl+L: 모델 선택기
- Ctrl+G: agent 선택기
- Ctrl+P: 세션 선택기
- Ctrl+O: 도구 출력 확장 토글
- Ctrl+T: thinking 표시 토글(기록 다시 로드)

## 슬래시 명령

핵심:

- `/help`
- `/status`
- `/agent <id>` (또는 `/agents`)
- `/session <key>` (또는 `/sessions`)
- `/model <provider/model>` (또는 `/models`)

세션 제어:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (별칭: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

세션 라이프사이클:

- `/new` 또는 `/reset` (세션 재설정)
- `/abort` (활성 실행 중단)
- `/settings`
- `/exit`

로컬 모드 전용:

- `/auth [provider]`는 TUI 내부에서 provider auth/login 흐름을 엽니다.

다른 Gateway 슬래시 명령(예: `/context`)은 Gateway로 전달되어 시스템 출력으로 표시됩니다. [Slash commands](/ko/tools/slash-commands)를 참조하세요.

## 로컬 shell 명령

- 줄 맨 앞에 `!`를 붙이면 TUI 호스트에서 로컬 shell 명령을 실행합니다.
- TUI는 세션당 한 번 로컬 실행 허용 여부를 묻습니다. 거부하면 그 세션에서는 `!`가 비활성화됩니다.
- 명령은 TUI 작업 디렉터리에서 새로운 비대화형 shell로 실행됩니다(지속되는 `cd`/env 없음).
- 로컬 shell 명령은 environment에서 `OPENCLAW_SHELL=tui-local`을 받습니다.
- 단독 `!`는 일반 메시지로 전송되며, 앞에 공백이 있으면 로컬 실행이 트리거되지 않습니다.

## 로컬 TUI에서 config 복구

현재 config가 이미 유효하고, 같은 머신에서 내장 agent가 이를 검사하고 문서와 비교하며
실행 중인 Gateway에 의존하지 않고 drift 복구를 돕게 하려면 로컬 모드를 사용하세요.

`openclaw config validate`가 이미 실패하고 있다면, 먼저 `openclaw configure`
또는 `openclaw doctor --fix`로 시작하세요. `openclaw chat`은 유효하지 않은
config 가드를 우회하지 않습니다.

일반적인 흐름:

1. 로컬 모드 시작:

```bash
openclaw chat
```

2. 예를 들어 agent에게 확인하려는 내용을 요청합니다:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 정확한 증거와 검증을 위해 로컬 shell 명령을 사용합니다:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` 또는 `openclaw configure`로 범위를 좁힌 변경을 적용한 뒤 `!openclaw config validate`를 다시 실행합니다.
5. Doctor가 자동 마이그레이션 또는 복구를 권장하면 검토 후 `!openclaw doctor --fix`를 실행합니다.

팁:

- `openclaw.json`을 직접 편집하기보다 `openclaw config set` 또는 `openclaw configure`를 우선 사용하세요.
- `openclaw docs "<query>"`는 같은 머신의 라이브 문서 인덱스를 검색합니다.
- 구조화된 스키마 및 SecretRef/확인 가능성 오류가 필요할 때는 `openclaw config validate --json`이 유용합니다.

## 도구 출력

- 도구 호출은 인수 + 결과가 포함된 카드로 표시됩니다.
- Ctrl+O로 접힌 보기/확장 보기 사이를 전환합니다.
- 도구 실행 중에는 부분 업데이트가 같은 카드로 스트리밍됩니다.

## 터미널 색상

- TUI는 assistant 본문 텍스트를 터미널 기본 전경색으로 유지하므로, 어두운 터미널과 밝은 터미널 모두에서 읽기 쉽습니다.
- 터미널이 밝은 배경을 사용하고 자동 감지가 잘못된다면 `openclaw tui` 실행 전에 `OPENCLAW_THEME=light`를 설정하세요.
- 원래의 어두운 팔레트를 강제로 사용하려면 대신 `OPENCLAW_THEME=dark`를 설정하세요.

## 기록 + 스트리밍

- 연결 시 TUI는 최신 기록을 로드합니다(기본값 200개 메시지).
- 스트리밍 응답은 최종 확정될 때까지 제자리에서 업데이트됩니다.
- TUI는 더 풍부한 도구 카드를 위해 agent 도구 이벤트도 수신합니다.

## 연결 세부 사항

- TUI는 `mode: "tui"`로 Gateway에 등록됩니다.
- 재연결 시 시스템 메시지가 표시되며, 이벤트 공백은 로그에 표시됩니다.

## 옵션

- `--local`: 로컬 내장 agent 런타임에 대해 실행
- `--url <url>`: Gateway WebSocket URL(기본값은 config 또는 `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway 토큰(필요한 경우)
- `--password <password>`: Gateway 비밀번호(필요한 경우)
- `--session <key>`: 세션 키(기본값: `main`, 또는 범위가 global이면 `global`)
- `--deliver`: assistant 응답을 provider에 전달(기본값 꺼짐)
- `--thinking <level>`: 전송 시 thinking level 재정의
- `--message <text>`: 연결 후 초기 메시지 전송
- `--timeout-ms <ms>`: 밀리초 단위 agent 타임아웃(기본값은 `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 로드할 기록 항목 수(기본값 `200`)

참고: `--url`을 설정하면 TUI는 config 또는 environment credentials로 폴백하지 않습니다.
`--token` 또는 `--password`를 명시적으로 전달하세요. 명시적인 credentials가 없으면 오류입니다.
로컬 모드에서는 `--url`, `--token`, `--password`를 전달하지 마세요.

## 문제 해결

메시지를 보낸 뒤 출력이 없다면:

- TUI에서 `/status`를 실행해 Gateway가 연결되어 있고 idle/busy 상태인지 확인하세요.
- Gateway 로그를 확인하세요: `openclaw logs --follow`
- agent가 실행 가능한지 확인하세요: `openclaw status` 및 `openclaw models status`
- 채팅 채널에서 메시지를 기대한다면 전달을 활성화하세요(`/deliver on` 또는 `--deliver`).

## 연결 문제 해결

- `disconnected`: Gateway가 실행 중인지, `--url/--token/--password`가 올바른지 확인하세요.
- 선택기에 agent가 없음: `openclaw agents list`와 라우팅 config를 확인하세요.
- 세션 선택기가 비어 있음: global 범위일 수 있거나 아직 세션이 없을 수 있습니다.

## 관련 항목

- [Control UI](/ko/web/control-ui) — 웹 기반 제어 인터페이스
- [Config](/ko/cli/config) — `openclaw.json` 검사, 검증, 편집
- [Doctor](/ko/cli/doctor) — 안내형 복구 및 마이그레이션 검사
- [CLI Reference](/ko/cli) — 전체 CLI 명령 참조
