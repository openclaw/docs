---
read_when:
    - Zrozumienie wyników skanowania i moderacji w ClawHub
    - Zgłaszanie umiejętności lub pakietu
    - Przywracanie po wstrzymaniu, ukryciu lub zablokowaniu wpisu
summary: Zachowanie dotyczące zaufania, skanowania, zgłaszania i moderacji w ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo + moderacja

ClawHub jest otwarty na publikowanie, ale publiczne wpisy nadal przechodzą przez
mechanizmy zaufania, skanowania, zgłaszania i moderacji. Cel jest praktyczny:
pomóc użytkownikom sprawdzić, co instalują, dać wydawcom ścieżkę odzyskiwania
po wynikach fałszywie dodatnich oraz utrzymywać nadużywające pakiety poza
publicznym odkrywaniem.

Zobacz też [Zasady dopuszczalnego użycia](/pl/clawhub/acceptable-usage).

## Co użytkownicy mogą sprawdzić

Przed zainstalowaniem skilla lub pluginu sprawdź jego wpis w ClawHub pod kątem:

- właściciela i atrybucji źródła
- najnowszej wersji i dziennika zmian
- wymaganych zmiennych środowiskowych lub uprawnień
- metadanych zgodności dla pluginów
- stanu skanowania lub moderacji
- zgłoszeń, komentarzy, gwiazdek, pobrań i sygnałów instalacji, jeśli są pokazywane

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Stany skanowania

ClawHub może pokazywać wyniki skanowania lub moderacji na stronach publicznych
oraz w diagnostyce widocznej dla właściciela.

Typowe wyniki obejmują:

- `clean`: nie znaleziono problemu blokującego.
- `suspicious`: wydanie wymaga ostrożności lub przeglądu.
- `malicious`: wydanie jest uznawane za niebezpieczne.
- `pending`: kontrole jeszcze się nie zakończyły.
- `held`, `quarantined`, `revoked` lub `hidden`: wydanie nie jest w pełni
  dostępne na publicznych powierzchniach instalacji.

Dokładne brzmienie może się różnić zależnie od powierzchni, ale praktyczne
znaczenie jest takie samo: jeśli wydanie jest wstrzymane lub zablokowane,
użytkownicy nie powinni go instalować, dopóki właściciel nie rozwiąże problemu
albo moderacja go nie przywróci.

## Skills

Skanowanie skilli sprawdza opublikowany pakiet skilla, metadane, zadeklarowane
wymagania oraz podejrzane instrukcje.

ClawHub zwraca szczególną uwagę na niezgodności między tym, co skill deklaruje,
a tym, co wydaje się robić. Na przykład skill, który odwołuje się do wymaganego
klucza API, powinien zadeklarować to wymaganie w `SKILL.md`, aby użytkownicy
mogli je zobaczyć przed instalacją.

Ustalenia skanowania są oparte na artefaktach. Oczekiwane zachowanie dostawcy,
takie jak zadeklarowane dane uwierzytelniające API, zwrotne wywołania OAuth na
localhost, ograniczone czyszczenie przy odinstalowaniu, kodowanie Basic Auth
albo wybrane przez użytkownika przesyłanie plików do wskazanego dostawcy, jest
traktowane inaczej niż ukryte przekazywanie danych uwierzytelniających, szeroki
dostęp do prywatnych plików, niepowiązane docelowe adresy sieciowe lub ukryte
nadużywanie przeglądarki.

Zobacz [Format skilla](/pl/clawhub/skill-format).

## Pluginy

Wydania pluginów obejmują metadane pakietu, atrybucję źródła, pola zgodności
oraz informacje o integralności artefaktu.

OpenClaw sprawdza zgodność przed zainstalowaniem pluginów hostowanych w ClawHub.
Rekordy pakietów mogą też ujawniać metadane skrótu, aby OpenClaw mógł
weryfikować pobrane artefakty. ClawScan uwzględnia zadeklarowane metadane
środowiska i konfiguracji `openclaw.environment` pakietu podczas przeglądu
wydań pluginów, aby zadeklarowane wymagania uruchomieniowe były porównywane z
zaobserwowanym zachowaniem.

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać skille, pakiety i komentarze.

Zgłoszenia powinny być konkretne i możliwe do podjęcia działania. Nadużywanie
zgłoszeń samo w sobie może prowadzić do działań wobec konta.

Przykłady zgłoszeń:

- wprowadzające w błąd metadane
- niezadeklarowane wymagania dotyczące danych uwierzytelniających lub uprawnień
- podejrzane instrukcje instalacji
- oszukańcze komentarze lub podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Zasady dopuszczalnego użycia](/pl/clawhub/acceptable-usage)

## Notatki ClawScan wydawcy

Wydawcy mogą podać opcjonalną notatkę ClawScan podczas publikowania skilla lub
pluginu. Ta notatka daje ClawScan kontekst dla zachowania, które w przeciwnym
razie mogłoby wyglądać nietypowo, takiego jak dostęp do sieci, dostęp do
natywnego hosta lub dane uwierzytelniające specyficzne dla dostawcy.

## Wstrzymania moderacyjne

Gdy statyczny skaner oznaczy przesłanego skilla jako złośliwego, wydawca jest
automatycznie objęty wstrzymaniem moderacyjnym (`requiresModerationAt` ustawione
na użytkowniku). Ukrywa to wszystkie skille wydawcy, powoduje, że przyszłe
publikacje zaczynają jako ukryte, oraz tworzy wpis dziennika audytu
`user.moderation.auto`.

Statyczne ustalenia podejrzane są zachowywane jako dowody plik/wiersz dla
moderatorów, ale same nie ukrywają treści ani nie decydują o publicznym werdykcie
skanowania. Nowe przesłania pozostają w stanie przeglądu/oczekiwania, dopóki
przegląd LLM się nie zakończy. Skanowanie statyczne blokuje natychmiast tylko w
przypadku sygnatur złośliwych. Trafienia silnika VirusTotal pozostają widocznym
dowodem bezpieczeństwa, ale werdykty VirusTotal Code Insight/Palm mają charakter
doradczy i same nie ukrywają skilli. Przeglądy LLM ClawScan zachowują notatki
zgodne z przeznaczeniem jako wskazówki. Ustalenia przeglądu o średniej wadze
pozostają widoczne na artefakcie, natomiast filtr podejrzaności jest
zarezerwowany dla istotnych obaw LLM, złośliwych ustaleń lub potwierdzonych
wykryć silnika AV.

Administratorzy mogą zdjąć wstrzymanie wynikające z fałszywego alarmu:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

To czyści `requiresModerationAt` i `requiresModerationReason`, przywraca skille
ukryte przez wstrzymanie na poziomie użytkownika oraz zapisuje wpis dziennika
audytu `user.moderation.lift`. Skille ukryte z innych powodów albo te, których
własne skanowanie statyczne nadal pozostaje złośliwe, pozostają ukryte.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne
nadużycia mogą skutkować blokadami konta, unieważnieniem tokenów, ukryciem
treści lub usunięciem wpisów.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub.
Jeśli uwierzytelnianie CLI zacznie zawodzić po działaniach wobec konta, zaloguj
się do internetowego UI, aby sprawdzić stan konta. Jeśli logowanie lub normalny
dostęp CLI jest zablokowany, skontaktuj się z security@openclaw.ai w celu
przeglądu odzyskiwania.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie dodatnie i zwiększyć zaufanie użytkowników:

- dbaj o dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- dodaj notatkę ClawScan wydawcy, gdy wydanie ma nietypowe, ale zamierzone zachowanie
- unikaj zaciemnionych poleceń instalacyjnych
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie pakietu
