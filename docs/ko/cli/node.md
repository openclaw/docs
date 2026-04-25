---
read_when:
    - headless node host 실행하기
    - system.run용 비-macOS Node 페어링하기
summary: '`openclaw node`용 CLI 참조(headless node host)'
title: Node
x-i18n:
    generated_at: "2026-04-25T05:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket에 연결하고 이 머신에서 `system.run` / `system.which`를 노출하는 **headless node host**를 실행합니다.

## 왜 node host를 사용하나요?

네트워크 내의 **다른 머신에서 명령을 실행**하고 싶지만, 그곳에 전체 macOS companion 앱을 설치하고 싶지 않을 때 node host를 사용하세요.

일반적인 사용 사례:

- 원격 Linux/Windows 장비(빌드 서버, 랩 머신, NAS)에서 명령 실행
- exec는 gateway에서 **sandboxed** 상태로 유지하되, 승인된 실행은 다른 호스트에 위임
- 자동화 또는 CI Node를 위한 가벼운 headless 실행 대상 제공

실행은 여전히 node host의 **exec approvals** 및 에이전트별 allowlist로 보호되므로, 명령 접근 범위를 제한적이고 명시적으로 유지할 수 있습니다.

## 브라우저 프록시(무설정)

Node에서 `browser.enabled`가 비활성화되지 않은 경우, Node host는 자동으로 브라우저 프록시를 광고합니다. 이렇게 하면 에이전트가 추가 설정 없이 해당 Node에서 브라우저 자동화를 사용할 수 있습니다.

기본적으로 이 프록시는 Node의 일반 브라우저 프로필 표면을 노출합니다. `nodeHost.browserProxy.allowProfiles`를 설정하면 프록시는 제한적으로 동작합니다. allowlist에 없는 프로필 대상 지정은 거부되며, 영구 프로필 생성/삭제 라우트는 프록시를 통해 차단됩니다.

필요하면 Node에서 비활성화하세요:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 실행(포그라운드)

```bash
openclaw node run --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--tls`: Gateway 연결에 TLS 사용
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: Node id override(페어링 토큰 초기화)
- `--display-name <name>`: Node 표시 이름 override

## node host용 Gateway 인증

`openclaw node run` 및 `openclaw node install`은 config/env에서 gateway 인증을 확인합니다(node 명령에는 `--token`/`--password` 플래그가 없음):

- 먼저 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`를 확인합니다.
- 그다음 로컬 config 폴백: `gateway.auth.token` / `gateway.auth.password`.
- 로컬 모드에서는 node host가 의도적으로 `gateway.remote.token` / `gateway.remote.password`를 상속하지 않습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 해석되지 않으면, node 인증 확인은 fail-closed로 실패합니다(원격 폴백이 이를 가리지 않음).
- `gateway.mode=remote`에서는 원격 클라이언트 필드(`gateway.remote.token` / `gateway.remote.password`)도 원격 우선순위 규칙에 따라 대상이 됩니다.
- node host 인증 확인은 `OPENCLAW_GATEWAY_*` 환경 변수만 존중합니다.

신뢰할 수 있는 사설 네트워크에서 non-loopback `ws://` Gateway에 연결하는 Node의 경우, `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요. 이 값이 없으면 node 시작은 fail-closed로 실패하고 `wss://`, SSH 터널, 또는 Tailscale 사용을 요구합니다.
이것은 `openclaw.json` config 키가 아니라 프로세스 환경 opt-in입니다.
`openclaw node install`은 설치 명령 환경에 이 값이 존재할 경우 이를 감독되는 node 서비스에 지속적으로 저장합니다.

## 서비스(백그라운드)

headless node host를 사용자 서비스로 설치합니다.

```bash
openclaw node install --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--tls`: Gateway 연결에 TLS 사용
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: Node id override(페어링 토큰 초기화)
- `--display-name <name>`: Node 표시 이름 override
- `--runtime <runtime>`: 서비스 런타임(`node` 또는 `bun`)
- `--force`: 이미 설치된 경우 재설치/덮어쓰기

서비스 관리:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

포그라운드 node host(서비스 없음)에는 `openclaw node run`을 사용하세요.

서비스 명령은 기계 판독 가능한 출력을 위해 `--json`을 지원합니다.

## 페어링

첫 번째 연결은 Gateway에 대기 중인 디바이스 페어링 요청(`role: node`)을 생성합니다.
다음으로 승인하세요:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

엄격하게 통제되는 node 네트워크에서는 Gateway 운영자가 신뢰된 CIDR의 최초 node 페어링 자동 승인을 명시적으로 opt in할 수 있습니다:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

이 기능은 기본적으로 비활성화되어 있습니다. 요청된 scopes가 없는 새로운 `role: node` 페어링에만 적용됩니다. Operator/브라우저 클라이언트, Control UI, WebChat, 그리고 role, scope, metadata, 또는 public-key 업그레이드는 여전히 수동 승인이 필요합니다.

Node가 변경된 인증 세부정보(role/scopes/public key)로 페어링을 재시도하면, 이전 대기 요청은 대체되고 새 `requestId`가 생성됩니다.
승인 전에 `openclaw devices list`를 다시 실행하세요.

node host는 자신의 node id, 토큰, 표시 이름, Gateway 연결 정보를 `~/.openclaw/node.json`에 저장합니다.

## exec approvals

`system.run`은 로컬 exec approvals로 제어됩니다:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/ko/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway에서 편집)

승인된 비동기 node exec의 경우, OpenClaw는 프롬프트 전에 정식 `systemRunPlan`을 준비합니다. 이후 승인된 `system.run` 전달은 저장된 해당 계획을 재사용하므로, 승인 요청 생성 후 명령/cwd/session 필드를 수정해 node가 실행할 내용을 바꾸려는 시도는 거부됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Nodes](/ko/nodes)
