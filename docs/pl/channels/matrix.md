---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie szyfrowania E2EE i weryfikacji w Matrix
summary: Status obsługi Matrix, konfiguracja wstępna i przykłady konfiguracji
title: Macierz
x-i18n:
    generated_at: "2026-07-12T14:48:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix to kanał dostępny do pobrania jako Plugin (`@openclaw/matrix`), zbudowany na oficjalnym pakiecie `matrix-js-sdk`. Obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Instalacja

```bash
openclaw plugins install @openclaw/matrix
```

Specyfikacje Pluginów bez prefiksu są najpierw wyszukiwane w ClawHub, a następnie awaryjnie w npm. Aby wymusić źródło, użyj `openclaw plugins install clawhub:@openclaw/matrix` lub `npm:@openclaw/matrix`. Z lokalnego repozytorium: `openclaw plugins install ./path/to/local/matrix-plugin`.

Polecenie `plugins install` rejestruje i włącza Plugin; oddzielny krok `enable` nie jest potrzebny. Kanał nadal nie będzie nic robić, dopóki nie zostanie skonfigurowany zgodnie z poniższymi instrukcjami. Ogólne zasady instalacji opisano w sekcji [Pluginy](/pl/tools/plugin).

## Konfiguracja

1. Utwórz konto Matrix na swoim serwerze macierzystym.
2. Skonfiguruj `channels.matrix` za pomocą `homeserver` + `accessToken` albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie Gateway.
4. Rozpocznij wiadomość prywatną z botem lub zaproś go do pokoju. Nowe zaproszenia zostaną przyjęte tylko wtedy, gdy zezwala na to [`autoJoin`](#auto-join).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o adres URL serwera macierzystego, metodę uwierzytelniania (token lub hasło), identyfikator użytkownika (tylko przy uwierzytelnianiu hasłem), opcjonalną nazwę urządzenia, włączenie E2EE oraz dostęp do pokojów i automatyczne dołączanie. Jeśli odpowiednie zmienne środowiskowe `MATRIX_*` już istnieją, a konto nie ma zapisanych danych uwierzytelniających, kreator proponuje skrót wykorzystujący zmienne środowiskowe. Przed zapisaniem listy dozwolonych rozwiąż nazwy pokojów za pomocą `openclaw channels resolve --channel matrix "Project Room"`. Włączenie E2EE w kreatorze uruchamia tę samą inicjalizację co [`openclaw matrix encryption setup`](#encryption-and-verification).

### Konfiguracja minimalna

Na podstawie tokenu:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Na podstawie hasła (token jest buforowany po pierwszym logowaniu):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### Automatyczne dołączanie

Domyślną wartością `channels.matrix.autoJoin` jest `"off"`: bot nie pojawi się w nowych pokojach ani wiadomościach prywatnych z nowych zaproszeń, dopóki nie dołączysz ręcznie. W chwili otrzymania zaproszenia OpenClaw nie może określić, czy dotyczy ono wiadomości prywatnej, czy grupy, dlatego każde zaproszenie najpierw podlega ustawieniu `autoJoin`; `dm.policy` jest stosowane dopiero później, gdy bot dołączy, a pokój zostanie sklasyfikowany.

<Warning>
Ustaw `autoJoin: "allowlist"` wraz z `autoJoinAllowlist`, aby ograniczyć przyjmowane zaproszenia, albo `autoJoin: "always"`, aby przyjmować każde zaproszenie.

`autoJoinAllowlist` akceptuje wyłącznie `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokojów są odrzucane; aliasy są rozwiązywane względem serwera macierzystego, a nie na podstawie stanu deklarowanego przez pokój, do którego otrzymano zaproszenie.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

### Formaty celów list dozwolonych

- Wiadomości prywatne (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): użyj `@user:server`. Nazwy wyświetlane są domyślnie ignorowane, ponieważ mogą się zmieniać; ustaw `dangerouslyAllowNameMatching: true` tylko w celu jawnego zachowania zgodności z dopasowywaniem nazw wyświetlanych.
- Klucze listy dozwolonych pokojów (`groups`, starszy alias `rooms`): użyj `!room:server` lub `#alias:server`. Zwykłe nazwy są ignorowane, chyba że ustawiono `dangerouslyAllowNameMatching: true`.
- Listy dozwolonych zaproszeń (`autoJoinAllowlist`): użyj `!room:server`, `#alias:server` lub `*`. Zwykłe nazwy są zawsze odrzucane.

### Normalizacja identyfikatora konta

Kreator przekształca przyjazną nazwę w znormalizowany identyfikator konta (`Ops Bot` -> `ops-bot`). Znaki interpunkcyjne są kodowane szesnastkowo w nazwach zmiennych środowiskowych o zakresie konta, aby zapobiec kolizjom kont: `-` (0x2D) staje się `_X2D_`, więc `ops-prod` jest mapowane na prefiks zmiennych środowiskowych `MATRIX_OPS_X2D_PROD_`.

### Buforowane dane uwierzytelniające

Matrix buforuje dane uwierzytelniające w katalogu `~/.openclaw/credentials/matrix/`: `credentials.json` dla konta domyślnego oraz `credentials-<account>.json` dla kont nazwanych. Gdy istnieją buforowane dane uwierzytelniające, OpenClaw uznaje Matrix za skonfigurowany nawet bez `accessToken` w pliku konfiguracyjnym — dotyczy to konfiguracji, polecenia `openclaw doctor` oraz sond stanu kanału.

### Zmienne środowiskowe

Zmienne środowiskowe odpowiadające kluczom konfiguracji są używane, gdy równoważny klucz konfiguracji nie jest ustawiony. Konto domyślne używa nazw bez prefiksu, a konta nazwane wstawiają token konta przed sufiksem (zobacz [normalizację](#account-id-normalization)).

| Konto domyślne        | Konto nazwane (`<ID>` = token konta) |
| --------------------- | ------------------------------------ |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`             |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`           |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`               |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`              |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`            |

Dla konta `ops` nazwy przyjmują postać `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` itd. Zmienna `MATRIX_HOMESERVER` ani żaden jej wariant o zakresie konta `*_HOMESERVER` nie może być ustawiany z pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

<Note>
Klucz odzyskiwania nie jest zmienną środowiskową powiązaną z konfiguracją: OpenClaw nigdy nie odczytuje go bezpośrednio ze środowiska. Tekst wskazówek CLI sugeruje przekazanie go potokiem przez zmienną powłoki o nazwie `MATRIX_RECOVERY_KEY` dla konta domyślnego lub `MATRIX_RECOVERY_KEY_<ID>` dla konta nazwanego (zwykły identyfikator konta zapisany wielkimi literami, bez kodowania szesnastkowego) — zobacz [Weryfikowanie tego urządzenia za pomocą klucza odzyskiwania](#verify-this-device-with-a-recovery-key).
</Note>

## Przykład konfiguracji

Praktyczna konfiguracja bazowa z parowaniem wiadomości prywatnych, listą dozwolonych pokojów i E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Strumieniowe podglądy

Strumieniowanie odpowiedzi w Matrix jest opcjonalne. Ustawienie `streaming` określa, w jaki sposób OpenClaw dostarcza powstającą odpowiedź asystenta; `blockStreaming` określa, czy każdy ukończony blok jest zachowywany jako oddzielna wiadomość Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Aby zachować podgląd odpowiedzi na żywo, ale ukryć tymczasowe wiersze narzędzi i postępu, użyj postaci obiektowej:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Pełna postać obiektowa przyjmuje `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: niestandardowa etykieta, `"auto"` lub brak ustawienia, aby wybrać skonfigurowaną albo wbudowaną etykietę, bądź `false`, aby ją ukryć.
- `progress.labels`: kandydaci używani tylko wtedy, gdy `label` ma wartość `"auto"` lub nie jest ustawione.
- `progress.maxLines`: maksymalna liczba przewijanych wierszy postępu zachowywanych w wersji roboczej; starsze wiersze przekraczające ten limit są usuwane.
- `progress.maxLineChars`: maksymalna liczba znaków w każdym zwartym wierszu postępu przed skróceniem.
- `progress.toolProgress`: gdy ma wartość `true` (domyślnie), bieżąca aktywność narzędzi i postępu pojawia się w wersji roboczej.

| `streaming`       | Działanie                                                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (domyślnie) | Czeka na pełną odpowiedź i wysyła ją jednorazowo. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                                              |
| `"partial"`       | Edytuje na miejscu jedną zwykłą wiadomość tekstową w miarę generowania bieżącego bloku przez model. Standardowe klienty mogą powiadomić o pierwszym podglądzie, a nie o końcowej edycji.       |
| `"quiet"`         | Działa jak `"partial"`, ale wiadomość jest powiadomieniem bez alertu. Odbiorcy otrzymują powiadomienie, gdy reguła powiadomień push użytkownika dopasuje ukończoną edycję (zobacz poniżej).    |
| `"progress"`      | Wysyła pojedyncze, zwarte wiersze postępu za pomocą wersji roboczej postępu.                                                                                                                   |

Ustawienie `blockStreaming` (domyślnie `false`) jest niezależne od `streaming`:

| `streaming`             | `blockStreaming: true`                                                        | `blockStreaming: false` (domyślnie)                         |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `"partial"` / `"quiet"` | Podgląd bieżącego bloku na żywo, ukończone bloki zachowywane jako wiadomości  | Podgląd bieżącego bloku na żywo, finalizowany w miejscu     |
| `"off"`                 | Jedna wiadomość Matrix z powiadomieniem na każdy ukończony blok               | Jedna wiadomość Matrix z powiadomieniem dla całej odpowiedzi |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru pojedynczego zdarzenia Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i przechodzi na dostarczenie wyłącznie wersji końcowej.
- Odpowiedzi multimedialne zawsze wysyłają załączniki w zwykły sposób; jeśli nieaktualnego podglądu nie można bezpiecznie użyć ponownie, OpenClaw usuwa go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy aktywne jest strumieniowanie podglądu. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu tekstu odpowiedzi, ale pozostawić postęp narzędzi w normalnej ścieżce dostarczania.
- Edycje podglądu wymagają dodatkowych wywołań API Matrix. Pozostaw `streaming: "off"`, aby uzyskać najbardziej zachowawczy profil limitowania częstotliwości.

## Wiadomości głosowe

Przychodzące notatki głosowe Matrix są transkrybowane przed sprawdzeniem wzmianki w pokoju, dzięki czemu notatka głosowa zawierająca nazwę bota może uruchomić agenta w pokoju z ustawieniem `requireMention: true`, a agent otrzyma transkrypcję zamiast samego symbolu zastępczego załącznika dźwiękowego.

Matrix korzysta ze współdzielonego dostawcy multimediów dźwiękowych skonfigurowanego w `tools.media.audio`, na przykład OpenAI `gpt-4o-mini-transcribe`. Informacje o konfiguracji dostawcy i limitach zawiera [Przegląd narzędzi multimedialnych](/pl/tools/media-overview).

- Obsługiwane są zdarzenia `m.audio` oraz zdarzenia `m.file` z typem MIME `audio/*`.
- W zaszyfrowanych pokojach OpenClaw odszyfrowuje załącznik za pomocą istniejącej ścieżki multimediów Matrix przed transkrypcją.
- Transkrypcja jest oznaczana w poleceniu agenta jako wygenerowana maszynowo i niezaufana.
- Załącznik jest oznaczany jako już przetranskrybowany, aby dalsze narzędzia multimedialne nie transkrybowały go ponownie.
- Ustaw `tools.media.audio.enabled: false`, aby globalnie wyłączyć transkrypcję dźwięku.

## Metadane zatwierdzeń

Natywne monity o zatwierdzenie w Matrix są zwykłymi zdarzeniami `m.room.message` z treścią specyficzną dla OpenClaw pod kluczem `com.openclaw.approval`. Standardowe klienty nadal wyświetlają treść tekstową; klienty obsługujące OpenClaw mogą odczytać ustrukturyzowany identyfikator zatwierdzenia, rodzaj, stan, decyzje oraz szczegóły wykonania lub Pluginu.

Gdy monit jest zbyt długi, aby zmieścić się w jednym zdarzeniu Matrix, OpenClaw dzieli widoczny tekst na fragmenty i dołącza `com.openclaw.approval` tylko do pierwszego fragmentu. Reakcje zezwolenia lub odmowy są powiązane z tym pierwszym zdarzeniem, dzięki czemu długie monity zachowują ten sam cel zatwierdzenia co monity mieszczące się w jednym zdarzeniu.

### Reguły powiadomień push dla samodzielnie hostowanych, cichych i sfinalizowanych podglądów

`streaming: "quiet"` powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury — reguła powiadomień push dla każdego użytkownika musi pasować do znacznika sfinalizowanego podglądu. Pełną procedurę opisano w sekcji [Reguły powiadomień push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules).

## Pokoje komunikacji między botami

Domyślnie wiadomości Matrix pochodzące z innych skonfigurowanych kont Matrix w OpenClaw są ignorowane. Użyj `allowBots`, aby świadomie zezwolić na komunikację między agentami:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` akceptuje wiadomości z innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i wiadomościach bezpośrednich.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach widocznie wspominają tego bota; wiadomości bezpośrednie są nadal dozwolone niezależnie od tego.
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- Zaakceptowane wiadomości skonfigurowanych botów korzystają ze wspólnej [ochrony przed pętlami botów](/pl/channels/bot-loop-protection). Skonfiguruj `channels.defaults.botLoopProtection`, a następnie zastąp to ustawienie dla konta za pomocą `channels.matrix.botLoopProtection` lub dla pokoju za pomocą `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw nadal ignoruje wiadomości pochodzące z tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiadania samemu sobie.
- Matrix nie ma natywnej flagi bota; OpenClaw uznaje wiadomość za „utworzoną przez bota”, jeśli została wysłana przez inne skonfigurowane konto Matrix w tym Gateway OpenClaw.

Podczas włączania komunikacji między botami we współdzielonych pokojach używaj ścisłych list dozwolonych pokojów i wymogu wzmianki.

## Szyfrowanie i weryfikacja

W szyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem; nieszyfrowane pokoje używają zwykłego `thumbnail_url`. Konfiguracja nie jest wymagana — plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` obsługują opcje `--verbose` (pełna diagnostyka), `--json` (dane wyjściowe czytelne maszynowo) oraz `--account <id>` (konfiguracje z wieloma kontami). Domyślnie dane wyjściowe są zwięzłe.

### Włączanie szyfrowania

```bash
openclaw matrix encryption setup
```

Inicjuje magazyn sekretów i podpisywanie krzyżowe, w razie potrzeby tworzy kopię zapasową kluczy pokojów, a następnie wyświetla stan i kolejne kroki. Przydatne opcje:

- `--recovery-key <key>` stosuje klucz odzyskiwania przed inicjalizacją (preferuj poniższą formę ze standardowym wejściem)
- `--force-reset-cross-signing` odrzuca bieżącą tożsamość podpisywania krzyżowego i tworzy nową (tylko do świadomego użycia)

W przypadku nowego konta włącz E2EE podczas jego tworzenia:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` jest aliasem opcji `--enable-e2ee`. Odpowiednik konfiguracji ręcznej:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### Stan i sygnały zaufania

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` zgłasza trzy niezależne sygnały zaufania (`--verbose` pokazuje je wszystkie):

- `Zaufanie lokalne`: zaufanie tylko ze strony tego klienta
- `Zweryfikowano podpisywaniem krzyżowym`: SDK zgłasza weryfikację za pomocą podpisywania krzyżowego
- `Podpisano przez właściciela`: podpisano własnym kluczem samopodpisującym (wyłącznie diagnostyka)

`Zweryfikowano przez właściciela` ma wartość `tak` tylko wtedy, gdy `Zweryfikowano podpisywaniem krzyżowym` ma wartość `tak`; samo zaufanie lokalne lub podpis właściciela nie wystarczają.

`--allow-degraded-local-state` zwraca diagnostykę według najlepszych możliwości bez wcześniejszego przygotowania konta Matrix; jest to przydatne w przypadku testów offline lub częściowo skonfigurowanych środowisk.

### Weryfikowanie tego urządzenia za pomocą klucza odzyskiwania

Przekaż klucz odzyskiwania przez standardowe wejście zamiast podawać go w wierszu poleceń:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie zgłasza trzy stany:

- `Zaakceptowano klucz odzyskiwania`: Matrix zaakceptował klucz dla magazynu sekretów lub zaufania do urządzenia.
- `Kopia zapasowa jest użyteczna`: kopię zapasową kluczy pokojów można wczytać przy użyciu zaufanych materiałów odzyskiwania.
- `Urządzenie zweryfikowane przez właściciela`: to urządzenie ma pełne zaufanie tożsamości podpisywania krzyżowego Matrix.

Polecenie kończy się niezerowym kodem, gdy pełne zaufanie do tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiały kopii zapasowej. W takim przypadku dokończ samoweryfikację w innym kliencie Matrix:

```bash
openclaw matrix verify self
```

`verify self` przed pomyślnym zakończeniem oczekuje na stan `Zweryfikowano podpisywaniem krzyżowym: tak`. Użyj `--timeout-ms <ms>`, aby dostosować czas oczekiwania.

Forma z kluczem podanym bezpośrednio, `openclaw matrix verify device "<recovery-key>"`, również działa, ale klucz trafia do historii powłoki.

### Inicjalizowanie lub naprawianie podpisywania krzyżowego

```bash
openclaw matrix verify bootstrap
```

Polecenie naprawy lub konfiguracji dla szyfrowanych kont. W podanej kolejności:

- inicjuje magazyn sekretów, wykorzystując istniejący klucz odzyskiwania, gdy jest to możliwe
- inicjuje podpisywanie krzyżowe i przesyła brakujące klucze publiczne
- oznacza i podpisuje krzyżowo bieżące urządzenie
- tworzy kopię zapasową kluczy pokojów po stronie serwera, jeśli jeszcze nie istnieje

Jeśli serwer domowy wymaga UIA do przesłania kluczy podpisywania krzyżowego, OpenClaw najpierw próbuje bez uwierzytelniania, następnie `m.login.dummy`, a potem `m.login.password` (wymaga `channels.matrix.password`).

Przydatne opcje:

- `--recovery-key-stdin` (połącz z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) lub `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość podpisywania krzyżowego (wyłącznie świadomie; wymaga zapisania aktywnego klucza odzyskiwania lub podania go za pomocą `--recovery-key-stdin`)

### Kopia zapasowa kluczy pokojów

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` pokazuje, czy istnieje kopia zapasowa po stronie serwera i czy to urządzenie może ją odszyfrować. `backup restore` importuje klucze pokojów z kopii zapasowej do lokalnego magazynu kryptograficznego; pomiń `--recovery-key-stdin`, jeśli klucz odzyskiwania jest już zapisany na dysku.

Aby zastąpić uszkodzoną kopię zapasową nowym stanem bazowym (co oznacza zgodę na utratę niemożliwej do odzyskania starej historii; może również ponownie utworzyć magazyn sekretów, jeśli sekret bieżącej kopii zapasowej jest niemożliwy do wczytania):

```bash
openclaw matrix verify backup reset --yes
```

Dodaj `--rotate-recovery-key` tylko wtedy, gdy poprzedni klucz odzyskiwania ma celowo przestać odblokowywać nowy stan bazowy kopii zapasowej.

### Wyświetlanie, wysyłanie i obsługiwanie żądań weryfikacji

```bash
openclaw matrix verify list
```

Wyświetla oczekujące żądania weryfikacji dla wybranego konta.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Wysyła żądanie weryfikacji z tego konta. `--own-user` żąda samoweryfikacji (zaakceptuj monit w innym kliencie Matrix tego samego użytkownika); `--user-id`/`--device-id`/`--room-id` wskazują inną osobę. Opcji `--own-user` nie można łączyć z pozostałymi opcjami wskazywania celu.

Do obsługi cyklu życia na niższym poziomie — zazwyczaj podczas równoległego śledzenia przychodzących żądań z innego klienta — poniższe polecenia działają na konkretnym żądaniu `<id>` (wyświetlanym przez `verify list` i `verify request`):

| Polecenie                                  | Przeznaczenie                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Akceptuje przychodzące żądanie                                       |
| `openclaw matrix verify start <id>`        | Rozpoczyna procedurę SAS                                              |
| `openclaw matrix verify sas <id>`          | Wyświetla emoji lub liczby dziesiętne SAS                             |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdza zgodność SAS z wartością wyświetlaną przez drugiego klienta |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuca SAS, gdy emoji lub liczby dziesiętne są niezgodne             |
| `openclaw matrix verify cancel <id>`       | Anuluje; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

Polecenia `accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` przyjmują opcje `--user-id` oraz `--room-id` jako wskazówki do dalszej obsługi wiadomości bezpośrednich, gdy weryfikacja jest powiązana z konkretnym pokojem wiadomości bezpośrednich.

### Uwagi dotyczące wielu kont

Bez opcji `--account <id>` polecenia CLI Matrix używają domyślnego konta określonego niejawnie. Jeśli istnieje wiele nazwanych kont, a `channels.matrix.defaultAccount` nie jest ustawione, polecenia odmawiają zgadywania i proszą o wybór. Gdy E2EE jest wyłączone lub niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Zachowanie podczas uruchamiania">
    Przy `encryption: true` ustawienie `startupVerification` ma domyślnie wartość `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując okres karencji (domyślnie 24 godziny). Dostosuj go za pomocą `startupVerificationCooldownHours` lub wyłącz za pomocą `startupVerification: "off"`.

    Podczas uruchamiania wykonywany jest również zachowawczy proces inicjalizacji kryptografii, który ponownie wykorzystuje bieżący magazyn sekretów i tożsamość podpisywania krzyżowego. Jeśli stan inicjalizacji jest uszkodzony, OpenClaw podejmuje kontrolowaną próbę naprawy nawet bez `channels.matrix.password`; jeśli serwer domowy wymaga hasła UIA, podczas uruchamiania rejestrowane jest ostrzeżenie, ale błąd nie jest krytyczny. Urządzenia już podpisane przez właściciela zostają zachowane.

    Pełną procedurę aktualizacji opisano w sekcji [Migracja Matrix](/pl/channels/matrix-migration).

  </Accordion>

  <Accordion title="Powiadomienia o weryfikacji">
    Matrix publikuje powiadomienia o cyklu życia weryfikacji w ściśle określonym pokoju weryfikacji wiadomości bezpośrednich jako wiadomości `m.notice`: żądanie, gotowość (ze wskazówką „Verify by emoji”), rozpoczęcie lub zakończenie oraz szczegóły SAS (emoji lub liczby dziesiętne), gdy są dostępne.

    Przychodzące żądania z innego klienta Matrix są śledzone i automatycznie akceptowane. W przypadku samoweryfikacji OpenClaw automatycznie rozpoczyna procedurę SAS i potwierdza swoją stronę, gdy weryfikacja za pomocą emoji jest dostępna — nadal musisz porównać dane i potwierdzić „They match” w swoim kliencie Matrix.

    Systemowe powiadomienia o weryfikacji nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Usunięte lub nieprawidłowe urządzenie Matrix">
    Jeśli `verify status` informuje, że bieżące urządzenie nie jest już wymienione na serwerze domowym, utwórz nowe urządzenie Matrix dla OpenClaw. W przypadku logowania za pomocą hasła:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    W przypadku uwierzytelniania tokenem utwórz nowy token dostępu w kliencie Matrix lub interfejsie administracyjnym, a następnie zaktualizuj OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Zastąp `assistant` identyfikatorem konta z polecenia zakończonego niepowodzeniem albo pomiń `--account` dla konta domyślnego.

  </Accordion>

  <Accordion title="Higiena urządzeń">
    Stare urządzenia zarządzane przez OpenClaw mogą się gromadzić. Wyświetl je i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Magazyn kryptograficzny">
    E2EE Matrix używa oficjalnej ścieżki kryptograficznej Rust z `matrix-js-sdk` oraz `fake-indexeddb` jako warstwy zgodności IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (z restrykcyjnymi uprawnieniami pliku).

    Zaszyfrowany stan środowiska wykonawczego znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, migawkę IDB, powiązania wątków oraz stan weryfikacji podczas uruchamiania. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie wykorzystuje najlepszy istniejący katalog główny, dzięki czemu wcześniejszy stan pozostaje widoczny.

    Pojedynczy starszy katalog główny skrótu tokenu może być normalną ścieżką zachowania ciągłości podczas rotacji tokenu. Jeśli OpenClaw rejestruje `matrix: multiple populated token-hash storage roots detected`, sprawdź katalog konta i zarchiwizuj nieaktualne równorzędne katalogi główne dopiero po potwierdzeniu, że wybrany aktywny katalog główny działa prawidłowo. Zamiast natychmiast je usuwać, przenieś nieaktualne katalogi główne do katalogu `_archive/`.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Przekaż obie opcje w jednym wywołaniu. Matrix bezpośrednio akceptuje adresy URL awatarów `mxc://`; przekazanie adresu `http://`/`https://` powoduje najpierw przesłanie pliku, a następnie zapisanie rozpoznanego adresu URL `mxc://` w `channels.matrix.avatarUrl` (lub w nadpisaniu dla danego konta).

## Wątki

Matrix obsługuje natywne wątki zarówno dla automatycznych odpowiedzi, jak i wiadomości wysyłanych przez narzędzie wiadomości. Zachowaniem sterują dwa niezależne ustawienia:

### Trasowanie sesji (`sessionScope`)

`dm.sessionScope` określa, jak pokoje wiadomości bezpośrednich Matrix są mapowane na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje wiadomości bezpośrednich z tym samym trasowanym rozmówcą współdzielą jedną sesję.
- `"per-room"`: każdy pokój wiadomości bezpośrednich Matrix otrzymuje własny klucz sesji, nawet dla tego samego rozmówcy.

Jawne powiązania konwersacji zawsze mają pierwszeństwo przed `sessionScope`; powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Odpowiedzi w wątkach (`threadReplies`)

`threadReplies` określa, gdzie bot publikuje odpowiedź:

- `"off"`: odpowiedzi są publikowane na najwyższym poziomie. Przychodzące wiadomości w wątkach pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiedź trafia do wątku tylko wtedy, gdy wiadomość przychodząca już znajdowała się w tym wątku.
- `"always"`: odpowiedź trafia do wątku zakorzenionego w wiadomości wyzwalającej; od pierwszego wyzwolenia ta konwersacja jest trasowana przez pasującą sesję ograniczoną do wątku.

`dm.threadReplies` nadpisuje to ustawienie tylko dla wiadomości bezpośrednich — na przykład pozwala izolować wątki pokojów, zachowując wiadomości bezpośrednie bez wątków.

### Dziedziczenie wątku i polecenia z ukośnikiem

- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wiadomości wysyłane przez narzędzie wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy są kierowane do tego samego pokoju (lub tego samego użytkownika docelowego wiadomości bezpośredniej), chyba że podano jawne `threadId`.
- Ponowne użycie użytkownika docelowego wiadomości bezpośredniej następuje tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego rozmówcę wiadomości bezpośredniej na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do zwykłego trasowania ograniczonego do użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach Matrix i wiadomościach bezpośrednich.
- Polecenie `/focus` uruchomione na najwyższym poziomie tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy włączono `threadBindings.spawnSessions`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek w miejscu.

Gdy OpenClaw wykryje kolizję pokoju wiadomości bezpośrednich Matrix z innym pokojem wiadomości bezpośrednich w tej samej współdzielonej sesji, publikuje jednorazowe powiadomienie `m.notice`, wskazujące `/focus` jako rozwiązanie awaryjne i sugerujące zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy powiązania wątków są włączone.

## Powiązania konwersacji ACP

Pokoje Matrix, wiadomości bezpośrednie i istniejące wątki Matrix mogą stać się trwałymi przestrzeniami roboczymi ACP bez zmiany interfejsu czatu.

Szybka procedura dla operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz wiadomości bezpośredniej, pokoju lub istniejącego wątku Matrix, którego chcesz nadal używać.
- W wiadomości bezpośredniej lub pokoju na najwyższym poziomie bieżąca wiadomość bezpośrednia lub bieżący pokój pozostaje interfejsem czatu, a przyszłe wiadomości są trasowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku opcja `--bind here` wiąże bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

`--bind here` nie tworzy podrzędnego wątku Matrix. `threadBindings.spawnSessions` kontroluje `/acp spawn --thread auto|here`, gdy OpenClaw musi utworzyć lub powiązać podrzędny wątek.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings` i obsługuje nadpisania dla kanału:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: kontroluje tworzenie wątków zarówno przez podagentów, jak i ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: węższe nadpisania dotyczące tworzenia wyłącznie przez podagentów lub wyłącznie przez ACP.
- `threadBindings.defaultSpawnContext`

Tworzenie sesji powiązanych z wątkami Matrix jest domyślnie włączone. Ustaw `threadBindings.spawnSessions: false`, aby uniemożliwić poleceniom `/focus` i `/acp spawn --thread auto|here` uruchamianym na najwyższym poziomie tworzenie lub wiązanie wątków Matrix. Ustaw `threadBindings.defaultSpawnContext: "isolated"`, gdy natywne tworzenie wątków podagentów nie powinno rozwidlać transkrypcji sesji nadrzędnej.

## Reakcje

Matrix obsługuje reakcje wychodzące, powiadomienia o reakcjach przychodzących oraz reakcje potwierdzające.

Narzędzia reakcji wychodzących są kontrolowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota z tego zdarzenia.
- `remove: true` usuwa z reakcji bota tylko określoną reakcję emoji.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie              | Kolejność                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | dla konta -> kanał -> `messages.ackReaction` -> awaryjny emoji tożsamości agenta    |
| `ackReactionScope`      | dla konta -> kanał -> `messages.ackReactionScope` -> domyślne `"group-mentions"`    |
| `reactionNotifications` | dla konta -> kanał -> domyślne `"own"`                                              |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy dotyczą wiadomości Matrix utworzonych przez bota; `"off"` wyłącza zdarzenia systemowe reakcji. Usunięcia reakcji nie są syntetyzowane jako zdarzenia systemowe — Matrix przedstawia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` określa, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju wyzwala agenta. Wartością zastępczą jest `messages.groupChat.historyLimit`; efektywna wartość domyślna to `0`, jeśli oba ustawienia są nieokreślone (funkcja wyłączona).
- Historia pokojów Matrix obejmuje tylko dany pokój; wiadomości bezpośrednie nadal korzystają ze zwykłej historii sesji.
- Historia pokoju obejmuje tylko oczekujące wiadomości: OpenClaw buforuje wiadomości w pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie zapisuje migawkę tego okna, gdy pojawi się wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest uwzględniana w `InboundHistory`; w tej turze pozostaje w głównej treści wiadomości przychodzącej.
- Ponowne próby obsługi tego samego zdarzenia Matrix używają pierwotnej migawki historii zamiast przesuwać ją do nowszych wiadomości w pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzielone ustawienie `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrana treść odpowiedzi, wiadomości główne wątków i oczekująca historia.

- `contextVisibility: "all"` jest ustawieniem domyślnym. Dodatkowy kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych użytkowników lub pokoju.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale zachowuje jedną jawną cytowaną odpowiedź.

Wpływa to tylko na widoczność dodatkowego kontekstu, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź. Autoryzacja wyzwalania nadal wynika z ustawień `groupPolicy`, `groups`, `groupAllowFrom` oraz zasad wiadomości bezpośrednich.

## Zasady wiadomości bezpośrednich i pokojów

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Aby całkowicie wyciszyć wiadomości bezpośrednie, zachowując działanie pokojów, ustaw `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Informacje o wymaganiu wzmianki i działaniu listy dozwolonych znajdują się w sekcji [Grupy](/pl/channels/groups).

Przykład parowania wiadomości bezpośrednich Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie wykorzystuje ten sam oczekujący kod parowania i po krótkim okresie oczekiwania może wysłać odpowiedź z przypomnieniem zamiast generować nowy kod.

Opis wspólnego procesu parowania wiadomości bezpośrednich i układu pamięci znajduje się w sekcji [Parowanie](/pl/channels/pairing).

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich przestanie być spójny, OpenClaw może zachować nieaktualne mapowania `m.direct`, wskazujące stare jednoosobowe pokoje zamiast aktywnej wiadomości bezpośredniej. Sprawdź bieżące mapowanie rozmówcy:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Oba polecenia przyjmują `--account <id>` w konfiguracjach z wieloma kontami. Proces naprawy:

- preferuje ścisłą wiadomość bezpośrednią 1:1 już zmapowaną w `m.direct`
- w przeciwnym razie używa dowolnej aktualnie dołączonej ścisłej wiadomości bezpośredniej 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i ponownie zapisuje `m.direct`, jeśli nie istnieje żadna prawidłowo działająca wiadomość bezpośrednia

Nie usuwa automatycznie starych pokojów. Wybiera prawidłowo działającą wiadomość bezpośrednią i aktualizuje mapowanie, aby przyszłe wysyłki Matrix, powiadomienia weryfikacyjne i inne procesy wiadomości bezpośrednich trafiały do właściwego pokoju.

## Zatwierdzanie wykonywania

Matrix może pełnić funkcję natywnego klienta zatwierdzania. Skonfiguruj go w `channels.matrix.execApprovals` (lub `channels.matrix.accounts.<account>.execApprovals`, aby nadpisać ustawienia dla danego konta):

- `enabled`: dostarcza prośby o zatwierdzenie za pomocą natywnych monitów Matrix. Brak wartości lub `"auto"` automatycznie włącza tę funkcję, gdy można rozpoznać co najmniej jedną osobę zatwierdzającą; ustaw `false`, aby jawnie ją wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnionych do zatwierdzania żądań wykonania. Wartością zastępczą jest `channels.matrix.dm.allowFrom`.
- `target`: miejsce docelowe monitów. `"dm"` (domyślnie) wysyła je do wiadomości bezpośrednich osób zatwierdzających; `"channel"` wysyła je do pokoju lub wiadomości bezpośredniej, z których pochodzi żądanie; `"both"` wysyła je do obu miejsc.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych agentów lub sesji, które wyzwalają dostarczanie przez Matrix.

Autoryzacja różni się nieco zależnie od rodzaju zatwierdzenia:

- **Zatwierdzanie wykonywania** używa `execApprovals.approvers`, a w razie braku wartości — `dm.allowFrom`.
- **Zatwierdzanie Pluginów** korzysta z autoryzacji wyłącznie przez `dm.allowFrom`.

Oba rodzaje współdzielą skróty reakcji Matrix i aktualizacje wiadomości. Osoby zatwierdzające widzą skróty reakcji w głównej wiadomości z prośbą o zatwierdzenie:

- ✅ zezwól jednorazowo
- ❌ odmów
- ♾️ zawsze zezwalaj (gdy obowiązujące zasady wykonywania na to pozwalają)

Zastępcze polecenia z ukośnikiem: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozpoznane osoby zatwierdzające mogą zatwierdzać lub odrzucać żądania. Dostarczanie zatwierdzeń wykonywania do kanału zawiera tekst polecenia — włączaj `channel` lub `both` tylko w zaufanych pokojach.

Powiązane informacje: [Zatwierdzanie wykonywania](/pl/tools/exec-approvals).

## Polecenia z ukośnikiem

Polecenia z ukośnikiem (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w wiadomościach bezpośrednich. W pokojach OpenClaw rozpoznaje również polecenia poprzedzone własną wzmianką Matrix bota, dlatego `@bot:server /new` uruchamia ścieżkę polecenia bez niestandardowego wyrażenia regularnego wzmianki — dzięki temu bot reaguje na typowe dla pokojów wpisy `@mention /command`, które Element i podobne klienty generują, gdy użytkownik automatycznie uzupełnia nazwę bota klawiszem tabulacji przed wpisaniem polecenia.

Nadal obowiązują reguły autoryzacji: nadawcy poleceń muszą spełniać te same zasady listy dozwolonych lub właściciela dla wiadomości bezpośrednich albo pokojów co zwykłe wiadomości.

## Wiele kont

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**Dziedziczenie:**

- Wartości najwyższego poziomu `channels.matrix` pełnią funkcję wartości domyślnych dla nazwanych kont, chyba że zostaną nadpisane przez dane konto.
- Aby ograniczyć dziedziczony wpis pokoju do konkretnego konta, użyj `groups.<room>.account`. Wpisy bez `account` są współdzielone między kontami; `account: "default"` nadal działa, gdy konto domyślne skonfigurowano na najwyższym poziomie.

**Wybór konta domyślnego:**

- Ustaw `defaultAccount`, aby wskazać nazwane konto preferowane przez routing niejawny, testy dostępności i polecenia CLI.
- Jeśli masz wiele kont, a jedno z nich nosi dokładnie nazwę `default`, OpenClaw używa go niejawnie, nawet gdy `defaultAccount` nie jest ustawione.
- Gdy istnieje wiele nazwanych kont i nie wybrano konta domyślnego, polecenia CLI nie próbują zgadywać — ustaw `defaultAccount` lub przekaż `--account <id>`.
- Blok najwyższego poziomu `channels.matrix.*` jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego dane uwierzytelniające są kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta można nadal wykrywać na podstawie `homeserver` + `userId`, gdy zapisane w pamięci podręcznej poświadczenia zapewniają uwierzytelnienie.

**Promowanie:**

- Gdy podczas naprawy lub konfiguracji OpenClaw przekształca konfigurację jednokontową w wielokontową, zachowuje istniejące nazwane konto, jeśli takie istnieje lub `defaultAccount` już na nie wskazuje. Do promowanego konta przenoszone są wyłącznie klucze uwierzytelniania i inicjalizacji Matrix; współdzielone klucze zasad dostarczania pozostają na najwyższym poziomie.

Wspólny wzorzec obsługi wielu kont opisano w [dokumentacji konfiguracji](/pl/gateway/config-channels#multi-account-all-channels).

## Prywatne serwery domowe i serwery w sieci LAN

Domyślnie OpenClaw blokuje prywatne i wewnętrzne serwery domowe Matrix w celu ochrony przed SSRF, chyba że zezwolisz na nie osobno dla każdego konta.

Jeśli serwer domowy działa na hoście lokalnym, pod adresem IP sieci LAN/Tailscale lub pod wewnętrzną nazwą hosta, włącz dla tego konta opcję `network.dangerouslyAllowPrivateNetwork`:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Przykład konfiguracji za pomocą CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Ta opcja zezwala wyłącznie na zaufane cele prywatne i wewnętrzne. Publiczne serwery domowe korzystające z nieszyfrowanego połączenia, takie jak `http://matrix.example.org:8008`, pozostają zablokowane. Zawsze, gdy jest to możliwe, używaj `https://`.

## Przekazywanie ruchu Matrix przez serwer proxy

Jeśli wdrożenie Matrix wymaga jawnie skonfigurowanego wychodzącego serwera proxy HTTP(S), ustaw `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Nazwane konta mogą nadpisywać wartość domyślną najwyższego poziomu za pomocą `channels.matrix.accounts.<id>.proxy`. OpenClaw używa tego samego ustawienia serwera proxy dla ruchu Matrix w czasie działania oraz testów stanu konta.

## Rozpoznawanie celów

Matrix akceptuje następujące formaty celów wszędzie tam, gdzie OpenClaw wymaga wskazania pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Identyfikatory pokojów Matrix uwzględniają wielkość liter. Podczas konfigurowania jawnych celów dostarczania, zadań cron, powiązań lub list dozwolonych używaj dokładnie takiej wielkości liter identyfikatora pokoju, jaka występuje w Matrix. OpenClaw zachowuje kanoniczną postać wewnętrznych kluczy sesji na potrzeby przechowywania, dlatego te klucze zapisane małymi literami nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie katalogu na żywo korzysta z zalogowanego konta Matrix:

- Wyszukiwanie użytkowników odpytuje katalog użytkowników Matrix na danym serwerze domowym.
- Wyszukiwanie pokojów przyjmuje bezpośrednio jawne identyfikatory i aliasy pokojów. Wyszukiwanie według nazwy wśród dołączonych pokojów działa na zasadzie najlepszej próby i ma zastosowanie tylko do list dozwolonych pokojów środowiska uruchomieniowego, gdy ustawiono `dangerouslyAllowNameMatching: true`.
- Jeśli nazwy pokoju nie można rozpoznać jako identyfikatora lub aliasu, jest ona ignorowana podczas rozwiązywania listy dozwolonych w środowisku uruchomieniowym.

## Dokumentacja konfiguracji

Pola użytkowników pełniące funkcję list dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) przyjmują pełne identyfikatory użytkowników Matrix (najbezpieczniejsza opcja). Wpisy niebędące identyfikatorami są domyślnie ignorowane. Jeśli ustawiono `dangerouslyAllowNameMatching: true`, dokładne dopasowania nazw wyświetlanych w katalogu Matrix są rozwiązywane podczas uruchamiania oraz za każdym razem, gdy lista dozwolonych zmieni się podczas działania monitora; wpisy, których nie można rozpoznać, są ignorowane w środowisku uruchomieniowym.

Klucze list dozwolonych pokojów (`groups`, starsze `rooms`) powinny być identyfikatorami lub aliasami pokojów. Klucze będące zwykłymi nazwami pokojów są domyślnie ignorowane; `dangerouslyAllowNameMatching: true` przywraca wyszukiwanie na zasadzie najlepszej próby wśród nazw dołączonych pokojów.

### Konto i połączenie

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta wyświetlana dla konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane ustawienia zastępujące dla poszczególnych kont. Wartości najwyższego poziomu `channels.matrix` są dziedziczone jako domyślne.
- `homeserver`: adres URL serwera domowego, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwala temu kontu na łączenie się z `localhost`, adresami IP sieci LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny adres URL serwera proxy HTTP(S) dla ruchu Matrix. Obsługuje ustawienia zastępujące dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu do uwierzytelniania opartego na tokenie. Obsługiwane są wartości w postaci zwykłego tekstu oraz SecretRef pochodzące od dostawców env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości w postaci zwykłego tekstu oraz SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia używana podczas logowania za pomocą hasła.
- `avatarUrl`: zapisany adres URL własnego awatara używany do synchronizacji profilu i aktualizacji przez `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.

### Szyfrowanie

- `encryption`: włącza E2EE. Domyślnie: `false`.
- `startupVerification`: `"if-unverified"` (wartość domyślna, gdy E2EE jest włączone) lub `"off"`. Automatycznie wysyła żądanie samodzielnej weryfikacji podczas uruchamiania, gdy to urządzenie jest niezweryfikowane.
- `startupVerificationCooldownHours`: okres oczekiwania przed kolejnym automatycznym żądaniem przy uruchamianiu. Domyślnie: `24`.

### Dostęp i zasady

- `groupPolicy`: `"open"`, `"allowlist"` lub `"disabled"`. Domyślnie: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w pokojach.
- `mentionPatterns`: wzorce wyrażeń regularnych o zakresie ograniczonym do wzmianek w pokojach. Obiekt w postaci `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Określa, czy skonfigurowane `agents.list[].groupChat.mentionPatterns` mają zastosowanie w poszczególnych pokojach.
- `dm.enabled`: gdy ma wartość `false`, wszystkie wiadomości bezpośrednie są ignorowane. Domyślnie: `true`.
- `dm.policy`: `"pairing"` (domyślnie), `"allowlist"`, `"open"` lub `"disabled"`. Ma zastosowanie po dołączeniu bota i sklasyfikowaniu pokoju jako wiadomości bezpośredniej; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu wiadomości bezpośrednich.
- `dm.sessionScope`: `"per-user"` (domyślnie) lub `"per-room"`.
- `dm.threadReplies`: ustawienie zastępujące wątkowanie odpowiedzi tylko dla wiadomości bezpośrednich (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuje wiadomości od innych skonfigurowanych kont botów Matrix (`true` lub `"mentions"`).
- `allowlistOnly`: gdy ma wartość `true`, wymusza `"allowlist"` dla wszystkich aktywnych zasad wiadomości bezpośrednich (z wyjątkiem `"disabled"`) oraz zasad grupowych `"open"`. Nie zmienia zasad `"disabled"`.
- `dangerouslyAllowNameMatching`: gdy ma wartość `true`, zezwala na wyszukiwanie nazw wyświetlanych Matrix w katalogu dla wpisów list dozwolonych użytkowników oraz na wyszukiwanie nazw dołączonych pokojów dla kluczy list dozwolonych pokojów. Preferuj pełne identyfikatory `@user:server` oraz identyfikatory lub aliasy pokojów.
- `autoJoin`: `"always"`, `"allowlist"` lub `"off"`. Domyślnie: `"off"`. Ma zastosowanie do każdego zaproszenia Matrix, w tym zaproszeń przypominających wiadomości bezpośrednie.
- `autoJoinAllowlist`: pokoje lub aliasy dozwolone, gdy `autoJoin` ma wartość `"allowlist"`. Wpisy aliasów są rozwiązywane względem serwera domowego, a nie względem stanu deklarowanego przez pokój wysyłający zaproszenie.
- `contextVisibility`: dodatkowa widoczność kontekstu (`"all"` domyślnie, `"allowlist"`, `"allowlist_quote"`).

### Zachowanie odpowiedzi

- `replyToMode`: `"off"` (domyślnie), `"first"`, `"all"` lub `"batched"`.
- `threadReplies`: `"off"` (wartość domyślna najwyższego poziomu jest rozwiązywana jako `"inbound"`, chyba że ustawiono ją jawnie), `"inbound"` lub `"always"`.
- `threadBindings`: ustawienia zastępujące dla poszczególnych kanałów dotyczące routingu sesji powiązanych z wątkami i ich cyklu życia.
- `streaming`: `"off"` (domyślnie), `"partial"`, `"quiet"`, `"progress"` lub postać obiektowa `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: gdy ma wartość `true`, ukończone bloki asystenta są zachowywane jako osobne wiadomości o postępie. Domyślnie: `false`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg znaków dodawany na początku odpowiedzi wychodzących.
- `textChunkLimit`: rozmiar fragmentu wychodzącego wyrażony w znakach, gdy `chunkMode: "length"`. Domyślnie: `4000`.
- `chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) lub `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju dołączanych jako `InboundHistory`, gdy wiadomość w pokoju uruchamia agenta. W razie braku wartości używa `messages.groupChat.historyLimit`; efektywna wartość domyślna to `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłania wychodzącego i przetwarzania przychodzącego. Domyślnie: `20`.

### Ustawienia reakcji

- `ackReaction`: ustawienie zastępujące reakcji potwierdzającej dla tego kanału lub konta.
- `ackReactionScope`: ustawienie zastępujące zakresu (`"group-mentions"` domyślnie, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (`"own"` domyślnie, `"off"`).

### Narzędzia i ustawienia zastępujące dla poszczególnych pokojów

- `actions`: ograniczenia narzędzi dla poszczególnych działań (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa zasad dla poszczególnych pokojów. Tożsamość sesji korzysta ze stabilnego identyfikatora pokoju po jego rozpoznaniu. (`rooms` jest starszym aliasem).
  - `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do określonego konta.
  - `groups.<room>.enabled`: przełącznik dla poszczególnych pokojów. Gdy ma wartość `false`, pokój jest ignorowany tak, jakby nie znajdował się na mapie.
  - `groups.<room>.requireMention`: ustawienie zastępujące dla poszczególnych pokojów dotyczące wymagania wzmianki na poziomie kanału.
  - `groups.<room>.allowBots`: ustawienie zastępujące dla poszczególnych pokojów dotyczące ustawienia na poziomie kanału (`true` lub `"mentions"`).
  - `groups.<room>.botLoopProtection`: ustawienie zastępujące dla poszczególnych pokojów dotyczące budżetu ochrony przed pętlami między botami.
  - `groups.<room>.users`: lista dozwolonych nadawców dla poszczególnych pokojów.
  - `groups.<room>.tools`: ustawienia zastępujące zezwalania na narzędzia lub ich blokowania dla poszczególnych pokojów.
  - `groups.<room>.autoReply`: ustawienie zastępujące mechanizmu wymagania wzmianek dla poszczególnych pokojów. `true` wyłącza wymagania dotyczące wzmianek dla danego pokoju; `false` ponownie je wymusza.
  - `groups.<room>.skills`: filtr Skills dla poszczególnych pokojów.
  - `groups.<room>.systemPrompt`: fragment monitu systemowego dla poszczególnych pokojów.

### Ustawienia zatwierdzania wykonania

- `execApprovals.enabled`: dostarcza prośby o zatwierdzenie wykonania za pośrednictwem natywnych monitów Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnionych do zatwierdzania. W razie braku wartości używa `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` lub `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów lub sesji na potrzeby dostarczania.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i proces parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i mechanizm wymagania wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
