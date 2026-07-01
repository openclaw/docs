---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej liście
    - Zrozumienie moderacji ClawHub, banów lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-01T13:23:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, wstrzymania moderacyjne, ukryte wpisy i działania na kontach
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo
niezgodne z zasadami.

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz o poziomie ryzyka znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko w przypadku niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezgłoszone wymagania dotyczące danych uwierzytelniających lub uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś Skill** na stronie Skill albo polecenia/API do zgłaszania
pakietów.

Nie używaj zgłoszeń ClawHub do raportowania podatności w kodzie źródłowym zewnętrznego Skill lub
pluginu. Zgłoś je bezpośrednio wydawcy albo do repozytorium źródłowego podlinkowanego we wpisie.
ClawHub nie utrzymuje ani nie łata kodu zewnętrznych Skills ani pluginów.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w samym
ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisory ClawHub
do podatności w zewnętrznych Skills lub pluginach.

Dobre zgłoszenia są konkretne i możliwe do obsłużenia. Nadużywanie zgłoszeń samo w sobie może
prowadzić do działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory o własność organizacji, marki, zakresu pakietów, uchwytu właściciela lub przestrzeni nazw
powinny korzystać z procesu [Roszczeń dotyczących organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub sprawdził niewrażliwy dowód, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, powiązana aliasem
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, dokumentów prywatnych, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w publicznym issue.

## Wstrzymania moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
wstrzymaniem moderacyjnym. Gdy tak się stanie, objęte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą zaczynać jako ukryte do czasu sprawdzenia sprawy.

Wstrzymania moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte, gdy potwierdzony zostanie fałszywy alarm.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę dla własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować blokadą konta, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnej blokady ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnej blokady, ClawHub może automatycznie zastosować działanie na koncie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp przez CLI jest zablokowany przez ban lub wyłączone konto,
użyj [formularza odwoławczego ClawHub](https://appeals.openclaw.ai/) w celu sprawdzenia możliwości odzyskania dostępu.

Jeśli e-mail wywołany przez skaner wskazuje wersję Skill lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładne nazwy, podsumowania, tagi i changelogi
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
