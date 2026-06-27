---
read_when:
    - Chcesz uruchomić szybki audyt bezpieczeństwa konfiguracji/stanu
    - Chcesz zastosować bezpieczne sugestie typu „napraw” (uprawnienia, zaostrzenie ustawień domyślnych)
summary: Dokumentacja referencyjna CLI dla `openclaw security` (audytowanie i naprawianie typowych pułapek bezpieczeństwa)
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-06-27T17:23:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

Zwykłe `security audit` pozostaje na zimnej ścieżce konfiguracji/systemu plików/tylko do odczytu. Domyślnie nie wykrywa kolektorów bezpieczeństwa czasu wykonania pluginów, więc rutynowe audyty nie ładują czasu wykonania każdego zainstalowanego pluginu. Użyj `--deep`, aby uwzględnić wykonywane w trybie best-effort sondy live Gateway oraz należące do pluginów kolektory audytu bezpieczeństwa; jawne wewnętrzne wywołania mogą także włączyć te należące do pluginów kolektory, gdy mają już odpowiedni zakres czasu wykonania.

Audyt ostrzega, gdy wielu nadawców DM współdzieli główną sesję, i zaleca **bezpieczny tryb DM**: `session.dmScope="per-channel-peer"` (lub `per-account-channel-peer` dla kanałów z wieloma kontami) dla współdzielonych skrzynek odbiorczych.
Służy to wzmacnianiu współpracujących/współdzielonych skrzynek odbiorczych. Pojedynczy Gateway współdzielony przez wzajemnie niezaufanych/wrogich operatorów nie jest zalecaną konfiguracją; rozdziel granice zaufania za pomocą osobnych Gatewayów (lub osobnych użytkowników/hostów systemu operacyjnego).
Emituje także `security.trust_model.multi_user_heuristic`, gdy konfiguracja sugeruje prawdopodobny ingress współdzielony przez wielu użytkowników (na przykład otwartą politykę DM/grup, skonfigurowane cele grupowe lub reguły nadawców z symbolami wieloznacznymi), i przypomina, że OpenClaw domyślnie działa w modelu zaufania osobistego asystenta.
Dla celowych konfiguracji współdzielonych przez wielu użytkowników zalecenie audytu to uruchamianie wszystkich sesji w piaskownicy, utrzymywanie dostępu do systemu plików w zakresie obszaru roboczego oraz trzymanie osobistych/prywatnych tożsamości lub danych uwierzytelniających poza tym środowiskiem wykonawczym.
Ostrzega także, gdy małe modele (`<=300B`) są używane bez piaskownicy i z włączonymi narzędziami web/przeglądarki.
Dla ingressu Webhook logi startowe zapisują niekrytyczne ostrzeżenie bezpieczeństwa, a audyt flaguje ponowne użycie przez `hooks.token` aktywnych wartości uwierzytelniania wspólnym sekretem Gateway, w tym `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oraz `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Ostrzega także, gdy:

- `hooks.token` jest krótki
- `hooks.path="/"`
- `hooks.defaultSessionKey` nie jest ustawione
- `hooks.allowedAgentIds` nie ma ograniczeń
- nadpisania `sessionKey` w żądaniach są włączone
- nadpisania są włączone bez `hooks.allowedSessionKeyPrefixes`

Jeśli uwierzytelnianie hasłem Gateway jest podawane tylko przy starcie, przekaż tę samą wartość do `openclaw security audit --auth password --password <password>`, aby audyt mógł sprawdzić ją względem `hooks.token`.
Uruchom `openclaw doctor --fix`, aby zrotować utrwalony, ponownie użyty `hooks.token`, a następnie zaktualizuj zewnętrznych nadawców hooków, aby używali nowego tokenu hooka.

Ostrzega także, gdy ustawienia piaskownicy Docker są skonfigurowane, gdy tryb piaskownicy jest wyłączony, gdy `gateway.nodes.denyCommands` używa nieskutecznych wpisów przypominających wzorce/nieznanych wpisów (tylko dokładne dopasowanie nazwy polecenia węzła, nie filtrowanie tekstu powłoki), gdy `gateway.nodes.allowCommands` jawnie włącza niebezpieczne polecenia węzłów, gdy globalne `tools.profile="minimal"` jest nadpisane przez profile narzędzi agentów, gdy narzędzia zapisu/edycji są wyłączone, ale `exec` nadal jest dostępne bez ograniczającej granicy systemu plików piaskownicy, gdy otwarte DM lub grupy udostępniają narzędzia czasu wykonania/systemu plików bez zabezpieczeń piaskownicy/obszaru roboczego oraz gdy zainstalowane narzędzia pluginów mogą być osiągalne przy liberalnej polityce narzędzi.
Flaguje także `gateway.allowRealIpFallback=true` (ryzyko podszywania się pod nagłówki, jeśli proxy są błędnie skonfigurowane) oraz `discovery.mdns.mode="full"` (wyciek metadanych przez rekordy mDNS TXT).
Ostrzega także, gdy przeglądarka w piaskownicy używa sieci Docker `bridge` bez `sandbox.browser.cdpSourceRange`.
Flaguje także niebezpieczne tryby sieci Docker piaskownicy (w tym `host` i dołączenia do przestrzeni nazw `container:*`).
Ostrzega także, gdy istniejące kontenery Docker przeglądarki w piaskownicy mają brakujące/nieaktualne etykiety skrótu (na przykład kontenery sprzed migracji bez `openclaw.browserConfigEpoch`) i zaleca `openclaw sandbox recreate --browser --all`.
Ostrzega także, gdy rekordy instalacji pluginów/hooków opartych na npm są nieprzypięte, brakuje im metadanych integralności albo odbiegają od obecnie zainstalowanych wersji pakietów.
Ostrzega, gdy listy dozwolonych kanałów polegają na zmiennych nazwach/e-mailach/tagach zamiast stabilnych identyfikatorów (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, zakresy IRC tam, gdzie ma to zastosowanie).
Ostrzega, gdy `gateway.auth.mode="none"` pozostawia interfejsy HTTP API Gateway osiągalne bez wspólnego sekretu (`/tools/invoke` plus każdy włączony endpoint `/v1/*`).
Ustawienia z prefiksem `dangerous`/`dangerously` są jawnymi awaryjnymi nadpisaniami operatora; włączenie jednego z nich samo w sobie nie jest zgłoszeniem podatności bezpieczeństwa.
Pełną inwentaryzację niebezpiecznych parametrów znajdziesz w sekcji „Podsumowanie niebezpiecznych lub niebezpiecznych flag” w [Bezpieczeństwo](/pl/gateway/security).

Celowe stałe ustalenia można zaakceptować za pomocą `security.audit.suppressions`.
Każde wyciszenie dopasowuje dokładny `checkId` i można je zawęzić za pomocą
podciągów `titleIncludes` i/lub `detailIncludes` bez rozróżniania wielkości liter:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Wyciszone ustalenia są usuwane z aktywnego `summary` i listy `findings`.
Dane wyjściowe JSON zachowują je w `suppressedFindings` na potrzeby audytowalności.
Gdy wyciszenia są skonfigurowane, aktywne dane wyjściowe zachowują także niewyciszane
ustalenie informacyjne `security.audit.suppressions.active`, aby czytelnicy widzieli, że audyt
został przefiltrowany. Niebezpieczne flagi konfiguracji są emitowane jako jedna flaga na ustalenie, więc
zaakceptowanie jednej niebezpiecznej flagi nie ukrywa innych włączonych flag, które współdzielą
ten sam `config.insecure_or_dangerous_flags` checkId.
Ponieważ wyciszenia mogą ukrywać stałe ryzyko, dodawanie lub usuwanie ich przez
polecenia powłoki uruchamiane przez agenta wymaga zatwierdzenia exec, chyba że exec już działa
z `security="full"` i `ask="off"` dla zaufanej automatyzacji lokalnej.

Zachowanie SecretRef:

- `security audit` rozwiązuje obsługiwane SecretRefs w trybie tylko do odczytu dla swoich docelowych ścieżek.
- Jeśli SecretRef jest niedostępny w bieżącej ścieżce polecenia, audyt jest kontynuowany i raportuje `secretDiagnostics` (zamiast kończyć się awarią).
- `--token` i `--password` nadpisują tylko uwierzytelnianie głębokiej sondy dla danego wywołania polecenia; nie przepisują konfiguracji ani mapowań SecretRef.

## Dane wyjściowe JSON

Użyj `--json` do kontroli CI/polityk:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jeśli `--fix` i `--json` są połączone, dane wyjściowe zawierają zarówno działania naprawcze, jak i końcowy raport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Co zmienia `--fix`

`--fix` stosuje bezpieczne, deterministyczne remediacje:

- przełącza typowe `groupPolicy="open"` na `groupPolicy="allowlist"` (w tym warianty kont w obsługiwanych kanałach)
- gdy polityka grup WhatsApp przełącza się na `allowlist`, zasila `groupAllowFrom` z
  przechowywanego pliku `allowFrom`, gdy taka lista istnieje, a konfiguracja nie definiuje jeszcze
  `allowFrom`
- ustawia `logging.redactSensitive` z `"off"` na `"tools"`
- zaostrza uprawnienia dla stanu/konfiguracji i typowych plików poufnych
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesyjne
  `*.jsonl`)
- zaostrza także pliki include konfiguracji wskazane z `openclaw.json`
- używa `chmod` na hostach POSIX i resetów `icacls` w Windows

`--fix` **nie**:

- rotuje tokenów/haseł/kluczy API
- wyłącza narzędzi (`gateway`, `cron`, `exec` itd.)
- zmienia wyborów dotyczących bindowania/uwierzytelniania/ekspozycji sieciowej Gateway
- usuwa ani nie przepisuje pluginów/Skills

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Audyt bezpieczeństwa](/pl/gateway/security)
