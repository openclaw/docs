---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen QQ-Bot-Anmeldedaten einrichten
    - Sie möchten Unterstützung für QQ-Bot-Gruppen- oder Privat-Chats
summary: QQ-Bot-Einrichtung, -Konfiguration und -Verwendung
title: QQ-Bot
x-i18n:
    generated_at: "2026-04-26T11:24:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot verbindet sich über die offizielle QQ-Bot-API (WebSocket-Gateway) mit OpenClaw. Das
Plugin unterstützt C2C-Privatchat, Gruppen-@messages und Guild-Kanalnachrichten mit
Rich Media (Bilder, Sprache, Video, Dateien).

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Guild-Kanäle und
Medien werden unterstützt. Reactions und Threads werden nicht unterstützt.

## Gebündeltes Plugin

Aktuelle OpenClaw-Releases bündeln QQ Bot, daher benötigen normale paketierte Builds
keinen separaten Schritt `openclaw plugins install`.

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   QQ auf dem Smartphone, um sich zu registrieren / anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie **AppID** und **AppSecret** auf der Einstellungsseite des Bots und kopieren Sie beide.

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

Dateibasierte AppSecret-Konfiguration:

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
- `openclaw channels add --channel qqbot --token-file ...` stellt nur das
  AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartextzeichenfolge.

### Einrichtung mit mehreren Konten

Mehrere QQ-Bots unter einer einzelnen OpenClaw-Instanz ausführen:

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

Jedes Konto startet eine eigene WebSocket-Verbindung und verwaltet einen unabhängigen
Token-Cache (isoliert nach `appId`).

Einen zweiten Bot per CLI hinzufügen:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Sprache (STT / TTS)

STT- und TTS-Unterstützung verwenden eine zweistufige Konfiguration mit Prioritäts-Fallback:

| Einstellung | Plugin-spezifisch                                       | Framework-Fallback           |
| ----------- | ------------------------------------------------------- | ---------------------------- |
| STT         | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS         | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`               |

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
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Setzen Sie bei einem von beiden `enabled: false`, um es zu deaktivieren.
TTS-Overrides auf Kontoebene verwenden dieselbe Struktur wie `messages.tts` und werden per Deep-Merge
über die kanalweite/globale TTS-Konfiguration gelegt.

Eingehende QQ-Sprachanhänge werden Agenten als Audio-Medienmetadaten bereitgestellt, während
Roh-Sprachdateien aus generischen `MediaPaths` herausgehalten werden. Reine Textantworten mit `[[audio_as_voice]]`
synthetisieren TTS und senden eine native QQ-Sprachnachricht, wenn TTS konfiguriert ist.

Das Verhalten für Upload/Transkodierung ausgehender Audiodaten kann außerdem über
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

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                                      |
| `/bot-version` | Zeigt die Version des OpenClaw-Frameworks an                                                                    |
| `/bot-help`    | Listet alle Befehle auf                                                                                         |
| `/bot-upgrade` | Zeigt den Link zum Upgrade-Leitfaden für QQBot an                                                               |
| `/bot-logs`    | Exportiert aktuelle Gateway-Protokolle als Datei                                                                |
| `/bot-approve` | Genehmigt eine ausstehende QQ-Bot-Aktion (zum Beispiel das Bestätigen eines C2C- oder Gruppen-Uploads) über den nativen Ablauf. |

Hängen Sie `?` an einen beliebigen Befehl an, um Hilfe zur Verwendung zu erhalten (zum Beispiel `/bot-upgrade ?`).

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugin ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcen-Stack (WebSocket-Verbindung, API-Client, Token-Cache, Wurzelverzeichnis für Medienspeicher), der durch `appId` gekennzeichnet ist. Konten teilen niemals eingehenden oder ausgehenden Status.
- Der Logger für mehrere Konten versieht Protokollzeilen mit dem zugehörigen Konto, damit Diagnosen getrennt bleiben, wenn Sie mehrere Bots unter einem Gateway betreiben.
- Eingehende, ausgehende und Gateway-Bridge-Pfade verwenden gemeinsam eine einzige Wurzel für Medien-Payloads unter `~/.openclaw/media`, sodass Uploads, Downloads und Transkodierungs-Caches in einem geschützten Verzeichnis statt in einer Baumstruktur pro Subsystem landen.
- Anmeldedaten können als Teil standardmäßiger OpenClaw-Anmeldedaten-Snapshots gesichert und wiederhergestellt werden; die Engine hängt beim Wiederherstellen den Ressourcen-Stack jedes Kontos erneut an, ohne dass eine neue QR-Code-Kopplung erforderlich ist.

## Onboarding per QR-Code

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf, um einen QQ-Bot mit OpenClaw zu verknüpfen:

1. Führen Sie den Einrichtungsweg für QQ Bot aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie die QR-Code-Variante, wenn Sie dazu aufgefordert werden.
2. Scannen Sie den generierten QR-Code mit der Smartphone-App, die mit dem Ziel-QQ-Bot verknüpft ist.
3. Bestätigen Sie die Kopplung auf dem Smartphone. OpenClaw speichert die zurückgegebenen Anmeldedaten in `credentials/` im richtigen Kontobereich.

Vom Bot selbst erzeugte Bestätigungsaufforderungen (zum Beispiel Abläufe vom Typ „diese Aktion erlauben?“, die von der QQ-Bot-API bereitgestellt werden) erscheinen als native OpenClaw-Aufforderungen, die Sie mit `/bot-approve` akzeptieren können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet „gone to Mars“:** Anmeldedaten sind nicht konfiguriert oder das Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Vergewissern Sie sich, dass `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Wiederholte Selbstantworten:** OpenClaw erfasst QQ-Ausgangs-Ref-Indizes als
  botverfasst und ignoriert eingehende Ereignisse, deren aktueller `msgIdx` mit demselben
  Bot-Konto übereinstimmt. Das verhindert Echo-Schleifen der Plattform und erlaubt Benutzern dennoch,
  frühere Bot-Nachrichten zu zitieren oder darauf zu antworten.
- **Einrichtung mit `--token-file` zeigt weiterhin „nicht konfiguriert“:** `--token-file` setzt nur
  das AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert ist und der Provider erreichbar ist.

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
