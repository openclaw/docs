---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji Matrix
summary: Status obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-04-05T13:47:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix to dołączona wtyczka kanału Matrix dla OpenClaw.
Korzysta z oficjalnego `matrix-js-sdk` i obsługuje DM-y, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączona wtyczka

Matrix jest dostarczany jako dołączona wtyczka w bieżących wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Matrix, zainstaluj
go ręcznie:

Zainstaluj z npm:

```bash
openclaw plugins install @openclaw/matrix
```

Zainstaluj z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Zobacz [Wtyczki](/tools/plugin), aby poznać zachowanie wtyczek i zasady instalacji.

## Konfiguracja

1. Upewnij się, że wtyczka Matrix jest dostępna.
   - Bieżące spakowane wydania OpenClaw już ją zawierają.
   - Starsze/niestandardowe instalacje mogą dodać ją ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix`, używając jednego z wariantów:
   - `homeserver` + `accessToken`, lub
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie gateway.
5. Rozpocznij DM z botem lub zaproś go do pokoju.

Ścieżki konfiguracji interaktywnej:

```bash
openclaw channels add
openclaw configure --section channels
```

O co dokładnie pyta kreator Matrix:

- adres URL homeservera
- metoda uwierzytelniania: access token lub hasło
- identyfikator użytkownika tylko wtedy, gdy wybierzesz uwierzytelnianie hasłem
- opcjonalna nazwa urządzenia
- czy włączyć E2EE
- czy skonfigurować teraz dostęp do pokoi Matrix

Ważne zachowanie kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją dla wybranego konta, a to konto nie ma jeszcze zapisanego uwierzytelniania w konfiguracji, kreator oferuje skrót przez env i zapisuje dla tego konta tylko `enabled: true`.
- Gdy interaktywnie dodajesz kolejne konto Matrix, wprowadzona nazwa konta jest normalizowana do identyfikatora konta używanego w konfiguracji i zmiennych środowiskowych. Na przykład `Ops Bot` staje się `ops-bot`.
- Monity allowlisty DM akceptują od razu pełne wartości `@user:server`. Same nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie jedno dokładne dopasowanie; w przeciwnym razie kreator prosi o ponowną próbę z pełnym identyfikatorem Matrix.
- Monity allowlisty pokoi akceptują bezpośrednio identyfikatory pokoi i aliasy. Mogą także rozwiązywać nazwy dołączonych pokoi na żywo, ale nierozwiązane nazwy są podczas konfiguracji zachowywane tylko w formie wpisanej i później są ignorowane przez rozwiązywanie allowlisty w runtime. Preferuj `!room:server` lub `#alias:server`.
- Tożsamość pokoju/sesji w runtime używa stabilnego identyfikatora pokoju Matrix. Aliasy zadeklarowane dla pokoju są używane tylko jako dane wejściowe do wyszukiwania, a nie jako długoterminowy klucz sesji lub stabilna tożsamość grupy.
- Aby rozwiązać nazwy pokoi przed ich zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

Minimalna konfiguracja oparta na tokenie:

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

Konfiguracja oparta na haśle (token jest buforowany po zalogowaniu):

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

Matrix przechowuje zbuforowane poświadczenia w `~/.openclaw/credentials/matrix/`.
Konto domyślne używa `credentials.json`; nazwane konta używają `credentials-<account>.json`.

Odpowiedniki zmiennych środowiskowych (używane, gdy klucz konfiguracji nie jest ustawiony):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Dla kont innych niż domyślne używaj zmiennych środowiskowych z zakresem konta:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Przykład dla konta `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Dla znormalizowanego identyfikatora konta `ops-bot` użyj:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix escapuje znaki interpunkcyjne w identyfikatorach kont, aby zmienne środowiskowe z zakresem konta nie kolidowały ze sobą.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót przez zmienne środowiskowe tylko wtedy, gdy te zmienne uwierzytelniania są już obecne i wybrane konto nie ma już zapisanego uwierzytelniania Matrix w konfiguracji.

## Przykład konfiguracji

To praktyczna konfiguracja bazowa z parowaniem DM, allowlistą pokoi i włączonym E2EE:

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
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
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

Strumieniowanie odpowiedzi Matrix jest opcjonalne.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysłał jedną roboczą odpowiedź,
edytował ją w miejscu podczas generowania tekstu przez model, a następnie sfinalizował ją po
zakończeniu odpowiedzi:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` to ustawienie domyślne. OpenClaw czeka na końcową odpowiedź i wysyła ją tylko raz.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądu dla bieżącego bloku asystenta zamiast wysyłać wiele częściowych wiadomości.
- `blockStreaming: true` włącza osobne wiadomości postępu Matrix. Przy `streaming: "partial"` Matrix zachowuje roboczy podgląd na żywo dla bieżącego bloku i pozostawia ukończone bloki jako osobne wiadomości.
- Gdy `streaming: "partial"` jest włączone, a `blockStreaming` wyłączone, Matrix tylko edytuje podgląd na żywo i wysyła ukończoną odpowiedź po zakończeniu tego bloku lub tury.
- Jeśli podgląd przestaje mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do zwykłego dostarczenia końcowego.
- Odpowiedzi multimedialne nadal wysyłają załączniki normalnie. Jeśli nieaktualnego podglądu nie da się już bezpiecznie ponownie użyć, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw strumieniowanie wyłączone, jeśli chcesz zachować najbardziej konserwatywne zachowanie względem limitów szybkości.

`blockStreaming` samo w sobie nie włącza roboczych podglądów.
Użyj `streaming: "partial"` dla edycji podglądu, a następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz także, aby ukończone bloki asystenta pozostawały widoczne jako osobne wiadomości postępu.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Pokoje nieszyfrowane nadal używają zwykłego `thumbnail_url`. Konfiguracja nie jest wymagana — wtyczka automatycznie wykrywa stan E2EE.

### Pokoje bot-bot

Domyślnie wiadomości Matrix z innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, jeśli celowo chcesz dopuścić ruch Matrix między agentami:

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

- `allowBots: true` akceptuje wiadomości z innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i DM-ach.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach wyraźnie wspominają tego bota. DM-y nadal są dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości z tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiedzi do samego siebie.
- Matrix nie udostępnia tu natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym gateway OpenClaw”.

Podczas włączania ruchu bot-do-bota w pokojach współdzielonych używaj ścisłych allowlist pokoi i wymagań wzmianki.

Włącz szyfrowanie:

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

Sprawdź status weryfikacji:

```bash
openclaw matrix verify status
```

Szczegółowy status (pełna diagnostyka):

```bash
openclaw matrix verify status --verbose
```

Uwzględnij zapisany klucz odzyskiwania w wyjściu czytelnym maszynowo:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Zainicjuj cross-signing i stan weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Obsługa wielu kont: użyj `channels.matrix.accounts` z poświadczeniami per konto i opcjonalnym `name`. Zobacz [Dokumentacja konfiguracji](/gateway/configuration-reference#multi-account-all-channels), aby poznać wspólny wzorzec.

Szczegółowa diagnostyka bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Wymuś reset tożsamości cross-signing przed bootstrapem:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Zweryfikuj to urządzenie za pomocą klucza odzyskiwania:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Szczegółowe informacje o weryfikacji urządzenia:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Sprawdź stan kopii zapasowej kluczy pokoju:

```bash
openclaw matrix verify backup status
```

Szczegółowa diagnostyka stanu kopii zapasowej:

```bash
openclaw matrix verify backup status --verbose
```

Przywróć klucze pokoju z kopii zapasowej na serwerze:

```bash
openclaw matrix verify backup restore
```

Szczegółowa diagnostyka przywracania:

```bash
openclaw matrix verify backup restore --verbose
```

Usuń bieżącą kopię zapasową na serwerze i utwórz nową bazową kopię zapasową. Jeśli zapisanego
klucza kopii zapasowej nie da się poprawnie załadować, ten reset może również odtworzyć sekretne przechowywanie, aby
przyszłe zimne starty mogły załadować nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (łącznie z cichym wewnętrznym logowaniem SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
Do skryptów użyj `--json`, aby uzyskać pełne wyjście czytelne maszynowo.

W konfiguracjach wielokontowych polecenia Matrix CLI używają domyślnego niejawnego konta Matrix, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz, aby operacje weryfikacji lub urządzeń były jawnie kierowane do nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

### Co oznacza „zweryfikowane”

OpenClaw traktuje to urządzenie Matrix jako zweryfikowane tylko wtedy, gdy zostało zweryfikowane przez własną tożsamość cross-signing.
W praktyce `openclaw matrix verify status --verbose` pokazuje trzy sygnały zaufania:

- `Locally trusted`: to urządzenie jest zaufane tylko przez bieżącego klienta
- `Cross-signing verified`: SDK zgłasza urządzenie jako zweryfikowane przez cross-signing
- `Signed by owner`: urządzenie jest podpisane przez Twój własny klucz self-signing

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecna jest weryfikacja cross-signing lub podpis właściciela.
Samo lokalne zaufanie nie wystarcza, aby OpenClaw traktował urządzenie jako w pełni zweryfikowane.

### Co robi bootstrap

`openclaw matrix verify bootstrap` to polecenie naprawy i konfiguracji dla zaszyfrowanych kont Matrix.
Wykonuje ono po kolei wszystkie poniższe czynności:

- inicjalizuje sekretne przechowywanie, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjalizuje cross-signing i wysyła brakujące publiczne klucze cross-signing
- próbuje oznaczyć i podpisać bieżące urządzenie przez cross-signing
- tworzy nową kopię zapasową kluczy pokoju po stronie serwera, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga interaktywnego uwierzytelniania do wysłania kluczy cross-signing, OpenClaw najpierw próbuje wysyłki bez uwierzytelniania, potem z `m.login.dummy`, a następnie z `m.login.password`, gdy skonfigurowane jest `channels.matrix.password`.

Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo chcesz odrzucić bieżącą tożsamość cross-signing i utworzyć nową.

Jeśli celowo chcesz odrzucić bieżącą kopię zapasową kluczy pokoju i rozpocząć nową
bazową kopię zapasową dla przyszłych wiadomości, użyj `openclaw matrix verify backup reset --yes`.
Rób to tylko wtedy, gdy akceptujesz, że nieodwracalnie utracona stara zaszyfrowana historia pozostanie
niedostępna i że OpenClaw może odtworzyć sekretne przechowywanie, jeśli bieżącego sekretu
kopii zapasowej nie da się bezpiecznie załadować.

### Nowa bazowa kopia zapasowa

Jeśli chcesz zachować działanie przyszłych zaszyfrowanych wiadomości i akceptujesz utratę nieodzyskiwalnej starej historii, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Dodaj `--account <id>` do każdego polecenia, gdy chcesz jawnie wskazać nazwane konto Matrix.

### Zachowanie przy uruchamianiu

Gdy `encryption: true`, Matrix domyślnie ustawia `startupVerification` na `"if-unverified"`.
Przy uruchamianiu, jeśli to urządzenie nadal nie jest zweryfikowane, Matrix poprosi o self-verification w innym kliencie Matrix,
pominie duplikaty żądań, gdy jedno jest już oczekujące, i zastosuje lokalny cooldown przed ponowną próbą po restartach.
Nieudane próby żądań są domyślnie ponawiane szybciej niż udane utworzenie żądania.
Ustaw `startupVerification: "off"`, aby wyłączyć automatyczne żądania przy uruchamianiu, albo dostosuj `startupVerificationCooldownHours`,
jeśli chcesz krótsze lub dłuższe okno ponawiania.

Przy uruchamianiu automatycznie wykonywany jest również konserwatywny przebieg bootstrap kryptograficznego.
Ten przebieg najpierw próbuje ponownie użyć bieżącego sekretnego przechowywania i tożsamości cross-signing oraz unika resetowania cross-signing, chyba że uruchomisz jawny przepływ naprawy bootstrap.

Jeśli podczas uruchamiania zostanie wykryty uszkodzony stan bootstrap i skonfigurowane jest `channels.matrix.password`, OpenClaw może spróbować bardziej rygorystycznej ścieżki naprawy.
Jeśli bieżące urządzenie jest już podpisane przez właściciela, OpenClaw zachowuje tę tożsamość zamiast resetować ją automatycznie.

Aktualizacja z poprzedniej publicznej wtyczki Matrix:

- OpenClaw automatycznie ponownie używa tego samego konta Matrix, access tokena i tożsamości urządzenia, gdy to możliwe.
- Zanim zostaną wykonane jakiekolwiek działania migracyjne Matrix, OpenClaw tworzy lub ponownie używa migawki odzyskiwania w `~/Backups/openclaw-migrations/`.
- Jeśli używasz wielu kont Matrix, ustaw `channels.matrix.defaultAccount` przed aktualizacją ze starego układu flat-store, aby OpenClaw wiedział, które konto ma otrzymać ten współdzielony stan legacy.
- Jeśli poprzednia wtyczka przechowywała lokalnie klucz odszyfrowywania kopii zapasowej kluczy pokoju Matrix, uruchomienie lub `openclaw doctor --fix` zaimportuje go automatycznie do nowego przepływu klucza odzyskiwania.
- Jeśli access token Matrix zmienił się po przygotowaniu migracji, uruchomienie skanuje teraz sąsiednie katalogi główne przechowywania hashy tokenów w poszukiwaniu oczekującego stanu przywracania legacy, zanim zrezygnuje z automatycznego przywracania kopii zapasowej.
- Jeśli access token Matrix zmieni się później dla tego samego konta, homeservera i użytkownika, OpenClaw preferuje teraz ponowne użycie najbardziej kompletnego istniejącego katalogu głównego przechowywania z hashem tokena zamiast rozpoczynania od pustego katalogu stanu Matrix.
- Przy następnym uruchomieniu gateway klucze pokoju z kopii zapasowej zostaną automatycznie przywrócone do nowego magazynu kryptograficznego.
- Jeśli stara wtyczka miała tylko lokalne klucze pokoju, które nigdy nie zostały zbackupowane, OpenClaw wyświetli wyraźne ostrzeżenie. Tych kluczy nie da się automatycznie wyeksportować z poprzedniego rust crypto store, więc część starej zaszyfrowanej historii może pozostać niedostępna do czasu ręcznego odzyskania.
- Zobacz [Migracja Matrix](/install/migrating-matrix), aby poznać pełny przepływ aktualizacji, ograniczenia, polecenia odzyskiwania i typowe komunikaty migracyjne.

Zaszyfrowany stan runtime jest organizowany w katalogach głównych per konto, per użytkownik i hash tokena w
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ten katalog zawiera sync store (`bot-storage.json`), crypto store (`crypto/`),
plik klucza odzyskiwania (`recovery-key.json`), migawkę IndexedDB (`crypto-idb-snapshot.json`),
powiązania wątków (`thread-bindings.json`) oraz stan weryfikacji przy uruchamianiu (`startup-verification.json`),
gdy te funkcje są używane.
Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego
katalogu głównego dla tej krotki konto/homeserver/użytkownik, dzięki czemu wcześniejszy stan synchronizacji, stan kryptograficzny, powiązania wątków
i stan weryfikacji przy uruchamianiu pozostają widoczne.

### Model Node crypto store

Matrix E2EE w tej wtyczce korzysta w Node z oficjalnej ścieżki Rust crypto z `matrix-js-sdk`.
Ta ścieżka oczekuje trwałości opartej na IndexedDB, jeśli chcesz, aby stan kryptograficzny przetrwał restarty.

OpenClaw obecnie zapewnia to w Node przez:

- używanie `fake-indexeddb` jako shima API IndexedDB oczekiwanego przez SDK
- przywracanie zawartości Rust crypto IndexedDB z `crypto-idb-snapshot.json` przed `initRustCrypto`
- utrwalanie zaktualizowanej zawartości IndexedDB z powrotem do `crypto-idb-snapshot.json` po inicjalizacji i w czasie działania
- serializowanie przywracania i utrwalania migawki względem `crypto-idb-snapshot.json` za pomocą doradczego blokowania pliku, tak aby utrwalanie w runtime gateway i utrzymanie CLI nie ścigały się o ten sam plik migawki

To zgodność/przewody przechowywania, a nie niestandardowa implementacja kryptografii.
Plik migawki jest wrażliwym stanem runtime i jest przechowywany z restrykcyjnymi uprawnieniami do plików.
W modelu bezpieczeństwa OpenClaw host gateway i lokalny katalog stanu OpenClaw już należą do granicy zaufanego operatora, więc jest to przede wszystkim kwestia trwałości operacyjnej, a nie osobna zdalna granica zaufania.

Planowane ulepszenie:

- dodać obsługę SecretRef dla trwałego materiału kluczy Matrix, tak aby klucze odzyskiwania i powiązane sekrety szyfrowania magazynu mogły pochodzić od dostawców sekretów OpenClaw zamiast wyłącznie z lokalnych plików

## Zarządzanie profilem

Zaktualizuj self-profile Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, gdy chcesz jawnie wskazać nazwane konto Matrix.

Matrix akceptuje bezpośrednio adresy URL awatarów `mxc://`. Gdy przekażesz adres URL awatara `http://` lub `https://`, OpenClaw najpierw prześle go do Matrix, a następnie zapisze rozpoznany adres URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub nadpisania wybranego konta).

## Automatyczne powiadomienia o weryfikacji

Matrix publikuje teraz powiadomienia o cyklu życia weryfikacji bezpośrednio w ścisłym pokoju DM weryfikacji jako wiadomości `m.notice`.
Obejmuje to:

- powiadomienia o żądaniach weryfikacji
- powiadomienia o gotowości do weryfikacji (z wyraźną wskazówką „Zweryfikuj za pomocą emoji”)
- powiadomienia o rozpoczęciu i zakończeniu weryfikacji
- szczegóły SAS (emoji i liczby dziesiętne), gdy są dostępne

Przychodzące żądania weryfikacji z innego klienta Matrix są śledzone i automatycznie akceptowane przez OpenClaw.
W przepływach self-verification OpenClaw automatycznie uruchamia także przepływ SAS, gdy weryfikacja emoji staje się dostępna, i potwierdza własną stronę.
W przypadku żądań weryfikacji od innego użytkownika/urządzenia Matrix OpenClaw automatycznie akceptuje żądanie, a następnie czeka na normalny przebieg przepływu SAS.
Aby zakończyć weryfikację, nadal musisz porównać emoji lub dziesiętny SAS w swoim kliencie Matrix i tam potwierdzić „Pasują”.

OpenClaw nie akceptuje bezrefleksyjnie duplikatów przepływów zainicjowanych przez samego siebie. Przy uruchamianiu pomija tworzenie nowego żądania, jeśli żądanie self-verification jest już oczekujące.

Powiadomienia protokołu/systemu weryfikacji nie są przekazywane do potoku czatu agenta, więc nie powodują `NO_REPLY`.

### Higiena urządzeń

Stare urządzenia Matrix zarządzane przez OpenClaw mogą gromadzić się na koncie i utrudniać ocenę zaufania w zaszyfrowanych pokojach.
Wyświetl je za pomocą:

```bash
openclaw matrix devices list
```

Usuń nieaktualne urządzenia Matrix zarządzane przez OpenClaw za pomocą:

```bash
openclaw matrix devices prune-stale
```

### Naprawa Direct Room

Jeśli stan wiadomości bezpośrednich się rozjedzie, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują stare pokoje solo zamiast aktywnego DM. Aby sprawdzić bieżące mapowanie dla peera, użyj:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Aby je naprawić, użyj:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Naprawa utrzymuje logikę specyficzną dla Matrix wewnątrz wtyczki:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- w przeciwnym razie wraca do dowolnego aktualnie dołączonego ścisłego DM 1:1 z tym użytkownikiem
- jeśli nie istnieje żaden zdrowy DM, tworzy nowy direct room i przepisuje `m.direct`, aby wskazywał na niego

Przepływ naprawy nie usuwa automatycznie starych pokoi. Tylko wybiera zdrowy DM i aktualizuje mapowanie, aby nowe wysyłki Matrix, powiadomienia o weryfikacji i inne przepływy wiadomości bezpośrednich znów były kierowane do właściwego pokoju.

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla odpowiedzi automatycznych, jak i wysyłek narzędzia wiadomości.

- `threadReplies: "off"` utrzymuje odpowiedzi na poziomie głównym i zachowuje przychodzące wiadomości w wątkach w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy przychodząca wiadomość już w nim była.
- `threadReplies: "always"` utrzymuje odpowiedzi w pokoju w wątku zakorzenionym w wiadomości wyzwalającej i kieruje tę rozmowę przez odpowiadającą jej sesję z zakresem wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla DM. Na przykład możesz izolować wątki w pokojach, pozostawiając DM płaskie.
- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki narzędzia wiadomości dziedziczą teraz automatycznie bieżący wątek Matrix, gdy celem jest ten sam pokój lub ten sam użytkownik docelowy DM, chyba że podano jawne `threadId`.
- Powiązania wątków w runtime są obsługiwane dla Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz związane z wątkiem `/acp spawn` działają teraz w pokojach i DM-ach Matrix.
- Główne `/focus` w pokoju/DM Matrix tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania rozmów ACP

Pokoje Matrix, DM-y i istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM, pokoju lub istniejącego wątku Matrix, którego chcesz dalej używać.
- W głównym DM lub pokoju Matrix bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże ten bieżący wątek na miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnAcpSessions` jest wymagane tylko dla `/acp spawn --thread auto|here`, gdy OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings`, a także obsługuje nadpisania per kanał:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flagi uruchamiania związane z wątkami Matrix są opcjonalne:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby pozwolić, by główne `/focus` tworzyło i wiązało nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby pozwolić, by `/acp spawn --thread auto|here` wiązało sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach oraz przychodzące reakcje potwierdzeń.

- Narzędzia wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do określonego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla określonego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota dla tego zdarzenia.
- `remove: true` usuwa tylko wskazaną reakcję emoji z konta bota.

Zakres reakcji potwierdzeń jest rozwiązywany zgodnie ze standardową kolejnością OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- zastępcze emoji tożsamości agenta

Zakres reakcji potwierdzeń jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Bieżące zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy są skierowane do wiadomości Matrix napisanych przez bota.
- `reactionNotifications: "off"` wyłącza systemowe zdarzenia reakcji.
- Usunięcia reakcji nadal nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix udostępnia je jako redakcje, a nie jako osobne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju Matrix wyzwala agenta.
- Wartość zapasowa pochodzi z `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM-y nadal używają zwykłej historii sesji.
- Historia pokoju Matrix jest tylko oczekująca: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wywołały odpowiedzi, a następnie zapisuje migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowienia tego samego zdarzenia Matrix wykorzystują ponownie oryginalną migawkę historii zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, główne wiadomości wątków i oczekująca historia.

- `contextVisibility: "all"` to ustawienie domyślne. Uzupełniający kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne sprawdzenia allowlisty pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność uzupełniającego kontekstu, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja wyzwalania nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i zasad DM.

## Przykład zasad DM i pokoi

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Zobacz [Grupy](/pl/channels/groups), aby poznać zachowanie bramkowania wzmiankami i allowlist.

Przykład parowania dla DM-ów Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal do Ciebie pisze przed zatwierdzeniem, OpenClaw używa ponownie tego samego oczekującego kodu parowania i może po krótkim cooldownie ponownie wysłać odpowiedź-przypomnienie zamiast generować nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ przechowywania.

## Zatwierdzenia exec

Matrix może działać jako klient zatwierdzeń exec dla konta Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalnie; wartość zapasowa pochodzi z `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzenia wracają do innych skonfigurowanych ścieżek zatwierdzania lub zasad zapasowych zatwierdzeń exec.

Natywne routowanie Matrix dotyczy dziś tylko exec:

- `channels.matrix.execApprovals.*` kontroluje natywne routowanie DM/kanału tylko dla zatwierdzeń exec.
- Zatwierdzenia wtyczek nadal używają współdzielonego `/approve` w tym samym czacie oraz ewentualnie skonfigurowanego przekazywania `approvals.plugin`.
- Matrix nadal może ponownie używać `channels.matrix.dm.allowFrom` do autoryzacji zatwierdzeń wtyczek, gdy może bezpiecznie wywnioskować zatwierdzających, ale nie udostępnia osobnej natywnej ścieżki rozsyłania zatwierdzeń wtyczek przez DM/kanał.

Zasady dostarczania:

- `target: "dm"` wysyła monity o zatwierdzenie do DM-ów zatwierdzających
- `target: "channel"` odsyła monit z powrotem do źródłowego pokoju Matrix lub DM
- `target: "both"` wysyła do DM-ów zatwierdzających oraz do źródłowego pokoju Matrix lub DM

Matrix używa dziś tekstowych monitów zatwierdzeń. Zatwierdzający rozstrzygają je za pomocą `/approve <id> allow-once`, `/approve <id> allow-always` lub `/approve <id> deny`.

Tylko rozpoznani zatwierdzający mogą zatwierdzać lub odrzucać. Dostarczanie do kanału zawiera tekst polecenia, więc `channel` lub `both` włączaj tylko w zaufanych pokojach.

Monity zatwierdzeń Matrix ponownie używają współdzielonego planera zatwierdzeń z core. Natywna powierzchnia specyficzna dla Matrix jest jedynie transportem dla zatwierdzeń exec: routowaniem pokoju/DM oraz zachowaniem wysyłania/aktualizacji/usuwania wiadomości.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Zatwierdzenia exec](/tools/exec-approvals)

## Przykład wielu kont

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

Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla nazwanych kont, chyba że konto je nadpisze.
Możesz ograniczyć dziedziczone wpisy pokoi do jednego konta Matrix za pomocą `groups.<room>.account` (lub starszego `rooms.<room>.account`).
Wpisy bez `account` pozostają współdzielone przez wszystkie konta Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same w sobie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje konto najwyższego poziomu `default` tylko wtedy, gdy to konto domyślne ma świeże uwierzytelnianie (`homeserver` plus `accessToken`, lub `homeserver` plus `userId` i `password`); nazwane konta mogą nadal pozostać wykrywalne z `homeserver` plus `userId`, gdy zbuforowane poświadczenia później spełnią wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, naprawa/promocja z jednego konta do wielu zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Do promowanego konta przenoszone są tylko klucze uwierzytelniania/bootstrap Matrix; współdzielone klucze zasad dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix do niejawnego routowania, sondowania i operacji CLI.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` lub przekazuj `--account <id>` dla poleceń CLI, które polegają na niejawnym wyborze konta.
Przekazuj `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla jednego polecenia.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix dla ochrony SSRF, chyba że
jawnie włączysz tę możliwość dla konta.

Jeśli Twój homeserver działa na localhost, adresie IP LAN/Tailscale lub wewnętrznej nazwie hosta, włącz
`allowPrivateNetwork` dla tego konta Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Przykład konfiguracji przez CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

To włączenie dotyczy tylko zaufanych prywatnych/wewnętrznych celów. Publiczne homeservery bez TLS, takie jak
`http://matrix.example.org:8008`, nadal pozostają zablokowane. Jeśli to możliwe, preferuj `https://`.

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

Nazwane konta mogą nadpisywać domyślne ustawienie najwyższego poziomu przez `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w runtime i sond stanu konta.

## Rozwiązywanie celów

Matrix akceptuje następujące formy celu wszędzie tam, gdzie OpenClaw prosi o pokój lub cel użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokoi akceptują bezpośrednio jawne identyfikatory pokoi i aliasy, a następnie wracają do przeszukiwania nazw dołączonych pokoi dla tego konta.
- Wyszukiwanie po nazwie dołączonego pokoju ma charakter best-effort. Jeśli nazwy pokoju nie da się rozwiązać do identyfikatora lub aliasu, jest ona ignorowana przez rozwiązywanie allowlisty w runtime.

## Dokumentacja konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowanych jest wiele kont Matrix.
- `homeserver`: adres URL homeservera, na przykład `https://matrix.example.org`.
- `allowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver rozwiązuje się do `localhost`, adresu IP LAN/Tailscale lub wewnętrznego hosta, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny adres URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisywać domyślne ustawienie najwyższego poziomu własnym `proxy`.
- `userId`: pełny identyfikator użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: access token do uwierzytelniania opartego na tokenie. Dla `channels.matrix.accessToken` i `channels.matrix.accounts.<id>.accessToken` obsługiwane są wartości w postaci jawnego tekstu i SecretRef w dostawcach env/file/exec. Zobacz [Zarządzanie sekretami](/gateway/secrets).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości w postaci jawnego tekstu i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia przy logowaniu hasłem.
- `avatarUrl`: zapisany adres URL własnego awatara do synchronizacji profilu i aktualizacji `set-profile`.
- `initialSyncLimit`: limit zdarzeń synchronizacji przy uruchamianiu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: wymusza zachowanie wyłącznie z allowlistą dla DM-ów i pokoi.
- `allowBots`: pozwala na wiadomości z innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` lub `disabled`.
- `contextVisibility`: tryb widoczności uzupełniającego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlista identyfikatorów użytkowników dla ruchu w pokojach.
- Wpisy `groupAllowFrom` powinny być pełnymi identyfikatorami użytkowników Matrix. Nierozwiązane nazwy są ignorowane w runtime.
- `historyLimit`: maksymalna liczba wiadomości z pokoju do uwzględnienia jako kontekst historii grupy. Wartość zapasowa pochodzi z `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first` lub `all`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `partial`, `true` lub `false`. `partial` i `true` włączają robocze podglądy w pojedynczej wiadomości z aktualizacjami przez edycję w miejscu.
- `blockStreaming`: `true` włącza osobne wiadomości postępu dla ukończonych bloków asystenta, gdy aktywne jest strumieniowanie roboczego podglądu.
- `threadReplies`: `off`, `inbound` lub `always`.
- `threadBindings`: nadpisania per kanał dla routowania i cyklu życia sesji związanych z wątkami.
- `startupVerification`: tryb automatycznego żądania self-verification przy uruchamianiu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown przed ponowną próbą automatycznych żądań weryfikacji przy uruchamianiu.
- `textChunkLimit`: rozmiar fragmentu wychodzącej wiadomości.
- `chunkMode`: `length` lub `newline`.
- `responsePrefix`: opcjonalny prefiks wiadomości dla odpowiedzi wychodzących.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzenia (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla obsługi multimediów Matrix. Dotyczy wysyłek wychodzących i przetwarzania multimediów przychodzących.
- `autoJoin`: zasada automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do identyfikatorów pokoi podczas obsługi zaproszeń; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zapraszający pokój.
- `dm`: blok zasad DM (`enabled`, `policy`, `allowFrom`, `threadReplies`).
- Wpisy `dm.allowFrom` powinny być pełnymi identyfikatorami użytkowników Matrix, chyba że zostały już rozwiązane przez wyszukiwanie katalogu na żywo.
- `dm.threadReplies`: nadpisanie zasad wątków tylko dla DM (`off`, `inbound`, `always`). Nadpisuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umieszczania odpowiedzi, jak i izolacji sesji w DM-ach.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec w Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: identyfikatory użytkowników Matrix, którzy mogą zatwierdzać żądania exec. Opcjonalne, gdy `dm.allowFrom` już identyfikuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa zasad per pokój. Preferuj identyfikatory pokoi lub aliasy; nierozwiązane nazwy pokoi są ignorowane w runtime. Tożsamość sesji/grupy po rozwiązaniu używa stabilnego identyfikatora pokoju, natomiast etykiety czytelne dla człowieka nadal pochodzą z nazw pokoi.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do określonego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: allowlista nadawców per pokój.
- `groups.<room>.tools`: nadpisania zezwolenia/zabronienia narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami na poziomie pokoju. `true` wyłącza wymagania wzmianki dla tego pokoju; `false` ponownie je wymusza.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment systemPrompt na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: kontrola narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routowanie kanałów](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i utwardzanie
