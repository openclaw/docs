---
read_when:
    - Gateway 제어 UI를 localhost 외부에 노출하기
    - tailnet 또는 공개 대시보드 접근 자동화
summary: Gateway 대시보드용 통합 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:32:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw는 Gateway 대시보드와 WebSocket 포트에 대해 Tailscale **Serve**(tailnet) 또는 **Funnel**(공개)을 자동 구성할 수 있습니다. 이렇게 하면 Gateway는 loopback에 바인딩된 상태를 유지하면서 Tailscale이 HTTPS, 라우팅, 그리고 (Serve의 경우) ID 헤더를 제공합니다.

## 모드

- `serve`: `tailscale serve`를 통한 tailnet 전용 Serve입니다. Gateway는 `127.0.0.1`에 유지됩니다.
- `funnel`: `tailscale funnel`을 통한 공개 HTTPS입니다. OpenClaw는 공유 비밀번호를 요구합니다.
- `off`: 기본값입니다(Tailscale 자동화 없음).

상태 및 감사 출력은 이 OpenClaw Serve/Funnel 모드에 대해 **Tailscale 노출**을 사용합니다. `off`는 OpenClaw가 Serve 또는 Funnel을 관리하지 않는다는 뜻이며, local Tailscale 데몬이 중지되었거나 로그아웃되었다는 뜻은 아닙니다.

## 인증

핸드셰이크를 제어하려면 `gateway.auth.mode`를 설정하세요.

- `none`(비공개 인그레스 전용)
- `token`(`OPENCLAW_GATEWAY_TOKEN`이 설정된 경우 기본값)
- `password`(`OPENCLAW_GATEWAY_PASSWORD` 또는 설정을 통한 공유 비밀)
- `trusted-proxy`(ID 인식 리버스 프록시; [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조)

`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale`이 `true`이면 Control UI/WebSocket 인증은 토큰/비밀번호를 제공하지 않고 Tailscale ID 헤더(`tailscale-user-login`)를 사용할 수 있습니다. OpenClaw는 local Tailscale 데몬(`tailscale whois`)을 통해 `x-forwarded-for` 주소를 확인하고, 이를 헤더와 일치시킨 뒤 ID를 검증합니다. OpenClaw는 요청이 loopback에서 들어오고 Tailscale의 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host` 헤더가 있을 때만 해당 요청을 Serve로 취급합니다.
브라우저 장치 ID를 포함하는 Control UI 운영자 세션의 경우, 이 검증된 Serve 경로는 장치 페어링 왕복도 건너뜁니다. 브라우저 장치 ID를 우회하지는 않습니다. 장치가 없는 클라이언트는 여전히 거부되며, 노드 역할 또는 Control UI가 아닌 WebSocket 연결은 계속 일반 페어링 및 인증 검사를 따릅니다.
HTTP API 엔드포인트(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는 Tailscale ID 헤더 인증을 사용하지 **않습니다**. 이들은 계속 Gateway의 일반 HTTP 인증 모드를 따릅니다. 기본적으로 공유 비밀 인증을 사용하거나, 의도적으로 구성한 trusted-proxy / 비공개 인그레스 `none` 설정을 사용합니다.
이 토큰 없는 흐름은 Gateway 호스트를 신뢰할 수 있다고 가정합니다. 신뢰할 수 없는 local 코드가 같은 호스트에서 실행될 수 있다면 `gateway.auth.allowTailscale`을 비활성화하고 대신 토큰/비밀번호 인증을 요구하세요.
명시적인 공유 비밀 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하고 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

## 설정 예시

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

장치 호스트 이름 대신 이름이 지정된 Tailscale Service를 통해 Control UI를 노출하려면 `gateway.tailscale.serviceName`을 Service 이름으로 설정하세요.

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

위 예시를 사용하면 시작 시 Service URL이 장치 호스트 이름 대신 `https://openclaw.<tailnet-name>.ts.net/`로 보고됩니다. Tailscale Services를 사용하려면 호스트가 tailnet에서 승인된 태그 지정 노드여야 합니다. 이 옵션을 활성화하기 전에 Tailscale에서 태그를 구성하고 Service를 승인하세요. 그렇지 않으면 Gateway 시작 중 `tailscale serve --service=...`가 실패합니다.

### Tailnet 전용(Tailnet IP에 바인딩)

Gateway가 Tailnet IP에서 직접 수신 대기하도록 하려면 이 모드를 사용하세요(Serve/Funnel 없음).

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

비밀번호를 디스크에 커밋하는 것보다 `OPENCLAW_GATEWAY_PASSWORD`를 사용하는 것을 권장합니다.

## CLI 예시

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 참고

- Tailscale Serve/Funnel을 사용하려면 `tailscale` CLI가 설치되어 있고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 공개 노출을 피하기 위해 인증 모드가 `password`가 아니면 시작을 거부합니다.
- `gateway.tailscale.serviceName`은 Serve 모드에만 적용되며 `tailscale serve --service=<name>`에 전달됩니다. 값은 Tailscale의 `svc:<dns-label>` Service 이름 형식을 사용해야 합니다. 예: `svc:openclaw`.
  Tailscale은 Service 호스트가 태그 지정 노드일 것을 요구하며, Serve가 이를 게시하기 전에 관리자 콘솔에서 Service 승인이 필요할 수 있습니다.
- 종료 시 OpenClaw가 `tailscale serve` 또는 `tailscale funnel` 구성을 되돌리게 하려면 `gateway.tailscale.resetOnExit`를 설정하세요.
- 외부에서 구성한 `tailscale funnel` 경로를 Gateway 재시작 사이에도 유지하려면 `gateway.tailscale.preserveFunnel: true`를 설정하세요. 활성화되어 있고 Gateway가 `mode: "serve"`로 실행되는 경우, OpenClaw는 Serve를 다시 적용하기 전에 `tailscale funnel status`를 확인하고 Funnel 경로가 이미 Gateway 포트를 포함하면 이를 건너뜁니다. OpenClaw가 관리하는 Funnel의 비밀번호 전용 정책은 변경되지 않습니다.
- `gateway.bind: "tailnet"`은 직접 Tailnet 바인딩입니다(HTTPS 없음, Serve/Funnel 없음).
- `gateway.bind: "auto"`는 loopback을 우선합니다. Tailnet 전용을 원하면 `tailnet`을 사용하세요.
- Serve/Funnel은 **Gateway 제어 UI + WS**만 노출합니다. 노드는 동일한 Gateway WS 엔드포인트를 통해 연결하므로, Serve는 노드 접근에도 사용할 수 있습니다.

## 브라우저 제어(원격 Gateway + local 브라우저)

한 머신에서 Gateway를 실행하지만 다른 머신의 브라우저를 구동하려면, 브라우저 머신에서 **노드 호스트**를 실행하고 둘 다 같은 tailnet에 두세요. Gateway가 브라우저 작업을 노드로 프록시합니다. 별도의 제어 서버나 Serve URL은 필요하지 않습니다.

브라우저 제어에는 Funnel을 피하세요. 노드 페어링을 운영자 접근처럼 취급하세요.

## Tailscale 사전 요구 사항 + 제한

- Serve를 사용하려면 tailnet에 HTTPS가 활성화되어 있어야 합니다. 누락된 경우 CLI가 프롬프트를 표시합니다.
- Serve는 Tailscale ID 헤더를 삽입합니다. Funnel은 그렇지 않습니다.
- Funnel에는 Tailscale v1.38.3 이상, MagicDNS, HTTPS 활성화, funnel 노드 속성이 필요합니다.
- Funnel은 TLS를 통해 포트 `443`, `8443`, `10000`만 지원합니다.
- macOS에서 Funnel을 사용하려면 오픈 소스 Tailscale 앱 변형이 필요합니다.

## 자세히 알아보기

- Tailscale Serve 개요: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 명령: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 개요: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 명령: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 관련 항목

- [원격 접근](/ko/gateway/remote)
- [Discovery](/ko/gateway/discovery)
- [인증](/ko/gateway/authentication)
