---
read_when:
    - Zrozumienie wyników skanowania i moderacji ClawHub
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie wstrzymanej, ukrytej lub zablokowanej oferty
summary: Zachowanie ClawHub dotyczące zaufania, skanowania, zgłaszania i moderacji.
x-i18n:
    generated_at: "2026-05-12T04:10:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo + moderacja

ClawHub jest otwarty na publikowanie, ale publiczne listingi nadal przechodzą przez mechanizmy zaufania,
skanowania, zgłaszania i moderacji. Cel jest praktyczny: pomóc użytkownikom
sprawdzić, co instalują, dać wydawcom ścieżkę odzyskiwania po fałszywych alarmach
i trzymać nadużywające pakiety poza publicznym wyszukiwaniem.

Zobacz też [Dopuszczalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem Skill lub Plugin sprawdź jego listing w ClawHub pod kątem:

- właściciela i przypisania źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla pluginów
- stanu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji, gdy są pokazane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na stronach publicznych oraz w diagnostyce
widocznej dla właścicieli.

Typowe wyniki obejmują:

- `clean`: nie znaleziono problemu blokującego.
- `suspicious`: wydanie wymaga ostrożności lub przeglądu.
- `malicious`: wydanie jest uznawane za niebezpieczne.
- `pending`: kontrole jeszcze się nie zakończyły.
- `held`, `quarantined`, `revoked` lub `hidden`: wydanie nie jest w pełni
  dostępne na publicznych powierzchniach instalacji.

Dokładne sformułowania mogą się różnić w zależności od powierzchni, ale praktyczne znaczenie jest takie samo: jeśli
wydanie jest wstrzymane lub zablokowane, użytkownicy nie powinni go instalować, dopóki właściciel nie rozwiąże
problemu albo moderacja go nie przywróci.

## Skills

Skanowania Skill analizują opublikowany pakiet Skill, metadane, zadeklarowane
wymagania i podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na rozbieżności między tym, co Skill deklaruje, a tym,
co wydaje się robić. Na przykład Skill, który odwołuje się do wymaganego klucza API,
powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy mogli zobaczyć je przed
instalacją.

Ustalenia skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie jak zadeklarowane
poświadczenia API, wywołania zwrotne OAuth localhost, zakresowe czyszczenie po odinstalowaniu, kodowanie Basic Auth
lub wybrane przez użytkownika przesyłanie plików do wskazanego dostawcy, jest traktowane
inaczej niż ukryte przekazywanie poświadczeń, szeroki dostęp do prywatnych plików,
niepowiązane miejsca docelowe w sieci lub ukryte nadużycia przeglądarki.

Zobacz [Format Skill](/pl/clawhub/skill-format).

## Pluginy

Wydania Plugin obejmują metadane pakietu, przypisanie źródła, pola zgodności
i informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed zainstalowaniem pluginów hostowanych w ClawHub. Rekordy pakietów
mogą również ujawniać metadane skrótu, aby OpenClaw mógł weryfikować pobrane
artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu `openclaw.environment`
podczas przeglądu wydań Plugin, aby zadeklarowane wymagania uruchomieniowe były
porównywane z zaobserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pakiety i komentarze.

Zgłoszenia powinny być konkretne i możliwe do podjęcia działań. Nadużywanie zgłoszeń samo w sobie może prowadzić do
działań wobec konta.

Przykłady zgłoszeń:

- wprowadzające w błąd metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- oszukańcze komentarze lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Dopuszczalne użycie](/pl/clawhub/acceptable-usage)

## Notatki ClawScan wydawcy

Wydawcy mogą podać opcjonalną notatkę ClawScan podczas publikowania Skill lub
Plugin. Ta notatka daje ClawScan kontekst dotyczący zachowania, które w innym przypadku mogłoby wyglądać
nietypowo, takiego jak dostęp do sieci, dostęp do natywnego hosta lub poświadczenia
specyficzne dla dostawcy.

## Wstrzymania moderacyjne

Gdy statyczny skaner oznaczy przesłany Skill jako złośliwy, wydawca jest
automatycznie obejmowany wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione na
użytkowniku). Ukrywa to wszystkie Skills wydawcy, powoduje, że przyszłe publikacje
zaczynają jako ukryte, i tworzy wpis dziennika audytu `user.moderation.auto`.

Statyczne podejrzane ustalenia są zachowywane jako dowody plik/wiersz dla moderatorów,
ale same nie ukrywają treści ani nie decydują o publicznym werdykcie skanowania.
Nowe przesłania pozostają w stanie przeglądu/oczekiwania, dopóki przegląd LLM się nie zakończy. Skanowanie statyczne
blokuje natychmiast tylko w przypadku złośliwych sygnatur. Trafienia silników
VirusTotal pozostają widocznym dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm
są doradcze i same nie ukrywają Skills. Przeglądy LLM ClawScan
zachowują notatki zgodne z celem jako wskazówki. Ustalenia średniego poziomu pozostają widoczne w
artefakcie, natomiast filtr podejrzanych jest zarezerwowany dla istotnych obaw LLM,
złośliwych ustaleń lub potwierdzonych wykryć silnika AV.

Administratorzy mogą zdjąć wstrzymanie wynikające z fałszywego alarmu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

To czyści `requiresModerationAt` i `requiresModerationReason`, przywraca
Skills ukryte przez wstrzymanie na poziomie użytkownika oraz zapisuje wpis dziennika audytu `user.moderation.lift`.
Skills ukryte z innych powodów albo te, których własne skanowanie statyczne pozostaje
złośliwe, pozostają ukryte.

## Bany i stan konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować banami konta, unieważnieniem tokenów, ukryciem treści lub usunięciem
listingów.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniach wobec konta, zaloguj się w interfejsie WWW, aby sprawdzić stan
konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany, skontaktuj się z
security@openclaw.ai w celu przeglądu odzyskiwania.

## Wskazówki dla wydawców

Aby zmniejszyć liczbę fałszywych alarmów i zwiększyć zaufanie użytkowników:

- utrzymuj dokładne nazwy, podsumowania, tagi i dzienniki zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- dodaj notatkę ClawScan wydawcy, gdy wydanie ma nietypowe, ale zamierzone zachowanie
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
