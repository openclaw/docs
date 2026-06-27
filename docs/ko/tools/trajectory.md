---
read_when:
    - 에이전트가 특정 방식으로 응답하거나 실패했거나 도구를 호출한 이유 디버깅
    - OpenClaw 세션의 지원 번들 내보내기
    - 프롬프트 컨텍스트, 도구 호출, 런타임 오류 또는 사용량 메타데이터 조사
    - 트래젝터리 캡처 비활성화 또는 위치 변경
summary: OpenClaw 에이전트 세션 디버깅을 위해 편집된 trajectory 번들 내보내기
title: 궤적 번들
x-i18n:
    generated_at: "2026-06-27T18:17:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory 캡처는 OpenClaw의 세션별 비행 기록 장치입니다. 각 에이전트 실행의
구조화된 타임라인을 기록한 다음, `/export-trajectory`가 현재 세션을
교정된 지원 번들로 패키징합니다.

다음과 같은 질문에 답해야 할 때 사용하세요.

- 어떤 프롬프트, 시스템 프롬프트, 도구가 모델로 전송되었나요?
- 어떤 트랜스크립트 메시지와 도구 호출이 이 답변으로 이어졌나요?
- 실행이 시간 초과, 중단, compact, 또는 공급자 오류에 도달했나요?
- 어떤 모델, plugins, skills, 런타임 설정이 활성화되어 있었나요?
- 공급자가 어떤 사용량 및 프롬프트 캐시 메타데이터를 반환했나요?

실시간 Gateway 문제에 대한 광범위한 지원 보고서를 제출하는 경우
[`/diagnostics`](/ko/gateway/diagnostics#chat-command)부터 시작하세요. Diagnostics는
정제된 Gateway 번들을 수집하고, OpenAI Codex 하네스 세션의 경우 승인 후
Codex 피드백을 OpenAI 서버로 보낼 수도 있습니다. 세션별 상세 프롬프트, 도구,
트랜스크립트 타임라인이 특별히 필요할 때 `/export-trajectory`를 사용하세요.

## 빠른 시작

활성 세션에서 다음을 보내세요.

```text
/export-trajectory
```

별칭:

```text
/trajectory
```

OpenClaw는 워크스페이스 아래에 번들을 씁니다.

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

상대 출력 디렉터리 이름을 선택할 수 있습니다.

```text
/export-trajectory bug-1234
```

사용자 지정 경로는 `.openclaw/trajectory-exports/` 안에서 해석됩니다. 절대
경로와 `~` 경로는 거부됩니다.

Trajectory 번들에는 프롬프트, 모델 메시지, 도구 스키마, 도구 결과, 런타임 이벤트,
로컬 경로가 포함될 수 있습니다. 따라서 채팅 슬래시 명령은 매번 exec 승인을
거칩니다. 번들을 만들려는 경우 내보내기를 한 번 승인하세요. allow-all은 사용하지
마세요. 그룹 채팅에서는 OpenClaw가 trajectory 세부 정보를 공유 방에 다시 게시하는
대신, 승인 프롬프트와 내보내기 결과를 소유자에게 비공개로 보냅니다.

로컬 검사 또는 지원 워크플로의 경우 승인된 명령 경로를 직접 실행할 수도 있습니다.

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## 액세스

Trajectory 내보내기는 소유자 명령입니다. 보낸 사람은 채널의 일반 명령 권한 검사와
소유자 검사를 통과해야 합니다.

## 기록되는 항목

Trajectory 캡처는 OpenClaw 에이전트 실행에서 기본적으로 켜져 있습니다.

런타임 이벤트에는 다음이 포함됩니다.

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- 소스 모델, 다음 모델, 실패 이유/세부 정보, 체인 위치, fallback이 진행되었는지, 성공했는지, 또는 체인을 소진했는지를 포함한 `model.fallback_step`
- `model.completed`
- `trace.artifacts`
- `session.ended`

트랜스크립트 이벤트도 활성 세션 브랜치에서 재구성됩니다.

- 사용자 메시지
- 어시스턴트 메시지
- 도구 호출
- 도구 결과
- compactions
- 모델 변경
- 레이블 및 사용자 지정 세션 항목

이벤트는 다음 스키마 마커가 있는 JSON Lines로 작성됩니다.

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 번들 파일

내보낸 번들에는 다음이 포함될 수 있습니다.

| 파일                  | 내용                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 번들 스키마, 소스 파일, 이벤트 수, 생성된 파일 목록                             |
| `events.jsonl`        | 정렬된 런타임 및 트랜스크립트 타임라인                                                        |
| `session-branch.json` | 교정된 활성 트랜스크립트 브랜치와 세션 헤더                                           |
| `metadata.json`       | OpenClaw 버전, OS/런타임, 모델, 구성 스냅샷, plugins, skills, 프롬프트 메타데이터     |
| `artifacts.json`      | 최종 상태, 오류, 사용량, 프롬프트 캐시, compaction 수, 어시스턴트 텍스트, 도구 메타데이터 |
| `prompts.json`        | 제출된 프롬프트와 선택된 프롬프트 빌드 세부 정보                                         |
| `system-prompt.txt`   | 캡처된 경우 최신 컴파일된 시스템 프롬프트                                                   |
| `tools.json`          | 캡처된 경우 모델로 전송된 도구 정의                                              |

`manifest.json`은 해당 번들에 있는 파일을 나열합니다. 세션이 해당 런타임 데이터를
캡처하지 않은 경우 일부 파일은 생략됩니다.

## 캡처 위치

기본적으로 런타임 trajectory 이벤트는 세션 파일 옆에 작성됩니다.

```text
<session>.trajectory.jsonl
```

OpenClaw는 세션 옆에 최선 노력 방식의 포인터 파일도 씁니다.

```text
<session>.trajectory-path.json
```

전용 디렉터리에 런타임 trajectory 사이드카를 저장하려면
`OPENCLAW_TRAJECTORY_DIR`를 설정하세요.

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

이 변수가 설정되면 OpenClaw는 해당 디렉터리에 세션 ID당 하나의 JSONL 파일을 씁니다.

세션 유지 관리는 소유 세션 항목이 세션 디스크 예산에 의해 정리, 제한, 또는 축출될
때 trajectory 사이드카를 제거합니다. 세션 디렉터리 밖의 런타임 파일은 포인터
대상이 여전히 해당 세션에 속함을 증명하는 경우에만 제거됩니다.

## 캡처 비활성화

OpenClaw를 시작하기 전에 `OPENCLAW_TRAJECTORY=0`을 설정하세요.

```bash
export OPENCLAW_TRAJECTORY=0
```

이렇게 하면 런타임 trajectory 캡처가 비활성화됩니다. `/export-trajectory`는 여전히
트랜스크립트 브랜치를 내보낼 수 있지만, 컴파일된 컨텍스트, 공급자 아티팩트,
프롬프트 메타데이터 같은 런타임 전용 파일이 누락될 수 있습니다.

## flush 시간 초과 조정

OpenClaw는 에이전트 정리 중 런타임 trajectory 사이드카를 flush합니다. 기본 정리
시간 초과는 10,000 ms입니다. 느린 디스크 또는 큰 저장소에서는 OpenClaw를 시작하기
전에 `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`를 설정하세요.

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

이는 OpenClaw가 `openclaw-trajectory-flush` 시간 초과를 기록하고 계속 진행하는
시점을 제어합니다. trajectory 크기 한도는 변경하지 않습니다. 명시적 시간 초과를
전달하지 않는 모든 에이전트 정리 단계를 조정하려면
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`를 설정하세요.

## 개인정보 보호 및 제한

Trajectory 번들은 지원과 디버깅을 위해 설계되었으며, 공개 게시용이 아닙니다.
OpenClaw는 내보내기 파일을 쓰기 전에 민감한 값을 교정합니다.

- 자격 증명 및 알려진 비밀과 유사한 페이로드 필드
- 이미지 데이터
- 로컬 상태 경로
- `$WORKSPACE_DIR`로 대체된 워크스페이스 경로
- 감지된 경우 홈 디렉터리 경로

내보내기 도구는 입력 크기도 제한합니다.

- 런타임 사이드카 파일: 실시간 캡처는 10 MiB에서 중지되고 공간이 남아 있으면 잘림 이벤트를 기록합니다. 내보내기는 기존 런타임 사이드카를 최대 50 MiB까지 허용합니다
- 세션 파일: 50 MiB
- 런타임 이벤트: 200,000
- 내보낸 총 이벤트: 250,000
- 개별 런타임 이벤트 줄은 256 KiB를 초과하면 잘립니다

팀 외부에 공유하기 전에 번들을 검토하세요. 교정은 최선 노력 방식이며 모든
애플리케이션별 비밀을 알 수는 없습니다.

## 문제 해결

내보내기에 런타임 이벤트가 없는 경우:

- OpenClaw가 `OPENCLAW_TRAJECTORY=0` 없이 시작되었는지 확인하세요
- `OPENCLAW_TRAJECTORY_DIR`가 쓰기 가능한 디렉터리를 가리키는지 확인하세요
- 세션에서 다른 메시지를 실행한 다음 다시 내보내세요
- `manifest.json`에서 `runtimeEventCount`를 확인하세요

명령이 출력 경로를 거부하는 경우:

- `bug-1234` 같은 상대 이름을 사용하세요
- `/tmp/...` 또는 `~/...`를 전달하지 마세요
- 내보내기를 `.openclaw/trajectory-exports/` 안에 유지하세요

내보내기가 크기 오류로 실패하면 세션 또는 사이드카가 내보내기 안전 한도를
초과한 것입니다. 새 세션을 시작하거나 더 작은 재현을 내보내세요.

## 관련 항목

- [Diffs](/ko/tools/diffs)
- [세션 관리](/ko/concepts/session)
- [Exec 도구](/ko/tools/exec)
