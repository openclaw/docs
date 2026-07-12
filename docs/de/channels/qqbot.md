---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen die Zugangsdaten für den QQ Bot einrichten
    - Sie möchten Unterstützung für Gruppenchats oder private Chats mit QQ Bot
summary: Einrichtung, Konfiguration und Verwendung des QQ Bot
title: QQ-Bot
x-i18n:
    generated_at: "2026-07-12T01:26:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw.
Private C2C-Chats und `@`-Erwähnungen in Gruppen sind die primären Chattypen und unterstützen
Rich Media (Bilder, Sprachnachrichten, Videos und Dateien). Nachrichten in Guild-Kanälen unterstützen
nur Text und Bilder über Remote-URLs; Sprachnachrichten, Videos, Datei-Uploads und lokale/Base64-
Bilder sind in Guild-Kanälen nicht verfügbar. Reaktionen und Threads werden nirgends unterstützt.

Status: offizielles herunterladbares Plugin.

## Installation

```bash
openclaw plugins install @openclaw/qqbot
```

## Einrichtung

1. Rufen Sie die [QQ Open Platform](https://q.qq.com/) auf und scannen Sie den QR-Code mit QQ
   auf Ihrem Mobiltelefon, um sich zu registrieren bzw. anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie auf der Einstellungsseite des Bots nach **AppID** und **AppSecret** und kopieren Sie beide Werte.

<Note>
AppSecret wird nicht im Klartext gespeichert. Wenn Sie die Seite verlassen, ohne es zu speichern, müssen Sie ein neues generieren.
</Note>

4. Fügen Sie den Kanal hinzu:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Starten Sie den Gateway neu.

Interaktive Einrichtung:

```bash
openclaw channels add
```

Der Assistent bietet alternativ zur manuellen Eingabe von AppID/AppSecret auch eine
QR-Code-Verknüpfung an: Scannen Sie den Code mit der Mobiltelefon-App, die mit dem
gewünschten QQ Bot verknüpft ist, um die Verknüpfung abzuschließen. OpenClaw speichert
die zurückgegebenen Anmeldedaten im Konfigurationsbereich des Kontos.

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

Umgebungsvariablen für das Standardkonto (nur Konto auf oberster Ebene):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

Dateibasiertes AppSecret:

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

- `openclaw channels add --channel qqbot --token-file ...` setzt nur das AppSecret;
  `appId` muss bereits in der Konfiguration oder in `QQBOT_APP_ID` festgelegt sein.
- `clientSecret` akzeptiert eine Klartextzeichenfolge, einen Dateipfad (`clientSecretFile`)
  oder ein strukturiertes SecretRef-Objekt.
- Veraltete Markierungszeichenfolgen vom Typ `secretref:...` / `secretref-env:...` werden für
  `clientSecret` abgelehnt; verwenden Sie stattdessen ein strukturiertes SecretRef-Objekt.

### Zugriffsrichtlinie

- `allowFrom` / `groupAllowFrom` bestimmen, wer in C2C- bzw. Gruppenkontexten mit
  dem Bot chatten darf. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  steuern den Durchsetzungsmodus. `dmPolicy` verwendet standardmäßig `allowlist`, sobald
  `allowFrom` einen konkreten Eintrag ohne Platzhalter enthält, andernfalls `open`.
  `groupPolicy` verwendet standardmäßig `allowlist`, sobald entweder `groupAllowFrom`
  oder `allowFrom` einen konkreten Eintrag enthält, andernfalls `open`.
- Slash-Befehle mit „Authentifizierung: Zulassungsliste“ erfordern unabhängig von
  `dmPolicy` / `groupPolicy` einen expliziten Eintrag ohne Platzhalter in `allowFrom`
  (bzw. in `groupAllowFrom` bei Aufrufen aus Gruppen) – siehe [Slash-Befehle](#slash-commands).

### Einrichtung mehrerer Konten

Führen Sie mehrere QQ-Bots in einer einzigen OpenClaw-Instanz aus:

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

Jedes Konto besitzt eine isolierte WebSocket-Verbindung, einen eigenen API-Client und
einen eigenen Token-Cache, jeweils nach `appId` indiziert. Protokollzeilen werden mit
der ID des zugehörigen Kontos gekennzeichnet, damit die Diagnose beim Betrieb mehrerer
Bots über einen Gateway getrennt bleibt.

Fügen Sie über die CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Gruppenchats

Die Gruppenunterstützung verwendet QQ-Gruppen-OpenIDs, nicht die Anzeigenamen. Fügen
Sie den Bot einer Gruppe hinzu und erwähnen Sie ihn anschließend oder konfigurieren Sie
die Gruppe für den Betrieb ohne Erwähnung.

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

`groups["*"]` legt Standardwerte für alle Gruppen fest; ein konkreter Eintrag
`groups.GROUP_OPENID` überschreibt diese Standardwerte für eine einzelne Gruppe.
Gruppeneinstellungen:

| Feld                  | Standardwert       | Beschreibung                                                                                       |
| --------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`             | Erfordert eine `@`-Erwähnung, bevor der Bot antwortet.                                             |
| `commandLevel`        | `all`              | Legt fest, welche integrierten Slash-Befehle in der Gruppe ausgeführt werden können (siehe unten).  |
| `ignoreOtherMentions` | `false`            | Verwirft Nachrichten, in denen eine andere Person, aber nicht der Bot erwähnt wird.                 |
| `historyLimit`        | `50`               | Behält aktuelle Nachrichten ohne Erwähnung als Kontext für den nächsten Turn mit Erwähnung bei. `0` deaktiviert den Verlauf. |
| `tools`               | —                  | Erlaubt oder verweigert Tools für die gesamte Gruppe.                                              |
| `toolsBySender`       | —                  | Senderspezifische Tool-Überschreibungen; siehe [Gruppen](/de/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | OpenID-Präfix      | Benutzerfreundliche Bezeichnung für Protokolle und Gruppenkontext.                                 |
| `prompt`              | integrierter Standardwert | Gruppenspezifischer Verhaltens-Prompt, der an den Agentenkontext angehängt wird.             |

`commandLevel` akzeptiert:

| Stufe    | Verhalten                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Vorhandene integrierte Befehle bleiben verfügbar. Einige bleiben in Menüs ausgeblendet, autorisierte Benutzer können sie jedoch weiterhin in der Gruppe ausführen. |
| `safety` | `/help`, `/btw`, `/stop` bleiben in der Gruppe sichtbar; sensible Befehle (`/config`, `/tools`, `/bash` usw.) müssen im privaten Chat ausgeführt werden. |
| `strict` | Nur die für den strikten Betrieb erforderlichen Steuerbefehle der Gruppensitzung sind zulässig. `/stop` funktioniert weiterhin, damit ein autorisierter Absender eine aktive Ausführung unterbrechen kann. |

Alte QQBot-Einträge für `toolPolicy` werden nicht mehr verwendet. Führen Sie `openclaw doctor --fix` aus, um sie zu `tools` zu migrieren.

Die Aktivierungsmodi sind `mention` und `always`. `requireMention: true` entspricht
`mention`; `requireMention: false` entspricht `always`. Eine Aktivierungsüberschreibung
auf Sitzungsebene hat, sofern vorhanden, Vorrang vor der Konfiguration.

Die Eingangswarteschlange wird pro Kommunikationspartner verwaltet. Gruppenpartner
erhalten eine größere Warteschlangenkapazität (50 gegenüber 20 bei direkten Partnern).
Bei voller Warteschlange werden vom Bot verfasste Nachrichten vor menschlichen Nachrichten
entfernt, und Serien normaler Gruppennachrichten werden zu einem zugeordneten Turn
zusammengeführt. Slash-Befehle werden unabhängig von zusammengeführten Stapeln einzeln
nacheinander ausgeführt.

### Sprache (STT / TTS)

STT und TTS unterstützen eine zweistufige Konfiguration mit priorisiertem Rückgriff:

| Einstellung | Plugin-spezifisch                                         | Framework-Rückgriff            |
| ----------- | --------------------------------------------------------- | ------------------------------ |
| STT         | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]`  |
| TTS         | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`                 |

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

Setzen Sie jeweils `enabled: false`, um die Funktion zu deaktivieren. TTS-Überschreibungen
auf Kontoebene verwenden dieselbe Struktur wie `messages.tts` und werden rekursiv mit der
kanalweiten/globalen TTS-Konfiguration zusammengeführt, wobei sie deren Werte überschreiben.

STT-Anfragen haben standardmäßig nach 60 Sekunden ein Zeitlimit. Plugin-spezifisches STT
verwendet die ausgewählte Überschreibung `models.providers.<id>.timeoutSeconds`. Das
Audio-STT des Frameworks verwendet zunächst `tools.media.audio.models[0].timeoutSeconds`,
dann `tools.media.audio.timeoutSeconds` und anschließend die Überschreibung des ausgewählten
Providers.

Eingehende QQ-Sprachanhänge werden Agenten als Metadaten für Audiomedien bereitgestellt,
während die unverarbeiteten Sprachdateien aus den generischen `MediaPaths` herausgehalten
werden. `[[audio_as_voice]]` in einer Klartextantwort synthetisiert TTS und sendet eine
native QQ-Sprachnachricht, wenn TTS konfiguriert ist.

Das Verhalten beim Hochladen und Transkodieren ausgehender Audiodaten kann außerdem mit
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung        |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C) |
| `qqbot:group:GROUP_OPENID` | Gruppenchat         |
| `qqbot:channel:CHANNEL_ID` | Guild-Kanal         |

<Note>
Jeder Bot verfügt über einen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID kann **nicht** zum Senden von Nachrichten über Bot B verwendet werden.
</Note>

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl               | Authentifizierung | Geltungsbereich | Beschreibung                                                                  |
| -------------------- | ----------------- | --------------- | ----------------------------------------------------------------------------- |
| `/bot-ping`          | —                 | überall         | Latenztest                                                                    |
| `/bot-help`          | —                 | überall         | Alle Befehle auflisten                                                        |
| `/bot-me`            | —                 | nur privat      | QQ-Benutzer-ID (OpenID) des Absenders für die Einrichtung von `allowFrom` / `groupAllowFrom` anzeigen |
| `/bot-version`       | —                 | nur privat      | Version des OpenClaw-Frameworks und des Plugins anzeigen                      |
| `/bot-upgrade`       | —                 | nur privat      | Link zur QQBot-Aktualisierungsanleitung anzeigen                              |
| `/bot-approve`       | Zulassungsliste   | nur privat      | Genehmigungskonfiguration für die Befehlsausführung verwalten (ein / aus / immer / zurücksetzen / Status) |
| `/bot-logs`          | Zulassungsliste   | nur privat      | Aktuelle Gateway-Protokolle als Datei exportieren                             |
| `/bot-clear-storage` | Zulassungsliste   | nur privat      | Zwischengespeicherte Downloads im QQBot-Medienverzeichnis löschen             |
| `/bot-streaming`     | Zulassungsliste   | nur privat      | Streaming-Antworten für C2C umschalten                                        |
| `/bot-group-allways` | Zulassungsliste   | nur privat      | Standardmäßigen Gruppenaktivierungsmodus umschalten (Erwähnung erforderlich oder immer aktiv) |

Hängen Sie für Verwendungshinweise `?` an einen beliebigen Befehl an (zum Beispiel `/bot-upgrade ?`).

Befehle mit „Authentifizierung: Zulassungsliste“ erfordern zusätzlich die OpenID des
Absenders in einer expliziten `allowFrom`-Liste ohne Platzhalter (`groupAllowFrom` hat
bei aus Gruppen ausgeführten Befehlen Vorrang; andernfalls wird auf `allowFrom`
zurückgegriffen). Der Platzhalter `allowFrom: ["*"]` erlaubt Chats, jedoch nicht diese
Befehle. Wird einer dieser Befehle außerhalb eines privaten Chats oder ohne Autorisierung
ausgeführt, wird ein Hinweis zurückgegeben, anstatt die Nachricht stillschweigend zu
verwerfen.

`/bot-me`, `/bot-version` und `/bot-upgrade` sind ausschließlich für private Chats vorgesehen, erfordern jedoch
keine Zulassungsliste – jeder C2C-Absender kann sie ausführen.

Wenn Ausführungsgenehmigungen für QQ Bot den standardmäßigen Rückgriff auf denselben Chat verwenden, unterliegen Klicks
auf native Genehmigungsschaltflächen derselben expliziten Befehlszulassungsliste ohne Platzhalter. Um
ausschließlich Zugriff auf Genehmigungen ohne weitergehenden Befehlszugriff zu gewähren, konfigurieren Sie
`channels.qqbot.execApprovals.approvers`. Native Ausführungsgenehmigungen sind standardmäßig
aktiviert.

## Medien und Speicher

- Eingehende und ausgehende Medien sowie Medien der Gateway-Bridge verwenden gemeinsam ein Nutzdaten-Stammverzeichnis unter
  `~/.openclaw/media/qqbot` (`OPENCLAW_HOME` wird berücksichtigt, wenn es gesetzt ist), sodass Uploads,
  Downloads und Transcodierungs-Caches in einem einzigen geschützten Verzeichnis verbleiben.
- Die Übermittlung von Rich Media an C2C- und Gruppenziele erfolgt über einen gemeinsamen `sendMedia`-Pfad.
  Lokale Dateien und speicherinterne Puffer ab 5&nbsp;MiB verwenden die
  Endpunkte von QQ für segmentierte Uploads; kleinere Nutzdaten sowie Remote-URL-/Base64-Quellen verwenden
  die API für einmalige Uploads.
- Wenn ein Hot-Upgrade das Gateway unterbricht, bevor das Schreiben von
  `openclaw.json` abgeschlossen ist, stellt das Plugin beim nächsten Start die zuletzt bekannten Werte für `appId` /
  `clientSecret` dieses Kontos aus einem internen Snapshot wieder her (ohne
  jemals eine beabsichtigte Konfigurationsänderung zu überschreiben), sodass der QR-Code nicht erneut
  gescannt werden muss.

## Fehlerbehebung

- **Gateway startet nicht / keine eingehenden Nachrichten:** Überprüfen Sie, ob `appId` und
  `clientSecret` korrekt sind und der Bot auf der QQ Open Platform aktiviert ist.
  Fehlende Anmeldedaten werden als „QQBot nicht konfiguriert (appId oder
  clientSecret fehlt)“ angezeigt.
- **Einrichtung mit `--token-file` wird weiterhin als nicht konfiguriert angezeigt:** `--token-file` legt nur
  das AppSecret fest. `appId` muss weiterhin in der Konfiguration oder über `QQBOT_APP_ID` festgelegt werden.
- **Antwortserien in Gruppen kollidieren:** Wenn sich die Warteschlange eines Kommunikationspartners füllt, entfernt die Warteschlange für eingehende Nachrichten
  von Bots verfasste Nachrichten vor menschlichen Nachrichten und führt
  Serien normaler Gruppennachrichten (keine Befehle) zu einem einzelnen, zugeordneten Durchlauf zusammen, sodass
  eine Flut von Bot-Nachrichten menschliche Nachrichten nicht verdrängen sollte.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten blockieren, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprachnachricht wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert und der Provider
  erreichbar ist.

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
