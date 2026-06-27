---
read_when:
    - 연결/인증 문제가 있어 안내에 따라 수정하려는 경우
    - 업데이트한 후 간단한 점검을 원함
summary: '`openclaw doctor`에 대한 CLI 참조(상태 점검 + 안내식 복구)'
title: Doctor
x-i18n:
    generated_at: "2026-06-27T17:17:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway와 채널을 위한 상태 검사 + 빠른 수정.

관련 항목:

- 문제 해결: [문제 해결](/ko/gateway/troubleshooting)
- 보안 감사: [보안](/ko/gateway/security)

## 사용하는 이유

`openclaw doctor`는 OpenClaw의 상태 점검 표면입니다. Gateway,
채널, Plugin, Skills, 모델 라우팅, 로컬 상태 또는 설정 마이그레이션이
예상대로 동작하지 않을 때 무엇이 잘못되었는지 설명해 줄 수 있는
단일 명령이 필요하면 사용하세요.

doctor에는 세 가지 자세가 있습니다.

| 자세 | 명령                  | 동작                                                                        |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| 검사 | `openclaw doctor`        | 사람 중심의 검사와 안내형 프롬프트.                                       |
| 복구  | `openclaw doctor --fix`  | 지원되는 복구를 적용하며, 비대화형 복구가 안전하지 않으면 프롬프트를 사용합니다. |
| 린트    | `openclaw doctor --lint` | CI, 사전 점검, 리뷰 게이트를 위한 읽기 전용 구조화된 발견 사항.              |

자동화에 안정적인 결과가 필요하면 `--lint`를 선호하세요. 사람이 명시적으로
doctor가 설정 또는 상태를 편집하기를 원할 때는 `--fix`를 선호하세요.

## 예시

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

채널별 권한에는 `doctor` 대신 채널 프로브를 사용하세요.

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

대상 지정 Discord 기능 프로브는 봇의 유효 채널 권한을 보고하며, 상태 프로브는 구성된 Discord 채널과 음성 자동 참여 대상을 감사합니다.

## 옵션

- `--no-workspace-suggestions`: 워크스페이스 메모리/검색 제안 비활성화
- `--yes`: 프롬프트 없이 기본값 수락
- `--repair`: 프롬프트 없이 권장되는 비서비스 복구 적용. Gateway 서비스 설치와 재작성에는 여전히 대화형 확인 또는 명시적 Gateway 명령이 필요합니다
- `--fix`: `--repair`의 별칭
- `--force`: 필요할 때 사용자 지정 서비스 설정을 덮어쓰는 것을 포함하여 공격적인 복구 적용
- `--non-interactive`: 프롬프트 없이 실행. 안전한 마이그레이션과 비서비스 복구만 수행
- `--generate-gateway-token`: Gateway 토큰 생성 및 구성
- `--allow-exec`: SecretRefs를 검증하는 동안 doctor가 구성된 exec SecretRefs를 실행하도록 허용
- `--deep`: 추가 Gateway 설치를 찾기 위해 시스템 서비스를 스캔하고 최근 Gateway supervisor 재시작 인계를 보고
- `--lint`: 현대화된 상태 검사를 읽기 전용 모드로 실행하고 진단 발견 사항 출력
- `--post-upgrade`: 업그레이드 후 Plugin 호환성 프로브 실행. 발견 사항을 stdout으로 출력하며, error 수준 발견 사항이 있으면 코드 1로 종료
- `--json`: `--lint`와 함께 사용하면 사람용 출력 대신 JSON 발견 사항을 출력하고, `--post-upgrade`와 함께 사용하면 기계가 읽을 수 있는 JSON 봉투(`{ probesRun, findings }`)를 출력
- `--severity-min <level>`: `--lint`와 함께 사용하면 `info`, `warning`, 또는 `error`보다 낮은 발견 사항을 제외
- `--all`: `--lint`와 함께 사용하면 기본 자동화 세트에서 제외된 옵트인 검사를 포함해 등록된 모든 검사를 실행
- `--skip <id>`: `--lint`와 함께 사용하면 검사 id를 건너뜀. 둘 이상 건너뛰려면 반복 사용
- `--only <id>`: `--lint`와 함께 사용하면 검사 id 하나만 실행. 작은 선택 세트를 실행하려면 반복 사용

## 린트 모드

`openclaw doctor --lint`는 doctor 검사를 위한 읽기 전용 자동화 자세입니다.
구조화된 상태 검사 경로를 사용하고, 프롬프트를 표시하지 않으며, 설정/상태를
복구하거나 재작성하지 않습니다. 안내형 복구 프롬프트 대신 기계가 읽을 수 있는
발견 사항이 필요할 때 CI, 사전 점검 스크립트, 리뷰 워크플로에서 사용하세요.
`--json`, `--severity-min`, `--all`, `--only`, `--skip` 같은 린트 출력 옵션은
`--lint`와 함께만 허용됩니다.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

사람용 출력은 간결합니다.

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON 출력은 린트 실행을 위한 스크립팅 표면입니다.

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

종료 동작:

- `0`: 선택한 심각도 임계값 이상에 해당하는 발견 사항 없음
- `1`: 하나 이상의 발견 사항이 선택한 임계값을 충족
- `2`: 린트 발견 사항을 생성하기 전 명령/런타임 실패

`--severity-min`은 표시되는 발견 사항과 종료 임계값을 모두 제어합니다. 예를 들어
`openclaw doctor --lint --severity-min error`는 더 낮은 심각도의 `info` 또는
`warning` 발견 사항이 있더라도 발견 사항을 출력하지 않고 `0`으로 종료할 수 있습니다.

`--all`은 심각도 필터링 전에 어떤 검사를 선택할지 제어합니다. 기본 린트 실행은
안정적인 자동화 게이트이며, 깊거나, 과거 이력과 관련되었거나, 복구 가능한 레거시
잔여물을 드러낼 가능성이 더 커서 의도적으로 옵트인으로 둔 검사를 제외합니다.
각 검사 id를 나열하지 않고 전체 린트 인벤토리가 필요할 때 `--all`을 사용하세요.
`--only <id>`는 가장 정밀한 선택자로 남아 있으며 등록된 모든 검사를 id로 실행할 수 있습니다.

## 구조화된 상태 검사

최신 doctor 검사는 작은 구조화된 계약을 사용합니다.

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()`는 `doctor --lint`를 구동합니다. `repair()`는 선택 사항이며
`doctor --fix` / `doctor --repair`에서만 고려됩니다. 아직 이 형태로
마이그레이션하지 않은 검사는 레거시 doctor 기여 흐름을 계속 사용합니다.

이 분리는 의도적입니다. `detect()`는 진단을 소유하고, `repair()`는
무엇을 변경했거나 변경할 것인지 보고하는 책임을 집니다. 복구 컨텍스트는
`dryRun`/`diff` 요청을 전달할 수 있고, 복구 결과는 설정/파일 편집을 위한
구조화된 `diffs`와 서비스, 프로세스, 패키지, 상태 또는 기타 부작용을 위한
`effects`를 반환할 수 있습니다. 이를 통해 변환된 검사는 변경 계획을
`detect()`로 옮기지 않고도 `doctor --fix --dry-run` 및 diff 보고 쪽으로
성장할 수 있습니다.

`repair()`는 요청된 복구를 시도했는지 여부를 `status:
"repaired" | "skipped" | "failed"`로 보고합니다. 상태가 생략되면 `repaired`를
의미하므로, 단순한 복구 검사는 변경 사항만 반환하면 됩니다. 복구가 `skipped`
또는 `failed`를 반환하면 doctor는 이유를 보고하고 해당 검사에 대한 검증을 실행하지 않습니다.

구조화된 복구가 성공한 뒤 doctor는 복구된 발견 사항을 범위로 사용하여 `detect()`를
다시 실행합니다. 검사는 선택된 발견 사항, 경로 또는 `ocPath` 값을 사용해
집중 검증을 수행할 수 있습니다. 발견 사항이 여전히 존재하면 doctor는 변경을
조용히 완료된 것으로 처리하지 않고 복구 경고를 보고합니다.

발견 사항에는 다음이 포함됩니다.

| 필드             | 목적                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | 건너뛰기/선택 필터와 CI 허용 목록을 위한 안정적인 id.     |
| `severity`        | `info`, `warning`, 또는 `error`.                         |
| `message`         | 사람이 읽을 수 있는 문제 설명.                      |
| `path`            | 사용 가능한 경우 설정, 파일 또는 논리 경로.          |
| `line` / `column` | 사용 가능한 경우 소스 위치.                        |
| `ocPath`          | 검사가 하나를 가리킬 수 있을 때의 정밀한 `oc://` 주소. |
| `fixHint`         | 제안된 운영자 조치 또는 복구 요약.           |

현대화된 핵심 doctor 검사는 사람용 `doctor` / `doctor --fix` 동작을 소유하는
순서가 있는 doctor 기여에 계속 연결됩니다. 공유 구조화 상태 레지스트리는 확장
지점입니다. 번들 및 Plugin 기반 검사는 해당 소유 패키지가 활성 명령 경로에
등록한 뒤 핵심 doctor 검사 이후에 실행됩니다. `openclaw/plugin-sdk/health`
하위 경로는 이러한 확장 소비자에게 동일한 계약을 노출합니다.

## 검사 선택

워크플로에 집중된 게이트가 필요할 때 `--only`와 `--skip`을 사용하세요.

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only`와 `--skip`은 전체 검사 id를 받으며 반복해서 사용할 수 있습니다.
`--only` id가 등록되어 있지 않으면 해당 id에 대해 어떤 검사도 실행되지 않습니다.
집중 게이트가 예상한 검사를 선택하고 있는지 확인하려면 명령의 `checksRun` 및
`checksSkipped` 필드를 사용하세요.

## 업그레이드 후 모드

`openclaw doctor --post-upgrade`는 빌드 또는 업그레이드 뒤에 연결해 실행하기 위한
Plugin 호환성 프로브를 실행합니다. 발견 사항은 stdout으로 출력됩니다. 어떤 발견 사항이든
`level: "error"`를 가지면 명령은 코드 1로 종료됩니다. CI, 커뮤니티
`fork-upgrade` skill, 기타 업그레이드 후 스모크 도구에 적합한 기계가 읽을 수 있는
봉투(`{ probesRun, findings }`)를 받으려면 `--json`을 추가하세요. 설치된 Plugin
인덱스가 없거나 형식이 잘못된 경우에도 JSON 모드는 `plugin.index_unavailable`
오류 발견 사항과 함께 해당 봉투를 출력합니다.

참고:

- Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 읽기 전용 doctor 검사가 계속 작동하지만, `openclaw.json`이 변경 불가능하므로 `doctor --fix`, `doctor --repair`, `doctor --yes`, `doctor --generate-gateway-token`은 비활성화됩니다. 대신 이 설치의 Nix 소스를 편집하세요. nix-openclaw의 경우 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하세요.
- 대화형 프롬프트(키체인/OAuth 수정 등)는 stdin이 TTY이고 `--non-interactive`가 설정되지 않은 경우에만 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)은 프롬프트를 건너뜁니다.
- 성능: 비대화형 `doctor` 실행은 헤드리스 상태 검사가 빠르게 유지되도록 적극적인 plugin 로딩을 건너뜁니다. 대화형 doctor 세션은 레거시 상태 확인 및 복구 흐름에 필요한 plugin 표면을 계속 로드합니다.
- `--lint`는 `--non-interactive`보다 더 엄격합니다. 항상 읽기 전용이고, 프롬프트를 표시하지 않으며, 안전한 마이그레이션도 적용하지 않습니다. doctor가 변경을 수행하게 하려면 `doctor --fix` 또는 `doctor --repair`를 실행하세요.
- 기본적으로 doctor는 시크릿을 검사하는 동안 `exec` SecretRefs를 실행하지 않습니다. doctor가 구성된 해당 시크릿 리졸버를 실행하기를 의도적으로 원하는 경우에만 `openclaw doctor --allow-exec` 또는 `openclaw doctor --lint --allow-exec`를 사용하세요.
- `--fix`(`--repair`의 별칭)는 백업을 `~/.openclaw/openclaw.json.bak`에 쓰고 알 수 없는 구성 키를 제거하며, 각 제거 항목을 나열합니다.
- 현대화된 상태 검사는 `doctor --fix`를 위한 `repair()` 경로를 노출할 수 있습니다. 이를 노출하지 않는 검사는 기존 doctor 복구 흐름을 계속 사용합니다.
- `doctor --fix --non-interactive`는 누락되었거나 오래된 Gateway 서비스 정의를 보고하지만, 업데이트 복구 모드 밖에서는 이를 설치하거나 다시 쓰지 않습니다. 서비스가 누락된 경우 `openclaw gateway install`을 실행하고, 런처를 의도적으로 교체하려는 경우 `openclaw gateway install --force`를 실행하세요.
- 상태 무결성 검사는 이제 세션 디렉터리의 고아 transcript 파일을 감지합니다. 이를 `.deleted.<timestamp>`로 보관하려면 대화형 확인이 필요합니다. `--fix`, `--yes`, 헤드리스 실행은 파일을 그대로 둡니다.
- doctor는 또한 레거시 cron 작업 형태를 찾기 위해 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)을 스캔하고, 표준 행을 SQLite로 가져오기 전에 이를 다시 씁니다.
- doctor는 명시적인 `payload.model` 재정의가 있는 cron 작업을 보고하며, provider 네임스페이스 수와 `agents.defaults.model`과의 불일치를 포함합니다. 그래서 기본 모델을 상속하지 않는 예약 작업을 인증 또는 청구 조사 중에 확인할 수 있습니다.
- Linux에서 doctor는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 실행할 때 경고합니다. 해당 스크립트는 더 이상 유지 관리되지 않으며, cron에 systemd 사용자 버스 환경이 없을 때 잘못된 WhatsApp Gateway 장애를 로그로 남길 수 있습니다.
- WhatsApp이 활성화된 경우 doctor는 로컬 `openclaw-tui` 클라이언트가 계속 실행 중인 상태에서 성능이 저하된 Gateway 이벤트 루프가 있는지 확인합니다. `doctor --fix`는 검증된 로컬 TUI 클라이언트만 중지하므로 WhatsApp 응답이 오래된 TUI 새로고침 루프 뒤에 대기열로 쌓이지 않습니다.
- doctor는 기본 모델, fallback, 이미지/동영상 생성 모델, heartbeat/subagent/compaction 재정의, hook, 채널 모델 재정의, 오래된 세션 경로 고정 전반에서 레거시 `openai-codex/*` 모델 참조를 표준 `openai/*` 참조로 다시 씁니다. `--fix`는 또한 레거시 `openai-codex:*` 인증 프로필과 `auth.order.openai-codex` 항목을 `openai:*`로 마이그레이션하고, Codex 의도를 provider/model 범위의 `agentRuntime.id: "codex"` 항목으로 옮기며, 오래된 전체 에이전트/세션 런타임 고정을 제거하고, 복구된 OpenAI 에이전트 참조를 직접 OpenAI API 키 인증 대신 Codex 인증 라우팅에 유지합니다.
- doctor는 이전 OpenClaw 버전에서 생성된 레거시 plugin 의존성 스테이징 상태를 정리하고, 이를 peer dependency로 선언한 관리형 npm plugin에 대해 호스트 `openclaw` 패키지를 다시 연결합니다. 또한 `plugins.entries`, 구성된 채널, 구성된 provider/검색 설정 또는 구성된 에이전트 런타임처럼 구성에서 참조되는 누락된 다운로드 가능 plugin도 복구합니다. 패키지 업데이트 중에는 doctor가 패키지 교체가 완료될 때까지 package-manager plugin 복구를 건너뜁니다. 구성된 plugin에 여전히 복구가 필요하면 이후 `openclaw doctor --fix`를 다시 실행하세요. 다운로드가 실패하면 doctor는 설치 오류를 보고하고 다음 복구 시도를 위해 구성된 plugin 항목을 보존합니다.
- doctor는 plugin 발견이 정상일 때 `plugins.allow`/`plugins.deny`/`plugins.entries`에서 누락된 plugin id를 제거하고, 일치하는 dangling 채널 구성, heartbeat 대상, 채널 모델 재정의도 함께 제거하여 오래된 plugin 구성을 복구합니다.
- doctor는 영향을 받은 `plugins.entries.<id>` 항목을 비활성화하고 잘못된 `config` payload를 제거하여 유효하지 않은 plugin 구성을 격리합니다. Gateway 시작은 이미 해당 잘못된 plugin만 건너뛰므로 다른 plugin과 채널은 계속 실행될 수 있습니다.
- 다른 supervisor가 Gateway 수명 주기를 소유할 때는 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요. doctor는 여전히 Gateway/서비스 상태를 보고하고 비서비스 복구를 적용하지만, 서비스 설치/시작/재시작/bootstrap 및 레거시 서비스 정리는 건너뜁니다.
- Linux에서 doctor는 비활성 추가 Gateway 유사 systemd unit을 무시하고, 복구 중 실행 중인 systemd Gateway 서비스의 command/entrypoint metadata를 다시 쓰지 않습니다. 활성 런처를 의도적으로 교체하려면 먼저 서비스를 중지하거나 `openclaw gateway install --force`를 사용하세요.
- doctor는 레거시 평면 Talk 구성(`talk.voiceId`, `talk.modelId` 등)을 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다.
- 반복적인 `doctor --fix` 실행은 유일한 차이가 객체 키 순서일 때 더 이상 Talk 정규화를 보고하거나 적용하지 않습니다.
- doctor는 메모리 검색 준비 상태 검사를 포함하며, embedding 자격 증명이 누락된 경우 `openclaw configure --section model`을 권장할 수 있습니다.
- doctor는 구성된 명령 소유자가 없을 때 경고합니다. 명령 소유자는 owner 전용 명령을 실행하고 위험한 작업을 승인할 수 있는 인간 운영자 계정입니다. DM 페어링은 누군가가 봇과 대화할 수 있게 해줄 뿐입니다. 첫 소유자 bootstrap이 생기기 전에 sender를 승인했다면 `commands.ownerAllowFrom`을 명시적으로 설정하세요.
- doctor는 Codex 모드 에이전트가 구성되어 있고 운영자의 Codex 홈에 개인 Codex CLI asset이 있을 때 정보 메모를 보고합니다. 로컬 Codex app-server 실행은 격리된 에이전트별 홈을 사용하므로, 필요한 경우 먼저 Codex plugin을 설치한 다음 `openclaw migrate plan codex`를 사용하여 의도적으로 승격해야 할 asset의 inventory를 작성하세요.
- doctor는 폐기된 `plugins.entries.codex.config.codexDynamicToolsProfile`을 제거합니다. Codex app-server는 항상 Codex 네이티브 workspace tool을 네이티브로 유지합니다.
- doctor는 기본 에이전트에 허용된 Skills가 bins, env vars, config 또는 OS 요구 사항 누락으로 인해 현재 런타임 환경에서 사용할 수 없을 때 경고합니다. `doctor --fix`는 사용할 수 없는 해당 Skills를 `skills.entries.<skill>.enabled=false`로 비활성화할 수 있습니다. Skill을 활성 상태로 유지하려면 대신 누락된 요구 사항을 설치/구성하세요.
- sandbox 모드가 활성화되었지만 Docker를 사용할 수 없는 경우 doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 신호가 높은 경고를 보고합니다.
- 레거시 sandbox registry 파일 또는 shard 디렉터리(`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/`, 또는 `~/.openclaw/sandbox/browsers/`)가 있으면 doctor가 이를 보고합니다. `openclaw doctor --fix`는 유효한 항목을 SQLite로 마이그레이션하고 유효하지 않은 레거시 파일을 격리합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되며 현재 명령 경로에서 사용할 수 없는 경우, doctor는 읽기 전용 경고를 보고하고 plaintext fallback 자격 증명을 쓰지 않습니다. exec-backed SecretRef의 경우 `--allow-exec`가 없으면 doctor는 실행을 건너뜁니다.
- fix 경로에서 채널 SecretRef 검사가 실패하면 doctor는 조기에 종료하지 않고 계속 진행하며 경고를 보고합니다.
- 상태 디렉터리 마이그레이션 후, 활성화된 기본 Telegram 또는 Discord 계정이 env fallback에 의존하고 `TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`을 doctor 프로세스에서 사용할 수 없을 때 doctor가 경고합니다.
- Telegram `allowFrom` 사용자 이름 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram token이 필요합니다. token 검사를 사용할 수 없으면 doctor는 경고를 보고하고 해당 실행의 자동 확인을 건너뜁니다.

## macOS: `launchctl` env 재정의

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)를 실행했다면, 해당 값이 구성 파일을 재정의하여 지속적인 "unauthorized" 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway doctor](/ko/gateway/doctor)
