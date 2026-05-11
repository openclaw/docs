---
read_when:
    - Chcesz zrozumieć, jakimi narzędziami sesji dysponuje agent
    - Chcesz skonfigurować dostęp między sesjami lub tworzenie podagentów
    - Chcesz sprawdzić status lub kontrolować uruchomionych subagentów
summary: Narzędzia agenta do obsługi statusu między sesjami, przywoływania informacji, komunikacji i orkiestracji podagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-05-11T20:28:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw udostępnia agentom narzędzia do pracy między sesjami, sprawdzania statusu i
orkiestrowania podagentów.

## Dostępne narzędzia

| Narzędzie          | Co robi                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Wyświetla sesje z opcjonalnymi filtrami (rodzaj, etykieta, agent, aktualność, podgląd) |
| `sessions_history` | Odczytuje transkrypcję konkretnej sesji                                     |
| `sessions_send`    | Wysyła wiadomość do innej sesji i opcjonalnie czeka                         |
| `sessions_spawn`   | Uruchamia izolowaną sesję podagenta do pracy w tle                          |
| `sessions_yield`   | Kończy bieżącą turę i czeka na wyniki uzupełniające od podagentów           |
| `subagents`        | Wyświetla, steruje lub zabija uruchomionych podagentów dla tej sesji        |
| `session_status`   | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu dla sesji |

Te narzędzia nadal podlegają aktywnemu profilowi narzędzi oraz zasadom
zezwalania/odmowy. `tools.profile: "coding"` obejmuje pełny zestaw orkiestracji
sesji, w tym `sessions_spawn`, `sessions_yield` i `subagents`.
`tools.profile: "messaging"` obejmuje narzędzia komunikacji między sesjami
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), ale
nie obejmuje uruchamiania podagentów. Aby zachować profil wiadomości i nadal
zezwalać na natywną delegację, dodaj:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Zasady grupy, dostawcy, piaskownicy i poszczególnych agentów mogą nadal usuwać
te narzędzia po etapie profilu. Użyj `/tools` z danej sesji, aby sprawdzić
efektywną listę narzędzi.

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje wraz z ich kluczem, agentId, rodzajem, kanałem, modelem,
liczbą tokenów i znacznikami czasu. Filtruj według rodzaju (`main`, `group`, `cron`, `hook`,
`node`), dokładnej wartości `label`, dokładnej wartości `agentId`, tekstu wyszukiwania lub aktualności
(`activeMinutes`). Gdy potrzebujesz triage'u w stylu skrzynki odbiorczej, może też poprosić o
pochodny tytuł ograniczony widocznością, fragment podglądu ostatniej wiadomości lub ograniczone
ostatnie wiadomości w każdym wierszu. Tytuły pochodne i podglądy są tworzone tylko dla
sesji, które wywołujący może już widzieć zgodnie ze skonfigurowanymi zasadami widoczności
narzędzi sesji, więc niepowiązane sesje pozostają ukryte.

`sessions_history` pobiera transkrypcję konwersacji dla konkretnej sesji.
Domyślnie wyniki narzędzi są wykluczone -- przekaż `includeTools: true`, aby je zobaczyć.
Zwracany widok jest celowo ograniczony i filtrowany pod kątem bezpieczeństwa:

- tekst asystenta jest normalizowany przed przywołaniem:
  - tagi myślenia są usuwane
  - bloki szkieletu `<relevant-memories>` / `<relevant_memories>` są usuwane
  - bloki ładunków XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, są usuwane, w tym obcięte
    ładunki, które nigdy nie zamykają się poprawnie
  - zdegradowany szkielet wywołań/wyników narzędzi, taki jak `[Tool Call: ...]`,
    `[Tool Result ...]` i `[Historical context ...]`, jest usuwany
  - ujawnione tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty pełnej szerokości `<｜...｜>` są usuwane
  - niepoprawnie sformułowany XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` /
    `</minimax:tool_call>`, jest usuwany
- tekst przypominający dane uwierzytelniające/tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są obcinane
- bardzo duże historie mogą pomijać starsze wiersze lub zastąpić zbyt duży wiersz tekstem
  `[sessions_history omitted: message too large]`
- narzędzie raportuje flagi podsumowania, takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` i `bytes`

Oba narzędzia akceptują **klucz sesji** (np. `"main"`) albo **ID sesji**
z poprzedniego wywołania listy.

Jeśli potrzebujesz transkrypcji dokładnie bajt po bajcie, sprawdź plik transkrypcji na
dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Wyślij i zapomnij:** ustaw `timeoutSeconds: 0`, aby dodać do kolejki i wrócić
  natychmiast.
- **Czekaj na odpowiedź:** ustaw limit czasu i otrzymaj odpowiedź inline.

Sesje czatu ograniczone do wątku, takie jak klucze Slack lub Discord kończące się na
`:thread:<id>`, nie są prawidłowymi celami `sessions_send`. Użyj klucza sesji kanału nadrzędnego
do koordynacji między agentami, aby wiadomości kierowane przez narzędzia nie pojawiały się
w aktywnym wątku widocznym dla człowieka.

Wiadomości i odpowiedzi uzupełniające A2A są oznaczane jako dane między sesjami w
prompcie odbiorcy (`[Inter-session message ... isUser=false]`) oraz w pochodzeniu transkrypcji.
Agent odbierający powinien traktować je jako dane kierowane przez narzędzie, a nie jako
bezpośrednią instrukcję napisaną przez użytkownika końcowego.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę odpowiedzi zwrotnej**, w której
agenci naprzemiennie wysyłają wiadomości (do `session.agentToAgent.maxPingPongTurns`, zakres
0-20, domyślnie 5). Agent docelowy może odpowiedzieć
`REPLY_SKIP`, aby zakończyć wcześniej.

## Pomocniki statusu i orkiestracji

`session_status` to lekkie narzędzie równoważne `/status` dla bieżącej
lub innej widocznej sesji. Raportuje użycie, czas, stan modelu/runtime oraz
powiązany kontekst zadania w tle, jeśli istnieje. Podobnie jak `/status`, może uzupełnić
rzadkie liczniki tokenów/pamięci podręcznej na podstawie najnowszego wpisu użycia w transkrypcji, a
`model=default` czyści nadpisanie dla sesji. Użyj `sessionKey="current"` dla
bieżącej sesji wywołującego; widoczne etykiety klientów, takie jak `openclaw-tui`, nie są
kluczami sesji.

`sessions_yield` celowo kończy bieżącą turę, aby następna wiadomość mogła być
zdarzeniem uzupełniającym, na które czekasz. Użyj go po uruchomieniu podagentów, gdy
chcesz, aby wyniki ukończenia przyszły jako następna wiadomość zamiast budować
pętle odpytywania.

`subagents` to pomocnik warstwy sterowania dla już uruchomionych podagentów
OpenClaw. Obsługuje:

- `action: "list"` do sprawdzania aktywnych/ostatnich uruchomień
- `action: "steer"` do wysyłania dalszych wskazówek do działającego dziecka
- `action: "kill"` do zatrzymania jednego dziecka lub `all`

## Uruchamianie podagentów

`sessions_spawn` domyślnie tworzy izolowaną sesję dla zadania w tle.
Zawsze działa nieblokująco -- zwraca natychmiast `runId` i
`childSessionKey`.

Kluczowe opcje:

- `runtime: "subagent"` (domyślnie) lub `"acp"` dla zewnętrznych agentów uprzęży.
- Nadpisania `model` i `thinking` dla sesji dziecka.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itd.).
- `sandbox: "require"`, aby wymusić piaskownicę na dziecku.
- `context: "fork"` dla natywnych podagentów, gdy dziecko potrzebuje bieżącej
  transkrypcji żądającego; pomiń to lub użyj `context: "isolated"` dla czystego dziecka.
  Natywne podagenty powiązane z wątkiem domyślnie używają `context: "fork"`, chyba że
  `threadBindings.defaultSpawnContext` mówi inaczej.

Domyślne podagenty-liście nie otrzymują narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, podagenty-orkiestratory głębokości 1 dodatkowo otrzymują
`sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogły
zarządzać własnymi dziećmi. Uruchomienia-liście nadal nie otrzymują rekurencyjnych
narzędzi orkiestracji.

Po ukończeniu krok ogłoszenia publikuje wynik w kanale żądającego.
Dostarczenie ukończenia zachowuje powiązane routowanie wątku/tematu, gdy jest dostępne, a jeśli
źródło ukończenia identyfikuje tylko kanał, OpenClaw nadal może ponownie użyć
zapisanej trasy sesji żądającego (`lastChannel` / `lastTo`) do bezpośredniego
dostarczenia.

Informacje o zachowaniu specyficznym dla ACP znajdziesz w [Agentach ACP](/pl/tools/acp-agents).

## Widoczność

Narzędzia sesji są ograniczone zakresem, aby ograniczyć to, co agent może widzieć:

| Poziom  | Zakres                                   |
| ------- | ---------------------------------------- |
| `self`  | Tylko bieżąca sesja                      |
| `tree`  | Bieżąca sesja + uruchomione podagenty    |
| `agent` | Wszystkie sesje tego agenta              |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Domyślna wartość to `tree`. Sesje w piaskownicy są ograniczane do `tree` niezależnie od
konfiguracji.

## Dalsza lektura

- [Zarządzanie sesjami](/pl/concepts/session) -- routowanie, cykl życia, utrzymanie
- [Agenci ACP](/pl/tools/acp-agents) -- uruchamianie zewnętrznej uprzęży
- [Wielu agentów](/pl/concepts/multi-agent) -- architektura wielu agentów
- [Konfiguracja Gateway](/pl/gateway/configuration) -- pokrętła konfiguracji narzędzi sesji

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
