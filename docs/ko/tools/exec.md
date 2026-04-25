---
read_when:
    - '`exec` 도구 사용 또는 수정하기'
    - stdin 또는 TTY 동작 디버깅
summary: Exec 도구 사용법, stdin 모드 및 TTY 지원
title: Exec 도구
x-i18n:
    generated_at: "2026-04-25T06:11:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

워크스페이스에서 셸 명령을 실행합니다. `process`를 통한 foreground + background 실행을 지원합니다.
`process`가 허용되지 않으면 `exec`는 동기적으로 실행되며 `yieldMs`/`background`를 무시합니다.
백그라운드 세션은 에이전트별로 범위가 지정되며, `process`는 같은 에이전트의 세션만 볼 수 있습니다.

## 파라미터

<ParamField path="command" type="string" required>
실행할 셸 명령.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
명령의 작업 디렉터리.
</ParamField>

<ParamField path="env" type="object">
상속된 환경 위에 병합되는 키/값 환경 override.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
이 지연(ms) 후 명령을 자동으로 백그라운드로 전환.
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs`를 기다리는 대신 즉시 백그라운드로 전환.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
이 시간(초)이 지나면 명령을 종료.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
가능한 경우 pseudo-terminal에서 실행합니다. TTY 전용 CLI, 코딩 에이전트, 터미널 UI에 사용하세요.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
실행 위치. `auto`는 세션에 sandbox runtime이 활성화되어 있으면 `sandbox`, 아니면 `gateway`로 해석됩니다.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 실행의 강제 모드.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 실행의 승인 프롬프트 동작.
</ParamField>

<ParamField path="node" type="string">
`host=node`일 때의 node id/이름.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
상승 모드 요청 — sandbox를 벗어나 구성된 host 경로로 탈출합니다. `elevated`가 `full`로 해석될 때만 `security=full`이 강제됩니다.
</ParamField>

참고:

- `host` 기본값은 `auto`입니다: 세션에 sandbox runtime이 활성화되어 있으면 sandbox, 그렇지 않으면 gateway.
- `auto`는 기본 라우팅 전략이지 와일드카드가 아닙니다. 호출별 `host=node`는 `auto`에서 허용되며, 호출별 `host=gateway`는 sandbox runtime이 활성화되지 않았을 때만 허용됩니다.
- 추가 config가 없더라도 `host=auto`는 여전히 “그냥 동작”합니다: sandbox가 없으면 `gateway`로 해석되고, 살아 있는 sandbox가 있으면 sandbox에 남습니다.
- `elevated`는 sandbox를 벗어나 구성된 host 경로로 탈출합니다: 기본은 `gateway`, 또는 `tools.exec.host=node`(또는 세션 기본값이 `host=node`)일 때는 `node`. 현재 세션/provider에 대해 상승 접근이 활성화된 경우에만 사용할 수 있습니다.
- `gateway`/`node` 승인은 `~/.openclaw/exec-approvals.json`이 제어합니다.
- `node`에는 페어링된 node(컴패니언 앱 또는 헤드리스 node 호스트)가 필요합니다.
- 여러 node를 사용할 수 있으면, 하나를 선택하려면 `exec.node` 또는 `tools.exec.node`를 설정하세요.
- `exec host=node`는 node용 유일한 셸 실행 경로이며, 레거시 `nodes.run` 래퍼는 제거되었습니다.
- Windows가 아닌 호스트에서는 exec가 `SHELL`이 설정되어 있으면 이를 사용합니다. `SHELL`이 `fish`이면
  fish와 호환되지 않는 스크립트를 피하기 위해 `PATH`의 `bash`(또는 `sh`)를 우선 사용하고,
  둘 다 없으면 `SHELL`로 fallback합니다.
- Windows 호스트에서는 exec가 PowerShell 7 (`pwsh`) 탐색(Program Files, ProgramW6432, 그다음 PATH)을 우선하고,
  그다음 Windows PowerShell 5.1로 fallback합니다.
- 호스트 실행(`gateway`/`node`)은 바이너리 하이재킹 또는 주입된 코드를 방지하기 위해
  `env.PATH`와 loader override(`LD_*`/`DYLD_*`)를 거부합니다.
- OpenClaw는 생성된 명령 환경(PTY 및 sandbox 실행 포함)에 `OPENCLAW_SHELL=exec`를 설정하므로 셸/profile 규칙이 exec-tool 컨텍스트를 감지할 수 있습니다.
- 중요: sandboxing은 기본적으로 **꺼져 있습니다**. sandboxing이 꺼져 있으면 암시적 `host=auto`는
  `gateway`로 해석됩니다. 명시적인 `host=sandbox`는 조용히
  gateway 호스트에서 실행되는 대신 여전히 실패 닫힘(fail closed)됩니다. sandboxing을 활성화하거나 승인과 함께 `host=gateway`를 사용하세요.
- 스크립트 preflight 검사(일반적인 Python/Node 셸 문법 실수용)는
  실제 `workdir` 경계 안의 파일만 검사합니다. 스크립트 경로가 `workdir` 밖으로 해석되면,
  해당 파일의 preflight는 건너뜁니다.
- 지금 시작하는 장기 실행 작업은 한 번만 시작하고,
  자동 완료 wake가 활성화되어 있으며 명령이 출력을 내거나 실패할 경우 이를 활용하세요.
  로그, 상태, 입력 또는 개입에는 `process`를 사용하고,
  sleep 루프, timeout 루프 또는 반복 폴링으로 예약을 흉내 내지 마세요.
- 나중이나 일정에 맞춰 실행되어야 하는 작업에는
  `exec`의 sleep/delay 패턴 대신 cron을 사용하세요.

## 구성

- `tools.exec.notifyOnExit` (기본값: true): true이면 백그라운드 exec 세션이 종료 시 시스템 이벤트를 큐에 넣고 heartbeat를 요청합니다.
- `tools.exec.approvalRunningNoticeMs` (기본값: 10000): 승인 게이트된 exec가 이 시간보다 오래 실행되면 “running” 알림 1회를 발생시킵니다(0이면 비활성화).
- `tools.exec.host` (기본값: `auto`; sandbox runtime이 활성화되어 있으면 `sandbox`, 그렇지 않으면 `gateway`로 해석)
- `tools.exec.security` (기본값: sandbox는 `deny`, gateway + node는 미설정 시 `full`)
- `tools.exec.ask` (기본값: `off`)
- 승인 없는 host exec가 gateway + node의 기본값입니다. 승인/allowlist 동작이 필요하면 `tools.exec.*`와 host `~/.openclaw/exec-approvals.json`을 모두 더 엄격하게 설정하세요. [Exec approvals](/ko/tools/exec-approvals#no-approval-yolo-mode)를 참조하세요.
- YOLO는 `host=auto`가 아니라 host 정책 기본값(`security=full`, `ask=off`)에서 옵니다. gateway 또는 node 라우팅을 강제하려면 `tools.exec.host`를 설정하거나 `/exec host=...`를 사용하세요.
- `security=full`과 `ask=off` 모드에서 host exec는 구성된 정책을 직접 따릅니다. 추가적인 휴리스틱 명령 난독화 prefilter 또는 script-preflight rejection 레이어는 없습니다.
- `tools.exec.node` (기본값: 미설정)
- `tools.exec.strictInlineEval` (기본값: false): true이면 `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` 같은 inline interpreter eval 형태는 항상 명시적 승인이 필요합니다. `allow-always`는 여전히 무해한 interpreter/script 호출을 지속적으로 허용할 수 있지만, inline-eval 형태는 매번 프롬프트를 띄웁니다.
- `tools.exec.pathPrepend`: exec 실행 시 `PATH` 앞에 추가할 디렉터리 목록(gateway + sandbox 전용).
- `tools.exec.safeBins`: 명시적인 allowlist 항목 없이 실행할 수 있는 stdin 전용 safe binary. 동작 세부 정보는 [Safe bins](/ko/tools/exec-approvals-advanced#safe-bins-stdin-only)를 참조하세요.
- `tools.exec.safeBinTrustedDirs`: `safeBins` 경로 검사에 신뢰되는 추가 명시적 디렉터리. `PATH` 항목은 절대 자동으로 신뢰되지 않습니다. 내장 기본값은 `/bin`과 `/usr/bin`입니다.
- `tools.exec.safeBinProfiles`: 커스텀 safe bin용 선택적 argv 정책(`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: 로그인 셸의 `PATH`를 exec 환경에 병합합니다. `env.PATH` override는
  host 실행에서 거부됩니다. daemon 자체는 여전히 최소 `PATH`로 실행됩니다:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: 컨테이너 내부에서 `sh -lc`(로그인 셸)를 실행하므로 `/etc/profile`이 `PATH`를 재설정할 수 있습니다.
  OpenClaw는 내부 env var를 통해 profile sourcing 후 `env.PATH`를 앞에 추가합니다(셸 interpolation 없음).
  `tools.exec.pathPrepend`도 여기 적용됩니다.
- `host=node`: 전달한 비차단 env override만 node로 전송됩니다. `env.PATH` override는
  host 실행에서 거부되며 node 호스트에서는 무시됩니다. node에서 추가 PATH 항목이 필요하면,
  node 호스트 서비스 환경(systemd/launchd)을 구성하거나 도구를 표준 위치에 설치하세요.

에이전트별 node 바인딩(config에서 에이전트 목록 인덱스를 사용):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes 탭에도 같은 설정을 위한 작은 “Exec node binding” 패널이 있습니다.

## 세션 override (`/exec`)

`/exec`를 사용해 `host`, `security`, `ask`, `node`의 **세션별** 기본값을 설정하세요.
인자 없이 `/exec`를 보내면 현재 값을 보여줍니다.

예시:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 권한 부여 모델

`/exec`는 **승인된 발신자**에게만 적용됩니다(채널 allowlist/페어링 + `commands.useAccessGroups`).
이는 **세션 상태만** 업데이트하며 config를 쓰지 않습니다. exec를 완전히 비활성화하려면 도구
정책(`tools.deny: ["exec"]` 또는 에이전트별)을 통해 거부하세요.
`security=full`과 `ask=off`를 명시적으로 설정하지 않는 한 host 승인은 여전히 적용됩니다.

## Exec approvals (컴패니언 앱 / node 호스트)

sandbox된 에이전트는 `exec`가 gateway 또는 node 호스트에서 실행되기 전에 요청별 승인을 요구할 수 있습니다.
정책, allowlist, UI 흐름은 [Exec approvals](/ko/tools/exec-approvals)를 참조하세요.

승인이 필요하면 exec 도구는
`status: "approval-pending"`과 approval id를 반환하고 즉시 종료합니다. 승인(또는 거부 / timeout)되면
Gateway는 시스템 이벤트(`Exec finished` / `Exec denied`)를 발생시킵니다. 명령이
`tools.exec.approvalRunningNoticeMs` 이후에도 계속 실행 중이면 “Exec running” 알림 1회가 발생합니다.
네이티브 승인 카드/버튼이 있는 채널에서는 에이전트가
우선 해당 네이티브 UI를 사용해야 하며, 도구
결과가 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 명시적으로 말할 때만 수동 `/approve` 명령을 포함해야 합니다.

## Allowlist + safe bins

수동 allowlist 강제는 해석된 binary path glob와 bare command-name
glob에 매칭됩니다. bare 이름은 PATH를 통해 호출된 명령만 매칭하므로, 명령이 `rg`일 때
`rg`는 `/opt/homebrew/bin/rg`와 매칭될 수 있지만 `./rg`나 `/tmp/rg`와는 매칭되지 않습니다.
`security=allowlist`일 때 셸 명령은 모든 파이프라인
세그먼트가 allowlist 또는 safe bin에 있을 때만 자동 허용됩니다. chaining(`;`, `&&`, `||`)과 redirection은
모든 최상위 세그먼트가 allowlist를 만족하지 않는 한(안전한 bin 포함)
allowlist 모드에서 거부됩니다. redirection은 여전히 지원되지 않습니다.
지속적인 `allow-always` 신뢰도 이 규칙을 우회하지 않습니다. chained 명령은 여전히 모든
최상위 세그먼트가 매칭되어야 합니다.

`autoAllowSkills`는 exec approvals의 별도 편의 경로입니다. 수동 path allowlist 항목과 같은 것이
아닙니다. 엄격한 명시적 신뢰가 필요하면 `autoAllowSkills`를 비활성화하세요.

두 제어 항목은 서로 다른 용도로 사용하세요:

- `tools.exec.safeBins`: 작은 stdin 전용 스트림 필터.
- `tools.exec.safeBinTrustedDirs`: safe-bin 실행 파일 경로용 명시적 추가 신뢰 디렉터리.
- `tools.exec.safeBinProfiles`: 커스텀 safe bin용 명시적 argv 정책.
- allowlist: 실행 파일 경로에 대한 명시적 신뢰.

`safeBins`를 범용 allowlist처럼 취급하지 말고, interpreter/runtime binary(`python3`, `node`, `ruby`, `bash` 등)를 추가하지 마세요. 그런 것이 필요하면 명시적인 allowlist 항목을 사용하고 승인 프롬프트를 활성화한 상태로 유지하세요.
`openclaw security audit`는 interpreter/runtime `safeBins` 항목에 명시적인 profile이 없을 때 경고하고, `openclaw doctor --fix`는 누락된 커스텀 `safeBinProfiles` 항목을 생성할 수 있습니다.
`openclaw security audit`와 `openclaw doctor`는 `jq` 같은 광범위한 동작의 bin을 `safeBins`에 명시적으로 다시 추가할 때도 경고합니다.
interpreter를 명시적으로 allowlist에 추가한다면 `tools.exec.strictInlineEval`을 활성화하여 inline code-eval 형태가 여전히 새 승인을 요구하도록 하세요.

전체 정책 세부 정보와 예시는 [Exec approvals](/ko/tools/exec-approvals-advanced#safe-bins-stdin-only) 및 [Safe bins versus allowlist](/ko/tools/exec-approvals-advanced#safe-bins-versus-allowlist)를 참조하세요.

## 예시

foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

폴링은 waiting loop가 아니라 온디맨드 상태 확인용입니다. 자동 완료 wake가
활성화되어 있으면 명령이 출력을 내거나 실패할 때 세션을 깨울 수 있습니다.

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

`apply_patch`는 구조화된 다중 파일 편집을 위한 `exec`의 하위 도구입니다.
기본적으로 OpenAI 및 OpenAI Codex 모델에서 활성화됩니다. 비활성화하거나 특정 모델로 제한하려는 경우에만 config를 사용하세요.

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

참고:

- OpenAI/OpenAI Codex 모델에서만 사용 가능합니다.
- 도구 정책은 여전히 적용되며, `allow: ["write"]`는 암묵적으로 `apply_patch`를 허용합니다.
- config는 `tools.exec.applyPatch` 아래에 있습니다.
- `tools.exec.applyPatch.enabled`의 기본값은 `true`이며, OpenAI 모델에서 이 도구를 비활성화하려면 `false`로 설정하세요.
- `tools.exec.applyPatch.workspaceOnly`의 기본값은 `true`(워크스페이스 내부로 제한)입니다. `apply_patch`가 워크스페이스 디렉터리 밖에서 쓰기/삭제하도록 의도적으로 원할 때만 `false`로 설정하세요.

## 관련 항목

- [Exec Approvals](/ko/tools/exec-approvals) — 셸 명령에 대한 승인 게이트
- [Sandboxing](/ko/gateway/sandboxing) — sandbox된 환경에서 명령 실행
- [Background Process](/ko/gateway/background-process) — 장기 실행 exec 및 process 도구
- [Security](/ko/gateway/security) — 도구 정책 및 상승 접근
