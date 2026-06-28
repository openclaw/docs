---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanym, ukrytym lub zablokowanym ogłoszeniu
    - Zrozumienie moderacji ClawHub, banów lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte oferty, bany i reputacja konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-06-28T07:41:34Z"
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
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, wprowadzające w błąd albo
niezgodne z zasadami.

Ta strona opisuje moderację i stan konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w sekcji
[Audytach bezpieczeństwa](/pl/clawhub/security-audits).

Zobacz także [Bezpieczeństwo](/pl/clawhub/security) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych praw do treści
użyj [Wniosków dotyczących praw do treści](/pl/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko w przypadku niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- wprowadzające w błąd metadane
- niezadeklarowane dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/pl/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skilla albo polecenia/API zgłaszania
pakietów dla pakietów.

Nie używaj zgłoszeń ClawHub do zgłaszania podatności we własnym kodzie źródłowym skilla lub
pluginu zewnętrznego. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie łata
kodu zewnętrznych skilli ani pluginów.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj zaleceń ClawHub
do zgłaszania podatności w zewnętrznych skillach lub pluginach.

Dobre zgłoszenia są konkretne i możliwe do podjęcia działania. Nadużywanie zgłoszeń może samo w sobie prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietów, uchwytu właściciela albo przestrzeni nazw powinny
korzystać z procesu [Roszczeń dotyczących organizacji i przestrzeni nazw](/pl/clawhub/namespace-claims), a nie z
przepływu zgłoszeń w produkcie ani formularza odwołania konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub przejrzał niewrażliwe dowody, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, powiązana aliasem
albo w inny sposób zweryfikowana. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych akt prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w
publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięta treść może zostać ukryta przed publicznym
odkrywaniem albo przyszłe publikacje mogą domyślnie zaczynać jako ukryte, dopóki problem nie zostanie przejrzany.

Blokady moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte, gdy potwierdzony zostanie fałszywy alarm.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele mogą nadal widzieć diagnostykę własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis może wrócić na publiczne powierzchnie.

## Bany i stan konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukrytą treścią albo usuniętymi wpisami.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może zastosować działanie na koncie automatycznie.
Sygnały o niższej pewności i ograniczone czasowo sygnały przeglądu pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie kończyć się niepowodzeniem po działaniu na koncie, zaloguj się w interfejsie webowym, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp CLI jest zablokowany przez ban lub wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskania dostępu.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję skilla lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij naprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
