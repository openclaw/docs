---
read_when:
    - 초보자도 쉽게 이해할 수 있는 TUI 안내를 원합니다
    - TUI 기능, 명령어 및 단축키의 전체 목록이 필요합니다
summary: '터미널 UI(TUI): Gateway에 연결하거나 임베디드 모드에서 로컬로 실행하기'
title: TUI
x-i18n:
    generated_at: "2026-07-16T13:07:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
    source_path: web/tui.md
    workflow: 16
---

## 빠른 시작

### Gateway 모드

1. Gateway를 시작하십시오.

```bash
openclaw gateway
```

2. TUI를 여십시오.

```bash
openclaw tui
```

3. 메시지를 입력하고 Enter를 누르십시오.

원격 Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway에서 비밀번호 인증을 사용하는 경우 `--password`을 사용하십시오.

### 로컬 모드

Gateway 없이 TUI를 실행하십시오.

```bash
openclaw chat
# 또는
openclaw tui --local
```

- `openclaw chat` 및 `openclaw terminal`은 `openclaw tui --local`의 별칭입니다.
- `--local`은 `--url`, `--token` 또는 `--password`과 함께 사용할 수 없습니다.
- 로컬 모드는 내장 에이전트 런타임을 직접 사용합니다. 대부분의 로컬 도구는 작동하지만 Gateway 전용 기능은 사용할 수 없습니다.
- 하위 명령이 없는 `openclaw`은 대상을 자동으로 선택합니다. 구성되지 않은 설치에서는 추론 온보딩을 실행하고, 구성이 유효하지 않으면 기존 Doctor 안내를 열며, 구성되어 있고 연결 가능한 Gateway가 있으면 이 TUI 셸을 Gateway 모드로 열고, 그렇지 않고 구성된 로컬 모델이 있으면 로컬 모드로 엽니다.

## 표시되는 항목

- 헤더: 연결 URL, 현재 에이전트, 현재 세션.
- 채팅 로그: 사용자 메시지, 어시스턴트 응답, 시스템 알림, 도구 카드.
- 상태 표시줄: 연결/실행 상태(연결 중, 실행 중, 스트리밍 중, 유휴, 오류).
- 바닥글: 에이전트 + 세션 + 모델 + 목표 상태 + 사고/고속/상세/추적/추론 + 토큰 수 + 전달. `tui.footer.showRemoteHost`이 활성화되어 있으면 원격 Gateway 연결에도 연결 호스트가 표시됩니다.
- 입력: 자동 완성 기능이 있는 텍스트 편집기.

## 개념 모델: 에이전트 + 세션

- 에이전트에는 고유한 슬러그가 있습니다(예: `main`, `research`). Gateway가 목록을 제공합니다.
- 세션은 현재 에이전트에 속합니다.
- 세션 키는 `agent:<agentId>:<sessionKey>` 형식으로 저장됩니다.
  - `/session main`을 입력하면 TUI가 이를 `agent:<currentAgent>:main`로 확장합니다.
  - `/session agent:other:main`을 입력하면 해당 에이전트 세션으로 명시적으로 전환합니다.
- 세션 범위:
  - `per-sender`(기본값): 각 에이전트에 여러 세션이 있습니다.
  - `global`: TUI는 항상 `global` 세션을 사용합니다(선택기가 비어 있을 수 있음).
- 현재 에이전트와 세션은 항상 바닥글에 표시됩니다.
- 로컬이 아닌 URL 기반 연결에서 Gateway 호스트를 표시하려면 다음과 같이 활성화하십시오.

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  기본값은 `false`입니다. 루프백 및 내장 로컬 연결에는 호스트 레이블이 표시되지 않습니다.

- 세션에 [목표](/ko/tools/goal)가 있으면 바닥글에 간략한 상태가 표시됩니다.
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` 또는 `Goal achieved`.
- `--session` 없이 시작하면 Gateway 모드 TUI는 동일한 Gateway, 에이전트 및 세션 범위에서 마지막으로 선택한 세션이 여전히 존재할 경우 해당 세션을 재개합니다. `--session`, `/session`, `/new` 또는 `/reset`을 전달하면 명시적 지정으로 유지됩니다.

## 전송 + 전달

- 메시지는 항상 Gateway(또는 로컬 모드의 내장 런타임)로 전송됩니다. 어시스턴트의 응답을 채팅 제공자에게 다시 전달하는 작업은 기본적으로 비활성화된 별도의 단계입니다.
- TUI는 일반적인 외부 전송 채널이 아니라 WebChat과 같은 내부 소스 인터페이스입니다. 표시되는 응답에 `tools.message`이 필요한 하네스는 대상이 없는 `message.send`으로 활성 TUI 턴을 충족할 수 있습니다. 명시적인 제공자 전달에는 계속 일반적으로 구성된 채널을 사용하며 `lastChannel`으로 대체되지 않습니다.
- 전달 설정은 시작 시 전체 TUI 세션에 대해 고정됩니다. 활성화하려면 `openclaw tui --deliver`으로 시작하십시오. 세션 도중 이를 전환하는 `/deliver` 슬래시 명령이나 설정 토글은 없습니다. 변경하려면 TUI를 다시 시작하십시오.

## 선택기 + 오버레이

- 모델 선택기: 사용 가능한 모델을 나열하고 세션 재정의를 설정합니다.
- 에이전트 선택기: 다른 에이전트를 선택합니다.
- 세션 선택기: 지난 7일 동안 업데이트된 현재 에이전트의 세션을 최대 50개 표시합니다. 더 오래된 기존 세션으로 이동하려면 `/session <key>`을 사용하십시오.
- 설정(`/settings`): 도구 출력 확장과 사고 과정 표시 여부를 전환합니다. 이 패널에서는 전달을 제어하지 않습니다.

## 키보드 단축키

- Enter: 메시지 전송
- Esc: 활성 실행 중단
- Ctrl+C: 입력 지우기(종료하려면 두 번 누름)
- Ctrl+D: 종료
- Ctrl+L: 모델 선택기
- Ctrl+G: 에이전트 선택기
- Ctrl+P: 세션 선택기
- Ctrl+O: 도구 출력 확장 전환
- Ctrl+T: 사고 과정 표시 전환(기록 다시 로드)

## 슬래시 명령

핵심:

- `/help`
- `/status`(Gateway로 전달됨, 세션/모델 요약 표시)
- `/gateway-status`(별칭 `/gwstatus`, Gateway 연결 상태를 직접 표시)
- `/agent <id>`(또는 `/agents`)
- `/session <key>`(또는 `/sessions`)
- `/model <provider/model>`(또는 `/models`)

세션 제어:

- `/think <off|minimal|low|medium|high>`(모델에 따라 상위 등급에서 `xhigh`/`max` 같은 수준을 추가할 수 있음)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`(`reset`/`inherit`/`clear`/`default`은 세션 재정의를 지움)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`(별칭: `/elev`)
- `/activation <mention|always>`

세션 수명 주기:

- `/new`(새 키 아래에 새롭고 격리된 세션을 생성하며, 이전 세션의 다른 TUI 클라이언트에는 영향을 주지 않음)
- `/reset`(현재 세션 키를 제자리에서 초기화)
- `/abort`(활성 실행 중단)
- `/settings`
- `/exit`(또는 `/quit`)

로컬 모드 전용:

- `/auth [provider]`은 TUI 내부에서 제공자 인증/로그인 흐름을 엽니다.

OpenClaw:

- `/openclaw [request]`은 일반 에이전트 TUI에서 [OpenClaw](#openclaw-setup-and-repair-helper) 설정/복구 채팅으로 돌아가며, 선택적으로 요청 하나를 전달합니다.

그 밖의 Gateway 슬래시 명령(예: `/context`)은 Gateway로 전달되고 시스템 출력으로 표시됩니다. [슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.

## 로컬 셸 명령

- TUI 호스트에서 로컬 셸 명령을 실행하려면 줄 앞에 `!`을 붙이십시오.
- TUI는 세션마다 한 번 로컬 실행 허용 여부를 묻습니다. 거부하면 해당 세션에서 `!`이 비활성화된 상태로 유지됩니다.
- 명령은 TUI 작업 디렉터리의 새로운 비대화형 셸에서 실행됩니다(지속되는 `cd`/환경 없음).
- 로컬 셸 명령의 환경에는 `OPENCLAW_SHELL=tui-local`이 제공됩니다.
- `!`만 단독으로 입력하면 일반 메시지로 전송됩니다. 앞쪽 공백은 로컬 실행을 트리거하지 않습니다.

## OpenClaw 설정 및 복구 도우미

OpenClaw는 최상위 권한의 설정/복구 어시스턴트이며, 구성된 기본 모델이 실시간 추론 검사를 통과하면 `openclaw setup`으로 제공됩니다. 추론을 사용할 수 없으면 대화형 호출은 추론 온보딩으로 돌아가고 자동화는 복구 안내와 함께 실패합니다. `openclaw tui --local`과 동일한 로컬 TUI 셸 내부에서 실행되며, OpenClaw의 형식화되고 승인이 필요한 작업으로 제한된 AI 에이전트를 기반으로 합니다.

```bash
openclaw setup                       # 대화형으로 시작
openclaw setup -m "status"           # 요청 하나를 실행하고 종료
openclaw setup -m "set default model openai/gpt-5.2" --yes   # 구성 쓰기 적용
```

- 영구적인 구성 쓰기에는 승인이 필요합니다. 대화형으로 확인하거나 `--yes`을 전달하십시오.
- `--json`은 채팅을 시작하는 대신 시작 개요를 JSON으로 출력합니다.
- OpenClaw 내부에서 `open-tui` 요청(예: 일반 에이전트와 대화하도록 요청)을 하면 OpenClaw를 종료하고 일반 에이전트 TUI를 엽니다. 그곳에서 돌아오려면 `/openclaw`을 사용하십시오.

현재 구성이 이미 검증되었고, 실행 중인 Gateway에 의존하지 않은 채 동일한 머신에서 내장 에이전트가 구성을 검사하고 문서와 비교하며 구성 불일치를 복구하도록 하려면 로컬 모드를 사용하십시오.

`openclaw config validate`이 이미 실패하는 경우 먼저 `openclaw configure` 또는 `openclaw doctor --fix`으로 시작하십시오. `openclaw chat`을 시작하려면 여전히 로드 가능한 구성이 필요합니다.

일반적인 반복 절차:

1. 로컬 모드를 시작하십시오.

```bash
openclaw chat
```

2. 확인하려는 내용을 에이전트에게 요청하십시오. 예:

```text
내 Gateway 인증 구성을 문서와 비교하고 가장 작은 수정 사항을 제안하십시오.
```

3. 정확한 근거와 검증에는 로컬 셸 명령을 사용하십시오.

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` 또는 `openclaw configure`으로 범위가 좁은 변경 사항을 적용한 다음 `!openclaw config validate`을 다시 실행하십시오.
5. Doctor가 자동 마이그레이션이나 복구를 권장하면 내용을 검토하고 `!openclaw doctor --fix`을 실행하십시오.

팁:

- `openclaw.json`을 직접 편집하기보다 `openclaw config set` 또는 `openclaw configure`을 사용하십시오.
- `openclaw docs "<query>"`은 동일한 머신에서 실시간 문서 색인을 검색합니다.
- 구조화된 스키마와 SecretRef/해결 가능성 오류를 확인하려면 `openclaw config validate --json`이 유용합니다.

## 도구 출력

- 도구 호출은 인수와 결과가 포함된 카드로 표시됩니다.
- Ctrl+O는 축소된 보기와 확장된 보기 사이를 전환합니다.
- 도구가 실행되는 동안 부분 업데이트가 동일한 카드에 스트리밍됩니다.

## 터미널 색상

- TUI는 어두운 터미널과 밝은 터미널 모두에서 읽기 쉽도록 어시스턴트 본문 텍스트에 터미널의 기본 전경색을 사용합니다.
- 터미널에서 밝은 배경을 사용하며 자동 감지가 잘못된 경우 `openclaw tui`을 시작하기 전에 `OPENCLAW_THEME=light`을 설정하십시오.
- 대신 원래의 어두운 팔레트를 강제로 사용하려면 `OPENCLAW_THEME=dark`을 설정하십시오.

## 기록 + 스트리밍

- 연결되면 TUI는 최신 기록을 로드합니다(기본값: 메시지 200개).
- 스트리밍 응답은 완료될 때까지 제자리에서 업데이트됩니다.
- TUI는 더 풍부한 도구 카드를 제공하기 위해 에이전트 도구 이벤트도 수신합니다.

## 연결 세부 정보

- TUI는 대략적인 `ui` 클라이언트 모드에서 클라이언트 ID `openclaw-tui`으로 연결됩니다(Control UI와 WebChat이 Gateway 정책에 사용하는 것과 동일한 모드).
- 재연결은 시스템 메시지로 표시되며, 이벤트 누락은 로그에 나타납니다.

## 옵션

- `--local`: 로컬 임베디드 에이전트 런타임에서 실행합니다
- `--url <url>`: Gateway WebSocket URL(기본값은 구성의 `gateway.remote.url` 또는 루프백의 `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway 토큰(필요한 경우)
- `--password <password>`: Gateway 비밀번호(필요한 경우)
- `--tls-fingerprint <sha256>`: 인증서가 고정된 `wss://` Gateway에 필요한 TLS 인증서 지문
- `--session <key>`: 세션 키(기본값: `main`, 범위가 전역이면 `global`)
- `--deliver`: 어시스턴트 응답을 제공자에게 전달합니다(기본값: 꺼짐)
- `--thinking <level>`: 전송 시 사고 수준을 재정의합니다
- `--message <text>`: 연결 후 초기 메시지를 전송합니다
- `--timeout-ms <ms>`: 에이전트 제한 시간(ms, 기본값은 `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 불러올 기록 항목 수(기본값: `200`)

<Warning>
`--url`을 설정하면 TUI가 구성 또는 환경 자격 증명으로 대체하지 않습니다. `--token` 또는 `--password`을 명시적으로 전달하고, 대상이 고정 인증서를 사용하는 경우 `--tls-fingerprint`도 전달하십시오. 명시적 자격 증명이 없으면 오류가 발생합니다. 로컬 모드에서는 `--url`, `--token`, `--password` 또는 `--tls-fingerprint`을 전달하지 마십시오.
</Warning>

## 문제 해결

메시지를 전송한 후 출력이 없는 경우:

- TUI에서 `/status`을 실행하여 Gateway가 연결되어 있으며 유휴/사용 중 상태인지 확인하십시오.
- Gateway 로그를 확인하십시오: `openclaw logs --follow`.
- 에이전트를 실행할 수 있는지 확인하십시오: `openclaw status` 및 `openclaw models status`.
- 채팅 채널에서 메시지가 표시되어야 한다면 TUI가 `--deliver`과 함께 시작되었는지 확인하십시오(다시 시작하지 않고 나중에 활성화할 수는 없습니다).

## 연결 문제 해결

- `disconnected`: Gateway가 실행 중이고 `--url/--token/--password`이 올바른지 확인하십시오.
- 선택기에 에이전트가 없는 경우: `openclaw agents list` 및 라우팅 구성을 확인하십시오.
- 세션 선택기가 비어 있는 경우: 전역 범위에 있거나 아직 세션이 없을 수 있습니다.

## 관련 문서

- [제어 UI](/ko/web/control-ui) — 웹 기반 제어 인터페이스
- [구성](/ko/cli/config) — `openclaw.json`을 검사하고 검증하고 편집합니다
- [Doctor](/ko/cli/doctor) — 안내식 복구 및 마이그레이션 검사
- [CLI 참조](/ko/cli) — 전체 CLI 명령 참조
