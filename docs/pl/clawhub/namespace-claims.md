---
read_when:
    - Rezerwowanie organizacji, marki, zakresu pakietu, uchwytu właściciela, sluga Skills lub przestrzeni nazw pakietu
    - Rozwiązywanie problemu z przestrzenią nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć raportu, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o weryfikację ClawHub w przypadku sporów o własność organizacji, marki, identyfikatora właściciela, zakresu pakietu, sluga umiejętności lub przestrzeni nazw.
title: Zgłoszenia praw do organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-03T01:04:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa identyfikatorów właścicieli, identyfikatorów organizacji, slugów Skills, nazw pakietów Plugin oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś zespół o jej sprawdzenie za pomocą
[formularza zgłoszenia roszczenia do organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznej, niewrażliwej weryfikacji własności. Nie używaj raportów w produkcie
ani formularza odwołania dotyczącego konta do roszczeń o przestrzeń nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, otrzymać alias
lub zostać w inny sposób zmieniona z powodu rzeczywistej własności.

Przykłady obejmują:

- identyfikator organizacji, który odpowiada Twojej organizacji GitHub, projektowi, firmie lub społeczności
- zakres pakietu, taki jak `@example-org/*`, który powinien publikować tylko pod
  odpowiadającym mu właścicielem ClawHub
- slug Skills lub nazwa pakietu Plugin, które wyglądają na podszywanie się pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny albo nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący w zakresie wykraczającym poza spór o własność,
zastosuj także odpowiednie wskazówki dotyczące moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do weryfikacji własności, a nie do awaryjnego ujawniania podatności.

## Zanim zgłosisz

Najpierw potwierdź, że publikujesz jako właściciel odpowiadający przestrzeni nazw.
W przypadku pakietów Plugin nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane jako odpowiadający im właściciel `example-org`.

Jeśli możesz zarządzać bieżącym właścicielem, napraw przestrzeń nazw bezpośrednio przez opublikowanie,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia,
gdy nie możesz zarządzać bieżącym właścicielem albo gdy zespół musi rozstrzygnąć
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
- linki do spornego właściciela, Skills, Plugin, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien móc zrozumieć
relację bez potrzeby dostępu do prywatnych poświadczeń lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy do podpisywania ani poświadczeń
- tokenów wyzwania DNS
- prywatnych plików prawnych lub umów
- osobistych dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału kontaktu z zespołem.
Użyj tej opcji zamiast publicznego publikowania wrażliwych materiałów.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć lub poddać kwarantannie istniejący wpis,
dodać alias albo przekierowanie, poprosić o więcej dowodów lub odrzucić wniosek.

Weryfikacja przestrzeni nazw nie gwarantuje przeniesienia każdej pasującej nazwy.
Zespół waży publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
