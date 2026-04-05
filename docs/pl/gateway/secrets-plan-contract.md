---
read_when:
    - Generujesz lub przeglądasz plany `openclaw secrets apply`
    - Debugujesz błędy `Invalid plan target path`
    - Chcesz zrozumieć zachowanie walidacji typu celu i ścieżki
summary: 'Kontrakt dla planów `secrets apply`: walidacja celu, dopasowanie ścieżek i zakres celu `auth-profiles.json`'
title: Kontrakt planu Secrets Apply
x-i18n:
    generated_at: "2026-04-05T13:54:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Kontrakt planu secrets apply

Ta strona definiuje ścisły kontrakt egzekwowany przez `openclaw secrets apply`.

Jeśli cel nie spełnia tych reguł, apply kończy się błędem przed wprowadzeniem zmian w konfiguracji.

## Kształt pliku planu

`openclaw secrets apply --from <plan.json>` oczekuje tablicy `targets` zawierającej cele planu:

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

## Obsługiwany zakres celów

Cele planu są akceptowane dla obsługiwanych ścieżek poświadczeń w:

- [Powierzchnia poświadczeń SecretRef](/reference/secretref-credential-surface)

## Zachowanie typu celu

Reguła ogólna:

- `target.type` musi być rozpoznawany i musi odpowiadać znormalizowanemu kształtowi `target.path`.

Aliasy zgodności są nadal akceptowane dla istniejących planów:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Reguły walidacji ścieżki

Każdy cel jest walidowany według wszystkich poniższych zasad:

- `type` musi być rozpoznawanym typem celu.
- `path` musi być niepustą ścieżką rozdzielaną kropkami.
- `pathSegments` można pominąć. Jeśli jest podane, musi normalizować się dokładnie do tej samej ścieżki co `path`.
- Niedozwolone segmenty są odrzucane: `__proto__`, `prototype`, `constructor`.
- Znormalizowana ścieżka musi odpowiadać zarejestrowanemu kształtowi ścieżki dla typu celu.
- Jeśli ustawiono `providerId` lub `accountId`, musi odpowiadać identyfikatorowi zakodowanemu w ścieżce.
- Cele `auth-profiles.json` wymagają `agentId`.
- Przy tworzeniu nowego mapowania `auth-profiles.json` uwzględnij `authProfileProvider`.

## Zachowanie w przypadku błędu

Jeśli cel nie przejdzie walidacji, apply kończy działanie błędem podobnym do:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Dla nieprawidłowego planu żadne zapisy nie są zatwierdzane.

## Zachowanie zgody dla dostawcy exec

- `--dry-run` domyślnie pomija sprawdzenia exec SecretRef.
- Plany zawierające exec SecretRef/provider są odrzucane w trybie zapisu, chyba że ustawiono `--allow-exec`.
- Podczas walidacji/stosowania planów zawierających exec przekazuj `--allow-exec` zarówno w `dry-run`, jak i w poleceniu zapisu.

## Uwagi dotyczące runtime i zakresu audytu

- Wpisy `auth-profiles.json` zawierające tylko referencje (`keyRef`/`tokenRef`) są uwzględniane w rozwiązywaniu runtime i w zakresie audytu.
- `secrets apply` zapisuje obsługiwane cele `openclaw.json`, obsługiwane cele `auth-profiles.json` oraz opcjonalne cele czyszczenia.

## Sprawdzenia operatora

```bash
# Zweryfikuj plan bez zapisu
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Następnie zastosuj go naprawdę
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Dla planów zawierających exec jawnie wyraź zgodę w obu trybach
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Jeśli apply kończy się błędem z komunikatem o nieprawidłowej ścieżce celu, wygeneruj plan ponownie za pomocą `openclaw secrets configure` albo popraw ścieżkę celu do jednego z obsługiwanych kształtów podanych powyżej.

## Powiązana dokumentacja

- [Zarządzanie sekretami](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [Powierzchnia poświadczeń SecretRef](/reference/secretref-credential-surface)
- [Dokumentacja konfiguracji](/gateway/configuration-reference)
