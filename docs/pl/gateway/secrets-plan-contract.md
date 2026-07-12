---
read_when:
    - Generowanie lub przeglądanie planów `openclaw secrets apply`
    - Debugowanie błędów `Invalid plan target path`
    - Omówienie zachowania walidacji typu docelowego i ścieżki
summary: 'Kontrakt dla planów `secrets apply`: walidacja celu, dopasowywanie ścieżek i zakres celu `auth-profiles.json`'
title: Kontrakt planu stosowania sekretów
x-i18n:
    generated_at: "2026-07-12T15:08:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Ta strona definiuje ścisły kontrakt wymuszany przez `openclaw secrets apply`. Jeśli cel nie jest zgodny z tymi regułami, zastosowanie planu kończy się niepowodzeniem przed zmodyfikowaniem jakiegokolwiek pliku.

## Struktura pliku planu

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

`openclaw secrets configure` generuje plany o tej strukturze. Można je również napisać lub edytować ręcznie.

## Dodawanie, aktualizowanie i usuwanie dostawców

Plany mogą również zawierać dwa opcjonalne pola najwyższego poziomu, które modyfikują mapę `secrets.providers` wraz z zapisami poszczególnych celów:

- `providerUpserts` -- obiekt, którego kluczami są aliasy dostawców. Każda wartość jest definicją dostawcy (o takiej samej strukturze jak akceptowana w `secrets.providers.<alias>` w pliku `openclaw.json`, np. dostawcy `exec` lub `file`).
- `providerDeletes` -- tablica aliasów dostawców do usunięcia.

Operacja `providerUpserts` jest wykonywana przed przetworzeniem `targets`, dlatego `target.ref.provider` może odwoływać się do aliasu dostawcy wprowadzanego przez ten sam plan w `providerUpserts`. Bez tej kolejności plany odwołujące się do aliasu, który nie jest jeszcze skonfigurowany w pliku `openclaw.json`, kończą się błędem `provider "<alias>" is not configured`.

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

Dostawcy `exec` wprowadzeni za pomocą `providerUpserts` nadal podlegają regułom zgody opisanym w sekcji [Zasady wyrażania zgody na dostawcę exec](#exec-provider-consent-behavior): plany zawierające dostawców `exec` wymagają flagi `--allow-exec` w trybie zapisu.

## Obsługiwany zakres celów

Cele planu są akceptowane dla obsługiwanych ścieżek poświadczeń wymienionych w dokumencie [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface).

## Działanie typów celów

`target.type` musi być rozpoznawanym typem celu, a znormalizowana wartość `target.path` musi odpowiadać zarejestrowanej strukturze ścieżki tego typu.

Niektóre typy celów, oprócz swojej kanonicznej nazwy typu, akceptują w `target.type` alias zgodności ze starszymi istniejącymi planami:

| Typ kanoniczny                       | Akceptowany alias                               |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Reguły walidacji ścieżek

Każdy cel jest sprawdzany zgodnie ze wszystkimi poniższymi regułami:

- `type` musi być rozpoznawanym typem celu.
- `path` musi być niepustą ścieżką rozdzielaną kropkami.
- `pathSegments` można pominąć. Jeśli zostanie podane, po normalizacji musi wskazywać dokładnie tę samą ścieżkę co `path`.
- Niedozwolone segmenty są odrzucane: `__proto__`, `prototype`, `constructor`.
- Znormalizowana ścieżka musi odpowiadać zarejestrowanej strukturze ścieżki dla danego typu celu.
- Jeśli ustawiono `providerId` lub `accountId`, wartość musi odpowiadać identyfikatorowi zakodowanemu w ścieżce.
- Cele w pliku `auth-profiles.json` wymagają pola `agentId`.
- Podczas tworzenia nowego mapowania w pliku `auth-profiles.json` należy podać `authProfileProvider`.

## Zachowanie w przypadku niepowodzenia

Jeśli cel nie przejdzie walidacji, zastosowanie planu kończy się błędem podobnym do:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

W przypadku nieprawidłowego planu żadne zapisy nie są zatwierdzane: rozpoznawanie celów i walidacja ścieżek odbywają się przed modyfikacją jakiegokolwiek pliku. Niezależnie od tego, gdy rozpocznie się zapis prawidłowego planu, najpierw tworzona jest migawka każdego modyfikowanego pliku. Jeśli późniejszy zapis w ramach tego samego uruchomienia zakończy się niepowodzeniem, migawki są przywracane, dzięki czemu częściowy zapis nigdy nie pozostawia konfiguracji, profili uwierzytelniania ani stanu zmiennych środowiskowych w stanie niespójnym.

## Zasady wyrażania zgody na dostawcę exec

- `--dry-run` domyślnie pomija sprawdzanie odwołań SecretRef typu `exec`.
- Plany zawierające odwołania SecretRef lub dostawców typu `exec` są odrzucane w trybie zapisu, jeśli nie ustawiono flagi `--allow-exec`.
- Podczas walidowania lub stosowania planów zawierających elementy typu `exec` należy przekazać `--allow-exec` zarówno w poleceniach trybu próbnego, jak i trybu zapisu.

## Uwagi dotyczące zakresu działania i audytu

- Wpisy w pliku `auth-profiles.json` zawierające wyłącznie odwołania (`keyRef`/`tokenRef`) są uwzględniane w rozpoznawaniu poświadczeń w czasie działania oraz w zakresie audytu.
- `secrets apply` zapisuje obsługiwane cele w plikach `openclaw.json` i `auth-profiles.json` oraz wykonuje trzy opcjonalne przebiegi czyszczenia, z których każdy jest domyślnie włączony: `scrubEnv` (usuwa przeniesione wartości w postaci zwykłego tekstu z pliku `.env`), `scrubAuthProfilesForProviderTargets` (usuwa pozostałości wartości w postaci zwykłego tekstu i nieużywanych odwołań z pliku `auth-profiles.json` dla dostawców właśnie przeniesionych przez plan) oraz `scrubLegacyAuthJson` (usuwa przeniesione wpisy `api_key` ze starszych magazynów `auth.json`). Aby pominąć dany przebieg, ustaw w planie odpowiednią wartość spośród `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` i `options.scrubLegacyAuthJson` na `false`.

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

Jeśli zastosowanie planu zakończy się błędem dotyczącym nieprawidłowej ścieżki celu, ponownie wygeneruj plan za pomocą `openclaw secrets configure` albo popraw ścieżkę celu, aby odpowiadała jednej z obsługiwanych struktur opisanych powyżej.

## Powiązana dokumentacja

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [CLI `secrets`](/pl/cli/secrets)
- [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
