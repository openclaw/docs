---
read_when:
    - Zgłaszanie Skills, pluginu lub pakietu
    - Odzyskiwanie z wstrzymanego, ukrytego lub zablokowanego wpisu
    - Zrozumienie moderacji, banów i statusu konta w ClawHub
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte listingi, bany i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-03T09:59:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo kont

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, wstrzymania moderacyjne, ukryte pozycje i działania wobec kont
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo niezgodne
z zasadami.

Ta strona opisuje moderację i status konta. Etykiety audytu, takie jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziom ryzyka opisano w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) oraz
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Żądań dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać skills, plugins i pakiety.

Używaj zgłoszeń ClawHub wyłącznie do niebezpiecznych treści marketplace, takich jak:

- złośliwe pozycje
- mylące metadane
- niezadeklarowane poświadczenia lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaków towarowych
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skill albo polecenia/API do zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do zgłaszania podatności w kodzie źródłowym skill lub
pluginu innej firmy. Zgłaszaj je bezpośrednio do wydawcy albo repozytorium źródłowego
podlinkowanego z pozycji. ClawHub nie utrzymuje ani nie łata kodu skills ani plugins
innych firm.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisories
ClawHub do zgłaszania podatności w skills lub plugins innych firm.

Dobre zgłoszenia są konkretne i możliwe do podjęcia. Nadużywanie zgłoszeń samo w sobie może prowadzić
do działań wobec konta.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczeń dotyczących organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie z
przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub sprawdził niewrażliwe dowody na to, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, opatrzona aliasem
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w publicznym zgłoszeniu.

## Wstrzymania moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo pozycję
wstrzymaniem moderacyjnym. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą od początku być ukryte do czasu sprawdzenia problemu.

Wstrzymania moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zniesione, gdy zostanie potwierdzony fałszywy alarm.

## Ukryte lub zablokowane pozycje

Pozycja może zostać wstrzymana, ukryta, poddana kwarantannie, unieważniona lub w inny sposób niedostępna na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja go nie przywróci.

Właściciele nadal mogą widzieć diagnostykę swoich wstrzymanych lub ukrytych pozycji. Ta
diagnostyka pomaga wyjaśnić, co się stało i co musi się zmienić, zanim
pozycja będzie mogła wrócić na powierzchnie publiczne.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukryciem treści lub usunięciem pozycji.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może zastosować działanie wobec konta automatycznie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu wobec konta, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany przez bana albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania.

Jeśli e-mail wywołany przez skaner wskazuje wersję skill lub plugin jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku plugins dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw pozycję, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i changelogów
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem plugins
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
