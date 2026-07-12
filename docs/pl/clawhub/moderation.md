---
read_when:
    - Zgłaszanie Skills, pluginu lub pakietu
    - Odzyskiwanie wstrzymanej, ukrytej lub zablokowanej oferty
    - Informacje o moderacji, blokadach i statusie konta w ClawHub
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, wstrzymania moderacyjne, ukryte oferty, blokady i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-12T14:56:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub umożliwia swobodne publikowanie, ale publiczne mechanizmy wyszukiwania i instalowania nadal wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania dotyczące kont pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, wprowadzające w błąd albo niezgodne z zasadami.

Ta strona opisuje moderację i status konta. Informacje o etykietach audytu, takich jak `Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdziesz w sekcji [Audyty bezpieczeństwa](/clawhub/security-audits).

Zobacz także [Bezpieczeństwo](/pl/clawhub/security) oraz [Dopuszczalne użytkowanie](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych praw do treści skorzystaj z sekcji [Wnioski dotyczące praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Zgłoszeń w ClawHub używaj wyłącznie w odniesieniu do niebezpiecznych treści w katalogu, takich jak:

- złośliwe wpisy
- wprowadzające w błąd metadane
- nieujawnione wymagania dotyczące danych uwierzytelniających lub uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub niewłaściwe użycie znaków towarowych
- treści naruszające zasady [Dopuszczalnego użytkowania](/clawhub/acceptable-usage)

Użyj przycisku **Zgłoś Skill** na stronie Skill lub polecenia/API do zgłaszania pakietów.

Nie używaj zgłoszeń ClawHub do informowania o lukach w kodzie źródłowym zewnętrznego Skill lub pluginu. Zgłaszaj je bezpośrednio wydawcy albo w repozytorium kodu źródłowego wskazanym we wpisie. ClawHub nie utrzymuje ani nie poprawia kodu zewnętrznych Skills lub pluginów.

Alerty bezpieczeństwa GitHub dla `openclaw/clawhub` służą do zgłaszania luk w samym ClawHub. Obejmują one na przykład błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu, skanowaniu, moderacji lub granicach zaufania związanych z pobieraniem i instalacją. Nie używaj alertów ClawHub do zgłaszania luk w zewnętrznych Skills lub pluginach.

Dobre zgłoszenia są konkretne i umożliwiają podjęcie działań. Nadużywanie mechanizmu zgłoszeń może samo w sobie skutkować działaniami wobec konta.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietów, identyfikatora właściciela lub przestrzeni nazw należy rozwiązywać w ramach procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie za pomocą funkcji zgłaszania w produkcie ani formularza odwołania dotyczącego konta.

Skorzystaj z tego procesu, gdy personel ClawHub ma zweryfikować niepoufne dowody uzasadniające zastrzeżenie, przeniesienie, zmianę nazwy, ukrycie, objęcie kwarantanną, utworzenie aliasu lub inną formę weryfikacji przestrzeni nazw. Nie umieszczaj w publicznym zgłoszeniu sekretów, prywatnych dokumentów, poufnych akt prawnych, dokumentów tożsamości, tokenów API ani tokenów wyzwania DNS.

## Blokady moderacyjne

Niektóre poważne ustalenia lub naruszenia zasad mogą skutkować objęciem wydawcy albo wpisu blokadą moderacyjną. W takiej sytuacji treści, których to dotyczy, mogą zostać ukryte przed publicznym wyszukiwaniem, a przyszłe publikacje mogą być początkowo ukrywane do czasu rozpatrzenia sprawy.

Blokady moderacyjne mają chronić użytkowników podczas rozpatrywania przez ClawHub przypadków wysokiego ryzyka. Mogą również zostać cofnięte po potwierdzeniu wyniku fałszywie dodatniego.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, objęty kwarantanną, wycofany lub w inny sposób wyłączony z publicznych mechanizmów instalacji.

Jeśli zobaczysz jeden z tych stanów, nie instaluj wydania, dopóki właściciel nie rozwiąże problemu albo moderacja nie przywróci wpisu.

Właściciele mogą nadal widzieć dane diagnostyczne własnych wstrzymanych lub ukrytych wpisów. Dane te pomagają wyjaśnić, co się stało i co należy zmienić, zanim wpis będzie mógł wrócić do publicznych mechanizmów.

## Blokady i status konta

Konta naruszające zasady ClawHub mogą utracić dostęp do publikowania. Poważne nadużycia mogą skutkować zablokowaniem konta, unieważnieniem tokenów, ukryciem treści lub usunięciem wpisów. Sygnały wskazujące na ryzyko nadużyć ze strony wydawcy są sprawdzane codziennie. Sygnały osiągające próg potencjalnej blokady ClawHub mogą wywołać automatyczne ostrzeżenie. Jeśli pierwszy kwalifikujący się skan po upływie terminu wskazanego w ostrzeżeniu nadal klasyfikuje wydawcę na poziomie progu potencjalnej blokady, ClawHub może automatycznie podjąć działanie wobec konta. Sygnały o niższym poziomie pewności oraz sygnały czasowe o ograniczonym zakresie nie podlegają automatycznemu egzekwowaniu zasad.

Usunięte, zablokowane lub wyłączone konta nie mogą korzystać z tokenów API ClawHub. Jeśli po podjęciu działania wobec konta uwierzytelnianie w CLI przestanie działać, zaloguj się w interfejsie internetowym, aby sprawdzić stan konta. Jeśli blokada lub wyłączenie konta uniemożliwia zalogowanie albo zwykły dostęp przez CLI, skorzystaj z [formularza odwoławczego ClawHub](https://appeals.openclaw.ai/), aby poprosić o rozpatrzenie możliwości odzyskania dostępu.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję Skill lub pluginu jako złośliwą, pobierz zapisane wyniki skanowania zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów dodaj
`--kind plugin`. Przejrzyj wyniki skanowania, popraw wpis, zwiększ numer wersji i prześlij poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć liczbę wyników fałszywie dodatnich i zwiększyć zaufanie użytkowników:

- dbaj o poprawność nazw, podsumowań, tagów i dzienników zmian
- deklaruj wymagane zmienne środowiskowe i uprawnienia
- unikaj zaciemnionych poleceń instalacyjnych
- w miarę możliwości zamieszczaj odnośnik do kodu źródłowego
- przed opublikowaniem pluginów wykonuj uruchomienia próbne
- odpowiadaj jasno, jeśli użytkownicy lub moderatorzy pytają o działanie wydania
