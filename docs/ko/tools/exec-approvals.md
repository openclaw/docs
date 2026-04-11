---
read_when:
    - exec 승인 또는 허용 목록 구성하기
    - macOS 앱에서 exec 승인 UX 구현하기
    - sandbox 탈출 프롬프트와 그 의미 검토하기
summary: exec 승인, 허용 목록, 그리고 sandbox 탈출 프롬프트
title: exec 승인
x-i18n:
    generated_at: "2026-04-11T02:48:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4a2e2f1f3c13a1d1926c9de0720513ea8a74d1ca571dbe74b188d8c560c14c
    source_path: tools/exec-approvals.md
    workflow: 15
---

# exec 승인

exec 승인은 샌드박스된 에이전트가 실제 호스트(`gateway` 또는 `node`)에서 명령을 실행할 수 있게 할 때 사용하는 **companion app / node host 가드레일**입니다. 안전 인터록처럼 생각하면 됩니다.
명령은 정책 + 허용 목록 + (선택적) 사용자 승인이 모두 동의할 때만 허용됩니다.
exec 승인은 도구 정책 및 elevated 게이팅에 **추가로** 적용됩니다(단, elevated가 `full`로 설정된 경우 승인을 건너뜁니다).
유효 정책은 `tools.exec.*`와 승인 기본값 중 **더 엄격한 쪽**입니다. 승인 필드가 생략되면 `tools.exec` 값이 사용됩니다.
호스트 exec는 해당 머신의 로컬 승인 상태도 사용합니다. `~/.openclaw/exec-approvals.json`에 있는 호스트 로컬 `ask: "always"`는 세션이나 config 기본값이 `ask: "on-miss"`를 요청하더라도 계속 프롬프트를 표시하게 만듭니다.
요청된 정책, 호스트 정책 소스, 유효 결과를 확인하려면 `openclaw approvals get`, `openclaw approvals get --gateway`, 또는 `openclaw approvals get --node <id|name|ip>`를 사용하세요.
로컬 머신에서는 `openclaw exec-policy show`가 동일한 병합 뷰를 노출하며, `openclaw exec-policy set|preset`은 로컬 요청 정책을 로컬 호스트 승인 파일과 한 번에 동기화할 수 있습니다. 로컬 범위가 `host=node`를 요청하면, `openclaw exec-policy show`는 런타임에서 해당 범위를 node 관리형으로 보고하며 로컬 승인 파일이 유효한 진실 공급원인 것처럼 가장하지 않습니다.

companion app UI를 **사용할 수 없는 경우**, 프롬프트가 필요한 모든 요청은 **ask fallback**(기본값: deny)으로 처리됩니다.

기본 채팅 승인 클라이언트는 대기 중인 승인 메시지에 채널별 affordance를 노출할 수도 있습니다. 예를 들어 Matrix는 승인 프롬프트에 반응 단축키(`✅` 한 번 허용, `❌` 거부, 가능할 경우 `♾️` 항상 허용)를 미리 넣을 수 있으며, 동시에 `/approve ...` 명령도 폴백으로 남겨둘 수 있습니다.

## 적용 위치

exec 승인은 실행 호스트에서 로컬로 강제됩니다.

- **gateway host** → gateway 머신의 `openclaw` 프로세스
- **node host** → node runner(macOS companion app 또는 headless node host)

신뢰 모델 참고:

- Gateway 인증 호출자는 해당 Gateway의 신뢰된 운영자입니다.
- 페어링된 node는 그 신뢰된 운영자 기능을 node host까지 확장합니다.
- exec 승인은 우발적인 실행 위험을 줄이지만, 사용자별 인증 경계는 아닙니다.
- 승인된 node-host 실행은 정식 실행 컨텍스트를 바인드합니다. 정식 cwd, 정확한 argv, 존재할 경우 env 바인딩, 적용 가능한 경우 고정된 실행 파일 경로입니다.
- 셸 스크립트 및 직접 인터프리터/런타임 파일 호출의 경우, OpenClaw는 하나의 구체적인 로컬 파일 피연산자도 바인드하려고 시도합니다. 승인 후 실행 전에 해당 바인드된 파일이 변경되면, 변경된 내용을 실행하는 대신 실행이 거부됩니다.
- 이 파일 바인딩은 의도적으로 best-effort이며, 모든 인터프리터/런타임 로더 경로에 대한 완전한 의미 모델은 아닙니다. 승인 모드가 바인드할 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면, 완전한 커버리지를 가장하는 대신 승인 기반 실행 발급을 거부합니다.

macOS 분리 구조:

- **node host service**는 로컬 IPC를 통해 `system.run`을 **macOS app**으로 전달합니다.
- **macOS app**은 승인을 강제하고 UI 컨텍스트에서 명령을 실행합니다.

## 설정 및 저장소

승인은 실행 호스트의 로컬 JSON 파일에 저장됩니다.

`~/.openclaw/exec-approvals.json`

스키마 예시:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 승인 없는 "YOLO" 모드

호스트 exec를 승인 프롬프트 없이 실행하려면 두 정책 계층을 **모두** 열어야 합니다.

- OpenClaw config의 요청된 exec 정책(`tools.exec.*`)
- `~/.openclaw/exec-approvals.json`의 호스트 로컬 승인 정책

이를 명시적으로 더 엄격하게 조이지 않는 한, 이제 이것이 기본 호스트 동작입니다.

- `tools.exec.security`: `gateway`/`node`에서 `full`
- `tools.exec.ask`: `off`
- 호스트 `askFallback`: `full`

중요한 구분:

- `tools.exec.host=auto`는 exec가 어디에서 실행되는지 선택합니다. 샌드박스가 있으면 샌드박스, 아니면 gateway입니다.
- YOLO는 호스트 exec가 어떻게 승인되는지를 선택합니다. `security=full` + `ask=off`입니다.
- YOLO 모드에서는 OpenClaw가 구성된 호스트 exec 정책 위에 별도의 휴리스틱 명령 난독화 승인 게이트를 추가하지 않습니다.
- `auto`는 샌드박스된 세션에서 gateway 라우팅을 자유롭게 재정의하게 해주지 않습니다. 호출별 `host=node` 요청은 `auto`에서 허용되며, `host=gateway`는 샌드박스 런타임이 활성 상태가 아닐 때만 `auto`에서 허용됩니다. 안정적인 non-auto 기본값이 필요하면 `tools.exec.host`를 설정하거나 `/exec host=...`를 명시적으로 사용하세요.

더 보수적인 구성을 원한다면, 어느 계층이든 다시 `allowlist` / `on-miss` 또는 `deny`로 조이세요.

지속적인 gateway-host "프롬프트 없음" 설정:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

그런 다음 호스트 승인 파일도 이에 맞게 설정하세요.

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

현재 머신에서 동일한 gateway-host 정책을 적용하는 로컬 단축키:

```bash
openclaw exec-policy preset yolo
```

이 로컬 단축키는 다음 둘 다를 업데이트합니다.

- 로컬 `tools.exec.host/security/ask`
- 로컬 `~/.openclaw/exec-approvals.json` 기본값

이 기능은 의도적으로 로컬 전용입니다. gateway-host 또는 node-host 승인을 원격으로 변경해야 한다면 계속 `openclaw approvals set --gateway` 또는 `openclaw approvals set --node <id|name|ip>`를 사용하세요.

node host의 경우, 동일한 승인 파일을 해당 node에 대신 적용하세요.

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

중요한 로컬 전용 제한 사항:

- `openclaw exec-policy`는 node 승인을 동기화하지 않습니다.
- `openclaw exec-policy set --host node`는 거부됩니다.
- node exec 승인은 런타임에 node에서 가져오므로, node 대상 업데이트는 `openclaw approvals --node ...`를 사용해야 합니다.

세션 전용 단축키:

- `/exec security=full ask=off`는 현재 세션만 변경합니다.
- `/elevated full`은 해당 세션에서 exec 승인도 건너뛰는 비상 단축키입니다.

호스트 승인 파일이 config보다 더 엄격하면, 더 엄격한 호스트 정책이 여전히 우선합니다.

## 정책 노브

### 보안 (`exec.security`)

- **deny**: 모든 호스트 exec 요청 차단
- **allowlist**: 허용 목록에 있는 명령만 허용
- **full**: 모두 허용(elevated와 동일)

### Ask (`exec.ask`)

- **off**: 절대 프롬프트하지 않음
- **on-miss**: 허용 목록이 일치하지 않을 때만 프롬프트
- **always**: 모든 명령에 대해 프롬프트
- `allow-always`의 지속 신뢰는 유효 ask 모드가 `always`일 때 프롬프트를 억제하지 않습니다.

### Ask fallback (`askFallback`)

프롬프트가 필요하지만 도달 가능한 UI가 없으면, fallback이 다음을 결정합니다.

- **deny**: 차단
- **allowlist**: 허용 목록이 일치할 때만 허용
- **full**: 허용

### 인라인 인터프리터 eval 강화 (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true`이면, OpenClaw는 인터프리터 바이너리 자체가 허용 목록에 있더라도 인라인 코드 eval 형식을 승인 전용으로 취급합니다.

예시:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

이는 하나의 안정적인 파일 피연산자에 깔끔하게 매핑되지 않는 인터프리터 로더에 대한 defense-in-depth입니다. strict 모드에서는:

- 이러한 명령은 여전히 명시적 승인이 필요합니다.
- `allow-always`는 이들에 대해 새 허용 목록 항목을 자동으로 영구 저장하지 않습니다.

## 허용 목록(에이전트별)

허용 목록은 **에이전트별**입니다. 여러 에이전트가 있다면 macOS 앱에서 편집할 에이전트를 전환하세요. 패턴은 **대소문자를 구분하지 않는 glob 일치**입니다.
패턴은 **바이너리 경로**로 해석되어야 합니다(기본 이름만 있는 항목은 무시됨).
레거시 `agents.default` 항목은 로드 시 `agents.main`으로 마이그레이션됩니다.
`echo ok && pwd` 같은 셸 체인도 여전히 각 최상위 세그먼트가 허용 목록 규칙을 만족해야 합니다.

예시:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

각 허용 목록 항목은 다음을 추적합니다.

- **id** UI 식별에 사용하는 안정적인 UUID(선택 사항)
- **마지막 사용**
- **마지막 사용 명령**
- **마지막 해석 경로**

## Skills CLI 자동 허용

**Skills CLI 자동 허용**이 활성화되면, 알려진 Skills가 참조하는 실행 파일은 node(macOS node 또는 headless node host)에서 허용 목록에 있는 것으로 처리됩니다. 이는 Gateway RPC를 통해 `skills.bins`를 사용해 skill bin 목록을 가져옵니다. 엄격한 수동 허용 목록만 원한다면 이 기능을 비활성화하세요.

중요한 신뢰 참고:

- 이것은 수동 경로 허용 목록 항목과 별개의 **암묵적 편의 허용 목록**입니다.
- Gateway와 node가 동일한 신뢰 경계에 있는 신뢰된 운영자 환경을 위한 것입니다.
- 엄격한 명시적 신뢰가 필요하다면 `autoAllowSkills: false`를 유지하고 수동 경로 허용 목록 항목만 사용하세요.

## 안전한 bin(stdin 전용)

`tools.exec.safeBins`는 명시적 허용 목록 항목 없이도 allowlist 모드에서 실행할 수 있는 작은 **stdin 전용** 바이너리 목록(예: `cut`)을 정의합니다. safe bin은 위치 파일 인수와 경로 형태 토큰을 거부하므로 들어오는 스트림에서만 동작할 수 있습니다.
이 기능은 일반적인 신뢰 목록이 아니라 스트림 필터를 위한 제한적인 빠른 경로로 취급하세요.
인터프리터 또는 런타임 바이너리(예: `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`)는 `safeBins`에 추가하지 **마세요**.
명령이 설계상 코드를 평가하거나, 하위 명령을 실행하거나, 파일을 읽을 수 있다면 명시적 허용 목록 항목을 선호하고 승인 프롬프트를 계속 활성화하세요.
사용자 지정 safe bin은 `tools.exec.safeBinProfiles.<bin>`에 명시적 프로필을 정의해야 합니다.
검증은 argv 형태만으로 결정적으로 수행되며(호스트 파일시스템 존재 여부 검사는 없음), 이는 허용/거부 차이로부터 파일 존재 oracle 동작이 생기는 것을 방지합니다.
파일 지향 옵션은 기본 safe bin에서 거부됩니다(예: `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
safe bin은 또한 stdin 전용 동작을 깨뜨리는 옵션에 대해 바이너리별 명시적 플래그 정책을 강제합니다(예: `sort -o/--output/--compress-program` 및 grep 재귀 플래그).
긴 옵션은 safe-bin 모드에서 fail-closed 방식으로 검증됩니다. 알 수 없는 플래그와 모호한 축약형은 거부됩니다.
safe-bin 프로필별 거부 플래그:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

safe bin은 실행 시 argv 토큰도 **리터럴 텍스트**로 처리되도록 강제합니다(stdin 전용 세그먼트에 대해 glob 확장과 `$VARS` 확장 없음). 따라서 `*` 또는 `$HOME/...` 같은 패턴을 이용해 파일 읽기를 몰래 수행할 수 없습니다.
safe bin은 신뢰된 바이너리 디렉터리(시스템 기본값 + 선택적 `tools.exec.safeBinTrustedDirs`)에서 해석되어야 합니다. `PATH` 항목은 자동으로 신뢰되지 않습니다.
기본 신뢰 safe-bin 디렉터리는 의도적으로 최소화되어 있습니다: `/bin`, `/usr/bin`.
safe-bin 실행 파일이 패키지 관리자/사용자 경로(예: `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`)에 있다면, 이를 `tools.exec.safeBinTrustedDirs`에 명시적으로 추가하세요.
allowlist 모드에서는 셸 체이닝과 리다이렉션이 자동 허용되지 않습니다.

셸 체이닝(`&&`, `||`, `;`)은 모든 최상위 세그먼트가 허용 목록을 만족할 때 허용됩니다(safe bin 또는 skill 자동 허용 포함). 리다이렉션은 allowlist 모드에서 여전히 지원되지 않습니다.
명령 치환(`$()` / 백틱)은 allowlist 파싱 중 거부되며, 큰따옴표 안도 포함됩니다. 리터럴 `$()` 텍스트가 필요하다면 작은따옴표를 사용하세요.
macOS companion-app 승인에서는 셸 제어 또는 확장 문법(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)이 포함된 raw 셸 텍스트는 셸 바이너리 자체가 허용 목록에 없는 한 allowlist miss로 처리됩니다.
셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우, 요청 범위 env 재정의는 작은 명시적 허용 목록(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)으로 축소됩니다.
allowlist 모드에서 allow-always 결정을 할 때, 알려진 디스패치 래퍼(`env`, `nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로 대신 내부 실행 파일 경로를 저장합니다. 셸 멀티플렉서(`busybox`, `toybox`)도 셸 applet(`sh`, `ash` 등)에 대해서는 언랩되어 멀티플렉서 바이너리 대신 내부 실행 파일이 저장됩니다. 래퍼 또는 멀티플렉서를 안전하게 언랩할 수 없으면 허용 목록 항목은 자동으로 저장되지 않습니다.
`python3` 또는 `node` 같은 인터프리터를 허용 목록에 넣는다면, 인라인 eval에 여전히 명시적 승인이 필요하도록 `tools.exec.strictInlineEval=true`를 권장합니다. strict 모드에서는 `allow-always`가 무해한 인터프리터/스크립트 호출은 계속 저장할 수 있지만, 인라인 eval 운반자는 자동 저장되지 않습니다.

기본 safe bin:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep`와 `sort`는 기본 목록에 포함되지 않습니다. 이를 옵트인하는 경우, stdin 이외 워크플로에는 명시적 허용 목록 항목을 유지하세요.
safe-bin 모드에서 `grep`의 경우 패턴은 `-e`/`--regexp`로 제공해야 합니다. 위치 기반 패턴 형식은 파일 피연산자가 모호한 위치 인수로 몰래 들어오는 것을 막기 위해 거부됩니다.

### safe bin과 허용 목록 비교

| 주제             | `tools.exec.safeBins`                                  | 허용 목록(`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| 목표             | 좁은 stdin 필터 자동 허용                              | 특정 실행 파일을 명시적으로 신뢰                            |
| 일치 유형        | 실행 파일 이름 + safe-bin argv 정책                    | 해석된 실행 파일 경로 glob 패턴                             |
| 인수 범위        | safe-bin 프로필과 리터럴 토큰 규칙으로 제한            | 경로 일치만 확인, 인수는 그 외에 사용자가 책임짐            |
| 일반적 예시      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 사용자 지정 CLI          |
| 가장 적합한 용도 | 파이프라인 내 저위험 텍스트 변환                       | 더 넓은 동작 또는 부작용이 있는 모든 도구                   |

구성 위치:

- `safeBins`는 config(`tools.exec.safeBins` 또는 에이전트별 `agents.list[].tools.exec.safeBins`)에서 가져옵니다.
- `safeBinTrustedDirs`는 config(`tools.exec.safeBinTrustedDirs` 또는 에이전트별 `agents.list[].tools.exec.safeBinTrustedDirs`)에서 가져옵니다.
- `safeBinProfiles`는 config(`tools.exec.safeBinProfiles` 또는 에이전트별 `agents.list[].tools.exec.safeBinProfiles`)에서 가져옵니다. 에이전트별 프로필 키는 전역 키보다 우선합니다.
- 허용 목록 항목은 호스트 로컬 `~/.openclaw/exec-approvals.json`의 `agents.<id>.allowlist` 아래에 저장됩니다(또는 Control UI / `openclaw approvals allowlist ...` 사용).
- `openclaw security audit`는 interpreter/runtime bin이 명시적 프로필 없이 `safeBins`에 나타나면 `tools.exec.safe_bins_interpreter_unprofiled`로 경고합니다.
- `openclaw doctor --fix`는 누락된 사용자 지정 `safeBinProfiles.<bin>` 항목을 `{}`로 스캐폴드할 수 있습니다(이후 검토하고 더 엄격하게 조이세요). interpreter/runtime bin은 자동 스캐폴드되지 않습니다.

사용자 지정 프로필 예시:
__OC_I18N_900005__
`jq`를 `safeBins`에 명시적으로 옵트인하더라도, OpenClaw는 safe-bin 모드에서 여전히 `env` 내장 함수를 거부하므로, `jq -n env`가 명시적 허용 목록 경로나 승인 프롬프트 없이 호스트 프로세스 환경을 덤프할 수 없습니다.

## Control UI 편집

**Control UI → Nodes → Exec approvals** 카드에서 기본값, 에이전트별 재정의, 허용 목록을 편집하세요. 범위(기본값 또는 에이전트)를 선택하고 정책을 조정한 뒤, 허용 목록 패턴을 추가/제거하고 **Save**를 누르세요. UI는 패턴별 **마지막 사용** 메타데이터를 보여주므로 목록을 깔끔하게 유지할 수 있습니다.

대상 선택기는 **Gateway**(로컬 승인) 또는 **Node**를 선택합니다. Node는 `system.execApprovals.get/set`을 광고해야 합니다(macOS app 또는 headless node host).
node가 아직 exec 승인을 광고하지 않는다면, 해당 로컬 `~/.openclaw/exec-approvals.json`을 직접 편집하세요.

CLI: `openclaw approvals`는 gateway 또는 node 편집을 지원합니다([Approvals CLI](/cli/approvals) 참조).

## 승인 흐름

프롬프트가 필요하면 gateway는 `exec.approval.requested`를 운영자 클라이언트에 브로드캐스트합니다.
Control UI와 macOS app은 이를 `exec.approval.resolve`로 해결하고, 이후 gateway가 승인된 요청을 node host로 전달합니다.

`host=node`의 경우, 승인 요청에는 정식 `systemRunPlan` 페이로드가 포함됩니다. gateway는 승인된 `system.run` 요청을 전달할 때 이 계획을 권위 있는 명령/cwd/세션 컨텍스트로 사용합니다.

이것은 비동기 승인 지연 시간에서 중요합니다.

- node exec 경로는 미리 하나의 정식 계획을 준비합니다.
- 승인 레코드는 해당 계획과 바인딩 메타데이터를 저장합니다.
- 승인되면 최종 전달되는 `system.run` 호출은 이후 호출자 수정 내용을 신뢰하지 않고 저장된 계획을 재사용합니다.
- 승인 요청이 생성된 뒤 호출자가 `command`, `rawCommand`, `cwd`, `agentId`, `sessionKey`를 변경하면 gateway는 그 전달 실행을 승인 불일치로 거부합니다.

## 인터프리터/런타임 명령

승인 기반 인터프리터/런타임 실행은 의도적으로 보수적입니다.

- 정확한 argv/cwd/env 컨텍스트는 항상 바인드됩니다.
- 직접 셸 스크립트 및 직접 런타임 파일 형식은 best-effort 방식으로 하나의 구체적인 로컬 파일 스냅샷에 바인드됩니다.
- 여전히 하나의 직접 로컬 파일로 해석되는 일반적인 패키지 관리자 래퍼 형식(예: `pnpm exec`, `pnpm node`, `npm exec`, `npx`)은 바인딩 전에 언랩됩니다.
- OpenClaw가 인터프리터/런타임 명령에 대해 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면(예: 패키지 스크립트, eval 형식, 런타임별 로더 체인, 또는 모호한 다중 파일 형식), 의미적 커버리지를 주장하는 대신 승인 기반 실행을 거부합니다.
- 이러한 워크플로에는 샌드박싱, 별도의 호스트 경계, 또는 운영자가 더 넓은 런타임 의미를 수용하는 명시적 신뢰 allowlist/full 워크플로를 선호하세요.

승인이 필요할 때 exec tool은 즉시 승인 ID와 함께 반환됩니다. 이 ID를 사용해 이후 시스템 이벤트(`Exec finished` / `Exec denied`)와 연관시키세요. 시간 제한 전에 결정이 도착하지 않으면, 요청은 승인 타임아웃으로 처리되고 거부 사유로 표시됩니다.

### 후속 전달 동작

승인된 비동기 exec가 완료된 뒤 OpenClaw는 같은 세션으로 후속 `agent` 턴을 보냅니다.

- 유효한 외부 전달 대상(전달 가능한 채널 + 대상 `to`)이 있으면, 후속 전달은 해당 채널을 사용합니다.
- 외부 대상이 없는 webchat 전용 또는 내부 세션 흐름에서는 후속 전달이 세션 전용(`deliver: false`)으로 유지됩니다.
- 호출자가 해석 가능한 외부 채널 없이 엄격한 외부 전달을 명시적으로 요청하면, 요청은 `INVALID_REQUEST`로 실패합니다.
- `bestEffortDeliver`가 활성화되어 있고 외부 채널을 해석할 수 없으면, 전달은 실패 대신 세션 전용으로 다운그레이드됩니다.

확인 대화상자에는 다음이 포함됩니다.

- 명령 + 인수
- cwd
- 에이전트 ID
- 해석된 실행 파일 경로
- 호스트 + 정책 메타데이터

동작:

- **Allow once** → 지금 실행
- **Always allow** → 허용 목록에 추가 + 실행
- **Deny** → 차단

## 채팅 채널로 승인 전달

exec 승인 프롬프트를 모든 채팅 채널(plugin 채널 포함)로 전달하고 `/approve`로 승인할 수 있습니다. 이 기능은 일반 외부 전달 파이프라인을 사용합니다.

구성:
__OC_I18N_900006__
채팅에서 응답:
__OC_I18N_900007__
`/approve` 명령은 exec 승인과 plugin 승인을 모두 처리합니다. ID가 대기 중인 exec 승인과 일치하지 않으면 자동으로 plugin 승인을 확인합니다.

### Plugin 승인 전달

plugin 승인 전달은 exec 승인과 동일한 전달 파이프라인을 사용하지만, `approvals.plugin` 아래의 독립적인 구성을 가집니다. 하나를 활성화하거나 비활성화해도 다른 하나에는 영향을 주지 않습니다.
__OC_I18N_900008__
구성 형태는 `approvals.exec`와 동일합니다. `enabled`, `mode`, `agentFilter`, `sessionFilter`, `targets`가 같은 방식으로 동작합니다.

공유 대화형 응답을 지원하는 채널은 exec 및 plugin 승인 모두에 대해 동일한 승인 버튼을 렌더링합니다. 공유 대화형 UI가 없는 채널은 `/approve` 안내가 있는 일반 텍스트로 폴백합니다.

### 모든 채널의 동일 채팅 승인

exec 또는 plugin 승인 요청이 전달 가능한 채팅 표면에서 시작되면, 이제 같은 채팅에서 기본적으로 `/approve`로 승인할 수 있습니다. 이는 기존 Web UI 및 터미널 UI 흐름 외에도 Slack, Matrix, Microsoft Teams 같은 채널에 적용됩니다.

이 공유 텍스트 명령 경로는 해당 대화의 일반 채널 인증 모델을 사용합니다. 시작된 채팅에서 이미 명령을 보내고 응답을 받을 수 있다면, 승인 요청은 더 이상 대기 상태를 유지하기 위해 별도의 기본 전달 어댑터가 필요하지 않습니다.

Discord와 Telegram도 동일 채팅 `/approve`를 지원하지만, 해당 채널은 기본 승인 전달이 비활성화되어 있더라도 여전히 해석된 approver 목록을 권한 부여에 사용합니다.

Telegram 및 Gateway를 직접 호출하는 다른 기본 승인 클라이언트의 경우, 이 폴백은 의도적으로 "approval not found" 실패에만 제한됩니다. 실제 exec 승인 거부/오류는 조용히 plugin 승인으로 재시도되지 않습니다.

### 기본 승인 전달

일부 채널은 기본 승인 클라이언트로도 동작할 수 있습니다. 기본 클라이언트는 공유 동일 채팅 `/approve` 흐름 위에 approver DM, origin-chat fanout, 채널별 대화형 승인 UX를 추가합니다.

기본 승인 카드/버튼을 사용할 수 있을 때는, 그 기본 UI가 에이전트가 마주하는 주된 경로입니다. 도구 결과가 채팅 승인을 사용할 수 없다고 하거나 수동 승인만 유일하게 남은 경로라고 하지 않는 한, 에이전트는 중복된 일반 채팅 `/approve` 명령도 함께 반복해서 보여주면 안 됩니다.

일반 모델:

- 호스트 exec 정책은 여전히 exec 승인이 필요한지 여부를 결정합니다.
- `approvals.exec`는 승인 프롬프트를 다른 채팅 대상으로 전달할지 제어합니다.
- `channels.<channel>.execApprovals`는 해당 채널이 기본 승인 클라이언트로 동작할지 제어합니다.

기본 승인 클라이언트는 다음이 모두 참일 때 approver DM 우선 전달을 자동 활성화합니다.

- 채널이 기본 승인 전달을 지원함
- 명시적 `execApprovals.approvers` 또는 해당 채널의 문서화된 폴백 소스에서 approver를 해석할 수 있음
- `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`임

기본 승인 클라이언트를 명시적으로 비활성화하려면 `enabled: false`를 설정하세요. approver가 해석될 때 강제로 켜려면 `enabled: true`를 설정하세요. 공개 origin-chat 전달은 계속 `channels.<channel>.execApprovals.target`을 통해 명시적으로 유지됩니다.

FAQ: [채팅 승인을 위한 exec 승인 config가 왜 두 개인가요?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

이 기본 승인 클라이언트는 공유 동일 채팅 `/approve` 흐름과 공유 승인 버튼 위에 DM 라우팅 및 선택적 채널 fanout을 추가합니다.

공유 동작:

- Slack, Matrix, Microsoft Teams 및 유사한 전달 가능한 채팅은 동일 채팅 `/approve`에 대해 일반 채널 인증 모델을 사용합니다.
- 기본 승인 클라이언트가 자동 활성화되면, 기본 기본 전달 대상은 approver DM입니다.
- Discord와 Telegram에서는 해석된 approver만 승인 또는 거부할 수 있습니다.
- Discord approver는 명시적(`execApprovals.approvers`)이거나 `commands.ownerAllowFrom`에서 추론될 수 있습니다.
- Telegram approver는 명시적(`execApprovals.approvers`)이거나 기존 owner config(`allowFrom`, 그리고 지원되는 경우 direct-message `defaultTo`)에서 추론될 수 있습니다.
- Slack approver는 명시적(`execApprovals.approvers`)이거나 `commands.ownerAllowFrom`에서 추론될 수 있습니다.
- Slack 기본 버튼은 승인 ID 종류를 보존하므로, `plugin:` ID는 두 번째 Slack 로컬 폴백 계층 없이 plugin 승인을 해석할 수 있습니다.
- Matrix 기본 DM/채널 라우팅과 반응 단축키는 exec 및 plugin 승인을 모두 처리합니다. plugin 권한 부여는 여전히 `channels.matrix.dm.allowFrom`에서 옵니다.
- 요청자는 approver일 필요가 없습니다.
- 시작된 채팅이 이미 명령과 응답을 지원한다면, originating chat에서 직접 `/approve`로 승인할 수 있습니다.
- 기본 Discord 승인 버튼은 승인 ID 종류로 라우팅합니다. `plugin:` ID는 바로 plugin 승인으로 가고, 그 외는 모두 exec 승인으로 갑니다.
- 기본 Telegram 승인 버튼은 `/approve`와 동일한 제한된 exec→plugin 폴백을 따릅니다.
- 기본 `target`이 origin-chat 전달을 활성화하면, 승인 프롬프트에는 명령 텍스트가 포함됩니다.
- 대기 중인 exec 승인은 기본적으로 30분 후 만료됩니다.
- 운영자 UI 또는 구성된 승인 클라이언트가 요청을 받을 수 없으면, 프롬프트는 `askFallback`으로 폴백합니다.

Telegram은 기본적으로 approver DM(`target: "dm"`)을 사용합니다. 승인 프롬프트가 시작된 Telegram 채팅/토픽에도 나타나게 하려면 `channel` 또는 `both`로 전환할 수 있습니다. Telegram 포럼 토픽의 경우, OpenClaw는 승인 프롬프트와 승인 후 후속 응답 모두에 대해 토픽을 유지합니다.

참조:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 흐름
__OC_I18N_900009__
보안 참고:

- Unix 소켓 모드 `0600`, 토큰은 `exec-approvals.json`에 저장됨
- 동일 UID 피어 검사
- 챌린지/응답(nonce + HMAC 토큰 + 요청 해시) + 짧은 TTL

## 시스템 이벤트

exec 수명 주기는 시스템 메시지로 표시됩니다.

- `Exec running`(명령이 실행 중 알림 임계값을 초과하는 경우에만)
- `Exec finished`
- `Exec denied`

이 메시지들은 node가 이벤트를 보고한 후 에이전트 세션에 게시됩니다.
gateway-host exec 승인도 명령이 끝나면(그리고 선택적으로 임계값보다 오래 실행되면 실행 중일 때도) 동일한 수명 주기 이벤트를 발생시킵니다.
승인 게이트가 있는 exec는 쉬운 연관을 위해 이 메시지들에서 승인 ID를 `runId`로 재사용합니다.

## 승인 거부 동작

비동기 exec 승인이 거부되면, OpenClaw는 에이전트가 세션에서 같은 명령의 이전 실행 출력을 재사용하지 못하게 합니다. 거부 사유는 사용 가능한 명령 출력이 없다는 명시적 안내와 함께 전달되며, 이것은 에이전트가 새 출력이 있는 것처럼 주장하거나 이전의 성공한 실행에서 나온 오래된 결과를 가지고 거부된 명령을 반복하는 일을 막습니다.

## 의미

- **full**은 강력하므로, 가능하면 허용 목록을 선호하세요.
- **ask**를 사용하면 빠른 승인을 허용하면서도 사용자가 계속 관여할 수 있습니다.
- 에이전트별 허용 목록은 한 에이전트의 승인이 다른 에이전트로 새는 것을 막습니다.
- 승인은 **권한 있는 발신자**의 호스트 exec 요청에만 적용됩니다. 권한 없는 발신자는 `/exec`를 발행할 수 없습니다.
- `/exec security=full`은 권한 있는 운영자를 위한 세션 수준 편의 기능이며, 설계상 승인을 건너뜁니다.
  호스트 exec를 강제로 차단하려면 승인 보안을 `deny`로 설정하거나 도구 정책을 통해 `exec` tool을 거부하세요.

관련 문서:

- [Exec tool](/ko/tools/exec)
- [Elevated mode](/ko/tools/elevated)
- [Skills](/ko/tools/skills)

## 관련

- [Exec](/ko/tools/exec) — 셸 명령 실행 도구
- [Sandboxing](/ko/gateway/sandboxing) — 샌드박스 모드와 워크스페이스 접근
- [Security](/ko/gateway/security) — 보안 모델과 하드닝
- [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) — 각각을 언제 사용할지
