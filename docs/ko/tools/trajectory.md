---
read_when:
    - agent가 특정 방식으로 응답했거나 실패했거나 도구를 호출한 이유를 디버깅하기
    - OpenClaw 세션용 지원 번들 내보내기
    - 프롬프트 컨텍스트, 도구 호출, 런타임 오류 또는 usage 메타데이터 조사하기
    - trajectory 캡처 비활성화 또는 위치 변경하기
summary: OpenClaw agent 세션 디버깅용 redact된 trajectory 번들 내보내기
title: Trajectory 번들
x-i18n:
    generated_at: "2026-04-23T14:09:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Trajectory 번들

Trajectory 캡처는 OpenClaw의 세션별 flight recorder입니다. 각 agent 실행에 대해
구조화된 타임라인을 기록한 뒤, `/export-trajectory`가 현재 세션을
redact된 지원 번들로 패키징합니다.

다음과 같은 질문에 답해야 할 때 사용하세요:

- 어떤 프롬프트, 시스템 프롬프트, 도구가 모델에 전송되었는가?
- 어떤 transcript 메시지와 도구 호출이 이 응답으로 이어졌는가?
- 실행이 타임아웃, 중단, Compaction, provider 오류를 겪었는가?
- 어떤 모델, plugin, Skills, 런타임 설정이 활성화되어 있었는가?
- provider가 어떤 usage 및 prompt-cache 메타데이터를 반환했는가?

## 빠른 시작

활성 세션에서 다음을 보내세요:

```text
/export-trajectory
```

별칭:

```text
/trajectory
```

OpenClaw는 workspace 아래에 번들을 기록합니다:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

상대 출력 디렉터리 이름을 선택할 수도 있습니다:

```text
/export-trajectory bug-1234
```

사용자 지정 경로는 `.openclaw/trajectory-exports/` 내부에서 확인됩니다. 절대
경로와 `~` 경로는 거부됩니다.

## 접근

Trajectory export는 owner 명령입니다. 발신자는 일반 명령
권한 검사와 채널 owner 검사를 통과해야 합니다.

## 기록되는 내용

Trajectory 캡처는 OpenClaw agent 실행에서 기본적으로 활성화되어 있습니다.

런타임 이벤트에는 다음이 포함됩니다:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript 이벤트도 활성 세션 브랜치에서 재구성됩니다:

- 사용자 메시지
- assistant 메시지
- 도구 호출
- 도구 결과
- Compaction
- 모델 변경
- 라벨 및 사용자 정의 세션 항목

이벤트는 다음 스키마 마커와 함께 JSON Lines로 기록됩니다:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 번들 파일

내보낸 번들에는 다음이 포함될 수 있습니다:

| 파일                | 내용                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`     | 번들 스키마, 소스 파일, 이벤트 수, 생성된 파일 목록                                            |
| `events.jsonl`      | 순서가 있는 런타임 및 transcript 타임라인                                                      |
| `session-branch.json` | redact된 활성 transcript 브랜치 및 세션 헤더                                                 |
| `metadata.json`     | OpenClaw 버전, OS/런타임, 모델, config 스냅샷, plugin, Skills, 프롬프트 메타데이터            |
| `artifacts.json`    | 최종 상태, 오류, usage, prompt cache, Compaction 수, assistant 텍스트, 도구 메타데이터        |
| `prompts.json`      | 제출된 프롬프트 및 선택된 프롬프트 빌드 세부 사항                                              |
| `system-prompt.txt` | 캡처된 경우 최신 컴파일된 시스템 프롬프트                                                      |
| `tools.json`        | 캡처된 경우 모델에 전송된 도구 정의                                                            |

`manifest.json`은 해당 번들에 포함된 파일을 나열합니다. 세션이
해당 런타임 데이터를 캡처하지 않았다면 일부 파일은 생략됩니다.

## 캡처 위치

기본적으로 런타임 trajectory 이벤트는 세션 파일 옆에 기록됩니다:

```text
<session>.trajectory.jsonl
```

OpenClaw는 세션 옆에 best-effort 포인터 파일도 기록합니다:

```text
<session>.trajectory-path.json
```

전용 디렉터리에 런타임 trajectory sidecar를 저장하려면
`OPENCLAW_TRAJECTORY_DIR`을 설정하세요:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

이 변수가 설정되면 OpenClaw는 해당
디렉터리에 세션 id당 하나의 JSONL 파일을 기록합니다.

## 캡처 비활성화

OpenClaw를 시작하기 전에 `OPENCLAW_TRAJECTORY=0`을 설정하세요:

```bash
export OPENCLAW_TRAJECTORY=0
```

이렇게 하면 런타임 trajectory 캡처가 비활성화됩니다. `/export-trajectory`는 여전히
transcript 브랜치를 export할 수 있지만, 컴파일된 context,
provider 아티팩트, 프롬프트 메타데이터 같은 런타임 전용 파일은 누락될 수 있습니다.

## 개인정보 보호 및 제한

Trajectory 번들은 공개 게시가 아니라 지원 및 디버깅을 위해 설계되었습니다.
OpenClaw는 export 파일을 기록하기 전에 민감한 값을 redact합니다:

- credentials 및 알려진 secret 유사 payload 필드
- 이미지 데이터
- 로컬 state 경로
- `$WORKSPACE_DIR`로 치환된 workspace 경로
- 감지된 경우 홈 디렉터리 경로

exporter는 입력 크기도 제한합니다:

- 런타임 sidecar 파일: 50 MiB
- 세션 파일: 50 MiB
- 런타임 이벤트: 200,000
- 총 export 이벤트: 250,000
- 개별 런타임 이벤트 줄은 256 KiB를 초과하면 잘립니다

팀 외부에 공유하기 전에 번들을 검토하세요. redaction은 best-effort이며
애플리케이션별 모든 secret을 알 수는 없습니다.

## 문제 해결

export에 런타임 이벤트가 없다면:

- OpenClaw가 `OPENCLAW_TRAJECTORY=0` 없이 시작되었는지 확인하세요
- `OPENCLAW_TRAJECTORY_DIR`이 쓰기 가능한 디렉터리를 가리키는지 확인하세요
- 해당 세션에서 메시지를 하나 더 실행한 다음 다시 export하세요
- `manifest.json`에서 `runtimeEventCount`를 확인하세요

명령이 출력 경로를 거부한다면:

- `bug-1234` 같은 상대 이름을 사용하세요
- `/tmp/...` 또는 `~/...`를 전달하지 마세요
- export를 `.openclaw/trajectory-exports/` 내부에 유지하세요

크기 오류로 export가 실패하면 세션 또는 sidecar가
export 안전 제한을 초과한 것입니다. 새 세션을 시작하거나 더 작은 재현 사례를 export하세요.
