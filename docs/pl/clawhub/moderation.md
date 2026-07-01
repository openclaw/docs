---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie z wstrzymanej, ukrytej lub zablokowanej listy
    - Zrozumienie moderacji, blokad i statusu konta w ClawHub
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte listy, blokady i stan konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-01T15:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania
wobec kont pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne,
wprowadzające w błąd albo niezgodne z zasadami.

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w sekcji
[Audyty bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) oraz
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich
lub innych praw do treści użyj formularza [Żądania dotyczące praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, Pluginy i pakiety.

Zgłoszeń ClawHub używaj wyłącznie do niebezpiecznych treści w marketplace, takich jak:

- złośliwe wpisy
- wprowadzające w błąd metadane
- nieujawnione wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaków towarowych
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś Skill** na stronie Skill albo polecenia/API
zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do podatności w kodzie źródłowym zewnętrznego Skill lub
Pluginu. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
powiązanego z wpisem. ClawHub nie utrzymuje ani nie poprawia kodu zewnętrznych
Skills ani Pluginów.

GitHub Security Advisories dla `openclaw/clawhub` dotyczą podatności w samym
ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj
advisories ClawHub do podatności w zewnętrznych Skills lub Pluginach.

Dobre zgłoszenia są konkretne i możliwe do obsłużenia. Nadużywanie zgłoszeń samo
może prowadzić do działania wobec konta.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory o własność organizacji, marki, zakresu pakietów, uchwytu właściciela lub
przestrzeni nazw powinny korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims),
a nie z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub sprawdził niewrażliwy dowód,
że przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta,
poddana kwarantannie, opatrzona aliasem albo w inny sposób sprawdzona. Nie umieszczaj
sekretów, dokumentów prywatnych, prywatnych dokumentów prawnych, dokumentów tożsamości,
tokenów API ani tokenów wyzwania DNS w publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, objęte treści mogą zostać ukryte przed
publicznym odkrywaniem albo przyszłe publikacje mogą zaczynać jako ukryte do czasu
sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, dopóki ClawHub rozwiązuje przypadki
wysokiego ryzyka. Mogą też zostać zdjęte, gdy potwierdzony zostanie wynik fałszywie
pozytywny.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny
sposób niedostępny na publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel rozwiąże
problem albo moderacja je przywróci.

Właściciele mogą nadal widzieć diagnostykę własnych wstrzymanych lub ukrytych wpisów.
Ta diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim wpis wróci
na publiczne powierzchnie.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować blokadami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem
wpisów. Sygnały ryzyka nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnej blokady ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę na progu
potencjalnej blokady, ClawHub może zastosować działanie wobec konta automatycznie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli
uwierzytelnianie CLI zaczyna zawodzić po działaniu wobec konta, zaloguj się do interfejsu
webowego, aby sprawdzić stan konta. Jeśli logowanie lub zwykły dostęp CLI jest
zablokowany przez blokadę albo wyłączone konto, użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/)
do przeglądu odzyskania dostępu.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję Skill lub Pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku Pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie pozytywne i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- gdy to możliwe, podawaj link do źródła
- używaj uruchomień próbnych przed publikowaniem Pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
