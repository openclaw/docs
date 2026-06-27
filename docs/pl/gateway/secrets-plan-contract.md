---
read_when:
    - Generowanie lub przeglądanie planów `openclaw secrets apply`
    - Debugowanie błędów `Invalid plan target path`
    - Zrozumienie typu docelowego i zachowania walidacji ścieżki
summary: 'Kontrakt dla planów `secrets apply`: walidacja celu, dopasowywanie ścieżek i zakres celu `auth-profiles.json`'
title: Kontrakt planu stosowania sekretów
x-i18n:
    generated_at: "2026-06-27T17:37:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Ta strona definiuje ścisły kontrakt egzekwowany przez `openclaw secrets apply`.

Jeśli cel nie spełnia tych reguł, apply kończy się niepowodzeniem przed zmodyfikowaniem konfiguracji.

## Kształt pliku planu

`openclaw secrets apply --from <plan.json>` oczekuje tablicy `targets` z celami planu:

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

## Upserty i usunięcia providerów

Plany mogą także zawierać dwa opcjonalne pola najwyższego poziomu, które modyfikują mapę
`secrets.providers` razem z zapisami dla poszczególnych celów:

- `providerUpserts` — obiekt indeksowany aliasem providera. Każda wartość jest
  definicją providera (ten sam kształt, który jest akceptowany pod
  `secrets.providers.<alias>` w `openclaw.json`, np. provider `exec` lub `file`).
- `providerDeletes` — tablica aliasów providerów do usunięcia.

`providerUpserts` uruchamia się przed `targets`, więc `target.ref.provider` może
odwoływać się do aliasu providera wprowadzanego przez ten sam plan w
`providerUpserts`. Bez tego plany odwołujące się do aliasu, który nie jest jeszcze
skonfigurowany w `openclaw.json`, kończą się błędem `provider "<alias>" is not
configured`.

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

Providery exec wprowadzone przez `providerUpserts` nadal podlegają regułom zgody na exec w [Zachowanie zgody dla providera exec](#exec-provider-consent-behavior):
plany zawierające providery exec wymagają `--allow-exec` w trybie zapisu.

## Obsługiwany zakres celów

Cele planu są akceptowane dla obsługiwanych ścieżek poświadczeń w:

- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)

## Zachowanie typów celów

Reguła ogólna:

- `target.type` musi być rozpoznany i musi odpowiadać znormalizowanemu kształtowi `target.path`.

Aliasy zgodności nadal są akceptowane dla istniejących planów:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Reguły walidacji ścieżek

Każdy cel jest walidowany według wszystkich poniższych reguł:

- `type` musi być rozpoznanym typem celu.
- `path` musi być niepustą ścieżką kropkową.
- `pathSegments` można pominąć. Jeśli zostanie podane, musi normalizować się dokładnie do tej samej ścieżki co `path`.
- Zabronione segmenty są odrzucane: `__proto__`, `prototype`, `constructor`.
- Znormalizowana ścieżka musi pasować do zarejestrowanego kształtu ścieżki dla typu celu.
- Jeśli ustawiono `providerId` lub `accountId`, musi ono pasować do identyfikatora zakodowanego w ścieżce.
- Cele `auth-profiles.json` wymagają `agentId`.
- Podczas tworzenia nowego mapowania `auth-profiles.json` uwzględnij `authProfileProvider`.

## Zachowanie przy niepowodzeniu

Jeśli walidacja celu zakończy się niepowodzeniem, apply kończy działanie z błędem takim jak:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Dla nieprawidłowego planu nie są zatwierdzane żadne zapisy.

## Zachowanie zgody dla providera exec

- `--dry-run` domyślnie pomija kontrole exec SecretRef.
- Plany zawierające SecretRef/providery exec są odrzucane w trybie zapisu, chyba że ustawiono `--allow-exec`.
- Podczas walidowania/stosowania planów zawierających exec przekaż `--allow-exec` zarówno w poleceniach dry-run, jak i zapisu.

## Uwagi dotyczące zakresu runtime i audytu

- Wpisy `auth-profiles.json` zawierające tylko referencje (`keyRef`/`tokenRef`) są uwzględniane w rozwiązywaniu runtime i pokryciu audytu.
- `secrets apply` zapisuje obsługiwane cele `openclaw.json`, obsługiwane cele `auth-profiles.json` oraz opcjonalne cele scrub.

## Kontrole operatora

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Jeśli apply zakończy się niepowodzeniem z komunikatem o nieprawidłowej ścieżce celu, wygeneruj plan ponownie za pomocą `openclaw secrets configure` albo popraw ścieżkę celu do obsługiwanego kształtu opisanego powyżej.

## Powiązana dokumentacja

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [CLI `secrets`](/pl/cli/secrets)
- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- [Informacje o konfiguracji](/pl/gateway/configuration-reference)
