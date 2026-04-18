---
read_when:
    - 에이전트 작업 공간 또는 파일 레이아웃을 설명해야 합니다.
    - 에이전트 작업 공간을 백업하거나 마이그레이션하려고 합니다.
summary: '에이전트 작업 공간: 위치, 레이아웃 및 백업 전략'
title: 에이전트 작업 공간
x-i18n:
    generated_at: "2026-04-18T05:51:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd2e74614d8d45df04b1bbda48e2224e778b621803d774d38e4b544195eb234e
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# 에이전트 작업 공간

작업 공간은 에이전트의 홈입니다. 파일 도구와 작업 공간 컨텍스트에 사용되는 유일한 작업 디렉터리입니다. 비공개로 유지하고 메모리처럼 다루세요.

이것은 설정, 자격 증명, 세션을 저장하는 `~/.openclaw/`와는 별개입니다.

**중요:** 작업 공간은 **기본 cwd**이지, 강제 샌드박스는 아닙니다. 도구는 상대 경로를 작업 공간 기준으로 해석하지만, 샌드박싱이 활성화되지 않은 경우 절대 경로는 여전히 호스트의 다른 위치에 접근할 수 있습니다. 격리가 필요하다면 [`agents.defaults.sandbox`](/ko/gateway/sandboxing) 및/또는 에이전트별 샌드박스 설정을 사용하세요. 샌드박싱이 활성화되어 있고 `workspaceAccess`가 `"rw"`가 아니면, 도구는 호스트 작업 공간이 아니라 `~/.openclaw/sandboxes` 아래의 샌드박스 작업 공간에서 동작합니다.

## 기본 위치

- 기본값: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE`이 설정되어 있고 `"default"`가 아니라면, 기본값은 `~/.openclaw/workspace-<profile>`이 됩니다.
- `~/.openclaw/openclaw.json`에서 재정의:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure`, 또는 `openclaw setup`은 작업 공간이 없을 경우 이를 생성하고 부트스트랩 파일을 초기화합니다.
샌드박스 시드 복사는 작업 공간 내부의 일반 파일만 허용하며, 원본 작업 공간 외부를 가리키는 심볼릭 링크/하드 링크 별칭은 무시됩니다.

이미 작업 공간 파일을 직접 관리하고 있다면, 부트스트랩 파일 생성을 비활성화할 수 있습니다:

```json5
{ agent: { skipBootstrap: true } }
```

## 추가 작업 공간 폴더

이전 설치에서는 `~/openclaw`를 만들었을 수 있습니다. 여러 작업 공간 디렉터리를 그대로 두면 한 번에 하나의 작업 공간만 활성화되므로 인증이나 상태가 엇갈려 혼란이 생길 수 있습니다.

**권장 사항:** 활성 작업 공간은 하나만 유지하세요. 추가 폴더를 더 이상 사용하지 않는다면 보관하거나 휴지통으로 이동하세요(예: `trash ~/openclaw`). 의도적으로 여러 작업 공간을 유지하는 경우, `agents.defaults.workspace`가 현재 활성 작업 공간을 가리키는지 확인하세요.

`openclaw doctor`는 추가 작업 공간 디렉터리를 감지하면 경고합니다.

## 작업 공간 파일 맵(각 파일의 의미)

다음은 OpenClaw가 작업 공간 내부에서 기대하는 표준 파일입니다:

- `AGENTS.md`
  - 에이전트의 운영 지침과 메모리 사용 방식.
  - 모든 세션 시작 시 로드됩니다.
  - 규칙, 우선순위, "어떻게 행동할지"에 대한 세부 사항을 두기에 좋은 위치입니다.

- `SOUL.md`
  - 페르소나, 말투, 경계.
  - 모든 세션에서 로드됩니다.
  - 가이드: [SOUL.md 개성 가이드](/ko/concepts/soul)

- `USER.md`
  - 사용자가 누구인지, 어떻게 호칭해야 하는지.
  - 모든 세션에서 로드됩니다.

- `IDENTITY.md`
  - 에이전트의 이름, 분위기, 이모지.
  - 부트스트랩 의식 중 생성/업데이트됩니다.

- `TOOLS.md`
  - 로컬 도구와 관례에 대한 메모.
  - 도구 사용 가능 여부를 제어하지 않으며, 안내용일 뿐입니다.

- `HEARTBEAT.md`
  - Heartbeat 실행을 위한 선택적 소형 체크리스트.
  - 토큰 낭비를 피하기 위해 짧게 유지하세요.

- `BOOT.md`
  - 내부 훅이 활성화되어 있을 때 Gateway 재시작 시 실행되는 선택적 시작 체크리스트.
  - 짧게 유지하고, 발신에는 메시지 도구를 사용하세요.

- `BOOTSTRAP.md`
  - 1회성 최초 실행 의식.
  - 완전히 새로운 작업 공간에만 생성됩니다.
  - 의식이 완료되면 삭제하세요.

- `memory/YYYY-MM-DD.md`
  - 일일 메모리 로그(하루당 파일 하나).
  - 세션 시작 시 오늘 것과 어제 것을 읽는 것을 권장합니다.

- `MEMORY.md` (선택 사항)
  - 선별된 장기 메모리.
  - 메인 비공개 세션에서만 로드합니다(공유/그룹 컨텍스트 제외).

워크플로 및 자동 메모리 플러시에 대해서는 [Memory](/ko/concepts/memory)를 참고하세요.

- `skills/` (선택 사항)
  - 작업 공간 전용 Skills.
  - 해당 작업 공간에서 가장 높은 우선순위를 가지는 Skills 위치입니다.
  - 이름이 충돌할 경우 프로젝트 에이전트 Skills, 개인 에이전트 Skills, 관리형 Skills, 번들 Skills, `skills.load.extraDirs`보다 우선합니다.

- `canvas/` (선택 사항)
  - 노드 표시용 Canvas UI 파일(예: `canvas/index.html`).

부트스트랩 파일이 하나라도 누락되면 OpenClaw는 세션에 "missing file" 마커를 삽입하고 계속 진행합니다. 큰 부트스트랩 파일은 삽입 시 잘립니다. 한도는 `agents.defaults.bootstrapMaxChars`(기본값: 12000)와 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 조정할 수 있습니다.
`openclaw setup`은 기존 파일을 덮어쓰지 않고 누락된 기본 파일을 다시 만들 수 있습니다.

## 작업 공간에 포함되지 않는 것

다음 항목은 `~/.openclaw/` 아래에 있으며 작업 공간 저장소에 커밋하면 안 됩니다:

- `~/.openclaw/openclaw.json` (설정)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (모델 인증 프로필: OAuth + API 키)
- `~/.openclaw/credentials/` (채널/프로바이더 상태 및 레거시 OAuth 가져오기 데이터)
- `~/.openclaw/agents/<agentId>/sessions/` (세션 기록 + 메타데이터)
- `~/.openclaw/skills/` (관리형 Skills)

세션이나 설정을 마이그레이션해야 한다면, 별도로 복사하고 버전 관리에는 포함하지 마세요.

## Git 백업(권장, 비공개)

작업 공간은 비공개 메모리로 취급하세요. 백업 가능하고 복구 가능한 **비공개** git 저장소에 두세요.

다음 단계는 Gateway가 실행되는 머신에서 수행하세요(작업 공간은 그곳에 있습니다).

### 1) 저장소 초기화

git이 설치되어 있으면, 완전히 새로운 작업 공간은 자동으로 초기화됩니다. 이 작업 공간이 아직 저장소가 아니라면 다음을 실행하세요:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 비공개 원격 저장소 추가(초보자 친화적 옵션)

옵션 A: GitHub 웹 UI

1. GitHub에서 새 **비공개** 저장소를 만드세요.
2. README로 초기화하지 마세요(병합 충돌 방지).
3. HTTPS 원격 URL을 복사하세요.
4. 원격을 추가하고 푸시하세요:

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

1. GitLab에서 새 **비공개** 저장소를 만드세요.
2. README로 초기화하지 마세요(병합 충돌 방지).
3. HTTPS 원격 URL을 복사하세요.
4. 원격을 추가하고 푸시하세요:

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

비공개 저장소라 하더라도 작업 공간에는 비밀 정보를 저장하지 않는 것이 좋습니다:

- API 키, OAuth 토큰, 비밀번호, 또는 비공개 자격 증명.
- `~/.openclaw/` 아래의 모든 것.
- 채팅 원본 덤프나 민감한 첨부 파일.

민감한 참조를 반드시 저장해야 한다면, 플레이스홀더를 사용하고 실제 비밀 정보는 다른 곳(비밀번호 관리자, 환경 변수, 또는 `~/.openclaw/`)에 보관하세요.

권장 `.gitignore` 시작 예시:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 작업 공간을 새 머신으로 옮기기

1. 원하는 경로(기본값 `~/.openclaw/workspace`)에 저장소를 클론하세요.
2. `~/.openclaw/openclaw.json`에서 `agents.defaults.workspace`를 해당 경로로 설정하세요.
3. `openclaw setup --workspace <path>`를 실행해 누락된 파일을 초기화하세요.
4. 세션도 필요하다면, 이전 머신의 `~/.openclaw/agents/<agentId>/sessions/`를 별도로 복사하세요.

## 고급 참고 사항

- 멀티 에이전트 라우팅은 에이전트마다 다른 작업 공간을 사용할 수 있습니다. 라우팅 설정은 [채널 라우팅](/ko/channels/channel-routing)을 참고하세요.
- `agents.defaults.sandbox`가 활성화되어 있으면, 메인이 아닌 세션은 `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 샌드박스 작업 공간을 사용할 수 있습니다.

## 관련 문서

- [Standing Orders](/ko/automation/standing-orders) — 작업 공간 파일의 영구 지침
- [Heartbeat](/ko/gateway/heartbeat) — HEARTBEAT.md 작업 공간 파일
- [Session](/ko/concepts/session) — 세션 저장 경로
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경에서의 작업 공간 접근
