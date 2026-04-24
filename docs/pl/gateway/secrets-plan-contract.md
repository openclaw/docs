---
read_when:
    - Generowanie lub przeglądanie planów `openclaw secrets apply`
    - Debugowanie błędów `Invalid plan target path`
    - Zrozumienie zachowania walidacji typu celu i ścieżki
summary: 'Kontrakt dla planów `secrets apply`: walidacja celu, dopasowanie ścieżek i zakres celu `auth-profiles.json`'
title: Kontrakt planu apply sekretów
x-i18n:
    generated_at: "2026-04-24T09:12:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

Ta strona definiuje ścisły kontrakt wymuszany przez `openclaw secrets apply`.

Jeśli cel nie pasuje do tych reguł, apply kończy się błędem przed modyfikacją konfiguracji.

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

## Obsługiwany zakres celu

Cele planu są akceptowane dla obsługiwanych ścieżek poświadczeń w:

- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)

## Zachowanie typu celu

Reguła ogólna:

- `target.type` musi być rozpoznawany i musi pasować do znormalizowanego kształtu `target.path`.

Aliasy zgodności są nadal akceptowane dla istniejących planów:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Reguły walidacji ścieżki

Każdy cel jest walidowany z użyciem wszystkich poniższych reguł:

- `type` musi być rozpoznawanym typem celu.
- `path` musi być niepustą ścieżką dot.
- `pathSegments` można pominąć. Jeśli są podane, muszą normalizować się dokładnie do tej samej ścieżki co `path`.
- Zabronione segmenty są odrzucane: `__proto__`, `prototype`, `constructor`.
- Znormalizowana ścieżka musi pasować do zarejestrowanego kształtu ścieżki dla typu celu.
- Jeśli ustawiono `providerId` albo `accountId`, musi pasować do identyfikatora zakodowanego w ścieżce.
- Cele `auth-profiles.json` wymagają `agentId`.
- Przy tworzeniu nowego mapowania `auth-profiles.json` uwzględnij `authProfileProvider`.

## Zachowanie przy błędzie

Jeśli cel nie przejdzie walidacji, apply kończy się błędem podobnym do:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Dla nieprawidłowego planu nie są zatwierdzane żadne zapisy.

## Zachowanie zgody dla providera exec

- `--dry-run` domyślnie pomija kontrole SecretRef exec.
- Plany zawierające SecretRef/providerów exec są odrzucane w trybie zapisu, chyba że ustawiono `--allow-exec`.
- Przy walidacji/stosowaniu planów zawierających exec przekaż `--allow-exec` zarówno w poleceniach dry-run, jak i zapisu.

## Uwagi o runtime i zakresie audytu

- Wpisy `auth-profiles.json` zawierające tylko ref (`keyRef`/`tokenRef`) są uwzględniane przy rozwiązywaniu runtime i w zakresie audytu.
- `secrets apply` zapisuje obsługiwane cele `openclaw.json`, obsługiwane cele `auth-profiles.json` oraz opcjonalne cele scrub.

## Kontrole operatora

```bash
# Zweryfikuj plan bez zapisów
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Następnie zastosuj go naprawdę
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Dla planów zawierających exec jawnie wyraź zgodę w obu trybach
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Jeśli apply kończy się błędem z komunikatem o nieprawidłowej ścieżce celu, wygeneruj plan ponownie przez `openclaw secrets configure` albo popraw ścieżkę celu do jednego z obsługiwanych kształtów podanych powyżej.

## Powiązane dokumenty

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [CLI `secrets`](/pl/cli/secrets)
- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
