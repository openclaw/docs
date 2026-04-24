---
read_when:
    - Chcesz przeprowadzić szybki audyt bezpieczeństwa konfiguracji/stanu
    - Chcesz zastosować bezpieczne sugestie „naprawy” (uprawnienia, zaostrzenie ustawień domyślnych)
summary: Dokumentacja CLI dla `openclaw security` (audytowanie i naprawianie typowych pułapek bezpieczeństwa)
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-04-24T09:04:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Narzędzia bezpieczeństwa (audyt + opcjonalne naprawy).

Powiązane:

- Przewodnik po bezpieczeństwie: [Bezpieczeństwo](/pl/gateway/security)

## Audyt

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Audyt ostrzega, gdy wielu nadawców DM współdzieli sesję główną, i zaleca **bezpieczny tryb DM**: `session.dmScope="per-channel-peer"` (lub `per-account-channel-peer` dla kanałów wielokontowych) dla współdzielonych skrzynek odbiorczych.
Dotyczy to utwardzania współpracujących/współdzielonych skrzynek odbiorczych. Jeden współdzielony Gateway używany przez operatorów wzajemnie sobie nieufających lub działających w sposób kontradyktoryjny nie jest zalecaną konfiguracją; rozdziel granice zaufania za pomocą osobnych Gateway (lub osobnych użytkowników systemu operacyjnego/hostów).
Emituje też `security.trust_model.multi_user_heuristic`, gdy konfiguracja sugeruje prawdopodobny współdzielony ruch wejściowy wielu użytkowników (na przykład otwarta polityka DM/grup, skonfigurowane cele grupowe lub reguły nadawców z wildcard), i przypomina, że domyślnie OpenClaw działa według modelu zaufania osobistego asystenta.
W przypadku celowo współdzielonych konfiguracji wielu użytkowników wskazówki audytu zalecają piaskownicowanie wszystkich sesji, utrzymanie dostępu do systemu plików w zakresie obszaru roboczego oraz trzymanie osobistych/prywatnych tożsamości lub poświadczeń z dala od tego środowiska uruchomieniowego.
Audyt ostrzega także, gdy małe modele (`<=300B`) są używane bez piaskownicy i przy włączonych narzędziach web/browser.
Dla ruchu przychodzącego przez Webhook ostrzega, gdy `hooks.token` używa ponownie tokenu Gateway, gdy `hooks.token` jest krótki, gdy `hooks.path="/"`, gdy `hooks.defaultSessionKey` nie jest ustawione, gdy `hooks.allowedAgentIds` nie jest ograniczone oraz gdy włączone są nadpisania `sessionKey` w żądaniu i brak `hooks.allowedSessionKeyPrefixes`.
Ostrzega też, gdy ustawienia Docker dla sandbox są skonfigurowane, mimo że tryb sandbox jest wyłączony, gdy `gateway.nodes.denyCommands` używa nieskutecznych wpisów typu wzorzec/nieznanych (tylko dokładne dopasowanie nazw poleceń Node, bez filtrowania tekstu powłoki), gdy `gateway.nodes.allowCommands` jawnie włącza niebezpieczne polecenia Node, gdy globalne `tools.profile="minimal"` jest nadpisywane przez profile narzędzi agentów, gdy otwarte grupy udostępniają narzędzia środowiska uruchomieniowego/systemu plików bez zabezpieczeń sandbox/obszaru roboczego oraz gdy zainstalowane narzędzia Plugin mogą być osiągalne przy liberalnej polityce narzędzi.
Sygnalizuje także `gateway.allowRealIpFallback=true` (ryzyko spoofingu nagłówków przy błędnej konfiguracji proxy) i `discovery.mdns.mode="full"` (wyciek metadanych przez rekordy TXT mDNS).
Ostrzega też, gdy przeglądarka sandbox używa sieci Docker `bridge` bez `sandbox.browser.cdpSourceRange`.
Sygnalizuje także niebezpieczne tryby sieci Docker sandbox (w tym `host` i dołączenia przestrzeni nazw `container:*`).
Ostrzega również, gdy istniejące kontenery Docker przeglądarki sandbox mają brakujące/nieaktualne etykiety hash (na przykład kontenery sprzed migracji bez `openclaw.browserConfigEpoch`) i zaleca `openclaw sandbox recreate --browser --all`.
Ostrzega też, gdy rekordy instalacji Plugin/hook opartych na npm nie są przypięte, nie mają metadanych integralności lub odbiegają od aktualnie zainstalowanych wersji pakietów.
Ostrzega, gdy allowlisty kanałów opierają się na zmiennych nazwach/e-mailach/tagach zamiast stabilnych identyfikatorach (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, zakresy IRC tam, gdzie ma to zastosowanie).
Ostrzega, gdy `gateway.auth.mode="none"` pozostawia interfejsy HTTP Gateway dostępne bez współdzielonego sekretu (`/tools/invoke` oraz każdy włączony punkt końcowy `/v1/*`).
Ustawienia z prefiksem `dangerous`/`dangerously` to jawne awaryjne nadpisania operatora; samo włączenie takiego ustawienia nie jest raportem o luce bezpieczeństwa.
Pełny spis niebezpiecznych parametrów znajdziesz w sekcji „Insecure or dangerous flags summary” w [Bezpieczeństwo](/pl/gateway/security).

Zachowanie SecretRef:

- `security audit` rozwiązuje obsługiwane SecretRefs w trybie tylko do odczytu dla docelowych ścieżek.
- Jeśli SecretRef nie jest dostępny w bieżącej ścieżce polecenia, audyt trwa dalej i raportuje `secretDiagnostics` (zamiast kończyć się awarią).
- `--token` i `--password` nadpisują tylko uwierzytelnianie deep-probe dla tego wywołania polecenia; nie przepisują konfiguracji ani mapowań SecretRef.

## Dane wyjściowe JSON

Użyj `--json` do kontroli CI/polityk:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jeśli połączysz `--fix` i `--json`, dane wyjściowe będą zawierać zarówno działania naprawcze, jak i końcowy raport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Co zmienia `--fix`

`--fix` stosuje bezpieczne, deterministyczne działania naprawcze:

- zmienia typowe `groupPolicy="open"` na `groupPolicy="allowlist"` (w tym warianty kont dla obsługiwanych kanałów)
- gdy polityka grupowa WhatsApp zmienia się na `allowlist`, inicjalizuje `groupAllowFrom` z
  zapisanego pliku `allowFrom`, jeśli ta lista istnieje, a konfiguracja nie definiuje już
  `allowFrom`
- ustawia `logging.redactSensitive` z `"off"` na `"tools"`
- zaostrza uprawnienia do stanu/konfiguracji i typowych plików wrażliwych
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesja
  `*.jsonl`)
- zaostrza też uprawnienia do plików include konfiguracji, do których odwołuje się `openclaw.json`
- używa `chmod` na hostach POSIX i resetów `icacls` w Windows

`--fix` **nie**:

- rotuje tokenów/haseł/kluczy API
- wyłącza narzędzi (`gateway`, `cron`, `exec` itd.)
- nie zmienia ustawień powiązania/uwierzytelniania/ekspozycji sieci Gateway
- nie usuwa ani nie przepisuje Plugin/Skills

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Audyt bezpieczeństwa](/pl/gateway/security)
