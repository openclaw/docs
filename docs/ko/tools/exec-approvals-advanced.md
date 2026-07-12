---
read_when:
    - 안전한 바이너리 또는 사용자 지정 안전한 바이너리 프로필 구성
    - Slack/Discord/Telegram 또는 기타 채팅 채널로 승인 전달하기
    - 채널용 네이티브 승인 클라이언트 구현하기
summary: '고급 exec 승인: 안전한 바이너리, 인터프리터 바인딩, 승인 전달, 네이티브 전송'
title: Exec 승인 — 고급 설정
x-i18n:
    generated_at: "2026-07-12T15:49:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

고급 exec 승인 주제: `safeBins` 빠른 경로, 인터프리터/런타임
바인딩, 채팅 채널로의 승인 전달(네이티브 전달 포함).
핵심 정책과 승인 흐름은 [Exec 승인](/ko/tools/exec-approvals)을 참조하십시오.

## 안전한 바이너리(stdin 전용)

`tools.exec.safeBins`는 명시적인 허용 목록 항목 **없이** 허용 목록 모드에서
실행되는 **stdin 전용** 바이너리(예: `cut`)를 지정합니다. 안전한 바이너리는
위치 파일 인수와 경로 형태의 토큰을 거부하므로 들어오는 스트림만 처리할 수
있습니다. 이를 일반적인 신뢰 목록이 아니라 스트림 필터를 위한 제한적인 빠른
경로로 취급하십시오.

<Warning>
인터프리터 또는 런타임 바이너리(예: `python3`, `node`, `ruby`, `bash`, `sh`,
`zsh`)를 `safeBins`에 추가하지 **마십시오**. 명령이 코드를 평가하거나,
하위 명령을 실행하거나, 설계상 파일을 읽을 수 있다면 명시적인 허용 목록 항목을
사용하고 승인 프롬프트를 활성화된 상태로 유지하십시오. 사용자 지정 안전한
바이너리는 `tools.exec.safeBinProfiles.<bin>`에 명시적인 프로필을 정의해야 합니다.
</Warning>

기본 안전한 바이너리:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep`과 `sort`는 기본 목록에 포함되지 않습니다. 사용하도록 선택하는 경우
stdin을 사용하지 않는 워크플로에는 명시적인 허용 목록 항목을 유지하십시오.
안전한 바이너리 모드의 `grep`에서는 `-e`/`--regexp`로 패턴을 제공하십시오.
파일 피연산자를 모호한 위치 인수로 위장하여 전달할 수 없도록 위치 패턴 형식은
거부됩니다.

### Argv 검증 및 거부되는 플래그

검증은 argv 형태만으로 결정론적으로 수행되며(호스트 파일 시스템의 존재 여부를
확인하지 않음), 이를 통해 허용/거부 차이로 파일 존재 여부를 알아내는 오라클
동작을 방지합니다. 기본 안전한 바이너리에서는 파일 지향 옵션이 거부됩니다.
긴 옵션은 실패 시 차단 방식으로 검증되며 알 수 없는 플래그와 모호한 축약형은
거부됩니다. 기본 바이너리에서 인식되는 읽기 전용 불리언 플래그(예:
`wc -l`, `tr -d`, `uniq -c`)는 허용되지만, 인식되지 않는 짧은 플래그는
계속 실패 시 차단되며 수동 승인으로 넘어갑니다.

안전한 바이너리 프로필별 거부되는 플래그:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

또한 안전한 바이너리는 stdin 전용 세그먼트를 실행할 때 argv 토큰을 **리터럴
텍스트**로 처리하도록 강제합니다(글로빙 및 `$VARS` 확장 없음). 따라서 `*` 또는
`$HOME/...` 같은 패턴으로 파일 읽기를 위장할 수 없습니다. `awk`, `sed`, `jq`는
stdin 전용으로 검증할 수 없는 의미 체계를 가지므로 항상 안전한 바이너리로
거부됩니다. `jq`는 환경 데이터를 읽고 모듈이나 시작 파일에서 jq 코드를 로드할
수 있습니다. 이러한 도구에는 `safeBins` 대신 명시적인 허용 목록 항목이나 승인
프롬프트를 사용하십시오.

### 신뢰할 수 있는 바이너리 디렉터리

안전한 바이너리는 신뢰할 수 있는 바이너리 디렉터리(시스템 기본값 및 선택적
`tools.exec.safeBinTrustedDirs`)에서 확인되어야 합니다. `PATH` 항목은 자동으로
신뢰되지 않습니다. 기본 신뢰 디렉터리는 의도적으로 최소화되어 있습니다:
`/bin`, `/usr/bin`. 안전한 바이너리 실행 파일이 패키지 관리자/사용자 경로(예:
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`)에 있다면
이를 `tools.exec.safeBinTrustedDirs`에 명시적으로 추가하십시오.

### 셸 체이닝, 래퍼 및 멀티플렉서

모든 최상위 세그먼트가 허용 목록(안전한 바이너리 또는 Skills 자동 허용 포함)을
충족하면 셸 체이닝(`&&`, `||`, `;`)이 허용됩니다. 리디렉션은 허용 목록 모드에서
계속 지원되지 않습니다. 명령 치환(`$()` / 백틱)은 큰따옴표 내부를 포함하여
허용 목록 구문 분석 중 거부됩니다. 리터럴 `$()` 텍스트가 필요하면 작은따옴표를
사용하십시오.

macOS 컴패니언 앱 승인에서는 셸 제어 또는 확장 구문(`&&`, `||`, `;`, `|`,
`` ` ``, `$`, `<`, `>`, `(`, `)`)을 포함한 원시 셸 텍스트를 셸 바이너리 자체가
허용 목록에 포함되지 않은 한 허용 목록 불일치로 처리합니다.

셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 환경 재정의가 작은 명시적
허용 목록(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)으로
제한됩니다.

허용 목록 모드의 `allow-always` 결정에서는 투명한 디스패치 래퍼(예: `env`,
`flock`, `nice`, `nohup`, `stdbuf`, `timeout`)에 대해 래퍼 경로 대신 내부 실행
파일 경로를 저장합니다. 셸 멀티플렉서(`busybox`, `toybox`)도 셸 애플릿(`sh`,
`ash` 등)에 대해 같은 방식으로 래핑이 해제됩니다. 래퍼 또는 멀티플렉서의
래핑을 안전하게 해제할 수 없다면 허용 목록 항목이 자동으로 저장되지 않습니다.

`python3` 또는 `node` 같은 인터프리터를 허용 목록에 추가하는 경우 인라인 평가에
계속 명시적인 승인이 필요하도록 `tools.exec.strictInlineEval=true`를 사용하는
것이 좋습니다. 엄격 모드에서도 `allow-always`는 안전한 인터프리터/스크립트
호출을 저장할 수 있지만 인라인 평가 전달자는 자동으로 저장되지 않습니다.

### 안전한 바이너리와 허용 목록 비교

| 주제             | `tools.exec.safeBins`                                  | 허용 목록(`exec-approvals.json`)                                                        |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 목표             | 제한적인 stdin 필터 자동 허용                          | 특정 실행 파일을 명시적으로 신뢰                                                       |
| 일치 유형        | 실행 파일 이름 + 안전한 바이너리 argv 정책            | 확인된 실행 파일 경로 glob 또는 PATH로 호출되는 명령의 단순 명령 이름 glob             |
| 인수 범위        | 안전한 바이너리 프로필 및 리터럴 토큰 규칙으로 제한   | 기본적으로 경로 일치, 선택적 `argPattern`으로 파싱된 argv 제한 가능                     |
| 일반적인 예      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 사용자 지정 CLI                                     |
| 최적 용도        | 파이프라인의 저위험 텍스트 변환                        | 더 광범위한 동작이나 부작용이 있는 모든 도구                                            |

구성 위치:

- `safeBins`는 구성(`tools.exec.safeBins` 또는 에이전트별 `agents.list[].tools.exec.safeBins`)에서 가져옵니다.
- `safeBinTrustedDirs`는 구성(`tools.exec.safeBinTrustedDirs` 또는 에이전트별 `agents.list[].tools.exec.safeBinTrustedDirs`)에서 가져옵니다.
- `safeBinProfiles`는 구성(`tools.exec.safeBinProfiles` 또는 에이전트별 `agents.list[].tools.exec.safeBinProfiles`)에서 가져옵니다. 에이전트별 프로필 키가 전역 키를 재정의합니다.
- 허용 목록 항목은 `agents.<id>.allowlist` 아래의 호스트 로컬 승인 파일에 있습니다(Control UI / `openclaw approvals allowlist ...`를 통해서도 설정 가능).
- 프로필이 명시되지 않은 인터프리터/런타임 바이너리가 `safeBins`에 나타나면 `openclaw security audit`가 `tools.exec.safe_bins_interpreter_unprofiled` 경고를 표시합니다.
- `openclaw doctor --fix`는 누락된 사용자 지정 `safeBinProfiles.<bin>` 항목을 `{}`로 구성할 수 있습니다(이후 검토하고 제한을 강화하십시오). 인터프리터/런타임 바이너리는 자동으로 구성되지 않습니다.

사용자 지정 프로필 예:
__OC_I18N_900000__
## 인터프리터/런타임 명령

승인 기반 인터프리터/런타임 실행은 의도적으로 보수적으로 처리됩니다.

- 정확한 argv/cwd/env 컨텍스트가 항상 바인딩됩니다.
- 직접 셸 스크립트 및 직접 런타임 파일 형식은 최선의 방식으로 하나의 구체적인 로컬
  파일 스냅샷에 바인딩됩니다.
- 여전히 하나의 직접 로컬 파일로 확인되는 일반적인 패키지 관리자 래퍼 형식(예:
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`)은 바인딩 전에 래핑이 해제됩니다.
- OpenClaw가 인터프리터/런타임 명령에 대해 정확히 하나의 구체적인 로컬 파일을
  식별할 수 없는 경우(예: 패키지 스크립트, eval 형식, 런타임별 로더 체인 또는
  모호한 다중 파일 형식), 제공할 수 없는 의미적 범위를 보장하는 대신 승인 기반
  실행을 거부합니다.
- 이러한 워크플로에는 샌드박싱, 별도의 호스트 경계 또는 운영자가 더 광범위한
  런타임 의미 체계를 수용하는 명시적으로 신뢰된 허용 목록/전체 워크플로를
  사용하는 것이 좋습니다.

승인이 필요하면 exec 도구는 승인 ID와 함께 즉시 반환됩니다. 이 ID를 사용하여
나중에 발생하는 승인된 실행 시스템 이벤트(`Exec finished`, 구성된 경우
`Exec running`)를 연계하십시오. 제한 시간 전에 결정이 도착하지 않으면 요청은
승인 시간 초과로 처리되고 최종 호스트 명령 거부로 표시됩니다. 원래 세션이 있는
주 에이전트 비동기 승인에서는 OpenClaw가 내부 후속 작업으로 해당 세션을
재개하므로, 에이전트가 나중에 누락된 결과를 복구하는 대신 명령이 실행되지
않았음을 인식합니다. 대기 중인 exec 승인은 기본적으로 30분 후 만료됩니다.

### 후속 전달 동작

승인된 비동기 exec가 완료되면 OpenClaw는 동일한 세션에 후속 `agent` 턴을
보냅니다. 거부된 비동기 승인은 거부 상태에 대해 동일한 주 세션 후속 경로를
사용하지만, 상승된 런타임 핸드오프를 등록하지 않으며 명령을 실행하지도 않습니다.
재개 가능한 주 세션이 없는 거부는 억제되거나, 안전한 직접 경로가 있는 경우 이를
통해 보고됩니다.

- 유효한 외부 전달 대상(전달 가능한 채널 및 대상 `to`)이 있으면 후속 전달은 해당 채널을 사용합니다.
- 외부 대상이 없는 웹 채팅 전용 또는 내부 세션 흐름에서는 후속 전달이 세션 전용(`deliver: false`)으로 유지됩니다.
- 호출자가 확인 가능한 외부 채널 없이 엄격한 외부 전달을 명시적으로 요청하면 요청이 `INVALID_REQUEST`로 실패합니다.
- `bestEffortDeliver`가 활성화되어 있고 외부 채널을 확인할 수 없으면 실패하는 대신 전달이 세션 전용으로 하향 조정됩니다.

## 채팅 채널로 승인 전달

exec 승인 프롬프트를 모든 채팅 채널(Plugin 채널 포함)로 전달하고 `/approve`로
승인할 수 있습니다. 이 기능은 일반적인 아웃바운드 전달 파이프라인을 사용합니다.

구성:
__OC_I18N_900001__
채팅에서 응답:
__OC_I18N_900002__
`/approve` 명령은 exec 승인과 Plugin 승인을 모두 처리합니다. ID가 대기 중인
exec 승인과 일치하지 않으면 자동으로 Plugin 승인을 대신 확인합니다. 이 대체
동작은 "approval not found" 실패로 제한됩니다. 실제 exec 승인 거부/오류가
Plugin 승인으로 자동 재시도되지는 않습니다.

### Plugin 승인 전달

Plugin 승인 전달은 exec 승인과 동일한 전달 파이프라인을 사용하지만
`approvals.plugin` 아래에 독립된 자체 구성이 있습니다. 한쪽을 활성화하거나
비활성화해도 다른 쪽에는 영향을 주지 않습니다. Plugin 작성 동작, 요청 필드 및
결정 의미 체계는 [Plugin 권한 요청](/plugins/plugin-permission-requests)을
참조하십시오.
__OC_I18N_900003__
구성 형태는 `approvals.exec`와 동일합니다. `enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets`가 같은 방식으로 작동합니다.

공유 대화형 응답을 지원하는 채널은 exec 승인과 Plugin 승인 모두에 동일한 승인 버튼을 렌더링합니다. 공유 대화형 UI가 없는 채널은 `/approve` 안내가 포함된 일반 텍스트로 대체됩니다. Plugin 승인 요청은 사용 가능한 결정을 제한할 수 있습니다. 승인 화면은 요청에 선언된 결정 집합을 사용하며, Gateway는 제시되지 않은 결정을 제출하려는 시도를 거부합니다.

### 모든 채널에서 동일 채팅 승인

exec 또는 Plugin 승인 요청이 전달 가능한 채팅 화면에서 시작된 경우, 기본적으로 같은 채팅에서 `/approve`를 사용해 승인할 수 있습니다. 이는 기존 Web UI 및 터미널 UI 흐름에 더해 Slack, Matrix, Microsoft Teams 및 이와 유사한 전달 가능한 채팅에 적용되며, 해당 대화의 일반 채널 인증 모델을 사용합니다. 원래 채팅에서 이미 명령을 보내고 응답을 받을 수 있다면, 승인 요청을 대기 상태로 유지하기 위해 별도의 네이티브 전달 어댑터가 더 이상 필요하지 않습니다.

Discord, Telegram 및 QQ bot도 동일 채팅 `/approve`를 지원하지만, 이러한 채널은 네이티브 승인 전달이 비활성화된 경우에도 확인된 승인자 목록을 권한 부여에 계속 사용합니다.

### 네이티브 승인 전달

일부 채널은 네이티브 승인 클라이언트 역할도 할 수 있습니다. 해당 채널은 Discord, Slack, Telegram, Matrix 및 QQ bot입니다. 네이티브 클라이언트는 공유 동일 채팅 `/approve` 흐름에 더해 승인자 DM, 원본 채팅 팬아웃 및 채널별 대화형 승인 UX를 제공합니다.

네이티브 승인 카드/버튼을 사용할 수 있는 경우 해당 네이티브 UI가 에이전트가 사용하는 기본 경로입니다. 도구 결과에서 채팅 승인을 사용할 수 없다고 명시하거나 수동 승인이 유일하게 남은 경로가 아닌 한, 에이전트는 일반 채팅에 중복된 `/approve` 명령을 추가로 표시해서는 안 됩니다.

네이티브 승인 클라이언트가 구성되어 있지만 요청이 시작된 채널에 활성화된 네이티브 런타임이 없는 경우, OpenClaw는 로컬의 결정론적 `/approve` 프롬프트를 계속 표시합니다. 네이티브 런타임이 활성화되어 전달을 시도했지만 어떤 대상도 카드를 받지 못한 경우, OpenClaw는 요청을 계속 처리할 수 있도록 정확한 `/approve <id> <decision>` 명령이 포함된 동일 채팅 대체 알림을 보냅니다.

일반 모델:

- 호스트 exec 정책은 exec 승인이 필요한지 여부를 계속 결정합니다
- `approvals.exec`는 승인 프롬프트를 다른 채팅 대상으로 전달하는 동작을 제어합니다
- `channels.<channel>.execApprovals`는 Discord, Slack, Telegram, QQ bot 및 이와 유사한 채널별 네이티브 클라이언트의 활성화 여부를 제어합니다
- 요청이 Slack에서 시작되고 Slack Plugin 승인자가 확인되면 Slack Plugin 승인은 Slack의 네이티브 승인 클라이언트를 사용할 수 있습니다. Slack exec 승인이 비활성화되어 있어도 `approvals.plugin`을 통해 Plugin 승인을 Slack 세션 또는 대상으로 라우팅할 수 있습니다
- Google Chat 네이티브 승인 카드는 `dm.allowFrom` 또는 `defaultTo`에서 안정적인 `users/<id>` 승인자가 확인되는 경우 Google Chat 스페이스 또는 스레드에서 시작된 exec 및 Plugin 승인을 처리합니다. 결정에는 반응 이벤트를 사용하지 않습니다
- WhatsApp 및 Signal 반응 승인 전달은 `approvals.exec` 및 `approvals.plugin`에 의해 제한됩니다. 이 채널에는 `channels.<channel>.execApprovals` 블록이 없습니다

다음 조건을 모두 충족하면 네이티브 승인 클라이언트에서 DM 우선 전달이 자동으로 활성화됩니다.

- 채널이 네이티브 승인 전달을 지원합니다
- 명시적인 `execApprovals.approvers` 또는 `commands.ownerAllowFrom` 같은 소유자 ID에서 승인자를 확인할 수 있습니다
- `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`입니다

네이티브 승인 클라이언트를 명시적으로 비활성화하려면 `enabled: false`를 설정하십시오. 승인자가 확인될 때 강제로 활성화하려면 `enabled: true`를 설정하십시오. 공개 원본 채팅 전달은 `channels.<channel>.execApprovals.target`을 통해 명시적으로 설정해야 합니다. 네이티브 `target`에서 원본 채팅 전달을 활성화하면 승인 프롬프트에 명령 텍스트가 포함됩니다.

FAQ: [채팅 승인에 exec 승인 구성이 두 개 있는 이유는 무엇입니까?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: `channels.googlechat.dm.allowFrom` 또는 `channels.googlechat.defaultTo`를 사용하여 안정적인 승인자를 구성하십시오. `execApprovals` 블록은 필요하지 않습니다
- WhatsApp: `approvals.exec` 및 `approvals.plugin`을 사용하여 승인 프롬프트를 WhatsApp으로 라우팅하십시오
- Signal: `approvals.exec` 및 `approvals.plugin`을 사용하여 승인 프롬프트를 Signal로 라우팅하십시오

네이티브 클라이언트별 라우팅:

- Telegram은 기본적으로 승인자 DM(`target: "dm"`)을 사용합니다. 요청이 시작된 Telegram 채팅/주제에도 승인 프롬프트를 표시하려면 `channel` 또는 `both`로 전환하십시오. Telegram 포럼 주제의 경우 OpenClaw는 승인 프롬프트와 승인 후 후속 메시지에 해당 주제를 유지합니다.
- Discord 및 Telegram 승인자는 명시적으로 설정하거나(`execApprovals.approvers`) `commands.ownerAllowFrom`에서 추론할 수 있습니다. 확인된 승인자만 승인하거나 거부할 수 있습니다.
- Slack 승인자는 명시적으로 설정하거나(`execApprovals.approvers`) `commands.ownerAllowFrom`에서 추론할 수 있습니다. Slack Plugin 승인 DM은 Slack exec 승인자가 아니라 `allowFrom` 및 계정 기본 라우팅의 Slack Plugin 승인자를 사용합니다. Slack 네이티브 버튼은 승인 ID 종류를 유지하므로 `plugin:` ID는 두 번째 Slack 로컬 대체 계층 없이 Plugin 승인을 처리할 수 있습니다.
- Google Chat 네이티브 카드는 메시지 텍스트에 수동 `/approve` 대체 경로를 유지하지만, 카드 버튼 콜백에는 불투명 작업 토큰만 포함됩니다. 승인 ID와 결정은 서버 측 대기 상태에서 복구됩니다.
- WhatsApp 이모지 승인은 일치하는 최상위 전달 계열이 WhatsApp으로 라우팅되는 경우 exec 및 Plugin 프롬프트를 모두 처리합니다. 네이티브 원본 프롬프트는 직접 바인딩되며, 공유 대상 모드 전달은 동일한 형식화된 승인 메타데이터를 수락된 WhatsApp 메시지 수신 확인에 바인딩합니다.
- Signal 반응 승인은 일치하는 최상위 전달 계열이 활성화되어 Signal로 라우팅되는 경우에만 exec 및 Plugin 프롬프트를 모두 처리합니다. 직접 동일 채팅 Signal exec 승인은 명시적인 승인자 없이 로컬 `/approve` 대체 경로를 숨길 수 있습니다. Signal 반응 처리는 여전히 `channels.signal.allowFrom` 또는 `defaultTo`의 명시적인 Signal 승인자가 필요합니다.
- Matrix 네이티브 DM/채널 라우팅 및 반응 바로 가기는 exec 및 Plugin 승인을 모두 처리합니다. Plugin 권한 부여에는 계속 `channels.matrix.dm.allowFrom`을 사용합니다. Matrix 네이티브 프롬프트는 첫 번째 프롬프트 이벤트에 `com.openclaw.approval` 사용자 지정 이벤트 콘텐츠를 포함하므로 OpenClaw 인식 Matrix 클라이언트는 구조화된 승인 상태를 읽을 수 있으며, 기본 클라이언트에는 일반 텍스트 `/approve` 대체 경로가 유지됩니다.
- 네이티브 Discord 및 Telegram 승인 버튼은 전송 전용 콜백 데이터에 명시적인 exec 또는 Plugin 소유자 종류를 포함하며 해당 소유자만 처리합니다. 종류가 없는 이전 `/approve` 컨트롤은 범위가 제한된 호환성 경로로 유지됩니다. 이 컨트롤은 행위자가 승인할 수 있는 소유자 종류만 시도하고, 승인을 찾을 수 없다는 결과가 나온 후에만 계속하며, 승인 ID에서 소유권을 추론하지 않습니다.
- 요청자는 승인자일 필요가 없습니다.
- 요청을 수락할 수 있는 운영자 UI 또는 구성된 승인 클라이언트가 없으면 프롬프트는 `askFallback`으로 대체됩니다.

`/diagnostics` 및 `/export-trajectory` 같은 민감한 소유자 전용 그룹 명령은 승인 프롬프트와 최종 결과에 비공개 소유자 라우팅을 사용합니다. OpenClaw는 먼저 소유자가 명령을 실행한 동일한 화면에서 비공개 경로를 시도합니다. 해당 화면에 비공개 소유자 경로가 없으면 `commands.ownerAllowFrom`에서 사용 가능한 첫 번째 소유자 경로로 대체되므로, Telegram이 기본 비공개 인터페이스로 구성된 경우 Discord 그룹 명령에서도 승인 및 결과를 소유자의 Telegram DM으로 보낼 수 있습니다. 그룹 채팅에는 짧은 확인 메시지만 표시됩니다.

참조:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### 공식 모바일 운영자 앱

공식 iOS 및 Android 앱은 `operator.admin` 연결을 사용하거나 요청에서 페어링된 `operator.approvals` 기기를 명시적으로 대상으로 지정한 경우, Gateway가 소유한 대기 중인 exec 승인을 검토할 수도 있습니다. 이러한 앱은 Control UI에서 사용하는 것과 동일하게 정제된 영구 레코드를 읽고, 종류를 인식하는 결정을 제출하며, Gateway의 표준 첫 응답 결과를 표시합니다. Apple Watch는 페어링된 iPhone을 통해 이러한 승인 프롬프트를 미러링하며, 한 번 허용 및 거부 작업을 제공합니다. 직접 Watch Gateway 모드에서는 승인을 검토하지 않습니다.

처리 확인 응답이 유실되어도 제출한 선택이 권위 있는 결정이 되지는 않습니다. 앱은 컨트롤을 비활성화하고 레코드를 다시 읽습니다. 다른 화면이 먼저 처리했다면 앱은 기록된 해당 결정을 표시합니다. 대기 중인 프롬프트는 이를 발행한 Gateway에 계속 바인딩되므로 활성 Gateway를 전환해도 이전 승인 ID를 리디렉션할 수 없습니다.

### macOS IPC 흐름
__OC_I18N_900004__
보안 참고 사항:

- Unix 소켓 모드 `0600`, 토큰은 `exec-approvals.json`에 저장됩니다.
- 동일 UID 피어 검사.
- 챌린지/응답(논스 + HMAC 토큰 + 요청 해시) + 짧은 TTL.

## FAQ

### 승인 대상에서 `accountId`와 `threadId`는 언제 사용합니까?

채널에 구성된 ID가 여러 개 있고 승인 프롬프트를 특정 계정을 통해 보내야 할 때 `accountId`를 사용하십시오. 대상에서 주제 또는 스레드를 지원하고 프롬프트를 최상위 채팅이 아닌 해당 스레드 내에 유지해야 할 때 `threadId`를 사용하십시오.

구체적인 Telegram 사례로 포럼 주제와 Telegram bot 계정 두 개가 있는 운영 슈퍼그룹을 들 수 있습니다. `to` 값은 슈퍼그룹을 지정하고, `accountId`는 bot 계정을 선택하며, `threadId`는 포럼 주제를 선택합니다.
__OC_I18N_900005__
이렇게 설정하면 전달된 exec 승인은 `ops-bot` Telegram 계정이 채팅 `-1001234567890`의 주제 `77`에 게시합니다. `accountId`가 없는 대상은 채널의 기본 계정을 사용하고, `threadId`가 없는 대상은 최상위 대상에 게시합니다.

### 승인이 세션으로 전송되면 해당 세션의 누구나 승인할 수 있습니까?

아닙니다. 세션 전달은 프롬프트가 표시되는 위치만 제어합니다. 그 자체로 해당 채팅의 모든 참가자에게 승인 권한을 부여하지는 않습니다.

일반 동일 채팅 `/approve`의 경우 발신자는 해당 채널 세션에서 명령을 실행할 권한이 이미 있어야 합니다. 채널에서 명시적인 승인자를 제공하는 경우, 해당 승인자는 그 세션에서 다른 명령을 실행할 권한이 없더라도 `/approve` 작업을 승인할 수 있습니다.

일부 채널은 더 엄격합니다. Discord, Telegram, Matrix, Slack 네이티브 승인 DM 및 이와 유사한 네이티브 승인 클라이언트는 확인된 승인자 목록을 승인 권한 부여에 사용합니다. 예를 들어 Telegram 포럼 주제의 승인 프롬프트는 주제에 있는 모든 사람에게 표시될 수 있지만, `channels.telegram.execApprovals.approvers` 또는 `commands.ownerAllowFrom`에서 확인된 숫자형 Telegram 사용자 ID만 승인하거나 거부할 수 있습니다.

## 관련 항목

- [Exec 승인](/ko/tools/exec-approvals) — 핵심 정책 및 승인 흐름
- [Exec 도구](/ko/tools/exec)
- [권한 상승 모드](/ko/tools/elevated)
- [Skills](/ko/tools/skills) — 스킬 기반 자동 허용 동작
