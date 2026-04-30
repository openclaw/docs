---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen Zugangsdaten für QQ Bot einrichten
    - Sie möchten Unterstützung für QQ Bot-Gruppenchats oder private Chats
summary: Einrichtung, Konfiguration und Nutzung des QQ-Bots
title: QQ-Bot
x-i18n:
    generated_at: "2026-04-30T09:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw. Das
Plugin unterstützt C2C-Privatchats, Gruppen-@Nachrichten und Guild-Channel-Nachrichten mit
Rich Media (Bilder, Sprache, Video, Dateien).

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Guild-Channels und
Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen bündeln QQ Bot, daher benötigen normale paketierte Builds keinen
separaten Schritt `openclaw plugins install`.

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   Telefon-QQ, um sich zu registrieren / anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie **AppID** und **AppSecret** auf der Einstellungsseite des Bots und kopieren Sie sie.

> AppSecret wird nicht im Klartext gespeichert — wenn Sie die Seite verlassen, ohne es zu speichern,
> müssen Sie ein neues generieren.

4. Fügen Sie den Kanal hinzu:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Starten Sie das Gateway neu.

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

Dateibasierte AppSecret:

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

- Der Env-Fallback gilt nur für das Standardkonto von QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` stellt nur das
  AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartextzeichenfolge.

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
Token-Cache (isoliert nach `appId`).

Fügen Sie per CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Gruppenchats

Die Unterstützung von QQ Bot für Gruppenchats verwendet QQ-Gruppen-OpenIDs, keine Anzeigenamen. Fügen Sie den Bot
zu einer Gruppe hinzu und erwähnen Sie ihn dann oder konfigurieren Sie die Gruppe so, dass sie ohne Erwähnung ausgeführt wird.

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
Eintrag `groups.GROUP_OPENID` überschreibt diese Standardwerte für eine Gruppe. Gruppeneinstellungen
umfassen:

- `requireMention`: erfordert eine @Erwähnung, bevor der Bot antwortet. Standard: `true`.
- `ignoreOtherMentions`: verwirft Nachrichten, die jemand anderen erwähnen, aber nicht den Bot.
- `historyLimit`: behält aktuelle Gruppen-Nachrichten ohne Erwähnung als Kontext für die nächste erwähnte Runde bei. Setzen Sie `0`, um dies zu deaktivieren.
- `toolPolicy`: `full`, `restricted` oder `none` für gruppenspezifische Tools.
- `name`: benutzerfreundliche Bezeichnung, die in Logs und im Gruppenkontext verwendet wird.
- `prompt`: gruppenspezifischer Verhaltens-Prompt, der an den Agent-Kontext angehängt wird.

Aktivierungsmodi sind `mention` und `always`. `requireMention: true` wird auf
`mention` abgebildet; `requireMention: false` wird auf `always` abgebildet. Eine Aktivierungsüberschreibung auf Sitzungsebene
hat Vorrang vor der Konfiguration, wenn sie vorhanden ist.

Die eingehende Warteschlange ist pro Peer. Gruppen-Peers erhalten eine größere Warteschlangenkapazität, behalten menschliche
Nachrichten vor Bot-verfasstem Rauschen, wenn die Warteschlange voll ist, und fassen Bursts normaler
Gruppennachrichten zu einer zugeschriebenen Runde zusammen. Slash-Befehle werden weiterhin einzeln ausgeführt.

### Sprache (STT / TTS)

STT und TTS unterstützen eine zweistufige Konfiguration mit priorisiertem Fallback:

| Einstellung | Plugin-spezifisch                                       | Framework-Fallback            |
| ----------- | ------------------------------------------------------- | ----------------------------- |
| STT         | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS         | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Setzen Sie bei einem der beiden `enabled: false`, um es zu deaktivieren.
TTS-Überschreibungen auf Kontoebene verwenden dieselbe Form wie `messages.tts` und werden per Deep Merge
über die Kanal-/globale TTS-Konfiguration gelegt.

Eingehende QQ-Sprachanhänge werden Agents als Audiomedien-Metadaten bereitgestellt, während
Roh-Sprachdateien aus den generischen `MediaPaths` herausgehalten werden. Klartextantworten mit `[[audio_as_voice]]`
synthetisieren TTS und senden eine native QQ-Sprachnachricht, wenn TTS
konfiguriert ist.

Das Verhalten für ausgehende Audio-Uploads/-Transcodierung kann außerdem mit
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung      |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | Privatchat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Gruppenchat       |
| `qqbot:channel:CHANNEL_ID` | Guild-Channel     |

> Jeder Bot hat seinen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> verwendet werden, um Nachrichten über Bot B zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `/bot-ping`    | Latenztest                                                                                                               |
| `/bot-version` | Zeigt die Version des OpenClaw-Frameworks an                                                                             |
| `/bot-help`    | Listet alle Befehle auf                                                                                                  |
| `/bot-me`      | Zeigt die QQ-Benutzer-ID (openid) des Absenders für die Einrichtung von `allowFrom`/`groupAllowFrom` an                  |
| `/bot-upgrade` | Zeigt den Link zum QQBot-Upgrade-Leitfaden an                                                                            |
| `/bot-logs`    | Exportiert aktuelle Gateway-Logs als Datei                                                                               |
| `/bot-approve` | Genehmigt eine ausstehende QQ Bot-Aktion (zum Beispiel das Bestätigen eines C2C- oder Gruppen-Uploads) über den nativen Ablauf. |

Hängen Sie `?` an einen beliebigen Befehl an, um Nutzungshilfe zu erhalten (zum Beispiel `/bot-upgrade ?`).

Admin-Befehle (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sind nur für Direktnachrichten vorgesehen und erfordern die openid des Absenders in einer expliziten `allowFrom`-Liste ohne Wildcard. Eine Wildcard `allowFrom: ["*"]` erlaubt Chat, gewährt aber keinen Zugriff auf Admin-Befehle. Gruppennachrichten werden zuerst mit `groupAllowFrom` abgeglichen und fallen dann auf `allowFrom` zurück. Das Ausführen eines Admin-Befehls in einer Gruppe gibt einen Hinweis zurück, statt ihn stillschweigend zu verwerfen.

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugins ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcen-Stack (WebSocket-Verbindung, API-Client, Token-Cache, Medien-Speicherwurzel), der nach `appId` verschlüsselt ist. Konten teilen niemals eingehenden/ausgehenden Zustand.
- Der Logger für mehrere Konten versieht Log-Zeilen mit dem zugehörigen Konto, damit Diagnosen getrennt bleiben, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich eine einzelne Medien-Payload-Wurzel unter `~/.openclaw/media`, sodass Uploads, Downloads und Transcode-Caches in einem geschützten Verzeichnis statt in einem Baum pro Subsystem landen.
- Rich-Media-Zustellung läuft über einen einzelnen `sendMedia`-Pfad für C2C- und Gruppenziele. Lokale Dateien und Puffer oberhalb des Schwellenwerts für große Dateien verwenden die Chunked-Upload-Endpunkte von QQ, während kleinere Payloads die One-Shot-Medien-API verwenden.
- Anmeldeinformationen können als Teil standardmäßiger OpenClaw-Anmeldeinformations-Snapshots gesichert und wiederhergestellt werden; die Engine hängt den Ressourcen-Stack jedes Kontos bei der Wiederherstellung erneut an, ohne ein frisches QR-Code-Pairing zu erfordern.

## QR-Code-Onboarding

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf zum Verknüpfen eines QQ Bot mit OpenClaw:

1. Führen Sie den Einrichtungspfad für QQ Bot aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie den QR-Code-Ablauf, wenn Sie dazu aufgefordert werden.
2. Scannen Sie den generierten QR-Code mit der Telefon-App, die mit dem Ziel-QQ Bot verknüpft ist.
3. Genehmigen Sie das Pairing auf dem Telefon. OpenClaw speichert die zurückgegebenen Anmeldeinformationen im richtigen Kontobereich unter `credentials/`.

Vom Bot selbst generierte Genehmigungsaufforderungen (zum Beispiel Abläufe wie „diese Aktion erlauben?“, die von der QQ Bot API bereitgestellt werden) erscheinen als native OpenClaw-Prompts, die Sie mit `/bot-approve` akzeptieren können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet „gone to Mars“:** Anmeldeinformationen sind nicht konfiguriert oder das Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Verifizieren Sie, dass `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Wiederholte Selbstantworten:** OpenClaw zeichnet QQ-Referenzindizes für ausgehende Nachrichten als
  vom Bot verfasst auf und ignoriert eingehende Ereignisse, deren aktueller `msgIdx` mit genau diesem
  Bot-Konto übereinstimmt. Dies verhindert Plattform-Echo-Schleifen und erlaubt Benutzern trotzdem,
  frühere Bot-Nachrichten zu zitieren oder darauf zu antworten.
- **Einrichtung mit `--token-file` zeigt weiterhin unkonfiguriert an:** `--token-file` setzt nur
  das AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert ist und der Provider erreichbar ist.

## Verwandt

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
