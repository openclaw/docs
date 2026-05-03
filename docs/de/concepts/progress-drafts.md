---
read_when:
    - Sichtbare Fortschrittsmeldungen für lang laufende Chat-Durchläufe konfigurieren
    - Auswahl zwischen partiellen, Block- und Fortschritts-Streaming-Modi
    - Erklärung, wie OpenClaw während laufender Arbeit eine Kanalnachricht aktualisiert
    - Fehlerbehebung bei Fortschrittsentwürfen, eigenständigen Fortschrittsmeldungen oder Finalisierungs-Fallback
summary: 'Fortschrittsentwürfe: eine sichtbare Nachricht zum Arbeitsfortschritt, die aktualisiert wird, während ein Agent läuft'
title: Entwürfe voranbringen
x-i18n:
    generated_at: "2026-05-03T21:31:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe lassen lang laufende Agenten-Turns im Chat lebendig wirken, ohne die Unterhaltung in einen Stapel temporärer Statusantworten zu verwandeln.

Wenn Fortschrittsentwürfe aktiviert sind, erstellt OpenClaw eine sichtbare Work-in-Progress-Nachricht, aktualisiert sie, während der Agent liest, plant, Tools aufruft oder auf eine Genehmigung wartet, und wandelt diesen Entwurf anschließend in die finale Antwort um, wenn der Kanal dies sicher tun kann.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Verwenden Sie Fortschrittsentwürfe, wenn Sie während tool-lastiger Arbeit eine aufgeräumte Statusnachricht und die finale Antwort nach Abschluss des Turns wünschen.

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

Das reicht normalerweise aus. OpenClaw wählt automatisch ein Ein-Wort-Label, fügt kompakte Fortschrittszeilen hinzu, während nützliche Arbeit stattfindet, und unterdrückt doppelte eigenständige Fortschrittsmeldungen für diesen Turn.

## Was Benutzer sehen

Ein Fortschrittsentwurf besteht aus zwei Teilen:

| Teil                 | Zweck                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Label                | Ein kurzer Titel wie `Thinking` oder `Shelling`.                      |
| Fortschrittszeilen   | Kompakte Laufaktualisierungen wie Tool-Aufrufe, Aufgabenschritte oder Genehmigungen. |

Das Label erscheint sofort, wenn der Agent mit der Antwort beginnt. Fortschrittszeilen werden nur hinzugefügt, wenn der Agent nützliche Arbeitsaktualisierungen ausgibt. Die finale Antwort ersetzt den Entwurf, wenn möglich; andernfalls sendet OpenClaw die finale Antwort normal und bereinigt den Entwurf oder beendet dessen Aktualisierung entsprechend dem Transport des Kanals.

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das sichtbare Work-in-Progress-Verhalten:

| Modus      | Am besten geeignet für              | Was im Chat erscheint                                  |
| ---------- | ----------------------------------- | ----------------------------------------------------- |
| `off`      | Ruhige Kanäle                       | Nur die finale Antwort.                               |
| `partial`  | Zusehen, wie Antworttext erscheint  | Ein Entwurf, der mit dem neuesten Antworttext bearbeitet wird. |
| `block`    | Größere Antwortvorschau-Chunks      | Eine Vorschau, die in größeren Chunks aktualisiert oder ergänzt wird. |
| `progress` | Tool-lastige oder lang laufende Turns | Ein Statusentwurf, danach die finale Antwort.        |

Wählen Sie `progress`, wenn Benutzer mehr Wert darauf legen, „was gerade passiert“, als den Antworttext Token für Token streamen zu sehen.

Wählen Sie `partial`, wenn die Antwort selbst das Fortschrittssignal ist.

Wählen Sie `block`, wenn Sie Entwurfsvorschau-Aktualisierungen in größeren Text-Chunks wünschen. Bei Discord und Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming, nicht die normale Blockzustellung. Verwenden Sie `streaming.block.enabled` oder das ältere `blockStreaming`, wenn Sie normale Blockantworten wünschen.

## Labels konfigurieren

Fortschrittslabels befinden sich unter `channels.<channel>.streaming.progress`.

Das Standardlabel ist `auto`, wodurch aus OpenClaws integriertem Pool von Ein-Wort-Labels ausgewählt wird:

```text
Thinking
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

Fortschrittszeilen sind im Fortschrittsmodus standardmäßig aktiviert. Sie stammen aus echten Laufereignissen: Tool-Starts, Elementaktualisierungen, Aufgabenplänen, Genehmigungen, Befehlsausgabe, Patch-Zusammenfassungen und ähnlicher Agentenaktivität.

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

Mit `toolProgress: false` unterdrückt OpenClaw weiterhin die älteren eigenständigen Tool-Fortschrittsmeldungen für diesen Turn. Der Kanal bleibt bis zur finalen Antwort visuell ruhig, abgesehen vom Label, falls eines konfiguriert ist.

## Kanalverhalten

Jeder Kanal verwendet den saubersten Transport, den er unterstützt:

| Kanal           | Fortschrittstransport                         | Hinweise                                                              |
| --------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden und dann bearbeiten.    | Finaler Text wird direkt bearbeitet, wenn er in eine sichere Vorschau-Nachricht passt. |
| Matrix          | Ein Event senden und dann bearbeiten.         | Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene. |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats.   | `streaming.mode: "block"` wird Teams-Blockzustellung zugeordnet.      |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfsbeitrag. | Thread-Verfügbarkeit beeinflusst, ob natives Streaming verwendet werden kann. |
| Telegram        | Eine Nachricht senden und dann bearbeiten.    | Ältere sichtbare Entwürfe können ersetzt werden, damit finale Zeitstempel nützlich bleiben. |
| Mattermost      | Bearbeitbarer Entwurfsbeitrag.                | Tool-Aktivität wird in denselben beitragsartigen Entwurf integriert.  |

Kanäle ohne sichere Bearbeitungsunterstützung fallen normalerweise auf Tippindikatoren oder reine Finalzustellung zurück.

## Finalisierung

Wenn die finale Antwort bereit ist, versucht OpenClaw, den Chat sauber zu halten:

- Wenn der Entwurf sicher zur finalen Antwort werden kann, bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschrittsstreaming verwendet, finalisiert OpenClaw diesen Stream, sobald der native Transport den finalen Text akzeptiert.
- Wenn die finale Antwort Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele Chunks oder einen fehlgeschlagenen Bearbeitungs- oder Sendevorgang enthält, sendet OpenClaw die finale Antwort über den normalen Zustellpfad des Kanals.

Der Fallback-Pfad ist beabsichtigt. Es ist besser, eine neue finale Antwort zu senden, als Text zu verlieren, eine Antwort im falschen Thread zu platzieren oder einen Entwurf mit einer Payload zu überschreiben, die der Kanal nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die finale Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto oder den Kanal, der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Einige Gruppen- oder Zitatantwort-Pfade können Entwurfsvorschauen für einen Turn deaktivieren, wenn der Kanal die richtige Nachricht nicht sicher bearbeiten kann.

**Ich sehe das Label, aber keine Tool-Zeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn es `false` ist, behält OpenClaw das Verhalten mit einem einzelnen Entwurf bei, blendet aber Tool- und Aufgabenfortschrittszeilen aus.

**Ich sehe eine neue finale Nachricht statt eines bearbeiteten Entwurfs.**

Das ist ein Sicherheits-Fallback. Er kann bei Medienantworten, langen Antworten, expliziten Antwortzielen, alten Telegram-Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschau-Nachrichten oder fehlgeschlagener nativer Stream-Finalisierung auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsmeldungen.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Tool-Fortschrittsmeldungen, wenn ein Entwurf aktiv ist. Wenn weiterhin eigenständige Meldungen erscheinen, prüfen Sie, ob der Turn tatsächlich den Fortschrittsmodus verwendet und nicht `streaming.mode: "off"` oder einen Kanalpfad, der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream statt des generischen Vorschau-Transports mit Senden und Bearbeiten. Teams behandelt außerdem `streaming.mode: "block"` als Teams-Blockzustellung, weil es nicht denselben Entwurfsvorschau-Blockmodus hat, den Discord und Telegram verwenden.

## Verwandte Themen

- [Streaming und Chunking](/de/concepts/streaming)
- [Nachrichten](/de/concepts/messages)
- [Kanalkonfiguration](/de/gateway/config-channels)
- [Discord](/de/channels/discord)
- [Matrix](/de/channels/matrix)
- [Microsoft Teams](/de/channels/msteams)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
