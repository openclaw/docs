---
read_when:
    - Konfigurowanie obsługi Signal
    - Debugowanie wysyłania/odbierania w Signal
summary: Obsługa Signal za pośrednictwem signal-cli (natywnego demona lub kontenera bbernhard), ścieżki konfiguracji i model numeracji
title: Signal
x-i18n:
    generated_at: "2026-07-16T18:15:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal jest wtyczką kanału do pobrania (`@openclaw/signal`). Gateway komunikuje się z `signal-cli` przez HTTP: za pośrednictwem natywnego demona (JSON-RPC + SSE) albo kontenera [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw nie zawiera wbudowanej biblioteki libsignal.

## Model numerów (przeczytaj najpierw)

- Gateway łączy się z **urządzeniem Signal**: kontem `signal-cli`.
- Uruchomienie bota na **osobistym koncie Signal** powoduje, że ignoruje on własne wiadomości (ochrona przed pętlą).
- Aby uzyskać działanie „wysyłam wiadomość do bota, a on odpowiada”, użyj **osobnego numeru bota**.

## Instalacja

```bash
openclaw plugins install @openclaw/signal
```

Specyfikacje wtyczek bez określonego źródła najpierw próbują użyć ClawHub, a następnie rezerwowo npm. Wymuś źródło za pomocą `openclaw plugins install clawhub:@openclaw/signal` lub `npm:@openclaw/signal`. `plugins install` rejestruje i włącza wtyczkę; osobny krok `enable` nie jest potrzebny. Ogólne reguły instalacji opisano w sekcji [Wtyczki](/pl/tools/plugin).

## Szybka konfiguracja

<Steps>
  <Step title="Wybierz numer">
    Użyj **osobnego numeru Signal** dla bota (zalecane).
  </Step>
  <Step title="Zainstaluj wtyczkę">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Uruchom konfigurację z przewodnikiem">
    ```bash
    openclaw channels add
    ```
    Kreator wykrywa, czy `signal-cli` znajduje się w `PATH`, a jeśli go brakuje, proponuje instalację: pobiera oficjalną natywną kompilację GraalVM dla systemu Linux x86-64 albo instaluje ją przez Homebrew w systemie macOS i na innych architekturach. Następnie prosi o numer bota i ścieżkę `signal-cli`.

    W przypadku konfiguracji nieinteraktywnej `openclaw channels add --channel signal` akceptuje również `--signal-number <e164>` jako numer telefonu bota oraz `--http-host <host>` i `--http-port <port>` jako punkt końcowy demona Signal (domyślnie `127.0.0.1:8080`).

  </Step>
  <Step title="Połącz lub zarejestruj konto">
    - **Łączenie kodem QR (najszybsze):** `signal-cli link -n "OpenClaw"`, a następnie zeskanuj kod w Signal. Zobacz [Ścieżka A](#setup-path-a-link-existing-signal-account-qr).
    - **Rejestracja przez SMS:** dedykowany numer z captchą i weryfikacją SMS. Zobacz [Ścieżka B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Zweryfikuj i sparuj">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Wyślij pierwszą wiadomość prywatną i zatwierdź parowanie: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

Minimalna konfiguracja:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| Pole         | Opis                                              |
| ------------ | ------------------------------------------------- |
| `account`    | Numer telefonu bota w formacie E.164 (`+15551234567`) |
| `cliPath`    | Ścieżka do `signal-cli` (`signal-cli`, jeśli znajduje się w `PATH`) |
| `configPath` | Katalog konfiguracji signal-cli przekazywany jako `--config` |
| `dmPolicy`   | Zasady dostępu do wiadomości prywatnych (zalecane: `pairing`) |
| `allowFrom`  | Numery telefonów lub wartości `uuid:<id>` uprawnione do wysyłania wiadomości prywatnych |

Obsługa wielu kont: użyj `channels.signal.accounts` z konfiguracją poszczególnych kont i opcjonalnym `name`. Wspólny wzorzec opisano w sekcji [Kanały z wieloma kontami](/pl/gateway/config-channels#multi-account-all-channels).

## Charakterystyka

- Deterministyczne trasowanie: odpowiedzi zawsze wracają do Signal.
- Wiadomości prywatne współdzielą główną sesję agenta; grupy są izolowane (`agent:<agentId>:signal:group:<groupId>`).
- Domyślnie Signal może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`). Wyłącz tę funkcję za pomocą `channels.signal.configWrites: false`.

## Ścieżka konfiguracji A: połączenie istniejącego konta Signal (QR)

1. Zainstaluj `signal-cli` (kompilację JVM lub natywną) albo pozwól, aby `openclaw channels add` przeprowadził instalację.
2. Połącz konto bota: `signal-cli link -n "OpenClaw"`, a następnie zeskanuj kod QR w Signal.
3. Skonfiguruj Signal i uruchom Gateway.

## Ścieżka konfiguracji B: rejestracja dedykowanego numeru bota (SMS, Linux)

Użyj tej metody dla dedykowanego numeru bota zamiast łączenia istniejącego konta aplikacji Signal. Poniższy proces przetestowano w systemie Ubuntu 24.

1. Uzyskaj numer, który może odbierać wiadomości SMS (lub połączenia głosowe z kodem weryfikacyjnym w przypadku telefonów stacjonarnych). Dedykowany numer bota pozwala uniknąć konfliktów kont i sesji.
2. Zainstaluj `signal-cli` na hoście Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jeśli używana jest kompilacja JVM (`signal-cli-${VERSION}.tar.gz`), najpierw zainstaluj środowisko JRE. Regularnie aktualizuj `signal-cli`; według informacji projektu źródłowego stare wydania mogą przestać działać wskutek zmian interfejsów API serwerów Signal.

3. Zarejestruj i zweryfikuj numer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jeśli wymagana jest captcha (do wykonania tego kroku potrzebny jest dostęp do przeglądarki):

1. Otwórz `https://signalcaptchas.org/registration/generate.html`.
2. Rozwiąż captchę i skopiuj docelowy adres odsyłacza `signalcaptcha://...` z opcji „Open Signal”.
3. Jeśli to możliwe, wykonaj polecenie z tego samego zewnętrznego adresu IP co sesja przeglądarki (tokeny captcha szybko wygasają).
4. Natychmiast zarejestruj i zweryfikuj numer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Skonfiguruj OpenClaw, uruchom ponownie Gateway i zweryfikuj kanał:

```bash
# Jeśli uruchamiasz Gateway jako usługę systemd użytkownika:
systemctl --user restart openclaw-gateway.service

# Następnie zweryfikuj:
openclaw doctor
openclaw channels status --probe
```

5. Sparuj nadawcę wiadomości prywatnych:
   - Wyślij dowolną wiadomość na numer bota.
   - Zatwierdź na serwerze: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Zapisz numer bota jako kontakt w telefonie, aby uniknąć komunikatu „Unknown contact”.

<Warning>
Zarejestrowanie konta z numerem telefonu za pomocą `signal-cli` może spowodować wycofanie uwierzytelnienia głównej sesji aplikacji Signal dla tego numeru. Preferowany jest dedykowany numer bota albo tryb łączenia kodem QR, który pozwala zachować istniejącą konfigurację aplikacji na telefonie.
</Warning>

Materiały projektu źródłowego:

- README projektu `signal-cli`: `https://github.com/AsamK/signal-cli`
- Proces captchy: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Proces łączenia: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Tryb zewnętrznego demona (httpUrl)

Aby samodzielnie zarządzać `signal-cli` (powolne zimne uruchamianie JVM, inicjalizacja kontenera, współdzielone procesory), uruchom demona oddzielnie i skieruj do niego OpenClaw:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Pomija to automatyczne uruchamianie procesu i oczekiwanie OpenClaw podczas startu. W przypadku powolnego automatycznego uruchamiania ustaw `channels.signal.startupTimeoutMs`.

## Tryb kontenera (bbernhard/signal-cli-rest-api)

Zamiast uruchamiać `signal-cli` natywnie, użyj kontenera Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), który udostępnia `signal-cli` za pośrednictwem interfejsu REST + WebSocket.

Wymagania:

- Kontener **musi** działać z `MODE=json-rpc`, aby odbierać wiadomości w czasie rzeczywistym.
- Przed połączeniem OpenClaw zarejestruj lub połącz konto Signal wewnątrz kontenera.

Przykładowa usługa `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Konfiguracja OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // lub "auto", aby wykrywać automatycznie
    },
  },
}
```

`apiMode` określa protokół używany przez OpenClaw:

| Wartość       | Działanie                                                                            |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Domyślnie) Sprawdza oba transporty; przesyłanie strumieniowe weryfikuje odbiór kontenera przez WebSocket |
| `"native"`    | Wymusza natywny signal-cli (JSON-RPC pod adresem `/api/v1/rpc`, SSE pod adresem `/api/v1/events`) |
| `"container"` | Wymusza kontener bbernhard (REST pod adresem `/v2/send`, WebSocket pod adresem `/v1/receive/{account}`) |

Gdy `apiMode` ma wartość `"auto"`, OpenClaw buforuje wykryty tryb przez 30 sekund dla każdego adresu URL demona, aby uniknąć wielokrotnych testów (tryb natywny ma pierwszeństwo, gdy oba transporty działają prawidłowo). Odbiór z kontenera jest wybierany do przesyłania strumieniowego dopiero po pomyślnym przejściu `/v1/receive/{account}` na WebSocket, co wymaga `MODE=json-rpc`.

Tryb kontenera obsługuje te same operacje Signal co tryb natywny, jeśli kontener udostępnia odpowiadające im interfejsy API: wysyłanie, odbieranie, załączniki, wskaźniki pisania, potwierdzenia odczytania i wyświetlenia, reakcje, grupy oraz tekst ze stylami. OpenClaw przekształca natywne wywołania RPC Signal w ładunki REST kontenera, w tym identyfikatory grup `group.{base64(internal_id)}` i `text_mode: "styled"` dla sformatowanego tekstu.

Uwagi operacyjne:

- W trybie kontenera użyj `autoStart: false`; OpenClaw nie powinien uruchamiać natywnego demona, gdy wybrano `apiMode: "container"`.
- Do odbierania użyj `MODE=json-rpc`. `MODE=normal` może sprawić, że `/v1/about` będzie wyglądać na sprawne, ale `/v1/receive/{account}` nie przejdzie na WebSocket, dlatego OpenClaw nie wybierze strumieniowego odbioru z kontenera w trybie `auto`.
- Ustaw `apiMode: "container"`, gdy `httpUrl` wskazuje na interfejs REST API bbernhard, `"native"`, gdy wskazuje na natywny interfejs JSON-RPC/SSE `signal-cli`, oraz `"auto"`, gdy wdrożenie może się różnić.
- Pobieranie załączników w trybie kontenera podlega tym samym limitom liczby bajtów multimediów co tryb natywny. Zbyt duże odpowiedzi są odrzucane przed ich pełnym zbuforowaniem, gdy serwer wysyła `Content-Length`, a w pozostałych przypadkach podczas przesyłania strumieniowego.

## Kontrola dostępu (wiadomości prywatne i grupy)

Wiadomości prywatne:

- Domyślnie: `channels.signal.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdź za pomocą `openclaw pairing list signal` i `openclaw pairing approve signal <CODE>`.
- Parowanie jest domyślną metodą wymiany tokenów dla wiadomości prywatnych Signal. Szczegóły: [Parowanie](/pl/channels/pairing)
- Nadawcy identyfikowani wyłącznie przez UUID (z `sourceUuid`) są przechowywani jako `uuid:<id>` w `channels.signal.allowFrom`.

Grupy:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` określa, które grupy lub którzy nadawcy mogą wywoływać odpowiedzi grupowe, gdy ustawiono `allowlist`; wpisami mogą być identyfikatory grup Signal (surowe, `group:<id>` lub `signal:group:<id>`), numery telefonów nadawców, wartości `uuid:<id>` albo `*`.
- `channels.signal.groups["<group-id>" | "*"]` może nadpisywać zachowanie grupy za pomocą `requireMention`, `tools` i `toolsBySender`.
- W konfiguracjach z wieloma kontami użyj `channels.signal.accounts.<id>.groups` do nadpisywania ustawień poszczególnych kont.
- Dodanie grupy Signal do listy dozwolonych za pośrednictwem `groupAllowFrom` samo w sobie nie wyłącza wymogu wzmianki. Jawnie skonfigurowany wpis `channels.signal.groups["<group-id>"]` przetwarza każdą wiadomość grupową, chyba że ustawiono `requireMention=true`.
- Przy `requireMention=true` natywne wzmianki @ w Signal są dopasowywane na podstawie ustrukturyzowanych metadanych wzmianki do numeru telefonu konta bota lub `accountUuid`. Skonfigurowane `mentionPatterns` pozostają mechanizmem rezerwowym opartym na zwykłym tekście.
- Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.signal` jest całkowicie nieobecne, środowisko uruchomieniowe używa rezerwowo `groupPolicy="allowlist"` podczas sprawdzania grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

Grupa wymagająca wzmianki z ograniczonym kontekstem:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Dozwolone wiadomości grupowe, które nie zawierają wzmianki o bocie, nie wywołują odpowiedzi i są przechowywane wyłącznie w ograniczonym oknie oczekującej historii. Gdy późniejsza natywna wzmianka @ lub zastępcza wzmianka tekstowa aktywuje bota, OpenClaw uwzględnia ten niedawny kontekst i odpowiada w tej samej grupie. Treść pominiętych załączników nie jest pobierana; w oczekującym kontekście mogą one występować wyłącznie jako zwięzłe symbole zastępcze multimediów.

## Jak to działa (zachowanie)

- Tryb natywny: `signal-cli` działa jako demon; Gateway odczytuje zdarzenia przez SSE.
- Tryb kontenera: Gateway wysyła przez REST API i odbiera przez WebSocket.
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału.
- Odpowiedzi są zawsze kierowane z powrotem do tego samego numeru lub tej samej grupy.
- Odpowiedzi na wiadomości przychodzące zawierają natywne metadane cytowania Signal, gdy backend akceptuje znacznik czasu i autora wiadomości przychodzącej; jeśli brakuje metadanych cytowania lub zostaną one odrzucone, OpenClaw wysyła odpowiedź jako zwykłą wiadomość.
- Natywne cytowanie należy skonfigurować za pomocą `channels.signal.replyToMode = off | first | all | batched` albo `channels.signal.replyToModeByChatType.direct/group` w przypadku nadpisań zależnych od typu czatu. Pierwszeństwo mają wartości na poziomie konta w `channels.signal.accounts.<id>`.

## Multimedia i limity

- Tekst wychodzący jest dzielony na fragmenty zgodnie z `channels.signal.textChunkLimit` (domyślnie 4000).
- Opcjonalne dzielenie według nowych wierszy: ustawienie `channels.signal.streaming.chunkMode="newline"` powoduje dzielenie przy pustych wierszach (granicach akapitów) przed podziałem według długości.
- Załączniki są obsługiwane (dane base64 są pobierane z `signal-cli`).
- Załączniki z notatkami głosowymi używają nazwy pliku `signal-cli` jako zastępczego typu MIME, gdy brakuje `contentType`, dzięki czemu transkrypcja dźwięku nadal może klasyfikować notatki głosowe AAC.
- Domyślny limit multimediów: `channels.signal.mediaMaxMb` (domyślnie 8).
- Aby pominąć pobieranie multimediów, należy użyć `channels.signal.ignoreAttachments`.
- Kontekst historii grupy używa `channels.signal.historyLimit` (lub `channels.signal.accounts.*.historyLimit`), a w razie braku wartości — `messages.groupChat.historyLimit`. Ustawienie `0` wyłącza tę funkcję (domyślnie 50).

## Wskaźniki pisania i potwierdzenia odczytu

- **Wskaźniki pisania**: OpenClaw wysyła sygnały pisania przez `signal-cli sendTyping` i odświeża je podczas generowania odpowiedzi.
- **Potwierdzenia odczytu**: gdy `channels.signal.sendReadReceipts` ma wartość true, OpenClaw przekazuje potwierdzenia odczytu dla dozwolonych wiadomości prywatnych.
- `signal-cli` nie udostępnia potwierdzeń odczytu dla grup.

## Reakcje stanu cyklu życia

Ustawienie `messages.statusReactions.enabled: true` pozwala Signal wyświetlać wspólny cykl reakcji dla stanów: w kolejce, przetwarzanie, narzędzie, Compaction, ukończenie i błąd — podczas obsługi wiadomości przychodzących. Signal używa znacznika czasu wiadomości przychodzącej jako celu reakcji; reakcje grupowe są wysyłane z identyfikatorem grupy Signal oraz pierwotnym nadawcą jako autorem docelowym.

Reakcje stanu wymagają również reakcji potwierdzającej i zgodnej wartości `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` lub `all`). Ustawienie `channels.signal.reactionLevel: "off"` wyłącza reakcje stanu Signal.

`messages.removeAckAfterReply: true` usuwa końcową reakcję stanu po skonfigurowanym czasie utrzymywania. W przeciwnym razie Signal przywraca początkową reakcję potwierdzającą po końcowym stanie ukończenia lub błędu.

## Reakcje (narzędzie wiadomości)

Należy użyć `message action=react` z `channel=signal`.

- Cele: numer nadawcy w formacie E.164 lub UUID (należy użyć `uuid:<id>` z danych wyjściowych parowania; sam UUID również działa).
- `messageId` to znacznik czasu Signal wiadomości, na którą dodawana jest reakcja.
- Reakcje grupowe wymagają `targetAuthor` lub `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguracja:

- `channels.signal.actions.reactions`: włącza lub wyłącza działania reakcji (domyślnie true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (domyślnie `minimal`).
  - `off`/`ack` wyłącza reakcje agenta (narzędzie wiadomości `react` zgłasza błędy).
  - `minimal`/`extensive` włącza reakcje agenta i ustawia poziom wskazówek.
- Nadpisania dla poszczególnych kont: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reakcje zatwierdzania

Monity zatwierdzania poleceń exec i pluginów w Signal używają nadrzędnych bloków routingu `approvals.exec` i `approvals.plugin`. Signal nie ma bloku `channels.signal.execApprovals`.

- `👍` zatwierdza jednorazowo.
- `👎` odrzuca.
- Gdy żądanie oferuje trwałe zatwierdzenie, należy użyć `/approve <id> allow-always`.

Rozstrzyganie reakcji zatwierdzania wymaga jawnych zatwierdzających Signal z `channels.signal.allowFrom`, `channels.signal.defaultTo` lub odpowiednich pól na poziomie konta. Bezpośrednie monity zatwierdzania exec w tym samym czacie nadal mogą ukrywać zduplikowany lokalny mechanizm zastępczy `/approve` bez jawnych zatwierdzających; w przypadku zatwierdzeń grupowych bez zatwierdzających lokalny mechanizm zastępczy pozostaje widoczny.

## Cele dostarczania (CLI/cron)

- Wiadomości prywatne: `signal:+15551234567` (lub sam numer E.164).
- Wiadomości prywatne UUID: `uuid:<id>` (lub sam UUID).
- Grupy: `signal:group:<groupId>`.
- Nazwy użytkowników: `username:<name>` (jeśli są obsługiwane przez dane konto Signal).

## Aliasy

Aliasy umożliwiają skonfigurowanie stabilnych nazw dla regularnie używanych celów Signal. Aliasy stanowią wyłącznie konfigurację po stronie OpenClaw; nie tworzą ani nie edytują kontaktów Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Aliasów można używać wszędzie tam, gdzie akceptowane są cele dostarczania Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Aliasy poszczególnych kont dziedziczą aliasy najwyższego poziomu i mogą dodawać lub nadpisywać nazwy:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` i `openclaw directory groups list --channel signal` wyświetlają skonfigurowane aliasy. Katalog Signal jest oparty na konfiguracji; nie odpytuje kontaktów Signal na żywo ani nie modyfikuje konta Signal.

## Rozwiązywanie problemów

Najpierw należy wykonać następujące polecenia:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie, w razie potrzeby, należy potwierdzić stan parowania wiadomości prywatnych:

```bash
openclaw pairing list signal
```

Typowe problemy:

- Demon jest osiągalny, ale nie ma odpowiedzi: należy sprawdzić ustawienia konta/demona (`httpUrl`, `account`) oraz tryb odbierania.
- Wiadomości prywatne są ignorowane: nadawca oczekuje na zatwierdzenie parowania.
- Wiadomości grupowe są ignorowane: reguły nadawcy grupowego lub wymagania dotyczące wzmianek blokują dostarczenie.
- Błędy walidacji konfiguracji po zmianach: należy uruchomić `openclaw doctor --fix`.
- Brak Signal w diagnostyce: należy sprawdzić `channels.signal.enabled: true`.

Dodatkowe kontrole:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Przebieg diagnostyki opisano w sekcji [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

## Uwagi dotyczące bezpieczeństwa

- `signal-cli` przechowuje klucze konta lokalnie (zwykle w `~/.local/share/signal-cli/data/`).
- Przed migracją lub przebudową serwera należy utworzyć kopię zapasową stanu konta Signal.
- Należy zachować `channels.signal.dmPolicy: "pairing"`, chyba że szerszy dostęp do wiadomości prywatnych jest wyraźnie pożądany.
- Weryfikacja SMS jest potrzebna wyłącznie podczas rejestracji lub odzyskiwania, ale utrata kontroli nad numerem/kontem może utrudnić ponowną rejestrację.

## Dokumentacja konfiguracji (Signal)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.signal.enabled`: włącza lub wyłącza uruchamianie kanału.
- `channels.signal.apiMode`: `auto | native | container` (domyślnie: automatycznie). Zobacz [Tryb kontenera](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: numer konta bota w formacie E.164.
- `channels.signal.accountUuid`: opcjonalny UUID konta bota do natywnego wykrywania wzmianek @ i ochrony przed pętlami.
- `channels.signal.cliPath`: ścieżka do `signal-cli`.
- `channels.signal.configPath`: opcjonalny katalog `signal-cli --config`.
- `channels.signal.httpUrl`: pełny adres URL demona (zastępuje host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: adres nasłuchiwania demona (domyślnie `127.0.0.1:8080`).
- `channels.signal.autoStart`: automatycznie uruchamia demona (domyślnie true, jeśli `httpUrl` nie jest ustawione).
- `channels.signal.startupTimeoutMs`: limit czasu oczekiwania na uruchomienie w ms (minimum 1000, maksimum 120000; domyślnie 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pomija pobieranie załączników.
- `channels.signal.ignoreStories`: ignoruje relacje pochodzące od demona.
- `channels.signal.sendReadReceipts`: przekazuje potwierdzenia odczytu.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: parowanie).
- `channels.signal.allowFrom`: lista dozwolonych nadawców wiadomości prywatnych (E.164 lub `uuid:<id>`). `open` wymaga `"*"`. Signal nie obsługuje nazw użytkowników; należy używać identyfikatorów telefonu/UUID.
- `channels.signal.aliases`: aliasy po stronie OpenClaw dla celów dostarczania wiadomości prywatnych lub grupowych.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (domyślnie: lista dozwolonych).
- `channels.signal.groupAllowFrom`: lista dozwolonych dla grup; akceptuje identyfikatory grup Signal (surowe, `group:<id>` lub `signal:group:<id>`), numery nadawców w formacie E.164 albo wartości `uuid:<id>`.
- `channels.signal.groups`: nadpisania dla poszczególnych grup, indeksowane identyfikatorem grupy Signal (lub `"*"`). Obsługiwane pola: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: wersja `channels.signal.groups` dla poszczególnych kont w konfiguracjach wielokontowych.
- `channels.signal.accounts.<id>.aliases`: aliasy poszczególnych kont, scalane z aliasami najwyższego poziomu.
- `channels.signal.replyToMode`: tryb natywnego cytowania odpowiedzi, `off | first | all | batched` (domyślnie: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: nadpisania natywnego cytowania odpowiedzi dla poszczególnych typów czatu.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: nadpisania cytowania odpowiedzi dla poszczególnych kont.
- `channels.signal.historyLimit`: maksymalna liczba wiadomości grupowych uwzględnianych jako kontekst (0 wyłącza).
- `channels.signal.dmHistoryLimit`: limit historii wiadomości prywatnych wyrażony w turach użytkownika. Nadpisania dla poszczególnych użytkowników: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: rozmiar wychodzącego fragmentu w znakach (domyślnie 4000).
- `channels.signal.streaming.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić przy pustych wierszach (granicach akapitów) przed podziałem według długości.
- `channels.signal.mediaMaxMb`: limit multimediów przychodzących/wychodzących w MB (domyślnie 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (domyślnie `minimal`). Zobacz [Reakcje](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (domyślnie `own`) — określa, kiedy agent jest powiadamiany o przychodzących reakcjach innych osób.
- `channels.signal.reactionAllowlist`: nadawcy, których reakcje powiadamiają agenta, gdy `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: współdzielone między kanałami ustawienia strumieniowania w trybie blokowym. Zobacz [Strumieniowanie](/pl/concepts/streaming).

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (zapasowy mechanizm oparty na zwykłym tekście; natywne wzmianki @ w Signal są wykrywane na podstawie ustrukturyzowanych metadanych, gdy skonfigurowano tożsamość konta bota).
- `messages.groupChat.mentionPatterns` (globalny mechanizm zapasowy).
- `messages.responsePrefix`.

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie wiadomości prywatnych i proces parowania
- [Grupy](/pl/channels/groups) - zachowanie czatów grupowych i ograniczanie na podstawie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
