---
read_when:
    - Użytkownik zgłasza, że agenci zapętlają się, powtarzając wywołania narzędzi
    - Musisz dostroić ochronę przed powtarzającymi się wywołaniami
    - Edytujesz zasady dotyczące narzędzi i środowiska uruchomieniowego agenta
summary: Jak włączyć i dostroić zabezpieczenia wykrywające powtarzające się pętle wywołań narzędzi
title: Wykrywanie pętli narzędzi
x-i18n:
    generated_at: "2026-04-30T10:23:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw może zapobiegać utknięciu agentów w powtarzających się wzorcach wywołań narzędzi.
Zabezpieczenie jest **domyślnie wyłączone**.

Włączaj je tylko tam, gdzie jest potrzebne, ponieważ przy restrykcyjnych ustawieniach może blokować prawidłowe powtarzane wywołania.

## Dlaczego to istnieje

- Wykrywanie powtarzalnych sekwencji, które nie przynoszą postępu.
- Wykrywanie szybkich pętli bez wyników (to samo narzędzie, te same dane wejściowe, powtarzające się błędy).
- Wykrywanie konkretnych wzorców powtarzanych wywołań dla znanych narzędzi odpytywania.

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

Nadpisanie dla agenta (opcjonalne):

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

- `enabled`: główny przełącznik. `false` oznacza, że wykrywanie pętli nie jest wykonywane.
- `historySize`: liczba ostatnich wywołań narzędzi przechowywanych do analizy.
- `warningThreshold`: próg przed sklasyfikowaniem wzorca wyłącznie jako ostrzeżenie.
- `criticalThreshold`: próg blokowania powtarzalnych wzorców pętli.
- `globalCircuitBreakerThreshold`: globalny próg wyłącznika obwodu przy braku postępu.
- `detectors.genericRepeat`: wykrywa powtarzane wzorce tego samego narzędzia i tych samych parametrów.
- `detectors.knownPollNoProgress`: wykrywa znane wzorce podobne do odpytywania bez zmiany stanu.
- `detectors.pingPong`: wykrywa naprzemienne wzorce ping-pong.

W przypadku `exec` kontrole braku postępu porównują stabilne wyniki poleceń i ignorują zmienne metadane wykonania, takie jak czas trwania, PID, identyfikator sesji i katalog roboczy.
Gdy dostępny jest identyfikator uruchomienia, historia ostatnich wywołań narzędzi jest oceniana tylko w ramach tego uruchomienia, aby zaplanowane cykle Heartbeat i nowe uruchomienia nie dziedziczyły nieaktualnych liczników pętli z wcześniejszych uruchomień.

## Zalecana konfiguracja

- Zacznij od `enabled: true`, bez zmiany ustawień domyślnych.
- Zachowaj kolejność progów jako `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jeśli wystąpią fałszywe alarmy:
  - podnieś `warningThreshold` i/lub `criticalThreshold`
  - (opcjonalnie) podnieś `globalCircuitBreakerThreshold`
  - wyłącz tylko detektor powodujący problemy
  - zmniejsz `historySize`, aby ograniczyć rygor kontekstu historycznego

## Logi i oczekiwane zachowanie

Gdy pętla zostanie wykryta, OpenClaw zgłasza zdarzenie pętli i blokuje lub tłumi następny cykl narzędzia w zależności od powagi.
Chroni to użytkowników przed niekontrolowanym zużyciem tokenów i blokadami, jednocześnie zachowując normalny dostęp do narzędzi.

- Najpierw preferuj ostrzeżenie i tymczasowe tłumienie.
- Eskaluj dopiero wtedy, gdy zgromadzą się powtarzalne dowody.

## Uwagi

- `tools.loopDetection` jest scalane z nadpisaniami na poziomie agenta.
- Konfiguracja dla agenta w pełni nadpisuje lub rozszerza wartości globalne.
- Jeśli konfiguracja nie istnieje, zabezpieczenia pozostają wyłączone.

## Powiązane

- [Zatwierdzenia Exec](/pl/tools/exec-approvals)
- [Poziomy rozumowania](/pl/tools/thinking)
- [Podagenty](/pl/tools/subagents)
