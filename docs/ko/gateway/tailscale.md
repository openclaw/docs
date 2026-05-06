---
read_when:
    - Gateway 제어 UI를 localhost 외부에 노출하기
    - 테일넷 또는 공개 대시보드 액세스 자동화
summary: Gateway 대시보드용 통합 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw은 Gateway 대시보드와 WebSocket 포트에 대해 Tailscale **Serve**(테일넷) 또는 **Funnel**(공개)을 자동 구성할 수 있습니다. 이렇게 하면 Gateway는 루프백에 바인딩된 상태로 유지되고, Tailscale이 HTTPS, 라우팅, 그리고 Serve의 경우 ID 헤더를 제공합니다.

## 모드

- `serve`: `tailscale serve`를 통한 테일넷 전용 Serve입니다. Gateway는 `127.0.0.1`에 유지됩니다.
- `funnel`: `tailscale funnel`을 통한 공개 HTTPS입니다. OpenClaw에는 공유 암호가 필요합니다.
- `off`: 기본값입니다(Tailscale 자동화 없음).

상태 및 감사 출력은 이 OpenClaw Serve/Funnel 모드에 대해 **Tailscale 노출**을 사용합니다. `off`는 OpenClaw이 Serve 또는 Funnel을 관리하지 않는다는 뜻입니다. 로컬 Tailscale 데몬이 중지되었거나 로그아웃되었다는 뜻은 아닙니다.

## 인증

핸드셰이크를 제어하려면 `gateway.auth.mode`를 설정하세요.

- `none`(비공개 인그레스 전용)
- `token`(`OPENCLAW_GATEWAY_TOKEN`이 설정된 경우 기본값)
- `password`(`OPENCLAW_GATEWAY_PASSWORD` 또는 구성을 통한 공유 비밀)
- `trusted-proxy`(ID 인식 리버스 프록시. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조)

`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale`이 `true`이면, Control UI/WebSocket 인증은 토큰/암호를 제공하지 않고도 Tailscale ID 헤더(`tailscale-user-login`)를 사용할 수 있습니다. OpenClaw은 로컬 Tailscale 데몬(`tailscale whois`)을 통해 `x-forwarded-for` 주소를 확인하고, 이를 헤더와 대조한 뒤에만 ID를 검증하고 수락합니다. OpenClaw은 요청이 루프백에서 도착하고 Tailscale의 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host` 헤더가 포함된 경우에만 해당 요청을 Serve로 처리합니다.
브라우저 장치 ID가 포함된 Control UI 운영자 세션의 경우, 이렇게 검증된 Serve 경로는 장치 페어링 왕복 과정도 건너뜁니다. 하지만 브라우저 장치 ID를 우회하지는 않습니다. 장치가 없는 클라이언트는 여전히 거부되며, 노드 역할 또는 Control UI가 아닌 WebSocket 연결은 계속 일반적인 페어링 및 인증 검사를 따릅니다.
HTTP API 엔드포인트(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는 Tailscale ID 헤더 인증을 사용하지 **않습니다**. 이들은 여전히 Gateway의 일반 HTTP 인증 모드를 따릅니다. 기본적으로 공유 비밀 인증을 사용하거나, 의도적으로 구성된 trusted-proxy / 비공개 인그레스 `none` 설정을 사용합니다.
이 토큰 없는 흐름은 Gateway 호스트를 신뢰한다고 가정합니다. 신뢰할 수 없는 로컬 코드가 같은 호스트에서 실행될 수 있다면 `gateway.auth.allowTailscale`을 비활성화하고 대신 토큰/암호 인증을 요구하세요.
명시적인 공유 비밀 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하고 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

## 구성 예시

### 테일넷 전용(Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

열기: `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)

### 테일넷 전용(테일넷 IP에 바인딩)

Gateway가 테일넷 IP에서 직접 수신하게 하려는 경우 사용하세요(Serve/Funnel 없음).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

다른 테일넷 장치에서 연결:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
이 모드에서는 루프백(`http://127.0.0.1:18789`)이 작동하지 **않습니다**.
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

암호를 디스크에 커밋하는 대신 `OPENCLAW_GATEWAY_PASSWORD`를 선호하세요.

## CLI 예시

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 참고

- Tailscale Serve/Funnel을 사용하려면 `tailscale` CLI가 설치되어 있고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 공개 노출을 피하기 위해 인증 모드가 `password`가 아니면 시작을 거부합니다.
- 종료 시 OpenClaw이 `tailscale serve` 또는 `tailscale funnel` 구성을 되돌리게 하려면 `gateway.tailscale.resetOnExit`를 설정하세요.
- `gateway.bind: "tailnet"`은 직접 테일넷 바인딩입니다(HTTPS 없음, Serve/Funnel 없음).
- `gateway.bind: "auto"`는 루프백을 선호합니다. 테일넷 전용을 원하면 `tailnet`을 사용하세요.
- Serve/Funnel은 **Gateway 제어 UI + WS**만 노출합니다. 노드는 같은 Gateway WS 엔드포인트를 통해 연결되므로, Serve는 노드 접근에도 사용할 수 있습니다.

## 브라우저 제어(원격 Gateway + 로컬 브라우저)

Gateway를 한 컴퓨터에서 실행하지만 다른 컴퓨터의 브라우저를 제어하려면 브라우저 컴퓨터에서 **노드 호스트**를 실행하고 둘 다 같은 테일넷에 두세요.
Gateway가 브라우저 동작을 노드로 프록시합니다. 별도의 제어 서버나 Serve URL은 필요하지 않습니다.

브라우저 제어에는 Funnel을 피하세요. 노드 페어링을 운영자 접근처럼 취급하세요.

## Tailscale 사전 요구 사항 및 제한

- Serve에는 테일넷에서 HTTPS가 활성화되어 있어야 합니다. 누락된 경우 CLI가 안내합니다.
- Serve는 Tailscale ID 헤더를 삽입합니다. Funnel은 그렇지 않습니다.
- Funnel에는 Tailscale v1.38.3 이상, MagicDNS, 활성화된 HTTPS, 그리고 Funnel 노드 속성이 필요합니다.
- Funnel은 TLS를 통해 포트 `443`, `8443`, `10000`만 지원합니다.
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
