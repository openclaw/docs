---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie Matrix E2EE i weryfikacji
summary: Status obsługi macierzy, konfiguracja i przykłady konfiguracji
title: Macierz
x-i18n:
    generated_at: "2026-06-28T20:41:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
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

Same specyfikacje Pluginu najpierw próbują ClawHub, a potem zapasowo npm. Aby wymusić źródło rejestru, użyj `openclaw plugins install clawhub:@openclaw/matrix` lub `openclaw plugins install npm:@openclaw/matrix`.

Z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` rejestruje i włącza Plugin, więc osobny krok `openclaw plugins enable matrix` nie jest potrzebny. Plugin nadal nic nie robi, dopóki nie skonfigurujesz kanału poniżej. Zobacz [Pluginy](/pl/tools/plugin), aby poznać ogólne zachowanie Pluginów i reguły instalacji.

## Konfiguracja

1. Utwórz konto Matrix na swoim homeserwerze.
2. Skonfiguruj `channels.matrix` za pomocą `homeserver` + `accessToken` albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie Gateway.
4. Rozpocznij DM z botem albo zaproś go do pokoju (zobacz [automatyczne dołączanie](#auto-join) - nowe zaproszenia trafiają tylko wtedy, gdy pozwala na to `autoJoin`).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o: URL homeserwera, metodę uwierzytelniania (token dostępu lub hasło), ID użytkownika (tylko uwierzytelnianie hasłem), opcjonalną nazwę urządzenia, czy włączyć E2EE oraz czy skonfigurować dostęp do pokojów i automatyczne dołączanie.

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

`channels.matrix.autoJoin` domyślnie ma wartość `off`. Przy ustawieniu domyślnym bot nie pojawi się w nowych pokojach ani DM-ach z nowych zaproszeń, dopóki nie dołączysz ręcznie.

OpenClaw nie może stwierdzić w momencie zaproszenia, czy zaproszony pokój jest DM-em czy grupą, więc wszystkie zaproszenia - w tym zaproszenia w stylu DM - najpierw przechodzą przez `autoJoin`. `dm.policy` ma zastosowanie dopiero później, po dołączeniu bota i sklasyfikowaniu pokoju.

<Warning>
Ustaw `autoJoin: "allowlist"` oraz `autoJoinAllowlist`, aby ograniczyć zaproszenia akceptowane przez bota, albo `autoJoin: "always"`, aby akceptować każde zaproszenie.

`autoJoinAllowlist` akceptuje tylko stabilne cele: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokojów są odrzucane; wpisy aliasów są rozwiązywane względem homeserwera, a nie względem stanu deklarowanego przez zaproszony pokój.
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

Listy dozwolonych DM-ów i pokojów najlepiej wypełniać stabilnymi ID:

- DM-y (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): używaj `@user:server`. Nazwy wyświetlane są domyślnie ignorowane, ponieważ są zmienne; ustaw `dangerouslyAllowNameMatching: true` tylko wtedy, gdy wyraźnie potrzebujesz zgodności z wpisami nazw wyświetlanych.
- Klucze listy dozwolonych pokojów (`groups`, starsze `rooms`): używaj `!room:server` lub `#alias:server`. Zwykłe nazwy pokojów są domyślnie ignorowane; ustaw `dangerouslyAllowNameMatching: true` tylko wtedy, gdy wyraźnie potrzebujesz zgodności z wyszukiwaniem nazw dołączonych pokojów.
- Listy dozwolonych zaproszeń (`autoJoinAllowlist`): używaj `!room:server`, `#alias:server` lub `*`. Zwykłe nazwy pokojów są odrzucane.

### Normalizacja ID konta

Kreator konwertuje przyjazną nazwę na znormalizowane ID konta. Na przykład `Ops Bot` staje się `ops-bot`. Znaki interpunkcyjne są escapowane w zakresowanych nazwach zmiennych środowiskowych, aby dwa konta nie mogły kolidować: `-` → `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

### Buforowane dane uwierzytelniające

Matrix przechowuje buforowane dane uwierzytelniające w `~/.openclaw/credentials/matrix/`:

- konto domyślne: `credentials.json`
- konta nazwane: `credentials-<account>.json`

Gdy istnieją tam buforowane dane uwierzytelniające, OpenClaw traktuje Matrix jako skonfigurowany, nawet jeśli tokenu dostępu nie ma w pliku konfiguracji - obejmuje to konfigurację, `openclaw doctor` i sondy statusu kanału.

### Zmienne środowiskowe

Używane, gdy równoważny klucz konfiguracji nie jest ustawiony. Konto domyślne używa nazw bez prefiksu; konta nazwane używają ID konta wstawionego przed sufiksem.

| Konto domyślne        | Konto nazwane (`<ID>` to znormalizowane ID konta) |
| --------------------- | ------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                          |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                        |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                             |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                            |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                           |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                         |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                        |

Dla konta `ops` nazwy stają się `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` i tak dalej. Zmienne środowiskowe klucza odzyskiwania są odczytywane przez przepływy CLI świadome odzyskiwania (`verify backup restore`, `verify device`, `verify bootstrap`), gdy przekazujesz klucz przez `--recovery-key-stdin`.

`MATRIX_HOMESERVER` nie może być ustawiony z workspace `.env`; zobacz [pliki workspace `.env`](/pl/gateway/security).

## Przykład konfiguracji

Praktyczna baza z parowaniem DM, listą dozwolonych pokojów i E2EE:

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

Strumieniowanie odpowiedzi Matrix jest opcjonalne. `streaming` kontroluje sposób dostarczania przez OpenClaw odpowiedzi asystenta w toku; `blockStreaming` kontroluje, czy każdy ukończony blok jest zachowywany jako osobna wiadomość Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Aby zachować podglądy odpowiedzi na żywo, ale ukryć tymczasowe linie narzędzi/postępu, użyj formy obiektu:

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

| `streaming`          | Zachowanie                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (domyślnie)  | Czeka na pełną odpowiedź, wysyła raz. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                |
| `"partial"`          | Edytuje jedną zwykłą wiadomość tekstową w miejscu, gdy model zapisuje bieżący blok. Standardowi klienci Matrix mogą powiadomić przy pierwszym podglądzie, nie przy finalnej edycji. |
| `"quiet"`            | Tak samo jak `"partial"`, ale wiadomość jest niepowiadamiającą notatką. Odbiorcy dostają powiadomienie dopiero wtedy, gdy reguła push danego użytkownika dopasuje sfinalizowaną edycję (zobacz poniżej). |

`blockStreaming` jest niezależne od `streaming`:

| `streaming`             | `blockStreaming: true`                                           | `blockStreaming: false` (domyślnie)                 |
| ----------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| `"partial"` / `"quiet"` | Szkic na żywo dla bieżącego bloku, ukończone bloki zachowane jako wiadomości | Szkic na żywo dla bieżącego bloku, finalizowany w miejscu |
| `"off"`                 | Jedna powiadamiająca wiadomość Matrix na ukończony blok          | Jedna powiadamiająca wiadomość Matrix dla pełnej odpowiedzi |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru pojedynczego zdarzenia Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do dostarczania tylko wersji finalnej.
- Odpowiedzi multimedialne zawsze wysyłają załączniki normalnie. Jeśli przestarzały podgląd nie może już zostać bezpiecznie użyty ponownie, OpenClaw redaguje go przed wysłaniem finalnej odpowiedzi multimedialnej.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy strumieniowanie podglądu Matrix jest aktywne. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu dla tekstu odpowiedzi, ale pozostawić postęp narzędzi na normalnej ścieżce dostarczania.
- Edycje podglądu kosztują dodatkowe wywołania API Matrix. Pozostaw `streaming: "off"`, jeśli chcesz najbardziej konserwatywny profil limitów szybkości.

## Wiadomości głosowe

Przychodzące notatki głosowe Matrix są transkrybowane przed bramką wzmianki pokoju. Dzięki temu notatka głosowa, która wypowiada nazwę bota, może uruchomić agenta w pokoju `requireMention: true`, a agent otrzymuje transkrypcję zamiast samego symbolu zastępczego załącznika audio.

Matrix używa współdzielonego dostawcy multimediów audio skonfigurowanego w `tools.media.audio`, takiego jak OpenAI `gpt-4o-mini-transcribe`. Zobacz [omówienie narzędzi multimedialnych](/pl/tools/media-overview), aby poznać konfigurację dostawcy i limity.

Szczegóły zachowania:

- Zdarzenia `m.audio` i zdarzenia `m.file` z typem MIME `audio/*` kwalifikują się.
- W zaszyfrowanych pokojach OpenClaw odszyfrowuje załącznik przez istniejącą ścieżkę multimediów Matrix przed transkrypcją.
- Transkrypcja jest oznaczona w prompcie agenta jako wygenerowana maszynowo i niezaufana.
- Załącznik jest oznaczony jako już transkrybowany, aby dalsze narzędzia multimedialne nie transkrybowały ponownie tej samej notatki głosowej.
- Ustaw `tools.media.audio.enabled: false`, aby globalnie wyłączyć transkrypcję audio.

## Metadane zatwierdzeń

Natywne prompty zatwierdzeń Matrix są zwykłymi zdarzeniami `m.room.message` z niestandardową zawartością zdarzenia specyficzną dla OpenClaw w `com.openclaw.approval`. Matrix zezwala na niestandardowe klucze zawartości zdarzeń, więc standardowi klienci nadal renderują tekstową treść, a klienci świadomi OpenClaw mogą odczytać strukturalne ID zatwierdzenia, rodzaj, stan, dostępne decyzje oraz szczegóły exec/Plugin.

Gdy prompt zatwierdzenia jest zbyt długi dla jednego zdarzenia Matrix, OpenClaw dzieli widoczny tekst na fragmenty i dołącza `com.openclaw.approval` tylko do pierwszego fragmentu. Reakcje dla decyzji zezwól/odmów są powiązane z tym pierwszym zdarzeniem, więc długie prompty zachowują ten sam cel zatwierdzenia co prompty jednozdarzeniowe.

### Samodzielnie hostowane reguły push dla cichych sfinalizowanych podglądów

`streaming: "quiet"` powiadamia odbiorców dopiero wtedy, gdy blok lub tura zostanie sfinalizowana - reguła push danego użytkownika musi dopasować marker sfinalizowanego podglądu. Zobacz [reguły push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules), aby poznać pełny przepis (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserwerów).

## Pokoje bot-bot

Domyślnie wiadomości Matrix od innych skonfigurowanych kont OpenClaw Matrix są ignorowane.

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
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach widocznie wspominają tego bota. DM-y nadal są dozwolone.
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- Zaakceptowane wiadomości skonfigurowanych botów używają wspólnej [ochrony przed pętlą botów](/pl/channels/bot-loop-protection). Skonfiguruj `channels.defaults.botLoopProtection`, a następnie zastąp ją przez `channels.matrix.botLoopProtection` albo `channels.matrix.groups.<room>.botLoopProtection`, gdy jeden pokój wymaga innego budżetu.
- OpenClaw nadal ignoruje wiadomości z tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiedzi do samego siebie.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym Gateway OpenClaw”.

Używaj ścisłych list dozwolonych pokojów i wymagań dotyczących wzmianek, gdy włączasz ruch między botami we współdzielonych pokojach.

## Szyfrowanie i weryfikacja

W szyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Nieszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Konfiguracja nie jest potrzebna - plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` akceptują `--verbose` (pełna diagnostyka), `--json` (dane wyjściowe czytelne maszynowo) oraz `--account <id>` (konfiguracje z wieloma kontami). Domyślnie dane wyjściowe są zwięzłe, z cichym wewnętrznym logowaniem SDK. Poniższe przykłady pokazują postać kanoniczną; dodawaj flagi według potrzeb.

### Włącz szyfrowanie

```bash
openclaw matrix encryption setup
```

Inicjuje magazyn sekretów i podpisywanie krzyżowe, w razie potrzeby tworzy kopię zapasową kluczy pokojów, a następnie wypisuje status i kolejne kroki. Przydatne flagi:

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

`verify status` zgłasza trzy niezależne sygnały zaufania (`--verbose` pokazuje je wszystkie):

- `Locally trusted`: zaufany tylko przez tego klienta
- `Cross-signing verified`: SDK zgłasza weryfikację przez podpisywanie krzyżowe
- `Signed by owner`: podpisany własnym kluczem samopodpisywania (tylko diagnostycznie)

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy `Cross-signing verified` ma wartość `yes`. Samo lokalne zaufanie albo sam podpis właściciela nie wystarcza.

`--allow-degraded-local-state` zwraca diagnostykę best-effort bez wcześniejszego przygotowania konta Matrix; przydatne dla sond offline albo częściowo skonfigurowanych.

### Zweryfikuj to urządzenie kluczem odzyskiwania

Klucz odzyskiwania jest wrażliwy - przekaż go przez stdin zamiast podawać w wierszu poleceń. Ustaw `MATRIX_RECOVERY_KEY` (albo `MATRIX_<ID>_RECOVERY_KEY` dla nazwanego konta):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie zgłasza trzy stany:

- `Recovery key accepted`: Matrix zaakceptował klucz dla magazynu sekretów albo zaufania urządzenia.
- `Backup usable`: kopię zapasową kluczy pokojów można załadować przy użyciu zaufanego materiału odzyskiwania.
- `Device verified by owner`: to urządzenie ma pełne zaufanie tożsamości podpisywania krzyżowego Matrix.

Kończy działanie z niezerowym kodem, gdy pełne zaufanie tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiał kopii zapasowej. W takim przypadku dokończ samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

`verify self` czeka na `Cross-signing verified: yes`, zanim zakończy się powodzeniem. Użyj `--timeout-ms <ms>`, aby dostroić czas oczekiwania.

Forma z dosłownym kluczem `openclaw matrix verify device "<recovery-key>"` jest również akceptowana, ale klucz trafia do historii powłoki.

### Inicjalizuj lub napraw podpisywanie krzyżowe

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` to polecenie naprawy i konfiguracji dla szyfrowanych kont. W kolejności:

- inicjuje magazyn sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjuje podpisywanie krzyżowe i przesyła brakujące klucze publiczne
- oznacza i podpisuje krzyżowo bieżące urządzenie
- tworzy po stronie serwera kopię zapasową kluczy pokojów, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga UIA do przesłania kluczy podpisywania krzyżowego, OpenClaw najpierw próbuje bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`).

Przydatne flagi:

- `--recovery-key-stdin` (połącz z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) albo `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość podpisywania krzyżowego (tylko celowo; wymaga zapisania aktywnego klucza odzyskiwania albo podania go przez `--recovery-key-stdin`)

### Kopia zapasowa kluczy pokojów

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` pokazuje, czy istnieje kopia zapasowa po stronie serwera oraz czy to urządzenie może ją odszyfrować. `backup restore` importuje zapisane w kopii klucze pokojów do lokalnego magazynu kryptograficznego; jeśli klucz odzyskiwania jest już na dysku, możesz pominąć `--recovery-key-stdin`.

Aby zastąpić uszkodzoną kopię zapasową świeżą bazą (akceptując utratę nieodzyskiwalnej starej historii; może także odtworzyć magazyn sekretów, jeśli sekret bieżącej kopii zapasowej jest niemożliwy do załadowania):

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

Do obsługi cyklu życia na niższym poziomie - zwykle podczas śledzenia przychodzących żądań z innego klienta - te polecenia działają na konkretnym żądaniu `<id>` (wypisanym przez `verify list` i `verify request`):

| Polecenie                                  | Cel                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Zaakceptuj żądanie przychodzące                                     |
| `openclaw matrix verify start <id>`        | Uruchom przepływ SAS                                                |
| `openclaw matrix verify sas <id>`          | Wypisz emoji albo liczby dziesiętne SAS                             |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdź, że SAS odpowiada temu, co pokazuje drugi klient          |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuć SAS, gdy emoji albo liczby dziesiętne się nie zgadzają       |
| `openclaw matrix verify cancel <id>`       | Anuluj; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` akceptują też `--user-id` oraz `--room-id` jako wskazówki kontynuacji przez DM, gdy weryfikacja jest zakotwiczona w konkretnym pokoju wiadomości bezpośrednich.

### Uwagi dotyczące wielu kont

Bez `--account <id>` polecenia CLI Matrix używają niejawnego konta domyślnego. Jeśli masz wiele nazwanych kont i nie ustawiono `channels.matrix.defaultAccount`, odmówią zgadywania i poproszą o wybór. Gdy E2EE jest wyłączone albo niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Przy `encryption: true` domyślną wartością `startupVerification` jest `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując cooldown (domyślnie 24 godziny). Dostrój przez `startupVerificationCooldownHours` albo wyłącz przez `startupVerification: "off"`.

    Uruchamianie wykonuje też konserwatywny przebieg inicjalizacji kryptografii, który ponownie używa bieżącego magazynu sekretów i tożsamości podpisywania krzyżowego. Jeśli stan inicjalizacji jest uszkodzony, OpenClaw próbuje chronionej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga hasła UIA, uruchamianie loguje ostrzeżenie i pozostaje niekrytyczne. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [migrację Matrix](/pl/channels/matrix-migration), aby poznać pełny przepływ aktualizacji.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix publikuje powiadomienia cyklu życia weryfikacji w ścisłym pokoju weryfikacji DM jako wiadomości `m.notice`: żądanie, gotowość (z instrukcją „Weryfikuj przez emoji”), rozpoczęcie/ukończenie oraz szczegóły SAS (emoji/liczby dziesiętne), gdy są dostępne.

    Żądania przychodzące z innego klienta Matrix są śledzone i automatycznie akceptowane. W przypadku samoweryfikacji OpenClaw automatycznie uruchamia przepływ SAS i potwierdza swoją stronę, gdy weryfikacja emoji jest dostępna - nadal musisz porównać i potwierdzić „Zgadzają się” w swoim kliencie Matrix.

    Powiadomienia systemu weryfikacji nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Jeśli `verify status` mówi, że bieżące urządzenie nie jest już wymienione na homeserverze, utwórz nowe urządzenie Matrix OpenClaw. Dla logowania hasłem:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Dla uwierzytelniania tokenem utwórz świeży token dostępu w swoim kliencie Matrix albo interfejsie administratora, a następnie zaktualizuj OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Zastąp `assistant` identyfikatorem konta z nieudanego polecenia albo pomiń `--account` dla konta domyślnego.

  </Accordion>

  <Accordion title="Device hygiene">
    Stare urządzenia zarządzane przez OpenClaw mogą się gromadzić. Wyświetl je i usuń przestarzałe:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    E2EE Matrix używa oficjalnej ścieżki kryptograficznej Rust z `matrix-js-sdk` oraz `fake-indexeddb` jako shima IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia pliku).

    Zaszyfrowany stan uruchomieniowy znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, migawkę IDB, powiązania wątków oraz stan weryfikacji przy uruchamianiu. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, aby wcześniejszy stan pozostał widoczny.

    Pojedynczy starszy katalog główny token-hash może być normalną ścieżką ciągłości rotacji tokenu. Jeśli OpenClaw loguje `matrix: multiple populated token-hash storage roots detected`, sprawdź katalog konta i zarchiwizuj przestarzałe równoległe katalogi główne dopiero po potwierdzeniu, że wybrany aktywny katalog główny jest zdrowy. Preferuj przenoszenie przestarzałych katalogów głównych do katalogu `_archive/` zamiast natychmiastowego usuwania.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Możesz przekazać obie opcje w jednym wywołaniu. Matrix akceptuje adresy URL awatarów `mxc://` bezpośrednio; gdy przekażesz `http://` lub `https://`, OpenClaw najpierw przesyła plik i zapisuje rozwiązany URL `mxc://` w `channels.matrix.avatarUrl` (lub w nadpisaniu dla konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek przez narzędzie wiadomości. Zachowaniem sterują dwa niezależne przełączniki:

### Routing sesji (`sessionScope`)

`dm.sessionScope` decyduje, jak pokoje DM Matrix są mapowane na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje DM z tym samym routowanym uczestnikiem współdzielą jedną sesję.
- `"per-room"`: każdy pokój DM Matrix otrzymuje własny klucz sesji, nawet gdy uczestnik jest ten sam.

Jawne powiązania konwersacji zawsze mają pierwszeństwo przed `sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Wątki odpowiedzi (`threadReplies`)

`threadReplies` decyduje, gdzie bot publikuje odpowiedź:

- `"off"`: odpowiedzi są najwyższego poziomu. Przychodzące wiadomości w wątkach pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiadaj wewnątrz wątku tylko wtedy, gdy wiadomość przychodząca już była w tym wątku.
- `"always"`: odpowiadaj wewnątrz wątku zakorzenionego w wiadomości wyzwalającej; ta konwersacja jest routowana przez dopasowaną sesję o zakresie wątku od pierwszego wyzwolenia.

`dm.threadReplies` nadpisuje to tylko dla DM - na przykład pozwala izolować wątki pokojów, pozostawiając DM bez wątków.

### Dziedziczenie wątków i polecenia z ukośnikiem

- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki przez narzędzie wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celują w ten sam pokój (lub ten sam cel użytkownika DM), chyba że podano jawny `threadId`.
- Ponowne użycie celu użytkownika DM uruchamia się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego uczestnika DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routingu o zakresie użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach i DM Matrix.
- `/focus` najwyższego poziomu tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSessions` jest włączone.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek w miejscu.

Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji, publikuje w tym pokoju jednorazowe `m.notice` wskazujące wyjście awaryjne `/focus` i sugerujące zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy powiązania wątków są włączone.

## Powiązania konwersacji ACP

Pokoje Matrix, DM i istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmieniania powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W DM lub pokoju Matrix najwyższego poziomu bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są routowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnSessions` bramkuje `/acp spawn --thread auto|here`, gdzie OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings` i obsługuje też nadpisania dla kanału:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Tworzenie sesji powiązanych z wątkiem Matrix jest domyślnie włączone:

- Ustaw `threadBindings.spawnSessions: false`, aby zablokować tworzenie/powiązywanie wątków Matrix przez `/focus` najwyższego poziomu oraz `/acp spawn --thread auto|here`.
- Ustaw `threadBindings.defaultSpawnContext: "isolated"`, gdy natywne tworzenie wątków subagentów nie powinno forkować transkryptu nadrzędnego.

## Reakcje

Matrix obsługuje reakcje wychodzące, powiadomienia o reakcjach przychodzących i reakcje potwierdzenia.

Narzędzia reakcji wychodzących są bramkowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota w tym zdarzeniu.
- `remove: true` usuwa tylko wskazaną reakcję emoji od bota.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie              | Kolejność                                                                        |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | dla konta → kanał → `messages.ackReaction` → awaryjny emoji tożsamości agenta   |
| `ackReactionScope`      | dla konta → kanał → `messages.ackReactionScope` → domyślne `"group-mentions"` |
| `reactionNotifications` | dla konta → kanał → domyślne `"own"`                                          |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy celują w wiadomości Matrix autorstwa bota; `"off"` wyłącza zdarzenia systemu reakcji. Usunięcia reakcji nie są syntetyzowane w zdarzenia systemowe, ponieważ Matrix przedstawia je jako redakcje, a nie samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość pokoju Matrix wyzwala agenta. Wraca do `messages.groupChat.historyLimit`; jeśli oba są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM nadal używają normalnej historii sesji.
- Historia pokoju Matrix jest tylko oczekująca: OpenClaw buforuje wiadomości pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie wykonuje migawkę tego okna, gdy nadejdzie wzmianka lub inne wyzwolenie.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tego przebiegu.
- Ponowne próby tego samego zdarzenia Matrix używają pierwotnej migawki historii zamiast przesuwać się do nowszych wiadomości pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Dodatkowy kontekst jest zachowywany tak, jak został odebrany.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dopuszczonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność dodatkowego kontekstu, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwolenia nadal pochodzi z `groupPolicy`, `groups`, `groupAllowFrom` oraz ustawień zasad DM.

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

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może wysłać odpowiedź przypominającą po krótkim czasie odnowienia zamiast generować nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ przechowywania.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich utraci synchronizację, OpenClaw może skończyć z nieaktualnymi mapowaniami `m.direct`, które wskazują stare pokoje solo zamiast aktywnego DM. Sprawdź bieżące mapowanie dla uczestnika:

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

Nie usuwa automatycznie starych pokojów. Wybiera zdrowy DM i aktualizuje mapowanie, aby przyszłe wysyłki Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości bezpośrednich trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń. Skonfiguruj w `channels.matrix.execApprovals` (lub `channels.matrix.accounts.<account>.execApprovals` dla nadpisania dla konta):

- `enabled`: dostarczaj zatwierdzenia przez natywne monity Matrix. Gdy nieustawione lub `"auto"`, Matrix automatycznie włącza się, gdy można rozwiązać co najmniej jednego zatwierdzającego. Ustaw `false`, aby jawnie wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnione do zatwierdzania żądań exec. Opcjonalne - wraca do `channels.matrix.dm.allowFrom`.
- `target`: gdzie trafiają monity. `"dm"` (domyślnie) wysyła do DM zatwierdzających; `"channel"` wysyła do źródłowego pokoju Matrix lub DM; `"both"` wysyła do obu.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych określające, którzy agenci/sesje wyzwalają dostarczanie przez Matrix.

Autoryzacja różni się nieznacznie między rodzajami zatwierdzeń:

- **Zatwierdzenia exec** używają `execApprovals.approvers`, wracając do `dm.allowFrom`.
- **Zatwierdzenia Plugin** autoryzują wyłącznie przez `dm.allowFrom`.

Oba rodzaje współdzielą skróty reakcji Matrix i aktualizacje wiadomości. Zatwierdzający widzą skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` zezwól raz
- `❌` odmów
- `♾️` zezwalaj zawsze (gdy efektywna zasada exec na to pozwala)

Awaryjne polecenia z ukośnikiem: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odmawiać. Dostarczanie kanałowe dla zatwierdzeń exec zawiera tekst polecenia - włączaj `channel` lub `both` tylko w zaufanych pokojach.

Powiązane: [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Polecenia z ukośnikiem

Polecenia z ukośnikiem (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w DM. W pokojach OpenClaw rozpoznaje też polecenia poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` wyzwala ścieżkę polecenia bez niestandardowego wyrażenia regularnego wzmianki. Dzięki temu bot reaguje na wpisy w stylu pokoju `@mention /command`, które Element i podobni klienci emitują, gdy użytkownik używa dopełniania tabulatorem na bocie przed wpisaniem polecenia.

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

- Wartości najwyższego poziomu `channels.matrix` działają jako domyślne dla nazwanych kont, chyba że konto je nadpisze.
- Ogranicz dziedziczony wpis pokoju do konkretnego konta za pomocą `groups.<room>.account`. Wpisy bez `account` są współdzielone między kontami; `account: "default"` nadal działa, gdy konto domyślne jest skonfigurowane na najwyższym poziomie.

**Wybór konta domyślnego:**

- Ustaw `defaultAccount`, aby wybrać nazwane konto preferowane przez niejawne trasowanie, sondowanie i polecenia CLI.
- Jeśli masz wiele kont, a jedno dosłownie nazywa się `default`, OpenClaw używa go niejawnie nawet wtedy, gdy `defaultAccount` nie jest ustawione.
- Jeśli masz wiele nazwanych kont i nie wybrano domyślnego, polecenia CLI odmawiają zgadywania - ustaw `defaultAccount` albo przekaż `--account <id>`.
- Blok najwyższego poziomu `channels.matrix.*` jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego uwierzytelnianie jest kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta pozostają wykrywalne na podstawie `homeserver` + `userId`, gdy poświadczenia w pamięci podręcznej pokrywają uwierzytelnianie.

**Promowanie:**

- Gdy OpenClaw promuje konfigurację jednokontową do wielokontowej podczas naprawy lub konfiguracji, zachowuje istniejące nazwane konto, jeśli takie istnieje, albo gdy `defaultAccount` już na nie wskazuje. Do promowanego konta przenoszone są tylko klucze uwierzytelniania/uruchamiania Matrix; współdzielone klucze zasad dostarczania pozostają na najwyższym poziomie.

Zobacz [Informacje o konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielokontowy.

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

To jawne włączenie zezwala tylko na zaufane prywatne/wewnętrzne cele. Publiczne homeservery bez szyfrowania, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. Preferuj `https://`, gdy tylko to możliwe.

## Pośredniczenie ruchu Matrix

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
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w czasie działania i sond stanu kont.

## Rozpoznawanie celów

Matrix akceptuje te formy celów wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` albo `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` albo `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` albo `matrix:channel:#alias:server`

Identyfikatory pokojów Matrix rozróżniają wielkość liter. Używaj dokładnej wielkości liter identyfikatora pokoju z Matrix
podczas konfigurowania jawnych celów dostarczania, zadań Cron, powiązań lub list dozwolonych.
OpenClaw utrzymuje wewnętrzne klucze sesji w postaci kanonicznej na potrzeby przechowywania, więc te klucze pisane małymi literami
nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie w katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokojów akceptują bezpośrednio jawne identyfikatory pokojów i aliasy. Wyszukiwanie nazw dołączonych pokojów jest wykonywane w najlepszym możliwym zakresie i dotyczy tylko list dozwolonych pokoi w czasie działania, gdy ustawiono `dangerouslyAllowNameMatching: true`.
- Jeśli nazwy pokoju nie można rozpoznać na identyfikator albo alias, jest ignorowana podczas rozpoznawania listy dozwolonych w czasie działania.

## Informacje o konfiguracji

Pola użytkowników w stylu listy dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akceptują pełne identyfikatory użytkowników Matrix (najbezpieczniejsze). Wpisy użytkowników niebędące identyfikatorami są domyślnie ignorowane. Jeśli ustawisz `dangerouslyAllowNameMatching: true`, dokładne dopasowania nazw wyświetlanych z katalogu Matrix są rozpoznawane przy uruchamianiu i za każdym razem, gdy lista dozwolonych zmieni się podczas działania monitora; wpisy, których nie można rozpoznać, są ignorowane w czasie działania.

Klucze listy dozwolonych pokojów (`groups`, starsze `rooms`) powinny być identyfikatorami pokojów albo aliasami. Zwykłe klucze z nazwą pokoju są domyślnie ignorowane; `dangerouslyAllowNameMatching: true` przywraca wyszukiwanie w najlepszym możliwym zakresie względem nazw dołączonych pokojów.

### Konto i połączenie

- `enabled`: włącz lub wyłącz kanał.
- `name`: opcjonalna etykieta wyświetlana dla konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane nadpisania dla poszczególnych kont. Wartości najwyższego poziomu `channels.matrix` są dziedziczone jako domyślne.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwól temu kontu na łączenie się z `localhost`, adresami IP LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Obsługiwane jest nadpisanie dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenie. Obsługiwane są wartości tekstowe i SecretRef w dostawcach env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło dla logowania opartego na haśle. Obsługiwane są wartości tekstowe i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia używana podczas logowania hasłem.
- `avatarUrl`: przechowywany URL własnego awatara na potrzeby synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.

### Szyfrowanie

- `encryption`: włącz E2EE. Domyślnie: `false`.
- `startupVerification`: `"if-unverified"` (domyślnie, gdy E2EE jest włączone) albo `"off"`. Automatycznie prosi o samoweryfikację przy uruchamianiu, gdy to urządzenie jest niezweryfikowane.
- `startupVerificationCooldownHours`: czas odczekania przed następnym automatycznym żądaniem przy uruchamianiu. Domyślnie: `24`.

### Dostęp i zasady

- `groupPolicy`: `"open"`, `"allowlist"` albo `"disabled"`. Domyślnie: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu pokojów.
- `dm.enabled`: gdy `false`, ignoruje wszystkie DM. Domyślnie: `true`.
- `dm.policy`: `"pairing"` (domyślnie), `"allowlist"`, `"open"` albo `"disabled"`. Stosowane po tym, jak bot dołączy i sklasyfikuje pokój jako DM; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu DM.
- `dm.sessionScope`: `"per-user"` (domyślnie) albo `"per-room"`.
- `dm.threadReplies`: nadpisanie tylko dla DM dotyczące wątkowania odpowiedzi (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuj wiadomości z innych skonfigurowanych kont botów Matrix (`true` albo `"mentions"`).
- `allowlistOnly`: gdy `true`, wymusza wszystkie aktywne zasady DM (oprócz `"disabled"`) i zasady grupowe `"open"` na `"allowlist"`. Nie zmienia zasad `"disabled"`.
- `dangerouslyAllowNameMatching`: gdy `true`, zezwala na wyszukiwanie nazw wyświetlanych w katalogu Matrix dla wpisów listy dozwolonych użytkowników oraz wyszukiwanie nazw dołączonych pokojów dla kluczy listy dozwolonych pokojów. Preferuj pełne identyfikatory `@user:server` oraz identyfikatory pokojów albo aliasy.
- `autoJoin`: `"always"`, `"allowlist"` albo `"off"`. Domyślnie: `"off"`. Dotyczy każdego zaproszenia Matrix, w tym zaproszeń w stylu DM.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` to `"allowlist"`. Wpisy aliasów są rozpoznawane względem homeservera, a nie względem stanu deklarowanego przez zapraszający pokój.
- `contextVisibility`: dodatkowa widoczność kontekstu (domyślnie `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Zachowanie odpowiedzi

- `replyToMode`: `"off"`, `"first"`, `"all"` albo `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` albo `"always"`.
- `threadBindings`: nadpisania dla poszczególnych kanałów dotyczące trasowania i cyklu życia sesji powiązanych z wątkami.
- `streaming`: `"off"` (domyślnie), `"partial"`, `"quiet"` albo forma obiektu `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: gdy `true`, ukończone bloki asystenta są zachowywane jako osobne wiadomości postępu.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg poprzedzający odpowiedzi wychodzące.
- `textChunkLimit`: rozmiar wychodzącego fragmentu w znakach, gdy `chunkMode: "length"`. Domyślnie: `4000`.
- `chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) albo `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju dołączanych jako `InboundHistory`, gdy wiadomość w pokoju wyzwala agenta. Wraca do `messages.groupChat.historyLimit`; efektywna wartość domyślna `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłania wychodzącego i przetwarzania przychodzącego.

### Ustawienia reakcji

- `ackReaction`: nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: nadpisanie zakresu (domyślnie `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (domyślnie `"own"`, `"off"`).

### Narzędzia i nadpisania dla poszczególnych pokojów

- `actions`: bramkowanie narzędzi dla poszczególnych akcji (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa zasad dla poszczególnych pokojów. Tożsamość sesji używa stabilnego identyfikatora pokoju po rozpoznaniu. (`rooms` to starszy alias).
  - `groups.<room>.account`: ogranicz jeden dziedziczony wpis pokoju do konkretnego konta.
  - `groups.<room>.allowBots`: nadpisanie ustawienia na poziomie kanału dla poszczególnych pokojów (`true` albo `"mentions"`).
  - `groups.<room>.users`: lista dozwolonych nadawców dla poszczególnych pokojów.
  - `groups.<room>.tools`: nadpisania zezwoleń/odmów narzędzi dla poszczególnych pokojów.
  - `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami dla poszczególnych pokojów. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza je ponownie.
  - `groups.<room>.skills`: filtr Skills dla poszczególnych pokojów.
  - `groups.<room>.systemPrompt`: fragment promptu systemowego dla poszczególnych pokojów.

### Ustawienia zatwierdzania exec

- `execApprovals.enabled`: dostarczaj zatwierdzenia exec przez natywne prompty Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnione do zatwierdzania. Wraca do `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` albo `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów/sesji dla dostarczania.

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmiankami
- [Trasowanie kanałów](/pl/channels/channel-routing) - trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
