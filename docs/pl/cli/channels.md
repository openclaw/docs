---
read_when:
    - Chcesz dodawać/usuwać konta kanałów (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Chcesz sprawdzić stan kanału lub śledzić logi kanału
summary: Dokumentacja referencyjna CLI dla `openclaw channels` (`accounts`, `status`, `login`/`logout`, `logs`)
title: Kanały
x-i18n:
    generated_at: "2026-04-24T09:01:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Zarządzanie kontami kanałów czatu i ich stanem w czasie działania w Gateway.

Powiązana dokumentacja:

- Przewodniki po kanałach: [Channels](/pl/channels/index)
- Konfiguracja Gateway: [Configuration](/pl/gateway/configuration)

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

`channels status --probe` to ścieżka na żywo: na osiągalnym Gateway uruchamia per konto
kontrole `probeAccount` i opcjonalne `auditAccount`, więc dane wyjściowe mogą zawierać stan
transportu oraz wyniki sondowania, takie jak `works`, `probe failed`, `audit ok` lub `audit failed`.
Jeśli Gateway jest nieosiągalny, `channels status` wraca do podsumowań opartych tylko na konfiguracji
zamiast wyników sondowania na żywo.

## Dodawanie / usuwanie kont

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Wskazówka: `openclaw channels add --help` pokazuje flagi specyficzne dla kanału (token, klucz prywatny, token aplikacji, ścieżki `signal-cli` itd.).

Typowe nieinteraktywne powierzchnie dodawania obejmują:

- kanały z tokenem bota: `--token`, `--bot-token`, `--app-token`, `--token-file`
- pola transportu Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- pola Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- pola Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- pola Nostr: `--private-key`, `--relay-urls`
- pola Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` dla uwierzytelniania domyślnego konta opartego na env tam, gdzie jest obsługiwane

Gdy uruchamiasz `openclaw channels add` bez flag, interaktywny kreator może zapytać o:

- identyfikatory kont dla każdego wybranego kanału
- opcjonalne nazwy wyświetlane tych kont
- `Bind configured channel accounts to agents now?`

Jeśli potwierdzisz natychmiastowe powiązanie, kreator zapyta, który agent ma obsługiwać każde skonfigurowane konto kanału, i zapisze powiązania routingu ograniczone do konta.

Tymi samymi regułami routingu możesz też zarządzać później za pomocą `openclaw agents bindings`, `openclaw agents bind` i `openclaw agents unbind` (zobacz [agents](/pl/cli/agents)).

Gdy dodajesz niedomyślne konto do kanału, który nadal używa ustawień najwyższego poziomu dla pojedynczego konta, OpenClaw promuje wartości najwyższego poziomu ograniczone do konta do mapy kont kanału przed zapisaniem nowego konta. Większość kanałów zapisuje te wartości w `channels.<channel>.accounts.default`, ale dołączone kanały mogą zamiast tego zachować istniejące pasujące promowane konto. Matrix jest obecnie takim przykładem: jeśli istnieje już jedno nazwane konto albo `defaultAccount` wskazuje istniejące nazwane konto, promocja zachowuje to konto zamiast tworzyć nowe `accounts.default`.

Zachowanie routingu pozostaje spójne:

- Istniejące powiązania tylko kanałowe (bez `accountId`) nadal pasują do konta domyślnego.
- `channels add` nie tworzy ani nie przepisuje automatycznie powiązań w trybie nieinteraktywnym.
- Interaktywna konfiguracja może opcjonalnie dodać powiązania ograniczone do konta.

Jeśli Twoja konfiguracja była już w stanie mieszanym (obecne nazwane konta i nadal ustawione wartości najwyższego poziomu dla pojedynczego konta), uruchom `openclaw doctor --fix`, aby przenieść wartości ograniczone do konta do promowanego konta wybranego dla tego kanału. Większość kanałów promuje do `accounts.default`; Matrix może zachować istniejący nazwany/domysłny cel.

## Login / logout (interaktywne)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Uwagi:

- `channels login` obsługuje `--verbose`.
- `channels login` / `logout` mogą wywnioskować kanał, gdy skonfigurowano tylko jeden obsługiwany cel logowania.

## Rozwiązywanie problemów

- Uruchom `openclaw status --deep`, aby wykonać szerokie sondowanie.
- Użyj `openclaw doctor` do napraw prowadzonych krok po kroku.
- `openclaw channels list` wyświetla `Claude: HTTP 403 ... user:profile` → migawka użycia wymaga zakresu `user:profile`. Użyj `--no-usage`, albo podaj klucz sesji `claude.ai` (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), albo ponownie uwierzytelnij się przez Claude CLI.
- `openclaw channels status` wraca do podsumowań opartych tylko na konfiguracji, gdy Gateway jest nieosiągalny. Jeśli poświadczenie obsługiwanego kanału jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia, raportuje to konto jako skonfigurowane z obniżoną funkcjonalnością zamiast pokazywać je jako nieskonfigurowane.

## Sondowanie capabilities

Pobierz wskazówki o możliwościach dostawcy (intenty/zakresy, jeśli są dostępne) oraz statyczną obsługę funkcji:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Uwagi:

- `--channel` jest opcjonalne; pomiń je, aby wyświetlić każdy kanał (w tym rozszerzenia).
- `--account` jest prawidłowe tylko z `--channel`.
- `--target` akceptuje `channel:<id>` lub surowy numeryczny identyfikator kanału i ma zastosowanie tylko do Discord.
- Sondowania są specyficzne dla dostawcy: intenty Discord + opcjonalne uprawnienia kanału; zakresy bota + użytkownika Slack; flagi bota Telegram + Webhook; wersja demona Signal; token aplikacji Microsoft Teams + role/zakresy Graph (z adnotacjami tam, gdzie znane). Kanały bez sondowań zgłaszają `Probe: unavailable`.

## Rozwiązywanie nazw do identyfikatorów

Rozwiązuj nazwy kanałów/użytkowników do identyfikatorów za pomocą katalogu dostawcy:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Uwagi:

- Użyj `--kind user|group|auto`, aby wymusić typ celu.
- Rozwiązywanie preferuje aktywne dopasowania, gdy wiele wpisów współdzieli tę samą nazwę.
- `channels resolve` działa tylko do odczytu. Jeśli wybrane konto jest skonfigurowane przez SecretRef, ale to poświadczenie jest niedostępne w bieżącej ścieżce polecenia, polecenie zwraca wyniki nierozwiązane z obniżoną funkcjonalnością wraz z uwagami zamiast przerywać całe wykonanie.

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Przegląd kanałów](/pl/channels)
