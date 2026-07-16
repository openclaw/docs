---
read_when:
    - Łączenie OpenClaw z obszarem roboczym ClickClack
    - Testowanie tożsamości botów ClickClack
summary: Konfiguracja kanału ClickClack z tokenem bota i składnia celu
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T17:57:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack łączy OpenClaw z samodzielnie hostowanym obszarem roboczym ClickClack za pomocą natywnie obsługiwanych tokenów botów ClickClack.

Należy użyć tej opcji, aby agent OpenClaw występował jako użytkownik-bot ClickClack. ClickClack obsługuje niezależne boty usługowe i boty należące do użytkowników; boty należące do użytkowników zachowują `owner_user_id` i otrzymują wyłącznie przyznane im zakresy tokenu.

## Szybka konfiguracja

W ClickClack otwórz **Workspace settings → Integrations → OpenClaw**, utwórz
bota i skopiuj jego token. Następnie skonfiguruj kanał:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` akceptuje identyfikator obszaru roboczego (`wsp_...`), slug lub nazwę wyświetlaną.
`channels add` po zapisaniu weryfikuje serwer, token i obszar roboczy, a następnie
informuje, czy działający Gateway wykrył nowe konto. Jeśli OpenClaw już
działa, ClickClack połączy się automatycznie i nie trzeba wykonywać drugiego
polecenia. W przeciwnym razie uruchom go za pomocą:

```bash
openclaw gateway
```

Aby skorzystać z konfiguracji z przewodnikiem, uruchom:

```bash
openclaw onboard
```

Wybierz ClickClack, a następnie po wyświetleniu monitów wprowadź adres URL serwera, token bota i obszar roboczy.
Konfiguracja z przewodnikiem sprawdza serwer, token i obszar roboczy po zapisaniu;
nieudane sprawdzenie nie usuwa konfiguracji.

### Alternatywa: token ze zmiennej środowiskowej

Konto domyślne może odczytywać `CLICKCLACK_BOT_TOKEN` zamiast przechowywać token
w konfiguracji:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Nazwane konta muszą używać skonfigurowanego tokenu lub pliku tokenu; współdzielona
zmienna środowiskowa jest celowo ograniczona do konta domyślnego.

### Dokumentacja referencyjna JSON5

Równoważna struktura konfiguracji wygląda następująco:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Konto jest uznawane za skonfigurowane tylko wtedy, gdy ustawiono `baseUrl`, źródło tokenu oraz
`workspace`. Źródłem tokenu może być `token`, `tokenFile` lub
`CLICKCLACK_BOT_TOKEN` w przypadku konta domyślnego. `workspace` akceptuje identyfikator obszaru roboczego
(`wsp_...`), slug lub nazwę; podczas uruchamiania Gateway przekształca tę wartość na identyfikator.

### Klucze konfiguracji konta

| Klucz                   | Wartość domyślna   | Uwagi                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | brak (wymagane)     | Adres URL serwera ClickClack.                                                           |
| `token`                 | brak                | Token bota jako zwykły ciąg znaków lub odwołanie do sekretu (`source: "env" \| "file" \| "exec"`).       |
| `tokenFile`             | brak                | Ścieżka do pliku tokenu bota; ma pierwszeństwo przed `token`.                           |
| `workspace`             | brak (wymagane)     | Identyfikator, slug lub nazwa obszaru roboczego.                                        |
| `replyMode`             | `"agent"`           | `"agent"` uruchamia pełny potok agenta; `"model"` wysyła krótkie, bezpośrednie uzupełnienia modelu. |
| `defaultTo`             | `"channel:general"` | Cel używany, gdy ścieżka wychodząca nie określa celu.                                   |
| `allowFrom`             | `["*"]`             | Lista dozwolonych identyfikatorów użytkowników dla przychodzących wiadomości prywatnych i wiadomości kanału. |
| `botUserId`             | wykrywane automatycznie | Ustalane na podstawie tożsamości tokenu bota podczas uruchamiania.                   |
| `agentId`               | domyślna trasa      | Przypina wiadomości przychodzące tego konta do jednego agenta.                          |
| `toolsAllow`            | brak                | Lista narzędzi dozwolonych w odpowiedziach agenta z tego konta.                         |
| `model`, `systemPrompt` | brak                | Używane przez uzupełnienia `replyMode: "model"`.                                       |
| `commandMenu`           | `true`              | Publikuje natywne polecenia w autouzupełnianiu edytora ClickClack.                      |
| `reconnectMs`           | `1500`              | Opóźnienie ponownego połączenia w czasie rzeczywistym (100 do 60000).                   |

Jeśli `plugins.allow` jest niepustą listą ograniczającą, jawne wybranie
ClickClack podczas konfiguracji kanału lub uruchomienie `openclaw plugins enable clickclack`
dodaje `clickclack` do tej listy. Instalacja podczas wdrażania używa tego samego
mechanizmu jawnego wyboru. Te ścieżki nie zastępują ustawienia `plugins.deny` ani
globalnego ustawienia `plugins.enabled: false`. Bezpośrednie
`openclaw plugins install @openclaw/clickclack` podlega standardowej
polityce instalowania pluginów i również zapisuje ClickClack na istniejącej liście dozwolonych.

## Wiele botów

Każde konto otwiera własne połączenie ClickClack w czasie rzeczywistym i używa własnego tokenu bota.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Tryby odpowiedzi

- `replyMode: "agent"` (domyślnie) przekazuje wiadomości przychodzące przez standardowy potok agenta, w tym rejestrowanie sesji i politykę narzędzi.
- `replyMode: "model"` pomija potok agenta i używa `llm.complete` środowiska uruchomieniowego pluginu do bezpośrednich odpowiedzi bota, opcjonalnie kształtowanych przez `model` i `systemPrompt`. Wybrany dostawca i model określają budżet uzupełnienia.

Tryb modelu uruchamia uzupełnienia względem ustalonego identyfikatora agenta bota, co wymaga
jawnego bitu zaufania `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Jeśli używany jest tylko domyślny tryb odpowiedzi `agent`, bit zaufania powinien pozostać wyłączony;
nie jest on wówczas potrzebny.

## Menu poleceń

Podczas uruchamiania Gateway każde skonfigurowane konto publikuje natywne
polecenia OpenClaw w ClickClack. Pojawiają się one w autouzupełnianiu edytora z etykietą
uchwytu bota. Opublikowany zestaw jest zastępowany w całości przy każdym uruchomieniu,
w tym przez wyczyszczenie nieaktualnego menu, gdy katalog natywnych poleceń jest pusty.

Synchronizacja menu poleceń jest domyślnie włączona. Aby z niej zrezygnować, ustaw `commandMenu: false` na koncie:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

Token wymaga `commands:write`. Obecne pakiety ClickClack `bot:write` i
`bot:admin` obejmują ten zakres, który można również przyznać
indywidualnie. Tokeny utworzone przed wprowadzeniem menu poleceń mogą wymagać
dodania zakresu lub zastąpienia tokenu.

Synchronizacja odbywa się w miarę możliwości i jest uruchamiana raz przy każdym starcie Gateway. Brakujący zakres lub awaria
sieci powoduje zapisanie ostrzeżenia; starszy serwer ClickClack bez tego punktu końcowego zapisuje komunikat
na poziomie debugowania. Żadna z tych awarii nie blokuje uruchamiania połączenia w czasie rzeczywistym. Menu pozostają
dostępne, gdy agent jest offline, i są usuwane, gdy bot opuszcza
obszar roboczy.

To wydanie publikuje wyłącznie natywne specyfikacje poleceń. Aliasy oraz
katalogi umiejętności, pluginów i poleceń niestandardowych nie są dodawane do menu. Jeśli
nazwa jest również zarejestrowana jako polecenie HTTP z ukośnikiem, ClickClack najpierw obsługuje tę
rejestrację; pozostałe polecenia menu nadal są przekazywane przez standardowy mechanizm
dostarczania wiadomości.

Trybu `agent` należy używać do uzyskiwania dowodów korelacji między usługami. Na podstawie wiarygodnego
identyfikatora wiadomości ClickClack w jego kanonicznej postaci `msg_<ulid>` kanał wyprowadza
deterministyczny identyfikator uruchomienia OpenClaw `clickclack:<message-id>`. Każde wywołanie modelu jest
następnie widoczne w diagnostyce jako `clickclack:<message-id>:model:<n>`; gdy ta
tura używa ClawRouter, ten sam identyfikator wywołania modelu jest wysyłany jako `X-Request-ID`.
Tryb `model` pomija standardową diagnostykę uruchomienia agenta i sesji, dlatego
nie nadaje się do tej ścieżki dowodowej.

Gdy zdarzenie czasu rzeczywistego zawiera zweryfikowaną wartość `payload.correlation_id`,
kanał przekazuje ją jako `X-Correlation-ID` podczas wiarygodnego pobierania wiadomości oraz
w wynikowych żądaniach odpowiedzi ClickClack. Wartości używają bezpiecznego
128-znakowego zestawu ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` i `-`); nieprawidłowe wartości
są pomijane. Te powiązania zawierają wyłącznie identyfikatory, nigdy treści wiadomości,
promptów, uzupełnień, danych uwierzytelniających ani danych wyjściowych narzędzi.

## Trwałe dostarczanie multimediów

Odpowiedzi agenta zawierające multimedia korzystają z wymaganego trwałego mechanizmu dostarczania. OpenClaw przypisuje
stabilne identyfikatory jednorazowe wiadomości i przesyłania dla każdej części przed pierwszym zapisem w ClickClack, dzięki czemu
ponowna próba wykorzystuje to samo przesłanie i wiadomość zamiast zużywać limit miejsca
lub publikować duplikaty. Jeśli przesłany plik istnieje już po ponownym uruchomieniu,
OpenClaw nie odczytuje ponownie pierwotnej ścieżki lokalnej ani zdalnego adresu URL multimediów.

Ta umowa odzyskiwania wymaga serwera ClickClack obsługującego:

- `GET /api/uploads/by-nonce` z
  `X-ClickClack-Upload-Nonce: supported` zarówno dla wyników znalezionych, jak i brakujących.
- `GET /api/messages/by-nonce` z
  `X-ClickClack-Message-Nonce: supported` zarówno dla wyników znalezionych, jak i brakujących.
- Idempotentne tworzenie wiadomości i powiązanie załącznika dla tego samego
  identyfikatora jednorazowego i przesłania w zakresie właściciela.

Ogólny błąd 404 starszego serwera nie jest traktowany jako dowód braku wysyłki.
OpenClaw pozostawia dostarczenie jako nierozstrzygnięte, zamiast ryzykować duplikat; przed
włączeniem odpowiedzi agenta generujących multimedia należy zaktualizować ClickClack.

## Wiersze aktywności agenta

Domyślnie kanał ClickClack nie wyświetla niczego podczas trwania tury agenta; pojawia się tylko końcowa odpowiedź. Aby podczas trwania tury publikować trwałe wiersze wiadomości `agent_commentary` i `agent_tool`, ustaw `agentActivity: true` na koncie:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Wymagania i zachowanie:

- **Domyślnie wyłączone.** Standardowe konfiguracje i starsze serwery ClickClack pozostają bez zmian.
- **Wymaga zakresu tokenu `agent_activity:write`.** Ten zakres jest niezależny od `bot:write` i nie jest przez niego dziedziczony; przed włączeniem opcji należy utworzyć token bota z `--scopes bot:write,agent_activity:write` (lub przyznać ten zakres istniejącemu tokenowi).
- **Łagodne ograniczanie funkcjonalności.** Jeśli token nie ma `agent_activity:write` lub serwer odrzuca zapisy aktywności, awarie są rejestrowane, a końcowa odpowiedź nadal jest dostarczana normalnie; wiersze aktywności nie są wyświetlane.
- Wiersze są grupowane według tury (`turn_id`) i scalane tak, aby jeden logiczny krok odpowiadał jednemu wierszowi, a wiersze narzędzi używały tego samego formatowania postępu co Discord/Slack/Telegram (nazwa narzędzia i szczegóły polecenia).
- **Metadane atrybucji.** Wpisy utworzone przez agenta (wiersze aktywności i końcowa odpowiedź) zawierają pola `author_model` i `author_thinking` ustalone na podstawie modelu faktycznie użytego w danej turze (również po użyciu rozwiązania rezerwowego). Serwery, które nie definiują tych kolumn, ignorują nieznane pola JSON; serwery, które je utrwalają, mogą dla każdej wiadomości odpowiedzieć na pytanie „który model wypowiedział ten wiersz i na jakim poziomie rozumowania”.

## Cele

- `channel:<name-or-id>` wysyła do kanału obszaru roboczego. Cele bez prefiksu domyślnie wskazują `channel:`.
- `dm:<user_id>` tworzy lub ponownie wykorzystuje bezpośrednią konwersację z tym użytkownikiem.
- `thread:<message_id>` odpowiada w wątku rozpoczętym przez tę wiadomość.

Jawne cele wychodzące mogą również zawierać prefiks dostawcy `clickclack:` lub `cc:`.

Wychodzące multimedia korzystają z interfejsu API przesyłania ClickClack, a następnie trwały przesłany plik jest dołączany
do utworzonej wiadomości na kanale, odpowiedzi w wątku lub wiadomości prywatnej. Pliki lokalne i obsługiwane
adresy URL zdalnych multimediów podlegają standardowej polityce dostępu do multimediów OpenClaw, z limitem 64 MiB
na plik. Trwałe wysyłki z kolejki używają oddzielnych wartości jednorazowych o zakresie właściciela dla każdego
przesyłanego pliku i każdej części wiadomości, a następnie ponawiają powiązanie załącznika z tymi samymi
obiektami. Kontrakt serwera i zachowanie podczas odzyskiwania opisano w sekcji [Trwałe dostarczanie multimediów](#durable-media-delivery).

Przykłady:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Uprawnienia

Zakresy tokenów ClickClack są egzekwowane przez interfejs API ClickClack.

- `bot:read`: odczyt danych obszaru roboczego, kanałów, wiadomości, wątków, wiadomości prywatnych, komunikacji w czasie rzeczywistym i profili.
- `bot:write`: `bot:read` oraz wiadomości na kanałach, odpowiedzi w wątkach, wiadomości prywatne, przesyłanie plików i publikowanie menu poleceń.
- `bot:admin`: `bot:write` oraz tworzenie kanałów.
- `commands:write`: publikowanie menu poleceń bota. Uwzględnione w obecnych pakietach `bot:write` i `bot:admin` oraz możliwe do przyznania osobno.
- `agent_activity:write`: trwałe wiersze aktywności agenta (`agent_commentary` / `agent_tool`). Nie są dziedziczone przez `bot:write` ani `bot:admin`; wymagane tylko wtedy, gdy ustawiono `agentActivity: true`.

Do zwykłego czatu z agentem i synchronizacji menu poleceń OpenClaw wymaga jedynie obecnego `bot:write`. Podczas włączania [wierszy aktywności agenta](#agent-activity-rows) należy dodać `agent_activity:write`.

## Rozwiązywanie problemów

- `ClickClack is not configured for account "<id>"`: ustaw `baseUrl`, `token` (na przykład za pomocą `CLICKCLACK_BOT_TOKEN`) oraz `workspace` dla tego konta.
- `ClickClack workspace not found: <value>`: ustaw `workspace` na identyfikator, uproszczoną nazwę lub nazwę obszaru roboczego zwróconą przez ClickClack.
- Brak odpowiedzi przychodzących: upewnij się, że token ma uprawnienia do odczytu w czasie rzeczywistym, i pamiętaj, że bot ignoruje własne wiadomości oraz wiadomości od innych botów.
- Wysyłanie do kanału kończy się niepowodzeniem: sprawdź, czy bot jest członkiem obszaru roboczego i ma `bot:write`.
- Brak menu poleceń: upewnij się, że `commandMenu` nie ma wartości `false`, serwer ClickClack obsługuje `PUT /api/bots/self/commands`, a token ma `commands:write`.
