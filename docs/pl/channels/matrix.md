---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie Matrix E2EE i weryfikacji
summary: Stan obsługi Matrix, konfiguracja i przykłady ustawień
title: Macierz
x-i18n:
    generated_at: "2026-05-06T09:03:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
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

Z lokalnej kopii roboczej:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` rejestruje i włącza Plugin, więc osobny krok `openclaw plugins enable matrix` nie jest potrzebny. Plugin nadal nic nie robi, dopóki nie skonfigurujesz poniższego kanału. Zobacz [Pluginy](/pl/tools/plugin), aby poznać ogólne zachowanie Pluginów i zasady instalacji.

## Konfiguracja

1. Utwórz konto Matrix na swoim homeserverze.
2. Skonfiguruj `channels.matrix` za pomocą `homeserver` + `accessToken` albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie Gateway.
4. Rozpocznij wiadomość prywatną z botem albo zaproś go do pokoju (zobacz [automatyczne dołączanie](#auto-join) - świeże zaproszenia trafiają tylko wtedy, gdy `autoJoin` na nie pozwala).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o: URL homeservera, metodę uwierzytelniania (token dostępu lub hasło), identyfikator użytkownika (tylko uwierzytelnianie hasłem), opcjonalną nazwę urządzenia, czy włączyć E2EE oraz czy skonfigurować dostęp do pokojów i automatyczne dołączanie.

Jeśli pasujące zmienne środowiskowe `MATRIX_*` już istnieją, a wybrane konto nie ma zapisanego uwierzytelnienia, kreator proponuje skrót przez zmienne środowiskowe. Aby rozwiązać nazwy pokojów przed zapisaniem listy dozwolonych, uruchom `openclaw channels resolve --channel matrix "Project Room"`. Gdy E2EE jest włączone, kreator zapisuje konfigurację i uruchamia ten sam proces przygotowania co [`openclaw matrix encryption setup`](#encryption-and-verification).

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

OpenClaw nie może w chwili zaproszenia stwierdzić, czy zapraszany pokój jest wiadomością prywatną czy grupą, więc wszystkie zaproszenia - w tym zaproszenia w stylu wiadomości prywatnej - najpierw przechodzą przez `autoJoin`. `dm.policy` stosuje się dopiero później, po dołączeniu bota i sklasyfikowaniu pokoju.

<Warning>
Ustaw `autoJoin: "allowlist"` oraz `autoJoinAllowlist`, aby ograniczyć zaproszenia akceptowane przez bota, albo `autoJoin: "always"`, aby akceptować każde zaproszenie.

`autoJoinAllowlist` akceptuje tylko stabilne cele: `!roomId:server`, `#alias:server` albo `*`. Zwykłe nazwy pokojów są odrzucane; wpisy aliasów są rozwiązywane względem homeservera, a nie względem stanu deklarowanego przez zapraszany pokój.
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

Listy dozwolonych wiadomości prywatnych i pokojów najlepiej wypełniać stabilnymi identyfikatorami:

- Wiadomości prywatne (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): użyj `@user:server`. Nazwy wyświetlane są rozwiązywane tylko wtedy, gdy katalog homeservera zwróci dokładnie jedno dopasowanie.
- Pokoje (`groups`, `autoJoinAllowlist`): użyj `!room:server` albo `#alias:server`. Nazwy są rozwiązywane w miarę możliwości względem pokojów, do których dołączono; nierozwiązane wpisy są ignorowane w czasie działania.

### Normalizacja identyfikatora konta

Kreator konwertuje przyjazną nazwę na znormalizowany identyfikator konta. Na przykład `Ops Bot` staje się `ops-bot`. Interpunkcja jest escapowana w zakresowanych nazwach zmiennych środowiskowych, aby dwa konta nie mogły kolidować: `-` → `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

### Buforowane poświadczenia

Matrix przechowuje buforowane poświadczenia w `~/.openclaw/credentials/matrix/`:

- konto domyślne: `credentials.json`
- konta nazwane: `credentials-<account>.json`

Gdy znajdują się tam buforowane poświadczenia, OpenClaw traktuje Matrix jako skonfigurowany, nawet jeśli token dostępu nie znajduje się w pliku konfiguracyjnym - obejmuje to konfigurację, `openclaw doctor` oraz sondy statusu kanału.

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

`MATRIX_HOMESERVER` nie może być ustawiony z pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

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

Strumieniowanie odpowiedzi w Matrix jest opcjonalne. `streaming` kontroluje, jak OpenClaw dostarcza odpowiedź asystenta w trakcie generowania; `blockStreaming` kontroluje, czy każdy ukończony blok zostaje zachowany jako osobna wiadomość Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Aby zachować podglądy odpowiedzi na żywo, ale ukryć tymczasowe wiersze narzędzi/postępu, użyj formy obiektowej:

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

| `streaming`            | Zachowanie                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (domyślnie)    | Czeka na pełną odpowiedź, wysyła raz. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                     |
| `"partial"`            | Edytuje jedną zwykłą wiadomość tekstową w miejscu, gdy model zapisuje bieżący blok. Standardowe klienty Matrix mogą powiadomić przy pierwszym podglądzie, a nie przy finalnej edycji. |
| `"quiet"`              | Tak samo jak `"partial"`, ale wiadomość jest niepowiadamiającym komunikatem. Odbiorcy dostają powiadomienie dopiero wtedy, gdy reguła push dla użytkownika dopasuje sfinalizowaną edycję (zobacz niżej). |

`blockStreaming` jest niezależne od `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (domyślnie)                     |
| ----------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `"partial"` / `"quiet"` | Szkic na żywo dla bieżącego bloku, ukończone bloki zachowane jako wiadomości | Szkic na żywo dla bieżącego bloku, sfinalizowany w miejscu |
| `"off"`                 | Jedna powiadamiająca wiadomość Matrix na ukończony blok                  | Jedna powiadamiająca wiadomość Matrix dla pełnej odpowiedzi |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru pojedynczego zdarzenia w Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do dostarczania tylko finalnej wersji.
- Odpowiedzi multimedialne zawsze wysyłają załączniki normalnie. Jeśli przestarzałego podglądu nie można już bezpiecznie użyć ponownie, OpenClaw redaguje go przed wysłaniem finalnej odpowiedzi multimedialnej.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy aktywne jest strumieniowanie podglądu Matrix. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu dla tekstu odpowiedzi, ale pozostawić postęp narzędzi na normalnej ścieżce dostarczania.
- Edycje podglądu kosztują dodatkowe wywołania API Matrix. Pozostaw `streaming: "off"`, jeśli chcesz najbardziej konserwatywny profil limitów szybkości.

## Metadane zatwierdzania

Natywne monity zatwierdzania Matrix są zwykłymi zdarzeniami `m.room.message` z niestandardową zawartością zdarzenia specyficzną dla OpenClaw pod `com.openclaw.approval`. Matrix zezwala na niestandardowe klucze zawartości zdarzeń, więc standardowe klienty nadal renderują treść tekstową, a klienty świadome OpenClaw mogą odczytać strukturalny identyfikator zatwierdzenia, rodzaj, stan, dostępne decyzje oraz szczegóły wykonania/Pluginu.

Gdy monit zatwierdzania jest zbyt długi dla jednego zdarzenia Matrix, OpenClaw dzieli widoczny tekst na części i dołącza `com.openclaw.approval` tylko do pierwszej części. Reakcje dla decyzji zezwól/odmów są powiązane z tym pierwszym zdarzeniem, więc długie monity zachowują ten sam cel zatwierdzania co monity jednozdarzeniowe.

### Samodzielnie hostowane reguły push dla cichych sfinalizowanych podglądów

`streaming: "quiet"` powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury - reguła push dla użytkownika musi dopasować sfinalizowany znacznik podglądu. Zobacz [Reguły push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules), aby uzyskać pełną procedurę (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserverów).

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
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości z tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli samoodpowiedzi.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „autorstwo bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym Gateway OpenClaw”.

Używaj ścisłych list dozwolonych pokojów i wymagań wzmianek, gdy włączasz ruch bot-do-bota w pokojach współdzielonych.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Niezaszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Konfiguracja nie jest potrzebna - Plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` akceptują `--verbose` (pełna diagnostyka), `--json` (wyjście czytelne maszynowo) oraz `--account <id>` (konfiguracje z wieloma kontami). Wyjście jest domyślnie zwięzłe z cichym wewnętrznym logowaniem SDK. Poniższe przykłady pokazują formę kanoniczną; dodaj flagi według potrzeb.

### Włącz szyfrowanie

```bash
openclaw matrix encryption setup
```

Inicjuje magazyn sekretów i podpisywanie krzyżowe, w razie potrzeby tworzy kopię zapasową kluczy pokojów, a następnie wypisuje status i kolejne kroki. Przydatne flagi:

- `--recovery-key <key>` zastosuj klucz odzyskiwania przed inicjalizacją (preferuj formę przez stdin udokumentowaną poniżej)
- `--force-reset-cross-signing` odrzuć bieżącą tożsamość podpisywania krzyżowego i utwórz nową (używaj tylko świadomie)

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

`verify status` raportuje trzy niezależne sygnały zaufania (`--verbose` pokazuje wszystkie):

- `Locally trusted`: zaufane tylko przez tego klienta
- `Cross-signing verified`: SDK raportuje weryfikację przez podpisywanie krzyżowe
- `Signed by owner`: podpisane Twoim własnym kluczem samopodpisującym (tylko diagnostycznie)

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy `Cross-signing verified` ma wartość `yes`. Samo zaufanie lokalne lub podpis właściciela nie wystarcza.

`--allow-degraded-local-state` zwraca diagnostykę best-effort bez wcześniejszego przygotowania konta Matrix; przydatne przy sondach offline lub częściowo skonfigurowanych.

### Weryfikacja tego urządzenia kluczem odzyskiwania

Klucz odzyskiwania jest poufny - przekaż go przez stdin zamiast podawać w wierszu poleceń. Ustaw `MATRIX_RECOVERY_KEY` (albo `MATRIX_<ID>_RECOVERY_KEY` dla nazwanego konta):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie raportuje trzy stany:

- `Recovery key accepted`: Matrix zaakceptował klucz dla magazynu sekretów lub zaufania urządzenia.
- `Backup usable`: kopię zapasową kluczy pokojów można załadować z użyciem zaufanego materiału odzyskiwania.
- `Device verified by owner`: to urządzenie ma pełne zaufanie tożsamości podpisywania krzyżowego Matrix.

Kończy się kodem różnym od zera, gdy pełne zaufanie tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiał kopii zapasowej. W takim przypadku dokończ samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

`verify self` czeka na `Cross-signing verified: yes`, zanim zakończy się powodzeniem. Użyj `--timeout-ms <ms>`, aby dostroić czas oczekiwania.

Forma z kluczem literalnym `openclaw matrix verify device "<recovery-key>"` jest również akceptowana, ale klucz trafi do historii powłoki.

### Inicjalizacja lub naprawa podpisywania krzyżowego

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` to polecenie naprawy i konfiguracji dla kont szyfrowanych. Po kolei:

- inicjuje magazyn sekretów, używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjuje podpisywanie krzyżowe i przesyła brakujące klucze publiczne
- oznacza i podpisuje krzyżowo bieżące urządzenie
- tworzy po stronie serwera kopię zapasową kluczy pokojów, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga UIA do przesłania kluczy podpisywania krzyżowego, OpenClaw najpierw próbuje bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`).

Przydatne flagi:

- `--recovery-key-stdin` (połącz z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) albo `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość podpisywania krzyżowego (tylko świadomie)

### Kopia zapasowa kluczy pokojów

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` pokazuje, czy istnieje kopia zapasowa po stronie serwera i czy to urządzenie może ją odszyfrować. `backup restore` importuje klucze pokojów z kopii zapasowej do lokalnego magazynu kryptograficznego; jeśli klucz odzyskiwania jest już na dysku, możesz pominąć `--recovery-key-stdin`.

Aby zastąpić uszkodzoną kopię zapasową świeżą bazą odniesienia (akceptując utratę nieodzyskiwalnej starej historii; może też odtworzyć magazyn sekretów, jeśli sekret bieżącej kopii zapasowej jest niemożliwy do załadowania):

```bash
openclaw matrix verify backup reset --yes
```

Dodaj `--rotate-recovery-key` tylko wtedy, gdy świadomie chcesz, aby poprzedni klucz odzyskiwania przestał odblokowywać świeżą bazę kopii zapasowej.

### Wyświetlanie, żądanie i obsługa weryfikacji

```bash
openclaw matrix verify list
```

Wyświetla oczekujące żądania weryfikacji dla wybranego konta.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Wysyła żądanie weryfikacji z tego konta OpenClaw. `--own-user` żąda samoweryfikacji (akceptujesz monit w innym kliencie Matrix tego samego użytkownika); `--user-id`/`--device-id`/`--room-id` kierują żądanie do kogoś innego. `--own-user` nie można łączyć z pozostałymi flagami wskazywania celu.

Do niższopoziomowej obsługi cyklu życia - zwykle podczas śledzenia żądań przychodzących z innego klienta - te polecenia działają na konkretnym żądaniu `<id>` (wypisywanym przez `verify list` i `verify request`):

| Polecenie                                  | Cel                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Zaakceptuj żądanie przychodzące                                     |
| `openclaw matrix verify start <id>`        | Uruchom przepływ SAS                                                |
| `openclaw matrix verify sas <id>`          | Wypisz emoji SAS lub liczby dziesiętne                              |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdź, że SAS pasuje do tego, co pokazuje drugi klient          |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuć SAS, gdy emoji lub liczby dziesiętne się nie zgadzają        |
| `openclaw matrix verify cancel <id>`       | Anuluj; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` akceptują `--user-id` i `--room-id` jako wskazówki kontynuacji DM, gdy weryfikacja jest zakotwiczona w konkretnym pokoju wiadomości bezpośrednich.

### Uwagi dotyczące wielu kont

Bez `--account <id>` polecenia Matrix CLI używają domyślnego konta niejawnego. Jeśli masz wiele nazwanych kont i nie ustawiono `channels.matrix.defaultAccount`, odmówią zgadywania i poproszą o wybór. Gdy E2EE jest wyłączone lub niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Zachowanie podczas uruchamiania">
    Przy `encryption: true` wartość domyślna `startupVerification` to `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując okres wyciszenia (domyślnie 24 godziny). Dostosuj przez `startupVerificationCooldownHours` albo wyłącz przez `startupVerification: "off"`.

    Uruchamianie wykonuje też zachowawczy przebieg inicjalizacji kryptograficznej, który ponownie używa bieżącego magazynu sekretów i tożsamości podpisywania krzyżowego. Jeśli stan inicjalizacji jest uszkodzony, OpenClaw próbuje kontrolowanej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga UIA z hasłem, uruchamianie zapisuje ostrzeżenie i pozostaje niefatalne. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [migrację Matrix](/pl/channels/matrix-migration), aby poznać pełny przepływ aktualizacji.

  </Accordion>

  <Accordion title="Powiadomienia o weryfikacji">
    Matrix publikuje powiadomienia cyklu życia weryfikacji w ścisłym pokoju weryfikacji DM jako wiadomości `m.notice`: żądanie, gotowość (ze wskazówkami „Verify by emoji”), rozpoczęcie/zakończenie oraz szczegóły SAS (emoji/liczby dziesiętne), gdy są dostępne.

    Żądania przychodzące z innego klienta Matrix są śledzone i automatycznie akceptowane. Dla samoweryfikacji OpenClaw automatycznie uruchamia przepływ SAS i potwierdza swoją stronę, gdy weryfikacja emoji jest dostępna - nadal musisz porównać i potwierdzić „They match” w swoim kliencie Matrix.

    Systemowe powiadomienia weryfikacji nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Usunięte lub nieprawidłowe urządzenie Matrix">
    Jeśli `verify status` informuje, że bieżącego urządzenia nie ma już na liście homeservera, utwórz nowe urządzenie Matrix OpenClaw. Dla logowania hasłem:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Dla uwierzytelniania tokenem utwórz świeży token dostępu w swoim kliencie Matrix lub interfejsie administratora, a następnie zaktualizuj OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Zastąp `assistant` identyfikatorem konta z nieudanego polecenia albo pomiń `--account` dla konta domyślnego.

  </Accordion>

  <Accordion title="Higiena urządzeń">
    Stare urządzenia zarządzane przez OpenClaw mogą się kumulować. Wyświetl i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Magazyn kryptograficzny">
    Matrix E2EE używa oficjalnej ścieżki kryptograficznej Rust z `matrix-js-sdk`, z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia pliku).

    Szyfrowany stan środowiska wykonawczego znajduje się pod `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, zrzut IDB, powiązania wątków oraz stan weryfikacji podczas uruchamiania. Gdy token się zmienia, ale tożsamość konta pozostaje ta sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, dzięki czemu poprzedni stan pozostaje widoczny.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Możesz przekazać obie opcje w jednym wywołaniu. Matrix akceptuje adresy URL awatarów `mxc://` bezpośrednio; gdy przekażesz `http://` lub `https://`, OpenClaw najpierw przesyła plik, a potem zapisuje rozwiązany adres URL `mxc://` w `channels.matrix.avatarUrl` (albo w nadpisaniu dla konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek przez narzędzie wiadomości. Dwa niezależne pokrętła kontrolują zachowanie:

### Kierowanie sesji (`sessionScope`)

`dm.sessionScope` decyduje, jak pokoje DM Matrix mapują się na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje DM z tym samym skierowanym peerem współdzielą jedną sesję.
- `"per-room"`: każdy pokój DM Matrix otrzymuje własny klucz sesji, nawet gdy peer jest ten sam.

Jawne powiązania konwersacji zawsze mają pierwszeństwo przed `sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Wątkowanie odpowiedzi (`threadReplies`)

`threadReplies` decyduje, gdzie bot publikuje odpowiedź:

- `"off"`: odpowiedzi są najwyższego poziomu. Przychodzące wiadomości wątkowane pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiedz w wątku tylko wtedy, gdy wiadomość przychodząca już była w tym wątku.
- `"always"`: odpowiedz w wątku zakorzenionym w wiadomości wyzwalającej; ta konwersacja jest kierowana przez pasującą sesję scoped do wątku od pierwszego wyzwolenia.

`dm.threadReplies` nadpisuje to tylko dla DM - na przykład pozwala izolować wątki pokojów, zachowując płaskie DM.

### Dziedziczenie wątków i polecenia slash

- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki narzędzia wiadomości automatycznie dziedziczą bieżący wątek Matrix podczas kierowania do tego samego pokoju (albo tego samego użytkownika docelowego DM), chyba że podano jawne `threadId`.
- Ponowne użycie użytkownika docelowego DM włącza się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego rozmówcę DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routingu ograniczonego do użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają zarówno w pokojach Matrix, jak i w DM.
- Najwyższego poziomu `/focus` tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy włączone jest `threadBindings.spawnSessions`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek na miejscu.

Gdy OpenClaw wykryje kolizję pokoju DM Matrix z innym pokojem DM w tej samej współdzielonej sesji, publikuje w tym pokoju jednorazowe `m.notice`, wskazujące awaryjną ścieżkę `/focus` i sugerujące zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy wiązania wątków są włączone.

## Wiązania konwersacji ACP

Pokoje Matrix, DM oraz istniejące wątki Matrix można przekształcić w trwałe obszary robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W DM lub pokoju Matrix najwyższego poziomu bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże ten bieżący wątek na miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa wiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnSessions` bramkuje `/acp spawn --thread auto|here`, gdzie OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja wiązania wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings` i obsługuje także nadpisania dla poszczególnych kanałów:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Tworzenie sesji powiązanych z wątkami Matrix jest domyślnie włączone:

- Ustaw `threadBindings.spawnSessions: false`, aby zablokować tworzenie/wiązanie wątków Matrix przez najwyższego poziomu `/focus` oraz `/acp spawn --thread auto|here`.
- Ustaw `threadBindings.defaultSpawnContext: "isolated"`, gdy natywne tworzenie wątków podagentów nie powinno forkować transkryptu nadrzędnego.

## Reakcje

Matrix obsługuje reakcje wychodzące, powiadomienia o reakcjach przychodzących oraz reakcje potwierdzające.

Narzędzia reakcji wychodzących są bramkowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota na tym zdarzeniu.
- `remove: true` usuwa z bota tylko określoną reakcję emoji.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie              | Kolejność                                                                        |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | na konto → kanał → `messages.ackReaction` → awaryjne emoji tożsamości agenta     |
| `ackReactionScope`      | na konto → kanał → `messages.ackReactionScope` → domyślne `"group-mentions"`     |
| `reactionNotifications` | na konto → kanał → domyślne `"own"`                                              |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy dotyczą wiadomości Matrix autorstwa bota; `"off"` wyłącza zdarzenia systemowe reakcji. Usunięcia reakcji nie są syntetyzowane jako zdarzenia systemowe, ponieważ Matrix prezentuje je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju Matrix wyzwala agenta. Wartość zastępcza pochodzi z `messages.groupChat.historyLimit`; jeśli obie są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM nadal używają normalnej historii sesji.
- Historia pokoju Matrix obejmuje tylko oczekujące wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie wykonuje migawkę tego okna, gdy pojawi się wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest uwzględniana w `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowienia tego samego zdarzenia Matrix używają pierwotnej migawki historii zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, wiadomości główne wątków oraz oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Dodatkowy kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność dodatkowego kontekstu, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwalania nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` oraz polityki DM.

## Polityka DM i pokojów

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

Aby całkowicie wyciszyć DM, zachowując działające pokoje, ustaw `dm.enabled: false`:

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

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może wysłać odpowiedź przypominającą po krótkim czasie odnowienia zamiast wybijać nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ przechowywania.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich rozjedzie się z rzeczywistością, OpenClaw może skończyć z nieaktualnymi mapowaniami `m.direct`, które wskazują stare pokoje jednoosobowe zamiast aktywnego DM. Sprawdź bieżące mapowanie dla rozmówcy:

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

Nie usuwa automatycznie starych pokojów. Wybiera zdrowy DM i aktualizuje mapowanie, aby przyszłe wysyłki Matrix, powiadomienia weryfikacyjne oraz inne przepływy wiadomości bezpośrednich trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń. Skonfiguruj w `channels.matrix.execApprovals` (lub `channels.matrix.accounts.<account>.execApprovals` dla nadpisania na konto):

- `enabled`: dostarczaj zatwierdzenia przez natywne monity Matrix. Gdy nieustawione lub `"auto"`, Matrix włącza się automatycznie, gdy można rozstrzygnąć co najmniej jedną osobę zatwierdzającą. Ustaw `false`, aby jawnie wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnione do zatwierdzania żądań exec. Opcjonalne - używa wartości zastępczej `channels.matrix.dm.allowFrom`.
- `target`: miejsce wysyłania monitów. `"dm"` (domyślne) wysyła do DM osób zatwierdzających; `"channel"` wysyła do źródłowego pokoju Matrix lub DM; `"both"` wysyła do obu.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych agentów/sesji, które wyzwalają dostarczanie przez Matrix.

Autoryzacja różni się nieznacznie między rodzajami zatwierdzeń:

- **Zatwierdzenia exec** używają `execApprovals.approvers`, z wartością zastępczą `dm.allowFrom`.
- **Zatwierdzenia Plugin** autoryzują tylko przez `dm.allowFrom`.

Oba rodzaje współdzielą skróty reakcji Matrix i aktualizacje wiadomości. Osoby zatwierdzające widzą skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` zezwól raz
- `❌` odmów
- `♾️` zezwalaj zawsze (gdy efektywna polityka exec na to pozwala)

Awaryjne polecenia ukośnikowe: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozstrzygnięte osoby zatwierdzające mogą zatwierdzać lub odmawiać. Dostarczanie kanałowe dla zatwierdzeń exec zawiera tekst polecenia - włączaj `channel` lub `both` tylko w zaufanych pokojach.

Powiązane: [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Polecenia ukośnikowe

Polecenia ukośnikowe (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w DM. W pokojach OpenClaw rozpoznaje także polecenia poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` wyzwala ścieżkę polecenia bez niestandardowego wyrażenia regularnego wzmianki. Dzięki temu bot pozostaje responsywny na posty w stylu pokojowym `@mention /command`, które Element i podobni klienci emitują, gdy użytkownik uzupełnia tabulatorem bota przed wpisaniem polecenia.

Reguły autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać te same polityki listy dozwolonych/właściciela dla DM lub pokoju co zwykłe wiadomości.

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

- Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla nazwanych kont, chyba że konto je nadpisze.
- Ogranicz dziedziczony wpis pokoju do konkretnego konta za pomocą `groups.<room>.account`. Wpisy bez `account` są współdzielone między kontami; `account: "default"` nadal działa, gdy konto domyślne jest skonfigurowane na najwyższym poziomie.

**Wybór konta domyślnego:**

- Ustaw `defaultAccount`, aby wybrać nazwane konto preferowane przez niejawny routing, sondowanie i polecenia CLI.
- Jeśli masz wiele kont i jedno dosłownie nazywa się `default`, OpenClaw używa go niejawnie nawet wtedy, gdy `defaultAccount` jest nieustawione.
- Jeśli masz wiele nazwanych kont i nie wybrano domyślnego, polecenia CLI odmawiają zgadywania - ustaw `defaultAccount` albo przekaż `--account <id>`.
- Blok najwyższego poziomu `channels.matrix.*` jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego uwierzytelnianie jest kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta pozostają wykrywalne z `homeserver` + `userId`, gdy buforowane poświadczenia pokrywają uwierzytelnianie.

**Promocja:**

- Gdy OpenClaw promuje konfigurację jednokontową do wielokontowej podczas naprawy lub konfiguracji, zachowuje istniejące nazwane konto, jeśli takie istnieje, albo jeśli `defaultAccount` już na nie wskazuje. Do promowanego konta przenoszone są tylko klucze uwierzytelniania/bootstrapu Matrix; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz je dla danego konta.

Jeśli Twój homeserver działa na localhost, adresie IP LAN/Tailscale lub wewnętrznej nazwie hosta, włącz
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

Ta opcja wymagająca jawnego włączenia pozwala tylko na zaufane cele prywatne/wewnętrzne. Publiczne homeserwery bez szyfrowania, takie jak
`http://matrix.example.org:8008`, pozostają blokowane. Gdy tylko to możliwe, preferuj `https://`.

## Proxyowanie ruchu Matrix

Jeśli Twoje wdrożenie Matrix wymaga jawnego wychodzącego serwera proxy HTTP(S), ustaw `channels.matrix.proxy`:

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

Nazwane konta mogą nadpisywać domyślne ustawienie najwyższego poziomu za pomocą `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w czasie działania oraz sond stanu konta.

## Rozpoznawanie celów

Matrix akceptuje te formy celów wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Identyfikatory pokoi Matrix rozróżniają wielkość liter. Używaj dokładnej wielkości liter identyfikatora pokoju z Matrix
podczas konfigurowania jawnych celów dostarczania, zadań cron, powiązań lub list dozwolonych.
OpenClaw zachowuje wewnętrzne klucze sesji w postaci kanonicznej na potrzeby przechowywania, więc te klucze pisane małymi literami
nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie w katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserwerze.
- Wyszukiwania pokoi akceptują bezpośrednio jawne identyfikatory pokoi i aliasy, a następnie awaryjnie wyszukują nazwy dołączonych pokoi dla tego konta.
- Wyszukiwanie nazw dołączonych pokoi działa w trybie best-effort. Jeśli nazwy pokoju nie można rozpoznać do identyfikatora lub aliasu, jest ona ignorowana przez rozpoznawanie listy dozwolonych w czasie działania.

## Referencja konfiguracji

Pola w stylu listy dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akceptują pełne identyfikatory użytkowników Matrix (najbezpieczniej). Dokładne dopasowania katalogowe są rozpoznawane przy uruchamianiu i za każdym razem, gdy lista dozwolonych zmieni się podczas działania monitora; wpisy, których nie można rozpoznać, są ignorowane w czasie działania. Listy dozwolonych pokoi preferują identyfikatory pokoi lub aliasy z tego samego powodu.

### Konto i połączenie

- `enabled`: włącz lub wyłącz kanał.
- `name`: opcjonalna etykieta wyświetlana dla konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane nadpisania dla poszczególnych kont. Wartości najwyższego poziomu `channels.matrix` są dziedziczone jako domyślne.
- `homeserver`: URL homeserwera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwól temu kontu na łączenie się z `localhost`, adresami IP LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny URL serwera proxy HTTP(S) dla ruchu Matrix. Obsługiwane nadpisanie dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenie. Obsługiwane są wartości jawnego tekstu i SecretRef u dostawców env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości jawnego tekstu i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia używana podczas logowania hasłem.
- `avatarUrl`: zapisany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji startowej.

### Szyfrowanie

- `encryption`: włącz E2EE. Domyślnie: `false`.
- `startupVerification`: `"if-unverified"` (domyślnie, gdy E2EE jest włączone) lub `"off"`. Automatycznie żąda samodzielnej weryfikacji przy uruchamianiu, gdy to urządzenie jest niezweryfikowane.
- `startupVerificationCooldownHours`: czas oczekiwania przed następnym automatycznym żądaniem przy uruchamianiu. Domyślnie: `24`.

### Dostęp i zasady

- `groupPolicy`: `"open"`, `"allowlist"` lub `"disabled"`. Domyślnie: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w pokojach.
- `dm.enabled`: gdy `false`, ignoruj wszystkie DM. Domyślnie: `true`.
- `dm.policy`: `"pairing"` (domyślnie), `"allowlist"`, `"open"` lub `"disabled"`. Stosowane po dołączeniu bota i sklasyfikowaniu pokoju jako DM; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu DM.
- `dm.sessionScope`: `"per-user"` (domyślnie) lub `"per-room"`.
- `dm.threadReplies`: nadpisanie tylko dla DM dotyczące odpowiedzi w wątkach (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuj wiadomości od innych skonfigurowanych kont botów Matrix (`true` lub `"mentions"`).
- `allowlistOnly`: gdy `true`, wymusza wszystkie aktywne zasady DM (oprócz `"disabled"`) oraz zasady grupowe `"open"` na `"allowlist"`. Nie zmienia zasad `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` lub `"off"`. Domyślnie: `"off"`. Dotyczy każdego zaproszenia Matrix, w tym zaproszeń w stylu DM.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `"allowlist"`. Wpisy aliasów są rozpoznawane względem homeserwera, a nie względem stanu deklarowanego przez pokój z zaproszenia.
- `contextVisibility`: dodatkowa widoczność kontekstu (domyślnie `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Zachowanie odpowiedzi

- `replyToMode`: `"off"`, `"first"`, `"all"` lub `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` lub `"always"`.
- `threadBindings`: nadpisania dla poszczególnych kanałów dotyczące routingu i cyklu życia sesji powiązanych z wątkami.
- `streaming`: `"off"` (domyślnie), `"partial"`, `"quiet"` lub forma obiektu `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: gdy `true`, ukończone bloki asystenta są zachowywane jako osobne wiadomości postępu.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg poprzedzający odpowiedzi wychodzące.
- `textChunkLimit`: rozmiar wychodzącej części w znakach, gdy `chunkMode: "length"`. Domyślnie: `4000`.
- `chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) lub `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju uwzględnianych jako `InboundHistory`, gdy wiadomość w pokoju wyzwala agenta. Awaryjnie używa `messages.groupChat.historyLimit`; efektywna wartość domyślna to `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru mediów w MB dla wysyłek wychodzących i przetwarzania przychodzącego.

### Ustawienia reakcji

- `ackReaction`: nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: nadpisanie zakresu (domyślnie `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (domyślnie `"own"`, `"off"`).

### Narzędzia i nadpisania dla poszczególnych pokoi

- `actions`: bramkowanie narzędzi dla poszczególnych akcji (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa zasad dla poszczególnych pokoi. Tożsamość sesji używa stabilnego identyfikatora pokoju po rozpoznaniu. (`rooms` to alias starszego typu.)
  - `groups.<room>.account`: ogranicz jeden dziedziczony wpis pokoju do konkretnego konta.
  - `groups.<room>.allowBots`: nadpisanie dla pokoju ustawienia na poziomie kanału (`true` lub `"mentions"`).
  - `groups.<room>.users`: lista dozwolonych nadawców dla pokoju.
  - `groups.<room>.tools`: nadpisania zezwalania/odmawiania narzędzi dla pokoju.
  - `groups.<room>.autoReply`: nadpisanie bramkowania wzmianek dla pokoju. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza je ponownie.
  - `groups.<room>.skills`: filtr Skills dla pokoju.
  - `groups.<room>.systemPrompt`: fragment promptu systemowego dla pokoju.

### Ustawienia zatwierdzania exec

- `execApprovals.enabled`: dostarczaj zatwierdzenia exec przez natywne prompty Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnione do zatwierdzania. Awaryjnie używa `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` lub `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów/sesji dla dostarczania.

## Powiązane

- [Omówienie kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
