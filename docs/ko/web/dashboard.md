---
read_when:
    - 대시보드 인증 또는 노출 모드 변경
summary: Gateway 대시보드(제어 UI) 접근 및 인증
title: 대시보드
x-i18n:
    generated_at: "2026-05-11T20:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Gateway 대시보드는 기본적으로 `/`에서 제공되는 브라우저 제어 UI입니다
(`gateway.controlUi.basePath`로 재정의 가능).

빠른 열기(로컬 Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true`인 경우 `https://127.0.0.1:18789/`를 사용하고,
  WebSocket 엔드포인트에는 `wss://127.0.0.1:18789`를 사용하세요.

주요 참고 자료:

- 사용법과 UI 기능은 [제어 UI](/ko/web/control-ui)를 참고하세요.
- Serve/Funnel 자동화는 [Tailscale](/ko/gateway/tailscale)을 참고하세요.
- 바인드 모드와 보안 참고 사항은 [웹 표면](/ko/web)을 참고하세요.

인증은 구성된 gateway 인증 경로를 통해 WebSocket 핸드셰이크에서 강제됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 신뢰할 수 있는 프록시 ID 헤더

[Gateway 구성](/ko/gateway/configuration)의 `gateway.auth`를 참고하세요.

보안 참고 사항: 제어 UI는 **관리자 표면**입니다(채팅, 구성, 실행 승인).
공개적으로 노출하지 마세요. UI는 현재 브라우저 탭 세션과 선택한 gateway URL에 대해
대시보드 URL 토큰을 sessionStorage에 보관하며, 로드 후 URL에서 제거합니다.
localhost, Tailscale Serve 또는 SSH 터널을 선호하세요.

## 빠른 경로(권장)

- 온보딩 후 CLI가 대시보드를 자동으로 열고 깨끗한(토큰이 없는) 링크를 출력합니다.
- 언제든 다시 열기: `openclaw dashboard`(링크 복사, 가능하면 브라우저 열기, 헤드리스 환경이면 SSH 힌트 표시).
- 클립보드와 브라우저 전달이 실패해도 `openclaw dashboard`는 여전히 깨끗한 URL을
  출력하고, `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.token`의 토큰을
  URL 프래그먼트 키 `token`으로 사용하라고 안내합니다. 로그에는 토큰 값을 출력하지 않습니다.
- UI가 공유 비밀 인증을 요청하면 구성된 토큰 또는 비밀번호를
  제어 UI 설정에 붙여 넣으세요.

## 인증 기본 사항(로컬 vs 원격)

- **Localhost**: `http://127.0.0.1:18789/`를 엽니다.
- **Gateway TLS**: `gateway.tls.enabled: true`이면 대시보드/상태 링크는
  `https://`를 사용하고 제어 UI WebSocket 링크는 `wss://`를 사용합니다.
- **공유 비밀 토큰 소스**: `gateway.auth.token`(또는
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard`는 일회성 부트스트랩을 위해
  URL 프래그먼트로 이를 전달할 수 있으며, 제어 UI는 이를 localStorage 대신
  현재 브라우저 탭 세션과 선택한 gateway URL에 대해 sessionStorage에 보관합니다.
- `gateway.auth.token`이 SecretRef로 관리되는 경우, `openclaw dashboard`는
  의도적으로 토큰이 없는 URL을 출력/복사/엽니다. 이는 외부에서 관리되는 토큰이
  셸 로그, 클립보드 기록 또는 브라우저 실행 인수에 노출되는 것을 피하기 위함입니다.
- `gateway.auth.token`이 SecretRef로 구성되어 있고 현재 셸에서 확인되지 않는 경우에도
  `openclaw dashboard`는 토큰이 없는 URL과 실행 가능한 인증 설정 안내를 출력합니다.
- **공유 비밀 비밀번호**: 구성된 `gateway.auth.password`(또는
  `OPENCLAW_GATEWAY_PASSWORD`)를 사용하세요. 대시보드는 다시 로드할 때 비밀번호를 유지하지 않습니다.
- **ID 전달 모드**: `gateway.auth.allowTailscale: true`이면 Tailscale Serve가
  ID 헤더를 통해 제어 UI/WebSocket 인증을 충족할 수 있으며,
  local loopback이 아닌 ID 인식 리버스 프록시는
  `gateway.auth.mode: "trusted-proxy"`를 충족할 수 있습니다. 이러한 모드에서는
  대시보드가 WebSocket에 대해 붙여 넣은 공유 비밀을 필요로 하지 않습니다.
- **localhost가 아님**: Tailscale Serve, local loopback이 아닌 공유 비밀 바인드,
  `gateway.auth.mode: "trusted-proxy"`가 설정된 local loopback이 아닌 ID 인식 리버스 프록시,
  또는 SSH 터널을 사용하세요. 의도적으로 프라이빗 인그레스
  `gateway.auth.mode: "none"` 또는 trusted-proxy HTTP 인증을 실행하지 않는 한
  HTTP API는 여전히 공유 비밀 인증을 사용합니다. [웹 표면](/ko/web)을 참고하세요.

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008이 표시되는 경우

- gateway에 연결할 수 있는지 확인하세요(로컬: `openclaw status`; 원격: SSH 터널 `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기).
- `AUTH_TOKEN_MISMATCH`의 경우, gateway가 재시도 힌트를 반환하면 클라이언트가 캐시된 기기 토큰으로 신뢰할 수 있는 재시도를 한 번 수행할 수 있습니다. 해당 캐시 토큰 재시도는 토큰의 캐시된 승인 범위를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 요청한 범위 세트를 유지합니다. 해당 재시도 후에도 인증이 계속 실패하면 토큰 드리프트를 수동으로 해결하세요.
- `AUTH_SCOPE_MISMATCH`의 경우, 기기 토큰은 인식되었지만 대시보드가 요청한 범위를 포함하지 않습니다. 공유 gateway 토큰을 교체하는 대신 다시 페어링하거나 요청된 범위 계약을 승인하세요.
- 해당 재시도 경로 외부에서 연결 인증 우선순위는 명시적 공유 토큰/비밀번호, 명시적 `deviceToken`, 저장된 기기 토큰, 부트스트랩 토큰 순입니다.
- 비동기 Tailscale Serve 제어 UI 경로에서는 동일한
  `{scope, ip}`에 대한 실패한 시도가 실패 인증 제한기가 이를 기록하기 전에 직렬화되므로,
  두 번째 동시 잘못된 재시도에서 이미 `retry later`가 표시될 수 있습니다.
- 토큰 드리프트 복구 단계는 [토큰 드리프트 복구 체크리스트](/ko/cli/devices#token-drift-recovery-checklist)를 따르세요.
- gateway 호스트에서 공유 비밀을 가져오거나 제공하세요.
  - 토큰: `openclaw config get gateway.auth.token`
  - 비밀번호: 구성된 `gateway.auth.password` 또는
    `OPENCLAW_GATEWAY_PASSWORD` 확인
  - SecretRef로 관리되는 토큰: 외부 비밀 공급자를 확인하거나 이 셸에서
    `OPENCLAW_GATEWAY_TOKEN`을 내보낸 다음 `openclaw dashboard`를 다시 실행
  - 구성된 공유 비밀 없음: `openclaw doctor --generate-gateway-token`
- 대시보드 설정에서 토큰 또는 비밀번호를 인증 필드에 붙여 넣은 다음
  연결하세요.
- UI 언어 선택기는 **개요 -> Gateway 액세스 -> 언어**에 있습니다.
  외형 섹션이 아니라 액세스 카드의 일부입니다.

## 관련 항목

- [제어 UI](/ko/web/control-ui)
- [WebChat](/ko/web/webchat)
