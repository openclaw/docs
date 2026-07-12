---
read_when:
    - Sichtbare Fortschrittsmeldungen für lang andauernde Chat-Antworten konfigurieren
    - Auswahl zwischen partiellem Streaming, Block-Streaming und Fortschritts-Streaming
    - Erläuterung, wie OpenClaw eine einzelne Kanalnachricht aktualisiert, während die Arbeit ausgeführt wird
    - Entwürfe für Fortschrittsmeldungen bei der Fehlerbehebung, eigenständige Fortschrittsmeldungen oder Rückgriff bei der Finalisierung
summary: 'Fortschrittsentwürfe: eine sichtbare Arbeitsfortschrittsmeldung, die während der Ausführung eines Agenten aktualisiert wird'
title: Fortschrittsentwürfe
x-i18n:
    generated_at: "2026-07-12T21:35:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f937a61dfa360ac1d6c67e1a05e5ac698af563f2b58624d6de4e69a7f904cdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe verwandeln eine Kanalnachricht in eine live aktualisierte Statuszeile, während ein
Agent arbeitet, anstatt einen Stapel temporärer „wird noch bearbeitet“-Antworten zu erzeugen. Legen Sie
`channels.<channel>.streaming.mode: "progress"` fest. OpenClaw erstellt die
Nachricht, sobald die eigentliche Arbeit beginnt, bearbeitet sie, während der Agent liest, plant, Tools
aufruft oder auf eine Genehmigung wartet, und wandelt sie anschließend in die endgültige Antwort um.

```text
Shell wird ausgeführt...
📖 aus docs/concepts/progress-drafts.md
🔎 Websuche: nach "discord edit message"
🛠️ Bash: Tests ausführen
```

<Note>
  Discord verwendet bereits standardmäßig `streaming.mode: "progress"`, wenn
  `channels.discord.streaming` nicht gesetzt ist. Daher werden Fortschrittsentwürfe
  dort ohne jegliche Konfiguration angezeigt. Für jeden anderen Kanal ist standardmäßig `partial`
  oder `off` festgelegt; die vollständige Tabelle der kanalspezifischen Standardwerte finden Sie unter
  [Streaming und Aufteilung](/de/concepts/streaming#channel-mapping).
</Note>

## Schnellstart

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

Ab hier gelten folgende Standardwerte: eine Startverzögerung von 5 Sekunden (oder ein sofortiger Start bei einem zweiten
Arbeitsereignis), kompakte Fortschrittszeilen, während sinnvolle Arbeit stattfindet, und die Unterdrückung
der älteren eigenständigen Fortschrittsnachrichten für diesen Durchlauf. Entwürfe mit unformatierten Tool-Zeilen verwenden
eine automatische Ein-Wort-Bezeichnung; bei einem ausformulierten Status wird dieser redundante Titel weggelassen, sofern
Sie nicht ausdrücklich einen konfigurieren.

Diese Seite behandelt die Bedienung von Fortschrittsentwürfen und die zugehörigen Konfigurationsoptionen. Die
vollständige Matrix der Streaming-Modi, kanalspezifische Laufzeithinweise und die Migration veralteter Schlüssel
finden Sie unter [Streaming und Aufteilung](/de/concepts/streaming).

## Was Benutzer sehen

| Bestandteil       | Zweck                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Bezeichnung       | Optionale Start-/Statuszeile wie `Working` oder `Shelling`.                                         |
| Fortschrittszeilen | Kompakte Aktualisierungen zum Ausführungsverlauf mit denselben Tool-Symbolen und Detailformatierern wie `/verbose`. |

Bei unformatiertem Tool-Fortschritt erscheint die Bezeichnung, sobald der Agent mit sinnvoller Arbeit beginnt
und während der anfänglichen Verzögerung beschäftigt bleibt oder sofort ein zweites Arbeitsereignis ausgelöst wird.
Sie steht am Anfang der fortlaufenden Liste der Fortschrittszeilen und scrollt daher aus dem Sichtbereich, sobald
genügend konkrete Arbeitszeilen erscheinen. Ausformulierter Fortschritt zeigt nur die allgemein verständliche
Statusmeldung des Agenten an, sofern nicht ausdrücklich eine Bezeichnung konfiguriert wurde. Antworten, die ausschließlich
aus reinem Text bestehen, zeigen niemals einen Fortschrittsentwurf; eine Zeile erscheint nur bei tatsächlichen Arbeitsaktualisierungen,
beispielsweise `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
oder `✍️ Write: to /tmp/file`.

Die endgültige Antwort ersetzt den Entwurf an derselben Stelle, wenn der Kanal dies sicher
unterstützt. Andernfalls sendet OpenClaw die endgültige Antwort über die normale Zustellung und
bereinigt den Entwurf oder aktualisiert ihn nicht weiter (siehe [Abschluss](#finalization)).

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das während der Verarbeitung sichtbare Verhalten:

| Modus      | Am besten geeignet für                       | Anzeige im Chat                                              |
| ---------- | -------------------------------------------- | ------------------------------------------------------------ |
| `off`      | Ruhige Kanäle                                | Nur die endgültige Antwort.                                  |
| `partial`  | Sichtbarer Aufbau des Antworttexts           | Ein Entwurf, der mit dem neuesten Antworttext aktualisiert wird. |
| `block`    | Größere Abschnitte der Antwortvorschau       | Eine Vorschau, die in größeren Abschnitten aktualisiert oder ergänzt wird. |
| `progress` | Tool-intensive oder lang laufende Durchläufe | Ein Statusentwurf, anschließend die endgültige Antwort.       |

Wählen Sie `progress`, wenn Benutzern wichtiger ist, „was gerade geschieht“, als zu beobachten,
wie der Antworttext Token für Token gestreamt wird; wählen Sie `partial`, wenn der Antworttext selbst
das Fortschrittssignal darstellt, und `block` für größere Vorschauabschnitte. Bei Discord und
Telegram bleibt `streaming.mode: "block"` Vorschau-Streaming und ist keine normale
Blockantwort-Zustellung — verwenden Sie dafür `streaming.block.enabled`.

## Labels konfigurieren

Fortschritts-Labels befinden sich unter `channels.<channel>.streaming.progress`. Das standardmäßige
Label für reine Tool-Zeilen ist `"auto"`, wodurch ein Label aus OpenClaws integriertem
Pool aus einzelnen Wörtern ausgewählt wird. Bei kommentiertem Fortschritt wird dieses implizite Label ausgeblendet; setzen Sie
`label: "auto"` explizit, wenn es auch über der Kommentierung angezeigt werden soll:

```text
Arbeiten, Shell verwenden, Huschen, Krallen einsetzen, Zwicken, Häuten, Blubbern, Gezeiten folgen,
Riffe erkunden, Knacken, Sieben, Einlegen, Nautilus sein, Krill fangen, Seepocken sammeln,
Hummern, Gezeitentümpel erkunden, Perlen suchen, Schnappen, Auftauchen
```

Verwenden Sie ein festes Label:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Untersuchung",
        },
      },
    },
  },
}
```

Verwenden Sie Ihren eigenen Label-Pool (die Auswahl erfolgt weiterhin zufällig/anhand des Seeds, wenn `label: "auto"` gesetzt ist):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Prüfung", "Lesen", "Testen", "Abschluss"],
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

Fortschrittszeilen stammen aus tatsächlichen Ausführungsereignissen: Tool-Starts, Elementaktualisierungen, Aufgabenplänen,
Genehmigungen, Befehlsausgaben, Patch-Zusammenfassungen und ähnlichen Agentenaktivitäten.
Sie sind standardmäßig aktiviert (`progress.toolProgress`, Standardwert `true`).

Tools können außerdem typisierte Fortschrittsmeldungen ausgeben, während ein einzelner Aufruf noch ausgeführt wird. So
aktualisiert ein langsamer Abruf oder eine langsame Suche den sichtbaren Entwurf, bevor das Tool
sein endgültiges Ergebnis zurückgibt. Die Fortschrittsaktualisierung ist ein partielles Tool-Ergebnis mit
leerem Modellinhalt und expliziten öffentlichen Kanalmetadaten:

```json
{
  "content": [],
  "progress": {
    "text": "Seiteninhalt wird abgerufen...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw rendert nur `progress.text` in der Fortschritts-UI des Kanals. Das normale
Tool-Ergebnis trifft später weiterhin als `content`/`details` ein und ist der einzige Teil,
der an das Modell zurückgegeben wird.

Wenn Sie einem Tool Fortschrittsmeldungen hinzufügen, geben Sie eine kurze, allgemeine Meldung aus und verzögern Sie sie,
bis der Vorgang lange genug aussteht, damit die Meldung nützlich ist. `web_fetch`
tut genau dies mit einer Verzögerung von 5 Sekunden:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Seiteninhalt wird abgerufen...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Schnelle Aufrufe zeigen keine Fortschrittszeile; lange Aufrufe zeigen eine, solange sie noch ausstehen;
bei abgebrochenen Aufrufen wird der Timer gelöscht, bevor ein veralteter Fortschritt angezeigt werden kann. Fortschrittstext
ist ein öffentlicher UI-Seitenkanal und darf daher niemals Geheimnisse, unverarbeitete Argumente,
abgerufene Inhalte, Befehlsausgaben oder Seitentext enthalten.

### Detailmodus

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

`"explain"` ist die Standardeinstellung und sorgt mit prägnanten Bezeichnungen für stabile Entwürfe.
`"raw"` hängt den zugrunde liegenden Befehl an, sofern dieser verfügbar ist. Dies ist beim
Debuggen hilfreich, führt im Chat jedoch zu mehr Ausgaben. Beispielsweise wird ein Aufruf von `node --check /tmp/app.js`
je nach Modus unterschiedlich dargestellt:

| Modus      | Fortschrittszeile                                               |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Befehls-/Exec-Text

`streaming.progress.commandText` (Standardwert `"raw"`) steuert unabhängig vom oben genannten Detailmodus, wie viele Befehlsdetails neben Exec-/Bash-Fortschrittszeilen angezeigt werden. Setzen Sie den Wert auf `"status"`, damit eine Zeile für den Tool-Fortschritt sichtbar bleibt, während der Befehlstext vollständig ausgeblendet wird:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Kommentarspur

`streaming.progress.commentary` (Standardwert `false`) fügt die vor der Werkzeugnutzung ausgegebenen Kommentare bzw. Präambel-Erläuterungen des Modells (💬, zum Beispiel „Ich prüfe ... und dann ...“) zwischen die Werkzeugzeilen im Entwurf ein. Unter [Streaming und Aufteilung](/de/concepts/streaming#commentary-progress-lane) finden Sie die kanalübergreifend verwendete gemeinsame Konfigurationsstruktur.

### Erläuterter Status

Wenn für den Agenten ein Hilfsmodell aufgelöst wird – entweder ein explizites [`utilityModel`](/de/gateway/config-agents#utilitymodel) oder das vom primären Provider deklarierte Standard-Kleinmodell (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) –, ersetzt der Fortschrittsentwurf die fortlaufenden Werkzeugzeilen durch eine kurze, allgemein verständliche Erläuterung der aktuellen Tätigkeit des Agenten. Sie wird vom kostengünstigeren Modell verfasst und im Verlauf der Arbeit aktualisiert:

```text
Das Standardmodell in Ihrer Konfiguration wird aktualisiert; anschließend wird
das Gateway neu gestartet, damit die Änderung übernommen wird. Ein Aufruf zum
Auflisten der Agenten ist fehlgeschlagen und wird erneut versucht.
```

Die Erläuterung ist standardmäßig aktiviert (`streaming.progress.narration`, Standardwert `true`) und greift niemals auf das primäre Modell zurück: Sie wird nur mit einem expliziten `utilityModel` oder einem vom Provider deklarierten Standardmodell für den primären Provider des Agenten ausgeführt. Legen Sie `utilityModel: ""` fest, um das Hilfsmodell-Routing vollständig zu deaktivieren. Werkzeugzeilen werden darunter weiterhin gesammelt und wieder angezeigt, wenn die Erläuterung endet. Der Entwurf wird zudem erst nach der regulären Aktivitätsschwelle und nur dann bearbeitet, wenn sich der Erläuterungstext tatsächlich ändert. Dadurch werden kurzes Aufblitzen bei schnellen Durchläufen vermieden und unnötige Bearbeitungen in stark ausgelasteten Kanälen reduziert. Deaktivieren Sie die Funktion, um die unverarbeiteten Werkzeugzeilen beizubehalten:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

Die Eingabe für die Begleitbeschreibung ist begrenzt und redigiert: Das Utility-Modell erhält den
Text der eingehenden Anfrage sowie dieselben kompakten, redigierten Werkzeugzusammenfassungen, die der Entwurf
darstellen würde – niemals rohe Befehlsausgaben oder Werkzeugergebnisse. Bei
`commandText: "status"` lässt die Eingabe für die Begleitbeschreibung außerdem den Text von exec/bash-Befehlen aus,
entsprechend der Darstellung im Entwurf.

### Zeilenlimits

Begrenzen Sie, wie viele Zeilen sichtbar bleiben (Standardwert 8):

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

Fortschrittszeilen werden automatisch komprimiert, um den Umbruch von Chat-Blasen zu reduzieren, während
der Entwurf bearbeitet wird. OpenClaw kürzt außerdem lange Zeilen, damit wiederholte Entwurfsänderungen
nicht bei jeder Aktualisierung anders umbrechen. Das standardmäßige Budget pro Zeile beträgt 120
Zeichen; Fließtext wird an einer Wortgrenze abgeschnitten, während lange Details wie Pfade oder
rohe Befehle mit Auslassungspunkten in der Mitte gekürzt werden, sodass das Ende sichtbar bleibt.

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

### Formatierte Darstellung (Slack)

Slack kann Fortschrittszeilen als strukturierte Block-Kit-Felder statt als
Klartext darstellen:

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

Bei der formatierten Darstellung wird neben den Block-Kit-Feldern immer derselbe Klartextinhalt
gesendet, sodass Clients, die das umfangreichere Format nicht darstellen können, weiterhin den kompakten
Fortschrittstext anzeigen.

### Werkzeug-/Aufgabenzeilen ausblenden

Behalten Sie den einzelnen Fortschrittsentwurf bei, blenden Sie jedoch Werkzeug- und Aufgabenzeilen aus:

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

Bei `toolProgress: false` unterdrückt OpenClaw für diesen Durchlauf weiterhin die älteren eigenständigen
Werkzeugfortschrittsmeldungen – der Kanal bleibt bis zur endgültigen Antwort visuell ruhig,
mit Ausnahme der Bezeichnung, sofern eine konfiguriert ist.

## Kanalverhalten

| Kanal           | Fortschrittsübertragung                          | Hinweise                                                                                                                                                                              |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden und anschließend bearbeiten. | Standardmäßig wird der Modus `progress` verwendet; die endgültige Antwort enthält einen `-#`-Aktivitätsbeleg, und der Statusentwurf wird gelöscht, nachdem die Antwort eingegangen ist. |
| Matrix          | Ein Ereignis senden und anschließend bearbeiten. | Die Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene.                                                                                                           |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats.      | `streaming.mode: "block"` wird stattdessen der blockweisen Teams-Zustellung zugeordnet.                                                                                               |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfsbeitrag. | Benötigt einen Ziel-Thread für Antworten; DMs auf oberster Ebene ohne einen solchen erhalten weiterhin Entwurfsvorschauen und Aktualisierungen.                                        |
| Telegram        | Eine Nachricht senden und anschließend bearbeiten. | Wenn zwischen dem Fortschrittsentwurf und der Antwort eine Nachricht eingeht, wird der Entwurf darunter erneut veröffentlicht (zuerst neu veröffentlichen, dann den alten löschen), statt die Ansicht des Clients springen zu lassen. |
| Mattermost      | Bearbeitbarer Entwurfsbeitrag.                    | Im Modus `block` wird zwischen Beiträgen mit abgeschlossenem Text und Beiträgen zu Tool-Aktivitäten gewechselt; andere Modi integrieren die Tool-Aktivität in denselben entwurfsartigen Beitrag. |

Kanäle ohne sichere Bearbeitungsunterstützung greifen auf Tippindikatoren oder
eine ausschließliche Zustellung der endgültigen Antwort zurück. Unter [Streaming und Aufteilung](/de/concepts/streaming) finden Sie die
vollständige Aufschlüsselung des Laufzeitverhaltens für jeden Kanal.

## Abschluss

Wenn die endgültige Antwort bereit ist, versucht OpenClaw, den Chat übersichtlich zu halten:

- Im Modus `progress` auf Discord wird die endgültige Antwort als neue Nachricht gesendet,
  an die eine kleine `-#`-Aktivitätsbestätigung angehängt wird (zum Beispiel
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`); der Statusentwurf wird
  gelöscht, sobald diese Antwort zugestellt wurde. In stark ausgelasteten Kanälen bleibt kein verwaistes Tool-
  Protokoll oberhalb der Antwort zurück; bei abschließenden Fehlermeldungen bleibt der Entwurf als sichtbarer Nachweis
  des fehlgeschlagenen Durchlaufs erhalten.
- Wenn der Entwurf sicher zur endgültigen Antwort werden kann (Modi `partial`/`block`),
  bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschrittsstreaming verwendet, schließt OpenClaw diesen
  Stream ab, sobald der native Transport den endgültigen Text akzeptiert.
- Andernfalls (Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele
  Abschnitte oder eine fehlgeschlagene Bearbeitung/Übermittlung) sendet OpenClaw die endgültige Antwort über den
  normalen Zustellungspfad des Kanals, statt den Entwurf zu überschreiben.

Der Fallback ist beabsichtigt: Das Senden einer neuen abschließenden Antwort ist besser, als Text zu verlieren, eine Antwort dem falschen Thread zuzuordnen oder einen Entwurf mit einem Payload zu überschreiben, den der Kanal nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die endgültige Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto oder den Kanal, das bzw. der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Bei einigen Gruppen- oder Antwort-mit-Zitat-Abläufen werden Entwurfsvorschauen für einen Durchlauf deaktiviert, wenn der Kanal die richtige Nachricht nicht sicher bearbeiten kann.

**Ich sehe die Kennzeichnung, aber keine Tool-Zeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn der Wert `false` ist, behält OpenClaw das
Verhalten mit einem einzelnen Entwurf bei, blendet jedoch die Fortschrittszeilen für Tools und Aufgaben aus.

**Ich sehe eine neue endgültige Nachricht statt eines bearbeiteten Entwurfs.**

Das ist der unter [Finalisierung](#finalization) beschriebene Sicherheits-Fallback. Er kann
bei Medienantworten, langen Antworten, expliziten Antwortzielen, alten Telegram-
Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschaunachrichten oder einer fehlgeschlagenen
Finalisierung des nativen Streams auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsnachrichten.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Tool-Fortschrittsnachrichten, sobald ein
Entwurf aktiv ist. Wenn weiterhin eigenständige Nachrichten erscheinen, prüfen Sie, ob der Durchlauf
tatsächlich den Modus `progress` und nicht `streaming.mode: "off"` oder einen Kanalpfad
verwendet, der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream anstelle des generischen
Vorschautransports mit Senden und Bearbeiten und ordnet `streaming.mode: "block"` der blockweisen
Zustellung von Teams zu, da es keinen Entwurfsvorschau-Blockmodus wie Discord und
Telegram bietet.

## Verwandte Themen

- [Streaming und Aufteilung](/de/concepts/streaming)
- [Nachrichten](/de/concepts/messages)
- [Kanalkonfiguration](/de/gateway/config-channels)
- [Discord](/de/channels/discord)
- [Matrix](/de/channels/matrix)
- [Microsoft Teams](/de/channels/msteams)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
- [Mattermost](/de/channels/mattermost)
