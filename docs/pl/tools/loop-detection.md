---
read_when:
    - Użytkownik zgłasza, że agenci zapętlają się, powtarzając wywołania narzędzi
    - Musisz dostroić ochronę przed powtarzającymi się wywołaniami
    - Edytujesz zasady dotyczące narzędzi i środowiska wykonawczego agenta
    - Po ponownej próbie spowodowanej przepełnieniem kontekstu występuje `compaction_loop_persisted` przerwań
summary: Jak włączyć i dostroić mechanizmy ochronne wykrywające powtarzające się pętle wywołań narzędzi
title: Wykrywanie pętli narzędziowych
x-i18n:
    generated_at: "2026-07-12T15:45:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw ma dwa współdziałające mechanizmy ochronne przed powtarzalnymi wzorcami wywołań narzędzi,
oba skonfigurowane w `tools.loopDetection`:

1. **Wykrywanie pętli** (`enabled`) — domyślnie wyłączone. Monitoruje bieżącą
   historię wywołań narzędzi pod kątem powtarzających się wzorców i ponownych prób użycia nieznanych narzędzi.
2. **Mechanizm ochronny po kompaktowaniu** (`postCompactionGuard`) — włączony, gdy
   `enabled` nie ma jawnie wartości `false`. Jest uzbrajany po każdej ponownej próbie po kompaktowaniu
   i przerywa przebieg, jeśli agent powtórzy tę samą trójkę `(tool, args, result)`
   w obrębie okna.

Ustaw `tools.loopDetection.enabled: false`, aby wyłączyć oba mechanizmy ochronne.

## Dlaczego ten mechanizm istnieje

- Wykrywanie powtarzalnych sekwencji, które nie przynoszą postępu.
- Wykrywanie częstych pętli bez wyniku (to samo narzędzie, te same dane wejściowe,
  powtarzające się błędy).
- Wykrywanie określonych wzorców powtarzających się wywołań znanych narzędzi odpytujących.
- Przerywanie cykli przepełnienie kontekstu -> kompaktowanie -> ta sama pętla, zamiast pozwalać
  im działać bez końca.

## Blok konfiguracji

Globalne wartości domyślne ze wszystkimi udokumentowanymi polami:

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

Opcjonalne nadpisanie dla poszczególnych agentów (w `agents.list[].tools.loopDetection`):

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

Ustawienia agenta są nakładane na blok globalny pole po polu (w tym na zagnieżdżone
`detectors` i `postCompactionGuard`), dlatego agent musi ustawić tylko
pola, które chce zmienić.

### Działanie pól

| Pole                             | Wartość domyślna | Działanie                                                                                                                                                   |
| -------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`          | Główny przełącznik detektorów analizujących bieżącą historię. Wartość `false` wyłącza także mechanizm ochronny po kompaktowaniu.                              |
| `historySize`                    | `30`             | Liczba ostatnich wywołań narzędzi zachowywanych do analizy.                                                                                                  |
| `warningThreshold`               | `10`             | Liczba powtórzeń, po której wzorzec jest klasyfikowany jako wymagający tylko ostrzeżenia.                                                                     |
| `criticalThreshold`              | `20`             | Liczba powtórzeń powodująca zablokowanie wzorca pętli bez postępu. W przypadku błędnej konfiguracji środowisko wykonawcze wymusza wartość większą niż `warningThreshold`. |
| `unknownToolThreshold`           | `10`             | Blokuje powtarzające się wywołania tego samego niedostępnego narzędzia po tylu nieudanych próbach. Nie podlega ustawieniom `detectors`.                       |
| `globalCircuitBreakerThreshold`  | `30`             | Globalny wyłącznik pętli bez postępu obejmujący wszystkie detektory. W przypadku błędnej konfiguracji środowisko wykonawcze wymusza wartość większą niż `criticalThreshold`. Nie podlega ustawieniom `detectors`. |
| `detectors.genericRepeat`        | `true`           | Ostrzega o powtarzających się wywołaniach tego samego narzędzia z tymi samymi argumentami; blokuje je, gdy zwracają również identyczne wyniki.                |
| `detectors.knownPollNoProgress`  | `true`           | Wykrywa znane wzorce odpytywania bez postępu (`process` z `action: "poll"`/`"log"`, `command_status`).                                                        |
| `detectors.pingPong`             | `true`           | Wykrywa naprzemienne wzorce ping-pong bez postępu między dwoma wywołaniami.                                                                                   |
| `postCompactionGuard.windowSize` | `3`              | Liczba prób, przez które mechanizm ochronny pozostaje uzbrojony po kompaktowaniu, oraz liczba identycznych trójek powodująca przerwanie przebiegu.             |

W przypadku `exec` skrót braku postępu porównuje stabilne wyniki poleceń (stan,
kod wyjścia, znacznik przekroczenia limitu czasu i dane wyjściowe), ignorując zmienne metadane wykonania, takie
jak czas trwania, PID, identyfikator sesji i katalog roboczy. Skróty wyników wysyłania
wiadomości wychodzących są obliczane po usunięciu zmiennych identyfikatorów poszczególnych wywołań
(identyfikatora wiadomości, identyfikatora pliku i znacznika czasu), dzięki czemu wynik „wysłano” nie wygląda identycznie
jak inny wynik „wysłano”. Gdy dostępny jest identyfikator przebiegu, historia jest oceniana wyłącznie
w obrębie tego przebiegu, dlatego zaplanowane cykle Heartbeat i nowe przebiegi nie dziedziczą
nieaktualnych liczników pętli z wcześniejszych przebiegów.

## Zalecana konfiguracja

- W przypadku mniejszych modeli ustaw `enabled: true` i pozostaw progi z ich
  wartościami domyślnymi. Modele flagowe rzadko wymagają wykrywania na podstawie bieżącej historii i mogą
  pozostawić główny przełącznik z wartością `false`, nadal korzystając z
  mechanizmu ochronnego po kompaktowaniu.
- Zachowaj kolejność progów `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; środowisko wykonawcze podnosi wartości `criticalThreshold` i
  `globalCircuitBreakerThreshold`, jeśli ustawisz je na poziomie progu, który muszą
  przekraczać, lub niżej.
- Jeśli wystąpią wyniki fałszywie dodatnie:
  - Zwiększ `warningThreshold` lub `criticalThreshold`.
  - Opcjonalnie zwiększ `globalCircuitBreakerThreshold`.
  - Wyłącz tylko konkretny detektor powodujący problemy (`detectors.<name>: false`).
  - Zmniejsz `historySize`, aby skrócić okno historii.
- Aby wyłączyć wszystko, w tym mechanizm ochronny po kompaktowaniu, jawnie ustaw
  `tools.loopDetection.enabled: false`.

## Mechanizm ochronny po kompaktowaniu

Po ponownej próbie po kompaktowaniu następującym wskutek przepełnienia kontekstu moduł wykonawczy uzbraja
mechanizm ochronny z krótkim oknem dla kilku następnych wywołań narzędzi. Jeśli agent wyemituje tę samą
trójkę `(toolName, argsHash, resultHash)` `postCompactionGuard.windowSize`
razy w obrębie tego okna, mechanizm uznaje, że kompaktowanie nie przerwało
pętli, i kończy przebieg z błędem `compaction_loop_persisted`.

Mechanizm ochronny podlega głównej fladze `tools.loopDetection.enabled`, ale z jednym
wyjątkiem: pozostaje **włączony, gdy flaga nie jest ustawiona lub ma wartość `true`** i wyłącza się
dopiero wtedy, gdy flaga ma jawnie wartość `false`. Jest to zamierzone — mechanizm
służy do wychodzenia z pętli kompaktowania, które w przeciwnym razie zużywałyby nieograniczoną liczbę tokenów,
dlatego użytkownik bez konfiguracji również otrzymuje tę ochronę.

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

- Niższa wartość `windowSize` oznacza bardziej rygorystyczne działanie (mniej prób przed przerwaniem).
- Wyższa wartość `windowSize` daje agentowi więcej prób odzyskania sprawności.
- Mechanizm ochronny nigdy nie przerywa przebiegu, gdy wyniki się zmieniają; uruchamiają go wyłącznie identyczne
  bajtowo wyniki w całym oknie.
- Jest uzbrajany wyłącznie bezpośrednio po ponownej próbie po kompaktowaniu, a nie w innych
  momentach przebiegu.

<Note>
  Mechanizm ochronny po kompaktowaniu działa zawsze, gdy główna flaga nie ma jawnie wartości `false`, nawet jeśli blok `tools.loopDetection` nigdy nie został dodany. Aby to sprawdzić, poszukaj wpisu `post-compaction guard armed for N attempts` w dzienniku Gateway bezpośrednio po zdarzeniu kompaktowania.
</Note>

## Dzienniki i oczekiwane działanie

Po wykryciu pętli OpenClaw rejestruje zdarzenie pętli i ostrzega albo blokuje
następny cykl narzędzia, zależnie od poziomu istotności. Chroni to przed niekontrolowanym
zużyciem tokenów i zawieszeniami, zachowując jednocześnie normalny dostęp do narzędzi.

- Najpierw pojawiają się ostrzeżenia.
- Blokowanie następuje, gdy wzorzec utrzymuje się po przekroczeniu progu ostrzeżenia.
- Progi krytyczne blokują następny cykl narzędzia i zapisują jasną
  przyczynę wykrycia pętli w rekordzie przebiegu.
- Mechanizm ochronny po kompaktowaniu emituje błędy `compaction_loop_persisted`, wskazując
  narzędzie powodujące problem oraz liczbę identycznych wywołań.

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/pl/tools/exec-approvals" icon="shield">
    Zasady zezwalania na wykonywanie poleceń powłoki i odmawiania go.
  </Card>
  <Card title="Thinking levels" href="/pl/tools/thinking" icon="brain">
    Poziomy nakładu rozumowania i ich współdziałanie z zasadami dostawcy.
  </Card>
  <Card title="Sub-agents" href="/pl/tools/subagents" icon="users">
    Uruchamianie izolowanych agentów w celu ograniczenia niekontrolowanego zachowania.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/config-tools#toolsloopdetection" icon="gear">
    Pełny schemat `tools.loopDetection` i semantyka scalania.
  </Card>
</CardGroup>
