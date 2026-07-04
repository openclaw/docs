---
read_when:
    - Codex 하네스 런타임 지원 계약이 필요합니다
    - 네이티브 Codex 도구, 훅, Compaction 또는 피드백 업로드를 디버깅하고 있습니다
    - OpenClaw 및 Codex 하네스 턴 전반에서 Plugin 동작을 변경하고 있습니다
summary: Codex 하네스의 런타임 경계, 훅, 도구, 권한 및 진단
title: Codex 하네스 런타임
x-i18n:
    generated_at: "2026-07-04T20:29:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

이 페이지는 Codex 하네스 턴의 런타임 계약을 문서화합니다. 설정 및
라우팅은 [Codex 하네스](/ko/plugins/codex-harness)에서 시작하세요. 구성 필드는
[Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 참조하세요.

## 개요

Codex 모드는 내부에서 다른 모델 호출을 사용하는 OpenClaw가 아닙니다. Codex는
네이티브 모델 루프의 더 많은 부분을 소유하며, OpenClaw는 그 경계에 맞춰
Plugin, 도구, 세션, 진단 표면을 조정합니다.

OpenClaw는 여전히 채널 라우팅, 세션 파일, 표시되는 메시지 전달,
OpenClaw 동적 도구, 승인, 미디어 전달, 트랜스크립트 미러를 소유합니다.
Codex는 정식 네이티브 스레드, 네이티브 모델 루프, 네이티브 도구
이어가기, 네이티브 Compaction을 소유합니다.

프롬프트 라우팅은 제공자 문자열뿐 아니라 선택된 런타임을 따릅니다.
네이티브 Codex 턴은 Codex 앱 서버 개발자 지침을 받는 반면, 명시적
OpenClaw 호환성 라우트는 Codex 계열 OpenAI 인증 또는 전송을 사용하더라도
일반 OpenClaw 시스템 프롬프트를 유지합니다.

네이티브 Codex는 활성 Codex 스레드 구성에 따라 Codex 소유의 기본/모델 지침과
프로젝트 문서 동작을 유지합니다. OpenClaw는 워크스페이스 성격 파일과
OpenClaw 에이전트 정체성이 권위 있게 유지되도록 Codex의 내장 성격을
비활성화한 상태로 네이티브 Codex 스레드를 시작하고 재개합니다. 경량
OpenClaw 실행은 기존 프로젝트 문서 억제를 계속 보존합니다. OpenClaw
개발자 지침은 소스 채널 전달, OpenClaw 동적 도구, ACP 위임, 어댑터
컨텍스트, 활성 에이전트 워크스페이스 프로필 파일 같은 OpenClaw 런타임
관심사를 다룹니다. OpenClaw Skills 카탈로그와 도구 라우팅된 `MEMORY.md`
포인터는 네이티브 Codex를 위한 턴 범위 협업 개발자 지침으로 투영됩니다.
활성 `BOOTSTRAP.md` 콘텐츠와 전체 `MEMORY.md` 대체 주입은 여전히 턴 입력
참조 컨텍스트를 사용합니다.

## 스레드 바인딩 및 모델 변경

OpenClaw 세션이 기존 Codex 스레드에 연결되면, 다음 턴은 현재 선택된
OpenAI 모델, 승인 정책, 샌드박스, 서비스 티어를 앱 서버에 다시 보냅니다.
`openai/gpt-5.5`에서 `openai/gpt-5.2`로 전환해도 스레드 바인딩은 유지되지만
Codex에 새로 선택된 모델로 계속 진행하도록 요청합니다.

## 표시되는 응답 및 Heartbeat

직접/소스 채팅 턴이 Codex 하네스를 통해 실행될 때, 표시되는 응답은 내부
WebChat 표면에 대해 기본적으로 최종 어시스턴트 자동 전달을 사용합니다.
이렇게 하면 Codex가 Pi 하네스 프롬프트 계약과 정렬됩니다. 에이전트는
일반적으로 응답하고, OpenClaw는 최종 텍스트를 소스 대화에 게시합니다.
직접/소스 채팅에서 에이전트가 `message(action="send")`를 호출하지 않는 한
최종 어시스턴트 텍스트를 의도적으로 비공개로 유지해야 하는 경우
`messages.visibleReplies: "message_tool"`을 설정하세요.

Codex Heartbeat 턴도 기본적으로 검색 가능한 OpenClaw 도구 카탈로그에서
`heartbeat_respond`를 받으므로, 에이전트는 해당 제어 흐름을 최종 텍스트에
인코딩하지 않고도 깨우기를 조용히 유지할지 알림을 보낼지 기록할 수 있습니다.

Heartbeat 전용 주도성 지침은 Heartbeat 턴 자체에서 Codex 협업 모드 개발자
지침으로 전송됩니다. 일반 채팅 턴은 일반 런타임 프롬프트에 Heartbeat 철학을
가지고 가지 않고 Codex Default 모드로 복원됩니다. 비어 있지 않은
`HEARTBEAT.md`가 있으면, Heartbeat 협업 모드 지침은 내용을 인라인하지 않고
Codex가 해당 파일을 참조하도록 합니다.

## 훅 경계

Codex 하네스에는 세 가지 훅 계층이 있습니다.

| 계층                                  | 소유자                    | 목적                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin 훅                    | OpenClaw                 | OpenClaw 및 Codex 하네스 전반의 제품/Plugin 호환성.                 |
| Codex 앱 서버 확장 미들웨어          | OpenClaw 번들 Plugin     | OpenClaw 동적 도구 주변의 턴별 어댑터 동작.                         |
| Codex 네이티브 훅                    | Codex                    | Codex 구성의 저수준 Codex 수명 주기 및 네이티브 도구 정책.          |

OpenClaw는 OpenClaw Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역 Codex
`hooks.json` 파일을 사용하지 않습니다. 지원되는 네이티브 도구 및 권한
브리지의 경우, OpenClaw는 `PreToolUse`, `PostToolUse`, `PermissionRequest`,
`Stop`에 대한 스레드별 Codex 구성을 주입합니다.

Codex 앱 서버 승인이 활성화되어, 즉 `approvalPolicy`가 `"never"`가 아닌 경우,
기본 주입 네이티브 훅 구성은 `PermissionRequest`를 생략하여 Codex의 앱 서버
검토자와 OpenClaw의 승인 브리지가 검토 후 실제 승격을 처리하게 합니다.
운영자는 호환성 릴레이가 필요할 때 `nativeHookRelay.events`에
`permission_request`를 명시적으로 추가할 수 있습니다.

`SessionStart` 및 `UserPromptSubmit` 같은 다른 Codex 훅은 Codex 수준 제어로
유지됩니다. 이들은 v1 계약에서 OpenClaw Plugin 훅으로 노출되지 않습니다.

OpenClaw 동적 도구의 경우, Codex가 호출을 요청한 뒤 OpenClaw가 도구를
실행하므로 OpenClaw는 하네스 어댑터에서 자신이 소유한 Plugin 및 미들웨어
동작을 실행합니다. Codex 네이티브 도구의 경우, Codex가 정식 도구 레코드를
소유합니다. OpenClaw는 선택된 이벤트를 미러링할 수 있지만, Codex가 앱 서버
또는 네이티브 훅 콜백을 통해 해당 작업을 노출하지 않는 한 네이티브 Codex
스레드를 다시 작성할 수는 없습니다.

Codex 앱 서버 보고 모드 `PreToolUse` 이벤트는 Plugin 승인 요청을 일치하는
앱 서버 승인으로 미룹니다. OpenClaw `before_tool_call` 훅이 `requireApproval`을
반환하고 네이티브 페이로드가 보고 승인 모드(`openclaw_approval_mode`가
`"report"`)를 설정한 경우, 네이티브 훅 릴레이는 Plugin 승인 요구 사항을
기록하고 네이티브 결정을 반환하지 않습니다. Codex가 같은 도구 사용에 대한
앱 서버 승인 요청을 보내면, OpenClaw는 Plugin 승인 프롬프트를 열고 결정을
Codex에 다시 매핑합니다. Codex `PermissionRequest` 이벤트는 별도의 승인
경로이며, 런타임이 해당 브리지에 맞게 구성된 경우 여전히 OpenClaw 승인을
통해 라우팅될 수 있습니다.

Codex 앱 서버 항목 알림은 네이티브 `PostToolUse` 릴레이로 이미 처리되지 않은
네이티브 도구 완료에 대해 비동기 `after_tool_call` 관찰도 제공합니다. 이러한
관찰은 텔레메트리 및 Plugin 호환성만을 위한 것이며, 네이티브 도구 호출을
차단, 지연 또는 변경할 수 없습니다.

Compaction 및 LLM 수명 주기 투영은 네이티브 Codex 훅 명령이 아니라 Codex 앱
서버 알림과 OpenClaw 어댑터 상태에서 나옵니다. OpenClaw의
`before_compaction`, `after_compaction`, `llm_input`, `llm_output` 이벤트는
어댑터 수준 관찰이며, Codex의 내부 요청 또는 Compaction 페이로드를 바이트
단위로 캡처한 것이 아닙니다.

Codex 네이티브 `hook/started` 및 `hook/completed` 앱 서버 알림은 궤적과
디버깅을 위해 `codex_app_server.hook` 에이전트 이벤트로 투영됩니다. 이들은
OpenClaw Plugin 훅을 호출하지 않습니다.

## V1 지원 계약

Codex 런타임 v1에서 지원됨:

| 영역 | 지원 | 이유 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex를 통한 OpenAI 모델 루프 | 지원됨 | Codex 앱 서버가 OpenAI 턴, 네이티브 스레드 재개, 네이티브 도구 연속 실행을 소유합니다. |
| OpenClaw 채널 라우팅 및 전달 | 지원됨 | Telegram, Discord, Slack, WhatsApp, iMessage 및 기타 채널은 모델 런타임 외부에 유지됩니다. |
| OpenClaw 동적 도구 | 지원됨 | Codex가 OpenClaw에 이러한 도구 실행을 요청하므로 OpenClaw는 실행 경로에 남아 있습니다. |
| 프롬프트 및 컨텍스트 Plugin | 지원됨 | OpenClaw는 OpenClaw 전용 프롬프트/컨텍스트를 Codex 턴에 투영하면서, Codex가 소유한 기본 프롬프트, 모델 프롬프트, 구성된 프로젝트 문서 프롬프트는 네이티브 Codex 경로에 남겨 둡니다. OpenClaw는 네이티브 스레드에서 Codex의 내장 성격을 비활성화하여 에이전트 워크스페이스 성격 파일이 계속 권위 있는 소스가 되도록 합니다. 네이티브 Codex 개발자 지침은 `codex_app_server`에 명시적으로 범위가 지정된 명령 지침만 허용하며, 레거시 전역 명령 힌트는 Codex가 아닌 프롬프트 표면에 남아 있습니다. |
| 컨텍스트 엔진 수명 주기 | 지원됨 | 조립, 수집, 턴 이후 유지 관리는 Codex 턴 주변에서 실행됩니다. 컨텍스트 엔진은 네이티브 Codex Compaction을 대체하지 않습니다. |
| 동적 도구 후크 | 지원됨 | `before_tool_call`, `after_tool_call` 및 도구 결과 미들웨어는 OpenClaw가 소유한 동적 도구 주변에서 실행됩니다. |
| 수명 주기 후크 | 어댑터 관찰로 지원됨 | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, `after_compaction`은 정확한 Codex 모드 페이로드와 함께 발생합니다. |
| 최종 답변 수정 게이트 | 네이티브 후크 릴레이를 통해 지원됨 | Codex `Stop`은 `before_agent_finalize`로 릴레이되며, `revise`는 최종화 전에 Codex에 모델 패스를 한 번 더 요청합니다. |
| 네이티브 셸, 패치 및 MCP 차단 또는 관찰 | 네이티브 후크 릴레이를 통해 지원됨 | Codex `PreToolUse` 및 `PostToolUse`는 Codex 앱 서버 `0.125.0` 이상에서 MCP 페이로드를 포함한 확정된 네이티브 도구 표면에 대해 릴레이됩니다. 차단은 지원되지만 인수 재작성은 지원되지 않습니다. |
| 네이티브 권한 정책 | Codex 앱 서버 승인 및 호환성 네이티브 후크 릴레이를 통해 지원됨 | Codex 앱 서버 승인 요청은 Codex 검토 후 OpenClaw를 통해 라우팅됩니다. `PermissionRequest` 네이티브 후크 릴레이는 Codex가 보호자 검토 전에 이를 내보내기 때문에 네이티브 승인 모드에서 옵트인입니다. |
| 앱 서버 궤적 캡처 | 지원됨 | OpenClaw는 앱 서버로 보낸 요청과 수신한 앱 서버 알림을 기록합니다. |

Codex 런타임 v1에서 지원되지 않음:

| 영역 | V1 경계 | 향후 경로 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 네이티브 도구 인수 변경 | Codex 네이티브 사전 도구 후크는 차단할 수 있지만, OpenClaw는 Codex 네이티브 도구 인수를 재작성하지 않습니다. | 대체 도구 입력을 위한 Codex 후크/스키마 지원이 필요합니다. |
| 편집 가능한 Codex 네이티브 transcript 기록 | Codex는 표준 네이티브 스레드 기록을 소유합니다. OpenClaw는 미러를 소유하고 향후 컨텍스트를 투영할 수 있지만, 지원되지 않는 내부 구조를 변경해서는 안 됩니다. | 네이티브 스레드 수술이 필요한 경우 명시적인 Codex 앱 서버 API를 추가합니다. |
| Codex 네이티브 도구 레코드용 `tool_result_persist` | 해당 후크는 Codex 네이티브 도구 레코드가 아니라 OpenClaw가 소유한 transcript 쓰기를 변환합니다. | 변환된 레코드를 미러링할 수는 있지만, 표준 재작성에는 Codex 지원이 필요합니다. |
| 풍부한 네이티브 Compaction 메타데이터 | OpenClaw는 네이티브 Compaction을 요청할 수 있지만, 안정적인 유지/삭제 목록, 토큰 델타, 완료 요약 또는 요약 페이로드를 받지 않습니다. | 더 풍부한 Codex Compaction 이벤트가 필요합니다. |
| Compaction 개입 | OpenClaw는 Plugin 또는 컨텍스트 엔진이 네이티브 Codex Compaction을 거부, 재작성 또는 대체하도록 허용하지 않습니다. | Plugin이 네이티브 Compaction을 거부하거나 재작성해야 하는 경우 Codex 사전/사후 Compaction 후크를 추가합니다. |
| 바이트 단위로 동일한 모델 API 요청 캡처 | OpenClaw는 앱 서버 요청과 알림을 캡처할 수 있지만, Codex 코어가 최종 OpenAI API 요청을 내부적으로 빌드합니다. | Codex 모델 요청 추적 이벤트 또는 디버그 API가 필요합니다. |

## 네이티브 권한 및 MCP 요청

`PermissionRequest`의 경우, OpenClaw는 정책이 결정할 때만 명시적인 허용 또는 거부 결정을 반환합니다.
결정 없음 결과는 허용이 아닙니다. Codex는 이를 후크 결정 없음으로 처리하고 자체 보호자 또는 사용자 승인 경로로 넘어갑니다.

Codex 앱 서버 승인 모드는 기본적으로 이 네이티브 후크를 생략합니다. 이 동작은 `permission_request`가 `nativeHookRelay.events`에 명시적으로 포함되거나 호환성 런타임이 이를 설치할 때 적용됩니다.

운영자가 Codex 네이티브 권한 요청에 대해 `allow-always`를 선택하면, OpenClaw는 제한된 세션 기간 동안 해당 정확한 제공자/세션/도구 입력/cwd 지문을 기억합니다. 기억된 결정은 의도적으로 정확한 일치에만 적용됩니다. 명령, 인수, 도구 페이로드 또는 cwd가 변경되면 새 승인이 생성됩니다.

Codex MCP 도구 승인 요청은 Codex가 `_meta.codex_approval_kind`를 `"mcp_tool_call"`로 표시할 때 OpenClaw의 Plugin 승인 흐름을 통해 라우팅됩니다. Codex `request_user_input` 프롬프트는 원래 채팅으로 다시 전송되며, 다음 대기 중인 후속 메시지는 추가 컨텍스트로 조정되는 대신 해당 네이티브 서버 요청에 응답합니다. 기타 MCP 요청은 실패 시 닫힙니다.

이러한 프롬프트를 전달하는 일반 Plugin 승인 흐름은 [Plugin 권한 요청](/ko/plugins/plugin-permission-requests)을 참조하세요.

## 큐 조정

활성 실행 큐 조정은 Codex 앱 서버 `turn/steer`에 매핑됩니다. 기본 `messages.queue.mode: "steer"`를 사용하면, OpenClaw는 구성된 정숙 기간 동안 조정 모드 채팅 메시지를 일괄 처리하고 도착 순서대로 하나의 `turn/steer` 요청으로 보냅니다.

Codex 리뷰와 수동 Compaction 턴은 동일 턴 스티어링을 거부할 수 있습니다. 이 경우 OpenClaw는 프롬프트를 시작하기 전에 활성 실행이 끝날 때까지 기다립니다. 메시지가 스티어링 대신 기본적으로 대기열에 들어가야 할 때는 `/queue followup` 또는 `/queue collect`를 사용하세요. [스티어링 큐](/ko/concepts/queue-steering)를 참조하세요.

## Codex 피드백 업로드

네이티브 Codex 하네스를 사용하는 세션에서 `/diagnostics [note]`가 승인되면 OpenClaw는 관련 Codex 스레드에 대해 Codex 앱 서버 `feedback/upload`도 호출합니다. 업로드는 앱 서버에 나열된 각 스레드와 사용 가능한 경우 생성된 Codex 하위 스레드의 로그를 포함하도록 요청합니다.

업로드는 OpenAI 서버로 향하는 Codex의 일반 피드백 경로를 통해 진행됩니다. 해당 앱 서버에서 Codex 피드백이 비활성화되어 있으면 명령은 앱 서버 오류를 반환합니다. 완료된 진단 응답에는 전송된 스레드의 채널, OpenClaw 세션 ID, Codex 스레드 ID, 로컬 `codex resume <thread-id>` 명령이 나열됩니다.

승인을 거부하거나 무시하면 OpenClaw는 해당 Codex ID를 출력하지 않고 Codex 피드백을 보내지 않습니다. 업로드는 로컬 Gateway 진단 내보내기를 대체하지 않습니다. 승인, 개인정보 보호, 로컬 번들, 그룹 채팅 동작은 [진단 내보내기](/ko/gateway/diagnostics)를 참조하세요.

전체 Gateway 진단 번들 없이 현재 연결된 스레드의 Codex 피드백 업로드만 특별히 원하는 경우에만 `/codex diagnostics [note]`를 사용하세요.

## Compaction 및 트랜스크립트 미러

선택한 모델이 Codex 하네스를 사용할 때 네이티브 스레드 Compaction은 Codex 앱 서버가 소유합니다. OpenClaw는 Codex 턴에 대해 사전 점검 Compaction을 실행하지 않고, Codex Compaction을 컨텍스트 엔진 Compaction으로 대체하지 않으며, 네이티브 Codex Compaction을 시작할 수 없을 때 OpenClaw 또는 공개 OpenAI 요약으로 대체하지 않습니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset`, 향후 모델 또는 하네스 전환을 위해 트랜스크립트 미러를 유지합니다.

`/compact` 또는 Plugin이 요청한 수동 compact 작업 같은 명시적 Compaction 요청은 `thread/compact/start`로 네이티브 Codex Compaction을 시작합니다. OpenClaw는 Codex가 일치하는 `contextCompaction` 완료 항목을 내보낼 때까지 요청과 공유 클라이언트 리스를 열린 상태로 유지한 다음 Compaction 턴을 완료로 보고합니다. 해당 종료 턴이 구성된 Compaction 제한 시간을 초과하면 OpenClaw는 네이티브 턴 인터럽트를 요청합니다. 리스와 스레드별 Compaction 펜스는 Codex가 종료 상태를 보고하거나 인터럽트 RPC를 확인할 때까지 유지됩니다. Codex가 인터럽트 유예 기간 내에 확인하지 않으면 OpenClaw는 펜스를 해제하기 전에 연결을 폐기합니다. 원격 연결은 일치하는 스레드 바인딩도 분리하여 이후 작업이 확인되지 않은 원격 턴과 겹치지 않도록 합니다. 폐기된 연결의 다른 턴은 실패하며 새 클라이언트에서 다시 시도할 수 있습니다. 클라이언트 종료, 요청 취소, 실패한 Compaction 턴은 실패한 작업을 반환합니다.

컨텍스트 엔진이 Codex 스레드 부트스트랩 프로젝션을 요청하면 OpenClaw는 도구 호출 이름과 ID, 입력 형태, 수정된 도구 결과 콘텐츠를 새 Codex 스레드에 프로젝션합니다. 원시 도구 호출 인수 값은 해당 프로젝션에 복사하지 않습니다.

미러에는 사용자 프롬프트, 최종 어시스턴트 텍스트, 앱 서버가 내보내는 경우 경량 Codex 추론 또는 계획 레코드가 포함됩니다. OpenClaw는 네이티브 Compaction 시작과 종료 상태를 기록하지만, 사람이 읽을 수 있는 Compaction 요약이나 Compaction 이후 Codex가 유지한 항목의 감사 가능한 목록은 노출하지 않습니다.

Codex가 표준 네이티브 스레드를 소유하므로 `tool_result_persist`는 현재 Codex 네이티브 도구 결과 레코드를 다시 쓰지 않습니다. 이는 OpenClaw가 OpenClaw 소유 세션 트랜스크립트 도구 결과를 작성할 때만 적용됩니다.

## 미디어 및 전달

OpenClaw는 계속해서 미디어 전달과 미디어 제공자 선택을 소유합니다. 이미지, 비디오, 음악, PDF, TTS, 미디어 이해는 `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, `messages.tts` 같은 일치하는 제공자/모델 설정을 사용합니다.

텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은 계속해서 일반 OpenClaw 전달 경로를 통해 진행됩니다. 미디어 생성에는 레거시 런타임이 필요하지 않습니다. Codex가 `savedPath`가 있는 네이티브 이미지 생성 항목을 내보내면 Codex 턴에 어시스턴트 텍스트가 없더라도 OpenClaw는 해당 정확한 파일을 일반 응답 미디어 경로를 통해 전달합니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 참조](/ko/plugins/codex-harness-reference)
- [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)
- [Plugin 훅](/ko/plugins/hooks)
- [Agent 하네스 Plugin](/ko/plugins/sdk-agent-harness)
- [진단 내보내기](/ko/gateway/diagnostics)
- [궤적 내보내기](/ko/tools/trajectory)
