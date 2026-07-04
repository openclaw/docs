---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanym, ukrytym lub zablokowanym wpisie
    - Zrozumienie moderacji ClawHub, blokad lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte wpisy, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-04T04:09:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie wyszukiwania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania na kontach
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo
niezgodne z zasadami.

Ta strona omawia moderację i status konta. Etykiety audytu, takie jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziom ryzyka opisano w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W przypadku praw autorskich lub innych
kwestii związanych z prawami do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko dla niebezpiecznych treści marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycia znaków towarowych
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś Skill** na stronie Skill albo polecenia/API zgłaszania
pakietu dla pakietów.

Nie używaj zgłoszeń ClawHub do zgłaszania podatności w kodzie źródłowym zewnętrznego Skill lub
pluginu. Zgłaszaj je bezpośrednio wydawcy albo w repozytorium źródłowym
podlinkowanym we wpisie. ClawHub nie utrzymuje ani nie poprawia kodu
zewnętrznych Skills ani pluginów.

GitHub Security Advisories dla `openclaw/clawhub` są przeznaczone na podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisory ClawHub
do podatności w zewnętrznych Skills lub pluginach.

Dobre zgłoszenia są konkretne i umożliwiają podjęcie działań. Nadużywanie zgłoszeń samo może prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie z
przepływu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub przejrzał niewrażliwe dowody na to, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, oznaczona aliasem
lub w inny sposób sprawdzona. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych dokumentów prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w
publicznym zgłoszeniu.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
blokadą moderacyjną. Gdy tak się stanie, dotknięte treści mogą zostać ukryte przed publicznym
wyszukiwaniem albo przyszłe publikacje mogą domyślnie zaczynać jako ukryte do czasu sprawdzenia problemu.

Blokady moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte, gdy potwierdzony zostanie wynik fałszywie pozytywny.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony lub w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli zobaczysz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis może wrócić na publiczne powierzchnie.

## Bany i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć ze strony wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może zastosować działanie na koncie automatycznie.
Sygnały o niższej pewności i ograniczone czasowo sygnały przeglądu pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie lub zwykły dostęp CLI jest blokowany przez ban albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję Skill lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. Dla pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, popraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie pozytywne i zwiększyć zaufanie użytkowników:

- utrzymuj nazwy, podsumowania, tagi i changelogi w zgodności ze stanem faktycznym
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
