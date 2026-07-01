---
read_when:
    - Zgłaszanie Skills, pluginu lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej liście
    - Zrozumienie moderacji ClawHub, blokad i stanu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-01T08:33:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, wstrzymania moderacyjne, ukryte wpisy i działania wobec konta
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo niezgodne
z zasadami.

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz o poziomie ryzyka znajdziesz w sekcji
[Audyty bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W przypadku obaw dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać umiejętności, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko w odniesieniu do niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezgłoszone wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaków towarowych
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś umiejętność** na stronie umiejętności albo polecenia/API
zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do zgłaszania luk w zabezpieczeniach kodu źródłowego umiejętności lub
pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy albo w repozytorium źródłowym
podlinkowanym we wpisie. ClawHub nie utrzymuje ani nie łata kodu umiejętności lub pluginów
innych firm.

GitHub Security Advisories dla `openclaw/clawhub` dotyczą luk w zabezpieczeniach
samego ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisories ClawHub
do zgłaszania luk w zabezpieczeniach umiejętności lub pluginów innych firm.

Dobre zgłoszenia są konkretne i możliwe do podjęcia działań. Nadużywanie zgłoszeń samo w sobie może prowadzić do
działań wobec konta.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub przejrzał niewrażliwe dowody na to, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, powiązana aliasem
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, dokumentów prywatnych, prywatnych dokumentów prawnych,
osobistych dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w publicznym zgłoszeniu.

## Wstrzymania moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
wstrzymaniem moderacyjnym. Gdy tak się stanie, dotknięta treść może zostać ukryta przed publicznym
odkrywaniem albo przyszłe publikacje mogą domyślnie zaczynać jako ukryte do czasu przejrzenia problemu.

Wstrzymania moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zniesione po potwierdzeniu fałszywego alarmu.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony lub w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli zobaczysz jeden z tych stanów, nie instaluj wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja go nie przywróci.

Właściciele mogą nadal widzieć diagnostykę własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować blokadami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnej blokady ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnej blokady, ClawHub może automatycznie zastosować działanie wobec konta.
Sygnały o niższej pewności i ograniczone czasowo sygnały przeglądu pozostają poza automatycznym
egzekwowaniem.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu wobec konta, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp CLI jest zablokowany przez blokadę lub wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania dostępu.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję umiejętności lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby zmniejszyć liczbę fałszywych alarmów i zwiększyć zaufanie użytkowników:

- dbaj o dokładność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
