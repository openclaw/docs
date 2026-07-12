---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf über OpenClaw tätigen
    - Sie konfigurieren oder entwickeln das Sprachanruf-Plugin
    - Sie benötigen Echtzeit-Sprachübertragung oder Streaming-Transkription für Telefonie
sidebarTitle: Voice call
summary: Tätigen Sie ausgehende und nehmen Sie eingehende Sprachanrufe über Twilio, Telnyx oder Plivo an, optional mit Echtzeit-Sprachübertragung und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-07-12T02:01:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Sprachanrufe für OpenClaw über ein Plugin: ausgehende Benachrichtigungen, Dialoge
über mehrere Gesprächsrunden, bidirektionale Echtzeit-Sprachübertragung, Streaming-Transkription und
eingehende Anrufe mit Positivlistenrichtlinien.

**Provider:** `mock` (Entwicklung, kein Netzwerk), `plivo` (Voice API + XML-Weiterleitung +
GetInput-Spracherkennung), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Das Voice-Call-Plugin wird **innerhalb des Gateway-Prozesses** ausgeführt. Wenn Sie ein
entferntes Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem Computer, auf dem das
Gateway ausgeführt wird, und starten Sie anschließend das Gateway neu, damit das Plugin geladen wird.
</Note>

## Schnellstart

<Steps>
  <Step title="Plugin installieren">
    <Tabs>
      <Tab title="Über npm">
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
    [Konfiguration](#configuration) unten). Mindestens erforderlich sind: `provider`, die
    Zugangsdaten des Providers, `fromNumber` und eine öffentlich erreichbare Webhook-URL.
  </Step>
  <Step title="Einrichtung überprüfen">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Überprüft die Aktivierung des Plugins, die Zugangsdaten des Providers, die Erreichbarkeit des Webhooks und
    dass nur ein Audiomodus (`streaming` oder `realtime`) aktiv ist.

  </Step>
  <Step title="Smoke-Test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide Befehle führen standardmäßig nur einen Testlauf ohne Änderungen aus. Fügen Sie `--yes` hinzu, um einen kurzen ausgehenden
    Benachrichtigungsanruf zu tätigen:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss die Einrichtung eine **öffentliche Webhook-URL** ergeben.
Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder der Serve-Fallback
auf local loopback oder einen privaten Netzwerkbereich verweist, schlägt die Einrichtung fehl, anstatt
einen Provider zu starten, der keine Webhooks des Telekommunikationsanbieters empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true` festgelegt ist, dem ausgewählten Provider jedoch Zugangsdaten fehlen, protokolliert der Gateway-Start
eine Warnung über die unvollständige Einrichtung mit den fehlenden Schlüsseln und überspringt
das Starten der Laufzeit. Befehle, RPC-Aufrufe und Agentenwerkzeuge geben bei ihrer Verwendung weiterhin die
exakt fehlende Konfiguration zurück.

<Note>
Voice-Call-Zugangsdaten unterstützen SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` und `plugins.entries.voice-call.config.tts.providers.*.apiKey` werden über die standardmäßige SecretRef-Oberfläche aufgelöst; siehe [SecretRef-Zugangsdatenoberfläche](/de/reference/secretref-credential-surface).
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
          sessionScope: "per-phone", // pro Telefon | pro Anruf
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, wie kann ich Ihnen helfen?",
              responseSystemPrompt: "Sie sind ein präziser Spezialist für Baseballkarten.",
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
            defaultMode: "notify", // Benachrichtigung | Dialog
          },

          streaming: { enabled: true /* siehe Streaming-Transkription */ },
          realtime: { enabled: false /* siehe Echtzeit-Sprachdialoge */ },
        },
      },
    },
  },
}
```

### Konfigurationsreferenz

Oben nicht aufgeführte Schlüssel der obersten Ebene unter `plugins.entries.voice-call.config`:

| Schlüssel                       | Standardwert | Hinweise                                                                                       |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Hauptschalter zum Aktivieren und Deaktivieren.                                                  |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Siehe [Eingehende Anrufe](#inbound-calls).   |
| `allowFrom`                     | `[]`         | E.164-Positivliste für `inboundPolicy: "allowlist"`.                                           |
| `maxDurationSeconds`            | `300`        | Feste maximale Dauer pro Anruf, unabhängig vom Annahmestatus erzwungen.                        |
| `staleCallReaperSeconds`        | `120`        | Siehe [Bereinigung veralteter Anrufe](#stale-call-reaper). `0` deaktiviert sie.                 |
| `silenceTimeoutMs`              | `800`        | Stilleerkennung für das Sprachende im klassischen Ablauf (ohne Echtzeitverarbeitung).          |
| `transcriptTimeoutMs`           | `180000`     | Maximale Wartezeit auf ein Transkript des Anrufers, bevor eine Gesprächsrunde abgebrochen wird. |
| `ringTimeoutMs`                 | `30000`      | Zeitüberschreitung beim Klingeln ausgehender Anrufe.                                            |
| `maxConcurrentCalls`            | `1`          | Ausgehende Anrufe über diesem Grenzwert werden abgelehnt.                                       |
| `outbound.notifyHangupDelaySec` | `3`          | Wartezeit in Sekunden nach TTS vor dem automatischen Auflegen im Benachrichtigungsmodus.        |
| `skipSignatureVerification`     | `false`      | Nur für lokale Tests; niemals in der Produktion aktivieren.                                    |
| `store`                         | nicht gesetzt | Überschreibt den standardmäßigen Anrufprotokollpfad `~/.openclaw/voice-calls`.                 |
| `agentId`                       | `"main"`     | Für die Antwortgenerierung und Sitzungsspeicherung verwendeter Agent.                           |
| `responseModel`                 | nicht gesetzt | Überschreibt das Standardmodell für klassische Antworten (ohne Echtzeitverarbeitung).          |
| `responseSystemPrompt`          | generiert    | Benutzerdefinierte Systemanweisung für klassische Antworten.                                   |
| `responseTimeoutMs`             | `30000`      | Zeitüberschreitung für die klassische Antwortgenerierung (ms).                                 |

Twilio verwendet standardmäßig seinen US1-REST-Endpunkt. Um Anrufe in einer unterstützten
Region außerhalb der USA zu verarbeiten, setzen Sie `twilio.region` auf `ie1` oder `au1` und verwenden Sie Zugangsdaten aus
dieser Region. Siehe
[Twilios Leitfaden zur REST API außerhalb der USA](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Hinweise zur Erreichbarkeit und Sicherheit der Provider">
    - Twilio, Telnyx und Plivo benötigen jeweils eine **öffentlich erreichbare** Webhook-URL.
    - `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
    - Telnyx benötigt `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht auf „true“ gesetzt ist.
    - `skipSignatureVerification` ist ausschließlich für lokale Tests vorgesehen.
    - Legen Sie beim kostenlosen ngrok-Tarif `publicUrl` auf die exakte ngrok-URL fest; die Signaturprüfung wird immer erzwungen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` und `serve.bind` local loopback verwendet (lokaler ngrok-Agent). Ausschließlich für die lokale Entwicklung.
    - URLs im kostenlosen ngrok-Tarif können sich ändern oder Zwischenseiten einfügen. Wenn `publicUrl` abweicht, schlägt die Twilio-Signaturprüfung fehl. Für die Produktion sollten Sie eine stabile Domain oder einen Tailscale-Funnel bevorzugen.

  </Accordion>
  <Accordion title="Verbindungslimits für Streaming">
    - `streaming.preStartTimeoutMs` (Standardwert `5000`) schließt Sockets, die niemals einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` (Standardwert `32`) begrenzt die Gesamtzahl nicht authentifizierter Sockets vor dem Start.
    - `streaming.maxPendingConnectionsPerIp` (Standardwert `4`) begrenzt nicht authentifizierte Sockets vor dem Start pro Quell-IP.
    - `streaming.maxConnections` (Standardwert `128`) begrenzt alle geöffneten Media-Stream-Sockets (ausstehend + aktiv).

  </Accordion>
  <Accordion title="Migrationen veralteter Konfigurationen">
    Die Konfigurationsanalyse normalisiert diese veralteten Schlüssel automatisch und protokolliert eine
    Warnung, die den Ersatzpfad nennt. Die Kompatibilitätsschicht wird in einer zukünftigen
    Version (`2026.6.0`) entfernt. Führen Sie daher `openclaw doctor --fix` aus, um die festgeschriebene
    Konfiguration in die kanonische Form umzuschreiben:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` wird entfernt (der Echtzeitkontext verwendet jetzt die generierte Agentenanweisung)

  </Accordion>
</AccordionGroup>

## Sitzungsumfang

Standardmäßig verwendet Voice Call `sessionScope: "per-phone"`, damit wiederholte Anrufe desselben
Anrufers den Gesprächskontext beibehalten. Legen Sie `sessionScope: "per-call"` fest, wenn
jeder Anruf über den Telekommunikationsanbieter mit einem neuen Kontext beginnen soll, beispielsweise bei Empfangs-,
Buchungs-, IVR- oder Google-Meet-Bridge-Abläufen, bei denen dieselbe Telefonnummer
verschiedene Besprechungen repräsentieren kann.

Voice Call speichert generierte Sitzungsschlüssel im konfigurierten Agenten-Namensraum
(`agent:<agentId>:voice:*`). Explizite unverarbeitete Integrationsschlüssel werden im
selben Namensraum aufgelöst: Ein kanonischer Schlüssel `agent:<configuredAgentId>:*` behält diesen
Eigentümer bei und berücksichtigt das Aliasing für `session.mainKey` bzw. den globalen Gültigkeitsbereich des Kerns; fremde oder
fehlerhafte `agent:*`-Eingaben werden als opake Schlüssel unter dem konfigurierten
Agenten eingeordnet; `global` und `unknown` bleiben globale Sentinelwerte.

## Echtzeit-Sprachdialoge

`realtime` wählt einen bidirektionalen Echtzeit-Sprach-Provider für die Live-Audioübertragung von Anrufen aus.
Dies ist von `streaming` getrennt, das Audio ausschließlich an Provider für
Echtzeittranskription weiterleitet.

<Warning>
`realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden. Wählen Sie pro
Anruf genau einen Audiomodus aus.
</Warning>

Aktuelles Laufzeitverhalten:

- `realtime.enabled` wird für Twilio und Telnyx unterstützt.
- `realtime.provider` ist optional. Wenn die Option nicht festgelegt ist, verwendet Voice Call den ersten registrierten Provider für Echtzeit-Sprachverarbeitung.
- Mitgelieferte Provider für Echtzeit-Sprachverarbeitung: Google Gemini Live (`google`) und OpenAI (`openai`), registriert durch ihre Provider-Plugins.
- Die providerspezifische Rohkonfiguration befindet sich unter `realtime.providers.<providerId>`.
- Voice Call stellt standardmäßig das gemeinsame Echtzeit-Tool `openclaw_agent_consult` bereit. Das Echtzeitmodell kann es aufrufen, wenn der Anrufer eine tiefergehende Analyse, aktuelle Informationen oder reguläre OpenClaw-Tools anfordert.
- `realtime.consultPolicy` fügt optional Hinweise dazu hinzu, wann das Echtzeitmodell `openclaw_agent_consult` aufrufen sollte.
- `realtime.agentContext.enabled` ist standardmäßig deaktiviert. Wenn die Option aktiviert ist, fügt Voice Call beim Einrichten der Sitzung eine begrenzte Agentenidentität und eine Kapsel ausgewählter Workspace-Dateien in die Anweisungen für den Echtzeit-Provider ein.
- `realtime.fastContext.enabled` ist standardmäßig deaktiviert. Wenn die Option aktiviert ist, durchsucht Voice Call zunächst den indizierten Speicher- und Sitzungskontext nach der Konsultationsfrage und gibt diese Ausschnitte innerhalb von `realtime.fastContext.timeoutMs` an das Echtzeitmodell zurück. Nur wenn `realtime.fastContext.fallbackToConsult` auf `true` gesetzt ist, wird anschließend auf den vollständigen Konsultations-Agenten zurückgegriffen.
- Wenn `realtime.provider` auf einen nicht registrierten Provider verweist oder überhaupt kein Provider für Echtzeit-Sprachverarbeitung registriert ist, protokolliert Voice Call eine Warnung und überspringt die Echtzeitmedien, anstatt das gesamte Plugin fehlschlagen zu lassen.
- `inboundPolicy` darf nicht auf `"disabled"` gesetzt sein, wenn `realtime.enabled` den Wert `true` hat; `validateProviderConfig` lehnt diese Kombination ab.
- Schlüssel für Konsultationssitzungen verwenden nach Möglichkeit die gespeicherte Anrufsitzung erneut und greifen andernfalls auf den konfigurierten `sessionScope` zurück (standardmäßig `per-phone` oder `per-call` für isolierte Anrufe).

### Tool-Richtlinie

`realtime.toolPolicy` steuert den Konsultationsdurchlauf:

| Richtlinie       | Verhalten                                                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stellt das Konsultations-Tool bereit und beschränkt den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get`.                                           |
| `owner`          | Stellt das Konsultations-Tool bereit und erlaubt dem regulären Agenten, die normale Tool-Richtlinie des Agenten zu verwenden.                                                                             |
| `none`           | Stellt das Konsultations-Tool nicht bereit. Benutzerdefinierte `realtime.tools` werden weiterhin an den Echtzeit-Provider weitergegeben.                                                                  |

`realtime.consultPolicy` steuert ausschließlich die Anweisungen für das Echtzeitmodell:

| Richtlinie    | Anleitung                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `auto`        | Behält den Standard-Prompt bei und überlässt dem Provider die Entscheidung, wann das Konsultations-Tool aufgerufen wird.             |
| `substantive` | Beantwortet einfache verbindende Gesprächselemente direkt und führt vor Fakten, Speicherzugriffen, Tools oder Kontext eine Konsultation durch. |
| `always`      | Führt vor jeder inhaltlichen Antwort eine Konsultation durch.                                                                        |

### Sprachkontext des Agenten

Aktivieren Sie `realtime.agentContext`, wenn die Sprachbrücke wie der
konfigurierte OpenClaw-Agent klingen soll, ohne für gewöhnliche Gesprächsrunden
den vollständigen Hin- und Rücklauf einer Agentenkonsultation auszuführen.
Die Kontextkapsel wird einmalig beim Erstellen der Echtzeitsitzung hinzugefügt,
sodass sie keine zusätzliche Latenz pro Gesprächsrunde verursacht. Aufrufe von
`openclaw_agent_consult` führen weiterhin den vollständigen OpenClaw-Agenten aus
und sollten für Tool-Aufgaben, aktuelle Informationen, Speicherabfragen oder
den Workspace-Zustand verwendet werden.

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

### Beispiele für Echtzeit-Provider

<Tabs>
  <Tab title="Google Gemini Live">
    Standardwerte: API-Schlüssel aus `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` oder `GOOGLE_API_KEY`; Modell
    `gemini-3.1-flash-live-preview`; Stimme `Kore`. `sessionResumption` und
    `contextWindowCompression` sind standardmäßig für längere Anrufe mit
    Wiederverbindung aktiviert. Verwenden Sie `silenceDurationMs`,
    `startSensitivity` und `endSensitivity`, um schnellere Sprecherwechsel
    bei Telefonieaudio einzustellen.

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

Providerspezifische Optionen für Echtzeit-Sprachverarbeitung finden Sie unter
[Google-Provider](/de/providers/google) und
[OpenAI-Provider](/de/providers/openai).

## Streaming-Transkription

`streaming` wählt einen Provider für die Echtzeittranskription von Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn die Option nicht festgelegt ist, verwendet Voice Call den ersten registrierten Provider für Echtzeittranskription.
- Mitgelieferte Provider für Echtzeittranskription: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), registriert durch ihre Provider-Plugins.
- Die providerspezifische Rohkonfiguration befindet sich unter `streaming.providers.<providerId>`.
- Nachdem Twilio eine akzeptierte Stream-Nachricht vom Typ `start` gesendet hat, registriert Voice Call den Stream sofort, reiht eingehende Medien während des Verbindungsaufbaus des Providers zur Verarbeitung durch den Transkriptions-Provider ein und startet die anfängliche Begrüßung erst, wenn die Echtzeittranskription bereit ist.
- Wenn `streaming.provider` auf einen nicht registrierten Provider verweist oder keiner registriert ist, protokolliert Voice Call eine Warnung und überspringt das Medienstreaming, anstatt das gesamte Plugin fehlschlagen zu lassen.

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
    Standardwerte: API-Schlüssel `streaming.providers.xai.apiKey` oder
    `XAI_API_KEY` (greift auf ein xAI-OAuth-Authentifizierungsprofil zurück,
    wenn keiner der beiden Werte festgelegt ist); Endpunkt
    `wss://api.x.ai/v1/stt`; Kodierung `mulaw`; Abtastrate `8000`;
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

Voice Call verwendet die Core-Konfiguration `messages.tts` für das Streaming
von Sprachausgabe bei Anrufen. Sie können sie in der Plugin-Konfiguration mit
**derselben Struktur** überschreiben – sie wird rekursiv mit `messages.tts`
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
**Microsoft-Sprachausgabe wird bei Sprachanrufen ignoriert.** Die
Telefoniesynthese erfordert einen Provider, der eine für Telefonie geeignete
Ausgabe implementiert. Der Microsoft-Provider für Sprachausgabe unterstützt
dies nicht, weshalb er bei Anrufen übersprungen wird und stattdessen andere
Provider in der Fallback-Kette ausprobiert werden.
</Warning>

Hinweise zum Verhalten:

- Veraltete Schlüssel vom Typ `tts.<provider>` innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` repariert; eingecheckte Konfigurationen sollten `tts.providers.<provider>` verwenden.
- Core-TTS wird verwendet, wenn das Twilio-Medienstreaming aktiviert ist; andernfalls greifen Anrufe auf die nativen Stimmen des Providers zurück.
- Wenn bereits ein Twilio-Medienstream aktiv ist, greift Voice Call nicht auf TwiML `<Say>` zurück. Ist Telefonie-TTS in diesem Zustand nicht verfügbar, schlägt die Wiedergabeanforderung fehl, anstatt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückgreift, protokolliert Voice Call zur Fehlerdiagnose eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn das Twilio-Unterbrechen der Wiedergabe oder der Abbau des Streams die ausstehende TTS-Warteschlange leert, werden die eingereihten Wiedergabeanforderungen abgeschlossen, anstatt Anrufer unbegrenzt auf den Abschluss der Wiedergabe warten zu lassen.

### TTS-Beispiele

<Tabs>
  <Tab title="Nur Core-TTS">
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
  <Tab title="Überschreiben mit ElevenLabs (nur Anrufe)">
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
  <Tab title="OpenAI-Modell überschreiben (rekursive Zusammenführung)">
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

Die Richtlinie für eingehende Anrufe ist standardmäßig auf `disabled` gesetzt. Legen Sie Folgendes fest, um eingehende Anrufe zu aktivieren:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` ist eine Identitätsprüfung des Anrufers mit geringer Verlässlichkeit. Das Plugin
normalisiert den vom Provider bereitgestellten Wert `From` und vergleicht ihn mit `allowFrom`.
Die Webhook-Verifizierung authentifiziert die Zustellung durch den Provider und die Integrität der Nutzdaten,
weist jedoch **nicht** nach, dass die PSTN-/VoIP-Rufnummer dem Anrufer gehört. Behandeln Sie
`allowFrom` als Filterung der Anrufer-ID, nicht als zuverlässige Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agentensystem. Passen Sie es mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs` an.

### Routing nach Rufnummer

Verwenden Sie `numbers`, wenn ein Voice-Call-Plugin Anrufe für mehrere Telefonnummern
empfängt und sich jede Nummer wie eine andere Leitung verhalten soll. Beispielsweise
kann eine Nummer einen ungezwungenen persönlichen Assistenten verwenden, während eine
andere eine geschäftliche Persona, einen anderen Antwort-Agenten und eine andere TTS-Stimme nutzt.

Routen werden anhand der vom Provider bereitgestellten gewählten `To`-Nummer ausgewählt. Schlüssel müssen
E.164-Nummern sein. Wenn ein Anruf eingeht, ermittelt Voice Call einmalig die passende
Route, speichert sie im Anrufdatensatz und verwendet diese
effektive Konfiguration erneut für die Begrüßung, den klassischen Pfad für automatische Antworten, den
Echtzeit-Konsultationspfad und die TTS-Wiedergabe. Wenn keine Route übereinstimmt, wird die globale
Voice-Call-Konfiguration verwendet. Ausgehende Anrufe verwenden `numbers` nicht; übergeben Sie beim
Einleiten des Anrufs das ausgehende Ziel, die Nachricht und die Sitzung explizit.

Routenüberschreibungen unterstützen derzeit:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Der Routenwert `tts` wird tief mit der globalen Voice-Call-Konfiguration `tts` zusammengeführt, sodass
Sie normalerweise nur die Stimme des Providers überschreiben müssen:

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

### Vertrag für Sprachausgabe

Für automatische Antworten fügt Voice Call der Systemaufforderung einen strikten Vertrag für die
Sprachausgabe hinzu, der eine JSON-Antwort im Format `{"spoken":"..."}` verlangt. Voice Call
extrahiert den gesprochenen Text defensiv:

- Ignoriert Nutzdaten, die als Überlegungs-/Fehlerinhalte gekennzeichnet sind.
- Analysiert direktes JSON, abgegrenztes JSON oder eingebettete `"spoken"`-Schlüssel.
- Greift auf Klartext zurück und entfernt wahrscheinliche einleitende Planungs-/Metatextabsätze.

Dadurch konzentriert sich die Sprachausgabe auf den für den Anrufer bestimmten Text, und
Planungstext gelangt nicht in die Audioausgabe.

### Verhalten beim Gesprächsstart

Bei ausgehenden `conversation`-Anrufen ist die Verarbeitung der ersten Nachricht an den aktuellen
Wiedergabestatus gekoppelt:

- Das Leeren der Barge-in-Warteschlange und automatische Antworten werden nur unterdrückt, solange die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück, und die erste Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming beginnt beim Aufbau der Streamverbindung ohne zusätzliche Verzögerung.
- Barge-in bricht die aktive Wiedergabe ab und entfernt Twilio-TTS-Einträge aus der Warteschlange, deren Wiedergabe noch nicht begonnen hat. Entfernte Einträge werden als übersprungen abgeschlossen, sodass die Logik für Folgeantworten fortfahren kann, ohne auf Audio zu warten, das niemals abgespielt wird.
- Echtzeit-Sprachgespräche verwenden den eigenen Eröffnungsbeitrag des Echtzeitstreams. Voice Call sendet für diese erste Nachricht **keine** veraltete `<Say>`-TwiML-Aktualisierung, sodass ausgehende `<Connect><Stream>`-Sitzungen verbunden bleiben.

### Kulanzfrist bei Trennung eines Twilio-Streams

Wenn die Verbindung eines Twilio-Medienstreams getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn der Stream innerhalb dieses Zeitfensters erneut verbunden wird, wird die automatische Beendigung abgebrochen.
- Wenn nach Ablauf der Kulanzfrist kein Stream erneut registriert wird, wird der Anruf beendet, um hängengebliebene aktive Anrufe zu verhindern.

## Bereinigung veralteter Anrufe

Verwenden Sie `staleCallReaperSeconds` (Standardwert **120**), um Anrufe zu beenden, die nie
angenommen werden und nie einen aktiven Gesprächsstatus erreichen, beispielsweise Anrufe im
Benachrichtigungsmodus, bei denen der Provider nie einen abschließenden Webhook zustellt. Setzen Sie den Wert zum
Deaktivieren auf `0`.

Die Bereinigung wird alle 30 Sekunden ausgeführt und beendet nur Anrufe, die keinen
`answeredAt`-Zeitstempel haben und sich noch nicht in einem abschließenden oder aktiven
Status (`speaking`/`listening`) befinden. Angenommene Gespräche werden daher von
diesem Zeitgeber niemals bereinigt; `maxDurationSeconds` (Standardwert 300) ist die separate Obergrenze,
die angenommene Anrufe beendet, wenn sie zu lange dauern.

Erhöhen Sie bei benachrichtigungsähnlichen Abläufen, bei denen Netzbetreiber Klingel-/Annahme-Webhooks
verzögert zustellen können, `staleCallReaperSeconds` über den Standardwert hinaus, damit langsame, aber normale
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
die öffentliche URL für die Signaturprüfung. Diese Optionen steuern, welchen
Weiterleitungsheadern vertraut wird:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Zulässige Hosts aus Weiterleitungsheadern.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Weiterleitungsheadern ohne Zulässigkeitsliste vertrauen.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Weiterleitungsheadern nur vertrauen, wenn die Remote-IP der Anfrage mit der Liste übereinstimmt.
</ParamField>

Zusätzliche Schutzmaßnahmen:

- Der Webhook-**Wiederholungsschutz** ist für Twilio, Telnyx und Plivo aktiviert. Wiederholte gültige Webhook-Anfragen werden bestätigt, aber hinsichtlich ihrer Seiteneffekte übersprungen.
- Twilio-Gesprächsbeiträge enthalten in `<Gather>`-Callbacks ein Token pro Beitrag, sodass veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkriptbeitrag erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Inhalts abgelehnt, wenn die erforderlichen Signaturheader des Providers fehlen.
- Der Voice-Call-Webhook verwendet vor der Signaturprüfung das gemeinsame Profil zum Lesen des Inhalts vor der Authentifizierung (maximal 64 KB Inhalt, 5 Sekunden Lesezeitüberschreitung) sowie eine Obergrenze für gleichzeitig laufende Anfragen pro Schlüssel (standardmäßig 8 gleichzeitige Anfragen pro Schlüssel).

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

Wenn das Gateway bereits ausgeführt wird, delegieren operative `voicecall`-Befehle
an die vom Gateway verwaltete Voice-Call-Laufzeit, damit die CLI keinen
zweiten Webhook-Server bindet. Wenn kein Gateway erreichbar ist, greifen die Befehle auf
eine eigenständige CLI-Laufzeit zurück.

`latency` liest `calls.jsonl` aus dem standardmäßigen Voice-Call-Speicherpfad. Verwenden Sie
`--file <path>`, um eine andere Protokolldatei anzugeben, und `--last <n>`, um
die Analyse auf die letzten N Datensätze zu begrenzen (Standardwert 200). Die Ausgabe enthält Minimum/Maximum/Durchschnitt,
p50 und p95 für die Latenz pro Beitrag und die Wartezeiten beim Zuhören.

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

Das Voice-Call-Plugin enthält eine passende Agenten-Skill.

## Gateway-RPC

| Methode                     | Argumente                                                        | Hinweise                                                                                                      |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Greift auf die Konfiguration `toNumber` zurück, wenn `to` weggelassen wird.                                   |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Entspricht `initiate`, akzeptiert aber zusätzlich `dtmfSequence` vor dem Verbindungsaufbau.                    |
| `voicecall.continue`        | `callId`, `message`                                              | Blockiert, bis der Beitrag abgeschlossen ist; gibt das Transkript zurück.                                     |
| `voicecall.continue.start`  | `callId`, `message`                                              | Asynchrone Variante: gibt sofort eine `operationId` zurück.                                                    |
| `voicecall.continue.result` | `operationId`                                                    | Fragt eine ausstehende `voicecall.continue.start`-Operation nach ihrem Ergebnis ab.                           |
| `voicecall.speak`           | `callId`, `message`                                              | Spricht ohne zu warten; verwendet die Echtzeitbrücke, wenn `realtime.enabled` aktiviert ist.                  |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                                               |
| `voicecall.end`             | `callId`                                                         |                                                                                                               |
| `voicecall.status`          | `callId?`                                                        | Lassen Sie `callId` weg, um alle aktiven Anrufe aufzulisten.                                                  |

`dtmfSequence` ist nur mit `mode: "conversation"` gültig; Anrufe im Benachrichtigungsmodus
sollten nach dem Aufbau des Anrufs `voicecall.dtmf` verwenden, wenn nach dem Verbindungsaufbau
Ziffern benötigt werden.

## Fehlerbehebung

### Einrichtung der Webhook-Bereitstellung schlägt fehl

Führen Sie die Einrichtung in derselben Umgebung aus, in der auch das Gateway ausgeführt wird:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Für `twilio`, `telnyx` und `plivo` muss `webhook-exposure` grün sein. Eine
konfigurierte `publicUrl` schlägt weiterhin fehl, wenn sie auf einen lokalen oder privaten
Netzwerkbereich verweist, da der Netzbetreiber diese Adressen nicht zurückrufen kann.
Verwenden Sie nicht `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`–`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` oder andere
Carrier-Grade-NAT-Bereiche als `publicUrl`.

Ausgehende Twilio-Anrufe im Benachrichtigungsmodus senden ihr anfängliches `<Say>`-TwiML direkt
in der Anfrage zur Anruferstellung, sodass die erste gesprochene Nachricht nicht davon abhängt,
dass Twilio Webhook-TwiML abruft. Ein öffentlicher Webhook ist weiterhin für Status-Callbacks,
Gesprächsanrufe, DTMF vor dem Verbindungsaufbau, Echtzeitstreams und
Anrufsteuerung nach dem Verbindungsaufbau erforderlich.

Verwenden Sie einen öffentlichen Bereitstellungspfad:

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

Starten oder laden Sie nach dem Ändern der Konfiguration das Gateway neu und führen Sie anschließend Folgendes aus:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ist ein Testlauf, sofern Sie nicht `--yes` übergeben.

### Provider-Anmeldedaten schlagen fehl

Überprüfen Sie den ausgewählten Provider und die erforderlichen Anmeldedatenfelder:

- Twilio: `twilio.accountSid`, `twilio.authToken` und `fromNumber` oder
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` und `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` und
  `fromNumber` oder `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` und
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` und `fromNumber` oder
  `PLIVO_AUTH_ID` und `PLIVO_AUTH_TOKEN`.

Die Zugangsdaten müssen auf dem Gateway-Host vorhanden sein. Das Bearbeiten eines lokalen Shell-Profils
wirkt sich erst auf einen bereits laufenden Gateway aus, wenn dieser neu gestartet wird oder seine
Umgebung neu lädt.

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
- Die Tunnel-URL hat sich nach dem Start des Gateways geändert.
- Ein Proxy leitet die Anfrage weiter, entfernt oder überschreibt jedoch die Host-/Protokoll-Header.
- Die Firewall oder DNS leitet den öffentlichen Hostnamen an ein anderes Ziel als den Gateway weiter.
- Der Gateway wurde neu gestartet, ohne dass das Voice-Call-Plugin aktiviert war.

Wenn sich ein Reverse-Proxy oder Tunnel vor dem Gateway befindet, setzen Sie
`webhookSecurity.allowedHosts` auf den öffentlichen Hostnamen oder verwenden Sie
`webhookSecurity.trustedProxyIPs` für eine bekannte Proxy-Adresse. Verwenden Sie
`webhookSecurity.trustForwardingHeaders` nur, wenn die Proxy-Grenze
unter Ihrer Kontrolle steht.

### Signaturprüfung schlägt fehl

Provider-Signaturen werden anhand der öffentlichen URL geprüft, die OpenClaw
aus der eingehenden Anfrage rekonstruiert. Wenn die Signaturprüfung fehlschlägt:

- Vergewissern Sie sich, dass die Provider-Webhook-URL exakt mit `publicUrl` übereinstimmt, einschließlich Schema, Host und Pfad.
- Aktualisieren Sie bei URLs des kostenlosen ngrok-Tarifs `publicUrl`, wenn sich der Tunnel-Hostname ändert.
- Stellen Sie sicher, dass der Proxy die ursprünglichen Host- und Protokoll-Header beibehält, oder konfigurieren Sie `webhookSecurity.allowedHosts`.
- Aktivieren Sie `skipSignatureVerification` nicht außerhalb lokaler Tests.

### Twilio-Beitritte zu Google Meet schlagen fehl

Google Meet verwendet dieses Plugin für die Einwahl über Twilio. Überprüfen Sie zunächst Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Überprüfen Sie anschließend ausdrücklich den Google-Meet-Transport:

```bash
openclaw googlemeet setup --transport twilio
```

Wenn Voice Call fehlerfrei funktioniert, der Meet-Teilnehmer aber nie beitritt, prüfen Sie die
Meet-Einwahlnummer, die PIN und `--dtmf-sequence`. Der Telefonanruf kann ordnungsgemäß
funktionieren, während die Besprechung eine falsche DTMF-Sequenz ablehnt oder ignoriert.

Google Meet startet den Twilio-Telefonabschnitt über `voicecall.start` mit einer
DTMF-Sequenz vor dem Verbindungsaufbau. Aus einer PIN abgeleitete Sequenzen enthalten
`voiceCall.dtmfDelayMs` des Google-Meet-Plugins (Standardwert: **12000 ms**) als vorangestellte Twilio-
Warteziffern, da die Meet-Einwahlaufforderungen verspätet eintreffen können. Voice Call leitet anschließend
zurück zur Echtzeitverarbeitung, bevor die Begrüßungsansage angefordert wird.

Verwenden Sie `openclaw logs --follow` für die Live-Phasenverfolgung. Bei einem ordnungsgemäßen Twilio-Meet-
Beitritt werden die Ereignisse in dieser Reihenfolge protokolliert:

- Google Meet delegiert den Twilio-Beitritt an Voice Call.
- Voice Call speichert die DTMF-TwiML für die Phase vor dem Verbindungsaufbau.
- Die anfängliche Twilio-TwiML wird verarbeitet und vor der Echtzeitverarbeitung bereitgestellt.
- Voice Call stellt Echtzeit-TwiML für den Twilio-Anruf bereit.
- Google Meet fordert nach der DTMF-Verzögerung mit `voicecall.speak` die Begrüßungsansage an.

`openclaw voicecall tail` zeigt weiterhin gespeicherte Anrufdatensätze an; dies ist für
Anrufstatus und Transkripte hilfreich, allerdings werden dort nicht alle Webhook-/Echtzeitübergänge
angezeigt.

### Echtzeitanruf enthält keine Sprachausgabe

Stellen Sie sicher, dass nur ein Audiomodus aktiviert ist: `realtime.enabled` und
`streaming.enabled` können nicht beide den Wert `true` haben.

Überprüfen Sie bei Echtzeitanrufen über Twilio/Telnyx außerdem Folgendes:

- Ein Echtzeit-Provider-Plugin ist geladen und registriert.
- `realtime.provider` ist nicht gesetzt oder benennt einen registrierten Provider.
- Der Provider-API-Schlüssel ist für den Gateway-Prozess verfügbar.
- `openclaw logs --follow` zeigt, dass Echtzeit-TwiML bereitgestellt, die Echtzeit-Bridge gestartet und die anfängliche Begrüßung in die Warteschlange gestellt wurde.

## Verwandte Themen

- [Sprechmodus](/de/nodes/talk)
- [Text-zu-Sprache](/de/tools/tts)
- [Sprachaktivierung](/de/nodes/voicewake)
