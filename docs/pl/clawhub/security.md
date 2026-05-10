---
read_when:
    - Zrozumienie wyników skanowania i moderacji ClawHub
    - Zgłaszanie Skills lub pakietu
    - Odzyskiwanie po wstrzymanym, ukrytym lub zablokowanym wpisie
summary: Zachowanie ClawHub dotyczące zaufania, skanowania, zgłaszania, odwołań i moderacji.
x-i18n:
    generated_at: "2026-05-10T19:27:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo i moderacja

ClawHub jest otwarty na publikowanie, ale publiczne wpisy nadal przechodzą przez mechanizmy zaufania, skanowania, zgłaszania i moderacji. Cel jest praktyczny: pomóc użytkownikom sprawdzić, co instalują, dać wydawcom ścieżkę naprawy w przypadku fałszywych alarmów oraz utrzymać nadużywające pakiety poza publicznym odkrywaniem.

Zobacz także [Dopuszczalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem Skills lub Plugin sprawdź jego wpis w ClawHub pod kątem:

- właściciela i wskazania źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla Plugin
- statusu skanowania lub moderacji
- raportów, komentarzy, gwiazdek, pobrań i sygnałów instalacji, gdy są pokazane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na stronach publicznych oraz w diagnostyce widocznej dla właściciela.

Typowe wyniki obejmują:

- `clean`: nie znaleziono problemu blokującego.
- `suspicious`: wydanie wymaga ostrożności lub przeglądu.
- `malicious`: wydanie jest uznawane za niebezpieczne.
- `pending`: kontrole jeszcze się nie zakończyły.
- `held`, `quarantined`, `revoked` lub `hidden`: wydanie nie jest w pełni
  dostępne na publicznych powierzchniach instalacji.

Dokładne sformułowanie może się różnić w zależności od powierzchni, ale praktyczne znaczenie jest takie samo: jeśli wydanie jest wstrzymane lub zablokowane, użytkownicy nie powinni go instalować, dopóki właściciel nie rozwiąże problemu albo moderacja go nie przywróci.

## Skills

Skanowania Skills analizują opublikowany pakiet Skills, metadane, zadeklarowane wymagania i podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na rozbieżności między tym, co Skills deklaruje, a tym, co wydaje się robić. Na przykład Skills, który odwołuje się do wymaganego klucza API, powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy mogli je zobaczyć przed instalacją.

Wyniki skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie jak zadeklarowane poświadczenia API, zwrotne wywołania OAuth na localhost, ograniczone sprzątanie po odinstalowaniu, kodowanie Basic Auth lub przesyłanie wybranych przez użytkownika plików do wskazanego dostawcy, jest traktowane inaczej niż ukryte przekazywanie poświadczeń, szeroki dostęp do prywatnych plików, niepowiązane miejsca docelowe w sieci lub ukryte nadużycia przeglądarki.

Zobacz [Format Skills](/pl/clawhub/skill-format).

## Plugins

Wydania Plugin obejmują metadane pakietu, wskazanie źródła, pola zgodności oraz informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed zainstalowaniem Plugin hostowanych w ClawHub. Rekordy pakietów mogą także udostępniać metadane skrótu, aby OpenClaw mógł weryfikować pobrane artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu `openclaw.environment` podczas przeglądu wydań Plugin, aby porównać zadeklarowane wymagania uruchomieniowe z zaobserwowanym zachowaniem.

## Raporty

Zalogowani użytkownicy mogą zgłaszać Skills, pakiety i komentarze.

Raporty powinny być konkretne i możliwe do podjęcia działań. Nadużywanie zgłoszeń samo w sobie może prowadzić do działań wobec konta.

Przykłady raportów:

- wprowadzające w błąd metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- oszukańcze komentarze lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Dopuszczalne użycie](/pl/clawhub/acceptable-usage)

## Raporty dotyczące złej wiary lub znaków towarowych

ClawHub używa tego samego potoku raportów i moderacji personelu dla rejestracji w złej wierze, podszywania się oraz sporów związanych ze znakami towarowymi. Te raporty wymagają wystarczającego kontekstu, aby personel mógł zidentyfikować zgłaszającego, sporny wpis i żądane działanie.

Uwzględnij:

- kanoniczny URL Skills lub pakietu w ClawHub oraz identyfikator właściciela
- znak towarowy, projekt, firmę lub nazwę produktu, których dotyczy sprawa
- publiczny dowód własności lub upoważnienia zgłaszającego
- dlaczego obecny właściciel nie jest upoważniony do publikowania pod tą nazwą
- żądane działanie, takie jak ukrycie do czasu przeglądu, przeniesienie własności, zmiana nazwy
  lub usunięcie

Nie umieszczaj prywatnych sekretów ani poufnych dokumentów prawnych w publicznych raportach. Otwórz issue w GitHub z niepoufnymi dowodami i w razie potrzeby poproś maintainerów o prywatną ścieżkę przekazania.

## Odwołania i ponowne skanowania

Właściciele mogą poprosić o ponowne skanowanie, gdy uważają, że Skills lub pakiet został nieprawidłowo wstrzymany albo oznaczony. Moderatorzy platformy i administratorzy mogą poprosić o ponowne skanowanie dowolnego Skills lub pakietu podczas obsługi raportów albo zgłoszeń wsparcia:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

W przypadku treści moderowanych właściciele mogą mieć możliwość złożenia odwołania z powierzchni ClawHub widocznych dla właściciela. Odwołania powinny wyjaśniać, co się zmieniło lub dlaczego oznaczenie jest nieprawidłowe.

## Wstrzymania moderacyjne

Gdy statyczny skaner oznaczy przesłany Skills jako złośliwy, wydawca jest automatycznie objęty wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione na użytkowniku). Ukrywa to wszystkie Skills wydawcy, powoduje, że przyszłe publikacje zaczynają jako ukryte, oraz tworzy wpis dziennika audytu `user.moderation.auto`.

Statyczne podejrzane wyniki są zachowywane jako dowody plik/linia dla moderatorów, ale same nie ukrywają treści ani nie decydują o publicznym werdykcie skanowania. Nowe przesłania pozostają w stanie przeglądu/oczekiwania, dopóki przeglądy VirusTotal i LLM się nie ustabilizują; skanowanie statyczne blokuje natychmiast tylko w przypadku złośliwych sygnatur. Przeglądy LLM ClawScan zachowują notatki zgodne z przeznaczeniem jako wskazówki; zwracają werdykt Review/suspicious tylko wtedy, gdy ustrukturyzowany przegląd zawiera istotną obawę.

Administratorzy mogą zdjąć wstrzymanie spowodowane fałszywym alarmem:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

To czyści `requiresModerationAt` i `requiresModerationReason`, przywraca Skills ukryte przez wstrzymanie na poziomie użytkownika oraz zapisuje wpis dziennika audytu `user.moderation.lift`. Skills ukryte z innych powodów albo te, których własne skanowanie statyczne pozostaje złośliwe, pozostają ukryte.

## Blokady i stan konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą skutkować blokadami kont, unieważnieniem tokenów, ukryciem treści lub usunięciem wpisów.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI zacznie zawodzić po działaniu wobec konta, zaloguj się w internetowym interfejsie użytkownika, aby sprawdzić stan konta, albo skontaktuj się z maintainerami przez oczekiwany kanał wsparcia projektu.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładne nazwy, podsumowania, tagi i dzienniki zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem Plugin
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
