---
read_when:
    - 대시보드 인증 또는 노출 모드 변경
summary: Gateway 대시보드(제어 UI) 접근 및 인증
title: 대시보드
x-i18n:
    generated_at: "2026-05-05T01:50:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Gateway 대시보드는 기본적으로 `/`에서 제공되는 브라우저 제어 UI입니다
(`gateway.controlUi.basePath`로 재정의).

빠른 열기(로컬 Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true`인 경우 WebSocket 엔드포인트에는 `https://127.0.0.1:18789/` 및
  `wss://127.0.0.1:18789`를 사용합니다.

주요 참고 자료:

- 사용법 및 UI 기능은 [제어 UI](/ko/web/control-ui)를 참조하세요.
- Serve/Funnel 자동화는 [Tailscale](/ko/gateway/tailscale)을 참조하세요.
- 바인드 모드와 보안 참고 사항은 [웹 표면](/ko/web)을 참조하세요.

인증은 구성된 Gateway 인증 경로를 통해 WebSocket 핸드셰이크에서 적용됩니다:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 신뢰할 수 있는 프록시 ID 헤더

[Gateway 구성](/ko/gateway/configuration)의 `gateway.auth`를 참조하세요.

보안 참고 사항: 제어 UI는 **관리자 표면**입니다(채팅, 구성, 실행 승인).
공개적으로 노출하지 마세요. UI는 현재 브라우저 탭 세션과 선택한 Gateway URL에 대해
대시보드 URL 토큰을 sessionStorage에 보관하고, 로드 후 URL에서 제거합니다.
localhost, Tailscale Serve 또는 SSH 터널을 권장합니다.

## 빠른 경로(권장)

- 온보딩 후 CLI가 대시보드를 자동으로 열고 깔끔한(토큰이 없는) 링크를 출력합니다.
- 언제든 다시 열기: `openclaw dashboard`(링크 복사, 가능하면 브라우저 열기, 헤드리스 환경이면 SSH 힌트 표시).
- 클립보드와 브라우저 전달이 실패해도 `openclaw dashboard`는 여전히
  깔끔한 URL을 출력하고, `OPENCLAW_GATEWAY_TOKEN` 또는
  `gateway.auth.token`의 토큰을 URL 프래그먼트 키 `token`으로 사용하라고 안내합니다. 로그에는 토큰
  값을 출력하지 않습니다.
- UI가 공유 비밀 인증을 요청하면 구성된 토큰 또는
  비밀번호를 제어 UI 설정에 붙여넣으세요.

## 인증 기본 사항(로컬 vs 원격)

- **Localhost**: `http://127.0.0.1:18789/`를 엽니다.
- **Gateway TLS**: `gateway.tls.enabled: true`일 때 대시보드/상태 링크는
  `https://`를 사용하고 제어 UI WebSocket 링크는 `wss://`를 사용합니다.
- **공유 비밀 토큰 소스**: `gateway.auth.token`(또는
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard`는 일회성 부트스트랩을 위해 URL 프래그먼트로 전달할 수 있으며,
  제어 UI는 localStorage 대신 현재 브라우저 탭 세션과 선택한 Gateway URL에 대해
  이를 sessionStorage에 보관합니다.
- `gateway.auth.token`이 SecretRef로 관리되는 경우, `openclaw dashboard`는
  의도적으로 토큰이 없는 URL을 출력/복사/엽니다. 이렇게 하면
  외부에서 관리되는 토큰이 셸 로그, 클립보드 기록 또는 브라우저 실행
  인수에 노출되는 것을 방지할 수 있습니다.
- `gateway.auth.token`이 SecretRef로 구성되어 있고 현재
  셸에서 확인되지 않는 경우에도 `openclaw dashboard`는 토큰이 없는 URL과
  실행 가능한 인증 설정 안내를 출력합니다.
- **공유 비밀 비밀번호**: 구성된 `gateway.auth.password`(또는
  `OPENCLAW_GATEWAY_PASSWORD`)를 사용합니다. 대시보드는 다시 로드한 뒤에도 비밀번호를 유지하지 않습니다.
- **ID 포함 모드**: `gateway.auth.allowTailscale: true`일 때 Tailscale Serve는
  ID 헤더를 통해 제어 UI/WebSocket 인증을 충족할 수 있으며,
  local loopback이 아닌 ID 인식 리버스 프록시는
  `gateway.auth.mode: "trusted-proxy"`를 충족할 수 있습니다. 이러한 모드에서는 대시보드가
  WebSocket에 대해 붙여넣은 공유 비밀을 필요로 하지 않습니다.
- **localhost가 아닌 경우**: Tailscale Serve, local loopback이 아닌 공유 비밀 바인드,
  `gateway.auth.mode: "trusted-proxy"`가 있는
  local loopback이 아닌 ID 인식 리버스 프록시 또는 SSH 터널을 사용합니다. HTTP API는
  private-ingress `gateway.auth.mode: "none"` 또는 trusted-proxy HTTP 인증을 의도적으로 실행하지 않는 한
  여전히 공유 비밀 인증을 사용합니다. [웹 표면](/ko/web)을 참조하세요.

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008이 표시되는 경우

- Gateway에 연결할 수 있는지 확인하세요(로컬: `openclaw status`; 원격: SSH 터널 `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기).
- `AUTH_TOKEN_MISMATCH`의 경우, Gateway가 재시도 힌트를 반환하면 클라이언트는 캐시된 기기 토큰으로 신뢰된 재시도를 한 번 수행할 수 있습니다. 해당 캐시 토큰 재시도는 토큰의 캐시된 승인 범위를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 요청한 범위 집합을 유지합니다. 해당 재시도 후에도 인증이 실패하면 토큰 드리프트를 수동으로 해결하세요.
- 해당 재시도 경로 외부에서 연결 인증 우선순위는 명시적 공유 토큰/비밀번호, 명시적 `deviceToken`, 저장된 기기 토큰, 부트스트랩 토큰 순입니다.
- 비동기 Tailscale Serve 제어 UI 경로에서는 동일한
  `{scope, ip}`에 대한 실패한 시도가 실패 인증 제한기에 기록되기 전에 직렬화되므로,
  두 번째 동시 잘못된 재시도는 이미 `retry later`를 표시할 수 있습니다.
- 토큰 드리프트 복구 단계는 [토큰 드리프트 복구 체크리스트](/ko/cli/devices#token-drift-recovery-checklist)를 따르세요.
- Gateway 호스트에서 공유 비밀을 가져오거나 제공하세요:
  - 토큰: `openclaw config get gateway.auth.token`
  - 비밀번호: 구성된 `gateway.auth.password` 또는
    `OPENCLAW_GATEWAY_PASSWORD`를 확인
  - SecretRef 관리 토큰: 외부 비밀 공급자를 확인하거나
    이 셸에서 `OPENCLAW_GATEWAY_TOKEN`을 내보낸 다음 `openclaw dashboard`를 다시 실행
  - 구성된 공유 비밀 없음: `openclaw doctor --generate-gateway-token`
- 대시보드 설정에서 토큰 또는 비밀번호를 인증 필드에 붙여넣은 다음
  연결하세요.
- UI 언어 선택기는 **개요 -> Gateway 액세스 -> 언어**에 있습니다.
  이는 액세스 카드의 일부이며, 모양 섹션이 아닙니다.

## 관련 항목

- [제어 UI](/ko/web/control-ui)
- [WebChat](/ko/web/webchat)
