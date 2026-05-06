---
permalink: /security/formal-verification/
read_when:
    - Analizowanie formalnych gwarancji lub ograniczeń modelu bezpieczeństwa
    - Odtwarzanie lub aktualizowanie weryfikacji modelu bezpieczeństwa TLA+/TLC
summary: Maszynowo zweryfikowane modele bezpieczeństwa dla ścieżek OpenClaw o najwyższym ryzyku.
title: Weryfikacja formalna (modele bezpieczeństwa)
x-i18n:
    generated_at: "2026-05-06T09:29:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

Ta strona śledzi **formalne modele bezpieczeństwa** OpenClaw (obecnie TLA+/TLC; kolejne w razie potrzeby).

> Uwaga: niektóre starsze linki mogą odnosić się do poprzedniej nazwy projektu.

**Cel (gwiazda północna):** dostarczyć sprawdzony maszynowo argument, że OpenClaw egzekwuje swoją
zamierzoną politykę bezpieczeństwa (autoryzacja, izolacja sesji, bramkowanie narzędzi i
bezpieczeństwo przy błędnej konfiguracji), przy jawnych założeniach.

**Czym to jest (obecnie):** wykonywalny, sterowany przez atakującego **zestaw regresyjny bezpieczeństwa**:

- Każde twierdzenie ma uruchamialne sprawdzenie modelu w skończonej przestrzeni stanów.
- Wiele twierdzeń ma sparowany **model negatywny**, który generuje ślad kontrprzykładu dla realistycznej klasy błędów.

**Czym to nie jest (jeszcze):** dowód, że „OpenClaw jest bezpieczny pod każdym względem” albo że pełna implementacja TypeScript jest poprawna.

## Gdzie znajdują się modele

Modele są utrzymywane w osobnym repozytorium: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Ważne zastrzeżenia

- To są **modele**, a nie pełna implementacja TypeScript. Możliwy jest rozdźwięk między modelem a kodem.
- Wyniki są ograniczone przestrzenią stanów eksplorowaną przez TLC; „zielony” wynik nie oznacza bezpieczeństwa poza modelowanymi założeniami i ograniczeniami.
- Niektóre twierdzenia opierają się na jawnych założeniach środowiskowych (np. poprawne wdrożenie, poprawne dane wejściowe konfiguracji).

## Odtwarzanie wyników

Obecnie wyniki odtwarza się przez lokalne sklonowanie repozytorium modeli i uruchomienie TLC (zobacz poniżej). Przyszła iteracja mogłaby oferować:

- modele uruchamiane w CI z publicznymi artefaktami (ślady kontrprzykładów, logi uruchomień)
- hostowany przepływ „uruchom ten model” dla małych, ograniczonych sprawdzeń

Pierwsze kroki:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Wymagane Java 11+ (TLC działa na JVM).
# Repozytorium zawiera dostarczony, przypięty `tla2tools.jar` (narzędzia TLA+) oraz udostępnia `bin/tlc` + cele Make.

make <target>
```

### Ekspozycja Gateway i błędna konfiguracja otwartego Gateway

**Twierdzenie:** wiązanie poza loopback bez uwierzytelniania może umożliwić zdalne przejęcie / zwiększa ekspozycję; token/hasło blokuje nieuwierzytelnionych atakujących (zgodnie z założeniami modelu).

- Zielone uruchomienia:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Czerwone (oczekiwane):
  - `make gateway-exposure-v2-negative`

Zobacz też: `docs/gateway-exposure-matrix.md` w repozytorium modeli.

### Potok exec Node (funkcja najwyższego ryzyka)

**Twierdzenie:** `exec host=node` wymaga (a) listy dozwolonych poleceń Node oraz zadeklarowanych poleceń i (b) zatwierdzenia na żywo, gdy jest skonfigurowane; zatwierdzenia są tokenizowane, aby zapobiec powtórnemu użyciu (w modelu).

- Zielone uruchomienia:
  - `make nodes-pipeline`
  - `make approvals-token`
- Czerwone (oczekiwane):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Magazyn parowania (bramkowanie DM)

**Twierdzenie:** żądania parowania respektują TTL i limity oczekujących żądań.

- Zielone uruchomienia:
  - `make pairing`
  - `make pairing-cap`
- Czerwone (oczekiwane):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Bramkowanie wejścia (wzmianki + obejście polecenia kontrolnego)

**Twierdzenie:** w kontekstach grupowych wymagających wzmianki nieautoryzowane „polecenie kontrolne” nie może ominąć bramkowania wzmianek.

- Zielone:
  - `make ingress-gating`
- Czerwone (oczekiwane):
  - `make ingress-gating-negative`

### Izolacja routingu/klucza sesji

**Twierdzenie:** DM od różnych nadawców nie są łączone w tę samą sesję, chyba że są jawnie powiązane/skonfigurowane.

- Zielone:
  - `make routing-isolation`
- Czerwone (oczekiwane):
  - `make routing-isolation-negative`

## v1++: dodatkowe modele ograniczone (współbieżność, ponowienia, poprawność śladu)

To są modele uzupełniające, które zwiększają wierność wobec rzeczywistych trybów awarii (nieatomowe aktualizacje, ponowienia i rozsyłanie wiadomości).

### Współbieżność / idempotencja magazynu parowania

**Twierdzenie:** magazyn parowania powinien egzekwować `MaxPending` i idempotencję nawet przy przeplotach (tj. „sprawdź, potem zapisz” musi być atomowe / zablokowane; odświeżenie nie powinno tworzyć duplikatów).

Co to oznacza:

- Przy współbieżnych żądaniach nie można przekroczyć `MaxPending` dla kanału.
- Powtarzane żądania/odświeżenia dla tego samego `(channel, sender)` nie powinny tworzyć zduplikowanych aktywnych wierszy oczekujących.

- Zielone uruchomienia:
  - `make pairing-race` (atomowe/zablokowane sprawdzenie limitu)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Czerwone (oczekiwane):
  - `make pairing-race-negative` (nieatomowy wyścig limitu begin/commit)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Korelacja śladu / idempotencja wejścia

**Twierdzenie:** przyjmowanie zdarzeń powinno zachowywać korelację śladu podczas rozsyłania i być idempotentne przy ponowieniach dostawcy.

Co to oznacza:

- Gdy jedno zdarzenie zewnętrzne staje się wieloma wiadomościami wewnętrznymi, każda część zachowuje tę samą tożsamość śladu/zdarzenia.
- Ponowienia nie skutkują podwójnym przetwarzaniem.
- Jeśli brakuje identyfikatorów zdarzeń dostawcy, deduplikacja wraca do bezpiecznego klucza (np. identyfikatora śladu), aby uniknąć odrzucania odrębnych zdarzeń.

- Zielone:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Czerwone (oczekiwane):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Pierwszeństwo dmScope routingu + identityLinks

**Twierdzenie:** routing musi domyślnie izolować sesje DM i łączyć sesje tylko wtedy, gdy zostało to jawnie skonfigurowane (pierwszeństwo kanału + linki tożsamości).

Co to oznacza:

- Nadpisania dmScope specyficzne dla kanału muszą mieć pierwszeństwo przed globalnymi wartościami domyślnymi.
- identityLinks powinny łączyć tylko w ramach jawnie powiązanych grup, a nie między niepowiązanymi nadawcami.

- Zielone:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Czerwone (oczekiwane):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Powiązane

- [Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS)
- [Współtworzenie modelu zagrożeń](/pl/security/CONTRIBUTING-THREAT-MODEL)
