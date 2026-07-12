---
read_when:
    - 초보자도 쉽게 따라 할 수 있는 TUI 안내가 필요합니다
    - TUI 기능, 명령어, 단축키의 전체 목록이 필요합니다
summary: '터미널 UI(TUI): Gateway에 연결하거나 임베디드 모드에서 로컬로 실행하기'
title: TUI
x-i18n:
    generated_at: "2026-07-12T15:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

Gateway에서 비밀번호 인증을 사용하는 경우 `--password`를 사용합니다.

### 로컬 모드

Gateway 없이 TUI를 실행합니다.

```bash
openclaw chat
# 또는
openclaw tui --local
```

- `openclaw chat`과 `openclaw terminal`은 `openclaw tui --local`의 별칭입니다.
- `--local`은 `--url`, `--token` 또는 `--password`와 함께 사용할 수 없습니다.
- 로컬 모드는 내장된 에이전트 런타임을 직접 사용합니다. 대부분의 로컬 도구는 작동하지만 Gateway 전용 기능은 사용할 수 없습니다.
- 하위 명령이 없는 `openclaw`는 대상을 자동으로 선택합니다. 구성되지 않은 설치에서는 추론 온보딩을 실행하고, 잘못된 구성이 있으면 기존 doctor 안내를 열며, 구성된 Gateway에 연결할 수 있으면 이 TUI 셸을 Gateway 모드로 열고, 그렇지 않으면 구성된 로컬 모델이 있을 때 로컬 모드로 엽니다.

## 화면 구성

- 헤더: 연결 URL, 현재 에이전트, 현재 세션.
- 채팅 로그: 사용자 메시지, 어시스턴트 응답, 시스템 알림, 도구 카드.
- 상태 표시줄: 연결/실행 상태(연결 중, 실행 중, 스트리밍 중, 유휴, 오류).
- 바닥글: 에이전트 + 세션 + 모델 + 목표 상태 + 생각/빠른 응답/상세 출력/추적/추론 + 토큰 수 + 전달. `tui.footer.showRemoteHost`가 활성화되면 원격 Gateway 연결에도 연결 호스트가 표시됩니다.
- 입력: 자동 완성을 지원하는 텍스트 편집기.

## 개념 모델: 에이전트 + 세션

- 에이전트는 고유한 슬러그입니다(예: `main`, `research`). Gateway에서 목록을 제공합니다.
- 세션은 현재 에이전트에 속합니다.
- 세션 키는 `agent:<agentId>:<sessionKey>` 형식으로 저장됩니다.
  - `/session main`을 입력하면 TUI가 이를 `agent:<currentAgent>:main`으로 확장합니다.
  - `/session agent:other:main`을 입력하면 해당 에이전트 세션으로 명시적으로 전환합니다.
- 세션 범위:
  - `per-sender`(기본값): 각 에이전트에 여러 세션이 있습니다.
  - `global`: TUI는 항상 `global` 세션을 사용합니다(선택기가 비어 있을 수 있습니다).
- 현재 에이전트와 세션은 항상 바닥글에 표시됩니다.
- 로컬이 아닌 URL 기반 연결에서 Gateway 호스트를 표시하려면 다음 설정으로 활성화합니다:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  기본값은 `false`입니다. 루프백 및 임베디드 로컬 연결에는 호스트 레이블이 표시되지 않습니다.

- 세션에 [목표](/ko/tools/goal)가 있으면 바닥글에 다음과 같은 간략 상태가 표시됩니다:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)`, 또는 `Goal achieved`.
- `--session` 없이 시작하면 Gateway 모드 TUI는 해당 세션이 여전히 존재하는 경우 동일한 Gateway, 에이전트 및 세션 범위에서 마지막으로 선택한 세션을 재개합니다. `--session`, `/session`, `/new`, 또는 `/reset`을 전달하면 명시적 지정으로 유지됩니다.

## 전송 + 전달

- 메시지는 항상 Gateway(또는 로컬 모드의 임베디드 런타임)로 전송됩니다. 어시스턴트의 응답을 채팅 제공자에게 다시 전달하는 작업은 기본적으로 비활성화된 별도 단계입니다.
- TUI는 WebChat과 같은 내부 소스 화면이며, 일반적인 아웃바운드 채널이 아닙니다. 표시되는 응답에 `tools.message`가 필요한 하네스는 대상 없는 `message.send`를 사용하여 활성 TUI 턴을 충족할 수 있습니다. 명시적인 제공자 전달에는 여전히 정상적으로 구성된 채널을 사용하며, 절대로 `lastChannel`로 대체하지 않습니다.
- 전달 설정은 시작 시 전체 TUI 세션에 대해 고정됩니다. 활성화하려면 `openclaw tui --deliver`로 시작하십시오. 세션 도중 전환할 수 있는 `/deliver` 슬래시 명령어나 Settings 토글은 없습니다. 설정을 변경하려면 TUI를 다시 시작하십시오.

## 선택기 + 오버레이

- 모델 선택기: 사용 가능한 모델을 나열하고 세션 재정의를 설정합니다.
- 에이전트 선택기: 다른 에이전트를 선택합니다.
- 세션 선택기: 지난 7일 동안 업데이트된 현재 에이전트의 세션을 최대 50개까지 표시합니다. 더 오래된 알려진 세션으로 이동하려면 `/session <key>`를 사용하십시오.
- 설정(`/settings`): 도구 출력 확장과 사고 과정 표시 여부를 전환합니다. 이 패널에서는 전달을 제어하지 않습니다.

## 키보드 단축키

- Enter: 메시지 전송
- Esc: 활성 실행 중단
- Ctrl+C: 입력 지우기(종료하려면 두 번 누르기)
- Ctrl+D: 종료
- Ctrl+L: 모델 선택기
- Ctrl+G: 에이전트 선택기
- Ctrl+P: 세션 선택기
- Ctrl+O: 도구 출력 확장 전환
- Ctrl+T: 사고 과정 표시 여부 전환(기록을 다시 불러옴)

## 슬래시 명령어

핵심:

- `/help`
- `/status` (Gateway를 통해 전달되며, 세션/모델 요약을 표시합니다)
- `/gateway-status` (별칭 `/gwstatus`; Gateway 연결 상태를 직접 표시합니다)
- `/agent <id>` (또는 `/agents`)
- `/session <key>` (또는 `/sessions`)
- `/model <provider/model>` (또는 `/models`)

세션 제어:

- `/think <off|minimal|low|medium|high>` (모델에 따라 상위 단계에 `xhigh`/`max`와 같은 수준이 추가될 수 있습니다)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default`는 세션 재정의를 지웁니다)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (별칭: `/elev`)
- `/activation <mention|always>`

세션 수명 주기:

- `/new` (새 키로 완전히 분리된 새 세션을 생성하며, 이전 세션을 사용하는 다른 TUI 클라이언트에는 영향을 주지 않습니다)
- `/reset` (현재 세션 키를 그대로 유지하면서 세션을 재설정합니다)
- `/abort` (활성 실행을 중단합니다)
- `/settings`
- `/exit` (또는 `/quit`)

로컬 모드 전용:

- `/auth [provider]`는 TUI 내에서 제공자 인증/로그인 절차를 엽니다.

Crestodian:

- `/crestodian [request]`는 일반 에이전트 TUI에서 [Crestodian](#crestodian-setup-and-repair-helper) 설정/복구 채팅으로 돌아가며, 선택적으로 요청 하나를 전달합니다.

그 밖의 Gateway 슬래시 명령(예: `/context`)은 Gateway로 전달되고 시스템 출력으로 표시됩니다. [슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.

## 로컬 셸 명령

- 줄 앞에 `!`를 붙이면 TUI 호스트에서 로컬 셸 명령을 실행합니다.
- TUI는 세션마다 한 번 로컬 실행 허용 여부를 묻습니다. 거부하면 해당 세션에서 `!`가 비활성화된 상태로 유지됩니다.
- 명령은 TUI 작업 디렉터리의 새로운 비대화형 셸에서 실행됩니다(`cd`/환경 변수는 유지되지 않음).
- 로컬 셸 명령의 환경에는 `OPENCLAW_SHELL=tui-local`이 전달됩니다.
- `!`만 단독으로 입력하면 일반 메시지로 전송됩니다. 앞에 공백이 있으면 로컬 실행이 트리거되지 않습니다.

## Crestodian 설정 및 복구 도우미

Crestodian은 링 제로 설정/복구 도우미이며, 구성된 기본 모델이 실시간 추론 검사를 통과한 후 `openclaw crestodian`으로 사용할 수 있습니다. 추론을 사용할 수 없으면 대화형 호출은 추론 온보딩으로 돌아가며, 자동화는 복구 안내와 함께 실패합니다. Crestodian은 `openclaw tui --local`과 동일한 로컬 TUI 셸에서 실행되며, 형식이 지정되고 승인 절차로 보호되는 Crestodian 작업만 수행할 수 있는 AI 에이전트를 기반으로 합니다.

```bash
openclaw crestodian                       # 대화형으로 시작
openclaw crestodian -m "status"           # 요청 하나를 실행하고 종료
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # 구성 쓰기 적용
```

- 영구 구성 쓰기에는 승인이 필요합니다. 대화형으로 확인하거나 `--yes`를 전달하십시오.
- `--json`은 채팅을 시작하는 대신 시작 개요를 JSON으로 출력합니다.
- Crestodian 내에서 `open-tui`를 요청하면(예: 일반 에이전트와 대화해 달라고 요청) Crestodian을 종료하고 일반 에이전트 TUI를 엽니다. 돌아오려면 해당 TUI에서 `/crestodian`을 사용하십시오.

현재 구성이 이미 검증을 통과하고, 내장 에이전트가 같은 머신에서 구성을 검사하고 문서와 비교하여 실행 중인 Gateway에 의존하지 않고 구성 드리프트를 복구하도록 하려면 로컬 모드를 사용하십시오.

`openclaw config validate`가 이미 실패하고 있다면 먼저 `openclaw configure` 또는 `openclaw doctor --fix`로 시작하십시오. `openclaw chat`도 시작하려면 로드 가능한 구성이 필요합니다.

일반적인 절차:

1. 로컬 모드를 시작합니다.

```bash
openclaw chat
```

2. 에이전트에게 확인할 내용을 요청합니다. 예:

```text
내 Gateway 인증 구성을 문서와 비교하고 가장 작은 수정 사항을 제안해 주세요.
```

3. 정확한 증거와 검증을 위해 로컬 셸 명령을 사용합니다.

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` 또는 `openclaw configure`로 최소한의 변경 사항을 적용한 다음 `!openclaw config validate`를 다시 실행합니다.
5. Doctor가 자동 마이그레이션이나 복구를 권장하면 내용을 검토한 후 `!openclaw doctor --fix`를 실행합니다.

팁:

- `openclaw.json`을 직접 편집하는 대신 `openclaw config set` 또는 `openclaw configure`를 사용하는 것이 좋습니다.
- `openclaw docs "<query>"`는 같은 머신에서 실시간 문서 인덱스를 검색합니다.
- 구조화된 스키마 및 SecretRef/해결 가능성 오류가 필요한 경우 `openclaw config validate --json`이 유용합니다.

## 도구 출력

- 도구 호출은 인수와 결과가 포함된 카드로 표시됩니다.
- Ctrl+O로 축소 보기와 확장 보기를 전환합니다.
- 도구가 실행되는 동안 부분 업데이트가 동일한 카드에 스트리밍됩니다.

## 터미널 색상

- TUI는 어두운 터미널과 밝은 터미널 모두에서 읽을 수 있도록 어시스턴트 본문 텍스트에 터미널의 기본 전경색을 사용합니다.
- 터미널 배경이 밝고 자동 감지가 잘못된 경우 `openclaw tui`를 실행하기 전에 `OPENCLAW_THEME=light`를 설정하십시오.
- 대신 기존의 어두운 팔레트를 강제로 사용하려면 `OPENCLAW_THEME=dark`를 설정하십시오.

## 기록 및 스트리밍

- 연결 시 TUI가 최신 기록을 로드합니다(기본값: 메시지 200개).
- 스트리밍 응답은 완료될 때까지 제자리에서 업데이트됩니다.
- TUI는 더 풍부한 도구 카드를 표시하기 위해 에이전트 도구 이벤트도 수신합니다.

## 연결 세부 정보

- TUI는 대략적인 `ui` 클라이언트 모드에서 클라이언트 ID `openclaw-tui`로 연결됩니다(Control UI 및 WebChat이 Gateway 정책에 사용하는 것과 동일한 모드).
- 재연결은 시스템 메시지로 표시되며, 이벤트 누락은 로그에 나타납니다.

## 옵션

- `--local`: 로컬 내장 에이전트 런타임을 대상으로 실행
- `--url <url>`: Gateway WebSocket URL(기본값은 구성의 `gateway.remote.url` 또는 루프백의 `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway 토큰(필요한 경우)
- `--password <password>`: Gateway 비밀번호(필요한 경우)
- `--tls-fingerprint <sha256>`: 고정된 `wss://` Gateway에 예상되는 TLS 인증서 지문
- `--session <key>`: 세션 키(기본값: `main`, 범위가 전역이면 `global`)
- `--deliver`: 어시스턴트 응답을 제공자에게 전달(기본적으로 꺼짐)
- `--thinking <level>`: 전송 시 사고 수준 재정의
- `--message <text>`: 연결 후 초기 메시지 전송
- `--timeout-ms <ms>`: 에이전트 제한 시간(ms, 기본값은 `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 로드할 기록 항목 수(기본값 `200`)

<Warning>
`--url`을 설정하면 TUI는 구성 또는 환경 자격 증명으로 대체하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하고, 대상이 고정 인증서를 사용하는 경우 `--tls-fingerprint`도 함께 전달하십시오. 명시적 자격 증명이 없으면 오류가 발생합니다. 로컬 모드에서는 `--url`, `--token`, `--password` 또는 `--tls-fingerprint`를 전달하지 마십시오.
</Warning>

## 문제 해결

메시지를 보낸 후 출력이 없는 경우:

- TUI에서 `/status`를 실행하여 Gateway가 연결되어 있고 유휴 또는 사용 중 상태인지 확인하십시오.
- Gateway 로그를 확인하십시오: `openclaw logs --follow`.
- 에이전트가 실행 가능한지 확인하십시오: `openclaw status` 및 `openclaw models status`.
- 채팅 채널에서 메시지가 표시되기를 기대한다면 TUI가 `--deliver`와 함께 시작되었는지 확인하십시오(재시작하지 않고 나중에 활성화할 수 없음).

## 연결 문제 해결

- `disconnected`: Gateway가 실행 중이고 `--url/--token/--password`가 올바른지 확인하십시오.
- 선택기에 에이전트가 없음: `openclaw agents list`와 라우팅 구성을 확인하십시오.
- 세션 선택기가 비어 있음: 전역 범위에 있거나 아직 세션이 없을 수 있습니다.

## 관련 항목

- [Control UI](/ko/web/control-ui) — 웹 기반 제어 인터페이스
- [구성](/ko/cli/config) — `openclaw.json` 검사, 검증 및 편집
- [Doctor](/ko/cli/doctor) — 안내형 복구 및 마이그레이션 검사
- [CLI 참조](/ko/cli) — 전체 CLI 명령 참조
