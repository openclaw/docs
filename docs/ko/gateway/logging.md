---
read_when:
    - 로깅 출력 또는 형식 변경하기
    - CLI 또는 gateway 출력 디버깅하기
summary: 로깅 표면, 파일 로그, WS 로그 스타일 및 콘솔 서식
title: Gateway 로깅
x-i18n:
    generated_at: "2026-04-26T11:29:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# 로깅

사용자 대상 개요(CLI + Control UI + config)는 [/logging](/ko/logging)을 참조하세요.

OpenClaw에는 두 가지 로그 “표면”이 있습니다.

- **콘솔 출력** (터미널 / Debug UI에서 보이는 내용)
- gateway 로거가 기록하는 **파일 로그** (JSON lines)

## 파일 기반 로거

- 기본 롤링 로그 파일은 `/tmp/openclaw/` 아래에 있습니다(하루당 파일 하나): `openclaw-YYYY-MM-DD.log`
  - 날짜는 gateway 호스트의 로컬 시간대를 사용합니다.
- 활성 로그 파일은 `logging.maxFileBytes`(기본값: 100 MB)에서 회전하며,
  번호가 붙은 아카이브를 최대 5개까지 유지하고 새 활성 파일에 계속 기록합니다.
- 로그 파일 경로와 레벨은 `~/.openclaw/openclaw.json`에서 구성할 수 있습니다.
  - `logging.file`
  - `logging.level`

파일 형식은 줄마다 하나의 JSON 객체입니다.

Control UI의 Logs 탭은 gateway를 통해 이 파일을 tail합니다(`logs.tail`).
CLI도 동일하게 할 수 있습니다.

```bash
openclaw logs --follow
```

**Verbose vs. 로그 레벨**

- **파일 로그**는 오직 `logging.level`로만 제어됩니다.
- `--verbose`는 **콘솔 상세도**(및 WS 로그 스타일)에만 영향을 주며, 파일 로그 레벨은 올리지 않습니다.
- verbose 전용 세부 정보를 파일 로그에 남기려면 `logging.level`을 `debug` 또는 `trace`로 설정하세요.

## 콘솔 캡처

CLI는 `console.log/info/warn/error/debug/trace`를 캡처하여 파일 로그에 기록하면서,
동시에 stdout/stderr에도 계속 출력합니다.

콘솔 상세도는 다음을 통해 별도로 조정할 수 있습니다.

- `logging.consoleLevel` (기본값 `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## 도구 요약 마스킹

자세한 도구 요약(예: `🛠️ Exec: ...`)은 민감한 토큰이 콘솔 스트림에 도달하기 전에 마스킹할 수 있습니다. 이는 **도구 전용**이며 파일 로그는 변경하지 않습니다.

- `logging.redactSensitive`: `off` | `tools` (기본값: `tools`)
- `logging.redactPatterns`: regex 문자열 배열(기본값 override)
  - 원시 regex 문자열(auto `gi`)을 사용하거나, 사용자 지정 플래그가 필요하면 `/pattern/flags`를 사용하세요.
  - 일치 항목은 앞 6자 + 뒤 4자만 남기고 마스킹됩니다(길이 >= 18). 그보다 짧으면 `***`가 사용됩니다.
  - 기본값은 일반적인 키 할당, CLI 플래그, JSON 필드, bearer 헤더, PEM 블록, 널리 쓰이는 토큰 접두사를 포괄합니다.

## Gateway WebSocket 로그

gateway는 WebSocket 프로토콜 로그를 두 가지 모드로 출력합니다.

- **일반 모드(`--verbose` 없음)**: “흥미로운” RPC 결과만 출력합니다.
  - 오류 (`ok=false`)
  - 느린 호출 (기본 임계값: `>= 50ms`)
  - 파싱 오류
- **Verbose 모드(`--verbose`)**: 모든 WS 요청/응답 트래픽을 출력합니다.

### WS 로그 스타일

`openclaw gateway`는 gateway별 스타일 전환을 지원합니다.

- `--ws-log auto` (기본값): 일반 모드는 최적화되고, verbose 모드는 compact 출력을 사용
- `--ws-log compact`: verbose일 때 compact 출력(짝지어진 요청/응답)
- `--ws-log full`: verbose일 때 전체 프레임 출력
- `--compact`: `--ws-log compact`의 별칭

예시:

```bash
# 최적화됨(오류/느린 호출만)
openclaw gateway

# 모든 WS 트래픽 표시(짝지음)
openclaw gateway --verbose --ws-log compact

# 모든 WS 트래픽 표시(전체 메타)
openclaw gateway --verbose --ws-log full
```

## 콘솔 서식(하위 시스템 로깅)

콘솔 formatter는 **TTY 인식형**이며 일관된 접두사가 있는 줄을 출력합니다.
하위 시스템 로거는 출력을 그룹화하고 훑어보기 쉽게 유지합니다.

동작:

- 모든 줄에 **하위 시스템 접두사** 표시(예: `[gateway]`, `[canvas]`, `[tailscale]`)
- **하위 시스템 색상**(하위 시스템별 고정) + 레벨 색상
- **출력이 TTY이거나 환경이 리치 터미널처럼 보이면 색상 사용** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` 존중
- **축약된 하위 시스템 접두사**: 앞의 `gateway/` + `channels/`는 제거하고 마지막 2개 세그먼트만 유지(예: `whatsapp/outbound`)
- **하위 시스템별 하위 로거** (자동 접두사 + 구조화된 필드 `{ subsystem }`)
- QR/UX 출력용 **`logRaw()`** (접두사 없음, 서식 없음)
- **콘솔 스타일** (예: `pretty | compact | json`)
- 파일 로그 레벨과 분리된 **콘솔 로그 레벨** (`logging.level`이 `debug`/`trace`로 설정되면 파일은 전체 세부 정보 유지)
- **WhatsApp 메시지 본문**은 `debug`에서 기록됨 (`--verbose`를 사용하면 볼 수 있음)

이렇게 하면 기존 파일 로그는 안정적으로 유지하면서, 대화형 출력은 훑어보기 쉬워집니다.

## 관련 항목

- [로깅](/ko/logging)
- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)
- [진단 내보내기](/ko/gateway/diagnostics)
