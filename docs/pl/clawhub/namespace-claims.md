---
read_when:
    - Zgłaszanie praw do organizacji, marki, zakresu pakietu, identyfikatora właściciela, sluga umiejętności lub przestrzeni nazw pakietu
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o przegląd ClawHub w sporach dotyczących własności organizacji, marki, uchwytu właściciela, zakresu pakietu, slugu Skills lub przestrzeni nazw.
title: Roszczenia dotyczące organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-01T08:31:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa uchwytów właścicieli, uchwytów organizacji, slugów skill, nazw pakietów Plugin oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś zespół o jej sprawdzenie za pomocą
[formularza zgłoszenia roszczenia organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Używaj tej ścieżki do publicznej, niewrażliwej weryfikacji własności. Nie używaj raportów w produkcie
ani formularza odwołania konta do roszczeń dotyczących przestrzeni nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, otrzymać alias
lub zostać w inny sposób zmieniona z powodu rzeczywistej własności.

Przykłady obejmują:

- uchwyt organizacji zgodny z Twoją organizacją GitHub, projektem, firmą lub społecznością
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować tylko pod
  pasującym właścicielem ClawHub
- slug skill lub nazwa pakietu Plugin, które wydają się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny albo nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący poza samym sporem o własność,
postępuj także zgodnie z odpowiednimi wytycznymi dotyczącymi moderacji albo bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do weryfikacji własności, a nie do awaryjnego ujawniania podatności.

## Przed zgłoszeniem

Najpierw potwierdź, że publikujesz jako właściciel zgodny z przestrzenią nazw.
W przypadku pakietów Plugin nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane jako pasujący właściciel `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw bezpośrednio przez opublikowanie,
zmianę nazwy, przeniesienie, ukrycie albo usunięcie dotkniętego zasobu. Użyj roszczenia,
gdy nie możesz zarządzać obecnym właścicielem albo gdy zespół musi rozstrzygnąć
spór.

## Dowody do dołączenia

Używaj publicznych, niewrażliwych dowodów. Pomocne potwierdzenia obejmują:

- historię organizacji GitHub, repozytorium, wydania lub maintainera
- oficjalną dokumentację projektu, która wskazuje przestrzeń nazw
- dowód dotyczący domeny lub oficjalnej domeny poczty e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omawiać
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne powiadomienia o zmianie nazwy
- linki do spornego właściciela, skill, Plugin, pakietu lub issue w ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien być w stanie zrozumieć
relację bez prywatnych danych logowania ani sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym issue GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani danych logowania
- tokenów wyzwania DNS
- prywatnych dokumentów prawnych albo umów
- osobistych dokumentów tożsamości
- prywatnych e-maili, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału z zespołem.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć albo poddać kwarantannie istniejący wpis,
dodać alias albo przekierowanie, poprosić o więcej dowodów albo odrzucić prośbę.

Weryfikacja przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona.
Zespół ocenia publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
