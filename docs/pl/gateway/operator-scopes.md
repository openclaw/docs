---
read_when:
    - Debugowanie błędów braku zakresu operatora
    - Przeglądanie zatwierdzeń parowania urządzeń lub Node’ów
    - Dodawanie lub klasyfikowanie metod RPC Gateway
summary: Role operatorów, zakresy i kontrole podczas zatwierdzania dla klientów Gateway
title: Zakresy operatora
x-i18n:
    generated_at: "2026-07-12T15:07:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Zakresy operatora ograniczają działania, które klient Gateway może wykonywać po uwierzytelnieniu.
Stanowią mechanizm ochronny płaszczyzny sterowania w obrębie jednej zaufanej domeny operatora Gateway,
a nie izolację przed wrogimi współdzierżawcami. Aby zapewnić silną separację między osobami,
zespołami lub maszynami, uruchamiaj oddzielne instancje Gateway z użyciem oddzielnych użytkowników systemu operacyjnego lub hostów.

Powiązane: [Bezpieczeństwo](/pl/gateway/security), [Protokół Gateway](/pl/gateway/protocol),
[Parowanie Gateway](/pl/gateway/pairing), [CLI urządzeń](/pl/cli/devices).

## Role

Każdy klient WebSocket Gateway łączy się z jedną rolą:

- `operator`: klienci płaszczyzny sterowania, takie jak CLI, interfejs sterowania, automatyzacja oraz
  zaufane procesy pomocnicze.
- `node`: hosty udostępniające funkcje (macOS, iOS, Android, bez interfejsu graficznego), które udostępniają
  polecenia za pośrednictwem `node.invoke`.

Metody RPC operatora wymagają roli `operator`, natomiast metody pochodzące z węzła
wymagają roli `node`.

## Poziomy zakresów

| Zakres                  | Znaczenie                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Stan tylko do odczytu, listy, katalog, dzienniki, odczyty sesji i inne wywołania niemodyfikujące.                                                                                                          |
| `operator.write`        | Działania operatora wprowadzające zmiany: wysyłanie wiadomości, wywoływanie narzędzi, aktualizowanie ustawień rozmowy/głosu, przekazywanie poleceń węzła. Spełnia również wymagania `operator.read`.           |
| `operator.admin`        | Dostęp administracyjny. Spełnia wymagania każdego zakresu `operator.*`. Wymagany do modyfikowania konfiguracji, aktualizacji, natywnych haków, zastrzeżonych przestrzeni nazw i zatwierdzania operacji wysokiego ryzyka. |
| `operator.pairing`      | Zarządzanie parowaniem urządzeń i węzłów: wyświetlanie listy, zatwierdzanie, odrzucanie, usuwanie, rotacja i unieważnianie.                                                                                  |
| `operator.approvals`    | Interfejsy API zatwierdzania wykonywania poleceń i pluginów.                                                                                                                                               |
| `operator.talk.secrets` | Odczytywanie konfiguracji rozmowy wraz z sekretami.                                                                                                                                                        |

Nieznane przyszłe zakresy `operator.*` wymagają dokładnego dopasowania, chyba że wywołujący
ma już zakres `operator.admin`.

## Zakres metody jest tylko pierwszą bramą

Każde wywołanie RPC Gateway ma zakres metody zgodny z zasadą najmniejszych uprawnień, który określa, czy
żądanie dotrze do jego procedury obsługi. Niektóre procedury obsługi stosują następnie bardziej rygorystyczne kontrole zależne od
konkretnego zatwierdzanego lub modyfikowanego elementu:

- `device.pair.approve` jest dostępne z zakresem `operator.pairing`, ale zatwierdzenie
  urządzenia operatora może utworzyć lub zachować wyłącznie zakresy, które wywołujący już ma.
- `node.pair.approve` jest dostępne z zakresem `operator.pairing`, a następnie wyznacza dodatkowe
  zakresy zatwierdzania na podstawie zadeklarowanej listy poleceń oczekującego węzła.
- `chat.send` jest metodą wymagającą zakresu zapisu, ale polecenia czatu `/config set` i
  `/config unset` wymagają dodatkowo `operator.admin`,
  niezależnie od zakresu wysyłania wiadomości na czacie posiadanego przez wywołującego.

Pozwala to operatorom o niższych zakresach wykonywać działania związane z parowaniem o niskim ryzyku bez
wymagania uprawnień administratora dla wszystkich zatwierdzeń parowania.

## Zatwierdzanie parowania urządzeń

Rekordy parowania urządzeń są trwałym źródłem zatwierdzonych ról i zakresów.
Już sparowane urządzenie nie uzyskuje po cichu szerszego dostępu: ponowne połączenie
żądające szerszej roli lub szerszych zakresów tworzy nowe oczekujące żądanie rozszerzenia uprawnień.

Zatwierdzanie żądania urządzenia:

- Żądanie bez roli operatora nie wymaga zatwierdzenia zakresu operatora.
- Żądanie roli urządzenia innej niż operator (na przykład `node`) wymaga
  `operator.admin`, mimo że samo `device.pair.approve` wymaga jedynie
  `operator.pairing`.
- Żądanie zakresu `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` lub `operator.talk.secrets` wymaga, aby wywołujący już
  miał ten zakres albo `operator.admin`.
- Żądanie zakresu `operator.admin` wymaga `operator.admin`.
- Żądanie naprawy bez jawnie określonych zakresów może odziedziczyć zakresy istniejącego tokenu
  operatora; jeśli ten token ma zakres administracyjny, zatwierdzenie nadal wymaga
  `operator.admin`.

Sesje bez uprawnień administratora korzystające ze współdzielonego sekretu lub zaufanego serwera proxy mogą zatwierdzać wyłącznie
żądania urządzeń operatora mieszczące się w ich własnych zadeklarowanych zakresach operatora; zatwierdzanie
ról innych niż operator wymaga uprawnień administratora, nawet jeśli te sesje mogą poza tym używać
`operator.pairing`.

W przypadku sesji tokenów sparowanych urządzeń zarządzanie jest ograniczone do własnego urządzenia, chyba że wywołujący
ma `operator.admin`: wywołujący bez uprawnień administratora widzi wyłącznie własne wpisy parowania i
może zatwierdzać, odrzucać, rotować, unieważniać lub usuwać wyłącznie wpis własnego urządzenia.

## Zatwierdzanie parowania węzłów

Starsze metody `node.pair.*` korzystają z oddzielnego magazynu parowania węzłów zarządzanego przez Gateway.
Węzły WS korzystają zamiast tego z parowania urządzeń (`role: node`), ale obowiązuje ten sam zestaw
pojęć związanych z zatwierdzaniem. Informacje o relacji między tymi dwoma
magazynami zawiera sekcja [Parowanie Gateway](/pl/gateway/pairing).

`node.pair.approve` wyznacza dodatkowe wymagane zakresy na podstawie listy poleceń
oczekującego żądania:

| Zadeklarowane polecenia                                | Wymagane zakresy                       |
| ----------------------------------------------------- | -------------------------------------- |
| brak                                                  | `operator.pairing`                     |
| polecenia węzła niewykonujące procesów                | `operator.pairing` + `operator.write`  |
| `system.run`, `system.run.prepare` lub `system.which` | `operator.pairing` + `operator.admin`  |

Zatwierdzenie deklaracji węzła nie włącza poleceń, które mają oddzielną
bramę listy dozwolonych operacji czasu wykonywania. Na przykład zatwierdzenie węzła deklarującego
`computer.act` wymaga zakresu parowania i zapisu, ale jedynie rejestruje ten interfejs.
Administrator lub właściciel nadal musi aktywować `computer.act`. Dopóki pozostaje ono
aktywne, wywoływanie go za pośrednictwem wymagającej zakresu zapisu metody `node.invoke` nie
wymaga zakresu administracyjnego dla każdego działania.

Parowanie węzła ustanawia tożsamość i zaufanie; nie zastępuje własnych zasad zatwierdzania
wykonywania poleceń `system.run` przez węzeł.

## Uwierzytelnianie współdzielonym sekretem

Uwierzytelnianie za pomocą współdzielonego tokenu/hasła Gateway jest traktowane jako zaufany dostęp operatora do
tego Gateway. Interfejsy HTTP zgodne z OpenAI, `/tools/invoke` oraz punkty końcowe HTTP
historii sesji przywracają pełny domyślny zestaw zakresów operatora w przypadku uwierzytelniania typu bearer
za pomocą współdzielonego sekretu, nawet jeśli wywołujący przesyła węższe zadeklarowane zakresy.

Tryby przekazujące tożsamość, takie jak uwierzytelnianie przez zaufany serwer proxy lub `none` dla prywatnego ruchu przychodzącego,
mogą nadal respektować jawnie zadeklarowane zakresy. Aby zapewnić rzeczywistą separację granic zaufania,
używaj oddzielnych instancji Gateway.
