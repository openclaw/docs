---
read_when:
    - Zgłaszanie umiejętności, pluginu lub pakietu
    - Przywracanie wstrzymanej, ukrytej lub zablokowanej pozycji na liście
    - Informacje o moderowaniu, blokadach i statusie konta w ClawHub
sidebarTitle: Moderation and Account Safety
summary: Jak działają zgłoszenia w ClawHub, blokady moderacyjne, ukryte wpisy, bany i status konta.
title: Moderacja i bezpieczeństwo konta
x-i18n:
    generated_at: "2026-07-16T18:08:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderacja i bezpieczeństwo konta

ClawHub umożliwia swobodne publikowanie, ale publiczne mechanizmy wyszukiwania i instalacji nadal
wymagają zabezpieczeń. Zgłoszenia, blokady moderacyjne, ukryte wpisy i działania dotyczące kont
pomagają chronić użytkowników, gdy wydanie lub konto wydaje się niebezpieczne, wprowadzające w błąd albo
niezgodne z zasadami.

Ta strona opisuje moderację i status konta. Informacje o etykietach audytu, takich jak
`Pass`, `Review`, `Warn`, `Malicious`, oraz poziomie ryzyka znajdują się w sekcji
[Audity bezpieczeństwa](/clawhub/security-audits).

Zobacz także [Bezpieczeństwo](/clawhub/security) oraz
[Zasady dopuszczalnego użytkowania](/clawhub/acceptable-usage). W sprawach dotyczących praw autorskich lub innych
praw do treści należy skorzystać z sekcji [Wnioski dotyczące praw do treści](/clawhub/content-rights).

## Zgłoszenia

Zalogowani użytkownicy mogą zgłaszać Skills, pluginy i pakiety.

Zgłoszeń w ClawHub należy używać wyłącznie w odniesieniu do niebezpiecznych treści w katalogu, takich jak:

- złośliwe wpisy
- wprowadzające w błąd metadane
- niezadeklarowane dane uwierzytelniające lub wymagania dotyczące uprawnień
- podejrzane instrukcje instalacji
- podszywanie się
- rejestracje w złej wierze lub niewłaściwe użycie znaków towarowych
- treści naruszające [Zasady dopuszczalnego użytkowania](/clawhub/acceptable-usage)

Należy użyć przycisku **Zgłoś skill** na stronie skilla albo polecenia/API
do zgłaszania pakietów.

Nie należy używać zgłoszeń ClawHub do informowania o lukach w zabezpieczeniach kodu źródłowego
zewnętrznego skilla lub pluginu. Należy je zgłaszać bezpośrednio wydawcy lub w repozytorium
kodu źródłowego wskazanym we wpisie. ClawHub nie utrzymuje ani nie aktualizuje
kodu zewnętrznych skilli lub pluginów.

GitHub Security Advisories dla `openclaw/clawhub` służą do zgłaszania luk w zabezpieczeniach
samego ClawHub. Przykłady obejmują błędy w witrynie, API, CLI, rejestrze, uwierzytelnianiu,
skanowaniu, moderacji lub granicach zaufania związanych z pobieraniem i instalacją. Nie należy używać zgłoszeń
ClawHub do informowania o lukach w zabezpieczeniach zewnętrznych skilli lub pluginów.

Dobre zgłoszenia są konkretne i umożliwiają podjęcie działań. Nadużywanie mechanizmu zgłoszeń może samo w sobie prowadzić do
działań wobec konta.

## Roszczenia dotyczące organizacji i przestrzeni nazw

Spory dotyczące własności organizacji, marki, zakresu pakietów, identyfikatora właściciela lub przestrzeni nazw
należy zgłaszać w ramach procesu [Roszczenia dotyczące organizacji i przestrzeni nazw](/clawhub/namespace-claims), a nie za pomocą
mechanizmu zgłoszeń w produkcie ani formularza odwołania dotyczącego konta.

Z tego procesu należy skorzystać, gdy personel ClawHub ma sprawdzić niepoufne dowody potwierdzające, że
przestrzeń nazw powinna zostać zastrzeżona, przeniesiona, przemianowana, ukryta, objęta kwarantanną, otrzymać alias
lub zostać poddana innej weryfikacji. W publicznym zgłoszeniu nie wolno umieszczać sekretów, prywatnych dokumentów, poufnych
akt prawnych, dokumentów tożsamości, tokenów API ani tokenów wyzwań DNS.

## Blokady moderacyjne

Niektóre poważne ustalenia lub naruszenia zasad mogą skutkować objęciem wydawcy albo wpisu
blokadą moderacyjną. W takim przypadku treści objęte działaniem mogą zostać ukryte w publicznym
wyszukiwaniu, a przyszłe publikacje mogą być początkowo ukryte do czasu rozpatrzenia sprawy.

Blokady moderacyjne służą ochronie użytkowników w czasie, gdy ClawHub rozstrzyga sprawy
wysokiego ryzyka. Mogą również zostać zniesione po potwierdzeniu wyniku fałszywie dodatniego.

## Ukryte lub zablokowane wpisy

Wpis może zostać wstrzymany, ukryty, objęty kwarantanną, unieważniony lub w inny sposób wyłączony z
publicznych mechanizmów instalacji.

W przypadku wyświetlenia jednego z tych stanów nie należy instalować wydania, dopóki właściciel
nie rozwiąże problemu albo moderacja nie przywróci wpisu.

Właściciele mogą nadal widzieć informacje diagnostyczne dotyczące własnych wstrzymanych lub ukrytych wpisów. Te
informacje pomagają wyjaśnić, co się wydarzyło i co należy zmienić, zanim
wpis będzie mógł wrócić do publicznych mechanizmów.

## Blokady kont i status konta

Konta naruszające zasady ClawHub mogą utracić możliwość publikowania. Poważne nadużycia mogą
skutkować zablokowaniem konta, unieważnieniem tokenów, ukryciem treści lub usunięciem wpisów.
Sygnały presji dotyczącej nadużyć ze strony wydawców są sprawdzane codziennie. Sygnały osiągające
próg potencjalnej blokady ClawHub mogą wywołać automatyczne ostrzeżenie. Jeśli pierwszy
kwalifikujący się skan po upływie terminu ostrzeżenia nadal klasyfikuje wydawcę
na poziomie progu potencjalnej blokady, ClawHub może automatycznie zastosować działanie wobec konta.
Sygnały o niższym poziomie pewności oraz sygnały ograniczonego czasowo przeglądu nie podlegają automatycznemu
egzekwowaniu.

Usunięte, zablokowane lub wyłączone konta nie mogą korzystać z tokenów API ClawHub. Jeśli uwierzytelnianie CLI
zaczyna kończyć się niepowodzeniem po podjęciu działania wobec konta, należy zalogować się w internetowym interfejsie użytkownika, aby sprawdzić
stan konta. Jeśli logowanie lub zwykły dostęp przez CLI są zablokowane z powodu blokady albo wyłączenia konta,
należy skorzystać z [formularza odwołania ClawHub](https://appeals.openclaw.ai/), aby wnioskować o odzyskanie dostępu.

Jeśli wiadomość e-mail wywołana przez skaner wskazuje wersję skilla lub pluginu jako złośliwą,
należy pobrać zapisane wyniki skanowania zablokowanej przesłanej wersji:
`clawhub scan download <slug> --version <version>`. W przypadku pluginów należy dodać
`--kind plugin`. Należy przejrzeć wyniki skanowania, poprawić wpis, zwiększyć numer
wersji i przesłać poprawioną wersję.

## Wskazówki dla wydawców

Aby ograniczyć wyniki fałszywie dodatnie i zwiększyć zaufanie użytkowników:

- należy dbać o poprawność nazw, podsumowań, tagów i dzienników zmian
- należy deklarować wymagane zmienne środowiskowe i uprawnienia
- należy unikać zaciemnionych poleceń instalacyjnych
- w miarę możliwości należy zamieszczać odnośnik do kodu źródłowego
- przed opublikowaniem pluginów należy wykonywać przebiegi próbne
- należy odpowiadać jasno, jeśli użytkownicy lub moderatorzy pytają o działanie wydania
