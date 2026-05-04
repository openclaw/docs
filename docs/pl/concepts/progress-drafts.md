---
read_when:
    - Konfigurowanie widocznych aktualizacji postępu dla długo trwających tur czatu
    - Wybór między trybami strumieniowania częściowego, blokowego i postępu
    - Wyjaśnienie, jak OpenClaw aktualizuje jedną wiadomość w kanale podczas trwania pracy
    - Rozwiązywanie problemów z wersjami roboczymi postępu, samodzielnymi komunikatami o postępie lub awaryjnym mechanizmem finalizacji
summary: 'Wersje robocze postępu: jedna widoczna wiadomość o pracy w toku, która aktualizuje się podczas działania agenta'
title: Wersje robocze postępu
x-i18n:
    generated_at: "2026-05-04T02:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Szkice postępu sprawiają, że długie tury agenta w czacie wydają się żywe, bez zmieniania
konwersacji w stos tymczasowych odpowiedzi statusowych.

Gdy szkice postępu są włączone, OpenClaw tworzy jedną widoczną wiadomość roboczą
dopiero po tym, jak tura potwierdzi, że wykonuje rzeczywistą pracę, aktualizuje ją, gdy
agent czyta, planuje, wywołuje narzędzia lub czeka na zatwierdzenie, a następnie zamienia
ten szkic w odpowiedź końcową, gdy kanał może zrobić to bezpiecznie.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Używaj szkiców postępu, gdy chcesz mieć jedną uporządkowaną wiadomość statusową podczas pracy
intensywnie korzystającej z narzędzi oraz odpowiedź końcową po zakończeniu tury.

## Szybki start

Włącz szkice postępu dla kanału za pomocą `streaming.mode: "progress"`:

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

To zwykle wystarcza. OpenClaw wybierze automatyczną jednoznakową etykietę, poczeka,
aż praca potrwa co najmniej pięć sekund lub wyemituje drugie zdarzenie pracy, doda zwięzłe
wiersze postępu, gdy dzieje się użyteczna praca, i wyciszy zduplikowane samodzielne
komunikaty postępu dla tej tury.

## Co Widzą Użytkownicy

Szkic postępu ma dwie części:

| Część           | Cel                                                                         |
| -------------- | --------------------------------------------------------------------------- |
| Etykieta        | Krótki tytuł, taki jak `Thinking...` lub `Shelling...`.                     |
| Wiersze postępu | Zwięzłe aktualizacje uruchomienia używające tych samych etykiet narzędzi i ikon co szczegółowe wyjście. |

Etykieta pojawia się po rozpoczęciu przez agenta znaczącej pracy i gdy pozostaje on zajęty
przez pięć sekund albo emituje drugie zdarzenie pracy. Odpowiedzi zawierające wyłącznie
zwykły tekst nie pokazują szkicu postępu. Wiersze postępu są dodawane tylko wtedy, gdy agent
emituje użyteczne aktualizacje pracy, na przykład `🛠️ Exec`, `🔎 Web Search` lub `✍️ Write: to /tmp/file`.
Domyślnie używają tego samego zwięzłego trybu wyjaśnień co `/verbose`; ustaw
`agents.defaults.toolProgressDetail: "raw"` podczas debugowania, gdy chcesz też dołączać surowe
polecenia/szczegóły.
Odpowiedź końcowa zastępuje szkic, gdy to możliwe; w przeciwnym razie
OpenClaw wysyła odpowiedź końcową normalnie i czyści szkic lub przestaje go aktualizować
zgodnie z transportem kanału.

## Wybór Trybu

`channels.<channel>.streaming.mode` kontroluje widoczne zachowanie w toku:

| Tryb       | Najlepsze dla                    | Co pojawia się w czacie                          |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Ciche kanały                     | Tylko odpowiedź końcowa.                          |
| `partial`  | Obserwowanie pojawiania się tekstu odpowiedzi | Jeden szkic edytowany najnowszym tekstem odpowiedzi. |
| `block`    | Większe fragmenty podglądu odpowiedzi | Jeden podgląd aktualizowany lub dołączany w większych fragmentach. |
| `progress` | Tury intensywnie korzystające z narzędzi lub długotrwałe | Jeden szkic statusu, potem odpowiedź końcowa.     |

Wybierz `progress`, gdy użytkownikom bardziej zależy na tym, „co się dzieje”, niż na obserwowaniu
strumieniowania tekstu odpowiedzi token po tokenie.

Wybierz `partial`, gdy sama odpowiedź jest sygnałem postępu.

Wybierz `block`, gdy chcesz otrzymywać aktualizacje podglądu szkicu w większych fragmentach tekstu. W
Discord i Telegram, `streaming.mode: "block"` nadal oznacza strumieniowanie podglądu, a nie
normalne dostarczanie bloków. Użyj `streaming.block.enabled` lub starszego
`blockStreaming`, gdy chcesz normalnych odpowiedzi blokowych.

## Konfigurowanie Etykiet

Etykiety postępu znajdują się w `channels.<channel>.streaming.progress`.

Domyślna etykieta to `auto`, która wybiera z wbudowanej w OpenClaw
puli jednoznakowych etykiet z wielokropkiem:

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

## Kontrola Wierszy Postępu

Wiersze postępu są domyślnie włączone w trybie postępu. Pochodzą z rzeczywistych
zdarzeń uruchomienia: startów narzędzi, aktualizacji elementów, planów zadań, zatwierdzeń, wyjścia
poleceń, podsumowań poprawek i podobnej aktywności agenta.

OpenClaw używa tego samego formatera dla szkiców postępu i `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` jest wartością domyślną i utrzymuje stabilność szkiców dzięki zwięzłym etykietom, takim jak
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` dołącza bazowe
polecenie/szczegół, gdy jest dostępny, co jest przydatne podczas debugowania, ale powoduje więcej szumu w
czacie.

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

Zachowaj pojedynczy szkic postępu, ale ukryj wiersze narzędzi i zadań:

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
wiadomości postępu narzędzi dla tej tury. Kanał pozostaje wizualnie cichy aż do
odpowiedzi końcowej, z wyjątkiem etykiety, jeśli została skonfigurowana.

## Zachowanie Kanałów

Każdy kanał używa najczystszego obsługiwanego transportu:

| Kanał           | Transport postępu                     | Uwagi                                                                |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Wyślij jedną wiadomość, a następnie ją edytuj. | Tekst końcowy jest edytowany w miejscu, gdy mieści się w jednej bezpiecznej wiadomości podglądu. |
| Matrix          | Wyślij jedno zdarzenie, a następnie je edytuj. | Konfiguracja strumieniowania na poziomie konta kontroluje szkice na poziomie konta. |
| Microsoft Teams | Natywny strumień Teams w czatach osobistych. | `streaming.mode: "block"` mapuje się na dostarczanie bloków Teams.    |
| Slack           | Natywny strumień lub edytowalny wpis szkicu. | Dostępność wątku wpływa na to, czy można użyć natywnego strumieniowania. |
| Telegram        | Wyślij jedną wiadomość, a następnie ją edytuj. | Starsze widoczne szkice mogą zostać zastąpione, aby końcowe znaczniki czasu pozostały użyteczne. |
| Mattermost      | Edytowalny wpis szkicu.                | Aktywność narzędzi jest składana do tego samego wpisu w stylu szkicu. |

Kanały bez bezpiecznej obsługi edycji zwykle wracają do wskaźników pisania lub
dostarczania wyłącznie odpowiedzi końcowej.

## Finalizacja

Gdy odpowiedź końcowa jest gotowa, OpenClaw próbuje utrzymać czat w czystości:

- Jeśli szkic może bezpiecznie stać się odpowiedzią końcową, OpenClaw edytuje go w miejscu.
- Jeśli kanał używa natywnego strumieniowania postępu, OpenClaw finalizuje ten strumień,
  gdy natywny transport akceptuje tekst końcowy.
- Jeśli odpowiedź końcowa zawiera multimedia, monit o zatwierdzenie, jawny cel odpowiedzi,
  zbyt wiele fragmentów albo nieudaną edycję/wysyłkę, OpenClaw wysyła odpowiedź końcową przez
  normalną ścieżkę dostarczania kanału.

Ścieżka awaryjna jest celowa. Lepiej wysłać świeżą odpowiedź końcową, niż
utracić tekst, błędnie przypiąć odpowiedź do wątku lub nadpisać szkic ładunkiem, którego kanał
nie potrafi bezpiecznie reprezentować.

## Rozwiązywanie Problemów

**Widzę tylko odpowiedź końcową.**

Sprawdź, czy `channels.<channel>.streaming.mode` jest ustawione na `progress` dla
konta lub kanału, który obsłużył wiadomość. Niektóre ścieżki grupowe lub odpowiedzi z cytatem mogą
wyłączyć podglądy szkiców dla tury, gdy kanał nie może bezpiecznie edytować właściwej
wiadomości.

**Widzę etykietę, ale bez wierszy narzędzi.**

Sprawdź `streaming.progress.toolProgress`. Jeśli ma wartość `false`, OpenClaw zachowuje
zachowanie pojedynczego szkicu, ale ukrywa wiersze postępu narzędzi i zadań.

**Widzę świeżą wiadomość końcową zamiast edytowanego szkicu.**

To awaryjne zachowanie bezpieczeństwa. Może wystąpić przy odpowiedziach z multimediami, długich odpowiedziach,
jawnych celach odpowiedzi, starych szkicach Telegram, brakujących celach wątków Slack,
usuniętych wiadomościach podglądu lub nieudanej finalizacji natywnego strumienia.

**Nadal widzę samodzielne wiadomości postępu.**

Tryb postępu wycisza domyślne samodzielne wiadomości postępu narzędzi, gdy szkic
jest aktywny. Jeśli samodzielne wiadomości nadal się pojawiają, sprawdź, czy tura rzeczywiście
używa trybu postępu, a nie `streaming.mode: "off"` ani ścieżki kanału, która
nie może utworzyć szkicu dla tej wiadomości.

**Teams zachowuje się inaczej niż Discord lub Telegram.**

Microsoft Teams używa natywnego strumienia w czatach osobistych zamiast ogólnego
transportu podglądu typu wyślij-i-edytuj. Teams traktuje też `streaming.mode: "block"` jako
dostarczanie bloków Teams, ponieważ nie ma tego samego trybu blokowego podglądu szkicu
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
