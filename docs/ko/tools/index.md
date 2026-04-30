---
read_when:
    - OpenClaw가 제공하는 도구가 무엇인지 이해하고 싶습니다
    - 도구를 구성하거나 허용 또는 거부해야 합니다
    - 내장 도구, Skills, Plugin 중에서 선택하고 있습니다
summary: 'OpenClaw 도구 및 Plugin 개요: 에이전트가 할 수 있는 일과 확장하는 방법'
title: 도구 및 Plugin
x-i18n:
    generated_at: "2026-04-30T16:30:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

에이전트가 텍스트 생성 이외에 수행하는 모든 일은 **도구**를 통해 이루어집니다.
도구는 에이전트가 파일을 읽고, 명령을 실행하고, 웹을 탐색하고, 메시지를 보내고,
기기와 상호작용하는 방식입니다.

## 도구, Skills, Plugin

OpenClaw에는 함께 작동하는 세 가지 계층이 있습니다.

<Steps>
  <Step title="도구는 에이전트가 호출하는 대상입니다">
    도구는 에이전트가 호출할 수 있는 타입 지정 함수입니다(예: `exec`, `browser`,
    `web_search`, `message`). OpenClaw는 **기본 제공 도구** 세트를 함께 제공하며
    Plugin은 추가 도구를 등록할 수 있습니다.

    에이전트는 도구를 모델 API로 전송되는 구조화된 함수 정의로 봅니다.

  </Step>

  <Step title="Skills는 에이전트에게 언제 어떻게 사용할지 가르칩니다">
    Skill은 시스템 프롬프트에 주입되는 마크다운 파일(`SKILL.md`)입니다.
    Skills는 에이전트가 도구를 효과적으로 사용하는 데 필요한 컨텍스트, 제약 조건,
    단계별 지침을 제공합니다. Skills는 작업 영역, 공유 폴더에 있거나
    Plugin 안에 포함되어 제공됩니다.

    [Skills 참조](/ko/tools/skills) | [Skills 만들기](/ko/tools/creating-skills)

  </Step>

  <Step title="Plugin은 모든 것을 함께 패키징합니다">
    Plugin은 채널, 모델 제공자, 도구, Skills, 음성, 실시간 전사,
    실시간 음성, 미디어 이해, 이미지 생성, 동영상 생성, 웹 가져오기, 웹 검색 등
    여러 기능 조합을 등록할 수 있는 패키지입니다. 일부 Plugin은 **코어**이며
    OpenClaw와 함께 제공되고, 다른 Plugin은 **외부**이며 커뮤니티가 npm에 게시합니다.

    [Plugin 설치 및 구성](/ko/tools/plugin) | [직접 빌드하기](/ko/plugins/building-plugins)

  </Step>
</Steps>

## 기본 제공 도구

이 도구들은 OpenClaw와 함께 제공되며 Plugin을 설치하지 않아도 사용할 수 있습니다.

| 도구                                       | 수행 작업                                                              | 페이지                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 셸 명령 실행, 백그라운드 프로세스 관리                                 | [Exec](/ko/tools/exec), [Exec 승인](/ko/tools/exec-approvals)      |
| `code_execution`                           | 샌드박스된 원격 Python 분석 실행                                       | [코드 실행](/ko/tools/code-execution)                           |
| `browser`                                  | Chromium 브라우저 제어(탐색, 클릭, 스크린샷)                           | [브라우저](/ko/tools/browser)                                   |
| `web_search` / `x_search` / `web_fetch`    | 웹 검색, X 게시물 검색, 페이지 콘텐츠 가져오기                         | [웹](/ko/tools/web), [웹 가져오기](/ko/tools/web-fetch)            |
| `read` / `write` / `edit`                  | 작업 영역의 파일 I/O                                                   |                                                              |
| `apply_patch`                              | 다중 헝크 파일 패치                                                    | [패치 적용](/ko/tools/apply-patch)                              |
| `message`                                  | 모든 채널에 메시지 보내기                                              | [에이전트 전송](/ko/tools/agent-send)                           |
| `canvas`                                   | Node Canvas 구동(표시, 평가, 스냅샷)                                   |                                                              |
| `nodes`                                    | 페어링된 기기 탐색 및 대상으로 지정                                    |                                                              |
| `cron` / `gateway`                         | 예약 작업 관리, Gateway 검사, 패치, 재시작 또는 업데이트               |                                                              |
| `image` / `image_generate`                 | 이미지 분석 또는 생성                                                  | [이미지 생성](/ko/tools/image-generation)                       |
| `music_generate`                           | 음악 트랙 생성                                                         | [음악 생성](/ko/tools/music-generation)                         |
| `video_generate`                           | 동영상 생성                                                            | [동영상 생성](/ko/tools/video-generation)                       |
| `tts`                                      | 일회성 텍스트 음성 변환                                                | [TTS](/ko/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 세션 관리, 상태, 하위 에이전트 오케스트레이션                          | [하위 에이전트](/ko/tools/subagents)                            |
| `session_status`                           | 경량 `/status` 스타일 리드백 및 세션 모델 재정의                       | [세션 도구](/ko/concepts/session-tool)                          |

이미지 작업에는 분석용으로 `image`를 사용하고, 생성 또는 편집용으로 `image_generate`를 사용하세요. `openai/*`, `google/*`, `fal/*` 또는 다른 기본값이 아닌 이미지 제공자를 대상으로 하는 경우 먼저 해당 제공자의 인증/API 키를 구성하세요.

음악 작업에는 `music_generate`를 사용하세요. `google/*`, `minimax/*` 또는 다른 기본값이 아닌 음악 제공자를 대상으로 하는 경우 먼저 해당 제공자의 인증/API 키를 구성하세요.

동영상 작업에는 `video_generate`를 사용하세요. `qwen/*` 또는 다른 기본값이 아닌 동영상 제공자를 대상으로 하는 경우 먼저 해당 제공자의 인증/API 키를 구성하세요.

워크플로 기반 오디오 생성에는 ComfyUI 같은 Plugin이 등록한 경우
`music_generate`를 사용하세요. 이는 텍스트 음성 변환인 `tts`와 별개입니다.

`sessions` 그룹의 경량 상태/리드백 도구는 `session_status`입니다.
현재 세션에 대한 `/status` 스타일 질문에 답하고, 선택적으로 세션별 모델 재정의를
설정할 수 있습니다. `model=default`는 해당 재정의를 지웁니다.
`/status`와 마찬가지로 최신 트랜스크립트 사용량 항목에서 희소 토큰/캐시 카운터와
활성 런타임 모델 레이블을 보충할 수 있습니다.

`gateway`는 Gateway 작업을 위한 소유자 전용 런타임 도구입니다.

- 편집 전 하나의 경로 범위 구성 하위 트리에 대한 `config.schema.lookup`
- 현재 구성 스냅샷 + 해시용 `config.get`
- 재시작이 포함된 부분 구성 업데이트용 `config.patch`
- 전체 구성 교체에만 사용하는 `config.apply`
- 명시적 자체 업데이트 + 재시작용 `update.run`

부분 변경에는 `config.schema.lookup` 다음 `config.patch`를 선호하세요. 전체 구성을 의도적으로 교체할 때만
`config.apply`를 사용하세요.
더 넓은 구성 문서는 [구성](/ko/gateway/configuration) 및
[구성 참조](/ko/gateway/configuration-reference)를 읽으세요.
이 도구는 `tools.exec.ask` 또는 `tools.exec.security` 변경도 거부합니다.
레거시 `tools.bash.*` 별칭은 동일한 보호된 exec 경로로 정규화됩니다.

### Plugin 제공 도구

Plugin은 추가 도구를 등록할 수 있습니다. 몇 가지 예시는 다음과 같습니다.

- [Diffs](/ko/tools/diffs) — diff 뷰어 및 렌더러
- [LLM 작업](/ko/tools/llm-task) — 구조화된 출력을 위한 JSON 전용 LLM 단계
- [Lobster](/ko/tools/lobster) — 재개 가능한 승인이 있는 타입 지정 워크플로 런타임
- [음악 생성](/ko/tools/music-generation) — 워크플로 기반 제공자가 있는 공유 `music_generate` 도구
- [OpenProse](/ko/prose) — 마크다운 우선 워크플로 오케스트레이션
- [Tokenjuice](/ko/tools/tokenjuice) — 노이즈가 많은 `exec` 및 `bash` 도구 결과 압축

## 도구 구성

### 허용 및 거부 목록

구성의 `tools.allow` / `tools.deny`로 에이전트가 호출할 수 있는 도구를 제어하세요.
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
`query_db`를 등록한 경우에만 작동합니다. 기본 제공 도구, Plugin 또는 번들 MCP 도구 중
허용 목록과 일치하는 것이 없으면, 도구 결과를 환각할 수 있는
텍스트 전용 실행으로 계속하는 대신 모델 호출 전에 실행이 중지됩니다.

### 도구 프로필

`tools.profile`은 `allow`/`deny`가 적용되기 전의 기본 허용 목록을 설정합니다.
에이전트별 재정의: `agents.list[].tools.profile`.

| 프로필      | 포함 항목                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 더 넓은 명령/제어 접근을 위한 제한 없는 기준값입니다. `tools.profile`을 설정하지 않은 것과 같습니다                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status`만                                                                                                                                |

<Note>
`tools.profile: "messaging"`는 채널 중심 에이전트를 위해 의도적으로 좁게 설계되었습니다.
파일시스템, 런타임, 브라우저, 캔버스, 노드, Cron, Gateway 제어 같은 더 넓은 명령/제어 도구는 제외합니다.
더 넓은 명령/제어 접근을 위한 제한 없는 기준값으로 `tools.profile: "full"`을 사용한 다음,
필요할 때 `tools.allow` / `tools.deny`로 접근을 줄이세요.
</Note>

`coding`에는 경량 웹 도구(`web_search`, `web_fetch`, `x_search`)가 포함되지만
전체 브라우저 제어 도구는 포함되지 않습니다. 브라우저 자동화는 실제 세션과
로그인된 프로필을 구동할 수 있으므로 `tools.alsoAllow: ["browser"]` 또는 에이전트별
`agents.list[].tools.alsoAllow: ["browser"]`로 명시적으로 추가하세요.

<Note>
제한적인 프로필(`messaging`, `minimal`)에서 `tools.exec` 또는 `tools.fs`를 구성해도 프로필의 허용 목록이 암묵적으로 넓어지지는 않습니다. 제한적인 프로필에서 해당 구성 섹션을 사용하려면 명시적 `tools.alsoAllow` 항목(예: exec용 `["exec", "process"]`, fs용 `["read", "write", "edit"]`)을 추가하세요. 구성 섹션이 있지만 일치하는 `alsoAllow` 권한이 없으면 OpenClaw는 시작 경고를 기록합니다.
</Note>

`coding` 및 `messaging` 프로필은 Plugin 키 `bundle-mcp` 아래 구성된 번들 MCP 도구도 허용합니다.
프로필의 일반 기본 제공 도구는 유지하되 구성된 모든 MCP 도구를 숨기려면
`tools.deny: ["bundle-mcp"]`를 추가하세요.
`minimal` 프로필에는 번들 MCP 도구가 포함되지 않습니다.

예시(기본적으로 가장 넓은 도구 표면):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### 도구 그룹

허용/거부 목록에서 `group:*` 축약형을 사용하세요:

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
| `group:openclaw`   | 모든 내장 OpenClaw 도구(Plugin 도구 제외)                                                                |

`sessions_history`는 범위가 제한되고 안전 필터링된 회상 보기를 반환합니다. 원시 기록 덤프로
작동하는 대신, thinking 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 도구 호출 XML
페이로드(`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함),
강등된 도구 호출 스캐폴딩, 유출된 ASCII/전각 모델 제어
토큰, 그리고 어시스턴트 텍스트의 잘못된 MiniMax 도구 호출 XML을 제거한 다음,
수정/잘라내기 및 가능한 과대 행 자리표시자를 적용합니다.

### 제공자별 제한 사항

전역 기본값을 변경하지 않고 특정 제공자의 도구를 제한하려면 `tools.byProvider`를 사용하세요.

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
