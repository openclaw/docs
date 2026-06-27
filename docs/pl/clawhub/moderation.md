---
read_when:
    - Zgłaszanie Skills, pluginu lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej liście
    - Wyjaśnienie moderacji ClawHub, blokad i statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-06-27T17:16:56Z"
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
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, wprowadzające w błąd albo
niezgodne z zasadami.

Ta strona omawia moderację i status konta. Etykiety audytu, takie jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziom ryzyka opisano w
[Audytach bezpieczeństwa](/pl/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/pl/clawhub/security) i
[Akceptowalne użycie](/pl/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/pl/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, plugins i pakiety.

Używaj zgłoszeń ClawHub tylko do niebezpiecznych treści w marketplace, takich jak:

- złośliwe wpisy
- wprowadzające w błąd metadane
- niezgłoszone wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/pl/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skill lub
polecenia/API do zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do luk w zabezpieczeniach we własnym kodzie źródłowym zewnętrznego skill lub
pluginu. Zgłaszaj je bezpośrednio wydawcy albo repozytorium źródłowemu
podlinkowanemu we wpisie. ClawHub nie utrzymuje ani nie łata
kodu zewnętrznych skills ani plugins.

GitHub Security Advisories dla `openclaw/clawhub` dotyczą luk w zabezpieczeniach
samego ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj poradników ClawHub
do luk w zabezpieczeniach zewnętrznych skills ani plugins.

Dobre zgłoszenia są konkretne i możliwe do obsłużenia. Nadużywanie zgłoszeń samo może prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące organizacji, marki, zakresu pakietów, uchwytu właściciela lub własności przestrzeni nazw powinny
korzystać z procesu [Roszczeń dotyczących organizacji i przestrzeni nazw](/pl/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby pracownicy ClawHub przejrzeli niewrażliwe dowody, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, zmieniona, ukryta, poddana kwarantannie, otrzymać alias
lub zostać w inny sposób sprawdzona. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w
publicznym issue.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą domyślnie rozpoczynać jako ukryte do czasu sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki
wysokiego ryzyka. Mogą też zostać zniesione po potwierdzeniu wyniku fałszywie dodatniego.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony lub w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę dla własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawców są sprawdzane codziennie. Sygnały osiągające
próg potencjalnego bana ClawHub mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może zastosować działanie na koncie automatycznie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem zasad.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI są zablokowane przez ban albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskania dostępu.

Jeśli e-mail wywołany przez skaner wskazuje wersję skill lub plugin jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku plugins dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie dodatnie i zwiększyć zaufanie użytkowników:

- dbaj o dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- podawaj link do źródła, gdy to możliwe
- używaj próbnych uruchomień przed publikowaniem plugins
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
