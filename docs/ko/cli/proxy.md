---
read_when:
    - 배포 전에 운영자가 관리하는 프록시 라우팅을 검증해야 합니다
    - 디버깅을 위해 OpenClaw 전송 트래픽을 로컬에서 캡처해야 합니다
    - 디버그 프록시 세션, 블롭 또는 내장 쿼리 프리셋을 검사하려는 경우
summary: '`openclaw proxy`에 대한 CLI 참조. 운영자 관리 프록시 검증 및 로컬 디버그 프록시 캡처 검사기 포함'
title: 프록시
x-i18n:
    generated_at: "2026-05-01T06:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

운영자 관리형 프록시 라우팅을 검증하거나 로컬 명시적 디버그 프록시를 실행하고
캡처된 트래픽을 검사합니다.

OpenClaw 프록시 라우팅을 활성화하기 전에 `validate`를 사용해 운영자 관리형
포워드 프록시를 사전 점검하세요. 다른 명령은 전송 수준 조사를 위한 디버깅
도구입니다. 로컬 프록시를 시작하고, 캡처를 활성화한 상태로 자식 명령을 실행하고,
캡처 세션을 나열하고, 일반적인 트래픽 패턴을 쿼리하고, 캡처된 블롭을 읽고,
로컬 캡처 데이터를 삭제할 수 있습니다.

## 명령

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 검증

`openclaw proxy validate`는 `--proxy-url`, 구성 또는 `OPENCLAW_PROXY_URL`에서
유효한 운영자 관리형 프록시 URL을 확인합니다. 프록시가 활성화 및 구성되어 있지
않으면 구성 문제를 보고합니다. 구성을 변경하기 전에 일회성 사전 점검에는
`--proxy-url`을 사용하세요. 기본적으로 공용 대상이 프록시를 통해 성공하는지,
그리고 프록시가 임시 루프백 카나리아에 도달할 수 없는지 검증합니다.
사용자 지정 거부 대상은 실패 시 차단 방식입니다. 배포별 거부 신호를 별도로
검증할 수 없는 한 HTTP 응답과 모호한 전송 실패가 모두 실패로 처리됩니다.

옵션:

- `--json`: 기계가 읽을 수 있는 JSON을 출력합니다.
- `--proxy-url <url>`: 구성 또는 환경 변수 대신 이 프록시 URL을 검증합니다.
- `--allowed-url <url>`: 프록시를 통해 성공해야 하는 대상을 추가합니다. 여러 대상을 확인하려면 반복합니다.
- `--denied-url <url>`: 프록시에서 차단해야 하는 대상을 추가합니다. 여러 대상을 확인하려면 반복합니다.
- `--timeout-ms <ms>`: 요청당 제한 시간(밀리초)입니다.

배포 지침과 거부 의미 체계는 [네트워크 프록시](/ko/security/network-proxy)를
참조하세요.

## 쿼리 프리셋

`openclaw proxy query --preset <name>`는 다음을 허용합니다.

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 참고 사항

- `--host`가 설정되지 않으면 `start`는 기본적으로 `127.0.0.1`을 사용합니다.
- `run`은 로컬 디버그 프록시를 시작한 다음 `--` 뒤의 명령을 실행합니다.
- `validate`는 프록시 구성 또는 대상 확인이 실패하면 코드 1로 종료됩니다.
- 캡처는 로컬 디버깅 데이터입니다. 완료되면 `openclaw proxy purge`를 사용하세요.

## 관련 문서

- [CLI 참조](/ko/cli)
- [네트워크 프록시](/ko/security/network-proxy)
- [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)
