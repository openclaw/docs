---
read_when:
    - Implementierung des Sprechmodus unter macOS/iOS/Android
    - Sprach-/TTS-/Unterbrechungsverhalten ändern
summary: 'Sprechmodus: kontinuierliche Sprachkonversationen über lokale STT/TTS und Echtzeit-Spracheingabe hinweg'
title: Sprechmodus
x-i18n:
    generated_at: "2026-07-24T03:53:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b21319eee169ba898331f87279a2b2a5170441131a1e9cdc85c15b268d165e21
    source_path: nodes/talk.md
    workflow: 16
---

Der Talk-Modus umfasst fünf Laufzeitvarianten:

- **Natives Talk unter macOS/iOS/Android**: native Spracherkennung, Gateway-Chat und `talk.speak`-TTS. Die Apple-Spracherkennung unter macOS/iOS kann Netzwerkdienste verwenden; das Verhalten unter Android hängt vom installierten Sprachdienst ab. Nodes kündigen die Fähigkeit `talk` an und geben an, welche `talk.*`-Befehle sie unterstützen.
- **iOS Talk (Echtzeit)**: clientseitig verwaltetes WebRTC für OpenAI-Echtzeitkonfigurationen, die den Transport `webrtc` auswählen oder keinen Transport angeben. Explizite `gateway-relay`-, `provider-websocket`- und Nicht-OpenAI-Echtzeitkonfigurationen verbleiben beim Gateway-seitig verwalteten Relay; Nicht-Echtzeitkonfigurationen verwenden die native Sprachschleife.
- **Browser-Talk**: `talk.client.create` für clientseitig verwaltete `webrtc`/`provider-websocket`-Sitzungen oder `talk.session.create` für Gateway-seitig verwaltete `gateway-relay`-Sitzungen. `managed-room` ist für die Übergabe an das Gateway und Walkie-Talkie-Räume reserviert.
- **Android Talk (Echtzeit)**: Aktivierung mit `talk.realtime.mode: "realtime"` und `talk.realtime.transport: "gateway-relay"`. Andernfalls verwendet Android weiterhin native Spracherkennung, Gateway-Chat und `talk.speak`.
- **Clients nur für Transkription**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, anschließend `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close` für Untertitel/Diktate ohne Sprachantwort eines Assistenten. Einmalig hochgeladene Sprachnachrichten verwenden weiterhin den Audiopfad der [Medienanalyse](/de/nodes/media-understanding).

Natives Talk ist eine kontinuierliche Schleife: auf Sprache warten, das Transkript über die aktive Sitzung an das Modell senden, auf die Antwort warten und sie anschließend über den konfigurierten Talk-Provider (`talk.speak`) wiedergeben.

Clientseitig verwaltetes Echtzeit-Talk leitet Tool-Aufrufe des Providers über `talk.client.toolCall` weiter, statt `chat.send` direkt aufzurufen. Während eine Echtzeitkonsultation aktiv ist, können Clients `talk.client.steer` oder `talk.session.steer` aufrufen, um gesprochene Eingaben als `status`, `steer`, `cancel` oder `followup` zu klassifizieren. Akzeptierte Steuerungsanweisungen werden in den aktiven eingebetteten Lauf eingereiht; bei abgelehnten Steuerungsanweisungen wird ein Grund wie `no_active_run`, `not_streaming` oder `compacting` zurückgegeben.

Abgeschlossene Echtzeitäußerungen des Benutzers und des Assistenten werden stets unmittelbar an die aktive Agentensitzung angehängt, sodass nachfolgende Chat- und Sprachinteraktionen denselben Verlauf verwenden. Clientseitig verwaltete Transporte melden ihre abgeschlossenen Transkripte mit stabilen Eintrags-IDs; Gateway-Relay-Sitzungen hängen dieselben Ereignisse serverseitig an. Provider-Sitzungen erhalten außerdem den begrenzten Echtzeit-Profilkontext, den Discord Voice verwendet.

Sprachinitiierte Konsultationsläufe erfordern vor Aktionen mit großer Tragweite eine neue, exakte gesprochene Bestätigung, etwa vor dem Senden von Nachrichten, dem Steuern von Nodes, Browser-/Computeraktionen, Dienständerungen, destruktiven Shell-Befehlen oder Veröffentlichungen. Die Bestätigung gilt nur für die exakten Argumente des blockierten Tools und wird einmalig verbraucht; nicht zugehörige parallele Läufe bleiben unbeeinträchtigt. Wenn ein Anruf endet, kann OpenClaw eine kompakte Zusammenfassung **Änderungen durch den Sprachanruf** für verändernde Tools an das letzte Zustellungsziel der Sitzung außerhalb von WebChat senden.

Talk nur für Transkription gibt dieselbe Talk-Ereignishülle wie Echtzeit- und STT/TTS-Sitzungen aus, verwendet jedoch `mode: "transcription"` und `brain: "none"`. Alle Talk-Sitzungen übertragen Ereignisse über den Kanal `talk.event`; Clients abonnieren ihn für Aktualisierungen vorläufiger/endgültiger Transkripte (`transcript.delta`/`transcript.done`) und andere Sitzungstelemetrie.

Browser-Video-Talk ist für OpenAI Realtime WebRTC und Google-Live-
Provider-WebSocket-Sitzungen verfügbar. OpenAI erhält ein einzelnes begrenztes JPEG, wenn
`describe_view` visuellen Kontext anfordert; OpenAI erhält keinen kontinuierlichen
Kamerastream. Google Live erhält begrenzte JPEG-Frames direkt vom
Browser mit bis zu einem Frame pro Sekunde, während `describe_view` den
Status des Kamerastreams meldet. In beiden Fällen umgehen die Kameraframes das Gateway, und
beim Beenden von Talk werden die Kamera- und Mikrofontracks freigegeben.

## Verhalten (macOS)

- Dauerhaft eingeblendetes Overlay, während der Talk-Modus aktiviert ist.
- Phasenübergänge **Zuhören &rarr; Nachdenken &rarr; Sprechen**.
- Bei einer kurzen Pause (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden in WebChat geschrieben (wie bei einer Texteingabe).
- **Unterbrechen bei Spracheingabe** (standardmäßig aktiviert): Wenn der Benutzer spricht, während der Assistent eine Antwort wiedergibt, wird die Wiedergabe beendet und der Zeitpunkt der Unterbrechung für den nächsten Prompt vermerkt.

## Sprachanweisungen in Antworten

Der Assistent kann einer Antwort eine einzelne JSON-Zeile voranstellen, um die Stimme zu steuern:

```json
{ "voice": "<voice-id>", "once": true }
```

Regeln:

- Nur die erste nicht leere Zeile; die JSON-Zeile wird vor der TTS-Wiedergabe entfernt.
- Unbekannte Schlüssel werden ignoriert.
- `once: true` gilt nur für die aktuelle Antwort; ohne diesen Schlüssel wird die Stimme zum neuen Standard des Talk-Modus.

Unterstützte Schlüssel: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (Wörter pro Minute), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

## Konfiguration (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Sprechen Sie freundlich und halten Sie die Antworten kurz.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Schlüssel                                 | Standardwert                                | Hinweise                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                           | Aktiver Talk-TTS-Provider. Verwenden Sie `elevenlabs`, `mlx` oder `system` für lokale Wiedergabepfade unter macOS.                                                                                                                                       |
| `providers.<id>.voiceId`                 | -                                           | ElevenLabs greift auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` oder die erste verfügbare Stimme mit einem API-Schlüssel zurück.                                                                                                                                                       |
| `speechLocale`                           | Gerätestandard                              | BCP-47-Gebietsschema für die native Spracherkennung unter Android, iOS und macOS. Apple Speech kann Netzwerkdienste verwenden; Android leitet außerdem die Sprachkomponente an die Echtzeit-Eingabetranskription weiter.                                                         |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                           | Greift auf `ELEVENLABS_API_KEY` zurück (oder auf das Shell-Profil des Gateways, sofern verfügbar).                                                                                                                                                                                      |
| `silenceTimeoutMs`                       | `700` ms macOS/Android, `900` ms iOS       | Pausenfenster, bevor Talk das Transkript sendet.                                                                                                                                                                                                                            |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen.                                                                                                                                                                                                                          |
| `consultThinkingLevel`                   | nicht festgelegt                           | Überschreibung der Denkstufe für den Agentenlauf hinter Echtzeitaufrufen von `openclaw_agent_consult`.                                                                                                                                                                                   |
| `consultFastMode`                        | nicht festgelegt                           | Überschreibung des Schnellmodus für Echtzeitaufrufe von `openclaw_agent_consult`.                                                                                                                                                                                                       |
| `realtime.provider`                      | -                                           | `openai` für WebRTC, `google` für den Provider-WebSocket oder ein ausschließlich über eine Bridge angebundener Provider über das Gateway-Relay.                                                                                                                         |
| `realtime.providers.<id>`                | -                                           | Vom Provider verwaltete Echtzeitkonfiguration. Browser erhalten nur kurzlebige/eingeschränkte Sitzungsanmeldedaten, niemals einen standardmäßigen API-Schlüssel.                                                                                                               |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Integrierte OpenAI-Realtime-Stimmen-ID (der ältere Schlüssel `voice` funktioniert weiterhin, ist jedoch veraltet). Aktuelle `gpt-realtime-2.1`-Stimmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` und `cedar` werden für die beste Qualität empfohlen. |
| `realtime.transport`                     | -                                           | `webrtc`: vom Client verwaltetes OpenAI WebRTC unter iOS und im Browser. `provider-websocket`: vom Browser verwaltet, verbleibt unter iOS auf dem Gateway-Relay. `gateway-relay`: belässt das Provider-Audio auf dem Gateway; Android verwendet Echtzeit nur mit diesem Transport. |
| `realtime.brain`                         | -                                           | `agent-consult` leitet Echtzeit-Toolaufrufe über die Gateway-Richtlinie; `direct-tools` dient der Kompatibilität mit veralteten direkten Toolaufrufen; `none` ist für Transkription/externe Orchestrierung vorgesehen.                                                       |
| `realtime.consultRouting`                | -                                           | `provider-direct` behält die direkte Antwort des Providers bei, wenn dieser `openclaw_agent_consult` überspringt; `force-agent-consult` leitet stattdessen abgeschlossene Benutzertranskripte durch OpenClaw.                                                                   |
| `realtime.instructions`                  | -                                           | Hängt den Provider betreffenden Systemanweisungen an den integrierten Echtzeit-Prompt von OpenClaw an (Stimmstil/Tonfall); die standardmäßige Anleitung `openclaw_agent_consult` bleibt erhalten.                                                                                  |

`talk.catalog` stellt kanonische Provider-IDs und Registry-Aliasse, die gültigen Modi/Transporte/Brain-Strategien/Echtzeit-Audioformate/Fähigkeitskennzeichen jedes Providers sowie das zur Laufzeit ausgewählte Bereitschaftsergebnis bereit. Talk-Clients aus erster Hand sollten diesen Katalog lesen, anstatt Provider-Aliasse lokal zu verwalten; behandeln Sie ein älteres Gateway, das die Gruppenbereitschaft auslässt, als nicht verifiziert statt als definitiv nicht konfiguriert. Streaming-Transkriptions-Provider werden über `talk.catalog.transcription` erkannt; das aktuelle Gateway-Relay verwendet die Konfiguration des Voice-Call-Streaming-Providers, bis eine dedizierte Talk-Transkriptionskonfigurationsoberfläche ausgeliefert wird.

## macOS-Benutzeroberfläche

- Menüleistenschalter: **Talk**
- Konfigurationsregisterkarte: Gruppe **Talk Mode** (Stimmen-ID + Unterbrechungsschalter)
- Overlay: Die Kugel stellt die universelle Talk-Wellenform dar (gemeinsam mit iOS, watchOS und Android). Beim Zuhören folgt sie dem aktuellen Mikrofonpegel, beim Sprechen der tatsächlichen TTS-Wiedergabehüllkurve, und beim Denken pulsiert sie sanft. Klicken Sie auf die Kugel, um anzuhalten/fortzufahren, doppelklicken Sie, um die Sprachausgabe zu beenden, und klicken Sie auf X, um den Talk-Modus zu verlassen.

## Android-Benutzeroberfläche

- Die Hauptnavigation von Android besteht aus **Home**, **Chat** und **Settings**. Die Spracheingabe
  befindet sich im Chat-Editor und nicht auf einer separaten Voice-Registerkarte.
- Tippen Sie für die Diktierfunktion auf dem Gerät auf das Mikrofon im Editor. Halten Sie es gedrückt, um
  einen Sprachnotiz-Anhang aufzunehmen. Starten Sie kontinuierliches Talk über die Talk-Wellenform.
- Diktieren, Sprachnotizaufnahme und Talk schließen sich als Mikrofonpfade
  gegenseitig aus; das Starten eines Pfads stoppt oder blockiert die anderen.
- Realtime Talk bevorzugt das Mikrofon eines verbundenen Bluetooth-Classic- oder BLE-Headsets.
  Wenn die Verbindung getrennt wird, fordert die App einen anderen Headset-Eingang an oder
  greift auf das Standardmikrofon zurück und stellt nach dem Ende der Aufnahme
  die Standardpräferenz wieder her.
- Diktieren und Sprachnotizaufnahme werden beendet, wenn die App den Vordergrund verlässt oder
  der Benutzer Chat verlässt.
- Talk Mode läuft weiter, bis er ausgeschaltet oder die Verbindung zum Node getrennt wird, und verwendet während der Aktivität den Mikrofon-Vordergrunddiensttyp von Android.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für `AudioTrack`-Streaming mit geringer Latenz.

## Hinweise

- Erfordert Berechtigungen für Spracherkennung und Mikrofon.
- Natives Talk verwendet die aktive Gateway-Sitzung und greift nur dann auf die Abfrage des Verlaufs zurück, wenn keine Antwortereignisse verfügbar sind.
- Das Gateway löst die Talk-Wiedergabe über `talk.speak` unter Verwendung des aktiven Talk-Providers auf. Android greift nur dann auf die lokale System-TTS zurück, wenn dieser RPC nicht verfügbar ist.
- Die lokale MLX-Wiedergabe unter macOS verwendet den mitgelieferten `openclaw-mlx-tts`-Helfer, sofern vorhanden, oder eine ausführbare Datei in `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, um während der Entwicklung auf eine benutzerdefinierte ausführbare Helferdatei zu verweisen.
- Wertebereiche der Stimmenanweisungen (ElevenLabs): `stability`, `similarity` und `style` akzeptieren `0..1`; `speed` akzeptiert `0.5..2`; `latency_tier` akzeptiert `0..4`.

## Verwandte Themen

- [Sprachaktivierung](/de/nodes/voicewake)
- [Audio und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
