---
read_when:
    - Ponowne rozwiązywanie referencji do sekretów w czasie działania
    - Audyt pozostałości jawnym tekstem i nierozwiązanych referencji
    - Konfigurowanie SecretRefs i stosowanie jednokierunkowych zmian czyszczenia
summary: Dokumentacja CLI dla `openclaw secrets` (reload, audit, configure, apply)
title: secrets
x-i18n:
    generated_at: "2026-04-05T13:49:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Użyj `openclaw secrets`, aby zarządzać SecretRefs i utrzymywać aktywną migawkę środowiska uruchomieniowego w dobrym stanie.

Role poleceń:

- `reload`: gateway RPC (`secrets.reload`), które ponownie rozwiązuje referencje i podmienia migawkę środowiska uruchomieniowego tylko przy pełnym powodzeniu (bez zapisu konfiguracji).
- `audit`: skan tylko do odczytu konfiguracji/uwierzytelniania/wygenerowanych magazynów modeli oraz starszych pozostałości pod kątem jawnego tekstu, nierozwiązanych referencji i dryfu priorytetów (referencje exec są pomijane, chyba że ustawiono `--allow-exec`).
- `configure`: interaktywny planer konfiguracji dostawcy, mapowania celów i wstępnego sprawdzenia (wymagany TTY).
- `apply`: wykonuje zapisany plan (`--dry-run` tylko do walidacji; dry-run domyślnie pomija sprawdzenia exec, a tryb zapisu odrzuca plany zawierające exec, chyba że ustawiono `--allow-exec`), a następnie czyści wskazane pozostałości jawnego tekstu.

Zalecana pętla operatora:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Jeśli plan zawiera dostawców/referencje SecretRef typu `exec`, przekaż `--allow-exec` zarówno w poleceniach dry-run, jak i w poleceniach apply w trybie zapisu.

Uwaga dotycząca kodów wyjścia dla CI/bramek:

- `audit --check` zwraca `1` przy wykryciach.
- nierozwiązane referencje zwracają `2`.

Powiązane:

- Przewodnik po sekretach: [Zarządzanie sekretami](/gateway/secrets)
- Powierzchnia poświadczeń: [Powierzchnia poświadczeń SecretRef](/reference/secretref-credential-surface)
- Przewodnik bezpieczeństwa: [Bezpieczeństwo](/gateway/security)

## Ponowne wczytanie migawki środowiska uruchomieniowego

Ponownie rozwiąż referencje do sekretów i atomowo podmień migawkę środowiska uruchomieniowego.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Uwagi:

- Używa metody gateway RPC `secrets.reload`.
- Jeśli rozwiązywanie się nie powiedzie, gateway zachowuje ostatnią poprawną migawkę i zwraca błąd (bez częściowej aktywacji).
- Odpowiedź JSON zawiera `warningCount`.

Opcje:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audyt

Skanuje stan OpenClaw pod kątem:

- przechowywania sekretów jawnym tekstem
- nierozwiązanych referencji
- dryfu priorytetów (poświadczenia z `auth-profiles.json` przesłaniające referencje z `openclaw.json`)
- pozostałości wygenerowanych `agents/*/agent/models.json` (wartości `apiKey` dostawców i wrażliwe nagłówki dostawców)
- starszych pozostałości (wpisy starszego magazynu uwierzytelniania, przypomnienia OAuth)

Uwaga dotycząca pozostałości nagłówków:

- Wykrywanie wrażliwych nagłówków dostawców opiera się na heurystykach nazw (typowe nazwy i fragmenty nagłówków uwierzytelniania/poświadczeń, takie jak `authorization`, `x-api-key`, `token`, `secret`, `password` i `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Zachowanie kodów wyjścia:

- `--check` kończy się kodem niezerowym przy wykryciach.
- nierozwiązane referencje kończą się kodem niezerowym o wyższym priorytecie.

Najważniejsze elementy struktury raportu:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- kody wykryć:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (interaktywny pomocnik)

Interaktywnie buduje zmiany dostawców i SecretRef, uruchamia wstępne sprawdzenie i opcjonalnie stosuje zmiany:

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

- Najpierw konfiguracja dostawcy (`add/edit/remove` dla aliasów `secrets.providers`).
- Następnie mapowanie poświadczeń (wybierz pola i przypisz referencje `{source, provider, id}`).
- Na końcu wstępne sprawdzenie i opcjonalne zastosowanie.

Flagi:

- `--providers-only`: konfiguruj tylko `secrets.providers`, pomiń mapowanie poświadczeń.
- `--skip-provider-setup`: pomiń konfigurację dostawcy i mapuj poświadczenia do istniejących dostawców.
- `--agent <id>`: ogranicz wykrywanie celów i zapisy w `auth-profiles.json` do jednego magazynu agenta.
- `--allow-exec`: zezwól na sprawdzenia SecretRef typu exec podczas wstępnego sprawdzania/apply (może wykonywać polecenia dostawcy).

Uwagi:

- Wymaga interaktywnego TTY.
- Nie można łączyć `--providers-only` z `--skip-provider-setup`.
- `configure` obejmuje pola zawierające sekrety w `openclaw.json` oraz `auth-profiles.json` dla wybranego zakresu agenta.
- `configure` obsługuje tworzenie nowych mapowań `auth-profiles.json` bezpośrednio w przepływie wyboru.
- Kanoniczna obsługiwana powierzchnia: [Powierzchnia poświadczeń SecretRef](/reference/secretref-credential-surface).
- Przed zastosowaniem wykonuje wstępne rozwiązywanie.
- Jeśli wstępne sprawdzanie/apply obejmuje referencje exec, pozostaw `--allow-exec` ustawione dla obu kroków.
- Wygenerowane plany domyślnie mają opcje czyszczenia (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` są wszystkie włączone).
- Ścieżka apply jest jednokierunkowa dla wyczyszczonych wartości jawnego tekstu.
- Bez `--apply` CLI i tak pyta `Apply this plan now?` po wstępnym sprawdzeniu.
- Przy `--apply` (bez `--yes`) CLI wyświetla dodatkowe nieodwracalne potwierdzenie.
- `--json` wypisuje plan i raport ze wstępnego sprawdzenia, ale polecenie nadal wymaga interaktywnego TTY.

Uwaga dotycząca bezpieczeństwa dostawców exec:

- Instalacje Homebrew często udostępniają dowiązane binaria w `/opt/homebrew/bin/*`.
- Ustaw `allowSymlinkCommand: true` tylko wtedy, gdy jest to potrzebne dla zaufanych ścieżek menedżera pakietów, i połącz to z `trustedDirs` (na przykład `["/opt/homebrew"]`).
- W systemie Windows, jeśli weryfikacja ACL nie jest dostępna dla ścieżki dostawcy, OpenClaw kończy się w trybie zamkniętym. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego dostawcy, aby ominąć kontrole bezpieczeństwa ścieżki.

## Zastosowanie zapisanego planu

Zastosuj lub wykonaj wstępne sprawdzenie planu wygenerowanego wcześniej:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Zachowanie exec:

- `--dry-run` waliduje wstępne sprawdzenie bez zapisywania plików.
- Sprawdzenia SecretRef typu exec są domyślnie pomijane w dry-run.
- Tryb zapisu odrzuca plany zawierające dostawców/referencje SecretRef typu exec, chyba że ustawiono `--allow-exec`.
- Użyj `--allow-exec`, aby włączyć sprawdzenia/wykonywanie dostawców exec w dowolnym trybie.

Szczegóły kontraktu planu (dozwolone ścieżki celów, reguły walidacji i semantyka błędów):

- [Kontrakt planu Secrets Apply](/gateway/secrets-plan-contract)

Co `apply` może zaktualizować:

- `openclaw.json` (cele SecretRef + upserty/usunięcia dostawców)
- `auth-profiles.json` (czyszczenie celów dostawców)
- starsze pozostałości `auth.json`
- znane klucze sekretów w `~/.openclaw/.env`, których wartości zostały zmigrowane

## Dlaczego nie ma kopii zapasowych do wycofania

`secrets apply` celowo nie zapisuje kopii zapasowych do wycofania zawierających stare wartości jawnego tekstu.

Bezpieczeństwo wynika ze ścisłego wstępnego sprawdzenia oraz quasi-atomowego apply z przywracaniem w pamięci według najlepszych starań w razie błędu.

## Przykład

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Jeśli `audit --check` nadal zgłasza wykrycia jawnego tekstu, zaktualizuj pozostałe zgłoszone ścieżki docelowe i uruchom audyt ponownie.
