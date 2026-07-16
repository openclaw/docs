---
read_when:
    - Chcesz przeprowadzić szybki audyt bezpieczeństwa konfiguracji/stanu
    - Chcesz zastosować bezpieczne sugerowane „poprawki” (uprawnienia, zaostrzenie ustawień domyślnych)
summary: Dokumentacja CLI dla `openclaw security` (audyt i naprawianie typowych pułapek bezpieczeństwa)
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-16T18:10:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Narzędzia bezpieczeństwa: audyt oraz opcjonalne bezpieczne poprawki. Powiązane informacje: [Bezpieczeństwo](/pl/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Tryby audytu

Zwykłe `security audit` pozostaje na ścieżce zimnej konfiguracji/systemu plików/tylko do odczytu: nie wykrywa kolektorów bezpieczeństwa środowiska uruchomieniowego pluginów, dzięki czemu rutynowe audyty nie ładują środowiska uruchomieniowego każdego zainstalowanego pluginu. `--deep` dodaje wykonywane w miarę możliwości aktywne sondy Gateway oraz kolektory audytu bezpieczeństwa należące do pluginów (jawni wewnętrzni wywołujący mogą również włączyć te kolektory, jeśli mają już odpowiedni zakres środowiska uruchomieniowego).

Jeśli uwierzytelnianie Gateway hasłem jest podawane wyłącznie podczas uruchamiania, należy przekazać tę samą wartość za pomocą `--auth password --password <password>`, aby audyt mógł ją porównać z `hooks.token`.

## Co sprawdza

**Model wiadomości bezpośrednich/zaufania**

- Ostrzega, gdy wielu nadawców wiadomości bezpośrednich współdzieli sesję główną, i zaleca bezpieczny tryb wiadomości bezpośrednich: `session.dmScope="per-channel-peer"` (lub `per-account-channel-peer` w przypadku kanałów z wieloma kontami) dla współdzielonych skrzynek odbiorczych. Jest to wzmocnienie zabezpieczeń środowiska kooperacyjnego/współdzielonej skrzynki odbiorczej, a nie izolacja wzajemnie niezaufanych operatorów; granice zaufania należy rozdzielić za pomocą oddzielnych bram Gateway (lub oddzielnych użytkowników systemu operacyjnego/hostów).
- Generuje `security.trust_model.multi_user_heuristic`, gdy konfiguracja wskazuje na prawdopodobny dostęp wielu użytkowników (na przykład otwarte zasady wiadomości bezpośrednich/grup, skonfigurowane cele grupowe lub reguły nadawców z symbolami wieloznacznymi) — domyślnym modelem zaufania OpenClaw jest osobisty asystent (jeden operator), a nie odporna na wrogie działania izolacja wielodostępna. W celowych konfiguracjach współdzielonych przez wielu użytkowników należy uruchamiać wszystkie sesje w piaskownicy, ograniczać dostęp do systemu plików do obszaru roboczego oraz nie przechowywać w tym środowisku uruchomieniowym osobistych/prywatnych tożsamości ani danych uwierzytelniających.
- Ostrzega, gdy małe modele (`<=300B` parametrów) są używane bez piaskownicy oraz z włączonymi narzędziami internetowymi/przeglądarkowymi.

**Webhook/hooki**

Podczas uruchamiania rejestrowane jest niekrytyczne ostrzeżenie bezpieczeństwa, a audyt oznacza ponowne użycie `hooks.token` aktywnych wartości uwierzytelniania współdzielonym sekretem Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Ostrzega również, gdy:

- `hooks.token` jest krótkie
- `hooks.path="/"`
- `hooks.defaultSessionKey` nie jest ustawione
- `hooks.allowedAgentIds` jest nieograniczone
- włączone są nadpisania `sessionKey` żądania
- nadpisania są włączone bez `hooks.allowedSessionKeyPrefixes`

Należy uruchomić `openclaw doctor --fix`, aby obrócić utrwalone, ponownie używane `hooks.token`, a następnie zaktualizować zewnętrznych nadawców hooków, aby używali nowego tokenu.

**Piaskownica/narzędzia**

- Ostrzega, gdy ustawienia Docker piaskownicy są skonfigurowane, ale tryb piaskownicy jest wyłączony.
- Ostrzega, gdy `gateway.nodes.denyCommands` zawiera nieskuteczne wpisy przypominające wzorce lub nieznane wpisy (dopasowywanie dotyczy wyłącznie dokładnej nazwy polecenia Node, a nie filtrowania tekstu powłoki).
- Ostrzega, gdy `gateway.nodes.allowCommands` jawnie włącza niebezpieczne polecenia Node.
- Ostrzega, gdy globalne `tools.profile="minimal"` jest nadpisywane przez profile narzędzi agentów.
- Ostrzega, gdy narzędzia zapisu/edycji są wyłączone, ale `exec` jest nadal dostępne bez ograniczającej granicy systemu plików piaskownicy.
- Ostrzega, gdy otwarte wiadomości bezpośrednie lub grupy udostępniają narzędzia środowiska uruchomieniowego/systemu plików bez zabezpieczeń piaskownicy/obszaru roboczego.
- Ostrzega, gdy narzędzia zainstalowanych pluginów mogą być dostępne przy liberalnych zasadach dotyczących narzędzi.

**Przeglądarka w piaskownicy**

- Ostrzega, gdy przeglądarka w piaskownicy używa sieci Docker `bridge` bez `sandbox.browser.cdpSourceRange`.
- Oznacza niebezpieczne tryby sieci Docker piaskownicy, w tym dołączenia przestrzeni nazw `host` i `container:*`.
- Ostrzega, gdy istniejące kontenery Docker przeglądarki w piaskownicy mają brakujące/nieaktualne etykiety skrótu (na przykład kontenery sprzed migracji bez `openclaw.browserConfigEpoch`), i zaleca `openclaw sandbox recreate --browser --all`.

**Sieć/wykrywanie**

- Oznacza `gateway.allowRealIpFallback=true` (ryzyko podszywania się pod nagłówki w przypadku nieprawidłowej konfiguracji serwerów proxy).
- Oznacza `discovery.mdns.mode="full"` (wyciek metadanych za pośrednictwem rekordów mDNS TXT).
- Ostrzega, gdy `gateway.auth.mode="none"` pozostawia interfejsy API HTTP Gateway dostępne bez współdzielonego sekretu (`/tools/invoke` oraz każdy włączony punkt końcowy `/v1/*`).

**Pluginy/kanały**

- Ostrzega, gdy rekordy instalacji pluginów/hooków opartych na npm nie mają przypiętych wersji, brakuje w nich metadanych integralności lub odbiegają od aktualnie zainstalowanych wersji pakietów.
- Ostrzega, gdy listy dozwolonych kanałów opierają się na zmiennych nazwach/adresach e-mail/tagach zamiast stabilnych identyfikatorów (w stosownych przypadkach zakresy Discord, Slack, Google Chat, Microsoft Teams, Mattermost i IRC).

Ustawienia z prefiksem `dangerous`/`dangerously` są jawnymi awaryjnymi nadpisaniami operatora; włączenie takiego ustawienia samo w sobie nie stanowi zgłoszenia luki w zabezpieczeniach. Pełną listę niebezpiecznych parametrów zawiera sekcja „Podsumowanie niezabezpieczonych lub niebezpiecznych flag” na stronie [Bezpieczeństwo](/pl/gateway/security).

## Zachowanie SecretRef

`security audit` rozwiązuje obsługiwane odwołania SecretRef w trybie tylko do odczytu dla docelowych ścieżek. Jeśli odwołanie SecretRef jest niedostępne w bieżącej ścieżce polecenia, audyt jest kontynuowany i zgłasza `secretDiagnostics` zamiast ulec awarii. `--token` i `--password` nadpisują uwierzytelnianie sondy głębokiej wyłącznie dla danego wywołania polecenia; nie przepisują konfiguracji ani mapowań SecretRef.

## Wykluczenia

Celowe, stałe ustalenia można zaakceptować za pomocą `security.audit.suppressions`. Każde wykluczenie dopasowuje dokładne `checkId` i może zostać zawężone za pomocą podciągów `titleIncludes` i/lub `detailIncludes`, bez rozróżniania wielkości liter:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Włączone pluginy rozszerzeń: gbrain",
          "reason": "zaufany plugin lokalnego operatora"
        }
      ]
    }
  }
}
```

Wykluczone ustalenia są usuwane z aktywnych list `summary` i `findings`. Dane wyjściowe JSON zachowują je w `suppressedFindings` na potrzeby audytowalności. Gdy skonfigurowano wykluczenia, aktywne dane wyjściowe zachowują również niemożliwe do wykluczenia ustalenie informacyjne `security.audit.suppressions.active`, aby odbiorcy wiedzieli, że audyt został przefiltrowany. Niebezpieczne flagi konfiguracji są generowane po jednej fladze na ustalenie, dlatego zaakceptowanie jednej niebezpiecznej flagi nie ukrywa innych włączonych flag, które współdzielą ten sam identyfikator `config.insecure_or_dangerous_flags` checkId.

Ponieważ wykluczenia mogą ukrywać stałe ryzyko, dodawanie lub usuwanie ich za pomocą poleceń powłoki uruchamianych przez agenta wymaga zatwierdzenia wykonania, chyba że wykonanie działa już z `security="full"` i `ask="off"` na potrzeby zaufanej lokalnej automatyzacji.

## Dane wyjściowe JSON

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Z `--fix --json` dane wyjściowe obejmują zarówno działania naprawcze, jak i raport końcowy:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Co zmienia `--fix`

Stosuje bezpieczne, deterministyczne działania naprawcze:

- zmienia typowe `groupPolicy="open"` na `groupPolicy="allowlist"` (w tym warianty kont w obsługiwanych kanałach)
- gdy zasada grup WhatsApp zmienia się na `allowlist`, wypełnia `groupAllowFrom` na podstawie zapisanego pliku `allowFrom`, jeśli ta lista istnieje, a konfiguracja nie definiuje jeszcze `allowFrom`
- ustawia `logging.redactSensitive` z `"off"` na `"tools"`
- zaostrza uprawnienia do stanu/konfiguracji i typowych plików poufnych (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` oraz starszych artefaktów sesji)
- zaostrza również uprawnienia plików dołączanych do konfiguracji, wskazanych w `openclaw.json`
- używa `chmod` na hostach POSIX oraz resetowania `icacls` w systemie Windows

`--fix` **nie**:

- obraca tokenów/haseł/kluczy API
- wyłącza narzędzi (`gateway`, `cron`, `exec` itd.)
- zmienia ustawień powiązania/uwierzytelniania/ekspozycji sieciowej Gateway
- usuwa ani nie przepisuje pluginów/Skills

## Powiązane informacje

- [Dokumentacja CLI](/pl/cli)
- [Audyt bezpieczeństwa](/pl/gateway/security)
