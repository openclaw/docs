---
read_when:
    - Chcesz zrozumieć, jakimi narzędziami sesji dysponuje agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie podagentów
    - Chcesz sprawdzić status lub sterować uruchomionymi subagentami
summary: Narzędzia agentów do obsługi statusu między sesjami, przywoływania, komunikacji i orkiestracji podagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-05-02T09:48:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw daje agentom narzędzia do pracy między sesjami, sprawdzania statusu i
orkiestrowania podagentów.

## Dostępne narzędzia

| Narzędzie          | Co robi                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Wyświetla listę sesji z opcjonalnymi filtrami (rodzaj, etykieta, agent, aktualność, podgląd) |
| `sessions_history` | Odczytuje transkrypcję konkretnej sesji                                     |
| `sessions_send`    | Wysyła wiadomość do innej sesji i opcjonalnie czeka                         |
| `sessions_spawn`   | Uruchamia izolowaną sesję podagenta do pracy w tle                          |
| `sessions_yield`   | Kończy bieżącą turę i czeka na dalsze wyniki podagentów                     |
| `subagents`        | Wyświetla, steruje lub zabija podagentów uruchomionych dla tej sesji        |
| `session_status`   | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu dla sesji |

Te narzędzia nadal podlegają aktywnemu profilowi narzędzi oraz polityce
zezwoleń/odmów. `tools.profile: "coding"` obejmuje pełny zestaw orkiestracji
sesji, w tym `sessions_spawn`, `sessions_yield` i `subagents`.
`tools.profile: "messaging"` obejmuje narzędzia wiadomości między sesjami
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), ale
nie obejmuje uruchamiania podagentów. Aby zachować profil wiadomości i nadal
zezwolić na natywną delegację, dodaj:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Polityki grup, dostawców, sandboxa i poszczególnych agentów nadal mogą usuwać
te narzędzia po etapie profilu. Użyj `/tools` z danej sesji, aby sprawdzić
efektywną listę narzędzi.

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje wraz z ich kluczem, agentId, rodzajem, kanałem,
modelem, licznikami tokenów i znacznikami czasu. Filtruj według rodzaju
(`main`, `group`, `cron`, `hook`, `node`), dokładnej `label`, dokładnego
`agentId`, tekstu wyszukiwania lub aktualności (`activeMinutes`). Gdy potrzebna
jest segregacja w stylu skrzynki odbiorczej, może też poprosić o pochodny tytuł
ograniczony widocznością, fragment podglądu ostatniej wiadomości lub ograniczone
ostatnie wiadomości w każdym wierszu. Pochodne tytuły i podglądy są tworzone
tylko dla sesji, które wywołujący może już widzieć zgodnie ze skonfigurowaną
polityką widoczności narzędzi sesji, więc niepowiązane sesje pozostają ukryte.

`sessions_history` pobiera transkrypcję rozmowy dla konkretnej sesji.
Domyślnie wyniki narzędzi są wykluczone -- przekaż `includeTools: true`, aby je
zobaczyć. Zwracany widok jest celowo ograniczony i filtrowany pod kątem
bezpieczeństwa:

- tekst asystenta jest normalizowany przed przywołaniem:
  - tagi myślenia są usuwane
  - bloki szkieletowe `<relevant-memories>` / `<relevant_memories>` są usuwane
  - zwykłe tekstowe bloki ładunku XML wywołań narzędzi, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, są usuwane, w tym ucięte
    ładunki, które nigdy nie zamykają się poprawnie
  - zdegradowane szkielety wywołań/wyników narzędzi, takie jak `[Tool Call: ...]`,
    `[Tool Result ...]` i `[Historical context ...]`, są usuwane
  - ujawnione tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty pełnej szerokości `<｜...｜>` są usuwane
  - zniekształcony XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` /
    `</minimax:tool_call>`, jest usuwany
- tekst przypominający poświadczenia/tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są obcinane
- bardzo duże historie mogą odrzucać starsze wiersze albo zastępować zbyt duży wiersz
  `[sessions_history omitted: message too large]`
- narzędzie zgłasza flagi podsumowania, takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` i `bytes`

Oba narzędzia akceptują **klucz sesji** (taki jak `"main"`) albo **identyfikator sesji**
z poprzedniego wywołania listy.

Jeśli potrzebujesz dokładnej transkrypcji bajt po bajcie, sprawdź plik
transkrypcji na dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Wyślij i nie czekaj:** ustaw `timeoutSeconds: 0`, aby dodać do kolejki i wrócić
  natychmiast.
- **Czekaj na odpowiedź:** ustaw limit czasu i odbierz odpowiedź inline.

Sesje czatu ograniczone do wątku, takie jak klucze Slack lub Discord kończące się
`:thread:<id>`, nie są prawidłowymi celami `sessions_send`. Używaj klucza sesji
kanału nadrzędnego do koordynacji między agentami, aby wiadomości kierowane przez
narzędzia nie pojawiały się w aktywnym wątku widocznym dla człowieka.

Wiadomości i odpowiedzi uzupełniające A2A są oznaczane jako dane między sesjami
w prompcie odbierającym (`[Inter-session message ... isUser=false]`) oraz w
pochodzeniu transkrypcji. Agent odbierający powinien traktować je jako dane
kierowane przez narzędzie, a nie jako bezpośrednią instrukcję napisaną przez
użytkownika końcowego.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę odpowiedzi zwrotnej**, w której
agenci wysyłają wiadomości naprzemiennie (do 5 tur). Agent docelowy może
odpowiedzieć `REPLY_SKIP`, aby zakończyć wcześniej.

## Pomocniki statusu i orkiestracji

`session_status` to lekkie narzędzie równoważne `/status` dla bieżącej lub innej
widocznej sesji. Raportuje użycie, czas, stan modelu/środowiska uruchomieniowego
oraz powiązany kontekst zadania w tle, jeśli istnieje. Tak jak `/status`, może
uzupełniać rzadkie liczniki tokenów/pamięci podręcznej z najnowszego wpisu użycia
transkrypcji, a `model=default` czyści nadpisanie dla sesji. Użyj
`sessionKey="current"` dla bieżącej sesji wywołującego; widoczne etykiety klienta,
takie jak `openclaw-tui`, nie są kluczami sesji.

`sessions_yield` celowo kończy bieżącą turę, aby następna wiadomość mogła być
zdarzeniem uzupełniającym, na które czekasz. Używaj go po uruchomieniu
podagentów, gdy chcesz, aby wyniki ukończenia dotarły jako następna wiadomość
zamiast budować pętle odpytywania.

`subagents` to pomocnik płaszczyzny sterowania dla już uruchomionych podagentów
OpenClaw. Obsługuje:

- `action: "list"` do sprawdzania aktywnych/ostatnich uruchomień
- `action: "steer"` do wysyłania dalszych wskazówek do działającego dziecka
- `action: "kill"` do zatrzymania jednego dziecka lub `all`

## Uruchamianie podagentów

`sessions_spawn` domyślnie tworzy izolowaną sesję dla zadania w tle.
Zawsze działa nieblokująco -- natychmiast zwraca `runId` i
`childSessionKey`.

Kluczowe opcje:

- `runtime: "subagent"` (domyślnie) albo `"acp"` dla zewnętrznych agentów uprzęży.
- Nadpisania `model` i `thinking` dla sesji dziecka.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itp.).
- `sandbox: "require"`, aby wymusić sandboxing dla dziecka.
- `context: "fork"` dla natywnych podagentów, gdy dziecko potrzebuje bieżącej
  transkrypcji żądającego; pomiń go albo użyj `context: "isolated"` dla czystego dziecka.
  Natywne podagenty powiązane z wątkiem domyślnie używają `context: "fork"`, chyba że
  `threadBindings.defaultSpawnContext` określa inaczej.

Domyślne podagenty liściowe nie otrzymują narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, podagenty orkiestratorów głębokości 1 dodatkowo otrzymują
`sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogły
zarządzać własnymi dziećmi. Uruchomienia liściowe nadal nie otrzymują rekurencyjnych
narzędzi orkiestracji.

Po ukończeniu krok ogłoszenia publikuje wynik w kanale żądającego.
Dostarczenie ukończenia zachowuje powiązane trasowanie wątku/tematu, gdy jest
dostępne, a jeśli źródło ukończenia identyfikuje tylko kanał, OpenClaw nadal może
ponownie użyć zapisanej trasy sesji żądającego (`lastChannel` / `lastTo`) do
bezpośredniego dostarczenia.

Zachowanie specyficzne dla ACP opisano w [Agentach ACP](/pl/tools/acp-agents).

## Widoczność

Narzędzia sesji są ograniczane zakresem, aby limitować to, co agent może widzieć:

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
- [Agenci ACP](/pl/tools/acp-agents) -- uruchamianie zewnętrznej uprzęży
- [Wielu agentów](/pl/concepts/multi-agent) -- architektura wielu agentów
- [Konfiguracja Gateway](/pl/gateway/configuration) -- pokrętła konfiguracji narzędzi sesji

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
