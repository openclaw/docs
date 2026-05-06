---
read_when:
    - Konfigurowanie widocznych aktualizacji postępu dla długotrwałych tur czatu
    - Wybór między trybami strumieniowania częściowego, blokowego i postępu
    - Wyjaśnienie, jak OpenClaw aktualizuje jedną wiadomość w kanale podczas wykonywania pracy
    - Rozwiązywanie problemów z wersjami roboczymi postępu, samodzielnymi komunikatami o postępie lub mechanizmem awaryjnym finalizacji
summary: 'Szkice postępu: jeden widoczny komunikat o pracy w toku, aktualizowany podczas działania agenta'
title: Szkice postępów
x-i18n:
    generated_at: "2026-05-06T09:09:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Szkice postępu sprawiają, że długotrwałe tury agenta wydają się żywe na czacie, bez zamieniania
rozmowy w stos tymczasowych odpowiedzi ze statusem.

Gdy szkice postępu są włączone, OpenClaw tworzy jedną widoczną wiadomość roboczą
dopiero wtedy, gdy tura wykaże, że wykonuje rzeczywistą pracę, aktualizuje ją, gdy
agent czyta, planuje, wywołuje narzędzia lub czeka na zatwierdzenie, a następnie zamienia ten szkic
w odpowiedź końcową, gdy kanał może zrobić to bezpiecznie.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Używaj szkiców postępu, gdy chcesz mieć jedną uporządkowaną wiadomość statusową podczas pracy intensywnie korzystającej z narzędzi
oraz odpowiedź końcową po zakończeniu tury.

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

To zwykle wystarcza. OpenClaw wybierze automatyczną jednowyrazową etykietę, poczeka,
aż praca potrwa co najmniej pięć sekund albo wyemituje drugie zdarzenie pracy, doda zwięzłe
wiersze postępu, gdy będzie wykonywana użyteczna praca, i wyciszy zduplikowane samodzielne
komunikaty postępu dla tej tury.

## Co widzą użytkownicy

Szkic postępu ma dwie części:

| Część          | Cel                                                                         |
| -------------- | --------------------------------------------------------------------------- |
| Etykieta       | Krótki tytuł, taki jak `Thinking...` lub `Shelling...`.                     |
| Wiersze postępu | Zwięzłe aktualizacje przebiegu z tymi samymi etykietami narzędzi i ikonami co szczegółowe wyjście. |

Etykieta pojawia się po rozpoczęciu przez agenta znaczącej pracy i gdy pozostaje on zajęty
przez pięć sekund albo emituje drugie zdarzenie pracy. Odpowiedzi zawierające wyłącznie zwykły tekst nie
pokazują szkicu postępu. Wiersze postępu są dodawane tylko wtedy, gdy agent emituje użyteczne
aktualizacje pracy, na przykład `🛠️ Exec`, `🔎 Web Search` lub `✍️ Write: to /tmp/file`.
Domyślnie używają tego samego zwięzłego trybu objaśnień co `/verbose`; ustaw
`agents.defaults.toolProgressDetail: "raw"` podczas debugowania, gdy chcesz też dołączać surowe
polecenia/szczegóły.
Odpowiedź końcowa zastępuje szkic, gdy to możliwe; w przeciwnym razie
OpenClaw wysyła odpowiedź końcową normalnie i czyści albo przestaje aktualizować
szkic zgodnie z transportem kanału.

## Wybór trybu

`channels.<channel>.streaming.mode` kontroluje widoczne zachowanie w toku:

| Tryb       | Najlepszy do                       | Co pojawia się na czacie                          |
| ---------- | ---------------------------------- | ------------------------------------------------- |
| `off`      | Cichych kanałów                    | Tylko odpowiedź końcowa.                          |
| `partial`  | Obserwowania pojawiania się tekstu odpowiedzi | Jeden szkic edytowany najnowszym tekstem odpowiedzi. |
| `block`    | Większych fragmentów podglądu odpowiedzi | Jeden podgląd aktualizowany lub dołączany w większych fragmentach. |
| `progress` | Tur intensywnie korzystających z narzędzi lub długotrwałych | Jeden szkic statusu, potem odpowiedź końcowa. |

Wybierz `progress`, gdy użytkownikom bardziej zależy na tym, „co się dzieje”, niż na oglądaniu
strumieniowania tekstu odpowiedzi token po tokenie.

Wybierz `partial`, gdy sama odpowiedź jest sygnałem postępu.

Wybierz `block`, gdy chcesz otrzymywać aktualizacje podglądu szkicu w większych fragmentach tekstu. W
Discord i Telegram `streaming.mode: "block"` nadal oznacza strumieniowanie podglądu, a nie
normalne dostarczanie bloków. Użyj `streaming.block.enabled` lub starszego
`blockStreaming`, gdy chcesz normalnych odpowiedzi blokowych.

## Konfiguracja etykiet

Etykiety postępu znajdują się pod `channels.<channel>.streaming.progress`.

Domyślna etykieta to `auto`, która wybiera z wbudowanej w OpenClaw
puli jednowyrazowych etykiet z wielokropkiem:

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

## Kontrolowanie wierszy postępu

Wiersze postępu są domyślnie włączone w trybie postępu. Pochodzą z rzeczywistych zdarzeń przebiegu:
uruchomień narzędzi, aktualizacji elementów, planów zadań, zatwierdzeń, wyjścia poleceń, podsumowań poprawek
i podobnej aktywności agenta.

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

`"explain"` jest wartością domyślną i utrzymuje stabilność szkiców za pomocą zwięzłych etykiet, takich jak
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` dołącza bazowe
polecenie/szczegół, gdy jest dostępny, co jest przydatne podczas debugowania, ale powoduje więcej szumu na
czacie.

Na przykład to samo polecenie wygląda inaczej w zależności od trybu szczegółowości:

| Tryb      | Wiersz postępu                                                       |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Wiersze postępu są automatycznie kompaktowane, aby zmniejszyć przesuwanie dymku czatu podczas edytowania szkicu.

OpenClaw domyślnie obcina długie wiersze postępu, aby powtarzane edycje szkicu nie
zawijały się inaczej przy każdej aktualizacji. Prefiks pozostaje czytelny, a długie szczegóły,
takie jak ścieżki lub surowe polecenia, są skracane wielokropkiem.

Slack może renderować wiersze postępu jako strukturalne pola Block Kit zamiast
pojedynczej treści tekstowej:

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

Bogate renderowanie zachowuje ten sam zwykłotekstowy wariant awaryjny, dzięki czemu kanały i klienci, którzy
nie obsługują bogatszego kształtu, nadal mogą pokazać zwięzły tekst postępu.

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
wiadomości postępu narzędzi dla tej tury. Kanał pozostaje wizualnie cichy do
odpowiedzi końcowej, z wyjątkiem etykiety, jeśli została skonfigurowana.

## Zachowanie kanałów

Każdy kanał używa najczystszego obsługiwanego transportu:

| Kanał           | Transport postępu                    | Uwagi                                                                |
| --------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Discord         | Wysyła jedną wiadomość, potem ją edytuje. | Tekst końcowy jest edytowany w miejscu, gdy mieści się w jednej bezpiecznej wiadomości podglądu. |
| Matrix          | Wysyła jedno zdarzenie, potem je edytuje. | Konfiguracja strumieniowania na poziomie konta kontroluje szkice na poziomie konta. |
| Microsoft Teams | Natywny strumień Teams w czatach osobistych. | `streaming.mode: "block"` mapuje się na dostarczanie bloków Teams. |
| Slack           | Natywny strumień lub edytowalny wpis szkicu. | Dostępność wątku wpływa na to, czy można użyć natywnego strumieniowania. |
| Telegram        | Wysyła jedną wiadomość, potem ją edytuje. | Starsze widoczne szkice mogą zostać zastąpione, aby znaczniki czasu odpowiedzi końcowych pozostały użyteczne. |
| Mattermost      | Edytowalny wpis szkicu.              | Aktywność narzędzi jest składana do tego samego wpisu w stylu szkicu. |

Kanały bez bezpiecznej obsługi edycji zwykle wracają do wskaźników pisania lub
dostarczania tylko odpowiedzi końcowej.

## Finalizacja

Gdy odpowiedź końcowa jest gotowa, OpenClaw próbuje utrzymać porządek na czacie:

- Jeśli szkic może bezpiecznie stać się odpowiedzią końcową, OpenClaw edytuje go w miejscu.
- Jeśli kanał używa natywnego strumieniowania postępu, OpenClaw finalizuje ten strumień,
  gdy natywny transport zaakceptuje tekst końcowy.
- Jeśli odpowiedź końcowa zawiera multimedia, prośbę o zatwierdzenie, jawny cel odpowiedzi,
  zbyt wiele fragmentów albo nieudaną edycję/wysyłkę, OpenClaw wysyła odpowiedź końcową przez
  normalną ścieżkę dostarczania kanału.

Ścieżka awaryjna jest celowa. Lepiej wysłać świeżą odpowiedź końcową niż
stracić tekst, źle osadzić odpowiedź w wątku albo nadpisać szkic ładunkiem, którego kanał
nie może bezpiecznie reprezentować.

## Rozwiązywanie problemów

**Widzę tylko odpowiedź końcową.**

Sprawdź, czy `channels.<channel>.streaming.mode` jest ustawione na `progress` dla
konta lub kanału, który obsłużył wiadomość. Niektóre ścieżki grupowe lub odpowiedzi cytowanej mogą
wyłączyć podglądy szkiców dla tury, gdy kanał nie może bezpiecznie edytować właściwej
wiadomości.

**Widzę etykietę, ale nie widzę wierszy narzędzi.**

Sprawdź `streaming.progress.toolProgress`. Jeśli ma wartość `false`, OpenClaw zachowuje
zachowanie pojedynczego szkicu, ale ukrywa wiersze postępu narzędzi i zadań.

**Widzę nową wiadomość końcową zamiast edytowanego szkicu.**

To awaryjne zabezpieczenie. Może wystąpić przy odpowiedziach z multimediami, długich odpowiedziach,
jawnych celach odpowiedzi, starych szkicach Telegram, brakujących celach wątków Slack,
usuniętych wiadomościach podglądu lub nieudanej finalizacji natywnego strumienia.

**Nadal widzę samodzielne wiadomości postępu.**

Tryb postępu wycisza domyślne samodzielne wiadomości postępu narzędzi, gdy szkic
jest aktywny. Jeśli samodzielne wiadomości nadal się pojawiają, sprawdź, czy tura rzeczywiście
używa trybu postępu, a nie `streaming.mode: "off"` albo ścieżki kanału, która
nie może utworzyć szkicu dla tej wiadomości.

**Teams zachowuje się inaczej niż Discord lub Telegram.**

Microsoft Teams używa natywnego strumienia w czatach osobistych zamiast ogólnego
transportu podglądu typu wyślij-i-edytuj. Teams traktuje też `streaming.mode: "block"` jako
dostarczanie bloków Teams, ponieważ nie ma tego samego trybu podglądu blokowego szkicu,
którego używają Discord i Telegram.

## Powiązane

- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
- [Wiadomości](/pl/concepts/messages)
- [Konfiguracja kanałów](/pl/gateway/config-channels)
- [Discord](/pl/channels/discord)
- [Matrix](/pl/channels/matrix)
- [Microsoft Teams](/pl/channels/msteams)
- [Slack](/pl/channels/slack)
- [Telegram](/pl/channels/telegram)
