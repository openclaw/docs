---
read_when:
    - Tailscale을 통해 Gateway에 액세스하려고 합니다
    - browser Control UI와 구성 편집을 원합니다
summary: 'Gateway 웹 표면: Control UI, 바인드 모드 및 보안'
title: 웹
x-i18n:
    generated_at: "2026-04-23T14:10:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# 웹 (Gateway)

Gateway는 Gateway WebSocket과 같은 포트에서 작은 **browser Control UI**(Vite + Lit)를 제공합니다:

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

기능은 [Control UI](/ko/web/control-ui)에 있습니다.
이 페이지는 바인드 모드, 보안, 웹 표면에 중점을 둡니다.

## Webhook

`hooks.enabled=true`이면 Gateway는 같은 HTTP 서버에서 작은 Webhook 엔드포인트도 노출합니다.
인증 + payload는 [Gateway configuration](/ko/gateway/configuration) → `hooks`를 참조하세요.

## 구성(기본 활성화)

자산이 존재할 때(`dist/control-ui`) Control UI는 **기본적으로 활성화**됩니다.
구성으로 제어할 수 있습니다:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath는 선택 사항
  },
}
```

## Tailscale 액세스

### 통합 Serve(권장)

Gateway는 loopback에 유지하고 Tailscale Serve가 이를 프록시하게 하세요:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

그다음 gateway를 시작합니다:

```bash
openclaw gateway
```

열기:

- `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)

### tailnet 바인드 + 토큰

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

그다음 gateway를 시작합니다(이 loopback이 아닌 예시는 공유 비밀 토큰
인증을 사용합니다):

```bash
openclaw gateway
```

열기:

- `http://<tailscale-ip>:18789/`(또는 구성한 `gateway.controlUi.basePath`)

### 공용 인터넷(Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // 또는 OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 보안 참고

- Gateway 인증은 기본적으로 필요합니다(토큰, 비밀번호, trusted-proxy, 또는 활성화된 경우 Tailscale Serve 식별자 헤더).
- loopback이 아닌 바인드도 여전히 **gateway 인증이 필요합니다**. 실제로는 token/password 인증 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 ID 인식 리버스 프록시를 의미합니다.
- 마법사는 기본적으로 공유 비밀 인증을 생성하며, 보통
  gateway 토큰도 생성합니다(loopback에서도 마찬가지).
- 공유 비밀 모드에서는 UI가 `connect.params.auth.token` 또는
  `connect.params.auth.password`를 보냅니다.
- Tailscale Serve 또는 `trusted-proxy` 같은 식별자 포함 모드에서는
  대신 WebSocket 인증 검사가 요청 헤더로 충족됩니다.
- loopback이 아닌 Control UI 배포에서는 `gateway.controlUi.allowedOrigins`를
  명시적으로 설정하세요(전체 origin). 이것이 없으면 기본적으로 gateway 시작이 거부됩니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는
  Host 헤더 origin 대체 모드를 활성화하지만, 위험한 보안 저하입니다.
- Serve를 사용할 때 `gateway.auth.allowTailscale`이 `true`이면 Tailscale 식별자 헤더가
  Control UI/WebSocket 인증을 충족할 수 있습니다(토큰/비밀번호 불필요).
  HTTP API 엔드포인트는 այդ Tailscale 식별자 헤더를 사용하지 않으며,
  대신 gateway의 일반 HTTP 인증 모드를 따릅니다. 명시적 자격 증명을 요구하려면
  `gateway.auth.allowTailscale: false`로 설정하세요. 자세한 내용은
  [Tailscale](/ko/gateway/tailscale) 및 [Security](/ko/gateway/security)를 참조하세요. 이
  토큰 없는 흐름은 gateway 호스트가 신뢰된다고 가정합니다.
- `gateway.tailscale.mode: "funnel"`은 `gateway.auth.mode: "password"`(공유 비밀번호)를 요구합니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요:

```bash
pnpm ui:build
```
