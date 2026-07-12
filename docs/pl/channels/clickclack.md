---
read_when:
    - Łączenie OpenClaw z obszarem roboczym ClickClack
    - Testowanie tożsamości botów ClickClack
summary: Konfiguracja kanału z tokenem bota ClickClack i składnia celu
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T14:47:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack łączy OpenClaw z samodzielnie hostowaną przestrzenią roboczą ClickClack za pomocą natywnie obsługiwanych tokenów botów ClickClack.

Użyj tej integracji, jeśli chcesz, aby agent OpenClaw występował jako użytkownik-bot ClickClack. ClickClack obsługuje niezależne boty usługowe oraz boty należące do użytkowników; boty należące do użytkowników zachowują `owner_user_id` i otrzymują wyłącznie przyznane im zakresy tokenu.

## Szybka konfiguracja

Utwórz token bota na serwerze ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

W przypadku bota należącego do użytkownika dodaj `--owner <user_id>`.

Skonfiguruj OpenClaw:

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

Następnie uruchom:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Konto jest uznawane za skonfigurowane tylko wtedy, gdy ustawiono wszystkie pola: `baseUrl`, `token` i `workspace`. Pole `workspace` przyjmuje identyfikator przestrzeni roboczej (`wsp_...`), uproszczoną nazwę lub nazwę; podczas uruchamiania Gateway zamienia tę wartość na identyfikator.

### Klucze konfiguracji konta

| Klucz                   | Wartość domyślna     | Uwagi                                                                                                    |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| `baseUrl`               | brak (wymagane)       | Adres URL serwera ClickClack.                                                                            |
| `token`                 | brak (wymagane)       | Zwykły ciąg znaków lub odwołanie do sekretu (`source: "env" \| "file" \| "exec"`).                        |
| `workspace`             | brak (wymagane)       | Identyfikator, uproszczona nazwa lub nazwa przestrzeni roboczej.                                         |
| `replyMode`             | `"agent"`             | `"agent"` uruchamia pełny potok agenta; `"model"` wysyła krótkie, bezpośrednie odpowiedzi modelu.        |
| `defaultTo`             | `"channel:general"`   | Cel używany, gdy ścieżka wychodząca nie określa celu.                                                    |
| `allowFrom`             | `["*"]`               | Lista dozwolonych identyfikatorów użytkowników dla przychodzących wiadomości prywatnych i kanałowych.    |
| `botUserId`             | wykrywane automatycznie | Ustalane na podstawie tożsamości tokenu bota podczas uruchamiania.                                     |
| `agentId`               | domyślna wartość trasy | Przypisuje wiadomości przychodzące tego konta do jednego agenta.                                       |
| `toolsAllow`            | brak                  | Lista dozwolonych narzędzi dla odpowiedzi agenta z tego konta.                                          |
| `model`, `systemPrompt` | brak                  | Używane do uzupełnień w trybie `replyMode: "model"`.                                                     |
| `reconnectMs`           | `1500`                | Opóźnienie ponownego połączenia w czasie rzeczywistym (od 100 do 60000).                                 |

Jeśli `plugins.allow` jest niepustą listą ograniczającą, jawne wybranie
ClickClack podczas konfiguracji kanału lub uruchomienie `openclaw plugins enable clickclack`
dodaje `clickclack` do tej listy. Instalacja w ramach wdrażania używa takiego samego
mechanizmu jawnego wyboru. Te ścieżki nie zastępują ustawienia `plugins.deny` ani
globalnego ustawienia `plugins.enabled: false`. Bezpośrednie użycie
`openclaw plugins install @openclaw/clickclack` podlega standardowym zasadom
instalacji pluginów i również zapisuje ClickClack na istniejącej liście dozwolonych.

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

- `replyMode: "agent"` (domyślnie) przekazuje wiadomości przychodzące przez standardowy potok agenta, w tym rejestrowanie sesji i zasady używania narzędzi.
- `replyMode: "model"` pomija potok agenta i używa `llm.complete` środowiska wykonawczego pluginu do generowania krótkich, bezpośrednich odpowiedzi bota, opcjonalnie kształtowanych przez `model` i `systemPrompt`.

Tryb modelu uruchamia uzupełnienia dla ustalonego identyfikatora agenta bota, co wymaga
jawnego ustawienia zaufania `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

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

Pozostaw to ustawienie zaufania wyłączone, jeśli używasz tylko domyślnego trybu odpowiedzi
`agent`; nie jest ono w nim potrzebne.

Używaj trybu `agent` do uzyskiwania dowodów korelacji między usługami. Dla miarodajnego
identyfikatora wiadomości ClickClack w kanonicznym formacie `msg_<ulid>` kanał wyprowadza
deterministyczny identyfikator przebiegu OpenClaw `clickclack:<message-id>`. Każde wywołanie modelu
jest następnie widoczne w diagnostyce jako `clickclack:<message-id>:model:<n>`; gdy ten
przebieg używa ClawRouter, ten sam identyfikator wywołania modelu jest wysyłany jako `X-Request-ID`.
Tryb `model` pomija standardową diagnostykę przebiegu i sesji agenta, dlatego
nie nadaje się do tej ścieżki dowodowej.

Gdy zdarzenie czasu rzeczywistego zawiera zweryfikowane `payload.correlation_id`, kanał
przekazuje je jako `X-Correlation-ID` podczas miarodajnego pobierania wiadomości oraz
wynikających z niego żądań odpowiedzi ClickClack. Wartości używają bezpiecznego,
128-znakowego zestawu ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` i `-`); nieprawidłowe wartości
są pomijane. Te powiązania zawierają wyłącznie identyfikatory, nigdy treści wiadomości,
promptów, uzupełnień, danych uwierzytelniających ani danych wyjściowych narzędzi.

## Wiersze aktywności agenta

Domyślnie kanał ClickClack nie wyświetla niczego podczas trwania przebiegu agenta; pojawia się tylko odpowiedź końcowa. Ustaw `agentActivity: true` na koncie, aby publikować trwałe wiersze wiadomości `agent_commentary` i `agent_tool` podczas trwania przebiegu:

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

Wymagania i działanie:

- **Domyślnie wyłączone.** Standardowe konfiguracje i starsze serwery ClickClack pozostają bez zmian.
- **Wymaga zakresu tokenu `agent_activity:write`.** Ten zakres jest odrębny od `bot:write` i nie jest po nim dziedziczony; przed włączeniem tej opcji utwórz token bota z `--scopes bot:write,agent_activity:write` albo przyznaj ten zakres istniejącemu tokenowi.
- **Łagodne ograniczenie funkcjonalności.** Jeśli token nie ma zakresu `agent_activity:write` lub serwer odrzuca zapisy aktywności, błędy są rejestrowane, a odpowiedź końcowa nadal jest dostarczana normalnie; wiersze aktywności się nie pojawiają.
- Wiersze są grupowane według przebiegu (`turn_id`) i scalane tak, aby jeden logiczny krok odpowiadał jednemu wierszowi, a wiersze narzędzi używają tego samego formatowania postępu co Discord/Slack/Telegram (nazwa narzędzia oraz szczegóły polecenia).
- **Metadane przypisania autorstwa.** Wpisy utworzone przez agenta (wiersze aktywności i odpowiedź końcowa) zawierają pola `author_model` i `author_thinking`, ustalone na podstawie modelu rzeczywiście użytego w przebiegu, również po zastosowaniu modelu zapasowego. Serwery, które nie definiują tych kolumn, ignorują nieznane pola JSON; serwery, które je zapisują, mogą dla każdej wiadomości odpowiedzieć na pytanie „który model wypowiedział ten wiersz i przy jakim poziomie rozumowania”.

## Cele

- `channel:<name-or-id>` wysyła do kanału przestrzeni roboczej. Cele bez prefiksu domyślnie otrzymują prefiks `channel:`.
- `dm:<user_id>` tworzy lub ponownie wykorzystuje bezpośrednią rozmowę z danym użytkownikiem.
- `thread:<message_id>` odpowiada w wątku zakorzenionym w danej wiadomości.

Jawne cele wychodzące mogą również zawierać prefiks dostawcy `clickclack:` lub `cc:`.

Przykłady:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Uprawnienia

Zakresy tokenów ClickClack są egzekwowane przez API ClickClack.

- `bot:read`: odczyt danych przestrzeni roboczej, kanałów, wiadomości, wątków, wiadomości prywatnych, komunikacji w czasie rzeczywistym i profili.
- `bot:write`: uprawnienia `bot:read` oraz możliwość wysyłania wiadomości kanałowych, odpowiedzi w wątkach, wiadomości prywatnych i przesyłania plików.
- `bot:admin`: uprawnienia `bot:write` oraz możliwość tworzenia kanałów.
- `agent_activity:write`: trwałe wiersze aktywności agenta (`agent_commentary` / `agent_tool`). Nie jest dziedziczony przez `bot:write` ani `bot:admin`; jest wymagany tylko po ustawieniu `agentActivity: true`.

Do zwykłego czatu z agentem OpenClaw potrzebuje tylko `bot:write`. Dodaj `agent_activity:write` podczas włączania [wierszy aktywności agenta](#agent-activity-rows).

## Rozwiązywanie problemów

- `ClickClack is not configured for account "<id>"`: ustaw `baseUrl`, `token` (na przykład przez `CLICKCLACK_BOT_TOKEN`) oraz `workspace` dla tego konta.
- `ClickClack workspace not found: <value>`: ustaw `workspace` na identyfikator, uproszczoną nazwę lub nazwę przestrzeni roboczej zwróconą przez ClickClack.
- Brak odpowiedzi na wiadomości przychodzące: potwierdź, że token ma uprawnienia do odczytu w czasie rzeczywistym, i pamiętaj, że bot ignoruje własne wiadomości oraz wiadomości od innych botów.
- Wysyłanie do kanału nie działa: sprawdź, czy bot jest członkiem przestrzeni roboczej i ma uprawnienie `bot:write`.
