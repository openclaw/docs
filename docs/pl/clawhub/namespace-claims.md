---
read_when:
    - Zgłaszanie prawa do organizacji, marki, zakresu pakietów, nazwy właściciela, sluga umiejętności lub przestrzeni nazw pakietów
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Podejmowanie decyzji, czy użyć zgłoszenia, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić ClawHub o weryfikację sporów dotyczących własności org, marki, owner-handle, package-scope, skill-slug lub przestrzeni nazw.
title: Oświadczenia organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-04T20:43:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa uchwytów właścicieli, uchwytów organizacji, slugów skill, nazw pakietów pluginów oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś zespół o jej sprawdzenie
za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznej, niewrażliwej weryfikacji własności. Nie używaj zgłoszeń
w produkcie ani formularza odwołania dotyczącego konta do roszczeń dotyczących przestrzeni nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, otrzymać alias
lub zostać w inny sposób zmieniona z powodu rzeczywistej własności.

Przykłady obejmują:

- uchwyt organizacji, który odpowiada Twojej organizacji GitHub, projektowi, firmie lub społeczności
- zakres pakietów, taki jak `@example-org/*`, który powinien publikować tylko w ramach
  odpowiadającego mu właściciela ClawHub
- slug skill lub nazwa pakietu pluginu, które wydają się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący w zakresie wykraczającym poza spór o własność,
postępuj również zgodnie z odpowiednimi wskazówkami dotyczącymi moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do weryfikacji własności, a nie do awaryjnego ujawniania podatności.

## Przed zgłoszeniem

Najpierw potwierdź, że publikujesz jako właściciel odpowiadający przestrzeni nazw.
W przypadku pakietów pluginów nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane jako odpowiadający im właściciel `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw bezpośrednio przez opublikowanie,
zmianę nazwy, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia,
gdy nie możesz zarządzać obecnym właścicielem albo gdy zespół musi rozstrzygnąć
spór.

## Dowody do dołączenia

Użyj publicznych, niewrażliwych dowodów. Pomocne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydań lub opiekunów
- oficjalną dokumentację projektu, która wskazuje daną przestrzeń nazw
- dowód dotyczący domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omawiać
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne powiadomienia o zmianie nazwy
- linki do spornego właściciela, skill, pluginu, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, co potwierdza każdy link. Zespół powinien być w stanie zrozumieć
relację bez potrzeby używania prywatnych danych uwierzytelniających lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani danych uwierzytelniających
- tokenów wyzwań DNS
- prywatnych dokumentów prawnych ani umów
- osobistych dokumentów tożsamości
- prywatnych e-maili, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału dla zespołu.
Użyj tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, zmienić nazwę zasobu, ukryć istniejący wpis lub poddać go kwarantannie,
dodać alias albo przekierowanie, poprosić o więcej dowodów lub odrzucić prośbę.

Weryfikacja przestrzeni nazw nie gwarantuje, że każda pasująca nazwa zostanie przeniesiona.
Zespół waży publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
