---
doc-schema-version: 1
read_when:
    - OpenClaw가 제공하는 도구를 이해하고 싶은 경우
    - 기본 제공 도구, Skills, Plugin 중에서 선택하고 있습니다
    - 도구 정책, 자동화 또는 에이전트 조율을 위한 올바른 문서 진입점이 필요합니다
summary: 'OpenClaw 도구, Skills, Plugin 개요: 에이전트가 호출할 수 있는 항목과 이를 확장하는 방법'
title: 개요
x-i18n:
    generated_at: "2026-05-12T00:59:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

이 페이지를 사용하여 올바른 Capabilities 표면을 선택하세요. **도구**는 호출 가능한
작업이고, **Skills**는 에이전트에게 작업 방법을 가르치며, **Plugin**은 도구,
공급자, 채널, 훅, 패키지된 Skills 같은 런타임 기능을 추가합니다.

이 문서는 개요 및 라우팅 페이지입니다. 전체 도구 정책, 기본값,
그룹 멤버십, 공급자 제한, 구성 필드는
[도구 및 사용자 지정 공급자](/ko/gateway/config-tools)를 사용하세요.

## 여기서 시작하기

대부분의 에이전트는 내장 도구 범주로 시작한 다음, 에이전트가 더 적은 도구를 보거나
명시적인 호스트 접근이 필요할 때만 정책을 조정하세요.

| 필요한 작업...                               | 먼저 사용할 항목                                 | 다음 읽을 문서                                                            |
| ------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| 에이전트가 기존 기능으로 작업하도록 허용하기 | [내장 도구](#built-in-tool-categories)    | [도구 범주](#built-in-tool-categories)                            |
| 에이전트가 호출할 수 있는 항목 제어하기       | [도구 정책](#configure-access-and-approvals) | [도구 및 사용자 지정 공급자](/ko/gateway/config-tools)                     |
| 에이전트에게 워크플로 가르치기               | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/ko/tools/skills) 및 [Skills 만들기](/ko/tools/creating-skills)   |
| 새 통합 또는 런타임 표면 추가하기            | [Plugin](#extend-capabilities)                | [Plugin](/ko/tools/plugin) 및 [Plugin 빌드](/ko/plugins/building-plugins) |
| 나중에 또는 백그라운드에서 작업 실행하기      | [자동화](/ko/automation)                      | [자동화 개요](/ko/automation)                                      |
| 여러 에이전트 또는 하니스 조정하기           | [하위 에이전트](/ko/tools/subagents)                 | [ACP 에이전트](/ko/tools/acp-agents) 및 [에이전트 보내기](/ko/tools/agent-send)     |
| 대규모 PI 도구 카탈로그 검색하기             | [도구 검색](/ko/tools/tool-search)              | [도구 검색](/ko/tools/tool-search)                                       |

## 도구, Skills 또는 Plugin 선택하기

<Steps>
  <Step title="에이전트가 작업해야 할 때 도구 사용">
    도구는 에이전트가 호출할 수 있는 형식화된 함수입니다. 예: `exec`, `browser`,
    `web_search`, `message`, `image_generate`. 에이전트가 데이터를 읽거나,
    파일을 변경하거나, 메시지를 보내거나, 공급자를 호출하거나, 다른 시스템을 조작해야 할 때
    도구를 사용하세요. 표시되는 도구는 구조화된 함수 정의로 모델에 전송됩니다.

    모델은 활성 프로필, 허용/거부 정책, 공급자 제한, 샌드박스 상태, 채널 권한,
    Plugin 가용성을 통과한 도구만 볼 수 있습니다.

  </Step>

  <Step title="에이전트에 지침이 필요할 때 Skills 사용">
    Skills는 에이전트 프롬프트에 로드되는 `SKILL.md` 지침 팩입니다. 에이전트가
    필요한 도구를 이미 갖고 있지만 반복 가능한 워크플로, 검토 기준, 명령 시퀀스,
    또는 운영 제약이 필요할 때 Skills를 사용하세요.

    Skills는 워크스페이스, 공유 Skills 디렉터리, 관리형 OpenClaw
    Skills 루트, 또는 Plugin 패키지에 위치할 수 있습니다.

    [Skills](/ko/tools/skills) | [Skills 만들기](/ko/tools/creating-skills) | [Skills 구성](/ko/tools/skills-config)

  </Step>

  <Step title="OpenClaw에 새 기능이 필요할 때 Plugin 사용">
    Plugin은 도구, Skills, 채널, 모델 공급자, 음성, 실시간
    음성, 미디어 생성, 웹 검색, 웹 가져오기, 훅, 기타 런타임
    기능을 추가할 수 있습니다. 기능에 코드, 자격 증명,
    수명 주기 훅, 매니페스트 메타데이터, 또는 설치 가능한 패키징이 있을 때 Plugin을 사용하세요.
    기존 Plugin은 ClawHub, npm, git, 로컬 디렉터리 또는
    아카이브에서 설치할 수 있습니다.

    [Plugin 설치 및 구성](/ko/tools/plugin) | [Plugin 빌드](/ko/plugins/building-plugins) | [Plugin SDK](/ko/plugins/sdk-overview)

  </Step>
</Steps>

## 내장 도구 범주

이 표는 표면을 알아볼 수 있도록 대표 도구를 나열합니다. 전체 정책 참조는
아닙니다. 정확한 그룹, 기본값, 허용/거부
의미론은 [도구 및 사용자 지정 공급자](/ko/gateway/config-tools)를 사용하세요.

| 범주                   | 에이전트가 필요한 작업...                                                    | 대표 도구                                                            | 다음 읽을 문서                                                          |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 런타임                 | 명령 실행, 프로세스 관리, 또는 공급자 기반 Python 분석 사용                  | `exec`, `process`, `code_execution`                                  | [Exec](/ko/tools/exec), [코드 실행](/ko/tools/code-execution)           |
| 파일                   | 워크스페이스 파일 읽기 및 변경                                               | `read`, `write`, `edit`, `apply_patch`                               | [Apply patch](/ko/tools/apply-patch)                                      |
| 웹                     | 웹 검색, X 게시물 검색, 또는 읽을 수 있는 페이지 콘텐츠 가져오기             | `web_search`, `x_search`, `web_fetch`                                | [웹 도구](/ko/tools/web), [웹 가져오기](/ko/tools/web-fetch)                 |
| 브라우저               | 브라우저 세션 조작                                                           | `browser`                                                            | [브라우저](/ko/tools/browser)                                              |
| 메시징 및 채널         | 답장 또는 채널 작업 보내기                                                   | `message`                                                            | [에이전트 보내기](/ko/tools/agent-send)                                        |
| 세션 및 에이전트       | 세션 검사, 작업 위임, 다른 실행 조정, 또는 상태 보고                         | `sessions_*`, `subagents`, `agents_list`, `session_status`           | [하위 에이전트](/ko/tools/subagents), [세션 도구](/ko/concepts/session-tool) |
| 자동화                 | 작업 예약 또는 백그라운드 이벤트에 응답                                      | `cron`, `heartbeat_respond`                                          | [자동화](/ko/automation)                                              |
| Gateway 및 노드        | Gateway 상태 또는 페어링된 대상 장치 검사                                    | `gateway`, `nodes`                                                   | [Gateway 구성](/ko/gateway/configuration), [노드](/ko/nodes)       |
| 미디어                 | 미디어 분석, 생성 또는 말하기                                                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [미디어 개요](/ko/tools/media-overview)                                |
| 대규모 PI 카탈로그     | 모든 스키마를 모델에 보내지 않고 많은 적격 도구 검색 및 호출                | `tool_search_code`, `tool_search`, `tool_describe`                   | [도구 검색](/ko/tools/tool-search)                                      |

<Note>
도구 검색은 실험적인 PI 에이전트 표면입니다. Codex 하니스 실행은
`tools.toolSearch` 대신 Codex 네이티브 코드 모드, 네이티브 도구 검색,
지연된 동적 도구, 중첩 도구 호출을 사용합니다.
</Note>

## Plugin 제공 도구

Plugin은 추가 도구를 등록할 수 있습니다. Plugin 작성자는
`api.registerTool(...)`과 매니페스트의 `contracts.tools`를 통해 도구를 연결합니다.
계약 세부 정보는 [Plugin SDK](/ko/plugins/sdk-overview) 및 [Plugin 매니페스트](/ko/plugins/manifest)를
사용하세요.

일반적인 Plugin 제공 도구는 다음과 같습니다.

- 파일 및 markdown diff를 렌더링하는 [Diffs](/ko/tools/diffs)
- JSON 전용 워크플로 단계용 [LLM Task](/ko/tools/llm-task)
- 재개 가능한 승인으로 형식화된 워크플로를 제공하는 [Lobster](/ko/tools/lobster)
- 노이즈가 많은 `exec` 및 `bash` 도구 출력을 압축하는
  [Tokenjuice](/ko/tools/tokenjuice)
- 모든 스키마를 프롬프트에 넣지 않고 대규모 도구
  카탈로그를 발견하고 호출하는 [도구 검색](/ko/tools/tool-search)
- 노드 Canvas 제어 및 A2UI
  렌더링을 위한 [Canvas](/ko/plugins/reference/canvas)

## 접근 및 승인 구성

도구 정책은 모델 호출 전에 적용됩니다. 정책이 도구를 제거하면, 모델은 해당 턴에
그 도구의 스키마를 받지 않습니다. 실행은 전역 구성, 에이전트별 구성, 채널 정책,
공급자 제한, 샌드박스 규칙, 소유자 전용 게이팅, 또는 Plugin 가용성 때문에
도구를 잃을 수 있습니다.

- [도구 및 사용자 지정 공급자](/ko/gateway/config-tools)는 도구 프로필,
  허용/거부 목록, 공급자별 제한, 루프 감지,
  공급자 기반 도구 설정을 문서화합니다.
- [Exec 승인](/ko/tools/exec-approvals)은 호스트 명령 승인
  정책을 문서화합니다.
- [상승된 exec](/ko/tools/elevated)는 샌드박스 외부의 제어된 실행을
  문서화합니다.
- [샌드박스 vs 도구 정책 vs 상승됨](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)은 어떤 계층이 파일 및 프로세스 접근을 제어하는지 설명합니다.
- [에이전트별 샌드박스 및 도구 제한](/ko/tools/multi-agent-sandbox-tools)은
  위임된 실행의 에이전트별 제한을 문서화합니다.

## 기능 확장

OpenClaw가 수행해야 하는 작업에 따라 확장 경로를 선택하세요.

- [Plugin](/ko/tools/plugin)으로 기존 Plugin을 설치하거나 관리합니다.
- [Plugin 빌드](/ko/plugins/building-plugins)로 새 통합, 공급자, 채널, 도구, 또는 훅을 빌드합니다.
- [Skills](/ko/tools/skills) 및
  [Skills 만들기](/ko/tools/creating-skills)로 재사용 가능한 에이전트 지침을 추가하거나 조정합니다.
- 워크플로가 Plugin으로 배포되는 Skills 번들에 속할 때
  [Skills 워크숍](/ko/plugins/skill-workshop)으로 재사용 가능한 워크플로 자료를 패키징합니다.
- 구현 계약이 필요할 때 [Plugin SDK](/ko/plugins/sdk-overview) 및 [Plugin 매니페스트](/ko/plugins/manifest)를 사용합니다.

## 누락된 도구 문제 해결

모델이 도구를 보거나 호출할 수 없다면, 현재 턴의 유효 정책부터 시작하세요.

1. [도구 및 사용자 지정 공급자](/ko/gateway/config-tools)에서 활성 프로필, `tools.allow`, `tools.deny`를 확인합니다.
2. [도구 및 사용자 지정 공급자](/ko/gateway/config-tools)에서 공급자별 제한을 확인하고 선택한
   [모델 공급자](/ko/concepts/model-providers)가 도구 형태를 지원하는지 확인합니다.
3. [샌드박스 vs 도구 정책 vs 상승됨](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) 및 [상승된 exec](/ko/tools/elevated)로 채널 권한, 샌드박스 상태, 상승된 접근을 확인합니다.
4. [Plugin](/ko/tools/plugin)에서 소유 Plugin이 설치 및 활성화되어 있는지 확인합니다.
5. 위임된 실행의 경우
   [에이전트별 샌드박스 및 도구 제한](/ko/tools/multi-agent-sandbox-tools)에서 에이전트별 제한을 확인합니다.
6. 대규모 PI 카탈로그의 경우 실행이 직접 도구 노출을 사용하는지
   [도구 검색](/ko/tools/tool-search)을 사용하는지 확인합니다.

## 관련 항목

- Cron, 작업, Heartbeat, 약속, 훅, 상시 지시, Task Flow에 대한 [자동화](/ko/automation)
- 에이전트 모델, 세션, 메모리, 다중 에이전트 조정에 대한 [에이전트](/ko/concepts/agent)
- 표준 도구 정책 참조를 위한 [도구 및 사용자 지정 공급자](/ko/gateway/config-tools)
- Plugin 설치 및 관리를 위한 [Plugin](/ko/tools/plugin)
- Plugin 작성자 참조를 위한 [Plugin SDK](/ko/plugins/sdk-overview)
- Skills 로드 순서, 게이팅, 구성을 위한 [Skills](/ko/tools/skills)
- 압축된 PI 도구 카탈로그 발견을 위한 [도구 검색](/ko/tools/tool-search)
