---
read_when:
    - 런타임에 보안 비밀 참조 다시 확인하기
    - 일반 텍스트 잔여물 및 해결되지 않은 참조 감사
    - SecretRef 구성 및 단방향 스크럽 변경 사항 적용
summary: '`openclaw secrets`의 CLI 참조 (다시 로드, 감사, 구성, 적용)'
title: 시크릿
x-i18n:
    generated_at: "2026-07-12T00:38:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRef를 관리하고 활성 런타임 스냅샷을 정상 상태로 유지합니다.

| 명령        | 역할                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC(`secrets.reload`): 참조를 다시 해석하고 완전히 성공한 경우에만 런타임 스냅샷을 교체합니다(구성에 쓰지 않음).                                                                              |
| `audit`     | 구성/인증/생성된 모델 저장소와 레거시 잔여물에서 평문, 해석되지 않은 참조, 우선순위 불일치를 읽기 전용으로 검사합니다(`--allow-exec`을 지정하지 않으면 exec 참조는 건너뜀).                           |
| `configure` | 제공자 설정, 대상 매핑, 사전 검사를 위한 대화형 플래너입니다(TTY 필요).                                                                                                                             |
| `apply`     | 저장된 계획을 실행한 다음 대상 평문 잔여물을 제거합니다(`--dry-run`은 검증만 수행하고 기본적으로 exec 검사를 건너뛰며, 쓰기 모드는 `--allow-exec` 없이는 exec가 포함된 계획을 거부함).                 |

권장 운영 절차:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

계획에 `exec` SecretRef/제공자가 포함된 경우 시험 실행과 쓰기 `apply` 명령 모두에 `--allow-exec`을 지정하십시오.

CI/게이트의 종료 코드:

- 발견 사항이 있으면 `audit --check`는 `1`을 반환합니다.
- 해석되지 않은 참조가 있으면 `--check` 여부와 관계없이 `2`를 반환합니다.

관련 항목: [비밀 관리](/ko/gateway/secrets) · [SecretRef 자격 증명 범위](/ko/reference/secretref-credential-surface) · [보안](/ko/gateway/security)

## 런타임 스냅샷 다시 불러오기

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Gateway RPC 메서드 `secrets.reload`를 사용합니다. 해석에 실패하면 Gateway는 마지막으로 정상 작동한 스냅샷을 유지하고 오류를 반환합니다(부분 활성화 없음). JSON 응답에는 `warningCount`가 포함됩니다.

옵션: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## 감사

OpenClaw 상태에서 다음 항목을 검사합니다.

- 평문 비밀 저장
- 해석되지 않은 참조
- 우선순위 불일치(`auth-profiles.json` 자격 증명이 `openclaw.json` 참조를 가림)
- 생성된 `agents/*/agent/models.json` 잔여물(제공자 `apiKey` 값과 민감한 제공자 헤더)
- 레거시 잔여물(레거시 인증 저장소 항목, OAuth 알림)

민감한 제공자 헤더 감지는 이름 기반 휴리스틱을 사용합니다. 헤더 이름이 일반적인 인증/자격 증명 조각(`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`)과 일치하면 표시합니다.

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

보고서 형식:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- 발견 코드: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## 구성(대화형 도우미)

제공자와 SecretRef 변경 사항을 대화형으로 구성하고, 사전 검사를 실행하며, 선택적으로 적용합니다.

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

흐름: 먼저 제공자를 설정하고(`secrets.providers` 별칭 추가/편집/제거), 그다음 자격 증명을 매핑하며(필드 선택, `{source, provider, id}` 참조 할당), 이후 사전 검사와 선택적 적용을 수행합니다.

플래그:

- `--providers-only`: `secrets.providers`만 구성하고 자격 증명 매핑은 건너뜁니다.
- `--skip-provider-setup`: 제공자 설정을 건너뛰고 자격 증명을 기존 제공자에 매핑합니다.
- `--agent <id>`: `auth-profiles.json` 대상 검색 및 쓰기 범위를 하나의 에이전트 저장소로 제한합니다.
- `--allow-exec`: 사전 검사/적용 중 exec SecretRef 검사를 허용합니다(제공자 명령이 실행될 수 있음).

`--providers-only`와 `--skip-provider-setup`은 함께 사용할 수 없습니다.

참고:

- 대화형 TTY가 필요합니다.
- 선택한 에이전트 범위의 `auth-profiles.json`과 `openclaw.json`에서 비밀이 포함된 필드를 대상으로 합니다. 표준 지원 범위는 [SecretRef 자격 증명 범위](/ko/reference/secretref-credential-surface)를 참조하십시오.
- 선택기 흐름에서 새 `auth-profiles.json` 매핑을 직접 생성할 수 있습니다.
- 적용 전에 사전 해석 검사를 실행합니다.
- 생성된 계획은 기본적으로 제거 옵션이 활성화됩니다(`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). 제거된 평문 값에는 적용 작업을 되돌릴 수 없습니다.
- `--apply`가 없어도 사전 검사 후 CLI에서 `Apply this plan now?`를 묻습니다.
- `--apply`를 사용하고 `--yes`를 사용하지 않으면 CLI에서 되돌릴 수 없는 마이그레이션에 대한 추가 확인을 요청합니다.
- `--json`은 계획과 사전 검사 보고서를 출력하지만, 대화형 TTY는 여전히 필요합니다.

### Exec 제공자 안전성

Homebrew 설치에서는 `/opt/homebrew/bin/*` 아래에 심볼릭 링크로 연결된 바이너리가 노출되는 경우가 많습니다. 신뢰할 수 있는 패키지 관리자 경로에 필요한 경우에만 `allowSymlinkCommand: true`를 설정하고 `trustedDirs`(예: `["/opt/homebrew"]`)와 함께 사용하십시오. Windows에서 제공자 경로의 ACL 검증을 사용할 수 없으면 OpenClaw는 안전을 위해 차단합니다. 신뢰할 수 있는 경로에 한해서만 해당 제공자에 `allowInsecurePath: true`를 설정하여 경로 보안 검사를 우회하십시오.

## 저장된 계획 적용

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run`은 파일에 쓰지 않고 사전 검사를 수행합니다. 시험 실행에서는 기본적으로 exec SecretRef 검사를 건너뜁니다. 쓰기 모드는 `--allow-exec`이 없으면 exec SecretRef/제공자가 포함된 계획을 거부합니다. 어느 모드에서든 exec 제공자 검사/실행을 허용하려면 `--allow-exec`을 사용하십시오.

`apply`가 업데이트할 수 있는 항목:

- `openclaw.json`(SecretRef 대상 + 제공자 삽입 또는 업데이트/삭제)
- `auth-profiles.json`(제공자 대상 제거)
- 레거시 `auth.json` 잔여물
- 값이 마이그레이션된 `~/.openclaw/.env`의 알려진 비밀 키

계획 계약 세부 정보(허용되는 대상 경로, 검증 규칙, 실패 의미 체계): [비밀 적용 계획 계약](/ko/gateway/secrets-plan-contract).

### 롤백 백업이 없는 이유

`secrets apply`는 이전 평문 값이 포함된 롤백 백업을 의도적으로 작성하지 않습니다. 엄격한 사전 검사와 준원자적 적용으로 안전성을 확보하며, 실패 시 메모리 내 복원을 최선을 다해 수행합니다.

## 예시

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check`에서 여전히 평문 발견 사항을 보고하면 보고된 나머지 대상 경로를 업데이트한 후 감사를 다시 실행하십시오.

## 관련 항목

- [CLI 참조](/ko/cli)
- [비밀 관리](/ko/gateway/secrets)
- [Vault SecretRef](/plugins/vault)
