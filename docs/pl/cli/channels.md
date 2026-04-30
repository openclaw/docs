---
read_when:
    - Chcesz dodawać/usuwać konta kanałów (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Chcesz sprawdzić status kanału lub śledzić logi kanału
summary: Dokumentacja referencyjna CLI dla `openclaw channels` (konta, status, logowanie/wylogowanie, logi)
title: Kanały
x-i18n:
    generated_at: "2026-04-30T09:42:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Zarządzaj kontami kanałów czatu i ich stanem działania na Gateway.

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

## Stan / możliwości / rozwiązywanie nazw / logi

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (tylko z `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` to ścieżka na żywo: na osiągalnym Gateway uruchamia dla każdego konta
kontrole `probeAccount` i opcjonalnie `auditAccount`, więc dane wyjściowe mogą obejmować stan
transportu oraz wyniki sondowania, takie jak `works`, `probe failed`, `audit ok` lub `audit failed`.
Jeśli Gateway jest nieosiągalny, `channels status` przełącza się na podsumowania oparte wyłącznie
na konfiguracji zamiast danych wyjściowych sondowania na żywo.

## Dodawanie / usuwanie kont

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` pokazuje flagi dla poszczególnych kanałów (token, klucz prywatny, token aplikacji, ścieżki signal-cli itd.).
</Tip>

Typowe nieinteraktywne powierzchnie dodawania obejmują:

- kanały z tokenem bota: `--token`, `--bot-token`, `--app-token`, `--token-file`
- pola transportu Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- pola Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- pola Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- pola Nostr: `--private-key`, `--relay-urls`
- pola Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` dla uwierzytelniania domyślnego konta opartego na zmiennych środowiskowych tam, gdzie jest obsługiwane

Jeśli Plugin kanału musi zostać zainstalowany podczas polecenia dodawania sterowanego flagami, OpenClaw używa domyślnego źródła instalacji kanału bez otwierania interaktywnego monitu instalacji Plugin.

Gdy uruchomisz `openclaw channels add` bez flag, interaktywny kreator może zapytać o:

- identyfikatory kont dla wybranego kanału
- opcjonalne nazwy wyświetlane dla tych kont
- `Bind configured channel accounts to agents now?`

Jeśli potwierdzisz przypisanie teraz, kreator zapyta, który agent ma być właścicielem każdego skonfigurowanego konta kanału, i zapisze powiązania routingu ograniczone do konta.

Możesz też zarządzać tymi samymi regułami routingu później za pomocą `openclaw agents bindings`, `openclaw agents bind` i `openclaw agents unbind` (zobacz [agenci](/pl/cli/agents)).

Gdy dodasz konto inne niż domyślne do kanału, który nadal używa ustawień najwyższego poziomu dla pojedynczego konta, OpenClaw przenosi wartości najwyższego poziomu ograniczone do konta do mapy kont kanału przed zapisaniem nowego konta. Większość kanałów zapisuje te wartości w `channels.<channel>.accounts.default`, ale dołączone kanały mogą zamiast tego zachować istniejące pasujące promowane konto. Matrix jest aktualnym przykładem: jeśli jedno nazwane konto już istnieje albo `defaultAccount` wskazuje istniejące nazwane konto, promocja zachowuje to konto zamiast tworzyć nowe `accounts.default`.

Zachowanie routingu pozostaje spójne:

- Istniejące powiązania tylko z kanałem (bez `accountId`) nadal dopasowują konto domyślne.
- `channels add` nie tworzy automatycznie ani nie przepisuje powiązań w trybie nieinteraktywnym.
- Konfiguracja interaktywna może opcjonalnie dodać powiązania ograniczone do konta.

Jeśli Twoja konfiguracja była już w stanie mieszanym (obecne nazwane konta i nadal ustawione wartości najwyższego poziomu dla pojedynczego konta), uruchom `openclaw doctor --fix`, aby przenieść wartości ograniczone do konta do promowanego konta wybranego dla tego kanału. Większość kanałów promuje do `accounts.default`; Matrix może zamiast tego zachować istniejący nazwany/domyślny cel.

## Logowanie i wylogowanie (interaktywne)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` obsługuje `--verbose`.
- `channels login` i `logout` mogą wywnioskować kanał, gdy skonfigurowano tylko jeden obsługiwany cel logowania.
- Uruchom `channels login` z terminala na hoście Gateway. Agent `exec` blokuje ten interaktywny przepływ logowania; natywne dla kanału narzędzia logowania agenta, takie jak `whatsapp_login`, powinny być używane z czatu, gdy są dostępne.

## Rozwiązywanie problemów

- Uruchom `openclaw status --deep`, aby wykonać szerokie sondowanie.
- Użyj `openclaw doctor`, aby uzyskać prowadzone poprawki.
- `openclaw channels list` wypisuje `Claude: HTTP 403 ... user:profile` → migawka użycia wymaga zakresu `user:profile`. Użyj `--no-usage`, podaj klucz sesji claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) albo uwierzytelnij ponownie przez Claude CLI.
- `openclaw channels status` przełącza się na podsumowania oparte wyłącznie na konfiguracji, gdy Gateway jest nieosiągalny. Jeśli obsługiwane poświadczenie kanału jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia, raportuje to konto jako skonfigurowane z notatkami o ograniczonej funkcjonalności, zamiast pokazywać je jako nieskonfigurowane.

## Sondowanie możliwości

Pobierz wskazówki dotyczące możliwości dostawcy (intencje/zakresy tam, gdzie są dostępne) oraz statyczną obsługę funkcji:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Uwagi:

- `--channel` jest opcjonalne; pomiń je, aby wyświetlić każdy kanał (w tym rozszerzenia).
- `--account` jest poprawne tylko z `--channel`.
- `--target` akceptuje `channel:<id>` lub surowy numeryczny identyfikator kanału i dotyczy tylko Discord.
- Sondy są specyficzne dla dostawcy: intencje Discord + opcjonalne uprawnienia kanału; zakresy bota + użytkownika Slack; flagi bota Telegram + Webhook; wersja demona Signal; token aplikacji Microsoft Teams + role/zakresy Graph (z adnotacjami tam, gdzie znane). Kanały bez sond zgłaszają `Probe: unavailable`.

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
- `channels resolve` jest tylko do odczytu. Jeśli wybrane konto jest skonfigurowane przez SecretRef, ale to poświadczenie jest niedostępne w bieżącej ścieżce polecenia, polecenie zwraca ograniczone nierozwiązane wyniki z notatkami zamiast przerywać całe uruchomienie.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Omówienie kanałów](/pl/channels)
