---
read_when:
    - TUI를 처음 사용하는 사람도 쉽게 따라 할 수 있는 안내를 원합니다
    - TUI 기능, 명령어 및 단축키의 전체 목록이 필요합니다
summary: '터미널 UI(TUI): Gateway에 연결하거나 임베디드 모드에서 로컬로 실행하기'
title: TUI
x-i18n:
    generated_at: "2026-07-12T01:18:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
    source_path: web/tui.md
    workflow: 16
---

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

3. 메시지를 입력하고 Enter 키를 누릅니다.

원격 Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway가 비밀번호 인증을 사용하는 경우 `--password`를 사용합니다.

### 로컬 모드

Gateway 없이 TUI를 실행합니다.

```bash
openclaw chat
# 또는
openclaw tui --local
```

- `openclaw chat`과 `openclaw terminal`은 `openclaw tui --local`의 별칭입니다.
- `--local`은 `--url`, `--token`, `--password`와 함께 사용할 수 없습니다.
- 로컬 모드는 내장 에이전트 런타임을 직접 사용합니다. 대부분의 로컬 도구는 작동하지만 Gateway 전용 기능은 사용할 수 없습니다.
- 하위 명령 없이 `openclaw`만 실행하면 대상이 자동으로 선택됩니다. 구성되지 않은 설치에서는 추론 온보딩을 실행하고, 구성이 잘못된 경우 기존 Doctor 안내를 열며, 구성된 Gateway에 연결할 수 있으면 이 TUI 셸을 Gateway 모드로 열고, 그렇지 않으면 구성된 로컬 모델로 로컬 모드에서 엽니다.

## 화면 구성

- 헤더: 연결 URL, 현재 에이전트, 현재 세션.
- 채팅 로그: 사용자 메시지, 어시스턴트 응답, 시스템 알림, 도구 카드.
- 상태 표시줄: 연결/실행 상태(연결 중, 실행 중, 스트리밍 중, 유휴, 오류).
- 바닥글: 에이전트 + 세션 + 모델 + 목표 상태 + 생각/고속/상세/추적/추론 + 토큰 수 + 전달. `tui.footer.showRemoteHost`가 활성화된 경우 원격 Gateway 연결에는 연결 호스트도 표시됩니다.
- 입력란: 자동 완성 기능이 있는 텍스트 편집기.

## 개념 모델: 에이전트 + 세션

- 에이전트는 고유한 슬러그입니다(예: `main`, `research`). Gateway가 목록을 제공합니다.
- 세션은 현재 에이전트에 속합니다.
- 세션 키는 `agent:<agentId>:<sessionKey>` 형식으로 저장됩니다.
  - `/session main`을 입력하면 TUI가 이를 `agent:<currentAgent>:main`으로 확장합니다.
  - `/session agent:other:main`을 입력하면 해당 에이전트 세션으로 명시적으로 전환합니다.
- 세션 범위:
  - `per-sender`(기본값): 각 에이전트에 여러 세션이 있습니다.
  - `global`: TUI는 항상 `global` 세션을 사용합니다(선택기가 비어 있을 수 있음).
- 현재 에이전트와 세션은 항상 바닥글에 표시됩니다.
- 로컬이 아닌 URL 기반 연결에서 Gateway 호스트를 표시하려면 다음과 같이 활성화합니다.

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  기본값은 `false`입니다. local loopback 및 내장 로컬 연결에는 호스트 레이블이 표시되지 않습니다.

- 세션에 [목표](/ko/tools/goal)가 있으면 바닥글에 간략한 상태가 표시됩니다.
  `목표 추진 중`, `목표 일시 중지됨(/goal resume)`, `목표 차단됨(/goal resume)` 또는 `목표 달성됨`.
- `--session` 없이 시작하면 Gateway 모드 TUI는 동일한 Gateway, 에이전트, 세션 범위에서 마지막으로 선택한 세션이 여전히 존재하는 경우 해당 세션을 재개합니다. `--session`, `/session`, `/new`, `/reset`을 지정하면 계속 명시적으로 처리됩니다.

## 전송 + 전달

- 메시지는 항상 Gateway(또는 로컬 모드의 내장 런타임)로 전송됩니다. 어시스턴트의 응답을 채팅 제공자에게 다시 전달하는 작업은 기본적으로 꺼져 있는 별도 단계입니다.
- TUI는 일반적인 외부 발신 채널이 아니라 WebChat과 같은 내부 소스 화면입니다. 표시되는 응답에 `tools.message`가 필요한 하네스는 대상 없는 `message.send`로 활성 TUI 턴을 충족할 수 있습니다. 명시적인 제공자 전달은 계속 정상적으로 구성된 채널을 사용하며 `lastChannel`로 대체되지 않습니다.
- 전달 설정은 TUI 세션을 시작할 때 전체 세션에 대해 고정됩니다. 활성화하려면 `openclaw tui --deliver`로 시작합니다. 세션 도중 이를 전환하는 `/deliver` 슬래시 명령이나 설정 토글은 없습니다. 변경하려면 TUI를 다시 시작합니다.

## 선택기 + 오버레이

- 모델 선택기: 사용 가능한 모델을 나열하고 세션 재정의를 설정합니다.
- 에이전트 선택기: 다른 에이전트를 선택합니다.
- 세션 선택기: 최근 7일 이내에 업데이트된 현재 에이전트의 세션을 최대 50개 표시합니다. 더 오래된 기존 세션으로 이동하려면 `/session <key>`를 사용합니다.
- 설정(`/settings`): 도구 출력 펼치기와 생각 표시 여부를 전환합니다. 이 패널에서는 전달을 제어하지 않습니다.

## 키보드 단축키

- Enter: 메시지 전송
- Esc: 활성 실행 중단
- Ctrl+C: 입력 지우기(종료하려면 두 번 누르기)
- Ctrl+D: 종료
- Ctrl+L: 모델 선택기
- Ctrl+G: 에이전트 선택기
- Ctrl+P: 세션 선택기
- Ctrl+O: 도구 출력 펼치기 전환
- Ctrl+T: 생각 표시 전환(기록 다시 불러오기)

## 슬래시 명령

핵심:

- `/help`
- `/status`(Gateway로 전달됨. 세션/모델 요약 표시)
- `/gateway-status`(별칭 `/gwstatus`. Gateway 연결 상태를 직접 표시)
- `/agent <id>`(또는 `/agents`)
- `/session <key>`(또는 `/sessions`)
- `/model <provider/model>`(또는 `/models`)

세션 제어:

- `/think <off|minimal|low|medium|high>`(모델에 따라 상위 단계에 `xhigh`/`max` 같은 수준이 추가될 수 있음)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`(`reset`/`inherit`/`clear`/`default`는 세션 재정의를 지움)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`(별칭: `/elev`)
- `/activation <mention|always>`

세션 수명 주기:

- `/new`(새 키로 독립된 새 세션 생성. 이전 세션의 다른 TUI 클라이언트에는 영향을 주지 않음)
- `/reset`(현재 세션 키를 그대로 유지하며 초기화)
- `/abort`(활성 실행 중단)
- `/settings`
- `/exit`(또는 `/quit`)

로컬 모드 전용:

- `/auth [provider]`는 TUI 안에서 제공자 인증/로그인 흐름을 엽니다.

Crestodian:

- `/crestodian [request]`는 일반 에이전트 TUI에서 [Crestodian](#crestodian-setup-and-repair-helper) 설정/복구 채팅으로 돌아가며, 선택적으로 요청 하나를 전달합니다.

그 밖의 Gateway 슬래시 명령(예: `/context`)은 Gateway로 전달되고 시스템 출력으로 표시됩니다. [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

## 로컬 셸 명령

- TUI 호스트에서 로컬 셸 명령을 실행하려면 줄 앞에 `!`를 붙입니다.
- TUI는 세션마다 한 번 로컬 실행 허용 여부를 묻습니다. 거부하면 해당 세션에서 `!`가 비활성화된 상태로 유지됩니다.
- 명령은 TUI 작업 디렉터리의 새로운 비대화형 셸에서 실행됩니다(지속되는 `cd`/환경 변수 없음).
- 로컬 셸 명령의 환경에는 `OPENCLAW_SHELL=tui-local`이 전달됩니다.
- `!`만 입력하면 일반 메시지로 전송됩니다. 앞에 공백이 있으면 로컬 실행이 시작되지 않습니다.

## Crestodian 설정 및 복구 도우미

Crestodian은 최상위 권한 설정/복구 어시스턴트로, 구성된 기본 모델이 실시간 추론 검사를 통과하면 `openclaw crestodian`으로 사용할 수 있습니다. 추론을 사용할 수 없는 경우 대화형 호출은 추론 온보딩으로 돌아가고 자동화는 복구 안내와 함께 실패합니다. `openclaw tui --local`과 동일한 로컬 TUI 셸 안에서 실행되며, Crestodian의 형식화되고 승인 절차가 적용되는 작업으로 제한된 AI 에이전트를 기반으로 합니다.

```bash
openclaw crestodian                       # 대화형으로 시작
openclaw crestodian -m "status"           # 요청 하나를 실행하고 종료
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # 구성 쓰기 적용
```

- 영구적인 구성 쓰기에는 승인이 필요합니다. 대화형으로 확인하거나 `--yes`를 전달합니다.
- `--json`은 채팅을 시작하는 대신 시작 개요를 JSON으로 출력합니다.
- Crestodian 안에서 `open-tui` 요청(예: 일반 에이전트와 대화하도록 요청)을 하면 Crestodian을 종료하고 일반 에이전트 TUI를 엽니다. 돌아오려면 그곳에서 `/crestodian`을 사용합니다.

현재 구성이 이미 유효하며, 실행 중인 Gateway에 의존하지 않고 같은 컴퓨터에서 내장 에이전트가 구성을 검사하고 문서와 비교하여 불일치를 복구하도록 하려면 로컬 모드를 사용합니다.

`openclaw config validate`가 이미 실패하는 경우 먼저 `openclaw configure` 또는 `openclaw doctor --fix`로 시작합니다. `openclaw chat`을 시작하려면 여전히 불러올 수 있는 구성이 필요합니다.

일반적인 절차:

1. 로컬 모드를 시작합니다.

```bash
openclaw chat
```

2. 에이전트에게 확인할 내용을 요청합니다. 예:

```text
내 Gateway 인증 구성을 문서와 비교하고 가장 작은 수정 사항을 제안해 주세요.
```

3. 정확한 근거와 검증을 위해 로컬 셸 명령을 사용합니다.

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` 또는 `openclaw configure`로 필요한 부분만 변경한 다음 `!openclaw config validate`를 다시 실행합니다.
5. Doctor가 자동 마이그레이션이나 복구를 권장하면 내용을 검토하고 `!openclaw doctor --fix`를 실행합니다.

팁:

- `openclaw.json`을 직접 편집하기보다 `openclaw config set` 또는 `openclaw configure`를 사용하세요.
- `openclaw docs "<query>"`는 동일한 컴퓨터에서 실시간 문서 색인을 검색합니다.
- 구조화된 스키마 및 SecretRef/해결 가능성 오류가 필요할 때는 `openclaw config validate --json`이 유용합니다.

## 도구 출력

- 도구 호출은 인수와 결과가 포함된 카드로 표시됩니다.
- Ctrl+O를 누르면 접힌 보기와 펼친 보기 사이를 전환합니다.
- 도구가 실행되는 동안 부분 업데이트가 동일한 카드에 스트리밍됩니다.

## 터미널 색상

- TUI는 어두운 터미널과 밝은 터미널 모두에서 읽기 쉽도록 어시스턴트 본문 텍스트에 터미널의 기본 전경색을 사용합니다.
- 터미널이 밝은 배경을 사용하고 자동 감지가 잘못된 경우 `openclaw tui`를 실행하기 전에 `OPENCLAW_THEME=light`를 설정합니다.
- 기존 어두운 색상표를 강제로 사용하려면 대신 `OPENCLAW_THEME=dark`를 설정합니다.

## 기록 + 스트리밍

- 연결되면 TUI가 최신 기록을 불러옵니다(기본값 200개 메시지).
- 스트리밍 응답은 완료될 때까지 제자리에서 업데이트됩니다.
- TUI는 더 풍부한 도구 카드를 제공하기 위해 에이전트 도구 이벤트도 수신합니다.

## 연결 세부 정보

- TUI는 대략적인 `ui` 클라이언트 모드에서 클라이언트 ID `openclaw-tui`로 연결됩니다(Control UI와 WebChat이 Gateway 정책에 사용하는 것과 동일한 모드).
- 다시 연결되면 시스템 메시지가 표시되며, 이벤트 누락은 로그에 나타납니다.

## 옵션

- `--local`: 로컬 내장 에이전트 런타임을 대상으로 실행
- `--url <url>`: Gateway WebSocket URL(기본값은 구성의 `gateway.remote.url`, 또는 local loopback의 `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway 토큰(필요한 경우)
- `--password <password>`: Gateway 비밀번호(필요한 경우)
- `--tls-fingerprint <sha256>`: 인증서가 고정된 `wss://` Gateway에 필요한 TLS 인증서 지문
- `--session <key>`: 세션 키(기본값: `main`, 범위가 전역이면 `global`)
- `--deliver`: 어시스턴트 응답을 제공자에게 전달(기본적으로 꺼짐)
- `--thinking <level>`: 전송 시 생각 수준 재정의
- `--message <text>`: 연결 후 초기 메시지 전송
- `--timeout-ms <ms>`: 에이전트 제한 시간(밀리초, 기본값은 `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 불러올 기록 항목 수(기본값 `200`)

<Warning>
`--url`을 설정하면 TUI는 구성이나 환경 자격 증명으로 대체하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하고, 대상이 고정 인증서를 사용하는 경우 `--tls-fingerprint`도 함께 전달합니다. 명시적인 자격 증명이 없으면 오류가 발생합니다. 로컬 모드에서는 `--url`, `--token`, `--password`, `--tls-fingerprint`를 전달하지 마세요.
</Warning>

## 문제 해결

메시지를 보낸 후 출력이 없는 경우:

- TUI에서 `/status`를 실행하여 Gateway가 연결되어 있고 유휴/작업 중인지 확인합니다.
- Gateway 로그를 확인합니다: `openclaw logs --follow`.
- 에이전트가 실행 가능한지 확인합니다: `openclaw status` 및 `openclaw models status`.
- 채팅 채널에 메시지가 표시될 것으로 예상한다면 TUI가 `--deliver`로 시작되었는지 확인합니다(다시 시작하지 않고 나중에 활성화할 수 없음).

## 연결 문제 해결

- `disconnected`: Gateway가 실행 중이고 `--url/--token/--password`가 올바른지 확인합니다.
- 선택기에 에이전트가 없음: `openclaw agents list`와 라우팅 구성을 확인합니다.
- 세션 선택기가 비어 있음: 전역 범위에 있거나 아직 세션이 없을 수 있습니다.

## 관련 문서

- [Control UI](/ko/web/control-ui) — 웹 기반 제어 인터페이스
- [구성](/ko/cli/config) — `openclaw.json` 검사, 검증 및 편집
- [Doctor](/ko/cli/doctor) — 안내식 복구 및 마이그레이션 검사
- [CLI 참조](/ko/cli) — 전체 CLI 명령 참조
