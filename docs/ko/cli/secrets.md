---
read_when:
    - 런타임에 시크릿 ref 재확인
    - 평문 잔여물 및 확인되지 않은 ref 감사
    - SecretRefs 구성 및 단방향 스크럽 변경 적용
summary: '`openclaw secrets`에 대한 CLI 참조(reload, audit, configure, apply)'
title: 시크릿
x-i18n:
    generated_at: "2026-04-24T06:08:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw secrets`

`openclaw secrets`를 사용해 SecretRefs를 관리하고 활성 런타임 스냅샷을 정상 상태로 유지하세요.

명령 역할:

- `reload`: ref를 다시 확인하고 완전히 성공했을 때만 런타임 스냅샷을 교체하는 gateway RPC(`secrets.reload`)입니다(config 쓰기 없음).
- `audit`: 평문, 확인되지 않은 ref, 우선순위 드리프트에 대해 구성/auth/생성된 모델 저장소와 레거시 잔여물을 읽기 전용으로 스캔합니다(`--allow-exec`를 설정하지 않으면 exec ref는 건너뜀).
- `configure`: provider 설정, 대상 매핑, 사전 점검을 위한 대화형 planner입니다(TTY 필요).
- `apply`: 저장된 plan을 실행합니다(검증만 하려면 `--dry-run`, dry-run은 기본적으로 exec 검사를 건너뛰고, 쓰기 모드는 `--allow-exec`를 설정하지 않으면 exec가 포함된 plan을 거부함). 이후 대상 평문 잔여물을 스크럽합니다.

권장 운영 루프:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

plan에 `exec` SecretRefs/providers가 포함되어 있으면 dry-run과 쓰기 apply 명령 모두에 `--allow-exec`를 전달하세요.

CI/게이트용 종료 코드 참고:

- `audit --check`는 항목이 있으면 `1`을 반환합니다.
- 확인되지 않은 ref는 `2`를 반환합니다.

관련 항목:

- 시크릿 가이드: [시크릿 관리](/ko/gateway/secrets)
- 자격 증명 표면: [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)
- 보안 가이드: [보안](/ko/gateway/security)

## 런타임 스냅샷 다시 로드

시크릿 ref를 다시 확인하고 런타임 스냅샷을 원자적으로 교체합니다.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

참고:

- gateway RPC 메서드 `secrets.reload`를 사용합니다.
- 확인에 실패하면 gateway는 마지막으로 정상 작동한 스냅샷을 유지하고 오류를 반환합니다(부분 활성화 없음).
- JSON 응답에는 `warningCount`가 포함됩니다.

옵션:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## 감사

다음 항목에 대해 OpenClaw 상태를 스캔합니다.

- 평문 시크릿 저장
- 확인되지 않은 ref
- 우선순위 드리프트(`auth-profiles.json` 자격 증명이 `openclaw.json` ref를 가리는 경우)
- 생성된 `agents/*/agent/models.json` 잔여물(provider `apiKey` 값 및 민감한 provider 헤더)
- 레거시 잔여물(레거시 auth 저장소 항목, OAuth reminder)

헤더 잔여물 참고:

- 민감한 provider 헤더 감지는 이름 휴리스틱 기반입니다(일반적인 auth/credential 헤더 이름과 `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 같은 조각).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

종료 동작:

- `--check`는 항목이 있으면 0이 아닌 코드로 종료합니다.
- 확인되지 않은 ref는 더 높은 우선순위의 0이 아닌 코드로 종료합니다.

보고서 형태 핵심:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- 항목 코드:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## 구성(대화형 헬퍼)

대화형으로 provider 및 SecretRef 변경을 구성하고, 사전 점검을 실행한 뒤, 선택적으로 적용합니다.

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

흐름:

- 먼저 provider 설정(`secrets.providers` 별칭에 대해 `add/edit/remove`)
- 다음으로 자격 증명 매핑(필드 선택 후 `{source, provider, id}` ref 할당)
- 마지막으로 사전 점검 및 선택적 적용

플래그:

- `--providers-only`: `secrets.providers`만 구성하고 자격 증명 매핑은 건너뜀
- `--skip-provider-setup`: provider 설정을 건너뛰고 기존 providers에 자격 증명을 매핑
- `--agent <id>`: `auth-profiles.json` 대상 탐색 및 쓰기를 하나의 에이전트 저장소로 범위 제한
- `--allow-exec`: 사전 점검/적용 중 exec SecretRef 검사를 허용(provider 명령을 실행할 수 있음)

참고:

- 대화형 TTY가 필요합니다.
- `--providers-only`와 `--skip-provider-setup`은 함께 사용할 수 없습니다.
- `configure`는 `openclaw.json`의 시크릿 포함 필드와 선택한 에이전트 범위의 `auth-profiles.json`을 대상으로 합니다.
- `configure`는 picker 흐름에서 직접 새 `auth-profiles.json` 매핑 생성도 지원합니다.
- 정식 지원 표면: [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)
- 적용 전에 사전 점검 확인을 수행합니다.
- 사전 점검/적용에 exec ref가 포함되면 두 단계 모두 `--allow-exec`를 유지하세요.
- 생성된 plan은 기본적으로 스크럽 옵션(`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` 모두 활성화)을 포함합니다.
- apply 경로는 스크럽된 평문 값에 대해 단방향입니다.
- `--apply` 없이도 CLI는 사전 점검 후 `Apply this plan now?`를 계속 묻습니다.
- `--apply` 사용 시(`--yes` 없음) CLI는 추가로 되돌릴 수 없는 확인을 묻습니다.
- `--json`은 plan + 사전 점검 보고서를 출력하지만, 명령에는 여전히 대화형 TTY가 필요합니다.

Exec provider 안전 참고:

- Homebrew 설치는 종종 `/opt/homebrew/bin/*` 아래에 심볼릭 링크된 바이너리를 노출합니다.
- 신뢰할 수 있는 패키지 관리자 경로에 정말 필요할 때만 `allowSymlinkCommand: true`를 설정하고, `trustedDirs`(예: `["/opt/homebrew"]`)와 함께 사용하세요.
- Windows에서 provider 경로의 ACL 확인을 사용할 수 없으면 OpenClaw는 fail closed됩니다. 신뢰된 경로에 한해 해당 provider에 `allowInsecurePath: true`를 설정해 경로 보안 검사를 우회할 수 있습니다.

## 저장된 plan 적용

이전에 생성한 plan을 적용하거나 사전 점검합니다.

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec 동작:

- `--dry-run`은 파일을 쓰지 않고 사전 점검을 검증합니다.
- dry-run에서는 기본적으로 exec SecretRef 검사를 건너뜁니다.
- 쓰기 모드는 `--allow-exec`가 설정되지 않으면 exec SecretRefs/providers가 포함된 plan을 거부합니다.
- 어느 모드에서든 exec provider 검사/실행에 opt in하려면 `--allow-exec`를 사용하세요.

plan 계약 세부 정보(허용된 대상 경로, 검증 규칙, 실패 의미):

- [시크릿 적용 Plan 계약](/ko/gateway/secrets-plan-contract)

`apply`가 업데이트할 수 있는 항목:

- `openclaw.json`(SecretRef 대상 + provider upsert/delete)
- `auth-profiles.json`(provider 대상 스크럽)
- 레거시 `auth.json` 잔여물
- 값이 마이그레이션된 `~/.openclaw/.env`의 알려진 시크릿 키

## 롤백 백업이 없는 이유

`secrets apply`는 이전 평문 값을 포함하는 롤백 백업을 의도적으로 쓰지 않습니다.

안전성은 엄격한 사전 점검 + 실패 시 최선의 노력 방식 메모리 복원을 포함한 거의 원자적 적용에서 나옵니다.

## 예시

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check`가 여전히 평문 항목을 보고하면, 남아 있는 보고 대상 경로를 업데이트하고 감사를 다시 실행하세요.

## 관련

- [CLI 참조](/ko/cli)
- [시크릿 관리](/ko/gateway/secrets)
