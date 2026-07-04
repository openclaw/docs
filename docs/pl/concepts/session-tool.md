---
read_when:
    - Chcesz zrozumieć, jakimi narzędziami sesji dysponuje agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie subagentów
    - Chcesz sprawdzić stan uruchomionego subagenta
summary: Narzędzia agenta do statusu między sesjami, przywoływania informacji, komunikacji i orkiestracji podagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-07-04T20:45:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw daje agentom narzędzia do pracy między sesjami, sprawdzania statusu i
koordynowania podagentów.

## Dostępne narzędzia

| Narzędzie          | Co robi                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Wyświetla listę sesji z opcjonalnymi filtrami (rodzaj, etykieta, agent, archiwum, podgląd) |
| `sessions_history` | Odczytuje transkrypt konkretnej sesji                                        |
| `sessions_send`    | Wysyła wiadomość do innej sesji i opcjonalnie czeka                         |
| `sessions_spawn`   | Uruchamia izolowaną sesję podagenta do pracy w tle                          |
| `sessions_yield`   | Kończy bieżącą turę i czeka na dalsze wyniki podagenta                      |
| `subagents`        | Wyświetla status uruchomionych podagentów dla tej sesji                     |
| `session_status`   | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu dla sesji |

Te narzędzia nadal podlegają aktywnemu profilowi narzędzi oraz zasadom
zezwalania/odmowy. `tools.profile: "coding"` obejmuje pełny zestaw koordynacji
sesji, w tym `sessions_spawn`, `sessions_yield` i `subagents`.
`tools.profile: "messaging"` obejmuje narzędzia komunikacji między sesjami
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), ale
nie obejmuje uruchamiania podagentów. Aby zachować profil wiadomości i nadal
zezwolić na natywne delegowanie, dodaj:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Zasady grup, dostawców, piaskownicy i poszczególnych agentów nadal mogą usuwać
te narzędzia po etapie profilu. Użyj `/tools` z dotkniętej sesji, aby sprawdzić
efektywną listę narzędzi.

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje wraz z ich kluczem, agentId, rodzajem, kanałem,
modelem, licznikami tokenów i znacznikami czasu. Filtruj według rodzaju (`main`,
`group`, `cron`, `hook`, `node`), dokładnej wartości `label`, dokładnej wartości
`agentId`, tekstu wyszukiwania lub ostatniej aktywności (`activeMinutes`).
Domyślnie zwracane są aktywne sesje; przekaż `archived: true`, aby sprawdzić
zarchiwizowane sesje. Wiersze obejmują stan przypięcia i archiwizacji. Gdy
potrzebujesz triage’u w stylu skrzynki odbiorczej, narzędzie może też poprosić
o tytuł pochodny ograniczony widocznością, fragment podglądu ostatniej wiadomości
lub ograniczone najnowsze wiadomości w każdym wierszu. Tytuły pochodne i podglądy
są tworzone tylko dla sesji, które wywołujący już może widzieć zgodnie ze
skonfigurowaną zasadą widoczności narzędzi sesji, więc niepowiązane sesje
pozostają ukryte. Gdy widoczność jest ograniczona, `sessions_list` zwraca
opcjonalne metadane `visibility`, pokazujące efektywny tryb i ostrzeżenie, że
wyniki mogą być ograniczone zakresem.

`sessions_history` pobiera transkrypt rozmowy dla konkretnej sesji.
Domyślnie wyniki narzędzi są wykluczone -- przekaż `includeTools: true`, aby je
zobaczyć. Użyj `limit` dla najnowszego ograniczonego ogona. Przekaż `offset: 0`,
gdy potrzebujesz metadanych paginacji, a następnie przekazuj zwrócone wartości
`nextOffset`, aby stronicować wstecz przez starsze okna transkryptu OpenClaw bez
odczytywania surowych plików transkryptu. Jawne strony przesunięcia nie scalają
zewnętrznych importów awaryjnych CLI; użyj domyślnego widoku najnowszego ogona,
gdy potrzebujesz tej scalonej historii wyświetlania.
Zwracany widok jest celowo ograniczony i filtrowany pod kątem bezpieczeństwa:

- tekst asystenta jest normalizowany przed przywołaniem:
  - tagi myślenia są usuwane
  - bloki szkieletowe `<relevant-memories>` / `<relevant_memories>` są usuwane
  - bloki ładunku XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, są usuwane, w tym ucięte
    ładunki, które nigdy nie zamykają się poprawnie
  - zdegradowane szkielety wywołań/wyników narzędzi, takie jak `[Tool Call: ...]`,
    `[Tool Result ...]` i `[Historical context ...]`, są usuwane
  - ujawnione tokeny sterowania modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty pełnej szerokości `<｜...｜>` są usuwane
  - nieprawidłowy XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` /
    `</minimax:tool_call>`, jest usuwany
- tekst przypominający poświadczenia/tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są obcinane
- bardzo duże historie mogą pomijać starsze wiersze lub zastąpić zbyt duży wiersz
  wpisem `[sessions_history omitted: message too large]`
- narzędzie raportuje flagi podsumowania, takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes`, oraz metadane paginacji

Oba narzędzia akceptują albo **klucz sesji** (np. `"main"`), albo **identyfikator sesji**
z poprzedniego wywołania listy.

Jeśli potrzebujesz dokładnego transkryptu bajt po bajcie, sprawdź plik transkryptu
na dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Wyślij i zapomnij:** ustaw `timeoutSeconds: 0`, aby dodać do kolejki i wrócić
  natychmiast.
- **Czekaj na odpowiedź:** ustaw limit czasu i uzyskaj odpowiedź w miejscu wywołania.

Sesje czatu o zakresie wątku, takie jak klucze Slack lub Discord kończące się na
`:thread:<id>`, nie są prawidłowymi celami `sessions_send`. Użyj klucza sesji
kanału nadrzędnego do koordynacji między agentami, aby wiadomości kierowane przez
narzędzia nie pojawiały się w aktywnym wątku widocznym dla człowieka.

Wiadomości i dalsze odpowiedzi A2A są oznaczane jako dane między sesjami w
prompcie odbiorcy (`[Inter-session message ... isUser=false]`) oraz w pochodzeniu
transkryptu. Agent odbierający powinien traktować je jako dane kierowane przez
narzędzie, a nie jako bezpośrednią instrukcję napisaną przez użytkownika końcowego.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę odpowiedzi zwrotnych**, w której
agenci naprzemiennie wysyłają wiadomości (do `session.agentToAgent.maxPingPongTurns`,
zakres 0-20, domyślnie 5). Agent docelowy może odpowiedzieć
`REPLY_SKIP`, aby zakończyć wcześniej.

## Pomocniki statusu i koordynacji

`session_status` to lekkie narzędzie równoważne `/status` dla bieżącej lub innej
widocznej sesji. Raportuje użycie, czas, stan modelu/środowiska uruchomieniowego
oraz powiązany kontekst zadań w tle, gdy jest obecny. Tak jak `/status`, może
uzupełnić rzadkie liczniki tokenów/pamięci podręcznej z najnowszego wpisu użycia
transkryptu, a `model=default` czyści nadpisanie dla sesji. Użyj
`sessionKey="current"` dla bieżącej sesji wywołującego; widoczne etykiety klienta,
takie jak `openclaw-tui`, nie są kluczami sesji.

Gdy dostępne są metadane trasy, `session_status` obejmuje także widoczny blok JSON
`Route context` oraz odpowiadające mu ustrukturyzowane pola `details`. Te pola
odróżniają klucz sesji od trasy, która aktualnie obsługuje uruchomienie na żywo:

- `origin` to miejsce, w którym sesja została utworzona, albo dostawca wywnioskowany
  z prefiksu klucza sesji możliwego do dostarczenia, gdy starszy stan nie ma
  zapisanych metadanych pochodzenia.
- `active` to bieżąca trasa uruchomienia na żywo. Jest raportowana tylko dla
  sesji na żywo lub bieżącej sesji obsługiwanej teraz.
- `deliveryContext` to utrwalona trasa dostarczania zapisana w sesji,
  której OpenClaw może ponownie użyć do późniejszego dostarczenia, nawet gdy
  aktywna powierzchnia jest inna.

`sessions_yield` celowo kończy bieżącą turę, aby następną wiadomością mogło być
zdarzenie uzupełniające, na które czekasz. Użyj go po uruchomieniu podagentów, gdy
chcesz, aby wyniki zakończenia dotarły jako następna wiadomość zamiast budować
pętle odpytywania.

`subagents` to pomocnik widoczności dla już uruchomionych podagentów OpenClaw.
Obsługuje `action: "list"` do sprawdzania aktywnych/najnowszych uruchomień.

## Uruchamianie podagentów

`sessions_spawn` domyślnie tworzy izolowaną sesję dla zadania w tle.
Zawsze działa nieblokująco -- natychmiast zwraca `runId` i
`childSessionKey`. Natywne uruchomienia podagentów otrzymują oddelegowane zadanie
w pierwszej widocznej wiadomości `[Subagent Task]` sesji podrzędnej, podczas gdy
prompt systemowy przenosi tylko reguły środowiska uruchomieniowego podagenta i
kontekst routingu.

Kluczowe opcje:

- `runtime: "subagent"` (domyślnie) albo `"acp"` dla zewnętrznych agentów harness.
- Nadpisania `model` i `thinking` dla sesji podrzędnej.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itd.).
- `sandbox: "require"`, aby wymusić piaskownicę na elemencie podrzędnym.
- `context: "fork"` dla natywnych podagentów, gdy element podrzędny potrzebuje
  bieżącego transkryptu żądającego; pomiń tę opcję albo użyj `context: "isolated"`
  dla czystego elementu podrzędnego. Natywne podagenty powiązane z wątkiem
  domyślnie używają `context: "fork"`, chyba że `threadBindings.defaultSpawnContext`
  mówi inaczej.

Domyślne podagenty liściowe nie otrzymują narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, podagenty koordynujące poziomu 1 dodatkowo otrzymują
`sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogły
zarządzać własnymi elementami podrzędnymi. Uruchomienia liściowe nadal nie
otrzymują rekurencyjnych narzędzi koordynacji.

Po zakończeniu krok ogłoszenia publikuje wynik w kanale żądającego. Dostarczenie
zakończenia zachowuje powiązany routing wątku/tematu, gdy jest dostępny, a jeśli
pochodzenie zakończenia identyfikuje tylko kanał, OpenClaw nadal może ponownie
użyć zapisanej trasy sesji żądającego (`lastChannel` / `lastTo`) do bezpośredniego
dostarczenia.

Zachowanie specyficzne dla ACP opisano w [Agentach ACP](/pl/tools/acp-agents).

## Widoczność

Narzędzia sesji mają zakres ograniczający to, co agent może zobaczyć:

| Poziom  | Zakres                                   |
| ------- | ---------------------------------------- |
| `self`  | Tylko bieżąca sesja                      |
| `tree`  | Bieżąca sesja + uruchomione podagenty    |
| `agent` | Wszystkie sesje tego agenta              |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Domyślnie używane jest `tree`. Sesje w piaskownicy są ograniczane do `tree`
niezależnie od konfiguracji.

## Dalsza lektura

- [Zarządzanie sesjami](/pl/concepts/session) -- routing, cykl życia, utrzymanie
- [Agenci ACP](/pl/tools/acp-agents) -- uruchamianie zewnętrznego harness
- [Wielu agentów](/pl/concepts/multi-agent) -- architektura wielu agentów
- [Konfiguracja Gateway](/pl/gateway/configuration) -- opcje konfiguracji narzędzi sesji

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
