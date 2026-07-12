---
read_when:
    - Skills 추가 또는 수정
    - 스킬 게이팅, 허용 목록 또는 로드 규칙 변경
    - Skills 우선순위 및 스냅샷 동작 이해하기
sidebarTitle: Skills
summary: Skills는 에이전트에게 도구 사용 방법을 가르칩니다. Skills가 로드되는 방식, 우선순위가 적용되는 방식, 게이팅, 허용 목록 및 환경 주입을 구성하는 방법을 알아보십시오.
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:50:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills는 에이전트가 도구를 사용하는 방법과 시점을 알려 주는 마크다운 지침 파일입니다. 각 Skills는 YAML 프런트매터와 마크다운 본문이 포함된 `SKILL.md` 파일을 가진 디렉터리에 위치합니다. OpenClaw는 번들 Skills와 모든 로컬 재정의를 로드하고, 환경, 구성 및 바이너리 존재 여부에 따라 로드 시점에 필터링합니다.

<CardGroup cols={2}>
  <Card title="Skills 만들기" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 Skills를 처음부터 빌드하고 테스트합니다.
  </Card>
  <Card title="Skills 워크숍" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 작성한 Skills 제안을 검토하고 승인합니다.
  </Card>
  <Card title="Skills 구성" href="/ko/tools/skills-config" icon="gear">
    전체 `skills.*` 구성 스키마와 에이전트 허용 목록입니다.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    커뮤니티 Skills를 탐색하고 설치합니다.
  </Card>
</CardGroup>

## 로드 순서

OpenClaw는 다음 소스에서 **우선순위가 높은 순서대로** 로드합니다. 동일한 Skills 이름이 여러 위치에 나타나면 우선순위가 가장 높은 소스가 적용됩니다.

| 우선순위    | 소스                   | 경로                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 최고    | 워크스페이스 Skills    | `<workspace>/skills`                    |
| 2           | 프로젝트 에이전트 Skills | `<workspace>/.agents/skills`          |
| 3           | 개인 에이전트 Skills   | `~/.agents/skills`                      |
| 4           | 관리형 / 로컬 Skills   | `~/.openclaw/skills`                    |
| 5           | 번들 Skills            | 설치 패키지와 함께 제공                 |
| 6 — 최저    | 추가 디렉터리          | `skills.load.extraDirs` + Plugin Skills |

Skills 루트는 그룹화된 레이아웃을 지원합니다. OpenClaw는 구성된 루트 아래 어디에서든 최대 6단계 깊이 이내에 `SKILL.md`가 나타나면 Skills를 검색합니다.

```text
<workspace>/skills/research/SKILL.md          ✓ "research"로 검색됨
<workspace>/skills/personal/research/SKILL.md ✓ 역시 "research"로 검색됨
```

폴더 경로는 구성 목적으로만 사용됩니다. Skills 이름과 슬래시 명령은 `name` 프런트매터 필드에서 가져오며, `name`이 없으면 디렉터리 이름을 사용합니다. 아래의 에이전트 허용 목록도 이 `name`을 기준으로 일치시킵니다.

<Note>
  Codex CLI의 기본 `$CODEX_HOME/skills` 디렉터리는 OpenClaw Skills 루트가 **아닙니다**. `openclaw migrate plan codex`를 사용하여 해당 Skills의 목록을 확인한 다음, `openclaw migrate codex`를 사용하여 OpenClaw 워크스페이스로 복사하십시오.
</Note>

## Node 호스팅 Skills

연결된 헤드리스 Node는 활성 OpenClaw Skills 디렉터리에 설치된 Skills를 게시할 수 있습니다. 기본 경로는 `~/.openclaw/skills`이며 프로필 환경 재정의가 적용됩니다. 이 Skills는 Node가 연결되어 있는 동안 일반 에이전트 Skills 목록에 표시되고, 연결이 끊어지면 사라집니다. 이름이 충돌하면 로컬 또는 Gateway Skills가 해당 이름을 유지하고, Node Skills에는 결정론적인 Node 접두사 이름이 부여됩니다. Node 호스팅 v1에서는 디렉터리 이름이 Skills의 `name` 프런트매터 필드와 일치해야 합니다.

Skills 항목에는 Node 로케이터가 포함됩니다. 파일, 상대 참조 및 바이너리는 Node에 있으므로 `exec host=node node=<node-id>`를 사용하여 로드하고 실행하십시오. Skills 파일을 변경한 후에는 Node 호스트를 다시 시작하십시오. 페어링 및 비활성화 스위치에 대한 자세한 내용은 [Node](/ko/nodes#node-hosted-skills)를 참조하십시오.

## 에이전트별 Skills와 공유 Skills

다중 에이전트 설정에서는 각 에이전트에 자체 워크스페이스가 있습니다. 원하는 공개 범위에 맞는 경로를 사용하십시오.

| 범위               | 경로                         | 표시 대상                  |
| ------------------ | ---------------------------- | -------------------------- |
| 에이전트별         | `<workspace>/skills`         | 해당 에이전트만            |
| 프로젝트 에이전트  | `<workspace>/.agents/skills` | 해당 워크스페이스의 에이전트만 |
| 개인 에이전트      | `~/.agents/skills`           | 이 시스템의 모든 에이전트  |
| 공유 관리형        | `~/.openclaw/skills`         | 이 시스템의 모든 에이전트  |
| 추가 디렉터리      | `skills.load.extraDirs`      | 이 시스템의 모든 에이전트  |

## 에이전트 허용 목록

Skills **위치**(우선순위)와 Skills **공개 범위**(사용할 수 있는 에이전트)는 별도의 제어 항목입니다. Skills가 로드된 위치와 관계없이 허용 목록을 사용하여 에이전트에 표시되는 Skills를 제한하십시오.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // 공유 기준선
    },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값을 완전히 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="허용 목록 규칙">
    - 기본적으로 모든 Skills를 제한 없이 유지하려면 `agents.defaults.skills`를 생략하십시오.
    - `agents.defaults.skills`를 상속하려면 `agents.list[].skills`를 생략하십시오.
    - 해당 에이전트에 어떠한 Skills도 공개하지 않으려면 `agents.list[].skills: []`로 설정하십시오.
    - 비어 있지 않은 `agents.list[].skills` 목록은 **최종** 집합이며 기본값과 병합되지 않습니다.
    - 유효한 허용 목록은 프롬프트 빌드, 슬래시 명령 검색, 샌드박스 동기화 및 Skills 스냅샷 전체에 적용됩니다.
    - 이는 호스트 셸 권한 부여 경계가 아닙니다. 동일한 에이전트가 `exec`를 사용할 수 있다면 샌드박싱, OS 사용자 격리, exec 거부/허용 목록 및 리소스별 자격 증명을 사용하여 해당 셸을 별도로 제한하십시오.

  </Accordion>
</AccordionGroup>

## Plugin과 Skills

Plugin은 `openclaw.plugin.json`에 `skills` 디렉터리를 나열하여 자체 Skills를 제공할 수 있습니다. 경로는 Plugin 루트를 기준으로 합니다. Plugin Skills는 Plugin이 활성화될 때 로드됩니다. 예를 들어 브라우저 Plugin은 여러 단계의 브라우저 제어를 위한 `browser-automation` Skills를 제공합니다.

Plugin Skills 디렉터리는 `skills.load.extraDirs`와 동일한 낮은 우선순위 수준에서 병합되므로, 같은 이름의 번들, 관리형, 에이전트 또는 워크스페이스 Skills가 이를 재정의합니다. 다른 모든 Skills와 마찬가지로 프런트매터의 `metadata.openclaw.requires`를 통해 Plugin Skills 자체의 적격성을 제한하십시오.

전체 Plugin 시스템은 [Plugin](/ko/tools/plugin)과 [도구](/ko/tools)를 참조하십시오.

## Skills 워크숍

[Skills 워크숍](/ko/tools/skill-workshop)은 에이전트와 활성 Skills 파일 사이에 있는 제안 대기열입니다. 에이전트가 재사용 가능한 작업을 발견하면 `SKILL.md`에 직접 쓰지 않고 제안을 작성합니다. 변경 사항이 적용되기 전에 이를 검토하고 승인합니다.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

전체 수명 주기, CLI 참조 및 구성은 [Skills 워크숍](/ko/tools/skill-workshop)을 참조하십시오.

## ClawHub에서 설치

[ClawHub](https://clawhub.ai)는 공개 Skills 레지스트리입니다. 설치와 업데이트에는 `openclaw skills` 명령을 사용하고, 게시와 동기화에는 `clawhub` CLI를 사용하십시오.

| 작업                                 | 명령                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| 워크스페이스에 Skills 설치           | `openclaw skills install @owner/<slug>`                |
| Git 저장소에서 설치                  | `openclaw skills install git:owner/repo@ref`           |
| 로컬 Skills 디렉터리 설치            | `openclaw skills install ./path/to/skill --as my-tool` |
| 모든 로컬 에이전트용으로 설치        | `openclaw skills install @owner/<slug> --global`       |
| 모든 워크스페이스 Skills 업데이트    | `openclaw skills update --all`                         |
| 공유 관리형 Skills 업데이트          | `openclaw skills update @owner/<slug> --global`        |
| 모든 공유 관리형 Skills 업데이트     | `openclaw skills update --all --global`                |
| Skills의 신뢰 범위 검증               | `openclaw skills verify @owner/<slug>`                 |
| 생성된 Skills 카드 출력              | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI를 통해 게시 / 동기화      | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="설치 세부 정보">
    `openclaw skills install`은 기본적으로 활성 워크스페이스의 `skills/` 디렉터리에 설치합니다. 공유 `~/.openclaw/skills` 디렉터리에 설치하려면 `--global`을 추가하십시오. 에이전트 허용 목록에서 범위를 좁히지 않는 한 모든 로컬 에이전트에 표시됩니다.

    Git 및 로컬 설치에서는 소스 루트에 `SKILL.md`가 있어야 합니다. 슬러그는 유효한 경우 `SKILL.md` 프런트매터의 `name`에서 가져오며, 그렇지 않으면 디렉터리 또는 저장소 이름을 사용합니다. 재정의하려면 `--as <slug>`를 사용하십시오. `openclaw skills update`는 ClawHub 설치만 추적합니다. Git 또는 로컬 소스를 새로 고치려면 다시 설치하십시오.

  </Accordion>
  <Accordion title="검증 및 보안 검사">
    `openclaw skills verify @owner/<slug>`는 ClawHub에 Skills의 `clawhub.skill.verify.v1` 신뢰 범위를 요청합니다. 설치된 ClawHub Skills는 `.clawhub/origin.json`에 기록된 버전 및 레지스트리를 기준으로 검증합니다. 기존에 설치되었거나 모호하지 않은 Skills에는 소유자가 없는 슬러그도 계속 허용되지만, 소유자가 명시된 참조를 사용하면 게시자 모호성을 피할 수 있습니다.

    ClawHub Skills 페이지는 설치 전에 최신 보안 검사 상태를 표시하며 VirusTotal, ClawScan 및 정적 분석에 대한 세부 정보 페이지를 제공합니다. ClawHub가 검증을 실패로 표시하면 명령이 0이 아닌 코드로 종료됩니다. 게시자는 ClawHub 대시보드 또는 `clawhub skill rescan @owner/<slug>`를 통해 오탐에서 복구할 수 있습니다.

  </Accordion>
  <Accordion title="비공개 아카이브 설치">
    ClawHub 외의 전달 방식이 필요한 Gateway 클라이언트는 `skills.upload.begin`, `skills.upload.chunk`, `skills.upload.commit`을 사용하여 zip Skills 아카이브를 스테이징한 다음, `skills.install({ source: "upload", ... })`로 설치할 수 있습니다. 이 경로는 기본적으로 비활성화되어 있으며 `openclaw.json`에서 `skills.install.allowUploadedArchives: true`를 설정해야 합니다. 일반적인 ClawHub 설치에는 이 설정이 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 보안

<Warning>
  타사 Skills를 **신뢰할 수 없는 코드**로 취급하십시오. 활성화하기 전에 내용을 읽으십시오. 신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 권장합니다. 에이전트 측 제어에 대한 자세한 내용은 [샌드박싱](/ko/gateway/sandboxing)을 참조하십시오.
</Warning>

<AccordionGroup>
  <Accordion title="경로 제한">
    워크스페이스, 프로젝트 에이전트 및 추가 디렉터리의 Skills 검색은 확인된 realpath가 구성된 루트 내부에 유지되는 Skills 루트만 허용합니다. 단, `skills.load.allowSymlinkTargets`가 대상 루트를 명시적으로 신뢰하는 경우는 예외입니다. `skills.workshop.allowSymlinkTargetWrites`가 활성화된 경우에만 Skills 워크숍이 이러한 신뢰할 수 있는 대상을 통해 씁니다. 관리형 `~/.openclaw/skills`와 개인용 `~/.agents/skills`에는 심볼릭 링크로 연결된 Skills 폴더가 포함될 수 있지만, 모든 `SKILL.md` realpath는 확인된 Skills 디렉터리 내부에 있어야 합니다.
  </Accordion>
  <Accordion title="운영자 설치 정책">
    Skills 설치를 계속하기 전에 신뢰할 수 있는 로컬 정책 명령을 실행하도록 `security.installPolicy`를 구성하십시오. 이 정책은 메타데이터와 스테이징된 소스 경로를 전달받고 ClawHub, 업로드, Git, 로컬, 업데이트 및 종속성 설치 프로그램 경로에 적용되며, 명령이 유효한 결정을 반환할 수 없으면 차단합니다.
  </Accordion>
  <Accordion title="비밀 정보 주입 범위">
    `skills.entries.*.env`와 `skills.entries.*.apiKey`는 해당 에이전트 턴에만 **호스트** 프로세스에 비밀 정보를 주입하며 샌드박스에는 주입하지 않습니다. 프롬프트와 로그에 비밀 정보를 포함하지 마십시오.
  </Accordion>
</AccordionGroup>

더 광범위한 위협 모델과 보안 체크리스트는 [보안](/ko/gateway/security)을 참조하십시오.

## SKILL.md 형식

모든 Skills는 최소한 프런트매터에 `name`과 `description`이 있어야 합니다.

```markdown
---
name: image-lab
description: 공급자 기반 이미지 워크플로를 통해 이미지를 생성하거나 편집합니다
---

사용자가 이미지 생성을 요청하면 `image_generate` 도구를 사용하십시오...
```

<Note>
  OpenClaw은 [AgentSkills](https://agentskills.io) 사양을 따릅니다. Frontmatter는
  먼저 YAML로 파싱되며, 실패하면 한 줄 전용 파서로 대체됩니다. 중첩된
  `metadata` 블록(여러 줄 YAML 매핑 포함)은 JSON 문자열로 평탄화된 후
  JSON5로 다시 파싱되므로 [게이팅](#gating)에 표시된 블록 형식을 사용할 수
  있습니다. 본문에서 Skills 폴더 경로를 참조하려면 `{baseDir}`을 사용하십시오.
</Note>

### 선택적 frontmatter 키

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "Website"로 표시되는 URL입니다.
  `metadata.openclaw.homepage`를 통해서도 지원됩니다.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true`이면 Skills가 사용자가 호출할 수 있는 슬래시 명령으로 노출됩니다.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true`이면 OpenClaw은 에이전트의 일반 프롬프트에서 Skills 지침을 제외합니다.
  `user-invocable`도 `true`이면 Skills는 계속 슬래시 명령으로 사용할 수 있습니다.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool`로 설정하면 슬래시 명령이 모델을 우회하여 등록된 도구로 직접
  전달됩니다.
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool`이 설정된 경우 호출할 도구 이름입니다.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  도구 전달 시 코어에서 파싱하지 않고 원시 인수 문자열을 도구에 전달합니다.
  도구는
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`을 받습니다.
</ParamField>

## 게이팅

OpenClaw은 로드 시 `metadata.openclaw`(frontmatter에 포함된 JSON5 객체이며
위의 파싱 참고 사항 참조)를 사용해 Skills를 필터링합니다.
`metadata.openclaw` 블록이 없는 Skills는 명시적으로 비활성화하지 않는 한
항상 사용 가능합니다.

```markdown
---
name: image-lab
description: 제공자 기반 이미지 워크플로를 통해 이미지를 생성하거나 편집합니다
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  `true`이면 항상 Skills를 포함하고 다른 모든 게이트를 건너뜁니다.
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI에 표시되는 선택적 이모지입니다.
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI에서 "Website"로 표시되는 선택적 URL입니다.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  플랫폼 필터입니다. 설정하면 나열된 OS에서만 Skills를 사용할 수 있습니다.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  각 바이너리가 `PATH`에 있어야 합니다.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  하나 이상의 바이너리가 `PATH`에 있어야 합니다.
</ParamField>

<ParamField path="requires.env" type="string[]">
  각 환경 변수가 프로세스에 있거나 구성을 통해 제공되어야 합니다.
</ParamField>

<ParamField path="requires.config" type="string[]">
  각 `openclaw.json` 경로가 참으로 평가되어야 합니다.
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey`와 연결된 환경 변수 이름입니다.
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI에서 사용하는 선택적 설치 프로그램 사양입니다(brew / node / go / uv / download).
</ParamField>

<Note>
  `metadata.openclaw`이 없으면 레거시 `metadata.clawdbot` 블록도 계속
  허용되므로, 이전에 설치된 Skills의 종속성 게이트와 설치 프로그램 안내가
  유지됩니다. 새 Skills는 `metadata.openclaw`을 사용해야 합니다.
</Note>

### 설치 프로그램 사양

설치 프로그램 사양은 macOS Skills UI에 종속성을 설치하는 방법을 알려줍니다.

```markdown
---
name: gemini
description: 코딩 지원 및 Google 검색 조회에 Gemini CLI를 사용합니다.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Gemini CLI 설치(brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="설치 프로그램 선택 규칙">
    - 여러 설치 프로그램이 나열된 경우 Gateway는 선호 옵션 하나를
      선택합니다(사용 가능한 경우 brew, 그렇지 않으면 node).
    - 모든 설치 프로그램이 `download`이면 OpenClaw은 사용 가능한 모든
      아티팩트를 확인할 수 있도록 각 항목을 나열합니다.
    - 사양에 `os: ["darwin"|"linux"|"win32"]`를 포함해 플랫폼별로 필터링할 수 있습니다.
    - Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다
      (기본값: npm, 옵션: npm / pnpm / yarn / bun). 이는 Skills 설치에만
      영향을 주며 Gateway 런타임은 계속 Node여야 합니다.
    - Gateway 설치 프로그램 우선순위: Homebrew → uv → 구성된 node 관리자 →
      go → download.
  </Accordion>
  <Accordion title="설치 프로그램별 세부 정보">
    - **Homebrew:** OpenClaw은 Homebrew를 자동으로 설치하거나 brew
      formula를 시스템 패키지 명령으로 변환하지 않습니다. `brew`가 없는
      Linux 컨테이너에서는 brew 전용 설치 프로그램이 숨겨집니다. 사용자
      지정 이미지를 사용하거나 종속성을 수동으로 설치하십시오.
    - **Go:** OpenClaw에서 Skills를 자동으로 설치하려면 Go 1.21 이상이
      필요합니다. `go`가 없고 Homebrew를 사용할 수 있으면 OpenClaw은 먼저
      Homebrew를 통해 Go를 설치합니다. Homebrew가 없는 Linux에서는 새로
      조회한 `golang-go` 후보가 최소 버전을 충족할 경우 root 권한 또는
      비밀번호 없는 `sudo`를 통해 `apt-get`을 대신 사용할 수 있습니다.
      종속성에 대한 실제 `go install`은 구성된 `GOBIN`이 아니라 항상
      OpenClaw이 관리하는 전용 bin 디렉터리(새로 설치한 경우 Homebrew의
      `bin`, 그 외에는 `~/.local/bin`)를 대상으로 합니다. 사용자의
      `GOBIN`, `GOPATH`, `GOTOOLCHAIN` 환경 변수는 읽지만 절대 덮어쓰지 않습니다.
    - **다운로드:** `url`(필수), `archive`(`tar.gz` | `tar.bz2` | `zip`),
      `extract`(기본값: 아카이브가 감지되면 자동), `stripComponents`,
      `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="샌드박싱 참고 사항">
    `requires.bins`는 Skills 로드 시 **호스트**에서 확인됩니다. 에이전트가
    샌드박스에서 실행되는 경우 바이너리가 **컨테이너 내부**에도 있어야
    합니다. `agents.defaults.sandbox.docker.setupCommand` 또는 사용자 지정
    이미지를 통해 설치하십시오. `setupCommand`는 컨테이너 생성 후 한 번
    실행되며 네트워크 송신, 쓰기 가능한 루트 파일 시스템, 샌드박스의 root
    사용자가 필요합니다.
  </Accordion>
</AccordionGroup>

## 구성 재정의

`~/.openclaw/openclaw.json`의 `skills.entries`에서 번들 또는 관리형 Skills를
켜고 구성합니다.

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false`이면 번들되었거나 설치된 Skills도 비활성화합니다. 번들 Skills인
  `coding-agent`는 명시적으로 활성화해야 합니다.
  `skills.entries.coding-agent.enabled: true`로 설정하고 `claude`, `codex`,
  `opencode` 또는 지원되는 다른 CLI 중 하나가 설치되고 인증되었는지 확인하십시오.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv`를 선언하는 Skills를 위한 편의 필드입니다.
  일반 텍스트 문자열 또는 SecretRef 객체를 지원합니다.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  에이전트 실행에 주입되는 환경 변수입니다. 해당 변수가 프로세스에 아직
  설정되지 않은 경우에만 주입됩니다.
</ParamField>

<ParamField path="config" type="object">
  Skills별 사용자 지정 구성 필드를 위한 선택적 속성 모음입니다.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **번들** Skills에만 적용되는 선택적 허용 목록입니다. 설정하면 목록에
  포함된 번들 Skills만 사용할 수 있습니다. 관리형 및 워크스페이스 Skills에는
  영향을 주지 않습니다.
</ParamField>

<Note>
  기본적으로 구성 키는 **Skills 이름**과 일치합니다. Skills가
  `metadata.openclaw.skillKey`를 정의하는 경우 대신 `skills.entries` 아래에서
  해당 키를 사용하십시오. 하이픈이 포함된 이름은 따옴표로 묶으십시오.
  JSON5는 따옴표로 묶인 키를 허용합니다.
</Note>

## 환경 주입

에이전트 실행이 시작되면 OpenClaw은 다음을 수행합니다.

<Steps>
  <Step title="Skills 메타데이터 읽기">
    OpenClaw은 게이팅 규칙, 허용 목록, 구성 재정의를 적용하여 에이전트에
    유효한 Skills 목록을 결정합니다.
  </Step>
  <Step title="환경 변수 및 API 키 주입">
    `skills.entries.<key>.env`와 `skills.entries.<key>.apiKey`가 실행되는 동안
    `process.env`에 적용됩니다.
  </Step>
  <Step title="시스템 프롬프트 빌드">
    사용할 수 있는 Skills가 간결한 XML 블록으로 컴파일되어 시스템 프롬프트에
    주입됩니다.
  </Step>
  <Step title="환경 복원">
    실행이 종료되면 원래 환경이 복원됩니다.
  </Step>
</Steps>

<Warning>
  환경 주입의 범위는 샌드박스가 아니라 **호스트** 에이전트 실행입니다.
  샌드박스 내부에서는 `env`와 `apiKey`가 아무런 영향을 주지 않습니다.
  샌드박스 실행에 보안 비밀을 전달하는 방법은
  [Skills 구성](/ko/tools/skills-config#sandboxed-skills-and-env-vars)을 참조하십시오.
</Warning>

번들 `claude-cli` 백엔드의 경우 OpenClaw은 동일한 사용 가능 Skills 스냅샷을
임시 Claude Code Plugin으로도 구체화하고 `--plugin-dir`을 통해 전달합니다.
다른 CLI 백엔드는 프롬프트 카탈로그만 사용합니다.

## 스냅샷 및 새로 고침

OpenClaw은 **세션이 시작될 때** 사용 가능한 Skills의 스냅샷을 생성하고
세션의 이후 모든 턴에서 해당 목록을 재사용합니다. Skills 또는 구성 변경은
다음 새 세션부터 적용됩니다.

세션 중간에 Skills가 새로 고쳐지는 경우는 다음 두 가지입니다.

- Skills 감시자가 `SKILL.md` 변경을 감지합니다.
- 사용 가능한 새 원격 node가 연결됩니다.

새로 고친 목록은 다음 에이전트 턴에 반영됩니다. 에이전트의 유효 허용 목록이
변경되면 OpenClaw은 표시되는 Skills를 일치시키기 위해 스냅샷을 새로 고칩니다.

<AccordionGroup>
  <Accordion title="Skills 감시자">
    기본적으로 OpenClaw은 Skills 폴더를 감시하고 `SKILL.md` 파일이 변경되면
    스냅샷을 갱신합니다. `skills.load`에서 구성하십시오.

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // 기본값
          watchDebounceMs: 250, // 기본값
        },
      },
    }
    ```

    Skills 루트 심볼릭 링크가 구성된 루트 외부를 가리키는 의도적인 심볼릭
    링크 레이아웃에는 `allowSymlinkTargets`를 사용하십시오. 예:
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Skill Workshop이 신뢰할 수 있는 해당 심볼릭 링크 경로를 통해 제안도
    적용해야 하는 경우에만 `skills.workshop.allowSymlinkTargetWrites`를
    활성화하십시오.

  </Accordion>
  <Accordion title="원격 macOS node(Linux Gateway)">
    Gateway가 Linux에서 실행되지만 `system.run`이 허용된 **macOS node**가
    연결된 경우, OpenClaw은 해당 node에 필요한 바이너리가 있으면 macOS 전용
    Skills를 사용 가능한 것으로 처리할 수 있습니다. 에이전트는 `host=node`와
    함께 `exec` 도구를 사용해 해당 Skills를 실행해야 합니다.

    오프라인 node는 원격 전용 Skills를 표시하지 **않습니다**. node가 바이너리
    탐색에 응답하지 않으면 OpenClaw은 캐시된 바이너리 일치 항목을 지웁니다.

  </Accordion>
</AccordionGroup>

## 토큰 영향

Skills를 사용할 수 있으면 OpenClaw은 간결한 XML 블록을 시스템 프롬프트에
주입합니다. 비용은 결정론적이며 Skills마다 선형으로 증가합니다.

- **기본 오버헤드**(1개 이상의 Skills를 사용할 수 있는 경우에만): 소개
  문구와 `<available_skills>` 래퍼로 구성된 고정 블록입니다.
- **Skills당:** 약 97자 + `name`, `description`, `location` 필드 길이입니다.
- XML 이스케이프는 `& < > " '`를 엔터티로 확장하여 발생할 때마다 몇 글자를
  추가합니다.
- 약 4자/token 기준으로 필드 길이를 제외하면 97자 ≈ Skills당 24 token입니다.

렌더링된 블록이 구성된 프롬프트 예산
(`skills.limits.maxSkillsPromptChars`)을 초과하는 경우, OpenClaw는 먼저 설명이 없는 압축 형식에 들어갈 수 있는 만큼의 Skills 식별 정보(이름, 위치, 버전)를 보존합니다. 그런 다음 남은 예산을 축약된 설명에 사용합니다. 설명에 할당할 예산이 남아 있지 않으면 설명을 생략합니다. 압축 형식이나 목록 잘라내기가 필요한 경우 프롬프트에는 `openclaw skills check`를 안내하는 참고 문구가 포함됩니다.

프롬프트 오버헤드를 최소화하려면 설명을 짧고 명확하게 작성하십시오.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills 만들기" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 Skill을 작성하는 단계별 가이드입니다.
  </Card>
  <Card title="Skill 워크숍" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 초안으로 작성한 Skills의 제안 대기열입니다.
  </Card>
  <Card title="Skills 구성" href="/ko/tools/skills-config" icon="gear">
    전체 `skills.*` 구성 스키마와 에이전트 허용 목록입니다.
  </Card>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="terminal">
    Skill 슬래시 명령이 등록되고 라우팅되는 방식입니다.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    공개 레지스트리에서 Skills를 찾아보고 게시합니다.
  </Card>
  <Card title="Plugin" href="/ko/tools/plugin" icon="plug">
    Plugin은 문서화하는 도구와 함께 Skills를 제공할 수 있습니다.
  </Card>
</CardGroup>
