---
read_when:
    - Sichtbare Fortschrittsmeldungen für lang laufende Chat-Antworten konfigurieren
    - Auswahl zwischen den Streaming-Modi „partial“, „block“ und „progress“
    - Erläuterung, wie OpenClaw eine einzelne Kanalnachricht aktualisiert, während die Arbeit läuft
    - Entwürfe für Fortschrittsmeldungen bei der Fehlerbehebung, eigenständige Fortschrittsmeldungen oder Fallback bei der Fertigstellung
summary: 'Fortschrittsentwürfe: eine sichtbare, noch in Bearbeitung befindliche Nachricht, die während der Ausführung eines Agenten aktualisiert wird'
title: Fortschrittsentwürfe
x-i18n:
    generated_at: "2026-07-12T15:19:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a7d2e60768718922b3d00c72817ff8e342a1e37c6d9a43eef30972412ad9a49
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe verwandeln eine Kanalnachricht in eine live aktualisierte Statuszeile, während ein
Agent arbeitet, statt einen Stapel temporärer „wird noch bearbeitet“-Antworten zu erzeugen. Legen Sie
`channels.<channel>.streaming.mode: "progress"` fest, und OpenClaw erstellt die
Nachricht, sobald die eigentliche Arbeit beginnt, aktualisiert sie, während der Agent liest, plant, Tools
aufruft oder auf eine Genehmigung wartet, und wandelt sie anschließend in die endgültige Antwort um.

```text
Shell wird ausgeführt...
📖 aus docs/concepts/progress-drafts.md
🔎 Websuche: nach "discord edit message"
🛠️ Bash: Tests ausführen
```

<Note>
  Discord verwendet bereits standardmäßig `streaming.mode: "progress"`, wenn
  `channels.discord.streaming` nicht festgelegt ist, sodass Fortschrittsentwürfe
  dort ohne Konfiguration angezeigt werden. Für jeden anderen Kanal gilt standardmäßig `partial`
  oder `off`; die vollständige Tabelle der Standardwerte je Kanal finden Sie unter
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

Ab hier gelten folgende Standardwerte: eine automatische Bezeichnung aus einem Wort, eine Startverzögerung von 5 Sekunden
(oder ein sofortiger Start bei einem zweiten Arbeitsereignis), kompakte Fortschrittszeilen, während sinnvolle
Arbeit ausgeführt wird, und die Unterdrückung der älteren eigenständigen Fortschrittsmeldungen für
diesen Durchlauf.

Diese Seite beschreibt die Verwendung von Fortschrittsentwürfen und die zugehörigen Konfigurationsoptionen. Die
vollständige Matrix der Streaming-Modi, Laufzeithinweise für die einzelnen Kanäle und die Migration veralteter Schlüssel
finden Sie unter [Streaming und Aufteilung](/de/concepts/streaming).

## Was Benutzer sehen

| Teil              | Zweck                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Bezeichnung       | Kurze Start-/Statuszeile wie `Working` oder `Shelling`.                                         |
| Fortschrittszeilen | Kompakte Ausführungsaktualisierungen mit denselben Werkzeugsymbolen und Detailformatierern wie `/verbose`. |

Die Bezeichnung erscheint, sobald der Agent mit wesentlicher Arbeit beginnt und während der
anfänglichen Verzögerung beschäftigt bleibt oder sofort ein zweites Arbeitsereignis ausgelöst wird. Sie steht am Anfang
der fortlaufenden Liste der Fortschrittszeilen und wird daher aus dem sichtbaren Bereich gescrollt, sobald genügend konkrete
Arbeitszeilen erscheinen. Reine Textantworten zeigen niemals einen Fortschrittsentwurf; eine Zeile
erscheint nur bei tatsächlichen Arbeitsaktualisierungen, zum Beispiel `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` oder `✍️ Write: to /tmp/file`.

Die endgültige Antwort ersetzt den Entwurf an Ort und Stelle, wenn der Kanal dies sicher
durchführen kann; andernfalls sendet OpenClaw die endgültige Antwort über die normale Zustellung und
bereinigt den Entwurf oder beendet dessen Aktualisierung (siehe [Abschluss](#finalization)).

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das sichtbare Verhalten während der Verarbeitung:

| Modus      | Am besten geeignet für                 | Anzeige im Chat                                          |
| ---------- | -------------------------------------- | -------------------------------------------------------- |
| `off`      | Ruhige Kanäle                          | Nur die endgültige Antwort.                              |
| `partial`  | Antworttext beim Erscheinen verfolgen  | Ein Entwurf, der mit dem neuesten Antworttext bearbeitet wird. |
| `block`    | Größere Blöcke der Antwortvorschau     | Eine Vorschau, die in größeren Blöcken aktualisiert oder ergänzt wird. |
| `progress` | Tool-intensive oder lang laufende Vorgänge | Ein Statusentwurf, anschließend die endgültige Antwort.  |

Wählen Sie `progress`, wenn Benutzern wichtiger ist, „was gerade geschieht“, als den
Antworttext Token für Token beim Streaming zu verfolgen; `partial`, wenn der Antworttext selbst
als Fortschrittsanzeige dient; `block` für größere Vorschaublöcke. Auf Discord und
Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming und keine normale
Blockantwort-Zustellung – verwenden Sie dafür `streaming.block.enabled`.

## Labels konfigurieren

Fortschrittslabels befinden sich unter `channels.<channel>.streaming.progress`. Das
standardmäßige `label` ist `"auto"`, wodurch ein Label aus dem integrierten Pool
von OpenClaw mit einzelnen Wörtern ausgewählt wird:

```text
Arbeiten, Befehle ausführen, Huschen, Krallen, Zwicken, Häuten, Blubbern, Fluten,
Riffe bilden, Knacken, Sieben, Pökeln, Nautilieren, Krillen, Seepocken bilden,
Hummern, Gezeitentümpeln, Perlen bilden, Schnappen, Auftauchen
```

Verwenden Sie ein festes Label:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Untersuchen",
        },
      },
    },
  },
}
```

Verwenden Sie Ihren eigenen Label-Pool (bei `label: "auto"` weiterhin zufällig bzw. anhand des Seeds ausgewählt):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Prüfen", "Lesen", "Testen", "Abschließen"],
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

Fortschrittszeilen stammen aus tatsächlichen Ausführungsereignissen: Werkzeugstarts,
Elementaktualisierungen, Aufgabenpläne, Genehmigungen, Befehlsausgaben,
Patch-Zusammenfassungen und ähnliche Agentenaktivitäten. Sie sind standardmäßig
aktiviert (`progress.toolProgress`, Standardwert `true`).

Werkzeuge können außerdem typisierte Fortschrittsmeldungen ausgeben, während ein
einzelner Aufruf noch ausgeführt wird. So aktualisiert ein langsamer Abruf oder
eine langsame Suche den sichtbaren Entwurf, bevor das Werkzeug sein endgültiges
Ergebnis zurückgibt. Die Fortschrittsaktualisierung ist ein partielles
Werkzeugergebnis mit leerem Modellinhalt und expliziten öffentlichen
Kanalmetadaten:

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

OpenClaw stellt in der Fortschrittsoberfläche des Kanals nur `progress.text`
dar. Das normale Werkzeugergebnis trifft später weiterhin als `content`/`details`
ein und ist der einzige Teil, der an das Modell zurückgegeben wird.

Wenn Sie einem Werkzeug Fortschrittsmeldungen hinzufügen, geben Sie eine kurze,
allgemeine Meldung aus und verzögern Sie sie, bis der Vorgang lange genug
aussteht, damit die Meldung hilfreich ist. `web_fetch` setzt genau dies mit
einer Verzögerung von 5 Sekunden um:

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
bei abgebrochenen Aufrufen wird der Timer gelöscht, bevor ein veralteter Fortschritt erscheinen kann. Fortschrittstext
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

`"explain"` ist die Standardeinstellung und hält Entwürfe mit prägnanten Beschriftungen stabil.
`"raw"` hängt den zugrunde liegenden Befehl an, sofern verfügbar. Dies ist bei der
Fehlersuche hilfreich, führt im Chat jedoch zu mehr Ausgaben. Beispielsweise wird ein Aufruf von
`node --check /tmp/app.js` je nach Modus unterschiedlich dargestellt:

| Modus     | Fortschrittszeile                                              |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Befehls-/Ausführungstext

`streaming.progress.commandText` (Standardwert `"raw"`) steuert unabhängig vom
oben genannten Detailmodus, wie viele Befehlsdetails neben Fortschrittszeilen für
exec/bash angezeigt werden. Setzen Sie den Wert auf `"status"`, damit eine
Werkzeugfortschrittszeile sichtbar bleibt, während der Befehlstext vollständig
ausgeblendet wird:

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

`streaming.progress.commentary` (Standardwert `false`) fügt die Kommentare bzw.
Präambel des Modells vor einem Werkzeugaufruf (💬, zum Beispiel „Ich prüfe ... und
anschließend ...“) zwischen den Werkzeugzeilen im Entwurf ein. Unter
[Streaming und Aufteilung](/de/concepts/streaming#commentary-progress-lane) finden Sie die
kanalübergreifend verwendete Konfigurationsstruktur.

### Beschriebener Status

Wenn ein Hilfsmodell für den Agenten aufgelöst wird – entweder ein explizites
[`utilityModel`](/de/gateway/config-agents#utilitymodel) oder das vom primären
Provider deklarierte Standardmodell für kleine Modelle (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) –, ersetzt der Fortschrittsentwurf die fortlaufenden
Werkzeugzeilen durch eine kurze, allgemein verständliche Beschreibung dessen, was der
Agent gerade tut. Diese wird vom kostengünstigeren Modell verfasst und im Verlauf
der Arbeit aktualisiert:

```text
Am Werk

Das Standardmodell in Ihrer Konfiguration wird aktualisiert und anschließend das Gateway
neu gestartet, um die Änderung zu übernehmen. Ein Aufruf zum Auflisten der Agenten ist fehlgeschlagen
und wird erneut versucht.
```

Die Beschreibung ist standardmäßig aktiviert (`streaming.progress.narration`,
Standardwert `true`) und greift niemals auf das primäre Modell zurück: Sie wird nur
mit einem expliziten `utilityModel` oder einem vom Provider deklarierten Standardwert
für den primären Provider des Agenten ausgeführt. Setzen Sie `utilityModel: ""`, um
das Hilfsmodell-Routing vollständig zu deaktivieren. Werkzeugzeilen werden im Hintergrund
weiterhin gesammelt und wieder angezeigt, wenn die Beschreibung endet. Der Entwurf wird
nur bearbeitet, wenn sich der Beschreibungstext tatsächlich ändert, wodurch auch die
Anzahl der Bearbeitungen in stark frequentierten Kanälen reduziert wird. Deaktivieren Sie
die Funktion, um die unverarbeiteten Werkzeugzeilen beizubehalten:

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

Die Eingabe für die Beschreibung ist begrenzt und bereinigt: Das Hilfsmodell erhält
den Text der eingehenden Anfrage sowie dieselben kompakten, bereinigten
Werkzeugzusammenfassungen, die der Entwurf darstellen würde – niemals unverarbeitete
Befehlsausgaben oder Werkzeugergebnisse. Bei `commandText: "status"` enthält die
Eingabe für die Beschreibung außerdem keinen exec/bash-Befehlstext, entsprechend
der Darstellung im Entwurf.

### Zeilenbegrenzungen

Begrenzen Sie die Anzahl der sichtbaren Zeilen (Standardwert 8):

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

Fortschrittszeilen werden automatisch komprimiert, um Umbrüche der Chatblase während
der Bearbeitung des Entwurfs zu reduzieren. OpenClaw kürzt lange Zeilen, damit wiederholte
Bearbeitungen des Entwurfs nicht bei jeder Aktualisierung zu unterschiedlichen Umbrüchen
führen. Das standardmäßige Budget pro Zeile beträgt 120 Zeichen; Fließtext wird an einer
Wortgrenze abgeschnitten, während lange Details wie Pfade oder unverarbeitete Befehle mit
Auslassungspunkten in der Mitte gekürzt werden, sodass das Ende sichtbar bleibt.

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

### Erweiterte Darstellung (Slack)

Slack kann Fortschrittszeilen als strukturierte Block-Kit-Felder anstelle von
reinem Text darstellen:

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

Bei der erweiterten Darstellung wird neben den Block-Kit-Feldern immer derselbe
Textkörper als reiner Text gesendet. Dadurch zeigen Clients, die die erweiterte
Struktur nicht darstellen können, weiterhin den kompakten Fortschrittstext an.

### Werkzeug-/Aufgabenzeilen ausblenden

Behalten Sie den einzelnen Fortschrittsentwurf bei, blenden Sie jedoch Werkzeug-
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

Mit `toolProgress: false` unterdrückt OpenClaw für diesen Durchlauf weiterhin die
älteren separaten Werkzeugfortschrittsmeldungen – der Kanal bleibt bis zur endgültigen
Antwort optisch ruhig, mit Ausnahme der Beschriftung, sofern eine konfiguriert ist.

## Kanalverhalten

| Kanal           | Fortschrittsübertragung                         | Hinweise                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden und anschließend bearbeiten. | Verwendet standardmäßig den Modus `progress`; die endgültige Antwort enthält einen `-#`-Aktivitätsbeleg, und der Statusentwurf wird gelöscht, nachdem die Antwort eingegangen ist.                       |
| Matrix          | Ein Ereignis senden und anschließend bearbeiten. | Die Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene.                                                                                                                              |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats.     | `streaming.mode: "block"` wird stattdessen der blockweisen Zustellung in Teams zugeordnet.                                                                                                                |
| Slack           | Nativer Stream oder bearbeitbarer Beitragsentwurf. | Erfordert ein Ziel in einem Antwort-Thread; übergeordnete Direktnachrichten ohne ein solches Ziel erhalten weiterhin Vorschau-Beiträge für Entwürfe und deren Bearbeitungen.                             |
| Telegram        | Eine Nachricht senden und anschließend bearbeiten. | Wenn zwischen dem Fortschrittsentwurf und der Antwort eine Nachricht eingeht, wird der Entwurf darunter erneut veröffentlicht (zuerst neu veröffentlichen, dann alten löschen), statt die Ansicht im Client springen zu lassen. |
| Mattermost      | Bearbeitbarer Beitragsentwurf.                   | Im Modus `block` wird zwischen Beiträgen mit abgeschlossenem Text und Beiträgen mit Werkzeugaktivitäten gewechselt; in anderen Modi werden Werkzeugaktivitäten in denselben entwurfsartigen Beitrag integriert. |

Kanäle ohne sichere Unterstützung für Bearbeitungen greifen auf Tippindikatoren oder
die ausschließliche Zustellung der endgültigen Antwort zurück. Unter [Streaming und Aufteilung](/de/concepts/streaming) finden Sie die
vollständige Aufschlüsselung des Laufzeitverhaltens für jeden Kanal.

## Abschluss

Wenn die endgültige Antwort bereit ist, versucht OpenClaw, den Chat übersichtlich zu halten:

- Im `progress`-Modus auf Discord wird die endgültige Antwort als neue Nachricht gesendet,
  an die ein kleiner `-#`-Aktivitätsbeleg angehängt wird (zum Beispiel
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`); der Statusentwurf wird
  gelöscht, sobald diese Antwort zugestellt wurde. In stark frequentierten Kanälen verbleibt kein verwaistes Tool-
  Protokoll über der Antwort; bei abschließenden Fehlermeldungen bleibt der Entwurf als sichtbarer Nachweis des
  fehlgeschlagenen Durchlaufs erhalten.
- Wenn der Entwurf gefahrlos zur endgültigen Antwort werden kann (`partial`-/`block`-Modi),
  bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschritts-Streaming verwendet, schließt OpenClaw diesen
  Stream ab, sobald der native Transport den endgültigen Text akzeptiert.
- Andernfalls (Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele
  Blöcke oder eine fehlgeschlagene Bearbeitung bzw. Übermittlung) sendet OpenClaw die endgültige Antwort über den
  normalen Zustellpfad des Kanals, anstatt den Entwurf zu überschreiben.

Der Fallback ist beabsichtigt: Das Senden einer neuen endgültigen Antwort ist besser, als Text zu verlieren, eine Antwort dem falschen Thread zuzuordnen oder einen Entwurf mit einer Nutzlast zu überschreiben, die der Kanal nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die endgültige Antwort.**

Überprüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto oder den Kanal, das bzw. der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Bei einigen Gruppen- oder Antwort-mit-Zitat-Pfaden werden Entwurfsvorschauen für einen Durchlauf deaktiviert, wenn der Kanal nicht sicher die richtige Nachricht bearbeiten kann.

**Ich sehe die Beschriftung, aber keine Tool-Zeilen.**

Überprüfen Sie `streaming.progress.toolProgress`. Wenn der Wert `false` ist, behält OpenClaw das
Verhalten mit einem einzelnen Entwurf bei, blendet jedoch die Fortschrittszeilen für Tools und Aufgaben aus.

**Ich sehe eine neue endgültige Nachricht statt eines bearbeiteten Entwurfs.**

Das ist der unter [Finalisierung](#finalization) beschriebene Sicherheits-Fallback. Er kann
bei Medienantworten, langen Antworten, expliziten Antwortzielen, alten Telegram-
Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschaunachrichten oder einer fehlgeschlagenen
Finalisierung des nativen Streams auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsnachrichten.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Tool-Fortschrittsnachrichten, sobald ein
Entwurf aktiv ist. Wenn weiterhin eigenständige Nachrichten angezeigt werden, vergewissern Sie sich, dass der Durchlauf
tatsächlich den Modus `progress` verwendet und nicht `streaming.mode: "off"` oder einen Kanalpfad,
der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream anstelle des generischen
Vorschautransports zum Senden und Bearbeiten und ordnet `streaming.mode: "block"` der blockweisen Zustellung
in Teams zu, da es dort keinen Entwurfsvorschaumodus für Blöcke wie in Discord und
Telegram gibt.

## Verwandte Themen

- [Streaming und Aufteilung in Abschnitte](/de/concepts/streaming)
- [Nachrichten](/de/concepts/messages)
- [Kanalkonfiguration](/de/gateway/config-channels)
- [Discord](/de/channels/discord)
- [Matrix](/de/channels/matrix)
- [Microsoft Teams](/de/channels/msteams)
- [Slack](/de/channels/slack)
- [Telegram](/de/channels/telegram)
- [Mattermost](/de/channels/mattermost)
