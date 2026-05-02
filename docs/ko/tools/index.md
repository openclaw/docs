---
read_when:
    - OpenClaw가 어떤 도구를 제공하는지 이해하려는 경우
    - 도구를 구성하거나 허용 또는 거부해야 합니다
    - 내장 도구, Skills, Plugin 중에서 선택하기
summary: 'OpenClaw 도구 및 Plugin 개요: 에이전트의 기능과 확장 방법'
title: 도구 및 Plugin
x-i18n:
    generated_at: "2026-05-02T21:15:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

에이전트가 텍스트 생성 외에 수행하는 모든 작업은 **도구**를 통해 이루어집니다.
도구는 에이전트가 파일을 읽고, 명령을 실행하고, 웹을 탐색하고, 메시지를 보내고,
디바이스와 상호작용하는 방식입니다.

## 도구, Skills 및 Plugin

OpenClaw에는 함께 작동하는 세 가지 계층이 있습니다.

<Steps>
  <Step title="도구는 에이전트가 호출하는 것입니다">
    도구는 에이전트가 호출할 수 있는 타입이 지정된 함수입니다(예: `exec`, `browser`,
    `web_search`, `message`). OpenClaw는 **기본 제공 도구** 집합을 제공하며
    Plugin은 추가 도구를 등록할 수 있습니다.

    에이전트는 도구를 모델 API로 전송되는 구조화된 함수 정의로 봅니다.

  </Step>

  <Step title="Skills는 에이전트에게 언제, 어떻게 해야 하는지 가르칩니다">
    Skill은 시스템 프롬프트에 주입되는 마크다운 파일(`SKILL.md`)입니다.
    Skills는 에이전트가 도구를 효과적으로 사용하는 데 필요한 컨텍스트, 제약 조건,
    단계별 지침을 제공합니다. Skills는 워크스페이스나 공유 폴더에 있거나
    Plugin 안에 포함되어 제공됩니다.

    [Skills 참조](/ko/tools/skills) | [Skills 만들기](/ko/tools/creating-skills)

  </Step>

  <Step title="Plugin은 모든 것을 함께 패키징합니다">
    Plugin은 기능의 어떤 조합이든 등록할 수 있는 패키지입니다:
    채널, 모델 제공자, 도구, Skills, 음성, 실시간 전사,
    실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성,
    웹 가져오기, 웹 검색 등입니다. 일부 Plugin은 **핵심**(OpenClaw와 함께 제공)이고,
    다른 Plugin은 **외부**(커뮤니티가 npm에 게시)입니다.

    [Plugin 설치 및 구성](/ko/tools/plugin) | [직접 빌드하기](/ko/plugins/building-plugins)

  </Step>
</Steps>

## 기본 제공 도구

이 도구들은 OpenClaw와 함께 제공되며 어떤 Plugin도 설치하지 않고 사용할 수 있습니다:

| 도구                                       | 수행하는 작업                                                          | 페이지                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 셸 명령을 실행하고 백그라운드 프로세스를 관리합니다                       | [Exec](/ko/tools/exec), [Exec 승인](/ko/tools/exec-approvals) |
| `code_execution`                           | 샌드박스 처리된 원격 Python 분석을 실행합니다                                  | [코드 실행](/ko/tools/code-execution)                      |
| `browser`                                  | Chromium 브라우저를 제어합니다(탐색, 클릭, 스크린샷)              | [브라우저](/ko/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 웹을 검색하고, X 게시물을 검색하고, 페이지 콘텐츠를 가져옵니다                    | [웹](/ko/tools/web), [웹 가져오기](/ko/tools/web-fetch)             |
| `read` / `write` / `edit`                  | 워크스페이스의 파일 I/O                                             |                                                              |
| `apply_patch`                              | 여러 헝크로 구성된 파일 패치                                               | [패치 적용](/ko/tools/apply-patch)                            |
| `message`                                  | 모든 채널에서 메시지를 보냅니다                                     | [에이전트 전송](/ko/tools/agent-send)                              |
| `canvas`                                   | Node Canvas를 구동합니다(표시, 평가, 스냅샷)                           |                                                              |
| `nodes`                                    | 페어링된 디바이스를 발견하고 대상으로 지정합니다                                    |                                                              |
| `cron` / `gateway`                         | 예약된 작업을 관리하고, Gateway를 검사, 패치, 재시작 또는 업데이트합니다 |                                                              |
| `image` / `image_generate`                 | 이미지를 분석하거나 생성합니다                                            | [이미지 생성](/ko/tools/image-generation)                  |
| `music_generate`                           | 음악 트랙을 생성합니다                                                 | [음악 생성](/ko/tools/music-generation)                  |
| `video_generate`                           | 비디오를 생성합니다                                                       | [비디오 생성](/ko/tools/video-generation)                  |
| `tts`                                      | 일회성 텍스트 음성 변환을 수행합니다                                    | [TTS](/ko/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 세션 관리, 상태, 하위 에이전트 오케스트레이션               | [하위 에이전트](/ko/tools/subagents)                               |
| `session_status`                           | 가벼운 `/status` 스타일 읽기 반환 및 세션 모델 재정의       | [세션 도구](/ko/concepts/session-tool)                      |

이미지 작업에는 분석용으로 `image`를 사용하고, 생성 또는 편집용으로 `image_generate`를 사용하세요. `openai/*`, `google/*`, `fal/*` 또는 다른 기본값이 아닌 이미지 제공자를 대상으로 하는 경우 먼저 해당 제공자의 인증/API 키를 구성하세요.

음악 작업에는 `music_generate`를 사용하세요. `google/*`, `minimax/*` 또는 다른 기본값이 아닌 음악 제공자를 대상으로 하는 경우 먼저 해당 제공자의 인증/API 키를 구성하세요.

비디오 작업에는 `video_generate`를 사용하세요. `qwen/*` 또는 다른 기본값이 아닌 비디오 제공자를 대상으로 하는 경우 먼저 해당 제공자의 인증/API 키를 구성하세요.

워크플로 기반 오디오 생성에는 ComfyUI 같은 Plugin이 등록한 경우
`music_generate`를 사용하세요. 이는 텍스트 음성 변환인 `tts`와 별개입니다.

`session_status`는 세션 그룹의 가벼운 상태/읽기 반환 도구입니다.
현재 세션에 대한 `/status` 스타일 질문에 답하고, 선택적으로
세션별 모델 재정의를 설정할 수 있습니다. `model=default`는 해당
재정의를 지웁니다. `/status`와 마찬가지로 최신 transcript 사용량 항목에서
희소한 토큰/캐시 카운터와 활성 런타임 모델 레이블을 보강할 수 있습니다.

`gateway`는 Gateway 작업을 위한 소유자 전용 런타임 도구입니다:

- 편집 전 하나의 경로 범위 구성 하위 트리에 대한 `config.schema.lookup`
- 현재 구성 스냅샷 + 해시에 대한 `config.get`
- 재시작을 포함한 부분 구성 업데이트용 `config.patch`
- 전체 구성 교체에만 사용하는 `config.apply`
- 명시적 자체 업데이트 + 재시작용 `update.run`

부분 변경에는 `config.schema.lookup` 후 `config.patch`를 선호하세요. 전체 구성을 의도적으로 교체할 때만
`config.apply`를 사용하세요.
더 넓은 구성 문서는 [구성](/ko/gateway/configuration) 및
[구성 참조](/ko/gateway/configuration-reference)를 읽어보세요.
이 도구는 또한 `tools.exec.ask` 또는 `tools.exec.security` 변경을 거부합니다.
레거시 `tools.bash.*` 별칭은 동일하게 보호되는 exec 경로로 정규화됩니다.

### Plugin 제공 도구

Plugin은 추가 도구를 등록할 수 있습니다. 몇 가지 예시는 다음과 같습니다:

- [Diffs](/ko/tools/diffs) — diff 뷰어 및 렌더러
- [LLM 작업](/ko/tools/llm-task) — 구조화된 출력을 위한 JSON 전용 LLM 단계
- [Lobster](/ko/tools/lobster) — 재개 가능한 승인을 지원하는 타입 지정 워크플로 런타임
- [음악 생성](/ko/tools/music-generation) — 워크플로 기반 제공자를 지원하는 공유 `music_generate` 도구
- [OpenProse](/ko/prose) — 마크다운 우선 워크플로 오케스트레이션
- [Tokenjuice](/ko/tools/tokenjuice) — 노이즈가 많은 `exec` 및 `bash` 도구 결과 압축

Plugin 도구는 여전히 `api.registerTool(...)`로 작성되며
Plugin 매니페스트의 `contracts.tools` 목록에 선언됩니다. OpenClaw는 탐색 중
검증된 도구 설명자를 캡처하고 Plugin 소스와 계약별로 캐시하므로,
이후 도구 계획은 Plugin 런타임 로딩을 건너뛸 수 있습니다. 도구 실행은 여전히
소유 Plugin을 로드하고 라이브로 등록된 구현을 호출합니다.

## 도구 구성

### 허용 및 거부 목록

구성의 `tools.allow` / `tools.deny`를 통해 에이전트가 호출할 수 있는 도구를 제어하세요.
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
예를 들어, `tools.allow: ["query_db"]`는 로드된 Plugin이 실제로
`query_db`를 등록한 경우에만 작동합니다. 기본 제공 도구, Plugin 또는 번들 MCP 도구 중
허용 목록과 일치하는 항목이 없으면, 도구 결과를 환각할 수 있는
텍스트 전용 실행으로 계속 진행하는 대신 모델 호출 전에 실행이 중지됩니다.

### 도구 프로필

`tools.profile`은 `allow`/`deny`가 적용되기 전에 기본 허용 목록을 설정합니다.
에이전트별 재정의: `agents.list[].tools.profile`.

| 프로필     | 포함하는 항목                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 더 넓은 명령/제어 접근을 위한 제한 없는 기준선입니다. `tools.profile`을 설정하지 않은 것과 같습니다                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status`만                                                                                                                             |

<Note>
`tools.profile: "messaging"`는 채널 중심 에이전트를 위해 의도적으로 좁게 구성되어 있습니다.
파일 시스템, 런타임, 브라우저, canvas, nodes, cron, Gateway 제어 같은
더 넓은 명령/제어 도구는 제외합니다. 더 넓은 명령/제어 접근에는
`tools.profile: "full"`을 제한 없는 기준선으로 사용한 다음, 필요할 때
`tools.allow` / `tools.deny`로 접근을 줄이세요.
</Note>

`coding`은 가벼운 웹 도구(`web_search`, `web_fetch`, `x_search`)를 포함하지만
전체 브라우저 제어 도구는 포함하지 않습니다. 브라우저 자동화는 실제
세션과 로그인된 프로필을 구동할 수 있으므로,
`tools.alsoAllow: ["browser"]` 또는 에이전트별
`agents.list[].tools.alsoAllow: ["browser"]`로 명시적으로 추가하세요.

<Note>
제한적인 프로필(`messaging`, `minimal`) 아래에서 `tools.exec` 또는 `tools.fs`를 구성해도 프로필의 허용 목록이 암묵적으로 확장되지는 않습니다. 제한적인 프로필이 해당 구성 섹션을 사용하게 하려면 명시적 `tools.alsoAllow` 항목을 추가하세요(예: exec의 경우 `["exec", "process"]`, fs의 경우 `["read", "write", "edit"]`). 일치하는 `alsoAllow` 권한 없이 구성 섹션이 있으면 OpenClaw는 시작 경고를 기록합니다.
</Note>

`coding` 및 `messaging` 프로필은 Plugin 키 `bundle-mcp` 아래의 구성된 번들 MCP 도구도 허용합니다.
프로필이 일반적인 기본 제공 도구는 유지하되 구성된 모든 MCP 도구를 숨기려면
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
| `group:openclaw`   | 모든 기본 제공 OpenClaw 도구(Plugin 도구 제외)                                                            |

`sessions_history`는 범위가 제한되고 안전 필터링된 회상 보기를 반환합니다. 원시 transcript 덤프처럼 작동하는 대신, thinking 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함), 다운그레이드된 도구 호출 스캐폴딩, 유출된 ASCII/전각 모델 제어 토큰, assistant 텍스트의 잘못된 MiniMax 도구 호출 XML을 제거한 다음, 수정/잘라내기와 가능한 oversized-row 자리표시자를 적용합니다.

### Provider별 제한 사항

전역 기본값을 변경하지 않고 특정 Provider의 도구를 제한하려면 `tools.byProvider`를 사용하세요.

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
