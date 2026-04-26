---
read_when:
    - 버그 보고서 또는 지원 요청 준비하기
    - Gateway 충돌, 재시작, 메모리 압박 또는 과도하게 큰 payload 디버깅하기
    - 어떤 진단 데이터가 기록되거나 비공개 처리되는지 검토하기
summary: 버그 보고용으로 공유 가능한 Gateway 진단 번들 만들기
title: 진단 내보내기
x-i18n:
    generated_at: "2026-04-26T11:28:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw는 버그 보고서에 첨부해도 안전한 로컬 진단 zip을 만들 수 있습니다. 이 zip은 비공개 처리된 Gateway 상태, health, 로그, config 형태, 최근 payload 없는 안정성 이벤트를 결합합니다.

## 빠른 시작

```bash
openclaw gateway diagnostics export
```

명령은 기록된 zip 경로를 출력합니다. 경로를 지정하려면:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

자동화를 위해:

```bash
openclaw gateway diagnostics export --json
```

## 내보내기에 포함되는 항목

zip에는 다음이 포함됩니다:

- `summary.md`: 지원용 사람이 읽을 수 있는 개요
- `diagnostics.json`: config, 로그, 상태, health, 안정성 데이터의 기계가 읽을 수 있는 요약
- `manifest.json`: 내보내기 메타데이터와 파일 목록
- 비공개 처리된 config 형태와 비시크릿 config 세부 정보
- 비공개 처리된 로그 요약과 최근 비공개 처리된 로그 줄
- best-effort Gateway 상태 및 health 스냅샷
- `stability/latest.json`: 가능한 경우 가장 최근에 저장된 안정성 번들

이 내보내기는 Gateway가 비정상 상태일 때도 유용합니다. Gateway가 상태 또는 health 요청에 응답할 수 없더라도, 가능한 경우 로컬 로그, config 형태, 최신 안정성 번들은 여전히 수집됩니다.

## 개인정보 보호 모델

진단 정보는 공유 가능하도록 설계되었습니다. 내보내기는 디버깅에 도움이 되는 다음과 같은 운영 데이터를 유지합니다:

- 서브시스템 이름, Plugin ID, provider ID, 채널 ID, 구성된 모드
- 상태 코드, 지속 시간, 바이트 수, 큐 상태, 메모리 측정값
- 비공개 처리된 로그 메타데이터와 비공개 처리된 운영 메시지
- config 형태와 비시크릿 기능 설정

내보내기에서는 다음을 생략하거나 비공개 처리합니다:

- 채팅 텍스트, 프롬프트, 지침, Webhook 본문, 도구 출력
- 자격 증명, API 키, 토큰, 쿠키, 시크릿 값
- 원시 요청 또는 응답 본문
- 계정 ID, 메시지 ID, 원시 세션 ID, 호스트 이름, 로컬 사용자 이름

로그 메시지가 사용자, 채팅, 프롬프트 또는 도구 payload 텍스트처럼 보이면, 내보내기에는 메시지가 생략되었다는 사실과 바이트 수만 유지됩니다.

## 안정성 기록기

Gateway는 진단이 활성화되어 있을 때 기본적으로 제한된 payload 없는 안정성 스트림을 기록합니다. 이는 콘텐츠가 아니라 운영 사실을 위한 것입니다.

실시간 기록기 검사:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

치명적 종료, 종료 타임아웃 또는 재시작 시작 실패 후 가장 최근에 저장된 안정성 번들 검사:

```bash
openclaw gateway stability --bundle latest
```

가장 최근 저장된 번들에서 진단 zip 생성:

```bash
openclaw gateway stability --bundle latest --export
```

저장된 번들은 이벤트가 있을 경우 `~/.openclaw/logs/stability/` 아래에 저장됩니다.

## 유용한 옵션

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 특정 zip 경로에 기록
- `--log-lines <count>`: 포함할 비공개 처리된 로그 줄 최대 개수
- `--log-bytes <bytes>`: 검사할 로그 최대 바이트 수
- `--url <url>`: 상태 및 health 스냅샷용 Gateway WebSocket URL
- `--token <token>`: 상태 및 health 스냅샷용 Gateway 토큰
- `--password <password>`: 상태 및 health 스냅샷용 Gateway 비밀번호
- `--timeout <ms>`: 상태 및 health 스냅샷 타임아웃
- `--no-stability-bundle`: 저장된 안정성 번들 조회 건너뛰기
- `--json`: 기계가 읽을 수 있는 내보내기 메타데이터 출력

## 진단 비활성화

진단은 기본적으로 활성화되어 있습니다. 안정성 기록기와 진단 이벤트 수집을 비활성화하려면:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

진단을 비활성화하면 버그 보고 세부 정보가 줄어듭니다. 일반적인 Gateway 로깅에는 영향을 주지 않습니다.

## 관련

- [Health checks](/ko/gateway/health)
- [Gateway CLI](/ko/cli/gateway#gateway-diagnostics-export)
- [Gateway protocol](/ko/gateway/protocol#system-and-identity)
- [Logging](/ko/logging)
- [OpenTelemetry export](/ko/gateway/opentelemetry) — 수집기로 진단을 스트리밍하는 별도 흐름
