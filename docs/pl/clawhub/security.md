---
read_when:
    - Zrozumienie wyników skanowania i moderacji ClawHub
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie wstrzymanego, ukrytego lub zablokowanego wpisu
summary: Zachowanie dotyczące zaufania, skanowania, raportowania i moderacji w ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:18:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo + Moderacja

ClawHub jest otwarty na publikowanie, ale publiczne wpisy nadal przechodzą przez
kontrole zaufania, skanowania, zgłaszania i moderacji. Cel jest praktyczny: pomóc
użytkownikom sprawdzić, co instalują, dać wydawcom ścieżkę odwoławczą w przypadku
wyników fałszywie dodatnich i utrzymać nadużywające pakiety poza publicznym
odkrywaniem.

Zobacz także [Dopuszczalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem Skills lub Plugin sprawdź jego wpis w ClawHub pod kątem:

- właściciela i atrybucji źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla Plugins
- statusu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji, jeśli są wyświetlane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na stronach publicznych
oraz w diagnostyce widocznej dla właściciela.

Typowe wyniki obejmują:

- `clean`: nie znaleziono problemu blokującego.
- `suspicious`: wydanie wymaga ostrożności lub przeglądu.
- `malicious`: wydanie jest uznawane za niebezpieczne.
- `pending`: kontrole nie zostały jeszcze zakończone.
- `held`, `quarantined`, `revoked` lub `hidden`: wydanie nie jest w pełni
  dostępne na publicznych powierzchniach instalacji.

Dokładne sformułowania mogą się różnić w zależności od powierzchni, ale znaczenie
praktyczne jest takie samo: jeśli wydanie jest wstrzymane lub zablokowane,
użytkownicy nie powinni go instalować, dopóki właściciel nie rozwiąże problemu
albo moderacja go nie przywróci.

## Skills

Skanowania Skills analizują opublikowany pakiet Skills, metadane, zadeklarowane
wymagania i podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na rozbieżności między tym, co Skills deklaruje,
a tym, co wydaje się robić. Na przykład Skills, który odwołuje się do wymaganego
klucza API, powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy
mogli je zobaczyć przed instalacją.

Wyniki skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie
jak zadeklarowane poświadczenia API, zwrotne wywołania OAuth do localhost,
zakresowe czyszczenie przy odinstalowaniu, kodowanie Basic Auth lub wybrane przez
użytkownika przesyłanie plików do wskazanego dostawcy, jest traktowane inaczej
niż ukryte przekazywanie poświadczeń, szeroki dostęp do prywatnych plików,
niepowiązane miejsca docelowe sieci lub ukryte nadużywanie przeglądarki.

Zobacz [Format Skills](/pl/clawhub/skill-format).

## Plugins

Wydania Plugin obejmują metadane pakietu, atrybucję źródła, pola zgodności
i informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed instalacją Plugins hostowanych w ClawHub. Rekordy
pakietów mogą także udostępniać metadane skrótów, aby OpenClaw mógł weryfikować
pobrane artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu
`openclaw.environment` podczas przeglądu wydań Plugin, aby porównać zadeklarowane
wymagania uruchomieniowe z zaobserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pakiety i komentarze.

Zgłoszenia powinny być konkretne i możliwe do podjęcia działań. Nadużywanie
zgłoszeń samo w sobie może prowadzić do działań wobec konta.

Przykłady zgłoszeń:

- wprowadzające w błąd metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- oszukańcze komentarze lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Dopuszczalne użycie](/pl/clawhub/acceptable-usage)

## Notatki ClawScan wydawcy

Wydawcy mogą dodać opcjonalną notatkę ClawScan podczas publikowania Skills lub
Plugin. Ta notatka daje ClawScan kontekst dla zachowania, które w przeciwnym razie
mogłoby wyglądać nietypowo, takiego jak dostęp sieciowy, dostęp do natywnego hosta
lub poświadczenia specyficzne dla dostawcy.

## Wstrzymania moderacyjne

Gdy skaner statyczny oznaczy przesłany Skills jako złośliwy, wydawca zostaje
automatycznie objęty wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione
na użytkowniku). Ukrywa to wszystkie Skills wydawcy, powoduje, że przyszłe
publikacje zaczynają jako ukryte, i tworzy wpis dziennika audytu
`user.moderation.auto`.

Statyczne podejrzane wyniki są zachowywane jako dowody plik/wiersz dla
moderatorów, ale same nie ukrywają treści ani nie decydują o publicznym werdykcie
skanowania. Nowe przesłane pliki pozostają w stanie przeglądu/oczekiwania, dopóki
przegląd LLM się nie zakończy. Skanowanie statyczne blokuje natychmiast tylko w
przypadku złośliwych sygnatur. Trafienia silników VirusTotal pozostają widocznym
dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm są doradcze i
same nie ukrywają Skills. Przeglądy LLM ClawScan zachowują notatki zgodne z celem
jako wskazówki. Ustalenia o średnim poziomie przeglądu pozostają widoczne na
artefakcie, natomiast filtr podejrzanych jest zarezerwowany dla istotnych obaw LLM,
złośliwych ustaleń lub potwierdzonych detekcji silników AV.

Administratorzy mogą zdjąć wstrzymanie wynikające z wyniku fałszywie dodatniego:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

To czyści `requiresModerationAt` i `requiresModerationReason`, przywraca Skills
ukryte przez wstrzymanie na poziomie użytkownika i zapisuje wpis dziennika audytu
`user.moderation.lift`. Skills ukryte z innych powodów albo takie, których własne
skanowanie statyczne nadal pozostaje złośliwe, pozostają ukryte.

## Blokady i stan konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne
nadużycia mogą skutkować blokadą konta, unieważnieniem tokenów, ukryciem treści
lub usunięciem wpisów.

Konta usunięte, zablokowane lub wyłączone nie mogą używać tokenów API ClawHub.
Jeśli uwierzytelnianie CLI zaczyna zawodzić po działaniu wobec konta, zaloguj się
do interfejsu webowego, aby sprawdzić stan konta. Jeśli logowanie lub normalny
dostęp CLI jest zablokowany, skontaktuj się z security@openclaw.ai w celu
przeglądu odzyskiwania.

## Wskazówki dla wydawców

Aby zmniejszyć liczbę wyników fałszywie dodatnich i zwiększyć zaufanie użytkowników:

- dbaj o dokładność nazw, streszczeń, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- dodaj notatkę ClawScan wydawcy, gdy wydanie ma nietypowe, ale zamierzone zachowanie
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj próbnych uruchomień przed publikowaniem Plugins
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
