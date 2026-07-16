---
read_when:
    - 모바일 Node 앱을 Gateway와 빠르게 페어링하려고 합니다
    - 원격/수동 공유를 위한 설정 코드 출력이 필요합니다
summary: '`openclaw qr`에 대한 CLI 참조(모바일 페어링 QR + 설정 코드 생성)'
title: QR
x-i18n:
    generated_at: "2026-07-16T12:30:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
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
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

공식 OpenClaw iOS 및 Android 앱은 설정 코드 메타데이터가 일치하면 자동으로 연결됩니다. 요청이 대기 상태로 남아 있는 경우(예: 비공식 클라이언트이거나 메타데이터가 일치하지 않는 경우) 검토한 후 승인하십시오.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 옵션

- `--remote`: `gateway.remote.url`을 우선 사용하며, 해당 URL이 설정되지 않은 경우 `gateway.tailscale.mode=serve|funnel`으로 대체합니다. `device-pair` Plugin `publicUrl`을 무시합니다.
- `--url <url>`: 페이로드에 사용되는 Gateway URL을 재정의합니다.
- `--public-url <url>`: 페이로드에 사용되는 공개 URL을 재정의합니다.
- `--token <token>`: 부트스트랩 흐름에서 인증에 사용하는 Gateway 토큰을 재정의합니다.
- `--password <password>`: 부트스트랩 흐름에서 인증에 사용하는 Gateway 비밀번호를 재정의합니다.
- `--limited`: 전달되는 운영자 토큰에서 관리용 Gateway 액세스를 제외합니다.
- `--setup-code-only`: 설정 코드만 출력합니다.
- `--no-ascii`: ASCII QR 렌더링을 건너뜁니다.
- `--json`: JSON을 출력합니다(`setupCode`, `gatewayUrl`, 선택적 `gatewayUrls`, `auth`, `access`, 선택적 `accessDowngraded`, `urlSource`).

`--token`와 `--password`은 함께 사용할 수 없습니다.

## 설정 코드 내용

설정 코드에는 공유 Gateway 토큰/비밀번호가 아니라 불투명하고 수명이 짧은 `bootstrapToken`이 포함됩니다. `wss://` 엔드포인트(또는 동일 호스트의 루프백)에서 기본 부트스트랩 흐름은 다음을 발급합니다.

- `scopes: []`이 포함된 기본 `node` 토큰
- `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`이 포함된 전체 네이티브 모바일 `operator` 전달 토큰

운영자 전달에서 `operator.admin`을 제외하면서 동일한 Node 토큰을 유지하려면 `--limited`을 사용하십시오. 페어링 변경 범위는 설정 코드를 통해 절대 전달되지 않습니다.

평문 LAN `ws://` 설정도 계속 사용할 수 있지만, 네트워크 관찰자가 베어러 부트스트랩 토큰을 가로채 먼저 사용할 수 있으므로 OpenClaw는 제한된 프로필을 자동으로 사용합니다. 전체 액세스를 얻으려면 `wss://` 또는 Tailscale Serve를 구성한 다음 새 코드를 생성하십시오.

## Gateway URL 확인

Tailscale/공개 `ws://` Gateway URL에서는 모바일 페어링이 실패 시 차단됩니다. 이러한 URL에는 Tailscale Serve/Funnel 또는 `wss://` Gateway URL을 사용하십시오. 비공개 LAN 주소와 `.local` Bonjour 호스트는 위에서 설명한 제한된 운영자 액세스와 함께 평문 `ws://`을 통한 연결을 계속 지원합니다.

선택한 Gateway URL이 `gateway.bind=lan`에서 제공되는 경우 OpenClaw는 영구 `tailscale serve status --json` 경로도 확인합니다. 활성 Gateway의 루프백 포트를 프록시하는 모든 HTTPS Serve 루트가 대체 경로로 포함됩니다. QR 명령은 이 대체 경로를 `lan`에만 추가하며, `custom`와 `tailnet`은 명시적으로 광고된 경로를 유지합니다. 현재 iOS 클라이언트는 광고된 경로를 순서대로 탐색하고 처음 연결 가능한 경로를 저장합니다. 이전 클라이언트를 위해 레거시 `url` 필드는 변경되지 않습니다.

`--remote`을 사용하는 경우 `gateway.remote.url` 또는 `gateway.tailscale.mode=serve|funnel` 중 하나가 필요합니다.

## 인증 확인(`--remote` 없음)

CLI 인증 재정의를 전달하지 않으면 로컬 Gateway 인증 SecretRefs가 다음과 같이 확인됩니다.

| 조건                                                                                                                    | 확인 결과                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`이거나, 우선 적용되는 비밀번호 소스가 없는 추론 모드                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`이거나, 인증/환경에서 우선 적용되는 토큰이 없는 추론 모드                                         | `gateway.auth.password`                   |
| `gateway.auth.token`과 `gateway.auth.password`이 모두 구성되어 있고(SecretRefs 포함) `gateway.auth.mode`이 설정되지 않음 | 실패합니다. `gateway.auth.mode`을 명시적으로 설정하십시오. |

## 인증 확인(`--remote`)

실질적으로 활성화된 원격 자격 증명이 SecretRefs로 구성되어 있고 `--token`과 `--password` 중 어느 것도 전달되지 않으면, 명령은 활성 Gateway 스냅샷에서 해당 자격 증명을 확인합니다. Gateway를 사용할 수 없으면 명령이 즉시 실패합니다.

<Note>
이 명령 경로에는 `secrets.resolve` RPC 메서드를 지원하는 Gateway가 필요합니다. 이전 Gateway는 알 수 없는 메서드 오류를 반환합니다.
</Note>

## 관련 항목

- [CLI 참조](/ko/cli)
- [기기](/ko/cli/devices)
- [페어링](/ko/cli/pairing)
