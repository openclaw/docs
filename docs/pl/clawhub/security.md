---
read_when:
    - Zrozumienie wyników skanowania i moderacji ClawHub
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie wstrzymanej, ukrytej lub zablokowanej oferty
summary: Zachowanie ClawHub w zakresie zaufania, skanowania, raportowania i moderacji.
x-i18n:
    generated_at: "2026-05-11T22:20:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo i moderacja

ClawHub jest otwarty na publikowanie, ale publiczne wpisy nadal przechodzą przez mechanizmy zaufania,
skanowania, zgłaszania i moderacji. Cel jest praktyczny: pomagać użytkownikom
sprawdzać, co instalują, dawać wydawcom ścieżkę odzyskiwania po fałszywych alarmach
i trzymać szkodliwe pakiety poza publicznym odkrywaniem.

Zobacz też [Dopuszczalne użycie](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem skill lub plugin sprawdź jego wpis w ClawHub pod kątem:

- właściciela i przypisania źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla pluginów
- stanu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji, jeśli są pokazane

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
  dostępne w publicznych interfejsach instalacji.

Dokładne brzmienie może się różnić w zależności od interfejsu, ale praktyczne znaczenie jest takie samo: jeśli
wydanie jest wstrzymane lub zablokowane, użytkownicy nie powinni go instalować, dopóki właściciel nie rozwiąże
problemu lub moderacja go nie przywróci.

## Skills

Skanowanie skillów analizuje opublikowany pakiet skill, metadane, zadeklarowane
wymagania i podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na rozbieżności między tym, co skill deklaruje,
a tym, co wydaje się robić. Na przykład skill, który odwołuje się do wymaganego klucza API,
powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy mogli zobaczyć je przed
instalacją.

Ustalenia skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy, takie jak zadeklarowane
poświadczenia API, wywołania zwrotne OAuth na localhost, ograniczone do zakresu sprzątanie po odinstalowaniu, kodowanie Basic Auth
lub wybrane przez użytkownika przesyłanie plików do wskazanego dostawcy, jest traktowane
inaczej niż ukryte przekazywanie poświadczeń, szeroki dostęp do plików prywatnych,
niepowiązane miejsca docelowe sieci lub ukryte nadużywanie przeglądarki.

Zobacz [Format skill](/pl/clawhub/skill-format).

## Pluginy

Wydania pluginów obejmują metadane pakietu, przypisanie źródła, pola zgodności
oraz informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed instalacją pluginów hostowanych w ClawHub. Rekordy pakietów
mogą także udostępniać metadane skrótu, aby OpenClaw mógł weryfikować pobrane
artefakty. ClawScan uwzględnia zadeklarowane metadane env/config pakietu `openclaw.environment`
podczas przeglądu wydań pluginów, aby zadeklarowane wymagania środowiska uruchomieniowego były
porównywane z zaobserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać skille, pakiety i komentarze.

Zgłoszenia powinny być konkretne i możliwe do podjęcia działań. Nadużywanie zgłaszania samo w sobie może prowadzić do
działań wobec konta.

Przykłady zgłoszeń:

- wprowadzające w błąd metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- komentarze oszustów lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Dopuszczalne użycie](/pl/clawhub/acceptable-usage)

## Notatki ClawScan wydawcy

Wydawcy mogą podać opcjonalną notatkę ClawScan podczas publikowania skill lub
plugin. Ta notatka daje ClawScan kontekst dla zachowania, które w przeciwnym razie mogłoby wyglądać
nietypowo, takiego jak dostęp do sieci, dostęp do natywnego hosta lub poświadczenia
specyficzne dla dostawcy.

## Wstrzymania moderacyjne

Gdy statyczny skaner oznaczy przesłany skill jako złośliwy, wydawca zostaje
automatycznie objęty wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione na
użytkowniku). Ukrywa to wszystkie skille wydawcy, powoduje, że przyszłe publikacje
zaczynają jako ukryte, i tworzy wpis dziennika audytu `user.moderation.auto`.

Statyczne podejrzane ustalenia są zachowywane jako dowody plik/linia dla moderatorów,
ale same nie ukrywają treści ani nie decydują o publicznym werdykcie skanowania.
Nowe przesłania pozostają w stanie przeglądu/oczekiwania, dopóki przegląd LLM się nie zakończy. Skanowanie statyczne
blokuje natychmiast tylko w przypadku złośliwych sygnatur. Trafienia silnika VirusTotal
pozostają widocznym dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm
są doradcze i same nie ukrywają skilli. Przeglądy LLM ClawScan
zachowują notatki zgodne z celem jako wskazówki. Ustalenia przeglądu o średniej wadze pozostają widoczne na
artefakcie, a filtr podejrzaności jest zarezerwowany dla istotnych obaw LLM,
złośliwych ustaleń lub potwierdzonych wykryć silników AV.

Administratorzy mogą zdjąć wstrzymanie wynikające z fałszywego alarmu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

To czyści `requiresModerationAt` i `requiresModerationReason`, przywraca
skille ukryte przez wstrzymanie na poziomie użytkownika i zapisuje wpis dziennika audytu `user.moderation.lift`.
Skille ukryte z innych powodów albo takie, których własne skanowanie statyczne nadal pozostaje
złośliwe, pozostają ukryte.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować blokadami konta, unieważnieniem tokenów, ukrytą treścią lub usuniętymi
wpisami.

Konta usunięte, zablokowane lub wyłączone nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu wobec konta, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub zwykły dostęp CLI jest zablokowany, skontaktuj się z
security@openclaw.ai w celu przeglądu odzyskiwania dostępu.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- dbaj o dokładność nazw, streszczeń, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- dodaj notatkę ClawScan wydawcy, gdy wydanie ma nietypowe, ale zamierzone zachowanie
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikacją pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
