---
read_when:
    - 대시보드 인증 또는 노출 모드 변경하기
summary: Gateway 대시보드(Control UI) 접근 및 인증
title: 대시보드
x-i18n:
    generated_at: "2026-04-23T14:10:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# 대시보드(Control UI)

Gateway 대시보드는 기본적으로 `/`에서 제공되는 브라우저 Control UI입니다
(`gateway.controlUi.basePath`로 재정의 가능).

빠르게 열기(로컬 Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

주요 참조:

- 사용법과 UI 기능은 [Control UI](/ko/web/control-ui)
- Serve/Funnel 자동화는 [Tailscale](/ko/gateway/tailscale)
- bind 모드와 보안 참고 사항은 [Web surfaces](/ko/web)

인증은 구성된 Gateway 인증 경로를 통해 WebSocket 핸드셰이크에서 강제됩니다:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 trusted-proxy ID 헤더

`gateway.auth`는 [Gateway configuration](/ko/gateway/configuration)을 참조하세요.

보안 참고: Control UI는 **관리자 표면**입니다(채팅, config, exec 승인).
공개적으로 노출하지 마세요. UI는 현재 브라우저 탭 session과 선택한 gateway URL에 대해
대시보드 URL 토큰을 sessionStorage에 보관하고, 로드 후 URL에서 이를 제거합니다.
localhost, Tailscale Serve, 또는 SSH 터널을 권장합니다.

## 빠른 경로(권장)

- 온보딩 후 CLI는 자동으로 대시보드를 열고 깔끔한(토큰 없는) 링크를 출력합니다.
- 언제든 다시 열기: `openclaw dashboard` (링크 복사, 가능하면 브라우저 열기, headless면 SSH 힌트 표시)
- UI가 공유 비밀 인증을 요구하면 구성된 토큰 또는
  비밀번호를 Control UI 설정에 붙여넣으세요.

## 인증 기본 사항(로컬 vs 원격)

- **Localhost**: `http://127.0.0.1:18789/`를 엽니다.
- **공유 비밀 토큰 소스**: `gateway.auth.token` (또는
  `OPENCLAW_GATEWAY_TOKEN`) `openclaw dashboard`는 일회성 부트스트랩을 위해 이를 URL fragment로 전달할 수 있으며,
  Control UI는 이를 localStorage 대신 현재 브라우저 탭 session과 선택한 gateway URL에 대해
  sessionStorage에 유지합니다.
- `gateway.auth.token`이 SecretRef-managed이면 `openclaw dashboard`는
  의도적으로 토큰 없는 URL을 출력/복사/엽니다. 이렇게 하면
  외부에서 관리되는 토큰이 셸 로그, 클립보드 기록, 브라우저 실행 인자에 노출되는 것을 방지합니다.
- `gateway.auth.token`이 SecretRef로 구성되어 있고 현재 셸에서 해석되지 않는 경우에도,
  `openclaw dashboard`는 여전히 토큰 없는 URL과 실행 가능한 인증 설정 안내를 출력합니다.
- **공유 비밀 비밀번호**: 구성된 `gateway.auth.password` (또는
  `OPENCLAW_GATEWAY_PASSWORD`)를 사용하세요. 대시보드는 reload 간에 비밀번호를 유지하지 않습니다.
- **ID 포함 모드**: `gateway.auth.allowTailscale: true`일 때 Tailscale Serve는 ID 헤더를 통해 Control UI/WebSocket
  인증을 충족할 수 있으며, loopback이 아닌 ID 인식 reverse proxy는
  `gateway.auth.mode: "trusted-proxy"`를 충족할 수 있습니다. 이 모드에서는 대시보드에
  WebSocket용 공유 비밀을 붙여넣을 필요가 없습니다.
- **localhost가 아님**: Tailscale Serve, loopback이 아닌 공유 비밀 bind,
  `gateway.auth.mode: "trusted-proxy"`를 사용하는 loopback이 아닌 ID 인식 reverse proxy,
  또는 SSH 터널을 사용하세요. HTTP API는 의도적으로 private-ingress
  `gateway.auth.mode: "none"` 또는 trusted-proxy HTTP auth를 실행하지 않는 한 여전히
  공유 비밀 인증을 사용합니다.
  [Web surfaces](/ko/web)를 참조하세요.

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008이 보이는 경우

- Gateway에 접근 가능한지 확인하세요(로컬: `openclaw status`; 원격: SSH 터널 `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기).
- `AUTH_TOKEN_MISMATCH`의 경우, Gateway가 재시도 힌트를 반환하면 클라이언트는 캐시된 장치 토큰으로 한 번 신뢰된 재시도를 수행할 수 있습니다. 해당 캐시 토큰 재시도는 토큰의 캐시된 승인 범위를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 요청한 범위 집합을 그대로 유지합니다. 해당 재시도 후에도 인증이 실패하면 토큰 불일치를 수동으로 해결하세요.
- 이 재시도 경로 외부에서는 connect 인증 우선순위가 명시적 공유 토큰/비밀번호 우선, 그다음 명시적 `deviceToken`, 그다음 저장된 장치 토큰, 마지막으로 bootstrap 토큰입니다.
- 비동기 Tailscale Serve Control UI 경로에서는 동일한
  `{scope, ip}`에 대한 실패 시도가 failed-auth limiter에 기록되기 전에 직렬화되므로,
  동시에 두 번째 잘못된 재시도에서는 이미 `retry later`가 표시될 수 있습니다.
- 토큰 불일치 복구 단계는 [Token drift recovery checklist](/ko/cli/devices#token-drift-recovery-checklist)를 따르세요.
- Gateway 호스트에서 공유 비밀을 가져오거나 제공하세요:
  - 토큰: `openclaw config get gateway.auth.token`
  - 비밀번호: 구성된 `gateway.auth.password` 또는
    `OPENCLAW_GATEWAY_PASSWORD` 해석
  - SecretRef-managed 토큰: 외부 secret provider를 해석하거나
    이 셸에서 `OPENCLAW_GATEWAY_TOKEN`을 export한 뒤 `openclaw dashboard`를 다시 실행
  - 공유 비밀이 구성되지 않음: `openclaw doctor --generate-gateway-token`
- 대시보드 설정에서 토큰 또는 비밀번호를 인증 필드에 붙여넣은 뒤 연결하세요.
- UI 언어 선택기는 **Overview -> Gateway Access -> Language**에 있습니다.
  Appearance 섹션이 아니라 액세스 카드의 일부입니다.
