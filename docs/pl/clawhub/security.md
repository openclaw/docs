---
read_when:
    - Zrozumienie wyników skanowania i moderacji ClawHub
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie wstrzymanego, ukrytego lub zablokowanego wpisu
summary: Zachowanie ClawHub dotyczące zaufania, skanowania, zgłaszania, odwołań i moderacji.
x-i18n:
    generated_at: "2026-05-11T20:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo + moderacja

ClawHub jest otwarty na publikowanie, ale publiczne wpisy nadal przechodzą przez mechanizmy zaufania, skanowania, zgłaszania i moderacji. Cel jest praktyczny: pomóc użytkownikom sprawdzić, co instalują, dać wydawcom ścieżkę odzyskania po fałszywych alarmach i utrzymać nadużywające pakiety poza publicznym odkrywaniem.

Zobacz także [Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem Skills lub pluginu sprawdź jego wpis w ClawHub pod kątem:

- właściciela i atrybucji źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla pluginów
- stanu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji, jeśli są pokazane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na stronach publicznych oraz w diagnostyce widocznej dla właściciela.

Typowe wyniki obejmują:

- `clean`: nie znaleziono problemu blokującego.
- `suspicious`: wydanie wymaga ostrożności lub przeglądu.
- `malicious`: wydanie jest uznawane za niebezpieczne.
- `pending`: kontrole jeszcze się nie zakończyły.
- `held`, `quarantined`, `revoked` lub `hidden`: wydanie nie jest w pełni dostępne na publicznych powierzchniach instalacji.

Dokładne brzmienie może różnić się zależnie od powierzchni, ale praktyczne znaczenie jest takie samo: jeśli wydanie jest wstrzymane lub zablokowane, użytkownicy nie powinni go instalować, dopóki właściciel nie rozwiąże problemu albo moderacja go nie przywróci.

## Skills

Skanowania Skills analizują opublikowany pakiet Skills, metadane, zadeklarowane wymagania i podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na niezgodności między tym, co Skills deklaruje, a tym, co wydaje się robić. Na przykład Skills, który odwołuje się do wymaganego klucza API, powinien zadeklarować ten wymóg w `SKILL.md`, aby użytkownicy mogli go zobaczyć przed instalacją.

Ustalenia skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie jak zadeklarowane dane uwierzytelniające API, lokalne wywołania zwrotne OAuth, ograniczone do zakresu czyszczenie po odinstalowaniu, kodowanie Basic Auth lub wybrane przez użytkownika przesyłanie plików do wskazanego dostawcy, jest traktowane inaczej niż ukryte przekazywanie danych uwierzytelniających, szeroki dostęp do prywatnych plików, niepowiązane miejsca docelowe sieci albo ukryte nadużywanie przeglądarki.

Zobacz [Format Skills](/pl/clawhub/skill-format).

## Pluginy

Wydania pluginów obejmują metadane pakietu, atrybucję źródła, pola zgodności i informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed zainstalowaniem pluginów hostowanych w ClawHub. Rekordy pakietów mogą też ujawniać metadane skrótu, aby OpenClaw mógł weryfikować pobrane artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu `openclaw.environment` podczas przeglądu wydań pluginów, aby zadeklarowane wymagania środowiska uruchomieniowego były porównywane z obserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pakiety i komentarze.

Zgłoszenia powinny być konkretne i umożliwiać podjęcie działań. Nadużywanie zgłoszeń samo w sobie może prowadzić do działań wobec konta.

Przykłady zgłoszeń:

- mylące metadane
- niezadeklarowane wymagania dotyczące danych uwierzytelniających lub uprawnień
- podejrzane instrukcje instalacji
- komentarze oszustwa lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treść naruszająca [Akceptowalne użycie](/pl/clawhub/acceptable-usage)

## Zgłoszenia w złej wierze lub dotyczące znaków towarowych

ClawHub używa tego samego potoku zgłoszeń i moderacji personelu dla rejestracji w złej wierze, podszywania się i sporów związanych ze znakami towarowymi. Te zgłoszenia wymagają wystarczającego kontekstu, aby personel mógł zidentyfikować roszczącego, sporny wpis i żądane działanie.

Uwzględnij:

- kanoniczny URL Skills lub pakietu w ClawHub oraz uchwyt właściciela
- znak towarowy, projekt, firmę lub nazwę produktu, których dotyczy sprawa
- publiczne dowody własności lub upoważnienia roszczącego
- dlaczego obecny właściciel nie jest upoważniony do publikowania pod tą nazwą
- żądane działanie, takie jak ukrycie do czasu przeglądu, przeniesienie własności, zmiana nazwy lub usunięcie

Nie umieszczaj prywatnych sekretów ani wrażliwych dokumentów prawnych w publicznych zgłoszeniach. Otwórz zgłoszenie GitHub z niewrażliwymi dowodami i w razie potrzeby poproś opiekunów o prywatną ścieżkę przekazania.

## Odwołania i ponowne skanowania

Właściciele mogą poprosić o ponowne skanowanie, gdy uważają, że Skills lub pakiet został błędnie wstrzymany albo oznaczony. Moderatorzy platformy i administratorzy mogą zażądać ponownych skanowań dowolnego Skills lub pakietu podczas obsługi zgłoszeń albo próśb o wsparcie:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

W przypadku moderowanych treści właściciele mogą mieć możliwość złożenia odwołania z powierzchni ClawHub widocznych dla właściciela. Odwołania powinny wyjaśniać, co się zmieniło albo dlaczego oznaczenie jest nieprawidłowe.

## Wstrzymania moderacyjne

Gdy skaner statyczny oznaczy przesłany Skills jako złośliwy, wydawca jest automatycznie obejmowany wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione na użytkowniku). Ukrywa to wszystkie Skills wydawcy, powoduje, że przyszłe publikacje zaczynają jako ukryte, i tworzy wpis dziennika audytu `user.moderation.auto`.

Statyczne podejrzane ustalenia są zachowywane jako dowody plik/wiersz dla moderatorów, ale same nie ukrywają treści ani nie decydują o publicznym werdykcie skanowania. Nowe przesłania pozostają w stanie przeglądu/oczekiwania, dopóki nie zakończy się przegląd LLM. Skanowanie statyczne blokuje natychmiast tylko w przypadku sygnatur złośliwych. Trafienia silnika VirusTotal pozostają widocznym dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm są doradcze i same nie ukrywają Skills. Przeglądy LLM ClawScan zachowują notatki zgodne z przeznaczeniem jako wskazówki. Ustalenia przeglądu o średniej wadze pozostają widoczne na artefakcie, natomiast filtr podejrzanych jest zarezerwowany dla istotnych obaw LLM, złośliwych ustaleń lub potwierdzonych wykryć silnika AV.

Administratorzy mogą zdjąć wstrzymanie będące fałszywym alarmem:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Czyści to `requiresModerationAt` i `requiresModerationReason`, przywraca Skills ukryte przez wstrzymanie na poziomie użytkownika i zapisuje wpis dziennika audytu `user.moderation.lift`. Skills ukryte z innych powodów albo takie, których własne skanowanie statyczne nadal jest złośliwe, pozostają ukryte.

## Blokady i stan konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą skutkować blokadami kont, unieważnieniem tokenów, ukryciem treści lub usunięciem wpisów.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI zaczyna zawodzić po działaniu wobec konta, zaloguj się do interfejsu webowego, aby sprawdzić stan konta, albo skontaktuj się z opiekunami przez oczekiwany kanał wsparcia projektu.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, streszczeń, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj próbnych uruchomień przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
