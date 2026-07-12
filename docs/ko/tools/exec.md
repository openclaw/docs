---
read_when:
    - exec 도구 사용 또는 수정
    - stdin 또는 TTY 동작 디버깅
summary: Exec 도구 사용법, stdin 모드 및 TTY 지원
title: Exec 도구
x-i18n:
    generated_at: "2026-07-12T15:48:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

워크스페이스에서 셸 명령을 실행합니다. `exec`는 변경 가능한 셸 인터페이스입니다. 선택한 호스트 또는 샌드박스 파일 시스템이 허용하는 모든 위치에서 명령으로 파일을 생성, 편집 또는 삭제할 수 있습니다. `write`, `edit`, `apply_patch` 같은 OpenClaw 파일 시스템 도구를 비활성화해도 `exec`가 읽기 전용이 되지는 않습니다.

`process`를 통한 포그라운드 및 백그라운드 실행을 지원합니다. `process`가 허용되지 않으면 `exec`는 동기적으로 실행되며 `yieldMs`/`background`를 무시합니다. 백그라운드 세션의 범위는 에이전트별로 한정되며, `process`에서는 동일한 에이전트의 세션만 볼 수 있습니다.

## 매개변수

<ParamField path="command" type="string" required>
실행할 셸 명령입니다.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
명령의 작업 디렉터리입니다.
</ParamField>

<ParamField path="env" type="object">
상속된 환경에 병합할 키/값 환경 재정의입니다.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
이 지연 시간(ms)이 지나면 명령을 자동으로 백그라운드로 전환합니다.
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs`를 기다리지 않고 명령을 즉시 백그라운드로 전환합니다.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
이 호출에 구성된 exec 시간 제한을 초 단위로 재정의합니다. 포그라운드, 백그라운드, `yieldMs`, gateway, 샌드박스 및 node `system.run` 실행에 적용됩니다. `timeout: 0`은 해당 호출의 exec 프로세스 시간 제한을 비활성화합니다.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
사용 가능한 경우 의사 터미널에서 실행합니다. TTY 전용 CLI, 코딩 에이전트 및 터미널 UI에 사용하십시오.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
실행할 위치입니다. 샌드박스 런타임이 활성 상태이면 `auto`는 `sandbox`로, 그렇지 않으면 `gateway`로 해석됩니다.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
일반 도구 호출에서는 무시됩니다. `gateway`/`node` 보안은 `tools.exec.security` 및 호스트 승인 파일로 제어되며, 운영자가 명시적으로 권한 상승 액세스를 허용한 경우에만 권한 상승 모드에서 `security=full`을 강제할 수 있습니다.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
기본 확인 모드는 `tools.exec.ask` 및 호스트 승인에서 가져옵니다. 채널에서 시작된 모델 호출의 경우, 유효 호스트 확인 설정이 `off`이면 호출별 `ask`가 무시되며, 그렇지 않은 경우 더 엄격한 모드로만 강화할 수 있습니다. 명시적인 `ask` 값으로 exec 도구를 구성하는 신뢰할 수 있는 내부/API 호출자는 변경되지 않습니다.
</ParamField>

<ParamField path="node" type="string">
`host=node`일 때의 Node ID/이름입니다.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
권한 상승 모드를 요청합니다. 샌드박스를 벗어나 구성된 호스트 경로로 이동합니다. 권한 상승이 `full`로 해석될 때만 `security=full`이 강제됩니다.
</ParamField>

참고:

- `host`에는 `auto`, `sandbox`, `gateway`, `node`만 사용할 수 있습니다. 호스트 이름 선택기가 아니며, 호스트 이름처럼 보이는 값은 명령 실행 전에 거부됩니다.
- 호출별 `host=node`는 `auto`에서 허용됩니다. 호출별 `host=gateway`는 활성 상태인 샌드박스 런타임이 없을 때만 허용됩니다.
- 추가 구성이 없어도 `host=auto`는 계속 "그대로 작동합니다". 샌드박스가 없으면 `gateway`로 해석되고, 활성 샌드박스가 있으면 샌드박스 내에 유지됩니다.
- `elevated`는 샌드박스를 벗어나 구성된 호스트 경로로 이동합니다. 기본값은 `gateway`이며, `tools.exec.host=node`인 경우(또는 세션 기본값이 `host=node`인 경우)에는 `node`입니다. 현재 세션/제공자에 권한 상승 액세스가 활성화된 경우에만 사용할 수 있습니다.
- `gateway`/`node` 승인은 호스트 승인 파일로 제어됩니다.
- `node`에는 페어링된 Node(컴패니언 앱 또는 헤드리스 Node 호스트)가 필요합니다. 여러 Node를 사용할 수 있으면 `exec.node` 또는 `tools.exec.node`를 설정하여 하나를 선택하십시오.
- `exec host=node`는 Node에서 셸을 실행하는 유일한 경로입니다. 기존 `nodes.run` 래퍼는 제거되었습니다.
- Windows가 아닌 호스트에서 exec는 `SHELL`이 설정되어 있으면 이를 사용합니다. `SHELL`이 `fish`이면 fish와 호환되지 않는 bash 구문을 피하기 위해 `PATH`의 `bash`(또는 `sh`)를 우선 사용하고, 둘 다 없으면 `SHELL`로 대체합니다.
- Windows 호스트에서 exec는 PowerShell 7(`pwsh`) 검색(Program Files, ProgramW6432, 그다음 PATH)을 우선 사용하고, 찾지 못하면 Windows PowerShell 5.1로 대체합니다.
- Windows가 아닌 gateway 호스트에서 bash 및 zsh exec 명령은 시작 스냅샷을 사용합니다. OpenClaw는 셸 시작 파일에서 소싱 가능한 별칭/함수와 소규모의 안전한 환경 집합을 `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`에 캡처한 다음, 각 exec 명령 전에 해당 스냅샷을 소싱합니다. 비밀로 보이는 변수는 제외되며, 샌드박스 및 node exec는 이 스냅샷을 사용하지 않습니다. 이 스냅샷 경로를 비활성화하려면 Gateway 프로세스 환경에서 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`을 설정하십시오.
- 호스트 실행(`gateway`/`node`)은 바이너리 하이재킹이나 코드 삽입을 방지하기 위해 `env.PATH` 및 로더 재정의(`LD_*`/`DYLD_*`)를 거부합니다.
- OpenClaw는 셸/프로필 규칙에서 exec 도구 컨텍스트를 감지할 수 있도록 생성된 명령 환경(PTY 및 샌드박스 실행 포함)에 `OPENCLAW_SHELL=exec`를 설정합니다.
- 채널에서 시작된 실행의 경우, 채널에서 해당 ID를 제공하면 OpenClaw는 `OPENCLAW_CHANNEL_CONTEXT`에 제한된 발신자/채팅 ID JSON 페이로드도 노출합니다.
- `exec`에서는 `openclaw channels login` 또는 `/approve` 셸 명령을 실행할 수 없습니다. `openclaw channels login`은 대화형 채널 인증 흐름이며, `/approve`는 셸이 아니라 승인 명령 처리기를 거쳐야 합니다. Gateway 호스트의 터미널에서 채널 로그인을 실행하거나, 채널별 로그인 에이전트 도구가 있으면 이를 사용하십시오(예: `whatsapp_login`).
- 중요: 샌드박싱은 기본적으로 **꺼져 있습니다**. 샌드박싱이 꺼져 있으면 암시적인 `host=auto`가 `gateway`로 해석됩니다. 명시적인 `host=sandbox`는 Gateway 호스트에서 조용히 실행되는 대신 계속 안전하게 실패합니다. 샌드박싱을 활성화하거나 승인과 함께 `host=gateway`를 사용하십시오.
- 스크립트 사전 점검(일반적인 Python/Node 셸 구문 오류 대상)은 유효한 `workdir` 경계 내부의 파일만 검사합니다. 스크립트 경로가 `workdir` 외부로 해석되면 해당 파일의 사전 점검을 건너뜁니다. 또한 `host=gateway`이고 유효 정책이 `security=full` 및 `ask=off`이면 사전 점검을 완전히 건너뜁니다.
- 지금 시작하는 장기 실행 작업은 한 번만 시작하고, 자동 완료 깨우기가 활성화되어 있으며 명령이 출력을 생성하거나 실패할 때 이를 활용하십시오. 로그, 상태, 입력 또는 개입에는 `process`를 사용하십시오. 절전 루프, 시간 제한 루프 또는 반복 폴링으로 예약을 흉내 내지 마십시오.
- 나중에 또는 일정에 따라 실행해야 하는 작업에는 `exec` 절전/지연 패턴 대신 cron을 사용하십시오.

## 구성

| 키                                   | 기본값                                                 | 참고                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tools.exec.timeoutSec`              | `1800`                                                 | 명령별 기본 exec 시간 제한(초)입니다. 호출별 `timeout`이 이를 재정의하며, 호출별 `timeout: 0`은 exec 프로세스 시간 제한을 비활성화합니다.                    |
| `tools.exec.host`                    | `auto`                                                 | 샌드박스 런타임이 활성 상태이면 `sandbox`로, 그렇지 않으면 `gateway`로 해석됩니다.                                                                           |
| `tools.exec.security`                | `deny` for sandbox, `full` for gateway/node when unset |                                                                                                                                                              |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                              |
| `tools.exec.mode`                    | 설정되지 않음                                          | 정규화된 정책 옵션입니다. 아래의 [모드](#modes)를 참조하십시오. `tools.exec.security`/`tools.exec.ask`와 함께 사용할 수 없습니다.                            |
| `tools.exec.reviewer.model`          | 구성된 에이전트 기본 모델                              | `mode=auto` 검토를 위한 선택적 제공자/모델 재정의입니다.                                                                                                     |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | 사람 검토로 대체하기 전에 검토자 모델 준비 및 완료에 적용되는 단계별 시간 제한입니다.                                                                        |
| `tools.exec.node`                    | 설정되지 않음                                          |                                                                                                                                                              |
| `tools.exec.notifyOnExit`            | `true`                                                 | true이면 백그라운드로 전환된 exec 세션이 종료될 때 시스템 이벤트를 대기열에 추가하고 Heartbeat를 요청합니다.                                                 |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | 승인 대기 exec가 이 시간보다 오래 실행되면 "실행 중" 알림을 한 번 표시합니다(`0`이면 비활성화).                                                              |
| `tools.exec.strictInlineEval`        | `false`                                                | [인라인 평가](#inline-eval-strictinlineeval)를 참조하십시오.                                                                                                 |
| `tools.exec.commandHighlighting`     | `false`                                                | true이면 승인 프롬프트에서 파서가 도출한 명령 범위를 명령 텍스트에 강조 표시할 수 있습니다. 전역 또는 에이전트별로 설정하며, 승인 정책은 변경하지 않습니다. |
| `tools.exec.pathPrepend`             | 설정되지 않음                                          | exec 실행 시 `PATH` 앞에 추가할 디렉터리 목록입니다(gateway + 샌드박스만 해당).                                                                              |
| `tools.exec.safeBins`                | 설정되지 않음                                          | 명시적인 허용 목록 항목 없이 실행할 수 있는 표준 입력 전용 안전 바이너리입니다. [안전 바이너리](/ko/tools/exec-approvals-advanced#safe-bins-stdin-only)를 참조하십시오. |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | `safeBins` 경로 검사에서 신뢰하는 추가 명시적 디렉터리입니다. `PATH` 항목은 자동으로 신뢰되지 않습니다.                                                      |
| `tools.exec.safeBinProfiles`         | 설정되지 않음                                          | 안전 바이너리별 선택적 사용자 지정 argv 정책입니다(`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                    |

승인 없는 호스트 exec가 gateway 및 node의 기본값(`security=full`, `ask=off`)입니다. 이는 `host=auto`가 아니라 호스트 정책 기본값에서 비롯됩니다. 승인/허용 목록 동작을 원하면 `tools.exec.*`와 호스트 승인 파일을 모두 더 엄격하게 설정하십시오. [Exec 승인](/ko/tools/exec-approvals#yolo-mode-no-approval)을 참조하십시오. 샌드박스 상태와 관계없이 gateway 또는 node 라우팅을 강제하려면 `tools.exec.host`를 설정하거나 `/exec host=...`를 사용하십시오.

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

### 모드

`tools.exec.mode`는 정규화된 정책 옵션입니다. 이를 설정하면 `security`/`ask`가 파생되며 명시적인 `tools.exec.security`/`tools.exec.ask`와 함께 사용할 수 없습니다.

| 모드        | 보안        | 요청      | 동작                                                                                                                           |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Exec이 거부됩니다.                                                                                                             |
| `allowlist` | `allowlist` | `off`     | 허용 목록 또는 안전 바이너리에 포함된 명령만 실행되며, 그 외에는 아무것도 묻지 않습니다.                                      |
| `ask`       | `allowlist` | `on-miss` | 허용 목록과 일치하면 바로 실행하고, 그 외에는 모두 사람에게 묻습니다.                                                          |
| `auto`      | `allowlist` | `on-miss` | 허용 목록 또는 안전 바이너리와 일치하면 바로 실행하고, 그 외에는 사람에게 묻기 전에 OpenClaw의 네이티브 자동 검토자를 거칩니다. |
| `full`      | `full`      | `off`     | 승인 게이트가 없습니다.                                                                                                       |

`ask`/`ask=always`는 모드와 관계없이 매번 사람에게 묻습니다.

자동 검토 승인은 일회용입니다. Gateway에서 OpenClaw는 확인된 실행 파일 경로를 검토자에게 제공하고, 실행이 동일한 경로를 사용하도록 고정합니다. heredoc, 셸 확장 또는 지원되지 않는 래퍼 따옴표 처리처럼 강제 가능한 하나의 실행 계획으로 축약할 수 없는 명령은 모델이 허용했을 경우에도 사람의 승인으로 대체됩니다.

명시적인 런타임 또는 네이티브 정책으로 이미 결정되지 않은 Codex 앱 서버 명령 승인은 사람의 승인 경로를 사용합니다. Codex가 검토 결정을 Codex에서 실행하는 명령에 결부할 수 있는 강제 가능한 확인된 실행 파일을 노출하지 않으므로, OpenClaw는 이러한 요청에 구성된 Exec 검토자를 실행하지 않습니다.

### 인라인 평가(`strictInlineEval`)

`tools.exec.strictInlineEval`이 `true`이면 인라인 인터프리터 평가 형식에 검토자 또는 명시적인 승인이 필요합니다. 여기에는 `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e`와 기타 지원되는 인터프리터 및 명령 전달자(`awk`, `find -exec`, `make`, `sed`, `xargs` 등)의 유사한 형식이 포함됩니다. `mode=auto`에서는 일반 Exec 승인 경로를 통해 네이티브 자동 검토자가 위험이 명백히 낮은 일회성 명령을 허용할 수 있습니다. 명령을 사람의 승인 경로로 전달할 수 없는 직접적인 Node 호스트 `system.run` 호출에는 여전히 명시적인 승인이 필요합니다. 검토자가 요청하면 요청이 사람에게 전달됩니다. `allow-always`로 문제가 없는 인터프리터/스크립트 호출을 계속 저장할 수 있지만, 인라인 평가 형식은 영구적인 허용 규칙이 되지 않습니다.

### PATH 처리

- `host=gateway`: 로그인 셸의 `PATH`를 Exec 환경에 병합합니다. 호스트 실행에서는 `env.PATH` 재정의가 거부됩니다. 데몬 자체는 계속해서 최소한의 `PATH`로 실행됩니다.
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - 시작 중에 사용자 셸 구성(`~/.zshenv` 또는 `/etc/zshenv` 등)이 우선순위 경로를 재정의하지 못하도록, 실행 직전에 셸 명령 내부의 최종 `PATH` 앞에 `tools.exec.pathPrepend` 항목을 안전하게 추가합니다.
- `host=sandbox`: 컨테이너 내부에서 `sh -lc`(로그인 셸)를 실행하므로 `/etc/profile`이 `PATH`를 재설정할 수 있습니다. OpenClaw는 프로필을 불러온 후 내부 환경 변수를 통해 `env.PATH`를 앞에 추가하며 셸 보간은 사용하지 않습니다. 여기에도 `tools.exec.pathPrepend`가 적용됩니다.
- `host=node`: 전달한 환경 재정의 중 차단되지 않은 항목만 Node로 전송됩니다. 호스트 실행에서는 `env.PATH` 재정의가 거부되며 Node 호스트에서는 무시됩니다. Node에서 추가 PATH 항목이 필요한 경우 Node 호스트 서비스 환경(systemd/launchd)을 구성하거나 도구를 표준 위치에 설치하십시오.

에이전트별 Node 바인딩(구성에서 에이전트 목록 인덱스 사용):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: **장치** 페이지에는 동일한 설정을 위한 작은 "Exec Node 바인딩" 패널이 있습니다.

## 세션 재정의(`/exec`)

`/exec`를 사용하여 `host`, `security`, `ask`, `node`의 **세션별** 기본값을 설정하십시오. 현재 값을 표시하려면 인수 없이 `/exec`를 전송하십시오.

예:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec`는 **승인된 발신자**에게만 적용됩니다(채널 허용 목록/페어링 및 `commands.useAccessGroups`). 이 명령은 **세션 상태만** 업데이트하며 구성을 기록하지 않습니다. 승인된 외부 채널 발신자는 이러한 세션 기본값을 설정할 수 있습니다. 내부 Gateway/WebChat 클라이언트가 이를 유지하려면 `operator.admin`이 필요합니다.

Exec을 완전히 비활성화하려면 도구 정책을 통해 거부하십시오(`tools.deny: ["exec"]` 또는 에이전트별 설정). `security=full` 및 `ask=off`를 명시적으로 설정하지 않는 한 호스트 승인도 계속 적용됩니다.

## Exec 승인(컴패니언 앱/Node 호스트)

샌드박스 에이전트는 Gateway 또는 Node 호스트에서 `exec`을 실행하기 전에 요청별 승인을 요구할 수 있습니다. 정책, 허용 목록, UI 흐름은 [Exec 승인](/ko/tools/exec-approvals)을 참조하십시오.

사람의 승인이 필요한 경우 Node 호스트 및 비네이티브 Gateway 흐름은 `status: "approval-pending"` 및 승인 ID를 즉시 반환합니다. 대신 네이티브 채팅 및 Web UI Gateway 흐름은 인라인으로 기다린 후 승인된 명령의 최종 결과를 반환할 수 있습니다. `approval-pending` 결과는 명령이 시작되지 않았음을 의미하므로, 포그라운드 대체 경고는 승인된 명령이 실제로 인라인으로 실행되는 경우에만 표시됩니다. 승인된 비동기 실행은 명령 진행 및 완료 시스템 이벤트(`Exec running` / `Exec finished`)를 내보냅니다. 거부되거나 시간 초과된 승인은 최종 상태이며, 거부 시스템 이벤트로 에이전트 세션을 깨우지 않습니다.

네이티브 승인 카드/버튼이 있는 채널에서는 에이전트가 먼저 해당 네이티브 UI를 사용해야 하며, 도구 결과에서 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 명시하는 경우에만 수동 `/approve` 명령을 포함해야 합니다.

## 허용 목록 + 안전 바이너리

수동 허용 목록 적용은 확인된 바이너리 경로 glob 및 단순 명령 이름 glob과 일치하는지 확인합니다. 단순 이름은 PATH를 통해 호출된 명령에만 일치하므로 명령이 `rg`이면 `rg`가 `/opt/homebrew/bin/rg`와 일치할 수 있지만, `./rg` 또는 `/tmp/rg`와는 일치하지 않습니다.

`security=allowlist`일 때는 모든 파이프라인 세그먼트가 허용 목록 또는 안전 바이너리에 포함된 경우에만 셸 명령이 자동으로 허용됩니다. 연결(`;`, `&&`, `||`) 및 리디렉션은 모든 최상위 세그먼트가 허용 목록을 충족하지 않는 한 허용 목록 모드에서 거부됩니다(안전 바이너리 포함). 리디렉션은 계속 지원되지 않습니다. 영구적인 `allow-always` 신뢰도 이 규칙을 우회하지 않습니다. 연결된 명령에서는 여전히 모든 최상위 세그먼트가 일치해야 합니다.

`autoAllowSkills`는 Exec 승인의 별도 편의 경로이며, 수동 경로 허용 목록 항목과 동일하지 않습니다. 엄격하고 명시적인 신뢰를 적용하려면 `autoAllowSkills`를 비활성화한 상태로 유지하십시오.

두 제어 기능을 서로 다른 용도로 사용하십시오.

- `tools.exec.safeBins`: stdin만 사용하는 소규모 스트림 필터입니다.
- `tools.exec.safeBinTrustedDirs`: 안전 바이너리 실행 파일 경로를 위한 명시적인 추가 신뢰 디렉터리입니다.
- `tools.exec.safeBinProfiles`: 사용자 지정 안전 바이너리를 위한 명시적인 argv 정책입니다.
- 허용 목록: 실행 파일 경로에 대한 명시적인 신뢰입니다.

`safeBins`를 일반적인 허용 목록처럼 취급하지 말고, 인터프리터/런타임 바이너리(예: `python3`, `node`, `ruby`, `bash`)를 추가하지 마십시오. 이러한 바이너리가 필요하면 명시적인 허용 목록 항목을 사용하고 승인 프롬프트를 활성화한 상태로 유지하십시오.

인터프리터/런타임 `safeBins` 항목에 명시적인 프로필이 없으면 `openclaw security audit`에서 경고하며, `openclaw doctor --fix`로 누락된 사용자 지정 `safeBinProfiles` 항목을 구성할 수 있습니다. 또한 `jq`처럼 광범위하게 동작하는 바이너리를 `safeBins`에 명시적으로 다시 추가하면 `openclaw security audit` 및 `openclaw doctor`에서 경고합니다(`jq`는 환경 데이터를 읽고 모듈 또는 시작 파일에서 jq 코드를 불러올 수 있으므로, 대신 명시적인 허용 목록 항목이나 승인 게이트가 적용된 실행을 사용하는 것이 좋습니다). `jq`는 명시적으로 나열되어 있어도 안전 바이너리로는 거부됩니다. 인터프리터를 명시적으로 허용 목록에 추가한다면 인라인 코드 평가 형식에도 검토자 또는 명시적인 승인이 계속 필요하도록 `tools.exec.strictInlineEval`을 활성화하십시오.

전체 정책 세부 정보와 예는 [Exec 승인](/ko/tools/exec-approvals-advanced#safe-bins-stdin-only) 및 [안전 바이너리와 허용 목록 비교](/ko/tools/exec-approvals-advanced#safe-bins-versus-allowlist)를 참조하십시오.

## 예

포그라운드:

```json
{ "tool": "exec", "command": "ls -la" }
```

백그라운드 + 폴링:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

폴링은 대기 루프가 아니라 필요할 때 상태를 확인하기 위한 용도입니다. 자동 완료 깨우기가 활성화되어 있으면 명령이 출력을 내보내거나 실패할 때 세션을 깨울 수 있습니다.

키 전송(tmux 방식):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

제출(CR만 전송):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

붙여넣기(기본적으로 브래킷 모드):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`는 구조화된 다중 파일 편집을 위한 `exec`의 하위 도구입니다. 기본적으로 활성화되어 있으며 모든 모델 제공자에서 사용할 수 있습니다. `allowModels`를 사용하여 제한할 수 있습니다. 비활성화하거나 특정 모델로 제한하려는 경우에만 구성을 사용하십시오.

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

참고:

- 도구 정책은 계속 적용됩니다. `allow: ["write"]`는 `apply_patch`를 암시적으로 허용합니다.
- `deny: ["write"]`는 `apply_patch`를 거부하지 않습니다. 패치 쓰기도 차단하려면 `apply_patch`를 명시적으로 거부하거나 `deny: ["group:fs"]`를 사용하십시오.
- 구성은 `tools.exec.applyPatch` 아래에 있습니다.
- `tools.exec.applyPatch.enabled`의 기본값은 `true`입니다. 도구를 비활성화하려면 `false`로 설정하십시오.
- `tools.exec.applyPatch.workspaceOnly`의 기본값은 `true`입니다(작업 공간 내부로 제한). `apply_patch`가 작업 공간 디렉터리 외부에 쓰거나 삭제하도록 의도한 경우에만 `false`로 설정하십시오.
- `tools.exec.applyPatch.allowModels`는 선택적인 모델 ID 허용 목록입니다(예: 원시 ID `gpt-5.4` 또는 전체 ID `openai/gpt-5.4`). 설정하면 일치하는 모델만 도구를 사용할 수 있으며, 설정하지 않으면 모든 모델이 사용할 수 있습니다.

## 관련 문서

- [Exec 승인](/ko/tools/exec-approvals) — 셸 명령의 승인 게이트
- [샌드박스](/ko/gateway/sandboxing) — 샌드박스 환경에서 명령 실행
- [백그라운드 프로세스](/ko/gateway/background-process) — 장기 실행 Exec 및 프로세스 도구
- [보안](/ko/gateway/security) — 도구 정책 및 상승된 액세스
