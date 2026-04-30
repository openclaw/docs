---
read_when:
    - 로컬호스트 외부에 Gateway 제어 UI 노출하기
    - 테일넷 또는 공개 대시보드 액세스 자동화
summary: Gateway 대시보드용 통합 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T06:33:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw는 Gateway 대시보드와 WebSocket 포트에 대해 Tailscale **Serve**(tailnet) 또는 **Funnel**(공개)을 자동 구성할 수 있습니다. 이렇게 하면 Gateway는 loopback에 바인딩된 상태를 유지하고, Tailscale이 HTTPS, 라우팅 및 (Serve의 경우) ID 헤더를 제공합니다.

## 모드

- `serve`: `tailscale serve`를 통한 tailnet 전용 Serve입니다. gateway는 `127.0.0.1`에 유지됩니다.
- `funnel`: `tailscale funnel`을 통한 공개 HTTPS입니다. OpenClaw에는 공유 암호가 필요합니다.
- `off`: 기본값(Tailscale 자동화 없음)입니다.

상태 및 감사 출력은 이 OpenClaw Serve/Funnel 모드에 대해 **Tailscale 노출**을 사용합니다. `off`는 OpenClaw가 Serve 또는 Funnel을 관리하지 않는다는 뜻입니다. local Tailscale 데몬이 중지되었거나 로그아웃되었다는 뜻은 아닙니다.

## 인증

핸드셰이크를 제어하려면 `gateway.auth.mode`를 설정하세요.

- `none`(비공개 인그레스만)
- `token`(`OPENCLAW_GATEWAY_TOKEN`이 설정된 경우 기본값)
- `password`(`OPENCLAW_GATEWAY_PASSWORD` 또는 구성을 통한 공유 비밀)
- `trusted-proxy`(ID 인식 리버스 프록시; [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조)

`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale`이 `true`이면, Control UI/WebSocket 인증은 토큰/암호를 제공하지 않고도 Tailscale ID 헤더(`tailscale-user-login`)를 사용할 수 있습니다. OpenClaw는 요청을 수락하기 전에 local Tailscale 데몬(`tailscale whois`)을 통해 `x-forwarded-for` 주소를 확인하고 이를 헤더와 매칭하여 ID를 검증합니다. OpenClaw는 loopback에서 도착하고 Tailscale의 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host` 헤더가 있는 요청만 Serve로 취급합니다.
브라우저 장치 ID가 포함된 Control UI 운영자 세션의 경우, 이 검증된 Serve 경로는 장치 페어링 왕복도 건너뜁니다. 브라우저 장치 ID를 우회하지는 않습니다. 장치가 없는 클라이언트는 여전히 거부되며, node 역할 또는 Control UI가 아닌 WebSocket 연결은 계속 일반적인 페어링 및 인증 검사를 따릅니다.
HTTP API 엔드포인트(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는 Tailscale ID 헤더 인증을 사용하지 **않습니다**. 이 엔드포인트는 여전히 gateway의 일반 HTTP 인증 모드를 따릅니다. 기본적으로 공유 비밀 인증을 사용하거나, 의도적으로 구성된 trusted-proxy / 비공개 인그레스 `none` 설정을 사용합니다.
이 토큰 없는 흐름은 gateway 호스트가 신뢰된다고 가정합니다. 신뢰할 수 없는 local 코드가 같은 호스트에서 실행될 수 있다면 `gateway.auth.allowTailscale`을 비활성화하고 대신 토큰/암호 인증을 요구하세요.
명시적인 공유 비밀 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하고 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

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

열기: `https://<magicdns>/`(또는 구성된 `gateway.controlUi.basePath`)

### Tailnet 전용(Tailnet IP에 바인딩)

Gateway가 Tailnet IP에서 직접 수신하도록 하려는 경우(Serve/Funnel 없음) 사용하세요.

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

다른 Tailnet 장치에서 연결:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback(`http://127.0.0.1:18789`)은 이 모드에서 작동하지 **않습니다**.
</Note>

### 공개 인터넷(Funnel + 공유 암호)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

암호를 디스크에 커밋하는 것보다 `OPENCLAW_GATEWAY_PASSWORD` 사용을 권장합니다.

## CLI 예시

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 참고

- Tailscale Serve/Funnel을 사용하려면 `tailscale` CLI가 설치되어 있고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 공개 노출을 피하기 위해 인증 모드가 `password`가 아니면 시작을 거부합니다.
- OpenClaw가 종료 시 `tailscale serve` 또는 `tailscale funnel` 구성을 되돌리게 하려면 `gateway.tailscale.resetOnExit`를 설정하세요.
- `gateway.bind: "tailnet"`은 직접 Tailnet 바인딩입니다(HTTPS 없음, Serve/Funnel 없음).
- `gateway.bind: "auto"`는 loopback을 선호합니다. Tailnet 전용을 원하면 `tailnet`을 사용하세요.
- Serve/Funnel은 **Gateway 제어 UI + WS**만 노출합니다. 노드는 동일한 Gateway WS 엔드포인트를 통해 연결하므로, Serve는 노드 접근에도 작동할 수 있습니다.

## 브라우저 제어(원격 Gateway + local 브라우저)

Gateway를 한 머신에서 실행하지만 다른 머신의 브라우저를 제어하려면, 브라우저 머신에서 **node 호스트**를 실행하고 둘 다 같은 tailnet에 유지하세요. Gateway가 브라우저 작업을 node로 프록시합니다. 별도의 제어 서버나 Serve URL은 필요하지 않습니다.

브라우저 제어에는 Funnel을 피하세요. 노드 페어링을 운영자 접근처럼 취급하세요.

## Tailscale 필수 조건 + 제한

- Serve를 사용하려면 tailnet에 HTTPS가 활성화되어 있어야 합니다. 없으면 CLI가 안내합니다.
- Serve는 Tailscale ID 헤더를 삽입하지만, Funnel은 삽입하지 않습니다.
- Funnel에는 Tailscale v1.38.3 이상, MagicDNS, HTTPS 활성화, funnel 노드 속성이 필요합니다.
- Funnel은 TLS를 통한 포트 `443`, `8443`, `10000`만 지원합니다.
- macOS에서 Funnel을 사용하려면 오픈 소스 Tailscale 앱 변형이 필요합니다.

## 더 알아보기

- Tailscale Serve 개요: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 명령: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 개요: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 명령: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 관련 항목

- [원격 접근](/ko/gateway/remote)
- [검색](/ko/gateway/discovery)
- [인증](/ko/gateway/authentication)
