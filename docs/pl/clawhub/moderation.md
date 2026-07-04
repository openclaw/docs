---
read_when:
    - Zgłaszanie umiejętności, pluginu lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej liście
    - Zrozumienie moderacji ClawHub, banów lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-04T20:44:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte pozycje i działania na kontach
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, wprowadzające w błąd albo
niezgodne z zasadami.

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W przypadku obaw dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać skills, plugins i pakiety.

Używaj zgłoszeń ClawHub tylko dla niebezpiecznych treści marketplace, takich jak:

- złośliwe pozycje
- wprowadzające w błąd metadane
- niezadeklarowane dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skill albo polecenia/API zgłaszania
pakietów dla pakietów.

Nie używaj zgłoszeń ClawHub do zgłaszania podatności w kodzie źródłowym zewnętrznego skill lub
pluginu. Zgłaszaj je bezpośrednio wydawcy albo repozytorium źródłowemu
powiązanemu z pozycją. ClawHub nie utrzymuje ani nie poprawia
kodu zewnętrznych skills ani plugins.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisories ClawHub
do zgłaszania podatności w zewnętrznych skills ani plugins.

Dobre zgłoszenia są konkretne i możliwe do działania. Nadużywanie zgłoszeń samo może prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietów, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczeń dotyczących organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub przejrzał niewrażliwe dowody na to, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, oznaczona aliasem
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych dokumentów prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w
publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo pozycję
blokadą moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą zaczynać jako ukryte do czasu sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte, gdy zostanie potwierdzony wynik fałszywie dodatni.

## Ukryte lub zablokowane pozycje

Pozycja może zostać wstrzymana, ukryta, poddana kwarantannie, unieważniona albo w inny sposób niedostępna na
publicznych powierzchniach instalacji.

Jeśli zobaczysz jeden z tych stanów, nie instaluj wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja go nie przywróci.

Właściciele nadal mogą widzieć diagnostykę własnych wstrzymanych lub ukrytych pozycji. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
pozycja będzie mogła wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem pozycji.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może automatycznie zastosować działanie na koncie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie się nie udawać po działaniu na koncie, zaloguj się do interfejsu web, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany przez ban albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) w celu przeglądu odzyskiwania dostępu.

Jeśli e-mail wywołany przez skaner wskazuje wersję skill lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. Dla plugins dodaj
`--kind plugin`. Przejrzyj wynik skanowania, popraw pozycję, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby zmniejszyć liczbę wyników fałszywie dodatnich i zwiększyć zaufanie użytkowników:

- utrzymuj dokładne nazwy, podsumowania, tagi i dzienniki zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj uruchomień próbnych przed publikowaniem plugins
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
