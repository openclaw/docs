---
read_when:
    - 에이전트가 특정 방식으로 응답하거나 실패하거나 도구를 호출한 이유 디버깅하기
    - OpenClaw 세션의 지원 번들 내보내기
    - 프롬프트 컨텍스트, 도구 호출, 런타임 오류 또는 사용량 메타데이터 조사하기
    - 궤적 캡처 비활성화
summary: OpenClaw 에이전트 세션 디버깅을 위해 민감 정보가 제거된 궤적 번들 내보내기
title: 트래젝터리 번들
x-i18n:
    generated_at: "2026-07-12T15:51:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory 캡처는 OpenClaw의 세션별 비행 기록 장치입니다. 각 에이전트 실행의
구조화된 타임라인을 기록한 다음, `/export-trajectory`가 현재 세션을 다음 내용을
포함하는 민감 정보가 제거된 지원 번들로 패키징합니다.

- 모델에 전송된 프롬프트, 시스템 프롬프트 및 도구
- 어떤 트랜스크립트 메시지와 도구 호출이 답변으로 이어졌는지
- 실행이 시간 초과되거나, 중단되거나, 압축되거나, 공급자 오류가 발생했는지
- 어떤 모델, plugins, skills 및 런타임 설정이 활성화되었는지
- 공급자가 반환한 사용량 및 프롬프트 캐시 메타데이터

광범위한 Gateway 지원 보고서가 필요한 경우에는 대신
[`/diagnostics`](/ko/gateway/diagnostics#chat-command)로 시작하십시오. 이 명령은
민감 정보가 제거된 Gateway 번들을 수집하며, OpenAI Codex 하네스 세션에서는
승인 후 Codex 피드백을 OpenAI로 전송할 수 있습니다. 세션별 프롬프트, 도구 및
트랜스크립트의 상세 타임라인이 필요할 때 `/export-trajectory`를 사용하십시오.

## 빠른 시작

활성 세션에서 다음을 전송하십시오(별칭: `/trajectory`).

```text
/export-trajectory
```

OpenClaw는 작업 공간 아래에 번들을 기록합니다.

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

이를 재정의하려면 상대 출력 디렉터리 이름을 전달하십시오.

```text
/export-trajectory bug-1234
```

이 이름은 `.openclaw/trajectory-exports/` 내부에서 해석됩니다. 절대 경로와
`~` 경로는 거부됩니다.

Trajectory 번들에는 프롬프트, 모델 메시지, 도구 스키마, 도구 결과, 런타임
이벤트 및 로컬 경로가 포함될 수 있으므로 채팅 명령은 항상 실행 승인을
거칩니다. 번들을 생성하려는 경우 내보내기를 한 번 승인하십시오. 전체 허용은
사용하지 마십시오. 그룹 채팅에서는 OpenClaw가 Trajectory 세부 정보를 공유
방에 다시 게시하지 않고 승인 프롬프트와 내보내기 결과를 소유자에게 비공개로
전송합니다.

로컬 검사 또는 지원 워크플로의 경우 기반 CLI 명령을 직접 실행하십시오.

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

기타 플래그: `--output <path>`(`.openclaw/trajectory-exports` 내부의 디렉터리
이름), `--store <path>`(세션 저장소 재정의), `--agent <id>`(저장소 확인을
위한 에이전트 ID), `--json`(구조화된 출력).

## 액세스

Trajectory 내보내기는 소유자 명령입니다. 발신자는 일반적인 명령 권한 부여
검사와 채널의 소유자 검사를 모두 통과해야 합니다.

## 기록되는 내용

Trajectory 캡처는 OpenClaw 에이전트 실행에 대해 기본적으로 활성화됩니다.

런타임 이벤트에는 다음이 포함됩니다.

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`: 원본 모델, 다음 모델, 실패 이유/세부 정보, 체인 위치 및 체인이 진행되었는지, 성공했는지 또는 소진되었는지를 포함합니다.
- `model.completed`
- `trace.artifacts`
- `session.ended`

트랜스크립트 이벤트는 활성 세션 브랜치에서 재구성됩니다. 여기에는 사용자
메시지, 어시스턴트 메시지, 도구 호출, 도구 결과, Compaction, 모델 변경,
레이블 및 사용자 지정 세션 항목이 포함됩니다.

이벤트는 다음 스키마 마커가 포함된 JSON Lines로 기록됩니다.

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 번들 파일

| 파일                  | 내용                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 번들 스키마, 소스 파일, 이벤트 수 및 생성된 파일 목록                             |
| `events.jsonl`        | 순서가 지정된 런타임 및 트랜스크립트 타임라인                                                        |
| `session-branch.json` | 민감 정보가 제거된 활성 트랜스크립트 브랜치 및 세션 헤더                                           |
| `metadata.json`       | OpenClaw 버전, OS/런타임, 모델, 구성 스냅샷, plugins, skills 및 프롬프트 메타데이터     |
| `artifacts.json`      | 최종 상태, 오류, 사용량, 프롬프트 캐시, Compaction 횟수, 어시스턴트 텍스트 및 도구 메타데이터 |
| `prompts.json`        | 제출된 프롬프트 및 선택된 프롬프트 구성 세부 정보                                         |
| `system-prompt.txt`   | 캡처된 경우 최신 컴파일된 시스템 프롬프트                                                   |
| `tools.json`          | 캡처된 경우 모델에 전송된 도구 정의                                              |

`manifest.json`에는 해당 번들에 존재하는 파일이 나열됩니다. 세션에서 해당
런타임 데이터를 캡처하지 않은 경우 일부 파일은 생략됩니다.

## 캡처 저장소

런타임 Trajectory 이벤트는 에이전트별 SQLite 데이터베이스에 세션과 함께
저장됩니다. Trajectory를 내보내면 민감 정보가 제거된 JSONL 지원 번들이
구체화됩니다. 실시간 런타임 캡처는 세션 옆의 JSONL 사이드카가 아닙니다.

이전 릴리스 또는 명시적인 레거시 파일 내보내기에서 생성된
`.trajectory.jsonl` 및 `.trajectory-path.json` 파일이 여전히 나타날 수
있습니다. 세션 유지 관리는 해당 파일을 정리 대상으로 처리하며, 활성 캡처는
데이터베이스 행을 기록합니다.

## 캡처 비활성화

```bash
export OPENCLAW_TRAJECTORY=0
```

이 설정은 OpenClaw를 시작하기 전에 런타임 Trajectory 캡처를 비활성화합니다.
`/export-trajectory`는 여전히 트랜스크립트 브랜치를 내보낼 수 있지만 컴파일된
컨텍스트, 공급자 아티팩트 및 프롬프트 메타데이터와 같은 런타임 전용 데이터가
누락될 수 있습니다.

## 플러시 시간 초과 조정

OpenClaw는 에이전트 정리 중에 런타임 Trajectory 행을 플러시합니다. 기본 정리
시간 초과는 10,000 ms입니다. 디스크가 느리거나 저장소가 큰 경우 OpenClaw를
시작하기 전에 `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`를 설정하십시오.

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

이 설정은 OpenClaw가 `openclaw-trajectory-flush` 시간 초과를 기록하고 계속
진행하는 시점을 제어합니다. Trajectory 크기 상한은 변경하지 않습니다. 명시적
시간 초과를 전달하지 않는 모든 에이전트 정리 단계를 조정하려면
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`를 설정하십시오.

## 개인정보 보호 및 제한

Trajectory 번들은 지원 및 디버깅용이며 공개 게시용이 아닙니다. OpenClaw는
내보내기 파일을 기록하기 전에 민감한 값을 제거합니다.

- 자격 증명 및 알려진 비밀과 유사한 페이로드 필드
- 이미지 데이터
- 로컬 상태 경로
- `$WORKSPACE_DIR`로 대체된 작업 공간 경로
- 감지된 홈 디렉터리 경로

내보내기 도구는 입력 크기도 제한합니다.

- 런타임 캡처: 실시간 캡처는 10 MiB로 제한되는 롤링 윈도우이며, 새 이벤트를 위한 공간을 확보하기 위해 가장 오래된 이벤트를 삭제합니다. 내보내기는 최대 50 MiB의 기존 레거시 런타임 사이드카 파일을 허용합니다.
- 세션 파일: 50 MiB
- 내보내기당 런타임 이벤트: 200,000
- 내보내는 전체 이벤트: 250,000
- 개별 런타임 이벤트 줄은 256 KiB를 초과하면 잘립니다.

팀 외부에 공유하기 전에 번들을 검토하십시오. 민감 정보 제거는 최선의
노력으로 수행되며 모든 애플리케이션별 비밀을 식별할 수는 없습니다.

## 문제 해결

내보내기에 런타임 이벤트가 없는 경우:

- OpenClaw가 `OPENCLAW_TRAJECTORY=0` 없이 시작되었는지 확인하십시오.
- 세션에서 메시지를 하나 더 실행한 다음 다시 내보내십시오.
- `manifest.json`에서 `runtimeEventCount`를 확인하십시오.

명령이 출력 경로를 거부하는 경우:

- `bug-1234`와 같은 상대 이름을 사용하십시오.
- `/tmp/...` 또는 `~/...`를 전달하지 마십시오.
- 내보내기를 `.openclaw/trajectory-exports/` 내부에 유지하십시오.

크기 오류로 내보내기가 실패하는 경우 세션 또는 사이드카가 위의 내보내기
안전 제한을 초과한 것입니다. 새 세션을 시작하거나 더 작은 재현 사례를
내보내십시오.

## 관련 항목

- [Diff](/ko/tools/diffs)
- [세션 관리](/ko/concepts/session)
- [실행 도구](/ko/tools/exec)
