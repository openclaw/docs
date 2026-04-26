---
read_when:
    - gateway 프로세스 실행 또는 디버깅하기
summary: Gateway 서비스, 라이프사이클 및 운영을 위한 runbook
title: Gateway runbook
x-i18n:
    generated_at: "2026-04-26T11:29:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

이 페이지는 Gateway 서비스의 day-1 시작과 day-2 운영에 사용하세요.

<CardGroup cols={2}>
  <Card title="심층 문제 해결" icon="siren" href="/ko/gateway/troubleshooting">
    정확한 명령 순서와 로그 시그니처를 포함한 증상 우선 진단.
  </Card>
  <Card title="구성" icon="sliders" href="/ko/gateway/configuration">
    작업 중심 설정 가이드 + 전체 구성 참조.
  </Card>
  <Card title="Secrets 관리" icon="key-round" href="/ko/gateway/secrets">
    SecretRef 계약, 런타임 스냅샷 동작, migrate/reload 작업.
  </Card>
  <Card title="Secrets plan 계약" icon="shield-check" href="/ko/gateway/secrets-plan-contract">
    정확한 `secrets apply` 대상/경로 규칙 및 ref 전용 auth-profile 동작.
  </Card>
</CardGroup>

## 5분 로컬 시작

<Steps>
  <Step title="Gateway 시작">

```bash
openclaw gateway --port 18789
# stdio로 미러링되는 디버그/trace
openclaw gateway --port 18789 --verbose
# 선택한 포트의 리스너를 강제로 종료한 뒤 시작
openclaw gateway --force
```

  </Step>

  <Step title="서비스 상태 확인">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

정상 기준: `Runtime: running`, `Connectivity probe: ok`, 그리고 기대와 일치하는 `Capability: ...`입니다. 단순 도달 가능성뿐 아니라 읽기 범위 RPC 증명이 필요하면 `openclaw gateway status --require-rpc`를 사용하세요.

  </Step>

  <Step title="채널 준비 상태 검증">

```bash
openclaw channels status --probe
```

도달 가능한 gateway가 있으면 이 명령은 계정별 라이브 채널 probe와 선택적 감사를 실행합니다.
gateway에 도달할 수 없으면 CLI는 라이브 probe 출력 대신
config 전용 채널 요약으로 fallback합니다.

  </Step>
</Steps>

<Note>
Gateway config reload는 활성 config 파일 경로를 감시합니다(프로필/state 기본값 또는 설정된 경우 `OPENCLAW_CONFIG_PATH`에서 해석).
기본 모드는 `gateway.reload.mode="hybrid"`입니다.
첫 번째 성공적인 로드 이후 실행 중인 프로세스는 활성 인메모리 config 스냅샷을 제공하며, 성공적인 reload는 그 스냅샷을 원자적으로 교체합니다.
</Note>

## 런타임 모델

- 라우팅, 제어 plane, 채널 연결을 위한 항상 실행되는 단일 프로세스.
- 다음을 위한 단일 멀티플렉스 포트:
  - WebSocket control/RPC
  - HTTP APIs, OpenAI 호환 (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI 및 hooks
- 기본 bind 모드: `loopback`.
- 기본적으로 인증이 필요합니다. 공유 비밀 설정은
  `gateway.auth.token` / `gateway.auth.password`(또는
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)를 사용하고, loopback이 아닌
  reverse-proxy 설정은 `gateway.auth.mode: "trusted-proxy"`를 사용할 수 있습니다.

## OpenAI 호환 엔드포인트

OpenClaw의 가장 중요한 호환 표면은 이제 다음과 같습니다.

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

이 집합이 중요한 이유:

- 대부분의 Open WebUI, LobeChat, LibreChat 통합은 먼저 `/v1/models`를 probe합니다.
- 많은 RAG 및 메모리 파이프라인은 `/v1/embeddings`를 기대합니다.
- 에이전트 네이티브 클라이언트는 점점 `/v1/responses`를 선호합니다.

계획 참고:

- `/v1/models`는 agent 우선입니다: `openclaw`, `openclaw/default`, `openclaw/<agentId>`를 반환합니다.
- `openclaw/default`는 항상 구성된 기본 에이전트에 매핑되는 안정적인 별칭입니다.
- 백엔드 provider/model override가 필요하면 `x-openclaw-model`을 사용하세요. 그렇지 않으면 선택한 에이전트의 일반 모델 및 임베딩 설정이 계속 제어합니다.

이들 모두는 메인 Gateway 포트에서 실행되며, Gateway HTTP API의 나머지 부분과 동일한 신뢰된 operator 인증 경계를 사용합니다.

### 포트 및 bind 우선순위

| 설정         | 해석 순서                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway 포트 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind 모드    | CLI/override → `gateway.bind` → `loopback`                    |

Gateway 시작은 loopback이 아닌 bind에 대한 로컬
Control UI origins를 시드할 때도 동일한 유효 포트와 bind를 사용합니다. 예를 들어 `--bind lan --port 3000`은 런타임
검증이 실행되기 전에 `http://localhost:3000`과 `http://127.0.0.1:3000`을 시드합니다. HTTPS 프록시 URL 같은 원격 브라우저 origin은
`gateway.controlUi.allowedOrigins`에 명시적으로 추가하세요.

### Hot reload 모드

| `gateway.reload.mode` | 동작                                      |
| --------------------- | ----------------------------------------- |
| `off`                 | config reload 없음                        |
| `hot`                 | hot-safe 변경만 적용                      |
| `restart`             | reload가 필요한 변경 시 재시작            |
| `hybrid` (기본값)     | 안전하면 hot-apply, 필요하면 재시작       |

## Operator 명령 집합

```bash
openclaw gateway status
openclaw gateway status --deep   # 시스템 수준 서비스 스캔 추가
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep`은 추가 서비스 검색(LaunchDaemons/systemd system
units/schtasks)을 위한 것이며, 더 깊은 RPC 상태 probe가 아닙니다.

## 여러 Gateway(같은 호스트)

대부분의 설치는 머신당 gateway 하나를 실행해야 합니다. 단일 gateway가 여러
에이전트와 채널을 호스팅할 수 있습니다.

여러 gateway가 필요한 경우는 의도적으로 격리 또는 rescue bot이 필요할 때뿐입니다.

유용한 확인:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

예상 동작:

- `gateway status --deep`은 `Other gateway-like services detected (best effort)`를 보고하고
  오래된 launchd/systemd/schtasks 설치가 남아 있을 때 정리 힌트를 출력할 수 있습니다.
- `gateway probe`는 둘 이상의 대상이
  응답할 때 `multiple reachable gateways`를 경고할 수 있습니다.
- 의도된 경우라면 gateway별로 포트, config/state, 워크스페이스 루트를 분리하세요.

인스턴스별 체크리스트:

- 고유한 `gateway.port`
- 고유한 `OPENCLAW_CONFIG_PATH`
- 고유한 `OPENCLAW_STATE_DIR`
- 고유한 `agents.defaults.workspace`

예시:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

자세한 설정: [/gateway/multiple-gateways](/ko/gateway/multiple-gateways).

## VoiceClaw 실시간 brain 엔드포인트

OpenClaw는 `/voiceclaw/realtime`에 VoiceClaw 호환 실시간 WebSocket 엔드포인트를 노출합니다. 별도의 relay
프로세스를 거치지 않고 VoiceClaw 데스크톱 클라이언트가 실시간 OpenClaw brain과
직접 통신해야 할 때 사용하세요.

이 엔드포인트는 실시간 오디오에 Gemini Live를 사용하고,
OpenClaw 도구를 Gemini Live에 직접 노출하여 OpenClaw를
brain으로 호출합니다. 도구 호출은 음성 턴의 반응성을 유지하기 위해 즉시 `working` 결과를 반환하고, 이후 OpenClaw가 실제 도구를 비동기로 실행한 뒤 결과를
live 세션에 다시 주입합니다. gateway 프로세스 환경에 `GEMINI_API_KEY`를 설정하세요. gateway 인증이 활성화되어 있으면 데스크톱 클라이언트는 첫 번째 `session.config` 메시지에 gateway 토큰 또는 비밀번호를 보냅니다.

실시간 brain 액세스는 owner 권한이 있는 OpenClaw 에이전트 명령을 실행합니다. `gateway.auth.mode: "none"`은 loopback 전용 테스트 인스턴스에만 제한하세요. 로컬이 아닌 실시간 brain 연결에는 gateway 인증이 필요합니다.

격리된 테스트 gateway의 경우 자체 포트, config,
state를 가진 별도 인스턴스를 실행하세요.

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

그런 다음 VoiceClaw를 다음과 같이 구성하세요.

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## 원격 액세스

권장: Tailscale/VPN.
fallback: SSH 터널.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

그런 다음 클라이언트를 로컬에서 `ws://127.0.0.1:18789`에 연결하세요.

<Warning>
SSH 터널은 gateway 인증을 우회하지 않습니다. 공유 비밀 인증의 경우 클라이언트는 여전히
터널을 통해서도 `token`/`password`를 보내야 합니다. ID 기반 모드의 경우에도
요청은 여전히 해당 인증 경로를 충족해야 합니다.
</Warning>

참조: [Remote Gateway](/ko/gateway/remote), [Authentication](/ko/gateway/authentication), [Tailscale](/ko/gateway/tailscale).

## 감독 및 서비스 라이프사이클

프로덕션 수준의 신뢰성을 위해 감독되는 실행을 사용하세요.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

재시작에는 `openclaw gateway restart`를 사용하세요. `openclaw gateway stop`과 `openclaw gateway start`를 연달아 사용하지 마세요. macOS에서 `gateway stop`은 중지 전에 LaunchAgent를 의도적으로 비활성화합니다.

LaunchAgent 레이블은 `ai.openclaw.gateway`(기본값) 또는 `ai.openclaw.<profile>`(이름 있는 프로필)입니다. `openclaw doctor`는 서비스 config 드리프트를 감사하고 복구합니다.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

로그아웃 후에도 유지하려면 lingering을 활성화하세요.

```bash
sudo loginctl enable-linger <user>
```

사용자 지정 설치 경로가 필요할 때의 수동 user-unit 예시:

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

기본 Windows 관리형 시작은 `OpenClaw Gateway`
(또는 이름 있는 프로필의 경우 `OpenClaw Gateway (<profile>)`)라는 이름의 Scheduled Task를 사용합니다. Scheduled Task
생성이 거부되면 OpenClaw는 state 디렉터리 안의 `gateway.cmd`를 가리키는 사용자별 Startup-folder launcher로 fallback합니다.

  </Tab>

  <Tab title="Linux (system service)">

다중 사용자/항상 실행되는 호스트에는 system unit를 사용하세요.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

user unit와 동일한 서비스 본문을 사용하되
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 아래에 설치하고 `openclaw` 바이너리가 다른 위치에 있으면
`ExecStart=`를 조정하세요.

  </Tab>
</Tabs>

## dev 프로필 빠른 경로

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

기본값에는 격리된 state/config와 기본 gateway 포트 `19001`이 포함됩니다.

## 프로토콜 빠른 참조 (operator 보기)

- 첫 번째 클라이언트 프레임은 반드시 `connect`여야 합니다.
- Gateway는 `hello-ok` 스냅샷(`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)을 반환합니다.
- `hello-ok.features.methods` / `events`는 보수적인 검색 목록이며,
  호출 가능한 모든 헬퍼 경로의 생성된 덤프가 아닙니다.
- 요청: `req(method, params)` → `res(ok/payload|error)`.
- 일반적인 이벤트에는 `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, pairing/approval 라이프사이클 이벤트, `shutdown`이 포함됩니다.

에이전트 실행은 2단계입니다.

1. 즉시 accepted ack (`status:"accepted"`)
2. 최종 완료 응답 (`status:"ok"|"error"`), 그 사이에 스트리밍되는 `agent` 이벤트 포함

전체 프로토콜 문서: [Gateway Protocol](/ko/gateway/protocol).

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

### 갭 복구

이벤트는 재생되지 않습니다. 시퀀스 갭이 발생하면 계속하기 전에 상태를 새로 고치세요(`health`, `system-presence`).

## 일반적인 실패 시그니처

| 시그니처                                                       | 가능한 문제                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | 유효한 gateway 인증 경로 없이 loopback이 아닌 bind 사용                         |
| `another gateway instance is already listening` / `EADDRINUSE` | 포트 충돌                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | config가 원격 모드로 설정되었거나, 손상된 config에서 로컬 모드 표시가 누락됨    |
| `unauthorized` during connect                                  | 클라이언트와 gateway 간 인증 불일치                                             |

전체 진단 순서는 [Gateway Troubleshooting](/ko/gateway/troubleshooting)을 사용하세요.

## 안전 보장

- Gateway 프로토콜 클라이언트는 Gateway를 사용할 수 없을 때 즉시 실패합니다(암시적인 direct-channel fallback 없음).
- 잘못된/non-connect 첫 프레임은 거부되고 연결이 종료됩니다.
- 정상 종료 시 소켓을 닫기 전에 `shutdown` 이벤트를 보냅니다.

---

관련 항목:

- [Troubleshooting](/ko/gateway/troubleshooting)
- [Background Process](/ko/gateway/background-process)
- [Configuration](/ko/gateway/configuration)
- [Health](/ko/gateway/health)
- [Doctor](/ko/gateway/doctor)
- [Authentication](/ko/gateway/authentication)

## 관련 항목

- [Configuration](/ko/gateway/configuration)
- [Gateway troubleshooting](/ko/gateway/troubleshooting)
- [Remote access](/ko/gateway/remote)
- [Secrets management](/ko/gateway/secrets)
