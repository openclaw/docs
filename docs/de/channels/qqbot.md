---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen die Anmeldedaten für den QQ-Bot einrichten
    - Sie möchten Unterstützung für Gruppen- oder Privat-Chats mit QQ Bot
summary: Einrichtung, Konfiguration und Verwendung des QQ Bots
title: QQ-Bot
x-i18n:
    generated_at: "2026-07-12T15:05:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw.
Private C2C-Chats und `@`-Erwähnungen in Gruppen sind die primären Chattypen und unterstützen
Rich Media (Bilder, Sprache, Video, Dateien). Nachrichten in Guild-Kanälen werden nur für
Text und Bilder über Remote-URLs unterstützt; Sprache, Video, Datei-Uploads und lokale/Base64-
Bilder sind in Guild-Kanälen nicht verfügbar. Reaktionen und Threads werden nirgends
unterstützt.

Status: offizielles herunterladbares Plugin.

## Installation

```bash
openclaw plugins install @openclaw/qqbot
```

## Einrichtung

1. Rufen Sie die [QQ Open Platform](https://q.qq.com/) auf und scannen Sie den QR-Code mit QQ auf Ihrem
   Mobiltelefon, um sich zu registrieren bzw. anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie auf der Einstellungsseite des Bots nach **AppID** und **AppSecret** und kopieren Sie beide Werte.

<Note>
AppSecret wird nicht im Klartext gespeichert. Wenn Sie die Seite verlassen, ohne es zu speichern, müssen Sie ein neues generieren.
</Note>

4. Fügen Sie den Kanal hinzu:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Starten Sie das Gateway neu.

Interaktive Einrichtung:

```bash
openclaw channels add
```

Der Assistent bietet alternativ zur manuellen Eingabe von AppID/AppSecret auch
eine QR-Code-Verknüpfung an: Scannen Sie den Code mit der Mobiltelefon-App, die
mit dem gewünschten QQ Bot verknüpft ist, um die Verknüpfung abzuschließen.
OpenClaw speichert die zurückgegebenen Anmeldedaten im Konfigurationsbereich
des Kontos.

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

Umgebungsvariablen für das Standardkonto (nur Konto der obersten Ebene):

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

AppSecret als SecretRef aus einer Umgebungsvariable:

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

- `openclaw channels add --channel qqbot --token-file ...` legt nur das AppSecret
  fest; `appId` muss bereits in der Konfiguration oder in `QQBOT_APP_ID` festgelegt sein.
- `clientSecret` akzeptiert eine Klartextzeichenfolge, einen Dateipfad (`clientSecretFile`)
  oder ein strukturiertes SecretRef-Objekt.
- Veraltete Markerzeichenfolgen im Format `secretref:...` / `secretref-env:...` werden für
  `clientSecret` abgelehnt; verwenden Sie stattdessen ein strukturiertes SecretRef-Objekt.

### Zugriffsrichtlinie

- `allowFrom` / `groupAllowFrom` legen fest, wer in C2C- bzw.
  Gruppenkontexten mit dem Bot chatten darf. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  steuern den Durchsetzungsmodus. `dmPolicy` verwendet standardmäßig `allowlist`, sobald
  `allowFrom` einen konkreten Eintrag (keinen Platzhalter) enthält, andernfalls `open`.
  `groupPolicy` verwendet standardmäßig `allowlist`, sobald entweder `groupAllowFrom` oder
  `allowFrom` einen konkreten Eintrag enthält, andernfalls `open`.
- Slash-Befehle mit „Authentifizierung: Positivliste“ erfordern unabhängig von
  `dmPolicy` / `groupPolicy` einen expliziten Eintrag ohne Platzhalter in
  `allowFrom` (bzw. `groupAllowFrom` bei Aufrufen aus Gruppen) – siehe [Slash-Befehle](#slash-commands).

### Einrichtung mehrerer Konten

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

Jedes Konto besitzt eine isolierte WebSocket-Verbindung, einen API-Client und einen
Token-Cache, die über `appId` zugeordnet werden. Protokollzeilen werden mit der ID
des zugehörigen Kontos versehen, damit die Diagnose getrennt bleibt, wenn Sie mehrere
Bots unter einem Gateway ausführen.

Fügen Sie über die CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Gruppenchats

Die Gruppenunterstützung verwendet OpenIDs von QQ-Gruppen, keine Anzeigenamen.
Fügen Sie den Bot einer Gruppe hinzu und erwähnen Sie ihn anschließend, oder
konfigurieren Sie die Gruppe so, dass sie ohne Erwähnung funktioniert.

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

`groups["*"]` legt Standardwerte für jede Gruppe fest; ein konkreter Eintrag
`groups.GROUP_OPENID` überschreibt diese Standardwerte für eine einzelne Gruppe.
Gruppeneinstellungen:

| Feld                  | Standardwert       | Beschreibung                                                                                               |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`             | Erfordert eine `@`-Erwähnung, bevor der Bot antwortet.                                                     |
| `commandLevel`        | `all`              | Legt fest, welche integrierten Slash-Befehle in der Gruppe ausgeführt werden können (siehe unten).         |
| `ignoreOtherMentions` | `false`            | Verwirft Nachrichten, die eine andere Person, aber nicht den Bot erwähnen.                                 |
| `historyLimit`        | `50`               | Kürzlich gesendete Nachrichten ohne Erwähnung, die als Kontext für den nächsten erwähnten Turn aufbewahrt werden. `0` deaktiviert den Verlauf. |
| `tools`               | —                  | Erlaubt oder verweigert Tools für die gesamte Gruppe.                                                      |
| `toolsBySender`       | —                  | Absenderspezifische Tool-Überschreibungen; siehe [Gruppen](/de/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | OpenID-Präfix       | Benutzerfreundliche Bezeichnung für Protokolle und den Gruppenkontext.                                     |
| `prompt`              | integrierter Standardwert | Gruppenspezifischer Verhaltens-Prompt, der an den Agentenkontext angehängt wird.                    |

`commandLevel` akzeptiert:

| Stufe    | Verhalten                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Vorhandene integrierte Befehle bleiben verfügbar. Einige bleiben in Menüs ausgeblendet, autorisierte Benutzer können sie jedoch weiterhin in der Gruppe ausführen. |
| `safety` | `/help`, `/btw`, `/stop` bleiben in der Gruppe sichtbar; sensible Befehle (`/config`, `/tools`, `/bash` usw.) müssen im privaten Chat ausgeführt werden. |
| `strict` | Nur die für den strikten Betrieb erforderlichen Steuerelemente der Gruppensitzung sind zulässig. `/stop` funktioniert weiterhin, damit ein autorisierter Absender eine aktive Ausführung unterbrechen kann. |

Alte QQBot-Einträge für `toolPolicy` werden nicht mehr verwendet. Führen Sie `openclaw doctor --fix` aus, um sie zu `tools` zu migrieren.

Die Aktivierungsmodi sind `mention` und `always`. `requireMention: true` entspricht
`mention`; `requireMention: false` entspricht `always`. Eine Aktivierungsüberschreibung
auf Sitzungsebene hat, sofern vorhanden, Vorrang vor der Konfiguration.

Die Eingangswarteschlange wird pro Kommunikationspartner geführt. Für Gruppenpartner
gilt eine höhere Obergrenze der Warteschlange (50 gegenüber 20 bei direkten Partnern).
Ist sie voll, werden vom Bot verfasste Nachrichten vor den Nachrichten von Personen
entfernt. Außerdem werden Serien normaler Gruppennachrichten zu einem zugeordneten
Turn zusammengeführt. Slash-Befehle werden einzeln und unabhängig von einem
Zusammenführungsstapel ausgeführt.

### Sprache (STT / TTS)

STT und TTS unterstützen eine zweistufige Konfiguration mit priorisiertem Fallback:

| Einstellung | Plugin-spezifisch                                        | Framework-Fallback            |
| ----------- | -------------------------------------------------------- | ----------------------------- |
| STT         | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
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

Setzen Sie bei einem der beiden Werte `enabled: false`, um ihn zu deaktivieren.
TTS-Überschreibungen auf Kontoebene verwenden dieselbe Struktur wie `messages.tts`
und werden per Deep Merge über die kanalweite/globale TTS-Konfiguration gelegt.

STT-Anfragen überschreiten standardmäßig nach 60 Sekunden das Zeitlimit.
Plugin-spezifisches STT verwendet die ausgewählte Überschreibung
`models.providers.<id>.timeoutSeconds`. Das Audio-STT des Frameworks verwendet
zuerst `tools.media.audio.models[0].timeoutSeconds`, dann
`tools.media.audio.timeoutSeconds` und anschließend die Überschreibung des
ausgewählten Providers.

Eingehende QQ-Sprachanhänge werden Agenten als Audio-Medienmetadaten bereitgestellt,
während die Rohdateien der Sprachnachrichten aus den allgemeinen `MediaPaths`
herausgehalten werden. `[[audio_as_voice]]` in einer Klartextantwort synthetisiert
TTS und sendet eine native QQ-Sprachnachricht, wenn TTS konfiguriert ist.

Das Upload-/Transkodierungsverhalten für ausgehendes Audio kann auch über
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung         |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Gruppenchat          |
| `qqbot:channel:CHANNEL_ID` | Guild-Kanal          |

<Note>
Jeder Bot verfügt über einen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID kann **nicht** zum Senden von Nachrichten über Bot B verwendet werden.
</Note>

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl               | Authentifizierung | Geltungsbereich | Beschreibung                                                                         |
| -------------------- | ----------------- | --------------- | ------------------------------------------------------------------------------------ |
| `/bot-ping`          | —                 | überall         | Latenztest                                                                           |
| `/bot-help`          | —                 | überall         | Alle Befehle auflisten                                                               |
| `/bot-me`            | —                 | nur privat      | QQ-Benutzer-ID (OpenID) des Absenders für die Einrichtung von `allowFrom` / `groupAllowFrom` anzeigen |
| `/bot-version`       | —                 | nur privat      | Version des OpenClaw-Frameworks und des Plugins anzeigen                             |
| `/bot-upgrade`       | —                 | nur privat      | Link zur QQBot-Aktualisierungsanleitung anzeigen                                     |
| `/bot-approve`       | Positivliste      | nur privat      | Genehmigungskonfiguration für die Befehlsausführung verwalten (ein / aus / immer / zurücksetzen / Status) |
| `/bot-logs`          | Positivliste      | nur privat      | Aktuelle Gateway-Protokolle als Datei exportieren                                    |
| `/bot-clear-storage` | Positivliste      | nur privat      | Zwischengespeicherte Downloads im QQBot-Medienverzeichnis löschen                    |
| `/bot-streaming`     | Positivliste      | nur privat      | Streaming-Antworten für C2C umschalten                                                |
| `/bot-group-allways` | Positivliste      | nur privat      | Standardaktivierungsmodus für Gruppen umschalten (Erwähnung erforderlich oder immer aktiv) |

Hängen Sie `?` an einen beliebigen Befehl an, um Hilfe zur Verwendung zu erhalten
(zum Beispiel `/bot-upgrade ?`).

Befehle mit „Authentifizierung: Positivliste“ erfordern zusätzlich die OpenID
des Absenders in einer expliziten `allowFrom`-Liste ohne Platzhalter
(`groupAllowFrom` hat bei aus Gruppen ausgeführten Befehlen Vorrang, mit
Fallback auf `allowFrom`). Ein Platzhalter in `allowFrom: ["*"]` erlaubt Chats,
aber nicht diese Befehle. Wird einer dieser Befehle außerhalb eines privaten
Chats oder ohne Autorisierung ausgeführt, wird ein Hinweis zurückgegeben,
anstatt die Nachricht stillschweigend zu verwerfen.

`/bot-me`, `/bot-version` und `/bot-upgrade` sind ausschließlich für private Chats vorgesehen, erfordern jedoch
keine Zulassungsliste – jeder C2C-Absender kann sie ausführen.

Wenn Ausführungsgenehmigungen für QQ Bot den standardmäßigen Fallback auf denselben Chat verwenden, gelten für
Klicks auf native Genehmigungsschaltflächen dieselben expliziten Befehlszulassungslisten ohne Platzhalter. Um
ausschließlich Zugriff auf Genehmigungen zu gewähren, ohne umfassenderen Zugriff auf Befehle zu ermöglichen, konfigurieren Sie
`channels.qqbot.execApprovals.approvers`. Native Ausführungsgenehmigungen sind standardmäßig
aktiviert.

## Medien und Speicher

- Eingehende, ausgehende und über die Gateway-Bridge übertragene Medien verwenden gemeinsam ein Nutzdaten-Stammverzeichnis unter
  `~/.openclaw/media/qqbot` (wobei `OPENCLAW_HOME` berücksichtigt wird, falls gesetzt), sodass Uploads,
  Downloads und Transcodierungs-Caches in einem einzigen geschützten Verzeichnis verbleiben.
- Die Übermittlung von Rich Media an C2C- und Gruppenziele erfolgt über einen gemeinsamen `sendMedia`-
  Pfad. Lokale Dateien und In-Memory-Puffer mit 5&nbsp;MiB oder mehr verwenden die
  Endpunkte von QQ für segmentierte Uploads; kleinere Nutzdaten sowie Remote-URL-/Base64-Quellen verwenden
  die API für einmalige Uploads.
- Wenn ein Hot-Upgrade das Gateway unterbricht, bevor das Schreiben von
  `openclaw.json` abgeschlossen ist, stellt das Plugin beim nächsten Start die zuletzt bekannten Werte für `appId` / `clientSecret`
  dieses Kontos aus einem internen Snapshot wieder her (ohne
  eine beabsichtigte Konfigurationsänderung zu überschreiben), sodass ein erneutes Scannen des QR-Codes nicht
  erforderlich ist.

## Fehlerbehebung

- **Gateway startet nicht / keine eingehenden Nachrichten:** Überprüfen Sie, ob `appId` und
  `clientSecret` korrekt sind und der Bot auf der QQ Open Platform aktiviert ist.
  Fehlende Anmeldedaten werden als „QQBot not configured (missing appId or
  clientSecret)“ angezeigt.
- **Einrichtung mit `--token-file` wird weiterhin als nicht konfiguriert angezeigt:** `--token-file` legt nur
  das AppSecret fest. `appId` muss weiterhin in der Konfiguration oder über `QQBOT_APP_ID` festgelegt werden.
- **Gebündelte Gruppenantworten kollidieren:** Wenn die Warteschlange eines Peers voll ist, entfernt die Warteschlange für eingehende Nachrichten
  vom Bot verfasste Nachrichten vor menschlichen Nachrichten und fasst
  gebündelte normale Gruppennachrichten (keine Befehle) zu einem zugeordneten Turn zusammen, sodass
  eine Flut von Bot-Nachrichten menschliche Nachrichten nicht verdrängen sollte.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten blockieren, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert und der Provider
  erreichbar ist.

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
