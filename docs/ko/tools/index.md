---
read_when:
    - OpenClaw가 제공하는 도구를 이해하고 싶습니다
    - 도구를 구성하거나 허용 또는 거부해야 합니다
    - 기본 제공 도구, Skills, Plugin 중에서 선택하고 있습니다
summary: 'OpenClaw 도구 및 Plugin 개요: 에이전트가 할 수 있는 일과 확장 방법'
title: 도구 및 Plugin
x-i18n:
    generated_at: "2026-05-07T13:25:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

에이전트가 텍스트 생성 외에 수행하는 모든 작업은 **도구**를 통해 이루어집니다.
도구는 에이전트가 파일을 읽고, 명령을 실행하고, 웹을 탐색하고, 메시지를 보내고,
기기와 상호작용하는 방식입니다.

## 도구, Skills, Plugin

OpenClaw에는 함께 작동하는 세 가지 계층이 있습니다.

<Steps>
  <Step title="도구는 에이전트가 호출하는 것입니다">
    도구는 에이전트가 호출할 수 있는 타입 지정 함수입니다(예: `exec`, `browser`,
    `web_search`, `message`). OpenClaw는 **내장 도구** 세트를 제공하며,
    Plugin은 추가 도구를 등록할 수 있습니다.

    에이전트는 도구를 모델 API로 전송되는 구조화된 함수 정의로 봅니다.

  </Step>

  <Step title="Skills는 에이전트에게 언제 어떻게 사용할지 가르칩니다">
    skill은 시스템 프롬프트에 주입되는 마크다운 파일(`SKILL.md`)입니다.
    Skills는 도구를 효과적으로 사용하기 위한 컨텍스트, 제약 조건, 단계별 지침을
    에이전트에게 제공합니다. Skills는 워크스페이스, 공유 폴더에 있거나
    Plugin 안에 포함되어 제공될 수 있습니다.

    [Skills 참조](/ko/tools/skills) | [Skills 만들기](/ko/tools/creating-skills)

  </Step>

  <Step title="Plugin은 모든 것을 함께 패키징합니다">
    Plugin은 채널, 모델 제공자, 도구, Skills, 음성, 실시간 전사,
    실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색 등
    여러 기능 조합을 등록할 수 있는 패키지입니다. 일부 Plugin은 **코어**이며
    OpenClaw와 함께 제공되고, 다른 Plugin은 **외부**이며 커뮤니티가 npm에 게시합니다.

    [Plugin 설치 및 구성](/ko/tools/plugin) | [직접 만들기](/ko/plugins/building-plugins)

  </Step>
</Steps>

## 내장 도구

이 도구들은 OpenClaw와 함께 제공되며 Plugin을 설치하지 않아도 사용할 수 있습니다.

| 도구                                       | 수행하는 작업                                                          | 페이지                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 셸 명령 실행, 백그라운드 프로세스 관리                       | [Exec](/ko/tools/exec), [Exec 승인](/ko/tools/exec-approvals) |
| `code_execution`                           | 샌드박스 처리된 원격 Python 분석 실행                                  | [Code Execution](/ko/tools/code-execution)                      |
| `browser`                                  | Chromium 브라우저 제어(탐색, 클릭, 스크린샷)              | [Browser](/ko/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 웹 검색, X 게시물 검색, 페이지 콘텐츠 가져오기                    | [Web](/ko/tools/web), [Web Fetch](/ko/tools/web-fetch)             |
| `read` / `write` / `edit`                  | 워크스페이스의 파일 I/O                                             |                                                              |
| `apply_patch`                              | 여러 헝크 파일 패치                                               | [Apply Patch](/ko/tools/apply-patch)                            |
| `message`                                  | 모든 채널로 메시지 보내기                                     | [Agent Send](/ko/tools/agent-send)                              |
| `nodes`                                    | 페어링된 기기 검색 및 대상으로 지정                                    |                                                              |
| `cron` / `gateway`                         | 예약 작업 관리, Gateway 검사, 패치, 재시작 또는 업데이트 |                                                              |
| `image` / `image_generate`                 | 이미지 분석 또는 생성                                            | [이미지 생성](/ko/tools/image-generation)                  |
| `music_generate`                           | 음악 트랙 생성                                                 | [음악 생성](/ko/tools/music-generation)                  |
| `video_generate`                           | 비디오 생성                                                       | [비디오 생성](/ko/tools/video-generation)                  |
| `tts`                                      | 일회성 텍스트 음성 변환                                    | [TTS](/ko/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 세션 관리, 상태, 하위 에이전트 오케스트레이션               | [하위 에이전트](/ko/tools/subagents)                               |
| `session_status`                           | 경량 `/status` 스타일 읽기 및 세션 모델 오버라이드       | [세션 도구](/ko/concepts/session-tool)                      |

이미지 작업에는 분석용으로 `image`를 사용하고, 생성 또는 편집용으로 `image_generate`를 사용합니다. `openai/*`, `google/*`, `fal/*` 또는 다른 기본값이 아닌 이미지 제공자를 대상으로 하는 경우, 먼저 해당 제공자의 인증/API 키를 구성하세요.

음악 작업에는 `music_generate`를 사용합니다. `google/*`, `minimax/*` 또는 다른 기본값이 아닌 음악 제공자를 대상으로 하는 경우, 먼저 해당 제공자의 인증/API 키를 구성하세요.

비디오 작업에는 `video_generate`를 사용합니다. `qwen/*` 또는 다른 기본값이 아닌 비디오 제공자를 대상으로 하는 경우, 먼저 해당 제공자의 인증/API 키를 구성하세요.

워크플로 기반 오디오 생성에는 ComfyUI 같은 Plugin이 등록한 경우
`music_generate`를 사용합니다. 이는 텍스트 음성 변환인 `tts`와는 별개입니다.

`sessions` 그룹의 `session_status`는 경량 상태/읽기 도구입니다.
현재 세션에 대한 `/status` 스타일 질문에 답하고,
선택적으로 세션별 모델 오버라이드를 설정할 수 있습니다. `model=default`는 해당
오버라이드를 지웁니다. `/status`와 마찬가지로 최신 트랜스크립트 사용량 항목에서
희소한 토큰/캐시 카운터와 활성 런타임 모델 레이블을 보강할 수 있습니다.

`gateway`는 Gateway 작업을 위한 소유자 전용 런타임 도구입니다.

- 편집 전 하나의 경로 범위 구성 하위 트리에 대한 `config.schema.lookup`
- 현재 구성 스냅샷 + 해시를 위한 `config.get`
- 재시작을 포함한 부분 구성 업데이트를 위한 `config.patch`
- 전체 구성 교체에만 사용하는 `config.apply`
- 명시적 자체 업데이트 + 재시작을 위한 `update.run`

부분 변경에는 `config.schema.lookup` 후 `config.patch`를 선호하세요. 전체 구성을 의도적으로 교체할 때만
`config.apply`를 사용하세요.
더 넓은 구성 문서는 [구성](/ko/gateway/configuration) 및
[구성 참조](/ko/gateway/configuration-reference)를 읽으세요.
이 도구는 또한 `tools.exec.ask` 또는 `tools.exec.security` 변경을 거부합니다.
레거시 `tools.bash.*` 별칭은 동일한 보호된 exec 경로로 정규화됩니다.

### Plugin 제공 도구

Plugin은 추가 도구를 등록할 수 있습니다. 몇 가지 예는 다음과 같습니다.

- [Canvas](/ko/plugins/reference/canvas) — Node Canvas 제어 및 A2UI 렌더링을 위한 실험적 번들 Plugin
- [Diffs](/ko/tools/diffs) — diff 뷰어 및 렌더러
- [LLM Task](/ko/tools/llm-task) — 구조화된 출력을 위한 JSON 전용 LLM 단계
- [Lobster](/ko/tools/lobster) — 재개 가능한 승인을 지원하는 타입 지정 워크플로 런타임
- [음악 생성](/ko/tools/music-generation) — 워크플로 기반 제공자를 포함한 공유 `music_generate` 도구
- [OpenProse](/ko/prose) — 마크다운 우선 워크플로 오케스트레이션
- [Tokenjuice](/ko/tools/tokenjuice) — 시끄러운 `exec` 및 `bash` 도구 결과 압축

Plugin 도구는 여전히 `api.registerTool(...)`로 작성되며
Plugin 매니페스트의 `contracts.tools` 목록에 선언됩니다. OpenClaw는 검색 중 검증된
도구 설명자를 캡처하고 Plugin 소스와 계약별로 캐시하므로,
이후 도구 계획에서 Plugin 런타임 로딩을 건너뛸 수 있습니다. 도구 실행은 여전히
소유 Plugin을 로드하고 실시간 등록 구현을 호출합니다.

## 도구 구성

### 허용 및 거부 목록

구성의 `tools.allow` / `tools.deny`를 통해 에이전트가 호출할 수 있는 도구를 제어합니다.
거부는 항상 허용보다 우선합니다.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

명시적 허용 목록이 호출 가능한 도구로 해석되지 않으면 OpenClaw는 닫힌 상태로 실패합니다.
예를 들어 `tools.allow: ["query_db"]`는 로드된 Plugin이 실제로
`query_db`를 등록한 경우에만 작동합니다. 허용 목록과 일치하는 내장 도구, Plugin 또는 번들 MCP 도구가
없으면, 도구 결과를 환각할 수 있는 텍스트 전용 실행으로 계속 진행하지 않고
모델 호출 전에 실행이 중단됩니다.

### 도구 프로필

`tools.profile`은 `allow`/`deny`가 적용되기 전에 기본 허용 목록을 설정합니다.
에이전트별 오버라이드: `agents.list[].tools.profile`.

| 프로필     | 포함하는 항목                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 모든 코어 및 선택적 Plugin 도구, 더 넓은 명령/제어 접근을 위한 제한 없는 기준선                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status`만                                                                                                                             |

<Note>
`tools.profile: "messaging"`는 채널 중심 에이전트를 위해 의도적으로 좁게 설정되어 있습니다.
파일 시스템, 런타임, 브라우저, 캔버스, 노드, Cron, Gateway 제어 같은 더 넓은 명령/제어 도구는 제외합니다. 더 넓은 명령/제어 접근을 위한 제한 없는 기준선으로 `tools.profile: "full"`을 사용한 다음, 필요할 때
`tools.allow` / `tools.deny`로 접근을 줄이세요.
</Note>

`coding`은 경량 웹 도구(`web_search`, `web_fetch`, `x_search`)를 포함하지만
전체 브라우저 제어 도구는 포함하지 않습니다. 브라우저 자동화는 실제
세션과 로그인된 프로필을 구동할 수 있으므로, `tools.alsoAllow: ["browser"]` 또는 에이전트별
`agents.list[].tools.alsoAllow: ["browser"]`로 명시적으로 추가하세요.

<Note>
제한적인 프로필(`messaging`, `minimal`) 아래에서 `tools.exec` 또는 `tools.fs`를 구성해도 프로필의 허용 목록이 암묵적으로 확장되지는 않습니다. 제한적인 프로필에서 해당 구성 섹션을 사용하려면 명시적 `tools.alsoAllow` 항목을 추가하세요(예: exec에는 `["exec", "process"]`, fs에는 `["read", "write", "edit"]`). 일치하는 `alsoAllow` 권한 없이 구성 섹션이 있으면 OpenClaw는 시작 경고를 기록합니다.
</Note>

`coding` 및 `messaging` 프로필은 또한 Plugin 키 `bundle-mcp` 아래에 구성된 번들 MCP 도구를 허용합니다.
프로필이 일반 내장 도구는 유지하되 구성된 모든 MCP 도구를 숨기도록 하려면
`tools.deny: ["bundle-mcp"]`를 추가하세요.
`minimal` 프로필은 번들 MCP 도구를 포함하지 않습니다.

예시(기본적으로 가장 넓은 도구 표면):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### 도구 그룹

허용/거부 목록에서 `group:*` 축약형을 사용하세요.

| 그룹               | 도구                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution(`bash`는 `exec`의 별칭으로 허용됩니다)                                      |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | 번들된 Canvas Plugin이 활성화된 경우 browser, canvas                                                      |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | 모든 기본 제공 OpenClaw 도구(Plugin 도구 제외)                                                            |

`sessions_history`는 범위가 제한되고 안전 필터가 적용된 회상 보기를 반환합니다. assistant 텍스트에서
thinking 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 tool-call XML
페이로드(`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` 및 잘린 tool-call 블록 포함),
격하된 tool-call 스캐폴딩, 유출된 ASCII/전각 모델 제어
토큰, 잘못된 형식의 MiniMax tool-call XML을 제거한 다음, 원시 트랜스크립트 덤프처럼 동작하는 대신
수정/잘라내기와 가능한 초과 크기 행 placeholder를 적용합니다.

### Provider별 제한 사항

전역 기본값을 변경하지 않고 특정 provider의 도구를 제한하려면
`tools.byProvider`를 사용하세요.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
