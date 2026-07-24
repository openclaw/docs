---
read_when:
    - Sichtbare Fortschrittsmeldungen für lang andauernde Chat-Antworten konfigurieren
    - Auswahl zwischen partiellem Streaming, Block-Streaming und Fortschritts-Streaming
    - Erläuterung, wie OpenClaw während der laufenden Verarbeitung eine Kanalnachricht aktualisiert
    - Fehlerbehebung bei Fortschrittsentwürfen, eigenständigen Fortschrittsmeldungen oder Finalisierungs-Fallbacks
summary: 'Fortschrittsentwürfe: eine sichtbare Nachricht zum Arbeitsfortschritt, die während der Ausführung eines Agenten aktualisiert wird'
title: Fortschrittsentwürfe
x-i18n:
    generated_at: "2026-07-24T04:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe verwandeln eine Kanalnachricht in eine live aktualisierte Statuszeile, während ein
Agent arbeitet, statt einen Stapel temporärer „noch in Bearbeitung“-Antworten zu erzeugen. Legen Sie
`channels.<channel>.streaming.mode: "progress"` fest, und OpenClaw erstellt die
Nachricht, sobald die eigentliche Arbeit beginnt, bearbeitet sie, während der Agent liest, plant, Tools
aufruft oder auf eine Genehmigung wartet, und wandelt sie anschließend in die endgültige Antwort um.

```text
Wird bearbeitet...
📖 aus docs/concepts/progress-drafts.md
🔎 Websuche: nach "discord edit message"
🛠️ Bash: Tests ausführen
```

<Note>
  Discord verwendet bereits standardmäßig `streaming.mode: "progress"`, wenn
  `channels.discord.streaming` nicht festgelegt ist, sodass Fortschrittsentwürfe
  dort ohne Konfiguration angezeigt werden. Jeder andere Kanal verwendet standardmäßig `partial`
  oder `off`; die vollständige Tabelle der kanalspezifischen Standardwerte finden Sie unter [Streaming und Aufteilung](/de/concepts/streaming#channel-mapping).
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

Die Standardwerte ab hier: eine Startverzögerung von 5 Sekunden, kompakte Fortschrittszeilen, während
nützliche Arbeit stattfindet, und die Unterdrückung der älteren eigenständigen Fortschrittsmeldungen
für diesen Durchlauf. Unbearbeitete Tool-Zeilenentwürfe verwenden
eine automatische Einwortbezeichnung; eine Statusüberschrift lässt diesen redundanten Titel weg,
sofern Sie nicht ausdrücklich einen konfigurieren.

Diese Seite behandelt die Verwendung von Fortschrittsentwürfen und ihre Konfigurationsoptionen. Die
vollständige Matrix der Streaming-Modi, kanalspezifische Laufzeithinweise und die Migration veralteter
Schlüssel finden Sie unter [Streaming und Aufteilung](/de/concepts/streaming).

## Was Benutzer sehen

| Bestandteil      | Zweck                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| Statusüberschrift | Bei Discord und Telegram die Präambel des Modells; Discord ergänzt einen Hilfstext. |
| Bezeichnung      | Optionale Start-/Statuszeile wie `Working`.                               |
| Fortschrittszeilen | Kompakte Aktualisierungen des Durchlaufs mit denselben Tool-Symbolen und demselben Detailformatierer wie `/verbose`. |

Bei unbearbeitetem Tool-Fortschritt wird die Bezeichnung angezeigt, sobald der Agent mit sinnvoller Arbeit beginnt
und während der anfänglichen Verzögerung beschäftigt bleibt.
Sie steht oben in der fortlaufenden Liste der Fortschrittszeilen und scrollt daher aus dem sichtbaren Bereich, sobald
genügend konkrete Arbeitszeilen erscheinen. Eine Statusüberschrift zeigt nur den
allgemein verständlichen Status des Agenten an, sofern nicht ausdrücklich eine Bezeichnung konfiguriert wurde. Antworten, die
ausschließlich aus reinem Text bestehen, zeigen niemals einen Fortschrittsentwurf; eine Zeile erscheint nur bei tatsächlichen Arbeitsaktualisierungen,
zum Beispiel `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
oder `✍️ Write: to /tmp/file`.

Die endgültige Antwort ersetzt den Entwurf direkt, wenn der Kanal dies sicher
unterstützt; andernfalls sendet OpenClaw die endgültige Antwort über die normale Zustellung und
bereinigt den Entwurf oder aktualisiert ihn nicht weiter (siehe [Abschluss](#finalization)).

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das sichtbare Verhalten während der Verarbeitung:

| Modus      | Am besten geeignet für           | Anzeige im Chat                                   |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Ruhige Kanäle                    | Nur die endgültige Antwort.                       |
| `partial`  | Beobachten des entstehenden Antworttexts | Ein Entwurf, der mit dem neuesten Antworttext aktualisiert wird. |
| `block`    | Größere Blöcke der Antwortvorschau | Eine Vorschau, die in größeren Blöcken aktualisiert oder ergänzt wird. |
| `progress` | Tool-intensive oder lange Durchläufe | Ein Statusentwurf, danach die endgültige Antwort. |

Wählen Sie `progress`, wenn Benutzern wichtiger ist, „was gerade geschieht“, als
den Antworttext Token für Token entstehen zu sehen; `partial`, wenn der Antworttext selbst
das Fortschrittssignal ist; `block` für größere Vorschaublöcke. Bei Discord und
Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming und keine normale
Blockantwort-Zustellung — verwenden Sie dafür `streaming.block.enabled`.

## Bezeichnungen konfigurieren

Fortschrittsbezeichnungen befinden sich unter `channels.<channel>.streaming.progress`. Die standardmäßige
Bezeichnung für unbearbeitete Tool-Zeilen ist `"auto"`, wodurch die einfache integrierte Bezeichnung `Working`
verwendet wird. Eine Statusüberschrift blendet diese implizite Bezeichnung aus; legen Sie
`label: "auto"` ausdrücklich fest, wenn darüber ebenfalls eine Bezeichnung angezeigt werden soll:

```text
Wird bearbeitet
```

Eine feste Bezeichnung verwenden:

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

Einen eigenen Bezeichnungspool verwenden (weiterhin zufällig/anhand des Seeds ausgewählt, wenn `label: "auto"`):

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

Bezeichnung ausblenden und nur Fortschrittszeilen anzeigen:

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

Fortschrittszeilen entstehen aus tatsächlichen Durchlaufereignissen: Tool-Starts, Elementaktualisierungen, Aufgabenplänen,
Genehmigungen, Befehlsausgaben, Patch-Zusammenfassungen und ähnlichen Agentenaktivitäten.
Sie sind standardmäßig aktiviert (`progress.toolProgress`, Standardwert `true`).

Tools können außerdem typisierten Fortschritt ausgeben, während ein einzelner Aufruf noch ausgeführt wird. Dadurch
aktualisiert ein langsamer Abruf oder eine langsame Suche den sichtbaren Entwurf, bevor das Tool
sein endgültiges Ergebnis zurückgibt. Die Fortschrittsaktualisierung ist ein partielles Tool-Ergebnis mit
leerem Modellinhalt und ausdrücklichen öffentlichen Kanalmetadaten:

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

OpenClaw stellt in der Fortschrittsoberfläche des Kanals nur `progress.text` dar. Das normale
Tool-Ergebnis trifft später weiterhin als `content`/`details` ein und ist der einzige Teil,
der an das Modell zurückgegeben wird.

Wenn Sie einem Tool Fortschritt hinzufügen, geben Sie eine kurze, allgemeine Nachricht aus und verzögern Sie sie,
bis der Vorgang lange genug aussteht, damit die Anzeige nützlich ist. `web_fetch`
erledigt genau dies mit einer Verzögerung von 5 Sekunden:

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
abgebrochene Aufrufe löschen den Timer, bevor veralteter Fortschritt erscheinen kann. Fortschrittstext
ist ein öffentlicher UI-Seitenkanal und darf daher niemals Geheimnisse, unbearbeitete Argumente,
abgerufene Inhalte, Befehlsausgaben oder Seitentext enthalten.

### Detailmodus

OpenClaw verwendet denselben Formatierer für Fortschrittsentwürfe und `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // erklären | unbearbeitet
    },
  },
}
```

`"explain"` ist der Standardwert und hält Entwürfe mit prägnanten Bezeichnungen stabil.
`"raw"` hängt den zugrunde liegenden Befehl an, sofern verfügbar. Dies ist bei der
Fehlerdiagnose hilfreich, im Chat jedoch unübersichtlicher. Beispielsweise wird ein Aufruf von `node --check /tmp/app.js`
je nach Modus unterschiedlich dargestellt:

| Modus     | Fortschrittszeile                                               |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Befehls-/Exec-Text

`streaming.progress.commandText` (Standardwert `"raw"`) steuert unabhängig vom oben genannten Detailmodus, wie viele
Befehlsdetails neben Exec-/Bash-Fortschrittszeilen angezeigt werden.
Legen Sie den Wert auf `"status"` fest, damit eine Tool-Fortschrittszeile sichtbar bleibt, während
der Befehlstext vollständig ausgeblendet wird:

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

`streaming.progress.commentary` (Standardwert `false`) fügt die
vor dem Tool-Aufruf ausgegebene Kommentierung/Präambel des Modells (💬, zum Beispiel „Ich prüfe ... und anschließend
...“) zwischen die Tool-Zeilen im Entwurf ein. Die
gemeinsame Konfigurationsstruktur für alle Kanäle finden Sie unter [Streaming und Aufteilung](/de/concepts/streaming#commentary-progress-lane).

Wenn die Kommentarspur aktiviert ist, werden Präambeln ausschließlich als diese eingestreuten
💬-Zeilen dargestellt; die nachfolgende Statusüberschrift bleibt ausgeblendet, damit die Spur ihre
dokumentierte Struktur beibehält.

### Statusüberschrift

Bei Discord und Telegram wird im Fortschrittsmodus die typisierte Präambel des Modells vor dem Tool-Aufruf
zur Statusüberschrift des Entwurfs, sobald sie verfügbar ist. Andere
Kanäle im Fortschrittsmodus behalten ihr bestehendes Statusverhalten bei. Die Überschrift ist
standardmäßig aktiviert und umgeht bei kurzen Durchläufen nicht die normale Aktivitätsschwelle;
durch Aktivieren von `streaming.progress.commentary` werden Präambeln stattdessen an die eingestreute
Kommentarspur übergeben.

Wenn bei Discord ein Hilfsmodell für den Agenten aufgelöst wird — ein ausdrückliches
[`utilityModel`](/de/gateway/config-agents#utilitymodel) oder der deklarierte Standardwert des primären
Providers für kleine Modelle (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — stellt es einen kurzen allgemein verständlichen Fülltext bereit,
wenn das Modell keine Präambel ausgibt oder etwa 20 Sekunden lang inaktiv war
(die Überschrift von Telegram verwendet derzeit ausschließlich die Präambel):

```text
Das Standardmodell in Ihrer Konfiguration wird aktualisiert. Anschließend wird das Gateway neu gestartet, damit
die Änderung übernommen wird. Ein Aufruf zur Auflistung der Agenten ist fehlgeschlagen und wird erneut versucht.
```

Hilfsnarration ist standardmäßig aktiviert (`streaming.progress.narration`, Standardwert
`true`) und greift niemals auf das primäre Modell zurück: Sie wird nur mit einem ausdrücklichen
`utilityModel` oder einem vom Provider deklarierten Standardwert für den primären
Provider des Agenten ausgeführt. Legen Sie `utilityModel: ""` fest, um das Hilfsrouting vollständig zu deaktivieren. Tool-Zeilen
werden darunter weiter angesammelt und wieder angezeigt, wenn beide Statusquellen enden. Entwurfs-
änderungen warten weiterhin auf die normale Aktivitätsschwelle und eine tatsächliche
Textänderung. Dies verhindert kurzes Aufblitzen bei schnellen Durchläufen und reduziert die Anzahl der Änderungen in stark frequentierten
Kanälen. Legen Sie `narration: false` fest, um nur den Fülltext des Hilfsmodells zu deaktivieren; Überschriften aus
Modellpräambeln bleiben aktiviert:

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

Die Eingabe für die Narration ist begrenzt und geschwärzt: Das Hilfsmodell erhält den
Text der eingehenden Anfrage sowie dieselben kompakten, geschwärzten Tool-Zusammenfassungen, die auch im Entwurf
dargestellt würden — niemals unbearbeitete Befehlsausgaben oder Tool-Ergebnisse. Bei
`commandText: "status"` lässt die Narrationseingabe außerdem Exec-/Bash-Befehlstext aus,
entsprechend der Darstellung im Entwurf.

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

Fortschrittszeilen werden automatisch komprimiert, um Verschiebungen der Chat-Blase zu reduzieren, während
der Entwurf bearbeitet wird. OpenClaw kürzt zudem lange Zeilen, damit wiederholte Änderungen des Entwurfs
nicht bei jeder Aktualisierung andere Zeilenumbrüche erzeugen. Das standardmäßige Budget pro Zeile beträgt 120
Zeichen; Fließtext wird an einer Wortgrenze abgeschnitten, während lange Details wie Pfade oder
unbearbeitete Befehle mit Auslassungspunkten in der Mitte gekürzt werden, damit das Suffix sichtbar bleibt.

Budget pro Zeile anpassen:

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
reinen Text darstellen:

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

Die formatierte Darstellung sendet stets denselben Klartextinhalt zusammen mit den Block-Kit-
Feldern. Dadurch zeigen Clients, die die umfangreichere Struktur nicht darstellen können, weiterhin den kompakten
Fortschrittstext an.

### Tool-/Aufgabenzeilen ausblenden

Behalten Sie den einzelnen Fortschrittsentwurf bei, blenden Sie jedoch Tool- und Aufgabenzeilen aus:

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

Mit `toolProgress: false` unterdrückt OpenClaw für diesen Durchlauf weiterhin die älteren eigenständigen
Werkzeugfortschrittsmeldungen – der Kanal bleibt visuell ruhig, bis
die endgültige Antwort erscheint, abgesehen von der Beschriftung, falls eine konfiguriert ist.

## Kanalverhalten

| Kanal           | Fortschrittsübertragung                  | Hinweise                                                                                                                                                  |
| --------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden und dann bearbeiten. | Verwendet standardmäßig den Modus `progress`; die endgültige Antwort enthält eine `-#`-Aktivitätsquittung, und der Statusentwurf wird gelöscht, nachdem die Antwort eingegangen ist. |
| Matrix          | Ein Ereignis senden und dann bearbeiten. | Die Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene.                                                                              |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats. | `streaming.mode: "block"` wird stattdessen der blockweisen Zustellung in Teams zugeordnet.                                                                    |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfsbeitrag. | Benötigt ein Antwort-Thread-Ziel; DMs auf oberster Ebene ohne ein solches Ziel erhalten weiterhin Entwurfsvorschauen und Bearbeitungen.                  |
| Telegram        | Eine Nachricht senden und dann bearbeiten. | Wenn zwischen dem Fortschrittsentwurf und der Antwort eine Nachricht eingeht, wird der Entwurf darunter erneut veröffentlicht (zuerst neu veröffentlichen, dann alten löschen), statt die Ansicht im Client springen zu lassen. |
| Mattermost      | Bearbeitbarer Entwurfsbeitrag.           | Der Modus `block` wechselt zwischen abgeschlossenem Text und Beiträgen zur Werkzeugaktivität; andere Modi integrieren die Werkzeugaktivität in denselben entwurfsartigen Beitrag. |

Kanäle ohne sichere Bearbeitungsunterstützung greifen auf Tippindikatoren oder
eine reine Zustellung der endgültigen Antwort zurück. Unter [Streaming und Aufteilung](/de/concepts/streaming) finden Sie die
vollständige Aufschlüsselung des Laufzeitverhaltens pro Kanal.

## Abschluss

Sobald die endgültige Antwort bereit ist, versucht OpenClaw, den Chat übersichtlich zu halten:

- Im Modus `progress` auf Discord wird die endgültige Antwort als neue Nachricht gesendet,
  an die eine kleine `-#`-Aktivitätsquittung angehängt ist (zum Beispiel
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`); der Statusentwurf wird
  gelöscht, sobald diese Antwort zugestellt wurde. In stark frequentierten Kanälen bleibt kein verwaistes Werkzeugprotokoll
  über der Antwort zurück; bei endgültigen Fehlermeldungen bleibt der Entwurf als sichtbare Aufzeichnung des
  fehlgeschlagenen Durchlaufs erhalten.
- Wenn der Entwurf sicher zur endgültigen Antwort werden kann (Modi `partial`/`block`),
  bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschrittsstreaming verwendet, schließt OpenClaw diesen
  Stream ab, sobald die native Übertragung den endgültigen Text akzeptiert.
- Andernfalls (Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele
  Abschnitte oder ein fehlgeschlagenes Bearbeiten/Senden) sendet OpenClaw die endgültige Antwort über den
  normalen Zustellungsweg des Kanals, statt den Entwurf zu überschreiben.

Der Rückfall ist beabsichtigt: Eine neue endgültige Antwort zu senden ist besser, als Text zu verlieren,
eine Antwort dem falschen Thread zuzuordnen oder einen Entwurf mit Nutzdaten zu überschreiben, die der Kanal
nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die endgültige Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto
oder den Kanal, das beziehungsweise der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Einige Gruppen- oder Zitatantwortpfade deaktivieren
Entwurfsvorschauen für einen Durchlauf, wenn der Kanal nicht sicher die richtige
Nachricht bearbeiten kann.

**Ich sehe die Beschriftung, aber keine Werkzeugzeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn es auf `false` gesetzt ist, behält OpenClaw das
Verhalten mit einem einzigen Entwurf bei, blendet aber Fortschrittszeilen für Werkzeuge und Aufgaben aus.

**Ich sehe eine neue endgültige Nachricht statt eines bearbeiteten Entwurfs.**

Das ist der unter [Abschluss](#finalization) beschriebene Sicherheitsrückfall. Er kann
bei Medienantworten, langen Antworten, expliziten Antwortzielen, alten Telegram-
Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschaunachrichten oder einer fehlgeschlagenen
Finalisierung nativer Streams auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsmeldungen.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Werkzeugfortschrittsmeldungen, sobald ein
Entwurf aktiv ist. Wenn weiterhin eigenständige Meldungen erscheinen, vergewissern Sie sich, dass der Durchlauf
tatsächlich den Modus `progress` und nicht `streaming.mode: "off"` oder einen Kanalpfad
verwendet, der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream anstelle der generischen
Vorschauübertragung durch Senden und Bearbeiten und ordnet `streaming.mode: "block"` der blockweisen
Zustellung in Teams zu, da es keinen Blockmodus für Entwurfsvorschauen wie Discord und
Telegram besitzt.

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
