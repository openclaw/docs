---
read_when:
    - Sichtbare Fortschrittsmeldungen für lang laufende Chat-Durchläufe konfigurieren
    - Auswahl zwischen partiellem, Block- und Fortschritts-Streaming-Modus
    - Erläuterung, wie OpenClaw eine Kanalnachricht aktualisiert, während die Arbeit läuft
    - Fehlerbehebung bei Fortschrittsentwürfen, eigenständigen Fortschrittsmeldungen oder dem Fallback bei der Finalisierung
summary: 'Fortschrittsentwürfe: eine sichtbare Nachricht zum aktuellen Arbeitsstand, die aktualisiert wird, während ein Agent läuft'
title: Entwürfe voranbringen
x-i18n:
    generated_at: "2026-05-04T06:41:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe lassen lang laufende Agent-Ausführungen im Chat lebendig wirken, ohne die Unterhaltung in einen Stapel temporärer Statusantworten zu verwandeln.

Wenn Fortschrittsentwürfe aktiviert sind, erstellt OpenClaw erst dann eine sichtbare Work-in-Progress-Nachricht, wenn sich zeigt, dass die Ausführung wirklich arbeitet. OpenClaw aktualisiert sie, während der Agent liest, plant, Tools aufruft oder auf Genehmigung wartet, und wandelt diesen Entwurf anschließend in die endgültige Antwort um, wenn der Channel das sicher unterstützt.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Verwenden Sie Fortschrittsentwürfe, wenn Sie während tool-intensiver Arbeit eine aufgeräumte Statusnachricht und nach Abschluss der Ausführung die endgültige Antwort wünschen.

## Schnellstart

Aktivieren Sie Fortschrittsentwürfe pro Channel mit `streaming.mode: "progress"`:

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

Das reicht normalerweise aus. OpenClaw wählt automatisch ein Ein-Wort-Label, wartet, bis die Arbeit mindestens fünf Sekunden dauert oder ein zweites Arbeitsereignis ausgibt, fügt kompakte Fortschrittszeilen hinzu, während nützliche Arbeit geschieht, und unterdrückt doppelte eigenständige Fortschrittsmeldungen für diese Ausführung.

## Was Benutzer sehen

Ein Fortschrittsentwurf besteht aus zwei Teilen:

| Teil                | Zweck                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Label               | Ein kurzer Titel wie `Thinking...` oder `Shelling...`.                                        |
| Fortschrittszeilen  | Kompakte Laufzeit-Updates mit denselben Tool-Labels und Symbolen wie in der ausführlichen Ausgabe. |

Das Label erscheint, nachdem der Agent sinnvolle Arbeit beginnt und entweder fünf Sekunden lang beschäftigt bleibt oder ein zweites Arbeitsereignis ausgibt. Reine Textantworten zeigen keinen Fortschrittsentwurf. Fortschrittszeilen werden nur hinzugefügt, wenn der Agent nützliche Arbeitsupdates ausgibt, zum Beispiel `🛠️ Exec`, `🔎 Web Search` oder `✍️ Write: to /tmp/file`. Standardmäßig verwenden sie denselben kompakten Erklärmodus wie `/verbose`; setzen Sie beim Debuggen `agents.defaults.toolProgressDetail: "raw"`, wenn Sie zusätzlich Rohbefehle oder Details anhängen möchten.
Die endgültige Antwort ersetzt den Entwurf, wenn möglich; andernfalls sendet OpenClaw die endgültige Antwort normal und bereinigt den Entwurf oder stoppt dessen Aktualisierung entsprechend dem Transport des Channels.

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das sichtbare In-Progress-Verhalten:

| Modus      | Am besten für                              | Was im Chat erscheint                                  |
| ---------- | ------------------------------------------ | ------------------------------------------------------ |
| `off`      | Ruhige Channels                            | Nur die endgültige Antwort.                            |
| `partial`  | Das Erscheinen des Antworttexts beobachten | Ein Entwurf, der mit dem neuesten Antworttext bearbeitet wird. |
| `block`    | Größere Antwortvorschau-Blöcke             | Eine Vorschau, die in größeren Blöcken aktualisiert oder ergänzt wird. |
| `progress` | Tool-intensive oder lang laufende Ausführungen | Ein Statusentwurf, dann die endgültige Antwort.        |

Wählen Sie `progress`, wenn Benutzern „was gerade passiert“ wichtiger ist, als den Antworttext Token für Token zu streamen.

Wählen Sie `partial`, wenn die Antwort selbst das Fortschrittssignal ist.

Wählen Sie `block`, wenn Sie Entwurfs-Vorschauupdates in größeren Textblöcken möchten. Auf Discord und Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming, nicht normale Blockzustellung. Verwenden Sie `streaming.block.enabled` oder das ältere `blockStreaming`, wenn Sie normale Blockantworten möchten.

## Labels konfigurieren

Fortschrittslabels befinden sich unter `channels.<channel>.streaming.progress`.

Das Standardlabel ist `auto`; es wählt aus dem integrierten Label-Pool von OpenClaw mit Einzelwörtern und Auslassungszeichen:

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

Fortschrittszeilen sind im Fortschrittsmodus standardmäßig aktiviert. Sie stammen aus echten Laufereignissen: Tool-Starts, Element-Updates, Aufgabenpläne, Genehmigungen, Befehlsausgaben, Patch-Zusammenfassungen und ähnliche Agent-Aktivität.

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

`"explain"` ist die Standardeinstellung und hält Entwürfe mit knappen Labels wie `🛠️ Exec: check JS syntax for /tmp/app.js` stabil. `"raw"` hängt, sofern verfügbar, den zugrunde liegenden Befehl oder das Detail an. Das ist beim Debuggen nützlich, aber im Chat lauter.

Zum Beispiel erscheint derselbe Befehl je nach Detailmodus unterschiedlich:

| Modus     | Fortschrittszeile                                                   |
| --------- | ------------------------------------------------------------------- |
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

Fortschrittszeilen werden automatisch verdichtet, um das Umfließen von Chat-Blasen zu reduzieren, während der Entwurf bearbeitet wird.

OpenClaw kürzt lange Fortschrittszeilen standardmäßig, damit wiederholte Entwurfsbearbeitungen nicht bei jedem Update anders umbrechen. Das Präfix bleibt lesbar, und lange Details wie Pfade oder Rohbefehle werden mit Auslassungszeichen gekürzt.

Slack kann Fortschrittszeilen als strukturierte Block-Kit-Felder statt als einzelnen Textkörper rendern:

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

Rich-Rendering behält denselben Plain-Text-Fallback bei, sodass Channels und Clients ohne Unterstützung für die reichhaltigere Form weiterhin den kompakten Fortschrittstext anzeigen können.

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

Mit `toolProgress: false` unterdrückt OpenClaw weiterhin die älteren eigenständigen Tool-Fortschrittsmeldungen für diese Ausführung. Der Channel bleibt bis zur endgültigen Antwort visuell ruhig, abgesehen vom Label, falls eines konfiguriert ist.

## Channel-Verhalten

Jeder Channel verwendet den saubersten Transport, den er unterstützt:

| Channel         | Fortschrittstransport                 | Hinweise                                                              |
| --------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden und dann bearbeiten. | Endgültiger Text wird direkt bearbeitet, wenn er in eine sichere Vorschaunachricht passt. |
| Matrix          | Ein Ereignis senden und dann bearbeiten. | Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene. |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats. | `streaming.mode: "block"` wird Teams-Blockzustellung zugeordnet.      |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfsbeitrag. | Thread-Verfügbarkeit beeinflusst, ob natives Streaming verwendet werden kann. |
| Telegram        | Eine Nachricht senden und dann bearbeiten. | Ältere sichtbare Entwürfe können ersetzt werden, damit endgültige Zeitstempel nützlich bleiben. |
| Mattermost      | Bearbeitbarer Entwurfsbeitrag.        | Tool-Aktivität wird in denselben entwurfsartigen Beitrag integriert.  |

Channels ohne sichere Bearbeitungsunterstützung greifen normalerweise auf Tippindikatoren oder reine endgültige Zustellung zurück.

## Finalisierung

Wenn die endgültige Antwort bereit ist, versucht OpenClaw, den Chat sauber zu halten:

- Wenn der Entwurf sicher zur endgültigen Antwort werden kann, bearbeitet OpenClaw ihn direkt.
- Wenn der Channel natives Fortschrittsstreaming verwendet, finalisiert OpenClaw diesen Stream, sobald der native Transport den endgültigen Text akzeptiert.
- Wenn die endgültige Antwort Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele Blöcke oder eine fehlgeschlagene Bearbeitung bzw. Sendung enthält, sendet OpenClaw die endgültige Antwort über den normalen Zustellpfad des Channels.

Der Fallback-Pfad ist absichtlich so gestaltet. Es ist besser, eine frische endgültige Antwort zu senden, als Text zu verlieren, eine Antwort falsch in einen Thread einzuordnen oder einen Entwurf mit einer Nutzlast zu überschreiben, die der Channel nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die endgültige Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto oder den Channel, der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Manche Gruppen- oder Zitatantwortpfade können Entwurfsvorschauen für eine Ausführung deaktivieren, wenn der Channel die richtige Nachricht nicht sicher bearbeiten kann.

**Ich sehe das Label, aber keine Tool-Zeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn es `false` ist, behält OpenClaw das Verhalten mit einem einzelnen Entwurf bei, blendet aber Tool- und Aufgabenfortschrittszeilen aus.

**Ich sehe eine neue endgültige Nachricht statt eines bearbeiteten Entwurfs.**

Das ist ein Sicherheits-Fallback. Er kann bei Medienantworten, langen Antworten, expliziten Antwortzielen, alten Telegram-Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschaunachrichten oder fehlgeschlagener nativer Stream-Finalisierung auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsmeldungen.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Tool-Fortschrittsmeldungen, wenn ein Entwurf aktiv ist. Wenn weiterhin eigenständige Nachrichten erscheinen, prüfen Sie, ob die Ausführung tatsächlich den Fortschrittsmodus verwendet und nicht `streaming.mode: "off"` oder einen Channel-Pfad, der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream statt des generischen Vorschau-Transports aus Senden und Bearbeiten. Teams behandelt außerdem `streaming.mode: "block"` als Teams-Blockzustellung, weil es nicht denselben Entwurfsvorschau-Blockmodus besitzt, den Discord und Telegram verwenden.

## Verwandte Themen

- [Streaming und Chunking](/de/concepts/streaming)
- [Nachrichten](/de/concepts/messages)
- [Channel-Konfiguration](/de/gateway/config-channels)
- [Discord](/de/channels/discord)
- [Matrix](/de/channels/matrix)
- [Microsoft Teams](/de/channels/msteams)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
