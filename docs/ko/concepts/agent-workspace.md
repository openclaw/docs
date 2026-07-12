---
read_when:
    - 에이전트 작업 공간 또는 해당 파일 구조를 설명해야 합니다
    - 에이전트 작업 공간을 백업하거나 마이그레이션하려고 합니다
sidebarTitle: Agent workspace
summary: '에이전트 작업 공간: 위치, 구조 및 백업 전략'
title: 에이전트 작업 공간
x-i18n:
    generated_at: "2026-07-12T15:08:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e09c26d19dd7926b379ae4d094c98c2a2f5b37b9453a4cc2048c3b212ae5a9c2
    source_path: concepts/agent-workspace.md
    workflow: 16
---

워크스페이스는 에이전트의 홈입니다. 즉, 파일 도구와 워크스페이스 컨텍스트에 사용되는 작업 디렉터리입니다. 워크스페이스를 비공개로 유지하고 메모리처럼 취급하십시오.

이는 구성, 자격 증명, 세션을 저장하는 `~/.openclaw/`와는 별개입니다.

<Warning>
워크스페이스는 **기본 cwd**일 뿐, 강제 샌드박스가 아닙니다. 도구는 워크스페이스를 기준으로 상대 경로를 해석하지만, 샌드박싱을 활성화하지 않으면 절대 경로로 호스트의 다른 위치에도 접근할 수 있습니다. 격리가 필요하면 [`agents.defaults.sandbox`](/ko/gateway/sandboxing)를 사용하십시오(또는 에이전트별 샌드박스 구성도 함께 사용하십시오).

샌드박싱이 활성화되어 있고 `workspaceAccess`가 `"rw"`가 아니면, 도구는 호스트 워크스페이스가 아니라 `~/.openclaw/sandboxes` 아래의 샌드박스 워크스페이스에서 작동합니다.
</Warning>

## 기본 위치

- 기본값: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE`이 설정되어 있고 `"default"`가 아니면 기본값은 `~/.openclaw/workspace-<profile>`이 됩니다.
- `OPENCLAW_WORKSPACE_DIR`이 설정되어 있으면 위 두 기본값을 모두 재정의합니다.
- 명시적인 워크스페이스가 없는 기본값 외 에이전트(`agents.list[]`)는 공유 기본 워크스페이스가 아니라 `<state-dir>/workspace-<agentId>`로 해석됩니다.

`~/.openclaw/openclaw.json`에서 재정의하십시오.

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

에이전트별 재정의: `agents.list[].workspace`.

`openclaw onboard`, `openclaw configure` 또는 `openclaw setup`은 워크스페이스를 생성하고 부트스트랩 파일이 없으면 초기 파일을 배치합니다.

<Note>
샌드박스 초기 파일 복사는 워크스페이스 내부의 일반 파일만 허용합니다. 소스 워크스페이스 외부로 해석되는 심볼릭 링크/하드 링크 별칭은 무시됩니다.
</Note>

워크스페이스 파일을 이미 직접 관리하고 있다면 부트스트랩 파일 생성을 비활성화하십시오.

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 추가 워크스페이스 폴더

이전 설치에서는 `~/openclaw`를 생성했을 수 있습니다. 한 번에 하나의 워크스페이스만 활성화되므로 여러 워크스페이스 디렉터리를 유지하면 인증 또는 상태가 서로 달라져 혼란을 일으킬 수 있습니다.

<Note>
**권장 사항:** 활성 워크스페이스를 하나만 유지하십시오. 추가 폴더를 더 이상 사용하지 않는다면 보관하거나 휴지통으로 이동하십시오(예: `trash ~/openclaw`). 의도적으로 여러 워크스페이스를 유지한다면 `agents.defaults.workspace` 또는 에이전트별 `workspace` 키가 활성 워크스페이스를 가리키는지 확인하십시오.
</Note>

## 워크스페이스 파일 구성

OpenClaw가 워크스페이스 내부에 있을 것으로 예상하는 표준 파일은 다음과 같습니다.

<AccordionGroup>
  <Accordion title="AGENTS.md - 운영 지침">
    에이전트의 운영 방식과 메모리 사용 방법에 관한 지침입니다. 모든 세션이 시작될 때 로드됩니다. 규칙, 우선순위, 행동 방식에 관한 세부 정보를 두기에 적합합니다.
  </Accordion>
  <Accordion title="SOUL.md - 페르소나와 어조">
    페르소나, 어조, 경계를 정의합니다. 모든 세션에서 로드됩니다. 안내서: [SOUL.md 성격 안내서](/ko/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - 사용자 정보">
    사용자가 누구인지, 사용자를 어떻게 호칭할지를 정의합니다. 모든 세션에서 로드됩니다.
  </Accordion>
  <Accordion title="IDENTITY.md - 이름, 분위기, 이모지">
    에이전트의 이름, 분위기, 이모지를 정의합니다. 부트스트랩 절차 중에 생성되거나 업데이트됩니다.
  </Accordion>
  <Accordion title="TOOLS.md - 로컬 도구 규칙">
    로컬 도구와 규칙에 관한 참고 사항입니다. 도구의 사용 가능 여부를 제어하지 않으며 안내 용도로만 사용됩니다.
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat 체크리스트">
    Heartbeat 실행에 사용하는 선택적이고 간단한 체크리스트입니다. 토큰 소모를 방지하려면 짧게 유지하십시오.
  </Accordion>
  <Accordion title="BOOT.md - 시작 체크리스트">
    Gateway가 다시 시작될 때 자동으로 실행되는 선택적 시작 체크리스트입니다([내부 훅](/ko/automation/hooks)이 활성화된 경우). 짧게 유지하고 외부로 메시지를 보낼 때는 메시지 도구를 사용하십시오.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 최초 실행 절차">
    한 번만 수행하는 최초 실행 절차입니다. 완전히 새로운 워크스페이스에만 생성됩니다. 절차가 완료되면 삭제하십시오.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 일일 메모리 로그">
    일일 메모리 로그입니다(하루에 파일 하나). 세션 시작 시 오늘과 어제의 로그를 읽는 것이 좋습니다.
  </Accordion>
  <Accordion title="MEMORY.md - 선별된 장기 메모리(선택 사항)">
    선별된 장기 메모리로, 지속적인 사실, 선호 사항, 결정 및 짧은 요약을 저장합니다. 메모리 도구가 모든 프롬프트에 삽입하지 않고도 필요할 때 검색할 수 있도록 상세 로그는 `memory/YYYY-MM-DD.md`에 보관하십시오. `MEMORY.md`는 기본 비공개 세션에서만 로드하고 공유/그룹 컨텍스트에서는 로드하지 마십시오. 워크플로와 자동 메모리 플러시는 [메모리](/ko/concepts/memory)를 참조하십시오.
  </Accordion>
  <Accordion title="skills/ - 워크스페이스 Skills(선택 사항)">
    워크스페이스별 Skills입니다. 이름이 충돌할 경우 프로젝트 에이전트 Skills, 개인 에이전트 Skills, 관리형 Skills, 번들 Skills 및 `skills.load.extraDirs`보다 우선하는 해당 워크스페이스의 최우선 Skills 위치입니다.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 파일(선택 사항)">
    Node 디스플레이용 Canvas UI 파일입니다(예: `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
부트스트랩 파일이 없으면 OpenClaw는 세션에 "파일 없음" 표시를 삽입하고 계속 진행합니다. 큰 부트스트랩 파일은 삽입 시 잘립니다. `agents.defaults.bootstrapMaxChars`(기본값: `20000`)와 `agents.defaults.bootstrapTotalMaxChars`(기본값: `60000`)로 제한을 조정하십시오. `openclaw setup`은 기존 파일을 덮어쓰지 않고 누락된 기본 파일을 다시 생성할 수 있습니다.
</Note>

## 워크스페이스에 포함되지 않는 항목

다음 항목은 `~/.openclaw/` 아래에 있으며 워크스페이스 저장소에 커밋해서는 **안 됩니다**.

- `~/.openclaw/openclaw.json`(구성)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`(모델 인증 프로필: OAuth + API 키)
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`(세션 행, 대화 기록 및 에이전트별 런타임 상태)
- `~/.openclaw/agents/<agentId>/agent/codex-home/`(에이전트별 Codex 런타임 계정, 구성, Skills, Plugin 및 네이티브 스레드 상태)
- `~/.openclaw/credentials/`(채널/공급자 상태 및 레거시 OAuth 가져오기 데이터)
- `~/.openclaw/agents/<agentId>/sessions/`(레거시 마이그레이션 소스 및 보관/지원 아티팩트)
- `~/.openclaw/skills/`(관리형 Skills)

세션 또는 구성을 마이그레이션해야 한다면 별도로 복사하고 버전 관리에는 포함하지 마십시오.

## Git 백업(권장, 비공개)

워크스페이스를 비공개 메모리처럼 취급하십시오. 백업하고 복구할 수 있도록 **비공개** git 저장소에 넣으십시오.

Gateway가 실행되는 머신에서 다음 단계를 수행하십시오(워크스페이스가 있는 위치입니다).

<Steps>
  <Step title="저장소 초기화">
    git이 설치되어 있으면 완전히 새로운 워크스페이스는 자동으로 초기화됩니다. 이 워크스페이스가 아직 저장소가 아니라면 다음을 실행하십시오.

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="비공개 원격 저장소 추가">
    <Tabs>
      <Tab title="GitHub 웹 UI">
        1. GitHub에서 새 **private** 저장소를 생성합니다.
        2. README로 초기화하지 마십시오(병합 충돌 방지).
        3. HTTPS 원격 URL을 복사합니다.
        4. 원격 저장소를 추가하고 푸시합니다.

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
        1. GitLab에서 새 **private** 저장소를 생성합니다.
        2. README로 초기화하지 마십시오(병합 충돌 방지).
        3. HTTPS 원격 URL을 복사합니다.
        4. 원격 저장소를 추가하고 푸시합니다.

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

## 비밀 정보를 커밋하지 마십시오

<Warning>
비공개 저장소에서도 워크스페이스에 비밀 정보를 저장하지 마십시오.

- API 키, OAuth 토큰, 비밀번호 또는 비공개 자격 증명.
- `~/.openclaw/` 아래의 모든 항목.
- 채팅의 원시 덤프 또는 민감한 첨부 파일.

민감한 참조를 저장해야 한다면 자리 표시자를 사용하고 실제 비밀 정보는 다른 위치(비밀번호 관리자, 환경 변수 또는 `~/.openclaw/`)에 보관하십시오.
</Warning>

권장 `.gitignore` 시작 예시는 다음과 같습니다.

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 워크스페이스를 새 머신으로 이동하기

<Steps>
  <Step title="저장소 복제">
    원하는 경로(기본값 `~/.openclaw/workspace`)에 저장소를 복제합니다.
  </Step>
  <Step title="구성 업데이트">
    `~/.openclaw/openclaw.json`에서 `agents.defaults.workspace`를 해당 경로로 설정합니다.
  </Step>
  <Step title="누락된 파일 초기 배치">
    `openclaw setup --workspace <path>`를 실행하여 누락된 파일을 초기 배치합니다.
  </Step>
  <Step title="세션 복사(선택 사항)">
    세션이 필요하면 이전 머신의 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`를
    별도로 복사하십시오. 레거시 마이그레이션 입력 또는 보관/지원 아티팩트도 필요한 경우에만
    `~/.openclaw/agents/<agentId>/sessions/`를 복사하십시오.
  </Step>
</Steps>

## 고급 참고 사항

- 다중 에이전트 라우팅에서는 `agents.list[].workspace`를 통해 에이전트마다 서로 다른 워크스페이스를 사용할 수 있습니다. 라우팅 구성은 [채널 라우팅](/ko/channels/channel-routing)을 참조하십시오.
- `agents.defaults.sandbox`가 활성화되어 있으면 기본 세션이 아닌 세션에서 `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 샌드박스 워크스페이스를 사용할 수 있습니다.

## 관련 항목

- [Heartbeat](/ko/gateway/heartbeat) - HEARTBEAT.md 워크스페이스 파일
- [샌드박싱](/ko/gateway/sandboxing) - 샌드박스 환경에서의 워크스페이스 접근
- [세션](/ko/concepts/session) - 세션 저장소 경로
- [상시 지침](/ko/automation/standing-orders) - 워크스페이스 파일의 영구 지침
