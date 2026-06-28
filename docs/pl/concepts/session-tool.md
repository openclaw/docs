---
read_when:
    - Chcesz zrozumieć, jakimi narzędziami sesji dysponuje agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie podagentów
    - Chcesz sprawdzić status uruchomionego subagenta
summary: Narzędzia agenta do statusu między sesjami, przywoływania, komunikacji i orkiestracji podagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-06-28T00:12:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffc7edf68e4510ea6a5fe93238be32e9d7eacf8e7b49e58f63536c14bbe2da80
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw udostępnia agentom narzędzia do pracy między sesjami, sprawdzania statusu i
orkiestrowania podagentów.

## Dostępne narzędzia

| Narzędzie          | Co robi                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Wyświetla sesje z opcjonalnymi filtrami (typ, etykieta, agent, ostatnia aktywność, podgląd) |
| `sessions_history` | Odczytuje transkrypcję konkretnej sesji                                     |
| `sessions_send`    | Wysyła wiadomość do innej sesji i opcjonalnie czeka                         |
| `sessions_spawn`   | Uruchamia izolowaną sesję podagenta do pracy w tle                          |
| `sessions_yield`   | Kończy bieżącą turę i czeka na dalsze wyniki podagenta                      |
| `subagents`        | Wyświetla status uruchomionych podagentów dla tej sesji                     |
| `session_status`   | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu dla sesji |

Te narzędzia nadal podlegają aktywnemu profilowi narzędzi oraz zasadom
zezwoleń/odmów. `tools.profile: "coding"` obejmuje pełny zestaw orkiestracji
sesji, w tym `sessions_spawn`, `sessions_yield` i `subagents`.
`tools.profile: "messaging"` obejmuje narzędzia komunikacji między sesjami
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), ale
nie obejmuje uruchamiania podagentów. Aby zachować profil komunikacyjny i nadal
zezwolić na natywne delegowanie, dodaj:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Zasady grup, dostawców, piaskownicy i poszczególnych agentów mogą nadal usuwać
te narzędzia po etapie profilu. Użyj `/tools` z danej sesji, aby sprawdzić
efektywną listę narzędzi.

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje wraz z ich kluczem, agentId, typem, kanałem, modelem,
liczbą tokenów i znacznikami czasu. Filtruj według typu (`main`, `group`, `cron`, `hook`,
`node`), dokładnej wartości `label`, dokładnej wartości `agentId`, tekstu wyszukiwania lub
ostatniej aktywności (`activeMinutes`). Gdy potrzebujesz segregowania w stylu skrzynki
odbiorczej, narzędzie może też poprosić o wyprowadzony tytuł ograniczony widocznością,
fragment podglądu ostatniej wiadomości albo ograniczoną liczbę najnowszych wiadomości
w każdym wierszu. Wyprowadzone tytuły i podglądy są tworzone tylko dla sesji, które
wywołujący może już widzieć zgodnie ze skonfigurowaną polityką widoczności narzędzi sesji,
więc niepowiązane sesje pozostają ukryte. Gdy widoczność jest ograniczona, `sessions_list`
zwraca opcjonalne metadane `visibility` pokazujące efektywny tryb oraz ostrzeżenie, że
wyniki mogą być ograniczone zakresem.

`sessions_history` pobiera transkrypcję rozmowy dla konkretnej sesji.
Domyślnie wyniki narzędzi są wykluczone -- przekaż `includeTools: true`, aby je zobaczyć.
Użyj `limit`, aby pobrać najnowszy ograniczony koniec historii. Przekaż `offset: 0`, gdy
potrzebujesz metadanych paginacji, a następnie przekazuj zwrócone wartości `nextOffset`,
aby stronicować wstecz przez starsze okna transkrypcji OpenClaw bez odczytywania surowych
plików transkrypcji. Jawne strony z przesunięciem nie scalają zewnętrznych importów
awaryjnych CLI; użyj domyślnego widoku najnowszego końca, gdy potrzebujesz tej scalonej
historii wyświetlania.
Zwracany widok jest celowo ograniczony i filtrowany pod kątem bezpieczeństwa:

- tekst asystenta jest normalizowany przed przywołaniem:
  - tagi myślenia są usuwane
  - bloki szkieletowe `<relevant-memories>` / `<relevant_memories>` są usuwane
  - bloki ładunków XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, są usuwane, w tym ucięte
    ładunki, które nigdy nie zamykają się poprawnie
  - zdegradowane szkielety wywołań/wyników narzędzi, takie jak `[Tool Call: ...]`,
    `[Tool Result ...]` i `[Historical context ...]`, są usuwane
  - ujawnione tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty pełnej szerokości `<｜...｜>` są usuwane
  - niepoprawny XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` /
    `</minimax:tool_call>`, jest usuwany
- tekst przypominający poświadczenia/tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są skracane
- bardzo duże historie mogą usuwać starsze wiersze albo zastępować zbyt duży wiersz tekstem
  `[sessions_history omitted: message too large]`
- narzędzie zgłasza flagi podsumowania, takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes`, oraz metadane paginacji

Oba narzędzia akceptują **klucz sesji** (np. `"main"`) albo **identyfikator sesji**
z poprzedniego wywołania listy.

Jeśli potrzebujesz transkrypcji dokładnie bajt po bajcie, sprawdź plik transkrypcji na
dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Wyślij i zapomnij:** ustaw `timeoutSeconds: 0`, aby dodać do kolejki i wrócić
  natychmiast.
- **Czekaj na odpowiedź:** ustaw limit czasu i otrzymaj odpowiedź bezpośrednio.

Sesje czatu ograniczone do wątku, takie jak klucze Slack lub Discord kończące się na
`:thread:<id>`, nie są prawidłowymi celami `sessions_send`. Użyj klucza sesji kanału
nadrzędnego do koordynacji między agentami, aby wiadomości kierowane przez narzędzia nie
pojawiały się w aktywnym wątku widocznym dla ludzi.

Wiadomości i odpowiedzi uzupełniające A2A są oznaczane jako dane między sesjami w
odbierającym prompcie (`[Inter-session message ... isUser=false]`) oraz w pochodzeniu
transkrypcji. Agent odbierający powinien traktować je jako dane kierowane przez narzędzie,
a nie jako bezpośrednią instrukcję napisaną przez użytkownika końcowego.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę odpowiedzi zwrotnej**, w której
agenci naprzemiennie wysyłają wiadomości (do `session.agentToAgent.maxPingPongTurns`, zakres
0-20, domyślnie 5). Agent docelowy może odpowiedzieć
`REPLY_SKIP`, aby zakończyć wcześniej.

## Pomocnicy statusu i orkiestracji

`session_status` to lekkie narzędzie równoważne `/status` dla bieżącej
lub innej widocznej sesji. Raportuje użycie, czas, stan modelu/środowiska wykonawczego oraz
powiązany kontekst zadań w tle, gdy jest obecny. Podobnie jak `/status`, może uzupełniać
rzadkie liczniki tokenów/pamięci podręcznej z najnowszego wpisu użycia w transkrypcji, a
`model=default` czyści nadpisanie dla sesji. Użyj `sessionKey="current"` dla
bieżącej sesji wywołującego; widoczne etykiety klientów, takie jak `openclaw-tui`, nie są
kluczami sesji.

Gdy metadane routingu są dostępne, `session_status` zawiera też widoczny blok JSON
`Route context` oraz pasujące ustrukturyzowane pola `details`. Te pola odróżniają
klucz sesji od trasy, która aktualnie obsługuje wykonanie na żywo:

- `origin` to miejsce utworzenia sesji albo dostawca wywnioskowany z prefiksu klucza sesji
  możliwej do dostarczenia, gdy starszy stan nie ma zapisanych metadanych pochodzenia.
- `active` to bieżąca trasa wykonania na żywo. Jest raportowana tylko dla sesji na żywo lub
  bieżącej sesji obsługiwanej teraz.
- `deliveryContext` to utrwalona trasa dostarczania zapisana w sesji,
  której OpenClaw może użyć ponownie do późniejszego dostarczania nawet wtedy, gdy aktywna
  powierzchnia jest inna.

`sessions_yield` celowo kończy bieżącą turę, aby następna wiadomość mogła być
zdarzeniem uzupełniającym, na które czekasz. Użyj go po uruchomieniu podagentów, gdy
chcesz, aby wyniki ukończenia dotarły jako następna wiadomość zamiast budować
pętle odpytywania.

`subagents` to pomocnik widoczności dla już uruchomionych podagentów
OpenClaw. Obsługuje `action: "list"` do sprawdzania aktywnych/niedawnych uruchomień.

## Uruchamianie podagentów

`sessions_spawn` domyślnie tworzy izolowaną sesję dla zadania w tle.
Zawsze działa nieblokująco -- zwraca natychmiast `runId` i
`childSessionKey`. Natywne uruchomienia podagentów otrzymują delegowane zadanie w pierwszej
widocznej wiadomości `[Subagent Task]` sesji podrzędnej, podczas gdy prompt systemowy
zawiera tylko reguły środowiska wykonawczego podagenta i kontekst routingu.

Kluczowe opcje:

- `runtime: "subagent"` (domyślnie) albo `"acp"` dla zewnętrznych agentów uprzęży.
- Nadpisania `model` i `thinking` dla sesji podrzędnej.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itd.).
- `sandbox: "require"`, aby wymusić piaskownicę dla procesu podrzędnego.
- `context: "fork"` dla natywnych podagentów, gdy proces podrzędny potrzebuje bieżącej
  transkrypcji żądającego; pomiń to albo użyj `context: "isolated"` dla czystego procesu
  podrzędnego. Natywne podagenty powiązane z wątkiem domyślnie używają `context: "fork"`,
  chyba że `threadBindings.defaultSpawnContext` wskazuje inaczej.

Domyślne podagenty liściowe nie otrzymują narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, podagenty-orkiestratory na głębokości 1 dodatkowo otrzymują
`sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogły
zarządzać własnymi dziećmi. Uruchomienia liściowe nadal nie otrzymują rekurencyjnych
narzędzi orkiestracji.

Po ukończeniu krok ogłoszenia publikuje wynik w kanale żądającego.
Dostarczenie ukończenia zachowuje powiązany routing wątku/tematu, gdy jest dostępny, a jeśli
pochodzenie ukończenia identyfikuje tylko kanał, OpenClaw może nadal ponownie użyć
zapisanej trasy sesji żądającego (`lastChannel` / `lastTo`) do bezpośredniego
dostarczenia.

Zachowanie specyficzne dla ACP opisano w [Agenci ACP](/pl/tools/acp-agents).

## Widoczność

Narzędzia sesji mają ograniczony zakres, aby ograniczyć to, co agent może zobaczyć:

| Poziom  | Zakres                                   |
| ------- | ---------------------------------------- |
| `self`  | Tylko bieżąca sesja                      |
| `tree`  | Bieżąca sesja + uruchomione podagenty    |
| `agent` | Wszystkie sesje tego agenta              |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Domyślnie używane jest `tree`. Sesje w piaskownicy są ograniczane do `tree` niezależnie od
konfiguracji.

## Dalsza lektura

- [Zarządzanie sesjami](/pl/concepts/session) -- routing, cykl życia, utrzymanie
- [Agenci ACP](/pl/tools/acp-agents) -- uruchamianie zewnętrznej uprzęży
- [Wielu agentów](/pl/concepts/multi-agent) -- architektura wielu agentów
- [Konfiguracja Gateway](/pl/gateway/configuration) -- opcje konfiguracji narzędzi sesji

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
