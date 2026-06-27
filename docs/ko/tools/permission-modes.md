---
read_when:
    - 명령 권한에 대해 auto, ask, allowlist, full 또는 deny 선택하기
    - tools.exec.mode를 통해 Codex Guardian 검토 승인 구성하기
    - OpenClaw exec 승인을 ACPX 하네스 권한과 비교하기
summary: 호스트 exec, Codex Guardian 승인, ACPX 하네스 세션의 권한 모드
title: 권한 모드
x-i18n:
    generated_at: "2026-06-27T18:15:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

권한 모드는 에이전트가 호스트 명령을 실행하거나, 파일을 쓰거나, 백엔드 하네스에 추가 액세스를 요청하기 전에 어느 정도의 권한을 갖는지 결정합니다. OpenClaw가 먼저 허용 목록을 사용하고, 누락 항목에는 Codex 네이티브 자동 리뷰 또는 사람 승인 경로를 사용하게 하려면 `tools.exec.mode: "auto"`로 시작하세요.

<Note>
  권한 모드는 `tools.exec.host=auto`와 별개입니다. `tools.exec.host`는
  명령이 실행되는 위치를 선택합니다. `tools.exec.mode`는 호스트 exec가
  승인되는 방식을 선택합니다.
</Note>

## 권장 기본값

모든 누락 항목을 사람 프롬프트로 만들지 않으면서 유용한 호스트 액세스가 필요한 코딩 에이전트에는 `auto`를 사용하세요.

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

그런 다음 적용된 정책을 확인하세요.

```bash
openclaw exec-policy show
```

`auto` 모드에서 OpenClaw는 결정적 허용 목록 일치를 직접 실행합니다. 승인 누락 항목은 먼저 OpenClaw의 네이티브 자동 리뷰어를 거친 다음, 필요할 때 구성된 사람 승인 경로로 폴백합니다.

## OpenClaw 호스트 exec 모드

`tools.exec.mode`는 호스트 `exec`를 위한 정규화된 정책 표면입니다.

| 모드        | 동작                                         | 사용 시점                                              |
| ----------- | -------------------------------------------- | ----------------------------------------------------- |
| `deny`      | 호스트 exec를 차단합니다.                    | 호스트 명령이 허용되지 않습니다.                      |
| `allowlist` | 허용 목록에 있는 명령만 실행합니다.          | 안전하다고 알려진 명령 집합이 있습니다.               |
| `ask`       | 허용 목록 일치는 실행하고 누락 항목은 묻습니다. | 새 명령을 사람이 리뷰해야 합니다.                  |
| `auto`      | 허용 목록 일치를 실행한 다음 자동 리뷰를 사용합니다. | 코딩 세션에 실용적인 보호된 액세스가 필요합니다. |
| `full`      | 프롬프트 없이 호스트 exec를 실행합니다.      | 신뢰할 수 있는 이 호스트/세션이 승인 게이트를 건너뛰어야 합니다. |

전체 호스트 exec 정책, 로컬 승인 파일, 허용 목록 스키마, 안전한 바이너리, 전달 동작은 [Exec 승인](/ko/tools/exec-approvals)을 참조하세요.

## Codex Guardian 매핑

네이티브 Codex 앱 서버 세션의 경우, 로컬 Codex 요구 사항이 허용하면 `tools.exec.mode: "auto"`는 Codex Guardian이 리뷰하는 승인에 매핑됩니다. OpenClaw는 일반적으로 다음을 보냅니다.

| Codex 필드         | 일반 값          |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

`auto` 모드에서 OpenClaw는 `approvalPolicy: "never"` 또는 `sandbox: "danger-full-access"` 같은 레거시의 안전하지 않은 Codex 오버라이드를 보존하지 않습니다. 승인 없는 자세를 의도적으로 원할 때만 `tools.exec.mode: "full"`을 사용하세요.

앱 서버 설정, 인증 순서, 네이티브 Codex 런타임 세부 정보는 [Codex 하네스](/ko/plugins/codex-harness)를 참조하세요.

## ACPX 하네스 권한

ACPX 세션은 비대화형이므로 TTY 권한 프롬프트를 클릭할 수 없습니다. ACPX는 `plugins.entries.acpx.config` 아래의 별도 하네스 수준 설정을 사용합니다.

| 설정                        | 일반 값         | 의미                                        |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | 읽기만 자동 승인합니다.                    |
| `permissionMode`            | `approve-all`   | 쓰기와 셸 명령을 자동 승인합니다.          |
| `permissionMode`            | `deny-all`      | 모든 권한 프롬프트를 거부합니다.           |
| `nonInteractivePermissions` | `fail`          | 프롬프트가 필요하면 중단합니다.            |
| `nonInteractivePermissions` | `deny`          | 가능하면 프롬프트를 거부하고 계속합니다.   |

ACPX 권한은 OpenClaw exec 승인과 별도로 설정하세요.

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

`approve-all`은 프롬프트 없는 하네스 세션에 해당하는 ACPX의 비상 해제 옵션으로 사용하세요. 설정 세부 정보와 실패 모드는 [ACP 에이전트 설정](/ko/tools/acp-agents-setup#permission-configuration)을 참조하세요.

## 모드 선택

| 목표                                          | 구성                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| 호스트 명령을 완전히 차단                    | `tools.exec.mode: "deny"`                                   |
| 안전하다고 알려진 명령만 실행               | `tools.exec.mode: "allowlist"`                              |
| 모든 새 명령 형태에 대해 사람에게 묻기      | `tools.exec.mode: "ask"`                                    |
| 사람보다 먼저 Codex/OpenClaw 자동 리뷰 사용 | `tools.exec.mode: "auto"`                                   |
| 호스트 exec 승인을 완전히 건너뛰기           | `tools.exec.mode: "full"` 및 일치하는 호스트 승인 파일      |
| 비대화형 ACPX 세션에서 쓰기/exec 허용        | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

모드를 변경한 뒤에도 명령이 여전히 프롬프트를 표시하거나 실패하면 두 계층을 모두 검사하세요.

```bash
openclaw approvals get
openclaw exec-policy show
```

호스트 exec는 OpenClaw 구성과 호스트 로컬 승인 파일 중 더 엄격한 결과를 사용합니다. ACPX 하네스 권한은 호스트 exec 승인을 완화하지 않으며, 호스트 exec 승인도 ACPX 하네스 프롬프트를 완화하지 않습니다.

## 관련 항목

- [Exec 승인](/ko/tools/exec-approvals)
- [Exec 승인 - 고급](/ko/tools/exec-approvals-advanced)
- [Codex 하네스](/ko/plugins/codex-harness)
- [ACP 에이전트 설정](/ko/tools/acp-agents-setup#permission-configuration)
