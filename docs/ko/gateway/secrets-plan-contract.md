---
read_when:
    - '`openclaw secrets apply` 계획 생성 또는 검토'
    - '`Invalid plan target path` 오류 디버깅'
    - 대상 유형 및 경로 검증 동작 이해하기
summary: '`secrets apply` 계획의 계약: 대상 검증, 경로 일치 및 `auth-profiles.json` 대상 범위'
title: 시크릿 적용 계획 계약
x-i18n:
    generated_at: "2026-07-12T15:21:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

이 페이지에서는 `openclaw secrets apply`가 적용하는 엄격한 계약을 정의합니다. 대상이 이러한 규칙과 일치하지 않으면 파일을 변경하기 전에 적용이 실패합니다.

## 계획 파일 구조

`openclaw secrets apply --from <plan.json>`은 계획 대상의 `targets` 배열을 요구합니다.

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

`openclaw secrets configure`는 이 구조로 계획을 생성합니다. 직접 작성하거나 편집할 수도 있습니다.

## 제공자 업서트 및 삭제

계획에는 대상별 쓰기와 함께 `secrets.providers` 맵을 변경하는 다음 두 개의 선택적 최상위 필드도 포함할 수 있습니다.

- `providerUpserts` -- 제공자 별칭을 키로 사용하는 객체입니다. 각 값은 제공자 정의입니다(`openclaw.json`의 `secrets.providers.<alias>`에서 허용되는 것과 동일한 구조이며, 예를 들어 `exec` 또는 `file` 제공자입니다).
- `providerDeletes` -- 제거할 제공자 별칭의 배열입니다.

`providerUpserts`는 `targets`보다 먼저 실행되므로 `target.ref.provider`에서 동일한 계획의 `providerUpserts`가 도입하는 제공자 별칭을 참조할 수 있습니다. 이러한 순서가 없으면 `openclaw.json`에 아직 구성되지 않은 별칭을 참조하는 계획은 `provider "<alias>" is not configured` 오류와 함께 실패합니다.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

`providerUpserts`를 통해 도입된 Exec 제공자에도 [Exec 제공자 동의 동작](#exec-provider-consent-behavior)의 Exec 동의 규칙이 계속 적용됩니다. Exec 제공자를 포함하는 계획을 쓰기 모드에서 실행하려면 `--allow-exec`이 필요합니다.

## 지원되는 대상 범위

[SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)에서 지원되는 자격 증명 경로에 대해 계획 대상이 허용됩니다.

## 대상 유형 동작

`target.type`은 인식되는 대상 유형이어야 하며, 정규화된 `target.path`는 해당 유형에 등록된 경로 구조와 일치해야 합니다.

일부 대상 유형은 기존 계획을 위해 정식 유형 이름 외에도 호환성 별칭을 `target.type`으로 허용합니다.

| 정식 유형                             | 허용되는 별칭                                   |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## 경로 검증 규칙

각 대상은 다음 조건을 모두 사용하여 검증됩니다.

- `type`은 인식되는 대상 유형이어야 합니다.
- `path`는 비어 있지 않은 점 구분 경로여야 합니다.
- `pathSegments`는 생략할 수 있습니다. 제공하는 경우 `path`와 정확히 동일한 경로로 정규화되어야 합니다.
- 금지된 세그먼트는 거부됩니다: `__proto__`, `prototype`, `constructor`.
- 정규화된 경로는 대상 유형에 등록된 경로 구조와 일치해야 합니다.
- `providerId` 또는 `accountId`가 설정된 경우 경로에 인코딩된 ID와 일치해야 합니다.
- `auth-profiles.json` 대상에는 `agentId`가 필요합니다.
- 새 `auth-profiles.json` 매핑을 생성할 때는 `authProfileProvider`를 포함하십시오.

## 실패 동작

대상 검증이 실패하면 적용은 다음과 같은 오류와 함께 종료됩니다.

```text
models.providers.apiKey의 계획 대상 경로가 잘못되었습니다: models.providers.openai.baseUrl
```

잘못된 계획에서는 쓰기가 커밋되지 않습니다. 대상 확인과 경로 검증은 파일을 건드리기 전에 실행됩니다. 이와 별도로 유효한 계획이 쓰기를 시작하면 적용은 먼저 변경되는 모든 파일의 스냅샷을 만들고, 동일한 실행의 이후 쓰기가 실패할 경우 해당 스냅샷을 복원합니다. 따라서 부분적인 쓰기로 인해 구성, 인증 프로필 또는 환경 상태가 서로 불일치하는 일이 없습니다.

## Exec 제공자 동의 동작

- `--dry-run`은 기본적으로 Exec SecretRef 검사를 건너뜁니다.
- Exec SecretRef/제공자를 포함하는 계획은 `--allow-exec`이 설정되지 않으면 쓰기 모드에서 거부됩니다.
- Exec을 포함하는 계획을 검증하거나 적용할 때는 시험 실행과 쓰기 명령 모두에 `--allow-exec`을 전달하십시오.

## 런타임 및 감사 범위 참고 사항

- 참조 전용 `auth-profiles.json` 항목(`keyRef`/`tokenRef`)은 런타임 자격 증명 확인 및 감사 범위에 포함됩니다.
- `secrets apply`는 지원되는 `openclaw.json` 대상과 지원되는 `auth-profiles.json` 대상을 기록하며, 기본적으로 각각 활성화된 세 가지 선택적 정리 단계를 수행합니다. `scrubEnv`는 `.env`에서 마이그레이션된 평문 값을 제거하고, `scrubAuthProfilesForProviderTargets`는 계획에서 방금 마이그레이션한 제공자의 `auth-profiles.json`에 남은 평문/미사용 참조를 지우며, `scrubLegacyAuthJson`은 레거시 `auth.json` 저장소에서 마이그레이션된 `api_key` 항목을 삭제합니다. 해당 단계를 건너뛰려면 계획에서 `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets`, `options.scrubLegacyAuthJson` 중 원하는 값을 `false`로 설정하십시오.

## 운영자 확인

```bash
# 쓰기 없이 계획 검증
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 그런 다음 실제로 적용
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Exec을 포함하는 계획은 두 모드 모두에서 명시적으로 동의
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

잘못된 대상 경로 메시지와 함께 적용이 실패하면 `openclaw secrets configure`로 계획을 다시 생성하거나 대상 경로를 위에서 지원되는 구조로 수정하십시오.

## 관련 문서

- [비밀 관리](/ko/gateway/secrets)
- [CLI `secrets`](/ko/cli/secrets)
- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)
- [구성 참조](/ko/gateway/configuration-reference)
