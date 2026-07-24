---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie müssen die QQ-Bot-Anmeldedaten einrichten
    - Sie möchten Unterstützung für Gruppen- oder private Chats mit QQ Bot
summary: Einrichtung, Konfiguration und Verwendung des QQ-Bots
title: QQ-Bot
x-i18n:
    generated_at: "2026-07-24T04:21:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b185a2b1182471bbec3688b40fb72b671bdf3a2e8351aa6e2f7918f4f5936825
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot verbindet sich über die offizielle QQ Bot API (WebSocket-Gateway) mit OpenClaw.
Private C2C-Chats und `@`-Erwähnungen in Gruppen sind die primären Chattypen und unterstützen umfangreiche
Medien (Bilder, Sprache, Video, Dateien). Nachrichten in Guild-Kanälen werden nur für
Text und Bilder von Remote-URLs unterstützt; Sprache, Video, Datei-Uploads und lokale/Base64-
Bilder sind in Guild-Kanälen nicht verfügbar. Reaktionen und Threads werden
nirgends unterstützt.

Status: offizielles herunterladbares Plugin.

## Installation

```bash
openclaw plugins install @openclaw/qqbot
```

## Einrichtung

1. Rufen Sie die [QQ Open Platform](https://q.qq.com/) auf und scannen Sie den QR-Code mit QQ auf Ihrem
   Smartphone, um sich zu registrieren / anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ Bot zu erstellen.
3. Suchen Sie auf der Einstellungsseite des Bots nach **AppID** und **AppSecret** und kopieren Sie beide.

<Note>
AppSecret wird nicht im Klartext gespeichert. Wenn Sie die Seite verlassen, ohne es zu speichern, müssen Sie ein neues generieren.
</Note>

4. Fügen Sie den Kanal hinzu:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Starten Sie das Gateway neu.

## Dauerhafte Verarbeitung eingehender Nachrichten

Bei Turn-Ereignissen des QQ-Gateways speichert OpenClaw das Rohereignis dauerhaft, bevor die gespeicherte Fortsetzungssequenz des Gateways weitergeschaltet wird. Ausstehende oder erneut ausführbare Turns überstehen einen Gateway-Neustart, bleiben pro Unterhaltung serialisiert und verwenden die Ereignis-ID des Providers, um doppelte Queue-Einträge zu unterdrücken, solange der aktive oder aufbewahrte Abschlussdatensatz vorhanden ist.

Wenn die dauerhafte Aufnahme fehlschlägt, beendet OpenClaw den aktuellen Gateway-Socket, ohne die Sequenz weiterzuschalten. Der Pfad für erneute Verbindung und Fortsetzung kann das noch nicht bestätigte Ereignis dann erneut anfordern. Die Zustellung über die Grenze zwischen Queue und Agent erfolgt weiterhin mindestens einmal, sodass ein Absturz während der Übergabe einen Turn erneut abspielen kann.

Interaktive Einrichtung:

```bash
openclaw channels add
```

Der Assistent bietet außerdem die Bindung per QR-Code als Alternative zur manuellen
Eingabe von AppID/AppSecret an: Scannen Sie den Code mit der Smartphone-App, die mit dem
gewünschten QQ Bot verknüpft ist, um die Bindung abzuschließen. OpenClaw speichert die
zurückgegebenen Anmeldedaten im Konfigurationsbereich des Kontos.

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

Umgebungsvariablen des Standardkontos (nur Konto der obersten Ebene):

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

AppSecret als SecretRef aus einer Umgebungsvariablen:

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
- Veraltete Markierungszeichenfolgen `secretref:...` / `secretref-env:...` werden für
  `clientSecret` abgelehnt; verwenden Sie stattdessen ein strukturiertes SecretRef-Objekt.

### Streaming

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // Block-Streaming: "partial" (Standard) oder "off"
        nativeTransport: true, // offizielle C2C-stream_messages-API von QQ für Direktnachrichten verwenden
      },
    },
  },
}
```

- `streaming.mode: "off"` deaktiviert das Block-Streaming für das Konto.
- `streaming.nativeTransport: true` streamt C2C-Antworten (Direktnachrichten) über die
  offizielle `stream_messages`-API von QQ; Gruppen-/Kanalziele sind davon nicht betroffen.
- Veraltete skalare Werte für `streaming: true|false` und der Schlüssel `streaming.c2cStreamApi`
  werden über `openclaw doctor --fix` in diese Struktur migriert.
- `/bot-streaming on|off` schaltet dieselbe Konfiguration über eine Direktnachricht um.

### Zugriffsrichtlinie

- `allowFrom` / `groupAllowFrom` steuern, wer in C2C-/
  Gruppenkontexten mit dem Bot chatten darf. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  steuern den Durchsetzungsmodus. `dmPolicy` verwendet standardmäßig `allowlist`, sobald
  `allowFrom` einen konkreten Eintrag (keinen Platzhalter) enthält, andernfalls `open`.
  `groupPolicy` verwendet standardmäßig `allowlist`, sobald entweder `groupAllowFrom` oder
  `allowFrom` einen konkreten Eintrag enthält, andernfalls `open`.
- Slash-Befehle vom Typ „Auth: Zulassungsliste“ erfordern unabhängig von
  `dmPolicy` / `groupPolicy` einen expliziten Eintrag ohne Platzhalter in
  `allowFrom` (oder `groupAllowFrom` bei Aufrufen in Gruppen) – siehe [Slash-Befehle](#slash-commands).

### Einrichtung mehrerer Konten

Führen Sie mehrere QQ Bots in einer einzelnen OpenClaw-Instanz aus:

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

Jedes Konto verfügt über eine isolierte WebSocket-Verbindung, einen API-Client und einen
Token-Cache, die anhand von `appId` zugeordnet werden. Protokollzeilen werden mit der ID des zugehörigen Kontos gekennzeichnet, damit
Diagnosen getrennt bleiben, wenn mehrere Bots unter einem Gateway ausgeführt werden.

Fügen Sie über die CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Gruppenchats

Die Gruppenunterstützung verwendet OpenIDs von QQ-Gruppen, keine Anzeigenamen. Fügen Sie den Bot einer
Gruppe hinzu und erwähnen Sie ihn anschließend oder konfigurieren Sie die Gruppe für den Betrieb ohne Erwähnung.

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

`groups["*"]` legt Standardwerte für jede Gruppe fest; ein konkreter Eintrag für `groups.GROUP_OPENID`
überschreibt diese Standardwerte für eine Gruppe. Gruppeneinstellungen:

| Feld                  | Standardwert     | Beschreibung                                                                                       |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Erfordert eine `@`-Erwähnung, bevor der Bot antwortet.                                              |
| `commandLevel`        | `all`            | Legt fest, welche integrierten Slash-Befehle in der Gruppe ausgeführt werden können (siehe unten).  |
| `ignoreOtherMentions` | `false`          | Verwirft Nachrichten, die eine andere Person, aber nicht den Bot erwähnen.                          |
| `historyLimit`        | `50`             | Kürzlich gesendete Nachrichten ohne Erwähnung, die als Kontext für den nächsten Turn mit Erwähnung gespeichert werden. `0` deaktiviert den Verlauf. |
| `tools`               | —                | Erlaubt/verweigert Tools für die gesamte Gruppe.                                                   |
| `toolsBySender`       | —                | Absenderspezifische Tool-Überschreibungen; siehe [Gruppen](/de/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | OpenID-Präfix    | Benutzerfreundliche Bezeichnung für Protokolle und den Gruppenkontext.                              |
| `prompt`              | integrierter Standardwert | Verhaltens-Prompt pro Gruppe, der an den Agentenkontext angehängt wird.                   |

`commandLevel` akzeptiert:

| Stufe    | Verhalten                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Vorhandene integrierte Befehle bleiben verfügbar. Einige bleiben in Menüs ausgeblendet, autorisierte Benutzer können sie in der Gruppe jedoch weiterhin ausführen. |
| `safety` | `/help`, `/btw`, `/stop` bleiben in der Gruppe sichtbar; sensible Befehle (`/config`, `/tools`, `/bash` usw.) müssen im privaten Chat ausgeführt werden. |
| `strict` | Nur die für einen strikt kontrollierten Betrieb benötigten Steuerelemente der Gruppensitzung sind zulässig. `/stop` funktioniert weiterhin, sodass ein autorisierter Absender einen aktiven Lauf unterbrechen kann. |

Alte QQBot-Einträge für `toolPolicy` werden nicht mehr unterstützt. Führen Sie `openclaw doctor --fix` aus, um sie nach `tools` zu migrieren.

Die Aktivierungsmodi sind `mention` und `always`. `requireMention: true` wird
`mention` zugeordnet; `requireMention: false` wird `always` zugeordnet. Eine Aktivierungsüberschreibung
auf Sitzungsebene hat, sofern vorhanden, Vorrang vor der Konfiguration.

Die Queue für eingehende Nachrichten wird pro Kommunikationspartner geführt. Kommunikationspartner in Gruppen erhalten eine größere Queue-Kapazität (50 statt 20
für direkte Kommunikationspartner). Bei voller Queue werden vom Bot verfasste Nachrichten vor menschlichen Nachrichten entfernt,
und Folgen normaler Gruppennachrichten werden zu einem einzigen Turn mit Absenderzuordnung zusammengeführt. Slash-
Befehle werden einzeln und unabhängig von Zusammenführungsbatches ausgeführt.

### Sprache (STT / TTS)

STT und TTS unterstützen eine zweistufige Konfiguration mit priorisiertem Fallback:

| Einstellung | Plugin-spezifisch                                       | Framework-Fallback                                |
| ----------- | ------------------------------------------------------- | ------------------------------------------------- |
| STT         | `channels.qqbot.stt`                                     | erster audiofähiger Eintrag in `tools.media.models[]` |
| TTS         | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `tts`                                            |

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

Legen Sie bei einem der beiden `enabled: false` fest, um ihn zu deaktivieren. TTS-Überschreibungen auf Kontoebene verwenden
dieselbe Struktur wie `tts` und werden tief mit der TTS-Konfiguration auf Kanal-/globaler Ebene zusammengeführt.

STT-Anfragen überschreiten standardmäßig nach 60 Sekunden das Zeitlimit. Plugin-spezifisches STT verwendet die
ausgewählte Überschreibung `models.providers.<id>.timeoutSeconds`. Audio-STT des Frameworks
verwendet `timeoutSeconds` des ausgewählten audiofähigen Eintrags in `tools.media.models[]` und anschließend die ausgewählte Provider-Überschreibung.

Eingehende QQ-Sprachanhänge werden Agenten als Audio-Medienmetadaten bereitgestellt,
während rohe Sprachdateien aus dem generischen `MediaPaths` herausgehalten werden. `[[audio_as_voice]]`
in einer Klartextantwort synthetisiert TTS und sendet eine native QQ-Sprachnachricht, wenn
TTS konfiguriert ist.

Das Upload-/Transkodierungsverhalten für ausgehende Audiodaten kann ebenfalls über
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

<Note>
Jeder Bot verfügt über einen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID kann **nicht** zum Senden von Nachrichten über Bot B verwendet werden.
</Note>

## Slash-Befehle

Integrierte Befehle, die vor der KI-Queue abgefangen werden:

| Befehl              | Authentifizierung      | Geltungsbereich        | Beschreibung                                                                    |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | beliebig          | Latenztest                                                                   |
| `/bot-help`          | —         | beliebig          | Alle Befehle auflisten                                                              |
| `/bot-me`            | —         | nur privat | QQ-Benutzer-ID (openid) des Absenders für die Einrichtung von `allowFrom` / `groupAllowFrom` anzeigen |
| `/bot-version`       | —         | nur privat | Version des OpenClaw-Frameworks und des Plugins anzeigen                         |
| `/bot-upgrade`       | —         | nur privat | Link zum QQBot-Upgrade-Leitfaden anzeigen                                              |
| `/bot-approve`       | Positivliste | nur privat | Konfiguration der Genehmigung zur Befehlsausführung verwalten (ein / aus / immer / zurücksetzen / Status)  |
| `/bot-logs`          | Positivliste | nur privat | Aktuelle Gateway-Protokolle als Datei exportieren                                           |
| `/bot-clear-storage` | Positivliste | nur privat | Zwischengespeicherte Downloads im QQBot-Medienverzeichnis löschen                        |
| `/bot-streaming`     | Positivliste | nur privat | Streaming-Antworten für C2C umschalten                                                   |
| `/bot-group-allways` | Positivliste | nur privat | Standardmäßigen Gruppenaktivierungsmodus umschalten (Erwähnung erforderlich oder immer aktiv)      |

Hängen Sie `?` an einen beliebigen Befehl an, um Hilfe zur Verwendung zu erhalten (zum Beispiel `/bot-upgrade ?`).

Befehle mit „Authentifizierung: Positivliste“ setzen zusätzlich voraus, dass die openid des Absenders in einer
expliziten `allowFrom`-Liste ohne Platzhalter enthalten ist (`groupAllowFrom` hat bei
in Gruppen ausgeführten Befehlen Vorrang, mit Rückgriff auf `allowFrom`). Der Platzhalter
`allowFrom: ["*"]` erlaubt Chats, jedoch nicht diese Befehle. Wird einer dieser Befehle
außerhalb eines privaten Chats oder ohne Autorisierung ausgeführt, wird ein Hinweis zurückgegeben, anstatt
die Nachricht stillschweigend zu verwerfen.

`/bot-me`, `/bot-version` und `/bot-upgrade` sind ausschließlich in privaten Chats verfügbar, erfordern jedoch
keine Positivliste – jeder C2C-Absender kann sie ausführen.

Wenn die Ausführungsgenehmigungen des QQ Bot den standardmäßigen Rückgriff auf denselben Chat verwenden, gelten für Klicks auf native
Genehmigungsschaltflächen dieselben expliziten Befehlspositivlisten ohne Platzhalter. Um
ausschließlich Genehmigungszugriff ohne umfassenderen Befehlszugriff zu gewähren, konfigurieren Sie
`channels.qqbot.execApprovals.approvers`. Native Ausführungsgenehmigungen sind standardmäßig
aktiviert.

## Medien und Speicher

- Eingehende, ausgehende und über die Gateway-Bridge übertragene Medien verwenden gemeinsam ein Nutzdaten-Stammverzeichnis unter
  `~/.openclaw/media/qqbot` (wobei `OPENCLAW_HOME` berücksichtigt wird, falls gesetzt), sodass Uploads,
  Downloads und Transcodierungs-Caches in einem einzigen geschützten Verzeichnis verbleiben.
- Die Übermittlung von Rich Media an C2C- und Gruppenziele erfolgt über einen gemeinsamen `sendMedia`-
  Pfad. Lokale Dateien und In-Memory-Puffer mit mindestens 5&nbsp;MiB verwenden die
  Endpunkte von QQ für segmentierte Uploads; kleinere Nutzdaten sowie Remote-URL-/Base64-Quellen verwenden
  die API für Uploads in einem Schritt.
- Falls ein Hot-Upgrade das Gateway unterbricht, bevor es das Schreiben von
  `openclaw.json` abgeschlossen hat, stellt das Plugin beim nächsten Start die zuletzt bekannten Werte für `appId` / `clientSecret`
  dieses Kontos aus einem internen Snapshot wieder her (ohne jemals
  eine beabsichtigte Konfigurationsänderung zu überschreiben), sodass ein erneutes Scannen des QR-Codes nicht
  erforderlich ist.

## Fehlerbehebung

- **Gateway startet nicht / keine eingehenden Nachrichten:** Überprüfen Sie, ob `appId` und
  `clientSecret` korrekt sind und der Bot auf der QQ Open Platform aktiviert ist.
  Fehlende Anmeldedaten werden als „QQBot nicht konfiguriert (appId oder
  clientSecret fehlt)“ angezeigt.
- **Die Einrichtung mit `--token-file` wird weiterhin als nicht konfiguriert angezeigt:** `--token-file` legt nur
  das AppSecret fest. `appId` muss weiterhin in der Konfiguration oder in `QQBOT_APP_ID` festgelegt werden.
- **Antworten in Gruppen bei hohem Nachrichtenaufkommen kollidieren:** Wenn die Warteschlange eines Peers voll ist, entfernt die Warteschlange für eingehende Nachrichten
  vom Bot verfasste Nachrichten vor menschlichen Nachrichten und führt
  Serien normaler Gruppennachrichten (keine Befehle) zu einem zugeordneten Turn zusammen, sodass
  eine Flut von Bot-Nachrichten menschliche Nachrichten nicht verdrängen sollte.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten blockieren, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert und der Provider
  erreichbar ist.

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
