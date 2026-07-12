---
permalink: /security/formal-verification/
read_when:
    - Przegląd formalnych gwarancji lub ograniczeń modelu bezpieczeństwa
    - Odtwarzanie lub aktualizowanie kontroli modeli bezpieczeństwa TLA+/TLC
summary: Modele bezpieczeństwa weryfikowane maszynowo dla ścieżek OpenClaw o najwyższym poziomie ryzyka.
title: Weryfikacja formalna (modele bezpieczeństwa)
x-i18n:
    generated_at: "2026-07-12T15:37:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Formalne modele bezpieczeństwa OpenClaw (obecnie TLA+/TLC) dostarczają zweryfikowanego maszynowo uzasadnienia, że określone ścieżki najwyższego ryzyka — autoryzacja, izolacja sesji, kontrolowanie dostępu do narzędzi i bezpieczeństwo w przypadku błędnej konfiguracji — egzekwują zamierzone zasady przy jawnie określonych założeniach.

> Uwaga: niektóre starsze linki mogą odwoływać się do poprzedniej nazwy projektu.

## Czym to jest

Wykonywalny, ukierunkowany na działania atakującego zestaw testów regresji bezpieczeństwa:

- Każde twierdzenie ma uruchamialną weryfikację modelu w skończonej przestrzeni stanów.
- Wiele twierdzeń ma odpowiadający mu model negatywny, który generuje ślad kontrprzykładu dla realistycznej klasy błędów.

To **nie** jest dowód, że OpenClaw jest bezpieczny pod każdym względem, ani weryfikacja pełnej implementacji w TypeScript.

## Gdzie znajdują się modele

Modele są utrzymywane w osobnym repozytorium: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
To repozytorium jest obecnie niedostępne (w chwili pisania tego tekstu GitHub zwraca „Repository not found”). Jeśli nadal jest dla Ciebie niedostępne, zapytaj na kanałach opiekunów OpenClaw o jego aktualną lokalizację, zanim uznasz, że modele zostały usunięte.
</Note>

## Zastrzeżenia

- Są to modele, a nie pełna implementacja w TypeScript — możliwa jest rozbieżność między modelem a kodem.
- Wyniki są ograniczone przestrzenią stanów przeszukiwaną przez TLC. Wynik pozytywny nie oznacza bezpieczeństwa poza modelowanymi założeniami i granicami.
- Niektóre twierdzenia opierają się na jawnych założeniach dotyczących środowiska (na przykład poprawnym wdrożeniu i poprawnych danych wejściowych konfiguracji).

## Odtwarzanie wyników

Sklonuj repozytorium modeli i uruchom TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Wymagana jest Java 11+ (TLC działa na JVM).
# Repozytorium zawiera przypięty plik tla2tools.jar oraz udostępnia bin/tlc i cele Make.

make <target>
```

Nie ma jeszcze integracji CI z tym repozytorium; przyszła wersja mogłaby dodać modele uruchamiane w CI z publicznymi artefaktami (śladami kontrprzykładów, dziennikami uruchomień) albo hostowany przepływ pracy „uruchom ten model” dla niewielkich, ograniczonych weryfikacji.

## Twierdzenia i cele

### Ekspozycja Gateway i błędna konfiguracja otwartego Gateway

**Twierdzenie:** nasłuchiwanie poza interfejsem loopback bez uwierzytelniania może umożliwić zdalne przejęcie i zwiększa ekspozycję; zgodnie z założeniami modelu token lub hasło blokuje nieuwierzytelnionych atakujących.

| Wynik                | Cele                                                             |
| -------------------- | ---------------------------------------------------------------- |
| Pozytywny            | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Negatywny (oczekiwany) | `make gateway-exposure-v2-negative`                            |

Zobacz także `docs/gateway-exposure-matrix.md` w repozytorium modeli.

### Potok wykonywania Node (możliwość o najwyższym ryzyku)

**Twierdzenie:** `exec host=node` wymaga (a) listy dozwolonych poleceń Node wraz z zadeklarowanymi poleceniami oraz (b) zatwierdzenia na żywo, jeśli zostało skonfigurowane; w modelu zatwierdzenia są tokenizowane, aby zapobiec ich ponownemu użyciu.

| Wynik                  | Cele                                                            |
| ---------------------- | --------------------------------------------------------------- |
| Pozytywny              | `make nodes-pipeline`, `make approvals-token`                   |
| Negatywny (oczekiwany) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Magazyn parowania (kontrola wiadomości prywatnych)

**Twierdzenie:** żądania parowania przestrzegają TTL i limitów oczekujących żądań.

| Wynik                  | Cele                                                 |
| ---------------------- | ---------------------------------------------------- |
| Pozytywny              | `make pairing`, `make pairing-cap`                   |
| Negatywny (oczekiwany) | `make pairing-negative`, `make pairing-cap-negative` |

### Kontrola ruchu przychodzącego (wzmianki i omijanie za pomocą poleceń sterujących)

**Twierdzenie:** w kontekstach grupowych wymagających wzmianki nieautoryzowane polecenie sterujące nie może ominąć kontroli wzmianek.

| Wynik                  | Cele                           |
| ---------------------- | ------------------------------ |
| Pozytywny              | `make ingress-gating`          |
| Negatywny (oczekiwany) | `make ingress-gating-negative` |

### Izolacja routingu i kluczy sesji

**Twierdzenie:** wiadomości prywatne od różnych rozmówców nie są łączone w tę samą sesję, chyba że zostały jawnie powiązane lub odpowiednio skonfigurowane.

| Wynik                  | Cele                              |
| ---------------------- | --------------------------------- |
| Pozytywny              | `make routing-isolation`          |
| Negatywny (oczekiwany) | `make routing-isolation-negative` |

## Modele v1++: współbieżność, ponowienia i poprawność śladów

Kolejne modele, które zwiększają zgodność z rzeczywistymi trybami awarii: nieatomowymi aktualizacjami, ponowieniami i rozsyłaniem wiadomości.

### Współbieżność i idempotencja magazynu parowania

**Twierdzenie:** magazyn parowania egzekwuje `MaxPending` i idempotencję nawet przy przeplotach operacji — sprawdzenie, a następnie zapis muszą być atomowe lub chronione blokadą, a odświeżenie nie może tworzyć duplikatów. Konkretnie: współbieżne żądania nie mogą przekroczyć `MaxPending` dla kanału, a powtarzające się żądania lub odświeżenia dotyczące tej samej pary `(channel, sender)` nie tworzą zduplikowanych aktywnych oczekujących wierszy.

| Wynik                  | Cele                                                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pozytywny              | `make pairing-race` (atomowe lub chronione blokadą sprawdzanie limitu), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                       |
| Negatywny (oczekiwany) | `make pairing-race-negative` (nieatomowy wyścig limitu między rozpoczęciem a zatwierdzeniem), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Korelacja śladów i idempotencja ruchu przychodzącego

**Twierdzenie:** pozyskiwanie wiadomości zachowuje korelację śladów podczas rozsyłania i jest idempotentne przy ponowieniach po stronie dostawcy. Gdy jedno zdarzenie zewnętrzne staje się wieloma wiadomościami wewnętrznymi, każda część zachowuje tę samą tożsamość śladu lub zdarzenia; ponowienia nie powodują podwójnego przetwarzania; jeśli brakuje identyfikatorów zdarzeń dostawcy, deduplikacja korzysta z bezpiecznego klucza zastępczego (na przykład identyfikatora śladu), aby uniknąć odrzucenia odrębnych zdarzeń.

| Wynik                  | Cele                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Pozytywny              | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Negatywny (oczekiwany) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Pierwszeństwo `dmScope` w routingu i `identityLinks`

**Twierdzenie:** routing domyślnie utrzymuje izolację sesji wiadomości prywatnych i łączy sesje wyłącznie po jawnej konfiguracji, zgodnie z pierwszeństwem kanałów i powiązaniami tożsamości. Wartości `dmScope` właściwe dla kanału mają pierwszeństwo przed globalnymi wartościami domyślnymi; `identityLinks` łączą sesje wyłącznie w ramach jawnie powiązanych grup, a nie między niepowiązanymi rozmówcami.

| Wynik                  | Cele                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| Pozytywny              | `make routing-precedence`, `make routing-identitylinks`                   |
| Negatywny (oczekiwany) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Powiązane materiały

- [Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS)
- [Współtworzenie modelu zagrożeń](/pl/security/CONTRIBUTING-THREAT-MODEL)
- [Reagowanie na incydenty](/pl/security/incident-response)
