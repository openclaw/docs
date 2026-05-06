---
read_when:
    - 모바일 Node 앱을 Gateway와 빠르게 페어링하려는 경우
    - 원격/수동 공유에는 setup-code 출력이 필요합니다
summary: '`openclaw qr`용 CLI 참조(모바일 페어링 QR 및 설정 코드 생성)'
title: QR
x-i18n:
    generated_at: "2026-05-06T06:19:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
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
- `--json`: JSON을 내보냅니다(`setupCode`, `gatewayUrl`, `auth`, `urlSource`).

## 참고

- `--token`과 `--password`는 함께 사용할 수 없습니다.
- 이제 설정 코드 자체에는 공유 Gateway 토큰/비밀번호가 아니라 불투명하고 수명이 짧은 `bootstrapToken`이 포함됩니다.
- 내장 Node/운영자 부트스트랩 흐름에서 기본 Node 토큰은 여전히 `scopes: []`로 전달됩니다.
- 부트스트랩 인계가 운영자 토큰도 발급하는 경우, 해당 토큰은 부트스트랩 허용 목록으로 제한됩니다: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- 부트스트랩 범위 검사는 역할 접두사가 붙습니다. 해당 운영자 허용 목록은 운영자 요청만 충족하며, 운영자가 아닌 역할은 여전히 자체 역할 접두사 아래의 범위가 필요합니다.
- 모바일 페어링은 Tailscale/공개 `ws://` Gateway URL에 대해 안전하게 차단됩니다. 사설 LAN 주소와 `.local` Bonjour 호스트는 `ws://`를 통해 계속 지원되지만, Tailscale/공개 모바일 경로는 Tailscale Serve/Funnel 또는 `wss://` Gateway URL을 사용해야 합니다.
- `--remote`를 사용하면 OpenClaw에는 `gateway.remote.url` 또는
  `gateway.tailscale.mode=serve|funnel`이 필요합니다.
- `--remote`를 사용할 때 실질적으로 활성화된 원격 자격 증명이 SecretRefs로 구성되어 있고 `--token` 또는 `--password`를 전달하지 않으면, 명령은 활성 Gateway 스냅샷에서 이를 해석합니다. Gateway를 사용할 수 없으면 명령은 빠르게 실패합니다.
- `--remote` 없이 사용할 때 CLI 인증 재정의가 전달되지 않으면 로컬 Gateway 인증 SecretRefs가 해석됩니다.
  - 토큰 인증이 우선될 수 있으면 `gateway.auth.token`이 해석됩니다(명시적 `gateway.auth.mode="token"` 또는 비밀번호 소스가 우선되지 않는 추론 모드).
  - 비밀번호 인증이 우선될 수 있으면 `gateway.auth.password`가 해석됩니다(명시적 `gateway.auth.mode="password"` 또는 인증/env에서 우선되는 토큰이 없는 추론 모드).
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고(SecretRefs 포함) `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 설정 코드 해석은 실패합니다.
- Gateway 버전 불일치 참고: 이 명령 경로에는 `secrets.resolve`를 지원하는 Gateway가 필요합니다. 이전 Gateway는 알 수 없는 메서드 오류를 반환합니다.
- 스캔 후 다음으로 기기 페어링을 승인하세요.
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 관련 항목

- [CLI 참조](/ko/cli)
- [페어링](/ko/cli/pairing)
