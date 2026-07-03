---
read_when:
    - Zgłaszanie organizacji, marki, zakresu pakietów, uchwytu właściciela, sluga skill lub przestrzeni nazw pakietów
    - Rozwiązywanie konfliktu przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia dotyczącego przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o przegląd ClawHub w sporach dotyczących własności organizacji, marki, uchwytu właściciela, zakresu pakietu, sluga Skills lub przestrzeni nazw.
title: Roszczenia do organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-03T23:43:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa uchwytów właścicieli, uchwytów organizacji, slugów Skills, nazw
pakietów Plugin oraz zakresów pakietów jako publicznych przestrzeni nazw. Jeśli
przestrzeń nazw wydaje się należeć do rzeczywistego projektu, marki, ekosystemu
pakietów lub organizacji, ale jest już zajęta, zarezerwowana, myląca albo
sporna w ClawHub, poproś zespół o jej sprawdzenie za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznej, niewrażliwej weryfikacji własności. Nie używaj
zgłoszeń w produkcie ani formularza odwołania dotyczącego konta do roszczeń
dotyczących przestrzeni nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub
powinien sprawdzić, czy przestrzeń nazw powinna zostać zarezerwowana,
przeniesiona, przemianowana, ukryta, poddana kwarantannie, oznaczona aliasem
albo inaczej zmieniona z powodu rzeczywistej własności.

Przykłady obejmują:

- uchwyt organizacji zgodny z Twoją organizacją GitHub, projektem, firmą lub
  społecznością
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować tylko
  pod pasującym właścicielem ClawHub
- slug Skills lub nazwa pakietu Plugin, która wydaje się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii
  pakietu
- usunięte, nieaktywne albo nieosiągalne konto właściciela, które blokuje
  prawowitego właściciela przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy albo mylący poza samym sporem o
własność, zastosuj także odpowiednie wytyczne dotyczące moderacji lub
bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw służy do
weryfikacji własności, a nie do awaryjnego ujawniania podatności.

## Przed zgłoszeniem

Najpierw potwierdź, że publikujesz jako właściciel pasujący do przestrzeni
nazw. W przypadku pakietów Plugin nazwy z zakresem, takie jak
`@example-org/example-plugin`, muszą być publikowane jako pasujący właściciel
`example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw
bezpośrednio przez opublikowanie, przemianowanie, przeniesienie, ukrycie lub
usunięcie zasobu, którego dotyczy problem. Użyj roszczenia, gdy nie możesz
zarządzać obecnym właścicielem albo gdy zespół musi rozstrzygnąć spór.

## Dowody do dołączenia

Używaj publicznych, niewrażliwych dowodów. Pomocne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydania lub maintainerów
- oficjalną dokumentację projektu, która wymienia przestrzeń nazw
- dowód z domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io albo innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie
  omawiać publicznie
- historię repozytorium źródłowego, historię pakietu albo publiczne
  powiadomienia o zmianie nazwy
- linki do spornego właściciela, Skills, Plugin, pakietu lub zgłoszenia w
  ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien móc zrozumieć relację bez
potrzeby używania prywatnych danych logowania lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub.
Nie dołączaj:

- tokenów API, kluczy podpisu ani danych logowania
- tokenów wyzwań DNS
- prywatnych plików prawnych lub umów
- dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych zgłoszeń bezpieczeństwa ani poufnych
  danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału z
zespołem. Użyj tej opcji zamiast publicznie publikować wrażliwe materiały.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń
nazw, przenieść własność, przemianować zasób, ukryć lub poddać kwarantannie
istniejący wpis, dodać alias albo przekierowanie, poprosić o więcej dowodów
albo odrzucić żądanie.

Weryfikacja przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie
przeniesiona. Zespół bierze pod uwagę publiczne dowody, istniejące użycie,
ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
