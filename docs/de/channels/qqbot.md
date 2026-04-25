---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen QQ-Bot-Anmeldedaten einrichten
    - Sie möchten Unterstützung für QQ-Bot-Gruppen- oder Privat-Chats
summary: QQ-Bot-Einrichtung, Konfiguration und Verwendung
title: QQ-Bot
x-i18n:
    generated_at: "2026-04-25T13:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot verbindet sich über die offizielle QQ-Bot-API (WebSocket-Gateway) mit OpenClaw. Das
Plugin unterstützt C2C-Privatchats, Gruppen-@messages und Nachrichten in Guild-Kanälen mit
Rich Media (Bilder, Sprache, Video, Dateien).

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Guild-Kanäle und
Medien werden unterstützt. Reactions und Threads werden nicht unterstützt.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen bündeln QQ Bot, daher benötigen normale paketierte Builds
keinen separaten Schritt `openclaw plugins install`.

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   QQ auf dem Telefon, um sich zu registrieren / anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie **AppID** und **AppSecret** auf der Einstellungsseite des Bots und kopieren Sie sie.

> AppSecret wird nicht im Klartext gespeichert — wenn Sie die Seite verlassen, ohne es zu speichern,
> müssen Sie ein neues generieren.

4. Fügen Sie den Kanal hinzu:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Starten Sie das Gateway neu.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

## Konfigurieren

Minimale Konfiguration:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Umgebungsvariablen für das Standardkonto:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

Dateigestütztes AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Hinweise:

- Die Ausweichoption über Umgebungsvariablen gilt nur für das Standard-QQ-Bot-Konto.
- `openclaw channels add --channel qqbot --token-file ...` stellt nur das
  AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartext-Zeichenfolge.

### Einrichtung mit mehreren Konten

Führen Sie mehrere QQ-Bots in einer einzelnen OpenClaw-Instanz aus:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Jedes Konto startet seine eigene WebSocket-Verbindung und verwaltet einen unabhängigen
Token-Cache (isoliert nach `appId`).

Fügen Sie per CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Sprache (STT / TTS)

STT- und TTS-Unterstützung verwenden eine zweistufige Konfiguration mit priorisierter Ausweichlogik:

| Einstellung | Plugin-spezifisch    | Framework-Ausweichoption        |
| ----------- | -------------------- | ------------------------------- |
| STT         | `channels.qqbot.stt` | `tools.media.audio.models[0]`   |
| TTS         | `channels.qqbot.tts` | `messages.tts`                  |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Setzen Sie bei einem der beiden `enabled: false`, um es zu deaktivieren.

Eingehende QQ-Sprachanhänge werden Agenten als Audio-Medienmetadaten bereitgestellt,
während rohe Sprachdateien aus generischen `MediaPaths` herausgehalten werden. Reine
Textantworten mit `[[audio_as_voice]]` synthetisieren TTS und senden eine native QQ-Sprachnachricht,
wenn TTS konfiguriert ist.

Das Verhalten beim Hochladen/Transkodieren ausgehender Audiodateien kann ebenfalls mit
`channels.qqbot.audioFormatPolicy` abgestimmt werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privatchat (C2C)   |
| `qqbot:group:GROUP_OPENID` | Gruppenchat        |
| `qqbot:channel:CHANNEL_ID` | Guild-Kanal        |

> Jeder Bot hat seinen eigenen Satz an Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> verwendet werden, um Nachrichten über Bot B zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der AI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                                    |
| `/bot-version` | Zeigt die Version des OpenClaw-Frameworks an                                                                  |
| `/bot-help`    | Listet alle Befehle auf                                                                                       |
| `/bot-upgrade` | Zeigt den Link zum QQBot-Upgrade-Leitfaden an                                                                 |
| `/bot-logs`    | Exportiert aktuelle Gateway-Logs als Datei                                                                    |
| `/bot-approve` | Genehmigt eine ausstehende QQ-Bot-Aktion (zum Beispiel das Bestätigen eines C2C- oder Gruppen-Uploads) über den nativen Ablauf. |

Hängen Sie `?` an einen beliebigen Befehl an, um Verwendungshilfe anzuzeigen (zum Beispiel `/bot-upgrade ?`).

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugins ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcen-Stack (WebSocket-Verbindung, API-Client, Token-Cache, Root für Medienspeicherung), der über `appId` adressiert wird. Konten teilen niemals eingehenden/ausgehenden Zustand.
- Der Logger für mehrere Konten versieht Logzeilen mit dem besitzenden Konto, damit Diagnosen trennbar bleiben, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich einen gemeinsamen Root für Medien-Payloads unter `~/.openclaw/media`, sodass Uploads, Downloads und Transkodierungs-Caches unter einem geschützten Verzeichnis statt in einem Baum pro Subsystem landen.
- Anmeldedaten können als Teil standardmäßiger OpenClaw-Snapshots für Anmeldedaten gesichert und wiederhergestellt werden; die Engine bindet beim Wiederherstellen den Ressourcen-Stack jedes Kontos erneut ein, ohne dass ein neues Koppeln per QR-Code erforderlich ist.

## Onboarding per QR-Code

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen Onboarding-Ablauf per QR-Code, um einen QQ-Bot mit OpenClaw zu verknüpfen:

1. Führen Sie den Einrichtungsweg für QQ Bot aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie den QR-Code-Ablauf, wenn Sie dazu aufgefordert werden.
2. Scannen Sie den generierten QR-Code mit der Telefon-App, die mit dem Ziel-QQ-Bot verknüpft ist.
3. Genehmigen Sie die Kopplung auf dem Telefon. OpenClaw speichert die zurückgegebenen Anmeldedaten unter `credentials/` im richtigen Kontobereich.

Genehmigungsaufforderungen, die vom Bot selbst generiert werden (zum Beispiel „diese Aktion zulassen?“-Abläufe, die von der QQ-Bot-API bereitgestellt werden), erscheinen als native OpenClaw-Aufforderungen, die Sie mit `/bot-approve` annehmen können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet mit „gone to Mars“:** Anmeldedaten sind nicht konfiguriert oder das Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Prüfen Sie, ob `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Einrichtung mit `--token-file` wird weiterhin als nicht konfiguriert angezeigt:** `--token-file` setzt nur
  das AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann botinitiierte Nachrichten abfangen, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert ist und der Provider erreichbar ist.

## Verwandt

- [Pairing](/de/channels/pairing)
- [Groups](/de/channels/groups)
- [Channel troubleshooting](/de/channels/troubleshooting)
