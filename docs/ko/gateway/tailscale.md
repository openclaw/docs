---
read_when:
    - localhost 외부에 Gateway 제어 UI 노출하기
    - tailnet 또는 공개 대시보드 액세스 자동화
summary: Gateway 대시보드에 통합된 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T15:19:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw은 Gateway 대시보드와 WebSocket 포트에 Tailscale **Serve**(tailnet) 또는 **Funnel**(공개)을 자동 구성할 수 있습니다. 따라서 Gateway는 루프백에 바인딩된 상태로 유지되며, Tailscale이 HTTPS, 라우팅 및 (Serve의 경우) ID 헤더를 제공합니다.

## 모드

`gateway.tailscale.mode`:

| 모드            | 동작                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | `tailscale serve`를 통한 tailnet 전용 Serve입니다. Gateway는 `127.0.0.1`에서 유지됩니다. |
| `funnel`        | `tailscale funnel`을 통한 공개 HTTPS입니다. 공유 비밀번호가 필요합니다.            |
| `off` (기본값) | Tailscale 자동화를 사용하지 않습니다.                                                    |

상태 및 감사 출력에서는 이 OpenClaw Serve/Funnel 모드를 **Tailscale 노출**이라고 표시합니다. `off`는 OpenClaw이 Serve 또는 Funnel을 관리하지 않는다는 의미이며, 로컬 Tailscale 데몬이 중지되었거나 로그아웃되었다는 의미는 아닙니다.

## 구성 예시

### Tailnet 전용(Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

다음을 여십시오: `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)

기기 호스트 이름 대신 이름이 지정된 Tailscale Service를 통해 Control UI를 노출하려면 `gateway.tailscale.serviceName`을 Service 이름으로 설정하십시오.

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

그러면 시작 시 기기 호스트 이름 대신 Service URL이 `https://openclaw.<tailnet-name>.ts.net/`으로 보고됩니다. Tailscale Services를 사용하려면 호스트가 tailnet에서 승인된 태그 지정 Node여야 합니다. 이를 활성화하기 전에 Tailscale에서 태그를 구성하고 Service를 승인하십시오. 그렇지 않으면 Gateway 시작 중 `tailscale serve --service=...`가 실패합니다.

### Tailnet 전용(Tailnet IP에 바인딩)

Serve/Funnel 없이 Gateway가 Tailnet IP에서 직접 수신하도록 하려면 다음 구성을 사용하십시오.

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

다른 Tailnet 기기에서 연결합니다.

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
바인딩 가능한 Tailnet IPv4가 있으면 Gateway는 인증된 동일 호스트 클라이언트를 위해 `http://127.0.0.1:18789`도 필요로 합니다. 시작 시 사용할 수 있는 Tailnet 주소가 없으면 루프백 전용으로 대체됩니다. 직접 Tailnet 액세스를 추가하려면 Tailscale을 사용할 수 있게 된 후 다시 시작하십시오. 어느 경로도 LAN 또는 공개 노출을 추가하지 않습니다.
</Note>

### 공개 인터넷(Funnel + 공유 비밀번호)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

비밀번호를 디스크에 커밋하는 대신 `OPENCLAW_GATEWAY_PASSWORD`를 사용하는 것이 좋습니다.

## CLI 예시

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 인증

`gateway.auth.mode`는 핸드셰이크를 제어합니다.

| 모드                                                   | 사용 사례                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | 비공개 인그레스 전용                                                                |
| `token` (`OPENCLAW_GATEWAY_TOKEN`이 설정된 경우 기본값) | 공유 토큰                                                                        |
| `password`                                             | `OPENCLAW_GATEWAY_PASSWORD` 또는 구성을 통한 공유 비밀 값                             |
| `trusted-proxy`                                        | ID 인식 역방향 프록시입니다. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하십시오. |

### Tailscale ID 헤더(Serve 전용)

`tailscale.mode: "serve"`이고 `gateway.auth.allowTailscale`이 `true`이면 Control UI/WebSocket 인증에서 토큰/비밀번호 대신 Tailscale ID 헤더(`tailscale-user-login`)를 사용할 수 있습니다. OpenClaw은 요청을 수락하기 전에 로컬 Tailscale 데몬을 통해 요청의 `x-forwarded-for` 주소를 확인하고(`tailscale whois`) 헤더의 로그인과 일치하는지 검사하여 헤더를 검증합니다. 요청이 루프백에서 도착하고 Tailscale의 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host` 헤더를 포함한 경우에만 이 경로를 사용할 수 있습니다.

이 토큰 없는 흐름은 Gateway 호스트를 신뢰한다고 가정합니다. 신뢰할 수 없는 로컬 코드가 동일한 호스트에서 실행될 수 있다면 `gateway.auth.allowTailscale: false`를 설정하고 대신 토큰/비밀번호 인증을 요구하십시오.

우회 범위는 다음과 같습니다.

- Control UI WebSocket 인증 표면에만 적용됩니다. HTTP API 엔드포인트(`/v1/*`, `/tools/invoke`, `/api/channels/*` 등)는 Tailscale ID 헤더 인증을 사용하지 않으며, 항상 Gateway의 일반 HTTP 인증 모드를 따릅니다.
- 브라우저 기기 ID를 이미 포함하는 Control UI 운영자 세션의 경우, 검증된 Tailscale ID를 사용하면 부트스트랩 토큰/QR 페어링 왕복 과정을 건너뜁니다.
- 기기 ID 자체는 우회하지 않습니다. 기기 정보가 없는 클라이언트는 여전히 거부되며, Node 역할 연결은 계속해서 일반적인 페어링 및 인증 검사를 거칩니다.

## 참고

- Tailscale Serve/Funnel을 사용하려면 `tailscale` CLI가 설치되어 있고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 공개 노출을 방지하기 위해 인증 모드가 `password`가 아니면 시작을 거부합니다.
- `gateway.tailscale.serviceName`은 Serve 모드에만 적용되며 `tailscale serve --service=<name>`에 전달됩니다. 값은 `svc:openclaw`과 같은 Tailscale의 `svc:<dns-label>` 형식을 사용해야 합니다. Tailscale에서는 Service 호스트가 태그 지정 Node여야 하며, Serve에서 게시하기 전에 관리자 콘솔에서 Service를 승인해야 할 수 있습니다.
- `gateway.tailscale.resetOnExit`는 종료 시 `tailscale serve`/`tailscale funnel` 구성을 실행 취소합니다.
- `gateway.tailscale.preserveFunnel: true`는 외부에서 구성한 `tailscale funnel` 경로를 Gateway가 다시 시작되어도 유지합니다. `mode: "serve"`인 경우 OpenClaw은 Serve를 다시 적용하기 전에 `tailscale funnel status`를 확인하고, Funnel 경로가 이미 Gateway 포트를 포함하면 적용을 건너뜁니다. OpenClaw이 관리하는 Funnel의 비밀번호 전용 정책은 변경되지 않습니다.
- `gateway.bind: "tailnet"`은 Tailnet IPv4를 사용할 수 있는 경우 직접 Tailnet 바인딩(HTTPS 및 Serve/Funnel 없음)과 필수 로컬 `127.0.0.1`을 함께 사용하며, 그렇지 않으면 루프백 전용으로 대체됩니다.
- `gateway.bind: "auto"`는 루프백을 우선합니다. 동일 호스트의 루프백 액세스를 유지하면서 네트워크 노출을 Tailnet으로 제한하려면 `tailnet`을 사용하십시오.
- Serve/Funnel은 **Gateway Control UI + WS**만 노출합니다. Node는 동일한 Gateway WS 엔드포인트를 통해 연결되므로 Serve는 Node 액세스에도 사용할 수 있습니다.

### Tailscale 사전 요구 사항 및 제한

- Serve를 사용하려면 tailnet에 HTTPS가 활성화되어 있어야 합니다. 활성화되어 있지 않으면 CLI에서 활성화를 요청합니다.
- Serve는 Tailscale ID 헤더를 삽입하지만 Funnel은 삽입하지 않습니다.
- Funnel을 사용하려면 Tailscale v1.38.3 이상, MagicDNS, 활성화된 HTTPS 및 Funnel Node 특성이 필요합니다.
- Funnel은 TLS를 통한 포트 `443`, `8443`, `10000`만 지원합니다.
- macOS의 Funnel에는 오픈 소스 Tailscale 앱 변형이 필요합니다.

## 브라우저 제어(원격 Gateway + 로컬 브라우저)

한 시스템에서 Gateway를 실행하면서 다른 시스템의 브라우저를 제어하려면 브라우저 시스템에서 **Node 호스트**를 실행하고 두 시스템을 동일한 tailnet에 유지하십시오. Gateway가 브라우저 작업을 Node로 프록시하므로 별도의 제어 서버나 Serve URL은 필요하지 않습니다.

브라우저 제어에 Funnel을 사용하지 마십시오. Node 페어링을 운영자 액세스와 동일하게 취급하십시오.

## 자세히 알아보기

- Tailscale Serve 개요: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 명령: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 개요: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 명령: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 관련 항목

- [원격 액세스](/ko/gateway/remote)
- [검색](/ko/gateway/discovery)
- [인증](/ko/gateway/authentication)
