---
read_when:
    - Chcesz zrozumieć, jakie narzędzia sesji ma agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie podagentów
    - Chcesz sprawdzić status lub sterować uruchomionymi podagentami
summary: Narzędzia agenta do statusu między sesjami, przypominania, wiadomości i orkiestracji podagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-04-05T13:51:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# Narzędzia sesji

OpenClaw daje agentom narzędzia do pracy między sesjami, sprawdzania statusu i
orkiestracji podagentów.

## Dostępne narzędzia

| Narzędzie          | Co robi                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `sessions_list`    | Wyświetla sesje z opcjonalnymi filtrami (rodzaj, ostatnia aktywność)     |
| `sessions_history` | Odczytuje transkrypt określonej sesji                                    |
| `sessions_send`    | Wysyła wiadomość do innej sesji i opcjonalnie czeka                      |
| `sessions_spawn`   | Uruchamia izolowaną sesję podagenta do pracy w tle                       |
| `sessions_yield`   | Kończy bieżącą turę i czeka na wyniki podagenta w kolejnej wiadomości    |
| `subagents`        | Wyświetla, steruje lub zatrzymuje uruchomione podagenty dla tej sesji    |
| `session_status`   | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu dla sesji |

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje z ich kluczem, rodzajem, kanałem, modelem, liczbą
tokenów i znacznikami czasu. Filtruj według rodzaju (`main`, `group`, `cron`, `hook`,
`node`) lub ostatniej aktywności (`activeMinutes`).

`sessions_history` pobiera transkrypt rozmowy dla określonej sesji.
Domyślnie wyniki narzędzi są wykluczone -- przekaż `includeTools: true`, aby je zobaczyć.
Zwracany widok jest celowo ograniczony i filtrowany pod kątem bezpieczeństwa:

- tekst asystenta jest normalizowany przed przypomnieniem:
  - tagi thinking są usuwane
  - bloki szkieletowe `<relevant-memories>` / `<relevant_memories>` są usuwane
  - bloki ładunków XML wywołań narzędzi w postaci zwykłego tekstu, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` oraz
    `<function_calls>...</function_calls>`, są usuwane, w tym skrócone
    ładunki, które nigdy nie zamykają się poprawnie
  - obniżone szkielety wywołań/wyników narzędzi, takie jak `[Tool Call: ...]`,
    `[Tool Result ...]` oraz `[Historical context ...]`, są usuwane
  - ujawnione tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty full-width `<｜...｜>`, są usuwane
  - nieprawidłowy XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` /
    `</minimax:tool_call>`, jest usuwany
- tekst przypominający poświadczenia/tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są obcinane
- bardzo duże historie mogą usuwać starsze wiersze lub zastępować zbyt duży wiersz
  ciągiem `[sessions_history omitted: message too large]`
- narzędzie zwraca flagi podsumowania, takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` i `bytes`

Oba narzędzia akceptują zarówno **klucz sesji** (na przykład `"main"`), jak i **ID sesji**
z poprzedniego wywołania listy.

Jeśli potrzebujesz dokładnego transkryptu bajt po bajcie, sprawdź plik transkryptu na
dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Fire-and-forget:** ustaw `timeoutSeconds: 0`, aby dodać do kolejki i natychmiast
  zwrócić wynik.
- **Czekanie na odpowiedź:** ustaw limit czasu i otrzymaj odpowiedź inline.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę odpowiedzi zwrotnej**, w której
agenci naprzemiennie wymieniają wiadomości (do 5 tur). Agent docelowy może odpowiedzieć
`REPLY_SKIP`, aby zatrzymać to wcześniej.

## Pomocnicze narzędzia statusu i orkiestracji

`session_status` to lekkie narzędzie równoważne `/status` dla bieżącej
lub innej widocznej sesji. Raportuje użycie, czas, stan modelu/runtime oraz
powiązany kontekst zadania w tle, jeśli jest dostępny. Podobnie jak `/status`, może
uzupełniać rzadkie liczniki tokenów/cache z najnowszego wpisu użycia w transkrypcie, a
`model=default` czyści nadpisanie dla sesji.

`sessions_yield` celowo kończy bieżącą turę, aby następna wiadomość mogła być
zdarzeniem follow-up, na które czekasz. Używaj go po uruchomieniu podagentów, gdy
chcesz, aby wyniki ukończenia dotarły jako następna wiadomość zamiast budowania
pętli odpytywania.

`subagents` to pomocnik control-plane dla już uruchomionych podagentów
OpenClaw. Obsługuje:

- `action: "list"` do sprawdzania aktywnych/niedawnych przebiegów
- `action: "steer"` do wysyłania dodatkowych wskazówek do działającego dziecka
- `action: "kill"` do zatrzymania jednego dziecka albo `all`

## Uruchamianie podagentów

`sessions_spawn` tworzy izolowaną sesję dla zadania w tle. Zawsze jest
nieblokujące -- natychmiast zwraca `runId` i `childSessionKey`.

Najważniejsze opcje:

- `runtime: "subagent"` (domyślnie) albo `"acp"` dla agentów zewnętrznego harnessu.
- Nadpisania `model` i `thinking` dla sesji dziecka.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itd.).
- `sandbox: "require"`, aby wymusić sandbox dla dziecka.

Domyślne podagenty liściowe nie otrzymują narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, podagenty orkiestratora na głębokości 1 dodatkowo otrzymują
`sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby
mogły zarządzać własnymi dziećmi. Przebiegi liściowe nadal nie otrzymują
rekurencyjnych narzędzi orkiestracji.

Po zakończeniu krok ogłoszenia publikuje wynik w kanale żądającego.
Dostarczanie ukończenia zachowuje powiązany routing wątku/tematu, gdy jest dostępny,
a jeśli źródło ukończenia identyfikuje tylko kanał, OpenClaw nadal może użyć
zapisanego routingu sesji żądającego (`lastChannel` / `lastTo`) do bezpośredniego
dostarczenia.

Zachowanie specyficzne dla ACP opisano w [ACP Agents](/tools/acp-agents).

## Widoczność

Narzędzia sesji mają ograniczony zakres, aby limitować to, co agent może zobaczyć:

| Poziom  | Zakres                                     |
| ------- | ------------------------------------------ |
| `self`  | Tylko bieżąca sesja                        |
| `tree`  | Bieżąca sesja + uruchomione podagenty      |
| `agent` | Wszystkie sesje tego agenta                |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Domyślnie jest to `tree`. Sesje w sandboxie są ograniczane do `tree`
niezależnie od konfiguracji.

## Dalsza lektura

- [Session Management](/concepts/session) -- routing, cykl życia, utrzymanie
- [ACP Agents](/tools/acp-agents) -- uruchamianie zewnętrznego harnessu
- [Multi-agent](/concepts/multi-agent) -- architektura wielu agentów
- [Gateway Configuration](/gateway/configuration) -- ustawienia konfiguracji narzędzi sesji
