---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf von OpenClaw aus tätigen
    - Sie konfigurieren oder entwickeln das Sprachanruf-Plugin
    - Sie benötigen Echtzeit-Sprachübertragung oder Streaming-Transkription für Telefonie
sidebarTitle: Voice call
summary: Tätigen Sie ausgehende Sprachanrufe und nehmen Sie eingehende Sprachanrufe über Twilio, Telnyx oder Plivo an, mit optionaler Echtzeit-Sprachkommunikation und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen,
mehrstufige Unterhaltungen, Full-Duplex-Echtzeit-Sprache, Streaming-
Transkription und eingehende Anrufe mit Allowlist-Richtlinien.

**Aktuelle Provider:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (Entwicklung/kein Netzwerk).

<Note>
Das Voice Call-Plugin läuft **innerhalb des Gateway-Prozesses**. Wenn Sie ein
entferntes Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem Computer, auf dem
das Gateway läuft, und starten Sie anschließend das Gateway neu, damit es geladen wird.
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

    Verwenden Sie das unveränderte Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine
    exakte Version nur dann, wenn Sie eine reproduzierbare Installation benötigen.

    Starten Sie anschließend das Gateway neu, damit das Plugin geladen wird.

  </Step>
  <Step title="Configure provider and webhook">
    Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest (siehe
    [Konfiguration](#configuration) unten für die vollständige Struktur). Mindestens erforderlich sind:
    `provider`, Provider-Zugangsdaten, `fromNumber` und eine öffentlich
    erreichbare Webhook-URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Die Standardausgabe ist in Chatprotokollen und Terminals gut lesbar. Sie prüft
    die Aktivierung des Plugins, Provider-Zugangsdaten, Webhook-Erreichbarkeit und dass
    nur ein Audiomodus (`streaming` oder `realtime`) aktiv ist. Verwenden Sie
    `--json` für Skripte.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide Befehle sind standardmäßig Trockenläufe. Fügen Sie `--yes` hinzu, um tatsächlich einen kurzen
    ausgehenden Benachrichtigungsanruf zu platzieren:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss die Einrichtung zu einer **öffentlichen Webhook-URL** auflösen.
Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder der Serve-Fallback
zu loopback oder einem privaten Netzwerkbereich auflöst, schlägt die Einrichtung fehl, statt
einen Provider zu starten, der keine Carrier-Webhooks empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true` gesetzt ist, dem ausgewählten Provider aber Zugangsdaten fehlen,
protokolliert der Gateway-Start eine Warnung über eine unvollständige Einrichtung mit den fehlenden Schlüsseln und
überspringt den Start der Runtime. Befehle, RPC-Aufrufe und Agent-Tools geben bei Verwendung weiterhin
die exakt fehlende Provider-Konfiguration zurück.

<Note>
Voice-Call-Zugangsdaten akzeptieren SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` und `plugins.entries.voice-call.config.tts.providers.*.apiKey` werden über die standardmäßige SecretRef-Oberfläche aufgelöst; siehe [SecretRef-Zugangsdatenoberfläche](/de/reference/secretref-credential-surface).
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
    - `skipSignatureVerification` ist nur für lokale Tests gedacht.
    - In der kostenlosen ngrok-Stufe setzen Sie `publicUrl` auf die exakte ngrok-URL; Signaturprüfung wird immer erzwungen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` und `serve.bind` loopback ist (lokaler ngrok-Agent). Nur für lokale Entwicklung.
    - URLs der kostenlosen ngrok-Stufe können sich ändern oder Interstitial-Verhalten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Produktion: Bevorzugen Sie eine stabile Domain oder einen Tailscale-Funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` schließt Sockets, die nie einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Pre-Start-Sockets.
    - `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Pre-Start-Sockets pro Quell-IP.
    - `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Ältere Konfigurationen mit `provider: "log"`, `twilio.from` oder alten
    OpenAI-Schlüsseln unter `streaming.*` werden durch `openclaw doctor --fix` umgeschrieben.
    Der Runtime-Fallback akzeptiert die alten Voice-Call-Schlüssel vorerst weiterhin, aber
    der Umschreibpfad ist `openclaw doctor --fix` und die Kompatibilitätsschicht ist
    temporär.

    Automatisch migrierte Streaming-Schlüssel:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Sitzungsumfang

Standardmäßig verwendet Voice Call `sessionScope: "per-phone"`, sodass wiederholte Anrufe vom
gleichen Anrufer den Unterhaltungsspeicher beibehalten. Setzen Sie `sessionScope: "per-call"`, wenn
jeder Carrier-Anruf mit frischem Kontext beginnen soll, beispielsweise für Empfang,
Buchungen, IVR oder Google Meet-Bridge-Abläufe, bei denen dieselbe Telefonnummer
verschiedene Meetings darstellen kann.

## Echtzeit-Sprachunterhaltungen

`realtime` wählt einen Full-Duplex-Echtzeit-Sprach-Provider für Live-Anruf-
Audio aus. Es ist von `streaming` getrennt, das Audio nur an
Echtzeit-Transkriptions-Provider weiterleitet.

<Warning>
`realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden. Wählen Sie einen
Audiomodus pro Anruf.
</Warning>

Aktuelles Runtime-Verhalten:

- `realtime.enabled` wird für Twilio Media Streams unterstützt.
- `realtime.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den zuerst registrierten Echtzeit-Sprach-Provider.
- Gebündelte Echtzeit-Sprach-Provider: Google Gemini Live (`google`) und OpenAI (`openai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration liegt unter `realtime.providers.<providerId>`.
- Voice Call stellt standardmäßig das gemeinsame Echtzeit-Tool `openclaw_agent_consult` bereit. Das Echtzeitmodell kann es aufrufen, wenn der Anrufer tiefergehendes Reasoning, aktuelle Informationen oder normale OpenClaw-Tools anfordert.
- `realtime.fastContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, durchsucht Voice Call zuerst indizierten Speicher/Sitzungskontext nach der Consult-Frage und gibt diese Ausschnitte innerhalb von `realtime.fastContext.timeoutMs` an das Echtzeitmodell zurück, bevor nur dann auf den vollständigen Consult-Agent zurückgefallen wird, wenn `realtime.fastContext.fallbackToConsult` true ist.
- Wenn `realtime.provider` auf einen nicht registrierten Provider verweist oder überhaupt kein Echtzeit-Sprach-Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt Echtzeitmedien, statt das gesamte Plugin fehlschlagen zu lassen.
- Consult-Sitzungsschlüssel verwenden die gespeicherte Anrufsitzung erneut, wenn verfügbar, und fallen dann auf den konfigurierten `sessionScope` zurück (`per-phone` standardmäßig oder `per-call` für isolierte Anrufe).

### Tool-Richtlinie

`realtime.toolPolicy` steuert den Consult-Lauf:

| Richtlinie       | Verhalten                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stellt das Consult-Tool bereit und beschränkt den regulären Agent auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get`. |
| `owner`          | Stellt das Consult-Tool bereit und lässt den regulären Agent die normale Agent-Tool-Richtlinie verwenden.                                |
| `none`           | Stellt das Consult-Tool nicht bereit. Benutzerdefinierte `realtime.tools` werden weiterhin an den Echtzeit-Provider durchgereicht.       |

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

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten registrierten Provider für Echtzeittranskription.
- Gebündelte Provider für Echtzeittranskription: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration liegt unter `streaming.providers.<providerId>`.
- Nachdem Twilio eine akzeptierte Stream-`start`-Nachricht sendet, registriert Voice Call den Stream sofort, reiht eingehende Medien über den Transkriptions-Provider ein, während der Provider verbindet, und startet die erste Begrüßung erst, wenn die Echtzeittranskription bereit ist.
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

Voice Call verwendet die zentrale `messages.tts`-Konfiguration für gestreamte
Sprachausgabe in Anrufen. Sie können sie in der Plugin-Konfiguration mit
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

- Ältere `tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` repariert; festgeschriebene Konfiguration sollte `tts.providers.<provider>` verwenden.
- Zentrales TTS wird verwendet, wenn Twilio-Medien-Streaming aktiviert ist; andernfalls fallen Anrufe auf provider-native Stimmen zurück.
- Wenn ein Twilio-Medienstream bereits aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`) zur Fehlersuche.
- Wenn Twilio-Barge-in oder Stream-Abbau die ausstehende TTS-Warteschlange leert, werden eingereihte Wiedergabeanforderungen abgeschlossen, statt Anrufer hängen zu lassen, die auf den Abschluss der Wiedergabe warten.

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
`inboundPolicy: "allowlist"` ist eine Anrufer-ID-Prüfung mit geringer Vertrauenswürdigkeit. Das
Plugin normalisiert den vom Provider bereitgestellten `From`-Wert und vergleicht ihn mit
`allowFrom`. Webhook-Verifizierung authentifiziert die Provider-Zustellung und
Payload-Integrität, beweist aber **nicht** den Besitz der PSTN-/VoIP-Anrufernummer.
Behandeln Sie `allowFrom` als Anrufer-ID-Filterung, nicht als starke Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agentensystem. Stimmen Sie sie mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs` ab.

### Routing pro Nummer

Verwenden Sie `numbers`, wenn ein Voice Call-Plugin Anrufe für mehrere Telefonnummern
empfängt und jede Nummer sich wie eine eigene Leitung verhalten soll. Beispielsweise kann eine
Nummer einen lockeren persönlichen Assistenten verwenden, während eine andere eine geschäftliche
Persona, einen anderen Antwort-Agenten und eine andere TTS-Stimme verwendet.

Routen werden anhand der vom Provider bereitgestellten gewählten `To`-Nummer ausgewählt. Schlüssel müssen
E.164-Nummern sein. Wenn ein Anruf eingeht, löst Voice Call die passende Route einmal auf,
speichert die passende Route im Anrufdatensatz und verwendet diese effektive Konfiguration
für die Begrüßung, den klassischen automatischen Antwortpfad, den Echtzeit-Konsultationspfad und die TTS-
Wiedergabe. Wenn keine Route passt, wird die globale Voice Call-Konfiguration verwendet.
Ausgehende Anrufe verwenden `numbers` nicht; übergeben Sie das ausgehende Ziel, die Nachricht und
die Sitzung explizit beim Starten des Anrufs.

Routenüberschreibungen unterstützen derzeit:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Der Routenwert `tts` wird per Deep Merge über die globale Voice Call-`tts`-Konfiguration gelegt, sodass
Sie normalerweise nur die Provider-Stimme überschreiben können:

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

Dadurch bleibt die gesprochene Wiedergabe auf anruferorientierten Text fokussiert und es wird vermieden,
dass Planungstext in Audio gelangt.

### Startverhalten von Unterhaltungen

Für ausgehende `conversation`-Anrufe ist die Behandlung der ersten Nachricht an den Live-
Wiedergabestatus gebunden:

- Barge-in-Warteschlangenleerung und automatische Antwort werden nur unterdrückt, während die erste Begrüßung aktiv gesprochen wird.
- Wenn die erste Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die erste Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die erste Wiedergabe für Twilio-Streaming startet beim Verbinden des Streams ohne zusätzliche Verzögerung.
- Barge-in bricht aktive Wiedergabe ab und löscht eingereihte, aber noch nicht abgespielte Twilio-TTS-Einträge. Gelöschte Einträge werden als übersprungen aufgelöst, sodass die Logik für Folgeantworten fortfahren kann, ohne auf Audio zu warten, das nie abgespielt wird.
- Echtzeit-Sprachunterhaltungen verwenden den eigenen Eröffnungs-Turn des Echtzeitstreams. Voice Call sendet kein älteres `<Say>`-TwiML-Update für diese erste Nachricht, sodass ausgehende `<Connect><Stream>`-Sitzungen verbunden bleiben.

### Karenzzeit bei Twilio-Stream-Trennung

Wenn ein Twilio-Medienstream getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn der Stream während dieses Fensters erneut verbindet, wird die automatische Beendigung abgebrochen.
- Wenn sich nach der Karenzzeit kein Stream erneut registriert, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## Reaper für veraltete Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die nie einen abschließenden
Webhook erhalten (zum Beispiel Benachrichtigungsmodus-Anrufe, die nie abgeschlossen werden). Der Standardwert
ist `0` (deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Benachrichtigungs-Workflows.
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

Wenn sich ein Proxy oder Tunnel vor dem Gateway befindet, rekonstruiert das Plugin
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

- Webhook-**Replay-Schutz** ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-Anfragen werden bestätigt, aber für Nebenwirkungen übersprungen.
- Twilio-Unterhaltungs-Turns enthalten ein Token pro Turn in `<Gather>`-Callbacks, sodass veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkript-Turn erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor Body-Lesevorgängen abgelehnt, wenn die erforderlichen Signatur-Header des Providers fehlen.
- Der voice-call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden) plus ein Pro-IP-In-Flight-Limit vor der Signaturverifizierung.

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
an die Gateway-eigene Voice Call-Runtime, sodass die CLI keinen zweiten
Webhook-Server bindet. Wenn kein Gateway erreichbar ist, fallen die Befehle auf eine
eigenständige CLI-Runtime zurück.

`latency` liest `calls.jsonl` aus dem standardmäßigen Speicherpfad für Sprachanrufdaten.
Verwenden Sie `--file <path>`, um auf ein anderes Log zu verweisen, und `--last <n>`, um die
Analyse auf die letzten N Datensätze zu begrenzen (Standard: 200). Die Ausgabe enthält p50/p90/p99
für Antwortlatenz und Wartezeiten beim Zuhören.

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

Dieses Repository enthält eine passende Skill-Dokumentation unter `skills/voice-call/SKILL.md`.

## Gateway-RPC

| Methode              | Argumente                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ist nur mit `mode: "conversation"` gültig. Anrufe im Benachrichtigungsmodus
sollten `voicecall.dtmf` verwenden, nachdem der Anruf existiert, wenn sie nach dem Verbindungsaufbau
Ziffern benötigen.

## Fehlerbehebung

### Setup schlägt bei der Webhook-Freigabe fehl

Führen Sie das Setup aus derselben Umgebung aus, in der auch der Gateway läuft:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Für `twilio`, `telnyx` und `plivo` muss `webhook-exposure` grün sein. Eine
konfigurierte `publicUrl` schlägt trotzdem fehl, wenn sie auf lokalen oder privaten Netzwerkbereich
zeigt, weil der Netzbetreiber diese Adressen nicht zurückrufen kann. Verwenden Sie nicht
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` als `publicUrl`.

Ausgehende Twilio-Anrufe im Benachrichtigungsmodus senden ihr anfängliches `<Say>`-TwiML direkt in
der Anfrage zum Erstellen des Anrufs, daher hängt die erste gesprochene Nachricht nicht davon ab,
dass Twilio Webhook-TwiML abruft. Ein öffentlicher Webhook ist weiterhin für Status-Callbacks,
Konversationsanrufe, DTMF vor dem Verbindungsaufbau, Echtzeit-Streams und Anrufsteuerung nach dem
Verbindungsaufbau erforderlich.

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

Starten oder laden Sie nach einer Konfigurationsänderung den Gateway neu und führen Sie dann aus:

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
wirkt sich nicht auf einen bereits laufenden Gateway aus, bis dieser neu gestartet wird oder seine
Umgebung neu lädt.

### Anrufe starten, aber Provider-Webhooks kommen nicht an

Bestätigen Sie, dass die Provider-Konsole auf die exakte öffentliche Webhook-URL verweist:

```text
https://voice.example.com/voice/webhook
```

Untersuchen Sie dann den Laufzeitstatus:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Häufige Ursachen:

- `publicUrl` verweist auf einen anderen Pfad als `serve.path`.
- Die Tunnel-URL hat sich geändert, nachdem der Gateway gestartet wurde.
- Ein Proxy leitet die Anfrage weiter, entfernt oder überschreibt aber Host-/Proto-Header.
- Firewall oder DNS routen den öffentlichen Hostnamen an einen anderen Ort als den Gateway.
- Der Gateway wurde ohne aktiviertes Voice Call-Plugin neu gestartet.

Wenn sich ein Reverse-Proxy oder Tunnel vor dem Gateway befindet, setzen Sie
`webhookSecurity.allowedHosts` auf den öffentlichen Hostnamen oder verwenden Sie
`webhookSecurity.trustedProxyIPs` für eine bekannte Proxy-Adresse. Verwenden Sie
`webhookSecurity.trustForwardingHeaders` nur, wenn die Proxy-Grenze unter Ihrer Kontrolle steht.

### Signaturprüfung schlägt fehl

Provider-Signaturen werden gegen die öffentliche URL geprüft, die OpenClaw aus der eingehenden
Anfrage rekonstruiert. Wenn Signaturen fehlschlagen:

- Bestätigen Sie, dass die Provider-Webhook-URL exakt mit `publicUrl` übereinstimmt, einschließlich
  Schema, Host und Pfad.
- Aktualisieren Sie bei kostenlosen ngrok-URLs `publicUrl`, wenn sich der Tunnel-Hostname ändert.
- Stellen Sie sicher, dass der Proxy die ursprünglichen Host- und Proto-Header beibehält, oder konfigurieren Sie
  `webhookSecurity.allowedHosts`.
- Aktivieren Sie `skipSignatureVerification` nicht außerhalb lokaler Tests.

### Google Meet-Twilio-Beitritte schlagen fehl

Google Meet verwendet dieses Plugin für Twilio-Einwahlbeitritte. Verifizieren Sie zuerst Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Verifizieren Sie dann den Google Meet-Transport ausdrücklich:

```bash
openclaw googlemeet setup --transport twilio
```

Wenn Voice Call grün ist, der Meet-Teilnehmer aber nie beitritt, prüfen Sie die Meet-
Einwahlnummer, die PIN und `--dtmf-sequence`. Der Telefonanruf kann fehlerfrei sein, während
die Besprechung eine falsche DTMF-Sequenz ablehnt oder ignoriert.

Google Meet übergibt die Meet-DTMF-Sequenz und den Einführungstext an `voicecall.start`.
Bei Twilio-Anrufen stellt Voice Call zuerst das DTMF-TwiML bereit, leitet zurück zum
Webhook und öffnet dann den Echtzeit-Medienstream, damit die gespeicherte Einführung generiert wird,
nachdem der Telefonteilnehmer der Besprechung beigetreten ist.

Verwenden Sie `openclaw logs --follow` für die Live-Phasenablaufverfolgung. Ein fehlerfreier Twilio-Meet-
Beitritt protokolliert diese Reihenfolge:

- Google Meet delegiert den Twilio-Beitritt an Voice Call.
- Voice Call speichert DTMF-TwiML vor dem Verbindungsaufbau.
- Das anfängliche Twilio-TwiML wird verbraucht und vor der Echtzeitverarbeitung bereitgestellt.
- Voice Call stellt Echtzeit-TwiML für den Twilio-Anruf bereit.
- Die Echtzeit-Bridge startet mit der anfänglichen Begrüßung in der Warteschlange.

`openclaw voicecall tail` zeigt weiterhin persistierte Anrufdatensätze; es ist nützlich für
Anrufstatus und Transkripte, aber nicht jeder Webhook-/Echtzeitübergang erscheint dort.

### Echtzeitanruf hat keine Sprache

Bestätigen Sie, dass nur ein Audiomodus aktiviert ist. `realtime.enabled` und
`streaming.enabled` können nicht beide `true` sein.

Prüfen Sie für Echtzeit-Twilio-Anrufe außerdem:

- Ein Echtzeit-Provider-Plugin ist geladen und registriert.
- `realtime.provider` ist nicht gesetzt oder nennt einen registrierten Provider.
- Der Provider-API-Schlüssel ist für den Gateway-Prozess verfügbar.
- `openclaw logs --follow` zeigt, dass Echtzeit-TwiML bereitgestellt, die Echtzeit-Bridge
  gestartet und die anfängliche Begrüßung in die Warteschlange gestellt wurde.

## Verwandte Themen

- [Sprechmodus](/de/nodes/talk)
- [Text-to-Speech](/de/tools/tts)
- [Sprachaktivierung](/de/nodes/voicewake)
