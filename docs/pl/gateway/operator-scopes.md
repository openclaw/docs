---
read_when:
    - Debugowanie błędów brakującego zakresu operatora
    - Przeglądanie zatwierdzeń parowania urządzeń lub węzłów
    - Dodawanie lub klasyfikowanie metod RPC Gateway
summary: Role operatorów, zakresy i kontrole w czasie zatwierdzania dla klientów Gateway
title: Zakresy operatora
x-i18n:
    generated_at: "2026-06-27T17:36:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Zakresy operatora określają, co klient Gateway może zrobić po uwierzytelnieniu.
Są zabezpieczeniem płaszczyzny sterowania w obrębie jednej zaufanej domeny operatora Gateway,
a nie izolacją przed wrogim środowiskiem wielodostępnym. Jeśli potrzebujesz silnego rozdzielenia między
osobami, zespołami lub maszynami, uruchom osobne Gateway pod osobnymi użytkownikami systemu operacyjnego lub
na osobnych hostach.

Powiązane: [Bezpieczeństwo](/pl/gateway/security), [Protokół Gateway](/pl/gateway/protocol),
[Parowanie Gateway](/pl/gateway/pairing), [CLI urządzeń](/pl/cli/devices).

## Role

Klienci WebSocket Gateway łączą się z jedną rolą:

- `operator`: klienci płaszczyzny sterowania, tacy jak CLI, Control UI, automatyzacje i
  zaufane procesy pomocnicze.
- `node`: hosty funkcji, takie jak macOS, iOS, Android lub węzły bez interfejsu,
  które udostępniają polecenia przez `node.invoke`.

Metody RPC operatora wymagają roli `operator`. Metody pochodzące z węzła
wymagają roli `node`.

## Poziomy zakresów

| Zakres                  | Znaczenie                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status tylko do odczytu, listy, katalog, dzienniki, odczyty sesji i inne niemutujące wywołania płaszczyzny sterowania.                                                                      |
| `operator.write`        | Zwykłe mutujące działania operatora, takie jak wysyłanie wiadomości, wywoływanie narzędzi, aktualizowanie ustawień rozmowy/głosu i przekazywanie poleceń węzła. Spełnia też `operator.read`. |
| `operator.admin`        | Administracyjny dostęp do płaszczyzny sterowania. Spełnia każdy zakres `operator.*`. Wymagany do mutacji konfiguracji, aktualizacji, natywnych hooków, wrażliwych zarezerwowanych przestrzeni nazw i zatwierdzeń wysokiego ryzyka. |
| `operator.pairing`      | Zarządzanie parowaniem urządzeń i węzłów, w tym wyświetlanie, zatwierdzanie, odrzucanie, usuwanie, rotowanie i unieważnianie rekordów parowania lub tokenów urządzeń.                      |
| `operator.approvals`    | API zatwierdzania exec i pluginów.                                                                                                                                                          |
| `operator.talk.secrets` | Odczytywanie konfiguracji Talk z uwzględnieniem sekretów.                                                                                                                                   |

Nieznane przyszłe zakresy `operator.*` wymagają dokładnego dopasowania, chyba że wywołujący ma
`operator.admin`.

## Zakres metody jest tylko pierwszą bramką

Każde RPC Gateway ma zakres metody o najniższych wymaganych uprawnieniach. Ten zakres metody decyduje,
czy żądanie może dotrzeć do handlera. Niektóre handlery stosują następnie bardziej rygorystyczne
kontrole w czasie zatwierdzania na podstawie konkretnej rzeczy, która jest zatwierdzana lub mutowana.

Przykłady:

- `device.pair.approve` jest osiągalne z `operator.pairing`, ale zatwierdzenie
  urządzenia operatora może wystawić lub zachować tylko zakresy, które wywołujący już ma.
- `node.pair.approve` jest osiągalne z `operator.pairing`, a następnie wyprowadza dodatkowe
  zakresy zatwierdzania z oczekującej listy poleceń węzła.
- `chat.send` jest zwykle metodą w zakresie zapisu, ale trwałe `/config set`
  i `/config unset` wymagają `operator.admin` na poziomie polecenia.

Dzięki temu operatorzy o niższym zakresie mogą wykonywać działania parowania niskiego ryzyka bez ustawiania
wszystkich zatwierdzeń parowania jako dostępnych tylko dla administratora.

## Zatwierdzenia parowania urządzeń

Rekordy parowania urządzeń są trwałym źródłem zatwierdzonych ról i zakresów.
Już sparowane urządzenia nie uzyskują po cichu szerszego dostępu: ponowne połączenia, które proszą
o szerszą rolę lub szersze zakresy, tworzą nowe oczekujące żądanie rozszerzenia.

Podczas zatwierdzania żądania urządzenia:

- Żądanie bez roli operatora nie wymaga zatwierdzenia zakresu tokenu operatora.
- Żądanie roli urządzenia niebędącej operatorem, takiej jak `node`, wymaga
  `operator.admin`, nawet gdy `device.pair.approve` jest osiągalne z
  `operator.pairing`.
- Żądanie `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` lub `operator.talk.secrets` wymaga, aby wywołujący miał
  te zakresy albo `operator.admin`.
- Żądanie `operator.admin` wymaga `operator.admin`.
- Żądanie naprawcze bez jawnych zakresów może odziedziczyć istniejące zakresy
  tokenu operatora. Jeśli ten istniejący token ma zakres administratora, zatwierdzenie nadal wymaga
  `operator.admin`.

Nieadministracyjne sesje współdzielonego sekretu i zaufanego proxy mogą zatwierdzać żądania urządzeń operatora
tylko w obrębie własnych zadeklarowanych zakresów operatora. Zatwierdzanie ról niebędących operatorem
jest dostępne tylko dla administratora, nawet gdy te sesje mogą poza tym używać
`operator.pairing`.

W przypadku sesji tokenów sparowanych urządzeń zarządzanie jest również ograniczone do własnego zakresu, chyba że
wywołujący ma `operator.admin`: wywołujący bez uprawnień administratora widzą tylko własne wpisy parowania,
mogą zatwierdzać lub odrzucać tylko własne oczekujące żądania oraz mogą rotować,
unieważniać lub usuwać tylko własny wpis urządzenia.

## Zatwierdzenia parowania węzłów

Starsze `node.pair.*` używa osobnego magazynu parowania węzłów należącego do Gateway. Węzły WS
używają parowania urządzeń z `role: node`, ale obowiązuje to samo słownictwo poziomów zatwierdzania.

`node.pair.approve` używa oczekującej listy poleceń żądania do wyprowadzenia dodatkowych
wymaganych zakresów:

- Żądanie bez poleceń: `operator.pairing`
- Polecenia węzła inne niż exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

Parowanie węzła ustanawia tożsamość i zaufanie. Nie zastępuje własnej
polityki zatwierdzania exec `system.run` węzła.

## Uwierzytelnianie współdzielonym sekretem

Uwierzytelnianie współdzielonym tokenem/hasłem Gateway jest traktowane jako zaufany dostęp operatora dla
tego Gateway. Powierzchnie HTTP zgodne z OpenAI, `/tools/invoke` i endpointy historii sesji HTTP
przywracają zwykły pełny domyślny zestaw zakresów operatora dla uwierzytelniania bearer współdzielonym sekretem,
nawet jeśli wywołujący wysyła węższe zadeklarowane zakresy.

Tryby niosące tożsamość, takie jak uwierzytelnianie zaufanego proxy lub prywatne wejście `none`,
nadal mogą respektować jawne zadeklarowane zakresy. Używaj osobnych Gateway do rzeczywistego rozdzielenia
granic zaufania.
