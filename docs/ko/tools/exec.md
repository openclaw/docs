---
read_when:
    - exec 도구 사용 또는 수정
    - stdin 또는 TTY 동작 디버깅
summary: Exec 도구 사용, stdin 모드 및 TTY 지원
title: 실행 도구
x-i18n:
    generated_at: "2026-05-02T22:22:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

워크스페이스에서 셸 명령을 실행합니다. `process`를 통해 포그라운드 및 백그라운드 실행을 지원합니다.
`process`가 허용되지 않으면 `exec`는 동기적으로 실행되고 `yieldMs`/`background`를 무시합니다.
백그라운드 세션은 에이전트별로 범위가 지정됩니다. `process`는 같은 에이전트의 세션만 봅니다.

## 매개변수

<ParamField path="command" type="string" required>
실행할 셸 명령입니다.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
명령의 작업 디렉터리입니다.
</ParamField>

<ParamField path="env" type="object">
상속된 환경 위에 병합되는 키/값 환경 재정의입니다.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
이 지연 시간(ms) 후 명령을 자동으로 백그라운드로 전환합니다.
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs`를 기다리지 않고 명령을 즉시 백그라운드로 전환합니다.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
이 호출에 대해 구성된 exec 제한 시간을 재정의합니다. 명령이 exec 프로세스 제한 시간 없이 실행되어야 할 때만 `timeout: 0`을 설정하세요.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
사용 가능한 경우 의사 터미널에서 실행합니다. TTY 전용 CLI, 코딩 에이전트, 터미널 UI에 사용하세요.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
실행 위치입니다. `auto`는 샌드박스 런타임이 활성화되어 있으면 `sandbox`로, 그렇지 않으면 `gateway`로 확인됩니다.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 실행에 대한 적용 모드입니다.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 실행에 대한 승인 프롬프트 동작입니다.
</ParamField>

<ParamField path="node" type="string">
`host=node`일 때 Node ID/이름입니다.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
상승 모드를 요청합니다. 샌드박스를 벗어나 구성된 호스트 경로로 이동합니다. `elevated`가 `full`로 확인될 때만 `security=full`이 강제됩니다.
</ParamField>

참고:

- `host`의 기본값은 `auto`입니다. 세션에 샌드박스 런타임이 활성화되어 있으면 샌드박스, 그렇지 않으면 Gateway입니다.
- `host`는 `auto`, `sandbox`, `gateway`, `node`만 허용합니다. 호스트 이름 선택자가 아니며, 호스트 이름처럼 보이는 값은 명령 실행 전에 거부됩니다.
- `auto`는 기본 라우팅 전략이지 와일드카드가 아닙니다. `auto`에서 호출별 `host=node`는 허용됩니다. 호출별 `host=gateway`는 샌드박스 런타임이 활성화되어 있지 않을 때만 허용됩니다.
- 추가 구성이 없어도 `host=auto`는 그대로 작동합니다. 샌드박스가 없으면 `gateway`로 확인되고, 활성 샌드박스가 있으면 샌드박스에 머뭅니다.
- `elevated`는 샌드박스를 벗어나 구성된 호스트 경로로 이동합니다. 기본값은 `gateway`이며, `tools.exec.host=node`인 경우(또는 세션 기본값이 `host=node`인 경우)에는 `node`입니다. 현재 세션/공급자에 상승 액세스가 활성화되어 있을 때만 사용할 수 있습니다.
- `gateway`/`node` 승인은 `~/.openclaw/exec-approvals.json`으로 제어됩니다.
- `node`에는 페어링된 Node(동반 앱 또는 헤드리스 Node 호스트)가 필요합니다.
- 여러 Node를 사용할 수 있으면 `exec.node` 또는 `tools.exec.node`를 설정하여 하나를 선택하세요.
- `exec host=node`는 Node의 유일한 셸 실행 경로입니다. 기존 `nodes.run` 래퍼는 제거되었습니다.
- `timeout`은 포그라운드, 백그라운드, `yieldMs`, Gateway, 샌드박스, Node `system.run` 실행에 적용됩니다. 생략하면 OpenClaw는 `tools.exec.timeoutSec`를 사용합니다. 명시적인 `timeout: 0`은 해당 호출에 대한 exec 프로세스 제한 시간을 비활성화합니다.
- Windows가 아닌 호스트에서 exec는 설정된 경우 `SHELL`을 사용합니다. `SHELL`이 `fish`이면 fish와 호환되지 않는 스크립트를 피하기 위해 `PATH`에서 `bash`(또는 `sh`)를 우선 사용한 다음, 둘 다 없으면 `SHELL`로 폴백합니다.
- Windows 호스트에서 exec는 PowerShell 7(`pwsh`) 검색(Program Files, ProgramW6432, 그다음 PATH)을 우선 사용한 다음 Windows PowerShell 5.1로 폴백합니다.
- 호스트 실행(`gateway`/`node`)은 바이너리 하이재킹이나 주입된 코드를 방지하기 위해 `env.PATH`와 로더 재정의(`LD_*`/`DYLD_*`)를 거부합니다.
- OpenClaw는 생성된 명령 환경(PTY 및 샌드박스 실행 포함)에서 `OPENCLAW_SHELL=exec`를 설정하여 셸/프로필 규칙이 exec 도구 컨텍스트를 감지할 수 있게 합니다.
- `openclaw channels login`은 대화형 채널 인증 흐름이므로 `exec`에서 차단됩니다. Gateway 호스트의 터미널에서 실행하거나, 채널 네이티브 로그인 도구가 있으면 채팅에서 사용하세요.
- 중요: 샌드박싱은 **기본적으로 꺼져 있습니다**. 샌드박싱이 꺼져 있으면 암시적 `host=auto`는 `gateway`로 확인됩니다. 명시적 `host=sandbox`는 Gateway 호스트에서 조용히 실행되는 대신 여전히 닫힌 상태로 실패합니다. 샌드박싱을 활성화하거나 승인과 함께 `host=gateway`를 사용하세요.
- 스크립트 사전 검사(일반적인 Python/Node 셸 구문 실수용)는 유효한 `workdir` 경계 안의 파일만 검사합니다. 스크립트 경로가 `workdir` 밖으로 확인되면 해당 파일에 대한 사전 검사는 건너뜁니다.
- 지금 시작되는 장기 실행 작업은 한 번만 시작하고, 활성화되어 있으며 명령이 출력을 내거나 실패할 때 자동 완료 웨이크에 의존하세요. 로그, 상태, 입력 또는 개입에는 `process`를 사용하세요. sleep 루프, timeout 루프 또는 반복 폴링으로 스케줄링을 흉내 내지 마세요.
- 나중에 또는 일정에 따라 실행되어야 하는 작업에는 `exec` sleep/delay 패턴 대신 cron을 사용하세요.

## 구성

- `tools.exec.notifyOnExit`(기본값: true): true이면 백그라운드로 전환된 exec 세션이 종료 시 시스템 이벤트를 큐에 넣고 Heartbeat를 요청합니다.
- `tools.exec.approvalRunningNoticeMs`(기본값: 10000): 승인 게이트가 있는 exec가 이 시간보다 오래 실행되면 단일 “실행 중” 알림을 내보냅니다(0이면 비활성화).
- `tools.exec.timeoutSec`(기본값: 1800): 명령별 기본 exec 제한 시간(초)입니다. 호출별 `timeout`이 이를 재정의합니다. 호출별 `timeout: 0`은 exec 프로세스 제한 시간을 비활성화합니다.
- `tools.exec.host`(기본값: `auto`; 샌드박스 런타임이 활성화되어 있으면 `sandbox`, 그렇지 않으면 `gateway`로 확인됨)
- `tools.exec.security`(기본값: 샌드박스는 `deny`, 설정되지 않은 경우 Gateway + Node는 `full`)
- `tools.exec.ask`(기본값: `off`)
- 승인 없는 호스트 exec는 Gateway + Node의 기본값입니다. 승인/allowlist 동작을 원하면 `tools.exec.*`와 호스트 `~/.openclaw/exec-approvals.json`을 모두 강화하세요. [Exec approvals](/ko/tools/exec-approvals#yolo-mode-no-approval)를 참조하세요.
- YOLO는 `host=auto`가 아니라 호스트 정책 기본값(`security=full`, `ask=off`)에서 옵니다. Gateway 또는 Node 라우팅을 강제하려면 `tools.exec.host`를 설정하거나 `/exec host=...`를 사용하세요.
- `security=full` 및 `ask=off` 모드에서 호스트 exec는 구성된 정책을 직접 따릅니다. 추가 휴리스틱 명령 난독화 사전 필터나 스크립트 사전 검사 거부 계층은 없습니다.
- `tools.exec.node`(기본값: 설정 안 됨)
- `tools.exec.strictInlineEval`(기본값: false): true이면 `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` 같은 인라인 인터프리터 eval 형식은 항상 명시적 승인이 필요합니다. `allow-always`는 여전히 무해한 인터프리터/스크립트 호출을 유지할 수 있지만, inline-eval 형식은 매번 프롬프트를 표시합니다.
- `tools.exec.pathPrepend`: exec 실행을 위해 `PATH` 앞에 추가할 디렉터리 목록입니다(Gateway + 샌드박스만).
- `tools.exec.safeBins`: 명시적 allowlist 항목 없이 실행할 수 있는 stdin 전용 안전 바이너리입니다. 동작 세부 사항은 [Safe bins](/ko/tools/exec-approvals-advanced#safe-bins-stdin-only)를 참조하세요.
- `tools.exec.safeBinTrustedDirs`: `safeBins` 경로 검사에서 신뢰할 추가 명시적 디렉터리입니다. `PATH` 항목은 자동으로 신뢰되지 않습니다. 기본 내장값은 `/bin` 및 `/usr/bin`입니다.
- `tools.exec.safeBinProfiles`: 안전 바이너리별 선택적 사용자 지정 argv 정책(`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)입니다.

예:

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

- `host=gateway`: 로그인 셸 `PATH`를 exec 환경에 병합합니다. 호스트 실행에서는 `env.PATH` 재정의가 거부됩니다. 데몬 자체는 여전히 최소 `PATH`로 실행됩니다.
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: 컨테이너 안에서 `sh -lc`(로그인 셸)를 실행하므로 `/etc/profile`이 `PATH`를 재설정할 수 있습니다. OpenClaw는 내부 env var를 통해 프로필 소싱 후 `env.PATH`를 앞에 추가합니다(셸 보간 없음). `tools.exec.pathPrepend`도 여기에 적용됩니다.
- `host=node`: 전달한 차단되지 않은 env 재정의만 Node로 전송됩니다. 호스트 실행에서는 `env.PATH` 재정의가 거부되고 Node 호스트에서 무시됩니다. Node에 추가 PATH 항목이 필요하면 Node 호스트 서비스 환경(systemd/launchd)을 구성하거나 표준 위치에 도구를 설치하세요.

에이전트별 Node 바인딩(구성에서 에이전트 목록 인덱스 사용):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes 탭에는 동일한 설정을 위한 작은 “Exec node binding” 패널이 포함됩니다.

## 세션 재정의(`/exec`)

`/exec`를 사용해 `host`, `security`, `ask`, `node`에 대한 **세션별** 기본값을 설정합니다.
현재 값을 표시하려면 인수 없이 `/exec`를 보내세요.

예:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 권한 부여 모델

`/exec`는 **승인된 발신자**(채널 allowlist/페어링 및 `commands.useAccessGroups`)에게만 적용됩니다.
**세션 상태만** 업데이트하며 구성을 쓰지 않습니다. exec를 강제로 비활성화하려면 도구 정책(`tools.deny: ["exec"]` 또는 에이전트별)을 통해 거부하세요. `security=full` 및 `ask=off`를 명시적으로 설정하지 않는 한 호스트 승인은 계속 적용됩니다.

## Exec approvals(동반 앱 / Node 호스트)

샌드박스된 에이전트는 `exec`가 Gateway 또는 Node 호스트에서 실행되기 전에 요청별 승인을 요구할 수 있습니다.
정책, allowlist 및 UI 흐름은 [Exec approvals](/ko/tools/exec-approvals)를 참조하세요.

승인이 필요하면 exec 도구는 `status: "approval-pending"` 및 승인 ID와 함께 즉시 반환됩니다. 승인되면(또는 거부/시간 초과되면) Gateway가 시스템 이벤트(`Exec finished` / `Exec denied`)를 내보냅니다. 명령이 `tools.exec.approvalRunningNoticeMs` 이후에도 계속 실행 중이면 단일 `Exec running` 알림이 내보내집니다.
네이티브 승인 카드/버튼이 있는 채널에서 에이전트는 먼저 해당 네이티브 UI에 의존해야 하며, 도구 결과가 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 명시적으로 말할 때만 수동 `/approve` 명령을 포함해야 합니다.

## Allowlist + safe bins

수동 allowlist 적용은 확인된 바이너리 경로 glob 및 순수 명령 이름 glob과 일치합니다. 순수 이름은 PATH를 통해 호출된 명령에만 일치하므로, 명령이 `rg`이면 `rg`가 `/opt/homebrew/bin/rg`와 일치할 수 있지만 `./rg` 또는 `/tmp/rg`와는 일치하지 않습니다.
`security=allowlist`일 때 셸 명령은 모든 파이프라인 세그먼트가 allowlist에 있거나 안전 바이너리인 경우에만 자동 허용됩니다. 체이닝(`;`, `&&`, `||`) 및 리디렉션은 모든 최상위 세그먼트가 allowlist(안전 바이너리 포함)를 충족하지 않는 한 allowlist 모드에서 거부됩니다. 리디렉션은 계속 지원되지 않습니다.
지속적인 `allow-always` 신뢰는 이 규칙을 우회하지 않습니다. 체인 명령은 여전히 모든 최상위 세그먼트가 일치해야 합니다.

`autoAllowSkills`는 exec approvals의 별도 편의 경로입니다. 수동 경로 allowlist 항목과 동일하지 않습니다. 엄격한 명시적 신뢰가 필요하면 `autoAllowSkills`를 비활성화된 상태로 유지하세요.

서로 다른 작업에는 두 컨트롤을 사용하세요.

- `tools.exec.safeBins`: 작은 stdin 전용 스트림 필터입니다.
- `tools.exec.safeBinTrustedDirs`: safe-bin 실행 파일 경로를 위한 명시적 추가 신뢰 디렉터리입니다.
- `tools.exec.safeBinProfiles`: 사용자 지정 safe bins를 위한 명시적 argv 정책입니다.
- allowlist: 실행 파일 경로에 대한 명시적 신뢰입니다.

`safeBins`를 일반적인 허용 목록으로 취급하지 말고, 인터프리터/런타임 바이너리(예: `python3`, `node`, `ruby`, `bash`)를 추가하지 마세요. 이것들이 필요하다면 명시적인 허용 목록 항목을 사용하고 승인 프롬프트를 활성화한 상태로 유지하세요.
`openclaw security audit`는 인터프리터/런타임 `safeBins` 항목에 명시적인 프로필이 없을 때 경고하며, `openclaw doctor --fix`는 누락된 사용자 지정 `safeBinProfiles` 항목을 스캐폴드할 수 있습니다.
`openclaw security audit`와 `openclaw doctor`는 `jq` 같은 광범위한 동작의 bin을 명시적으로 `safeBins`에 다시 추가한 경우에도 경고합니다.
인터프리터를 명시적으로 허용 목록에 추가하는 경우, 인라인 코드 평가 형식이 여전히 새 승인을 요구하도록 `tools.exec.strictInlineEval`을 활성화하세요.

전체 정책 세부 정보와 예시는 [Exec 승인](/ko/tools/exec-approvals-advanced#safe-bins-stdin-only) 및 [안전한 bin과 허용 목록 비교](/ko/tools/exec-approvals-advanced#safe-bins-versus-allowlist)를 참조하세요.

## 예시

포그라운드:

```json
{ "tool": "exec", "command": "ls -la" }
```

백그라운드 + 폴링:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

폴링은 대기 루프가 아니라 온디맨드 상태 확인용입니다. 자동 완료 깨우기가
활성화되어 있으면 명령이 출력을 내보내거나 실패할 때 세션을 깨울 수 있습니다.

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

붙여넣기(기본값은 bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`는 구조화된 다중 파일 편집을 위한 `exec`의 하위 도구입니다.
OpenAI 및 OpenAI Codex 모델에서는 기본적으로 활성화됩니다. 비활성화하거나
특정 모델로 제한하려는 경우에만 구성을 사용하세요.

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

- OpenAI/OpenAI Codex 모델에서만 사용할 수 있습니다.
- 도구 정책은 계속 적용됩니다. `allow: ["write"]`는 암시적으로 `apply_patch`를 허용합니다.
- 구성은 `tools.exec.applyPatch` 아래에 있습니다.
- `tools.exec.applyPatch.enabled`의 기본값은 `true`입니다. OpenAI 모델에서 도구를 비활성화하려면 `false`로 설정하세요.
- `tools.exec.applyPatch.workspaceOnly`의 기본값은 `true`(워크스페이스 내부로 제한)입니다. 의도적으로 `apply_patch`가 워크스페이스 디렉터리 밖에 쓰기/삭제하도록 하려는 경우에만 `false`로 설정하세요.

## 관련 항목

- [Exec 승인](/ko/tools/exec-approvals) — 셸 명령에 대한 승인 게이트
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경에서 명령 실행
- [백그라운드 프로세스](/ko/gateway/background-process) — 장기 실행 exec 및 process 도구
- [보안](/ko/gateway/security) — 도구 정책 및 상승된 접근 권한
