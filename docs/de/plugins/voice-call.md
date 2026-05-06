---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf über OpenClaw tätigen
    - Sie konfigurieren oder entwickeln das Plugin für Sprachanrufe
    - Sie benötigen Echtzeit-Sprachkommunikation oder Streaming-Transkription für Telefonie
sidebarTitle: Voice call
summary: Tätigen Sie ausgehende Sprachanrufe und nehmen Sie eingehende Sprachanrufe über Twilio, Telnyx oder Plivo an, mit optionaler Echtzeit-Sprachübertragung und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-05-06T09:04:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba168696481ef0cc3c55ac8fd8be4382cb36889a12ed6d881fe6b29a2b0a54c
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen,
Multi-Turn-Konversationen, Full-Duplex-Echtzeit-Sprache, Streaming-
Transkription und eingehende Anrufe mit Allowlist-Richtlinien.

**Aktuelle Provider:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (Entwicklung/kein Netzwerk).

<Note>
Das Voice Call-Plugin läuft **innerhalb des Gateway-Prozesses**. Wenn Sie ein
Remote-Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem Rechner, auf dem
das Gateway läuft, und starten Sie anschließend das Gateway neu, um es zu laden.
</Note>

## Schnellstart

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

    Verwenden Sie das Paket ohne Versionsangabe, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine
    exakte Version nur, wenn Sie eine reproduzierbare Installation benötigen.

    Starten Sie anschließend das Gateway neu, damit das Plugin geladen wird.

  </Step>
  <Step title="Configure provider and webhook">
    Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest (die vollständige Struktur finden Sie
    unten unter [Konfiguration](#configuration)). Mindestens erforderlich sind:
    `provider`, Provider-Zugangsdaten, `fromNumber` und eine öffentlich
    erreichbare Webhook-URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Die Standardausgabe ist in Chatprotokollen und Terminals gut lesbar. Sie prüft,
    ob das Plugin aktiviert ist, ob Provider-Zugangsdaten vorhanden sind, ob der Webhook erreichbar ist und ob
    nur ein Audiomodus (`streaming` oder `realtime`) aktiv ist. Verwenden Sie
    `--json` für Skripte.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beides sind standardmäßig Trockenläufe. Fügen Sie `--yes` hinzu, um tatsächlich einen kurzen
    ausgehenden Benachrichtigungsanruf zu platzieren:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss die Einrichtung zu einer **öffentlichen Webhook-URL** auflösen.
Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder der Serve-Fallback
auf loopback oder privaten Netzwerkadressraum auflöst, schlägt die Einrichtung fehl, statt
einen Provider zu starten, der keine Carrier-Webhooks empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true` gesetzt ist, dem ausgewählten Provider aber Zugangsdaten fehlen,
protokolliert der Gateway-Start eine Warnung über die unvollständige Einrichtung mit den fehlenden Schlüsseln und
überspringt den Start der Runtime. Befehle, RPC-Aufrufe und Agent-Tools geben bei Verwendung weiterhin
die exakt fehlende Provider-Konfiguration zurück.

<Note>
Voice-call-Zugangsdaten akzeptieren SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` und `plugins.entries.voice-call.config.tts.providers.*.apiKey` werden über die standardmäßige SecretRef-Oberfläche aufgelöst; siehe [SecretRef-Zugangsdatenoberfläche](/de/reference/secretref-credential-surface).
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
    - Twilio, Telnyx und Plivo benötigen alle eine **öffentlich erreichbare** Webhook-URL.
    - `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
    - Telnyx benötigt `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht true ist.
    - `skipSignatureVerification` ist nur für lokale Tests vorgesehen.
    - Setzen Sie bei der kostenlosen ngrok-Stufe `publicUrl` auf die exakte ngrok-URL; Signaturprüfung wird immer erzwungen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` ist und `serve.bind` loopback ist (lokaler ngrok-Agent). Nur für lokale Entwicklung.
    - URLs der kostenlosen ngrok-Stufe können sich ändern oder Zwischenseiten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Produktion: bevorzugen Sie eine stabile Domain oder einen Tailscale-Funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` schließt Sockets, die nie einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Pre-Start-Sockets.
    - `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Pre-Start-Sockets pro Quell-IP.
    - `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Ältere Konfigurationen, die `provider: "log"`, `twilio.from` oder ältere
    `streaming.*` OpenAI-Schlüssel verwenden, werden von `openclaw doctor --fix` umgeschrieben.
    Der Runtime-Fallback akzeptiert die alten voice-call-Schlüssel vorerst noch, aber
    der Umschreibpfad ist `openclaw doctor --fix`, und der Kompatibilitäts-Shim ist
    temporär.

    Automatisch migrierte Streaming-Schlüssel:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Sitzungsbereich

Standardmäßig verwendet Voice Call `sessionScope: "per-phone"`, sodass wiederholte Anrufe desselben
Anrufers den Gesprächsspeicher beibehalten. Setzen Sie `sessionScope: "per-call"`, wenn
jeder Carrier-Anruf mit frischem Kontext starten soll, zum Beispiel bei Empfangs-,
Buchungs-, IVR- oder Google Meet-Bridge-Abläufen, bei denen dieselbe Telefonnummer
verschiedene Meetings darstellen kann.

## Echtzeit-Sprachkonversationen

`realtime` wählt einen Full-Duplex-Echtzeit-Sprach-Provider für Live-Anruf-
Audio aus. Es ist getrennt von `streaming`, das Audio nur an
Echtzeit-Transkriptions-Provider weiterleitet.

<Warning>
`realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden. Wählen Sie einen
Audiomodus pro Anruf.
</Warning>

Aktuelles Runtime-Verhalten:

- `realtime.enabled` wird für Twilio Media Streams unterstützt.
- `realtime.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten registrierten Echtzeit-Sprach-Provider.
- Gebündelte Echtzeit-Sprach-Provider: Google Gemini Live (`google`) und OpenAI (`openai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration befindet sich unter `realtime.providers.<providerId>`.
- Voice Call stellt standardmäßig das gemeinsame `openclaw_agent_consult`-Echtzeit-Tool bereit. Das Echtzeitmodell kann es aufrufen, wenn der Anrufer nach tiefergehender Argumentation, aktuellen Informationen oder normalen OpenClaw-Tools fragt.
- `realtime.consultPolicy` fügt optional Hinweise hinzu, wann das Echtzeitmodell `openclaw_agent_consult` aufrufen soll.
- `realtime.agentContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, injiziert Voice Call eine begrenzte Agent-Identität, eine System-Prompt-Überschreibung und eine ausgewählte Workspace-Dateikapsel bei der Sitzungseinrichtung in die Anweisungen des Echtzeit-Providers.
- `realtime.fastContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, durchsucht Voice Call zuerst indexierten Speicher/Sitzungskontext nach der Consult-Frage und gibt diese Ausschnitte innerhalb von `realtime.fastContext.timeoutMs` an das Echtzeitmodell zurück, bevor nur dann auf den vollständigen Consult-Agent zurückgefallen wird, wenn `realtime.fastContext.fallbackToConsult` true ist.
- Wenn `realtime.provider` auf einen nicht registrierten Provider verweist oder überhaupt kein Echtzeit-Sprach-Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt Echtzeitmedien, statt das gesamte Plugin fehlschlagen zu lassen.
- Consult-Sitzungsschlüssel verwenden die gespeicherte Anrufsitzung erneut, sofern verfügbar, und fallen dann auf den konfigurierten `sessionScope` zurück (`per-phone` standardmäßig oder `per-call` für isolierte Anrufe).

### Tool-Richtlinie

`realtime.toolPolicy` steuert den Consult-Lauf:

| Richtlinie       | Verhalten                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stellt das Consult-Tool bereit und begrenzt den regulären Agent auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get`. |
| `owner`          | Stellt das Consult-Tool bereit und lässt den regulären Agent die normale Agent-Tool-Richtlinie verwenden.                                |
| `none`           | Stellt das Consult-Tool nicht bereit. Benutzerdefinierte `realtime.tools` werden weiterhin an den Echtzeit-Provider durchgereicht.       |

`realtime.consultPolicy` steuert nur die Anweisungen für das Echtzeitmodell:

| Richtlinie    | Anleitung                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Behalten Sie den Standard-Prompt bei und lassen Sie den Provider entscheiden, wann das Consult-Tool aufgerufen wird. |
| `substantive` | Beantworten Sie einfache konversationelle Überleitungen direkt und konsultieren Sie vor Fakten, Speicher, Tools oder Kontext. |
| `always`      | Konsultieren Sie vor jeder substanziellen Antwort.                                              |

### Agent-Sprachkontext

Aktivieren Sie `realtime.agentContext`, wenn die Sprachbrücke wie der
konfigurierte OpenClaw-Agent klingen soll, ohne bei gewöhnlichen Gesprächsrunden einen vollständigen Agent-Consult-Roundtrip zu bezahlen.
Die Kontextkapsel wird einmal hinzugefügt, wenn die Echtzeitsitzung
erstellt wird, sodass keine Latenz pro Gesprächsrunde entsteht. Aufrufe von
`openclaw_agent_consult` führen weiterhin den vollständigen OpenClaw-Agent aus und sollten
für Tool-Arbeit, aktuelle Informationen, Speicherabfragen oder Workspace-Zustand verwendet werden.

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
              includeSystemPrompt: true,
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
    `sessionResumption` und `contextWindowCompression` sind standardmäßig für längere,
    wiederverbindbare Anrufe aktiviert. Verwenden Sie `silenceDurationMs`, `startSensitivity` und
    `endSensitivity`, um schnellere Sprecherwechsel bei Telefonie-Audio abzustimmen.

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
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
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

Weitere Provider-spezifische Realtime-Sprachoptionen finden Sie unter [Google-Provider](/de/providers/google) und
[OpenAI-Provider](/de/providers/openai).

## Streaming-Transkription

`streaming` wählt einen Realtime-Transkriptions-Provider für Live-Anruf-Audio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht festgelegt, verwendet Voice Call den ersten registrierten Realtime-Transkriptions-Provider.
- Gebündelte Realtime-Transkriptions-Provider: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration befindet sich unter `streaming.providers.<providerId>`.
- Nachdem Twilio eine akzeptierte Stream-`start`-Nachricht sendet, registriert Voice Call den Stream sofort, reiht eingehende Medien über den Transkriptions-Provider ein, während der Provider die Verbindung herstellt, und startet die erste Begrüßung erst, nachdem die Realtime-Transkription bereit ist.
- Wenn `streaming.provider` auf einen nicht registrierten Provider verweist oder keiner registriert ist, protokolliert Voice Call eine Warnung und überspringt Media-Streaming, anstatt das gesamte Plugin fehlschlagen zu lassen.

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

Voice Call verwendet die zentrale `messages.tts`-Konfiguration für gestreamte
Sprachausgabe bei Anrufen. Sie können sie in der Plugin-Konfiguration mit
**derselben Struktur** überschreiben — sie wird per Deep-Merge mit `messages.tts` zusammengeführt.

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

- Legacy-`tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` repariert; committete Konfiguration sollte `tts.providers.<provider>` verwenden.
- Zentrales TTS wird verwendet, wenn Twilio-Media-Streaming aktiviert ist; andernfalls fallen Anrufe auf Provider-native Stimmen zurück.
- Wenn bereits ein Twilio-Media-Stream aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, anstatt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call zur Fehlersuche eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn Twilio-Barge-in oder Stream-Abbau die ausstehende TTS-Warteschlange leert, werden eingereihte Wiedergabeanforderungen abgeschlossen, anstatt Anrufer hängen zu lassen, die auf den Abschluss der Wiedergabe warten.

### TTS-Beispiele

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
`inboundPolicy: "allowlist"` ist eine Anrufer-ID-Prüfung mit geringer Vertrauenswürdigkeit. Das
Plugin normalisiert den vom Provider bereitgestellten `From`-Wert und vergleicht ihn mit
`allowFrom`. Die Webhook-Verifizierung authentifiziert die Provider-Zustellung und
Payload-Integrität, beweist jedoch **nicht** die Inhaberschaft der PSTN-/VoIP-Anrufernummer.
Behandeln Sie `allowFrom` als Anrufer-ID-Filterung, nicht als starke Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agent-System. Stimmen Sie sie mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs` ab.

### Routing pro Nummer

Verwenden Sie `numbers`, wenn ein Voice-Call-Plugin Anrufe für mehrere Telefonnummern
empfängt und sich jede Nummer wie eine andere Leitung verhalten soll. Beispielsweise kann eine
Nummer einen lockeren persönlichen Assistenten verwenden, während eine andere eine geschäftliche
Persona, einen anderen Antwort-Agent und eine andere TTS-Stimme verwendet.

Routen werden anhand der vom Provider bereitgestellten gewählten `To`-Nummer ausgewählt. Schlüssel müssen
E.164-Nummern sein. Wenn ein Anruf eingeht, löst Voice Call die passende Route einmal auf,
speichert die zugeordnete Route im Anrufdatensatz und verwendet diese effektive Konfiguration
für die Begrüßung, den klassischen Auto-Response-Pfad, den Realtime-Consult-Pfad und die TTS-
Wiedergabe erneut. Wenn keine Route passt, wird die globale Voice-Call-Konfiguration verwendet.
Ausgehende Anrufe verwenden `numbers` nicht; übergeben Sie beim Starten des Anrufs das ausgehende Ziel, die Nachricht und
die Sitzung explizit.

Routenüberschreibungen unterstützen derzeit:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Der `tts`-Routenwert wird per Deep-Merge über die globale Voice-Call-`tts`-Konfiguration zusammengeführt, sodass
Sie in der Regel nur die Provider-Stimme überschreiben müssen:

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

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für gesprochene Ausgabe an
den System-Prompt an:

```text
{"spoken":"..."}
```

Voice Call extrahiert Sprachtext defensiv:

- Ignoriert Payloads, die als Reasoning-/Fehlerinhalte markiert sind.
- Parst direktes JSON, eingezäuntes JSON oder Inline-`"spoken"`-Schlüssel.
- Fällt auf Klartext zurück und entfernt wahrscheinliche einleitende Planungs-/Meta-Absätze.

Dadurch bleibt die gesprochene Wiedergabe auf anruferorientierten Text fokussiert und
es wird vermieden, dass Planungstext in Audio gelangt.

### Verhalten beim Gesprächsstart

Bei ausgehenden `conversation`-Anrufen ist die Behandlung der ersten Nachricht an den Live-
Wiedergabestatus gekoppelt:

- Das Leeren der Barge-in-Warteschlange und die automatische Antwort werden nur unterdrückt, während die erste Begrüßung aktiv gesprochen wird.
- Wenn die erste Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die erste Nachricht bleibt für einen erneuten Versuch eingereiht.
- Die erste Wiedergabe für Twilio-Streaming startet beim Verbinden des Streams ohne zusätzliche Verzögerung.
- Barge-in bricht die aktive Wiedergabe ab und leert eingereihte, aber noch nicht abgespielte Twilio-TTS-Einträge. Geleerte Einträge werden als übersprungen aufgelöst, sodass nachfolgende Antwortlogik fortgesetzt werden kann, ohne auf Audio zu warten, das nie abgespielt wird.
- Realtime-Sprachkonversationen verwenden den eigenen Eröffnungszug des Realtime-Streams. Voice Call sendet für diese erste Nachricht **kein** Legacy-`<Say>`-TwiML-Update, sodass ausgehende `<Connect><Stream>`-Sitzungen verbunden bleiben.

### Karenzzeit bei Twilio-Stream-Trennung

Wenn ein Twilio-Media-Stream getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn der Stream innerhalb dieses Fensters erneut verbunden wird, wird das automatische Beenden abgebrochen.
- Wenn sich nach der Karenzzeit kein Stream erneut registriert, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## Reaper für veraltete Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die nie einen terminalen
Webhook erhalten (zum Beispiel Notify-Mode-Anrufe, die nie abgeschlossen werden). Der Standardwert
ist `0` (deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Notify-artige Abläufe.
- Halten Sie diesen Wert **höher als `maxDurationSeconds`**, damit normale Aufrufe abgeschlossen werden können. Ein guter Ausgangspunkt ist `maxDurationSeconds + 30–60` Sekunden.

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
die öffentliche URL für die Signaturprüfung. Diese Optionen steuern, welchen
weitergeleiteten Headern vertraut wird:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Zulassungsliste für Hosts aus Weiterleitungs-Headern.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Weitergeleiteten Headern ohne Zulassungsliste vertrauen.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Weitergeleiteten Headern nur vertrauen, wenn die Remote-IP der Anfrage mit der Liste übereinstimmt.
</ParamField>

Zusätzliche Schutzmaßnahmen:

- Webhook-**Replay-Schutz** ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-Anfragen werden bestätigt, aber für Nebeneffekte übersprungen.
- Twilio-Konversationsdurchläufe enthalten ein durchlaufspezifisches Token in `<Gather>`-Callbacks, sodass veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkriptdurchlauf erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die erforderlichen Signatur-Header des Providers fehlen.
- Der Voice-Call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden) plus eine In-Flight-Begrenzung pro IP vor der Signaturprüfung.

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
an die Gateway-eigene Voice-Call-Laufzeit, damit die CLI keinen zweiten
Webhook-Server bindet. Wenn kein Gateway erreichbar ist, fallen die Befehle auf
eine eigenständige CLI-Laufzeit zurück.

`latency` liest `calls.jsonl` aus dem standardmäßigen Voice-Call-Speicherpfad.
Verwenden Sie `--file <path>`, um auf ein anderes Protokoll zu verweisen, und `--last <n>`, um die
Analyse auf die letzten N Datensätze zu begrenzen (Standard: 200). Die Ausgabe enthält p50/p90/p99
für Durchlauflatenz und Wartezeiten beim Zuhören.

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

Dieses Repository liefert ein passendes Skill-Dokument unter `skills/voice-call/SKILL.md`.

## Gateway-RPC

| Methode              | Argumente                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ist nur mit `mode: "conversation"` gültig. Aufrufe im Notify-Modus
sollten `voicecall.dtmf` verwenden, nachdem der Aufruf existiert, wenn sie Ziffern nach dem Verbindungsaufbau
benötigen.

## Fehlerbehebung

### Einrichtung schlägt bei Webhook-Erreichbarkeit fehl

Führen Sie die Einrichtung aus derselben Umgebung aus, in der auch das Gateway läuft:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Für `twilio`, `telnyx` und `plivo` muss `webhook-exposure` grün sein. Eine
konfigurierte `publicUrl` schlägt trotzdem fehl, wenn sie auf lokalen oder privaten Netzwerkraum
zeigt, weil der Netzbetreiber diese Adressen nicht zurückrufen kann. Verwenden Sie nicht
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` als `publicUrl`.

Ausgehende Twilio-Aufrufe im Notify-Modus senden ihr anfängliches `<Say>`-TwiML direkt in
der Create-Call-Anfrage, sodass die erste gesprochene Nachricht nicht davon abhängt, dass Twilio
Webhook-TwiML abruft. Ein öffentlicher Webhook ist weiterhin für Status-Callbacks,
Konversationsaufrufe, Pre-Connect-DTMF, Echtzeit-Streams und Call-Control nach dem Verbindungsaufbau
erforderlich.

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

Starten oder laden Sie nach der Konfigurationsänderung das Gateway neu und führen Sie dann aus:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ist ein Probelauf, sofern Sie nicht `--yes` übergeben.

### Provider-Anmeldedaten schlagen fehl

Prüfen Sie den ausgewählten Provider und die erforderlichen Felder für Anmeldedaten:

- Twilio: `twilio.accountSid`, `twilio.authToken` und `fromNumber`, oder
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` und `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` und
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` und `fromNumber`.

Anmeldedaten müssen auf dem Gateway-Host vorhanden sein. Das Bearbeiten eines lokalen Shell-Profils wirkt sich
erst auf ein bereits laufendes Gateway aus, wenn es neu startet oder seine
Umgebung neu lädt.

### Aufrufe starten, aber Provider-Webhooks kommen nicht an

Bestätigen Sie, dass die Provider-Konsole auf die exakte öffentliche Webhook-URL zeigt:

```text
https://voice.example.com/voice/webhook
```

Prüfen Sie dann den Laufzeitzustand:

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
- Das Gateway wurde neu gestartet, ohne dass das Voice-Call-Plugin aktiviert war.

Wenn ein Reverse Proxy oder Tunnel vor dem Gateway sitzt, setzen Sie
`webhookSecurity.allowedHosts` auf den öffentlichen Hostnamen oder verwenden Sie
`webhookSecurity.trustedProxyIPs` für eine bekannte Proxy-Adresse. Verwenden Sie
`webhookSecurity.trustForwardingHeaders` nur, wenn die Proxy-Grenze unter
Ihrer Kontrolle steht.

### Signaturprüfung schlägt fehl

Provider-Signaturen werden gegen die öffentliche URL geprüft, die OpenClaw
aus der eingehenden Anfrage rekonstruiert. Wenn Signaturen fehlschlagen:

- Bestätigen Sie, dass die Provider-Webhook-URL exakt mit `publicUrl` übereinstimmt, einschließlich
  Schema, Host und Pfad.
- Aktualisieren Sie bei kostenlosen ngrok-URLs `publicUrl`, wenn sich der Tunnel-Hostname ändert.
- Stellen Sie sicher, dass der Proxy die ursprünglichen Host- und Proto-Header beibehält, oder konfigurieren Sie
  `webhookSecurity.allowedHosts`.
- Aktivieren Sie `skipSignatureVerification` nicht außerhalb lokaler Tests.

### Google Meet-Twilio-Beitritte schlagen fehl

Google Meet verwendet dieses Plugin für Twilio-Einwahlbeitritte. Prüfen Sie zuerst Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Prüfen Sie dann den Google Meet-Transport ausdrücklich:

```bash
openclaw googlemeet setup --transport twilio
```

Wenn Voice Call grün ist, der Meet-Teilnehmer aber nie beitritt, prüfen Sie die Meet-
Einwahlnummer, die PIN und `--dtmf-sequence`. Der Telefonanruf kann fehlerfrei sein, während
die Besprechung eine falsche DTMF-Sequenz ablehnt oder ignoriert.

Google Meet startet den Twilio-Telefonabschnitt über `voicecall.start` mit einer
Pre-Connect-DTMF-Sequenz. Aus der PIN abgeleitete Sequenzen enthalten das
`voiceCall.dtmfDelayMs` des Google Meet-Plugins als führende Twilio-Warteziffern. Der Standardwert beträgt 12 Sekunden,
weil Meet-Einwahlansagen verspätet eintreffen können. Voice Call leitet dann zurück zur
Echtzeitverarbeitung, bevor die Begrüßung angefordert wird.

Verwenden Sie `openclaw logs --follow` für die Live-Phasenverfolgung. Ein fehlerfreier Twilio-Meet-
Beitritt protokolliert diese Reihenfolge:

- Google Meet delegiert den Twilio-Beitritt an Voice Call.
- Voice Call speichert Pre-Connect-DTMF-TwiML.
- Twilio-Anfangs-TwiML wird verbraucht und vor der Echtzeitverarbeitung bereitgestellt.
- Voice Call stellt Echtzeit-TwiML für den Twilio-Aufruf bereit.
- Google Meet fordert die Begrüßung mit `voicecall.speak` nach der Post-DTMF-Verzögerung an.

`openclaw voicecall tail` zeigt weiterhin persistierte Anrufdatensätze; es ist nützlich für
Anrufstatus und Transkripte, aber nicht jeder Webhook-/Echtzeitübergang erscheint
dort.

### Echtzeitaufruf hat keine Sprache

Bestätigen Sie, dass nur ein Audiomodus aktiviert ist. `realtime.enabled` und
`streaming.enabled` können nicht beide true sein.

Prüfen Sie für Echtzeit-Twilio-Aufrufe außerdem:

- Ein Echtzeit-Provider-Plugin ist geladen und registriert.
- `realtime.provider` ist nicht gesetzt oder benennt einen registrierten Provider.
- Der Provider-API-Schlüssel ist für den Gateway-Prozess verfügbar.
- `openclaw logs --follow` zeigt, dass Echtzeit-TwiML bereitgestellt, die Echtzeit-Bridge
  gestartet und die anfängliche Begrüßung in die Warteschlange gestellt wurde.

## Verwandt

- [Sprechmodus](/de/nodes/talk)
- [Text-to-speech](/de/tools/tts)
- [Sprachaktivierung](/de/nodes/voicewake)
