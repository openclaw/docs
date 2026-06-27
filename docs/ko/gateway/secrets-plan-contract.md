---
read_when:
    - '`openclaw secrets apply` 계획 생성 또는 검토'
    - '`Invalid plan target path` 오류 디버깅'
    - 대상 유형 및 경로 검증 동작 이해하기
summary: '`secrets apply` 계획 계약: 대상 검증, 경로 매칭 및 `auth-profiles.json` 대상 범위'
title: 비밀 정보 적용 계획 계약
x-i18n:
    generated_at: "2026-06-27T17:31:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

이 페이지는 `openclaw secrets apply`가 강제하는 엄격한 계약을 정의합니다.

대상이 이 규칙과 일치하지 않으면, 구성 변경 전에 apply가 실패합니다.

## 계획 파일 형태

`openclaw secrets apply --from <plan.json>`은 계획 대상의 `targets` 배열을 예상합니다.

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

## Provider 업서트와 삭제

계획에는 대상별 쓰기와 함께 `secrets.providers` 맵을 변경하는 두 개의 선택적 최상위 필드도 포함할 수 있습니다.

- `providerUpserts` — provider 별칭을 키로 사용하는 객체입니다. 각 값은
  provider 정의(`openclaw.json`의 `secrets.providers.<alias>` 아래에서 허용되는 것과
  동일한 형태, 예: `exec` 또는 `file` provider)입니다.
- `providerDeletes` — 제거할 provider 별칭의 배열입니다.

`providerUpserts`는 `targets`보다 먼저 실행되므로, `target.ref.provider`가
동일한 계획이 `providerUpserts`에서 도입하는 provider 별칭을 참조할 수 있습니다.
이것이 없으면 아직 `openclaw.json`에 구성되지 않은 별칭을 참조하는 계획은
`provider "<alias>" is not configured` 오류로 실패합니다.

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

`providerUpserts`를 통해 도입된 Exec provider도 [Exec provider 동의 동작](#exec-provider-consent-behavior)의
exec 동의 규칙이 적용됩니다. exec provider가 포함된 계획은 쓰기 모드에서
`--allow-exec`가 필요합니다.

## 지원되는 대상 범위

계획 대상은 다음의 지원되는 자격 증명 경로에 대해 허용됩니다.

- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)

## 대상 유형 동작

일반 규칙:

- `target.type`은 인식되어야 하며 정규화된 `target.path` 형태와 일치해야 합니다.

기존 계획을 위해 호환성 별칭은 계속 허용됩니다.

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## 경로 검증 규칙

각 대상은 다음 모두로 검증됩니다.

- `type`은 인식되는 대상 유형이어야 합니다.
- `path`는 비어 있지 않은 점 경로여야 합니다.
- `pathSegments`는 생략할 수 있습니다. 제공된 경우 `path`와 정확히 동일한 경로로 정규화되어야 합니다.
- 금지된 세그먼트는 거부됩니다: `__proto__`, `prototype`, `constructor`.
- 정규화된 경로는 대상 유형에 등록된 경로 형태와 일치해야 합니다.
- `providerId` 또는 `accountId`가 설정된 경우, 경로에 인코딩된 id와 일치해야 합니다.
- `auth-profiles.json` 대상에는 `agentId`가 필요합니다.
- 새 `auth-profiles.json` 매핑을 만들 때는 `authProfileProvider`를 포함하세요.

## 실패 동작

대상이 검증에 실패하면 apply는 다음과 같은 오류와 함께 종료됩니다.

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

잘못된 계획에 대해서는 쓰기가 커밋되지 않습니다.

## Exec provider 동의 동작

- `--dry-run`은 기본적으로 exec SecretRef 검사를 건너뜁니다.
- exec SecretRef/provider가 포함된 계획은 `--allow-exec`가 설정되지 않는 한 쓰기 모드에서 거부됩니다.
- exec가 포함된 계획을 검증/적용할 때는 dry-run 및 쓰기 명령 모두에 `--allow-exec`를 전달하세요.

## 런타임 및 감사 범위 참고 사항

- ref 전용 `auth-profiles.json` 항목(`keyRef`/`tokenRef`)은 런타임 해석 및 감사 범위에 포함됩니다.
- `secrets apply`는 지원되는 `openclaw.json` 대상, 지원되는 `auth-profiles.json` 대상, 선택적 스크럽 대상에 씁니다.

## 운영자 검사

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

apply가 잘못된 대상 경로 메시지와 함께 실패하면 `openclaw secrets configure`로 계획을 다시 생성하거나 대상 경로를 위의 지원되는 형태로 수정하세요.

## 관련 문서

- [Secrets 관리](/ko/gateway/secrets)
- [CLI `secrets`](/ko/cli/secrets)
- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)
- [구성 참조](/ko/gateway/configuration-reference)
