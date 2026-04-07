---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji w Matrix
summary: Status obsługi Matrix, konfiguracja i przykłady ustawień
title: Matrix
x-i18n:
    generated_at: "2026-04-07T09:46:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d53baa2ea5916cd00a99cae0ded3be41ffa13c9a69e8ea8461eb7baa6a99e13c
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix to dołączony plugin kanału Matrix dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje DM-y, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony plugin

Matrix jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego builda lub niestandardowej instalacji, która nie zawiera Matrix, zainstaluj
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
4. Uruchom ponownie gateway.
5. Rozpocznij DM z botem albo zaproś go do pokoju.
   - Nowe zaproszenia w Matrix działają tylko wtedy, gdy zezwala na to `channels.matrix.autoJoin`.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

O co dokładnie pyta kreator Matrix:

- URL homeservera
- metoda uwierzytelniania: access token albo hasło
- ID użytkownika tylko wtedy, gdy wybierzesz uwierzytelnianie hasłem
- opcjonalna nazwa urządzenia
- czy włączyć E2EE
- czy skonfigurować teraz dostęp do pokoju Matrix
- czy skonfigurować teraz automatyczne dołączanie do zaproszeń Matrix
- gdy automatyczne dołączanie do zaproszeń jest włączone, czy ma to być `allowlist`, `always`, czy `off`

Ważne zachowanie kreatora:

- Jeśli dla wybranego konta istnieją już zmienne środowiskowe uwierzytelniania Matrix, a to konto nie ma jeszcze zapisanych danych uwierzytelniających w configu, kreator oferuje skrót przez env, aby konfiguracja mogła zachować uwierzytelnianie w zmiennych środowiskowych zamiast kopiować sekrety do configu.
- Gdy interaktywnie dodajesz kolejne konto Matrix, wpisana nazwa konta jest normalizowana do ID konta używanego w configu i zmiennych środowiskowych. Na przykład `Ops Bot` staje się `ops-bot`.
- Prompty allowlisty dla DM akceptują od razu pełne wartości `@user:server`. Same nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie dokładnie jedno dopasowanie; w przeciwnym razie kreator poprosi o ponowną próbę z pełnym ID Matrix.
- Prompty allowlisty pokoju akceptują bezpośrednio ID pokoi i aliasy. Mogą także rozwiązywać nazwy dołączonych pokoi na żywo, ale nierozwiązane nazwy są podczas konfiguracji zachowywane tylko w wpisanej postaci i później są ignorowane przez rozwiązywanie allowlisty w runtime. Preferuj `!room:server` lub `#alias:server`.
- Kreator pokazuje teraz wyraźne ostrzeżenie przed krokiem automatycznego dołączania do zaproszeń, ponieważ `channels.matrix.autoJoin` domyślnie ma wartość `off`; agenty nie dołączą do zaproszonych pokoi ani nowych zaproszeń typu DM, jeśli tego nie ustawisz.
- W trybie allowlisty dla automatycznego dołączania do zaproszeń używaj tylko stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane.
- Tożsamość pokoju/sesji w runtime używa stabilnego ID pokoju Matrix. Aliasy zadeklarowane przez pokój są używane tylko jako dane wejściowe do wyszukiwania, a nie jako długoterminowy klucz sesji lub stabilna tożsamość grupy.
- Aby rozwiązać nazwy pokoi przed ich zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` domyślnie ma wartość `off`.

Jeśli pozostawisz to pole nieustawione, bot nie będzie dołączać do zaproszonych pokoi ani nowych zaproszeń typu DM, więc nie pojawi się w nowych grupach ani zaproszonych DM-ach, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia akceptuje, albo ustaw `autoJoin: "always"`, jeśli chcesz, aby dołączał do każdego zaproszenia.

W trybie `allowlist` `autoJoinAllowlist` akceptuje tylko `!roomId:server`, `#alias:server` lub `*`.
</Warning>

Przykład allowlisty:

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

Dołącz do każdego zaproszenia:

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
Gdy znajdują się tam zbuforowane poświadczenia, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby setupu, doctor i wykrywania statusu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w configu.

Odpowiedniki w zmiennych środowiskowych (używane, gdy klucz configu nie jest ustawiony):

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

Matrix zmienia interpunkcję w ID kont, aby zmienne środowiskowe z zakresem konta nie kolidowały ze sobą.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót ze zmiennymi środowiskowymi tylko wtedy, gdy te zmienne uwierzytelniania już istnieją, a wybrane konto nie ma jeszcze zapisanych danych uwierzytelniających Matrix w configu.

## Przykład konfiguracji

To praktyczna bazowa konfiguracja z parowaniem DM, allowlistą pokojów i włączonym E2EE:

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

`autoJoin` dotyczy ogólnie zaproszeń Matrix, nie tylko zaproszeń do pokoi/grup.
Obejmuje to także nowe zaproszenia typu DM. W momencie zaproszenia OpenClaw nie wie jeszcze
wiarygodnie, czy zaproszony pokój zostanie ostatecznie potraktowany jako DM czy grupa, więc wszystkie
zaproszenia najpierw przechodzą przez to samo rozstrzygnięcie `autoJoin`. `dm.policy` nadal ma
zastosowanie po dołączeniu bota i sklasyfikowaniu pokoju jako DM, więc `autoJoin` kontroluje zachowanie
dołączania, a `dm.policy` kontroluje zachowanie odpowiedzi/dostępu.

## Podgląd streamingu

Streaming odpowiedzi w Matrix jest włączany opcjonalnie.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał jedną odpowiedź
podglądu na żywo, edytował ten podgląd na bieżąco podczas generowania tekstu przez model, a następnie finalizował go po zakończeniu odpowiedzi:

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
- `streaming: "partial"` tworzy jeden edytowalny komunikat podglądu dla bieżącego bloku odpowiedzi asystenta przy użyciu zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie powiadomień Matrix oparte na pierwszym podglądzie, więc standardowi klienci mogą powiadamiać przy pierwszym strumieniowanym tekście podglądu zamiast przy ukończonym bloku.
- `streaming: "quiet"` tworzy jeden edytowalny cichy komunikat podglądu dla bieżącego bloku odpowiedzi asystenta. Używaj tego tylko wtedy, gdy skonfigurujesz także reguły push odbiorców dla sfinalizowanych edycji podglądu.
- `blockStreaming: true` włącza osobne komunikaty postępu Matrix. Gdy streaming podglądu jest włączony, Matrix utrzymuje szkic na żywo dla bieżącego bloku i zachowuje ukończone bloki jako osobne wiadomości.
- Gdy podgląd streamingu jest włączony, a `blockStreaming` jest wyłączone, Matrix edytuje szkic na żywo w miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestaje mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje streaming podglądu i wraca do zwykłego końcowego dostarczenia.
- Odpowiedzi z mediami nadal wysyłają załączniki normalnie. Jeśli nie da się już bezpiecznie ponownie użyć nieaktualnego podglądu, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi z mediami.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw streaming wyłączony, jeśli chcesz najbardziej zachowawcze zachowanie względem limitów szybkości.

`blockStreaming` samo w sobie nie włącza podglądów szkicu.
Użyj `streaming: "partial"` albo `streaming: "quiet"` dla edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz także, aby ukończone bloki asystenta pozostawały widoczne jako osobne komunikaty postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania opartego na pierwszym podglądzie albo pozostaw `streaming` wyłączone dla dostarczania tylko końcowego. Gdy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą powiadamiającą wiadomość Matrix.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą powiadamiającą wiadomość Matrix.

### Samohostowane reguły push dla cichych sfinalizowanych podglądów

Jeśli uruchamiasz własną infrastrukturę Matrix i chcesz, aby ciche podglądy powiadamiały dopiero po zakończeniu bloku lub
końcowej odpowiedzi, ustaw `streaming: "quiet"` i dodaj regułę push per użytkownik dla sfinalizowanych edycji podglądu.

Zwykle jest to konfiguracja po stronie użytkownika-odbiorcy, a nie globalna zmiana konfiguracji homeservera:

Szybka mapa przed rozpoczęciem:

- użytkownik-odbiorca = osoba, która ma otrzymywać powiadomienie
- użytkownik bota = konto Matrix OpenClaw, które wysyła odpowiedź
- dla poniższych wywołań API użyj access tokenu użytkownika-odbiorcy
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

2. Upewnij się, że konto odbiorcy już otrzymuje zwykłe powiadomienia push Matrix. Reguły
   cichych podglądów działają tylko wtedy, gdy ten użytkownik ma już działające pushery/urządzenia.

3. Pobierz access token użytkownika-odbiorcy.
   - Użyj tokenu użytkownika odbierającego, nie tokenu bota.
   - Najłatwiej zwykle ponownie użyć tokenu istniejącej sesji klienta.
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

4. Zweryfikuj, że konto odbiorcy ma już pushery:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jeśli to zwróci brak aktywnych pusherów/urządzeń, najpierw napraw zwykłe powiadomienia Matrix, zanim dodasz
poniższą regułę OpenClaw.

OpenClaw oznacza sfinalizowane edycje podglądu zawierające wyłącznie tekst przez:

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

Ważne dla konfiguracji z wieloma botami:

- Kluczem reguł push jest `ruleId`. Ponowne uruchomienie `PUT` dla tego samego ID reguły aktualizuje tę jedną regułę.
- Jeśli jeden użytkownik odbierający ma otrzymywać powiadomienia od wielu kont botów Matrix OpenClaw, utwórz jedną regułę na bota z unikalnym ID reguły dla każdego dopasowania nadawcy.
- Prosty wzorzec to `openclaw-finalized-preview-<botname>`, na przykład `openclaw-finalized-preview-ops` albo `openclaw-finalized-preview-support`.

Reguła jest oceniana względem nadawcy zdarzenia:

- uwierzytelnij się przy użyciu tokenu użytkownika odbierającego
- dopasuj `sender` do MXID bota OpenClaw

6. Zweryfikuj, że reguła istnieje:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Przetestuj odpowiedź strumieniowaną. W trybie quiet pokój powinien pokazywać cichy szkic podglądu, a końcowa
   edycja w miejscu powinna wysłać powiadomienie po zakończeniu bloku lub tury.

Jeśli później będziesz potrzebować usunąć regułę, usuń to samo ID reguły przy użyciu tokenu użytkownika odbierającego:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Uwagi:

- Utwórz regułę przy użyciu access tokenu użytkownika odbierającego, a nie tokenu bota.
- Nowe zdefiniowane przez użytkownika reguły `override` są wstawiane przed domyślnymi regułami wyciszającymi, więc nie jest potrzebny dodatkowy parametr kolejności.
- Dotyczy to tylko edycji podglądu zawierających wyłącznie tekst, które OpenClaw może bezpiecznie sfinalizować w miejscu. Fallbacki dla mediów i fallbacki dla nieaktualnych podglądów nadal używają zwykłego dostarczania Matrix.
- Jeśli `GET /_matrix/client/v3/pushers` nie pokazuje pusherów, użytkownik nie ma jeszcze działającego dostarczania powiadomień push Matrix dla tego konta/urządzenia.

#### Synapse

W przypadku Synapse powyższa konfiguracja zwykle sama w sobie wystarcza:

- Nie jest wymagana specjalna zmiana `homeserver.yaml` dla sfinalizowanych powiadomień o podglądzie OpenClaw.
- Jeśli twoje wdrożenie Synapse już wysyła zwykłe powiadomienia push Matrix, głównym krokiem konfiguracji jest token użytkownika + powyższe wywołanie `pushrules`.
- Jeśli uruchamiasz Synapse za reverse proxy lub workerami, upewnij się, że `/_matrix/client/.../pushrules/` poprawnie trafia do Synapse.
- Jeśli używasz workerów Synapse, upewnij się, że pushery są sprawne. Dostarczaniem push zajmuje się proces główny albo `synapse.app.pusher` / skonfigurowane workery pushera.

#### Tuwunel

W przypadku Tuwunel użyj tego samego przepływu konfiguracji i wywołania API `pushrules`, które pokazano wyżej:

- Nie jest wymagana konfiguracja specyficzna dla Tuwunel dla samego znacznika sfinalizowanego podglądu.
- Jeśli zwykłe powiadomienia Matrix już działają dla tego użytkownika, głównym krokiem konfiguracji jest token użytkownika + powyższe wywołanie `pushrules`.
- Jeśli powiadomienia wydają się znikać, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy włączono `suppress_push_when_active`. Tuwunel dodał tę opcję w Tuwunel 1.4.2 12 września 2025 i może ona celowo wyciszać powiadomienia push na innych urządzeniach, gdy jedno urządzenie jest aktywne.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, więc podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Niezaszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — plugin automatycznie wykrywa stan E2EE.

### Pokoje bot-do-bota

Domyślnie wiadomości Matrix pochodzące od innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, jeśli celowo chcesz zezwolić na ruch Matrix między agentami:

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
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach widocznie wspominają tego bota. DM-y są nadal dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego ID użytkownika Matrix, aby uniknąć pętli odpowiedzi do siebie.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym gateway OpenClaw”.

Przy włączaniu ruchu bot-do-bota we wspólnych pokojach używaj ścisłych allowlist pokojów i wymagań wzmianki.

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

Status szczegółowy (pełna diagnostyka):

```bash
openclaw matrix verify status --verbose
```

Dołącz zapisany recovery key w danych wyjściowych czytelnych maszynowo:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Zainicjuj cross-signing i stan weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Obsługa wielu kont: użyj `channels.matrix.accounts` z poświadczeniami per konto i opcjonalnym `name`. Wspólny wzorzec opisano w [Configuration reference](/pl/gateway/configuration-reference#multi-account-all-channels).

Szczegółowa diagnostyka bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Wymuś nowy reset tożsamości cross-signing przed bootstrapowaniem:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Zweryfikuj to urządzenie za pomocą recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Szczegóły szczegółowej weryfikacji urządzenia:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Sprawdź stan kopii zapasowej room key:

```bash
openclaw matrix verify backup status
```

Szczegółowa diagnostyka stanu kopii zapasowej:

```bash
openclaw matrix verify backup status --verbose
```

Przywróć room key z kopii zapasowej na serwerze:

```bash
openclaw matrix verify backup restore
```

Szczegółowa diagnostyka przywracania:

```bash
openclaw matrix verify backup restore --verbose
```

Usuń bieżącą kopię zapasową na serwerze i utwórz nową bazową kopię zapasową. Jeśli zapisany
klucz kopii zapasowej nie może zostać poprawnie załadowany, ten reset może również odtworzyć secret storage, aby
przyszłe cold starty mogły załadować nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (w tym z cichym wewnętrznym logowaniem SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
Przy skryptowaniu użyj `--json`, aby uzyskać pełne dane wyjściowe czytelne maszynowo.

W konfiguracjach wielokontowych polecenia CLI Matrix używają domyślnego niejawnego konta Matrix, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account` zawsze wtedy, gdy chcesz, aby operacje weryfikacji lub urządzeń jawnie kierowały się do nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują klucz configu tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

### Co oznacza „verified”

OpenClaw traktuje to urządzenie Matrix jako zweryfikowane tylko wtedy, gdy jest zweryfikowane przez twoją własną tożsamość cross-signing.
W praktyce `openclaw matrix verify status --verbose` pokazuje trzy sygnały zaufania:

- `Locally trusted`: temu urządzeniu ufa tylko bieżący klient
- `Cross-signing verified`: SDK zgłasza urządzenie jako zweryfikowane przez cross-signing
- `Signed by owner`: urządzenie jest podpisane twoim własnym kluczem self-signing

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecna jest weryfikacja cross-signing lub podpis właściciela.
Samo lokalne zaufanie nie wystarcza, aby OpenClaw traktował urządzenie jako w pełni zweryfikowane.

### Co robi bootstrap

`openclaw matrix verify bootstrap` to polecenie naprawy i konfiguracji dla zaszyfrowanych kont Matrix.
Wykonuje po kolei wszystkie poniższe czynności:

- inicjalizuje secret storage, ponownie używając istniejącego recovery key, gdy to możliwe
- inicjalizuje cross-signing i wysyła brakujące publiczne klucze cross-signing
- próbuje oznaczyć i podpisać bieżące urządzenie przez cross-signing
- tworzy nową kopię zapasową room key po stronie serwera, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga interaktywnego uwierzytelnienia do wysłania kluczy cross-signing, OpenClaw próbuje najpierw wysłać je bez uwierzytelnienia, potem z `m.login.dummy`, a następnie z `m.login.password`, gdy skonfigurowano `channels.matrix.password`.

Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo chcesz odrzucić bieżącą tożsamość cross-signing i utworzyć nową.

Jeśli celowo chcesz odrzucić bieżącą kopię zapasową room key i rozpocząć nową
bazę kopii zapasowej dla przyszłych wiadomości, użyj `openclaw matrix verify backup reset --yes`.
Rób to tylko wtedy, gdy akceptujesz, że nieodwracalnie utracona stara zaszyfrowana historia pozostanie
niedostępna i że OpenClaw może odtworzyć secret storage, jeśli nie da się bezpiecznie załadować
bieżącego sekretu kopii zapasowej.

### Nowa baza kopii zapasowej

Jeśli chcesz zachować działanie przyszłych zaszyfrowanych wiadomości i akceptujesz utratę niemożliwej do odzyskania starej historii, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Dodaj `--account <id>` do każdego polecenia, jeśli chcesz jawnie kierować je do nazwanego konta Matrix.

### Zachowanie przy uruchomieniu

Gdy `encryption: true`, Matrix domyślnie ustawia `startupVerification` na `"if-unverified"`.
Przy uruchomieniu, jeśli to urządzenie nadal nie jest zweryfikowane, Matrix wyśle prośbę o samoweryfikację do innego klienta Matrix,
pominie duplikaty próśb, gdy jedna jest już oczekująca, i zastosuje lokalny cooldown przed ponowną próbą po restartach.
Domyślnie nieudane próby wysłania są ponawiane szybciej niż pomyślne utworzenie prośby.
Ustaw `startupVerification: "off"`, aby wyłączyć automatyczne prośby przy uruchomieniu, albo dostosuj `startupVerificationCooldownHours`,
jeśli chcesz krótsze lub dłuższe okno ponawiania.

Podczas uruchomienia automatycznie wykonywany jest również zachowawczy przebieg bootstrap kryptografii.
Ten przebieg najpierw próbuje ponownie użyć bieżącego secret storage i tożsamości cross-signing oraz unika resetowania cross-signing, chyba że uruchomisz jawny przepływ naprawczy bootstrap.

Jeśli przy uruchomieniu zostanie wykryty uszkodzony stan bootstrap i skonfigurowano `channels.matrix.password`, OpenClaw może spróbować bardziej rygorystycznej ścieżki naprawy.
Jeśli bieżące urządzenie jest już podpisane przez właściciela, OpenClaw zachowuje tę tożsamość zamiast resetować ją automatycznie.

Uaktualnianie z poprzedniego publicznego pluginu Matrix:

- OpenClaw automatycznie ponownie używa tego samego konta Matrix, access tokenu i tożsamości urządzenia, gdy to możliwe.
- Zanim zostaną uruchomione jakiekolwiek działania migracyjne dotyczące Matrix, OpenClaw tworzy lub ponownie używa snapshotu odzyskiwania w `~/Backups/openclaw-migrations/`.
- Jeśli używasz wielu kont Matrix, ustaw `channels.matrix.defaultAccount` przed aktualizacją ze starego układu flat-store, aby OpenClaw wiedział, które konto ma otrzymać ten współdzielony stary stan.
- Jeśli poprzedni plugin przechowywał lokalnie klucz deszyfrujący kopii zapasowej room key Matrix, uruchomienie lub `openclaw doctor --fix` automatycznie zaimportuje go do nowego przepływu recovery key.
- Jeśli access token Matrix zmienił się po przygotowaniu migracji, uruchomienie skanuje teraz sąsiednie katalogi główne storage oparte o hash tokenu w poszukiwaniu oczekującego starego stanu do przywrócenia, zanim zrezygnuje z automatycznego przywracania kopii zapasowej.
- Jeśli access token Matrix zmieni się później dla tego samego konta, homeservera i użytkownika, OpenClaw będzie teraz preferować ponowne użycie najbardziej kompletnego istniejącego katalogu głównego storage opartego o hash tokenu zamiast zaczynać od pustego katalogu stanu Matrix.
- Przy następnym uruchomieniu gateway klucze pokojów z kopii zapasowej zostaną automatycznie przywrócone do nowego store kryptograficznego.
- Jeśli stary plugin miał tylko lokalne room key, których nigdy nie zarchiwizowano, OpenClaw wyraźnie ostrzeże. Tych kluczy nie da się automatycznie wyeksportować z poprzedniego rust crypto store, więc część starej zaszyfrowanej historii może pozostać niedostępna do czasu ręcznego odzyskania.
- Zobacz [Matrix migration](/pl/install/migrating-matrix), aby poznać pełny przepływ aktualizacji, ograniczenia, polecenia odzyskiwania i częste komunikaty migracji.

Zaszyfrowany stan runtime jest zorganizowany w katalogach głównych per konto, per użytkownik, opartych o hash tokenu w
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ten katalog zawiera sync store (`bot-storage.json`), crypto store (`crypto/`),
plik recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
powiązania wątków (`thread-bindings.json`) oraz stan weryfikacji przy uruchomieniu (`startup-verification.json`),
gdy te funkcje są używane.
Gdy token zmienia się, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego
katalogu głównego dla tej krotki konto/homeserver/użytkownik, aby wcześniejszy stan synchronizacji, stan kryptograficzny, powiązania wątków
i stan weryfikacji przy uruchomieniu pozostawały widoczne.

### Model Node crypto store

Matrix E2EE w tym pluginie używa oficjalnej ścieżki Rust crypto `matrix-js-sdk` w Node.
Ta ścieżka oczekuje trwałości opartej na IndexedDB, jeśli chcesz, aby stan kryptograficzny przetrwał restarty.

OpenClaw obecnie zapewnia to w Node przez:

- użycie `fake-indexeddb` jako shima API IndexedDB oczekiwanego przez SDK
- przywracanie zawartości Rust crypto IndexedDB z `crypto-idb-snapshot.json` przed `initRustCrypto`
- utrwalanie zaktualizowanej zawartości IndexedDB z powrotem do `crypto-idb-snapshot.json` po inicjalizacji i podczas runtime
- serializowanie przywracania i utrwalania snapshotów względem `crypto-idb-snapshot.json` za pomocą doradczego blokowania pliku, aby utrwalanie w runtime gateway i utrzymanie przez CLI nie ścigały się o ten sam plik snapshotu

To jest warstwa zgodności/przechowywania, a nie niestandardowa implementacja kryptografii.
Plik snapshotu jest wrażliwym stanem runtime i jest przechowywany z restrykcyjnymi uprawnieniami do pliku.
W modelu bezpieczeństwa OpenClaw host gateway i lokalny katalog stanu OpenClaw już znajdują się wewnątrz granicy zaufanego operatora, więc jest to przede wszystkim kwestia operacyjnej trwałości, a nie osobna granica zaufania zdalnego.

Planowane usprawnienie:

- dodać obsługę SecretRef dla trwałego materiału kluczy Matrix, aby recovery key i powiązane sekrety szyfrowania store mogły pochodzić z providerów sekretów OpenClaw zamiast wyłącznie z lokalnych plików

## Zarządzanie profilem

Zaktualizuj profil własny Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, jeśli chcesz jawnie wskazać nazwane konto Matrix.

Matrix akceptuje bezpośrednio URL-e avatarów `mxc://`. Gdy przekażesz URL avatara `http://` lub `https://`, OpenClaw najpierw prześle go do Matrix i zapisze rozwiązany URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub wybranego nadpisania konta).

## Automatyczne powiadomienia o weryfikacji

Matrix publikuje teraz powiadomienia o cyklu życia weryfikacji bezpośrednio w ścisłym pokoju DM weryfikacji jako wiadomości `m.notice`.
Obejmuje to:

- powiadomienia o prośbie o weryfikację
- powiadomienia o gotowości do weryfikacji (z wyraźną wskazówką „Zweryfikuj przez emoji”)
- powiadomienia o rozpoczęciu i zakończeniu weryfikacji
- szczegóły SAS (emoji i liczby dziesiętne), gdy są dostępne

Przychodzące prośby o weryfikację z innego klienta Matrix są śledzone i automatycznie akceptowane przez OpenClaw.
W przepływach samoweryfikacji OpenClaw automatycznie rozpoczyna też przepływ SAS, gdy weryfikacja emoji staje się dostępna, i potwierdza swoją stronę.
W przypadku próśb o weryfikację od innego użytkownika/urządzenia Matrix OpenClaw automatycznie akceptuje prośbę, a następnie czeka na normalny przebieg przepływu SAS.
Aby zakończyć weryfikację, nadal musisz porównać emoji lub dziesiętny SAS w swoim kliencie Matrix i potwierdzić tam „Pasują”.

OpenClaw nie akceptuje bezrefleksyjnie duplikatów przepływów inicjowanych przez siebie. Przy uruchomieniu pomija tworzenie nowej prośby, jeśli prośba o samoweryfikację już oczekuje.

Powiadomienia protokołowe/systemowe weryfikacji nie są przekazywane do pipeline czatu agenta, więc nie generują `NO_REPLY`.

### Higiena urządzeń

Na koncie mogą gromadzić się stare urządzenia Matrix zarządzane przez OpenClaw, co utrudnia ocenę zaufania w zaszyfrowanych pokojach.
Wyświetl je poleceniem:

```bash
openclaw matrix devices list
```

Usuń nieaktualne urządzenia zarządzane przez OpenClaw poleceniem:

```bash
openclaw matrix devices prune-stale
```

### Naprawa Direct Room

Jeśli stan wiadomości bezpośrednich się rozjedzie, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują stare pokoje solo zamiast aktywnego DM. Sprawdź bieżące mapowanie dla partnera przez:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je przez:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Naprawa zachowuje logikę specyficzną dla Matrix wewnątrz pluginu:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- w przeciwnym razie wraca do dowolnego aktualnie dołączonego ścisłego DM 1:1 z tym użytkownikiem
- jeśli nie istnieje żaden zdrowy DM, tworzy nowy pokój bezpośredni i przepisuje `m.direct`, aby na niego wskazywało

Przepływ naprawy nie usuwa automatycznie starych pokoi. Po prostu wybiera zdrowy DM i aktualizuje mapowanie, aby nowe wysyłki Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości bezpośrednich znów kierowały się do właściwego pokoju.

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla odpowiedzi automatycznych, jak i wysyłek przez narzędzie wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routowanie DM Matrix w zakresie nadawcy, więc wiele pokoi DM może współdzielić jedną sesję, gdy rozwiążą się do tego samego partnera.
- `dm.sessionScope: "per-room"` izoluje każdy pokój DM Matrix do własnego klucza sesji, nadal używając zwykłych kontroli uwierzytelniania DM i allowlisty.
- Jawne powiązania rozmów Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybrany docelowy target sesji.
- `threadReplies: "off"` utrzymuje odpowiedzi na poziomie głównym i pozostawia przychodzące wiadomości w wątkach w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy wiadomość przychodząca była już w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi pokojowe w wątku zakorzenionym w wiadomości wyzwalającej i kieruje tę rozmowę przez odpowiadającą jej sesję o zakresie wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla DM. Na przykład możesz utrzymać izolację wątków pokojowych, a jednocześnie pozostawić DM-y płaskie.
- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki przez narzędzie wiadomości teraz automatycznie dziedziczą bieżący wątek Matrix, gdy celem jest ten sam pokój albo ten sam target użytkownika DM, chyba że podano jawne `threadId`.
- Ponowne użycie targetu użytkownika DM w tej samej sesji działa tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego partnera DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do zwykłego routowania o zakresie użytkownika.
- Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji DM Matrix, publikuje w tym pokoju jednorazowe `m.notice` z awaryjną komendą `/focus`, gdy włączone są powiązania wątków i podpowiedź `dm.sessionScope`.
- Powiązania wątków w runtime są obsługiwane w Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz związane z wątkiem `/acp spawn` działają teraz w pokojach i DM-ach Matrix.
- Najwyższego poziomu `/focus` w pokoju/DM Matrix tworzy nowy wątek Matrix i wiąże go z docelową sesją, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania rozmów ACP

Pokoje Matrix, DM-y i istniejące wątki Matrix można przekształcić w trwałe obszary robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W najwyższego poziomu DM lub pokoju Matrix bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do uruchomionej sesji ACP.
- W istniejącym wątku Matrix `--bind here` wiąże bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
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

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby pozwolić najwyższego poziomu `/focus` tworzyć i wiązać nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby pozwolić `/acp spawn --thread auto|here` wiązać sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach i przychodzące reakcje potwierdzające.

- Narzędzia wychodzących reakcji są bramkowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do konkretnego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla konkretnego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota dla tego zdarzenia.
- `remove: true` usuwa tylko określoną reakcję emoji z konta bota.

Zakres reakcji potwierdzających jest rozstrzygany w standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- zapasowe emoji tożsamości agenta

Zakres reakcji potwierdzających jest rozstrzygany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozstrzygany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Bieżące zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy są kierowane do wiadomości Matrix napisanych przez bota.
- `reactionNotifications: "off"` wyłącza zdarzenia systemowe reakcji.
- Usunięcia reakcji nadal nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix pokazuje je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju Matrix wyzwoli agenta.
- Pole to wraca do `messages.groupChat.historyLimit`. Jeśli oba są nieustawione, efektywna wartość domyślna to `0`, więc wiadomości pokojowe bramkowane wzmianką nie są buforowane. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM-y nadal używają zwykłej historii sesji.
- Historia pokoju Matrix dotyczy tylko oczekujących wiadomości: OpenClaw buforuje wiadomości pokojowe, które jeszcze nie wywołały odpowiedzi, a następnie wykonuje snapshot tego okna, gdy nadejdzie wzmianka lub inny trigger.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby tego samego zdarzenia Matrix ponownie używają oryginalnego snapshotu historii zamiast przesuwać się do przodu do nowszych wiadomości pokoju.

## Widoczność kontekstu

Matrix obsługuje wspólną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` jest ustawieniem domyślnym. Uzupełniający kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne kontrole allowlisty pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność uzupełniającego kontekstu, a nie na to, czy sama wiadomość przychodząca może wyzwolić odpowiedź.
Autoryzacja wyzwalaczy nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i polityki DM.

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

Zobacz [Groups](/pl/channels/groups), aby poznać zachowanie bramkowania wzmiankami i allowlisty.

Przykład parowania dla DM-ów Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal do ciebie pisze przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może po krótkim cooldownie ponownie wysłać odpowiedź-przypomnienie zamiast generować nowy kod.

Zobacz [Pairing](/pl/channels/pairing), aby poznać wspólny przepływ parowania DM i układ przechowywania.

## Zatwierdzenia exec

Matrix może działać jako klient zatwierdzeń exec dla konta Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalne; wraca do `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` jest nieustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie prośby o zatwierdzenie wracają do innych skonfigurowanych ścieżek zatwierdzania lub do polityki fallback zatwierdzeń exec.

Natywne routowanie Matrix dotyczy dziś tylko exec:

- `channels.matrix.execApprovals.*` kontroluje natywne routowanie DM/kanału dla zatwierdzeń exec.
- Zatwierdzenia pluginów nadal używają współdzielonego `/approve` w tym samym czacie oraz dowolnego skonfigurowanego przekazywania `approvals.plugin`.
- Matrix może nadal ponownie używać `channels.matrix.dm.allowFrom` do autoryzacji zatwierdzania pluginów, gdy może bezpiecznie wywnioskować zatwierdzających, ale nie udostępnia osobnej natywnej ścieżki rozsyłania DM/kanału dla zatwierdzeń pluginów.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzeń do DM-ów zatwierdzających
- `target: "channel"` odsyła prompt do źródłowego pokoju lub DM Matrix
- `target: "both"` wysyła do DM-ów zatwierdzających i do źródłowego pokoju lub DM Matrix

Prompty zatwierdzeń Matrix inicjalizują skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` = zezwól raz
- `❌` = odmów
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez efektywną politykę exec

Zatwierdzający mogą reagować na tę wiadomość albo użyć awaryjnych komend slash: `/approve <id> allow-once`, `/approve <id> allow-always` lub `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odmawiać. Dostarczanie do kanału zawiera tekst polecenia, więc `channel` lub `both` włączaj tylko w zaufanych pokojach.

Prompty zatwierdzeń Matrix ponownie używają wspólnego planera zatwierdzeń z core. Natywna powierzchnia specyficzna dla Matrix jest tylko transportem dla zatwierdzeń exec: routowaniem pokoju/DM oraz zachowaniem wysyłania/aktualizacji/usuwania wiadomości.

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
Możesz ograniczyć dziedziczony wpis pokoju do jednego konta Matrix za pomocą `groups.<room>.account` (lub starszego `rooms.<room>.account`).
Wpisy bez `account` pozostają współdzielone między wszystkimi kontami Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje najwyższego poziomu konto `default` tylko wtedy, gdy to domyślne konto ma świeże uwierzytelnianie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta mogą nadal pozostawać wykrywalne przy użyciu `homeserver` plus `userId`, gdy zbuforowane poświadczenia później spełnią warunki uwierzytelnienia.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, promocja naprawy/konfiguracji z pojedynczego konta do wielu kont zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Tylko klucze uwierzytelniania/bootstrap Matrix są przenoszone do promowanego konta; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix do niejawnego routowania, sondowania i operacji CLI.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` lub przekazuj `--account <id>` w poleceniach CLI, które polegają na niejawnym wyborze konta.
Przekazuj `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla pojedynczego polecenia.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix jako ochronę przed SSRF, chyba że
jawnie włączysz je per konto.

Jeśli twój homeserver działa na localhost, adresie LAN/Tailscale lub wewnętrznej nazwie hosta, włącz
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

To włączenie akceptuje tylko zaufane prywatne/wewnętrzne cele. Publiczne homeservery cleartext, takie jak
`http://matrix.example.org:8008`, nadal są blokowane. Gdy to możliwe, preferuj `https://`.

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
OpenClaw używa tego samego ustawienia proxy zarówno dla ruchu Matrix w runtime, jak i dla sond statusu konta.

## Rozwiązywanie targetów

Matrix akceptuje te formy targetów wszędzie tam, gdzie OpenClaw prosi o target pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie katalogowe na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokoi akceptują bezpośrednio jawne ID pokoi i aliasy, a następnie wracają do przeszukiwania nazw dołączonych pokoi dla tego konta.
- Wyszukiwanie nazw dołączonych pokoi jest best-effort. Jeśli nazwy pokoju nie da się rozwiązać do ID lub aliasu, jest ignorowana przez rozwiązywanie allowlisty w runtime.

## Configuration reference

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowane ID konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver rozwiązuje się do `localhost`, adresu IP LAN/Tailscale albo wewnętrznego hosta, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu własnym `proxy`.
- `userId`: pełne ID użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: access token dla uwierzytelniania opartego na tokenie. Obsługiwane są wartości plaintext i wartości SecretRef dla `channels.matrix.accessToken` oraz `channels.matrix.accounts.<id>.accessToken` w providerach env/file/exec. Zobacz [Secrets Management](/pl/gateway/secrets).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości plaintext i wartości SecretRef.
- `deviceId`: jawne ID urządzenia Matrix.
- `deviceName`: wyświetlana nazwa urządzenia dla logowania hasłem.
- `avatarUrl`: zapisany URL własnego avatara do synchronizacji profilu i aktualizacji `set-profile`.
- `initialSyncLimit`: limit zdarzeń synchronizacji przy uruchomieniu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: wymusza zachowanie wyłącznie allowlisty dla DM-ów i pokoi.
- `allowBots`: zezwala na wiadomości z innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` lub `disabled`.
- `contextVisibility`: tryb widoczności uzupełniającego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlista ID użytkowników dla ruchu pokojowego.
- Wpisy `groupAllowFrom` powinny być pełnymi ID użytkowników Matrix. Nierozwiązane nazwy są ignorowane w runtime.
- `historyLimit`: maksymalna liczba wiadomości pokoju do dołączenia jako kontekst historii grupy. Wartość wraca do `messages.groupChat.historyLimit`; jeśli oba pola są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` lub `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `partial`, `quiet`, `true` lub `false`. `partial` i `true` włączają aktualizacje szkiców oparte na pierwszym podglądzie przy użyciu zwykłych wiadomości tekstowych Matrix. `quiet` używa niepowiadamiających komunikatów podglądu dla samohostowanych konfiguracji z regułami push.
- `blockStreaming`: `true` włącza osobne komunikaty postępu dla ukończonych bloków asystenta, gdy aktywny jest streaming podglądu szkicu.
- `threadReplies`: `off`, `inbound` lub `always`.
- `threadBindings`: nadpisania per kanał dla routowania i cyklu życia sesji powiązanych z wątkiem.
- `startupVerification`: tryb automatycznej prośby o samoweryfikację przy uruchomieniu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown przed ponowną próbą automatycznych próśb o weryfikację przy uruchomieniu.
- `textChunkLimit`: rozmiar chunków wiadomości wychodzących.
- `chunkMode`: `length` lub `newline`.
- `responsePrefix`: opcjonalny prefiks wiadomości dla odpowiedzi wychodzących.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzającej dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzającej (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru mediów w MB dla obsługi mediów Matrix. Dotyczy wysyłek wychodzących i przetwarzania mediów przychodzących.
- `autoJoin`: polityka automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy to ogólnie zaproszeń Matrix, w tym zaproszeń typu DM, a nie tylko zaproszeń do pokoi/grup. OpenClaw podejmuje tę decyzję w chwili zaproszenia, zanim może wiarygodnie sklasyfikować dołączony pokój jako DM albo grupę.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do ID pokoi podczas obsługi zaproszenia; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zaproszony pokój.
- `dm`: blok polityki DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do DM po dołączeniu OpenClaw do pokoju i sklasyfikowaniu go jako DM. Nie zmienia tego, czy zaproszenie zostanie automatycznie przyjęte.
- Wpisy `dm.allowFrom` powinny być pełnymi ID użytkowników Matrix, chyba że zostały już rozwiązane przez wyszukiwanie katalogowe na żywo.
- `dm.sessionScope`: `per-user` (domyślnie) albo `per-room`. Użyj `per-room`, jeśli chcesz, aby każdy pokój DM Matrix zachowywał osobny kontekst, nawet gdy partner jest ten sam.
- `dm.threadReplies`: nadpisanie polityki wątków tylko dla DM (`off`, `inbound`, `always`). Nadpisuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umieszczania odpowiedzi, jak i izolacji sesji w DM-ach.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec w Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID użytkowników Matrix, którzy mogą zatwierdzać prośby exec. Opcjonalne, gdy `dm.allowFrom` już identyfikuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako domyślne dla tych wpisów.
- `groups`: mapa polityk per pokój. Preferuj ID pokoi lub aliasy; nierozwiązane nazwy pokoi są ignorowane w runtime. Tożsamość sesji/grupy po rozwiązywaniu używa stabilnego ID pokoju, podczas gdy etykiety czytelne dla człowieka nadal pochodzą z nazw pokoi.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: allowlista nadawców per pokój.
- `groups.<room>.tools`: nadpisania dozwalania/odmawiania narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami na poziomie pokoju. `true` wyłącza wymagania wzmianki dla tego pokoju; `false` wymusza je ponownie.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment system promptu na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: bramkowanie narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Channel Routing](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i hardening
