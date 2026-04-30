---
read_when:
    - 작업 공간에서 새 사용자 지정 스킬을 만들고 있습니다
    - SKILL.md 기반 Skills를 위한 빠른 시작 워크플로가 필요합니다
summary: SKILL.md를 사용하여 사용자 지정 워크스페이스 Skills 빌드 및 테스트
title: Skills 만들기
x-i18n:
    generated_at: "2026-04-30T06:53:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills는 에이전트에게 도구를 사용하는 방법과 시점을 알려줍니다. 각 스킬은 YAML 프런트매터와 마크다운 지침이 포함된 `SKILL.md` 파일을 담은 디렉터리입니다.

스킬이 로드되고 우선순위가 지정되는 방식은 [Skills](/ko/tools/skills)를 참조하세요.

## 첫 번째 스킬 만들기

<Steps>
  <Step title="스킬 디렉터리 만들기">
    Skills는 작업 영역에 있습니다. 새 폴더를 만드세요.

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md 작성하기">
    해당 디렉터리 안에 `SKILL.md`를 만드세요. 프런트매터는 메타데이터를 정의하고,
    마크다운 본문에는 에이전트를 위한 지침이 포함됩니다.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    스킬 `name`에는 소문자, 숫자, 하이픈으로 구성된 하이픈 표기법을 사용하세요.
    폴더 이름과 프런트매터의 `name`을 일치시키세요.

  </Step>

  <Step title="도구 추가하기(선택 사항)">
    프런트매터에서 사용자 지정 도구 스키마를 정의하거나 에이전트가 기존 시스템 도구
    (`exec` 또는 `browser` 등)를 사용하도록 지시할 수 있습니다. Skills는 설명하는 도구와 함께
    Plugin 내부에 포함되어 배포될 수도 있습니다.

  </Step>

  <Step title="스킬 로드하기">
    OpenClaw가 스킬을 감지하도록 새 세션을 시작하세요.

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    스킬이 로드되었는지 확인하세요.

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="테스트하기">
    스킬을 트리거해야 하는 메시지를 보내세요.

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    또는 에이전트와 채팅하면서 인사를 요청하세요.

  </Step>
</Steps>

## 스킬 메타데이터 참조

YAML 프런트매터는 다음 필드를 지원합니다.

| 필드                                | 필수 여부 | 설명                                                           |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | 예       | 소문자, 숫자, 하이픈을 사용하는 고유 식별자                   |
| `description`                       | 예       | 에이전트에 표시되는 한 줄 설명                                |
| `metadata.openclaw.os`              | 아니요   | OS 필터(`["darwin"]`, `["linux"]` 등)                         |
| `metadata.openclaw.requires.bins`   | 아니요   | PATH에 필요한 바이너리                                        |
| `metadata.openclaw.requires.config` | 아니요   | 필요한 구성 키                                                |

## 모범 사례

- **간결하게 작성하세요** — 모델에 AI가 되는 방법이 아니라 _무엇을_ 해야 하는지 지시하세요
- **안전을 우선하세요** — 스킬이 `exec`를 사용하는 경우 프롬프트가 신뢰할 수 없는 입력으로부터 임의 명령 삽입을 허용하지 않도록 하세요
- **로컬에서 테스트하세요** — 공유하기 전에 `openclaw agent --message "..."`를 사용해 테스트하세요
- **ClawHub를 사용하세요** — [ClawHub](https://clawhub.ai)에서 스킬을 둘러보고 기여하세요

## 스킬 위치

| 위치                            | 우선순위 | 범위                  |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | 가장 높음  | 에이전트별            |
| `\<workspace\>/.agents/skills/` | 높음       | 작업 영역 에이전트별  |
| `~/.agents/skills/`             | 중간       | 공유 에이전트 프로필  |
| `~/.openclaw/skills/`           | 중간       | 공유(모든 에이전트)   |
| 번들(OpenClaw와 함께 제공됨)    | 낮음       | 전역                  |
| `skills.load.extraDirs`         | 가장 낮음  | 사용자 지정 공유 폴더 |

## 관련 항목

- [Skills 참조](/ko/tools/skills) — 로드, 우선순위 및 게이팅 규칙
- [Skills 구성](/ko/tools/skills-config) — `skills.*` 구성 스키마
- [ClawHub](/ko/tools/clawhub) — 공개 스킬 레지스트리
- [Plugin 빌드하기](/ko/plugins/building-plugins) — Plugin은 스킬을 포함해 배포할 수 있음
