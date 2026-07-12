---
read_when:
    - CLI에서 Gateway 실행하기(개발 환경 또는 서버)
    - Gateway 인증, 바인드 모드 및 연결 디버깅
    - Bonjour를 통한 Gateway 검색(로컬 + 광역 DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway 실행, 조회 및 검색
title: Gateway
x-i18n:
    generated_at: "2026-07-12T15:04:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway는 OpenClaw의 WebSocket 서버입니다(채널, 노드, 세션, 훅). 아래의 모든 하위 명령은 `openclaw gateway ...` 아래에 있습니다.

<CardGroup cols={3}>
  <Card title="Bonjour 검색" href="/ko/gateway/bonjour">
    로컬 mDNS + 광역 DNS-SD 설정입니다.
  </Card>
  <Card title="검색 개요" href="/ko/gateway/discovery">
    OpenClaw가 Gateway를 알리고 찾는 방식입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration">
    최상위 Gateway 구성 키입니다.
  </Card>
</CardGroup>

## Gateway 실행

```bash
openclaw gateway
openclaw gateway run   # 동일한 명시적 형식
```

<AccordionGroup>
  <Accordion title="시작 동작">
    - `~/.openclaw/openclaw.json`에 `gateway.mode=local`이 설정되어 있지 않으면 시작을 거부합니다. 임시/개발 실행에는 `--allow-unconfigured`를 사용하십시오. 이 플래그는 구성을 작성하거나 복구하지 않고 검사를 우회합니다.
    - `openclaw onboard --mode local`과 `openclaw setup`은 `gateway.mode=local`을 작성합니다. 구성 파일은 있지만 `gateway.mode`가 없으면 손상되거나 덮어써진 구성으로 간주하며, Gateway는 사용자를 대신해 `local`을 추측하지 않습니다. 온보딩을 다시 실행하거나, 키를 수동으로 설정하거나, `--allow-unconfigured`를 전달하십시오.
    - 인증 없이 루프백 외부에 바인딩하는 것은 차단됩니다.
    - 현재 `--bind` 값 `lan`, `tailnet`, `custom`은 IPv4 전용 경로를 통해 해석됩니다. IPv6 전용 자체 호스트 설정에서는 Gateway 앞에 IPv4 사이드카나 프록시가 필요합니다.
    - 권한이 있으면 `SIGUSR1`이 프로세스 내 재시작을 트리거합니다. `commands.restart`(기본값: 활성화)는 외부에서 전송된 `SIGUSR1`을 제어합니다. 수동 OS 신호 재시작은 차단하면서도 `gateway restart` 명령, Gateway 도구, 구성 적용/업데이트를 통한 재시작은 계속 허용하려면 이를 `false`로 설정하십시오.
    - `SIGINT`/`SIGTERM`은 프로세스를 중지하지만 사용자 지정 터미널 상태를 복원하지 않습니다. CLI를 TUI 또는 원시 모드 입력으로 래핑한 경우 종료 전에 직접 터미널을 복원하십시오.

  </Accordion>
</AccordionGroup>

### 옵션

<ParamField path="--port <port>" type="number">
  WebSocket 포트입니다(기본값은 구성/환경에서 가져오며, 일반적으로 `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  바인딩 모드: `loopback`(기본값), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token`용 공유 토큰입니다. `OPENCLAW_GATEWAY_TOKEN`이 설정되어 있으면 기본적으로 해당 값을 사용합니다.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  인증 모드: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password`용 비밀번호입니다.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  파일에서 Gateway 비밀번호를 읽습니다.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale 노출 방식: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  종료 시 Tailscale serve/funnel 구성을 초기화합니다.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  `gateway.mode=local`을 강제하지 않고 시작합니다. 임시/개발 부트스트랩 전용이며, 구성을 영구 저장하거나 복구하지 않습니다.
</ParamField>
<ParamField path="--dev" type="boolean">
  개발용 구성과 워크스페이스가 없으면 생성합니다(`BOOTSTRAP.md`는 건너뜁니다).
</ParamField>
<ParamField path="--reset" type="boolean">
  개발용 구성, 자격 증명, 세션, 워크스페이스를 초기화합니다. `--dev`가 필요합니다.
</ParamField>
<ParamField path="--force" type="boolean">
  시작 전에 대상 포트의 기존 리스너를 모두 종료합니다.
</ParamField>
<ParamField path="--verbose" type="boolean">
  stdout/stderr에 상세 로그를 기록합니다.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  콘솔에 CLI 백엔드 로그만 표시합니다(stdout/stderr도 활성화합니다).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket 로그 스타일: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact`의 별칭입니다.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  원시 모델 스트림 이벤트를 JSONL로 기록합니다.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  원시 스트림 JSONL 경로입니다.
</ParamField>

`--claude-cli-logs`는 `--cli-backend-logs`의 더 이상 사용되지 않는 별칭입니다.

`--bind custom`을 사용할 경우 `gateway.customBindHost`를 IPv4 주소로 설정하십시오. `127.0.0.1` 또는 `0.0.0.0`이 아닌 주소를 사용하면 동일 호스트 클라이언트를 위해 같은 포트의 `127.0.0.1`도 필요합니다. 두 리스너 중 하나라도 바인딩할 수 없으면 시작에 실패합니다. 와일드카드 `0.0.0.0`은 별도로 필요한 별칭을 추가하지 않습니다. IPv6 전용 자체 호스트 설정에서는 Gateway 앞에 IPv4 사이드카나 프록시가 필요합니다.

## Gateway 재시작

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe`는 실행 중인 Gateway에 활성 작업을 사전 점검하고 해당 작업이 모두 빠져나간 후 하나로 병합된 재시작을 예약하도록 요청합니다. 대기 시간은 `gateway.reload.deferralTimeoutMs`로 제한됩니다(기본값: 5분 / `300000`). 이 시간이 만료되면 강제로 재시작합니다. 강제 재시작 대신 주기적으로 아직 보류 중이라는 경고를 표시하면서 무기한 대기하려면 `deferralTimeoutMs: 0`으로 설정하십시오. `--safe`는 `--force` 또는 `--wait`와 함께 사용할 수 없습니다.

`--skip-deferral`은 안전 재시작 시 활성 작업 지연 검사를 우회하므로, 보고된 차단 요인이 있어도 Gateway가 즉시 재시작됩니다. 이 옵션에는 `--safe`가 필요합니다. 제어 불능 작업으로 인해 지연이 멈춘 경우 사용하십시오.

`--wait <duration>`은 일반(비안전) 재시작의 작업 종료 대기 시간을 재정의합니다. 단위 없는 밀리초 또는 단위 접미사 `ms`, `s`, `m`, `h`, `d`를 허용합니다(예: `30s`, `5m`, `1h30m`). `--wait 0`은 무기한 대기합니다. `--force` 또는 `--safe`와 함께 사용할 수 없습니다.

`--force`는 활성 작업 종료 대기를 건너뛰고 즉시 재시작합니다. 일반 `restart`(플래그 없음)는 기존 서비스 관리자 재시작 동작을 유지합니다.

<Warning>
인라인 `--password`는 로컬 프로세스 목록에 노출될 수 있습니다. `--password-file`, 환경 변수 또는 SecretRef 기반 `gateway.auth.password`를 사용하는 것이 좋습니다.
</Warning>

### Gateway 프로파일링

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1`은 시작 중 단계별 타이밍을 기록합니다. 여기에는 단계별 `eventLoopMax` 지연과 Plugin 조회 테이블 타이밍(installed-index, manifest registry, startup planning, owner-map work)이 포함됩니다.
- `OPENCLAW_GATEWAY_RESTART_TRACE=1`은 재시작 범위의 `restart trace:` 줄을 기록합니다. 여기에는 신호 처리, 활성 작업 종료 대기, 종료 단계, 다음 시작, 준비 완료 타이밍, 메모리 지표가 포함됩니다.
- `OPENCLAW_DIAGNOSTICS=timeline`을 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`와 함께 사용하면 외부 QA 하네스를 위한 최선 노력 방식의 JSONL 시작 진단 타임라인을 작성합니다(구성의 `diagnostics.flags: ["timeline"]`과 동일하며, 경로는 여전히 환경 변수로만 설정할 수 있습니다). 이벤트 루프 샘플을 포함하려면 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`을 추가하십시오.
- `pnpm build` 후 `pnpm test:startup:gateway -- --runs 5 --warmup 1`은 빌드된 CLI 진입점을 기준으로 Gateway 시작을 벤치마크합니다. 첫 프로세스 출력, `/healthz`, `/readyz`, 시작 추적 타이밍, 이벤트 루프 지연, Plugin 조회 테이블 타이밍을 측정합니다.
- `pnpm build` 후 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`는 macOS 또는 Linux에서 프로세스 내 재시작을 벤치마크합니다(Windows에서는 지원되지 않으며, 재시작에는 `SIGUSR1`이 필요합니다). `SIGUSR1`을 사용하고 자식 프로세스에서 두 추적을 모두 활성화하며, 다음 `/healthz`, 다음 `/readyz`, 중단 시간, 준비 완료 타이밍, CPU, RSS, 재시작 추적 지표를 기록합니다.
- `/healthz`는 생존 상태를 나타내고 `/readyz`는 사용 가능한 준비 상태를 나타냅니다. 추적 줄과 벤치마크 출력을 단일 구간이나 샘플에 따른 완전한 성능 결론이 아니라 소유자 귀속을 위한 신호로 간주하십시오.

## 실행 중인 Gateway 조회

모든 조회 명령은 WebSocket RPC를 사용합니다.

<Tabs>
  <Tab title="출력 모드">
    - 기본값: 사람이 읽을 수 있는 형식(TTY에서는 색상 적용).
    - `--json`: 기계가 읽을 수 있는 JSON(스타일/스피너 없음).
    - `--no-color`(또는 `NO_COLOR=1`): 사람이 읽을 수 있는 레이아웃은 유지하면서 ANSI를 비활성화합니다.

  </Tab>
  <Tab title="공통 옵션">
    - `--url <url>`: Gateway WebSocket URL.
    - `--token <token>`: Gateway 토큰.
    - `--password <password>`: Gateway 비밀번호.
    - `--timeout <ms>`: 시간 제한/예산(기본값은 명령마다 다릅니다. 아래의 각 명령을 참조하십시오).
    - `--expect-final`: "final" 응답을 기다립니다(에이전트 호출).

  </Tab>
</Tabs>

<Note>
`--url`을 설정하면 CLI는 구성이나 환경의 자격 증명으로 대체하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하십시오. 명시적인 자격 증명이 없으면 오류가 발생합니다.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz`는 생존 상태 프로브입니다. 서버가 HTTP에 응답할 수 있게 되는 즉시 반환합니다. `/readyz`는 더 엄격하며, 시작 Plugin 사이드카, 채널 또는 구성된 훅이 아직 안정화 중인 동안에는 준비되지 않은 상태로 유지됩니다. 로컬 또는 인증된 상세 `/readyz` 응답에는 `eventLoop` 진단 블록(지연, 사용률, CPU 코어 비율, `degraded` 플래그)이 포함됩니다.

<ParamField path="--port <port>" type="number">
  이 포트의 로컬 루프백 Gateway를 대상으로 합니다. 이 호출에서는 `OPENCLAW_GATEWAY_URL`과 `OPENCLAW_GATEWAY_PORT`를 재정의합니다.
</ParamField>

### `gateway usage-cost`

세션 로그에서 사용량 비용 요약을 가져옵니다.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  포함할 일수입니다.
</ParamField>
<ParamField path="--agent <id>" type="string">
  요약 범위를 구성된 에이전트 ID 하나로 제한합니다.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  구성된 모든 에이전트에 걸쳐 집계합니다. `--agent`와 함께 사용할 수 없습니다.
</ParamField>

### `gateway stability`

실행 중인 Gateway에서 최근 진단 안정성 기록을 가져옵니다.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  포함할 최근 이벤트의 최대 개수입니다(최대 `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  진단 이벤트 유형으로 필터링합니다(예: `payload.large` 또는 `diagnostic.memory.pressure`).
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  진단 시퀀스 번호 이후의 이벤트만 포함합니다.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  실행 중인 Gateway를 호출하는 대신 영구 저장된 안정성 번들을 읽습니다. `--bundle latest`(또는 값 없는 `--bundle`)는 상태 디렉터리에서 가장 최신 번들을 선택합니다. 번들 JSON 경로를 직접 전달할 수도 있습니다.
</ParamField>
<ParamField path="--export" type="boolean">
  안정성 세부 정보를 출력하는 대신 공유 가능한 지원 진단 zip을 작성합니다.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export`의 출력 경로입니다.
</ParamField>

<AccordionGroup>
  <Accordion title="개인정보 보호 및 번들 동작">
    - 기록에는 이벤트 이름, 개수, 바이트 크기, 메모리 측정값, 큐/세션 상태, 승인 ID, 채널/Plugin 이름, 편집된 세션 요약과 같은 운영 메타데이터가 유지됩니다. 채팅 텍스트, Webhook 본문, 도구 출력, 원시 요청/응답 본문, 토큰, 쿠키, 비밀 값, 호스트 이름, 원시 세션 ID는 제외됩니다. 기록 기능을 완전히 비활성화하려면 `diagnostics.enabled: false`로 설정하십시오.
    - 기록기에 이벤트가 있으면 치명적인 Gateway 종료, 종료 시간 초과, 재시작 시작 실패 시 동일한 진단 스냅샷을 `~/.openclaw/logs/stability/openclaw-stability-*.json`에 작성합니다. `openclaw gateway stability --bundle latest`로 가장 최신 번들을 확인하십시오. `--limit`, `--type`, `--since-seq`는 번들 출력에도 적용됩니다.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

버그 보고서용으로 설계된 로컬 진단 zip을 작성합니다. 개인정보 보호 모델과 번들 내용은 [진단 내보내기](/ko/gateway/diagnostics)를 참조하십시오.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  출력 zip 경로입니다. 기본값은 상태 디렉터리 아래의 지원용 내보내기 경로입니다.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  포함할 정제된 로그 줄의 최대 개수입니다.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  검사할 로그의 최대 바이트 수입니다.
</ParamField>
<ParamField path="--url <url>" type="string">
  상태 스냅샷을 위한 Gateway WebSocket URL입니다.
</ParamField>
<ParamField path="--token <token>" type="string">
  상태 스냅샷을 위한 Gateway 토큰입니다.
</ParamField>
<ParamField path="--password <password>" type="string">
  상태 스냅샷을 위한 Gateway 비밀번호입니다.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  상태/건강 스냅샷 제한 시간입니다.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  저장된 안정성 번들 조회를 건너뜁니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기록된 경로, 크기 및 매니페스트를 JSON으로 출력합니다.
</ParamField>

내보내기에는 `manifest.json`(파일 목록), `summary.md`(Markdown 요약), `diagnostics.json`(최상위 구성/로그/검색/안정성/상태/건강 요약), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` 및 번들이 있을 경우 `stability/latest.json`이 포함됩니다.

공유할 수 있도록 설계되었습니다. 디버깅에 유용한 운영 세부 정보(안전한 로그 필드, 하위 시스템 이름, 상태 코드, 소요 시간, 구성된 모드, 포트, Plugin/제공자 ID, 비밀이 아닌 기능 설정 및 민감 정보가 삭제된 운영 로그 메시지)는 유지하고, 채팅 텍스트, Webhook 본문, 도구 출력, 자격 증명, 쿠키, 계정/메시지 식별자, 프롬프트/지침 텍스트, 호스트 이름 및 비밀 값은 생략하거나 민감 정보를 삭제합니다. 로그 메시지가 사용자/채팅/도구 페이로드 텍스트처럼 보이는 경우(예: "사용자가 말함", "채팅 텍스트", "도구 출력", "Webhook 본문"), 내보내기에는 메시지가 생략되었다는 사실과 해당 바이트 수만 유지됩니다.

### `gateway status`

Gateway 서비스(launchd/systemd/schtasks)와 선택적 연결/인증 프로브를 표시합니다.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  명시적인 프로브 대상을 추가합니다. 구성된 원격 대상과 localhost도 계속 프로브합니다.
</ParamField>
<ParamField path="--token <token>" type="string">
  프로브용 토큰 인증입니다.
</ParamField>
<ParamField path="--password <password>" type="string">
  프로브용 비밀번호 인증입니다.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  프로브 제한 시간입니다.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  연결 프로브를 건너뜁니다(서비스 전용 보기).
</ParamField>
<ParamField path="--deep" type="boolean">
  시스템 수준 서비스도 검사합니다.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  연결 프로브를 읽기 프로브로 강화하고 실패 시 0이 아닌 값으로 종료합니다. `--no-probe`와 함께 사용할 수 없습니다.
</ParamField>

<AccordionGroup>
  <Accordion title="상태 의미">
    - 로컬 CLI 구성이 없거나 유효하지 않은 경우에도 진단을 위해 계속 사용할 수 있습니다.
    - 기본 출력은 서비스 상태, WebSocket 연결 및 핸드셰이크 시점에 확인 가능한 인증 기능을 입증하며, 읽기/쓰기/관리자 작업을 입증하지는 않습니다.
    - 프로브는 최초 기기 인증 상태를 변경하지 않습니다. 기존에 캐시된 기기 토큰이 있으면 재사용하지만, 상태 확인만을 위해 새 CLI 기기 ID나 읽기 전용 페어링 레코드를 생성하지는 않습니다.
    - 가능한 경우 프로브 인증을 위해 구성된 인증 SecretRef를 확인합니다. 필요한 SecretRef를 확인할 수 없고 프로브 연결/인증이 실패하면 `--json`은 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 비밀 소스를 수정하십시오. 프로브가 성공하면 확인되지 않은 인증 경고가 표시되지 않습니다.
    - 실행 중인 Gateway가 버전을 보고하면 JSON 출력에 `gateway.version`이 포함됩니다. 핸드셰이크 프로브가 버전 메타데이터를 제공할 수 없는 경우 `--require-rpc`는 `status.runtimeVersion` RPC 페이로드를 대신 사용할 수 있습니다.
    - 수신 대기 중인 서비스만으로 충분하지 않고 읽기 범위 RPC도 정상이어야 하는 스크립트/자동화에서는 `--require-rpc`를 사용하십시오.
    - `--deep`은 추가 launchd/systemd/schtasks 설치를 검사합니다. Gateway와 유사한 서비스가 여러 개 발견되면 사람이 읽을 수 있는 출력에 정리 안내(일반적으로 머신당 하나의 Gateway 실행)가 표시되고, 관련이 있는 경우 최근의 감독자 재시작 인계가 보고됩니다.
    - `--deep`은 Plugin 인식 모드(`pluginValidation: "full"`)로 구성 검증도 실행하고 Plugin 매니페스트 경고(예: 채널 구성 메타데이터 누락)를 표시합니다. 기본 `gateway status`는 Plugin 검증을 건너뛰는 빠른 읽기 전용 경로를 유지합니다.
    - 사람이 읽을 수 있는 출력에는 프로필 또는 상태 디렉터리 불일치를 진단하는 데 도움이 되도록 확인된 파일 로그 경로와 CLI 대 서비스 구성 경로/유효성이 포함됩니다.

  </Accordion>
  <Accordion title="Linux systemd 인증 불일치 검사">
    - 서비스 인증 불일치 검사는 유닛에서 `Environment=`와 `EnvironmentFile=`을 모두 읽습니다(`%h`, 따옴표로 묶인 경로, 여러 파일 및 선택적 `-` 파일 포함).
    - 병합된 런타임 환경(서비스 명령 환경 우선, 그다음 프로세스 환경 대체)을 사용하여 `gateway.auth.token` SecretRef를 확인합니다.
    - 토큰 인증이 실질적으로 활성화되지 않은 경우(`gateway.auth.mode`가 명시적으로 `password`/`none`/`trusted-proxy`이거나, 모드가 설정되지 않아 비밀번호가 우선할 수 있고 어떤 토큰 후보도 우선할 수 없는 경우) 토큰 불일치 검사는 구성 토큰 확인을 건너뜁니다.

  </Accordion>
</AccordionGroup>

### `gateway probe`

"모든 것을 디버깅"하는 명령입니다. 항상 다음을 프로브합니다.

- 구성된 원격 Gateway(설정된 경우)
- localhost(루프백), **원격이 구성되어 있어도**

`--url`을 전달하면 두 대상보다 앞에 해당 명시적 대상이 추가됩니다. 사람이 읽을 수 있는 출력에서는 대상에 `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)`, `Local loopback`이라는 레이블을 사용합니다.

<Note>
여러 프로브 대상에 연결할 수 있으면 모두 출력됩니다. SSH 터널, TLS/프록시 URL 및 구성된 원격 URL은 전송 포트가 달라도 동일한 Gateway를 가리킬 수 있습니다. `multiple_gateways`는 서로 다르거나 ID가 모호한 연결 가능한 Gateway에만 사용됩니다. 격리된 프로필(예: 복구 봇)을 위해 여러 Gateway를 실행할 수 있지만, 대부분의 설치에서는 단일 Gateway를 실행합니다.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  로컬 루프백 프로브 대상과 SSH 터널 원격 포트에 이 포트를 사용합니다. `--url`이 없으면 구성된 Gateway 환경 URL, 환경 포트 또는 원격 대상 대신 로컬 루프백 대상만 선택합니다.
</ParamField>

<AccordionGroup>
  <Accordion title="해석">
    - `Reachable: yes`는 하나 이상의 대상이 WebSocket 연결을 수락했음을 의미합니다.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`는 연결 가능 여부와 별개로 프로브가 인증에 관해 입증할 수 있었던 내용을 보고합니다.
    - `Read probe: ok`는 읽기 범위 세부 RPC 호출(`health`/`status`/`system-presence`/`config.get`)도 성공했음을 의미합니다.
    - `Read probe: limited - missing scope: operator.read`는 연결에 성공했지만 읽기 범위 RPC가 제한되었음을 의미합니다. 완전한 실패가 아니라 **성능 저하** 상태의 연결 가능으로 보고됩니다.
    - `Connect: ok` 이후 `Read probe: failed`가 표시되면 WebSocket은 연결되었지만 후속 읽기 진단의 시간이 초과되었거나 실패했음을 의미합니다. 이 역시 연결 불가가 아니라 **성능 저하** 상태입니다.
    - `gateway status`와 마찬가지로 프로브는 기존에 캐시된 기기 인증을 재사용하지만 최초 기기 ID나 페어링 상태를 생성하지 않습니다.
    - 프로브한 대상에 하나도 연결할 수 없는 경우에만 종료 코드가 0이 아닙니다.

  </Accordion>
  <Accordion title="JSON 출력">
    최상위:

    - `ok`: 하나 이상의 대상에 연결할 수 있습니다.
    - `degraded`: 하나 이상의 대상이 연결을 수락했지만 전체 세부 RPC 진단을 완료하지 못했습니다.
    - `capability`: 연결 가능한 대상에서 확인된 최상의 기능(`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` 또는 `unknown`)입니다.
    - `primaryTargetId`: 활성 대상으로 간주할 최상의 대상이며, 순서는 명시적 URL, SSH 터널, 구성된 원격 대상, 로컬 루프백입니다.
    - `warnings[]`: `code`, `message` 및 선택적 `targetIds`가 포함된 최선형 경고 레코드입니다.
    - `network`: 현재 구성과 호스트 네트워킹에서 파생된 로컬 루프백/tailnet URL 안내입니다.
    - `discovery.timeoutMs` / `discovery.count`: 이 프로브 과정에 사용된 실제 검색 예산/결과 수입니다.

    대상별(`targets[].connect`): `ok`(연결 가능 여부 + 성능 저하 분류), `rpcOk`(전체 세부 RPC 성공), `scopeLimited`(operator 범위 누락으로 세부 RPC 실패)입니다.

    대상별(`targets[].auth`): 사용 가능한 경우 `hello-ok`에서 보고된 `role`과 `scopes`, 그리고 표시된 `capability` 분류입니다.

  </Accordion>
  <Accordion title="일반적인 경고 코드">
    - `ssh_tunnel_failed`: SSH 터널 설정에 실패하여 명령이 직접 프로브로 대체되었습니다.
    - `multiple_gateways`: 서로 다른 Gateway ID에 연결할 수 있었거나, OpenClaw가 연결 가능한 대상이 동일한 Gateway인지 입증할 수 없었습니다. 동일한 Gateway를 가리키는 SSH 터널, 프록시 URL 또는 구성된 원격 URL은 이를 발생시키지 않습니다.
    - `auth_secretref_unresolved`: 실패한 대상에 대해 구성된 인증 SecretRef를 확인할 수 없습니다.
    - `probe_scope_limited`: WebSocket 연결은 성공했지만 `operator.read` 누락으로 읽기 프로브가 제한되었습니다.
    - `local_tls_runtime_unavailable`: 로컬 Gateway TLS가 활성화되어 있지만 OpenClaw가 로컬 인증서 지문을 불러올 수 없습니다.

  </Accordion>
</AccordionGroup>

#### SSH를 통한 원격 연결(Mac 앱과 동일)

macOS 앱의 "Remote over SSH" 모드는 로컬 포트 전달을 사용하여 루프백 전용 원격 Gateway에 `ws://127.0.0.1:<port>`로 연결할 수 있게 합니다.

CLI에서 동일한 명령:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 또는 `user@host:port`입니다(포트 기본값은 `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ID 파일입니다.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  확인된 검색 엔드포인트(`local.`과 구성된 광역 도메인이 있는 경우 해당 도메인)에서 처음 검색된 Gateway 호스트를 SSH 대상으로 선택합니다. TXT 전용 안내는 무시됩니다.
</ParamField>

구성 기본값(선택 사항): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

저수준 RPC 도우미입니다.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  매개변수용 JSON 객체 문자열입니다.
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  제한 시간 예산입니다.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  주로 최종 페이로드 전에 중간 이벤트를 스트리밍하는 에이전트 스타일 RPC에 사용합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  머신 판독 가능 JSON 출력입니다.
</ParamField>

<Note>
`--params`는 유효한 JSON이어야 하며, 각 메서드는 자체 매개변수 형태를 검증합니다(추가되거나 이름이 잘못된 필드는 거부됩니다).
</Note>

## Gateway 서비스 관리

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### 래퍼를 사용하여 설치

관리되는 서비스가 다른 실행 파일(예: 비밀 관리자 심 또는 다른 사용자로 실행하기 위한 도우미)을 통해 시작되어야 하는 경우 `--wrapper`를 사용하십시오. 래퍼는 일반 Gateway 인수를 전달받으며, 최종적으로 해당 인수로 `openclaw` 또는 Node를 실행할 책임이 있습니다.

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

환경을 통해 래퍼를 설정할 수도 있습니다. `gateway install`은 경로가 실행 가능한 파일인지 검증하고, 래퍼를 서비스 `ProgramArguments`에 기록하며, 이후 강제 재설치, 업데이트 및 doctor 복구에 사용할 수 있도록 서비스 환경에 `OPENCLAW_WRAPPER`를 유지합니다.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

유지된 래퍼를 제거하려면 재설치할 때 `OPENCLAW_WRAPPER`를 비우십시오.

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="명령 옵션">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (기본값: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="수명 주기 동작">
    - 관리형 서비스를 재시작하려면 `gateway restart`를 사용하십시오. 재시작 대신 `gateway stop`과 `gateway start`를 연이어 실행하지 마십시오.
    - macOS에서 `gateway stop`은 기본적으로 `launchctl bootout`을 사용합니다. 이 명령은 비활성화 상태를 유지하지 않고 현재 부팅 세션에서 LaunchAgent를 제거하므로, 이후 충돌에 대한 KeepAlive 자동 복구는 활성 상태로 유지되며 `gateway start`는 수동 `launchctl enable` 없이 정상적으로 다시 활성화합니다. `--disable`을 전달하면 KeepAlive와 RunAtLoad를 지속적으로 억제하여 다음에 명시적으로 `gateway start`를 실행할 때까지 Gateway가 다시 생성되지 않도록 합니다. 수동 중지 상태가 재부팅 후에도 유지되어야 할 때 사용하십시오.
    - 수명 주기 명령은 스크립팅을 위해 `--json`을 지원합니다.

  </Accordion>
  <Accordion title="설치 시 인증 및 SecretRef">
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `gateway install`은 SecretRef를 확인할 수 있는지 검증하지만 확인된 토큰을 서비스 환경 메타데이터에 유지하지는 않습니다.
    - 토큰 인증에 토큰이 필요하지만 구성된 토큰 SecretRef를 확인할 수 없는 경우, 설치는 대체 평문을 유지하는 대신 실패 시 차단됩니다.
    - `gateway run`에서 비밀번호 인증을 사용할 때는 인라인 `--password`보다 `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` 또는 SecretRef 기반 `gateway.auth.password`를 우선 사용하십시오.
    - 추론된 인증 모드에서는 셸에만 설정된 `OPENCLAW_GATEWAY_PASSWORD`가 설치 토큰 요구 사항을 완화하지 않습니다. 관리형 서비스를 설치할 때는 영구 구성(`gateway.auth.password` 또는 구성의 `env`)을 사용하십시오.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드를 명시적으로 설정할 때까지 설치가 차단됩니다.

  </Accordion>
</AccordionGroup>

## Gateway 검색(Bonjour)

`gateway discover`는 Gateway 비콘(`_openclaw-gw._tcp`)을 검색합니다.

- 멀티캐스트 DNS-SD: `local.`
- 유니캐스트 DNS-SD(광역 Bonjour): 도메인(예: `openclaw.internal.`)을 선택하고 분할 DNS와 DNS 서버를 설정하십시오. [Bonjour](/ko/gateway/bonjour)를 참조하십시오.

Bonjour 검색이 활성화된 Gateway(기본값)만 비콘을 알립니다.

모든 비콘의 TXT 힌트: `role`(Gateway 역할 힌트), `transport`(전송 힌트, 예: `gateway`), `gatewayPort`(WebSocket 포트, 일반적으로 `18789`), `tailnetDns`(사용 가능한 경우 MagicDNS 호스트 이름), `gatewayTls` / `gatewayTlsSha256`(TLS 활성화 여부 + 인증서 지문). `sshPort`와 `cliPath`는 전체 검색 모드(`discovery.mdns.mode: "full"`; 기본값은 `"minimal"`이며 이 값들을 생략함)에서만 게시됩니다. 이 값들이 생략되면 클라이언트는 SSH 대상 포트의 기본값으로 `22`를 사용합니다.

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  명령별 제한 시간(탐색/확인)입니다.
</ParamField>
<ParamField path="--json" type="boolean">
  머신 판독 가능 출력입니다(스타일링/스피너도 비활성화함).
</ParamField>

예:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- `local.`과 활성화된 경우 구성된 광역 도메인을 함께 검색합니다.
- JSON 출력의 `wsUrl`은 `lanHost` 또는 `tailnetDns`와 같은 TXT 전용 힌트가 아니라 확인된 서비스 엔드포인트에서 파생됩니다.
- `discovery.mdns.mode`는 `local.` mDNS와 광역 DNS-SD 모두에서 `sshPort`/`cliPath` 게시를 제어합니다(위 내용 참조).

</Note>

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 운영 지침](/ko/gateway)
