---
read_when:
    - 누가 에이전트나 도구를 실행했는지, 언제 실행했는지, 어떻게 종료되었는지 답할 수 있어야 합니다.
    - 콘텐츠가 없는 수신 또는 발신 메시지 수명 주기 메타데이터가 필요합니다
    - 범위가 제한되고 안전하게 민감 정보를 가릴 수 있는 활동 내보내기가 필요합니다
summary: 메타데이터 전용 실행, 도구 및 메시지 수명 주기 감사 레코드에 대한 CLI 참조 안내서
title: 감사 기록
x-i18n:
    generated_at: "2026-07-12T15:04:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

에이전트 실행, 도구 작업 및 옵트인 메시지 수명 주기 레코드에 대해 Gateway의 메타데이터 전용 감사 원장을 조회합니다.

원장은 실행 및 도구 이벤트에 대해 기본적으로 활성화됩니다. 모든 새 이벤트 기록을 중지하려면
[`audit.enabled: false`](/ko/gateway/configuration-reference#audit)를 설정하고
Gateway를 다시 시작하십시오. 메시지 기록은 별도로 기본 비활성화되어 있습니다.
메시지를 기록하려면 `audit.messages`를 `direct` 또는 `all`로 설정하고 Gateway를
다시 시작하십시오. 기존 기록은 만료될 때까지(30일) 계속 조회할 수 있습니다.

원장은 대화 기록과 별개입니다. ID, 순서, 출처, 작업, 상태 및 정규화된 결과 코드는
기록하지만 콘텐츠는 절대 저장하지 않으며, 메시지 식별자는 설치 로컬 키 기반
가명으로만 표시됩니다. [감사 기록](/ko/gateway/audit)에서 전체 데이터 모델,
개인정보 보호 의미 체계, 저장소/보존 한도 및 적용 범위 제한을 설명하며, 이 페이지에서는
명령 표면을 다룹니다.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## 필터

- `--agent <id>`: 정확한 에이전트 ID
- `--session <key>`: 정확한 세션 키
- `--run <id>`: 정확한 실행 ID
- `--kind <kind>`: `agent_run`, `tool_action` 또는 `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` 또는 `unknown`
- `--direction <direction>`: 메시지 방향으로, `inbound` 또는 `outbound`
- `--channel <channel>`: 정확한 메시지 채널
- `--after <timestamp>` / `--before <timestamp>`: 경계값을 포함하는 ISO 타임스탬프 또는
  Unix 밀리초
- `--limit <count>`: 1부터 500까지의 페이지 크기이며, 기본값은 `100`
- `--cursor <sequence>`: 이전의 최신순 쿼리를 계속 진행
- `--json`: 범위가 제한된 페이지를 JSON으로 출력

CLI는 버전이 지정된 활동 RPC를 조회하므로 하나의 명령으로 구성된 원장 전체를
확인할 수 있습니다. 텍스트 출력에는 시간, 종류, 방향, 채널, 상태, 에이전트,
실행 및 작업이 표시됩니다. 누락된 메시지 출처는 `-`로 렌더링되며, OpenClaw는
에이전트 또는 실행 ID를 임의로 만들지 않습니다. 도구 작업에는 도구 이름도 표시됩니다.
다른 페이지가 있으면 JSON 출력에 `nextCursor`가 포함됩니다. 페이지 조회 중에 도착하는
기록의 순서를 변경하지 않고 계속하려면 해당 값을 `--cursor`에 전달하십시오.

이러한 내보내기에는 메시지 본문과 원시 메시지 ID 필드가 없더라도 민감한 운영
메타데이터가 포함됩니다. 에이전트, 세션 및 실행 ID, 타이밍, 채널, 결과 및 안정적인
HMAC 참조를 통해 활동을 서로 연관 지을 수 있습니다. 다른 운영자 기록과 동일한
액세스 제어 및 보존 관행으로 보호하십시오.

## 기록되는 이벤트

Gateway는 신뢰할 수 있는 수명 주기 스트림을 다음 6개 작업으로 투영합니다.

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

반환되는 모든 기록에는 안정적인 이벤트 ID, 단조롭게 증가하는 원장 시퀀스,
수명 주기 타임스탬프, 행위자, 작업, 상태, `schemaVersion: 1` 마커, 소스 시퀀스 및
`redaction: "metadata_only"`가 있습니다. 에이전트/세션/실행 출처와 이벤트별 필드는
신뢰할 수 있는 소스에서 제공하는 경우에만 포함됩니다. 메시지 기록에서는 의도적으로
`sessionKey`와 `sessionId`를 생략하므로 `--session`은 실행 및 도구 기록만 필터링합니다.

종료된 실행 및 도구 기록은 성공, 실패, 취소, 시간 초과 및 정책 차단을 종결 상태와
오류 코드로 구분합니다. 업스트림 런타임이 권위 있는 종료 결과를 노출하지 않는 경우
`unknown`은 명시적인 비성공 결과입니다. 도구 호출 ID는 안정적인 지문으로만
내보내집니다. 도구 이름은 간결한 모델 대상 이름 계약과 일치해야 하며, 그 외의 값은
`unknown`이 됩니다.

메시지 기록에는 방향, 채널, 대화 종류, 결과와 함께 선택적 전송 종류, 실패 단계,
지속 시간, 결과 수, 정규화된 사유 코드 및 키 기반 계정/대화/메시지/대상 가명이
추가됩니다. 현재 인바운드 경계는 코어 중복 및 종료 처리 결과를 포함하여 코어
디스패치에 도달한 수락된 메시지를 다룹니다. 아웃바운드 경계는 공유 영구 전송에
도달한 원본 논리 응답 페이로드마다 하나의 종료 행을 기록하며, 청킹과 어댑터 팬아웃은
`resultCount`에 집계됩니다. 재시도 가능하거나 결과가 모호하여 대기열에 추가된 전송은
승인, 데드 레터 또는 조정을 통해 결과가 종료 상태가 된 후에만 기록됩니다. 이러한 공유
경계를 우회하는 Plugin 로컬 및 직접 전송 경로는 아직 다루지 않습니다. 행이 없다고
해서 메시지가 존재하지 않았다는 의미는 아닙니다.

감사 원장은 대화 기록, 작업 기록, Cron 실행 기록 또는 로그를 대체하지 않습니다.
대화 콘텐츠를 다른 저장소로 복사하지 않고도 운영자의 질문에 사용할 수 있는 작은
실행 간 인덱스를 제공합니다.

인바운드 행에서 `durationMs`는 코어 디스패치를 측정하고 `resultCount`는 완료된
대기열 도구, 차단 및 응답 페이로드 수를 계산합니다. 아웃바운드 행에서 `durationMs`는
종료 시점까지의 전송 소유권을 포함하므로 대기열 대기 시간도 포함하며, `resultCount`는
식별된 물리적 플랫폼 전송 수를 계산합니다. `deliveryKind`가 있는 경우 훅 이후,
렌더링 이후의 유효 페이로드를 설명합니다. 억제된 행과 충돌로 인해 결과가 모호한
행에서는 이를 생략합니다.

## Gateway RPC

`audit.activity.list`에는 `operator.read`가 필요하며 동일한 필터를 허용합니다.
실행, 도구, 인바운드 메시지 및 아웃바운드 메시지 기록을 포함하는 명명된 V1 활동
이벤트 유니온을 반환합니다.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

결과는 `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`입니다.
결과는 최신순이며 요청당 500개 기록으로 제한됩니다.

출시된 `audit.list` RPC는 이전 실행/도구 클라이언트를 위해 변경되지 않고 유지됩니다.
이전 Gateway에서 `audit.activity.list`를 사용할 수 없는 경우, 요청된 모든 필터가 해당
레거시 메서드에서 지원될 때만 CLI가 `audit.list`로 재시도합니다. 이전 Gateway에서는
`--kind message`, `--direction` 및 `--channel`을 자동으로 무시하지 않고 업그레이드
메시지와 함께 실패합니다.

## 관련 문서

- [감사 기록](/ko/gateway/audit)
- [Gateway 프로토콜](/ko/gateway/protocol#audit-ledger-rpc)
- [세션](/ko/cli/sessions)
- [작업](/ko/cli/tasks)
- [Cron 작업](/ko/automation/cron-jobs)
