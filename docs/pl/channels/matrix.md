---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji w Matrix
summary: Stan obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-04-21T09:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00fa6201d2ee4ac4ae5be3eb18ff687c5c2c9ef70cff12af1413b4c311484b24
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix to dołączony plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony plugin

Matrix jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego buildu lub niestandardowej instalacji, która nie zawiera Matrix, zainstaluj
go ręcznie:

Zainstaluj z npm:

```bash
openclaw plugins install @openclaw/matrix
```

Zainstaluj z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Zobacz [Plugins](/pl/tools/plugin), aby poznać działanie pluginów i zasady instalacji.

## Konfiguracja

1. Upewnij się, że plugin Matrix jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
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
- metodę uwierzytelniania: access token lub hasło
- ID użytkownika (tylko uwierzytelnianie hasłem)
- opcjonalną nazwę urządzenia
- czy włączyć E2EE
- czy skonfigurować dostęp do pokoi i automatyczne dołączanie po zaproszeniu

Najważniejsze zachowania kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją, a to konto nie ma jeszcze zapisanych danych uwierzytelniania w konfiguracji, kreator oferuje skrót środowiskowy, aby pozostawić uwierzytelnianie w zmiennych środowiskowych.
- Nazwy kont są normalizowane do ID konta. Na przykład `Ops Bot` staje się `ops-bot`.
- Wpisy listy dozwolonych dla wiadomości prywatnych akceptują bezpośrednio `@user:server`; nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w aktywnym katalogu znajdzie dokładnie jedno dopasowanie.
- Wpisy listy dozwolonych dla pokoi akceptują bezpośrednio identyfikatory i aliasy pokoi. Preferuj `!room:server` lub `#alias:server`; nierozwiązane nazwy są ignorowane w czasie działania podczas rozwiązywania listy dozwolonych.
- W trybie listy dozwolonych dla automatycznego dołączania po zaproszeniu używaj tylko stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane.
- Aby rozwiązać nazwy pokoi przed zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
Domyślna wartość `channels.matrix.autoJoin` to `off`.

Jeśli pozostawisz tę opcję nieustawioną, bot nie będzie dołączać do zaproszonych pokoi ani do nowych zaproszeń w stylu wiadomości prywatnych, więc nie pojawi się w nowych grupach ani zaproszonych wiadomościach prywatnych, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia akceptuje, albo ustaw `autoJoin: "always"`, jeśli chcesz, aby dołączał do każdego zaproszenia.

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

Dołączaj do każdego zaproszenia:

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
Konto domyślne używa `credentials.json`; konta nazwane używają `credentials-<account>.json`.
Gdy zbuforowane poświadczenia istnieją w tej lokalizacji, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby konfiguracji, doctor i wykrywania stanu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki zmiennych środowiskowych (używane, gdy klucz konfiguracyjny nie jest ustawiony):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Dla kont innych niż domyślne użyj zmiennych środowiskowych z zakresem konta:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Przykład dla konta `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Dla znormalizowanego ID konta `ops-bot` użyj:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix zamienia znaki interpunkcyjne w ID kont, aby zmienne środowiskowe z zakresem konta nie powodowały kolizji.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót do zmiennych środowiskowych tylko wtedy, gdy te zmienne uwierzytelniania już istnieją, a wybrane konto nie ma jeszcze zapisanych danych uwierzytelniania Matrix w konfiguracji.

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

`autoJoin` ma zastosowanie do wszystkich zaproszeń Matrix, w tym do zaproszeń w stylu wiadomości prywatnych. OpenClaw nie może niezawodnie
sklasyfikować zaproszonego pokoju jako wiadomości prywatnej lub grupy w momencie zaproszenia, więc wszystkie zaproszenia najpierw przechodzą przez `autoJoin`.
`dm.policy` ma zastosowanie po tym, jak bot dołączy i pokój zostanie sklasyfikowany jako wiadomość prywatna.

## Podglądy strumieniowania

Strumieniowanie odpowiedzi Matrix jest opcjonalne.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał jedną aktywną odpowiedź podglądową,
edytował ten podgląd na miejscu, gdy model generuje tekst, a następnie finalizował go po
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

- `streaming: "off"` to wartość domyślna. OpenClaw czeka na końcową odpowiedź i wysyła ją jeden raz.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądową dla bieżącego bloku odpowiedzi asystenta, używając zwykłych wiadomości tekstowych Matrix. Zachowuje to historyczne zachowanie Matrix polegające na powiadomieniu najpierw o podglądzie, więc standardowe klienty mogą powiadamiać o pierwszym strumieniowanym tekście podglądu zamiast o ukończonym bloku.
- `streaming: "quiet"` tworzy jedno edytowalne ciche powiadomienie podglądowe dla bieżącego bloku odpowiedzi asystenta. Używaj tego tylko wtedy, gdy skonfigurujesz też reguły push odbiorców dla sfinalizowanych edycji podglądu.
- `blockStreaming: true` włącza osobne wiadomości postępu Matrix. Przy włączonym strumieniowaniu podglądu Matrix zachowuje aktywny szkic dla bieżącego bloku i pozostawia ukończone bloki jako osobne wiadomości.
- Gdy strumieniowanie podglądu jest włączone, a `blockStreaming` jest wyłączone, Matrix edytuje aktywny szkic na miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestanie mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzyma strumieniowanie podglądu i wróci do zwykłego końcowego dostarczenia.
- Odpowiedzi multimedialne nadal wysyłają załączniki normalnie. Jeśli nieaktualnego podglądu nie da się już bezpiecznie użyć ponownie, OpenClaw usunie go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Edycje podglądu powodują dodatkowe wywołania API Matrix. Pozostaw strumieniowanie wyłączone, jeśli chcesz zachować najbardziej ostrożne podejście do limitów szybkości.

`blockStreaming` samo w sobie nie włącza szkiców podglądu.
Użyj `streaming: "partial"` lub `streaming: "quiet"` do edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz też, aby ukończone bloki asystenta pozostawały widoczne jako osobne wiadomości postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania najpierw podgląd albo pozostaw `streaming` wyłączone dla dostarczenia tylko wersji końcowej. Przy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą powiadamiającą wiadomość Matrix.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą powiadamiającą wiadomość Matrix.

### Samohostowane reguły push dla cichych sfinalizowanych podglądów

Jeśli uruchamiasz własną infrastrukturę Matrix i chcesz, aby ciche podglądy wysyłały powiadomienie dopiero po zakończeniu bloku lub
końcowej odpowiedzi, ustaw `streaming: "quiet"` i dodaj regułę push per użytkownik dla sfinalizowanych edycji podglądu.

Zwykle jest to konfiguracja po stronie użytkownika-odbiorcy, a nie globalna zmiana konfiguracji homeservera:

Szybka mapa przed rozpoczęciem:

- użytkownik odbiorca = osoba, która ma otrzymać powiadomienie
- użytkownik bota = konto Matrix OpenClaw wysyłające odpowiedź
- do poniższych wywołań API użyj access tokena użytkownika odbiorcy
- w regule push dopasuj `sender` do pełnego MXID użytkownika bota

1. Skonfiguruj OpenClaw do używania cichych podglądów:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Upewnij się, że konto odbiorcy już otrzymuje zwykłe powiadomienia push Matrix. Reguły cichych podglądów
   działają tylko wtedy, gdy ten użytkownik ma już działające pushery/urządzenia.

3. Pobierz access token użytkownika odbiorcy.
   - Użyj tokena użytkownika odbierającego, nie tokena bota.
   - Najłatwiej zwykle ponownie wykorzystać token istniejącej sesji klienta.
   - Jeśli musisz wygenerować nowy token, możesz zalogować się przez standardowe API Client-Server Matrix:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Sprawdź, czy konto odbiorcy ma już pushery:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jeśli to zwróci brak aktywnych pusherów/urządzeń, najpierw napraw zwykłe powiadomienia Matrix, zanim dodasz
poniższą regułę OpenClaw.

OpenClaw oznacza sfinalizowane edycje podglądu tylko tekstowego następującym znacznikiem:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Utwórz regułę push typu override dla każdego konta odbiorcy, które ma otrzymywać te powiadomienia:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Zastąp te wartości przed uruchomieniem polecenia:

- `https://matrix.example.org`: bazowy URL twojego homeservera
- `$USER_ACCESS_TOKEN`: access token użytkownika odbierającego
- `openclaw-finalized-preview-botname`: ID reguły unikalne dla tego bota dla tego użytkownika odbierającego
- `@bot:example.org`: MXID twojego bota Matrix OpenClaw, a nie MXID użytkownika odbierającego

Ważne w konfiguracjach z wieloma botami:

- Reguły push są kluczowane przez `ruleId`. Ponowne uruchomienie `PUT` dla tego samego ID reguły aktualizuje tę jedną regułę.
- Jeśli jeden użytkownik odbierający ma otrzymywać powiadomienia dla wielu kont botów Matrix OpenClaw, utwórz jedną regułę na bota z unikalnym ID reguły dla każdego dopasowania nadawcy.
- Prostym wzorcem jest `openclaw-finalized-preview-<botname>`, na przykład `openclaw-finalized-preview-ops` lub `openclaw-finalized-preview-support`.

Reguła jest oceniana względem nadawcy zdarzenia:

- uwierzytelnij się tokenem użytkownika odbierającego
- dopasuj `sender` do MXID bota OpenClaw

6. Sprawdź, czy reguła istnieje:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Przetestuj odpowiedź strumieniowaną. W trybie cichym pokój powinien pokazać cichy szkic podglądu, a końcowa
   edycja na miejscu powinna wysłać powiadomienie po zakończeniu bloku lub tury.

Jeśli później trzeba usunąć regułę, usuń to samo ID reguły tokenem użytkownika odbierającego:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Uwagi:

- Utwórz regułę przy użyciu access tokena użytkownika odbierającego, a nie tokena bota.
- Nowe reguły `override` zdefiniowane przez użytkownika są wstawiane przed domyślnymi regułami tłumienia, więc nie jest potrzebny dodatkowy parametr kolejności.
- Dotyczy to tylko edycji podglądu tylko tekstowego, które OpenClaw może bezpiecznie sfinalizować na miejscu. Rezerwy dla multimediów i rezerwy dla nieaktualnych podglądów nadal używają zwykłego dostarczania Matrix.
- Jeśli `GET /_matrix/client/v3/pushers` nie pokazuje żadnych pusherów, użytkownik nie ma jeszcze działającego dostarczania powiadomień push Matrix dla tego konta/urządzenia.

#### Synapse

W przypadku Synapse powyższa konfiguracja zwykle sama w sobie wystarcza:

- Nie jest wymagana żadna specjalna zmiana `homeserver.yaml` dla powiadomień o sfinalizowanych podglądach OpenClaw.
- Jeśli wdrożenie Synapse już wysyła zwykłe powiadomienia push Matrix, głównym krokiem konfiguracji jest powyższy token użytkownika + wywołanie `pushrules`.
- Jeśli uruchamiasz Synapse za reverse proxy lub workerami, upewnij się, że `/_matrix/client/.../pushrules/` poprawnie trafia do Synapse.
- Jeśli używasz workerów Synapse, upewnij się, że pushery działają prawidłowo. Dostarczanie push jest obsługiwane przez główny proces albo `synapse.app.pusher` / skonfigurowane workery pusherów.

#### Tuwunel

Dla Tuwunel użyj tego samego przepływu konfiguracji i wywołania API `pushrules`, które pokazano powyżej:

- Nie jest wymagana żadna konfiguracja specyficzna dla Tuwunel dla samego znacznika sfinalizowanego podglądu.
- Jeśli zwykłe powiadomienia Matrix już działają dla tego użytkownika, głównym krokiem konfiguracji jest powyższy token użytkownika + wywołanie `pushrules`.
- Jeśli wydaje się, że powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy włączono `suppress_push_when_active`. Tuwunel dodał tę opcję w Tuwunel 1.4.2 12 września 2025 r. i może ona celowo tłumić powiadomienia push na innych urządzeniach, gdy jedno urządzenie jest aktywne.

## Pokoje bot-do-bota

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
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach wyraźnie wspominają tego bota. Wiadomości prywatne nadal są dozwolone.
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości z tego samego ID użytkownika Matrix, aby uniknąć pętli odpowiedzi do samego siebie.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym Gateway OpenClaw”.

Podczas włączania ruchu bot-do-bota we współdzielonych pokojach używaj ścisłych list dozwolonych pokoi i wymagań dotyczących wzmianek.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, więc podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Niezaszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — plugin automatycznie wykrywa stan E2EE.

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

Sprawdź stan weryfikacji:

```bash
openclaw matrix verify status
```

Szczegółowy stan (pełna diagnostyka):

```bash
openclaw matrix verify status --verbose
```

Uwzględnij zapisany klucz odzyskiwania w danych wyjściowych czytelnych maszynowo:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Zainicjuj stan cross-signing i weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Szczegółowa diagnostyka bootstrapu:

```bash
openclaw matrix verify bootstrap --verbose
```

Wymuś świeży reset tożsamości cross-signing przed bootstrapem:

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

Usuń bieżącą kopię zapasową na serwerze i utwórz nową bazę kopii zapasowej. Jeśli zapisany
klucz kopii zapasowej nie może zostać poprawnie wczytany, ten reset może też odtworzyć magazyn sekretów, aby
przyszłe zimne starty mogły wczytać nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (w tym ciche wewnętrzne logowanie SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
Podczas skryptowania użyj `--json`, aby uzyskać pełne dane wyjściowe czytelne maszynowo.

W konfiguracjach wielokontowych polecenia Matrix CLI używają niejawnego domyślnego konta Matrix, chyba że podasz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, kiedy chcesz, aby operacje weryfikacji lub urządzenia jawnie kierowały do nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

### Co oznacza „zweryfikowane”

OpenClaw traktuje to urządzenie Matrix jako zweryfikowane tylko wtedy, gdy zostało zweryfikowane przez twoją własną tożsamość cross-signing.
W praktyce `openclaw matrix verify status --verbose` ujawnia trzy sygnały zaufania:

- `Locally trusted`: to urządzenie jest zaufane tylko przez bieżącego klienta
- `Cross-signing verified`: SDK zgłasza urządzenie jako zweryfikowane przez cross-signing
- `Signed by owner`: urządzenie jest podpisane przez twój własny klucz self-signing

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecna jest weryfikacja cross-signing lub podpis właściciela.
Samo lokalne zaufanie nie wystarcza, aby OpenClaw traktował urządzenie jako w pełni zweryfikowane.

### Co robi bootstrap

`openclaw matrix verify bootstrap` to polecenie naprawy i konfiguracji dla zaszyfrowanych kont Matrix.
Wykonuje kolejno wszystkie poniższe czynności:

- inicjalizuje magazyn sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjalizuje cross-signing i wysyła brakujące publiczne klucze cross-signing
- próbuje oznaczyć i podpisać bieżące urządzenie przez cross-signing
- tworzy nową kopię zapasową kluczy pokoju po stronie serwera, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga interaktywnego uwierzytelniania do przesłania kluczy cross-signing, OpenClaw najpierw próbuje przesłać je bez uwierzytelniania, potem z `m.login.dummy`, a następnie z `m.login.password`, gdy skonfigurowano `channels.matrix.password`.

Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo chcesz porzucić bieżącą tożsamość cross-signing i utworzyć nową.

Jeśli celowo chcesz porzucić bieżącą kopię zapasową kluczy pokoju i rozpocząć nową
bazę kopii zapasowej dla przyszłych wiadomości, użyj `openclaw matrix verify backup reset --yes`.
Rób to tylko wtedy, gdy akceptujesz, że nieodwracalnie utracona stara zaszyfrowana historia pozostanie
niedostępna i że OpenClaw może odtworzyć magazyn sekretów, jeśli bieżącego sekretu
kopii zapasowej nie da się bezpiecznie wczytać.

### Świeża baza kopii zapasowej

Jeśli chcesz zachować działanie przyszłych zaszyfrowanych wiadomości i akceptujesz utratę nieodzyskiwalnej starej historii, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Dodaj `--account <id>` do każdego polecenia, jeśli chcesz jawnie kierować do nazwanego konta Matrix.

### Zachowanie przy uruchomieniu

Gdy `encryption: true`, Matrix domyślnie ustawia `startupVerification` na `"if-unverified"`.
Przy uruchomieniu, jeśli to urządzenie nadal nie jest zweryfikowane, Matrix poprosi o samoweryfikację w innym kliencie Matrix,
pominie zduplikowane żądania, jeśli jedno już oczekuje, i zastosuje lokalny cooldown przed ponowną próbą po restartach.
Nieudane próby wysłania żądania domyślnie są ponawiane szybciej niż przypadki pomyślnego utworzenia żądania.
Ustaw `startupVerification: "off"`, aby wyłączyć automatyczne żądania przy uruchomieniu, lub dostosuj `startupVerificationCooldownHours`,
jeśli chcesz krótsze albo dłuższe okno ponawiania.

Uruchomienie wykonuje też automatycznie konserwatywne przejście bootstrapu kryptografii.
To przejście najpierw próbuje ponownie użyć bieżącego magazynu sekretów i tożsamości cross-signing oraz unika resetowania cross-signing, chyba że uruchomisz jawny przepływ naprawczy bootstrapu.

Jeśli przy uruchomieniu nadal zostanie wykryty uszkodzony stan bootstrapu, OpenClaw może spróbować chronionej ścieżki naprawczej nawet wtedy, gdy `channels.matrix.password` nie jest skonfigurowane.
Jeśli homeserver wymaga uwierzytelniania UIA opartego na haśle do tej naprawy, OpenClaw zapisuje ostrzeżenie i utrzymuje uruchomienie jako niefatalne zamiast przerywać działanie bota.
Jeśli bieżące urządzenie jest już podpisane przez właściciela, OpenClaw zachowuje tę tożsamość zamiast resetować ją automatycznie.

Pełny przepływ aktualizacji, ograniczenia, polecenia odzyskiwania i typowe komunikaty migracji znajdziesz w [Matrix migration](/pl/install/migrating-matrix).

### Powiadomienia weryfikacyjne

Matrix publikuje powiadomienia o cyklu życia weryfikacji bezpośrednio w ścisłym pokoju wiadomości prywatnych weryfikacji jako wiadomości `m.notice`.
Obejmuje to:

- powiadomienia o żądaniu weryfikacji
- powiadomienia o gotowości do weryfikacji (z jawną wskazówką „Zweryfikuj przez emoji”)
- powiadomienia o rozpoczęciu i zakończeniu weryfikacji
- szczegóły SAS (emoji i liczby dziesiętne), gdy są dostępne

Przychodzące żądania weryfikacji z innego klienta Matrix są śledzone i automatycznie akceptowane przez OpenClaw.
W przepływach samoweryfikacji OpenClaw automatycznie uruchamia też przepływ SAS, gdy weryfikacja emoji staje się dostępna, i potwierdza swoją stronę.
W przypadku żądań weryfikacji od innego użytkownika/urządzenia Matrix OpenClaw automatycznie akceptuje żądanie, a następnie czeka, aż przepływ SAS będzie przebiegał normalnie.
Nadal musisz porównać emoji lub dziesiętny SAS w swoim kliencie Matrix i potwierdzić tam „Pasują”, aby ukończyć weryfikację.

OpenClaw nie akceptuje ślepo automatycznie duplikatów przepływów inicjowanych przez siebie. Przy uruchomieniu pomija tworzenie nowego żądania, jeśli żądanie samoweryfikacji już oczekuje.

Powiadomienia protokołowe/systemowe weryfikacji nie są przekazywane do potoku czatu agenta, więc nie powodują `NO_REPLY`.

### Higiena urządzeń

Na koncie mogą gromadzić się stare urządzenia Matrix zarządzane przez OpenClaw, co utrudnia ocenę zaufania w zaszyfrowanych pokojach.
Wyświetl ich listę za pomocą:

```bash
openclaw matrix devices list
```

Usuń nieaktualne urządzenia Matrix zarządzane przez OpenClaw za pomocą:

```bash
openclaw matrix devices prune-stale
```

### Magazyn kryptograficzny

Matrix E2EE używa oficjalnej ścieżki kryptografii Rust z `matrix-js-sdk` w Node, z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany do pliku snapshotu (`crypto-idb-snapshot.json`) i odtwarzany przy uruchomieniu. Plik snapshotu jest wrażliwym stanem środowiska uruchomieniowego przechowywanym z restrykcyjnymi uprawnieniami do pliku.

Zaszyfrowany stan środowiska uruchomieniowego znajduje się pod korzeniami per konto i per skrót tokena użytkownika w
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ten katalog zawiera magazyn synchronizacji (`bot-storage.json`), magazyn kryptograficzny (`crypto/`),
plik klucza odzyskiwania (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
powiązania wątków (`thread-bindings.json`) oraz stan weryfikacji przy uruchomieniu (`startup-verification.json`).
Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego
korzenia dla tej krotki konto/homeserver/użytkownik, aby poprzedni stan synchronizacji, stan kryptograficzny, powiązania wątków
i stan weryfikacji przy uruchomieniu nadal były widoczne.

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, jeśli chcesz jawnie kierować do nazwanego konta Matrix.

Matrix akceptuje bezpośrednio adresy URL awatarów `mxc://`. Gdy przekażesz adres URL awatara `http://` lub `https://`, OpenClaw najpierw przesyła go do Matrix, a następnie zapisuje rozwiązany adres URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub do nadpisania wybranego konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek przez narzędzie wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routowanie wiadomości prywatnych Matrix w zakresie nadawcy, więc wiele pokoi wiadomości prywatnych może współdzielić jedną sesję, gdy zostaną rozwiązane do tego samego peera.
- `dm.sessionScope: "per-room"` izoluje każdy pokój wiadomości prywatnych Matrix do własnego klucza sesji, nadal używając zwykłego uwierzytelniania wiadomości prywatnych i kontroli listy dozwolonych.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.
- `threadReplies: "off"` utrzymuje odpowiedzi na poziomie głównym i pozostawia przychodzące wiadomości wątkowe w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy przychodząca wiadomość już była w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi w pokoju w wątku zakorzenionym w wiadomości wyzwalającej i kieruje tę konwersację przez odpowiadającą jej sesję w zakresie wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` zastępuje ustawienie najwyższego poziomu tylko dla wiadomości prywatnych. Na przykład możesz zachować izolację wątków w pokojach, jednocześnie pozostawiając wiadomości prywatne płaskie.
- Przychodzące wiadomości wątkowe zawierają główną wiadomość wątku jako dodatkowy kontekst agenta.
- Wysyłki przez narzędzie wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celem jest ten sam pokój lub ten sam cel użytkownika wiadomości prywatnej, chyba że podano jawne `threadId`.
- Ponowne użycie celu użytkownika wiadomości prywatnej dla tej samej sesji uruchamia się tylko wtedy, gdy bieżące metadane sesji potwierdzają tego samego peera wiadomości prywatnej na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do zwykłego routowania w zakresie użytkownika.
- Gdy OpenClaw wykryje, że pokój wiadomości prywatnych Matrix koliduje z innym pokojem wiadomości prywatnych w tej samej współdzielonej sesji wiadomości prywatnych Matrix, publikuje jednorazowe `m.notice` w tym pokoju z mechanizmem awaryjnym `/focus`, gdy powiązania wątków są włączone i dostępna jest wskazówka `dm.sessionScope`.
- Powiązania wątków w czasie działania są obsługiwane dla Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach i wiadomościach prywatnych Matrix.
- Najwyższego poziomu `/focus` w pokoju lub wiadomości prywatnej Matrix tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania konwersacji ACP

Pokoje Matrix, wiadomości prywatne i istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz wiadomości prywatnej Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W wiadomości prywatnej lub pokoju Matrix na najwyższym poziomie bieżąca wiadomość prywatna/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
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

Flagi uruchamiania powiązanego z wątkiem w Matrix są opcjonalne:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby zezwolić, by najwyższego poziomu `/focus` tworzyło i wiązało nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby zezwolić, by `/acp spawn --thread auto|here` wiązało sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach i przychodzące reakcje potwierdzające.

- Narzędzia wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do konkretnego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla konkretnego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota na to zdarzenie.
- `remove: true` usuwa tylko określoną reakcję emoji z konta bota.

Zakres reakcji potwierdzających jest rozwiązywany według standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- rezerwowe emoji tożsamości agenta

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
- `reactionNotifications: "off"` wyłącza zdarzenia systemowe reakcji.
- Usunięcia reakcji nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix pokazuje je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` określa, ile ostatnich wiadomości pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość pokoju Matrix wyzwala agenta. Wraca do `messages.groupChat.historyLimit`; jeśli oba ustawienia nie są ustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. Wiadomości prywatne nadal używają zwykłej historii sesji.
- Historia pokoju Matrix jest tylko oczekująca: OpenClaw buforuje wiadomości pokoju, które jeszcze nie wywołały odpowiedzi, a następnie wykonuje snapshot tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównym ciele przychodzącym dla tej tury.
- Ponowne próby tego samego zdarzenia Matrix używają ponownie oryginalnego snapshotu historii zamiast przesuwać się do przodu do nowszych wiadomości pokoju.

## Widoczność kontekstu

Matrix obsługuje wspólną kontrolę `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` to wartość domyślna. Dodatkowy kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jeden jawnie cytowany fragment odpowiedzi.

To ustawienie wpływa na widoczność dodatkowego kontekstu, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja wyzwalaczy nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i polityki wiadomości prywatnych.

## Polityka wiadomości prywatnych i pokoi

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

Zobacz [Groups](/pl/channels/groups), aby poznać działanie ograniczania przez wzmianki i list dozwolonych.

Przykład parowania dla wiadomości prywatnych Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła do ciebie wiadomości przed zatwierdzeniem, OpenClaw używa ponownie tego samego oczekującego kodu parowania i może ponownie wysłać odpowiedź z przypomnieniem po krótkim czasie cooldown zamiast generować nowy kod.

Zobacz [Pairing](/pl/channels/pairing), aby poznać wspólny przepływ parowania wiadomości prywatnych i układ przechowywania.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości prywatnych przestanie być zsynchronizowany, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują stare pokoje solo zamiast aktywnej wiadomości prywatnej. Sprawdź bieżące mapowanie dla peera za pomocą:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je za pomocą:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Przepływ naprawy:

- preferuje ścisłą wiadomość prywatną 1:1, która jest już zmapowana w `m.direct`
- w przeciwnym razie wybiera dowolną obecnie dołączoną ścisłą wiadomość prywatną 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje żadna zdrowa wiadomość prywatna

Przepływ naprawy nie usuwa automatycznie starych pokoi. Wybiera tylko zdrową wiadomość prywatną i aktualizuje mapowanie, aby nowe wysyłki Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości prywatnych znów trafiały do właściwego pokoju.

## Zgody exec

Matrix może działać jako natywny klient zatwierdzania dla konta Matrix. Natywne
przełączniki routowania wiadomości prywatnych/kanałów nadal znajdują się w konfiguracji zatwierdzania exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalne; wraca do `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzanie, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego. Zgody exec najpierw używają `execApprovals.approvers` i mogą wracać do `channels.matrix.dm.allowFrom`. Zgody Plugin autoryzują przez `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzania. W przeciwnym razie żądania zatwierdzenia wracają do innych skonfigurowanych ścieżek zatwierdzania lub do polityki awaryjnej zatwierdzania.

Natywne routowanie Matrix obsługuje oba rodzaje zatwierdzeń:

- `channels.matrix.execApprovals.*` kontroluje natywny tryb rozsyłania DM/kanał dla promptów zatwierdzania Matrix.
- Zgody exec używają zestawu zatwierdzających exec z `execApprovals.approvers` lub `channels.matrix.dm.allowFrom`.
- Zgody Plugin używają listy dozwolonych wiadomości prywatnych Matrix z `channels.matrix.dm.allowFrom`.
- Skróty reakcji Matrix i aktualizacje wiadomości mają zastosowanie zarówno do zgód exec, jak i Plugin.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzenia do wiadomości prywatnych zatwierdzających
- `target: "channel"` wysyła prompt z powrotem do źródłowego pokoju lub wiadomości prywatnej Matrix
- `target: "both"` wysyła do wiadomości prywatnych zatwierdzających oraz do źródłowego pokoju lub wiadomości prywatnej Matrix

Prompty zatwierdzania Matrix inicjalizują skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` = zezwól raz
- `❌` = odmów
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez efektywną politykę exec

Zatwierdzający mogą zareagować na tę wiadomość lub użyć awaryjnych poleceń slash: `/approve <id> allow-once`, `/approve <id> allow-always` albo `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odmawiać. W przypadku zgód exec dostarczanie kanałowe zawiera tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Exec approvals](/pl/tools/exec-approvals)

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

Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla nazwanych kont, chyba że konto je nadpisze.
Możesz ograniczyć dziedziczone wpisy pokoi do jednego konta Matrix za pomocą `groups.<room>.account`.
Wpisy bez `account` pozostają współdzielone przez wszystkie konta Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw tworzy syntetycznie konto najwyższego poziomu `default` tylko wtedy, gdy to domyślne konto ma aktualne uwierzytelnianie (`homeserver` plus `accessToken`, albo `homeserver` plus `userId` i `password`); nazwane konta nadal mogą pozostać wykrywalne na podstawie `homeserver` plus `userId`, gdy zbuforowane poświadczenia później spełnią wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, naprawa/konfiguracja promująca z jednego konta do wielu kont zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Tylko klucze Matrix dotyczące uwierzytelniania/bootstrapu są przenoszone do tego promowanego konta; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix dla niejawnego routowania, sondowania i operacji CLI.
Jeśli skonfigurowano wiele kont Matrix i jedno ID konta to `default`, OpenClaw używa tego konta niejawnie nawet wtedy, gdy `defaultAccount` nie jest ustawione.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` albo przekazuj `--account <id>` w poleceniach CLI, które opierają się na niejawnym wyborze konta.
Przekaż `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla jednego polecenia.

Zobacz [Configuration reference](/pl/gateway/configuration-reference#multi-account-all-channels), aby poznać wspólny wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz je per konto.

Jeśli twój homeserver działa na localhost, adresie IP LAN/Tailscale lub wewnętrznej nazwie hosta, włącz
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

Przykład konfiguracji przez CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Ta zgoda obejmuje tylko zaufane prywatne/wewnętrzne cele. Publiczne homeservery działające po jawnym HTTP, takie jak
`http://matrix.example.org:8008`, pozostają blokowane. Jeśli to możliwe, preferuj `https://`.

## Używanie proxy dla ruchu Matrix

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

Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu przez `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy zarówno dla ruchu Matrix w czasie działania, jak i dla sond statusu konta.

## Rozwiązywanie celów

Matrix akceptuje te formy celu wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie w aktywnym katalogu używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokoi bezpośrednio akceptują jawne ID i aliasy pokoi, a następnie wracają do wyszukiwania nazw dołączonych pokoi dla tego konta.
- Wyszukiwanie nazw dołączonych pokoi działa w trybie best-effort. Jeśli nazwy pokoju nie da się rozwiązać do ID lub aliasu, jest ona ignorowana przez rozwiązywanie listy dozwolonych w czasie działania.

## Dokumentacja konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowane ID konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: zezwala temu kontu Matrix na łączenie się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver rozwiązuje się do `localhost`, adresu IP LAN/Tailscale lub hosta wewnętrznego, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu własnym `proxy`.
- `userId`: pełne ID użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: access token dla uwierzytelniania opartego na tokenie. Dla `channels.matrix.accessToken` i `channels.matrix.accounts.<id>.accessToken` obsługiwane są wartości jawnego tekstu i wartości SecretRef w providerach env/file/exec. Zobacz [Secrets Management](/pl/gateway/secrets).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości jawnego tekstu i wartości SecretRef.
- `deviceId`: jawne ID urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia dla logowania hasłem.
- `avatarUrl`: zapisany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchomieniu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: gdy ma wartość `true`, zmienia politykę pokoju `open` na `allowlist` i wymusza `allowlist` dla wszystkich aktywnych polityk wiadomości prywatnych oprócz `disabled` (w tym `pairing` i `open`). Nie wpływa na polityki `disabled`.
- `allowBots`: zezwala na wiadomości z innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` lub `disabled`.
- `contextVisibility`: tryb widoczności dodatkowego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista dozwolonych ID użytkowników dla ruchu w pokojach. Najbezpieczniejsze są pełne ID użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy uruchomieniu i przy zmianie listy dozwolonych podczas działania monitora. Nierozwiązane nazwy są ignorowane.
- `historyLimit`: maksymalna liczba wiadomości pokoju uwzględnianych jako kontekst historii grupy. Wraca do `messages.groupChat.historyLimit`; jeśli oba ustawienia nie są ustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` lub `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `"partial"`, `"quiet"`, `true` lub `false`. `"partial"` i `true` włączają aktualizacje szkicu w trybie podgląd najpierw przy użyciu zwykłych wiadomości tekstowych Matrix. `"quiet"` używa niepowiadamiających podglądów notice dla samohostowanych konfiguracji z regułami push. `false` jest równoważne `"off"`.
- `blockStreaming`: `true` włącza osobne wiadomości postępu dla ukończonych bloków asystenta, gdy aktywne jest strumieniowanie szkicu podglądu.
- `threadReplies`: `off`, `inbound` lub `always`.
- `threadBindings`: nadpisania per kanał dla routowania i cyklu życia sesji powiązanych z wątkiem.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy uruchomieniu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown przed ponowną próbą automatycznych żądań weryfikacji przy uruchomieniu.
- `textChunkLimit`: rozmiar chunku wiadomości wychodzącej w znakach (ma zastosowanie, gdy `chunkMode` to `length`).
- `chunkMode`: `length` dzieli wiadomości według liczby znaków; `newline` dzieli na granicach linii.
- `responsePrefix`: opcjonalny ciąg dodawany na początku wszystkich odpowiedzi wychodzących dla tego kanału.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzającej dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzającej (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania mediów przychodzących.
- `autoJoin`: polityka automatycznego dołączania po zaproszeniu (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń w stylu wiadomości prywatnych.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do ID pokoi podczas obsługi zaproszenia; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zaproszony pokój.
- `dm`: blok polityki wiadomości prywatnych (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do wiadomości prywatnych po tym, jak OpenClaw dołączył do pokoju i sklasyfikował go jako wiadomość prywatną. Nie zmienia tego, czy zaproszenie jest automatycznie przyjmowane.
- `dm.allowFrom`: lista dozwolonych ID użytkowników dla ruchu wiadomości prywatnych. Najbezpieczniejsze są pełne ID użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy uruchomieniu i przy zmianie listy dozwolonych podczas działania monitora. Nierozwiązane nazwy są ignorowane.
- `dm.sessionScope`: `per-user` (domyślnie) lub `per-room`. Użyj `per-room`, jeśli chcesz, aby każdy pokój wiadomości prywatnych Matrix zachowywał osobny kontekst, nawet jeśli peer jest ten sam.
- `dm.threadReplies`: nadpisanie polityki wątków tylko dla wiadomości prywatnych (`off`, `inbound`, `always`). Zastępuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umieszczania odpowiedzi, jak i izolacji sesji w wiadomościach prywatnych.
- `execApprovals`: natywne dostarczanie zgód exec w Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID użytkowników Matrix, którzy mogą zatwierdzać żądania exec. Opcjonalne, gdy `dm.allowFrom` już wskazuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa polityk per pokój. Preferuj ID pokoi lub aliasy; nierozwiązane nazwy pokoi są ignorowane w czasie działania. Tożsamość sesji/grupy używa stabilnego ID pokoju po rozwiązaniu.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: lista dozwolonych nadawców per pokój.
- `groups.<room>.tools`: nadpisania zezwalania/odmawiania narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie ograniczania przez wzmianki na poziomie pokoju. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza ich ponowne włączenie.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment systemPrompt na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: kontrola narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatu grupowego i ograniczanie przez wzmianki
- [Channel Routing](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
