---
read_when:
    - 디버깅을 위해 OpenClaw 전송 트래픽을 로컬에서 캡처해야 함
    - 디버그 proxy 세션, blob 또는 내장 쿼리 프리셋을 검사하고 싶음
summary: 로컬 디버그 proxy 및 캡처 검사기인 `openclaw proxy`용 CLI 참조
title: proxy
x-i18n:
    generated_at: "2026-04-23T14:02:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

로컬 명시적 디버그 proxy를 실행하고 캡처된 트래픽을 검사합니다.

이 명령은 전송 계층 조사용 디버깅 명령입니다. 로컬 proxy를 시작하고, 캡처를 활성화한 상태로 자식 명령을 실행하고, 캡처 세션을 나열하고, 일반적인 트래픽 패턴을 쿼리하고, 캡처된 blob을 읽고, 로컬 캡처 데이터를 정리할 수 있습니다.

## 명령

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 쿼리 프리셋

`openclaw proxy query --preset <name>`은 다음을 받습니다.

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 참고

- `start`는 `--host`가 설정되지 않으면 기본적으로 `127.0.0.1`을 사용합니다.
- `run`은 로컬 디버그 proxy를 시작한 다음 `--` 뒤의 명령을 실행합니다.
- 캡처는 로컬 디버깅 데이터이므로, 완료 후 `openclaw proxy purge`를 사용하세요.
