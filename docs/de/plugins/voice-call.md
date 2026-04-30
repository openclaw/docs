---
read_when:
    - Sie möchten von OpenClaw aus einen ausgehenden Sprachanruf tätigen
    - Sie konfigurieren oder entwickeln das Sprachanruf-Plugin
    - Sie benötigen Echtzeit-Sprachverarbeitung oder Streaming-Transkription für Telefonie
sidebarTitle: Voice call
summary: Ausgehende Sprachanrufe über Twilio, Telnyx oder Plivo tätigen und eingehende annehmen, mit optionaler Echtzeit-Sprachübertragung und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-04-30T07:08:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen,
mehrzügige Unterhaltungen, Full-Duplex-Echtzeitstimme, Streaming-
Transkription und eingehende Anrufe mit Allowlist-Richtlinien.

**Aktuelle Provider:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML-Transfer + GetInput-
Sprache), `mock` (Entwicklung/kein Netzwerk).

<Note>
Das Voice Call Plugin läuft **innerhalb des Gateway-Prozesses**. Wenn Sie ein
entferntes Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem Rechner,
auf dem das Gateway läuft, und starten Sie anschließend das Gateway neu, um es zu laden.
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

    Wenn npm das von OpenClaw verwaltete Paket als veraltet meldet, stammt diese Paketversion
    aus einer älteren externen Paketreihe; verwenden Sie einen aktuellen paketierten OpenClaw-
    Build oder den lokalen Ordnerpfad, bis ein neueres npm-Paket veröffentlicht ist.

    Starten Sie danach das Gateway neu, damit das Plugin geladen wird.

  </Step>
  <Step title="Configure provider and webhook">
    Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest (siehe
    [Konfiguration](#configuration) unten für die vollständige Struktur). Mindestens erforderlich sind:
    `provider`, Provider-Anmeldedaten, `fromNumber` und eine öffentlich
    erreichbare Webhook-URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Die Standardausgabe ist in Chatprotokollen und Terminals lesbar. Sie prüft,
    ob das Plugin aktiviert ist, ob Provider-Anmeldedaten vorhanden sind, ob der Webhook erreichbar ist und dass
    nur ein Audiomodus (`streaming` oder `realtime`) aktiv ist. Verwenden Sie
    `--json` für Skripte.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide sind standardmäßig Testläufe. Fügen Sie `--yes` hinzu, um tatsächlich einen kurzen
    ausgehenden Benachrichtigungsanruf zu tätigen:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss die Einrichtung zu einer **öffentlichen Webhook-URL** auflösen.
Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder der Serve-Fallback
zu loopback oder privatem Netzwerkbereich auflöst, schlägt die Einrichtung fehl, statt
einen Provider zu starten, der keine Carrier-Webhooks empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true` gesetzt ist, aber dem ausgewählten Provider Anmeldedaten fehlen,
protokolliert der Gateway-Start eine Warnung zur unvollständigen Einrichtung mit den fehlenden Schlüsseln und
überspringt das Starten der Runtime. Befehle, RPC-Aufrufe und Agent-Tools
geben bei Verwendung weiterhin die genaue fehlende Provider-Konfiguration zurück.

<Note>
Voice-Call-Anmeldedaten akzeptieren SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` und `plugins.entries.voice-call.config.tts.providers.*.apiKey` werden über die standardmäßige SecretRef-Oberfläche aufgelöst; siehe [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface).
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
    - Twilio, Telnyx und Plivo benötigen alle eine **öffentlich erreichbare** Webhook-URL.
    - `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
    - Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht true ist.
    - `skipSignatureVerification` ist nur für lokale Tests vorgesehen.
    - Beim kostenlosen ngrok-Tarif setzen Sie `publicUrl` auf die genaue ngrok-URL; Signaturprüfung wird immer erzwungen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` gesetzt ist und `serve.bind` loopback ist (lokaler ngrok-Agent). Nur lokale Entwicklung.
    - URLs im kostenlosen ngrok-Tarif können sich ändern oder Zwischenseiten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Produktion: Bevorzugen Sie eine stabile Domain oder einen Tailscale Funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` schließt Sockets, die nie einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Pre-Start-Sockets.
    - `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Pre-Start-Sockets pro Quell-IP.
    - `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).

  </Accordion>
  <Accordion title="Legacy config migrations">
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

## Echtzeit-Sprachunterhaltungen

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
- Voice Call stellt standardmäßig das gemeinsame Echtzeit-Tool `openclaw_agent_consult` bereit. Das Echtzeitmodell kann es aufrufen, wenn der Anrufer tiefere Schlussfolgerungen, aktuelle Informationen oder normale OpenClaw-Tools anfordert.
- Wenn `realtime.provider` auf einen nicht registrierten Provider verweist oder überhaupt kein Echtzeit-Sprach-Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt Echtzeitmedien, statt das gesamte Plugin fehlschlagen zu lassen.
- Consult-Sitzungsschlüssel verwenden die vorhandene Sprachsitzung, wenn verfügbar, und fallen dann auf die Telefonnummer des Anrufers/Angerufenen zurück, damit Folge-Consult-Aufrufe während des Anrufs den Kontext behalten.

### Tool-Richtlinie

`realtime.toolPolicy` steuert den Consult-Lauf:

| Richtlinie       | Verhalten                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stellt das Consult-Tool bereit und beschränkt den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get`. |
| `owner`          | Stellt das Consult-Tool bereit und lässt den regulären Agenten die normale Agent-Tool-Richtlinie verwenden.                              |
| `none`           | Stellt das Consult-Tool nicht bereit. Benutzerdefinierte `realtime.tools` werden weiterhin an den Echtzeit-Provider weitergegeben.        |

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

Siehe [Google-Provider](/de/providers/google) und
[OpenAI-Provider](/de/providers/openai) für Provider-spezifische Echtzeit-Sprach-
Optionen.

## Streaming-Transkription

`streaming` wählt einen Echtzeit-Transkriptions-Provider für Live-Anruf-Audio aus.

Aktuelles Runtime-Verhalten:

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten registrierten Echtzeit-Transkriptions-Provider.
- Gebündelte Echtzeit-Transkriptions-Provider: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration befindet sich unter `streaming.providers.<providerId>`.
- Wenn `streaming.provider` auf einen nicht registrierten Provider verweist oder keiner registriert ist, protokolliert Voice Call eine Warnung und überspringt Medien-Streaming, statt das gesamte Plugin fehlschlagen zu lassen.

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

Voice Call verwendet die zentrale Konfiguration `messages.tts` für gestreamte
Sprachausgabe bei Anrufen. Sie können sie in der Plugin-Konfiguration mit
**derselben Struktur** überschreiben — sie wird per Deep Merge mit `messages.tts` zusammengeführt.

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

- Veraltete Schlüssel `tts.<provider>` innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` repariert; committed Konfiguration sollte `tts.providers.<provider>` verwenden.
- Core-TTS wird verwendet, wenn Twilio-Media-Streaming aktiviert ist; andernfalls fallen Anrufe auf Provider-native Stimmen zurück.
- Wenn ein Twilio-Media-Stream bereits aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call zur Fehlersuche eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn Twilio-Barge-in oder der Stream-Abbau die ausstehende TTS-Warteschlange leert, werden eingereihte Wiedergabeanforderungen abgeschlossen, statt Anrufende beim Warten auf den Abschluss der Wiedergabe hängen zu lassen.

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

Die Standardrichtlinie für eingehende Anrufe ist `disabled`. Um eingehende Anrufe zu aktivieren, legen Sie Folgendes fest:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` ist eine Anrufer-ID-Prüfung mit geringer Sicherheit. Das
Plugin normalisiert den vom Provider gelieferten Wert `From` und vergleicht ihn mit
`allowFrom`. Die Webhook-Verifizierung authentifiziert die Zustellung durch den Provider und
die Integrität der Nutzlast, sie beweist jedoch **nicht** den Besitz der PSTN-/VoIP-Anrufernummer.
Behandeln Sie `allowFrom` als Anrufer-ID-Filterung, nicht als starke Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agent-System. Stimmen Sie sie mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs` ab.

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für gesprochene Ausgaben an
den System-Prompt an:

```text
{"spoken":"..."}
```

Voice Call extrahiert Sprachtext defensiv:

- Ignoriert Nutzlasten, die als Reasoning-/Fehlerinhalte markiert sind.
- Parst direktes JSON, eingezäuntes JSON oder Inline-Schlüssel `"spoken"`.
- Fällt auf Klartext zurück und entfernt wahrscheinliche einleitende Planungs-/Meta-Absätze.

Dadurch bleibt die gesprochene Wiedergabe auf anruferseitigen Text fokussiert und verhindert,
dass Planungstext in Audio gelangt.

### Verhalten beim Gesprächsstart

Bei ausgehenden `conversation`-Anrufen ist die Behandlung der ersten Nachricht an den Live-
Wiedergabestatus gebunden:

- Das Leeren der Barge-in-Warteschlange und die automatische Antwort werden nur unterdrückt, während die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück, und die anfängliche Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming startet beim Verbinden des Streams ohne zusätzliche Verzögerung.
- Barge-in bricht die aktive Wiedergabe ab und leert eingereihte, aber noch nicht abgespielte Twilio-TTS-Einträge. Geleerte Einträge werden als übersprungen aufgelöst, sodass die Logik für Folgeantworten fortfahren kann, ohne auf Audio zu warten, das nie abgespielt wird.
- Echtzeit-Sprachgespräche verwenden die eigene Eröffnungsrunde des Echtzeit-Streams. Voice Call sendet für diese anfängliche Nachricht **kein** veraltetes TwiML-Update `<Say>`, sodass ausgehende `<Connect><Stream>`-Sitzungen verbunden bleiben.

### Grace Period bei Twilio-Stream-Trennung

Wenn ein Twilio-Media-Stream getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn der Stream während dieses Zeitfensters erneut verbunden wird, wird das automatische Beenden abgebrochen.
- Wenn sich nach der Grace Period kein Stream erneut registriert, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## Reaper für veraltete Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die nie einen terminalen
Webhook erhalten (zum Beispiel Notify-Modus-Anrufe, die nie abgeschlossen werden). Der Standardwert
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

Wenn ein Proxy oder Tunnel vor dem Gateway sitzt, rekonstruiert das Plugin
die öffentliche URL für die Signaturprüfung. Diese Optionen steuern, welchen weitergeleiteten Headern vertraut wird:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts aus Weiterleitungs-Headern per Allowlist zulassen.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Weitergeleiteten Headern ohne Allowlist vertrauen.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Weitergeleiteten Headern nur vertrauen, wenn die Remote-IP der Anfrage mit der Liste übereinstimmt.
</ParamField>

Zusätzliche Schutzmaßnahmen:

- Webhook-**Replay-Schutz** ist für Twilio und Plivo aktiviert. Erneut abgespielte gültige Webhook-Anfragen werden bestätigt, aber für Seiteneffekte übersprungen.
- Twilio-Gesprächsrunden enthalten ein rundenbezogenes Token in `<Gather>`-Callbacks, sodass veraltete/erneut abgespielte Sprach-Callbacks keine neuere ausstehende Transkriptionsrunde erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die erforderlichen Signatur-Header des Providers fehlen.
- Der Voice-Call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden) sowie eine pro-IP-In-Flight-Begrenzung vor der Signaturprüfung.

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

`latency` liest `calls.jsonl` aus dem standardmäßigen Voice-Call-Speicherpfad.
Verwenden Sie `--file <path>`, um auf ein anderes Log zu verweisen, und `--last <n>`, um
die Analyse auf die letzten N Datensätze zu beschränken (Standard 200). Die Ausgabe enthält p50/p90/p99
für Rundenlatenz und Listen-Wait-Zeiten.

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

Dieses Repo liefert ein passendes Skill-Dokument unter `skills/voice-call/SKILL.md` mit.

## Gateway-RPC

| Methode              | Argumente                 |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Verwandte Themen

- [Sprechmodus](/de/nodes/talk)
- [Text-to-Speech](/de/tools/tts)
- [Sprachaktivierung](/de/nodes/voicewake)
