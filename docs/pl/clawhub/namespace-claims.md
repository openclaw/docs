---
read_when:
    - Zajmowanie nazwy organizacji, marki, zakresu pakietów, identyfikatora właściciela, identyfikatora umiejętności lub przestrzeni nazw pakietów
    - Rozwiązywanie przestrzeni nazw, która jest już zajęta lub zarezerwowana
    - Podejmowanie decyzji, czy użyć zgłoszenia, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić ClawHub o rozpatrzenie sporów dotyczących własności organizacji, marki, identyfikatora właściciela, zakresu pakietu, identyfikatora umiejętności lub przestrzeni nazw.
title: Roszczenia do organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-07-12T14:52:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa identyfikatorów właścicieli i organizacji, slugów Skills, nazw pakietów Pluginów oraz zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wydaje się należeć do rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już zajęta, zastrzeżona, myląca albo sporna w ClawHub, poproś personel o jej weryfikację za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznego przeglądu własności, który nie obejmuje informacji wrażliwych. Nie używaj zgłoszeń w produkcie ani formularza odwołania dotyczącego konta do zgłaszania roszczeń do przestrzeni nazw.

## Kiedy zgłosić roszczenie

Zgłoś roszczenie do przestrzeni nazw, jeśli uważasz, że personel ClawHub powinien sprawdzić, czy ze względu na rzeczywiste prawa własności przestrzeń nazw powinna zostać zastrzeżona, przeniesiona, przemianowana, ukryta, objęta kwarantanną, otrzymać alias lub zostać zmieniona w inny sposób.

Przykłady:

- identyfikator organizacji zgodny z Twoją organizacją GitHub, projektem, firmą lub społecznością
- zakres pakietów, taki jak `@example-org/*`, w którym publikować powinien wyłącznie odpowiadający mu właściciel ClawHub
- slug Skills lub nazwa pakietu Pluginu, które wydają się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub wprowadza w błąd w zakresie wykraczającym poza spór dotyczący własności, postępuj również zgodnie z odpowiednimi wytycznymi dotyczącymi moderacji lub bezpieczeństwa. Formularz roszczenia do przestrzeni nazw służy do weryfikacji własności, a nie do pilnego zgłaszania luk w zabezpieczeniach.

## Przed wysłaniem zgłoszenia

Najpierw upewnij się, że publikujesz jako właściciel odpowiadający przestrzeni nazw. W przypadku pakietów Pluginów nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być publikowane przez odpowiadającego im właściciela `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, popraw przestrzeń nazw bezpośrednio przez opublikowanie, przemianowanie, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Zgłoś roszczenie, jeśli nie możesz zarządzać obecnym właścicielem lub gdy personel musi rozstrzygnąć spór.

## Dowody, które należy dołączyć

Używaj publicznych dowodów, które nie zawierają informacji wrażliwych. Pomocne dowody obejmują:

- historię organizacji, repozytorium, wydań lub opiekunów w GitHub
- oficjalną dokumentację projektu, która wskazuje przestrzeń nazw
- dowód własności domeny lub oficjalnej domeny poczty elektronicznej
- kontrolę nad zakresem w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omawiać publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne powiadomienia o zmianie nazwy
- odnośniki do spornego właściciela, Skills, Pluginu, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, czego dowodzi każdy odnośnik. Personel powinien móc zrozumieć powiązanie bez dostępu do prywatnych danych uwierzytelniających lub sekretów.

## Czego nie należy dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani danych uwierzytelniających
- tokenów wyzwania DNS
- prywatnych dokumentów prawnych ani umów
- dokumentów potwierdzających tożsamość
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia zawiera pytanie, czy wrażliwe dowody wymagają prywatnego kanału kontaktu z personelem. Skorzystaj z tej opcji zamiast publikować wrażliwe materiały publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka personel ClawHub może zastrzec przestrzeń nazw, przenieść własność, zmienić nazwę zasobu, ukryć istniejący wpis lub objąć go kwarantanną, dodać alias albo przekierowanie, poprosić o dodatkowe dowody bądź odrzucić wniosek.

Weryfikacja przestrzeni nazw nie gwarantuje przeniesienia każdej pasującej nazwy. Personel bierze pod uwagę publiczne dowody, dotychczasowe wykorzystanie, ryzyko związane z bezpieczeństwem oraz wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/clawhub/moderation)
- [Bezpieczeństwo](/clawhub/security)
