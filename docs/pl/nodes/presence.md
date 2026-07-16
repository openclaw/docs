---
read_when:
    - OpenClaw ma identyfikować aktywnego Maca
    - Debugowanie aktywności ostatniego wejścia lub wyboru aktywnego węzła
    - Chcesz zrozumieć routing powiadomień o połączeniu Node’a
summary: Wykryj ostatnio używanego Maca i kieruj tam alerty Node
title: Aktywna obecność przy komputerze
x-i18n:
    generated_at: "2026-07-16T18:45:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

Aktywna obecność przy komputerze informuje Gateway, który z połączonych węzłów macOS odebrał
ostatnie fizyczne dane wejściowe z myszy lub klawiatury. OpenClaw używa tego sygnału, aby
oznaczyć jeden komputer Mac jako `active`, przekazać agentowi stabilną wskazówkę dotyczącą aktywnego węzła oraz kierować
alerty o połączeniu węzła do komputera, przy którym najprawdopodobniej znajduje się użytkownik.

Jest to mechanizm odrębny od [obecności systemowej](/pl/concepts/presence), która stanowi aktualną
listę klientów Gateway, oraz od trwałych sygnałów `node.presence.alive`, które
rejestrują ostatnie wybudzenie węzła mobilnego, nie traktując go jako połączonego.

## Wymagania

- Aplikacja OpenClaw dla systemu macOS jest sparowana i połączona w trybie węzła.
- Podpisanej aplikacji OpenClaw przyznano uprawnienie **Accessibility**.
- W przypadku alertów o połączeniu przyznano również uprawnienie **Notifications**, a
  węzeł Mac udostępnia `system.notify`.

Raportowanie aktywności jest obecnie zaimplementowane przez natywny węzeł macOS. Hosty węzłów
iOS, Android, watchOS i bez interfejsu graficznego mogą raportować stan ostatniej aktywności związanej z połączeniem lub działaniem
w tle, ale nie uczestniczą w wyborze aktywnego komputera.

## Sprawdzanie aktywnego komputera

1. W aplikacji macOS otwórz **Settings -> Permissions** i przyznaj uprawnienie
   **Accessibility** w ustawieniach systemowych macOS.
2. Potwierdź, że węzeł Mac jest połączony:

   ```bash
   openclaw nodes status --connected
   ```

3. Porusz myszą lub naciśnij klawisz na tym komputerze Mac, a następnie uruchom:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Najbardziej aktualny kwalifikujący się komputer Mac jest oznaczony jako `active`. Dane wyjściowe stanu pokazują czas
od ostatnich danych wejściowych; `describe` udostępnia `active`, `lastActiveAtMs` oraz `presenceUpdatedAtMs`.
Aktywność jest celowo agregowana, dlatego po niedawnym raporcie wyświetlenie kolejnych danych
wejściowych może zająć do około 15 sekund.

## Jak aktywność staje się obecnością

Moduł raportujący macOS co dwie sekundy pobiera próbkę systemowego zegara bezczynności HID.
Raportuje raz, gdy połączenie węzła staje się gotowe, a następnie raportuje nowszą aktywność fizyczną
nie częściej niż raz na 15 sekund. Podczas bezczynności wysyła sygnał podtrzymujący
co trzy minuty. Czas bezczynności jest ograniczony do 30 dni, aby bardzo stara próbka
nie mogła przesunąć się w przód i zostać błędnie uznana za najnowszy komputer.

Gateway akceptuje aktywność tylko wtedy, gdy wszystkie poniższe warunki są spełnione:

- zdarzenie należy do bieżącego uwierzytelnionego połączenia dla danego identyfikatora węzła;
- węzeł ma efektywne uprawnienie `accessibility: true`;
- ładunek zawiera ograniczoną wartość całkowitą `idleSeconds`.

Gateway odejmuje `idleSeconds` od własnego czasu obserwacji, aby wyznaczyć
`lastActiveAtMs`. Nigdy nie ufa znacznikowi czasu zegara czasu rzeczywistego dostarczonemu przez węzeł. Wśród
połączonych kwalifikujących się komputerów Mac wygrywa najnowsza wartość `lastActiveAtMs`; w przypadku remisu używana jest
najnowsza aktualizacja obecności.

Obecność jest lokalna dla procesu i powiązana z połączeniem. Rozłączenie bieżącej
sesji, zastąpienie jej inną sesją używającą tego samego identyfikatora węzła albo cofnięcie
uprawnienia Accessibility usuwa stan aktywności tego węzła i ponownie wyznacza aktywny komputer Mac.

## Prywatność i kontekst modelu

OpenClaw wysyła czas bezczynności, a nie treść danych wejściowych. Nie wysyła wartości klawiszy,
współrzędnych myszy, nazw aplikacji, tytułów okien ani nieprzetworzonych zdarzeń wejściowych. Moduł
raportujący macOS odczytuje sprzętowy stan HID, dlatego syntetyczne zdarzenia sterowania
komputerem nie sprawiają, że zautomatyzowany komputer Mac jest uznawany za komputer używany fizycznie.

Ciągła aktywność nie tworzy zdarzeń systemowych widocznych dla modelu. Dynamiczny
wiersz środowiska uruchomieniowego zawiera wyłącznie uwierzytelniony identyfikator węzła:

```text
active_node=<node-id>
```

Dokładne znaczniki czasu i kontrolowane przez węzeł nazwy wyświetlane nie trafiają do promptu, aby
uniknąć wstrzyknięcia promptu i częstych zmian pamięci podręcznej. Gdy agent potrzebuje aktualnych szczegółów,
narzędzie `nodes` może zamiast tego odczytać `node.list` lub `node.describe`.

## Jak kierowane są alerty o połączeniu

Po zakończeniu uzgadniania połączenia węzła z Gateway OpenClaw czeka 750 milisekund, aby
łączący się komputer Mac mógł przesłać pierwszą próbkę aktywności. Następnie próbuje użyć
połączonego komputera Mac z obsługą powiadomień, który ma najnowszą aktywność.

- Jeśli podstawowe dostarczenie powiedzie się, żaden inny komputer Mac nie otrzyma alertu.
- Jeśli aktywny komputer Mac jest niedostępny lub podstawowe dostarczenie zakończy się niepowodzeniem, OpenClaw czeka pięć
  sekund i próbuje użyć wszystkich pozostałych połączonych komputerów Mac, które udostępniają `system.notify`.
- Alert o ponownym połączeniu tego samego węzła jest wstrzymywany przez pięć minut po
  rzeczywistej próbie dostarczenia, co zapobiega powstaniu lawiny powiadomień wskutek
  niestabilnego ponownego łączenia.

Alerty są powiązane z konkretnymi połączeniami węzłów. Rozłączona lub zastąpiona sesja
źródłowa nie może ukończyć wcześniej zaplanowanego alertu, a zastępcze połączenie docelowe
nadal może uczestniczyć w dostarczaniu awaryjnym.

## Rozwiązywanie problemów

| Objaw                                     | Co sprawdzić                                                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Żaden wiersz nie jest oznaczony jako `active` | Potwierdź, że natywny węzeł macOS jest połączony, a `openclaw nodes describe --node <id>` pokazuje `permissions.accessibility: true`.                                      |
| Niewłaściwy komputer Mac pozostaje aktywny | Użyj fizycznie tego komputera Mac, poczekaj na upłynięcie okna agregacji, a następnie ponownie uruchom `openclaw nodes status`. Syntetyczne działania sterujące komputerem nie są uwzględniane. |
| Dane o ostatnich danych wejściowych znikają | Sprawdź, czy komputer Mac został rozłączony, jego sesja węzła została zastąpiona lub cofnięto uprawnienie Accessibility. Każdy z tych warunków celowo usuwa aktywność. |
| Alert pojawia się na kilku komputerach Mac | Podstawowe dostarczenie było niedostępne lub nie powiodło się, więc uruchomiono opóźnione dostarczanie awaryjne. Sprawdź, czy aktywny komputer Mac jest połączony, zezwala na powiadomienia i udostępnia `system.notify`. |
| Agent nie wspomina o aktywnym komputerze Mac | Rozpocznij nową turę po zmianie aktywności. Wskazówka środowiska uruchomieniowego jest stabilna i zwarta; użyj narzędzia `nodes`, aby uzyskać dokładne bieżące metadane. |

Informacje o przywracaniu uprawnień TCC zawiera strona [uprawnienia macOS](/pl/platforms/mac/permissions). Informacje o
problemach z połączeniem węzła i wykonywaniem poleceń zawiera strona [Rozwiązywanie problemów z Node](/pl/nodes/troubleshooting).

## Powiązane materiały

- [Węzły](/pl/nodes)
- [CLI węzłów](/pl/cli/nodes)
- [Obecność systemowa](/pl/concepts/presence)
- [Protokół Gateway](/pl/gateway/protocol#presence)
- [Aplikacja macOS](/pl/platforms/macos)
