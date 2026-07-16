---
read_when:
    - Zajmowanie nazwy organizacji, marki, zakresu pakietów, identyfikatora właściciela, sluga umiejętności lub przestrzeni nazw pakietów
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Wybór między zgłoszeniem, odwołaniem a roszczeniem dotyczącym przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić ClawHub o rozpatrzenie sporów dotyczących własności organizacji, marki, identyfikatora właściciela, zakresu pakietu, sluga umiejętności lub przestrzeni nazw.
title: Roszczenia dotyczące organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-16T18:23:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa identyfikatorów właścicieli, identyfikatorów organizacji, slugów umiejętności, nazw pakietów pluginów i
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zastrzeżona, myląca lub sporna w ClawHub, należy poprosić zespół o jej sprawdzenie
za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji lub przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Ta ścieżka służy do publicznej, niewrażliwej weryfikacji własności. W przypadku roszczeń dotyczących przestrzeni nazw
nie należy używać zgłoszeń w produkcie
ani formularza odwołania dotyczącego konta.

## Kiedy zgłosić roszczenie

Roszczenie dotyczące przestrzeni nazw należy zgłosić, gdy zespół ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zastrzeżona, przeniesiona, przemianowana, ukryta, poddana kwarantannie, otrzymać alias
lub zostać zmieniona w inny sposób ze względu na własność w świecie rzeczywistym.

Przykłady:

- identyfikator organizacji odpowiadający organizacji GitHub, projektowi, firmie lub społeczności
- zakres pakietu, taki jak `@example-org/*`, z którego publikować powinien wyłącznie
  odpowiadający mu właściciel w ClawHub
- slug umiejętności lub nazwa pakietu pluginu, która wydaje się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub wprowadza w błąd w zakresie wykraczającym poza spór o własność,
należy również postępować zgodnie z odpowiednimi wytycznymi dotyczącymi moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do weryfikacji własności, a nie do pilnego ujawniania luk w zabezpieczeniach.

## Przed przesłaniem zgłoszenia

Najpierw należy potwierdzić, że publikacja odbywa się przy użyciu właściciela odpowiadającego przestrzeni nazw.
W przypadku pakietów pluginów nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane przez odpowiadającego im właściciela `example-org`.

Jeśli można zarządzać bieżącym właścicielem, należy poprawić przestrzeń nazw bezpośrednio poprzez opublikowanie,
przemianowanie, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Roszczenie należy zgłosić,
gdy nie można zarządzać bieżącym właścicielem lub gdy zespół musi rozstrzygnąć
spór.

## Dowody, które należy dołączyć

Należy używać publicznych, niewrażliwych dowodów. Pomocne materiały obejmują:

- historię organizacji GitHub, repozytorium, wydań lub opiekunów
- oficjalną dokumentację projektu wskazującą przestrzeń nazw
- dowód dotyczący domeny lub oficjalnej domeny poczty elektronicznej
- kontrolę nad zakresem w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody dotyczące własności znaku towarowego, marki lub projektu, które można bezpiecznie omówić
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne powiadomienia o zmianie nazwy
- łącza do spornego właściciela, umiejętności, pluginu, pakietu lub zgłoszenia w ClawHub

Należy wyjaśnić, czego dowodzi każde łącze. Zespół powinien móc zrozumieć
powiązanie bez dostępu do prywatnych danych uwierzytelniających ani sekretów.

## Czego nie dołączać

Nie należy umieszczać sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie należy dołączać:

- tokenów API, kluczy podpisujących ani danych uwierzytelniających
- tokenów wyzwania DNS
- prywatnych dokumentów prawnych ani umów
- dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia zawiera pytanie, czy poufne dowody wymagają prywatnego kanału kontaktu z zespołem.
Należy skorzystać z tej opcji zamiast publikować poufne materiały.

## Możliwe wyniki

W zależności od dowodów i ryzyka zespół ClawHub może zastrzec przestrzeń nazw,
przenieść własność, przemianować zasób, ukryć istniejący wpis lub poddać go kwarantannie,
dodać alias lub przekierowanie, poprosić o więcej dowodów albo odrzucić wniosek.

Weryfikacja przestrzeni nazw nie gwarantuje przeniesienia każdej pasującej nazwy.
Zespół bierze pod uwagę publiczne dowody, bieżące użycie, ryzyko dla bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
