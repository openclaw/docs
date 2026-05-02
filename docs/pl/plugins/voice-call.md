---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z poziomu OpenClaw
    - Konfigurujesz lub rozwijasz Plugin do połączeń głosowych
    - Potrzebujesz głosu w czasie rzeczywistym lub transkrypcji strumieniowej w telefonii
sidebarTitle: Voice call
summary: Wykonuj wychodzące i odbieraj przychodzące połączenia głosowe za pośrednictwem Twilio, Telnyx lub Plivo, z opcjonalną obsługą głosu w czasie rzeczywistym i strumieniowej transkrypcji
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-05-02T22:22:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls for OpenClaw via a plugin. Supports outbound notifications,
multi-turn conversations, full-duplex realtime voice, streaming
transcription, and inbound calls with allowlist policies.

**Current providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/no network).

<Note>
The Voice Call plugin runs **inside the Gateway process**. If you use a
remote Gateway, install and configure the plugin on the machine running
the Gateway, then restart the Gateway to load it.
</Note>

## Quick start

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Use the bare package to follow the current official release tag. Pin an
    exact version only when you need a reproducible install.

    Restart the Gateway afterwards so the plugin loads.

  </Step>
  <Step title="Configure provider and webhook">
    Set config under `plugins.entries.voice-call.config` (see
    [Configuration](#configuration) below for the full shape). At minimum:
    `provider`, provider credentials, `fromNumber`, and a publicly
    reachable webhook URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    The default output is readable in chat logs and terminals. It checks
    plugin enablement, provider credentials, webhook exposure, and that
    only one audio mode (`streaming` or `realtime`) is active. Use
    `--json` for scripts.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Both are dry runs by default. Add `--yes` to actually place a short
    outbound notify call:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
For Twilio, Telnyx, and Plivo, setup must resolve to a **public webhook URL**.
If `publicUrl`, the tunnel URL, the Tailscale URL, or the serve fallback
resolves to loopback or private network space, setup fails instead of
starting a provider that cannot receive carrier webhooks.
</Warning>

## Configuration

If `enabled: true` but the selected provider is missing credentials,
Gateway startup logs a setup-incomplete warning with the missing keys and
skips starting the runtime. Commands, RPC calls, and agent tools still
return the exact missing provider configuration when used.

<Note>
Voice-call credentials accept SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, and `plugins.entries.voice-call.config.tts.providers.*.apiKey` resolve through the standard SecretRef surface; see [SecretRef credential surface](/pl/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx, and Plivo all require a **publicly reachable** webhook URL.
    - `mock` is a local dev provider (no network calls).
    - Telnyx requires `telnyx.publicKey` (or `TELNYX_PUBLIC_KEY`) unless `skipSignatureVerification` is true.
    - `skipSignatureVerification` is for local testing only.
    - On ngrok free tier, set `publicUrl` to the exact ngrok URL; signature verification is always enforced.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` allows Twilio webhooks with invalid signatures **only** when `tunnel.provider="ngrok"` and `serve.bind` is loopback (ngrok local agent). Local dev only.
    - Ngrok free-tier URLs can change or add interstitial behaviour; if `publicUrl` drifts, Twilio signatures fail. Production: prefer a stable domain or a Tailscale funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` closes sockets that never send a valid `start` frame.
    - `streaming.maxPendingConnections` caps total unauthenticated pre-start sockets.
    - `streaming.maxPendingConnectionsPerIp` caps unauthenticated pre-start sockets per source IP.
    - `streaming.maxConnections` caps total open media stream sockets (pending + active).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Older configs using `provider: "log"`, `twilio.from`, or legacy
    `streaming.*` OpenAI keys are rewritten by `openclaw doctor --fix`.
    Runtime fallback still accepts the old voice-call keys for now, but
    the rewrite path is `openclaw doctor --fix` and the compat shim is
    temporary.

    Auto-migrated streaming keys:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Session scope

By default, Voice Call uses `sessionScope: "per-phone"` so repeat calls from
the same caller keep conversation memory. Set `sessionScope: "per-call"` when
each carrier call should start with fresh context, for example reception,
booking, IVR, or Google Meet bridge flows where the same phone number may
represent different meetings.

## Realtime voice conversations

`realtime` selects a full-duplex realtime voice provider for live call
audio. It is separate from `streaming`, which only forwards audio to
realtime transcription providers.

<Warning>
`realtime.enabled` cannot be combined with `streaming.enabled`. Pick one
audio mode per call.
</Warning>

Current runtime behaviour:

- `realtime.enabled` is supported for Twilio Media Streams.
- `realtime.provider` is optional. If unset, Voice Call uses the first registered realtime voice provider.
- Bundled realtime voice providers: Google Gemini Live (`google`) and OpenAI (`openai`), registered by their provider plugins.
- Provider-owned raw config lives under `realtime.providers.<providerId>`.
- Voice Call exposes the shared `openclaw_agent_consult` realtime tool by default. The realtime model can call it when the caller asks for deeper reasoning, current information, or normal OpenClaw tools.
- `realtime.fastContext.enabled` is default-off. When enabled, Voice Call first searches indexed memory/session context for the consult question and returns those snippets to the realtime model within `realtime.fastContext.timeoutMs` before falling back to the full consult agent only if `realtime.fastContext.fallbackToConsult` is true.
- If `realtime.provider` points at an unregistered provider, or no realtime voice provider is registered at all, Voice Call logs a warning and skips realtime media instead of failing the whole plugin.
- Consult session keys reuse the stored call session when available, then fall back to the configured `sessionScope` (`per-phone` by default, or `per-call` for isolated calls).

### Tool policy

`realtime.toolPolicy` controls the consult run:

| Policy           | Behavior                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose the consult tool and limit the regular agent to `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, and `memory_get`. |
| `owner`          | Expose the consult tool and let the regular agent use the normal agent tool policy.                                                      |
| `none`           | Do not expose the consult tool. Custom `realtime.tools` are still passed through to the realtime provider.                               |

### Realtime provider examples

<Tabs>
  <Tab title="Google Gemini Live">
    Defaults: API key from `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; voice `Kore`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

See [Google provider](/pl/providers/google) and
[OpenAI provider](/pl/providers/openai) for provider-specific realtime voice
options.

## Streaming transcription

`streaming` selects a realtime transcription provider for live call audio.

Current runtime behavior:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji w czasie rzeczywistym.
- Dołączone dostawcy transkrypcji w czasie rzeczywistym: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI (`xai`), rejestrowani przez swoje Pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Gdy Twilio wyśle zaakceptowany komunikat `start` strumienia, Voice Call natychmiast rejestruje strumień, kolejkowuje przychodzące media przez dostawcę transkrypcji podczas łączenia dostawcy i uruchamia początkowe powitanie dopiero wtedy, gdy transkrypcja w czasie rzeczywistym jest gotowa.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę albo żaden dostawca nie jest zarejestrowany, Voice Call zapisuje ostrzeżenie w logu i pomija strumieniowanie multimediów zamiast powodować awarię całego Pluginu.

### Przykłady dostawców strumieniowania

<Tabs>
  <Tab title="OpenAI">
    Wartości domyślne: klucz API `streaming.providers.openai.apiKey` lub
    `OPENAI_API_KEY`; model `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

  </Tab>
  <Tab title="xAI">
    Wartości domyślne: klucz API `streaming.providers.xai.apiKey` lub `XAI_API_KEY`;
    punkt końcowy `wss://api.x.ai/v1/stt`; kodowanie `mulaw`; częstotliwość próbkowania `8000`;
    `endpointingMs: 800`; `interimResults: true`.

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
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

  </Tab>
</Tabs>

## TTS dla połączeń

Voice Call używa podstawowej konfiguracji `messages.tts` do strumieniowania
mowy w połączeniach. Możesz nadpisać ją w konfiguracji Pluginu przy użyciu
**tego samego kształtu** — jest ona głęboko scalana z `messages.tts`.

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

<Warning>
**Microsoft speech jest ignorowane dla połączeń głosowych.** Audio telefoniczne wymaga PCM;
obecny transport Microsoft nie udostępnia wyjścia telefonicznego PCM.
</Warning>

Uwagi dotyczące zachowania:

- Starsze klucze `tts.<provider>` w konfiguracji Pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- Podstawowe TTS jest używane, gdy strumieniowanie multimediów Twilio jest włączone; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień multimediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli telefoniczne TTS jest w tym stanie niedostępne, żądanie odtwarzania kończy się niepowodzeniem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczne TTS wraca do dostawcy zapasowego, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) na potrzeby debugowania.
- Gdy barge-in Twilio lub zamknięcie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania zostają rozstrzygnięte zamiast zawieszać dzwoniących oczekujących na ukończenie odtwarzania.

### Przykłady TTS

<Tabs>
  <Tab title="Core TTS only">
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
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
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
  </Tab>
  <Tab title="OpenAI model override (deep-merge)">
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
  </Tab>
</Tabs>

## Połączenia przychodzące

Polityka połączeń przychodzących ma domyślną wartość `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` to niskopewnościowy filtr identyfikatora dzwoniącego. Plugin
normalizuje dostarczoną przez dostawcę wartość `From` i porównuje ją z
`allowFrom`. Weryfikacja Webhook uwierzytelnia dostarczenie przez dostawcę i
integralność ładunku, ale **nie** dowodzi własności numeru dzwoniącego
PSTN/VoIP. Traktuj `allowFrom` jako filtrowanie identyfikatora dzwoniącego, a nie silną
tożsamość dzwoniącego.
</Warning>

Automatyczne odpowiedzi używają systemu agenta. Dostrój je za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Routing według numeru

Użyj `numbers`, gdy jeden Plugin Voice Call odbiera połączenia dla wielu numerów telefonu
i każdy numer powinien zachowywać się jak inna linia. Na przykład jeden
numer może używać swobodnego osobistego asystenta, a inny osobowości biznesowej,
innego agenta odpowiedzi i innego głosu TTS.

Trasy są wybierane na podstawie dostarczonego przez dostawcę wybranego numeru `To`. Klucze muszą być
numerami E.164. Gdy połączenie przychodzi, Voice Call raz rozwiązuje pasującą trasę,
zapisuje dopasowaną trasę w rekordzie połączenia i ponownie używa tej efektywnej konfiguracji
dla powitania, klasycznej ścieżki automatycznej odpowiedzi, ścieżki konsultacji w czasie rzeczywistym i odtwarzania
TTS. Jeśli żadna trasa nie pasuje, używana jest globalna konfiguracja Voice Call.
Połączenia wychodzące nie używają `numbers`; podczas inicjowania połączenia przekaż jawnie cel wychodzący, wiadomość i
sesję.

Nadpisania tras obsługują obecnie:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Wartość trasy `tts` jest głęboko scalana z globalną konfiguracją `tts` Voice Call, więc
zwykle możesz nadpisać tylko głos dostawcy:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Kontrakt wypowiedzi mówionej

W przypadku automatycznych odpowiedzi Voice Call dołącza ścisły kontrakt wypowiedzi mówionej do
promptu systemowego:

```text
{"spoken":"..."}
```

Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w bloku kodu lub wbudowane klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wstępne planowania/metadanych.

Dzięki temu odtwarzanie mowy pozostaje skupione na tekście skierowanym do dzwoniącego i unika
przeciekania tekstu planowania do audio.

### Zachowanie uruchamiania rozmowy

W przypadku wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania
na żywo:

- Czyszczenie kolejki barge-in i automatyczna odpowiedź są tłumione tylko wtedy, gdy początkowe powitanie jest aktywnie wypowiadane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla strumieniowania Twilio zaczyna się po połączeniu strumienia bez dodatkowego opóźnienia.
- Barge-in przerywa aktywne odtwarzanie i czyści zakolejkowane, ale jeszcze nieodtwarzane wpisy TTS Twilio. Wyczyszczone wpisy są rozstrzygane jako pominięte, więc logika kolejnej odpowiedzi może kontynuować bez czekania na audio, które nigdy nie zostanie odtworzone.
- Rozmowy głosowe w czasie rzeczywistym używają własnej początkowej tury strumienia w czasie rzeczywistym. Voice Call **nie** wysyła starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, więc wychodzące sesje `<Connect><Stream>` pozostają podłączone.

### Okres karencji rozłączenia strumienia Twilio

Gdy strumień multimediów Twilio się rozłączy, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostanie anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostanie zakończone, aby zapobiec zablokowanym aktywnym połączeniom.

## Zbieracz nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego
Webhook (na przykład połączenia w trybie powiadamiania, które nigdy się nie kończą). Wartość domyślna
to `0` (wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów typu powiadomień.
- Zachowaj tę wartość **wyższą niż `maxDurationSeconds`**, aby zwykłe połączenia mogły się zakończyć. Dobrym punktem wyjścia jest `maxDurationSeconds + 30–60` sekund.

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

## Bezpieczeństwo Webhook

Gdy proxy lub tunel znajduje się przed Gateway, Plugin
rekonstruuje publiczny URL do weryfikacji podpisu. Te opcje
kontrolują, którym nagłówkom przekazywanym można ufać:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista dozwolonych hostów z nagłówków przekazywania.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Ufaj przekazywanym nagłówkom bez listy dozwolonych.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Ufaj przekazywanym nagłówkom tylko wtedy, gdy zdalny adres IP żądania pasuje do listy.
</ParamField>

Dodatkowe zabezpieczenia:

- **Ochrona przed powtórzeniem** Webhook jest włączona dla Twilio i Plivo. Powtórzone prawidłowe żądania Webhook są potwierdzane, ale pomijane pod kątem skutków ubocznych.
- Tury rozmowy Twilio zawierają token dla każdej tury w wywołaniach zwrotnych `<Gather>`, więc nieaktualne/powtórzone wywołania zwrotne mowy nie mogą spełnić nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania Webhook są odrzucane przed odczytem treści, gdy brakuje wymaganych przez dostawcę nagłówków podpisu.
- Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund) oraz limitu równoczesnych żądań na adres IP przed weryfikacją podpisu.

Przykład ze stabilnym hostem publicznym:

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

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Gdy Gateway już działa, operacyjne polecenia `voicecall` delegują
do należącego do Gateway środowiska uruchomieniowego voice-call, aby CLI nie wiązało drugiego
serwera Webhook. Jeśli żaden Gateway nie jest osiągalny, polecenia wracają do
samodzielnego środowiska uruchomieniowego CLI.

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania połączeń głosowych.
Użyj `--file <path>`, aby wskazać inny dziennik, oraz `--last <n>`, aby ograniczyć
analizę do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują p50/p90/p99
dla opóźnienia tury i czasów oczekiwania na nasłuch.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`.

| Akcja           | Argumenty                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

To repozytorium zawiera pasujący dokument skill pod adresem `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metoda               | Argumenty                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` jest prawidłowe tylko z `mode: "conversation"`. Połączenia w trybie powiadomień
powinny używać `voicecall.dtmf` po utworzeniu połączenia, jeśli potrzebują cyfr po połączeniu.

## Rozwiązywanie problemów

### Konfiguracja nie przechodzi sprawdzenia ekspozycji Webhook

Uruchom konfigurację z tego samego środowiska, w którym działa Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Dla `twilio`, `telnyx` i `plivo` `webhook-exposure` musi być zielone. Skonfigurowany
`publicUrl` nadal kończy się niepowodzeniem, gdy wskazuje lokalną lub prywatną
przestrzeń sieciową, ponieważ operator nie może wywołać zwrotnie tych adresów. Nie używaj
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

Połączenia wychodzące Twilio w trybie powiadomień wysyłają początkowy TwiML `<Say>` bezpośrednio w
żądaniu utworzenia połączenia, więc pierwsza wypowiadana wiadomość nie zależy od pobrania przez Twilio
TwiML Webhook. Publiczny Webhook jest nadal wymagany dla wywołań zwrotnych statusu,
połączeń konwersacyjnych, DTMF przed połączeniem, strumieni czasu rzeczywistego i sterowania połączeniem
po połączeniu.

Użyj jednej publicznej ścieżki ekspozycji:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Po zmianie konfiguracji uruchom ponownie albo przeładuj Gateway, a następnie uruchom:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` jest próbą bez skutków ubocznych, chyba że przekażesz `--yes`.

### Poświadczenia dostawcy kończą się niepowodzeniem

Sprawdź wybranego dostawcę i wymagane pola poświadczeń:

- Twilio: `twilio.accountSid`, `twilio.authToken` i `fromNumber` albo
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` i `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` i
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` i `fromNumber`.

Poświadczenia muszą istnieć na hoście Gateway. Edycja lokalnego profilu powłoki nie
wpływa na już działający Gateway, dopóki nie uruchomi się ponownie albo nie przeładuje
swojego środowiska.

### Połączenia się rozpoczynają, ale Webhook dostawcy nie docierają

Potwierdź, że konsola dostawcy wskazuje dokładny publiczny adres URL Webhook:

```text
https://voice.example.com/voice/webhook
```

Następnie sprawdź stan środowiska uruchomieniowego:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Częste przyczyny:

- `publicUrl` wskazuje inną ścieżkę niż `serve.path`.
- Adres URL tunelu zmienił się po uruchomieniu Gateway.
- Serwer proxy przekazuje żądanie, ale usuwa lub przepisuje nagłówki host/proto.
- Zapora sieciowa lub DNS kieruje publiczną nazwę hosta gdzie indziej niż do Gateway.
- Gateway został uruchomiony ponownie bez włączonego pluginu Voice Call.

Gdy przed Gateway znajduje się odwrotny serwer proxy albo tunel, ustaw
`webhookSecurity.allowedHosts` na publiczną nazwę hosta albo użyj
`webhookSecurity.trustedProxyIPs` dla znanego adresu proxy. Używaj
`webhookSecurity.trustForwardingHeaders` tylko wtedy, gdy granica proxy jest pod
Twoją kontrolą.

### Weryfikacja podpisu kończy się niepowodzeniem

Podpisy dostawcy są sprawdzane względem publicznego adresu URL, który OpenClaw odtwarza
z przychodzącego żądania. Jeśli podpisy zawodzą:

- Potwierdź, że adres URL Webhook dostawcy dokładnie pasuje do `publicUrl`, w tym
  schemat, host i ścieżka.
- W przypadku adresów URL ngrok w warstwie bezpłatnej aktualizuj `publicUrl`, gdy zmienia się nazwa hosta tunelu.
- Upewnij się, że proxy zachowuje oryginalne nagłówki hosta i protokołu, albo skonfiguruj
  `webhookSecurity.allowedHosts`.
- Nie włączaj `skipSignatureVerification` poza testami lokalnymi.

### Dołączenia Google Meet przez Twilio kończą się niepowodzeniem

Google Meet używa tego pluginu do dołączeń przez połączenie telefoniczne Twilio. Najpierw zweryfikuj Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Następnie jawnie zweryfikuj transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Jeśli Voice Call jest zielony, ale uczestnik Meet nigdy nie dołącza, sprawdź numer
telefoniczny Meet, PIN i `--dtmf-sequence`. Połączenie telefoniczne może być sprawne, mimo że
spotkanie odrzuca lub ignoruje nieprawidłową sekwencję DTMF.

Google Meet przekazuje sekwencję DTMF Meet i tekst wprowadzenia do `voicecall.start`.
W przypadku połączeń Twilio Voice Call najpierw serwuje TwiML DTMF, przekierowuje z powrotem do
Webhook, a następnie otwiera strumień multimediów czasu rzeczywistego, więc zapisane wprowadzenie jest generowane
po dołączeniu uczestnika telefonicznego do spotkania.

Użyj `openclaw logs --follow` dla śledzenia fazy na żywo. Poprawne dołączenie Twilio Meet
rejestruje tę kolejność:

- Google Meet deleguje dołączenie Twilio do Voice Call.
- Voice Call zapisuje TwiML DTMF przed połączeniem.
- Początkowy TwiML Twilio zostaje zużyty i zaserwowany przed obsługą czasu rzeczywistego.
- Voice Call serwuje TwiML czasu rzeczywistego dla połączenia Twilio.
- Most czasu rzeczywistego startuje z początkowym powitaniem w kolejce.

`openclaw voicecall tail` nadal pokazuje utrwalone rekordy połączeń; jest przydatne do
stanu połączenia i transkrypcji, ale nie każde przejście Webhook/czasu rzeczywistego pojawia się
tam.

### Połączenie czasu rzeczywistego nie ma mowy

Potwierdź, że włączony jest tylko jeden tryb audio. `realtime.enabled` i
`streaming.enabled` nie mogą oba mieć wartości true.

W przypadku połączeń Twilio czasu rzeczywistego zweryfikuj także:

- Plugin dostawcy czasu rzeczywistego jest załadowany i zarejestrowany.
- `realtime.provider` jest nieustawione albo wskazuje zarejestrowanego dostawcę.
- Klucz API dostawcy jest dostępny dla procesu Gateway.
- `openclaw logs --follow` pokazuje zaserwowany TwiML czasu rzeczywistego, uruchomiony most czasu rzeczywistego
  i początkowe powitanie dodane do kolejki.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Wybudzanie głosem](/pl/nodes/voicewake)
