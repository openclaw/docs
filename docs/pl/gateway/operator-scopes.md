---
read_when:
    - Debugowanie błędów związanych z brakującym zakresem operatora
    - Przeglądanie zatwierdzeń parowania urządzeń lub Node
    - Dodawanie lub klasyfikowanie metod RPC Gateway
summary: Role operatorów, zakresy i kontrole na etapie zatwierdzania dla klientów Gateway
title: Zakresy operatora
x-i18n:
    generated_at: "2026-05-03T09:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Zakresy operatora definiują, co klient Gateway może zrobić po uwierzytelnieniu.
Są mechanizmem ochronnym płaszczyzny sterowania w jednej zaufanej domenie
operatora Gateway, a nie izolacją dla niezaufanego środowiska wielodzierżawnego.
Jeśli potrzebujesz silnego rozdzielenia osób, zespołów lub maszyn, uruchom
osobne instancje Gateway pod osobnymi użytkownikami systemu operacyjnego lub na
osobnych hostach.

Powiązane: [Bezpieczeństwo](/pl/gateway/security), [protokół Gateway](/pl/gateway/protocol),
[parowanie Gateway](/pl/gateway/pairing), [CLI urządzeń](/pl/cli/devices).

## Role

Klienty WebSocket Gateway łączą się z jedną rolą:

- `operator`: klienci płaszczyzny sterowania, tacy jak CLI, interfejs Control UI, automatyzacja i
  zaufane procesy pomocnicze.
- `node`: hosty możliwości, takie jak macOS, iOS, Android lub węzły bez interfejsu, które
  udostępniają polecenia przez `node.invoke`.

Metody RPC operatora wymagają roli `operator`. Metody pochodzące z węzła
wymagają roli `node`.

## Poziomy zakresu

| Zakres                  | Znaczenie                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Stan tylko do odczytu, listy, katalog, dzienniki, odczyty sesji i inne wywołania płaszczyzny sterowania, które nie modyfikują stanu.                                                         |
| `operator.write`        | Zwykłe modyfikujące działania operatora, takie jak wysyłanie wiadomości, wywoływanie narzędzi, aktualizowanie ustawień rozmowy/głosu i przekazywanie poleceń węzła. Spełnia też `operator.read`. |
| `operator.admin`        | Administracyjny dostęp do płaszczyzny sterowania. Spełnia każdy zakres `operator.*`. Wymagany do mutacji konfiguracji, aktualizacji, natywnych hooków, wrażliwych zarezerwowanych przestrzeni nazw i zatwierdzeń wysokiego ryzyka. |
| `operator.pairing`      | Zarządzanie parowaniem urządzeń i węzłów, w tym wyświetlanie, zatwierdzanie, odrzucanie, usuwanie, rotowanie i unieważnianie rekordów parowania lub tokenów urządzeń.                         |
| `operator.approvals`    | API zatwierdzania exec i pluginów.                                                                                                                                                           |
| `operator.talk.secrets` | Odczytywanie konfiguracji Talk z dołączonymi sekretami.                                                                                                                                       |

Nieznane przyszłe zakresy `operator.*` wymagają dokładnego dopasowania, chyba że wywołujący ma
`operator.admin`.

## Zakres metody to tylko pierwsza bramka

Każde RPC Gateway ma zakres metody o najmniejszych uprawnieniach. Ten zakres metody decyduje,
czy żądanie może dotrzeć do obsługi. Niektóre procedury obsługi stosują następnie bardziej rygorystyczne
kontrole w czasie zatwierdzania na podstawie konkretnej rzeczy, która jest zatwierdzana lub modyfikowana.

Przykłady:

- `device.pair.approve` jest dostępne z `operator.pairing`, ale zatwierdzenie
  urządzenia operatora może nadać lub zachować tylko zakresy, które wywołujący już posiada.
- `node.pair.approve` jest dostępne z `operator.pairing`, a następnie wyprowadza dodatkowe
  zakresy zatwierdzania z oczekującej listy poleceń węzła.
- `chat.send` jest zwykle metodą z zakresem zapisu, ale trwałe `/config set`
  i `/config unset` wymagają `operator.admin` na poziomie polecenia.

Dzięki temu operatorzy z niższym zakresem mogą wykonywać działania parowania o niskim ryzyku bez ustawiania
wszystkich zatwierdzeń parowania jako dostępnych tylko dla administratora.

## Zatwierdzenia parowania urządzeń

Rekordy parowania urządzeń są trwałym źródłem zatwierdzonych ról i zakresów.
Już sparowane urządzenia nie otrzymują szerszego dostępu po cichu: ponowne połączenia, które proszą
o szerszą rolę lub szersze zakresy, tworzą nowe oczekujące żądanie podniesienia uprawnień.

Podczas zatwierdzania żądania urządzenia:

- Żądanie bez roli operatora nie wymaga zatwierdzenia zakresu tokenu operatora.
- Żądanie `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` lub `operator.talk.secrets` wymaga, aby wywołujący miał
  te zakresy albo `operator.admin`.
- Żądanie `operator.admin` wymaga `operator.admin`.
- Żądanie naprawy bez jawnych zakresów może odziedziczyć istniejące zakresy tokenu
  operatora. Jeśli ten istniejący token ma zakres administratora, zatwierdzenie nadal wymaga
  `operator.admin`.

W przypadku sesji tokenów sparowanych urządzeń zarządzanie jest ograniczone do własnego zakresu, chyba że wywołujący
ma też `operator.admin`: wywołujący bez uprawnień administratora mogą rotować, unieważniać lub usuwać tylko
wpis własnego urządzenia.

## Zatwierdzenia parowania węzłów

Starsze `node.pair.*` używa osobnego, należącego do Gateway magazynu parowania węzłów. Węzły WS
używają parowania urządzeń z `role: node`, ale obowiązuje ten sam słownik poziomów zatwierdzania.

`node.pair.approve` używa listy poleceń oczekującego żądania, aby wyprowadzić dodatkowe
wymagane zakresy:

- Żądanie bez polecenia: `operator.pairing`
- Polecenia węzła inne niż exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

Parowanie węzłów ustanawia tożsamość i zaufanie. Nie zastępuje własnej polityki
zatwierdzania exec `system.run` danego węzła.

## Uwierzytelnianie współdzielonym sekretem

Uwierzytelnianie współdzielonym tokenem/hasłem Gateway jest traktowane jako zaufany dostęp operatora do
tego Gateway. Powierzchnie HTTP zgodne z OpenAI oraz `/tools/invoke` przywracają
zwykły, pełny domyślny zestaw zakresów operatora dla uwierzytelniania bearer współdzielonym sekretem, nawet jeśli
wywołujący wysyła węższe zadeklarowane zakresy.

Tryby niosące tożsamość, takie jak uwierzytelnianie przez zaufane proxy lub `none` dla prywatnego wejścia,
mogą nadal respektować jawnie zadeklarowane zakresy. Używaj osobnych instancji Gateway do rzeczywistego
rozdzielenia granic zaufania.
