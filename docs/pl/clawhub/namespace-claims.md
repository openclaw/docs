---
read_when:
    - Zgłaszanie praw do organizacji, marki, zakresu pakietu, uchwytu właściciela, slugu skill lub przestrzeni nazw pakietu
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia dotyczącego przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o weryfikację ClawHub w sporach dotyczących własności organizacji, marki, uchwytu właściciela, zakresu pakietu, identyfikatora skill lub przestrzeni nazw.
title: Zgłaszanie praw do organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-04T11:04:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia do organizacji i przestrzeni nazw

ClawHub używa uchwytów właścicieli, uchwytów organizacji, slugów umiejętności, nazw pakietów pluginów i
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś zespół o jej sprawdzenie
za pomocą
[formularza zgłoszenia roszczenia do organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznej, niewrażliwej weryfikacji własności. Nie używaj zgłoszeń w produkcie
ani formularza odwołania dotyczącego konta do roszczeń o przestrzeń nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie do przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, zmieniona, ukryta, poddana kwarantannie, otrzymać alias
lub zostać zmieniona w inny sposób ze względu na rzeczywistą własność.

Przykłady obejmują:

- uchwyt organizacji zgodny z Twoją organizacją GitHub, projektem, firmą lub społecznością
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować tylko w ramach
  odpowiadającego właściciela ClawHub
- slug umiejętności lub nazwa pakietu pluginu, które wydają się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący poza samym sporem o własność,
zastosuj także odpowiednie wskazówki dotyczące moderacji lub bezpieczeństwa. Formularz roszczenia do przestrzeni nazw
służy do weryfikacji własności, a nie do awaryjnego ujawniania podatności.

## Zanim zgłosisz

Najpierw potwierdź, że publikujesz jako właściciel zgodny z przestrzenią nazw.
W przypadku pakietów pluginów nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane jako odpowiadający właściciel `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw bezpośrednio przez opublikowanie,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia,
gdy nie możesz zarządzać obecnym właścicielem albo gdy zespół musi rozwiązać
spór.

## Dowody do dołączenia

Użyj publicznych, niewrażliwych dowodów. Pomocne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydania lub opiekunów
- oficjalną dokumentację projektu, która nazywa przestrzeń nazw
- dowód domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omówić
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne ogłoszenia o zmianie nazwy
- linki do spornego właściciela ClawHub, umiejętności, pluginu, pakietu lub zgłoszenia

Wyjaśnij, co potwierdza każdy link. Zespół powinien móc zrozumieć
relację bez potrzeby używania prywatnych poświadczeń lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani poświadczeń
- tokenów wyzwania DNS
- prywatnych dokumentów prawnych lub umów
- dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału z zespołem.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć lub poddać istniejący wpis kwarantannie,
dodać alias albo przekierowanie, poprosić o więcej dowodów albo odrzucić prośbę.

Weryfikacja przestrzeni nazw nie gwarantuje, że każda zgodna nazwa zostanie przeniesiona.
Zespół bierze pod uwagę publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
