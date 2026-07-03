---
read_when:
    - Konfigurowanie obsługi Signal
    - Debugowanie wysyłania/odbierania w Signal
summary: Obsługa Signal przez signal-cli (natywny demon lub kontener bbernhard), ścieżki konfiguracji i model numeru
title: Signal
x-i18n:
    generated_at: "2026-07-03T17:45:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Status: zewnętrzna integracja CLI. Gateway komunikuje się z `signal-cli` przez HTTP — albo z natywnym daemonem (JSON-RPC + SSE), albo z kontenerem bbernhard/signal-cli-rest-api (REST + WebSocket).

## Wymagania wstępne

- OpenClaw zainstalowany na serwerze (poniższy przepływ dla Linuksa przetestowano na Ubuntu 24).
- Jedna z opcji:
  - `signal-cli` dostępny na hoście (tryb natywny), **albo**
  - kontener Docker `bbernhard/signal-cli-rest-api` (tryb kontenera).
- Numer telefonu, który może odebrać jedną weryfikacyjną wiadomość SMS (dla ścieżki rejestracji przez SMS).
- Dostęp do przeglądarki na potrzeby captchy Signal (`signalcaptchas.org`) podczas rejestracji.

## Szybka konfiguracja (dla początkujących)

1. Użyj **oddzielnego numeru Signal** dla bota (zalecane).
2. Zainstaluj Plugin OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Zainstaluj `signal-cli` (Java jest wymagana, jeśli używasz kompilacji JVM).
4. Wybierz jedną ścieżkę konfiguracji:
   - **Ścieżka A (łączenie QR):** `signal-cli link -n "OpenClaw"` i zeskanuj kod w Signal.
   - **Ścieżka B (rejestracja SMS):** zarejestruj dedykowany numer z captchą i weryfikacją SMS.
5. Skonfiguruj OpenClaw i uruchom ponownie gateway.
6. Wyślij pierwszą wiadomość DM i zatwierdź parowanie (`openclaw pairing approve signal <CODE>`).

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

| Pole         | Opis                                                    |
| ------------ | ------------------------------------------------------- |
| `account`    | Numer telefonu bota w formacie E.164 (`+15551234567`)   |
| `cliPath`    | Ścieżka do `signal-cli` (`signal-cli`, jeśli jest w `PATH`) |
| `configPath` | Katalog konfiguracji signal-cli przekazywany jako `--config` |
| `dmPolicy`   | Zasada dostępu do DM (zalecane `pairing`)               |
| `allowFrom`  | Numery telefonów lub wartości `uuid:<id>` dopuszczone do DM |

## Co to jest

- Kanał Signal przez `signal-cli` (nie przez wbudowane libsignal).
- Deterministyczny routing: odpowiedzi zawsze wracają do Signal.
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
- Jeśli uruchomisz bota na **swoim osobistym koncie Signal**, będzie ignorował Twoje własne wiadomości (ochrona przed pętlą).
- Dla scenariusza „wysyłam SMS-a do bota, a on odpowiada” użyj **oddzielnego numeru bota**.

## Ścieżka konfiguracji A: połącz istniejące konto Signal (QR)

1. Zainstaluj `signal-cli` (kompilację JVM albo natywną).
2. Połącz konto bota:
   - `signal-cli link -n "OpenClaw"`, a następnie zeskanuj kod QR w Signal.
3. Skonfiguruj Signal i uruchom gateway.

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

Użyj tej opcji, gdy chcesz mieć dedykowany numer bota zamiast łączyć istniejące konto aplikacji Signal.

1. Uzyskaj numer, który może odbierać SMS-y (lub weryfikację głosową dla telefonów stacjonarnych).
   - Użyj dedykowanego numeru bota, aby uniknąć konfliktów konta/sesji.
2. Zainstaluj `signal-cli` na hoście gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jeśli używasz kompilacji JVM (`signal-cli-${VERSION}.tar.gz`), najpierw zainstaluj JRE 25+.
Aktualizuj `signal-cli`; upstream zauważa, że stare wydania mogą przestać działać, gdy zmieniają się API serwera Signal.

3. Zarejestruj i zweryfikuj numer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jeśli captcha jest wymagana:

1. Otwórz `https://signalcaptchas.org/registration/generate.html`.
2. Ukończ captchę, skopiuj cel linku `signalcaptcha://...` z „Open Signal”.
3. Jeśli to możliwe, uruchamiaj z tego samego zewnętrznego adresu IP co sesja przeglądarki.
4. Natychmiast ponownie uruchom rejestrację (tokeny captchy szybko wygasają):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Skonfiguruj OpenClaw, uruchom ponownie gateway, zweryfikuj kanał:

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
   - Zapisz numer bota jako kontakt w telefonie, aby uniknąć komunikatu „Nieznany kontakt”.

<Warning>
Rejestracja konta numeru telefonu za pomocą `signal-cli` może wylogować główną sesję aplikacji Signal dla tego numeru. Preferuj dedykowany numer bota albo użyj trybu łączenia QR, jeśli musisz zachować istniejącą konfigurację aplikacji na telefonie.
</Warning>

Odnośniki upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Przepływ captchy: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Przepływ łączenia: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Tryb zewnętrznego daemona (httpUrl)

Jeśli chcesz samodzielnie zarządzać `signal-cli` (wolne zimne starty JVM, inicjalizacja kontenera albo współdzielone CPU), uruchom daemona osobno i skieruj do niego OpenClaw:

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

Pomija to automatyczne uruchamianie procesu i oczekiwanie na start wewnątrz OpenClaw. Przy wolnych startach podczas automatycznego uruchamiania ustaw `channels.signal.startupTimeoutMs`.

## Tryb kontenera (bbernhard/signal-cli-rest-api)

Zamiast uruchamiać `signal-cli` natywnie, możesz użyć kontenera Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Opakowuje on `signal-cli` interfejsem REST API i WebSocket.

Wymagania:

- Kontener **musi** działać z `MODE=json-rpc`, aby odbierać wiadomości w czasie rzeczywistym.
- Zarejestruj lub połącz swoje konto Signal wewnątrz kontenera przed połączeniem OpenClaw.

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

| Wartość      | Zachowanie                                                                           |
| ------------ | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Domyślnie) Sprawdza oba transporty; streaming weryfikuje odbiór WebSocket kontenera |
| `"native"`    | Wymusza natywny signal-cli (JSON-RPC pod `/api/v1/rpc`, SSE pod `/api/v1/events`)    |
| `"container"` | Wymusza kontener bbernhard (REST pod `/v2/send`, WebSocket pod `/v1/receive/{account}`) |

Gdy `apiMode` ma wartość `"auto"`, OpenClaw buforuje wykryty tryb przez 30 sekund, aby uniknąć powtarzanych prób. Odbiór kontenerowy jest wybierany do streamingu dopiero po przełączeniu `/v1/receive/{account}` na WebSocket, co wymaga `MODE=json-rpc`.

Tryb kontenera obsługuje te same operacje kanału Signal co tryb natywny, gdy kontener udostępnia odpowiadające API: wysyłanie, odbieranie, załączniki, wskaźniki pisania, potwierdzenia odczytania/wyświetlenia, reakcje, grupy i stylizowany tekst. OpenClaw tłumaczy swoje natywne wywołania RPC Signal na payloady REST kontenera, w tym identyfikatory grup `group.{base64(internal_id)}` i `text_mode: "styled"` dla sformatowanego tekstu.

Uwagi operacyjne:

- Używaj `autoStart: false` z trybem kontenera. OpenClaw nie powinien uruchamiać natywnego daemona, gdy wybrano `apiMode: "container"`.
- Używaj `MODE=json-rpc` do odbioru. `MODE=normal` może sprawiać, że `/v1/about` wygląda poprawnie, ale `/v1/receive/{account}` nie przechodzi aktualizacji do WebSocket, więc OpenClaw nie wybierze kontenerowego streamingu odbioru w trybie `auto`.
- Ustaw `apiMode: "container"`, gdy wiesz, że `httpUrl` wskazuje REST API bbernhard. Ustaw `apiMode: "native"`, gdy wiesz, że wskazuje natywny JSON-RPC/SSE `signal-cli`. Użyj `"auto"`, gdy wdrożenie może się różnić.
- Pobieranie załączników w trybie kontenera respektuje te same limity bajtów multimediów co tryb natywny. Zbyt duże odpowiedzi są odrzucane przed pełnym zbuforowaniem, gdy serwer wysyła `Content-Length`, a w innym przypadku podczas streamingu.

## Kontrola dostępu (DM + grupy)

DM:

- Domyślnie: `channels.signal.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdź przez:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Parowanie jest domyślną wymianą tokenów dla DM Signal. Szczegóły: [Parowanie](/pl/channels/pairing)
- Nadawcy wyłącznie z UUID (z `sourceUuid`) są zapisywani jako `uuid:<id>` w `channels.signal.allowFrom`.

Grupy:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kontroluje, które grupy lub nadawcy mogą wyzwalać odpowiedzi grupowe, gdy ustawione jest `allowlist`; wpisami mogą być identyfikatory grup Signal (surowe, `group:<id>` albo `signal:group:<id>`), numery telefonów nadawców, wartości `uuid:<id>` albo `*`.
- `channels.signal.groups["<group-id>" | "*"]` może nadpisać zachowanie grup za pomocą `requireMention`, `tools` i `toolsBySender`.
- Użyj `channels.signal.accounts.<id>.groups` dla nadpisań per konto w konfiguracjach wielokontowych.
- Dodanie grupy Signal do listy dozwolonych przez `groupAllowFrom` samo w sobie nie wyłącza bramkowania wzmianką. Konkretnie skonfigurowany wpis `channels.signal.groups["<group-id>"]` przetwarza każdą wiadomość grupową, chyba że ustawiono `requireMention=true`.
- Uwaga dotycząca runtime: jeśli `channels.signal` całkowicie brakuje, runtime wraca do `groupPolicy="allowlist"` dla sprawdzania grup (nawet jeśli ustawione jest `channels.defaults.groupPolicy`).

## Jak to działa (zachowanie)

- Tryb natywny: `signal-cli` działa jako daemon; gateway odczytuje zdarzenia przez SSE.
- Tryb kontenera: gateway wysyła przez REST API i odbiera przez WebSocket.
- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału.
- Odpowiedzi zawsze są kierowane z powrotem do tego samego numeru lub grupy.

## Multimedia + limity

- Tekst wychodzący jest dzielony do `channels.signal.textChunkLimit` (domyślnie 4000).
- Opcjonalne dzielenie po znakach nowej linii: ustaw `channels.signal.chunkMode="newline"`, aby dzielić po pustych liniach (granicach akapitów) przed dzieleniem według długości.
- Załączniki są obsługiwane (base64 pobierane z `signal-cli`).
- Załączniki notatek głosowych używają nazwy pliku z `signal-cli` jako zapasowego MIME, gdy brakuje `contentType`, dzięki czemu transkrypcja audio nadal może klasyfikować notatki głosowe AAC.
- Domyślny limit multimediów: `channels.signal.mediaMaxMb` (domyślnie 8).
- Użyj `channels.signal.ignoreAttachments`, aby pominąć pobieranie multimediów.
- Kontekst historii grup używa `channels.signal.historyLimit` (albo `channels.signal.accounts.*.historyLimit`), a w razie braku wraca do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).

## Pisanie + potwierdzenia odczytu

- **Wskaźniki pisania**: OpenClaw wysyła sygnały pisania przez `signal-cli sendTyping` i odświeża je, gdy trwa generowanie odpowiedzi.
- **Potwierdzenia odczytu**: gdy `channels.signal.sendReadReceipts` ma wartość true, OpenClaw przekazuje potwierdzenia odczytu dla dozwolonych DM.
- Signal-cli nie udostępnia potwierdzeń odczytu dla grup.

## Reakcje statusu cyklu życia

Ustaw `messages.statusReactions.enabled: true`, aby Signal pokazywał wspólny
cykl życia reakcji: w kolejce/myślenie/narzędzie/Compaction/gotowe/błąd dla przychodzących tur.
Signal używa znacznika czasu wiadomości przychodzącej jako celu reakcji; reakcje
grupowe są wysyłane z identyfikatorem grupy Signal oraz pierwotnym nadawcą jako
autorem docelowym.

Reakcje statusu wymagają także reakcji ack oraz zgodnego
`messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` lub `all`).
Ustaw `channels.signal.reactionLevel: "off"`, aby wyłączyć reakcje statusu Signal.
Akcja `react` narzędzia wiadomości pozostaje bardziej rygorystyczna: wymaga
`reactionLevel: "minimal"` lub `"extensive"`.

`messages.removeAckAfterReply: true` czyści końcową reakcję statusu po
skonfigurowanym czasie podtrzymania. W przeciwnym razie Signal przywraca początkową reakcję ack po
końcowym stanie done/error.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=signal`.
- Cele: E.164 nadawcy lub UUID (użyj `uuid:<id>` z wyniku parowania; sam UUID także działa).
- `messageId` to znacznik czasu Signal dla wiadomości, na którą reagujesz.
- Reakcje grupowe wymagają `targetAuthor` lub `targetAuthorUuid`.

Przykłady:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguracja:

- `channels.signal.actions.reactions`: włącza/wyłącza akcje reakcji (domyślnie true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` wyłącza reakcje agenta (narzędzie wiadomości `react` zwróci błąd).
  - `minimal`/`extensive` włącza reakcje agenta i ustawia poziom wskazówek.
- Nadpisania dla kont: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reakcje zatwierdzania

Monity zatwierdzania wykonania Signal i pluginów używają bloków routingu najwyższego poziomu
`approvals.exec` i `approvals.plugin`. Signal nie ma bloku
`channels.signal.execApprovals`.

- `👍` zatwierdza raz.
- `👎` odmawia.
- Użyj `/approve <id> allow-always`, gdy żądanie oferuje trwałe zatwierdzenie.

Rozpoznawanie reakcji zatwierdzania wymaga jawnych zatwierdzających Signal z
`channels.signal.allowFrom`, `channels.signal.defaultTo` lub zgodnych pól na poziomie konta.
Bezpośrednie monity zatwierdzania wykonania w tym samym czacie nadal mogą pomijać zduplikowany lokalny fallback `/approve`
bez jawnych zatwierdzających; zatwierdzenia grupowe bez zatwierdzających pozostawiają widoczny lokalny fallback.

## Cele dostarczania (CLI/cron)

- DM: `signal:+15551234567` (lub zwykły E.164).
- DM UUID: `uuid:<id>` (lub sam UUID).
- Grupy: `signal:group:<groupId>`.
- Nazwy użytkowników: `username:<name>` (jeśli obsługiwane przez Twoje konto Signal).

## Aliasy

Skonfiguruj aliasy, gdy chcesz mieć stabilne nazwy dla powtarzających się celów Signal.
Aliasy istnieją tylko w konfiguracji po stronie OpenClaw; nie tworzą ani nie edytują kontaktów Signal.

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

Aliasy dla kont dziedziczą aliasy najwyższego poziomu i mogą dodawać lub nadpisywać nazwy:

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

`openclaw directory peers list --channel signal` i
`openclaw directory groups list --channel signal` wyświetlają skonfigurowane aliasy. Katalog
Signal jest oparty na konfiguracji; nie odpytuje na żywo kontaktów Signal ani
nie modyfikuje konta Signal.

## Rozwiązywanie problemów

Najpierw uruchom tę sekwencję:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie w razie potrzeby potwierdź stan parowania DM:

```bash
openclaw pairing list signal
```

Typowe awarie:

- Daemon jest osiągalny, ale nie ma odpowiedzi: sprawdź ustawienia konta/daemona (`httpUrl`, `account`) i tryb odbierania.
- DM są ignorowane: nadawca oczekuje na zatwierdzenie parowania.
- Wiadomości grupowe są ignorowane: bramkowanie nadawcy grupy/wzmianki blokuje dostarczenie.
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
- Przed migracją lub odbudową serwera wykonaj kopię zapasową stanu konta Signal.
- Zachowaj `channels.signal.dmPolicy: "pairing"`, chyba że jawnie chcesz szerszy dostęp do DM.
- Weryfikacja SMS jest potrzebna tylko w przepływach rejestracji lub odzyskiwania, ale utrata kontroli nad numerem/kontem może utrudnić ponowną rejestrację.

## Dokumentacja konfiguracji (Signal)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.signal.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.signal.apiMode`: `auto | native | container` (domyślnie: auto). Zobacz [Tryb kontenera](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 dla konta bota.
- `channels.signal.cliPath`: ścieżka do `signal-cli`.
- `channels.signal.configPath`: opcjonalny katalog `signal-cli --config`.
- `channels.signal.httpUrl`: pełny URL daemona (nadpisuje host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: powiązanie daemona (domyślnie 127.0.0.1:8080).
- `channels.signal.autoStart`: automatycznie uruchamia daemon (domyślnie true, jeśli `httpUrl` nie jest ustawione).
- `channels.signal.startupTimeoutMs`: limit czasu oczekiwania na uruchomienie w ms (maks. 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pomija pobieranie załączników.
- `channels.signal.ignoreStories`: ignoruje relacje z daemona.
- `channels.signal.sendReadReceipts`: przekazuje potwierdzenia odczytu.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.signal.allowFrom`: lista dozwolonych DM (E.164 lub `uuid:<id>`). `open` wymaga `"*"`. Signal nie ma nazw użytkowników; używaj identyfikatorów telefonu/UUID.
- `channels.signal.aliases`: aliasy po stronie OpenClaw dla celów dostarczania DM lub grup.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.signal.groupAllowFrom`: lista dozwolonych grup; akceptuje identyfikatory grup Signal (surowe, `group:<id>` lub `signal:group:<id>`), numery E.164 nadawców albo wartości `uuid:<id>`.
- `channels.signal.groups`: nadpisania dla grup indeksowane według identyfikatora grupy Signal (lub `"*"`). Obsługiwane pola: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: wersja `channels.signal.groups` dla kont w konfiguracjach wielokontowych.
- `channels.signal.accounts.<id>.aliases`: aliasy dla kont, scalane z aliasami najwyższego poziomu.
- `channels.signal.historyLimit`: maksymalna liczba wiadomości grupowych do uwzględnienia jako kontekst (0 wyłącza).
- `channels.signal.dmHistoryLimit`: limit historii DM w turach użytkownika. Nadpisania dla użytkowników: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: rozmiar fragmentu wychodzącego (znaki).
- `channels.signal.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych wierszach (granicach akapitów) przed dzieleniem według długości.
- `channels.signal.mediaMaxMb`: limit mediów przychodzących/wychodzących (MB).

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (Signal nie obsługuje natywnych wzmianek).
- `messages.groupChat.mentionPatterns` (globalny fallback).
- `messages.responsePrefix`.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
