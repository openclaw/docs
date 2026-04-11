---
read_when:
    - 문제 해결 허브에서 더 심층적인 진단을 위해 이 페이지로 안내했습니다
    - 정확한 명령어가 포함된 안정적인 증상별 런북 섹션이 필요합니다
summary: 게이트웨이, 채널, 자동화, 노드, 브라우저를 위한 심층 문제 해결 런북
title: 문제 해결
x-i18n:
    generated_at: "2026-04-11T02:45:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ef2faccba26ede307861504043a6415bc1f12dc64407771106f63ddc5b107f5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# 게이트웨이 문제 해결

이 페이지는 심층 런북입니다.
먼저 빠른 초기 분류 흐름이 필요하다면 [/help/troubleshooting](/ko/help/troubleshooting)에서 시작하세요.

## 명령어 단계별 점검

먼저 아래 명령어를 이 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 상태에서 기대되는 신호:

- `openclaw gateway status`에 `Runtime: running` 및 `RPC probe: ok`가 표시됩니다.
- `openclaw doctor`가 차단성 config/service 문제를 보고하지 않습니다.
- `openclaw channels status --probe`가 계정별 실제 전송 상태와,
  지원되는 경우 `works` 또는 `audit ok` 같은 probe/audit 결과를 표시합니다.

## 긴 컨텍스트에 추가 사용량이 필요한 Anthropic 429

로그/오류에 다음이 포함될 때 사용하세요.
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

다음을 확인하세요.

- 선택된 Anthropic Opus/Sonnet 모델에 `params.context1m: true`가 설정되어 있습니다.
- 현재 Anthropic 자격 증명이 긴 컨텍스트 사용 권한 대상이 아닙니다.
- 1M 베타 경로가 필요한 긴 세션/모델 실행에서만 요청이 실패합니다.

해결 방법:

1. 해당 모델의 `context1m`을 비활성화하여 일반 컨텍스트 창으로 폴백합니다.
2. 긴 컨텍스트 요청 권한이 있는 Anthropic 자격 증명을 사용하거나 Anthropic API 키로 전환합니다.
3. Anthropic 긴 컨텍스트 요청이 거부될 때도 실행이 계속되도록 폴백 모델을 구성합니다.

관련 문서:

- [/providers/anthropic](/ko/providers/anthropic)
- [/reference/token-use](/ko/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ko/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 로컬 OpenAI 호환 백엔드는 직접 probe는 통과하지만 에이전트 실행은 실패함

다음과 같은 경우에 사용하세요.

- `curl ... /v1/models`는 동작함
- 작은 직접 `/v1/chat/completions` 호출은 동작함
- OpenClaw 모델 실행은 일반적인 에이전트 턴에서만 실패함

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

다음을 확인하세요.

- 작은 직접 호출은 성공하지만, OpenClaw 실행은 더 큰 프롬프트에서만 실패함
- 백엔드 오류에 `messages[].content`가 문자열이어야 한다는 내용이 있음
- 더 큰 프롬프트 토큰 수 또는 전체 에이전트 런타임 프롬프트에서만 발생하는 백엔드 크래시

일반적인 징후:

- `messages[...].content: invalid type: sequence, expected a string` → 백엔드가 구조화된 Chat Completions content parts를 거부합니다. 해결: `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
- 작은 직접 요청은 성공하지만 OpenClaw 에이전트 실행은 백엔드/모델 크래시로 실패함(예: 일부 `inferrs` 빌드의 Gemma) → OpenClaw 전송 자체는 이미 올바를 가능성이 높고, 더 큰 에이전트 런타임 프롬프트 형태에서 백엔드가 실패하고 있는 것입니다.
- 도구를 비활성화하면 실패가 줄어들지만 사라지지는 않음 → 도구 스키마가 부담의 일부였지만, 남아 있는 문제는 여전히 상위 모델/서버 용량 또는 백엔드 버그입니다.

해결 방법:

1. 문자열만 받는 Chat Completions 백엔드에 `compat.requiresStringContent: true`를 설정합니다.
2. OpenClaw의 도구 스키마 표면을 안정적으로 처리할 수 없는 모델/백엔드에는 `compat.supportsTools: false`를 설정합니다.
3. 가능한 경우 프롬프트 부담을 줄입니다: 더 작은 작업공간 bootstrap, 더 짧은 세션 기록, 더 가벼운 로컬 모델, 또는 긴 컨텍스트 지원이 더 강한 백엔드.
4. 작은 직접 요청은 계속 성공하는데 OpenClaw 에이전트 턴은 여전히 백엔드 내부에서 크래시한다면, 이를 상위 서버/모델 한계로 보고 허용되는 payload 형태와 함께 해당 프로젝트에 재현 사례를 제출하세요.

관련 문서:

- [/gateway/local-models](/ko/gateway/local-models)
- [/gateway/configuration](/ko/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ko/gateway/configuration-reference#openai-compatible-endpoints)

## 응답이 없음

채널은 살아 있는데 아무 응답도 없다면, 무엇이든 다시 연결하기 전에 먼저 라우팅과 정책을 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

다음을 확인하세요.

- DM 발신자에 대해 페어링이 대기 중인지 여부
- 그룹 멘션 게이팅(`requireMention`, `mentionPatterns`)
- 채널/그룹 허용 목록 불일치

일반적인 징후:

- `drop guild message (mention required` → 멘션되기 전까지 그룹 메시지가 무시됩니다.
- `pairing request` → 발신자 승인 필요
- `blocked` / `allowlist` → 발신자/채널이 정책에 의해 필터링됨

관련 문서:

- [/channels/troubleshooting](/ko/channels/troubleshooting)
- [/channels/pairing](/ko/channels/pairing)
- [/channels/groups](/ko/channels/groups)

## 대시보드 control ui 연결 문제

대시보드/control UI가 연결되지 않으면 URL, 인증 모드, 보안 컨텍스트 가정을 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

다음을 확인하세요.

- 올바른 probe URL 및 dashboard URL
- 클라이언트와 게이트웨이 간 인증 모드/토큰 불일치
- 디바이스 ID가 필요한 상황에서의 HTTP 사용

일반적인 징후:

- `device identity required` → 비보안 컨텍스트이거나 디바이스 인증이 누락됨
- `origin not allowed` → 브라우저 `Origin`이 `gateway.controlUi.allowedOrigins`에 없거나
  (또는 명시적인 허용 목록 없이 루프백이 아닌 브라우저 origin에서 연결 중임)
- `device nonce required` / `device nonce mismatch` → 클라이언트가
  챌린지 기반 디바이스 인증 흐름(`connect.challenge` + `device.nonce`)을 완료하지 못함
- `device signature invalid` / `device signature expired` → 클라이언트가 현재 핸드셰이크에 대해 잘못된 payload(또는 오래된 타임스탬프)에 서명함
- `AUTH_TOKEN_MISMATCH`와 `canRetryWithDeviceToken=true` → 클라이언트는 캐시된 디바이스 토큰으로 신뢰된 1회 재시도를 할 수 있음
- 그 캐시된 토큰 재시도는 페어링된 디바이스 토큰과 함께 저장된 캐시된 scope 집합을 재사용합니다. 명시적인 `deviceToken` / 명시적인 `scopes` 호출자는 요청한 scope 집합을 그대로 유지합니다.
- 그 재시도 경로 밖에서는 connect 인증 우선순위가 명시적인 공유 토큰/비밀번호 우선, 그다음 명시적인 `deviceToken`, 그다음 저장된 디바이스 토큰, 마지막으로 bootstrap 토큰입니다.
- 비동기 Tailscale Serve Control UI 경로에서는 동일한 `{scope, ip}`에 대한 실패 시도가 limiter가 실패를 기록하기 전에 직렬화됩니다. 따라서 같은 클라이언트에서 동시에 잘못된 재시도 2회를 하면, 두 번 모두 단순 불일치 대신 두 번째 시도에서 `retry later`가 표시될 수 있습니다.
- 브라우저 origin 루프백 클라이언트에서 `too many failed authentication attempts (retry later)` → 같은 정규화된 `Origin`에서 반복된 실패가 일시적으로 잠깁니다. 다른 localhost origin은 별도 버킷을 사용합니다.
- 그 재시도 후에도 반복적으로 `unauthorized`가 발생함 → 공유 토큰/디바이스 토큰 드리프트입니다. 필요하면 토큰 구성을 새로 고치고 디바이스 토큰을 다시 승인/교체하세요.
- `gateway connect failed:` → 잘못된 호스트/포트/url 대상

### 인증 세부 코드 빠른 매핑

실패한 `connect` 응답의 `error.details.code`를 사용해 다음 조치를 결정하세요.

| 세부 코드                    | 의미                                                     | 권장 조치                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 클라이언트가 필요한 공유 토큰을 보내지 않았습니다.       | 클라이언트에 토큰을 붙여넣거나 설정한 후 다시 시도하세요. 대시보드 경로의 경우: `openclaw config get gateway.auth.token`을 실행한 뒤 Control UI 설정에 붙여넣으세요.                                                                                                             |
| `AUTH_TOKEN_MISMATCH`        | 공유 토큰이 게이트웨이 인증 토큰과 일치하지 않습니다.    | `canRetryWithDeviceToken=true`이면 신뢰된 1회 재시도를 허용하세요. 캐시된 토큰 재시도는 저장된 승인 scope를 재사용합니다. 명시적인 `deviceToken` / `scopes` 호출자는 요청한 scope를 유지합니다. 계속 실패하면 [토큰 드리프트 복구 체크리스트](/cli/devices#token-drift-recovery-checklist)를 실행하세요. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 캐시된 디바이스별 토큰이 오래되었거나 폐기되었습니다.    | [devices CLI](/cli/devices)를 사용해 디바이스 토큰을 교체하거나 다시 승인한 뒤 다시 연결하세요.                                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | 디바이스 ID는 알려져 있지만 이 역할에 대해 승인되지 않음 | 대기 중인 요청을 승인하세요: `openclaw devices list` 다음 `openclaw devices approve <requestId>`.                                                                                                                                                                                 |

디바이스 인증 v2 마이그레이션 점검:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 nonce/signature 오류가 보이면 연결 중인 클라이언트를 업데이트하고 다음을 확인하세요.

1. `connect.challenge`를 기다림
2. 챌린지에 바인딩된 payload에 서명함
3. 동일한 챌린지 nonce와 함께 `connect.params.device.nonce`를 전송함

`openclaw devices rotate` / `revoke` / `remove`가 예상치 않게 거부된다면:

- 페어링된 디바이스 토큰 세션은 호출자에게 `operator.admin`도 없는 한 **자기 자신의** 디바이스만 관리할 수 있습니다.
- `openclaw devices rotate --scope ...`는 호출자 세션이 이미 보유한 operator scope만 요청할 수 있습니다.

관련 문서:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ko/gateway/configuration) (gateway auth modes)
- [/gateway/trusted-proxy-auth](/ko/gateway/trusted-proxy-auth)
- [/gateway/remote](/ko/gateway/remote)
- [/cli/devices](/cli/devices)

## 게이트웨이 서비스가 실행되지 않음

서비스는 설치되어 있지만 프로세스가 계속 살아 있지 않을 때 사용하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 시스템 수준 서비스도 스캔
```

다음을 확인하세요.

- 종료 힌트와 함께 `Runtime: stopped`가 표시됨
- 서비스 구성 불일치(`Config (cli)` 대 `Config (service)`)
- 포트/리스너 충돌
- `--deep` 사용 시 추가 launchd/systemd/schtasks 설치
- `Other gateway-like services detected (best effort)` 정리 힌트

일반적인 징후:

- `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → 로컬 게이트웨이 모드가 활성화되지 않았거나 config 파일이 덮어써지면서 `gateway.mode`를 잃었습니다. 해결: config에서 `gateway.mode="local"`을 설정하거나, `openclaw onboard --mode local` / `openclaw setup`을 다시 실행해 예상되는 로컬 모드 config를 다시 기록하세요. Podman으로 OpenClaw를 실행 중이라면 기본 config 경로는 `~/.openclaw/openclaw.json`입니다.
- `refusing to bind gateway ... without auth` → 유효한 게이트웨이 인증 경로(토큰/비밀번호 또는 구성된 경우 trusted-proxy) 없이 루프백이 아닌 바인딩을 시도함
- `another gateway instance is already listening` / `EADDRINUSE` → 포트 충돌
- `Other gateway-like services detected (best effort)` → 오래되었거나 병렬인 launchd/systemd/schtasks 유닛이 존재함. 대부분의 설정에서는 머신당 게이트웨이 하나만 유지하는 것이 좋습니다. 여러 개가 정말 필요하다면 포트 + config/state/workspace를 분리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참고하세요.

관련 문서:

- [/gateway/background-process](/ko/gateway/background-process)
- [/gateway/configuration](/ko/gateway/configuration)
- [/gateway/doctor](/ko/gateway/doctor)

## 게이트웨이 probe 경고

`openclaw gateway probe`가 어떤 대상에는 도달하지만 여전히 경고 블록을 출력할 때 사용하세요.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

다음을 확인하세요.

- JSON 출력의 `warnings[].code`와 `primaryTargetId`
- 경고가 SSH 폴백, 다중 게이트웨이, 누락된 scope, 또는 해석되지 않은 auth ref에 관한 것인지 여부

일반적인 징후:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 설정에 실패했지만, 명령은 여전히 구성된 직접 대상/루프백 대상을 시도했습니다.
- `multiple reachable gateways detected` → 둘 이상의 대상이 응답했습니다. 보통 이는 의도적인 다중 게이트웨이 설정이거나 오래된/중복된 리스너를 의미합니다.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → 연결은 성공했지만 세부 RPC는 scope 제한을 받습니다. 디바이스 ID를 페어링하거나 `operator.read`가 있는 자격 증명을 사용하세요.
- 해석되지 않은 `gateway.auth.*` / `gateway.remote.*` SecretRef 경고 텍스트 → 실패한 대상에 대해 이 명령 경로에서 인증 자료를 사용할 수 없었습니다.

관련 문서:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ko/gateway/remote)

## 채널은 연결되었지만 메시지가 흐르지 않음

채널 상태는 connected인데 메시지 흐름이 멈췄다면, 정책, 권한, 채널별 전달 규칙에 집중하세요.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

다음을 확인하세요.

- DM 정책(`pairing`, `allowlist`, `open`, `disabled`)
- 그룹 허용 목록 및 멘션 요구 사항
- 누락된 채널 API 권한/scope

일반적인 징후:

- `mention required` → 그룹 멘션 정책 때문에 메시지가 무시됨
- `pairing` / 승인 대기 추적 → 발신자가 승인되지 않음
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 채널 인증/권한 문제

관련 문서:

- [/channels/troubleshooting](/ko/channels/troubleshooting)
- [/channels/whatsapp](/ko/channels/whatsapp)
- [/channels/telegram](/ko/channels/telegram)
- [/channels/discord](/ko/channels/discord)

## cron 및 heartbeat 전달

cron 또는 heartbeat가 실행되지 않았거나 전달되지 않았다면, 먼저 스케줄러 상태를 확인한 다음 전달 대상을 점검하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

다음을 확인하세요.

- Cron이 활성화되어 있고 다음 기상이 존재하는지 여부
- 작업 실행 기록 상태(`ok`, `skipped`, `error`)
- Heartbeat 건너뜀 사유(`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

일반적인 징후:

- `cron: scheduler disabled; jobs will not run automatically` → cron 비활성화됨
- `cron: timer tick failed` → 스케줄러 tick 실패; 파일/로그/런타임 오류를 확인하세요.
- `heartbeat skipped`와 `reason=quiet-hours` → 활성 시간 창 밖임
- `heartbeat skipped`와 `reason=empty-heartbeat-file` → `HEARTBEAT.md`는 존재하지만 빈 줄/Markdown 헤더만 포함하고 있어 OpenClaw가 모델 호출을 건너뜁니다.
- `heartbeat skipped`와 `reason=no-tasks-due` → `HEARTBEAT.md`에 `tasks:` 블록이 있지만 이번 tick에 실행 기한이 된 작업이 없습니다.
- `heartbeat: unknown accountId` → heartbeat 전달 대상의 account id가 유효하지 않음
- `heartbeat skipped`와 `reason=dm-blocked` → heartbeat 대상이 DM 스타일 목적지로 해석되었지만 `agents.defaults.heartbeat.directPolicy`(또는 에이전트별 재정의)가 `block`으로 설정됨

관련 문서:

- [/automation/cron-jobs#troubleshooting](/ko/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ko/automation/cron-jobs)
- [/gateway/heartbeat](/ko/gateway/heartbeat)

## 페어링된 노드 도구 실패

노드는 페어링되어 있지만 도구가 실패한다면, 포그라운드 상태, 권한, 승인 상태를 분리해서 확인하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

다음을 확인하세요.

- 노드가 예상된 기능과 함께 온라인 상태인지 여부
- 카메라/마이크/위치/화면에 대한 OS 권한 허용
- exec 승인 및 허용 목록 상태

일반적인 징후:

- `NODE_BACKGROUND_UNAVAILABLE` → 노드 앱이 포그라운드에 있어야 함
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 권한 누락
- `SYSTEM_RUN_DENIED: approval required` → exec 승인 대기 중
- `SYSTEM_RUN_DENIED: allowlist miss` → 허용 목록에 없어 명령이 차단됨

관련 문서:

- [/nodes/troubleshooting](/ko/nodes/troubleshooting)
- [/nodes/index](/ko/nodes/index)
- [/tools/exec-approvals](/ko/tools/exec-approvals)

## 브라우저 도구 실패

게이트웨이 자체는 정상인데 브라우저 도구 동작이 실패할 때 사용하세요.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

다음을 확인하세요.

- `plugins.allow`가 설정되어 있고 `browser`를 포함하는지 여부
- 유효한 브라우저 실행 파일 경로
- CDP 프로필 도달 가능 여부
- `existing-session` / `user` 프로필에 대해 로컬 Chrome을 사용할 수 있는지 여부

일반적인 징후:

- `unknown command "browser"` 또는 `unknown command 'browser'` → 번들된 browser 플러그인이 `plugins.allow`에 의해 제외됨
- `browser.enabled=true`인데 browser 도구가 없거나 사용할 수 없음 → `plugins.allow`가 `browser`를 제외하여 플러그인이 로드되지 않음
- `Failed to start Chrome CDP on port` → 브라우저 프로세스 실행 실패
- `browser.executablePath not found` → 구성된 경로가 유효하지 않음
- `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 `file:` 또는 `ftp:` 같은 지원되지 않는 스킴을 사용함
- `browser.cdpUrl has invalid port` → 구성된 CDP URL의 포트가 잘못되었거나 범위를 벗어남
- `No Chrome tabs found for profile="user"` → Chrome MCP attach 프로필에 열려 있는 로컬 Chrome 탭이 없음
- `Remote CDP for profile "<name>" is not reachable` → 구성된 원격 CDP 엔드포인트에 게이트웨이 호스트에서 도달할 수 없음
- `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only 프로필에 도달 가능한 대상이 없거나, HTTP 엔드포인트는 응답했지만 CDP WebSocket을 여전히 열 수 없음
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 현재 게이트웨이 설치에 전체 Playwright 패키지가 없음; ARIA 스냅샷과 기본 페이지 스크린샷은 여전히 동작할 수 있지만, 탐색, AI 스냅샷, CSS 선택자 요소 스크린샷, PDF 내보내기는 계속 사용할 수 없습니다.
- `fullPage is not supported for element screenshots` → 스크린샷 요청에서 `--full-page`와 `--ref` 또는 `--element`를 함께 사용함
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 스크린샷 호출은 CSS `--element`가 아니라 페이지 캡처 또는 스냅샷 `--ref`를 사용해야 함
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 업로드 훅은 CSS 선택자가 아니라 스냅샷 ref를 필요로 함
- `existing-session file uploads currently support one file at a time.` → Chrome MCP 프로필에서는 호출당 업로드 하나만 전송하세요.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 프로필의 대화상자 훅은 timeout 재정의를 지원하지 않음
- `response body is not supported for existing-session profiles yet.` → `responsebody`는 여전히 관리형 브라우저 또는 raw CDP 프로필이 필요함
- attach-only 또는 원격 CDP 프로필에서 viewport / dark-mode / locale / offline 재정의가 오래 남아 있음 → 전체 게이트웨이를 재시작하지 않고 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제하려면 `openclaw browser stop --browser-profile <name>`을 실행하세요.

관련 문서:

- [/tools/browser-linux-troubleshooting](/ko/tools/browser-linux-troubleshooting)
- [/tools/browser](/ko/tools/browser)

## 업그레이드 후 갑자기 문제가 생겼다면

업그레이드 후 발생하는 대부분의 문제는 config 드리프트이거나, 이제 더 엄격한 기본값이 적용되기 때문입니다.

### 1) 인증 및 URL 재정의 동작 변경

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

확인할 사항:

- `gateway.mode=remote`이면 로컬 서비스는 정상이더라도 CLI 호출이 원격 대상을 향하고 있을 수 있습니다.
- 명시적인 `--url` 호출은 저장된 자격 증명으로 폴백하지 않습니다.

일반적인 징후:

- `gateway connect failed:` → 잘못된 URL 대상
- `unauthorized` → 엔드포인트에는 도달했지만 인증이 잘못됨

### 2) bind 및 auth 가드레일이 더 엄격해짐

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

확인할 사항:

- 루프백이 아닌 bind(`lan`, `tailnet`, `custom`)에는 유효한 게이트웨이 인증 경로가 필요합니다: 공유 토큰/비밀번호 인증 또는 올바르게 구성된 비루프백 `trusted-proxy` 배포
- `gateway.token` 같은 이전 키는 `gateway.auth.token`을 대체하지 않습니다.

일반적인 징후:

- `refusing to bind gateway ... without auth` → 유효한 게이트웨이 인증 경로 없이 루프백이 아닌 bind를 시도함
- 런타임은 실행 중인데 `RPC probe: failed` → 게이트웨이는 살아 있지만 현재 auth/url로 접근할 수 없음

### 3) 페어링 및 디바이스 ID 상태 변경

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

확인할 사항:

- dashboard/nodes에 대한 대기 중인 디바이스 승인
- 정책 또는 ID 변경 후 대기 중인 DM 페어링 승인

일반적인 징후:

- `device identity required` → 디바이스 인증이 충족되지 않음
- `pairing required` → 발신자/디바이스를 승인해야 함

점검 후에도 서비스 config와 런타임이 계속 불일치한다면, 같은 profile/state 디렉터리에서 서비스 메타데이터를 다시 설치하세요.

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련 문서:

- [/gateway/pairing](/ko/gateway/pairing)
- [/gateway/authentication](/ko/gateway/authentication)
- [/gateway/background-process](/ko/gateway/background-process)
