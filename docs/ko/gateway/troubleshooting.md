---
read_when:
    - 문제 해결 허브에서 더 심층적인 진단을 위해 이곳으로 안내했습니다
    - 정확한 명령이 포함된 안정적인 증상 기반 런북 섹션이 필요합니다
sidebarTitle: Troubleshooting
summary: gateway, 채널, 자동화, node, 브라우저용 심층 문제 해결 런북
title: 문제 해결
x-i18n:
    generated_at: "2026-04-26T11:31:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

이 페이지는 심층 런북입니다. 먼저 빠른 트리아지 흐름이 필요하면 [/help/troubleshooting](/ko/help/troubleshooting)에서 시작하세요.

## 명령 사다리

먼저 다음 명령을 이 순서대로 실행하세요:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 상태에서 기대되는 신호:

- `openclaw gateway status`에 `Runtime: running`, `Connectivity probe: ok`, `Capability: ...` 줄이 표시됩니다.
- `openclaw doctor`가 차단하는 config/서비스 문제를 보고하지 않습니다.
- `openclaw channels status --probe`가 계정별 실시간 전송 상태와, 지원되는 경우 `works` 또는 `audit ok` 같은 probe/audit 결과를 표시합니다.

## split brain 설치 및 더 최신 config 가드

업데이트 후 gateway 서비스가 예기치 않게 중지되거나, 로그에 어떤 `openclaw` 바이너리가 `openclaw.json`을 마지막으로 쓴 버전보다 오래되었다고 표시될 때 사용하세요.

OpenClaw는 config 쓰기에 `meta.lastTouchedVersion`을 기록합니다. 읽기 전용 명령은 더 새로운 OpenClaw가 쓴 config도 여전히 검사할 수 있지만, 프로세스 및 서비스 변경은 더 오래된 바이너리에서 계속 진행되기를 거부합니다. 차단되는 작업에는 gateway 서비스 시작, 중지, 재시작, 제거, 강제 서비스 재설치, 서비스 모드 gateway 시작, `gateway --force` 포트 정리가 포함됩니다.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH 수정">
    `openclaw`가 더 새로운 설치를 가리키도록 `PATH`를 수정한 뒤 작업을 다시 실행하세요.
  </Step>
  <Step title="gateway 서비스 재설치">
    더 새로운 설치에서 의도한 gateway 서비스를 재설치하세요:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="오래된 래퍼 제거">
    여전히 오래된 `openclaw` 바이너리를 가리키는 오래된 시스템 패키지 또는 래퍼 항목을 제거하세요.
  </Step>
</Steps>

<Warning>
의도적인 다운그레이드 또는 긴급 복구에만 단일 명령에 대해 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`을 설정하세요. 정상 운영에서는 설정하지 마세요.
</Warning>

## Anthropic 429 장문 컨텍스트에 추가 사용량 필요

로그/오류에 `HTTP 429: rate_limit_error: Extra usage is required for long context requests`가 포함될 때 사용하세요.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

다음을 확인하세요:

- 선택된 Anthropic Opus/Sonnet model에 `params.context1m: true`가 있습니다.
- 현재 Anthropic 자격 증명이 장문 컨텍스트 사용 대상이 아닙니다.
- 요청은 1M beta 경로가 필요한 긴 세션/model 실행에서만 실패합니다.

해결 방법:

<Steps>
  <Step title="context1m 비활성화">
    해당 model의 `context1m`을 비활성화하여 일반 컨텍스트 창으로 폴백하세요.
  </Step>
  <Step title="자격이 있는 자격 증명 사용">
    장문 컨텍스트 요청에 적합한 Anthropic 자격 증명을 사용하거나 Anthropic API 키로 전환하세요.
  </Step>
  <Step title="폴백 model 구성">
    Anthropic 장문 컨텍스트 요청이 거부될 때도 실행이 계속되도록 폴백 model을 구성하세요.
  </Step>
</Steps>

관련 항목:

- [Anthropic](/ko/providers/anthropic)
- [토큰 사용량 및 비용](/ko/reference/token-use)
- [왜 Anthropic에서 HTTP 429가 표시되나요?](/ko/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 로컬 OpenAI 호환 백엔드는 직접 probe는 통과하지만 에이전트 실행은 실패

다음 경우에 사용하세요:

- `curl ... /v1/models`는 동작함
- 작은 직접 `/v1/chat/completions` 호출은 동작함
- OpenClaw model 실행은 일반 에이전트 턴에서만 실패함

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

다음을 확인하세요:

- 직접 작은 호출은 성공하지만 OpenClaw 실행은 더 큰 프롬프트에서만 실패함
- 백엔드 오류에 `messages[].content`가 문자열이어야 한다고 나옴
- 더 큰 prompt-token 수 또는 전체 에이전트 런타임 프롬프트에서만 나타나는 백엔드 충돌

<AccordionGroup>
  <Accordion title="일반적인 징후">
    - `messages[...].content: invalid type: sequence, expected a string` → 백엔드가 구조화된 Chat Completions 콘텐츠 파트를 거부합니다. 해결: `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
    - 직접 작은 요청은 성공하지만 OpenClaw 에이전트 실행은 백엔드/model 충돌(예: 일부 `inferrs` 빌드의 Gemma)로 실패 → OpenClaw 전송은 이미 올바를 가능성이 높고, 백엔드가 더 큰 에이전트 런타임 프롬프트 형태에서 실패하고 있습니다.
    - 도구를 비활성화하면 실패가 줄지만 사라지지 않음 → 도구 스키마가 부담의 일부였지만, 남아 있는 문제는 여전히 업스트림 model/서버 용량 또는 백엔드 버그입니다.

  </Accordion>
  <Accordion title="해결 방법">
    1. 문자열 전용 Chat Completions 백엔드에는 `compat.requiresStringContent: true`를 설정합니다.
    2. OpenClaw의 도구 스키마 표면을 안정적으로 처리하지 못하는 model/백엔드에는 `compat.supportsTools: false`를 설정합니다.
    3. 가능하면 프롬프트 부담을 줄이세요: 더 작은 워크스페이스 bootstrap, 더 짧은 세션 기록, 더 가벼운 로컬 model, 또는 장문 컨텍스트 지원이 더 강한 백엔드.
    4. 직접 작은 요청은 계속 통과하는데 OpenClaw 에이전트 턴은 여전히 백엔드 내부에서 충돌한다면, 이를 업스트림 서버/model 제한으로 간주하고 수용된 payload 형태와 함께 재현 사례를 그쪽에 제출하세요.
  </Accordion>
</AccordionGroup>

관련 항목:

- [Configuration](/ko/gateway/configuration)
- [로컬 모델](/ko/gateway/local-models)
- [OpenAI 호환 엔드포인트](/ko/gateway/configuration-reference#openai-compatible-endpoints)

## 응답 없음

채널은 살아 있는데 아무 응답도 없으면, 무엇이든 다시 연결하기 전에 라우팅과 정책을 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

다음을 확인하세요:

- DM 발신자에 대해 pairing이 보류 중임
- 그룹 멘션 게이팅(`requireMention`, `mentionPatterns`)
- 채널/그룹 allowlist 불일치

일반적인 징후:

- `drop guild message (mention required` → 멘션될 때까지 그룹 메시지가 무시됨
- `pairing request` → 발신자 승인이 필요함
- `blocked` / `allowlist` → 발신자/채널이 정책에 의해 필터링됨

관련 항목:

- [채널 문제 해결](/ko/channels/troubleshooting)
- [그룹](/ko/channels/groups)
- [페어링](/ko/channels/pairing)

## 대시보드 Control UI 연결

대시보드/Control UI가 연결되지 않을 때는 URL, 인증 모드, secure context 가정을 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

다음을 확인하세요:

- 올바른 probe URL 및 대시보드 URL
- 클라이언트와 gateway 사이의 auth 모드/token 불일치
- 디바이스 identity가 필요한데 HTTP를 사용 중임

<AccordionGroup>
  <Accordion title="연결 / 인증 징후">
    - `device identity required` → 비보안 컨텍스트 또는 디바이스 인증 누락
    - `origin not allowed` → 브라우저 `Origin`이 `gateway.controlUi.allowedOrigins`에 없거나(또는 명시적 allowlist 없이 non-loopback 브라우저 origin에서 연결 중임)
    - `device nonce required` / `device nonce mismatch` → 클라이언트가 챌린지 기반 디바이스 인증 흐름(`connect.challenge` + `device.nonce`)을 완료하지 못함
    - `device signature invalid` / `device signature expired` → 클라이언트가 현재 핸드셰이크에 대해 잘못된 payload(또는 오래된 타임스탬프)에 서명함
    - `AUTH_TOKEN_MISMATCH`와 `canRetryWithDeviceToken=true` → 클라이언트는 캐시된 디바이스 token으로 한 번 신뢰 재시도를 할 수 있음
    - 이 캐시 token 재시도는 pair된 디바이스 token과 함께 저장된 캐시 scope 세트를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 요청한 scope 세트를 그대로 유지합니다.
    - 이 재시도 경로 밖에서는 연결 인증 우선순위가 명시적 공유 token/password 우선, 그다음 명시적 `deviceToken`, 그다음 저장된 디바이스 token, 그다음 bootstrap token 순서입니다.
    - 비동기 Tailscale Serve Control UI 경로에서는 동일한 `{scope, ip}`에 대한 실패 시도가 limiter가 실패를 기록하기 전에 직렬화됩니다. 따라서 동일한 클라이언트의 잘못된 동시 재시도 두 번은 두 개의 단순 불일치 대신 두 번째 시도에 `retry later`가 나타날 수 있습니다.
    - 브라우저 origin loopback 클라이언트에서 `too many failed authentication attempts (retry later)` → 동일한 정규화된 `Origin`의 반복 실패가 일시적으로 차단됨. 다른 localhost origin은 별도의 버킷을 사용합니다.
    - 이후에도 반복되는 `unauthorized` → 공유 token/디바이스 token 드리프트. token config를 새로고침하고 필요하면 디바이스 token을 다시 승인/회전하세요.
    - `gateway connect failed:` → 잘못된 호스트/포트/url 대상

  </Accordion>
</AccordionGroup>

### 인증 세부 코드 빠른 맵

실패한 `connect` 응답의 `error.details.code`를 사용해 다음 조치를 선택하세요:

| 세부 코드 | 의미 | 권장 조치 |
| --- | --- | --- |
| `AUTH_TOKEN_MISSING` | 클라이언트가 필요한 공유 token을 보내지 않았습니다. | 클라이언트에 token을 붙여넣거나 설정하고 다시 시도하세요. 대시보드 경로의 경우: `openclaw config get gateway.auth.token` 후 Control UI 설정에 붙여넣으세요. |
| `AUTH_TOKEN_MISMATCH` | 공유 token이 gateway auth token과 일치하지 않았습니다. | `canRetryWithDeviceToken=true`이면 한 번 신뢰 재시도를 허용하세요. 캐시 token 재시도는 저장된 승인된 scope를 재사용합니다. 명시적 `deviceToken` / `scopes` 호출자는 요청한 scope를 유지합니다. 여전히 실패하면 [token drift recovery checklist](/ko/cli/devices#token-drift-recovery-checklist)를 실행하세요. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 캐시된 디바이스별 token이 오래되었거나 취소되었습니다. | [devices CLI](/ko/cli/devices)를 사용해 디바이스 token을 회전/재승인한 뒤 다시 연결하세요. |
| `PAIRING_REQUIRED` | 디바이스 identity에 승인이 필요합니다. `error.details.reason`에서 `not-paired`, `scope-upgrade`, `role-upgrade`, `metadata-upgrade`를 확인하고, 제공되는 경우 `requestId` / `remediationHint`를 사용하세요. | 보류 중인 요청을 승인하세요: `openclaw devices list` 후 `openclaw devices approve <requestId>`. scope/role 업그레이드도 요청된 액세스를 검토한 뒤 같은 흐름을 사용합니다. |

<Note>
공유 gateway token/password로 인증되는 직접 loopback 백엔드 RPC는 CLI의 paired-device scope 기준선에 의존하면 안 됩니다. 하위 에이전트나 기타 내부 호출이 여전히 `scope-upgrade`로 실패한다면, 호출자가 `client.id: "gateway-client"`와 `client.mode: "backend"`를 사용하고 있으며 명시적인 `deviceIdentity` 또는 device token을 강제로 지정하지 않는지 확인하세요.
</Note>

디바이스 인증 v2 마이그레이션 확인:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 nonce/signature 오류가 표시되면 연결 중인 클라이언트를 업데이트하고 다음을 확인하세요:

<Steps>
  <Step title="connect.challenge 대기">
    클라이언트는 gateway가 발급한 `connect.challenge`를 기다립니다.
  </Step>
  <Step title="payload 서명">
    클라이언트는 challenge에 바인딩된 payload에 서명합니다.
  </Step>
  <Step title="device nonce 전송">
    클라이언트는 동일한 challenge nonce와 함께 `connect.params.device.nonce`를 전송합니다.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove`가 예상과 다르게 거부되는 경우:

- paired-device token 세션은 호출자에게 `operator.admin`도 있지 않은 한 **자기 자신의** 디바이스만 관리할 수 있습니다
- `openclaw devices rotate --scope ...`는 호출자 세션이 이미 보유한 operator scope만 요청할 수 있습니다

관련 항목:

- [Configuration](/ko/gateway/configuration) (gateway 인증 모드)
- [Control UI](/ko/web/control-ui)
- [Devices](/ko/cli/devices)
- [원격 액세스](/ko/gateway/remote)
- [Trusted proxy auth](/ko/gateway/trusted-proxy-auth)

## Gateway 서비스가 실행되지 않음

서비스는 설치되어 있지만 프로세스가 계속 살아 있지 않을 때 사용하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 시스템 수준 서비스도 스캔
```

다음을 확인하세요:

- 종료 힌트와 함께 `Runtime: stopped`
- 서비스 config 불일치(`Config (cli)` 대 `Config (service)`)
- 포트/리스너 충돌
- `--deep` 사용 시 추가 launchd/systemd/schtasks 설치
- `Other gateway-like services detected (best effort)` 정리 힌트

<AccordionGroup>
  <Accordion title="일반적인 징후">
    - `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → 로컬 gateway 모드가 활성화되어 있지 않거나 config 파일이 덮어써지며 `gateway.mode`를 잃었습니다. 해결: config에서 `gateway.mode="local"`을 설정하거나, `openclaw onboard --mode local` / `openclaw setup`을 다시 실행해 예상된 로컬 모드 config를 다시 기록하세요. Podman으로 OpenClaw를 실행 중이라면 기본 config 경로는 `~/.openclaw/openclaw.json`입니다.
    - `refusing to bind gateway ... without auth` → 유효한 gateway 인증 경로(token/password 또는 구성된 경우 trusted-proxy) 없이 non-loopback 바인드 시도
    - `another gateway instance is already listening` / `EADDRINUSE` → 포트 충돌
    - `Other gateway-like services detected (best effort)` → 오래되었거나 병렬인 launchd/systemd/schtasks 유닛이 존재합니다. 대부분의 설정은 머신당 하나의 gateway만 유지해야 합니다. 하나 이상 필요하다면 포트 + config/state/workspace를 분리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.

  </Accordion>
</AccordionGroup>

관련 항목:

- [백그라운드 exec 및 process 도구](/ko/gateway/background-process)
- [Configuration](/ko/gateway/configuration)
- [Doctor](/ko/gateway/doctor)

## Gateway가 마지막 정상 config 복원

Gateway는 시작되지만 로그에 `openclaw.json`을 복원했다고 나올 때 사용하세요.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

다음을 확인하세요:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 활성 config 옆에 있는 타임스탬프 포함 `openclaw.json.clobbered.*` 파일
- `Config recovery warning`으로 시작하는 main-agent 시스템 이벤트

<AccordionGroup>
  <Accordion title="무슨 일이 일어났는가">
    - 거부된 config가 시작 시 또는 핫 리로드 중 검증을 통과하지 못했습니다.
    - OpenClaw는 거부된 payload를 `.clobbered.*`로 보존했습니다.
    - 활성 config는 마지막으로 검증된 last-known-good 복사본에서 복원되었습니다.
    - 다음 main-agent 턴에는 거부된 config를 무작정 다시 쓰지 말라는 경고가 표시됩니다.
    - 모든 검증 문제가 `plugins.entries.<id>...` 아래에만 있었다면 OpenClaw는 파일 전체를 복원하지 않습니다. Plugin 로컬 실패는 계속 크게 드러나고, 관련 없는 사용자 설정은 활성 config에 유지됩니다.

  </Accordion>
  <Accordion title="검사 및 복구">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="일반적인 징후">
    - `.clobbered.*` 존재 → 외부 직접 편집 또는 시작 시 읽기가 복원되었습니다.
    - `.rejected.*` 존재 → OpenClaw 소유 config 쓰기가 커밋 전에 스키마 또는 clobber 검사를 통과하지 못했습니다.
    - `Config write rejected:` → 쓰기 시 필수 형태를 제거하거나, 파일 크기를 급격히 줄이거나, 잘못된 config를 저장하려 했습니다.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, 또는 `size-drop-vs-last-good:*` → 시작 시 현재 파일이 last-known-good 백업과 비교해 필드 또는 크기를 잃어 clobbered로 처리되었습니다.
    - `Config last-known-good promotion skipped` → 후보에 `***` 같은 비공개 처리된 시크릿 placeholder가 포함되어 있었습니다.

  </Accordion>
  <Accordion title="해결 방법">
    1. 복원된 활성 config가 올바르면 그대로 유지합니다.
    2. `.clobbered.*` 또는 `.rejected.*`에서 의도한 키만 복사한 뒤 `openclaw config set` 또는 `config.patch`로 적용합니다.
    3. 재시작 전에 `openclaw config validate`를 실행합니다.
    4. 직접 편집할 때는 변경하고 싶은 부분 객체만이 아니라 전체 JSON5 config를 유지하세요.
  </Accordion>
</AccordionGroup>

관련 항목:

- [Config](/ko/cli/config)
- [Configuration: hot reload](/ko/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/ko/gateway/configuration#strict-validation)
- [Doctor](/ko/gateway/doctor)

## Gateway probe 경고

`openclaw gateway probe`가 무언가에는 도달하지만 여전히 경고 블록을 출력할 때 사용하세요.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

다음을 확인하세요:

- JSON 출력의 `warnings[].code` 및 `primaryTargetId`
- 경고가 SSH 폴백, 다중 gateway, 누락된 scope 또는 해결되지 않은 auth ref에 관한 것인지

일반적인 징후:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 설정은 실패했지만, 명령은 여전히 직접 구성된/loopback 대상에 대해 시도했습니다.
- `multiple reachable gateways detected` → 둘 이상의 대상이 응답했습니다. 보통 의도적인 다중 gateway 설정이거나 오래된/중복 리스너를 의미합니다.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 연결은 됐지만 세부 RPC가 scope에 의해 제한됩니다. device identity를 pair하거나 `operator.read`가 있는 자격 증명을 사용하세요.
- `Capability: pairing-pending` 또는 `gateway closed (1008): pairing required` → gateway는 응답했지만 이 클라이언트는 여전히 일반 operator 액세스 전에 pairing/승인이 필요합니다.
- 해결되지 않은 `gateway.auth.*` / `gateway.remote.*` SecretRef 경고 텍스트 → 실패한 대상에 대해 현재 명령 경로에서 인증 자료를 사용할 수 없었습니다.

관련 항목:

- [Gateway](/ko/cli/gateway)
- [같은 호스트의 다중 Gateway](/ko/gateway#multiple-gateways-same-host)
- [원격 액세스](/ko/gateway/remote)

## 채널은 연결되었지만 메시지 흐름이 없음

채널 상태는 connected인데 메시지 흐름이 죽어 있다면 정책, 권한, 채널별 전달 규칙에 집중하세요.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

다음을 확인하세요:

- DM 정책(`pairing`, `allowlist`, `open`, `disabled`)
- 그룹 allowlist 및 멘션 요구 사항
- 누락된 채널 API 권한/scope

일반적인 징후:

- `mention required` → 그룹 멘션 정책에 의해 메시지가 무시됨
- `pairing` / 보류 승인 추적 → 발신자가 승인되지 않음
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 채널 인증/권한 문제

관련 항목:

- [채널 문제 해결](/ko/channels/troubleshooting)
- [Discord](/ko/channels/discord)
- [Telegram](/ko/channels/telegram)
- [WhatsApp](/ko/channels/whatsapp)

## Cron 및 Heartbeat 전달

Cron 또는 Heartbeat가 실행되지 않았거나 전달되지 않았다면, 먼저 스케줄러 상태를 확인한 뒤 전달 대상을 확인하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

다음을 확인하세요:

- Cron 활성화 여부 및 다음 wake 존재 여부
- 작업 실행 기록 상태(`ok`, `skipped`, `error`)
- Heartbeat 건너뛰기 이유(`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="일반적인 징후">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron 비활성화됨
    - `cron: timer tick failed` → 스케줄러 tick 실패. 파일/로그/런타임 오류 확인
    - `heartbeat skipped`와 `reason=quiet-hours` → 활성 시간 창 밖
    - `heartbeat skipped`와 `reason=empty-heartbeat-file` → `HEARTBEAT.md`가 존재하지만 빈 줄/마크다운 헤더만 포함하므로 OpenClaw가 모델 호출을 건너뜀
    - `heartbeat skipped`와 `reason=no-tasks-due` → `HEARTBEAT.md`에 `tasks:` 블록이 있지만 이번 tick에 due인 task가 없음
    - `heartbeat: unknown accountId` → Heartbeat 전달 대상의 잘못된 계정 id
    - `heartbeat skipped`와 `reason=dm-blocked` → Heartbeat 대상이 DM 스타일 대상으로 확인되었지만 `agents.defaults.heartbeat.directPolicy`(또는 에이전트별 재정의)가 `block`으로 설정됨

  </Accordion>
</AccordionGroup>

관련 항목:

- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
- [예약된 작업: 문제 해결](/ko/automation/cron-jobs#troubleshooting)

## Node는 pair되었지만 도구가 실패

node는 pair되었지만 도구가 실패한다면 포그라운드, 권한, 승인 상태를 분리해서 확인하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

다음을 확인하세요:

- 예상 capabilities와 함께 node가 온라인 상태인지
- 카메라/마이크/위치/화면에 대한 OS 권한 부여
- exec 승인 및 allowlist 상태

일반적인 징후:

- `NODE_BACKGROUND_UNAVAILABLE` → node 앱이 포그라운드에 있어야 함
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 권한 누락
- `SYSTEM_RUN_DENIED: approval required` → exec 승인 보류 중
- `SYSTEM_RUN_DENIED: allowlist miss` → allowlist에 의해 명령 차단됨

관련 항목:

- [Exec 승인](/ko/tools/exec-approvals)
- [Node 문제 해결](/ko/nodes/troubleshooting)
- [Nodes](/ko/nodes/index)

## 브라우저 도구 실패

gateway 자체는 정상인데 브라우저 도구 작업이 실패할 때 사용하세요.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

다음을 확인하세요:

- `plugins.allow`가 설정되어 있고 `browser`를 포함하는지
- 유효한 브라우저 실행 파일 경로
- CDP 프로필 도달 가능 여부
- `existing-session` / `user` 프로필용 로컬 Chrome 사용 가능 여부

<AccordionGroup>
  <Accordion title="Plugin / 실행 파일 징후">
    - `unknown command "browser"` 또는 `unknown command 'browser'` → 번들된 browser Plugin이 `plugins.allow`에서 제외되었습니다.
    - `browser.enabled=true`인데 browser 도구가 없거나 사용할 수 없음 → `plugins.allow`가 `browser`를 제외하고 있어 Plugin이 로드되지 않았습니다.
    - `Failed to start Chrome CDP on port` → 브라우저 프로세스 시작 실패.
    - `browser.executablePath not found` → 구성된 경로가 유효하지 않음.
    - `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 `file:` 또는 `ftp:` 같은 지원되지 않는 스킴을 사용함.
    - `browser.cdpUrl has invalid port` → 구성된 CDP URL의 포트가 잘못되었거나 범위를 벗어남.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 현재 gateway 설치에 번들된 browser Plugin의 `playwright-core` 런타임 의존성이 없습니다. `openclaw doctor --fix`를 실행한 뒤 gateway를 재시작하세요. ARIA snapshot과 기본 페이지 screenshot은 여전히 동작할 수 있지만, navigation, AI snapshot, CSS 선택자 요소 screenshot, PDF 내보내기는 계속 사용할 수 없습니다.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session 징후">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session이 아직 선택된 브라우저 데이터 디렉터리에 연결할 수 없습니다. 브라우저 inspect 페이지를 열고, 원격 디버깅을 활성화하고, 브라우저를 열린 상태로 유지하고, 첫 연결 프롬프트를 승인한 뒤 다시 시도하세요. 로그인 상태가 필요하지 않다면 관리형 `openclaw` 프로필을 사용하는 편이 좋습니다.
    - `No Chrome tabs found for profile="user"` → Chrome MCP 연결 프로필에 열려 있는 로컬 Chrome 탭이 없습니다.
    - `Remote CDP for profile "<name>" is not reachable` → 구성된 원격 CDP 엔드포인트에 gateway 호스트에서 도달할 수 없습니다.
    - `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only 프로필에 도달 가능한 대상이 없거나 HTTP 엔드포인트는 응답했지만 CDP WebSocket은 여전히 열 수 없습니다.

  </Accordion>
  <Accordion title="요소 / screenshot / 업로드 징후">
    - `fullPage is not supported for element screenshots` → screenshot 요청이 `--full-page`와 `--ref` 또는 `--element`를 함께 사용했습니다.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` screenshot 호출은 CSS `--element`가 아니라 페이지 캡처 또는 snapshot `--ref`를 사용해야 합니다.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 업로드 훅은 CSS 선택자가 아니라 snapshot ref가 필요합니다.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP 프로필에서는 호출당 업로드 하나만 보내세요.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 프로필의 dialog 훅은 타임아웃 재정의를 지원하지 않습니다.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session 프로필에서 `act:type`에는 `timeoutMs`를 생략하거나, 사용자 지정 타임아웃이 필요하면 관리형/CDP 브라우저 프로필을 사용하세요.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session 프로필에서 `act:evaluate`에는 `timeoutMs`를 생략하거나, 사용자 지정 타임아웃이 필요하면 관리형/CDP 브라우저 프로필을 사용하세요.
    - `response body is not supported for existing-session profiles yet.` → `responsebody`는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다.
    - attach-only 또는 원격 CDP 프로필에서 오래 남아 있는 viewport / dark-mode / locale / offline 재정의 → 전체 gateway를 재시작하지 않고 활성 제어 세션을 닫고 Playwright/CDP emulation 상태를 해제하려면 `openclaw browser stop --browser-profile <name>`을 실행하세요.

  </Accordion>
</AccordionGroup>

관련 항목:

- [브라우저(OpenClaw 관리형)](/ko/tools/browser)
- [브라우저 문제 해결](/ko/tools/browser-linux-troubleshooting)

## 업그레이드 후 갑자기 문제가 생긴 경우

대부분의 업그레이드 후 문제는 config 드리프트이거나, 이제 더 엄격한 기본값이 적용되기 때문입니다.

<AccordionGroup>
  <Accordion title="1. 인증 및 URL 재정의 동작 변경">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    확인할 사항:

    - `gateway.mode=remote`이면 로컬 서비스는 정상인데 CLI 호출이 원격 대상을 향하고 있을 수 있습니다.
    - 명시적 `--url` 호출은 저장된 자격 증명으로 폴백하지 않습니다.

    일반적인 징후:

    - `gateway connect failed:` → 잘못된 URL 대상
    - `unauthorized` → 엔드포인트에는 도달했지만 인증이 잘못됨

  </Accordion>
  <Accordion title="2. 바인드 및 인증 가드레일이 더 엄격해짐">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    확인할 사항:

    - non-loopback 바인드(`lan`, `tailnet`, `custom`)에는 유효한 gateway 인증 경로가 필요합니다: 공유 token/password 인증 또는 올바르게 구성된 non-loopback `trusted-proxy` 배포.
    - `gateway.token` 같은 오래된 키는 `gateway.auth.token`을 대체하지 않습니다.

    일반적인 징후:

    - `refusing to bind gateway ... without auth` → 유효한 gateway 인증 경로 없이 non-loopback 바인드 시도
    - 런타임은 실행 중인데 `Connectivity probe: failed` → gateway는 살아 있지만 현재 auth/url로 접근할 수 없음

  </Accordion>
  <Accordion title="3. Pairing 및 디바이스 identity 상태 변경">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    확인할 사항:

    - 대시보드/node에 대한 보류 중인 디바이스 승인
    - 정책 또는 identity 변경 후 보류 중인 DM pairing 승인

    일반적인 징후:

    - `device identity required` → 디바이스 인증 요구 사항 미충족
    - `pairing required` → 발신자/디바이스 승인이 필요함

  </Accordion>
</AccordionGroup>

검사 후에도 서비스 config와 런타임이 계속 일치하지 않는다면, 동일한 profile/state 디렉터리에서 서비스 메타데이터를 재설치하세요:

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련 항목:

- [Authentication](/ko/gateway/authentication)
- [백그라운드 exec 및 process 도구](/ko/gateway/background-process)
- [Gateway 소유 pairing](/ko/gateway/pairing)

## 관련

- [Doctor](/ko/gateway/doctor)
- [FAQ](/ko/help/faq)
- [Gateway 런북](/ko/gateway)
