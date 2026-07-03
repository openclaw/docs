---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanym, ukrytym lub zablokowanym wpisie
    - Zrozumienie moderacji ClawHub, blokad lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte oferty, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-03T02:56:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo kont

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania
na kontach pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne,
mylące albo niezgodne z zasadami.

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w
[Audyty bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Dopuszczalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich
lub innych praw do treści użyj [Wnioski dotyczące praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko dla niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezgłoszone poświadczenia lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaków towarowych
- treści naruszające [Dopuszczalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skilla albo polecenia/API zgłaszania
pakietów dla pakietów.

Nie używaj zgłoszeń ClawHub do zgłaszania podatności we własnym kodzie źródłowym
skilla lub pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium
źródłowego podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie łata kodu
skilli ani pluginów innych firm.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj porad
ClawHub do zgłaszania podatności w skillach lub pluginach innych firm.

Dobre zgłoszenia są konkretne i umożliwiają działanie. Nadużywanie zgłoszeń samo może
prowadzić do działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietów, uchwytu właściciela
lub przestrzeni nazw powinny korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims),
a nie z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub sprawdził niewrażliwy dowód na to,
że przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta,
poddana kwarantannie, opatrzona aliasem albo w inny sposób sprawdzona. Nie dołączaj sekretów,
prywatnych dokumentów, prywatnych akt prawnych, dokumentów tożsamości, tokenów API ani tokenów
wyzwania DNS w publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą domyślnie zaczynać jako ukryte, dopóki problem
nie zostanie sprawdzony.

Blokady moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte po potwierdzeniu fałszywego alarmu.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny sposób
niedostępny na publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować blokadą konta, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnej blokady ClawHub, mogą wyzwolić automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnej blokady, ClawHub może zastosować działanie na koncie automatycznie.
Sygnały sprawdzania o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp CLI jest zablokowany przez blokadę lub wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania.

Jeśli wiadomość e-mail wyzwolona przez skaner wskazuje wersję skilla lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. Dla pluginów dodaj
`--kind plugin`. Sprawdź wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj próbnych uruchomień przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
