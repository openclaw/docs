---
read_when:
    - 버그 보고서 또는 지원 요청 준비하기
    - Gateway 충돌, 재시작, 메모리 부족 또는 과도하게 큰 페이로드 디버깅
    - 기록되거나 마스킹되는 진단 데이터 검토하기
summary: 버그 보고를 위해 공유 가능한 Gateway 진단 번들 만들기
title: 진단 내보내기
x-i18n:
    generated_at: "2026-07-12T15:14:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw은 버그 보고를 위한 로컬 진단 `.zip`을 생성할 수 있습니다. 여기에는 민감 정보가 제거된 Gateway 상태, 상태 점검, 로그, 구성 구조 및 페이로드가 포함되지 않은 최근 안정성 이벤트가 포함됩니다.

진단 번들은 검토할 때까지 비밀 정보처럼 취급하십시오. 페이로드와 자격 증명은 설계상 삭제되지만, 번들에는 로컬 Gateway 로그와 호스트 수준 런타임 상태의 요약이 여전히 포함됩니다.

## 빠른 시작

```bash
openclaw gateway diagnostics export
```

생성된 zip 경로를 출력합니다. 출력 경로를 선택하려면 다음을 실행하십시오.

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

자동화하려면 다음을 실행하십시오.

```bash
openclaw gateway diagnostics export --json
```

## 채팅 명령

소유자는 모든 대화에서 `/diagnostics [note]`를 실행하여 복사하여 붙여넣을 수 있는 하나의 지원 보고서 형태로 로컬 Gateway 내보내기를 요청할 수 있습니다.

1. `/diagnostics`를 전송하고 선택적으로 짧은 메모를 추가합니다(`/diagnostics bad tool choice`).
2. OpenClaw은 안내문을 전송하고 한 번의 명시적인 실행 승인을 요청하며, 승인하면
   `openclaw gateway diagnostics export --json`이 실행됩니다. 모든 실행을 허용하는 규칙을 통해
   진단을 승인하지 마십시오.
3. 승인 후 OpenClaw은 로컬 번들 경로, 매니페스트
   요약, 개인정보 보호 참고 사항 및 관련 세션 ID를 응답으로 제공합니다.

그룹 채팅에서도 소유자는 `/diagnostics`를 실행할 수 있지만, OpenClaw는 내보내기 결과, 승인 프롬프트, Codex 세션/스레드 분석 내역을 소유자에게 비공개로 전송합니다. 그룹에는 진단 정보가 비공개로 전송되었다는 짧은 알림만 표시됩니다. 소유자에게 전송할 비공개 경로가 없으면 명령은 안전을 위해 실패하며 소유자에게 DM에서 실행하도록 요청합니다.

활성 세션에서 네이티브 OpenAI Codex 하네스를 사용하는 경우, 동일한 실행 승인에는 OpenClaw가 인식하는 Codex 스레드의 OpenAI 피드백 업로드도 포함됩니다. 이 업로드는 로컬 Gateway zip과 별개이며 Codex 하네스 세션에서만 수행됩니다. 승인 프롬프트에는 승인 시 Codex 피드백도 전송된다고 명시되지만, Codex 세션 또는 스레드 ID는 나열하지 않습니다. 승인 후 응답에는 OpenAI로 전송된 스레드의 채널, OpenClaw 세션 ID, Codex 스레드 ID, 로컬 재개 명령이 나열됩니다. 승인을 거부하거나 무시하면 내보내기, Codex 피드백 업로드, Codex ID 목록을 모두 건너뜁니다.

따라서 Codex 디버깅 과정이 간단해집니다. 채널에서 잘못된 동작을 발견하면 `/diagnostics`를 실행하고 한 번 승인한 다음 보고서를 공유하십시오. 이후 스레드를 직접 검사하려면 출력된 `codex resume <thread-id>` 명령을 로컬에서 실행하십시오. [Codex 하네스](/ko/plugins/codex-harness#inspect-codex-threads-locally)를 참조하십시오.

## 내보내기에 포함되는 내용

- `summary.md`: 지원을 위한 사람이 읽을 수 있는 개요입니다.
- `diagnostics.json`: 구성, 로그, 상태, 상태 점검, 안정성 데이터의 기계 판독 가능 요약입니다.
- `manifest.json`: 내보내기 메타데이터 및 파일 목록입니다.
- 삭제 처리된 구성 구조와 비밀이 아닌 구성 세부 정보입니다.
- 삭제 처리된 로그 요약과 최근의 민감 정보가 제거된 로그 줄입니다.
- 가능한 범위에서 수집한 Gateway 상태 및 상태 점검 스냅샷입니다.
- `stability/latest.json`: 사용 가능한 경우 가장 최근에 저장된 안정성 번들입니다.

Gateway에 문제가 있어도 내보내기는 유용합니다. 상태/상태 점검 요청이 실패하더라도 사용 가능한 경우 로컬 로그, 구성 구조, 최신 안정성 번들을 계속 수집합니다.

## 개인정보 보호 모델

유지되는 정보: 하위 시스템 이름, Plugin ID, 제공자 ID, 채널 ID, 구성된 모드, 상태 코드, 소요 시간, 바이트 수, 대기열 상태, 메모리 측정값, 삭제 처리된 로그 메타데이터, 민감 정보가 제거된 운영 메시지, 구성 구조, 비밀이 아닌 기능 설정입니다.

생략되거나 민감 정보가 제거되는 정보: 채팅 텍스트, 프롬프트, 지침, Webhook 본문, 도구 출력, 자격 증명, API 키, 토큰, 쿠키, 비밀 값, 원시 요청/응답 본문, 계정 ID, 메시지 ID, 원시 세션 ID, 호스트 이름, 로컬 사용자 이름입니다.

로그 메시지가 사용자, 채팅, 프롬프트 또는 도구 페이로드 텍스트로 보이면 내보내기에는 메시지가 생략되었다는 사실과 해당 바이트 수만 유지됩니다.

## 안정성 기록기

진단이 활성화되면 Gateway는 기본적으로 크기가 제한되고 페이로드를 포함하지 않는 안정성 스트림을 기록합니다. 이 스트림은 콘텐츠가 아닌 운영 정보를 수집합니다.

또한 동일한 Heartbeat는 이벤트 루프나 CPU가 포화된 것으로 보일 때 활성 상태를 샘플링하여 이벤트 루프 지연, 이벤트 루프 사용률, CPU 코어 비율, 활성/대기/큐 대기 중인 세션 수, 현재 시작/런타임 단계(알려진 경우), 최근 단계 구간, 제한된 작업 레이블을 포함하는 `diagnostic.liveness.warning` 이벤트를 내보냅니다. 이러한 이벤트는 작업이 대기 중이거나 큐에 있거나 활성 작업이 지속적인 이벤트 루프 지연과 겹칠 때만 Gateway `warn` 수준 로그 행으로 기록되며, 그 외에는 `debug` 수준으로 기록됩니다. 유휴 활성 상태 샘플도 진단 이벤트로 기록되지만, 그 자체만으로 경고로 격상되지는 않습니다.

시작 단계에서는 실제 경과 시간 및 CPU 시간 정보가 포함된 `diagnostic.phase.completed` 이벤트를 내보냅니다. 중단된 임베디드 실행 진단에서는 마지막 브리지 진행 상황이 종료 상태로 보였지만(예: 원시 응답 항목 또는 응답 완료 이벤트) Gateway가 여전히 임베디드 실행을 활성 상태로 간주하는 경우 `terminalProgressStale=true`로 표시합니다.

실시간 기록기를 확인하십시오.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

치명적 종료, 종료 시간 초과 또는 재시작 시 시작 실패 후 가장 최근에 영구 저장된 번들을 확인하십시오.

```bash
openclaw gateway stability --bundle latest
```

가장 최근에 영구 저장된 번들에서 진단 zip을 생성하십시오.

```bash
openclaw gateway stability --bundle latest --export
```

이벤트가 있으면 영구 저장된 번들은 `~/.openclaw/logs/stability/` 아래에 위치합니다.

## 유용한 옵션

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| 플래그                  | 기본값                                                                        | 설명                                                |
| ----------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | 특정 zip 경로(또는 디렉터리)에 기록합니다.          |
| `--log-lines <count>`   | `5000`                                                                        | 포함할 정제된 로그 행의 최대 개수입니다.            |
| `--log-bytes <bytes>`   | `1000000`                                                                     | 검사할 로그의 최대 바이트 수입니다.                 |
| `--url <url>`           | -                                                                             | 상태/상태 확인 스냅샷용 Gateway WebSocket URL입니다. |
| `--token <token>`       | -                                                                             | 상태/상태 확인 스냅샷용 Gateway 토큰입니다.         |
| `--password <password>` | -                                                                             | 상태/상태 확인 스냅샷용 Gateway 비밀번호입니다.     |
| `--timeout <ms>`        | `3000`                                                                        | 상태/상태 확인 스냅샷 제한 시간입니다.              |
| `--no-stability-bundle` | 꺼짐                                                                          | 영구 저장된 안정성 번들 조회를 건너뜁니다.          |
| `--json`                | 꺼짐                                                                          | 기계 판독 가능한 내보내기 메타데이터를 출력합니다.  |

## 진단 비활성화

진단은 기본적으로 활성화됩니다. 안정성 기록기와 진단 이벤트 수집을 비활성화하려면 다음과 같이 설정하십시오.

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

진단을 비활성화하면 버그 보고서의 세부 정보가 줄어들지만 일반적인 Gateway 로깅에는 영향을 주지 않습니다.

심각한 메모리 압박 스냅샷은 기본적으로 비활성화되어 있습니다. 일반 진단 이벤트와 함께 OOM 발생 전 안정성 스냅샷을 수집하려면 다음과 같이 설정하십시오.

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

심각한 메모리 압박이 발생하는 동안 추가 파일 시스템 검사와 스냅샷 기록을 감당할 수 있는 호스트에서만 이 기능을 사용하십시오. 스냅샷이 비활성화되어 있어도 일반 메모리 압박 이벤트는 RSS, 힙, 임계값 및 증가 정보(`rss_threshold`, `heap_threshold`, `rss_growth`)를 계속 기록합니다.

## 관련 문서

- [상태 확인](/ko/gateway/health)
- [Gateway CLI](/ko/cli/gateway#gateway-diagnostics-export)
- [Gateway 프로토콜](/ko/gateway/protocol#rpc-method-families)
- [로깅](/ko/logging)
- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry) - 수집기로 진단을 스트리밍하기 위한 별도의 흐름
