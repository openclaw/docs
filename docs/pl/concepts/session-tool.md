---
read_when:
    - Chcesz zrozumieć, jakie narzędzia sesji ma agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie subagentów
    - Chcesz sprawdzić status lub sterować uruchomionymi subagentami
summary: Narzędzia agenta do statusu między sesjami, recall, wiadomości i orkiestracji subagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-04-24T09:07:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw daje agentom narzędzia do pracy między sesjami, sprawdzania statusu i
orkiestrowania subagentów.

## Dostępne narzędzia

| Narzędzie         | Co robi                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| `sessions_list`   | Wyświetla sesje z opcjonalnymi filtrami (rodzaj, etykieta, agent, recentność, podgląd) |
| `sessions_history` | Odczytuje transkrypt konkretnej sesji                                      |
| `sessions_send`   | Wysyła wiadomość do innej sesji i opcjonalnie czeka                        |
| `sessions_spawn`  | Tworzy izolowaną sesję subagenta do pracy w tle                            |
| `sessions_yield`  | Kończy bieżącą turę i czeka na dalsze wyniki subagenta                     |
| `subagents`       | Wyświetla, steruje lub zabija uruchomionych subagentów dla tej sesji       |
| `session_status`  | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu per sesja |

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje z ich kluczem, agentId, rodzajem, kanałem, modelem,
liczbą tokenów i znacznikami czasu. Filtruj według rodzaju (`main`, `group`, `cron`, `hook`,
`node`), dokładnej `label`, dokładnego `agentId`, tekstu wyszukiwania lub recentności
(`activeMinutes`). Gdy potrzebujesz triage w stylu skrzynki odbiorczej, można też
zażądać pochodnego tytułu ograniczonego widocznością, fragmentu podglądu ostatniej wiadomości
albo ograniczonych ostatnich wiadomości w każdym wierszu. Tytuły pochodne i podglądy są tworzone
tylko dla sesji, które wywołujący może już zobaczyć zgodnie ze skonfigurowaną polityką
widoczności narzędzi sesji, więc niepowiązane sesje pozostają ukryte.

`sessions_history` pobiera transkrypt rozmowy dla konkretnej sesji.
Domyślnie wyniki narzędzi są wykluczane — przekaż `includeTools: true`, aby je zobaczyć.
Zwracany widok jest celowo ograniczony i filtrowany pod kątem bezpieczeństwa:

- tekst asystenta jest normalizowany przed recall:
  - tagi thinking są usuwane
  - bloki szkieletowe `<relevant-memories>` / `<relevant_memories>` są usuwane
  - bloki XML zwykłego tekstu z ładunkiem wywołania narzędzia takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>` są usuwane, w tym obcięte
    ładunki, które nigdy nie zamknęły się poprawnie
  - zdegradowane szkielety wywołania/wyniku narzędzia takie jak `[Tool Call: ...]`,
    `[Tool Result ...]` i `[Historical context ...]` są usuwane
  - wyciekłe tokeny sterujące modelu takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty pełnoszerokie `<｜...｜>` są usuwane
  - nieprawidłowy XML wywołania narzędzia MiniMax taki jak `<invoke ...>` /
    `</minimax:tool_call>` jest usuwany
- tekst podobny do poświadczeń/tokenów jest redagowany przed zwróceniem
- długie bloki tekstu są obcinane
- bardzo duże historie mogą usuwać starsze wiersze lub zastępować zbyt duży wiersz
  przez `[sessions_history omitted: message too large]`
- narzędzie raportuje flagi podsumowujące takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` i `bytes`

Oba narzędzia akceptują albo **klucz sesji** (np. `"main"`), albo **ID sesji**
z poprzedniego wywołania listy.

Jeśli potrzebujesz dokładnego transkryptu bajt po bajcie, sprawdź plik transkryptu na
dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Fire-and-forget:** ustaw `timeoutSeconds: 0`, aby umieścić wiadomość w kolejce i od razu zwrócić wynik.
- **Czekanie na odpowiedź:** ustaw limit czasu i otrzymaj odpowiedź inline.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę reply-back**, w której
agenci naprzemiennie wymieniają wiadomości (do 5 tur). Docelowy agent może odpowiedzieć
`REPLY_SKIP`, aby zakończyć wcześniej.

## Pomocniki statusu i orkiestracji

`session_status` to lekkie narzędzie będące odpowiednikiem `/status` dla bieżącej
lub innej widocznej sesji. Raportuje użycie, czas, stan modelu/runtime oraz
powiązany kontekst zadań w tle, jeśli występuje. Podobnie jak `/status`, może uzupełniać
rzadkie liczniki tokenów/cache z ostatniego wpisu użycia w transkrypcie, a
`model=default` czyści nadpisanie per sesja.

`sessions_yield` celowo kończy bieżącą turę, aby następna wiadomość mogła być
zdarzeniem następczym, na które czekasz. Użyj go po uruchomieniu subagentów, gdy
chcesz, aby wyniki ukończenia dotarły jako następna wiadomość zamiast budować pętle odpytywania.

`subagents` to pomocnik control-plane dla już uruchomionych subagentów
OpenClaw. Obsługuje:

- `action: "list"` do sprawdzania aktywnych/ostatnich uruchomień
- `action: "steer"` do wysyłania dalszych wskazówek do działającego potomka
- `action: "kill"` do zatrzymania jednego potomka albo `all`

## Uruchamianie subagentów

`sessions_spawn` domyślnie tworzy izolowaną sesję dla zadania w tle.
Zawsze działa nieblokująco — od razu zwraca `runId` i
`childSessionKey`.

Kluczowe opcje:

- `runtime: "subagent"` (domyślnie) albo `"acp"` dla zewnętrznych agentów harness.
- Nadpisania `model` i `thinking` dla sesji potomnej.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itd.).
- `sandbox: "require"`, aby wymusić sandboxing na potomku.
- `context: "fork"` dla natywnych subagentów, gdy potomek potrzebuje
  transkryptu bieżącego żądającego; pomiń to albo użyj `context: "isolated"` dla czystego potomka.

Domyślne końcowe subagenty nie dostają narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, subagenty orkiestratora na głębokości 1 dodatkowo otrzymują
`sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogły
zarządzać własnymi potomkami. Uruchomienia końcowe nadal nie dostają rekurencyjnych
narzędzi orkiestracji.

Po ukończeniu krok ogłoszenia publikuje wynik do kanału żądającego.
Dostarczanie ukończenia zachowuje routowanie powiązanego wątku/tematu, gdy jest dostępne, a jeśli
źródło ukończenia identyfikuje tylko kanał, OpenClaw nadal może ponownie użyć
zapisanego routingu sesji żądającego (`lastChannel` / `lastTo`) do bezpośredniego
dostarczenia.

W przypadku zachowania specyficznego dla ACP zobacz [Agenci ACP](/pl/tools/acp-agents).

## Widoczność

Narzędzia sesji są ograniczone zakresem, aby limitować to, co agent może zobaczyć:

| Poziom  | Zakres                                    |
| ------- | ----------------------------------------- |
| `self`  | Tylko bieżąca sesja                       |
| `tree`  | Bieżąca sesja + uruchomione subagenty     |
| `agent` | Wszystkie sesje tego agenta               |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Domyślnie jest to `tree`. Sesje sandboxed są ograniczane do `tree` niezależnie od
konfiguracji.

## Dalsza lektura

- [Zarządzanie sesjami](/pl/concepts/session) -- routowanie, cykl życia, utrzymanie
- [Agenci ACP](/pl/tools/acp-agents) -- uruchamianie zewnętrznego harness
- [Multi-agent](/pl/concepts/multi-agent) -- architektura wielu agentów
- [Konfiguracja Gateway](/pl/gateway/configuration) -- opcje konfiguracji narzędzi sesji

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
