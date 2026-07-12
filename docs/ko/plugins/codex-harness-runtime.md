---
read_when:
    - Codex 하네스 런타임 지원 계약이 필요합니다
    - 네이티브 Codex 도구, 훅, Compaction 또는 피드백 업로드를 디버깅하는 경우
    - OpenClaw 및 Codex 하네스 턴 전반에서 Plugin 동작을 변경하고 있습니다
summary: Codex 하네스의 런타임 경계, 훅, 도구, 권한 및 진단
title: Codex 하네스 런타임
x-i18n:
    generated_at: "2026-07-12T00:55:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex 하네스 턴의 런타임 계약입니다. 설정 및 라우팅은
[Codex 하네스](/ko/plugins/codex-harness)를 참조하세요. 구성 필드는
[Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 참조하세요.

## 개요

Codex는 네이티브 모델 루프, 네이티브 스레드 재개, 네이티브 도구
연속 실행 및 네이티브 Compaction을 담당합니다. OpenClaw는 채널 라우팅, 세션
파일, 표시 메시지 전달, OpenClaw 동적 도구, 승인, 미디어
전달 및 이 경계 주변의 트랜스크립트 미러를 담당합니다.

프롬프트 라우팅은 단순히 공급자 문자열이 아니라 선택된 런타임을 따릅니다.
네이티브 Codex 턴에는 Codex app-server 개발자 지침이 적용됩니다. 명시적인
OpenClaw 호환성 경로는 Codex 방식의 OpenAI 인증 또는 전송을
사용하더라도 일반 OpenClaw 시스템 프롬프트를 유지합니다.

OpenClaw는 워크스페이스 성격 파일과 OpenClaw 에이전트 ID가
권위 있는 상태를 유지하도록 Codex의 기본 제공 성격을 비활성화한
상태(`personality: "none"`)로 네이티브 Codex 스레드를 시작하고 재개합니다.
그 외에는 네이티브 Codex가 Codex 소유의 기본/모델 지침 및 프로젝트 문서 로딩을
유지합니다. 경량 OpenClaw 실행(예: cron)에서는 여전히 프로젝트 문서 로딩을
억제합니다.

OpenClaw 개발자 지침은 OpenClaw 런타임 관련 사항, 즉 소스 채널
전달, OpenClaw 동적 도구, ACP 위임, 어댑터 컨텍스트 및
활성 에이전트 워크스페이스 프로필 파일을 다룹니다. Skill 카탈로그 및 도구를 통해 라우팅되는
`MEMORY.md` 포인터는 턴 범위의 협업 개발자
지침으로 투영됩니다. 메모리 도구를 사용할 수 없으면 활성 `BOOTSTRAP.md` 콘텐츠와
전체 `MEMORY.md`가 대신 일반 턴 입력 컨텍스트로 대체됩니다.

대부분의 OpenClaw 동적 도구는 검색 가능한 `openclaw` 네임스페이스를 사용합니다.
`catalogMode: "direct-only"`로 표시된 도구는 `openclaw_direct`를 사용하며, Codex는 이를
중첩된 코드 모드 실행에 노출하는 대신 `DirectModelOnly`로 모델에 직접
표시되는 상태로 유지합니다.

## 스레드 바인딩 및 모델 변경

OpenClaw 세션이 기존 Codex 스레드에 연결되어 있으면 다음
턴에서 현재 선택된 모델, 승인 정책, 샌드박스,
승인 검토자 및 서비스 티어를 app-server에 다시 전송합니다.
`openai/gpt-5.5`에서 `openai/gpt-5.2`로 전환하면 스레드 바인딩은 유지되지만 Codex에
새로 선택한 모델로 계속하도록 요청합니다.

감독되는 바인딩은 예외입니다. OpenClaw 모델 선택기는 잠긴 상태를 유지하며,
재개 시 모델 및 공급자 재정의를 생략하여 Codex가 정식
스레드에 저장된 모델과 공급자를 복원하도록 합니다. 별도의 네이티브 Codex 제어 기능으로
저장된 이 쌍을 변경할 수 있으며, 초기 스냅샷에서 Codex의 일반적인
모델 차이 경고가 표시될 수 있습니다. 외부 OpenClaw 모델 및 대체 체인은
어느 쪽도 대신하지 않습니다.

## 감독 및 안전한 연속 실행

Codex 감독은 동일한 `codex` Plugin에서 선택적으로 활성화하는 기능입니다. 별도의
연결을 통해 네이티브 스레드를 검색하고 보관되지 않은 세션만
Gateway 카탈로그에 투영합니다. 명시적인 `appServer` 연결
설정이 없으면 일반 하네스는 에이전트 범위로 유지되는 반면, 해당 연결은 관리되는 사용자 홈
표준 입출력을 사용합니다. 목록 및 메타데이터 읽기는 수동적입니다. 이러한 작업은
스레드를 재개하거나, OpenClaw가 실시간 이벤트를 구독하게 하거나, 해당 스레드의
승인에 응답하지 않습니다.

Gateway 컴퓨터에 저장되어 있거나 유휴 상태인 세션에서 **Continue as branch**를 선택하면
모델이 잠긴 일반 Chat을 생성하고, 소스에서 마지막으로 터미널 상태로 저장된 턴까지
제한된 사용자 및 어시스턴트 기록을 미러링합니다. 첫 번째 일반
Chat 턴은 실제 승인 처리기를 설치하고 임시 네이티브 포크를 사용하여
모델 또는 공급자 재정의 없이 스냅샷을 고정합니다. Codex App Server는
현재 네이티브 구성을 사용하고 선택된 쌍을 반환합니다. 해당 모델이 소스에 마지막으로 기록된
모델과 다르면 일반적인 경고를 표시합니다.
동일한 감독 연결에서 OpenClaw는 해당 cwd 및 런타임 정책에 따라 정식
`appServer` 소스 Codex 하네스 스레드를 시작하며, 이 초기 시작에는
반환된 모델과 공급자를 정확히 사용합니다. 또한 제한된 표시 기록을 주입하고
임시 포크를 보관합니다. 소스는 절대 재개되지 않습니다.
정식 스레드에는 전체 OpenClaw 하네스 도구 표면이 제공됩니다.
소스의 추론, 도구 호출 및 도구 결과는 정식 스레드로 복제되지 않습니다.
비공개 연결 범위는 대기 중 및 커밋된 바인딩 상태에서도 유지되므로
이후의 모든 턴은 네이티브 인증 및 공급자
구성과 함께 해당 연결에 남습니다. 감독이 비활성화되었거나 바인딩/연결이 달라지면
일반 에이전트 홈 하네스로 전환하는 대신 실패 시 차단됩니다.

원래 CLI 또는 VS Code 소스는 두 카탈로그 모두에 계속 포함될 수 있습니다.
정식 브랜치는 네이티브 Codex 스레드이지만 소스 종류는 `appServer`입니다.
네이티브 클라이언트는 해당 소스 종류를 필터링할 수 있으므로 Codex Desktop에
표시된다고 보장할 수 없습니다.

활성 소스에서는 새 브랜치를 시작하거나 보관할 수 없습니다. 기존 감독
Chat은 계속 열 수 있습니다. `notLoaded`는 활동 상태를 알 수 없다는 의미이지 유휴 상태라는
의미가 아닙니다. OpenClaw는 명시적으로 다른 실행자가 없다는 확인과
새로운 프로세스 로컬 상태 읽기가 수행된 후에만 로컬 `idle` 또는 `notLoaded` 행의
보관을 허용합니다. Codex는 하나의 App Server 프로세스 내에서
스레드 변경 작업을 직렬화하지만, 프로세스 간에 독점적인 실행자 또는 승인 소유자
임대를 제공하지 않으므로 해당 읽기로 다른 프로세스가 스레드를 사용하지 않는다고
입증할 수 없습니다. OpenClaw는 정확한 대상이나 Codex의 페이지가 매겨진 하위 항목
쿼리에서 반환된 보관되지 않은 생성 하위 항목에 알려진 활성 바인딩 소유자가 있으면
차단합니다. 열거 오류, 순환 및 안전 제한 소진 시 실패를 차단합니다.
다른 프로세스의 새 턴과 네이티브 보관이 여전히 경합할 수 있으므로,
확인 범위에는 알 수 없는 클라이언트 및 상태 읽기와 보관 사이의 간격이 포함됩니다.
네이티브 바인딩을 보호하는 동안에는 감독되는 모델 잠금 Chat을 삭제할 수 없습니다.

페어링된 Node 카탈로그는 초기 릴리스에서 메타데이터 전용으로 유지됩니다. 현재
Node 호출 경계는 요청/응답 방식이며, 실제 Codex 하네스 바인딩에 필요한
장기 실행 턴 이벤트, 승인 요청 또는 스트리밍 출력을 전달할 수
없습니다. 따라서 행이 유휴 상태이더라도 원격 **Continue** 및 **Archive**는
계속 사용할 수 없습니다.

운영자 설정 및 표시되는 Control UI 동작은
[Codex 감독](/ko/plugins/codex-supervision)을 참조하세요.

## 표시 응답 및 Heartbeat

Codex 하네스를 통한 직접/소스 채팅 턴은 내부 WebChat 표면에서
최종 어시스턴트 응답을 기본적으로 자동 전달하며, Pi 하네스
계약과 일치합니다. 에이전트는 정상적으로 응답하고 OpenClaw는 최종 텍스트를
소스 대화에 게시합니다. 에이전트가 `message(action="send")`를 호출하지 않는 한
최종 어시스턴트 텍스트를 비공개로 유지하려면 `messages.visibleReplies: "message_tool"`을 설정하세요.

Codex Heartbeat 턴에는 기본적으로 검색 가능한 OpenClaw 도구
카탈로그의 `heartbeat_respond`가 제공되므로 에이전트가 깨우기 동작을 조용히 유지할지
알림을 보낼지 기록할 수 있습니다. Heartbeat 주도성 지침은 Heartbeat 턴 범위의
Codex 협업 모드 개발자 지침으로 전송됩니다. 일반 채팅 턴은
Codex 기본 모드로 유지됩니다. `HEARTBEAT.md`가 비어 있지 않으면 Heartbeat
지침은 그 내용을 인라인으로 포함하는 대신 Codex가 해당 파일을 참조하도록 안내합니다.

## 훅 경계

| 계층                                  | 소유자                   | 목적                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin 훅                    | OpenClaw                 | OpenClaw 및 Codex 하네스 간 제품/Plugin 호환성.                     |
| Codex app-server 확장 미들웨어        | OpenClaw 번들 Plugin     | OpenClaw 동적 도구 주변의 턴별 어댑터 동작.                         |
| Codex 네이티브 훅                     | Codex                    | Codex 구성의 저수준 Codex 수명 주기 및 네이티브 도구 정책.         |

OpenClaw는 Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역 Codex `hooks.json` 파일을
사용하지 않습니다. 네이티브 도구 및 권한 브리지의 경우 OpenClaw는
`PreToolUse`, `PostToolUse`, `PermissionRequest` 및 `Stop`에 대한
스레드별 Codex 구성을 주입합니다.

Codex app-server 승인이 활성화된 경우(`approvalPolicy`가
`"never"`가 아닌 경우), 기본적으로 주입되는 네이티브 훅 구성에서는 `PermissionRequest`를
생략하므로 검토 후 Codex의 app-server 검토자와 OpenClaw의 승인 브리지가 실제
권한 상승을 처리합니다. 호환성 릴레이를 강제로 사용하려면
`nativeHookRelay.events`에 `permission_request`를 추가하세요. `SessionStart` 및
`UserPromptSubmit`과 같은 다른 Codex 훅은 Codex 수준
제어 기능으로 유지되며, v1 계약에서는 OpenClaw Plugin 훅으로 노출되지 않습니다.

OpenClaw 동적 도구의 경우 Codex가 호출을 요청한 후 OpenClaw가 도구를
실행하므로 Plugin 및 미들웨어 동작은 하네스 어댑터에서 실행됩니다.
Codex 네이티브 도구의 경우 Codex가 정식 도구 레코드를 소유합니다. OpenClaw는
선택한 이벤트를 미러링할 수 있지만 Codex가 app-server 또는 네이티브 훅 콜백을 통해
이를 노출하지 않는 한 네이티브 스레드를 다시 작성할 수 없습니다.

Codex app-server 보고 모드 `PreToolUse` 이벤트는 일치하는 app-server 승인으로
Plugin 승인을 연기합니다. OpenClaw `before_tool_call` 훅이
`requireApproval`을 반환하고 네이티브 페이로드가 `openclaw_approval_mode:
"report"`를 설정하면 네이티브 훅 릴레이는 Plugin 승인 요구 사항을 기록하고
네이티브 결정을 반환하지 않습니다. 나중에 Codex가 동일한 도구 사용에 대한 app-server 승인
요청을 보내면 OpenClaw는 Plugin 승인 프롬프트를 열고
결정을 Codex에 다시 매핑합니다. Codex `PermissionRequest` 이벤트는
별도의 승인 경로이며, 해당 브리지에 맞게 구성된 경우에도 OpenClaw 승인을 통해
라우팅될 수 있습니다.

Codex app-server 항목 알림은 네이티브
`PostToolUse` 릴레이에서 아직 처리하지 않은 네이티브 도구 완료에 대한 비동기 `after_tool_call`
관찰도 제공합니다. 이는 원격 측정/호환성 전용이며 네이티브 도구 호출을
차단하거나 지연하거나 변경할 수 없습니다.

Compaction 및 LLM 수명 주기 투영은 네이티브 Codex 훅 명령이 아니라
Codex app-server 알림 및 OpenClaw 어댑터 상태에서 가져옵니다.
`before_compaction`, `after_compaction`, `llm_input` 및 `llm_output`은
어댑터 수준의 관찰이며, Codex의 내부 요청 또는 Compaction 페이로드를
바이트 단위로 캡처한 것이 아닙니다.

Codex 네이티브 `hook/started` 및 `hook/completed` app-server 알림은
경로 추적 및 디버깅을 위해 `codex_app_server.hook` 에이전트 이벤트로
투영됩니다. 이 알림은 OpenClaw Plugin 훅을 호출하지 않습니다.

## V1 지원 계약

Codex 런타임 v1에서 지원되는 항목:

| 영역                                          | 지원 여부                                                                         | 이유                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Codex를 통한 OpenAI 모델 루프                 | 지원됨                                                                            | Codex app-server가 OpenAI 턴, 네이티브 스레드 재개, 네이티브 도구 연속 실행을 담당합니다.                                                                                                                                                                                                                                                                                                                                                                                            |
| OpenClaw 채널 라우팅 및 전송                  | 지원됨                                                                            | Telegram, Discord, Slack, WhatsApp, iMessage 및 기타 채널은 모델 런타임 외부에 유지됩니다.                                                                                                                                                                                                                                                                                                                                                                                           |
| OpenClaw 동적 도구                            | 지원됨                                                                            | Codex가 OpenClaw에 이러한 도구의 실행을 요청하므로 OpenClaw는 실행 경로에 계속 포함됩니다.                                                                                                                                                                                                                                                                                                                                                                                          |
| 프롬프트 및 컨텍스트 Plugin                   | 지원됨                                                                            | OpenClaw는 OpenClaw 전용 프롬프트/컨텍스트를 Codex 턴에 투영하면서 Codex가 소유하는 기본, 모델 및 구성된 프로젝트 문서 프롬프트는 네이티브 Codex 경로에 그대로 둡니다. OpenClaw는 네이티브 스레드에서 Codex의 기본 제공 페르소나를 비활성화하여 에이전트 작업 공간의 페르소나 파일이 계속 최종 기준이 되도록 합니다. 네이티브 Codex 개발자 지침은 `codex_app_server`로 명시적으로 범위가 지정된 명령 지침만 허용하며, 기존의 전역 명령 힌트는 Codex 이외의 프롬프트 영역에 유지됩니다. |
| 컨텍스트 엔진 수명 주기                      | 지원됨                                                                            | 조립, 수집 및 턴 이후 유지 관리가 Codex 턴 전후에 실행됩니다. 컨텍스트 엔진은 네이티브 Codex Compaction을 대체하지 않습니다.                                                                                                                                                                                                                                                                                                                                                        |
| 동적 도구 훅                                 | 지원됨                                                                            | `before_tool_call`, `after_tool_call` 및 도구 결과 미들웨어가 OpenClaw 소유 동적 도구의 실행 전후에 작동합니다.                                                                                                                                                                                                                                                                                                                                                                      |
| 수명 주기 훅                                 | 어댑터 관찰로 지원됨                                                              | `llm_input`, `llm_output`, `agent_end`, `before_compaction` 및 `after_compaction`이 실제 Codex 모드 페이로드와 함께 실행됩니다.                                                                                                                                                                                                                                                                                                                                                       |
| 최종 답변 수정 게이트                        | 네이티브 훅 릴레이를 통해 지원됨                                                  | Codex `Stop`은 `before_agent_finalize`로 릴레이되며, `revise`는 최종 처리 전에 Codex에 모델 패스를 한 번 더 요청합니다.                                                                                                                                                                                                                                                                                                                                                              |
| 네이티브 셸, 패치 및 MCP 차단 또는 관찰      | 네이티브 훅 릴레이를 통해 지원됨                                                  | Codex `PreToolUse` 및 `PostToolUse`는 Codex app-server `0.142.0` 이상에서 MCP 페이로드를 포함하여 확정된 네이티브 도구 영역에 대해 릴레이됩니다. 차단은 지원되지만 인수 재작성은 지원되지 않습니다.                                                                                                                                                                                                                                                                                     |
| 네이티브 권한 정책                           | Codex app-server 승인 및 호환성 네이티브 훅 릴레이를 통해 지원됨                  | Codex app-server 승인 요청은 Codex 검토 후 OpenClaw를 통해 라우팅됩니다. Codex가 가디언 검토 전에 `PermissionRequest`를 내보내므로, 네이티브 승인 모드에서는 `PermissionRequest` 네이티브 훅 릴레이를 명시적으로 활성화해야 합니다.                                                                                                                                                                                                                                                       |
| app-server 실행 궤적 캡처                    | 지원됨                                                                            | OpenClaw는 app-server로 보낸 요청과 app-server에서 수신한 알림을 기록합니다.                                                                                                                                                                                                                                                                                                                                                                                                          |

Codex 런타임 v1에서 지원되지 않는 항목:

| 영역                                                | V1 경계                                                                                                                                               | 향후 경로                                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 네이티브 도구 인수 변경                             | Codex 네이티브 도구 실행 전 훅은 차단할 수 있지만, OpenClaw는 Codex 네이티브 도구 인수를 재작성하지 않습니다.                                         | 대체 도구 입력을 위한 Codex 훅/스키마 지원이 필요합니다.                                         |
| 편집 가능한 Codex 네이티브 대화 기록                | Codex가 정식 네이티브 스레드 기록을 소유합니다. OpenClaw는 미러를 소유하고 향후 컨텍스트를 투영할 수 있지만, 지원되지 않는 내부 요소를 변경해서는 안 됩니다. | 네이티브 스레드 조작이 필요한 경우 명시적인 Codex app-server API를 추가합니다.                    |
| Codex 네이티브 도구 레코드용 `tool_result_persist` | 해당 훅은 Codex 네이티브 도구 레코드가 아니라 OpenClaw 소유 대화 기록 쓰기를 변환합니다.                                                             | 변환된 레코드를 미러링할 수 있지만, 정식 레코드를 재작성하려면 Codex 지원이 필요합니다.           |
| 풍부한 네이티브 Compaction 메타데이터               | OpenClaw는 네이티브 Compaction을 요청할 수 있지만, 안정적인 유지/삭제 목록, 토큰 변화량, 완료 요약 또는 요약 페이로드를 수신하지 않습니다.             | 더 풍부한 Codex Compaction 이벤트가 필요합니다.                                                  |
| Compaction 개입                                     | OpenClaw는 Plugin이나 컨텍스트 엔진이 네이티브 Codex Compaction을 거부, 재작성 또는 대체하도록 허용하지 않습니다.                                    | Plugin이 네이티브 Compaction을 거부하거나 재작성해야 하는 경우 Codex Compaction 전/후 훅을 추가합니다. |
| 바이트 단위로 동일한 모델 API 요청 캡처             | OpenClaw는 app-server 요청과 알림을 캡처할 수 있지만, Codex 코어가 최종 OpenAI API 요청을 내부적으로 생성합니다.                                     | Codex 모델 요청 추적 이벤트 또는 디버그 API가 필요합니다.                                       |

## 네이티브 권한 및 MCP 정보 요청

`PermissionRequest`의 경우 OpenClaw는 정책에서 결정한 경우에만 명시적인 허용 또는 거부
결정을 반환합니다. 결정 없음 결과는 허용이 아닙니다. Codex는 이를 훅 결정 없음으로
처리하고 자체 가디언 또는 사용자 승인 경로로 넘어갑니다.

Codex app-server 승인 모드는 기본적으로 이 네이티브 훅을 생략합니다. 이는
`permission_request`가 `nativeHookRelay.events`에 명시적으로 포함되거나
호환성 런타임이 이를 설치하지 않는 한 적용됩니다.

운영자가 Codex 네이티브 권한 요청에 `allow-always`를 선택하면 OpenClaw는
해당 공급자/세션/도구 입력/cwd의 정확한 지문을 제한된 세션 기간 동안
기억합니다. 기억된 결정은 의도적으로 정확히 일치하는 경우에만 적용됩니다.
명령, 인수, 도구 페이로드 또는 cwd가 변경되면 새로운 승인이 필요합니다.

Codex가 `_meta.codex_approval_kind`를 `"mcp_tool_call"`로 표시하면 Codex MCP
도구 승인 정보 요청이 OpenClaw의 Plugin 승인 흐름을 통해 라우팅됩니다. Codex
`request_user_input` 프롬프트는 원래 채팅으로 다시 전송되며, 다음으로 대기 중인
후속 메시지는 추가 컨텍스트로 유도되는 대신 해당 네이티브 서버 요청에 응답합니다.
그 밖의 MCP 정보 요청은 기본적으로 거부됩니다.

이러한 프롬프트를 전달하는 일반 Plugin 승인 흐름에 대해서는
[Plugin 권한 요청](/ko/plugins/plugin-permission-requests)을 참조하세요.

## 큐 조정

활성 실행 큐 조정은 Codex app-server `turn/steer`에 매핑됩니다. 기본
`messages.queue.mode: "steer"`를 사용하면 OpenClaw는 구성된 대기 시간 동안
조정 모드 채팅 메시지를 일괄 처리한 후 도착 순서대로 하나의 `turn/steer`
요청으로 전송합니다.

Codex 검토 및 수동 Compaction 턴은 동일 턴의 조종을 거부할 수 있습니다. 이
경우 OpenClaw는 프롬프트를 시작하기 전에 활성 실행이 끝날 때까지
기다립니다. 메시지가 기본적으로 조종되는 대신 대기열에 들어가야 할 때는
`/queue followup` 또는 `/queue collect`를 사용하세요. [조종 대기열](/ko/concepts/queue-steering)을 참조하세요.

## Codex 피드백 업로드

네이티브 Codex 하네스의 세션에서 `/diagnostics [note]`가 승인되면
OpenClaw는 관련 Codex 스레드에 대해 Codex 앱 서버의 `feedback/upload`도
호출합니다. 여기에는 나열된 각 스레드의 로그와, 가능한 경우 생성된 Codex
하위 스레드의 로그가 포함됩니다.

업로드는 Codex의 일반 피드백 경로를 통해 OpenAI 서버로 전송됩니다. 해당
앱 서버에서 Codex 피드백이 비활성화되어 있으면 명령이 앱 서버 오류를
반환합니다. 완료된 진단 응답에는 전송된 스레드의 채널,
OpenClaw 세션 ID, Codex 스레드 ID 및 로컬 `codex resume <thread-id>`
명령이 나열됩니다.

승인을 거부하거나 무시하면 OpenClaw는 해당 Codex ID를 출력하지
않으며 Codex 피드백도 전송하지 않습니다. 업로드는 로컬
Gateway 진단 내보내기를 대체하지 않습니다. 승인, 개인정보 보호, 로컬 번들 및
그룹 채팅 동작은 [진단 내보내기](/ko/gateway/diagnostics)를 참조하세요.

전체 Gateway 진단 번들 없이 현재 연결된 스레드의 Codex 피드백만
업로드하려는 경우에만 `/codex diagnostics [note]`를 사용하세요.

## Compaction 및 트랜스크립트 미러

선택한 모델이 Codex 하네스를 사용하는 경우 네이티브 스레드 Compaction은
Codex 앱 서버가 담당합니다. OpenClaw는 Codex 턴에 대해 사전 Compaction을
실행하거나, Codex Compaction을 컨텍스트 엔진 Compaction으로 대체하거나,
네이티브 Compaction을 시작할 수 없을 때 OpenClaw 또는 공개 OpenAI 요약으로
대체하지 않습니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset` 및 향후
모델이나 하네스 전환을 위해 트랜스크립트 미러를 유지합니다.

`/compact` 또는 Plugin이 요청한 수동 Compaction 작업과 같은 명시적
Compaction 요청은 `thread/compact/start`로 네이티브 Codex Compaction을
시작합니다. OpenClaw는 Codex가 일치하는 `contextCompaction` 완료 항목을
내보낼 때까지 요청과 공유 클라이언트 임대를 유지한 다음 Compaction 턴이
완료되었다고 보고합니다. 해당 종료 턴이 구성된 Compaction 시간 제한을
초과하면 OpenClaw는 네이티브 턴 중단을 요청합니다. Codex가 종료 상태를
보고하거나 중단 RPC를 확인할 때까지 임대와 스레드별 Compaction 펜스가
유지됩니다. Codex가 중단 유예 기간 내에 확인하지 않으면 OpenClaw는 펜스를
해제하기 전에 연결을 폐기합니다. 원격 연결에서는 일치하는 스레드 바인딩도
분리하여 이후 작업이 확인되지 않은 원격 턴과 겹치지 않도록 합니다. 폐기된
연결의 다른 턴은 실패하며 새 클라이언트에서 재시도할 수 있습니다. 클라이언트
종료, 요청 취소 또는 실패한 Compaction 턴은 실패한 작업을 반환합니다. 자동
컨텍스트 압력 Compaction은 Codex가 담당하며, OpenClaw는 수동으로 요청된
트리거에 대해서만 네이티브 Compaction을 시작합니다.

컨텍스트 엔진이 Codex 스레드 부트스트랩 프로젝션을 요청하면 OpenClaw는
도구 호출 이름과 ID, 입력 형태 및 수정된 도구 결과 콘텐츠를 새 Codex
스레드에 투영합니다. 원시 도구 호출 인수 값은 해당 프로젝션에 복사하지
않습니다.

미러에는 사용자 프롬프트, 최종 어시스턴트 텍스트 및 앱 서버가 내보내는 경우
간략한 Codex 추론 또는 계획 레코드가 포함됩니다. OpenClaw는 네이티브
Compaction 시작 및 종료 상태를 기록하지만, 사람이 읽을 수 있는 Compaction
요약이나 Compaction 후 Codex가 유지한 항목의 감사 가능한 목록은 제공하지
않습니다.

Codex가 표준 네이티브 스레드를 소유하므로 `tool_result_persist`는
Codex 네이티브 도구 결과 레코드를 다시 작성하지 않습니다. 이는 OpenClaw가
OpenClaw 소유 세션 트랜스크립트의 도구 결과를 작성할 때만 적용됩니다.

## 미디어 및 전송

OpenClaw는 계속해서 미디어 전송과 미디어 제공자 선택을 담당합니다. 이미지,
비디오, 음악, PDF, TTS 및 미디어 이해에는
`agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, `messages.tts`와 같은 해당 제공자/모델 설정이 사용됩니다.

텍스트, 이미지, 비디오, 음악, TTS, 승인 및 메시징 도구 출력은 계속해서
일반 OpenClaw 전송 경로를 통해 전달되며, 미디어 생성에는 레거시 런타임이
필요하지 않습니다. Codex가 `savedPath`가 포함된 네이티브 이미지 생성 항목을
내보내면 Codex 턴에 어시스턴트 텍스트가 없더라도 OpenClaw는 해당 파일을
그대로 일반 응답 미디어 경로를 통해 전달합니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 참조](/ko/plugins/codex-harness-reference)
- [Codex 감독](/ko/plugins/codex-supervision)
- [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)
- [Plugin 훅](/ko/plugins/hooks)
- [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness)
- [진단 내보내기](/ko/gateway/diagnostics)
- [궤적 내보내기](/ko/tools/trajectory)
