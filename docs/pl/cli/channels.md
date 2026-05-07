---
read_when:
    - Chcesz dodać/usunąć konta kanałów (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Chcesz sprawdzić stan kanału lub śledzić dzienniki kanału
summary: Dokumentacja referencyjna CLI dla `openclaw channels` (konta, status, logowanie/wylogowanie, logi)
title: Kanały
x-i18n:
    generated_at: "2026-05-07T13:13:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
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
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` pokazuje tylko kanały czatu: domyślnie skonfigurowane konta, ze znacznikami statusu `installed`, `configured` i `enabled` dla każdego konta. Przekaż `--all`, aby wyświetlić także dołączone kanały, które nie mają jeszcze skonfigurowanego konta, oraz kanały z katalogu możliwe do zainstalowania, których nie ma jeszcze na dysku. Dostawcy uwierzytelniania (OAuth + klucze API) oraz migawki użycia/limitów dostawców modeli nie są już tutaj drukowane; użyj `openclaw models auth list` dla profili uwierzytelniania dostawców oraz `openclaw status` albo `openclaw models list` dla użycia.

## Status / możliwości / rozwiązywanie / logi

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (tylko z `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` to ścieżka działająca na żywo: na osiągalnym Gateway uruchamia dla każdego konta kontrole
`probeAccount` i opcjonalnie `auditAccount`, więc wynik może zawierać stan transportu
oraz wyniki sondowania, takie jak `works`, `probe failed`, `audit ok` albo `audit failed`.
Jeśli Gateway jest nieosiągalny, `channels status` wraca do podsumowań opartych tylko na konfiguracji
zamiast wyniku sondowania na żywo.

Nie używaj `openclaw sessions`, Gateway `sessions.list` ani narzędzia agenta
`sessions_list` jako sygnału kondycji gniazda kanału. Te powierzchnie raportują
zapisane wiersze konwersacji, a nie stan uruchomieniowy dostawcy. Po restarcie dostawcy Discord
podłączone, ale ciche konto może być zdrowe, mimo że żaden wiersz sesji Discord
nie pojawi się aż do następnego zdarzenia konwersacji przychodzącej lub wychodzącej.

## Dodawanie / usuwanie kont

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` pokazuje flagi dla poszczególnych kanałów (token, klucz prywatny, token aplikacji, ścieżki signal-cli itd.).
</Tip>

`channels remove` działa tylko na zainstalowanych/skonfigurowanych Pluginach kanałów. Najpierw użyj `channels add` dla kanałów z katalogu możliwych do zainstalowania.
W przypadku Pluginów kanałów wspieranych uruchomieniowo `channels remove` prosi także działający Gateway o zatrzymanie wybranego konta przed aktualizacją konfiguracji, więc wyłączenie lub usunięcie konta nie pozostawia starego nasłuchiwacza aktywnego aż do restartu.

Typowe nieinteraktywne powierzchnie dodawania obejmują:

- kanały z tokenem bota: `--token`, `--bot-token`, `--app-token`, `--token-file`
- pola transportu Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- pola Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- pola Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- pola Nostr: `--private-key`, `--relay-urls`
- pola Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` dla domyślnych kont z uwierzytelnianiem opartym na zmiennych środowiskowych, tam gdzie jest obsługiwane

Jeśli Plugin kanału musi zostać zainstalowany podczas polecenia dodawania sterowanego flagami, OpenClaw używa domyślnego źródła instalacji kanału bez otwierania interaktywnego monitu instalacji Pluginu.

Gdy uruchamiasz `openclaw channels add` bez flag, interaktywny kreator może zapytać o:

- identyfikatory kont dla wybranego kanału
- opcjonalne nazwy wyświetlane dla tych kont
- `Bind configured channel accounts to agents now?`

Jeśli potwierdzisz powiązanie teraz, kreator zapyta, który agent ma być właścicielem każdego skonfigurowanego konta kanału, i zapisze powiązania routingu o zakresie konta.

Tymi samymi regułami routingu możesz także zarządzać później za pomocą `openclaw agents bindings`, `openclaw agents bind` i `openclaw agents unbind` (zobacz [agenci](/pl/cli/agents)).

Gdy dodajesz konto inne niż domyślne do kanału, który nadal używa ustawień najwyższego poziomu dla pojedynczego konta, OpenClaw promuje wartości najwyższego poziomu o zakresie konta do mapy kont kanału przed zapisaniem nowego konta. Większość kanałów umieszcza te wartości w `channels.<channel>.accounts.default`, ale dołączone kanały mogą zamiast tego zachować istniejące pasujące promowane konto. Matrix jest obecnym przykładem: jeśli istnieje już jedno nazwane konto albo `defaultAccount` wskazuje istniejące nazwane konto, promocja zachowuje to konto zamiast tworzyć nowe `accounts.default`.

Zachowanie routingu pozostaje spójne:

- Istniejące powiązania tylko dla kanału (bez `accountId`) nadal dopasowują konto domyślne.
- `channels add` nie tworzy automatycznie ani nie przepisuje powiązań w trybie nieinteraktywnym.
- Interaktywna konfiguracja może opcjonalnie dodać powiązania o zakresie konta.

Jeśli Twoja konfiguracja była już w stanie mieszanym (obecne nazwane konta i nadal ustawione wartości najwyższego poziomu dla pojedynczego konta), uruchom `openclaw doctor --fix`, aby przenieść wartości o zakresie konta do promowanego konta wybranego dla tego kanału. Większość kanałów promuje do `accounts.default`; Matrix może zamiast tego zachować istniejący nazwany/domyślny cel.

## Logowanie i wylogowanie (interaktywne)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` obsługuje `--verbose`.
- `channels login` i `logout` mogą wywnioskować kanał, gdy skonfigurowany jest tylko jeden obsługiwany cel logowania.
- `channels logout` preferuje ścieżkę działającego Gateway, gdy jest osiągalna, więc wylogowanie zatrzymuje każdy aktywny nasłuchiwacz przed wyczyszczeniem stanu uwierzytelniania kanału. Jeśli lokalny Gateway nie jest osiągalny, wraca do lokalnego czyszczenia uwierzytelniania.
- Uruchamiaj `channels login` z terminala na hoście gateway. Agent `exec` blokuje ten interaktywny przepływ logowania; natywne dla kanału narzędzia logowania agenta, takie jak `whatsapp_login`, powinny być używane z czatu, gdy są dostępne.

## Rozwiązywanie problemów

- Uruchom `openclaw status --deep`, aby wykonać szerokie sondowanie.
- Użyj `openclaw doctor` do prowadzonych napraw.
- `openclaw channels list` nie drukuje już migawek użycia/limitów dostawców modeli. Do tego użyj `openclaw status` (przegląd) albo `openclaw models list` (dla każdego dostawcy).
- `openclaw channels status` wraca do podsumowań opartych tylko na konfiguracji, gdy gateway jest nieosiągalny. Jeśli obsługiwane poświadczenie kanału jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia, raportuje to konto jako skonfigurowane z notatkami o ograniczonym działaniu zamiast pokazywać je jako nieskonfigurowane.

## Sondowanie możliwości

Pobierz wskazówki dotyczące możliwości dostawcy (intencje/zakresy, gdy są dostępne) oraz statyczną obsługę funkcji:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Uwagi:

- `--channel` jest opcjonalne; pomiń je, aby wyświetlić każdy kanał (w tym rozszerzenia).
- `--account` jest prawidłowe tylko z `--channel`.
- `--target` przyjmuje `channel:<id>` albo surowy numeryczny identyfikator kanału i dotyczy tylko Discord. Dla kanałów głosowych Discord kontrola uprawnień flaguje brakujące `ViewChannel`, `Connect`, `Speak`, `SendMessages` i `ReadMessageHistory`.
- Sondowania są specyficzne dla dostawcy: intencje Discord + opcjonalne uprawnienia kanału; zakresy bota + użytkownika Slack; flagi bota Telegram + Webhook; wersja demona Signal; token aplikacji Microsoft Teams + role/zakresy Graph (opatrzone adnotacją tam, gdzie są znane). Kanały bez sondowań raportują `Probe: unavailable`.

## Rozwiązywanie nazw do identyfikatorów

Rozwiązuj nazwy kanałów/użytkowników do identyfikatorów przy użyciu katalogu dostawcy:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Uwagi:

- Użyj `--kind user|group|auto`, aby wymusić typ celu.
- Rozwiązywanie preferuje aktywne dopasowania, gdy wiele wpisów ma tę samą nazwę.
- `channels resolve` jest tylko do odczytu. Jeśli wybrane konto jest skonfigurowane przez SecretRef, ale to poświadczenie jest niedostępne w bieżącej ścieżce polecenia, polecenie zwraca wyniki nierozwiązane z ograniczonym działaniem i notatkami zamiast przerywać całe uruchomienie.
- `channels resolve` nie instaluje Pluginów kanałów. Użyj `channels add --channel <name>` przed rozwiązywaniem nazw dla kanału z katalogu możliwego do zainstalowania.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Przegląd kanałów](/pl/channels)
