---
read_when:
    - Konfigurowanie widocznych aktualizacji postępu dla długo trwających tur czatu
    - Wybór między trybami strumieniowania częściowego, blokowego i postępu
    - Wyjaśnienie, jak OpenClaw aktualizuje jedną wiadomość w kanale podczas trwania pracy
    - Rozwiązywanie problemów z roboczymi wersjami postępu, samodzielnymi komunikatami o postępie lub awaryjną finalizacją
summary: 'Wersje robocze postępu: jeden widoczny komunikat o trwającej pracy, aktualizowany podczas działania agenta'
title: Szkice postępu
x-i18n:
    generated_at: "2026-05-04T07:03:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Wersje robocze postępu sprawiają, że długotrwałe tury agenta wydają się żywe na czacie, bez zamieniania rozmowy w stos tymczasowych odpowiedzi statusowych.

Gdy wersje robocze postępu są włączone, OpenClaw tworzy jedną widoczną wiadomość w toku dopiero wtedy, gdy tura udowodni, że wykonuje rzeczywistą pracę, aktualizuje ją, gdy agent czyta, planuje, wywołuje narzędzia lub czeka na zatwierdzenie, a następnie przekształca tę wersję roboczą w końcową odpowiedź, gdy kanał może zrobić to bezpiecznie.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Używaj wersji roboczych postępu, gdy chcesz mieć jedną uporządkowaną wiadomość statusową podczas pracy intensywnie korzystającej z narzędzi oraz końcową odpowiedź po zakończeniu tury.

## Szybki start

Włącz wersje robocze postępu dla każdego kanału za pomocą `streaming.mode: "progress"`:

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

To zwykle wystarcza. OpenClaw wybierze automatyczną jednoelementową etykietę, poczeka, aż praca potrwa co najmniej pięć sekund lub wyemituje drugie zdarzenie pracy, doda zwarte wiersze postępu, gdy trwa użyteczna praca, i wyciszy zduplikowane samodzielne komunikaty postępu dla tej tury.

## Co widzą użytkownicy

Wersja robocza postępu ma dwie części:

| Część          | Cel                                                                         |
| -------------- | --------------------------------------------------------------------------- |
| Etykieta       | Krótki tytuł, taki jak `Thinking...` lub `Shelling...`.                     |
| Wiersze postępu | Zwarte aktualizacje uruchomienia używające tych samych etykiet narzędzi i ikon co szczegółowe wyjście. |

Etykieta pojawia się po rozpoczęciu przez agenta znaczącej pracy i gdy pozostaje zajęty przez pięć sekund albo wyemituje drugie zdarzenie pracy. Odpowiedzi składające się wyłącznie ze zwykłego tekstu nie pokazują wersji roboczej postępu. Wiersze postępu są dodawane tylko wtedy, gdy agent emituje użyteczne aktualizacje pracy, na przykład `🛠️ Exec`, `🔎 Web Search` lub `✍️ Write: to /tmp/file`. Domyślnie używają tego samego zwartego trybu objaśnień co `/verbose`; ustaw `agents.defaults.toolProgressDetail: "raw"` podczas debugowania, gdy chcesz również dołączać surowe polecenia/szczegóły.
Końcowa odpowiedź zastępuje wersję roboczą, gdy jest to możliwe; w przeciwnym razie OpenClaw wysyła końcową odpowiedź normalnie i czyści albo przestaje aktualizować wersję roboczą zgodnie z transportem kanału.

## Wybierz tryb

`channels.<channel>.streaming.mode` steruje widocznym zachowaniem w toku:

| Tryb       | Najlepsze dla                    | Co pojawia się na czacie                         |
| ---------- | -------------------------------- | ------------------------------------------------ |
| `off`      | Ciche kanały                     | Tylko końcowa odpowiedź.                         |
| `partial`  | Obserwowanie pojawiania się tekstu odpowiedzi | Jedna wersja robocza edytowana najnowszym tekstem odpowiedzi. |
| `block`    | Większe fragmenty podglądu odpowiedzi | Jeden podgląd aktualizowany lub dołączany w większych fragmentach. |
| `progress` | Tury intensywnie korzystające z narzędzi lub długotrwałe | Jedna wersja robocza statusu, a potem końcowa odpowiedź. |

Wybierz `progress`, gdy użytkownikom bardziej zależy na tym, „co się dzieje”, niż na obserwowaniu strumieniowania tekstu odpowiedzi token po tokenie.

Wybierz `partial`, gdy sama odpowiedź jest sygnałem postępu.

Wybierz `block`, gdy chcesz aktualizacji podglądu wersji roboczej w większych fragmentach tekstu. W Discord i Telegram `streaming.mode: "block"` nadal oznacza strumieniowanie podglądu, a nie normalne dostarczanie blokowe. Użyj `streaming.block.enabled` lub starszego `blockStreaming`, gdy chcesz normalnych odpowiedzi blokowych.

## Skonfiguruj etykiety

Etykiety postępu znajdują się w `channels.<channel>.streaming.progress`.

Domyślna etykieta to `auto`, która wybiera z wbudowanej w OpenClaw puli jednoelementowych etykiet z wielokropkiem:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
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

Ukryj etykietę i pokaż tylko wiersze postępu:

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

## Kontroluj wiersze postępu

Wiersze postępu są domyślnie włączone w trybie postępu. Pochodzą z rzeczywistych zdarzeń uruchomienia: uruchomień narzędzi, aktualizacji elementów, planów zadań, zatwierdzeń, wyjścia poleceń, podsumowań poprawek i podobnej aktywności agenta.

OpenClaw używa tego samego formatera dla wersji roboczych postępu i `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` jest wartością domyślną i utrzymuje stabilność wersji roboczych dzięki zwięzłym etykietom, takim jak `🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` dołącza bazowe polecenie/szczegół, gdy jest dostępny, co jest przydatne podczas debugowania, ale bardziej hałaśliwe na czacie.

Na przykład to samo polecenie wygląda inaczej w zależności od trybu szczegółowości:

| Tryb      | Wiersz postępu                                                       |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

Ogranicz liczbę wierszy pozostających widocznymi:

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

Wiersze postępu są automatycznie kompaktowane, aby ograniczyć przełamywanie układu dymka czatu podczas edytowania wersji roboczej.

OpenClaw domyślnie skraca długie wiersze postępu, aby powtarzane edycje wersji roboczej nie zawijały się inaczej przy każdej aktualizacji. Prefiks pozostaje czytelny, a długie szczegóły, takie jak ścieżki lub surowe polecenia, są skracane wielokropkiem.

Slack może renderować wiersze postępu jako strukturalne pola Block Kit zamiast pojedynczej treści tekstowej:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

Renderowanie wzbogacone zachowuje ten sam zwykłotekstowy fallback, dzięki czemu kanały i klienci, którzy nie obsługują bogatszej formy, nadal mogą pokazać zwarty tekst postępu.

Zachowaj pojedynczą wersję roboczą postępu, ale ukryj wiersze narzędzi i zadań:

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

Przy `toolProgress: false` OpenClaw nadal wycisza starsze samodzielne wiadomości postępu narzędzi dla tej tury. Kanał pozostaje wizualnie cichy aż do końcowej odpowiedzi, z wyjątkiem etykiety, jeśli została skonfigurowana.

## Zachowanie kanałów

Każdy kanał używa najczystszego transportu, który obsługuje:

| Kanał           | Transport postępu                    | Uwagi                                                                 |
| --------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Discord         | Wysyła jedną wiadomość, a następnie ją edytuje. | Końcowy tekst jest edytowany w miejscu, gdy mieści się w jednej bezpiecznej wiadomości podglądu. |
| Matrix          | Wysyła jedno zdarzenie, a następnie je edytuje. | Konfiguracja strumieniowania na poziomie konta steruje wersjami roboczymi na poziomie konta. |
| Microsoft Teams | Natywny strumień Teams w czatach osobistych. | `streaming.mode: "block"` mapuje się na dostarczanie blokowe Teams.   |
| Slack           | Natywny strumień lub edytowalny post wersji roboczej. | Dostępność wątku wpływa na to, czy można użyć natywnego strumieniowania. |
| Telegram        | Wysyła jedną wiadomość, a następnie ją edytuje. | Starsze widoczne wersje robocze mogą zostać zastąpione, aby końcowe znaczniki czasu pozostały użyteczne. |
| Mattermost      | Edytowalny post wersji roboczej.     | Aktywność narzędzi jest składana do tego samego posta w stylu wersji roboczej. |

Kanały bez bezpiecznej obsługi edycji zwykle wracają do wskaźników pisania lub dostarczania tylko końcowej odpowiedzi.

## Finalizacja

Gdy końcowa odpowiedź jest gotowa, OpenClaw próbuje utrzymać czat w czystości:

- Jeśli wersja robocza może bezpiecznie stać się końcową odpowiedzią, OpenClaw edytuje ją w miejscu.
- Jeśli kanał używa natywnego strumieniowania postępu, OpenClaw finalizuje ten strumień, gdy natywny transport zaakceptuje końcowy tekst.
- Jeśli końcowa odpowiedź zawiera multimedia, monit zatwierdzenia, jawny cel odpowiedzi, zbyt wiele fragmentów albo nieudaną edycję/wysłanie, OpenClaw wysyła końcową odpowiedź przez normalną ścieżkę dostarczania kanału.

Ścieżka awaryjna jest celowa. Lepiej wysłać świeżą końcową odpowiedź, niż utracić tekst, błędnie przypisać odpowiedź do wątku albo nadpisać wersję roboczą ładunkiem, którego kanał nie potrafi bezpiecznie reprezentować.

## Rozwiązywanie problemów

**Widzę tylko końcową odpowiedź.**

Sprawdź, czy `channels.<channel>.streaming.mode` jest ustawione na `progress` dla konta lub kanału, który obsłużył wiadomość. Niektóre ścieżki grupowe lub odpowiedzi z cytatem mogą wyłączać podglądy wersji roboczych dla tury, gdy kanał nie może bezpiecznie edytować właściwej wiadomości.

**Widzę etykietę, ale nie widzę wierszy narzędzi.**

Sprawdź `streaming.progress.toolProgress`. Jeśli ma wartość `false`, OpenClaw zachowuje zachowanie pojedynczej wersji roboczej, ale ukrywa wiersze postępu narzędzi i zadań.

**Widzę świeżą wiadomość końcową zamiast edytowanej wersji roboczej.**

To awaryjne zachowanie bezpieczeństwa. Może wystąpić dla odpowiedzi z multimediami, długich odpowiedzi, jawnych celów odpowiedzi, starych wersji roboczych Telegram, brakujących celów wątków Slack, usuniętych wiadomości podglądu lub nieudanej finalizacji natywnego strumienia.

**Nadal widzę samodzielne wiadomości postępu.**

Tryb postępu wycisza domyślne samodzielne wiadomości postępu narzędzi, gdy wersja robocza jest aktywna. Jeśli samodzielne wiadomości nadal się pojawiają, sprawdź, czy tura rzeczywiście używa trybu postępu, a nie `streaming.mode: "off"` ani ścieżki kanału, która nie może utworzyć wersji roboczej dla tej wiadomości.

**Teams zachowuje się inaczej niż Discord lub Telegram.**

Microsoft Teams używa natywnego strumienia w czatach osobistych zamiast ogólnego transportu podglądu typu wyślij-i-edytuj. Teams traktuje też `streaming.mode: "block"` jako dostarczanie blokowe Teams, ponieważ nie ma tego samego trybu blokowego podglądu wersji roboczej, którego używają Discord i Telegram.

## Powiązane

- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
- [Wiadomości](/pl/concepts/messages)
- [Konfiguracja kanałów](/pl/gateway/config-channels)
- [Discord](/pl/channels/discord)
- [Matrix](/pl/channels/matrix)
- [Microsoft Teams](/pl/channels/msteams)
- [Slack](/pl/channels/slack)
- [Telegram](/pl/channels/telegram)
