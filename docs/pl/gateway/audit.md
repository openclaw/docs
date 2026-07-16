---
read_when:
    - Potrzebny jest trwały zapis działań Gateway bez przechowywania treści
    - Podejmowana jest decyzja, czy włączyć audyt cyklu życia wiadomości
    - Trzeba wyjaśnić, czego dowodzą zapisy audytowe, a czego nie dowodzą
summary: Historia audytu obejmująca wyłącznie metadane uruchomień agentów, działań narzędzi i opcjonalnie rejestrowanych cykli życia wiadomości
title: Historia audytu
x-i18n:
    generated_at: "2026-07-16T18:35:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Historia audytu

Gateway przechowuje ograniczony rejestr audytu zawierający wyłącznie metadane we współdzielonej bazie danych stanu OpenClaw. Pozwala on odpowiadać na pytania operacyjne, takie jak „który agent został uruchomiony, kiedy i jak zakończył działanie”, „jakie działania narzędzi wykonało uruchomienie” oraz, gdy audyt wiadomości jest włączony, „czy zaakceptowana wiadomość przychodząca dotarła do wysłania” i „czy wiadomość wychodząca osiągnęła końcowy stan dostarczenia”.

Rejestr przechowuje tożsamość, kolejność, pochodzenie, działanie, stan oraz znormalizowane kody wyników. Nigdy nie przechowuje promptów, treści wiadomości, argumentów narzędzi, wyników narzędzi, załączników, nazw plików, adresów URL, danych wyjściowych poleceń ani nieprzetworzonego tekstu błędów.

## Rodziny rekordów

Zdarzenia uruchomień i narzędzi są rejestrowane zawsze, gdy audyt jest włączony (domyślnie). Zdarzenia cyklu życia wiadomości są opcjonalne i domyślnie wyłączone.

| Rodzina            | Działania                                                | Domyślnie |
| ------------------ | -------------------------------------------------------- | --------- |
| Uruchomienia agenta | `agent.run.started`, `agent.run.finished`                | włączone  |
| Działania narzędzi | `tool.action.started`, `tool.action.finished`            | włączone  |
| Wiadomości         | `message.inbound.processed`, `message.outbound.finished` | wyłączone |

Każdy rekord zawiera stabilny identyfikator zdarzenia, monotoniczny numer sekwencyjny rejestru, znacznik czasu cyklu życia, aktora, działanie, stan, `schemaVersion: 1` oraz `redaction: "metadata_only"`. Pełny opis pól i filtrów zapytań znajduje się w sekcji [Rekordy audytu](/cli/audit).

## Zdarzenia cyklu życia wiadomości

Ustaw [`audit.messages`](/pl/gateway/configuration-reference#audit), aby wybrać rejestrowane dane, a następnie uruchom ponownie Gateway:

- `off` (domyślnie): brak rekordów wiadomości.
- `direct`: tylko wiadomości w rozmowach bezpośrednich.
- `all`: wiadomości bezpośrednie, grupowe i kanałowe.

Rekordy wiadomości powstają na dwóch autorytatywnych granicach:

- Wiersze **przychodzące** są zapisywane, gdy zaakceptowana wiadomość dociera do podstawowego mechanizmu wysyłania, z uwzględnieniem duplikatów i końcowych wyników przetwarzania.
- Wiersze **wychodzące** są zapisywane, gdy współdzielony mechanizm trwałego dostarczania osiąga wynik końcowy: wysłano, pominięto, niepowodzenie lub jawny `unknown` dla wysyłek o niejednoznacznym wyniku z powodu awarii. Uwzględniane są wyniki odzyskiwania kolejki i kolejki niedostarczonych wiadomości. Każdy oryginalny logiczny ładunek odpowiedzi otrzymuje jeden wiersz końcowy; dzielenie na fragmenty i rozsyłanie przez adaptery są agregowane w `resultCount`.

### Klasyfikacja rodzaju rozmowy

Tryb `direct` stanowi granicę prywatności, dlatego wiadomość jest klasyfikowana jako rozmowa bezpośrednia tylko wtedy, gdy potwierdzają to fakty dotyczące miejsca docelowego: ścieżka wysyłania zadeklarowała rodzaj rozmowy docelowej albo trasa sesji dostarczania dokładnie wskazuje kanał i odbiorcę dostarczanej wiadomości. Słabsze sygnały, takie jak stan zasad lub rozmowa źródłowa, mogą sklasyfikować wiadomość jako `group` (wykluczając ją ze zbierania `direct`), ale nigdy nie mogą wskazywać `direct`. Wiadomości, których bezpośredniego charakteru nie można potwierdzić, są klasyfikowane jako `unknown` i nie są rejestrowane w trybie `direct`. Kanały, które nie deklarują typów czatów, mogą zatem rejestrować mniej wierszy w trybie `direct` niż w trybie `all`.

## Model prywatności

Wiersze wiadomości nigdy nie przechowują nieprzetworzonych identyfikatorów platformy. Identyfikatory konta, rozmowy, wiadomości i celu, jeśli możliwa jest korelacja, są eksportowane wyłącznie jako lokalne dla instalacji pseudonimy oparte na kluczu (`hmac-sha256:v1:<keyId>:<digest>`):

- Klucz HMAC jest generowany przy pierwszym użyciu, ma oddzielną domenę dla każdego rodzaju identyfikatora i znajduje się w tej samej bazie danych stanu co rejestr.
- Pseudonimy są stabilne w obrębie jednej instalacji, dzięki czemu można korelować wiersze dotyczące tej samej rozmowy bez ujawniania identyfikatora platformy.
- Jest to **korelacja, a nie anonimizacja**: każda osoba z dostępem do odczytu bazy danych stanu ma również dostęp do klucza i może porównywać potencjalne nieprzetworzone identyfikatory z pseudonimami. Eksporty RPC i CLI nigdy nie zawierają klucza.
- Jeśli materiał klucza zaginie lub ulegnie uszkodzeniu, gdy wiersze wiadomości są zachowywane, Gateway bezpiecznie odmawia działania i odrzuca nowe rekordy wiadomości zamiast niejawnie przełączać się na nowy klucz, co rozdzieliłoby korelację.

Rekordy uruchomień i narzędzi zachowują `sessionKey` oraz `sessionId` na potrzeby korelacji; kanoniczne klucze sesji mogą same zawierać identyfikatory kont platformy lub odbiorców. Rekordy wiadomości celowo pomijają oba te pola.

Eksporty audytu pozostają wrażliwymi metadanymi operacyjnymi nawet bez treści: czas, kanały, wyniki i stabilne pseudonimy umożliwiają korelację aktywności. Eksporty należy chronić za pomocą takich samych mechanizmów kontroli dostępu i zasad przechowywania jak inne rekordy operatora.

## Zakres i ograniczenia dowodowe

Rejestr działa na zasadzie najlepszych starań i jest celowo ograniczony. Należy traktować go jako dowód tego, co zarejestrowano, a nie jako dowód tego, co się wydarzyło:

- **Brak wiersza niczego nie dowodzi.** Odrzucone przed przyjęciem wiadomości przychodzące, wysyłki z procesów CLI bez uruchomionego rejestratora Gateway oraz lokalne dla pluginu lub bezpośrednie ścieżki wysyłania, które omijają współdzielony mechanizm trwałego dostarczania, nie pozostawiają rekordu.
- Zapisy przechodzą przez ograniczony proces roboczy działający w tle; awaria procesu roboczego lub przepełnienie kolejki powoduje odrzucanie rekordów i zarejestrowanie jednego ostrzeżenia operacyjnego.
- Wychodzące wysyłki o niejednoznacznym wyniku z powodu awarii są rejestrowane jako `unknown`, zamiast otrzymywać wymyślone wyniki.

Ten rejestr wspiera debugowanie i przeglądy operacyjne. Nie jest bezstratnym archiwum zgodności; jeśli takie archiwum jest potrzebne, należy użyć zewnętrznego systemu zasilanego przez [OpenTelemetry](/pl/gateway/opentelemetry) lub narzędzia na poziomie kanału.

## Przechowywanie, retencja i migracja

Rekordy znajdują się we współdzielonej bazie danych stanu (`state/openclaw.sqlite`) i są zapisywane poza krytyczną ścieżką dostarczania. Zapytania nigdy nie zwracają rekordów starszych niż 30 dni, a rejestr jest ograniczony do 100,000 wierszy; wygasłe wiersze są usuwane podczas uruchamiania, cogodzinnej konserwacji i późniejszych zapisów. Konserwacja retencji działa nawet wtedy, gdy zbieranie jest wyłączone.

Aktualizacja z wersji Gateway z wcześniejszym rejestrem obejmującym wyłącznie uruchomienia i narzędzia automatycznie migruje schemat podczas uruchamiania (lub za pomocą `openclaw doctor --fix`); istniejące wiersze i ich numery sekwencyjne rejestru zostają zachowane.

## Wykonywanie zapytań

- CLI: [`openclaw audit`](/cli/audit) z filtrami agenta, sesji, uruchomienia, rodzaju, stanu, kierunku, kanału, przedziału czasu oraz stronicowania opartego na kursorze.
- RPC Gateway: `audit.activity.list` (wymaga `operator.read`) zwraca wersjonowaną unię zdarzeń aktywności V1; dostarczone RPC `audit.list` pozostaje niezmienione dla starszych klientów uruchomień i narzędzi. Zobacz [Protokół Gateway](/pl/gateway/protocol#audit-ledger-rpc).

## Powiązane

- [CLI rekordów audytu](/cli/audit)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#audit)
- [Protokół Gateway](/pl/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/pl/gateway/opentelemetry)
