---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji w Matrix
summary: Stan obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-04-30T09:37:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix jest dołączonym pluginem kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, media, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony plugin

Aktualne pakietowane wydania OpenClaw zawierają Plugin Matrix od razu w zestawie. Nie musisz niczego instalować; skonfigurowanie `channels.matrix.*` (zobacz [Konfiguracja](#setup)) go aktywuje.

W przypadku starszych kompilacji lub niestandardowych instalacji, które wykluczają Matrix, zainstaluj aktualny pakiet npm, gdy zostanie opublikowany:

```bash
openclaw plugins install @openclaw/matrix
```

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, użyj aktualnej pakietowanej kompilacji OpenClaw albo lokalnego checkoutu, dopóki nie zostanie opublikowany nowszy pakiet npm.

Z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` rejestruje i włącza plugin, więc osobny krok `openclaw plugins enable matrix` nie jest potrzebny. Plugin nadal nic nie robi, dopóki nie skonfigurujesz kanału poniżej. Zobacz [Pluginy](/pl/tools/plugin), aby poznać ogólne zachowanie pluginów i reguły instalacji.

## Konfiguracja

1. Utwórz konto Matrix na swoim homeserwerze.
2. Skonfiguruj `channels.matrix`, używając albo `homeserver` + `accessToken`, albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie Gateway.
4. Rozpocznij wiadomość prywatną z botem albo zaproś go do pokoju (zobacz [automatyczne dołączanie](#auto-join) — świeże zaproszenia trafiają tylko wtedy, gdy `autoJoin` na to pozwala).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o: adres URL homeserwera, metodę uwierzytelniania (token dostępu albo hasło), identyfikator użytkownika (tylko uwierzytelnianie hasłem), opcjonalną nazwę urządzenia, czy włączyć E2EE oraz czy skonfigurować dostęp do pokoju i automatyczne dołączanie.

Jeśli pasujące zmienne środowiskowe `MATRIX_*` już istnieją, a wybrane konto nie ma zapisanego uwierzytelnienia, kreator oferuje skrót przez zmienne środowiskowe. Aby rozwiązać nazwy pokoi przed zapisaniem listy dozwolonych, uruchom `openclaw channels resolve --channel matrix "Project Room"`. Gdy E2EE jest włączone, kreator zapisuje konfigurację i uruchamia ten sam bootstrap co [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` ma domyślnie wartość `off`. Przy ustawieniu domyślnym bot nie pojawi się w nowych pokojach ani wiadomościach prywatnych ze świeżych zaproszeń, dopóki nie dołączysz ręcznie.

OpenClaw nie może w momencie zaproszenia stwierdzić, czy zapraszany pokój jest wiadomością prywatną czy grupą, więc wszystkie zaproszenia — także zaproszenia w stylu wiadomości prywatnych — przechodzą najpierw przez `autoJoin`. `dm.policy` ma zastosowanie dopiero później, po dołączeniu bota i sklasyfikowaniu pokoju.

<Warning>
Ustaw `autoJoin: "allowlist"` oraz `autoJoinAllowlist`, aby ograniczyć, które zaproszenia bot akceptuje, albo `autoJoin: "always"`, aby akceptować każde zaproszenie.

`autoJoinAllowlist` akceptuje tylko stabilne cele: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane; wpisy aliasów są rozwiązywane względem homeserwera, a nie względem stanu deklarowanego przez zapraszany pokój.
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

Listy dozwolonych dla wiadomości prywatnych i pokoi najlepiej wypełniać stabilnymi identyfikatorami:

- Wiadomości prywatne (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): używaj `@user:server`. Nazwy wyświetlane są rozwiązywane tylko wtedy, gdy katalog homeserwera zwróci dokładnie jedno dopasowanie.
- Pokoje (`groups`, `autoJoinAllowlist`): używaj `!room:server` albo `#alias:server`. Nazwy są rozwiązywane w miarę możliwości względem pokoi, do których dołączono; nierozwiązane wpisy są ignorowane w czasie działania.

### Normalizacja identyfikatora konta

Kreator konwertuje przyjazną nazwę na znormalizowany identyfikator konta. Na przykład `Ops Bot` staje się `ops-bot`. Interpunkcja jest escapowana w zakresowych nazwach zmiennych środowiskowych, aby dwa konta nie mogły kolidować: `-` → `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

### Buforowane dane logowania

Matrix przechowuje buforowane dane logowania w `~/.openclaw/credentials/matrix/`:

- konto domyślne: `credentials.json`
- konta nazwane: `credentials-<account>.json`

Gdy istnieją tam buforowane dane logowania, OpenClaw traktuje Matrix jako skonfigurowany nawet wtedy, gdy token dostępu nie znajduje się w pliku konfiguracyjnym — obejmuje to konfigurację, `openclaw doctor` i sondy statusu kanału.

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

`MATRIX_HOMESERVER` nie może być ustawione z pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

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

Strumieniowanie odpowiedzi Matrix jest opcjonalne. `streaming` kontroluje, jak OpenClaw dostarcza odpowiedź asystenta w toku; `blockStreaming` kontroluje, czy każdy ukończony blok jest zachowywany jako osobna wiadomość Matrix.

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

| `streaming`          | Zachowanie                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"off"` (domyślnie)  | Czeka na pełną odpowiedź i wysyła raz. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                          |
| `"partial"`          | Edytuje jedną zwykłą wiadomość tekstową w miejscu, gdy model pisze bieżący blok. Standardowi klienci Matrix mogą powiadomić przy pierwszym podglądzie, nie przy końcowej edycji. |
| `"quiet"`            | Tak samo jak `"partial"`, ale wiadomość jest notatką bez powiadomienia. Odbiorcy dostają powiadomienie dopiero wtedy, gdy reguła push dla użytkownika dopasuje sfinalizowaną edycję (zobacz poniżej). |

`blockStreaming` jest niezależne od `streaming`:

| `streaming`             | `blockStreaming: true`                                                 | `blockStreaming: false` (domyślnie)                  |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Szkic na żywo dla bieżącego bloku, ukończone bloki zachowane jako wiadomości | Szkic na żywo dla bieżącego bloku, finalizowany w miejscu |
| `"off"`                 | Jedna powiadamiająca wiadomość Matrix na każdy ukończony blok          | Jedna powiadamiająca wiadomość Matrix dla pełnej odpowiedzi |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru pojedynczego zdarzenia Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do dostarczania tylko wersji końcowej.
- Odpowiedzi z mediami zawsze wysyłają załączniki normalnie. Jeśli przestarzałego podglądu nie można już bezpiecznie użyć ponownie, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi z mediami.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy strumieniowanie podglądu Matrix jest aktywne. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu dla tekstu odpowiedzi, ale pozostawić postęp narzędzi na normalnej ścieżce dostarczania.
- Edycje podglądu kosztują dodatkowe wywołania API Matrix. Pozostaw `streaming: "off"`, jeśli chcesz najbardziej zachowawczy profil limitów szybkości.

## Metadane zatwierdzania

Natywne monity zatwierdzania Matrix są zwykłymi zdarzeniami `m.room.message` z niestandardową treścią zdarzenia specyficzną dla OpenClaw pod `com.openclaw.approval`. Matrix zezwala na niestandardowe klucze treści zdarzeń, więc standardowi klienci nadal renderują treść tekstową, a klienci świadomi OpenClaw mogą odczytać ustrukturyzowany identyfikator zatwierdzenia, rodzaj, stan, dostępne decyzje oraz szczegóły exec/plugin.

Gdy monit zatwierdzania jest zbyt długi dla jednego zdarzenia Matrix, OpenClaw dzieli widoczny tekst na części i dołącza `com.openclaw.approval` tylko do pierwszej części. Reakcje dla decyzji zezwolenia/odmowy są powiązane z tym pierwszym zdarzeniem, więc długie monity zachowują ten sam cel zatwierdzenia co monity jednozdarzeniowe.

### Samodzielnie hostowane reguły push dla cichych sfinalizowanych podglądów

`streaming: "quiet"` powiadamia odbiorców dopiero po sfinalizowaniu bloku albo tury — reguła push dla użytkownika musi dopasować znacznik sfinalizowanego podglądu. Zobacz [Reguły push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules), aby uzyskać pełną procedurę (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserwerów).

## Pokoje bot-bot

Domyślnie wiadomości Matrix z innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, gdy celowo chcesz ruchu Matrix między agentami:

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
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy widocznie wspominają tego bota w pokojach. Wiadomości prywatne nadal są dozwolone.
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości z tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli samoodpowiedzi.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „autorstwo bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym Gateway OpenClaw”.

Używaj ścisłych list dozwolonych pokoi i wymagań wzmianek podczas włączania ruchu bot-bot we współdzielonych pokojach.

## Szyfrowanie i weryfikacja

W pokojach szyfrowanych (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, aby podglądy obrazów były szyfrowane razem z pełnym załącznikiem. Pokoje nieszyfrowane nadal używają zwykłego `thumbnail_url`. Konfiguracja nie jest potrzebna — Plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` akceptują `--verbose` (pełna diagnostyka), `--json` (wynik czytelny maszynowo) oraz `--account <id>` (konfiguracje z wieloma kontami). Domyślnie wynik jest zwięzły, z cichym wewnętrznym logowaniem SDK. Poniższe przykłady pokazują formę kanoniczną; dodaj flagi w razie potrzeby.

### Włącz szyfrowanie

```bash
openclaw matrix encryption setup
```

Inicjalizuje magazyn sekretów i podpisywanie krzyżowe, w razie potrzeby tworzy kopię zapasową kluczy pokojów, a następnie wypisuje stan i kolejne kroki. Przydatne flagi:

- `--recovery-key <key>` zastosuj klucz odzyskiwania przed inicjalizacją (preferuj formę przez stdin opisaną poniżej)
- `--force-reset-cross-signing` odrzuć bieżącą tożsamość podpisywania krzyżowego i utwórz nową (używaj tylko celowo)

Dla nowego konta włącz E2EE podczas tworzenia:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` jest aliasem `--enable-e2ee`.

Odpowiednik konfiguracji ręcznej:

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

- `Locally trusted`: zaufane tylko przez tego klienta
- `Cross-signing verified`: SDK zgłasza weryfikację przez podpisywanie krzyżowe
- `Signed by owner`: podpisane Twoim własnym kluczem samopodpisywania (tylko diagnostycznie)

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy `Cross-signing verified` ma wartość `yes`. Samo zaufanie lokalne lub podpis właściciela nie wystarczą.

`--allow-degraded-local-state` zwraca diagnostykę best-effort bez wcześniejszego przygotowania konta Matrix; przydatne do sond offline lub częściowo skonfigurowanych.

### Zweryfikuj to urządzenie kluczem odzyskiwania

Klucz odzyskiwania jest wrażliwy — przekaż go przez stdin zamiast podawać w wierszu poleceń. Ustaw `MATRIX_RECOVERY_KEY` (albo `MATRIX_<ID>_RECOVERY_KEY` dla nazwanego konta):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie zgłasza trzy stany:

- `Recovery key accepted`: Matrix zaakceptował klucz dla magazynu sekretów lub zaufania urządzenia.
- `Backup usable`: kopię zapasową kluczy pokojów można załadować przy użyciu zaufanych materiałów odzyskiwania.
- `Device verified by owner`: to urządzenie ma pełne zaufanie tożsamości podpisywania krzyżowego Matrix.

Kończy się kodem niezerowym, gdy pełne zaufanie tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiały kopii zapasowej. W takim przypadku dokończ samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

`verify self` czeka na `Cross-signing verified: yes`, zanim zakończy się powodzeniem. Użyj `--timeout-ms <ms>`, aby dostroić czas oczekiwania.

Forma z dosłownym kluczem `openclaw matrix verify device "<recovery-key>"` jest również akceptowana, ale klucz trafi do historii powłoki.

### Zainicjalizuj lub napraw podpisywanie krzyżowe

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` to polecenie naprawy i konfiguracji dla szyfrowanych kont. Kolejno:

- inicjalizuje magazyn sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjalizuje podpisywanie krzyżowe i przesyła brakujące klucze publiczne
- oznacza i podpisuje krzyżowo bieżące urządzenie
- tworzy po stronie serwera kopię zapasową kluczy pokojów, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga UIA do przesłania kluczy podpisywania krzyżowego, OpenClaw najpierw próbuje bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`).

Przydatne flagi:

- `--recovery-key-stdin` (połącz z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) albo `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość podpisywania krzyżowego (tylko celowo)

### Kopia zapasowa kluczy pokojów

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` pokazuje, czy istnieje kopia zapasowa po stronie serwera i czy to urządzenie może ją odszyfrować. `backup restore` importuje zapisane w kopii zapasowej klucze pokojów do lokalnego magazynu kryptograficznego; jeśli klucz odzyskiwania jest już na dysku, możesz pominąć `--recovery-key-stdin`.

Aby zastąpić uszkodzoną kopię zapasową świeżą bazą (akceptuje utratę nieodzyskiwalnej starej historii; może też odtworzyć magazyn sekretów, jeśli sekret bieżącej kopii zapasowej nie daje się załadować):

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

Wysyła żądanie weryfikacji z tego konta OpenClaw. `--own-user` żąda samoweryfikacji (akceptujesz monit w innym kliencie Matrix tego samego użytkownika); `--user-id`/`--device-id`/`--room-id` wskazują kogoś innego. `--own-user` nie może być łączone z innymi flagami wskazywania celu.

Do obsługi cyklu życia niższego poziomu — zwykle podczas śledzenia przychodzących żądań z innego klienta — te polecenia działają na konkretnym żądaniu `<id>` (wypisywanym przez `verify list` i `verify request`):

| Polecenie                                  | Cel                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Zaakceptuj przychodzące żądanie                                     |
| `openclaw matrix verify start <id>`        | Uruchom przepływ SAS                                                |
| `openclaw matrix verify sas <id>`          | Wypisz emoji lub liczby dziesiętne SAS                              |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdź, że SAS zgadza się z tym, co pokazuje drugi klient        |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuć SAS, gdy emoji lub liczby dziesiętne się nie zgadzają        |
| `openclaw matrix verify cancel <id>`       | Anuluj; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` akceptują też `--user-id` oraz `--room-id` jako wskazówki kontynuacji DM, gdy weryfikacja jest zakotwiczona w konkretnym pokoju wiadomości bezpośrednich.

### Uwagi dotyczące wielu kont

Bez `--account <id>` polecenia CLI Matrix używają niejawnego konta domyślnego. Jeśli masz wiele nazwanych kont i nie ustawiono `channels.matrix.defaultAccount`, odmówią zgadywania i poproszą o wybór. Gdy E2EE jest wyłączone lub niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Przy `encryption: true` domyślną wartością `startupVerification` jest `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując okres wyciszenia (domyślnie 24 godziny). Dostosuj za pomocą `startupVerificationCooldownHours` albo wyłącz przez `startupVerification: "off"`.

    Uruchamianie wykonuje też zachowawczy przebieg inicjalizacji kryptografii, który ponownie używa bieżącego magazynu sekretów i tożsamości podpisywania krzyżowego. Jeśli stan inicjalizacji jest uszkodzony, OpenClaw próbuje kontrolowanej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga UIA z hasłem, uruchamianie zapisuje ostrzeżenie w logach i pozostaje niekrytyczne. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [Migracja Matrix](/pl/channels/matrix-migration), aby poznać pełny przepływ aktualizacji.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix publikuje powiadomienia cyklu życia weryfikacji w ścisłym pokoju weryfikacji DM jako wiadomości `m.notice`: żądanie, gotowość (z instrukcją "Verify by emoji"), start/zakończenie oraz szczegóły SAS (emoji/liczby dziesiętne), gdy są dostępne.

    Przychodzące żądania z innego klienta Matrix są śledzone i automatycznie akceptowane. W przypadku samoweryfikacji OpenClaw automatycznie uruchamia przepływ SAS i potwierdza swoją stronę, gdy weryfikacja emoji jest dostępna — nadal musisz porównać i potwierdzić "They match" w swoim kliencie Matrix.

    Systemowe powiadomienia weryfikacyjne nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Jeśli `verify status` informuje, że bieżące urządzenie nie jest już wymienione na homeserverze, utwórz nowe urządzenie Matrix OpenClaw. Dla logowania hasłem:

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

    Zastąp `assistant` identyfikatorem konta z polecenia, które się nie powiodło, albo pomiń `--account` dla konta domyślnego.

  </Accordion>

  <Accordion title="Device hygiene">
    Stare urządzenia zarządzane przez OpenClaw mogą się kumulować. Wyświetl i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE używa oficjalnej ścieżki kryptograficznej Rust `matrix-js-sdk` z `fake-indexeddb` jako warstwą zgodności IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia pliku).

    Zaszyfrowany stan środowiska uruchomieniowego znajduje się pod `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, migawkę IDB, powiązania wątków oraz stan weryfikacji przy uruchamianiu. Gdy token się zmienia, ale tożsamość konta pozostaje ta sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, aby poprzedni stan pozostał widoczny.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj profil własny Matrix dla wybranego konta:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Możesz przekazać obie opcje w jednym wywołaniu. Matrix akceptuje adresy URL awatarów `mxc://` bezpośrednio; gdy przekazujesz `http://` lub `https://`, OpenClaw najpierw przesyła plik i zapisuje rozwiązany adres URL `mxc://` w `channels.matrix.avatarUrl` (albo w zastąpieniu dla konkretnego konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłania przez narzędzia wiadomości. Zachowanie kontrolują dwa niezależne przełączniki:

### Kierowanie sesji (`sessionScope`)

`dm.sessionScope` decyduje, jak pokoje DM Matrix są mapowane na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje DM z tym samym kierowanym partnerem współdzielą jedną sesję.
- `"per-room"`: każdy pokój DM Matrix otrzymuje własny klucz sesji, nawet gdy partner jest ten sam.

Jawne powiązania konwersacji zawsze mają pierwszeństwo przed `sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Wątkowanie odpowiedzi (`threadReplies`)

`threadReplies` decyduje, gdzie bot publikuje odpowiedź:

- `"off"`: odpowiedzi są najwyższego poziomu. Przychodzące wiadomości w wątkach pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiedz w wątku tylko wtedy, gdy przychodząca wiadomość już była w tym wątku.
- `"always"`: odpowiedz w wątku zakorzenionym w wiadomości wyzwalającej; od pierwszego wyzwolenia ta konwersacja jest kierowana przez pasującą sesję ograniczoną do wątku.

`dm.threadReplies` zastępuje to tylko dla DM — na przykład pozwala izolować wątki pokojów, jednocześnie utrzymując DM bez wątków.

### Dziedziczenie wątków i polecenia ukośnikowe

- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki narzędziem wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celują w ten sam pokój (lub ten sam docelowy użytkownik DM), chyba że podano jawny `threadId`.
- Ponowne użycie docelowego użytkownika DM włącza się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego partnera DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routingu ograniczonego do użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach Matrix i DM-ach.
- Najwyższego poziomu `/focus` tworzy nowy wątek Matrix i wiąże go z docelową sesją, gdy `threadBindings.spawnSubagentSessions: true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek w miejscu.

Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji, publikuje w tym pokoju jednorazowe `m.notice` wskazujące awaryjne wyjście `/focus` i sugerujące zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy powiązania wątków są włączone.

## Powiązania konwersacji ACP

Pokoje Matrix, DM-y i istniejące wątki Matrix można przekształcić w trwałe obszary robocze ACP bez zmieniania powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM-a Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W DM-ie lub pokoju Matrix najwyższego poziomu bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże ten bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnAcpSessions` jest wymagane tylko dla `/acp spawn --thread auto|here`, gdy OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings`, a także obsługuje nadpisania dla poszczególnych kanałów:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flagi tworzenia powiązanego z wątkiem w Matrix są opcjonalnie włączane:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby pozwolić najwyższego poziomu `/focus` tworzyć i wiązać nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby pozwolić `/acp spawn --thread auto|here` wiązać sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje reakcje wychodzące, przychodzące powiadomienia o reakcjach i reakcje potwierdzenia.

Narzędzia reakcji wychodzących są kontrolowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota dla tego zdarzenia.
- `remove: true` usuwa tylko wskazaną reakcję emoji bota.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie              | Kolejność                                                                        |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | dla konta → kanał → `messages.ackReaction` → awaryjna reakcja emoji z tożsamości agenta |
| `ackReactionScope`      | dla konta → kanał → `messages.ackReactionScope` → domyślne `"group-mentions"`    |
| `reactionNotifications` | dla konta → kanał → domyślne `"own"`                                             |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy dotyczą wiadomości Matrix utworzonych przez bota; `"off"` wyłącza systemowe zdarzenia reakcji. Usunięcia reakcji nie są syntetyzowane jako zdarzenia systemowe, ponieważ Matrix przedstawia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju Matrix wyzwala agenta. W razie braku ustawienia używa `messages.groupChat.historyLimit`; jeśli oba są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM-y nadal używają normalnej historii sesji.
- Historia pokoju Matrix jest tylko oczekująca: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie wykonuje migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby tego samego zdarzenia Matrix używają oryginalnej migawki historii zamiast przesuwać się do nowszych wiadomości w pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Dodatkowy kontekst jest zachowywany tak, jak został odebrany.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność dodatkowego kontekstu, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwalania nadal pochodzi z `groupPolicy`, `groups`, `groupAllowFrom` oraz ustawień polityki DM.

## Polityka DM i pokoju

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

Aby całkowicie wyciszyć DM-y, zachowując działanie pokojów, ustaw `dm.enabled: false`:

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

Zobacz [Grupy](/pl/channels/groups), aby poznać zachowanie bramkowania wzmiankami i listy dozwolonych.

Przykład parowania dla DM-ów Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może wysłać odpowiedź przypominającą po krótkim czasie odnowienia zamiast tworzyć nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ przechowywania.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich rozjedzie się z synchronizacją, OpenClaw może skończyć z nieaktualnymi mapowaniami `m.direct`, które wskazują stare pokoje jednoosobowe zamiast aktywnego DM-a. Sprawdź bieżące mapowanie dla partnera:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Oba polecenia akceptują `--account <id>` dla konfiguracji wielokontowych. Przepływ naprawy:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- w razie potrzeby używa dowolnego aktualnie dołączonego ścisłego DM-a 1:1 z tym użytkownikiem
- tworzy świeży pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje żaden zdrowy DM

Nie usuwa automatycznie starych pokojów. Wybiera zdrowy DM i aktualizuje mapowanie, aby przyszłe wysyłki Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości bezpośrednich trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń. Skonfiguruj w `channels.matrix.execApprovals` (lub `channels.matrix.accounts.<account>.execApprovals` dla nadpisania na konto):

- `enabled`: dostarcza zatwierdzenia przez natywne monity Matrix. Gdy nieustawione lub `"auto"`, Matrix automatycznie włącza się, gdy da się rozwiązać co najmniej jednego zatwierdzającego. Ustaw `false`, aby jawnie wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnione do zatwierdzania żądań exec. Opcjonalne — w razie braku używa `channels.matrix.dm.allowFrom`.
- `target`: miejsce wysyłania monitów. `"dm"` (domyślnie) wysyła do DM-ów zatwierdzających; `"channel"` wysyła do źródłowego pokoju Matrix lub DM-a; `"both"` wysyła do obu.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych określające, którzy agenci/sesje wyzwalają dostarczenie przez Matrix.

Autoryzacja różni się nieznacznie między rodzajami zatwierdzeń:

- **Zatwierdzenia exec** używają `execApprovals.approvers`, z przejściem awaryjnym do `dm.allowFrom`.
- **Zatwierdzenia Plugin** autoryzują wyłącznie przez `dm.allowFrom`.

Oba rodzaje współdzielą skróty reakcji Matrix i aktualizacje wiadomości. Zatwierdzający widzą skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` pozwól raz
- `❌` odmów
- `♾️` pozwól zawsze (gdy efektywna polityka exec na to pozwala)

Awaryjne polecenia slash: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozpoznani zatwierdzający mogą zatwierdzać lub odmawiać. Dostarczanie kanałem dla zatwierdzeń exec obejmuje tekst polecenia — włączaj `channel` lub `both` tylko w zaufanych pokojach.

Powiązane: [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Polecenia slash

Polecenia slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w DM-ach. W pokojach OpenClaw rozpoznaje także polecenia poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` wyzwala ścieżkę polecenia bez niestandardowego wyrażenia regularnego wzmianki. Dzięki temu bot pozostaje responsywny na posty w stylu pokojowym `@mention /command`, które Element i podobni klienci emitują, gdy użytkownik uzupełni tabulatorem bota przed wpisaniem polecenia.

Reguły autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać te same polityki listy dozwolonych/właściciela dla DM-ów lub pokojów co zwykłe wiadomości.

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
- Jeśli masz wiele kont, a jedno dosłownie nazywa się `default`, OpenClaw używa go niejawnie, nawet gdy `defaultAccount` jest nieustawione.
- Jeśli masz wiele nazwanych kont i nie wybrano konta domyślnego, polecenia CLI odmawiają zgadywania — ustaw `defaultAccount` albo przekaż `--account <id>`.
- Blok najwyższego poziomu `channels.matrix.*` jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego uwierzytelnianie jest kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta pozostają wykrywalne przez `homeserver` + `userId`, gdy buforowane dane uwierzytelniające pokrywają auth.

**Promocja:**

- Gdy OpenClaw promuje konfigurację jednokontową do wielokontowej podczas naprawy lub konfiguracji, zachowuje istniejące nazwane konto, jeśli istnieje, albo jeśli `defaultAccount` już wskazuje jedno. Tylko klucze auth/bootstrap Matrix są przenoszone do promowanego konta; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz je dla danego konta.

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

Ta opcja zgody pozwala tylko na zaufane cele prywatne/wewnętrzne. Publiczne homeservery bez szyfrowania, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. W miarę możliwości preferuj `https://`.

## Proxy dla ruchu Matrix

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

Nazwane konta mogą nadpisać domyślne ustawienie najwyższego poziomu za pomocą `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w czasie działania oraz sond stanu konta.

## Rozpoznawanie celów

Matrix akceptuje te formy celów wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Identyfikatory pokojów Matrix rozróżniają wielkość liter. Używaj dokładnej wielkości liter identyfikatora pokoju z Matrix
podczas konfigurowania jawnych celów dostarczania, zadań cron, powiązań lub list dozwolonych.
OpenClaw utrzymuje wewnętrzne klucze sesji w postaci kanonicznej na potrzeby przechowywania, więc te klucze pisane małymi literami
nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie w katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokojów akceptują bezpośrednio jawne identyfikatory pokojów i aliasy, a następnie przechodzą do wyszukiwania nazw dołączonych pokojów dla tego konta.
- Wyszukiwanie po nazwie dołączonego pokoju działa na zasadzie best-effort. Jeśli nazwy pokoju nie można rozpoznać do identyfikatora lub aliasu, jest ignorowana podczas rozpoznawania listy dozwolonych w czasie działania.

## Odniesienie konfiguracji

Pola w stylu listy dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akceptują pełne identyfikatory użytkowników Matrix (najbezpieczniej). Dokładne dopasowania katalogowe są rozpoznawane przy uruchomieniu i za każdym razem, gdy lista dozwolonych zmienia się podczas działania monitora; wpisy, których nie można rozpoznać, są ignorowane w czasie działania. Listy dozwolonych pokojów preferują identyfikatory pokojów lub aliasy z tego samego powodu.

### Konto i połączenie

- `enabled`: włącz lub wyłącz kanał.
- `name`: opcjonalna etykieta wyświetlana dla konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane nadpisania dla poszczególnych kont. Wartości najwyższego poziomu `channels.matrix` są dziedziczone jako domyślne.
- `homeserver`: adres URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: pozwól temu kontu łączyć się z `localhost`, adresami IP LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny adres URL proxy HTTP(S) dla ruchu Matrix. Obsługiwane nadpisanie dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenie. Obsługiwane są wartości jawnego tekstu i SecretRef w dostawcach env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło dla logowania opartego na haśle. Obsługiwane są wartości jawnego tekstu i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: wyświetlana nazwa urządzenia używana podczas logowania hasłem.
- `avatarUrl`: zapisany adres URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchomieniu.

### Szyfrowanie

- `encryption`: włącz E2EE. Domyślnie: `false`.
- `startupVerification`: `"if-unverified"` (domyślnie, gdy E2EE jest włączone) lub `"off"`. Automatycznie żąda samoweryfikacji przy uruchomieniu, gdy to urządzenie jest niezweryfikowane.
- `startupVerificationCooldownHours`: okres karencji przed następnym automatycznym żądaniem przy uruchomieniu. Domyślnie: `24`.

### Dostęp i polityka

- `groupPolicy`: `"open"`, `"allowlist"` lub `"disabled"`. Domyślnie: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w pokoju.
- `dm.enabled`: gdy `false`, ignoruj wszystkie wiadomości bezpośrednie. Domyślnie: `true`.
- `dm.policy`: `"pairing"` (domyślnie), `"allowlist"`, `"open"` lub `"disabled"`. Stosowane po dołączeniu bota i sklasyfikowaniu pokoju jako wiadomości bezpośredniej; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w wiadomościach bezpośrednich.
- `dm.sessionScope`: `"per-user"` (domyślnie) lub `"per-room"`.
- `dm.threadReplies`: nadpisanie tylko dla wiadomości bezpośrednich dotyczące wątkowania odpowiedzi (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuj wiadomości od innych skonfigurowanych kont botów Matrix (`true` lub `"mentions"`).
- `allowlistOnly`: gdy `true`, wymusza wszystkie aktywne polityki wiadomości bezpośrednich (z wyjątkiem `"disabled"`) oraz polityki grup `"open"` na `"allowlist"`. Nie zmienia polityk `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` lub `"off"`. Domyślnie: `"off"`. Stosuje się do każdego zaproszenia Matrix, w tym zaproszeń w stylu wiadomości bezpośrednich.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` to `"allowlist"`. Wpisy aliasów są rozpoznawane względem homeservera, a nie względem stanu deklarowanego przez zapraszający pokój.
- `contextVisibility`: dodatkowa widoczność kontekstu (domyślnie `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Zachowanie odpowiedzi

- `replyToMode`: `"off"`, `"first"`, `"all"` lub `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` lub `"always"`.
- `threadBindings`: nadpisania dla poszczególnych kanałów dotyczące routingu sesji powiązanych z wątkiem i cyklu życia.
- `streaming`: `"off"` (domyślnie), `"partial"`, `"quiet"` lub forma obiektu `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: gdy `true`, ukończone bloki asystenta są zachowywane jako oddzielne komunikaty postępu.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg poprzedzający odpowiedzi wychodzące.
- `textChunkLimit`: rozmiar fragmentu wychodzącego w znakach, gdy `chunkMode: "length"`. Domyślnie: `4000`.
- `chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) lub `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju uwzględnianych jako `InboundHistory`, gdy wiadomość w pokoju wyzwala agenta. Wraca do `messages.groupChat.historyLimit`; efektywna wartość domyślna to `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania przychodzącego.

### Ustawienia reakcji

- `ackReaction`: nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: nadpisanie zakresu (`"group-mentions"` domyślnie, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (`"own"` domyślnie, `"off"`).

### Narzędzia i nadpisania dla poszczególnych pokojów

- `actions`: bramkowanie narzędzi dla poszczególnych akcji (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa polityk dla poszczególnych pokojów. Tożsamość sesji używa stabilnego identyfikatora pokoju po rozpoznaniu. (`rooms` to starszy alias.)
  - `groups.<room>.account`: ogranicz jeden dziedziczony wpis pokoju do określonego konta.
  - `groups.<room>.allowBots`: nadpisanie ustawienia na poziomie kanału dla danego pokoju (`true` lub `"mentions"`).
  - `groups.<room>.users`: lista dozwolonych nadawców dla danego pokoju.
  - `groups.<room>.tools`: nadpisania zezwalania/odmawiania narzędzi dla danego pokoju.
  - `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami dla danego pokoju. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza je z powrotem.
  - `groups.<room>.skills`: filtr Skills dla danego pokoju.
  - `groups.<room>.systemPrompt`: fragment promptu systemowego dla danego pokoju.

### Ustawienia zatwierdzania exec

- `execApprovals.enabled`: dostarczaj zatwierdzenia exec przez natywne prompty Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnione do zatwierdzania. Wraca do `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` lub `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów/sesji dla dostarczania.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
