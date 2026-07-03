---
read_when:
    - Zgłaszanie organizacji, marki, zakresu pakietu, identyfikatora właściciela, sluga umiejętności lub przestrzeni nazw pakietu
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić ClawHub o przegląd sporów dotyczących własności organizacji, marki, uchwytu właściciela, zakresu pakietu, sluga Skills lub przestrzeni nazw.
title: Roszczenia dotyczące organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-03T02:57:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa uchwytów właścicieli, uchwytów organizacji, slugów Skills, nazw pakietów Plugin oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś zespół o jej sprawdzenie
za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznej, niewrażliwej weryfikacji własności. Nie używaj raportów
w produkcie ani formularza odwołania dotyczącego konta do roszczeń dotyczących przestrzeni nazw.

## Kiedy Otworzyć Roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, objęta aliasem
lub w inny sposób zmieniona ze względu na rzeczywistą własność.

Przykłady obejmują:

- uchwyt organizacji, który odpowiada Twojej organizacji GitHub, projektowi, firmie lub społeczności
- zakres pakietów, taki jak `@example-org/*`, który powinien publikować wyłącznie pod
  odpowiadającym mu właścicielem ClawHub
- slug Skills lub nazwa pakietu Plugin, która wydaje się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli listing jest niebezpieczny, złośliwy lub mylący w stopniu wykraczającym poza spór o własność,
zastosuj także odpowiednie wskazówki dotyczące moderacji lub bezpieczeństwa. Formularz roszczenia
dotyczącego przestrzeni nazw służy do weryfikacji własności, a nie do pilnego ujawniania podatności.

## Przed Zgłoszeniem

Najpierw potwierdź, że publikujesz jako właściciel odpowiadający przestrzeni nazw.
W przypadku pakietów Plugin nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane jako odpowiadający właściciel `example-org`.

Jeśli możesz zarządzać bieżącym właścicielem, napraw przestrzeń nazw bezpośrednio przez publikację,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia,
gdy nie możesz zarządzać bieżącym właścicielem albo gdy zespół musi rozstrzygnąć
spór.

## Dowody do Dołączenia

Użyj publicznych, niewrażliwych dowodów. Pomocne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydań lub maintainerów
- oficjalną dokumentację projektu, która wskazuje przestrzeń nazw
- dowód dotyczący domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omawiać
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne ogłoszenia o zmianie nazwy
- linki do spornego właściciela, Skills, Plugin, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien móc zrozumieć
relację bez potrzeby używania prywatnych poświadczeń lub sekretów.

## Czego Nie Dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani poświadczeń
- tokenów wyzwania DNS
- prywatnych dokumentów prawnych lub umów
- dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału dla zespołu.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe Wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć lub poddać kwarantannie istniejący listing,
dodać alias lub przekierowanie, poprosić o więcej dowodów albo odrzucić prośbę.

Weryfikacja przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona.
Zespół ocenia publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana Dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i Bezpieczeństwo Konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
