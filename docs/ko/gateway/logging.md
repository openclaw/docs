---
read_when:
    - 로그 출력 또는 형식 변경
    - CLI 또는 Gateway 출력 디버깅
summary: 로깅 영역, 파일 로그, WS 로그 스타일 및 콘솔 서식
title: Gateway 로깅
x-i18n:
    generated_at: "2026-05-01T06:24:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# 로깅

사용자 대상 개요(CLI + Control UI + 구성)는 [/logging](/ko/logging)을 참고하세요.

OpenClaw에는 두 가지 로그 “표면”이 있습니다.

- **콘솔 출력**(터미널 / Debug UI에서 보이는 내용).
- Gateway 로거가 기록하는 **파일 로그**(JSON lines).

## 파일 기반 로거

- 기본 롤링 로그 파일은 `/tmp/openclaw/` 아래에 있습니다(하루에 파일 하나): `openclaw-YYYY-MM-DD.log`
  - 날짜는 Gateway 호스트의 로컬 시간대를 사용합니다.
- 활성 로그 파일은 `logging.maxFileBytes`에서 순환됩니다(기본값: 100 MB). 번호가 붙은 아카이브를 최대 5개까지 유지하고 새 활성 파일에 계속 기록합니다.
- 로그 파일 경로와 수준은 `~/.openclaw/openclaw.json`을 통해 구성할 수 있습니다.
  - `logging.file`
  - `logging.level`

파일 형식은 한 줄에 JSON 객체 하나입니다.

Control UI 로그 탭은 Gateway(`logs.tail`)를 통해 이 파일을 tail합니다.
CLI도 동일하게 할 수 있습니다.

```bash
openclaw logs --follow
```

**상세 출력과 로그 수준**

- **파일 로그**는 `logging.level`로만 제어됩니다.
- `--verbose`는 **콘솔 상세도**(및 WS 로그 스타일)에만 영향을 주며, 파일 로그 수준을 높이지 **않습니다**.
- 상세 출력 전용 세부 정보를 파일 로그에 캡처하려면 `logging.level`을 `debug` 또는 `trace`로 설정하세요.

## 콘솔 캡처

CLI는 `console.log/info/warn/error/debug/trace`를 캡처하여 파일 로그에 기록하면서,
동시에 stdout/stderr에도 계속 출력합니다.

콘솔 상세도는 다음으로 독립적으로 조정할 수 있습니다.

- `logging.consoleLevel`(기본값 `info`)
- `logging.consoleStyle`(`pretty` | `compact` | `json`)

## 마스킹

OpenClaw는 로그 또는 transcript 출력이 프로세스를 떠나기 전에 민감한 토큰을 마스킹할 수 있습니다. 이 로깅 마스킹 정책은 콘솔, 파일 로그, OTLP 로그 레코드, 세션 transcript 텍스트 싱크에 적용되므로, 일치하는 비밀 값은 JSONL 줄이나 메시지가 디스크에 기록되기 전에 마스킹됩니다.

- `logging.redactSensitive`: `off` | `tools`(기본값: `tools`)
- `logging.redactPatterns`: 정규식 문자열 배열(기본값을 재정의)
  - 원시 정규식 문자열(자동 `gi`)을 사용하거나, 사용자 지정 플래그가 필요하면 `/pattern/flags`를 사용하세요.
  - 일치 항목은 길이가 18 이상이면 처음 6자 + 마지막 4자를 유지하고, 그 외에는 `***`로 마스킹됩니다.
  - 기본값은 일반적인 키 할당, CLI 플래그, JSON 필드, bearer 헤더, PEM 블록, 널리 쓰이는 토큰 접두사, 그리고 카드 번호, CVC/CVV, 공유 결제 토큰, 결제 자격 증명 같은 결제 자격 증명 필드 이름을 포함합니다.

일부 안전 경계는 `logging.redactSensitive`와 관계없이 항상 마스킹합니다.
여기에는 Control UI 도구 호출 이벤트, `sessions_history` 도구 출력, 진단 지원 내보내기, 제공자 오류 관찰, exec 승인 명령 표시, Gateway WebSocket 프로토콜 로그가 포함됩니다. 이러한 표면은 추가 패턴으로 `logging.redactPatterns`를 계속 사용할 수 있지만, `redactSensitive: "off"`가 원시 비밀 값을 내보내게 만들지는 않습니다.

## Gateway WebSocket 로그

Gateway는 WebSocket 프로토콜 로그를 두 가지 모드로 출력합니다.

- **일반 모드(`--verbose` 없음)**: “흥미로운” RPC 결과만 출력됩니다.
  - 오류(`ok=false`)
  - 느린 호출(기본 임계값: `>= 50ms`)
  - 파싱 오류
- **상세 모드(`--verbose`)**: 모든 WS 요청/응답 트래픽을 출력합니다.

### WS 로그 스타일

`openclaw gateway`는 Gateway별 스타일 전환을 지원합니다.

- `--ws-log auto`(기본값): 일반 모드는 최적화되고, 상세 모드는 compact 출력을 사용합니다.
- `--ws-log compact`: 상세 모드에서 compact 출력(쌍으로 묶인 요청/응답)
- `--ws-log full`: 상세 모드에서 프레임별 전체 출력
- `--compact`: `--ws-log compact`의 별칭

예시:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## 콘솔 형식 지정(하위 시스템 로깅)

콘솔 포매터는 **TTY 인식**을 지원하며 일관된 접두사가 붙은 줄을 출력합니다.
하위 시스템 로거는 출력을 그룹화하고 훑어보기 쉽게 유지합니다.

동작:

- 모든 줄에 **하위 시스템 접두사**(예: `[gateway]`, `[canvas]`, `[tailscale]`)
- 수준 색상과 함께 **하위 시스템 색상**(하위 시스템별로 안정적)
- **출력이 TTY이거나 환경이 풍부한 터미널처럼 보일 때 색상 사용**(`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR`를 존중함
- **단축된 하위 시스템 접두사**: 앞의 `gateway/` + `channels/`를 제거하고 마지막 2개 세그먼트를 유지합니다(예: `whatsapp/outbound`)
- **하위 시스템별 하위 로거**(자동 접두사 + 구조화된 필드 `{ subsystem }`)
- QR/UX 출력을 위한 **`logRaw()`**(접두사 없음, 형식 지정 없음)
- **콘솔 스타일**(예: `pretty | compact | json`)
- 파일 로그 수준과 별개의 **콘솔 로그 수준**(`logging.level`이 `debug`/`trace`로 설정되면 파일은 전체 세부 정보를 유지)
- **WhatsApp 메시지 본문**은 `debug`로 기록됩니다(보려면 `--verbose` 사용).

이는 기존 파일 로그를 안정적으로 유지하면서 대화형 출력을 훑어보기 쉽게 만듭니다.

## 관련 항목

- [로깅](/ko/logging)
- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)
- [진단 내보내기](/ko/gateway/diagnostics)
