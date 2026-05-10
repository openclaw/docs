---
read_when:
    - localhost 외부에 Gateway 제어 UI 노출하기
    - 테일넷 또는 공개 대시보드 접근 자동화
summary: Gateway 대시보드에 통합된 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:37:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw는 Gateway 대시보드와 WebSocket 포트에 대해 Tailscale **Serve**(tailnet) 또는 **Funnel**(공개)을 자동 구성할 수 있습니다. 이렇게 하면 Gateway는 loopback에 바인딩된 상태로 유지되고, Tailscale이 HTTPS, 라우팅, 그리고 Serve의 경우 ID 헤더를 제공합니다.

## 모드

- `serve`: `tailscale serve`를 통한 tailnet 전용 Serve입니다. gateway는 `127.0.0.1`에 유지됩니다.
- `funnel`: `tailscale funnel`을 통한 공개 HTTPS입니다. OpenClaw에는 공유 비밀번호가 필요합니다.
- `off`: 기본값입니다(Tailscale 자동화 없음).

상태 및 감사 출력은 이 OpenClaw Serve/Funnel 모드에 대해 **Tailscale 노출**을 사용합니다. `off`는 OpenClaw가 Serve 또는 Funnel을 관리하지 않는다는 의미이며, 로컬 Tailscale 데몬이 중지되었거나 로그아웃되었다는 의미는 아닙니다.

## 인증

핸드셰이크를 제어하려면 `gateway.auth.mode`를 설정하세요.

- `none`(비공개 ingress 전용)
- `token`(`OPENCLAW_GATEWAY_TOKEN`이 설정된 경우 기본값)
- `password`(`OPENCLAW_GATEWAY_PASSWORD` 또는 config를 통한 공유 비밀)
- `trusted-proxy`(ID 인식 reverse proxy; [신뢰할 수 있는 Proxy 인증](/ko/gateway/trusted-proxy-auth) 참조)

`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale`이 `true`인 경우,
Control UI/WebSocket 인증은 토큰/비밀번호를 제공하지 않고 Tailscale ID 헤더
(`tailscale-user-login`)를 사용할 수 있습니다. OpenClaw는 로컬 Tailscale
데몬(`tailscale whois`)을 통해 `x-forwarded-for` 주소를 확인하고, 이를 헤더와
대조한 뒤 ID를 검증하고 수락합니다. OpenClaw는 요청이 loopback에서 도착하고
Tailscale의 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host`
헤더를 포함할 때만 요청을 Serve로 처리합니다.
브라우저 기기 ID가 포함된 Control UI operator 세션의 경우, 이 검증된 Serve 경로는
기기 페어링 왕복도 건너뜁니다. 브라우저 기기 ID를 우회하지는 않습니다. 기기 없는
client는 계속 거부되며, 노드 역할 또는 Control UI가 아닌 WebSocket 연결은 여전히
일반 페어링 및 인증 검사를 따릅니다.
HTTP API endpoint(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는
Tailscale ID 헤더 인증을 사용하지 **않습니다**. 이들은 여전히 gateway의 일반
HTTP 인증 모드를 따릅니다. 기본적으로 공유 비밀 인증을 사용하거나, 의도적으로
구성된 trusted-proxy / 비공개 ingress `none` 설정을 사용합니다.
이 토큰 없는 흐름은 gateway host를 신뢰할 수 있다고 가정합니다. 신뢰할 수 없는
로컬 코드가 같은 host에서 실행될 수 있다면 `gateway.auth.allowTailscale`을
비활성화하고 대신 토큰/비밀번호 인증을 요구하세요.
명시적인 공유 비밀 credentials를 요구하려면 `gateway.auth.allowTailscale: false`를
설정하고 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

## Config 예시

### Tailnet 전용(Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

열기: `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)

### Tailnet 전용(Tailnet IP에 바인딩)

Gateway가 Tailnet IP에서 직접 수신하도록 하려는 경우 사용하세요(Serve/Funnel 없음).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

다른 Tailnet 기기에서 연결:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback(`http://127.0.0.1:18789`)은 이 모드에서 작동하지 **않습니다**.
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

## 참고 사항

- Tailscale Serve/Funnel을 사용하려면 `tailscale` CLI가 설치되어 있고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 공개 노출을 피하기 위해 인증 모드가 `password`가 아니면 시작을 거부합니다.
- 종료 시 OpenClaw가 `tailscale serve` 또는 `tailscale funnel` 구성을 되돌리도록 하려면 `gateway.tailscale.resetOnExit`를 설정하세요.
- 외부에서 구성한 `tailscale funnel` route를 gateway 재시작 후에도 유지하려면 `gateway.tailscale.preserveFunnel: true`를 설정하세요. 활성화되어 있고 gateway가 `mode: "serve"`로 실행되는 경우, OpenClaw는 Serve를 다시 적용하기 전에 `tailscale funnel status`를 확인하고 Funnel route가 이미 gateway 포트를 포함하면 건너뜁니다. OpenClaw가 관리하는 Funnel 비밀번호 전용 정책은 변경되지 않습니다.
- `gateway.bind: "tailnet"`은 직접 Tailnet 바인딩입니다(HTTPS 없음, Serve/Funnel 없음).
- `gateway.bind: "auto"`는 loopback을 우선합니다. Tailnet 전용을 원하면 `tailnet`을 사용하세요.
- Serve/Funnel은 **Gateway control UI + WS**만 노출합니다. 노드는 같은 Gateway WS endpoint를 통해 연결하므로 Serve는 노드 접근에도 사용할 수 있습니다.

## 브라우저 제어(원격 Gateway + 로컬 브라우저)

Gateway를 한 머신에서 실행하지만 다른 머신의 브라우저를 구동하려는 경우,
브라우저 머신에서 **node host**를 실행하고 둘 다 같은 tailnet에 유지하세요.
Gateway는 브라우저 작업을 노드로 proxy합니다. 별도의 제어 서버나 Serve URL은 필요하지 않습니다.

브라우저 제어에는 Funnel을 피하세요. 노드 페어링을 operator 접근처럼 취급하세요.

## Tailscale 전제 조건 + 제한

- Serve를 사용하려면 tailnet에 HTTPS가 활성화되어 있어야 합니다. 누락된 경우 CLI가 프롬프트를 표시합니다.
- Serve는 Tailscale ID 헤더를 주입하지만, Funnel은 그렇지 않습니다.
- Funnel에는 Tailscale v1.38.3 이상, MagicDNS, HTTPS 활성화, funnel node attribute가 필요합니다.
- Funnel은 TLS를 통해 `443`, `8443`, `10000` 포트만 지원합니다.
- macOS의 Funnel에는 오픈 소스 Tailscale 앱 변형이 필요합니다.

## 더 알아보기

- Tailscale Serve 개요: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 명령: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 개요: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 명령: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 관련 항목

- [원격 접근](/ko/gateway/remote)
- [검색](/ko/gateway/discovery)
- [인증](/ko/gateway/authentication)
