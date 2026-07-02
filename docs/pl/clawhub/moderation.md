---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie z wstrzymanej, ukrytej lub zablokowanej listy
    - Zrozumienie moderacji ClawHub, blokad i statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, blokady moderacyjne, ukryte wpisy, bany i stan konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-02T14:11:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne mechanizmy odkrywania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte pozycje i działania na kontach
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo
niezgodne z zasadami.

Ta strona omawia moderację i stan konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz o poziomie ryzyka znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać skills, pluginy i pakiety.

Używaj zgłoszeń ClawHub tylko w przypadku niebezpiecznych treści marketplace'u, takich jak:

- złośliwe pozycje
- mylące metadane
- niezadeklarowane wymagania dotyczące poświadczeń lub uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaku towarowego
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś skill** na stronie skill albo polecenia/API zgłaszania
pakietów.

Nie używaj zgłoszeń ClawHub do podatności we własnym kodzie źródłowym zewnętrznego skill lub
pluginu. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
podlinkowanego w pozycji. ClawHub nie utrzymuje ani nie łata
kodu zewnętrznych skills lub pluginów.

GitHub Security Advisories dla `openclaw/clawhub` są przeznaczone na podatności w
samym ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj advisory ClawHub
do podatności w zewnętrznych skills lub pluginach.

Dobre zgłoszenia są konkretne i wykonalne. Nadużywanie zgłoszeń samo w sobie może prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory o własność organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczeń dotyczących organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie z
przepływu zgłoszeń w produkcie ani formularza odwołania konta.

Użyj tego procesu, gdy potrzebujesz, aby zespół ClawHub przejrzał niewrażliwe dowody na to, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, powiązana aliasem
albo inaczej przejrzana. Nie umieszczaj sekretów, dokumentów prywatnych, prywatnych plików prawnych,
dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS w
publicznym issue.

## Blokady moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo pozycję
blokadą moderacyjną. Gdy tak się stanie, dotknięta treść może zostać ukryta przed publicznym
odkrywaniem albo przyszłe publikacje mogą zaczynać jako ukryte do czasu przejrzenia problemu.

Blokady moderacyjne mają chronić użytkowników, podczas gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zdjęte po potwierdzeniu fałszywego alarmu.

## Ukryte lub zablokowane pozycje

Pozycja może zostać wstrzymana, ukryta, poddana kwarantannie, unieważniona albo w inny sposób niedostępna na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę swoich wstrzymanych lub ukrytych pozycji. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
pozycja będzie mogła wrócić na publiczne powierzchnie.

## Bany i stan konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą
skutkować banami kont, unieważnieniem tokenów, ukrytą treścią albo usuniętymi pozycjami.
Sygnały presji nadużyć wydawców są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnego bana ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następny
kwalifikujący się skan po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnego bana, ClawHub może zastosować działanie na koncie automatycznie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zbanowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu na koncie, zaloguj się do interfejsu WWW, aby sprawdzić
stan konta. Jeśli logowanie lub normalny dostęp CLI jest blokowany przez bana albo wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskania dostępu.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję skill lub pluginu jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw pozycję, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby zmniejszyć liczbę fałszywych alarmów i poprawić zaufanie użytkowników:

- utrzymuj dokładne nazwy, streszczenia, tagi i changelogi
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem pluginów
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
