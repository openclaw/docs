---
permalink: /security/formal-verification/
read_when:
    - Przegląd gwarancji lub ograniczeń formalnego modelu bezpieczeństwa
    - Odtwarzanie lub aktualizowanie sprawdzeń modelu bezpieczeństwa TLA+/TLC
summary: Weryfikowane maszynowo modele bezpieczeństwa dla ścieżek OpenClaw o najwyższym ryzyku.
title: Weryfikacja formalna (modele bezpieczeństwa)
x-i18n:
    generated_at: "2026-04-05T14:06:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# Weryfikacja formalna (modele bezpieczeństwa)

Ta strona śledzi **formalne modele bezpieczeństwa** OpenClaw (obecnie TLA+/TLC; w razie potrzeby więcej).

> Uwaga: niektóre starsze linki mogą odnosić się do poprzedniej nazwy projektu.

**Cel (punkt docelowy):** dostarczyć sprawdzany maszynowo argument, że OpenClaw egzekwuje swoją
zamierzoną politykę bezpieczeństwa (autoryzacja, izolacja sesji, bramkowanie narzędzi oraz
bezpieczeństwo konfiguracji błędnej), przy jawnie określonych założeniach.

**Czym to jest (obecnie):** wykonywalny, sterowany przez atakującego **pakiet regresji bezpieczeństwa**:

- Każde twierdzenie ma wykonywalne sprawdzenie modelu na skończonej przestrzeni stanów.
- Wiele twierdzeń ma sparowany **model negatywny**, który generuje ślad kontrprzykładu dla realistycznej klasy błędów.

**Czym to jeszcze nie jest:** dowodem, że „OpenClaw jest bezpieczny pod każdym względem” ani że pełna implementacja TypeScript jest poprawna.

## Gdzie znajdują się modele

Modele są utrzymywane w osobnym repozytorium: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Ważne zastrzeżenia

- To są **modele**, a nie pełna implementacja TypeScript. Możliwy jest dryf między modelem a kodem.
- Wyniki są ograniczone przez przestrzeń stanów badaną przez TLC; „zielony” nie oznacza bezpieczeństwa poza modelowanymi założeniami i ograniczeniami.
- Niektóre twierdzenia opierają się na jawnych założeniach środowiskowych (na przykład poprawnym wdrożeniu, poprawnych danych wejściowych konfiguracji).

## Odtwarzanie wyników

Obecnie wyniki odtwarza się przez lokalne sklonowanie repozytorium modeli i uruchomienie TLC (patrz niżej). Przyszła iteracja mogłaby oferować:

- modele uruchamiane w CI z publicznymi artefaktami (ślady kontrprzykładów, logi uruchomień)
- hostowany przepływ pracy „uruchom ten model” dla małych, ograniczonych sprawdzeń

Pierwsze kroki:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Wymagane Java 11+ (TLC działa na JVM).
# Repozytorium dostarcza przypięty `tla2tools.jar` (narzędzia TLA+) oraz `bin/tlc` + cele Make.

make <target>
```

### Ekspozycja Gateway i błędna konfiguracja otwartego Gateway

**Twierdzenie:** wiązanie poza loopback bez uwierzytelniania może umożliwić zdalne przejęcie / zwiększa powierzchnię ekspozycji; token/hasło blokuje nieuwierzytelnionych atakujących (zgodnie z założeniami modelu).

- Zielone uruchomienia:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Czerwone (oczekiwane):
  - `make gateway-exposure-v2-negative`

Zobacz także: `docs/gateway-exposure-matrix.md` w repozytorium modeli.

### Potok wykonania węzła (możliwość o najwyższym ryzyku)

**Twierdzenie:** `exec host=node` wymaga (a) allowlist poleceń węzła plus zadeklarowanych poleceń oraz (b) zatwierdzenia na żywo, gdy jest skonfigurowane; zatwierdzenia są tokenizowane, aby zapobiegać odtwarzaniu (w modelu).

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

### Bramkowanie ruchu przychodzącego (wzmianki + obejście poleceń sterujących)

**Twierdzenie:** w kontekstach grupowych wymagających wzmianki nieautoryzowane „polecenie sterujące” nie może ominąć bramkowania wzmianką.

- Zielone:
  - `make ingress-gating`
- Czerwone (oczekiwane):
  - `make ingress-gating-negative`

### Trasowanie/izolacja kluczy sesji

**Twierdzenie:** wiadomości DM od różnych nadawców nie zapadają się do tej samej sesji, chyba że zostały jawnie połączone/skonfigurowane.

- Zielone:
  - `make routing-isolation`
- Czerwone (oczekiwane):
  - `make routing-isolation-negative`

## v1++: dodatkowe ograniczone modele (współbieżność, ponowienia, poprawność śladów)

To kolejne modele, które zwiększają wierność względem rzeczywistych trybów awarii (nieatomowe aktualizacje, ponowienia i rozsyłanie wiadomości).

### Współbieżność / idempotencja magazynu parowania

**Twierdzenie:** magazyn parowania powinien egzekwować `MaxPending` i idempotencję nawet przy przeplotach (to znaczy „sprawdź, a potem zapisz” musi być atomowe / zablokowane; odświeżanie nie powinno tworzyć duplikatów).

Co to oznacza:

- Przy współbieżnych żądaniach nie można przekroczyć `MaxPending` dla kanału.
- Powtarzane żądania/odświeżenia dla tego samego `(channel, sender)` nie powinny tworzyć zduplikowanych aktywnych oczekujących wierszy.

- Zielone uruchomienia:
  - `make pairing-race` (atomowe/zablokowane sprawdzenie limitu)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Czerwone (oczekiwane):
  - `make pairing-race-negative` (nieatomowy wyścig begin/commit przy sprawdzaniu limitu)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Korelacja śladów / idempotencja ruchu przychodzącego

**Twierdzenie:** przetwarzanie przychodzące powinno zachowywać korelację śladów przy rozsyłaniu i być idempotentne przy ponowieniach dostawcy.

Co to oznacza:

- Gdy jedno zdarzenie zewnętrzne staje się wieloma wiadomościami wewnętrznymi, każda część zachowuje tę samą tożsamość śladu/zdarzenia.
- Ponowienia nie prowadzą do podwójnego przetwarzania.
- Jeśli brakuje identyfikatorów zdarzeń dostawcy, deduplikacja wraca do bezpiecznego klucza (na przykład identyfikatora śladu), aby nie odrzucać różnych zdarzeń.

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

### Priorytet dmScope w trasowaniu + identityLinks

**Twierdzenie:** trasowanie musi domyślnie utrzymywać izolację sesji DM i zwijać sesje tylko wtedy, gdy zostało to jawnie skonfigurowane (priorytet kanału + identity links).

Co to oznacza:

- Nadpisania `dmScope` specyficzne dla kanału muszą mieć pierwszeństwo przed globalnymi ustawieniami domyślnymi.
- identityLinks powinny zwijać tylko w ramach jawnie połączonych grup, a nie między niepowiązanymi nadawcami.

- Zielone:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Czerwone (oczekiwane):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
