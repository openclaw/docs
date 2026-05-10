---
read_when:
    - Konfigurowanie widocznych aktualizacji postępu dla długotrwałych tur czatu
    - Wybór między trybami strumieniowania partial, block i progress
    - Wyjaśnienie, jak OpenClaw aktualizuje jedną wiadomość kanału podczas trwania pracy
    - Rozwiązywanie problemów z roboczymi wersjami postępu, samodzielnymi komunikatami postępu lub awaryjną finalizacją
summary: 'Wersje robocze postępu: jedna widoczna wiadomość o trwającej pracy aktualizowana podczas działania agenta'
title: Szkice postępów
x-i18n:
    generated_at: "2026-05-10T19:34:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d84027a412a2c62ea9a5698d015c7aeb8a7f27d9db79112bb2c1c10f97ebd88
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Robocze komunikaty postępu sprawiają, że długotrwałe tury agenta wyglądają w czacie na aktywne, bez zamieniania rozmowy w stos tymczasowych odpowiedzi statusowych.

Gdy robocze komunikaty postępu są włączone, OpenClaw tworzy jeden widoczny komunikat pracy w toku dopiero po tym, jak tura pokaże, że wykonuje rzeczywistą pracę, aktualizuje go, gdy agent czyta, planuje, wywołuje narzędzia lub czeka na zatwierdzenie, a następnie zamienia tę wersję roboczą w końcową odpowiedź, gdy kanał może zrobić to bezpiecznie.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Używaj roboczych komunikatów postępu, gdy chcesz mieć jeden uporządkowany komunikat statusowy podczas pracy intensywnie korzystającej z narzędzi oraz końcową odpowiedź po zakończeniu tury.

## Szybki start

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

To zwykle wystarcza. OpenClaw wybierze automatyczną jednoznakową etykietę słowną, poczeka, aż praca potrwa co najmniej pięć sekund lub wyemituje drugie zdarzenie pracy, doda zwięzłe wiersze postępu, gdy wykonywana jest użyteczna praca, i wyciszy zduplikowane samodzielne komunikaty postępu dla tej tury.

## Co widzą użytkownicy

Roboczy komunikat postępu ma dwie części:

| Część           | Cel                                                                                   |
| -------------- | ------------------------------------------------------------------------------------- |
| Etykieta        | Krótki wiersz początkowy/statusowy, taki jak `Thinking...` lub `Shelling...`.          |
| Wiersze postępu | Zwięzłe aktualizacje uruchomienia używające tych samych ikon narzędzi i formatera szczegółów co pełne wyjście. |

Etykieta pojawia się po tym, jak agent rozpocznie znaczącą pracę i pozostanie zajęty przez pięć sekund albo wyemituje drugie zdarzenie pracy. Jest częścią przewijanej listy wierszy postępu, więc status początkowy przewija się poza widok, gdy pojawi się wystarczająco dużo konkretnej pracy. Odpowiedzi zawierające wyłącznie zwykły tekst nie pokazują roboczego komunikatu postępu. Wiersze postępu są dodawane tylko wtedy, gdy agent emituje użyteczne aktualizacje pracy, na przykład `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"` lub `✍️ Write: to /tmp/file`.
Domyślnie używają tego samego zwięzłego trybu objaśniania co `/verbose`; ustaw `agents.defaults.toolProgressDetail: "raw"` podczas debugowania, gdy chcesz także dołączać surowe polecenia/szczegóły.
Końcowa odpowiedź zastępuje wersję roboczą, gdy to możliwe; w przeciwnym razie OpenClaw wysyła końcową odpowiedź normalnie i porządkuje albo przestaje aktualizować wersję roboczą zgodnie z transportem kanału.

## Wybór trybu

`channels.<channel>.streaming.mode` steruje widocznym zachowaniem pracy w toku:

| Tryb       | Najlepszy do                         | Co pojawia się w czacie                              |
| ---------- | ------------------------------------ | ---------------------------------------------------- |
| `off`      | Ciche kanały                         | Tylko końcowa odpowiedź.                             |
| `partial`  | Obserwowanie pojawiania się tekstu odpowiedzi | Jedna wersja robocza edytowana najnowszym tekstem odpowiedzi. |
| `block`    | Większe fragmenty podglądu odpowiedzi | Jeden podgląd aktualizowany lub dołączany w większych fragmentach. |
| `progress` | Tury intensywnie korzystające z narzędzi lub długotrwałe | Jedna wersja robocza statusu, potem końcowa odpowiedź. |

Wybierz `progress`, gdy użytkownikom bardziej zależy na tym, „co się dzieje”, niż na obserwowaniu strumieniowania tekstu odpowiedzi token po tokenie.

Wybierz `partial`, gdy sama odpowiedź jest sygnałem postępu.

Wybierz `block`, gdy chcesz aktualizacji podglądu wersji roboczej w większych fragmentach tekstu. W Discord i Telegram `streaming.mode: "block"` nadal oznacza strumieniowanie podglądu, a nie zwykłe dostarczanie blokowe. Użyj `streaming.block.enabled` albo starszego `blockStreaming`, gdy chcesz zwykłych odpowiedzi blokowych.

## Konfigurowanie etykiet

Etykiety postępu znajdują się w `channels.<channel>.streaming.progress`.

Domyślna etykieta to `auto`, która wybiera z wbudowanej w OpenClaw puli jednoznakowych etykiet słownych z wielokropkiem:

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

## Sterowanie wierszami postępu

Wiersze postępu są domyślnie włączone w trybie postępu. Pochodzą z rzeczywistych zdarzeń uruchomienia: startów narzędzi, aktualizacji elementów, planów zadań, zatwierdzeń, wyjścia poleceń, podsumowań poprawek i podobnej aktywności agenta.

OpenClaw używa tego samego formatera dla roboczych komunikatów postępu i `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` jest wartością domyślną i utrzymuje stabilność wersji roboczych dzięki zwięzłym etykietom, takim jak `🛠️ check JS syntax for /tmp/app.js`. `"raw"` dołącza bazowe polecenie/szczegół, gdy jest dostępne, co jest przydatne podczas debugowania, ale bardziej hałaśliwe w czacie.

Na przykład to samo polecenie wygląda inaczej w zależności od trybu szczegółowości:

| Tryb      | Wiersz postępu                                                  |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js`  |

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

Wiersze postępu są automatycznie kompaktowane, aby ograniczyć przełamywanie układu dymka czatu podczas edycji wersji roboczej.

OpenClaw domyślnie skraca długie wiersze postępu, aby powtarzane edycje wersji roboczej nie zawijały się inaczej przy każdej aktualizacji. Prefiks pozostaje czytelny, a długie szczegóły, takie jak ścieżki lub surowe polecenia, są skracane wielokropkiem.

Slack może renderować wiersze postępu jako ustrukturyzowane pola Block Kit zamiast pojedynczej treści tekstowej:

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

Renderowanie wzbogacone zachowuje ten sam awaryjny tekst zwykły, aby kanały i klienci, które nie obsługują bogatszej formy, nadal mogły wyświetlać zwięzły tekst postępu.

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

Przy `toolProgress: false` OpenClaw nadal wycisza starsze samodzielne komunikaty postępu narzędzi dla tej tury. Kanał pozostaje wizualnie cichy aż do końcowej odpowiedzi, z wyjątkiem etykiety, jeśli została skonfigurowana.

## Zachowanie kanałów

Każdy kanał używa najczystszego obsługiwanego transportu:

| Kanał           | Transport postępu                     | Uwagi                                                                 |
| --------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Wyślij jedną wiadomość, potem ją edytuj. | Końcowy tekst jest edytowany w miejscu, gdy mieści się w jednym bezpiecznym komunikacie podglądu. |
| Matrix          | Wyślij jedno zdarzenie, potem je edytuj. | Konfiguracja strumieniowania na poziomie konta steruje wersjami roboczymi na poziomie konta. |
| Microsoft Teams | Natywny strumień Teams w czatach osobistych. | `streaming.mode: "block"` mapuje się na dostarczanie blokowe Teams. |
| Slack           | Natywny strumień albo edytowalny post roboczy. | Dostępność wątku wpływa na to, czy można użyć natywnego strumieniowania. |
| Telegram        | Wyślij jedną wiadomość, potem ją edytuj. | Starsze widoczne wersje robocze mogą zostać zastąpione, aby końcowe znaczniki czasu pozostały użyteczne. |
| Mattermost      | Edytowalny post roboczy.              | Aktywność narzędzi jest składana do tego samego posta w stylu wersji roboczej. |

Kanały bez bezpiecznej obsługi edycji zwykle wracają do wskaźników pisania albo dostarczania wyłącznie końcowej odpowiedzi.

## Finalizacja

Gdy końcowa odpowiedź jest gotowa, OpenClaw próbuje utrzymać porządek w czacie:

- Jeśli wersja robocza może bezpiecznie stać się końcową odpowiedzią, OpenClaw edytuje ją w miejscu.
- Jeśli kanał używa natywnego strumieniowania postępu, OpenClaw finalizuje ten strumień, gdy natywny transport akceptuje końcowy tekst.
- Jeśli końcowa odpowiedź zawiera media, monit o zatwierdzenie, jawny cel odpowiedzi, zbyt wiele fragmentów albo nieudaną edycję/wysyłkę, OpenClaw wysyła końcową odpowiedź zwykłą ścieżką dostarczania kanału.

Ścieżka awaryjna jest celowa. Lepiej wysłać świeżą końcową odpowiedź niż utracić tekst, błędnie przypisać odpowiedź do wątku albo nadpisać wersję roboczą ładunkiem, którego kanał nie może bezpiecznie reprezentować.

## Rozwiązywanie problemów

**Widzę tylko końcową odpowiedź.**

Sprawdź, czy `channels.<channel>.streaming.mode` jest ustawione na `progress` dla konta lub kanału, który obsłużył wiadomość. Niektóre ścieżki grupowe lub odpowiedzi z cytatem mogą wyłączyć podglądy wersji roboczej dla tury, gdy kanał nie może bezpiecznie edytować właściwej wiadomości.

**Widzę etykietę, ale nie widzę wierszy narzędzi.**

Sprawdź `streaming.progress.toolProgress`. Jeśli ma wartość `false`, OpenClaw zachowuje zachowanie pojedynczej wersji roboczej, ale ukrywa wiersze postępu narzędzi i zadań.

**Widzę świeżą końcową wiadomość zamiast edytowanej wersji roboczej.**

To awaryjny mechanizm bezpieczeństwa. Może wystąpić przy odpowiedziach z mediami, długich odpowiedziach, jawnych celach odpowiedzi, starych wersjach roboczych Telegram, brakujących celach wątków Slack, usuniętych wiadomościach podglądu albo nieudanej finalizacji natywnego strumienia.

**Nadal widzę samodzielne komunikaty postępu.**

Tryb postępu wycisza domyślne samodzielne komunikaty postępu narzędzi, gdy wersja robocza jest aktywna. Jeśli samodzielne komunikaty nadal się pojawiają, sprawdź, czy tura rzeczywiście używa trybu postępu, a nie `streaming.mode: "off"` albo ścieżki kanału, która nie może utworzyć wersji roboczej dla tej wiadomości.

**Teams zachowuje się inaczej niż Discord lub Telegram.**

Microsoft Teams używa natywnego strumienia w czatach osobistych zamiast ogólnego transportu podglądu polegającego na wysłaniu i edycji. Teams traktuje też `streaming.mode: "block"` jako dostarczanie blokowe Teams, ponieważ nie ma tego samego trybu blokowego podglądu wersji roboczej, którego używają Discord i Telegram.

## Powiązane

- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
- [Wiadomości](/pl/concepts/messages)
- [Konfiguracja kanałów](/pl/gateway/config-channels)
- [Discord](/pl/channels/discord)
- [Matrix](/pl/channels/matrix)
- [Microsoft Teams](/pl/channels/msteams)
- [Slack](/pl/channels/slack)
- [Telegram](/pl/channels/telegram)
