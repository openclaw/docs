---
read_when:
    - Zrozumienie wyników skanowania ClawHub i moderacji
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie wstrzymanego, ukrytego lub zablokowanego wpisu
summary: Zachowanie ClawHub w zakresie zaufania, skanowania, zgłaszania i moderacji.
x-i18n:
    generated_at: "2026-05-12T12:49:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo + moderacja

ClawHub jest otwarty na publikowanie, ale publiczne wpisy nadal przechodzą przez kontrole zaufania,
skanowania, zgłaszania i moderacji. Cel jest praktyczny: pomóc użytkownikom
sprawdzić, co instalują, dać wydawcom ścieżkę odzyskania po fałszywych alarmach
i utrzymać nadużywające pakiety poza publicznym odkrywaniem.

Zobacz też [Dopuszczalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem skill lub pluginu sprawdź jego wpis w ClawHub pod kątem:

- właściciela i atrybucji źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla pluginów
- statusu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji, jeśli są pokazane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na publicznych stronach oraz w diagnostyce
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

Skanowania Skills analizują opublikowany pakiet skill, metadane, zadeklarowane
wymagania i podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na niezgodności między tym, co skill deklaruje, a tym,
co wydaje się robić. Na przykład skill, który odwołuje się do wymaganego klucza API,
powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy mogli zobaczyć je przed
instalacją.

Wyniki skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie jak zadeklarowane
poświadczenia API, wywołania zwrotne OAuth localhost, zakresowe czyszczenie po odinstalowaniu, kodowanie Basic Auth
lub wybrane przez użytkownika przesyłanie plików do wskazanego dostawcy, jest traktowane
inaczej niż ukryte przekazywanie poświadczeń, szeroki dostęp do prywatnych plików,
niepowiązane miejsca docelowe sieci lub ukryte nadużywanie przeglądarki.

Zobacz [Format skill](/pl/clawhub/skill-format).

## Pluginy

Wydania pluginów obejmują metadane pakietu, atrybucję źródła, pola zgodności
i informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed instalacją pluginów hostowanych w ClawHub. Rekordy pakietów
mogą też ujawniać metadane skrótu, aby OpenClaw mógł weryfikować pobrane
artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu `openclaw.environment`
podczas przeglądu wydań pluginów, tak aby zadeklarowane wymagania uruchomieniowe były
porównywane z zaobserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pakiety i komentarze.

Zgłoszenia powinny być konkretne i możliwe do podjęcia działań. Nadużywanie zgłoszeń samo może prowadzić do
działań wobec konta.

Przykłady zgłoszeń:

- wprowadzające w błąd metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- komentarze oszustów lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treść naruszająca [Dopuszczalne użycie](/pl/clawhub/acceptable-usage)

## Notatki ClawScan wydawcy

Wydawcy mogą podać opcjonalną notatkę ClawScan podczas publikowania skill lub
pluginu. Ta notatka daje ClawScan kontekst dla zachowania, które w przeciwnym razie może wyglądać
nietypowo, takiego jak dostęp do sieci, dostęp do natywnego hosta lub poświadczenia
specyficzne dla dostawcy.

## Wstrzymania moderacyjne

Gdy statyczny skaner oznaczy przesłany skill jako złośliwy, wydawca zostaje
automatycznie objęty wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione na
użytkowniku). Ukrywa to wszystkie Skills wydawcy, powoduje, że przyszłe publikacje
zaczynają jako ukryte, i tworzy wpis dziennika audytu `user.moderation.auto`.

Statyczne podejrzane wyniki są zachowywane jako dowody plik/linia dla moderatorów,
ale same nie ukrywają treści ani nie rozstrzygają publicznego werdyktu skanowania.
Nowe przesłania pozostają w stanie przeglądu/oczekiwania do czasu zakończenia przeglądu LLM. Skanowanie statyczne
blokuje natychmiast tylko w przypadku złośliwych sygnatur. Trafienia silników VirusTotal
pozostają widocznym dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm
są doradcze i same nie ukrywają Skills. Przeglądy LLM ClawScan
zachowują notatki zgodne z przeznaczeniem jako wskazówki. Wyniki przeglądu średniej wagi pozostają widoczne na
artefakcie, natomiast filtr podejrzaności jest zarezerwowany dla istotnych obaw LLM,
złośliwych wyników lub potwierdzonych wykryć silników AV.

Administratorzy mogą zdjąć wstrzymanie wynikające z fałszywego alarmu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

To czyści `requiresModerationAt` i `requiresModerationReason`, przywraca
Skills ukryte przez wstrzymanie na poziomie użytkownika i zapisuje wpis dziennika audytu
`user.moderation.lift`. Skills ukryte z innych powodów albo takie, których własne statyczne skanowanie pozostaje
złośliwe, pozostają ukryte.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować banami kont, unieważnieniem tokenów, ukrytą treścią lub usuniętymi
wpisami.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub zwykły dostęp CLI jest zablokowany, skontaktuj się z
security@openclaw.ai w celu przeglądu odzyskiwania.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładne nazwy, streszczenia, tagi i dzienniki zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- dodaj notatkę ClawScan wydawcy, gdy wydanie ma nietypowe, ale zamierzone zachowanie
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj próbnych uruchomień przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
