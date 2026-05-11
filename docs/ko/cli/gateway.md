---
read_when:
    - CLI에서 Gateway 실행하기(개발 또는 서버)
    - Gateway 인증, 바인드 모드 및 연결성 디버깅
    - Bonjour를 통한 Gateway 발견(로컬 + 광역 DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway 실행, 조회 및 검색
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:26:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

The Gateway는 OpenClaw의 WebSocket 서버입니다(채널, 노드, 세션, 훅). 이 페이지의 하위 명령은 `openclaw gateway …` 아래에 있습니다.

<CardGroup cols={3}>
  <Card title="Bonjour 검색" href="/ko/gateway/bonjour">
    로컬 mDNS + 광역 DNS-SD 설정.
  </Card>
  <Card title="검색 개요" href="/ko/gateway/discovery">
    OpenClaw가 Gateway를 알리고 찾는 방식.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration">
    최상위 Gateway 구성 키.
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
    - 기본적으로 Gateway는 `~/.openclaw/openclaw.json`에 `gateway.mode=local`이 설정되어 있지 않으면 시작을 거부합니다. 임시/개발 실행에는 `--allow-unconfigured`를 사용하세요.
    - `openclaw onboard --mode local` 및 `openclaw setup`은 `gateway.mode=local`을 쓰는 것이 기대됩니다. 파일은 있지만 `gateway.mode`가 없으면, 이를 로컬 모드로 암묵적으로 가정하지 말고 손상되었거나 덮어쓴 구성으로 보고 복구하세요.
    - 파일은 있지만 `gateway.mode`가 없으면, Gateway는 이를 의심스러운 구성 손상으로 간주하고 사용자를 대신해 "guess local"하지 않습니다.
    - 인증 없이 루프백을 넘어 바인딩하는 것은 차단됩니다(안전 가드레일).
    - `SIGUSR1`은 승인된 경우 프로세스 내 재시작을 트리거합니다(`commands.restart`는 기본적으로 활성화됨. 수동 재시작을 차단하려면 `commands.restart: false`를 설정하되, Gateway 도구/구성 적용/업데이트는 계속 허용됨).
    - `SIGINT`/`SIGTERM` 핸들러는 Gateway 프로세스를 중지하지만, 사용자 지정 터미널 상태를 복원하지는 않습니다. CLI를 TUI 또는 원시 모드 입력으로 감싼 경우 종료 전에 터미널을 복원하세요.

  </Accordion>
</AccordionGroup>

### 옵션

<ParamField path="--port <port>" type="number">
  WebSocket 포트(기본값은 구성/env에서 가져오며, 일반적으로 `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  리스너 바인드 모드.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  인증 모드 재정의.
</ParamField>
<ParamField path="--token <token>" type="string">
  토큰 재정의(프로세스에 `OPENCLAW_GATEWAY_TOKEN`도 설정).
</ParamField>
<ParamField path="--password <password>" type="string">
  비밀번호 재정의.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  파일에서 Gateway 비밀번호를 읽습니다.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Tailscale을 통해 Gateway를 노출합니다.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  종료 시 Tailscale serve/funnel 구성을 재설정합니다.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  구성에 `gateway.mode=local`이 없어도 Gateway 시작을 허용합니다. 임시/개발 부트스트랩 전용으로 시작 가드를 우회하며, 구성 파일을 쓰거나 복구하지 않습니다.
</ParamField>
<ParamField path="--dev" type="boolean">
  누락된 경우 개발 구성 + 워크스페이스를 생성합니다(BOOTSTRAP.md 건너뜀).
</ParamField>
<ParamField path="--reset" type="boolean">
  개발 구성 + 자격 증명 + 세션 + 워크스페이스를 재설정합니다(`--dev` 필요).
</ParamField>
<ParamField path="--force" type="boolean">
  시작 전에 선택한 포트의 기존 리스너를 종료합니다.
</ParamField>
<ParamField path="--verbose" type="boolean">
  자세한 로그.
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

## Gateway 재시작

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe`는 실행 중인 Gateway에 재시작 전에 활성 OpenClaw 작업을 사전 점검하도록 요청합니다. 대기 중인 작업, 응답 전달, 임베디드 실행 또는 작업 실행이 활성 상태이면 Gateway가 차단 요소를 보고하고, 중복된 안전 재시작 요청을 병합한 뒤, 활성 작업이 빠진 후 재시작합니다. 일반 `restart`는 호환성을 위해 기존 서비스 관리자 동작을 유지합니다. 즉시 재정의 경로를 명시적으로 원할 때만 `--force`를 사용하세요.

`openclaw gateway restart --safe --skip-deferral`은 `--safe`와 동일한 OpenClaw 인식 조정 재시작을 실행하지만, 활성 작업 지연 게이트를 우회하여 차단 요소가 보고되더라도 Gateway가 즉시 재시작을 내보내게 합니다. 지연이 멈춘 작업 실행에 고정되어 `--safe`만으로는 무기한 기다릴 때 운영자 탈출구로 사용하세요. `--skip-deferral`에는 `--safe`가 필요합니다.

<Warning>
인라인 `--password`는 로컬 프로세스 목록에 노출될 수 있습니다. `--password-file`, env 또는 SecretRef 기반 `gateway.auth.password`를 선호하세요.
</Warning>

### 시작 프로파일링

- Gateway 시작 중 단계별 타이밍을 기록하려면 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`을 설정하세요. 여기에는 단계별 `eventLoopMax` 지연과 설치된 인덱스, 매니페스트 레지스트리, 시작 계획, 소유자 맵 작업에 대한 Plugin 조회 테이블 타이밍이 포함됩니다.
- 외부 QA 하네스용 최선 노력 JSONL 시작 진단 타임라인을 쓰려면 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`와 함께 `OPENCLAW_DIAGNOSTICS=timeline`을 설정하세요. 구성에서 `diagnostics.flags: ["timeline"]`으로 플래그를 활성화할 수도 있습니다. 경로는 여전히 env로 제공됩니다. 이벤트 루프 샘플을 포함하려면 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`을 추가하세요.
- Gateway 시작을 벤치마크하려면 `pnpm test:startup:gateway -- --runs 5 --warmup 1`을 실행하세요. 벤치마크는 첫 프로세스 출력, `/healthz`, `/readyz`, 시작 추적 타이밍, 이벤트 루프 지연, Plugin 조회 테이블 타이밍 세부 정보를 기록합니다.

## 실행 중인 Gateway 쿼리

모든 쿼리 명령은 WebSocket RPC를 사용합니다.

<Tabs>
  <Tab title="출력 모드">
    - 기본값: 사람이 읽을 수 있는 형식(TTY에서 색상 표시).
    - `--json`: 기계가 읽을 수 있는 JSON(스타일/스피너 없음).
    - `--no-color`(또는 `NO_COLOR=1`): 사람용 레이아웃은 유지하면서 ANSI를 비활성화합니다.

  </Tab>
  <Tab title="공유 옵션">
    - `--url <url>`: Gateway WebSocket URL.
    - `--token <token>`: Gateway 토큰.
    - `--password <password>`: Gateway 비밀번호.
    - `--timeout <ms>`: 제한 시간/예산(명령마다 다름).
    - `--expect-final`: "final" 응답을 기다립니다(에이전트 호출).

  </Tab>
</Tabs>

<Note>
`--url`을 설정하면 CLI는 구성 또는 환경 자격 증명으로 폴백하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하세요. 명시적 자격 증명이 없으면 오류입니다.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 엔드포인트는 활성 상태 프로브입니다. 서버가 HTTP에 응답할 수 있으면 반환됩니다. HTTP `/readyz` 엔드포인트는 더 엄격하며, 시작 Plugin 사이드카, 채널 또는 구성된 훅이 아직 안정화 중이면 빨간색 상태로 유지됩니다. 로컬 또는 인증된 상세 준비 상태 응답에는 이벤트 루프 지연, 이벤트 루프 사용률, CPU 코어 비율, `degraded` 플래그가 포함된 `eventLoop` 진단 블록이 포함됩니다.

### `gateway usage-cost`

세션 로그에서 사용량 비용 요약을 가져옵니다.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  포함할 일수.
</ParamField>

### `gateway stability`

실행 중인 Gateway에서 최근 진단 안정성 레코더를 가져옵니다.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  포함할 최근 이벤트의 최대 개수(최대 `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  `payload.large` 또는 `diagnostic.memory.pressure` 같은 진단 이벤트 유형으로 필터링합니다.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  진단 시퀀스 번호 이후의 이벤트만 포함합니다.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  실행 중인 Gateway를 호출하는 대신 유지된 안정성 번들을 읽습니다. 상태 디렉터리 아래의 최신 번들은 `--bundle latest`(또는 그냥 `--bundle`)를 사용하거나, 번들 JSON 경로를 직접 전달하세요.
</ParamField>
<ParamField path="--export" type="boolean">
  안정성 세부 정보를 출력하는 대신 공유 가능한 지원 진단 zip을 씁니다.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export`의 출력 경로.
</ParamField>

<AccordionGroup>
  <Accordion title="개인정보 및 번들 동작">
    - 레코드는 운영 메타데이터를 유지합니다. 이벤트 이름, 개수, 바이트 크기, 메모리 측정값, 큐/세션 상태, 채널/Plugin 이름, 삭제 처리된 세션 요약입니다. 채팅 텍스트, Webhook 본문, 도구 출력, 원시 요청 또는 응답 본문, 토큰, 쿠키, 비밀 값, 호스트 이름 또는 원시 세션 ID는 유지하지 않습니다. 레코더를 완전히 비활성화하려면 `diagnostics.enabled: false`를 설정하세요.
    - 치명적인 Gateway 종료, 종료 제한 시간, 재시작 시작 실패 시, 레코더에 이벤트가 있으면 OpenClaw는 동일한 진단 스냅샷을 `~/.openclaw/logs/stability/openclaw-stability-*.json`에 씁니다. 최신 번들은 `openclaw gateway stability --bundle latest`로 검사하세요. `--limit`, `--type`, `--since-seq`도 번들 출력에 적용됩니다.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

버그 보고서에 첨부하도록 설계된 로컬 진단 zip을 씁니다. 개인정보 모델과 번들 내용은 [진단 내보내기](/ko/gateway/diagnostics)를 참조하세요.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  출력 zip 경로. 기본값은 상태 디렉터리 아래의 지원 내보내기입니다.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  포함할 정리된 로그 줄의 최대 개수.
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
  상태/헬스 스냅샷 제한 시간.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  유지된 안정성 번들 조회를 건너뜁니다.
</ParamField>
<ParamField path="--json" type="boolean">
  작성된 경로, 크기, 매니페스트를 JSON으로 출력합니다.
</ParamField>

내보내기에는 매니페스트, Markdown 요약, 구성 형태, 정리된 구성 세부 정보, 정리된 로그 요약, 정리된 Gateway 상태/헬스 스냅샷, 그리고 존재하는 경우 최신 안정성 번들이 포함됩니다.

공유를 염두에 둔 것입니다. 안전한 OpenClaw 로그 필드, 하위 시스템 이름, 상태 코드, 지속 시간, 구성된 모드, 포트, Plugin ID, 제공자 ID, 비밀이 아닌 기능 설정, 삭제 처리된 운영 로그 메시지 같은 디버깅에 도움이 되는 운영 세부 정보를 유지합니다. 채팅 텍스트, Webhook 본문, 도구 출력, 자격 증명, 쿠키, 계정/메시지 식별자, 프롬프트/지침 텍스트, 호스트 이름, 비밀 값은 생략하거나 삭제 처리합니다. LogTape 스타일 메시지가 사용자/채팅/도구 페이로드 텍스트처럼 보이면, 내보내기는 메시지가 생략되었다는 사실과 바이트 수만 유지합니다.

### `gateway status`

`gateway status`는 Gateway 서비스(launchd/systemd/schtasks)와 연결성/인증 기능에 대한 선택적 프로브를 표시합니다.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  명시적 프로브 대상을 추가합니다. 구성된 원격 + localhost도 계속 프로브됩니다.
</ParamField>
<ParamField path="--token <token>" type="string">
  프로브에 사용할 토큰 인증입니다.
</ParamField>
<ParamField path="--password <password>" type="string">
  프로브에 사용할 비밀번호 인증입니다.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  프로브 제한 시간입니다.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  연결성 프로브를 건너뜁니다(서비스 전용 보기).
</ParamField>
<ParamField path="--deep" type="boolean">
  시스템 수준 서비스도 스캔합니다.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  기본 연결성 프로브를 읽기 프로브로 업그레이드하고, 해당 읽기 프로브가 실패하면 0이 아닌 값으로 종료합니다. `--no-probe`와 함께 사용할 수 없습니다.
</ParamField>

<AccordionGroup>
  <Accordion title="상태 의미">
    - `gateway status`는 로컬 CLI 구성이 없거나 유효하지 않아도 진단용으로 계속 사용할 수 있습니다.
    - 기본 `gateway status`는 서비스 상태, WebSocket 연결, 핸드셰이크 시점에 보이는 인증 capability를 증명합니다. 읽기/쓰기/관리 작업은 증명하지 않습니다.
    - 진단 프로브는 최초 기기 인증에 대해 변경을 일으키지 않습니다. 기존에 캐시된 기기 토큰이 있으면 재사용하지만, 상태 확인만을 위해 새 CLI 기기 ID나 읽기 전용 기기 페어링 레코드를 만들지는 않습니다.
    - `gateway status`는 가능하면 프로브 인증에 사용할 구성된 인증 SecretRef를 해석합니다.
    - 이 명령 경로에서 필수 인증 SecretRef가 해석되지 않고 프로브 연결성/인증이 실패하면, `gateway status --json`은 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 secret 소스를 해석하세요.
    - 프로브가 성공하면 오탐을 피하기 위해 해석되지 않은 auth-ref 경고는 표시하지 않습니다.
    - 리스닝 서비스만으로 충분하지 않고 읽기 범위 RPC 호출도 정상이어야 하는 스크립트와 자동화에서는 `--require-rpc`를 사용하세요.
    - `--deep`은 추가 launchd/systemd/schtasks 설치를 최선의 방식으로 스캔합니다. 여러 Gateway 유사 서비스가 감지되면 사람이 읽는 출력에 정리 힌트를 출력하고, 대부분의 설정에서는 머신당 하나의 Gateway를 실행해야 한다고 경고합니다.
    - `--deep`은 서비스 프로세스가 외부 supervisor 재시작을 위해 정상적으로 종료된 경우 최근 Gateway supervisor 재시작 핸드오프도 보고합니다.
    - `--deep`은 Plugin 인식 모드(`pluginValidation: "full"`)에서 구성 검증을 실행하고, 구성된 Plugin manifest 경고(예: 누락된 채널 구성 메타데이터)를 표시해 설치 및 업데이트 smoke check가 이를 잡을 수 있게 합니다. 기본 `gateway status`는 Plugin 검증을 건너뛰는 빠른 읽기 전용 경로를 유지합니다.
    - 사람이 읽는 출력에는 프로필 또는 state-dir drift를 진단하는 데 도움이 되도록 해석된 파일 로그 경로와 CLI-vs-service 구성 경로/유효성 스냅샷이 포함됩니다.

  </Accordion>
  <Accordion title="Linux systemd 인증 drift 검사">
    - Linux systemd 설치에서는 서비스 인증 drift 검사가 unit의 `Environment=` 및 `EnvironmentFile=` 값을 모두 읽습니다(`%h`, 따옴표로 감싼 경로, 여러 파일, 선택적 `-` 파일 포함).
    - Drift 검사는 병합된 런타임 env(먼저 서비스 명령 env, 그다음 프로세스 env fallback)를 사용해 `gateway.auth.token` SecretRef를 해석합니다.
    - 토큰 인증이 사실상 활성 상태가 아닌 경우(명시적 `gateway.auth.mode`가 `password`/`none`/`trusted-proxy`이거나, 모드가 설정되지 않았고 비밀번호가 우선될 수 있으며 토큰 후보가 우선될 수 없는 경우) token-drift 검사는 구성 토큰 해석을 건너뜁니다.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`는 "모든 것을 디버그"하는 명령입니다. 항상 다음을 프로브합니다.

- 구성된 원격 Gateway(설정된 경우), 그리고
- 원격이 구성되어 있더라도 localhost(loopback).

`--url`을 전달하면 해당 명시적 대상이 둘보다 앞에 추가됩니다. 사람이 읽는 출력은 대상을 다음과 같이 표시합니다.

- `URL (explicit)`
- `Remote (configured)` 또는 `Remote (configured, inactive)`
- `Local loopback`

<Note>
여러 Gateway에 연결할 수 있으면 모두 출력합니다. 격리된 프로필/포트(예: rescue bot)를 사용하는 경우 여러 Gateway가 지원되지만, 대부분의 설치는 여전히 단일 Gateway를 실행합니다.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="해석">
    - `Reachable: yes`는 하나 이상의 대상이 WebSocket 연결을 수락했다는 의미입니다.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`는 프로브가 인증에 대해 증명할 수 있었던 내용을 보고합니다. 연결 가능성과는 별개입니다.
    - `Read probe: ok`는 읽기 범위 상세 RPC 호출(`health`/`status`/`system-presence`/`config.get`)도 성공했다는 의미입니다.
    - `Read probe: limited - missing scope: operator.read`는 연결은 성공했지만 읽기 범위 RPC가 제한되었다는 의미입니다. 이는 전체 실패가 아니라 **저하된** 연결 가능성으로 보고됩니다.
    - `Connect: ok` 이후의 `Read probe: failed`는 Gateway가 WebSocket 연결을 수락했지만 후속 읽기 진단이 시간 초과되었거나 실패했다는 의미입니다. 이 또한 연결할 수 없는 Gateway가 아니라 **저하된** 연결 가능성입니다.
    - `gateway status`와 마찬가지로 프로브는 기존에 캐시된 기기 인증을 재사용하지만, 최초 기기 ID나 페어링 상태를 만들지는 않습니다.
    - 종료 코드는 프로브된 대상 중 연결 가능한 대상이 없을 때만 0이 아닙니다.

  </Accordion>
  <Accordion title="JSON 출력">
    최상위 수준:

    - `ok`: 하나 이상의 대상에 연결할 수 있습니다.
    - `degraded`: 하나 이상의 대상이 연결을 수락했지만 전체 상세 RPC 진단을 완료하지 못했습니다.
    - `capability`: 연결 가능한 대상 전체에서 확인된 최상의 capability(`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` 또는 `unknown`).
    - `primaryTargetId`: 활성 승자로 취급할 최상의 대상이며, 순서는 명시적 URL, SSH tunnel, 구성된 원격, 그다음 local loopback입니다.
    - `warnings[]`: `code`, `message`, 선택적 `targetIds`가 포함된 최선의 경고 레코드입니다.
    - `network`: 현재 구성과 호스트 네트워킹에서 파생된 local loopback/tailnet URL 힌트입니다.
    - `discovery.timeoutMs` 및 `discovery.count`: 이 프로브 패스에 사용된 실제 discovery budget/결과 개수입니다.

    대상별(`targets[].connect`):

    - `ok`: 연결 + 저하 분류 이후의 연결 가능성입니다.
    - `rpcOk`: 전체 상세 RPC 성공입니다.
    - `scopeLimited`: 필요한 operator scope가 없어 상세 RPC가 실패했습니다.

    대상별(`targets[].auth`):

    - `role`: 사용 가능한 경우 `hello-ok`에서 보고된 인증 역할입니다.
    - `scopes`: 사용 가능한 경우 `hello-ok`에서 보고된 부여된 scope입니다.
    - `capability`: 해당 대상에 대해 표시된 인증 capability 분류입니다.

  </Accordion>
  <Accordion title="일반적인 경고 코드">
    - `ssh_tunnel_failed`: SSH tunnel 설정이 실패했습니다. 명령은 직접 프로브로 fallback했습니다.
    - `multiple_gateways`: 둘 이상의 대상에 연결할 수 있었습니다. rescue bot처럼 격리된 프로필을 의도적으로 실행하는 경우가 아니라면 일반적이지 않습니다.
    - `auth_secretref_unresolved`: 실패한 대상에 대해 구성된 인증 SecretRef를 해석할 수 없었습니다.
    - `probe_scope_limited`: WebSocket 연결은 성공했지만 읽기 프로브가 누락된 `operator.read` 때문에 제한되었습니다.

  </Accordion>
</AccordionGroup>

#### SSH를 통한 원격(Mac 앱과 동일)

macOS 앱의 "Remote over SSH" 모드는 로컬 port-forward를 사용하므로, loopback에만 바인딩되었을 수 있는 원격 Gateway에 `ws://127.0.0.1:<port>`에서 연결할 수 있습니다.

CLI 등가 명령:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 또는 `user@host:port`(포트 기본값은 `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ID 파일입니다.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  해석된 discovery endpoint(`local.`에 구성된 wide-area domain이 있으면 이를 더한 값)에서 발견된 첫 번째 Gateway 호스트를 SSH 대상으로 선택합니다. TXT 전용 힌트는 무시됩니다.
</ParamField>

구성(선택 사항, 기본값으로 사용됨):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

저수준 RPC helper입니다.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params용 JSON 객체 문자열입니다.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL입니다.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway 토큰입니다.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway 비밀번호입니다.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  제한 시간 budget입니다.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  주로 최종 payload 전에 중간 이벤트를 스트리밍하는 agent 스타일 RPC용입니다.
</ParamField>
<ParamField path="--json" type="boolean">
  머신이 읽을 수 있는 JSON 출력입니다.
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

### wrapper로 설치

관리되는 서비스가 다른 실행 파일을 통해 시작되어야 할 때 `--wrapper`를 사용하세요. 예를 들어
secrets manager shim 또는 run-as helper가 있습니다. wrapper는 일반 Gateway args를 받고
최종적으로 해당 args로 `openclaw` 또는 Node를 exec할 책임이 있습니다.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

환경을 통해 wrapper를 설정할 수도 있습니다. `gateway install`은 경로가
실행 가능한 파일인지 검증하고, wrapper를 서비스 `ProgramArguments`에 쓰며, 이후 강제 재설치, 업데이트, doctor
복구를 위해 서비스 환경에 `OPENCLAW_WRAPPER`를 유지합니다.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

유지된 wrapper를 제거하려면 재설치하는 동안 `OPENCLAW_WRAPPER`를 비우세요.

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="명령 옵션">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="수명 주기 동작">
    - 관리형 서비스를 다시 시작하려면 `gateway restart`를 사용하세요. 다시 시작 대체 수단으로 `gateway stop`과 `gateway start`를 연쇄 실행하지 마세요.
    - macOS에서 `gateway stop`은 기본적으로 `launchctl bootout`을 사용하며, 이는 비활성화를 영구 적용하지 않고 현재 부팅 세션에서 LaunchAgent를 제거합니다. KeepAlive 자동 복구는 이후 충돌에 대해 계속 활성 상태로 유지되며, `gateway start`는 수동 `launchctl enable` 없이도 깔끔하게 다시 활성화됩니다. Gateway가 다음 명시적 `gateway start` 전까지 다시 생성되지 않도록 KeepAlive와 RunAtLoad를 영구적으로 억제하려면 `--disable`을 전달하세요. 수동 중지가 재부팅 또는 시스템 재시작 후에도 유지되어야 할 때 이 옵션을 사용하세요.
    - `gateway restart --safe`는 실행 중인 Gateway에 활성 OpenClaw 작업을 사전 점검하도록 요청하고, 답장 전달, 임베디드 실행, 작업 실행이 모두 비워질 때까지 다시 시작을 지연합니다. `--safe`는 `--force` 또는 `--wait`와 함께 사용할 수 없습니다.
    - `gateway restart --wait 30s`는 해당 다시 시작에 대해 구성된 다시 시작 배출 예산을 재정의합니다. 단위 없는 숫자는 밀리초이며, `s`, `m`, `h` 같은 단위를 사용할 수 있습니다. `--wait 0`은 무기한 대기합니다.
    - `gateway restart --safe --skip-deferral`은 OpenClaw 인식 안전 다시 시작을 실행하지만 지연 게이트를 우회하므로, 차단 항목이 보고되더라도 Gateway가 즉시 다시 시작을 내보냅니다. 멈춘 작업 실행 지연을 위한 운영자 탈출 수단이며, `--safe`가 필요합니다.
    - `gateway restart --force`는 활성 작업 배출을 건너뛰고 즉시 다시 시작합니다. 운영자가 나열된 작업 차단 항목을 이미 검사했고 지금 Gateway를 되돌리려는 경우 사용하세요.
    - 수명 주기 명령은 스크립팅을 위해 `--json`을 허용합니다.

  </Accordion>
  <Accordion title="설치 시 인증 및 SecretRefs">
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `gateway install`은 SecretRef를 확인할 수 있는지 검증하지만 확인된 토큰을 서비스 환경 메타데이터에 영구 저장하지 않습니다.
    - 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef를 확인할 수 없는 경우, 설치는 대체 일반 텍스트를 영구 저장하는 대신 닫힌 상태로 실패합니다.
    - `gateway run`의 비밀번호 인증에는 인라인 `--password`보다 `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, 또는 SecretRef 기반 `gateway.auth.password`를 선호하세요.
    - 추론된 인증 모드에서는 셸 전용 `OPENCLAW_GATEWAY_PASSWORD`가 설치 토큰 요구 사항을 완화하지 않습니다. 관리형 서비스를 설치할 때는 지속 구성(`gateway.auth.password` 또는 구성 `env`)을 사용하세요.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 설치가 차단됩니다.

  </Accordion>
</AccordionGroup>

## Gateway 검색(Bonjour)

`gateway discover`는 Gateway 비콘(`_openclaw-gw._tcp`)을 검색합니다.

- 멀티캐스트 DNS-SD: `local.`
- 유니캐스트 DNS-SD(Wide-Area Bonjour): 도메인을 선택하고(예: `openclaw.internal.`) 분할 DNS와 DNS 서버를 설정하세요. [Bonjour](/ko/gateway/bonjour)를 참조하세요.

Bonjour 검색이 활성화된 Gateway(기본값)만 비콘을 알립니다.

Wide-Area 검색 레코드에는 다음이 포함됩니다(TXT).

- `role`(Gateway 역할 힌트)
- `transport`(전송 힌트, 예: `gateway`)
- `gatewayPort`(WebSocket 포트, 일반적으로 `18789`)
- `sshPort`(선택 사항, 없으면 클라이언트가 SSH 대상을 기본값 `22`로 사용)
- `tailnetDns`(사용 가능한 경우 MagicDNS 호스트 이름)
- `gatewayTls` / `gatewayTlsSha256`(TLS 활성화 여부 + 인증서 지문)
- `cliPath`(Wide-Area 영역에 기록되는 원격 설치 힌트)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  명령별 제한 시간(찾아보기/확인).
</ParamField>
<ParamField path="--json" type="boolean">
  기계 판독 가능 출력(스타일/스피너도 비활성화).
</ParamField>

예:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI는 `local.`과 구성된 Wide-Area 도메인이 활성화된 경우 그 도메인을 함께 검색합니다.
- JSON 출력의 `wsUrl`은 `lanHost` 또는 `tailnetDns` 같은 TXT 전용 힌트가 아니라 확인된 서비스 엔드포인트에서 파생됩니다.
- `local.` mDNS에서 `sshPort`와 `cliPath`는 `discovery.mdns.mode`가 `full`인 경우에만 브로드캐스트됩니다. Wide-Area DNS-SD는 여전히 `cliPath`를 기록하며, 그곳에서도 `sshPort`는 선택 사항으로 유지됩니다.

</Note>

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 런북](/ko/gateway)
