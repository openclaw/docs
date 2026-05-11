---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji w Matrix
summary: Stan obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-05-11T20:21:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix to możliwy do pobrania plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Instalacja

Zainstaluj Matrix z ClawHub przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/matrix
```

Nagie specyfikacje pluginów najpierw próbują ClawHub, a potem używają npm jako opcji zapasowej. Aby wymusić źródło rejestru, użyj `openclaw plugins install clawhub:@openclaw/matrix` albo `openclaw plugins install npm:@openclaw/matrix`.

Z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` rejestruje i włącza plugin, więc osobny krok `openclaw plugins enable matrix` nie jest potrzebny. Plugin nadal nic nie robi, dopóki nie skonfigurujesz poniższego kanału. Zobacz [Plugins](/pl/tools/plugin), aby poznać ogólne działanie pluginów i reguły instalacji.

## Konfiguracja

1. Utwórz konto Matrix na swoim homeserverze.
2. Skonfiguruj `channels.matrix` za pomocą `homeserver` + `accessToken` albo `homeserver` + `userId` + `password`.
3. Uruchom ponownie Gateway.
4. Rozpocznij wiadomość prywatną z botem albo zaproś go do pokoju (zobacz [automatyczne dołączanie](#auto-join) - nowe zaproszenia trafiają tylko wtedy, gdy `autoJoin` na nie pozwala).

### Konfiguracja interaktywna

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator pyta o: URL homeservera, metodę uwierzytelniania (token dostępu albo hasło), identyfikator użytkownika (tylko uwierzytelnianie hasłem), opcjonalną nazwę urządzenia, czy włączyć E2EE oraz czy skonfigurować dostęp do pokojów i automatyczne dołączanie.

Jeśli pasujące zmienne środowiskowe `MATRIX_*` już istnieją, a wybrane konto nie ma zapisanego uwierzytelniania, kreator zaproponuje skrót przez zmienną środowiskową. Aby rozwiązać nazwy pokojów przed zapisaniem listy dozwolonych, uruchom `openclaw channels resolve --channel matrix "Project Room"`. Gdy E2EE jest włączone, kreator zapisuje konfigurację i uruchamia ten sam bootstrap co [`openclaw matrix encryption setup`](#encryption-and-verification).

### Minimalna konfiguracja

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

`channels.matrix.autoJoin` ma domyślnie wartość `off`. Przy ustawieniu domyślnym bot nie pojawi się w nowych pokojach ani wiadomościach prywatnych z nowych zaproszeń, dopóki nie dołączysz ręcznie.

OpenClaw nie może stwierdzić w momencie zaproszenia, czy zaproszony pokój jest wiadomością prywatną, czy grupą, więc wszystkie zaproszenia - w tym zaproszenia w stylu wiadomości prywatnych - najpierw przechodzą przez `autoJoin`. `dm.policy` ma zastosowanie dopiero później, po dołączeniu bota i sklasyfikowaniu pokoju.

<Warning>
Ustaw `autoJoin: "allowlist"` oraz `autoJoinAllowlist`, aby ograniczyć zaproszenia akceptowane przez bota, albo `autoJoin: "always"`, aby akceptować każde zaproszenie.

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

### Formaty celów list dozwolonych

Listy dozwolonych wiadomości prywatnych i pokojów najlepiej wypełniać stabilnymi identyfikatorami:

- Wiadomości prywatne (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): użyj `@user:server`. Nazwy wyświetlane są domyślnie ignorowane, ponieważ są zmienne; ustaw `dangerouslyAllowNameMatching: true` tylko wtedy, gdy wyraźnie potrzebujesz zgodności z wpisami nazw wyświetlanych.
- Klucze list dozwolonych pokojów (`groups`, starsze `rooms`): użyj `!room:server` albo `#alias:server`. Zwykłe nazwy pokojów są domyślnie ignorowane; ustaw `dangerouslyAllowNameMatching: true` tylko wtedy, gdy wyraźnie potrzebujesz zgodności z wyszukiwaniem nazw dołączonych pokojów.
- Listy dozwolonych zaproszeń (`autoJoinAllowlist`): użyj `!room:server`, `#alias:server` albo `*`. Zwykłe nazwy pokojów są odrzucane.

### Normalizacja identyfikatora konta

Kreator konwertuje przyjazną nazwę na znormalizowany identyfikator konta. Na przykład `Ops Bot` staje się `ops-bot`. Znaki interpunkcyjne są escapowane w nazwach zmiennych środowiskowych o zakresie, aby dwa konta nie mogły kolidować: `-` → `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

### Buforowane dane uwierzytelniające

Matrix przechowuje buforowane dane uwierzytelniające w `~/.openclaw/credentials/matrix/`:

- konto domyślne: `credentials.json`
- konta nazwane: `credentials-<account>.json`

Gdy istnieją tam buforowane dane uwierzytelniające, OpenClaw traktuje Matrix jako skonfigurowany, nawet jeśli token dostępu nie znajduje się w pliku konfiguracji - obejmuje to konfigurację, `openclaw doctor` i sondy statusu kanału.

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

Strumieniowanie odpowiedzi Matrix jest opcjonalne. `streaming` kontroluje sposób, w jaki OpenClaw dostarcza tworzoną odpowiedź asystenta; `blockStreaming` kontroluje, czy każdy ukończony blok jest zachowywany jako osobna wiadomość Matrix.

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

| `streaming`         | Zachowanie                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (domyślne)  | Czekaj na pełną odpowiedź, wyślij raz. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                 |
| `"partial"`         | Edytuj jedną zwykłą wiadomość tekstową w miejscu, gdy model pisze bieżący blok. Standardowe klienty Matrix mogą powiadomić przy pierwszym podglądzie, a nie przy końcowej edycji. |
| `"quiet"`           | Tak samo jak `"partial"`, ale wiadomość jest niepowiadamiającą notatką. Odbiorcy otrzymują powiadomienie dopiero, gdy reguła push użytkownika dopasuje sfinalizowaną edycję (zobacz niżej). |

`blockStreaming` jest niezależne od `streaming`:

| `streaming`             | `blockStreaming: true`                                                | `blockStreaming: false` (domyślne)                    |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| `"partial"` / `"quiet"` | Szkic na żywo dla bieżącego bloku, ukończone bloki zachowane jako wiadomości | Szkic na żywo dla bieżącego bloku, finalizowany w miejscu |
| `"off"`                 | Jedna powiadamiająca wiadomość Matrix na ukończony blok               | Jedna powiadamiająca wiadomość Matrix dla pełnej odpowiedzi |

Uwagi:

- Jeśli podgląd przekroczy limit rozmiaru pojedynczego zdarzenia Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do dostarczania tylko wersji końcowej.
- Odpowiedzi multimedialne zawsze wysyłają załączniki normalnie. Jeśli nieaktualny podgląd nie może już zostać bezpiecznie ponownie użyty, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Aktualizacje podglądu postępu narzędzi są domyślnie włączone, gdy aktywne jest strumieniowanie podglądu Matrix. Ustaw `streaming.preview.toolProgress: false`, aby zachować edycje podglądu dla tekstu odpowiedzi, ale pozostawić postęp narzędzi na normalnej ścieżce dostarczania.
- Edycje podglądu kosztują dodatkowe wywołania API Matrix. Pozostaw `streaming: "off"`, jeśli chcesz najbardziej zachowawczy profil limitów szybkości.

## Metadane zatwierdzeń

Natywne monity zatwierdzeń Matrix są zwykłymi zdarzeniami `m.room.message` ze specyficzną dla OpenClaw niestandardową zawartością zdarzenia w `com.openclaw.approval`. Matrix zezwala na niestandardowe klucze zawartości zdarzeń, więc standardowe klienty nadal renderują treść tekstową, a klienty świadome OpenClaw mogą odczytać ustrukturyzowany identyfikator zatwierdzenia, rodzaj, stan, dostępne decyzje oraz szczegóły wykonania/pluginu.

Gdy monit zatwierdzenia jest zbyt długi dla jednego zdarzenia Matrix, OpenClaw dzieli widoczny tekst na fragmenty i dołącza `com.openclaw.approval` tylko do pierwszego fragmentu. Reakcje dla decyzji zezwolenia/odmowy są powiązane z tym pierwszym zdarzeniem, więc długie monity zachowują ten sam cel zatwierdzenia co monity jednozdarzeniowe.

### Samodzielnie hostowane reguły push dla cichych sfinalizowanych podglądów

`streaming: "quiet"` powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury - reguła push użytkownika musi dopasować sfinalizowany znacznik podglądu. Zobacz [Reguły push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules), aby uzyskać pełną procedurę (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserverów).

## Pokoje bot-bot

Domyślnie wiadomości Matrix od innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

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

- `allowBots: true` akceptuje wiadomości od innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i wiadomościach prywatnych.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy widocznie wspominają tego bota w pokojach. Wiadomości prywatne nadal są dozwolone.
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli samoodpowiedzi.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „autorstwo bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym OpenClaw Gateway”.

Używaj ścisłych list dozwolonych pokojów i wymagań wzmianek, gdy włączasz ruch bot-bot we wspólnych pokojach.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Niezaszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Nie jest potrzebna żadna konfiguracja - Plugin automatycznie wykrywa stan E2EE.

Wszystkie polecenia `openclaw matrix` akceptują `--verbose` (pełna diagnostyka), `--json` (wyjście czytelne maszynowo) oraz `--account <id>` (konfiguracje wielu kont). Domyślnie wyjście jest zwięzłe, z cichym wewnętrznym logowaniem SDK. Poniższe przykłady pokazują postać kanoniczną; dodaj flagi w razie potrzeby.

### Włącz szyfrowanie

```bash
openclaw matrix encryption setup
```

Inicjuje magazyn sekretów i cross-signing, w razie potrzeby tworzy kopię zapasową kluczy pokoi, a następnie wyświetla status i kolejne kroki. Przydatne flagi:

- `--recovery-key <key>` zastosuj klucz odzyskiwania przed inicjalizacją (preferuj formę przez stdin udokumentowaną poniżej)
- `--force-reset-cross-signing` odrzuć bieżącą tożsamość cross-signing i utwórz nową (używaj tylko świadomie)

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
- `Cross-signing verified`: SDK raportuje weryfikację przez cross-signing
- `Signed by owner`: podpisane własnym kluczem samopodpisującym (tylko diagnostycznie)

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy `Cross-signing verified` ma wartość `yes`. Samo lokalne zaufanie albo sam podpis właściciela nie wystarcza.

`--allow-degraded-local-state` zwraca diagnostykę best-effort bez wcześniejszego przygotowania konta Matrix; przydatne dla sond offline lub częściowo skonfigurowanych.

### Zweryfikuj to urządzenie kluczem odzyskiwania

Klucz odzyskiwania jest wrażliwy - przekaż go przez stdin zamiast podawać w wierszu poleceń. Ustaw `MATRIX_RECOVERY_KEY` (albo `MATRIX_<ID>_RECOVERY_KEY` dla nazwanego konta):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Polecenie raportuje trzy stany:

- `Recovery key accepted`: Matrix zaakceptował klucz dla magazynu sekretów lub zaufania urządzenia.
- `Backup usable`: kopia zapasowa kluczy pokoi może zostać załadowana przy użyciu zaufanego materiału odzyskiwania.
- `Device verified by owner`: to urządzenie ma pełne zaufanie tożsamości cross-signing Matrix.

Kończy się kodem niezerowym, gdy pełne zaufanie tożsamości jest niekompletne, nawet jeśli klucz odzyskiwania odblokował materiał kopii zapasowej. W takim przypadku dokończ samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

`verify self` czeka na `Cross-signing verified: yes`, zanim zakończy się powodzeniem. Użyj `--timeout-ms <ms>`, aby dostroić czas oczekiwania.

Forma z literalnym kluczem `openclaw matrix verify device "<recovery-key>"` również jest akceptowana, ale klucz trafi do historii powłoki.

### Zainicjuj lub napraw cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` to polecenie naprawy i konfiguracji dla zaszyfrowanych kont. W kolejności:

- inicjuje magazyn sekretów, używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjuje cross-signing i przesyła brakujące klucze publiczne
- oznacza i podpisuje przez cross-signing bieżące urządzenie
- tworzy po stronie serwera kopię zapasową kluczy pokoi, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga UIA do przesłania kluczy cross-signing, OpenClaw próbuje najpierw bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`).

Przydatne flagi:

- `--recovery-key-stdin` (połącz z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) albo `--recovery-key <key>`
- `--force-reset-cross-signing`, aby odrzucić bieżącą tożsamość cross-signing (tylko świadomie)

### Kopia zapasowa kluczy pokoi

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` pokazuje, czy istnieje kopia zapasowa po stronie serwera i czy to urządzenie może ją odszyfrować. `backup restore` importuje zapisane w kopii klucze pokoi do lokalnego magazynu kryptograficznego; jeśli klucz odzyskiwania jest już na dysku, możesz pominąć `--recovery-key-stdin`.

Aby zastąpić uszkodzoną kopię zapasową świeżą bazą (akceptując utratę nieodzyskiwalnej starej historii; może też odtworzyć magazyn sekretów, jeśli sekret bieżącej kopii zapasowej jest niemożliwy do załadowania):

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

Wysyła żądanie weryfikacji z tego konta OpenClaw. `--own-user` żąda samoweryfikacji (akceptujesz monit w innym kliencie Matrix tego samego użytkownika); `--user-id`/`--device-id`/`--room-id` wskazują kogoś innego. `--own-user` nie można łączyć z pozostałymi flagami wskazywania celu.

Do niższopoziomowej obsługi cyklu życia - zwykle podczas śledzenia przychodzących żądań z innego klienta - te polecenia działają na konkretnym żądaniu `<id>` (wypisywanym przez `verify list` i `verify request`):

| Polecenie                                  | Cel                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Zaakceptuj przychodzące żądanie                                     |
| `openclaw matrix verify start <id>`        | Rozpocznij przepływ SAS                                             |
| `openclaw matrix verify sas <id>`          | Wypisz emoji lub liczby SAS                                         |
| `openclaw matrix verify confirm-sas <id>`  | Potwierdź, że SAS zgadza się z tym, co pokazuje drugi klient        |
| `openclaw matrix verify mismatch-sas <id>` | Odrzuć SAS, gdy emoji lub liczby się nie zgadzają                   |
| `openclaw matrix verify cancel <id>`       | Anuluj; przyjmuje opcjonalne `--reason <text>` i `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` i `cancel` akceptują także `--user-id` oraz `--room-id` jako wskazówki kontynuacji DM, gdy weryfikacja jest zakotwiczona w konkretnym pokoju wiadomości bezpośrednich.

### Uwagi dotyczące wielu kont

Bez `--account <id>` polecenia Matrix CLI używają niejawnego konta domyślnego. Jeśli masz wiele nazwanych kont i nie ustawiono `channels.matrix.defaultAccount`, odmówią zgadywania i poproszą o wybór. Gdy E2EE jest wyłączone lub niedostępne dla nazwanego konta, błędy wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Zachowanie podczas uruchamiania">
    Przy `encryption: true` domyślną wartością `startupVerification` jest `"if-unverified"`. Podczas uruchamiania niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując czas odnowienia (domyślnie 24 godziny). Dostosuj za pomocą `startupVerificationCooldownHours` albo wyłącz przez `startupVerification: "off"`.

    Uruchamianie wykonuje także konserwatywny przebieg inicjalizacji kryptografii, który ponownie używa bieżącego magazynu sekretów i tożsamości cross-signing. Jeśli stan inicjalizacji jest uszkodzony, OpenClaw próbuje ostrożnej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga hasła UIA, uruchamianie zapisuje ostrzeżenie w logach i pozostaje niekrytyczne. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [Migracja Matrix](/pl/channels/matrix-migration), aby poznać pełny przepływ aktualizacji.

  </Accordion>

  <Accordion title="Powiadomienia weryfikacyjne">
    Matrix publikuje powiadomienia o cyklu życia weryfikacji w ścisłym pokoju DM weryfikacji jako wiadomości `m.notice`: żądanie, gotowość (z instrukcją „Zweryfikuj przez emoji”), rozpoczęcie/zakończenie oraz szczegóły SAS (emoji/liczby), gdy są dostępne.

    Przychodzące żądania z innego klienta Matrix są śledzone i automatycznie akceptowane. Dla samoweryfikacji OpenClaw automatycznie rozpoczyna przepływ SAS i potwierdza swoją stronę, gdy dostępna jest weryfikacja emoji - nadal musisz porównać i potwierdzić „Zgadzają się” w swoim kliencie Matrix.

    Powiadomienia systemowe weryfikacji nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Usunięte lub nieprawidłowe urządzenie Matrix">
    Jeśli `verify status` informuje, że bieżącego urządzenia nie ma już na homeserverze, utwórz nowe urządzenie OpenClaw Matrix. Dla logowania hasłem:

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
    Stare urządzenia zarządzane przez OpenClaw mogą się gromadzić. Wyświetl i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Magazyn kryptograficzny">
    Matrix E2EE używa oficjalnej ścieżki kryptografii Rust z `matrix-js-sdk`, z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia pliku).

    Zaszyfrowany stan wykonania znajduje się pod `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, migawkę IDB, powiązania wątków oraz stan weryfikacji podczas uruchamiania. Gdy token się zmienia, ale tożsamość konta pozostaje ta sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, aby wcześniejszy stan pozostał widoczny.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj profil własny Matrix dla wybranego konta:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Możesz przekazać obie opcje w jednym wywołaniu. Matrix akceptuje adresy URL awatarów `mxc://` bezpośrednio; gdy przekażesz `http://` lub `https://`, OpenClaw najpierw przesyła plik, a następnie zapisuje rozwiązany adres URL `mxc://` w `channels.matrix.avatarUrl` (albo w nadpisaniu dla konkretnego konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek narzędziem wiadomości. Zachowanie kontrolują dwa niezależne przełączniki:

### Routing sesji (`sessionScope`)

`dm.sessionScope` decyduje, jak pokoje DM Matrix mapują się na sesje OpenClaw:

- `"per-user"` (domyślnie): wszystkie pokoje DM z tym samym routowanym rozmówcą współdzielą jedną sesję.
- `"per-room"`: każdy pokój DM Matrix otrzymuje własny klucz sesji, nawet gdy rozmówca jest ten sam.

Jawne powiązania konwersacji zawsze wygrywają z `sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.

### Wątkowanie odpowiedzi (`threadReplies`)

`threadReplies` decyduje, gdzie bot publikuje odpowiedź:

- `"off"`: odpowiedzi są najwyższego poziomu. Przychodzące wiadomości w wątku pozostają w sesji nadrzędnej.
- `"inbound"`: odpowiadaj wewnątrz wątku tylko wtedy, gdy wiadomość przychodząca już była w tym wątku.
- `"always"`: odpowiadaj wewnątrz wątku zakorzenionego w wiadomości wyzwalającej; ta konwersacja jest routowana przez odpowiadającą jej sesję o zakresie wątku od pierwszego wyzwolenia.

`dm.threadReplies` nadpisuje to tylko dla DM - na przykład, aby izolować wątki pokojów, zachowując jednocześnie płaskie DM.

### Dziedziczenie wątków i polecenia slash

- Przychodzące wiadomości w wątkach zawierają główną wiadomość wątku jako dodatkowy kontekst agenta.
- Wysyłki narzędziem wiadomości automatycznie dziedziczą bieżący wątek Matrix podczas kierowania do tego samego pokoju (lub tego samego celu użytkownika DM), chyba że podano jawny `threadId`.
- Ponowne użycie celu użytkownika DM włącza się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego peera DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routingu ograniczonego do użytkownika.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają zarówno w pokojach Matrix, jak i w DM-ach.
- Najwyższego poziomu `/focus` tworzy nowy wątek Matrix i wiąże go z docelową sesją, gdy włączone jest `threadBindings.spawnSessions`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże ten wątek w miejscu.

Gdy OpenClaw wykryje kolizję pokoju DM Matrix z innym pokojem DM w tej samej współdzielonej sesji, publikuje w tym pokoju jednorazowe `m.notice`, wskazujące wyjście awaryjne `/focus` i sugerujące zmianę `dm.sessionScope`. Powiadomienie pojawia się tylko wtedy, gdy włączone są powiązania wątków.

## Powiązania konwersacji ACP

Pokoje Matrix, DM-y i istniejące wątki Matrix można przekształcić w trwałe obszary robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM-a Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W DM-ie lub pokoju Matrix najwyższego poziomu bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże ten bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnSessions` bramkuje `/acp spawn --thread auto|here`, gdy OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings`, a także obsługuje nadpisania dla poszczególnych kanałów:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Tworzenie sesji powiązanych z wątkiem Matrix jest domyślnie włączone:

- Ustaw `threadBindings.spawnSessions: false`, aby zablokować najwyższego poziomu `/focus` i `/acp spawn --thread auto|here` przed tworzeniem/powiązywaniem wątków Matrix.
- Ustaw `threadBindings.defaultSpawnContext: "isolated"`, gdy natywne tworzenie wątków podagentów nie powinno rozgałęziać transkrypcji rodzica.

## Reakcje

Matrix obsługuje reakcje wychodzące, powiadomienia o reakcjach przychodzących oraz reakcje potwierdzeń.

Narzędzia reakcji wychodzących są bramkowane przez `channels.matrix.actions.reactions`:

- `react` dodaje reakcję do zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje bota na tym zdarzeniu.
- `remove: true` usuwa tylko określoną reakcję emoji od bota.

**Kolejność rozstrzygania** (wygrywa pierwsza zdefiniowana wartość):

| Ustawienie              | Kolejność                                                                       |
| ----------------------- | ------------------------------------------------------------------------------- |
| `ackReaction`           | na konto → kanał → `messages.ackReaction` → awaryjny emoji tożsamości agenta    |
| `ackReactionScope`      | na konto → kanał → `messages.ackReactionScope` → domyślne `"group-mentions"`    |
| `reactionNotifications` | na konto → kanał → domyślne `"own"`                                             |

`reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy dotyczą wiadomości Matrix autorstwa bota; `"off"` wyłącza zdarzenia systemowe reakcji. Usunięcia reakcji nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix udostępnia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju Matrix wyzwala agenta. Wraca do `messages.groupChat.historyLimit`; jeśli oba są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoi Matrix dotyczy tylko pokoi. DM-y nadal używają normalnej historii sesji.
- Historia pokoi Matrix jest tylko oczekująca: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie wykonuje migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby tego samego zdarzenia Matrix używają ponownie oryginalnej migawki historii, zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, główne wiadomości wątków i oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Kontekst uzupełniający jest zachowywany w odebranej postaci.
- `contextVisibility: "allowlist"` filtruje kontekst uzupełniający do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` zachowuje się jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność kontekstu uzupełniającego, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwalacza nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` oraz zasad DM.

## Zasady DM i pokoi

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

Aby całkowicie wyciszyć DM-y, jednocześnie zachowując działanie pokoi, ustaw `dm.enabled: false`:

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

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i po krótkim czasie odnowienia może wysłać odpowiedź z przypomnieniem zamiast tworzyć nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM oraz układ przechowywania.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich rozjedzie się z synchronizacją, OpenClaw może zostać z nieaktualnymi mapowaniami `m.direct`, które wskazują stare pokoje jednoosobowe zamiast aktywnego DM-a. Sprawdź bieżące mapowanie dla peera:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Oba polecenia akceptują `--account <id>` dla konfiguracji wielokontowych. Przepływ naprawy:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- wraca do dowolnego aktualnie dołączonego ścisłego DM-a 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje zdrowy DM

Nie usuwa automatycznie starych pokoi. Wybiera zdrowy DM i aktualizuje mapowanie, aby przyszłe wysyłki Matrix, powiadomienia weryfikacyjne oraz inne przepływy wiadomości bezpośrednich trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń. Skonfiguruj w `channels.matrix.execApprovals` (lub `channels.matrix.accounts.<account>.execApprovals` dla nadpisania na konto):

- `enabled`: dostarczaj zatwierdzenia przez natywne monity Matrix. Gdy nieustawione lub `"auto"`, Matrix automatycznie włącza się, gdy można rozstrzygnąć co najmniej jednego zatwierdzającego. Ustaw `false`, aby jawnie wyłączyć.
- `approvers`: identyfikatory użytkowników Matrix (`@owner:example.org`) uprawnione do zatwierdzania żądań exec. Opcjonalne - wraca do `channels.matrix.dm.allowFrom`.
- `target`: miejsce wysyłania monitów. `"dm"` (domyślnie) wysyła do DM-ów zatwierdzających; `"channel"` wysyła do źródłowego pokoju Matrix lub DM-a; `"both"` wysyła do obu.
- `agentFilter` / `sessionFilter`: opcjonalne listy dozwolonych określające, którzy agenci/sesje wyzwalają dostarczanie przez Matrix.

Autoryzacja różni się nieco między rodzajami zatwierdzeń:

- **Zatwierdzenia exec** używają `execApprovals.approvers`, wracając do `dm.allowFrom`.
- **Zatwierdzenia Plugin** autoryzują wyłącznie przez `dm.allowFrom`.

Oba rodzaje współdzielą skróty reakcji Matrix oraz aktualizacje wiadomości. Zatwierdzający widzą skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` zezwól raz
- `❌` odmów
- `♾️` zezwalaj zawsze (gdy efektywna zasada exec na to pozwala)

Awaryjne polecenia ukośnikowe: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Tylko rozstrzygnięci zatwierdzający mogą zatwierdzać lub odmawiać. Dostarczanie kanałowe dla zatwierdzeń exec obejmuje tekst polecenia - włączaj `channel` lub `both` tylko w zaufanych pokojach.

Powiązane: [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Polecenia ukośnikowe

Polecenia ukośnikowe (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` itd.) działają bezpośrednio w DM-ach. W pokojach OpenClaw rozpoznaje także polecenia poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` wyzwala ścieżkę polecenia bez niestandardowego wyrażenia regularnego wzmianki. Dzięki temu bot pozostaje responsywny na pokojowe wpisy `@mention /command`, które Element i podobni klienci emitują, gdy użytkownik uzupełnia bota tabulatorem przed wpisaniem polecenia.

Reguły autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać te same zasady listy dozwolonych/właściciela dla DM-a lub pokoju co zwykłe wiadomości.

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
- Ogranicz odziedziczony wpis pokoju do konkretnego konta za pomocą `groups.<room>.account`. Wpisy bez `account` są współdzielone między kontami; `account: "default"` nadal działa, gdy konto domyślne jest skonfigurowane na najwyższym poziomie.

**Wybór konta domyślnego:**

- Ustaw `defaultAccount`, aby wybrać nazwane konto preferowane przez niejawny routing, sondowanie i polecenia CLI.
- Jeśli masz wiele kont i jedno dosłownie nazywa się `default`, OpenClaw używa go niejawnie nawet wtedy, gdy `defaultAccount` jest nieustawione.
- Jeśli masz wiele nazwanych kont i nie wybrano domyślnego, polecenia CLI odmawiają zgadywania - ustaw `defaultAccount` albo przekaż `--account <id>`.
- Blok najwyższego poziomu `channels.matrix.*` jest traktowany jako niejawne konto `default` tylko wtedy, gdy jego uwierzytelnianie jest kompletne (`homeserver` + `accessToken` albo `homeserver` + `userId` + `password`). Nazwane konta pozostają wykrywalne z `homeserver` + `userId`, gdy poświadczenia z pamięci podręcznej pokrywają uwierzytelnianie.

**Promocja:**

- Gdy OpenClaw promuje konfigurację jednokontową do wielokontowej podczas naprawy lub konfiguracji, zachowuje istniejące nazwane konto, jeśli takie istnieje albo `defaultAccount` już na nie wskazuje. Tylko klucze uwierzytelniania/rozruchu Matrix przenoszą się do promowanego konta; współdzielone klucze zasad dostarczania pozostają na najwyższym poziomie.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w ramach ochrony przed SSRF, chyba że
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

Ta opcja dobrowolna zezwala tylko na zaufane cele prywatne/wewnętrzne. Publiczne serwery domowe używające jawnego tekstu, takie jak
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
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w czasie działania i prób statusu konta.

## Rozwiązywanie celów

Matrix akceptuje te formy celów wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Identyfikatory pokoi Matrix rozróżniają wielkość liter. Używaj dokładnej wielkości liter identyfikatora pokoju z Matrix
podczas konfigurowania jawnych celów dostarczania, zadań cron, powiązań lub list dozwolonych.
OpenClaw utrzymuje wewnętrzne klucze sesji w postaci kanonicznej na potrzeby przechowywania, więc te klucze pisane małymi literami
nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie w katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym serwerze domowym.
- Wyszukiwania pokoi akceptują bezpośrednio jawne identyfikatory pokoi i aliasy. Wyszukiwanie nazw dołączonych pokoi działa na zasadzie best-effort i dotyczy tylko list dozwolonych pokoi w czasie działania, gdy ustawiono `dangerouslyAllowNameMatching: true`.
- Jeśli nazwy pokoju nie da się rozwiązać do identyfikatora lub aliasu, jest ignorowana podczas rozwiązywania listy dozwolonych w czasie działania.

## Informacje o konfiguracji

Pola użytkowników w stylu listy dozwolonych (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akceptują pełne identyfikatory użytkowników Matrix (najbezpieczniejsze). Wpisy użytkowników, które nie są identyfikatorami, są domyślnie ignorowane. Jeśli ustawisz `dangerouslyAllowNameMatching: true`, dokładne dopasowania nazw wyświetlanych z katalogu Matrix są rozwiązywane podczas uruchamiania i zawsze wtedy, gdy lista dozwolonych zmieni się przy działającym monitorze; wpisy, których nie da się rozwiązać, są ignorowane w czasie działania.

Klucze list dozwolonych pokoi (`groups`, starsze `rooms`) powinny być identyfikatorami pokoi lub aliasami. Zwykłe klucze z nazwami pokoi są domyślnie ignorowane; `dangerouslyAllowNameMatching: true` przywraca wyszukiwanie best-effort względem nazw dołączonych pokoi.

### Konto i połączenie

- `enabled`: włącz lub wyłącz kanał.
- `name`: opcjonalna etykieta wyświetlana konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `accounts`: nazwane nadpisania dla poszczególnych kont. Wartości najwyższego poziomu `channels.matrix` są dziedziczone jako domyślne.
- `homeserver`: URL serwera domowego, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwól temu kontu na łączenie się z `localhost`, adresami IP LAN/Tailscale lub wewnętrznymi nazwami hostów.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Obsługiwane jest nadpisanie dla poszczególnych kont.
- `userId`: pełny identyfikator użytkownika Matrix (`@bot:example.org`).
- `accessToken`: token dostępu do uwierzytelniania opartego na tokenach. Obsługiwane są wartości tekstowe i SecretRef w dostawcach env/file/exec ([Zarządzanie sekretami](/pl/gateway/secrets)).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości tekstowe i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia używana podczas logowania hasłem.
- `avatarUrl`: przechowywany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.

### Szyfrowanie

- `encryption`: włącz E2EE. Domyślnie: `false`.
- `startupVerification`: `"if-unverified"` (domyślne, gdy E2EE jest włączone) lub `"off"`. Automatycznie żąda samoweryfikacji przy uruchamianiu, gdy to urządzenie jest niezweryfikowane.
- `startupVerificationCooldownHours`: czas odczekania przed następnym automatycznym żądaniem przy uruchamianiu. Domyślnie: `24`.

### Dostęp i zasady

- `groupPolicy`: `"open"`, `"allowlist"` lub `"disabled"`. Domyślnie: `"allowlist"`.
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu pokojów.
- `dm.enabled`: gdy `false`, ignoruj wszystkie wiadomości DM. Domyślnie: `true`.
- `dm.policy`: `"pairing"` (domyślnie), `"allowlist"`, `"open"` lub `"disabled"`. Stosowane po tym, jak bot dołączył i sklasyfikował pokój jako DM; nie wpływa na obsługę zaproszeń.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu DM.
- `dm.sessionScope`: `"per-user"` (domyślnie) lub `"per-room"`.
- `dm.threadReplies`: nadpisanie tylko dla DM dotyczące wątkowania odpowiedzi (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akceptuj wiadomości z innych skonfigurowanych kont botów Matrix (`true` lub `"mentions"`).
- `allowlistOnly`: gdy `true`, wymusza wszystkie aktywne zasady DM (z wyjątkiem `"disabled"`) i zasady grup `"open"` na `"allowlist"`. Nie zmienia zasad `"disabled"`.
- `dangerouslyAllowNameMatching`: gdy `true`, zezwala na wyszukiwanie nazw wyświetlanych Matrix w katalogu dla wpisów listy dozwolonych użytkowników oraz na wyszukiwanie nazw dołączonych pokoi dla kluczy listy dozwolonych pokoi. Preferuj pełne identyfikatory `@user:server` oraz identyfikatory pokoi lub aliasy.
- `autoJoin`: `"always"`, `"allowlist"` lub `"off"`. Domyślnie: `"off"`. Dotyczy każdego zaproszenia Matrix, w tym zaproszeń w stylu DM.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `"allowlist"`. Wpisy aliasów są rozwiązywane względem serwera domowego, a nie względem stanu deklarowanego przez zapraszający pokój.
- `contextVisibility`: dodatkowa widoczność kontekstu (domyślnie `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Zachowanie odpowiedzi

- `replyToMode`: `"off"`, `"first"`, `"all"` lub `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` lub `"always"`.
- `threadBindings`: nadpisania dla poszczególnych kanałów dotyczące routingu i cyklu życia sesji powiązanych z wątkiem.
- `streaming`: `"off"` (domyślnie), `"partial"`, `"quiet"` lub forma obiektowa `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: gdy `true`, ukończone bloki asystenta są zachowywane jako osobne komunikaty postępu.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla tekstu wychodzącego.
- `responsePrefix`: opcjonalny ciąg dodawany przed odpowiedziami wychodzącymi.
- `textChunkLimit`: rozmiar wychodzącej części w znakach, gdy `chunkMode: "length"`. Domyślnie: `4000`.
- `chunkMode`: `"length"` (domyślnie, dzieli według liczby znaków) lub `"newline"` (dzieli na granicach wierszy).
- `historyLimit`: liczba ostatnich wiadomości z pokoju dołączanych jako `InboundHistory`, gdy wiadomość w pokoju uruchamia agenta. Wraca do `messages.groupChat.historyLimit`; efektywna wartość domyślna to `0` (wyłączone).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania przychodzącego.

### Ustawienia reakcji

- `ackReaction`: nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: nadpisanie zakresu (domyślnie `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (domyślnie `"own"`, `"off"`).

### Narzędzia i nadpisania dla poszczególnych pokoi

- `actions`: bramkowanie narzędzi dla poszczególnych akcji (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa zasad dla poszczególnych pokoi. Tożsamość sesji używa stabilnego identyfikatora pokoju po rozwiązaniu. (`rooms` to starszy alias.)
  - `groups.<room>.account`: ogranicz jeden dziedziczony wpis pokoju do konkretnego konta.
  - `groups.<room>.allowBots`: nadpisanie ustawienia na poziomie kanału dla poszczególnych pokoi (`true` lub `"mentions"`).
  - `groups.<room>.users`: lista dozwolonych nadawców dla poszczególnych pokoi.
  - `groups.<room>.tools`: nadpisania zezwalania/odmawiania narzędzi dla poszczególnych pokoi.
  - `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami dla poszczególnych pokoi. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza je z powrotem.
  - `groups.<room>.skills`: filtr umiejętności dla poszczególnych pokoi.
  - `groups.<room>.systemPrompt`: fragment promptu systemowego dla poszczególnych pokoi.

### Ustawienia zatwierdzania exec

- `execApprovals.enabled`: dostarczaj zatwierdzenia exec przez natywne prompty Matrix.
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnione do zatwierdzania. Wraca do `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (domyślnie), `"channel"` lub `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: opcjonalne listy dozwolonych agentów/sesji dla dostarczania.

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
