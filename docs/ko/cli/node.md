---
read_when:
    - headless Node 호스트 실행하기
    - '`system.run`용 비-macOS Node 페어링하기'
summary: '`openclaw node`용 CLI 참조(headless node host)'
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket에 연결하고 이 머신에서 `system.run` / `system.which`를 노출하는 **headless Node 호스트**를 실행합니다.

## 왜 Node 호스트를 사용하나요?

네트워크의 **다른 머신에서 명령을 실행**하도록 에이전트를 사용하고 싶지만, 해당 머신에 전체 macOS companion 앱을 설치하고 싶지 않을 때 Node 호스트를 사용하세요.

일반적인 사용 사례:

- 원격 Linux/Windows 머신(빌드 서버, 랩 머신, NAS)에서 명령 실행
- exec는 Gateway에서 **샌드박스 처리**하고, 승인된 실행만 다른 호스트에 위임
- 자동화 또는 CI node용 경량 headless 실행 대상 제공

실행은 여전히 Node 호스트의 **exec 승인**과 에이전트별 allowlist로 보호되므로, 명령 접근 범위를 명시적으로 제한할 수 있습니다.

## 브라우저 프록시(구성 불필요)

Node 호스트는 node에서 `browser.enabled`가 비활성화되지 않은 경우 자동으로 브라우저 프록시를 알립니다. 이를 통해 추가 구성 없이도 에이전트가 해당 node에서 브라우저 자동화를 사용할 수 있습니다.

기본적으로 프록시는 node의 일반 브라우저 프로필 표면을 노출합니다. `nodeHost.browserProxy.allowProfiles`를 설정하면 프록시는 제한적으로 동작합니다. allowlist에 없는 프로필 대상 지정은 거부되며, 영구 프로필 생성/삭제 경로는 프록시를 통해 차단됩니다.

필요한 경우 node에서 비활성화하세요:

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
- `--node-id <id>`: node id 재정의(pairing 토큰 삭제)
- `--display-name <name>`: node 표시 이름 재정의

## Node 호스트용 Gateway 인증

`openclaw node run`과 `openclaw node install`은 구성/env에서 Gateway 인증을 확인합니다(node 명령에는 `--token`/`--password` 플래그가 없음):

- 먼저 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`를 확인합니다.
- 그다음 로컬 구성 폴백: `gateway.auth.token` / `gateway.auth.password`.
- 로컬 모드에서 Node 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`를 상속하지 않습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 확인되지 않으면, node 인증 확인은 fail closed로 실패합니다(원격 폴백으로 가려지지 않음).
- `gateway.mode=remote`에서는 원격 클라이언트 필드(`gateway.remote.token` / `gateway.remote.password`)도 원격 우선순위 규칙에 따라 사용할 수 있습니다.
- Node 호스트 인증 확인은 `OPENCLAW_GATEWAY_*` env vars만 인정합니다.

신뢰할 수 있는 사설 네트워크에서 non-loopback `ws://` Gateway에 연결하는 node의 경우 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요. 그렇지 않으면 node 시작은 fail closed로 실패하며 `wss://`, SSH 터널, 또는 Tailscale 사용을 요구합니다. 이는 `openclaw.json` 구성 키가 아니라 프로세스 환경 opt-in입니다. `openclaw node install`은 설치 명령 환경에 이 값이 있으면 감독되는 node 서비스에 이를 영구 저장합니다.

## 서비스(백그라운드)

headless Node 호스트를 사용자 서비스로 설치합니다.

```bash
openclaw node install --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--tls`: Gateway 연결에 TLS 사용
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: node id 재정의(pairing 토큰 삭제)
- `--display-name <name>`: node 표시 이름 재정의
- `--runtime <runtime>`: 서비스 런타임(`node` 또는 `bun`)
- `--force`: 이미 설치된 경우 재설치/덮어쓰기

서비스 관리:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

포그라운드 Node 호스트(서비스 없음)에는 `openclaw node run`을 사용하세요.

서비스 명령은 기계가 읽을 수 있는 출력을 위해 `--json`을 지원합니다.

Node 호스트는 프로세스 내에서 Gateway 재시작과 네트워크 종료를 재시도합니다. Gateway가 최종 token/password/bootstrap 인증 일시 중지를 보고하면, Node 호스트는 종료 세부 정보를 기록하고 0이 아닌 값으로 종료하므로 launchd/systemd가 새 구성과 자격 증명으로 다시 시작할 수 있습니다. pairing 필요 일시 중지는 보류 중인 요청을 승인할 수 있도록 포그라운드 흐름에 유지됩니다.

## 페어링

첫 연결 시 Gateway에 보류 중인 device pairing 요청(`role: node`)이 생성됩니다.
다음으로 승인하세요:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

엄격하게 제어되는 node 네트워크에서는 Gateway 운영자가 신뢰된 CIDR에서의 최초 node pairing 자동 승인을 명시적으로 opt-in할 수 있습니다:

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

이는 기본적으로 비활성화되어 있습니다. 요청된 scope가 없는 새 `role: node` pairing에만 적용됩니다. 운영자/브라우저 클라이언트, Control UI, WebChat, 그리고 role, scope, metadata 또는 공개 키 업그레이드는 여전히 수동 승인이 필요합니다.

Node가 변경된 인증 세부 정보(role/scopes/public key)로 pairing을 재시도하면 이전 보류 요청은 대체되고 새 `requestId`가 생성됩니다. 승인 전에 `openclaw devices list`를 다시 실행하세요.

Node 호스트는 node id, token, 표시 이름, Gateway 연결 정보를 `~/.openclaw/node.json`에 저장합니다.

## Exec 승인

`system.run`은 로컬 exec 승인에 의해 제한됩니다:

- `~/.openclaw/exec-approvals.json`
- [Exec 승인](/ko/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`(Gateway에서 편집)

승인된 비동기 node exec의 경우 OpenClaw는 프롬프트 전에 정식 `systemRunPlan`을 준비합니다. 이후 승인된 `system.run` 전달은 저장된 해당 plan을 재사용하므로, 승인 요청이 생성된 이후의 command/cwd/session 필드 편집은 node가 실행할 내용을 바꾸는 대신 거부됩니다.

## 관련

- [CLI 참조](/ko/cli)
- [Nodes](/ko/nodes)
