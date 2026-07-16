---
read_when:
    - Potrzebny jest dokładny opis krok po kroku pętli agenta lub zdarzeń cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisywanie transkrypcji lub działanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-07-16T18:16:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agenta to serializowane, wykonywane osobno dla każdej sesji uruchomienie, które przekształca wiadomość w
działania i odpowiedź: odbiór, składanie kontekstu, wnioskowanie modelu, wykonywanie
narzędzi, strumieniowanie, utrwalanie.

## Punkty wejścia

- RPC Gateway: `agent` i `agent.wait`.
- CLI: `openclaw agent`.

## Sekwencja uruchomienia

1. RPC `agent` weryfikuje parametry, rozpoznaje sesję (`sessionKey`/`sessionId`), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` wykonuje turę: rozpoznaje model oraz domyślne ustawienia myślenia/szczegółowości/śledzenia, ładuje migawkę Skills, wywołuje `runEmbeddedAgent` i emituje zastępcze zdarzenie **końca/błędu cyklu życia**, jeśli osadzona pętla jeszcze go nie wyemitowała.
3. `runEmbeddedAgent`: serializuje uruchomienia za pomocą kolejek dla poszczególnych sesji i kolejki globalnej, rozpoznaje model oraz profil uwierzytelniania, tworzy sesję OpenClaw, subskrybuje zdarzenia środowiska wykonawczego, strumieniuje przyrosty asystenta/narzędzi, wymusza limit czasu uruchomienia (przerywając po jego upływie) oraz zwraca ładunki wraz z metadanymi użycia. W przypadku tur serwera aplikacji Codex przerywa również zaakceptowaną turę, która przed zdarzeniem końcowym przestaje generować informacje o postępie serwera aplikacji.
4. `subscribeEmbeddedAgentSession` przekazuje zdarzenia środowiska wykonawczego do strumienia `agent`: zdarzenia narzędzi do `stream: "tool"`, przyrosty asystenta do `stream: "assistant"`, a zdarzenia cyklu życia do `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) czeka na **koniec/błąd cyklu życia** w `runId` i zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Kolejkowanie i współbieżność

Uruchomienia są serializowane według klucza sesji (tor sesji), a opcjonalnie także za pośrednictwem toru globalnego, co zapobiega konfliktom między narzędziami i sesjami. Kanały wiadomości wybierają tryb kolejki (sterowanie/kolejna odpowiedź/zbieranie/przerwanie), który zasila ten system torów; zobacz [Kolejka poleceń](/pl/concepts/queue).

Zapisy transkrypcji są dodatkowo chronione blokadą zapisu sesji na pliku sesji. Blokada uwzględnia procesy i jest oparta na pliku, dzięki czemu wykrywa procesy zapisujące, które omijają kolejkę wewnątrzprocesową lub pochodzą z innego procesu. Procesy zapisujące czekają do `session.writeLock.acquireTimeoutMs` (domyślnie `60000` ms; nadpisanie przez zmienną środowiskową `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`), zanim zgłoszą, że sesja jest zajęta.

Blokady zapisu sesji są domyślnie niewspółbieżne. Funkcja pomocnicza, która celowo zagnieżdża uzyskanie tej samej blokady przy zachowaniu jednego logicznego procesu zapisującego, musi jawnie włączyć `allowReentrant: true`.

## Przygotowanie sesji i przestrzeni roboczej

- Przestrzeń robocza jest rozpoznawana i tworzona; uruchomienia w piaskownicy mogą być przekierowywane do głównego katalogu przestrzeni roboczej piaskownicy.
- Skills są ładowane (lub ponownie używane z migawki) i wstrzykiwane do środowiska oraz promptu.
- Pliki inicjalizacyjne/kontekstowe są rozpoznawane i wstrzykiwane do promptu systemowego.
- Przed rozpoczęciem strumieniowania uzyskiwana jest blokada zapisu sesji i przygotowywane jest miejsce docelowe transkrypcji sesji. Każda późniejsza ścieżka przepisywania, Compaction lub skracania transkrypcji musi uzyskać tę samą blokadę przed zmodyfikowaniem wierszy transkrypcji SQLite.

## Składanie promptu

Prompt systemowy jest tworzony z podstawowego promptu OpenClaw, promptu Skills, kontekstu inicjalizacyjnego oraz nadpisań dla poszczególnych uruchomień. Wymuszane są limity właściwe dla modelu i tokeny rezerwowe Compaction. Informacje o tym, co widzi model, zawiera sekcja [Prompt systemowy](/pl/concepts/system-prompt).

## Hooki

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Pluginów**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzia i potoku Gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: działa podczas tworzenia plików inicjalizacyjnych, zanim prompt systemowy zostanie sfinalizowany. Służy do dodawania lub usuwania plików kontekstu inicjalizacyjnego.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokumentację hooków).

Instrukcje konfiguracji i przykłady zawiera sekcja [Hooki](/pl/automation/hooks).

### Hooki Pluginów

Działają one wewnątrz pętli agenta lub potoku Gateway:

| Hook                                                    | Kiedy działa                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozpoznaniem.                                                                                                                                                                                              |
| `before_prompt_build`                                   | Po załadowaniu sesji (z `messages`), aby przed przesłaniem wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext`. Używaj `prependContext` do dynamicznego tekstu dla poszczególnych tur, a pól kontekstu systemowego do stabilnych wskazówek należących do przestrzeni promptu systemowego. |
| `before_agent_start`                                    | Hook zgodności ze starszymi wersjami, który może działać w dowolnej fazie; preferowane są powyższe jawne hooki.                                                                                                                                                                                 |
| `before_agent_reply`                                    | Po działaniach wbudowanych, przed wywołaniem LLM. Umożliwia Pluginowi przejęcie tury i zwrócenie syntetycznej odpowiedzi lub całkowite jej wyciszenie.                                                                                                                                          |
| `agent_end`                                             | Po zakończeniu, z końcową listą wiadomości i metadanymi uruchomienia.                                                                                                                                                                                                                         |
| `before_compaction` / `after_compaction`                | Obserwuje lub opisuje cykle Compaction.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Przechwytuje parametry/wyniki narzędzi.                                                                                                                                                                                                                                                      |
| `before_install`                                        | Po zastosowaniu zasad instalacji operatora, na przygotowanym materiale instalacyjnym Skills/Pluginu, gdy hooki Pluginów są załadowane w bieżącym procesie.                                                                                                                                     |
| `tool_result_persist`                                   | Synchronicznie przekształca wyniki narzędzi przed ich zapisaniem w transkrypcji sesji należącej do OpenClaw.                                                                                                                                                                                    |
| `message_received` / `message_sending` / `message_sent` | Hooki wiadomości przychodzących i wychodzących.                                                                                                                                                                                                                                              |
| `session_start` / `session_end`                         | Granice cyklu życia sesji.                                                                                                                                                                                                                                                                   |
| `gateway_start` / `gateway_stop`                        | Zdarzenia cyklu życia Gateway.                                                                                                                                                                                                                                                               |

Reguły decyzyjne hooków dla zabezpieczeń wiadomości wychodzących/narzędzi:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje procedury obsługi o niższym priorytecie. `{ block: false }` nie wykonuje żadnej operacji i nie usuwa wcześniejszej blokady.
- `before_install`: taka sama semantyka zakończenia/braku operacji jak powyżej. Do należących do operatora decyzji o zezwoleniu na instalację lub jej zablokowaniu, które muszą obejmować ścieżki instalacji i aktualizacji CLI, używaj `security.installPolicy`, a nie `before_install`.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje procedury obsługi o niższym priorytecie. `{ cancel: false }` nie wykonuje żadnej operacji i nie usuwa wcześniejszego anulowania.

Interfejs API hooków i szczegóły rejestracji zawiera sekcja [Hooki Pluginów](/pl/plugins/hooks).

Środowiska testowe mogą dostosowywać te hooki. Środowisko testowe serwera aplikacji Codex zachowuje hooki Pluginów OpenClaw jako kontrakt zgodności dla udokumentowanych, odwzorowanych powierzchni; natywne hooki Codex są odrębnym mechanizmem Codex niższego poziomu.

## Strumieniowanie

- Przyrosty asystenta są strumieniowane ze środowiska wykonawczego agenta jako zdarzenia `assistant`.
- Strumieniowanie blokowe może emitować częściowe odpowiedzi w `text_end` lub `message_end`.
- Strumieniowanie rozumowania może stanowić oddzielny strumień lub odpowiedzi blokowe.
- Informacje o porcjowaniu i zachowaniu odpowiedzi blokowych zawiera sekcja [Strumieniowanie](/pl/concepts/streaming).

## Wykonywanie narzędzi

- Zdarzenia rozpoczęcia/aktualizacji/zakończenia narzędzia są emitowane w strumieniu `tool`.
- Przed rejestrowaniem/emitowaniem wyniki narzędzi są oczyszczane pod kątem rozmiaru i ładunków obrazów.
- Wysłania przez narzędzia wiadomości są śledzone, aby pomijać zduplikowane potwierdzenia asystenta.

## Kształtowanie odpowiedzi

Końcowe ładunki są składane z tekstu asystenta (oraz opcjonalnego rozumowania), wbudowanych podsumowań narzędzi (gdy szczegółowość jest włączona i jest to dozwolone) oraz tekstu błędu asystenta, gdy model zgłosi błąd.

- Dokładny token ciszy `NO_REPLY` jest odfiltrowywany z wychodzących ładunków.
- Duplikaty narzędzi wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostały żadne ładunki możliwe do wyrenderowania, a narzędzie zgłosiło błąd, emitowana jest zastępcza odpowiedź o błędzie narzędzia, chyba że narzędzie wiadomości wysłało już odpowiedź widoczną dla użytkownika.

## Compaction i ponowne próby

Automatyczna Compaction emituje zdarzenia strumienia `compaction` i może wywołać ponowną próbę. Podczas ponownej próby bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanych danych wyjściowych. Zobacz [Compaction](/pl/concepts/compaction).

## Strumienie zdarzeń

- `lifecycle`: emitowane przez `subscribeEmbeddedAgentSession` (oraz zastępczo przez `agentCommand`).
- `assistant`: strumieniowane przyrosty ze środowiska wykonawczego agenta.
- `tool`: strumieniowane zdarzenia narzędzi ze środowiska wykonawczego agenta.

Gateway odwzorowuje zdarzenia cyklu życia oraz rozpoczęcia/zakończenia działania narzędzia na ograniczony,
zawierający wyłącznie metadane [rejestr audytu](/pl/cli/audit). To odwzorowanie rejestruje pochodzenie i
kody wyników bez kopiowania promptów, wiadomości, argumentów narzędzi, wyników narzędzi
ani nieprzetworzonych błędów poza ścieżkę transkrypcji/środowiska wykonawczego.

## Obsługa kanału czatu

Przyrosty asystenta są buforowane w wiadomościach czatu `delta`. Zdarzenie `final` czatu jest emitowane przy **końcu/błędzie cyklu życia**.

## Limity czasu

| Limit czasu                                          | Wartość domyślna                                | Uwagi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Dotyczy tylko oczekiwania; parametr `timeoutMs` zastępuje tę wartość. Nie zatrzymuje bazowego uruchomienia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Czas działania agenta (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Wymuszany przez czasomierz przerwania `runEmbeddedAgent`. Ustaw `0`, aby uzyskać nieograniczony budżet czasu uruchomienia; mechanizmy nadzoru aktywności strumienia modelu nadal obowiązują.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Izolowana tura agenta Cron                         | zarządzany przez Cron                          | Harmonogram uruchamia własny czasomierz w chwili rozpoczęcia wykonywania, przerywa uruchomienie po upływie skonfigurowanego terminu, a następnie wykonuje ograniczone czasowo czyszczenie przed zarejestrowaniem przekroczenia limitu czasu, aby nieaktualna sesja podrzędna nie mogła zablokować kolejki.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Limit bezczynności modelu                               | Chmura 120s; hosting własny 300s           | OpenClaw przerywa żądanie do modelu, jeśli przed upływem okna bezczynności nie nadejdą żadne fragmenty odpowiedzi. `models.providers.<id>.timeoutSeconds` wydłuża ten nadzorczy limit bezczynności dla powolnych dostawców lokalnych lub hostowanych samodzielnie, ale pozostaje ograniczony przez każdy niższy, skończony limit `agents.defaults.timeoutSeconds` lub limit właściwy dla danego uruchomienia, ponieważ obejmują one całe uruchomienie agenta. Nieograniczone budżety czasu uruchomienia nadal zachowują limit bezczynności właściwy dla klasy dostawcy. Uruchomienia modeli chmurowych wyzwalane przez Cron bez jawnego limitu czasu modelu lub agenta używają tej samej wartości domyślnej; przy jawnym limicie czasu uruchomienia Cron zastoje strumienia modelu chmurowego są ograniczone do 60s, aby skonfigurowane modele rezerwowe mogły zostać uruchomione przed zewnętrznym terminem Cron. Uruchomienia wyzwalane przez Cron na rzeczywiście lokalnych punktach końcowych (baseUrl pętli zwrotnej/prywatny) zachowują lokalne wyłączenie limitu bezczynności; dostawcy hostowani samodzielnie pod sieciowymi adresami baseUrl otrzymują niejawny limit nadzorczy 300s. Przy jawnym limicie czasu uruchomienia Cron lokalne zastoje i zastoje dostawców hostowanych samodzielnie są ograniczone do tego limitu. Ustaw `models.providers.<id>.timeoutSeconds` dla powolnych dostawców lokalnych. |
| Limit czasu żądania HTTP dostawcy                    | `models.providers.<id>.timeoutSeconds` | Obejmuje połączenie, nagłówki, treść, limit czasu żądania SDK, obsługę przerwania zabezpieczonego pobierania oraz nadzorczy limit bezczynności strumienia modelu dla tego dostawcy. Należy użyć go dla powolnych dostawców lokalnych lub hostowanych samodzielnie (na przykład Ollama), zanim zostanie zwiększony limit całkowitego czasu działania agenta; gdy żądanie do modelu musi działać dłużej, limit czasu agenta lub środowiska uruchomieniowego powinien być co najmniej równie wysoki.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Diagnostyka zablokowanych sesji

Po włączeniu diagnostyki `diagnostics.stuckSessionWarnMs` (domyślnie `120000` ms) klasyfikuje długotrwałe sesje `processing`, w których nie zaobserwowano odpowiedzi, narzędzia, stanu, blokady ani postępu ACP:

- Aktywne osadzone uruchomienia oraz wywołania modeli i narzędzi są zgłaszane jako `session.long_running`. Zarządzane bezgłośne wywołania modeli pozostają `session.long_running` do wartości `diagnostics.stuckSessionAbortMs`, aby powolni lub niestrumieniowi dostawcy nie byli zbyt wcześnie oznaczani jako zablokowani.
- Aktywna praca bez niedawnego postępu jest zgłaszana jako `session.stalled`. Zarządzane wywołania modeli przełączają się na `session.stalled` po osiągnięciu progu przerwania; nieaktualna aktywność modeli lub narzędzi bez właściciela nie jest ukrywana jako długotrwała.
- `session.stuck` jest zarezerwowane dla możliwych do naprawienia nieaktualnych danych ewidencyjnych sesji, w tym bezczynnych sesji w kolejce z nieaktualną aktywnością modeli lub narzędzi bez właściciela.

`diagnostics.stuckSessionAbortMs` ma wartość domyślną wynoszącą co najmniej 5 minut i trzykrotność progu ostrzeżenia. Nieaktualne dane ewidencyjne sesji zwalniają odpowiednią kolejkę sesji natychmiast po pomyślnym przejściu mechanizmów kontrolnych odzyskiwania; zablokowane osadzone uruchomienia są przerywane i opróżniane dopiero po osiągnięciu progu przerwania, dzięki czemu praca w kolejce jest wznawiana bez odcinania uruchomień, które są jedynie powolne. Odzyskiwanie emituje ustrukturyzowane wyniki żądania i ukończenia; stan diagnostyczny jest oznaczany jako bezczynny tylko wtedy, gdy ta sama generacja przetwarzania jest nadal bieżąca, a powtarzające się diagnostyki `session.stuck` stosują coraz dłuższe odstępy, dopóki sesja pozostaje niezmieniona.

## Gdzie proces może zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway lub limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) - dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) - skrypty sterowane zdarzeniami, wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) - sposób podsumowywania długich rozmów
- [Zatwierdzanie wykonywania](/pl/tools/exec-approvals) - bramki zatwierdzania poleceń powłoki
- [Myślenie](/pl/tools/thinking) - konfiguracja poziomu myślenia/rozumowania
