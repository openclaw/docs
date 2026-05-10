---
read_when:
    - 에이전트 워크스페이스 또는 해당 파일 레이아웃을 설명해야 합니다
    - 에이전트 워크스페이스를 백업하거나 마이그레이션하려는 경우
sidebarTitle: Agent workspace
summary: '에이전트 작업 공간: 위치, 레이아웃 및 백업 전략'
title: 에이전트 작업 공간
x-i18n:
    generated_at: "2026-05-10T19:30:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

작업공간은 에이전트의 홈입니다. 파일 도구와 작업공간 컨텍스트에 사용되는 유일한 작업 디렉터리입니다. 비공개로 유지하고 메모리처럼 다루세요.

이는 구성, 자격 증명, 세션을 저장하는 `~/.openclaw/`와는 별개입니다.

<Warning>
작업공간은 **기본 cwd**이며, 엄격한 샌드박스가 아닙니다. 도구는 작업공간을 기준으로 상대 경로를 해석하지만, 샌드박싱이 활성화되어 있지 않으면 절대 경로로 호스트의 다른 위치에도 여전히 접근할 수 있습니다. 격리가 필요하면 [`agents.defaults.sandbox`](/ko/gateway/sandboxing)(및/또는 에이전트별 샌드박스 구성)를 사용하세요.

샌드박싱이 활성화되어 있고 `workspaceAccess`가 `"rw"`가 아니면, 도구는 호스트 작업공간이 아니라 `~/.openclaw/sandboxes` 아래의 샌드박스 작업공간 안에서 작동합니다.
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

`openclaw onboard`, `openclaw configure`, 또는 `openclaw setup`은 작업공간을 만들고, 부트스트랩 파일이 없으면 시드합니다.

<Note>
샌드박스 시드 복사는 일반적인 작업공간 내부 파일만 허용합니다. 원본 작업공간 밖으로 해석되는 심볼릭 링크/하드링크 별칭은 무시됩니다.
</Note>

작업공간 파일을 이미 직접 관리하고 있다면, 부트스트랩 파일 생성을 비활성화할 수 있습니다.

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 추가 작업공간 폴더

이전 설치에서는 `~/openclaw`가 만들어졌을 수 있습니다. 여러 작업공간 디렉터리를 남겨두면 한 번에 하나의 작업공간만 활성화되기 때문에 인증이나 상태가 혼동되거나 드리프트될 수 있습니다.

<Note>
**권장 사항:** 활성 작업공간은 하나만 유지하세요. 추가 폴더를 더 이상 사용하지 않는다면 보관하거나 휴지통으로 이동하세요(예: `trash ~/openclaw`). 의도적으로 여러 작업공간을 유지한다면 `agents.defaults.workspace`가 활성 작업공간을 가리키는지 확인하세요.

`openclaw doctor`는 추가 작업공간 디렉터리를 감지하면 경고합니다.
</Note>

## 작업공간 파일 맵

다음은 OpenClaw가 작업공간 안에 있을 것으로 기대하는 표준 파일입니다.

<AccordionGroup>
  <Accordion title="AGENTS.md - 운영 지침">
    에이전트의 운영 지침과 메모리 사용 방법입니다. 모든 세션 시작 시 로드됩니다. 규칙, 우선순위, "행동 방식" 세부 사항을 두기에 좋은 위치입니다.
  </Accordion>
  <Accordion title="SOUL.md - 페르소나와 톤">
    페르소나, 톤, 경계입니다. 모든 세션에서 로드됩니다. 가이드: [SOUL.md 성격 가이드](/ko/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - 사용자가 누구인지">
    사용자가 누구이며 어떻게 호칭해야 하는지입니다. 모든 세션에서 로드됩니다.
  </Accordion>
  <Accordion title="IDENTITY.md - 이름, 분위기, 이모지">
    에이전트의 이름, 분위기, 이모지입니다. 부트스트랩 의식 중에 생성/업데이트됩니다.
  </Accordion>
  <Accordion title="TOOLS.md - 로컬 도구 규칙">
    로컬 도구와 규칙에 대한 참고 사항입니다. 도구 사용 가능 여부를 제어하지 않으며, 지침일 뿐입니다.
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat 체크리스트">
    Heartbeat 실행을 위한 선택적이고 작은 체크리스트입니다. 토큰 소모를 피하려면 짧게 유지하세요.
  </Accordion>
  <Accordion title="BOOT.md - 시작 체크리스트">
    Gateway 재시작 시([내부 훅](/ko/automation/hooks)이 활성화된 경우) 자동으로 실행되는 선택적 시작 체크리스트입니다. 짧게 유지하고, 외부 전송에는 메시지 도구를 사용하세요.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 첫 실행 의식">
    1회성 첫 실행 의식입니다. 완전히 새로운 작업공간에만 생성됩니다. 의식이 완료되면 삭제하세요.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 일일 메모리 로그">
    일일 메모리 로그입니다(하루에 파일 하나). 세션 시작 시 오늘 + 어제를 읽는 것을 권장합니다.
  </Accordion>
  <Accordion title="MEMORY.md - 선별된 장기 메모리(선택 사항)">
    선별된 장기 메모리: 지속적인 사실, 선호 사항, 결정, 짧은 요약입니다. 자세한 로그는 `memory/YYYY-MM-DD.md`에 유지하여 메모리 도구가 필요할 때 모든 프롬프트에 주입하지 않고 검색할 수 있게 하세요. `MEMORY.md`는 메인 비공개 세션에서만 로드하세요(공유/그룹 컨텍스트는 제외). 워크플로와 자동 메모리 플러시는 [Memory](/ko/concepts/memory)를 참조하세요.
  </Accordion>
  <Accordion title="skills/ - 작업공간 Skills(선택 사항)">
    작업공간별 Skills입니다. 해당 작업공간에서 가장 높은 우선순위를 갖는 스킬 위치입니다. 이름이 충돌하면 프로젝트 에이전트 Skills, 개인 에이전트 Skills, 관리형 Skills, 번들 Skills, `skills.load.extraDirs`를 재정의합니다.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 파일(선택 사항)">
    노드 표시를 위한 Canvas UI 파일입니다(예: `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
부트스트랩 파일이 누락되면 OpenClaw는 세션에 "누락된 파일" 마커를 주입하고 계속 진행합니다. 큰 부트스트랩 파일은 주입 시 잘립니다. 제한은 `agents.defaults.bootstrapMaxChars`(기본값: 12000)와 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 조정하세요. `openclaw setup`은 기존 파일을 덮어쓰지 않고 누락된 기본값을 다시 만들 수 있습니다.
</Note>

## 작업공간에 포함되지 않는 것

다음은 `~/.openclaw/` 아래에 있으며 작업공간 저장소에 커밋하면 안 됩니다.

- `~/.openclaw/openclaw.json`(구성)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`(모델 인증 프로필: OAuth + API 키)
- `~/.openclaw/agents/<agentId>/agent/codex-home/`(에이전트별 Codex 런타임 계정, 구성, Skills, 플러그인, 네이티브 스레드 상태)
- `~/.openclaw/credentials/`(채널/프로바이더 상태 및 레거시 OAuth 가져오기 데이터)
- `~/.openclaw/agents/<agentId>/sessions/`(세션 트랜스크립트 + 메타데이터)
- `~/.openclaw/skills/`(관리형 Skills)

세션이나 구성을 마이그레이션해야 한다면 별도로 복사하고 버전 관리에서 제외하세요.

## Git 백업(권장, 비공개)

작업공간을 비공개 메모리처럼 다루세요. 백업과 복구가 가능하도록 **비공개** git 저장소에 넣으세요.

다음 단계는 Gateway가 실행되는 머신에서 실행하세요(그곳에 작업공간이 있습니다).

<Steps>
  <Step title="저장소 초기화">
    git이 설치되어 있으면 완전히 새로운 작업공간은 자동으로 초기화됩니다. 이 작업공간이 아직 저장소가 아니라면 다음을 실행하세요.

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
        1. GitHub에서 새 **비공개** 저장소를 만드세요.
        2. README로 초기화하지 마세요(병합 충돌 방지).
        3. HTTPS 원격 URL을 복사하세요.
        4. 원격을 추가하고 푸시하세요.

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
        1. GitLab에서 새 **비공개** 저장소를 만드세요.
        2. README로 초기화하지 마세요(병합 충돌 방지).
        3. HTTPS 원격 URL을 복사하세요.
        4. 원격을 추가하고 푸시하세요.

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

## 비밀 정보를 커밋하지 마세요

<Warning>
비공개 저장소에서도 작업공간에 비밀 정보를 저장하지 마세요.

- API 키, OAuth 토큰, 비밀번호, 또는 비공개 자격 증명.
- `~/.openclaw/` 아래의 모든 것.
- 채팅이나 민감한 첨부 파일의 원시 덤프.

민감한 참조를 저장해야 한다면 플레이스홀더를 사용하고 실제 비밀은 다른 곳(비밀번호 관리자, 환경 변수, 또는 `~/.openclaw/`)에 보관하세요.
</Warning>

제안 `.gitignore` 시작점:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 작업공간을 새 머신으로 이동

<Steps>
  <Step title="저장소 클론">
    원하는 경로(기본값 `~/.openclaw/workspace`)에 저장소를 클론하세요.
  </Step>
  <Step title="구성 업데이트">
    `~/.openclaw/openclaw.json`에서 `agents.defaults.workspace`를 해당 경로로 설정하세요.
  </Step>
  <Step title="누락된 파일 시드">
    누락된 파일을 시드하려면 `openclaw setup --workspace <path>`를 실행하세요.
  </Step>
  <Step title="세션 복사(선택 사항)">
    세션이 필요하면 이전 머신의 `~/.openclaw/agents/<agentId>/sessions/`를 별도로 복사하세요.
  </Step>
</Steps>

## 고급 참고 사항

- 다중 에이전트 라우팅은 에이전트별로 서로 다른 작업공간을 사용할 수 있습니다. 라우팅 구성은 [채널 라우팅](/ko/channels/channel-routing)을 참조하세요.
- `agents.defaults.sandbox`가 활성화되어 있으면, 메인이 아닌 세션은 `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 샌드박스 작업공간을 사용할 수 있습니다.

## 관련 항목

- [Heartbeat](/ko/gateway/heartbeat) - HEARTBEAT.md 작업공간 파일
- [샌드박싱](/ko/gateway/sandboxing) - 샌드박스 환경에서의 작업공간 접근
- [세션](/ko/concepts/session) - 세션 저장 경로
- [상시 지시](/ko/automation/standing-orders) - 작업공간 파일의 지속적 지침
