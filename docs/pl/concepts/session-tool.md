---
read_when:
    - Chcesz zrozumieć, jakie narzędzia sesji ma agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie subagentów
    - Chcesz sprawdzić status uruchomionego subagenta
summary: Narzędzia agenta do statusu między sesjami, przywoływania, komunikacji i orkiestracji podagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-06-27T17:29:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw daje agentom narzędzia do pracy między sesjami, sprawdzania statusu i
orkiestrowania podagentów.

## Dostępne narzędzia

| Narzędzie          | Co robi                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Wyświetla sesje z opcjonalnymi filtrami (rodzaj, etykieta, agent, ostatnia aktywność, podgląd) |
| `sessions_history` | Odczytuje transkrypt konkretnej sesji                                       |
| `sessions_send`    | Wysyła wiadomość do innej sesji i opcjonalnie czeka                         |
| `sessions_spawn`   | Uruchamia izolowaną sesję podagenta do pracy w tle                          |
| `sessions_yield`   | Kończy bieżącą turę i czeka na dalsze wyniki podagentów                     |
| `subagents`        | Wyświetla status uruchomionych podagentów dla tej sesji                     |
| `session_status`   | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu dla sesji |

Te narzędzia nadal podlegają aktywnemu profilowi narzędzi oraz zasadom
zezwalania/odmawiania. `tools.profile: "coding"` obejmuje pełny zestaw
orkiestrowania sesji, w tym `sessions_spawn`, `sessions_yield` i `subagents`.
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

Zasady grupy, providera, sandboxa i poszczególnych agentów mogą nadal usuwać te
narzędzia po etapie profilu. Użyj `/tools` w danej sesji, aby sprawdzić
efektywną listę narzędzi.

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje wraz z ich kluczem, agentId, rodzajem, kanałem,
modelem, licznikami tokenów i znacznikami czasu. Filtruj według rodzaju
(`main`, `group`, `cron`, `hook`, `node`), dokładnej wartości `label`, dokładnej
wartości `agentId`, tekstu wyszukiwania lub ostatniej aktywności
(`activeMinutes`). Gdy potrzebujesz triage'u w stylu skrzynki odbiorczej, może
też poprosić o tytuł pochodny ograniczony widocznością, podgląd fragmentu
ostatniej wiadomości albo ograniczoną liczbę ostatnich wiadomości w każdym
wierszu. Tytuły pochodne i podglądy są tworzone tylko dla sesji, które wywołujący
już może zobaczyć zgodnie ze skonfigurowaną zasadą widoczności narzędzi sesji,
więc niepowiązane sesje pozostają ukryte. Gdy widoczność jest ograniczona,
`sessions_list` zwraca opcjonalne metadane `visibility`, pokazujące efektywny
tryb i ostrzeżenie, że wyniki mogą być ograniczone zakresem.

`sessions_history` pobiera transkrypt rozmowy dla konkretnej sesji.
Domyślnie wyniki narzędzi są wykluczone -- przekaż `includeTools: true`, aby je
zobaczyć. Zwracany widok jest celowo ograniczony i filtrowany pod kątem
bezpieczeństwa:

- tekst asystenta jest normalizowany przed przywołaniem:
  - tagi myślenia są usuwane
  - bloki szkieletowe `<relevant-memories>` / `<relevant_memories>` są usuwane
  - bloki payloadów XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, są usuwane, w tym ucięte
    payloady, które nigdy nie zamykają się poprawnie
  - zdegradowane szkielety wywołań/wyników narzędzi, takie jak `[Tool Call: ...]`,
    `[Tool Result ...]` i `[Historical context ...]`, są usuwane
  - ujawnione tokeny sterowania modelem, takie jak `<|assistant|>`, inne tokeny
    ASCII `<|...|>` oraz warianty pełnej szerokości `<｜...｜>`, są usuwane
  - niepoprawny XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` /
    `</minimax:tool_call>`, jest usuwany
- tekst przypominający dane uwierzytelniające/tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są obcinane
- bardzo duże historie mogą pomijać starsze wiersze albo zastępować zbyt duży
  wiersz tekstem `[sessions_history omitted: message too large]`
- narzędzie raportuje flagi podsumowania, takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` i `bytes`

Oba narzędzia akceptują **klucz sesji** (np. `"main"`) albo **ID sesji** z
poprzedniego wywołania listy.

Jeśli potrzebujesz transkryptu dokładnie bajt po bajcie, sprawdź plik
transkryptu na dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Wyślij i zapomnij:** ustaw `timeoutSeconds: 0`, aby dodać do kolejki i
  natychmiast wrócić.
- **Czekaj na odpowiedź:** ustaw limit czasu i otrzymaj odpowiedź inline.

Sesje czatu ograniczone do wątku, takie jak klucze Slack lub Discord kończące
się na `:thread:<id>`, nie są prawidłowymi celami `sessions_send`. Użyj klucza
sesji kanału nadrzędnego do koordynacji między agentami, aby wiadomości
trasowane przez narzędzia nie pojawiały się w aktywnym wątku widocznym dla
człowieka.

Wiadomości i dalsze odpowiedzi A2A są oznaczane jako dane między sesjami w
prompcie odbiorcy (`[Inter-session message ... isUser=false]`) i w proweniencji
transkryptu. Agent odbierający powinien traktować je jako dane trasowane przez
narzędzie, a nie jako bezpośrednią instrukcję napisaną przez użytkownika
końcowego.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę odpowiedzi zwrotnej**, w
której agenci wymieniają wiadomości naprzemiennie (do
`session.agentToAgent.maxPingPongTurns`, zakres 0-20, domyślnie 5). Agent
docelowy może odpowiedzieć `REPLY_SKIP`, aby zakończyć wcześniej.

## Pomocniki statusu i orkiestracji

`session_status` to lekkie narzędzie równoważne `/status` dla bieżącej albo
innej widocznej sesji. Raportuje użycie, czas, stan modelu/runtime'u oraz
powiązany kontekst zadania w tle, jeśli istnieje. Podobnie jak `/status`, może
uzupełniać rzadkie liczniki tokenów/cache'u z najnowszego wpisu użycia w
transkrypcie, a `model=default` czyści nadpisanie dla sesji. Użyj
`sessionKey="current"` dla bieżącej sesji wywołującego; widoczne etykiety
klienta, takie jak `openclaw-tui`, nie są kluczami sesji.

Gdy dostępne są metadane trasy, `session_status` zawiera też widoczny blok JSON
`Route context` oraz odpowiadające mu strukturalne pola `details`. Te pola
odróżniają klucz sesji od trasy, która obecnie obsługuje aktywne uruchomienie:

- `origin` to miejsce utworzenia sesji albo provider wywnioskowany z prefiksu
  klucza sesji możliwej do dostarczenia, gdy starszy stan nie ma zapisanych
  metadanych pochodzenia.
- `active` to bieżąca trasa aktywnego uruchomienia. Jest raportowana tylko dla
  aktywnej albo bieżącej sesji obsługiwanej teraz.
- `deliveryContext` to utrwalona trasa dostarczania zapisana w sesji, którą
  OpenClaw może ponownie wykorzystać do późniejszego dostarczania, nawet gdy
  aktywna powierzchnia się różni.

`sessions_yield` celowo kończy bieżącą turę, aby następna wiadomość mogła być
zdarzeniem follow-up, na które czekasz. Użyj go po uruchomieniu podagentów, gdy
chcesz, aby wyniki ukończenia przyszły jako następna wiadomość zamiast budować
pętle odpytywania.

`subagents` to pomocnik widoczności dla już uruchomionych podagentów OpenClaw.
Obsługuje `action: "list"` do sprawdzania aktywnych/ostatnich uruchomień.

## Uruchamianie podagentów

`sessions_spawn` domyślnie tworzy izolowaną sesję dla zadania w tle.
Zawsze działa nieblokująco -- natychmiast zwraca `runId` i `childSessionKey`.
Natywne uruchomienia podagentów otrzymują delegowane zadanie w pierwszej
widocznej wiadomości `[Subagent Task]` w sesji dziecka, natomiast prompt
systemowy przenosi tylko reguły runtime'u podagenta i kontekst trasowania.

Kluczowe opcje:

- `runtime: "subagent"` (domyślnie) albo `"acp"` dla zewnętrznych agentów harness.
- Nadpisania `model` i `thinking` dla sesji dziecka.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itd.).
- `sandbox: "require"`, aby wymusić sandboxing dla dziecka.
- `context: "fork"` dla natywnych podagentów, gdy dziecko potrzebuje bieżącego
  transkryptu zgłaszającego; pomiń go albo użyj `context: "isolated"` dla
  czystego dziecka. Natywne podagenty powiązane z wątkiem domyślnie używają
  `context: "fork"`, chyba że `threadBindings.defaultSpawnContext` stanowi
  inaczej.

Domyślne podagenty liściowe nie otrzymują narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, podagenty orkiestrujące na głębokości 1 dodatkowo
otrzymują `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`,
aby mogły zarządzać własnymi dziećmi. Uruchomienia liściowe nadal nie otrzymują
rekurencyjnych narzędzi orkiestracji.

Po ukończeniu krok ogłoszenia publikuje wynik w kanale zgłaszającego.
Dostarczanie ukończenia zachowuje powiązane trasowanie wątku/tematu, gdy jest
dostępne, a jeśli źródło ukończenia identyfikuje tylko kanał, OpenClaw nadal
może ponownie wykorzystać zapisaną trasę sesji zgłaszającego (`lastChannel` /
`lastTo`) do bezpośredniego dostarczenia.

Zachowanie specyficzne dla ACP opisano w [Agenci ACP](/pl/tools/acp-agents).

## Widoczność

Narzędzia sesji są ograniczane zakresem, aby kontrolować, co agent może zobaczyć:

| Poziom  | Zakres                                   |
| ------- | ---------------------------------------- |
| `self`  | Tylko bieżąca sesja                      |
| `tree`  | Bieżąca sesja + uruchomione podagenty    |
| `agent` | Wszystkie sesje tego agenta              |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Domyślnie używane jest `tree`. Sesje w sandboxie są ograniczane do `tree`
niezależnie od konfiguracji.

## Dalsza lektura

- [Zarządzanie sesjami](/pl/concepts/session) -- trasowanie, cykl życia, utrzymanie
- [Agenci ACP](/pl/tools/acp-agents) -- uruchamianie zewnętrznego harness
- [Wielu agentów](/pl/concepts/multi-agent) -- architektura wieloagentowa
- [Konfiguracja Gateway](/pl/gateway/configuration) -- ustawienia konfiguracyjne narzędzi sesji

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
