---
read_when:
    - 명령 없이 openclaw를 실행하고 Crestodian을 이해하려는 경우
    - 구성 파일 없이도 안전하게 OpenClaw를 검사하거나 복구할 방법이 필요합니다
    - 메시지 채널 구조 모드를 설계하거나 활성화하고 있습니다
summary: Crestodian용 CLI 참조 및 보안 모델, 구성 없이도 안전한 설정 및 복구 도우미
title: 크레스토디언
x-i18n:
    generated_at: "2026-05-02T20:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian은 OpenClaw의 로컬 설정, 복구 및 구성 도우미입니다. 일반 에이전트 경로가 고장 났을 때도 접근할 수 있도록 설계되었습니다.

명령 없이 `openclaw`를 실행하면 대화형 터미널에서 Crestodian이 시작됩니다. `openclaw crestodian`을 실행하면 같은 도우미가 명시적으로 시작됩니다.

## Crestodian이 표시하는 내용

시작 시 대화형 Crestodian은 `openclaw tui`에서 사용하는 것과 같은 TUI 셸을 Crestodian 채팅 백엔드와 함께 엽니다. 채팅 로그는 짧은 인사말로 시작합니다.

- Crestodian을 시작해야 하는 경우
- Crestodian이 실제로 사용하는 모델 또는 결정적 플래너 경로
- 구성 유효성과 기본 에이전트
- 첫 시작 프로브의 Gateway 도달 가능성
- Crestodian이 수행할 수 있는 다음 디버그 작업

시작만을 위해 비밀 값을 덤프하거나 Plugin CLI 명령을 로드하지 않습니다. TUI는 여전히 일반 헤더, 채팅 로그, 상태 줄, 푸터, 자동 완성, 편집기 컨트롤을 제공합니다.

구성 경로, 문서/소스 경로, 로컬 CLI 프로브, API 키 존재 여부, 에이전트, 모델, Gateway 세부 정보가 포함된 자세한 인벤토리를 보려면 `status`를 사용하세요.

Crestodian은 일반 에이전트와 같은 OpenClaw 참조 검색을 사용합니다. Git 체크아웃에서는 로컬 `docs/`와 로컬 소스 트리를 가리킵니다. npm 패키지 설치에서는 번들된 패키지 문서를 사용하고 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)에 연결하며, 문서만으로 충분하지 않을 때는 소스를 검토하라는 명시적 안내를 제공합니다.

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

Crestodian TUI 안에서:

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
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 안전한 시작

Crestodian의 시작 경로는 의도적으로 작습니다. 다음과 같은 경우에도 실행할 수 있습니다.

- `openclaw.json`이 없음
- `openclaw.json`이 유효하지 않음
- Gateway가 중단됨
- Plugin 명령 등록을 사용할 수 없음
- 아직 에이전트가 구성되지 않음

`openclaw --help`와 `openclaw --version`은 여전히 일반 빠른 경로를 사용합니다. 비대화형 `openclaw`는 루트 도움말을 출력하는 대신 짧은 메시지와 함께 종료됩니다. 명령 없는 제품이 Crestodian이기 때문입니다.

## 작업 및 승인

Crestodian은 임의로 구성을 편집하는 대신 형식화된 작업을 사용합니다.

읽기 전용 작업은 즉시 실행할 수 있습니다.

- 개요 표시
- 에이전트 목록 표시
- 설치된 Plugin 목록 표시
- ClawHub Plugin 검색
- 모델/백엔드 상태 표시
- 상태 또는 상태 점검 실행
- Gateway 도달 가능성 확인
- 대화형 수정 없이 doctor 실행
- 구성 유효성 검사
- 감사 로그 경로 표시

직접 명령에 `--yes`를 전달하지 않는 한, 영구 작업은 대화형 모드에서 대화식 승인이 필요합니다.

- 구성 쓰기
- `config set` 실행
- `config set-ref`를 통해 지원되는 SecretRef 값 설정
- 설정/온보딩 부트스트랩 실행
- 기본 모델 변경
- Gateway 시작, 중지 또는 재시작
- 에이전트 생성
- ClawHub 또는 npm에서 Plugin 설치
- Plugin 제거
- 구성 또는 상태를 다시 쓰는 doctor 복구 실행

적용된 쓰기는 다음 위치에 기록됩니다.

```text
~/.openclaw/audit/crestodian.jsonl
```

검색은 감사되지 않습니다. 적용된 작업과 쓰기만 로그에 기록됩니다.

`openclaw onboard --modern`은 최신 온보딩 미리보기로 Crestodian을 시작합니다. 일반 `openclaw onboard`는 여전히 클래식 온보딩을 실행합니다.

## 설정 부트스트랩

`setup`은 채팅 우선 온보딩 부트스트랩입니다. 형식화된 구성 작업을 통해서만 쓰고 먼저 승인을 요청합니다.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

구성된 모델이 없으면 setup은 다음 순서로 첫 번째 사용 가능한 백엔드를 선택하고 선택한 항목을 알려줍니다.

- 이미 구성되어 있으면 기존 명시적 모델
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

사용 가능한 항목이 없으면 setup은 여전히 기본 워크스페이스를 쓰고 모델은 설정하지 않은 채로 둡니다. Codex/Claude Code를 설치하거나 로그인하거나 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`를 노출한 다음 setup을 다시 실행하세요.

## 모델 지원 플래너

Crestodian은 항상 결정적 모드로 시작합니다. 결정적 파서가 이해하지 못하는 모호한 명령의 경우, 로컬 Crestodian은 OpenClaw의 일반 런타임 경로를 통해 제한된 플래너 턴을 한 번 수행할 수 있습니다. 먼저 구성된 OpenClaw 모델을 사용합니다. 사용 가능한 구성 모델이 아직 없으면 시스템에 이미 있는 로컬 런타임으로 폴백할 수 있습니다.

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server 하네스: `agentRuntime.id: "codex"`가 포함된 `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

모델 지원 플래너는 구성을 직접 변경할 수 없습니다. 요청을 Crestodian의 형식화된 명령 중 하나로 변환해야 하며, 그런 다음 일반 승인 및 감사 규칙이 적용됩니다. Crestodian은 어떤 작업이든 실행하기 전에 사용한 모델과 해석된 명령을 출력합니다. 구성 없는 폴백 플래너 턴은 임시적이며, 런타임이 지원하는 경우 도구가 비활성화되고, 임시 워크스페이스/세션을 사용합니다.

메시지 채널 구조 모드는 모델 지원 플래너를 사용하지 않습니다. 원격 구조는 결정적으로 유지되므로 고장 났거나 손상된 일반 에이전트 경로가 구성 편집기로 사용될 수 없습니다.

## 에이전트로 전환

자연어 선택기를 사용해 Crestodian을 떠나 일반 TUI를 여세요.

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, `openclaw terminal`은 여전히 일반 에이전트 TUI를 직접 엽니다. Crestodian을 시작하지 않습니다.

일반 TUI로 전환한 뒤에는 `/crestodian`을 사용해 Crestodian으로 돌아가세요. 후속 요청을 포함할 수 있습니다.

```text
/crestodian
/crestodian restart gateway
```

TUI 안의 에이전트 전환은 `/crestodian`을 사용할 수 있다는 이동 경로를 남깁니다.

## 메시지 구조 모드

메시지 구조 모드는 Crestodian의 메시지 채널 진입점입니다. 일반 에이전트가 중단되었지만 WhatsApp 같은 신뢰할 수 있는 채널이 여전히 명령을 수신하는 경우를 위한 것입니다.

지원되는 텍스트 명령:

- `/crestodian <request>`

운영자 흐름:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

에이전트 생성도 로컬 프롬프트나 구조 모드에서 큐에 넣을 수 있습니다.

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

원격 구조 모드는 관리자 표면입니다. 일반 채팅이 아니라 원격 구성 복구처럼 다뤄야 합니다.

원격 구조의 보안 계약:

- 샌드박싱이 활성화되면 비활성화됩니다. 에이전트/세션이 샌드박스 처리된 경우 Crestodian은 원격 구조를 거부하고 로컬 CLI 복구가 필요하다고 설명해야 합니다.
- 기본 유효 상태는 `auto`입니다. 런타임이 이미 샌드박스 없는 로컬 권한을 가진 신뢰된 YOLO 작업에서만 원격 구조를 허용합니다.
- 명시적인 소유자 ID가 필요합니다. 구조는 와일드카드 발신자 규칙, 열린 그룹 정책, 인증되지 않은 Webhook 또는 익명 채널을 허용해서는 안 됩니다.
- 기본적으로 소유자 DM만 허용합니다. 그룹/채널 구조에는 명시적 옵트인이 필요합니다.
- Plugin 검색과 목록은 읽기 전용입니다. Plugin 설치는 실행 가능한 코드를 다운로드하므로 기본적으로 로컬 전용입니다. Plugin 제거는 구조 정책이 영구 쓰기를 허용할 때 승인된 복구 작업으로 허용될 수 있습니다.
- 원격 구조는 로컬 TUI를 열거나 대화형 에이전트 세션으로 전환할 수 없습니다. 에이전트 인계에는 로컬 `openclaw`를 사용하세요.
- 영구 쓰기는 구조 모드에서도 여전히 승인이 필요합니다.
- 적용된 모든 구조 작업을 감사하세요. 메시지 채널 구조는 채널, 계정, 발신자, 소스 주소 메타데이터를 기록합니다. 구성을 변경하는 작업은 변경 전후의 구성 해시도 기록합니다.
- 비밀 값을 절대 그대로 출력하지 마세요. SecretRef 검사는 값이 아니라 사용 가능 여부를 보고해야 합니다.
- Gateway가 살아 있으면 Gateway 형식화된 작업을 선호하세요. Gateway가 중단되었으면 일반 에이전트 루프에 의존하지 않는 최소한의 로컬 복구 표면만 사용하세요.

구성 형태:

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

- `"auto"`: 기본값입니다. 유효 런타임이 YOLO이고 샌드박싱이 꺼져 있을 때만 허용합니다.
- `false`: 메시지 채널 구조를 절대 허용하지 않습니다.
- `true`: 소유자/채널 검사를 통과하면 구조를 명시적으로 허용합니다. 그래도 샌드박싱 거부를 우회해서는 안 됩니다.

기본 `"auto"` YOLO 자세는 다음과 같습니다.

- 샌드박스 모드가 `off`로 해석됨
- `tools.exec.security`가 `full`로 해석됨
- `tools.exec.ask`가 `off`로 해석됨

원격 구조는 Docker 레인에서 다룹니다.

```bash
pnpm test:docker:crestodian-rescue
```

구성 없는 로컬 플래너 폴백은 다음에서 다룹니다.

```bash
pnpm test:docker:crestodian-planner
```

옵트인 라이브 채널 명령 표면 스모크는 `/crestodian status`와 구조 핸들러를 통한 영구 승인 왕복을 확인합니다.

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian을 통한 새 구성 없는 setup은 다음에서 다룹니다.

```bash
pnpm test:docker:crestodian-first-run
```

이 레인은 빈 상태 디렉터리에서 시작하고, 단독 `openclaw`를 Crestodian으로 라우팅하며, 기본 모델을 설정하고, 추가 에이전트를 만들고, Plugin 활성화와 토큰 SecretRef를 통해 Discord를 구성하고, 구성을 검증하며, 감사 로그를 확인합니다. QA Lab에도 같은 Ring 0 흐름을 위한 저장소 기반 시나리오가 있습니다.

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [Doctor](/ko/cli/doctor)
- [TUI](/ko/cli/tui)
- [Sandbox](/ko/cli/sandbox)
- [보안](/ko/cli/security)
