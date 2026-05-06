---
read_when:
    - Użytkownik zgłasza, że agenci zapętlają się, powtarzając wywołania narzędzi
    - Musisz dostroić ochronę przed powtarzającymi się wywołaniami
    - Edytujesz zasady dotyczące narzędzi i środowiska wykonawczego agenta
    - Napotykasz przerwania `compaction_loop_persisted` po ponowieniu próby po przepełnieniu kontekstu
summary: Jak włączyć i dostroić zabezpieczenia wykrywające powtarzające się pętle wywołań narzędzi
title: Wykrywanie pętli narzędziowej
x-i18n:
    generated_at: "2026-05-06T09:34:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw ma dwa współpracujące zabezpieczenia dla powtarzalnych wzorców wywołań narzędzi:

1. **Wykrywanie pętli** (`tools.loopDetection.enabled`) — domyślnie wyłączone. Obserwuje przesuwaną historię wywołań narzędzi pod kątem powtarzających się wzorców i ponownych prób użycia nieznanych narzędzi.
2. **Zabezpieczenie po Compaction** (`tools.loopDetection.postCompactionGuard`) — domyślnie włączone, chyba że `tools.loopDetection.enabled` ma jawnie wartość `false`. Uzbraja się po każdej ponownej próbie po Compaction i przerywa przebieg, gdy agent wyemituje tę samą trójkę `(tool, args, result)` w oknie.

Oba są konfigurowane w tym samym bloku `tools.loopDetection`, ale zabezpieczenie po Compaction działa zawsze, gdy przełącznik główny nie jest jawnie wyłączony. Ustaw `tools.loopDetection.enabled: false`, aby wyciszyć oba obszary.

## Dlaczego to istnieje

- Wykrywa powtarzalne sekwencje, które nie robią postępu.
- Wykrywa pętle o wysokiej częstotliwości bez wyników (to samo narzędzie, te same dane wejściowe, powtarzające się błędy).
- Wykrywa konkretne wzorce powtarzanych wywołań dla znanych narzędzi odpytujących.
- Zapobiega nieograniczonemu działaniu cykli: przepełnienie kontekstu, potem Compaction, potem ta sama pętla.

## Blok konfiguracji

Globalne wartości domyślne, z pokazanymi wszystkimi udokumentowanymi polami:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

Nadpisanie dla pojedynczego agenta (opcjonalne):

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

| Pole                             | Domyślnie | Efekt                                                                                                                           |
| -------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`   | Przełącznik główny dla detektorów przesuwanej historii. Ustawienie `false` wyłącza również zabezpieczenie po Compaction.        |
| `historySize`                    | `30`      | Liczba ostatnich wywołań narzędzi przechowywanych do analizy.                                                                   |
| `warningThreshold`               | `10`      | Próg, po którym wzorzec jest klasyfikowany wyłącznie jako ostrzeżenie.                                                          |
| `criticalThreshold`              | `20`      | Próg blokowania powtarzalnych wzorców pętli.                                                                                    |
| `unknownToolThreshold`           | `10`      | Blokuje powtarzane wywołania tego samego niedostępnego narzędzia po tylu niepowodzeniach.                                      |
| `globalCircuitBreakerThreshold`  | `30`      | Globalny próg wyłącznika dla braku postępu we wszystkich detektorach.                                                           |
| `detectors.genericRepeat`        | `true`    | Wykrywa powtarzające się wzorce: to samo narzędzie + te same parametry.                                                         |
| `detectors.knownPollNoProgress`  | `true`    | Wykrywa znane wzorce podobne do odpytywania bez zmiany stanu.                                                                   |
| `detectors.pingPong`             | `true`    | Wykrywa naprzemienne wzorce ping-pong.                                                                                          |
| `postCompactionGuard.windowSize` | `3`       | Liczba wywołań narzędzi po Compaction, podczas których zabezpieczenie pozostaje uzbrojone, oraz liczba identycznych trójek przerywająca przebieg. |

Dla `exec` kontrole braku postępu porównują stabilne wyniki poleceń i ignorują zmienne metadane wykonania, takie jak czas trwania, PID, identyfikator sesji i katalog roboczy. Gdy dostępny jest identyfikator przebiegu, ostatnia historia wywołań narzędzi jest oceniana tylko w obrębie tego przebiegu, więc zaplanowane cykle Heartbeat i świeże przebiegi nie dziedziczą nieaktualnych liczników pętli z wcześniejszych przebiegów.

## Zalecana konfiguracja

- Dla mniejszych modeli ustaw `enabled: true` i pozostaw progi z wartościami domyślnymi. Modele flagowe rzadko potrzebują wykrywania przesuwanej historii i mogą pozostawić przełącznik główny jako `false`, nadal korzystając z zabezpieczenia po Compaction.
- Zachowaj kolejność progów jako `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Jeśli pojawią się wyniki fałszywie dodatnie:
  - Zwiększ `warningThreshold` i/lub `criticalThreshold`.
  - Opcjonalnie zwiększ `globalCircuitBreakerThreshold`.
  - Wyłącz tylko konkretny detektor powodujący problemy (`detectors.<name>: false`).
  - Zmniejsz `historySize`, aby kontekst historyczny był mniej rygorystyczny.
- Aby wyłączyć wszystko (w tym zabezpieczenie po Compaction), ustaw jawnie `tools.loopDetection.enabled: false`.

## Zabezpieczenie po Compaction

Gdy runner ukończy ponowną próbę po Compaction po przepełnieniu kontekstu, uzbraja krótkookienne zabezpieczenie, które obserwuje kilka następnych wywołań narzędzi. Jeśli agent wyemituje tę samą trójkę `(toolName, argsHash, resultHash)` wielokrotnie w oknie, zabezpieczenie uznaje, że Compaction nie przerwało pętli, i przerywa przebieg z błędem `compaction_loop_persisted`.

Zabezpieczenie jest bramkowane przez główną flagę `tools.loopDetection.enabled`, z jednym niuansem: pozostaje **włączone, gdy flaga nie jest ustawiona albo ma wartość `true`**, i dezaktywuje się tylko wtedy, gdy flaga ma jawnie wartość `false`. To celowe. Zabezpieczenie istnieje po to, aby wydostać się z pętli Compaction, które w przeciwnym razie zużywałyby nieograniczoną liczbę tokenów, więc użytkownik bez konfiguracji nadal otrzymuje ochronę.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- Niższe `windowSize` jest bardziej rygorystyczne (mniej prób przed przerwaniem).
- Wyższe `windowSize` daje agentowi więcej prób odzyskania działania.
- Zabezpieczenie nigdy nie przerywa, gdy wyniki się zmieniają; robi to tylko wtedy, gdy wyniki są identyczne bajt po bajcie w całym oknie.
- Jest celowo wąskie: uruchamia się tylko bezpośrednio po ponownej próbie po Compaction.

<Note>
  Zabezpieczenie po Compaction działa zawsze, gdy flaga główna nie ma jawnie wartości `false`, nawet jeśli nigdy nie zapisano bloku `tools.loopDetection`. Aby to zweryfikować, poszukaj `post-compaction guard armed for N attempts` w dzienniku Gateway bezpośrednio po zdarzeniu Compaction.
</Note>

## Dzienniki i oczekiwane zachowanie

Gdy pętla zostanie wykryta, OpenClaw zgłasza zdarzenie pętli i w zależności od wagi albo tłumi, albo blokuje następny cykl narzędzia. Chroni to użytkowników przed niekontrolowanym zużyciem tokenów i blokadami, zachowując normalny dostęp do narzędzi.

- Najpierw pojawiają się ostrzeżenia.
- Gdy wzorce utrzymują się po przekroczeniu progu ostrzeżenia, następuje tłumienie.
- Progi krytyczne blokują następny cykl narzędzia i pokazują jasną przyczynę wykrycia pętli w rekordzie przebiegu.
- Zabezpieczenie po Compaction emituje błędy `compaction_loop_persisted` z nazwą narzędzia powodującego problem i liczbą identycznych wywołań.

## Powiązane

<CardGroup cols={2}>
  <Card title="Zatwierdzenia exec" href="/pl/tools/exec-approvals" icon="shield">
    Zasady zezwalania/odmawiania dla wykonywania powłoki.
  </Card>
  <Card title="Poziomy myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy wysiłku rozumowania i interakcja z zasadami providera.
  </Card>
  <Card title="Subagenci" href="/pl/tools/subagents" icon="users">
    Uruchamianie izolowanych agentów w celu ograniczenia niekontrolowanego zachowania.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat `tools.loopDetection` i semantyka scalania.
  </Card>
</CardGroup>
