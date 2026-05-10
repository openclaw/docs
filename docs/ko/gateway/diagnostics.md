---
read_when:
    - 버그 보고서 또는 지원 요청 준비하기
    - Gateway 충돌, 재시작, 메모리 압박 또는 과도하게 큰 페이로드 디버깅
    - 어떤 진단 데이터가 기록되거나 가림 처리되는지 검토하기
summary: 버그 보고서용 공유 가능한 Gateway 진단 번들 만들기
title: 진단 정보 내보내기
x-i18n:
    generated_at: "2026-05-10T19:35:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw는 버그 보고를 위한 로컬 진단 zip을 만들 수 있습니다. 이 파일은
정리된 Gateway 상태, 상태 검사, 로그, 구성 형태, 최근의 페이로드 없는
안정성 이벤트를 결합합니다.

진단 번들은 검토하기 전까지 비밀처럼 취급하세요. 이 번들은
페이로드와 자격 증명을 생략하거나 수정하도록 설계되었지만, 로컬
Gateway 로그와 호스트 수준 런타임 상태는 여전히 요약합니다.

## 빠른 시작

```bash
openclaw gateway diagnostics export
```

이 명령은 기록된 zip 경로를 출력합니다. 경로를 선택하려면:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

자동화용:

```bash
openclaw gateway diagnostics export --json
```

## 채팅 명령

소유자는 채팅에서 `/diagnostics [note]`를 사용해 로컬 Gateway 내보내기를 요청할 수 있습니다.
버그가 실제 대화에서 발생했고, 지원팀에 보낼 수 있는 하나의
복사-붙여넣기 가능한 보고서가 필요할 때 사용하세요.

1. 문제를 발견한 대화에서 `/diagnostics`를 보내세요. 도움이 된다면
   짧은 메모를 추가하세요. 예: `/diagnostics bad tool choice`.
2. OpenClaw가 진단 전문을 보내고 명시적인 exec 승인을 한 번 요청합니다.
   이 승인은 `openclaw gateway diagnostics export --json`을 실행합니다.
   모두 허용 규칙으로 진단을 승인하지 마세요.
3. 승인 후 OpenClaw는 로컬 번들 경로, 매니페스트 요약, 개인정보 보호 참고 사항,
   관련 세션 id가 포함된 붙여넣기 가능한 보고서로 응답합니다.

그룹 채팅에서도 소유자는 `/diagnostics`를 실행할 수 있지만, OpenClaw는
진단 세부 정보를 공유 채팅에 다시 게시하지 않습니다. 대신 전문,
승인 프롬프트, Gateway 내보내기 결과, Codex 세션/스레드 분석을
비공개 승인 경로를 통해 소유자에게 보냅니다. 그룹에는 진단 흐름이
비공개로 전송되었다는 짧은 알림만 표시됩니다. OpenClaw가 비공개
소유자 경로를 찾을 수 없으면 명령은 안전하게 실패하고 소유자에게 DM에서
실행하라고 요청합니다.

활성 OpenClaw 세션이 네이티브 OpenAI Codex 하니스를 사용하는 경우,
동일한 exec 승인에는 OpenClaw가 알고 있는 Codex 런타임 스레드에 대한
OpenAI 피드백 업로드도 포함됩니다. 이 업로드는 로컬 Gateway zip과 별개이며
Codex 하니스 세션에서만 나타납니다. 승인 전 프롬프트는 진단을 승인하면
Codex 피드백도 전송된다고 설명하지만, Codex 세션 또는 스레드 id는
나열하지 않습니다. 승인 후 채팅 응답에는 OpenAI 서버로 전송된 스레드의
채널, OpenClaw 세션 id, Codex 스레드 id, 로컬 재개 명령이 나열됩니다.
승인을 거부하거나 무시하면 OpenClaw는 내보내기를 실행하지 않고,
Codex 피드백을 보내지 않으며, Codex id를 출력하지 않습니다.

이렇게 하면 일반적인 Codex 디버깅 루프가 짧아집니다. Telegram, Discord 또는
다른 채널에서 잘못된 동작을 발견하고, `/diagnostics`를 실행한 뒤, 한 번 승인하고,
보고서를 지원팀과 공유한 다음, 네이티브 Codex 스레드를 직접 검사하려면
출력된 `codex resume <thread-id>` 명령을 로컬에서 실행하면 됩니다. 해당 검사
워크플로는 [Codex 하니스](/ko/plugins/codex-harness#inspect-codex-threads-locally)를
참조하세요.

## 내보내기에 포함되는 내용

zip에는 다음이 포함됩니다.

- `summary.md`: 지원팀을 위한 사람이 읽을 수 있는 개요.
- `diagnostics.json`: 구성, 로그, 상태, 상태 검사, 안정성 데이터의
  기계가 읽을 수 있는 요약.
- `manifest.json`: 내보내기 메타데이터와 파일 목록.
- 정리된 구성 형태와 비밀이 아닌 구성 세부 정보.
- 정리된 로그 요약과 최근 수정된 로그 줄.
- 최선의 Gateway 상태 및 상태 검사 스냅샷.
- `stability/latest.json`: 사용 가능한 경우 최신 지속 안정성 번들.

Gateway가 비정상인 경우에도 내보내기는 유용합니다. Gateway가 상태 또는
상태 검사 요청에 응답할 수 없더라도, 사용 가능한 경우 로컬 로그, 구성 형태,
최신 안정성 번들은 계속 수집됩니다.

## 개인정보 보호 모델

진단은 공유 가능하도록 설계되었습니다. 내보내기는 디버깅에 도움이 되는
운영 데이터를 유지합니다. 예:

- 하위 시스템 이름, Plugin id, 제공자 id, 채널 id, 구성된 모드
- 상태 코드, 기간, 바이트 수, 큐 상태, 메모리 측정값
- 정리된 로그 메타데이터와 수정된 운영 메시지
- 구성 형태와 비밀이 아닌 기능 설정

내보내기는 다음을 생략하거나 수정합니다.

- 채팅 텍스트, 프롬프트, 지침, Webhook 본문, 도구 출력
- 자격 증명, API 키, 토큰, 쿠키, 비밀 값
- 원시 요청 또는 응답 본문
- 계정 id, 메시지 id, 원시 세션 id, 호스트 이름, 로컬 사용자 이름

로그 메시지가 사용자, 채팅, 프롬프트 또는 도구 페이로드 텍스트처럼 보이면,
내보내기는 메시지가 생략되었다는 사실과 바이트 수만 유지합니다.

## 안정성 기록기

Gateway는 진단이 활성화된 경우 기본적으로 제한된 페이로드 없는 안정성 스트림을
기록합니다. 이는 운영 사실을 위한 것이며 콘텐츠를 위한 것이 아닙니다.

동일한 진단 Heartbeat는 Gateway가 계속 실행되지만 Node.js 이벤트 루프 또는
CPU가 포화된 것처럼 보일 때 활성 상태 샘플을 기록합니다. 이러한
`diagnostic.liveness.warning` 이벤트에는 이벤트 루프 지연, 이벤트 루프 사용률,
CPU 코어 비율, 활성/대기/대기열 세션 수, 알려진 경우 현재 시작/런타임 단계,
최근 단계 구간, 제한된 활성/대기열 작업 레이블이 포함됩니다. 유휴 샘플은
`info` 수준으로 텔레메트리에 남습니다. 활성 상태 샘플은 작업이 대기 중이거나
대기열에 있거나, 활성 작업이 지속적인 이벤트 루프 지연과 겹칠 때만
Gateway 경고가 됩니다. 그 외에는 정상적인 백그라운드 작업 중 일시적인
최대 지연 급증은 디버그 로그에 남습니다. 이러한 이벤트만으로 Gateway가
재시작되지는 않습니다.

시작 단계도 실제 시간 및 CPU 타이밍과 함께 `diagnostic.phase.completed` 이벤트를
내보냅니다. 중단된 임베디드 실행 진단은 마지막 브리지 진행 상황이 원시 응답
항목 또는 응답 완료 이벤트처럼 터미널로 보였지만 Gateway가 여전히 임베디드
실행을 활성 상태로 간주하는 경우 `terminalProgressStale=true`로 표시합니다.

실시간 기록기를 검사합니다.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

치명적 종료, 종료 시간 초과 또는 재시작 시작 실패 후 최신 지속 안정성 번들을
검사합니다.

```bash
openclaw gateway stability --bundle latest
```

최신 지속 번들에서 진단 zip을 만듭니다.

```bash
openclaw gateway stability --bundle latest --export
```

이벤트가 존재하는 경우 지속 번들은 `~/.openclaw/logs/stability/` 아래에 있습니다.

## 유용한 옵션

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 특정 zip 경로에 씁니다.
- `--log-lines <count>`: 포함할 정리된 로그 줄의 최대 수.
- `--log-bytes <bytes>`: 검사할 최대 로그 바이트 수.
- `--url <url>`: 상태 및 상태 검사 스냅샷용 Gateway WebSocket URL.
- `--token <token>`: 상태 및 상태 검사 스냅샷용 Gateway 토큰.
- `--password <password>`: 상태 및 상태 검사 스냅샷용 Gateway 비밀번호.
- `--timeout <ms>`: 상태 및 상태 검사 스냅샷 제한 시간.
- `--no-stability-bundle`: 지속 안정성 번들 조회를 건너뜁니다.
- `--json`: 기계가 읽을 수 있는 내보내기 메타데이터를 출력합니다.

## 진단 비활성화

진단은 기본적으로 활성화되어 있습니다. 안정성 기록기와 진단 이벤트 수집을
비활성화하려면:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

진단을 비활성화하면 버그 보고 세부 정보가 줄어듭니다. 일반 Gateway 로깅에는
영향을 주지 않습니다.

## 관련 항목

- [상태 검사](/ko/gateway/health)
- [Gateway CLI](/ko/cli/gateway#gateway-diagnostics-export)
- [Gateway 프로토콜](/ko/gateway/protocol#system-and-identity)
- [로깅](/ko/logging)
- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry) — 수집기로 진단을 스트리밍하기 위한 별도 흐름
