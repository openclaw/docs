---
read_when:
    - Chcesz uruchomić szybki audyt bezpieczeństwa konfiguracji/stanu
    - Chcesz zastosować bezpieczne sugestie „fix” (uprawnienia, zaostrzenie ustawień domyślnych)
summary: Dokumentacja CLI dla `openclaw security` (audyt i naprawa typowych pułapek bezpieczeństwa)
title: security
x-i18n:
    generated_at: "2026-04-05T13:49:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Narzędzia bezpieczeństwa (audyt + opcjonalne naprawy).

Powiązane:

- Przewodnik bezpieczeństwa: [Security](/gateway/security)

## Audyt

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Audyt ostrzega, gdy wielu nadawców wiadomości prywatnych współdzieli główną sesję, i zaleca **bezpieczny tryb wiadomości prywatnych**: `session.dmScope="per-channel-peer"` (lub `per-account-channel-peer` dla kanałów z wieloma kontami) dla współdzielonych skrzynek odbiorczych.
Dotyczy to utwardzania współdzielonych/wspólnych skrzynek odbiorczych. Jedna Gateway współdzielona przez wzajemnie nieufnych/wrogich operatorów nie jest zalecaną konfiguracją; rozdziel granice zaufania przy użyciu osobnych gateway (lub osobnych użytkowników systemu operacyjnego/hostów).
Emituje także `security.trust_model.multi_user_heuristic`, gdy konfiguracja sugeruje prawdopodobny ruch wejściowy od współdzielonych użytkowników (na przykład otwarte zasady wiadomości prywatnych/grup, skonfigurowane cele grupowe lub reguły nadawców z wildcard), i przypomina, że domyślny model zaufania OpenClaw to osobisty asystent.
W przypadku celowo współdzielonych konfiguracji audyt zaleca sandboxowanie wszystkich sesji, utrzymywanie dostępu do systemu plików w zakresie workspace i niewykorzystywanie na tym runtime tożsamości ani poświadczeń osobistych/prywatnych.
Ostrzega także, gdy małe modele (`<=300B`) są używane bez sandboxa i z włączonymi narzędziami web/browser.
Dla ruchu przychodzącego webhook ostrzega, gdy `hooks.token` ponownie używa tokena Gateway, gdy `hooks.token` jest krótki, gdy `hooks.path="/"`, gdy `hooks.defaultSessionKey` nie jest ustawione, gdy `hooks.allowedAgentIds` nie ma ograniczeń, gdy włączone są nadpisania `sessionKey` w żądaniach oraz gdy nadpisania są włączone bez `hooks.allowedSessionKeyPrefixes`.
Ostrzega także, gdy ustawienia Docker dla sandboxa są skonfigurowane, a tryb sandboxa jest wyłączony, gdy `gateway.nodes.denyCommands` używa nieskutecznych wpisów przypominających wzorce lub nieznanych wpisów (obsługiwane jest tylko dokładne dopasowanie nazw poleceń węzłów, a nie filtrowanie tekstu powłoki), gdy `gateway.nodes.allowCommands` jawnie włącza niebezpieczne polecenia węzłów, gdy globalne `tools.profile="minimal"` jest nadpisywane przez profile narzędzi agentów, gdy otwarte grupy udostępniają narzędzia runtime/systemu plików bez zabezpieczeń sandbox/workspace oraz gdy narzędzia zainstalowanych pluginów rozszerzeń mogą być osiągalne przy liberalnej polityce narzędzi.
Zgłasza także `gateway.allowRealIpFallback=true` (ryzyko spoofingu nagłówków przy błędnej konfiguracji proxy) oraz `discovery.mdns.mode="full"` (wyciek metadanych przez rekordy TXT mDNS).
Ostrzega także, gdy sandbox browser używa sieci Docker `bridge` bez `sandbox.browser.cdpSourceRange`.
Zgłasza także niebezpieczne tryby sieci Docker dla sandboxa (w tym `host` i dołączenia do przestrzeni nazw `container:*`).
Ostrzega również, gdy istniejące kontenery Docker sandbox browser mają brakujące/przestarzałe etykiety hash (na przykład kontenery sprzed migracji bez `openclaw.browserConfigEpoch`) i zaleca `openclaw sandbox recreate --browser --all`.
Ostrzega, gdy rekordy instalacji pluginów/hooków opartych na npm nie są przypięte, nie mają metadanych integralności lub odbiegają od aktualnie zainstalowanych wersji pakietów.
Ostrzega, gdy listy dozwolonych kanałów opierają się na zmiennych nazwach/emailach/tagach zamiast na stabilnych identyfikatorach (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, zakresy IRC tam, gdzie dotyczy).
Ostrzega, gdy `gateway.auth.mode="none"` pozostawia HTTP API Gateway dostępne bez współdzielonego sekretu (`/tools/invoke` oraz dowolny włączony endpoint `/v1/*`).
Ustawienia z prefiksem `dangerous`/`dangerously` to jawne awaryjne nadpisania operatora; samo włączenie takiego ustawienia nie jest raportem o luce bezpieczeństwa.
Pełny spis niebezpiecznych parametrów znajduje się w sekcji „Insecure or dangerous flags summary” w [Security](/gateway/security).

Zachowanie SecretRef:

- `security audit` rozwiązuje obsługiwane SecretRef w trybie tylko do odczytu dla swoich docelowych ścieżek.
- Jeśli SecretRef nie jest dostępny w bieżącej ścieżce polecenia, audyt jest kontynuowany i zgłasza `secretDiagnostics` (zamiast awarii).
- `--token` i `--password` nadpisują uwierzytelnianie deep-probe tylko dla tego wywołania polecenia; nie przepisują konfiguracji ani mapowań SecretRef.

## Wyjście JSON

Użyj `--json` dla kontroli CI/polityk:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jeśli połączone są `--fix` i `--json`, wyjście zawiera zarówno akcje naprawcze, jak i raport końcowy:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Co zmienia `--fix`

`--fix` stosuje bezpieczne, deterministyczne działania naprawcze:

- przełącza typowe `groupPolicy="open"` na `groupPolicy="allowlist"` (w tym warianty kont w obsługiwanych kanałach)
- gdy zasada grup WhatsApp zostaje przełączona na `allowlist`, inicjalizuje `groupAllowFrom` na podstawie
  zapisanego pliku `allowFrom`, jeśli ta lista istnieje, a konfiguracja nie definiuje już
  `allowFrom`
- ustawia `logging.redactSensitive` z `"off"` na `"tools"`
- zaostrza uprawnienia dla stanu/konfiguracji i typowych plików wrażliwych
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesyjne
  `*.jsonl`)
- zaostrza także uprawnienia plików include konfiguracji wskazywanych z `openclaw.json`
- używa `chmod` na hostach POSIX oraz resetów `icacls` w Windows

`--fix` **nie**:

- rotuje tokenów/haseł/kluczy API
- wyłącza narzędzi (`gateway`, `cron`, `exec` itd.)
- nie zmienia opcji bindowania/uwierzytelniania/ekspozycji sieciowej gateway
- nie usuwa ani nie przepisuje pluginów/Skills
