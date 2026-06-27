---
read_when:
    - 에이전트 작업 공간 또는 파일 레이아웃을 설명해야 합니다
    - 에이전트 작업 공간을 백업하거나 마이그레이션하려는 경우
sidebarTitle: Agent workspace
summary: '에이전트 작업 영역: 위치, 레이아웃 및 백업 전략'
title: 에이전트 작업 공간
x-i18n:
    generated_at: "2026-06-27T17:21:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

워크스페이스는 에이전트의 홈입니다. 파일 도구와 워크스페이스 컨텍스트에 사용되는 유일한 작업 디렉터리입니다. 비공개로 유지하고 메모리처럼 다루세요.

이는 config, 자격 증명, 세션을 저장하는 `~/.openclaw/`와는 별개입니다.

<Warning>
워크스페이스는 **기본 cwd**이지, 강제 sandbox가 아닙니다. 도구는 상대 경로를 워크스페이스 기준으로 해석하지만, sandboxing이 활성화되어 있지 않으면 절대 경로로 호스트의 다른 위치에 여전히 접근할 수 있습니다. 격리가 필요하다면 [`agents.defaults.sandbox`](/ko/gateway/sandboxing)(및/또는 에이전트별 sandbox config)를 사용하세요.

sandboxing이 활성화되어 있고 `workspaceAccess`가 `"rw"`가 아니면, 도구는 호스트 워크스페이스가 아니라 `~/.openclaw/sandboxes` 아래의 sandbox 워크스페이스 안에서 작동합니다.
</Warning>

## 기본 위치

- 기본값: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE`이 설정되어 있고 `"default"`가 아니면, 기본값은 `~/.openclaw/workspace-<profile>`이 됩니다.
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

`openclaw onboard`, `openclaw configure` 또는 `openclaw setup`은 워크스페이스를 만들고 bootstrap 파일이 없으면 초기 파일을 배치합니다.

<Note>
Sandbox seed 복사는 일반적인 워크스페이스 내부 파일만 허용합니다. 소스 워크스페이스 밖으로 해석되는 symlink/hardlink 별칭은 무시됩니다.
</Note>

워크스페이스 파일을 이미 직접 관리하고 있다면 bootstrap 파일 생성을 비활성화할 수 있습니다.

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 추가 워크스페이스 폴더

이전 설치에서는 `~/openclaw`가 만들어졌을 수 있습니다. 활성 워크스페이스는 한 번에 하나뿐이므로, 여러 워크스페이스 디렉터리를 남겨 두면 인증 또는 상태 드리프트가 혼란스러울 수 있습니다.

<Note>
**권장 사항:** 활성 워크스페이스는 하나만 유지하세요. 추가 폴더를 더 이상 사용하지 않는다면 보관하거나 휴지통으로 이동하세요(예: `trash ~/openclaw`). 여러 워크스페이스를 의도적으로 유지한다면 `agents.defaults.workspace`가 활성 워크스페이스를 가리키는지 확인하세요.

`openclaw doctor`는 추가 워크스페이스 디렉터리를 감지하면 경고합니다.
</Note>

## 워크스페이스 파일 맵

다음은 OpenClaw가 워크스페이스 안에 있을 것으로 기대하는 표준 파일입니다.

<AccordionGroup>
  <Accordion title="AGENTS.md - operating instructions">
    에이전트를 위한 운영 지침과 메모리 사용 방식입니다. 모든 세션 시작 시 로드됩니다. 규칙, 우선순위, “행동 방식” 세부 사항을 두기에 좋은 위치입니다.
  </Accordion>
  <Accordion title="SOUL.md - persona and tone">
    페르소나, 톤, 경계입니다. 모든 세션에서 로드됩니다. 가이드: [SOUL.md 성격 가이드](/ko/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - who the user is">
    사용자가 누구이며 어떻게 호칭해야 하는지입니다. 모든 세션에서 로드됩니다.
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    에이전트의 이름, 분위기, 이모지입니다. bootstrap 의식 중에 생성/업데이트됩니다.
  </Accordion>
  <Accordion title="TOOLS.md - local tool conventions">
    로컬 도구와 규칙에 대한 메모입니다. 도구 사용 가능 여부를 제어하지 않으며, 안내용일 뿐입니다.
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    Heartbeat 실행을 위한 선택적 작은 체크리스트입니다. 토큰 소모를 피하려면 짧게 유지하세요.
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    Gateway 재시작 시([internal hooks](/ko/automation/hooks)가 활성화된 경우) 자동으로 실행되는 선택적 시작 체크리스트입니다. 짧게 유지하고, outbound 전송에는 메시지 도구를 사용하세요.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    일회성 최초 실행 의식입니다. 완전히 새 워크스페이스에만 생성됩니다. 의식이 완료되면 삭제하세요.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    일일 메모리 로그(하루에 파일 하나)입니다. 세션 시작 시 오늘 + 어제를 읽는 것을 권장합니다.
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    선별된 장기 메모리: 지속적인 사실, 선호도, 결정, 짧은 요약입니다. 자세한 로그는 `memory/YYYY-MM-DD.md`에 보관해 메모리 도구가 필요할 때 검색할 수 있게 하고, 모든 프롬프트에 주입하지 않도록 하세요. `MEMORY.md`는 메인 비공개 세션에서만 로드하세요(공유/그룹 컨텍스트 제외). 워크플로와 자동 메모리 flush는 [메모리](/ko/concepts/memory)를 참고하세요.
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    워크스페이스별 Skills입니다. 해당 워크스페이스에서 가장 높은 우선순위를 갖는 Skills 위치입니다. 이름이 충돌하면 프로젝트 에이전트 Skills, 개인 에이전트 Skills, 관리형 Skills, bundled Skills, `skills.load.extraDirs`를 재정의합니다.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    노드 표시용 Canvas UI 파일입니다(예: `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
bootstrap 파일이 누락되면 OpenClaw는 세션에 “missing file” 마커를 주입하고 계속 진행합니다. 큰 bootstrap 파일은 주입 시 잘립니다. 제한은 `agents.defaults.bootstrapMaxChars`(기본값: 20000) 및 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 조정하세요. `openclaw setup`은 기존 파일을 덮어쓰지 않고 누락된 기본값을 다시 만들 수 있습니다.
</Note>

## 워크스페이스에 포함되지 않는 것

다음은 `~/.openclaw/` 아래에 있으며 워크스페이스 repo에 커밋하면 안 됩니다.

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (모델 인증 프로필: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (에이전트별 Codex 런타임 계정, config, skills, plugins, 네이티브 thread 상태)
- `~/.openclaw/credentials/` (채널/제공자 상태 및 legacy OAuth import 데이터)
- `~/.openclaw/agents/<agentId>/sessions/` (세션 transcript + metadata)
- `~/.openclaw/skills/` (관리형 skills)

세션이나 config를 마이그레이션해야 한다면 별도로 복사하고 버전 관리에는 포함하지 마세요.

## Git 백업(권장, 비공개)

워크스페이스를 비공개 메모리로 다루세요. 백업 및 복구가 가능하도록 **private** git repo에 넣으세요.

다음 단계는 Gateway가 실행되는 머신에서 실행하세요(워크스페이스가 있는 곳입니다).

<Steps>
  <Step title="Initialize the repo">
    git이 설치되어 있으면 완전히 새 워크스페이스는 자동으로 초기화됩니다. 이 워크스페이스가 아직 repo가 아니라면 다음을 실행하세요.

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. GitHub에서 새 **private** 저장소를 만듭니다.
        2. README로 초기화하지 마세요(merge conflict 방지).
        3. HTTPS remote URL을 복사합니다.
        4. remote를 추가하고 push합니다.

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
      <Tab title="GitLab web UI">
        1. GitLab에서 새 **private** 저장소를 만듭니다.
        2. README로 초기화하지 마세요(merge conflict 방지).
        3. HTTPS remote URL을 복사합니다.
        4. remote를 추가하고 push합니다.

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## 비밀을 커밋하지 마세요

<Warning>
private repo에서도 워크스페이스에 비밀을 저장하지 마세요.

- API keys, OAuth tokens, passwords 또는 private credentials.
- `~/.openclaw/` 아래의 모든 항목.
- 채팅 또는 민감한 첨부 파일의 원시 dump.

민감한 참조를 저장해야 한다면 placeholder를 사용하고 실제 비밀은 다른 곳(password manager, environment variables 또는 `~/.openclaw/`)에 보관하세요.
</Warning>

제안하는 `.gitignore` 시작점:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 워크스페이스를 새 머신으로 이동하기

<Steps>
  <Step title="Clone the repo">
    원하는 경로(기본값 `~/.openclaw/workspace`)로 repo를 clone합니다.
  </Step>
  <Step title="Update config">
    `~/.openclaw/openclaw.json`에서 `agents.defaults.workspace`를 해당 경로로 설정합니다.
  </Step>
  <Step title="Seed missing files">
    누락된 파일을 배치하려면 `openclaw setup --workspace <path>`를 실행합니다.
  </Step>
  <Step title="Copy sessions (optional)">
    세션이 필요하다면 이전 머신에서 `~/.openclaw/agents/<agentId>/sessions/`를 별도로 복사합니다.
  </Step>
</Steps>

## 고급 참고 사항

- 다중 에이전트 routing은 에이전트별로 다른 워크스페이스를 사용할 수 있습니다. routing config는 [채널 routing](/ko/channels/channel-routing)을 참고하세요.
- `agents.defaults.sandbox`가 활성화되어 있으면 메인이 아닌 세션은 `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 sandbox 워크스페이스를 사용할 수 있습니다.

## 관련 문서

- [Heartbeat](/ko/gateway/heartbeat) - HEARTBEAT.md 워크스페이스 파일
- [Sandboxing](/ko/gateway/sandboxing) - sandboxed 환경의 워크스페이스 접근
- [세션](/ko/concepts/session) - 세션 저장 경로
- [Standing orders](/ko/automation/standing-orders) - 워크스페이스 파일의 지속적 지침
