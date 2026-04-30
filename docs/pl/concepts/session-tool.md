---
read_when:
    - Chcesz zrozumieć, jakimi narzędziami sesji dysponuje agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie podagentów
    - Chcesz sprawdzić status lub zarządzać utworzonymi subagentami
summary: Narzędzia agenta do obsługi statusu między sesjami, przywoływania informacji, komunikacji i orkiestracji podagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-04-30T09:50:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw daje agentom narzędzia do pracy między sesjami, sprawdzania statusu i
orkiestrowania podagentów.

## Dostępne narzędzia

| Narzędzie          | Co robi                                                                      |
| ------------------ | ----------------------------------------------------------------------------- |
| `sessions_list`    | Wyświetla listę sesji z opcjonalnymi filtrami (rodzaj, etykieta, agent, aktualność, podgląd) |
| `sessions_history` | Odczytuje transkrypcję konkretnej sesji                                       |
| `sessions_send`    | Wysyła wiadomość do innej sesji i opcjonalnie czeka                          |
| `sessions_spawn`   | Uruchamia izolowaną sesję podagenta do pracy w tle                           |
| `sessions_yield`   | Kończy bieżącą turę i czeka na kolejne wyniki podagentów                     |
| `subagents`        | Wyświetla, steruje lub zabija uruchomione podagenty dla tej sesji            |
| `session_status`   | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu dla sesji |

Te narzędzia nadal podlegają aktywnemu profilowi narzędzi oraz zasadom
zezwalania/odmawiania. `tools.profile: "coding"` obejmuje pełny zestaw
orkiestracji sesji, w tym `sessions_spawn`, `sessions_yield` i `subagents`.
`tools.profile: "messaging"` obejmuje narzędzia komunikacji między sesjami
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), ale
nie obejmuje uruchamiania podagentów. Aby zachować profil komunikacyjny i nadal
zezwolić na natywną delegację, dodaj:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Zasady grupy, dostawcy, sandboxa i poszczególnych agentów nadal mogą usunąć te
narzędzia po etapie profilu. Użyj `/tools` z danej sesji, aby sprawdzić
efektywną listę narzędzi.

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje wraz z ich kluczem, agentId, rodzajem, kanałem,
modelem, licznikami tokenów i znacznikami czasu. Filtruj według rodzaju
(`main`, `group`, `cron`, `hook`, `node`), dokładnego `label`, dokładnego
`agentId`, tekstu wyszukiwania lub aktualności (`activeMinutes`). Gdy potrzebna
jest selekcja w stylu skrzynki odbiorczej, może także poprosić o pochodny tytuł
w zakresie widoczności, fragment podglądu ostatniej wiadomości lub ograniczone
najnowsze wiadomości w każdym wierszu. Tytuły pochodne i podglądy są tworzone
tylko dla sesji, które wywołujący może już zobaczyć zgodnie ze skonfigurowaną
zasadą widoczności narzędzi sesji, więc niepowiązane sesje pozostają ukryte.

`sessions_history` pobiera transkrypcję rozmowy dla konkretnej sesji. Domyślnie
wyniki narzędzi są wykluczone -- przekaż `includeTools: true`, aby je zobaczyć.
Zwracany widok jest celowo ograniczony i filtrowany pod kątem bezpieczeństwa:

- tekst asystenta jest normalizowany przed przywołaniem:
  - tagi myślenia są usuwane
  - bloki szkieletu `<relevant-memories>` / `<relevant_memories>` są usuwane
  - bloki ładunków XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, są usuwane, w tym ucięte
    ładunki, które nigdy poprawnie się nie zamykają
  - zdegradowany szkielet wywołań/wyników narzędzi, taki jak `[Tool Call: ...]`,
    `[Tool Result ...]` i `[Historical context ...]`, jest usuwany
  - wyciekłe tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty pełnej szerokości `<｜...｜>`, są usuwane
  - nieprawidłowy XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` /
    `</minimax:tool_call>`, jest usuwany
- tekst przypominający dane uwierzytelniające/tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są ucinane
- bardzo duże historie mogą odrzucać starsze wiersze albo zastępować zbyt duży wiersz przez
  `[sessions_history omitted: message too large]`
- narzędzie raportuje flagi podsumowania, takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` i `bytes`

Oba narzędzia akceptują **klucz sesji** (taki jak `"main"`) albo **identyfikator sesji**
z poprzedniego wywołania listy.

Jeśli potrzebujesz dokładnej transkrypcji bajt po bajcie, sprawdź plik
transkrypcji na dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Wyślij i zapomnij:** ustaw `timeoutSeconds: 0`, aby zakolejkować i wrócić
  natychmiast.
- **Czekaj na odpowiedź:** ustaw limit czasu i otrzymaj odpowiedź inline.

Wiadomości i odpowiedzi uzupełniające A2A są oznaczane jako dane między sesjami
w prompcie odbierającym (`[Inter-session message ... isUser=false]`) oraz w
proweniencji transkrypcji. Agent odbierający powinien traktować je jako dane
przekierowane przez narzędzie, a nie jako bezpośrednią instrukcję napisaną przez
użytkownika końcowego.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę odpowiedzi zwrotnej**, w
której agenci naprzemiennie wysyłają wiadomości (do 5 tur). Agent docelowy może
odpowiedzieć `REPLY_SKIP`, aby zakończyć wcześniej.

## Pomocnicze narzędzia statusu i orkiestracji

`session_status` to lekkie narzędzie równoważne `/status` dla bieżącej lub innej
widocznej sesji. Raportuje użycie, czas, stan modelu/środowiska uruchomieniowego
oraz kontekst powiązanego zadania w tle, jeśli istnieje. Tak jak `/status`, może
uzupełniać rzadkie liczniki tokenów/pamięci podręcznej z najnowszego wpisu
użycia transkrypcji, a `model=default` czyści nadpisanie dla sesji. Użyj
`sessionKey="current"` dla bieżącej sesji wywołującego; widoczne etykiety klienta,
takie jak `openclaw-tui`, nie są kluczami sesji.

`sessions_yield` celowo kończy bieżącą turę, aby następną wiadomością mogło być
zdarzenie uzupełniające, na które czekasz. Używaj go po uruchomieniu podagentów,
gdy chcesz, aby wyniki ukończenia dotarły jako następna wiadomość zamiast
budować pętle odpytywania.

`subagents` to pomocnicze narzędzie płaszczyzny sterowania dla już uruchomionych
podagentów OpenClaw. Obsługuje:

- `action: "list"` do sprawdzania aktywnych/najnowszych uruchomień
- `action: "steer"` do wysyłania dalszych wskazówek do działającego potomka
- `action: "kill"` do zatrzymania jednego potomka albo `all`

## Uruchamianie podagentów

`sessions_spawn` domyślnie tworzy izolowaną sesję dla zadania w tle.
Zawsze działa nieblokująco -- zwraca natychmiast `runId` i `childSessionKey`.

Kluczowe opcje:

- `runtime: "subagent"` (domyślnie) albo `"acp"` dla zewnętrznych agentów uprzęży.
- Nadpisania `model` i `thinking` dla sesji potomnej.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itp.).
- `sandbox: "require"`, aby wymusić sandboxing na potomku.
- `context: "fork"` dla natywnych podagentów, gdy potomek potrzebuje bieżącej
  transkrypcji żądającego; pomiń to albo użyj `context: "isolated"` dla czystego potomka.

Domyślne liściowe podagenty nie otrzymują narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, podagenty-orkiestratory na głębokości 1 dodatkowo
otrzymują `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`,
aby mogły zarządzać własnymi potomkami. Uruchomienia liściowe nadal nie
otrzymują rekurencyjnych narzędzi orkiestracji.

Po ukończeniu krok ogłoszenia publikuje wynik w kanale żądającego. Dostarczenie
ukończenia zachowuje trasowanie powiązanego wątku/tematu, gdy jest dostępne, a
jeśli źródło ukończenia identyfikuje tylko kanał, OpenClaw nadal może ponownie
użyć zapisanej trasy sesji żądającego (`lastChannel` / `lastTo`) do bezpośredniego
dostarczenia.

Zachowanie specyficzne dla ACP opisano w [Agenci ACP](/pl/tools/acp-agents).

## Widoczność

Narzędzia sesji są ograniczane zakresem, aby ograniczyć to, co agent może zobaczyć:

| Poziom  | Zakres                                   |
| ------- | ---------------------------------------- |
| `self`  | Tylko bieżąca sesja                      |
| `tree`  | Bieżąca sesja + uruchomione podagenty    |
| `agent` | Wszystkie sesje tego agenta              |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Domyślnie używane jest `tree`. Sesje sandboxowane są ograniczane do `tree`
niezależnie od konfiguracji.

## Dalsza lektura

- [Zarządzanie sesjami](/pl/concepts/session) -- trasowanie, cykl życia, konserwacja
- [Agenci ACP](/pl/tools/acp-agents) -- uruchamianie zewnętrznych uprzęży
- [Wielu agentów](/pl/concepts/multi-agent) -- architektura wielu agentów
- [Konfiguracja Gateway](/pl/gateway/configuration) -- pokrętła konfiguracji narzędzi sesji

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
