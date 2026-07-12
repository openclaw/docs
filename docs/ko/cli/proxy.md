---
read_when:
    - 배포 전에 운영자가 관리하는 프록시 라우팅을 검증해야 합니다
    - 디버깅을 위해 OpenClaw 전송 트래픽을 로컬에서 캡처해야 합니다
    - 디버그 프록시 세션, Blob 또는 기본 제공 쿼리 프리셋을 검사하려는 경우
summary: 운영자 관리형 프록시 검증 및 로컬 디버그 프록시 캡처 검사기를 포함한 `openclaw proxy`용 CLI 참조 문서
title: 프록시
x-i18n:
    generated_at: "2026-07-12T15:07:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

운영자가 관리하는 프록시 라우팅을 검증하거나, 로컬 명시적 디버그 프록시를 실행하고 캡처된 트래픽을 검사합니다.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate`는 운영자가 관리하는 정방향 프록시를 사전 점검합니다. 나머지는 전송 계층 조사를 위한 디버깅 도구입니다. 로컬 캡처 프록시를 시작하고, 이를 통해 자식 명령을 실행하며, 캡처 세션을 나열하고, 트래픽 패턴을 쿼리하고, 캡처된 Blob을 읽고, 로컬 캡처 데이터를 삭제합니다.

## 검증

우선순위에 따라 `--proxy-url`, 구성(`proxy.proxyUrl`), `OPENCLAW_PROXY_URL`에서 운영자가 관리하는 유효 프록시 URL을 확인합니다. 프록시가 활성화 및 구성되어 있지 않으면 구성 문제를 보고합니다. 구성을 변경하지 않고 일회성 사전 점검을 수행하려면 `--proxy-url`을 전달하십시오.

관리형 프록시 URL은 일반 정방향 프록시 리스너에 `http://`를 사용하고, OpenClaw가 프록시 요청을 보내기 전에 프록시 엔드포인트 자체에 TLS 연결을 열어야 하는 경우 `https://`를 사용합니다. 해당 TLS 연결에서 사설 CA를 신뢰하려면 `--proxy-ca-file`을 사용하십시오.

기본적으로 다음 검사를 실행합니다.

- `https://example.com/`에 대해 **허용됨** 검사 1회(`--allowed-url`로 재정의하거나 추가할 수 있으며 반복 가능)
- 임시 루프백 카나리아에 대해 **거부됨** 검사 1회(`--denied-url`로 재정의할 수 있으며 반복 가능)

사용자 지정 `--denied-url` 대상은 실패 시 차단됩니다. 배포별 거부 신호를 별도로 확인할 수 없는 한 HTTP 응답과 모호한 전송 실패 모두 실패로 간주됩니다. 전송 오류가 차단의 증거로 처리되는 대상은 기본 제공 루프백 카나리아뿐입니다.

프록시를 통해 APNs HTTP/2 CONNECT 터널도 열고 샌드박스 APNs의 응답을 확인하려면 `--apns-reachable`을 추가하십시오. 프로브는 의도적으로 잘못된 공급자 토큰을 전송하므로 APNs의 `403 InvalidProviderToken` 응답은 실패가 아니라 연결 가능성을 나타내는 성공 신호로 간주됩니다.

### 옵션

| 플래그                   | 효과                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `--json`                 | 기계 판독 가능한 JSON 출력                                                                                         |
| `--proxy-url <url>`      | 구성이나 환경 변수 대신 이 `http://`/`https://` 프록시 URL 검증                                                    |
| `--proxy-ca-file <path>` | HTTPS 프록시 엔드포인트의 TLS 검증을 위해 이 PEM CA 파일 신뢰                                                      |
| `--allowed-url <url>`    | 프록시를 통해 성공할 것으로 예상되는 대상(반복 가능)                                                               |
| `--denied-url <url>`     | 프록시에서 차단될 것으로 예상되는 대상(반복 가능)                                                                  |
| `--apns-reachable`       | 프록시를 통해 샌드박스 APNs HTTP/2에 연결할 수 있는지도 확인                                                       |
| `--apns-authority <url>` | 프로브할 APNs 권한 기관(기본값 `https://api.sandbox.push.apple.com`, 프로덕션은 `https://api.push.apple.com`)      |
| `--timeout-ms <ms>`      | 요청별 시간 제한                                                                                                   |

프록시 구성 또는 대상 검사가 실패하면 코드 1로 종료합니다.

배포 지침과 거부 의미 체계는 [네트워크 프록시](/ko/security/network-proxy)를 참조하십시오.

## 디버그 프록시

`start`는 로컬 캡처 프록시를 시작하고 해당 URL, CA 인증서 경로, 캡처 DB 경로를 출력합니다. Ctrl+C로 중지하십시오. `--host`를 설정하지 않으면 기본적으로 `127.0.0.1`에 바인딩합니다.

`run`은 로컬 디버그 프록시를 시작한 다음, 프록시 환경이 적용된 상태에서 `<cmd...>`(`--` 뒤)를 자체 캡처 세션으로 실행합니다.

디버그 프록시의 직접 업스트림 전달은 진단을 위해 업스트림 소켓을 엽니다. OpenClaw 관리형 프록시 모드가 활성화되면 프록시 요청과 CONNECT 터널의 직접 전달은 기본적으로 비활성화됩니다. 승인된 로컬 진단에만 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`을 설정하십시오.

`coverage`는 각 전송 방식이 캡처됨, 프록시 전용 또는 미지원 중 어디에 해당하는지 나타내는 JSON 보고서(`summary` + 전송별 `entries`)를 출력합니다.

`sessions`는 최근 캡처 세션을 나열합니다(`--limit`, 기본값 20).

`query --preset <name>`은 캡처된 트래픽에 기본 제공 쿼리를 실행하며, 선택적으로 `--session <id>`로 범위를 한정할 수 있습니다. 프리셋은 다음과 같습니다.

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>`는 캡처된 페이로드 Blob의 원시 콘텐츠를 출력합니다.

`purge`는 캡처된 모든 트래픽 메타데이터와 Blob을 삭제합니다. 캡처는 로컬 디버깅 데이터이므로 작업을 마치면 삭제하십시오.

## 관련 문서

- [CLI 참조](/ko/cli)
- [네트워크 프록시](/ko/security/network-proxy)
- [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)
