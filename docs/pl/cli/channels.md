---
read_when:
    - Chcesz dodać/usunąć konta kanałów (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Chcesz sprawdzić stan kanału lub śledzić dzienniki kanału na bieżąco
summary: Dokumentacja referencyjna CLI dla `openclaw channels` (konta, status, logowanie/wylogowanie, dzienniki)
title: Kanały
x-i18n:
    generated_at: "2026-05-02T09:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Zarządzaj kontami kanałów czatu i ich stanem runtime w Gateway.

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

## Stan / możliwości / rozwiązywanie / logi

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (tylko z `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` to ścieżka live: na osiągalnym gatewayu uruchamia dla każdego konta
sprawdzenia `probeAccount` i opcjonalne `auditAccount`, więc dane wyjściowe mogą obejmować stan
transportu oraz wyniki sondowania, takie jak `works`, `probe failed`, `audit ok` lub `audit failed`.
Jeśli gateway jest nieosiągalny, `channels status` wraca do podsumowań opartych wyłącznie na konfiguracji
zamiast danych wyjściowych sondowania live.

Nie używaj `openclaw sessions`, Gateway `sessions.list` ani narzędzia agenta
`sessions_list` jako sygnału kondycji socketu kanału. Te powierzchnie zgłaszają
zapisane wiersze rozmów, a nie stan runtime providera. Po ponownym uruchomieniu providera Discord
połączone, ale ciche konto może być zdrowe, mimo że żaden wiersz sesji Discord
nie pojawi się do następnego przychodzącego lub wychodzącego zdarzenia rozmowy.

## Dodawanie / usuwanie kont

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` pokazuje flagi dla poszczególnych kanałów (token, klucz prywatny, token aplikacji, ścieżki signal-cli itd.).
</Tip>

`channels remove` działa tylko na zainstalowanych/skonfigurowanych pluginach kanałów. Użyj najpierw `channels add` dla instalowalnych kanałów z katalogu.
W przypadku pluginów kanałów wspieranych przez runtime `channels remove` prosi też działający Gateway o zatrzymanie wybranego konta przed aktualizacją konfiguracji, więc wyłączenie lub usunięcie konta nie pozostawia starego listenera aktywnego do ponownego uruchomienia.

Typowe nieinteraktywne powierzchnie dodawania obejmują:

- kanały bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- pola transportu Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- pola Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- pola Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- pola Nostr: `--private-key`, `--relay-urls`
- pola Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` dla uwierzytelniania domyślnego konta wspieranego przez zmienne środowiskowe tam, gdzie jest obsługiwane

Jeśli plugin kanału musi zostać zainstalowany podczas polecenia dodawania sterowanego flagami, OpenClaw używa domyślnego źródła instalacji kanału bez otwierania interaktywnego promptu instalacji pluginu.

Gdy uruchomisz `openclaw channels add` bez flag, interaktywny kreator może poprosić o:

- identyfikatory kont dla każdego wybranego kanału
- opcjonalne nazwy wyświetlane tych kont
- `Bind configured channel accounts to agents now?`

Jeśli potwierdzisz powiązanie teraz, kreator zapyta, który agent powinien posiadać każde skonfigurowane konto kanału, i zapisze powiązania routingu o zakresie konta.

Tymi samymi regułami routingu możesz też zarządzać później za pomocą `openclaw agents bindings`, `openclaw agents bind` i `openclaw agents unbind` (zobacz [agenci](/pl/cli/agents)).

Gdy dodajesz konto inne niż domyślne do kanału, który nadal używa ustawień najwyższego poziomu dla pojedynczego konta, OpenClaw promuje wartości najwyższego poziomu o zakresie konta do mapy kont kanału przed zapisaniem nowego konta. Większość kanałów umieszcza te wartości w `channels.<channel>.accounts.default`, ale kanały wbudowane mogą zamiast tego zachować istniejące pasujące promowane konto. Matrix jest aktualnym przykładem: jeśli istnieje już jedno nazwane konto albo `defaultAccount` wskazuje istniejące nazwane konto, promocja zachowuje to konto zamiast tworzyć nowe `accounts.default`.

Zachowanie routingu pozostaje spójne:

- Istniejące powiązania obejmujące tylko kanał (bez `accountId`) nadal pasują do konta domyślnego.
- `channels add` nie tworzy automatycznie ani nie przepisuje powiązań w trybie nieinteraktywnym.
- Konfiguracja interaktywna może opcjonalnie dodać powiązania o zakresie konta.

Jeśli Twoja konfiguracja była już w stanie mieszanym (obecne nazwane konta i nadal ustawione wartości najwyższego poziomu dla pojedynczego konta), uruchom `openclaw doctor --fix`, aby przenieść wartości o zakresie konta do promowanego konta wybranego dla tego kanału. Większość kanałów promuje do `accounts.default`; Matrix może zamiast tego zachować istniejący nazwany/domyślny cel.

## Logowanie i wylogowanie (interaktywne)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` obsługuje `--verbose`.
- `channels login` i `logout` mogą wywnioskować kanał, gdy skonfigurowany jest tylko jeden obsługiwany cel logowania.
- `channels logout` preferuje ścieżkę live Gateway, gdy jest osiągalna, więc wylogowanie zatrzymuje każdy aktywny listener przed wyczyszczeniem stanu uwierzytelniania kanału. Jeśli lokalny Gateway nie jest osiągalny, wraca do lokalnego czyszczenia uwierzytelniania.
- Uruchamiaj `channels login` z terminala na hoście gatewaya. Agent `exec` blokuje ten interaktywny przepływ logowania; natywne dla kanału narzędzia logowania agenta, takie jak `whatsapp_login`, powinny być używane z czatu, gdy są dostępne.

## Rozwiązywanie problemów

- Uruchom `openclaw status --deep`, aby wykonać szerokie sondowanie.
- Użyj `openclaw doctor` do prowadzonych napraw.
- `openclaw channels list` wypisuje `Claude: HTTP 403 ... user:profile` → migawka użycia wymaga zakresu `user:profile`. Użyj `--no-usage`, podaj klucz sesji claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) albo uwierzytelnij się ponownie przez Claude CLI.
- `openclaw channels status` wraca do podsumowań opartych wyłącznie na konfiguracji, gdy gateway jest nieosiągalny. Jeśli poświadczenie obsługiwanego kanału jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia, zgłasza to konto jako skonfigurowane z notatkami o degradacji zamiast pokazywać je jako nieskonfigurowane.

## Sondowanie możliwości

Pobierz wskazówki dotyczące możliwości providera (intenty/zakresy tam, gdzie są dostępne) oraz statyczną obsługę funkcji:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Uwagi:

- `--channel` jest opcjonalne; pomiń je, aby wyświetlić każdy kanał (w tym rozszerzenia).
- `--account` jest poprawne tylko z `--channel`.
- `--target` akceptuje `channel:<id>` albo surowy numeryczny identyfikator kanału i dotyczy tylko Discord.
- Sondowania są specyficzne dla providera: intenty Discord + opcjonalne uprawnienia kanału; zakresy bota + użytkownika Slack; flagi bota Telegram + Webhook; wersja daemona Signal; token aplikacji Microsoft Teams + role/zakresy Graph (oznaczone tam, gdzie są znane). Kanały bez sondowań zgłaszają `Probe: unavailable`.

## Rozwiązywanie nazw na identyfikatory

Rozwiązuj nazwy kanałów/użytkowników na identyfikatory za pomocą katalogu providera:

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

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Omówienie kanałów](/pl/channels)
