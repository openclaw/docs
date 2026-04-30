---
read_when:
    - Gateway 프로세스 실행 또는 디버깅
summary: Gateway 서비스, 수명 주기 및 운영을 위한 런북
title: Gateway 런북
x-i18n:
    generated_at: "2026-04-30T06:31:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

이 페이지는 Gateway 서비스의 1일 차 시작 및 2일 차 운영에 사용하세요.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/ko/gateway/troubleshooting">
    정확한 명령 단계와 로그 시그니처를 포함한 증상 우선 진단입니다.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ko/gateway/configuration">
    작업 중심 설정 가이드와 전체 구성 레퍼런스입니다.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/ko/gateway/secrets">
    SecretRef 계약, 런타임 스냅샷 동작, migrate/reload 작업입니다.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/ko/gateway/secrets-plan-contract">
    정확한 `secrets apply` 대상/경로 규칙과 ref 전용 auth-profile 동작입니다.
  </Card>
</CardGroup>

## 5분 로컬 시작

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

정상 기준: 예상과 일치하는 `Runtime: running`, `Connectivity probe: ok`, 그리고 `Capability: ...`입니다. 단순 도달 가능성이 아니라 읽기 범위 RPC 증명이 필요할 때는 `openclaw gateway status --require-rpc`를 사용하세요.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

도달 가능한 gateway가 있으면 계정별 live channel probe와 선택적 감사를 실행합니다.
gateway에 도달할 수 없으면 CLI는 live probe 출력 대신 config 전용 channel 요약으로 대체합니다.

  </Step>
</Steps>

<Note>
Gateway 구성 reload는 활성 구성 파일 경로(profile/state 기본값에서 확인되거나, 설정된 경우 `OPENCLAW_CONFIG_PATH`)를 감시합니다.
기본 모드는 `gateway.reload.mode="hybrid"`입니다.
첫 성공적인 로드 후 실행 중인 프로세스는 활성 인메모리 구성 스냅샷을 제공하며, 성공적인 reload는 해당 스냅샷을 원자적으로 교체합니다.
</Note>

## 런타임 모델

- 라우팅, 컨트롤 플레인, channel 연결을 위한 항상 켜져 있는 단일 프로세스입니다.
- 다음을 위한 단일 다중화 포트:
  - WebSocket 컨트롤/RPC
  - OpenAI 호환 HTTP API(`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI 및 hook
- 기본 bind 모드: `loopback`.
- 기본적으로 인증이 필요합니다. 공유 secret 설정은
  `gateway.auth.token` / `gateway.auth.password`(또는
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)를 사용하며, 비-loopback
  reverse-proxy 설정은 `gateway.auth.mode: "trusted-proxy"`를 사용할 수 있습니다.

## OpenAI 호환 엔드포인트

OpenClaw의 가장 영향력이 큰 호환성 표면은 이제 다음과 같습니다.

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

이 집합이 중요한 이유:

- 대부분의 Open WebUI, LobeChat, LibreChat 통합은 먼저 `/v1/models`를 탐색합니다.
- 많은 RAG 및 메모리 파이프라인은 `/v1/embeddings`를 기대합니다.
- agent-native 클라이언트는 점점 `/v1/responses`를 선호합니다.

계획 참고:

- `/v1/models`는 agent 우선입니다. `openclaw`, `openclaw/default`, `openclaw/<agentId>`를 반환합니다.
- `openclaw/default`는 항상 구성된 기본 agent에 매핑되는 안정적인 별칭입니다.
- backend provider/model override가 필요할 때는 `x-openclaw-model`을 사용하세요. 그렇지 않으면 선택한 agent의 일반 model 및 embedding 설정이 계속 제어합니다.

이 모든 엔드포인트는 기본 Gateway 포트에서 실행되며, 나머지 Gateway HTTP API와 동일한 신뢰된 운영자 인증 경계를 사용합니다.

### 포트 및 bind 우선순위

| 설정         | 해석 순서                                                     |
| ------------ | ------------------------------------------------------------- |
| Gateway 포트 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind 모드    | CLI/override → `gateway.bind` → `loopback`                    |

설치된 gateway 서비스는 해석된 `--port`를 supervisor metadata에 기록합니다. `gateway.port`를 변경한 후에는 launchd/systemd/schtasks가 새 포트에서 프로세스를 시작하도록 `openclaw doctor --fix` 또는 `openclaw gateway install --force`를 실행하세요.

Gateway 시작은 비-loopback bind에 대한 로컬
Control UI origin을 시드할 때 동일한 유효 포트와 bind를 사용합니다. 예를 들어 `--bind lan --port 3000`은 runtime
검증이 실행되기 전에 `http://localhost:3000` 및 `http://127.0.0.1:3000`을 시드합니다. HTTPS proxy URL과 같은 원격 브라우저 origin은
`gateway.controlUi.allowedOrigins`에 명시적으로 추가하세요.

### Hot reload 모드

| `gateway.reload.mode` | 동작                                       |
| --------------------- | ------------------------------------------ |
| `off`                 | 구성 reload 없음                           |
| `hot`                 | hot-safe 변경 사항만 적용                  |
| `restart`             | reload가 필요한 변경 시 재시작             |
| `hybrid` (기본값)     | 안전할 때 hot-apply, 필요할 때 재시작      |

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

`gateway status --deep`는 더 깊은 RPC health probe가 아니라 추가 서비스 검색(LaunchDaemons/systemd system
units/schtasks)을 위한 것입니다.

## 여러 gateway(동일 호스트)

대부분의 설치는 머신당 gateway 하나를 실행해야 합니다. 단일 gateway는 여러
agent와 channel을 호스팅할 수 있습니다.

의도적으로 격리 또는 rescue bot을 원할 때만 여러 gateway가 필요합니다.

유용한 확인:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

예상되는 동작:

- `gateway status --deep`는 오래된 launchd/systemd/schtasks 설치가 남아 있을 때 `Other gateway-like services detected (best effort)`를 보고하고 정리 힌트를 출력할 수 있습니다.
- `gateway probe`는 둘 이상의 대상이 응답할 때 `multiple reachable gateways`에 대해 경고할 수 있습니다.
- 이것이 의도된 경우 gateway별로 포트, config/state, workspace root를 격리하세요.

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

## VoiceClaw 실시간 brain 엔드포인트

OpenClaw는 `/voiceclaw/realtime`에서 VoiceClaw 호환 실시간 WebSocket 엔드포인트를 제공합니다. VoiceClaw desktop client가 별도의 relay 프로세스를 거치지 않고 실시간 OpenClaw brain에 직접 연결해야 할 때 사용하세요.

이 엔드포인트는 실시간 오디오에 Gemini Live를 사용하며, OpenClaw tool을 Gemini Live에 직접 노출하여 OpenClaw를 brain으로 호출합니다. Tool call은 음성 턴의 응답성을 유지하기 위해 즉시 `working` 결과를 반환한 다음, OpenClaw가 실제 tool을 비동기적으로 실행하고 결과를 live session에 다시 주입합니다. gateway 프로세스 환경에 `GEMINI_API_KEY`를 설정하세요. gateway auth가 활성화된 경우 desktop client는 첫 `session.config` 메시지에서 gateway token 또는 password를 보냅니다.

실시간 brain access는 owner-authorized OpenClaw agent 명령을 실행합니다. `gateway.auth.mode: "none"`은 loopback 전용 테스트 인스턴스로 제한하세요. 비로컬 실시간 brain 연결에는 gateway auth가 필요합니다.

격리된 test gateway의 경우 자체 port, config,
state를 가진 별도 인스턴스를 실행하세요.

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

그런 다음 VoiceClaw가 다음을 사용하도록 구성하세요.

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## 원격 액세스

권장: Tailscale/VPN.
대체: SSH tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

그런 다음 클라이언트를 로컬에서 `ws://127.0.0.1:18789`에 연결하세요.

<Warning>
SSH tunnel은 gateway auth를 우회하지 않습니다. 공유 secret auth의 경우 클라이언트는 tunnel을 통해서도
`token`/`password`를 보내야 합니다. identity-bearing 모드에서는 요청이 여전히 해당 auth 경로를 충족해야 합니다.
</Warning>

참고: [Remote Gateway](/ko/gateway/remote), [Authentication](/ko/gateway/authentication), [Tailscale](/ko/gateway/tailscale).

## 감독 및 서비스 수명 주기

프로덕션과 유사한 신뢰성을 위해 supervised run을 사용하세요.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

재시작에는 `openclaw gateway restart`를 사용하세요. `openclaw gateway stop`과 `openclaw gateway start`를 연결해 실행하지 마세요. macOS에서 `gateway stop`은 중지하기 전에 의도적으로 LaunchAgent를 비활성화합니다.

LaunchAgent label은 `ai.openclaw.gateway`(기본값) 또는 `ai.openclaw.<profile>`(named profile)입니다. `openclaw doctor`는 서비스 구성 drift를 감사하고 복구합니다.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

logout 후 persistence를 위해 lingering을 활성화하세요.

```bash
sudo loginctl enable-linger <user>
```

custom install path가 필요할 때의 manual user-unit 예:

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
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Native Windows managed startup은 `OpenClaw Gateway`라는 Scheduled Task(또는 named profile의 경우 `OpenClaw Gateway (<profile>)`)를 사용합니다. Scheduled Task 생성이 거부되면 OpenClaw는 state directory 내부의 `gateway.cmd`를 가리키는 per-user Startup-folder launcher로 대체합니다.

  </Tab>

  <Tab title="Linux (system service)">

multi-user/always-on host에는 system unit을 사용하세요.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

user unit과 동일한 service body를 사용하되,
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 아래에 설치하고 `openclaw` binary가 다른 위치에 있는 경우 `ExecStart=`를 조정하세요.

동일한 profile/port에 대해 `openclaw doctor --fix`가 user-level gateway service도 설치하도록 두지 마세요. Doctor는 system-level OpenClaw gateway service를 발견하면 해당 자동 설치를 거부합니다. system unit이 lifecycle을 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 사용하세요.

  </Tab>
</Tabs>

## Dev profile 빠른 경로

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

기본값에는 격리된 state/config와 기본 gateway port `19001`이 포함됩니다.

## 프로토콜 빠른 참조(운영자 관점)

- 첫 client frame은 `connect`여야 합니다.
- Gateway는 `hello-ok` snapshot(`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)을 반환합니다.
- `hello-ok.features.methods` / `events`는 모든 호출 가능한 helper route의 생성된 dump가 아니라 보수적인 discovery list입니다.
- 요청: `req(method, params)` → `res(ok/payload|error)`.
- 일반적인 event에는 `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, pairing/approval lifecycle event, `shutdown`이 포함됩니다.

Agent run은 2단계입니다.

1. 즉시 accepted ack(`status:"accepted"`)
2. 최종 completion response(`status:"ok"|"error"`), 중간에 streamed `agent` event 포함.

전체 프로토콜 문서 참고: [Gateway Protocol](/ko/gateway/protocol).

## 운영 점검

### Liveness

- WS를 열고 `connect`를 보냅니다.
- 스냅샷과 함께 `hello-ok` 응답이 오는지 확인합니다.

### 준비 상태

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 간격 복구

이벤트는 재생되지 않습니다. 시퀀스 간격이 발생하면 계속하기 전에 상태(`health`, `system-presence`)를 새로 고칩니다.

## 일반적인 실패 징후

| 징후                                                           | 가능한 문제                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 유효한 Gateway 인증 경로 없이 비루프백 바인딩                                   |
| `another gateway instance is already listening` / `EADDRINUSE` | 포트 충돌                                                                       |
| `Gateway start blocked: set gateway.mode=local`                | 설정이 원격 모드로 지정되었거나 손상된 설정에서 로컬 모드 스탬프가 누락됨       |
| `unauthorized` during connect                                  | 클라이언트와 Gateway 간 인증 불일치                                             |

전체 진단 단계는 [Gateway 문제 해결](/ko/gateway/troubleshooting)을 사용하세요.

## 안전 보장

- Gateway 프로토콜 클라이언트는 Gateway를 사용할 수 없을 때 빠르게 실패합니다(암시적인 직접 채널 대체 없음).
- 유효하지 않은 첫 프레임이나 connect가 아닌 첫 프레임은 거부되고 닫힙니다.
- 정상 종료 시 소켓이 닫히기 전에 `shutdown` 이벤트가 발생합니다.

---

관련 항목:

- [문제 해결](/ko/gateway/troubleshooting)
- [백그라운드 프로세스](/ko/gateway/background-process)
- [구성](/ko/gateway/configuration)
- [상태](/ko/gateway/health)
- [Doctor](/ko/gateway/doctor)
- [인증](/ko/gateway/authentication)

## 관련 항목

- [구성](/ko/gateway/configuration)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
- [원격 액세스](/ko/gateway/remote)
- [비밀 관리](/ko/gateway/secrets)
