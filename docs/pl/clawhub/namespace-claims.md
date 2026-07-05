---
read_when:
    - Zajmowanie nazwy organizacji, marki, zakresu pakietu, identyfikatora właściciela, sluga Skills lub przestrzeni nazw pakietu
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o przegląd ClawHub w sporach dotyczących własności organizacji, marki, uchwytu właściciela, zakresu pakietu, sluga Skills lub przestrzeni nazw.
title: Zgłoszenia praw do organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-05T08:40:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Zgłoszenia praw do organizacji i przestrzeni nazw

ClawHub używa identyfikatorów właścicieli, identyfikatorów organizacji, slugów Skills, nazw pakietów Plugin oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś zespół o jej przegląd
za pomocą
[formularza zgłoszenia roszczenia do organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznego, niewrażliwego przeglądu własności. Nie używaj zgłoszeń
w produkcie ani formularza odwołania dotyczącego konta do roszczeń dotyczących przestrzeni nazw.

## Kiedy otworzyć zgłoszenie

Otwórz zgłoszenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, otrzymać alias
lub zostać zmieniona w inny sposób ze względu na rzeczywistą własność.

Przykłady obejmują:

- identyfikator organizacji zgodny z Twoją organizacją GitHub, projektem, firmą lub społecznością
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować tylko pod
  pasującym właścicielem ClawHub
- slug Skills lub nazwę pakietu Plugin, która wydaje się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usuniętego, nieaktywnego lub nieosiągalnego właściciela, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący poza samym sporem o własność,
zastosuj także odpowiednie wytyczne dotyczące moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do przeglądu własności, a nie do awaryjnego ujawniania podatności.

## Przed wysłaniem

Najpierw potwierdź, że publikujesz jako właściciel pasujący do przestrzeni nazw.
W przypadku pakietów Plugin nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane jako pasujący właściciel `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw bezpośrednio przez publikację,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj zgłoszenia,
gdy nie możesz zarządzać obecnym właścicielem albo gdy zespół musi rozstrzygnąć
spór.

## Dowody do dołączenia

Użyj publicznych, niewrażliwych dowodów. Pomocne materiały obejmują:

- historię organizacji GitHub, repozytorium, wydań lub maintainerów
- oficjalną dokumentację projektu, która wskazuje przestrzeń nazw
- dowód dotyczący domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omówić
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne powiadomienia o zmianie nazwy
- linki do spornego właściciela, Skills, Plugin, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien być w stanie zrozumieć
relację bez potrzeby używania prywatnych poświadczeń lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani poświadczeń
- tokenów wyzwań DNS
- prywatnych dokumentów prawnych lub umów
- dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa lub poufnych danych klientów

Formularz zgłoszenia pyta, czy wrażliwe dowody wymagają prywatnego kanału zespołu.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć lub poddać kwarantannie istniejący wpis,
dodać alias albo przekierowanie, poprosić o więcej dowodów lub odrzucić żądanie.

Przegląd przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona.
Zespół bierze pod uwagę publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
