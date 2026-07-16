---
read_when:
    - Chcesz, aby agenci zauważali, gdy ludzie lub inni agenci zmieniają sesję bez ich wiedzy
    - Debugujesz powiadomienia o zmianie stanu, kursory obserwacji lub zmiany `session_status` od czasu
    - Chcesz zrozumieć, jak agenci nadrzędni zachowują synchronizację z sesjami podrzędnymi
sidebarTitle: Session state awareness
summary: 'Trwały dziennik sygnałów stanu sesji: wersje stanu, obserwatory, powiadomienia o nieaktualnym stanie i uzgadnianie stanu'
title: Świadomość stanu sesji
x-i18n:
    generated_at: "2026-07-16T18:21:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Gdy kilka sesji pracuje nad tym samym problemem — menedżer deleguje zadania sesjom podrzędnym, człowiek przechodzi bezpośrednio do sesji roboczej, dwa agenty koordynują działania za pomocą [`sessions_send`](/pl/concepts/session-tool) — każda sesja przyjmuje pewne założenia dotyczące pozostałych. Założenia te stają się nieaktualne, gdy tylko zainterweniuje inny uczestnik. Świadomość stanu sesji to mechanizm, który wykrywa interwencję, jednokrotnie informuje sesję, której ona dotyczy, i zapewnia jej łatwy sposób nadrobienia zmian przed podjęciem działania.

Współdziałają ze sobą trzy elementy:

1. **Trwały dziennik sygnałów** rejestruje wybrane zmiany stanu każdej sesji.
2. **Obserwatorzy** przechowują kursory dla poszczególnych celów i otrzymują jedno scalone powiadomienie o nieaktualnym stanie.
3. **Uzgadnianie stanu** pobiera dokładny przyrost zmian za pomocą `session_status` z `changesSince`.

## Dziennik sygnałów

OpenClaw dopisuje typowane zdarzenie do współdzielonej bazy danych stanu (`session_state_events`), gdy obserwowana sesja ulegnie istotnej zmianie. Zdarzenia zawierają metadane i jednowierszowe podsumowanie — nigdy treść wiadomości.

| Rodzaj                 | Kiedy jest rejestrowany                                  | Powiadamia obserwatorów |
| ---------------------- | -------------------------------------------------------- | ----------------------- |
| `human_direct_message` | Człowiek wysyła turę bezpośrednio do obserwowanej sesji  | Tak                     |
| `upstream_missing`     | Znika nadrzędne źródło zaadoptowanej sesji               | Tak                     |
| `goal_changed`         | Stan celu sesji zostaje utworzony, zaktualizowany lub wyczyszczony | Tak                     |
| `child_spawned`        | Zostaje utworzona sesja podagenta lub sesja podrzędna ACP | Nie (inicjuje kursor)   |
| `run_completed`        | Uruchomienie sesji podrzędnej kończy się powodzeniem     | Nie (tylko dziennik)    |
| `run_failed`           | Uruchomienie sesji podrzędnej kończy się niepowodzeniem, przekracza limit czasu lub zostaje anulowane | Nie (tylko dziennik) |
| `compacted`            | Historia sesji zostaje skompaktowana                     | Nie (tylko dziennik)    |
| `adopted`              | Sesja katalogowa zostaje zaadoptowana do OpenClaw        | Nie (tylko dziennik)    |

Każde zdarzenie wskazuje swojego uczestnika (`human`, `agent` lub `system`). Anulowane uruchomienia sesji podrzędnych i uruchomienia, które przekroczyły limit czasu, są rejestrowane jako niepowodzenia, a dokładny wynik (`cancelled`, `timeout` lub `error`) zostaje zachowany w ładunku zdarzenia.

**Wersja stanu** sesji to po prostu najwyższy numer sekwencyjny w jej dzienniku, śledzony w trwałym nagłówku każdej sesji, który zachowuje się po oczyszczaniu. Wiersze `sessions_list` zawierają `stateVersion`, gdy sesja zarejestrowała zmiany; `session_status` zawsze go zgłasza.

Rodzaje służące wyłącznie do rejestrowania istnieją na potrzeby historii uzgadniania stanu, a nie powiadomień: zwykłe dostarczanie informacji o ukończeniu uruchomienia sesji podrzędnej pozostaje zadaniem [powiadomień podagentów](/pl/tools/subagents), a dziennik sygnałów nigdy go nie powiela.

## Obserwatorzy

Obserwator to sesja przechowująca kursor (`session_watch_cursors`) celu. Kursory pochodzą z dwóch źródeł:

- **Niejawne (krawędzie tworzenia).** Gdy sesja tworzy podagenta lub sesję podrzędną ACP, kursor sesji nadrzędnej jest automatycznie inicjowany wersją stanu sesji podrzędnej z chwili jej utworzenia. Sesje nadrzędne nigdy nie subskrybują ręcznie.
- **Jawne (`sessions_send watch: true`).** Każdy koordynator może obserwować cel, którego nie utworzył: należy przekazać `watch: true` do `sessions_send`, a po pomyślnym wysłaniu nadawca zostanie zarejestrowany jako obserwator sesji, która rzeczywiście otrzymała wiadomość. Rejestracja rozpoczyna się od bieżącej wersji stanu celu — wcześniejsza historia nigdy nie generuje powiadomień. Wynik narzędzia zgłasza `watched: true|false`, gdy parametr został ustawiony.

Tożsamość obserwatora musi być kluczem sesji kwalifikowanym przez agenta. W przypadku `session.scope="global"` współdzielony klucz `global` jest niejednoznaczny między agentami, dlatego takie sesje otrzymują trwały dziennik i `changesSince`, ale nie otrzymują aktywnych powiadomień.

Obserwacje czyszczą się automatycznie: wiersze kursorów wygasają wraz z okresem przechowywania dziennika sygnałów, są usuwane po zresetowaniu sesji obserwatora i zostają usunięte wraz z dowolną z tych sesji. W wersji v1 nie ma polecenia zatrzymania obserwacji.

Obserwowane sesje zaadoptowane z katalogu sesji są sprawdzane w stałych odstępach pod kątem bezpośredniej aktywności człowieka w źródle nadrzędnym. Wykryta aktywność trafia do tego samego dziennika sygnałów i przepływu obserwatorów co inne bezpośrednie tury człowieka.

Jeśli nadrzędne źródło zaadoptowanej sesji zostanie usunięte zewnętrznie, trzy kolejne kontrole wykazujące jego brak (około trzech cykli monitora) generują jeden sygnał `upstream_missing` dla jej obserwatorów i usuwają połączenie ze źródłem nadrzędnym. Ponowne kontynuowanie sesji katalogowej tworzy nowe połączenie.

## Powiadomienia: jedno, a nie wiele

Gdy wystąpi zdarzenie kwalifikujące się do powiadomienia, a kursor obserwatora pozostaje w tyle, obserwator otrzymuje jedno powiadomienie systemowe podczas swojej następnej tury:

```
Sesja "agent:main:subagent:child" uległa zmianie (inny uczestnik). Przed podjęciem działania uzgodnij stan: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Obserwatorzy sesji głównej są również natychmiast wybudzani za pomocą Heartbeat; zagnieżdżeni obserwatorzy będący podagentami otrzymują powiadomienie podczas swojej następnej tury.

Protokół celowo zapobiega nadmiarowym powiadomieniom:

- **Jedno oczekujące powiadomienie dla każdej pary obserwator–cel.** Tekst oczekującego powiadomienia pozostaje identyczny na poziomie bajtów, a kolejka zdarzeń systemowych usuwa jego duplikaty, dlatego dwadzieścia szybkich zmian tego samego celu nadal generuje tylko jeden wiersz w monicie obserwatora.
- **Zamrożony znacznik postępu.** Kursor zamraża swoją zgłoszoną pozycję po dodaniu powiadomienia do kolejki. Kolejne istotne zdarzenia przesuwają tylko znacznik istotnych zmian; nie generują ponownych powiadomień.
- **Potwierdzenie przy pobraniu, ponowne otwarcie tylko dla przeplatających się działań.** Gdy tura obserwatora pobiera powiadomienie, kursor przesuwa się. Jeśli między dodaniem do kolejki a pobraniem wystąpiły kolejne istotne zdarzenia, dla pozostałych zmian zostaje otwarte dokładnie jedno nowe powiadomienie.
- **Pomijanie własnych działań.** Obserwator nigdy nie otrzymuje powiadomień o zdarzeniach, które sam spowodował.
- **Odzyskiwanie po ponownym uruchomieniu.** Oczekujące powiadomienia znajdują się w kolejce w pamięci; po ponownym uruchomieniu Gateway procedura startowa odtwarza je na podstawie trwałych kursorów.

## Uzgadnianie stanu

Powiadomienie dokładnie wskazuje obserwatorowi, co należy zrobić. `session_status` z `changesSince: <version>` zwraca typowane zdarzenia po tej wersji (maksymalnie 200), nie przesuwając żadnych kursorów:

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "wiadomość człowieka przez telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "cel zaktualizowany" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` oznacza, że żądana wersja jest starsza niż zachowana historia — zamiast traktować odpowiedź jako dokładny przyrost zmian, należy odświeżyć cały stan sesji (`sessions_history`, `session_status`). Sygnał luki jest dokładny: pochodzi ze znacznika oczyszczania właściwego dla danej sesji, a nie z wnioskowania na podstawie arytmetyki numerów sekwencyjnych.

## Przechowywanie i ograniczenia

Historia znajduje się we współdzielonej bazie danych stanu i jest ograniczona do 30 dni oraz 50 000 wierszy; nagłówki poszczególnych sesji pozostają monotoniczne po oczyszczaniu. Rejestrowanie odbywa się na zasadzie najlepszych starań — nieudane dopisanie jest zapisywane w dzienniku i nigdy nie powoduje niepowodzenia tury źródłowej — dlatego `stateVersion` jest nagłówkiem dziennika sygnałów, a nie transakcyjną wersją mechanizmu przechwytywania zmian danych.

Obecne ograniczenia:

- Dostarczanie powiadomień zakłada, że jeden proces Gateway jest właścicielem współdzielonej bazy danych stanu. Wiele procesów Gateway współdzieli trwały dziennik i `changesSince`, ale wersja v1 nie przesyła powiadomień między procesami.
- Zdarzenia Compaction obejmują właścicieli Compaction osadzonego środowiska wykonawczego; Compaction wykonywana wyłącznie przez natywny mechanizm nie jest w pełni rejestrowana.
- Szczegółowe ładunki wyników anulowania są obecnie generowane przez uruchomienia sesji podrzędnych ACP; anulowania natywnych podagentów są zgłaszane jako ogólne niepowodzenia.
- Wykrywanie własnego echa ze źródła nadrzędnego porównuje znormalizowany tekst użytkownika. Zewnętrzny monit odpowiadający jednej z 10 najnowszych wiadomości użytkownika po stronie OpenClaw w danej sesji jest traktowany jako własne echo.
- Pojedynczy lokalny wiersz Claude JSONL większy niż limit skanowania 1 MiB na cykl blokuje kursor tej sesji w wersji v1; niesklasyfikowane bajty nigdy nie są pomijane.
- Kontrole Claude na sparowanym węźle klasyfikują 50 najnowszych elementów transkrypcji w każdym cyklu. Większe serie mogą znaleźć się poza oknem skanowania wersji v1.
- Odczyty historii Claude na sparowanym węźle nie udostępniają jednoznacznego wyniku wskazującego, że wątek nie istnieje, dlatego zdalne usunięcia Claude nie są klasyfikowane jako `upstream_missing` w wersji v1.
- Sesje katalogowe, które nie zostały zaadoptowane, pozostają poza warstwą świadomości stanu w wersji v1.
- Sesje zaadoptowane przed wprowadzeniem tej funkcji nie mają połączenia ze źródłem nadrzędnym; należy raz kontynuować je z katalogu, aby rozpocząć monitorowanie źródła nadrzędnego.
- Połączenia ze źródłem nadrzędnym zakładają, że każdy klucz zaadoptowanej sesji jest przypisany do jednego agenta będącego właścicielem (adopcja używa domyślnego agenta magazynu). Adopcja tego samego zewnętrznego wątku przez wielu agentów nie jest monitorowana w wersji v1.

## Powiązane

- [Narzędzia sesji](/pl/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Podagenty](/pl/tools/subagents) — krawędzie tworzenia i powiadomienia o ukończeniu
- [Heartbeat](/pl/gateway/heartbeat) — sposób, w jaki oczekujące powiadomienia wybudzają sesje główne
- [Zarządzanie sesjami](/pl/concepts/session) — klucze sesji, zakresy, cykl życia
