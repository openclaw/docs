---
read_when:
    - Konfigurowanie widocznych aktualizacji postępu dla długotrwałych tur czatu
    - Wybór między trybami strumieniowania częściowego, blokowego i postępu
    - Wyjaśnienie, jak OpenClaw aktualizuje jedną wiadomość kanału podczas trwania pracy
    - Rozwiązywanie problemów z wersjami roboczymi postępu, samodzielnymi komunikatami postępu lub awaryjną finalizacją
summary: 'Robocze komunikaty postępu: jedna widoczna wiadomość o pracy w toku, która aktualizuje się podczas działania agenta'
title: Wersje robocze postępów
x-i18n:
    generated_at: "2026-06-27T17:28:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Szkice postępu sprawiają, że długotrwałe tury agenta wyglądają w czacie na aktywne, bez zamieniania rozmowy w stos tymczasowych odpowiedzi statusowych.

Gdy szkice postępu są włączone, OpenClaw tworzy jedną widoczną wiadomość roboczą dopiero wtedy, gdy tura wykaże, że wykonuje rzeczywistą pracę, aktualizuje ją, gdy agent czyta, planuje, wywołuje narzędzia lub czeka na zatwierdzenie, a następnie zamienia ten szkic w końcową odpowiedź, gdy kanał może to zrobić bezpiecznie.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Używaj szkiców postępu, gdy chcesz mieć jedną uporządkowaną wiadomość statusową podczas pracy intensywnie korzystającej z narzędzi oraz końcową odpowiedź po zakończeniu tury.

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

To zwykle wystarcza. OpenClaw wybierze automatyczną jednoznakową etykietę, poczeka, aż praca potrwa co najmniej pięć sekund lub wyemituje drugie zdarzenie pracy, doda zwarte wiersze postępu, gdy wykonywana jest użyteczna praca, i wyciszy zduplikowane, samodzielne komunikaty postępu dla tej tury.

## Co widzą użytkownicy

Szkic postępu ma dwie części:

| Część           | Cel                                                                                   |
| --------------- | ------------------------------------------------------------------------------------- |
| Etykieta        | Krótki wiersz początkowy/statusowy, taki jak `Working` lub `Shelling`.                |
| Wiersze postępu | Zwarte aktualizacje uruchomienia używające tych samych ikon narzędzi i formatowania szczegółów co wyjście szczegółowe. |

Etykieta pojawia się po rozpoczęciu przez agenta znaczącej pracy i gdy pozostaje on zajęty przez pięć sekund albo emituje drugie zdarzenie pracy. Jest częścią przewijanej listy wierszy postępu, więc początkowy status znika z widoku, gdy pojawi się wystarczająco dużo konkretnych informacji o pracy. Odpowiedzi zawierające wyłącznie zwykły tekst nie pokazują szkicu postępu. Wiersze postępu są dodawane tylko wtedy, gdy agent emituje użyteczne aktualizacje pracy, na przykład `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"` lub `✍️ Write: to /tmp/file`.
Domyślnie używają tego samego zwartego trybu wyjaśniania co `/verbose`; ustaw `agents.defaults.toolProgressDetail: "raw"` podczas debugowania, gdy chcesz także dołączać surowe polecenia/szczegóły.
Końcowa odpowiedź zastępuje szkic, gdy jest to możliwe; w przeciwnym razie OpenClaw wysyła końcową odpowiedź normalnie i czyści szkic albo przestaje go aktualizować zgodnie z transportem kanału.

## Wybór trybu

`channels.<channel>.streaming.mode` steruje widocznym zachowaniem podczas pracy:

| Tryb       | Najlepszy dla                         | Co pojawia się w czacie                              |
| ---------- | ------------------------------------- | ---------------------------------------------------- |
| `off`      | Ciche kanały                          | Tylko końcowa odpowiedź.                             |
| `partial`  | Obserwowanie pojawiania się tekstu odpowiedzi | Jeden szkic edytowany najnowszym tekstem odpowiedzi. |
| `block`    | Większe fragmenty podglądu odpowiedzi | Jeden podgląd aktualizowany lub dopisywany większymi fragmentami. |
| `progress` | Tury intensywnie korzystające z narzędzi lub długotrwałe | Jeden szkic statusu, potem końcowa odpowiedź.        |

Wybierz `progress`, gdy użytkownikom bardziej zależy na tym, „co się dzieje”, niż na obserwowaniu strumieniowania tekstu odpowiedzi token po tokenie.

Wybierz `partial`, gdy sama odpowiedź jest sygnałem postępu.

Wybierz `block`, gdy chcesz aktualizować szkic podglądu większymi fragmentami tekstu. W Discord i Telegram `streaming.mode: "block"` nadal oznacza strumieniowanie podglądu, a nie normalne dostarczanie blokowe. Użyj `streaming.block.enabled` lub starszego `blockStreaming`, gdy chcesz normalnych odpowiedzi blokowych.

## Konfiguracja etykiet

Etykiety postępu znajdują się w `channels.<channel>.streaming.progress`.

Domyślna etykieta to `auto`, która wybiera z wbudowanej w OpenClaw puli jednowyrazowych etykiet:

```text
Working
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

Wiersze postępu są domyślnie włączone w trybie postępu. Pochodzą z rzeczywistych zdarzeń uruchomienia: uruchomień narzędzi, aktualizacji elementów, planów zadań, zatwierdzeń, wyjścia poleceń, podsumowań łatek i podobnej aktywności agenta.

Narzędzia mogą także emitować typowany postęp, gdy pojedyncze wywołanie narzędzia nadal trwa. Dzięki temu powolne pobieranie lub wyszukiwanie może zaktualizować widoczny szkic, zanim narzędzie zwróci końcowy wynik. Aktualizacja postępu jest częściowym wynikiem narzędzia z pustą treścią modelu i jawnymi metadanymi kanału publicznego:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw renderuje w interfejsie postępu kanału tylko `progress.text`. Normalny wynik narzędzia nadal przychodzi później jako `content` i `details` i jest jedyną częścią zwracaną do modelu.

Dodając postęp do narzędzia, użyj krótkiego, ogólnego komunikatu i opóźnij go, dopóki operacja nie będzie oczekiwać wystarczająco długo, by komunikat był użyteczny:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Ten wzorzec oznacza, że szybkie wywołania nie pokazują wiersza postępu, długie wywołania pokazują jeden wiersz, gdy nadal oczekują, a anulowane wywołania czyszczą timer, zanim może pojawić się nieaktualny postęp. Tekst postępu jest publicznym kanałem bocznym interfejsu, więc nie może zawierać sekretów, surowych argumentów, pobranej treści, wyjścia poleceń ani tekstu strony.

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

`"explain"` jest ustawieniem domyślnym i utrzymuje stabilność szkiców za pomocą zwięzłych etykiet, takich jak `🛠️ check JS syntax for /tmp/app.js`. `"raw"` dołącza bazowe polecenie/szczegół, gdy jest dostępny, co jest przydatne podczas debugowania, ale bardziej zaśmieca czat.

Na przykład to samo polecenie wygląda inaczej w zależności od trybu szczegółowości:

| Tryb      | Wiersz postępu                                                |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Wiersze postępu są automatycznie kompaktowane, aby ograniczyć zmiany układu dymku czatu podczas edycji szkicu.

OpenClaw domyślnie skraca długie wiersze postępu, aby powtarzane edycje szkicu nie zawijały się inaczej przy każdej aktualizacji. Domyślny budżet na wiersz to 120 znaków. Proza jest ucinana na granicy słowa, a długie szczegóły, takie jak ścieżki lub surowe polecenia, są skracane wielokropkiem w środku, aby końcówka pozostała widoczna.

Dostosuj budżet na wiersz:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack może renderować wiersze postępu jako strukturalne pola Block Kit zamiast pojedynczego tekstu:

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

Renderowanie bogate zachowuje ten sam zwykłotekstowy fallback, dzięki czemu kanały i klienci, które nie obsługują bogatszej postaci, nadal mogą pokazywać zwarty tekst postępu.

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

Przy `toolProgress: false` OpenClaw nadal wycisza starsze, samodzielne wiadomości postępu narzędzi dla tej tury. Kanał pozostaje wizualnie cichy aż do końcowej odpowiedzi, z wyjątkiem etykiety, jeśli została skonfigurowana.

## Zachowanie kanałów

Każdy kanał używa najczystszego obsługiwanego transportu:

| Kanał           | Transport postępu                     | Uwagi                                                                 |
| --------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Wyślij jedną wiadomość, potem ją edytuj. | Końcowy tekst jest edytowany w miejscu, gdy mieści się w jednej bezpiecznej wiadomości podglądu. |
| Matrix          | Wyślij jedno zdarzenie, potem je edytuj. | Konfiguracja strumieniowania na poziomie konta steruje szkicami na poziomie konta. |
| Microsoft Teams | Natywny strumień Teams w czatach osobistych. | `streaming.mode: "block"` mapuje się na blokowe dostarczanie Teams. |
| Slack           | Natywny strumień lub edytowalny wpis szkicu. | Dostępność wątku wpływa na to, czy można użyć natywnego strumieniowania. |
| Telegram        | Wyślij jedną wiadomość, potem ją edytuj. | Starsze widoczne szkice mogą zostać zastąpione, aby końcowe znaczniki czasu pozostały użyteczne. |
| Mattermost      | Edytowalny wpis szkicu.               | Aktywność narzędzi jest składana do tego samego wpisu w stylu szkicu. |

Kanały bez bezpiecznej obsługi edycji zwykle przechodzą na wskaźniki pisania lub dostarczanie wyłącznie końcowej odpowiedzi.

## Finalizacja

Gdy końcowa odpowiedź jest gotowa, OpenClaw próbuje utrzymać czat w porządku:

- Jeśli szkic może bezpiecznie stać się końcową odpowiedzią, OpenClaw edytuje go w miejscu.
- Jeśli kanał używa natywnego strumieniowania postępu, OpenClaw finalizuje ten strumień, gdy natywny transport przyjmie końcowy tekst.
- Jeśli końcowa odpowiedź zawiera media, prompt zatwierdzenia, jawny cel odpowiedzi, zbyt wiele fragmentów albo nieudaną edycję/wysłanie, OpenClaw wysyła końcową odpowiedź przez normalną ścieżkę dostarczania kanału.

Ścieżka awaryjna jest celowa. Lepiej wysłać świeżą końcową odpowiedź, niż utracić tekst, błędnie przypiąć odpowiedź do wątku albo nadpisać szkic ładunkiem, którego kanał nie może bezpiecznie reprezentować.

## Rozwiązywanie problemów

**Widzę tylko końcową odpowiedź.**

Sprawdź, czy `channels.<channel>.streaming.mode` jest ustawione na `progress` dla konta lub kanału, który obsłużył wiadomość. Niektóre ścieżki grupowe lub odpowiedzi z cytatem mogą wyłączać podglądy szkiców dla tury, gdy kanał nie może bezpiecznie edytować właściwej wiadomości.

**Widzę etykietę, ale nie widzę wierszy narzędzi.**

Sprawdź `streaming.progress.toolProgress`. Jeśli ma wartość `false`, OpenClaw zachowuje zachowanie pojedynczego szkicu, ale ukrywa wiersze postępu narzędzi i zadań.

**Widzę nową końcową wiadomość zamiast edytowanego szkicu.**

To awaryjny mechanizm bezpieczeństwa. Może wystąpić przy odpowiedziach z mediami, długich odpowiedziach, jawnych celach odpowiedzi, starych szkicach Telegram, brakujących celach wątków Slack, usuniętych wiadomościach podglądu lub nieudanej finalizacji natywnego strumienia.

**Nadal widzę samodzielne wiadomości postępu.**

Tryb postępu wycisza domyślne samodzielne wiadomości postępu narzędzi, gdy szkic jest aktywny. Jeśli samodzielne wiadomości nadal się pojawiają, sprawdź, czy tura rzeczywiście używa trybu postępu, a nie `streaming.mode: "off"` ani ścieżki kanału, która nie może utworzyć szkicu dla tej wiadomości.

**Teams działa inaczej niż Discord lub Telegram.**

Microsoft Teams używa natywnego strumienia w czatach osobistych zamiast ogólnego
transportu podglądu wysyłania i edycji. Teams traktuje również `streaming.mode: "block"` jako
dostarczanie blokowe Teams, ponieważ nie ma tego samego blokowego trybu podglądu wersji roboczej,
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
