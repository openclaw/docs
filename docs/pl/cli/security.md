---
read_when:
    - Chcesz przeprowadzić szybki audyt bezpieczeństwa konfiguracji/stanu
    - Chcesz zastosować bezpieczne sugestie „naprawy” (uprawnienia, zaostrzenie ustawień domyślnych)
summary: Dokumentacja referencyjna CLI dla `openclaw security` (audytuj i naprawiaj typowe pułapki bezpieczeństwa)
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-05-10T19:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Narzędzia bezpieczeństwa (audyt + opcjonalne poprawki).

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

Zwykłe `security audit` pozostaje na zimnej, tylko do odczytu ścieżce konfiguracji/systemu plików. Domyślnie nie wykrywa kolektorów bezpieczeństwa środowiska uruchomieniowego Plugin, więc rutynowe audyty nie ładują każdego zainstalowanego środowiska uruchomieniowego Plugin. Użyj `--deep`, aby uwzględnić wykonywane w trybie best-effort sondy Gateway na żywo oraz należące do Plugin kolektory audytu bezpieczeństwa; jawni wewnętrzni wywołujący mogą także włączyć te należące do Plugin kolektory, gdy mają już odpowiedni zakres środowiska uruchomieniowego.

Audyt ostrzega, gdy wielu nadawców DM współdzieli główną sesję, i zaleca **bezpieczny tryb DM**: `session.dmScope="per-channel-peer"` (lub `per-account-channel-peer` dla kanałów z wieloma kontami) w przypadku współdzielonych skrzynek odbiorczych.
Służy to utwardzeniu współpracujących/współdzielonych skrzynek odbiorczych. Pojedynczy Gateway współdzielony przez wzajemnie niezaufanych/adwersarialnych operatorów nie jest zalecaną konfiguracją; rozdziel granice zaufania za pomocą osobnych bram (lub osobnych użytkowników/hostów systemu operacyjnego).
Emitowany jest też `security.trust_model.multi_user_heuristic`, gdy konfiguracja sugeruje prawdopodobny napływ od współdzielonych użytkowników (na przykład otwarta polityka DM/grup, skonfigurowane cele grupowe lub reguły nadawców z symbolami wieloznacznymi), oraz przypomnienie, że OpenClaw domyślnie używa modelu zaufania osobistego asystenta.
W przypadku celowych konfiguracji ze współdzielonymi użytkownikami zalecenie audytu to izolowanie wszystkich sesji w sandboxie, ograniczenie dostępu do systemu plików do obszaru roboczego oraz utrzymywanie osobistych/prywatnych tożsamości lub poświadczeń poza tym środowiskiem uruchomieniowym.
Ostrzega także, gdy małe modele (`<=300B`) są używane bez sandboxingu i z włączonymi narzędziami web/przeglądarki.
Dla wejścia Webhook ostrzega, gdy `hooks.token` ponownie używa tokenu Gateway, gdy `hooks.token` jest krótki, gdy `hooks.path="/"`, gdy `hooks.defaultSessionKey` nie jest ustawione, gdy `hooks.allowedAgentIds` jest nieograniczone, gdy nadpisania `sessionKey` z żądań są włączone oraz gdy nadpisania są włączone bez `hooks.allowedSessionKeyPrefixes`.
Ostrzega także, gdy ustawienia Docker dla sandboxa są skonfigurowane przy wyłączonym trybie sandboxa, gdy `gateway.nodes.denyCommands` używa nieskutecznych wpisów podobnych do wzorców lub nieznanych wpisów (tylko dokładne dopasowanie nazw poleceń Node, nie filtrowanie tekstu powłoki), gdy `gateway.nodes.allowCommands` jawnie włącza niebezpieczne polecenia Node, gdy globalne `tools.profile="minimal"` jest nadpisywane przez profile narzędzi agentów, gdy narzędzia zapisu/edycji są wyłączone, ale `exec` nadal jest dostępne bez ograniczającej granicy systemu plików sandboxa, gdy otwarte grupy ujawniają narzędzia środowiska uruchomieniowego/systemu plików bez zabezpieczeń sandboxa/obszaru roboczego oraz gdy zainstalowane narzędzia Plugin mogą być osiągalne przy permisywnej polityce narzędzi.
Oznacza także `gateway.allowRealIpFallback=true` (ryzyko fałszowania nagłówków, jeśli proxy są błędnie skonfigurowane) oraz `discovery.mdns.mode="full"` (wyciek metadanych przez rekordy mDNS TXT).
Ostrzega także, gdy przeglądarka sandboxa używa sieci Docker `bridge` bez `sandbox.browser.cdpSourceRange`.
Oznacza także niebezpieczne tryby sieci Docker sandboxa (w tym `host` i dołączenia do przestrzeni nazw `container:*`).
Ostrzega także, gdy istniejące kontenery Docker przeglądarki sandboxa mają brakujące/nieaktualne etykiety hashy (na przykład kontenery sprzed migracji bez `openclaw.browserConfigEpoch`) i zaleca `openclaw sandbox recreate --browser --all`.
Ostrzega także, gdy rekordy instalacji Plugin/hook opartych na npm nie są przypięte, nie mają metadanych integralności lub odbiegają od aktualnie zainstalowanych wersji pakietów.
Ostrzega, gdy listy dozwolonych kanałów polegają na zmiennych nazwach/adresach e-mail/tagach zamiast stabilnych ID (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, zakresy IRC tam, gdzie dotyczy).
Ostrzega, gdy `gateway.auth.mode="none"` pozostawia interfejsy API HTTP Gateway osiągalne bez współdzielonego sekretu (`/tools/invoke` oraz każdy włączony punkt końcowy `/v1/*`).
Ustawienia z prefiksem `dangerous`/`dangerously` są jawnymi awaryjnymi nadpisaniami operatora; włączenie jednego z nich samo w sobie nie jest zgłoszeniem podatności bezpieczeństwa.
Pełną inwentaryzację niebezpiecznych parametrów znajdziesz w sekcji „Podsumowanie niezabezpieczonych lub niebezpiecznych flag” w [Bezpieczeństwo](/pl/gateway/security).

Zachowanie SecretRef:

- `security audit` rozwiązuje obsługiwane SecretRefs w trybie tylko do odczytu dla swoich docelowych ścieżek.
- Jeśli SecretRef jest niedostępny w bieżącej ścieżce polecenia, audyt jest kontynuowany i raportuje `secretDiagnostics` (zamiast ulec awarii).
- `--token` i `--password` nadpisują uwierzytelnianie głębokiej sondy tylko dla danego wywołania polecenia; nie przepisują konfiguracji ani mapowań SecretRef.

## Dane wyjściowe JSON

Użyj `--json` do kontroli CI/polityk:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jeśli `--fix` i `--json` są połączone, dane wyjściowe obejmują zarówno działania naprawcze, jak i raport końcowy:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Co zmienia `--fix`

`--fix` stosuje bezpieczne, deterministyczne środki naprawcze:

- przełącza typowe `groupPolicy="open"` na `groupPolicy="allowlist"` (w tym warianty kont w obsługiwanych kanałach)
- gdy polityka grup WhatsApp przełącza się na `allowlist`, zasila `groupAllowFrom` z
  zapisanego pliku `allowFrom`, gdy taka lista istnieje, a konfiguracja jeszcze nie
  definiuje `allowFrom`
- ustawia `logging.redactSensitive` z `"off"` na `"tools"`
- zaostrza uprawnienia do plików stanu/konfiguracji i typowych plików wrażliwych
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesyjne
  `*.jsonl`)
- zaostrza także uprawnienia do plików include konfiguracji wskazywanych z `openclaw.json`
- używa `chmod` na hostach POSIX oraz resetów `icacls` w Windows

`--fix` **nie**:

- rotuje tokenów/haseł/kluczy API
- wyłącza narzędzi (`gateway`, `cron`, `exec` itd.)
- zmienia wyborów dotyczących bindowania/uwierzytelniania/ekspozycji sieciowej gateway
- usuwa ani nie przepisuje plugins/Skills

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Audyt bezpieczeństwa](/pl/gateway/security)
