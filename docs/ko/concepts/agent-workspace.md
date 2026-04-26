---
read_when:
    - 에이전트 워크스페이스 또는 해당 파일 레이아웃을 설명해야 합니다
    - 에이전트 워크스페이스를 백업하거나 마이그레이션하려고 합니다
sidebarTitle: Agent workspace
summary: '에이전트 워크스페이스: 위치, 레이아웃 및 백업 전략'
title: 에이전트 워크스페이스
x-i18n:
    generated_at: "2026-04-26T11:26:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

워크스페이스는 에이전트의 집입니다. 파일 도구와 워크스페이스 컨텍스트에 사용되는 유일한 작업 디렉터리입니다. 비공개로 유지하고 메모리처럼 다루세요.

이는 config, 자격 증명, 세션을 저장하는 `~/.openclaw/`와는 별개입니다.

<Warning>
워크스페이스는 하드 샌드박스가 아니라 **기본 cwd**입니다. 도구는 상대 경로를 워크스페이스 기준으로 확인하지만, 샌드박싱이 활성화되지 않으면 절대 경로로 호스트의 다른 위치에도 접근할 수 있습니다. 격리가 필요하다면 [`agents.defaults.sandbox`](/ko/gateway/sandboxing)(및/또는 에이전트별 샌드박스 config)를 사용하세요.

샌드박싱이 활성화되어 있고 `workspaceAccess`가 `"rw"`가 아니면, 도구는 호스트 워크스페이스가 아니라 `~/.openclaw/sandboxes` 아래의 샌드박스 워크스페이스 내부에서 동작합니다.
</Warning>

## 기본 위치

- 기본값: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE`이 설정되어 있고 `"default"`가 아니면 기본값은 `~/.openclaw/workspace-<profile>`가 됩니다.
- `~/.openclaw/openclaw.json`에서 재정의:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure`, 또는 `openclaw setup`은 워크스페이스가 없으면 이를 생성하고 bootstrap 파일을 시드합니다.

<Note>
샌드박스 시드 복사는 워크스페이스 내부의 일반 파일만 허용합니다. 원본 워크스페이스 밖으로 확인되는 symlink/hardlink 별칭은 무시됩니다.
</Note>

이미 워크스페이스 파일을 직접 관리하고 있다면 bootstrap 파일 생성을 비활성화할 수 있습니다:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 추가 워크스페이스 폴더

오래된 설치에서는 `~/openclaw`가 생성되었을 수 있습니다. 여러 워크스페이스 디렉터리를 동시에 두면 한 번에 하나의 워크스페이스만 활성 상태이므로 인증이나 상태 드리프트가 혼란스럽게 발생할 수 있습니다.

<Note>
**권장 사항:** 활성 워크스페이스는 하나만 유지하세요. 추가 폴더를 더 이상 사용하지 않는다면 보관하거나 휴지통으로 이동하세요(예: `trash ~/openclaw`). 의도적으로 여러 워크스페이스를 유지한다면 `agents.defaults.workspace`가 활성 워크스페이스를 가리키는지 확인하세요.

`openclaw doctor`는 추가 워크스페이스 디렉터리를 감지하면 경고를 표시합니다.
</Note>

## 워크스페이스 파일 맵

다음은 OpenClaw가 워크스페이스 내부에서 기대하는 표준 파일입니다:

<AccordionGroup>
  <Accordion title="AGENTS.md — 운영 지침">
    에이전트를 위한 운영 지침과 메모리 사용 방식입니다. 모든 세션 시작 시 로드됩니다. 규칙, 우선순위, "어떻게 행동할지"에 관한 세부 사항을 두기 좋은 위치입니다.
  </Accordion>
  <Accordion title="SOUL.md — 페르소나와 톤">
    페르소나, 톤, 경계입니다. 모든 세션에서 로드됩니다. 안내서: [SOUL.md 성격 가이드](/ko/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — 사용자가 누구인지">
    사용자가 누구인지와 어떻게 불러야 하는지입니다. 모든 세션에서 로드됩니다.
  </Accordion>
  <Accordion title="IDENTITY.md — 이름, 분위기, 이모지">
    에이전트의 이름, 분위기, 이모지입니다. bootstrap ritual 동안 생성/업데이트됩니다.
  </Accordion>
  <Accordion title="TOOLS.md — 로컬 도구 관례">
    로컬 도구와 관례에 대한 메모입니다. 도구 가용성을 제어하지는 않으며 안내용일 뿐입니다.
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeat 체크리스트">
    Heartbeat 실행을 위한 선택적 작은 체크리스트입니다. 토큰 소모를 피하기 위해 짧게 유지하세요.
  </Accordion>
  <Accordion title="BOOT.md — 시작 체크리스트">
    Gateway 재시작 시 자동으로 실행되는 선택적 시작 체크리스트입니다([internal hooks](/ko/automation/hooks)가 활성화된 경우). 짧게 유지하고, 아웃바운드 전송에는 message 도구를 사용하세요.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — 첫 실행 ritual">
    일회성 첫 실행 ritual입니다. 완전히 새로운 워크스페이스에만 생성됩니다. ritual이 완료되면 삭제하세요.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — 일일 메모리 로그">
    일일 메모리 로그(하루에 파일 하나). 세션 시작 시 오늘 + 어제를 읽는 것을 권장합니다.
  </Accordion>
  <Accordion title="MEMORY.md — 큐레이션된 장기 메모리(선택 사항)">
    큐레이션된 장기 메모리입니다. main 비공개 세션에서만 로드하세요(공유/그룹 컨텍스트 제외). 워크플로와 자동 메모리 flush는 [Memory](/ko/concepts/memory)를 참조하세요.
  </Accordion>
  <Accordion title="skills/ — 워크스페이스 Skills(선택 사항)">
    워크스페이스 전용 Skills입니다. 해당 워크스페이스에서 가장 높은 우선순위를 갖는 skill 위치입니다. 이름이 충돌하면 프로젝트 agent skills, 개인 agent skills, 관리형 skills, 번들 skills, `skills.load.extraDirs`를 재정의합니다.
  </Accordion>
  <Accordion title="canvas/ — Canvas UI 파일(선택 사항)">
    node 디스플레이용 Canvas UI 파일입니다(예: `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
bootstrap 파일이 하나라도 누락되면 OpenClaw는 세션에 "누락된 파일" 마커를 삽입하고 계속 진행합니다. 큰 bootstrap 파일은 삽입 시 잘립니다. 한도는 `agents.defaults.bootstrapMaxChars`(기본값: 12000)와 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 조정하세요. `openclaw setup`은 기존 파일을 덮어쓰지 않고 누락된 기본 파일을 다시 만들 수 있습니다.
</Note>

## 워크스페이스에 없는 것

다음 항목은 `~/.openclaw/` 아래에 있으며 워크스페이스 repo에 커밋하면 안 됩니다:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model auth profiles: OAuth + API keys)
- `~/.openclaw/credentials/` (채널/provider 상태와 레거시 OAuth 가져오기 데이터)
- `~/.openclaw/agents/<agentId>/sessions/` (세션 transcript + metadata)
- `~/.openclaw/skills/` (관리형 Skills)

세션이나 config를 마이그레이션해야 한다면 별도로 복사하고 버전 관리에는 포함하지 마세요.

## Git 백업(권장, 비공개)

워크스페이스를 비공개 메모리처럼 다루세요. 백업과 복구가 가능하도록 **비공개** git repo에 넣으세요.

이 단계는 Gateway가 실행되는 머신에서 수행하세요(워크스페이스가 거기에 있습니다).

<Steps>
  <Step title="repo 초기화">
    git이 설치되어 있으면 완전히 새로운 워크스페이스는 자동으로 초기화됩니다. 이 워크스페이스가 아직 repo가 아니라면 다음을 실행하세요:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="비공개 원격 추가">
    <Tabs>
      <Tab title="GitHub 웹 UI">
        1. GitHub에서 새 **비공개** repository를 생성합니다.
        2. README로 초기화하지 마세요(병합 충돌 방지).
        3. HTTPS 원격 URL을 복사합니다.
        4. 원격을 추가하고 푸시합니다:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab 웹 UI">
        1. GitLab에서 새 **비공개** repository를 생성합니다.
        2. README로 초기화하지 마세요(병합 충돌 방지).
        3. HTTPS 원격 URL을 복사합니다.
        4. 원격을 추가하고 푸시합니다:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="지속적인 업데이트">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## 시크릿은 커밋하지 마세요

<Warning>
비공개 repo에서도 워크스페이스에 시크릿을 저장하지 않는 것이 좋습니다:

- API 키, OAuth 토큰, 비밀번호 또는 비공개 자격 증명
- `~/.openclaw/` 아래의 모든 것
- 채팅 원본 덤프 또는 민감한 첨부 파일

민감한 참조를 반드시 저장해야 한다면 placeholder를 사용하고 실제 시크릿은 다른 곳(비밀번호 관리자, 환경 변수 또는 `~/.openclaw/`)에 보관하세요.
</Warning>

권장 `.gitignore` 시작 예시:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 새 머신으로 워크스페이스 이동하기

<Steps>
  <Step title="repo 클론">
    원하는 경로(기본값 `~/.openclaw/workspace`)에 repo를 클론합니다.
  </Step>
  <Step title="config 업데이트">
    `~/.openclaw/openclaw.json`에서 `agents.defaults.workspace`를 해당 경로로 설정합니다.
  </Step>
  <Step title="누락된 파일 시드">
    누락된 파일을 시드하려면 `openclaw setup --workspace <path>`를 실행합니다.
  </Step>
  <Step title="세션 복사(선택 사항)">
    세션이 필요하면 이전 머신의 `~/.openclaw/agents/<agentId>/sessions/`를 별도로 복사합니다.
  </Step>
</Steps>

## 고급 참고 사항

- 다중 에이전트 라우팅은 에이전트별로 다른 워크스페이스를 사용할 수 있습니다. 라우팅 구성은 [채널 라우팅](/ko/channels/channel-routing)을 참조하세요.
- `agents.defaults.sandbox`가 활성화되어 있으면 non-main 세션은 `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 샌드박스 워크스페이스를 사용할 수 있습니다.

## 관련

- [Heartbeat](/ko/gateway/heartbeat) — HEARTBEAT.md 워크스페이스 파일
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경의 워크스페이스 접근
- [세션](/ko/concepts/session) — 세션 저장 경로
- [상시 지침](/ko/automation/standing-orders) — 워크스페이스 파일의 영구 지침
