---
read_when:
    - 추론 설정을 완료했으며 Crestodian이 나머지를 구성하도록 하려는 경우
    - 로컬 설정 에이전트로 OpenClaw를 검사하거나 복구해야 합니다
    - 메시지 채널 복구 모드를 설계하거나 활성화하고 있습니다
summary: 추론 기반 Crestodian 설정 및 복구 도우미의 CLI 참조와 보안 모델
title: 크레스투디언
x-i18n:
    generated_at: "2026-07-12T00:38:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

대화형 Crestodian은 OpenClaw의 로컬 설정, 복구 및 구성 에이전트입니다. 유효한 기본 모델이 실제 턴을 완료한 후에만 시작됩니다. 새 설치에서는 추론을 먼저 설정하며, 잘못된 구성은 기존 doctor 경로에서 처리됩니다.

## 시작 시점

하위 명령 없이 `openclaw`를 실행하면 구성 상태에 따라 경로가 결정됩니다.

- 구성이 없거나 작성된 설정 없이 존재하는 경우(비어 있거나 `$schema`/`meta` 키만 있는 경우): 실시간 AI 검증을 포함한 안내형 온보딩을 시작합니다.
- 구성이 존재하지만 검증에 실패하는 경우: 문제를 보고하고 `openclaw doctor`를 실행하도록 안내하는 기존 온보딩을 시작합니다.
- 구성이 존재하고 유효한 경우: 일반 에이전트 TUI를 엽니다. 기본 에이전트에 모델이 있고 구성된 Gateway에 연결할 수 있으면 온보딩이나 Crestodian 없이 해당 UI로 바로 이동합니다. 나중에 Crestodian에 접근하려면 TUI에서 `/crestodian`을 사용하거나 `openclaw crestodian`을 직접 실행합니다.

`openclaw crestodian`을 실행하면 먼저 구성된 기본 모델을 실시간으로 테스트합니다. 턴이 성공하면 Crestodian을 시작합니다. 대화형 실행에서 실패하면 안내형 추론 설정을 열고, 후보가 통과한 후 Crestodian으로 넘깁니다. 추론을 사용할 수 없는 경우 일회성, JSON 및 기타 비대화형 요청은 `openclaw onboard`를 실행하라는 안내와 함께 실패합니다. `openclaw --help`와 `openclaw --version`은 기존의 빠른 경로를 유지합니다.

비대화형으로 하위 명령 없이 `openclaw`를 실행하면(TTY 없음) 루트 도움말을 출력하는 대신 짧은 메시지와 함께 종료됩니다. 새 설치 또는 유효하지 않은 설치에서는 비대화형 온보딩을, 구성이 유효한 경우에는 `openclaw agent --local ...`을 안내합니다.

`openclaw onboard --modern`은 Crestodian의 호환성 별칭으로 유지되지만 동일한 추론 게이트를 사용합니다. 추론이 작동하면 채팅을 열고, 대화형 실행에서 실패하면 안내형 추론 설정을 시작하며, 비대화형 실행에서 실패하면 온보딩 안내와 함께 종료됩니다. `openclaw onboard --classic`은 전체 단계별 마법사를 엽니다.

## Crestodian에 표시되는 내용

대화형 Crestodian은 `openclaw tui`와 동일한 TUI 셸을 Crestodian 채팅 백엔드와 함께 엽니다. 시작 인사말에는 다음 내용이 포함됩니다.

- 구성 유효성 및 기본 에이전트
- Crestodian이 사용하는 검증된 모델
- 최초 시작 프로브에서 확인한 Gateway 연결 가능 여부
- 다음으로 권장되는 디버그 작업

시작을 위해 비밀 정보를 출력하거나 Plugin CLI 명령을 로드하지 않습니다.

상세 인벤토리를 보려면 `status`를 사용합니다. 구성 경로, 문서/소스 경로, 로컬 CLI 프로브, 키/토큰 존재 여부, 에이전트, 모델 및 Gateway 세부 정보를 확인할 수 있습니다.

Crestodian은 일반 에이전트와 동일한 참조 탐색 방식을 사용합니다. Git 체크아웃에서는 로컬 `docs/`와 소스 트리를 가리키고, npm 설치에서는 번들된 문서를 사용하며 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) 링크를 제공합니다. 또한 문서만으로 충분하지 않을 때 소스를 확인하도록 안내합니다.

## 예시

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Crestodian TUI 내부:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 작업 및 승인

Crestodian은 구성을 임의로 편집하는 대신 형식화된 작업을 사용합니다.

읽기 전용 작업은 즉시 실행됩니다. 개요 표시, 에이전트 목록 표시, 설치된 Plugin 목록 표시, ClawHub Plugin 검색, 모델/백엔드 상태 표시, 상태/상태 확인 실행, Gateway 연결 가능 여부 확인, 대화형 수정 없이 doctor 실행, 구성 검증, 감사 로그 경로 표시가 포함됩니다.

안내형 채널 설정 시작(`connect telegram`)도 즉시 실행됩니다. 해당 마법사가 명시적인 답변을 수집하고 그 결과로 발생하는 쓰기를 담당합니다.

영구 작업에는 대화형 승인(또는 직접 명령의 경우 `--yes`)이 필요합니다. 구성 쓰기, `config set`, `config set-ref`, 설정/온보딩 부트스트랩, 기본 모델 변경, Gateway 시작/중지/재시작, 에이전트 생성 및 Plugin 설치가 포함됩니다.

doctor 복구는 세션을 구동하는 제공자, 인증 또는 기본 에이전트 추론 경로를 다시 작성할 수 있으므로 Crestodian 내부에서 사용할 수 없습니다. Crestodian을 종료하고 터미널에서 `openclaw doctor --fix`를 실행합니다. 읽기 전용 `doctor`는 Crestodian 내부에서 계속 사용할 수 있습니다.

새 에이전트는 실시간으로 검증된 기본 추론 경로를 상속합니다. 에이전트 ID `crestodian`은 권한 있는 가상 관리자를 위해 예약되어 있으며 일반 에이전트로 생성할 수 없습니다.

`config set`과 `config set-ref`는 추론 제공자 자격 증명, 최상위 `auth.*`, 모델 카탈로그, CLI 백엔드, 기본/에이전트별 모델 경로, 에이전트 매개변수/도구 또는 루트 `tools.*`를 포함한 추론 경로 상태를 변경할 수 없습니다. `env.*`, `secrets.*`, `plugins.*` 및 `$include` 아래의 원시 쓰기도 자격 증명 확인 방식이나 제공자 활성화를 대체할 수 있으므로 거부됩니다. Gateway 및 채널 인증은 일반 구성 표면으로 유지됩니다. 형식화된 Plugin/채널 워크플로와 이미 구성된 경로에 대한 `set default model <provider/model>`을 사용합니다. 이 명령은 저장하기 전에 경로를 실시간으로 테스트합니다. 제공자/인증 접근을 구성하거나 복구하려면 Crestodian을 종료하고 `openclaw onboard`를 실행합니다.

제공자 Plugin을 제거하면 세션을 구동하는 추론 경로가 비활성화될 수 있으므로 Crestodian 내부에서는 Plugin 제거가 거부됩니다. Crestodian을 종료하고 터미널에서 `openclaw plugins uninstall <id>`를 실행합니다.

승인은 사용자의 표현으로 수행됩니다. 모호하지 않은 응답("예", "좋습니다", "진행하세요", "지금은 안 됩니다")은 폐쇄형 결정론적 목록에 따라 처리됩니다. 구성된 경로가 별도의 완료 호출을 지원하는 경우, 그 외 응답은 사용자의 메시지와 대기 중인 제안만을 사용해 분류할 수 있습니다. 자체 승인할 수 없는 대화 모델 자체가 분류하지는 않습니다. 분류할 수 없거나 모호한 응답이면 제안을 대기 상태로 유지하고 대화에서 다시 묻습니다.

적용된 쓰기는 `~/.openclaw/audit/crestodian.jsonl`에 기록됩니다. 탐색은 감사하지 않으며, 적용된 작업과 쓰기만 감사합니다.

채널 설정은 비밀 정보에 도달할 때까지 호스팅된 대화로 실행할 수 있습니다. 로컬 Crestodian TUI에서는 터미널 채팅 입력이 노출되므로 민감한 마법사 답변을 받지 않습니다. 선택한 채널을 마스킹된 터미널 마법사로 전달하는 `open channel wizard`를 즉시 제안합니다. 나중에 `openclaw channels add --channel <channel>`을 실행할 수도 있습니다.

### 마스킹된 채널 설정으로 전환

로컬 채팅은 마스킹된 채널 마법사로 제어를 넘길 수 있습니다.

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>`은 채팅 TUI가 닫힌 후 마스킹된 채널 설정을 엽니다. 먼저 `channel info <channel>`을 사용하여 채널 레이블, 설정 상태, 필수 조건 요약 및 문서 링크를 확인합니다.

Crestodian은 자체 세션 내부에서 제공자/인증 접근을 변경하지 않습니다. 세션 자체가 이미 해당 추론 경로에 의존하기 때문입니다. 모델 제공자 설정 또는 복구 시 `configure model provider`는 마법사를 시작하거나 구성을 작성하지 않고 종료/온보딩 안내를 반환합니다. Crestodian을 종료하고 `openclaw onboard`를 실행합니다. 온보딩은 자격 증명을 준비하고 실제 실시간 턴을 완료한 경로만 저장합니다. 온보딩이 성공한 후 Crestodian을 다시 시작합니다.

## 설정 부트스트랩

`setup`은 안내형 온보딩에서 추론을 이미 설정한 후 남은 작업 공간 및 Gateway 상태를 구성합니다. 형식화된 구성 작업을 통해서만 쓰기를 수행하며 먼저 승인을 요청합니다.

```text
setup
setup workspace ~/Projects/work
```

`setup`은 검증된 유효 모델을 보존합니다. 추론을 구성하거나 대체하지 않습니다.

추론이 없거나 실시간 확인에 실패하면 Crestodian을 종료하고 `openclaw onboard`를 실행합니다. 안내형 온보딩은 구성된 모델, API 키 및 인증된 로컬 CLI를 감지하고 각 후보에게 실제 응답을 요청한 다음 통과한 경로만 저장합니다. 해당 경계 직후 Crestodian이 시작되며, 이후 작업 공간, Gateway, 채널, 에이전트, Plugin 및 기타 선택적 기능을 구성할 수 있습니다.

macOS 앱은 기본 에이전트에 구성된 모델이 이미 있는 구성된 Gateway에 도달하면 이 단계를 완전히 건너뛰고 일반 에이전트 UI를 엽니다.
새 Gateway 또는 설정이 완료되지 않은 Gateway의 경우 앱은 `crestodian.setup.detect` 및 `crestodian.setup.activate` Gateway 메서드를 통해 추론 단계를 진행합니다. detect는 발견한 모든 후보 백엔드를 나열하고, activate는 한 후보를 실시간으로 테스트합니다(실제 "reply with OK" 완료). 테스트를 통과한 후에만 해당 경로에 필요한 모델, 자격 증명 및 제공자/런타임 상태를 저장합니다. 작업 공간 및 Gateway 기본값은 Crestodian이 처리하도록 남겨 둡니다. 실패한 후보는 구성을 변경하지 않습니다. 앱은 자동으로 다음 후보로 이동하고, 마지막에는 Gateway에서 활성화된 텍스트 추론 제공자 Plugin을 기반으로 채워진 수동 키/토큰 단계를 제공합니다. 선택한 제공자가 시작 모델과 구성을 소유하며, 자격 증명도 저장 전에 동일한 방식으로 검증됩니다.

Codex 감독 및 기타 선택적 Plugin 기능은 이 추론 활성화 트랜잭션 외부에 유지됩니다. 추론이 작동하고 Crestodian이 시작된 후에만 구성합니다. 기존 Plugin 정책과 명시적인 감독 제외 설정은 추론 설정 중에 변경되지 않습니다.

## AI 대화

대화형 Crestodian의 자유 형식 대화는 일반 OpenClaw 에이전트와 동일한 에이전트 루프를 통해 실행되며, 형식화된 작업을 래핑하는 단 하나의 링 제로 OpenClaw 권한 도구인 `crestodian`으로 제한됩니다. 읽기 작업은 자유롭게 실행되고, 변경 작업에는 해당 작업에 대한 사용자의 대화형 승인이 필요하며(작업 및 승인 참조), 적용된 모든 쓰기는 감사 및 재검증됩니다. 에이전트 세션은 유지되므로 Crestodian은 실제 다중 턴 메모리를 가집니다. 검증된 추론 경로가 나중에 작동을 멈추면 `openclaw onboard`로 돌아가 복구한 후 계속합니다.

호스트는 자연어 요청을 작업으로 해석하지 않습니다. 명령처럼 보이는 텍스트와 "내 gateway가 왜 중지되었나요?" 같은 질문을 포함한 자유 형식 메시지는 AI로 전달되며, AI는 `crestodian` 도구를 통해 요청을 형식화된 작업에 매핑할 수 있습니다.

변경 작업이 대기 중일 때는 폐쇄형 목록에 있는 모호하지 않은 승인 또는 거절 표현만 추론 없이 처리됩니다. 모호한 동의는 별도로 구성된 완료 호출로 전달되며, 그렇지 않으면 안전하게 거부됩니다. 구조화된 마법사 필드와 정확한 호스트 탐색은 UI 제어 기능이지 자연어 작업 해석이 아닙니다. 특히 중요한 비밀 정보 위생 예외가 하나 있습니다. 민감한 경로(토큰, 키, 비밀번호)에 대한 정확한 `config set`은 절대 모델에 전달되지 않습니다. 호스트가 수정된 제안을 생성하고 AI에 표시되는 기록에서는 값이 마스킹됩니다. 비밀 정보에는 `config set-ref <path> env <ENV_VAR>`을 사용하는 것이 좋습니다.

메시지 채널 구조 모드에서는 모델 지원 플래너를 사용하지 않습니다. 원격 구조는 결정론적으로 유지되므로 손상되었거나 침해된 일반 에이전트 경로를 구성 편집기로 사용할 수 없습니다.

### CLI 하네스 신뢰 모델

임베디드 런타임과 Codex 앱 서버 하네스는 링 제로 제한을 직접 적용합니다. 실행에는 `crestodian` 도구만 포함된 OpenClaw 도구 허용 목록이 전달됩니다. Codex의 경우 OpenClaw는 해당 실행에서 환경, 네이티브 실행, 다중 에이전트, 목표, 앱/Plugin, skill/MCP, 웹 검색 및 `request_user_input` 표면도 비활성화합니다. Codex는 비활성 상태인 네이티브 `update_plan` 유틸리티를 계속 주입합니다. 이 유틸리티는 모델의 임시 체크리스트를 업데이트할 수 있지만 파일이나 OpenClaw 구성을 작성할 수는 없습니다. CLI 하네스는 OpenClaw의 허용 목록을 사용하지 않으므로 Crestodian은 자체 도구 선택 계약으로 동일한 제한을 입증할 수 있는 백엔드만 허용합니다:

- Claude Code를 포함한 선택 가능한 백엔드는 빈 네이티브 도구
  선택과 하나의 MCP 도구인 `crestodian`으로 시작합니다. Claude가 생성한 MCP 구성은
  `--strict-mcp-config`와 함께 적용되므로 다른 MCP 서버는 로드되지 않습니다.
- 네이티브 도구를 선언하지 않은 백엔드에도 동일한 전용 Crestodian
  MCP 서버가 제공됩니다.
- 항상 활성화되거나 알 수 없는 네이티브 도구 백엔드는 추론 전에 안전하게 실패하며,
  Crestodian 세션을 호스팅할 수 없습니다.

Crestodian 세션만 crestodian MCP 서버를 사용하며, 일반 에이전트 실행에는
이 도구가 절대 표시되지 않습니다. 따라서 선택 가능하며 네이티브 도구가 없는 CLI 백엔드와 API 키 모델은
문자 그대로 단일 도구 루프를 강제합니다. Codex 앱 서버 모델은
하나의 OpenClaw 권한 도구와 비활성 네이티브 계획 유틸리티만 허용합니다. 세
경우 모두 설정 쓰기는 Crestodian의 감사 가능한 승인
계약으로 제한됩니다.

Gemini CLI는 일반 에이전트에서 계속 사용할 수 있지만, 추론 게이트에 필요한
도구 없는 프로브를 강제할 수 없으므로 Crestodian을 호스팅할 수 없습니다.

## 에이전트로 전환

자연어 선택 문구를 사용하여 Crestodian을 종료하고 일반 TUI를 엽니다.

```text
에이전트와 대화
작업 에이전트와 대화
기본 에이전트로 전환
```

`openclaw tui`, `openclaw chat`, `openclaw terminal`은 일반 에이전트 TUI를 직접 열며 Crestodian을 시작하지 않습니다. 일반 TUI로 전환한 후 `/crestodian`을 입력하면 Crestodian으로 돌아가며, 선택적으로 후속 요청을 함께 지정할 수 있습니다.

```text
/crestodian
/crestodian restart gateway
```

## 메시지 복구 모드

메시지 복구 모드는 Crestodian의 메시지 채널 진입점입니다. 일반 에이전트가 작동하지 않지만 신뢰할 수 있는 채널(예: WhatsApp)에서 여전히 명령을 수신할 수 있을 때 사용합니다.

이는 대화형 Crestodian 에이전트가 아니라 결정론적 긴급 명령 처리기입니다.
새 설정을 부트스트랩하거나 Crestodian 채팅의 추론
게이트를 완화하지 않습니다.

지원 명령: `/crestodian <request>`. 복구 기능은 정확히 입력된 명령 문법만 허용합니다. 자연어는 힌트와 함께 거부되고, 작업으로 추측하여 변환되지 않으며, 모델은 절대 사용되지 않습니다.

```text
신뢰할 수 있는 소유자 DM의 사용자: /crestodian status
OpenClaw: Crestodian 복구 모드. Gateway 연결 가능: 아니요. 구성이 유효함: 아니요.
사용자: /crestodian restart gateway
OpenClaw: 계획: Gateway를 다시 시작합니다. 적용하려면 /crestodian yes로 응답하세요.
사용자: /crestodian yes
OpenClaw: 적용되었습니다. 감사 항목이 기록되었습니다.
```

에이전트 생성도 로컬 또는 복구 기능을 통해 대기열에 추가할 수 있습니다.

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

에이전트를 생성할 때는 현재 실시간 검증된 기본 모델만 지정할 수 있습니다. 해당 경로를 상속하려면
모델을 생략합니다.

원격 복구는 관리자 영역이므로 일반 채팅이 아니라 원격 구성 복구와 동일하게 취급해야 합니다.

원격 복구의 보안 계약:

- 에이전트/세션에 샌드박스가 활성화된 경우 비활성화됩니다. Crestodian은 원격 복구를 거부하고 로컬 CLI 복구를 안내합니다.
- 기본 유효 상태는 `auto`입니다. 런타임에 이미 샌드박스가 적용되지 않은 로컬 권한이 있는 신뢰할 수 있는 YOLO 작업에서만 원격 복구를 허용합니다(`tools.exec.security`가 `full`로 결정되고 `tools.exec.ask`가 `off`로 결정되며 샌드박스 모드는 `off`).
- 명시적인 소유자 ID가 필요합니다. 와일드카드 발신자 규칙, 개방형 그룹 정책, 인증되지 않은 Webhook 또는 익명 채널은 허용되지 않습니다.
- 기본적으로 소유자 DM에서만 사용할 수 있습니다. 그룹/채널 복구는 명시적으로 활성화해야 합니다.
- Plugin 검색 및 목록 조회는 읽기 전용입니다. Plugin 설치는 실행 가능 코드를 다운로드하므로 항상 로컬에서만 가능합니다(다른 조건에서 활성화되어 있어도 복구 모드에서는 차단됨). Plugin 제거는 로컬 Crestodian과 복구 모드 모두에서 거부됩니다. 터미널에서 `openclaw plugins uninstall <id>`를 실행하세요.
- 원격 복구는 로컬 TUI를 열거나 대화형 에이전트 세션으로 전환할 수 없습니다. 에이전트 인계에는 로컬 `openclaw`를 사용하세요.
- 영구 쓰기는 복구 모드에서도 여전히 승인이 필요합니다.
- 적용된 모든 복구 작업은 감사됩니다. 메시지 채널 복구는 채널, 계정, 발신자 및 소스 주소 메타데이터를 기록하며, 구성을 변경하는 작업은 변경 전후의 구성 해시도 기록합니다.
- 비밀 정보는 절대 그대로 표시되지 않습니다. SecretRef 검사는 값이 아닌 사용 가능 여부를 보고합니다.
- Gateway가 실행 중이면 복구 기능은 Gateway의 형식화된 작업을 우선 사용합니다. Gateway가 중지된 경우 일반 에이전트 루프에 의존하지 않는 최소한의 로컬 복구 영역만 사용합니다.

구성 형식:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"`(기본값)는 유효 런타임이 YOLO이고 샌드박스가 꺼진 경우에만 복구를 허용합니다. `false`는 메시지 채널 복구를 절대 허용하지 않습니다. `true`는 소유자/채널 검사를 통과하면 복구를 명시적으로 허용합니다(샌드박스 사용 시 거부되는 조건은 그대로 적용됨).
- `ownerDmOnly`: 복구를 소유자의 다이렉트 메시지로 제한합니다. 기본값은 `true`입니다.
- `pendingTtlMinutes`: 대기 중인 복구 쓰기가 만료되기 전에 `/crestodian yes` 승인을 기다리는 시간입니다. 기본값은 `15`입니다.

원격 복구는 다음 Docker 경로에서 검증됩니다.

```bash
pnpm test:docker:crestodian-rescue
```

선택적으로 실행하는 실시간 채널 명령 영역 스모크 테스트는 `/crestodian status`와 복구 처리기를 통한 영구 쓰기 승인 왕복 과정을 검사합니다.

```bash
pnpm test:live:crestodian-rescue-channel
```

추론 게이트가 적용된 패키지형 일회성 설정은 다음 명령으로 검증됩니다.

```bash
pnpm test:docker:crestodian-first-run
```

이 패키지형 CLI 경로는 빈 상태 디렉터리에서 시작하여 추론 없이는 Crestodian이
안전하게 실패함을 입증합니다. 그런 다음 패키지형 활성화 모듈을 통해 가짜 Claude를
테스트하고 활성화합니다. 그 후에야 모호한 요청이
플래너에 도달하여 형식화된 설정으로 변환되며, 이어서 추가
에이전트를 생성하고, Plugin 활성화와 토큰 SecretRef를 통해 Discord를
구성하고, 구성을 검증하며 감사 로그를 확인하는 일회성 명령을 실행합니다. 이 경로는
게이트/작업을 뒷받침하는 증거이며, 대화형 온보딩이나
Crestodian 에이전트/도구/승인 대화는 실행하지 않습니다. 아래 QA Lab 시나리오는
동일한 Docker 경로로 리디렉션됩니다.

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 관련 문서

- [CLI 참조](/ko/cli)
- [Doctor](/ko/cli/doctor)
- [TUI](/ko/cli/tui)
- [샌드박스](/ko/cli/sandbox)
- [보안](/ko/cli/security)
