---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji Matrix
summary: Stan obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-04-24T08:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix to dołączony Plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony Plugin

Matrix jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc standardowe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Matrix, zainstaluj
go ręcznie:

Instalacja z npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalacja z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Zobacz [Plugins](/pl/tools/plugin), aby poznać zachowanie Pluginów i zasady instalacji.

## Konfiguracja

1. Upewnij się, że Plugin Matrix jest dostępny.
   - Bieżące spakowane wydania OpenClaw zawierają go już domyślnie.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix`, używając jednego z wariantów:
   - `homeserver` + `accessToken`, lub
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie Gateway.
5. Rozpocznij wiadomość prywatną z botem lub zaproś go do pokoju.
   - Nowe zaproszenia Matrix działają tylko wtedy, gdy zezwala na nie `channels.matrix.autoJoin`.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator Matrix pyta o:

- URL homeservera
- metodę uwierzytelniania: token dostępu lub hasło
- identyfikator użytkownika (tylko przy uwierzytelnianiu hasłem)
- opcjonalną nazwę urządzenia
- czy włączyć E2EE
- czy skonfigurować dostęp do pokoi i automatyczne dołączanie do zaproszeń

Kluczowe zachowania kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją, a to konto nie ma jeszcze zapisanego uwierzytelniania w konfiguracji, kreator oferuje skrót do korzystania ze zmiennych środowiskowych, aby zachować uwierzytelnianie w env.
- Nazwy kont są normalizowane do identyfikatora konta. Na przykład `Ops Bot` staje się `ops-bot`.
- Wpisy listy dozwolonych dla wiadomości prywatnych akceptują bezpośrednio `@user:server`; nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie dokładnie jedno dopasowanie.
- Wpisy listy dozwolonych dla pokoi akceptują bezpośrednio identyfikatory i aliasy pokoi. Preferuj `!room:server` lub `#alias:server`; nierozwiązane nazwy są ignorowane w czasie działania podczas rozwiązywania listy dozwolonych.
- W trybie listy dozwolonych dla automatycznego dołączania do zaproszeń używaj tylko stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane.
- Aby rozwiązać nazwy pokoi przed zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ma domyślnie wartość `off`.

Jeśli pozostawisz to ustawienie nieustawione, bot nie będzie dołączać do zaproszonych pokoi ani nowych zaproszeń w stylu wiadomości prywatnych, więc nie pojawi się w nowych grupach ani zaproszonych wiadomościach prywatnych, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia akceptuje, lub ustaw `autoJoin: "always"`, jeśli chcesz, aby dołączał do każdego zaproszenia.

W trybie `allowlist` `autoJoinAllowlist` akceptuje tylko `!roomId:server`, `#alias:server` lub `*`.
</Warning>

Przykład listy dozwolonych:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Dołączanie do każdego zaproszenia:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

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
Gdy zbuforowane poświadczenia tam istnieją, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby setupu, doctora i wykrywania stanu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki w zmiennych środowiskowych (używane, gdy klucz konfiguracji nie jest ustawiony):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Dla kont innych niż domyślne użyj zmiennych środowiskowych przypisanych do konta:

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

Matrix ucieka znaki interpunkcyjne w identyfikatorach kont, aby zmienne środowiskowe przypisane do kont nie kolidowały ze sobą.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót do zmiennych środowiskowych tylko wtedy, gdy te zmienne uwierzytelniania już istnieją i wybrane konto nie ma jeszcze zapisanego uwierzytelniania Matrix w konfiguracji.

`MATRIX_HOMESERVER` nie może być ustawione z obszaru roboczego `.env`; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

## Przykład konfiguracji

To praktyczna bazowa konfiguracja z parowaniem wiadomości prywatnych, listą dozwolonych pokoi i włączonym E2EE:

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

`autoJoin` dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń w stylu wiadomości prywatnych. OpenClaw nie potrafi niezawodnie
sklasyfikować zaproszonego pokoju jako wiadomości prywatnej lub grupy w momencie zaproszenia, więc wszystkie zaproszenia najpierw przechodzą przez `autoJoin`.
`dm.policy` ma zastosowanie po dołączeniu bota i sklasyfikowaniu pokoju jako wiadomości prywatnej.

## Podgląd strumieniowania

Strumieniowanie odpowiedzi Matrix jest opcjonalne.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał pojedynczą odpowiedź podglądową na żywo,
edytował ten podgląd w miejscu podczas generowania tekstu przez model, a następnie finalizował go po
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

- `streaming: "off"` to wartość domyślna. OpenClaw czeka na końcową odpowiedź i wysyła ją raz.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądową dla bieżącego bloku odpowiedzi asystenta przy użyciu zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie Matrix polegające na powiadamianiu najpierw o podglądzie, więc standardowe klienty mogą powiadamiać na podstawie pierwszego przesłanego tekstu podglądu zamiast gotowego bloku.
- `streaming: "quiet"` tworzy jedną edytowalną cichą informację podglądową dla bieżącego bloku odpowiedzi asystenta. Używaj tego tylko wtedy, gdy skonfigurujesz także reguły push odbiorców dla sfinalizowanych edycji podglądu.
- `blockStreaming: true` włącza oddzielne komunikaty postępu Matrix. Przy włączonym strumieniowaniu podglądu Matrix zachowuje szkic na żywo dla bieżącego bloku i pozostawia ukończone bloki jako osobne wiadomości.
- Gdy strumieniowanie podglądu jest włączone, a `blockStreaming` wyłączone, Matrix edytuje szkic na żywo w miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestaje mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do normalnego końcowego dostarczenia.
- Odpowiedzi z multimediami nadal wysyłają załączniki w normalny sposób. Jeśli nie można już bezpiecznie użyć starego podglądu, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi z multimediami.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw strumieniowanie wyłączone, jeśli chcesz najbardziej zachowawczego zachowania względem limitów szybkości.

`blockStreaming` samo w sobie nie włącza podglądów szkiców.
Użyj `streaming: "partial"` lub `streaming: "quiet"` dla edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz również, aby ukończone bloki asystenta pozostawały widoczne jako osobne komunikaty postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania najpierw podgląd lub pozostaw `streaming` wyłączone dla dostarczania tylko finalnej odpowiedzi. Przy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą wiadomość Matrix generującą powiadomienie.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą wiadomość Matrix generującą powiadomienie.

### Reguły push dla samodzielnie hostowanego serwera dla cichych sfinalizowanych podglądów

Ciche strumieniowanie (`streaming: "quiet"`) powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury — reguła push per użytkownik musi pasować do znacznika sfinalizowanego podglądu. Zobacz [Reguły push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules), aby poznać pełną konfigurację (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserverów).

## Pokoje bot-do-bota

Domyślnie wiadomości Matrix od innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, jeśli celowo chcesz włączyć ruch Matrix między agentami:

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
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy wyraźnie wspominają tego bota w pokojach. Wiadomości prywatne nadal są dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiedzi do siebie.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix w tym Gateway OpenClaw”.

Używaj ścisłych list dozwolonych pokoi i wymagań dotyczących wzmianek podczas włączania ruchu bot-do-bota we współdzielonych pokojach.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Niezaszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — Plugin wykrywa stan E2EE automatycznie.

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

Polecenia weryfikacji (wszystkie akceptują `--verbose` do diagnostyki i `--json` dla danych wyjściowych czytelnych maszynowo):

| Polecenie                                                      | Cel                                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Sprawdzenie stanu cross-signing i weryfikacji urządzenia                            |
| `openclaw matrix verify status --include-recovery-key --json`  | Dołączenie przechowywanego klucza odzyskiwania                                      |
| `openclaw matrix verify bootstrap`                             | Bootstrap cross-signing i weryfikacji (zobacz poniżej)                              |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Odrzucenie bieżącej tożsamości cross-signing i utworzenie nowej                     |
| `openclaw matrix verify device "<recovery-key>"`               | Weryfikacja tego urządzenia przy użyciu klucza odzyskiwania                         |
| `openclaw matrix verify backup status`                         | Sprawdzenie kondycji kopii zapasowej kluczy pokojów                                |
| `openclaw matrix verify backup restore`                        | Przywrócenie kluczy pokojów z kopii zapasowej serwera                              |
| `openclaw matrix verify backup reset --yes`                    | Usunięcie bieżącej kopii zapasowej i utworzenie nowej bazy odniesienia (może odtworzyć magazyn sekretów) |

W konfiguracjach wielokontowych polecenia Matrix CLI używają niejawnego domyślnego konta Matrix, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz jawnie kierować operacje weryfikacji lub urządzeń do nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Co oznacza zweryfikowany">
    OpenClaw traktuje urządzenie jako zweryfikowane tylko wtedy, gdy podpisze je Twoja własna tożsamość cross-signing. `verify status --verbose` pokazuje trzy sygnały zaufania:

    - `Locally trusted`: zaufane tylko przez tego klienta
    - `Cross-signing verified`: SDK zgłasza weryfikację przez cross-signing
    - `Signed by owner`: podpisane przez Twój własny klucz self-signing

    `Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecny jest cross-signing lub podpis właściciela. Samo lokalne zaufanie nie wystarcza.

  </Accordion>

  <Accordion title="Co robi bootstrap">
    `verify bootstrap` to polecenie naprawcze i konfiguracyjne dla kont szyfrowanych. W kolejności wykonuje ono:

    - bootstrap magazynu sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
    - bootstrap cross-signing i przesłanie brakujących publicznych kluczy cross-signing
    - oznaczenie i podpisanie bieżącego urządzenia przez cross-signing
    - utworzenie po stronie serwera kopii zapasowej kluczy pokojów, jeśli jeszcze nie istnieje

    Jeśli homeserver wymaga UIA do przesłania kluczy cross-signing, OpenClaw najpierw próbuje bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`). Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo odrzucasz bieżącą tożsamość.

  </Accordion>

  <Accordion title="Nowa baza odniesienia kopii zapasowej">
    Jeśli chcesz zachować działanie przyszłych szyfrowanych wiadomości i akceptujesz utratę nieodzyskiwalnej starej historii:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Dodaj `--account <id>`, aby wskazać nazwane konto. To może również odtworzyć magazyn sekretów, jeśli bieżącego sekretu kopii zapasowej nie można bezpiecznie załadować.

  </Accordion>

  <Accordion title="Zachowanie przy uruchomieniu">
    Przy `encryption: true` `startupVerification` ma domyślnie wartość `"if-unverified"`. Przy uruchomieniu niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując okres chłodzenia. Dostosuj to przez `startupVerificationCooldownHours` lub wyłącz przez `startupVerification: "off"`.

    Uruchomienie wykonuje także zachowawczy przebieg bootstrap crypto, który ponownie używa bieżącego magazynu sekretów i tożsamości cross-signing. Jeśli stan bootstrap jest uszkodzony, OpenClaw próbuje ostrożnej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga UIA z hasłem, uruchomienie zapisuje ostrzeżenie w logu i pozostaje niefatalne. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [Migracja Matrix](/pl/install/migrating-matrix), aby poznać pełny przebieg aktualizacji.

  </Accordion>

  <Accordion title="Powiadomienia o weryfikacji">
    Matrix publikuje komunikaty o cyklu życia weryfikacji w ścisłym pokoju wiadomości prywatnych do weryfikacji jako wiadomości `m.notice`: żądanie, gotowość (ze wskazówką „Verify by emoji”), rozpoczęcie/zakończenie oraz szczegóły SAS (emoji/liczby dziesiętne), gdy są dostępne.

    Przychodzące żądania z innego klienta Matrix są śledzone i automatycznie akceptowane. W przypadku samoweryfikacji OpenClaw automatycznie uruchamia przepływ SAS i potwierdza swoją stronę, gdy dostępna jest weryfikacja emoji — nadal musisz porównać i potwierdzić „They match” w swoim kliencie Matrix.

    Systemowe komunikaty o weryfikacji nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Higiena urządzeń">
    Mogą się gromadzić stare urządzenia zarządzane przez OpenClaw. Wyświetl je i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Magazyn kryptograficzny">
    Matrix E2EE używa oficjalnej ścieżki Rust crypto z `matrix-js-sdk` z `fake-indexeddb` jako shim IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia pliku).

    Zaszyfrowany stan wykonawczy znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, zrzut IDB, powiązania wątków oraz stan weryfikacji przy uruchomieniu. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, dzięki czemu wcześniejszy stan pozostaje widoczny.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, jeśli chcesz jawnie wskazać nazwane konto Matrix.

Matrix akceptuje bezpośrednio URL-e awatarów `mxc://`. Gdy przekażesz URL awatara `http://` lub `https://`, OpenClaw najpierw prześle go do Matrix i zapisze rozwiązany URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub do wybranego nadpisania konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla odpowiedzi automatycznych, jak i wysyłania przez narzędzie wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routing wiadomości prywatnych Matrix ograniczony do nadawcy, więc wiele pokoi DM może współdzielić jedną sesję, gdy wskazują tego samego rozmówcę.
- `dm.sessionScope: "per-room"` izoluje każdy pokój DM Matrix do własnego klucza sesji, nadal używając normalnych kontroli uwierzytelniania DM i listy dozwolonych.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.
- `threadReplies: "off"` utrzymuje odpowiedzi na najwyższym poziomie i zachowuje przychodzące wiadomości wątkowe w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy przychodząca wiadomość już znajdowała się w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi pokojowe w wątku zakorzenionym w wiadomości wywołującej i prowadzi tę konwersację przez odpowiadającą jej sesję ograniczoną do wątku od pierwszej wiadomości wywołującej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla wiadomości prywatnych. Na przykład możesz utrzymywać izolację wątków pokojów, pozostawiając wiadomości prywatne płaskie.
- Przychodzące wiadomości wątkowe zawierają główną wiadomość wątku jako dodatkowy kontekst dla agenta.
- Wysyłanie przez narzędzie wiadomości automatycznie dziedziczy bieżący wątek Matrix, gdy celem jest ten sam pokój lub ten sam użytkownik wiadomości prywatnych, chyba że podano jawne `threadId`.
- Ponowne użycie tego samego celu użytkownika DM w obrębie tej samej sesji uruchamia się tylko wtedy, gdy bieżące metadane sesji potwierdzają tego samego rozmówcę DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routingu ograniczonego do użytkownika.
- Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM we współdzielonej sesji DM Matrix, publikuje jednorazowe `m.notice` w tym pokoju z mechanizmem wyjścia `/focus`, gdy włączone są powiązania wątków oraz podpowiedź `dm.sessionScope`.
- Powiązania wątków w czasie działania są obsługiwane dla Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz związane z wątkiem `/acp spawn` działają w pokojach i wiadomościach prywatnych Matrix.
- Najwyższego poziomu `/focus` w pokoju/DM Matrix tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania konwersacji ACP

Pokoje Matrix, wiadomości prywatne i istniejące wątki Matrix można przekształcić w trwałe obszary robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz wiadomości prywatnej Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W najwyższego poziomu wiadomości prywatnej lub pokoju Matrix bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- W istniejącym wątku Matrix `--bind here` wiąże ten bieżący wątek na miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnAcpSessions` jest wymagane tylko dla `/acp spawn --thread auto|here`, gdy OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązania wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings`, a także obsługuje nadpisania per kanał:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flagi uruchamiania z powiązaniem wątku Matrix są opcjonalne:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby zezwolić, by najwyższego poziomu `/focus` tworzył i wiązał nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby zezwolić, by `/acp spawn --thread auto|here` wiązał sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące działania reakcji, przychodzące powiadomienia o reakcjach i przychodzące reakcje potwierdzające.

- Narzędzia wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do określonego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla określonego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota na tym zdarzeniu.
- `remove: true` usuwa tylko określoną reakcję emoji z konta bota.

Zakres reakcji potwierdzających jest rozwiązywany w standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- ustawienie awaryjne emoji tożsamości agenta

Zakres reakcji potwierdzających jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy są skierowane do wiadomości Matrix napisanych przez bota.
- `reactionNotifications: "off"` wyłącza systemowe zdarzenia reakcji.
- Usunięcia reakcji nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix pokazuje je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` określa, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość z pokoju Matrix uruchamia agenta. Ustawienie awaryjne to `messages.groupChat.historyLimit`; jeśli oba są nieustawione, skuteczna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. Wiadomości prywatne nadal używają zwykłej historii sesji.
- Historia pokoju Matrix obejmuje tylko oczekujące wiadomości: OpenClaw buforuje wiadomości z pokoju, które nie wywołały jeszcze odpowiedzi, a następnie zapisuje zrzut tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby dla tego samego zdarzenia Matrix ponownie używają oryginalnego zrzutu historii zamiast przesuwać się do przodu do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` jest ustawieniem domyślnym. Uzupełniający kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność kontekstu uzupełniającego, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja wyzwalacza nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i zasad wiadomości prywatnych.

## Zasady wiadomości prywatnych i pokoi

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

Zobacz [Grupy](/pl/channels/groups), aby poznać zachowanie bramkowania wzmiankami i list dozwolonych.

Przykład parowania dla wiadomości prywatnych Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła Ci wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może ponownie wysłać odpowiedź przypominającą po krótkim okresie chłodzenia zamiast generować nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania wiadomości prywatnych i układ przechowywania.

## Naprawa bezpośredniego pokoju

Jeśli stan wiadomości bezpośrednich się rozjedzie, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują na stare pokoje solo zamiast na aktywną wiadomość prywatną. Sprawdź bieżące mapowanie dla rozmówcy za pomocą:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je za pomocą:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Przepływ naprawy:

- preferuje ścisłą wiadomość prywatną 1:1, która jest już zmapowana w `m.direct`
- w przeciwnym razie przechodzi do dowolnej aktualnie dołączonej ścisłej wiadomości prywatnej 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje zdrowa wiadomość prywatna

Przepływ naprawy nie usuwa automatycznie starych pokoi. Wybiera tylko zdrową wiadomość prywatną i aktualizuje mapowanie, aby nowe wysyłki Matrix, komunikaty weryfikacyjne i inne przepływy wiadomości bezpośrednich ponownie trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń dla konta Matrix. Natywne
ustawienia routingu wiadomości prywatnych/kanałów nadal znajdują się w konfiguracji zatwierdzeń exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalne; ustawienie awaryjne to `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia, gdy `enabled` jest nieustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego. Zatwierdzenia exec najpierw używają `execApprovals.approvers` i mogą przejść awaryjnie do `channels.matrix.dm.allowFrom`. Zatwierdzenia Pluginów autoryzują się przez `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzeń wracają do innych skonfigurowanych ścieżek zatwierdzania lub do zasad awaryjnych zatwierdzania.

Natywny routing Matrix obsługuje oba rodzaje zatwierdzeń:

- `channels.matrix.execApprovals.*` kontroluje natywny tryb rozsyłania do wiadomości prywatnych/kanałów dla promptów zatwierdzeń Matrix.
- Zatwierdzenia exec używają zestawu zatwierdzających exec z `execApprovals.approvers` lub `channels.matrix.dm.allowFrom`.
- Zatwierdzenia Pluginów używają listy dozwolonych wiadomości prywatnych Matrix z `channels.matrix.dm.allowFrom`.
- Skróty reakcji Matrix i aktualizacje wiadomości mają zastosowanie zarówno do zatwierdzeń exec, jak i zatwierdzeń Pluginów.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzeń do wiadomości prywatnych zatwierdzających
- `target: "channel"` wysyła prompt z powrotem do źródłowego pokoju lub wiadomości prywatnej Matrix
- `target: "both"` wysyła do wiadomości prywatnych zatwierdzających oraz do źródłowego pokoju lub wiadomości prywatnej Matrix

Prompty zatwierdzeń Matrix inicjują skróty reakcji w podstawowej wiadomości zatwierdzenia:

- `✅` = zezwól raz
- `❌` = odmów
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez skuteczne zasady exec

Zatwierdzający mogą reagować na tę wiadomość lub użyć awaryjnych poleceń slash: `/approve <id> allow-once`, `/approve <id> allow-always` albo `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odrzucać. W przypadku zatwierdzeń exec dostarczanie do kanału zawiera tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Polecenia slash

Polecenia slash Matrix (na przykład `/new`, `/reset`, `/model`) działają bezpośrednio w wiadomościach prywatnych. W pokojach OpenClaw rozpoznaje także polecenia slash poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` uruchamia ścieżkę polecenia bez potrzeby ustawiania niestandardowego regexu wzmianki. Dzięki temu bot zachowuje responsywność na posty w stylu pokojów `@mention /command`, które Element i podobne klienty wysyłają, gdy użytkownik uzupełnia nazwę bota tabulatorem przed wpisaniem polecenia.

Zasady autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać zasady listy dozwolonych lub właściciela dla wiadomości prywatnych albo pokoi, tak jak w przypadku zwykłych wiadomości.

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

Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla nazwanych kont, chyba że konto je nadpisuje.
Możesz ograniczyć dziedziczone wpisy pokoi do jednego konta Matrix za pomocą `groups.<room>.account`.
Wpisy bez `account` pozostają współdzielone przez wszystkie konta Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw tworzy syntetycznie najwyższego poziomu konto `default` tylko wtedy, gdy to domyślne konto ma bieżące uwierzytelnienie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta nadal mogą pozostać wykrywalne przy `homeserver` plus `userId`, gdy później zbuforowane poświadczenia spełnią wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, naprawa/promocja konfiguracji z jednego konta do wielu kont zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Tylko klucze uwierzytelniania/bootstrap Matrix są przenoszone do tego promowanego konta; współdzielone klucze zasad dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix do niejawnego routingu, sondowania i operacji CLI.
Jeśli skonfigurowano wiele kont Matrix i jeden identyfikator konta to `default`, OpenClaw używa tego konta niejawnie nawet wtedy, gdy `defaultAccount` nie jest ustawione.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` lub przekazuj `--account <id>` do poleceń CLI, które opierają się na niejawnym wyborze konta.
Przekaż `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla jednego polecenia.

Zobacz [Dokumentacja referencyjna konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix ze względu na ochronę SSRF, chyba że
jawnie włączysz to per konto.

Jeśli Twój homeserver działa na localhost, adresie LAN/Tailscale lub wewnętrznej nazwie hosta, włącz
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

Przykład konfiguracji w CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

To ustawienie opcjonalne zezwala tylko na zaufane cele prywatne/wewnętrzne. Publiczne homeservery działające po jawnym HTTP, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. Jeśli to możliwe, preferuj `https://`.

## Używanie proxy dla ruchu Matrix

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

Nazwane konta mogą nadpisać domyślne ustawienie najwyższego poziomu przez `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy zarówno dla ruchu Matrix w czasie działania, jak i dla sond stanu konta.

## Rozwiązywanie celów

Matrix akceptuje następujące formy celu wszędzie tam, gdzie OpenClaw prosi o wskazanie pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie w katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwanie użytkowników odpytuje katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwanie pokoi akceptuje bezpośrednio jawne identyfikatory i aliasy pokoi, a następnie awaryjnie przechodzi do wyszukiwania nazw dołączonych pokoi dla tego konta.
- Wyszukiwanie po nazwie wśród dołączonych pokoi jest realizowane w trybie best-effort. Jeśli nie da się rozwiązać nazwy pokoju do identyfikatora lub aliasu, jest ona ignorowana podczas rozwiązywania listy dozwolonych w czasie działania.

## Dokumentacja referencyjna konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwala temu kontu Matrix na łączenie się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver wskazuje na `localhost`, adres LAN/Tailscale lub wewnętrzny host, taki jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisać domyślne ustawienie najwyższego poziomu własnym `proxy`.
- `userId`: pełny identyfikator użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: token dostępu do uwierzytelniania opartego na tokenie. Dla `channels.matrix.accessToken` oraz `channels.matrix.accounts.<id>.accessToken` obsługiwane są wartości w postaci jawnego tekstu i wartości SecretRef we wszystkich dostawcach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości w postaci jawnego tekstu i wartości SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia przy logowaniu hasłem.
- `avatarUrl`: przechowywany URL własnego awatara na potrzeby synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchomieniu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: gdy ma wartość `true`, podnosi zasadę pokoju `open` do `allowlist` i wymusza `allowlist` dla wszystkich aktywnych zasad wiadomości prywatnych z wyjątkiem `disabled` (w tym `pairing` i `open`). Nie wpływa na zasady `disabled`.
- `allowBots`: zezwala na wiadomości od innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` lub `disabled`.
- `contextVisibility`: tryb widoczności uzupełniającego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu pokojowego. Najbezpieczniejsze są pełne identyfikatory użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy uruchomieniu oraz po zmianie listy dozwolonych, gdy monitor działa. Nierozwiązane nazwy są ignorowane.
- `historyLimit`: maksymalna liczba wiadomości z pokoju do uwzględnienia jako kontekst historii grupy. Ustawienie awaryjne to `messages.groupChat.historyLimit`; jeśli oba są nieustawione, skuteczna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` lub `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `"partial"`, `"quiet"`, `true` lub `false`. `"partial"` i `true` włączają aktualizacje szkiców w trybie najpierw podgląd przy użyciu zwykłych wiadomości tekstowych Matrix. `"quiet"` używa podglądów w postaci niepowiadamiających komunikatów dla konfiguracji z własnymi regułami push. `false` jest równoważne z `"off"`.
- `blockStreaming`: wartość `true` włącza oddzielne komunikaty postępu dla ukończonych bloków asystenta, gdy aktywne jest strumieniowanie podglądu szkicu.
- `threadReplies`: `off`, `inbound` lub `always`.
- `threadBindings`: nadpisania per kanał dla routingu sesji i cyklu życia powiązanych z wątkiem.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy uruchomieniu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: okres chłodzenia przed ponowną próbą automatycznych żądań weryfikacji przy uruchomieniu.
- `textChunkLimit`: rozmiar fragmentu wiadomości wychodzącej w znakach (ma zastosowanie, gdy `chunkMode` ma wartość `length`).
- `chunkMode`: `length` dzieli wiadomości według liczby znaków; `newline` dzieli na granicach linii.
- `responsePrefix`: opcjonalny ciąg dodawany na początku wszystkich odpowiedzi wychodzących dla tego kanału.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzającej dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzającej (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania przychodzących multimediów.
- `autoJoin`: zasada automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń w stylu wiadomości prywatnych.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do identyfikatorów pokoi podczas obsługi zaproszeń; OpenClaw nie ufa stanowi aliasu zgłaszanemu przez zaproszony pokój.
- `dm`: blok zasad wiadomości prywatnych (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do wiadomości prywatnych po dołączeniu OpenClaw do pokoju i sklasyfikowaniu go jako wiadomości prywatnej. Nie zmienia tego, czy zaproszenie jest automatycznie przyjmowane.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu wiadomości prywatnych. Najbezpieczniejsze są pełne identyfikatory użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy uruchomieniu oraz po zmianie listy dozwolonych, gdy monitor działa. Nierozwiązane nazwy są ignorowane.
- `dm.sessionScope`: `per-user` (domyślnie) lub `per-room`. Użyj `per-room`, jeśli chcesz, aby każdy pokój DM Matrix zachowywał oddzielny kontekst, nawet jeśli rozmówca jest ten sam.
- `dm.threadReplies`: nadpisanie zasad wątków tylko dla wiadomości prywatnych (`off`, `inbound`, `always`). Nadpisuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umiejscowienia odpowiedzi, jak i izolacji sesji w wiadomościach prywatnych.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec w Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnionych do zatwierdzania żądań exec. Opcjonalne, gdy `dm.allowFrom` już wskazuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa zasad per pokój. Preferuj identyfikatory pokoi lub aliasy; nierozwiązane nazwy pokoi są ignorowane w czasie działania. Tożsamość sesji/grupy używa stabilnego identyfikatora pokoju po rozwiązaniu.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: lista dozwolonych nadawców per pokój.
- `groups.<room>.tools`: nadpisania dozwalania/zabraniania narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami na poziomie pokoju. `true` wyłącza wymóg wzmianek dla tego pokoju; `false` wymusza go ponownie.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment promptu systemowego na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: bramkowanie narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
