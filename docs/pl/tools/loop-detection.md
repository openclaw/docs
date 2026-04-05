---
read_when:
    - Użytkownik zgłasza, że agenci utknęli, powtarzając wywołania narzędzi
    - Musisz dostroić ochronę przed powtarzającymi się wywołaniami
    - Edytujesz zasady narzędzi/runtime agenta
summary: Jak włączyć i dostroić guardraile wykrywające powtarzające się pętle wywołań narzędzi
title: Wykrywanie pętli narzędzi
x-i18n:
    generated_at: "2026-04-05T14:08:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# Wykrywanie pętli narzędzi

OpenClaw może chronić agentów przed utknięciem w powtarzających się wzorcach wywołań narzędzi.
Ta ochrona jest **domyślnie wyłączona**.

Włączaj ją tylko tam, gdzie jest potrzebna, ponieważ przy restrykcyjnych ustawieniach może blokować prawidłowe powtarzające się wywołania.

## Dlaczego to istnieje

- Wykrywanie powtarzalnych sekwencji, które nie prowadzą do postępu.
- Wykrywanie pętli bez wyniku o wysokiej częstotliwości (to samo narzędzie, te same dane wejściowe, powtarzające się błędy).
- Wykrywanie konkretnych wzorców powtarzających się wywołań dla znanych narzędzi sondujących.

## Blok konfiguracji

Globalne wartości domyślne:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Nadpisanie per-agent (opcjonalne):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Zachowanie pól

- `enabled`: Główny przełącznik. `false` oznacza, że wykrywanie pętli nie jest wykonywane.
- `historySize`: liczba ostatnich wywołań narzędzi przechowywanych do analizy.
- `warningThreshold`: próg przed sklasyfikowaniem wzorca jako wyłącznie ostrzegawczego.
- `criticalThreshold`: próg blokowania powtarzających się wzorców pętli.
- `globalCircuitBreakerThreshold`: globalny próg wyłącznika bezpieczeństwa dla braku postępu.
- `detectors.genericRepeat`: wykrywa powtarzające się wzorce to samo narzędzie + te same parametry.
- `detectors.knownPollNoProgress`: wykrywa znane wzorce podobne do sondowania bez zmiany stanu.
- `detectors.pingPong`: wykrywa naprzemienne wzorce ping-pong.

## Zalecana konfiguracja

- Zacznij od `enabled: true`, pozostawiając domyślne wartości bez zmian.
- Zachowaj kolejność progów: `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jeśli pojawiają się fałszywe alarmy:
  - podnieś `warningThreshold` i/lub `criticalThreshold`
  - (opcjonalnie) podnieś `globalCircuitBreakerThreshold`
  - wyłącz tylko detektor powodujący problemy
  - zmniejsz `historySize`, aby osłabić rygor historycznego kontekstu

## Logi i oczekiwane zachowanie

Gdy pętla zostanie wykryta, OpenClaw raportuje zdarzenie pętli i blokuje lub tłumi kolejny cykl narzędzia zależnie od poziomu istotności.
Chroni to użytkowników przed niekontrolowanymi kosztami tokenów i zawieszeniami, przy jednoczesnym zachowaniu normalnego dostępu do narzędzi.

- Najpierw preferowane są ostrzeżenia i tymczasowe tłumienie.
- Eskalacja następuje dopiero wtedy, gdy zgromadzi się powtarzający się materiał dowodowy.

## Uwagi

- `tools.loopDetection` jest scalane z nadpisaniami na poziomie agenta.
- Konfiguracja per-agent w pełni nadpisuje lub rozszerza wartości globalne.
- Jeśli nie istnieje żadna konfiguracja, guardraile pozostają wyłączone.
