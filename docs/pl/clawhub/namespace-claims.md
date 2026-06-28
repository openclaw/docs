---
read_when:
    - Zgłaszanie praw do organizacji, marki, zakresu pakietu, uchwytu właściciela, sluga umiejętności lub przestrzeni nazw pakietu
    - Rozwiązywanie przestrzeni nazw, która jest już zgłoszona lub zarezerwowana
    - Podejmowanie decyzji, czy użyć zgłoszenia, odwołania czy roszczenia dotyczącego przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o weryfikację ClawHub w sporach o własność organizacji, marki, uchwytu właściciela, zakresu pakietu, sluga umiejętności lub przestrzeni nazw.
title: Roszczenia do organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-06-28T00:11:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa nazw właścicieli, nazw organizacji, slugów Skills, nazw pakietów Plugin oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wygląda na należącą do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zgłoszona, zarezerwowana, myląca albo sporna w ClawHub, poproś personel o jej
sprawdzenie za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznego, niewrażliwego przeglądu własności. Nie używaj
zgłoszeń w produkcie ani formularza odwołania dotyczącego konta do roszczeń o przestrzenie nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że personel ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, otrzymać alias
albo zostać w inny sposób zmieniona ze względu na rzeczywistą własność.

Przykłady obejmują:

- nazwa organizacji, która odpowiada Twojej organizacji GitHub, projektowi, firmie lub społeczności
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować wyłącznie pod
  odpowiadającym mu właścicielem ClawHub
- slug Skills lub nazwa pakietu Plugin, która wydaje się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący poza samym sporem o własność,
zastosuj także odpowiednie wskazówki dotyczące moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do przeglądu własności, a nie do awaryjnego ujawniania podatności.

## Przed zgłoszeniem

Najpierw potwierdź, że publikujesz jako właściciel odpowiadający przestrzeni nazw.
W przypadku pakietów Plugin nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane jako odpowiadający im właściciel `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw bezpośrednio przez publikację,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia,
gdy nie możesz zarządzać obecnym właścicielem albo gdy personel musi rozstrzygnąć
spór.

## Jakie dowody dołączyć

Używaj publicznych, niewrażliwych dowodów. Pomocne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydań lub maintainerów
- oficjalną dokumentację projektu, która wskazuje przestrzeń nazw
- dowód domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omówić
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne powiadomienia o zmianie nazwy
- linki do spornego właściciela, Skills, Plugin, pakietu lub issue w ClawHub

Wyjaśnij, co potwierdza każdy link. Personel powinien móc zrozumieć
relację bez potrzeby używania prywatnych poświadczeń lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym issue GitHub. Nie dołączaj:

- tokenów API, kluczy podpisu ani poświadczeń
- tokenów wyzwań DNS
- prywatnych dokumentów prawnych ani umów
- dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału z personelem.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka personel ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć lub poddać kwarantannie istniejący wpis,
dodać alias lub przekierowanie, poprosić o więcej dowodów albo odrzucić wniosek.

Przegląd przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona.
Personel waży publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/pl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation)
- [Bezpieczeństwo](/pl/clawhub/security)
