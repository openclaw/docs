---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf über OpenClaw tätigen
    - Sie konfigurieren oder entwickeln das Plugin für Sprachanrufe.
    - Sie benötigen Echtzeit-Sprachübertragung oder Streaming-Transkription für Telefonie.
sidebarTitle: Voice call
summary: Tätigen Sie ausgehende Sprachanrufe und nehmen Sie eingehende Sprachanrufe über Twilio, Telnyx oder Plivo an, optional mit Echtzeit-Sprachübertragung und Streaming-Transkription
title: Sprachanruf-Plugin
x-i18n:
    generated_at: "2026-07-12T15:40:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Sprachanrufe für OpenClaw über ein Plugin: ausgehende Benachrichtigungen, mehrstufige
Unterhaltungen, Vollduplex-Echtzeitsprachübertragung, Streaming-Transkription und
eingehende Anrufe mit Zulassungslistenrichtlinien.

**Provider:** `mock` (Entwicklung, kein Netzwerk), `plivo` (Voice API + XML-Weiterleitung +
GetInput-Spracherkennung), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Das Voice-Call-Plugin wird **innerhalb des Gateway-Prozesses** ausgeführt. Wenn Sie ein
entferntes Gateway verwenden, installieren und konfigurieren Sie das Plugin auf dem Rechner, auf dem das
Gateway ausgeführt wird, und starten Sie anschließend das Gateway neu, um es zu laden.
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
    Version fest, wenn Sie eine reproduzierbare Installation benötigen. Starten Sie anschließend das Gateway
    neu, damit das Plugin geladen wird.

  </Step>
  <Step title="Provider und Webhook konfigurieren">
    Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest (siehe
    [Konfiguration](#configuration) unten). Erforderlich sind mindestens: `provider`, die Zugangsdaten des
    Providers, `fromNumber` und eine öffentlich erreichbare Webhook-URL.
  </Step>
  <Step title="Einrichtung überprüfen">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Überprüft die Aktivierung des Plugins, die Zugangsdaten des Providers, die Webhook-Erreichbarkeit und
    ob nur ein Audiomodus (`streaming` oder `realtime`) aktiv ist.

  </Step>
  <Step title="Smoke-Test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide Befehle sind standardmäßig Testläufe ohne Ausführung. Fügen Sie `--yes` hinzu, um einen kurzen ausgehenden
    Benachrichtigungsanruf zu tätigen:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Für Twilio, Telnyx und Plivo muss die Einrichtung eine **öffentliche Webhook-URL** ergeben.
Wenn `publicUrl`, die Tunnel-URL, die Tailscale-URL oder der Serve-Fallback
auf den Loopback-Adressraum oder einen privaten Netzwerkadressraum verweist, schlägt die Einrichtung fehl, statt
einen Provider zu starten, der keine Carrier-Webhooks empfangen kann.
</Warning>

## Konfiguration

Wenn `enabled: true` gesetzt ist, dem ausgewählten Provider jedoch Zugangsdaten fehlen, protokolliert der Gateway-Start
eine Warnung über die unvollständige Einrichtung mit den fehlenden Schlüsseln und überspringt
den Start der Runtime. Befehle, RPC-Aufrufe und Agent-Tools geben bei ihrer Verwendung weiterhin
die exakte fehlende Konfiguration zurück.

<Note>
Voice-Call-Zugangsdaten unterstützen SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` und `plugins.entries.voice-call.config.tts.providers.*.apiKey` werden über die standardmäßige SecretRef-Schnittstelle aufgelöst; siehe [SecretRef-Schnittstelle für Zugangsdaten](/de/reference/secretref-credential-surface).
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
            defaultMode: "notify", // Benachrichtigung | Unterhaltung
          },

          streaming: { enabled: true /* siehe Streaming-Transkription */ },
          realtime: { enabled: false /* siehe Echtzeit-Sprachunterhaltungen */ },
        },
      },
    },
  },
}
```

### Konfigurationsreferenz

Oben nicht aufgeführte Schlüssel der obersten Ebene unter `plugins.entries.voice-call.config`:

| Schlüssel                       | Standardwert | Hinweise                                                                               |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Hauptschalter zum Aktivieren und Deaktivieren.                                         |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Siehe [Eingehende Anrufe](#inbound-calls). |
| `allowFrom`                     | `[]`         | E.164-Zulassungsliste für `inboundPolicy: "allowlist"`.                                |
| `maxDurationSeconds`            | `300`        | Harte Höchstdauer pro Anruf, unabhängig vom Annahmestatus durchgesetzt.                |
| `staleCallReaperSeconds`        | `120`        | Siehe [Bereinigung veralteter Anrufe](#stale-call-reaper). `0` deaktiviert sie.         |
| `silenceTimeoutMs`              | `800`        | Stilleerkennung am Sprachende für den klassischen Ablauf (nicht in Echtzeit).          |
| `transcriptTimeoutMs`           | `180000`     | Maximale Wartezeit auf ein Transkript des Anrufers, bevor eine Gesprächsrunde aufgegeben wird. |
| `ringTimeoutMs`                 | `30000`      | Klingelzeitüberschreitung für ausgehende Anrufe.                                       |
| `maxConcurrentCalls`            | `1`          | Ausgehende Anrufe über dieses Limit hinaus werden abgelehnt.                           |
| `outbound.notifyHangupDelaySec` | `3`          | Wartezeit in Sekunden nach TTS vor dem automatischen Auflegen im Benachrichtigungsmodus. |
| `skipSignatureVerification`     | `false`      | Nur für lokale Tests; niemals in der Produktion aktivieren.                            |
| `store`                         | nicht gesetzt | Überschreibt den standardmäßigen Anrufprotokollpfad `~/.openclaw/voice-calls`.         |
| `agentId`                       | `"main"`     | Für die Antwortgenerierung und Sitzungsspeicherung verwendeter Agent.                  |
| `responseModel`                 | nicht gesetzt | Überschreibt das Standardmodell für klassische Antworten (nicht in Echtzeit).         |
| `responseSystemPrompt`          | generiert    | Benutzerdefinierter System-Prompt für klassische Antworten.                            |
| `responseTimeoutMs`             | `30000`      | Zeitüberschreitung für die klassische Antwortgenerierung (ms).                         |

Twilio verwendet standardmäßig seinen US1-REST-Endpunkt. Um Anrufe in einer unterstützten
Region außerhalb der USA zu verarbeiten, setzen Sie `twilio.region` auf `ie1` oder `au1` und verwenden Sie Zugangsdaten aus
dieser Region. Siehe
[Twilios Leitfaden zur REST API außerhalb der USA](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Hinweise zur Provider-Bereitstellung und Sicherheit">
    - Twilio, Telnyx und Plivo benötigen jeweils eine **öffentlich erreichbare** Webhook-URL.
    - `mock` ist ein lokaler Entwicklungs-Provider (keine Netzwerkaufrufe).
    - Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht auf true gesetzt ist.
    - `skipSignatureVerification` ist ausschließlich für lokale Tests vorgesehen.
    - Legen Sie beim kostenlosen ngrok-Tarif `publicUrl` auf die exakte ngrok-URL fest; die Signaturprüfung wird immer erzwungen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` festgelegt und `serve.bind` eine Loopback-Adresse ist (lokaler ngrok-Agent). Nur für die lokale Entwicklung.
    - URLs des kostenlosen ngrok-Tarifs können sich ändern oder Zwischenseiten einfügen; wenn `publicUrl` abweicht, schlägt die Twilio-Signaturprüfung fehl. Für die Produktion: Verwenden Sie vorzugsweise eine stabile Domain oder einen Tailscale-Funnel.

  </Accordion>
  <Accordion title="Verbindungslimits für Streaming">
    - `streaming.preStartTimeoutMs` (Standardwert `5000`) schließt Sockets, die nie einen gültigen `start`-Frame senden.
    - `streaming.maxPendingConnections` (Standardwert `32`) begrenzt die Gesamtzahl nicht authentifizierter Sockets vor dem Start.
    - `streaming.maxPendingConnectionsPerIp` (Standardwert `4`) begrenzt nicht authentifizierte Sockets vor dem Start pro Quell-IP.
    - `streaming.maxConnections` (Standardwert `128`) begrenzt alle offenen Medienstream-Sockets (ausstehend + aktiv).

  </Accordion>
  <Accordion title="Migrationen veralteter Konfigurationen">
    Beim Parsen der Konfiguration werden diese veralteten Schlüssel automatisch normalisiert und eine
    Warnung mit dem Ersatzpfad protokolliert; der Kompatibilitätsmechanismus wird in einer zukünftigen
    Version (`2026.6.0`) entfernt. Führen Sie daher `openclaw doctor --fix` aus, um die gespeicherte
    Konfiguration in die kanonische Form umzuschreiben:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` wird entfernt (der Echtzeitkontext verwendet nun den generierten Agent-Prompt)

  </Accordion>
</AccordionGroup>

## Sitzungsumfang

Standardmäßig verwendet Voice Call `sessionScope: "per-phone"`, damit wiederholte Anrufe desselben
Anrufers den Unterhaltungsspeicher beibehalten. Setzen Sie `sessionScope: "per-call"`, wenn
jeder Carrier-Anruf mit einem neuen Kontext beginnen soll, beispielsweise bei Empfangs-,
Buchungs-, IVR- oder Google-Meet-Bridge-Abläufen, bei denen dieselbe Telefonnummer
unterschiedliche Besprechungen repräsentieren kann.

Voice Call speichert generierte Sitzungsschlüssel unter dem konfigurierten Agent-Namensraum
(`agent:<agentId>:voice:*`). Explizite rohe Integrationsschlüssel werden in denselben
Namensraum aufgelöst: Ein kanonischer Schlüssel `agent:<configuredAgentId>:*` behält seinen
Eigentümer bei und berücksichtigt das Aliasing von `session.mainKey` bzw. globalem Umfang im Kern; fremde oder
fehlerhafte `agent:*`-Eingaben werden als opake Schlüssel unter dem konfigurierten
Agent eingeordnet; `global` und `unknown` bleiben globale Sentinel-Werte.

## Echtzeit-Sprachunterhaltungen

`realtime` wählt einen Vollduplex-Echtzeitsprach-Provider für Live-Anrufaudio aus.
Dies ist von `streaming` getrennt, das Audio ausschließlich an Provider für die Echtzeittranskription
weiterleitet.

<Warning>
`realtime.enabled` kann nicht mit `streaming.enabled` kombiniert werden. Wählen Sie pro
Anruf einen Audiomodus.
</Warning>

Aktuelles Runtime-Verhalten:

- `realtime.enabled` wird für Twilio und Telnyx unterstützt.
- `realtime.provider` ist optional. Wenn nicht festgelegt, verwendet Voice Call den ersten registrierten Echtzeit-Sprach-Provider.
- Mitgelieferte Echtzeit-Sprach-Provider: Google Gemini Live (`google`) und OpenAI (`openai`), die von ihren Provider-Plugins registriert werden.
- Die Provider-eigene Rohkonfiguration befindet sich unter `realtime.providers.<providerId>`.
- Voice Call stellt standardmäßig das gemeinsame Echtzeit-Tool `openclaw_agent_consult` bereit. Das Echtzeitmodell kann es aufrufen, wenn der Anrufer eine tiefere Analyse, aktuelle Informationen oder reguläre OpenClaw-Tools anfordert.
- `realtime.consultPolicy` fügt optional Hinweise dazu hinzu, wann das Echtzeitmodell `openclaw_agent_consult` aufrufen sollte.
- `realtime.agentContext.enabled` ist standardmäßig deaktiviert. Wenn diese Option aktiviert ist, fügt Voice Call beim Einrichten der Sitzung eine begrenzte Agentenidentität und eine Auswahl von Arbeitsbereichsdateien als Kapsel in die Anweisungen für den Echtzeit-Provider ein.
- `realtime.fastContext.enabled` ist standardmäßig deaktiviert. Wenn diese Option aktiviert ist, durchsucht Voice Call zunächst den indizierten Speicher-/Sitzungskontext nach der Beratungsfrage und gibt diese Ausschnitte innerhalb von `realtime.fastContext.timeoutMs` an das Echtzeitmodell zurück. Nur wenn `realtime.fastContext.fallbackToConsult` wahr ist, wird anschließend auf den vollständigen Beratungsagenten zurückgegriffen.
- Wenn `realtime.provider` auf einen nicht registrierten Provider verweist oder überhaupt kein Echtzeit-Sprach-Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt Echtzeitmedien, statt das gesamte Plugin fehlschlagen zu lassen.
- `inboundPolicy` darf nicht `"disabled"` sein, wenn `realtime.enabled` wahr ist; `validateProviderConfig` lehnt diese Kombination ab.
- Sitzungsschlüssel für Beratungen verwenden die gespeicherte Anrufsitzung erneut, sofern sie verfügbar ist, und greifen andernfalls auf den konfigurierten Wert `sessionScope` zurück (standardmäßig `per-phone` oder `per-call` für isolierte Anrufe).

### Tool-Richtlinie

`realtime.toolPolicy` steuert den Beratungsdurchlauf:

| Richtlinie       | Verhalten                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stellt das Beratungs-Tool bereit und beschränkt den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get`. |
| `owner`          | Stellt das Beratungs-Tool bereit und erlaubt dem regulären Agenten, die normale Tool-Richtlinie des Agenten zu verwenden.                                  |
| `none`           | Stellt das Beratungs-Tool nicht bereit. Benutzerdefinierte `realtime.tools` werden weiterhin an den Echtzeit-Provider weitergeleitet.                      |

`realtime.consultPolicy` steuert nur die Anweisungen für das Echtzeitmodell:

| Richtlinie    | Anleitung                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `auto`        | Behalten Sie den Standard-Prompt bei und lassen Sie den Provider entscheiden, wann das Konsultationswerkzeug aufgerufen wird. |
| `substantive` | Beantworten Sie einfache verbindende Gesprächselemente direkt und führen Sie vor Fakten, Erinnerungen, Werkzeugen oder Kontext eine Konsultation durch. |
| `always`      | Führen Sie vor jeder inhaltlichen Antwort eine Konsultation durch.                                                    |

### Sprachkontext des Agenten

Aktivieren Sie `realtime.agentContext`, wenn die Sprachbrücke wie der
konfigurierte OpenClaw-Agent klingen soll, ohne bei gewöhnlichen Gesprächsbeiträgen den vollständigen
Roundtrip einer Agentenkonsultation in Kauf zu nehmen. Die Kontextkapsel wird einmal beim Erstellen
der Echtzeitsitzung hinzugefügt, sodass dadurch keine zusätzliche Latenz pro Gesprächsbeitrag
entsteht. Aufrufe von `openclaw_agent_consult` führen weiterhin den vollständigen OpenClaw-Agenten aus und sollten
für Werkzeugaufgaben, aktuelle Informationen, Speicherabfragen oder den Workspace-Status verwendet werden.

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
    aktiviert, um längere Anrufe mit Wiederverbindung zu ermöglichen. Verwenden Sie
    `silenceDurationMs`, `startSensitivity` und `endSensitivity`, um schnellere
    Sprecherwechsel bei Telefonie-Audio abzustimmen.

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
                instructions: "Sprechen Sie kurz. Rufen Sie openclaw_agent_consult auf, bevor Sie weitergehende Tools verwenden.",
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

Unter [Google-Provider](/de/providers/google) und
[OpenAI-Provider](/de/providers/openai) finden Sie providerspezifische Optionen
für Realtime-Sprachanrufe.

## Streaming-Transkription

`streaming` wählt einen Realtime-Transkriptions-Provider für Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn diese Option nicht festgelegt ist, verwendet Voice Call den ersten registrierten Provider für Echtzeittranskription.
- Mitgelieferte Provider für Echtzeittranskription: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI (`xai`), die jeweils von ihren Provider-Plugins registriert werden.
- Die Provider-eigene Rohkonfiguration befindet sich unter `streaming.providers.<providerId>`.
- Nachdem Twilio eine akzeptierte Stream-`start`-Nachricht gesendet hat, registriert Voice Call den Stream sofort, reiht eingehende Medien während des Verbindungsaufbaus des Providers zur Verarbeitung durch den Transkriptions-Provider ein und startet die erste Begrüßung erst, wenn die Echtzeittranskription bereit ist.
- Wenn `streaming.provider` auf einen nicht registrierten Provider verweist oder kein Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt das Medienstreaming, statt das gesamte Plugin fehlschlagen zu lassen.

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
    Standardwerte: API-Schlüssel `streaming.providers.xai.apiKey` oder `XAI_API_KEY`
    (greift auf ein xAI-OAuth-Authentifizierungsprofil zurück, wenn keines von beiden
    festgelegt ist); Endpunkt `wss://api.x.ai/v1/stt`; Kodierung `mulaw`;
    Abtastrate `8000`; `endpointingMs: 800`; `interimResults: true`.

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

Voice Call verwendet die zentrale `messages.tts`-Konfiguration für gestreamte
Sprachausgabe bei Anrufen. Sie können sie in der Plugin-Konfiguration mit
**derselben Struktur** überschreiben — sie wird tief mit `messages.tts`
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
**Microsoft-Sprachausgabe wird für Sprachanrufe ignoriert.** Die Telefoniesynthese
erfordert einen Provider, der eine für Telefonie vorgesehene Ausgabe implementiert.
Der Microsoft-Sprachausgabe-Provider bietet dies nicht, weshalb er bei Anrufen
übersprungen wird und stattdessen andere Provider in der Fallback-Kette ausprobiert
werden.
</Warning>

Hinweise zum Verhalten:

- Veraltete `tts.<provider>`-Schlüssel in der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden durch `openclaw doctor --fix` korrigiert; die gespeicherte Konfiguration sollte `tts.providers.<provider>` verwenden.
- Die zentrale TTS wird verwendet, wenn Twilio-Medienstreaming aktiviert ist; andernfalls greifen Anrufe auf die nativen Stimmen des Providers zurück.
- Wenn bereits ein Twilio-Medienstream aktiv ist, greift Voice Call nicht auf TwiML `<Say>` zurück. Ist Telefonie-TTS in diesem Zustand nicht verfügbar, schlägt die Wiedergabeanforderung fehl, statt zwei Wiedergabepfade zu vermischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückgreift, protokolliert Voice Call zur Fehlerdiagnose eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).
- Wenn Twilio-Barge-in oder der Abbau des Streams die ausstehende TTS-Warteschlange leert, werden eingereihte Wiedergabeanforderungen abgeschlossen, statt Anrufer, die auf den Abschluss der Wiedergabe warten, unbegrenzt warten zu lassen.

### TTS-Beispiele

<Tabs>
  <Tab title="Nur zentrale TTS">
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
  <Tab title="Überschreibung des OpenAI-Modells (tiefe Zusammenführung)">
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

Die Richtlinie für eingehende Anrufe ist standardmäßig auf `disabled` festgelegt. Um eingehende Anrufe zu aktivieren, legen Sie Folgendes fest:

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
weist jedoch **nicht** den Besitz der PSTN-/VoIP-Rufnummer des Anrufers nach. Behandeln Sie
`allowFrom` als Filterung der Anrufer-ID, nicht als starke Anruferidentität.
</Warning>

Automatische Antworten verwenden das Agentensystem. Passen Sie sie mit `responseModel`,
`responseSystemPrompt` und `responseTimeoutMs` an.

### Routing pro Rufnummer

Verwenden Sie `numbers`, wenn ein Voice-Call-Plugin Anrufe für mehrere Telefonnummern
empfängt und sich jede Nummer wie eine andere Leitung verhalten soll. Beispielsweise
kann eine Nummer einen ungezwungenen persönlichen Assistenten verwenden, während eine andere eine geschäftliche
Persona, einen anderen Antwort-Agenten und eine andere TTS-Stimme verwendet.

Routen werden anhand der vom Provider bereitgestellten gewählten `To`-Nummer ausgewählt. Schlüssel müssen
E.164-Nummern sein. Wenn ein Anruf eingeht, ermittelt Voice Call einmalig die passende
Route, speichert die gefundene Route im Anrufdatensatz und verwendet diese
wirksame Konfiguration erneut für die Begrüßung, den klassischen Pfad für automatische Antworten, den Echtzeit-
Beratungspfad und die TTS-Wiedergabe. Wenn keine Route übereinstimmt, wird die globale Voice-Call-
Konfiguration verwendet. Ausgehende Anrufe verwenden `numbers` nicht; übergeben Sie beim Einleiten des Anrufs
das ausgehende Ziel, die Nachricht und die Sitzung explizit.

Routenüberschreibungen unterstützen derzeit:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Der Routenwert `tts` wird rekursiv mit der globalen Voice-Call-Konfiguration `tts` zusammengeführt, sodass
Sie üblicherweise nur die Provider-Stimme überschreiben müssen:

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
      inboundGreeting: "Silver Fox Cards, wie kann ich Ihnen helfen?",
      responseSystemPrompt: "Sie sind ein prägnanter Spezialist für Baseball-Sammelkarten.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Vertrag für die Sprachausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für die Sprachausgabe an
den System-Prompt an, der eine JSON-Antwort im Format `{"spoken":"..."}` verlangt. Voice Call
extrahiert den Sprachtext defensiv:

- Ignoriert Nutzdaten, die als Denkprozess- oder Fehlerinhalt gekennzeichnet sind.
- Analysiert direktes JSON, JSON in Codeblöcken oder eingebettete `"spoken"`-Schlüssel.
- Greift auf Klartext zurück und entfernt wahrscheinliche einleitende Planungs-/Metaabsätze.

Dadurch bleibt die gesprochene Wiedergabe auf den für den Anrufer bestimmten Text konzentriert und es wird vermieden,
dass Planungstext in die Audioausgabe gelangt.

### Verhalten beim Gesprächsstart

Bei ausgehenden `conversation`-Anrufen ist die Verarbeitung der ersten Nachricht an den aktuellen
Wiedergabestatus gebunden:

- Das Leeren der Barge-in-Warteschlange und automatische Antworten werden nur unterdrückt, solange die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück und die anfängliche Nachricht bleibt für einen erneuten Versuch in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming beginnt beim Aufbau der Stream-Verbindung ohne zusätzliche Verzögerung.
- Barge-in bricht die aktive Wiedergabe ab und entfernt Twilio-TTS-Einträge aus der Warteschlange, deren Wiedergabe noch nicht begonnen hat. Entfernte Einträge werden als übersprungen aufgelöst, sodass die Logik für Folgeantworten fortfahren kann, ohne auf Audio zu warten, das niemals abgespielt wird.
- Echtzeit-Sprachgespräche verwenden den eigenen Eröffnungsbeitrag des Echtzeit-Streams. Voice Call sendet für diese anfängliche Nachricht **keine** veraltete `<Say>`-TwiML-Aktualisierung, sodass ausgehende `<Connect><Stream>`-Sitzungen verbunden bleiben.

### Karenzzeit bei Trennung eines Twilio-Streams

Wenn die Verbindung zu einem Twilio-Medienstream getrennt wird, wartet Voice Call **2000 ms**, bevor
der Anruf automatisch beendet wird:

- Wenn der Stream innerhalb dieses Zeitfensters erneut verbunden wird, wird die automatische Beendigung abgebrochen.
- Wenn sich nach Ablauf der Karenzzeit kein Stream erneut registriert, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## Bereinigung veralteter Anrufe

Verwenden Sie `staleCallReaperSeconds` (Standardwert **120**), um Anrufe zu beenden, die niemals
angenommen werden und niemals einen aktiven Gesprächszustand erreichen, beispielsweise Anrufe im Benachrichtigungsmodus,
bei denen der Provider niemals einen abschließenden Webhook zustellt. Setzen Sie den Wert zum
Deaktivieren auf `0`.

Die Bereinigung wird alle 30 Sekunden ausgeführt und beendet nur Anrufe, die keinen
`answeredAt`-Zeitstempel haben und sich nicht bereits in einem abschließenden oder aktiven
Zustand (`speaking`/`listening`) befinden. Angenommene Gespräche werden daher von diesem Zeitgeber niemals
bereinigt; `maxDurationSeconds` (Standardwert 300) ist die separate Obergrenze, die
angenommene Anrufe beendet, wenn sie zu lange dauern.

Erhöhen Sie bei Benachrichtigungsabläufen, bei denen Mobilfunkanbieter Klingel-/Annahme-
Webhooks möglicherweise langsam zustellen, `staleCallReaperSeconds` über den Standardwert hinaus, damit langsame, aber normale
Anrufe nicht vorzeitig bereinigt werden; `120`-`300` Sekunden sind ein angemessener Bereich für den
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

- Der Webhook-**Wiederholungsschutz** ist für Twilio, Telnyx und Plivo aktiviert. Wiederholte gültige Webhook-Anfragen werden bestätigt, aber hinsichtlich ihrer Nebenwirkungen übersprungen.
- Twilio-Gesprächsbeiträge enthalten in `<Gather>`-Callbacks ein beitragsspezifisches Token, sodass veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkriptbeitrag erfüllen können.
- Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgewiesen, wenn die vom Provider erforderlichen Signatur-Header fehlen.
- Der Voice-Call-Webhook verwendet vor der Signaturverifizierung das gemeinsame Profil zum Lesen des Bodys vor der Authentifizierung (maximal 64 KB Body, 5 Sekunden Lesezeitlimit) sowie eine Obergrenze für gleichzeitig laufende Anfragen pro Schlüssel (standardmäßig 8 gleichzeitige Anfragen pro Schlüssel).

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
openclaw voicecall continue --call-id <id> --message "Haben Sie noch Fragen?"
openclaw voicecall speak --call-id <id> --message "Einen Moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # Beitragslatenz aus Protokollen zusammenfassen
openclaw voicecall expose --mode funnel
```

Wenn das Gateway bereits ausgeführt wird, delegieren operative `voicecall`-Befehle
an die vom Gateway verwaltete Voice-Call-Laufzeit, damit die CLI keinen
zweiten Webhook-Server bindet. Wenn kein Gateway erreichbar ist, greifen die Befehle auf
eine eigenständige CLI-Laufzeit zurück.

`latency` liest `calls.jsonl` aus dem standardmäßigen Voice-Call-Speicherpfad. Verwenden Sie
`--file <path>`, um ein anderes Protokoll anzugeben, und `--last <n>`, um
die Analyse auf die letzten N Datensätze zu beschränken (Standardwert 200). Die Ausgabe enthält Minimum/Maximum/Durchschnitt,
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

Das Voice-Call-Plugin enthält ein passendes Agenten-Skill.

## Gateway-RPC

| Methode                     | Argumente                                                        | Hinweise                                                                  |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Greift auf die Konfiguration `toNumber` zurück, wenn `to` weggelassen wird. |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Entspricht `initiate`, akzeptiert jedoch zusätzlich `dtmfSequence` vor dem Verbindungsaufbau. |
| `voicecall.continue`        | `callId`, `message`                                              | Blockiert, bis der Beitrag abgeschlossen ist; gibt das Transkript zurück. |
| `voicecall.continue.start`  | `callId`, `message`                                              | Asynchrone Variante: gibt sofort eine `operationId` zurück.               |
| `voicecall.continue.result` | `operationId`                                                    | Fragt das Ergebnis einer ausstehenden `voicecall.continue.start`-Operation ab. |
| `voicecall.speak`           | `callId`, `message`                                              | Spricht ohne zu warten; verwendet die Echtzeit-Bridge, wenn `realtime.enabled` aktiviert ist. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | Lassen Sie `callId` weg, um alle aktiven Anrufe aufzulisten.              |

`dtmfSequence` ist nur mit `mode: "conversation"` gültig; Anrufe im Benachrichtigungsmodus
sollten nach dem Erstellen des Anrufs `voicecall.dtmf` verwenden, wenn sie nach dem Verbindungsaufbau
Ziffern benötigen.

## Fehlerbehebung

### Einrichtung der Webhook-Bereitstellung schlägt fehl

Führen Sie die Einrichtung in derselben Umgebung aus, in der das Gateway ausgeführt wird:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Für `twilio`, `telnyx` und `plivo` muss `webhook-exposure` grün sein. Eine
konfigurierte `publicUrl` schlägt weiterhin fehl, wenn sie auf einen lokalen oder privaten
Netzwerkbereich verweist, da der Mobilfunkanbieter diese Adressen nicht zurückrufen kann.
Verwenden Sie nicht `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` oder andere Carrier-Grade-NAT-
Bereiche als `publicUrl`.

Ausgehende Twilio-Anrufe im Benachrichtigungsmodus senden ihr anfängliches `<Say>`-TwiML direkt
in der Anfrage zum Erstellen des Anrufs, sodass die erste gesprochene Nachricht nicht davon abhängt,
dass Twilio Webhook-TwiML abruft. Ein öffentlicher Webhook ist weiterhin für Status-
Callbacks, Gesprächsanrufe, DTMF vor dem Verbindungsaufbau, Echtzeit-Streams und die
Anrufsteuerung nach dem Verbindungsaufbau erforderlich.

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

Starten oder laden Sie nach einer Konfigurationsänderung das Gateway neu und führen Sie anschließend Folgendes aus:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ist ein Probelauf, sofern Sie nicht `--yes` übergeben.

### Provider-Anmeldedaten schlagen fehl

Überprüfen Sie den ausgewählten Provider und die erforderlichen Anmeldedatenfelder:

- Twilio: `twilio.accountSid`, `twilio.authToken` und `fromNumber` oder
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` und `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` und
  `fromNumber` oder `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` und
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` und `fromNumber` oder
  `PLIVO_AUTH_ID` und `PLIVO_AUTH_TOKEN`.

Die Anmeldedaten müssen auf dem Gateway-Host vorhanden sein. Das Bearbeiten eines lokalen Shell-Profils
wirkt sich erst auf ein bereits laufendes Gateway aus, wenn es neu gestartet wird oder seine
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
- Ein Proxy leitet die Anfrage weiter, entfernt oder überschreibt jedoch die Host-/Proto-Header.
- Firewall oder DNS leitet den öffentlichen Hostnamen an ein anderes Ziel als das Gateway weiter.
- Das Gateway wurde neu gestartet, ohne dass das Voice-Call-Plugin aktiviert war.

Wenn sich vor dem Gateway ein Reverse-Proxy oder Tunnel befindet, setzen Sie
`webhookSecurity.allowedHosts` auf den öffentlichen Hostnamen oder verwenden Sie
`webhookSecurity.trustedProxyIPs` für eine bekannte Proxy-Adresse. Verwenden Sie
`webhookSecurity.trustForwardingHeaders` nur, wenn die Proxy-Grenze
unter Ihrer Kontrolle steht.

### Signaturprüfung schlägt fehl

Provider-Signaturen werden anhand der öffentlichen URL geprüft, die OpenClaw
aus der eingehenden Anfrage rekonstruiert. Wenn die Signaturprüfung fehlschlägt:

- Vergewissern Sie sich, dass die Provider-Webhook-URL exakt mit `publicUrl` übereinstimmt, einschließlich Schema, Host und Pfad.
- Aktualisieren Sie bei URLs des kostenlosen ngrok-Tarifs `publicUrl`, wenn sich der Tunnel-Hostname ändert.
- Stellen Sie sicher, dass der Proxy die ursprünglichen Host- und Proto-Header beibehält, oder konfigurieren Sie `webhookSecurity.allowedHosts`.
- Aktivieren Sie `skipSignatureVerification` nicht außerhalb lokaler Tests.

### Twilio-Beitritte zu Google Meet schlagen fehl

Google Meet verwendet dieses Plugin für Einwahlbeitritte über Twilio. Prüfen Sie zuerst Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Prüfen Sie anschließend ausdrücklich den Google-Meet-Transport:

```bash
openclaw googlemeet setup --transport twilio
```

Wenn Voice Call fehlerfrei funktioniert, der Meet-Teilnehmer aber nie beitritt, prüfen Sie die
Meet-Einwahlnummer, die PIN und `--dtmf-sequence`. Der Telefonanruf kann ordnungsgemäß
funktionieren, während die Besprechung eine falsche DTMF-Sequenz ablehnt oder ignoriert.

Google Meet startet den Twilio-Telefonabschnitt über `voicecall.start` mit einer
DTMF-Sequenz vor dem Verbindungsaufbau. Aus der PIN abgeleitete Sequenzen enthalten
`voiceCall.dtmfDelayMs` des Google-Meet-Plugins (Standardwert **12000 ms**) als vorangestellte
Twilio-Warteziffern, da Meet-Einwahlaufforderungen verspätet eintreffen können. Voice Call leitet
anschließend zur Echtzeitverarbeitung zurück, bevor die Begrüßungsansage angefordert wird.

Verwenden Sie `openclaw logs --follow` für die Live-Phasenablaufverfolgung. Bei einem ordnungsgemäßen Twilio-Meet-
Beitritt werden die Protokolleinträge in dieser Reihenfolge ausgegeben:

- Google Meet delegiert den Twilio-Beitritt an Voice Call.
- Voice Call speichert das DTMF-TwiML vor dem Verbindungsaufbau.
- Das anfängliche Twilio-TwiML wird verarbeitet und vor der Echtzeitverarbeitung bereitgestellt.
- Voice Call stellt Echtzeit-TwiML für den Twilio-Anruf bereit.
- Google Meet fordert nach der Verzögerung nach der DTMF-Sequenz mit `voicecall.speak` die Begrüßungsansage an.

`openclaw voicecall tail` zeigt weiterhin gespeicherte Anrufdatensätze an; dies ist für
Anrufstatus und Transkripte nützlich, dort wird jedoch nicht jeder Webhook-/Echtzeitübergang
angezeigt.

### Echtzeitanruf hat keine Sprachausgabe

Stellen Sie sicher, dass nur ein Audiomodus aktiviert ist: `realtime.enabled` und
`streaming.enabled` können nicht beide auf „true“ gesetzt sein.

Prüfen Sie bei Echtzeitanrufen über Twilio/Telnyx außerdem Folgendes:

- Ein Echtzeit-Provider-Plugin ist geladen und registriert.
- `realtime.provider` ist nicht gesetzt oder benennt einen registrierten Provider.
- Der API-Schlüssel des Providers ist für den Gateway-Prozess verfügbar.
- `openclaw logs --follow` zeigt, dass Echtzeit-TwiML bereitgestellt, die Echtzeit-Bridge gestartet und die anfängliche Begrüßung in die Warteschlange eingereiht wurde.

## Verwandte Themen

- [Sprechmodus](/de/nodes/talk)
- [Text-zu-Sprache](/de/tools/tts)
- [Sprachaktivierung](/de/nodes/voicewake)
