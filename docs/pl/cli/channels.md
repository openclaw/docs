---
read_when:
    - Chcesz dodać/usunąć konta kanałów (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Chcesz sprawdzić status kanału lub śledzić dzienniki kanału na bieżąco
summary: Dokumentacja CLI dla `openclaw channels` (konta, status, logowanie/wylogowanie, logi)
title: Kanały
x-i18n:
    generated_at: "2026-05-01T09:56:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f673a626b46cd4c8ba7eb28963d27e7e3f630dd86723332faab9b4c86553da9
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Zarządzaj kontami kanałów czatu i ich statusem uruchomieniowym w Gateway.

Powiązana dokumentacja:

- Przewodniki po kanałach: [Kanały](/pl/channels)
- Konfiguracja Gateway: [Konfiguracja](/pl/gateway/configuration)

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

`channels status --probe` to ścieżka na żywo: na osiągalnym gateway uruchamia dla każdego konta
kontrole `probeAccount` i opcjonalne `auditAccount`, więc dane wyjściowe mogą zawierać stan
transportu oraz wyniki sondowania, takie jak `works`, `probe failed`, `audit ok` lub `audit failed`.
Jeśli gateway jest nieosiągalny, `channels status` wraca do podsumowań opartych wyłącznie na konfiguracji
zamiast danych wyjściowych sondowania na żywo.

## Dodawanie / usuwanie kont

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` pokazuje flagi właściwe dla każdego kanału (token, klucz prywatny, token aplikacji, ścieżki signal-cli itd.).
</Tip>

`channels remove` działa tylko na zainstalowanych/skonfigurowanych pluginach kanałów. Dla instalowalnych kanałów z katalogu najpierw użyj `channels add`.

Typowe nieinteraktywne powierzchnie dodawania obejmują:

- kanały bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Pola transportu Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Pola Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Pola Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Pola Nostr: `--private-key`, `--relay-urls`
- Pola Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` dla uwierzytelniania domyślnego konta opartego na zmiennych środowiskowych, gdy jest obsługiwane

Jeśli plugin kanału musi zostać zainstalowany podczas polecenia dodawania sterowanego flagami, OpenClaw używa domyślnego źródła instalacji kanału bez otwierania interaktywnego monitu instalacji pluginu.

Gdy uruchomisz `openclaw channels add` bez flag, interaktywny kreator może zapytać o:

- identyfikatory kont dla wybranego kanału
- opcjonalne nazwy wyświetlane dla tych kont
- `Bind configured channel accounts to agents now?`

Jeśli potwierdzisz wiązanie teraz, kreator zapyta, który agent powinien być właścicielem każdego skonfigurowanego konta kanału, i zapisze wiązania routingu o zakresie konta.

Tymi samymi regułami routingu możesz też zarządzać później za pomocą `openclaw agents bindings`, `openclaw agents bind` i `openclaw agents unbind` (zobacz [agenci](/pl/cli/agents)).

Gdy dodajesz konto inne niż domyślne do kanału, który nadal używa jednokontowych ustawień najwyższego poziomu, OpenClaw promuje wartości najwyższego poziomu o zakresie konta do mapy kont kanału przed zapisaniem nowego konta. Większość kanałów zapisuje te wartości w `channels.<channel>.accounts.default`, ale kanały wbudowane mogą zamiast tego zachować istniejące pasujące promowane konto. Matrix jest obecnym przykładem: jeśli istnieje już jedno nazwane konto albo `defaultAccount` wskazuje istniejące nazwane konto, promocja zachowuje to konto zamiast tworzyć nowe `accounts.default`.

Zachowanie routingu pozostaje spójne:

- Istniejące wiązania tylko kanału (bez `accountId`) nadal pasują do konta domyślnego.
- `channels add` nie tworzy automatycznie ani nie przepisuje wiązań w trybie nieinteraktywnym.
- Konfiguracja interaktywna może opcjonalnie dodać wiązania o zakresie konta.

Jeśli Twoja konfiguracja była już w stanie mieszanym (nazwane konta są obecne, a jednokontowe wartości najwyższego poziomu nadal ustawione), uruchom `openclaw doctor --fix`, aby przenieść wartości o zakresie konta do promowanego konta wybranego dla tego kanału. Większość kanałów promuje do `accounts.default`; Matrix może zamiast tego zachować istniejący nazwany/domyślny cel.

## Logowanie i wylogowanie (interaktywne)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` obsługuje `--verbose`.
- `channels login` i `logout` mogą wywnioskować kanał, gdy skonfigurowany jest tylko jeden obsługiwany cel logowania.
- Uruchom `channels login` z terminala na hoście gateway. Agent `exec` blokuje ten interaktywny przepływ logowania; natywnych dla kanału narzędzi logowania agenta, takich jak `whatsapp_login`, należy używać z czatu, gdy są dostępne.

## Rozwiązywanie problemów

- Uruchom `openclaw status --deep`, aby wykonać szerokie sondowanie.
- Użyj `openclaw doctor`, aby uzyskać prowadzone poprawki.
- `openclaw channels list` wypisuje `Claude: HTTP 403 ... user:profile` → migawka użycia potrzebuje zakresu `user:profile`. Użyj `--no-usage`, podaj klucz sesji claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) albo ponownie uwierzytelnij przez Claude CLI.
- `openclaw channels status` wraca do podsumowań opartych wyłącznie na konfiguracji, gdy gateway jest nieosiągalny. Jeśli obsługiwane poświadczenie kanału jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia, konto jest raportowane jako skonfigurowane z notatkami o degradacji zamiast jako nieskonfigurowane.

## Sondowanie możliwości

Pobierz wskazówki dotyczące możliwości dostawcy (intencje/zakresy tam, gdzie są dostępne) oraz statyczną obsługę funkcji:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Uwagi:

- `--channel` jest opcjonalne; pomiń je, aby wyświetlić każdy kanał (w tym rozszerzenia).
- `--account` jest poprawne tylko z `--channel`.
- `--target` akceptuje `channel:<id>` albo surowy numeryczny identyfikator kanału i dotyczy tylko Discord.
- Sondy są specyficzne dla dostawcy: intencje Discord + opcjonalne uprawnienia kanału; zakresy bota + użytkownika Slack; flagi bota Telegram + webhook; wersja demona Signal; token aplikacji Microsoft Teams + role/zakresy Graph (z adnotacjami tam, gdzie są znane). Kanały bez sond raportują `Probe: unavailable`.

## Rozwiązywanie nazw na identyfikatory

Rozwiązuj nazwy kanałów/użytkowników na identyfikatory przy użyciu katalogu dostawcy:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Uwagi:

- Użyj `--kind user|group|auto`, aby wymusić typ celu.
- Rozwiązywanie preferuje aktywne dopasowania, gdy wiele wpisów ma tę samą nazwę.
- `channels resolve` jest tylko do odczytu. Jeśli wybrane konto jest skonfigurowane przez SecretRef, ale to poświadczenie jest niedostępne w bieżącej ścieżce polecenia, polecenie zwraca zdegradowane nierozwiązane wyniki z notatkami zamiast przerywać całe uruchomienie.
- `channels resolve` nie instaluje pluginów kanałów. Użyj `channels add --channel <name>` przed rozwiązywaniem nazw dla instalowalnego kanału z katalogu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Przegląd kanałów](/pl/channels)
