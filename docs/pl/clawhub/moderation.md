---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Przywracanie wstrzymanego, ukrytego lub zablokowanego wpisu
    - Zrozumienie moderacji, blokad i statusu konta w ClawHub
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte wpisy, bany i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-03T01:04:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania na kontach
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo niezgodne
z zasadami.

Ta strona opisuje moderację i status konta. Etykiety audytu, takie jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziom ryzyka opisano w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz także [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać umiejętności, pluginy i pakiety.

Używaj zgłoszeń ClawHub wyłącznie do niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezadeklarowane poświadczenia lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaków towarowych
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś umiejętność** na stronie umiejętności albo polecenia/API
zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do podatności w kodzie źródłowym umiejętności lub
pluginu podmiotu trzeciego. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie łata kodu umiejętności lub pluginów
podmiotów trzecich.

GitHub Security Advisories dla `openclaw/clawhub` dotyczą podatności w samym
ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisory ClawHub
do podatności w umiejętnościach lub pluginach podmiotów trzecich.

Dobre zgłoszenia są konkretne i możliwe do działania. Nadużywanie zgłoszeń samo może prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietów, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczeń dotyczących organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie z
przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby personel ClawHub przejrzał niewrażliwe dowody na to, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, zmieniona nazwa, ukryta, poddana kwarantannie, otrzymać alias
lub w inny sposób zostać przejrzana. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięta treść może zostać ukryta przed publicznym
odkrywaniem albo przyszłe publikacje mogą domyślnie startować jako ukryte do czasu przeglądu problemu.

Blokady moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zniesione, gdy zostanie potwierdzony wynik fałszywie dodatni.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony lub w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele mogą nadal widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co musi się zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukryciem treści lub usunięciem wpisów.
Sygnały presji nadużyć wydawców są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli kolejny
kwalifikujący się skan po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może automatycznie zastosować działanie na koncie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany przez bana albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania.

Jeśli e-mail wywołany przez skaner wskazuje wersję umiejętności lub pluginu jako złośliwą,
pobierz zapisane wyniki skanu dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanu, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie dodatnie i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, streszczeń, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikacją pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
