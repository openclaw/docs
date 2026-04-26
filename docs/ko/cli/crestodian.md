---
read_when:
    - 명령 없이 openclaw를 실행했을 때 Crestodian을 이해하고 싶을 때
    - OpenClaw를 검사하거나 복구할 수 있는 설정 없는 안전한 방법이 필요할 때
    - 메시지 채널 구조 모드를 설계하거나 활성화하려는 경우
summary: 설정 없는 안전한 설정 및 복구 도우미인 Crestodian의 CLI 참조 및 보안 모델
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian은 OpenClaw의 로컬 설정, 복구, 구성 도우미입니다.  
정상적인 에이전트 경로가 깨졌을 때도 계속 접근 가능하도록 설계되었습니다.

명령 없이 `openclaw`를 실행하면 대화형 터미널에서 Crestodian이 시작됩니다.  
`openclaw crestodian`을 실행하면 동일한 도우미를 명시적으로 시작합니다.

## Crestodian이 보여주는 것

시작 시 대화형 Crestodian은 `openclaw tui`에서 사용하는 것과 같은 TUI 셸을 Crestodian 채팅 백엔드로 엽니다. 채팅 로그는 짧은 인사말로 시작합니다.

- 언제 Crestodian을 시작해야 하는지
- Crestodian이 실제로 사용 중인 모델 또는 결정적 플래너 경로
- config 유효성 및 기본 에이전트
- 첫 시작 프로브에서의 Gateway 도달 가능 여부
- Crestodian이 다음에 수행할 수 있는 디버그 작업

시작만을 위해 시크릿을 덤프하거나 Plugin CLI 명령을 로드하지는 않습니다.  
TUI는 여전히 일반적인 헤더, 채팅 로그, 상태 줄, 푸터, 자동완성, 에디터 컨트롤을 제공합니다.

config 경로, docs/source 경로, 로컬 CLI 프로브, API 키 존재 여부, 에이전트, 모델, Gateway 세부 정보를 포함한 자세한 인벤토리를 보려면 `status`를 사용하세요.

Crestodian은 일반 에이전트와 동일한 OpenClaw 참조 탐색 방식을 사용합니다. Git 체크아웃에서는 로컬 `docs/`와 로컬 소스 트리를 가리킵니다. npm 패키지 설치에서는 번들된 패키지 문서를 사용하고 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)로 연결되며, 문서만으로 충분하지 않을 때는 소스를 검토하라는 명시적 안내를 제공합니다.

## 예시

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Crestodian TUI 내부:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 안전한 시작

Crestodian의 시작 경로는 의도적으로 작게 유지됩니다. 다음과 같은 경우에도 실행할 수 있습니다.

- `openclaw.json`이 없음
- `openclaw.json`이 유효하지 않음
- Gateway가 내려가 있음
- Plugin 명령 등록을 사용할 수 없음
- 아직 어떤 에이전트도 구성되지 않음

`openclaw --help`와 `openclaw --version`은 여전히 일반적인 빠른 경로를 사용합니다.  
비대화형 `openclaw`는 루트 도움말을 출력하는 대신 짧은 메시지를 출력하고 종료합니다. 명령 없는 제품 경험은 Crestodian이기 때문입니다.

## 작업 및 승인

Crestodian은 임시 방식으로 config를 편집하는 대신 타입이 지정된 작업을 사용합니다.

읽기 전용 작업은 즉시 실행할 수 있습니다.

- 개요 표시
- 에이전트 목록 표시
- 모델/백엔드 상태 표시
- status 또는 health 검사 실행
- Gateway 도달 가능 여부 확인
- 대화형 수정 없이 doctor 실행
- config 검증
- audit 로그 경로 표시

영구 작업은 직접 명령에 `--yes`를 전달하지 않는 한, 대화형 모드에서 대화형 승인이 필요합니다.

- config 쓰기
- `config set` 실행
- `config set-ref`를 통해 지원되는 SecretRef 값 설정
- setup/onboarding bootstrap 실행
- 기본 모델 변경
- Gateway 시작, 중지 또는 재시작
- 에이전트 생성
- config 또는 상태를 다시 쓰는 doctor 복구 실행

적용된 쓰기 작업은 다음 위치에 기록됩니다.

```text
~/.openclaw/audit/crestodian.jsonl
```

탐색은 audit되지 않습니다. 적용된 작업과 쓰기만 로그에 기록됩니다.

`openclaw onboard --modern`은 현대식 온보딩 미리보기로 Crestodian을 시작합니다.  
일반 `openclaw onboard`는 여전히 기존 온보딩을 실행합니다.

## Setup Bootstrap

`setup`은 채팅 우선 온보딩 bootstrap입니다. 타입이 지정된 config 작업으로만 쓰며 먼저 승인을 요청합니다.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

모델이 구성되지 않은 경우, setup은 다음 순서대로 첫 번째 사용 가능한 백엔드를 선택하고 무엇을 선택했는지 알려줍니다.

- 이미 구성된 기존 명시적 모델
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

사용 가능한 항목이 하나도 없으면 setup은 기본 워크스페이스만 작성하고 모델은 설정하지 않은 채 둡니다. Codex/Claude Code를 설치하거나 로그인하거나, `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`를 노출한 뒤 setup을 다시 실행하세요.

## 모델 지원 플래너

Crestodian은 항상 결정적 모드로 시작합니다. 결정적 파서가 이해하지 못하는 모호한 명령의 경우, 로컬 Crestodian은 OpenClaw의 일반 런타임 경로를 통해 제한된 플래너 턴을 한 번 수행할 수 있습니다. 먼저 구성된 OpenClaw 모델을 사용합니다. 아직 사용 가능한 구성 모델이 없으면, 기기에 이미 존재하는 로컬 런타임으로 대체할 수 있습니다.

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` with `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

모델 지원 플래너는 config를 직접 변경할 수 없습니다. 요청을 Crestodian의 타입이 지정된 명령 중 하나로 변환해야 하며, 그 후에는 일반 승인 및 audit 규칙이 적용됩니다. Crestodian은 실제 실행 전에 사용한 모델과 해석된 명령을 출력합니다. config 없는 대체 플래너 턴은 임시이며, 런타임이 지원하는 경우 도구가 비활성화되고, 임시 워크스페이스/세션을 사용합니다.

메시지 채널 구조 모드는 모델 지원 플래너를 사용하지 않습니다. 원격 구조는 결정적 상태를 유지하므로, 손상되었거나 침해된 일반 에이전트 경로를 config 편집기로 사용할 수 없습니다.

## 에이전트로 전환

자연어 선택기를 사용해 Crestodian을 떠나 일반 TUI를 열 수 있습니다.

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, `openclaw terminal`은 여전히 일반 에이전트 TUI를 직접 엽니다. Crestodian을 시작하지는 않습니다.

일반 TUI로 전환한 뒤에는 `/crestodian`을 사용해 Crestodian으로 돌아갈 수 있습니다. 후속 요청을 포함할 수도 있습니다.

```text
/crestodian
/crestodian restart gateway
```

TUI 내부의 에이전트 전환은 `/crestodian`을 사용할 수 있다는 breadcrumb를 남깁니다.

## 메시지 구조 모드

메시지 구조 모드는 Crestodian의 메시지 채널 진입점입니다. 정상 에이전트는 죽어 있지만 WhatsApp 같은 신뢰된 채널은 여전히 명령을 받을 수 있는 경우를 위한 기능입니다.

지원되는 텍스트 명령:

- `/crestodian <request>`

운영자 흐름:

```text
신뢰된 소유자 DM에서: /crestodian status
OpenClaw: Crestodian 구조 모드. Gateway reachable: no. Config valid: no.
사용자: /crestodian restart gateway
OpenClaw: 계획: Gateway를 재시작합니다. 적용하려면 /crestodian yes 로 응답하세요.
사용자: /crestodian yes
OpenClaw: 적용됨. Audit 항목이 기록되었습니다.
```

에이전트 생성도 로컬 프롬프트나 구조 모드에서 대기열에 넣을 수 있습니다.

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

원격 구조 모드는 관리자 표면입니다. 일반 채팅이 아니라 원격 config 복구처럼 취급해야 합니다.

원격 구조의 보안 계약:

- 샌드박싱이 활성화된 경우 비활성화됩니다. 에이전트/세션이 샌드박스 상태라면, Crestodian은 원격 구조를 거부하고 로컬 CLI 복구가 필요하다고 설명해야 합니다.
- 기본 유효 상태는 `auto`입니다. 런타임이 이미 샌드박스 없는 로컬 권한을 가진 신뢰된 YOLO 작업에서만 원격 구조를 허용합니다.
- 명시적인 소유자 신원을 요구합니다. 구조는 와일드카드 발신자 규칙, 열린 그룹 정책, 인증되지 않은 Webhook, 익명 채널을 허용해서는 안 됩니다.
- 기본적으로 소유자 DM만 허용합니다. 그룹/채널 구조는 명시적 opt-in이 필요합니다.
- 원격 구조는 로컬 TUI를 열거나 대화형 에이전트 세션으로 전환할 수 없습니다. 에이전트 핸드오프에는 로컬 `openclaw`를 사용하세요.
- 영구 쓰기에는 구조 모드에서도 여전히 승인이 필요합니다.
- 적용된 모든 구조 작업을 audit합니다. 메시지 채널 구조는 채널, 계정, 발신자, 소스 주소 메타데이터를 기록합니다. config를 변경하는 작업은 변경 전후의 config 해시도 기록합니다.
- 시크릿은 절대 그대로 출력하지 않습니다. SecretRef 검사는 값이 아니라 사용 가능 여부를 보고해야 합니다.
- Gateway가 살아 있으면 Gateway 타입 작업을 우선 사용합니다. Gateway가 죽어 있으면 일반 에이전트 루프에 의존하지 않는 최소한의 로컬 복구 표면만 사용합니다.

config 형태:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled`는 다음을 허용해야 합니다.

- `"auto"`: 기본값. 유효 런타임이 YOLO이고 샌드박싱이 꺼져 있을 때만 허용
- `false`: 메시지 채널 구조를 절대 허용하지 않음
- `true`: 소유자/채널 검사를 통과하면 구조를 명시적으로 허용. 그래도 샌드박싱 거부를 우회해서는 안 됨

기본 `"auto"` YOLO 자세는 다음과 같습니다.

- sandbox mode는 `off`로 해석됨
- `tools.exec.security`는 `full`로 해석됨
- `tools.exec.ask`는 `off`로 해석됨

원격 구조는 다음 Docker lane으로 커버됩니다.

```bash
pnpm test:docker:crestodian-rescue
```

config 없는 로컬 플래너 대체는 다음으로 커버됩니다.

```bash
pnpm test:docker:crestodian-planner
```

선택적 live 채널 명령 표면 smoke는 `/crestodian status`와 구조 핸들러를 통한 영구 승인 왕복을 검사합니다.

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian을 통한 새로운 config 없는 설정은 다음으로 커버됩니다.

```bash
pnpm test:docker:crestodian-first-run
```

이 lane은 빈 상태 디렉터리에서 시작하여, 기본 `openclaw`를 Crestodian으로 라우팅하고, 기본 모델을 설정하고, 추가 에이전트를 생성하고, Plugin 활성화와 토큰 SecretRef를 통해 Discord를 구성하고, config를 검증하고, audit 로그를 확인합니다. QA Lab에도 동일한 Ring 0 흐름을 위한 리포지토리 기반 시나리오가 있습니다.

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 관련 항목

- [CLI reference](/ko/cli)
- [Doctor](/ko/cli/doctor)
- [TUI](/ko/cli/tui)
- [Sandbox](/ko/cli/sandbox)
- [Security](/ko/cli/security)
