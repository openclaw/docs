---
read_when:
    - Konfigurowanie widocznych aktualizacji postępu dla długotrwałych tur czatu
    - Wybór między trybami strumieniowania częściowego, blokowego i postępu
    - Objaśnienie, jak OpenClaw aktualizuje jedną wiadomość kanału podczas trwania pracy
    - Wersje robocze postępu rozwiązywania problemów, samodzielne komunikaty o postępie lub mechanizm awaryjny finalizacji
summary: 'Wersje robocze postępu: jedna widoczna wiadomość o postępie prac, aktualizowana podczas działania agenta'
title: Wersje robocze postępów
x-i18n:
    generated_at: "2026-07-16T18:20:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Wersje robocze postępu przekształcają jedną wiadomość kanału w dynamiczny wiersz stanu podczas
pracy agenta, zamiast stosu tymczasowych odpowiedzi „praca nadal trwa”. Ustaw
`channels.<channel>.streaming.mode: "progress"`, a OpenClaw utworzy
wiadomość po rozpoczęciu rzeczywistej pracy, będzie ją edytować, gdy agent czyta, planuje, wywołuje
narzędzia lub czeka na zatwierdzenie, a następnie przekształci ją w odpowiedź końcową.

```text
Praca w toku...
📖 z docs/concepts/progress-drafts.md
🔎 Wyszukiwanie w sieci: „discord edit message”
🛠️ Bash: uruchamianie testów
```

<Note>
  Discord domyślnie używa już `streaming.mode: "progress"`, gdy
  `channels.discord.streaming` nie jest ustawione, dlatego wersje robocze postępu
  pojawiają się tam bez żadnej konfiguracji. Każdy inny kanał domyślnie używa `partial`
  lub `off`; pełną tabelę wartości domyślnych dla poszczególnych kanałów zawiera sekcja [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming#channel-mapping).
</Note>

## Szybki start

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

Od tego miejsca wartości domyślne to: opóźnienie rozpoczęcia wynoszące 5 sekund, zwarte wiersze postępu podczas
wykonywania użytecznej pracy oraz pomijanie starszych, samodzielnych komunikatów o postępie
dla tej tury. Wersje robocze surowych wierszy narzędzi używają
automatycznej jednowyrazowej etykiety; nagłówek stanu pomija ten zbędny tytuł,
chyba że zostanie on jawnie skonfigurowany.

Ta strona opisuje działanie wersji roboczych postępu oraz ich opcje konfiguracji. Pełną
macierz trybów strumieniowania, uwagi dotyczące środowiska wykonawczego poszczególnych kanałów oraz migrację
starszych kluczy zawiera sekcja [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming).

## Co widzą użytkownicy

| Część           | Przeznaczenie                                                                     |
| --------------- | --------------------------------------------------------------------------------- |
| Nagłówek stanu  | W Discord i Telegram: wstęp modelu; Discord dodaje pomocniczy tekst zastępczy.    |
| Etykieta        | Opcjonalny wiersz początkowy/stanu, taki jak `Working`.                  |
| Wiersze postępu | Zwarte aktualizacje przebiegu używające tych samych ikon narzędzi i formatera szczegółów co `/verbose`. |

W przypadku surowego postępu narzędzi etykieta pojawia się, gdy agent rozpocznie istotną pracę
i pozostaje zajęty przez początkowy czas opóźnienia.
Znajduje się na górze przewijanej listy wierszy postępu, więc znika po pojawieniu się
wystarczającej liczby konkretnych wierszy pracy. Nagłówek stanu wyświetla tylko opis stanu agenta
w zwykłym języku, chyba że etykieta zostanie jawnie skonfigurowana. Odpowiedzi zawierające wyłącznie
zwykły tekst nigdy nie wyświetlają wersji roboczej postępu; wiersz pojawia się tylko przy rzeczywistych aktualizacjach pracy,
na przykład `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
lub `✍️ Write: to /tmp/file`.

Odpowiedź końcowa zastępuje wersję roboczą w miejscu, gdy kanał może to bezpiecznie zrobić;
w przeciwnym razie OpenClaw wysyła odpowiedź końcową standardowym mechanizmem dostarczania oraz
usuwa wersję roboczą lub przestaje ją aktualizować (zobacz [Finalizacja](#finalization)).

## Wybór trybu

`channels.<channel>.streaming.mode` steruje widocznym zachowaniem podczas pracy:

| Tryb       | Najlepsze zastosowanie             | Co pojawia się na czacie                           |
| ---------- | ---------------------------------- | -------------------------------------------------- |
| `off`      | Ciche kanały                       | Tylko odpowiedź końcowa.                           |
| `partial`  | Obserwowanie pojawiania się tekstu odpowiedzi | Jedna wersja robocza edytowana najnowszym tekstem odpowiedzi. |
| `block`    | Większe fragmenty podglądu odpowiedzi | Jeden podgląd aktualizowany lub rozszerzany większymi fragmentami. |
| `progress` | Tury intensywnie korzystające z narzędzi lub trwające długo | Jedna wersja robocza stanu, a następnie odpowiedź końcowa. |

Wybierz `progress`, gdy użytkownikom bardziej zależy na tym, „co się dzieje”, niż na obserwowaniu
strumieniowania tekstu odpowiedzi token po tokenie; `partial`, gdy sam tekst odpowiedzi jest
sygnałem postępu; `block` w przypadku większych fragmentów podglądu. W Discord i
Telegram `streaming.mode: "block"` nadal oznacza strumieniowanie podglądu, a nie standardowe
dostarczanie odpowiedzi blokami — do tego celu użyj `streaming.block.enabled`.

## Konfigurowanie etykiet

Etykiety postępu znajdują się w `channels.<channel>.streaming.progress`. Domyślna
etykieta surowego wiersza narzędzia to `"auto"`, która używa zwykłej wbudowanej etykiety `Working`.
Nagłówek stanu ukrywa tę niejawną etykietę; ustaw jawnie
`label: "auto"`, jeśli etykieta ma być również wyświetlana nad nim:

```text
Praca w toku
```

Użycie stałej etykiety:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Analizowanie",
        },
      },
    },
  },
}
```

Użycie własnej puli etykiet (nadal wybieranych losowo/na podstawie ziarna, gdy `label: "auto"`):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Sprawdzanie", "Czytanie", "Testowanie", "Kończenie"],
        },
      },
    },
  },
}
```

Ukrycie etykiety i wyświetlanie tylko wierszy postępu:

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

Wiersze postępu pochodzą z rzeczywistych zdarzeń przebiegu: uruchomień narzędzi, aktualizacji elementów, planów
zadań, zatwierdzeń, danych wyjściowych poleceń, podsumowań poprawek i podobnej aktywności agenta.
Są domyślnie włączone (`progress.toolProgress`, wartość domyślna `true`).

Narzędzia mogą również emitować typowane informacje o postępie, gdy pojedyncze wywołanie nadal trwa. Dzięki temu
powolne pobieranie lub wyszukiwanie aktualizuje widoczną wersję roboczą, zanim narzędzie
zwróci wynik końcowy. Aktualizacja postępu jest częściowym wynikiem narzędzia z
pustą zawartością modelu i jawnymi publicznymi metadanymi kanału:

```json
{
  "content": [],
  "progress": {
    "text": "Pobieranie zawartości strony...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw renderuje w interfejsie postępu kanału tylko `progress.text`. Standardowy
wynik narzędzia nadal pojawia się później jako `content`/`details` i jest jedyną częścią
zwracaną do modelu.

Dodając postęp do narzędzia, należy emitować krótki, ogólny komunikat i opóźnić go,
aż operacja będzie oczekiwać wystarczająco długo, by komunikat był użyteczny. `web_fetch`
robi dokładnie to z opóźnieniem 5 sekund:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Pobieranie zawartości strony...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Szybkie wywołania nie wyświetlają wiersza postępu; długie wywołania wyświetlają go podczas oczekiwania;
anulowane wywołania czyszczą licznik czasu, zanim pojawi się nieaktualna informacja o postępie. Tekst postępu
jest publicznym kanałem pobocznym interfejsu, dlatego nigdy nie może zawierać danych poufnych, surowych argumentów,
pobranej zawartości, danych wyjściowych poleceń ani tekstu strony.

### Tryb szczegółów

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

`"explain"` jest wartością domyślną i zachowuje stabilność wersji roboczych dzięki zwięzłym etykietom.
`"raw"` dołącza bazowe polecenie, gdy jest dostępne, co przydaje się podczas
debugowania, ale zwiększa ilość informacji na czacie. Na przykład wywołanie `node --check /tmp/app.js`
jest renderowane inaczej w zależności od trybu:

| Tryb      | Wiersz postępu                                                  |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                                      |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js`                                  |

### Tekst polecenia/exec

`streaming.progress.commandText` (wartość domyślna `"raw"`) steruje ilością szczegółów polecenia
wyświetlanych obok wierszy postępu exec/bash, niezależnie od powyższego trybu szczegółów.
Ustaw wartość `"status"`, aby zachować widoczny wiersz postępu narzędzia, jednocześnie całkowicie ukrywając
tekst polecenia:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Warstwa komentarza

`streaming.progress.commentary` (wartość domyślna `false`) przeplata narrację komentarza/wstępu modelu
sprzed użycia narzędzia (💬, na przykład „Sprawdzę... a następnie
...”) z wierszami narzędzi w wersji roboczej. Wspólny kształt konfiguracji dla wszystkich kanałów opisano w sekcji
[Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming#commentary-progress-lane).

Gdy warstwa komentarza jest włączona, wstępy są renderowane tylko jako te przeplatane
wiersze 💬; poniższy nagłówek stanu pozostaje ukryty, dzięki czemu warstwa zachowuje swój
udokumentowany kształt.

### Nagłówek stanu

W Discord i Telegram w trybie postępu typowany wstęp modelu sprzed użycia narzędzia
staje się nagłówkiem stanu wersji roboczej, gdy tylko jest dostępny. Inne
kanały w trybie postępu zachowują dotychczasowe działanie stanu. Nagłówek jest
domyślnie włączony i nie omija standardowej bramki aktywności dla krótkich tur;
włączenie `streaming.progress.commentary` przekazuje wstępy do przeplatanej
warstwy komentarza.

W Discord, gdy dla agenta zostanie wybrany model pomocniczy — jawny
[`utilityModel`](/pl/gateway/config-agents#utilitymodel) albo zadeklarowany domyślny mały model
głównego dostawcy (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — dostarcza on krótki tekst zastępczy w zwykłym języku,
gdy model nie emituje wstępu lub milczy od około 20 sekund
(nagłówek Telegram obecnie korzysta wyłącznie ze wstępu):

```text
Aktualizowanie domyślnego modelu w konfiguracji, a następnie ponowne uruchamianie Gateway,
aby zastosować zmianę. Jedno wywołanie listy agentów nie powiodło się i jest ponawiane.
```

Narracja pomocnicza jest domyślnie włączona (`streaming.progress.narration`, wartość domyślna
`true`) i nigdy nie korzysta awaryjnie z modelu głównego: działa tylko z jawnym
`utilityModel` lub domyślnym modelem zadeklarowanym przez dostawcę dla głównego
dostawcy agenta. Ustaw `utilityModel: ""`, aby całkowicie wyłączyć kierowanie do modelu pomocniczego. Wiersze narzędzi
nadal gromadzą się poniżej i pojawiają się ponownie, jeśli oba źródła stanu przestaną działać. Edycje
wersji roboczej nadal czekają na standardową bramkę aktywności i rzeczywistą
zmianę tekstu, co zapobiega krótkim mignięciom przy szybkich turach i ogranicza częstotliwość edycji w aktywnych
kanałach. Ustaw `narration: false`, aby wyłączyć tylko tekst zastępczy modelu pomocniczego; nagłówki
wstępu modelu pozostaną włączone:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

Dane wejściowe narracji są ograniczane i redagowane: model pomocniczy otrzymuje
tekst przychodzącego żądania oraz te same zwarte, zredagowane podsumowania narzędzi, które renderowałaby wersja robocza
— nigdy surowe dane wyjściowe poleceń ani wyniki narzędzi. Przy ustawieniu
`commandText: "status"` dane wejściowe narracji pomijają również tekst poleceń exec/bash,
zgodnie z zawartością wersji roboczej.

### Limity wierszy

Ograniczenie liczby widocznych wierszy (domyślnie 8):

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

Wiersze postępu są automatycznie zagęszczane, aby ograniczyć zmianę układu dymka czatu podczas
edytowania wersji roboczej, a OpenClaw skraca długie wiersze, aby wielokrotne edycje wersji roboczej
nie powodowały innego zawijania przy każdej aktualizacji. Domyślny limit na wiersz wynosi 120
znaków; tekst prozatorski jest ucinany na granicy słowa, natomiast długie szczegóły, takie jak ścieżki lub
surowe polecenia, są skracane wielokropkiem pośrodku, aby końcówka pozostała widoczna.

Dostosowanie limitu na wiersz:

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

### Rozszerzone renderowanie (Slack)

Slack może renderować wiersze postępu jako strukturalne pola Block Kit zamiast
zwykłego tekstu:

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

Rozszerzone renderowanie zawsze wysyła ten sam tekst zwykły wraz z polami Block Kit,
dzięki czemu klienty, które nie mogą renderować bogatszej postaci, nadal wyświetlają zwarty
tekst postępu.

### Ukrywanie wierszy narzędzi/zadań

Zachowanie pojedynczej wersji roboczej postępu przy jednoczesnym ukryciu wierszy narzędzi i zadań:

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

Z `toolProgress: false` OpenClaw nadal pomija starsze, samodzielne
komunikaty o postępie narzędzi w tej turze — kanał pozostaje wizualnie nieaktywny aż do
ostatecznej odpowiedzi, z wyjątkiem etykiety, jeśli została skonfigurowana.

## Zachowanie kanałów

| Kanał           | Transport postępu                              | Uwagi                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Wysłanie jednej wiadomości, a następnie jej edycja. | Domyślnie używa trybu `progress`; ostateczna odpowiedź zawiera potwierdzenie aktywności `-#`, a wersja robocza statusu jest usuwana po dostarczeniu odpowiedzi.                     |
| Matrix          | Wysłanie jednego zdarzenia, a następnie jego edycja. | Konfiguracja strumieniowania na poziomie konta steruje wersjami roboczymi na poziomie konta.                                                                                                           |
| Microsoft Teams | Natywny strumień Teams w czatach osobistych.        | `streaming.mode: "block"` jest zamiast tego mapowane na dostarczanie bloków Teams.                                                                                                                            |
| Slack           | Natywny strumień lub edytowalny wpis roboczy.       | Wymaga docelowego wątku odpowiedzi; wiadomości prywatne najwyższego poziomu bez takiego wątku nadal otrzymują wpisy z podglądem wersji roboczej i ich aktualizacje.                                     |
| Telegram        | Wysłanie jednej wiadomości, a następnie jej edycja. | Jeśli między wersją roboczą postępu a odpowiedzią pojawi się wiadomość, wersja robocza zostanie opublikowana ponownie pod nią (najpierw publikacja nowej, potem usunięcie starej), zamiast przewijać klienta skokowo. |
| Mattermost      | Edytowalny wpis roboczy.                            | Tryb `block` przełącza się między ukończonym tekstem a wpisami aktywności narzędzi; inne tryby łączą aktywność narzędzi w tym samym wpisie w stylu wersji roboczej.                           |

Kanały bez bezpiecznej obsługi edycji używają zastępczo wskaźników pisania lub
dostarczają wyłącznie ostateczną odpowiedź. Pełne zestawienie zachowania środowiska wykonawczego dla poszczególnych kanałów
znajduje się w sekcji [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming).

## Finalizacja

Gdy ostateczna odpowiedź jest gotowa, OpenClaw próbuje zachować porządek na czacie:

- W trybie `progress` na Discordzie ostateczna odpowiedź jest wysyłana jako nowa wiadomość
  z dołączonym niewielkim potwierdzeniem aktywności `-#` (na przykład
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), a wersja robocza statusu jest
  usuwana po dostarczeniu tej odpowiedzi. W aktywnych kanałach nad odpowiedzią nie pozostaje osierocony
  dziennik narzędzi; w przypadku ostatecznych odpowiedzi o błędzie wersja robocza pozostaje widocznym zapisem
  nieudanej tury.
- Jeśli wersję roboczą można bezpiecznie przekształcić w ostateczną odpowiedź (tryby `partial`/`block`),
  OpenClaw edytuje ją w miejscu.
- Jeśli kanał korzysta z natywnego strumieniowania postępu, OpenClaw finalizuje ten
  strumień, gdy natywny transport zaakceptuje ostateczny tekst.
- W przeciwnym razie (multimedia, prośba o zatwierdzenie, jawny cel odpowiedzi, zbyt wiele
  fragmentów albo nieudana edycja lub wysyłka) OpenClaw wysyła ostateczną odpowiedź zwykłą
  ścieżką dostarczania kanału, zamiast nadpisywać wersję roboczą.

To zachowanie zastępcze jest celowe: wysłanie nowej ostatecznej odpowiedzi jest lepsze niż utrata tekstu,
umieszczenie odpowiedzi w niewłaściwym wątku lub nadpisanie wersji roboczej ładunkiem, którego kanał
nie może bezpiecznie przedstawić.

## Rozwiązywanie problemów

**Widoczna jest tylko ostateczna odpowiedź.**

Należy sprawdzić, czy `channels.<channel>.streaming.mode` ma wartość `progress` dla konta
lub kanału, który obsłużył wiadomość. Niektóre ścieżki grupowe lub odpowiedzi z cytatem wyłączają
podglądy wersji roboczych w danej turze, gdy kanał nie może bezpiecznie edytować właściwej
wiadomości.

**Widoczna jest etykieta, ale nie ma wierszy narzędzi.**

Należy sprawdzić `streaming.progress.toolProgress`. Jeśli ma wartość `false`, OpenClaw zachowuje
działanie pojedynczej wersji roboczej, ale ukrywa wiersze postępu narzędzi i zadań.

**Zamiast edytowanej wersji roboczej widoczna jest nowa ostateczna wiadomość.**

Jest to bezpieczne zachowanie zastępcze opisane w sekcji [Finalizacja](#finalization). Może
wystąpić w przypadku odpowiedzi multimedialnych, długich odpowiedzi, jawnych celów odpowiedzi, starych wersji roboczych
Telegrama, brakujących docelowych wątków Slacka, usuniętych wiadomości podglądu lub nieudanej
finalizacji natywnego strumienia.

**Nadal widoczne są samodzielne komunikaty o postępie.**

Tryb postępu pomija domyślne, samodzielne komunikaty o postępie narzędzi, gdy aktywna jest
wersja robocza. Jeśli samodzielne komunikaty nadal się pojawiają, należy potwierdzić, że tura
rzeczywiście korzysta z trybu `progress`, a nie `streaming.mode: "off"` ani ze ścieżki
kanału, która nie może utworzyć wersji roboczej dla tej wiadomości.

**Teams działa inaczej niż Discord lub Telegram.**

Microsoft Teams używa natywnego strumienia w czatach osobistych zamiast ogólnego
transportu podglądu opartego na wysyłaniu i edycji oraz mapuje `streaming.mode: "block"` na
dostarczanie bloków Teams, ponieważ nie ma trybu blokowego podglądu wersji roboczej, takiego jak Discord i
Telegram.

## Powiązane

- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
- [Wiadomości](/pl/concepts/messages)
- [Konfiguracja kanałów](/pl/gateway/config-channels)
- [Discord](/pl/channels/discord)
- [Matrix](/pl/channels/matrix)
- [Microsoft Teams](/pl/channels/msteams)
- [Slack](/pl/channels/slack)
- [Telegram](/pl/channels/telegram)
- [Mattermost](/pl/channels/mattermost)
