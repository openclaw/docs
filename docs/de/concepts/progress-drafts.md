---
read_when:
    - Sichtbare Fortschrittsaktualisierungen für lang laufende Chat-Runden konfigurieren
    - Auswahl zwischen partiellen, blockweisen und Fortschritts-Streaming-Modi
    - Erklärt, wie OpenClaw eine Kanalnachricht aktualisiert, während die Arbeit im Gange ist
    - Fehlerbehebung bei Fortschrittsentwürfen, eigenständigen Fortschrittsmeldungen oder Finalisierungs-Fallback
summary: 'Fortschrittsentwürfe: eine sichtbare Nachricht zum Arbeitsfortschritt, die aktualisiert wird, während ein Agent ausgeführt wird'
title: Entwürfe voranbringen
x-i18n:
    generated_at: "2026-05-06T06:45:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe lassen lange laufende Agent-Durchläufe im Chat lebendig wirken, ohne die Unterhaltung in einen Stapel temporärer Statusantworten zu verwandeln.

Wenn Fortschrittsentwürfe aktiviert sind, erstellt OpenClaw erst dann eine sichtbare Work-in-Progress-Nachricht, wenn der Durchlauf nachweist, dass er echte Arbeit leistet, aktualisiert sie, während der Agent liest, plant, Tools aufruft oder auf Genehmigung wartet, und wandelt diesen Entwurf anschließend in die endgültige Antwort um, wenn der Kanal dies sicher tun kann.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Verwenden Sie Fortschrittsentwürfe, wenn Sie während toolintensiver Arbeit eine einzige aufgeräumte Statusnachricht und nach Abschluss des Durchlaufs die endgültige Antwort wünschen.

## Schnellstart

Aktivieren Sie Fortschrittsentwürfe pro Kanal mit `streaming.mode: "progress"`:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

Das reicht normalerweise aus. OpenClaw wählt automatisch eine Ein-Wort-Beschriftung, wartet, bis die Arbeit mindestens fünf Sekunden dauert oder ein zweites Arbeitsereignis ausgibt, fügt kompakte Fortschrittszeilen hinzu, während sinnvolle Arbeit passiert, und unterdrückt doppelte eigenständige Fortschrittsmeldungen für diesen Durchlauf.

## Was Benutzer sehen

Ein Fortschrittsentwurf besteht aus zwei Teilen:

| Teil                 | Zweck                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------- |
| Beschriftung         | Ein kurzer Titel wie `Thinking...` oder `Shelling...`.                                |
| Fortschrittszeilen   | Kompakte Laufaktualisierungen mit denselben Tool-Beschriftungen und Symbolen wie die ausführliche Ausgabe. |

Die Beschriftung erscheint, nachdem der Agent mit sinnvoller Arbeit beginnt und entweder fünf Sekunden lang beschäftigt bleibt oder ein zweites Arbeitsereignis ausgibt. Reine Textantworten zeigen keinen Fortschrittsentwurf. Fortschrittszeilen werden nur hinzugefügt, wenn der Agent nützliche Arbeitsaktualisierungen ausgibt, zum Beispiel `🛠️ Exec`, `🔎 Web Search` oder `✍️ Write: to /tmp/file`. Standardmäßig verwenden sie denselben kompakten Erklärmodus wie `/verbose`; setzen Sie `agents.defaults.toolProgressDetail: "raw"`, wenn Sie debuggen und auch Rohbefehle/-details angehängt haben möchten.
Die endgültige Antwort ersetzt den Entwurf, wenn möglich; andernfalls sendet OpenClaw die endgültige Antwort normal und bereinigt den Entwurf oder beendet dessen Aktualisierung gemäß dem Transport des Kanals.

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das sichtbare In-Progress-Verhalten:

| Modus      | Am besten geeignet für                | Was im Chat erscheint                                      |
| ---------- | ------------------------------------- | ---------------------------------------------------------- |
| `off`      | Ruhige Kanäle                         | Nur die endgültige Antwort.                                |
| `partial`  | Sichtbares Erscheinen des Antworttexts | Ein Entwurf, der mit dem neuesten Antworttext bearbeitet wird. |
| `block`    | Größere Antwortvorschau-Abschnitte    | Eine Vorschau, die in größeren Abschnitten aktualisiert oder ergänzt wird. |
| `progress` | Toolintensive oder lange laufende Durchläufe | Ein Statusentwurf, danach die endgültige Antwort.          |

Wählen Sie `progress`, wenn Benutzern wichtiger ist, „was passiert“, als dem Antworttext Token für Token beim Streamen zuzusehen.

Wählen Sie `partial`, wenn die Antwort selbst das Fortschrittssignal ist.

Wählen Sie `block`, wenn Sie Entwurfsvorschauen in größeren Textabschnitten aktualisieren möchten. Bei Discord und Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming, nicht normale Block-Zustellung. Verwenden Sie `streaming.block.enabled` oder das ältere `blockStreaming`, wenn Sie normale Blockantworten wünschen.

## Beschriftungen konfigurieren

Fortschrittsbeschriftungen liegen unter `channels.<channel>.streaming.progress`.

Die Standardbeschriftung ist `auto`, wodurch aus OpenClaws integriertem Pool von Ein-Wort-Beschriftungen mit Auslassungspunkten gewählt wird:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
```

Verwenden Sie eine feste Beschriftung:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Verwenden Sie Ihren eigenen automatischen Beschriftungspool:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Blenden Sie die Beschriftung aus und zeigen Sie nur Fortschrittszeilen an:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Fortschrittszeilen steuern

Fortschrittszeilen sind im Fortschrittsmodus standardmäßig aktiviert. Sie stammen aus echten Laufereignissen: Tool-Starts, Elementaktualisierungen, Aufgabenplänen, Genehmigungen, Befehlsausgabe, Patch-Zusammenfassungen und ähnlicher Agent-Aktivität.

OpenClaw verwendet denselben Formatierer für Fortschrittsentwürfe und `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` ist der Standard und hält Entwürfe mit knappen Beschriftungen wie `🛠️ Exec: check JS syntax for /tmp/app.js` stabil. `"raw"` hängt, wenn verfügbar, den zugrunde liegenden Befehl bzw. das Detail an. Das ist beim Debuggen nützlich, aber im Chat lauter.

Zum Beispiel erscheint derselbe Befehl je nach Detailmodus unterschiedlich:

| Modus     | Fortschrittszeile                                                    |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

Begrenzen Sie, wie viele Zeilen sichtbar bleiben:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Fortschrittszeilen werden automatisch kompaktiert, um den Umfluss von Chatblasen zu reduzieren, während der Entwurf bearbeitet wird.

OpenClaw kürzt lange Fortschrittszeilen standardmäßig, damit wiederholte Entwurfsbearbeitungen nicht bei jeder Aktualisierung anders umbrechen. Das Präfix bleibt lesbar, und lange Details wie Pfade oder Rohbefehle werden mit Auslassungspunkten gekürzt.

Slack kann Fortschrittszeilen statt als einzelnen Textkörper als strukturierte Block-Kit-Felder rendern:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

Rich-Rendering behält denselben Klartext-Fallback bei, damit Kanäle und Clients, die die reichhaltigere Form nicht unterstützen, weiterhin den kompakten Fortschrittstext anzeigen können.

Behalten Sie den einzelnen Fortschrittsentwurf bei, blenden Sie aber Tool- und Aufgabenzeilen aus:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Mit `toolProgress: false` unterdrückt OpenClaw weiterhin die älteren eigenständigen Tool-Fortschrittsnachrichten für diesen Durchlauf. Der Kanal bleibt bis zur endgültigen Antwort visuell ruhig, abgesehen von der Beschriftung, falls eine konfiguriert ist.

## Kanalverhalten

Jeder Kanal verwendet den saubersten Transport, den er unterstützt:

| Kanal           | Fortschrittstransport                    | Hinweise                                                              |
| --------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden, dann bearbeiten.  | Endgültiger Text wird direkt bearbeitet, wenn er in eine sichere Vorschaunachricht passt. |
| Matrix          | Ein Ereignis senden, dann bearbeiten.    | Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene. |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats. | `streaming.mode: "block"` wird Teams-Block-Zustellung zugeordnet.     |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfspost. | Thread-Verfügbarkeit beeinflusst, ob natives Streaming verwendet werden kann. |
| Telegram        | Eine Nachricht senden, dann bearbeiten.  | Ältere sichtbare Entwürfe können ersetzt werden, damit endgültige Zeitstempel nützlich bleiben. |
| Mattermost      | Bearbeitbarer Entwurfspost.              | Tool-Aktivität wird in denselben entwurfsartigen Post eingefaltet.    |

Kanäle ohne sichere Bearbeitungsunterstützung fallen normalerweise auf Tippindikatoren oder reine Endzustellung zurück.

## Finalisierung

Wenn die endgültige Antwort bereit ist, versucht OpenClaw, den Chat sauber zu halten:

- Wenn der Entwurf sicher zur endgültigen Antwort werden kann, bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschritts-Streaming verwendet, finalisiert OpenClaw diesen Stream, sobald der native Transport den endgültigen Text akzeptiert.
- Wenn die endgültige Antwort Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele Abschnitte oder einen fehlgeschlagenen Bearbeitungs-/Sendevorgang enthält, sendet OpenClaw die endgültige Antwort über den normalen Zustellungspfad des Kanals.

Der Fallback-Pfad ist beabsichtigt. Es ist besser, eine neue endgültige Antwort zu senden, als Text zu verlieren, eine Antwort falsch in einen Thread einzuordnen oder einen Entwurf mit einer Nutzlast zu überschreiben, die der Kanal nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die endgültige Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto oder den Kanal, der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Einige Gruppen- oder Zitatantwortpfade können Entwurfsvorschauen für einen Durchlauf deaktivieren, wenn der Kanal die richtige Nachricht nicht sicher bearbeiten kann.

**Ich sehe die Beschriftung, aber keine Tool-Zeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn es `false` ist, behält OpenClaw das Verhalten mit einem einzelnen Entwurf bei, blendet aber Tool- und Aufgabenfortschrittszeilen aus.

**Ich sehe eine neue endgültige Nachricht statt eines bearbeiteten Entwurfs.**

Das ist ein Sicherheits-Fallback. Er kann bei Medienantworten, langen Antworten, expliziten Antwortzielen, alten Telegram-Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschaunachrichten oder fehlgeschlagener Finalisierung eines nativen Streams auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsnachrichten.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Tool-Fortschrittsnachrichten, wenn ein Entwurf aktiv ist. Wenn eigenständige Nachrichten weiterhin erscheinen, prüfen Sie, ob der Durchlauf tatsächlich den Fortschrittsmodus verwendet und nicht `streaming.mode: "off"` oder einen Kanalpfad, der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream statt des generischen Vorschautransports mit Senden und Bearbeiten. Teams behandelt außerdem `streaming.mode: "block"` als Teams-Block-Zustellung, weil es nicht denselben Blockmodus für Entwurfsvorschauen hat, der von Discord und Telegram verwendet wird.

## Verwandte Themen

- [Streaming und Chunking](/de/concepts/streaming)
- [Nachrichten](/de/concepts/messages)
- [Kanalkonfiguration](/de/gateway/config-channels)
- [Discord](/de/channels/discord)
- [Matrix](/de/channels/matrix)
- [Microsoft Teams](/de/channels/msteams)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
