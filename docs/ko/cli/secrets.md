---
read_when:
    - 런타임에 secret 참조 다시 확인하기
    - 평문 잔여물 및 해결되지 않은 참조 감사하기
    - SecretRef 구성 및 단방향 스크럽 변경 사항 적용
summary: '`openclaw secrets` CLI 참조(다시 로드, 감사, 구성, 적용)'
title: 비밀 정보
x-i18n:
    generated_at: "2026-07-12T15:05:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRef를 관리하고 활성 런타임 스냅샷을 정상 상태로 유지합니다.

| 명령어      | 역할                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC(`secrets.reload`): 참조를 다시 확인하고 전체 작업이 성공한 경우에만 런타임 스냅샷을 교체합니다(구성에 쓰지 않음).                                                                          |
| `audit`     | 구성/인증/생성된 모델 저장소와 레거시 잔여 항목에서 평문, 확인되지 않은 참조, 우선순위 불일치를 읽기 전용으로 검사합니다(`--allow-exec`을 지정하지 않으면 exec 참조를 건너뜀).                         |
| `configure` | 제공자 설정, 대상 매핑, 사전 점검을 위한 대화형 플래너입니다(TTY 필요).                                                                                                                               |
| `apply`     | 저장된 계획을 실행한 다음(`--dry-run`은 검증만 수행하고 기본적으로 exec 검사를 건너뛰며, 쓰기 모드는 `--allow-exec` 없이 exec가 포함된 계획을 거부함) 대상 평문 잔여 항목을 제거합니다.                  |

권장 운영 절차:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

계획에 `exec` SecretRef/제공자가 포함되어 있으면 시험 실행과 쓰기 `apply` 명령 모두에 `--allow-exec`을 전달하십시오.

CI/게이트용 종료 코드:

- 발견 항목이 있으면 `audit --check`가 `1`을 반환합니다.
- 확인되지 않은 참조가 있으면 `--check` 여부와 관계없이 `2`를 반환합니다.

관련 항목: [비밀 관리](/ko/gateway/secrets) · [SecretRef 자격 증명 범위](/ko/reference/secretref-credential-surface) · [보안](/ko/gateway/security)

## 런타임 스냅샷 다시 불러오기

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Gateway RPC 메서드 `secrets.reload`를 사용합니다. 확인에 실패하면 Gateway는 마지막으로 정상 작동한 스냅샷을 유지하고 오류를 반환합니다(부분 활성화 없음). JSON 응답에는 `warningCount`가 포함됩니다.

옵션: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## 감사

OpenClaw 상태에서 다음 항목을 검사합니다.

- 평문 비밀 저장
- 확인되지 않은 참조
- 우선순위 불일치(`auth-profiles.json` 자격 증명이 `openclaw.json` 참조를 가리는 경우)
- 생성된 `agents/*/agent/models.json` 잔여 항목(제공자 `apiKey` 값과 민감한 제공자 헤더)
- 레거시 잔여 항목(레거시 인증 저장소 항목, OAuth 알림)

민감한 제공자 헤더 탐지는 이름 휴리스틱을 기반으로 합니다. 이름이 일반적인 인증/자격 증명 조각(`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`)과 일치하는 헤더를 표시합니다.

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

보고서 구조:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- 발견 코드: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## 구성(대화형 도우미)

제공자와 SecretRef 변경 사항을 대화형으로 작성하고 사전 점검을 실행한 후 선택적으로 적용합니다.

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

흐름: 먼저 제공자를 설정하고(`secrets.providers` 별칭 추가/편집/제거), 다음으로 자격 증명을 매핑한 후(필드 선택, `{source, provider, id}` 참조 할당), 사전 점검과 선택적 적용을 수행합니다.

플래그:

- `--providers-only`: `secrets.providers`만 구성하고 자격 증명 매핑은 건너뜁니다.
- `--skip-provider-setup`: 제공자 설정을 건너뛰고 기존 제공자에 자격 증명을 매핑합니다.
- `--agent <id>`: `auth-profiles.json` 대상 검색과 쓰기의 범위를 하나의 에이전트 저장소로 제한합니다.
- `--allow-exec`: 사전 점검/적용 중 exec SecretRef 검사를 허용합니다(제공자 명령이 실행될 수 있음).

`--providers-only`와 `--skip-provider-setup`은 함께 사용할 수 없습니다.

참고:

- 대화형 TTY가 필요합니다.
- 선택한 에이전트 범위의 `auth-profiles.json`과 `openclaw.json`에 있는 비밀 포함 필드를 대상으로 합니다. 표준 지원 범위는 [SecretRef 자격 증명 범위](/ko/reference/secretref-credential-surface)를 참조하십시오.
- 선택기 흐름에서 새로운 `auth-profiles.json` 매핑을 직접 생성할 수 있습니다.
- 적용 전에 사전 확인을 실행합니다.
- 생성된 계획은 기본적으로 제거 옵션이 활성화됩니다(`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). 제거된 평문 값은 적용 후 되돌릴 수 없습니다.
- `--apply`를 사용하지 않아도 CLI는 사전 점검 후 `Apply this plan now?`라고 묻습니다.
- `--apply`를 사용하고 `--yes`를 사용하지 않으면 CLI가 되돌릴 수 없는 마이그레이션에 대한 추가 확인을 요청합니다.
- `--json`은 계획과 사전 점검 보고서를 출력하지만 대화형 TTY는 여전히 필요합니다.

### Exec 제공자 안전성

Homebrew 설치에서는 종종 `/opt/homebrew/bin/*` 아래에 심볼릭 링크된 바이너리를 노출합니다. 신뢰할 수 있는 패키지 관리자 경로에 필요한 경우에만 `allowSymlinkCommand: true`를 설정하고 `trustedDirs`(예: `["/opt/homebrew"]`)와 함께 사용하십시오. Windows에서 제공자 경로의 ACL을 확인할 수 없으면 OpenClaw는 안전을 위해 작업을 거부합니다. 신뢰할 수 있는 경로에만 해당 제공자의 `allowInsecurePath: true`를 설정하여 경로 보안 검사를 우회하십시오.

## 저장된 계획 적용

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run`은 파일을 쓰지 않고 사전 점검을 검증하며, 시험 실행에서는 기본적으로 exec SecretRef 검사를 건너뜁니다. 쓰기 모드는 `--allow-exec` 없이 exec SecretRef/제공자가 포함된 계획을 거부합니다. 두 모드 중 어느 쪽에서든 exec 제공자 검사/실행을 사용하려면 `--allow-exec`을 사용하십시오.

`apply`로 업데이트할 수 있는 항목:

- `openclaw.json`(SecretRef 대상 + 제공자 추가/갱신/삭제)
- `auth-profiles.json`(제공자 대상 제거)
- 레거시 `auth.json` 잔여 항목
- 값이 마이그레이션된 `~/.openclaw/.env`의 알려진 비밀 키

계획 계약 세부 정보(허용되는 대상 경로, 검증 규칙, 실패 의미 체계): [비밀 적용 계획 계약](/ko/gateway/secrets-plan-contract).

### 롤백 백업이 없는 이유

`secrets apply`는 의도적으로 이전 평문 값이 포함된 롤백 백업을 작성하지 않습니다. 엄격한 사전 점검과 원자적 적용에 가까운 처리로 안전성을 확보하며, 실패 시 메모리 내 복원을 최선의 노력으로 수행합니다.

## 예시

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check`에서 여전히 평문 발견 항목을 보고하면 보고된 나머지 대상 경로를 업데이트하고 감사를 다시 실행하십시오.

## 관련 항목

- [CLI 참조](/ko/cli)
- [비밀 관리](/ko/gateway/secrets)
- [Vault SecretRef](/plugins/vault)
