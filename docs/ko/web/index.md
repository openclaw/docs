---
read_when:
    - Tailscale을 통해 Gateway에 액세스하려고 합니다
    - 브라우저 Control UI 및 구성 편집을 사용하려는 경우
summary: 'Gateway 웹 화면: Control UI, 바인드 모드 및 보안'
title: 웹
x-i18n:
    generated_at: "2026-07-12T15:51:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway는 Gateway WebSocket과 동일한 포트에서 소형 **브라우저 제어 UI**(Vite + Lit)를 제공합니다.

- 기본값: `http://<host>:18789/`
- `gateway.tls.enabled: true`인 경우: `https://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath`를 설정합니다(예: `/openclaw`).

기능은 [제어 UI](/ko/web/control-ui)에 설명되어 있습니다. 이 페이지에서는 바인드 모드, 보안 및 기타 웹 대상 표면을 다룹니다.

## 구성(기본 활성화)

자산이 있는 경우(`dist/control-ui`) 제어 UI는 **기본적으로 활성화**됩니다.

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath는 선택 사항
  },
}
```

## Webhook

`hooks.enabled=true`이면 Gateway는 동일한 HTTP 서버에서 Webhook 엔드포인트도 노출합니다. 인증 및 페이로드에 대해서는 [Gateway 구성 참조](/ko/gateway/configuration-reference#hooks)의 `hooks`를 참조하십시오.

## 관리자 HTTP RPC

`POST /api/v1/admin/rpc`는 선택된 Gateway 제어 영역 메서드를 HTTP를 통해 노출합니다. 기본적으로 비활성화되어 있으며 `admin-http-rpc` Plugin이 활성화된 경우에만 등록됩니다. 인증 모델, 허용된 메서드 및 WebSocket API와의 비교에 대해서는 [관리자 HTTP RPC](/ko/plugins/admin-http-rpc)를 참조하십시오.

## Tailscale 액세스

<Tabs>
  <Tab title="통합 Serve(권장)">
    Gateway를 루프백에 유지하고 Tailscale Serve가 프록시하도록 합니다.

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Gateway를 시작합니다.

    ```bash
    openclaw gateway
    ```

    `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)을 엽니다.

  </Tab>
  <Tab title="Tailnet 바인드 + 토큰">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Gateway를 시작합니다(이 비루프백 예시에서는 공유 비밀 토큰 인증을 사용합니다).

    ```bash
    openclaw gateway
    ```

    `http://<tailscale-ip>:18789/`(또는 구성한 `gateway.controlUi.basePath`)을 엽니다.

  </Tab>
  <Tab title="공용 인터넷(Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // 또는 OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"`에는 `gateway.auth.mode: "password"`가 필요하며, Serve와 Funnel 모두 `gateway.bind: "loopback"`이 필요합니다.

  </Tab>
</Tabs>

## 보안 참고 사항

- Gateway 인증은 기본적으로 필수입니다. 활성화된 경우 토큰, 비밀번호, 신뢰할 수 있는 프록시 또는 Tailscale Serve ID 헤더를 사용합니다.
- 비루프백 바인드에도 여전히 Gateway 인증이 **필요**합니다. 토큰/비밀번호 인증 또는 `gateway.auth.mode: "trusted-proxy"`가 설정된 ID 인식 역방향 프록시를 사용해야 합니다.
- 온보딩 마법사는 기본적으로 공유 비밀 인증을 생성하며, 루프백에서도 일반적으로 Gateway 토큰을 생성합니다.
- 공유 비밀 모드에서 UI는 WebSocket 핸드셰이크 중에 `connect.params.auth.token` 또는 `connect.params.auth.password`를 전송합니다.
- `gateway.tls.enabled: true`이면 로컬 대시보드/상태 도우미가 `https://` URL과 `wss://` WebSocket URL을 렌더링합니다.
- ID를 포함하는 모드(Tailscale Serve, `trusted-proxy`)에서는 공유 비밀 대신 요청 헤더를 통해 WebSocket 인증 검사가 충족됩니다.
- 공용 비루프백 제어 UI 배포에서는 `gateway.controlUi.allowedOrigins`를 명시적으로 설정하십시오(전체 오리진). 루프백, RFC1918/링크 로컬, `.local`, `.ts.net` 및 Tailscale CGNAT 호스트에서는 비공개 동일 출처 로드를 이 설정 없이도 허용합니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true`는 Host 헤더 오리진 폴백을 활성화합니다. 이는 보안을 위험하게 약화합니다.
- Serve를 사용할 때 `gateway.auth.allowTailscale: true`이면 Tailscale ID 헤더가 제어 UI/WebSocket 인증을 충족합니다(토큰/비밀번호 불필요). HTTP API 엔드포인트는 Tailscale ID 헤더를 사용하지 않으며 항상 Gateway의 일반 HTTP 인증 모드를 따릅니다. Serve를 통해서도 명시적 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`로 설정하십시오. 이 무토큰 흐름은 Gateway 호스트 자체를 신뢰한다고 가정합니다. [Tailscale](/ko/gateway/tailscale) 및 [보안](/ko/gateway/security)을 참조하십시오.

## UI 빌드

Gateway는 `dist/control-ui`의 정적 파일을 제공합니다.

```bash
pnpm ui:build
```
