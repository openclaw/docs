---
doc-schema-version: 1
read_when:
    - OpenClaw이 제공하는 도구를 이해하려고 합니다
    - 기본 제공 도구, Skills, Plugin 중에서 선택하고 있습니다
    - 도구 정책, 자동화 또는 에이전트 조정을 위한 올바른 문서 진입점이 필요합니다
summary: 'OpenClaw 도구, Skills 및 Plugin 개요: 에이전트가 호출할 수 있는 기능과 이를 확장하는 방법'
title: 개요
x-i18n:
    generated_at: "2026-07-12T15:49:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

이 페이지를 사용하여 적합한 기능 표면을 선택하십시오. **도구**는
호출 가능한 작업이고, **Skills**는 에이전트에게 작업 방법을 가르치며, **Plugin**은
도구, 제공자, 채널, 훅, 패키징된 Skills 등의
런타임 기능을 추가합니다.

이 페이지는 개요 및 안내 페이지입니다. 전체 도구 정책, 기본값,
그룹 구성, 제공자 제한 사항 및 구성 필드에 대해서는
[도구 및 사용자 지정 제공자](/ko/gateway/config-tools)를 참조하십시오.

## 여기서 시작하기

대부분의 에이전트에서는 기본 제공 도구 범주로 시작한 다음, 에이전트에 표시되는 도구를
줄여야 하거나 명시적인 호스트 액세스가 필요한 경우에만 정책을 조정하십시오.

| 필요한 작업                                   | 먼저 사용할 항목                              | 다음으로 읽을 문서                                                                                                  |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 에이전트가 기존 기능으로 작업하도록 허용하기 | [기본 제공 도구](#built-in-tool-categories)    | [도구 범주](#built-in-tool-categories)                                                                            |
| 에이전트가 호출할 수 있는 항목 제어하기      | [도구 정책](#configure-access-and-approvals)   | [도구 및 사용자 지정 제공자](/ko/gateway/config-tools)                                                               |
| 에이전트에게 워크플로 가르치기               | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/ko/tools/skills), [Skills 만들기](/ko/tools/creating-skills), [Skills 워크숍](/ko/tools/skill-workshop)          |
| 새로운 통합 또는 런타임 표면 추가하기        | [Plugin](#extend-capabilities)                 | [Plugin](/ko/tools/plugin) 및 [Plugin 빌드하기](/ko/plugins/building-plugins)                                           |
| 나중에 또는 백그라운드에서 작업 실행하기     | [자동화](/ko/automation)                          | [자동화 개요](/ko/automation)                                                                                         |
| 여러 에이전트 또는 하네스 조정하기           | [하위 에이전트](/ko/tools/subagents)              | [ACP 에이전트](/ko/tools/acp-agents) 및 [에이전트 전송](/ko/tools/agent-send)                                           |
| 대규모 OpenClaw 도구 카탈로그 검색하기       | [도구 검색](/ko/tools/tool-search)                | [도구 검색](/ko/tools/tool-search)                                                                                    |

## 도구, Skills 또는 Plugin 선택하기

<Steps>
  <Step title="에이전트가 작업을 수행해야 할 때 도구 사용하기">
    도구는 에이전트가 호출할 수 있는 형식화된 함수입니다. 예를 들면 `exec`, `browser`,
    `web_search`, `message`, `image_generate` 등이 있습니다. 에이전트가
    데이터를 읽거나, 파일을 변경하거나, 메시지를 보내거나, 제공자를 호출하거나,
    다른 시스템을 조작해야 할 때 도구를 사용하십시오. 표시되는 도구는 구조화된
    함수 정의로 모델에 전달됩니다.

    모델에는 활성 프로필, 허용/거부 정책, 제공자 제한 사항,
    샌드박스 상태, 채널 권한 및 Plugin 가용성을 모두 통과한 도구만 표시됩니다.

  </Step>

  <Step title="에이전트에게 지침이 필요할 때 Skills 사용하기">
    Skills는 에이전트 프롬프트에 로드되는 `SKILL.md` 지침 패키지입니다. 에이전트에
    필요한 도구가 이미 있지만 반복 가능한 워크플로, 검토 기준,
    명령 시퀀스 또는 운영 제약 조건이 필요할 때 Skills를 사용하십시오.

    Skills는 워크스페이스, 공유 Skills 디렉터리, 관리되는 OpenClaw
    Skills 루트 또는 Plugin 패키지에 둘 수 있습니다.

    [Skills](/ko/tools/skills) | [Skills 워크숍](/ko/tools/skill-workshop) | [Skills 만들기](/ko/tools/creating-skills) | [Skills 구성](/ko/tools/skills-config)

  </Step>

  <Step title="OpenClaw에 새로운 기능이 필요할 때 Plugin 사용하기">
    Plugin은 도구, Skills, 채널, 모델 제공자, 음성,
    실시간 음성, 미디어 생성, 웹 검색, 웹 가져오기, 훅 및 기타
    런타임 기능을 추가할 수 있습니다. 기능에 코드,
    자격 증명, 수명 주기 훅, 매니페스트 메타데이터 또는 설치 가능한
    패키징이 포함된 경우 Plugin을 사용하십시오. 기존 Plugin은 ClawHub, npm, git,
    로컬 디렉터리 또는 아카이브에서 설치할 수 있습니다.

    [Plugin 설치 및 구성하기](/ko/tools/plugin) | [Plugin 빌드하기](/ko/plugins/building-plugins) | [Plugin SDK](/ko/plugins/sdk-overview)

  </Step>
</Steps>

## 기본 제공 도구 범주

이 표에는 표면을 파악할 수 있도록 대표적인 도구가 나열되어 있습니다. 이 표는
전체 정책 참조 문서가 아닙니다. 정확한 그룹, 기본값 및 허용/거부
의미 체계는 [도구 및 사용자 지정 제공자](/ko/gateway/config-tools)를 참조하십시오.

| 범주                    | 에이전트에 다음 작업이 필요할 때 사용                                        | 대표 도구                                                                                            | 다음으로 읽을 문서                                                                            |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 런타임                  | 명령 실행, 프로세스 관리 또는 제공자 기반 Python 분석 사용                    | `exec`, `process`, `code_execution`                                                                  | [Exec](/ko/tools/exec), [코드 실행](/ko/tools/code-execution)                                     |
| 파일                    | 워크스페이스 파일 읽기 및 변경                                                 | `read`, `write`, `edit`, `apply_patch`                                                               | [패치 적용](/ko/tools/apply-patch)                                                             |
| 웹                      | 웹 검색, X 게시물 검색 또는 읽을 수 있는 페이지 콘텐츠 가져오기               | `web_search`, `x_search`, `web_fetch`                                                                | [웹 도구](/ko/tools/web), [웹 가져오기](/ko/tools/web-fetch)                                      |
| 브라우저                | 브라우저 세션 조작                                                             | `browser`                                                                                            | [브라우저](/ko/tools/browser)                                                                   |
| 메시징 및 채널          | 응답 또는 채널 작업 전송                                                       | `message`                                                                                            | [에이전트 전송](/ko/tools/agent-send)                                                           |
| 세션 및 에이전트        | 세션 검사, 작업 위임, 다른 실행 조정 또는 상태 보고                            | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [목표](/ko/tools/goal), [하위 에이전트](/ko/tools/subagents), [세션 도구](/ko/concepts/session-tool) |
| 자동화                  | 작업 예약 또는 백그라운드 이벤트에 응답                                       | `cron`, `heartbeat_respond`                                                                          | [자동화](/ko/automation)                                                                       |
| Gateway 및 노드         | Gateway 상태 또는 페어링된 대상 기기 검사                                      | `gateway`, `nodes`                                                                                   | [Gateway 구성](/ko/gateway/configuration), [노드](/ko/nodes)                                      |
| 미디어                  | 미디어 분석, 생성 또는 음성 출력                                                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                 | [미디어 개요](/ko/tools/media-overview)                                                        |
| 대규모 OpenClaw 카탈로그 | 모든 스키마를 모델에 전송하지 않고 여러 적격 도구 검색 및 호출                  | `tool_search_code`, `tool_search`, `tool_describe`                                                   | [도구 검색](/ko/tools/tool-search)                                                             |

<Note>
도구 검색은 실험적인 OpenClaw 에이전트 표면입니다. Codex 하네스 실행은
`tools.toolSearch` 대신 Codex 네이티브 코드 모드, 네이티브 도구 검색,
지연된 동적 도구 및 중첩 도구 호출을 사용합니다.
</Note>

## Plugin에서 제공하는 도구

Plugin은 추가 도구를 등록할 수 있습니다. Plugin 작성자는
`api.registerTool(...)`과 매니페스트의 `contracts.tools`를 통해 도구를 연결합니다. 계약 세부 정보는
[Plugin SDK](/ko/plugins/sdk-overview)와 [Plugin 매니페스트](/ko/plugins/manifest)를
참조하십시오.

Plugin에서 제공하는 일반적인 도구는 다음과 같습니다.

- 파일 및 Markdown 차이를 렌더링하는 [차이](/ko/tools/diffs)
- 웹 채팅에서 독립형 인라인 SVG 및 HTML을 표시하는 [위젯 표시](/tools/show-widget)
- JSON 전용 워크플로 단계를 위한 [LLM 작업](/ko/tools/llm-task)
- 재개 가능한 승인이 포함된 형식화된 워크플로를 위한 [Lobster](/ko/tools/lobster)
- 잡음이 많은 `exec` 및 `bash` 도구 출력을 압축하는 [Tokenjuice](/ko/tools/tokenjuice)
- 모든 스키마를 프롬프트에 넣지 않고 대규모 도구 카탈로그를 검색하고 호출하는
  [도구 검색](/ko/tools/tool-search)
- 노드 Canvas 제어 및 A2UI 렌더링을 위한 [Canvas](/ko/plugins/reference/canvas)

## 액세스 및 승인 구성하기

도구 정책은 모델 호출 전에 적용됩니다. 정책에서 도구를 제거하면 모델은
해당 턴에 그 도구의 스키마를 받지 않습니다. 실행은 전역 구성,
에이전트별 구성, 채널 정책, 제공자 제한 사항, 샌드박스 규칙,
채널/런타임 정책 또는 Plugin 가용성 때문에 도구를 잃을 수 있습니다.

- [도구 및 사용자 지정 제공자](/ko/gateway/config-tools)에서는 도구 프로필,
  허용/거부 목록, 제공자별 제한 사항, 루프 감지 및
  제공자 기반 도구 설정을 설명합니다.
- [Exec 승인](/ko/tools/exec-approvals)에서는 호스트 명령 승인
  정책을 설명합니다.
- [상승된 Exec](/ko/tools/elevated)에서는 샌드박스 외부의 제어된 실행을
  설명합니다.
- [샌드박스와 도구 정책 및 상승된 권한 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)에서는
  파일 및 프로세스 액세스를 제어하는 계층을 설명합니다.
- [에이전트별 샌드박스 및 도구 제한 사항](/ko/tools/multi-agent-sandbox-tools)에서는
  위임된 실행에 적용되는 에이전트별 제한 사항을 설명합니다.

## 기능 확장하기

OpenClaw가 수행해야 하는 작업에 따라 확장 경로를 선택하십시오.

- [Plugin](/ko/tools/plugin)으로 기존 Plugin을 설치하거나 관리합니다.
- [Plugin 빌드하기](/ko/plugins/building-plugins)로 새로운 통합, 제공자, 채널, 도구 또는 훅을
  빌드합니다.
- [Skills](/ko/tools/skills) 및 [Skills 만들기](/ko/tools/creating-skills)로 재사용 가능한 에이전트 지침을
  추가하거나 조정합니다.
- 구현 계약이 필요한 경우 [Plugin SDK](/ko/plugins/sdk-overview) 및
  [Plugin 매니페스트](/ko/plugins/manifest)를 사용합니다.

## 누락된 도구 문제 해결하기

모델이 도구를 보거나 호출할 수 없는 경우 현재 턴에 적용되는 유효 정책부터
확인하십시오.

1. [도구 및 사용자 지정 제공자](/ko/gateway/config-tools)에서 활성 프로필,
   `tools.allow` 및 `tools.deny`를 확인합니다.
2. [도구 및 사용자 지정 제공자](/ko/gateway/config-tools)에서 제공자별 제한 사항을
   확인하고, 선택한 [모델 제공자](/ko/concepts/model-providers)가 해당 도구
   형식을 지원하는지 확인합니다.
3. [샌드박스와 도구 정책 및 상승된 권한 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)
   및 [상승된 Exec](/ko/tools/elevated)에서 채널 권한, 샌드박스 상태 및 상승된 액세스를 확인합니다.
4. [Plugin](/ko/tools/plugin)에서 해당 도구를 소유한 Plugin이 설치되고 활성화되어 있는지
   확인합니다.
5. 위임된 실행의 경우 [에이전트별 샌드박스 및 도구 제한 사항](/ko/tools/multi-agent-sandbox-tools)에서
   에이전트별 제한 사항을 확인합니다.
6. 대규모 OpenClaw 카탈로그의 경우 실행에서 직접 도구 노출을 사용하는지
   아니면 [도구 검색](/ko/tools/tool-search)을 사용하는지 확인합니다.

## 관련 항목

- cron, 작업, Heartbeat, 약속, 훅, 상시 지시 및 Task Flow에 관한
  [자동화](/ko/automation)
- 에이전트 모델, 세션, 메모리 및 다중 에이전트 조정에 관한
  [에이전트](/ko/concepts/agent)
- 표준 도구 정책 참조에 관한
  [도구 및 사용자 지정 제공자](/ko/gateway/config-tools)
- Plugin 설치 및 관리에 관한
  [Plugins](/ko/tools/plugin)
- Plugin 작성자 참조를 위한
  [Plugin SDK](/ko/plugins/sdk-overview)
- Skills 로드 순서, 게이팅 및 구성에 관한
  [Skills](/ko/tools/skills)
- 생성 및 검토를 거친 Skills 제작을 위한
  [Skills 워크숍](/ko/tools/skill-workshop)
- 간결한 OpenClaw 도구 카탈로그 탐색을 위한
  [도구 검색](/ko/tools/tool-search)
