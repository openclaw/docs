---
read_when:
    - Talk-Modus unter macOS/iOS/Android implementieren
    - Sprach-/TTS-/Unterbrechungsverhalten ändern
summary: 'Sprechmodus: kontinuierliche Sprachkonversationen über lokales STT/TTS und Echtzeit-Spracheingabe hinweg'
title: Sprechmodus
x-i18n:
    generated_at: "2026-07-12T15:29:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Der Talk-Modus umfasst fünf Laufzeitvarianten:

- **Natives macOS/iOS/Android-Talk**: lokale Spracherkennung, Gateway-Chat und `talk.speak`-TTS. Nodes geben die `talk`-Fähigkeit bekannt und deklarieren, welche `talk.*`-Befehle sie unterstützen.
- **iOS-Talk (Echtzeit)**: clientseitig verwaltetes WebRTC für OpenAI-Echtzeitkonfigurationen, die den Transport `webrtc` auswählen oder keinen Transport angeben. Explizite `gateway-relay`-, `provider-websocket`- und Nicht-OpenAI-Echtzeitkonfigurationen verbleiben beim Gateway-seitig verwalteten Relay; Nicht-Echtzeitkonfigurationen verwenden die native Sprachschleife.
- **Browser-Talk**: `talk.client.create` für clientseitig verwaltete `webrtc`-/`provider-websocket`-Sitzungen oder `talk.session.create` für Gateway-seitig verwaltete `gateway-relay`-Sitzungen. `managed-room` ist für die Übergabe an das Gateway und Walkie-Talkie-Räume reserviert.
- **Android-Talk (Echtzeit)**: Aktivieren Sie ihn mit `talk.realtime.mode: "realtime"` und `talk.realtime.transport: "gateway-relay"`. Andernfalls verbleibt Android bei nativer Spracherkennung, Gateway-Chat und `talk.speak`.
- **Clients nur für Transkription**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, anschließend `talk.session.appendAudio`, `talk.session.cancelTurn` und `talk.session.close` für Untertitel/Diktate ohne Sprachantwort des Assistenten. Einmalig hochgeladene Sprachnachrichten verwenden weiterhin den Audiopfad der [Medienanalyse](/de/nodes/media-understanding).

Natives Talk ist eine kontinuierliche Schleife: auf Sprache warten, das Transkript über die aktive Sitzung an das Modell senden, auf die Antwort warten und sie anschließend über den konfigurierten Talk-Provider (`talk.speak`) wiedergeben.

Clientseitig verwaltetes Echtzeit-Talk leitet Tool-Aufrufe des Providers über `talk.client.toolCall` weiter, anstatt `chat.send` direkt aufzurufen. Während eine Echtzeitkonsultation aktiv ist, können Clients `talk.client.steer` oder `talk.session.steer` aufrufen, um gesprochene Eingaben als `status`, `steer`, `cancel` oder `followup` zu klassifizieren. Akzeptierte Steuerungsanweisungen werden in den aktiven eingebetteten Lauf eingereiht; abgelehnte Steuerungsanweisungen geben einen Grund wie `no_active_run`, `not_streaming` oder `compacting` zurück.

Talk nur für Transkription gibt dieselbe Talk-Ereignishülle wie Echtzeit- und STT/TTS-Sitzungen aus, verwendet jedoch `mode: "transcription"` und `brain: "none"`. Alle Talk-Sitzungen übertragen Ereignisse über den Kanal `talk.event`; Clients abonnieren ihn für partielle/finale Transkriptaktualisierungen (`transcript.delta`/`transcript.done`) und weitere Sitzungstelemetrie.

## Verhalten (macOS)

- Dauerhaft sichtbares Overlay, solange der Talk-Modus aktiviert ist.
- Phasenübergänge **Zuhören &rarr; Nachdenken &rarr; Sprechen**.
- Bei einer kurzen Pause (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden in WebChat geschrieben (wie bei der Eingabe per Tastatur).
- **Bei Sprache unterbrechen** (standardmäßig aktiviert): Wenn der Benutzer spricht, während der Assistent eine Antwort wiedergibt, wird die Wiedergabe beendet und der Zeitstempel der Unterbrechung für den nächsten Prompt vermerkt.

## Sprachanweisungen in Antworten

Der Assistent kann einer Antwort eine einzelne JSON-Zeile voranstellen, um die Stimme zu steuern:

```json
{ "voice": "<voice-id>", "once": true }
```

Regeln:

- Nur die erste nicht leere Zeile; die JSON-Zeile wird vor der TTS-Wiedergabe entfernt.
- Unbekannte Schlüssel werden ignoriert.
- `once: true` gilt nur für die aktuelle Antwort; ohne diese Angabe wird die Stimme zum neuen Standard des Talk-Modus.

Unterstützte Schlüssel: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
      instructions: "Sprechen Sie freundlich und fassen Sie sich kurz.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Schlüssel                                 | Standard                                   | Hinweise                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                                | -                                          | Aktiver Talk-TTS-Provider. Verwenden Sie `elevenlabs`, `mlx` oder `system` für lokale Wiedergabepfade unter macOS.                                                                                                                                                          |
| `providers.<id>.voiceId`                  | -                                          | ElevenLabs greift auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` oder bei vorhandenem API-Schlüssel auf die erste verfügbare Stimme zurück.                                                                                                                                    |
| `providers.elevenlabs.modelId`            | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                   | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`             | -                                          | Greift auf `ELEVENLABS_API_KEY` zurück (oder auf das Shell-Profil des Gateways, sofern verfügbar).                                                                                                                                                                         |
| `speechLocale`                            | Gerätestandard                             | BCP-47-Gebietsschema-ID für die geräteinterne Talk-Spracherkennung unter iOS/macOS.                                                                                                                                                                                        |
| `silenceTimeoutMs`                        | `700` ms macOS/Android, `900` ms iOS       | Pausenfenster, bevor Talk das Transkript sendet.                                                                                                                                                                                                                            |
| `interruptOnSpeech`                       | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                            | `pcm_44100` macOS/iOS, `pcm_24000` Android | Setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen.                                                                                                                                                                                                                          |
| `consultThinkingLevel`                    | nicht festgelegt                           | Überschreibt die Denkstufe für den Agentenlauf hinter Echtzeitaufrufen von `openclaw_agent_consult`.                                                                                                                                                                       |
| `consultFastMode`                         | nicht festgelegt                           | Überschreibt den Schnellmodus für Echtzeitaufrufe von `openclaw_agent_consult`.                                                                                                                                                                                            |
| `realtime.provider`                       | -                                          | `openai` für WebRTC, `google` für den Provider-WebSocket oder ein ausschließlich über eine Bridge angebundener Provider über das Gateway-Relay.                                                                                                                            |
| `realtime.providers.<id>`                 | -                                          | Provider-eigene Echtzeitkonfiguration. Browser erhalten ausschließlich kurzlebige/eingeschränkte Sitzungszugangsdaten, niemals einen regulären API-Schlüssel.                                                                                                              |
| `realtime.providers.openai.speakerVoice`  | `alloy`                                    | Integrierte OpenAI-Realtime-Stimmen-ID (der ältere Schlüssel `voice` funktioniert weiterhin, ist jedoch veraltet). Aktuelle Stimmen von `gpt-realtime-2.1`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` und `cedar` werden für die beste Qualität empfohlen. |
| `realtime.transport`                      | -                                          | `webrtc`: clientseitig verwaltetes OpenAI-WebRTC unter iOS und im Browser. `provider-websocket`: browserseitig verwaltet, verbleibt unter iOS beim Gateway-Relay. `gateway-relay`: Provider-Audio verbleibt auf dem Gateway; Android verwendet Echtzeit nur mit diesem Transport. |
| `realtime.brain`                          | -                                          | `agent-consult` leitet Echtzeit-Tool-Aufrufe durch die Gateway-Richtlinie; `direct-tools` dient der Kompatibilität mit der veralteten direkten Tool-Nutzung; `none` ist für Transkription/externe Orchestrierung vorgesehen.                                                    |
| `realtime.consultRouting`                 | -                                          | `provider-direct` behält die direkte Antwort des Providers bei, wenn dieser `openclaw_agent_consult` überspringt; `force-agent-consult` leitet stattdessen finalisierte Benutzertranskripte durch OpenClaw.                                                                 |
| `realtime.instructions`                   | -                                          | Fügt dem integrierten Echtzeit-Prompt von OpenClaw systemseitige Anweisungen für den Provider hinzu (Sprachstil/Tonfall); die standardmäßige Anleitung für `openclaw_agent_consult` bleibt bestehen.                                                                         |

`talk.catalog` stellt kanonische Provider-IDs und Registry-Aliasse, die gültigen Modi/Transporte/Brain-Strategien/Echtzeit-Audioformate/Capability-Flags jedes Providers sowie das von der Laufzeit ausgewählte Bereitschaftsergebnis bereit. Erstanbieter-Talk-Clients sollten diesen Katalog lesen, anstatt Provider-Aliasse lokal zu verwalten; behandeln Sie ein älteres Gateway, das die Gruppenbereitschaft auslässt, als nicht verifiziert und nicht als definitiv unkonfiguriert. Streaming-Transkriptionsprovider werden über `talk.catalog.transcription` erkannt; das aktuelle Gateway-Relay verwendet die Konfiguration des Voice-Call-Streaming-Providers, bis eine dedizierte Talk-Konfigurationsoberfläche für Transkription verfügbar ist.

## macOS-Benutzeroberfläche

- Menüleistenschalter: **Talk**
- Konfigurationsregisterkarte: Gruppe **Talk-Modus** (Sprach-ID + Unterbrechungsschalter)
- Overlay: Die Kugel zeigt die universelle Talk-Wellenform an (gemeinsam mit iOS, watchOS und Android). Beim Zuhören folgt sie dem Live-Mikrofonpegel, beim Sprechen der tatsächlichen TTS-Wiedergabehüllkurve, beim Nachdenken pulsiert sie sanft. Klicken Sie auf die Kugel, um zu pausieren/fortzufahren, doppelklicken Sie, um das Sprechen zu beenden, und klicken Sie auf X, um den Talk-Modus zu verlassen.

## Android-Benutzeroberfläche

- Schalter auf der Sprachregisterkarte: **Talk**
- Manuelles **Mikrofon** und **Talk** sind sich gegenseitig ausschließende Aufnahmemodi.
- Das manuelle Mikrofon und Echtzeit-Talk bevorzugen das Mikrofon eines verbundenen Bluetooth-Classic- oder BLE-Headsets; wird die Verbindung getrennt, fordert die App einen anderen Headset-Eingang an oder greift auf das Standardmikrofon zurück. Nach dem Ende der Aufnahme wird die Standardeinstellung wiederhergestellt.
- Das manuelle Mikrofon wird beendet, wenn die App den Vordergrund verlässt oder der Benutzer die Sprachregisterkarte verlässt.
- Der Talk-Modus läuft weiter, bis er deaktiviert oder die Verbindung zum Node getrennt wird, und verwendet währenddessen den Android-Vordergrunddiensttyp für Mikrofone.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes `AudioTrack`-Streaming.

## Hinweise

- Erfordert Berechtigungen für Spracherkennung und Mikrofon.
- Natives Talk verwendet die aktive Gateway-Sitzung und greift nur dann auf das Abrufen des Verlaufs zurück, wenn Antwortereignisse nicht verfügbar sind.
- Das Gateway löst die Talk-Wiedergabe über `talk.speak` mit dem aktiven Talk-Provider auf. Android greift nur dann auf die lokale System-TTS zurück, wenn dieser RPC nicht verfügbar ist.
- Die lokale MLX-Wiedergabe unter macOS verwendet den mitgelieferten `openclaw-mlx-tts`-Helper, sofern vorhanden, oder eine ausführbare Datei in `PATH`. Setzen Sie `OPENCLAW_MLX_TTS_BIN`, damit es während der Entwicklung auf eine benutzerdefinierte Helper-Binärdatei verweist.
- Wertebereiche für Sprachanweisungen (ElevenLabs): `stability`, `similarity` und `style` akzeptieren `0..1`; `speed` akzeptiert `0.5..2`; `latency_tier` akzeptiert `0..4`.

## Verwandte Themen

- [Sprachaktivierung](/de/nodes/voicewake)
- [Audio- und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
