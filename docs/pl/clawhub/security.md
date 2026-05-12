---
read_when:
    - Zrozumienie wyników skanowania i moderacji ClawHub
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie wstrzymanego, ukrytego lub zablokowanego wpisu
summary: Zachowanie dotyczące zaufania, skanowania, raportowania i moderacji w ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:29:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo + moderacja

ClawHub jest otwarty na publikowanie, ale publiczne wpisy nadal przechodzą przez mechanizmy zaufania,
skanowania, zgłaszania i moderacji. Cel jest praktyczny: pomóc użytkownikom
sprawdzić, co instalują, dać wydawcom ścieżkę odzyskania w przypadku fałszywych alarmów
oraz trzymać nadużywające pakiety poza publicznym odkrywaniem.

Zobacz też [Dopuszczalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem Skills lub Pluginu sprawdź jego wpis w ClawHub pod kątem:

- właściciela i przypisania źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla Pluginów
- statusu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji, gdy są pokazane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na stronach publicznych oraz w diagnostyce
widocznej dla właściciela.

Typowe wyniki obejmują:

- `clean`: nie znaleziono problemu blokującego.
- `suspicious`: wydanie wymaga ostrożności lub przeglądu.
- `malicious`: wydanie jest uznawane za niebezpieczne.
- `pending`: kontrole jeszcze się nie zakończyły.
- `held`, `quarantined`, `revoked` lub `hidden`: wydanie nie jest w pełni
  dostępne na publicznych powierzchniach instalacji.

Dokładne brzmienie może różnić się w zależności od powierzchni, ale praktyczne znaczenie jest takie samo: jeśli
wydanie jest wstrzymane lub zablokowane, użytkownicy nie powinni go instalować, dopóki właściciel nie rozwiąże
problemu albo moderacja go nie przywróci.

## Skills

Skanowanie Skills analizuje opublikowany pakiet Skills, metadane, zadeklarowane
wymagania oraz podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na rozbieżności między tym, co Skills deklaruje, a tym,
co wydaje się robić. Na przykład Skills, który odwołuje się do wymaganego klucza API,
powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy mogli je zobaczyć przed
instalacją.

Ustalenia skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie jak zadeklarowane
poświadczenia API, wywołania zwrotne OAuth localhost, ograniczone do zakresu czyszczenie przy odinstalowaniu, kodowanie Basic Auth
lub wybrane przez użytkownika przesyłanie plików do wskazanego dostawcy, jest traktowane
inaczej niż ukryte przekazywanie poświadczeń, szeroki dostęp do prywatnych plików,
niepowiązane miejsca docelowe w sieci lub ukryte nadużywanie przeglądarki.

Zobacz [Format Skills](/pl/clawhub/skill-format).

## Pluginy

Wydania Pluginów zawierają metadane pakietu, przypisanie źródła, pola zgodności
oraz informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed zainstalowaniem Pluginów hostowanych w ClawHub. Rekordy pakietów
mogą również ujawniać metadane skrótu, aby OpenClaw mógł weryfikować pobrane
artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu `openclaw.environment`
podczas przeglądu wydań Pluginów, aby zadeklarowane wymagania środowiska wykonawczego były
porównywane z zaobserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pakiety i komentarze.

Zgłoszenia powinny być konkretne i możliwe do podjęcia działania. Nadużywanie zgłoszeń może samo prowadzić do
działań wobec konta.

Przykłady zgłoszeń:

- wprowadzające w błąd metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- oszukańcze komentarze lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Dopuszczalne użycie](/pl/clawhub/acceptable-usage)

## Notatki ClawScan wydawcy

Wydawcy mogą podać opcjonalną notatkę ClawScan podczas publikowania Skills lub
Pluginu. Ta notatka daje ClawScan kontekst dla zachowania, które w przeciwnym razie może wyglądać
nietypowo, takiego jak dostęp do sieci, dostęp do natywnego hosta lub poświadczenia
specyficzne dla dostawcy.

## Wstrzymania moderacyjne

Gdy statyczny skaner oznaczy przesłane Skills jako złośliwe, wydawca jest
automatycznie objęty wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione dla
użytkownika). Ukrywa to wszystkie Skills wydawcy, powoduje, że przyszłe publikacje
zaczynają jako ukryte, i tworzy wpis dziennika audytu `user.moderation.auto`.

Statyczne podejrzane ustalenia są zachowywane jako dowody plik/wiersz dla moderatorów,
ale same nie ukrywają treści ani nie decydują o publicznym werdykcie skanowania.
Nowe przesłania pozostają w stanie przeglądu/oczekiwania, dopóki przegląd LLM się nie zakończy. Skanowanie statyczne
blokuje natychmiast tylko w przypadku złośliwych sygnatur. Trafienia silników VirusTotal
pozostają widocznym dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm
mają charakter doradczy i same nie ukrywają Skills. Przeglądy LLM ClawScan
zachowują notatki zgodne z celem jako wskazówki. Ustalenia przeglądu o średniej wadze pozostają widoczne na
artefakcie, natomiast filtr podejrzanych jest zarezerwowany dla istotnych obaw LLM,
złośliwych ustaleń lub potwierdzonych detekcji silników antywirusowych.

Administratorzy mogą cofnąć fałszywie pozytywne wstrzymanie:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Czyści to `requiresModerationAt` i `requiresModerationReason`, przywraca
Skills ukryte przez wstrzymanie na poziomie użytkownika oraz zapisuje wpis dziennika audytu `user.moderation.lift`.
Skills ukryte z innych powodów albo takie, których własne skanowanie statyczne nadal pozostaje
złośliwe, pozostają ukryte.

## Bany i stan konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować banami konta, unieważnieniem tokenów, ukryciem treści lub usunięciem
wpisów.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu wobec konta, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany, skontaktuj się z
security@openclaw.ai w celu przeglądu odzyskiwania.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładne nazwy, podsumowania, tagi i dzienniki zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- dodaj notatkę ClawScan wydawcy, gdy wydanie ma nietypowe, ale zamierzone zachowanie
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj próbnych uruchomień przed publikowaniem Pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
