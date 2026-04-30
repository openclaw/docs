---
read_when:
    - Gateway 로그를 원격으로 실시간 확인해야 합니다(SSH 없이)
    - 도구용 JSON 로그 라인이 필요합니다
summary: '`openclaw logs`에 대한 CLI 참조 (RPC를 통해 Gateway 로그 실시간 추적)'
title: 로그
x-i18n:
    generated_at: "2026-04-30T06:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC를 통해 Gateway 파일 로그를 tail합니다(원격 모드에서 작동).

관련 항목:

- 로깅 개요: [로깅](/ko/logging)
- Gateway CLI: [gateway](/ko/cli/gateway)

## 옵션

- `--limit <n>`: 반환할 최대 로그 줄 수(기본값 `200`)
- `--max-bytes <n>`: 로그 파일에서 읽을 최대 바이트 수(기본값 `250000`)
- `--follow`: 로그 스트림을 계속 따라갑니다
- `--interval <ms>`: 따라가는 동안의 폴링 간격(기본값 `1000`)
- `--json`: 줄 단위 JSON 이벤트를 출력합니다
- `--plain`: 스타일 서식 없는 일반 텍스트 출력
- `--no-color`: ANSI 색상을 비활성화합니다
- `--local-time`: 타임스탬프를 로컬 시간대로 렌더링합니다

## 공통 Gateway RPC 옵션

`openclaw logs`는 표준 Gateway 클라이언트 플래그도 받습니다.

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway 토큰
- `--timeout <ms>`: ms 단위 제한 시간(기본값 `30000`)
- `--expect-final`: Gateway 호출이 에이전트 기반일 때 최종 응답을 기다립니다

`--url`을 전달하면 CLI가 구성 또는 환경 자격 증명을 자동으로 적용하지 않습니다. 대상 Gateway에 인증이 필요한 경우 `--token`을 명시적으로 포함하세요.

## 예시

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 참고

- `--local-time`을 사용하면 타임스탬프를 로컬 시간대로 렌더링합니다.
- 암시적 local loopback Gateway가 페어링을 요청하거나, 연결 중 닫히거나, `logs.tail`이 응답하기 전에 제한 시간이 초과되면 `openclaw logs`는 구성된 Gateway 파일 로그로 자동 대체됩니다. 명시적 `--url` 대상은 이 대체 동작을 사용하지 않습니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 로깅](/ko/gateway/logging)
