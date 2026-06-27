---
read_when:
    - Fortschrittsaktualisierungen für lange laufende Chat-Antworten konfigurieren
    - Auswahl zwischen Partial-, Block- und Progress-Streaming-Modi
    - Erklärt, wie OpenClaw eine Kanalnachricht aktualisiert, während die Arbeit läuft
    - Fehlerbehebung für Fortschrittsentwürfe, eigenständige Fortschrittsmeldungen oder Finalisierungs-Fallback
summary: 'Fortschrittsentwürfe: eine sichtbare Nachricht zum Arbeitsfortschritt, die aktualisiert wird, während ein Agent ausgeführt wird'
title: Fortschrittsentwürfe
x-i18n:
    generated_at: "2026-06-27T17:25:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe lassen lang laufende Agent-Turns im Chat lebendig wirken, ohne die Unterhaltung in einen Stapel temporärer Statusantworten zu verwandeln.

Wenn Fortschrittsentwürfe aktiviert sind, erstellt OpenClaw erst dann eine sichtbare Work-in-Progress-Nachricht, nachdem der Turn gezeigt hat, dass tatsächlich Arbeit ausgeführt wird, aktualisiert sie, während der Agent liest, plant, Tools aufruft oder auf Genehmigung wartet, und wandelt diesen Entwurf anschließend in die finale Antwort um, wenn der Kanal dies sicher unterstützt.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Verwenden Sie Fortschrittsentwürfe, wenn Sie während toolintensiver Arbeit eine aufgeräumte Statusnachricht und die finale Antwort nach Abschluss des Turns wünschen.

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

Das reicht normalerweise aus. OpenClaw wählt automatisch ein einwortiges Label aus, wartet, bis die Arbeit mindestens fünf Sekunden dauert oder ein zweites Arbeitsereignis ausgibt, fügt bei sinnvoller Arbeit kompakte Fortschrittszeilen hinzu und unterdrückt doppelte eigenständige Fortschrittsmeldungen für diesen Turn.

## Was Benutzer sehen

Ein Fortschrittsentwurf besteht aus zwei Teilen:

| Teil                 | Zweck                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Label                | Eine kurze Start-/Statuszeile wie `Working` oder `Shelling`.                                           |
| Fortschrittszeilen   | Kompakte Run-Updates mit denselben Tool-Symbolen und demselben Detail-Formatierer wie die ausführliche Ausgabe. |

Das Label erscheint, nachdem der Agent sinnvolle Arbeit gestartet hat und entweder fünf Sekunden beschäftigt bleibt oder ein zweites Arbeitsereignis ausgibt. Es ist Teil der fortlaufenden Fortschrittszeilenliste, daher scrollt der Startstatus weg, sobald genügend konkrete Arbeit erscheint. Reine Textantworten zeigen keinen Fortschrittsentwurf. Fortschrittszeilen werden nur hinzugefügt, wenn der Agent nützliche Arbeitsupdates ausgibt, zum Beispiel `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"` oder `✍️ Write: to /tmp/file`.
Standardmäßig verwenden sie denselben kompakten Erklärmodus wie `/verbose`; setzen Sie `agents.defaults.toolProgressDetail: "raw"`, wenn Sie debuggen und auch rohe Befehle/Details anhängen möchten.
Die finale Antwort ersetzt den Entwurf, wenn möglich; andernfalls sendet OpenClaw die finale Antwort normal und bereinigt den Entwurf oder aktualisiert ihn nicht weiter, entsprechend dem Transport des Kanals.

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das sichtbare In-Progress-Verhalten:

| Modus      | Am besten für                         | Was im Chat erscheint                                  |
| ---------- | ------------------------------------- | ------------------------------------------------------ |
| `off`      | Ruhige Kanäle                         | Nur die finale Antwort.                                |
| `partial`  | Beim Erscheinen des Antworttexts zusehen | Ein Entwurf, der mit dem neuesten Antworttext bearbeitet wird. |
| `block`    | Größere Antwortvorschau-Blöcke        | Eine Vorschau, die in größeren Blöcken aktualisiert oder angehängt wird. |
| `progress` | Toolintensive oder lang laufende Turns | Ein Statusentwurf, danach die finale Antwort.          |

Wählen Sie `progress`, wenn Benutzern wichtiger ist, „was gerade passiert“, als den Antworttext Token für Token streamen zu sehen.

Wählen Sie `partial`, wenn die Antwort selbst das Fortschrittssignal ist.

Wählen Sie `block`, wenn Sie Entwurfsvorschau-Updates in größeren Textblöcken wünschen. Bei Discord und Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming, nicht normale Blockzustellung. Verwenden Sie `streaming.block.enabled` oder das Legacy-`blockStreaming`, wenn Sie normale Blockantworten wünschen.

## Labels konfigurieren

Fortschrittslabels befinden sich unter `channels.<channel>.streaming.progress`.

Das Standardlabel ist `auto`, das aus dem integrierten einwortigen Label-Pool von OpenClaw auswählt:

```text
Working
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
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

Blenden Sie das Label aus und zeigen Sie nur Fortschrittszeilen:

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

Fortschrittszeilen sind im Fortschrittsmodus standardmäßig aktiviert. Sie stammen aus echten Run-Ereignissen: Tool-Starts, Item-Updates, Aufgabenplänen, Genehmigungen, Befehlsausgabe, Patch-Zusammenfassungen und ähnlicher Agent-Aktivität.

Tools können auch typisierten Fortschritt ausgeben, während ein einzelner Tool-Aufruf noch läuft. So kann ein langsamer Abruf oder eine langsame Suche den sichtbaren Entwurf aktualisieren, bevor das Tool sein finales Ergebnis zurückgibt. Das Fortschrittsupdate ist ein partielles Tool-Ergebnis mit leerem Modellinhalt und expliziten öffentlichen Kanalmetadaten:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw rendert nur `progress.text` in der Fortschrittsoberfläche des Kanals. Das normale Tool-Ergebnis kommt später weiterhin als `content` und `details` an und ist der einzige Teil, der an das Modell zurückgegeben wird.

Wenn Sie Fortschritt zu einem Tool hinzufügen, verwenden Sie eine kurze, generische Nachricht und verzögern Sie sie, bis der Vorgang lange genug aussteht, um nützlich zu sein:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Dieses Muster bedeutet, dass schnelle Aufrufe keine Fortschrittszeile anzeigen, lange
Aufrufe eine anzeigen, solange sie noch ausstehen, und abgebrochene Aufrufe den
Timer löschen, bevor veralteter Fortschritt erscheinen kann. Fortschrittstext ist
ein öffentlicher UI-Nebenkanal, daher darf er keine Geheimnisse, Rohargumente,
abgerufenen Inhalte, Befehlsausgaben oder Seitentext enthalten.

OpenClaw verwendet denselben Formatter für Fortschrittsentwürfe und `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` ist die Standardeinstellung und hält Entwürfe mit knappen Labels wie
`🛠️ check JS syntax for /tmp/app.js` stabil. `"raw"` hängt, sofern verfügbar,
den zugrunde liegenden Befehl bzw. das Detail an. Das ist beim Debuggen nützlich,
aber im Chat unruhiger.

Zum Beispiel erscheint derselbe Befehl je nach Detailmodus unterschiedlich:

| Modus     | Fortschrittszeile                                            |
| --------- | ------------------------------------------------------------ |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                         |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Fortschrittszeilen werden automatisch verdichtet, um das Umfließen von Chatblasen zu reduzieren, während der Entwurf bearbeitet wird.

OpenClaw kürzt lange Fortschrittszeilen standardmäßig, damit wiederholte
Entwurfsbearbeitungen nicht bei jeder Aktualisierung anders umbrechen. Das
standardmäßige Budget pro Zeile beträgt 120 Zeichen. Fließtext wird an einer
Wortgrenze gekürzt, während lange Details wie Pfade oder Rohbefehle mit einer
Auslassung in der Mitte verkürzt werden, damit das Suffix sichtbar bleibt.

Passen Sie das Budget pro Zeile an:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack kann Fortschrittszeilen als strukturierte Block-Kit-Felder statt als
einzelnen Textkörper darstellen:

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

Die Rich-Darstellung behält denselben Nur-Text-Fallback bei, sodass Kanäle und
Clients, die die reichhaltigere Form nicht unterstützen, weiterhin den kompakten
Fortschrittstext anzeigen können.

Behalten Sie den einzelnen Fortschrittsentwurf bei, blenden Sie aber Werkzeug-
und Aufgabenzeilen aus:

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

Mit `toolProgress: false` unterdrückt OpenClaw für diesen Turn weiterhin die
älteren eigenständigen Werkzeugfortschrittsmeldungen. Der Kanal bleibt bis zur
finalen Antwort visuell ruhig, abgesehen vom Label, falls eines konfiguriert ist.

## Kanalverhalten

Jeder Kanal verwendet den saubersten Transport, den er unterstützt:

| Kanal           | Fortschrittstransport                   | Hinweise                                                                   |
| --------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden, dann bearbeiten. | Finaler Text wird direkt bearbeitet, wenn er in eine sichere Vorschaunachricht passt. |
| Matrix          | Ein Ereignis senden, dann bearbeiten.   | Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene.    |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats. | `streaming.mode: "block"` wird auf Teams-Blockzustellung abgebildet.    |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfsbeitrag. | Thread-Verfügbarkeit beeinflusst, ob natives Streaming verwendet werden kann. |
| Telegram        | Eine Nachricht senden, dann bearbeiten. | Ältere sichtbare Entwürfe können ersetzt werden, damit finale Zeitstempel nützlich bleiben. |
| Mattermost      | Bearbeitbarer Entwurfsbeitrag.          | Werkzeugaktivität wird in denselben Beitrag im Entwurfsstil eingefügt.     |

Kanäle ohne sichere Bearbeitungsunterstützung fallen normalerweise auf
Tippindikatoren oder reine Finalzustellung zurück.

## Finalisierung

Wenn die finale Antwort bereit ist, versucht OpenClaw, den Chat sauber zu halten:

- Wenn der Entwurf sicher zur finalen Antwort werden kann, bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschrittsstreaming verwendet, finalisiert OpenClaw diesen Stream,
  sobald der native Transport den finalen Text akzeptiert.
- Wenn die finale Antwort Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel,
  zu viele Blöcke oder ein fehlgeschlagenes Bearbeiten/Senden enthält, sendet OpenClaw die finale Antwort über
  den normalen Zustellpfad des Kanals.

Der Fallback-Pfad ist beabsichtigt. Es ist besser, eine neue finale Antwort zu
senden, als Text zu verlieren, eine Antwort falsch in einen Thread einzuordnen
oder einen Entwurf mit einer Nutzlast zu überschreiben, die der Kanal nicht
sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die finale Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto oder den Kanal,
der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Einige Gruppen-
oder Zitatantwortpfade können Entwurfsvorschauen für einen Turn deaktivieren,
wenn der Kanal die richtige Nachricht nicht sicher bearbeiten kann.

**Ich sehe das Label, aber keine Werkzeugzeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn es `false` ist, behält OpenClaw
das Verhalten mit einem einzelnen Entwurf bei, blendet aber Werkzeug- und
Aufgabenfortschrittszeilen aus.

**Ich sehe eine neue finale Nachricht statt eines bearbeiteten Entwurfs.**

Das ist ein Sicherheits-Fallback. Er kann bei Medienantworten, langen Antworten,
expliziten Antwortzielen, alten Telegram-Entwürfen, fehlenden Slack-Thread-Zielen,
gelöschten Vorschaunachrichten oder fehlgeschlagener Finalisierung nativer Streams auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsmeldungen.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige
Werkzeugfortschrittsmeldungen, wenn ein Entwurf aktiv ist. Wenn eigenständige
Meldungen weiterhin erscheinen, prüfen Sie, ob der Turn tatsächlich den
Fortschrittsmodus verwendet und nicht `streaming.mode: "off"` oder einen
Kanalpfad, der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream anstelle des generischen
Senden-und-Bearbeiten-Vorschau-Transports. Teams behandelt außerdem `streaming.mode: "block"` als
Teams-Blockzustellung, weil es nicht denselben Entwurfs-Vorschau-Blockmodus hat,
der von Discord und Telegram verwendet wird.

## Verwandte Themen

- [Streaming und Chunking](/de/concepts/streaming)
- [Nachrichten](/de/concepts/messages)
- [Kanalkonfiguration](/de/gateway/config-channels)
- [Discord](/de/channels/discord)
- [Matrix](/de/channels/matrix)
- [Microsoft Teams](/de/channels/msteams)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
