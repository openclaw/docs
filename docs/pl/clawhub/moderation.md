---
read_when:
    - Zgłaszanie Skills, Plugin lub pakiet
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej liście
    - Informacje o moderacji ClawHub, banach lub stanie konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-04T15:38:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne interfejsy odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania wobec kont
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo
niezgodne z zasadami.

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz o poziomie ryzyka znajdziesz w
[Audyty bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Dopuszczalne użycie](/clawhub/acceptable-usage). W przypadku obaw dotyczących praw autorskich
lub innych praw do treści użyj [Żądania dotyczące praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać umiejętności, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko w przypadku niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezadeklarowane dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Dopuszczalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś umiejętność** na stronie umiejętności albo polecenia/API
zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do podatności we własnym kodzie źródłowym umiejętności lub
pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie poprawia kodu umiejętności lub
pluginów innych firm.

GitHub Security Advisories dla `openclaw/clawhub` są przeznaczone dla podatności w samym
ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisories
ClawHub do podatności w umiejętnościach lub pluginach innych firm.

Dobre zgłoszenia są konkretne i możliwe do działania. Nadużywanie zgłoszeń samo w sobie może
prowadzić do działania wobec konta.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, identyfikatora właściciela
albo przestrzeni nazw powinny korzystać z procesu
[Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub sprawdził niepoufny dowód, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, objęta
kwarantanną, otrzymać alias albo zostać w inny sposób sprawdzona. Nie umieszczaj sekretów,
prywatnych dokumentów, prywatnych plików prawnych, osobistych dokumentów tożsamości,
tokenów API ani tokenów wyzwań DNS w publicznym issue.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis blokadą
moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą od początku być ukryte do czasu sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego
ryzyka. Mogą też zostać zdjęte po potwierdzeniu fałszywie pozytywnego wyniku.

## Ukryte lub zablokowane wpisy

Wpis może być wstrzymany, ukryty, objęty kwarantanną, unieważniony albo w inny sposób
niedostępny w publicznych interfejsach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel rozwiąże problem
albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim wpis będzie mógł wrócić
do publicznych interfejsów.

## Bany i status konta

Konta, które naruszają zasady ClawHub, mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować banami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną próg
potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne kwalifikujące
się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w progu potencjalnego bana,
ClawHub może zastosować działanie wobec konta automatycznie. Sygnały sprawdzania o niższej
pewności i ograniczone czasowo pozostają poza automatycznym egzekwowaniem.

Usunięte, zbanowane albo wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli
uwierzytelnianie CLI zacznie zawodzić po działaniu wobec konta, zaloguj się do interfejsu web,
aby sprawdzić stan konta. Jeśli logowanie albo normalny dostęp CLI jest zablokowany przez bana
lub wyłączone konto, użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do
sprawdzenia odzyskania dostępu.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję umiejętności lub pluginu jako
złośliwą, pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Sprawdź wynik skanowania, popraw wpis, zwiększ numer wersji i prześlij
poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywie pozytywne wyniki i zwiększyć zaufanie użytkowników:

- dbaj o dokładność nazw, podsumowań, tagów i changelogów
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
