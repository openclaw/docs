---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen die Zugangsdaten für QQ Bot einrichten
    - Sie möchten Unterstützung für Gruppen- oder private Chats mit QQ Bot
summary: 'QQ Bot: Einrichtung, Konfiguration und Nutzung'
title: QQ-Bot
x-i18n:
    generated_at: "2026-05-02T06:27:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d37dd5846ecf07b1e3e8729faa23877780abdd40577b8dab61ea1ac9399885a
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw. Das
Plugin unterstützt private C2C-Chats, Gruppen-@Nachrichten und Guild-Kanalnachrichten mit
Rich Media (Bilder, Sprache, Video, Dateien).

Status: herunterladbares Plugin. Direktnachrichten, Gruppenchats, Guild-Kanäle und
Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Installation

Installieren Sie QQ Bot vor der Einrichtung:

```bash
openclaw plugins install @openclaw/qqbot
```

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrer
   QQ-App auf dem Telefon, um sich zu registrieren / anzumelden.
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

Env-Vars für das Standardkonto:

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

- Env-Fallback gilt nur für das standardmäßige QQ Bot-Konto.
- `openclaw channels add --channel qqbot --token-file ...` stellt nur den
  AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartextzeichenfolge.

### Einrichtung mit mehreren Konten

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
Token-Cache (isoliert durch `appId`).

Fügen Sie einen zweiten Bot über die CLI hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Gruppenchats

Die QQ Bot-Gruppenchat-Unterstützung verwendet QQ-Gruppen-OpenIDs, keine Anzeigenamen. Fügen Sie den Bot
einer Gruppe hinzu und erwähnen Sie ihn dann oder konfigurieren Sie die Gruppe so, dass sie ohne Erwähnung läuft.

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
- `ignoreOtherMentions`: verwirft Nachrichten, die jemand anderen, aber nicht den Bot erwähnen.
- `historyLimit`: behält aktuelle Gruppennachrichten ohne Erwähnung als Kontext für den nächsten erwähnten Turn. Setzen Sie `0`, um dies zu deaktivieren.
- `toolPolicy`: `full`, `restricted` oder `none` für gruppenbezogene Tools.
- `name`: benutzerfreundliche Bezeichnung, die in Logs und im Gruppenkontext verwendet wird.
- `prompt`: Verhaltens-Prompt pro Gruppe, der an den Agent-Kontext angehängt wird.

Aktivierungsmodi sind `mention` und `always`. `requireMention: true` wird
`mention` zugeordnet; `requireMention: false` wird `always` zugeordnet. Eine sitzungsbezogene Aktivierungsüberschreibung
hat Vorrang vor der Konfiguration, wenn sie vorhanden ist.

Die Eingangsqueue ist pro Peer. Gruppen-Peers erhalten eine größere Queue-Obergrenze, behalten bei voller Queue
menschliche Nachrichten vor botverfasstem Chatter und führen Bursts normaler
Gruppennachrichten zu einem zugeordneten Turn zusammen. Slash-Befehle werden weiterhin einzeln ausgeführt.

### Sprache (STT / TTS)

STT und TTS unterstützen eine zweistufige Konfiguration mit Prioritäts-Fallback:

| Einstellung | Plugin-spezifisch                                       | Framework-Fallback           |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Setzen Sie bei einem der beiden `enabled: false`, um ihn zu deaktivieren.
TTS-Überschreibungen auf Kontoebene verwenden dieselbe Struktur wie `messages.tts` und werden per Deep-Merge
über die Kanal-/globale TTS-Konfiguration gelegt.

Eingehende QQ-Sprachanhänge werden Agents als Audiomedien-Metadaten bereitgestellt, während
rohe Sprachdateien aus generischen `MediaPaths` herausgehalten werden. `[[audio_as_voice]]`-Klartextantworten
synthetisieren TTS und senden eine native QQ-Sprachnachricht, wenn TTS
konfiguriert ist.

Das Verhalten für ausgehenden Audio-Upload und Transcoding kann auch mit
`channels.qqbot.audioFormatPolicy` abgestimmt werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C) |
| `qqbot:group:GROUP_OPENID` | Gruppenchat         |
| `qqbot:channel:CHANNEL_ID` | Guild-Kanal         |

> Jeder Bot hat seinen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> verwendet werden, um Nachrichten über Bot B zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der KI-Queue abgefangen werden:

| Befehl        | Beschreibung                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                             |
| `/bot-version` | Zeigt die OpenClaw-Framework-Version an                                                                      |
| `/bot-help`    | Listet alle Befehle auf                                                                                        |
| `/bot-me`      | Zeigt die QQ-Benutzer-ID (openid) des Absenders für die Einrichtung von `allowFrom`/`groupAllowFrom` an                             |
| `/bot-upgrade` | Zeigt den Link zum QQBot-Upgrade-Leitfaden an                                                                        |
| `/bot-logs`    | Exportiert aktuelle Gateway-Logs als Datei                                                                     |
| `/bot-approve` | Genehmigt eine ausstehende QQ Bot-Aktion (zum Beispiel die Bestätigung eines C2C- oder Gruppen-Uploads) über den nativen Ablauf. |

Hängen Sie `?` an einen beliebigen Befehl an, um Nutzungshilfe zu erhalten (zum Beispiel `/bot-upgrade ?`).

Admin-Befehle (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sind nur für Direktnachrichten verfügbar und erfordern die openid des Absenders in einer expliziten Nicht-Wildcard-`allowFrom`-Liste. Ein Wildcard `allowFrom: ["*"]` erlaubt Chats, gewährt aber keinen Zugriff auf Admin-Befehle. Gruppennachrichten werden zuerst mit `groupAllowFrom` abgeglichen und fallen auf `allowFrom` zurück. Das Ausführen eines Admin-Befehls in einer Gruppe gibt einen Hinweis zurück, statt ihn stillschweigend zu verwerfen.

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugins ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcen-Stack (WebSocket-Verbindung, API-Client, Token-Cache, Medienspeicher-Root), der durch `appId` identifiziert wird. Konten teilen niemals eingehenden/ausgehenden Zustand.
- Der Multi-Konto-Logger markiert Logzeilen mit dem besitzenden Konto, damit Diagnosen trennbar bleiben, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich einen einzelnen Medien-Payload-Root unter `~/.openclaw/media`, sodass Uploads, Downloads und Transcode-Caches in einem geschützten Verzeichnis statt in einem Baum pro Subsystem landen.
- Rich-Media-Zustellung läuft über einen einzelnen `sendMedia`-Pfad für C2C- und Gruppenziele. Lokale Dateien und Puffer oberhalb des Schwellenwerts für große Dateien verwenden die chunked Upload-Endpunkte von QQ, während kleinere Payloads die One-Shot-Medien-API verwenden.
- Zugangsdaten können als Teil der standardmäßigen OpenClaw-Zugangsdaten-Snapshots gesichert und wiederhergestellt werden; die Engine hängt den Ressourcen-Stack jedes Kontos bei der Wiederherstellung wieder an, ohne ein neues QR-Code-Pairing zu erfordern.

## QR-Code-Onboarding

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf zum Verknüpfen eines QQ Bot mit OpenClaw:

1. Führen Sie den QQ Bot-Einrichtungspfad aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie den QR-Code-Ablauf, wenn Sie dazu aufgefordert werden.
2. Scannen Sie den generierten QR-Code mit der Telefon-App, die mit dem Ziel-QQ Bot verknüpft ist.
3. Genehmigen Sie das Pairing auf dem Telefon. OpenClaw speichert die zurückgegebenen Zugangsdaten unter dem richtigen Kontobereich in `credentials/`.

Genehmigungs-Prompts, die vom Bot selbst generiert werden (zum Beispiel "allow this action?"-Abläufe, die von der QQ Bot API bereitgestellt werden), erscheinen als native OpenClaw-Prompts, die Sie mit `/bot-approve` akzeptieren können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet "gone to Mars":** Zugangsdaten sind nicht konfiguriert oder der Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Überprüfen Sie, dass `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Wiederholte Selbstantworten:** OpenClaw zeichnet QQ-Referenzindizes für ausgehende Nachrichten als
  botverfasst auf und ignoriert eingehende Ereignisse, deren aktueller `msgIdx` mit demselben
  Bot-Konto übereinstimmt. Dies verhindert Plattform-Echoschleifen und erlaubt Benutzern weiterhin,
  frühere Bot-Nachrichten zu zitieren oder darauf zu antworten.
- **Einrichtung mit `--token-file` zeigt weiterhin nicht konfiguriert:** `--token-file` setzt nur
  den AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert und der Provider erreichbar ist.

## Verwandt

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
