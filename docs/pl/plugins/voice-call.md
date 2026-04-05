---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub rozwijasz wtyczkę voice-call
summary: 'Wtyczka Voice Call: połączenia wychodzące i przychodzące przez Twilio/Telnyx/Plivo (instalacja wtyczki + konfiguracja + CLI)'
title: Wtyczka Voice Call
x-i18n:
    generated_at: "2026-04-05T14:03:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (wtyczka)

Połączenia głosowe dla OpenClaw przez wtyczkę. Obsługuje powiadomienia
wychodzące i wieloturowe rozmowy z zasadami dla połączeń przychodzących.

Obecni dostawcy:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (deweloperski/bez sieci)

Szybki model mentalny:

- Zainstaluj wtyczkę
- Uruchom ponownie Gateway
- Skonfiguruj w `plugins.entries.voice-call.config`
- Użyj `openclaw voicecall ...` lub narzędzia `voice_call`

## Gdzie to działa (lokalnie vs zdalnie)

Wtyczka Voice Call działa **wewnątrz procesu Gateway**.

Jeśli używasz zdalnego Gateway, zainstaluj/skonfiguruj wtyczkę na **maszynie, na której działa Gateway**, a następnie uruchom ponownie Gateway, aby ją załadować.

## Instalacja

### Opcja A: instalacja z npm (zalecane)

```bash
openclaw plugins install @openclaw/voice-call
```

Następnie uruchom ponownie Gateway.

### Opcja B: instalacja z folderu lokalnego (dewelopersko, bez kopiowania)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Następnie uruchom ponownie Gateway.

## Konfiguracja

Ustaw konfigurację w `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // lub "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Klucz publiczny webhooka Telnyx z Telnyx Mission Control Portal
            // (ciąg Base64; można też ustawić przez TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Serwer webhooków
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Zabezpieczenia webhooków (zalecane dla tuneli/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Publiczne wystawienie (wybierz jedno)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opcjonalne; pierwszy zarejestrowany dostawca transkrypcji realtime, jeśli nie ustawiono
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

- Twilio/Telnyx wymagają **publicznie dostępnego** adresu URL webhooka.
- Plivo wymaga **publicznie dostępnego** adresu URL webhooka.
- `mock` to lokalny dostawca deweloperski (bez wywołań sieciowych).
- Jeśli starsze konfiguracje nadal używają `provider: "log"`, `twilio.from` lub starszych kluczy `streaming.*` OpenAI, uruchom `openclaw doctor --fix`, aby je przepisać.
- Telnyx wymaga `telnyx.publicKey` (lub `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
- `skipSignatureVerification` służy wyłącznie do testów lokalnych.
- Jeśli używasz darmowej warstwy ngrok, ustaw `publicUrl` na dokładny adres URL ngrok; weryfikacja sygnatur jest zawsze wymuszana.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` pozwala na webhooki Twilio z nieprawidłowymi sygnaturami **tylko** gdy `tunnel.provider="ngrok"` i `serve.bind` to loopback (lokalny agent ngrok). Używaj tylko do lokalnego developmentu.
- Adresy URL darmowej warstwy ngrok mogą się zmieniać lub dodawać zachowanie pośrednie; jeśli `publicUrl` się rozjedzie, sygnatury Twilio przestaną przechodzić. W środowisku produkcyjnym preferuj stabilną domenę lub Tailscale funnel.
- Domyślne zabezpieczenia streamingu:
  - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wyślą prawidłowej ramki `start`.
- `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
- `streaming.maxPendingConnectionsPerIp` ogranicza liczbę nieuwierzytelnionych gniazd przed startem na źródłowy adres IP.
- `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia mediów (oczekujące + aktywne).
- Runtime nadal tymczasowo akceptuje te stare klucze voice-call, ale ścieżką przepisywania jest `openclaw doctor --fix`, a shim zgodności ma charakter tymczasowy.

## Transkrypcja streamingu

`streaming` wybiera dostawcę transkrypcji realtime dla dźwięku połączenia na żywo.

Obecne zachowanie runtime:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego
  zarejestrowanego dostawcy transkrypcji realtime.
- Obecnie wbudowanym dostawcą jest OpenAI, rejestrowany przez wbudowaną wtyczkę `openai`.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Jeśli `streaming.provider` wskazuje na niezarejestrowanego dostawcę lub w ogóle nie jest zarejestrowany żaden dostawca transkrypcji realtime, Voice Call zapisuje ostrzeżenie w logu i
  pomija streaming mediów zamiast powodować błąd całej wtyczki.

Domyślne ustawienia transkrypcji streamingowej OpenAI:

- Klucz API: `streaming.providers.openai.apiKey` lub `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

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

Starsze klucze są nadal automatycznie migrowane przez `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Mechanizm czyszczenia nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymają końcowego webhooka
(na przykład połączenia w trybie notify, które nigdy się nie kończą). Wartość domyślna to `0`
(wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów w stylu notify.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby normalne połączenia mogły się zakończyć. Dobrym punktem wyjścia jest `maxDurationSeconds + 30–60` sekund.

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

## Zabezpieczenia webhooków

Gdy przed Gateway znajduje się proxy lub tunel, wtyczka rekonstruuje
publiczny URL na potrzeby weryfikacji sygnatury. Te opcje kontrolują, którym przekazywanym
nagłówkom można ufać.

`webhookSecurity.allowedHosts` tworzy listę dozwolonych hostów z nagłówków przekazywania.

`webhookSecurity.trustForwardingHeaders` ufa nagłówkom przekazywania bez listy dozwolonych hostów.

`webhookSecurity.trustedProxyIPs` ufa nagłówkom przekazywania tylko wtedy, gdy
zdalny adres IP żądania pasuje do listy.

Ochrona przed powtórzeniami webhooków jest włączona dla Twilio i Plivo. Powtórzone prawidłowe żądania webhooka
są potwierdzane, ale ich skutki uboczne są pomijane.

Tury rozmowy Twilio zawierają token per-turn w callbackach `<Gather>`, więc
stare/powtórzone callbacki mowy nie mogą zaspokoić nowszej oczekującej tury transkrypcji.

Nieuwierzytelnione żądania webhooka są odrzucane przed odczytem treści, gdy
brakuje wymaganych nagłówków sygnatur danego dostawcy.

Webhook voice-call używa współdzielonego profilu treści pre-auth (64 KB / 5 sekund)
plus limitu aktywnych żądań na IP przed weryfikacją sygnatury.

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
strumieniowego odtwarzania mowy w połączeniach. Możesz ją nadpisać w konfiguracji wtyczki
**tym samym kształtem** — jest głęboko scalana z `messages.tts`.

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

- Starsze klucze `tts.<provider>` w konfiguracji wtyczki (`openai`, `elevenlabs`, `microsoft`, `edge`) są automatycznie migrowane podczas ładowania do `tts.providers.<provider>`. W zapisanej konfiguracji preferuj strukturę `providers`.
- **Microsoft speech jest ignorowany przy połączeniach głosowych** (dźwięk telefoniczny wymaga PCM; obecny transport Microsoft nie udostępnia wyjścia PCM dla telefonii).
- Podstawowy TTS jest używany, gdy włączony jest streaming mediów Twilio; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli TTS telefoniczny jest niedostępny w tym stanie, żądanie odtworzenia kończy się błędem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczny TTS wraca do dostawcy zapasowego, Voice Call zapisuje ostrzeżenie w logu z łańcuchem dostawców (`from`, `to`, `attempts`) na potrzeby debugowania.

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

Nadpisz na ElevenLabs tylko dla połączeń (zachowaj domyślny podstawowy gdzie indziej):

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

Nadpisz tylko model OpenAI dla połączeń (przykład głębokiego scalania):

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

Domyślna wartość `inboundPolicy` to `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` to filtr numeru dzwoniącego o niskim poziomie pewności. Wtyczka
normalizuje wartość `From` dostarczoną przez dostawcę i porównuje ją z `allowFrom`.
Weryfikacja webhooka uwierzytelnia dostarczenie przez dostawcę i integralność ładunku,
ale nie potwierdza własności numeru dzwoniącego PSTN/VoIP. Traktuj `allowFrom` jako
filtrowanie caller ID, a nie silną tożsamość rozmówcy.

Automatyczne odpowiedzi używają systemu agentów. Dostosuj je za pomocą:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrakt danych wyjściowych mowy

Dla automatycznych odpowiedzi Voice Call dołącza do promptu systemowego ścisły kontrakt danych wyjściowych mowy:

- `{"spoken":"..."}`

Voice Call następnie defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść typu reasoning/error.
- Parsuje bezpośredni JSON, JSON w bloku kodu lub wbudowane klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne wprowadzające akapity planowania/meta.

Dzięki temu odtwarzana mowa pozostaje skupiona na tekście przeznaczonym dla rozmówcy i nie dochodzi do wycieku tekstu planowania do dźwięku.

### Zachowanie uruchamiania rozmowy

Dla połączeń wychodzących `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania na żywo:

- Czyszczenie kolejki barge-in i automatyczna odpowiedź są wyłączane tylko wtedy, gdy początkowe powitanie jest aktywnie odtwarzane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do stanu `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla streamingu Twilio zaczyna się po połączeniu strumienia bez dodatkowego opóźnienia.

### Okres łaski po rozłączeniu strumienia Twilio

Gdy strumień mediów Twilio zostanie rozłączony, Voice Call czeka `2000ms` przed automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie jest anulowane.
- Jeśli po okresie łaski żaden strumień nie zostanie ponownie zarejestrowany, połączenie jest kończone, aby zapobiec zablokowanym aktywnym połączeniom.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias dla call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # podsumowuje opóźnienie tur na podstawie logów
openclaw voicecall expose --mode funnel
```

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call. Użyj
`--file <path>`, aby wskazać inny log, oraz `--last <n>`, aby ograniczyć analizę
do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują p50/p90/p99 dla opóźnienia tury i czasów oczekiwania nasłuchu.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`

Akcje:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

To repozytorium zawiera pasujący dokument Skills w `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
