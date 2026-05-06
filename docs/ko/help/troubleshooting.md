---
read_when:
    - OpenClaw가 작동하지 않아 가장 빠른 해결 방법이 필요한 경우
    - 심층 런북에 들어가기 전에 트리아지 흐름이 필요합니다
summary: OpenClaw를 위한 증상 중심 문제 해결 허브
title: 일반 문제 해결
x-i18n:
    generated_at: "2026-05-06T06:29:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 624fa34cda3b440fa9cc636beb3fe6e3608a77a332933fa593097ebc556ac745
    source_path: help/troubleshooting.md
    workflow: 16
---

시간이 2분뿐이라면 이 페이지를 초기 진단의 시작점으로 사용하세요.

## 첫 60초

다음 단계를 정확히 순서대로 실행하세요.

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

각 명령의 정상 출력은 다음과 같습니다.

- `openclaw status` → 구성된 채널을 표시하고 명확한 인증 오류가 없습니다.
- `openclaw status --all` → 전체 보고서가 있으며 공유할 수 있습니다.
- `openclaw gateway probe` → 예상 Gateway 대상에 연결할 수 있습니다(`Reachable: yes`). `Capability: ...`는 프로브가 증명할 수 있었던 인증 수준을 알려 주며, `Read probe: limited - missing scope: operator.read`는 연결 실패가 아니라 저하된 진단입니다.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok`, 그리고 그럴듯한 `Capability: ...` 줄이 있습니다. 읽기 범위 RPC 증명도 필요하면 `--require-rpc`를 사용하세요.
- `openclaw doctor` → 차단하는 구성/서비스 오류가 없습니다.
- `openclaw channels status --probe` → 연결 가능한 Gateway는 계정별 실시간
  전송 상태와 `works` 또는 `audit ok` 같은 프로브/감사 결과를 반환합니다. Gateway에
  연결할 수 없으면 명령은 구성 전용 요약으로 대체됩니다.
- `openclaw logs --follow` → 활동이 안정적이며 반복되는 치명적 오류가 없습니다.

## Anthropic 긴 컨텍스트 429

다음이 표시되면:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
[/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ko/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)로 이동하세요.

## 로컬 OpenAI 호환 백엔드는 직접 작동하지만 OpenClaw에서는 실패함

로컬 또는 자체 호스팅 `/v1` 백엔드가 작은 직접
`/v1/chat/completions` 프로브에는 응답하지만 `openclaw infer model run` 또는 일반
에이전트 턴에서 실패하는 경우:

1. 오류가 `messages[].content`에 문자열이 필요하다고 언급하면
   `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
2. 백엔드가 여전히 OpenClaw 에이전트 턴에서만 실패하면
   `models.providers.<provider>.models[].compat.supportsTools: false`를 설정하고 다시 시도하세요.
3. 작은 직접 호출은 여전히 작동하지만 더 큰 OpenClaw 프롬프트에서
   백엔드가 충돌하면, 남은 문제를 업스트림 모델/서버 제한으로 보고
   심층 런북을 계속 진행하세요:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/ko/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Plugin 설치가 누락된 openclaw extensions로 실패함

설치가 `package.json missing openclaw.extensions`로 실패하면, 해당 Plugin 패키지는
OpenClaw가 더 이상 허용하지 않는 오래된 형태를 사용하고 있습니다.

Plugin 패키지에서 수정하세요.

1. `package.json`에 `openclaw.extensions`를 추가하세요.
2. 항목이 빌드된 런타임 파일(보통 `./dist/index.js`)을 가리키게 하세요.
3. Plugin을 다시 게시하고 `openclaw plugins install <package>`를 다시 실행하세요.

예:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

참조: [Plugin 아키텍처](/ko/plugins/architecture)

## Plugin이 있지만 의심스러운 소유권으로 차단됨

`openclaw doctor`, 설정, 또는 시작 경고에 다음이 표시되면:

```text
blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)
plugin present but blocked
```

Plugin 파일의 소유자가 해당 파일을 로드하는 프로세스와 다른 Unix 사용자입니다.
Plugin 구성을 제거하지 마세요. 파일 소유권을 수정하거나 상태 디렉터리를 소유한
동일한 사용자로 OpenClaw를 실행하세요.

Docker 설치는 일반적으로 `node`(uid `1000`)로 실행됩니다. 기본 Docker
설정에서는 호스트 바인드 마운트를 복구하세요.

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
openclaw doctor --fix
```

의도적으로 OpenClaw를 root로 실행한다면 관리형 Plugin 루트를
대신 root 소유권으로 복구하세요.

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
openclaw doctor --fix
```

더 자세한 문서:

- [Plugin 경로 소유권](/ko/tools/plugin#blocked-plugin-path-ownership)
- [Docker 권한](/ko/install/docker#permissions-and-eacces)

## 의사 결정 트리

```mermaid
flowchart TD
  A[OpenClaw is not working] --> B{What breaks first}
  B --> C[No replies]
  B --> D[Dashboard or Control UI will not connect]
  B --> E[Gateway will not start or service not running]
  B --> F[Channel connects but messages do not flow]
  B --> G[Cron or heartbeat did not fire or did not deliver]
  B --> H[Node is paired but camera canvas screen exec fails]
  B --> I[Browser tool fails]

  C --> C1[/No replies section/]
  D --> D1[/Control UI section/]
  E --> E1[/Gateway section/]
  F --> F1[/Channel flow section/]
  G --> G1[/Automation section/]
  H --> H1[/Node tools section/]
  I --> I1[/Browser section/]
```

<AccordionGroup>
  <Accordion title="No replies">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    정상 출력은 다음과 같습니다.

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, 또는 `admin-capable`
    - 채널의 전송이 연결된 것으로 표시되고, 지원되는 경우 `channels status --probe`에 `works` 또는 `audit ok`가 표시됩니다.
    - 발신자가 승인된 것으로 보입니다(또는 DM 정책이 공개/허용 목록입니다).

    일반적인 로그 시그니처:

    - `drop guild message (mention required` → Discord에서 멘션 게이트가 메시지를 차단했습니다.
    - `pairing request` → 발신자가 승인되지 않았으며 DM 페어링 승인을 기다리고 있습니다.
    - 채널 로그의 `blocked` / `allowlist` → 발신자, 방 또는 그룹이 필터링되었습니다.

    심층 페이지:

    - [/gateway/troubleshooting#no-replies](/ko/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/ko/channels/troubleshooting)
    - [/channels/pairing](/ko/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard or Control UI will not connect">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    정상 출력은 다음과 같습니다.

    - `openclaw gateway status`에 `Dashboard: http://...`가 표시됩니다.
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, 또는 `admin-capable`
    - 로그에 인증 루프가 없습니다.

    일반적인 로그 시그니처:

    - `device identity required` → HTTP/비보안 컨텍스트에서는 디바이스 인증을 완료할 수 없습니다.
    - `origin not allowed` → 브라우저 `Origin`이 Control UI
      Gateway 대상에 허용되지 않았습니다.
    - 재시도 힌트(`canRetryWithDeviceToken=true`)와 함께 `AUTH_TOKEN_MISMATCH` → 신뢰된 디바이스 토큰 재시도가 한 번 자동으로 발생할 수 있습니다.
    - 해당 캐시 토큰 재시도는 페어링된
      디바이스 토큰과 함께 저장된 캐시된 범위 집합을 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는
      대신 요청한 범위 집합을 유지합니다.
    - 비동기 Tailscale Serve Control UI 경로에서는 동일한
      `{scope, ip}`에 대한 실패한 시도가 제한기가 실패를 기록하기 전에 직렬화되므로,
      두 번째 동시 잘못된 재시도에서 이미 `retry later`가 표시될 수 있습니다.
    - localhost
      브라우저 origin에서 `too many failed authentication attempts (retry later)` → 동일한 `Origin`의 반복 실패가 일시적으로
      잠깁니다. 다른 localhost origin은 별도 버킷을 사용합니다.
    - 해당 재시도 후 반복되는 `unauthorized` → 잘못된 토큰/비밀번호, 인증 모드 불일치, 또는 오래된 페어링 디바이스 토큰입니다.
    - `gateway connect failed:` → UI가 잘못된 URL/포트를 대상으로 하거나 Gateway에 연결할 수 없습니다.

    심층 페이지:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/ko/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/ko/web/control-ui)
    - [/gateway/authentication](/ko/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway will not start or service installed but not running">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    정상 출력은 다음과 같습니다.

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, 또는 `admin-capable`

    일반적인 로그 시그니처:

    - `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → Gateway 모드가 원격이거나, 구성 파일에 로컬 모드 스탬프가 없어 복구해야 합니다.
    - `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로(토큰/비밀번호 또는 구성된 경우 신뢰 프록시) 없이 비루프백 바인드를 시도했습니다.
    - `another gateway instance is already listening` 또는 `EADDRINUSE` → 포트가 이미 사용 중입니다.

    심층 페이지:

    - [/gateway/troubleshooting#gateway-service-not-running](/ko/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/ko/gateway/background-process)
    - [/gateway/configuration](/ko/gateway/configuration)

  </Accordion>

  <Accordion title="Channel connects but messages do not flow">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    정상 출력은 다음과 같습니다.

    - 채널 전송이 연결되어 있습니다.
    - 페어링/허용 목록 검사를 통과합니다.
    - 필요한 경우 멘션이 감지됩니다.

    일반적인 로그 시그니처:

    - `mention required` → 그룹 멘션 게이트가 처리를 차단했습니다.
    - `pairing` / `pending` → DM 발신자가 아직 승인되지 않았습니다.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → 채널 권한 토큰 문제입니다.

    심층 페이지:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/ko/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/ko/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron or heartbeat did not fire or did not deliver">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    정상 출력은 다음과 같습니다.

    - `cron.status`가 활성화 상태와 다음 깨우기를 표시합니다.
    - `cron runs`가 최근 `ok` 항목을 표시합니다.
    - Heartbeat가 활성화되어 있고 활성 시간 밖이 아닙니다.

    일반적인 로그 시그니처:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron이 비활성화되어 있습니다.
    - `reason=quiet-hours`와 함께 `heartbeat skipped` → 구성된 활성 시간 밖입니다.
    - `reason=empty-heartbeat-file`와 함께 `heartbeat skipped` → `HEARTBEAT.md`가 있지만 빈 내용/헤더 전용 스캐폴딩만 포함합니다.
    - `reason=no-tasks-due`와 함께 `heartbeat skipped` → `HEARTBEAT.md` 작업 모드가 활성화되어 있지만 아직 기한이 된 작업 간격이 없습니다.
    - `reason=alerts-disabled`와 함께 `heartbeat skipped` → 모든 Heartbeat 가시성이 비활성화되어 있습니다(`showOk`, `showAlerts`, `useIndicator`가 모두 꺼져 있음).
    - `requests-in-flight` → 기본 레인이 바빠서 Heartbeat 깨우기가 지연되었습니다.
    - `unknown accountId` → Heartbeat 전달 대상 계정이 존재하지 않습니다.

    심층 페이지:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/ko/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/ko/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/ko/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node is paired but tool fails camera canvas screen exec">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    정상 출력은 다음과 같습니다.

    - Node가 `node` 역할에 대해 연결 및 페어링된 것으로 나열됩니다.
    - 호출하는 명령에 대한 기능이 존재합니다.
    - 해당 도구에 대해 권한 상태가 부여됨입니다.

    일반적인 로그 시그니처:

    - `NODE_BACKGROUND_UNAVAILABLE` → Node 앱을 포그라운드로 가져오세요.
    - `*_PERMISSION_REQUIRED` → OS 권한이 거부되었거나 없습니다.
    - `SYSTEM_RUN_DENIED: approval required` → exec 승인이 대기 중입니다.
    - `SYSTEM_RUN_DENIED: allowlist miss` → 명령이 exec 허용 목록에 없습니다.

    자세한 페이지:

    - [/gateway/troubleshooting#node-paired-tool-fails](/ko/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/ko/nodes/troubleshooting)
    - [/tools/exec-approvals](/ko/tools/exec-approvals)

  </Accordion>

  <Accordion title="Exec에서 갑자기 승인을 요청합니다">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    변경된 사항:

    - `tools.exec.host`가 설정되지 않은 경우 기본값은 `auto`입니다.
    - `host=auto`는 sandbox 런타임이 활성 상태이면 `sandbox`로, 그렇지 않으면 `gateway`로 해석됩니다.
    - `host=auto`는 라우팅 전용입니다. 프롬프트 없는 "YOLO" 동작은 Gateway/Node에서 `security=full`과 `ask=off`를 함께 설정할 때 발생합니다.
    - `gateway`와 `node`에서는 `tools.exec.security`가 설정되지 않으면 기본값이 `full`입니다.
    - 설정되지 않은 `tools.exec.ask`의 기본값은 `off`입니다.
    - 결과: 승인이 표시된다면 일부 호스트 로컬 또는 세션별 정책이 현재 기본값보다 exec를 더 엄격하게 제한한 것입니다.

    현재 기본 승인 없음 동작 복원:

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    더 안전한 대안:

    - 안정적인 호스트 라우팅만 원한다면 `tools.exec.host=gateway`만 설정하세요.
    - 호스트 exec를 사용하되 허용 목록 누락 시 검토를 원한다면 `security=allowlist`와 `ask=on-miss`를 사용하세요.
    - `host=auto`가 다시 `sandbox`로 해석되도록 하려면 sandbox 모드를 활성화하세요.

    일반적인 로그 시그니처:

    - `Approval required.` → 명령이 `/approve ...`를 기다리고 있습니다.
    - `SYSTEM_RUN_DENIED: approval required` → Node 호스트 exec 승인이 대기 중입니다.
    - `exec host=sandbox requires a sandbox runtime for this session` → 암시적/명시적으로 sandbox가 선택되었지만 sandbox 모드가 꺼져 있습니다.

    자세한 페이지:

    - [/tools/exec](/ko/tools/exec)
    - [/tools/exec-approvals](/ko/tools/exec-approvals)
    - [/gateway/security#what-the-audit-checks-high-level](/ko/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="브라우저 도구가 실패합니다">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    정상 출력은 다음과 같습니다.

    - 브라우저 상태에 `running: true`와 선택된 브라우저/프로필이 표시됩니다.
    - `openclaw`가 시작되거나 `user`가 로컬 Chrome 탭을 볼 수 있습니다.

    일반적인 로그 시그니처:

    - `unknown command "browser"` 또는 `unknown command 'browser'` → `plugins.allow`가 설정되어 있으며 `browser`를 포함하지 않습니다.
    - `Failed to start Chrome CDP on port` → 로컬 브라우저 실행에 실패했습니다.
    - `browser.executablePath not found` → 구성된 바이너리 경로가 잘못되었습니다.
    - `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 지원되지 않는 스킴을 사용합니다.
    - `browser.cdpUrl has invalid port` → 구성된 CDP URL에 잘못되었거나 범위를 벗어난 포트가 있습니다.
    - `No Chrome tabs found for profile="user"` → Chrome MCP 연결 프로필에 열린 로컬 Chrome 탭이 없습니다.
    - `Remote CDP for profile "<name>" is not reachable` → 구성된 원격 CDP 엔드포인트에 이 호스트에서 도달할 수 없습니다.
    - `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 연결 전용 프로필에 활성 CDP 대상이 없습니다.
    - 연결 전용 또는 원격 CDP 프로필에서 오래된 뷰포트 / 다크 모드 / 로캘 / 오프라인 재정의 → Gateway를 다시 시작하지 않고 활성 제어 세션을 닫고 에뮬레이션 상태를 해제하려면 `openclaw browser stop --browser-profile <name>`을 실행하세요.

    자세한 페이지:

    - [/gateway/troubleshooting#browser-tool-fails](/ko/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser#missing-browser-command-or-tool](/ko/tools/browser#missing-browser-command-or-tool)
    - [/tools/browser-linux-troubleshooting](/ko/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## 관련 항목

- [FAQ](/ko/help/faq) — 자주 묻는 질문
- [Gateway 문제 해결](/ko/gateway/troubleshooting) — Gateway별 문제
- [Doctor](/ko/gateway/doctor) — 자동화된 상태 검사 및 복구
- [채널 문제 해결](/ko/channels/troubleshooting) — 채널 연결 문제
- [자동화 문제 해결](/ko/automation/cron-jobs#troubleshooting) — Cron 및 Heartbeat 문제
