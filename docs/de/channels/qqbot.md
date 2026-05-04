---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen die Anmeldedaten für den QQ-Bot einrichten
    - Sie möchten Unterstützung für Gruppen- oder private Chats mit QQ Bot
summary: Einrichtung, Konfiguration und Nutzung des QQ-Bots
title: QQ-Bot
x-i18n:
    generated_at: "2026-05-04T02:21:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw. Das
Plugin unterstützt private C2C-Chats, Gruppen-@Nachrichten und Guild-Channel-Nachrichten mit
Rich Media (Bilder, Sprache, Video, Dateien).

Status: herunterladbares Plugin. Direktnachrichten, Gruppenchats, Guild-Channels und
Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Installation

Installieren Sie QQ Bot vor der Einrichtung:

```bash
openclaw plugins install @openclaw/qqbot
```

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   Telefon-QQ, um sich zu registrieren / anzumelden.
2. Klicken Sie auf **Bot erstellen**, um einen neuen QQ-Bot zu erstellen.
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

Env-Variablen für das Standardkonto:

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

- Der Env-Fallback gilt nur für das Standardkonto von QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` stellt nur das
  AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartextzeichenfolge.
- Alte `secretref:/...`-Markerzeichenfolgen sind keine gültigen `clientSecret`-Werte;
  verwenden Sie strukturierte SecretRef-Objekte wie im obigen Beispiel.

### Einrichtung mehrerer Konten

Führen Sie mehrere QQ-Bots unter einer einzelnen OpenClaw-Instanz aus:

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

Fügen Sie per CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Gruppenchats

Die Unterstützung von Gruppenchats in QQ Bot verwendet QQ-Gruppen-OpenIDs, nicht Anzeigenamen. Fügen Sie den Bot
zu einer Gruppe hinzu, erwähnen Sie ihn dann oder konfigurieren Sie die Gruppe so, dass sie ohne Erwähnung läuft.

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

- `requireMention`: Erfordert eine @Erwähnung, bevor der Bot antwortet. Standard: `true`.
- `ignoreOtherMentions`: Verwirft Nachrichten, die jemand anderen erwähnen, aber nicht den Bot.
- `historyLimit`: Behält aktuelle Gruppennachrichten ohne Erwähnung als Kontext für den nächsten erwähnten Turn. Setzen Sie `0`, um dies zu deaktivieren.
- `toolPolicy`: `full`, `restricted` oder `none` für gruppenspezifische Tools.
- `name`: Anzeigename, der in Protokollen und im Gruppenkontext verwendet wird.
- `prompt`: Verhaltens-Prompt pro Gruppe, der an den Agentenkontext angehängt wird.

Aktivierungsmodi sind `mention` und `always`. `requireMention: true` entspricht
`mention`; `requireMention: false` entspricht `always`. Eine Aktivierungsüberschreibung
auf Sitzungsebene hat Vorrang vor der Konfiguration, wenn sie vorhanden ist.

Die eingehende Warteschlange ist pro Peer. Gruppen-Peers erhalten eine größere Warteschlangenkapazität, behalten menschliche
Nachrichten vor botverfasstem Rauschen, wenn die Warteschlange voll ist, und führen Bursts normaler
Gruppennachrichten zu einem zugeordneten Turn zusammen. Slash-Befehle werden weiterhin einzeln ausgeführt.

### Sprache (STT / TTS)

STT- und TTS-Unterstützung nutzt eine zweistufige Konfiguration mit priorisiertem Fallback:

| Einstellung | Plugin-spezifisch                                         | Framework-Fallback           |
| ----------- | --------------------------------------------------------- | ---------------------------- |
| STT         | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS         | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`               |

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
        "qq-main": {
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
TTS-Überschreibungen auf Kontoebene verwenden dieselbe Form wie `messages.tts` und werden per Deep-Merge
über die kanalweite/globale TTS-Konfiguration gelegt.

Eingehende QQ-Sprachanhänge werden Agents als Audiomedien-Metadaten bereitgestellt, während
rohe Sprachdateien aus generischen `MediaPaths` herausgehalten werden. `[[audio_as_voice]]`-Klartextantworten
synthetisieren TTS und senden eine native QQ-Sprachnachricht, wenn TTS
konfiguriert ist.

Das Verhalten für ausgehendes Audio-Upload/Transcoding kann auch mit
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C) |
| `qqbot:group:GROUP_OPENID` | Gruppenchat        |
| `qqbot:channel:CHANNEL_ID` | Guild-Channel      |

> Jeder Bot hat seinen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> verwendet werden, um Nachrichten über Bot B zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                               |
| `/bot-version` | Zeigt die Version des OpenClaw-Frameworks                                                                |
| `/bot-help`    | Listet alle Befehle auf                                                                                  |
| `/bot-me`      | Zeigt die QQ-Benutzer-ID (openid) des Absenders für die Einrichtung von `allowFrom`/`groupAllowFrom`     |
| `/bot-upgrade` | Zeigt den Link zum QQBot-Upgrade-Leitfaden                                                               |
| `/bot-logs`    | Exportiert aktuelle Gateway-Protokolle als Datei                                                         |
| `/bot-approve` | Genehmigt eine ausstehende QQ Bot-Aktion (zum Beispiel die Bestätigung eines C2C- oder Gruppen-Uploads) über den nativen Ablauf. |

Hängen Sie `?` an einen beliebigen Befehl an, um Nutzungshilfe zu erhalten (zum Beispiel `/bot-upgrade ?`).

Admin-Befehle (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sind nur für Direktnachrichten verfügbar und erfordern die openid des Absenders in einer expliziten `allowFrom`-Liste ohne Platzhalter. Ein Platzhalter `allowFrom: ["*"]` erlaubt Chat, gewährt aber keinen Zugriff auf Admin-Befehle. Gruppennachrichten werden zuerst gegen `groupAllowFrom` abgeglichen und fallen auf `allowFrom` zurück. Das Ausführen eines Admin-Befehls in einer Gruppe gibt einen Hinweis zurück, statt ihn stillschweigend zu verwerfen.

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugins ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcenstapel (WebSocket-Verbindung, API-Client, Token-Cache, Medienspeicherstamm), der durch `appId` identifiziert wird. Konten teilen niemals eingehenden/ausgehenden Zustand.
- Der Logger für mehrere Konten markiert Protokollzeilen mit dem zuständigen Konto, damit Diagnosen getrennt bleiben, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich einen einzelnen Medien-Payload-Stamm unter `~/.openclaw/media`, sodass Uploads, Downloads und Transcoding-Caches unter einem geschützten Verzeichnis landen statt in einem Baum pro Subsystem.
- Rich-Media-Zustellung läuft über einen einzigen `sendMedia`-Pfad für C2C- und Gruppenziele. Lokale Dateien und Puffer oberhalb des Schwellenwerts für große Dateien verwenden die segmentierten Upload-Endpunkte von QQ, während kleinere Payloads die One-Shot-Media-API verwenden.
- Zugangsdaten können als Teil standardmäßiger OpenClaw-Zugangsdaten-Snapshots gesichert und wiederhergestellt werden; die Engine hängt den Ressourcenstapel jedes Kontos beim Wiederherstellen wieder an, ohne ein neues QR-Code-Pairing zu erfordern.

## QR-Code-Onboarding

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf zum Verknüpfen eines QQ Bot mit OpenClaw:

1. Führen Sie den Einrichtungspfad für QQ Bot aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie den QR-Code-Ablauf, wenn Sie dazu aufgefordert werden.
2. Scannen Sie den generierten QR-Code mit der Telefon-App, die mit dem Ziel-QQ Bot verbunden ist.
3. Genehmigen Sie das Pairing auf dem Telefon. OpenClaw speichert die zurückgegebenen Zugangsdaten im richtigen Kontobereich unter `credentials/`.

Genehmigungsaufforderungen, die vom Bot selbst erzeugt werden (zum Beispiel „Diese Aktion zulassen?“-Abläufe, die von der QQ Bot API bereitgestellt werden), erscheinen als native OpenClaw-Aufforderungen, die Sie mit `/bot-approve` akzeptieren können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet „zum Mars verschwunden“:** Zugangsdaten sind nicht konfiguriert oder der Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Überprüfen Sie, ob `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Wiederholte Selbstantworten:** OpenClaw erfasst ausgehende QQ-Referenzindizes als
  botverfasst und ignoriert eingehende Ereignisse, deren aktueller `msgIdx` mit demselben
  Bot-Konto übereinstimmt. Dadurch werden Plattform-Echoschleifen verhindert, während Benutzer weiterhin
  frühere Bot-Nachrichten zitieren oder darauf antworten können.
- **Einrichtung mit `--token-file` wird weiterhin als nicht konfiguriert angezeigt:** `--token-file` setzt nur
  das AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer kürzlich nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert ist und der Provider erreichbar ist.

## Verwandte Themen

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
