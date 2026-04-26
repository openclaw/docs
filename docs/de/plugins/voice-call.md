---
read_when:
    - Sie möchten aus OpenClaw heraus einen ausgehenden Sprachanruf initiieren
    - Sie konfigurieren oder entwickeln das Sprachanruf-Plugin
    - Sie benötigen Echtzeit-Sprachverarbeitung oder Streaming-Transkription in der Telefonie
sidebarTitle: Voice call
summary: Ausgehende Sprachanrufe initiieren und eingehende Sprachanrufe über Twilio, Telnyx oder Plivo annehmen, mit optionaler Echtzeit-Sprachverarbeitung und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-04-26T11:37:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen,
mehrzügige Gespräche, vollduplexe Echtzeit-Sprachverarbeitung, Streaming-
Transkription und eingehende Anrufe mit Allowlist-Richtlinien.

**Aktuelle Provider:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML-Transfer + GetInput-
Spracherkennung), `mock` (Entwicklung/kein Netzwerk).

<Note>
Das Sprachanruf-Plugin läuft **innerhalb des Gateway-Prozesses**. Wenn Sie ein
Remote-Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem Rechner, auf dem
das Gateway läuft, und starten Sie dann das Gateway neu, damit es geladen wird.
</Note>

## Schnellstart

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm (recommended)">
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

    Starten Sie das Gateway danach neu, damit das Plugin geladen wird.

  </Step>
  <Step title="Configure provider and webhook">
    Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest (siehe
    [Configuration](#configuration) unten für die vollständige Struktur). Mindestens erforderlich:
    `provider`, Provider-Zugangsdaten, `fromNumber` und eine öffentlich
    erreichbare Webhook-URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Die Standardausgabe ist in Chat-Logs und Terminals gut lesbar. Sie prüft
    Plugin-Aktivierung, Provider-Zugangsdaten, Webhook-Erreichbarkeit und dass
    nur ein Audiomodus (`streaming` oder `realtime`) aktiv ist. Verwenden Sie
    `--json` für Skripte.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide sind standardmäßig Trockenläufe. Fügen Sie `--yes` hinzu, um tatsächlich einen kurzen
    ausgehenden Benachrichtigungsanruf zu initiieren:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss das Setup zu einer **öffentlichen Webhook-URL** auflösen.
Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder das Serve-Fallback
zu Loopback oder privatem Netzwerkraum auflöst, schlägt das Setup fehl, anstatt
einen Provider zu starten, der keine Carrier-Webhooks empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true` gesetzt ist, dem ausgewählten Provider aber Zugangsdaten fehlen,
protokolliert der Gateway-Start eine Warnung über ein unvollständiges Setup mit den fehlenden Schlüsseln und
überspringt den Start der Laufzeit. Befehle, RPC-Aufrufe und Agent-Tools geben bei Verwendung
den exakt fehlenden Provider-Konfigurationsstand weiterhin zurück.

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
            // Öffentlicher Telnyx-Webhook-Schlüssel aus dem Mission Control Portal
            // (Base64; kann auch über TELNYX_PUBLIC_KEY gesetzt werden).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* siehe Streaming-Transkription */ },
          realtime: { enabled: false /* siehe Echtzeit-Sprachverarbeitung */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx und Plivo erfordern alle eine **öffentlich erreichbare** Webhook-URL.
    - `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
    - Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht true ist.
    - `skipSignatureVerification` ist nur für lokale Tests gedacht.
    - Im kostenlosen ngrok-Tarif setzen Sie `publicUrl` auf die exakte ngrok-URL; die Signaturprüfung wird immer erzwungen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` gesetzt ist und `serve.bind` Loopback ist (lokaler ngrok-Agent). Nur für lokale Entwicklung.
    - URLs des kostenlosen ngrok-Tarifs können sich ändern oder Interstitial-Verhalten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Für die Produktion: bevorzugen Sie eine stabile Domain oder einen Tailscale-Funnel.
  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` schließt Sockets, die nie einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Pre-Start-Sockets.
    - `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Pre-Start-Sockets pro Quell-IP.
    - `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).
  </Accordion>
  <Accordion title="Legacy config migrations">
    Ältere Konfigurationen mit `provider: "log"`, `twilio.from` oder älteren
    OpenAI-Schlüsseln unter `streaming.*` werden von `openclaw doctor --fix` umgeschrieben.
    Das Laufzeit-Fallback akzeptiert die alten Sprachanruf-Schlüssel vorerst noch, aber
    der Umschreibpfad ist `openclaw doctor --fix`, und der Kompatibilitäts-Shim ist
    vorübergehend.

    Automatisch migrierte Streaming-Schlüssel:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Gespräche mit Echtzeit-Sprachverarbeitung

`realtime` wählt einen vollduplexen Echtzeit-Sprachprovider für Live-Anrufaudio
aus. Er ist von `streaming` getrennt, das Audio nur an
Echtzeit-Transkriptionsprovider weiterleitet.

<Warning>
`realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden. Wählen Sie
einen Audiomodus pro Anruf.
</Warning>

Aktuelles Laufzeitverhalten:

- `realtime.enabled` wird für Twilio Media Streams unterstützt.
- `realtime.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten registrierten Echtzeit-Sprachprovider.
- Gebündelte Echtzeit-Sprachprovider: Google Gemini Live (`google`) und OpenAI (`openai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration befindet sich unter `realtime.providers.<providerId>`.
- Voice Call stellt standardmäßig das gemeinsame Echtzeit-Tool `openclaw_agent_consult` bereit. Das Echtzeitmodell kann es aufrufen, wenn der Anrufer nach tieferem Reasoning, aktuellen Informationen oder normalen OpenClaw-Tools fragt.
- Wenn `realtime.provider` auf einen nicht registrierten Provider verweist oder überhaupt kein Echtzeit-Sprachprovider registriert ist, protokolliert Voice Call eine Warnung und überspringt Echtzeitmedien, anstatt das gesamte Plugin scheitern zu lassen.
- Session-Keys für Consult verwenden nach Möglichkeit die vorhandene Voice-Session wieder und greifen sonst auf die Telefonnummer des Anrufers/Angerufenen zurück, damit nachfolgende Consult-Aufrufe während des Anrufs den Kontext behalten.

### Tool-Richtlinie

`realtime.toolPolicy` steuert die Consult-Ausführung:

| Richtlinie       | Verhalten                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Das Consult-Tool wird bereitgestellt, und der normale Agent wird auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get` beschränkt. |
| `owner`          | Das Consult-Tool wird bereitgestellt, und der normale Agent darf die normale Tool-Richtlinie des Agenten verwenden.                    |
| `none`           | Das Consult-Tool wird nicht bereitgestellt. Benutzerdefinierte `realtime.tools` werden weiterhin an den Echtzeit-Provider durchgereicht. |

### Beispiele für Echtzeit-Provider

<Tabs>
  <Tab title="Google Gemini Live">
    Standardwerte: API-Schlüssel aus `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` oder `GOOGLE_GENERATIVE_AI_API_KEY`; Modell
    `gemini-2.5-flash-native-audio-preview-12-2025`; Stimme `Kore`.

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

Siehe [Google provider](/de/providers/google) und
[OpenAI provider](/de/providers/openai) für providerspezifische Optionen zur Echtzeit-Sprachverarbeitung.

## Streaming-Transkription

`streaming` wählt einen Echtzeit-Transkriptionsprovider für Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten registrierten Echtzeit-Transkriptionsprovider.
- Gebündelte Echtzeit-Transkriptionsprovider: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration befindet sich unter `streaming.providers.<providerId>`.
- Wenn `streaming.provider` auf einen nicht registrierten Provider verweist oder keiner registriert ist, protokolliert Voice Call eine Warnung und überspringt das Medien-Streaming, anstatt das gesamte Plugin scheitern zu lassen.

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

  </Tab>
  <Tab title="xAI">
    Standardwerte: API-Schlüssel `streaming.providers.xai.apiKey` oder `XAI_API_KEY`;
    Endpunkt `wss://api.x.ai/v1/stt`; Kodierung `mulaw`; Sample-Rate `8000`;
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

  </Tab>
</Tabs>

## TTS für Anrufe

Voice Call verwendet die Core-Konfiguration `messages.tts` für Streaming-
Sprachausgabe bei Anrufen. Sie können sie unter der Plugin-Konfiguration mit derselben
**gleichen Struktur** überschreiben — sie wird per Deep-Merge mit `messages.tts` zusammengeführt.

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
**Microsoft speech wird für Sprachanrufe ignoriert.** Telefonie-Audio benötigt PCM;
der aktuelle Microsoft-Transport stellt keine PCM-Ausgabe für Telefonie bereit.
</Warning>

Hinweise zum Verhalten:

- Veraltete `tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden von `openclaw doctor --fix` repariert; gespeicherte Konfiguration sollte `tts.providers.<provider>` verwenden.
- Core-TTS wird verwendet, wenn Twilio-Medien-Streaming aktiviert ist; andernfalls greifen Anrufe auf providernative Stimmen zurück.
- Wenn bereits ein Twilio-Media-Stream aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn TTS für Telefonie in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, anstatt zwei Wiedergabepfade zu mischen.
- Wenn TTS für Telefonie auf einen sekundären Provider zurückfällt, protokolliert Voice Call zur Fehlersuche eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn Twilio-Barge-in oder Stream-Teardown die ausstehende TTS-Warteschlange leert, werden eingereihte Wiedergabeanforderungen abgeschlossen, anstatt Anrufer hängen zu lassen, die auf den Abschluss der Wiedergabe warten.

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

Die Richtlinie für eingehende Anrufe ist standardmäßig `disabled`. Um eingehende Anrufe zu aktivieren, setzen Sie:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` ist ein Caller-ID-Filter mit geringer Sicherheit. Das
Plugin normalisiert den vom Provider gelieferten Wert `From` und vergleicht ihn mit
`allowFrom`. Die Webhook-Verifizierung authentifiziert die Zustellung durch den Provider und
die Integrität der Nutzlast, beweist aber **nicht** den Besitz der PSTN-/VoIP-Anrufernummer.
Behandeln Sie `allowFrom` als Caller-ID-Filter, nicht als starke
Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agent-System. Feinabstimmung mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs`.

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für gesprochene Ausgabe an
den System-Prompt an:

```text
{"spoken":"..."}
```

Voice Call extrahiert Sprachtext defensiv:

- Ignoriert Nutzlasten, die als Reasoning-/Fehlerinhalt markiert sind.
- Parst direktes JSON, JSON in Fences oder Inline-Schlüssel `"spoken"`.
- Fällt auf Klartext zurück und entfernt wahrscheinlich einleitende Absätze mit Planung/Meta-Informationen.

Dadurch bleibt die gesprochene Wiedergabe auf anruferseitigen Text fokussiert und
verhindert, dass Planungstext in Audio ausgegeben wird.

### Startverhalten von Gesprächen

Bei ausgehenden Anrufen im Modus `conversation` ist die Verarbeitung der ersten Nachricht an den
aktuellen Wiedergabestatus gebunden:

- Das Leeren der Barge-in-Warteschlange und die automatische Antwort werden nur unterdrückt, solange die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die erste Nachricht bleibt für einen Wiederholungsversuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming startet bei der Stream-Verbindung ohne zusätzliche Verzögerung.
- Barge-in bricht aktive Wiedergabe ab und leert eingereihte, aber noch nicht abgespielte Twilio-TTS-Einträge. Geleerte Einträge werden als übersprungen aufgelöst, sodass die nachfolgende Antwortlogik ohne Warten auf Audio fortfahren kann, das niemals abgespielt wird.
- Gespräche mit Echtzeit-Sprachverarbeitung verwenden den eigenen Eröffnungs-Turn des Echtzeit-Streams. Voice Call sendet **kein** veraltetes TwiML-Update `<Say>` für diese erste Nachricht, damit ausgehende Sitzungen mit `<Connect><Stream>` verbunden bleiben.

### Grace-Periode bei Twilio-Stream-Trennung

Wenn ein Twilio-Media-Stream getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn der Stream innerhalb dieses Fensters erneut verbunden wird, wird das automatische Beenden aufgehoben.
- Wenn sich nach der Grace-Periode kein Stream erneut registriert, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## Reaper für veraltete Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die niemals einen terminalen
Webhook empfangen (zum Beispiel Anrufe im Benachrichtigungsmodus, die nie abgeschlossen werden). Der Standardwert
ist `0` (deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Benachrichtigungsflüsse.
- Halten Sie diesen Wert **höher als `maxDurationSeconds`**, damit normale Anrufe beendet werden können. Ein guter Startwert ist `maxDurationSeconds + 30–60` Sekunden.

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

Wenn sich vor dem Gateway ein Proxy oder Tunnel befindet, rekonstruiert das Plugin
die öffentliche URL für die Signaturprüfung. Diese Optionen steuern,
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

- Webhook-**Replay-Schutz** ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-Anfragen werden bestätigt, aber für Nebeneffekte übersprungen.
- Gesprächs-Turns von Twilio enthalten ein Token pro Turn in Callbacks von `<Gather>`, sodass veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkript-Turn erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die vom Provider erforderlichen Signatur-Header fehlen.
- Der Webhook für Voice Call verwendet das gemeinsame Body-Profil vor Authentifizierung (64 KB / 5 Sekunden) plus eine laufende Begrenzung pro IP vor der Signaturprüfung.

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
openclaw voicecall start --to "+15555550123"   # Alias für call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # Turn-Latenz aus Logs zusammenfassen
openclaw voicecall expose --mode funnel
```

`latency` liest `calls.jsonl` aus dem Standard-Speicherpfad von Voice Call.
Verwenden Sie `--file <path>`, um auf ein anderes Log zu verweisen, und `--last <n>`, um
die Analyse auf die letzten N Datensätze zu begrenzen (Standard 200). Die Ausgabe enthält p50/p90/p99
für Turn-Latenz und Listen-Wait-Zeiten.

## Agent-Tool

Tool-Name: `voice_call`.

| Aktion          | Argumente                 |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Dieses Repo enthält ein passendes Skill-Dokument unter `skills/voice-call/SKILL.md`.

## Gateway RPC

| Methode              | Argumente                 |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Verwandt

- [Talk mode](/de/nodes/talk)
- [Text-to-speech](/de/tools/tts)
- [Voice wake](/de/nodes/voicewake)
