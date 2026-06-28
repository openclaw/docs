---
read_when:
    - Zgłaszanie Skills, pluginu lub pakietu
    - Odzyskiwanie po wstrzymanym, ukrytym lub zablokowanym wpisie
    - Zrozumienie moderacji ClawHub, banów lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-06-28T00:11:05Z"
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

Ta strona omawia moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w
[Audyty bezpieczeństwa](/pl/clawhub/security-audits).

Zobacz także [Bezpieczeństwo](/pl/clawhub/security) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage). W przypadku wątpliwości dotyczących praw autorskich lub innych
praw do treści użyj strony [Wnioski dotyczące praw do treści](/pl/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać umiejętności, pluginy i pakiety.

Używaj zgłoszeń ClawHub wyłącznie do niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- wprowadzające w błąd metadane
- niezadeklarowane dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/pl/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś umiejętność** na stronie umiejętności albo polecenia/API
do zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do zgłaszania luk w zabezpieczeniach w kodzie źródłowym
umiejętności lub pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium
źródłowego podanego we wpisie. ClawHub nie utrzymuje ani nie łata kodu
umiejętności ani pluginów innych firm.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania luk w zabezpieczeniach
samego ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisory ClawHub
do luk w zabezpieczeniach w umiejętnościach lub pluginach innych firm.

Dobre zgłoszenia są konkretne i możliwe do wykorzystania. Nadużywanie zgłoszeń samo w sobie może prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/pl/clawhub/namespace-claims), a nie z
przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub przejrzał niewrażliwy dowód, że dana
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, powiązana aliasem
lub w inny sposób zweryfikowana. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych dokumentów prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w publicznym issue.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
odkrywaniem albo przyszłe publikacje mogą domyślnie zaczynać jako ukryte do czasu weryfikacji problemu.

Blokady moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte po potwierdzeniu fałszywego alarmu.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli zobaczysz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę swoich wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następny
kwalifikujący się skan po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może zastosować działanie na koncie automatycznie.
Sygnały o niższej pewności oraz ograniczone czasowo sygnały przeglądu pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie kończyć się niepowodzeniem po działaniu na koncie, zaloguj się do web UI, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest zablokowany przez bana albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) w celu przeglądu odzyskiwania.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję umiejętności lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć fałszywe alarmy i zwiększyć zaufanie użytkowników:

- utrzymuj dokładne nazwy, podsumowania, tagi i dzienniki zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikacją pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
