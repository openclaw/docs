---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf über OpenClaw tätigen
    - Sie konfigurieren oder entwickeln das Sprachanruf-Plugin
    - Sie benötigen Echtzeit-Sprachübertragung oder Streaming-Transkription für Telefonie.
sidebarTitle: Voice call
summary: Tätigen Sie ausgehende und nehmen Sie eingehende Sprachanrufe über Twilio, Telnyx oder Plivo an – mit optionaler Echtzeit-Sprachübertragung und Streaming-Transkription.
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-07-24T04:34:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 79f09f7b5cb99aace0960e283723d4f4408afa5f5dacd71f3c527fa62859f56f
    source_path: plugins/voice-call.md
    workflow: 16
---

Sprachanrufe für OpenClaw über ein Plugin: ausgehende Benachrichtigungen, mehrstufige
Unterhaltungen, Vollduplex-Echtzeitsprachkommunikation, Streaming-Transkription und
eingehende Anrufe mit Positivlistenrichtlinien.

**Provider:** `mock` (Entwicklung, kein Netzwerk), `plivo` (Voice API + XML-Weiterleitung +
GetInput-Spracherkennung), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Das Voice-Call-Plugin wird **innerhalb des Gateway-Prozesses** ausgeführt. Wenn Sie ein
entferntes Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem Rechner, auf dem das
Gateway ausgeführt wird, und starten Sie anschließend das Gateway neu, damit es geladen wird.
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

    Verwenden Sie das Paket ohne Versionsangabe, um dem aktuellen Release-Tag zu folgen. Legen Sie nur dann eine exakte
    Version fest, wenn Sie eine reproduzierbare Installation benötigen. Starten Sie danach das Gateway
    neu, damit das Plugin geladen wird.

  </Step>
  <Step title="Provider und Webhook konfigurieren">
    Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest (siehe
    [Konfiguration](#configuration) unten). Mindestens erforderlich sind: `provider`, die Zugangsdaten des Providers,
    `fromNumber` und eine öffentlich erreichbare Webhook-URL.
  </Step>
  <Step title="Einrichtung überprüfen">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Überprüft die Aktivierung des Plugins, die Zugangsdaten des Providers, die Webhook-Erreichbarkeit und
    dass nur ein Audiomodus (`streaming` oder `realtime`) aktiv ist.

  </Step>
  <Step title="Smoke-Test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide sind standardmäßig Testläufe. Fügen Sie `--yes` hinzu, um einen kurzen ausgehenden
    Benachrichtigungsanruf zu tätigen:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss die Einrichtung eine **öffentliche Webhook-URL** ermitteln.
Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder der Serve-Fallback
auf den Loopback- oder privaten Netzwerkbereich verweist, schlägt die Einrichtung fehl, statt
einen Provider zu starten, der keine Webhooks des Telekommunikationsanbieters empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true`, dem ausgewählten Provider jedoch Zugangsdaten fehlen, protokolliert der Gateway-Start
eine Warnung über eine unvollständige Einrichtung mit den fehlenden Schlüsseln und überspringt
den Start der Laufzeit. Befehle, RPC-Aufrufe und Agentenwerkzeuge geben bei ihrer Verwendung weiterhin die
exakt fehlende Konfiguration zurück.

<Note>
Voice-Call-Zugangsdaten unterstützen SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` und `plugins.entries.voice-call.config.tts.providers.*.apiKey` werden über die standardmäßige SecretRef-Oberfläche aufgelöst; siehe [SecretRef-Oberfläche für Zugangsdaten](/de/reference/secretref-credential-surface).
</Note>

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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, wie kann ich Ihnen helfen?",
              responseSystemPrompt: "Sie sind ein prägnant formulierender Spezialist für Baseballkarten.",
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
            // region: "ie1", // optional: us1 | ie1 | au1; Standardwert ist us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Öffentlicher Telnyx-Webhook-Schlüssel aus dem Mission Control Portal
            // (Base64; kann auch über TELNYX_PUBLIC_KEY festgelegt werden).
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

          // Webhook-Sicherheit (für Tunnel/Proxys empfohlen)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Öffentliche Bereitstellung (eine Option auswählen)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* nur Twilio; siehe Streaming-Transkription */ },
          realtime: { enabled: false /* siehe Echtzeitsprachunterhaltungen */ },
        },
      },
    },
  },
}
```

### Konfigurationsreferenz

Oben nicht gezeigte Schlüssel der obersten Ebene unter `plugins.entries.voice-call.config`:

| Schlüssel                       | Standardwert | Hinweise                                                                                           |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Hauptschalter zum Ein-/Ausschalten.                                                                |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Siehe [Eingehende Anrufe](#inbound-calls).       |
| `allowFrom`                     | `[]`         | E.164-Positivliste für `inboundPolicy: "allowlist"`.                                               |
| `maxDurationSeconds`            | `300`        | Harte Begrenzung der Anrufdauer pro Anruf, unabhängig vom Annahmestatus durchgesetzt.               |
| `staleCallReaperSeconds`        | `120`        | Siehe [Bereinigung veralteter Anrufe](#stale-call-reaper). `0` deaktiviert sie.                   |
| `silenceTimeoutMs`              | `800`        | Erkennung von Stille am Sprachende für den klassischen Ablauf (ohne Echtzeit).                      |
| `transcriptTimeoutMs`           | `180000`     | Maximale Wartezeit auf das Transkript eines Anrufers, bevor eine Gesprächsrunde abgebrochen wird.   |
| `ringTimeoutMs`                 | `30000`      | Klingel-Zeitlimit für ausgehende Anrufe.                                                            |
| `maxConcurrentCalls`            | `1`          | Ausgehende Anrufe über diesem Limit werden abgelehnt.                                               |
| `outbound.notifyHangupDelaySec` | `3`          | Wartezeit in Sekunden nach TTS vor dem automatischen Auflegen im Benachrichtigungsmodus.            |
| `skipSignatureVerification`     | `false`      | Nur für lokale Tests; niemals in der Produktion aktivieren.                                        |
| `store`                         | nicht festgelegt | Überschreibt den standardmäßigen Pfad `$OPENCLAW_STATE_DIR/voice-calls` (normalerweise `~/.openclaw/voice-calls`). |
| `agentId`                       | `"main"`     | Agent für die Antwortgenerierung und Sitzungsspeicherung.                                           |
| `responseModel`                 | nicht festgelegt | Überschreibt das Standardmodell für klassische Antworten (ohne Echtzeit).                           |
| `responseSystemPrompt`          | generiert    | Benutzerdefinierter System-Prompt für klassische Antworten.                                        |
| `responseTimeoutMs`             | `30000`      | Zeitlimit für die klassische Antwortgenerierung (ms).                                               |

Twilio verwendet standardmäßig seinen US1-REST-Endpunkt. Um Anrufe in einer unterstützten
Region außerhalb der USA zu verarbeiten, setzen Sie `twilio.region` auf `ie1` oder `au1` und verwenden Sie Zugangsdaten aus
dieser Region. Siehe
[Twilios Leitfaden zur REST API in Regionen außerhalb der USA](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Hinweise zur Bereitstellung und Sicherheit der Provider">
    - Twilio, Telnyx und Plivo erfordern alle eine **öffentlich erreichbare** Webhook-URL.
    - `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
    - Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht true ist.
    - `skipSignatureVerification` ist ausschließlich für lokale Tests vorgesehen.
    - Legen Sie im kostenlosen ngrok-Tarif `publicUrl` auf die exakte ngrok-URL fest; die Signaturprüfung wird immer durchgesetzt.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` und `serve.bind` ein Loopback-Ziel ist (lokaler ngrok-Agent). Nur für die lokale Entwicklung.
    - URLs des kostenlosen ngrok-Tarifs können sich ändern oder ein vorgeschaltetes Zwischenseitenverhalten hinzufügen; wenn sich `publicUrl` ändert, schlägt die Twilio-Signaturprüfung fehl. Für die Produktion: Bevorzugen Sie eine stabile Domain oder einen Tailscale Funnel.

  </Accordion>
  <Accordion title="Verbindungslimits für Streaming">
    - `streaming.preStartTimeoutMs` (Standardwert `5000`) schließt Sockets, die nie einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` (Standardwert `32`) begrenzt die Gesamtzahl nicht authentifizierter Sockets vor dem Start.
    - `streaming.maxPendingConnectionsPerIp` (Standardwert `4`) begrenzt nicht authentifizierte Sockets vor dem Start pro Quell-IP.
    - `streaming.maxConnections` (Standardwert `128`) begrenzt alle offenen Medienstream-Sockets (ausstehend + aktiv).

  </Accordion>
  <Accordion title="Migrationen veralteter Konfigurationen">
    Beim Parsen der Konfiguration werden diese veralteten Schlüssel automatisch normalisiert, und es wird eine
    Warnung protokolliert, die den Ersatzpfad nennt. Die Übergangslösung wird in einer zukünftigen
    Version (`2026.6.0`) entfernt. Führen Sie daher `openclaw doctor --fix` aus, um die eingecheckte
    Konfiguration in die kanonische Form umzuschreiben:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` wurde entfernt (der Echtzeitkontext verwendet jetzt den generierten Agenten-Prompt)

  </Accordion>
</AccordionGroup>

## Sitzungsumfang

Standardmäßig verwendet Voice Call `sessionScope: "per-phone"`, sodass bei wiederholten Anrufen
desselben Anrufers das Gesprächsgedächtnis erhalten bleibt. Legen Sie `sessionScope: "per-call"` fest, wenn
jeder Anruf über den Telekommunikationsanbieter mit einem neuen Kontext beginnen soll, beispielsweise für Empfangs-,
Buchungs-, IVR- oder Google-Meet-Bridge-Abläufe, bei denen dieselbe Telefonnummer
verschiedene Besprechungen repräsentieren kann.

Voice Call speichert generierte Sitzungsschlüssel unter dem konfigurierten Agenten-Namespace
(`agent:<agentId>:voice:*`). Explizite rohe Integrationsschlüssel werden im
selben Namespace aufgelöst: Ein kanonischer `agent:<configuredAgentId>:*`-Schlüssel behält diesen
Eigentümer bei und berücksichtigt das zentrale `session.mainKey`- beziehungsweise globale Scope-Aliasing; fremde oder
fehlerhafte `agent:*`-Eingaben werden als undurchsichtige Schlüssel unter dem konfigurierten
Agenten eingeordnet; `global` und `unknown` bleiben globale Sentinelwerte.

## Echtzeitsprachunterhaltungen

`realtime` wählt einen Vollduplex-Echtzeitsprach-Provider für Live-Anrufe aus.
Dies ist von `streaming` getrennt, das Audio lediglich an Provider für die Echtzeittranskription
weiterleitet.

<Warning>
`realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden. Wählen Sie pro
Anruf einen Audiomodus.
</Warning>

Aktuelles Laufzeitverhalten:

- `realtime.enabled` wird für Twilio und Telnyx unterstützt.
- `realtime.provider` ist optional. Wenn nicht festgelegt, verwendet Voice Call den ersten registrierten Realtime-Sprach-Provider.
- Gebündelte Realtime-Sprach-Provider: Google Gemini Live (`google`) und OpenAI (`openai`), die von ihren Provider-Plugins registriert werden.
- Die Provider-eigene Rohkonfiguration befindet sich unter `realtime.providers.<providerId>`.
- Voice Call stellt standardmäßig das gemeinsame Realtime-Tool `openclaw_agent_consult` bereit. Das Realtime-Modell kann es aufrufen, wenn der Anrufer eine eingehendere Analyse, aktuelle Informationen oder reguläre OpenClaw-Tools anfordert.
- `realtime.consultPolicy` fügt optional Hinweise dazu hinzu, wann das Realtime-Modell `openclaw_agent_consult` aufrufen soll.
- `realtime.agentContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, fügt Voice Call bei der Sitzungseinrichtung eine begrenzte Agentenidentität und eine Kapsel mit ausgewählten Workspace-Dateien in die Anweisungen für den Realtime-Provider ein.
- `realtime.fastContext.enabled` ist standardmäßig deaktiviert. Wenn aktiviert, durchsucht Voice Call zunächst den indizierten Speicher-/Sitzungskontext nach der Beratungsfrage und gibt diese Ausschnitte innerhalb von `realtime.fastContext.timeoutMs` an das Realtime-Modell zurück. Nur wenn `realtime.fastContext.fallbackToConsult` wahr ist, wird anschließend auf den vollständigen Beratungsagenten zurückgegriffen.
- Wenn `realtime.provider` auf einen nicht registrierten Provider verweist oder überhaupt kein Realtime-Sprach-Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt Realtime-Medien, statt das gesamte Plugin fehlschlagen zu lassen.
- `inboundPolicy` darf nicht `"disabled"` sein, wenn `realtime.enabled` wahr ist; `validateProviderConfig` weist diese Kombination zurück.
- Sitzungsschlüssel für Beratungen verwenden nach Möglichkeit die gespeicherte Anrufsitzung und greifen andernfalls auf die konfigurierte Einstellung `sessionScope` zurück (standardmäßig `per-phone` oder `per-call` für isolierte Anrufe).

### Tool-Richtlinie

`realtime.toolPolicy` steuert den Beratungslauf:

| Richtlinie           | Verhalten                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stellt das Beratungstool bereit und beschränkt den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get`. |
| `owner`          | Stellt das Beratungstool bereit und lässt den regulären Agenten die normale Agenten-Tool-Richtlinie verwenden.                                                      |
| `none`           | Stellt das Beratungstool nicht bereit. Benutzerdefinierte `realtime.tools` werden weiterhin an den Realtime-Provider übergeben.                               |

`realtime.consultPolicy` steuert ausschließlich die Anweisungen für das Realtime-Modell:

| Richtlinie        | Anleitung                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Behält den Standard-Prompt bei und überlässt dem Provider die Entscheidung, wann das Beratungstool aufgerufen wird.              |
| `substantive` | Beantwortet einfache Konversationsübergänge direkt und konsultiert vor Fakten, Speicherzugriffen, Tools oder Kontext. |
| `always`      | Konsultiert vor jeder inhaltlich relevanten Antwort.                                                        |

### Sprachkontext des Agenten

Aktivieren Sie `realtime.agentContext`, wenn die Sprachbrücke wie der
konfigurierte OpenClaw-Agent klingen soll, ohne bei gewöhnlichen Gesprächsrunden
den vollständigen Hin- und Rücklauf einer Agentenberatung zu verursachen. Die Kontextkapsel wird einmalig beim Erstellen
der Realtime-Sitzung hinzugefügt und verursacht daher keine zusätzliche Latenz pro Gesprächsrunde. Aufrufe von
`openclaw_agent_consult` führen weiterhin den vollständigen OpenClaw-Agenten aus und sollten
für Tool-Aufgaben, aktuelle Informationen, Speicherabfragen oder den Workspace-Status verwendet werden.

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
    Standardwerte: API-Schlüssel aus `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    oder `GOOGLE_API_KEY`; Modell `gemini-3.1-flash-live-preview`;
    Stimme `Kore`. `sessionResumption` und `contextWindowCompression` sind standardmäßig
    für längere, erneut verbindbare Anrufe aktiviert. Verwenden Sie `silenceDurationMs`,
    `startSensitivity` und `endSensitivity`, um einen schnelleren Sprecherwechsel bei
    Telefonie-Audio einzustellen.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
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

Weitere Informationen zu Provider-spezifischen Realtime-Sprachoptionen finden Sie unter
[Google-Provider](/de/providers/google) und
[OpenAI-Provider](/de/providers/openai).

## Streaming-Transkription

`streaming` verbindet Twilio Media Streams mit einem Realtime-Transkriptions-Provider.
Der klassische Streaming-Pfad erfordert `provider: "twilio"`; Konfigurationen mit
Telnyx, Plivo oder mock werden zurückgewiesen. Telnyx-Live-Audio verwendet stattdessen den separat
authentifizierten Pfad `realtime.enabled`.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht festgelegt, verwendet Voice Call den ersten registrierten Realtime-Transkriptions-Provider.
- Gebündelte Realtime-Transkriptions-Provider: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), die von ihren Provider-Plugins registriert werden.
- Die Provider-eigene Rohkonfiguration befindet sich unter `streaming.providers.<providerId>`.
- Nachdem Twilio eine akzeptierte Stream-Nachricht `start` gesendet hat, registriert Voice Call den Stream sofort, stellt eingehende Medien während des Verbindungsaufbaus des Providers in die Warteschlange des Transkriptions-Providers und beginnt mit der anfänglichen Begrüßung erst, wenn die Realtime-Transkription bereit ist.
- Wenn `streaming.provider` auf einen nicht registrierten Provider verweist oder keiner registriert ist, protokolliert Voice Call eine Warnung und überspringt das Medienstreaming, statt das gesamte Plugin fehlschlagen zu lassen.

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
                    apiKey: "sk-...", // optional, wenn OPENAI_API_KEY festgelegt ist
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
    Standardwerte: API-Schlüssel `streaming.providers.xai.apiKey` oder `XAI_API_KEY` (greift
    auf ein xAI-OAuth-Authentifizierungsprofil zurück, wenn keiner von beiden festgelegt ist); Endpunkt
    `wss://api.x.ai/v1/stt`; Codierung `mulaw`; Abtastrate `8000`;
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
                    apiKey: "${XAI_API_KEY}", // optional, wenn XAI_API_KEY festgelegt ist
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

Voice Call verwendet die Kernkonfiguration `tts` für die Streaming-Sprachausgabe bei
Anrufen. Sie können sie in der Plugin-Konfiguration mit **derselben Struktur** überschreiben —
sie wird rekursiv mit `tts` zusammengeführt.

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
**Microsoft-Sprachausgabe wird bei Sprachanrufen ignoriert.** Telefoniesynthese erfordert
einen Provider, der eine für Telefonie bestimmte Ausgabe implementiert. Der Microsoft-Sprach-
Provider unterstützt dies nicht, daher wird er bei Anrufen übersprungen und stattdessen werden andere Provider in der
Fallback-Kette ausprobiert.
</Warning>

Hinweise zum Verhalten:

- Veraltete `tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` repariert; die eingecheckte Konfiguration sollte `tts.providers.<provider>` verwenden.
- Kern-TTS wird verwendet, wenn Twilio-Medienstreaming aktiviert ist; andernfalls greifen Anrufe auf die nativen Stimmen des Providers zurück.
- Wenn bereits ein Twilio-Medienstream aktiv ist, greift Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanforderung fehl, statt zwei Wiedergabepfade zu vermischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückgreift, protokolliert Voice Call zur Fehlerdiagnose eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn Twilio-Barge-in oder der Abbau des Streams die ausstehende TTS-Warteschlange leert, werden in die Warteschlange gestellte Wiedergabeanforderungen abgeschlossen, statt Anrufer, die auf den Abschluss der Wiedergabe warten, unbegrenzt hängen zu lassen.

### TTS-Beispiele

<Tabs>
  <Tab title="Nur Core-TTS">
```json5
{
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "alloy" },
    },
  },
}
```
  </Tab>
  <Tab title="Überschreibung mit ElevenLabs (nur Anrufe)">
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
  <Tab title="OpenAI-Modellüberschreibung (Deep-Merge)">
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

Die Richtlinie für eingehende Anrufe ist standardmäßig `disabled`. Um eingehende Anrufe zu aktivieren, legen Sie Folgendes fest:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hallo! Wie kann ich helfen?",
}
```

<Warning>
`inboundPolicy: "allowlist"` ist eine Anrufer-ID-Prüfung mit geringer Vertrauenswürdigkeit. Das Plugin
normalisiert den vom Provider bereitgestellten Wert `From` und vergleicht ihn mit `allowFrom`.
Die Webhook-Verifizierung authentifiziert die Zustellung durch den Provider und die Integrität der Nutzdaten,
beweist jedoch **nicht**, dass die PSTN-/VoIP-Anrufernummer dem Anrufer gehört. Behandeln Sie
`allowFrom` als Anrufer-ID-Filterung, nicht als starke Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agentensystem. Passen Sie sie mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs` an.

### Routing pro Nummer

Verwenden Sie `numbers`, wenn ein Voice-Call-Plugin Anrufe für mehrere Telefonnummern
empfängt und jede Nummer sich wie eine andere Leitung verhalten soll. Beispielsweise
kann eine Nummer einen ungezwungenen persönlichen Assistenten verwenden, während eine andere eine geschäftliche
Persona, einen anderen Antwortagenten und eine andere TTS-Stimme verwendet.

Routen werden anhand der vom Provider bereitgestellten gewählten Nummer `To` ausgewählt. Schlüssel müssen
E.164-Nummern sein. Wenn ein Anruf eingeht, löst Voice Call die passende
Route einmal auf, speichert die zugeordnete Route im Anrufdatensatz und verwendet diese
effektive Konfiguration für die Begrüßung, den klassischen automatischen Antwortpfad, den Echtzeit-
Beratungspfad und die TTS-Wiedergabe erneut. Wenn keine Route übereinstimmt, wird die globale Voice-Call-
Konfiguration verwendet. Ausgehende Anrufe verwenden `numbers` nicht; übergeben Sie das ausgehende
Ziel, die Nachricht und die Sitzung beim Initiieren des Anrufs explizit.

Routenüberschreibungen unterstützen derzeit:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Der Routenwert `tts` wird per Deep-Merge über die globale Voice-Call-Konfiguration `tts` gelegt, sodass
Sie normalerweise nur die Provider-Stimme überschreiben müssen:

```json5
{
  inboundGreeting: "Hallo von der Hauptleitung.",
  responseSystemPrompt: "Sie sind der standardmäßige Sprachassistent.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, wie kann ich helfen?",
      responseSystemPrompt: "Sie sind ein prägnanter Spezialist für Baseballkarten.",
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

Für automatische Antworten hängt Voice Call einen strikten Vertrag für gesprochene Ausgabe an
den System-Prompt an, der eine JSON-Antwort vom Typ `{"spoken":"..."}` verlangt. Voice Call
extrahiert Sprachtext defensiv:

- Ignoriert Nutzdaten, die als Reasoning-/Fehlerinhalt gekennzeichnet sind.
- Parst direktes JSON, JSON in einem Codeblock oder eingebettete Schlüssel vom Typ `"spoken"`.
- Fällt auf Klartext zurück und entfernt wahrscheinliche einleitende Planungs-/Metaabsätze.

Dadurch bleibt die gesprochene Wiedergabe auf an den Anrufer gerichteten Text konzentriert, und es wird vermieden,
dass Planungstext in die Audioausgabe gelangt.

### Verhalten beim Gesprächsstart

Bei ausgehenden Anrufen vom Typ `conversation` ist die Verarbeitung der ersten Nachricht an den aktuellen
Wiedergabestatus gebunden:

- Das Leeren der Barge-in-Warteschlange und die automatische Antwort werden nur unterdrückt, während die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück, und die anfängliche Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming beginnt beim Verbindungsaufbau des Streams ohne zusätzliche Verzögerung.
- Barge-in bricht die aktive Wiedergabe ab und entfernt Twilio-TTS-Einträge aus der Warteschlange, die noch nicht wiedergegeben werden. Entfernte Einträge werden als übersprungen aufgelöst, sodass die Logik für Folgeantworten fortfahren kann, ohne auf Audio zu warten, das niemals wiedergegeben wird.
- Echtzeit-Sprachgespräche verwenden den eigenen Eröffnungsbeitrag des Echtzeit-Streams. Voice Call sendet für diese anfängliche Nachricht **keine** veraltete TwiML-Aktualisierung vom Typ `<Say>`, sodass ausgehende Sitzungen vom Typ `<Connect><Stream>` verbunden bleiben.

### Kulanzfrist bei Trennung des Twilio-Streams

Wenn die Verbindung eines Twilio-Medienstreams getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn der Stream innerhalb dieses Zeitfensters erneut verbunden wird, wird das automatische Beenden abgebrochen.
- Wenn nach Ablauf der Kulanzfrist kein Stream erneut registriert wird, wird der Anruf beendet, um festhängende aktive Anrufe zu verhindern.

## Bereinigung veralteter Anrufe

Verwenden Sie `staleCallReaperSeconds` (Standardwert **120**), um Anrufe zu beenden, die nie
angenommen werden und nie einen aktiven Gesprächsstatus erreichen, beispielsweise Anrufe im Benachrichtigungsmodus,
bei denen der Provider niemals einen abschließenden Webhook zustellt. Setzen Sie den Wert zum
Deaktivieren auf `0`.

Die Bereinigung wird alle 30 Sekunden ausgeführt und beendet nur Anrufe, die keinen
Zeitstempel `answeredAt` aufweisen und sich nicht bereits in einem abschließenden oder aktiven
Status (`speaking`/`listening`) befinden. Angenommene Gespräche werden daher von diesem Timer nie
bereinigt; `maxDurationSeconds` (Standardwert 300) ist die separate Obergrenze, die
angenommene Anrufe beendet, wenn sie zu lange dauern.

Bei Benachrichtigungsabläufen, in denen Mobilfunkanbieter Webhooks für Klingeln/Annahme verzögert
zustellen können, erhöhen Sie `staleCallReaperSeconds` über den Standardwert hinaus, damit langsame, aber normale
Anrufe nicht vorzeitig bereinigt werden; `120`–`300` Sekunden sind ein angemessener Bereich für den
Produktivbetrieb.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Webhook-Sicherheit

Wenn sich ein Proxy oder Tunnel vor dem Gateway befindet, rekonstruiert das Plugin
die öffentliche URL für die Signaturverifizierung. Diese Optionen steuern, welchen
Weiterleitungs-Headern vertraut wird:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts aus Weiterleitungs-Headern zulassen.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Weiterleitungs-Headern ohne Zulassungsliste vertrauen.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Weiterleitungs-Headern nur vertrauen, wenn die Remote-IP der Anfrage mit der Liste übereinstimmt.
</ParamField>

Zusätzliche Schutzmaßnahmen:

- Der Webhook-**Wiederholungsschutz** ist für Twilio, Telnyx und Plivo aktiviert. Wiederholte gültige Webhook-Anfragen werden bestätigt, aber hinsichtlich ihrer Seiteneffekte übersprungen.
- Twilio-Gesprächsbeiträge enthalten in `<Gather>`-Callbacks ein Token pro Beitrag, sodass veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkriptbeitrag erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die erforderlichen Signatur-Header des Providers fehlen.
- Der Voice-Call-Webhook verwendet vor der Signaturverifizierung das gemeinsame Profil zum Lesen des Bodys vor der Authentifizierung (maximal 64 KB Bodygröße, 5 Sekunden Lesezeitlimit) sowie eine Begrenzung gleichzeitig laufender Anfragen pro Schlüssel (standardmäßig 8 gleichzeitige Anfragen pro Schlüssel).

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
openclaw voicecall call --to "+15555550123" --message "Hallo von OpenClaw"
openclaw voicecall start --to "+15555550123"   # Alias für call
openclaw voicecall continue --call-id <id> --message "Haben Sie Fragen?"
openclaw voicecall speak --call-id <id> --message "Einen Moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # Beitragslatenz aus Protokollen zusammenfassen
openclaw voicecall expose --mode funnel
```

Wenn das Gateway bereits ausgeführt wird, delegieren operative Befehle vom Typ `voicecall`
an die vom Gateway verwaltete Voice-Call-Laufzeit, damit die CLI keinen
zweiten Webhook-Server bindet. Wenn kein Gateway erreichbar ist, greifen die Befehle auf
eine eigenständige CLI-Laufzeit zurück.

`latency` liest `calls.jsonl` aus dem standardmäßigen Voice-Call-Speicherpfad. Verwenden Sie
`--file <path>`, um auf ein anderes Protokoll zu verweisen, und `--last <n>`, um
die Analyse auf die letzten N Datensätze zu begrenzen (Standardwert 200). Die Ausgabe enthält Minimum/Maximum/Durchschnitt,
p50 und p95 für Beitragslatenz und Wartezeiten beim Zuhören.

## Agentenwerkzeug

Werkzeugname: `voice_call`.

| Aktion          | Argumente                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Das Voice-Call-Plugin enthält ein entsprechendes Agenten-Skill.

## Gateway-RPC

| Methode                      | Argumente                                                             | Hinweise                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Greift auf die Konfiguration `toNumber` zurück, wenn `to` ausgelassen wird.                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Wie `initiate`, akzeptiert jedoch zusätzlich `dtmfSequence` vor dem Verbindungsaufbau.           |
| `voicecall.continue`        | `callId`, `message`                                              | Blockiert, bis der Turn abgeschlossen ist; gibt das Transkript zurück.                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | Asynchrone Variante: gibt sofort eine `operationId` zurück.                      |
| `voicecall.continue.result` | `operationId`                                                    | Fragt das Ergebnis einer ausstehenden `voicecall.continue.start`-Operation ab.      |
| `voicecall.speak`           | `callId`, `message`                                              | Gibt Sprache aus, ohne zu warten; verwendet die Realtime-Bridge, wenn `realtime.enabled`. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | Lassen Sie `callId` aus, um alle aktiven Anrufe aufzulisten.                                   |

`dtmfSequence` ist nur mit `mode: "conversation"` gültig; Anrufe im Benachrichtigungsmodus
sollten nach dem Bestehen des Anrufs `voicecall.dtmf` verwenden, wenn sie Ziffern
nach dem Verbindungsaufbau benötigen.

## Fehlerbehebung

### Einrichtung der Webhook-Bereitstellung schlägt fehl

Führen Sie die Einrichtung in derselben Umgebung aus, in der der Gateway ausgeführt wird:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Für `twilio`, `telnyx` und `plivo` muss `webhook-exposure` grün sein. Eine
konfigurierte `publicUrl` schlägt weiterhin fehl, wenn sie auf einen lokalen oder privaten
Netzwerkbereich verweist, da der Carrier diese Adressen nicht zurückrufen kann.
Verwenden Sie `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` oder andere
Carrier-Grade-NAT-Bereiche nicht als `publicUrl`.

Ausgehende Twilio-Anrufe im Benachrichtigungsmodus senden ihr anfängliches `<Say>`-TwiML direkt
in der Anfrage zum Erstellen des Anrufs, sodass die erste gesprochene Nachricht nicht davon abhängt,
dass Twilio Webhook-TwiML abruft. Ein öffentlicher Webhook ist dennoch für Status-
Callbacks, Gesprächsanrufe, DTMF vor dem Verbindungsaufbau, Realtime-Streams und
die Anrufsteuerung nach dem Verbindungsaufbau erforderlich.

Verwenden Sie einen öffentlichen Bereitstellungspfad:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // oder
          tunnel: { provider: "ngrok" },
          // oder
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Starten oder laden Sie nach einer Konfigurationsänderung den Gateway neu und führen Sie dann Folgendes aus:

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
  `fromNumber` oder `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` und
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` und `fromNumber` oder
  `PLIVO_AUTH_ID` und `PLIVO_AUTH_TOKEN`.

Die Anmeldedaten müssen auf dem Gateway-Host vorhanden sein. Das Bearbeiten eines lokalen Shell-Profils
wirkt sich erst auf einen bereits ausgeführten Gateway aus, nachdem dieser neu gestartet oder seine
Umgebung neu geladen wurde.

### Anrufe starten, aber Provider-Webhooks treffen nicht ein

Vergewissern Sie sich, dass die Provider-Konsole auf die exakte öffentliche Webhook-URL verweist:

```text
https://voice.example.com/voice/webhook
```

Prüfen Sie anschließend den Laufzeitstatus:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Häufige Ursachen:

- `publicUrl` verweist auf einen anderen Pfad als `serve.path`.
- Die Tunnel-URL wurde nach dem Start des Gateways geändert.
- Ein Proxy leitet die Anfrage weiter, entfernt oder überschreibt jedoch Host-/Proto-Header.
- Die Firewall oder das DNS leitet den öffentlichen Hostnamen an eine andere Stelle als den Gateway weiter.
- Der Gateway wurde neu gestartet, ohne dass das Voice-Call-Plugin aktiviert war.

Wenn sich ein Reverse-Proxy oder Tunnel vor dem Gateway befindet, setzen Sie
`webhookSecurity.allowedHosts` auf den öffentlichen Hostnamen oder verwenden Sie
`webhookSecurity.trustedProxyIPs` für eine bekannte Proxy-Adresse. Verwenden Sie
`webhookSecurity.trustForwardingHeaders` nur, wenn die Proxy-Grenze
unter Ihrer Kontrolle steht.

### Signaturprüfung schlägt fehl

Provider-Signaturen werden anhand der öffentlichen URL geprüft, die OpenClaw
aus der eingehenden Anfrage rekonstruiert. Wenn Signaturen fehlschlagen:

- Vergewissern Sie sich, dass die Provider-Webhook-URL exakt mit `publicUrl` übereinstimmt, einschließlich Schema, Host und Pfad.
- Aktualisieren Sie bei ngrok-URLs des kostenlosen Tarifs `publicUrl`, wenn sich der Tunnel-Hostname ändert.
- Stellen Sie sicher, dass der Proxy die ursprünglichen Host- und Proto-Header beibehält, oder konfigurieren Sie `webhookSecurity.allowedHosts`.
- Aktivieren Sie `skipSignatureVerification` nicht außerhalb lokaler Tests.

### Twilio-Beitritte zu Google Meet schlagen fehl

Google Meet verwendet dieses Plugin für Einwahlbeitritte über Twilio. Prüfen Sie zunächst Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Prüfen Sie anschließend ausdrücklich den Google-Meet-Transport:

```bash
openclaw googlemeet setup --transport twilio
```

Wenn Voice Call grün ist, der Meet-Teilnehmer jedoch nie beitritt, prüfen Sie die Meet-
Einwahlnummer, die PIN und `--dtmf-sequence`. Der Telefonanruf kann fehlerfrei funktionieren,
während die Besprechung eine falsche DTMF-Sequenz ablehnt oder ignoriert.

Google Meet startet den Twilio-Telefonabschnitt über `voicecall.start` mit einer
DTMF-Sequenz vor dem Verbindungsaufbau. Aus der PIN abgeleitete Sequenzen enthalten
`voiceCall.dtmfDelayMs` des Google-Meet-Plugins (Standard: **12000 ms**) als vorangestellte Twilio-
Warteziffern, da Meet-Einwahlaufforderungen verzögert eintreffen können. Voice Call leitet
anschließend zurück zur Realtime-Verarbeitung, bevor die Begrüßung angefordert wird.

Verwenden Sie `openclaw logs --follow` für die Live-Phasenablaufverfolgung. Bei einem fehlerfreien
Twilio-Meet-Beitritt wird diese Reihenfolge protokolliert:

- Google Meet delegiert den Twilio-Beitritt an Voice Call.
- Voice Call speichert DTMF-TwiML für die Phase vor dem Verbindungsaufbau.
- Das anfängliche Twilio-TwiML wird verarbeitet und vor der Realtime-Verarbeitung bereitgestellt.
- Voice Call stellt Realtime-TwiML für den Twilio-Anruf bereit.
- Google Meet fordert nach der Verzögerung nach der DTMF-Eingabe mit `voicecall.speak` die Einleitung an.

`openclaw voicecall tail` zeigt weiterhin persistierte Anrufdatensätze an; dies ist für
Anrufstatus und Transkripte nützlich, dort erscheint jedoch nicht jeder Webhook-/Realtime-Übergang.

### Realtime-Anruf hat keine Sprachausgabe

Vergewissern Sie sich, dass nur ein Audiomodus aktiviert ist: `realtime.enabled` und
`streaming.enabled` können nicht beide auf „true“ gesetzt sein.

Prüfen Sie für Realtime-Anrufe über Twilio/Telnyx außerdem Folgendes:

- Ein Realtime-Provider-Plugin ist geladen und registriert.
- `realtime.provider` ist nicht gesetzt oder benennt einen registrierten Provider.
- Der API-Schlüssel des Providers ist für den Gateway-Prozess verfügbar.
- `openclaw logs --follow` zeigt, dass Realtime-TwiML bereitgestellt, die Realtime-Bridge gestartet und die anfängliche Begrüßung in die Warteschlange gestellt wurde.

## Verwandte Themen

- [Sprechmodus](/de/nodes/talk)
- [Text-zu-Sprache](/de/tools/tts)
- [Sprachaktivierung](/de/nodes/voicewake)
