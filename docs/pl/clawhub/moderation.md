---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej pozycji
    - Zrozumienie moderacji ClawHub, blokad lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte pozycje, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-01T20:36:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderowanie i bezpieczeństwo kont

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, wstrzymania moderacyjne, ukryte wpisy i działania na kontach
pomagają chronić użytkowników, gdy wydanie lub konto wygląda na niebezpieczne, mylące albo niezgodne
z zasadami.

Ta strona omawia moderowanie i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz o poziomie ryzyka znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz także [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko do niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezadeklarowane poświadczenia lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycia znaków towarowych
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś Skill** na stronie Skill albo polecenia/API zgłaszania
pakietów.

Nie używaj zgłoszeń ClawHub do zgłaszania podatności w kodzie źródłowym zewnętrznego Skill lub
pluginu. Zgłaszaj je bezpośrednio wydawcy albo w repozytorium źródłowym połączonym z wpisem.
ClawHub nie utrzymuje ani nie poprawia kodu zewnętrznych Skills lub pluginów.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w samym
ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderowaniu lub granicach zaufania pobierania/instalacji. Nie używaj advisory ClawHub
do zgłaszania podatności w zewnętrznych Skills lub pluginach.

Dobre zgłoszenia są konkretne i możliwe do wykonania. Nadużywanie zgłoszeń samo w sobie może
prowadzić do działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory o własność organizacji, marki, zakresu pakietów, uchwytu właściciela lub przestrzeni nazw
powinny korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub przejrzał niewrażliwy dowód, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, oznaczona aliasem
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w publicznym zgłoszeniu.

## Wstrzymania moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
wstrzymaniem moderacyjnym. Gdy tak się stanie, objęte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą od razu trafiać jako ukryte do czasu sprawdzenia problemu.

Wstrzymania moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte, gdy potwierdzony zostanie fałszywy alarm.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja go nie przywróci.

Właściciele nadal mogą widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować blokadami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawców są sprawdzane codziennie. Sygnały, które osiągają
próg potencjalnej blokady ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następny
kwalifikujący się skan po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnej blokady, ClawHub może automatycznie zastosować działanie na koncie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp CLI jest zablokowany przez blokadę lub wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/), aby poprosić o przegląd odzyskiwania.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję Skill lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj dane wyjściowe skanowania, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- dbaj o dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
