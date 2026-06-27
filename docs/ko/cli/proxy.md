---
read_when:
    - 배포 전에 운영자 관리 프록시 라우팅을 검증해야 합니다
    - 디버깅을 위해 OpenClaw 전송 트래픽을 로컬에서 캡처해야 합니다
    - 디버그 프록시 세션, blob 또는 내장 쿼리 프리셋을 검사하려는 경우
summary: '`openclaw proxy`에 대한 CLI 참조로, 운영자 관리 프록시 검증과 로컬 디버그 프록시 캡처 검사기를 포함합니다'
title: 프록시
x-i18n:
    generated_at: "2026-06-27T17:19:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

운영자가 관리하는 프록시 라우팅을 검증하거나, 로컬 명시적 디버그 프록시를 실행하고
캡처된 트래픽을 검사합니다.

OpenClaw 프록시 라우팅을 활성화하기 전에 운영자가 관리하는 포워드 프록시를
사전 점검하려면 `validate`를 사용하세요. 다른 명령은 전송 수준 조사를 위한
디버깅 도구입니다. 로컬 프록시를 시작하고, 캡처를 활성화한 상태로 하위 명령을
실행하며, 캡처 세션을 나열하고, 일반적인 트래픽 패턴을 쿼리하고, 캡처된 blob을
읽고, 로컬 캡처 데이터를 삭제할 수 있습니다.

## 명령

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 검증

`openclaw proxy validate`는 `--proxy-url`, 설정 또는 `OPENCLAW_PROXY_URL`에서
유효한 운영자 관리 프록시 URL을 확인합니다. 관리형 프록시 URL은 일반
포워드 프록시 리스너에는 `http://`를 사용할 수 있고, OpenClaw가 프록시 요청을
보내기 전에 프록시 엔드포인트로 TLS를 열어야 하는 경우에는 `https://`를 사용할
수 있습니다. 프록시가 활성화되고 구성되어 있지 않으면 설정 문제를 보고합니다.
설정을 변경하기 전에 일회성 사전 점검을 하려면 `--proxy-url`을 사용하세요.
HTTPS 프록시 엔드포인트로의 TLS 연결에서 비공개 CA를 신뢰하려면
`--proxy-ca-file`을 추가하세요. 기본적으로 공개 대상이 프록시를 통해 성공하고,
프록시가 임시 루프백 카나리에 도달할 수 없는지 확인합니다. 사용자 지정 거부
대상은 fail-closed 방식입니다. 배포별 거부 신호를 별도로 확인할 수 없는 한
HTTP 응답과 모호한 전송 실패는 모두 실패로 처리됩니다. 프록시를 통해 APNs
HTTP/2 CONNECT 터널도 열고 샌드박스 APNs가 응답하는지 확인하려면
`--apns-reachable`을 추가하세요. 이 프로브는 의도적으로 유효하지 않은 제공자
토큰을 사용하므로, APNs `403 InvalidProviderToken` 응답은 도달 가능성을 나타내는
성공 신호입니다.

옵션:

- `--json`: 기계가 읽을 수 있는 JSON을 출력합니다.
- `--proxy-url <url>`: 설정이나 환경 변수 대신 이 `http://` 또는 `https://` 프록시 URL을 검증합니다.
- `--proxy-ca-file <path>`: HTTPS 프록시 엔드포인트의 TLS 검증을 위해 이 PEM CA 파일을 신뢰합니다.
- `--allowed-url <url>`: 프록시를 통해 성공할 것으로 예상되는 대상을 추가합니다. 여러 대상을 확인하려면 반복하세요.
- `--denied-url <url>`: 프록시에 의해 차단될 것으로 예상되는 대상을 추가합니다. 여러 대상을 확인하려면 반복하세요.
- `--apns-reachable`: 샌드박스 APNs HTTP/2가 프록시를 통해 도달 가능한지도 확인합니다.
- `--apns-authority <url>`: `--apns-reachable`로 프로브할 APNs authority입니다(기본값은 `https://api.sandbox.push.apple.com`, 프로덕션은 `https://api.push.apple.com`).
- `--timeout-ms <ms>`: 요청별 제한 시간(밀리초)입니다.

배포 지침과 거부 의미 체계는 [네트워크 프록시](/ko/security/network-proxy)를 참조하세요.

## 쿼리 프리셋

`openclaw proxy query --preset <name>`은 다음을 허용합니다.

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 참고

- `start`는 `--host`가 설정되지 않은 경우 기본값으로 `127.0.0.1`을 사용합니다.
- `run`은 로컬 디버그 프록시를 시작한 다음 `--` 뒤의 명령을 실행합니다.
- 디버그 프록시의 직접 업스트림 전달은 진단을 위해 업스트림 소켓을 엽니다. OpenClaw 관리형 프록시 모드가 활성화되어 있으면 프록시 요청과 CONNECT 터널에 대한 직접 전달은 기본적으로 비활성화됩니다. 승인된 로컬 진단에만 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`을 설정하세요.
- 프록시 설정 또는 대상 확인이 실패하면 `validate`는 코드 1로 종료됩니다.
- 캡처는 로컬 디버깅 데이터입니다. 완료 후 `openclaw proxy purge`를 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [네트워크 프록시](/ko/security/network-proxy)
- [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)
