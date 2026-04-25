---
read_when:
    - Gateway 프로세스 실행 또는 디버깅
summary: Gateway 서비스, 수명 주기 및 운영을 위한 런북
title: Gateway 런북
x-i18n:
    generated_at: "2026-04-25T06:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Gateway 서비스의 Day 1 시작과 Day 2 운영에는 이 페이지를 사용하세요.

<CardGroup cols={2}>
  <Card title="심층 문제 해결" icon="siren" href="/ko/gateway/troubleshooting">
    증상 우선 진단과 정확한 명령어 순서, 로그 시그니처를 제공합니다.
  </Card>
  <Card title="구성" icon="sliders" href="/ko/gateway/configuration">
    작업 중심 설정 가이드 + 전체 구성 참조입니다.
  </Card>
  <Card title="비밀 관리" icon="key-round" href="/ko/gateway/secrets">
    SecretRef 계약, 런타임 스냅샷 동작, 마이그레이션/리로드 작업을 다룹니다.
  </Card>
  <Card title="비밀 계획 계약" icon="shield-check" href="/ko/gateway/secrets-plan-contract">
    정확한 `secrets apply` 대상/경로 규칙과 ref 전용 auth-profile 동작을 설명합니다.
  </Card>
</CardGroup>

## 5분 로컬 시작

<Steps>
  <Step title="Gateway 시작">

```bash
openclaw gateway --port 18789
# debug/trace를 stdio로 미러링
openclaw gateway --port 18789 --verbose
# 선택한 포트의 리스너를 강제 종료한 뒤 시작
openclaw gateway --force
```

  </Step>

  <Step title="서비스 상태 확인">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

정상 기준선: `Runtime: running`, `Connectivity probe: ok`, 그리고 예상과 일치하는 `Capability: ...`입니다. 단순 도달 가능성뿐 아니라 읽기 범위 RPC 증명이 필요할 때는 `openclaw gateway status --require-rpc`를 사용하세요.

  </Step>

  <Step title="채널 준비 상태 검증">

```bash
openclaw channels status --probe
```

Gateway에 도달 가능하면, 이 명령은 계정별 실시간 채널 probe와 선택적 감사를 실행합니다.
Gateway에 도달할 수 없으면, CLI는 실시간 probe 출력 대신 config 전용 채널 요약으로 대체합니다.

  </Step>
</Steps>

<Note>
Gateway config 리로드는 활성 config 파일 경로를 감시합니다(프로필/상태 기본값에서 확인되며, 설정된 경우 `OPENCLAW_CONFIG_PATH` 사용).
기본 모드는 `gateway.reload.mode="hybrid"`입니다.
첫 성공 로드 이후에는 실행 중인 프로세스가 활성 메모리 내 config 스냅샷을 제공하며, 성공적인 리로드는 해당 스냅샷을 원자적으로 교체합니다.
</Note>

## 런타임 모델

- 라우팅, 제어 평면, 채널 연결을 위한 항상 실행되는 단일 프로세스.
- 다음을 위한 단일 다중화 포트:
  - WebSocket 제어/RPC
  - HTTP API, OpenAI 호환(`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI 및 훅
- 기본 바인드 모드: `loopback`.
- 기본적으로 인증이 필요합니다. 공유 비밀 설정은
  `gateway.auth.token` / `gateway.auth.password`(또는
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)를 사용하고, non-loopback
  리버스 프록시 설정은 `gateway.auth.mode: "trusted-proxy"`를 사용할 수 있습니다.

## OpenAI 호환 엔드포인트

이제 OpenClaw의 가장 활용도 높은 호환 표면은 다음과 같습니다:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

이 집합이 중요한 이유:

- 대부분의 Open WebUI, LobeChat, LibreChat 통합은 먼저 `/v1/models`를 probe합니다.
- 많은 RAG 및 메모리 파이프라인은 `/v1/embeddings`를 기대합니다.
- 에이전트 네이티브 클라이언트는 점점 더 `/v1/responses`를 선호합니다.

계획 참고:

- `/v1/models`는 에이전트 우선입니다: `openclaw`, `openclaw/default`, `openclaw/<agentId>`를 반환합니다.
- `openclaw/default`는 항상 구성된 기본 에이전트에 매핑되는 안정적인 별칭입니다.
- 백엔드 프로바이더/모델 재정의를 원할 때는 `x-openclaw-model`을 사용하세요. 그렇지 않으면 선택한 에이전트의 일반 모델 및 임베딩 설정이 그대로 제어권을 유지합니다.

이들 모두는 메인 Gateway 포트에서 실행되며 나머지 Gateway HTTP API와 동일한 신뢰된 운영자 인증 경계를 사용합니다.

### 포트 및 바인드 우선순위

| 설정         | 확인 순서                                                     |
| ------------ | ------------------------------------------------------------- |
| Gateway 포트 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 바인드 모드  | CLI/override → `gateway.bind` → `loopback`                    |

### 핫 리로드 모드

| `gateway.reload.mode` | 동작                                      |
| --------------------- | ----------------------------------------- |
| `off`                 | config 리로드 없음                        |
| `hot`                 | 핫 세이프 변경만 적용                     |
| `restart`             | 리로드가 필요한 변경 시 재시작            |
| `hybrid` (기본값)     | 안전하면 핫 적용, 필요하면 재시작         |

## 운영자 명령어 집합

```bash
openclaw gateway status
openclaw gateway status --deep   # 시스템 수준 서비스 검사 추가
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep`는 더 깊은 RPC 상태 probe가 아니라 추가 서비스 검색용입니다(LaunchDaemons/systemd 시스템
유닛/schtasks).

## 여러 Gateway(같은 호스트)

대부분의 설치는 머신당 Gateway 하나를 실행해야 합니다. 하나의 Gateway는 여러
에이전트와 채널을 호스팅할 수 있습니다.

여러 Gateway가 필요한 경우는 의도적으로 격리하거나 구조용 봇을 원할 때뿐입니다.

유용한 확인:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

예상 동작:

- `gateway status --deep`는 `Other gateway-like services detected (best effort)`를 보고할 수 있으며
  오래된 launchd/systemd/schtasks 설치가 남아 있을 때 정리 힌트를 출력할 수 있습니다.
- `gateway probe`는 둘 이상의 대상이 응답할 때 `multiple reachable gateways`를 경고할 수 있습니다.
- 이것이 의도된 것이라면, Gateway마다 포트, config/state, workspace 루트를 분리하세요.

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

## VoiceClaw 실시간 브레인 엔드포인트

OpenClaw는 `/voiceclaw/realtime`에서 VoiceClaw 호환 실시간 WebSocket 엔드포인트를 제공합니다. VoiceClaw 데스크톱 클라이언트가 별도 릴레이 프로세스를 거치지 않고 실시간 OpenClaw 브레인과 직접 통신해야 할 때 이를 사용하세요.

이 엔드포인트는 실시간 오디오에 Gemini Live를 사용하고, OpenClaw 도구를 직접 Gemini Live에 노출함으로써 OpenClaw를 브레인으로 호출합니다. 도구 호출은 음성 턴의 반응성을 유지하기 위해 즉시 `working` 결과를 반환하고, 이후 OpenClaw가 실제 도구를 비동기로 실행한 뒤 결과를 실시간 세션에 다시 주입합니다. Gateway 프로세스 환경에 `GEMINI_API_KEY`를 설정하세요. Gateway 인증이 활성화된 경우, 데스크톱 클라이언트는 첫 `session.config` 메시지에 Gateway 토큰 또는 비밀번호를 보냅니다.

실시간 브레인 액세스는 소유자 승인된 OpenClaw 에이전트 명령을 실행합니다. `gateway.auth.mode: "none"`은 loopback 전용 테스트 인스턴스에만 제한하세요. 비로컬 실시간 브레인 연결에는 Gateway 인증이 필요합니다.

격리된 테스트 Gateway의 경우, 자체 포트, config, state를 가진 별도 인스턴스를 실행하세요:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

그런 다음 VoiceClaw를 다음으로 구성하세요:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## 원격 액세스

권장: Tailscale/VPN.
대체: SSH 터널.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

그런 다음 클라이언트를 로컬에서 `ws://127.0.0.1:18789`에 연결합니다.

<Warning>
SSH 터널은 gateway 인증을 우회하지 않습니다. 공유 비밀 인증의 경우, 클라이언트는 터널을 통해서도 여전히 `token`/`password`를 보내야 합니다. ID 기반 모드의 경우에도 요청은 여전히 해당 인증 경로를 충족해야 합니다.
</Warning>

참고: [원격 Gateway](/ko/gateway/remote), [인증](/ko/gateway/authentication), [Tailscale](/ko/gateway/tailscale).

## 감독 및 서비스 수명 주기

프로덕션 수준의 신뢰성을 위해 감독 실행을 사용하세요.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent 레이블은 `ai.openclaw.gateway`(기본값) 또는 `ai.openclaw.<profile>`(이름 있는 프로필)입니다. `openclaw doctor`는 서비스 config 드리프트를 감사하고 복구합니다.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

로그아웃 후에도 지속되도록 하려면 lingering을 활성화하세요:

```bash
sudo loginctl enable-linger <user>
```

사용자 지정 설치 경로가 필요할 때의 수동 사용자 유닛 예시:

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

네이티브 Windows 관리형 시작은 `OpenClaw Gateway`라는 이름의 Scheduled Task를 사용합니다(이름 있는 프로필은 `OpenClaw Gateway (<profile>)`). Scheduled Task 생성이 거부되면, OpenClaw는 상태 디렉터리의 `gateway.cmd`를 가리키는 사용자별 시작 폴더 launcher로 대체합니다.

  </Tab>

  <Tab title="Linux (system service)">

다중 사용자/항상 실행 호스트에는 시스템 유닛을 사용하세요.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

사용자 유닛과 동일한 서비스 본문을 사용하되,
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 아래에 설치하고
`openclaw` 바이너리가 다른 위치에 있다면 `ExecStart=`를 조정하세요.

  </Tab>
</Tabs>

## dev 프로필 빠른 경로

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

기본값에는 격리된 상태/config와 기본 Gateway 포트 `19001`이 포함됩니다.

## 프로토콜 빠른 참조(운영자 보기)

- 첫 번째 클라이언트 프레임은 반드시 `connect`여야 합니다.
- Gateway는 `hello-ok` 스냅샷(`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)을 반환합니다.
- `hello-ok.features.methods` / `events`는 보수적인 검색 목록이며, 호출 가능한 모든 도우미 경로를 생성 덤프한 것이 아닙니다.
- 요청: `req(method, params)` → `res(ok/payload|error)`.
- 일반 이벤트에는 `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, 페어링/승인 수명 주기 이벤트, `shutdown`이 포함됩니다.

에이전트 실행은 2단계입니다:

1. 즉시 수락 ack(`status:"accepted"`)
2. 최종 완료 응답(`status:"ok"|"error"`), 그 사이에 스트리밍 `agent` 이벤트가 옴

전체 프로토콜 문서: [Gateway Protocol](/ko/gateway/protocol).

## 운영 점검

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

이벤트는 재생되지 않습니다. 시퀀스 갭이 발생하면 계속하기 전에 상태(`health`, `system-presence`)를 새로 고치세요.

## 일반적인 실패 시그니처

| 시그니처                                                      | 가능성이 높은 문제                                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | 유효한 Gateway 인증 경로 없이 non-loopback 바인드 시도                          |
| `another gateway instance is already listening` / `EADDRINUSE` | 포트 충돌                                                                        |
| `Gateway start blocked: set gateway.mode=local`               | config가 remote 모드로 설정되어 있거나, 손상된 config에서 로컬 모드 스탬프가 누락됨 |
| `unauthorized` during connect                                 | 클라이언트와 Gateway 간 인증 불일치                                              |

전체 진단 순서는 [Gateway Troubleshooting](/ko/gateway/troubleshooting)을 사용하세요.

## 안전 보장

- Gateway 프로토콜 클라이언트는 Gateway를 사용할 수 없으면 즉시 실패합니다(암시적 직접 채널 대체 없음).
- 유효하지 않거나 `connect`가 아닌 첫 프레임은 거부되고 연결이 닫힙니다.
- 정상 종료 시 소켓이 닫히기 전에 `shutdown` 이벤트가 전송됩니다.

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
