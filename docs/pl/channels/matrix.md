---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji w Matrix
summary: Status obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-05-02T09:43:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix to pobieralny Plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Instalacja

Zainstaluj Matrix przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/matrix
```

Z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` rejestruje i włącza Plugin, więc osobny krok `openclaw plugins enable matrix` nie jest potrzebny. Plugin nadal nic nie robi, dopóki nie skonfigurujesz kanału poniżej. Ogólne zachowanie Pluginów i reguły instalacji opisuje sekcja [Plugins](/pl/tools/plugin).

## Konfiguracja

1. Utwórz konto Matrix na swoim homeserverze.
2. Skonfiguruj `channels.matrix` za pomocą `homeserver` + `accessToken` albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie Gateway.
4. Rozpocznij wiadomość prywatną z botem albo zaproś go do pokoju (zobacz [automatyczne dołączanie](#auto-join) — nowe zaproszenia trafiają tylko wtedy, gdy pozwala na to `autoJoin`).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o: URL homeservera, metodę uwierzytelniania (token dostępu lub hasło), identyfikator użytkownika (tylko uwierzytelnianie hasłem), opcjonalną nazwę urządzenia, czy włączyć E2EE oraz czy skonfigurować dostęp do pokoi i automatyczne dołączanie.

Jeśli pasujące zmienne środowiskowe `MATRIX_*` już istnieją, a wybrane konto nie ma zapisanych danych uwierzytelniających, kreator proponuje skrót przez zmienne środowiskowe. Aby rozwiązać nazwy pokoi przed zapisaniem listy dozwolonych, uruchom `openclaw channels resolve --channel matrix "Project Room"`. Gdy E2EE jest włączone, kreator zapisuje konfigurację i uruchamia ten sam bootstrap co [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` domyślnie ma wartość `off`. Przy ustawieniu domyślnym bot nie pojawi się w nowych pokojach ani wiadomościach prywatnych z nowych zaproszeń, dopóki nie dołączysz ręcznie.

OpenClaw nie może w chwili zaproszenia stwierdzić, czy zapraszany pokój jest wiadomością prywatną czy grupą, więc wszystkie zaproszenia — w tym zaproszenia w stylu wiadomości prywatnych — najpierw przechodzą przez `autoJoin`. `dm.policy` ma zastosowanie dopiero później, po dołączeniu bota i sklasyfikowaniu pokoju.

<Warning>
Ustaw `autoJoin: "allowlist"` oraz `autoJoinAllowlist`, aby ograniczyć zaproszenia akceptowane przez bota, albo `autoJoin: "always"`, aby akceptować każde zaproszenie.

`autoJoinAllowlist` akceptuje tylko stabilne cele: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane; wpisy aliasów są rozwiązywane względem homeservera, a nie względem stanu deklarowanego przez zapraszany pokój.
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

### Formaty celów list dozwolonych

Listy dozwolonych dla wiadomości prywatnych i pokoi najlepiej wypełniać stabilnymi identyfikatorami:

- Wiadomości prywatne (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): użyj `@user:server`. Nazwy wyświetlane są rozwiązywane tylko wtedy, gdy katalog homeservera zwróci dokładnie jedno dopasowanie.
- Pokoje (`groups`, `autoJoinAllowlist`): użyj `!room:server` lub `#alias:server`. Nazwy są rozwiązywane w miarę możliwości względem pokoi, do których dołączono; nierozwiązane wpisy są ignorowane w czasie działania.

### Normalizacja identyfikatora konta

Kreator konwertuje przyjazną nazwę na znormalizowany identyfikator konta. Na przykład `Ops Bot` staje się `ops-bot`. Interpunkcja jest ucieczkowana w zakresowanych nazwach zmiennych środowiskowych, aby dwa konta nie mogły kolidować: `-` → `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

### Buforowane dane uwierzytelniające

Matrix przechowuje buforowane dane uwierzytelniające w `~/.openclaw/credentials/matrix/`:

- konto domyślne: `credentials.json`
- konta nazwane: `credentials-<account>.json`

Gdy istnieją tam buforowane dane uwierzytelniające, OpenClaw traktuje Matrix jako skonfigurowany nawet wtedy, gdy token dostępu nie znajduje się w pliku konfiguracyjnym — obejmuje to konfigurację, `openclaw doctor` i sondy statusu kanału.

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

Dla konta `ops` nazwy stają się `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` i tak dalej. Zmienne środowiskowe klucza odzyskiwania są odczytywane przez przepływy CLI świadome odzyskiwania (`verify backup restore`, `verify device`, `verify bootstrap`), gdy przekazujesz klucz przez `--recovery-key-stdin`.

`MATRIX_HOMESERVER` nie można ustawić z workspace `.env`; zobacz [pliki workspace `.env`](/pl/gateway/security).

## Przykład konfiguracji

Praktyczna baza z parowaniem wiadomości prywatnych, listą dozwolonych pokoi i E2EE:

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

Strumieniowanie odpowiedzi Matrix jest opcjonalne. `streaming` kontroluje sposób, w jaki OpenClaw dostarcza odpowiedź asystenta w trakcie tworzenia; `blockStreaming` kontroluje, czy każdy ukończony blok jest zachowywany jako osobna wiadomość Matrix.

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

| `streaming`            | Zachowanie                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (domyślnie)    | Czekaj na pełną odpowiedź, wyślij raz. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                  |
| `"partial"`            | Edytuj jedną zwykłą wiadomość tekstową w miejscu, gdy model pisze bieżący blok. Standardowi klienci Matrix mogą powiadomić przy pierwszym podglądzie, a nie przy finalnej edycji. |
| `"quiet"`              | Tak samo jak `"partial"`, ale wiadomość jest niepowiadamiającą notatką. Odbiorcy dostają powiadomienie dopiero wtedy, gdy reguła push danego użytkownika dopasuje finalną edycję (zobacz poniżej). |

`blockStreaming` jest niezależne od `streaming`:

| `streaming`             | `blockStreaming: true`                                                | `blockStreaming: false` (domyślnie)                 |
| ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| `"partial"` / `"quiet"` | Szkic na żywo dla bieżącego bloku, ukończone bloki zachowane jako wiadomości | Szkic na żywo dla bieżącego bloku, finalizowany w miejscu |
| `"off"`                 | Jedna powiadamiająca wiadomość Matrix na każdy ukończony blok          | Jedna powiadamiająca wiadomość Matrix dla pełnej odpowiedzi |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru pojedynczego zdarzenia Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do dostarczania tylko finalnej wiadomości.
- Odpowiedzi multimedialne zawsze wysyłają załączniki normalnie. Jeśli nieaktualnego podglądu nie można już bezpiecznie ponownie użyć, OpenClaw redaguje go przed wysłaniem finalnej odpowiedzi multimedialnej.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy strumieniowanie podglądu Matrix jest aktywne. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu dla tekstu odpowiedzi, ale pozostawić postęp narzędzi na normalnej ścieżce dostarczania.
- Edycje podglądu kosztują dodatkowe wywołania API Matrix. Pozostaw `streaming: "off"`, jeśli chcesz najbardziej konserwatywny profil limitów szybkości.

## Metadane zatwierdzania

Natywne monity zatwierdzania Matrix to zwykłe zdarzenia `m.room.message` ze specjalną treścią zdarzenia OpenClaw pod `com.openclaw.approval`. Matrix zezwala na niestandardowe klucze treści zdarzeń, więc standardowi klienci nadal renderują treść tekstową, a klienci świadomi OpenClaw mogą odczytać strukturalny identyfikator zatwierdzenia, rodzaj, stan, dostępne decyzje oraz szczegóły exec/plugin.

Gdy monit zatwierdzania jest zbyt długi dla jednego zdarzenia Matrix, OpenClaw dzieli widoczny tekst na fragmenty i dołącza `com.openclaw.approval` tylko do pierwszego fragmentu. Reakcje dla decyzji zezwolenia/odmowy są powiązane z tym pierwszym zdarzeniem, więc długie monity zachowują ten sam cel zatwierdzania co monity jednozdarzeniowe.

### Samodzielnie hostowane reguły push dla cichych finalnych podglądów

`streaming: "quiet"` powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury — reguła push danego użytkownika musi dopasować znacznik finalnego podglądu. Pełny przepis (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserverów) znajdziesz w [regułach push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules).

## Pokoje bot-do-bota

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
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli samoodpowiedzi.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „autorstwo bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym OpenClaw gateway”.

Używaj ścisłych list dozwolonych pokoi i wymagań dotyczących wzmianek, gdy włączasz ruch bot-do-bota w pokojach współdzielonych.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Niezaszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Konfiguracja nie jest potrzebna — Plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` akceptują `--verbose` (pełna diagnostyka), `--json` (dane wyjściowe czytelne maszynowo) oraz `--account <id>` (konfiguracje wielokontowe). Dane wyjściowe są domyślnie zwięzłe, z cichym wewnętrznym logowaniem SDK. Poniższe przykłady pokazują formę kanoniczną; dodaj flagi w razie potrzeby.

### Włącz szyfrowanie

```bash
openclaw matrix encryption setup
```

Uruchamia magazyn sekretów i podpisywanie krzyżowe, w razie potrzeby tworzy kopię zapasową kluczy pokojów, a następnie wypisuje status i następne kroki. Przydatne flagi:

- `--recovery-key <key>` stosuje klucz odzyskiwania przed uruchomieniem (preferuj formę ze stdin opisaną poniżej)
- `--force-reset-cross-signing` odrzuca bieżącą tożsamość podpisywania krzyżowego i tworzy nową (używaj tylko celowo)

Dla nowego konta włącz E2EE podczas tworzenia:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` jest aliasem `--enable-e2ee`.

Równoważna konfiguracja ręczna:

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

`verify status` zgłasza trzy niezależne sygnały zaufania (`--verbose` pokazuje wszystkie):

- `Locally trusted`: zaufane tylko przez tego klienta
- `Cross-signing verified`: SDK zgłasza weryfikację przez podpisywanie krzyżowe
- `Signed by owner`: podpisane własnym kluczem samopodpisującym (tylko diagnostycznie)

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy `Cross-signing verified` ma wartość `yes`. Samo zaufanie lokalne lub podpis właściciela nie wystarczają.

`--allow-degraded-local-state` zwraca diagnostykę best-effort bez wcześniejszego przygotowywania konta Matrix; przydatne dla sond offline lub częściowo skonfigurowanych.

### Zweryfikuj to urządzenie kluczem odzyskiwania

Klucz odzyskiwania jest poufny — przekaż go potokiem przez stdin zamiast podawać w wierszu poleceń. Ustaw `MATRIX_RECOVERY_KEY` (lub `MATRIX_<ID>_RECOVERY_KEY` dla nazwanego konta):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie zgłasza trzy stany:

- `Recovery key accepted`: Matrix zaakceptował klucz dla magazynu sekretów lub zaufania urządzenia.
- `Backup usable`: kopię zapasową kluczy pokojów można wczytać z zaufanym materiałem odzyskiwania.
- `Device verified by owner`: to urządzenie ma pełne zaufanie tożsamości podpisywania krzyżowego Matrix.

Polecenie kończy się niezerowym kodem, gdy pełne zaufanie tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiał kopii zapasowej. W takim przypadku dokończ samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

`verify self` czeka na `Cross-signing verified: yes`, zanim zakończy się pomyślnie. Użyj `--timeout-ms <ms>`, aby dostosować czas oczekiwania.

Forma z dosłownym kluczem `openclaw matrix verify device "<recovery-key>"` jest również akceptowana, ale klucz trafia do historii powłoki.

### Uruchamianie lub naprawa podpisywania krzyżowego

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` to polecenie naprawy i konfiguracji dla kont szyfrowanych. Kolejno:

- uruchamia magazyn sekretów, używając istniejącego klucza odzyskiwania, gdy to możliwe
- uruchamia podpisywanie krzyżowe i przesyła brakujące klucze publiczne
- oznacza i podpisuje krzyżowo bieżące urządzenie
- tworzy po stronie serwera kopię zapasową kluczy pokojów, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga UIA do przesłania kluczy podpisywania krzyżowego, OpenClaw najpierw próbuje bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`).

Przydatne flagi:

- `--recovery-key-stdin` (połącz z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) lub `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość podpisywania krzyżowego (tylko celowo)

### Kopia zapasowa kluczy pokojów

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` pokazuje, czy istnieje kopia zapasowa po stronie serwera i czy to urządzenie może ją odszyfrować. `backup restore` importuje zapisane w kopii zapasowej klucze pokojów do lokalnego magazynu kryptograficznego; jeśli klucz odzyskiwania jest już na dysku, możesz pominąć `--recovery-key-stdin`.

Aby zastąpić uszkodzoną kopię zapasową świeżą bazą (akceptując utratę nieodzyskiwalnej starej historii; może także odtworzyć magazyn sekretów, jeśli bieżącego sekretu kopii zapasowej nie da się wczytać):

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

Wysyła żądanie weryfikacji z tego konta OpenClaw. `--own-user` żąda samoweryfikacji (akceptujesz monit w innym kliencie Matrix tego samego użytkownika); `--user-id`/`--device-id`/`--room-id` wskazują kogoś innego. `--own-user` nie można łączyć z innymi flagami wskazywania celu.

Do niższopoziomowej obsługi cyklu życia — zwykle podczas śledzenia przychodzących żądań z innego klienta — te polecenia działają na konkretnym żądaniu `<id>` (wypisanym przez `verify list` i `verify request`):

| Polecenie                                  | Cel                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Akceptuje żądanie przychodzące                                      |
| `openclaw matrix verify start <id>`        | Uruchamia przepływ SAS                                              |
| `openclaw matrix verify sas <id>`          | Wypisuje emoji lub liczby dziesiętne SAS                            |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdza, że SAS pasuje do tego, co pokazuje drugi klient         |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuca SAS, gdy emoji lub liczby dziesiętne się nie zgadzają       |
| `openclaw matrix verify cancel <id>`       | Anuluje; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` przyjmują także `--user-id` oraz `--room-id` jako wskazówki dalszej obsługi DM, gdy weryfikacja jest zakotwiczona w konkretnym pokoju wiadomości bezpośrednich.

### Uwagi dotyczące wielu kont

Bez `--account <id>` polecenia Matrix CLI używają niejawnego konta domyślnego. Jeśli masz wiele nazwanych kont i nie ustawiono `channels.matrix.defaultAccount`, odmówią zgadywania i poproszą o wybór. Gdy E2EE jest wyłączone lub niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Przy `encryption: true` domyślną wartością `startupVerification` jest `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując okres wyciszenia (domyślnie 24 godziny). Dostosuj za pomocą `startupVerificationCooldownHours` albo wyłącz przez `startupVerification: "off"`.

    Uruchamianie wykonuje też zachowawczy przebieg bootstrapu kryptografii, który ponownie używa bieżącego magazynu sekretów i tożsamości podpisywania krzyżowego. Jeśli stan bootstrapu jest uszkodzony, OpenClaw próbuje chronionej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga UIA hasłem, uruchamianie zapisuje ostrzeżenie w logu i pozostaje niekrytyczne. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [migrację Matrix](/pl/channels/matrix-migration), aby poznać pełny przepływ aktualizacji.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix publikuje powiadomienia cyklu życia weryfikacji w ścisłym pokoju weryfikacyjnym DM jako wiadomości `m.notice`: żądanie, gotowość (z instrukcją „Zweryfikuj przez emoji”), rozpoczęcie/zakończenie oraz szczegóły SAS (emoji/liczbowe), gdy są dostępne.

    Żądania przychodzące z innego klienta Matrix są śledzone i automatycznie akceptowane. Przy samoweryfikacji OpenClaw automatycznie uruchamia przepływ SAS i potwierdza swoją stronę, gdy weryfikacja emoji jest dostępna — nadal musisz porównać i potwierdzić „Zgadzają się” w swoim kliencie Matrix.

    Systemowe powiadomienia weryfikacyjne nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Jeśli `verify status` informuje, że bieżące urządzenie nie jest już wymienione na homeserverze, utwórz nowe urządzenie OpenClaw Matrix. Dla logowania hasłem:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Dla uwierzytelniania tokenem utwórz świeży token dostępu w kliencie Matrix lub interfejsie administracyjnym, a następnie zaktualizuj OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Zastąp `assistant` identyfikatorem konta z nieudanego polecenia albo pomiń `--account` dla konta domyślnego.

  </Accordion>

  <Accordion title="Device hygiene">
    Stare urządzenia zarządzane przez OpenClaw mogą się gromadzić. Wyświetl i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE używa oficjalnej ścieżki kryptografii Rust z `matrix-js-sdk`, z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia pliku).

    Zaszyfrowany stan wykonawczy znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, migawkę IDB, powiązania wątków oraz stan weryfikacji podczas uruchamiania. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego korzenia, aby wcześniejszy stan pozostał widoczny.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj profil własny Matrix dla wybranego konta:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Możesz przekazać obie opcje w jednym wywołaniu. Matrix akceptuje adresy URL awatarów `mxc://` bezpośrednio; gdy przekażesz `http://` lub `https://`, OpenClaw najpierw przesyła plik i zapisuje rozstrzygnięty URL `mxc://` do `channels.matrix.avatarUrl` (lub nadpisania dla danego konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek narzędziem wiadomości. Zachowaniem sterują dwa niezależne przełączniki:

### Routing sesji (`sessionScope`)

`dm.sessionScope` określa, jak pokoje DM Matrix są mapowane na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje DM z tym samym routowanym rozmówcą współdzielą jedną sesję.
- `"per-room"`: każdy pokój DM Matrix otrzymuje własny klucz sesji, nawet gdy rozmówca jest ten sam.

Jawne powiązania konwersacji zawsze mają pierwszeństwo przed `sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Wątkowanie odpowiedzi (`threadReplies`)

`threadReplies` określa, gdzie bot publikuje odpowiedź:

- `"off"`: odpowiedzi są najwyższego poziomu. Przychodzące wiadomości wątkowe pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiadaj wewnątrz wątku tylko wtedy, gdy wiadomość przychodząca była już w tym wątku.
- `"always"`: odpowiadaj wewnątrz wątku zakorzenionego w wiadomości wyzwalającej; ta konwersacja jest od pierwszego wyzwolenia routowana przez pasującą sesję o zakresie wątku.

`dm.threadReplies` nadpisuje to tylko dla DM — na przykład pozwala izolować wątki pokojów, jednocześnie utrzymując DM bez wątków.

### Dziedziczenie wątków i polecenia ukośnikowe

- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki narzędzia wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celują w ten sam pokój (lub ten sam cel użytkownika DM), chyba że podano jawny `threadId`.
- Ponowne użycie celu użytkownika DM włącza się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego rozmówcę DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routingu o zakresie użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach Matrix i DM.
- Najwyższego poziomu `/focus` tworzy nowy wątek Matrix i wiąże go z docelową sesją, gdy włączone jest `threadBindings.spawnSessions`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek w miejscu.

Gdy OpenClaw wykryje pokój DM Matrix kolidujący z innym pokojem DM w tej samej współdzielonej sesji, publikuje w tym pokoju jednorazowe `m.notice`, wskazując wyjście awaryjne `/focus` i sugerując zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy włączone są powiązania wątków.

## Powiązania konwersacji ACP

Pokoje Matrix, DM i istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` w DM Matrix, pokoju lub istniejącym wątku, którego chcesz nadal używać.
- W DM Matrix lub pokoju najwyższego poziomu bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże ten bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnSessions` bramkuje `/acp spawn --thread auto|here`, gdy OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings` i obsługuje też nadpisania dla poszczególnych kanałów:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Tworzenie powiązanych z wątkiem sesji Matrix jest domyślnie włączone:

- Ustaw `threadBindings.spawnSessions: false`, aby zablokować najwyższego poziomu `/focus` i `/acp spawn --thread auto|here` przed tworzeniem/wiązaniem wątków Matrix.
- Ustaw `threadBindings.defaultSpawnContext: "isolated"`, gdy natywne tworzenie wątków podagentów nie powinno rozwidlać transkryptu rodzica.

## Reakcje

Matrix obsługuje reakcje wychodzące, przychodzące powiadomienia o reakcjach i reakcje potwierdzenia.

Narzędzia reakcji wychodzących są bramkowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota na tym zdarzeniu.
- `remove: true` usuwa tylko wskazaną reakcję emoji z bota.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie              | Kolejność                                                                        |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per konto → kanał → `messages.ackReaction` → awaryjne emoji tożsamości agenta    |
| `ackReactionScope`      | per konto → kanał → `messages.ackReactionScope` → domyślne `"group-mentions"`    |
| `reactionNotifications` | per konto → kanał → domyślne `"own"`                                             |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy celują w wiadomości Matrix autorstwa bota; `"off"` wyłącza zdarzenia systemowe reakcji. Usunięcia reakcji nie są syntetyzowane jako zdarzenia systemowe, ponieważ Matrix prezentuje je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest uwzględnianych jako `InboundHistory`, gdy wiadomość z pokoju Matrix wyzwala agenta. Wartość awaryjna to `messages.groupChat.historyLimit`; jeśli obie są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM nadal używają normalnej historii sesji.
- Historia pokoju Matrix obejmuje tylko oczekujące wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie tworzy migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest uwzględniana w `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby tego samego zdarzenia Matrix używają ponownie oryginalnej migawki historii zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Kontekst uzupełniający jest zachowywany w odebranej postaci.
- `contextVisibility: "allowlist"` filtruje kontekst uzupełniający do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność kontekstu uzupełniającego, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwalacza nadal pochodzi z `groupPolicy`, `groups`, `groupAllowFrom` oraz ustawień zasad DM.

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

Zobacz [Grupy](/pl/channels/groups), aby poznać bramkowanie wzmianek i działanie listy dozwolonych.

Przykład parowania dla DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła do Ciebie wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może wysłać odpowiedź przypominającą po krótkim czasie odnowienia zamiast wybijać nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ pamięci.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich rozjedzie się z synchronizacją, OpenClaw może skończyć z nieaktualnymi mapowaniami `m.direct`, które wskazują stare pokoje jednoosobowe zamiast aktywnego DM. Sprawdź bieżące mapowanie dla rozmówcy:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Oba polecenia akceptują `--account <id>` dla konfiguracji wielokontowych. Przepływ naprawy:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- wraca do dowolnego aktualnie dołączonego ścisłego DM 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje zdrowy DM

Nie usuwa automatycznie starych pokojów. Wybiera zdrowy DM i aktualizuje mapowanie, aby przyszłe wysyłki Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości bezpośrednich celowały we właściwy pokój.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń. Skonfiguruj w `channels.matrix.execApprovals` (lub `channels.matrix.accounts.<account>.execApprovals` jako nadpisanie dla konta):

- `enabled`: dostarczaj zatwierdzenia przez natywne monity Matrix. Gdy nieustawione lub `"auto"`, Matrix automatycznie włącza się, gdy tylko da się rozwiązać co najmniej jednego zatwierdzającego. Ustaw `false`, aby jawnie wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnione do zatwierdzania żądań exec. Opcjonalne — wartość awaryjna to `channels.matrix.dm.allowFrom`.
- `target`: gdzie trafiają monity. `"dm"` (domyślnie) wysyła do DM zatwierdzających; `"channel"` wysyła do źródłowego pokoju Matrix lub DM; `"both"` wysyła do obu.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych agentów/sesji, które wyzwalają dostarczanie przez Matrix.

Autoryzacja różni się nieznacznie między rodzajami zatwierdzeń:

- **Zatwierdzenia exec** używają `execApprovals.approvers`, z wartością awaryjną `dm.allowFrom`.
- **Zatwierdzenia Plugin** autoryzują tylko przez `dm.allowFrom`.

Oba rodzaje współdzielą skróty reakcji Matrix i aktualizacje wiadomości. Zatwierdzający widzą skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` zezwól raz
- `❌` odmów
- `♾️` zezwalaj zawsze (gdy efektywna zasada exec na to pozwala)

Awaryjne polecenia ukośnikowe: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzić lub odmówić. Dostarczanie kanałem dla zatwierdzeń exec obejmuje tekst polecenia — włączaj `channel` lub `both` tylko w zaufanych pokojach.

Powiązane: [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Polecenia ukośnikowe

Polecenia ukośnikowe (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w DM. W pokojach OpenClaw rozpoznaje też polecenia poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` wyzwala ścieżkę polecenia bez niestandardowego regexu wzmianki. Dzięki temu bot reaguje na wpisy pokojowe w stylu `@mention /command`, które Element i podobni klienci emitują, gdy użytkownik uzupełnia bota tabulatorem przed wpisaniem polecenia.

Zasady autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać te same zasady listy dozwolonych/właściciela dla DM lub pokoju co zwykłe wiadomości.

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

- Wartości najwyższego poziomu `channels.matrix` działają jako domyślne dla nazwanych kont, chyba że konto je nadpisuje.
- Ogranicz dziedziczony wpis pokoju do konkretnego konta za pomocą `groups.<room>.account`. Wpisy bez `account` są współdzielone między kontami; `account: "default"` nadal działa, gdy konto domyślne jest skonfigurowane na najwyższym poziomie.

**Wybór konta domyślnego:**

- Ustaw `defaultAccount`, aby wybrać nazwane konto preferowane przez niejawny routing, sondowanie i polecenia CLI.
- Jeśli masz wiele kont i jedno dosłownie nazywa się `default`, OpenClaw używa go niejawnie nawet wtedy, gdy `defaultAccount` jest nieustawione.
- Jeśli masz wiele nazwanych kont i nie wybrano domyślnego, polecenia CLI odmawiają zgadywania — ustaw `defaultAccount` albo przekaż `--account <id>`.
- Blok najwyższego poziomu `channels.matrix.*` jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego uwierzytelnianie jest kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta pozostają wykrywalne z `homeserver` + `userId`, gdy poświadczenia z pamięci podręcznej pokrywają uwierzytelnianie.

**Promocja:**

- Gdy OpenClaw promuje konfigurację jednokontową do wielokontowej podczas naprawy lub konfiguracji, zachowuje istniejące nazwane konto, jeśli takie istnieje albo `defaultAccount` już na nie wskazuje. Do promowanego konta przenoszone są tylko klucze uwierzytelniania/bootstrapu Matrix; współdzielone klucze zasad dostarczania pozostają na najwyższym poziomie.

Zobacz [Dokumentację konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz tę opcję dla konta.

Jeśli Twój homeserver działa na localhost, adresie IP LAN/Tailscale albo wewnętrznej nazwie hosta, włącz
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

To jawne włączenie zezwala tylko na zaufane cele prywatne/wewnętrzne. Publiczne homeservery bez szyfrowania, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. W miarę możliwości preferuj `https://`.

## Przekazywanie ruchu Matrix przez proxy

Jeśli Twoje wdrożenie Matrix wymaga jawnego wychodzącego proxy HTTP(S), ustaw `channels.matrix.proxy`:

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
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w czasie działania oraz sond statusu konta.

## Rozpoznawanie celów

Matrix akceptuje te formy celów wszędzie tam, gdzie OpenClaw prosi o wskazanie pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Identyfikatory pokojów Matrix rozróżniają wielkość liter. Podczas konfigurowania jawnych celów dostarczania, zadań cron, powiązań lub list dozwolonych używaj dokładnej wielkości liter identyfikatora pokoju z Matrix.
OpenClaw zachowuje wewnętrzne klucze sesji w postaci kanonicznej na potrzeby przechowywania, więc te klucze zapisane małymi literami nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie w katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokojów akceptują bezpośrednio jawne identyfikatory pokojów i aliasy, a następnie awaryjnie wyszukują nazwy pokojów, do których dołączyło to konto.
- Wyszukiwanie po nazwach pokojów, do których dołączono, działa na zasadzie best-effort. Jeśli nazwy pokoju nie da się rozpoznać do identyfikatora lub aliasu, jest ona ignorowana podczas rozpoznawania list dozwolonych w czasie działania.

## Opis konfiguracji

Pola w stylu listy dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akceptują pełne identyfikatory użytkowników Matrix (najbezpieczniej). Dokładne dopasowania katalogowe są rozpoznawane przy uruchamianiu oraz za każdym razem, gdy lista dozwolonych zmienia się podczas działania monitora; wpisy, których nie da się rozpoznać, są ignorowane w czasie działania. Z tego samego powodu listy dozwolonych pokojów preferują identyfikatory pokojów lub aliasy.

### Konto i połączenie

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta wyświetlana dla konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane nadpisania dla poszczególnych kont. Wartości najwyższego poziomu `channels.matrix` są dziedziczone jako domyślne.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwala temu kontu na łączenie się z `localhost`, adresami IP LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Obsługiwane jest nadpisanie dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenie. Wartości tekstowe i SecretRef są obsługiwane przez dostawców env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło dla logowania opartego na haśle. Obsługiwane są wartości tekstowe i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia używana podczas logowania hasłem.
- `avatarUrl`: przechowywany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.

### Szyfrowanie

- `encryption`: włącza E2EE. Domyślnie: `false`.
- `startupVerification`: `"if-unverified"` (domyślnie, gdy E2EE jest włączone) lub `"off"`. Automatycznie żąda samodzielnej weryfikacji przy uruchamianiu, gdy to urządzenie jest niezweryfikowane.
- `startupVerificationCooldownHours`: czas odnowienia przed następnym automatycznym żądaniem przy uruchamianiu. Domyślnie: `24`.

### Dostęp i polityka

- `groupPolicy`: `"open"`, `"allowlist"` lub `"disabled"`. Domyślnie: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w pokojach.
- `dm.enabled`: gdy `false`, ignoruje wszystkie DM. Domyślnie: `true`.
- `dm.policy`: `"pairing"` (domyślnie), `"allowlist"`, `"open"` lub `"disabled"`. Ma zastosowanie po tym, jak bot dołączył i sklasyfikował pokój jako DM; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu DM.
- `dm.sessionScope`: `"per-user"` (domyślnie) lub `"per-room"`.
- `dm.threadReplies`: nadpisanie tylko dla DM dotyczące wątkowania odpowiedzi (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuje wiadomości od innych skonfigurowanych kont botów Matrix (`true` lub `"mentions"`).
- `allowlistOnly`: gdy `true`, wymusza zmianę wszystkich aktywnych polityk DM (oprócz `"disabled"`) oraz polityk grupowych `"open"` na `"allowlist"`. Nie zmienia polityk `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` lub `"off"`. Domyślnie: `"off"`. Ma zastosowanie do każdego zaproszenia Matrix, w tym zaproszeń w stylu DM.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `"allowlist"`. Wpisy aliasów są rozpoznawane względem homeservera, a nie względem stanu deklarowanego przez zapraszający pokój.
- `contextVisibility`: uzupełniająca widoczność kontekstu (domyślnie `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Zachowanie odpowiedzi

- `replyToMode`: `"off"`, `"first"`, `"all"` lub `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` lub `"always"`.
- `threadBindings`: nadpisania dla poszczególnych kanałów dotyczące routingu i cyklu życia sesji powiązanych z wątkiem.
- `streaming`: `"off"` (domyślnie), `"partial"`, `"quiet"` lub forma obiektowa `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: gdy `true`, ukończone bloki asystenta są zachowywane jako osobne wiadomości postępu.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg dołączany na początku odpowiedzi wychodzących.
- `textChunkLimit`: rozmiar fragmentu wychodzącego w znakach, gdy `chunkMode: "length"`. Domyślnie: `4000`.
- `chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) lub `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju dołączanych jako `InboundHistory`, gdy wiadomość w pokoju wyzwala agenta. Awaryjnie używa `messages.groupChat.historyLimit`; efektywna wartość domyślna to `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania przychodzącego.

### Ustawienia reakcji

- `ackReaction`: nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: nadpisanie zakresu (domyślnie `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (domyślnie `"own"`, `"off"`).

### Narzędzia i nadpisania dla poszczególnych pokojów

- `actions`: bramkowanie narzędzi dla poszczególnych akcji (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa polityk dla poszczególnych pokojów. Tożsamość sesji używa stabilnego identyfikatora pokoju po rozpoznaniu. (`rooms` to starszy alias).
  - `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta.
  - `groups.<room>.allowBots`: nadpisanie ustawienia na poziomie kanału dla poszczególnych pokojów (`true` lub `"mentions"`).
  - `groups.<room>.users`: lista dozwolonych nadawców dla poszczególnych pokojów.
  - `groups.<room>.tools`: nadpisania zezwoleń/odmów narzędzi dla poszczególnych pokojów.
  - `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami dla poszczególnych pokojów. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza ich ponowne włączenie.
  - `groups.<room>.skills`: filtr Skills dla poszczególnych pokojów.
  - `groups.<room>.systemPrompt`: fragment promptu systemowego dla poszczególnych pokojów.

### Ustawienia zatwierdzania exec

- `execApprovals.enabled`: dostarcza zatwierdzenia exec przez natywne prompty Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnione do zatwierdzania. Awaryjnie używa `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` lub `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów/sesji dla dostarczania.

## Powiązane

- [Omówienie kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
