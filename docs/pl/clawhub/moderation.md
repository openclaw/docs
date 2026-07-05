---
read_when:
    - Zgłaszanie umiejętności, Plugin lub pakietu
    - Odzyskiwanie wstrzymanej, ukrytej lub zablokowanej pozycji
    - Zrozumienie moderacji ClawHub, banów lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte oferty, bany i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-05T08:47:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderowanie i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania na kontach
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, wprowadzające w błąd albo niezgodne
z zasadami.

Ta strona opisuje moderowanie i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w
[Audyty bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/pl/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Wnioski dotyczące praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, Pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko do niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- wprowadzające w błąd metadane
- niezgłoszone dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skill albo
polecenia/API zgłaszania pakietów dla pakietów.

Nie używaj zgłoszeń ClawHub do luk w zabezpieczeniach w kodzie źródłowym zewnętrznego skill lub
Plugin. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie łata
kodu zewnętrznych Skills ani Pluginów.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania luk w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderowaniu albo granicach zaufania pobierania/instalacji. Nie używaj
advisories ClawHub do luk w zewnętrznych Skills lub Pluginach.

Dobre zgłoszenia są konkretne i możliwe do obsłużenia. Nadużywanie zgłoszeń może samo prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub przejrzał niewrażliwy dowód, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, powiązana aliasem
lub w inny sposób przejrzana. Nie dołączaj sekretów, prywatnych dokumentów, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w
publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięta treść może zostać ukryta przed publicznym
odkrywaniem albo przyszłe publikacje mogą od razu zaczynać jako ukryte do czasu przeglądu problemu.

Blokady moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje sprawy wysokiego ryzyka.
Mogą też zostać zniesione po potwierdzeniu wyniku fałszywie pozytywnego.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja go nie przywróci.

Właściciele nadal mogą widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukrytą treścią albo usuniętymi wpisami.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może zastosować działanie na koncie automatycznie.
Sygnały o niższej pewności i ograniczone czasowo sygnały przeglądu pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp CLI jest zablokowany przez bana lub wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję skill lub Plugin jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. Dla Pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie pozytywne i zwiększyć zaufanie użytkowników:

- utrzymuj poprawne nazwy, streszczenia, tagi i dzienniki zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem Pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
