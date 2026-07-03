---
read_when:
    - Zgłaszanie umiejętności, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej ofercie
    - Informacje o moderacji, banach lub statusie konta w ClawHub
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-03T23:44:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania wobec kont
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo
niezgodne z zasadami.

Ta strona omawia moderację i status konta. Etykiety audytu, takie jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziom ryzyka opisano w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko do niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezadeklarowane dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś Skill** na stronie Skill albo polecenia/API
zgłaszania pakietu dla pakietów.

Nie używaj zgłoszeń ClawHub do podatności w kodzie źródłowym zewnętrznego Skill lub
pluginu. Zgłaszaj je bezpośrednio wydawcy lub do repozytorium źródłowego
podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie łata
kodu zewnętrznych Skills ani pluginów.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj
advisories ClawHub do podatności w zewnętrznych Skills lub pluginach.

Dobre zgłoszenia są konkretne i możliwe do podjęcia działań. Nadużywanie zgłaszania samo może prowadzić do
działań wobec konta.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie z
przepływu zgłaszania w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby pracownicy ClawHub przejrzeli niewrażliwy dowód, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, opatrzona aliasem
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w
publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą domyślnie zaczynać jako ukryte do czasu przeglądu problemu.

Blokady moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte po potwierdzeniu fałszywego alarmu.

## Ukryte lub zablokowane wpisy

Wpis może być wstrzymany, ukryty, poddany kwarantannie, unieważniony lub w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja go nie przywróci.

Właściciele mogą nadal widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągają
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może automatycznie zastosować działanie wobec konta.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu wobec konta, zaloguj się w web UI, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp CLI są blokowane przez bana lub wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskania dostępu.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję Skill lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. Dla pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj nazwy, streszczenia, tagi i dzienniki zmian w zgodności z rzeczywistością
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikacją pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
