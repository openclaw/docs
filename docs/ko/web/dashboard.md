---
read_when:
    - 대시보드 인증 또는 노출 모드 변경
summary: Gateway 대시보드(Control UI) 액세스 및 인증
title: 대시보드
x-i18n:
    generated_at: "2026-07-12T15:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway 대시보드는 기본적으로 `/`에서 제공되는 브라우저 Control UI입니다(`gateway.controlUi.basePath`로 재정의할 수 있습니다).

빠르게 열기(로컬 Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true`인 경우 `https://127.0.0.1:18789/`를 사용하고, WebSocket 엔드포인트에는 `wss://127.0.0.1:18789`를 사용하십시오.

주요 참고 자료:

- 사용법과 UI 기능은 [Control UI](/ko/web/control-ui)를 참조하십시오.
- Serve/Funnel 자동화는 [Tailscale](/ko/gateway/tailscale)을 참조하십시오.
- 바인드 모드와 보안 참고 사항은 [웹 인터페이스](/ko/web)를 참조하십시오.

인증은 구성된 Gateway 인증 경로를 통해 WebSocket 핸드셰이크에서 적용됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`인 경우 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`인 경우 신뢰할 수 있는 프록시 ID 헤더

[Gateway 구성](/ko/gateway/configuration)의 `gateway.auth`를 참조하십시오.

<Warning>
Control UI는 **관리자 인터페이스**입니다(채팅, 구성, 실행 승인). 공개적으로 노출하지 마십시오. UI는 현재 브라우저 탭과 선택한 Gateway URL에 대한 대시보드 URL 토큰을 sessionStorage에 보관하고, 로드 후 URL에서 제거합니다. localhost, Tailscale Serve 또는 SSH 터널을 사용하는 것이 좋습니다.
</Warning>

## 빠른 경로(권장)

- 온보딩 후 CLI가 대시보드를 자동으로 열고 깔끔한(토큰이 포함되지 않은) 링크를 출력합니다.
- 언제든지 다시 열려면 `openclaw dashboard`를 실행하십시오(링크를 복사하고, 가능하면 브라우저를 열며, 헤드리스 환경이면 SSH 힌트를 출력합니다).
- 클립보드와 브라우저 전달이 모두 실패해도 `openclaw dashboard`는 깔끔한 URL을 출력하며, URL 프래그먼트 키 `token`에 토큰(`OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.token`)을 추가하라고 안내합니다. 로그에는 토큰 값을 절대 출력하지 않습니다.
- UI에서 공유 비밀 인증을 요청하면 구성된 토큰 또는 비밀번호를 Control UI 설정에 붙여 넣으십시오.

## 인증 기본 사항(로컬과 원격)

- **Localhost**: `http://127.0.0.1:18789/`를 여십시오.
- **Gateway TLS**: `gateway.tls.enabled: true`이면 대시보드/상태 링크에는 `https://`를 사용하고 Control UI WebSocket 링크에는 `wss://`를 사용합니다.
- **공유 비밀 토큰 소스**: `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)입니다. `openclaw dashboard`는 일회성 부트스트랩을 위해 URL 프래그먼트로 이를 전달할 수 있습니다. Control UI는 토큰을 localStorage가 아닌 현재 탭과 선택한 Gateway URL의 sessionStorage에 보관합니다.
- `gateway.auth.token`을 SecretRef로 관리하는 경우, 외부에서 관리되는 토큰이 셸 로그, 클립보드 기록 또는 브라우저 실행 인수에 노출되지 않도록 `openclaw dashboard`는 의도적으로 토큰이 포함되지 않은 URL을 출력/복사/엽니다. 현재 셸에서 참조를 확인할 수 없는 경우에도 토큰이 포함되지 않은 URL과 실행 가능한 인증 설정 안내를 출력합니다.
- **공유 비밀 비밀번호**: 구성된 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 사용하십시오. 대시보드는 새로고침 후에도 비밀번호를 유지하지 않습니다.
- **ID 포함 모드**: `gateway.auth.allowTailscale: true`이면 Tailscale Serve가 ID 헤더를 통해 Control UI/WebSocket 인증을 충족합니다. 루프백이 아닌 ID 인식 역방향 프록시는 `gateway.auth.mode: "trusted-proxy"`를 충족합니다. 어느 방식도 WebSocket을 위해 공유 비밀을 붙여 넣을 필요가 없습니다.
- **Localhost가 아닌 경우**: Tailscale Serve, 루프백이 아닌 공유 비밀 바인드, `gateway.auth.mode: "trusted-proxy"`를 사용하는 루프백이 아닌 ID 인식 역방향 프록시 또는 SSH 터널을 사용하십시오. 의도적으로 비공개 인그레스 `gateway.auth.mode: "none"`이나 신뢰할 수 있는 프록시 HTTP 인증을 실행하지 않는 한 HTTP API에는 계속 공유 비밀 인증이 사용됩니다. [웹 인터페이스](/ko/web)를 참조하십시오.

## Telegram에서 열기

Telegram 봇은 `/dashboard`를 사용하여 대시보드를 Telegram Mini App으로 열 수 있습니다.

요구 사항:

- Telegram이 HTTPS Mini App URL을 받을 수 있도록 `gateway.tailscale.mode: "serve"` 또는 `"funnel"`이어야 합니다.
- Telegram 발신자는 봇 소유자여야 합니다. 즉, `commands.ownerAllowFrom` 또는 선택한 계정에 적용되는 `channels.telegram.allowFrom`에 있는 숫자형 Telegram 사용자 ID여야 합니다.
- 봇과의 DM에서 `/dashboard`를 실행하십시오. 그룹에서 실행하면 DM에서 명령을 열라는 안내만 표시되며 버튼은 포함되지 않습니다.
- Docker 설치: Serve/Funnel 모드를 사용하려면 Gateway가 `tailscaled` 옆의 루프백에 바인드되어야 하는데, 포트를 게시하는 브리지 네트워킹으로는 이를 충족할 수 없습니다. Gateway 컨테이너를 `network_mode: host`로 실행하고 호스트의 `tailscaled` 소켓(`/var/run/tailscale`)과 `tailscale` CLI를 컨테이너에 마운트하십시오.

Mini App은 일회성 소유자 핸드오프를 수행하고 수명이 짧은 부트스트랩 토큰을 사용하여 Control UI로 리디렉션합니다. URL에 공유 Gateway 토큰을 노출하지 않습니다.

v1에서 지원하지 않는 항목:

- Telegram Web iframe은 지원되지 않습니다.
- Tailscale Serve/Funnel만 게시 URL 경로로 지원됩니다.

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008이 표시되는 경우

- Gateway에 연결할 수 있는지 확인하십시오. 로컬에서는 `openclaw status`를 실행하십시오. 원격에서는 `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`로 SSH 터널을 연 다음 `http://127.0.0.1:18789/`를 여십시오.
- `AUTH_TOKEN_MISMATCH`의 경우 Gateway가 재시도 힌트를 반환하면 클라이언트는 캐시된 기기 토큰으로 신뢰할 수 있는 재시도를 한 번 수행할 수 있습니다. 이 재시도에서는 토큰에 캐시된 승인 범위를 다시 사용합니다(명시적 `deviceToken`/`scopes` 호출자는 요청한 범위 집합을 유지합니다). 해당 재시도 후에도 인증에 실패하면 토큰 불일치를 수동으로 해결하십시오.
- `AUTH_SCOPE_MISMATCH`의 경우 기기 토큰은 인식되었지만 요청된 범위를 포함하지 않습니다. 공유 Gateway 토큰을 교체하는 대신 다시 페어링하거나 새 범위 집합을 승인하십시오.
- 해당 재시도 경로 이외의 연결 인증 우선순위는 명시적 공유 토큰/비밀번호, 명시적 `deviceToken`, 저장된 기기 토큰, 부트스트랩 토큰 순입니다.
- 비동기 Tailscale Serve 경로에서는 동일한 `{scope, ip}`에 대한 실패 시도가 실패 인증 제한기에 기록되기 전에 직렬화되므로, 동시에 발생한 두 번째 잘못된 재시도에는 이미 `retry later`가 표시될 수 있습니다.
- 토큰 불일치 복구 단계는 [토큰 불일치 복구 체크리스트](/ko/cli/devices#token-drift-recovery-checklist)를 참조하십시오.
- Gateway 호스트에서 공유 비밀을 조회하거나 제공하십시오.
  - 토큰: `openclaw config get gateway.auth.token`
  - 비밀번호: 구성된 `gateway.auth.password` 또는 `OPENCLAW_GATEWAY_PASSWORD`를 확인하십시오.
  - SecretRef로 관리되는 토큰: 외부 비밀 공급자에서 값을 확인하거나 이 셸에서 `OPENCLAW_GATEWAY_TOKEN`을 내보낸 후 `openclaw dashboard`를 다시 실행하십시오.
  - 공유 비밀이 구성되지 않은 경우: `openclaw doctor --generate-gateway-token`
- 대시보드 설정의 인증 필드에 토큰 또는 비밀번호를 붙여 넣은 다음 연결하십시오.
- UI 언어 선택기는 Appearance가 아니라 **Settings -> General -> Language**에 있습니다.

## 관련 항목

- [Control UI](/ko/web/control-ui)
- [WebChat](/ko/web/webchat)
