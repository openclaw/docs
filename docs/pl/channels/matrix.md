---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie Matrix E2EE i weryfikacji
summary: Stan obsługi Matrix, konfiguracja i przykłady ustawień
title: Matrix
x-i18n:
    generated_at: "2026-04-06T09:48:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06f833bf0ede81bad69f140994c32e8cc5d1635764f95fc5db4fc5dc25f2b85e
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix to dołączony plugin kanału Matrix dla OpenClaw.
Korzysta z oficjalnego `matrix-js-sdk` i obsługuje wiadomości DM, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony plugin

Matrix jest dostarczany jako dołączony plugin w aktualnych wydaniach OpenClaw, więc zwykłe
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

Zobacz [Plugins](/pl/tools/plugin), aby poznać zachowanie pluginów i zasady instalacji.

## Konfiguracja

1. Upewnij się, że plugin Matrix jest dostępny.
   - Aktualne spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix`, używając jednej z opcji:
   - `homeserver` + `accessToken`, lub
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie bramę.
5. Rozpocznij wiadomość DM z botem albo zaproś go do pokoju.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

O co dokładnie pyta kreator Matrix:

- URL homeservera
- metoda uwierzytelniania: token dostępu lub hasło
- ID użytkownika tylko wtedy, gdy wybierzesz uwierzytelnianie hasłem
- opcjonalna nazwa urządzenia
- czy włączyć E2EE
- czy skonfigurować teraz dostęp do pokoi Matrix

Ważne zachowanie kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją dla wybranego konta, a to konto nie ma jeszcze zapisanego uwierzytelniania w konfiguracji, kreator oferuje skrót przez zmienne środowiskowe i zapisuje tylko `enabled: true` dla tego konta.
- Gdy interaktywnie dodajesz kolejne konto Matrix, wprowadzona nazwa konta jest normalizowana do ID konta używanego w konfiguracji i zmiennych środowiskowych. Na przykład `Ops Bot` staje się `ops-bot`.
- Monity allowlist dla DM od razu akceptują pełne wartości `@user:server`. Nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie jedno dokładne dopasowanie; w przeciwnym razie kreator poprosi o ponowną próbę z pełnym ID Matrix.
- Monity allowlist dla pokoi akceptują bezpośrednio ID pokoi i aliasy. Mogą też na żywo rozwiązywać nazwy dołączonych pokoi, ale nierozwiązane nazwy są zachowywane tylko tak, jak zostały wpisane podczas konfiguracji, i są później ignorowane przez rozwiązywanie allowlist w runtime. Preferuj `!room:server` lub `#alias:server`.
- Tożsamość pokoju/sesji w runtime używa stabilnego ID pokoju Matrix. Aliasy zadeklarowane w pokoju są używane wyłącznie jako dane wejściowe do wyszukiwania, a nie jako długoterminowy klucz sesji lub stabilna tożsamość grupy.
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

Matrix przechowuje buforowane dane uwierzytelniające w `~/.openclaw/credentials/matrix/`.
Konto domyślne używa `credentials.json`; nazwane konta używają `credentials-<account>.json`.
Gdy istnieją tam buforowane dane uwierzytelniające, OpenClaw traktuje Matrix jako skonfigurowany dla potrzeb setupu, doctora i wykrywania statusu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki zmiennych środowiskowych (używane, gdy klucz konfiguracyjny nie jest ustawiony):

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

Dla znormalizowanego ID konta `ops-bot` użyj:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix ucieka znaki interpunkcyjne w ID kont, aby uniknąć kolizji zmiennych środowiskowych z zakresem.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót przez zmienne środowiskowe tylko wtedy, gdy te zmienne uwierzytelniania są już obecne, a wybrane konto nie ma jeszcze zapisanego uwierzytelniania Matrix w konfiguracji.

## Przykład konfiguracji

To praktyczna konfiguracja bazowa z parowaniem DM, allowlist pokoi i włączonym E2EE:

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

`autoJoin` dotyczy zaproszeń Matrix ogólnie, nie tylko zaproszeń do pokoi/grup.
Obejmuje to świeże zaproszenia w stylu DM. W momencie zaproszenia OpenClaw nie wie jeszcze wiarygodnie, czy
zaproszony pokój zostanie ostatecznie potraktowany jako DM czy grupa, więc wszystkie zaproszenia przechodzą najpierw przez tę samą decyzję `autoJoin`. `dm.policy` nadal obowiązuje po dołączeniu bota i sklasyfikowaniu pokoju
jako DM, więc `autoJoin` kontroluje zachowanie przy dołączaniu, a `dm.policy` kontroluje zachowanie odpowiedzi/dostępu.

## Podglądy strumieniowe

Strumieniowanie odpowiedzi w Matrix jest opcjonalne.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał pojedynczą odpowiedź
podglądu na żywo, edytował ten podgląd na miejscu podczas generowania tekstu przez model, a następnie finalizował go po zakończeniu odpowiedzi:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` to ustawienie domyślne. OpenClaw czeka na końcową odpowiedź i wysyła ją raz.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądu dla bieżącego bloku odpowiedzi asystenta przy użyciu zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie Matrix polegające na powiadamianiu najpierw o podglądzie, więc standardowe klienty mogą powiadamiać o pierwszym strumieniowanym tekście podglądu zamiast o ukończonym bloku.
- `streaming: "quiet"` tworzy jedną edytowalną, cichą informację o podglądzie dla bieżącego bloku odpowiedzi asystenta. Używaj tego tylko wtedy, gdy skonfigurujesz także reguły push odbiorców dla finalizowanych edycji podglądu.
- `blockStreaming: true` włącza osobne wiadomości postępu Matrix. Gdy strumieniowanie podglądu jest włączone, Matrix utrzymuje wersję roboczą na żywo dla bieżącego bloku i zachowuje ukończone bloki jako osobne wiadomości.
- Gdy podgląd strumieniowy jest włączony, a `blockStreaming` wyłączone, Matrix edytuje wersję roboczą na żywo na miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestanie mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do normalnego końcowego dostarczenia.
- Odpowiedzi multimedialne nadal wysyłają załączniki w standardowy sposób. Jeśli nieaktualnego podglądu nie da się już bezpiecznie użyć ponownie, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw strumieniowanie wyłączone, jeśli chcesz najbardziej zachowawczego zachowania względem limitów szybkości.

`blockStreaming` samo w sobie nie włącza wersji roboczych podglądu.
Użyj `streaming: "partial"` lub `streaming: "quiet"` do edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz także, aby ukończone bloki asystenta pozostawały widoczne jako osobne wiadomości postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania „najpierw podgląd” albo pozostaw `streaming` wyłączone dla dostarczania wyłącznie finalnej odpowiedzi. Przy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą powiadamiającą wiadomość Matrix.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą powiadamiającą wiadomość Matrix.

### Samodzielnie hostowane reguły push dla cichych finalizowanych podglądów

Jeśli utrzymujesz własną infrastrukturę Matrix i chcesz, aby ciche podglądy wysyłały powiadomienie dopiero po zakończeniu bloku lub
końcowej odpowiedzi, ustaw `streaming: "quiet"` i dodaj regułę push per użytkownik dla finalizowanych edycji podglądu.

Zwykle jest to konfiguracja po stronie użytkownika-odbiorcy, a nie globalna zmiana konfiguracji homeservera:

Szybka mapa przed rozpoczęciem:

- użytkownik odbiorca = osoba, która ma otrzymać powiadomienie
- użytkownik bota = konto Matrix OpenClaw, które wysyła odpowiedź
- do poniższych wywołań API użyj tokena dostępu użytkownika odbiorcy
- dopasuj `sender` w regule push do pełnego MXID użytkownika bota

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

3. Pobierz token dostępu użytkownika odbiorcy.
   - Użyj tokena użytkownika odbierającego, a nie tokena bota.
   - Ponowne użycie tokena istniejącej sesji klienta jest zwykle najprostsze.
   - Jeśli musisz wygenerować nowy token, możesz zalogować się przez standardowe API Matrix Client-Server:

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

OpenClaw oznacza finalizowane edycje podglądu zawierające wyłącznie tekst jako:

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

Przed uruchomieniem polecenia podmień te wartości:

- `https://matrix.example.org`: podstawowy URL twojego homeservera
- `$USER_ACCESS_TOKEN`: token dostępu użytkownika odbierającego
- `openclaw-finalized-preview-botname`: ID reguły unikalne dla tego bota i tego użytkownika odbierającego
- `@bot:example.org`: MXID twojego bota Matrix OpenClaw, a nie MXID użytkownika odbierającego

Ważne przy konfiguracjach z wieloma botami:

- Reguły push są kluczowane przez `ruleId`. Ponowne uruchomienie `PUT` dla tego samego ID reguły aktualizuje tę jedną regułę.
- Jeśli jeden użytkownik odbierający ma otrzymywać powiadomienia od wielu kont botów Matrix OpenClaw, utwórz jedną regułę na bota z unikalnym ID reguły dla każdego dopasowania nadawcy.
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

7. Przetestuj strumieniowaną odpowiedź. W trybie cichym pokój powinien pokazać cichy podgląd wersji roboczej, a końcowa
   edycja na miejscu powinna wysłać powiadomienie po zakończeniu bloku lub tury.

Jeśli później chcesz usunąć regułę, usuń to samo ID reguły przy użyciu tokena użytkownika odbierającego:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Uwagi:

- Utwórz regułę przy użyciu tokena dostępu użytkownika odbierającego, a nie tokena bota.
- Nowe reguły `override` zdefiniowane przez użytkownika są wstawiane przed domyślnymi regułami wyciszającymi, więc nie jest potrzebny dodatkowy parametr kolejności.
- Dotyczy to tylko edycji podglądu zawierających wyłącznie tekst, które OpenClaw może bezpiecznie sfinalizować na miejscu. Fallbacki dla multimediów i fallbacki dla nieaktualnego podglądu nadal używają zwykłego dostarczania Matrix.
- Jeśli `GET /_matrix/client/v3/pushers` nie pokazuje żadnych pusherów, użytkownik nie ma jeszcze działającego dostarczania push Matrix dla tego konta/urządzenia.

#### Synapse

W przypadku Synapse powyższa konfiguracja zwykle sama w sobie wystarcza:

- Nie jest wymagana specjalna zmiana `homeserver.yaml` dla finalizowanych powiadomień o podglądzie OpenClaw.
- Jeśli wdrożenie Synapse już wysyła zwykłe powiadomienia push Matrix, głównym krokiem konfiguracji jest token użytkownika + powyższe wywołanie `pushrules`.
- Jeśli uruchamiasz Synapse za reverse proxy lub workerami, upewnij się, że `/_matrix/client/.../pushrules/` poprawnie trafia do Synapse.
- Jeśli używasz workerów Synapse, upewnij się, że pushery są sprawne. Dostarczanie push jest obsługiwane przez główny proces albo przez `synapse.app.pusher` / skonfigurowane workery pusherów.

#### Tuwunel

W przypadku Tuwunel użyj tego samego przepływu konfiguracji i wywołania API `pushrules`, które pokazano powyżej:

- Nie jest wymagana konfiguracja specyficzna dla Tuwunel dla samego znacznika finalizowanego podglądu.
- Jeśli zwykłe powiadomienia Matrix już działają dla tego użytkownika, głównym krokiem konfiguracji jest token użytkownika + powyższe wywołanie `pushrules`.
- Jeśli wydaje się, że powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy włączone jest `suppress_push_when_active`. Tuwunel dodał tę opcję w Tuwunel 1.4.2 12 września 2025 r. i może ona celowo wyciszać powiadomienia na innych urządzeniach, gdy jedno urządzenie jest aktywne.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Pokoje nieszyfrowane nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — plugin automatycznie wykrywa stan E2EE.

### Pokoje bot-bot

Domyślnie wiadomości Matrix od innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

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

- `allowBots: true` akceptuje wiadomości z innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i wiadomościach DM.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach wyraźnie wspominają tego bota. DM są nadal dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości z tego samego ID użytkownika Matrix, aby uniknąć pętli samoodpowiedzi.
- Matrix nie udostępnia tu natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tej bramie OpenClaw”.

Przy włączaniu ruchu bot-bot w współdzielonych pokojach używaj ścisłych allowlist pokoi i wymagań wzmianki.

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

Dołącz zapisany klucz odzyskiwania w wyjściu czytelnym maszynowo:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Zainicjalizuj cross-signing i stan weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Obsługa wielu kont: użyj `channels.matrix.accounts` z poświadczeniami per konto i opcjonalnym `name`. Zobacz [Configuration reference](/pl/gateway/configuration-reference#multi-account-all-channels), aby poznać wspólny wzorzec.

Szczegółowa diagnostyka bootstrapu:

```bash
openclaw matrix verify bootstrap --verbose
```

Wymuś nowy reset tożsamości cross-signing przed bootstrapem:

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

Sprawdź stan kopii zapasowej kluczy pokojów:

```bash
openclaw matrix verify backup status
```

Szczegółowa diagnostyka stanu kopii zapasowej:

```bash
openclaw matrix verify backup status --verbose
```

Przywróć klucze pokoi z kopii zapasowej serwera:

```bash
openclaw matrix verify backup restore
```

Szczegółowa diagnostyka przywracania:

```bash
openclaw matrix verify backup restore --verbose
```

Usuń bieżącą kopię zapasową na serwerze i utwórz nową bazę kopii zapasowej. Jeśli zapisany
klucz kopii zapasowej nie może zostać poprawnie wczytany, ten reset może też odtworzyć secret storage, aby
przyszłe zimne starty mogły wczytać nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (w tym ciche wewnętrzne logowanie SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
Podczas skryptowania używaj `--json`, aby uzyskać pełne wyjście czytelne maszynowo.

W konfiguracjach wielokontowych polecenia CLI Matrix używają niejawnego domyślnego konta Matrix, chyba że podasz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz, aby operacje weryfikacji lub urządzeń jawnie celowały w nazwane konto:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

### Co oznacza „zweryfikowane”

OpenClaw traktuje to urządzenie Matrix jako zweryfikowane tylko wtedy, gdy zostało zweryfikowane przez twoją własną tożsamość cross-signing.
W praktyce `openclaw matrix verify status --verbose` pokazuje trzy sygnały zaufania:

- `Locally trusted`: to urządzenie jest zaufane tylko przez bieżącego klienta
- `Cross-signing verified`: SDK zgłasza urządzenie jako zweryfikowane przez cross-signing
- `Signed by owner`: urządzenie jest podpisane przez własny klucz self-signing

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecna jest weryfikacja cross-signing lub podpis właściciela.
Samo zaufanie lokalne nie wystarcza, aby OpenClaw traktował urządzenie jako w pełni zweryfikowane.

### Co robi bootstrap

`openclaw matrix verify bootstrap` to polecenie naprawy i konfiguracji dla zaszyfrowanych kont Matrix.
Wykonuje po kolei wszystkie poniższe czynności:

- inicjalizuje secret storage, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjalizuje cross-signing i przesyła brakujące publiczne klucze cross-signing
- próbuje oznaczyć i podpisać cross-signing bieżące urządzenie
- tworzy nową kopię zapasową kluczy pokoi po stronie serwera, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga uwierzytelniania interaktywnego do przesłania kluczy cross-signing, OpenClaw próbuje najpierw przesłać je bez uwierzytelniania, potem z `m.login.dummy`, a następnie z `m.login.password`, gdy skonfigurowane jest `channels.matrix.password`.

Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo chcesz porzucić bieżącą tożsamość cross-signing i utworzyć nową.

Jeśli celowo chcesz porzucić bieżącą kopię zapasową kluczy pokoi i rozpocząć nową
bazę kopii zapasowej dla przyszłych wiadomości, użyj `openclaw matrix verify backup reset --yes`.
Rób to tylko wtedy, gdy akceptujesz, że nieodzyskiwalna stara zaszyfrowana historia pozostanie
niedostępna i że OpenClaw może odtworzyć secret storage, jeśli bieżącego sekretu kopii zapasowej
nie da się bezpiecznie wczytać.

### Nowa baza kopii zapasowej

Jeśli chcesz zachować działanie przyszłych zaszyfrowanych wiadomości i akceptujesz utratę nieodzyskiwalnej starej historii, uruchom kolejno te polecenia:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Dodaj `--account <id>` do każdego polecenia, gdy chcesz jawnie wskazać nazwane konto Matrix.

### Zachowanie przy uruchamianiu

Gdy `encryption: true`, Matrix domyślnie ustawia `startupVerification` na `"if-unverified"`.
Przy uruchamianiu, jeśli to urządzenie nadal nie jest zweryfikowane, Matrix poprosi o samoweryfikację w innym kliencie Matrix,
pominie duplikaty żądań, jeśli jedno jest już w toku, i zastosuje lokalny cooldown przed ponowną próbą po restartach.
Nieudane próby żądań są domyślnie ponawiane szybciej niż udane utworzenie żądania.
Ustaw `startupVerification: "off"`, aby wyłączyć automatyczne żądania przy uruchamianiu, albo dostosuj `startupVerificationCooldownHours`,
jeśli chcesz krótszego lub dłuższego okna ponawiania.

Przy uruchamianiu automatycznie wykonywany jest także zachowawczy przebieg bootstrapu kryptograficznego.
Ten przebieg próbuje najpierw ponownie użyć bieżącego secret storage i tożsamości cross-signing oraz unika resetowania cross-signing, chyba że uruchomisz jawny przepływ naprawy bootstrapu.

Jeśli podczas uruchamiania zostanie wykryty uszkodzony stan bootstrapu, a skonfigurowane jest `channels.matrix.password`, OpenClaw może spróbować bardziej rygorystycznej ścieżki naprawy.
Jeśli bieżące urządzenie jest już podpisane przez właściciela, OpenClaw zachowuje tę tożsamość zamiast resetować ją automatycznie.

Aktualizacja z poprzedniego publicznego pluginu Matrix:

- OpenClaw automatycznie ponownie używa tego samego konta Matrix, tokena dostępu i tożsamości urządzenia, gdy to możliwe.
- Przed uruchomieniem jakichkolwiek zmian migracyjnych Matrix, które wymagają działania, OpenClaw tworzy lub ponownie używa snapshotu odzyskiwania w `~/Backups/openclaw-migrations/`.
- Jeśli używasz wielu kont Matrix, ustaw `channels.matrix.defaultAccount` przed aktualizacją ze starego układu flat-store, aby OpenClaw wiedział, które konto powinno otrzymać ten współdzielony stan legacy.
- Jeśli poprzedni plugin przechowywał lokalnie klucz deszyfrujący kopii zapasowej kluczy pokoi Matrix, uruchamianie lub `openclaw doctor --fix` automatycznie zaimportuje go do nowego przepływu klucza odzyskiwania.
- Jeśli token dostępu Matrix zmienił się po przygotowaniu migracji, uruchamianie skanuje teraz sąsiednie katalogi storage z hashem tokena w poszukiwaniu oczekującego stanu przywracania legacy, zanim zrezygnuje z automatycznego przywracania kopii zapasowej.
- Jeśli token dostępu Matrix zmieni się później dla tego samego konta, homeservera i użytkownika, OpenClaw będzie teraz preferować ponowne użycie najbardziej kompletnego istniejącego katalogu storage z hashem tokena zamiast rozpoczynania od pustego katalogu stanu Matrix.
- Przy następnym uruchomieniu bramy klucze pokoi z kopii zapasowej zostaną automatycznie przywrócone do nowego store kryptograficznego.
- Jeśli stary plugin miał tylko lokalne klucze pokoi, które nigdy nie zostały objęte kopią zapasową, OpenClaw wyświetli wyraźne ostrzeżenie. Tych kluczy nie da się wyeksportować automatycznie z poprzedniego rust crypto store, więc część starej zaszyfrowanej historii może pozostać niedostępna do czasu ręcznego odzyskania.
- Zobacz [Matrix migration](/pl/install/migrating-matrix), aby poznać pełny przebieg aktualizacji, ograniczenia, polecenia odzyskiwania i typowe komunikaty migracji.

Zaszyfrowany stan runtime jest zorganizowany w katalogach per konto, per użytkownik i z hashem tokena w
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ten katalog zawiera store synchronizacji (`bot-storage.json`), store kryptograficzny (`crypto/`),
plik klucza odzyskiwania (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
powiązania wątków (`thread-bindings.json`) oraz stan weryfikacji przy uruchamianiu (`startup-verification.json`),
gdy te funkcje są używane.
Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego
katalogu głównego dla tej trójki konto/homeserver/użytkownik, dzięki czemu wcześniejszy stan synchronizacji, stan kryptograficzny, powiązania wątków
i stan weryfikacji przy uruchamianiu pozostają widoczne.

### Model Node crypto store

Matrix E2EE w tym pluginie używa oficjalnej ścieżki Rust crypto z `matrix-js-sdk` w Node.
Ta ścieżka oczekuje trwałości opartej na IndexedDB, jeśli chcesz, aby stan kryptograficzny przetrwał restarty.

OpenClaw obecnie zapewnia to w Node poprzez:

- używanie `fake-indexeddb` jako shima API IndexedDB oczekiwanego przez SDK
- odtwarzanie zawartości IndexedDB Rust crypto z `crypto-idb-snapshot.json` przed `initRustCrypto`
- utrwalanie zaktualizowanej zawartości IndexedDB z powrotem do `crypto-idb-snapshot.json` po inicjalizacji i podczas runtime
- serializowanie odtwarzania i utrwalania snapshotu względem `crypto-idb-snapshot.json` za pomocą doradczego blokowania pliku, aby utrwalanie runtime bramy i konserwacja CLI nie ścigały się o ten sam plik snapshotu

To jest warstwa zgodności/przechowywania, a nie niestandardowa implementacja kryptografii.
Plik snapshotu jest wrażliwym stanem runtime i jest przechowywany z restrykcyjnymi uprawnieniami pliku.
W modelu bezpieczeństwa OpenClaw host bramy i lokalny katalog stanu OpenClaw już należą do zaufanej granicy operatora, więc jest to przede wszystkim kwestia operacyjnej trwałości, a nie osobna zdalna granica zaufania.

Planowane ulepszenie:

- dodać obsługę SecretRef dla trwałego materiału kluczy Matrix, aby klucze odzyskiwania i powiązane sekrety szyfrowania store mogły pochodzić z providerów sekretów OpenClaw, a nie tylko z lokalnych plików

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, gdy chcesz jawnie wskazać nazwane konto Matrix.

Matrix bezpośrednio akceptuje URL-e awatarów `mxc://`. Gdy podasz URL awatara `http://` lub `https://`, OpenClaw najpierw prześle go do Matrix, a potem zapisze rozwiązany URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub do nadpisania wybranego konta).

## Automatyczne powiadomienia o weryfikacji

Matrix publikuje teraz powiadomienia o cyklu życia weryfikacji bezpośrednio w ścisłym pokoju DM do weryfikacji jako wiadomości `m.notice`.
Obejmuje to:

- powiadomienia o żądaniu weryfikacji
- powiadomienia o gotowości do weryfikacji (z wyraźną instrukcją „Verify by emoji”)
- powiadomienia o rozpoczęciu i zakończeniu weryfikacji
- szczegóły SAS (emoji i liczby dziesiętne), gdy są dostępne

Przychodzące żądania weryfikacji z innego klienta Matrix są śledzone i automatycznie akceptowane przez OpenClaw.
W przepływach samoweryfikacji OpenClaw automatycznie uruchamia także przepływ SAS, gdy weryfikacja emoji staje się dostępna, i potwierdza własną stronę.
W przypadku żądań weryfikacji z innego użytkownika/urządzenia Matrix OpenClaw automatycznie akceptuje żądanie, a następnie czeka, aż przepływ SAS będzie przebiegał normalnie.
Aby ukończyć weryfikację, nadal musisz porównać emoji lub dziesiętny SAS w swoim kliencie Matrix i tam potwierdzić „They match”.

OpenClaw nie akceptuje bezrefleksyjnie duplikatów przepływów zainicjowanych przez siebie. Podczas uruchamiania pomijane jest tworzenie nowego żądania, jeśli żądanie samoweryfikacji jest już w toku.

Powiadomienia systemowe/protokołu weryfikacji nie są przekazywane do pipeline czatu agenta, więc nie powodują `NO_REPLY`.

### Higiena urządzeń

Na koncie mogą gromadzić się stare urządzenia Matrix zarządzane przez OpenClaw, co utrudnia rozumienie zaufania w zaszyfrowanych pokojach.
Wyświetlisz je poleceniem:

```bash
openclaw matrix devices list
```

Usuń nieaktualne urządzenia zarządzane przez OpenClaw poleceniem:

```bash
openclaw matrix devices prune-stale
```

### Naprawa Direct Room

Jeśli stan wiadomości bezpośrednich przestanie być zsynchronizowany, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują stare pokoje solo zamiast aktywnego DM. Sprawdź bieżące mapowanie dla partnera przez:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je za pomocą:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Naprawa zachowuje logikę specyficzną dla Matrix wewnątrz pluginu:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- w przeciwnym razie przechodzi do dowolnego aktualnie dołączonego ścisłego DM 1:1 z tym użytkownikiem
- jeśli nie istnieje żaden zdrowy DM, tworzy nowy pokój direct i przepisuje `m.direct`, aby na niego wskazywał

Przepływ naprawy nie usuwa automatycznie starych pokoi. Wybiera tylko zdrowy DM i aktualizuje mapowanie, aby nowe wysyłki Matrix, powiadomienia o weryfikacji i inne przepływy wiadomości bezpośrednich znów trafiały do właściwego pokoju.

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek przez narzędzie wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routowanie DM Matrix w zakresie nadawcy, więc wiele pokoi DM może współdzielić jedną sesję, gdy rozwiązują się do tego samego partnera.
- `dm.sessionScope: "per-room"` izoluje każdy pokój DM Matrix we własnym kluczu sesji, nadal używając normalnych kontroli uwierzytelniania DM i allowlist.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybrany docelowy klucz sesji.
- `threadReplies: "off"` utrzymuje odpowiedzi na najwyższym poziomie i zachowuje przychodzące wiadomości wątkowe w sesji rodzica.
- `threadReplies: "inbound"` odpowiada w wątku tylko wtedy, gdy wiadomość przychodząca już znajdowała się w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi w pokojach w wątku zakorzenionym w wiadomości wyzwalającej i prowadzi tę konwersację przez odpowiadającą jej sesję z zakresem wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla DM. Na przykład możesz utrzymać izolację wątków w pokojach, a DM pozostawić płaskie.
- Przychodzące wiadomości wątkowe zawierają główną wiadomość wątku jako dodatkowy kontekst dla agenta.
- Wysyłki przez narzędzie wiadomości dziedziczą teraz automatycznie bieżący wątek Matrix, gdy cel to ten sam pokój lub ten sam użytkownik DM, chyba że podano jawne `threadId`.
- Ponowne użycie tego samego celu użytkownika DM w tej samej sesji działa tylko wtedy, gdy bieżące metadane sesji dowodzą tego samego partnera DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routowania w zakresie użytkownika.
- Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji DM Matrix, publikuje w tym pokoju jednorazowe `m.notice` z obejściem `/focus`, gdy włączone są powiązania wątków oraz podpowiedź `dm.sessionScope`.
- Powiązania wątków w runtime są obsługiwane dla Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają teraz w pokojach Matrix i DM.
- Polecenie `/focus` na najwyższym poziomie pokoju/DM Matrix tworzy nowy wątek Matrix i wiąże go z docelową sesją, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix zamiast tego wiąże bieżący wątek.

## Powiązania konwersacji ACP

Pokoje Matrix, DM i istniejące wątki Matrix mogą zostać przekształcone w trwałe obszary robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju lub istniejącego wątku, którego chcesz dalej używać.
- W przypadku DM lub pokoju Matrix na najwyższym poziomie bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- W istniejącym wątku Matrix `--bind here` wiąże bieżący wątek na miejscu.
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

Flagi uruchamiania powiązanego z wątkiem dla Matrix są opcjonalne:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby umożliwić `/focus` na najwyższym poziomie tworzenie i wiązanie nowych wątków Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby umożliwić `/acp spawn --thread auto|here` wiązanie sesji ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach oraz przychodzące reakcje potwierdzające.

- Narzędzia dla wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do określonego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla określonego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota na tym zdarzeniu.
- `remove: true` usuwa tylko wskazaną reakcję emoji z konta bota.

Zakres reakcji potwierdzających jest rozwiązywany w standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback do emoji tożsamości agenta

Zakres `ackReaction` jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Obecne zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy są skierowane do wiadomości Matrix napisanych przez bota.
- `reactionNotifications: "off"` wyłącza systemowe zdarzenia reakcji.
- Usunięcia reakcji nadal nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix przedstawia je jako redactions, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość z pokoju Matrix wyzwala agenta.
- Wartość rezerwowa pochodzi z `messages.groupChat.historyLimit`. Jeśli oba ustawienia nie są ustawione, efektywna wartość domyślna to `0`, więc wiadomości z pokoju bramkowane wzmianką nie są buforowane. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix jest tylko pokojowa. DM nadal używają normalnej historii sesji.
- Historia pokoju Matrix jest tylko oczekująca: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wyzwoliły odpowiedzi, a następnie robi snapshot tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównym treści przychodzącej dla tej tury.
- Ponowienia tego samego zdarzenia Matrix ponownie używają oryginalnego snapshotu historii zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje wspólną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` to ustawienie domyślne. Uzupełniający kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne sprawdzenia allowlist pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność uzupełniającego kontekstu, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwolenia nadal wynika z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i polityki DM.

## Przykład polityki DM i pokoju

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

Zobacz [Groups](/pl/channels/groups), aby poznać zachowanie bramkowania wzmiankami i allowlist.

Przykład parowania dla wiadomości DM w Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal do ciebie pisze przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i po krótkim cooldownie może ponownie wysłać odpowiedź-przypomnienie zamiast generować nowy kod.

Zobacz [Pairing](/pl/channels/pairing), aby poznać wspólny przepływ parowania DM i układ przechowywania.

## Zatwierdzenia exec

Matrix może działać jako klient zatwierdzeń exec dla konta Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalne; fallback do `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzeń wracają do innych skonfigurowanych ścieżek zatwierdzania albo do polityki fallback zatwierdzeń exec.

Natywne routowanie Matrix dotyczy dziś tylko exec:

- `channels.matrix.execApprovals.*` kontroluje natywne routowanie DM/kanałowe tylko dla zatwierdzeń exec.
- Zatwierdzenia pluginów nadal używają współdzielonego `/approve` w tym samym czacie oraz ewentualnego skonfigurowanego przekazywania `approvals.plugin`.
- Matrix nadal może ponownie użyć `channels.matrix.dm.allowFrom` do autoryzacji zatwierdzeń pluginów, gdy może bezpiecznie wywnioskować zatwierdzających, ale nie udostępnia osobnej natywnej ścieżki rozsyłania zatwierdzeń pluginów do DM/kanału.

Zasady dostarczania:

- `target: "dm"` wysyła monity zatwierdzeń do wiadomości DM zatwierdzających
- `target: "channel"` odsyła monit do źródłowego pokoju lub DM Matrix
- `target: "both"` wysyła do DM zatwierdzających oraz do źródłowego pokoju lub DM Matrix

Monity zatwierdzeń Matrix ustawiają skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` = zezwól raz
- `❌` = odmów
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez efektywną politykę exec

Zatwierdzający mogą zareagować na tę wiadomość albo użyć zapasowych poleceń slash: `/approve <id> allow-once`, `/approve <id> allow-always` albo `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odmawiać. Dostarczanie kanałowe obejmuje tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Monity zatwierdzeń Matrix ponownie używają współdzielonego planera zatwierdzeń rdzenia. Natywna powierzchnia specyficzna dla Matrix jest tylko transportem dla zatwierdzeń exec: routowaniem pokój/DM oraz zachowaniem wysyłania/aktualizacji/usuwania wiadomości.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Exec approvals](/pl/tools/exec-approvals)

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

Wartości najwyższego poziomu `channels.matrix` działają jako ustawienia domyślne dla nazwanych kont, chyba że konto je nadpisze.
Możesz ograniczyć dziedziczony wpis pokoju do jednego konta Matrix za pomocą `groups.<room>.account` (lub legacy `rooms.<room>.account`).
Wpisy bez `account` pozostają współdzielone przez wszystkie konta Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone ustawienia domyślne uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje konto najwyższego poziomu `default` tylko wtedy, gdy to konto domyślne ma świeże uwierzytelnianie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta nadal mogą pozostać wykrywalne z `homeserver` plus `userId`, gdy później buforowane dane uwierzytelniające spełnią wymagania uwierzytelnienia.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, naprawa/awans z konfiguracji jednego konta do wielu kont zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Do tego awansowanego konta przenoszone są tylko klucze uwierzytelniania/bootstrapu Matrix; współdzielone klucze polityk dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix dla niejawnego routowania, probing i operacji CLI.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` lub przekazuj `--account <id>` w poleceniach CLI, które polegają na niejawnej selekcji konta.
Przekaż `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla pojedynczego polecenia.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz zgodę per konto.

Jeśli twój homeserver działa na localhost, adresie LAN/Tailscale lub wewnętrznej nazwie hosta, włącz
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

Przykład konfiguracji w CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Ta zgoda obejmuje tylko zaufane cele prywatne/wewnętrzne. Publiczne homeservery działające po zwykłym tekście, takie jak
`http://matrix.example.org:8008`, nadal pozostają blokowane. Gdy to możliwe, preferuj `https://`.

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

Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu przez `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w runtime i dla sond statusu kont.

## Rozwiązywanie celów

Matrix akceptuje następujące formy celu wszędzie tam, gdzie OpenClaw prosi o pokój lub cel użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokoi bezpośrednio akceptują jawne ID pokoi i aliasy, a następnie w razie potrzeby przechodzą do przeszukiwania nazw dołączonych pokoi dla tego konta.
- Wyszukiwanie po nazwie dołączonego pokoju ma charakter best-effort. Jeśli nazwy pokoju nie da się rozwiązać do ID ani aliasu, jest ona ignorowana przez rozwiązywanie allowlist w runtime.

## Informacje referencyjne konfiguracji

- `enabled`: włącz lub wyłącz kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowane ID konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `allowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz tę opcję, gdy homeserver rozwiązuje się do `localhost`, adresu LAN/Tailscale albo wewnętrznego hosta, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisać domyślne ustawienie najwyższego poziomu własnym `proxy`.
- `userId`: pełne ID użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenie. Zwykłe wartości tekstowe i wartości SecretRef są obsługiwane dla `channels.matrix.accessToken` oraz `channels.matrix.accounts.<id>.accessToken` w providerach env/file/exec. Zobacz [Secrets Management](/pl/gateway/secrets).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są zwykłe wartości tekstowe i wartości SecretRef.
- `deviceId`: jawne ID urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia przy logowaniu hasłem.
- `avatarUrl`: zapisany URL własnego awatara dla synchronizacji profilu i aktualizacji `set-profile`.
- `initialSyncLimit`: limit zdarzeń synchronizacji przy uruchamianiu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: wymusza tryb wyłącznie allowlist dla DM i pokoi.
- `allowBots`: pozwala na wiadomości od innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` albo `disabled`.
- `contextVisibility`: tryb widoczności uzupełniającego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID użytkowników dla ruchu pokojowego.
- Wpisy `groupAllowFrom` powinny być pełnymi ID użytkowników Matrix. Nierozwiązane nazwy są ignorowane w runtime.
- `historyLimit`: maksymalna liczba wiadomości z pokoju do uwzględnienia jako kontekst historii grupy. Wartość rezerwowa pochodzi z `messages.groupChat.historyLimit`; jeśli oba ustawienia nie są ustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first` albo `all`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `partial`, `quiet`, `true` albo `false`. `partial` i `true` włączają aktualizacje wersji roboczej „najpierw podgląd” przy użyciu zwykłych wiadomości tekstowych Matrix. `quiet` używa niepowiadamiających informacji o podglądzie dla samodzielnie hostowanych konfiguracji reguł push.
- `blockStreaming`: `true` włącza osobne wiadomości postępu dla ukończonych bloków asystenta, gdy aktywne jest strumieniowanie wersji roboczej podglądu.
- `threadReplies`: `off`, `inbound` albo `always`.
- `threadBindings`: nadpisania per kanał dla routowania i cyklu życia sesji powiązanych z wątkiem.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy uruchamianiu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown przed ponowną próbą automatycznych żądań weryfikacji przy uruchamianiu.
- `textChunkLimit`: rozmiar fragmentu wiadomości wychodzącej.
- `chunkMode`: `length` albo `newline`.
- `responsePrefix`: opcjonalny prefiks wiadomości dla odpowiedzi wychodzących.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzającej dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzającej (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla obsługi multimediów Matrix. Dotyczy wysyłek wychodzących i przetwarzania multimediów przychodzących.
- `autoJoin`: polityka automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy zaproszeń Matrix ogólnie, w tym zaproszeń w stylu DM, a nie tylko zaproszeń do pokoi/grup. OpenClaw podejmuje tę decyzję w momencie zaproszenia, zanim może wiarygodnie sklasyfikować dołączony pokój jako DM lub grupę.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do ID pokoi podczas obsługi zaproszenia; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zaproszony pokój.
- `dm`: blok polityki DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do DM po dołączeniu OpenClaw do pokoju i sklasyfikowaniu go jako DM. Nie zmienia tego, czy zaproszenie jest automatycznie akceptowane.
- Wpisy `dm.allowFrom` powinny być pełnymi ID użytkowników Matrix, chyba że już zostały rozwiązane przez wyszukiwanie katalogu na żywo.
- `dm.sessionScope`: `per-user` (domyślnie) albo `per-room`. Użyj `per-room`, jeśli chcesz, aby każdy pokój DM Matrix zachowywał osobny kontekst, nawet jeśli partner jest ten sam.
- `dm.threadReplies`: nadpisanie polityki wątków tylko dla DM (`off`, `inbound`, `always`). Nadpisuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umiejscowienia odpowiedzi, jak i izolacji sesji w DM.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec w Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID użytkowników Matrix uprawnionych do zatwierdzania żądań exec. Opcjonalne, gdy `dm.allowFrom` już identyfikuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako ustawienia domyślne dla tych wpisów.
- `groups`: mapa polityk per pokój. Preferuj ID pokoi lub aliasy; nierozwiązane nazwy pokoi są ignorowane w runtime. Tożsamość sesji/grupy po rozwiązaniu używa stabilnego ID pokoju, a czytelne dla człowieka etykiety nadal pochodzą z nazw pokoi.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: allowlist nadawców per pokój.
- `groups.<room>.tools`: nadpisania allow/deny narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami na poziomie pokoju. `true` wyłącza wymagania wzmianki dla tego pokoju; `false` ponownie je wymusza.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment system promptu na poziomie pokoju.
- `rooms`: legacy alias dla `groups`.
- `actions`: kontrola narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmiankami
- [Channel Routing](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
