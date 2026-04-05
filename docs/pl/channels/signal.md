---
read_when:
    - Konfigurowanie obsługi Signal
    - Debugowanie wysyłania/odbierania w Signal
summary: Obsługa Signal przez signal-cli (JSON-RPC + SSE), ścieżki konfiguracji i model numerów
title: Signal
x-i18n:
    generated_at: "2026-04-05T13:46:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Status: zewnętrzna integracja CLI. Gateway komunikuje się z `signal-cli` przez HTTP JSON-RPC + SSE.

## Wymagania wstępne

- OpenClaw zainstalowany na serwerze (poniższy przepływ dla Linuksa testowano na Ubuntu 24).
- `signal-cli` dostępny na hoście, na którym działa gateway.
- Numer telefonu, który może odebrać jedną wiadomość SMS weryfikacyjną (dla ścieżki rejestracji SMS).
- Dostęp do przeglądarki na potrzeby captcha Signal (`signalcaptchas.org`) podczas rejestracji.

## Szybka konfiguracja (dla początkujących)

1. Użyj **oddzielnego numeru Signal** dla bota (zalecane).
2. Zainstaluj `signal-cli` (Java jest wymagana, jeśli używasz kompilacji JVM).
3. Wybierz jedną ścieżkę konfiguracji:
   - **Ścieżka A (połączenie przez QR):** `signal-cli link -n "OpenClaw"` i zeskanuj kod w Signal.
   - **Ścieżka B (rejestracja SMS):** zarejestruj dedykowany numer z captcha + weryfikacją SMS.
4. Skonfiguruj OpenClaw i uruchom ponownie gateway.
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

| Pole        | Opis                                                      |
| ----------- | --------------------------------------------------------- |
| `account`   | Numer telefonu bota w formacie E.164 (`+15551234567`)     |
| `cliPath`   | Ścieżka do `signal-cli` (`signal-cli`, jeśli jest w `PATH`) |
| `dmPolicy`  | Polityka dostępu do DM (`pairing` jest zalecane)          |
| `allowFrom` | Numery telefonów lub wartości `uuid:<id>` dozwolone w DM  |

## Czym to jest

- Kanał Signal przez `signal-cli` (nie osadzony libsignal).
- Deterministyczne routowanie: odpowiedzi zawsze wracają do Signal.
- DM współdzielą główną sesję agenta; grupy są izolowane (`agent:<agentId>:signal:group:<groupId>`).

## Zapis konfiguracji

Domyślnie Signal może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz za pomocą:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Model numerów (ważne)

- Gateway łączy się z **urządzeniem Signal** (kontem `signal-cli`).
- Jeśli uruchamiasz bota na **swoim osobistym koncie Signal**, będzie ignorować Twoje własne wiadomości (ochrona przed pętlą).
- Dla scenariusza „piszę do bota, a on odpowiada” użyj **oddzielnego numeru bota**.

## Ścieżka konfiguracji A: połącz istniejące konto Signal (QR)

1. Zainstaluj `signal-cli` (kompilacja JVM lub natywna).
2. Połącz konto bota:
   - `signal-cli link -n "OpenClaw"` i zeskanuj kod QR w Signal.
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

Obsługa wielu kont: użyj `channels.signal.accounts` z konfiguracją per konto i opcjonalnym `name`. Wspólny wzorzec znajdziesz w [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels).

## Ścieżka konfiguracji B: zarejestruj dedykowany numer bota (SMS, Linux)

Użyj tego wariantu, jeśli chcesz mieć dedykowany numer bota zamiast łączyć istniejące konto aplikacji Signal.

1. Zdobądź numer, który może odbierać SMS-y (lub weryfikację głosową dla numerów stacjonarnych).
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
Utrzymuj `signal-cli` w aktualnej wersji; upstream zaznacza, że stare wydania mogą przestać działać wraz ze zmianami API serwerów Signal.

3. Zarejestruj i zweryfikuj numer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jeśli captcha jest wymagana:

1. Otwórz `https://signalcaptchas.org/registration/generate.html`.
2. Ukończ captcha, skopiuj docelowy link `signalcaptcha://...` z „Open Signal”.
3. Jeśli to możliwe, uruchom z tego samego zewnętrznego IP co sesja przeglądarki.
4. Natychmiast uruchom rejestrację ponownie (tokeny captcha szybko wygasają):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Skonfiguruj OpenClaw, uruchom ponownie gateway, zweryfikuj kanał:

```bash
# Jeśli uruchamiasz gateway jako usługę systemd użytkownika:
systemctl --user restart openclaw-gateway.service

# Następnie zweryfikuj:
openclaw doctor
openclaw channels status --probe
```

5. Sparuj nadawcę DM:
   - Wyślij dowolną wiadomość na numer bota.
   - Zatwierdź kod na serwerze: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Zapisz numer bota jako kontakt w telefonie, aby uniknąć „Unknown contact”.

Ważne: rejestracja konta numeru telefonu przez `signal-cli` może wylogować główną sesję aplikacji Signal dla tego numeru. Preferuj dedykowany numer bota albo użyj trybu połączenia QR, jeśli chcesz zachować obecną konfigurację aplikacji w telefonie.

Materiały upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Przepływ captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Przepływ łączenia: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Tryb zewnętrznego demona (httpUrl)

Jeśli chcesz samodzielnie zarządzać `signal-cli` (powolne zimne starty JVM, inicjalizacja kontenera lub współdzielone CPU), uruchom demon osobno i wskaż go w OpenClaw:

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

Pomija to automatyczne uruchamianie i oczekiwanie na start wewnątrz OpenClaw. W przypadku powolnych startów przy auto-uruchamianiu ustaw `channels.signal.startupTimeoutMs`.

## Kontrola dostępu (DM + grupy)

DM:

- Domyślnie: `channels.signal.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdzanie przez:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Parowanie jest domyślnym mechanizmem wymiany tokenów dla DM w Signal. Szczegóły: [Parowanie](/pl/channels/pairing)
- Nadawcy tylko z UUID (z `sourceUuid`) są zapisywani jako `uuid:<id>` w `channels.signal.allowFrom`.

Grupy:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kontroluje, kto może wywoływać działanie w grupach, gdy ustawiono `allowlist`.
- `channels.signal.groups["<group-id>" | "*"]` może nadpisać zachowanie grupy za pomocą `requireMention`, `tools` i `toolsBySender`.
- Użyj `channels.signal.accounts.<id>.groups` dla nadpisań per konto w konfiguracjach wielokontowych.
- Uwaga dotycząca runtime: jeśli `channels.signal` jest całkowicie nieobecne, runtime wraca do `groupPolicy="allowlist"` dla sprawdzania grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

## Jak to działa (zachowanie)

- `signal-cli` działa jako demon; gateway odczytuje zdarzenia przez SSE.
- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału.
- Odpowiedzi zawsze wracają na ten sam numer lub do tej samej grupy.

## Media i limity

- Tekst wychodzący jest dzielony na fragmenty zgodnie z `channels.signal.textChunkLimit` (domyślnie 4000).
- Opcjonalne dzielenie po nowych liniach: ustaw `channels.signal.chunkMode="newline"`, aby dzielić po pustych liniach (granice akapitów) przed dzieleniem według długości.
- Załączniki są obsługiwane (base64 pobierane z `signal-cli`).
- Domyślny limit mediów: `channels.signal.mediaMaxMb` (domyślnie 8).
- Użyj `channels.signal.ignoreAttachments`, aby pominąć pobieranie mediów.
- Kontekst historii grupy używa `channels.signal.historyLimit` (lub `channels.signal.accounts.*.historyLimit`), z fallbackiem do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).

## Pisanie i potwierdzenia odczytu

- **Wskaźniki pisania**: OpenClaw wysyła sygnały pisania przez `signal-cli sendTyping` i odświeża je podczas generowania odpowiedzi.
- **Potwierdzenia odczytu**: gdy `channels.signal.sendReadReceipts` ma wartość true, OpenClaw przekazuje potwierdzenia odczytu dla dozwolonych DM.
- Signal-cli nie udostępnia potwierdzeń odczytu dla grup.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=signal`.
- Cele: E.164 nadawcy lub UUID (użyj `uuid:<id>` z danych wyjściowych parowania; samo UUID też działa).
- `messageId` to znacznik czasu Signal dla wiadomości, na którą reagujesz.
- Reakcje w grupach wymagają `targetAuthor` lub `targetAuthorUuid`.

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
- Nadpisania per konto: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Cele dostarczania (CLI/cron)

- DM: `signal:+15551234567` (lub zwykły E.164).
- DM z UUID: `uuid:<id>` (lub samo UUID).
- Grupy: `signal:group:<groupId>`.
- Nazwy użytkowników: `username:<name>` (jeśli są obsługiwane przez Twoje konto Signal).

## Rozwiązywanie problemów

Najpierw wykonaj tę sekwencję:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie w razie potrzeby sprawdź stan parowania DM:

```bash
openclaw pairing list signal
```

Typowe problemy:

- Demon jest osiągalny, ale brak odpowiedzi: sprawdź ustawienia konta/demona (`httpUrl`, `account`) i tryb odbioru.
- DM są ignorowane: nadawca oczekuje na zatwierdzenie parowania.
- Wiadomości grupowe są ignorowane: ograniczenia nadawcy/wzmianki w grupie blokują dostarczenie.
- Błędy walidacji konfiguracji po edycji: uruchom `openclaw doctor --fix`.
- Brak Signal w diagnostyce: potwierdź `channels.signal.enabled: true`.

Dodatkowe kontrole:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Przepływ triage: [/channels/troubleshooting](/channels/troubleshooting).

## Uwagi dotyczące bezpieczeństwa

- `signal-cli` przechowuje klucze konta lokalnie (zwykle `~/.local/share/signal-cli/data/`).
- Przed migracją serwera lub jego przebudową wykonaj kopię zapasową stanu konta Signal.
- Zachowaj `channels.signal.dmPolicy: "pairing"`, chyba że świadomie chcesz szerszego dostępu do DM.
- Weryfikacja SMS jest potrzebna tylko do rejestracji lub odzyskiwania, ale utrata kontroli nad numerem/kontem może utrudnić ponowną rejestrację.

## Dokumentacja konfiguracji (Signal)

Pełna konfiguracja: [Konfiguracja](/gateway/configuration)

Opcje dostawcy:

- `channels.signal.enabled`: włączanie/wyłączanie uruchamiania kanału.
- `channels.signal.account`: E.164 dla konta bota.
- `channels.signal.cliPath`: ścieżka do `signal-cli`.
- `channels.signal.httpUrl`: pełny URL demona (nadpisuje host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: powiązanie demona (domyślnie 127.0.0.1:8080).
- `channels.signal.autoStart`: automatyczne uruchamianie demona (domyślnie true, jeśli `httpUrl` nie jest ustawione).
- `channels.signal.startupTimeoutMs`: limit oczekiwania na start w ms (maks. 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pomijanie pobierania załączników.
- `channels.signal.ignoreStories`: ignorowanie stories z demona.
- `channels.signal.sendReadReceipts`: przekazywanie potwierdzeń odczytu.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.signal.allowFrom`: lista dozwolonych DM (E.164 lub `uuid:<id>`). `open` wymaga `"*"`. Signal nie ma nazw użytkowników; używaj identyfikatorów telefon/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.signal.groupAllowFrom`: lista dozwolonych nadawców grupowych.
- `channels.signal.groups`: nadpisania per grupa kluczowane identyfikatorem grupy Signal (lub `"*"`). Obsługiwane pola: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: wersja `channels.signal.groups` per konto dla konfiguracji wielokontowych.
- `channels.signal.historyLimit`: maksymalna liczba wiadomości grupowych do uwzględnienia jako kontekst (0 wyłącza).
- `channels.signal.dmHistoryLimit`: limit historii DM w turach użytkownika. Nadpisania per użytkownik: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: rozmiar fragmentu wychodzącego (znaki).
- `channels.signal.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.signal.mediaMaxMb`: limit mediów przychodzących/wychodzących (MB).

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (Signal nie obsługuje natywnych wzmianek).
- `messages.groupChat.mentionPatterns` (globalny fallback).
- `messages.responsePrefix`.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i ograniczenia wzmianek
- [Routowanie kanałów](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i utwardzanie
