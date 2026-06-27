---
read_when:
    - Gateway 프로세스 실행 또는 디버깅
summary: Gateway 서비스, 수명 주기 및 운영을 위한 런북
title: Gateway 실행 지침
x-i18n:
    generated_at: "2026-06-27T17:29:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

Use 이 페이지는 Gateway 서비스의 day-1 시작과 day-2 운영에 사용합니다.

<CardGroup cols={2}>
  <Card title="심층 문제 해결" icon="siren" href="/ko/gateway/troubleshooting">
    정확한 명령 단계와 로그 시그니처를 포함한 증상 우선 진단.
  </Card>
  <Card title="구성" icon="sliders" href="/ko/gateway/configuration">
    작업 중심 설정 가이드 + 전체 구성 참조.
  </Card>
  <Card title="비밀 관리" icon="key-round" href="/ko/gateway/secrets">
    SecretRef 계약, 런타임 스냅샷 동작, 마이그레이션/리로드 작업.
  </Card>
  <Card title="비밀 계획 계약" icon="shield-check" href="/ko/gateway/secrets-plan-contract">
    정확한 `secrets apply` 대상/경로 규칙과 참조 전용 auth-profile 동작.
  </Card>
</CardGroup>

## 5분 로컬 시작

<Steps>
  <Step title="Gateway 시작">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="서비스 상태 확인">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

정상 기준: `Runtime: running`, `Connectivity probe: ok`, 그리고 예상과 일치하는 `Capability: ...`입니다. 단순 도달 가능성이 아니라 읽기 범위 RPC 증명이 필요할 때는 `openclaw gateway status --require-rpc`를 사용하세요.

  </Step>

  <Step title="채널 준비 상태 검증">

```bash
openclaw channels status --probe
```

도달 가능한 Gateway가 있으면 계정별 채널 프로브와 선택적 감사를 실시간으로 실행합니다.
Gateway에 도달할 수 없으면 CLI는 실시간 프로브 출력 대신 구성 전용 채널 요약으로 대체합니다.

  </Step>
</Steps>

<Note>
Gateway 구성 리로드는 활성 구성 파일 경로를 감시합니다(프로필/상태 기본값에서 해석되거나, 설정된 경우 `OPENCLAW_CONFIG_PATH`에서 해석됨).
기본 모드는 `gateway.reload.mode="hybrid"`입니다.
첫 번째 로드가 성공한 뒤에는 실행 중인 프로세스가 활성 인메모리 구성 스냅샷을 제공하며, 성공적인 리로드는 해당 스냅샷을 원자적으로 교체합니다.
</Note>

## 런타임 모델

- 라우팅, 컨트롤 플레인, 채널 연결을 위한 항상 켜져 있는 프로세스 하나.
- 다음을 위한 단일 멀티플렉싱 포트:
  - WebSocket 제어/RPC
  - HTTP API(`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - 선택적 `/api/v1/admin/rpc` 같은 Plugin HTTP 라우트
  - Control UI와 훅
- 기본 바인드 모드: `loopback`.
- 기본적으로 인증이 필요합니다. 공유 비밀 설정은
  `gateway.auth.token` / `gateway.auth.password`(또는
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)를 사용하며, 비-loopback
  리버스 프록시 설정은 `gateway.auth.mode: "trusted-proxy"`를 사용할 수 있습니다.

## OpenAI 호환 엔드포인트

OpenClaw의 가장 영향력 있는 호환성 표면은 이제 다음과 같습니다.

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

이 집합이 중요한 이유:

- 대부분의 Open WebUI, LobeChat, LibreChat 통합은 먼저 `/v1/models`를 프로브합니다.
- 많은 RAG 및 메모리 파이프라인은 `/v1/embeddings`를 기대합니다.
- 에이전트 네이티브 클라이언트는 점점 `/v1/responses`를 선호합니다.

계획 참고:

- `/v1/models`는 에이전트 우선입니다. `openclaw`, `openclaw/default`, `openclaw/<agentId>`를 반환합니다.
- `openclaw/default`는 항상 구성된 기본 에이전트에 매핑되는 안정적인 별칭입니다.
- 백엔드 제공자/모델 재정의를 원할 때는 `x-openclaw-model`을 사용하세요. 그렇지 않으면 선택한 에이전트의 일반 모델 및 임베딩 설정이 계속 제어합니다.

이 모든 것은 기본 Gateway 포트에서 실행되며 Gateway HTTP API의 나머지와 동일한 신뢰된 운영자 인증 경계를 사용합니다.

관리자 HTTP RPC(`POST /api/v1/admin/rpc`)는 WebSocket RPC를 사용할 수 없는 호스트 도구를 위한 별도의 기본 비활성 Plugin 라우트입니다. [관리자 HTTP RPC](/ko/plugins/admin-http-rpc)를 참고하세요.

### 포트 및 바인드 우선순위

| 설정         | 해석 순서                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway 포트 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 바인드 모드  | CLI/override → `gateway.bind` → `loopback`                    |

설치된 Gateway 서비스는 해석된 `--port`를 감독자 메타데이터에 기록합니다. `gateway.port`를 변경한 뒤에는 launchd/systemd/schtasks가 새 포트에서 프로세스를 시작하도록 `openclaw doctor --fix` 또는 `openclaw gateway install --force`를 실행하세요.

Gateway 시작은 비-loopback 바인드를 위한 로컬 Control UI origin을 시드할 때 동일한 유효 포트와 바인드를 사용합니다. 예를 들어 `--bind lan --port 3000`은 런타임 검증이 실행되기 전에 `http://localhost:3000`과 `http://127.0.0.1:3000`을 시드합니다. HTTPS 프록시 URL 같은 원격 브라우저 origin은 `gateway.controlUi.allowedOrigins`에 명시적으로 추가하세요.

### 핫 리로드 모드

| `gateway.reload.mode` | 동작                                       |
| --------------------- | ------------------------------------------ |
| `off`                 | 구성 리로드 없음                           |
| `hot`                 | 핫 세이프 변경만 적용                      |
| `restart`             | 리로드가 필요한 변경 시 재시작             |
| `hybrid` (기본값)     | 안전하면 핫 적용, 필요하면 재시작          |

## 운영자 명령 집합

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep`는 추가 서비스 발견(LaunchDaemons/systemd 시스템
유닛/schtasks)을 위한 것이며, 더 깊은 RPC 상태 프로브가 아닙니다.

## 여러 Gateway(동일 호스트)

대부분의 설치는 머신당 하나의 Gateway를 실행해야 합니다. 단일 Gateway가 여러
에이전트와 채널을 호스트할 수 있습니다.

의도적으로 격리하거나 구조용 봇이 필요할 때만 여러 Gateway가 필요합니다.

유용한 확인:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

예상되는 내용:

- `gateway status --deep`는 오래된 launchd/systemd/schtasks 설치가 아직 남아 있을 때 `Other gateway-like services detected (best effort)`를 보고하고 정리 힌트를 출력할 수 있습니다.
- `gateway probe`는 서로 다른 Gateway가 응답하거나, OpenClaw가 도달 가능한 대상이 같은 Gateway임을 증명할 수 없을 때 `multiple reachable gateway identities`를 경고할 수 있습니다.
  같은 Gateway를 향한 SSH 터널, 프록시 URL, 구성된 원격 URL은 전송 포트가 달라도 여러 전송을 가진 하나의 Gateway입니다.
- 의도한 것이라면 Gateway별로 포트, 구성/상태, 워크스페이스 루트를 격리하세요.

인스턴스별 체크리스트:

- 고유한 `gateway.port`
- 고유한 `OPENCLAW_CONFIG_PATH`
- 고유한 `OPENCLAW_STATE_DIR`
- 고유한 `agents.defaults.workspace`

예:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

자세한 설정: [/gateway/multiple-gateways](/ko/gateway/multiple-gateways).

## 원격 액세스

권장: Tailscale/VPN.
대체: SSH 터널.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

그런 다음 클라이언트를 로컬에서 `ws://127.0.0.1:18789`에 연결하세요.

<Warning>
SSH 터널은 Gateway 인증을 우회하지 않습니다. 공유 비밀 인증의 경우 클라이언트는 터널을 통해서도 여전히 `token`/`password`를 보내야 합니다. ID 포함 모드의 경우에도 요청은 해당 인증 경로를 충족해야 합니다.
</Warning>

참고: [원격 Gateway](/ko/gateway/remote), [인증](/ko/gateway/authentication), [Tailscale](/ko/gateway/tailscale).

## 감독 및 서비스 수명 주기

프로덕션에 가까운 신뢰성을 위해 감독 실행을 사용하세요.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

재시작에는 `openclaw gateway restart`를 사용하세요. 재시작 대체 수단으로 `openclaw gateway stop`과 `openclaw gateway start`를 연결하지 마세요.

macOS에서 `gateway stop`은 기본적으로 `launchctl bootout`을 사용합니다. 이는 disable을 지속하지 않고 현재 부팅 세션에서 LaunchAgent를 제거하므로, 예기치 않은 크래시 후에도 KeepAlive 자동 복구가 계속 작동하고 `gateway start`가 깔끔하게 다시 활성화합니다. 재부팅 후에도 자동 재생성을 지속적으로 억제하려면 `--disable`을 전달하세요: `openclaw gateway stop --disable`.

LaunchAgent 레이블은 `ai.openclaw.gateway`(기본값) 또는 `ai.openclaw.<profile>`(명명된 프로필)입니다. `openclaw doctor`는 서비스 구성 드리프트를 감사하고 복구합니다.

  </Tab>

  <Tab title="Linux (systemd 사용자)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

로그아웃 후 지속성을 위해 lingering을 활성화하세요.

```bash
sudo loginctl enable-linger <user>
```

사용자 지정 설치 경로가 필요할 때의 수동 사용자 유닛 예:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (네이티브)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

네이티브 Windows 관리형 시작은 `OpenClaw Gateway`라는 Scheduled Task를 사용합니다
(명명된 프로필의 경우 `OpenClaw Gateway (<profile>)`). Scheduled Task 생성이 거부되면 OpenClaw는 상태 디렉터리 안의 `gateway.cmd`를 가리키는 사용자별 Startup 폴더 런처로 대체합니다.

  </Tab>

  <Tab title="Linux (시스템 서비스)">

다중 사용자/항상 켜짐 호스트에는 시스템 유닛을 사용하세요.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

사용자 유닛과 동일한 서비스 본문을 사용하되
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 아래에 설치하고,
`openclaw` 바이너리가 다른 위치에 있으면 `ExecStart=`를 조정하세요.

동일한 프로필/포트에 대해 `openclaw doctor --fix`가 사용자 수준 Gateway 서비스를 함께 설치하도록 두지 마세요. Doctor는 시스템 수준 OpenClaw Gateway 서비스를 발견하면 해당 자동 설치를 거부합니다. 시스템 유닛이 수명 주기를 소유할 때는 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 사용하세요.

  </Tab>
</Tabs>

## 개발 프로필 빠른 경로

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

기본값에는 격리된 상태/구성과 기본 Gateway 포트 `19001`이 포함됩니다.

## 프로토콜 빠른 참조(운영자 관점)

- 첫 번째 클라이언트 프레임은 `connect`여야 합니다.
- Gateway는 `hello-ok` 스냅샷(`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)을 반환합니다.
- `hello-ok.features.methods` / `events`는 호출 가능한 모든 헬퍼 라우트의 생성된 덤프가 아니라 보수적인 발견 목록입니다.
- 요청: `req(method, params)` → `res(ok/payload|error)`.
- 일반 이벤트에는 `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, pairing/approval 수명 주기 이벤트,
  그리고 `shutdown`이 포함됩니다.

에이전트 실행은 두 단계입니다.

1. 즉시 수락 ack(`status:"accepted"`)
2. 최종 완료 응답(`status:"ok"|"error"`), 그 사이에 스트리밍되는 `agent` 이벤트 포함.

전체 프로토콜 문서 보기: [Gateway 프로토콜](/ko/gateway/protocol).

## 운영 확인

### Liveness

- WS를 열고 `connect`를 보냅니다.
- 스냅샷이 포함된 `hello-ok` 응답을 기대합니다.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap 복구

이벤트는 재생되지 않습니다. 시퀀스 gap이 있으면 계속하기 전에 상태(`health`, `system-presence`)를 새로 고치세요.

## 일반적인 실패 시그니처

| 시그니처                                                      | 가능성이 높은 문제                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 유효한 Gateway 인증 경로 없이 비루프백에 바인딩함                             |
| `another gateway instance is already listening` / `EADDRINUSE` | 포트 충돌                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | 설정이 원격 모드로 지정되었거나 손상된 설정에서 로컬 모드 스탬프가 누락됨 |
| 연결 중 `unauthorized`                                  | 클라이언트와 Gateway 간 인증 불일치                                        |

전체 진단 단계는 [Gateway 문제 해결](/ko/gateway/troubleshooting)을 사용하세요.

## 안전 보장

- Gateway 프로토콜 클라이언트는 Gateway를 사용할 수 없을 때 빠르게 실패합니다(암시적인 직접 채널 폴백 없음).
- 유효하지 않거나 연결이 아닌 첫 프레임은 거부되고 닫힙니다.
- 정상 종료는 소켓을 닫기 전에 `shutdown` 이벤트를 발생시킵니다.

---

관련 항목:

- [문제 해결](/ko/gateway/troubleshooting)
- [백그라운드 프로세스](/ko/gateway/background-process)
- [설정](/ko/gateway/configuration)
- [상태](/ko/gateway/health)
- [Doctor](/ko/gateway/doctor)
- [인증](/ko/gateway/authentication)

## 관련 항목

- [설정](/ko/gateway/configuration)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
- [원격 액세스](/ko/gateway/remote)
- [비밀 관리](/ko/gateway/secrets)
