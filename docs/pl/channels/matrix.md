---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji Matrix
summary: Status obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-04-22T04:20:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix to dołączony plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony plugin

Matrix jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc standardowe
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

Zobacz [Plugins](/pl/tools/plugin), aby poznać zachowanie pluginów i zasady instalacji.

## Konfiguracja

1. Upewnij się, że plugin Matrix jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix`, używając jednego z wariantów:
   - `homeserver` + `accessToken`, albo
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie Gateway.
5. Rozpocznij wiadomość prywatną z botem lub zaproś go do pokoju.
   - Nowe zaproszenia Matrix działają tylko wtedy, gdy zezwala na to `channels.matrix.autoJoin`.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator Matrix pyta o:

- URL homeservera
- metodę uwierzytelniania: access token lub hasło
- identyfikator użytkownika (tylko przy uwierzytelnianiu hasłem)
- opcjonalną nazwę urządzenia
- czy włączyć E2EE
- czy skonfigurować dostęp do pokojów i automatyczne dołączanie do zaproszeń

Najważniejsze zachowania kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją i to konto nie ma jeszcze zapisanego uwierzytelniania w konfiguracji, kreator oferuje skrót do użycia zmiennych środowiskowych, aby zachować uwierzytelnianie w env vars.
- Nazwy kont są normalizowane do identyfikatora konta. Na przykład `Ops Bot` staje się `ops-bot`.
- Wpisy listy dozwolonych wiadomości prywatnych akceptują bezpośrednio `@user:server`; nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie jedno dokładne dopasowanie.
- Wpisy listy dozwolonych pokojów akceptują bezpośrednio identyfikatory pokojów i aliasy. Preferuj `!room:server` lub `#alias:server`; nierozwiązane nazwy są ignorowane w czasie działania przez mechanizm rozwiązywania listy dozwolonych.
- W trybie listy dozwolonych dla automatycznego dołączania do zaproszeń używaj wyłącznie stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokojów są odrzucane.
- Aby rozwiązać nazwy pokojów przed zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
Domyślna wartość `channels.matrix.autoJoin` to `off`.

Jeśli pozostawisz ją nieustawioną, bot nie będzie dołączać do zaproszonych pokojów ani nowych zaproszeń w stylu wiadomości prywatnych, więc nie pojawi się w nowych grupach ani zaproszonych wiadomościach prywatnych, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia są akceptowane, albo ustaw `autoJoin: "always"`, jeśli chcesz, aby dołączał do każdego zaproszenia.

W trybie `allowlist` pole `autoJoinAllowlist` akceptuje tylko `!roomId:server`, `#alias:server` lub `*`.
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

Konfiguracja oparta na haśle (token jest zapisywany w pamięci podręcznej po zalogowaniu):

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

Matrix przechowuje poświadczenia z pamięci podręcznej w `~/.openclaw/credentials/matrix/`.
Konto domyślne używa `credentials.json`; nazwane konta używają `credentials-<account>.json`.
Jeśli poświadczenia z pamięci podręcznej istnieją w tej lokalizacji, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby konfiguracji, doctor i wykrywania statusu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki w zmiennych środowiskowych (używane, gdy klucz konfiguracji nie jest ustawiony):

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

Dla znormalizowanego identyfikatora konta `ops-bot` użyj:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix ucieka znaki interpunkcyjne w identyfikatorach kont, aby zmienne środowiskowe z zakresem konta nie kolidowały ze sobą.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót do użycia zmiennych środowiskowych tylko wtedy, gdy te zmienne uwierzytelniania już istnieją, a wybrane konto nie ma jeszcze zapisanego uwierzytelniania Matrix w konfiguracji.

## Przykład konfiguracji

To praktyczna bazowa konfiguracja z parowaniem wiadomości prywatnych, listą dozwolonych pokojów i włączonym E2EE:

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

`autoJoin` dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń w stylu wiadomości prywatnych. OpenClaw nie potrafi wiarygodnie
sklasyfikować zaproszonego pokoju jako wiadomości prywatnej lub grupy w momencie zaproszenia, więc wszystkie zaproszenia najpierw przechodzą przez `autoJoin`.
`dm.policy` jest stosowane po dołączeniu bota i sklasyfikowaniu pokoju jako wiadomości prywatnej.

## Podglądy strumieniowania

Strumieniowanie odpowiedzi w Matrix jest opcjonalne.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał pojedynczą odpowiedź
podglądową na żywo, edytował ten podgląd w miejscu podczas generowania tekstu przez model, a następnie finalizował go po
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

- `streaming: "off"` jest ustawieniem domyślnym. OpenClaw czeka na końcową odpowiedź i wysyła ją jednokrotnie.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądową dla bieżącego bloku odpowiedzi asystenta przy użyciu zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie Matrix polegające na powiadamianiu najpierw o podglądzie, więc standardowe klienty mogą powiadamiać o pierwszym strumieniowanym tekście podglądu zamiast o ukończonym bloku.
- `streaming: "quiet"` tworzy jedną edytowalną cichą notatkę podglądową dla bieżącego bloku odpowiedzi asystenta. Używaj tego tylko wtedy, gdy jednocześnie skonfigurujesz reguły push odbiorcy dla sfinalizowanych edycji podglądu.
- `blockStreaming: true` włącza oddzielne komunikaty postępu Matrix. Gdy strumieniowanie podglądu jest włączone, Matrix utrzymuje roboczy szkic na żywo dla bieżącego bloku i zachowuje ukończone bloki jako osobne wiadomości.
- Gdy podgląd jest włączony, a `blockStreaming` jest wyłączone, Matrix edytuje roboczy szkic na żywo w miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestaje mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do zwykłego końcowego dostarczania.
- Odpowiedzi multimedialne nadal wysyłają załączniki normalnie. Jeśli nieaktualnego podglądu nie da się już bezpiecznie ponownie użyć, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Edycje podglądu powodują dodatkowe wywołania API Matrix. Pozostaw strumieniowanie wyłączone, jeśli chcesz zachować najbardziej konserwatywne zachowanie względem limitów szybkości.

Samo `blockStreaming` nie włącza podglądów roboczych.
Użyj `streaming: "partial"` lub `streaming: "quiet"` dla edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz również, aby ukończone bloki odpowiedzi asystenta pozostały widoczne jako osobne komunikaty postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania z podglądem najpierw lub pozostaw `streaming` wyłączone dla dostarczania tylko końcowej odpowiedzi. Przy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą powiadamiającą wiadomość Matrix.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą powiadamiającą wiadomość Matrix.

### Samodzielnie hostowane reguły push dla cichych sfinalizowanych podglądów

Jeśli utrzymujesz własną infrastrukturę Matrix i chcesz, aby ciche podglądy powiadamiały dopiero po zakończeniu bloku lub
końcowej odpowiedzi, ustaw `streaming: "quiet"` i dodaj regułę push per użytkownik dla sfinalizowanych edycji podglądu.

Zwykle jest to konfiguracja po stronie użytkownika-odbiorcy, a nie globalna zmiana konfiguracji homeservera:

Szybka mapa przed rozpoczęciem:

- użytkownik odbierający = osoba, która ma otrzymać powiadomienie
- użytkownik bota = konto Matrix OpenClaw, które wysyła odpowiedź
- do poniższych wywołań API użyj access tokenu użytkownika odbierającego
- dopasuj `sender` w regule push do pełnego MXID użytkownika bota

1. Skonfiguruj OpenClaw tak, aby używał cichych podglądów:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Upewnij się, że konto odbiorcy już otrzymuje zwykłe powiadomienia push Matrix. Reguły cichego podglądu
   działają tylko wtedy, gdy ten użytkownik ma już działające pushery/urządzenia.

3. Pobierz access token użytkownika odbierającego.
   - Użyj tokenu użytkownika odbierającego, a nie tokenu bota.
   - Najłatwiej zwykle ponownie użyć tokenu istniejącej sesji klienta.
   - Jeśli musisz wygenerować nowy token, możesz zalogować się przez standardowe API klient-serwer Matrix:

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

OpenClaw oznacza sfinalizowane edycje podglądu tylko tekstowego w następujący sposób:

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

- `https://matrix.example.org`: podstawowy URL twojego homeservera
- `$USER_ACCESS_TOKEN`: access token użytkownika odbierającego
- `openclaw-finalized-preview-botname`: identyfikator reguły unikalny dla tego bota dla tego użytkownika odbierającego
- `@bot:example.org`: MXID twojego bota Matrix OpenClaw, a nie MXID użytkownika odbierającego

Ważne w konfiguracjach z wieloma botami:

- Reguły push są kluczowane przez `ruleId`. Ponowne wykonanie `PUT` z tym samym identyfikatorem reguły aktualizuje tę jedną regułę.
- Jeśli jeden użytkownik odbierający ma otrzymywać powiadomienia dla wielu kont botów Matrix OpenClaw, utwórz po jednej regule na bota z unikalnym `ruleId` dla każdego dopasowania nadawcy.
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

7. Przetestuj odpowiedź strumieniowaną. W trybie cichym pokój powinien pokazać cichy roboczy podgląd, a końcowa
   edycja w miejscu powinna wysłać powiadomienie po zakończeniu bloku lub tury.

Jeśli później chcesz usunąć regułę, usuń ten sam identyfikator reguły, używając tokenu użytkownika odbierającego:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Uwagi:

- Utwórz regułę przy użyciu access tokenu użytkownika odbierającego, a nie tokenu bota.
- Nowe reguły `override` zdefiniowane przez użytkownika są wstawiane przed domyślnymi regułami tłumiącymi, więc nie jest potrzebny dodatkowy parametr kolejności.
- Dotyczy to tylko edycji podglądu tylko tekstowego, które OpenClaw może bezpiecznie sfinalizować w miejscu. Zastępcze dostarczanie multimediów i zastępcze dostarczanie dla nieaktualnych podglądów nadal używają zwykłego dostarczania Matrix.
- Jeśli `GET /_matrix/client/v3/pushers` nie pokazuje żadnych pusherów, użytkownik nie ma jeszcze działającego dostarczania powiadomień push Matrix dla tego konta/urządzenia.

#### Synapse

Dla Synapse powyższa konfiguracja zwykle sama w sobie wystarcza:

- Nie jest wymagana żadna specjalna zmiana w `homeserver.yaml` dla sfinalizowanych powiadomień o podglądzie OpenClaw.
- Jeśli twoje wdrożenie Synapse już wysyła zwykłe powiadomienia push Matrix, token użytkownika + wywołanie `pushrules` powyżej to główny krok konfiguracji.
- Jeśli uruchamiasz Synapse za reverse proxy lub workerami, upewnij się, że `/_matrix/client/.../pushrules/` poprawnie trafia do Synapse.
- Jeśli używasz workerów Synapse, upewnij się, że pushery działają prawidłowo. Dostarczanie push jest obsługiwane przez główny proces albo przez `synapse.app.pusher` / skonfigurowane workery pusherów.

#### Tuwunel

W przypadku Tuwunel użyj tego samego przepływu konfiguracji i tego samego wywołania API `pushrules`, które pokazano powyżej:

- Nie jest wymagana żadna konfiguracja specyficzna dla Tuwunel dla samego znacznika sfinalizowanego podglądu.
- Jeśli zwykłe powiadomienia Matrix już działają dla tego użytkownika, token użytkownika + wywołanie `pushrules` powyżej to główny krok konfiguracji.
- Jeśli wydaje się, że powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy włączono `suppress_push_when_active`. Tuwunel dodał tę opcję w Tuwunel 1.4.2 12 września 2025 r. i może ona celowo tłumić powiadomienia push na innych urządzeniach, gdy jedno urządzenie jest aktywne.

## Pokoje bot-do-bota

Domyślnie wiadomości Matrix od innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, gdy celowo chcesz włączyć ruch Matrix między agentami:

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
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w widoczny sposób wspominają tego bota w pokojach. Wiadomości prywatne są nadal dozwolone.
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiedzi do samego siebie.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „wiadomość napisaną przez bota” jako „wysłaną przez inne skonfigurowane konto Matrix na tym Gateway OpenClaw”.

Przy włączaniu ruchu bot-do-bota we współdzielonych pokojach używaj ścisłych list dozwolonych pokojów i wymagań wzmianki.

## Szyfrowanie i weryfikacja

W szyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. W pokojach nieszyfrowanych nadal używane jest zwykłe `thumbnail_url`. Nie jest wymagana żadna konfiguracja — plugin automatycznie wykrywa stan E2EE.

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

Uwzględnij zapisany klucz odzyskiwania w wyniku czytelnym maszynowo:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Zainicjalizuj cross-signing i stan weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Szczegółowa diagnostyka bootstrapu:

```bash
openclaw matrix verify bootstrap --verbose
```

Wymuś reset do nowej tożsamości cross-signing przed bootstrapem:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Zweryfikuj to urządzenie przy użyciu klucza odzyskiwania:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Szczegółowe informacje o weryfikacji urządzenia:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Sprawdź kondycję kopii zapasowej kluczy pokojów:

```bash
openclaw matrix verify backup status
```

Szczegółowa diagnostyka kondycji kopii zapasowej:

```bash
openclaw matrix verify backup status --verbose
```

Przywróć klucze pokojów z kopii zapasowej na serwerze:

```bash
openclaw matrix verify backup restore
```

Szczegółowa diagnostyka przywracania:

```bash
openclaw matrix verify backup restore --verbose
```

Usuń bieżącą kopię zapasową na serwerze i utwórz nową bazową kopię zapasową. Jeśli zapisanego
klucza kopii zapasowej nie można poprawnie załadować, ten reset może również odtworzyć secret storage, aby
przyszłe zimne uruchomienia mogły załadować nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (w tym z cichym wewnętrznym logowaniem SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
W przypadku skryptów użyj `--json`, aby uzyskać pełny wynik czytelny maszynowo.

W konfiguracjach wielokontowych polecenia Matrix CLI używają niejawnego domyślnego konta Matrix, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz, aby operacje weryfikacji lub urządzeń jawnie dotyczyły nazwanego konta:

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

`openclaw matrix verify bootstrap` to polecenie konfiguracji i naprawy dla szyfrowanych kont Matrix.
Wykonuje po kolei wszystkie poniższe działania:

- inicjalizuje secret storage, ponownie używając istniejącego klucza odzyskiwania, jeśli to możliwe
- inicjalizuje cross-signing i przesyła brakujące publiczne klucze cross-signing
- próbuje oznaczyć i podpisać cross-signing bieżące urządzenie
- tworzy nową kopię zapasową kluczy pokojów po stronie serwera, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga uwierzytelniania interaktywnego do przesłania kluczy cross-signing, OpenClaw najpierw próbuje przesłać je bez uwierzytelniania, następnie z `m.login.dummy`, a potem z `m.login.password`, gdy skonfigurowano `channels.matrix.password`.

Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo chcesz porzucić bieżącą tożsamość cross-signing i utworzyć nową.

Jeśli celowo chcesz porzucić bieżącą kopię zapasową kluczy pokojów i rozpocząć nową
bazową kopię zapasową dla przyszłych wiadomości, użyj `openclaw matrix verify backup reset --yes`.
Rób to tylko wtedy, gdy akceptujesz, że nieodwracalnie utracona stara zaszyfrowana historia pozostanie
niedostępna i że OpenClaw może odtworzyć secret storage, jeśli bieżącego sekretu kopii zapasowej
nie da się bezpiecznie załadować.

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
Przy uruchamianiu, jeśli to urządzenie nadal nie jest zweryfikowane, Matrix poprosi o samoweryfikację w innym kliencie Matrix,
pominie duplikaty żądań, gdy jedno jest już w toku, i zastosuje lokalny cooldown przed ponowną próbą po restartach.
Nieudane próby żądań domyślnie są ponawiane szybciej niż udane utworzenie żądania.
Ustaw `startupVerification: "off"`, aby wyłączyć automatyczne żądania przy uruchamianiu, albo dostosuj `startupVerificationCooldownHours`,
jeśli chcesz krótsze lub dłuższe okno ponawiania.

Podczas uruchamiania automatycznie wykonywany jest także zachowawczy bootstrap kryptograficzny.
Ten przebieg najpierw próbuje ponownie użyć bieżącego secret storage i bieżącej tożsamości cross-signing oraz unika resetowania cross-signing, chyba że uruchomisz jawny przepływ naprawy bootstrapu.

Jeśli przy uruchamianiu nadal wykrywany jest uszkodzony stan bootstrapu, OpenClaw może podjąć próbę ostrożnej ścieżki naprawczej nawet wtedy, gdy `channels.matrix.password` nie jest skonfigurowane.
Jeśli homeserver wymaga do tej naprawy UIA opartego na haśle, OpenClaw zapisuje ostrzeżenie i zachowuje niekrytyczny charakter uruchamiania zamiast przerywać działanie bota.
Jeśli bieżące urządzenie jest już podpisane przez właściciela, OpenClaw zachowuje tę tożsamość zamiast resetować ją automatycznie.

Zobacz [Matrix migration](/pl/install/migrating-matrix), aby poznać pełny przepływ aktualizacji, ograniczenia, polecenia odzyskiwania i typowe komunikaty migracji.

### Komunikaty weryfikacyjne

Matrix publikuje komunikaty cyklu życia weryfikacji bezpośrednio w ścisłym pokoju wiadomości prywatnych do weryfikacji jako wiadomości `m.notice`.
Obejmuje to:

- komunikaty żądania weryfikacji
- komunikaty gotowości do weryfikacji (z jawną wskazówką „Verify by emoji”)
- komunikaty rozpoczęcia i zakończenia weryfikacji
- szczegóły SAS (emoji i liczby dziesiętne), gdy są dostępne

Przychodzące żądania weryfikacji z innego klienta Matrix są śledzone i automatycznie akceptowane przez OpenClaw.
W przepływach samoweryfikacji OpenClaw automatycznie uruchamia również przepływ SAS, gdy weryfikacja emoji staje się dostępna, i potwierdza swoją stronę.
W przypadku żądań weryfikacji od innego użytkownika/urządzenia Matrix OpenClaw automatycznie akceptuje żądanie, a następnie czeka, aż przepływ SAS będzie przebiegał normalnie.
Aby zakończyć weryfikację, nadal musisz porównać emoji lub dziesiętny SAS w swoim kliencie Matrix i tam potwierdzić „They match”.

OpenClaw nie akceptuje automatycznie w ciemno duplikatów przepływów zainicjowanych samodzielnie. Przy uruchamianiu pomijane jest tworzenie nowego żądania, jeśli żądanie samoweryfikacji jest już w toku.

Komunikaty protokołu/systemu weryfikacji nie są przekazywane do pipeline czatu agenta, więc nie powodują `NO_REPLY`.

### Higiena urządzeń

Na koncie mogą gromadzić się stare urządzenia Matrix zarządzane przez OpenClaw, co utrudnia ocenę zaufania w szyfrowanych pokojach.
Wyświetl ich listę za pomocą:

```bash
openclaw matrix devices list
```

Usuń nieaktualne urządzenia Matrix zarządzane przez OpenClaw za pomocą:

```bash
openclaw matrix devices prune-stale
```

### Crypto store

Matrix E2EE używa oficjalnej ścieżki kryptograficznej Rust z `matrix-js-sdk` w Node, z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany w pliku migawki (`crypto-idb-snapshot.json`) i przywracany przy uruchamianiu. Plik migawki zawiera wrażliwy stan środowiska uruchomieniowego i jest przechowywany z restrykcyjnymi uprawnieniami do pliku.

Zaszyfrowany stan środowiska uruchomieniowego znajduje się w katalogach per konto i per użytkownik z hashem tokenu w
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ten katalog zawiera magazyn synchronizacji (`bot-storage.json`), magazyn kryptograficzny (`crypto/`),
plik klucza odzyskiwania (`recovery-key.json`), migawkę IndexedDB (`crypto-idb-snapshot.json`),
powiązania wątków (`thread-bindings.json`) oraz stan weryfikacji przy uruchamianiu (`startup-verification.json`).
Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego
katalogu głównego dla danej krotki konto/homeserver/użytkownik, dzięki czemu poprzedni stan synchronizacji, stan kryptograficzny, powiązania wątków
i stan weryfikacji przy uruchamianiu pozostają widoczne.

## Zarządzanie profilem

Zaktualizuj profil własny Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, gdy chcesz jawnie wskazać nazwane konto Matrix.

Matrix akceptuje adresy URL awatarów `mxc://` bezpośrednio. Gdy przekażesz adres URL awatara `http://` lub `https://`, OpenClaw najpierw prześle go do Matrix i zapisze rozwiązany adres URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub wybranego nadpisania konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla odpowiedzi automatycznych, jak i wysyłek przez narzędzia wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje trasowanie wiadomości prywatnych Matrix w zakresie nadawcy, więc wiele pokojów wiadomości prywatnych może współdzielić jedną sesję, jeśli rozwiązują się do tego samego rozmówcy.
- `dm.sessionScope: "per-room"` izoluje każdy pokój wiadomości prywatnych Matrix do własnego klucza sesji, nadal używając zwykłego uwierzytelniania wiadomości prywatnych i sprawdzeń listy dozwolonych.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybraną docelową sesję.
- `threadReplies: "off"` utrzymuje odpowiedzi na poziomie głównym i utrzymuje przychodzące wiadomości wątkowe w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy przychodząca wiadomość już była w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi w pokojach w wątku zakorzenionym w wiadomości wyzwalającej i trasuje tę konwersację przez odpowiadającą sesję w zakresie wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla wiadomości prywatnych. Na przykład możesz utrzymać izolację wątków w pokojach, a wiadomości prywatne pozostawić płaskie.
- Przychodzące wiadomości wątkowe zawierają główną wiadomość wątku jako dodatkowy kontekst agenta.
- Wysyłki przez narzędzia wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celem jest ten sam pokój albo ten sam cel użytkownika wiadomości prywatnej, chyba że jawnie podano `threadId`.
- Ponowne użycie celu użytkownika wiadomości prywatnej w tej samej sesji uruchamia się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego rozmówcę wiadomości prywatnej na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do zwykłego trasowania w zakresie użytkownika.
- Gdy OpenClaw wykryje, że pokój wiadomości prywatnych Matrix koliduje z innym pokojem wiadomości prywatnych w tej samej współdzielonej sesji Matrix DM, publikuje jednorazowe `m.notice` w tym pokoju z mechanizmem awaryjnym `/focus`, gdy powiązania wątków są włączone i z podpowiedzią `dm.sessionScope`.
- Powiązania wątków w środowisku uruchomieniowym są obsługiwane w Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach i wiadomościach prywatnych Matrix.
- Główne `/focus` w pokoju lub wiadomości prywatnej Matrix tworzy nowy wątek Matrix i wiąże go z docelową sesją, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania konwersacji ACP

Pokoje Matrix, wiadomości prywatne i istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz wiadomości prywatnej, pokoju lub istniejącego wątku Matrix, którego chcesz dalej używać.
- W głównej wiadomości prywatnej lub pokoju Matrix bieżąca wiadomość prywatna/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są trasowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże bieżący wątek na miejscu.
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

Flagi uruchamiania powiązanego z wątkiem Matrix są opcjonalne:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby zezwolić, by główne `/focus` tworzyło i wiązało nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby zezwolić, by `/acp spawn --thread auto|here` wiązało sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach i przychodzące reakcje potwierdzenia.

- Narzędzia wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do konkretnego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla konkretnego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota w tym zdarzeniu.
- `remove: true` usuwa tylko wskazaną reakcję emoji z konta bota.

Zakres reakcji potwierdzenia jest rozwiązywany według standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- zastępcze emoji tożsamości agenta

Zakres reakcji potwierdzenia jest rozwiązywany w tej kolejności:

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
- Usunięcia reakcji nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix ujawnia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` określa, ile ostatnich wiadomości z pokoju jest uwzględnianych jako `InboundHistory`, gdy wiadomość z pokoju Matrix wyzwala agenta. Wartość rezerwowa to `messages.groupChat.historyLimit`; jeśli oba ustawienia są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokojów Matrix dotyczy tylko pokojów. Wiadomości prywatne nadal używają zwykłej historii sesji.
- Historia pokojów Matrix jest tylko oczekująca: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wywołały odpowiedzi, a następnie wykonuje migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest uwzględniana w `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby tego samego zdarzenia Matrix ponownie używają pierwotnej migawki historii zamiast przesuwać się do nowszych wiadomości w pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrana treść odpowiedzi, główne wiadomości wątków i oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Uzupełniający kontekst jest zachowywany w takiej postaci, w jakiej został odebrany.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne sprawdzenia list dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność uzupełniającego kontekstu, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja wyzwalacza nadal wynika z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i zasad wiadomości prywatnych.

## Zasady wiadomości prywatnych i pokojów

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

Zobacz [Groups](/pl/channels/groups), aby poznać zachowanie bramkowania wzmiankami i list dozwolonych.

Przykład parowania dla wiadomości prywatnych Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła do ciebie wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może po krótkim cooldownie ponownie wysłać odpowiedź-przypomnienie zamiast generować nowy kod.

Zobacz [Pairing](/pl/channels/pairing), aby poznać współdzielony przepływ parowania wiadomości prywatnych i układ przechowywania.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich się rozjedzie, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują na stare pokoje solo zamiast aktywnej wiadomości prywatnej. Sprawdź bieżące mapowanie dla rozmówcy za pomocą:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je za pomocą:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Przepływ naprawy:

- preferuje ścisłą wiadomość prywatną 1:1, która jest już zmapowana w `m.direct`
- wraca do dowolnej aktualnie dołączonej ścisłej wiadomości prywatnej 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje żaden zdrowy pokój wiadomości prywatnych

Przepływ naprawy nie usuwa automatycznie starych pokojów. Wybiera tylko zdrową wiadomość prywatną i aktualizuje mapowanie, aby nowe wysyłki Matrix, komunikaty weryfikacyjne i inne przepływy wiadomości bezpośrednich ponownie trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń dla konta Matrix. Natywne
pokrętła trasowania wiadomości prywatnych/kanałów nadal znajdują się w konfiguracji zatwierdzeń exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalnie; wartość rezerwowa to `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego. Zatwierdzenia exec używają najpierw `execApprovals.approvers` i mogą wracać do `channels.matrix.dm.allowFrom`. Zatwierdzenia pluginów autoryzują przez `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzeń wracają do innych skonfigurowanych tras zatwierdzeń albo do zasad rezerwowych zatwierdzeń.

Natywne trasowanie Matrix obsługuje oba rodzaje zatwierdzeń:

- `channels.matrix.execApprovals.*` kontroluje natywny tryb fanout wiadomości prywatnych/kanałów dla promptów zatwierdzeń Matrix.
- Zatwierdzenia exec używają zestawu zatwierdzających exec z `execApprovals.approvers` lub `channels.matrix.dm.allowFrom`.
- Zatwierdzenia pluginów używają listy dozwolonych wiadomości prywatnych Matrix z `channels.matrix.dm.allowFrom`.
- Skróty reakcji Matrix i aktualizacje wiadomości mają zastosowanie zarówno do zatwierdzeń exec, jak i pluginów.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzeń do wiadomości prywatnych zatwierdzających
- `target: "channel"` wysyła prompt z powrotem do źródłowego pokoju Matrix lub wiadomości prywatnej
- `target: "both"` wysyła do wiadomości prywatnych zatwierdzających oraz do źródłowego pokoju Matrix lub wiadomości prywatnej

Prompty zatwierdzeń Matrix inicjalizują skróty reakcji w głównej wiadomości zatwierdzenia:

- `✅` = zezwól jednorazowo
- `❌` = odmów
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez efektywne zasady exec

Zatwierdzający mogą zareagować na tę wiadomość albo użyć zastępczych poleceń slash: `/approve <id> allow-once`, `/approve <id> allow-always` lub `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odmawiać. W przypadku zatwierdzeń exec dostarczanie do kanału zawiera tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Exec approvals](/pl/tools/exec-approvals)

## Polecenia slash

Polecenia slash Matrix (na przykład `/new`, `/reset`, `/model`) działają bezpośrednio w wiadomościach prywatnych. W pokojach OpenClaw rozpoznaje również polecenia slash poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` uruchamia ścieżkę polecenia bez potrzeby używania niestandardowego regexu wzmianki. Dzięki temu bot pozostaje responsywny na posty pokojowe w stylu `@mention /command`, które Element i podobne klienty wysyłają, gdy użytkownik uzupełni nazwę bota klawiszem tab przed wpisaniem polecenia.

Zasady autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać zasady listy dozwolonych/zasady właściciela dla wiadomości prywatnych lub pokojów tak samo jak przy zwykłych wiadomościach.

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

Wartości najwyższego poziomu `channels.matrix` działają jako domyślne dla nazwanych kont, chyba że konto je nadpisze.
Możesz ograniczyć dziedziczone wpisy pokojów do jednego konta Matrix za pomocą `groups.<room>.account`.
Wpisy bez `account` pozostają współdzielone przez wszystkie konta Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje najwyższego poziomu konto `default` tylko wtedy, gdy to konto domyślne ma bieżące uwierzytelnianie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta nadal mogą pozostać wykrywalne z `homeserver` plus `userId`, gdy poświadczenia z pamięci podręcznej później spełnią wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, promocja naprawy/konfiguracji z jednego konta do wielu kont zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Do promowanego konta przenoszone są tylko klucze Matrix związane z uwierzytelnianiem/bootstrapem; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, gdy chcesz, aby OpenClaw preferował jedno nazwane konto Matrix do niejawnego trasowania, sondowania i operacji CLI.
Jeśli skonfigurowano wiele kont Matrix, a jedno z identyfikatorów kont to `default`, OpenClaw używa tego konta niejawnie nawet wtedy, gdy `defaultAccount` nie jest ustawione.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` albo przekaż `--account <id>` dla poleceń CLI, które polegają na niejawnym wyborze konta.
Przekaż `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla jednego polecenia.

Zobacz [Configuration reference](/pl/gateway/configuration-reference#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz to per konto.

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

Przykład konfiguracji w CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Ta zgoda obejmuje tylko zaufane cele prywatne/wewnętrzne. Publiczne homeservery w postaci jawnym tekstem, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. W miarę możliwości preferuj `https://`.

## Proxy dla ruchu Matrix

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
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w środowisku uruchomieniowym i sond statusu konta.

## Rozwiązywanie celów

Matrix akceptuje następujące formy celu wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwanie użytkowników odpytuje katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwanie pokojów akceptuje bezpośrednio jawne identyfikatory pokojów i aliasy, a następnie wraca do przeszukiwania nazw dołączonych pokojów dla tego konta.
- Wyszukiwanie nazw dołączonych pokojów jest realizowane best-effort. Jeśli nazwy pokoju nie da się rozwiązać do identyfikatora lub aliasu, jest ona ignorowana przez mechanizm rozwiązywania listy dozwolonych w czasie działania.

## Dokumentacja konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver rozwiązuje się do `localhost`, adresu IP LAN/Tailscale lub hosta wewnętrznego, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu własnym `proxy`.
- `userId`: pełny identyfikator użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: access token do uwierzytelniania opartego na tokenie. Wartości w postaci jawnego tekstu i wartości SecretRef są obsługiwane dla `channels.matrix.accessToken` oraz `channels.matrix.accounts.<id>.accessToken` w providerach env/file/exec. Zobacz [Secrets Management](/pl/gateway/secrets).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości w postaci jawnego tekstu i wartości SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia przy logowaniu hasłem.
- `avatarUrl`: zapisany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: gdy ma wartość `true`, podnosi politykę pokojów `open` do `allowlist` i wymusza `allowlist` dla wszystkich aktywnych zasad wiadomości prywatnych z wyjątkiem `disabled` (w tym `pairing` i `open`). Nie wpływa na zasady `disabled`.
- `allowBots`: zezwala na wiadomości od innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` lub `disabled`.
- `contextVisibility`: tryb widoczności uzupełniającego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu pokojowego. Najbezpieczniejsze są pełne identyfikatory użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy uruchamianiu i przy zmianie listy dozwolonych, gdy monitor działa. Nierozwiązane nazwy są ignorowane.
- `historyLimit`: maksymalna liczba wiadomości z pokoju uwzględnianych jako kontekst historii grupy. Wartość rezerwowa to `messages.groupChat.historyLimit`; jeśli oba ustawienia są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` lub `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `"partial"`, `"quiet"`, `true` lub `false`. `"partial"` i `true` włączają aktualizacje szkicu z podglądem najpierw przy użyciu zwykłych wiadomości tekstowych Matrix. `"quiet"` używa niepowiadamiających notatek podglądu dla konfiguracji z samodzielnie hostowanymi regułami push. `false` jest równoważne `"off"`.
- `blockStreaming`: `true` włącza oddzielne komunikaty postępu dla ukończonych bloków odpowiedzi asystenta, gdy aktywne jest strumieniowanie roboczego podglądu.
- `threadReplies`: `off`, `inbound` lub `always`.
- `threadBindings`: nadpisania per kanał dla trasowania i cyklu życia sesji powiązanych z wątkami.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy uruchamianiu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown przed ponowieniem automatycznych żądań weryfikacji przy uruchamianiu.
- `textChunkLimit`: rozmiar fragmentu wiadomości wychodzącej w znakach (stosowane, gdy `chunkMode` ma wartość `length`).
- `chunkMode`: `length` dzieli wiadomości według liczby znaków; `newline` dzieli na granicach linii.
- `responsePrefix`: opcjonalny ciąg dodawany na początku wszystkich wychodzących odpowiedzi dla tego kanału.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzenia (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania multimediów przychodzących.
- `autoJoin`: polityka automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń w stylu wiadomości prywatnych.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do identyfikatorów pokojów podczas obsługi zaproszeń; OpenClaw nie ufa stanowi aliasu zgłaszanemu przez zaproszony pokój.
- `dm`: blok polityki wiadomości prywatnych (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do wiadomości prywatnych po tym, jak OpenClaw dołączy do pokoju i sklasyfikuje go jako wiadomość prywatną. Nie zmienia tego, czy zaproszenie jest automatycznie przyjmowane.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu wiadomości prywatnych. Najbezpieczniejsze są pełne identyfikatory użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy uruchamianiu i przy zmianie listy dozwolonych, gdy monitor działa. Nierozwiązane nazwy są ignorowane.
- `dm.sessionScope`: `per-user` (domyślnie) lub `per-room`. Użyj `per-room`, gdy chcesz, aby każdy pokój wiadomości prywatnych Matrix zachowywał osobny kontekst, nawet jeśli rozmówca jest ten sam.
- `dm.threadReplies`: nadpisanie polityki wątków tylko dla wiadomości prywatnych (`off`, `inbound`, `always`). Nadpisuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umieszczania odpowiedzi, jak i izolacji sesji w wiadomościach prywatnych.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec dla Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: identyfikatory użytkowników Matrix, którzy mogą zatwierdzać żądania exec. Opcjonalne, gdy `dm.allowFrom` już wskazuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa polityk per pokój. Preferuj identyfikatory pokojów lub aliasy; nierozwiązane nazwy pokojów są ignorowane w czasie działania. Tożsamość sesji/grupy po rozwiązaniu używa stabilnego identyfikatora pokoju.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: lista dozwolonych nadawców per pokój.
- `groups.<room>.tools`: nadpisania per pokój dla dozwalania/zabraniania narzędzi.
- `groups.<room>.autoReply`: nadpisanie na poziomie pokoju dla bramkowania wzmiankami. `true` wyłącza wymagania wzmianki dla tego pokoju; `false` ponownie je wymusza.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment system promptu na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: kontrola dostępu do narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmiankami
- [Channel Routing](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
