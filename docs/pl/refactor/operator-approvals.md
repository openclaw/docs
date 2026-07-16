---
read_when:
    - Zmiana cyklu życia zatwierdzania poleceń exec lub pluginów, pamięci, protokołu albo autoryzacji
    - Dodawanie linków zatwierdzania lub natywnych elementów sterujących zatwierdzaniem do kanału
    - Wyświetlanie zatwierdzeń sesji podrzędnych w widokach nadrzędnych lub orkiestratora
summary: Projekt trwałych zatwierdzeń obsługujących bezpośrednie odnośniki w interfejsie Control UI, aplikacjach natywnych, kanałach i sesjach nadrzędnych
title: Zatwierdzenia operatora w wielu interfejsach
x-i18n:
    generated_at: "2026-07-16T19:04:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Zatwierdzenia operatora w wielu interfejsach

Ten projekt śledzi [#103505](https://github.com/openclaw/openclaw/issues/103505). Zastępuje lokalne dla procesu uprawnienia do zatwierdzania jednym cyklem życia należącym do Gateway i opartym na SQLite. Każde należące do Gateway zatwierdzenie wykonania albo pluginu/narzędzia otrzymuje jeden stabilny identyfikator, jedną uwierzytelnioną trasę Control UI, atomowe rozstrzyganie według zasady „pierwsza odpowiedź wygrywa” oraz projekcje dostępne wyłącznie operatorom w strumieniach sesji źródłowej i nadrzędnych.

Akcje wbudowane i precyzyjne linki współistnieją. Nie ma przełącznika trybu zatwierdzania.

## Cele

- Jeden trwały obiekt zatwierdzenia dla bramek wykonania i pluginów/narzędzi.
- Stabilna trasa `${controlUiBasePath}/approve/{approvalId}`.
- Rozstrzyganie z dowolnego autoryzowanego Control UI, aplikacji natywnej lub interfejsu kanału.
- Atomowe działanie zgodne z zasadą „pierwsza odpowiedź wygrywa” w wielu współbieżnych interfejsach.
- Idempotentne identyczne ponowienia; sprzeczne późne odpowiedzi nie mogą zastąpić zwycięskiej.
- Przekroczenie limitu czasu, nieprawidłowe zaufane werdykty, brakujące trasy, anulowanie i ponowne uruchomienie powodują bezpieczne odrzucenie.
- Zdarzenia żądania i zakończenia docierają do sesji źródłowej oraz wszystkich odpowiednich właścicieli nadrzędnych/orkiestratorów.
- Kanały otrzymują typowane akcje zatwierdzania i nawigacji; dane wywołań zwrotnych transportu pozostają prywatne dla kanału.
- Istniejące metody Gateway dotyczące wykonania/pluginów pozostają zgodne, a ich implementacja zbiega się do jednej usługi.

## Poza zakresem

- Utrwalanie lub wznawianie samego zablokowanego wykonania narzędzia po ponownym uruchomieniu Gateway.
- Traktowanie identyfikatora lub adresu URL zatwierdzenia jako poświadczenia typu bearer.
- Dołączanie monitów zatwierdzenia do transkrypcji widocznych dla modelu lub wybudzanie agentów nadrzędnych.
- Przenoszenie zasad zatwierdzania, poleceń produktu lub autoryzacji recenzentów do pluginów kanałów.
- Klonowanie stanu zatwierdzenia dla każdego kanału, urządzenia lub elementu nadrzędnego.
- Przeprojektowywanie list dozwolonych operacji wykonania, kompozycji zasad pluginów lub trwałości `allow-always`, z wyjątkiem zmian wymaganych do zapewnienia jednoznaczności wyników końcowych.
- Zapewnianie zdalnego dostępu do osadzonego TUI bez Gateway w pierwszym etapie. Pozostaje ono dostępne wyłącznie lokalnie i musi bezpiecznie odrzucać żądania, gdy nie ma recenzenta.

## Stan bazowy przed wdrożeniem i mapa dowodów

Ta tabela przedstawia stan implementacji w chwili otwarcia #103505. Poniższe sekcje dotyczące wdrożenia opisują trwały rejestr, typowane akcje, stronę precyzyjnego linku oraz etapy klienta natywnego zbudowane na tym stanie bazowym.

| Interfejs           | Bazowy punkt wejścia i właściciel                                                                                                                                  | Bazowe działanie i luka                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wykonanie agenta        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | Dwufazowa rejestracja `exec.approval.*` zapobiega wczesnemu wyścigowi `/approve`, ale przekroczenie limitu czasu nadal może skutkować zezwoleniem za pośrednictwem `askFallback`.                                                        |
| Bramka narzędzia pluginu  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Żąda `plugin.approval.*`; `timeoutBehavior: "allow"` może zatwierdzić bramkę po przekroczeniu jej limitu czasu. Tryb osadzony ma oddzielne, lokalne dla procesu uprawnienia w `src/infra/embedded-plugin-approval-broker.ts`. |
| Bramka węzła pluginu  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Tworzy i rozgłasza bezpośrednio przez menedżera pluginów, powielając część cyklu życia metod serwera.                                                                                 |
| Uprawnienia Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Oddzielne menedżery wykonania i pluginów używają map lokalnych dla procesu. Wpisy końcowe są zachowywane przez 15 sekund. Zasada „pierwsza odpowiedź wygrywa” obowiązuje tylko w obrębie jednego procesu.                                          |
| Protokół Gateway  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Wykonanie ma `get` dostępne tylko dla oczekujących elementów; plugin nie ma `get`; nie istnieje niezależne od rodzaju wyszukiwanie wyniku końcowego na potrzeby precyzyjnego linku.                                                                                   |
| Dostarczanie          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Obsługuje trasowanie do źródła, wiadomości prywatne do zatwierdzających, odtwarzanie oczekujących elementów, natywne procedury obsługi oraz czyszczenie wyników końcowych w procesie. Oddzielna kolejna zmiana dodaje trwałe uzgadnianie wyników końcowych.                          |
| Przenośne akcje  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Przyciski zatwierdzania są akcjami poleceń zawierającymi `/approve ...`; cele URL i Web App są nietypowanymi polami przycisków.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Mechanizm renderujący analizuje tekst polecenia, aby rozpoznać semantykę zatwierdzania przed wygenerowaniem prywatnych danych wywołania zwrotnego.                                                                                     |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | Interfejs zatwierdzania jest globalnym oknem modalnym. `ui/src/app-route-paths.ts` i `ui/src/app-routes.ts` używają dokładnych tras i przekierowują nieznane ścieżki do czatu.                                                    |
| Własność sesji | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Istnieje własność kontrolera, żądającego, jawnego elementu nadrzędnego i starszego mechanizmu uruchamiania, ale zdarzenia zatwierdzania nie są rzutowane do tych strumieni sesji.                                                    |
| Stan współdzielony      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Istniejące transakcje natychmiastowe i aktualizacje warunkowe Kysely obsługują trwałą operację porównania i ustawienia w `state/openclaw.sqlite`.                                                                   |

Reprezentatywne bieżące testy obejmują `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` i `ui/src/e2e/approval-flow.e2e.test.ts`.

SDK pluginów pozostaje jedyną granicą kanałów/pluginów. Zmiany środowiska wykonawczego zatwierdzania i prezentacji muszą być eksportowane przez istniejące podścieżki `src/plugin-sdk/approval-*.ts` i `src/plugin-sdk/interactive-runtime.ts`; kod produkcyjny pluginów nie może importować wewnętrznych elementów Gateway.

## Istniejące rozwiązania

Omnigent zapewnia przydatne wzorce środowiska użytkownika i semantyki błędów:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) wstrzymuje ASK, stosuje limity czasu dla poszczególnych zasad i traktuje jako zatwierdzenie wyłącznie dokładną odpowiedź akceptującą.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) zawiera natywną bramkę mechanizmu testowego po stronie serwera oraz projekcję żądania/rozstrzygnięcia do elementów nadrzędnych.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) udostępnia samodzielną mobilną stronę zatwierdzania.

Nie należy bezkrytycznie kopiować jego deklaracji dotyczącej przechowywania. Bieżący aktywny stan oczekujących elementów jest lokalny dla procesu w [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), a nieużywana tabela oczekujących elementów jest usuwana przez [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). OpenClaw celowo idzie dalej: SQLite jest źródłem prawdy, a każde przejście do stanu końcowego jest operacją porównania i ustawienia w bazie danych.

## Architektura i własność

Gateway jest właścicielem cyklu życia:

1. Agent, hook pluginu lub zasada węzła dostarcza żądanie właściwe dla danego rodzaju oraz lokalne dla procesu powiązanie wykonania.
2. Gateway je weryfikuje i tworzy oczyszczoną projekcję dla recenzenta.
3. Usługa zatwierdzania oblicza grupę odbiorców źródłowych/właścicieli, wstawia rekord kanoniczny, a następnie rejestruje oczekujący mechanizm w procesie.
4. Po trwałym wstawieniu Gateway publikuje istniejące zdarzenia zatwierdzania, projekcje sesji, powiadomienia kanałów i natywne powiadomienia push.
5. Każdy interfejs rozstrzyga za pośrednictwem tej samej usługi.
6. Usługa zatwierdza jedno przejście do stanu końcowego, wybudza oczekujący mechanizm środowiska wykonawczego i publikuje projekcje końcowe.
7. Nieudane dostarczenie zdarzenia nigdy nie wycofuje zatwierdzonej decyzji; klienci odzyskują stan przez `approval.get` lub odtwarzanie listy.

Granice własności:

- `src/gateway/`: usługa zatwierdzania, autoryzacja, adaptery RPC, konstruowanie adresów URL, cykl życia oczekujących mechanizmów i publikowanie zdarzeń.
- `src/state/`: współdzielony schemat i wygenerowane typy Kysely.
- `src/infra/`: oczyszczone modele widoku zatwierdzenia i konstruowanie przenośnej prezentacji.
- `src/agents/`: żądanie, oczekiwanie i zastosowanie zwróconego werdyktu; bez utrwalania.
- `src/channels/` i `extensions/*`: renderowanie typowanych akcji, autoryzowanie użytkowników kanałów, kodowanie prywatnych wywołań zwrotnych i aktualizowanie dostarczonych kontrolek.
- `src/plugin-sdk/`: wyłącznie publiczne kontrakty zatwierdzania i prezentacji.
- `ui/`: samodzielna strona oraz istniejący klienci kolejki/okna modalnego.

Oczekujący mechanizm w procesie jest mechanizmem powiadamiania, a nie źródłem uprawnień. Rejestracja wstawia rekord i instaluje oczekujący mechanizm synchronicznie przed opublikowaniem żądania, dzięki czemu rozstrzygający nie może wykonać operacji między tymi krokami. Każdy późniejszy rozstrzygający najpierw zatwierdza zmianę przez SQLite, a dopiero potem rozstrzyga ten oczekujący mechanizm.

## Trwały rekord

Należy dodać jedną tabelę `operator_approvals` do współdzielonej bazy danych stanu.

| Kolumna                                             | Przeznaczenie                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | Globalnie unikatowy identyfikator kanoniczny. Zachowaj istniejące identyfikatory wykonania i identyfikatory `plugin:` w celu zgodności protokołu, ale nigdy nie wnioskuj rodzaju na podstawie prefiksu.      |
| `resolution_ref`                                   | Unikatowy pełny lokalizator SHA-256 w formacie base64url dla wywołań zwrotnych transportu, które nie mogą przenosić identyfikatora kanonicznego. Nie stanowi autoryzacji ani identyfikatora publicznego adresu URL. |
| `kind`                                             | Zamknięty dyskryminator `exec \| plugin`.                                                                                                        |
| `status`                                           | Zamknięty stan `pending \| allowed \| denied \| expired \| cancelled`.                                                                          |
| `presentation_json`                                | Zweryfikowana projekcja dla recenzenta, oznaczona rodzajem. Surowe żądania środowiska uruchomieniowego, powiązania poleceń i ładunki wywołań zwrotnych pozostają lokalne dla procesu.               |
| `source_agent_id`, `source_session_key`            | Tożsamość źródła i kotwica projekcji sesji. Klucz sesji jest trwały; rotacyjny identyfikator UUID sesji nie jest.                                          |
| `audience_session_keys_json`                       | Uporządkowana, pozbawiona duplikatów tablica JSON utworzona przez ograniczone wszerz przejście po strukturze własności. Zdarzenia żądania i końcowe używają tej samej migawki. |
| `requested_by_device_id`, `requested_by_client_id` | Trwałe metadane żądającego i audytu. Identyfikator połączenia pozostaje w pamięci i nie jest podmiotem współdzielonym między powierzchniami.                                         |
| `reviewer_device_ids_json`                         | Opcjonalne, jawnie wskazane urządzenia recenzentów, dostarczane wyłącznie przez zaufane środowisko uruchomieniowe zatwierdzeń.                                                  |
| `runtime_epoch`                                    | Epoka procesu będącego właścicielem wstrzymanego wykonania; służy do anulowania osieroconych wierszy po ponownym uruchomieniu.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Wiążące dane czasowe.                                                                                                                         |
| `decision`                                         | Jawna decyzja użytkownika, jeśli istnieje.                                                                                                       |
| `terminal_reason`                                  | Zamknięty powód, taki jak `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` lub `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Tożsamość zwycięzcy i tożsamość audytowa zachowywane po stronie serwera. Projekcje dla recenzentów pomijają surowe identyfikatory podmiotu rozstrzygającego.                                           |
| `consumed_at_ms`, `consumed_by`                    | Oddzielne zabezpieczenie przed ponownym odtworzeniem dla `allow-once`; użycie nie może usuwać zapisanej decyzji.                                                       |

Wymagane indeksy:

| Indeks                                      | Przeznaczenie                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| unikatowy `(resolution_ref)`                  | Odrzuca niejednoznaczność `approval_id`/`resolution_ref` między kolumnami podczas wstawiania. |
| `(status, expires_at_ms)`                  | Znajduje oczekujące zatwierdzenia i uzgadnia wiążące terminy.               |
| `(source_session_key, created_at_ms DESC)` | Odtwarza ostatnie zatwierdzenia dla jednej sesji źródłowej.                             |
| `(resolved_at_ms)`                         | Usuwa zachowane końcowe zatwierdzenia zgodnie ze stałą polityką przechowywania.  |

Tablice odbiorców są małe i ograniczone. Odtwarzanie filtrowane według sesji najpierw wybiera widoczne oczekujące wiersze za pomocą Kysely, a następnie dekoduje i filtruje ograniczone tablice odbiorców w kodzie aplikacji; nie używa dopasowywania ciągów ani surowych zapytań SQL JSON.

Zachowuj wiersze końcowe przez 30 dni, zgodnie z okresem przechowywania metadanych audytowych w `src/audit/audit-event-store.ts`. Usuwanie jest stałą polityką utrzymania, a nie nową powierzchnią konfiguracji. Baza danych jest prywatnym lokalnym stanem płaszczyzny sterowania, ale interfejsy API recenzentów nigdy nie mogą ujawniać pełnego zapisanego żądania ani powiązania środowiska uruchomieniowego.

## Maszyna stanów i porównanie z ustawieniem

Dozwolone są wyłącznie następujące przejścia:

- `pending -> allowed`: jawne `allow-once` lub `allow-always`.
- `pending -> denied`: jawna odmowa, zaufany nieprawidłowy werdykt końcowy lub brak trasy dostarczenia.
- `pending -> expired`: osiągnięto wiążący termin.
- `pending -> cancelled`: przerwanie uruchomienia, łagodne zamknięcie lub odzyskanie osieroconego wpisu po ponownym uruchomieniu.

Każdy niedozwolony stan końcowy ma efektywny werdykt odmowy.

Rozstrzygnięcie używa jednej natychmiastowej transakcji SQLite i warunkowej aktualizacji Kysely równoważnej:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Jeśli aktualizacja nie obejmie żadnego wiersza, ta sama transakcja odczytuje rekord:

- Brak lub brak uprawnień: zwróć informację o nieznalezieniu; nie ujawniaj istnienia.
- Nadal oczekuje, ale termin został osiągnięty: ustaw jego stan na `expired` metodą porównania z ustawieniem, a następnie zwróć ten wiersz końcowy.
- Ta sama zapisana decyzja: zwróć idempotentne powodzenie z zapisanym zwycięzcą.
- Inna decyzja: ujednolicony interfejs API zwraca `applied: false` z zapisanym zwycięzcą; starsze adaptery zachowują `APPROVAL_ALREADY_RESOLVED`, gdy wymaga tego ich opublikowany kontrakt.
- Dowolny stan końcowy: nigdy go nie modyfikuj.

`now == expires_at_ms` wygasło. Czas Gateway jest wiążący.

Wykonanie `allow-once` używa drugiej operacji CAS na `consumed_at_ms IS NULL`, powiązanej z istniejącym dokładnym kontekstem polecenia/uruchomienia systemowego. Wiersz zatwierdzenia pozostaje rekordem audytowym po użyciu.

Nieprawidłowe dane wejściowe HTTP/RPC, których nie można uwierzytelnić lub które nie identyfikują zatwierdzenia, są odrzucane bez modyfikacji i nigdy nie mogą prowadzić do zatwierdzenia. Nieprawidłowy werdykt końcowy otrzymany od zaufanego mechanizmu testowego/oczekującego dla znanego zatwierdzenia powoduje przejście do `denied`.

## Interfejs API Gateway

Dodaj metody dla recenzentów niezależne od rodzaju:

| Metoda                                    | Kontrakt                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Zwraca widoczną oczekującą lub zachowaną końcową projekcję.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Przyjmuje identyfikator kanoniczny lub odwołanie transportowe o stałym rozmiarze, a następnie przeprowadza autoryzację, walidację rodzaju i dozwolonej decyzji, uzgodnienie terminu oraz końcową operację CAS. Odpowiedź zawsze zawiera identyfikator kanoniczny. |

Po pomyślnej operacji CAS natychmiast zwróć zatwierdzoną projekcję. Starsze zdarzenia, mechanizmy przekazywania kanałów i mechanizmy finalizujące powiadomienia push są działaniami następczymi podejmowanymi w miarę możliwości; wolna lub niedziałająca powierzchnia nie może opóźniać ani wycofywać zwycięskiej odpowiedzi.

Walidacja żądań specyficzna dla rodzaju pozostaje w `exec.approval.request` i `plugin.approval.request`. Istniejące `exec.approval.get/list/waitDecision/resolve` i `plugin.approval.list/waitDecision/resolve` stają się adapterami granicy protokołu do usługi kanonicznej, ponieważ są opublikowanym interfejsem API Gateway. Wewnętrzni wywołujący są migrowani do usługi w ramach tej samej zmiany.

Projekcja dla recenzenta jest sumą rozłączną z polem rozróżniającym:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* bezpieczny podgląd wykonania */ }
    | { kind: "plugin"; title: string; description: string /* bezpieczny podgląd pluginu */ };
  // wspólne pola cyklu życia
};
```

Stabilna ścieżka jest wyprowadzana, a nie utrwalana. `approval.get` zwraca `urlPath`; powierzchnie znające zatwierdzone publiczne źródło mogą również otrzymać bezwzględny `url`. Migawki dla recenzentów pomijają klucze sesji źródłowej i odbiorców. Gateway przechowuje te klucze routingu po stronie serwera dla oddzielnej projekcji `session.approval`.

## Zdarzenia i przenośne akcje

PR 1 zachowuje opublikowane nazwy zdarzeń, ładunki i istniejące filtry odbiorców na poziomie rekordu:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Te starsze zdarzenia mogą zawierać pełne żądanie środowiska uruchomieniowego, dlatego nie mogą być rozsyłane do każdego klienta objętego zatwierdzeniami. PR 5 dodaje oznaczone pola cyklu życia (`status`, `sourceSessionKey`, `urlPath`, metadane końcowe i `kind` na poziomie prezentacji) za pośrednictwem oczyszczonej projekcji cyklu życia zamiast rozszerzać dostarczanie starszych zdarzeń.

Dodaj zdarzenie projekcji `session.approval` ograniczone do zatwierdzeń. Opublikuj zdarzenie kanoniczne raz wraz z utrwalonymi kluczami odbiorców; subskrybenci dokładnej sesji otrzymują to samo zdarzenie dla każdego pasującego klucza:

- `sessionKey`: strumień odbierający projekcję.
- `sourceSessionKey`: element podrzędny/źródło, które zgłosiło bramkę.
- `phase`: `pending \| terminal`, rozróżniane według stanu zatwierdzenia.
- jedna bezpieczna projekcja `OperatorApproval`.

Klienci zgłaszają udział za pomocą `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. Pomyślna odpowiedź dodaje `approvalReplay` zawierający maksymalnie 1 000 bieżących oczekujących zatwierdzeń dla tego dokładnego klucza strumienia, do których przeglądania subskrybujący klient jest również upoważniony na poziomie rekordu. `truncated: false` sprawia, że filtrowane odtwarzanie jest wiążące, a ponownie łączący się klienci zastępują nim swój lokalny zbiór oczekujących elementów; `truncated: true` jest sygnałem przeciążenia i klienci muszą zachować niewidoczne wpisy lokalne, dopóki wyszukiwanie kanoniczne lub późniejsze zdarzenia cyklu życia ich nie rozstrzygną. Późniejsze trwałe przekroczenie limitu czasu wykryte podczas odtwarzania emituje końcowe znaczniki usunięcia wyłącznie do subskrybowanych odbiorców upoważnionych na poziomie rekordu, zanim zostanie zwrócona nowa migawka. `operator.admin` może zgłosić udział bezpośrednio; klienci o węższym zakresie wymagają zarówno tożsamości sparowanego urządzenia, jak i `operator.approvals`. Sama subskrypcja sesji nigdy nie przyznaje widoczności zatwierdzeń.

Zarejestruj zdarzenie pod `operator.approvals` w `src/gateway/server-broadcast.ts`. Projekcja ma charakter obserwacyjny: nigdy nie dołącza wierszy transkrypcji, nie emituje `sessions.changed` ani nie wybudza agenta.

Rozszerz `MessagePresentationAction` w `src/interactive/payload.ts`:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Rdzeń tworzy typowane akcje decyzji oraz osobny link do przeglądu, gdy dostępne jest zatwierdzone bezwzględne źródło Control UI. Kanały kodują akcję zatwierdzenia we własnym formacie wywołania zwrotnego i wysyłają rozstrzygnięcie do usługi kanonicznej. Wywołanie zwrotne używa dokładnego identyfikatora kanonicznego, jeśli się on mieści; w przeciwnym razie używa unikatowego pełnego skrótu wiersza `resolution_ref`. Odwołanie jest jedynie kompaktowym kluczem wyszukiwania: nadal obowiązują standardowe uwierzytelnianie Gateway, autoryzacja rekordu, jawny rodzaj, walidacja dozwolonej decyzji, uzgadnianie terminu oraz operacja CAS zapewniająca pierwszeństwo pierwszej odpowiedzi. Kanały nie mogą skracać identyfikatorów, rozpoznawać prefiksów skrótów, analizować tekstu `/approve` ani wnioskować o rodzaju na podstawie prefiksu identyfikatora.

Należy zachować `button.url`, `button.webApp` oraz kontrolki zatwierdzania oparte na poleceniach jako przestarzałe dane wejściowe zgodności SDK pluginów. Należy je normalizować na granicy SDK; w tym samym PR należy zmigrować każdego dołączonego wewnętrznego wywołującego. `/approve {id} {decision}` pozostaje tekstowym mechanizmem awaryjnym oraz poleceniem CLI/czatu, a nie semantycznym kontraktem przycisku.

## Control UI

Trasa to `${basePath}/approve/{approvalId}`. Identyfikator jest jedynym parametrem ścieżki; tożsamość sesji źródłowej pochodzi z rekordu.

Ponieważ obecny router ma dokładne trasy statyczne i przepisuje nieznane ścieżki do czatu, należy wykrywać ten głęboki link w `ui/src/app/bootstrap.ts` przed standardową normalizacją trasy. Należy ponownie wykorzystać standardową konfigurację Gateway/uwierzytelniania, ale wyświetlić samodzielną stronę zatwierdzania poza powłoką paska bocznego i modalnym oknem globalnym.

Dokument należy do Gateway, który udostępnił jego adres URL. Jego początkowe połączenie ignoruje utrwalony wybór zdalnego Gateway pełnej aplikacji bez zmieniania ani kopiowania ustawień tego wyboru; jedynie uwierzytelnianie pozostaje ograniczone do sesji obsługującego Gateway. Zaufane uwierzytelnianie natywne lub osobno potwierdzone nadpisanie `gatewayUrl` może zmienić jego cel. Rdzeń rezerwuje jednosegmentową przestrzeń nazw `/approve` przed trasami HTTP pluginów i wykrywaniem rozszerzeń statycznych, w tym identyfikatorów kończących się na `.json` lub `.js`; gdy udostępnianie Control UI jest wyłączone, zarezerwowana trasa bezpiecznie odmawia dostępu za pomocą `404`. Strona powinna pozostać w głównym pakiecie Control UI, aby błąd leniwie ładowanego fragmentu nie pozostawił decyzji dotyczącej bezpieczeństwa na ekranie ładowania.

Stany strony:

- ładowanie
- wymagane uwierzytelnienie
- oczekuje
- rozstrzyganie
- zatwierdzono lub odrzucono tutaj
- rozstrzygnięto gdzie indziej
- wygasło
- anulowano
- brak uprawnień/nie znaleziono
- błąd połączenia z możliwością ponowienia

Strona wywołuje RPC Gateway, a nie drugi nieuwierzytelniony interfejs REST API. Odświeżenie przeglądarki ponownie odczytuje trwały stan. Strona nigdy nie umieszcza danych uwierzytelniających Gateway w adresie URL, zapytaniu ani fragmencie.

## Autoryzacja i prywatność

Adres URL jest lokalizatorem, a nie źródłem uprawnień. Rozstrzygnięcie wymaga:

1. uwierzytelnionego połączenia z Gateway;
2. `operator.approvals` lub `operator.admin`;
3. autoryzacji recenzenta na poziomie rekordu.

Reguły na poziomie rekordu:

- `operator.admin` może dokonywać przeglądu.
- `reviewer_device_ids` jest rozstrzygające, gdy występuje. Przeglądu może dokonywać wyłącznie wymienione sparowane
  urządzenie `operator.approvals`; urządzenie wysyłające żądanie nie ma niejawnego
  dostępu, chyba że również znajduje się na liście.
- W przypadku braku jawnej listy recenzentów sparowane urządzenie wysyłające żądanie
  `operator.approvals` może przeglądać własny rekord.
- Rzeczywiście starsze rekordy bez powiązania z żądającym lub recenzentem zachowują szeroką
  widoczność dla sparowanych urządzeń, aby aktualizacje nie pozostawiały już oczekujących zadań bez możliwości obsługi.
- Wewnętrzne środowiska uruchomieniowe bez urządzenia mogą rozstrzygać, ale nie odczytywać, za pośrednictwem ograniczonego
  połączenia środowiska uruchomieniowego zatwierdzeń. Uprawnienie to pochodzi wyłącznie z
  uwierzytelnionego przez serwer tokenu środowiska uruchomieniowego; publiczne pola `approval.resolve` nie mogą
  go tworzyć.
- Własność aktywnego połączenia żądającego pozostaje ważna dla starszych adapterów; nigdy nie jest
  wnioskowana na podstawie zgodnej nazwy klienta.
- Członkostwo w grupie odbiorców zmienia wyłącznie sposób prezentacji. Nigdy nie rozszerza autoryzacji.

`approval.get` udostępnia wyłącznie oczyszczoną projekcję dla recenzenta i pomija wewnętrzne klucze routingu źródła/grupy odbiorców. Zdarzenie `session.approval` z PR 5 zawiera jedno miejsce docelowe `sessionKey` oraz `sourceSessionKey` po zastosowaniu przez Gateway utrwalonej migawki grupy odbiorców po stronie serwera. Istniejące zdarzenia exec/plugin zachowują swoje historyczne dane i ograniczone grupy odbiorców do czasu migracji konsumentów. Wykonywalne żądanie, powiązanie polecenia i kontynuacja pozostają wyłącznie w lokalnym dla procesu obiekcie oczekującym. Trwały wiersz zawiera bezpieczną prezentację oraz metadane cyklu życia, routingu i audytu; nigdy nie przechowuje nieprzetworzonych wartości środowiska, danych uwierzytelniających, nagłówków uwierzytelniania ani danych wywołań zwrotnych kanału.

## Projekcja grupy odbiorców

Grupę odbiorców należy obliczyć raz przed wstawieniem i utrwalić uporządkowaną migawkę. Własność jest grafem, a nie zawsze pojedynczym łańcuchem nadrzędnym: element podrzędny może mieć zarówno bieżącego kontrolera, jak i pierwotnego żądającego, a ci właściciele mogą prowadzić do różnych korzeni.

Należy użyć deterministycznego przeszukiwania wszerz:

1. Zainicjuj kolejkę kluczem sesji źródłowej.
2. Dla każdego pobranego z kolejki klucza odczytaj najnowszy wiersz rejestru podagenta i dodaj do kolejki obie różne krawędzie własności w ustalonej kolejności: `controllerSessionKey`, następnie `requesterSessionKey`.
3. Jeśli istnieje użyteczny wiersz rejestru, nie należy dodatkowo podążać za pochodzeniem wpisu sesji, które po zmianie sterowania może być nieaktualne. W przeciwnym razie należy dodać do kolejki pojedynczą bieżącą krawędź awaryjną `parentSessionKey ?? spawnedBy`.
4. Normalizuj i usuwaj duplikaty podczas dodawania do kolejki, aby pierwszeństwo miała pierwsza, najkrótsza ścieżka.
5. Zatrzymaj się po osiągnięciu 64 unikatowych kluczy; ten limit rozmiaru grupy odbiorców ogranicza również głębokość przeszukiwania.

Źródłem rejestru jest `src/agents/subagent-registry-read.ts`; pola własności zdefiniowano w `src/agents/subagent-registry.types.ts`. Pola awaryjne sesji zdefiniowano w `src/config/sessions/types.ts`.

Projekcje żądania i stanu końcowego korzystają z tej samej utrwalonej grupy odbiorców, nawet jeśli własność fokusu/kontrolera zmieni się podczas oczekiwania na zatwierdzenie. Gwarantuje to końcowe czyszczenie dla każdego strumienia sesji grupy odbiorców, który otrzymał projekcję żądania. Rozstrzygnięcie zawsze dotyczy źródłowego identyfikatora zatwierdzenia; sesje grupy odbiorców nigdy nie otrzymują sklonowanego stanu zatwierdzenia. Czyszczenie przekazanych wiadomości kanału pozostaje osobnym działaniem uzupełniającym dotyczącym lokalizatora dostarczenia, opisanym poniżej.

Nie należy zapisywać wiadomości transkrypcji, wstrzykiwać monitów systemowych, rozpoczynać tur właściciela ani emitować `sessions.changed` wyłącznie z powodu zatwierdzenia.

## Ujednolicanie dostarczonych powierzchni

Natywne procedury obsługi zatwierdzeń przechowują już wpisy dostarczonych wiadomości wystarczająco długo, aby zastąpić lub wycofać aktywne kontrolki. Ogólne przekazane wiadomości zatwierdzające obecnie odrzucają `MessageReceipt`, więc decyzja podjęta na innej powierzchni może pozostawić stare kontrolki wyglądające na oczekujące. Osobne działanie uzupełniające eliminuje tę lukę za pomocą tabeli podrzędnej `operator_approval_deliveries` we współdzielonej bazie danych stanu.

Każdy wiersz przechowuje identyfikator zatwierdzenia, unikatowy identyfikator dostarczenia, kanał/konto/dokładną trasę, ograniczony i zweryfikowany jako JSON prywatny dla kanału lokalizator wiadomości, znaczniki czasu dostarczenia oraz stan finalizacji. Nigdy nie przechowuje danych wywołania zwrotnego, tokenów decyzji ani nieprzetworzonych żądań zatwierdzenia. Kanał odpowiada za kodowanie lokalizatora i modyfikację wiadomości; rdzeń odpowiada za stan kanoniczny, wybór celu, zasady ponawiania oraz awaryjny tekst końcowy.

Rejestracja dostarczenia i końcowe rozstrzygnięcie bezpiecznie obsługują wyścigi:

1. Po otrzymaniu potwierdzenia oczekującego wysłania wstaw lokalizator dostarczenia i odczytaj stan nadrzędnego zatwierdzenia w jednej transakcji.
2. Jeśli element nadrzędny jest już w stanie końcowym, zaplanuj natychmiastową finalizację zamiast pozostawiać późne dostarczenie w stanie oczekiwania.
3. Każde zatwierdzone przejście do stanu końcowego osobno planuje wszystkie niesfinalizowane wiersze dostarczenia; rozgłoszenia, które można pominąć, nie są wyzwalaczem.
4. Finalizator kanału zgłasza `replaced`, `retired` lub `unsupported`. Zastąpienie pomija zduplikowaną wiadomość końcową; wycofanie wysyła istniejącą końcową wiadomość uzupełniającą; brak obsługi lub błąd uruchamia mechanizm awaryjny bez wycofywania operacji CAS zatwierdzenia.
5. Podczas uruchamiania ponawiane są końcowe zatwierdzenia z niedokończonymi dostarczeniami, dzięki czemu czyszczenie jest odporne na ponowne uruchomienie Gateway.

Ten cykl życia transportu jest opcjonalnym punktem zaczepienia adaptera dostarczania, a nie mechanizmem renderującym ani akcją wiadomości widoczną dla modelu. Wiadomości QQ C2C/grupowe obecnie nie mają interfejsu API do edycji, usuwania ani czyszczenia klawiatury; ten adapter pozostaje nieobsługiwany i do czasu uzyskania przez transport interfejsu API modyfikacji może wyświetlić stan kanoniczny dopiero po późniejszym kliknięciu.

## Semantyka ponownego uruchamiania, limitu czasu i tras

Trwałość SQLite nie oznacza wznowienia wykonywania. Powiązania poleceń/narzędzi pozostają w pamięci, ponieważ mogą zawierać fakty środowiska uruchomieniowego istotne dla bezpieczeństwa i nie stanowią kontraktu wznawialnego zadania.

Podczas uruchamiania Gateway:

- wygeneruj nową epokę środowiska uruchomieniowego;
- atomowo przestaw oczekujące wiersze ze starszych epok na `cancelled` z powodem `gateway-restart`;
- zachowaj wiersze, aby ich adresy URL wyjaśniały, co się stało;
- nigdy nie wykonuj późniejszego zatwierdzenia przy braku powiązania środowiska uruchomieniowego.

Czasomierze są optymalizacjami wybudzania. Nadrzędny termin jest przechowywany w `expires_at_ms`; odczyty, oczekiwania i rozstrzygnięcia zawsze wykonują uzgadnianie wygaśnięcia.

Ostateczne rygorystyczne zachowanie:

- limit czasu -> `expired`, odmowa;
- brak trasy -> `denied`, odmowa;
- przerwanie przebiegu -> `cancelled`, odmowa;
- nieprawidłowy zaufany werdykt -> `denied`, odmowa;
- wyłącznie dozwolona jawna decyzja zezwalająca -> `allowed`.

Obecnie wydane zachowanie exec nadal jest sprzeczne z tym kontraktem:

- `src/agents/bash-tools.exec-host-shared.ts` może zastosować `askFallback`.
- `docs/tools/exec-approvals.md` oraz `docs/cli/approvals.md` dokumentują tę powierzchnię.

Zatwierdzenia pluginów obecnie bezpiecznie odmawiają dostępu po przekroczeniu limitu czasu i przy nieprawidłowych werdyktach; starsze pole
`timeoutBehavior` pozostaje akceptowane, ale jest ignorowane. Późniejsza zmiana wprowadzająca rygorystyczną semantykę
exec musi jednocześnie zaktualizować kod, typy, dokumentację, testy i dziennik zmian oraz
przejść jawną weryfikację właściciela i zabezpieczeń. `askFallback` może nadal opisywać
wybór zasad przed bramą podczas migracji, ale nie może zmienić przekroczenia limitu czasu
utworzonego oczekującego rekordu w zatwierdzenie.

## Plan zgodności

- Addytywny protokół Gateway; bez zwiększania wersji protokołu.
- Zachowaj istniejące metody i zdarzenia exec/plugin na granicy zewnętrznej.
- Zachowaj istniejące identyfikatory, w tym prefiksy `plugin:`, ale przestań używać prefiksów jako informacji o typie.
- Zachowaj zachowanie polecenia tekstowego `/approve`.
- Zachowaj starsze pola przycisków URL/Web App oraz akcje poleceń jako dane wejściowe zgodności SDK pluginów; nowe dane wyjściowe rdzenia są typowane.
- Zmigruj wszystkie dołączone kanały i wewnętrznych wywołujących w ramach tej samej zmiany typowanych akcji.
- Dodaj wpis do dziennika zmian dotyczący nowego adresu URL/strony oraz późniejszej zmiany zachowania limitu czasu.
- Nie dodawaj ustawienia trybu pozyskiwania danych.

## Wdrażanie

### PR 1: trwały cykl życia

- Niniejsza nota projektowa.
- Współdzielony schemat SQLite, generowanie Kysely, magazyn i czyszczenie po 30 dniach.
- Usługa zatwierdzania Gateway, most obiektu oczekującego środowiska uruchomieniowego oraz obsługa osieroconych rekordów po ponownym uruchomieniu.
- Ujednolicony `approval.get/resolve`.
- Adaptery metod exec/plugin.
- Testy pierwszeństwa pierwszej odpowiedzi, idempotencji, wygasania, autoryzacji i wykorzystania.
- Na tym etapie bez zmian zachowania interfejsu użytkownika ani kanałów.

### PR 2: typowane akcje i wywołania zwrotne kanałów

- Typowane akcje zatwierdzania, adresów URL i aplikacji internetowych.
- Podstawowe konstruktory prezentacji i eksporty SDK pluginów.
- Prywatne dla transportu kodowanie wywołań zwrotnych z jawnym rodzajem właściciela.
- Trwałe odwołania wywołań zwrotnych o stałym rozmiarze dla kanonicznych identyfikatorów przekraczających limity transportu.
- Migracja wbudowanych kanałów odchodząca od wnioskowania na podstawie tekstu polecenia i identyfikatora zatwierdzenia.
- Kanoniczny stan pierwszej odpowiedzi w interfejsie, w którym dokonano kliknięcia, oraz podejmowane w miarę możliwości aktualizacje stanu końcowego w aktywnych interfejsach natywnych; trwałe ustawianie stanu końcowego wiadomości kanału pozostaje zadaniem uzupełniającym.
- Testy SDK i wbudowanych kanałów.

### PR 3: głęboki link interfejsu sterowania

- Samodzielna uwierzytelniona strona zatwierdzania i routing uruchamiania uwzględniający ścieżkę bazową.
- Powiązanie z obsługującym Gateway bez modyfikowania zapisanego przez operatora wyboru zdalnego.
- Przestrzeń nazw HTTP zatwierdzeń należąca do rdzenia, obejmująca identyfikatory przypominające zasoby.
- Ładunek URL tworzony przez Gateway i odpytywanie stanu oczekiwania do czasu udostępnienia zdarzeń cyklu życia.
- Weryfikacja szerokości mobilnej, ponownego łączenia, konkurujących odpowiedzi, ponownego wczytywania i zamontowanej ścieżki.

### PR 4: klienci natywni

- Interfejsy przeglądu w systemach iOS i Android używają uwzględniającego rodzaj `approval.get/resolve`; watchOS przekazuje bezpieczne dla recenzenta monity i decyzje za pośrednictwem sparowanego iPhone'a.
- Watch udostępnia decyzje wykonania obsługiwane przez jego kompaktowy kontrakt przekazywania: jednorazowe zezwolenie i odmowę.
- Kanoniczny stan końcowy pierwszej odpowiedzi zastępuje lokalny stan próby podjęcia decyzji.
- Utracone lub niejednoznaczne potwierdzenia rozstrzygnięcia blokują elementy sterujące do czasu kanonicznego odczytu zwrotnego.
- Poprzednio wydane instancje Gateway v4 zachowują przegląd wykonania dzięki wąskiemu mechanizmowi rezerwowemu starszej metody; zachowanie stanu końcowego między interfejsami wymaga ujednoliconych metod.
- Ostrzeżenia dla recenzenta i kontekst właściciela pozostają widoczne na iPhonie, Watch i urządzeniach z Androidem.
- Weryfikacja jednostkowa, kompilacji i platform natywnych.

### PR 5: propagacja cyklu życia do przodków

- Dostarczanie stanu oczekiwania/końcowego `session.approval` na podstawie migawki odbiorców utrwalonej w PR 1.
- Subskrypcja dokładnej sesji, odtwarzanie po ponownym połączeniu i znaczniki usunięcia stanu końcowego bez modyfikowania transkrypcji ani wybudzania agenta.
- Wywołania zwrotne cyklu życia są uruchamiane po trwałym wstawieniu/CAS i nigdy nie stają się źródłem rozstrzygającym o zatwierdzeniu.
- Weryfikacja zagnieżdżonych podagentów i ponownego łączenia.

### PR 6: zachowanie zamknięte w razie błędu

- Migracja `node-invoke-plugin-policy.ts` i osadzonego brokera pluginów w celu wyeliminowania zduplikowanego źródła rozstrzygającego.
- Ścisła semantyka limitu czasu, nieprawidłowych danych, braku trasy, powiązania i wykorzystania jednorazowego zezwolenia.
- Wycofanie wydanych liberalnych ustawień limitu czasu bez ich respektowania po przejściu żądania w stan oczekiwania.
- Weryfikacja rywalizacji między wieloma interfejsami i wstrzykiwania błędów.

### Zadanie uzupełniające: trwałe porządkowanie wiadomości zdalnych

- Utrwalanie lokalizatorów przekazanego dostarczenia i ustawianie stanu końcowego każdej dostarczonej wiadomości kanału po ponownym uruchomieniu.
- Oddzielenie tego cyklu życia transportu od kanonicznego źródła rozstrzygającego o zatwierdzeniu i typowanych akcji prezentacji.

## Testy

Wymagany ukierunkowany zakres testów:

- Ponowne otwarcie SQLite zachowuje projekcje oczekujące i końcowe.
- Dwa współbieżne procesy rozstrzygające dają dokładnie jednego zwycięzcę CAS.
- Ponowienie tej samej decyzji kończy się idempotentnym powodzeniem; ponowienie sprzecznej decyzji zwraca zarejestrowanego zwycięzcę.
- Rozstrzygnięcie w terminie granicznym lub po nim nie może zatwierdzić.
- `allow-once` można wykorzystać dokładnie raz bez usuwania końcowego stanu audytu.
- Uruchomienie anuluje starsze epoki środowiska wykonawczego.
- Nieautoryzowane wyszukiwanie i rozstrzyganie nie ujawniają istnienia rekordu.
- Jawna lista dozwolonych recenzentów i ogólne zachowanie sparowanego `operator.approvals`.
- Starsze metody wykonywania i pluginów współdzielą ten sam magazyn.
- Schematy żądania/listy/pobrania/rozstrzygnięcia Gateway i addytywne ładunki zdarzeń.
- Normalizacja typowanych akcji, renderowanie rezerwowe, eksporty SDK i przełączenia wbudowanych kanałów.
- Kodowanie wywołań zwrotnych Telegram zawiera dane prywatne dla transportu i nie korzysta z wnioskowania na podstawie ciągu polecenia.
- Bezpośrednie dziecko, rozgałęzieni właściciele kontrolera/wnioskodawcy, zagnieżdżeni właściciele, ponowne przypisanie, mechanizm rezerwowy pola sesji, cykl i limit rozmiaru grupy odbiorców.
- Tablice odbiorców żądania i stanu końcowego są identyczne.
- Projekcje właściciela nie powodują modyfikacji transkrypcji ani wybudzenia agenta.
- Trasa interfejsu sterowania działa pod adresem `/` i w skonfigurowanej ścieżce bazowej; odświeżenie pokazuje stan oczekiwania lub stan końcowy.
- Jednoczesne odpowiedzi z interfejsu sterowania i Telegram pokazują jednego zwycięzcę oraz komunikat „rozstrzygnięto w innym miejscu” po stronie przegranego.
- Natywne identyfikatory zatwierdzeń i identyfikatory właścicieli Gateway zachowują dokładne bajty UTF-8 podczas routingu i uzgadniania.
- Negocjacja rodziny natywnych RPC przypina jedną kanoniczną lub starszą rodzinę do każdej dopuszczonej trasy Gateway i nigdy nie przechodzi niejawnie na starszą wersję po użyciu.
- Utracone natywne potwierdzenia rozstrzygnięcia blokują akcje do czasu kanonicznego odczytu zwrotnego; nieudany odczyt zwrotny nie może sfabrykować zwycięzcy ani potwierdzić odświeżenia Watch.
- Korelacja żądania migawki Watch jest akceptowana wyłącznie dla dokładnie sparowanego właściciela Gateway i ukończonego kanonicznego odczytu zwrotnego iPhone'a.
- Weryfikacja ścieżki użytkownika przez Testbox/Crabbox, obejmująca stronę zatwierdzania o szerokości mobilnej, porządkowanie akcji Telegram oraz jeden pełny cykl oczekiwania/rozstrzygnięcia/spóźnionej przegranej odpowiedzi w systemie Android, na iPhonie i Watch.

## Obserwowalność

Emitowanie ustrukturyzowanych dzienników przejść bez treści, zawierających identyfikator zatwierdzenia, rodzaj, klucz sesji źródłowej, stan, przyczynę i opóźnienie. Nigdy nie należy rejestrować podglądu ani surowego powiązania.

Śledzenie:

- liczby żądań według rodzaju;
- liczby stanów końcowych według rodzaju/stanu/przyczyny;
- miernika stanu oczekiwania;
- opóźnienia od żądania do stanu końcowego;
- wyników wyścigu rozstrzygnięć: zwycięzcy, idempotentnego ponowienia, konfliktu, wygaśnięcia;
- liczby tras dostarczenia i odmów z powodu braku trasy;
- anulowań osieroconych żądań podczas uruchamiania;
- rozmiaru grupy odbiorców.

Zatwierdzone przejście jest sukcesem, nawet jeśli późniejsze dostarczenie zdarzenia zakończy się niepowodzeniem. Subskrybenci cyklu życia odzyskują stan dzięki odtwarzaniu z PR 5 i kanonicznemu wyszukiwaniu. Trwałe ustawianie stanu końcowego wiadomości kanału pozostaje oddzielnym zadaniem uzupełniającym opisanym powyżej.

## Otwarte decyzje

1. **Zewnętrznie dostępne źródło interfejsu sterowania.** Każda migawka zawiera stabilny względny `urlPath`. Bezwzględny adres URL może być ogłaszany wyłącznie z buforowanej lokalizacji Tailscale Serve/Funnel po pomyślnym udostępnieniu Gateway; `allowedOrigins`, nagłówki Host żądania, `gateway.remote.url` oraz przeznaczone wyłącznie do wyświetlania kandydatury pętli zwrotnej/LAN nie są kanonicznymi źródłami. Telegram może używać swojego uwierzytelnionego opakowania Mini App, aby zachować ścieżkę zatwierdzania podczas inicjalizacji. Dowolne odwrotne serwery proxy pozostają ograniczone do ścieżek względnych, dopóki nie powstanie oddzielnie sprawdzony, jawny kontrakt publicznego adresu URL. Kanał nigdy nie może zgadywać źródła.
2. **Przejście zgodności ścisłego limitu czasu wykonywania.** Limity czasu zatwierdzania pluginów są teraz zamknięte w razie błędu, a `timeoutBehavior` jest wycofywany. Pozostały wydany kontrakt `askFallback` wymaga jawnego przeglądu właściciela i bezpieczeństwa, dziennika zmian, dokumentacji oraz decyzji dotyczącej migracji/wycofania, zanim przestanie autoryzować wykonanie po przekroczeniu limitu czasu oczekującego żądania.
3. **Tryb osadzony bez Gateway.** Zalecenie: początkowo pozostawić go wyłącznie jako lokalny, a następnie uczynić klientem usługi kanonicznej, gdy Gateway jest dostępny. Nie należy ogłaszać głębokiego linku, którego żaden serwer nie może rozstrzygnąć.
