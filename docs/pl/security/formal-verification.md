---
permalink: /security/formal-verification/
read_when:
    - Przegląd gwarancji lub ograniczeń formalnego modelu bezpieczeństwa
    - Odtwarzanie lub aktualizowanie kontroli modelu bezpieczeństwa TLA+/TLC
summary: Modele bezpieczeństwa weryfikowane maszynowo dla ścieżek o najwyższym ryzyku w OpenClaw.
title: Weryfikacja formalna (modele bezpieczeństwa)
x-i18n:
    generated_at: "2026-04-24T09:33:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

Ta strona śledzi **formalne modele bezpieczeństwa** OpenClaw (**TLA+/TLC** obecnie; w razie potrzeby także inne).

> Uwaga: niektóre starsze linki mogą odnosić się do poprzedniej nazwy projektu.

**Cel (docelowy kierunek):** dostarczyć argument weryfikowany maszynowo, że OpenClaw egzekwuje
zamierzoną politykę bezpieczeństwa (autoryzację, izolację sesji, bramkowanie narzędzi oraz
bezpieczeństwo konfiguracji przy błędnej konfiguracji), przy jawnie określonych założeniach.

**Czym to jest (obecnie):** wykonywalny, sterowany przez atakującego **zestaw regresyjny bezpieczeństwa**:

- Każde twierdzenie ma uruchamialną kontrolę modelu na skończonej przestrzeni stanów.
- Wiele twierdzeń ma sparowany **model negatywny**, który generuje ślad kontrprzykładu dla realistycznej klasy błędów.

**Czym to nie jest (jeszcze):** dowodem, że „OpenClaw jest bezpieczny pod każdym względem” ani że pełna implementacja TypeScript jest poprawna.

## Gdzie znajdują się modele

Modele są utrzymywane w osobnym repozytorium: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Ważne zastrzeżenia

- To są **modele**, a nie pełna implementacja TypeScript. Możliwy jest rozjazd między modelem a kodem.
- Wyniki są ograniczone do przestrzeni stanów zbadanej przez TLC; „zielony” wynik nie oznacza bezpieczeństwa poza zamodelowanymi założeniami i ograniczeniami.
- Niektóre twierdzenia opierają się na jawnych założeniach środowiskowych (np. poprawne wdrożenie, poprawne dane wejściowe konfiguracji).

## Odtwarzanie wyników

Obecnie wyniki odtwarza się przez lokalne sklonowanie repozytorium modeli i uruchomienie TLC (patrz niżej). Przyszła iteracja mogłaby oferować:

- modele uruchamiane w CI z publicznymi artefaktami (ślady kontrprzykładów, logi uruchomień)
- hostowany przepływ pracy „uruchom ten model” dla małych, ograniczonych kontroli

Pierwsze kroki:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Wymagana Java 11+ (TLC działa na JVM).
# Repozytorium dostarcza przypięty `tla2tools.jar` (narzędzia TLA+) oraz `bin/tlc` + cele Make.

make <target>
```

### Ekspozycja Gateway i błędna konfiguracja otwartego Gateway

**Twierdzenie:** powiązanie poza local loopback bez uwierzytelniania może umożliwić zdalne przejęcie / zwiększa ekspozycję; token/hasło blokuje nieuwierzytelnionych atakujących (zgodnie z założeniami modelu).

- Zielone uruchomienia:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Czerwone (oczekiwane):
  - `make gateway-exposure-v2-negative`

Zobacz też: `docs/gateway-exposure-matrix.md` w repozytorium modeli.

### Potok exec Node (możliwość o najwyższym ryzyku)

**Twierdzenie:** `exec host=node` wymaga (a) listy dozwolonych poleceń node oraz zadeklarowanych poleceń i (b) aktywnej akceptacji, gdy jest skonfigurowana; akceptacje są tokenizowane, aby zapobiec powtórnemu użyciu (w modelu).

- Zielone uruchomienia:
  - `make nodes-pipeline`
  - `make approvals-token`
- Czerwone (oczekiwane):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Magazyn parowania (bramkowanie DM)

**Twierdzenie:** żądania parowania przestrzegają TTL i limitów oczekujących żądań.

- Zielone uruchomienia:
  - `make pairing`
  - `make pairing-cap`
- Czerwone (oczekiwane):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Bramka wejściowa (wzmianki + obejście poleceniem sterującym)

**Twierdzenie:** w kontekstach grupowych wymagających wzmianki nieautoryzowane „polecenie sterujące” nie może ominąć bramkowania wzmianką.

- Zielone:
  - `make ingress-gating`
- Czerwone (oczekiwane):
  - `make ingress-gating-negative`

### Izolacja routingu/klucza sesji

**Twierdzenie:** wiadomości DM od różnych peerów nie zapadają się do tej samej sesji, chyba że zostały jawnie połączone/skonfigurowane.

- Zielone:
  - `make routing-isolation`
- Czerwone (oczekiwane):
  - `make routing-isolation-negative`

## v1++: dodatkowe modele ograniczone (współbieżność, ponowienia, poprawność śladów)

Są to kolejne modele, które zwiększają zgodność z rzeczywistymi trybami awarii (nieatomowe aktualizacje, ponowienia i rozsyłanie wiadomości).

### Współbieżność / idempotencja magazynu parowania

**Twierdzenie:** magazyn parowania powinien egzekwować `MaxPending` i idempotencję nawet przy przeplotach wykonania (tzn. „sprawdź, a potem zapisz” musi być atomowe / blokowane; odświeżenie nie powinno tworzyć duplikatów).

Co to oznacza:

- Przy współbieżnych żądaniach nie można przekroczyć `MaxPending` dla kanału.
- Powtarzane żądania/odświeżenia dla tego samego `(channel, sender)` nie powinny tworzyć zduplikowanych aktywnych wierszy oczekujących.

- Zielone uruchomienia:
  - `make pairing-race` (atomowa/blokowana kontrola limitu)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Czerwone (oczekiwane):
  - `make pairing-race-negative` (nieatomowy wyścig limitu begin/commit)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Korelacja śladów wejściowych / idempotencja

**Twierdzenie:** przetwarzanie wejścia powinno zachowywać korelację śladów przy rozsyłaniu oraz być idempotentne przy ponowieniach po stronie dostawcy.

Co to oznacza:

- Gdy jedno zdarzenie zewnętrzne staje się wieloma wiadomościami wewnętrznymi, każda część zachowuje tę samą tożsamość śladu/zdarzenia.
- Ponowienia nie powodują podwójnego przetwarzania.
- Jeśli brakuje identyfikatorów zdarzeń dostawcy, deduplikacja przechodzi na bezpieczny klucz zapasowy (np. identyfikator śladu), aby uniknąć odrzucania odrębnych zdarzeń.

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

### Priorytet dmScope routingu + identityLinks

**Twierdzenie:** routing musi domyślnie utrzymywać izolację sesji DM i zapadać sesje tylko wtedy, gdy jest to jawnie skonfigurowane (priorytet kanału + identityLinks).

Co to oznacza:

- Nadpisania dmScope specyficzne dla kanału muszą mieć pierwszeństwo przed globalnymi ustawieniami domyślnymi.
- identityLinks powinny zapadać sesje tylko w obrębie jawnie połączonych grup, a nie między niepowiązanymi peerami.

- Zielone:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Czerwone (oczekiwane):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Powiązane

- [Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS)
- [Współtworzenie modelu zagrożeń](/pl/security/CONTRIBUTING-THREAT-MODEL)
