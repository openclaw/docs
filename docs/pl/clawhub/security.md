---
read_when:
    - Zrozumienie wyników skanowania i moderacji ClawHub
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie wstrzymanego, ukrytego lub zablokowanego wpisu
summary: Zachowanie ClawHub dotyczące zaufania, skanowania, zgłaszania i moderacji.
x-i18n:
    generated_at: "2026-05-12T15:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo + moderacja

ClawHub jest otwarty na publikowanie, ale publiczne wpisy nadal przechodzą przez kontrole zaufania,
skanowania, zgłaszania i moderacji. Cel jest praktyczny: pomóc użytkownikom
sprawdzić, co instalują, zapewnić wydawcom ścieżkę odzyskiwania po fałszywych alarmach
i utrzymywać nadużywające pakiety poza publicznym odkrywaniem.

Zobacz też [Dopuszczalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem skill lub pluginu sprawdź jego wpis w ClawHub pod kątem:

- właściciela i przypisania źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla pluginów
- statusu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji tam, gdzie są pokazane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na stronach publicznych oraz w
diagnostyce widocznej dla właściciela.

Typowe wyniki obejmują:

- `clean`: nie znaleziono problemu blokującego.
- `suspicious`: wydanie wymaga ostrożności lub przeglądu.
- `malicious`: wydanie jest uznawane za niebezpieczne.
- `pending`: kontrole jeszcze się nie zakończyły.
- `held`, `quarantined`, `revoked` lub `hidden`: wydanie nie jest w pełni
  dostępne na publicznych powierzchniach instalacji.

Dokładne brzmienie może różnić się w zależności od powierzchni, ale praktyczne znaczenie
jest takie samo: jeśli wydanie jest wstrzymane lub zablokowane, użytkownicy nie powinni
go instalować, dopóki właściciel nie rozwiąże problemu albo moderacja go nie przywróci.

## Skills

Skanowania skill analizują opublikowany pakiet skill, metadane, zadeklarowane
wymagania oraz podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na rozbieżności między tym, co skill deklaruje, a
tym, co wydaje się robić. Na przykład skill, który odwołuje się do wymaganego klucza API,
powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy mogli je zobaczyć przed
instalacją.

Ustalenia skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie jak zadeklarowane
poświadczenia API, wywołania zwrotne OAuth na localhost, ograniczone do zakresu sprzątanie po odinstalowaniu, kodowanie Basic Auth
lub wybrane przez użytkownika przesyłanie plików do wskazanego dostawcy, jest traktowane
inaczej niż ukryte przekazywanie poświadczeń, szeroki dostęp do prywatnych plików,
niepowiązane miejsca docelowe w sieci lub potajemne nadużywanie przeglądarki.

Zobacz [Format skill](/pl/clawhub/skill-format).

## Pluginy

Wydania pluginów obejmują metadane pakietu, przypisanie źródła, pola zgodności
i informacje o integralności artefaktów.

OpenClaw sprawdza zgodność przed instalacją pluginów hostowanych w ClawHub. Rekordy pakietów
mogą też ujawniać metadane skrótu, aby OpenClaw mógł weryfikować pobrane
artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu `openclaw.environment`
podczas przeglądu wydań pluginów, aby zadeklarowane wymagania środowiska uruchomieniowego były
porównywane z zaobserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać skill, pakiety i komentarze.

Zgłoszenia powinny być konkretne i możliwe do podjęcia działań. Nadużywanie zgłaszania może samo prowadzić do
działań wobec konta.

Przykłady zgłoszeń:

- wprowadzające w błąd metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- oszukańcze komentarze lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Dopuszczalne użycie](/pl/clawhub/acceptable-usage)

## Notatki ClawScan wydawcy

Wydawcy mogą podać opcjonalną notatkę ClawScan podczas publikowania skill lub
pluginu. Ta notatka daje ClawScan kontekst dla zachowania, które w przeciwnym razie mogłoby wyglądać
nietypowo, takiego jak dostęp do sieci, dostęp do natywnego hosta lub specyficzne dla dostawcy
poświadczenia.

## Wstrzymania moderacyjne

Gdy skaner statyczny oznaczy przesłany skill jako złośliwy, wydawca zostaje
automatycznie objęty wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione na
użytkowniku). Ukrywa to wszystkie skill wydawcy, powoduje, że przyszłe publikacje
zaczynają jako ukryte, i tworzy wpis dziennika audytu `user.moderation.auto`.

Podejrzane ustalenia statyczne są zachowywane jako dowody plik/linia dla moderatorów,
ale same w sobie nie ukrywają treści ani nie decydują o publicznym werdykcie skanowania.
Nowe przesłania pozostają w stanie przeglądu/oczekiwania, dopóki przegląd LLM się nie rozstrzygnie. Skanowanie statyczne
blokuje natychmiast tylko w przypadku złośliwych sygnatur. Trafienia silników
VirusTotal pozostają widocznym dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm
są doradcze i same w sobie nie ukrywają skill. Przeglądy LLM ClawScan
zachowują notatki zgodne z celem jako wskazówki. Ustalenia średniego przeglądu pozostają widoczne na
artefakcie, natomiast filtr podejrzaności jest zarezerwowany dla istotnych obaw LLM,
złośliwych ustaleń lub potwierdzonych wykryć silników AV.

Administratorzy mogą zdjąć wstrzymanie wynikające z fałszywego alarmu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Czyści to `requiresModerationAt` i `requiresModerationReason`, przywraca
skill ukryte przez wstrzymanie na poziomie użytkownika i zapisuje wpis dziennika audytu `user.moderation.lift`.
Skill ukryte z innych powodów albo takie, których własne skanowanie statyczne pozostaje
złośliwe, pozostają ukryte.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować blokadami kont, unieważnieniem tokenów, ukrytą treścią lub usuniętymi
wpisami.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu wobec konta, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany, skontaktuj się z
security@openclaw.ai w celu przeglądu odzyskiwania.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj nazwy, streszczenia, tagi i dzienniki zmian w dokładnym stanie
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- dodaj notatkę ClawScan wydawcy, gdy wydanie ma nietypowe, ale zamierzone zachowanie
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
