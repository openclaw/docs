---
read_when:
    - CLI에서 Gateway 실행하기(dev 또는 서버)
    - Gateway 인증, 바인드 모드 및 연결 디버깅
    - Bonjour를 통해 Gateway 검색하기(local + wide-area DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway 실행, 조회 및 검색
title: Gateway
x-i18n:
    generated_at: "2026-04-23T14:01:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway는 OpenClaw의 WebSocket 서버입니다(채널, Node, 세션, hooks).

이 페이지의 하위 명령은 `openclaw gateway …` 아래에 있습니다.

관련 문서:

- [/gateway/bonjour](/ko/gateway/bonjour)
- [/gateway/discovery](/ko/gateway/discovery)
- [/gateway/configuration](/ko/gateway/configuration)

## Gateway 실행

로컬 Gateway 프로세스를 실행합니다:

```bash
openclaw gateway
```

포그라운드 별칭:

```bash
openclaw gateway run
```

참고:

- 기본적으로 Gateway는 `~/.openclaw/openclaw.json`에서 `gateway.mode=local`이 설정되지 않으면 시작을 거부합니다. 임시/dev 실행에는 `--allow-unconfigured`를 사용하세요.
- `openclaw onboard --mode local` 및 `openclaw setup`은 `gateway.mode=local`을 기록하는 것이 예상되는 동작입니다. 파일이 존재하지만 `gateway.mode`가 누락된 경우, 이를 암묵적으로 local mode로 가정하지 말고 손상되었거나 덮어써진 구성으로 보고 복구하세요.
- 파일이 존재하고 `gateway.mode`가 누락된 경우, Gateway는 이를 의심스러운 구성 손상으로 간주하고 사용자를 위해 “로컬로 추정”하지 않습니다.
- 인증 없이 loopback을 넘어 바인딩하는 것은 차단됩니다(안전 가드레일).
- `SIGUSR1`은 권한이 있을 때 프로세스 내부 재시작을 트리거합니다(`commands.restart`는 기본적으로 활성화되어 있으며, 수동 재시작을 막으려면 `commands.restart: false`로 설정하세요. 단, Gateway 도구/config apply/update는 계속 허용됩니다).
- `SIGINT`/`SIGTERM` 핸들러는 Gateway 프로세스를 중지하지만, 사용자 지정 터미널 상태는 복원하지 않습니다. CLI를 TUI나 raw-mode 입력으로 감싸는 경우 종료 전에 터미널을 복원하세요.

### 옵션

- `--port <port>`: WebSocket 포트(기본값은 config/env에서 오며, 보통 `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: 리스너 바인드 모드.
- `--auth <token|password>`: 인증 모드 재정의.
- `--token <token>`: 토큰 재정의(프로세스에 `OPENCLAW_GATEWAY_TOKEN`도 설정).
- `--password <password>`: 비밀번호 재정의. 경고: 인라인 비밀번호는 로컬 프로세스 목록에 노출될 수 있습니다.
- `--password-file <path>`: 파일에서 Gateway 비밀번호를 읽습니다.
- `--tailscale <off|serve|funnel>`: Tailscale을 통해 Gateway를 노출합니다.
- `--tailscale-reset-on-exit`: 종료 시 Tailscale serve/funnel 구성을 재설정합니다.
- `--allow-unconfigured`: config에 `gateway.mode=local`이 없어도 Gateway 시작을 허용합니다. 이는 임시/dev 부트스트랩용 시작 가드를 우회할 뿐이며 config 파일을 기록하거나 복구하지는 않습니다.
- `--dev`: dev config + workspace가 없으면 생성합니다(`BOOTSTRAP.md`는 건너뜀).
- `--reset`: dev config + credentials + sessions + workspace를 재설정합니다(`--dev` 필요).
- `--force`: 시작 전에 선택한 포트의 기존 리스너를 강제로 종료합니다.
- `--verbose`: 상세 로그.
- `--cli-backend-logs`: 콘솔에 CLI 백엔드 로그만 표시합니다(stdout/stderr도 활성화).
- `--ws-log <auto|full|compact>`: websocket 로그 스타일(기본값 `auto`).
- `--compact`: `--ws-log compact`의 별칭.
- `--raw-stream`: 원시 모델 스트림 이벤트를 jsonl로 기록합니다.
- `--raw-stream-path <path>`: 원시 스트림 jsonl 경로.

시작 프로파일링:

- Gateway 시작 중 단계별 시간을 기록하려면 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`을 설정하세요.
- Gateway 시작 벤치마크를 실행하려면 `pnpm test:startup:gateway -- --runs 5 --warmup 1`을 사용하세요. 이 벤치마크는 첫 프로세스 출력, `/healthz`, `/readyz`, 그리고 시작 trace 시간을 기록합니다.

## 실행 중인 Gateway 조회

모든 조회 명령은 WebSocket RPC를 사용합니다.

출력 모드:

- 기본값: 사람이 읽기 쉬운 형식(TTY에서는 색상 포함).
- `--json`: 기계 판독용 JSON(스타일/스피너 없음).
- `--no-color`(또는 `NO_COLOR=1`): 사람용 레이아웃은 유지하면서 ANSI를 비활성화합니다.

공통 옵션(지원되는 경우):

- `--url <url>`: Gateway WebSocket URL.
- `--token <token>`: Gateway 토큰.
- `--password <password>`: Gateway 비밀번호.
- `--timeout <ms>`: 타임아웃/예산(명령마다 다름).
- `--expect-final`: “final” 응답을 기다립니다(agent 호출).

참고: `--url`을 설정하면 CLI는 config나 environment credentials로 폴백하지 않습니다.
`--token` 또는 `--password`를 명시적으로 전달하세요. 명시적인 credentials가 없으면 오류입니다.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 엔드포인트는 liveness probe입니다. 서버가 HTTP에 응답할 수 있게 되면 반환됩니다. HTTP `/readyz` 엔드포인트는 더 엄격하며 시작 sidecar, 채널 또는 구성된 hooks가 아직 안정화 중인 동안에는 준비되지 않은 상태를 유지합니다.

### `gateway usage-cost`

세션 로그에서 usage-cost 요약을 가져옵니다.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

옵션:

- `--days <days>`: 포함할 일 수(기본값 `30`).

### `gateway stability`

실행 중인 Gateway에서 최근 진단 안정성 기록기를 가져옵니다.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

옵션:

- `--limit <limit>`: 포함할 최근 이벤트의 최대 개수(기본값 `25`, 최대 `1000`).
- `--type <type>`: `payload.large` 또는 `diagnostic.memory.pressure` 같은 진단 이벤트 유형으로 필터링합니다.
- `--since-seq <seq>`: 특정 진단 시퀀스 번호 이후의 이벤트만 포함합니다.
- `--bundle [path]`: 실행 중인 Gateway를 호출하는 대신 저장된 안정성 번들을 읽습니다. state 디렉터리 아래의 최신 번들에는 `--bundle latest`(또는 그냥 `--bundle`)를 사용하고, 번들 JSON 경로를 직접 전달할 수도 있습니다.
- `--export`: 안정성 세부 정보를 출력하는 대신 공유 가능한 지원 진단 zip을 기록합니다.
- `--output <path>`: `--export`의 출력 경로.

참고:

- 기록에는 운영 메타데이터가 유지됩니다: 이벤트 이름, 개수, 바이트 크기, 메모리 판독값, 큐/세션 상태, 채널/plugin 이름, 그리고 redact된 세션 요약. 채팅 텍스트, Webhook 본문, 도구 출력, 원시 요청 또는 응답 본문, 토큰, 쿠키, 비밀 값, 호스트명, 원시 세션 id는 유지하지 않습니다. 기록기를 완전히 비활성화하려면 `diagnostics.enabled: false`를 설정하세요.
- 치명적인 Gateway 종료, 종료 타임아웃, 재시작 시작 실패 시 기록기에 이벤트가 있으면 OpenClaw는 동일한 진단 스냅샷을 `~/.openclaw/logs/stability/openclaw-stability-*.json`에 기록합니다. 최신 번들은 `openclaw gateway stability --bundle latest`로 확인하세요. `--limit`, `--type`, `--since-seq`도 번들 출력에 적용됩니다.

### `gateway diagnostics export`

버그 리포트에 첨부하도록 설계된 로컬 진단 zip을 기록합니다.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

옵션:

- `--output <path>`: 출력 zip 경로. 기본값은 state 디렉터리 아래 지원 export입니다.
- `--log-lines <count>`: 포함할 최대 정제 로그 줄 수(기본값 `5000`).
- `--log-bytes <bytes>`: 검사할 최대 로그 바이트 수(기본값 `1000000`).
- `--url <url>`: 상태 스냅샷용 Gateway WebSocket URL.
- `--token <token>`: 상태 스냅샷용 Gateway 토큰.
- `--password <password>`: 상태 스냅샷용 Gateway 비밀번호.
- `--timeout <ms>`: status/health 스냅샷 타임아웃(기본값 `3000`).
- `--no-stability-bundle`: 저장된 안정성 번들 조회를 건너뜁니다.
- `--json`: 기록된 경로, 크기, manifest를 JSON으로 출력합니다.

이 export에는 manifest, Markdown 요약, config shape, 정제된 config 세부 정보, 정제된 로그 요약, 정제된 Gateway status/health 스냅샷, 그리고 존재하는 경우 최신 안정성 번들이 포함됩니다.

이 파일은 공유를 목적으로 합니다. 디버깅에 도움이 되는 운영 세부 정보는 유지합니다. 예를 들면 안전한 OpenClaw 로그 필드, subsystem 이름, status code, duration, 구성된 mode, port, plugin id, provider id, 비밀이 아닌 기능 설정, redact된 운영 로그 메시지 등이 있습니다. 채팅 텍스트, Webhook 본문, 도구 출력, credentials, 쿠키, 계정/메시지 식별자, 프롬프트/지시 텍스트, 호스트명, 비밀 값은 생략하거나 redact합니다. LogTape 스타일 메시지가 사용자/채팅/도구 payload 텍스트처럼 보이면 export는 메시지가 생략되었다는 사실과 바이트 수만 유지합니다.

### `gateway status`

`gateway status`는 Gateway 서비스(`launchd/systemd/schtasks`)와 연결성/인증 capability의 선택적 probe를 보여줍니다.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

옵션:

- `--url <url>`: 명시적 probe 대상을 추가합니다. 구성된 원격 + localhost도 계속 probe합니다.
- `--token <token>`: probe용 토큰 인증.
- `--password <password>`: probe용 비밀번호 인증.
- `--timeout <ms>`: probe 타임아웃(기본값 `10000`).
- `--no-probe`: 연결성 probe를 건너뜁니다(서비스 전용 보기).
- `--deep`: 시스템 수준 서비스도 스캔합니다.
- `--require-rpc`: 기본 연결성 probe를 읽기 probe로 강화하고, 해당 읽기 probe가 실패하면 0이 아닌 값으로 종료합니다. `--no-probe`와 함께 사용할 수 없습니다.

참고:

- `gateway status`는 로컬 CLI config가 없거나 잘못되어도 진단용으로 계속 사용할 수 있습니다.
- 기본 `gateway status`는 서비스 상태, WebSocket 연결, 핸드셰이크 시점에 보이는 인증 capability를 증명합니다. 읽기/쓰기/관리 작업을 증명하지는 않습니다.
- `gateway status`는 가능하면 probe 인증을 위해 구성된 auth SecretRef를 확인합니다.
- 이 명령 경로에서 필수 auth SecretRef가 확인되지 않으면, `gateway status --json`은 probe 연결성/인증이 실패할 때 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 secret source를 해결하세요.
- probe가 성공하면 확인되지 않은 auth-ref 경고는 false positive를 피하기 위해 억제됩니다.
- 수신 중인 서비스만으로는 충분하지 않고 읽기 범위 RPC 호출도 정상이어야 하는 스크립트 및 자동화에서는 `--require-rpc`를 사용하세요.
- `--deep`은 추가 `launchd/systemd/schtasks` 설치를 best-effort로 스캔합니다. Gateway와 유사한 서비스가 여러 개 감지되면 사람용 출력은 정리 힌트를 출력하고, 대부분의 설정은 머신당 하나의 gateway를 실행해야 한다고 경고합니다.
- 사람용 출력에는 profile 또는 state-dir drift 진단에 도움이 되도록 확인된 파일 로그 경로와 CLI 대 서비스 config 경로/유효성 스냅샷이 포함됩니다.
- Linux systemd 설치에서는 서비스 인증 drift 검사가 unit의 `Environment=`와 `EnvironmentFile=` 값을 모두 읽습니다(`%h`, 따옴표가 있는 경로, 여러 파일, 선택적 `-` 파일 포함).
- Drift 검사는 병합된 런타임 env를 사용해 `gateway.auth.token` SecretRef를 확인합니다(서비스 명령 env 우선, 그다음 프로세스 env 폴백).
- 토큰 인증이 실질적으로 활성화되지 않은 경우(명시적 `gateway.auth.mode`가 `password`/`none`/`trusted-proxy`이거나, mode가 설정되지 않은 상태에서 password가 우선 가능하고 토큰 후보가 이길 수 없는 경우) 토큰 drift 검사는 config 토큰 확인을 건너뜁니다.

### `gateway probe`

`gateway probe`는 “모든 것을 디버그”하는 명령입니다. 항상 다음을 probe합니다:

- 구성된 원격 gateway(설정된 경우)
- localhost(loopback) **원격이 구성되어 있어도**

`--url`을 전달하면 그 명시적 대상이 둘보다 앞에 추가됩니다. 사람용 출력은
대상을 다음과 같이 표시합니다:

- `URL (explicit)`
- `Remote (configured)` 또는 `Remote (configured, inactive)`
- `local loopback`

여러 Gateway에 도달 가능하면 모두 출력합니다. 격리된 profile/port(예: rescue bot)를 사용하면 여러 Gateway도 지원되지만, 대부분의 설치는 여전히 단일 gateway를 실행합니다.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

해석:

- `Reachable: yes`는 적어도 하나의 대상이 WebSocket 연결을 수락했음을 의미합니다.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`는 probe가 인증에 대해 증명할 수 있었던 범위를 보고합니다. 이는 도달 가능성과는 별개입니다.
- `Read probe: ok`는 읽기 범위 상세 RPC 호출(`health`/`status`/`system-presence`/`config.get`)도 성공했음을 의미합니다.
- `Read probe: limited - missing scope: operator.read`는 연결은 성공했지만 읽기 범위 RPC가 제한됨을 의미합니다. 이는 완전한 실패가 아니라 **degraded** 도달 가능성으로 보고됩니다.
- 종료 코드는 probe한 대상 중 도달 가능한 대상이 하나도 없을 때만 0이 아닙니다.

JSON 참고(`--json`):

- 최상위:
  - `ok`: 적어도 하나의 대상에 도달 가능합니다.
  - `degraded`: 적어도 하나의 대상에서 범위 제한이 있는 상세 RPC가 있었습니다.
  - `capability`: 도달 가능한 대상 전체에서 확인된 최상의 capability(`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, 또는 `unknown`).
  - `primaryTargetId`: 다음 순서로 활성 우선 대상으로 간주할 최적 대상: 명시적 URL, SSH 터널, 구성된 원격, 그다음 local loopback.
  - `warnings[]`: `code`, `message`, 선택적 `targetIds`를 가진 best-effort 경고 레코드입니다.
  - `network`: 현재 config와 호스트 네트워킹에서 파생된 local loopback/tailnet URL 힌트입니다.
  - `discovery.timeoutMs` 및 `discovery.count`: 이번 probe 패스에 실제로 사용된 discovery 예산/결과 수입니다.
- 대상별(`targets[].connect`):
  - `ok`: connect + degraded 분류 이후의 도달 가능성입니다.
  - `rpcOk`: 전체 상세 RPC 성공입니다.
  - `scopeLimited`: `operator.read` 범위가 없어 상세 RPC가 실패했습니다.
- 대상별(`targets[].auth`):
  - `role`: 사용 가능할 때 `hello-ok`에서 보고된 인증 역할입니다.
  - `scopes`: 사용 가능할 때 `hello-ok`에서 보고된 부여된 범위입니다.
  - `capability`: 해당 대상에 대해 노출된 인증 capability 분류입니다.

일반적인 경고 코드:

- `ssh_tunnel_failed`: SSH 터널 설정에 실패했으며, 명령은 직접 probe로 폴백했습니다.
- `multiple_gateways`: 둘 이상의 대상에 도달 가능했습니다. rescue bot 같은 격리된 profile을 의도적으로 실행하는 경우가 아니라면 이는 드문 상황입니다.
- `auth_secretref_unresolved`: 구성된 인증 SecretRef를 실패한 대상에 대해 확인할 수 없었습니다.
- `probe_scope_limited`: WebSocket 연결은 성공했지만 읽기 probe가 `operator.read` 범위 부족으로 제한되었습니다.

#### SSH를 통한 원격(Mac 앱 parity)

macOS 앱의 “Remote over SSH” 모드는 로컬 포트 포워딩을 사용하므로
원격 gateway(loopback에만 바인딩되어 있을 수 있음)에 `ws://127.0.0.1:<port>`로 도달할 수 있게 됩니다.

CLI 대응:

```bash
openclaw gateway probe --ssh user@gateway-host
```

옵션:

- `--ssh <target>`: `user@host` 또는 `user@host:port`(포트 기본값은 `22`).
- `--ssh-identity <path>`: identity 파일.
- `--ssh-auto`: 확인된 discovery 엔드포인트(`local.` 및 설정된 경우 wide-area domain)에서
  발견된 첫 번째 gateway 호스트를 SSH 대상으로 선택합니다. TXT 전용
  힌트는 무시됩니다.

config(선택 사항, 기본값으로 사용됨):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

저수준 RPC helper입니다.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

옵션:

- `--params <json>`: params용 JSON 객체 문자열(기본값 `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

참고:

- `--params`는 유효한 JSON이어야 합니다.
- `--expect-final`은 최종 payload 전에 중간 이벤트를 스트리밍하는 agent 스타일 RPC에 주로 사용됩니다.

## Gateway 서비스 관리

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

명령 옵션:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

참고:

- `gateway install`은 `--port`, `--runtime`, `--token`, `--force`, `--json`을 지원합니다.
- 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `gateway install`은 SecretRef가 확인 가능한지 검증하지만 확인된 토큰을 서비스 environment 메타데이터에 영구 저장하지는 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 확인되지 않으면, install은 폴백 평문을 저장하는 대신 fail closed됩니다.
- `gateway run`에서 비밀번호 인증을 사용할 때는 인라인 `--password`보다 `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, 또는 SecretRef 기반 `gateway.auth.password`를 권장합니다.
- 추론된 인증 모드에서는 shell 전용 `OPENCLAW_GATEWAY_PASSWORD`가 install 토큰 요구 사항을 완화하지 않습니다. 관리형 서비스를 설치할 때는 영구 config(`gateway.auth.password` 또는 config `env`)를 사용하세요.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, mode를 명시적으로 설정할 때까지 install은 차단됩니다.
- 라이프사이클 명령은 스크립팅을 위해 `--json`을 허용합니다.

## Gateway 검색(Bonjour)

`gateway discover`는 Gateway 비컨(`_openclaw-gw._tcp`)을 스캔합니다.

- 멀티캐스트 DNS-SD: `local.`
- 유니캐스트 DNS-SD(Wide-Area Bonjour): 도메인(예: `openclaw.internal.`)을 선택하고 split DNS + DNS 서버를 설정하세요. [/gateway/bonjour](/ko/gateway/bonjour) 참조

Bonjour discovery가 활성화된 Gateway만(기본값) 비컨을 광고합니다.

Wide-Area discovery 레코드에는 다음(TXT)이 포함됩니다:

- `role`(gateway 역할 힌트)
- `transport`(전송 힌트, 예: `gateway`)
- `gatewayPort`(WebSocket 포트, 보통 `18789`)
- `sshPort`(선택 사항. 없으면 클라이언트는 기본 SSH 대상을 `22`로 사용)
- `tailnetDns`(사용 가능할 때 MagicDNS 호스트명)
- `gatewayTls` / `gatewayTlsSha256`(TLS 활성화 + 인증서 지문)
- `cliPath`(wide-area zone에 기록되는 원격 설치 힌트)

### `gateway discover`

```bash
openclaw gateway discover
```

옵션:

- `--timeout <ms>`: 명령별 타임아웃(browse/resolve). 기본값 `2000`.
- `--json`: 기계 판독용 출력(스타일/스피너도 비활성화).

예시:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

참고:

- CLI는 `local.`과 활성화된 경우 구성된 wide-area domain을 함께 스캔합니다.
- JSON 출력의 `wsUrl`은 `lanHost` 또는 `tailnetDns` 같은 TXT 전용
  힌트가 아니라 확인된 서비스 엔드포인트에서 파생됩니다.
- `local.` mDNS에서는 `discovery.mdns.mode`가 `full`일 때만 `sshPort`와 `cliPath`가 브로드캐스트됩니다.
  Wide-area DNS-SD는 여전히 `cliPath`를 기록하며, `sshPort`도 그쪽에서는 계속 선택 사항입니다.
