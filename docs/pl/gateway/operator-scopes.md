---
read_when:
    - Debugowanie błędów braku zakresu operatora
    - Przeglądanie zatwierdzeń parowania urządzeń lub Node’ów
    - Dodawanie lub klasyfikowanie metod RPC Gateway
summary: Role operatorów, zakresy uprawnień i kontrole podczas zatwierdzania dla klientów Gateway
title: Zakresy operatora
x-i18n:
    generated_at: "2026-07-16T18:38:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Zakresy operatora ograniczają działania, które klient Gateway może wykonywać po uwierzytelnieniu.
Stanowią zabezpieczenie płaszczyzny sterowania w obrębie jednej zaufanej domeny operatora Gateway,
a nie izolację między niezaufanymi dzierżawcami. Aby zapewnić silną separację między osobami,
zespołami lub maszynami, należy uruchamiać oddzielne instancje Gateway na oddzielnych kontach użytkowników systemu operacyjnego lub hostach.

Powiązane: [Bezpieczeństwo](/pl/gateway/security), [Protokół Gateway](/pl/gateway/protocol),
[Parowanie Gateway](/pl/gateway/pairing), [CLI urządzeń](/pl/cli/devices).

## Role

Każdy klient WebSocket Gateway łączy się z jedną rolą:

- `operator`: klienci płaszczyzny sterowania, tacy jak CLI, interfejs Control UI, automatyzacja i
  zaufane procesy pomocnicze.
- `node`: hosty funkcji (macOS, iOS, Android, bez interfejsu graficznego), które udostępniają
  polecenia za pośrednictwem `node.invoke`.

Metody RPC operatora wymagają roli `operator`; metody inicjowane przez węzeł
wymagają roli `node`.

## Poziomy zakresów

| Zakres                  | Znaczenie                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Stan tylko do odczytu, listy, katalog, dzienniki, odczyt sesji i inne wywołania niemodyfikujące.                                                                          |
| `operator.write`        | Działania operatora wprowadzające zmiany: wysyłanie wiadomości, wywoływanie narzędzi, aktualizowanie ustawień rozmowy/głosu, przekazywanie poleceń węzła. Spełnia również `operator.read`.                |
| `operator.admin`        | Dostęp administracyjny. Spełnia każdy zakres `operator.*`. Wymagany do modyfikowania konfiguracji, aktualizacji, natywnych punktów zaczepienia, zastrzeżonych przestrzeni nazw i zatwierdzania operacji wysokiego ryzyka. |
| `operator.pairing`      | Zarządzanie parowaniem urządzeń i węzłów: wyświetlanie, zatwierdzanie, odrzucanie, usuwanie, rotacja, unieważnianie.                                                                            |
| `operator.approvals`    | Interfejsy API zatwierdzania wykonania i pluginów.                                                                                                                                |
| `operator.talk.secrets` | Odczytywanie konfiguracji rozmowy wraz z sekretami.                                                                                                             |

Nieznane przyszłe zakresy `operator.*` wymagają dokładnego dopasowania, chyba że wywołujący
ma już zakres `operator.admin`.

## Zakres metody jest tylko pierwszą bramą

Każde wywołanie RPC Gateway ma zakres metody zgodny z zasadą najmniejszych uprawnień, który decyduje, czy
żądanie dotrze do jego procedury obsługi. Niektóre procedury obsługi stosują następnie bardziej rygorystyczne kontrole zależne od
konkretnego elementu podlegającego zatwierdzeniu lub modyfikacji:

- `device.pair.approve` jest dostępne z zakresem `operator.pairing`, ale zatwierdzenie
  urządzenia operatora może nadać lub zachować tylko zakresy, które wywołujący już ma.
- `node.pair.approve` jest dostępne z zakresem `operator.pairing`, a następnie wyprowadza dodatkowe
  zakresy zatwierdzania z zadeklarowanej listy poleceń oczekującego węzła.
- `chat.send` jest metodą wymagającą zakresu zapisu, ale polecenia czatu `/config set` i
  `/config unset` wymagają dodatkowo zakresu `operator.admin`,
  niezależnie od zakresu wywołującego uprawniającego do wysyłania wiadomości na czacie.

Dzięki temu operatorzy z niższymi zakresami mogą wykonywać operacje parowania niskiego ryzyka bez
ograniczania wszystkich zatwierdzeń parowania wyłącznie do administratorów.

## Zatwierdzanie parowania urządzeń

Rekordy parowania urządzeń są trwałym źródłem zatwierdzonych ról i zakresów.
Już sparowane urządzenie nie uzyskuje po cichu szerszego dostępu: ponowne połączenie,
które żąda szerszej roli lub szerszych zakresów, tworzy nowe oczekujące żądanie
rozszerzenia uprawnień.

Zatwierdzanie żądania urządzenia:

- Żądanie bez roli operatora nie wymaga zatwierdzenia zakresu operatora.
- Żądanie roli urządzenia innej niż operator (na przykład `node`) wymaga
  `operator.admin`, mimo że samo `device.pair.approve` wymaga tylko
  `operator.pairing`.
- Żądanie zakresu `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` lub `operator.talk.secrets` wymaga, aby wywołujący już
  miał ten zakres lub `operator.admin`.
- Żądanie zakresu `operator.admin` wymaga `operator.admin`.
- Żądanie naprawy bez jawnie określonych zakresów może odziedziczyć zakresy istniejącego tokenu
  operatora; jeśli ten token ma zakres administracyjny, zatwierdzenie nadal wymaga
  `operator.admin`.

Sesje oparte na współdzielonym sekrecie i zaufanym serwerze proxy bez uprawnień administratora mogą zatwierdzać
żądania urządzeń operatora tylko w ramach własnych zadeklarowanych zakresów operatora; zatwierdzanie
ról innych niż operator jest zastrzeżone dla administratora, nawet jeśli te sesje mogą poza tym używać
`operator.pairing`.

W przypadku sesji tokenów sparowanych urządzeń zarządzanie jest ograniczone do własnego urządzenia, chyba że wywołujący
ma zakres `operator.admin`: wywołujący bez uprawnień administratora widzi tylko własne wpisy parowania i
może zatwierdzać, odrzucać, rotować, unieważniać lub usuwać tylko wpis własnego urządzenia.

## Zatwierdzanie parowania węzłów

Starsze metody `node.pair.*` korzystają z oddzielnego magazynu parowania węzłów należącego do Gateway.
Węzły WS korzystają zamiast tego z parowania urządzeń (`role: node`), ale obowiązuje to samo
nazewnictwo zatwierdzeń. Zobacz [Parowanie Gateway](/pl/gateway/pairing), aby dowiedzieć się, jak oba
magazyny są ze sobą powiązane.

`node.pair.approve` wyprowadza dodatkowe wymagane zakresy z listy
poleceń oczekującego żądania:

| Zadeklarowane polecenia                                                                                                    | Wymagane zakresy                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| brak                                                                                                                 | `operator.pairing`                    |
| zwykłe polecenia węzła                                                                                               | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` lub `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Zatwierdzenie deklaracji węzła nie włącza poleceń objętych oddzielną
listą dozwolonych operacji środowiska wykonawczego. Na przykład zatwierdzenie węzła deklarującego
`computer.act` wymaga parowania i zakresu zapisu, ale tylko rejestruje tę funkcję.
Administrator lub właściciel nadal musi uzbroić `computer.act`. Dopóki pozostaje ona
uzbrojona, jej wywoływanie za pośrednictwem metody `node.invoke` wymagającej zakresu zapisu nie
wymaga zakresu administracyjnego dla każdego działania.

Parowanie węzła ustanawia tożsamość i zaufanie; nie zastępuje własnych zasad
zatwierdzania wykonywania `system.run` danego węzła.

## Uwierzytelnianie współdzielonym sekretem

Uwierzytelnianie współdzielonym tokenem/hasłem Gateway jest traktowane jako zaufany dostęp operatora do
tego Gateway. Interfejsy HTTP zgodne z OpenAI, `/tools/invoke` oraz punkty końcowe HTTP
historii sesji przywracają pełny domyślny zestaw zakresów operatora dla
uwierzytelniania nośnikiem współdzielonego sekretu, nawet jeśli wywołujący przesyła węższe zadeklarowane zakresy.

Tryby przekazujące tożsamość, takie jak uwierzytelnianie za pomocą zaufanego serwera proxy lub `none` przez prywatny punkt wejścia,
mogą nadal respektować jawnie zadeklarowane zakresy. Aby zapewnić rzeczywistą separację
granic zaufania, należy używać oddzielnych instancji Gateway.
