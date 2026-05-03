---
read_when:
    - Użytkownik zgłasza, że agenci zawieszają się, powtarzając wywołania narzędzi
    - Należy dostroić ochronę przed powtarzającymi się wywołaniami
    - Edytujesz zasady narzędzi i środowiska uruchomieniowego agenta
summary: Jak włączyć i dostroić zabezpieczenia wykrywające powtarzające się pętle wywołań narzędzi
title: Wykrywanie pętli narzędzi
x-i18n:
    generated_at: "2026-05-03T21:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw może zapobiegać blokowaniu się agentów w powtarzających się wzorcach wywołań narzędzi.
Mechanizm ochronny jest **domyślnie wyłączony**.

Włączaj go tylko tam, gdzie jest potrzebny, ponieważ przy rygorystycznych ustawieniach może blokować uzasadnione powtarzające się wywołania.

## Dlaczego to istnieje

- Wykrywanie powtarzalnych sekwencji, które nie przynoszą postępu.
- Wykrywanie pętli bez wyników o wysokiej częstotliwości (to samo narzędzie, te same dane wejściowe, powtarzające się błędy).
- Wykrywanie konkretnych wzorców powtarzających się wywołań dla znanych narzędzi odpytywania.

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

Nadpisanie dla poszczególnych agentów (opcjonalne):

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

- `enabled`: Przełącznik główny. `false` oznacza, że wykrywanie pętli nie jest wykonywane.
- `historySize`: liczba ostatnich wywołań narzędzi przechowywanych do analizy.
- `warningThreshold`: próg przed sklasyfikowaniem wzorca jako wyłącznie ostrzegawczego.
- `criticalThreshold`: próg blokowania powtarzalnych wzorców pętli.
- `globalCircuitBreakerThreshold`: globalny próg wyłącznika braku postępu.
- `detectors.genericRepeat`: wykrywa powtarzające się wzorce tego samego narzędzia + tych samych parametrów.
- `detectors.knownPollNoProgress`: wykrywa znane wzorce podobne do odpytywania bez zmiany stanu.
- `detectors.pingPong`: wykrywa naprzemienne wzorce ping-pong.

W przypadku `exec` kontrole braku postępu porównują stabilne wyniki poleceń i ignorują zmienne metadane czasu wykonania, takie jak czas trwania, PID, identyfikator sesji i katalog roboczy.
Gdy dostępny jest identyfikator uruchomienia, historia ostatnich wywołań narzędzi jest oceniana tylko w ramach tego uruchomienia, dzięki czemu zaplanowane cykle Heartbeat i nowe uruchomienia nie dziedziczą nieaktualnych liczników pętli z wcześniejszych uruchomień.

## Zalecana konfiguracja

- W przypadku mniejszych modeli zacznij od `enabled: true` i pozostaw wartości domyślne bez zmian. Modele flagowe rzadko potrzebują wykrywania pętli i mogą pozostawić je wyłączone.
- Utrzymuj progi w kolejności `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jeśli wystąpią fałszywe alarmy:
  - podnieś `warningThreshold` i/lub `criticalThreshold`
  - (opcjonalnie) podnieś `globalCircuitBreakerThreshold`
  - wyłącz tylko detektor powodujący problemy
  - zmniejsz `historySize`, aby kontekst historyczny był mniej rygorystyczny

## Logi i oczekiwane zachowanie

Gdy pętla zostanie wykryta, OpenClaw zgłasza zdarzenie pętli i blokuje lub tłumi następny cykl narzędzi w zależności od ważności.
Chroni to użytkowników przed niekontrolowanymi wydatkami na tokeny i zawieszeniami, zachowując jednocześnie normalny dostęp do narzędzi.

- Najpierw preferuj ostrzeżenie i tymczasowe tłumienie.
- Eskaluj tylko wtedy, gdy zgromadzą się powtarzające się dowody.

## Uwagi

- `tools.loopDetection` jest scalane z nadpisaniami na poziomie agenta.
- Konfiguracja dla poszczególnych agentów w pełni nadpisuje lub rozszerza wartości globalne.
- Jeśli konfiguracja nie istnieje, mechanizmy ochronne pozostają wyłączone.

## Powiązane

- [Zatwierdzenia Exec](/pl/tools/exec-approvals)
- [Poziomy myślenia](/pl/tools/thinking)
- [Podagenci](/pl/tools/subagents)
