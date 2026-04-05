---
read_when:
    - Chcesz dodać/usunąć konta kanałów (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Chcesz sprawdzić status kanału lub śledzić logi kanału
summary: Dokumentacja CLI dla `openclaw channels` (konta, status, logowanie/wylogowanie, logi)
title: channels
x-i18n:
    generated_at: "2026-04-05T13:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Zarządzaj kontami kanałów czatu i ich statusem działania na Gateway.

Powiązana dokumentacja:

- Przewodniki po kanałach: [Channels](/pl/channels/index)
- Konfiguracja Gateway: [Configuration](/gateway/configuration)

## Typowe polecenia

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capabilities / resolve / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (tylko z `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` to ścieżka na żywo: przy osiągalnym Gateway uruchamia dla każdego konta
kontrole `probeAccount` oraz opcjonalne `auditAccount`, więc dane wyjściowe mogą obejmować stan
transportu oraz wyniki sond, takie jak `works`, `probe failed`, `audit ok` lub `audit failed`.
Jeśli Gateway jest nieosiągalny, `channels status` przechodzi do podsumowań opartych wyłącznie na konfiguracji
zamiast danych z aktywnej sondy.

## Dodawanie / usuwanie kont

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Wskazówka: `openclaw channels add --help` pokazuje flagi specyficzne dla kanału (token, klucz prywatny, app token, ścieżki signal-cli itd.).

Typowe powierzchnie dodawania nieinteraktywnego obejmują:

- kanały z tokenem bota: `--token`, `--bot-token`, `--app-token`, `--token-file`
- pola transportu Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- pola Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- pola Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- pola Nostr: `--private-key`, `--relay-urls`
- pola Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` dla uwierzytelniania domyślnego konta opartego na zmiennych środowiskowych, jeśli jest obsługiwane

Gdy uruchamiasz `openclaw channels add` bez flag, interaktywny kreator może zapytać o:

- identyfikatory kont dla wybranego kanału
- opcjonalne nazwy wyświetlane dla tych kont
- `Bind configured channel accounts to agents now?`

Jeśli potwierdzisz powiązanie teraz, kreator zapyta, który agent ma być właścicielem każdego skonfigurowanego konta kanału, i zapisze powiązania routingu w zakresie konta.

Tymi samymi regułami routingu możesz zarządzać później za pomocą `openclaw agents bindings`, `openclaw agents bind` i `openclaw agents unbind` (zobacz [agents](/cli/agents)).

Gdy dodajesz niedomyślne konto do kanału, który nadal używa ustawień najwyższego poziomu dla pojedynczego konta, OpenClaw promuje wartości najwyższego poziomu o zakresie konta do mapy kont tego kanału przed zapisaniem nowego konta. Większość kanałów zapisuje te wartości w `channels.<channel>.accounts.default`, ale dołączone kanały mogą zamiast tego zachować istniejące dopasowane promowane konto. Aktualnym przykładem jest Matrix: jeśli istnieje już jedno nazwane konto albo `defaultAccount` wskazuje na istniejące nazwane konto, promocja zachowuje to konto zamiast tworzyć nowe `accounts.default`.

Zachowanie routingu pozostaje spójne:

- Istniejące powiązania tylko kanałowe (bez `accountId`) nadal pasują do konta domyślnego.
- `channels add` nie tworzy automatycznie ani nie przepisuje powiązań w trybie nieinteraktywnym.
- Konfiguracja interaktywna może opcjonalnie dodać powiązania w zakresie konta.

Jeśli Twoja konfiguracja była już w stanie mieszanym (obecne nazwane konta i nadal ustawione wartości najwyższego poziomu dla pojedynczego konta), uruchom `openclaw doctor --fix`, aby przenieść wartości o zakresie konta do promowanego konta wybranego dla tego kanału. Większość kanałów promuje do `accounts.default`; Matrix może zachować istniejący nazwany/domyslny cel zamiast tego.

## Logowanie / wylogowanie (interaktywne)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Uwagi:

- `channels login` obsługuje `--verbose`.
- `channels login` / `logout` może wywnioskować kanał, gdy skonfigurowano tylko jeden obsługiwany cel logowania.

## Rozwiązywanie problemów

- Uruchom `openclaw status --deep`, aby wykonać szeroką sondę.
- Użyj `openclaw doctor`, aby skorzystać z prowadzonych napraw.
- `openclaw channels list` wyświetla `Claude: HTTP 403 ... user:profile` → migawka użycia wymaga zakresu `user:profile`. Użyj `--no-usage`, albo podaj klucz sesji claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), albo uwierzytelnij się ponownie przez Claude CLI.
- `openclaw channels status` przechodzi do podsumowań opartych wyłącznie na konfiguracji, gdy Gateway jest nieosiągalny. Jeśli poświadczenie obsługiwanego kanału jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia, zgłasza to konto jako skonfigurowane z notatkami o obniżonej funkcjonalności zamiast pokazywać je jako nieskonfigurowane.

## Sonda capabilities

Pobierz wskazówki dotyczące możliwości dostawcy (intents/scopes, jeśli są dostępne) oraz statyczną obsługę funkcji:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Uwagi:

- `--channel` jest opcjonalne; pomiń je, aby wyświetlić każdy kanał (w tym rozszerzenia).
- `--account` jest prawidłowe tylko z `--channel`.
- `--target` akceptuje `channel:<id>` lub surowy numeryczny identyfikator kanału i dotyczy tylko Discord.
- Sondy są specyficzne dla dostawcy: Discord intents + opcjonalne uprawnienia kanału; zakresy bota i użytkownika Slack; flagi bota Telegram i webhook; wersja demona Signal; app token + role/zakresy Graph Microsoft Teams (oznaczone tam, gdzie są znane). Kanały bez sond zgłaszają `Probe: unavailable`.

## Rozwiązywanie nazw do identyfikatorów

Rozwiązuj nazwy kanałów/użytkowników do identyfikatorów za pomocą katalogu dostawcy:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Uwagi:

- Użyj `--kind user|group|auto`, aby wymusić typ celu.
- Rozwiązywanie preferuje aktywne dopasowania, gdy wiele wpisów ma tę samą nazwę.
- `channels resolve` jest tylko do odczytu. Jeśli wybrane konto jest skonfigurowane przez SecretRef, ale to poświadczenie jest niedostępne w bieżącej ścieżce polecenia, polecenie zwraca nierozwiązane wyniki o obniżonej funkcjonalności z notatkami zamiast przerywać całe wykonanie.
