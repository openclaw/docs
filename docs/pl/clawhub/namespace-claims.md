---
read_when:
    - Zgłaszanie prawa do organizacji, marki, zakresu pakietu, uchwytu właściciela, slugu umiejętności lub przestrzeni nazw pakietu
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia dotyczącego przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o weryfikację ClawHub w sporach dotyczących własności organizacji, marki, identyfikatora właściciela, zakresu pakietu, slug Skills lub przestrzeni nazw.
title: Roszczenia dotyczące organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-03T10:01:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa nazw właścicieli, nazw organizacji, slugów umiejętności, nazw pakietów pluginów i
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, wprowadzająca w błąd lub sporna w ClawHub, poproś zespół o jej sprawdzenie
za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznego, niewrażliwego przeglądu własności. Nie używaj raportów
w produkcie ani formularza odwołania dotyczącego konta do roszczeń dotyczących przestrzeni nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, zmieniona, ukryta, poddana kwarantannie, otrzymać alias
lub zostać w inny sposób zmieniona z powodu rzeczywistej własności.

Przykłady obejmują:

- nazwę organizacji zgodną z Twoją organizacją GitHub, projektem, firmą lub społecznością
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować tylko w ramach
  pasującego właściciela ClawHub
- slug umiejętności lub nazwę pakietu pluginu, które wyglądają, jakby podszywały się pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usuniętego, nieaktywnego lub nieosiągalnego właściciela, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub wprowadzający w błąd poza samym sporem o własność,
zastosuj również odpowiednie wytyczne dotyczące moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do przeglądu własności, a nie do pilnego zgłaszania podatności.

## Zanim zgłosisz

Najpierw potwierdź, że publikujesz jako właściciel pasujący do przestrzeni nazw.
W przypadku pakietów pluginów nazwy zakresowe, takie jak `@example-org/example-plugin`, muszą być
publikowane jako pasujący właściciel `example-org`.

Jeśli możesz zarządzać bieżącym właścicielem, napraw przestrzeń nazw bezpośrednio przez publikację,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia,
gdy nie możesz zarządzać bieżącym właścicielem albo gdy zespół musi rozstrzygnąć
spór.

## Jakie dowody dołączyć

Używaj publicznych, niewrażliwych dowodów. Pomocne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydań lub opiekunów
- oficjalną dokumentację projektu, która wymienia przestrzeń nazw
- dowód domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omawiać
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne ogłoszenia o zmianie nazwy
- linki do spornego właściciela, umiejętności, pluginu, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien móc zrozumieć
relację bez potrzeby używania prywatnych danych logowania lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisywania ani danych logowania
- tokenów wyzwania DNS
- prywatnych akt prawnych ani umów
- dokumentów tożsamości
- prywatnych e-maili, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału zespołu.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć lub poddać kwarantannie istniejący wpis,
dodać alias lub przekierowanie, poprosić o więcej dowodów albo odrzucić prośbę.

Przegląd przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona.
Zespół bierze pod uwagę publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
