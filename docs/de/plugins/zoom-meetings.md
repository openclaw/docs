---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einem Zoom-Meeting teilnimmt
    - Sie konfigurieren Chrome, BlackHole oder SoX für die Rücksprechfunktion in Zoom-Meetings
summary: 'Zoom-Meeting-Plugin: Meetings als Gast im Chrome-Browser beitreten'
title: Plugin für Zoom-Meetings
x-i18n:
    generated_at: "2026-07-24T04:03:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d91e57cccb163f634c6eaee71dd3832fc7b9e783fc5cd02601572b302d0d25e8
    source_path: plugins/zoom-meetings.md
    workflow: 16
---

Das `zoom-meetings`-Plugin tritt Zoom-Besprechungslinks als Gast über die Zoom Web App im OpenClaw-Chrome-Profil bei. Es akzeptiert Besprechungslinks unter `zoom.us/j/...` und Konto-Subdomains wie `example.zoom.us/j/...`. Es erstellt keine Besprechungen, wählt sich nicht telefonisch ein, verwendet nicht das Zoom Meeting SDK und zeichnet keine Audio-/Videoaufnahmen auf.

## Einrichtung

Die Sprachausgabe verwendet dieselben lokalen Audiovoraussetzungen wie das [Google-Meet-Plugin](/de/plugins/google-meet): macOS, das virtuelle Audiogerät `BlackHole 2ch` und SoX.

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Das Plugin ist enthalten und standardmäßig aktiviert. Fügen Sie nur dann einen Eintrag hinzu, wenn Sie es anpassen möchten, und prüfen Sie anschließend die Einrichtung:

```json5
{
  plugins: {
    entries: {
      "zoom-meetings": {
        config: {
          defaultMode: "agent",
          chrome: { guestName: "OpenClaw Agent" },
        },
      },
    },
  },
}
```

Führen Sie `openclaw plugins disable zoom-meetings` aus, wenn das Plugin nicht aktiv sein soll.

```bash
openclaw zoommeetings setup
openclaw zoommeetings join 'https://zoom.us/j/1234567890'
```

Verwenden Sie `chromeNode.node`, um Chrome, BlackHole und SoX auf einem gekoppelten macOS-Node auszuführen. Der Node muss `zoommeetings.chrome` und `browser.proxy` zulassen.

## Modi

| Modus         | Verhalten                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `agent`      | Die Echtzeittranskription konsultiert den konfigurierten OpenClaw-Agenten; TTS antwortet. |
| `bidi`       | Ein Echtzeit-Sprachmodell hört zu und antwortet direkt.                        |
| `transcribe` | Beitritt nur zur Beobachtung mit Transkript-Schnappschüssen der Live-Untertitel.                   |

Zoom-Live-Untertitel werden nach der Zulassung in jedem Modus aktiviert, damit OpenClaw
Besprechungsnotizen dauerhaft speichern kann. Die Aktion `transcript` gibt weiterhin nur
für `transcribe`-Sitzungen den begrenzten Live-Puffer zurück. Beim Verlassen speichert OpenClaw das dauerhafte
Transkript und die daraus abgeleitete Zusammenfassung in der gemeinsamen Zustandsdatenbank; listen oder exportieren Sie
sie mit [`openclaw transcripts`](/de/cli/transcripts).

Automatische Notizen sind standardmäßig aktiviert. Setzen Sie `transcripts.enabled: false`, um
dauerhafte Notizen global zu deaktivieren; der explizite Modus `transcribe` stellt weiterhin nur
sein begrenztes Live-Ende bereit.

## Einschränkungen beim Gastbeitritt

Der Browseradapter wählt **Join from browser**, trägt den Gastnamen ein, schaltet die Kamera aus, konfiguriert das Mikrofon für den ausgewählten Modus und klickt auf **Join**. Die Zoom Web App wird unter `app.zoom.us` ausgeführt; das Plugin gewährt diesem Ursprung vor der Navigation Berechtigungen für das Mikrofon und die Lautsprecherauswahl. Der Status während des Gesprächs verwendet das Zoom-Steuerelement Leave. Für Wartebereichs-, Anmelde-, Kennwort-, CAPTCHA- und Geräteberechtigungszustände werden explizite Gründe für erforderliche manuelle Aktionen zurückgegeben.

Die Richtlinien des Zoom-Hosts und -Kontos können den Browserbeitritt deaktivieren, eine Authentifizierung oder E-Mail-Verifizierung verlangen, ein CAPTCHA anzeigen oder die Zulassung durch den Host erfordern. Schließen Sie diesen Schritt im OpenClaw-Chrome-Profil ab und fragen Sie anschließend den Status oder die Sprachausgabe erneut ab. Das Plugin umgeht keine Zoom-Richtlinien.

Die Zoom Web App wurde mit einer offiziellen Zoom-Testbesprechung für den App-Zwischenbildschirm, die Eingabe des Gastnamens im iframe, die Mikrofon- und Kamerasteuerung vor dem Beitritt, den Beitritt, die Medienberechtigungen des Browsers und von macOS, die Erkennung eines laufenden Gesprächs, die Aktivierung von Live-Untertiteln sowie die Erkennung einer vom Host beendeten Besprechung live validiert. Wartebereichs- und Authentifizierungszustände hängen von der Host-Richtlinie ab und behalten Text-Fallbacks bei, wenn kein stabiler DOM-Bezeichner verfügbar ist.

## Tool- und Gateway-Oberfläche

Das Agenten-Tool `zoom_meetings` unterstützt `join`, `leave`, `status`, `transcript` und `speak`. Gateway-Methoden verwenden das Präfix `zoommeetings.*`. Der Node-Befehl lautet `zoommeetings.chrome`.

## Verwandte Themen

- [Übersicht über Besprechungs-Plugins](/plugins/meeting-plugins)
