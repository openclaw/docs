---
read_when:
    - Zgłaszanie skill, pluginu lub pakietu
    - Przywracanie wstrzymanego, ukrytego lub zablokowanego wpisu
    - Zrozumienie moderacji ClawHub, banów lub stanu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte pozycje, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-06-28T10:02:04Z"
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

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w
[Audytach bezpieczeństwa](/pl/clawhub/security-audits).

Zobacz także [Bezpieczeństwo](/pl/clawhub/security) i
[Akceptowalne użycie](/pl/clawhub/acceptable-usage). W przypadku praw autorskich lub innych obaw
dotyczących praw do treści użyj [Wniosków dotyczących praw do treści](/pl/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, plugins i pakiety.

Używaj zgłoszeń ClawHub tylko w przypadku niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- nieujawnione dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/pl/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skill albo polecenia/API zgłaszania pakietów
dla pakietów.

Nie używaj zgłoszeń ClawHub do luk w zabezpieczeniach we własnym kodzie źródłowym skill lub
pluginu strony trzeciej. Zgłaszaj je bezpośrednio wydawcy albo repozytorium źródłowemu
podlinkowanemu we wpisie. ClawHub nie utrzymuje ani nie poprawia kodu skill lub pluginów
stron trzecich.

GitHub Security Advisories dla `openclaw/clawhub` dotyczą luk w zabezpieczeniach
samego ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisories ClawHub
do luk w zabezpieczeniach w Skills lub plugins stron trzecich.

Dobre zgłoszenia są konkretne i możliwe do podjęcia działań. Nadużywanie zgłoszeń samo w sobie
może prowadzić do działania na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory o własność organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczeń dotyczących organizacji i przestrzeni nazw](/pl/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub sprawdził niewrażliwy dowód, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, zmieniona, ukryta, poddana kwarantannie, oznaczona aliasem
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych dokumentów prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą zaczynać jako ukryte do czasu sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte, gdy zostanie potwierdzony fałszywy alarm.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony lub w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja go nie przywróci.

Właściciele nadal mogą widzieć diagnostykę dla własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na powierzchnie publiczne.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukryciem treści lub usunięciem wpisów.
Sygnały presji nadużyć wydawców są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następny
kwalifikujący się skan po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może automatycznie zastosować działanie na koncie.
Sygnały o niższej pewności i ograniczone czasowo sygnały przeglądu pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna się nie powodzić po działaniu na koncie, zaloguj się do web UI, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany przez bana albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję skill lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby zmniejszyć liczbę fałszywych alarmów i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i changelogów
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj próbnych uruchomień przed publikowaniem plugins
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
