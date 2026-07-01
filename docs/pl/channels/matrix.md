---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie Matrix E2EE i weryfikacji
summary: Status obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Macierz
x-i18n:
    generated_at: "2026-07-01T13:23:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix to pobieralny Plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Instalacja

Zainstaluj Matrix z ClawHub przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/matrix
```

Nieprefiksowane specyfikacje Pluginów najpierw próbują ClawHub, a potem przechodzą do awaryjnego npm. Aby wymusić źródło rejestru, użyj `openclaw plugins install clawhub:@openclaw/matrix` albo `openclaw plugins install npm:@openclaw/matrix`.

Z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` rejestruje i włącza Plugin, więc osobny krok `openclaw plugins enable matrix` nie jest potrzebny. Plugin nadal nic nie robi, dopóki nie skonfigurujesz kanału poniżej. Zobacz [Pluginy](/pl/tools/plugin), aby poznać ogólne zachowanie Pluginów i zasady instalacji.

## Konfiguracja

1. Utwórz konto Matrix na swoim homeserverze.
2. Skonfiguruj `channels.matrix` za pomocą `homeserver` + `accessToken` albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie gateway.
4. Rozpocznij wiadomość prywatną z botem albo zaproś go do pokoju (zobacz [automatyczne dołączanie](#auto-join) - świeże zaproszenia trafiają tylko wtedy, gdy `autoJoin` na to pozwala).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o: URL homeservera, metodę uwierzytelniania (token dostępu albo hasło), identyfikator użytkownika (tylko uwierzytelnianie hasłem), opcjonalną nazwę urządzenia, czy włączyć E2EE oraz czy skonfigurować dostęp do pokojów i automatyczne dołączanie.

Jeśli pasujące zmienne środowiskowe `MATRIX_*` już istnieją, a wybrane konto nie ma zapisanego uwierzytelnienia, kreator proponuje skrót przez zmienną środowiskową. Aby rozwiązać nazwy pokojów przed zapisaniem listy dozwolonych, uruchom `openclaw channels resolve --channel matrix "Project Room"`. Gdy E2EE jest włączone, kreator zapisuje konfigurację i uruchamia ten sam bootstrap co [`openclaw matrix encryption setup`](#encryption-and-verification).

### Minimalna konfiguracja

Oparta na tokenie:

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

Oparta na haśle (token jest buforowany po pierwszym logowaniu):

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

`channels.matrix.autoJoin` domyślnie ma wartość `off`. Przy ustawieniu domyślnym bot nie pojawi się w nowych pokojach ani wiadomościach prywatnych ze świeżych zaproszeń, dopóki nie dołączysz ręcznie.

OpenClaw nie może stwierdzić w momencie zaproszenia, czy zaproszony pokój jest wiadomością prywatną, czy grupą, więc wszystkie zaproszenia - także zaproszenia w stylu wiadomości prywatnych - najpierw przechodzą przez `autoJoin`. `dm.policy` ma zastosowanie dopiero później, po dołączeniu bota i sklasyfikowaniu pokoju.

<Warning>
Ustaw `autoJoin: "allowlist"` plus `autoJoinAllowlist`, aby ograniczyć zaproszenia akceptowane przez bota, albo `autoJoin: "always"`, aby akceptować każde zaproszenie.

`autoJoinAllowlist` akceptuje tylko stabilne cele: `!roomId:server`, `#alias:server` albo `*`. Zwykłe nazwy pokojów są odrzucane; wpisy aliasów są rozwiązywane względem homeservera, a nie względem stanu deklarowanego przez zaproszony pokój.
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

Aby akceptować każde zaproszenie, użyj `autoJoin: "always"`.

### Formaty celów listy dozwolonych

Listy dozwolonych dla wiadomości prywatnych i pokojów najlepiej wypełniać stabilnymi identyfikatorami:

- Wiadomości prywatne (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): użyj `@user:server`. Nazwy wyświetlane są domyślnie ignorowane, ponieważ są zmienne; ustaw `dangerouslyAllowNameMatching: true` tylko wtedy, gdy wyraźnie potrzebujesz zgodności z wpisami nazw wyświetlanych.
- Klucze listy dozwolonych pokojów (`groups`, starsze `rooms`): użyj `!room:server` albo `#alias:server`. Zwykłe nazwy pokojów są domyślnie ignorowane; ustaw `dangerouslyAllowNameMatching: true` tylko wtedy, gdy wyraźnie potrzebujesz zgodności z wyszukiwaniem nazw dołączonych pokojów.
- Listy dozwolonych zaproszeń (`autoJoinAllowlist`): użyj `!room:server`, `#alias:server` albo `*`. Zwykłe nazwy pokojów są odrzucane.

### Normalizacja identyfikatora konta

Kreator konwertuje przyjazną nazwę na znormalizowany identyfikator konta. Na przykład `Ops Bot` staje się `ops-bot`. Interpunkcja jest escapowana w zakresowych nazwach zmiennych środowiskowych, aby dwa konta nie mogły kolidować: `-` → `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

### Buforowane dane uwierzytelniające

Matrix przechowuje buforowane dane uwierzytelniające w `~/.openclaw/credentials/matrix/`:

- konto domyślne: `credentials.json`
- konta nazwane: `credentials-<account>.json`

Gdy istnieją tam buforowane dane uwierzytelniające, OpenClaw traktuje Matrix jako skonfigurowany, nawet jeśli token dostępu nie znajduje się w pliku konfiguracji - obejmuje to konfigurację, `openclaw doctor` oraz sondy statusu kanału.

### Zmienne środowiskowe

Używane, gdy równoważny klucz konfiguracji nie jest ustawiony. Konto domyślne używa nazw bez prefiksu; konta nazwane używają identyfikatora konta wstawionego przed sufiksem.

| Konto domyślne        | Konto nazwane (`<ID>` to znormalizowany identyfikator konta) |
| --------------------- | ------------------------------------------------------------ |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                     |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                   |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                        |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                       |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                      |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                    |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                   |

Dla konta `ops` nazwy stają się `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` i tak dalej. Zmienne środowiskowe klucza odzyskiwania są odczytywane przez przepływy CLI obsługujące odzyskiwanie (`verify backup restore`, `verify device`, `verify bootstrap`), gdy przekazujesz klucz przez potok za pomocą `--recovery-key-stdin`.

`MATRIX_HOMESERVER` nie może być ustawione z workspace `.env`; zobacz [Pliki workspace `.env`](/pl/gateway/security).

## Przykład konfiguracji

Praktyczna baza z parowaniem wiadomości prywatnych, listą dozwolonych pokojów i E2EE:

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

## Podglądy strumieniowania

Strumieniowanie odpowiedzi Matrix jest opt-in. `streaming` kontroluje, jak OpenClaw dostarcza odpowiedź asystenta w toku; `blockStreaming` kontroluje, czy każdy ukończony blok jest zachowywany jako osobna wiadomość Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Aby zachować podglądy odpowiedzi na żywo, ale ukryć tymczasowe linie narzędzi/postępu, użyj formy obiektowej:

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

Pełna forma obiektowa akceptuje `{ mode, preview, progress }`:

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

- `progress.label`: etykieta niestandardowa, `"auto"` albo brak ustawienia, aby wybrać spośród skonfigurowanych lub wbudowanych etykiet, albo `false`, aby ukryć linię etykiety.
- `progress.labels`: etykiety kandydujące używane tylko wtedy, gdy `label` ma wartość `"auto"` albo nie jest ustawione. Pozostaw nieustawione, aby użyć wbudowanych wartości domyślnych.
- `progress.maxLines`: maksymalna liczba kroczących linii postępu zachowywanych w szkicu. Po tym limicie starsze linie są przycinane.
- `progress.maxLineChars`: maksymalna liczba znaków na zwięzłą linię postępu przed obcięciem.
- `progress.toolProgress`: gdy `true` (domyślnie), aktywność narzędzi/postępu na żywo pojawia się w szkicu.

| `streaming`          | Zachowanie                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (domyślnie)  | Czeka na pełną odpowiedź, wysyła raz. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                            |
| `"partial"`          | Edytuje jedną zwykłą wiadomość tekstową w miejscu, gdy model pisze bieżący blok. Standardowi klienci Matrix mogą powiadomić przy pierwszym podglądzie, a nie przy końcowej edycji.        |
| `"quiet"`            | Tak samo jak `"partial"`, ale wiadomość jest niepowiadamiającą notką. Odbiorcy dostają powiadomienie dopiero, gdy reguła push danego użytkownika dopasuje sfinalizowaną edycję (poniżej). |
| `"progress"`         | Wysyła pojedyncze zwięzłe linie postępu przy użyciu szkicu postępu.                                                                                                                       |

`blockStreaming` jest niezależne od `streaming`:

| `streaming`             | `blockStreaming: true`                                                     | `blockStreaming: false` (domyślnie)                      |
| ----------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------- |
| `"partial"` / `"quiet"` | Szkic na żywo dla bieżącego bloku, ukończone bloki zachowane jako wiadomości | Szkic na żywo dla bieżącego bloku, finalizowany w miejscu |
| `"off"`                 | Jedna powiadamiająca wiadomość Matrix na ukończony blok                    | Jedna powiadamiająca wiadomość Matrix dla pełnej odpowiedzi |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru zdarzenia Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do dostarczania tylko wersji końcowej.
- Odpowiedzi multimedialne zawsze wysyłają załączniki normalnie. Jeśli przestarzały podgląd nie może już zostać bezpiecznie użyty ponownie, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy aktywne jest strumieniowanie podglądu Matrix. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu dla tekstu odpowiedzi, ale pozostawić postęp narzędzi na normalnej ścieżce dostarczania.
- Edycje podglądu kosztują dodatkowe wywołania API Matrix. Pozostaw `streaming: "off"`, jeśli chcesz najbardziej konserwatywny profil limitów częstotliwości.

## Wiadomości głosowe

Przychodzące notatki głosowe Matrix są transkrybowane przed bramką wzmianki w pokoju. Dzięki temu notatka głosowa, która wypowiada nazwę bota, może uruchomić agenta w pokoju z `requireMention: true`, a agent otrzymuje transkrypcję zamiast tylko zastępczego załącznika audio.

Matrix używa współdzielonego dostawcy multimediów audio skonfigurowanego w `tools.media.audio`, takiego jak OpenAI `gpt-4o-mini-transcribe`. Zobacz [Omówienie narzędzi multimedialnych](/pl/tools/media-overview), aby poznać konfigurację dostawcy i limity.

Szczegóły zachowania:

- Zdarzenia `m.audio` oraz zdarzenia `m.file` z typem MIME `audio/*` kwalifikują się.
- W zaszyfrowanych pokojach OpenClaw odszyfrowuje załącznik przez istniejącą ścieżkę multimediów Matrix przed transkrypcją.
- Transkrypt jest oznaczany w prompcie agenta jako wygenerowany maszynowo i niezaufany.
- Załącznik jest oznaczany jako już transkrybowany, aby dalsze narzędzia multimedialne nie transkrybowały ponownie tej samej notatki głosowej.
- Ustaw `tools.media.audio.enabled: false`, aby globalnie wyłączyć transkrypcję audio.

## Metadane zatwierdzania

Natywne prompty zatwierdzania Matrix to zwykłe zdarzenia `m.room.message` z niestandardową treścią zdarzenia specyficzną dla OpenClaw pod `com.openclaw.approval`. Matrix zezwala na niestandardowe klucze treści zdarzeń, więc standardowe klienty nadal renderują treść tekstową, a klienty świadome OpenClaw mogą odczytać ustrukturyzowany identyfikator zatwierdzenia, rodzaj, stan, dostępne decyzje oraz szczegóły exec/Plugin.

Gdy prompt zatwierdzania jest zbyt długi dla jednego zdarzenia Matrix, OpenClaw dzieli widoczny tekst na fragmenty i dołącza `com.openclaw.approval` tylko do pierwszego fragmentu. Reakcje dla decyzji zezwól/odmów są powiązane z tym pierwszym zdarzeniem, więc długie prompty zachowują ten sam cel zatwierdzania co prompty jednozdarzeniowe.

### Reguły push w self-hostingu dla cichych sfinalizowanych podglądów

`streaming: "quiet"` powiadamia odbiorców tylko po sfinalizowaniu bloku lub tury - reguła push przypisana do użytkownika musi dopasować znacznik sfinalizowanego podglądu. Zobacz [reguły push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules), aby poznać pełną procedurę (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserverów).

## Pokoje bot-bot

Domyślnie wiadomości Matrix od innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, gdy celowo chcesz ruch Matrix między agentami:

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

- `allowBots: true` akceptuje wiadomości od innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i wiadomościach prywatnych.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy widocznie wspominają tego bota w pokojach. Wiadomości prywatne nadal są dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- Zaakceptowane wiadomości skonfigurowanych botów używają wspólnej [ochrony przed pętlą botów](/pl/channels/bot-loop-protection). Skonfiguruj `channels.defaults.botLoopProtection`, a następnie nadpisz przez `channels.matrix.botLoopProtection` albo `channels.matrix.groups.<room>.botLoopProtection`, gdy jeden pokój wymaga innego budżetu.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli samoodpowiedzi.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „autorstwo bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym Gateway OpenClaw”.

Włączając ruch bot-bot we współdzielonych pokojach, używaj ścisłych list dozwolonych pokojów i wymagań dotyczących wzmianek.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Nieszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Konfiguracja nie jest potrzebna - Plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` akceptują `--verbose` (pełna diagnostyka), `--json` (wynik czytelny maszynowo) oraz `--account <id>` (konfiguracje wielokontowe). Wynik jest domyślnie zwięzły, z cichym wewnętrznym logowaniem SDK. Poniższe przykłady pokazują formę kanoniczną; dodawaj flagi w razie potrzeby.

### Włącz szyfrowanie

```bash
openclaw matrix encryption setup
```

Inicjalizuje magazyn sekretów i podpisywanie krzyżowe, tworzy kopię zapasową kluczy pokojów, jeśli jest potrzebna, a następnie wypisuje status i kolejne kroki. Przydatne flagi:

- `--recovery-key <key>` zastosuj klucz odzyskiwania przed inicjalizacją (preferuj formę stdin udokumentowaną poniżej)
- `--force-reset-cross-signing` odrzuć bieżącą tożsamość podpisywania krzyżowego i utwórz nową (używaj tylko celowo)

Dla nowego konta włącz E2EE podczas tworzenia:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` jest aliasem `--enable-e2ee`.

Równoważnik ręcznej konfiguracji:

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

### Status i sygnały zaufania

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` zgłasza trzy niezależne sygnały zaufania (`--verbose` pokazuje je wszystkie):

- `Locally trusted`: zaufane tylko przez tego klienta
- `Cross-signing verified`: SDK zgłasza weryfikację przez podpisywanie krzyżowe
- `Signed by owner`: podpisane własnym kluczem samopodpisującym (tylko diagnostyka)

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy `Cross-signing verified` ma wartość `yes`. Samo lokalne zaufanie lub podpis właściciela nie wystarcza.

`--allow-degraded-local-state` zwraca diagnostykę best-effort bez wcześniejszego przygotowania konta Matrix; przydatne dla sond offline lub częściowo skonfigurowanych.

### Zweryfikuj to urządzenie kluczem odzyskiwania

Klucz odzyskiwania jest poufny - przekaż go przez stdin zamiast podawać w wierszu poleceń. Ustaw `MATRIX_RECOVERY_KEY` (albo `MATRIX_<ID>_RECOVERY_KEY` dla nazwanego konta):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie zgłasza trzy stany:

- `Recovery key accepted`: Matrix zaakceptował klucz dla magazynu sekretów lub zaufania urządzenia.
- `Backup usable`: kopię zapasową kluczy pokojów można załadować z zaufanym materiałem odzyskiwania.
- `Device verified by owner`: to urządzenie ma pełne zaufanie tożsamości podpisywania krzyżowego Matrix.

Kończy się kodem niezerowym, gdy pełne zaufanie tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiał kopii zapasowej. W takim przypadku dokończ samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

`verify self` czeka na `Cross-signing verified: yes`, zanim zakończy się powodzeniem. Użyj `--timeout-ms <ms>`, aby dostroić czas oczekiwania.

Forma z literalnym kluczem `openclaw matrix verify device "<recovery-key>"` jest również akceptowana, ale klucz trafi do historii powłoki.

### Zainicjalizuj lub napraw podpisywanie krzyżowe

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` to polecenie naprawy i konfiguracji dla zaszyfrowanych kont. W kolejności:

- inicjalizuje magazyn sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjalizuje podpisywanie krzyżowe i przesyła brakujące klucze publiczne
- oznacza i podpisuje krzyżowo bieżące urządzenie
- tworzy po stronie serwera kopię zapasową kluczy pokojów, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga UIA do przesłania kluczy podpisywania krzyżowego, OpenClaw najpierw próbuje bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`).

Przydatne flagi:

- `--recovery-key-stdin` (połącz z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) albo `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość podpisywania krzyżowego (tylko celowo; wymaga zapisania aktywnego klucza odzyskiwania lub podania go przez `--recovery-key-stdin`)

### Kopia zapasowa kluczy pokojów

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` pokazuje, czy istnieje kopia zapasowa po stronie serwera i czy to urządzenie może ją odszyfrować. `backup restore` importuje klucze pokojów z kopii zapasowej do lokalnego magazynu kryptograficznego; jeśli klucz odzyskiwania jest już na dysku, możesz pominąć `--recovery-key-stdin`.

Aby zastąpić uszkodzoną kopię zapasową świeżą bazą (akceptuje utratę niemożliwej do odzyskania starej historii; może też odtworzyć magazyn sekretów, jeśli sekret bieżącej kopii zapasowej nie daje się załadować):

```bash
openclaw matrix verify backup reset --yes
```

Dodaj `--rotate-recovery-key` tylko wtedy, gdy celowo chcesz, aby poprzedni klucz odzyskiwania przestał odblokowywać świeżą bazę kopii zapasowej.

### Wyświetlanie, żądanie i obsługa weryfikacji

```bash
openclaw matrix verify list
```

Wyświetla oczekujące żądania weryfikacji dla wybranego konta.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Wysyła żądanie weryfikacji z tego konta OpenClaw. `--own-user` żąda samoweryfikacji (akceptujesz prompt w innym kliencie Matrix tego samego użytkownika); `--user-id`/`--device-id`/`--room-id` wskazują inną osobę. `--own-user` nie może być łączone z innymi flagami wskazywania celu.

Do niższopoziomowej obsługi cyklu życia - zwykle podczas śledzenia żądań przychodzących z innego klienta - te polecenia działają na konkretnym żądaniu `<id>` (wypisywanym przez `verify list` i `verify request`):

| Polecenie                                  | Cel                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Zaakceptuj żądanie przychodzące                                     |
| `openclaw matrix verify start <id>`        | Uruchom przepływ SAS                                                |
| `openclaw matrix verify sas <id>`          | Wypisz emoji lub liczby dziesiętne SAS                              |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdź, że SAS odpowiada temu, co pokazuje drugi klient          |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuć SAS, gdy emoji lub liczby dziesiętne się nie zgadzają        |
| `openclaw matrix verify cancel <id>`       | Anuluj; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` akceptują też `--user-id` oraz `--room-id` jako wskazówki uzupełniające dla wiadomości prywatnej, gdy weryfikacja jest zakotwiczona w konkretnym pokoju wiadomości bezpośrednich.

### Uwagi dotyczące wielu kont

Bez `--account <id>` polecenia CLI Matrix używają niejawnego konta domyślnego. Jeśli masz wiele nazwanych kont i nie ustawiono `channels.matrix.defaultAccount`, odmówią zgadywania i poproszą o wybór. Gdy E2EE jest wyłączone lub niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Zachowanie podczas uruchamiania">
    Przy `encryption: true` wartością domyślną `startupVerification` jest `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując cooldown (domyślnie 24 godziny). Dostrój przez `startupVerificationCooldownHours` albo wyłącz przez `startupVerification: "off"`.

    Uruchamianie wykonuje też konserwatywny przebieg inicjalizacji kryptografii, który ponownie używa bieżącego magazynu sekretów i tożsamości podpisywania krzyżowego. Jeśli stan inicjalizacji jest uszkodzony, OpenClaw próbuje chronionej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga UIA z hasłem, uruchamianie zapisuje ostrzeżenie w logach i pozostaje niekrytyczne. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [migrację Matrix](/pl/channels/matrix-migration), aby poznać pełny przepływ aktualizacji.

  </Accordion>

  <Accordion title="Powiadomienia weryfikacyjne">
    Matrix publikuje powiadomienia cyklu życia weryfikacji w ścisłym pokoju weryfikacyjnym wiadomości prywatnych jako wiadomości `m.notice`: żądanie, gotowość (ze wskazówką „Zweryfikuj przez emoji”), rozpoczęcie/ukończenie oraz szczegóły SAS (emoji/liczby dziesiętne), gdy są dostępne.

    Żądania przychodzące z innego klienta Matrix są śledzone i automatycznie akceptowane. W przypadku samoweryfikacji OpenClaw automatycznie uruchamia przepływ SAS i potwierdza swoją stronę, gdy weryfikacja emoji jest dostępna - nadal musisz porównać i potwierdzić „Zgadzają się” w swoim kliencie Matrix.

    Systemowe powiadomienia weryfikacyjne nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Usunięte lub nieprawidłowe urządzenie Matrix">
    Jeśli `verify status` informuje, że bieżące urządzenie nie jest już wymienione na homeserverze, utwórz nowe urządzenie Matrix OpenClaw. Dla logowania hasłem:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    W przypadku uwierzytelniania tokenem utwórz świeży token dostępu w kliencie Matrix lub panelu administracyjnym, a następnie zaktualizuj OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Zastąp `assistant` identyfikatorem konta z nieudanego polecenia albo pomiń `--account`, aby użyć konta domyślnego.

  </Accordion>

  <Accordion title="Device hygiene">
    Stare urządzenia zarządzane przez OpenClaw mogą się gromadzić. Wyświetl je i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE używa oficjalnej ścieżki kryptograficznej Rust z `matrix-js-sdk`, z `fake-indexeddb` jako warstwą zgodności IndexedDB. Stan kryptograficzny jest zapisywany w `crypto-idb-snapshot.json` (z restrykcyjnymi uprawnieniami pliku).

    Zaszyfrowany stan uruchomieniowy znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, migawkę IDB, powiązania wątków oraz stan weryfikacji startowej. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, aby poprzedni stan pozostał widoczny.

    Pojedynczy starszy katalog główny token-hash może być normalną ścieżką ciągłości po rotacji tokena. Jeśli OpenClaw zapisze w logach `matrix: multiple populated token-hash storage roots detected`, sprawdź katalog konta i zarchiwizuj nieaktualne katalogi równorzędne dopiero po potwierdzeniu, że wybrany aktywny katalog główny jest w dobrym stanie. Preferuj przenoszenie nieaktualnych katalogów głównych do katalogu `_archive/` zamiast ich natychmiastowego usuwania.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Możesz przekazać obie opcje w jednym wywołaniu. Matrix akceptuje adresy URL awatarów `mxc://` bezpośrednio; gdy przekażesz `http://` lub `https://`, OpenClaw najpierw przesyła plik i zapisuje rozwiązany adres URL `mxc://` w `channels.matrix.avatarUrl` (albo w nadpisaniu dla konkretnego konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek narzędziem wiadomości. Zachowanie kontrolują dwa niezależne przełączniki:

### Kierowanie sesji (`sessionScope`)

`dm.sessionScope` decyduje, jak pokoje DM Matrix są mapowane na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje DM z tym samym kierowanym uczestnikiem współdzielą jedną sesję.
- `"per-room"`: każdy pokój DM Matrix otrzymuje własny klucz sesji, nawet gdy uczestnik jest ten sam.

Jawne powiązania konwersacji zawsze mają pierwszeństwo przed `sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Wątkowanie odpowiedzi (`threadReplies`)

`threadReplies` decyduje, gdzie bot publikuje swoją odpowiedź:

- `"off"`: odpowiedzi są najwyższego poziomu. Przychodzące wiadomości w wątkach pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiedz w wątku tylko wtedy, gdy wiadomość przychodząca była już w tym wątku.
- `"always"`: odpowiedz w wątku zakorzenionym w wiadomości wyzwalającej; ta konwersacja jest kierowana przez pasującą sesję o zakresie wątku od pierwszego wyzwolenia.

`dm.threadReplies` nadpisuje to tylko dla DM, na przykład aby izolować wątki pokojów, a DM pozostawić płaskie.

### Dziedziczenie wątków i polecenia slash

- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki narzędziem wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celują w ten sam pokój (albo w ten sam cel użytkownika DM), chyba że podano jawny `threadId`.
- Ponowne użycie celu użytkownika DM włącza się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego uczestnika DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego kierowania o zakresie użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz `/acp spawn` powiązane z wątkiem działają w pokojach Matrix i DM.
- Najwyższego poziomu `/focus` tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSessions` jest włączone.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek w miejscu.

Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji, publikuje jednorazowe `m.notice` w tym pokoju, wskazując wyjście awaryjne `/focus` i sugerując zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy powiązania wątków są włączone.

## Powiązania konwersacji ACP

Pokoje Matrix, DM i istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmieniania powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju albo istniejącego wątku, którego chcesz nadal używać.
- W najwyższego poziomu DM lub pokoju Matrix bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnSessions` kontroluje `/acp spawn --thread auto|here`, gdzie OpenClaw musi utworzyć albo powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings`, a także obsługuje nadpisania dla kanału:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Tworzenie sesji powiązanych z wątkami Matrix jest domyślnie włączone:

- Ustaw `threadBindings.spawnSessions: false`, aby zablokować najwyższego poziomu `/focus` i `/acp spawn --thread auto|here` przed tworzeniem/powiązywaniem wątków Matrix.
- Ustaw `threadBindings.defaultSpawnContext: "isolated"`, gdy natywne tworzenie wątków podagentów nie powinno rozgałęziać transkryptu nadrzędnego.

## Reakcje

Matrix obsługuje reakcje wychodzące, przychodzące powiadomienia o reakcjach oraz reakcje potwierdzenia.

Narzędzia reakcji wychodzących są kontrolowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota na tym zdarzeniu.
- `remove: true` usuwa z bota tylko wskazaną reakcję emoji.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie              | Kolejność                                                                        |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per-account → kanał → `messages.ackReaction` → awaryjny emoji tożsamości agenta  |
| `ackReactionScope`      | per-account → kanał → `messages.ackReactionScope` → domyślnie `"group-mentions"` |
| `reactionNotifications` | per-account → kanał → domyślnie `"own"`                                          |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy celują w wiadomości Matrix autorstwa bota; `"off"` wyłącza zdarzenia systemowe reakcji. Usunięcia reakcji nie są syntetyzowane jako zdarzenia systemowe, ponieważ Matrix prezentuje je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju Matrix wyzwala agenta. Wraca do `messages.groupChat.historyLimit`; jeśli oba są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM nadal używają normalnej historii sesji.
- Historia pokoju Matrix działa tylko dla oczekujących wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie wykonuje migawkę tego okna, gdy pojawi się wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby tego samego zdarzenia Matrix używają oryginalnej migawki historii zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` jest ustawieniem domyślnym. Uzupełniający kontekst jest zachowywany tak, jak został otrzymany.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` zachowuje się jak `allowlist`, ale nadal zachowuje jeden jawny cytat odpowiedzi.

To ustawienie wpływa na widoczność uzupełniającego kontekstu, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwolenia nadal pochodzi z `groupPolicy`, `groups`, `groupAllowFrom` i ustawień zasad DM.

## Zasady DM i pokojów

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

Aby całkowicie wyciszyć DM, zachowując działanie pokojów, ustaw `dm.enabled: false`:

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

Zobacz [Grupy](/pl/channels/groups), aby poznać bramkowanie wzmiankami i zachowanie listy dozwolonych.

Przykład parowania dla DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może wysłać odpowiedź przypominającą po krótkim czasie odnowienia zamiast generować nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać wspólny przepływ parowania DM i układ magazynu.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich przestanie być zsynchronizowany, OpenClaw może skończyć z nieaktualnymi mapowaniami `m.direct`, które wskazują stare pokoje jednoosobowe zamiast aktywnego DM. Sprawdź bieżące mapowanie dla uczestnika:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Oba polecenia akceptują `--account <id>` dla konfiguracji z wieloma kontami. Przepływ naprawy:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- wraca do dowolnego aktualnie dołączonego ścisłego DM 1:1 z tym użytkownikiem
- tworzy świeży pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje żaden zdrowy DM

Nie usuwa automatycznie starych pokojów. Wybiera zdrowy DM i aktualizuje mapowanie, aby przyszłe wysyłki Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości bezpośrednich trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń. Skonfiguruj w `channels.matrix.execApprovals` (albo `channels.matrix.accounts.<account>.execApprovals` jako nadpisanie dla konkretnego konta):

- `enabled`: dostarczaj zatwierdzenia przez natywne monity Matrix. Gdy nieustawione albo `"auto"`, Matrix automatycznie włącza się, gdy można rozwiązać co najmniej jednego zatwierdzającego. Ustaw `false`, aby jawnie wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnione do zatwierdzania żądań exec. Opcjonalne - wraca do `channels.matrix.dm.allowFrom`.
- `target`: miejsce wysyłania monitów. `"dm"` (domyślnie) wysyła do DM zatwierdzających; `"channel"` wysyła do źródłowego pokoju Matrix lub DM; `"both"` wysyła do obu.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych agentów/sesji, które wyzwalają dostarczanie przez Matrix.

Autoryzacja różni się nieznacznie między rodzajami zatwierdzeń:

- **Zatwierdzenia exec** używają `execApprovals.approvers`, wracając do `dm.allowFrom`.
- **Zatwierdzenia Plugin** autoryzują tylko przez `dm.allowFrom`.

Oba rodzaje współdzielą skróty reakcji Matrix i aktualizacje wiadomości. Zatwierdzający widzą skróty reakcji w głównej wiadomości zatwierdzenia:

- `✅` zezwól raz
- `❌` odmów
- `♾️` zezwalaj zawsze (gdy efektywna zasada exec na to pozwala)

Polecenia slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzić lub odrzucić. Dostarczanie kanałem dla zatwierdzeń exec zawiera tekst polecenia - włączaj `channel` lub `both` tylko w zaufanych pokojach.

Powiązane: [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Polecenia slash

Polecenia slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w wiadomościach prywatnych. W pokojach OpenClaw rozpoznaje także polecenia poprzedzone własną wzmianką bota Matrix, więc `@bot:server /new` uruchamia ścieżkę polecenia bez niestandardowego regexu wzmianki. Dzięki temu bot reaguje na wpisy w stylu pokojowym `@mention /command`, które Element i podobni klienci emitują, gdy użytkownik uzupełnia bota tabulatorem przed wpisaniem polecenia.

Reguły autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać te same zasady listy dozwolonych/ właściciela dla wiadomości prywatnych lub pokojów co zwykłe wiadomości.

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

- Wartości najwyższego poziomu `channels.matrix` działają jako domyślne dla nazwanych kont, chyba że konto je nadpisze.
- Ogranicz odziedziczony wpis pokoju do konkretnego konta za pomocą `groups.<room>.account`. Wpisy bez `account` są współdzielone między kontami; `account: "default"` nadal działa, gdy konto domyślne jest skonfigurowane na najwyższym poziomie.

**Wybór konta domyślnego:**

- Ustaw `defaultAccount`, aby wybrać nazwane konto preferowane przez niejawne routowanie, sondowanie i polecenia CLI.
- Jeśli masz wiele kont i jedno dosłownie nazywa się `default`, OpenClaw używa go niejawnie nawet wtedy, gdy `defaultAccount` nie jest ustawione.
- Jeśli masz wiele nazwanych kont i nie wybrano domyślnego, polecenia CLI odmawiają zgadywania - ustaw `defaultAccount` albo przekaż `--account <id>`.
- Blok najwyższego poziomu `channels.matrix.*` jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego auth jest kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta pozostają wykrywalne na podstawie `homeserver` + `userId`, gdy zapisane poświadczenia obejmują auth.

**Promocja:**

- Gdy OpenClaw promuje konfigurację jednokontową do wielokontowej podczas naprawy lub konfiguracji, zachowuje istniejące nazwane konto, jeśli takie istnieje, albo gdy `defaultAccount` już na nie wskazuje. Do promowanego konta przenoszone są tylko klucze auth/bootstrap Matrix; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.

Zobacz [Dokumentację konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać wspólny wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz je dla danego konta.

Jeśli twój homeserver działa na localhost, adresie IP LAN/Tailscale albo wewnętrznej nazwie hosta, włącz
`network.dangerouslyAllowPrivateNetwork` dla tego konta Matrix:

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

Przykład konfiguracji CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

To jawne włączenie zezwala tylko na zaufane prywatne/wewnętrzne cele. Publiczne homeservery bez szyfrowania, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. Preferuj `https://`, gdy tylko to możliwe.

## Proksowanie ruchu Matrix

Jeśli twoje wdrożenie Matrix wymaga jawnego wychodzącego proxy HTTP(S), ustaw `channels.matrix.proxy`:

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

Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu za pomocą `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w czasie działania i sond stanu konta.

## Rozwiązywanie celów

Matrix akceptuje te formy celów wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Identyfikatory pokojów Matrix rozróżniają wielkość liter. Używaj dokładnej wielkości liter identyfikatora pokoju z Matrix
podczas konfigurowania jawnych celów dostarczania, zadań cron, powiązań lub list dozwolonych.
OpenClaw utrzymuje wewnętrzne klucze sesji w formie kanonicznej do przechowywania, więc te klucze zapisane małymi literami
nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokojów akceptują bezpośrednio jawne identyfikatory pokojów i aliasy. Wyszukiwanie nazw dołączonych pokojów działa na zasadzie best-effort i ma zastosowanie tylko do list dozwolonych pokojów w czasie działania, gdy ustawiono `dangerouslyAllowNameMatching: true`.
- Jeśli nazwy pokoju nie da się rozwiązać do identyfikatora lub aliasu, jest ignorowana przez rozwiązywanie listy dozwolonych w czasie działania.

## Dokumentacja konfiguracji

Pola użytkowników w stylu listy dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akceptują pełne identyfikatory użytkowników Matrix (najbezpieczniej). Wpisy użytkowników niebędące identyfikatorami są domyślnie ignorowane. Jeśli ustawisz `dangerouslyAllowNameMatching: true`, dokładne dopasowania nazw wyświetlanych z katalogu Matrix są rozwiązywane podczas uruchamiania i za każdym razem, gdy lista dozwolonych zmienia się w trakcie działania monitora; wpisy, których nie da się rozwiązać, są ignorowane w czasie działania.

Klucze list dozwolonych pokojów (`groups`, starsze `rooms`) powinny być identyfikatorami pokojów lub aliasami. Klucze będące zwykłymi nazwami pokojów są domyślnie ignorowane; `dangerouslyAllowNameMatching: true` przywraca wyszukiwanie best-effort względem nazw dołączonych pokojów.

### Konto i połączenie

- `enabled`: włącz lub wyłącz kanał.
- `name`: opcjonalna etykieta wyświetlana dla konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane nadpisania dla poszczególnych kont. Wartości najwyższego poziomu `channels.matrix` są dziedziczone jako domyślne.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwól temu kontu na łączenie się z `localhost`, adresami IP LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Obsługiwane nadpisanie dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu dla auth opartego na tokenie. Obsługiwane są wartości tekstowe i SecretRef we wszystkich dostawcach env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości tekstowe i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia używana podczas logowania hasłem.
- `avatarUrl`: zapisany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchomieniu.

### Szyfrowanie

- `encryption`: włącz E2EE. Domyślnie: `false`.
- `startupVerification`: `"if-unverified"` (domyślnie, gdy E2EE jest włączone) albo `"off"`. Automatycznie żąda samoweryfikacji przy uruchomieniu, gdy to urządzenie nie jest zweryfikowane.
- `startupVerificationCooldownHours`: czas odczekania przed następnym automatycznym żądaniem przy uruchomieniu. Domyślnie: `24`.

### Dostęp i polityka

- `groupPolicy`: `"open"`, `"allowlist"` albo `"disabled"`. Domyślnie: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu pokojowego.
- `mentionPatterns`: zakresowe wzorce regex dla wzmianek w pokojach. Obiekt z `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Kontroluje, czy skonfigurowane `agents.list[].groupChat.mentionPatterns` mają zastosowanie dla poszczególnych pokojów.
- `dm.enabled`: gdy `false`, ignoruj wszystkie wiadomości prywatne. Domyślnie: `true`.
- `dm.policy`: `"pairing"` (domyślnie), `"allowlist"`, `"open"` albo `"disabled"`. Ma zastosowanie po tym, jak bot dołączy i sklasyfikuje pokój jako wiadomość prywatną; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu wiadomości prywatnych.
- `dm.sessionScope`: `"per-user"` (domyślnie) albo `"per-room"`.
- `dm.threadReplies`: nadpisanie tylko dla wiadomości prywatnych dotyczące wątkowania odpowiedzi (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuj wiadomości od innych skonfigurowanych kont botów Matrix (`true` albo `"mentions"`).
- `allowlistOnly`: gdy `true`, wymusza zmianę wszystkich aktywnych polityk wiadomości prywatnych (z wyjątkiem `"disabled"`) i polityk grupowych `"open"` na `"allowlist"`. Nie zmienia polityk `"disabled"`.
- `dangerouslyAllowNameMatching`: gdy `true`, zezwala na wyszukiwanie w katalogu Matrix według nazw wyświetlanych dla wpisów listy dozwolonych użytkowników oraz wyszukiwanie nazw dołączonych pokojów dla kluczy listy dozwolonych pokojów. Preferuj pełne identyfikatory `@user:server` oraz identyfikatory lub aliasy pokojów.
- `autoJoin`: `"always"`, `"allowlist"` albo `"off"`. Domyślnie: `"off"`. Ma zastosowanie do każdego zaproszenia Matrix, w tym zaproszeń w stylu wiadomości prywatnych.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `"allowlist"`. Wpisy aliasów są rozwiązywane względem homeservera, a nie względem stanu deklarowanego przez zapraszający pokój.
- `contextVisibility`: uzupełniająca widoczność kontekstu (domyślnie `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Zachowanie odpowiedzi

- `replyToMode`: `"off"`, `"first"`, `"all"` albo `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` albo `"always"`.
- `threadBindings`: nadpisania dla poszczególnych kanałów dotyczące routowania sesji powiązanych z wątkiem i cyklu życia.
- `streaming`: `"off"` (domyślnie), `"partial"`, `"quiet"`, `"progress"` albo forma obiektu `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: gdy `true`, ukończone bloki asystenta są zachowywane jako osobne komunikaty postępu.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg poprzedzający odpowiedzi wychodzące.
- `textChunkLimit`: rozmiar fragmentu wychodzącego w znakach, gdy `chunkMode: "length"`. Domyślnie: `4000`.
- `chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) albo `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju dołączanych jako `InboundHistory`, gdy wiadomość w pokoju uruchamia agenta. Wraca do `messages.groupChat.historyLimit`; efektywna wartość domyślna `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru mediów w MB dla wysyłek wychodzących i przetwarzania przychodzącego.

### Ustawienia reakcji

- `ackReaction`: nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: nadpisanie zakresu (`"group-mentions"` domyślnie, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (`"own"` domyślnie, `"off"`).

### Narzędzia i nadpisania dla poszczególnych pokojów

- `actions`: bramkowanie narzędzi dla poszczególnych akcji (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa zasad dla poszczególnych pokoi. Tożsamość sesji używa stabilnego identyfikatora pokoju po rozwiązaniu. (`rooms` to starszy alias.)
  - `groups.<room>.account`: ogranicz jeden dziedziczony wpis pokoju do określonego konta.
  - `groups.<room>.enabled`: przełącznik dla poszczególnych pokoi. Gdy `false`, pokój jest ignorowany tak, jakby nie znajdował się w mapie.
  - `groups.<room>.requireMention`: nadpisanie wymogu wzmianki na poziomie kanału dla poszczególnych pokoi.
  - `groups.<room>.allowBots`: nadpisanie ustawienia na poziomie kanału dla poszczególnych pokoi (`true` albo `"mentions"`).
  - `groups.<room>.botLoopProtection`: nadpisanie budżetu ochrony przed pętlą bot-bot dla poszczególnych pokoi.
  - `groups.<room>.users`: lista dozwolonych nadawców dla poszczególnych pokoi.
  - `groups.<room>.tools`: nadpisania zezwoleń/zakazów narzędzi dla poszczególnych pokoi.
  - `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami dla poszczególnych pokoi. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza ich ponowne włączenie.
  - `groups.<room>.skills`: filtr umiejętności dla poszczególnych pokoi.
  - `groups.<room>.systemPrompt`: fragment promptu systemowego dla poszczególnych pokoi.

### Ustawienia zatwierdzania wykonania

- `execApprovals.enabled`: dostarczaj zatwierdzenia wykonania przez natywne prompty Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnione do zatwierdzania. W razie braku wraca do `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` albo `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów/sesji do dostarczania.

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i utwardzanie
