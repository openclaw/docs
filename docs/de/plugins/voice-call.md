---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf über OpenClaw tätigen
    - Sie konfigurieren oder entwickeln das Sprachanruf-Plugin
    - Sie benötigen Echtzeit-Sprache oder Streaming-Transkription für Telefonie
sidebarTitle: Voice call
summary: Tätigen Sie ausgehende Sprachanrufe und nehmen Sie eingehende Sprachanrufe über Twilio, Telnyx oder Plivo entgegen, mit optionaler Echtzeit-Sprachfunktion und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-05-01T06:44:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60ee0997676d6bb800184197b7bbb2ccde40ec30d9487c58e7b5b95b0762a6d0
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

    If npm reports the OpenClaw-owned package as deprecated, that package version
    is from an older external package train; use a current packaged OpenClaw
    build or the local folder path until a newer npm package is published.

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
Voice-call credentials accept SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, and `plugins.entries.voice-call.config.tts.providers.*.apiKey` resolve through the standard SecretRef surface; see [SecretRef credential surface](/de/reference/secretref-credential-surface).
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
- If `realtime.provider` points at an unregistered provider, or no realtime voice provider is registered at all, Voice Call logs a warning and skips realtime media instead of failing the whole plugin.
- Consult session keys reuse the existing voice session when available, then fall back to the caller/callee phone number so follow-up consult calls keep context during the call.

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

See [Google provider](/de/providers/google) and
[OpenAI provider](/de/providers/openai) for provider-specific realtime voice
options.

## Streaming transcription

`streaming` selects a realtime transcription provider for live call audio.

Current runtime behavior:

- `streaming.provider` is optional. If unset, Voice Call uses the first registered realtime transcription provider.
- Bundled realtime transcription providers: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), and xAI (`xai`), registered by their provider plugins.
- Provider-owned raw config lives under `streaming.providers.<providerId>`.
- After Twilio sends an accepted stream `start` message, Voice Call registers the stream immediately, queues inbound media through the transcription provider while the provider connects, and starts the initial greeting only after realtime transcription is ready.
- If `streaming.provider` points at an unregistered provider, or none is registered, Voice Call logs a warning and skips media streaming instead of failing the whole plugin.

### Streaming provider examples

<Tabs>
  <Tab title="OpenAI">
    Defaults: API key `streaming.providers.openai.apiKey` or
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
    Standardwerte: API-Schlüssel `streaming.providers.xai.apiKey` oder `XAI_API_KEY`;
    Endpunkt `wss://api.x.ai/v1/stt`; Kodierung `mulaw`; Abtastrate `8000`;
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

## TTS für Anrufe

Voice Call verwendet die zentrale Konfiguration `messages.tts` für Streaming-Sprache bei Anrufen. Sie können sie in der Plugin-Konfiguration mit **derselben Struktur** überschreiben — sie wird per Deep-Merge mit `messages.tts` zusammengeführt.

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
**Microsoft Speech wird für Sprachanrufe ignoriert.** Telefonie-Audio benötigt PCM;
der aktuelle Microsoft-Transport stellt keine Telefonie-PCM-Ausgabe bereit.
</Warning>

Hinweise zum Verhalten:

- Legacy-Schlüssel `tts.<provider>` innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` repariert; eingecheckte Konfiguration sollte `tts.providers.<provider>` verwenden.
- Zentrales TTS wird verwendet, wenn Twilio Media Streaming aktiviert ist; andernfalls fallen Anrufe auf provider-native Stimmen zurück.
- Wenn bereits ein Twilio-Medienstream aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call zur Fehlersuche eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn Twilio Barge-in oder der Stream-Abbau die ausstehende TTS-Warteschlange leert, werden eingereihte Wiedergabeanforderungen abgeschlossen, statt Anrufer beim Warten auf den Abschluss der Wiedergabe hängen zu lassen.

### TTS-Beispiele

<Tabs>
  <Tab title="Nur zentrales TTS">
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
  <Tab title="Auf ElevenLabs überschreiben (nur Anrufe)">
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
  <Tab title="OpenAI-Modell überschreiben (Deep-Merge)">
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

## Eingehende Anrufe

Die Eingangsrichtlinie ist standardmäßig `disabled`. Um eingehende Anrufe zu aktivieren, setzen Sie:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` ist eine Caller-ID-Prüfung mit niedriger Sicherheit. Das
Plugin normalisiert den vom Provider bereitgestellten Wert `From` und vergleicht ihn mit
`allowFrom`. Die Webhook-Verifizierung authentifiziert die Provider-Zustellung und
die Payload-Integrität, beweist aber **nicht** den Besitz der PSTN-/VoIP-Rufnummer
des Anrufers. Behandeln Sie `allowFrom` als Caller-ID-Filterung, nicht als starke
Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agent-System. Stimmen Sie sie mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs` ab.

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für gesprochene Ausgabe an
den System-Prompt an:

```text
{"spoken":"..."}
```

Voice Call extrahiert Sprachtext defensiv:

- Ignoriert Payloads, die als Reasoning-/Fehlerinhalte markiert sind.
- Parst direktes JSON, eingezäuntes JSON oder Inline-`"spoken"`-Schlüssel.
- Fällt auf Klartext zurück und entfernt wahrscheinliche Planungs-/Meta-Einleitungsabsätze.

Dadurch bleibt die gesprochene Wiedergabe auf anruferbezogenen Text fokussiert und es wird vermieden,
dass Planungstext in Audio durchsickert.

### Verhalten beim Gesprächsstart

Bei ausgehenden `conversation`-Anrufen ist die Behandlung der ersten Nachricht an den Live-Wiedergabestatus gebunden:

- Das Leeren der Barge-in-Warteschlange und automatische Antworten werden nur unterdrückt, während die erste Begrüßung aktiv gesprochen wird.
- Wenn die erste Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die erste Nachricht bleibt für einen erneuten Versuch eingereiht.
- Die erste Wiedergabe für Twilio-Streaming startet beim Stream-Verbindungsaufbau ohne zusätzliche Verzögerung.
- Barge-in bricht aktive Wiedergabe ab und leert eingereihte, aber noch nicht abgespielte Twilio-TTS-Einträge. Geleerte Einträge werden als übersprungen aufgelöst, sodass die Logik für Folgeantworten fortfahren kann, ohne auf Audio zu warten, das nie abgespielt wird.
- Realtime-Sprachkonversationen verwenden den eigenen Eröffnungs-Turn des Realtime-Streams. Voice Call sendet für diese erste Nachricht **kein** Legacy-`<Say>`-TwiML-Update, sodass ausgehende `<Connect><Stream>`-Sitzungen verbunden bleiben.

### Karenzzeit bei Twilio-Stream-Trennung

Wenn ein Twilio-Medienstream getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn der Stream in diesem Zeitfenster erneut verbunden wird, wird das automatische Beenden abgebrochen.
- Wenn nach der Karenzzeit kein Stream erneut registriert wird, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## Reaper für veraltete Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die nie einen terminalen
Webhook erhalten (zum Beispiel Notify-Mode-Anrufe, die nie abgeschlossen werden). Der Standardwert
ist `0` (deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Notify-artige Abläufe.
- Halten Sie diesen Wert **höher als `maxDurationSeconds`**, damit normale Anrufe abgeschlossen werden können. Ein guter Ausgangspunkt ist `maxDurationSeconds + 30–60` Sekunden.

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

## Webhook-Sicherheit

Wenn ein Proxy oder Tunnel vor dem Gateway steht, rekonstruiert das Plugin
die öffentliche URL für die Signaturverifizierung. Diese Optionen steuern,
welchen weitergeleiteten Headern vertraut wird:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Allowlist-Hosts aus Weiterleitungs-Headern.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Weitergeleiteten Headern ohne Allowlist vertrauen.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Weitergeleiteten Headern nur vertrauen, wenn die Remote-IP der Anfrage mit der Liste übereinstimmt.
</ParamField>

Zusätzliche Schutzmaßnahmen:

- Webhook-**Replay-Schutz** ist für Twilio und Plivo aktiviert. Erneut gesendete gültige Webhook-Anfragen werden bestätigt, aber für Seiteneffekte übersprungen.
- Twilio-Konversations-Turns enthalten ein Token pro Turn in `<Gather>`-Callbacks, sodass veraltete/erneut gesendete Sprach-Callbacks keinen neueren ausstehenden Transkript-Turn erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die erforderlichen Signatur-Header des Providers fehlen.
- Der Voice-Call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden) plus eine In-Flight-Begrenzung pro IP vor der Signaturverifizierung.

Beispiel mit einem stabilen öffentlichen Host:

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

Wenn das Gateway bereits läuft, delegieren operative `voicecall`-Befehle
an die vom Gateway verwaltete Voice-Call-Runtime, damit die CLI keinen zweiten
Webhook-Server bindet. Wenn kein Gateway erreichbar ist, fallen die Befehle auf eine
eigenständige CLI-Runtime zurück.

`latency` liest `calls.jsonl` aus dem standardmäßigen Voice-Call-Speicherpfad.
Verwenden Sie `--file <path>`, um auf ein anderes Log zu zeigen, und `--last <n>`, um
die Analyse auf die letzten N Datensätze zu begrenzen (Standard 200). Die Ausgabe enthält p50/p90/p99
für Turn-Latenz und Listen-Wait-Zeiten.

## Agent-Tool

Tool-Name: `voice_call`.

| Aktion          | Argumente                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Dieses Repository liefert eine passende Skill-Dokumentation unter `skills/voice-call/SKILL.md` mit.

## Gateway-RPC

| Methode              | Argumente                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ist nur mit `mode: "conversation"` gültig. Notify-Mode-Anrufe
sollten nach Bestehen des Anrufs `voicecall.dtmf` verwenden, wenn sie nach dem Verbindungsaufbau
Ziffern benötigen.

## Fehlerbehebung

### Setup schlägt bei Webhook-Freigabe fehl

Führen Sie das Setup aus derselben Umgebung aus, in der das Gateway läuft:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Für `twilio`, `telnyx` und `plivo` muss `webhook-exposure` grün sein. Eine
konfigurierte `publicUrl` schlägt dennoch fehl, wenn sie auf lokalen oder privaten Netzwerkraum
zeigt, weil der Carrier diese Adressen nicht zurückrufen kann. Verwenden Sie
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` nicht als `publicUrl`.

Verwenden Sie einen öffentlichen Freigabepfad:

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

Starten oder laden Sie das Gateway nach einer Konfigurationsänderung neu und führen Sie dann aus:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ist ein Probelauf, sofern Sie nicht `--yes` übergeben.

### Provider-Anmeldedaten schlagen fehl

Prüfen Sie den ausgewählten Provider und die erforderlichen Felder für Anmeldedaten:

- Twilio: `twilio.accountSid`, `twilio.authToken` und `fromNumber` oder
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` und `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` und
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` und `fromNumber`.

Die Anmeldedaten müssen auf dem Gateway-Host vorhanden sein. Das Bearbeiten eines lokalen Shell-Profils
wirkt sich erst auf ein bereits laufendes Gateway aus, wenn es neu gestartet wird oder seine
Umgebung neu lädt.

### Anrufe starten, aber Provider-Webhooks kommen nicht an

Bestätigen Sie, dass die Provider-Konsole auf die exakt öffentliche Webhook-URL verweist:

```text
https://voice.example.com/voice/webhook
```

Prüfen Sie anschließend den Laufzeitstatus:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
```

Häufige Ursachen:

- `publicUrl` verweist auf einen anderen Pfad als `serve.path`.
- Die Tunnel-URL hat sich geändert, nachdem das Gateway gestartet wurde.
- Ein Proxy leitet die Anfrage weiter, entfernt oder überschreibt aber Host-/Proto-Header.
- Firewall oder DNS leitet den öffentlichen Hostnamen an eine andere Stelle als das Gateway weiter.
- Das Gateway wurde ohne aktiviertes Voice-Call-Plugin neu gestartet.

Wenn ein Reverse-Proxy oder Tunnel vor dem Gateway steht, setzen Sie
`webhookSecurity.allowedHosts` auf den öffentlichen Hostnamen oder verwenden Sie
`webhookSecurity.trustedProxyIPs` für eine bekannte Proxy-Adresse. Verwenden Sie
`webhookSecurity.trustForwardingHeaders` nur, wenn die Proxy-Grenze unter Ihrer
Kontrolle steht.

### Signaturprüfung schlägt fehl

Provider-Signaturen werden gegen die öffentliche URL geprüft, die OpenClaw aus
der eingehenden Anfrage rekonstruiert. Wenn Signaturen fehlschlagen:

- Bestätigen Sie, dass die Provider-Webhook-URL exakt mit `publicUrl` übereinstimmt, einschließlich
  Schema, Host und Pfad.
- Aktualisieren Sie bei kostenlosen ngrok-URLs `publicUrl`, wenn sich der Tunnel-Hostname ändert.
- Stellen Sie sicher, dass der Proxy die ursprünglichen Host- und Proto-Header beibehält, oder konfigurieren Sie
  `webhookSecurity.allowedHosts`.
- Aktivieren Sie `skipSignatureVerification` nicht außerhalb lokaler Tests.

### Google Meet Twilio-Beitritte schlagen fehl

Google Meet verwendet dieses Plugin für Twilio-Einwahlbeitritte. Prüfen Sie zuerst Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Prüfen Sie anschließend den Google Meet-Transport explizit:

```bash
openclaw googlemeet setup --transport twilio
```

Wenn Voice Call grün ist, der Meet-Teilnehmer aber nie beitritt, prüfen Sie die Meet-
Einwahlnummer, PIN und `--dtmf-sequence`. Der Telefonanruf kann fehlerfrei sein, während
die Besprechung eine falsche DTMF-Sequenz ablehnt oder ignoriert.

Google Meet übergibt die Meet-DTMF-Sequenz und den Einführungstext an `voicecall.start`.
Bei Twilio-Anrufen stellt Voice Call zuerst das DTMF-TwiML bereit, leitet zurück zum
Webhook weiter und öffnet anschließend den Echtzeit-Medienstream, sodass die gespeicherte Einführung generiert wird,
nachdem der Telefonteilnehmer der Besprechung beigetreten ist.

### Echtzeit-Anruf hat keine Sprachausgabe

Bestätigen Sie, dass nur ein Audiomodus aktiviert ist. `realtime.enabled` und
`streaming.enabled` können nicht beide `true` sein.

Prüfen Sie bei Echtzeit-Twilio-Anrufen außerdem:

- Ein Echtzeit-Provider-Plugin ist geladen und registriert.
- `realtime.provider` ist nicht gesetzt oder benennt einen registrierten Provider.
- Der Provider-API-Schlüssel ist für den Gateway-Prozess verfügbar.
- `openclaw voicecall tail` zeigt, dass der Medienstream akzeptiert wurde und der Echtzeit-
  Provider bereit ist, bevor die erste Begrüßung erfolgt.

## Verwandte Themen

- [Sprechmodus](/de/nodes/talk)
- [Text-to-Speech](/de/tools/tts)
- [Sprachaktivierung](/de/nodes/voicewake)
