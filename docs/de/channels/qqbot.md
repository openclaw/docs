---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen die Zugangsdaten für den QQ Bot einrichten
    - Sie möchten Unterstützung für QQ Bot-Gruppen- oder private Chats
summary: Einrichtung, Konfiguration und Nutzung von QQ Bot
title: QQ-Bot
x-i18n:
    generated_at: "2026-06-27T17:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw. Das
Plugin unterstützt privaten C2C-Chat, Gruppen-@Nachrichten und Guild-Kanalnachrichten mit
Rich Media (Bilder, Sprache, Video, Dateien).

Status: herunterladbares Plugin. Direktnachrichten, Gruppenchats, Guild-Kanäle und
Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Installieren

Installieren Sie QQ Bot vor der Einrichtung:

```bash
openclaw plugins install @openclaw/qqbot
```

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   QQ auf dem Smartphone, um sich zu registrieren / anzumelden.
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

Env-SecretRef-AppSecret:

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
- Legacy-Markierungszeichenfolgen `secretref:/...` sind keine gültigen `clientSecret`-Werte;
  verwenden Sie strukturierte SecretRef-Objekte wie im obigen Beispiel.

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

Fügen Sie per CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Gruppenchats

Die Unterstützung von QQ Bot für Gruppenchats verwendet QQ-Gruppen-OpenIDs, nicht Anzeigenamen. Fügen Sie den Bot
einer Gruppe hinzu und erwähnen Sie ihn dann oder konfigurieren Sie die Gruppe so, dass sie ohne Erwähnung ausgeführt wird.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` legt Standardwerte für jede Gruppe fest, und ein konkreter
Eintrag `groups.GROUP_OPENID` überschreibt diese Standardwerte für eine Gruppe. Gruppeneinstellungen
umfassen:

- `requireMention`: erfordert eine @Erwähnung, bevor der Bot antwortet. Standard: `true`.
- `commandLevel`: steuert, welche integrierten Slash-Befehle in Gruppen ausgeführt werden können.
  Standard: `all`, wodurch das zuvor bestehende QQBot-Gruppenverhalten beibehalten wird, wenn die
  Einstellung ausgelassen wird.
- `ignoreOtherMentions`: verwirft Nachrichten, die jemand anderen erwähnen, aber nicht den Bot.
- `historyLimit`: behält aktuelle Gruppen-Nachrichten ohne Erwähnung als Kontext für den nächsten erwähnten Turn. Setzen Sie `0`, um dies zu deaktivieren.
- `tools`: erlaubt/verweigert Tools für die gesamte Gruppe.
- `toolsBySender`: gruppenbezogene Tool-Überschreibungen pro Absender; siehe [Gruppen](/de/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: lesbare Bezeichnung, die in Logs und im Gruppenkontext verwendet wird.
- `prompt`: gruppenspezifischer Verhaltens-Prompt, der an den Agent-Kontext angehängt wird.

`commandLevel` akzeptiert:

- `all`: hält erkannte integrierte Befehle wie bisher verfügbar. Einige Befehle können
  in Menüs verborgen bleiben, aber autorisierte Benutzer können sie weiterhin in der Gruppe ausführen.
- `safety`: erlaubt gängige Befehle für Zusammenarbeit wie `/help`, `/btw` und
  `/stop`; fordert Benutzer auf, sensible Befehle wie `/config`, `/tools` und
  `/bash` im privaten Chat auszuführen.
- `strict`: erlaubt nur die Gruppen-Sitzungssteuerungen, die für einen strikten Gruppenbetrieb
  benötigt werden. `/stop` bleibt weiterhin dringend, damit ein autorisierter Absender einen
  aktiven Lauf unterbrechen kann.

Alte QQBot-`toolPolicy`-Einträge sind außer Betrieb genommen. Führen Sie `openclaw doctor --fix` aus, um sie zu `tools` zu migrieren.

Aktivierungsmodi sind `mention` und `always`. `requireMention: true` wird
`mention` zugeordnet; `requireMention: false` wird `always` zugeordnet. Eine Aktivierungsüberschreibung
auf Sitzungsebene hat Vorrang vor der Konfiguration, wenn sie vorhanden ist.

Die eingehende Warteschlange ist pro Peer. Gruppen-Peers erhalten eine größere Warteschlangengrenze, halten menschliche
Nachrichten bei voller Warteschlange vor von Bots verfasstem Rauschen und fassen Bursts normaler
Gruppennachrichten zu einem zugeordneten Turn zusammen. Slash-Befehle werden weiterhin einzeln ausgeführt.

### Sprache (STT / TTS)

STT und TTS unterstützen eine zweistufige Konfiguration mit priorisiertem Fallback:

| Einstellung | Plugin-spezifisch                                        | Framework-Fallback           |
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

Setzen Sie bei beiden `enabled: false`, um sie zu deaktivieren.
TTS-Überschreibungen auf Kontoebene verwenden dieselbe Form wie `messages.tts` und werden tief
über die Kanal-/globale TTS-Konfiguration gemergt.

Eingehende QQ-Sprachanhänge werden Agents als Audio-Medienmetadaten bereitgestellt, während
die Roh-Sprachdateien aus generischen `MediaPaths` herausgehalten werden. Klartextantworten mit `[[audio_as_voice]]`
synthetisieren TTS und senden eine native QQ-Sprachnachricht, wenn TTS
konfiguriert ist.

Das Verhalten für ausgehende Audio-Uploads/Transcodierung kann außerdem mit
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C) |
| `qqbot:group:GROUP_OPENID` | Gruppenchat        |
| `qqbot:channel:CHANNEL_ID` | Guild-Kanal        |

> Jeder Bot hat seinen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> verwendet werden, um Nachrichten über Bot B zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                               |
| `/bot-version` | Zeigt die Version des OpenClaw-Frameworks an                                                             |
| `/bot-help`    | Listet alle Befehle auf                                                                                  |
| `/bot-me`      | Zeigt die QQ-Benutzer-ID (openid) des Absenders für die Einrichtung von `allowFrom`/`groupAllowFrom` an  |
| `/bot-upgrade` | Zeigt den Link zum QQBot-Upgrade-Leitfaden an                                                            |
| `/bot-logs`    | Exportiert aktuelle Gateway-Logs als Datei                                                               |
| `/bot-approve` | Genehmigt eine ausstehende QQ Bot-Aktion (zum Beispiel die Bestätigung eines C2C- oder Gruppen-Uploads) über den nativen Ablauf. |

Hängen Sie `?` an einen beliebigen Befehl an, um Nutzungshilfe zu erhalten (zum Beispiel `/bot-upgrade ?`).

Admin-Befehle (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sind nur für Direktnachrichten verfügbar und erfordern die openid des Absenders in einer expliziten `allowFrom`-Liste ohne Wildcard. Ein Wildcard-Eintrag `allowFrom: ["*"]` erlaubt Chat, gewährt aber keinen Zugriff auf Admin-Befehle. Gruppennachrichten werden zuerst gegen `groupAllowFrom` abgeglichen und fallen dann auf `allowFrom` zurück. Wenn ein Admin-Befehl in einer Gruppe ausgeführt wird, wird ein Hinweis zurückgegeben, statt ihn stillschweigend zu verwerfen.

Wenn QQ Bot-Ausführungsgenehmigungen den standardmäßigen Same-Chat-Fallback verwenden, folgen Klicks auf native Genehmigungsbuttons
derselben expliziten Befehls-Allowlist ohne Wildcard. Um nur Genehmigungszugriff ohne breiteren Befehlszugriff zu gewähren, konfigurieren Sie
`channels.qqbot.execApprovals.approvers`.

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugins ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcen-Stack (WebSocket-Verbindung, API-Client, Token-Cache, Medienspeicher-Root), der über `appId` geschlüsselt ist. Konten teilen niemals eingehenden/ausgehenden Zustand.
- Der Multi-Konto-Logger markiert Logzeilen mit dem zugehörigen Konto, damit Diagnosen getrennt bleiben, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich einen einzelnen Medien-Payload-Root unter `~/.openclaw/media`, sodass Uploads, Downloads und Transcode-Caches in einem geschützten Verzeichnis landen, statt in einem Baum pro Subsystem.
- Die Rich-Media-Zustellung läuft über einen einzigen `sendMedia`-Pfad für C2C- und Gruppenziele. Lokale Dateien und Puffer oberhalb des Schwellenwerts für große Dateien verwenden die Chunked-Upload-Endpunkte von QQ, während kleinere Payloads die One-Shot-Medien-API verwenden.
- Anmeldedaten können als Teil der standardmäßigen OpenClaw-Anmeldedaten-Snapshots gesichert und wiederhergestellt werden; die Engine hängt den Ressourcen-Stack jedes Kontos bei der Wiederherstellung erneut ein, ohne ein frisches QR-Code-Paar zu erfordern.

## QR-Code-Onboarding

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf zum Verknüpfen eines QQ Bot mit OpenClaw:

1. Führen Sie den Einrichtungspfad für QQ Bot aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie den QR-Code-Ablauf, wenn Sie dazu aufgefordert werden.
2. Scannen Sie den generierten QR-Code mit der Smartphone-App, die mit dem Ziel-QQ Bot verknüpft ist.
3. Genehmigen Sie die Kopplung auf dem Smartphone. OpenClaw speichert die zurückgegebenen Anmeldedaten unter dem richtigen Kontoumfang in `credentials/`.

Genehmigungs-Prompts, die vom Bot selbst erzeugt werden (zum Beispiel „Diese Aktion zulassen?“-Abläufe, die von der QQ Bot API bereitgestellt werden), erscheinen als native OpenClaw-Prompts, die Sie mit `/bot-approve` akzeptieren können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet „zum Mars verschwunden“:** Zugangsdaten sind nicht konfiguriert oder der Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Prüfen Sie, ob `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Wiederholte Selbstantworten:** OpenClaw zeichnet ausgehende QQ-Referenzindizes als
  vom Bot verfasst auf und ignoriert eingehende Ereignisse, deren aktueller `msgIdx` mit demselben
  Bot-Konto übereinstimmt. Dadurch werden Plattform-Echo-Schleifen verhindert, während Benutzer
  weiterhin frühere Bot-Nachrichten zitieren oder darauf antworten können.
- **Einrichtung mit `--token-file` wird weiterhin als nicht konfiguriert angezeigt:** `--token-file` legt nur
  das AppSecret fest. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer kürzlich nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert und der Provider erreichbar ist.

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
