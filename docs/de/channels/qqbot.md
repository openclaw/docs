---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen die Anmeldedaten für QQ Bot einrichten
    - Sie möchten Unterstützung für QQ Bot in Gruppen- oder privaten Chats
summary: Einrichtung, Konfiguration und Nutzung des QQ-Bots
title: QQ-Bot
x-i18n:
    generated_at: "2026-05-03T21:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw. Das
Plugin unterstützt C2C-Privatchats, Gruppen-@Nachrichten und Guild-Kanalnachrichten mit
Rich Media (Bilder, Sprache, Video, Dateien).

Status: herunterladbares Plugin. Direktnachrichten, Gruppenchats, Guild-Kanäle und
Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Installation

Installieren Sie QQ Bot vor der Einrichtung:

```bash
openclaw plugins install @openclaw/qqbot
```

## Einrichtung

1. Öffnen Sie die [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   Telefon-QQ, um sich zu registrieren bzw. anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ Bot zu erstellen.
3. Suchen Sie **AppID** und **AppSecret** auf der Einstellungsseite des Bots und kopieren Sie sie.

> AppSecret wird nicht im Klartext gespeichert — wenn Sie die Seite verlassen, ohne es zu speichern,
> müssen Sie ein neues generieren.

4. Fügen Sie den Kanal hinzu:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Starten Sie den Gateway neu.

Interaktive Einrichtungspfade:

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

Standardkonto-Umgebungsvariablen:

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

Env SecretRef AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Hinweise:

- Der Env-Fallback gilt nur für das standardmäßige QQ Bot-Konto.
- `openclaw channels add --channel qqbot --token-file ...` stellt nur das
  AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartextzeichenfolge.
- Veraltete `secretref:/...`-Markerzeichenfolgen sind keine gültigen `clientSecret`-Werte;
  verwenden Sie strukturierte SecretRef-Objekte wie im Beispiel oben.

### Einrichtung mehrerer Konten

Führen Sie mehrere QQ Bots unter einer einzelnen OpenClaw-Instanz aus:

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

Fügen Sie einen zweiten Bot per CLI hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Gruppenchats

Die Unterstützung für QQ Bot-Gruppenchats verwendet QQ-Gruppen-OpenIDs, keine Anzeigenamen. Fügen Sie den Bot
einer Gruppe hinzu, erwähnen Sie ihn dann oder konfigurieren Sie die Gruppe so, dass sie ohne Erwähnung ausgeführt wird.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` legt Standardwerte für jede Gruppe fest, und ein konkreter
`groups.GROUP_OPENID`-Eintrag überschreibt diese Standardwerte für eine Gruppe. Gruppeneinstellungen
umfassen:

- `requireMention`: erfordert eine @Erwähnung, bevor der Bot antwortet. Standard: `true`.
- `ignoreOtherMentions`: verwirft Nachrichten, die eine andere Person erwähnen, aber nicht den Bot.
- `historyLimit`: behält aktuelle Gruppen-Nachrichten ohne Erwähnung als Kontext für die nächste erwähnte Runde bei. Setzen Sie `0`, um dies zu deaktivieren.
- `toolPolicy`: `full`, `restricted` oder `none` für gruppenspezifische Tools.
- `name`: benutzerfreundliches Label, das in Logs und im Gruppenkontext verwendet wird.
- `prompt`: gruppenspezifischer Verhaltens-Prompt, der an den Agentenkontext angehängt wird.

Aktivierungsmodi sind `mention` und `always`. `requireMention: true` wird auf
`mention` abgebildet; `requireMention: false` wird auf `always` abgebildet. Eine Aktivierungsüberschreibung
auf Sitzungsebene hat Vorrang vor der Konfiguration, wenn sie vorhanden ist.

Die Eingangswarteschlange ist pro Peer. Gruppen-Peers erhalten eine größere Warteschlangengrenze, halten menschliche
Nachrichten bei voller Warteschlange vor von Bots verfasstem Rauschen und führen Salven normaler
Gruppen-Nachrichten zu einer zugeordneten Runde zusammen. Slash-Befehle werden weiterhin einzeln ausgeführt.

### Sprache (STT / TTS)

STT- und TTS-Unterstützung verwendet eine zweistufige Konfiguration mit priorisiertem Fallback:

| Einstellung | Plugin-spezifisch                                        | Framework-Fallback           |
| ----------- | -------------------------------------------------------- | ---------------------------- |
| STT         | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
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

Setzen Sie `enabled: false` bei einem der beiden, um ihn zu deaktivieren.
TTS-Überschreibungen auf Kontoebene verwenden dieselbe Struktur wie `messages.tts` und werden per Deep-Merge
über die kanalweite/globale TTS-Konfiguration gelegt.

Eingehende QQ-Sprachanhänge werden Agenten als Audio-Medienmetadaten bereitgestellt, während
rohe Sprachdateien aus generischen `MediaPaths` herausgehalten werden. `[[audio_as_voice]]`-Klartextantworten
synthetisieren TTS und senden eine native QQ-Sprachnachricht, wenn TTS
konfiguriert ist.

Das Upload-/Transcode-Verhalten für ausgehende Audiodaten kann außerdem mit
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung     |
| -------------------------- | ---------------- |
| `qqbot:c2c:OPENID`         | Privatchat (C2C) |
| `qqbot:group:GROUP_OPENID` | Gruppenchat      |
| `qqbot:channel:CHANNEL_ID` | Guild-Kanal      |

> Jeder Bot hat seinen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> zum Senden von Nachrichten über Bot B verwendet werden.

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                                |
| `/bot-version` | Zeigt die Version des OpenClaw-Frameworks an                                                              |
| `/bot-help`    | Listet alle Befehle auf                                                                                   |
| `/bot-me`      | Zeigt die QQ-Benutzer-ID (openid) des Absenders für die Einrichtung von `allowFrom`/`groupAllowFrom` an   |
| `/bot-upgrade` | Zeigt den Link zum QQBot-Upgrade-Leitfaden an                                                             |
| `/bot-logs`    | Exportiert aktuelle Gateway-Logs als Datei                                                                |
| `/bot-approve` | Genehmigt eine ausstehende QQ Bot-Aktion (zum Beispiel die Bestätigung eines C2C- oder Gruppen-Uploads) über den nativen Ablauf. |

Hängen Sie `?` an einen beliebigen Befehl an, um Nutzungshilfe zu erhalten (zum Beispiel `/bot-upgrade ?`).

Admin-Befehle (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sind nur für Direktnachrichten verfügbar und erfordern die openid des Absenders in einer expliziten `allowFrom`-Liste ohne Wildcard. Eine Wildcard `allowFrom: ["*"]` erlaubt Chat, gewährt aber keinen Zugriff auf Admin-Befehle. Gruppennachrichten werden zuerst gegen `groupAllowFrom` abgeglichen und fallen auf `allowFrom` zurück. Wenn ein Admin-Befehl in einer Gruppe ausgeführt wird, wird ein Hinweis zurückgegeben, statt ihn stillschweigend zu verwerfen.

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugin ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcenstapel (WebSocket-Verbindung, API-Client, Token-Cache, Medienspeicher-Root), der nach `appId` geschlüsselt ist. Konten teilen niemals eingehenden/ausgehenden Zustand.
- Der Logger für mehrere Konten markiert Logzeilen mit dem zuständigen Konto, damit Diagnosen trennbar bleiben, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich ein einzelnes Medien-Payload-Root unter `~/.openclaw/media`, sodass Uploads, Downloads und Transcode-Caches unter einem geschützten Verzeichnis landen statt in einem Baum pro Subsystem.
- Rich-Media-Zustellung läuft über einen einzigen `sendMedia`-Pfad für C2C- und Gruppenziele. Lokale Dateien und Puffer oberhalb des Schwellenwerts für große Dateien verwenden die Chunked-Upload-Endpunkte von QQ, während kleinere Payloads die One-Shot-Medien-API verwenden.
- Zugangsdaten können als Teil der standardmäßigen OpenClaw-Zugangsdaten-Snapshots gesichert und wiederhergestellt werden; die Engine hängt den Ressourcenstapel jedes Kontos bei der Wiederherstellung erneut ein, ohne ein neues QR-Code-Paar zu erfordern.

## QR-Code-Onboarding

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf, um einen QQ Bot mit OpenClaw zu verknüpfen:

1. Führen Sie den QQ Bot-Einrichtungspfad aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie den QR-Code-Ablauf, wenn Sie dazu aufgefordert werden.
2. Scannen Sie den generierten QR-Code mit der Telefon-App, die mit dem Ziel-QQ Bot verbunden ist.
3. Genehmigen Sie die Kopplung auf dem Telefon. OpenClaw speichert die zurückgegebenen Zugangsdaten im richtigen Kontobereich unter `credentials/`.

Genehmigungs-Prompts, die vom Bot selbst erzeugt werden (zum Beispiel „Diese Aktion erlauben?“-Abläufe, die von der QQ Bot API bereitgestellt werden), erscheinen als native OpenClaw-Prompts, die Sie mit `/bot-approve` akzeptieren können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet „gone to Mars“:** Zugangsdaten sind nicht konfiguriert oder der Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Verifizieren Sie, dass `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Wiederholte Selbstantworten:** OpenClaw zeichnet QQ-Ausgangs-Referenzindizes als
  vom Bot verfasst auf und ignoriert eingehende Ereignisse, deren aktueller `msgIdx` mit demselben
  Bot-Konto übereinstimmt. Dadurch werden Plattform-Echo-Schleifen verhindert, während Benutzer weiterhin
  frühere Bot-Nachrichten zitieren oder darauf antworten können.
- **Einrichtung mit `--token-file` wird weiterhin als unkonfiguriert angezeigt:** `--token-file` setzt nur
  das AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer kürzlich nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert und der Provider erreichbar ist.

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
