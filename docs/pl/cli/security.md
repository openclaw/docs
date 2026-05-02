---
read_when:
    - Chcesz przeprowadzić szybki audyt bezpieczeństwa konfiguracji/stanu
    - Chcesz zastosować bezpieczne sugestie „naprawy” (uprawnienia, zaostrzenie wartości domyślnych)
summary: Dokumentacja referencyjna CLI dla `openclaw security` (audyt i naprawa typowych pułapek bezpieczeństwa)
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-05-02T09:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
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

Zwykłe `security audit` pozostaje na zimnej ścieżce konfiguracji/systemu plików/tylko do odczytu. Domyślnie nie wykrywa kolektorów bezpieczeństwa środowiska uruchomieniowego Plugin, więc rutynowe audyty nie ładują każdego zainstalowanego środowiska uruchomieniowego Plugin. Użyj `--deep`, aby dołączyć podejmowane w miarę możliwości sondy aktywnego Gateway oraz kolektory audytu bezpieczeństwa należące do Plugin; jawne wewnętrzne wywołania mogą także włączyć te kolektory należące do Plugin, gdy mają już odpowiedni zakres środowiska uruchomieniowego.

Audyt ostrzega, gdy wielu nadawców DM współdzieli główną sesję, i zaleca **bezpieczny tryb DM**: `session.dmScope="per-channel-peer"` (lub `per-account-channel-peer` dla kanałów z wieloma kontami) dla współdzielonych skrzynek odbiorczych.
Służy to wzmacnianiu ochrony współpracujących/współdzielonych skrzynek odbiorczych. Pojedynczy Gateway współdzielony przez wzajemnie niezaufanych/adwersarialnych operatorów nie jest zalecaną konfiguracją; rozdziel granice zaufania za pomocą osobnych gatewayów (lub osobnych użytkowników/hostów systemu operacyjnego).
Emituje też `security.trust_model.multi_user_heuristic`, gdy konfiguracja sugeruje prawdopodobny dopływ od wielu współdzielących użytkowników (na przykład otwarta polityka DM/grup, skonfigurowane cele grupowe lub reguły nadawców z symbolami wieloznacznymi), i przypomina, że OpenClaw domyślnie działa w modelu zaufania osobistego asystenta.
W przypadku celowych konfiguracji z wieloma współdzielącymi użytkownikami zaleceniem audytu jest uruchamianie wszystkich sesji w piaskownicy, utrzymywanie dostępu do systemu plików w zakresie obszaru roboczego oraz trzymanie osobistych/prywatnych tożsamości lub danych uwierzytelniających poza tym środowiskiem uruchomieniowym.
Ostrzega też, gdy małe modele (`<=300B`) są używane bez piaskownicy i z włączonymi narzędziami web/przeglądarki.
W przypadku dopływu przez Webhook ostrzega, gdy `hooks.token` ponownie używa tokenu Gateway, gdy `hooks.token` jest krótki, gdy `hooks.path="/"`, gdy `hooks.defaultSessionKey` nie jest ustawione, gdy `hooks.allowedAgentIds` nie jest ograniczone, gdy włączone są nadpisania `sessionKey` w żądaniach oraz gdy nadpisania są włączone bez `hooks.allowedSessionKeyPrefixes`.
Ostrzega też, gdy ustawienia piaskownicy Docker są skonfigurowane, a tryb piaskownicy jest wyłączony, gdy `gateway.nodes.denyCommands` używa nieskutecznych wpisów podobnych do wzorców/nieznanych wpisów (tylko dokładne dopasowanie nazwy polecenia Node, nie filtrowanie tekstu powłoki), gdy `gateway.nodes.allowCommands` jawnie włącza niebezpieczne polecenia Node, gdy globalne `tools.profile="minimal"` jest nadpisywane przez profile narzędzi agentów, gdy otwarte grupy wystawiają narzędzia środowiska uruchomieniowego/systemu plików bez zabezpieczeń piaskownicy/obszaru roboczego oraz gdy zainstalowane narzędzia Plugin mogą być osiągalne przy liberalnej polityce narzędzi.
Oznacza też `gateway.allowRealIpFallback=true` (ryzyko fałszowania nagłówków, jeśli proxy są źle skonfigurowane) oraz `discovery.mdns.mode="full"` (wyciek metadanych przez rekordy TXT mDNS).
Ostrzega też, gdy przeglądarka w piaskownicy używa sieci Docker `bridge` bez `sandbox.browser.cdpSourceRange`.
Oznacza też niebezpieczne tryby sieci Docker piaskownicy (w tym `host` i dołączanie do przestrzeni nazw `container:*`).
Ostrzega też, gdy istniejące kontenery Docker przeglądarki w piaskownicy mają brakujące/nieaktualne etykiety skrótu (na przykład kontenery sprzed migracji bez `openclaw.browserConfigEpoch`) i zaleca `openclaw sandbox recreate --browser --all`.
Ostrzega też, gdy rekordy instalacji Plugin/hook oparte na npm nie są przypięte, nie mają metadanych integralności lub różnią się od obecnie zainstalowanych wersji pakietów.
Ostrzega, gdy listy dozwolonych kanałów opierają się na zmiennych nazwach/adresach e-mail/tagach zamiast stabilnych identyfikatorów (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, zakresy IRC tam, gdzie ma to zastosowanie).
Ostrzega, gdy `gateway.auth.mode="none"` pozostawia interfejsy API HTTP Gateway osiągalne bez współdzielonego sekretu (`/tools/invoke` oraz każdy włączony endpoint `/v1/*`).
Ustawienia z prefiksami `dangerous`/`dangerously` są jawnymi awaryjnymi nadpisaniami operatora; włączenie jednego z nich samo w sobie nie jest zgłoszeniem podatności bezpieczeństwa.
Pełny spis niebezpiecznych parametrów znajduje się w sekcji „Podsumowanie niebezpiecznych lub niezabezpieczonych flag” w [Bezpieczeństwo](/pl/gateway/security).

Zachowanie SecretRef:

- `security audit` rozwiązuje obsługiwane SecretRefs w trybie tylko do odczytu dla swoich docelowych ścieżek.
- Jeśli SecretRef jest niedostępny w bieżącej ścieżce polecenia, audyt kontynuuje działanie i raportuje `secretDiagnostics` (zamiast ulec awarii).
- `--token` i `--password` nadpisują uwierzytelnianie głębokiej sondy tylko dla danego wywołania polecenia; nie przepisują konfiguracji ani mapowań SecretRef.

## Dane wyjściowe JSON

Użyj `--json` do kontroli CI/polityk:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jeśli `--fix` i `--json` zostaną połączone, dane wyjściowe obejmują zarówno działania naprawcze, jak i końcowy raport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Co zmienia `--fix`

`--fix` stosuje bezpieczne, deterministyczne remediacje:

- przełącza typowe `groupPolicy="open"` na `groupPolicy="allowlist"` (w tym warianty kont w obsługiwanych kanałach)
- gdy polityka grup WhatsApp przełącza się na `allowlist`, zasila `groupAllowFrom` z
  zapisanego pliku `allowFrom`, jeśli ta lista istnieje, a konfiguracja nie
  definiuje jeszcze `allowFrom`
- ustawia `logging.redactSensitive` z `"off"` na `"tools"`
- zaostrza uprawnienia do stanu/konfiguracji oraz typowych plików wrażliwych
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesyjne
  `*.jsonl`)
- zaostrza też uprawnienia plików dołączanych do konfiguracji, do których odwołuje się `openclaw.json`
- używa `chmod` na hostach POSIX i resetów `icacls` w Windows

`--fix` **nie**:

- rotuje tokenów/haseł/kluczy API
- wyłącza narzędzi (`gateway`, `cron`, `exec` itp.)
- zmienia wyborów dotyczących bindowania/uwierzytelniania/ekspozycji sieciowej gatewaya
- usuwa ani nie przepisuje plugins/Skills

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Audyt bezpieczeństwa](/pl/gateway/security)
