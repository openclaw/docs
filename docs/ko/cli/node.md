---
read_when:
    - 헤드리스 노드 호스트 실행하기
    - system.run용 비-macOS 노드 페어링
summary: '`openclaw node`용 CLI 참조(헤드리스 Node 호스트)'
title: Node
x-i18n:
    generated_at: "2026-06-27T17:18:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket에 연결하고 이 머신에서 `system.run` / `system.which`를 노출하는 **헤드리스 노드 호스트**를 실행합니다.

## 노드 호스트를 사용하는 이유

전체 macOS 컴패니언 앱을 설치하지 않고도 네트워크의 **다른 머신에서 명령을 실행**하도록 에이전트에 허용하려면 노드 호스트를 사용하세요.

일반적인 사용 사례:

- 원격 Linux/Windows 머신(빌드 서버, 랩 머신, NAS)에서 명령을 실행합니다.
- Gateway에서는 exec를 **샌드박스 처리**하되, 승인된 실행은 다른 호스트에 위임합니다.
- 자동화 또는 CI 노드를 위한 가볍고 헤드리스인 실행 대상을 제공합니다.

실행은 여전히 노드 호스트의 **exec 승인** 및 에이전트별 허용 목록으로 보호되므로, 명령 접근 범위를 제한하고 명시적으로 유지할 수 있습니다.

## 브라우저 프록시(구성 불필요)

노드에서 `browser.enabled`가 비활성화되어 있지 않으면 노드 호스트는 브라우저 프록시를 자동으로 알립니다. 이를 통해 추가 구성 없이 에이전트가 해당 노드에서 브라우저 자동화를 사용할 수 있습니다.

기본적으로 프록시는 노드의 일반 브라우저 프로필 표면을 노출합니다. `nodeHost.browserProxy.allowProfiles`를 설정하면 프록시는 제한적으로 동작합니다. 허용 목록에 없는 프로필 대상 지정은 거부되고, 영구 프로필 생성/삭제 경로는 프록시를 통해 차단됩니다.

필요한 경우 노드에서 비활성화하세요.

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
- `--node-id <id>`: 노드 ID 재정의(페어링 토큰 지움)
- `--display-name <name>`: 노드 표시 이름 재정의

## 노드 호스트용 Gateway 인증

`openclaw node run` 및 `openclaw node install`은 config/env에서 Gateway 인증을 해석합니다(노드 명령에는 `--token`/`--password` 플래그 없음).

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`를 먼저 확인합니다.
- 그런 다음 로컬 구성 폴백: `gateway.auth.token` / `gateway.auth.password`.
- 로컬 모드에서 노드 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`를 상속하지 않습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 해석되지 않으면, 노드 인증 해석은 닫힌 상태로 실패합니다(원격 폴백으로 가려지지 않음).
- `gateway.mode=remote`에서는 원격 우선순위 규칙에 따라 원격 클라이언트 필드(`gateway.remote.token` / `gateway.remote.password`)도 사용할 수 있습니다.
- 노드 호스트 인증 해석은 `OPENCLAW_GATEWAY_*` env var만 따릅니다.

평문 `ws://` Gateway에 연결하는 노드의 경우, 루프백, 사설 IP 리터럴, `.local`, Tailnet `*.ts.net` 호스트가 허용됩니다. 그 외 신뢰할 수 있는 사설 DNS 이름의 경우 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요. 설정하지 않으면 노드 시작이 닫힌 상태로 실패하고 `wss://`, SSH 터널 또는 Tailscale을 사용하라는 메시지가 표시됩니다. 이는 프로세스 환경 옵트인이며, `openclaw.json` 구성 키가 아닙니다.
설치 명령 환경에 존재하는 경우 `openclaw node install`은 이를 감독되는 노드 서비스에 유지합니다.

## 서비스(백그라운드)

헤드리스 노드 호스트를 사용자 서비스로 설치합니다.

```bash
openclaw node install --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--tls`: Gateway 연결에 TLS 사용
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: 노드 ID 재정의(페어링 토큰 지움)
- `--display-name <name>`: 노드 표시 이름 재정의
- `--runtime <runtime>`: 서비스 런타임(`node` 또는 `bun`)
- `--force`: 이미 설치되어 있으면 재설치/덮어쓰기

서비스 관리:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

포그라운드 노드 호스트에는 `openclaw node run`을 사용하세요(서비스 없음).

서비스 명령은 기계가 읽을 수 있는 출력용 `--json`을 허용합니다.

노드 호스트는 Gateway 재시작 및 네트워크 종료를 프로세스 내부에서 재시도합니다. Gateway가 터미널 토큰/비밀번호/부트스트랩 인증 일시 중지를 보고하면, 노드 호스트는 종료 세부 정보를 로그에 남기고 0이 아닌 코드로 종료하여 launchd/systemd가 새 구성과 자격 증명으로 다시 시작할 수 있게 합니다. 페어링이 필요한 일시 중지는 보류 중인 요청을 승인할 수 있도록 포그라운드 흐름에 유지됩니다.

## 페어링

첫 연결은 Gateway에 보류 중인 기기 페어링 요청(`role: node`)을 생성합니다.
다음을 통해 승인하세요.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

엄격하게 통제되는 노드 네트워크에서는 Gateway 운영자가 신뢰할 수 있는 CIDR에서 들어오는 최초 노드 페어링을 자동 승인하도록 명시적으로 옵트인할 수 있습니다.

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

기본적으로 비활성화되어 있습니다. 요청된 범위가 없는 새로운 `role: node` 페어링에만 적용됩니다. 운영자/브라우저 클라이언트, Control UI, WebChat, 그리고 역할, 범위, 메타데이터 또는 공개 키 업그레이드는 여전히 수동 승인이 필요합니다.

노드가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 재시도하면 이전 보류 요청은 대체되고 새 `requestId`가 생성됩니다. 승인하기 전에 `openclaw devices list`를 다시 실행하세요.

노드 호스트는 노드 ID, 토큰, 표시 이름, Gateway 연결 정보를 `~/.openclaw/node.json`에 저장합니다.

## Exec 승인

`system.run`은 로컬 exec 승인으로 제어됩니다.

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, 또는 변수가 설정되지 않은 경우
  `~/.openclaw/exec-approvals.json`
- [Exec 승인](/ko/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`(Gateway에서 편집)

승인된 비동기 노드 exec의 경우 OpenClaw는 프롬프트 전에 정식 `systemRunPlan`을 준비합니다. 나중에 승인된 `system.run` 전달은 저장된 해당 계획을 재사용하므로, 승인 요청이 생성된 후 command/cwd/session 필드를 편집하면 노드가 실행할 내용을 변경하는 대신 거부됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [노드](/ko/nodes)
