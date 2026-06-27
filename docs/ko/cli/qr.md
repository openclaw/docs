---
read_when:
    - 모바일 노드 앱을 Gateway와 빠르게 페어링하려는 경우
    - 원격/수동 공유를 위한 setup-code 출력이 필요합니다
summary: '`openclaw qr`용 CLI 참조(모바일 페어링 QR + 설정 코드 생성)'
title: QR
x-i18n:
    generated_at: "2026-06-27T17:19:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

현재 Gateway 구성에서 모바일 페어링 QR 및 설정 코드를 생성합니다.

## 사용법

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 옵션

- `--remote`: `gateway.remote.url`을 우선 사용합니다. 설정되지 않은 경우에도 `gateway.tailscale.mode=serve|funnel`이 원격 공개 URL을 제공할 수 있습니다.
- `--url <url>`: 페이로드에 사용되는 Gateway URL을 재정의합니다.
- `--public-url <url>`: 페이로드에 사용되는 공개 URL을 재정의합니다.
- `--token <token>`: 부트스트랩 흐름이 인증에 사용할 Gateway 토큰을 재정의합니다.
- `--password <password>`: 부트스트랩 흐름이 인증에 사용할 Gateway 비밀번호를 재정의합니다.
- `--setup-code-only`: 설정 코드만 출력합니다.
- `--no-ascii`: ASCII QR 렌더링을 건너뜁니다.
- `--json`: JSON을 출력합니다(`setupCode`, `gatewayUrl`, `auth`, `urlSource`).

## 참고 사항

- `--token`과 `--password`는 함께 사용할 수 없습니다.
- 설정 코드 자체에는 이제 공유 Gateway 토큰/비밀번호가 아니라 불투명한 단기 `bootstrapToken`이 포함됩니다.
- 기본 제공 설정 코드 부트스트랩은 신뢰할 수 있는 모바일 온보딩을 위한 제한된 `operator` 핸드오프 토큰과 함께 `scopes: []`가 포함된 기본 `node` 토큰을 반환합니다.
- 전달된 operator 토큰은 `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`로 제한됩니다. `operator.admin`과 `operator.pairing`에는 별도로 승인된 operator 페어링 또는 토큰 흐름이 필요합니다.
- 모바일 페어링은 Tailscale/공개 `ws://` Gateway URL에 대해 실패 시 닫힘 방식으로 동작합니다. 사설 LAN 주소와 `.local` Bonjour 호스트는 `ws://`를 통해 계속 지원되지만, Tailscale/공개 모바일 경로는 Tailscale Serve/Funnel 또는 `wss://` Gateway URL을 사용해야 합니다.
- `--remote`를 사용할 경우 OpenClaw에는 `gateway.remote.url` 또는
  `gateway.tailscale.mode=serve|funnel`이 필요합니다.
- `--remote` 사용 시 실제로 활성화된 원격 자격 증명이 SecretRefs로 구성되어 있고 `--token` 또는 `--password`를 전달하지 않으면, 명령이 활성 Gateway 스냅샷에서 이를 확인합니다. Gateway를 사용할 수 없으면 명령은 즉시 실패합니다.
- `--remote` 없이 사용할 경우 CLI 인증 재정의가 전달되지 않으면 로컬 Gateway 인증 SecretRefs가 확인됩니다.
  - 토큰 인증이 우선될 수 있을 때(명시적 `gateway.auth.mode="token"` 또는 비밀번호 소스가 우선되지 않는 추론 모드) `gateway.auth.token`이 확인됩니다.
  - 비밀번호 인증이 우선될 수 있을 때(명시적 `gateway.auth.mode="password"` 또는 auth/env에서 우선되는 토큰이 없는 추론 모드) `gateway.auth.password`가 확인됩니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고(SecretRefs 포함) `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 설정 코드 확인이 실패합니다.
- Gateway 버전 차이 참고: 이 명령 경로에는 `secrets.resolve`를 지원하는 Gateway가 필요합니다. 이전 Gateway는 알 수 없는 메서드 오류를 반환합니다.
- 스캔 후 다음으로 기기 페어링을 승인하세요.
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 관련 항목

- [CLI 참조](/ko/cli)
- [페어링](/ko/cli/pairing)
