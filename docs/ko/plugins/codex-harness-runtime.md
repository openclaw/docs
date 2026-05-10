---
read_when:
    - Codex 하네스 런타임 지원 계약이 필요합니다
    - 네이티브 Codex 도구, 훅, Compaction 또는 피드백 업로드를 디버깅하고 있습니다
    - PI와 Codex 하네스 턴 전반에서 Plugin 동작을 변경하고 있습니다
summary: Codex 하네스를 위한 런타임 경계, 훅, 도구, 권한 및 진단
title: Codex 하네스 런타임
x-i18n:
    generated_at: "2026-05-10T19:42:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

이 페이지는 Codex harness 턴의 런타임 계약을 문서화합니다. 설정과
라우팅은 [Codex harness](/ko/plugins/codex-harness)에서 시작하세요. 구성 필드는
[Codex harness reference](/ko/plugins/codex-harness-reference)를 참조하세요.

## 개요

Codex 모드는 내부에서 다른 모델 호출을 사용하는 PI가 아닙니다. Codex는
네이티브 모델 루프의 더 많은 부분을 소유하며, OpenClaw는 그 경계에 맞춰
Plugin, 도구, 세션, 진단 표면을 조정합니다.

OpenClaw는 여전히 채널 라우팅, 세션 파일, 표시되는 메시지 전달,
OpenClaw 동적 도구, 승인, 미디어 전달, 트랜스크립트 미러를 소유합니다.
Codex는 표준 네이티브 스레드, 네이티브 모델 루프, 네이티브 도구
연속 실행, 네이티브 Compaction을 소유합니다.

## 스레드 바인딩과 모델 변경

OpenClaw 세션이 기존 Codex 스레드에 연결되면 다음 턴은 현재 선택된
OpenAI 모델, 승인 정책, 샌드박스, 서비스 티어를 app-server에 다시 보냅니다.
`openai/gpt-5.5`에서 `openai/gpt-5.2`로 전환하면 스레드 바인딩은 유지되지만
Codex에 새로 선택한 모델로 계속 진행하도록 요청합니다.

## 표시되는 응답과 Heartbeat

소스 채팅 턴이 Codex harness를 통해 실행될 때 배포가
`messages.visibleReplies`를 명시적으로 구성하지 않았다면 표시되는 응답은 기본적으로
OpenClaw `message` 도구를 사용합니다. 에이전트는 여전히 Codex 턴을 비공개로
끝낼 수 있으며, `message(action="send")`를 호출할 때만 채널에 게시합니다.
직접 채팅 최종 응답을 레거시 자동 전달 경로에 유지하려면
`messages.visibleReplies: "automatic"`을 설정하세요.

Codex Heartbeat 턴은 기본적으로 검색 가능한 OpenClaw 도구 카탈로그에
`heartbeat_respond`도 받으므로, 에이전트는 최종 텍스트에 해당 제어 흐름을
인코딩하지 않고도 깨우기를 조용히 유지할지 알림을 보낼지 기록할 수 있습니다.

Heartbeat 전용 주도성 지침은 Heartbeat 턴 자체에서 Codex 협업 모드
개발자 지침으로 전송됩니다. 일반 채팅 턴은 일반 런타임 프롬프트에
Heartbeat 철학을 유지하는 대신 Codex Default 모드를 복원합니다.

## 훅 경계

Codex harness에는 세 가지 훅 계층이 있습니다.

| 계층                                  | 소유자                   | 목적                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin 훅                    | OpenClaw                 | PI와 Codex harness 전반의 제품/Plugin 호환성.                       |
| Codex app-server 확장 미들웨어        | OpenClaw 번들 Plugin     | OpenClaw 동적 도구 주변의 턴별 어댑터 동작.                         |
| Codex 네이티브 훅                     | Codex                    | Codex 구성의 저수준 Codex 수명주기와 네이티브 도구 정책.            |

OpenClaw는 OpenClaw Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역 Codex
`hooks.json` 파일을 사용하지 않습니다. 지원되는 네이티브 도구와 권한 브리지의 경우,
OpenClaw는 `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Stop`에 대한
스레드별 Codex 구성을 주입합니다.

Codex app-server 승인이 활성화된 경우, 즉 `approvalPolicy`가 `"never"`가 아니면
기본으로 주입되는 네이티브 훅 구성은 `PermissionRequest`를 생략하여 Codex의
app-server 검토자와 OpenClaw의 승인 브리지가 검토 후 실제 에스컬레이션을
처리하도록 합니다. 운영자는 호환성 릴레이가 필요할 때 `nativeHookRelay.events`에
`permission_request`를 명시적으로 추가할 수 있습니다.

`SessionStart`와 `UserPromptSubmit` 같은 다른 Codex 훅은 Codex 수준 제어로
남습니다. v1 계약에서는 OpenClaw Plugin 훅으로 노출되지 않습니다.

OpenClaw 동적 도구의 경우, Codex가 호출을 요청한 뒤 OpenClaw가 도구를
실행하므로 OpenClaw는 harness 어댑터에서 자신이 소유한 Plugin 및 미들웨어
동작을 실행합니다. Codex 네이티브 도구의 경우, Codex가 표준 도구 레코드를
소유합니다. OpenClaw는 선택한 이벤트를 미러링할 수 있지만, Codex가 app-server
또는 네이티브 훅 콜백을 통해 해당 작업을 노출하지 않는 한 네이티브 Codex
스레드를 다시 작성할 수 없습니다.

Compaction 및 LLM 수명주기 프로젝션은 네이티브 Codex 훅 명령이 아니라
Codex app-server 알림과 OpenClaw 어댑터 상태에서 옵니다. OpenClaw의
`before_compaction`, `after_compaction`, `llm_input`, `llm_output` 이벤트는
어댑터 수준 관찰이며, Codex의 내부 요청이나 Compaction 페이로드를 바이트 단위로
동일하게 캡처한 것이 아닙니다.

Codex 네이티브 `hook/started` 및 `hook/completed` app-server 알림은 궤적과
디버깅을 위해 `codex_app_server.hook` 에이전트 이벤트로 프로젝션됩니다.
이 알림은 OpenClaw Plugin 훅을 호출하지 않습니다.

## V1 지원 계약

Codex 런타임 v1에서 지원됨:

| 표면                                          | 지원                                                                             | 이유                                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex를 통한 OpenAI 모델 루프                 | 지원됨                                                                           | Codex app-server가 OpenAI 턴, 네이티브 스레드 재개, 네이티브 도구 연속 실행을 소유합니다.                                                                                                                  |
| OpenClaw 채널 라우팅 및 전달                  | 지원됨                                                                           | Telegram, Discord, Slack, WhatsApp, iMessage 및 기타 채널은 모델 런타임 외부에 유지됩니다.                                                                                                                 |
| OpenClaw 동적 도구                            | 지원됨                                                                           | Codex가 OpenClaw에 이러한 도구 실행을 요청하므로 OpenClaw는 실행 경로에 남습니다.                                                                                                                         |
| 프롬프트 및 컨텍스트 Plugin                   | 지원됨                                                                           | OpenClaw는 스레드를 시작하거나 재개하기 전에 프롬프트 오버레이를 만들고 컨텍스트를 Codex 턴에 프로젝션합니다.                                                                                              |
| 컨텍스트 엔진 수명주기                        | 지원됨                                                                           | 조립, 수집, 턴 이후 유지관리, 컨텍스트 엔진 Compaction 조정이 Codex 턴에서 실행됩니다.                                                                                                                     |
| 동적 도구 훅                                  | 지원됨                                                                           | `before_tool_call`, `after_tool_call`, 도구 결과 미들웨어가 OpenClaw 소유 동적 도구 주변에서 실행됩니다.                                                                                                  |
| 수명주기 훅                                   | 어댑터 관찰로 지원됨                                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, `after_compaction`이 정직한 Codex 모드 페이로드와 함께 실행됩니다.                                                                            |
| 최종 답변 수정 게이트                         | 네이티브 훅 릴레이를 통해 지원됨                                                  | Codex `Stop`이 `before_agent_finalize`로 릴레이됩니다. `revise`는 최종화 전에 Codex에 모델 패스를 한 번 더 요청합니다.                                                                                     |
| 네이티브 셸, 패치, MCP 차단 또는 관찰         | 네이티브 훅 릴레이를 통해 지원됨                                                  | Codex `PreToolUse`와 `PostToolUse`가 Codex app-server `0.125.0` 이상에서 MCP 페이로드를 포함해 커밋된 네이티브 도구 표면에 대해 릴레이됩니다. 차단은 지원되지만 인수 재작성은 지원되지 않습니다.          |
| 네이티브 권한 정책                            | Codex app-server 승인과 호환성 네이티브 훅 릴레이를 통해 지원됨                  | Codex app-server 승인 요청은 Codex 검토 후 OpenClaw를 통해 라우팅됩니다. `PermissionRequest` 네이티브 훅 릴레이는 Codex가 보호자 검토 전에 이를 내보내므로 네이티브 승인 모드에서 옵트인 방식입니다.      |
| app-server 궤적 캡처                          | 지원됨                                                                           | OpenClaw는 app-server에 보낸 요청과 수신한 app-server 알림을 기록합니다.                                                                                                                                   |

Codex 런타임 v1에서 지원되지 않음:

| 표면                                                | V1 경계                                                                                                                                         | 향후 경로                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 네이티브 도구 인수 변경                             | Codex 네이티브 사전 도구 훅은 차단할 수 있지만, OpenClaw는 Codex 네이티브 도구 인수를 다시 작성하지 않습니다.                                  | 대체 도구 입력에 대한 Codex 훅/스키마 지원이 필요합니다.                                  |
| 편집 가능한 Codex 네이티브 트랜스크립트 기록        | Codex는 표준 네이티브 스레드 기록을 소유합니다. OpenClaw는 미러를 소유하고 향후 컨텍스트를 프로젝션할 수 있지만, 지원되지 않는 내부를 변경해서는 안 됩니다. | 네이티브 스레드 수술이 필요하면 명시적인 Codex app-server API를 추가합니다.               |
| Codex 네이티브 도구 레코드용 `tool_result_persist`  | 해당 훅은 Codex 네이티브 도구 레코드가 아니라 OpenClaw 소유 트랜스크립트 쓰기를 변환합니다.                                                    | 변환된 레코드를 미러링할 수는 있지만, 표준 재작성에는 Codex 지원이 필요합니다.            |
| 풍부한 네이티브 Compaction 메타데이터               | OpenClaw는 Compaction 시작과 완료를 관찰하지만, 안정적인 유지/삭제 목록, 토큰 델타, 요약 페이로드를 받지 않습니다.                            | 더 풍부한 Codex Compaction 이벤트가 필요합니다.                                            |
| Compaction 개입                                     | 현재 OpenClaw Compaction 훅은 Codex 모드에서 알림 수준입니다.                                                                                   | Plugin이 네이티브 Compaction을 거부하거나 재작성해야 한다면 Codex 사전/사후 Compaction 훅을 추가합니다. |
| 바이트 단위 모델 API 요청 캡처                      | OpenClaw는 app-server 요청과 알림을 캡처할 수 있지만, Codex 코어가 최종 OpenAI API 요청을 내부적으로 만듭니다.                                  | Codex 모델 요청 추적 이벤트 또는 디버그 API가 필요합니다.                                 |

## 네이티브 권한과 MCP elicitations

`PermissionRequest`의 경우, OpenClaw는 정책이 결정할 때만 명시적인 허용 또는 거부
결정을 반환합니다. 결정 없음 결과는 허용이 아닙니다. Codex는 이를 훅 결정 없음으로
처리하고 자체 보호자 또는 사용자 승인 경로로 넘어갑니다.

Codex app-server 승인 모드는 기본적으로 이 네이티브 훅을 생략합니다. 이 동작은
`permission_request`가 `nativeHookRelay.events`에 명시적으로 포함되었거나
호환성 런타임이 이를 설치한 경우에 적용됩니다.

운영자가 Codex 네이티브 권한 요청에 대해 `allow-always`를 선택하면,
OpenClaw는 제한된 세션 기간 동안 해당 provider/session/tool input/cwd 지문을
정확히 기억합니다. 기억된 결정은 의도적으로 정확히 일치하는 경우에만
적용됩니다. 명령, 인수, 도구 페이로드 또는 cwd가 바뀌면 새 승인이
생성됩니다.

Codex가 `_meta.codex_approval_kind`를 `"mcp_tool_call"`로 표시하면
Codex MCP 도구 승인 요청은 OpenClaw의 Plugin 승인 흐름을 통해
라우팅됩니다. Codex `request_user_input` 프롬프트는 원래 채팅으로 다시
전송되며, 다음 대기열 후속 메시지는 추가 컨텍스트로 조향되는 대신 해당
네이티브 서버 요청에 응답합니다. 그 밖의 MCP 요청은 닫힌 상태로
실패합니다.

## 대기열 조향

활성 실행 대기열 조향은 Codex 앱 서버 `turn/steer`에 매핑됩니다. 기본
`messages.queue.mode: "steer"`를 사용하면 OpenClaw는 설정된 정숙 기간
동안 대기열에 쌓인 채팅 메시지를 묶고, 도착 순서대로 하나의 `turn/steer`
요청으로 전송합니다. 레거시 `queue` 모드는 별도의 `turn/steer` 요청을
전송합니다.

Codex 검토 및 수동 Compaction 턴은 같은 턴의 조향을 거부할 수 있습니다.
이 경우 OpenClaw는 선택한 모드가 폴백을 허용할 때 후속 대기열을 사용합니다.
[조향 대기열](/ko/concepts/queue-steering)을 참조하세요.

## Codex 피드백 업로드

네이티브 Codex 하네스를 사용하는 세션에서 `/diagnostics [note]`가 승인되면,
OpenClaw는 관련 Codex 스레드에 대해 Codex 앱 서버 `feedback/upload`도
호출합니다. 업로드는 가능한 경우 앱 서버에 각 나열된 스레드와 생성된 Codex
하위 스레드의 로그를 포함하도록 요청합니다.

업로드는 Codex의 일반 피드백 경로를 통해 OpenAI 서버로 전달됩니다. 해당
앱 서버에서 Codex 피드백이 비활성화되어 있으면 명령은 앱 서버 오류를
반환합니다. 완료된 진단 응답에는 전송된 스레드의 채널, OpenClaw 세션 ID,
Codex 스레드 ID, 로컬 `codex resume <thread-id>` 명령이 나열됩니다.

승인을 거부하거나 무시하면 OpenClaw는 해당 Codex ID를 출력하지 않으며
Codex 피드백을 전송하지 않습니다. 업로드는 로컬 Gateway 진단 내보내기를
대체하지 않습니다. 승인, 개인정보 보호, 로컬 번들, 그룹 채팅 동작은
[진단 내보내기](/ko/gateway/diagnostics)를 참조하세요.

전체 Gateway 진단 번들 없이 현재 연결된 스레드의 Codex 피드백 업로드만
특별히 원하는 경우에만 `/codex diagnostics [note]`를 사용하세요.

## Compaction 및 트랜스크립트 미러

선택한 모델이 Codex 하네스를 사용하면 네이티브 스레드 Compaction은 Codex
앱 서버에 위임됩니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset`, 향후
모델 또는 하네스 전환을 위해 트랜스크립트 미러를 유지합니다.

미러에는 사용자 프롬프트, 최종 어시스턴트 텍스트, 그리고 앱 서버가 내보낼 때
가벼운 Codex 추론 또는 계획 기록이 포함됩니다. 현재 OpenClaw는 네이티브
Compaction 시작 및 완료 신호만 기록합니다. 아직 사람이 읽을 수 있는
Compaction 요약이나 Compaction 후 Codex가 유지한 항목의 감사 가능한 목록은
노출하지 않습니다.

Codex가 표준 네이티브 스레드를 소유하므로, `tool_result_persist`는 현재
Codex 네이티브 도구 결과 기록을 다시 작성하지 않습니다. OpenClaw가
OpenClaw 소유 세션 트랜스크립트 도구 결과를 작성할 때만 적용됩니다.

## 미디어 및 전달

OpenClaw는 계속 미디어 전달과 미디어 제공자 선택을 소유합니다. 이미지,
비디오, 음악, PDF, TTS 및 미디어 이해는 `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel`, `messages.tts` 같은 일치하는 제공자/모델
설정을 사용합니다.

텍스트, 이미지, 비디오, 음악, TTS, 승인 및 메시징 도구 출력은 계속 일반
OpenClaw 전달 경로를 통해 처리됩니다. 미디어 생성에는 PI가 필요하지 않습니다.
Codex가 `savedPath`가 있는 네이티브 이미지 생성 항목을 내보내면, Codex 턴에
어시스턴트 텍스트가 없더라도 OpenClaw는 해당 정확한 파일을 일반 응답 미디어
경로를 통해 전달합니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 참조](/ko/plugins/codex-harness-reference)
- [네이티브 Codex plugins](/ko/plugins/codex-native-plugins)
- [Plugin 훅](/ko/plugins/hooks)
- [에이전트 하네스 plugins](/ko/plugins/sdk-agent-harness)
- [진단 내보내기](/ko/gateway/diagnostics)
- [Trajectory 내보내기](/ko/tools/trajectory)
