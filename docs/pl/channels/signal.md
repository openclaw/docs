---
read_when:
    - Konfigurowanie obsługi Signal
    - Debugowanie wysyłania/odbierania w Signal
summary: Obsługa Signal przez signal-cli (JSON-RPC + SSE), ścieżki konfiguracji i model numerów
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

Status: zewnętrzna integracja CLI. Gateway komunikuje się z `signal-cli` przez HTTP JSON-RPC + SSE.

## Wymagania wstępne

- OpenClaw zainstalowany na Twoim serwerze (poniższy przepływ dla Linuxa przetestowano na Ubuntu 24).
- `signal-cli` dostępne na hoście, na którym działa Gateway.
- Numer telefonu, który może odebrać jeden weryfikacyjny SMS (dla ścieżki rejestracji przez SMS).
- Dostęp do przeglądarki dla captcha Signal (`signalcaptchas.org`) podczas rejestracji.

## Szybka konfiguracja (dla początkujących)

1. Użyj **osobnego numeru Signal** dla bota (zalecane).
2. Zainstaluj `signal-cli` (Java jest wymagana, jeśli używasz kompilacji JVM).
3. Wybierz jedną ścieżkę konfiguracji:
   - **Ścieżka A (łączenie przez QR):** `signal-cli link -n "OpenClaw"` i zeskanuj kod w Signal.
   - **Ścieżka B (rejestracja SMS):** zarejestruj dedykowany numer z captcha + weryfikacją SMS.
4. Skonfiguruj OpenClaw i uruchom ponownie Gateway.
5. Wyślij pierwszą wiadomość bezpośrednią i zatwierdź parowanie (`openclaw pairing approve signal <CODE>`).

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

| Pole        | Opis                                                       |
| ----------- | ---------------------------------------------------------- |
| `account`   | Numer telefonu bota w formacie E.164 (`+15551234567`)      |
| `cliPath`   | Ścieżka do `signal-cli` (`signal-cli`, jeśli jest w `PATH`) |
| `dmPolicy`  | Zasada dostępu do DM (zalecane `pairing`)                  |
| `allowFrom` | Numery telefonu lub wartości `uuid:<id>` z prawem do DM    |

## Czym to jest

- Kanał Signal przez `signal-cli` (nie osadzona biblioteka libsignal).
- Deterministyczne trasowanie: odpowiedzi zawsze wracają do Signal.
- DM współdzielą główną sesję agenta; grupy są izolowane (`agent:<agentId>:signal:group:<groupId>`).

## Zapisy konfiguracji

Domyślnie Signal może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz przez:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Model numeru (ważne)

- Gateway łączy się z **urządzeniem Signal** (kontem `signal-cli`).
- Jeśli uruchomisz bota na **swoim osobistym koncie Signal**, będzie ignorować Twoje własne wiadomości (ochrona przed pętlą).
- Dla scenariusza „wysyłam SMS do bota, a on odpowiada” użyj **osobnego numeru bota**.

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

Obsługa wielu kont: użyj `channels.signal.accounts` z konfiguracją per konto i opcjonalnym `name`. Zobacz [`gateway/configuration`](/pl/gateway/config-channels#multi-account-all-channels), aby poznać wspólny wzorzec.

## Ścieżka konfiguracji B: zarejestruj dedykowany numer bota (SMS, Linux)

Użyj tego, gdy chcesz mieć dedykowany numer bota zamiast łączyć istniejące konto aplikacji Signal.

1. Uzyskaj numer, który może odbierać SMS (lub weryfikację głosową dla numerów stacjonarnych).
   - Użyj dedykowanego numeru bota, aby uniknąć konfliktów konta/sesji.
2. Zainstaluj `signal-cli` na hoście Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jeśli używasz kompilacji JVM (`signal-cli-${VERSION}.tar.gz`), najpierw zainstaluj JRE 25+.
Aktualizuj `signal-cli`; upstream zauważa, że stare wydania mogą przestać działać, gdy zmienią się API serwerów Signal.

3. Zarejestruj i zweryfikuj numer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jeśli wymagana jest captcha:

1. Otwórz `https://signalcaptchas.org/registration/generate.html`.
2. Ukończ captcha, skopiuj cel linku `signalcaptcha://...` z „Open Signal”.
3. Gdy to możliwe, uruchom z tego samego zewnętrznego IP co sesja przeglądarki.
4. Natychmiast uruchom rejestrację ponownie (tokeny captcha szybko wygasają):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Skonfiguruj OpenClaw, uruchom ponownie Gateway, zweryfikuj kanał:

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
   - Zapisz numer bota jako kontakt w telefonie, aby uniknąć „Unknown contact”.

<Warning>
Rejestracja konta numeru telefonu przez `signal-cli` może wyautoryzować główną sesję aplikacji Signal dla tego numeru. Preferuj dedykowany numer bota albo użyj trybu łączenia przez QR, jeśli musisz zachować istniejącą konfigurację aplikacji na telefonie.
</Warning>

Źródła upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Przepływ captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Przepływ łączenia: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Tryb zewnętrznego demona (httpUrl)

Jeśli chcesz samodzielnie zarządzać `signal-cli` (wolne zimne starty JVM, inicjalizacja kontenera lub współdzielone CPU), uruchom demona osobno i skieruj OpenClaw na niego:

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

To pomija automatyczne uruchamianie procesu i oczekiwanie na start wewnątrz OpenClaw. Dla wolnych startów przy automatycznym uruchamianiu ustaw `channels.signal.startupTimeoutMs`.

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
- `channels.signal.groupAllowFrom` kontroluje, które grupy lub nadawcy mogą wywoływać odpowiedzi grupowe, gdy ustawione jest `allowlist`; wpisami mogą być identyfikatory grup Signal (surowe, `group:<id>` lub `signal:group:<id>`), numery telefonów nadawców, wartości `uuid:<id>` albo `*`.
- `channels.signal.groups["<group-id>" | "*"]` może nadpisywać zachowanie grupy przez `requireMention`, `tools` i `toolsBySender`.
- Użyj `channels.signal.accounts.<id>.groups` dla nadpisań per konto w konfiguracjach wielokontowych.
- Dodanie grupy Signal do listy dozwolonych przez `groupAllowFrom` samo w sobie nie wyłącza bramkowania wzmianką. Konkretnie skonfigurowany wpis `channels.signal.groups["<group-id>"]` przetwarza każdą wiadomość grupową, chyba że ustawiono `requireMention=true`.
- Uwaga dotycząca działania: jeśli całkowicie brakuje `channels.signal`, środowisko wykonawcze wraca do `groupPolicy="allowlist"` dla sprawdzeń grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

## Jak to działa (zachowanie)

- `signal-cli` działa jako demon; Gateway odczytuje zdarzenia przez SSE.
- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału.
- Odpowiedzi zawsze są trasowane z powrotem do tego samego numeru lub grupy.

## Media + limity

- Tekst wychodzący jest dzielony do `channels.signal.textChunkLimit` (domyślnie 4000).
- Opcjonalne dzielenie według nowych linii: ustaw `channels.signal.chunkMode="newline"`, aby dzielić po pustych liniach (granicach akapitów) przed dzieleniem według długości.
- Załączniki są obsługiwane (base64 pobierane z `signal-cli`).
- Załączniki notatek głosowych używają nazwy pliku `signal-cli` jako awaryjnego MIME, gdy brakuje `contentType`, dzięki czemu transkrypcja audio nadal może klasyfikować notatki głosowe AAC.
- Domyślny limit mediów: `channels.signal.mediaMaxMb` (domyślnie 8).
- Użyj `channels.signal.ignoreAttachments`, aby pominąć pobieranie mediów.
- Kontekst historii grupy używa `channels.signal.historyLimit` (lub `channels.signal.accounts.*.historyLimit`), z powrotem do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).

## Pisanie + potwierdzenia odczytu

- **Wskaźniki pisania**: OpenClaw wysyła sygnały pisania przez `signal-cli sendTyping` i odświeża je, gdy trwa odpowiedź.
- **Potwierdzenia odczytu**: gdy `channels.signal.sendReadReceipts` ma wartość true, OpenClaw przekazuje potwierdzenia odczytu dla dozwolonych DM.
- Signal-cli nie udostępnia potwierdzeń odczytu dla grup.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=signal`.
- Cele: nadawca E.164 lub UUID (użyj `uuid:<id>` z wyjścia parowania; sam UUID też działa).
- `messageId` to znacznik czasu Signal wiadomości, na którą reagujesz.
- Reakcje grupowe wymagają `targetAuthor` lub `targetAuthorUuid`.

Przykłady:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguracja:

- `channels.signal.actions.reactions`: włącz/wyłącz akcje reakcji (domyślnie true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` wyłącza reakcje agenta (narzędzie wiadomości `react` zwróci błąd).
  - `minimal`/`extensive` włącza reakcje agenta i ustawia poziom wskazówek.
- Nadpisania per konto: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Cele dostarczania (CLI/Cron)

- DM: `signal:+15551234567` (lub zwykły E.164).
- DM UUID: `uuid:<id>` (lub sam UUID).
- Grupy: `signal:group:<groupId>`.
- Nazwy użytkownika: `username:<name>` (jeśli obsługiwane przez Twoje konto Signal).

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

- Demon osiągalny, ale brak odpowiedzi: zweryfikuj ustawienia konta/demona (`httpUrl`, `account`) i tryb odbierania.
- DM ignorowane: nadawca oczekuje na zatwierdzenie parowania.
- Wiadomości grupowe ignorowane: bramkowanie nadawcy/wzmianki grupy blokuje dostarczenie.
- Błędy walidacji konfiguracji po edycjach: uruchom `openclaw doctor --fix`.
- Brak Signal w diagnostyce: potwierdź `channels.signal.enabled: true`.

Dodatkowe sprawdzenia:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Przepływ triage: [/channels/troubleshooting](/pl/channels/troubleshooting).

## Uwagi dotyczące bezpieczeństwa

- `signal-cli` przechowuje klucze konta lokalnie (zwykle `~/.local/share/signal-cli/data/`).
- Utwórz kopię zapasową stanu konta Signal przed migracją lub odbudową serwera.
- Zachowaj `channels.signal.dmPolicy: "pairing"`, chyba że wyraźnie chcesz szerszego dostępu do DM.
- Weryfikacja SMS jest potrzebna tylko dla przepływów rejestracji lub odzyskiwania, ale utrata kontroli nad numerem/kontem może utrudnić ponowną rejestrację.

## Opis konfiguracji (Signal)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.signal.enabled`: włącz/wyłącz uruchamianie kanału.
- `channels.signal.account`: E.164 dla konta bota.
- `channels.signal.cliPath`: ścieżka do `signal-cli`.
- `channels.signal.httpUrl`: pełny URL demona (zastępuje host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: powiązanie demona (domyślnie 127.0.0.1:8080).
- `channels.signal.autoStart`: automatycznie uruchamiaj demona (domyślnie true, jeśli `httpUrl` nie jest ustawione).
- `channels.signal.startupTimeoutMs`: limit czasu oczekiwania na uruchomienie w ms (maks. 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pomijaj pobieranie załączników.
- `channels.signal.ignoreStories`: ignoruj relacje z demona.
- `channels.signal.sendReadReceipts`: przekazuj potwierdzenia odczytu.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.signal.allowFrom`: lista dozwolonych wiadomości prywatnych (E.164 lub `uuid:<id>`). `open` wymaga `"*"`. Signal nie ma nazw użytkowników; używaj identyfikatorów telefonu/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.signal.groupAllowFrom`: lista dozwolonych grup; akceptuje identyfikatory grup Signal (surowe, `group:<id>` lub `signal:group:<id>`), numery nadawców E.164 albo wartości `uuid:<id>`.
- `channels.signal.groups`: nadpisania dla poszczególnych grup, kluczowane identyfikatorem grupy Signal (lub `"*"`). Obsługiwane pola: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: wersja `channels.signal.groups` dla poszczególnych kont w konfiguracjach wielokontowych.
- `channels.signal.historyLimit`: maksymalna liczba wiadomości grupowych do dołączenia jako kontekst (0 wyłącza).
- `channels.signal.dmHistoryLimit`: limit historii wiadomości prywatnych w turach użytkownika. Nadpisania dla poszczególnych użytkowników: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: rozmiar fragmentu wychodzącego (znaki).
- `channels.signal.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić według pustych wierszy (granic akapitów) przed dzieleniem według długości.
- `channels.signal.mediaMaxMb`: limit multimediów przychodzących/wychodzących (MB).

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (Signal nie obsługuje natywnych wzmianek).
- `messages.groupChat.mentionPatterns` (globalna opcja zastępcza).
- `messages.responsePrefix`.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i kontrola wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
