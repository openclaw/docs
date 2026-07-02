---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej ofercie
    - Zrozumienie moderacji ClawHub, blokad lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, blokady moderacyjne, ukryte oferty, bany i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-02T17:47:44Z"
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
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo
niezgodne z zasadami.

Ta strona omawia moderację i status konta. Etykiety audytu, takie jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziom ryzyka opisuje
[Audyty bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W przypadku obaw dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać umiejętności, pluginy i pakiety.

Używaj zgłoszeń ClawHub wyłącznie w przypadku niebezpiecznych treści w marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezadeklarowane dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś umiejętność** na stronie umiejętności albo polecenia/API
do zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do podatności w kodzie źródłowym zewnętrznej umiejętności lub
pluginu. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie łata kodu
zewnętrznych umiejętności lub pluginów.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji lub granicach zaufania pobierania/instalacji. Nie używaj advisories ClawHub
do podatności w zewnętrznych umiejętnościach lub pluginach.

Dobre zgłoszenia są konkretne i możliwe do podjęcia działań. Nadużywanie zgłoszeń samo w sobie może prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie z
przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub sprawdził niewrażliwe dowody na to, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, aliasowana
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę lub wpis
blokadą moderacyjną. Gdy tak się dzieje, objęte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą od początku być ukryte do czasu sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte, gdy potwierdzony zostanie wynik fałszywie dodatni.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony lub w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem lub moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na powierzchnie publiczne.

## Blokady kont i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować zablokowaniem konta, unieważnieniem tokenów, ukryciem treści lub usunięciem wpisów.
Sygnały presji nadużyć ze strony wydawców są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnej blokady ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnej blokady, ClawHub może automatycznie zastosować działanie na koncie.
Sygnały o niższej pewności i ograniczone czasowo sygnały przeglądowe pozostają poza
automatycznym egzekwowaniem.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany przez blokadę konta albo konto wyłączone,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania dostępu.

Jeśli e-mail wywołany przez skaner wskazuje wersję umiejętności lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie dodatnie i poprawić zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikacją pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
