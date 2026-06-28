---
read_when:
    - Zgłaszanie prawa do organizacji, marki, zakresu pakietu, identyfikatora właściciela, sluga umiejętności lub przestrzeni nazw pakietu
    - Rozwiązywanie przestrzeni nazw, która jest już zgłoszona lub zarezerwowana
    - Decydowanie, czy użyć zgłoszenia, odwołania czy roszczenia do przestrzeni nazw
sidebarTitle: Org and Namespace Claims
summary: Jak poprosić o weryfikację ClawHub w sporach dotyczących własności organizacji, marki, uchwytu właściciela, zakresu pakietu, slugu Skills lub przestrzeni nazw.
title: Roszczenia dotyczące organizacji i przestrzeni nazw
x-i18n:
    generated_at: "2026-06-28T07:41:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Roszczenia dotyczące organizacji i przestrzeni nazw

ClawHub używa identyfikatorów właścicieli, identyfikatorów organizacji, slugów Skills, nazw pakietów Plugin oraz
zakresów pakietów jako publicznych przestrzeni nazw. Jeśli przestrzeń nazw wygląda, jakby należała do
rzeczywistego projektu, marki, ekosystemu pakietów lub organizacji, ale jest już
zajęta, zarezerwowana, myląca albo sporna w ClawHub, poproś personel o jej sprawdzenie
za pomocą
[formularza zgłoszenia roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Użyj tej ścieżki do publicznej, niewrażliwej weryfikacji własności. Nie używaj zgłoszeń
w produkcie ani formularza odwołania dotyczącego konta do roszczeń związanych z przestrzenią nazw.

## Kiedy otworzyć roszczenie

Otwórz roszczenie dotyczące przestrzeni nazw, gdy uważasz, że personel ClawHub powinien sprawdzić, czy
przestrzeń nazw powinna zostać zarezerwowana, przeniesiona, przemianowana, ukryta, poddana kwarantannie, otrzymać alias
lub zostać w inny sposób zmieniona ze względu na rzeczywistą własność.

Przykłady obejmują:

- identyfikator organizacji zgodny z Twoją organizacją GitHub, projektem, firmą lub społecznością
- zakres pakietów, taki jak `@example-org/*`, który powinien publikować tylko w ramach
  odpowiadającego właściciela ClawHub
- slug Skills lub nazwa pakietu Plugin, które wydają się podszywać pod projekt
- spór dotyczący marki, znaku towarowego, zmiany nazwy projektu lub historii pakietu
- usunięty, nieaktywny lub nieosiągalny właściciel, który blokuje prawowitego właściciela
  przestrzeni nazw

Jeśli wpis jest niebezpieczny, złośliwy lub mylący w zakresie wykraczającym poza spór o własność,
postępuj także zgodnie z odpowiednimi wytycznymi dotyczącymi moderacji lub bezpieczeństwa. Formularz roszczenia dotyczącego przestrzeni nazw
służy do weryfikacji własności, a nie do pilnego ujawniania podatności.

## Przed złożeniem zgłoszenia

Najpierw potwierdź, że publikujesz jako właściciel odpowiadający przestrzeni nazw.
W przypadku pakietów Plugin nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być
publikowane jako odpowiadający im właściciel `example-org`.

Jeśli możesz zarządzać obecnym właścicielem, napraw przestrzeń nazw bezpośrednio przez opublikowanie,
przemianowanie, przeniesienie, ukrycie lub usunięcie zasobu, którego dotyczy problem. Użyj roszczenia,
gdy nie możesz zarządzać obecnym właścicielem albo gdy personel musi rozstrzygnąć
spór.

## Dowody do dołączenia

Użyj publicznych, niewrażliwych dowodów. Przydatne dowody obejmują:

- historię organizacji GitHub, repozytorium, wydań lub opiekunów
- oficjalną dokumentację projektu, która wskazuje przestrzeń nazw
- dowód domeny lub oficjalnej domeny e-mail
- kontrolę zakresu w npm, PyPI, crates.io lub innym rejestrze pakietów
- dowody własności znaku towarowego, marki lub projektu, które można bezpiecznie omawiać
  publicznie
- historię repozytorium źródłowego, historię pakietu lub publiczne powiadomienia o zmianie nazwy
- linki do spornego właściciela, Skills, Plugin, pakietu lub zgłoszenia w ClawHub

Wyjaśnij, co potwierdza każdy link. Personel powinien być w stanie zrozumieć
relację bez potrzeby używania prywatnych danych logowania lub sekretów.

## Czego nie dołączać

Nie umieszczaj sekretów ani prywatnych dowodów w publicznym zgłoszeniu GitHub. Nie dołączaj:

- tokenów API, kluczy podpisujących ani danych logowania
- tokenów wyzwań DNS
- prywatnych dokumentów prawnych lub umów
- osobistych dokumentów tożsamości
- prywatnych wiadomości e-mail, prywatnych raportów bezpieczeństwa ani poufnych danych klientów

Formularz roszczenia pyta, czy wrażliwe dowody wymagają prywatnego kanału z personelem.
Użyj tej opcji zamiast publikować materiały wrażliwe publicznie.

## Możliwe wyniki

W zależności od dowodów i ryzyka personel ClawHub może zarezerwować przestrzeń nazw,
przenieść własność, przemianować zasób, ukryć lub poddać kwarantannie istniejący wpis,
dodać alias lub przekierowanie, poprosić o więcej dowodów albo odrzucić prośbę.

Weryfikacja przestrzeni nazw nie gwarantuje, że każda zgodna nazwa zostanie przeniesiona.
Personel ocenia publiczne dowody, istniejące użycie, ryzyko bezpieczeństwa i wpływ na użytkowników.

## Powiązana dokumentacja

- [Publikowanie](/pl/clawhub/publishing)
- [Rozwiązywanie problemów](/pl/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation)
- [Bezpieczeństwo](/pl/clawhub/security)
