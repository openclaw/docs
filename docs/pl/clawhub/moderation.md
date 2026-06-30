---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej ofercie
    - Zrozumienie moderacji ClawHub, blokad lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte listingi, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-06-30T22:36:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie wykrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania
na kontach pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne,
mylące albo niezgodne z zasadami.

Ta strona omawia moderację i status konta. Etykiety audytu, takie jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziom ryzyka opisano w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz także [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W przypadku praw autorskich lub innych
kwestii dotyczących praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko w przypadku niebezpiecznej zawartości marketplace, takiej jak:

- złośliwe wpisy
- mylące metadane
- nieujawnione dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skilla albo polecenia/API zgłaszania
pakietów.

Nie używaj zgłoszeń ClawHub do luk w zabezpieczeniach w kodzie źródłowym własnym skilla lub
pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy lub w repozytorium źródłowym
połączonym z wpisu. ClawHub nie utrzymuje ani nie łata kodu
skilli ani pluginów innych firm.

GitHub Security Advisories dla `openclaw/clawhub` służą do luk w zabezpieczeniach
samego ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj
advisories ClawHub do luk w zabezpieczeniach w skillach lub pluginach innych firm.

Dobre zgłoszenia są konkretne i możliwe do podjęcia działań. Nadużywanie zgłoszeń może samo w sobie prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące organizacji, marki, zakresu pakietu, uchwytu właściciela lub własności przestrzeni nazw powinny
korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie
z przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby personel ClawHub przejrzał niewrażliwy dowód, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, zmieniona, ukryta, poddana kwarantannie, oznaczona aliasem
lub w inny sposób zweryfikowana. Nie dołączaj sekretów, dokumentów prywatnych, prywatnych plików prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w
publicznym issue.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, objęta treść może zostać ukryta przed publicznym
wykrywaniem albo przyszłe publikacje mogą zaczynać jako ukryte do czasu przejrzenia problemu.

Blokady moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki
wysokiego ryzyka. Mogą też zostać zdjęte po potwierdzeniu wyniku fałszywie dodatniego.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony lub w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele mogą nadal widzieć diagnostykę własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis może wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami konta, unieważnieniem tokenów, ukrytą zawartością lub usuniętymi wpisami.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągają
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może zastosować działanie na koncie automatycznie.
Sygnały o niższej pewności i ograniczone czasowo sygnały przeglądu pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna zawodzić po działaniu na koncie, zaloguj się w web UI, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany przez bana albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania dostępu.

Jeśli e-mail wywołany przez skaner wskazuje wersję skilla lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij naprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie dodatnie i zwiększyć zaufanie użytkowników:

- utrzymuj dokładne nazwy, podsumowania, tagi i changelogi
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
