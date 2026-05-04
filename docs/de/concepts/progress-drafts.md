---
read_when:
    - Sichtbare Fortschrittsmeldungen für lang laufende Chat-Interaktionen konfigurieren
    - Auswahl zwischen partiellen, blockweisen und fortschrittsbezogenen Streaming-Modi
    - Erklärung, wie OpenClaw eine Kanalnachricht aktualisiert, während die Arbeit läuft
    - Problembehebung bei Fortschrittsentwürfen, eigenständigen Fortschrittsmeldungen oder Finalisierungs-Fallback
summary: 'Fortschrittsentwürfe: eine sichtbare Zwischenstandsnachricht, die aktualisiert wird, während ein Agent ausgeführt wird'
title: Fortschrittsentwürfe
x-i18n:
    generated_at: "2026-05-04T02:23:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe lassen lang laufende Agent-Durchläufe im Chat lebendig wirken, ohne die Unterhaltung in einen Stapel temporärer Statusantworten zu verwandeln.

Wenn Fortschrittsentwürfe aktiviert sind, erstellt OpenClaw erst dann eine sichtbare In-Arbeit-Nachricht, nachdem der Durchlauf zeigt, dass er echte Arbeit erledigt, aktualisiert sie, während der Agent liest, plant, Tools aufruft oder auf Genehmigung wartet, und wandelt diesen Entwurf anschließend in die endgültige Antwort um, wenn der Kanal das sicher unterstützen kann.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Verwenden Sie Fortschrittsentwürfe, wenn Sie während toolintensiver Arbeit eine aufgeräumte Statusnachricht und nach Abschluss des Durchlaufs die endgültige Antwort wünschen.

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

Das reicht normalerweise aus. OpenClaw wählt automatisch ein einwortiges Label, wartet, bis die Arbeit mindestens fünf Sekunden dauert oder ein zweites Arbeitsereignis ausgibt, fügt kompakte Fortschrittszeilen hinzu, während sinnvolle Arbeit geschieht, und unterdrückt doppelte eigenständige Fortschrittsmeldungen für diesen Durchlauf.

## Was Benutzer sehen

Ein Fortschrittsentwurf besteht aus zwei Teilen:

| Teil               | Zweck                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------- |
| Label              | Ein kurzer Titel wie `Thinking...` oder `Shelling...`.                                 |
| Fortschrittszeilen | Kompakte Laufaktualisierungen mit denselben Tool-Labels und Symbolen wie die ausführliche Ausgabe. |

Das Label erscheint, nachdem der Agent sinnvolle Arbeit beginnt und entweder fünf Sekunden lang beschäftigt bleibt oder ein zweites Arbeitsereignis ausgibt. Reine Textantworten zeigen keinen Fortschrittsentwurf. Fortschrittszeilen werden nur hinzugefügt, wenn der Agent nützliche Arbeitsaktualisierungen ausgibt, zum Beispiel `🛠️ Exec`, `🔎 Web Search` oder `✍️ Write: to /tmp/file`.
Standardmäßig verwenden sie denselben kompakten Erklärmodus wie `/verbose`; setzen Sie `agents.defaults.toolProgressDetail: "raw"`, wenn Sie debuggen und zusätzlich rohe Befehle/Details angehängt haben möchten.
Die endgültige Antwort ersetzt den Entwurf, wenn möglich; andernfalls sendet OpenClaw die endgültige Antwort normal und bereinigt den Entwurf oder beendet dessen Aktualisierung gemäß dem Transport des Kanals.

## Modus wählen

`channels.<channel>.streaming.mode` steuert das sichtbare In-Arbeit-Verhalten:

| Modus      | Am besten für                             | Was im Chat erscheint                                  |
| ---------- | ---------------------------------------- | ------------------------------------------------------ |
| `off`      | Ruhige Kanäle                            | Nur die endgültige Antwort.                            |
| `partial`  | Zusehen, wie Antworttext erscheint       | Ein Entwurf, der mit dem neuesten Antworttext bearbeitet wird. |
| `block`    | Größere Antwortvorschau-Abschnitte       | Eine Vorschau, die in größeren Abschnitten aktualisiert oder ergänzt wird. |
| `progress` | Toolintensive oder lang laufende Durchläufe | Ein Statusentwurf, dann die endgültige Antwort.        |

Wählen Sie `progress`, wenn Benutzer mehr daran interessiert sind, „was passiert“, als den Antworttext Token für Token einlaufen zu sehen.

Wählen Sie `partial`, wenn die Antwort selbst das Fortschrittssignal ist.

Wählen Sie `block`, wenn Sie Entwurfs-Vorschauaktualisierungen in größeren Textabschnitten möchten. Auf Discord und Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming, keine normale Blockzustellung. Verwenden Sie `streaming.block.enabled` oder das ältere `blockStreaming`, wenn Sie normale Blockantworten möchten.

## Labels konfigurieren

Fortschrittslabels befinden sich unter `channels.<channel>.streaming.progress`.

Das Standardlabel ist `auto`, wodurch aus dem integrierten Label-Pool von OpenClaw mit einzelnen Wörtern und Auslassungspunkten gewählt wird:

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

Verwenden Sie ein festes Label:

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

Verwenden Sie Ihren eigenen automatischen Label-Pool:

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

Blenden Sie das Label aus und zeigen Sie nur Fortschrittszeilen an:

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

`"explain"` ist die Voreinstellung und hält Entwürfe mit prägnanten Labels wie `🛠️ Exec: check JS syntax for /tmp/app.js` stabil. `"raw"` hängt den zugrunde liegenden Befehl bzw. das Detail an, wenn verfügbar; das ist beim Debuggen hilfreich, aber im Chat lauter.

Zum Beispiel erscheint derselbe Befehl je nach Detailmodus unterschiedlich:

| Modus     | Fortschrittszeile                                                   |
| --------- | ------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                          |
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

Mit `toolProgress: false` unterdrückt OpenClaw weiterhin die älteren eigenständigen Tool-Fortschrittsnachrichten für diesen Durchlauf. Der Kanal bleibt bis zur endgültigen Antwort optisch ruhig, abgesehen vom Label, falls eines konfiguriert ist.

## Kanalverhalten

Jeder Kanal verwendet den saubersten Transport, den er unterstützt:

| Kanal           | Fortschrittstransport                  | Hinweise                                                               |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden, dann bearbeiten. | Endgültiger Text wird direkt bearbeitet, wenn er in eine sichere Vorschaunachricht passt. |
| Matrix          | Ein Ereignis senden, dann bearbeiten.  | Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene. |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats. | `streaming.mode: "block"` wird Teams-Blockzustellung zugeordnet.       |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfsbeitrag. | Thread-Verfügbarkeit beeinflusst, ob natives Streaming verwendet werden kann. |
| Telegram        | Eine Nachricht senden, dann bearbeiten. | Ältere sichtbare Entwürfe können ersetzt werden, damit endgültige Zeitstempel nützlich bleiben. |
| Mattermost      | Bearbeitbarer Entwurfsbeitrag.         | Tool-Aktivität wird in denselben entwurfsartigen Beitrag integriert.   |

Kanäle ohne sichere Bearbeitungsunterstützung fallen normalerweise auf Tippindikatoren oder reine Endzustellung zurück.

## Abschluss

Wenn die endgültige Antwort bereit ist, versucht OpenClaw, den Chat sauber zu halten:

- Wenn der Entwurf sicher zur endgültigen Antwort werden kann, bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschritts-Streaming verwendet, schließt OpenClaw diesen Stream ab, wenn der native Transport den endgültigen Text akzeptiert.
- Wenn die endgültige Antwort Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele Abschnitte oder einen fehlgeschlagenen Bearbeitungs-/Sendevorgang enthält, sendet OpenClaw die endgültige Antwort über den normalen Zustellpfad des Kanals.

Der Fallback-Pfad ist beabsichtigt. Es ist besser, eine neue endgültige Antwort zu senden, als Text zu verlieren, eine Antwort falsch in einen Thread einzuordnen oder einen Entwurf mit einer Nutzlast zu überschreiben, die der Kanal nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die endgültige Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto oder den Kanal, der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Einige Gruppen- oder Zitatantwort-Pfade können Entwurfsvorschauen für einen Durchlauf deaktivieren, wenn der Kanal die richtige Nachricht nicht sicher bearbeiten kann.

**Ich sehe das Label, aber keine Tool-Zeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn es `false` ist, behält OpenClaw das Verhalten mit einem einzelnen Entwurf bei, blendet aber Tool- und Aufgaben-Fortschrittszeilen aus.

**Ich sehe eine neue endgültige Nachricht statt eines bearbeiteten Entwurfs.**

Das ist ein Sicherheits-Fallback. Er kann bei Medienantworten, langen Antworten, expliziten Antwortzielen, alten Telegram-Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschaunachrichten oder fehlgeschlagener nativer Stream-Finalisierung auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsnachrichten.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Tool-Fortschrittsnachrichten, wenn ein Entwurf aktiv ist. Wenn weiterhin eigenständige Nachrichten erscheinen, prüfen Sie, ob der Durchlauf tatsächlich den Fortschrittsmodus verwendet und nicht `streaming.mode: "off"` oder einen Kanalpfad, der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream statt des generischen Senden-und-Bearbeiten-Vorschautransports. Teams behandelt außerdem `streaming.mode: "block"` als Teams-Blockzustellung, weil es nicht denselben Entwurfsvorschau-Blockmodus hat, der von Discord und Telegram verwendet wird.

## Verwandte Themen

- [Streaming und Chunking](/de/concepts/streaming)
- [Nachrichten](/de/concepts/messages)
- [Kanalkonfiguration](/de/gateway/config-channels)
- [Discord](/de/channels/discord)
- [Matrix](/de/channels/matrix)
- [Microsoft Teams](/de/channels/msteams)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
