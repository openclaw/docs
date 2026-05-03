---
read_when:
    - Konfigurowanie widocznych aktualizacji postępu dla długo trwających tur czatu
    - Wybór między trybami strumieniowania częściowego, blokowego i postępu
    - Wyjaśnienie, jak OpenClaw aktualizuje jedną wiadomość w kanale w trakcie pracy
    - Rozwiązywanie problemów z wersjami roboczymi postępu, samodzielnymi komunikatami o postępie lub mechanizmem awaryjnym finalizacji
summary: 'Wersje robocze postępu: jeden widoczny komunikat o pracy w toku, który aktualizuje się podczas działania agenta'
title: Szkice postępów
x-i18n:
    generated_at: "2026-05-03T21:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Robocze komunikaty postępu sprawiają, że długotrwałe tury agenta w czacie wydają się aktywne, bez zamieniania
rozmowy w stos tymczasowych odpowiedzi statusowych.

Gdy robocze komunikaty postępu są włączone, OpenClaw tworzy jedną widoczną wiadomość
w toku, aktualizuje ją, gdy agent czyta, planuje, wywołuje narzędzia lub czeka na
zatwierdzenie, a następnie zamienia ten szkic w odpowiedź końcową, gdy kanał może
zrobić to bezpiecznie.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Używaj roboczych komunikatów postępu, gdy chcesz mieć jedną schludną wiadomość statusową podczas pracy
intensywnie korzystającej z narzędzi oraz odpowiedź końcową po zakończeniu tury.

## Szybki Start

Włącz robocze komunikaty postępu dla kanału za pomocą `streaming.mode: "progress"`:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

To zwykle wystarczy. OpenClaw wybierze automatyczną jednowyrazową etykietę, doda
zwięzłe wiersze postępu, gdy trwa użyteczna praca, i wyciszy zduplikowane
samodzielne komunikaty postępu dla tej tury.

## Co Widzą Użytkownicy

Roboczy komunikat postępu ma dwie części:

| Część          | Cel                                                               |
| -------------- | ----------------------------------------------------------------- |
| Etykieta       | Krótki tytuł, taki jak `Thinking` lub `Shelling`.                 |
| Wiersze postępu | Zwięzłe aktualizacje uruchomienia, takie jak wywołania narzędzi, kroki zadań lub zatwierdzenia. |

Etykieta pojawia się od razu, gdy agent zaczyna odpowiadać. Wiersze postępu są
dodawane tylko wtedy, gdy agent emituje przydatne aktualizacje pracy. Odpowiedź końcowa zastępuje
szkic, gdy to możliwe; w przeciwnym razie OpenClaw wysyła odpowiedź końcową normalnie i
czyści szkic albo przestaje go aktualizować zgodnie z transportem kanału.

## Wybór Trybu

`channels.<channel>.streaming.mode` kontroluje widoczne zachowanie w toku:

| Tryb       | Najlepszy do                      | Co pojawia się w czacie                            |
| ---------- | --------------------------------- | -------------------------------------------------- |
| `off`      | Cichych kanałów                   | Tylko odpowiedź końcowa.                           |
| `partial`  | Obserwowania pojawiania się tekstu odpowiedzi | Jeden szkic edytowany najnowszym tekstem odpowiedzi. |
| `block`    | Większych fragmentów podglądu odpowiedzi | Jeden podgląd aktualizowany lub dopisywany większymi fragmentami. |
| `progress` | Tur intensywnie korzystających z narzędzi lub długotrwałych | Jeden szkic statusu, a potem odpowiedź końcowa.    |

Wybierz `progress`, gdy użytkownikom bardziej zależy na tym, „co się dzieje”, niż na obserwowaniu
strumieniowania tekstu odpowiedzi token po tokenie.

Wybierz `partial`, gdy sama odpowiedź jest sygnałem postępu.

Wybierz `block`, gdy chcesz aktualizacji podglądu szkicu w większych fragmentach tekstu. W
Discord i Telegram `streaming.mode: "block"` nadal oznacza strumieniowanie podglądu, a nie
normalne dostarczanie blokowe. Użyj `streaming.block.enabled` albo starszego
`blockStreaming`, gdy chcesz normalnych odpowiedzi blokowych.

## Konfiguracja Etykiet

Etykiety postępu znajdują się w `channels.<channel>.streaming.progress`.

Domyślna etykieta to `auto`, która wybiera z wbudowanej w OpenClaw puli jednowyrazowych
etykiet:

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

Użyj stałej etykiety:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Użyj własnej automatycznej puli etykiet:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Ukryj etykietę i pokazuj tylko wiersze postępu:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Sterowanie Wierszami Postępu

Wiersze postępu są domyślnie włączone w trybie postępu. Pochodzą z rzeczywistych zdarzeń
uruchomienia: startów narzędzi, aktualizacji elementów, planów zadań, zatwierdzeń, wyników poleceń, podsumowań poprawek
i podobnej aktywności agenta.

Ogranicz liczbę widocznych wierszy:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Zachowaj pojedynczy roboczy komunikat postępu, ale ukryj wiersze narzędzi i zadań:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Przy `toolProgress: false` OpenClaw nadal wycisza starsze samodzielne
komunikaty postępu narzędzi dla tej tury. Kanał pozostaje wizualnie cichy aż do
odpowiedzi końcowej, z wyjątkiem etykiety, jeśli została skonfigurowana.

## Zachowanie Kanałów

Każdy kanał używa najczystszego transportu, który obsługuje:

| Kanał           | Transport postępu                    | Uwagi                                                                 |
| --------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Discord         | Wysłanie jednej wiadomości, potem jej edycja. | Tekst końcowy jest edytowany w miejscu, gdy mieści się w jednej bezpiecznej wiadomości podglądu. |
| Matrix          | Wysłanie jednego zdarzenia, potem jego edycja. | Konfiguracja strumieniowania na poziomie konta kontroluje szkice na poziomie konta. |
| Microsoft Teams | Natywny strumień Teams w czatach osobistych. | `streaming.mode: "block"` mapuje się na dostarczanie blokowe Teams.   |
| Slack           | Natywny strumień lub edytowalny wpis szkicu. | Dostępność wątku wpływa na to, czy można użyć natywnego strumieniowania. |
| Telegram        | Wysłanie jednej wiadomości, potem jej edycja. | Starsze widoczne szkice mogą zostać zastąpione, aby końcowe znaczniki czasu pozostały użyteczne. |
| Mattermost      | Edytowalny wpis szkicu.              | Aktywność narzędzi jest składana w ten sam wpis w stylu szkicu.       |

Kanały bez bezpiecznej obsługi edycji zwykle wracają do wskaźników pisania lub
dostarczania wyłącznie odpowiedzi końcowej.

## Finalizacja

Gdy odpowiedź końcowa jest gotowa, OpenClaw próbuje utrzymać czat w czystości:

- Jeśli szkic może bezpiecznie stać się odpowiedzią końcową, OpenClaw edytuje go w miejscu.
- Jeśli kanał używa natywnego strumieniowania postępu, OpenClaw finalizuje ten strumień,
  gdy natywny transport zaakceptuje tekst końcowy.
- Jeśli odpowiedź końcowa ma multimedia, monit zatwierdzenia, jawny cel odpowiedzi,
  zbyt wiele fragmentów albo nieudaną edycję/wysyłkę, OpenClaw wysyła odpowiedź końcową przez
  normalną ścieżkę dostarczania kanału.

Ścieżka awaryjna jest celowa. Lepiej wysłać świeżą odpowiedź końcową niż
utracić tekst, błędnie umieścić odpowiedź w wątku albo nadpisać szkic ładunkiem, którego kanał
nie może bezpiecznie przedstawić.

## Rozwiązywanie Problemów

**Widzę tylko odpowiedź końcową.**

Sprawdź, czy `channels.<channel>.streaming.mode` jest ustawione na `progress` dla
konta lub kanału, który obsłużył wiadomość. Niektóre ścieżki grupowe albo odpowiedzi z cytatem mogą
wyłączać podglądy szkiców dla tury, gdy kanał nie może bezpiecznie edytować właściwej
wiadomości.

**Widzę etykietę, ale nie widzę wierszy narzędzi.**

Sprawdź `streaming.progress.toolProgress`. Jeśli ma wartość `false`, OpenClaw zachowuje
zachowanie pojedynczego szkicu, ale ukrywa wiersze postępu narzędzi i zadań.

**Widzę świeżą wiadomość końcową zamiast edytowanego szkicu.**

To awaryjne zabezpieczenie. Może wystąpić w przypadku odpowiedzi z multimediami, długich odpowiedzi,
jawnych celów odpowiedzi, starych szkiców Telegram, brakujących celów wątków Slack,
usuniętych wiadomości podglądu albo nieudanej finalizacji natywnego strumienia.

**Nadal widzę samodzielne komunikaty postępu.**

Tryb postępu wycisza domyślne samodzielne komunikaty postępu narzędzi, gdy szkic
jest aktywny. Jeśli samodzielne wiadomości nadal się pojawiają, sprawdź, czy tura faktycznie
używa trybu postępu, a nie `streaming.mode: "off"` ani ścieżki kanału, która
nie może utworzyć szkicu dla tej wiadomości.

**Teams zachowuje się inaczej niż Discord albo Telegram.**

Microsoft Teams używa natywnego strumienia w czatach osobistych zamiast ogólnego
transportu podglądu typu wyślij-i-edytuj. Teams traktuje też `streaming.mode: "block"` jako
dostarczanie blokowe Teams, ponieważ nie ma tego samego trybu blokowego podglądu szkicu
używanego przez Discord i Telegram.

## Powiązane

- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
- [Wiadomości](/pl/concepts/messages)
- [Konfiguracja kanałów](/pl/gateway/config-channels)
- [Discord](/pl/channels/discord)
- [Matrix](/pl/channels/matrix)
- [Microsoft Teams](/pl/channels/msteams)
- [Slack](/pl/channels/slack)
- [Telegram](/pl/channels/telegram)
