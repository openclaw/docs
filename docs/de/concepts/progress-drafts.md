---
read_when:
    - Sichtbare Fortschrittsaktualisierungen für lang laufende Chat-Runden konfigurieren
    - Auswahl zwischen partiellem Streaming, Block-Streaming und Fortschritts-Streaming
    - Erläutern, wie OpenClaw eine Kanalnachricht aktualisiert, während die Arbeit läuft
    - Fehlerbehebung bei Fortschrittsentwürfen, eigenständigen Fortschrittsmeldungen oder dem Ausweichmechanismus bei der Finalisierung
summary: 'Fortschrittsentwürfe: eine sichtbare Nachricht zum laufenden Arbeitsstand, die aktualisiert wird, während ein Agent ausgeführt wird'
title: Entwürfe in Bearbeitung
x-i18n:
    generated_at: "2026-05-10T19:33:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d84027a412a2c62ea9a5698d015c7aeb8a7f27d9db79112bb2c1c10f97ebd88
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe lassen lang laufende Agent-Durchläufe im Chat lebendig wirken, ohne die Unterhaltung in einen Stapel temporärer Statusantworten zu verwandeln.

Wenn Fortschrittsentwürfe aktiviert sind, erstellt OpenClaw erst dann eine sichtbare Work-in-Progress-Nachricht, wenn der Durchlauf nachweislich echte Arbeit leistet, aktualisiert sie, während der Agent liest, plant, Tools aufruft oder auf Genehmigung wartet, und wandelt diesen Entwurf anschließend in die finale Antwort um, sofern der Kanal dies sicher tun kann.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Verwenden Sie Fortschrittsentwürfe, wenn Sie bei tool-intensiver Arbeit eine aufgeräumte Statusnachricht und nach Abschluss des Durchlaufs die finale Antwort wünschen.

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

Das reicht in der Regel aus. OpenClaw wählt automatisch ein Ein-Wort-Label, wartet, bis die Arbeit mindestens fünf Sekunden dauert oder ein zweites Arbeitsereignis ausgibt, fügt bei nützlicher Arbeit kompakte Fortschrittszeilen hinzu und unterdrückt doppelte eigenständige Fortschrittsmeldungen für diesen Durchlauf.

## Was Benutzer sehen

Ein Fortschrittsentwurf besteht aus zwei Teilen:

| Teil              | Zweck                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| Label             | Eine kurze Start-/Statuszeile wie `Thinking...` oder `Shelling...`.                   |
| Fortschrittszeilen | Kompakte Laufzeit-Updates mit denselben Tool-Symbolen und demselben Detailformatierer wie die ausführliche Ausgabe. |

Das Label erscheint, nachdem der Agent mit sinnvoller Arbeit begonnen hat und entweder fünf Sekunden beschäftigt bleibt oder ein zweites Arbeitsereignis ausgibt. Es ist Teil der fortlaufenden Fortschrittszeilenliste, sodass der Startstatus aus dem sichtbaren Bereich verschwindet, sobald genug konkrete Arbeit erscheint. Reine Textantworten zeigen keinen Fortschrittsentwurf. Fortschrittszeilen werden nur hinzugefügt, wenn der Agent nützliche Arbeitsupdates ausgibt, zum Beispiel `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"` oder `✍️ Write: to /tmp/file`.
Standardmäßig verwenden sie denselben kompakten Erklärmodus wie `/verbose`; setzen Sie `agents.defaults.toolProgressDetail: "raw"`, wenn Sie debuggen und zusätzlich rohe Befehle/Details angehängt haben möchten.
Die finale Antwort ersetzt den Entwurf, wenn möglich; andernfalls sendet OpenClaw die finale Antwort normal und räumt den Entwurf auf oder stoppt dessen Aktualisierung gemäß dem Transport des Kanals.

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das sichtbare In-Progress-Verhalten:

| Modus      | Am besten geeignet für           | Was im Chat erscheint                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Ruhige Kanäle                    | Nur die finale Antwort.                           |
| `partial`  | Antworttext beim Erscheinen beobachten | Ein Entwurf, der mit dem neuesten Antworttext bearbeitet wird. |
| `block`    | Größere Antwortvorschau-Blöcke   | Eine Vorschau, die in größeren Blöcken aktualisiert oder angehängt wird. |
| `progress` | Tool-intensive oder lang laufende Durchläufe | Ein Statusentwurf, dann die finale Antwort.       |

Wählen Sie `progress`, wenn Benutzern wichtiger ist, „was gerade passiert“, als den Antworttext Token für Token streamen zu sehen.

Wählen Sie `partial`, wenn die Antwort selbst das Fortschrittssignal ist.

Wählen Sie `block`, wenn Sie Entwurfs-Vorschauupdates in größeren Textblöcken wünschen. Bei Discord und Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming, nicht normale Blockzustellung. Verwenden Sie `streaming.block.enabled` oder das ältere `blockStreaming`, wenn Sie normale Blockantworten wünschen.

## Labels konfigurieren

Fortschrittslabels befinden sich unter `channels.<channel>.streaming.progress`.

Das Standardlabel ist `auto`, das aus OpenClaws integriertem Label-Pool mit einzelnen Wörtern und Auslassungspunkten auswählt:

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

Fortschrittszeilen sind im Fortschrittsmodus standardmäßig aktiviert. Sie stammen aus echten Laufzeitereignissen: Tool-Starts, Elementupdates, Task-Pläne, Genehmigungen, Befehlsausgaben, Patch-Zusammenfassungen und ähnliche Agent-Aktivitäten.

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

`"explain"` ist die Standardeinstellung und hält Entwürfe mit prägnanten Labels wie `🛠️ check JS syntax for /tmp/app.js` stabil. `"raw"` hängt, wenn verfügbar, den zugrunde liegenden Befehl/das zugrunde liegende Detail an. Das ist beim Debuggen nützlich, aber im Chat lauter.

Beispielsweise erscheint derselbe Befehl je nach Detailmodus unterschiedlich:

| Modus     | Fortschrittszeile                                             |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
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

Fortschrittszeilen werden automatisch kompaktiert, um das Umfließen von Chatblasen zu reduzieren, während der Entwurf bearbeitet wird.

OpenClaw kürzt lange Fortschrittszeilen standardmäßig, damit wiederholte Entwurfsbearbeitungen nicht bei jedem Update anders umbrechen. Das Präfix bleibt lesbar, und lange Details wie Pfade oder rohe Befehle werden mit Auslassungspunkten gekürzt.

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

Rich Rendering behält denselben Plain-Text-Fallback bei, damit Kanäle und Clients, die die reichhaltigere Form nicht unterstützen, weiterhin den kompakten Fortschrittstext anzeigen können.

Behalten Sie den einzelnen Fortschrittsentwurf bei, blenden Sie aber Tool- und Task-Zeilen aus:

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

Mit `toolProgress: false` unterdrückt OpenClaw weiterhin die älteren eigenständigen Tool-Fortschrittsnachrichten für diesen Durchlauf. Der Kanal bleibt bis zur finalen Antwort visuell ruhig, abgesehen vom Label, falls eines konfiguriert ist.

## Kanalverhalten

Jeder Kanal verwendet den saubersten Transport, den er unterstützt:

| Kanal           | Fortschrittstransport                  | Hinweise                                                              |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden, dann bearbeiten. | Finaler Text wird direkt bearbeitet, wenn er in eine sichere Vorschaunachricht passt. |
| Matrix          | Ein Ereignis senden, dann bearbeiten.  | Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene. |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats. | `streaming.mode: "block"` wird Teams-Blockzustellung zugeordnet.       |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfsbeitrag. | Thread-Verfügbarkeit beeinflusst, ob natives Streaming verwendet werden kann. |
| Telegram        | Eine Nachricht senden, dann bearbeiten. | Ältere sichtbare Entwürfe können ersetzt werden, damit finale Zeitstempel nützlich bleiben. |
| Mattermost      | Bearbeitbarer Entwurfsbeitrag.         | Tool-Aktivität wird in denselben entwurfsartigen Beitrag eingebettet.  |

Kanäle ohne sichere Bearbeitungsunterstützung fallen in der Regel auf Tippindikatoren oder Zustellung nur der finalen Antwort zurück.

## Finalisierung

Wenn die finale Antwort bereit ist, versucht OpenClaw, den Chat sauber zu halten:

- Wenn der Entwurf sicher zur finalen Antwort werden kann, bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschrittsstreaming verwendet, finalisiert OpenClaw diesen Stream, sobald der native Transport den finalen Text akzeptiert.
- Wenn die finale Antwort Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele Chunks oder eine fehlgeschlagene Bearbeitung/einen fehlgeschlagenen Versand enthält, sendet OpenClaw die finale Antwort über den normalen Zustellpfad des Kanals.

Der Fallback-Pfad ist beabsichtigt. Es ist besser, eine neue finale Antwort zu senden, als Text zu verlieren, eine Antwort falsch in einen Thread einzuordnen oder einen Entwurf mit einer Nutzlast zu überschreiben, die der Kanal nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die finale Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto oder den Kanal, der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Manche Gruppen- oder Zitat-Antwortpfade können Entwurfsvorschauen für einen Durchlauf deaktivieren, wenn der Kanal die richtige Nachricht nicht sicher bearbeiten kann.

**Ich sehe das Label, aber keine Tool-Zeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn es `false` ist, behält OpenClaw das Verhalten mit einem einzelnen Entwurf bei, blendet aber Tool- und Task-Fortschrittszeilen aus.

**Ich sehe eine neue finale Nachricht statt eines bearbeiteten Entwurfs.**

Das ist ein Sicherheits-Fallback. Er kann bei Medienantworten, langen Antworten, expliziten Antwortzielen, alten Telegram-Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschaunachrichten oder fehlgeschlagener nativer Stream-Finalisierung auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsnachrichten.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Tool-Fortschrittsnachrichten, wenn ein Entwurf aktiv ist. Wenn weiterhin eigenständige Nachrichten erscheinen, prüfen Sie, ob der Durchlauf tatsächlich den Fortschrittsmodus verwendet und nicht `streaming.mode: "off"` oder einen Kanalpfad, der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream statt des generischen Senden-und-Bearbeiten-Vorschautransports. Teams behandelt außerdem `streaming.mode: "block"` als Teams-Blockzustellung, weil es nicht denselben Entwurfsvorschau-Blockmodus hat, den Discord und Telegram verwenden.

## Verwandte Themen

- [Streaming und Chunking](/de/concepts/streaming)
- [Nachrichten](/de/concepts/messages)
- [Kanalkonfiguration](/de/gateway/config-channels)
- [Discord](/de/channels/discord)
- [Matrix](/de/channels/matrix)
- [Microsoft Teams](/de/channels/msteams)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
