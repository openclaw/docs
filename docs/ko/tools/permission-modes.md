---
read_when:
    - 명령 권한에서 auto, ask, allowlist, full 또는 deny 선택하기
    - tools.exec.mode를 통한 Codex Guardian 검토 승인 구성
    - OpenClaw 실행 승인과 ACPX 하네스 권한 비교
summary: 호스트 실행의 권한 모드, Codex Guardian 승인 및 ACPX 하네스 세션
title: 권한 모드
x-i18n:
    generated_at: "2026-07-12T01:17:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

권한 모드는 에이전트가 호스트 명령을 실행하거나 파일을 쓰거나 백엔드 하네스에 추가 접근 권한을 요청하기 전에 어느 정도의 권한을 갖는지 결정합니다.

<Note>
  권한 모드는 `tools.exec.host=auto`와 별개입니다. `tools.exec.host`는
  명령이 실행되는 위치를 선택합니다. `tools.exec.mode`는 호스트 `exec` 실행을
  승인하는 방식을 선택합니다.
</Note>

## 권장 기본값

모든 미허용 명령마다 사람에게 확인하지 않으면서도 유용한 호스트 접근이 필요한 코딩 에이전트에는 `auto`를 사용하세요.

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

그런 다음 적용된 정책을 확인하세요.

```bash
openclaw exec-policy show
```

## OpenClaw 호스트 실행 모드

`tools.exec.mode`는 호스트 `exec`의 정규화된 정책 인터페이스입니다. 각 모드는 내부적으로 `security`(허용 목록 엄격도)와 `ask`(미허용 시 확인) 쌍으로 해석됩니다.

| 모드        | security / ask          | 동작                                                                                                    | 사용 시점                                             |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `deny`      | `deny` / `off`          | 호스트 실행을 완전히 차단합니다.                                                                        | 호스트 명령을 전혀 허용하지 않을 때                   |
| `allowlist` | `allowlist` / `off`     | 허용 목록에 있는 명령만 실행하고, 미허용 명령은 알림 없이 거부합니다.                                    | 안전하다고 알려진 명령 집합이 있을 때                 |
| `ask`       | `allowlist` / `on-miss` | 허용 목록과 일치하면 실행하고, 일치하지 않으면 사람에게 확인합니다.                                      | 모든 새로운 명령을 사람이 검토해야 할 때              |
| `auto`      | `allowlist` / `on-miss` | 허용 목록과 일치하면 실행하고, 일치하지 않으면 사람의 승인으로 전환하기 전에 자동 검토를 거칩니다.       | 코딩 세션에 실용적이면서 보호된 접근이 필요할 때       |
| `full`      | `full` / `off`          | 확인 없이 호스트에서 실행합니다.                                                                        | 신뢰할 수 있는 호스트나 세션에서 승인 단계를 건너뛸 때 |

`ask`와 `auto`는 동일한 허용 목록 및 확인 설정을 공유합니다. `auto`는 기본 제공 자동 검토기도 추가로 활성화하여 미허용 명령을 직접 판단하고, 안전하게 승인할 수 없을 때만 구성된 사람 승인 경로로 넘깁니다.

전체 호스트 실행 정책, 로컬 승인 파일, 허용 목록 스키마, 안전한 실행 파일, 전달 동작에 관한 내용은 [실행 승인](/ko/tools/exec-approvals)을 참조하세요.

## Codex Guardian 매핑

기본 Codex 앱 서버 세션에서 `tools.exec.mode: "auto"`는 로컬 Codex 요구 사항이 허용하는 경우 Codex가 Guardian 검토 승인을 사용하도록 유도합니다. 일반적으로 적용되는 값은 다음과 같습니다.

| Codex 필드         | 일반적인 값       |
| ------------------ | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

`auto` 모드는 구성된 Codex 샌드박스 및 승인 재정의보다 이 정책을 우선 적용하므로, `approvalPolicy: "never"`와 `sandbox: "danger-full-access"`를 함께 사용하는 기존의 안전하지 않은 조합을 유지하지 않습니다. `tools.exec.mode: "deny"`와 `"allowlist"`는 Codex 앱 서버의 로컬 실행을 완전히 차단합니다. 의도적으로 승인을 받지 않는 방식을 사용하려는 경우에만 `tools.exec.mode: "full"`을 사용하세요.

앱 서버 설정, 인증 순서, 기본 Codex 런타임에 관한 자세한 내용은 [Codex 하네스](/ko/plugins/codex-harness)를 참조하세요.

## ACPX 하네스 권한

ACPX 세션은 비대화형이므로 TTY 권한 확인을 클릭할 수 없습니다. ACPX는 `plugins.entries.acpx.config` 아래에서 별도의 하네스 수준 설정을 사용합니다.

| 설정                        | 값              | 의미                                        |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | 읽기만 자동 승인합니다.                     |
| `permissionMode`            | `approve-all`   | 쓰기와 셸 명령을 자동 승인합니다.           |
| `permissionMode`            | `deny-all`      | 모든 권한 확인을 거부합니다.                 |
| `nonInteractivePermissions` | `fail`          | 확인이 필요하면 중단합니다.                  |
| `nonInteractivePermissions` | `deny`          | 확인을 거부하고 가능한 경우 계속 진행합니다. |

ACPX 권한은 OpenClaw 실행 승인과 별도로 설정하세요.

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

확인 없는 하네스 세션에 대응하는 ACPX의 비상용 설정으로 `approve-all`을 사용하세요. 설정 세부 정보와 실패 모드는 [ACP 에이전트 설정](/ko/tools/acp-agents-setup#permission-configuration)을 참조하세요.

## 모드 선택

| 목표                                          | 구성                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| 호스트 명령을 완전히 차단                     | `tools.exec.mode: "deny"`                                   |
| 안전하다고 알려진 명령만 실행                 | `tools.exec.mode: "allowlist"`                              |
| 모든 새로운 명령 형태를 사람에게 확인         | `tools.exec.mode: "ask"`                                    |
| 사람에 앞서 Codex/OpenClaw 자동 검토 사용      | `tools.exec.mode: "auto"`                                   |
| 호스트 실행 승인을 완전히 건너뛰기             | `tools.exec.mode: "full"` 및 일치하는 호스트 승인 파일      |
| 비대화형 ACPX 세션에서 쓰기 및 실행 허용       | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

모드를 변경한 후에도 명령이 계속 확인을 요청하거나 실패한다면 두 계층을 모두 점검하세요.

```bash
openclaw approvals get
openclaw exec-policy show
```

호스트 실행에는 OpenClaw 구성과 호스트 로컬 승인 파일 중 더 엄격한 결과가 적용됩니다. ACPX 하네스 권한은 호스트 실행 승인을 완화하지 않으며, 호스트 실행 승인도 ACPX 하네스의 권한 확인을 완화하지 않습니다.

## 관련 문서

- [실행 승인](/ko/tools/exec-approvals)
- [실행 승인 - 고급](/ko/tools/exec-approvals-advanced)
- [Codex 하네스](/ko/plugins/codex-harness)
- [ACP 에이전트 설정](/ko/tools/acp-agents-setup#permission-configuration)
