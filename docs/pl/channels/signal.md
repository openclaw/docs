---
read_when:
    - Konfigurowanie obsługi Signal
    - Debugowanie wysyłania/odbierania w Signal
summary: Obsługa Signal za pomocą signal-cli (natywny demon lub kontener bbernhard), ścieżki konfiguracji i model numeru
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Status: integracja z zewnętrznym CLI. Gateway komunikuje się z `signal-cli` przez HTTP — albo z natywnym demonem (JSON-RPC + SSE), albo z kontenerem bbernhard/signal-cli-rest-api (REST + WebSocket).

## Wymagania wstępne

- OpenClaw zainstalowany na serwerze (poniższy przepływ dla Linuksa przetestowano na Ubuntu 24).
- Jedno z:
  - `signal-cli` dostępne na hoście (tryb natywny), **albo**
  - kontener Docker `bbernhard/signal-cli-rest-api` (tryb kontenera).
- Numer telefonu, który może odebrać jednego SMS-a weryfikacyjnego (dla ścieżki rejestracji przez SMS).
- Dostęp do przeglądarki dla captcha Signal (`signalcaptchas.org`) podczas rejestracji.

## Szybka konfiguracja (dla początkujących)

1. Użyj **osobnego numeru Signal** dla bota (zalecane).
2. Zainstaluj `signal-cli` (Java jest wymagana, jeśli używasz kompilacji JVM).
3. Wybierz jedną ścieżkę konfiguracji:
   - **Ścieżka A (łączenie przez QR):** `signal-cli link -n "OpenClaw"` i zeskanuj kod w Signal.
   - **Ścieżka B (rejestracja SMS):** zarejestruj dedykowany numer z captcha i weryfikacją SMS.
4. Skonfiguruj OpenClaw i uruchom ponownie Gateway.
5. Wyślij pierwszą wiadomość DM i zatwierdź parowanie (`openclaw pairing approve signal <CODE>`).

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

Opis pól:

| Pole        | Opis                                                        |
| ----------- | ----------------------------------------------------------- |
| `account`   | Numer telefonu bota w formacie E.164 (`+15551234567`)       |
| `cliPath`   | Ścieżka do `signal-cli` (`signal-cli`, jeśli jest w `PATH`) |
| `dmPolicy`  | Zasada dostępu do DM (zalecane `pairing`)                   |
| `allowFrom` | Numery telefonów lub wartości `uuid:<id>` dopuszczone do DM |

## Co to jest

- Kanał Signal przez `signal-cli` (nie osadzony libsignal).
- Deterministyczne routowanie: odpowiedzi zawsze wracają do Signal.
- DM współdzielą główną sesję agenta; grupy są izolowane (`agent:<agentId>:signal:group:<groupId>`).

## Zapisy konfiguracji

Domyślnie Signal może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz za pomocą:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Model numeru (ważne)

- Gateway łączy się z **urządzeniem Signal** (kontem `signal-cli`).
- Jeśli uruchomisz bota na **swoim osobistym koncie Signal**, będzie ignorować Twoje własne wiadomości (ochrona przed pętlą).
- Dla scenariusza „piszę do bota i on odpowiada” użyj **osobnego numeru bota**.

## Ścieżka konfiguracji A: połącz istniejące konto Signal (QR)

1. Zainstaluj `signal-cli` (kompilację JVM lub natywną).
2. Połącz konto bota:
   - `signal-cli link -n "OpenClaw"`, a następnie zeskanuj QR w Signal.
3. Skonfiguruj Signal i uruchom Gateway.

Przykład:

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

Obsługa wielu kont: użyj `channels.signal.accounts` z konfiguracją dla każdego konta i opcjonalnym `name`. Zobacz [`gateway/configuration`](/pl/gateway/config-channels#multi-account-all-channels), aby poznać wspólny wzorzec.

## Ścieżka konfiguracji B: zarejestruj dedykowany numer bota (SMS, Linux)

Użyj tego, gdy chcesz mieć dedykowany numer bota zamiast łączyć istniejące konto aplikacji Signal.

1. Uzyskaj numer, który może odbierać SMS-y (lub weryfikację głosową dla telefonów stacjonarnych).
   - Użyj dedykowanego numeru bota, aby uniknąć konfliktów konta lub sesji.
2. Zainstaluj `signal-cli` na hoście Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jeśli używasz kompilacji JVM (`signal-cli-${VERSION}.tar.gz`), najpierw zainstaluj JRE 25+.
Utrzymuj `signal-cli` w aktualnej wersji; upstream zauważa, że stare wydania mogą przestać działać, gdy zmieniają się API serwera Signal.

3. Zarejestruj i zweryfikuj numer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jeśli captcha jest wymagana:

1. Otwórz `https://signalcaptchas.org/registration/generate.html`.
2. Ukończ captcha, skopiuj docelowy link `signalcaptcha://...` z „Open Signal”.
3. Gdy to możliwe, uruchom z tego samego zewnętrznego adresu IP co sesja przeglądarki.
4. Natychmiast ponownie uruchom rejestrację (tokeny captcha szybko wygasają):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Skonfiguruj OpenClaw, uruchom ponownie Gateway i zweryfikuj kanał:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Sparuj nadawcę DM:
   - Wyślij dowolną wiadomość na numer bota.
   - Zatwierdź kod na serwerze: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Zapisz numer bota jako kontakt w telefonie, aby uniknąć komunikatu „Unknown contact”.

<Warning>
Rejestrowanie konta numeru telefonu za pomocą `signal-cli` może wylogować główną sesję aplikacji Signal dla tego numeru. Preferuj dedykowany numer bota albo użyj trybu łączenia QR, jeśli musisz zachować istniejącą konfigurację aplikacji na telefonie.
</Warning>

Odnośniki upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Przepływ captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Przepływ łączenia: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Tryb zewnętrznego demona (httpUrl)

Jeśli chcesz samodzielnie zarządzać `signal-cli` (powolne zimne starty JVM, inicjalizacja kontenera albo współdzielone CPU), uruchom demona osobno i skieruj OpenClaw na niego:

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

To pomija automatyczne uruchamianie procesu i oczekiwanie na start wewnątrz OpenClaw. Przy powolnych startach podczas automatycznego uruchamiania ustaw `channels.signal.startupTimeoutMs`.

## Tryb kontenera (bbernhard/signal-cli-rest-api)

Zamiast uruchamiać `signal-cli` natywnie, możesz użyć kontenera Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Opakowuje on `signal-cli` za API REST i interfejs WebSocket.

Wymagania:

- Kontener **musi** działać z `MODE=json-rpc`, aby odbierać wiadomości w czasie rzeczywistym.
- Zarejestruj lub połącz swoje konto Signal wewnątrz kontenera przed podłączeniem OpenClaw.

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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

Pole `apiMode` kontroluje, którego protokołu używa OpenClaw:

| Wartość      | Zachowanie                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------- |
| `"auto"`      | (Domyślnie) Sprawdza oba transporty; streaming weryfikuje odbiór przez WebSocket kontenera |
| `"native"`    | Wymusza natywny signal-cli (JSON-RPC pod `/api/v1/rpc`, SSE pod `/api/v1/events`)           |
| `"container"` | Wymusza kontener bbernhard (REST pod `/v2/send`, WebSocket pod `/v1/receive/{account}`)     |

Gdy `apiMode` ma wartość `"auto"`, OpenClaw buforuje wykryty tryb przez 30 sekund, aby uniknąć powtarzanych prób. Odbiór kontenera jest wybierany do streamingu dopiero po tym, jak `/v1/receive/{account}` przejdzie aktualizację do WebSocket, co wymaga `MODE=json-rpc`.

Tryb kontenera obsługuje te same operacje kanału Signal co tryb natywny tam, gdzie kontener udostępnia pasujące API: wysyłanie, odbieranie, załączniki, wskaźniki pisania, potwierdzenia odczytu/wyświetlenia, reakcje, grupy i tekst stylizowany. OpenClaw tłumaczy swoje natywne wywołania RPC Signal na ładunki REST kontenera, w tym identyfikatory grup `group.{base64(internal_id)}` i `text_mode: "styled"` dla sformatowanego tekstu.

Uwagi operacyjne:

- Używaj `autoStart: false` w trybie kontenera. OpenClaw nie powinien uruchamiać natywnego demona, gdy wybrano `apiMode: "container"`.
- Używaj `MODE=json-rpc` do odbierania. `MODE=normal` może sprawić, że `/v1/about` wygląda na zdrowe, ale `/v1/receive/{account}` nie przechodzi aktualizacji do WebSocket, więc OpenClaw nie wybierze streamingu odbioru kontenera w trybie `auto`.
- Ustaw `apiMode: "container"`, gdy wiesz, że `httpUrl` wskazuje na API REST bbernhard. Ustaw `apiMode: "native"`, gdy wiesz, że wskazuje na natywne JSON-RPC/SSE `signal-cli`. Użyj `"auto"`, gdy wdrożenie może się różnić.
- Pobieranie załączników kontenera respektuje te same limity bajtów multimediów co tryb natywny. Zbyt duże odpowiedzi są odrzucane przed pełnym zbuforowaniem, gdy serwer wysyła `Content-Length`, a w przeciwnym razie podczas streamingu.

## Kontrola dostępu (DM + grupy)

DM:

- Domyślnie: `channels.signal.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdź przez:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Parowanie jest domyślną wymianą tokenu dla DM Signal. Szczegóły: [Parowanie](/pl/channels/pairing)
- Nadawcy tylko z UUID (z `sourceUuid`) są przechowywani jako `uuid:<id>` w `channels.signal.allowFrom`.

Grupy:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kontroluje, które grupy lub nadawcy mogą wyzwalać odpowiedzi grupowe, gdy ustawiono `allowlist`; wpisami mogą być identyfikatory grup Signal (surowe, `group:<id>` albo `signal:group:<id>`), numery telefonów nadawców, wartości `uuid:<id>` albo `*`.
- `channels.signal.groups["<group-id>" | "*"]` może nadpisać zachowanie grupy za pomocą `requireMention`, `tools` i `toolsBySender`.
- Użyj `channels.signal.accounts.<id>.groups` dla nadpisań dla poszczególnych kont w konfiguracjach z wieloma kontami.
- Dodanie grupy Signal do listy dozwolonych przez `groupAllowFrom` samo w sobie nie wyłącza bramkowania przez wzmiankę. Konkretnie skonfigurowany wpis `channels.signal.groups["<group-id>"]` przetwarza każdą wiadomość grupową, chyba że ustawiono `requireMention=true`.
- Uwaga dotycząca działania: jeśli `channels.signal` całkowicie brakuje, środowisko wykonawcze wraca do `groupPolicy="allowlist"` dla sprawdzeń grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

## Jak to działa (zachowanie)

- Tryb natywny: `signal-cli` działa jako demon; Gateway odczytuje zdarzenia przez SSE.
- Tryb kontenera: Gateway wysyła przez API REST i odbiera przez WebSocket.
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału.
- Odpowiedzi zawsze wracają do tego samego numeru lub grupy.

## Multimedia + limity

- Tekst wychodzący jest dzielony do `channels.signal.textChunkLimit` (domyślnie 4000).
- Opcjonalne dzielenie według nowych wierszy: ustaw `channels.signal.chunkMode="newline"`, aby dzielić po pustych wierszach (granicach akapitów) przed dzieleniem według długości.
- Załączniki są obsługiwane (base64 pobierane z `signal-cli`).
- Załączniki notatek głosowych używają nazwy pliku `signal-cli` jako zastępczego MIME, gdy brakuje `contentType`, dzięki czemu transkrypcja audio nadal może klasyfikować notatki głosowe AAC.
- Domyślny limit multimediów: `channels.signal.mediaMaxMb` (domyślnie 8).
- Użyj `channels.signal.ignoreAttachments`, aby pominąć pobieranie multimediów.
- Kontekst historii grup używa `channels.signal.historyLimit` (albo `channels.signal.accounts.*.historyLimit`), z powrotem do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).

## Pisanie + potwierdzenia odczytu

- **Wskaźniki pisania**: OpenClaw wysyła sygnały pisania przez `signal-cli sendTyping` i odświeża je, gdy odpowiedź jest w toku.
- **Potwierdzenia odczytu**: gdy `channels.signal.sendReadReceipts` ma wartość true, OpenClaw przekazuje potwierdzenia odczytu dla dozwolonych DM.
- Signal-cli nie udostępnia potwierdzeń odczytu dla grup.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=signal`.
- Cele: nadawca E.164 lub UUID (użyj `uuid:<id>` z wyjścia parowania; sam UUID też działa).
- `messageId` to znacznik czasu Signal wiadomości, na którą reagujesz.
- Reakcje w grupach wymagają `targetAuthor` lub `targetAuthorUuid`.

Przykłady:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguracja:

- `channels.signal.actions.reactions`: włącz/wyłącz akcje reakcji (domyślnie true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` wyłącza reakcje agenta (`react` narzędzia wiadomości zwróci błąd).
  - `minimal`/`extensive` włącza reakcje agenta i ustawia poziom wskazówek.
- Nadpisania dla konta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Cele dostarczania (CLI/cron)

- Wiadomości prywatne: `signal:+15551234567` (lub zwykły E.164).
- Wiadomości prywatne UUID: `uuid:<id>` (lub sam UUID).
- Grupy: `signal:group:<groupId>`.
- Nazwy użytkowników: `username:<name>` (jeśli są obsługiwane przez Twoje konto Signal).

## Rozwiązywanie problemów

Najpierw uruchom tę sekwencję:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie w razie potrzeby potwierdź stan parowania wiadomości prywatnych:

```bash
openclaw pairing list signal
```

Typowe błędy:

- Daemon jest osiągalny, ale brak odpowiedzi: sprawdź ustawienia konta/daemona (`httpUrl`, `account`) i tryb odbierania.
- Wiadomości prywatne są ignorowane: nadawca oczekuje na zatwierdzenie parowania.
- Wiadomości grupowe są ignorowane: bramkowanie nadawcy grupy/wzmianki blokuje dostarczanie.
- Błędy walidacji konfiguracji po edycjach: uruchom `openclaw doctor --fix`.
- Brak Signal w diagnostyce: potwierdź `channels.signal.enabled: true`.

Dodatkowe kontrole:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Przepływ triage: [/channels/troubleshooting](/pl/channels/troubleshooting).

## Uwagi dotyczące bezpieczeństwa

- `signal-cli` przechowuje klucze konta lokalnie (zwykle `~/.local/share/signal-cli/data/`).
- Utwórz kopię zapasową stanu konta Signal przed migracją lub przebudową serwera.
- Zachowaj `channels.signal.dmPolicy: "pairing"`, chyba że jawnie chcesz szerszego dostępu do wiadomości prywatnych.
- Weryfikacja SMS jest potrzebna tylko w przepływach rejestracji lub odzyskiwania, ale utrata kontroli nad numerem/kontem może skomplikować ponowną rejestrację.

## Odniesienie konfiguracji (Signal)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.signal.enabled`: włącz/wyłącz uruchamianie kanału.
- `channels.signal.apiMode`: `auto | native | container` (domyślnie: auto). Zobacz [Tryb kontenera](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 dla konta bota.
- `channels.signal.cliPath`: ścieżka do `signal-cli`.
- `channels.signal.httpUrl`: pełny URL daemona (nadpisuje host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: powiązanie daemona (domyślnie 127.0.0.1:8080).
- `channels.signal.autoStart`: automatyczne uruchamianie daemona (domyślnie true, jeśli `httpUrl` nie jest ustawione).
- `channels.signal.startupTimeoutMs`: limit czasu oczekiwania na uruchomienie w ms (maks. 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pomiń pobieranie załączników.
- `channels.signal.ignoreStories`: ignoruj relacje z daemona.
- `channels.signal.sendReadReceipts`: przekazuj potwierdzenia odczytu.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.signal.allowFrom`: lista dozwolonych wiadomości prywatnych (E.164 lub `uuid:<id>`). `open` wymaga `"*"`. Signal nie ma nazw użytkowników; używaj identyfikatorów telefonu/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.signal.groupAllowFrom`: lista dozwolonych grup; akceptuje identyfikatory grup Signal (surowe, `group:<id>` lub `signal:group:<id>`), numery E.164 nadawców albo wartości `uuid:<id>`.
- `channels.signal.groups`: nadpisania dla grup indeksowane identyfikatorem grupy Signal (lub `"*"`). Obsługiwane pola: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: wersja `channels.signal.groups` dla konta w konfiguracjach wielokontowych.
- `channels.signal.historyLimit`: maksymalna liczba wiadomości grupowych do dołączenia jako kontekst (0 wyłącza).
- `channels.signal.dmHistoryLimit`: limit historii wiadomości prywatnych w turach użytkownika. Nadpisania dla użytkownika: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: rozmiar wychodzącego fragmentu (znaki).
- `channels.signal.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych wierszach (granicach akapitów) przed dzieleniem według długości.
- `channels.signal.mediaMaxMb`: limit mediów przychodzących/wychodzących (MB).

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (Signal nie obsługuje natywnych wzmianek).
- `messages.groupChat.mentionPatterns` (globalny wariant zapasowy).
- `messages.responsePrefix`.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
