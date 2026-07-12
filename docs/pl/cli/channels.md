---
read_when:
    - Chcesz dodać lub usunąć konta kanałów (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp i inne)
    - Chcesz sprawdzić stan kanału lub śledzić jego dzienniki
summary: Dokumentacja CLI dla `openclaw channels` (konta, stan, możliwości, rozpoznawanie, dzienniki, logowanie/wylogowywanie)
title: Kanały
x-i18n:
    generated_at: "2026-07-12T14:57:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Zarządzaj kontami kanałów czatu i ich stanem działania w Gateway.

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
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` wyświetla tylko kanały czatu: domyślnie skonfigurowane konta wraz ze znacznikami stanu `installed`, `configured` i `enabled` dla każdego konta (`--json` zapewnia dane wyjściowe przeznaczone do przetwarzania maszynowego). Użyj `--all`, aby wyświetlić także wbudowane kanały, które nie mają jeszcze skonfigurowanego konta, oraz kanały z katalogu dostępne do zainstalowania, których nie ma jeszcze na dysku. Uwierzytelnianie dostawców i wykorzystanie modeli są obsługiwane gdzie indziej: `openclaw models auth list` służy do wyświetlania profili uwierzytelniania dostawców, a `openclaw status` lub `openclaw models list` — do sprawdzania wykorzystania i limitów.

## Stan / możliwości / rozpoznawanie / dzienniki

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (domyślnie `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (wymaga `--channel`), `--target <dest>` (wymaga `--channel`), `--timeout <ms>` (domyślnie `10000`, maksymalnie `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (domyślnie `auto`), `--json`
- `channels logs`: `--channel <name|all>` (domyślnie `all`), `--lines <n>` (domyślnie `200`), `--json`

`channels status --probe` korzysta ze ścieżki aktywnego środowiska: w osiągalnym Gateway uruchamia dla każdego konta kontrole `probeAccount` i opcjonalnie `auditAccount`, dzięki czemu dane wyjściowe mogą obejmować stan transportu oraz wyniki kontroli, takie jak `works`, `probe failed`, `audit ok` lub `audit failed`. Jeśli Gateway jest nieosiągalny, `channels status` zamiast wyników aktywnych kontroli wyświetla podsumowania oparte wyłącznie na konfiguracji.

Nie używaj `openclaw sessions`, `sessions.list` w Gateway ani narzędzia agenta `sessions_list` jako wskaźnika stanu połączenia kanału. Te mechanizmy raportują zapisane wiersze konwersacji, a nie stan działania dostawcy. Po ponownym uruchomieniu dostawcy Discord połączone, lecz nieaktywne konto może działać prawidłowo, mimo że żaden wiersz sesji Discord nie pojawi się do czasu następnego przychodzącego lub wychodzącego zdarzenia konwersacji.

## Dodawanie / usuwanie kont

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` wyświetla flagi właściwe dla poszczególnych kanałów (token, klucz prywatny, token aplikacji, ścieżki signal-cli itp.).
</Tip>

`channels remove` działa tylko na zainstalowanych lub skonfigurowanych Pluginach kanałów. W przypadku kanałów z katalogu dostępnych do zainstalowania najpierw użyj `channels add`. Bez `--delete` polecenie pyta o wyłączenie konta i zachowuje jego konfigurację; `--delete` usuwa wpisy konfiguracji bez pytania o potwierdzenie.
W przypadku Pluginów kanałów obsługiwanych przez środowisko uruchomieniowe `channels remove` przed aktualizacją konfiguracji zleca również działającemu Gateway zatrzymanie wybranego konta, dzięki czemu wyłączenie lub usunięcie konta nie pozostawia starego procesu nasłuchującego aktywnego aż do ponownego uruchomienia.

Flagi nieinteraktywnego dodawania wspólne dla kanałów: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` oraz `--use-env` (uwierzytelnianie oparte na zmiennych środowiskowych, tylko dla konta domyślnego, jeśli jest obsługiwane). Flagi właściwe dla kanałów obejmują:

| Kanał       | Flagi                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Jeśli podczas polecenia dodawania sterowanego flagami trzeba zainstalować Plugin kanału, OpenClaw używa domyślnego źródła instalacji kanału bez otwierania interaktywnego monitu instalacji Pluginu.

Po uruchomieniu `openclaw channels add` bez flag interaktywny kreator może poprosić o:

- identyfikatory kont dla każdego wybranego kanału
- opcjonalne nazwy wyświetlane tych kont
- `Route these channel accounts to agents now?`

Jeśli potwierdzisz natychmiastowe powiązanie, kreator zapyta, który agent powinien być właścicielem każdego skonfigurowanego konta kanału, i zapisze powiązania routingu ograniczone do kont.

Tymi samymi regułami routingu możesz później zarządzać również za pomocą `openclaw agents bindings`, `openclaw agents bind` i `openclaw agents unbind` (zobacz [agenci](/pl/cli/agents)).

Gdy dodajesz konto inne niż domyślne do kanału, który nadal korzysta z ustawień pojedynczego konta na najwyższym poziomie, OpenClaw przed zapisaniem nowego konta przenosi te wartości najwyższego poziomu do mapy kont kanału. Podczas przenoszenia ponownie wykorzystuje istniejące nazwane konto, jeśli kanał ma dokładnie jedno konto lub jeśli wskazuje je `defaultAccount`; w przeciwnym razie wartości trafiają do `channels.<channel>.accounts.default`.

Działanie routingu pozostaje spójne:

- Istniejące powiązania dotyczące tylko kanału (bez `accountId`) nadal odpowiadają kontu domyślnemu.
- `channels add` w trybie nieinteraktywnym nie tworzy ani nie modyfikuje automatycznie powiązań.
- Konfiguracja interaktywna może opcjonalnie dodać powiązania ograniczone do kont.

Jeśli konfiguracja była już w stanie mieszanym (istniały nazwane konta, a jednocześnie nadal były ustawione wartości pojedynczego konta na najwyższym poziomie), uruchom `openclaw doctor --fix`, aby przenieść wartości właściwe dla konta do konta wybranego do przeniesienia w danym kanale.

## Logowanie i wylogowywanie (interaktywne)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` obsługuje `--account <id>` i `--verbose`; `channels logout` obsługuje `--account <id>`.
- `channels login` i `logout` mogą ustalić kanał, gdy tylko jeden skonfigurowany kanał obsługuje daną czynność; jeśli jest ich kilka, użyj `--channel`.
- `channels logout` preferuje ścieżkę działającego Gateway, gdy jest on osiągalny, dzięki czemu wylogowanie zatrzymuje aktywny proces nasłuchujący przed wyczyszczeniem stanu uwierzytelniania kanału. Jeśli lokalny Gateway jest nieosiągalny, polecenie przechodzi do lokalnego czyszczenia uwierzytelniania; przy `gateway.mode: "remote"` błąd Gateway powoduje zamiast tego niepowodzenie polecenia.
- Po pomyślnym zalogowaniu CLI zleca osiągalnemu lokalnemu Gateway uruchomienie konta; w trybie zdalnym zapisuje uwierzytelnianie lokalnie i informuje, że zdalne środowisko uruchomieniowe nie zostało ponownie uruchomione.
- Uruchamiaj `channels login` w terminalu na hoście Gateway. `exec` agenta blokuje ten interaktywny proces logowania; w miarę dostępności do logowania z czatu należy używać natywnych dla kanału narzędzi logowania agenta, takich jak `whatsapp_login`.

## Rozwiązywanie problemów

- Uruchom `openclaw status --deep`, aby przeprowadzić szeroką kontrolę.
- Użyj `openclaw doctor`, aby skorzystać z napraw z instrukcjami.
- `openclaw channels status` wyświetla podsumowania oparte wyłącznie na konfiguracji, gdy Gateway jest nieosiągalny. Jeśli dane uwierzytelniające obsługiwanego kanału są skonfigurowane za pomocą SecretRef, lecz niedostępne w bieżącej ścieżce polecenia, konto jest raportowane jako skonfigurowane z uwagami o ograniczonym działaniu, zamiast jako nieskonfigurowane.

## Kontrola możliwości

Pobierz wskazówki dotyczące możliwości dostawcy (intencje i zakresy, jeśli są dostępne) oraz statyczną obsługę funkcji:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Uwagi:

- `--channel` jest opcjonalne; pomiń tę flagę, aby wyświetlić wszystkie kanały (w tym kanały udostępniane przez Pluginy).
- `--account` jest prawidłowe tylko z `--channel`.
- `--target` przyjmuje `channel:<id>` lub nieprzetworzony numeryczny identyfikator kanału i ma zastosowanie wyłącznie do Discord. W przypadku kanałów głosowych Discord kontrola uprawnień oznacza brakujące uprawnienia `ViewChannel`, `Connect`, `Speak`, `SendMessages` i `ReadMessageHistory`.
- Kontrole są właściwe dla dostawcy: tożsamość bota Discord, intencje i opcjonalne uprawnienia kanału; zakresy bota i użytkownika Slack; flagi bota Telegram i webhook; wersja demona Signal; token aplikacji Microsoft Teams oraz role i zakresy Graph (z adnotacjami, jeśli są znane). Kanały bez kontroli raportują `Probe: unavailable`.

## Rozpoznawanie nazw jako identyfikatorów

Rozpoznawaj nazwy kanałów i użytkowników jako identyfikatory przy użyciu katalogu dostawcy:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Uwagi:

- Użyj `--kind user|group|auto`, aby wymusić typ celu.
- Jeśli wiele wpisów ma tę samą nazwę, rozpoznawanie preferuje aktywne dopasowania.
- `channels resolve` działa tylko do odczytu. Jeśli wybrane konto jest skonfigurowane za pomocą SecretRef, lecz te dane uwierzytelniające są niedostępne w bieżącej ścieżce polecenia, polecenie zwraca ograniczone, nierozpoznane wyniki z uwagami, zamiast przerywać całe wykonanie.
- `channels resolve` nie instaluje Pluginów kanałów. Przed rozpoznawaniem nazw dla kanału z katalogu dostępnego do zainstalowania użyj `channels add --channel <name>`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Omówienie kanałów](/pl/channels)
