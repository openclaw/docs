---
read_when:
    - 모바일 Node 앱을 Gateway와 빠르게 페어링하려고 합니다
    - 원격/수동 공유를 위한 설정 코드 출력이 필요합니다
summary: '`openclaw qr`의 CLI 참조(모바일 페어링 QR + 설정 코드 생성)'
title: QR
x-i18n:
    generated_at: "2026-07-12T15:04:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

현재 Gateway 구성에서 모바일 페어링 QR 및 설정 코드를 생성합니다.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

공식 OpenClaw iOS 및 Android 앱은 설정 코드 메타데이터가 일치하면 자동으로 연결됩니다. 요청이 보류 상태로 남아 있는 경우(예: 비공식 클라이언트 또는 일치하지 않는 메타데이터) 검토하고 승인하십시오.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 옵션

- `--remote`: `gateway.remote.url`을 우선 사용하며, 해당 URL이 설정되지 않은 경우 `gateway.tailscale.mode=serve|funnel`로 대체합니다. `device-pair` Plugin의 `publicUrl`은 무시합니다.
- `--url <url>`: 페이로드에 사용되는 Gateway URL을 재정의합니다.
- `--public-url <url>`: 페이로드에 사용되는 공개 URL을 재정의합니다.
- `--token <token>`: 부트스트랩 흐름에서 인증에 사용하는 Gateway 토큰을 재정의합니다.
- `--password <password>`: 부트스트랩 흐름에서 인증에 사용하는 Gateway 비밀번호를 재정의합니다.
- `--setup-code-only`: 설정 코드만 출력합니다.
- `--no-ascii`: ASCII QR 렌더링을 건너뜁니다.
- `--json`: JSON을 출력합니다(`setupCode`, `gatewayUrl`, 선택적 `gatewayUrls`, `auth`, `urlSource`).

`--token`과 `--password`는 함께 사용할 수 없습니다.

## 설정 코드 내용

설정 코드에는 공유 Gateway 토큰/비밀번호가 아니라 불투명한 단기 `bootstrapToken`이 포함됩니다. 기본 제공 부트스트랩 흐름은 다음을 발급합니다.

- `scopes: []`가 지정된 기본 `node` 토큰
- `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`로 제한된 범위형 `operator` 인계 토큰

페어링 변경 범위와 `operator.admin`에는 여전히 별도로 승인된 운영자 페어링 또는 토큰 흐름이 필요합니다.

## Gateway URL 확인

Tailscale/공개 `ws://` Gateway URL의 모바일 페어링은 안전하게 실패하도록 처리됩니다. 이러한 URL에는 Tailscale Serve/Funnel 또는 `wss://` Gateway URL을 사용하십시오. 사설 LAN 주소와 `.local` Bonjour 호스트는 일반 `ws://`에서도 계속 지원됩니다.

선택한 Gateway URL이 `gateway.bind=lan`에서 제공되는 경우 OpenClaw는 영구 `tailscale serve status --json` 경로도 확인합니다. 활성 Gateway의 루프백 포트를 프록시하는 모든 HTTPS Serve 루트가 대체 경로로 포함됩니다. QR 명령은 `lan`에 대해서만 이 대체 경로를 추가하며, `custom`과 `tailnet`은 명시적으로 공지된 경로를 유지합니다. 현재 iOS 클라이언트는 공지된 경로를 순서대로 탐색하여 처음 연결 가능한 경로를 저장합니다. 이전 클라이언트용 레거시 `url` 필드는 변경되지 않습니다.

`--remote`를 사용하는 경우 `gateway.remote.url` 또는 `gateway.tailscale.mode=serve|funnel` 중 하나가 필요합니다.

## 인증 확인(`--remote` 없음)

CLI 인증 재정의를 전달하지 않으면 로컬 Gateway 인증 SecretRefs는 다음과 같이 확인됩니다.

| 조건                                                                                                                         | 확인 결과                                 |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` 또는 우선 적용되는 비밀번호 소스가 없는 추론된 모드                                              | `gateway.auth.token`                      |
| `gateway.auth.mode="password"` 또는 인증/환경에서 우선 적용되는 토큰이 없는 추론된 모드                                      | `gateway.auth.password`                   |
| `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고(SecretRefs 포함) `gateway.auth.mode`가 설정되지 않은 경우 | 실패하며 `gateway.auth.mode`를 명시적으로 설정해야 합니다. |

## 인증 확인(`--remote`)

실제로 활성 상태인 원격 자격 증명이 SecretRefs로 구성되어 있고 `--token`과 `--password`가 모두 전달되지 않은 경우, 명령은 활성 Gateway 스냅샷에서 해당 자격 증명을 확인합니다. Gateway를 사용할 수 없으면 명령이 즉시 실패합니다.

<Note>
이 명령 경로에는 `secrets.resolve` RPC 메서드를 지원하는 Gateway가 필요합니다. 이전 Gateway는 알 수 없는 메서드 오류를 반환합니다.
</Note>

## 관련 항목

- [CLI 참조](/ko/cli)
- [기기](/ko/cli/devices)
- [페어링](/ko/cli/pairing)
