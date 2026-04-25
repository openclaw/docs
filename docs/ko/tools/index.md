---
read_when:
    - OpenClaw가 제공하는 도구가 무엇인지 이해하고 싶습니다
    - 도구를 구성, 허용 또는 거부해야 합니다
    - 기본 제공 도구, Skills 및 Plugin 중에서 선택하고 있습니다
summary: 'OpenClaw 도구 및 Plugin 개요: 에이전트가 할 수 있는 일과 확장 방법'
title: 도구 및 Plugin
x-i18n:
    generated_at: "2026-04-25T18:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72f1257f5e556b57238f9a0ff01574510f310250cf6da73c74f9f2421fa2c917
    source_path: tools/index.md
    workflow: 15
---

에이전트가 텍스트 생성 외에 수행하는 모든 작업은 **도구**를 통해 이루어집니다.
도구는 에이전트가 파일을 읽고, 명령을 실행하고, 웹을 탐색하고, 메시지를 보내고,
기기와 상호작용하는 방식입니다.

## 도구, Skills 및 Plugin

OpenClaw에는 함께 작동하는 세 가지 계층이 있습니다:

<Steps>
  <Step title="도구는 에이전트가 호출하는 대상입니다">
    도구는 에이전트가 호출할 수 있는 타입이 지정된 함수입니다(예: `exec`, `browser`,
    `web_search`, `message`). OpenClaw는 **기본 제공 도구** 집합을 제공하며,
    Plugin은 추가 도구를 등록할 수 있습니다.

    에이전트는 도구를 모델 API에 전송되는 구조화된 함수 정의로 인식합니다.

  </Step>

  <Step title="Skills는 언제 어떻게 사용할지 가르칩니다">
    skill은 시스템 프롬프트에 주입되는 markdown 파일(`SKILL.md`)입니다.
    Skills는 도구를 효과적으로 사용하기 위한 컨텍스트, 제약 조건, 단계별 안내를
    에이전트에 제공합니다. Skills는 워크스페이스, 공유 폴더에 있거나,
    Plugin 내부에 포함되어 제공될 수 있습니다.

    [Skills 참조](/ko/tools/skills) | [Skills 만들기](/ko/tools/creating-skills)

  </Step>

  <Step title="Plugins는 모든 것을 함께 패키징합니다">
    Plugin은 다양한 capability 조합을 등록할 수 있는 패키지입니다:
    채널, 모델 provider, 도구, Skills, 음성, realtime transcription,
    realtime voice, 미디어 이해, 이미지 생성, 비디오 생성,
    web fetch, web search 등. 일부 Plugin은 **core**(OpenClaw와 함께 제공)이고,
    다른 Plugin은 **external**(커뮤니티가 npm에 게시)입니다.

    [Plugin 설치 및 구성](/ko/tools/plugin) | [직접 빌드하기](/ko/plugins/building-plugins)

  </Step>
</Steps>

## 기본 제공 도구

이 도구들은 OpenClaw와 함께 제공되며 Plugin을 설치하지 않아도 사용할 수 있습니다:

| 도구                                       | 기능                                                                  | 페이지                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 셸 명령 실행, 백그라운드 프로세스 관리                                | [Exec](/ko/tools/exec), [Exec 승인](/ko/tools/exec-approvals)      |
| `code_execution`                           | 샌드박스된 원격 Python 분석 실행                                      | [Code Execution](/ko/tools/code-execution)                      |
| `browser`                                  | Chromium 브라우저 제어(탐색, 클릭, 스크린샷)                          | [Browser](/ko/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 웹 검색, X 게시물 검색, 페이지 콘텐츠 가져오기                        | [Web](/ko/tools/web), [Web Fetch](/ko/tools/web-fetch)             |
| `read` / `write` / `edit`                  | 워크스페이스 내 파일 I/O                                              |                                                              |
| `apply_patch`                              | 여러 hunk로 구성된 파일 패치                                          | [Apply Patch](/ko/tools/apply-patch)                            |
| `message`                                  | 모든 채널로 메시지 전송                                               | [Agent Send](/ko/tools/agent-send)                              |
| `canvas`                                   | node Canvas 구동(present, eval, snapshot)                             |                                                              |
| `nodes`                                    | 페어링된 기기 탐색 및 대상 지정                                       |                                                              |
| `cron` / `gateway`                         | 예약 작업 관리, Gateway 검사/패치/재시작/업데이트                     |                                                              |
| `image` / `image_generate`                 | 이미지 분석 또는 생성                                                 | [Image Generation](/ko/tools/image-generation)                  |
| `music_generate`                           | 음악 트랙 생성                                                        | [Music Generation](/ko/tools/music-generation)                  |
| `video_generate`                           | 비디오 생성                                                           | [Video Generation](/ko/tools/video-generation)                  |
| `tts`                                      | 일회성 text-to-speech 변환                                            | [TTS](/ko/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 세션 관리, 상태 확인, 하위 에이전트 오케스트레이션                    | [Sub-agents](/ko/tools/subagents)                               |
| `session_status`                           | 가벼운 `/status` 스타일 읽기 및 세션 모델 override                    | [Session Tools](/ko/concepts/session-tool)                      |

이미지 작업에는 분석용으로 `image`, 생성 또는 편집용으로 `image_generate`를 사용하세요. `openai/*`, `google/*`, `fal/*` 또는 다른 비기본 이미지 provider를 대상으로 한다면, 먼저 해당 provider의 auth/API 키를 구성하세요.

음악 작업에는 `music_generate`를 사용하세요. `google/*`, `minimax/*` 또는 다른 비기본 음악 provider를 대상으로 한다면, 먼저 해당 provider의 auth/API 키를 구성하세요.

비디오 작업에는 `video_generate`를 사용하세요. `qwen/*` 또는 다른 비기본 비디오 provider를 대상으로 한다면, 먼저 해당 provider의 auth/API 키를 구성하세요.

워크플로 기반 오디오 생성에는 ComfyUI와 같은 Plugin이 등록한
`music_generate`를 사용하세요. 이것은 text-to-speech인 `tts`와는 별개입니다.

`session_status`는 sessions 그룹의 가벼운 상태/읽기 도구입니다.
현재 세션에 대한 `/status` 스타일 질문에 답하며,
선택적으로 세션별 모델 override를 설정할 수 있습니다. `model=default`는 해당
override를 지웁니다. `/status`와 마찬가지로 희소한 토큰/캐시 카운터와
최신 transcript usage 항목의 활성 런타임 모델 레이블을 보강할 수 있습니다.

`gateway`는 Gateway 작업을 위한 소유자 전용 런타임 도구입니다:

- 편집 전 경로 범위 구성 하위 트리 1개를 위한 `config.schema.lookup`
- 현재 구성 스냅샷 + 해시를 위한 `config.get`
- 재시작을 동반한 부분 구성 업데이트를 위한 `config.patch`
- 전체 구성 교체 전용 `config.apply`
- 명시적 self-update + 재시작을 위한 `update.run`

부분 변경에는 `config.schema.lookup` 후 `config.patch`를 우선 사용하세요.
`config.apply`는 전체 구성을 의도적으로 교체할 때만 사용하세요.
이 도구는 `tools.exec.ask` 또는 `tools.exec.security` 변경도 거부합니다.
레거시 `tools.bash.*` 별칭은 동일한 보호된 exec 경로로 정규화됩니다.

### Plugin이 제공하는 도구

Plugin은 추가 도구를 등록할 수 있습니다. 몇 가지 예:

- [Diffs](/ko/tools/diffs) — diff 뷰어 및 렌더러
- [LLM Task](/ko/tools/llm-task) — 구조화된 출력을 위한 JSON 전용 LLM 단계
- [Lobster](/ko/tools/lobster) — 재개 가능한 승인을 갖춘 타입 지정 워크플로 런타임
- [Music Generation](/ko/tools/music-generation) — 워크플로 기반 provider가 사용하는 공용 `music_generate` 도구
- [OpenProse](/ko/prose) — markdown 우선 워크플로 오케스트레이션
- [Tokenjuice](/ko/tools/tokenjuice) — 잡음이 많은 `exec` 및 `bash` 도구 결과를 간결하게 정리

## 도구 구성

### 허용 및 거부 목록

config의 `tools.allow` / `tools.deny`를 통해 에이전트가 호출할 수 있는 도구를
제어합니다. 거부는 항상 허용보다 우선합니다.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw는 명시적 허용 목록이 호출 가능한 도구 없이 해석되면 fail closed합니다.
예를 들어 `tools.allow: ["query_db"]`는 로드된 Plugin이 실제로
`query_db`를 등록한 경우에만 작동합니다. 기본 제공 도구, Plugin 도구, 번들 MCP 도구 중
허용 목록과 일치하는 것이 없으면, 실행은 모델 호출 전에 중단되며,
도구 결과를 환각할 수 있는 텍스트 전용 실행으로 계속되지 않습니다.

### 도구 프로필

`tools.profile`은 `allow`/`deny` 적용 전에 기본 허용 목록을 설정합니다.
에이전트별 override: `agents.list[].tools.profile`.

| 프로필     | 포함 항목                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`     | 제한 없음(설정하지 않은 것과 동일)                                                                                                               |
| `coding`   | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                       |
| `minimal`  | `session_status`만                                                                                                                               |

`coding`에는 가벼운 웹 도구(`web_search`, `web_fetch`, `x_search`)가 포함되지만,
전체 브라우저 제어 도구는 포함되지 않습니다. 브라우저 자동화는 실제
세션과 로그인된 프로필을 구동할 수 있으므로,
`tools.alsoAllow: ["browser"]` 또는 에이전트별
`agents.list[].tools.alsoAllow: ["browser"]`로 명시적으로 추가하세요.

`coding` 및 `messaging` 프로필은 Plugin 키 `bundle-mcp` 아래의
구성된 번들 MCP 도구도 허용합니다.
프로필이 일반 기본 제공 도구는 유지하되 구성된 모든 MCP 도구를 숨기게 하려면
`tools.deny: ["bundle-mcp"]`를 추가하세요.
`minimal` 프로필에는 번들 MCP 도구가 포함되지 않습니다.

### 도구 그룹

허용/거부 목록에서 `group:*` 축약 표기를 사용하세요:

| 그룹               | 도구                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`는 `exec`의 별칭으로 허용됨)                                         |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | 모든 기본 제공 OpenClaw 도구(Plugin 도구 제외)                                                            |

`sessions_history`는 제한되고 안전 필터링된 회수 보기만 반환합니다. 여기서는
thinking 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 tool-call XML
payload(`including <tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, 그리고 잘린 tool-call 블록 포함),
격하된 tool-call 스캐폴딩, 유출된 ASCII/전각 모델 제어
토큰, 잘못된 형식의 MiniMax tool-call XML을 assistant 텍스트에서 제거한 뒤,
원시 transcript 덤프처럼 동작하는 대신
redaction/truncation 및 필요한 경우 oversized-row placeholder를 적용합니다.

### provider별 제한

전역 기본값을 변경하지 않고 특정 provider에 대한 도구를 제한하려면 `tools.byProvider`를 사용하세요:

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
