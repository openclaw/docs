---
read_when:
    - exec 또는 Plugin 승인 수명 주기, 스토리지, 프로토콜 또는 권한 부여 변경
    - 채널에 승인 링크 또는 네이티브 승인 컨트롤 추가하기
    - 하위 세션 승인을 상위 또는 오케스트레이터 보기에 반영하기
summary: Control UI, 네이티브 앱, 채널 및 상위 세션 전반에서 지속 가능하고 딥 링크를 지원하는 승인 설계
title: 다중 화면 운영자 승인
x-i18n:
    generated_at: "2026-07-16T13:01:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# 다중 화면 운영자 승인

이 설계는 [#103505](https://github.com/openclaw/openclaw/issues/103505)를 추적합니다. 프로세스 로컬 승인 권한을 Gateway가 소유하고 SQLite로 지원되는 단일 수명 주기로 대체합니다. Gateway가 소유하는 모든 실행 또는 Plugin/도구 승인에는 하나의 안정적인 ID, 하나의 인증된 Control UI 경로, 원자적인 선착순 응답 확정 방식, 그리고 소스 및 상위 세션 스트림에 대한 운영자 전용 프로젝션이 제공됩니다.

인라인 작업과 딥 링크가 공존합니다. 승인 모드 전환 기능은 없습니다.

## 목표

- 실행 및 Plugin/도구 게이트를 위한 하나의 영구 승인 객체.
- 안정적인 `${controlUiBasePath}/approve/{approvalId}` 경로.
- 승인된 모든 Control UI, 네이티브 앱 또는 채널 화면에서 결정 가능.
- 동시 화면 간에 원자적인 선착순 응답 확정 동작.
- 동일한 재시도는 멱등성을 보장하며, 충돌하는 후발 응답은 확정된 응답을 덮어쓸 수 없음.
- 시간 초과, 잘못된 신뢰 판정, 누락된 경로, 취소 및 재시작 시 닫힘 실패 방식 적용.
- 요청 및 종료 이벤트가 소스 세션과 관련된 모든 상위/오케스트레이터 소유자에게 전달됨.
- 채널은 형식화된 승인 및 탐색 작업을 수신하며, 전송 콜백 데이터는 채널 내부에 유지됨.
- 기존 실행/Plugin Gateway 메서드는 구현이 하나의 서비스로 통합되는 동안 호환성을 유지함.

## 목표가 아닌 항목

- 차단된 도구 실행 자체를 Gateway 재시작 후에도 유지하거나 재개하는 것.
- 승인 ID 또는 URL을 전달자 자격 증명으로 만드는 것.
- 모델에 표시되는 트랜스크립트에 승인 프롬프트를 추가하거나 상위 에이전트를 깨우는 것.
- 승인 정책, 제품 명령 또는 검토자 권한 부여를 채널 Plugin으로 이동하는 것.
- 채널, 기기 또는 상위 항목별로 승인 상태를 복제하는 것.
- 종료 결과를 명확하게 만드는 데 필요한 경우를 제외하고 실행 허용 목록, Plugin 정책 구성 또는 `allow-always` 지속성을 재설계하는 것.
- Gateway가 없는 임베디드 TUI를 첫 번째 증분에서 원격으로 접근 가능하게 만드는 것. 이 TUI는 로컬 전용으로 유지되며 검토자가 없으면 닫힘 실패 방식으로 처리해야 합니다.

## 출시 전 기준선 및 증거 맵

이 표는 #103505가 개설되었을 당시의 구현 상태를 기록합니다. 아래 출시 섹션에서는 해당 기준선 위에 구축된 영구 레지스트리, 형식화된 작업, 딥 링크 페이지 및 네이티브 클라이언트 증분을 추적합니다.

| 화면           | 기준선 진입점 및 소유자                                                                                                                                  | 기준선 동작 및 격차                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 에이전트 실행        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | 2단계 `exec.approval.*` 등록은 초기 `/approve` 경합을 방지하지만, 시간 초과가 여전히 `askFallback`을 통해 허용으로 바뀔 수 있습니다.                                                        |
| Plugin 도구 게이트  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | `plugin.approval.*`을 요청하며, `timeoutBehavior: "allow"`가 시간 초과된 게이트를 승인할 수 있습니다. 임베디드 모드는 `src/infra/embedded-plugin-approval-broker.ts`에 별도의 프로세스 로컬 권한을 보유합니다. |
| Plugin Node 게이트  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Plugin 관리자를 통해 직접 생성하고 브로드캐스트하여 서버 메서드 수명 주기의 일부를 중복 구현합니다.                                                                                 |
| Gateway 권한 | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | 별도의 실행 및 Plugin 관리자가 프로세스 로컬 맵을 사용합니다. 종료 항목은 15초 동안 유지됩니다. 선착순 응답 확정은 단일 프로세스 내에서만 적용됩니다.                                          |
| Gateway 프로토콜  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | 실행에는 보류 중 항목만 지원하는 `get`이 있으며, Plugin에는 `get`이 없습니다. 딥 링크를 위한 종류 독립적인 종료 조회도 없습니다.                                                                                   |
| 전달          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | 출처 라우팅, 승인자 DM, 보류 항목 재생, 네이티브 핸들러 및 프로세스 내 종료 정리를 지원합니다. 별도의 후속 작업에서 영구 종료 조정을 추가합니다.                          |
| 이식 가능한 작업  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | 승인 버튼은 `/approve ...`을 포함하는 명령 작업입니다. URL 및 Web App 대상은 형식이 지정되지 않은 버튼 필드입니다.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | 렌더러는 비공개 콜백 데이터를 생성하기 전에 명령 텍스트를 구문 분석하여 승인 의미 체계를 인식합니다.                                                                                     |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | 승인 UI는 전역 모달입니다. `ui/src/app-route-paths.ts` 및 `ui/src/app-routes.ts`은 정확한 경로를 사용하며 알 수 없는 경로를 Chat으로 다시 작성합니다.                                                    |
| 세션 소유권 | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | 컨트롤러, 요청자, 명시적 상위 항목 및 레거시 생성 소유권이 존재하지만, 승인 이벤트는 해당 세션 스트림에 프로젝션되지 않습니다.                                                    |
| 공유 상태      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | 기존 즉시 트랜잭션과 Kysely 조건부 업데이트는 `state/openclaw.sqlite`에서 영구적인 비교 후 설정을 지원합니다.                                                                   |

대표적인 현재 테스트로는 `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` 및 `ui/src/e2e/approval-flow.e2e.test.ts`이 있습니다.

Plugin SDK는 계속해서 유일한 채널/Plugin 경계로 유지됩니다. 승인 런타임 및 프레젠테이션 변경 사항은 기존 `src/plugin-sdk/approval-*.ts` 및 `src/plugin-sdk/interactive-runtime.ts` 하위 경로를 통해 내보내야 하며, Plugin 프로덕션 코드는 Gateway 내부를 가져오면 안 됩니다.

## 선행 사례

Omnigent는 유용한 UX 및 실패 의미 체계를 제공합니다.

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py)는 ASK를 대기시키고 정책별 시간 초과를 적용하며 정확히 수락된 경우만 승인으로 처리합니다.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py)에는 서버 측 네이티브 하네스 게이트와 상위 요청/결정 프로젝션이 포함되어 있습니다.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx)는 독립형 모바일 승인 페이지를 제공합니다.

스토리지에 관한 주장을 무비판적으로 복제하지 마십시오. 현재 활성 보류 상태는 [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py)에서 프로세스 로컬이며, 사용되지 않는 보류 테이블은 [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py)에 의해 제거됩니다. OpenClaw는 의도적으로 더 나아갑니다. SQLite가 권위 있는 원본이며 모든 종료 전환은 데이터베이스 비교 후 설정으로 수행됩니다.

## 아키텍처 및 소유권

Gateway가 수명 주기를 소유합니다.

1. 에이전트, Plugin 후크 또는 Node 정책이 종류별 요청과 프로세스 로컬 실행 바인딩을 제공합니다.
2. Gateway가 이를 검증하고 정제된 검토자 프로젝션을 구성합니다.
3. 승인 서비스가 소스/소유자 대상 그룹을 계산하고 표준 행을 삽입한 다음 프로세스 내 대기자를 등록합니다.
4. 영구 삽입 후 Gateway는 기존 승인 이벤트, 세션 프로젝션, 채널 알림 및 네이티브 푸시를 게시합니다.
5. 모든 화면은 동일한 서비스를 통해 결정합니다.
6. 서비스는 하나의 종료 전환을 커밋하고 런타임 대기자를 깨운 다음 종료 프로젝션을 게시합니다.
7. 이벤트 전달 실패는 커밋된 결정을 롤백하지 않습니다. 클라이언트는 `approval.get` 또는 목록 재생을 통해 복구합니다.

소유권 경계:

- `src/gateway/`: 승인 서비스, 권한 부여, RPC 어댑터, URL 구성, 대기자 수명 주기 및 이벤트 게시.
- `src/state/`: 공유 스키마 및 생성된 Kysely 형식.
- `src/infra/`: 정제된 승인 뷰 모델 및 이식 가능한 프레젠테이션 구성.
- `src/agents/`: 반환된 판정을 요청하고 기다린 후 적용하며, 지속성은 담당하지 않음.
- `src/channels/` 및 `extensions/*`: 형식화된 작업 렌더링, 채널 사용자 권한 부여, 비공개 콜백 인코딩 및 전달된 컨트롤 업데이트.
- `src/plugin-sdk/`: 공개 승인 및 프레젠테이션 계약만 포함.
- `ui/`: 독립형 페이지 및 기존 큐/모달 클라이언트.

프로세스 내 대기자는 권한이 아니라 알림 메커니즘입니다. 등록 시 요청을 게시하기 전에 행을 삽입하고 대기자를 동기적으로 설치하므로, 결정자가 이 단계들 사이에 끼어들 수 없습니다. 이후의 모든 결정자는 해당 대기자를 완료하기 전에 SQLite를 통해 커밋합니다.

## 영구 레코드

공유 상태 데이터베이스에 하나의 `operator_approvals` 테이블을 추가합니다.

| 열                                             | 목적                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | 전역적으로 고유한 정식 ID입니다. 프로토콜 호환성을 위해 기존 exec ID와 `plugin:` ID를 유지하되, 접두사로 종류를 추론해서는 안 됩니다.      |
| `resolution_ref`                                   | 정식 ID를 전달할 수 없는 전송 콜백을 위한 고유한 전체 SHA-256 base64url 로케이터입니다. 이는 권한 부여 정보나 공개 URL ID가 아닙니다. |
| `kind`                                             | 닫힌 `exec \| plugin` 판별자입니다.                                                                                                        |
| `status`                                           | 닫힌 `pending \| allowed \| denied \| expired \| cancelled` 상태입니다.                                                                          |
| `presentation_json`                                | 검증되고 종류 태그가 지정된 검토자 프로젝션입니다. 원시 런타임 요청, 명령 바인딩 및 콜백 페이로드는 프로세스 로컬로 유지됩니다.               |
| `source_agent_id`, `source_session_key`            | 소스 ID 및 세션 프로젝션 앵커입니다. 세션 키는 영속적이지만 순환되는 세션 UUID는 그렇지 않습니다.                                          |
| `audience_session_keys_json`                       | 제한된 너비 우선 소유권 순회로 생성된 순서가 지정되고 중복이 제거된 JSON 배열입니다. 요청 이벤트와 종료 이벤트는 동일한 스냅샷을 사용합니다. |
| `requested_by_device_id`, `requested_by_client_id` | 영속적인 요청자/감사 메타데이터입니다. 연결 ID는 메모리에 유지되며 여러 표면에 걸친 주체가 아닙니다.                                         |
| `reviewer_device_ids_json`                         | 신뢰할 수 있는 승인 런타임에서만 제공하는 선택적이고 명시적으로 지정된 검토자 기기입니다.                                                  |
| `runtime_epoch`                                    | 보류된 실행을 소유하는 프로세스 에포크이며, 재시작 후 고아 행을 취소하는 데 사용됩니다.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | 권위 있는 타이밍 정보입니다.                                                                                                                         |
| `decision`                                         | 존재하는 경우 명시적인 사용자 결정입니다.                                                                                                       |
| `terminal_reason`                                  | `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` 또는 `gateway-restart`과 같은 닫힌 사유입니다.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | 서버 측에 보존되는 승자 및 감사 ID입니다. 검토자 프로젝션에서는 원시 해결자 식별자를 생략합니다.                                           |
| `consumed_at_ms`, `consumed_by`                    | `allow-once`에 대한 별도의 재생 방지 장치이며, 소비 시 기록된 결정을 삭제해서는 안 됩니다.                                                       |

필수 인덱스:

| 인덱스                                      | 목적                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| unique `(resolution_ref)`                  | 삽입 중 열 간 `approval_id`/`resolution_ref` 모호성을 거부합니다. |
| `(status, expires_at_ms)`                  | 대기 중인 승인을 찾고 권위 있는 기한을 조정합니다.               |
| `(source_session_key, created_at_ms DESC)` | 하나의 소스 세션에 대한 최근 승인을 재생합니다.                             |
| `(resolved_at_ms)`                         | 고정된 보존 정책에 따라 보존된 종료 승인을 정리합니다.  |

대상 배열은 작고 크기가 제한됩니다. 세션 필터링 재생은 먼저 Kysely를 통해 표시 가능한 대기 행을 선택한 다음, 애플리케이션 코드에서 크기가 제한된 대상 배열을 디코딩하고 필터링합니다. 문자열 일치나 원시 SQL JSON 쿼리는 사용하지 않습니다.

종료 행은 `src/audit/audit-event-store.ts`의 메타데이터 감사 보존 기간에 맞춰 30일 동안 보존합니다. 정리는 새로운 구성 표면이 아니라 고정된 유지관리 정책입니다. 데이터베이스는 비공개 로컬 제어 영역 상태이지만, 검토자 API는 저장된 전체 요청이나 런타임 바인딩을 절대로 노출해서는 안 됩니다.

## 상태 머신 및 비교 후 설정

다음 전이만 유효합니다:

- `pending -> allowed`: 명시적인 `allow-once` 또는 `allow-always`입니다.
- `pending -> denied`: 명시적 거부, 신뢰할 수 있는 잘못된 형식의 종료 판정 또는 전달 경로 없음입니다.
- `pending -> expired`: 권위 있는 기한에 도달했습니다.
- `pending -> cancelled`: 실행 중단, 정상 종료 또는 재시작 시 고아 복구입니다.

허용되지 않은 모든 종료 상태의 실질적인 판정은 거부입니다.

해결에는 하나의 즉시 SQLite 트랜잭션과 다음에 해당하는 Kysely 조건부 업데이트를 사용합니다:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

업데이트된 행이 없으면 동일한 트랜잭션에서 레코드를 읽습니다:

- 누락되었거나 권한이 없음: 찾을 수 없음을 반환하며, 존재 여부를 노출하지 않습니다.
- 아직 대기 중이지만 기한에 도달함: 비교 후 설정으로 `expired` 상태로 전환한 다음 해당 종료 행을 반환합니다.
- 동일하게 기록된 결정: 기록된 승자와 함께 멱등 성공을 반환합니다.
- 다른 결정: 통합 API는 기록된 승자와 함께 `applied: false`을 반환하며, 레거시 어댑터는 출시된 계약에서 요구하는 경우 `APPROVAL_ALREADY_RESOLVED`을 유지합니다.
- 모든 종료 상태: 절대로 변경하지 않습니다.

`now == expires_at_ms`은 만료되었습니다. Gateway 시간이 권위 있는 기준입니다.

`allow-once` 실행은 기존의 정확한 명령/시스템 실행 컨텍스트에 바인딩된 `consumed_at_ms IS NULL`에 두 번째 CAS를 사용합니다. 승인 행은 소비된 후에도 감사 레코드로 유지됩니다.

인증할 수 없거나 승인을 식별할 수 없는 잘못된 형식의 HTTP/RPC 입력은 변경 없이 거부되며 절대로 승인할 수 없습니다. 알려진 승인에 대해 신뢰할 수 있는 하네스/대기자로부터 잘못된 형식의 종료 판정을 받으면 `denied` 상태로 전환됩니다.

## Gateway API

종류에 구애받지 않는 검토자 메서드를 추가합니다:

| 메서드                                    | 계약                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | 표시 가능한 대기 또는 보존된 종료 프로젝션을 반환합니다.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | 정식 ID 또는 고정 크기 전송 참조를 받은 다음 권한 부여, 종류 및 허용된 결정 검증, 기한 조정, 종료 CAS를 실행합니다. 응답에는 항상 정식 ID가 포함됩니다. |

CAS가 성공하면 커밋된 프로젝션을 즉시 반환합니다. 레거시 이벤트, 채널 전달자 및 푸시 종료 처리기는 최선형 후속 작업이며, 느리거나 실패한 표면이 승리 응답을 지연하거나 롤백해서는 안 됩니다.

종류별 요청 검증은 `exec.approval.request` 및 `plugin.approval.request`에 유지됩니다. 기존 `exec.approval.get/list/waitDecision/resolve` 및 `plugin.approval.list/waitDecision/resolve`은 출시된 Gateway API이므로 정식 서비스에 대한 프로토콜 경계 어댑터가 됩니다. 내부 호출자는 동일한 변경에서 서비스로 마이그레이션합니다.

검토자 프로젝션은 태그가 지정된 유니온입니다:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* 안전한 exec 미리보기 */ }
    | { kind: "plugin"; title: string; description: string /* 안전한 plugin 미리보기 */ };
  // 공통 수명 주기 필드
};
```

안정적인 경로는 영속화하지 않고 파생합니다. `approval.get`은 `urlPath`을 반환하며, 승인된 공개 출처를 아는 표면은 절대 `url`도 받을 수 있습니다. 검토자 스냅샷에서는 소스 및 대상 세션 키를 생략합니다. Gateway는 별도의 `session.approval` 프로젝션을 위해 해당 라우팅 키를 서버 측에 유지합니다.

## 이벤트 및 이식 가능한 작업

PR 1은 출시된 이벤트 이름, 페이로드 및 기존 레코드 수준 수신자 필터를 유지합니다:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

해당 레거시 이벤트에는 전체 런타임 요청이 포함될 수 있으므로 모든 승인 범위 클라이언트에 팬아웃해서는 안 됩니다. PR 5는 레거시 이벤트 전달을 확장하는 대신 정제된 수명 주기 프로젝션을 통해 태그가 지정된 수명 주기 필드(`status`, `sourceSessionKey`, `urlPath`, 종료 메타데이터 및 프레젠테이션 수준의 `kind`)를 추가합니다.

승인 범위의 `session.approval` 프로젝션 이벤트를 추가합니다. 영속화된 대상 키로 정식 이벤트를 한 번 게시하며, 정확한 세션 구독자는 일치하는 각 키에 대해 동일한 이벤트를 수신합니다:

- `sessionKey`: 프로젝션을 수신하는 스트림입니다.
- `sourceSessionKey`: 게이트를 발생시킨 하위/소스입니다.
- `phase`: 승인 상태와 구별되는 `pending \| terminal`입니다.
- 하나의 안전한 `OperatorApproval` 프로젝션입니다.

클라이언트는 `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`을 사용하여 옵트인합니다. 성공 응답에는 구독 클라이언트가 검토할 레코드 권한도 있는 해당 정확한 스트림 키의 현재 대기 승인 최대 1,000개가 포함된 `approvalReplay`이 추가됩니다. `truncated: false`은 필터링된 재생을 권위 있는 기준으로 만들며 재연결 클라이언트는 로컬 대기 집합을 해당 값으로 교체합니다. `truncated: true`은 과부하 신호이며, 클라이언트는 정식 조회 또는 이후 수명 주기 이벤트로 확정될 때까지 아직 확인되지 않은 로컬 항목을 유지해야 합니다. 재생 중 나중에 발견된 영속적인 시간 초과는 새 스냅샷을 반환하기 전에 구독하고 레코드 권한이 있는 대상에만 종료 툼스톤을 내보냅니다. `operator.admin`은 직접 옵트인할 수 있으며, 범위가 더 좁은 클라이언트에는 페어링된 기기 ID와 `operator.approvals`이 모두 필요합니다. 세션 구독만으로는 승인 표시 권한이 부여되지 않습니다.

`src/gateway/server-broadcast.ts`에서 `operator.approvals` 아래에 이벤트를 등록합니다. 프로젝션은 관찰용이며, 트랜스크립트 행을 추가하거나 `sessions.changed`을 내보내거나 에이전트를 깨우지 않습니다.

`src/interactive/payload.ts`의 `MessagePresentationAction`을 확장합니다:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Core는 승인된 절대 Control UI 출처를 사용할 수 있을 때 형식이 지정된 결정 작업과 별도의 검토 링크를 생성합니다. 채널은 승인 작업을 자체 콜백 형식으로 인코딩하고 해결 결과를 정식 서비스로 전송합니다. 콜백은 정식 ID가 형식에 맞으면 정확한 정식 ID를 사용하고, 그렇지 않으면 행의 고유한 전체 다이제스트 `resolution_ref`을 사용합니다. 이 참조는 간결한 조회 키일 뿐입니다. 일반 Gateway 인증, 레코드 권한 부여, 명시적 종류, 허용된 결정 검증, 기한 조정 및 최초 응답 CAS는 계속 적용됩니다. 채널은 ID를 잘라내거나, 해시 접두사를 해석하거나, `/approve` 텍스트를 파싱하거나, ID 접두사에서 종류를 추론해서는 안 됩니다.

`button.url`, `button.webApp` 및 명령 기반 승인 컨트롤은 사용 중단된 Plugin SDK 호환성 입력으로 유지하십시오. SDK 경계에서 이를 정규화하고 동일한 PR에서 번들로 제공되는 모든 내부 호출자를 마이그레이션하십시오. `/approve {id} {decision}`은 버튼의 의미 체계 계약이 아니라 텍스트 대체 수단 및 CLI/채팅 명령으로 유지됩니다.

## Control UI

경로는 `${basePath}/approve/{approvalId}`입니다. ID가 유일한 경로 매개변수이며, 소스 세션 ID는 레코드에서 가져옵니다.

현재 라우터에는 정확한 정적 경로가 있으며 알 수 없는 경로를 채팅으로 다시 작성하므로, 일반 경로 정규화 전에 `ui/src/app/bootstrap.ts`에서 이 딥 링크를 감지하십시오. 일반 Gateway/인증 설정을 재사용하되, 사이드바 셸과 전역 모달 외부에 독립 실행형 승인 페이지를 렌더링하십시오.

문서는 해당 URL을 제공한 Gateway가 소유합니다. 초기 연결은 전체 앱에 영구 저장된 원격 Gateway 선택을 무시하되 해당 선택의 설정을 변경하거나 복사하지 않습니다. 인증만 서비스를 제공하는 Gateway의 세션 범위로 유지됩니다. 신뢰할 수 있는 네이티브 인증 또는 별도로 확인된 `gatewayUrl` 재정의가 대상을 변경할 수 있습니다. Core는 Plugin HTTP 경로 및 정적 확장 감지보다 먼저 단일 세그먼트 `/approve` 네임스페이스를 예약하며, 여기에는 `.json` 또는 `.js`로 끝나는 ID도 포함됩니다. Control UI 제공이 비활성화되면 예약된 경로는 `404`으로 실패 시 차단됩니다. 지연 로드 청크 실패로 인해 보안 결정이 로딩 표시기에 갇히지 않도록 페이지를 기본 Control UI 번들에 유지하십시오.

페이지 상태:

- 로드 중
- 인증 필요
- 대기 중
- 해결 중
- 여기에서 승인 또는 거부됨
- 다른 위치에서 해결됨
- 만료됨
- 취소됨
- 금지됨/찾을 수 없음
- 재시도할 수 있는 연결 오류

페이지는 두 번째 비인증 REST API가 아니라 Gateway RPC를 호출합니다. 브라우저을 새로 고치면 영구 상태를 다시 읽습니다. Gateway 자격 증명을 URL, 쿼리 또는 프래그먼트에 배치하지 않습니다.

## 권한 부여 및 개인정보 보호

URL은 위치 지정자이지 권한이 아닙니다. 해결에는 다음이 필요합니다.

1. 인증된 Gateway 연결
2. `operator.approvals` 또는 `operator.admin`
3. 레코드 수준 검토자 권한 부여

레코드 수준 규칙:

- `operator.admin`은 검토할 수 있습니다.
- `reviewer_device_ids`이 있으면 이를 기준으로 합니다. 목록에 있는 페어링된
  `operator.approvals` 장치만 검토할 수 있으며, 요청 장치도 목록에 있지 않으면
  암시적 접근 권한이 없습니다.
- 명시적인 검토자 목록이 없으면 요청한 페어링
  `operator.approvals` 장치가 자체 레코드를 검토할 수 있습니다.
- 요청자 또는 검토자 바인딩이 전혀 없는 실제 레거시 레코드는
  업그레이드로 인해 이미 대기 중인 작업이 고립되지 않도록 광범위한 페어링 장치 가시성을 유지합니다.
- 장치가 없는 내부 런타임은 범위가 지정된
  승인 런타임 연결을 통해 읽을 수는 없지만 해결할 수는 있습니다. 해당 권한은
  서버가 인증한 런타임 토큰에서만 제공되며, 공개 `approval.resolve` 필드로는
  이를 발급할 수 없습니다.
- 실시간 요청자 연결 소유권은 레거시 어댑터에서 계속 유효하며,
  일치하는 클라이언트 이름에서 추론되지 않습니다.
- 대상 그룹 구성원 자격은 표시만 변경합니다. 권한 부여 범위를 절대 확대하지 않습니다.

`approval.get`은 정제된 검토자 프로젝션만 노출하며 내부 소스/대상 그룹 라우팅 키를 생략합니다. PR 5 `session.approval` 이벤트는 Gateway가 서버 측에서 영구 저장된 대상 그룹 스냅샷을 적용한 후 단일 대상 `sessionKey`과 `sourceSessionKey`을 전달합니다. 기존 exec/Plugin 이벤트는 소비자가 마이그레이션할 때까지 이전 페이로드와 제한된 수신자를 유지합니다. 실행 가능 요청, 명령 바인딩 및 연속 작업은 프로세스 로컬 대기자에만 유지됩니다. 영구 행에는 안전한 표시 정보와 수명 주기, 라우팅 및 감사 메타데이터가 포함되며 원시 환경 값, 자격 증명, 인증 헤더 또는 채널 콜백 데이터는 절대 저장되지 않습니다.

## 대상 그룹 프로젝션

삽입 전에 대상 그룹을 한 번 계산하고 순서가 지정된 스냅샷을 영구 저장하십시오. 소유권은 항상 단일 상위 체인이 아니라 그래프입니다. 하위 항목에는 현재 컨트롤러와 원래 요청자가 모두 있을 수 있으며, 이러한 소유자는 서로 다른 루트로 이어질 수 있습니다.

결정론적 너비 우선 순회를 사용하십시오.

1. 소스 세션 키로 큐를 초기화합니다.
2. 대기열에서 키를 꺼낼 때마다 최신 하위 에이전트 레지스트리 행을 읽고, 고정된 순서인 `controllerSessionKey`, 그다음 `requesterSessionKey`으로 서로 다른 두 소유권 에지를 큐에 추가합니다.
3. 사용 가능한 레지스트리 행이 있으면 조정 후 오래되었을 수 있는 세션 항목 계보를 추가로 따르지 않습니다. 그렇지 않으면 단일 현재 대체 에지 `parentSessionKey ?? spawnedBy`을 큐에 추가합니다.
4. 큐에 추가할 때 정규화하고 중복을 제거하여 처음 발견된 최단 경로가 선택되도록 합니다.
5. 고유 키 64개에서 중지합니다. 이 대상 그룹 크기 상한은 순회 깊이도 제한합니다.

레지스트리 소스는 `src/agents/subagent-registry-read.ts`이며, 소유권 필드는 `src/agents/subagent-registry.types.ts`에 정의되어 있습니다. 세션 대체 필드는 `src/config/sessions/types.ts`에 정의되어 있습니다.

요청 및 최종 프로젝션은 승인이 대기 중인 동안 포커스/컨트롤러 소유권이 변경되더라도 영구 저장된 동일한 대상 그룹을 사용합니다. 이를 통해 요청 프로젝션을 수신한 모든 대상 그룹 세션 스트림에 최종 정리가 보장됩니다. 해결은 항상 소스 승인 ID를 대상으로 하며, 대상 그룹 세션은 복제된 승인 상태를 절대 수신하지 않습니다. 전달된 채널 메시지 정리는 아래의 별도 전달 위치 지정자 후속 작업으로 유지됩니다.

승인만을 위해 트랜스크립트 메시지를 작성하거나, 시스템 프롬프트를 주입하거나, 소유자 턴을 시작하거나, `sessions.changed`을 내보내지 마십시오.

## 전달된 표면의 수렴

네이티브 승인 핸들러는 활성 컨트롤을 교체하거나 제거할 수 있을 만큼 전달된 메시지 항목을 이미 충분히 오래 유지합니다. 일반 전달 승인 메시지는 현재 `MessageReceipt`을 폐기하므로, 다른 표면에서 내린 결정으로 인해 이전 컨트롤이 계속 대기 중으로 표시될 수 있습니다. 별도의 후속 작업은 공유 상태 데이터베이스의 `operator_approval_deliveries` 하위 테이블을 사용하여 이 간극을 해소합니다.

각 행에는 승인 ID, 고유 전달 ID, 채널/계정/정확한 경로, 크기가 제한되고 JSON 검증을 거친 채널 전용 메시지 위치 지정자, 전달 타임스탬프 및 최종 처리 상태가 저장됩니다. 콜백 데이터, 결정 토큰 또는 원시 승인 요청은 절대 저장되지 않습니다. 채널은 위치 지정자 인코딩 및 메시지 변경을 소유하고, Core는 정식 상태, 대상 선택, 재시도 정책 및 대체 최종 텍스트를 소유합니다.

전달 등록과 최종 해결은 경합 상황에서도 안전합니다.

1. 대기 중인 전송이 수신 확인을 반환하면 하나의 트랜잭션에서 전달 위치 지정자를 삽입하고 상위 승인 상태를 읽습니다.
2. 상위 항목이 이미 최종 상태이면 늦게 전달된 항목을 대기 상태로 남기는 대신 즉시 최종 처리를 예약합니다.
3. 커밋된 모든 최종 전환은 최종 처리되지 않은 모든 전달 행을 별도로 예약합니다. 삭제 가능한 브로드캐스트가 트리거가 되어서는 안 됩니다.
4. 채널 최종 처리기는 `replaced`, `retired` 또는 `unsupported`을 보고합니다. 교체됨 상태에서는 중복 최종 메시지를 억제하고, 제거됨 상태에서는 기존 최종 후속 메시지를 전송하며, 미지원 또는 실패 시에는 승인 CAS를 롤백하지 않고 대체 동작을 수행합니다.
5. 시작 시 완료되지 않은 전달이 있는 최종 승인을 재시도하여 Gateway 재시작에도 정리가 유지되도록 합니다.

이 전송 수명 주기는 렌더러 또는 모델 대상 메시지 작업이 아니라 선택적 전달 어댑터 후크입니다. QQ C2C/그룹 메시지에는 현재 편집, 삭제 또는 키보드 지우기 API가 없습니다. 해당 어댑터는 계속 지원되지 않으며 전송 수단에 변경 API가 추가되기 전까지는 이후 클릭 후에만 정식 상태를 표시할 수 있습니다.

## 재시작, 시간 초과 및 경로 의미 체계

SQLite 영구 저장은 실행 재개를 의미하지 않습니다. 명령/도구 바인딩에는 보안에 민감한 런타임 정보가 포함될 수 있고 재개 가능한 작업 계약이 아니므로 메모리에 유지됩니다.

Gateway 시작 시:

- 새 런타임 에포크를 생성합니다.
- 이전 에포크의 대기 중인 행을 이유 `gateway-restart`과 함께 `cancelled`으로 원자적으로 전환합니다.
- URL에서 발생한 상황을 설명할 수 있도록 행을 유지합니다.
- 런타임 바인딩이 없는 상태에서 이후 승인을 절대 실행하지 않습니다.

타이머는 깨우기 최적화 수단입니다. 기한 기준은 `expires_at_ms`에 저장되며, 읽기, 대기 및 해결 모두 만료 조정을 실행합니다.

최종 엄격 동작:

- 시간 초과 -> `expired`, 거부
- 경로 없음 -> `denied`, 거부
- 실행 중단 -> `cancelled`, 거부
- 잘못된 신뢰 판정 -> `denied`, 거부
- 허용된 명시적 허용 결정만 -> `allowed`

현재 배포된 exec 동작은 여전히 이 계약과 충돌합니다.

- `src/agents/bash-tools.exec-host-shared.ts`에서 `askFallback`을 적용할 수 있습니다.
- `docs/tools/exec-approvals.md` 및 `docs/cli/approvals.md`에 해당 표면이 문서화되어 있습니다.

Plugin 승인은 이제 시간 초과와 잘못된 판정 시 실패로 차단됩니다. 레거시
`timeoutBehavior` 필드는 계속 허용되지만 무시됩니다. exec 엄격 의미 체계
후속 작업에서는 명시적인 소유자/보안 검토를 거쳐 코드, 형식, 문서, 테스트 및 변경 로그를
함께 업데이트해야 합니다. `askFallback`은 마이그레이션 중 게이트 이전의
정책 선택을 계속 설명할 수 있지만, 생성된 대기 레코드의 시간 초과를
승인으로 전환해서는 안 됩니다.

## 호환성 계획

- 추가 방식의 Gateway 프로토콜이며, 프로토콜 버전은 올리지 않습니다.
- 외부 경계에서 기존 exec/Plugin 메서드와 이벤트를 유지합니다.
- `plugin:` 접두사를 포함한 기존 ID를 유지하되 접두사를 형식 정보로 사용하는 것을 중단합니다.
- `/approve` 텍스트 명령 동작을 유지합니다.
- 레거시 버튼 URL/Web App 필드와 명령 작업을 Plugin SDK 호환성 입력으로 유지하며, 새로운 Core 출력에는 형식이 지정됩니다.
- 동일한 형식 지정 작업 변경에서 번들로 제공되는 모든 채널과 내부 호출자를 마이그레이션합니다.
- 새 URL/페이지와 이후의 시간 초과 동작 변경에 대한 변경 로그 항목을 추가합니다.
- 유도 모드 설정을 추가하지 않습니다.

## 출시 과정

### PR 1: 영구 수명 주기

- 이 설계 문서입니다.
- 공유 SQLite 스키마, Kysely 생성, 저장소 및 30일 정리입니다.
- Gateway 승인 서비스, 런타임 대기자 브리지 및 재시작 고아 처리를 구현합니다.
- 통합 `approval.get/resolve`입니다.
- Exec/Plugin 메서드 어댑터입니다.
- 최초 응답 우선, 멱등성, 만료, 권한 부여 및 소비 테스트입니다.
- 아직 UI 또는 채널 동작은 변경하지 않습니다.

### PR 2: 형식이 지정된 작업 및 채널 콜백

- 형식이 지정된 승인, URL 및 Web App 작업.
- 핵심 프레젠테이션 빌더 및 Plugin SDK 내보내기.
- 명시적 소유자 종류를 사용하는 전송 계층 전용 콜백 인코딩.
- 전송 한도를 초과하는 정규 ID를 위한 내구성 있는 고정 크기 콜백 참조.
- 명령 텍스트 및 승인 ID 추론을 제거하는 번들 채널 마이그레이션.
- 클릭한 화면에서 정규화된 최초 응답의 진실성을 유지하고 활성 네이티브 종료 상태를 최선의 노력으로 업데이트합니다. 내구성 있는 채널 메시지 종료 상태 처리는 후속 작업으로 남습니다.
- SDK 및 번들 채널 테스트.

### PR 3: Control UI 딥 링크

- 독립형 인증 승인 페이지 및 기본 경로를 인식하는 시작 라우팅.
- 운영자가 저장한 원격 선택을 변경하지 않는 서비스 Gateway 바인딩.
- 애셋과 유사한 ID를 포함하여 핵심에서 소유하는 승인 HTTP 네임스페이스.
- Gateway에서 작성하는 URL 페이로드 및 수명 주기 이벤트가 제공될 때까지의 대기 상태 폴링.
- 모바일 너비, 재연결, 경합 응답, 다시 로드 및 마운트된 경로 증명.

### PR 4: 네이티브 클라이언트

- iOS 및 Android 검토 화면은 종류를 인식하는 `approval.get/resolve`을 사용합니다. watchOS는 페어링된 iPhone을 통해 검토자에게 안전한 프롬프트와 결정을 중계합니다.
- Watch는 간결한 중계 계약에서 지원하는 실행 결정을 제공합니다. 즉, 한 번 허용 및 거부입니다.
- 정규화된 최초 응답의 종료 상태 진실성이 로컬의 결정 시도 상태를 대체합니다.
- 확인 응답이 유실되거나 모호한 경우 정규 상태를 다시 읽을 때까지 컨트롤을 동결합니다.
- 이전에 출시된 Gateway v4 인스턴스는 제한된 레거시 메서드 폴백을 통해 실행 검토 기능을 유지합니다. 여러 화면에서 유지되는 종료 상태에는 통합 메서드가 필요합니다.
- 검토자 경고 및 소유자 컨텍스트는 iPhone, Watch 및 Android 전반에서 계속 표시됩니다.
- 네이티브 단위 테스트, 빌드 및 플랫폼 증명.

### PR 5: 상위 항목 수명 주기 전파

- PR 1에서 영속화한 대상 스냅샷으로부터 `session.approval` 대기/종료 상태를 전달합니다.
- 트랜스크립트를 변경하거나 에이전트를 깨우지 않는 정확한 세션 구독, 재연결 재생 및 종료 상태 툼스톤.
- 수명 주기 콜백은 내구성 있는 삽입/CAS 이후에 실행되며 승인 권한이 되지 않습니다.
- 중첩된 하위 에이전트 및 재연결 증명.

### PR 6: 실패 시 차단 동작

- `node-invoke-plugin-policy.ts` 및 내장 Plugin 브로커에서 중복 권한을 제거하도록 마이그레이션합니다.
- 엄격한 시간 초과, 잘못된 형식, 경로 없음, 바인딩 및 한 번 허용 소비 의미 체계.
- 요청이 대기 상태가 된 후에는 출시된 관대한 시간 초과 설정을 적용하지 않고 더 이상 사용하지 않도록 합니다.
- 다중 화면 경합 및 장애 주입 증명.

### 후속 작업: 내구성 있는 원격 메시지 정리

- 전달된 전송 위치 정보를 영속화하고 재시작 후 전달된 모든 채널 메시지를 종료 상태로 전환합니다.
- 이 전송 수명 주기를 정규 승인 권한 및 형식이 지정된 프레젠테이션 작업과 분리하여 유지합니다.

## 테스트

필수 집중 테스트 범위:

- SQLite를 다시 열어도 대기 및 종료 상태 프로젝션이 유지됩니다.
- 동시에 실행되는 두 확인자 중 정확히 하나만 CAS에서 승리합니다.
- 동일 결정 재시도는 멱등적으로 성공하고, 충돌하는 재시도는 기록된 승자를 반환합니다.
- 기한 시점 또는 이후의 확인으로는 승인할 수 없습니다.
- `allow-once`은 종료 상태 감사 기록을 지우지 않고 정확히 한 번만 소비할 수 있습니다.
- 시작 시 이전 런타임 에포크를 취소합니다.
- 권한 없는 조회 및 확인은 레코드의 존재 여부를 노출하지 않습니다.
- 명시적 검토자 허용 목록 및 일반적인 페어링된 `operator.approvals` 동작.
- 실행 및 Plugin 레거시 메서드는 동일한 저장소를 공유합니다.
- Gateway 요청/목록/조회/확인 스키마 및 추가형 이벤트 페이로드.
- 형식이 지정된 작업 정규화, 폴백 렌더링, SDK 내보내기 및 번들 채널 전환.
- Telegram 콜백 인코딩에는 전송 계층 전용 데이터가 포함되며 명령 문자열 추론은 포함되지 않습니다.
- 직접 하위 항목, 분기된 컨트롤러/요청자 소유자, 중첩된 소유자, 재할당, 세션 필드 폴백, 순환 및 대상 크기 상한.
- 요청 대상 배열과 종료 상태 대상 배열은 동일합니다.
- 소유자 프로젝션은 트랜스크립트를 변경하거나 에이전트를 깨우지 않습니다.
- Control UI 경로는 `/` 및 구성된 기본 경로에서 작동하며, 새로 고침 시 대기 또는 종료 상태의 진실성을 표시합니다.
- Control UI와 Telegram에서 동시에 응답하면 한쪽이 승자가 되고 패자는 "다른 곳에서 확인됨"을 표시합니다.
- 네이티브 승인 식별자와 Gateway 소유자 식별자는 라우팅 및 조정 과정에서 정확한 UTF-8 바이트를 보존합니다.
- 네이티브 RPC 계열 협상은 허용된 Gateway 경로별로 하나의 정규 또는 레거시 계열을 고정하며, 사용 후 묵시적으로 다운그레이드하지 않습니다.
- 네이티브 확인 응답이 유실되면 정규 상태를 다시 읽을 때까지 작업을 동결합니다. 다시 읽기에 실패해도 승자를 조작하거나 Watch 새로 고침을 승인할 수 없습니다.
- Watch 스냅샷 요청 상관관계는 정확히 페어링된 Gateway 소유자 및 완료된 정규 iPhone 재조회에 대해서만 허용됩니다.
- 모바일 너비 승인 페이지, Telegram 작업 정리, Android, iPhone 및 Watch 전반에서 이루어지는 대기/확인/지연 패자 왕복 한 번을 포함한 Testbox/Crabbox 사용자 경로 증명.

## 관측 가능성

승인 ID, 종류, 소스 세션 키, 상태, 사유 및 지연 시간을 포함하는 구조화되고 콘텐츠가 없는 전환 로그를 내보냅니다. 미리보기 또는 원시 바인딩은 절대 기록하지 마십시오.

다음을 추적합니다.

- 종류별 요청 수;
- 종류/상태/사유별 종료 수;
- 대기 게이지;
- 요청부터 종료까지의 지연 시간;
- 확인 경합 결과: 승자, 멱등적 재시도, 충돌, 만료;
- 전송 경로 수 및 경로 없음 거부 수;
- 시작 시 고아 항목 취소 수;
- 대상 크기.

커밋된 전환은 이후 이벤트 전달이 실패하더라도 성공입니다. 수명 주기 구독자는 PR 5 재생 및 정규 조회를 통해 복구합니다. 내구성 있는 채널 메시지 종료 상태 처리는 위에 명시된 별도 후속 작업으로 남습니다.

## 미결정 사항

1. **외부에서 접근 가능한 Control UI 출처.** 모든 스냅샷은 안정적인 상대 `urlPath`을 전달합니다. 절대 URL은 Gateway 노출에 성공한 후 캐시된 Tailscale Serve/Funnel 위치에서만 알릴 수 있습니다. `allowedOrigins`, 요청 Host 헤더, `gateway.remote.url` 및 표시 전용 루프백/LAN 후보는 정규 출처가 아닙니다. Telegram은 인증된 Mini App 래퍼를 사용하여 부트스트랩을 거쳐 승인 경로를 유지할 수 있습니다. 별도로 검토된 명시적 공개 URL 계약이 마련될 때까지 임의의 역방향 프록시는 상대 경로만 사용합니다. 채널이 출처를 추측하도록 해서는 절대 안 됩니다.
2. **실행 엄격 시간 초과 호환성 전환.** 이제 Plugin 승인 시간 초과는 실패 시 차단되며 `timeoutBehavior`은 더 이상 사용되지 않습니다. 남아 있는 출시된 `askFallback` 계약이 대기 중인 요청의 시간 초과 후 실행 권한 부여를 중단하려면 명시적인 소유자/보안 검토, 변경 로그, 문서 및 마이그레이션/지원 중단 결정이 필요합니다.
3. **Gateway 없는 내장 모드.** 권장 사항: 처음에는 로컬 전용으로 유지하고, Gateway가 있을 때 정규 서비스의 클라이언트로 전환하십시오. 서버에서 확인할 수 없는 딥 링크를 안내하지 마십시오.
