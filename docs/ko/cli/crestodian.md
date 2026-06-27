---
read_when:
    - 설정 후 명령 없이 openclaw를 실행하고 Crestodian을 이해하려는 경우
    - OpenClaw를 검사하거나 복구할 수 있는 설정 불필요 방식이 필요합니다
    - 메시지 채널 구조 모드를 설계하거나 활성화하고 있습니다
summary: Crestodian의 CLI 참조 및 보안 모델, 설정 파일 없이도 안전한 설정 및 복구 도우미
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:17:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian은 OpenClaw의 로컬 설정, 복구 및 구성 도우미입니다. 일반 에이전트 경로가 손상되었을 때도 접근 가능하도록 설계되었습니다.

명령 없이 `openclaw`를 실행하면 활성 구성 파일이 없거나 작성된 설정이 없는 경우(비어 있거나 메타데이터만 있는 경우) 먼저 클래식 온보딩이 시작됩니다. 구성 파일에 작성된 설정이 생긴 후 명령 없이 `openclaw`를 실행하면 대화형 터미널에서 Crestodian이 시작됩니다. `openclaw crestodian`을 실행하면 동일한 도우미를 명시적으로 시작합니다.

## Crestodian이 표시하는 내용

시작 시 대화형 Crestodian은 `openclaw tui`가 사용하는 것과 동일한 TUI 셸을 Crestodian 채팅 백엔드와 함께 엽니다. 채팅 로그는 짧은 인사말로 시작합니다.

- Crestodian을 시작해야 하는 경우
- Crestodian이 실제로 사용하는 모델 또는 결정적 플래너 경로
- 구성 유효성 및 기본 에이전트
- 첫 시작 프로브에서 확인한 Gateway 도달 가능성
- Crestodian이 수행할 수 있는 다음 디버그 작업

시작하기 위해 시크릿을 덤프하거나 Plugin CLI 명령을 로드하지 않습니다. TUI는 여전히 일반적인 헤더, 채팅 로그, 상태 줄, 푸터, 자동 완성 및 편집기 컨트롤을 제공합니다.

구성 경로, 문서/소스 경로, 로컬 CLI 프로브, API 키 존재 여부, 에이전트, 모델 및 Gateway 세부 정보가 포함된 자세한 인벤토리는 `status`를 사용하세요.

Crestodian은 일반 에이전트와 동일한 OpenClaw 참조 검색을 사용합니다. Git 체크아웃에서는 로컬 `docs/`와 로컬 소스 트리를 가리킵니다. npm 패키지 설치에서는 번들된 패키지 문서를 사용하고 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)에 연결하며, 문서만으로 충분하지 않을 때는 소스를 검토하라는 명시적 안내를 제공합니다.

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

Crestodian의 시작 경로는 의도적으로 작게 유지됩니다. 다음 상황에서도 실행할 수 있습니다.

- `openclaw.json`이 없음
- `openclaw.json`이 유효하지 않음
- Gateway가 다운됨
- Plugin 명령 등록을 사용할 수 없음
- 아직 구성된 에이전트가 없음

`openclaw --help`와 `openclaw --version`은 여전히 일반 빠른 경로를 사용합니다. 비대화형 bare `openclaw`는 루트 도움말을 출력하는 대신 짧은 메시지와 함께 종료됩니다. 새로 설치한 경우 메시지는 비대화형 온보딩을 안내하고, 설정 후에는 일회성 Crestodian 명령을 안내합니다.

## 작업 및 승인

Crestodian은 구성을 임의로 편집하는 대신 타입이 지정된 작업을 사용합니다.

읽기 전용 작업은 즉시 실행할 수 있습니다.

- 개요 표시
- 에이전트 나열
- 설치된 Plugin 나열
- ClawHub Plugin 검색
- 모델/백엔드 상태 표시
- 상태 또는 헬스 체크 실행
- Gateway 도달 가능성 확인
- 대화형 수정 없이 doctor 실행
- 구성 검증
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

검색은 감사되지 않습니다. 적용된 작업과 쓰기만 기록됩니다.

`openclaw onboard --modern`은 Crestodian을 현대적 온보딩 미리보기로 시작합니다. 일반 `openclaw onboard`는 여전히 클래식 온보딩을 실행합니다.

## 설정 부트스트랩

`setup`은 채팅 우선 온보딩 부트스트랩입니다. 타입이 지정된 구성 작업을 통해서만 쓰며 먼저 승인을 요청합니다.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

모델이 구성되지 않은 경우, setup은 다음 순서로 첫 번째 사용 가능한 백엔드를 선택하고 선택한 항목을 알려줍니다.

- 이미 구성된 경우 기존 명시적 모델
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> Codex app-server 하네스를 통한 `openai/gpt-5.5`

사용 가능한 항목이 없으면 setup은 기본 작업 공간을 계속 쓰고 모델은 설정하지 않은 상태로 둡니다. Codex/Claude Code를 설치하거나 로그인하거나 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`를 노출한 다음 setup을 다시 실행하세요.

## 모델 지원 플래너

Crestodian은 항상 결정적 모드로 시작합니다. 결정적 파서가 이해하지 못하는 모호한 명령의 경우, 로컬 Crestodian은 OpenClaw의 일반 런타임 경로를 통해 제한된 플래너 턴을 한 번 수행할 수 있습니다. 먼저 구성된 OpenClaw 모델을 사용합니다. 아직 사용할 수 있는 구성된 모델이 없으면 머신에 이미 있는 로컬 런타임으로 대체할 수 있습니다.

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- Codex app-server 하네스: `openai/gpt-5.5`

모델 지원 플래너는 구성을 직접 변경할 수 없습니다. 요청을 Crestodian의 타입이 지정된 명령 중 하나로 변환해야 하며, 이후 일반 승인 및 감사 규칙이 적용됩니다. Crestodian은 무엇이든 실행하기 전에 사용한 모델과 해석된 명령을 출력합니다. 구성 없는 대체 플래너 턴은 임시적이며, 런타임이 지원하는 경우 도구가 비활성화되고, 임시 작업 공간/세션을 사용합니다.

메시지 채널 구조 모드는 모델 지원 플래너를 사용하지 않습니다. 원격 구조는 손상되었거나 침해된 일반 에이전트 경로가 구성 편집기로 사용될 수 없도록 결정적으로 유지됩니다.

## 에이전트로 전환

Crestodian을 떠나 일반 TUI를 열려면 자연어 선택기를 사용하세요.

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, `openclaw terminal`은 여전히 일반 에이전트 TUI를 직접 엽니다. Crestodian을 시작하지 않습니다.

일반 TUI로 전환한 후 `/crestodian`을 사용하여 Crestodian으로 돌아가세요. 후속 요청을 포함할 수 있습니다.

```text
/crestodian
/crestodian restart gateway
```

TUI 안의 에이전트 전환은 `/crestodian`을 사용할 수 있다는 이동 경로를 남깁니다.

## 메시지 구조 모드

메시지 구조 모드는 Crestodian의 메시지 채널 진입점입니다. 일반 에이전트가 죽었지만 WhatsApp 같은 신뢰된 채널이 여전히 명령을 수신하는 경우를 위한 것입니다.

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

에이전트 생성은 로컬 프롬프트 또는 구조 모드에서도 큐에 넣을 수 있습니다.

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

원격 구조 모드는 관리자 표면입니다. 일반 채팅이 아니라 원격 구성 복구처럼 취급해야 합니다.

원격 구조의 보안 계약:

- 샌드박싱이 활성화되면 비활성화됩니다. 에이전트/세션이 샌드박스 처리된 경우 Crestodian은 원격 구조를 거부하고 로컬 CLI 복구가 필요하다고 설명해야 합니다.
- 기본 유효 상태는 `auto`입니다. 런타임이 이미 샌드박스 없는 로컬 권한을 가진 신뢰된 YOLO 작업에서만 원격 구조를 허용합니다.
- 명시적 소유자 ID가 필요합니다. 구조는 와일드카드 발신자 규칙, 공개 그룹 정책, 인증되지 않은 Webhook 또는 익명 채널을 허용해서는 안 됩니다.
- 기본적으로 소유자 DM만 허용합니다. 그룹/채널 구조에는 명시적 옵트인이 필요합니다.
- Plugin 검색 및 목록은 읽기 전용입니다. Plugin 설치는 실행 가능한 코드를 다운로드하므로 기본적으로 로컬 전용입니다. Plugin 제거는 구조 정책이 영구 쓰기를 허용할 때 승인된 복구 작업으로 허용될 수 있습니다.
- 원격 구조는 로컬 TUI를 열거나 대화형 에이전트 세션으로 전환할 수 없습니다. 에이전트 인계에는 로컬 `openclaw`를 사용하세요.
- 영구 쓰기는 구조 모드에서도 여전히 승인이 필요합니다.
- 적용된 모든 구조 작업을 감사하세요. 메시지 채널 구조는 채널, 계정, 발신자 및 소스 주소 메타데이터를 기록합니다. 구성을 변경하는 작업은 변경 전후의 구성 해시도 기록합니다.
- 시크릿을 절대 에코하지 마세요. SecretRef 검사는 값이 아니라 사용 가능 여부를 보고해야 합니다.
- Gateway가 살아 있으면 Gateway 타입 작업을 선호하세요. Gateway가 죽어 있으면 일반 에이전트 루프에 의존하지 않는 최소한의 로컬 복구 표면만 사용하세요.

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

`enabled`가 허용해야 하는 값:

- `"auto"`: 기본값. 유효 런타임이 YOLO이고 샌드박싱이 꺼져 있을 때만 허용합니다.
- `false`: 메시지 채널 구조를 절대 허용하지 않습니다.
- `true`: 소유자/채널 검사를 통과하면 구조를 명시적으로 허용합니다. 그래도 샌드박싱 거부를 우회해서는 안 됩니다.

기본 `"auto"` YOLO 태세는 다음과 같습니다.

- 샌드박스 모드가 `off`로 해석됨
- `tools.exec.security`가 `full`로 해석됨
- `tools.exec.ask`가 `off`로 해석됨

원격 구조는 Docker 레인에서 다룹니다.

```bash
pnpm test:docker:crestodian-rescue
```

구성 없는 로컬 플래너 대체는 다음으로 다룹니다.

```bash
pnpm test:docker:crestodian-planner
```

옵트인 라이브 채널 명령 표면 스모크는 `/crestodian status`와 구조 핸들러를 통한 영구 승인 왕복을 확인합니다.

```bash
pnpm test:live:crestodian-rescue-channel
```

명시적 Crestodian 명령을 통한 구성 없는 설정은 다음으로 다룹니다.

```bash
pnpm test:docker:crestodian-first-run
```

해당 레인은 빈 상태 디렉터리로 시작하여 현대적 온보드 Crestodian 진입점을 검증하고, 기본 모델을 설정하고, 추가 에이전트를 생성하고, Plugin 활성화와 토큰 SecretRef를 통해 Discord를 구성하고, 구성을 검증하며, 감사 로그를 확인합니다. QA Lab에도 동일한 Ring 0 흐름을 위한 저장소 기반 시나리오가 있습니다.

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [Doctor](/ko/cli/doctor)
- [TUI](/ko/cli/tui)
- [샌드박스](/ko/cli/sandbox)
- [보안](/ko/cli/security)
