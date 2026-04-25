---
read_when:
    - 안전한 bin 또는 커스텀 safe-bin 프로필 구성하기
    - 승인을 Slack/Discord/Telegram 또는 기타 채팅 채널로 전달하기
    - 채널용 네이티브 승인 클라이언트 구현하기
summary: '고급 exec 승인: 안전한 bin, 인터프리터 바인딩, 승인 전달, 네이티브 전달'
title: Exec 승인 — 고급
x-i18n:
    generated_at: "2026-04-25T06:11:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

고급 exec 승인 주제: `safeBins` fast-path, 인터프리터/런타임
바인딩, 채팅 채널로의 승인 전달(네이티브 전달 포함). 핵심 정책과 승인 흐름은 [Exec approvals](/ko/tools/exec-approvals)를 참조하세요.

## 안전한 bin(stdin 전용)

`tools.exec.safeBins`는 allowlist 모드에서 **명시적 allowlist 항목 없이도**
실행할 수 있는 작은 **stdin 전용** 바이너리 목록을 정의합니다(예: `cut`).
안전한 bin은 위치 기반 파일 인수와 경로처럼 보이는 토큰을 거부하므로
들어오는 스트림에 대해서만 동작할 수 있습니다. 이를 일반적인 신뢰 목록이 아니라
스트림 필터를 위한 좁은 fast-path로 취급하세요.

<Warning>
인터프리터나 런타임 바이너리(예: `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`)를 `safeBins`에 추가하지 **마세요**. 명령이
코드를 평가하거나, 하위 명령을 실행하거나, 설계상 파일을 읽을 수 있다면
명시적인 allowlist 항목을 우선 사용하고 승인 프롬프트를 활성 상태로 유지하세요.
커스텀 safe bin은 `tools.exec.safeBinProfiles.<bin>`에 명시적 프로필을 정의해야 합니다.
</Warning>

기본 안전한 bin:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep`과 `sort`는 기본 목록에 없습니다. 선택적으로 활성화하는 경우,
stdin이 아닌 워크플로에는 명시적인 allowlist 항목을 유지하세요. `grep`을 safe-bin 모드에서 사용할 때는
패턴을 `-e`/`--regexp`로 제공하세요. 위치 기반 패턴 형식은 거부되므로 파일 피연산자를 애매한 위치 인수로 몰래 전달할 수 없습니다.

### Argv 검증 및 거부된 플래그

검증은 argv 형태만으로 결정적으로 이루어지며(호스트 파일 시스템 존재 여부
검사 없음), 이는 allow/deny 차이에서 파일 존재 여부 오라클 동작이 생기는 것을 막습니다.
기본 safe bin에서는 파일 지향 옵션이 거부됩니다. 긴 옵션은 fail-closed 방식으로 검증되며(알 수 없는 플래그와 모호한 축약형은 거부됨).

safe-bin 프로필별 거부 플래그:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

안전한 bin은 또한 실행 시 argv 토큰을 **리터럴 텍스트**로 강제 처리합니다(stdin 전용 세그먼트에서는 globbing과 `$VARS` 확장 없음). 따라서 `*`나 `$HOME/...` 같은 패턴을 사용해 파일 읽기를 몰래 수행할 수 없습니다.

### 신뢰된 바이너리 디렉터리

안전한 bin은 신뢰된 바이너리 디렉터리(시스템 기본값 + 선택적 `tools.exec.safeBinTrustedDirs`)에서 해석되어야 합니다. `PATH` 항목은 자동으로 신뢰되지 않습니다.
기본 신뢰 디렉터리는 의도적으로 최소화되어 있습니다: `/bin`, `/usr/bin`. safe-bin 실행 파일이 패키지 관리자/사용자 경로(예:
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`)에 있다면, 이를 `tools.exec.safeBinTrustedDirs`에 명시적으로 추가하세요.

### 셸 체이닝, 래퍼, 멀티플렉서

셸 체이닝(`&&`, `||`, `;`)은 모든 최상위 세그먼트가
allowlist를 만족할 때 허용됩니다(safe bin 또는 Skill auto-allow 포함). 리디렉션은
allowlist 모드에서 계속 지원되지 않습니다. 명령 치환(`$()` / 백틱)은
이중 따옴표 안을 포함해 allowlist 파싱 중 거부됩니다. 리터럴 `$()` 텍스트가 필요하면
단일 따옴표를 사용하세요.

macOS companion-app 승인에서는 셸 제어 또는 확장 구문(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)이 포함된 raw 셸 텍스트는
셸 바이너리 자체가 allowlist에 있지 않은 한 allowlist miss로 처리됩니다.

셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우, 요청 범위 env 재정의는
작고 명시적인 allowlist(`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`)로 축소됩니다.

allowlist 모드에서 `allow-always` 결정의 경우, 알려진 dispatch 래퍼(`env`,
`nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로 대신 내부 실행 파일 경로를 유지합니다.
셸 멀티플렉서(`busybox`, `toybox`)는 셸 applet(`sh`, `ash` 등)에 대해서도 같은 방식으로 해제됩니다. 래퍼나 멀티플렉서를 안전하게 해제할 수 없으면 allowlist 항목은 자동으로 유지되지 않습니다.

`python3`나 `node` 같은 인터프리터를 allowlist에 추가할 경우,
inline eval에도 명시적 승인이 필요하도록 `tools.exec.strictInlineEval=true`를 사용하는 것이 좋습니다. strict 모드에서는 `allow-always`가 여전히 무해한
인터프리터/스크립트 호출을 유지할 수 있지만, inline-eval carrier는
자동으로 유지되지 않습니다.

### 안전한 bin과 allowlist의 차이

| 주제             | `tools.exec.safeBins`                               | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 목표             | 좁은 stdin 필터 자동 허용                           | 특정 실행 파일을 명시적으로 신뢰                                                    |
| 매치 유형        | 실행 파일 이름 + safe-bin argv 정책                 | 해석된 실행 파일 경로 glob 또는 PATH 호출 명령의 bare command-name glob            |
| 인수 범위        | safe-bin 프로필과 리터럴 토큰 규칙으로 제한         | 경로 일치만 검사; 그 외 인수는 사용자의 책임                                        |
| 일반적인 예시    | `head`, `tail`, `tr`, `wc`                          | `jq`, `python3`, `node`, `ffmpeg`, 커스텀 CLI                                      |
| 최적 사용 사례   | 파이프라인의 저위험 텍스트 변환                     | 더 넓은 동작이나 부작용이 있는 모든 도구                                           |

구성 위치:

- `safeBins`는 config에서 가져옵니다(`tools.exec.safeBins` 또는 에이전트별 `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`는 config에서 가져옵니다(`tools.exec.safeBinTrustedDirs` 또는 에이전트별 `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`는 config에서 가져옵니다(`tools.exec.safeBinProfiles` 또는 에이전트별 `agents.list[].tools.exec.safeBinProfiles`). 에이전트별 프로필 키가 전역 키를 재정의합니다.
- allowlist 항목은 호스트 로컬 `~/.openclaw/exec-approvals.json`의 `agents.<id>.allowlist` 아래에 있습니다(또는 Control UI / `openclaw approvals allowlist ...` 사용).
- `openclaw security audit`는 인터프리터/런타임 bin이 명시적 프로필 없이 `safeBins`에 포함되면 `tools.exec.safe_bins_interpreter_unprofiled`로 경고합니다.
- `openclaw doctor --fix`는 누락된 커스텀 `safeBinProfiles.<bin>` 항목을 `{}`로 스캐폴드할 수 있습니다(이후 검토 및 강화 필요). 인터프리터/런타임 bin은 자동 스캐폴드되지 않습니다.

커스텀 프로필 예시:
__OC_I18N_900000__
`jq`를 `safeBins`에 명시적으로 선택한 경우에도, OpenClaw는 safe-bin
모드에서 `env` 내장값을 계속 거부하므로 `jq -n env`가 명시적인 allowlist 경로
또는 승인 프롬프트 없이 호스트 프로세스 환경을 덤프할 수 없습니다.

## 인터프리터/런타임 명령

승인 기반 인터프리터/런타임 실행은 의도적으로 보수적으로 처리됩니다:

- 정확한 argv/cwd/env 컨텍스트가 항상 바인딩됩니다.
- 직접 셸 스크립트 및 직접 런타임 파일 형식은 가능한 한 하나의 구체적인 로컬
  파일 스냅샷에 바인딩됩니다.
- 여전히 하나의 직접 로컬 파일로 해석되는 일반적인 패키지 관리자 래퍼 형식(예:
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`)은 바인딩 전에 해제됩니다.
- OpenClaw가 인터프리터/런타임 명령에 대해 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면
  (예: 패키지 스크립트, eval 형식, 런타임별 loader 체인, 또는 모호한 다중 파일 형식),
  존재하지 않는 의미적 범위를 주장하는 대신 승인 기반 실행이 거부됩니다.
- 이러한 워크플로에는 sandboxing, 별도 호스트 경계, 또는
  운영자가 더 넓은 런타임 의미를 수락하는 명시적 trusted
  allowlist/full 워크플로를 사용하는 것이 좋습니다.

승인이 필요할 때 exec 도구는 승인 ID와 함께 즉시 반환됩니다. 나중의 시스템 이벤트(`Exec finished` / `Exec denied`)와 상관관계를 맞출 때 이 ID를 사용하세요. timeout 전에 결정이 도착하지 않으면 요청은 승인 timeout으로 처리되고 거부 사유로 표시됩니다.

### 후속 전달 동작

승인된 비동기 exec가 끝난 후 OpenClaw는 같은 세션으로 후속 `agent` 턴을 보냅니다.

- 유효한 외부 전달 대상이 존재하면(전달 가능한 채널 + 대상 `to`), 후속 전달은 해당 채널을 사용합니다.
- 외부 대상이 없는 webchat 전용 또는 내부 세션 흐름에서는 후속 전달이 세션 전용(`deliver: false`)으로 유지됩니다.
- 호출자가 해석 가능한 외부 채널이 없는 상태에서 명시적으로 엄격한 외부 전달을 요청하면 요청은 `INVALID_REQUEST`로 실패합니다.
- `bestEffortDeliver`가 활성화되어 있고 외부 채널을 해석할 수 없으면, 전달은 실패 대신 세션 전용으로 다운그레이드됩니다.

## 채팅 채널로 승인 전달

exec 승인 프롬프트를 모든 채팅 채널(Plugin 채널 포함)로 전달하고
`/approve`로 승인할 수 있습니다. 이는 일반 아웃바운드 전달 파이프라인을 사용합니다.

Config:
__OC_I18N_900001__
채팅에서 다음과 같이 응답:
__OC_I18N_900002__
`/approve` 명령은 exec 승인과 Plugin 승인을 모두 처리합니다. ID가 대기 중인 exec 승인과 일치하지 않으면 자동으로 Plugin 승인을 확인합니다.

### Plugin 승인 전달

Plugin 승인 전달은 exec 승인과 같은 전달 파이프라인을 사용하지만,
`approvals.plugin` 아래의 독립적인 config를 가집니다. 하나를 활성화하거나 비활성화해도 다른 하나에는 영향을 주지 않습니다.
__OC_I18N_900003__
config 형태는 `approvals.exec`와 동일합니다: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets`가 같은 방식으로 동작합니다.

공용 인터랙티브 응답을 지원하는 채널은 exec 및
Plugin 승인 모두에 동일한 승인 버튼을 렌더링합니다. 공용 인터랙티브 UI가 없는 채널은
`/approve` 지침이 포함된 일반 텍스트로 fallback합니다.

### 모든 채널에서 같은 채팅으로 승인

exec 또는 Plugin 승인 요청이 전달 가능한 채팅 인터페이스에서 시작되면, 이제 같은 채팅에서 기본적으로 `/approve`로 이를 승인할 수 있습니다. 이는 기존 Web UI 및 terminal UI 흐름에 더해 Slack, Matrix,
Microsoft Teams 같은 채널에도 적용됩니다.

이 공용 텍스트 명령 경로는 해당 대화의 일반 채널 auth 모델을 사용합니다. 원래 채팅이 이미 명령을 보내고 응답을 받을 수 있다면,
승인 요청을 대기 상태로 유지하기 위해 더 이상 별도의 네이티브 전달 어댑터가 필요하지 않습니다.

Discord와 Telegram도 같은 채팅 `/approve`를 지원하지만, 네이티브 승인 전달이 비활성화된 경우에도 해당 채널은 여전히
해석된 approver 목록을 인증에 사용합니다.

Telegram 및 기타 네이티브 승인 클라이언트가 Gateway를 직접 호출하는 경우,
이 fallback은 의도적으로 "approval not found" 실패에만 제한됩니다. 실제
exec 승인 거부/오류는 조용히 Plugin 승인으로 재시도되지 않습니다.

### 네이티브 승인 전달

일부 채널은 네이티브 승인 클라이언트로도 동작할 수 있습니다. 네이티브 클라이언트는 공용 같은 채팅 `/approve`
흐름 위에 approver DM, 원본 채팅 fanout, 채널별 인터랙티브 승인 UX를 추가합니다.

네이티브 승인 카드/버튼을 사용할 수 있을 때는, 그 네이티브 UI가 기본
에이전트 대상 경로입니다. 도구 결과에서 채팅 승인을 사용할 수 없다고 하거나
수동 승인이 유일한 남은 경로라고 명시하지 않는 한, 에이전트는 중복된 일반 채팅
`/approve` 명령을 함께 출력해서는 안 됩니다.

일반 모델:

- 호스트 exec 정책은 여전히 exec 승인이 필요한지를 결정합니다
- `approvals.exec`는 다른 채팅 대상으로 승인 프롬프트를 전달하는 방식을 제어합니다
- `channels.<channel>.execApprovals`는 해당 채널이 네이티브 승인 클라이언트로 동작할지를 제어합니다

네이티브 승인 클라이언트는 다음 조건이 모두 참일 때 DM 우선 전달을 자동 활성화합니다:

- 채널이 네이티브 승인 전달을 지원함
- 명시적 `execApprovals.approvers` 또는 해당
  채널의 문서화된 fallback 소스에서 approver를 해석할 수 있음
- `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`임

네이티브 승인 클라이언트를 명시적으로 비활성화하려면 `enabled: false`를 설정하세요. approver를 해석할 수 있을 때 강제로
활성화하려면 `enabled: true`를 설정하세요. 공개 origin-chat 전달은 여전히
`channels.<channel>.execApprovals.target`을 통해 명시적으로 제어됩니다.

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

이 네이티브 승인 클라이언트는 공용 같은 채팅 `/approve` 흐름과 공용 승인 버튼 위에
DM 라우팅과 선택적 채널 fanout을 추가합니다.

공용 동작:

- Slack, Matrix, Microsoft Teams 및 유사한 전달 가능한 채팅은 같은 채팅 `/approve`에 대해 일반 채널 auth 모델을 사용합니다
- 네이티브 승인 클라이언트가 자동 활성화되면 기본 네이티브 전달 대상은 approver DM입니다
- Discord와 Telegram에서는 해석된 approver만 승인 또는 거부할 수 있습니다
- Discord approver는 명시적(`execApprovals.approvers`)일 수도 있고 `commands.ownerAllowFrom`에서 추론될 수도 있습니다
- Telegram approver는 명시적(`execApprovals.approvers`)일 수도 있고 기존 owner config(`allowFrom`, 지원되는 경우 직접 메시지 `defaultTo`)에서 추론될 수도 있습니다
- Slack approver는 명시적(`execApprovals.approvers`)일 수도 있고 `commands.ownerAllowFrom`에서 추론될 수도 있습니다
- Slack 네이티브 버튼은 승인 ID 종류를 보존하므로 `plugin:` ID가
  두 번째 Slack 로컬 fallback 계층 없이도 Plugin 승인을 해석할 수 있습니다
- Matrix 네이티브 DM/채널 라우팅과 반응 단축 경로는 exec 및 Plugin 승인 모두를 처리합니다.
  Plugin 인증은 여전히 `channels.matrix.dm.allowFrom`에서 옵니다
- 요청자가 approver일 필요는 없습니다
- 원래 채팅이 이미 명령과 응답을 지원하는 경우, origin 채팅은 `/approve`로 직접 승인할 수 있습니다
- 네이티브 Discord 승인 버튼은 승인 ID 종류에 따라 라우팅됩니다: `plugin:` ID는
  바로 Plugin 승인으로 가고, 나머지는 모두 exec 승인으로 갑니다
- 네이티브 Telegram 승인 버튼은 `/approve`와 동일한 제한된 exec-to-plugin fallback을 따릅니다
- 네이티브 `target`이 origin-chat 전달을 활성화하면 승인 프롬프트에 명령 텍스트가 포함됩니다
- 대기 중인 exec 승인은 기본적으로 30분 후 만료됩니다
- 운영자 UI나 구성된 승인 클라이언트가 요청을 수락할 수 없으면, 프롬프트는 `askFallback`으로 fallback됩니다

Telegram은 기본적으로 approver DM(`target: "dm"`)을 사용합니다. 승인 프롬프트가 원래 Telegram 채팅/토픽에도 나타나길 원한다면 `channel` 또는 `both`로 전환할 수 있습니다. Telegram 포럼
토픽의 경우, OpenClaw는 승인 프롬프트와 승인 후 후속 메시지 모두에 대해 토픽을 보존합니다.

참조:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 흐름
__OC_I18N_900004__
보안 참고:

- Unix 소켓 모드 `0600`, 토큰은 `exec-approvals.json`에 저장됨
- 동일 UID 피어 검사
- challenge/response(nonce + HMAC token + request hash) + 짧은 TTL

## 관련 항목

- [Exec approvals](/ko/tools/exec-approvals) — 핵심 정책 및 승인 흐름
- [Exec tool](/ko/tools/exec)
- [Elevated mode](/ko/tools/elevated)
- [Skills](/ko/tools/skills) — Skill 기반 auto-allow 동작
