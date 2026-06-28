---
read_when:
    - Zgłaszanie skill, pluginu lub pakietu
    - Odzyskiwanie po wstrzymanym, ukrytym lub zablokowanym wpisie
    - Zrozumienie moderacji ClawHub, blokad lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte wpisy, bany i stan konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-06-28T05:07:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania dotyczące kont
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo
niezgodne z zasadami.

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w
[Audytach bezpieczeństwa](/pl/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/pl/clawhub/security) i
[Akceptowalne użycie](/pl/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/pl/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać skills, plugins i pakiety.

Używaj zgłoszeń ClawHub tylko dla niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezgłoszone poświadczenia lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaków towarowych
- treści naruszające [Akceptowalne użycie](/pl/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skill albo polecenia/API zgłaszania pakietów
dla pakietów.

Nie używaj zgłoszeń ClawHub do luk w zabezpieczeniach w kodzie źródłowym zewnętrznego skill lub
plugin. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie łata kodu zewnętrznych
skills ani plugins.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania luk w zabezpieczeniach
samego ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisory ClawHub
do luk w zabezpieczeniach w zewnętrznych skills lub plugins.

Dobre zgłoszenia są konkretne i możliwe do działania. Nadużywanie zgłoszeń samo w sobie może
prowadzić do działań dotyczących konta.

## Roszczenia dotyczące organizacji i namespace

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela albo namespace powinny
korzystać z procesu [Roszczenia dotyczące organizacji i namespace](/pl/clawhub/namespace-claims), a nie z
przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby personel ClawHub sprawdził niewrażliwy dowód, że
namespace powinien zostać zarezerwowany, przeniesiony, przemianowany, ukryty, poddany kwarantannie, otrzymać alias
albo zostać w inny sposób sprawdzony. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych plików prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w
publicznym issue.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięta treść może zostać ukryta przed publicznym
odkrywaniem albo przyszłe publikacje mogą od razu zaczynać jako ukryte do czasu sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki
wysokiego ryzyka. Mogą też zostać zniesione, gdy potwierdzony zostanie wynik fałszywie dodatni.

## Ukryte lub zablokowane wpisy

Wpis może być wstrzymany, ukryty, poddany kwarantannie, cofnięty albo w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja go nie przywróci.

Właściciele mogą nadal widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami konta, unieważnieniem tokenów, ukrytą treścią albo usuniętymi wpisami.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana w ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może automatycznie zastosować działanie dotyczące konta.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane albo wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie kończyć się niepowodzeniem po działaniu dotyczącym konta, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp przez CLI jest zablokowany przez bana lub wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/), aby poprosić o sprawdzenie odzyskania dostępu.

Jeśli e-mail wywołany przez skaner wskazuje wersję skill lub plugin jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. Dla plugins dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie dodatnie i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i changelogów
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj próbnych uruchomień przed publikowaniem plugins
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
