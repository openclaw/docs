---
read_when:
    - 에이전트 작업을 위한 격리된 브랜치와 체크아웃이 필요한 경우
    - worktree 작업 공간을 사용하는 Workboard 카드를 구성하고 있습니다
    - OpenClaw에서 관리하는 worktree를 복원하거나 정리해야 합니다
summary: 자동 스냅샷 및 정리 기능을 갖춘 격리된 git 체크아웃에서 에이전트 작업 실행
title: 관리형 작업 트리
x-i18n:
    generated_at: "2026-07-12T00:44:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

관리형 worktree는 소스 저장소 내부에 임시 디렉터리를 만들지 않고 에이전트 작업에 전용 git 브랜치와 체크아웃을 제공합니다. OpenClaw는 상태 디렉터리 아래에 worktree를 만들고 공유 상태 데이터베이스에 기록하며, 제거하기 전에 추적 중인 콘텐츠와 무시되지 않는 미추적 콘텐츠의 스냅샷을 생성합니다.

## 레이아웃 및 이름

각 worktree의 위치는 다음과 같습니다.

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

저장소 지문은 정규화된 git 공통 디렉터리와 원격 원본 URL을 대상으로 계산한 SHA-256 해시의 처음 16개 16진수 문자입니다. 지정하는 이름은 `[a-z0-9][a-z0-9-]{0,63}`과 일치해야 합니다. 이름을 지정하지 않으면 OpenClaw는 `wt-` 뒤에 임의의 16진수 문자 8개를 붙여 생성합니다.

OpenClaw는 요청한 기준 참조에 `openclaw/<name>` 브랜치를 생성합니다. 기준 참조가 없으면 `origin`을 가져오고, 가능한 경우 원격 기본 브랜치를 사용하며, 저장소가 오프라인이거나 사용 가능한 원격이 없으면 로컬 `HEAD`로 대체합니다.

## 무시된 파일 프로비저닝

선택한 무시된 미추적 파일을 새 worktree에 복사하려면 소스 저장소 루트에 `.worktreeinclude`를 추가합니다. 이 파일은 gitignore 패턴 구문을 사용하며 한 줄에 패턴 하나를 작성하고 `#` 주석을 사용할 수 있습니다.

```gitignore
.env.local
fixtures/generated/**
```

git에서 무시됨과 미추적 상태로 모두 보고된 파일만 대상이 됩니다. 추적 중인 파일은 이미 git을 통해 존재하므로 이 단계에서 복사되지 않습니다. OpenClaw는 대상 파일을 덮어쓰거나 심볼릭 링크 디렉터리를 따라가지 않으며, 복사된 파일의 모드를 보존합니다.

## 저장소 설정 실행

소스 저장소에 `.openclaw/worktree-setup.sh`가 있고 실행 가능한 경우 OpenClaw는 새 worktree를 현재 디렉터리로 설정하여 이를 실행합니다. 스크립트에는 다음 값이 전달됩니다.

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

0이 아닌 종료 코드는 생성을 중단하고 새 worktree와 브랜치를 제거합니다. 이는 저장소 로컬 계약이며, 이를 위한 OpenClaw 구성 키는 없습니다.

## 세션 worktree

활성 에이전트의 git 작업 공간에서 worktree 기반 세션으로 격리된 채팅을 시작하려면 Control UI의 새 세션 페이지에서 **Worktree**를 활성화하거나(기준 브랜치 선택기와 선택적 worktree 이름도 제공됨), iOS의 채팅 작업 메뉴 또는 Android의 New Chat 옆에 있는 더보기 작업을 사용합니다. 이 옵션은 클라이언트가 해당 기능을 지원하는 git 기반 에이전트에서만 사용할 수 있습니다. 사전 확인을 수행할 수 없는 클라이언트는 대신 Gateway 오류를 표시합니다.

코딩 에이전트는 현재 작업 범위 밖에서 확인된 후속 작업을 발견하면 `spawn_task`를 호출할 수도 있습니다. Control UI는 아무 작업도 시작하지 않고 제안 칩을 표시하며, Gateway 기반 TUI는 동일한 작업을 포함한 대화형 프롬프트를 표시합니다. **worktree에서 시작**을 선택하면 제안된 프로젝트에서 세션 소유의 새 worktree를 만들고 독립적으로 이해할 수 있는 프롬프트를 첫 번째 턴으로 전송합니다. 제안을 닫으면 저장소는 변경되지 않습니다. 제안과 해당 ID는 일시적이며 Gateway를 다시 시작하면 유지되지 않습니다.

OpenClaw는 실행 가능한 Gateway UI가 있는 운영자 세션에만 이러한 도구를 노출합니다. 채널 세션과 로컬/내장 TUI 세션은 해당 표면에 이식 가능한 형식화된 작업 동작 계약이 마련될 때까지 이러한 도구를 받지 않습니다.

생성된 관리형 worktree는 세션이 소유하며, 해당 세션의 모든 에이전트 실행은 그 체크아웃을 사용합니다. 작업 공간이 저장소 하위 디렉터리인 경우 worktree는 저장소 루트에 고정되고 세션은 그 내부의 일치하는 하위 디렉터리에서 실행됩니다. 세션 worktree 생성에는 메서드의 `operator.write` 범위가 사용되지만, `.openclaw/worktree-setup.sh` 단계는 저장소 코드를 실행하므로 `operator.admin` 호출자에 대해서만 실행됩니다. `.worktreeinclude` 프로비저닝은 모든 호출자에게 계속 적용됩니다. 세션을 삭제하면 손실 없이 제거할 수 있는 경우에만 worktree가 제거됩니다. 변경 사항이 있는 worktree 또는 푸시되지 않은 커밋이 있는 브랜치는 계속 사용할 수 있습니다. 매시간 수행되는 정리는 최근 세션 활동을 worktree 활동으로 간주하여 7일 동안 유휴 상태인 세션 worktree의 스냅샷을 생성합니다. 제거된 worktree는 아래 설명과 같이 스냅샷에서 복원할 수 있습니다.

작업이 구성된 에이전트 작업 공간이 아닌 다른 프로젝트를 대상으로 하는 경우 `sessions.create`에 절대 경로 `cwd`와 `worktree: true`를 함께 포함할 수 있습니다. 이 명시적인 호스트 경로에는 `operator.admin`이 필요합니다. 일반적인 worktree 채팅 생성은 계속 `operator.write`를 사용하며 구성된 작업 공간에 고정됩니다.

`sessions.create`는 `worktree: true`와 함께 `worktreeBaseRef` 및 `worktreeName`도 받아 기준 참조와 worktree 이름을 선택할 수 있습니다(브랜치는 `openclaw/<name>`이 됨). 둘 다 `operator.write` 범위를 유지합니다. 생성된 worktree는 생성 결과로 반환되고 세션 행에 `worktree: { id, branch, repoRoot }`로 저장되므로 세션 목록에 체크아웃과 브랜치를 표시할 수 있습니다. 세션 삭제 시 변경 사항이 있는 체크아웃이 보존되면 이를 조용히 남겨 두는 대신 `worktreePreserved`로 보고합니다.

## 스냅샷, 정리 및 복원

제거할 때 먼저 추적 중인 파일과 무시되지 않는 미추적 파일을 포함하는 합성 커밋을 생성하고 `refs/openclaw/snapshots/<id>`에 고정합니다. git에서 무시된 파일은 저장소 객체 데이터베이스에서 제외됩니다. `.worktreeinclude`로 선택된 파일은 복원 중에 다시 복사됩니다. 스냅샷 생성에 실패하면 제거가 중단됩니다. 명시적으로 강제 삭제하면 스냅샷 없이 계속 진행할 수 있습니다.

OpenClaw는 다음 정리 규칙을 적용합니다.

- 실행 종료 시 `git status --porcelain`이 비어 있고 `git log HEAD --not --remotes --oneline`에서 푸시되지 않은 커밋을 찾지 못한 경우에만 worktree를 제거합니다. 그렇지 않으면 활동 잠금만 해제합니다.
- 매시간 수행되는 정리는 잠금이 없고 7일 넘게 유휴 상태인 Workboard 및 세션 소유 worktree를 변경 사항이 있더라도 스냅샷 생성 후 제거합니다. 수동 worktree는 자동으로 제거되지 않습니다.
- 스냅샷 기록은 30일 동안 복원할 수 있습니다. 이후 정리 과정에서 스냅샷 참조와 레지스트리 행을 삭제합니다.
- 실행 중인 OpenClaw 프로세스 잠금과 외부 또는 인식되지 않은 git worktree 잠금은 worktree를 가비지 컬렉션으로부터 보호합니다.

복원 시 원래 스냅샷 이전 커밋에 `openclaw/<name>`을 다시 생성한 다음 스냅샷의 차이를 스테이징되지 않은 수정 사항과 미추적 파일로 재구성합니다. 이렇게 하면 합성 스냅샷 커밋이 브랜치 기록에 포함되지 않습니다. 스냅샷 참조는 출처 정보로 계속 기록됩니다.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Settings 아래의 Control UI **Worktrees** 페이지에서는 동일한 작업과 기준 브랜치 선택기를 통한 생성 기능을 제공합니다. 또한 각 worktree의 소유자(수동, Workboard 또는 해당 채팅으로 연결되는 링크가 있는 소유 세션)를 표시하고, 제거 시 스냅샷 실패가 보고되면 강제 재시도를 제공합니다.

## Gateway 메서드

| 메서드               | 용도                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | 활성 상태이며 복원 가능한 worktree 기록을 나열합니다.                            |
| `worktrees.branches` | 기준 참조 선택기에 사용할 저장소의 로컬 및 원격 브랜치를 나열합니다.    |
| `worktrees.create`   | 이름이 지정된 관리형 worktree를 생성하거나 재사용합니다.                               |
| `worktrees.remove`   | worktree의 스냅샷을 생성하고 제거합니다. 강제 제거는 `snapshotError`를 보고합니다. |
| `worktrees.restore`  | 제거된 worktree를 스냅샷에서 복원합니다.                           |
| `worktrees.gc`       | 유휴 상태, 고아 상태 및 보존 기간 정리를 즉시 실행합니다.                            |

`worktrees.list`에는 `operator.read`가 필요하며, 변경을 수행하는 메서드에는 `operator.admin`이 필요합니다. `worktrees.branches`는 구성된 에이전트 작업 공간에는 `operator.write`가 필요하지만, 다른 모든 호스트 경로에는 `operator.admin`이 필요합니다(`sessions.create`의 cwd 기준과 동일). 이 메서드는 기존 참조만 읽고 가져오기를 수행하지 않으며, 원격에만 있는 브랜치는 원격이 한정된 형태(`origin/feature-a`)로 반환되므로 반환되는 모든 이름을 기준 참조로 해석할 수 있습니다.

## Workboard 작업 공간

번들로 제공되는 [Workboard Plugin](/ko/plugins/workboard)은 카드 작업 공간을 관리형 worktree로 구체화할 수 있습니다.

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path`는 소스 git 체크아웃을 식별합니다. `branch`는 선택 사항이며 기준 참조가 됩니다. 디스패치가 카드의 작업자를 시작하면 Workboard는 `wb-<card-id>`를 생성하거나 재사용하고, 관리형 체크아웃을 작업 디렉터리로 사용하여 하위 에이전트를 실행한 다음, 확인된 경로와 브랜치를 카드에 다시 기록합니다. Gateway에서 트리거된 구체화에는 `operator.admin`이 필요합니다. 실행 종료 시 Workboard는 손실이 없음이 입증된 경우에만 체크아웃을 제거합니다. 변경 사항이 있거나 푸시되지 않은 커밋은 계속 사용할 수 있습니다.

현재 샌드박스가 적용된 내장 에이전트는 구성된 에이전트 작업 공간 밖의 작업 디렉터리를 사용하는 작업을 거부합니다. 샌드박스 런타임이 추가 체크아웃 마운트를 지원할 때까지 Workboard 관리형 worktree 카드에는 샌드박스가 적용되지 않은 대상 에이전트를 사용하세요.
