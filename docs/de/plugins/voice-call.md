---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf von OpenClaw aus tätigen
    - Sie konfigurieren oder entwickeln das Voice-Call-Plugin
summary: 'Voice-Call-Plugin: ausgehende + eingehende Anrufe über Twilio/Telnyx/Plivo (Plugin-Installation + Konfiguration + CLI)'
title: Voice-Call-Plugin
x-i18n:
    generated_at: "2026-04-23T06:33:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen und
Mehrturn-Unterhaltungen mit eingehenden Richtlinien.

Aktuelle Provider:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML-Transfer + GetInput-Sprache)
- `mock` (Entwicklung/kein Netzwerk)

Kurzes Modell:

- Plugin installieren
- Gateway neu starten
- Unter `plugins.entries.voice-call.config` konfigurieren
- `openclaw voicecall ...` oder das Tool `voice_call` verwenden

## Wo es läuft (lokal vs. remote)

Das Voice-Call-Plugin läuft **innerhalb des Gateway-Prozesses**.

Wenn Sie ein Remote-Gateway verwenden, installieren/konfigurieren Sie das Plugin auf dem **Rechner, auf dem das Gateway läuft**, und starten Sie dann das Gateway neu, damit es geladen wird.

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

Setzen Sie die Konfiguration unter `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // oder "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Öffentlicher Webhook-Schlüssel von Telnyx aus dem Telnyx Mission Control Portal
            // (Base64-String; kann auch über TELNYX_PUBLIC_KEY gesetzt werden).
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
            provider: "openai", // optional; erster registrierter Provider für Echtzeittranskription, wenn nicht gesetzt
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
        },
      },
    },
  },
}
```

Hinweise:

- Twilio/Telnyx erfordern eine **öffentlich erreichbare** Webhook-URL.
- Plivo erfordert eine **öffentlich erreichbare** Webhook-URL.
- `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
- Wenn ältere Konfigurationen noch `provider: "log"`, `twilio.from` oder Legacy-OpenAI-Schlüssel unter `streaming.*` verwenden, führen Sie `openclaw doctor --fix` aus, um sie umzuschreiben.
- Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht auf true gesetzt ist.
- `skipSignatureVerification` ist nur für lokale Tests gedacht.
- Wenn Sie die kostenlose Stufe von ngrok verwenden, setzen Sie `publicUrl` auf die exakte ngrok-URL; die Signaturprüfung wird immer erzwungen.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` und `serve.bind` Loopback ist (lokaler ngrok-Agent). Nur für lokale Entwicklung verwenden.
- URLs der kostenlosen ngrok-Stufe können sich ändern oder Interstitial-Verhalten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Für Produktion bevorzugen Sie eine stabile Domain oder Tailscale funnel.
- Standards für Streaming-Sicherheit:
  - `streaming.preStartTimeoutMs` schließt Sockets, die niemals einen gültigen `start`-Frame senden.
- `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Pre-Start-Sockets.
- `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Pre-Start-Sockets pro Quell-IP.
- `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).
- Das Laufzeit-Fallback akzeptiert diese alten voice-call-Schlüssel vorerst weiterhin, aber der Umschreibpfad ist `openclaw doctor --fix`, und das Kompatibilitäts-Shim ist nur vorübergehend.

## Streaming-Transkription

`streaming` wählt einen Provider für Echtzeittranskription für Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten
  registrierten Provider für Echtzeittranskription.
- Gebündelte Provider für Echtzeittranskription umfassen Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI
  (`xai`), registriert von ihren Provider-Plugins.
- Provider-eigene Rohkonfiguration liegt unter `streaming.providers.<providerId>`.
- Wenn `streaming.provider` auf einen nicht registrierten Provider zeigt oder überhaupt kein Provider
  für Echtzeittranskription registriert ist, protokolliert Voice Call eine Warnung und
  überspringt Media-Streaming, statt das gesamte Plugin fehlschlagen zu lassen.

Standards für OpenAI-Streaming-Transkription:

- API-Schlüssel: `streaming.providers.openai.apiKey` oder `OPENAI_API_KEY`
- Modell: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Standards für xAI-Streaming-Transkription:

- API-Schlüssel: `streaming.providers.xai.apiKey` oder `XAI_API_KEY`
- Endpoint: `wss://api.x.ai/v1/stt`
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

Legacy-Schlüssel werden weiterhin automatisch durch `openclaw doctor --fix` migriert:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Reaper für veraltete Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die niemals einen terminalen Webhook erhalten
(zum Beispiel Anrufe im Benachrichtigungsmodus, die nie abgeschlossen werden). Der Standard ist `0`
(deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Abläufe im Stil von Benachrichtigungen.
- Halten Sie diesen Wert **höher als `maxDurationSeconds`**, damit normale Anrufe
  beendet werden können. Ein guter Startwert ist `maxDurationSeconds + 30–60` Sekunden.

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

`webhookSecurity.allowedHosts` setzt eine Allowlist für Hosts aus Weiterleitungsheadern.

`webhookSecurity.trustForwardingHeaders` vertraut weitergeleiteten Headern ohne Allowlist.

`webhookSecurity.trustedProxyIPs` vertraut weitergeleiteten Headern nur dann, wenn die
Remote-IP der Anfrage mit der Liste übereinstimmt.

Webhook-Replay-Schutz ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-
Anfragen werden bestätigt, aber für Seiteneffekte übersprungen.

Twilio-Unterhaltungsturns enthalten in `<Gather>`-Callbacks ein Token pro Turn, sodass
veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkript-Turn erfüllen können.

Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die
erforderlichen Signaturheader des Providers fehlen.

Der voice-call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden)
plus eine laufende Begrenzung pro IP vor der Signaturprüfung.

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

## TTS für Anrufe

Voice Call verwendet die Core-Konfiguration `messages.tts` für
Streaming-Sprache bei Anrufen. Sie können sie unter der Plugin-Konfiguration mit derselben
**Form** überschreiben — sie wird per Deep-Merge mit `messages.tts` zusammengeführt.

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

- Legacy-Schlüssel `tts.<provider>` innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden beim Laden automatisch nach `tts.providers.<provider>` migriert. Bevorzugen Sie in committeter Konfiguration die Form `providers`.
- **Microsoft speech wird für Sprachanrufe ignoriert** (Telefonieaudio benötigt PCM; der aktuelle Microsoft-Transport stellt keine PCM-Ausgabe für Telefonie bereit).
- Core-TTS wird verwendet, wenn Twilio-Media-Streaming aktiviert ist; andernfalls greifen Anrufe auf native Stimmen des Providers zurück.
- Wenn bereits ein Twilio-Media-Stream aktiv ist, greift Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanfrage fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call zur Fehleranalyse eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).

### Weitere Beispiele

Nur Core-TTS verwenden (keine Überschreibung):

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

Nur für Anrufe auf ElevenLabs überschreiben (Core-Standard anderweitig beibehalten):

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

Nur das OpenAI-Modell für Anrufe überschreiben (Beispiel für Deep-Merge):

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

Die Richtlinie für eingehende Anrufe ist standardmäßig `disabled`. Um eingehende Anrufe zu aktivieren, setzen Sie:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hallo! Wie kann ich helfen?",
}
```

`inboundPolicy: "allowlist"` ist nur eine Filterung der Anruferkennung mit geringer Sicherheit. Das Plugin
normalisiert den vom Provider gelieferten Wert `From` und vergleicht ihn mit `allowFrom`.
Die Webhook-Verifikation authentifiziert die Zustellung durch den Provider und die Integrität der Payload,
beweist aber nicht die Eigentümerschaft an der PSTN-/VoIP-Anrufernummer. Behandeln Sie `allowFrom` als
Filterung nach Anruferkennung, nicht als starke Identität des Anrufers.

Automatische Antworten verwenden das Agent-System. Feinabstimmung über:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call an den System-Prompt einen strikten Vertrag für gesprochene Ausgabe an:

- `{"spoken":"..."}`

Voice Call extrahiert den Sprachtext dann defensiv:

- Ignoriert Payloads, die als reasoning-/Fehlerinhalt markiert sind.
- Parst direktes JSON, JSON in Fenced-Blöcken oder Inline-Schlüssel `"spoken"`.
- Greift auf Klartext zurück und entfernt wahrscheinliche einleitende Absätze mit Planung/Metainhalt.

Dadurch bleibt die gesprochene Wiedergabe auf anruferseitigen Text fokussiert und verhindert, dass Planungstext in das Audio gelangt.

### Startverhalten bei Unterhaltungen

Bei ausgehenden Anrufen im Modus `conversation` ist die Behandlung der ersten Nachricht an den Status der Live-Wiedergabe gebunden:

- Das Leeren der Barge-in-Warteschlange und automatische Antworten werden nur unterdrückt, solange die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die anfängliche Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming startet bei Verbindung des Streams ohne zusätzliche Verzögerung.

### Grace bei Trennung des Twilio-Streams

Wenn ein Twilio-Media-Stream getrennt wird, wartet Voice Call `2000ms`, bevor der Anruf automatisch beendet wird:

- Wenn sich der Stream in diesem Fenster erneut verbindet, wird das automatische Beenden abgebrochen.
- Wenn nach der Grace-Periode kein Stream erneut registriert wird, wird der Anruf beendet, um festhängende aktive Anrufe zu verhindern.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # Alias für call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # Turn-Latenz aus Protokollen zusammenfassen
openclaw voicecall expose --mode funnel
```

`latency` liest `calls.jsonl` aus dem Standard-Speicherpfad von voice-call. Verwenden Sie
`--file <path>`, um auf ein anderes Protokoll zu zeigen, und `--last <n>`, um die Analyse
auf die letzten N Datensätze zu begrenzen (Standard 200). Die Ausgabe enthält p50/p90/p99 für die Turn-
Latenz und Listen-Wait-Zeiten.

## Agent-Tool

Tool-Name: `voice_call`

Aktionen:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Dieses Repo enthält ein passendes Skill-Dokument unter `skills/voice-call/SKILL.md`.

## Gateway-RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
