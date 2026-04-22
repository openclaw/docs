---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie benötigen die Einrichtung der QQ Bot-Anmeldedaten
    - Sie möchten Unterstützung für QQ Bot-Gruppen- oder Privat-Chats
summary: Einrichtung, Konfiguration und Verwendung des QQ Bot-Plugins
title: QQ Bot
x-i18n:
    generated_at: "2026-04-22T04:20:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw. Das Plugin unterstützt private C2C-Chats, Gruppen-@Nachrichten und Guild-Channel-Nachrichten mit Rich Media (Bilder, Sprache, Videos, Dateien).

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Guild-Channels und Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Gebündeltes Plugin

Aktuelle OpenClaw-Releases enthalten QQ Bot bereits gebündelt, daher ist bei normalen paketierten Builds kein separater `openclaw plugins install`-Schritt erforderlich.

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem QQ auf dem Telefon, um sich zu registrieren bzw. anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie **AppID** und **AppSecret** auf der Einstellungsseite des Bots und kopieren Sie sie.

> AppSecret wird nicht im Klartext gespeichert — wenn Sie die Seite verlassen, ohne es zu speichern, müssen Sie ein neues erzeugen.

4. Fügen Sie den Channel hinzu:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Starten Sie das Gateway neu.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

## Konfiguration

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

Dateibasierter AppSecret:

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

- Der Fallback auf Umgebungsvariablen gilt nur für das Standardkonto von QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` stellt nur das AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartextzeichenfolge.

### Einrichtung mit mehreren Konten

Führen Sie mehrere QQ-Bots unter einer einzigen OpenClaw-Instanz aus:

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

Jedes Konto startet seine eigene WebSocket-Verbindung und verwaltet einen unabhängigen Token-Cache (isoliert nach `appId`).

Fügen Sie über die CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Sprache (STT / TTS)

STT- und TTS-Unterstützung verwenden eine Konfiguration auf zwei Ebenen mit priorisiertem Fallback:

| Einstellung | Plugin-spezifisch    | Framework-Fallback            |
| ----------- | -------------------- | ----------------------------- |
| STT         | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS         | `channels.qqbot.tts` | `messages.tts`                |

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

Setzen Sie bei einem der beiden `enabled: false`, um ihn zu deaktivieren.

Das Verhalten für das Hochladen/Transkodieren ausgehender Audiodateien kann außerdem über `channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C) |
| `qqbot:group:GROUP_OPENID` | Gruppenchat        |
| `qqbot:channel:CHANNEL_ID` | Guild-Channel      |

> Jeder Bot hat seinen eigenen Satz an Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht** verwendet werden, um Nachrichten über Bot B zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                                                       |
| `/bot-version` | Zeigt die OpenClaw-Framework-Version an                                                                                          |
| `/bot-help`    | Listet alle Befehle auf                                                                                                          |
| `/bot-upgrade` | Zeigt den Link zum QQBot-Upgrade-Leitfaden an                                                                                    |
| `/bot-logs`    | Exportiert aktuelle Gateway-Logs als Datei                                                                                       |
| `/bot-approve` | Genehmigt eine ausstehende QQ Bot-Aktion (zum Beispiel die Bestätigung eines C2C- oder Gruppen-Uploads) über den nativen Ablauf. |

Hängen Sie `?` an einen beliebigen Befehl an, um Hilfe zur Verwendung zu erhalten (zum Beispiel `/bot-upgrade ?`).

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugins ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcen-Stack (WebSocket-Verbindung, API-Client, Token-Cache, Stammverzeichnis für Medienspeicher), der nach `appId` zugeordnet ist. Konten teilen niemals eingehenden oder ausgehenden Status.
- Der Logger für mehrere Konten versieht Logzeilen mit dem jeweiligen Konto, damit die Diagnose auch dann getrennt bleibt, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich einen einzigen Stamm für Medien-Payloads unter `~/.openclaw/media`, sodass Uploads, Downloads und Transkodierungs-Caches in einem geschützten Verzeichnis statt in einer Struktur pro Subsystem landen.
- Anmeldedaten können als Teil standardmäßiger OpenClaw-Snapshots für Anmeldedaten gesichert und wiederhergestellt werden; die Engine hängt beim Wiederherstellen den Ressourcen-Stack jedes Kontos wieder an, ohne dass ein neues QR-Code-Pairing erforderlich ist.

## QR-Code-Onboarding

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf, um einen QQ-Bot mit OpenClaw zu verknüpfen:

1. Führen Sie den Einrichtungsweg für QQ Bot aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie bei Aufforderung den QR-Code-Ablauf aus.
2. Scannen Sie den generierten QR-Code mit der Telefon-App, die mit dem Ziel-QQ-Bot verknüpft ist.
3. Genehmigen Sie das Pairing auf dem Telefon. OpenClaw speichert die zurückgegebenen Anmeldedaten in `credentials/` im richtigen Kontobereich.

Vom Bot selbst erzeugte Genehmigungsaufforderungen (zum Beispiel „diese Aktion zulassen?“-Abläufe, die über die QQ Bot API verfügbar sind) erscheinen als native OpenClaw-Aufforderungen, die Sie mit `/bot-approve` annehmen können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet „gone to Mars“:** Anmeldedaten sind nicht konfiguriert oder das Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Vergewissern Sie sich, dass `appId` und `clientSecret` korrekt sind und der Bot auf der QQ Open Platform aktiviert ist.
- **Bei der Einrichtung mit `--token-file` wird weiterhin „unconfigured“ angezeigt:** `--token-file` setzt nur das AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert ist und der Provider erreichbar ist.
