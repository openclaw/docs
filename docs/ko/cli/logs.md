---
read_when:
    - SSH 없이 원격으로 Gateway 로그를 실시간 확인해야 합니다.
    - 도구에서 사용할 JSON 로그 줄이 필요합니다
summary: RPC를 통해 Gateway 로그를 추적하는 `openclaw logs` CLI 참조 문서
title: 로그
x-i18n:
    generated_at: "2026-07-12T15:04:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC를 통해 Gateway 파일 로그를 실시간으로 확인합니다. 원격 모드에서도 작동합니다.

## 옵션

- `--limit <n>`: 반환할 최대 로그 줄 수(기본값 `200`)
- `--max-bytes <n>`: 로그 파일에서 읽을 최대 바이트 수(기본값 `250000`)
- `--follow`: 로그 스트림을 계속 확인
- `--interval <ms>`: 계속 확인하는 동안의 폴링 간격(기본값 `1000`)
- `--json`: 줄 단위 JSON 이벤트 출력
- `--plain`: 스타일 서식 없는 일반 텍스트 출력
- `--no-color`: ANSI 색상 비활성화
- `--local-time`: 타임스탬프를 로컬 시간대로 표시(기본값)
- `--utc`: 타임스탬프를 UTC로 표시

## 공통 Gateway RPC 옵션

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway 토큰
- `--timeout <ms>`: 제한 시간(밀리초, 기본값 `30000`)
- `--expect-final`: Gateway 호출이 에이전트 기반인 경우 최종 응답을 기다림

`--url`을 전달하면 설정 자격 증명이 자동으로 적용되지 않습니다. 대상 Gateway에 인증이 필요한 경우 `--token`을 명시적으로 포함하십시오.

## 예시

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 폴백 및 복구 동작

- 암시적 로컬 루프백 Gateway가 페어링을 요청하거나, 연결 중 종료되거나, `logs.tail`이 응답하기 전에 시간 초과가 발생하면 `openclaw logs`는 설정된 Gateway 파일 로그로 자동 폴백합니다. 명시적인 `--url` 대상에는 이 폴백을 사용하지 않습니다.
- 암시적 로컬 Gateway RPC 실패 후 `--follow`는 해당 설정 파일로 폴백하지 않습니다. 오래된 병렬 파일이 실시간 로그 확인에 혼동을 줄 수 있기 때문입니다. Linux에서는 가능한 경우 대신 PID를 기준으로 활성 사용자 systemd Gateway 저널을 사용하고 선택된 소스를 출력합니다. 그렇지 않으면 실시간 Gateway에 계속 재연결을 시도합니다.
- `--follow` 실행 중 일시적인 연결 해제(WebSocket 종료, 시간 초과, 연결 끊김)가 발생하면 지수 백오프로 자동 재연결합니다. 최대 8회 재시도하며, 시도 사이의 간격은 최대 30s입니다. 재시도할 때마다 stderr에 경고를 출력하고, 폴링에 성공하면 `[logs] gateway reconnected` 알림을 한 번 출력합니다. `--json` 모드에서는 둘 다 stderr에 `{"type":"notice"}` 레코드로 출력됩니다. 복구할 수 없는 오류(인증 실패, 잘못된 설정)가 발생하면 여전히 즉시 종료됩니다.
- `--follow --json` 모드에서는 로그 소스 전환이 `{"type":"meta"}` 레코드로 출력됩니다. `sourceKind`별로 커서를 추적하십시오. 스트림은 Gateway 파일 출력(`sourceKind: "file"`)에서 로컬 저널 폴백(`sourceKind: "journal"`, `localFallback: true`, `service.pid`/`service.unit` 포함)으로 이동했다가 복구 후 Gateway 파일 출력으로 돌아갈 수 있습니다. 전체 세션에서 하나의 안정적인 소스나 커서가 유지된다고 가정하지 말고, 복구 과정에서 Gateway 파일 커서를 재생할 때 줄이 중복될 수 있음을 허용하십시오.

## 관련 문서

- [로깅 개요](/ko/logging)
- [Gateway CLI](/ko/cli/gateway)
- [CLI 참조](/ko/cli)
- [Gateway 로깅](/ko/gateway/logging)
