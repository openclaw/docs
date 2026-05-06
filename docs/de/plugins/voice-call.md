---
read_when:
    - Sie möchten von OpenClaw aus einen ausgehenden Sprachanruf tätigen
    - Sie konfigurieren oder entwickeln das Sprachanruf-Plugin
    - Sie benötigen Echtzeit-Sprachfunktionen oder Streaming-Transkription für Telefonie
sidebarTitle: Voice call
summary: Tätigen Sie ausgehende Sprachanrufe und nehmen Sie eingehende Sprachanrufe über Twilio, Telnyx oder Plivo an, mit optionaler Echtzeit-Sprachübertragung und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-05-06T06:59:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc608883e8f36cdd2075c3a8c7ab002d89d0616e119f488437bd18c995f066f9
    source_path: plugins/voice-call.md
    workflow: 16
---

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen,
mehrteilige Gespräche, Full-Duplex-Echtzeit-Sprache, Streaming-
Transkription und eingehende Anrufe mit Allowlist-Richtlinien.

**Aktuelle Provider:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (Entwicklung/kein Netzwerk).

<Note>
Das Voice Call Plugin läuft **innerhalb des Gateway-Prozesses**. Wenn Sie ein
Remote-Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem Computer, auf dem
das Gateway läuft, und starten Sie anschließend das Gateway neu, um es zu laden.
</Note>

## Schnellstart

<Steps>
  <Step title="Plugin installieren">
    <Tabs>
      <Tab title="Aus npm">
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

    Verwenden Sie das bloße Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine
    exakte Version nur dann, wenn Sie eine reproduzierbare Installation benötigen.

    Starten Sie danach das Gateway neu, damit das Plugin geladen wird.

  </Step>
  <Step title="Provider und Webhook konfigurieren">
    Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest (die vollständige Form finden Sie
    unten unter [Konfiguration](#configuration)). Mindestens erforderlich sind:
    `provider`, Provider-Zugangsdaten, `fromNumber` und eine öffentlich
    erreichbare Webhook-URL.
  </Step>
  <Step title="Einrichtung überprüfen">
    ```bash
    openclaw voicecall setup
    ```

    Die Standardausgabe ist in Chatprotokollen und Terminals lesbar. Sie prüft,
    ob das Plugin aktiviert ist, Provider-Zugangsdaten vorhanden sind, der Webhook erreichbar ist und
    nur ein Audiomodus (`streaming` oder `realtime`) aktiv ist. Verwenden Sie
    `--json` für Skripte.

  </Step>
  <Step title="Smoke-Test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide sind standardmäßig Probeläufe. Fügen Sie `--yes` hinzu, um tatsächlich einen kurzen
    ausgehenden Benachrichtigungsanruf zu platzieren:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss die Einrichtung zu einer **öffentlichen Webhook-URL** führen.
Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder der Serve-Fallback
auf Loopback oder privaten Netzwerkadressraum aufgelöst wird, schlägt die Einrichtung fehl, statt
einen Provider zu starten, der keine Carrier-Webhooks empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true` gesetzt ist, dem ausgewählten Provider aber Zugangsdaten fehlen,
protokolliert der Gateway-Start eine Warnung über eine unvollständige Einrichtung mit den fehlenden Schlüsseln und
überspringt den Start der Runtime. Befehle, RPC-Aufrufe und Agent-Tools geben bei Verwendung weiterhin
die exakt fehlende Provider-Konfiguration zurück.

<Note>
Zugangsdaten für Voice Call akzeptieren SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` und `plugins.entries.voice-call.config.tts.providers.*.apiKey` werden über die standardmäßige SecretRef-Oberfläche aufgelöst; siehe [SecretRef-Zugangsdatenoberfläche](/de/reference/secretref-credential-surface).
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
  <Accordion title="Provider-Erreichbarkeit und Sicherheitshinweise">
    - Twilio, Telnyx und Plivo benötigen alle eine **öffentlich erreichbare** Webhook-URL.
    - `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
    - Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht true ist.
    - `skipSignatureVerification` ist nur für lokale Tests vorgesehen.
    - Legen Sie im kostenlosen ngrok-Tarif `publicUrl` auf die exakte ngrok-URL fest; Signaturprüfung wird immer erzwungen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` ist und `serve.bind` Loopback ist (lokaler ngrok-Agent). Nur für lokale Entwicklung.
    - URLs im kostenlosen ngrok-Tarif können sich ändern oder ein Interstitial-Verhalten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Produktion: Bevorzugen Sie eine stabile Domain oder einen Tailscale-Funnel.

  </Accordion>
  <Accordion title="Limits für Streaming-Verbindungen">
    - `streaming.preStartTimeoutMs` schließt Sockets, die nie einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Pre-Start-Sockets.
    - `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Pre-Start-Sockets pro Quell-IP.
    - `streaming.maxConnections` begrenzt die Gesamtzahl geöffneter Media-Stream-Sockets (ausstehend + aktiv).

  </Accordion>
  <Accordion title="Migrationen alter Konfigurationen">
    Ältere Konfigurationen mit `provider: "log"`, `twilio.from` oder alten
    `streaming.*` OpenAI-Schlüsseln werden durch `openclaw doctor --fix` umgeschrieben.
    Der Runtime-Fallback akzeptiert die alten Voice-Call-Schlüssel vorerst weiterhin, aber
    der Umschreibpfad ist `openclaw doctor --fix` und der Kompatibilitäts-Shim ist
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

Standardmäßig verwendet Voice Call `sessionScope: "per-phone"`, sodass wiederholte Anrufe vom
gleichen Anrufer den Gesprächsspeicher behalten. Setzen Sie `sessionScope: "per-call"`, wenn
jeder Carrier-Anruf mit frischem Kontext beginnen soll, zum Beispiel bei Rezeption,
Buchung, IVR oder Google Meet Bridge-Abläufen, bei denen dieselbe Telefonnummer
verschiedene Meetings darstellen kann.

## Echtzeit-Sprachgespräche

`realtime` wählt einen Full-Duplex-Echtzeit-Sprach-Provider für Live-Anruf-
Audio aus. Dies ist getrennt von `streaming`, das Audio nur an
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
- Voice Call stellt standardmäßig das gemeinsame Echtzeit-Tool `openclaw_agent_consult` bereit. Das Echtzeitmodell kann es aufrufen, wenn der Anrufer tieferes Reasoning, aktuelle Informationen oder normale OpenClaw-Tools anfordert.
- `realtime.consultPolicy` fügt optional Hinweise dazu hinzu, wann das Echtzeitmodell `openclaw_agent_consult` aufrufen soll.
- `realtime.agentContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, injiziert Voice Call bei der Sitzungseinrichtung eine begrenzte Agent-Identität, eine System-Prompt-Überschreibung und eine ausgewählte Workspace-Datei-Kapsel in die Anweisungen des Echtzeit-Providers.
- `realtime.fastContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, durchsucht Voice Call zuerst indizierten Speicher-/Sitzungskontext nach der Consult-Frage und gibt diese Ausschnitte innerhalb von `realtime.fastContext.timeoutMs` an das Echtzeitmodell zurück, bevor nur dann auf den vollständigen Consult-Agent zurückgefallen wird, wenn `realtime.fastContext.fallbackToConsult` true ist.
- Wenn `realtime.provider` auf einen nicht registrierten Provider zeigt oder überhaupt kein Echtzeit-Sprach-Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt Echtzeitmedien, statt das gesamte Plugin fehlschlagen zu lassen.
- Consult-Sitzungsschlüssel verwenden die gespeicherte Anrufsitzung wieder, wenn verfügbar, und fallen dann auf das konfigurierte `sessionScope` zurück (`per-phone` standardmäßig oder `per-call` für isolierte Anrufe).

### Tool-Richtlinie

`realtime.toolPolicy` steuert den Consult-Lauf:

| Richtlinie      | Verhalten                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stellt das Consult-Tool bereit und beschränkt den regulären Agent auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get`. |
| `owner`          | Stellt das Consult-Tool bereit und erlaubt dem regulären Agent die normale Agent-Tool-Richtlinie.                                        |
| `none`           | Stellt das Consult-Tool nicht bereit. Benutzerdefinierte `realtime.tools` werden weiterhin an den Echtzeit-Provider durchgereicht.       |

`realtime.consultPolicy` steuert nur die Anweisungen des Echtzeitmodells:

| Richtlinie    | Anleitung                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Behalten Sie den Standard-Prompt bei und lassen Sie den Provider entscheiden, wann das Consult-Tool aufgerufen wird. |
| `substantive` | Beantwortet einfache gesprächsverbindende Passagen direkt und konsultiert vor Fakten, Speicher, Tools oder Kontext. |
| `always`      | Konsultiert vor jeder substantiellen Antwort.                                                    |

### Agent-Sprachkontext

Aktivieren Sie `realtime.agentContext`, wenn die Sprachbrücke wie der
konfigurierte OpenClaw-Agent klingen soll, ohne bei gewöhnlichen Turns einen vollständigen Agent-Consult-Roundtrip
zu bezahlen. Die Kontextkapsel wird einmal hinzugefügt, wenn die Echtzeitsitzung
erstellt wird, sodass sie keine Latenz pro Turn hinzufügt. Aufrufe von
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

### Echtzeit-Provider-Beispiele

<Tabs>
  <Tab title="Google Gemini Live">
    Standardwerte: API-Schlüssel aus `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` oder `GOOGLE_GENERATIVE_AI_API_KEY`; Modell
    `gemini-2.5-flash-native-audio-preview-12-2025`; Stimme `Kore`.
    `sessionResumption` und `contextWindowCompression` sind standardmäßig für längere,
    wiederverbindbare Anrufe aktiviert. Verwenden Sie `silenceDurationMs`, `startSensitivity` und
    `endSensitivity`, um schnelleres Turn-Taking bei Telefonie-Audio abzustimmen.

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

Weitere Provider-spezifische Echtzeit-Sprachoptionen finden Sie unter
[Google-Provider](/de/providers/google) und
[OpenAI-Provider](/de/providers/openai).

## Streaming-Transkription

`streaming` wählt einen Echtzeit-Transkriptions-Provider für Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten registrierten Echtzeit-Transkriptions-Provider.
- Gebündelte Echtzeit-Transkriptions-Provider: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration befindet sich unter `streaming.providers.<providerId>`.
- Nachdem Twilio eine akzeptierte Stream-`start`-Nachricht gesendet hat, registriert Voice Call den Stream sofort, stellt eingehende Medien über den Transkriptions-Provider in die Warteschlange, während der Provider die Verbindung herstellt, und startet die anfängliche Begrüßung erst, wenn die Echtzeit-Transkription bereit ist.
- Wenn `streaming.provider` auf einen nicht registrierten Provider verweist oder keiner registriert ist, protokolliert Voice Call eine Warnung und überspringt Media-Streaming, statt das gesamte Plugin fehlschlagen zu lassen.

### Streaming-Provider-Beispiele

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

Voice Call verwendet die zentrale `messages.tts`-Konfiguration für Streaming-
Sprache bei Anrufen. Sie können sie in der Plugin-Konfiguration mit
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
**Microsoft-Sprachausgabe wird für Sprachanrufe ignoriert.** Telefonie-Audio benötigt PCM;
der aktuelle Microsoft-Transport stellt keine Telefonie-PCM-Ausgabe bereit.
</Warning>

Verhaltenshinweise:

- Legacy-`tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` repariert; festgeschriebene Konfiguration sollte `tts.providers.<provider>` verwenden.
- Zentrales TTS wird verwendet, wenn Twilio-Media-Streaming aktiviert ist; andernfalls fallen Anrufe auf Provider-native Stimmen zurück.
- Wenn bereits ein Twilio-Mediastream aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call zur Fehlerbehebung eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn Twilio-Barge-in oder Stream-Abbau die ausstehende TTS-Warteschlange leert, werden eingereihte Wiedergabeanforderungen abgeschlossen, statt Anrufer beim Warten auf den Abschluss der Wiedergabe hängen zu lassen.

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

Die Standardrichtlinie für eingehende Anrufe ist `disabled`. Um eingehende Anrufe zu aktivieren, setzen Sie:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` ist eine Anrufer-ID-Prüfung mit geringer Vertrauenssicherheit. Das
Plugin normalisiert den vom Provider gelieferten `From`-Wert und vergleicht ihn mit
`allowFrom`. Webhook-Verifizierung authentifiziert die Provider-Zustellung und
Payload-Integrität, beweist aber **nicht** die Inhaberschaft der PSTN-/VoIP-Anrufernummer.
Behandeln Sie `allowFrom` als Anrufer-ID-Filterung, nicht als starke Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agent-System. Stimmen Sie sie mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs` ab.

### Rufnummernspezifisches Routing

Verwenden Sie `numbers`, wenn ein Voice Call-Plugin Anrufe für mehrere Telefonnummern
empfängt und jede Nummer sich wie eine andere Leitung verhalten soll. Beispielsweise kann eine
Nummer einen lockeren persönlichen Assistenten verwenden, während eine andere eine geschäftliche
Persona, einen anderen Antwort-Agent und eine andere TTS-Stimme verwendet.

Routen werden aus der vom Provider gelieferten gewählten `To`-Nummer ausgewählt. Schlüssel müssen
E.164-Nummern sein. Wenn ein Anruf eingeht, löst Voice Call die passende Route einmal auf,
speichert die passende Route im Anrufdatensatz und verwendet diese effektive Konfiguration
für die Begrüßung, den klassischen automatischen Antwortpfad, den Echtzeit-Consult-Pfad und die TTS-
Wiedergabe wieder. Wenn keine Route passt, wird die globale Voice Call-Konfiguration verwendet.
Ausgehende Anrufe verwenden `numbers` nicht; übergeben Sie beim Einleiten des Anrufs das ausgehende Ziel, die Nachricht und
die Sitzung explizit.

Routenüberschreibungen unterstützen derzeit:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Der Routenwert `tts` wird per Deep-Merge über die globale Voice Call-`tts`-Konfiguration gelegt, sodass
Sie in der Regel nur die Provider-Stimme überschreiben können:

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
- Parst direktes JSON, eingezäuntes JSON oder inline gesetzte `"spoken"`-Schlüssel.
- Fällt auf Klartext zurück und entfernt wahrscheinliche Planungs-/Meta-Einleitungsabsätze.

Dadurch bleibt die gesprochene Wiedergabe auf anruferseitigen Text fokussiert und verhindert,
dass Planungstext in Audio gelangt.

### Startverhalten von Konversationen

Bei ausgehenden `conversation`-Anrufen ist die Behandlung der ersten Nachricht an den Live-
Wiedergabestatus gebunden:

- Barge-in-Warteschlangenleerung und automatische Antwort werden nur unterdrückt, während die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die anfängliche Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming startet beim Stream-Verbindungsaufbau ohne zusätzliche Verzögerung.
- Barge-in bricht aktive Wiedergabe ab und leert eingereihte, aber noch nicht wiedergegebene Twilio-TTS-Einträge. Geleerte Einträge werden als übersprungen aufgelöst, sodass nachgelagerte Antwortlogik fortfahren kann, ohne auf Audio zu warten, das nie abgespielt wird.
- Echtzeit-Sprachkonversationen verwenden den eigenen Eröffnungs-Turn des Echtzeit-Streams. Voice Call sendet für diese anfängliche Nachricht **kein** Legacy-`<Say>`-TwiML-Update, sodass ausgehende `<Connect><Stream>`-Sitzungen verbunden bleiben.

### Karenzzeit bei Twilio-Stream-Trennung

Wenn ein Twilio-Mediastream getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn sich der Stream innerhalb dieses Zeitfensters erneut verbindet, wird das automatische Beenden abgebrochen.
- Wenn sich nach der Karenzzeit kein Stream erneut registriert, wird der Anruf beendet, um hängengebliebene aktive Anrufe zu verhindern.

## Reaper für veraltete Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die nie einen abschließenden
Webhook erhalten (z. B. Notify-Mode-Anrufe, die nie abgeschlossen werden). Der Standardwert
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

Wenn sich ein Proxy oder Tunnel vor dem Gateway befindet, rekonstruiert das Plugin
die öffentliche URL für die Signaturprüfung. Diese Optionen steuern, welchen
weitergeleiteten Headern vertraut wird:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Zulässige Hosts aus Weiterleitungs-Headern.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Weitergeleiteten Headern ohne Allowlist vertrauen.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Weitergeleiteten Headern nur vertrauen, wenn die Remote-IP der Anfrage mit der Liste übereinstimmt.
</ParamField>

Zusätzliche Schutzmaßnahmen:

- Webhook-**Replay-Schutz** ist für Twilio und Plivo aktiviert. Erneut gesendete gültige Webhook-Anfragen werden bestätigt, aber für Seiteneffekte übersprungen.
- Twilio-Konversationsdurchläufe enthalten ein Token pro Durchlauf in `<Gather>`-Callbacks, sodass veraltete oder erneut gesendete Sprach-Callbacks keinen neueren ausstehenden Transkriptdurchlauf erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die vom Provider benötigten Signatur-Header fehlen.
- Der Voice-Call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden) plus eine pro-IP-Begrenzung laufender Anfragen vor der Signaturprüfung.

Beispiel mit stabilem öffentlichen Host:

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

Wenn das Gateway bereits ausgeführt wird, delegieren operative `voicecall`-Befehle
an die vom Gateway verwaltete Voice-Call-Laufzeit, damit die CLI keinen zweiten
Webhook-Server bindet. Wenn kein Gateway erreichbar ist, fallen die Befehle auf eine
eigenständige CLI-Laufzeit zurück.

`latency` liest `calls.jsonl` aus dem Standardspeicherpfad für Voice Call.
Verwenden Sie `--file <path>`, um auf ein anderes Protokoll zu verweisen, und `--last <n>`, um die
Analyse auf die letzten N Datensätze zu begrenzen (Standard 200). Die Ausgabe enthält p50/p90/p99
für Durchlauflatenz und Listen-Wait-Zeiten.

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

Dieses Repo liefert eine passende Skill-Dokumentation unter `skills/voice-call/SKILL.md`.

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
sollten `voicecall.dtmf` verwenden, nachdem der Anruf existiert, wenn sie Ziffern
nach dem Verbindungsaufbau benötigen.

## Problembehandlung

### Einrichtung schlägt bei der Webhook-Erreichbarkeit fehl

Führen Sie die Einrichtung aus derselben Umgebung aus, in der auch das Gateway läuft:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Für `twilio`, `telnyx` und `plivo` muss `webhook-exposure` grün sein. Eine
konfigurierte `publicUrl` schlägt weiterhin fehl, wenn sie auf lokalen oder privaten Netzwerkraum
zeigt, weil der Carrier diese Adressen nicht zurückrufen kann. Verwenden Sie nicht
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` als `publicUrl`.

Ausgehende Twilio-Aufrufe im Notify-Modus senden ihr anfängliches `<Say>`-TwiML direkt in
der Create-Call-Anfrage, sodass die erste gesprochene Nachricht nicht davon abhängt, dass Twilio
Webhook-TwiML abruft. Ein öffentlicher Webhook ist weiterhin für Status-Callbacks,
Konversationsanrufe, Pre-Connect-DTMF, Echtzeitstreams und Anrufsteuerung nach dem Verbindungsaufbau
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

Prüfen Sie den ausgewählten Provider und die erforderlichen Anmeldedatenfelder:

- Twilio: `twilio.accountSid`, `twilio.authToken` und `fromNumber` oder
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` und `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` und
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` und `fromNumber`.

Anmeldedaten müssen auf dem Gateway-Host vorhanden sein. Das Bearbeiten eines lokalen Shell-Profils wirkt sich
nicht auf ein bereits laufendes Gateway aus, bis es neu gestartet wird oder seine
Umgebung neu lädt.

### Anrufe starten, aber Provider-Webhooks kommen nicht an

Bestätigen Sie, dass die Provider-Konsole auf die exakte öffentliche Webhook-URL zeigt:

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
- Firewall oder DNS routen den öffentlichen Hostnamen an einen anderen Ort als das Gateway.
- Das Gateway wurde ohne aktiviertes Voice-Call-Plugin neu gestartet.

Wenn ein Reverse Proxy oder Tunnel vor dem Gateway steht, setzen Sie
`webhookSecurity.allowedHosts` auf den öffentlichen Hostnamen oder verwenden Sie
`webhookSecurity.trustedProxyIPs` für eine bekannte Proxy-Adresse. Verwenden Sie
`webhookSecurity.trustForwardingHeaders` nur, wenn die Proxy-Grenze unter
Ihrer Kontrolle steht.

### Signaturprüfung schlägt fehl

Provider-Signaturen werden gegen die öffentliche URL geprüft, die OpenClaw aus
der eingehenden Anfrage rekonstruiert. Wenn Signaturen fehlschlagen:

- Bestätigen Sie, dass die Provider-Webhook-URL exakt mit `publicUrl` übereinstimmt, einschließlich
  Schema, Host und Pfad.
- Aktualisieren Sie bei ngrok-URLs im Free-Tier `publicUrl`, wenn sich der Tunnel-Hostname ändert.
- Stellen Sie sicher, dass der Proxy die ursprünglichen Host- und Proto-Header beibehält, oder konfigurieren Sie
  `webhookSecurity.allowedHosts`.
- Aktivieren Sie `skipSignatureVerification` nicht außerhalb lokaler Tests.

### Google-Meet-Twilio-Beitritte schlagen fehl

Google Meet verwendet dieses Plugin für Twilio-Einwahlbeitritte. Überprüfen Sie zuerst Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Überprüfen Sie dann den Google-Meet-Transport ausdrücklich:

```bash
openclaw googlemeet setup --transport twilio
```

Wenn Voice Call grün ist, der Meet-Teilnehmer aber nie beitritt, prüfen Sie die Meet-
Einwahlnummer, PIN und `--dtmf-sequence`. Der Telefonanruf kann fehlerfrei sein, während
das Meeting eine falsche DTMF-Sequenz ablehnt oder ignoriert.

Google Meet übergibt die Meet-DTMF-Sequenz und den Einführungstext an `voicecall.start`.
Bei Twilio-Anrufen stellt Voice Call zuerst das DTMF-TwiML bereit, leitet zurück an den
Webhook und öffnet dann den Echtzeit-Medienstream, sodass die gespeicherte Einführung erzeugt wird,
nachdem der Telefonteilnehmer dem Meeting beigetreten ist.

Verwenden Sie `openclaw logs --follow` für die Live-Phasenablaufverfolgung. Ein fehlerfreier Twilio-Meet-
Beitritt protokolliert diese Reihenfolge:

- Google Meet delegiert den Twilio-Beitritt an Voice Call.
- Voice Call speichert Pre-Connect-DTMF-TwiML.
- Das anfängliche Twilio-TwiML wird verbraucht und vor der Echtzeitverarbeitung bereitgestellt.
- Voice Call stellt Echtzeit-TwiML für den Twilio-Anruf bereit.
- Die Echtzeit-Bridge startet mit der anfänglichen Begrüßung in der Warteschlange.

`openclaw voicecall tail` zeigt weiterhin persistierte Anrufdatensätze; es ist nützlich für
Anrufstatus und Transkripte, aber nicht jeder Webhook-/Echtzeitübergang erscheint
dort.

### Echtzeitanruf hat keine Sprache

Bestätigen Sie, dass nur ein Audiomodus aktiviert ist. `realtime.enabled` und
`streaming.enabled` können nicht beide `true` sein.

Prüfen Sie bei Echtzeit-Twilio-Anrufen außerdem:

- Ein Echtzeit-Provider-Plugin ist geladen und registriert.
- `realtime.provider` ist nicht gesetzt oder benennt einen registrierten Provider.
- Der Provider-API-Schlüssel ist für den Gateway-Prozess verfügbar.
- `openclaw logs --follow` zeigt, dass Echtzeit-TwiML bereitgestellt wurde, die Echtzeit-Bridge
  gestartet ist und die anfängliche Begrüßung in die Warteschlange gestellt wurde.

## Verwandte Themen

- [Sprechmodus](/de/nodes/talk)
- [Text-zu-Sprache](/de/tools/tts)
- [Voice Wake](/de/nodes/voicewake)
