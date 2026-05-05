---
read_when:
    - Użytkownik zgłasza, że agenci utykają, powtarzając wywołania narzędzi
    - Należy dostroić zabezpieczenie przed powtarzającymi się wywołaniami
    - Edytujesz zasady narzędzi/środowiska uruchomieniowego agenta
summary: Jak włączyć i dostroić zabezpieczenia wykrywające powtarzające się pętle wywołań narzędzi
title: Wykrywanie pętli narzędzi
x-i18n:
    generated_at: "2026-05-05T01:50:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw może zapobiegać utknięciu agentów w powtarzających się wzorcach wywołań narzędzi.
Zabezpieczenie jest **domyślnie wyłączone**.

Włączaj je tylko tam, gdzie jest potrzebne, ponieważ przy rygorystycznych ustawieniach może blokować prawidłowe powtarzające się wywołania.

## Dlaczego to istnieje

- Wykrywa powtarzalne sekwencje, które nie przynoszą postępu.
- Wykrywa wysokoczęstotliwościowe pętle bez wyników (to samo narzędzie, te same dane wejściowe, powtarzające się błędy).
- Wykrywa konkretne wzorce powtarzających się wywołań dla znanych narzędzi odpytujących.

## Blok konfiguracji

Domyślne wartości globalne:

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

- `enabled`: przełącznik główny. `false` oznacza, że wykrywanie pętli nie jest wykonywane.
- `historySize`: liczba ostatnich wywołań narzędzi przechowywanych do analizy.
- `warningThreshold`: próg przed sklasyfikowaniem wzorca jako samego ostrzeżenia.
- `criticalThreshold`: próg blokowania powtarzalnych wzorców pętli.
- `globalCircuitBreakerThreshold`: globalny próg wyłącznika dla braku postępu.
- `detectors.genericRepeat`: wykrywa powtarzające się wzorce tego samego narzędzia i tych samych parametrów.
- `detectors.knownPollNoProgress`: wykrywa znane wzorce podobne do odpytywania bez zmiany stanu.
- `detectors.pingPong`: wykrywa naprzemienne wzorce ping-pong.

W przypadku `exec` kontrole braku postępu porównują stabilne wyniki polecenia i ignorują zmienne metadane czasu wykonania, takie jak czas trwania, PID, identyfikator sesji i katalog roboczy.
Gdy dostępny jest identyfikator uruchomienia, historia ostatnich wywołań narzędzi jest oceniana tylko w obrębie tego uruchomienia, więc zaplanowane cykle Heartbeat i nowe uruchomienia nie dziedziczą nieaktualnych liczników pętli z wcześniejszych uruchomień.

## Zalecana konfiguracja

- W przypadku mniejszych modeli zacznij od `enabled: true`, bez zmieniania wartości domyślnych. Modele flagowe rzadko potrzebują wykrywania pętli i mogą pozostawić je wyłączone.
- Zachowaj kolejność progów jako `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jeśli wystąpią fałszywe alarmy:
  - podnieś `warningThreshold` i/lub `criticalThreshold`
  - (opcjonalnie) podnieś `globalCircuitBreakerThreshold`
  - wyłącz tylko detektor powodujący problemy
  - zmniejsz `historySize`, aby uzyskać mniej rygorystyczny kontekst historyczny

## Zabezpieczenie po Compaction

Gdy runner zakończy automatyczną próbę ponowienia po Compaction (po przepełnieniu kontekstu), uzbraja zabezpieczenie o krótkim oknie, które obserwuje kilka następnych wywołań narzędzi. Jeśli agent wyemituje ten _sam_ trójkę `(toolName, args, result)` wiele razy w tym oknie, zabezpieczenie uznaje, że Compaction nie przerwała pętli, i przerywa uruchomienie z błędem `compaction_loop_persisted`.

To osobna ścieżka kodu względem globalnych detektorów `tools.loopDetection`. Można ją konfigurować niezależnie:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: liczba wywołań narzędzi po Compaction, podczas których zabezpieczenie pozostaje uzbrojone, _oraz_ liczba identycznych trójek (narzędzie, argumenty, wynik), która wyzwala przerwanie.

Zabezpieczenie nigdy nie przerywa działania, gdy wyniki się zmieniają, a tylko wtedy, gdy wyniki są identyczne bajtowo w całym oknie. Jest celowo wąskie: uruchamia się wyłącznie bezpośrednio po próbie ponowienia po Compaction.

## Logi i oczekiwane zachowanie

Gdy pętla zostanie wykryta, OpenClaw zgłasza zdarzenie pętli i blokuje albo tłumi następny cykl narzędzi w zależności od wagi problemu.
Chroni to użytkowników przed niekontrolowanym zużyciem tokenów i blokadami, zachowując normalny dostęp do narzędzi.

- Najpierw preferuj ostrzeżenie i tymczasowe tłumienie.
- Eskaluj dopiero wtedy, gdy zgromadzą się powtarzające dowody.

## Uwagi

- `tools.loopDetection` jest scalane z nadpisaniami na poziomie agenta.
- Konfiguracja per agent w pełni nadpisuje lub rozszerza wartości globalne.
- Jeśli konfiguracja nie istnieje, zabezpieczenia pozostają wyłączone.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- [Poziomy myślenia](/pl/tools/thinking)
- [Subagenci](/pl/tools/subagents)
