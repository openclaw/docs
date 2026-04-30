---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen die Zugangsdaten für QQ Bot einrichten
    - Sie möchten QQ Bot-Unterstützung für Gruppen- oder private Chats
summary: 'QQ Bot: Einrichtung, Konfiguration und Verwendung'
title: QQ-Bot
x-i18n:
    generated_at: "2026-04-30T06:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw. Das Plugin unterstützt private C2C-Chats, @Nachrichten in Gruppen und Nachrichten in Gildenkanälen mit Rich Media (Bilder, Sprache, Video, Dateien).

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Gildenkanäle und Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen bündeln QQ Bot, daher benötigen normale paketierte Builds keinen separaten Schritt `openclaw plugins install`.

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   QQ auf dem Telefon, um sich zu registrieren / anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie **AppID** und **AppSecret** auf der Einstellungsseite des Bots und kopieren Sie sie.

> AppSecret wird nicht im Klartext gespeichert — wenn Sie die Seite verlassen, ohne ihn zu speichern,
> müssen Sie einen neuen generieren.

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

- Env-Fallback gilt nur für das Standardkonto von QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` stellt nur den
  AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartext-Zeichenfolge.

### Einrichtung mit mehreren Konten

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

Fügen Sie einen zweiten Bot über die CLI hinzu:

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
Eintrag `groups.GROUP_OPENID` überschreibt diese Standardwerte für eine Gruppe. Gruppen-
einstellungen umfassen:

- `requireMention`: erfordert eine @mention, bevor der Bot antwortet. Standard: `true`.
- `ignoreOtherMentions`: verwirft Nachrichten, die eine andere Person, aber nicht den Bot erwähnen.
- `historyLimit`: bewahrt aktuelle Gruppenmeldungen ohne Erwähnung als Kontext für die nächste erwähnte Runde auf. Setzen Sie `0`, um dies zu deaktivieren.
- `toolPolicy`: `full`, `restricted` oder `none` für gruppenbezogene Tools.
- `name`: lesbares Label, das in Logs und im Gruppenkontext verwendet wird.
- `prompt`: verhaltensbezogener Prompt pro Gruppe, der an den Agentenkontext angehängt wird.

Aktivierungsmodi sind `mention` und `always`. `requireMention: true` wird auf
`mention` abgebildet; `requireMention: false` wird auf `always` abgebildet. Eine Aktivierungs-
überschreibung auf Sitzungsebene hat, falls vorhanden, Vorrang vor der Konfiguration.

Die eingehende Warteschlange ist pro Gegenstelle. Gruppengegenstellen erhalten ein größeres Warteschlangenlimit, behalten menschliche
Nachrichten vor botverfasstem Austausch, wenn sie voll sind, und führen Bursts normaler
Gruppennachrichten zu einer zugeschriebenen Runde zusammen. Slash-Befehle werden weiterhin einzeln ausgeführt.

### Sprache (STT / TTS)

STT- und TTS-Unterstützung nutzt eine zweistufige Konfiguration mit priorisiertem Fallback:

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

Setzen Sie `enabled: false` bei einem der beiden, um ihn zu deaktivieren.
TTS-Überschreibungen auf Kontoebene verwenden dieselbe Struktur wie `messages.tts` und werden tief
über die kanalweite/globale TTS-Konfiguration zusammengeführt.

Eingehende QQ-Sprachanhänge werden Agents als Audiomedien-Metadaten bereitgestellt, während
unbearbeitete Sprachdateien aus generischen `MediaPaths` herausgehalten werden. `[[audio_as_voice]]`-Klartext-
antworten synthetisieren TTS und senden eine native QQ-Sprachnachricht, wenn TTS
konfiguriert ist.

Das Verhalten für ausgehende Audio-Uploads/Transkodierung kann auch mit
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung       |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C) |
| `qqbot:group:GROUP_OPENID` | Gruppenchat        |
| `qqbot:channel:CHANNEL_ID` | Gildenkanal        |

> Jeder Bot hat seinen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> verwendet werden, um Nachrichten über Bot B zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                                        |
| `/bot-version` | OpenClaw-Framework-Version anzeigen                                                                               |
| `/bot-help`    | Alle Befehle auflisten                                                                                            |
| `/bot-upgrade` | Link zum QQBot-Upgrade-Leitfaden anzeigen                                                                         |
| `/bot-logs`    | Aktuelle Gateway-Logs als Datei exportieren                                                                       |
| `/bot-approve` | Eine ausstehende QQ Bot-Aktion über den nativen Ablauf genehmigen (zum Beispiel Bestätigung eines C2C- oder Gruppen-Uploads). |

Hängen Sie `?` an einen beliebigen Befehl an, um Nutzungshilfe zu erhalten (zum Beispiel `/bot-upgrade ?`).

## Engine-Architektur

QQ Bot wird als eigenständige Engine innerhalb des Plugins ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcen-Stack (WebSocket-Verbindung, API-Client, Token-Cache, Medien-Speicherwurzel), der nach `appId` indiziert ist. Konten teilen niemals eingehenden/ausgehenden Zustand.
- Der Multi-Konto-Logger markiert Log-Zeilen mit dem zugehörigen Konto, damit Diagnosen trennbar bleiben, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich eine einzelne Medien-Payload-Wurzel unter `~/.openclaw/media`, sodass Uploads, Downloads und Transkodierungs-Caches in einem geschützten Verzeichnis statt in einem Baum pro Subsystem landen.
- Die Zustellung von Rich Media läuft über einen einzelnen `sendMedia`-Pfad für C2C- und Gruppenziele. Lokale Dateien und Buffer oberhalb des Schwellenwerts für große Dateien verwenden QQs Endpunkte für gestückelte Uploads, während kleinere Payloads die One-Shot-Medien-API verwenden.
- Zugangsdaten können als Teil standardmäßiger OpenClaw-Zugangsdaten-Snapshots gesichert und wiederhergestellt werden; die Engine hängt den Ressourcen-Stack jedes Kontos bei der Wiederherstellung wieder ein, ohne ein neues QR-Code-Paar zu benötigen.

## QR-Code-Onboarding

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf, um einen QQ Bot mit OpenClaw zu verknüpfen:

1. Führen Sie den QQ Bot-Einrichtungspfad aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie bei Aufforderung den QR-Code-Ablauf aus.
2. Scannen Sie den generierten QR-Code mit der Telefon-App, die mit dem Ziel-QQ-Bot verknüpft ist.
3. Genehmigen Sie die Kopplung auf dem Telefon. OpenClaw speichert die zurückgegebenen Zugangsdaten im richtigen Kontogeltungsbereich unter `credentials/`.

Genehmigungsaufforderungen, die vom Bot selbst erzeugt werden (zum Beispiel Abläufe vom Typ „Diese Aktion zulassen?“, die von der QQ Bot API bereitgestellt werden), erscheinen als native OpenClaw-Aufforderungen, die Sie mit `/bot-approve` akzeptieren können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet „gone to Mars“:** Zugangsdaten sind nicht konfiguriert oder das Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Prüfen Sie, ob `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Wiederholte Selbstantworten:** OpenClaw zeichnet ausgehende QQ-Referenzindizes als
  botverfasst auf und ignoriert eingehende Ereignisse, deren aktueller `msgIdx` zu demselben
  Bot-Konto passt. Dies verhindert Plattform-Echoschleifen und erlaubt Benutzern dennoch,
  frühere Bot-Nachrichten zu zitieren oder darauf zu antworten.
- **Einrichtung mit `--token-file` zeigt weiterhin unkonfiguriert an:** `--token-file` setzt nur
  den AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer kürzlich nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert ist und der Provider erreichbar ist.

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
