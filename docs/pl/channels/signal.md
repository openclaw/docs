---
read_when:
    - Konfigurowanie obsługi Signal
    - Debugowanie wysyłania i odbierania w Signal
summary: Obsługa Signal za pośrednictwem signal-cli (natywnego demona lub kontenera bbernhard), ścieżki konfiguracji i model numerów
title: Signal
x-i18n:
    generated_at: "2026-07-12T14:49:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal to dostępny do pobrania Plugin kanału (`@openclaw/signal`). Gateway komunikuje się z `signal-cli` przez HTTP: za pośrednictwem natywnego demona (JSON-RPC + SSE) albo kontenera [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw nie zawiera wbudowanej biblioteki libsignal.

## Model numerów (przeczytaj najpierw)

- Gateway łączy się z **urządzeniem Signal**: kontem `signal-cli`.
- Uruchomienie bota na **osobistym koncie Signal** powoduje ignorowanie własnych wiadomości (ochrona przed pętlami).
- Aby uzyskać zachowanie „piszę do bota, a on odpowiada”, użyj **osobnego numeru bota**.

## Instalacja

```bash
openclaw plugins install @openclaw/signal
```

Specyfikacje Pluginów bez prefiksu są najpierw wyszukiwane w ClawHub, a następnie awaryjnie w npm. Wymuś źródło za pomocą `openclaw plugins install clawhub:@openclaw/signal` lub `npm:@openclaw/signal`. Polecenie `plugins install` rejestruje i włącza Plugin; osobny krok `enable` nie jest potrzebny. Ogólne zasady instalacji opisano w sekcji [Pluginy](/pl/tools/plugin).

## Szybka konfiguracja

<Steps>
  <Step title="Wybierz numer">
    Użyj **osobnego numeru Signal** dla bota (zalecane).
  </Step>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Uruchom konfigurację z przewodnikiem">
    ```bash
    openclaw channels add
    ```
    Kreator wykrywa, czy `signal-cli` znajduje się w `PATH`, a jeśli go brakuje, proponuje instalację: pobiera oficjalną natywną kompilację GraalVM dla systemu Linux x86-64 albo instaluje ją przez Homebrew w systemie macOS i na innych architekturach. Następnie prosi o numer bota i ścieżkę do `signal-cli`.
  </Step>
  <Step title="Połącz lub zarejestruj konto">
    - **Połączenie kodem QR (najszybsze):** `signal-cli link -n "OpenClaw"`, a następnie zeskanuj kod za pomocą aplikacji Signal. Zobacz [Ścieżka A](#setup-path-a-link-existing-signal-account-qr).
    - **Rejestracja przez SMS:** dedykowany numer z captcha i weryfikacją SMS. Zobacz [Ścieżka B](#setup-path-b-register-dedicated-bot-number-sms-linux).

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

| Pole         | Opis                                                        |
| ------------ | ----------------------------------------------------------- |
| `account`    | Numer telefonu bota w formacie E.164 (`+15551234567`)       |
| `cliPath`    | Ścieżka do `signal-cli` (`signal-cli`, jeśli jest w `PATH`)  |
| `configPath` | Katalog konfiguracji signal-cli przekazywany jako `--config` |
| `dmPolicy`   | Zasady dostępu do wiadomości prywatnych (zalecane `pairing`) |
| `allowFrom`  | Numery telefonów lub wartości `uuid:<id>` uprawnione do wysyłania wiadomości prywatnych |

Obsługa wielu kont: użyj `channels.signal.accounts` z konfiguracją poszczególnych kont i opcjonalnym polem `name`. Wspólny wzorzec opisano w sekcji [Kanały z wieloma kontami](/pl/gateway/config-channels#multi-account-all-channels).

## Czym jest

- Deterministyczne trasowanie: odpowiedzi zawsze wracają do Signal.
- Wiadomości prywatne współdzielą główną sesję agenta; grupy są odizolowane (`agent:<agentId>:signal:group:<groupId>`).
- Domyślnie Signal może zapisywać zmiany konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`). Wyłącz tę możliwość za pomocą `channels.signal.configWrites: false`.

## Ścieżka konfiguracji A: połączenie istniejącego konta Signal (QR)

1. Zainstaluj `signal-cli` (kompilację JVM lub natywną) albo pozwól, aby polecenie `openclaw channels add` zainstalowało je za Ciebie.
2. Połącz konto bota: `signal-cli link -n "OpenClaw"`, a następnie zeskanuj kod QR w aplikacji Signal.
3. Skonfiguruj Signal i uruchom Gateway.

## Ścieżka konfiguracji B: rejestracja dedykowanego numeru bota (SMS, Linux)

Użyj tej metody dla dedykowanego numeru bota zamiast łączenia istniejącego konta aplikacji Signal. Poniższy proces przetestowano w systemie Ubuntu 24.

1. Uzyskaj numer umożliwiający odbieranie wiadomości SMS (lub weryfikację głosową w przypadku telefonów stacjonarnych). Dedykowany numer bota pozwala uniknąć konfliktów kont i sesji.
2. Zainstaluj `signal-cli` na hoście Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jeśli używasz kompilacji JVM (`signal-cli-${VERSION}.tar.gz`), najpierw zainstaluj środowisko JRE. Regularnie aktualizuj `signal-cli`; autorzy projektu ostrzegają, że starsze wersje mogą przestać działać wraz ze zmianami interfejsów API serwera Signal.

3. Zarejestruj i zweryfikuj numer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jeśli wymagane jest captcha (do wykonania tego kroku potrzebny jest dostęp do przeglądarki):

1. Otwórz `https://signalcaptchas.org/registration/generate.html`.
2. Wykonaj captcha i skopiuj adres docelowy `signalcaptcha://...` z elementu "Open Signal".
3. Jeśli to możliwe, uruchom polecenie z tego samego zewnętrznego adresu IP co sesja przeglądarki (tokeny captcha szybko wygasają).
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
   - Zatwierdź ją na serwerze: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Zapisz numer bota jako kontakt w telefonie, aby uniknąć komunikatu "Unknown contact".

<Warning>
Zarejestrowanie konta z numerem telefonu za pomocą `signal-cli` może wylogować główną sesję aplikacji Signal dla tego numeru. Zaleca się użycie dedykowanego numeru bota albo trybu połączenia kodem QR, aby zachować dotychczasową konfigurację aplikacji na telefonie.
</Warning>

Materiały źródłowe projektu:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Proces captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Proces łączenia: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Tryb zewnętrznego demona (httpUrl)

Aby samodzielnie zarządzać `signal-cli` (powolne uruchamianie JVM na zimno, inicjalizacja kontenera, współdzielone procesory), uruchom demona osobno i skieruj do niego OpenClaw:

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

- Kontener **musi** działać z ustawieniem `MODE=json-rpc`, aby odbierać wiadomości w czasie rzeczywistym.
- Przed połączeniem OpenClaw zarejestruj lub połącz swoje konto Signal wewnątrz kontenera.

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

| Wartość       | Zachowanie                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `"auto"`      | (Domyślne) Sprawdza oba mechanizmy transportu; przesyłanie strumieniowe weryfikuje odbiór przez WebSocket kontenera |
| `"native"`    | Wymusza natywny signal-cli (JSON-RPC pod `/api/v1/rpc`, SSE pod `/api/v1/events`)                   |
| `"container"` | Wymusza kontener bbernhard (REST pod `/v2/send`, WebSocket pod `/v1/receive/{account}`)             |

Gdy `apiMode` ma wartość `"auto"`, OpenClaw przechowuje wykryty tryb w pamięci podręcznej przez 30 sekund dla każdego adresu URL demona, aby uniknąć wielokrotnych testów (tryb natywny ma pierwszeństwo, gdy oba mechanizmy transportu działają prawidłowo). Odbiór z kontenera jest wybierany do przesyłania strumieniowego dopiero po przełączeniu `/v1/receive/{account}` na WebSocket, co wymaga ustawienia `MODE=json-rpc`.

Tryb kontenera obsługuje te same operacje Signal co tryb natywny, jeśli kontener udostępnia odpowiadające im interfejsy API: wysyłanie, odbieranie, załączniki, wskaźniki pisania, potwierdzenia przeczytania i wyświetlenia, reakcje, grupy oraz tekst ze stylami. OpenClaw przekształca natywne wywołania RPC Signal na ładunki REST kontenera, w tym identyfikatory grup `group.{base64(internal_id)}` oraz `text_mode: "styled"` dla sformatowanego tekstu.

Uwagi eksploatacyjne:

- W trybie kontenera używaj `autoStart: false`; OpenClaw nie powinien uruchamiać natywnego demona, gdy wybrano `apiMode: "container"`.
- Do odbierania używaj `MODE=json-rpc`. Przy `MODE=normal` punkt `/v1/about` może wyglądać na działający, ale `/v1/receive/{account}` nie przełączy połączenia na WebSocket, dlatego OpenClaw nie wybierze strumieniowego odbioru z kontenera w trybie `auto`.
- Ustaw `apiMode: "container"`, gdy `httpUrl` wskazuje interfejs REST API bbernhard, `"native"`, gdy wskazuje natywny interfejs JSON-RPC/SSE programu `signal-cli`, oraz `"auto"`, gdy sposób wdrożenia może się różnić.
- Pobieranie załączników w trybie kontenera podlega tym samym limitom liczby bajtów multimediów co w trybie natywnym. Zbyt duże odpowiedzi są odrzucane przed pełnym zbuforowaniem, gdy serwer wysyła nagłówek `Content-Length`, a w pozostałych przypadkach — podczas przesyłania strumieniowego.

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
- W konfiguracjach z wieloma kontami użyj `channels.signal.accounts.<id>.groups`, aby ustawić nadpisania dla poszczególnych kont.
- Dodanie grupy do listy dozwolonych za pomocą `groupAllowFrom` nie wyłącza samoistnie wymogu wzmianki. Jawnie skonfigurowany wpis `channels.signal.groups["<group-id>"]` przetwarza każdą wiadomość grupową, chyba że wyraźnie ustawiono `requireMention: true`.
- Uwaga dotycząca działania: jeśli całkowicie brakuje `channels.signal`, podczas sprawdzania grup środowisko wykonawcze używa awaryjnie `groupPolicy="allowlist"` (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

## Sposób działania (zachowanie)

- Tryb natywny: `signal-cli` działa jako demon; Gateway odczytuje zdarzenia przez SSE.
- Tryb kontenera: Gateway wysyła dane przez REST API i odbiera je przez WebSocket.
- Wiadomości przychodzące są normalizowane do wspólnej obwiedni kanału.
- Odpowiedzi są zawsze kierowane z powrotem do tego samego numeru lub grupy.
- Odpowiedzi na wiadomości przychodzące zawierają natywne metadane cytowania Signal, jeśli backend akceptuje znacznik czasu i autora wiadomości przychodzącej; jeśli brakuje metadanych cytowania lub zostaną one odrzucone, OpenClaw wysyła odpowiedź jako zwykłą wiadomość.
- Skonfiguruj użycie natywnych cytatów za pomocą `channels.signal.replyToMode = off | first | all | batched` albo `channels.signal.replyToModeByChatType.direct/group`, aby zastosować nadpisania dla poszczególnych typów czatu. Pierwszeństwo mają wartości na poziomie konta w `channels.signal.accounts.<id>`.

## Multimedia i limity

- Tekst wychodzący jest dzielony na fragmenty zgodnie z `channels.signal.textChunkLimit` (domyślnie 4000).
- Opcjonalne dzielenie według nowych wierszy: ustaw `channels.signal.chunkMode="newline"`, aby przed podziałem według długości dzielić tekst w miejscach pustych wierszy (granicach akapitów).
- Załączniki są obsługiwane (dane base64 pobierane z `signal-cli`).
- Gdy brakuje `contentType`, załączniki z wiadomościami głosowymi używają nazwy pliku z `signal-cli` jako zastępczej wartości MIME, dzięki czemu transkrypcja dźwięku nadal może klasyfikować notatki głosowe AAC.
- Domyślny limit multimediów: `channels.signal.mediaMaxMb` (domyślnie 8).
- Użyj `channels.signal.ignoreAttachments`, aby pominąć pobieranie multimediów.
- Kontekst historii grupy używa `channels.signal.historyLimit` (lub `channels.signal.accounts.*.historyLimit`), a w razie braku wartości — `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć tę funkcję (domyślnie 50).

## Wskaźniki pisania i potwierdzenia odczytu

- **Wskaźniki pisania**: OpenClaw wysyła sygnały pisania za pomocą `signal-cli sendTyping` i odświeża je podczas generowania odpowiedzi.
- **Potwierdzenia odczytu**: gdy `channels.signal.sendReadReceipts` ma wartość true, OpenClaw przekazuje potwierdzenia odczytu dla dozwolonych wiadomości prywatnych.
- `signal-cli` nie udostępnia potwierdzeń odczytu dla grup.

## Reakcje stanu cyklu życia

Ustaw `messages.statusReactions.enabled: true`, aby Signal wyświetlał współdzielony cykl reakcji: w kolejce/myślenie/narzędzie/Compaction/gotowe/błąd dla przychodzących tur. Signal używa znacznika czasu wiadomości przychodzącej jako celu reakcji; reakcje grupowe są wysyłane z identyfikatorem grupy Signal oraz pierwotnym nadawcą jako autorem docelowym.

Reakcje stanu wymagają również reakcji potwierdzającej i zgodnej wartości `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` lub `all`). Ustaw `channels.signal.reactionLevel: "off"`, aby wyłączyć reakcje stanu Signal.

`messages.removeAckAfterReply: true` usuwa końcową reakcję stanu po skonfigurowanym czasie wyświetlania. W przeciwnym razie Signal przywraca początkową reakcję potwierdzającą po końcowym stanie gotowości lub błędu.

## Reakcje (narzędzie wiadomości)

Użyj `message action=react` z `channel=signal`.

- Cele: numer nadawcy w formacie E.164 lub UUID (użyj `uuid:<id>` z danych wyjściowych parowania; sam UUID również działa).
- `messageId` to znacznik czasu Signal wiadomości, na którą reagujesz.
- Reakcje grupowe wymagają `targetAuthor` lub `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguracja:

- `channels.signal.actions.reactions`: włącza lub wyłącza działania reakcji (domyślnie true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (domyślnie `minimal`).
  - `off`/`ack` wyłącza reakcje agenta (narzędzie wiadomości `react` zwraca błędy).
  - `minimal`/`extensive` włącza reakcje agenta i ustawia poziom wskazówek.
- Ustawienia zastępujące dla poszczególnych kont: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reakcje zatwierdzania

Monity zatwierdzania wykonania i Pluginów w Signal używają bloków routingu najwyższego poziomu `approvals.exec` i `approvals.plugin`. Signal nie ma bloku `channels.signal.execApprovals`.

- `👍` zatwierdza jednorazowo.
- `👎` odrzuca.
- Gdy żądanie umożliwia trwałe zatwierdzenie, użyj `/approve <id> allow-always`.

Rozstrzyganie reakcji zatwierdzania wymaga jawnego określenia zatwierdzających Signal w `channels.signal.allowFrom`, `channels.signal.defaultTo` lub odpowiednich polach na poziomie konta. Bezpośrednie monity zatwierdzania wykonania w tym samym czacie mogą nadal ukrywać zduplikowaną lokalną alternatywę `/approve` bez jawnie określonych zatwierdzających; w przypadku zatwierdzeń grupowych bez zatwierdzających lokalna alternatywa pozostaje widoczna.

## Cele dostarczania (CLI/Cron)

- Wiadomości prywatne: `signal:+15551234567` (lub sam numer E.164).
- Wiadomości prywatne UUID: `uuid:<id>` (lub sam UUID).
- Grupy: `signal:group:<groupId>`.
- Nazwy użytkowników: `username:<name>` (jeśli są obsługiwane przez Twoje konto Signal).

## Aliasy

Skonfiguruj aliasy, aby używać stabilnych nazw dla powtarzających się celów Signal. Aliasy są wyłącznie konfiguracją po stronie OpenClaw; nie tworzą ani nie edytują kontaktów Signal.

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

Używaj aliasów wszędzie tam, gdzie akceptowane są cele dostarczania Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Aliasy poszczególnych kont dziedziczą aliasy najwyższego poziomu i mogą dodawać lub zastępować nazwy:

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

Polecenia `openclaw directory peers list --channel signal` i `openclaw directory groups list --channel signal` wyświetlają skonfigurowane aliasy. Katalog Signal jest oparty na konfiguracji; nie odpytuje na bieżąco kontaktów Signal ani nie modyfikuje konta Signal.

## Rozwiązywanie problemów

Najpierw wykonaj kolejno:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie, jeśli to konieczne, sprawdź stan parowania wiadomości prywatnych:

```bash
openclaw pairing list signal
```

Typowe problemy:

- Demon jest osiągalny, ale brak odpowiedzi: sprawdź ustawienia konta i demona (`httpUrl`, `account`) oraz tryb odbierania.
- Wiadomości prywatne są ignorowane: nadawca oczekuje na zatwierdzenie parowania.
- Wiadomości grupowe są ignorowane: reguły nadawcy grupowego lub wzmianek blokują dostarczenie.
- Błędy walidacji konfiguracji po zmianach: uruchom `openclaw doctor --fix`.
- Brak Signal w diagnostyce: upewnij się, że ustawiono `channels.signal.enabled: true`.

Dodatkowe kontrole:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Procedura diagnostyczna: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

## Uwagi dotyczące bezpieczeństwa

- `signal-cli` przechowuje klucze konta lokalnie (zwykle w `~/.local/share/signal-cli/data/`).
- Przed migracją lub przebudową serwera wykonaj kopię zapasową stanu konta Signal.
- Pozostaw `channels.signal.dmPolicy: "pairing"`, chyba że świadomie chcesz zezwolić na szerszy dostęp do wiadomości prywatnych.
- Weryfikacja SMS jest potrzebna tylko podczas rejestracji lub odzyskiwania, ale utrata kontroli nad numerem lub kontem może utrudnić ponowną rejestrację.

## Dokumentacja konfiguracji (Signal)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.signal.enabled`: włącza lub wyłącza uruchamianie kanału.
- `channels.signal.apiMode`: `auto | native | container` (domyślnie: auto). Zobacz [Tryb kontenera](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: numer E.164 konta bota.
- `channels.signal.cliPath`: ścieżka do `signal-cli`.
- `channels.signal.configPath`: opcjonalny katalog `signal-cli --config`.
- `channels.signal.httpUrl`: pełny adres URL demona (zastępuje host i port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: adres nasłuchiwania demona (domyślnie `127.0.0.1:8080`).
- `channels.signal.autoStart`: automatycznie uruchamia demona (domyślnie true, jeśli `httpUrl` nie jest ustawione).
- `channels.signal.startupTimeoutMs`: limit czasu oczekiwania na uruchomienie w ms (minimum 1000, maksimum 120000; domyślnie 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pomija pobieranie załączników.
- `channels.signal.ignoreStories`: ignoruje relacje pochodzące od demona.
- `channels.signal.sendReadReceipts`: przekazuje potwierdzenia odczytu.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.signal.allowFrom`: lista dozwolonych nadawców wiadomości prywatnych (E.164 lub `uuid:<id>`). Wartość `open` wymaga `"*"`. Signal nie obsługuje nazw użytkowników; używaj identyfikatorów telefonu lub UUID.
- `channels.signal.aliases`: aliasy celów dostarczania wiadomości prywatnych lub grupowych po stronie OpenClaw.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.signal.groupAllowFrom`: grupowa lista dozwolonych; akceptuje identyfikatory grup Signal (surowe, `group:<id>` lub `signal:group:<id>`), numery E.164 nadawców albo wartości `uuid:<id>`.
- `channels.signal.groups`: ustawienia zastępujące dla poszczególnych grup, indeksowane identyfikatorem grupy Signal (lub `"*"`). Obsługiwane pola: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: wersja `channels.signal.groups` dla poszczególnych kont w konfiguracjach wielokontowych.
- `channels.signal.accounts.<id>.aliases`: aliasy poszczególnych kont, scalane z aliasami najwyższego poziomu.
- `channels.signal.replyToMode`: tryb natywnego cytowania odpowiedzi, `off | first | all | batched` (domyślnie: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: ustawienia zastępujące natywne cytowanie odpowiedzi dla poszczególnych typów czatu.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: ustawienia zastępujące cytowanie odpowiedzi dla poszczególnych kont.
- `channels.signal.historyLimit`: maksymalna liczba wiadomości grupowych do uwzględnienia jako kontekst (0 wyłącza).
- `channels.signal.dmHistoryLimit`: limit historii wiadomości prywatnych wyrażony w turach użytkownika. Ustawienia zastępujące dla poszczególnych użytkowników: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: rozmiar fragmentu wychodzącego w znakach (domyślnie 4000).
- `channels.signal.chunkMode`: `length` (domyślnie) lub `newline`, aby przed podziałem według długości dzielić tekst w miejscach pustych wierszy (granicach akapitów).
- `channels.signal.mediaMaxMb`: limit przychodzących i wychodzących multimediów w MB (domyślnie 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (domyślnie `minimal`). Zobacz [Reakcje](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (domyślnie `own`) — określa, kiedy agent otrzymuje powiadomienia o przychodzących reakcjach innych osób.
- `channels.signal.reactionAllowlist`: nadawcy, których reakcje powiadamiają agenta, gdy `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: współdzielone między kanałami ustawienia przesyłania strumieniowego w trybie blokowym. Zobacz [Przesyłanie strumieniowe](/pl/concepts/streaming).

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (Signal nie obsługuje natywnych wzmianek).
- `messages.groupChat.mentionPatterns` (globalna wartość zastępcza).
- `messages.responsePrefix`.

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i proces parowania
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i reguły wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
