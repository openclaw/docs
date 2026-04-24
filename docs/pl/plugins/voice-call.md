---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub rozwijasz Plugin voice-call
summary: 'Plugin Voice Call: połączenia wychodzące + przychodzące przez Twilio/Telnyx/Plivo (instalacja Pluginu + konfiguracja + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-24T09:25:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Plugin Voice Call

Połączenia głosowe dla OpenClaw przez Plugin. Obsługuje powiadomienia wychodzące i
rozmowy wieloturowe z politykami przychodzącymi.

Obecni providerzy:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + GetInput speech)
- `mock` (dev/bez sieci)

Szybki model mentalny:

- Zainstaluj Plugin
- Uruchom ponownie Gateway
- Skonfiguruj pod `plugins.entries.voice-call.config`
- Użyj `openclaw voicecall ...` albo narzędzia `voice_call`

## Gdzie to działa (local vs remote)

Plugin Voice Call działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj Plugin na **maszynie uruchamiającej Gateway**, a następnie uruchom ponownie Gateway, aby go załadować.

## Instalacja

### Opcja A: instalacja z npm (zalecane)

```bash
openclaw plugins install @openclaw/voice-call
```

Następnie uruchom ponownie Gateway.

### Opcja B: instalacja z lokalnego folderu (dev, bez kopiowania)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Następnie uruchom ponownie Gateway.

## Konfiguracja

Ustaw konfigurację pod `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // albo "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // albo TWILIO_FROM_NUMBER dla Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Klucz publiczny webhooka Telnyx z portalu Telnyx Mission Control
            // (ciąg Base64; można też ustawić przez TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Serwer webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Bezpieczeństwo webhooków (zalecane dla tuneli/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Publiczna ekspozycja (wybierz jedną)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opcjonalne; pierwszy zarejestrowany provider transkrypcji realtime, jeśli nie ustawiono
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcjonalne, jeśli ustawiono OPENAI_API_KEY
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Uwagi:

- Twilio/Telnyx wymagają **publicznie osiągalnego** URL-a webhooka.
- Plivo wymaga **publicznie osiągalnego** URL-a webhooka.
- `mock` to lokalny provider deweloperski (bez wywołań sieciowych).
- Jeśli starsze konfiguracje nadal używają `provider: "log"`, `twilio.from` albo starszych kluczy OpenAI `streaming.*`, uruchom `openclaw doctor --fix`, aby je przepisać.
- Telnyx wymaga `telnyx.publicKey` (albo `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
- `skipSignatureVerification` służy wyłącznie do testów lokalnych.
- Jeśli używasz darmowego planu ngrok, ustaw `publicUrl` na dokładny URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` pozwala na webhooki Twilio z nieprawidłowymi podpisami **tylko** wtedy, gdy `tunnel.provider="ngrok"` i `serve.bind` jest loopback (lokalny agent ngrok). Używaj tylko do lokalnego dev.
- URL-e ngrok w darmowym planie mogą się zmieniać albo dodawać zachowanie pośrednie; jeśli `publicUrl` przestanie być aktualny, podpisy Twilio będą zawodzić. W produkcji preferuj stabilną domenę albo Tailscale funnel.
- Domyślne ustawienia bezpieczeństwa streamingu:
  - `streaming.preStartTimeoutMs` zamyka sockety, które nigdy nie wysyłają prawidłowej ramki `start`.
- `streaming.maxPendingConnections` ogranicza całkowitą liczbę nieuwierzytelnionych socketów przed startem.
- `streaming.maxPendingConnectionsPerIp` ogranicza liczbę nieuwierzytelnionych socketów przed startem dla źródłowego IP.
- `streaming.maxConnections` ogranicza całkowitą liczbę otwartych socketów strumienia mediów (oczekujące + aktywne).
- Fallback runtime nadal tymczasowo akceptuje te stare klucze `voice-call`, ale ścieżką przepisywania jest `openclaw doctor --fix`, a shim zgodności jest tymczasowy.

## Streaming transkrypcji

`streaming` wybiera providera transkrypcji realtime dla dźwięku połączenia na żywo.

Bieżące zachowanie runtime:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego
  zarejestrowanego providera transkrypcji realtime.
- Dołączeni providerzy transkrypcji realtime obejmują Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI
  (`xai`), rejestrowanych przez ich Pluginy providerów.
- Surowa konfiguracja należąca do providera znajduje się pod `streaming.providers.<providerId>`.
- Jeśli `streaming.provider` wskazuje na niezarejestrowanego providera albo w ogóle nie jest zarejestrowany żaden
  provider transkrypcji realtime, Voice Call zapisuje ostrzeżenie w logu i
  pomija streaming mediów zamiast wywracać cały Plugin.

Domyślne ustawienia transkrypcji streamingowej OpenAI:

- Klucz API: `streaming.providers.openai.apiKey` albo `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Domyślne ustawienia transkrypcji streamingowej xAI:

- Klucz API: `streaming.providers.xai.apiKey` albo `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Przykład:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcjonalne, jeśli ustawiono OPENAI_API_KEY
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Zamiast tego użyj xAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // opcjonalne, jeśli ustawiono XAI_API_KEY
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Starsze klucze są nadal automatycznie migrowane przez `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Reaper nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują terminalowego webhooka
(na przykład połączenia w trybie notify, które nigdy się nie kończą). Domyślna wartość to `0`
(wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów w stylu notify.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby zwykłe połączenia mogły
  się zakończyć. Dobry punkt startowy to `maxDurationSeconds + 30–60` sekund.

Przykład:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Bezpieczeństwo webhooków

Gdy przed Gateway stoi proxy albo tunel, Plugin rekonstruuje
publiczny URL do weryfikacji podpisu. Te opcje kontrolują, którym nagłówkom forwarding ufać.

`webhookSecurity.allowedHosts` tworzy listę dozwolonych hostów z nagłówków forwarding.

`webhookSecurity.trustForwardingHeaders` ufa nagłówkom forwarding bez listy dozwolonych.

`webhookSecurity.trustedProxyIPs` ufa nagłówkom forwarding tylko wtedy, gdy zdalny IP żądania
pasuje do listy.

Ochrona przed replay webhooków jest włączona dla Twilio i Plivo. Ponownie odtworzone prawidłowe żądania webhook
są potwierdzane, ale pomijane dla skutków ubocznych.

Tury rozmowy Twilio zawierają token per tura w callbackach `<Gather>`, więc
nieaktualne/odtworzone callbacki mowy nie mogą spełnić nowszej oczekującej tury transkryptu.

Nieuwierzytelnione żądania webhooków są odrzucane przed odczytem body, gdy
brakuje wymaganych przez providera nagłówków podpisu.

Webhook voice-call używa współdzielonego profilu body pre-auth (64 KB / 5 sekund)
plus limitu in-flight per IP przed weryfikacją podpisu.

Przykład ze stabilnym publicznym hostem:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS dla połączeń

Voice Call używa podstawowej konfiguracji `messages.tts` do
streamowania mowy w połączeniach. Możesz ją nadpisać w konfiguracji Pluginu, używając
**tego samego kształtu** — jest głęboko scalana z `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Uwagi:

- Starsze klucze `tts.<provider>` wewnątrz konfiguracji Pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są automatycznie migrowane przy ładowaniu do `tts.providers.<provider>`. W zapisanej konfiguracji preferuj kształt `providers`.
- **Microsoft speech jest ignorowany dla połączeń głosowych** (audio telefoniczne wymaga PCM; bieżący transport Microsoft nie udostępnia wyjścia PCM dla telefonii).
- Główny TTS jest używany, gdy włączony jest streaming mediów Twilio; w przeciwnym razie połączenia wracają do natywnych głosów providera.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli telefoniczny TTS jest w tym stanie niedostępny, żądanie odtworzenia kończy się błędem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczny TTS wraca do drugiego providera, Voice Call zapisuje ostrzeżenie z łańcuchem providerów (`from`, `to`, `attempts`) do debugowania.

### Więcej przykładów

Użyj tylko podstawowego TTS (bez nadpisania):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Nadpisz na ElevenLabs tylko dla połączeń (zachowaj podstawowe ustawienie gdzie indziej):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Nadpisz tylko model OpenAI dla połączeń (przykład deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Połączenia przychodzące

Domyślna polityka połączeń przychodzących to `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` to filtr caller ID o niskim poziomie pewności. Plugin
normalizuje wartość `From` dostarczoną przez providera i porównuje ją z `allowFrom`.
Weryfikacja webhooków uwierzytelnia dostarczenie przez providera i integralność ładunku, ale
nie dowodzi własności numeru dzwoniącego PSTN/VoIP. Traktuj `allowFrom` jako filtrowanie caller ID, a nie silną tożsamość rozmówcy.

Automatyczne odpowiedzi używają systemu agenta. Dostrajasz je przez:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrakt danych mówionych

Dla automatycznych odpowiedzi Voice Call dołącza do promptu systemowego ścisły kontrakt danych mówionych:

- `{"spoken":"..."}`

Voice Call następnie defensywnie wyciąga tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w ogrodzeniu albo inline’owe klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne wiodące akapity planowania/meta.

Dzięki temu odtwarzanie mowy pozostaje skupione na tekście skierowanym do rozmówcy i unika przedostawania się tekstu planowania do audio.

### Zachowanie przy starcie rozmowy

Dla połączeń wychodzących w trybie `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania na żywo:

- Czyszczenie kolejki barge-in i automatyczna odpowiedź są tłumione tylko wtedy, gdy początkowe powitanie jest aktywnie odtwarzane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do `listening`, a początkowa wiadomość pozostaje w kolejce do ponownej próby.
- Początkowe odtwarzanie dla streamingu Twilio startuje przy połączeniu strumienia bez dodatkowego opóźnienia.

### Grace dla rozłączenia strumienia Twilio

Gdy strumień mediów Twilio się rozłącza, Voice Call czeka `2000ms`, zanim automatycznie zakończy połączenie:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostaje anulowane.
- Jeśli po okresie grace żaden strumień nie zostanie ponownie zarejestrowany, połączenie jest kończone, aby zapobiec utknięciu aktywnych połączeń.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias dla call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # podsumowanie opóźnienia tur z logów
openclaw voicecall expose --mode funnel
```

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki storage voice-call. Użyj
`--file <path>`, aby wskazać inny log, oraz `--last <n>`, aby ograniczyć analizę
do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują p50/p90/p99 dla
opóźnienia tury i czasów listen-wait.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`

Akcje:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

To repozytorium dostarcza pasujący dokument skill pod `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Powiązane

- [Text-to-speech](/pl/tools/tts)
- [Talk mode](/pl/nodes/talk)
- [Voice wake](/pl/nodes/voicewake)
