---
read_when:
    - .prose 워크플로 파일을 실행하거나 작성하려는 경우
    - OpenProse Plugin을 활성화하려고 합니다
    - OpenProse가 OpenClaw 기본 요소에 어떻게 매핑되는지 이해해야 합니다.
sidebarTitle: OpenProse
summary: OpenProse는 멀티 에이전트 AI 세션을 위한 Markdown 우선 워크플로 형식입니다. OpenClaw에서는 `/prose` 슬래시 명령과 Skills 팩을 제공하는 Plugin으로 배포됩니다.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T01:10:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse는 AI 세션을 오케스트레이션하기 위한 이식 가능한 Markdown 우선 워크플로 형식입니다. OpenClaw에서는 OpenProse skill 팩과 `/prose` 슬래시 명령을 설치하는 Plugin으로 제공됩니다. 프로그램은 `.prose` 파일에 저장되며 명시적인 제어 흐름으로 여러 하위 에이전트를 생성할 수 있습니다.

<CardGroup cols={3}>
  <Card title="설치" icon="download" href="#install">
    OpenProse Plugin을 활성화하고 Gateway를 다시 시작합니다.
  </Card>
  <Card title="프로그램 실행" icon="play" href="#slash-command">
    `/prose run`을 사용하여 `.prose` 파일 또는 원격 프로그램을 실행합니다.
  </Card>
  <Card title="프로그램 작성" icon="pencil" href="#example-parallel-research-and-synthesis">
    병렬 및 순차 단계로 다중 에이전트 워크플로를 작성합니다.
  </Card>
</CardGroup>

## 설치

<Steps>
  <Step title="Plugin 활성화">
    OpenProse는 번들로 제공되지만 기본적으로 비활성화되어 있습니다. 다음과 같이 활성화합니다.

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Gateway 다시 시작">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="확인">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose`가 활성화된 것으로 표시되어야 합니다. 이제 채팅에서 `/prose` skill 명령을 사용할 수 있습니다.

  </Step>
</Steps>

저장소 체크아웃에서 Plugin을 직접 설치할 수 있습니다.
`openclaw plugins install ./extensions/open-prose`

## 슬래시 명령

OpenProse는 사용자가 호출할 수 있는 skill 명령으로 `/prose`를 등록합니다.

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>`는 `https://p.prose.md/<handle>/<slug>`로 해석됩니다.
직접 URL은 `web_fetch` 도구를 사용하여 그대로 가져옵니다.

최상위 원격 실행은 명시적으로 요청해야 합니다. `.prose` 프로그램 내부의 원격 가져오기는 전이적 코드 종속성입니다. OpenProse가 원격 `use` 대상을 가져오기 전에 해석된 가져오기 목록을 표시하며, 해당 실행을 진행하려면 운영자가 정확히 `approve remote prose imports`라고 응답해야 합니다.

## 가능한 작업

- 명시적인 병렬 처리를 사용한 다중 에이전트 조사 및 종합.
- 반복 가능하며 승인 안전성이 보장되는 워크플로(코드 검토, 인시던트 분류, 콘텐츠 파이프라인).
- 지원되는 에이전트 런타임에서 실행할 수 있는 재사용 가능한 `.prose` 프로그램.

## 예시: 병렬 조사 및 종합

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## OpenClaw 런타임 매핑

OpenProse 프로그램은 OpenClaw 기본 요소에 다음과 같이 매핑됩니다.

| OpenProse 개념            | OpenClaw 도구                                   |
| ------------------------- | ----------------------------------------------- |
| 세션 생성 / Task 도구     | `sessions_spawn`                                |
| 파일 읽기 / 쓰기          | `read` / `write`                                |
| 웹 가져오기               | `web_fetch` (POST가 필요할 때는 `exec` + curl) |

<Warning>
  도구 허용 목록에서 `sessions_spawn`, `read`, `write` 또는 `web_fetch`가 차단되어 있으면 OpenProse 프로그램이 실패합니다. [도구 허용 목록 구성](/ko/gateway/config-tools)을 확인하세요.
</Warning>

## 파일 위치

OpenProse는 워크스페이스의 `.prose/` 아래에 상태를 보관합니다.

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

프로젝트 간에 공유되는 사용자 수준 영구 에이전트는 다음 위치에 있습니다.

```text
~/.prose/agents/
```

## 상태 백엔드

<AccordionGroup>
  <Accordion title="파일 시스템(기본값)">
    상태는 워크스페이스의 `.prose/runs/...`에 기록됩니다. 추가 종속성이 필요하지 않습니다.
  </Accordion>
  <Accordion title="컨텍스트 내">
    일시적 상태를 컨텍스트 창에 보관하며 `--in-context`로 선택합니다. 작고 수명이 짧은 프로그램에 적합합니다.
  </Accordion>
  <Accordion title="sqlite(실험적)">
    `--state=sqlite`로 선택합니다. `PATH`에 `sqlite3` 바이너리가 있어야 하며, 없으면 파일 시스템으로 대체됩니다. 상태는 `.prose/runs/{id}/state.db`에 저장됩니다.
  </Accordion>
  <Accordion title="postgres(실험적)">
    `--state=postgres`로 선택합니다. `psql`과 `OPENPROSE_POSTGRES_URL`의 연결 문자열이 필요합니다(`.prose/.env`에서 설정).

    <Warning>
      Postgres 자격 증명이 하위 에이전트 로그에 포함됩니다. 전용 최소 권한 데이터베이스를 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 보안

`.prose` 파일을 코드처럼 취급하세요. 원격 `use` 가져오기를 포함하여 실행 전에 검토하세요. 최상위 `/prose run https://...` 요청은 명시적으로 이루어지지만, 전이적 원격 가져오기는 가져오거나 실행하기 전에 실행별 승인이 필요합니다. OpenClaw 도구 허용 목록과 승인 게이트를 사용하여 부수 효과를 제어하세요. 결정론적이며 승인을 거치는 워크플로가 필요하다면 [Lobster](/ko/tools/lobster)와 비교해 보세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills 참조" href="/ko/tools/skills" icon="puzzle-piece">
    OpenProse의 skill 팩이 로드되는 방식과 적용되는 게이트를 설명합니다.
  </Card>
  <Card title="하위 에이전트" href="/ko/tools/subagents" icon="users">
    OpenClaw의 네이티브 다중 에이전트 조정 계층입니다.
  </Card>
  <Card title="텍스트 음성 변환" href="/ko/tools/tts" icon="volume-high">
    워크플로에 오디오 출력을 추가합니다.
  </Card>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="terminal">
    `/prose`를 포함하여 사용 가능한 모든 채팅 명령입니다.
  </Card>
</CardGroup>

공식 사이트: [https://www.prose.md](https://www.prose.md)
