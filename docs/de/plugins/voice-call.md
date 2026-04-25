---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf von OpenClaw aus starten.
    - Sie konfigurieren oder entwickeln das Voice-Call-Plugin.
summary: 'Voice-Call-Plugin: ausgehende + eingehende Anrufe über Twilio/Telnyx/Plivo (Plugin-Installation + Konfiguration + CLI)'
title: Voice-Call-Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen und
mehrzügige Konversationen mit Richtlinien für eingehende Anrufe.

Aktuelle Anbieter:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML-Weiterleitung + GetInput-Spracherkennung)
- `mock` (Entwicklung/ohne Netzwerk)

Kurzes mentales Modell:

- Plugin installieren
- Gateway neu starten
- Unter `plugins.entries.voice-call.config` konfigurieren
- `openclaw voicecall ...` oder das Tool `voice_call` verwenden

## Wo es läuft (lokal vs. remote)

Das Voice Call Plugin läuft **innerhalb des Gateway-Prozesses**.

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
            // Öffentlicher Telnyx-Webhook-Schlüssel aus dem Telnyx Mission Control Portal
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

          // Öffentliche Erreichbarkeit (eine Option auswählen)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; erster registrierter Anbieter für Echtzeit-Transkription, wenn nicht gesetzt
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
            toolPolicy: "safe-read-only",
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

Prüfen Sie die Einrichtung, bevor Sie mit einem echten Anbieter testen:

```bash
openclaw voicecall setup
```

Die Standardausgabe ist in Chat-Protokollen und Terminalsitzungen gut lesbar. Sie prüft,
ob das Plugin aktiviert ist, ob Anbieter und Anmeldedaten vorhanden sind, ob die Webhook-
Erreichbarkeit konfiguriert ist und ob nur ein Audiomodus aktiv ist. Verwenden Sie
`openclaw voicecall setup --json` für Skripte.

Für Twilio, Telnyx und Plivo muss die Einrichtung zu einer öffentlichen Webhook-URL aufgelöst werden. Wenn die
konfigurierte `publicUrl`, Tunnel-URL, Tailscale-URL oder das `serve`-Fallback auf
Loopback oder privaten Netzwerkraum aufgelöst wird, schlägt die Einrichtung fehl, statt einen Anbieter zu starten,
der keine echten Carrier-Webhooks empfangen kann.

Für einen vorhersehbaren Smoke-Test führen Sie Folgendes aus:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Der zweite Befehl ist weiterhin ein Dry Run. Fügen Sie `--yes` hinzu, um einen kurzen ausgehenden
Benachrichtigungsanruf zu platzieren:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Hinweise:

- Twilio/Telnyx erfordern eine **öffentlich erreichbare** Webhook-URL.
- Plivo erfordert eine **öffentlich erreichbare** Webhook-URL.
- `mock` ist ein lokaler Entwicklungsanbieter (keine Netzwerkaufrufe).
- Wenn ältere Konfigurationen noch `provider: "log"`, `twilio.from` oder veraltete `streaming.*`-OpenAI-Schlüssel verwenden, führen Sie `openclaw doctor --fix` aus, um sie umzuschreiben.
- Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), es sei denn, `skipSignatureVerification` ist true.
- `skipSignatureVerification` ist nur für lokale Tests gedacht.
- Wenn Sie die kostenlose ngrok-Stufe verwenden, setzen Sie `publicUrl` auf die exakte ngrok-URL; die Signaturprüfung wird immer erzwungen.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` und `serve.bind` Loopback ist (lokaler ngrok-Agent). Nur für lokale Entwicklung verwenden.
- URLs der kostenlosen ngrok-Stufe können sich ändern oder Interstitial-Verhalten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Für die Produktion bevorzugen Sie eine stabile Domain oder Tailscale funnel.
- `realtime.enabled` startet vollständige Voice-to-Voice-Konversationen; aktivieren Sie es nicht zusammen mit `streaming.enabled`.
- Standardwerte für die Streaming-Sicherheit:
  - `streaming.preStartTimeoutMs` schließt Sockets, die nie einen gültigen `start`-Frame senden.
- `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Sockets vor dem Start.
- `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Sockets vor dem Start pro Quell-IP.
- `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).
- Das Laufzeit-Fallback akzeptiert diese alten voice-call-Schlüssel derzeit noch, aber der Umschreibpfad ist `openclaw doctor --fix`, und der Kompatibilitäts-Shim ist nur vorübergehend.

## Echtzeit-Sprachkonversationen

`realtime` wählt einen vollduplexfähigen Echtzeit-Sprachanbieter für Live-Anrufaudio aus.
Es ist getrennt von `streaming`, das Audio nur an Anbieter für
Echtzeit-Transkription weiterleitet.

Aktuelles Laufzeitverhalten:

- `realtime.enabled` wird für Twilio Media Streams unterstützt.
- `realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden.
- `realtime.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten
  registrierten Echtzeit-Sprachanbieter.
- Gebündelte Echtzeit-Sprachanbieter umfassen Google Gemini Live (`google`) und
  OpenAI (`openai`), registriert durch ihre Anbieter-Plugins.
- Rohkonfigurationen, die dem Anbieter gehören, befinden sich unter `realtime.providers.<providerId>`.
- Voice Call stellt standardmäßig das gemeinsame Echtzeit-Tool `openclaw_agent_consult` bereit. Das
  Echtzeitmodell kann es aufrufen, wenn der Anrufer nach tiefergehender
  Argumentation, aktuellen Informationen oder normalen OpenClaw-Tools fragt.
- `realtime.toolPolicy` steuert den Consult-Lauf:
  - `safe-read-only`: das Consult-Tool wird verfügbar gemacht, und der reguläre Agent wird
    auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und
    `memory_get` beschränkt.
  - `owner`: das Consult-Tool wird verfügbar gemacht, und der reguläre Agent verwendet die normale
    Tool-Richtlinie des Agenten.
  - `none`: das Consult-Tool wird nicht verfügbar gemacht. Benutzerdefinierte `realtime.tools` werden weiterhin
    an den Echtzeit-Anbieter durchgereicht.
- Consult-Sitzungsschlüssel verwenden nach Möglichkeit die vorhandene Sprachsitzung wieder und
  greifen sonst auf die Telefonnummer des Anrufers/Angerufenen zurück, damit nachfolgende
  Consult-Aufrufe während des Gesprächs den Kontext beibehalten.
- Wenn `realtime.provider` auf einen nicht registrierten Anbieter zeigt oder überhaupt kein Echtzeit-
  Sprachanbieter registriert ist, protokolliert Voice Call eine Warnung und überspringt
  Echtzeitmedien, statt das gesamte Plugin fehlschlagen zu lassen.

Standardwerte für Google Gemini Live in Echtzeit:

- API-Schlüssel: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` oder
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

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
            instructions: "Sprechen Sie kurz. Rufen Sie openclaw_agent_consult auf, bevor Sie tiefergehende Tools verwenden.",
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
für anbieterspezifische Optionen für Echtzeit-Sprache.

## Streaming-Transkription

`streaming` wählt einen Anbieter für Echtzeit-Transkription für Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten
  registrierten Anbieter für Echtzeit-Transkription.
- Gebündelte Anbieter für Echtzeit-Transkription umfassen Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI
  (`xai`), registriert durch ihre Anbieter-Plugins.
- Rohkonfigurationen, die dem Anbieter gehören, befinden sich unter `streaming.providers.<providerId>`.
- Wenn `streaming.provider` auf einen nicht registrierten Anbieter zeigt oder überhaupt kein Anbieter für Echtzeit-
  Transkription registriert ist, protokolliert Voice Call eine Warnung und
  überspringt Medien-Streaming, statt das gesamte Plugin fehlschlagen zu lassen.

Standardwerte für OpenAI-Streaming-Transkription:

- API-Schlüssel: `streaming.providers.openai.apiKey` oder `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Standardwerte für xAI-Streaming-Transkription:

- API-Schlüssel: `streaming.providers.xai.apiKey` oder `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
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

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die nie einen terminalen Webhook erhalten
(zum Beispiel Anrufe im Benachrichtigungsmodus, die nie abgeschlossen werden). Der Standardwert ist `0`
(deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Benachrichtigungsabläufe.
- Halten Sie diesen Wert **höher als `maxDurationSeconds`**, damit normale Anrufe
  abgeschlossen werden können. Ein guter Startwert ist `maxDurationSeconds + 30–60` Sekunden.

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

Wenn sich ein Proxy oder Tunnel vor dem Gateway befindet, rekonstruiert das Plugin die
öffentliche URL für die Signaturprüfung. Diese Optionen steuern, welchen weitergeleiteten
Headern vertraut wird.

`webhookSecurity.allowedHosts` setzt eine Zulassungsliste für Hosts aus Weiterleitungs-Headern.

`webhookSecurity.trustForwardingHeaders` vertraut weitergeleiteten Headern ohne Zulassungsliste.

`webhookSecurity.trustedProxyIPs` vertraut weitergeleiteten Headern nur dann, wenn die
Remote-IP der Anfrage mit der Liste übereinstimmt.

Der Schutz vor Webhook-Wiederholungen ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-
Anfragen werden bestätigt, aber für Seiteneffekte übersprungen.

Twilio-Konversationszüge enthalten in `<Gather>`-Callbacks ein Token pro Zug, sodass
veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkriptionszug erfüllen können.

Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die
erforderlichen Signatur-Header des Anbieters fehlen.

Der Webhook von voice-call verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden)
plus eine In-Flight-Begrenzung pro IP vor der Signaturprüfung.

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
Sprachausgabe-Streaming bei Anrufen. Sie können sie unter der Plugin-Konfiguration mit der
**gleichen Struktur** überschreiben — sie wird per Deep Merge mit `messages.tts` zusammengeführt.

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

- Veraltete `tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` korrigiert; die gespeicherte Konfiguration sollte `tts.providers.<provider>` verwenden.
- **Microsoft speech wird für Anrufe ignoriert** (Telefonie-Audio benötigt PCM; der aktuelle Microsoft-Transport stellt keine PCM-Ausgabe für Telefonie bereit).
- Zentrales TTS wird verwendet, wenn Twilio-Media-Streaming aktiviert ist; andernfalls greifen Anrufe auf native Stimmen des Anbieters zurück.
- Wenn bereits ein Twilio-Media-Stream aktiv ist, greift Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanfrage fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Anbieter zurückfällt, protokolliert Voice Call zur Fehlerdiagnose eine Warnung mit der Anbieterkette (`from`, `to`, `attempts`).
- Wenn Twilio Barge-in oder das Beenden des Streams die ausstehende TTS-Warteschlange leert, werden in die Warteschlange eingereihte
  Wiedergabeanfragen abgeschlossen, statt Anrufer hängen zu lassen, die auf den Abschluss der Wiedergabe
  warten.

### Weitere Beispiele

Nur zentrales TTS verwenden (keine Überschreibung):

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

Nur für Anrufe auf ElevenLabs überschreiben (zentralen Standardwert andernorts beibehalten):

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

Die Richtlinie für eingehende Anrufe ist standardmäßig `disabled`. Um eingehende Anrufe zu aktivieren, setzen Sie:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hallo! Wie kann ich helfen?",
}
```

`inboundPolicy: "allowlist"` ist eine Prüfung der Anrufer-ID mit geringer Absicherung. Das Plugin
normalisiert den vom Anbieter gelieferten Wert `From` und vergleicht ihn mit `allowFrom`.
Die Webhook-Prüfung authentifiziert die Zustellung durch den Anbieter und die Integrität der Nutzdaten,
aber sie beweist nicht die Besitzerschaft der PSTN/VoIP-Anrufernummer. Behandeln Sie `allowFrom` als
Filterung nach Anrufer-ID, nicht als starke Anruferidentität.

Automatische Antworten verwenden das Agentensystem. Abstimmung mit:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für gesprochene Ausgabe an den System-Prompt an:

- `{"spoken":"..."}`

Voice Call extrahiert den Sprachtext dann defensiv:

- Ignoriert Nutzdaten, die als Reasoning-/Fehlerinhalte markiert sind.
- Parst direktes JSON, JSON in Codezäunen oder inline `"spoken"`-Schlüssel.
- Greift auf Klartext zurück und entfernt wahrscheinliche einleitende Absätze mit Planung/Meta-Inhalten.

Dadurch bleibt die gesprochene Wiedergabe auf anruferseitigen Text fokussiert und vermeidet, dass Planungstext in das Audio gelangt.

### Verhalten beim Start von Konversationen

Für ausgehende Anrufe im Modus `conversation` ist die Verarbeitung der ersten Nachricht an den Status der Live-Wiedergabe gebunden:

- Das Leeren der Barge-in-Warteschlange und automatische Antworten werden nur unterdrückt, solange die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die erste Nachricht bleibt zur Wiederholung in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming startet bei der Stream-Verbindung ohne zusätzliche Verzögerung.
- Barge-in bricht die aktive Wiedergabe ab und leert Twilio-TTS-Einträge, die bereits in der Warteschlange stehen, aber noch nicht abgespielt werden. Geleerte Einträge werden als übersprungen aufgelöst, sodass die nachfolgende Antwortlogik
  fortfahren kann, ohne auf Audio zu warten, das nie abgespielt wird.
- Echtzeit-Sprachkonversationen verwenden den eigenen Eröffnungszug des Echtzeit-Streams. Voice Call sendet für diese erste Nachricht kein veraltetes `<Say>`-TwiML-Update, sodass ausgehende Sitzungen mit `<Connect><Stream>` verbunden bleiben.

### Schonfrist bei Twilio-Stream-Trennung

Wenn ein Twilio-Media-Stream getrennt wird, wartet Voice Call `2000ms`, bevor der Anruf automatisch beendet wird:

- Wenn sich der Stream in diesem Zeitraum erneut verbindet, wird die automatische Beendigung abgebrochen.
- Wenn nach Ablauf der Schonfrist kein Stream erneut registriert wird, wird der Anruf beendet, um festhängende aktive Anrufe zu verhindern.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hallo von OpenClaw"
openclaw voicecall start --to "+15555550123"   # Alias für call
openclaw voicecall continue --call-id <id> --message "Noch Fragen?"
openclaw voicecall speak --call-id <id> --message "Einen Moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # fasst die Zuglatenz aus Protokollen zusammen
openclaw voicecall expose --mode funnel
```

`latency` liest `calls.jsonl` aus dem Standardspeicherpfad von voice-call. Verwenden Sie
`--file <path>`, um auf ein anderes Protokoll zu verweisen, und `--last <n>`, um die Analyse
auf die letzten N Datensätze zu begrenzen (Standard 200). Die Ausgabe enthält p50/p90/p99 für Zug-
Latenz und Listen-Wait-Zeiten.

## Agenten-Tool

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
- [Voice wake](/de/nodes/voicewake)
