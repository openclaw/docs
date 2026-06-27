---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf von OpenClaw tätigen
    - Sie konfigurieren oder entwickeln das Voice-Call-Plugin
    - Sie benötigen Echtzeit-Sprache oder Streaming-Transkription für Telefonie
sidebarTitle: Voice call
summary: Ausgehende Sprachanrufe tätigen und eingehende Sprachanrufe über Twilio, Telnyx oder Plivo annehmen, mit optionaler Echtzeit-Sprache und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-06-27T18:01:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen,
mehrstufige Konversationen, Full-Duplex-Echtzeit-Sprache, Streaming-
Transkription und eingehende Anrufe mit Allowlist-Richtlinien.

**Aktuelle Provider:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML-Weiterleitung + GetInput
speech), `mock` (Entwicklung/kein Netzwerk).

<Note>
Das Voice Call-Plugin läuft **innerhalb des Gateway-Prozesses**. Wenn Sie ein
Remote-Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem
Computer, auf dem der Gateway läuft, und starten Sie den Gateway anschließend neu,
damit es geladen wird.
</Note>

## Schnellstart

<Steps>
  <Step title="Plugin installieren">
    <Tabs>
      <Tab title="Von npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Aus einem lokalen Ordner (Entwicklung)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Verwenden Sie das unveränderte Paket, um dem aktuellen offiziellen Release-Tag
    zu folgen. Pinnen Sie eine exakte Version nur, wenn Sie eine reproduzierbare
    Installation benötigen.

    Starten Sie anschließend den Gateway neu, damit das Plugin geladen wird.

  </Step>
  <Step title="Provider und Webhook konfigurieren">
    Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest
    (die vollständige Struktur finden Sie unten unter
    [Konfiguration](#configuration)). Mindestens erforderlich sind:
    `provider`, Provider-Anmeldedaten, `fromNumber` und eine öffentlich
    erreichbare Webhook-URL.
  </Step>
  <Step title="Einrichtung prüfen">
    ```bash
    openclaw voicecall setup
    ```

    Die Standardausgabe ist in Chatprotokollen und Terminals lesbar. Sie prüft,
    ob das Plugin aktiviert ist, Provider-Anmeldedaten vorhanden sind, der
    Webhook erreichbar ist und nur ein Audiomodus (`streaming` oder `realtime`)
    aktiv ist. Verwenden Sie `--json` für Skripte.

  </Step>
  <Step title="Smoke-Test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide Befehle sind standardmäßig Testläufe ohne Ausführung. Fügen Sie `--yes`
    hinzu, um tatsächlich einen kurzen ausgehenden Benachrichtigungsanruf zu
    platzieren:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss die Einrichtung zu einer **öffentlichen Webhook-URL**
auflösen. Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder der
Serve-Fallback zu Loopback oder privatem Netzwerkbereich auflöst, schlägt die
Einrichtung fehl, statt einen Provider zu starten, der keine Carrier-Webhooks
empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true` gesetzt ist, dem ausgewählten Provider aber Anmeldedaten
fehlen, protokolliert der Gateway beim Start eine Warnung über eine unvollständige
Einrichtung mit den fehlenden Schlüsseln und überspringt den Start der Runtime.
Befehle, RPC-Aufrufe und Agent-Tools geben bei Verwendung weiterhin die exakte
fehlende Provider-Konfiguration zurück.

<Note>
Voice-call-Anmeldedaten akzeptieren SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` und `plugins.entries.voice-call.config.tts.providers.*.apiKey` werden über die standardmäßige SecretRef-Oberfläche aufgelöst; siehe [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface).
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
                  openai: { speakerVoice: "alloy" },
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
  <Accordion title="Provider-Exposition und Sicherheitshinweise">
    - Twilio, Telnyx und Plivo benötigen alle eine **öffentlich erreichbare** Webhook-URL.
    - `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
    - Telnyx benötigt `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht true ist.
    - `skipSignatureVerification` ist nur für lokale Tests vorgesehen.
    - Legen Sie im kostenlosen ngrok-Tarif `publicUrl` auf die exakte ngrok-URL fest; die Signaturprüfung wird immer erzwungen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` ist und `serve.bind` Loopback ist (lokaler ngrok-Agent). Nur für lokale Entwicklung.
    - URLs im kostenlosen ngrok-Tarif können sich ändern oder Zwischenseiten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Produktion: Bevorzugen Sie eine stabile Domain oder einen Tailscale-Funnel.

  </Accordion>
  <Accordion title="Limits für Streaming-Verbindungen">
    - `streaming.preStartTimeoutMs` schließt Sockets, die nie einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Pre-Start-Sockets.
    - `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Pre-Start-Sockets pro Quell-IP.
    - `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).

  </Accordion>
  <Accordion title="Migrationen für Legacy-Konfigurationen">
    Ältere Konfigurationen mit `provider: "log"`, `twilio.from` oder Legacy-
    `streaming.*`-OpenAI-Schlüsseln werden von `openclaw doctor --fix`
    umgeschrieben. Der Runtime-Fallback akzeptiert die alten voice-call-Schlüssel
    vorerst weiterhin, aber der Umschreibepfad ist `openclaw doctor --fix` und
    der Kompatibilitäts-Shim ist temporär.

    Automatisch migrierte Streaming-Schlüssel:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Sitzungsbereich

Standardmäßig verwendet Voice Call `sessionScope: "per-phone"`, sodass
wiederholte Anrufe desselben Anrufers den Konversationsspeicher beibehalten.
Setzen Sie `sessionScope: "per-call"`, wenn jeder Carrier-Anruf mit frischem
Kontext beginnen soll, zum Beispiel für Empfang, Buchung, IVR oder Google
Meet-Bridge-Flows, bei denen dieselbe Telefonnummer verschiedene Meetings
repräsentieren kann.

Voice Call speichert generierte Sitzungsschlüssel unter dem konfigurierten
Agent-Namespace (`agent:<agentId>:voice:*`), sodass der Anrufspeicher die
Gateway-Kanonisierung von Sitzungsschlüsseln nach Neustarts übersteht. Rohe
explizite Integrationsschlüssel verwenden denselben Agent-Namespace. Ein
kanonischer Schlüssel `agent:<configuredAgentId>:*` behält diesen Owner bei,
und seine Hauptaliase berücksichtigen core `session.mainKey` und den globalen
Bereich. Fremde oder fehlerhafte `agent:*`-Eingaben werden als opaker Schlüssel
unter dem konfigurierten Agent eingeordnet; `global` und `unknown` bleiben
globale Sentinel-Werte. Beim Start stuft der Gateway ältere rohe Schlüssel in
Standard- oder `{agentId}`-templatisierten Stores hoch, wenn der Pfad einen
Owner belegt. In festen benutzerdefinierten Stores bleiben mehrdeutige
Legacy-Zeilen unverändert, weil sie nicht genügend Informationen enthalten, um
einen Owner auszuwählen; neue Anrufe verwenden kanonischen Agent-bezogenen
Verlauf.

## Echtzeit-Sprachkonversationen

`realtime` wählt einen Full-Duplex-Echtzeit-Sprach-Provider für Live-Anrufaudio
aus. Es ist getrennt von `streaming`, das Audio nur an Echtzeit-
Transkriptions-Provider weiterleitet.

<Warning>
`realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden. Wählen
Sie einen Audiomodus pro Anruf aus.
</Warning>

Aktuelles Runtime-Verhalten:

- `realtime.enabled` wird für Twilio Media Streams unterstützt.
- `realtime.provider` ist optional. Wenn es nicht gesetzt ist, verwendet Voice Call den ersten registrierten Echtzeit-Sprach-Provider.
- Gebündelte Echtzeit-Sprach-Provider: Google Gemini Live (`google`) und OpenAI (`openai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration liegt unter `realtime.providers.<providerId>`.
- Voice Call stellt standardmäßig das gemeinsame Echtzeit-Tool `openclaw_agent_consult` bereit. Das Echtzeitmodell kann es aufrufen, wenn der Anrufer nach tieferer Analyse, aktuellen Informationen oder normalen OpenClaw-Tools fragt.
- `realtime.consultPolicy` fügt optional Hinweise hinzu, wann das Echtzeitmodell `openclaw_agent_consult` aufrufen sollte.
- `realtime.agentContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, injiziert Voice Call beim Sitzungsaufbau eine begrenzte Agent-Identität und eine ausgewählte Workspace-Dateikapsel in die Anweisungen des Echtzeit-Providers.
- `realtime.fastContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, durchsucht Voice Call zuerst indexierten Speicher/Sitzungskontext nach der Consult-Frage und gibt diese Ausschnitte innerhalb von `realtime.fastContext.timeoutMs` an das Echtzeitmodell zurück, bevor nur dann auf den vollständigen Consult-Agent zurückgefallen wird, wenn `realtime.fastContext.fallbackToConsult` true ist.
- Wenn `realtime.provider` auf einen nicht registrierten Provider verweist oder überhaupt kein Echtzeit-Sprach-Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt Echtzeitmedien, statt das gesamte Plugin fehlschlagen zu lassen.
- Consult-Sitzungsschlüssel verwenden die gespeicherte Anrufsitzung erneut, wenn verfügbar, und fallen anschließend auf den konfigurierten `sessionScope` zurück (`per-phone` standardmäßig oder `per-call` für isolierte Anrufe).

### Tool-Richtlinie

`realtime.toolPolicy` steuert den Consult-Lauf:

| Richtlinie      | Verhalten                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stellt das Consult-Tool bereit und beschränkt den regulären Agent auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get`. |
| `owner`         | Stellt das Consult-Tool bereit und lässt den regulären Agent die normale Agent-Tool-Richtlinie verwenden.                                |
| `none`          | Stellt das Consult-Tool nicht bereit. Benutzerdefinierte `realtime.tools` werden weiterhin an den Echtzeit-Provider durchgereicht.       |

`realtime.consultPolicy` steuert nur die Anweisungen des Echtzeitmodells:

| Richtlinie    | Anleitung                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Behält den Standard-Prompt bei und lässt den Provider entscheiden, wann das Consult-Tool aufgerufen wird. |
| `substantive` | Beantwortet einfache konversationelle Überleitungen direkt und consultet vor Fakten, Speicher, Tools oder Kontext. |
| `always`      | Consultet vor jeder inhaltlichen Antwort.                                                       |

### Agent-Sprachkontext

Aktivieren Sie `realtime.agentContext`, wenn die Voice Bridge wie der
konfigurierte OpenClaw-Agent klingen soll, ohne bei gewöhnlichen Turns einen
vollständigen Agent-Consult-Roundtrip zu bezahlen. Die Kontextkapsel wird einmal
hinzugefügt, wenn die Realtime-Sitzung erstellt wird, sodass sie keine Latenz pro
Turn hinzufügt. Aufrufe von `openclaw_agent_consult` führen weiterhin den
vollständigen OpenClaw-Agenten aus und sollten für Tool-Arbeit, aktuelle
Informationen, Speicherabfragen oder Workspace-Zustand verwendet werden.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Beispiele für Realtime-Provider

<Tabs>
  <Tab title="Google Gemini Live">
    Standardwerte: API-Schlüssel aus `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` oder `GOOGLE_GENERATIVE_AI_API_KEY`; Modell
    `gemini-2.5-flash-native-audio-preview-12-2025`; Stimme `Kore`.
    `sessionResumption` und `contextWindowCompression` sind standardmäßig für
    längere, wiederverbindbare Anrufe aktiviert. Verwenden Sie
    `silenceDurationMs`, `startSensitivity` und `endSensitivity`, um schnelleres
    Turn-Taking bei Telefonie-Audio abzustimmen.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

Siehe [Google-Provider](/de/providers/google) und
[OpenAI-Provider](/de/providers/openai) für Provider-spezifische Realtime-Voice-
Optionen.

## Streaming-Transkription

`streaming` wählt einen Realtime-Transkriptions-Provider für Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten registrierten Realtime-Transkriptions-Provider.
- Gebündelte Realtime-Transkriptions-Provider: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration liegt unter `streaming.providers.<providerId>`.
- Nachdem Twilio eine akzeptierte Stream-`start`-Nachricht sendet, registriert Voice Call den Stream sofort, stellt eingehende Medien über den Transkriptions-Provider in die Warteschlange, während der Provider verbindet, und startet die anfängliche Begrüßung erst, wenn die Realtime-Transkription bereit ist.
- Wenn `streaming.provider` auf einen nicht registrierten Provider verweist oder keiner registriert ist, protokolliert Voice Call eine Warnung und überspringt Media-Streaming, statt das gesamte Plugin fehlschlagen zu lassen.

### Beispiele für Streaming-Provider

<Tabs>
  <Tab title="OpenAI">
    Standardwerte: API-Schlüssel `streaming.providers.openai.apiKey` oder
    `OPENAI_API_KEY`; Modell `gpt-4o-transcribe`; `silenceDurationMs: 800`;
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
    Endpunkt `wss://api.x.ai/v1/stt`; Codierung `mulaw`; Abtastrate `8000`;
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

Voice Call verwendet die zentrale `messages.tts`-Konfiguration für Streaming-
Sprache bei Anrufen. Sie können sie unter der Plugin-Konfiguration mit
**derselben Form** überschreiben - sie wird tief mit `messages.tts`
zusammengeführt.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft Speech wird für Sprachanrufe ignoriert.** Telefonie-Audio benötigt
PCM; der aktuelle Microsoft-Transport stellt keine Telefonie-PCM-Ausgabe bereit.
</Warning>

Verhaltenshinweise:

- Legacy-`tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` repariert; eingecheckte Konfiguration sollte `tts.providers.<provider>` verwenden.
- Core-TTS wird verwendet, wenn Twilio-Media-Streaming aktiviert ist; andernfalls fallen Anrufe auf Provider-native Stimmen zurück.
- Wenn ein Twilio-Media-Stream bereits aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call zur Fehlersuche eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn Twilio-Barge-In oder Stream-Abbau die ausstehende TTS-Warteschlange leert, werden eingereihte Wiedergabeanforderungen abgeschlossen, statt Anrufer beim Warten auf den Abschluss der Wiedergabe hängen zu lassen.

### TTS-Beispiele

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
                speakerVoice: "marin",
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

Die Richtlinie für eingehende Anrufe ist standardmäßig `disabled`. Um
eingehende Anrufe zu aktivieren, setzen Sie:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` ist eine Anrufer-ID-Prüfung mit geringer
Verlässlichkeit. Das Plugin normalisiert den vom Provider bereitgestellten Wert
`From` und vergleicht ihn mit `allowFrom`. Webhook-Verifizierung authentifiziert
Provider-Zustellung und Payload-Integrität, beweist aber **nicht** die
Eigentümerschaft der PSTN-/VoIP-Anrufernummer. Behandeln Sie `allowFrom` als
Anrufer-ID-Filterung, nicht als starke Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agent-System. Stimmen Sie sie mit
`responseModel`, `responseSystemPrompt` und `responseTimeoutMs` ab.

### Routing pro Nummer

Verwenden Sie `numbers`, wenn ein Voice Call-Plugin Anrufe für mehrere
Telefonnummern empfängt und jede Nummer sich wie eine andere Leitung verhalten
soll. Beispielsweise kann eine Nummer einen lockeren persönlichen Assistenten
verwenden, während eine andere eine Geschäfts-Persona, einen anderen
Antwort-Agenten und eine andere TTS-Stimme verwendet.

Routen werden anhand der vom Provider bereitgestellten gewählten `To`-Nummer
ausgewählt. Schlüssel müssen E.164-Nummern sein. Wenn ein Anruf eingeht, löst
Voice Call die passende Route einmal auf, speichert die übereinstimmende Route
im Anrufdatensatz und verwendet diese effektive Konfiguration für Begrüßung,
klassischen Auto-Response-Pfad, Realtime-Consult-Pfad und TTS-Wiedergabe
wieder. Wenn keine Route passt, wird die globale Voice Call-Konfiguration
verwendet. Ausgehende Anrufe verwenden `numbers` nicht; übergeben Sie das
ausgehende Ziel, die Nachricht und die Sitzung explizit, wenn Sie den Anruf
initiieren.

Routenüberschreibungen unterstützen derzeit:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Der Routenwert `tts` wird tief über die globale Voice Call-`tts`-Konfiguration
zusammengeführt, sodass Sie normalerweise nur die Provider-Stimme überschreiben
können:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für
gesprochene Ausgabe an den System-Prompt an:

```text
{"spoken":"..."}
```

Voice Call extrahiert Sprachtext defensiv:

- Ignoriert Payloads, die als Reasoning-/Fehlerinhalte markiert sind.
- Parst direktes JSON, eingezäuntes JSON oder Inline-`"spoken"`-Schlüssel.
- Fällt auf Klartext zurück und entfernt wahrscheinliche Planungs-/Meta-Einleitungsabsätze.

Dadurch bleibt die gesprochene Wiedergabe auf anruferorientierten Text
fokussiert, und es wird vermieden, Planungstext in Audio durchsickern zu lassen.

### Startverhalten von Konversationen

Bei ausgehenden `conversation`-Anrufen ist die Verarbeitung der ersten Nachricht
an den Live-Wiedergabezustand gekoppelt:

- Leeren der Barge-In-Warteschlange und Auto-Response werden nur unterdrückt, während die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück, und die anfängliche Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming startet beim Verbinden des Streams ohne zusätzliche Verzögerung.
- Barge-In bricht aktive Wiedergabe ab und leert eingereihte, aber noch nicht wiedergegebene Twilio-TTS-Einträge. Geleerte Einträge werden als übersprungen aufgelöst, sodass nachfolgende Antwortlogik fortfahren kann, ohne auf Audio zu warten, das nie abgespielt wird.
- Realtime-Sprachkonversationen verwenden den eigenen Eröffnungs-Turn des Realtime-Streams. Voice Call sendet für diese anfängliche Nachricht **kein** Legacy-`<Say>`-TwiML-Update, sodass ausgehende `<Connect><Stream>`-Sitzungen verbunden bleiben.

### Schonfrist bei Trennung des Twilio-Streams

Wenn ein Twilio-Medienstream getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn sich der Stream innerhalb dieses Zeitfensters erneut verbindet, wird das automatische Beenden abgebrochen.
- Wenn nach der Kulanzzeit kein Stream erneut registriert wird, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## Bereinigung veralteter Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die nie einen abschließenden
Webhook erhalten (zum Beispiel Notify-Modus-Anrufe, die nie abgeschlossen werden). Der Standardwert
ist `0` (deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Benachrichtigungs-Flows.
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

Wenn ein Proxy oder Tunnel vor dem Gateway sitzt, rekonstruiert das Plugin
die öffentliche URL für die Signaturprüfung. Diese Optionen steuern, welchen weitergeleiteten Headern vertraut wird:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts aus Forwarding-Headern zulassen.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Weitergeleiteten Headern ohne Allowlist vertrauen.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Weitergeleiteten Headern nur vertrauen, wenn die Remote-IP der Anfrage mit der Liste übereinstimmt.
</ParamField>

Zusätzliche Schutzmaßnahmen:

- Webhook-**Replay-Schutz** ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-Anfragen werden bestätigt, aber für Seiteneffekte übersprungen.
- Twilio-Konversationsdurchläufe enthalten ein Token pro Durchlauf in `<Gather>`-Callbacks, sodass veraltete oder wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkript-Durchlauf erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgewiesen, wenn die erforderlichen Signatur-Header des Providers fehlen.
- Der Voice-Call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden) plus eine In-Flight-Obergrenze pro IP vor der Signaturprüfung.

Beispiel mit stabilem öffentlichem Host:

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
an die vom Gateway verwaltete Voice-Call-Laufzeit, damit die CLI keinen zweiten
Webhook-Server bindet. Wenn kein Gateway erreichbar ist, fallen die Befehle auf eine
eigenständige CLI-Laufzeit zurück.

`latency` liest `calls.jsonl` aus dem standardmäßigen Voice-Call-Speicherpfad.
Verwenden Sie `--file <path>`, um auf ein anderes Protokoll zu verweisen, und `--last <n>`, um
die Analyse auf die letzten N Datensätze zu begrenzen (Standard 200). Die Ausgabe enthält p50/p90/p99
für Durchlauflatenz und Listen-Wartezeiten.

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

Das Voice-Call-Plugin liefert eine passende Agent-Skill mit.

## Gateway-RPC

| Methode              | Argumente                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ist nur mit `mode: "conversation"` gültig. Notify-Modus-Anrufe
sollten `voicecall.dtmf` verwenden, nachdem der Anruf existiert, wenn sie nach dem Verbindungsaufbau
Ziffern benötigen.

## Fehlerbehebung

### Einrichtung schlägt bei Webhook-Exposition fehl

Führen Sie die Einrichtung aus derselben Umgebung aus, in der das Gateway läuft:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Für `twilio`, `telnyx` und `plivo` muss `webhook-exposure` grün sein. Eine
konfigurierte `publicUrl` schlägt weiterhin fehl, wenn sie auf lokalen oder privaten Netzwerkbereich
zeigt, weil der Carrier diese Adressen nicht zurückrufen kann. Verwenden Sie
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` nicht als `publicUrl`.

Twilio-Notify-Modus-Ausgangsanrufe senden ihr initiales `<Say>`-TwiML direkt in
der Create-Call-Anfrage, sodass die erste gesprochene Nachricht nicht davon abhängt, dass Twilio
Webhook-TwiML abruft. Ein öffentlicher Webhook ist weiterhin für Status-Callbacks,
Konversationsanrufe, Pre-Connect-DTMF, Echtzeit-Streams und Anrufsteuerung nach Verbindungsaufbau
erforderlich.

Verwenden Sie einen öffentlichen Expositionspfad:

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

Prüfen Sie den ausgewählten Provider und die erforderlichen Anmeldedatenfelder:

- Twilio: `twilio.accountSid`, `twilio.authToken` und `fromNumber` oder
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` und `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` und
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` und `fromNumber`.

Anmeldedaten müssen auf dem Gateway-Host vorhanden sein. Das Bearbeiten eines lokalen Shell-Profils wirkt sich
erst auf ein bereits laufendes Gateway aus, wenn es neu gestartet oder seine
Umgebung neu geladen wird.

### Anrufe starten, aber Provider-Webhooks kommen nicht an

Bestätigen Sie, dass die Provider-Konsole auf die exakte öffentliche Webhook-URL verweist:

```text
https://voice.example.com/voice/webhook
```

Prüfen Sie dann den Laufzeitstatus:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Häufige Ursachen:

- `publicUrl` zeigt auf einen anderen Pfad als `serve.path`.
- Die Tunnel-URL hat sich geändert, nachdem das Gateway gestartet wurde.
- Ein Proxy leitet die Anfrage weiter, entfernt oder überschreibt aber Host-/Proto-Header.
- Firewall oder DNS leiten den öffentlichen Hostnamen an einen anderen Ort als das Gateway.
- Das Gateway wurde ohne aktiviertes Voice-Call-Plugin neu gestartet.

Wenn sich ein Reverse Proxy oder Tunnel vor dem Gateway befindet, setzen Sie
`webhookSecurity.allowedHosts` auf den öffentlichen Hostnamen oder verwenden Sie
`webhookSecurity.trustedProxyIPs` für eine bekannte Proxy-Adresse. Verwenden Sie
`webhookSecurity.trustForwardingHeaders` nur, wenn die Proxy-Grenze unter
Ihrer Kontrolle steht.

### Signaturprüfung schlägt fehl

Provider-Signaturen werden gegen die öffentliche URL geprüft, die OpenClaw
aus der eingehenden Anfrage rekonstruiert. Wenn Signaturen fehlschlagen:

- Bestätigen Sie, dass die Provider-Webhook-URL exakt mit `publicUrl` übereinstimmt, einschließlich
  Schema, Host und Pfad.
- Aktualisieren Sie bei ngrok-Free-Tier-URLs `publicUrl`, wenn sich der Tunnel-Hostname ändert.
- Stellen Sie sicher, dass der Proxy die ursprünglichen Host- und Proto-Header beibehält, oder konfigurieren Sie
  `webhookSecurity.allowedHosts`.
- Aktivieren Sie `skipSignatureVerification` nicht außerhalb lokaler Tests.

### Google Meet Twilio-Beitritte schlagen fehl

Google Meet verwendet dieses Plugin für Twilio-Einwahlbeitritte. Prüfen Sie zuerst Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Prüfen Sie dann explizit den Google-Meet-Transport:

```bash
openclaw googlemeet setup --transport twilio
```

Wenn Voice Call grün ist, aber der Meet-Teilnehmer nie beitritt, prüfen Sie die Meet-
Einwahlnummer, PIN und `--dtmf-sequence`. Der Telefonanruf kann intakt sein, während
das Meeting eine falsche DTMF-Sequenz ablehnt oder ignoriert.

Google Meet startet den Twilio-Telefonabschnitt über `voicecall.start` mit einer
Pre-Connect-DTMF-Sequenz. Aus PINs abgeleitete Sequenzen enthalten das
`voiceCall.dtmfDelayMs` des Google-Meet-Plugins als führende Twilio-Warteziffern. Der Standardwert beträgt 12 Sekunden,
weil Meet-Einwahlaufforderungen verspätet eintreffen können. Voice Call leitet dann zurück zur
Echtzeit-Verarbeitung um, bevor die Begrüßung angefordert wird.

Verwenden Sie `openclaw logs --follow` für die Live-Phasenablaufverfolgung. Ein gesunder Twilio-Meet-
Beitritt protokolliert diese Reihenfolge:

- Google Meet delegiert den Twilio-Beitritt an Voice Call.
- Voice Call speichert Pre-Connect-DTMF-TwiML.
- Initiales Twilio-TwiML wird verbraucht und vor der Echtzeit-Verarbeitung bereitgestellt.
- Voice Call stellt Echtzeit-TwiML für den Twilio-Anruf bereit.
- Google Meet fordert nach der Post-DTMF-Verzögerung Begrüßungssprache mit `voicecall.speak` an.

`openclaw voicecall tail` zeigt weiterhin persistierte Anrufdatensätze; es ist nützlich für
Anrufstatus und Transkripte, aber nicht jeder Webhook-/Echtzeit-Übergang erscheint
dort.

### Echtzeitanruf hat keine Sprache

Bestätigen Sie, dass nur ein Audiomodus aktiviert ist. `realtime.enabled` und
`streaming.enabled` können nicht beide `true` sein.

Prüfen Sie für Echtzeit-Twilio-Anrufe außerdem:

- Ein Echtzeit-Provider-Plugin ist geladen und registriert.
- `realtime.provider` ist nicht gesetzt oder benennt einen registrierten Provider.
- Der API-Schlüssel des Providers ist für den Gateway-Prozess verfügbar.
- `openclaw logs --follow` zeigt, dass Echtzeit-TwiML bereitgestellt, die Echtzeit-Bridge
  gestartet und die initiale Begrüßung eingereiht wurde.

## Verwandt

- [Sprechmodus](/de/nodes/talk)
- [Text-to-speech](/de/tools/tts)
- [Sprachaktivierung](/de/nodes/voicewake)
