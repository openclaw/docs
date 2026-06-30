---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej liście
    - Zrozumienie moderacji ClawHub, blokad lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-06-30T14:28:59Z"
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
dotyczące kont pomagają chronić użytkowników, gdy wydanie lub konto wydaje się
niebezpieczne, wprowadzające w błąd albo niezgodne z zasadami.

Ta strona omawia moderację i status konta. Etykiety audytu, takie jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziom ryzyka opisano w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich
lub innych praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub wyłącznie do niebezpiecznych treści w marketplace, takich jak:

- złośliwe wpisy
- wprowadzające w błąd metadane
- niezadeklarowane dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś Skills** na stronie Skills albo polecenia/API
zgłaszania pakietów dla pakietów.

Nie używaj zgłoszeń ClawHub do podatności w kodzie źródłowym Skills lub
pluginu zewnętrznej firmy. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium
źródłowego podlinkowanego we wpisie. ClawHub nie utrzymuje ani nie łata
kodu zewnętrznych Skills ani pluginów.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze,
uwierzytelnianiu, skanowaniu, moderacji albo granicach zaufania pobierania/instalacji.
Nie używaj advisory ClawHub do podatności w zewnętrznych Skills lub pluginach.

Dobre zgłoszenia są konkretne i możliwe do obsłużenia. Nadużywanie zgłoszeń samo
może prowadzić do działań wobec konta.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela
lub przestrzeni nazw powinny korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub sprawdził niewrażliwe dowody,
że przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta,
poddana kwarantannie, opatrzona aliasem albo w inny sposób sprawdzona. Nie umieszczaj
sekretów, prywatnych dokumentów, prywatnych akt prawnych, dokumentów tożsamości,
tokenów API ani tokenów wyzwania DNS w publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed
publicznym odkrywaniem albo przyszłe publikacje mogą być domyślnie ukryte do czasu
sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki
wysokiego ryzyka. Mogą też zostać zdjęte po potwierdzeniu fałszywego alarmu.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny
sposób niedostępny na publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów.
Ta diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim wpis
będzie mógł wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia
mogą skutkować banami konta, unieważnieniem tokenów, ukryciem treści albo usunięciem
wpisów. Sygnały presji nadużyć ze strony wydawców są sprawdzane codziennie. Sygnały,
które osiągną próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie.
Jeśli kolejny kwalifikujący się skan po terminie ostrzeżenia nadal umieszcza wydawcę
w progu potencjalnego bana, ClawHub może zastosować działanie wobec konta automatycznie.
Sygnały o niższej pewności i ograniczone czasowo sygnały przeglądu pozostają poza
automatycznym egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli
uwierzytelnianie CLI zaczyna kończyć się niepowodzeniem po działaniu wobec konta,
zaloguj się do interfejsu webowego, aby sprawdzić stan konta. Jeśli logowanie lub
normalny dostęp CLI są zablokowane przez bana albo wyłączone konto, użyj
[formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję Skills lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Sprawdź wynik skanowania, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj nazwy, podsumowania, tagi i changelogi w zgodzie z rzeczywistością
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
