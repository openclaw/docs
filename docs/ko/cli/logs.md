---
read_when:
    - Gateway 로그를 원격으로 실시간 확인해야 합니다(SSH 없이)
    - 도구용 JSON 로그 라인이 필요한 경우
summary: '`openclaw logs`에 대한 CLI 참조(RPC를 통해 Gateway 로그 실시간 확인)'
title: 로그
x-i18n:
    generated_at: "2026-05-03T21:28:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC를 통해 Gateway 파일 로그를 추적합니다(원격 모드에서 작동).

관련 항목:

- 로깅 개요: [로깅](/ko/logging)
- Gateway CLI: [gateway](/ko/cli/gateway)

## 옵션

- `--limit <n>`: 반환할 최대 로그 줄 수(기본값 `200`)
- `--max-bytes <n>`: 로그 파일에서 읽을 최대 바이트 수(기본값 `250000`)
- `--follow`: 로그 스트림 추적
- `--interval <ms>`: 추적 중 폴링 간격(기본값 `1000`)
- `--json`: 줄 단위 JSON 이벤트 출력
- `--plain`: 스타일 서식 없는 일반 텍스트 출력
- `--no-color`: ANSI 색상 비활성화
- `--local-time`: 타임스탬프를 로컬 시간대로 렌더링

## 공유 Gateway RPC 옵션

`openclaw logs`는 표준 Gateway 클라이언트 플래그도 허용합니다.

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway 토큰
- `--timeout <ms>`: 밀리초 단위 제한 시간(기본값 `30000`)
- `--expect-final`: Gateway 호출이 에이전트 기반일 때 최종 응답 대기

`--url`을 전달하면 CLI는 구성 또는 환경 자격 증명을 자동으로 적용하지 않습니다. 대상 Gateway에 인증이 필요한 경우 `--token`을 명시적으로 포함하세요.

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
- 암시적 local loopback Gateway가 페어링을 요청하거나, 연결 중 닫히거나, `logs.tail`이 응답하기 전에 시간이 초과되면 `openclaw logs`는 구성된 Gateway 파일 로그로 자동 대체됩니다. 명시적 `--url` 대상은 이 대체 동작을 사용하지 않습니다.
- `--follow`를 사용할 때 일시적인 gateway 연결 끊김(WebSocket 닫힘, 시간 초과, 연결 끊김)은 지수 백오프로 자동 재연결을 트리거합니다(최대 8회 재시도, 시도 간 최대 30초). 재시도할 때마다 stderr에 경고가 출력되고, 폴링이 성공하면 `[logs] gateway reconnected` 알림이 한 번 출력됩니다. `--json` 모드에서는 재시도 경고와 재연결 전환이 모두 stderr에 `{"type":"notice"}` 레코드로 출력됩니다. 복구할 수 없는 오류(인증 실패, 잘못된 구성)는 여전히 즉시 종료됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 로깅](/ko/gateway/logging)
