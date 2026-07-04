---
read_when:
    - Zgłaszanie Skills, Plugin lub pakietu
    - Odzyskiwanie po wstrzymanej, ukrytej lub zablokowanej pozycji
    - Zrozumienie moderacji ClawHub, banów lub statusu konta
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia ClawHub, blokady moderacyjne, ukryte listy, bany i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-04T18:23:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub jest otwarty na publikowanie, ale publiczne powierzchnie odkrywania i instalacji nadal
potrzebują zabezpieczeń. Zgłoszenia, wstrzymania moderacyjne, ukryte wpisy i działania na kontach
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, mylące albo niezgodne
z zasadami.

Ta strona opisuje moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz o poziomie ryzyka znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Zobacz też [Bezpieczeństwo](/clawhub/security) i
[Akceptowalne użycie](/clawhub/acceptable-usage). W przypadku praw autorskich lub innych
kwestii dotyczących praw do treści użyj [Wniosków dotyczących praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, Plugin i pakiety.

Używaj zgłoszeń ClawHub tylko dla niebezpiecznych treści w marketplace, takich jak:

- złośliwe wpisy
- mylące metadane
- nieujawnione dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub nadużycie znaków towarowych
- treści naruszające [Akceptowalne użycie](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś Skill** na stronie Skill albo polecenia/API zgłaszania
pakietów.

Nie używaj zgłoszeń ClawHub do luk w zabezpieczeniach w kodzie źródłowym zewnętrznego Skill lub
Plugin. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
połączonego z wpisem. ClawHub nie utrzymuje ani nie łata kodu zewnętrznych Skill lub Plugin.

GitHub Security Advisories dla `openclaw/clawhub` są przeznaczone dla luk w zabezpieczeniach
samego ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji albo granicach zaufania pobierania/instalacji. Nie używaj porad ClawHub
do luk w zabezpieczeniach w zewnętrznych Skills lub Plugin.

Dobre zgłoszenia są konkretne i możliwe do podjęcia działania. Nadużywanie zgłoszeń samo w sobie może prowadzić do
działań na koncie.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietu, uchwytu właściciela lub przestrzeni nazw powinny
korzystać z procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie z
przepływu zgłaszania w produkcie ani formularza odwołania konta.

Użyj tego procesu, gdy potrzebujesz, aby personel ClawHub przejrzał niewrażliwy dowód, że
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, zmieniona, ukryta, poddana kwarantannie, otrzymać alias
albo zostać w inny sposób przejrzana. Nie umieszczaj sekretów, prywatnych dokumentów, prywatnych plików prawnych,
osobistych dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS w
publicznym zgłoszeniu.

## Wstrzymania moderacyjne

Niektóre poważne ustalenia lub problemy z zasadami mogą objąć wydawcę albo wpis
wstrzymaniem moderacyjnym. Gdy tak się stanie, objęta treść może zostać ukryta z publicznego
odkrywania albo przyszłe publikacje mogą zaczynać jako ukryte do czasu przejrzenia problemu.

Wstrzymania moderacyjne mają chronić użytkowników, gdy ClawHub rozwiązuje przypadki wysokiego ryzyka.
Mogą też zostać zniesione, gdy potwierdzony zostanie wynik fałszywie dodatni.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, poddany kwarantannie, unieważniony albo w inny sposób niedostępny na
publicznych powierzchniach instalacji.

Jeśli widzisz jeden z tych stanów, nie instaluj wydania, chyba że właściciel
rozwiąże problem albo moderacja je przywróci.

Właściciele nadal mogą widzieć diagnostykę własnych wstrzymanych lub ukrytych wpisów. Ta
diagnostyka pomaga wyjaśnić, co się stało i co trzeba zmienić, zanim
wpis będzie mógł wrócić na publiczne powierzchnie.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą stracić dostęp do publikowania. Poważne nadużycia mogą
skutkować blokadami konta, unieważnieniem tokenów, ukryciem treści albo usunięciem wpisów.
Sygnały presji nadużyć wydawcy są sprawdzane codziennie. Sygnały, które osiągną
próg potencjalnej blokady ClawHub, mogą wywołać automatyczne ostrzeżenie. Jeśli następne
kwalifikujące się skanowanie po terminie ostrzeżenia nadal umieszcza wydawcę w
progu potencjalnej blokady, ClawHub może automatycznie zastosować działanie na koncie.
Sygnały przeglądu o niższej pewności i ograniczone czasowo pozostają poza automatycznym
egzekwowaniem.

Usunięte, zablokowane lub wyłączone konta nie mogą używać tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zacznie zawodzić po działaniu na koncie, zaloguj się do interfejsu webowego, aby sprawdzić
stan konta. Jeśli logowanie albo normalny dostęp CLI jest zablokowany przez blokadę lub wyłączone konto,
użyj [formularza odwołania ClawHub](https://appeals.openclaw.ai/) do przeglądu odzyskiwania.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję Skill lub Plugin jako złośliwą,
pobierz zapisane wyniki skanowania dla zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku Plugin dodaj
`--kind plugin`. Przejrzyj wynik skanowania, napraw wpis, zwiększ numer wersji
i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie dodatnie i zwiększyć zaufanie użytkowników:

- utrzymuj dokładność nazw, podsumowań, tagów i changelogów
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacji
- linkuj do źródła, gdy to możliwe
- używaj przebiegów próbnych przed publikowaniem Plugin
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o zachowanie wydania
