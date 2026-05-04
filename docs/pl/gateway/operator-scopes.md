---
read_when:
    - Debugowanie błędów związanych z brakującym zakresem operatora
    - Przeglądanie zatwierdzeń parowania urządzeń lub Node
    - Dodawanie lub klasyfikowanie metod RPC Gateway
summary: Role operatorów, zakresy i kontrole w momencie zatwierdzania dla klientów Gateway
title: Zakresy operatora
x-i18n:
    generated_at: "2026-05-04T02:25:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Zakresy operatora określają, co klient Gateway może zrobić po uwierzytelnieniu.
Są zabezpieczeniem płaszczyzny sterowania w jednej zaufanej domenie operatora
Gateway, a nie izolacją przed wrogą wielodzierżawnością. Jeśli potrzebujesz
silnego rozdzielenia osób, zespołów lub maszyn, uruchom oddzielne Gateway
pod oddzielnymi użytkownikami systemu operacyjnego lub na oddzielnych hostach.

Powiązane: [Bezpieczeństwo](/pl/gateway/security), [protokół Gateway](/pl/gateway/protocol),
[parowanie Gateway](/pl/gateway/pairing), [CLI urządzeń](/pl/cli/devices).

## Role

Klienci WebSocket Gateway łączą się z jedną rolą:

- `operator`: klienci płaszczyzny sterowania, tacy jak CLI, Control UI, automatyzacja i
  zaufane procesy pomocnicze.
- `node`: hosty funkcji, takie jak macOS, iOS, Android lub bezgłowe Node, które
  udostępniają polecenia przez `node.invoke`.

Metody RPC operatora wymagają roli `operator`. Metody pochodzące z Node
wymagają roli `node`.

## Poziomy zakresów

| Zakres                  | Znaczenie                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Status tylko do odczytu, listy, katalog, logi, odczyty sesji i inne niemutujące wywołania płaszczyzny sterowania.                                                                   |
| `operator.write`        | Zwykłe mutujące działania operatora, takie jak wysyłanie wiadomości, wywoływanie narzędzi, aktualizowanie ustawień rozmowy/głosu i przekazywanie poleceń Node. Spełnia też `operator.read`. |
| `operator.admin`        | Administracyjny dostęp do płaszczyzny sterowania. Spełnia każdy zakres `operator.*`. Wymagany do mutowania konfiguracji, aktualizacji, natywnych hooków, wrażliwych zarezerwowanych przestrzeni nazw i zatwierdzeń wysokiego ryzyka. |
| `operator.pairing`      | Zarządzanie parowaniem urządzeń i Node, w tym wyświetlanie listy, zatwierdzanie, odrzucanie, usuwanie, rotacja i unieważnianie rekordów parowania lub tokenów urządzeń.             |
| `operator.approvals`    | API zatwierdzeń exec i pluginów.                                                                                                                                                    |
| `operator.talk.secrets` | Odczytywanie konfiguracji Talk z dołączonymi sekretami.                                                                                                                             |

Nieznane przyszłe zakresy `operator.*` wymagają dokładnego dopasowania, chyba że wywołujący ma
`operator.admin`.

## Zakres metody to tylko pierwsza bramka

Każde RPC Gateway ma zakres metody zgodny z zasadą najmniejszych uprawnień. Ten zakres metody decyduje,
czy żądanie może dotrzeć do obsługi. Niektóre procedury obsługi stosują potem surowsze
kontrole w czasie zatwierdzania na podstawie konkretnej rzeczy, która jest zatwierdzana lub mutowana.

Przykłady:

- `device.pair.approve` jest osiągalne z `operator.pairing`, ale zatwierdzenie
  urządzenia operatora może nadać lub zachować tylko zakresy, które wywołujący już ma.
- `node.pair.approve` jest osiągalne z `operator.pairing`, a następnie wyprowadza dodatkowe
  zakresy zatwierdzenia z listy oczekujących poleceń Node.
- `chat.send` zwykle jest metodą w zakresie zapisu, ale trwałe `/config set`
  i `/config unset` wymagają `operator.admin` na poziomie polecenia.

Pozwala to operatorom o niższych zakresach wykonywać działania parowania o niskim ryzyku bez
wymuszania, aby każde zatwierdzenie parowania wymagało uprawnień administratora.

## Zatwierdzenia parowania urządzeń

Rekordy parowania urządzeń są trwałym źródłem zatwierdzonych ról i zakresów.
Już sparowane urządzenia nie otrzymują szerszego dostępu po cichu: ponowne połączenia, które proszą
o szerszą rolę lub szersze zakresy, tworzą nowe oczekujące żądanie podniesienia uprawnień.

Podczas zatwierdzania żądania urządzenia:

- Żądanie bez roli operatora nie wymaga zatwierdzenia zakresu tokenu operatora.
- Żądanie dla `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` lub `operator.talk.secrets` wymaga, aby wywołujący miał
  te zakresy albo `operator.admin`.
- Żądanie dla `operator.admin` wymaga `operator.admin`.
- Żądanie naprawy bez jawnych zakresów może odziedziczyć istniejące zakresy tokenu
  operatora. Jeśli ten istniejący token ma zakres administratora, zatwierdzenie nadal wymaga
  `operator.admin`.

W przypadku sesji tokenów sparowanych urządzeń zarządzanie jest ograniczone do własnego zakresu, chyba że wywołujący
ma także `operator.admin`: wywołujący bez uprawnień administratora widzą tylko własne wpisy parowania,
mogą zatwierdzić lub odrzucić tylko własne oczekujące żądanie oraz mogą rotować, unieważniać lub
usunąć tylko własny wpis urządzenia.

## Zatwierdzenia parowania Node

Starsze `node.pair.*` używa oddzielnego, należącego do Gateway magazynu parowania Node. Node WS
używają parowania urządzeń z `role: node`, ale obowiązuje to samo słownictwo poziomu zatwierdzeń.

`node.pair.approve` używa listy oczekujących poleceń żądania, aby wyprowadzić dodatkowe
wymagane zakresy:

- Żądanie bez poleceń: `operator.pairing`
- Polecenia Node inne niż exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

Parowanie Node ustanawia tożsamość i zaufanie. Nie zastępuje własnej polityki
zatwierdzania exec `system.run` Node.

## Uwierzytelnianie współdzielonym sekretem

Uwierzytelnianie współdzielonym tokenem/hasłem Gateway jest traktowane jako zaufany dostęp operatora do
tego Gateway. Powierzchnie HTTP zgodne z OpenAI i `/tools/invoke` przywracają
normalny pełny domyślny zestaw zakresów operatora dla uwierzytelniania bearer współdzielonym sekretem, nawet jeśli
wywołujący wysyła węższe zadeklarowane zakresy.

Tryby niosące tożsamość, takie jak uwierzytelnianie przez zaufany proxy lub prywatny ingress `none`,
mogą nadal honorować jawnie zadeklarowane zakresy. Używaj oddzielnych Gateway do rzeczywistego
rozdzielenia granic zaufania.
