---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf von OpenClaw aus tätigen.
    - Sie konfigurieren oder entwickeln das voice-call-Plugin.
summary: 'Voice-Call-Plugin: ausgehende + eingehende Anrufe über Twilio/Telnyx/Plivo (Plugin-Installation + Konfiguration + CLI)'
title: Voice-Call-Plugin
x-i18n:
    generated_at: "2026-04-24T09:51:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen und
mehrzügige Gespräche mit Richtlinien für eingehende Anrufe.

Aktuelle Anbieter:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML-Weiterleitung + GetInput-Sprache)
- `mock` (Entwicklung/ohne Netzwerk)

Kurzes mentales Modell:

- Plugin installieren
- Gateway neu starten
- Unter `plugins.entries.voice-call.config` konfigurieren
- `openclaw voicecall ...` oder das Tool `voice_call` verwenden

## Wo es ausgeführt wird (lokal vs. remote)

Das Voice-Call-Plugin läuft **innerhalb des Gateway-Prozesses**.

Wenn Sie ein entferntes Gateway verwenden, installieren/konfigurieren Sie das Plugin auf dem **Rechner, auf dem das Gateway läuft**, und starten Sie dann das Gateway neu, damit es geladen wird.

## Installation

### Option A: aus npm installieren (empfohlen)

```bash
openclaw plugins install @openclaw/voice-call
```

Starten Sie das Gateway anschließend neu.

### Option B: aus einem lokalen Ordner installieren (Entwicklung, ohne Kopieren)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Starten Sie das Gateway anschließend neu.

## Konfiguration

Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // oder "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // oder TWILIO_FROM_NUMBER für Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Öffentlicher Telnyx-Webhookschlüssel aus dem Telnyx Mission Control Portal
            // (Base64-Zeichenfolge; kann auch über TELNYX_PUBLIC_KEY gesetzt werden).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook-Server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook-Sicherheit (empfohlen für Tunnel/Proxys)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Öffentliche Bereitstellung (eine auswählen)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; erster registrierter Echtzeit-Transkriptionsanbieter, wenn nicht gesetzt
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional, wenn OPENAI_API_KEY gesetzt ist
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

          realtime: {
            enabled: false,
            provider: "google", // optional; erster registrierter Echtzeit-Sprachanbieter, wenn nicht gesetzt
            providers: {
              google: {
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

Hinweise:

- Twilio/Telnyx erfordern eine **öffentlich erreichbare** Webhook-URL.
- Plivo erfordert eine **öffentlich erreichbare** Webhook-URL.
- `mock` ist ein lokaler Entwicklungsanbieter (ohne Netzwerkaufrufe).
- Wenn ältere Konfigurationen noch `provider: "log"`, `twilio.from` oder veraltete `streaming.*`-OpenAI-Schlüssel verwenden, führen Sie `openclaw doctor --fix` aus, um sie umzuschreiben.
- Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht auf true gesetzt ist.
- `skipSignatureVerification` ist nur für lokale Tests gedacht.
- Wenn Sie die kostenlose ngrok-Stufe verwenden, setzen Sie `publicUrl` auf die genaue ngrok-URL; die Signaturprüfung wird immer erzwungen.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` und `serve.bind` auf local loopback gesetzt ist (lokaler ngrok-Agent). Nur für lokale Entwicklung verwenden.
- URLs der kostenlosen ngrok-Stufe können sich ändern oder Zwischenbildschirm-Verhalten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Für die Produktion sollte eine stabile Domain oder Tailscale funnel bevorzugt werden.
- `realtime.enabled` startet vollständige Sprache-zu-Sprache-Gespräche; aktivieren Sie dies nicht zusammen mit `streaming.enabled`.
- Standards für Streaming-Sicherheit:
  - `streaming.preStartTimeoutMs` schließt Sockets, die niemals einen gültigen `start`-Frame senden.
- `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Verbindungen vor dem Start.
- `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Verbindungen vor dem Start pro Quell-IP.
- `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).
- Die Laufzeit-Fallbacklogik akzeptiert diese alten voice-call-Schlüssel vorerst weiterhin, aber der Umschreibpfad ist `openclaw doctor --fix` und der Kompatibilitätsshims ist nur vorübergehend.

## Realtime-Sprachgespräche

`realtime` wählt einen vollduplexfähigen Realtime-Sprachanbieter für Live-Anrufaudio aus.
Es ist getrennt von `streaming`, das Audio nur an Realtime-Transkriptionsanbieter
weiterleitet.

Aktuelles Laufzeitverhalten:

- `realtime.enabled` wird für Twilio Media Streams unterstützt.
- `realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden.
- `realtime.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten
  registrierten Realtime-Sprachanbieter.
- Gebündelte Realtime-Sprachanbieter umfassen Google Gemini Live (`google`) und
  OpenAI (`openai`), registriert durch ihre Anbieter-Plugins.
- Anbieter-eigene Rohkonfiguration liegt unter `realtime.providers.<providerId>`.
- Wenn `realtime.provider` auf einen nicht registrierten Anbieter zeigt oder überhaupt kein Realtime-
  Sprachanbieter registriert ist, protokolliert Voice Call eine Warnung und überspringt
  Realtime-Medien, anstatt das gesamte Plugin fehlschlagen zu lassen.

Google Gemini Live-Standardwerte für Realtime:

- API-Schlüssel: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` oder
  `GOOGLE_GENERATIVE_AI_API_KEY`
- Modell: `gemini-2.5-flash-native-audio-preview-12-2025`
- Stimme: `Kore`

Beispiel:

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
            instructions: "Sprechen Sie kurz und fragen Sie, bevor Sie Tools verwenden.",
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

Stattdessen OpenAI verwenden:

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
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Siehe [Google-Anbieter](/de/providers/google) und [OpenAI-Anbieter](/de/providers/openai)
für anbieterspezifische Realtime-Sprachoptionen.

## Streaming-Transkription

`streaming` wählt einen Realtime-Transkriptionsanbieter für Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten
  registrierten Realtime-Transkriptionsanbieter.
- Gebündelte Realtime-Transkriptionsanbieter umfassen Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI
  (`xai`), registriert durch ihre Anbieter-Plugins.
- Anbieter-eigene Rohkonfiguration liegt unter `streaming.providers.<providerId>`.
- Wenn `streaming.provider` auf einen nicht registrierten Anbieter zeigt oder überhaupt kein Realtime-
  Transkriptionsanbieter registriert ist, protokolliert Voice Call eine Warnung und
  überspringt Medien-Streaming, anstatt das gesamte Plugin fehlschlagen zu lassen.

OpenAI-Standardwerte für Streaming-Transkription:

- API-Schlüssel: `streaming.providers.openai.apiKey` oder `OPENAI_API_KEY`
- Modell: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI-Standardwerte für Streaming-Transkription:

- API-Schlüssel: `streaming.providers.xai.apiKey` oder `XAI_API_KEY`
- Endpunkt: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Beispiel:

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
                apiKey: "sk-...", // optional, wenn OPENAI_API_KEY gesetzt ist
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

Stattdessen xAI verwenden:

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
                apiKey: "${XAI_API_KEY}", // optional, wenn XAI_API_KEY gesetzt ist
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

Veraltete Schlüssel werden weiterhin automatisch durch `openclaw doctor --fix` migriert:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Bereinigung veralteter Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die niemals einen terminalen Webhook erhalten
(zum Beispiel Anrufe im Benachrichtigungsmodus, die nie abgeschlossen werden). Der Standardwert ist `0`
(deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für notify-artige Abläufe.
- Halten Sie diesen Wert **höher als `maxDurationSeconds`**, damit normale Anrufe
  abgeschlossen werden können. Ein guter Ausgangswert ist `maxDurationSeconds + 30–60` Sekunden.

Beispiel:

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

Wenn ein Proxy oder Tunnel vor dem Gateway sitzt, rekonstruiert das Plugin die
öffentliche URL für die Signaturprüfung. Diese Optionen steuern, welchen weitergeleiteten
Headern vertraut wird.

`webhookSecurity.allowedHosts` setzt Hosts aus Weiterleitungs-Headern auf eine Allowlist.

`webhookSecurity.trustForwardingHeaders` vertraut weitergeleiteten Headern ohne Allowlist.

`webhookSecurity.trustedProxyIPs` vertraut weitergeleiteten Headern nur dann, wenn die
Remote-IP der Anfrage mit der Liste übereinstimmt.

Webhook-Wiedergabeschutz ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-
Anfragen werden bestätigt, aber für Nebenwirkungen übersprungen.

Twilio-Konversationszüge enthalten ein Token pro Zug in `<Gather>`-Callbacks, sodass
veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkriptionszug erfüllen können.

Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgewiesen, wenn die
erforderlichen Signatur-Header des Anbieters fehlen.

Der voice-call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden)
plus eine laufende Obergrenze pro IP vor der Signaturprüfung.

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

## TTS für Anrufe

Voice Call verwendet die zentrale Konfiguration `messages.tts` für
gestreamte Sprache bei Anrufen. Sie können sie unter der Plugin-Konfiguration mit
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

Hinweise:

- Veraltete `tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden beim Laden automatisch nach `tts.providers.<provider>` migriert. Bevorzugen Sie die Struktur `providers` in eingecheckter Konfiguration.
- **Microsoft speech wird für Sprachanrufe ignoriert** (Telefonie-Audio benötigt PCM; der aktuelle Microsoft-Transport stellt keine PCM-Ausgabe für Telefonie bereit).
- Zentrales TTS wird verwendet, wenn Twilio-Medienstreaming aktiviert ist; andernfalls greifen Anrufe auf native Stimmen des Anbieters zurück.
- Wenn bereits ein Twilio-Medienstream aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, anstatt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Anbieter zurückfällt, protokolliert Voice Call eine Warnung mit der Anbieterkette (`from`, `to`, `attempts`) zur Fehlersuche.

### Weitere Beispiele

Nur zentrales TTS verwenden (ohne Überschreibung):

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

Nur für Anrufe auf ElevenLabs überschreiben (zentralen Standard anderswo beibehalten):

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

Nur das OpenAI-Modell für Anrufe überschreiben (Deep-Merge-Beispiel):

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

## Eingehende Anrufe

Die Richtlinie für eingehende Anrufe ist standardmäßig auf `disabled` gesetzt. Um eingehende Anrufe zu aktivieren, setzen Sie:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hallo! Wie kann ich helfen?",
}
```

`inboundPolicy: "allowlist"` ist eine Anrufer-ID-Prüfung mit geringer Sicherheit. Das Plugin
normalisiert den vom Anbieter gelieferten Wert `From` und vergleicht ihn mit `allowFrom`.
Die Webhook-Prüfung authentifiziert die Zustellung durch den Anbieter und die Integrität der Nutzlast,
beweist aber nicht die Inhaberschaft der PSTN-/VoIP-Anrufernummer. Behandeln Sie `allowFrom` als
Anrufer-ID-Filterung, nicht als starke Anruferidentität.

Automatische Antworten verwenden das Agent-System. Abstimmung mit:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für gesprochene Ausgabe an den System-Prompt an:

- `{"spoken":"..."}`

Voice Call extrahiert dann den Sprachtext defensiv:

- Ignoriert Nutzlasten, die als Reasoning-/Fehlerinhalt markiert sind.
- Parst direktes JSON, JSON in Codeblöcken oder Inline-Schlüssel `"spoken"`.
- Fällt auf Klartext zurück und entfernt wahrscheinliche Einleitungsabsätze mit Planung/Meta-Inhalten.

So bleibt die gesprochene Wiedergabe auf an den Anrufer gerichteten Text fokussiert und vermeidet, dass Planungstext in das Audio gelangt.

### Verhalten beim Gesprächsstart

Bei ausgehenden Anrufen im Modus `conversation` ist die Verarbeitung der ersten Nachricht an den Status der Live-Wiedergabe gebunden:

- Das Leeren der Barge-in-Warteschlange und die automatische Antwort werden nur unterdrückt, während die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die erste Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming startet bei der Stream-Verbindung ohne zusätzliche Verzögerung.

### Kulanzzeit bei Twilio-Stream-Trennung

Wenn ein Twilio-Medienstream getrennt wird, wartet Voice Call `2000ms`, bevor der Anruf automatisch beendet wird:

- Wenn der Stream innerhalb dieses Zeitfensters erneut verbunden wird, wird die automatische Beendigung abgebrochen.
- Wenn nach Ablauf der Kulanzzeit kein Stream erneut registriert wird, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # Alias für call
openclaw voicecall continue --call-id <id> --message "Irgendwelche Fragen?"
openclaw voicecall speak --call-id <id> --message "Einen Moment bitte"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # Zuglatenz aus Protokollen zusammenfassen
openclaw voicecall expose --mode funnel
```

`latency` liest `calls.jsonl` aus dem standardmäßigen voice-call-Speicherpfad. Verwenden Sie
`--file <path>`, um auf ein anderes Protokoll zu zeigen, und `--last <n>`, um die Analyse
auf die letzten N Einträge zu begrenzen (Standard 200). Die Ausgabe enthält p50/p90/p99 für Zuglatenz
und Listen-Wartezeiten.

## Agent-Tool

Tool-Name: `voice_call`

Aktionen:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Dieses Repo enthält ein passendes Skill-Dokument unter `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Verwandt

- [Text-to-Speech](/de/tools/tts)
- [Talk-Modus](/de/nodes/talk)
- [Voice Wake](/de/nodes/voicewake)
