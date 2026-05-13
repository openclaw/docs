---
read_when:
    - Zrozumienie wyników skanowania i moderacji ClawHub
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie wstrzymanego, ukrytego lub zablokowanego wpisu
summary: Zachowanie ClawHub dotyczące zaufania, skanowania, raportowania i moderacji.
x-i18n:
    generated_at: "2026-05-13T05:33:28Z"
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
i trzymać nadużywające pakiety poza publicznym odkrywaniem.

Zobacz także [Dopuszczalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem Skills lub Plugin sprawdź jego wpis w ClawHub pod kątem:

- właściciela i przypisania źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla pluginów
- statusu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji, jeśli są pokazane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na stronach publicznych oraz w widocznych dla właściciela
diagnostykach.

Typowe wyniki obejmują:

- `clean`: nie znaleziono problemu blokującego.
- `suspicious`: wydanie wymaga ostrożności lub przeglądu.
- `malicious`: wydanie jest uznawane za niebezpieczne.
- `pending`: kontrole nie zostały jeszcze zakończone.
- `held`, `quarantined`, `revoked` lub `hidden`: wydanie nie jest w pełni
  dostępne na publicznych powierzchniach instalacji.

Dokładne brzmienie może się różnić w zależności od powierzchni, ale praktyczne znaczenie jest takie samo: jeśli
wydanie jest wstrzymane lub zablokowane, użytkownicy nie powinni go instalować, dopóki właściciel nie rozwiąże
problemu albo moderacja go nie przywróci.

## Skills

Skanowania Skills analizują opublikowany pakiet Skills, metadane, zadeklarowane
wymagania i podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na rozbieżności między tym, co Skills deklaruje, a tym,
co wydaje się robić. Na przykład Skills, który odwołuje się do wymaganego klucza API,
powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy mogli je zobaczyć przed
instalacją.

Ustalenia skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie jak zadeklarowane
poświadczenia API, wywołania zwrotne OAuth do localhost, ograniczone czyszczenie przy odinstalowaniu, kodowanie Basic Auth
lub wybrane przez użytkownika przesyłanie plików do wskazanego dostawcy, jest traktowane
inaczej niż ukryte przekazywanie poświadczeń, szeroki dostęp do plików prywatnych,
niepowiązane miejsca docelowe w sieci lub skryte nadużycia przeglądarki.

Zobacz [Format Skills](/pl/clawhub/skill-format).

## Pluginy

Wydania Plugin zawierają metadane pakietu, przypisanie źródła, pola zgodności
i informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed instalacją pluginów hostowanych w ClawHub. Rekordy pakietów
mogą także udostępniać metadane skrótu, aby OpenClaw mógł weryfikować pobrane
artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu `openclaw.environment`
podczas przeglądu wydań Plugin, aby zadeklarowane wymagania środowiska uruchomieniowego były
porównywane z zaobserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pakiety i komentarze.

Zgłoszenia powinny być konkretne i możliwe do podjęcia działania. Nadużywanie zgłoszeń samo może prowadzić do
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
Plugin. Ta notatka daje ClawScan kontekst dla zachowania, które w przeciwnym razie może wyglądać
nietypowo, takiego jak dostęp do sieci, dostęp do natywnego hosta lub poświadczenia
specyficzne dla dostawcy.

## Blokady moderacyjne

Gdy skaner statyczny oznaczy przesłane Skills jako złośliwe, wydawca jest
automatycznie obejmowany blokadą moderacyjną (`requiresModerationAt` ustawione na
użytkowniku). Ukrywa to wszystkie Skills wydawcy, powoduje, że przyszłe publikacje
zaczynają jako ukryte, i tworzy wpis dziennika audytu `user.moderation.auto`.

Statyczne podejrzane ustalenia są zachowywane jako dowody plik/wiersz dla moderatorów,
ale same nie ukrywają treści ani nie rozstrzygają publicznego werdyktu skanowania.
Nowe przesłania pozostają w stanie przeglądu/oczekiwania, dopóki przegląd LLM się nie zakończy. Skanowanie statyczne
blokuje natychmiast tylko w przypadku złośliwych sygnatur. Trafienia silników VirusTotal
pozostają widocznym dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm
są doradcze i same nie ukrywają Skills. Przeglądy LLM ClawScan
zachowują notatki zgodne z celem jako wskazówki. Średnie ustalenia przeglądu pozostają widoczne na
artefakcie, natomiast filtr podejrzliwości jest zarezerwowany dla istotnych obaw LLM,
złośliwych ustaleń lub potwierdzonych wykryć silników AV.

Administratorzy mogą zdjąć blokadę fałszywego alarmu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Czyści to `requiresModerationAt` i `requiresModerationReason`, przywraca
Skills ukryte przez blokadę na poziomie użytkownika oraz zapisuje wpis dziennika audytu `user.moderation.lift`.
Skills ukryte z innych powodów albo takie, których własne skanowanie statyczne nadal jest
złośliwe, pozostają ukryte.

## Blokady kont i status konta

Konta, które naruszają zasady ClawHub, mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować zablokowaniem konta, unieważnieniem tokenów, ukryciem treści lub usunięciem
wpisów.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu wobec konta, zaloguj się do interfejsu WWW, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI są zablokowane, skontaktuj się z
security@openclaw.ai w celu przeglądu odzyskiwania.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- dodaj notatkę ClawScan wydawcy, gdy wydanie ma nietypowe, ale zamierzone zachowanie
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
