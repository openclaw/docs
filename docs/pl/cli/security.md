---
read_when:
    - Chcesz przeprowadzić szybki audyt bezpieczeństwa konfiguracji/stanu
    - Chcesz zastosować bezpieczne sugestie „naprawy” (uprawnienia, zaostrzenie wartości domyślnych)
summary: Dokumentacja referencyjna CLI dla `openclaw security` (audyt i naprawa typowych pułapek bezpieczeństwa)
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-05-06T17:54:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Narzędzia bezpieczeństwa (audyt + opcjonalne poprawki).

Powiązane:

- Przewodnik bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## Audyt

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Zwykłe `security audit` pozostaje na zimnej ścieżce konfiguracji/systemu plików/tylko do odczytu. Domyślnie nie wykrywa kolektorów bezpieczeństwa środowiska uruchomieniowego pluginów, więc rutynowe audyty nie ładują środowiska uruchomieniowego każdego zainstalowanego pluginu. Użyj `--deep`, aby uwzględnić wykonywane w miarę możliwości aktywne sondy Gateway oraz należące do pluginów kolektory audytu bezpieczeństwa; jawni wewnętrzni wywołujący mogą także włączyć te kolektory należące do pluginów, gdy mają już odpowiedni zakres środowiska uruchomieniowego.

Audyt ostrzega, gdy wielu nadawców wiadomości prywatnych współdzieli główną sesję, i zaleca **bezpieczny tryb DM**: `session.dmScope="per-channel-peer"` (lub `per-account-channel-peer` dla kanałów z wieloma kontami) dla współdzielonych skrzynek odbiorczych.
Służy to wzmacnianiu współpracujących/współdzielonych skrzynek odbiorczych. Pojedynczy Gateway współdzielony przez wzajemnie niezaufanych/adwersarialnych operatorów nie jest zalecaną konfiguracją; rozdziel granice zaufania za pomocą osobnych Gateway (lub osobnych użytkowników/hostów systemu operacyjnego).
Emituje także `security.trust_model.multi_user_heuristic`, gdy konfiguracja sugeruje prawdopodobny ruch przychodzący od wielu współdzielących użytkowników (na przykład otwarte zasady DM/grup, skonfigurowane cele grupowe lub reguły nadawców z symbolami wieloznacznymi), i przypomina, że OpenClaw domyślnie używa modelu zaufania osobistego asystenta.
W przypadku celowych konfiguracji współdzielonych przez wielu użytkowników zalecenie audytu to izolowanie wszystkich sesji w piaskownicy, ograniczenie dostępu do systemu plików do obszaru roboczego oraz trzymanie osobistych/prywatnych tożsamości lub poświadczeń poza tym środowiskiem uruchomieniowym.
Ostrzega także, gdy małe modele (`<=300B`) są używane bez piaskownicy i z włączonymi narzędziami web/przeglądarki.
Dla wejścia Webhook ostrzega, gdy `hooks.token` ponownie używa tokenu Gateway, gdy `hooks.token` jest krótki, gdy `hooks.path="/"`, gdy `hooks.defaultSessionKey` nie jest ustawione, gdy `hooks.allowedAgentIds` jest nieograniczone, gdy włączone są nadpisania `sessionKey` żądania oraz gdy nadpisania są włączone bez `hooks.allowedSessionKeyPrefixes`.
Ostrzega także, gdy ustawienia Docker piaskownicy są skonfigurowane przy wyłączonym trybie piaskownicy, gdy `gateway.nodes.denyCommands` używa nieskutecznych wpisów podobnych do wzorców/nieznanych wpisów (tylko dokładne dopasowanie nazwy polecenia Node, a nie filtrowanie tekstu powłoki), gdy `gateway.nodes.allowCommands` jawnie włącza niebezpieczne polecenia Node, gdy globalne `tools.profile="minimal"` jest nadpisywane przez profile narzędzi agenta, gdy otwarte grupy wystawiają narzędzia środowiska uruchomieniowego/systemu plików bez zabezpieczeń piaskownicy/obszaru roboczego oraz gdy narzędzia zainstalowanych pluginów mogą być osiągalne przy liberalnych zasadach narzędzi.
Flaguje także `gateway.allowRealIpFallback=true` (ryzyko fałszowania nagłówków, jeśli proxy są źle skonfigurowane) oraz `discovery.mdns.mode="full"` (wyciek metadanych przez rekordy mDNS TXT).
Ostrzega także, gdy przeglądarka w piaskownicy używa sieci Docker `bridge` bez `sandbox.browser.cdpSourceRange`.
Flaguje także niebezpieczne tryby sieci Docker piaskownicy (w tym `host` oraz dołączanie przestrzeni nazw `container:*`).
Ostrzega także, gdy istniejące kontenery Docker przeglądarki w piaskownicy mają brakujące/nieaktualne etykiety skrótu (na przykład kontenery sprzed migracji bez `openclaw.browserConfigEpoch`) i zaleca `openclaw sandbox recreate --browser --all`.
Ostrzega także, gdy rekordy instalacji pluginów/hooków opartych na npm nie są przypięte, nie mają metadanych integralności lub odbiegają od aktualnie zainstalowanych wersji pakietów.
Ostrzega, gdy listy dozwolonych kanałów opierają się na zmiennych nazwach/adresach e-mail/tagach zamiast stabilnych identyfikatorów (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, zakresy IRC tam, gdzie ma to zastosowanie).
Ostrzega, gdy `gateway.auth.mode="none"` pozostawia HTTP API Gateway osiągalne bez współdzielonego sekretu (`/tools/invoke` oraz każdy włączony punkt końcowy `/v1/*`).
Ustawienia z prefiksem `dangerous`/`dangerously` są jawnymi awaryjnymi nadpisaniami operatora; samo włączenie takiego ustawienia nie jest zgłoszeniem podatności bezpieczeństwa.
Pełny wykaz niebezpiecznych parametrów znajduje się w sekcji „Podsumowanie niebezpiecznych lub niezabezpieczonych flag” w [Bezpieczeństwo](/pl/gateway/security).

Zachowanie SecretRef:

- `security audit` rozwiązuje obsługiwane SecretRef w trybie tylko do odczytu dla swoich docelowych ścieżek.
- Jeśli SecretRef jest niedostępny w bieżącej ścieżce polecenia, audyt jest kontynuowany i raportuje `secretDiagnostics` (zamiast się wywrócić).
- `--token` i `--password` nadpisują tylko uwierzytelnianie głębokiej sondy dla tego wywołania polecenia; nie przepisują konfiguracji ani mapowań SecretRef.

## Dane wyjściowe JSON

Użyj `--json` do sprawdzeń CI/zasad:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jeśli `--fix` i `--json` są połączone, dane wyjściowe zawierają zarówno działania naprawcze, jak i końcowy raport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Co zmienia `--fix`

`--fix` stosuje bezpieczne, deterministyczne naprawy:

- zmienia typowe `groupPolicy="open"` na `groupPolicy="allowlist"` (w tym warianty kont w obsługiwanych kanałach)
- gdy zasady grup WhatsApp zmieniają się na `allowlist`, wypełnia `groupAllowFrom` z
  zapisanego pliku `allowFrom`, gdy ta lista istnieje, a konfiguracja nie definiuje już
  `allowFrom`
- ustawia `logging.redactSensitive` z `"off"` na `"tools"`
- zaostrza uprawnienia do plików stanu/konfiguracji i typowych plików wrażliwych
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesyjne
  `*.jsonl`)
- zaostrza także uprawnienia plików include konfiguracji, do których odwołuje się `openclaw.json`
- używa `chmod` na hostach POSIX oraz resetów `icacls` w Windows

`--fix` **nie**:

- rotuje tokenów/haseł/kluczy API
- wyłącza narzędzi (`gateway`, `cron`, `exec` itd.)
- zmienia wyborów dotyczących powiązania/uwierzytelniania/ekspozycji sieciowej Gateway
- usuwa ani nie przepisuje pluginów/Skills

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Audyt bezpieczeństwa](/pl/gateway/security)
