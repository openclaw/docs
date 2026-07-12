---
read_when:
    - Ponowne rozwiązywanie odwołań do sekretów w czasie działania
    - Audyt pozostałości zwykłego tekstu i nierozwiązanych odwołań
    - Konfigurowanie SecretRefs i stosowanie jednokierunkowych zmian oczyszczających
summary: Dokumentacja CLI dla `openclaw secrets` (ponowne ładowanie, audyt, konfiguracja, zastosowanie)
title: Sekrety
x-i18n:
    generated_at: "2026-07-12T14:55:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Zarządzaj odwołaniami SecretRef i utrzymuj aktywną migawkę środowiska uruchomieniowego w prawidłowym stanie.

| Polecenie   | Rola                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC Gateway (`secrets.reload`): ponownie rozwiązuje odwołania i zastępuje migawkę środowiska uruchomieniowego tylko po pełnym powodzeniu (bez zapisywania konfiguracji)                               |
| `audit`     | Skan konfiguracji, magazynów uwierzytelniania i wygenerowanych modeli oraz pozostałości po starszych wersjach w trybie tylko do odczytu pod kątem tekstu jawnego, nierozwiązanych odwołań i rozbieżności priorytetów (odwołania exec są pomijane bez `--allow-exec`) |
| `configure` | Interaktywny kreator konfiguracji dostawców, mapowania celów i kontroli wstępnej (wymaga TTY)                                                                                                         |
| `apply`     | Wykonuje zapisany plan (`--dry-run` tylko go weryfikuje i domyślnie pomija kontrole exec; tryb zapisu odrzuca plany zawierające exec bez `--allow-exec`), a następnie usuwa wskazane pozostałości tekstu jawnego |

Zalecany cykl pracy operatora:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Jeśli plan obejmuje odwołania SecretRef lub dostawców typu `exec`, przekaż `--allow-exec` zarówno do polecenia próbnego, jak i zapisującego `apply`.

Kody wyjścia dla CI/bramek:

- `audit --check` zwraca `1`, gdy wykryto problemy.
- Nierozwiązane odwołania powodują zwrócenie `2` (niezależnie od `--check`).

Powiązane: [Zarządzanie sekretami](/pl/gateway/secrets) · [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface) · [Bezpieczeństwo](/pl/gateway/security)

## Ponowne wczytywanie migawki środowiska uruchomieniowego

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Używa metody RPC Gateway `secrets.reload`. Jeśli rozwiązanie odwołań się nie powiedzie, Gateway zachowuje ostatnią poprawną migawkę i zwraca błąd (bez częściowej aktywacji). Odpowiedź JSON zawiera `warningCount`.

Opcje: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Audyt

Skanuje stan OpenClaw pod kątem:

- przechowywania sekretów w postaci tekstu jawnego
- nierozwiązanych odwołań
- rozbieżności priorytetów (poświadczenia z `auth-profiles.json` przesłaniające odwołania z `openclaw.json`)
- pozostałości w wygenerowanych plikach `agents/*/agent/models.json` (wartości `apiKey` dostawców i poufne nagłówki dostawców)
- pozostałości po starszych wersjach (wpisy w starszym magazynie uwierzytelniania, przypomnienia OAuth)

Wykrywanie poufnych nagłówków dostawców opiera się na heurystyce nazw: oznaczane są nagłówki, których nazwy zawierają typowe fragmenty związane z uwierzytelnianiem lub poświadczeniami (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Struktura raportu:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- kody wykrytych problemów: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Konfiguracja (interaktywny kreator)

Interaktywnie utwórz zmiany dostawców i SecretRef, przeprowadź kontrolę wstępną i opcjonalnie je zastosuj:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Przebieg: najpierw konfiguracja dostawców (dodawanie, edytowanie lub usuwanie aliasów `secrets.providers`), następnie mapowanie poświadczeń (wybór pól i przypisywanie odwołań `{source, provider, id}`), a potem kontrola wstępna i opcjonalne zastosowanie zmian.

Flagi:

- `--providers-only`: konfiguruje tylko `secrets.providers`, pomijając mapowanie poświadczeń
- `--skip-provider-setup`: pomija konfigurację dostawców i mapuje poświadczenia na istniejących dostawców
- `--agent <id>`: ogranicza wykrywanie celów i zapisywanie w `auth-profiles.json` do magazynu jednego agenta
- `--allow-exec`: zezwala na kontrole exec SecretRef podczas kontroli wstępnej i stosowania zmian (może wykonywać polecenia dostawców)

Nie można łączyć `--providers-only` z `--skip-provider-setup`.

Uwagi:

- Wymaga interaktywnego TTY.
- Obejmuje pola zawierające sekrety w `openclaw.json` oraz `auth-profiles.json` w wybranym zakresie agenta; kanoniczny obsługiwany zakres: [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
- Umożliwia tworzenie nowych mapowań `auth-profiles.json` bezpośrednio w procesie wyboru.
- Przed zastosowaniem zmian przeprowadza wstępne rozwiązanie odwołań.
- W generowanych planach opcje usuwania pozostałości są domyślnie włączone (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Zastosowanie zmian jest nieodwracalne w przypadku usuniętych wartości tekstu jawnego.
- Bez `--apply` CLI po kontroli wstępnej nadal wyświetla pytanie `Apply this plan now?`.
- Z `--apply` (i bez `--yes`) CLI wyświetla dodatkowe potwierdzenie nieodwracalnej migracji.
- `--json` wyświetla plan i raport kontroli wstępnej, ale nadal wymaga interaktywnego TTY.

### Bezpieczeństwo dostawcy exec

Instalacje Homebrew często udostępniają pliki wykonywalne za pośrednictwem dowiązań symbolicznych w `/opt/homebrew/bin/*`. Ustaw `allowSymlinkCommand: true` tylko wtedy, gdy jest to konieczne dla zaufanych ścieżek menedżera pakietów, w połączeniu z `trustedDirs` (na przykład `["/opt/homebrew"]`). W systemie Windows, jeśli weryfikacja list ACL nie jest dostępna dla ścieżki dostawcy, OpenClaw domyślnie odmawia działania; wyłącznie dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego dostawcy, aby pominąć kontrolę bezpieczeństwa ścieżki.

## Stosowanie zapisanego planu

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` przeprowadza kontrolę wstępną bez zapisywania plików; kontrole exec SecretRef są domyślnie pomijane w trybie próbnym. Tryb zapisu odrzuca plany zawierające odwołania SecretRef lub dostawców typu exec bez `--allow-exec`. Użyj `--allow-exec`, aby zezwolić na kontrole lub wykonywanie dostawców exec w dowolnym z tych trybów.

Elementy, które `apply` może zaktualizować:

- `openclaw.json` (cele SecretRef oraz wstawianie, aktualizowanie i usuwanie dostawców)
- `auth-profiles.json` (usuwanie danych dostawców docelowych)
- pozostałości w starszym pliku `auth.json`
- znane klucze sekretów w `~/.openclaw/.env`, których wartości zostały zmigrowane

Szczegóły kontraktu planu (dozwolone ścieżki docelowe, reguły walidacji, semantyka błędów): [Kontrakt planu stosowania sekretów](/pl/gateway/secrets-plan-contract).

### Dlaczego nie ma kopii zapasowych do wycofywania zmian

`secrets apply` celowo nie zapisuje kopii zapasowych do wycofywania zmian, które zawierałyby stare wartości tekstu jawnego. Bezpieczeństwo zapewniają rygorystyczna kontrola wstępna i niemal atomowe zastosowanie zmian, z podejmowaną w miarę możliwości próbą przywrócenia stanu w pamięci w przypadku błędu.

## Przykład

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Jeśli `audit --check` nadal zgłasza tekst jawny, zaktualizuj pozostałe wskazane ścieżki docelowe i ponownie uruchom audyt.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zarządzanie sekretami](/pl/gateway/secrets)
- [SecretRef w Vault](/plugins/vault)
