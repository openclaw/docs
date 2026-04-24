---
read_when:
    - Ponowne rozstrzyganie odwołań SecretRef w runtime
    - Audyt pozostałości jawnego tekstu i nierozstrzygniętych odwołań
    - Konfigurowanie SecretRef-ów i stosowanie jednokierunkowych zmian scrubovania
summary: Dokumentacja CLI dla `openclaw secrets` (przeładowanie, audyt, konfiguracja, zastosowanie)
title: Sekrety
x-i18n:
    generated_at: "2026-04-24T09:04:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Użyj `openclaw secrets`, aby zarządzać SecretRef-ami i utrzymywać aktywny snapshot runtime w dobrym stanie.

Role poleceń:

- `reload`: RPC gateway (`secrets.reload`), które ponownie rozstrzyga odwołania i podmienia snapshot runtime tylko przy pełnym sukcesie (bez zapisów do konfiguracji).
- `audit`: skan tylko do odczytu konfiguracji/uwierzytelniania/generowanych magazynów modeli oraz starszych pozostałości pod kątem jawnego tekstu, nierozstrzygniętych odwołań i dryfu pierwszeństwa (odwołania exec są pomijane, chyba że ustawiono `--allow-exec`).
- `configure`: interaktywny planer konfiguracji providera, mapowania celów i preflight (wymagany TTY).
- `apply`: wykonuje zapisany plan (`--dry-run` tylko do walidacji; dry-run domyślnie pomija kontrole exec, a tryb zapisu odrzuca plany zawierające exec, chyba że ustawiono `--allow-exec`), a następnie wykonuje scrub wskazanych pozostałości jawnego tekstu.

Zalecana pętla operatora:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Jeśli plan zawiera SecretRef-y/providerów `exec`, przekaż `--allow-exec` zarówno do polecenia apply w trybie dry-run, jak i do polecenia apply w trybie zapisu.

Uwaga o kodach zakończenia dla CI/bramek:

- `audit --check` zwraca `1`, gdy są znaleziska.
- nierozstrzygnięte odwołania zwracają `2`.

Powiązane:

- Przewodnik po sekretach: [Zarządzanie sekretami](/pl/gateway/secrets)
- Powierzchnia poświadczeń: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- Przewodnik po bezpieczeństwie: [Bezpieczeństwo](/pl/gateway/security)

## Ponowne załadowanie snapshotu runtime

Ponownie rozstrzygnij odwołania do sekretów i atomowo podmień snapshot runtime.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Uwagi:

- Używa metody RPC gateway `secrets.reload`.
- Jeśli rozstrzyganie się nie powiedzie, gateway zachowuje ostatni znany dobry snapshot i zwraca błąd (bez częściowej aktywacji).
- Odpowiedź JSON zawiera `warningCount`.

Opcje:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audyt

Skanuj stan OpenClaw pod kątem:

- przechowywania sekretów jako jawny tekst
- nierozstrzygniętych odwołań
- dryfu pierwszeństwa (poświadczenia w `auth-profiles.json` przesłaniające odwołania z `openclaw.json`)
- pozostałości w wygenerowanych `agents/*/agent/models.json` (wartości `apiKey` providera i wrażliwe nagłówki providera)
- starszych pozostałości (starsze wpisy magazynu auth, przypomnienia OAuth)

Uwaga o pozostałościach w nagłówkach:

- Wykrywanie wrażliwych nagłówków providera jest oparte na heurystykach nazw (typowe nazwy i fragmenty nagłówków uwierzytelniania/poświadczeń, takie jak `authorization`, `x-api-key`, `token`, `secret`, `password` i `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Zachowanie przy zakończeniu:

- `--check` kończy się kodem niezerowym, gdy są znaleziska.
- nierozstrzygnięte odwołania kończą się kodem niezerowym o wyższym priorytecie.

Najważniejsze elementy kształtu raportu:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- kody znalezisk:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (interaktywny pomocnik)

Interaktywnie buduj zmiany providera i SecretRef, uruchom preflight i opcjonalnie zastosuj:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Przepływ:

- Najpierw konfiguracja providera (`add/edit/remove` dla aliasów `secrets.providers`).
- Następnie mapowanie poświadczeń (wybór pól i przypisanie odwołań `{source, provider, id}`).
- Na końcu preflight i opcjonalne zastosowanie.

Flagi:

- `--providers-only`: skonfiguruj tylko `secrets.providers`, pomiń mapowanie poświadczeń.
- `--skip-provider-setup`: pomiń konfigurację providera i mapuj poświadczenia do istniejących providerów.
- `--agent <id>`: ogranicza wykrywanie celów i zapisy `auth-profiles.json` do jednego magazynu agenta.
- `--allow-exec`: zezwala na kontrole SecretRef exec podczas preflight/apply (może wykonywać polecenia providera).

Uwagi:

- Wymaga interaktywnego TTY.
- Nie można łączyć `--providers-only` z `--skip-provider-setup`.
- `configure` kieruje się na pola zawierające sekrety w `openclaw.json` oraz `auth-profiles.json` dla wybranego zakresu agenta.
- `configure` obsługuje tworzenie nowych mapowań `auth-profiles.json` bezpośrednio w przepływie wyboru.
- Kanoniczna obsługiwana powierzchnia: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
- Wykonuje rozstrzyganie preflight przed apply.
- Jeśli preflight/apply zawiera odwołania exec, pozostaw `--allow-exec` ustawione dla obu kroków.
- Wygenerowane plany domyślnie mają opcje scrub (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` są wszystkie włączone).
- Ścieżka apply jest jednokierunkowa dla wartości jawnego tekstu poddanych scrubowi.
- Bez `--apply` CLI nadal pyta `Apply this plan now?` po preflight.
- Z `--apply` (i bez `--yes`) CLI wyświetla dodatkowe nieodwracalne potwierdzenie.
- `--json` wypisuje plan + raport preflight, ale polecenie nadal wymaga interaktywnego TTY.

Uwaga o bezpieczeństwie providera exec:

- Instalacje Homebrew często udostępniają binaria przez dowiązania symboliczne w `/opt/homebrew/bin/*`.
- Ustaw `allowSymlinkCommand: true` tylko wtedy, gdy jest to potrzebne dla zaufanych ścieżek menedżera pakietów, i połącz to z `trustedDirs` (na przykład `["/opt/homebrew"]`).
- W Windows, jeśli weryfikacja ACL jest niedostępna dla ścieżki providera, OpenClaw kończy się odmową w trybie fail-closed. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego providera, aby pominąć kontrole bezpieczeństwa ścieżki.

## Zastosowanie zapisanego planu

Zastosuj lub wykonaj preflight planu wygenerowanego wcześniej:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Zachowanie exec:

- `--dry-run` waliduje preflight bez zapisywania plików.
- Kontrole SecretRef exec są domyślnie pomijane w dry-run.
- Tryb zapisu odrzuca plany zawierające SecretRef-y/providerów exec, chyba że ustawiono `--allow-exec`.
- Użyj `--allow-exec`, aby jawnie zezwolić na kontrole/wykonywanie providerów exec w dowolnym trybie.

Szczegóły kontraktu planu (dozwolone ścieżki celów, reguły walidacji i semantyka błędów):

- [Kontrakt planu apply dla Secrets](/pl/gateway/secrets-plan-contract)

Co `apply` może zaktualizować:

- `openclaw.json` (cele SecretRef + upserty/usunięcia providerów)
- `auth-profiles.json` (scrub celów providerów)
- starsze pozostałości `auth.json`
- `~/.openclaw/.env` znane klucze sekretów, których wartości zostały zmigrowane

## Dlaczego nie ma kopii zapasowych do rollbacku

`secrets apply` celowo nie zapisuje kopii zapasowych do rollbacku zawierających stare wartości jawnego tekstu.

Bezpieczeństwo wynika ze ścisłego preflight + quasi-atomowego apply z best-effort przywróceniem w pamięci w razie błędu.

## Przykład

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Jeśli `audit --check` nadal zgłasza znaleziska jawnego tekstu, zaktualizuj pozostałe zgłoszone ścieżki celów i uruchom audyt ponownie.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zarządzanie sekretami](/pl/gateway/secrets)
