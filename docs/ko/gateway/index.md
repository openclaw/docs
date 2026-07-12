---
read_when:
    - Gateway 프로세스 실행 또는 디버깅
summary: Gateway 서비스, 수명 주기 및 운영을 위한 런북
title: Gateway 운영 지침서
x-i18n:
    generated_at: "2026-07-12T15:15:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

이 페이지는 Gateway 서비스의 첫날 시작과 이후 운영에 사용하십시오.

<CardGroup cols={2}>
  <Card title="심층 문제 해결" icon="siren" href="/ko/gateway/troubleshooting">
    정확한 명령 단계와 로그 특징을 활용하는 증상 우선 진단입니다.
  </Card>
  <Card title="구성" icon="sliders" href="/ko/gateway/configuration">
    작업 중심 설정 가이드와 전체 구성 참조입니다.
  </Card>
  <Card title="비밀 관리" icon="key-round" href="/ko/gateway/secrets">
    SecretRef 계약, 런타임 스냅샷 동작, 마이그레이션/다시 로드 작업입니다.
  </Card>
  <Card title="비밀 계획 계약" icon="shield-check" href="/ko/gateway/secrets-plan-contract">
    정확한 `secrets apply` 대상/경로 규칙과 참조 전용 인증 프로필 동작입니다.
  </Card>
</CardGroup>

## 5분 로컬 시작

<Steps>
  <Step title="Gateway 시작">

```bash
openclaw gateway --port 18789
# 디버그/추적을 stdio에 미러링
openclaw gateway --port 18789 --verbose
# 선택한 포트의 리스너를 강제 종료한 다음 시작
openclaw gateway --force
```

  </Step>

  <Step title="서비스 상태 확인">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

정상 기준: `Runtime: running`, `Connectivity probe: ok`, 그리고 예상과 일치하는 `Capability` 줄입니다. 단순한 도달 가능성이 아니라 읽기 범위 RPC를 입증하려면 `openclaw gateway status --require-rpc`를 사용하십시오.

  </Step>

  <Step title="채널 준비 상태 검증">

```bash
openclaw channels status --probe
```

Gateway에 연결할 수 있으면 계정별 채널 실시간 프로브와 선택적 감사를 실행합니다. Gateway에 연결할 수 없으면 CLI가 구성 전용 채널 요약으로 대체합니다.

  </Step>
</Steps>

<Note>
Gateway 구성 다시 로드는 활성 구성 파일 경로(프로필/상태 기본값에서 확인되거나 설정된 경우 `OPENCLAW_CONFIG_PATH`)를 감시합니다. 기본 모드는 `gateway.reload.mode="hybrid"`입니다. 첫 번째 로드가 성공한 후에는 실행 중인 프로세스가 활성 메모리 내 구성 스냅샷을 제공하며, 다시 로드에 성공하면 해당 스냅샷을 원자적으로 교체합니다.
</Note>

## 런타임 모델

- 라우팅, 제어 영역, 채널 연결을 위한 상시 실행 프로세스 하나입니다.
- 다음 용도의 단일 다중화 포트:
  - WebSocket 제어/RPC
  - HTTP API (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - 선택적 `/api/v1/admin/rpc`와 같은 Plugin HTTP 경로
  - 제어 UI 및 훅
- 기본 바인드 모드: `loopback`. 감지된 컨테이너 환경에서는 포트 전달을 위해 `0.0.0.0`으로 확인되는 `auto`가 유효 기본값입니다. 단, Tailscale serve/funnel이 활성 상태이면 항상 `loopback`을 강제합니다.
- 기본적으로 인증이 필요합니다. 공유 비밀 설정은 `gateway.auth.token` / `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)를 사용하며, 비루프백 역방향 프록시 설정은 `gateway.auth.mode: "trusted-proxy"`를 사용할 수 있습니다.

## OpenAI 호환 엔드포인트

OpenClaw에서 가장 큰 효과를 제공하는 호환성 표면:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

이 집합이 중요한 이유:

- 대부분의 Open WebUI, LobeChat, LibreChat 통합은 먼저 `/v1/models`를 프로브합니다.
- 많은 RAG 및 메모리 파이프라인은 `/v1/embeddings`를 기대합니다.
- 에이전트 네이티브 클라이언트는 점점 `/v1/responses`를 선호합니다.

`/v1/models`는 에이전트 우선입니다. 구성된 모든 에이전트에 대해 `openclaw`, `openclaw/default`, `openclaw/<agentId>`를 반환합니다. `openclaw/default`는 항상 구성된 기본 에이전트에 매핑되는 안정적인 별칭입니다. 백엔드 제공자/모델을 재정의하려면 `x-openclaw-model`을 보내십시오. 그렇지 않으면 선택한 에이전트의 일반 모델 및 임베딩 설정이 제어권을 유지합니다.

이 엔드포인트는 모두 기본 Gateway 포트에서 실행되며 나머지 Gateway HTTP API와 동일한 신뢰할 수 있는 운영자 인증 경계를 사용합니다.

관리자 HTTP RPC(`POST /api/v1/admin/rpc`)는 WebSocket RPC를 사용할 수 없는 호스트 도구를 위한 별도의 기본 비활성화 Plugin 경로입니다. [관리자 HTTP RPC](/ko/plugins/admin-http-rpc)를 참조하십시오.

### 포트 및 바인드 우선순위

| 설정         | 확인 순서                                                            |
| ------------ | -------------------------------------------------------------------- |
| Gateway 포트 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| 바인드 모드  | CLI/재정의 → `gateway.bind` → `loopback`(또는 컨테이너의 `auto`)      |

설치된 Gateway 서비스는 확인된 `--port`를 감독자 메타데이터에 기록합니다. `gateway.port`를 변경한 후에는 launchd/systemd/schtasks가 새 포트에서 프로세스를 시작하도록 `openclaw doctor --fix` 또는 `openclaw gateway install --force`를 실행하십시오.

Gateway 시작 시 비루프백 바인드를 위한 로컬 제어 UI 원본을 초기화할 때도 동일한 유효 포트와 바인드를 사용합니다. 예를 들어 `--bind lan --port 3000`은 런타임 검증이 실행되기 전에 `http://localhost:3000`과 `http://127.0.0.1:3000`을 초기화합니다. HTTPS 프록시 URL과 같은 원격 브라우저 원본은 `gateway.controlUi.allowedOrigins`에 명시적으로 추가하십시오.

### 핫 다시 로드 모드

| `gateway.reload.mode` | 동작                                           |
| --------------------- | ---------------------------------------------- |
| `off`                 | 구성을 다시 로드하지 않음                      |
| `hot`                 | 핫 적용에 안전한 변경 사항만 적용              |
| `restart`             | 다시 시작이 필요한 변경 시 다시 시작           |
| `hybrid` (기본값)     | 안전하면 핫 적용하고 필요한 경우 다시 시작     |

## 운영자 명령 집합

```bash
openclaw gateway status
openclaw gateway status --deep   # 시스템 수준 서비스 검색 추가
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep`은 더 심층적인 RPC 상태 프로브가 아니라 추가 서비스 검색(LaunchDaemons/systemd 시스템 단위/schtasks)을 위한 것입니다.

## 여러 Gateway(동일 호스트)

대부분의 설치에서는 머신당 하나의 Gateway를 실행해야 합니다. 단일 Gateway가 여러 에이전트와 채널을 호스팅할 수 있습니다. 의도적으로 격리하거나 구조용 봇이 필요한 경우에만 여러 Gateway가 필요합니다.

유용한 검사:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

예상되는 결과:

- 오래된 launchd/systemd/schtasks 설치가 아직 남아 있으면 `gateway status --deep`이 `Other gateway-like services detected (best effort)`를 보고하고 정리 힌트를 출력할 수 있습니다.
- 서로 다른 Gateway가 응답하거나 OpenClaw가 도달 가능한 대상이 동일한 Gateway임을 입증할 수 없으면 `gateway probe`가 `multiple reachable gateway identities`를 경고할 수 있습니다. 동일한 Gateway에 대한 SSH 터널, 프록시 URL 또는 구성된 원격 URL은 전송 포트가 다르더라도 여러 전송 방식을 사용하는 하나의 Gateway입니다.
- 의도한 구성이라면 Gateway별로 포트, 구성/상태, 작업 공간 루트를 격리하십시오.

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
대체 방법: SSH 터널.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

그런 다음 클라이언트를 로컬의 `ws://127.0.0.1:18789`에 연결하십시오.

<Warning>
SSH 터널은 Gateway 인증을 우회하지 않습니다. 공유 비밀 인증의 경우 클라이언트는 터널을 통하더라도
여전히 `token`/`password`를 보내야 합니다. ID가 포함된 모드에서는
요청이 여전히 해당 인증 경로를 충족해야 합니다.
</Warning>

참조: [원격 Gateway](/ko/gateway/remote), [인증](/ko/gateway/authentication), [Tailscale](/ko/gateway/tailscale).

## 감독 및 서비스 수명 주기

프로덕션과 유사한 안정성을 위해 감독 실행을 사용하십시오.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

다시 시작하려면 `openclaw gateway restart`를 사용하십시오. 다시 시작을 대신해 `openclaw gateway stop`과 `openclaw gateway start`를 연이어 실행하지 마십시오.

macOS에서 `gateway stop`은 기본적으로 `launchctl bootout`을 사용합니다. 이는 비활성화 상태를 영구 저장하지 않고 현재 부팅 세션에서 LaunchAgent를 제거하므로, 예기치 않은 충돌 후에도 KeepAlive 자동 복구가 계속 작동하고 `gateway start`로 깔끔하게 다시 활성화할 수 있습니다. 재부팅 후에도 자동 재생성을 지속적으로 억제하려면 `--disable`을 전달하십시오: `openclaw gateway stop --disable`.

LaunchAgent 레이블은 `ai.openclaw.gateway`(기본값) 또는 `ai.openclaw.<profile>`(명명된 프로필)입니다. `openclaw doctor`는 서비스 구성 드리프트를 감사하고 복구합니다.

  </Tab>

  <Tab title="Linux (systemd 사용자)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

로그아웃 후에도 지속되도록 하려면 링거링을 활성화하십시오.

```bash
sudo loginctl enable-linger $(whoami)
```

데스크톱 세션이 없는 헤드리스 서버에서는 `systemctl --user` 명령을 다시 시도하기 전에 `XDG_RUNTIME_DIR`도 설정되어 있는지 확인하십시오(`export XDG_RUNTIME_DIR=/run/user/$(id -u)`).

사용자 지정 설치 경로가 필요할 때 사용할 수동 사용자 단위 예:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
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

네이티브 Windows 관리형 시작은 `OpenClaw Gateway`라는 이름의 예약된 작업
(명명된 프로필의 경우 `OpenClaw Gateway (<profile>)`)을 사용합니다. 예약된 작업
생성이 거부되면 OpenClaw는 상태 디렉터리 내부의 `gateway.cmd`를 가리키는
사용자별 시작 폴더 실행기로 대체합니다.

  </Tab>

  <Tab title="Linux (시스템 서비스)">

다중 사용자/상시 실행 호스트에는 시스템 단위를 사용하십시오.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

사용자 단위와 동일한 서비스 본문을 사용하되,
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 아래에 설치하고
`openclaw` 바이너리가 다른 위치에 있으면 `ExecStart=`를 조정하십시오.

동일한 프로필/포트에 대해 `openclaw doctor --fix`가 사용자 수준 Gateway 서비스도 설치하도록 두지 마십시오. Doctor는 시스템 수준 OpenClaw Gateway 서비스를 발견하면 해당 자동 설치를 거부합니다. 시스템 단위가 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 사용하십시오.

  </Tab>
</Tabs>

잘못된 구성 오류는 코드 `78`로 종료됩니다. Linux systemd 단위는 구성이 수정될 때까지 다시 실행하지 않도록 `RestartPreventExitStatus=78`을 사용합니다. launchd와 Windows Task Scheduler에는 종료 코드별로 중지하는 동등한 규칙이 없으므로, Gateway는 빠르게 반복되는 비정상 부팅 기록도 영구 저장하고 시작 실패가 반복되면 채널/제공자 계정 자동 시작을 억제합니다. 해당 안전 모드에서도 검사와 복구를 위한 제어 영역은 계속 시작되며, 구성 핫 다시 로드와 `secrets.reload`는 자동 채널 다시 시작을 거부하고, 명시적인 운영자 `channels.start` 요청으로 억제를 재정의할 수 있습니다.

## 개발 프로필 빠른 경로

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

기본값에는 격리된 상태/구성과 기본 Gateway 포트 `19001`이 포함됩니다.

## 프로토콜 빠른 참조(운영자 관점)

- 첫 번째 클라이언트 프레임은 `connect`여야 합니다.
- Gateway는 `snapshot`(`presence`, `health`, `stateVersion`, `uptimeMs`)과 `policy` 제한(`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`)이 포함된 `hello-ok` 프레임을 반환합니다.
- `hello-ok.features.methods` / `events`는 보수적인 검색 목록이며, 호출 가능한 모든 헬퍼 경로를
  생성하여 덤프한 목록이 아닙니다.
- 요청: `req(method, params)` → `res(ok/payload|error)`.
- 일반적인 이벤트에는 `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, 옵트인 방식의
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, 페어링/승인 수명 주기 이벤트, `shutdown`이 포함됩니다.

에이전트 실행은 2단계로 이루어집니다.

1. 즉시 수락 확인 응답(`status:"accepted"`)
2. 최종 완료 응답(`status:"ok"|"error"`). 두 응답 사이에는 `agent` 이벤트가 스트리밍됩니다.

전체 프로토콜 문서는 [Gateway 프로토콜](/ko/gateway/protocol)을 참조하십시오.

## 운영 점검

### 활성 상태

- WS를 열고 `connect`를 전송합니다.
- 스냅샷이 포함된 `hello-ok` 응답을 기다립니다.

### 준비 상태

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 간격 복구

이벤트는 재생되지 않습니다. 시퀀스에 간격이 발생하면 계속하기 전에 상태(`health`, `system-presence`)를 새로 고치십시오.

## 일반적인 오류 징후

| 징후                                                           | 가능한 문제                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | 유효한 Gateway 인증 경로 없이 비루프백 주소에 바인딩함                         |
| `another gateway instance is already listening` / `EADDRINUSE` | 포트 충돌                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 구성이 원격 모드로 설정되었거나 손상된 구성에 `gateway.mode`가 누락됨          |
| 연결 중 `unauthorized`                                        | 클라이언트와 Gateway 간 인증 불일치                                            |

전체 진단 절차는 [Gateway 문제 해결](/ko/gateway/troubleshooting)을 참조하십시오.

## 안전 보장

- Gateway를 사용할 수 없으면 Gateway 프로토콜 클라이언트가 즉시 실패합니다(암시적인 직접 채널 대체 경로 없음).
- 유효하지 않거나 연결 프레임이 아닌 첫 번째 프레임은 거부되고 연결이 종료됩니다.
- 정상 종료 시 소켓이 닫히기 전에 `shutdown` 이벤트가 발생합니다.

## 관련 문서

- [구성](/ko/gateway/configuration)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
- [백그라운드 프로세스](/ko/gateway/background-process)
- [상태 확인](/ko/gateway/health)
- [Doctor](/ko/gateway/doctor)
- [인증](/ko/gateway/authentication)
- [원격 액세스](/ko/gateway/remote)
- [보안 비밀 관리](/ko/gateway/secrets)
