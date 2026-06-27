---
read_when:
    - Tailscale을 통해 Gateway에 접근하려는 경우
    - 브라우저 Control UI와 구성 편집을 원합니다
summary: 'Gateway 웹 표면: Control UI, 바인드 모드 및 보안'
title: 웹
x-i18n:
    generated_at: "2026-06-27T18:18:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway는 Gateway WebSocket과 같은 포트에서 작은 **브라우저 제어 UI**(Vite + Lit)를 제공합니다:

- 기본값: `http://<host>:18789/`
- `gateway.tls.enabled: true` 사용 시: `https://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

기능은 [제어 UI](/ko/web/control-ui)에 있습니다. 이 페이지의 나머지 부분은 바인드 모드, 보안, 웹 노출 표면에 중점을 둡니다.

## Webhook

`hooks.enabled=true`이면 Gateway는 같은 HTTP 서버에 작은 Webhook 엔드포인트도 노출합니다.
인증 + 페이로드는 [Gateway 구성](/ko/gateway/configuration) → `hooks`를 참조하세요.

## 관리자 HTTP RPC

관리자 HTTP RPC는 선택된 Gateway 제어 플레인 메서드를 `POST /api/v1/admin/rpc`에서 노출합니다.
기본적으로 꺼져 있으며 `admin-http-rpc` Plugin이 활성화된 경우에만 등록됩니다.
인증 모델, 허용된 메서드, WebSocket 비교는 [관리자 HTTP RPC](/ko/plugins/admin-http-rpc)를 참조하세요.

## 구성(기본 활성화)

제어 UI는 에셋이 있을 때(`dist/control-ui`) **기본적으로 활성화**됩니다.
구성으로 제어할 수 있습니다:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale 접근

### 통합 Serve(권장)

Gateway를 루프백에 유지하고 Tailscale Serve가 프록시하도록 합니다:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

그런 다음 Gateway를 시작합니다:

```bash
openclaw gateway
```

열기:

- `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)

### Tailnet 바인드 + 토큰

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

그런 다음 Gateway를 시작합니다(이 비루프백 예시는 공유 비밀 토큰 인증을 사용합니다):

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
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 보안 참고 사항

- Gateway 인증은 기본적으로 필요합니다(토큰, 비밀번호, 신뢰할 수 있는 프록시 또는 활성화된 경우 Tailscale Serve ID 헤더).
- 비루프백 바인드에도 Gateway 인증이 **필요**합니다. 실제로는 토큰/비밀번호 인증 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 ID 인식 리버스 프록시를 의미합니다.
- 마법사는 기본적으로 공유 비밀 인증을 만들며, 보통 Gateway 토큰을 생성합니다(루프백에서도).
- 공유 비밀 모드에서 UI는 `connect.params.auth.token` 또는 `connect.params.auth.password`를 보냅니다.
- `gateway.tls.enabled: true`이면 로컬 대시보드 및 상태 헬퍼는 `https://` 대시보드 URL과 `wss://` WebSocket URL을 렌더링합니다.
- Tailscale Serve 또는 `trusted-proxy` 같은 ID 포함 모드에서는 대신 요청 헤더로 WebSocket 인증 검사가 충족됩니다.
- 공용 비루프백 제어 UI 배포의 경우 `gateway.controlUi.allowedOrigins`를 명시적으로 설정하세요(전체 origin). 비공개 same-origin LAN/Tailnet 로드는 루프백, RFC1918/link-local, `.local`, `.ts.net`, Tailscale CGNAT 호스트에 대해 허용됩니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 origin 폴백 모드를 활성화하지만, 이는 위험한 보안 다운그레이드입니다.
- Serve를 사용하면 `gateway.auth.allowTailscale`이 `true`일 때 Tailscale ID 헤더가 제어 UI/WebSocket 인증을 충족할 수 있습니다(토큰/비밀번호 불필요). HTTP API 엔드포인트는 이러한 Tailscale ID 헤더를 사용하지 않으며, 대신 Gateway의 일반 HTTP 인증 모드를 따릅니다. 명시적 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. [Tailscale](/ko/gateway/tailscale) 및 [보안](/ko/gateway/security)을 참조하세요. 이 토큰 없는 흐름은 Gateway 호스트를 신뢰한다고 가정합니다.
- `gateway.tailscale.mode: "funnel"`에는 `gateway.auth.mode: "password"`가 필요합니다(공유 비밀번호).

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요:

```bash
pnpm ui:build
```
