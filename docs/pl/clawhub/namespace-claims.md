---
read_when:
    - Zajmowanie organizacji, marki, zakresu pakietu, uchwytu właściciela, sluga umiejętności lub przestrzeni nazw pakietu
    - Rozwiązywanie problemu z przestrzenią nazw, która jest już zajęta lub zarezerwowana
    - Podejmowanie decyzji, czy użyć zgłoszenia, odwołania czy roszczenia dotyczącego przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o weryfikację ClawHub w sporach o własność organizacji, marki, identyfikatora właściciela, zakresu pakietu, sluga umiejętności lub przestrzeni nazw.
title: Zgłoszenia organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-01T20:37:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa identyfikatorów właścicieli, identyfikatorów organizacji, slugów umiejętności, nazw pakietów pluginów oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś zespół o jej sprawdzenie
za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznego, niewrażliwego przeglądu własności. Nie używaj zgłoszeń
w produkcie ani formularza odwołania dotyczącego konta do roszczeń dotyczących przestrzeni nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, zmieniona, ukryta, objęta kwarantanną, otrzymać alias
lub w inny sposób zostać zmieniona z powodu rzeczywistej własności.

Przykłady obejmują:

- identyfikator organizacji, który pasuje do Twojej organizacji GitHub, projektu, firmy lub społeczności
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować wyłącznie pod
  odpowiadającym właścicielem ClawHub
- slug umiejętności lub nazwa pakietu pluginu, która wydaje się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny albo nieosiągalny właściciel, który blokuje uprawnionego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący wykraczając poza spór o własność,
postępuj również zgodnie z odpowiednimi wskazówkami dotyczącymi moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do przeglądu własności, a nie do awaryjnego ujawniania podatności.

## Przed zgłoszeniem

Najpierw potwierdź, że publikujesz jako właściciel zgodny z przestrzenią nazw.
W przypadku pakietów pluginów nazwy zakresowe, takie jak `@example-org/example-plugin`, muszą być
publikowane jako odpowiadający właściciel `example-org`.

Jeśli możesz zarządzać bieżącym właścicielem, napraw przestrzeń nazw bezpośrednio przez opublikowanie,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia,
gdy nie możesz zarządzać bieżącym właścicielem albo gdy zespół musi rozwiązać
spór.

## Dowody do dołączenia

Używaj publicznych, niewrażliwych dowodów. Pomocne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydań lub maintainerów
- oficjalną dokumentację projektu, która wymienia przestrzeń nazw
- dowód dotyczący domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omówić
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne powiadomienia o zmianie nazwy
- linki do spornego właściciela, umiejętności, pluginu, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien być w stanie zrozumieć
relację bez potrzeby używania prywatnych danych logowania lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani danych logowania
- tokenów wyzwań DNS
- prywatnych plików prawnych lub umów
- osobistych dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału dla zespołu.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć lub objąć kwarantanną istniejący wpis,
dodać alias lub przekierowanie, poprosić o więcej dowodów albo odrzucić prośbę.

Przegląd przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona.
Zespół ocenia publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo kont](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
