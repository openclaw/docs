---
read_when:
    - Użytkownik zgłasza, że agenci zawieszają się, powtarzając wywołania narzędzi
    - Musisz dostroić ochronę przed powtarzającymi się wywołaniami
    - Edytujesz polityki narzędzi/środowiska uruchomieniowego agenta
summary: Jak włączyć i dostroić zabezpieczenia wykrywające powtarzające się pętle wywołań narzędzi
title: Wykrywanie pętli narzędziowych
x-i18n:
    generated_at: "2026-04-24T09:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw może zapobiegać sytuacjom, w których agenci utkną w powtarzalnych wzorcach wywołań narzędzi.
To zabezpieczenie jest **domyślnie wyłączone**.

Włączaj je tylko tam, gdzie jest potrzebne, ponieważ przy rygorystycznych ustawieniach może blokować uzasadnione powtarzające się wywołania.

## Dlaczego to istnieje

- Wykrywanie powtarzalnych sekwencji, które nie prowadzą do postępu.
- Wykrywanie pętli o wysokiej częstotliwości bez wyników (to samo narzędzie, te same dane wejściowe, powtarzające się błędy).
- Wykrywanie określonych wzorców powtarzanych wywołań dla znanych narzędzi sondujących.

## Blok konfiguracji

Domyślne ustawienia globalne:

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

- `enabled`: główny przełącznik. `false` oznacza brak wykrywania pętli.
- `historySize`: liczba ostatnich wywołań narzędzi przechowywanych do analizy.
- `warningThreshold`: próg, po którym wzorzec jest klasyfikowany tylko jako ostrzeżenie.
- `criticalThreshold`: próg blokowania powtarzalnych wzorców pętli.
- `globalCircuitBreakerThreshold`: globalny próg wyłącznika bezpieczeństwa dla braku postępu.
- `detectors.genericRepeat`: wykrywa wzorce powtarzania tego samego narzędzia + tych samych parametrów.
- `detectors.knownPollNoProgress`: wykrywa znane wzorce podobne do sondowania bez zmiany stanu.
- `detectors.pingPong`: wykrywa naprzemienne wzorce ping-pong.

## Zalecana konfiguracja

- Zacznij od `enabled: true`, bez zmiany wartości domyślnych.
- Utrzymuj progi w kolejności `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jeśli pojawią się fałszywe alarmy:
  - zwiększ `warningThreshold` i/lub `criticalThreshold`
  - (opcjonalnie) zwiększ `globalCircuitBreakerThreshold`
  - wyłącz tylko detektor powodujący problemy
  - zmniejsz `historySize`, aby kontekst historyczny był mniej rygorystyczny

## Logi i oczekiwane zachowanie

Gdy pętla zostanie wykryta, OpenClaw zgłasza zdarzenie pętli i blokuje lub tłumi następny cykl narzędzia zależnie od poziomu zagrożenia.
Chroni to użytkowników przed niekontrolowanym zużyciem tokenów i zawieszeniami, zachowując jednocześnie zwykły dostęp do narzędzi.

- Najpierw preferuj ostrzeżenia i tymczasowe tłumienie.
- Eskaluj dopiero wtedy, gdy zgromadzą się powtarzające się przesłanki.

## Uwagi

- `tools.loopDetection` jest scalane z nadpisaniami na poziomie agenta.
- Konfiguracja per-agent w pełni nadpisuje lub rozszerza wartości globalne.
- Jeśli konfiguracja nie istnieje, zabezpieczenia pozostają wyłączone.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- [Poziomy myślenia](/pl/tools/thinking)
- [Subagenci](/pl/tools/subagents)
