---
read_when:
    - CLI에서 Gateway 실행하기(dev 또는 서버)
    - Gateway 인증, 바인드 모드 및 연결 디버깅하기
    - Bonjour를 통한 Gateway 검색(local + 와이드 에어리어 DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway 실행, 조회 및 검색
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Gateway는 OpenClaw의 WebSocket 서버입니다(채널, nodes, 세션, hooks). 이 페이지의 하위 명령은 `openclaw gateway …` 아래에 있습니다.

<CardGroup cols={3}>
  <Card title="Bonjour 검색" href="/ko/gateway/bonjour">
    로컬 mDNS + 와이드 에어리어 DNS-SD 설정.
  </Card>
  <Card title="검색 개요" href="/ko/gateway/discovery">
    OpenClaw가 Gateway를 광고하고 찾는 방법.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration">
    최상위 Gateway config 키.
  </Card>
</CardGroup>

## Gateway 실행

로컬 Gateway 프로세스를 실행합니다.

```bash
openclaw gateway
```

포그라운드 별칭:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="시작 동작">
    - 기본적으로 Gateway는 `~/.openclaw/openclaw.json`에 `gateway.mode=local`이 설정되지 않으면 시작을 거부합니다. 임시/dev 실행에는 `--allow-unconfigured`를 사용하세요.
    - `openclaw onboard --mode local` 및 `openclaw setup`은 `gateway.mode=local`을 기록해야 합니다. 파일이 존재하지만 `gateway.mode`가 없으면 이를 암시적으로 로컬 모드로 가정하지 말고 손상되었거나 덮어써진 config로 간주하고 복구하세요.
    - 파일이 존재하고 `gateway.mode`가 없으면 Gateway는 이를 의심스러운 config 손상으로 간주하고 자동으로 "로컬로 추정"하지 않습니다.
    - 인증 없이 loopback을 넘어서 바인딩하는 것은 차단됩니다(안전 가드레일).
    - `SIGUSR1`은 권한이 있을 때 인프로세스 재시작을 트리거합니다(`commands.restart`는 기본적으로 활성화되어 있으며, 수동 재시작을 막으려면 `commands.restart: false`를 설정하세요. gateway tool/config apply/update는 계속 허용됩니다).
    - `SIGINT`/`SIGTERM` 핸들러는 gateway 프로세스를 중지하지만 사용자 지정 터미널 상태는 복원하지 않습니다. TUI 또는 raw-mode 입력으로 CLI를 감쌌다면 종료 전에 터미널을 복원하세요.
  </Accordion>
</AccordionGroup>

### 옵션

<ParamField path="--port <port>" type="number">
  WebSocket 포트(config/env에서 기본값을 가져오며, 일반적으로 `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  리스너 바인드 모드.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  인증 모드 override.
</ParamField>
<ParamField path="--token <token>" type="string">
  토큰 override(프로세스에 `OPENCLAW_GATEWAY_TOKEN`도 설정).
</ParamField>
<ParamField path="--password <password>" type="string">
  비밀번호 override.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  파일에서 gateway 비밀번호를 읽습니다.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Tailscale을 통해 Gateway를 노출합니다.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  종료 시 Tailscale serve/funnel config를 재설정합니다.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  config에 `gateway.mode=local`이 없어도 gateway 시작을 허용합니다. 임시/dev bootstrap에 대해서만 시작 가드를 우회하며, config 파일을 기록하거나 복구하지는 않습니다.
</ParamField>
<ParamField path="--dev" type="boolean">
  없으면 dev config + 워크스페이스를 생성합니다(`BOOTSTRAP.md` 건너뜀).
</ParamField>
<ParamField path="--reset" type="boolean">
  dev config + 자격 증명 + 세션 + 워크스페이스를 재설정합니다(`--dev` 필요).
</ParamField>
<ParamField path="--force" type="boolean">
  시작 전에 선택한 포트의 기존 리스너를 종료합니다.
</ParamField>
<ParamField path="--verbose" type="boolean">
  상세 로그.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  콘솔에 CLI 백엔드 로그만 표시합니다(stdout/stderr 활성화).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket 로그 스타일.
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact`의 별칭.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  원시 모델 스트림 이벤트를 jsonl로 기록합니다.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  원시 스트림 jsonl 경로.
</ParamField>

<Warning>
인라인 `--password`는 로컬 프로세스 목록에 노출될 수 있습니다. `--password-file`, env 또는 SecretRef 기반 `gateway.auth.password`를 선호하세요.
</Warning>

### 시작 프로파일링

- Gateway 시작 중 단계별 타이밍을 기록하려면 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`을 설정하세요.
- Gateway 시작 벤치마크를 실행하려면 `pnpm test:startup:gateway -- --runs 5 --warmup 1`을 사용하세요. 이 벤치마크는 첫 프로세스 출력, `/healthz`, `/readyz`, 시작 trace 타이밍을 기록합니다.

## 실행 중인 Gateway 조회

모든 조회 명령은 WebSocket RPC를 사용합니다.

<Tabs>
  <Tab title="출력 모드">
    - 기본값: 사람이 읽기 쉬운 형식(TTY에서는 색상 포함).
    - `--json`: 기계 판독 가능한 JSON(스타일/스피너 없음).
    - `--no-color`(또는 `NO_COLOR=1`): 인간용 레이아웃은 유지하면서 ANSI 비활성화.
  </Tab>
  <Tab title="공통 옵션">
    - `--url <url>`: Gateway WebSocket URL.
    - `--token <token>`: Gateway 토큰.
    - `--password <password>`: Gateway 비밀번호.
    - `--timeout <ms>`: timeout/budget(명령별로 다름).
    - `--expect-final`: "final" 응답을 기다립니다(에이전트 호출).
  </Tab>
</Tabs>

<Note>
`--url`을 설정하면 CLI는 config 또는 환경 자격 증명으로 fallback하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하세요. 명시적 자격 증명이 없으면 오류입니다.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 엔드포인트는 liveness probe입니다. 서버가 HTTP에 응답할 수 있게 되면 반환됩니다. HTTP `/readyz` 엔드포인트는 더 엄격하며, 시작 sidecar, 채널 또는 구성된 hooks가 아직 안정화 중이면 계속 red 상태를 유지합니다.

### `gateway usage-cost`

세션 로그에서 usage-cost 요약을 가져옵니다.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  포함할 일 수.
</ParamField>

### `gateway stability`

실행 중인 Gateway에서 최근 진단 stability recorder를 가져옵니다.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  포함할 최근 이벤트의 최대 수(최대 `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  `payload.large` 또는 `diagnostic.memory.pressure` 같은 진단 이벤트 유형으로 필터링합니다.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  특정 진단 시퀀스 번호 이후의 이벤트만 포함합니다.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  실행 중인 Gateway를 호출하는 대신 저장된 stability bundle을 읽습니다. 상태 디렉터리 아래 최신 bundle에는 `--bundle latest`(또는 그냥 `--bundle`)를 사용하거나, bundle JSON 경로를 직접 전달하세요.
</ParamField>
<ParamField path="--export" type="boolean">
  stability 세부 정보를 출력하는 대신 공유 가능한 지원 진단 zip을 기록합니다.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export`의 출력 경로.
</ParamField>

<AccordionGroup>
  <Accordion title="개인정보 보호 및 bundle 동작">
    - 기록은 운영 메타데이터를 유지합니다: 이벤트 이름, 횟수, 바이트 크기, 메모리 판독값, 큐/세션 상태, 채널/plugin 이름, redacted된 세션 요약. 채팅 텍스트, Webhook 본문, 도구 출력, 원시 요청/응답 본문, 토큰, 쿠키, 비밀 값, 호스트명, 원시 세션 ID는 유지하지 않습니다. recorder를 완전히 비활성화하려면 `diagnostics.enabled: false`를 설정하세요.
    - recorder에 이벤트가 있을 경우, 치명적인 Gateway 종료, 종료 timeout, 재시작 시작 실패 시 OpenClaw는 동일한 진단 스냅샷을 `~/.openclaw/logs/stability/openclaw-stability-*.json`에 기록합니다. 최신 bundle은 `openclaw gateway stability --bundle latest`로 검사하세요. `--limit`, `--type`, `--since-seq`도 bundle 출력에 적용됩니다.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

버그 리포트에 첨부하도록 설계된 로컬 diagnostics zip을 기록합니다. 개인정보 보호 모델과 bundle 내용은 [Diagnostics Export](/ko/gateway/diagnostics)를 참조하세요.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  출력 zip 경로. 기본값은 상태 디렉터리 아래의 지원 export입니다.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  포함할 최대 정제된 로그 줄 수.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  검사할 최대 로그 바이트 수.
</ParamField>
<ParamField path="--url <url>" type="string">
  상태 스냅샷용 Gateway WebSocket URL.
</ParamField>
<ParamField path="--token <token>" type="string">
  상태 스냅샷용 Gateway 토큰.
</ParamField>
<ParamField path="--password <password>" type="string">
  상태 스냅샷용 Gateway 비밀번호.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  상태/health 스냅샷 timeout.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  저장된 stability bundle 조회를 건너뜁니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기록된 경로, 크기, manifest를 JSON으로 출력합니다.
</ParamField>

이 export에는 manifest, Markdown 요약, config 형태, 정제된 config 세부 정보, 정제된 로그 요약, 정제된 Gateway status/health 스냅샷, 그리고 존재할 경우 최신 stability bundle이 포함됩니다.

공유를 위한 용도입니다. 안전한 OpenClaw 로그 필드, 서브시스템 이름, 상태 코드, 지속 시간, 구성된 모드, 포트, plugin ID, provider ID, 비밀이 아닌 기능 설정, redacted된 운영 로그 메시지 같은 디버깅에 도움이 되는 운영 세부 정보를 유지합니다. 채팅 텍스트, Webhook 본문, 도구 출력, 자격 증명, 쿠키, 계정/메시지 식별자, prompt/instruction 텍스트, 호스트명, 비밀 값은 생략하거나 redacted 처리합니다. LogTape 스타일 메시지가 사용자/채팅/도구 payload 텍스트처럼 보이면, export는 메시지가 생략되었다는 사실과 바이트 수만 유지합니다.

### `gateway status`

`gateway status`는 Gateway 서비스(launchd/systemd/schtasks)와 선택적 연결/인증 기능 probe를 보여줍니다.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  명시적인 probe 대상을 추가합니다. 구성된 원격 + localhost도 계속 probe합니다.
</ParamField>
<ParamField path="--token <token>" type="string">
  probe용 토큰 인증.
</ParamField>
<ParamField path="--password <password>" type="string">
  probe용 비밀번호 인증.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe timeout.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  연결 probe를 건너뜁니다(서비스 전용 보기).
</ParamField>
<ParamField path="--deep" type="boolean">
  시스템 수준 서비스도 스캔합니다.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  기본 연결 probe를 읽기 probe로 올리고, 해당 읽기 probe가 실패하면 0이 아닌 값으로 종료합니다. `--no-probe`와 함께 사용할 수 없습니다.
</ParamField>

<AccordionGroup>
  <Accordion title="상태 의미">
    - `gateway status`는 로컬 CLI config가 없거나 유효하지 않아도 진단용으로 계속 사용할 수 있습니다.
    - 기본 `gateway status`는 서비스 상태, WebSocket 연결, 핸드셰이크 시점에 보이는 인증 기능을 증명합니다. 읽기/쓰기/관리 작업까지 증명하지는 않습니다.
    - 진단 probe는 최초 device 인증에 대해 비변경 방식입니다. 기존 캐시된 device token이 있으면 이를 재사용하지만, 상태 확인만을 위해 새 CLI device ID나 읽기 전용 device pairing 레코드를 만들지는 않습니다.
    - `gateway status`는 가능한 경우 probe 인증을 위해 구성된 인증 SecretRef를 해석합니다.
    - 이 명령 경로에서 필요한 인증 SecretRef를 해석할 수 없으면, probe 연결/인증이 실패할 때 `gateway status --json`은 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 secret 소스를 해석하세요.
    - probe가 성공하면 unresolved auth-ref 경고는 false positive를 피하기 위해 숨겨집니다.
    - 스크립트 및 자동화에서는 단순히 서비스가 수신 대기 중인 것만으로는 충분하지 않고 읽기 범위 RPC 호출도 정상이어야 할 때 `--require-rpc`를 사용하세요.
    - `--deep`은 추가 launchd/systemd/schtasks 설치를 최선형 방식으로 스캔합니다. gateway처럼 보이는 서비스가 여러 개 감지되면, 인간용 출력은 정리 힌트를 표시하고 대부분의 설정은 머신당 gateway 하나를 실행해야 한다고 경고합니다.
    - 인간용 출력에는 프로필 또는 state-dir 드리프트 진단에 도움이 되도록 해석된 파일 로그 경로와 CLI 대 서비스 config 경로/유효성 스냅샷이 포함됩니다.
  </Accordion>
  <Accordion title="Linux systemd auth-drift 검사">
    - Linux systemd 설치에서 서비스 인증 드리프트 검사는 유닛의 `Environment=`와 `EnvironmentFile=` 값을 모두 읽습니다(`%h`, 인용된 경로, 여러 파일, 선택적 `-` 파일 포함).
    - 드리프트 검사는 병합된 런타임 env를 사용해 `gateway.auth.token` SecretRef를 해석합니다(서비스 명령 env 우선, 이후 프로세스 env fallback).
    - 토큰 인증이 사실상 활성화되지 않은 경우(명시적 `gateway.auth.mode`가 `password`/`none`/`trusted-proxy`이거나, mode가 설정되지 않았고 password가 우선될 수 있으며 token 후보가 우선될 수 없는 경우), 토큰 드리프트 검사는 config 토큰 해석을 건너뜁니다.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`는 "모든 것을 디버그"하는 명령입니다. 항상 다음을 probe합니다.

- 구성된 원격 gateway(설정된 경우), 그리고
- localhost(loopback) — **원격이 구성되어 있어도**.

`--url`을 전달하면 해당 명시적 대상이 두 항목보다 앞에 추가됩니다. 인간용 출력은 대상을 다음과 같이 레이블링합니다.

- `URL (explicit)`
- `Remote (configured)` 또는 `Remote (configured, inactive)`
- `local loopback`

<Note>
여러 gateway에 도달할 수 있으면 모두 출력합니다. 격리된 프로필/포트(예: rescue bot)를 사용하는 경우 여러 gateway를 지원하지만, 대부분의 설치는 여전히 단일 gateway를 실행합니다.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="해석">
    - `Reachable: yes`는 적어도 하나의 대상이 WebSocket 연결을 수락했다는 뜻입니다.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`는 probe가 인증에 대해 증명할 수 있었던 내용을 보고합니다. 도달 가능성과는 별개입니다.
    - `Read probe: ok`는 읽기 범위 세부 RPC 호출(`health`/`status`/`system-presence`/`config.get`)도 성공했다는 뜻입니다.
    - `Read probe: limited - missing scope: operator.read`는 연결은 성공했지만 읽기 범위 RPC가 제한되었다는 뜻입니다. 이는 완전 실패가 아니라 **degraded** 도달 가능성으로 보고됩니다.
    - `gateway status`와 마찬가지로 probe는 기존 캐시된 device 인증을 재사용하지만, 최초 device ID나 pairing 상태를 만들지는 않습니다.
    - 종료 코드는 probe된 대상 중 어느 것도 도달할 수 없을 때만 0이 아닌 값입니다.
  </Accordion>
  <Accordion title="JSON 출력">
    최상위:

    - `ok`: 적어도 하나의 대상에 도달 가능.
    - `degraded`: 적어도 하나의 대상에서 범위 제한된 세부 RPC가 발생함.
    - `capability`: 도달 가능한 대상 전체에서 관찰된 최상의 기능 (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, 또는 `unknown`).
    - `primaryTargetId`: 다음 순서로 활성 우승자로 간주할 최적 대상: 명시적 URL, SSH 터널, 구성된 원격, 로컬 loopback.
    - `warnings[]`: `code`, `message`, 선택적 `targetIds`를 포함한 최선형 경고 레코드.
    - `network`: 현재 config와 호스트 네트워킹에서 파생된 로컬 loopback/tailnet URL 힌트.
    - `discovery.timeoutMs` 및 `discovery.count`: 이번 probe 패스에 사용된 실제 검색 예산/결과 수.

    대상별 (`targets[].connect`):

    - `ok`: 연결 + degraded 분류 이후의 도달 가능성.
    - `rpcOk`: 전체 세부 RPC 성공.
    - `scopeLimited`: `operator.read` 범위가 없어 세부 RPC 실패.

    대상별 (`targets[].auth`):

    - `role`: 가능할 때 `hello-ok`에 보고된 인증 역할.
    - `scopes`: 가능할 때 `hello-ok`에 보고된 부여 범위.
    - `capability`: 해당 대상에 대해 노출된 인증 기능 분류.

  </Accordion>
  <Accordion title="일반적인 경고 코드">
    - `ssh_tunnel_failed`: SSH 터널 설정 실패; 명령이 직접 probe로 fallback함.
    - `multiple_gateways`: 둘 이상의 대상에 도달 가능했음; rescue bot처럼 의도적으로 격리된 프로필을 실행하지 않는 한 일반적이지 않음.
    - `auth_secretref_unresolved`: 실패한 대상에 대해 구성된 인증 SecretRef를 해석할 수 없음.
    - `probe_scope_limited`: WebSocket 연결은 성공했지만 읽기 probe가 `operator.read` 부족으로 제한됨.
  </Accordion>
</AccordionGroup>

#### SSH를 통한 원격(Mac 앱과 동일 동작)

macOS 앱의 "Remote over SSH" 모드는 로컬 포트 포워드를 사용하므로 원격 gateway(루프백에만 바인딩되어 있을 수 있음)에 `ws://127.0.0.1:<port>`로 도달할 수 있습니다.

CLI 동등 명령:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 또는 `user@host:port`(포트 기본값은 `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ID 파일.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  해석된 검색 엔드포인트(`local.` 및 구성된 와이드 에어리어 도메인(있는 경우))에서 검색된 첫 번째 gateway 호스트를 SSH 대상으로 선택합니다. TXT 전용 힌트는 무시됩니다.
</ParamField>

config(선택 사항, 기본값으로 사용됨):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

저수준 RPC 헬퍼입니다.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params용 JSON 객체 문자열.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway 토큰.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway 비밀번호.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Timeout 예산.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  주로 최종 payload 전에 중간 이벤트를 스트리밍하는 에이전트 스타일 RPC용입니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기계 판독 가능한 JSON 출력.
</ParamField>

<Note>
`--params`는 유효한 JSON이어야 합니다.
</Note>

## Gateway 서비스 관리

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="명령 옵션">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="서비스 설치 및 라이프사이클 참고 사항">
    - `gateway install`은 `--port`, `--runtime`, `--token`, `--force`, `--json`을 지원합니다.
    - 관리형 서비스를 재시작하려면 `gateway restart`를 사용하세요. 재시작 대용으로 `gateway stop`과 `gateway start`를 연달아 사용하지 마세요. macOS에서 `gateway stop`은 중지 전에 LaunchAgent를 의도적으로 비활성화합니다.
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `gateway install`은 SecretRef 해석 가능 여부를 검증하지만 해석된 토큰을 서비스 env 메타데이터에 저장하지는 않습니다.
    - 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef를 해석할 수 없으면, 설치는 fallback 일반 텍스트를 저장하는 대신 실패 닫힘 방식으로 중단됩니다.
    - `gateway run`에서 비밀번호 인증을 사용할 때는 인라인 `--password`보다 `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, 또는 SecretRef 기반 `gateway.auth.password`를 선호하세요.
    - 추론된 인증 모드에서는 셸 전용 `OPENCLAW_GATEWAY_PASSWORD`가 설치 토큰 요구 사항을 완화하지 않습니다. 관리형 서비스를 설치할 때는 지속성 config(`gateway.auth.password` 또는 config `env`)를 사용하세요.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않았다면, mode를 명시적으로 설정할 때까지 설치가 차단됩니다.
    - 라이프사이클 명령은 스크립팅용으로 `--json`을 지원합니다.
  </Accordion>
</AccordionGroup>

## Gateway 검색(Bonjour)

`gateway discover`는 Gateway 비콘(`_openclaw-gw._tcp`)을 스캔합니다.

- 멀티캐스트 DNS-SD: `local.`
- 유니캐스트 DNS-SD(Wide-Area Bonjour): 도메인을 선택하고(예: `openclaw.internal.`) split DNS + DNS 서버를 설정합니다. [Bonjour](/ko/gateway/bonjour)를 참조하세요.

Bonjour 검색이 활성화된 gateway만(기본값) 비콘을 광고합니다.

Wide-Area 검색 레코드에는 다음(TXT)이 포함됩니다.

- `role` (gateway 역할 힌트)
- `transport` (전송 힌트, 예: `gateway`)
- `gatewayPort` (WebSocket 포트, 보통 `18789`)
- `sshPort` (선택 사항; 없으면 클라이언트는 기본 SSH 대상 포트로 `22`를 사용)
- `tailnetDns` (가능할 때 MagicDNS 호스트명)
- `gatewayTls` / `gatewayTlsSha256` (TLS 활성화 + 인증서 지문)
- `cliPath` (와이드 에어리어 zone에 기록되는 원격 설치 힌트)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  명령별 timeout (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  기계 판독 가능한 출력(스타일/스피너도 비활성화).
</ParamField>

예시:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI는 활성화된 경우 `local.`과 구성된 와이드 에어리어 도메인을 함께 스캔합니다.
- JSON 출력의 `wsUrl`은 `lanHost` 또는 `tailnetDns` 같은 TXT 전용 힌트가 아니라 해석된 서비스 엔드포인트에서 파생됩니다.
- `local.` mDNS에서는 `discovery.mdns.mode`가 `full`일 때만 `sshPort`와 `cliPath`가 브로드캐스트됩니다. Wide-Area DNS-SD는 여전히 `cliPath`를 기록하며, `sshPort`도 সেখানে 선택 사항으로 남습니다.
</Note>

## 관련 항목

- [CLI reference](/ko/cli)
- [Gateway runbook](/ko/gateway)
