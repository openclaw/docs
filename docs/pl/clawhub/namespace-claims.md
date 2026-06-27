---
read_when:
    - Zgłaszanie organizacji, marki, zakresu pakietów, uchwytu właściciela, sluga skill lub przestrzeni nazw pakietów
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o weryfikację ClawHub w sporach dotyczących własności organizacji, marki, uchwytu właściciela, zakresu pakietu, sluga umiejętności lub przestrzeni nazw.
title: Roszczenia dotyczące organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-06-27T17:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa identyfikatorów właścicieli, identyfikatorów organizacji, slugów Skills, nazw pakietów Pluginów i zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś zespół o jej sprawdzenie za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznego, niewrażliwego przeglądu własności. Nie używaj zgłoszeń w produkcie ani formularza odwołania dotyczącego konta do roszczeń dotyczących przestrzeni nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, powiązana aliasem lub w inny sposób zmieniona z powodu rzeczywistej własności.

Przykłady obejmują:

- identyfikator organizacji, który odpowiada Twojej organizacji, projektowi, firmie lub społeczności w GitHub
- zakres pakietów, taki jak `@example-org/*`, który powinien publikować wyłącznie pod odpowiadającym właścicielem ClawHub
- slug Skills lub nazwa pakietu Pluginu, która wydaje się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący w sposób wykraczający poza spór o własność, zastosuj również odpowiednie wytyczne dotyczące moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw służy do przeglądu własności, a nie do pilnego ujawniania podatności.

## Zanim zgłosisz

Najpierw potwierdź, że publikujesz jako właściciel odpowiadający przestrzeni nazw. W przypadku pakietów Pluginów nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być publikowane jako odpowiadający właściciel `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw bezpośrednio przez opublikowanie, zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia, gdy nie możesz zarządzać obecnym właścicielem albo gdy zespół musi rozstrzygnąć spór.

## Dowody do załączenia

Użyj publicznych, niewrażliwych dowodów. Przydatne potwierdzenia obejmują:

- historię organizacji, repozytorium, wydań lub opiekunów w GitHub
- oficjalną dokumentację projektu, która wskazuje przestrzeń nazw
- dowód domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omawiać publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne ogłoszenia o zmianie nazwy
- linki do spornego właściciela, Skills, Pluginu, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien móc zrozumieć relację bez potrzeby korzystania z prywatnych danych uwierzytelniających lub sekretów.

## Czego nie załączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie załączaj:

- tokenów API, kluczy podpisywania ani danych uwierzytelniających
- tokenów wyzwania DNS
- prywatnych dokumentów prawnych lub umów
- osobistych dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa lub poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału kontaktu z zespołem. Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw, przenieść własność, zmienić nazwę zasobu, ukryć lub poddać kwarantannie istniejący wpis, dodać alias albo przekierowanie, poprosić o więcej dowodów lub odrzucić prośbę.

Przegląd przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona. Zespół bierze pod uwagę publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/pl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation)
- [Bezpieczeństwo](/pl/clawhub/security)
