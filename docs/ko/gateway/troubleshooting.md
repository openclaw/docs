---
read_when:
    - 문제 해결 허브에서 더 깊은 진단을 위해 이 문서로 안내했습니다.
    - 증상 기반의 안정적인 런북 섹션과 정확한 명령이 필요합니다.
summary: Gateway, 채널, 자동화, Node 및 브라우저를 위한 심층 문제 해결 런북
title: 문제 해결
x-i18n:
    generated_at: "2026-04-25T06:02:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 문제 해결

이 페이지는 심층 런북입니다.
먼저 빠른 트리아지 흐름이 필요하면 [/help/troubleshooting](/ko/help/troubleshooting)에서 시작하세요.

## 명령 순서

먼저 다음 명령을 이 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 신호의 기대값:

- `openclaw gateway status`에 `Runtime: running`, `Connectivity probe: ok`, `Capability: ...` 줄이 표시됩니다.
- `openclaw doctor`는 차단하는 config/service 문제를 보고하지 않습니다.
- `openclaw channels status --probe`는 계정별 실시간 transport 상태와,
  지원되는 경우 `works` 또는 `audit ok` 같은 probe/audit 결과를 표시합니다.

## 긴 컨텍스트용 추가 사용량이 필요한 Anthropic 429

로그/오류에 다음이 포함될 때 사용하세요:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

확인할 항목:

- 선택된 Anthropic Opus/Sonnet 모델에 `params.context1m: true`가 설정되어 있습니다.
- 현재 Anthropic 자격 증명은 긴 컨텍스트 사용에 적합하지 않습니다.
- 요청은 1M beta 경로가 필요한 긴 세션/모델 실행에서만 실패합니다.

해결 옵션:

1. 해당 모델에서 `context1m`을 비활성화하여 일반 컨텍스트 창으로 fallback합니다.
2. 긴 컨텍스트 요청에 적합한 Anthropic 자격 증명을 사용하거나, Anthropic API key로 전환합니다.
3. Anthropic 긴 컨텍스트 요청이 거부될 때 실행이 계속되도록 fallback 모델을 구성합니다.

관련 항목:

- [Anthropic](/ko/providers/anthropic)
- [Token use and costs](/ko/reference/token-use)
- [Why am I seeing HTTP 429 from Anthropic?](/ko/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 로컬 OpenAI 호환 백엔드는 직접 probe는 통과하지만 에이전트 실행은 실패함

다음 경우에 사용하세요:

- `curl ... /v1/models`는 동작함
- 작은 직접 `/v1/chat/completions` 호출은 동작함
- OpenClaw 모델 실행은 일반 에이전트 턴에서만 실패함

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

확인할 항목:

- 직접적인 작은 호출은 성공하지만, OpenClaw 실행은 더 큰 프롬프트에서만 실패함
- 백엔드 오류에 `messages[].content`가 문자열이어야 한다고 나옴
- 백엔드 크래시가 더 큰 prompt-token 수 또는 전체 에이전트
  runtime 프롬프트에서만 발생함

일반적인 징후:

- `messages[...].content: invalid type: sequence, expected a string` → 백엔드가
  구조화된 Chat Completions content part를 거부함. 해결: 다음을 설정
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- 직접적인 작은 요청은 성공하지만, OpenClaw 에이전트 실행은 백엔드/모델
  크래시로 실패함(예: 일부 `inferrs` 빌드의 Gemma) → OpenClaw transport는
  이미 올바를 가능성이 높고, 백엔드가 더 큰 에이전트 런타임
  프롬프트 형태에서 실패하는 것입니다.
- 도구를 비활성화하면 실패가 줄어들지만 사라지지는 않음 → tool schema가
  압박의 일부였지만, 남은 문제는 여전히 upstream 모델/서버 용량 또는 백엔드 버그입니다.

해결 옵션:

1. 문자열 전용 Chat Completions 백엔드에 대해 `compat.requiresStringContent: true`를 설정합니다.
2. OpenClaw의 tool schema 표면을 안정적으로 처리할 수 없는 모델/백엔드에 대해
   `compat.supportsTools: false`를 설정합니다.
3. 가능하면 프롬프트 부담을 줄입니다: 더 작은 워크스페이스 bootstrap, 더 짧은
   세션 기록, 더 가벼운 로컬 모델, 또는 긴 컨텍스트 지원이 더 강한 백엔드.
4. 직접적인 작은 요청은 계속 통과하는데 OpenClaw 에이전트 턴은 여전히 백엔드 내부에서 크래시한다면,
   이를 upstream 서버/모델 제한으로 보고 허용된 payload 형태로 repro를 만들어 그쪽에 이슈를 제기하세요.

관련 항목:

- [Local models](/ko/gateway/local-models)
- [Configuration](/ko/gateway/configuration)
- [OpenAI-compatible endpoints](/ko/gateway/configuration-reference#openai-compatible-endpoints)

## 응답이 없음

채널은 올라와 있는데 아무 응답이 없으면, 무엇이든 다시 연결하기 전에 라우팅과 정책부터 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

확인할 항목:

- DM 발신자에 대한 페어링 대기 중.
- 그룹 멘션 게이팅(`requireMention`, `mentionPatterns`).
- 채널/그룹 허용 목록 불일치.

일반적인 징후:

- `drop guild message (mention required` → 멘션이 있을 때까지 그룹 메시지가 무시됨.
- `pairing request` → 발신자 승인이 필요함.
- `blocked` / `allowlist` → 발신자/채널이 정책에 의해 필터링됨.

관련 항목:

- [Channel troubleshooting](/ko/channels/troubleshooting)
- [Pairing](/ko/channels/pairing)
- [Groups](/ko/channels/groups)

## Dashboard control UI 연결

dashboard/control UI가 연결되지 않을 때는 URL, 인증 모드, 보안 컨텍스트 가정을 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

확인할 항목:

- 올바른 probe URL과 dashboard URL.
- 클라이언트와 gateway 간 auth 모드/토큰 불일치.
- 디바이스 ID가 필요한 상황에서 HTTP를 사용 중임.

일반적인 징후:

- `device identity required` → 비보안 컨텍스트 또는 누락된 device auth.
- `origin not allowed` → 브라우저 `Origin`이 `gateway.controlUi.allowedOrigins`에 없거나
  (또는 명시적 허용 목록 없이 loopback이 아닌 브라우저 origin에서 연결 중).
- `device nonce required` / `device nonce mismatch` → 클라이언트가
  챌린지 기반 device auth 흐름(`connect.challenge` + `device.nonce`)을 완료하지 못함.
- `device signature invalid` / `device signature expired` → 클라이언트가 현재 핸드셰이크에 대해
  잘못된 payload(또는 오래된 타임스탬프)에 서명함.
- `AUTH_TOKEN_MISMATCH`와 `canRetryWithDeviceToken=true` → 클라이언트가 캐시된 device token으로 신뢰된 1회 재시도를 할 수 있음.
- 그 캐시된 토큰 재시도는 페어링된
  device token과 함께 저장된 캐시된 scope 집합을 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 요청한 scope 집합을 그대로 유지합니다.
- 그 재시도 경로 외에서는, connect auth 우선순위는 명시적 shared
  token/password 우선, 그다음 명시적 `deviceToken`, 저장된 device token,
  마지막으로 bootstrap token입니다.
- 비동기 Tailscale Serve Control UI 경로에서는, 같은
  `{scope, ip}`에 대한 실패한 시도는 limiter가 실패를 기록하기 전에 직렬화됩니다. 따라서 같은 클라이언트의 잘못된 동시 재시도 두 번은
  두 번의 일반 불일치 대신 두 번째 시도에서 `retry later`
  를 표시할 수 있습니다.
- 브라우저 origin loopback 클라이언트에서 `too many failed authentication attempts (retry later)` →
  같은 정규화된 `Origin`에서 반복된 실패가 일시적으로 잠깁니다. 다른 localhost origin은 별도 버킷을 사용합니다.
- 그 재시도 이후에도 반복적인 `unauthorized` → shared token/device token 드리프트; 토큰 구성을 새로 고치고 필요하면 device token을 다시 승인/회전하세요.
- `gateway connect failed:` → 잘못된 host/port/url 대상.

### Auth 세부 코드 빠른 매핑

실패한 `connect` 응답의 `error.details.code`를 사용해 다음 조치를 고르세요:

| Detail code                  | 의미                                                                                                                                                                               | 권장 조치                                                                                                                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | 클라이언트가 필요한 shared token을 보내지 않았습니다.                                                                                                                              | 클라이언트에 토큰을 붙여 넣거나 설정한 뒤 재시도하세요. dashboard 경로의 경우: `openclaw config get gateway.auth.token`을 실행한 뒤 Control UI 설정에 붙여 넣으세요.                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | shared token이 gateway auth token과 일치하지 않았습니다.                                                                                                                           | `canRetryWithDeviceToken=true`이면 신뢰된 1회 재시도를 허용하세요. 캐시된 토큰 재시도는 저장된 승인된 scope를 재사용합니다. 명시적 `deviceToken` / `scopes` 호출자는 요청한 scope를 유지합니다. 여전히 실패하면 [token drift recovery checklist](/ko/cli/devices#token-drift-recovery-checklist)를 실행하세요. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 캐시된 장치별 토큰이 오래되었거나 취소되었습니다.                                                                                                                                  | [devices CLI](/ko/cli/devices)를 사용해 device token을 회전/재승인한 뒤 다시 연결하세요.                                                                                                                                                                                               |
| `PAIRING_REQUIRED`           | device ID에 승인이 필요합니다. `not-paired`, `scope-upgrade`, `role-upgrade`, `metadata-upgrade`에 대한 `error.details.reason`을 확인하고, 있으면 `requestId` / `remediationHint`를 사용하세요. | 대기 중인 요청을 승인하세요: `openclaw devices list` 후 `openclaw devices approve <requestId>`. scope/role 업그레이드도 요청된 접근을 검토한 뒤 같은 흐름을 사용합니다.                                                                                                            |

Device auth v2 마이그레이션 확인:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 nonce/signature 오류가 보이면, 연결 중인 클라이언트를 업데이트하고 다음을 확인하세요:

1. `connect.challenge`를 기다림
2. challenge에 바인딩된 payload에 서명함
3. 같은 challenge nonce와 함께 `connect.params.device.nonce`를 보냄

`openclaw devices rotate` / `revoke` / `remove`가 예상치 않게 거부되는 경우:

- paired-device token 세션은
  호출자에게 `operator.admin`도 없는 한 **자신의** device만 관리할 수 있습니다
- `openclaw devices rotate --scope ...`는
  호출자 세션이 이미 보유한 operator scope만 요청할 수 있습니다

관련 항목:

- [Control UI](/ko/web/control-ui)
- [Configuration](/ko/gateway/configuration) (gateway auth modes)
- [Trusted proxy auth](/ko/gateway/trusted-proxy-auth)
- [Remote access](/ko/gateway/remote)
- [Devices](/ko/cli/devices)

## Gateway 서비스가 실행되지 않음

서비스는 설치되었지만 프로세스가 계속 살아 있지 않을 때 사용하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 시스템 수준 서비스도 스캔
```

확인할 항목:

- 종료 힌트와 함께 `Runtime: stopped`가 표시됨.
- 서비스 config 불일치(`Config (cli)` vs `Config (service)`).
- 포트/리스너 충돌.
- `--deep` 사용 시 추가 launchd/systemd/schtasks 설치.
- `Other gateway-like services detected (best effort)` 정리 힌트.

일반적인 징후:

- `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → 로컬 gateway 모드가 활성화되지 않았거나, config 파일이 손상되어 `gateway.mode`를 잃었습니다. 해결: config에 `gateway.mode="local"`을 설정하거나, `openclaw onboard --mode local` / `openclaw setup`을 다시 실행해 기대되는 로컬 모드 config를 다시 찍어 넣으세요. Podman으로 OpenClaw를 실행하는 경우 기본 config 경로는 `~/.openclaw/openclaw.json`입니다.
- `refusing to bind gateway ... without auth` → 유효한 gateway auth 경로(토큰/비밀번호 또는 구성된 trusted-proxy) 없이 non-loopback 바인드 시도.
- `another gateway instance is already listening` / `EADDRINUSE` → 포트 충돌.
- `Other gateway-like services detected (best effort)` → 오래되었거나 병렬인 launchd/systemd/schtasks 유닛이 존재합니다. 대부분의 설정에서는 머신당 gateway 하나만 유지해야 합니다. 둘 이상이 정말 필요하다면 포트 + config/state/workspace를 분리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.

관련 항목:

- [Background exec and process tool](/ko/gateway/background-process)
- [Configuration](/ko/gateway/configuration)
- [Doctor](/ko/gateway/doctor)

## Gateway가 마지막 정상 config를 복원함

Gateway는 시작되지만 로그에 `openclaw.json`을 복원했다고 나올 때 사용하세요.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

확인할 항목:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 활성 config 옆에 타임스탬프가 붙은 `openclaw.json.clobbered.*` 파일
- `Config recovery warning`으로 시작하는 main-agent 시스템 이벤트

발생한 일:

- 시작 또는 hot reload 중 거부된 config가 유효성 검사를 통과하지 못했습니다.
- OpenClaw는 거부된 payload를 `.clobbered.*`로 보존했습니다.
- 활성 config는 마지막으로 검증된 last-known-good 복사본에서 복원되었습니다.
- 다음 main-agent 턴에는 거부된 config를 무작정 다시 쓰지 말라는 경고가 표시됩니다.
- 모든 유효성 검사 문제가 `plugins.entries.<id>...` 아래에만 있었다면, OpenClaw는
  전체 파일을 복원하지 않습니다. Plugin 로컬 실패는 크게 드러나되 관련 없는
  사용자 설정은 활성 config에 남습니다.

검사 및 복구:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

일반적인 징후:

- `.clobbered.*` 존재 → 외부 직접 편집 또는 시작 시 읽은 값이 복원됨.
- `.rejected.*` 존재 → OpenClaw 소유 config 쓰기가 커밋 전에 schema 또는 clobber 검사를 통과하지 못함.
- `Config write rejected:` → 쓰기 작업이 필수 shape를 제거하거나, 파일 크기를 급격히 줄이거나, 유효하지 않은 config를 저장하려고 했음.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, 또는 `size-drop-vs-last-good:*` → 시작 시 현재 파일이 last-known-good 백업과 비교해 필드 또는 크기를 잃어 clobbered로 처리됨.
- `Config last-known-good promotion skipped` → 후보에 `***` 같은 마스킹된 비밀 placeholder가 포함되어 있었음.

해결 옵션:

1. 복원된 활성 config가 올바르면 그대로 유지합니다.
2. `.clobbered.*` 또는 `.rejected.*`에서 의도한 키만 복사한 뒤 `openclaw config set` 또는 `config.patch`로 적용합니다.
3. 재시작 전에 `openclaw config validate`를 실행합니다.
4. 수동 편집 시에는 변경하려던 일부 객체만이 아니라 전체 JSON5 config를 유지하세요.

관련 항목:

- [Configuration: strict validation](/ko/gateway/configuration#strict-validation)
- [Configuration: hot reload](/ko/gateway/configuration#config-hot-reload)
- [Config](/ko/cli/config)
- [Doctor](/ko/gateway/doctor)

## Gateway probe 경고

`openclaw gateway probe`가 무언가에 도달했지만 여전히 경고 블록을 출력할 때 사용하세요.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

확인할 항목:

- JSON 출력의 `warnings[].code`와 `primaryTargetId`.
- 경고가 SSH fallback, 다중 gateway, 누락된 scope, 또는 해석되지 않은 auth ref에 관한 것인지.

일반적인 징후:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 설정에 실패했지만, 명령은 여전히 직접 구성된/loopback 대상을 시도함.
- `multiple reachable gateways detected` → 둘 이상의 대상이 응답함. 보통 의도적인 다중 gateway 설정 또는 오래된/중복 리스너를 의미함.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 연결은 성공했지만 detail RPC는 scope에 제한됨; device ID를 페어링하거나 `operator.read`가 있는 자격 증명을 사용하세요.
- `Capability: pairing-pending` 또는 `gateway closed (1008): pairing required` → gateway는 응답했지만, 이 클라이언트는 정상 operator 접근 전에 여전히 페어링/승인이 필요함.
- 해석되지 않은 `gateway.auth.*` / `gateway.remote.*` SecretRef 경고 텍스트 → 실패한 대상에 대해 이 명령 경로에서 auth 자료를 사용할 수 없었음.

관련 항목:

- [Gateway](/ko/cli/gateway)
- [Multiple gateways on the same host](/ko/gateway#multiple-gateways-same-host)
- [Remote access](/ko/gateway/remote)

## 채널은 연결되었지만 메시지가 흐르지 않음

채널 상태는 connected인데 메시지 흐름이 끊겼다면, 채널별 재연결보다 정책, 권한, 전달 규칙에 집중하세요.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

확인할 항목:

- DM 정책(`pairing`, `allowlist`, `open`, `disabled`).
- 그룹 허용 목록 및 멘션 요구 사항.
- 누락된 채널 API 권한/scope.

일반적인 징후:

- `mention required` → 그룹 멘션 정책에 의해 메시지가 무시됨.
- `pairing` / 대기 중 승인 trace → 발신자가 승인되지 않음.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 채널 인증/권한 문제.

관련 항목:

- [Channel troubleshooting](/ko/channels/troubleshooting)
- [WhatsApp](/ko/channels/whatsapp)
- [Telegram](/ko/channels/telegram)
- [Discord](/ko/channels/discord)

## Cron 및 heartbeat 전달

cron 또는 heartbeat가 실행되지 않았거나 전달되지 않았다면, 먼저 scheduler 상태를 확인한 뒤 전달 대상을 확인하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

확인할 항목:

- Cron 활성화 및 다음 wake 존재.
- 작업 실행 기록 상태(`ok`, `skipped`, `error`).
- Heartbeat skip 이유(`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

일반적인 징후:

- `cron: scheduler disabled; jobs will not run automatically` → cron 비활성화.
- `cron: timer tick failed` → scheduler tick 실패; 파일/로그/런타임 오류를 확인하세요.
- `heartbeat skipped`와 `reason=quiet-hours` → 활성 시간 창 밖.
- `heartbeat skipped`와 `reason=empty-heartbeat-file` → `HEARTBEAT.md`는 존재하지만 빈 줄/마크다운 헤더만 포함하므로 OpenClaw가 모델 호출을 건너뜀.
- `heartbeat skipped`와 `reason=no-tasks-due` → `HEARTBEAT.md`에 `tasks:` 블록이 있지만 이 tick에 기한이 된 작업이 없음.
- `heartbeat: unknown accountId` → heartbeat 전달 대상에 대한 잘못된 account id.
- `heartbeat skipped`와 `reason=dm-blocked` → `agents.defaults.heartbeat.directPolicy`(또는 에이전트별 override)가 `block`으로 설정된 상태에서 heartbeat 대상이 DM 스타일 대상으로 해석됨.

관련 항목:

- [Scheduled tasks: troubleshooting](/ko/automation/cron-jobs#troubleshooting)
- [Scheduled tasks](/ko/automation/cron-jobs)
- [Heartbeat](/ko/gateway/heartbeat)

## Node 페어링 도구 실패

Node는 페어링되었지만 도구가 실패할 때는 foreground, 권한, 승인 상태를 분리해서 확인하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

확인할 항목:

- 예상 capability를 가진 Node가 온라인인지.
- 카메라/마이크/위치/화면에 대한 OS 권한 부여.
- exec 승인 및 allowlist 상태.

일반적인 징후:

- `NODE_BACKGROUND_UNAVAILABLE` → node 앱이 foreground에 있어야 함.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 누락된 OS 권한.
- `SYSTEM_RUN_DENIED: approval required` → exec 승인 대기 중.
- `SYSTEM_RUN_DENIED: allowlist miss` → allowlist에 의해 명령 차단됨.

관련 항목:

- [Node troubleshooting](/ko/nodes/troubleshooting)
- [Nodes](/ko/nodes/index)
- [Exec approvals](/ko/tools/exec-approvals)

## 브라우저 도구 실패

Gateway 자체는 정상인데 browser tool 동작이 실패할 때 사용하세요.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

확인할 항목:

- `plugins.allow`가 설정되어 있고 `browser`를 포함하는지.
- 유효한 브라우저 실행 파일 경로.
- CDP profile 도달 가능성.
- `existing-session` / `user` profile에 대한 로컬 Chrome 사용 가능성.

일반적인 징후:

- `unknown command "browser"` 또는 `unknown command 'browser'` → 번들된 browser Plugin이 `plugins.allow`에 의해 제외되었습니다.
- `browser.enabled=true`인데 browser tool이 없거나 사용 불가 → `plugins.allow`가 `browser`를 제외해서 Plugin이 로드되지 않았습니다.
- `Failed to start Chrome CDP on port` → browser 프로세스 시작 실패.
- `browser.executablePath not found` → 구성된 경로가 잘못되었습니다.
- `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 `file:` 또는 `ftp:` 같은 미지원 스킴을 사용합니다.
- `browser.cdpUrl has invalid port` → 구성된 CDP URL에 잘못되었거나 범위를 벗어난 포트가 있습니다.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session이 아직 선택한 브라우저 데이터 디렉터리에 연결하지 못했습니다. 브라우저 inspect 페이지를 열고, 원격 디버깅을 활성화하고, 브라우저를 열어 둔 상태에서 첫 attach 프롬프트를 승인한 뒤 다시 시도하세요. 로그인 상태가 필요 없다면 관리형 `openclaw` profile을 사용하는 편이 좋습니다.
- `No Chrome tabs found for profile="user"` → Chrome MCP attach profile에 열려 있는 로컬 Chrome 탭이 없습니다.
- `Remote CDP for profile "<name>" is not reachable` → 구성된 원격 CDP 엔드포인트에 gateway 호스트에서 도달할 수 없습니다.
- `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profile에 도달 가능한 대상이 없거나, HTTP 엔드포인트는 응답했지만 CDP WebSocket은 여전히 열 수 없습니다.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 현재 gateway 설치에 번들된 browser Plugin의 `playwright-core` 런타임 의존성이 없습니다. `openclaw doctor --fix`를 실행한 뒤 gateway를 재시작하세요. ARIA snapshot과 기본 페이지 스크린샷은 여전히 동작할 수 있지만, 탐색, AI snapshot, CSS selector 기반 요소 스크린샷, PDF 내보내기는 계속 사용할 수 없습니다.
- `fullPage is not supported for element screenshots` → 스크린샷 요청에서 `--full-page`를 `--ref` 또는 `--element`와 함께 사용했습니다.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 스크린샷 호출은 CSS `--element`가 아니라 페이지 캡처 또는 snapshot `--ref`를 사용해야 합니다.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 업로드 hook은 CSS selector가 아니라 snapshot ref가 필요합니다.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profile에서는 호출당 업로드 하나만 전송하세요.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profile의 dialog hook은 timeout override를 지원하지 않습니다.
- `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profile의 `act:type`에서는 `timeoutMs`를 생략하거나, 커스텀 timeout이 필요하면 관리형/CDP browser profile을 사용하세요.
- `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profile의 `act:evaluate`에서는 `timeoutMs`를 생략하거나, 커스텀 timeout이 필요하면 관리형/CDP browser profile을 사용하세요.
- `response body is not supported for existing-session profiles yet.` → `responsebody`는 여전히 관리형 브라우저 또는 원시 CDP profile이 필요합니다.
- attach-only 또는 원격 CDP profile에서 viewport / dark-mode / locale / offline override가 오래 남아 있음 → 전체 gateway를 재시작하지 않고도 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제하려면 `openclaw browser stop --browser-profile <name>`을 실행하세요.

관련 항목:

- [Browser troubleshooting](/ko/tools/browser-linux-troubleshooting)
- [Browser (OpenClaw-managed)](/ko/tools/browser)

## 업그레이드 후 갑자기 무언가가 깨졌다면

업그레이드 후 대부분의 문제는 config 드리프트이거나, 이제 더 엄격한 기본값이 적용되기 때문입니다.

### 1) Auth 및 URL override 동작이 변경됨

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

확인할 항목:

- `gateway.mode=remote`이면, 로컬 서비스는 정상이어도 CLI 호출이 원격 대상을 향하고 있을 수 있습니다.
- 명시적 `--url` 호출은 저장된 자격 증명으로 fallback하지 않습니다.

일반적인 징후:

- `gateway connect failed:` → 잘못된 URL 대상.
- `unauthorized` → 엔드포인트에는 도달했지만 auth가 잘못됨.

### 2) Bind 및 auth 가드레일이 더 엄격해짐

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

확인할 항목:

- non-loopback bind(`lan`, `tailnet`, `custom`)에는 유효한 gateway auth 경로가 필요합니다: shared token/password auth 또는 올바르게 구성된 non-loopback `trusted-proxy` 배포.
- `gateway.token` 같은 예전 키는 `gateway.auth.token`을 대체하지 않습니다.

일반적인 징후:

- `refusing to bind gateway ... without auth` → 유효한 gateway auth 경로 없이 non-loopback bind 시도.
- runtime은 실행 중인데 `Connectivity probe: failed` → gateway는 살아 있지만 현재 auth/url로는 접근할 수 없음.

### 3) Pairing 및 device ID 상태가 변경됨

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

확인할 항목:

- dashboard/nodes에 대한 대기 중 device 승인.
- 정책 또는 ID 변경 후 대기 중인 DM 페어링 승인.

일반적인 징후:

- `device identity required` → device auth가 충족되지 않음.
- `pairing required` → 발신자/device 승인이 필요함.

검사 후에도 서비스 config와 runtime이 계속 불일치하면, 동일한 profile/state 디렉터리에서 서비스 메타데이터를 다시 설치하세요.

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련 항목:

- [Gateway-owned pairing](/ko/gateway/pairing)
- [Authentication](/ko/gateway/authentication)
- [Background exec and process tool](/ko/gateway/background-process)

## 관련 항목

- [Gateway runbook](/ko/gateway)
- [Doctor](/ko/gateway/doctor)
- [FAQ](/ko/help/faq)
