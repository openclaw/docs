---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie szyfrowania E2EE i weryfikacji w Matrix
summary: Status obsługi Matrix, konfiguracja początkowa i przykłady konfiguracji
title: Macierz
x-i18n:
    generated_at: "2026-05-10T19:22:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix to pobieralny Plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje DM-y, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Instalacja

Zainstaluj Matrix z ClawHub przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/matrix
```

Proste specyfikacje Pluginów najpierw próbują ClawHub, a następnie fallback npm. Aby wymusić źródło rejestru, użyj `openclaw plugins install clawhub:@openclaw/matrix` albo `openclaw plugins install npm:@openclaw/matrix`.

Z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` rejestruje i włącza Plugin, więc osobny krok `openclaw plugins enable matrix` nie jest potrzebny. Plugin nadal nic nie robi, dopóki nie skonfigurujesz poniższego kanału. Zobacz [Pluginy](/pl/tools/plugin), aby poznać ogólne działanie Pluginów i reguły instalacji.

## Konfiguracja

1. Utwórz konto Matrix na swoim homeserverze.
2. Skonfiguruj `channels.matrix` za pomocą `homeserver` + `accessToken` albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie Gateway.
4. Rozpocznij DM z botem albo zaproś go do pokoju (zobacz [automatyczne dołączanie](#auto-join) - nowe zaproszenia trafiają tylko wtedy, gdy `autoJoin` na nie pozwala).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o: adres URL homeservera, metodę uwierzytelniania (token dostępu albo hasło), identyfikator użytkownika (tylko uwierzytelnianie hasłem), opcjonalną nazwę urządzenia, czy włączyć E2EE oraz czy skonfigurować dostęp do pokoi i automatyczne dołączanie.

Jeśli pasujące zmienne środowiskowe `MATRIX_*` już istnieją, a wybrane konto nie ma zapisanej autoryzacji, kreator oferuje skrót przez zmienne środowiskowe. Aby rozwiązać nazwy pokoi przed zapisaniem listy dozwolonych, uruchom `openclaw channels resolve --channel matrix "Project Room"`. Gdy E2EE jest włączone, kreator zapisuje konfigurację i uruchamia ten sam bootstrap co [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` domyślnie ma wartość `off`. Przy ustawieniu domyślnym bot nie pojawi się w nowych pokojach ani DM-ach z nowych zaproszeń, dopóki nie dołączysz ręcznie.

OpenClaw nie może w chwili zaproszenia stwierdzić, czy zaproszony pokój jest DM-em czy grupą, więc wszystkie zaproszenia - w tym zaproszenia w stylu DM - najpierw przechodzą przez `autoJoin`. `dm.policy` ma zastosowanie dopiero później, po dołączeniu bota i sklasyfikowaniu pokoju.

<Warning>
Ustaw `autoJoin: "allowlist"` oraz `autoJoinAllowlist`, aby ograniczyć zaproszenia akceptowane przez bota, albo `autoJoin: "always"`, aby akceptować każde zaproszenie.

`autoJoinAllowlist` akceptuje tylko stabilne cele: `!roomId:server`, `#alias:server` albo `*`. Zwykłe nazwy pokoi są odrzucane; wpisy aliasów są rozwiązywane względem homeservera, a nie względem stanu deklarowanego przez zaproszony pokój.
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

Listy dozwolonych dla DM-ów i pokoi najlepiej wypełniać stabilnymi identyfikatorami:

- DM-y (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): użyj `@user:server`. Nazwy wyświetlane są rozwiązywane tylko wtedy, gdy katalog homeservera zwróci dokładnie jedno dopasowanie.
- Pokoje (`groups`, `autoJoinAllowlist`): użyj `!room:server` albo `#alias:server`. Nazwy są rozwiązywane w trybie best-effort względem pokoi, do których dołączono; nierozwiązane wpisy są ignorowane w czasie działania.

### Normalizacja identyfikatora konta

Kreator konwertuje przyjazną nazwę na znormalizowany identyfikator konta. Na przykład `Ops Bot` staje się `ops-bot`. Znaki interpunkcyjne są escapowane w nazwach zmiennych środowiskowych z zakresem, aby dwa konta nie mogły kolidować: `-` → `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

### Buforowane dane uwierzytelniające

Matrix przechowuje buforowane dane uwierzytelniające w `~/.openclaw/credentials/matrix/`:

- konto domyślne: `credentials.json`
- konta nazwane: `credentials-<account>.json`

Gdy istnieją tam buforowane dane uwierzytelniające, OpenClaw traktuje Matrix jako skonfigurowany nawet wtedy, gdy token dostępu nie znajduje się w pliku konfiguracji - obejmuje to konfigurację, `openclaw doctor` oraz sondy statusu kanału.

### Zmienne środowiskowe

Używane, gdy równoważny klucz konfiguracji nie jest ustawiony. Konto domyślne używa nazw bez prefiksu; konta nazwane używają identyfikatora konta wstawionego przed sufiksem.

| Konto domyślne         | Konto nazwane (`<ID>` to znormalizowany identyfikator konta) |
| ---------------------- | ------------------------------------------------------------ |
| `MATRIX_HOMESERVER`    | `MATRIX_<ID>_HOMESERVER`                                     |
| `MATRIX_ACCESS_TOKEN`  | `MATRIX_<ID>_ACCESS_TOKEN`                                   |
| `MATRIX_USER_ID`       | `MATRIX_<ID>_USER_ID`                                        |
| `MATRIX_PASSWORD`      | `MATRIX_<ID>_PASSWORD`                                       |
| `MATRIX_DEVICE_ID`     | `MATRIX_<ID>_DEVICE_ID`                                      |
| `MATRIX_DEVICE_NAME`   | `MATRIX_<ID>_DEVICE_NAME`                                    |
| `MATRIX_RECOVERY_KEY`  | `MATRIX_<ID>_RECOVERY_KEY`                                   |

Dla konta `ops` nazwy stają się `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` i tak dalej. Zmienne środowiskowe klucza odzyskiwania są odczytywane przez przepływy CLI świadome odzyskiwania (`verify backup restore`, `verify device`, `verify bootstrap`), gdy przekazujesz klucz przez potok za pomocą `--recovery-key-stdin`.

`MATRIX_HOMESERVER` nie można ustawić z pliku `.env` workspace; zobacz [pliki `.env` workspace](/pl/gateway/security).

## Przykład konfiguracji

Praktyczna baza z parowaniem DM, listą dozwolonych pokoi i E2EE:

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

## Podglądy streamingu

Streaming odpowiedzi Matrix jest opcjonalny. `streaming` kontroluje sposób, w jaki OpenClaw dostarcza odpowiedź asystenta w trakcie tworzenia; `blockStreaming` kontroluje, czy każdy ukończony blok jest zachowywany jako osobna wiadomość Matrix.

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

| `streaming`           | Zachowanie                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (domyślne)    | Czeka na pełną odpowiedź i wysyła raz. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                  |
| `"partial"`           | Edytuje jedną zwykłą wiadomość tekstową w miejscu, gdy model zapisuje bieżący blok. Standardowe klienty Matrix mogą powiadomić przy pierwszym podglądzie, a nie przy końcowej edycji. |
| `"quiet"`             | To samo co `"partial"`, ale wiadomość jest niepowiadamiającą notatką. Odbiorcy dostają powiadomienie dopiero, gdy reguła push użytkownika dopasuje sfinalizowaną edycję (zobacz poniżej). |

`blockStreaming` jest niezależne od `streaming`:

| `streaming`             | `blockStreaming: true`                                            | `blockStreaming: false` (domyślne)                     |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `"partial"` / `"quiet"` | Szkic na żywo dla bieżącego bloku, ukończone bloki zachowane jako wiadomości | Szkic na żywo dla bieżącego bloku, finalizowany w miejscu |
| `"off"`                 | Jedna powiadamiająca wiadomość Matrix na ukończony blok           | Jedna powiadamiająca wiadomość Matrix dla pełnej odpowiedzi |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru zdarzenia Matrix, OpenClaw zatrzymuje streaming podglądu i wraca do dostarczania tylko wersji końcowej.
- Odpowiedzi z multimediami zawsze wysyłają załączniki normalnie. Jeśli przestarzały podgląd nie może już zostać bezpiecznie ponownie użyty, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi z multimediami.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy streaming podglądu Matrix jest aktywny. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu dla tekstu odpowiedzi, ale pozostawić postęp narzędzi na normalnej ścieżce dostarczania.
- Edycje podglądu kosztują dodatkowe wywołania API Matrix. Pozostaw `streaming: "off"`, jeśli chcesz najbardziej konserwatywny profil limitów szybkości.

## Metadane zatwierdzeń

Natywne prompty zatwierdzeń Matrix to zwykłe zdarzenia `m.room.message` z niestandardową treścią zdarzenia specyficzną dla OpenClaw pod `com.openclaw.approval`. Matrix zezwala na niestandardowe klucze treści zdarzeń, więc standardowe klienty nadal renderują tekstową treść, a klienty świadome OpenClaw mogą odczytać ustrukturyzowany identyfikator zatwierdzenia, rodzaj, stan, dostępne decyzje oraz szczegóły exec/Pluginu.

Gdy prompt zatwierdzenia jest zbyt długi dla jednego zdarzenia Matrix, OpenClaw dzieli widoczny tekst na fragmenty i dołącza `com.openclaw.approval` tylko do pierwszego fragmentu. Reakcje dla decyzji allow/deny są powiązane z tym pierwszym zdarzeniem, więc długie prompty zachowują ten sam cel zatwierdzenia co prompty jednozdarzeniowe.

### Reguły push self-hosted dla cichych sfinalizowanych podglądów

`streaming: "quiet"` powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury - reguła push użytkownika musi dopasować znacznik sfinalizowanego podglądu. Zobacz [reguły push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules), aby uzyskać pełną procedurę (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserverów).

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

- `allowBots: true` akceptuje wiadomości od innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i DM-ach.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy widocznie wspominają tego bota w pokojach. DM-y są nadal dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli auto-odpowiedzi.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym Gateway OpenClaw”.

Używaj ścisłych list dozwolonych pokoi i wymagań wzmianek, gdy włączasz ruch bot-do-bota we współdzielonych pokojach.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, więc podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Nieszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Konfiguracja nie jest wymagana - Plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` akceptują `--verbose` (pełna diagnostyka), `--json` (dane wyjściowe czytelne maszynowo) oraz `--account <id>` (konfiguracje z wieloma kontami). Domyślnie dane wyjściowe są zwięzłe, z wyciszonym wewnętrznym logowaniem SDK. Poniższe przykłady pokazują postać kanoniczną; dodaj flagi według potrzeb.

### Włącz szyfrowanie

```bash
openclaw matrix encryption setup
```

Inicjuje magazyn sekretów i cross-signing, w razie potrzeby tworzy kopię zapasową kluczy pokojów, a następnie wypisuje status i kolejne kroki. Przydatne flagi:

- `--recovery-key <key>` zastosuj klucz odzyskiwania przed inicjalizacją (preferuj postać ze stdin udokumentowaną poniżej)
- `--force-reset-cross-signing` odrzuć bieżącą tożsamość cross-signing i utwórz nową (używaj tylko celowo)

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

`verify status` raportuje trzy niezależne sygnały zaufania (`--verbose` pokazuje je wszystkie):

- `Locally trusted`: zaufane tylko przez tego klienta
- `Cross-signing verified`: SDK zgłasza weryfikację przez cross-signing
- `Signed by owner`: podpisane własnym kluczem self-signing (tylko diagnostycznie)

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy `Cross-signing verified` ma wartość `yes`. Samo zaufanie lokalne albo sam podpis właściciela nie wystarczają.

`--allow-degraded-local-state` zwraca diagnostykę best-effort bez wcześniejszego przygotowania konta Matrix; przydatne do sond offline lub częściowo skonfigurowanych.

### Zweryfikuj to urządzenie kluczem odzyskiwania

Klucz odzyskiwania jest poufny - przekaż go potokiem przez stdin zamiast podawać w wierszu poleceń. Ustaw `MATRIX_RECOVERY_KEY` (albo `MATRIX_<ID>_RECOVERY_KEY` dla nazwanego konta):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie raportuje trzy stany:

- `Recovery key accepted`: Matrix zaakceptował klucz dla magazynu sekretów lub zaufania urządzenia.
- `Backup usable`: kopię zapasową kluczy pokojów można załadować z użyciem zaufanego materiału odzyskiwania.
- `Device verified by owner`: to urządzenie ma pełne zaufanie tożsamości Matrix cross-signing.

Kończy działanie kodem niezerowym, gdy pełne zaufanie tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiał kopii zapasowej. W takim przypadku dokończ samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

`verify self` czeka na `Cross-signing verified: yes`, zanim zakończy się pomyślnie. Użyj `--timeout-ms <ms>`, aby dostroić czas oczekiwania.

Postać z literalnym kluczem `openclaw matrix verify device "<recovery-key>"` również jest akceptowana, ale klucz trafia do historii powłoki.

### Zainicjuj lub napraw cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` to polecenie naprawy i konfiguracji dla szyfrowanych kont. W kolejności:

- inicjuje magazyn sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjuje cross-signing i przesyła brakujące klucze publiczne
- oznacza i podpisuje cross-signing bieżące urządzenie
- tworzy po stronie serwera kopię zapasową kluczy pokojów, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga UIA do przesłania kluczy cross-signing, OpenClaw najpierw próbuje bez uwierzytelniania, następnie `m.login.dummy`, a potem `m.login.password` (wymaga `channels.matrix.password`).

Przydatne flagi:

- `--recovery-key-stdin` (połącz z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) albo `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość cross-signing (tylko celowo)

### Kopia zapasowa kluczy pokojów

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` pokazuje, czy istnieje kopia zapasowa po stronie serwera i czy to urządzenie może ją odszyfrować. `backup restore` importuje klucze pokojów z kopii zapasowej do lokalnego magazynu kryptograficznego; jeśli klucz odzyskiwania jest już na dysku, możesz pominąć `--recovery-key-stdin`.

Aby zastąpić uszkodzoną kopię zapasową świeżą bazą (akceptując utratę nieodzyskiwalnej starej historii; może też odtworzyć magazyn sekretów, jeśli bieżący sekret kopii zapasowej nie daje się załadować):

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

Wysyła żądanie weryfikacji z tego konta OpenClaw. `--own-user` żąda samoweryfikacji (akceptujesz monit w innym kliencie Matrix tego samego użytkownika); `--user-id`/`--device-id`/`--room-id` wskazują inną osobę. `--own-user` nie można łączyć z innymi flagami wskazywania celu.

Do niższopoziomowej obsługi cyklu życia - zwykle podczas śledzenia żądań przychodzących z innego klienta - te polecenia działają na konkretnym żądaniu `<id>` (wypisywanym przez `verify list` i `verify request`):

| Polecenie                                  | Cel                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Zaakceptuj żądanie przychodzące                                     |
| `openclaw matrix verify start <id>`        | Uruchom przepływ SAS                                                |
| `openclaw matrix verify sas <id>`          | Wypisz emoji lub liczby dziesiętne SAS                              |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdź, że SAS zgadza się z tym, co pokazuje drugi klient        |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuć SAS, gdy emoji lub liczby dziesiętne się nie zgadzają        |
| `openclaw matrix verify cancel <id>`       | Anuluj; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` akceptują też `--user-id` i `--room-id` jako wskazówki kontynuacji DM, gdy weryfikacja jest zakotwiczona w konkretnym pokoju wiadomości bezpośrednich.

### Uwagi o wielu kontach

Bez `--account <id>` polecenia CLI Matrix używają niejawnego konta domyślnego. Jeśli masz wiele nazwanych kont i nie ustawiono `channels.matrix.defaultAccount`, odmówią zgadywania i poproszą o wybór. Gdy E2EE jest wyłączone lub niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Przy `encryption: true` ustawieniem domyślnym `startupVerification` jest `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując okres wyciszenia (domyślnie 24 godziny). Dostosuj za pomocą `startupVerificationCooldownHours` albo wyłącz przez `startupVerification: "off"`.

    Uruchamianie wykonuje też zachowawczy przebieg inicjalizacji kryptografii, który ponownie używa bieżącego magazynu sekretów i tożsamości cross-signing. Jeśli stan inicjalizacji jest uszkodzony, OpenClaw próbuje kontrolowanej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga hasła UIA, uruchamianie zapisuje ostrzeżenie w logach i pozostaje niekrytyczne. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [migrację Matrix](/pl/channels/matrix-migration), aby poznać pełny przepływ uaktualnienia.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix publikuje powiadomienia cyklu życia weryfikacji w ścisłym pokoju weryfikacyjnym DM jako wiadomości `m.notice`: żądanie, gotowość (ze wskazówkami „Verify by emoji”), rozpoczęcie/zakończenie oraz szczegóły SAS (emoji/liczby dziesiętne), gdy są dostępne.

    Żądania przychodzące z innego klienta Matrix są śledzone i automatycznie akceptowane. Dla samoweryfikacji OpenClaw automatycznie uruchamia przepływ SAS i potwierdza swoją stronę, gdy weryfikacja emoji jest dostępna - nadal musisz porównać i potwierdzić „They match” w swoim kliencie Matrix.

    Powiadomienia systemowe weryfikacji nie są przekazywane do potoku czatu agenta.

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

    Dla uwierzytelniania tokenem utwórz świeży token dostępu w swoim kliencie Matrix lub interfejsie administratora, a następnie zaktualizuj OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Zastąp `assistant` identyfikatorem konta z nieudanego polecenia albo pomiń `--account` dla konta domyślnego.

  </Accordion>

  <Accordion title="Device hygiene">
    Stare urządzenia zarządzane przez OpenClaw mogą się kumulować. Wyświetl i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE używa oficjalnej ścieżki kryptografii Rust z `matrix-js-sdk` z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia pliku).

    Zaszyfrowany stan runtime znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, migawkę IDB, powiązania wątków oraz stan weryfikacji przy uruchamianiu. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, aby wcześniejszy stan pozostał widoczny.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Możesz przekazać obie opcje w jednym wywołaniu. Matrix akceptuje adresy URL awatarów `mxc://` bezpośrednio; gdy przekażesz `http://` albo `https://`, OpenClaw najpierw przesyła plik, a następnie zapisuje rozwiązany adres URL `mxc://` w `channels.matrix.avatarUrl` (albo w nadpisaniu dla konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla odpowiedzi automatycznych, jak i wysyłek narzędzia wiadomości. Zachowanie kontrolują dwa niezależne pokrętła:

### Routing sesji (`sessionScope`)

`dm.sessionScope` decyduje, jak pokoje DM Matrix mapują się na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje DM z tym samym routowanym uczestnikiem współdzielą jedną sesję.
- `"per-room"`: każdy pokój DM Matrix otrzymuje własny klucz sesji, nawet gdy uczestnik jest ten sam.

Jawne powiązania konwersacji zawsze mają pierwszeństwo przed `sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Wątki odpowiedzi (`threadReplies`)

`threadReplies` decyduje, gdzie bot publikuje odpowiedź:

- `"off"`: odpowiedzi są na najwyższym poziomie. Przychodzące wiadomości w wątkach pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiadaj wewnątrz wątku tylko wtedy, gdy wiadomość przychodząca już była w tym wątku.
- `"always"`: odpowiadaj wewnątrz wątku zakorzenionego w wiadomości wyzwalającej; ta konwersacja jest routowana przez pasującą sesję o zakresie wątku od pierwszego wyzwolenia.

`dm.threadReplies` nadpisuje to tylko dla DM - na przykład pozwala zachować izolację wątków pokojów, pozostawiając DM płaskie.

### Dziedziczenie wątków i polecenia z ukośnikiem

- Przychodzące wiadomości w wątkach zawierają główną wiadomość wątku jako dodatkowy kontekst agenta.
- Wysyłki przez narzędzie wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celem jest ten sam pokój (albo ten sam użytkownik docelowy DM), chyba że podano jawne `threadId`.
- Ponowne użycie użytkownika docelowego DM włącza się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego rozmówcę DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do zwykłego routingu w zakresie użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach Matrix i DM.
- Najwyższego poziomu `/focus` tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSessions` jest włączone.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek w miejscu.

Gdy OpenClaw wykryje pokój DM Matrix kolidujący z innym pokojem DM w tej samej współdzielonej sesji, publikuje jednorazowe `m.notice` w tym pokoju, wskazujące awaryjne wyjście `/focus` i sugerujące zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy powiązania wątków są włączone.

## Powiązania konwersacji ACP

Pokoje Matrix, DM oraz istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmieniania powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W DM lub pokoju Matrix najwyższego poziomu bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże ten bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnSessions` bramkuje `/acp spawn --thread auto|here`, gdzie OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings` i obsługuje też nadpisania dla poszczególnych kanałów:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Tworzenie sesji Matrix powiązanych z wątkiem jest domyślnie włączone:

- Ustaw `threadBindings.spawnSessions: false`, aby zablokować najwyższego poziomu `/focus` i `/acp spawn --thread auto|here` przed tworzeniem/powiązywaniem wątków Matrix.
- Ustaw `threadBindings.defaultSpawnContext: "isolated"`, gdy natywne tworzenie wątków podagentów nie powinno forkować transkryptu nadrzędnego.

## Reakcje

Matrix obsługuje reakcje wychodzące, powiadomienia o reakcjach przychodzących oraz reakcje potwierdzające.

Narzędzia reakcji wychodzących są bramkowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota dla tego zdarzenia.
- `remove: true` usuwa z bota tylko wskazaną reakcję emoji.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie              | Kolejność                                                                        |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | konto → kanał → `messages.ackReaction` → awaryjnie emoji tożsamości agenta       |
| `ackReactionScope`      | konto → kanał → `messages.ackReactionScope` → domyślnie `"group-mentions"`       |
| `reactionNotifications` | konto → kanał → domyślnie `"own"`                                                |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy są skierowane do wiadomości Matrix napisanych przez bota; `"off"` wyłącza zdarzenia systemowe reakcji. Usunięcia reakcji nie są syntetyzowane w zdarzenia systemowe, ponieważ Matrix udostępnia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju Matrix wyzwala agenta. Wartość awaryjna to `messages.groupChat.historyLimit`; jeśli obie są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoi Matrix dotyczy tylko pokoi. DM nadal używają zwykłej historii sesji.
- Historia pokoi Matrix obejmuje tylko oczekujące wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie wykonuje migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby tego samego zdarzenia Matrix używają pierwotnej migawki historii zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolkę `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, główne wiadomości wątków i oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Dodatkowy kontekst jest zachowywany tak, jak go odebrano.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność dodatkowego kontekstu, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwalania nadal pochodzi z `groupPolicy`, `groups`, `groupAllowFrom` i ustawień polityki DM.

## Polityka DM i pokoi

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

Aby całkowicie wyciszyć DM, zachowując działanie pokoi, ustaw `dm.enabled: false`:

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

Jeśli niezatwierdzony użytkownik Matrix wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może wysłać odpowiedź z przypomnieniem po krótkim czasie odnowienia zamiast tworzyć nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ pamięci masowej.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich rozjedzie się z synchronizacją, OpenClaw może skończyć z nieaktualnymi mapowaniami `m.direct`, które wskazują stare pokoje jednoosobowe zamiast aktywnego DM. Sprawdź bieżące mapowanie dla rozmówcy:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Oba polecenia akceptują `--account <id>` dla konfiguracji z wieloma kontami. Przepływ naprawy:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- awaryjnie używa dowolnego aktualnie dołączonego ścisłego DM 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje zdrowy DM

Nie usuwa automatycznie starych pokoi. Wybiera zdrowy DM i aktualizuje mapowanie, aby przyszłe wysyłki Matrix, powiadomienia weryfikacyjne oraz inne przepływy wiadomości bezpośrednich trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń. Skonfiguruj w `channels.matrix.execApprovals` (lub `channels.matrix.accounts.<account>.execApprovals` dla nadpisania na poziomie konta):

- `enabled`: dostarcza zatwierdzenia przez natywne monity Matrix. Gdy jest nieustawione lub ma wartość `"auto"`, Matrix włącza się automatycznie, gdy można rozpoznać co najmniej jednego zatwierdzającego. Ustaw `false`, aby jawnie wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnione do zatwierdzania żądań exec. Opcjonalne - awaryjnie używa `channels.matrix.dm.allowFrom`.
- `target`: miejsce wysyłania monitów. `"dm"` (domyślnie) wysyła do DM zatwierdzających; `"channel"` wysyła do źródłowego pokoju Matrix lub DM; `"both"` wysyła do obu.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych określające, którzy agenci/sesje wyzwalają dostarczanie przez Matrix.

Autoryzacja różni się nieznacznie między rodzajami zatwierdzeń:

- **Zatwierdzenia exec** używają `execApprovals.approvers`, z awaryjnym użyciem `dm.allowFrom`.
- **Zatwierdzenia Plugin** autoryzują wyłącznie przez `dm.allowFrom`.

Oba rodzaje współdzielą skróty reakcji Matrix i aktualizacje wiadomości. Zatwierdzający widzą skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` zezwól raz
- `❌` odmów
- `♾️` zezwalaj zawsze (gdy efektywna polityka exec na to pozwala)

Awaryjne polecenia ukośnikowe: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozpoznani zatwierdzający mogą zatwierdzić lub odmówić. Dostarczanie kanałem dla zatwierdzeń exec obejmuje tekst polecenia - włączaj `channel` lub `both` tylko w zaufanych pokojach.

Powiązane: [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Polecenia ukośnikowe

Polecenia ukośnikowe (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w DM. W pokojach OpenClaw rozpoznaje również polecenia poprzedzone własną wzmianką bota Matrix, więc `@bot:server /new` wyzwala ścieżkę polecenia bez niestandardowego wyrażenia regularnego wzmianki. Dzięki temu bot reaguje na posty w stylu pokoju `@mention /command`, które Element i podobne klienty emitują, gdy użytkownik uzupełni bota tabulatorem przed wpisaniem polecenia.

Reguły autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać te same polityki listy dozwolonych/właściciela DM lub pokoju co zwykłe wiadomości.

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
- Ogranicz odziedziczony wpis pokoju do określonego konta za pomocą `groups.<room>.account`. Wpisy bez `account` są współdzielone między kontami; `account: "default"` nadal działa, gdy konto domyślne jest skonfigurowane na najwyższym poziomie.

**Wybór konta domyślnego:**

- Ustaw `defaultAccount`, aby wybrać nazwane konto preferowane przez routing niejawny, sondowanie i polecenia CLI.
- Jeśli masz wiele kont i jedno dosłownie nazywa się `default`, OpenClaw używa go niejawnie nawet wtedy, gdy `defaultAccount` nie jest ustawione.
- Jeśli masz wiele nazwanych kont i nie wybrano domyślnego, polecenia CLI odmawiają zgadywania - ustaw `defaultAccount` albo przekaż `--account <id>`.
- Blok najwyższego poziomu `channels.matrix.*` jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego uwierzytelnianie jest kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta pozostają wykrywalne na podstawie `homeserver` + `userId`, gdy buforowane poświadczenia obejmują uwierzytelnianie.

**Promocja:**

- Gdy OpenClaw promuje konfigurację jednokontową do wielokontowej podczas naprawy lub konfiguracji początkowej, zachowuje istniejące nazwane konto, jeśli takie istnieje, albo gdy `defaultAccount` już wskazuje na jedno. Do promowanego konta przenoszone są tylko klucze uwierzytelniania/uruchamiania Matrix; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.

Zobacz [Dokumentację konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix dla ochrony przed SSRF, chyba że
jawnie wyrazisz zgodę dla danego konta.

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

Ta opcja opt-in zezwala tylko na zaufane cele prywatne/wewnętrzne. Publiczne serwery domowe bez szyfrowania, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. Gdy to możliwe, preferuj `https://`.

## Proxy dla ruchu Matrix

Jeśli wdrożenie Matrix wymaga jawnego wychodzącego proxy HTTP(S), ustaw `channels.matrix.proxy`:

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
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w czasie działania oraz prób statusu konta.

## Rozpoznawanie celu

Matrix akceptuje te formy celu wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Identyfikatory pokojów Matrix rozróżniają wielkość liter. Podczas konfigurowania jawnych celów dostarczania, zadań cron, powiązań lub list dozwolonych używaj dokładnej wielkości liter identyfikatora pokoju z Matrix.
OpenClaw przechowuje wewnętrzne klucze sesji w postaci kanonicznej, więc te klucze zapisane małymi literami nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie w katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym serwerze domowym.
- Wyszukiwania pokojów akceptują bezpośrednio jawne identyfikatory pokojów i aliasy, a następnie przechodzą do wyszukiwania nazw pokojów dołączonych dla tego konta.
- Wyszukiwanie nazw dołączonych pokojów działa na zasadzie najlepszej próby. Jeśli nazwy pokoju nie można rozpoznać na identyfikator lub alias, jest ona ignorowana przez rozpoznawanie listy dozwolonych w czasie działania.

## Dokumentacja konfiguracji

Pola w stylu listy dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akceptują pełne identyfikatory użytkowników Matrix (najbezpieczniej). Dokładne dopasowania katalogowe są rozpoznawane podczas uruchamiania oraz za każdym razem, gdy lista dozwolonych zmieni się podczas działania monitora; wpisy, których nie można rozpoznać, są ignorowane w czasie działania. Listy dozwolonych pokojów preferują identyfikatory pokojów lub aliasy z tego samego powodu.

### Konto i połączenie

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta wyświetlana dla konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane nadpisania dla poszczególnych kont. Wartości najwyższego poziomu `channels.matrix` są dziedziczone jako domyślne.
- `homeserver`: adres URL serwera domowego, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwala temu kontu na łączenie się z `localhost`, adresami IP LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny adres URL proxy HTTP(S) dla ruchu Matrix. Obsługiwane jest nadpisanie dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenach. Obsługiwane są wartości tekstowe i SecretRef w dostawcach env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło dla logowania opartego na haśle. Obsługiwane są wartości tekstowe i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: wyświetlana nazwa urządzenia używana podczas logowania hasłem.
- `avatarUrl`: zapisany adres URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji startowej.

### Szyfrowanie

- `encryption`: włącza E2EE. Domyślnie: `false`.
- `startupVerification`: `"if-unverified"` (domyślnie, gdy E2EE jest włączone) lub `"off"`. Automatycznie żąda samoweryfikacji przy uruchomieniu, gdy to urządzenie jest niezweryfikowane.
- `startupVerificationCooldownHours`: czas odczekania przed następnym automatycznym żądaniem przy uruchomieniu. Domyślnie: `24`.

### Dostęp i zasady

- `groupPolicy`: `"open"`, `"allowlist"` lub `"disabled"`. Domyślnie: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w pokojach.
- `dm.enabled`: gdy `false`, ignoruje wszystkie wiadomości bezpośrednie. Domyślnie: `true`.
- `dm.policy`: `"pairing"` (domyślnie), `"allowlist"`, `"open"` lub `"disabled"`. Stosowane po tym, jak bot dołączył i sklasyfikował pokój jako wiadomość bezpośrednią; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu wiadomości bezpośrednich.
- `dm.sessionScope`: `"per-user"` (domyślnie) lub `"per-room"`.
- `dm.threadReplies`: nadpisanie tylko dla wiadomości bezpośrednich dotyczące wątkowania odpowiedzi (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuje wiadomości od innych skonfigurowanych kont botów Matrix (`true` lub `"mentions"`).
- `allowlistOnly`: gdy `true`, wymusza zmianę wszystkich aktywnych zasad wiadomości bezpośrednich (oprócz `"disabled"`) oraz zasad grupowych `"open"` na `"allowlist"`. Nie zmienia zasad `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` lub `"off"`. Domyślnie: `"off"`. Stosowane do każdego zaproszenia Matrix, w tym zaproszeń w stylu wiadomości bezpośrednich.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `"allowlist"`. Wpisy aliasów są rozpoznawane względem serwera domowego, a nie względem stanu deklarowanego przez zapraszający pokój.
- `contextVisibility`: dodatkowa widoczność kontekstu (domyślnie `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Zachowanie odpowiedzi

- `replyToMode`: `"off"`, `"first"`, `"all"` lub `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` lub `"always"`.
- `threadBindings`: nadpisania dla poszczególnych kanałów dotyczące routingu sesji powiązanych z wątkiem i ich cyklu życia.
- `streaming`: `"off"` (domyślnie), `"partial"`, `"quiet"` lub forma obiektu `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: gdy `true`, ukończone bloki asystenta są zachowywane jako oddzielne komunikaty postępu.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg poprzedzający odpowiedzi wychodzące.
- `textChunkLimit`: rozmiar fragmentu wychodzącego w znakach, gdy `chunkMode: "length"`. Domyślnie: `4000`.
- `chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) lub `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju uwzględnianych jako `InboundHistory`, gdy wiadomość z pokoju uruchamia agenta. Wraca do `messages.groupChat.historyLimit`; efektywna wartość domyślna `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania przychodzącego.

### Ustawienia reakcji

- `ackReaction`: nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: nadpisanie zakresu (domyślnie `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (domyślnie `"own"`, `"off"`).

### Narzędzia i nadpisania dla poszczególnych pokojów

- `actions`: bramkowanie narzędzi dla poszczególnych akcji (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa zasad dla poszczególnych pokojów. Tożsamość sesji używa stabilnego identyfikatora pokoju po rozpoznaniu. (`rooms` to starszy alias).
  - `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do określonego konta.
  - `groups.<room>.allowBots`: nadpisanie ustawienia na poziomie kanału dla poszczególnych pokojów (`true` lub `"mentions"`).
  - `groups.<room>.users`: lista dozwolonych nadawców dla poszczególnych pokojów.
  - `groups.<room>.tools`: nadpisania dozwalania/odmawiania narzędzi dla poszczególnych pokojów.
  - `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami dla poszczególnych pokojów. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza je z powrotem.
  - `groups.<room>.skills`: filtr Skills dla poszczególnych pokojów.
  - `groups.<room>.systemPrompt`: fragment promptu systemowego dla poszczególnych pokojów.

### Ustawienia zatwierdzania exec

- `execApprovals.enabled`: dostarcza zatwierdzenia exec przez natywne prompty Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnione do zatwierdzania. Wraca do `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` lub `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów/sesji dla dostarczania.

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie wiadomości bezpośrednich i przepływ parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
