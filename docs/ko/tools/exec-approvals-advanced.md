---
read_when:
    - 안전 bin 또는 사용자 지정 안전 bin 프로필 구성
    - 승인을 Slack/Discord/Telegram 또는 기타 채팅 채널로 전달하기
    - 채널용 네이티브 승인 클라이언트 구현하기
summary: '고급 실행 승인: 안전한 바이너리, 인터프리터 바인딩, 승인 전달, 네이티브 전달'
title: Exec 승인 — 고급
x-i18n:
    generated_at: "2026-05-06T06:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

고급 exec 승인 주제: `safeBins` 빠른 경로, 인터프리터/런타임
바인딩, 그리고 채팅 채널로의 승인 전달(네이티브 전달 포함).
핵심 정책과 승인 흐름은 [Exec 승인](/ko/tools/exec-approvals)을 참고하세요.

## 안전 바이너리(stdin 전용)

`tools.exec.safeBins`는 명시적 허용 목록 항목 **없이도** 허용 목록 모드에서 실행할 수 있는
**stdin 전용** 바이너리(예: `cut`)의 작은 목록을 정의합니다.
안전 바이너리는 위치 기반 파일 인자와 경로처럼 보이는 토큰을 거부하므로
들어오는 스트림에 대해서만 동작할 수 있습니다. 이를 일반적인 신뢰 목록이 아니라
스트림 필터를 위한 좁은 빠른 경로로 취급하세요.

<Warning>
인터프리터나 런타임 바이너리(예: `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`)를 `safeBins`에 추가하지 **마세요**. 명령이 코드를 평가하거나,
하위 명령을 실행하거나, 설계상 파일을 읽을 수 있다면 명시적 허용 목록 항목을 선호하고
승인 프롬프트를 활성화된 상태로 유지하세요. 사용자 지정 안전 바이너리는
`tools.exec.safeBinProfiles.<bin>`에 명시적 프로필을 정의해야 합니다.
</Warning>

기본 안전 바이너리:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep`과 `sort`는 기본 목록에 없습니다. 선택적으로 사용한다면 stdin이 아닌 워크플로에 대해
명시적 허용 목록 항목을 유지하세요. 안전 바이너리 모드의 `grep`에서는
패턴을 `-e`/`--regexp`로 제공하세요. 위치 기반 패턴 형식은 거부되므로
파일 피연산자를 모호한 위치 인자로 몰래 넣을 수 없습니다.

### Argv 검증과 거부되는 플래그

검증은 argv 형태만으로 결정론적으로 수행됩니다(호스트 파일 시스템 존재 여부 확인 없음).
이는 허용/거부 차이로 파일 존재 여부를 알아내는 오라클 동작을 방지합니다.
기본 안전 바이너리에서는 파일 지향 옵션이 거부됩니다. 긴 옵션은 실패 시 닫힘 방식으로
검증됩니다(알 수 없는 플래그와 모호한 축약형은 거부됨).

안전 바이너리 프로필별 거부 플래그:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

안전 바이너리는 stdin 전용 세그먼트에 대해 실행 시 argv 토큰이 **리터럴 텍스트**로
처리되도록 강제합니다(글로빙 없음, `$VARS` 확장 없음). 따라서 `*` 또는
`$HOME/...` 같은 패턴을 사용해 파일 읽기를 몰래 수행할 수 없습니다.

### 신뢰할 수 있는 바이너리 디렉터리

안전 바이너리는 신뢰할 수 있는 바이너리 디렉터리(시스템 기본값 및 선택적
`tools.exec.safeBinTrustedDirs`)에서 해석되어야 합니다. `PATH` 항목은 자동으로 신뢰되지 않습니다.
기본 신뢰 디렉터리는 의도적으로 최소화되어 있습니다: `/bin`, `/usr/bin`. 안전 바이너리 실행 파일이
패키지 관리자/사용자 경로(예:
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`)에 있다면
`tools.exec.safeBinTrustedDirs`에 명시적으로 추가하세요.

### 셸 체이닝, 래퍼, 멀티플렉서

셸 체이닝(`&&`, `||`, `;`)은 모든 최상위 세그먼트가
허용 목록(안전 바이너리 또는 Skills 자동 허용 포함)을 만족할 때 허용됩니다.
리다이렉션은 허용 목록 모드에서 계속 지원되지 않습니다. 명령 치환(`$()` / 백틱)은
큰따옴표 내부를 포함해 허용 목록 파싱 중 거부됩니다. 리터럴 `$()` 텍스트가 필요하면
작은따옴표를 사용하세요.

macOS 동반 앱 승인에서는 셸 제어 또는 확장 문법(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)이
포함된 원시 셸 텍스트가 셸 바이너리 자체가 허용 목록에 있지 않은 한 허용 목록 불일치로
처리됩니다.

셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 env 오버라이드는
작은 명시적 허용 목록(`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`)으로 축소됩니다.

허용 목록 모드의 `allow-always` 결정에서는 알려진 디스패치 래퍼(`env`,
`nice`, `nohup`, `stdbuf`, `timeout`)가 래퍼 경로 대신 내부 실행 파일 경로를
영구 저장합니다. 셸 멀티플렉서(`busybox`, `toybox`)도 셸 애플릿(`sh`, `ash` 등)에 대해
같은 방식으로 언래핑됩니다. 래퍼 또는 멀티플렉서를 안전하게 언래핑할 수 없으면
허용 목록 항목은 자동으로 영구 저장되지 않습니다.

`python3` 또는 `node` 같은 인터프리터를 허용 목록에 추가한다면
인라인 eval에도 명시적 승인이 계속 필요하도록 `tools.exec.strictInlineEval=true`를 선호하세요.
엄격 모드에서는 `allow-always`가 무해한 인터프리터/스크립트 호출을 계속 영구 저장할 수 있지만,
인라인 eval 전달자는 자동으로 영구 저장되지 않습니다.

### 안전 바이너리와 허용 목록 비교

| 주제            | `tools.exec.safeBins`                                  | 허용 목록(`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 목표             | 좁은 stdin 필터 자동 허용                              | 특정 실행 파일을 명시적으로 신뢰                                                   |
| 매칭 유형        | 실행 파일 이름 + 안전 바이너리 argv 정책              | 해석된 실행 파일 경로 glob 또는 PATH로 호출된 명령의 순수 명령 이름 glob          |
| 인자 범위        | 안전 바이너리 프로필과 리터럴 토큰 규칙으로 제한      | 기본적으로 경로 매칭, 선택적 `argPattern`으로 파싱된 argv 제한 가능               |
| 일반적인 예      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 사용자 지정 CLI                                 |
| 최적 사용        | 파이프라인의 저위험 텍스트 변환                       | 더 넓은 동작이나 부작용이 있는 모든 도구                                          |

구성 위치:

- `safeBins`는 config(`tools.exec.safeBins` 또는 에이전트별 `agents.list[].tools.exec.safeBins`)에서 가져옵니다.
- `safeBinTrustedDirs`는 config(`tools.exec.safeBinTrustedDirs` 또는 에이전트별 `agents.list[].tools.exec.safeBinTrustedDirs`)에서 가져옵니다.
- `safeBinProfiles`는 config(`tools.exec.safeBinProfiles` 또는 에이전트별 `agents.list[].tools.exec.safeBinProfiles`)에서 가져옵니다. 에이전트별 프로필 키는 전역 키를 재정의합니다.
- 허용 목록 항목은 호스트 로컬 `~/.openclaw/exec-approvals.json`의 `agents.<id>.allowlist` 아래에 있습니다(Control UI / `openclaw approvals allowlist ...`를 통해서도 가능).
- `openclaw security audit`는 인터프리터/런타임 바이너리가 명시적 프로필 없이 `safeBins`에 나타날 때 `tools.exec.safe_bins_interpreter_unprofiled`로 경고합니다.
- `openclaw doctor --fix`는 누락된 사용자 지정 `safeBinProfiles.<bin>` 항목을 `{}`로 스캐폴드할 수 있습니다(이후 검토하고 강화하세요). 인터프리터/런타임 바이너리는 자동으로 스캐폴드되지 않습니다.

사용자 지정 프로필 예시:
__OC_I18N_900000__
`jq`를 `safeBins`에 명시적으로 선택해 넣더라도 OpenClaw는 안전 바이너리 모드에서 `env` 내장 기능을
계속 거부하므로 `jq -n env`가 명시적 허용 목록 경로나 승인 프롬프트 없이 호스트 프로세스 환경을
덤프할 수 없습니다.

## 인터프리터/런타임 명령

승인 기반 인터프리터/런타임 실행은 의도적으로 보수적입니다.

- 정확한 argv/cwd/env 컨텍스트가 항상 바인딩됩니다.
- 직접 셸 스크립트 및 직접 런타임 파일 형식은 최선의 노력으로 하나의 구체적인 로컬 파일 스냅샷에 바인딩됩니다.
- 여전히 하나의 직접 로컬 파일로 해석되는 일반적인 패키지 관리자 래퍼 형식(예:
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`)은 바인딩 전에 언래핑됩니다.
- OpenClaw가 인터프리터/런타임 명령에 대해 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면
  (예: 패키지 스크립트, eval 형식, 런타임별 로더 체인, 모호한 다중 파일 형식)
  실제로 제공하지 못하는 의미적 적용 범위를 주장하는 대신 승인 기반 실행이 거부됩니다.
- 이러한 워크플로에는 샌드박싱, 별도 호스트 경계, 또는 운영자가 더 넓은 런타임 의미를 수락하는
  명시적으로 신뢰된 허용 목록/전체 워크플로를 선호하세요.

승인이 필요하면 exec 도구는 승인 id와 함께 즉시 반환합니다. 해당 id를 사용해
이후 시스템 이벤트(`Exec finished` / `Exec denied`)를 연결하세요. 제한 시간 전에 결정이 도착하지 않으면
요청은 승인 제한 시간 초과로 처리되고 거부 사유로 표시됩니다.

### 후속 전달 동작

승인된 비동기 exec가 완료되면 OpenClaw는 같은 세션으로 후속 `agent` 턴을 보냅니다.

- 유효한 외부 전달 대상(전달 가능한 채널 및 대상 `to`)이 있으면 후속 전달은 해당 채널을 사용합니다.
- 외부 대상이 없는 웹챗 전용 또는 내부 세션 흐름에서는 후속 전달이 세션 전용(`deliver: false`)으로 유지됩니다.
- 호출자가 해석 가능한 외부 채널 없이 엄격한 외부 전달을 명시적으로 요청하면 요청은 `INVALID_REQUEST`로 실패합니다.
- `bestEffortDeliver`가 활성화되어 있고 외부 채널을 해석할 수 없으면 전달은 실패하는 대신 세션 전용으로 다운그레이드됩니다.

## 채팅 채널로 승인 전달

exec 승인 프롬프트를 모든 채팅 채널(Plugin 채널 포함)로 전달하고
`/approve`로 승인할 수 있습니다. 이는 일반적인 아웃바운드 전달 파이프라인을 사용합니다.

Config:
__OC_I18N_900001__
채팅에서 답장:
__OC_I18N_900002__
`/approve` 명령은 exec 승인과 Plugin 승인을 모두 처리합니다. ID가 대기 중인 exec 승인과 일치하지 않으면 자동으로 Plugin 승인을 대신 확인합니다.

### Plugin 승인 전달

Plugin 승인 전달은 exec 승인과 같은 전달 파이프라인을 사용하지만
`approvals.plugin` 아래에 자체 독립 config가 있습니다. 하나를 활성화하거나 비활성화해도 다른 하나에는 영향을 주지 않습니다.
__OC_I18N_900003__
config 형태는 `approvals.exec`와 동일합니다. `enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets`가 같은 방식으로 동작합니다.

공유 대화형 답장을 지원하는 채널은 exec와 Plugin 승인 모두에 같은 승인 버튼을 렌더링합니다.
공유 대화형 UI가 없는 채널은 `/approve` 지침이 포함된 일반 텍스트로 대체됩니다.

### 모든 채널의 동일 채팅 승인

exec 또는 Plugin 승인 요청이 전달 가능한 채팅 표면에서 시작되면, 이제 같은 채팅에서
기본적으로 `/approve`로 승인할 수 있습니다. 이는 기존 Web UI와 터미널 UI 흐름에 더해
Slack, Matrix, Microsoft Teams 같은 채널에도 적용됩니다.

이 공유 텍스트 명령 경로는 해당 대화의 일반 채널 인증 모델을 사용합니다. 시작한 채팅이
이미 명령을 보내고 답장을 받을 수 있다면, 승인 요청이 대기 상태로 남기 위해
별도의 네이티브 전달 어댑터가 더 이상 필요하지 않습니다.

Discord와 Telegram도 동일 채팅 `/approve`를 지원하지만, 네이티브 승인 전달이 비활성화되어 있어도
이 채널들은 권한 부여에 해석된 승인자 목록을 계속 사용합니다.

Telegram 및 Gateway를 직접 호출하는 다른 네이티브 승인 클라이언트의 경우,
이 대체 경로는 의도적으로 "승인을 찾을 수 없음" 실패로 제한됩니다. 실제
exec 승인 거부/오류는 Plugin 승인으로 조용히 재시도되지 않습니다.

### 네이티브 승인 전달

일부 채널은 네이티브 승인 클라이언트로도 동작할 수 있습니다. 네이티브 클라이언트는 공유 동일 채팅 `/approve`
흐름 위에 승인자 DM, 원본 채팅 팬아웃, 채널별 대화형 승인 UX를 추가합니다.

기본 승인 카드/버튼을 사용할 수 있으면 해당 기본 UI가 주된
에이전트 대상 경로입니다. 도구 결과에서 채팅 승인을 사용할 수 없거나
수동 승인이 유일하게 남은 경로라고 말하지 않는 한, 에이전트는 중복되는 일반 채팅
`/approve` 명령도 다시 표시해서는 안 됩니다.

기본 승인 클라이언트가 구성되어 있지만 원본 채널에 활성 기본 런타임이 없으면,
OpenClaw는 로컬 결정적 `/approve` 프롬프트를 계속 표시합니다. 기본 런타임이 활성 상태이고 전달을 시도했지만
카드를 받는 대상이 없으면, OpenClaw는 요청을 계속 해결할 수 있도록
정확한 `/approve <id> <decision>` 명령이 포함된 동일 채팅 대체 알림을 보냅니다.

일반 모델:

- 호스트 exec 정책은 exec 승인이 필요한지 계속 결정합니다
- `approvals.exec`는 승인 프롬프트를 다른 채팅 대상으로 전달하는 것을 제어합니다
- `channels.<channel>.execApprovals`는 해당 채널이 기본 승인 클라이언트로 동작할지 제어합니다

기본 승인 클라이언트는 다음 조건이 모두 참이면 DM 우선 전달을 자동으로 활성화합니다.

- 채널이 기본 승인 전달을 지원합니다
- 승인자를 명시적 `execApprovals.approvers` 또는 `commands.ownerAllowFrom` 같은 소유자
  ID에서 확인할 수 있습니다
- `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`입니다

기본 승인 클라이언트를 명시적으로 비활성화하려면 `enabled: false`를 설정하세요. 승인자를 확인할 수 있을 때
강제로 켜려면 `enabled: true`를 설정하세요. 공개 원본 채팅 전달은
`channels.<channel>.execApprovals.target`을 통해 계속 명시적으로 설정합니다.

FAQ: [채팅 승인에 exec 승인 구성이 두 개인 이유는 무엇인가요?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

이러한 기본 승인 클라이언트는 공유되는 동일 채팅 `/approve` 흐름과 공유 승인 버튼 위에
DM 라우팅과 선택적 채널 팬아웃을 추가합니다.

공유 동작:

- Slack, Matrix, Microsoft Teams 및 유사한 전달 가능 채팅은 동일 채팅 `/approve`에 일반 채널 인증 모델을
  사용합니다
- 기본 승인 클라이언트가 자동 활성화되면, 기본 기본 전달 대상은 승인자 DM입니다
- Discord와 Telegram에서는 확인된 승인자만 승인하거나 거부할 수 있습니다
- Discord 승인자는 명시적(`execApprovals.approvers`)이거나 `commands.ownerAllowFrom`에서 추론될 수 있습니다
- Telegram 승인자는 명시적(`execApprovals.approvers`)이거나 `commands.ownerAllowFrom`에서 추론될 수 있습니다
- Slack 승인자는 명시적(`execApprovals.approvers`)이거나 `commands.ownerAllowFrom`에서 추론될 수 있습니다
- Slack 기본 버튼은 승인 ID 종류를 보존하므로, `plugin:` ID는 두 번째 Slack 로컬 대체 계층 없이
  Plugin 승인을 해결할 수 있습니다
- Matrix 기본 DM/채널 라우팅과 반응 단축 동작은 exec 및 Plugin 승인을 모두 처리합니다.
  Plugin 권한 부여는 계속 `channels.matrix.dm.allowFrom`에서 옵니다
- Matrix 기본 프롬프트는 첫 프롬프트 이벤트에 `com.openclaw.approval` 사용자 지정 이벤트 콘텐츠를 포함하므로,
  OpenClaw를 인식하는 Matrix 클라이언트는 구조화된 승인 상태를 읽을 수 있고 기본 클라이언트는
  일반 텍스트 `/approve` 대체 경로를 유지합니다
- 요청자는 승인자일 필요가 없습니다
- 원본 채팅이 이미 명령과 응답을 지원하면 `/approve`로 직접 승인할 수 있습니다
- 기본 Discord 승인 버튼은 승인 ID 종류에 따라 라우팅합니다. `plugin:` ID는
  바로 Plugin 승인으로 가고, 그 외는 모두 exec 승인으로 갑니다
- 기본 Telegram 승인 버튼은 `/approve`와 동일한 제한된 exec-to-Plugin 대체 동작을 따릅니다
- 기본 `target`이 원본 채팅 전달을 활성화하면, 승인 프롬프트에 명령 텍스트가 포함됩니다
- 대기 중인 exec 승인은 기본적으로 30분 후 만료됩니다
- 요청을 받을 수 있는 운영자 UI 또는 구성된 승인 클라이언트가 없으면, 프롬프트는 `askFallback`으로 대체됩니다

`/diagnostics` 및 `/export-trajectory` 같은 민감한 소유자 전용 그룹 명령은 승인 프롬프트와 최종 결과에
비공개 소유자 라우팅을 사용합니다. OpenClaw는 먼저 소유자가 명령을 실행한 동일한 표면에서
비공개 경로를 시도합니다. 해당 표면에 비공개 소유자 경로가 없으면,
`commands.ownerAllowFrom`의 첫 번째 사용 가능한 소유자 경로로 대체하므로, Telegram이 구성된
주 비공개 인터페이스일 때 Discord 그룹 명령도 승인과 결과를 소유자의 Telegram DM으로 보낼 수 있습니다.
그룹 채팅에는 짧은 확인 메시지만 전송됩니다.

Telegram은 기본적으로 승인자 DM(`target: "dm"`)을 사용합니다. 승인 프롬프트가 원본 Telegram 채팅/주제에도
표시되게 하려면 `channel` 또는 `both`로 전환할 수 있습니다. Telegram 포럼
주제의 경우, OpenClaw는 승인 프롬프트와 승인 후 후속 메시지에 해당 주제를 보존합니다.

참고:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 흐름
__OC_I18N_900004__
보안 참고 사항:

- Unix 소켓 모드 `0600`, 토큰은 `exec-approvals.json`에 저장됩니다.
- 동일 UID 피어 검사.
- Challenge/response (nonce + HMAC token + request hash) + 짧은 TTL.

## 관련 항목

- [Exec 승인](/ko/tools/exec-approvals) — 핵심 정책 및 승인 흐름
- [Exec 도구](/ko/tools/exec)
- [Elevated 모드](/ko/tools/elevated)
- [Skills](/ko/tools/skills) — Skills 기반 자동 허용 동작
