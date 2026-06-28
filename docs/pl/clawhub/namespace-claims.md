---
read_when:
    - Zgłaszanie prawa do organizacji, marki, zakresu pakietu, identyfikatora właściciela, sluga umiejętności lub przestrzeni nazw pakietu
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o przegląd ClawHub w przypadku sporów o własność organizacji, marki, uchwytu właściciela, zakresu pakietu, sluga umiejętności lub przestrzeni nazw.
title: Roszczenia organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-06-28T10:02:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa identyfikatorów właścicieli, identyfikatorów organizacji, slugów Skills, nazw pakietów pluginów oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wygląda, jakby należała do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś personel o jej sprawdzenie
za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznej, niewrażliwej weryfikacji własności. Nie używaj raportów w produkcie
ani formularza odwołania dotyczącego konta do roszczeń dotyczących przestrzeni nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że personel ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, objęta kwarantanną, powiązana aliasem
lub zmieniona w inny sposób z powodu rzeczywistej własności.

Przykłady obejmują:

- identyfikator organizacji zgodny z Twoją organizacją GitHub, projektem, firmą lub społecznością
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować tylko pod
  odpowiadającym mu właścicielem ClawHub
- slug Skills lub nazwa pakietu pluginu, które wyglądają na podszywanie się pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący w sposób wykraczający poza spór o własność,
postępuj także zgodnie z odpowiednimi wytycznymi dotyczącymi moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do weryfikacji własności, a nie do awaryjnego ujawniania podatności.

## Zanim złożysz zgłoszenie

Najpierw potwierdź, że publikujesz jako właściciel odpowiadający przestrzeni nazw.
W przypadku pakietów pluginów nazwy zakresowe, takie jak `@example-org/example-plugin`, muszą być
publikowane jako odpowiadający im właściciel `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw bezpośrednio przez publikację,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie danego zasobu. Użyj roszczenia,
gdy nie możesz zarządzać obecnym właścicielem albo gdy personel musi rozwiązać
spór.

## Dowody do dołączenia

Użyj publicznych, niewrażliwych dowodów. Pomocne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydania lub opiekunów
- oficjalną dokumentację projektu, która wskazuje przestrzeń nazw
- dowód domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omawiać
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne ogłoszenia o zmianie nazwy
- linki do spornego właściciela, Skills, pluginu, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, czego dowodzi każdy link. Personel powinien być w stanie zrozumieć
relację bez potrzeby używania prywatnych danych logowania lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani danych logowania
- tokenów wyzwania DNS
- prywatnych dokumentów prawnych lub umów
- osobistych dokumentów tożsamości
- prywatnych e-maili, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału z personelem.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka personel ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć lub objąć kwarantanną istniejący wpis,
dodać alias lub przekierowanie, poprosić o więcej dowodów albo odrzucić wniosek.

Weryfikacja przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona.
Personel bierze pod uwagę publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/pl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation)
- [Bezpieczeństwo](/pl/clawhub/security)
