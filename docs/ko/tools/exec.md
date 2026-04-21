---
read_when:
    - exec tool 사용 또는 수정
    - stdin 또는 TTY 동작 디버깅
summary: Exec tool 사용법, stdin 모드, TTY 지원
title: Exec Tool
x-i18n:
    generated_at: "2026-04-21T13:38:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Exec tool

워크스페이스에서 셸 명령을 실행합니다. `process` 를 통해 포그라운드 + 백그라운드 실행을 지원합니다.
`process` 가 허용되지 않으면 `exec` 는 동기식으로 실행되며 `yieldMs`/`background` 는 무시됩니다.
백그라운드 세션은 에이전트별 범위로 제한되며, `process` 는 같은 에이전트의 세션만 볼 수 있습니다.

## 매개변수

- `command` (필수)
- `workdir` (기본값: cwd)
- `env` (키/값 재정의)
- `yieldMs` (기본값 10000): 지연 후 자동 백그라운드 전환
- `background` (bool): 즉시 백그라운드 실행
- `timeout` (초, 기본값 1800): 만료 시 강제 종료
- `pty` (bool): 가능할 때 pseudo-terminal에서 실행(TTY 전용 CLI, 코딩 에이전트, 터미널 UI)
- `host` (`auto | sandbox | gateway | node`): 실행 위치
- `security` (`deny | allowlist | full`): `gateway`/`node` 에 대한 강제 모드
- `ask` (`off | on-miss | always`): `gateway`/`node` 에 대한 승인 프롬프트
- `node` (string): `host=node` 용 Node id/이름
- `elevated` (bool): 상승 모드 요청(sandbox를 벗어나 구성된 host 경로로 실행); `security=full` 은 elevated가 `full` 로 확인될 때만 강제됩니다

참고:

- `host` 기본값은 `auto` 입니다. 세션에 sandbox 런타임이 활성화되어 있으면 sandbox, 그렇지 않으면 gateway입니다.
- `auto` 는 기본 라우팅 전략이지 와일드카드가 아닙니다. 호출별 `host=node` 는 `auto` 에서 허용되며, 호출별 `host=gateway` 는 sandbox 런타임이 활성화되어 있지 않을 때만 허용됩니다.
- 추가 구성 없이도 `host=auto` 는 그대로 "그냥 작동"합니다. sandbox가 없으면 `gateway` 로 확인되고, 활성 sandbox가 있으면 sandbox에 머뭅니다.
- `elevated` 는 sandbox를 벗어나 구성된 host 경로로 실행합니다. 기본값은 `gateway` 이고, `tools.exec.host=node` 이거나 세션 기본값이 `host=node` 이면 `node` 입니다. 현재 세션/provider에 대해 elevated 접근이 활성화된 경우에만 사용할 수 있습니다.
- `gateway`/`node` 승인은 `~/.openclaw/exec-approvals.json` 에 의해 제어됩니다.
- `node` 는 페어링된 Node(companion app 또는 headless node host)가 필요합니다.
- 여러 Node를 사용할 수 있으면 `exec.node` 또는 `tools.exec.node` 를 설정해 하나를 선택하세요.
- `exec host=node` 는 Node용 유일한 셸 실행 경로입니다. 기존 `nodes.run` 래퍼는 제거되었습니다.
- Windows가 아닌 host에서는, 설정되어 있다면 exec가 `SHELL` 을 사용합니다. `SHELL` 이 `fish` 이면 fish와 호환되지 않는 스크립트를 피하기 위해 `PATH` 에서 `bash`(또는 `sh`)를 우선 사용하고, 둘 다 없으면 `SHELL` 로 대체합니다.
- Windows host에서는 exec가 PowerShell 7 (`pwsh`) 검색(Program Files, ProgramW6432, 그다음 PATH)을 우선하고, 이후 Windows PowerShell 5.1로 대체합니다.
- Host 실행(`gateway`/`node`)은 바이너리 하이재킹 또는 주입 코드 방지를 위해 `env.PATH` 와 loader 재정의(`LD_*`/`DYLD_*`)를 거부합니다.
- OpenClaw는 생성된 명령 환경(PTY 및 sandbox 실행 포함)에 `OPENCLAW_SHELL=exec` 를 설정하므로 셸/프로필 규칙이 exec-tool 컨텍스트를 감지할 수 있습니다.
- 중요: sandboxing은 기본적으로 **꺼져 있습니다**. sandboxing이 꺼져 있으면 암시적 `host=auto` 는 `gateway` 로 확인됩니다. 명시적 `host=sandbox` 는 조용히 gateway host에서 실행되는 대신 닫힌 실패로 처리됩니다. sandboxing을 활성화하거나 승인과 함께 `host=gateway` 를 사용하세요.
- 일반적인 Python/Node 셸 문법 실수를 위한 스크립트 사전 점검은 유효한 `workdir` 경계 내부 파일만 검사합니다. 스크립트 경로가 `workdir` 밖으로 확인되면 해당 파일에 대한 사전 점검은 건너뜁니다.
- 지금 시작하는 장기 실행 작업은 한 번만 시작하고, 자동 완료 wake가 활성화되어 있고 명령이 출력을 내거나 실패할 때 그것에 의존하세요. 로그, 상태, 입력 또는 개입에는 `process` 를 사용하세요. sleep 루프, timeout 루프, 반복 폴링으로 스케줄링을 흉내 내지 마세요.
- 나중에 실행되거나 일정에 따라 실행되어야 하는 작업에는 `exec` sleep/delay 패턴 대신 Cron을 사용하세요.

## Config

- `tools.exec.notifyOnExit` (기본값: true): true이면 백그라운드 exec 세션이 종료 시 시스템 이벤트를 큐에 넣고 Heartbeat를 요청합니다.
- `tools.exec.approvalRunningNoticeMs` (기본값: 10000): 승인 게이트된 exec가 이 시간보다 오래 실행되면 단일 "running" 알림을 보냅니다(0이면 비활성화).
- `tools.exec.host` (기본값: `auto`; sandbox 런타임이 활성화되면 `sandbox`, 아니면 `gateway` 로 확인)
- `tools.exec.security` (기본값: sandbox는 `deny`, unset일 때 gateway + node는 `full`)
- `tools.exec.ask` (기본값: `off`)
- 승인이 없는 host exec가 gateway + node의 기본값입니다. 승인/allowlist 동작을 원하면 `tools.exec.*` 와 host의 `~/.openclaw/exec-approvals.json` 둘 다 더 엄격하게 설정하세요. [Exec approvals](/ko/tools/exec-approvals#no-approval-yolo-mode) 를 참조하세요.
- YOLO는 `host=auto` 에서 오는 것이 아니라 host-policy 기본값(`security=full`, `ask=off`)에서 옵니다. gateway 또는 node 라우팅을 강제하려면 `tools.exec.host` 를 설정하거나 `/exec host=...` 를 사용하세요.
- `security=full` + `ask=off` 모드에서는 host exec가 구성된 정책을 직접 따릅니다. 추가 휴리스틱 명령 난독화 prefilter 또는 script-preflight 거부 계층은 없습니다.
- `tools.exec.node` (기본값: unset)
- `tools.exec.strictInlineEval` (기본값: false): true이면 `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` 같은 인라인 인터프리터 eval 형식은 항상 명시적 승인이 필요합니다. `allow-always` 는 무해한 인터프리터/스크립트 호출을 계속 유지할 수 있지만, 인라인 eval 형식은 매번 여전히 프롬프트를 표시합니다.
- `tools.exec.pathPrepend`: exec 실행 시 `PATH` 앞에 추가할 디렉터리 목록(gateway + sandbox만).
- `tools.exec.safeBins`: 명시적 allowlist 항목 없이 실행할 수 있는 stdin 전용 안전 바이너리. 동작 세부 사항은 [Safe bins](/ko/tools/exec-approvals#safe-bins-stdin-only) 를 참조하세요.
- `tools.exec.safeBinTrustedDirs`: `safeBins` 경로 검사에 대해 신뢰할 수 있는 추가 명시적 디렉터리. `PATH` 항목은 자동으로 신뢰되지 않습니다. 내장 기본값은 `/bin` 과 `/usr/bin` 입니다.
- `tools.exec.safeBinProfiles`: safe bin별 선택적 사용자 지정 argv 정책(`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

예시:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH 처리

- `host=gateway`: 로그인 셸의 `PATH` 를 exec 환경에 병합합니다. `env.PATH` 재정의는 host 실행에서 거부됩니다. daemon 자체는 여전히 최소 `PATH` 로 실행됩니다:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: 컨테이너 내부에서 `sh -lc` (로그인 셸)를 실행하므로 `/etc/profile` 이 `PATH` 를 재설정할 수 있습니다. OpenClaw는 내부 env var를 통해(셸 보간 없이) profile sourcing 뒤에 `env.PATH` 를 앞에 추가합니다. `tools.exec.pathPrepend` 도 여기 적용됩니다.
- `host=node`: 전달한 비차단 env 재정의만 Node로 전송됩니다. `env.PATH` 재정의는 host 실행에서 거부되며 node host에서는 무시됩니다. Node에서 추가 PATH 항목이 필요하면 node host 서비스 환경(systemd/launchd)을 구성하거나 표준 위치에 도구를 설치하세요.

에이전트별 Node 바인딩(config에서 에이전트 목록 인덱스 사용):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes 탭에는 동일한 설정을 위한 작은 “Exec node binding” 패널이 포함되어 있습니다.

## 세션 재정의 (`/exec`)

`/exec` 를 사용해 `host`, `security`, `ask`, `node` 의 **세션별** 기본값을 설정하세요.
현재 값을 보려면 인자 없이 `/exec` 를 보내세요.

예시:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 권한 부여 모델

`/exec` 는 **권한이 있는 발신자**(채널 allowlist/페어링 + `commands.useAccessGroups`)에 대해서만 적용됩니다.
이 명령은 **세션 상태만** 갱신하며 config는 기록하지 않습니다. exec를 강제로 비활성화하려면 tool 정책을 통해 거부하세요(`tools.deny: ["exec"]` 또는 에이전트별 설정). `security=full` 과 `ask=off` 를 명시적으로 설정하지 않는 한 host 승인은 계속 적용됩니다.

## Exec approvals (companion app / node host)

Sandbox된 에이전트는 exec가 gateway 또는 node host에서 실행되기 전에 요청별 승인을 요구할 수 있습니다.
정책, allowlist, UI 흐름은 [Exec approvals](/ko/tools/exec-approvals) 를 참조하세요.

승인이 필요하면 exec tool은 즉시 `status: "approval-pending"` 과 approval id를 반환합니다. 승인(또는 거부 / 시간 초과)되면 Gateway는 시스템 이벤트(`Exec finished` / `Exec denied`)를 발생시킵니다. 명령이 `tools.exec.approvalRunningNoticeMs` 이후에도 계속 실행 중이면 단일 `Exec running` 알림이 발생합니다.
기본 승인 카드/버튼을 지원하는 채널에서는 에이전트가 먼저 그 기본 UI에 의존해야 하며, tool 결과가 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 명시적으로 말할 때만 수동 `/approve` 명령을 포함해야 합니다.

## Allowlist + safe bins

수동 allowlist 강제는 **확인된 바이너리 경로만** 일치시킵니다(베이스네임 일치 없음).  
`security=allowlist` 일 때 셸 명령은 모든 파이프라인 세그먼트가 allowlist에 있거나 safe bin인 경우에만 자동 허용됩니다. 체이닝(`;`, `&&`, `||`)과 리디렉션은 allowlist 모드에서 모든 최상위 세그먼트가 allowlist를 만족하지 않으면 거부됩니다(safe bins 포함). 리디렉션은 여전히 지원되지 않습니다.
지속적인 `allow-always` 신뢰도 이 규칙을 우회하지 않습니다. 체인된 명령은 여전히 모든 최상위 세그먼트가 일치해야 합니다.

`autoAllowSkills` 는 exec approvals의 별도 편의 경로입니다. 수동 경로 allowlist 항목과 동일하지 않습니다. 엄격한 명시적 신뢰를 원하면 `autoAllowSkills` 를 비활성화하세요.

두 제어는 서로 다른 용도에 사용하세요:

- `tools.exec.safeBins`: 작은 stdin 전용 스트림 필터
- `tools.exec.safeBinTrustedDirs`: safe-bin 실행 파일 경로를 위한 명시적 추가 신뢰 디렉터리
- `tools.exec.safeBinProfiles`: 사용자 지정 safe bin을 위한 명시적 argv 정책
- allowlist: 실행 파일 경로에 대한 명시적 신뢰

`safeBins` 를 일반적인 allowlist처럼 취급하지 말고, 인터프리터/런타임 바이너리(예: `python3`, `node`, `ruby`, `bash`)를 추가하지 마세요. 그런 것이 필요하면 명시적 allowlist 항목을 사용하고 승인 프롬프트를 활성화한 상태로 유지하세요.
`openclaw security audit` 는 인터프리터/런타임 `safeBins` 항목에 명시적 프로필이 없을 때 경고하며, `openclaw doctor --fix` 는 누락된 사용자 지정 `safeBinProfiles` 항목을 스캐폴드할 수 있습니다.
`openclaw security audit` 와 `openclaw doctor` 는 또한 `jq` 같은 광범위 동작 바이너리를 `safeBins` 에 명시적으로 다시 추가할 때 경고합니다.
인터프리터를 명시적으로 allowlist에 넣는다면 `tools.exec.strictInlineEval` 을 활성화하여 인라인 코드 eval 형식이 여전히 새 승인을 요구하도록 하세요.

전체 정책 세부 사항과 예시는 [Exec approvals](/ko/tools/exec-approvals#safe-bins-stdin-only) 및 [Safe bins versus allowlist](/ko/tools/exec-approvals#safe-bins-versus-allowlist) 를 참조하세요.

## 예시

포그라운드:

```json
{ "tool": "exec", "command": "ls -la" }
```

백그라운드 + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

폴링은 대기 루프가 아니라 필요 시 상태 확인용입니다. 자동 완료 wake가 활성화되어 있으면 명령이 출력을 내거나 실패할 때 세션을 깨울 수 있습니다.

키 전송(tmux 스타일):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

제출(CR만 전송):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

붙여넣기(기본적으로 bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 는 구조화된 다중 파일 편집을 위한 `exec` 의 하위 tool입니다.
OpenAI 및 OpenAI Codex 모델에 대해 기본적으로 활성화되어 있습니다. 비활성화하거나 특정 모델로 제한하려는 경우에만 config를 사용하세요:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

참고:

- OpenAI/OpenAI Codex 모델에서만 사용할 수 있습니다.
- tool 정책은 여전히 적용됩니다. `allow: ["write"]` 는 암묵적으로 `apply_patch` 도 허용합니다.
- config는 `tools.exec.applyPatch` 아래에 있습니다.
- `tools.exec.applyPatch.enabled` 의 기본값은 `true` 입니다. OpenAI 모델에서 tool을 비활성화하려면 `false` 로 설정하세요.
- `tools.exec.applyPatch.workspaceOnly` 의 기본값은 `true` 입니다(워크스페이스 내부로 제한). `apply_patch` 가 워크스페이스 디렉터리 밖에서도 쓰기/삭제하도록 의도한 경우에만 `false` 로 설정하세요.

## 관련 항목

- [Exec Approvals](/ko/tools/exec-approvals) — 셸 명령용 승인 게이트
- [Sandboxing](/ko/gateway/sandboxing) — sandbox 환경에서 명령 실행
- [백그라운드 프로세스](/ko/gateway/background-process) — 장기 실행 exec 및 process tool
- [보안](/ko/gateway/security) — tool 정책 및 elevated access
