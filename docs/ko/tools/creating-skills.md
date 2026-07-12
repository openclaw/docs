---
read_when:
    - 새 사용자 지정 스킬을 생성하고 있습니다
    - SKILL.md 기반 Skills를 위한 빠른 시작 워크플로가 필요합니다
    - 에이전트 검토를 위한 스킬을 제안하려면 Skill Workshop을 사용하십시오.
sidebarTitle: Creating skills
summary: OpenClaw 에이전트용 사용자 지정 SKILL.md 작업 공간 Skills를 빌드하고, 테스트하고, 게시합니다.
title: Skills 만들기
x-i18n:
    generated_at: "2026-07-12T15:48:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills는 에이전트가 도구를 사용하는 방법과 시점을 알려 줍니다. 각 스킬은 YAML frontmatter와 Markdown 지침이 포함된 `SKILL.md` 파일을
담고 있는 디렉터리입니다.
OpenClaw는 정의된 [우선순위](/ko/tools/skills#loading-order)에 따라 여러 루트에서 Skills를 로드합니다.

## 첫 번째 스킬 만들기

<Steps>
  <Step title="스킬 디렉터리 만들기">
    Skills는 워크스페이스의 `skills/` 폴더에 있습니다.

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    정리를 위해 Skills를 하위 폴더로 그룹화할 수 있습니다. 스킬 이름은 폴더 경로가 아니라
    `SKILL.md` frontmatter로 계속 지정됩니다.

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # 스킬 이름은 여전히 "hello-world"이며 /hello-world로 호출합니다
    ```

  </Step>

  <Step title="SKILL.md 작성하기">
    frontmatter는 메타데이터를 정의하고, 본문은 에이전트에 지침을 제공합니다.

    ```markdown
    ---
    name: hello-world
    description: 인사말을 출력하는 간단한 스킬입니다.
    ---

    # Hello World

    사용자가 인사말을 요청하면 `exec` 도구를 사용하여 다음을 실행합니다.

    ```bash
    echo "사용자 지정 스킬이 보내는 인사입니다!"
    ```
    ```

    이름 지정 규칙:
    - `name`에는 소문자, 숫자, 하이픈을 사용합니다.
    - 디렉터리 이름과 frontmatter의 `name`을 일치시킵니다.
    - `description`은 에이전트와 슬래시 명령 검색에 표시됩니다.
      한 줄로 작성하고 160자 미만으로 유지합니다.

  </Step>

  <Step title="스킬이 로드되었는지 확인하기">
    ```bash
    openclaw skills list
    ```

    OpenClaw는 기본적으로 Skills 루트 아래의 `SKILL.md` 파일을 감시합니다. 감시 기능이
    비활성화되어 있거나 기존 세션을 계속 사용 중이라면 에이전트가 갱신된 목록을 받도록
    새 세션을 시작합니다.

    ```bash
    # 채팅에서 현재 세션을 보관하고 새로 시작합니다
    /new

    # 또는 Gateway를 다시 시작합니다
    openclaw gateway restart
    ```

  </Step>

  <Step title="테스트하기">
    ```bash
    openclaw agent --message "인사말을 해 줘"
    ```

    또는 채팅을 열어 에이전트에게 직접 요청합니다. 이름을 명시하여 호출하려면
    `/skill hello-world`를 사용합니다.

  </Step>
</Steps>

## SKILL.md 참조

### 필수 필드

| 필드          | 설명                                                          |
| ------------- | ------------------------------------------------------------- |
| `name`        | 소문자, 숫자, 하이픈을 사용하는 고유 슬러그                  |
| `description` | 에이전트와 검색 출력에 표시되는 한 줄 설명                   |

### 선택적 frontmatter 키

| 필드                       | 기본값  | 설명                                                                             |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | 스킬을 사용자 슬래시 명령으로 노출합니다                                         |
| `disable-model-invocation` | `false` | 에이전트의 시스템 프롬프트에서 스킬을 제외합니다(`/skill`로는 계속 실행 가능)    |
| `command-dispatch`         | —       | 모델을 우회하여 슬래시 명령을 도구로 직접 라우팅하려면 `tool`로 설정합니다       |
| `command-tool`             | —       | `command-dispatch: tool`이 설정되었을 때 호출할 도구 이름                        |
| `command-arg-mode`         | `raw`   | 도구 디스패치 시 원시 인수 문자열을 도구에 전달합니다                            |
| `homepage`                 | —       | macOS Skills UI에서 "Website"로 표시되는 URL                                     |

게이팅 필드(`requires.bins`, `requires.env` 등)는
[Skills — 게이팅](/ko/tools/skills#gating)을 참조하십시오.

### `{baseDir}` 사용하기

경로를 하드코딩하지 않고 스킬 디렉터리 내부의 파일을 참조할 수 있습니다. 에이전트는
스킬 자체의 디렉터리를 기준으로 `{baseDir}`를 해석합니다.

```markdown
`{baseDir}/scripts/run.sh`에 있는 도우미 스크립트를 실행합니다.
```

## 조건부 활성화 추가하기

종속성을 사용할 수 있을 때만 로드되도록 스킬에 게이트를 설정합니다.

```markdown
---
name: gemini-search
description: Gemini CLI를 사용하여 검색합니다.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="게이팅 옵션">
    | 키 | 설명 |
    | --- | --- |
    | `requires.bins` | 모든 바이너리가 `PATH`에 있어야 합니다 |
    | `requires.anyBins` | 하나 이상의 바이너리가 `PATH`에 있어야 합니다 |
    | `requires.env` | 각 환경 변수가 프로세스 또는 구성에 있어야 합니다 |
    | `requires.config` | 각 `openclaw.json` 경로가 참이어야 합니다 |
    | `os` | 플랫폼 필터: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | 모든 게이트를 건너뛰고 항상 스킬을 포함하려면 `true`로 설정합니다 |

    전체 참조: [Skills — 게이팅](/ko/tools/skills#gating).

  </Accordion>
  <Accordion title="환경 변수와 API 키">
    `openclaw.json`에서 API 키를 스킬 항목에 연결합니다.

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    키는 해당 에이전트 턴 동안에만 호스트 프로세스에 주입됩니다.
    샌드박스에는 전달되지 않습니다. 자세한 내용은
    [샌드박스 환경 변수](/ko/tools/skills-config#sandboxed-skills-and-env-vars)를 참조하십시오.

  </Accordion>
</AccordionGroup>

## 스킬 워크숍을 통해 제안하기

에이전트가 초안을 작성한 Skills나 스킬을 실제로 사용하기 전에 운영자 검토가 필요한 경우
`SKILL.md`를 직접 작성하는 대신 [스킬 워크숍](/ko/tools/skill-workshop) 제안을 사용합니다.

```bash
# 완전히 새로운 스킬을 제안합니다
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "인사말을 출력하는 간단한 스킬입니다." \
  --proposal ./PROPOSAL.md

# 기존 스킬의 업데이트를 제안합니다
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "업데이트된 인사말 스킬"
```

제안에 지원 파일이 포함된 경우 `--proposal-dir`을 사용합니다.

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "인사말을 출력하는 간단한 스킬입니다." \
  --proposal-dir ./hello-world-proposal/
```

디렉터리 루트에는 `PROPOSAL.md`가 있어야 합니다. 지원 파일은
`assets/`, `examples/`, `references/`, `scripts/` 또는 `templates/` 아래에 둡니다.

검토 후 다음을 실행합니다.

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

전체 제안 수명 주기는 [스킬 워크숍](/ko/tools/skill-workshop)을 참조하십시오.

## ClawHub에 게시하기

<Steps>
  <Step title="SKILL.md가 완성되었는지 확인하기">
    `name`, `description` 및 모든 `metadata.openclaw` 게이팅 필드가
    설정되어 있는지 확인합니다. 프로젝트 페이지가 있다면 `homepage` URL을 추가합니다.
  </Step>
  <Step title="독립형 ClawHub CLI를 설치하고 로그인하기">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="게시하기">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    추론된 버전을 재정의하거나 특정 소유자 명의로 게시하려면 `--version <version>` 또는
    `--owner <owner>`를 추가합니다. 전체 흐름, 소유자 범위 지정 및 기타 유지관리 명령
    (`clawhub sync`, `clawhub skill rename`, ...)은
    [ClawHub — 게시](/ko/clawhub/publishing)와
    [ClawHub CLI](/ko/clawhub/cli)를 참조하십시오.

  </Step>
</Steps>

## 모범 사례

<Tip>
  - **간결하게 작성하십시오** — AI처럼 행동하는 방법이 아니라 모델이 *무엇을* 해야 하는지 지시합니다.
  - **안전을 최우선으로 하십시오** — 스킬에서 `exec`를 사용하는 경우 프롬프트가 신뢰할 수 없는 입력을 통한
    임의 명령 삽입을 허용하지 않는지 확인합니다.
  - **로컬에서 테스트하십시오** — 공유하기 전에 `openclaw agent --message "..."`를 사용합니다.
  - **ClawHub를 사용하십시오** — 처음부터 만들기 전에 [clawhub.ai](https://clawhub.ai)에서
    커뮤니티 Skills를 찾아봅니다.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills 참조" href="/ko/tools/skills" icon="puzzle-piece">
    로드 순서, 게이팅, 허용 목록 및 SKILL.md 형식입니다.
  </Card>
  <Card title="스킬 워크숍" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 초안을 작성한 Skills를 위한 제안 대기열입니다.
  </Card>
  <Card title="Skills 구성" href="/ko/tools/skills-config" icon="gear">
    전체 `skills.*` 구성 스키마입니다.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    공개 레지스트리에서 Skills를 탐색하고 게시합니다.
  </Card>
  <Card title="Plugin 빌드하기" href="/ko/plugins/building-plugins" icon="plug">
    Plugin은 설명하는 도구와 함께 Skills를 배포할 수 있습니다.
  </Card>
</CardGroup>
