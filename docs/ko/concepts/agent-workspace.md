---
read_when:
    - 에이전트 워크스페이스나 그 파일 레이아웃을 설명해야 하는 경우
    - 에이전트 워크스페이스를 백업하거나 마이그레이션하려는 경우
summary: '에이전트 워크스페이스: 위치, 레이아웃, 백업 전략'
title: 에이전트 워크스페이스
x-i18n:
    generated_at: "2026-04-25T05:59:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

워크스페이스는 에이전트의 홈입니다. 파일 도구와 워크스페이스 컨텍스트에 사용되는 유일한 작업 디렉터리입니다. 이를 비공개로 유지하고 메모리처럼 취급하세요.

이는 구성, 자격 증명, 세션을 저장하는 `~/.openclaw/`와는 별개입니다.

**중요:** 워크스페이스는 기본 `cwd`일 뿐, 강제 샌드박스는 아닙니다. 도구는 상대 경로를 워크스페이스 기준으로 해석하지만, 샌드박싱이 활성화되지 않은 경우 절대 경로는 여전히 호스트의 다른 위치에 접근할 수 있습니다. 격리가 필요하다면 [`agents.defaults.sandbox`](/ko/gateway/sandboxing)(및/또는 에이전트별 샌드박스 구성)를 사용하세요. 샌드박싱이 활성화되고 `workspaceAccess`가 `"rw"`가 아니면, 도구는 호스트 워크스페이스가 아니라 `~/.openclaw/sandboxes` 아래의 샌드박스 워크스페이스 안에서 동작합니다.

## 기본 위치

- 기본값: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE`이 설정되어 있고 `"default"`가 아니면, 기본값은
  `~/.openclaw/workspace-<profile>`이 됩니다.
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

`openclaw onboard`, `openclaw configure`, 또는 `openclaw setup`은
워크스페이스를 생성하고, bootstrap 파일이 없으면 이를 시드합니다.
샌드박스 시드 복사는 워크스페이스 내부의 일반 파일만 허용하며, 원본 워크스페이스 밖으로 해석되는 symlink/hardlink 별칭은 무시됩니다.

이미 워크스페이스 파일을 직접 관리하고 있다면 bootstrap
파일 생성을 비활성화할 수 있습니다:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 추가 워크스페이스 폴더

이전 설치에서는 `~/openclaw`를 만들었을 수 있습니다. 여러 워크스페이스
디렉터리를 유지하면 한 번에 하나의 워크스페이스만 활성화되므로 인증이나 상태
드리프트가 혼란스럽게 발생할 수 있습니다.

**권장 사항:** 활성 워크스페이스는 하나만 유지하세요. 추가 폴더를 더 이상
사용하지 않는다면 보관하거나 휴지통으로 이동하세요(예: `trash ~/openclaw`).
의도적으로 여러 워크스페이스를 유지하는 경우,
`agents.defaults.workspace`가 활성 워크스페이스를 가리키는지 확인하세요.

`openclaw doctor`는 추가 워크스페이스 디렉터리를 감지하면 경고합니다.

## 워크스페이스 파일 맵(각 파일의 의미)

다음은 OpenClaw가 워크스페이스 내부에서 기대하는 표준 파일입니다:

- `AGENTS.md`
  - 에이전트의 운영 지침과 메모리 사용 방식.
  - 모든 세션 시작 시 로드됩니다.
  - 규칙, 우선순위, “어떻게 행동할지” 세부 사항을 적기에 좋은 위치입니다.

- `SOUL.md`
  - 페르소나, 어조, 경계.
  - 모든 세션에서 로드됩니다.
  - 가이드: [SOUL.md Personality Guide](/ko/concepts/soul)

- `USER.md`
  - 사용자가 누구인지, 어떻게 불러야 하는지.
  - 모든 세션에서 로드됩니다.

- `IDENTITY.md`
  - 에이전트의 이름, 분위기, 이모지.
  - bootstrap 의식 중 생성/업데이트됩니다.

- `TOOLS.md`
  - 로컬 도구와 관례에 대한 메모.
  - 도구 사용 가능 여부를 제어하지는 않으며, 지침만 제공합니다.

- `HEARTBEAT.md`
  - Heartbeat 실행용 선택적 작은 체크리스트.
  - 토큰 낭비를 피하기 위해 짧게 유지하세요.

- `BOOT.md`
  - Gateway 재시작 시 자동으로 실행되는 선택적 시작 체크리스트([내부 훅](/ko/automation/hooks)이 활성화된 경우).
  - 짧게 유지하고, 아웃바운드 전송에는 message 도구를 사용하세요.

- `BOOTSTRAP.md`
  - 일회성 최초 실행 의식.
  - 완전히 새로운 워크스페이스에 대해서만 생성됩니다.
  - 의식이 끝나면 삭제하세요.

- `memory/YYYY-MM-DD.md`
  - 일일 메모리 로그(하루당 하나의 파일).
  - 세션 시작 시 오늘 + 어제를 읽는 것을 권장합니다.

- `MEMORY.md` (선택 사항)
  - 선별된 장기 메모리.
  - 메인 비공개 세션에서만 로드하세요(공유/그룹 컨텍스트에서는 아님).

워크플로와 자동 메모리 플러시는 [Memory](/ko/concepts/memory)를 참고하세요.

- `skills/` (선택 사항)
  - 워크스페이스별 Skills.
  - 해당 워크스페이스에서 가장 높은 우선순위의 Skills 위치입니다.
  - 이름이 충돌하면 프로젝트 agent skills, 개인 agent skills, 관리형 skills, 번들 skills, `skills.load.extraDirs`를 재정의합니다.

- `canvas/` (선택 사항)
  - Node 디스플레이용 Canvas UI 파일(예: `canvas/index.html`).

bootstrap 파일이 하나라도 없으면, OpenClaw는 세션에 "missing file" 마커를 주입하고 계속 진행합니다. 큰 bootstrap 파일은 주입 시 잘립니다. 한도는 `agents.defaults.bootstrapMaxChars`(기본값: 12000)와 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 조정하세요.
`openclaw setup`은 기존 파일을 덮어쓰지 않고 누락된 기본 파일을 다시 만들 수 있습니다.

## 워크스페이스에 없는 것

다음은 `~/.openclaw/` 아래에 있으며 워크스페이스 저장소에 커밋하면 **안 됩니다**:

- `~/.openclaw/openclaw.json` (구성)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (모델 인증 프로필: OAuth + API 키)
- `~/.openclaw/credentials/` (채널/provider 상태와 레거시 OAuth 가져오기 데이터)
- `~/.openclaw/agents/<agentId>/sessions/` (세션 transcript + 메타데이터)
- `~/.openclaw/skills/` (관리형 Skills)

세션이나 구성을 마이그레이션해야 한다면, 별도로 복사하고 버전 관리에는 포함하지 마세요.

## Git 백업(권장, 비공개)

워크스페이스를 비공개 메모리처럼 취급하세요. **비공개** git 저장소에 넣어
백업 가능하고 복구 가능하게 만드세요.

다음 단계는 Gateway가 실행되는 머신에서 수행하세요(워크스페이스가 그곳에 있습니다).

### 1) 저장소 초기화

git이 설치되어 있으면 완전히 새로운 워크스페이스는 자동으로 초기화됩니다. 이
워크스페이스가 아직 저장소가 아니라면 다음을 실행하세요:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 비공개 원격 저장소 추가(초보자 친화적 옵션)

옵션 A: GitHub 웹 UI

1. GitHub에서 새 **비공개** 저장소를 만듭니다.
2. README로 초기화하지 마세요(병합 충돌 방지).
3. HTTPS 원격 URL을 복사합니다.
4. 원격 저장소를 추가하고 푸시합니다:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

옵션 B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

옵션 C: GitLab 웹 UI

1. GitLab에서 새 **비공개** 저장소를 만듭니다.
2. README로 초기화하지 마세요(병합 충돌 방지).
3. HTTPS 원격 URL을 복사합니다.
4. 원격 저장소를 추가하고 푸시합니다:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) 지속적인 업데이트

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## 비밀 정보는 커밋하지 마세요

비공개 저장소라 해도 워크스페이스에 비밀 정보를 저장하지 마세요:

- API 키, OAuth 토큰, 비밀번호, 개인 자격 증명.
- `~/.openclaw/` 아래의 모든 것.
- 채팅 원본 덤프나 민감한 첨부 파일.

민감한 참조를 반드시 저장해야 한다면 플레이스홀더를 사용하고 실제
비밀 정보는 다른 곳(비밀번호 관리자, 환경 변수, 또는 `~/.openclaw/`)에 보관하세요.

권장 `.gitignore` 시작 예시:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 워크스페이스를 새 머신으로 이동하기

1. 원하는 경로(기본값 `~/.openclaw/workspace`)에 저장소를 클론합니다.
2. `~/.openclaw/openclaw.json`에서 `agents.defaults.workspace`를 해당 경로로 설정합니다.
3. 누락된 파일을 시드하려면 `openclaw setup --workspace <path>`를 실행합니다.
4. 세션이 필요하다면 이전 머신의 `~/.openclaw/agents/<agentId>/sessions/`를
   별도로 복사하세요.

## 고급 참고

- 다중 에이전트 라우팅은 에이전트마다 서로 다른 워크스페이스를 사용할 수 있습니다.
  라우팅 구성은 [채널 라우팅](/ko/channels/channel-routing)을 참고하세요.
- `agents.defaults.sandbox`가 활성화되면, 메인이 아닌 세션은
  `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 샌드박스
  워크스페이스를 사용할 수 있습니다.

## 관련 항목

- [상시 지시](/ko/automation/standing-orders) — 워크스페이스 파일의 지속적인 지침
- [Heartbeat](/ko/gateway/heartbeat) — HEARTBEAT.md 워크스페이스 파일
- [세션](/ko/concepts/session) — 세션 저장 경로
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경에서의 워크스페이스 접근
