---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie szyfrowania E2EE i weryfikacji w Matrix
summary: Status obsługi Matrix, przykłady konfiguracji i uruchomienia
title: Matrix
x-i18n:
    generated_at: "2026-07-16T17:59:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix to dostępny do pobrania plugin kanału (`@openclaw/matrix`) oparty na oficjalnym `matrix-js-sdk`. Obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację i E2EE.

## Instalacja

```bash
openclaw plugins install @openclaw/matrix
```

Specyfikacje pluginów bez kwalifikatora najpierw próbują użyć ClawHub, a następnie awaryjnie npm. Aby wymusić źródło, użyj `openclaw plugins install clawhub:@openclaw/matrix` lub `npm:@openclaw/matrix`. Z lokalnego repozytorium roboczego: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` rejestruje i włącza plugin; osobny krok `enable` nie jest potrzebny. Kanał nadal nie będzie działać, dopóki nie zostanie skonfigurowany zgodnie z poniższymi instrukcjami. Ogólne zasady instalacji opisano w sekcji [Pluginy](/pl/tools/plugin).

## Konfiguracja

1. Utwórz konto Matrix na swoim serwerze macierzystym.
2. Skonfiguruj `channels.matrix` za pomocą `homeserver` + `accessToken` albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie Gateway.
4. Rozpocznij wiadomość prywatną z botem lub zaproś go do pokoju. Nowe zaproszenia zostaną przyjęte tylko wtedy, gdy zezwala na nie [`autoJoin`](#auto-join).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o adres URL serwera macierzystego, metodę uwierzytelniania (token lub hasło), identyfikator użytkownika (tylko przy uwierzytelnianiu hasłem), opcjonalną nazwę urządzenia, włączenie E2EE oraz dostęp do pokojów i automatyczne dołączanie. Jeśli istnieją już pasujące zmienne środowiskowe `MATRIX_*`, a konto nie ma zapisanego uwierzytelnienia, kreator proponuje skrót wykorzystujący zmienne środowiskowe. Przed zapisaniem listy dozwolonych elementów za pomocą `openclaw channels resolve --channel matrix "Project Room"` należy rozpoznać nazwy pokojów. Włączenie E2EE w kreatorze uruchamia ten sam proces inicjalizacji co [`openclaw matrix encryption setup`](#encryption-and-verification).

### Konfiguracja minimalna

Z użyciem tokenu:

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

Z użyciem hasła (token jest buforowany po pierwszym logowaniu):

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

Wartością domyślną `channels.matrix.autoJoin` jest `"off"`: bot nie pojawi się w nowych pokojach ani wiadomościach prywatnych na podstawie nowych zaproszeń, dopóki nie dołączysz ręcznie. OpenClaw nie może w chwili otrzymania zaproszenia ustalić, czy dotyczy ono wiadomości prywatnej, czy grupy, dlatego każde zaproszenie najpierw podlega `autoJoin`; `dm.policy` ma zastosowanie dopiero później, gdy bot dołączy i pokój zostanie sklasyfikowany.

<Warning>
Ustaw `autoJoin: "allowlist"` wraz z `autoJoinAllowlist`, aby ograniczyć akceptowane zaproszenia, albo `autoJoin: "always"`, aby akceptować wszystkie zaproszenia.

`autoJoinAllowlist` akceptuje wyłącznie `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokojów są odrzucane; aliasy są rozpoznawane względem serwera macierzystego, a nie na podstawie stanu deklarowanego przez pokój, do którego nadeszło zaproszenie.
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

### Formaty celów listy dozwolonych elementów

- Wiadomości prywatne (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): użyj `@user:server`. Nazwy wyświetlane są domyślnie ignorowane, ponieważ mogą się zmieniać; ustaw `dangerouslyAllowNameMatching: true` wyłącznie w celu jawnej zgodności z nazwami wyświetlanymi.
- Klucze listy dozwolonych pokojów (`groups`, starszy alias `rooms`): użyj `!room:server` lub `#alias:server`. Zwykłe nazwy są ignorowane, chyba że ustawiono `dangerouslyAllowNameMatching: true`.
- Listy dozwolonych zaproszeń (`autoJoinAllowlist`): użyj `!room:server`, `#alias:server` lub `*`. Zwykłe nazwy są zawsze odrzucane.

### Normalizacja identyfikatora konta

Kreator przekształca przyjazną nazwę w znormalizowany identyfikator konta (`Ops Bot` -> `ops-bot`). Znaki interpunkcyjne są kodowane szesnastkowo w nazwach zmiennych środowiskowych ograniczonych do konta, dzięki czemu konta nie mogą powodować kolizji: `-` (0x2D) staje się `_X2D_`, więc `ops-prod` jest mapowane na prefiks zmiennych środowiskowych `MATRIX_OPS_X2D_PROD_`.

### Buforowane dane uwierzytelniające

Matrix buforuje dane uwierzytelniające w `~/.openclaw/credentials/matrix/`: `credentials.json` dla konta domyślnego i `credentials-<account>.json` dla kont nazwanych. Gdy istnieją buforowane dane uwierzytelniające, OpenClaw uznaje Matrix za skonfigurowany nawet bez `accessToken` w pliku konfiguracji — dotyczy to konfiguracji, `openclaw doctor` oraz sprawdzania stanu kanału.

### Zmienne środowiskowe

Zmienne środowiskowe odpowiadające kluczom konfiguracji są używane, gdy równoważny klucz konfiguracji nie jest ustawiony. Konto domyślne używa nazw bez prefiksu; w przypadku kont nazwanych token konta jest wstawiany przed sufiksem (zobacz [normalizację](#account-id-normalization)).

| Konto domyślne       | Konto nazwane (`<ID>` = token konta) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Dla konta `ops` nazwy mają postać `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` itd. `MATRIX_HOMESERVER` (ani żaden ograniczony do konta wariant `*_HOMESERVER`) nie może być ustawiony z pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

<Note>
Klucz odzyskiwania nie jest zmienną środowiskową opartą na konfiguracji: OpenClaw nigdy nie odczytuje go bezpośrednio ze środowiska. Tekst wskazówek CLI sugeruje przekazanie go potokiem przez zmienną powłoki o nazwie `MATRIX_RECOVERY_KEY` dla konta domyślnego lub `MATRIX_RECOVERY_KEY_<ID>` dla konta nazwanego (zwykły identyfikator konta zapisany wielkimi literami, bez kodowania szesnastkowego) — zobacz [Weryfikowanie tego urządzenia za pomocą klucza odzyskiwania](#verify-this-device-with-a-recovery-key).
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
      streaming: { mode: "partial" },
    },
  },
}
```

## Podglądy strumieniowe

Strumieniowe przesyłanie odpowiedzi w Matrix jest opcjonalne. `streaming.mode` określa sposób dostarczania przez OpenClaw trwającej odpowiedzi asystenta; `streaming.block.enabled` określa, czy każdy ukończony blok jest zachowywany jako osobna wiadomość Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

Aby zachować podglądy odpowiedzi na żywo, ale ukryć tymczasowe wiersze narzędzi i postępu:

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

Pełna konfiguracja obsługuje `{ mode, chunkMode, block, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // wybierz spośród skonfigurowanych lub wbudowanych etykiet (false, aby ukryć)
          labels: ["Myślenie", "Pisanie", "Wyszukiwanie"], // kandydaci dla label: "auto"
          maxLines: 8, // maksymalna liczba przewijanych wierszy postępu (domyślnie: 8)
          maxLineChars: 120, // maksymalna liczba znaków w wierszu przed skróceniem (domyślnie: 120)
          toolProgress: true, // pokazuj aktywność narzędzi/postępu (domyślnie: true)
        },
      },
    },
  },
}
```

- `progress.label`: etykieta niestandardowa, `"auto"`/brak ustawienia, aby wybrać etykietę skonfigurowaną lub wbudowaną, albo `false`, aby ją ukryć.
- `progress.labels`: kandydaci używani tylko wtedy, gdy `label` ma wartość `"auto"` lub nie jest ustawione.
- `progress.maxLines`: maksymalna liczba przewijanych wierszy postępu zachowywanych w wersji roboczej; starsze wiersze przekraczające ten limit są usuwane.
- `progress.maxLineChars`: maksymalna liczba znaków w zwartym wierszu postępu przed skróceniem.
- `progress.toolProgress`: gdy ma wartość `true` (domyślnie), bieżąca aktywność narzędzi i postępu pojawia się w wersji roboczej.

| `streaming.mode`  | Zachowanie                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (domyślnie) | Oczekuje na pełną odpowiedź i wysyła ją jednorazowo.                                                                                                                      |
| `"partial"`       | Edytuje jedną zwykłą wiadomość tekstową w miejscu, gdy model zapisuje bieżący blok. Standardowe klienty mogą powiadomić o pierwszym podglądzie, a nie o końcowej edycji.          |
| `"quiet"`         | Tak samo jak `"partial"`, ale wiadomość jest powiadomieniem, które samo nie wyzwala alertu. Odbiorcy otrzymują powiadomienie, gdy reguła push danego użytkownika dopasuje ukończoną edycję (zobacz poniżej). |
| `"progress"`      | Wysyła poszczególne zwarte wiersze postępu przy użyciu roboczego podglądu postępu.                                                                                          |

`streaming.block.enabled` (domyślnie `false`) działa niezależnie od `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (domyślnie)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Bieżąca wersja robocza dla aktualnego bloku, ukończone bloki zachowywane jako wiadomości | Bieżąca wersja robocza dla aktualnego bloku, finalizowana w miejscu |
| `"off"`                 | Jedna wiadomość Matrix wyzwalająca powiadomienie na każdy ukończony blok                     | Jedna wiadomość Matrix wyzwalająca powiadomienie dla całej odpowiedzi      |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru pojedynczego zdarzenia Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i przechodzi na dostarczanie wyłącznie końcowej odpowiedzi.
- Odpowiedzi multimedialne zawsze wysyłają załączniki w zwykły sposób; jeśli nieaktualnego podglądu nie można bezpiecznie wykorzystać ponownie, OpenClaw usuwa go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy aktywne jest strumieniowanie podglądu. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu tekstu odpowiedzi, ale pozostawić postęp narzędzi w zwykłej ścieżce dostarczania.
- Edycje podglądu wymagają dodatkowych wywołań API Matrix. Pozostaw `streaming.mode: "off"`, aby uzyskać najbardziej zachowawczy profil limitów wywołań.
- Starsze skalarne/logiczne wartości `streaming` oraz płaskie klucze `blockStreaming` / `chunkMode` są przepisywane do tej zagnieżdżonej postaci przez `openclaw doctor --fix`.

## Wiadomości głosowe

Przychodzące notatki głosowe Matrix są transkrybowane przed sprawdzeniem wzmianki w pokoju, dzięki czemu notatka głosowa zawierająca nazwę bota może uruchomić agenta w pokoju `requireMention: true`, a agent otrzyma transkrypcję zamiast wyłącznie symbolu zastępczego załącznika audio.

Matrix używa współdzielonego dostawcy multimediów audio w `tools.media.audio`, na przykład OpenAI `gpt-4o-mini-transcribe`. Informacje o konfiguracji dostawcy i limitach zawiera [Omówienie narzędzi multimedialnych](/pl/tools/media-overview).

- Zdarzenia `m.audio` oraz zdarzenia `m.file` z typem MIME `audio/*` kwalifikują się.
- W zaszyfrowanych pokojach OpenClaw odszyfrowuje załącznik za pośrednictwem istniejącej ścieżki multimediów Matrix przed transkrypcją.
- Transkrypcja jest oznaczana w monicie agenta jako wygenerowana maszynowo i niezaufana.
- Załącznik jest oznaczany jako już przetranskrybowany, aby dalsze narzędzia multimedialne nie transkrybowały go ponownie.
- Ustaw `tools.media.audio.enabled: false`, aby globalnie wyłączyć transkrypcję dźwięku.

## Metadane zatwierdzania

Natywne monity zatwierdzania Matrix są zwykłymi zdarzeniami `m.room.message` z zawartością właściwą dla OpenClaw pod kluczem `com.openclaw.approval`. Standardowe klienty nadal renderują treść tekstową, a klienty obsługujące OpenClaw mogą odczytać ustrukturyzowany identyfikator zatwierdzenia, rodzaj, stan, decyzje oraz szczegóły wykonania/pluginu.

Gdy monit jest zbyt długi dla jednego zdarzenia Matrix, OpenClaw dzieli widoczny tekst na fragmenty i dołącza `com.openclaw.approval` tylko do pierwszego fragmentu. Reakcje zezwalające lub odmawiające są powiązane z tym pierwszym zdarzeniem, dzięki czemu długie monity zachowują ten sam cel zatwierdzenia co monity mieszczące się w jednym zdarzeniu.

### Reguły powiadomień push we własnym hostingu dla cichych, sfinalizowanych podglądów

`streaming.mode: "quiet"` powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury — reguła powiadomień push dla każdego użytkownika musi odpowiadać znacznikowi sfinalizowanego podglądu. Pełną procedurę zawiera strona [Reguły powiadomień push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules).

## Pokoje bot-bot

Domyślnie wiadomości Matrix z innych skonfigurowanych kont OpenClaw Matrix są ignorowane. Użyj `allowBots`, aby celowo zezwolić na ruch między agentami:

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

- `allowBots: true` akceptuje wiadomości z innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i wiadomościach prywatnych.
- `allowBots: "mentions"` akceptuje te wiadomości w pokojach tylko wtedy, gdy zawierają widoczną wzmiankę o tym bocie; wiadomości prywatne są nadal dozwolone niezależnie od tego.
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- Zaakceptowane wiadomości od skonfigurowanych botów korzystają ze wspólnego [zabezpieczenia przed pętlą botów](/pl/channels/bot-loop-protection). Skonfiguruj `channels.defaults.botLoopProtection`, a następnie zastąp to ustawienie dla poszczególnych kont za pomocą `channels.matrix.botLoopProtection` lub dla poszczególnych pokojów za pomocą `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw nadal ignoruje wiadomości z tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiadania samemu sobie.
- Matrix nie ma natywnej flagi bota; OpenClaw uznaje wiadomość za „utworzoną przez bota”, jeśli została „wysłana przez inne skonfigurowane konto Matrix w tym Gateway OpenClaw”.

Po włączeniu ruchu między botami we współdzielonych pokojach należy stosować ścisłe listy dozwolonych pokojów oraz wymagania dotyczące wzmianek.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane wraz z pełnym załącznikiem; niezaszyfrowane pokoje używają zwykłego `thumbnail_url`. Konfiguracja nie jest potrzebna — plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` obsługują `--verbose` (pełna diagnostyka), `--json` (dane wyjściowe do odczytu maszynowego) oraz `--account <id>` (konfiguracje z wieloma kontami). Domyślnie dane wyjściowe są zwięzłe.

### Włączanie szyfrowania

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Inicjuje magazyn sekretów i podpisywanie krzyżowe, w razie potrzeby tworzy kopię zapasową kluczy pokojów, a następnie wyświetla stan i kolejne kroki. Przydatne flagi:

- `--recovery-key-stdin` odczytuje klucz odzyskiwania ze standardowego wejścia bez ujawniania go w argumentach procesu; `--recovery-key <key>` pozostaje dostępne w celu zapewnienia zgodności
- `--force-reset-cross-signing` odrzuca bieżącą tożsamość podpisywania krzyżowego i tworzy nową (wyłącznie do celowego użycia)

W przypadku nowego konta włącz E2EE podczas jego tworzenia:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` jest aliasem `--enable-e2ee`. Odpowiednik konfiguracji ręcznej:

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

`verify status` raportuje trzy niezależne sygnały zaufania (`--verbose` wyświetla je wszystkie):

- `Locally trusted`: zaufany tylko przez ten klient
- `Cross-signing verified`: SDK raportuje weryfikację za pomocą podpisywania krzyżowego
- `Signed by owner`: podpisany własnym kluczem samopodpisującym (wyłącznie diagnostycznie)

`Verified by owner` ma wartość `yes` tylko wtedy, gdy `Cross-signing verified` ma wartość `yes`; samo lokalne zaufanie lub podpis właściciela nie wystarczają.

`--allow-degraded-local-state` zwraca diagnostykę w trybie best effort bez wcześniejszego przygotowywania konta Matrix; jest to przydatne w przypadku testów offline lub częściowo skonfigurowanych środowisk.

### Weryfikowanie tego urządzenia za pomocą klucza odzyskiwania

Przekaż klucz odzyskiwania przez standardowe wejście zamiast podawać go w wierszu poleceń:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie raportuje trzy stany:

- `Recovery key accepted`: Matrix zaakceptował klucz dla magazynu sekretów lub zaufania urządzenia.
- `Backup usable`: kopię zapasową kluczy pokojów można wczytać przy użyciu zaufanych danych odzyskiwania.
- `Device verified by owner`: to urządzenie ma pełne zaufanie tożsamości podpisywania krzyżowego Matrix.

Polecenie kończy się niezerowym kodem, gdy pełne zaufanie tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiały kopii zapasowej. W takim przypadku dokończ samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

`verify self` przed pomyślnym zakończeniem oczekuje na `Cross-signing verified: yes`. Użyj `--timeout-ms <ms>`, aby dostosować czas oczekiwania.

Forma z kluczem podanym wprost, `openclaw matrix verify device "<recovery-key>"`, również działa, ale klucz trafia do historii powłoki.

### Inicjowanie lub naprawianie podpisywania krzyżowego

```bash
openclaw matrix verify bootstrap
```

Polecenie naprawy/konfiguracji dla zaszyfrowanych kont. W podanej kolejności:

- inicjuje magazyn sekretów, w miarę możliwości ponownie wykorzystując istniejący klucz odzyskiwania
- inicjuje podpisywanie krzyżowe i przesyła brakujące klucze publiczne
- oznacza i podpisuje krzyżowo bieżące urządzenie
- tworzy kopię zapasową kluczy pokojów po stronie serwera, jeśli jeszcze nie istnieje

Jeśli serwer macierzysty wymaga UIA do przesłania kluczy podpisywania krzyżowego, OpenClaw najpierw próbuje bez uwierzytelniania, następnie `m.login.dummy`, a potem `m.login.password` (wymaga `channels.matrix.password`).

Przydatne flagi:

- `--recovery-key-stdin` (używane razem z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) lub `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość podpisywania krzyżowego (wyłącznie celowo; wymaga aktywnego klucza odzyskiwania zapisanego lub podanego za pomocą `--recovery-key-stdin`)

### Kopia zapasowa kluczy pokojów

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` wskazuje, czy istnieje kopia zapasowa po stronie serwera oraz czy to urządzenie może ją odszyfrować. `backup restore` importuje klucze pokojów z kopii zapasowej do lokalnego magazynu kryptograficznego; pomiń `--recovery-key-stdin`, jeśli klucz odzyskiwania znajduje się już na dysku.

Aby zastąpić uszkodzoną kopię zapasową nową bazą odniesienia (co oznacza zgodę na utratę starej historii, której nie można odzyskać; może również ponownie utworzyć magazyn sekretów, jeśli nie można wczytać sekretu bieżącej kopii zapasowej):

```bash
openclaw matrix verify backup reset --yes
```

Dodaj `--rotate-recovery-key` tylko wtedy, gdy poprzedni klucz odzyskiwania ma celowo przestać odblokowywać nową bazę odniesienia kopii zapasowej.

### Wyświetlanie, wysyłanie i obsługiwanie żądań weryfikacji

```bash
openclaw matrix verify list
```

Wyświetla oczekujące żądania weryfikacji dla wybranego konta.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Wysyła żądanie weryfikacji z tego konta. `--own-user` żąda samoweryfikacji (zaakceptuj monit w innym kliencie Matrix tego samego użytkownika); `--user-id`/`--device-id`/`--room-id` wskazują inną osobę. `--own-user` nie można łączyć z innymi flagami określającymi cel.

Do obsługi cyklu życia na niższym poziomie — zazwyczaj podczas śledzenia przychodzących żądań z innego klienta — poniższe polecenia działają na konkretnym żądaniu `<id>` (wyświetlanym przez `verify list` i `verify request`):

| Polecenie                                  | Przeznaczenie                                                        |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Akceptuje przychodzące żądanie                                      |
| `openclaw matrix verify start <id>`        | Uruchamia przepływ SAS                                               |
| `openclaw matrix verify sas <id>`          | Wyświetla emoji lub liczby dziesiętne SAS                            |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdza, że SAS jest zgodny z tym, co wyświetla drugi klient      |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuca SAS, gdy emoji lub liczby dziesiętne nie są zgodne           |
| `openclaw matrix verify cancel <id>`       | Anuluje; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` obsługują `--user-id` oraz `--room-id` jako wskazówki dotyczące dalszej komunikacji prywatnej, gdy weryfikacja jest powiązana z konkretnym pokojem wiadomości bezpośrednich.

### Uwagi dotyczące wielu kont

Bez `--account <id>` polecenia CLI Matrix używają niejawnego konta domyślnego. W przypadku wielu nazwanych kont i braku `channels.matrix.defaultAccount` polecenia nie próbują zgadywać i wymagają dokonania wyboru. Gdy E2EE jest wyłączone lub niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Zachowanie podczas uruchamiania">
    Gdy ustawiono `encryption: true`, wartością domyślną `startupVerification` jest `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując okres karencji (domyślnie 24 godziny). Dostosuj go za pomocą `startupVerificationCooldownHours` lub wyłącz za pomocą `startupVerification: "off"`.

    Podczas uruchamiania wykonywany jest również zachowawczy przebieg inicjowania mechanizmów kryptograficznych, ponownie wykorzystujący bieżący magazyn sekretów i tożsamość podpisywania krzyżowego. Jeśli stan inicjalizacji jest uszkodzony, OpenClaw podejmuje kontrolowaną próbę naprawy nawet bez `channels.matrix.password`; jeśli serwer macierzysty wymaga UIA z hasłem, podczas uruchamiania rejestrowane jest ostrzeżenie, ale błąd nie powoduje zatrzymania. Urządzenia już podpisane przez właściciela zostają zachowane.

    Pełną procedurę aktualizacji zawiera strona [Migracja Matrix](/pl/channels/matrix-migration).

  </Accordion>

  <Accordion title="Powiadomienia o weryfikacji">
    Matrix publikuje powiadomienia dotyczące cyklu życia weryfikacji w ściśle określonym pokoju wiadomości prywatnych służącym do weryfikacji jako wiadomości `m.notice`: żądanie, gotowość (ze wskazówką „Verify by emoji”), rozpoczęcie/zakończenie oraz szczegóły SAS (emoji/liczby dziesiętne), jeśli są dostępne.

    Przychodzące żądania z innego klienta Matrix są śledzone i automatycznie akceptowane. W przypadku samoweryfikacji OpenClaw automatycznie uruchamia przepływ SAS i potwierdza swoją stronę, gdy dostępna jest weryfikacja za pomocą emoji — nadal trzeba porównać dane i potwierdzić „They match” w kliencie Matrix.

    Powiadomienia systemowe dotyczące weryfikacji nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Usunięte lub nieprawidłowe urządzenie Matrix">
    Jeśli `verify status` informuje, że bieżące urządzenie nie znajduje się już na liście serwera macierzystego, utwórz nowe urządzenie OpenClaw Matrix. W przypadku logowania hasłem:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    W przypadku uwierzytelniania tokenem utwórz nowy token dostępu w kliencie Matrix lub administracyjnym interfejsie użytkownika, a następnie zaktualizuj OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Zastąp `assistant` identyfikatorem konta z polecenia zakończonego niepowodzeniem albo pomiń `--account` w przypadku konta domyślnego.

  </Accordion>

  <Accordion title="Higiena urządzeń">
    Stare urządzenia zarządzane przez OpenClaw mogą się nagromadzić. Wyświetl je i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Magazyn kryptograficzny">
    Szyfrowanie E2EE w Matrix korzysta z oficjalnej ścieżki kryptograficznej `matrix-js-sdk` w języku Rust, z `fake-indexeddb` jako warstwą zgodności IndexedDB. Stan kryptograficzny jest przechowywany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia plików).

    Zaszyfrowany stan środowiska uruchomieniowego znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, migawkę IDB, powiązania wątków oraz stan weryfikacji podczas uruchamiania. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie wykorzystuje najlepszy istniejący katalog główny, dzięki czemu wcześniejszy stan pozostaje widoczny.

    Pojedynczy starszy katalog główny z haszem tokenu może stanowić normalną ścieżkę zachowania ciągłości podczas rotacji tokenu. Jeśli OpenClaw rejestruje `matrix: multiple populated token-hash storage roots detected`, sprawdź katalog konta i zarchiwizuj nieaktualne równorzędne katalogi główne dopiero po potwierdzeniu, że wybrany aktywny katalog główny działa prawidłowo. Zamiast natychmiast je usuwać, zaleca się przeniesienie nieaktualnych katalogów głównych do katalogu `_archive/`.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Przekaż obie opcje w jednym wywołaniu. Matrix bezpośrednio akceptuje adresy URL awatarów `mxc://`; przekazanie `http://`/`https://` powoduje najpierw przesłanie pliku, a następnie zapisanie rozpoznanego adresu URL `mxc://` w `channels.matrix.avatarUrl` (lub w nadpisaniu dla danego konta).

## Wątki

Matrix obsługuje natywne wątki zarówno dla automatycznych odpowiedzi, jak i wysyłania za pomocą narzędzia wiadomości. Zachowanie kontrolują dwa niezależne ustawienia:

### Trasowanie sesji (`sessionScope`)

`dm.sessionScope` określa, jak pokoje wiadomości bezpośrednich Matrix są mapowane na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje wiadomości bezpośrednich z tym samym trasowanym rozmówcą współdzielą jedną sesję.
- `"per-room"`: każdy pokój wiadomości bezpośrednich Matrix otrzymuje własny klucz sesji, nawet dla tego samego rozmówcy.

Jawne powiązania konwersacji zawsze mają pierwszeństwo przed `sessionScope`; powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Odpowiedzi w wątkach (`threadReplies`)

`threadReplies` określa, gdzie bot publikuje odpowiedź:

- `"off"`: odpowiedzi są publikowane na najwyższym poziomie. Przychodzące wiadomości w wątkach pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiedź w wątku tylko wtedy, gdy wiadomość przychodząca już znajdowała się w tym wątku.
- `"always"`: odpowiedź w wątku zakorzenionym w wiadomości wyzwalającej; od pierwszego wyzwolenia ta konwersacja jest trasowana przez odpowiadającą jej sesję ograniczoną do wątku.

`dm.threadReplies` nadpisuje to ustawienie tylko dla wiadomości bezpośrednich — na przykład pozwala zachować izolację wątków pokoi przy jednoczesnym wyłączeniu wątków w wiadomościach bezpośrednich.

### Dziedziczenie wątku i polecenia z ukośnikiem

- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wiadomości wysyłane za pomocą narzędzia wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy są kierowane do tego samego pokoju (lub tego samego użytkownika docelowego wiadomości bezpośrednich), chyba że jawnie podano `threadId`.
- Ponowne wykorzystanie użytkownika docelowego wiadomości bezpośrednich następuje tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego rozmówcę wiadomości bezpośrednich na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do standardowego trasowania ograniczonego do użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach i wiadomościach bezpośrednich Matrix.
- Polecenie `/focus` wykonane na najwyższym poziomie tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy włączono `threadBindings.spawnSessions`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek w miejscu.

Gdy OpenClaw wykryje kolizję pokoju wiadomości bezpośrednich Matrix z innym pokojem wiadomości bezpośrednich w tej samej współdzielonej sesji, publikuje jednorazowe `m.notice`, wskazujące mechanizm awaryjny `/focus` i sugerujące zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy powiązania wątków są włączone.

## Powiązania konwersacji ACP

Pokoje, wiadomości bezpośrednie i istniejące wątki Matrix mogą stać się trwałymi przestrzeniami roboczymi ACP bez zmiany interfejsu czatu.

Szybka procedura operatora:

- Uruchom `/acp spawn codex --bind here` w wiadomości bezpośredniej, pokoju lub istniejącym wątku Matrix, aby kontynuować korzystanie.
- W wiadomości bezpośredniej lub pokoju na najwyższym poziomie bieżąca wiadomość bezpośrednia lub pokój pozostają interfejsem czatu, a przyszłe wiadomości są trasowane do utworzonej sesji ACP.
- W istniejącym wątku `--bind here` wiąże bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

`--bind here` nie tworzy podrzędnego wątku Matrix. `threadBindings.spawnSessions` kontroluje `/acp spawn --thread auto|here`, gdzie OpenClaw musi utworzyć lub powiązać wątek podrzędny.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings` i obsługuje nadpisania dla poszczególnych kanałów:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: kontroluje zarówno tworzenie wątków podagentów, jak i ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: węższe nadpisania dotyczące tworzenia wątków tylko dla podagentów lub tylko dla ACP.
- `threadBindings.defaultSpawnContext`

Tworzenie sesji powiązanych z wątkami Matrix jest domyślnie włączone. Ustaw `threadBindings.spawnSessions: false`, aby zablokować tworzenie lub wiązanie wątków Matrix przez wykonywane na najwyższym poziomie `/focus` i `/acp spawn --thread auto|here`. Ustaw `threadBindings.defaultSpawnContext: "isolated"`, jeśli natywne tworzenie wątków podagentów nie powinno rozwidlać transkrypcji nadrzędnej.

## Reakcje

Matrix obsługuje reakcje wychodzące, powiadomienia o reakcjach przychodzących oraz reakcje potwierdzające.

Narzędzia reakcji wychodzących są kontrolowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota na to zdarzenie.
- `remove: true` usuwa z bota tylko wskazaną reakcję emoji.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie                 | Kolejność                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | dla konta -> kanał -> `messages.ackReaction` -> rezerwowe emoji tożsamości agenta   |
| `ackReactionScope`      | dla konta -> kanał -> `messages.ackReactionScope` -> domyślne `"group-mentions"` |
| `reactionNotifications` | dla konta -> kanał -> domyślne `"own"`                                           |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy dotyczą wiadomości Matrix utworzonych przez bota; `"off"` wyłącza zdarzenia systemowe reakcji. Usunięcia reakcji nie są syntetyzowane jako zdarzenia systemowe — Matrix udostępnia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` określa, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju wyzwala agenta. Wartością rezerwową jest `messages.groupChat.historyLimit`; jeśli oba ustawienia są nieokreślone, obowiązuje efekślna wartość `0` (wyłączone).
- Historia pokoi Matrix obejmuje wyłącznie dany pokój; wiadomości bezpośrednie nadal korzystają ze standardowej historii sesji.
- Historia pokoju obejmuje tylko oczekujące wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie tworzy migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest uwzględniana w `InboundHistory`; dla tej tury pozostaje w głównej treści przychodzącej.
- Ponowne próby obsługi tego samego zdarzenia Matrix wykorzystują pierwotną migawkę historii zamiast przesuwać ją do nowszych wiadomości w pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzielone ustawienie `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrana treść odpowiedzi, wiadomości główne wątków i oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Dodatkowy kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne mechanizmy sprawdzania list dozwolonych użytkowników lub pokoi.
- `contextVisibility: "allowlist_quote"` działa podobnie do `allowlist`, ale nadal zachowuje jedną jawnie cytowaną odpowiedź.

Wpływa to wyłącznie na widoczność dodatkowego kontekstu, a nie na możliwość wyzwolenia odpowiedzi przez samą wiadomość przychodzącą. Autoryzacja wyzwalacza nadal pochodzi z `groupPolicy`, `groups`, `groupAllowFrom` oraz ustawień zasad wiadomości bezpośrednich.

## Zasady wiadomości bezpośrednich i pokoi

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

Aby całkowicie wyciszyć wiadomości bezpośrednie przy zachowaniu działania pokoi, ustaw `dm.enabled: false`:

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

Informacje o wyzwalaniu przez wzmianki i działaniu list dozwolonych zawiera sekcja [Grupy](/pl/channels/groups).

Przykład parowania wiadomości bezpośrednich Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie wykorzystuje ten sam oczekujący kod parowania i po krótkim okresie wyciszenia może wysłać odpowiedź z przypomnieniem zamiast generować nowy kod.

Informacje o współdzielonym procesie parowania wiadomości bezpośrednich i układzie magazynu zawiera sekcja [Parowanie](/pl/channels/pairing).

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich ulegnie rozbieżności, OpenClaw może zachować nieaktualne mapowania `m.direct`, wskazujące stare pokoje jednoosobowe zamiast aktywnej wiadomości bezpośredniej. Sprawdź bieżące mapowanie rozmówcy:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Oba polecenia przyjmują `--account <id>` w konfiguracjach z wieloma kontami. Proces naprawy:

- preferuje ścisły pokój wiadomości bezpośrednich 1:1, który jest już zmapowany w `m.direct`
- w przeciwnym razie wybiera dowolny aktualnie dołączony ścisły pokój wiadomości bezpośrednich 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i zapisuje ponownie `m.direct`, jeśli nie istnieje prawidłowo działająca wiadomość bezpośrednia

Stare pokoje nie są usuwane automatycznie. Mechanizm wybiera prawidłowo działającą wiadomość bezpośrednią i aktualizuje mapowanie, aby przyszłe wiadomości Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości bezpośrednich trafiały do właściwego pokoju.

## Zatwierdzanie wykonywania

Matrix może działać jako natywny klient zatwierdzania. Skonfiguruj w `channels.matrix.execApprovals` (lub `channels.matrix.accounts.<account>.execApprovals` w przypadku nadpisania dla konta):

- `enabled`: dostarcza żądania zatwierdzenia za pomocą natywnych monitów Matrix. Wartość nieustawiona lub `"auto"` włącza tę funkcję automatycznie, gdy można rozpoznać co najmniej jedną osobę zatwierdzającą; ustaw `false`, aby jawnie ją wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnionych do zatwierdzania żądań wykonania. Wartością rezerwową jest `channels.matrix.dm.allowFrom`.
- `target`: miejsce docelowe monitów. `"dm"` (domyślnie) wysyła je do wiadomości bezpośrednich osób zatwierdzających; `"channel"` wysyła je do źródłowego pokoju lub wiadomości bezpośredniej; `"both"` wysyła je do obu miejsc.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych agentów lub sesji wyzwalających dostarczanie przez Matrix.

Autoryzacja różni się nieznacznie zależnie od rodzaju zatwierdzenia:

- **Zatwierdzanie wykonywania** korzysta z `execApprovals.approvers`, a wartością rezerwową jest `dm.allowFrom`.
- **Zatwierdzanie Pluginów** jest autoryzowane wyłącznie przez `dm.allowFrom`.

Oba rodzaje korzystają ze skrótów reakcji Matrix i aktualizacji wiadomości. Osoby zatwierdzające widzą skróty reakcji w głównej wiadomości z prośbą o zatwierdzenie:

- ✅ zezwól jednorazowo
- ❌ odmów
- ♾️ zawsze zezwalaj (gdy obowiązująca polityka wykonywania na to pozwala)

Awaryjne polecenia z ukośnikiem: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozpoznane osoby zatwierdzające mogą zatwierdzić lub odrzucić. Dostarczanie zatwierdzeń wykonania do kanału obejmuje treść polecenia — opcje `channel` lub `both` należy włączać wyłącznie w zaufanych pokojach.

Powiązane: [Zatwierdzenia wykonania](/pl/tools/exec-approvals).

## Polecenia z ukośnikiem

Polecenia z ukośnikiem (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w wiadomościach prywatnych. W pokojach OpenClaw rozpoznaje również polecenia poprzedzone własną wzmianką bota w Matrix, dzięki czemu `@bot:server /new` uruchamia ścieżkę polecenia bez niestandardowego wyrażenia regularnego wzmianki — pozwala to botowi reagować na wpisy w stylu pokojowym `@mention /command`, które Element i podobne klienty wysyłają, gdy użytkownik uzupełni klawiszem Tab nazwę bota przed wpisaniem polecenia.

Nadal obowiązują reguły autoryzacji: nadawcy poleceń muszą spełniać te same zasady listy dozwolonych lub właściciela dla wiadomości prywatnych albo pokojów, co nadawcy zwykłych wiadomości.

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

- Wartości `channels.matrix` najwyższego poziomu pełnią funkcję wartości domyślnych dla nazwanych kont, chyba że dane konto je zastępuje.
- Dziedziczony wpis pokoju można ograniczyć do określonego konta za pomocą `groups.<room>.account`. Wpisy bez `account` są współdzielone między kontami; `account: "default"` nadal działa, gdy konto domyślne jest skonfigurowane na najwyższym poziomie.

**Wybór konta domyślnego:**

- Ustaw `defaultAccount`, aby wskazać nazwane konto preferowane przez niejawne trasowanie, sondowanie i polecenia CLI.
- Jeśli istnieje wiele kont, a jedno z nich nosi dosłownie nazwę `default`, OpenClaw używa go niejawnie nawet wtedy, gdy `defaultAccount` nie jest ustawione.
- W przypadku wielu nazwanych kont bez wybranego konta domyślnego polecenia CLI odmawiają zgadywania — należy ustawić `defaultAccount` lub przekazać `--account <id>`.
- Blok `channels.matrix.*` najwyższego poziomu jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego dane uwierzytelniające są kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta pozostają wykrywalne na podstawie `homeserver` + `userId`, gdy zapisane w pamięci podręcznej poświadczenia wystarczają do uwierzytelnienia.

**Promowanie:**

- Gdy podczas naprawy lub konfiguracji OpenClaw promuje konfigurację pojedynczego konta do konfiguracji wielu kont, zachowuje istniejące nazwane konto, jeśli takie istnieje lub jeśli `defaultAccount` już na nie wskazuje. Do promowanego konta przenoszone są wyłącznie klucze uwierzytelniania i inicjalizacji Matrix; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.

Wspólny wzorzec obsługi wielu kont opisano w [dokumentacji konfiguracji](/pl/gateway/config-channels#multi-account-all-channels).

## Prywatne serwery macierzyste i serwery w sieci LAN

Domyślnie OpenClaw blokuje prywatne i wewnętrzne serwery macierzyste Matrix w celu ochrony przed SSRF, chyba że zostaną jawnie dozwolone dla poszczególnych kont.

Jeśli serwer macierzysty działa na hoście lokalnym, pod adresem IP sieci LAN/Tailscale lub pod wewnętrzną nazwą hosta, należy włączyć `network.dangerouslyAllowPrivateNetwork` dla tego konta:

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

Ta zgoda zezwala wyłącznie na zaufane cele prywatne i wewnętrzne. Publiczne serwery macierzyste korzystające z nieszyfrowanego połączenia, takie jak `http://matrix.example.org:8008`, pozostają zablokowane. W miarę możliwości należy preferować `https://`.

## Przekazywanie ruchu Matrix przez serwer proxy

Jeśli wdrożenie Matrix wymaga jawnego wychodzącego serwera proxy HTTP(S), należy ustawić `channels.matrix.proxy`:

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

Nazwane konta mogą zastąpić wartość domyślną najwyższego poziomu za pomocą `channels.matrix.accounts.<id>.proxy`. OpenClaw używa tego samego ustawienia serwera proxy dla ruchu Matrix w czasie działania oraz sond stanu konta.

## Rozpoznawanie celów

Matrix akceptuje następujące formy celów wszędzie tam, gdzie OpenClaw wymaga wskazania pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

W identyfikatorach pokojów Matrix wielkość liter ma znaczenie. Podczas konfigurowania jawnych celów dostarczania, zadań cron, powiązań lub list dozwolonych należy używać dokładnie takiej pisowni identyfikatora pokoju pod względem wielkości liter, jak w Matrix. OpenClaw przechowuje wewnętrzne klucze sesji w postaci kanonicznej, dlatego klucze zapisane małymi literami nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie katalogowe na żywo korzysta z zalogowanego konta Matrix:

- Wyszukiwanie użytkowników odpytuje katalog użytkowników Matrix na danym serwerze macierzystym.
- Wyszukiwanie pokojów akceptuje bezpośrednio jawne identyfikatory i aliasy pokojów. Wyszukiwanie według nazw dołączonych pokojów odbywa się w miarę możliwości i dotyczy wyłącznie list dozwolonych pokojów w czasie działania, gdy ustawiono `dangerouslyAllowNameMatching: true`.
- Jeśli nazwy pokoju nie można rozpoznać jako identyfikatora lub aliasu, jest ona ignorowana podczas rozpoznawania listy dozwolonych w czasie działania.

## Dokumentacja konfiguracji

Pola użytkowników pełniące funkcję list dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akceptują pełne identyfikatory użytkowników Matrix (najbezpieczniejsza opcja). Wpisy niebędące identyfikatorami są domyślnie ignorowane. Jeśli ustawiono `dangerouslyAllowNameMatching: true`, dokładne dopasowania nazw wyświetlanych w katalogu Matrix są rozpoznawane podczas uruchamiania oraz po każdej zmianie listy dozwolonych, gdy monitor działa; wpisy, których nie można rozpoznać, są ignorowane w czasie działania.

Klucze listy dozwolonych pokojów (`groups`, starsze `rooms`) powinny być identyfikatorami lub aliasami pokojów. Klucze będące zwykłymi nazwami pokojów są domyślnie ignorowane; `dangerouslyAllowNameMatching: true` przywraca wyszukiwanie według nazw dołączonych pokojów w miarę możliwości.

### Konto i połączenie

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta wyświetlana konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane ustawienia zastępujące dla poszczególnych kont. Wartości `channels.matrix` najwyższego poziomu są dziedziczone jako domyślne.
- `homeserver`: adres URL serwera macierzystego, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwala temu kontu na łączenie się z `localhost`, adresami IP sieci LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny adres URL serwera proxy HTTP(S) dla ruchu Matrix. Obsługiwane jest zastępowanie dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu do uwierzytelniania opartego na tokenie. Obsługiwane są wartości tekstowe i SecretRef pochodzące z dostawców env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości tekstowe i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia używana podczas logowania za pomocą hasła.
- `avatarUrl`: zapisany adres URL awatara własnego profilu, używany do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.

### Szyfrowanie

- `encryption`: włącza E2EE. Wartość domyślna: `false`.
- `startupVerification`: `"if-unverified"` (wartość domyślna przy włączonym E2EE) lub `"off"`. Automatycznie żąda samodzielnej weryfikacji podczas uruchamiania, gdy to urządzenie nie jest zweryfikowane.
- `startupVerificationCooldownHours`: okres oczekiwania przed następnym automatycznym żądaniem podczas uruchamiania. Wartość domyślna: `24`.

### Dostęp i polityka

- `groupPolicy`: `"open"`, `"allowlist"` lub `"disabled"`. Wartość domyślna: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w pokojach.
- `mentionPatterns`: wyrażenia regularne o określonym zakresie dla wzmianek w pokojach. Obiekt z `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Określa, czy skonfigurowane `agents.list[].groupChat.mentionPatterns` mają zastosowanie do poszczególnych pokojów.
- `dm.enabled`: gdy ma wartość `false`, ignoruje wszystkie wiadomości prywatne. Wartość domyślna: `true`.
- `dm.policy`: `"pairing"` (wartość domyślna), `"allowlist"`, `"open"` lub `"disabled"`. Ma zastosowanie po dołączeniu bota i sklasyfikowaniu pokoju jako wiadomości prywatnej; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu wiadomości prywatnych.
- `dm.sessionScope`: `"per-user"` (wartość domyślna) lub `"per-room"`.
- `dm.threadReplies`: ustawienie zastępujące wątkowanie odpowiedzi wyłącznie dla wiadomości prywatnych (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuje wiadomości od innych skonfigurowanych kont botów Matrix (`true` lub `"mentions"`).
- `allowlistOnly`: gdy ma wartość `true`, wymusza ustawienie `"allowlist"` dla wszystkich aktywnych polityk wiadomości prywatnych (z wyjątkiem `"disabled"`) oraz polityk grupowych `"open"`. Nie zmienia polityk `"disabled"`.
- `dangerouslyAllowNameMatching`: gdy ma wartość `true`, zezwala na wyszukiwanie nazw wyświetlanych w katalogu Matrix dla wpisów listy dozwolonych użytkowników oraz wyszukiwanie nazw dołączonych pokojów dla kluczy listy dozwolonych pokojów. Należy preferować pełne identyfikatory `@user:server` oraz identyfikatory lub aliasy pokojów.
- `autoJoin`: `"always"`, `"allowlist"` lub `"off"`. Wartość domyślna: `"off"`. Dotyczy każdego zaproszenia Matrix, w tym zaproszeń w stylu wiadomości prywatnych.
- `autoJoinAllowlist`: pokoje lub aliasy dozwolone, gdy `autoJoin` ma wartość `"allowlist"`. Wpisy aliasów są rozpoznawane względem serwera macierzystego, a nie względem stanu deklarowanego przez zapraszający pokój.
- `contextVisibility`: dodatkowa widoczność kontekstu (`"all"` domyślnie, `"allowlist"`, `"allowlist_quote"`).

### Sposób odpowiadania

- `replyToMode`: `"off"` (domyślnie), `"first"`, `"all"` lub `"batched"`.
- `threadReplies`: `"off"` (wartość domyślna najwyższego poziomu jest rozstrzygana jako `"inbound"`, chyba że zostanie ustawiona jawnie), `"inbound"` lub `"always"`.
- `threadBindings`: nadpisania dla poszczególnych kanałów dotyczące routingu i cyklu życia sesji powiązanych z wątkami.
- `streaming`: zagnieżdżony obiekt `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` to `"off"` (domyślnie), `"partial"`, `"quiet"` lub `"progress"`. Starsze zapisy skalarne/logiczne są migrowane za pomocą `openclaw doctor --fix`.
- `streaming.block.enabled`: gdy `true`, ukończone bloki asystenta są zachowywane jako osobne komunikaty o postępie. Wartość domyślna: `false`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg dodawany na początku odpowiedzi wychodzących.
- `textChunkLimit`: rozmiar fragmentu wychodzącego w znakach, gdy `streaming.chunkMode: "length"`. Wartość domyślna: `4000`.
- `streaming.chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) lub `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju dołączanych jako `InboundHistory`, gdy wiadomość w pokoju uruchamia agenta. W razie braku wartości używane jest `messages.groupChat.historyLimit`; efektywna wartość domyślna to `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłania wychodzącego i przetwarzania przychodzącego. Wartość domyślna: `20`.

### Ustawienia reakcji

- `ackReaction`: nadpisanie reakcji potwierdzającej dla tego kanału/konta.
- `ackReactionScope`: nadpisanie zakresu (domyślnie `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadamiania o reakcjach przychodzących (domyślnie `"own"`, `"off"`).

### Narzędzia i nadpisania dla poszczególnych pokojów

- `actions`: kontrola dostępu do narzędzi dla poszczególnych działań (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa zasad dla poszczególnych pokojów. Tożsamość sesji używa stabilnego identyfikatora pokoju po jego ustaleniu. (`rooms` jest starszym aliasem).
  - `groups.<room>.account`: ogranicza jeden odziedziczony wpis pokoju do określonego konta.
  - `groups.<room>.enabled`: przełącznik dla poszczególnych pokojów. Gdy `false`, pokój jest ignorowany tak, jakby nie znajdował się na mapie.
  - `groups.<room>.requireMention`: nadpisanie wymagania wzmianki na poziomie kanału dla poszczególnych pokojów.
  - `groups.<room>.allowBots`: nadpisanie ustawienia na poziomie kanału dla poszczególnych pokojów (`true` lub `"mentions"`).
  - `groups.<room>.botLoopProtection`: nadpisanie budżetu ochrony przed pętlami między botami dla poszczególnych pokojów.
  - `groups.<room>.users`: lista dozwolonych nadawców dla poszczególnych pokojów.
  - `groups.<room>.tools`: nadpisania dozwolonych/zabronionych narzędzi dla poszczególnych pokojów.
  - `groups.<room>.autoReply`: nadpisanie kontroli dostępu opartej na wzmiankach dla poszczególnych pokojów. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza ich ponowne włączenie.
  - `groups.<room>.skills`: filtr Skills dla poszczególnych pokojów.
  - `groups.<room>.systemPrompt`: fragment monitu systemowego dla poszczególnych pokojów.

### Ustawienia zatwierdzania wykonania

- `execApprovals.enabled`: dostarcza prośby o zatwierdzenie wykonania za pośrednictwem natywnych monitów Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnionych do zatwierdzania. W razie braku wartości używane jest `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` lub `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów/sesji na potrzeby dostarczania.

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie w wiadomościach prywatnych i przebieg parowania
- [Grupy](/pl/channels/groups) - działanie czatów grupowych i kontrola dostępu oparta na wzmiankach
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
