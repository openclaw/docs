---
read_when:
    - Sichtbare Fortschrittsmeldungen für lang andauernde Chat-Antworten konfigurieren
    - Auswahl zwischen den Streaming-Modi „partial“, „block“ und „progress“
    - Erläuterung, wie OpenClaw eine Kanalnachricht aktualisiert, während die Arbeit läuft
    - Entwürfe für Fortschrittsmeldungen zur Fehlerbehebung, eigenständige Fortschrittsmeldungen oder Fallback bei der Fertigstellung
summary: 'Fortschrittsentwürfe: eine sichtbare Nachricht zum Arbeitsfortschritt, die während der Ausführung eines Agenten aktualisiert wird'
title: Fortschrittsentwürfe
x-i18n:
    generated_at: "2026-07-16T12:44:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Fortschrittsentwürfe verwandeln eine Kanalnachricht in eine laufend aktualisierte Statuszeile, während ein
Agent arbeitet, anstatt mehrere vorübergehende „wird noch bearbeitet“-Antworten zu erzeugen. Legen Sie
`channels.<channel>.streaming.mode: "progress"` fest, und OpenClaw erstellt die
Nachricht, sobald die eigentliche Arbeit beginnt, bearbeitet sie, während der Agent liest, plant, Tools
aufruft oder auf eine Genehmigung wartet, und verwandelt sie anschließend in die endgültige Antwort.

```text
Wird bearbeitet...
📖 aus docs/concepts/progress-drafts.md
🔎 Web Search: nach "discord edit message"
🛠️ Bash: Tests ausführen
```

<Note>
  Discord verwendet bereits standardmäßig `streaming.mode: "progress"`, wenn
  `channels.discord.streaming` nicht festgelegt ist. Daher werden Fortschrittsentwürfe
  dort ohne Konfiguration angezeigt. Für jeden anderen Kanal gilt standardmäßig `partial`
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

Ab hier gelten folgende Standardwerte: eine Startverzögerung von 5 Sekunden, kompakte Fortschrittszeilen, während
nützliche Arbeit stattfindet, und die Unterdrückung der älteren eigenständigen Fortschrittsnachrichten
für diesen Durchlauf. Unverarbeitete Toolzeilen-Entwürfe verwenden
automatisch eine aus einem Wort bestehende Bezeichnung; eine Statusüberschrift lässt diesen redundanten Titel weg,
sofern Sie nicht ausdrücklich einen konfigurieren.

Diese Seite beschreibt die Funktionsweise von Fortschrittsentwürfen und ihre Konfigurationsoptionen. Die
vollständige Matrix der Streaming-Modi, kanalspezifische Laufzeithinweise und die Migration veralteter Schlüssel
finden Sie unter [Streaming und Aufteilung](/de/concepts/streaming).

## Was Benutzer sehen

| Bestandteil      | Zweck                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Statusüberschrift | Bei Discord und Telegram die Präambel des Modells; Discord ergänzt einen Hilfsplatzhalter. |
| Bezeichnung      | Optionale Start-/Statuszeile wie `Working`.                              |
| Fortschrittszeilen | Kompakte Laufaktualisierungen mit denselben Toolsymbolen und demselben Detailformatierer wie `/verbose`. |

Bei unverarbeitetem Toolfortschritt erscheint die Bezeichnung, sobald der Agent mit sinnvoller Arbeit beginnt
und während der anfänglichen Verzögerung beschäftigt bleibt.
Sie befindet sich am Anfang der fortlaufenden Liste von Fortschrittszeilen und wird daher aus dem sichtbaren Bereich geschoben, sobald
genügend konkrete Arbeitszeilen erscheinen. Eine Statusüberschrift zeigt nur den
allgemein verständlichen Status des Agenten an, sofern nicht ausdrücklich eine Bezeichnung konfiguriert ist. Antworten,
die ausschließlich aus einfachem Text bestehen, zeigen niemals einen Fortschrittsentwurf; eine Zeile erscheint nur bei tatsächlichen Arbeitsaktualisierungen,
beispielsweise `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
oder `✍️ Write: to /tmp/file`.

Die endgültige Antwort ersetzt den Entwurf an Ort und Stelle, wenn der Kanal dies sicher
unterstützt; andernfalls sendet OpenClaw die endgültige Antwort über die normale Zustellung und
bereinigt den Entwurf oder beendet dessen Aktualisierung (siehe [Abschluss](#finalization)).

## Modus auswählen

`channels.<channel>.streaming.mode` steuert das sichtbare Verhalten während der Verarbeitung:

| Modus      | Am besten geeignet für           | Was im Chat erscheint                             |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Ruhige Kanäle                    | Nur die endgültige Antwort.                       |
| `partial`  | Beobachten des entstehenden Antworttexts | Ein Entwurf, der mit dem neuesten Antworttext aktualisiert wird. |
| `block`    | Größere Antwortvorschauabschnitte | Eine Vorschau, die in größeren Abschnitten aktualisiert oder ergänzt wird. |
| `progress` | Toolintensive oder lang laufende Durchläufe | Ein Statusentwurf, danach die endgültige Antwort. |

Wählen Sie `progress`, wenn Benutzern wichtiger ist, „was gerade geschieht“, als
zu beobachten, wie der Antworttext Token für Token gestreamt wird; `partial`, wenn der Antworttext selbst
das Fortschrittssignal ist; `block` für größere Vorschauabschnitte. Bei Discord und
Telegram ist `streaming.mode: "block"` weiterhin Vorschau-Streaming und keine normale
Blockantwort-Zustellung — verwenden Sie dafür `streaming.block.enabled`.

## Bezeichnungen konfigurieren

Fortschrittsbezeichnungen befinden sich unter `channels.<channel>.streaming.progress`. Die standardmäßige
Bezeichnung für unverarbeitete Toolzeilen ist `"auto"`, wodurch die einfache integrierte Bezeichnung `Working`
verwendet wird. Eine Statusüberschrift blendet diese implizite Bezeichnung aus; legen Sie
`label: "auto"` ausdrücklich fest, wenn auch darüber eine Bezeichnung angezeigt werden soll:

```text
Wird bearbeitet
```

Verwenden Sie eine feste Bezeichnung:

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

Verwenden Sie Ihren eigenen Bezeichnungspool (die Auswahl erfolgt weiterhin zufällig/anhand des Seeds, wenn `label: "auto"`):

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

Blenden Sie die Bezeichnung aus und zeigen Sie nur Fortschrittszeilen an:

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

Fortschrittszeilen stammen aus tatsächlichen Laufereignissen: Toolstarts, Elementaktualisierungen, Aufgabenplänen,
Genehmigungen, Befehlsausgaben, Patch-Zusammenfassungen und ähnlichen Agentenaktivitäten.
Sie sind standardmäßig aktiviert (`progress.toolProgress`, Standardwert `true`).

Tools können außerdem typisierten Fortschritt ausgeben, während ein einzelner Aufruf noch ausgeführt wird. Dadurch
aktualisiert ein langsamer Abruf oder eine langsame Suche den sichtbaren Entwurf, bevor das Tool
sein endgültiges Ergebnis zurückgibt. Die Fortschrittsaktualisierung ist ein partielles Toolergebnis mit
leerem Modellinhalt und ausdrücklichen öffentlichen Kanalmetadaten:

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

OpenClaw rendert in der Fortschrittsoberfläche des Kanals nur `progress.text`. Das normale
Toolergebnis trifft später weiterhin als `content`/`details` ein und ist der einzige Teil,
der an das Modell zurückgegeben wird.

Wenn Sie einem Tool Fortschritt hinzufügen, geben Sie eine kurze, allgemeine Nachricht aus und verzögern Sie diese,
bis der Vorgang lange genug aussteht, damit die Anzeige nützlich ist. `web_fetch`
setzt dies mit einer Verzögerung von 5 Sekunden um:

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

Bei schnellen Aufrufen wird keine Fortschrittszeile angezeigt; bei langen Aufrufen erscheint eine, solange sie noch ausstehen;
bei abgebrochenen Aufrufen wird der Timer gelöscht, bevor veralteter Fortschritt erscheinen kann. Fortschrittstext
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

`"explain"` ist der Standardwert und hält Entwürfe mit knappen Bezeichnungen stabil.
`"raw"` hängt den zugrunde liegenden Befehl an, sofern verfügbar. Dies ist bei der
Fehlersuche nützlich, erzeugt im Chat jedoch mehr Unruhe. Beispielsweise wird ein Aufruf von `node --check /tmp/app.js`
je nach Modus unterschiedlich dargestellt:

| Modus     | Fortschrittszeile                                               |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Befehls-/Exec-Text

`streaming.progress.commandText` (Standardwert `"raw"`) steuert unabhängig vom
obigen Detailmodus, wie viele Befehlsdetails neben Exec-/Bash-Fortschrittszeilen angezeigt werden.
Setzen Sie den Wert auf `"status"`, damit eine Toolfortschrittszeile sichtbar bleibt, während
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
Kommentar-/Präambelerzählung des Modells vor der Toolausführung (💬, beispielsweise „Ich prüfe ... und
anschließend ...“) zwischen den Toolzeilen im Entwurf ein. Die
gemeinsame Konfigurationsstruktur für alle Kanäle finden Sie unter
[Streaming und Aufteilung](/de/concepts/streaming#commentary-progress-lane).

Wenn die Kommentarspur aktiviert ist, werden Präambeln nur als diese dazwischen eingefügten
💬-Zeilen dargestellt; die nachfolgende Statusüberschrift bleibt ausgeblendet, damit die Spur ihre
dokumentierte Form beibehält.

### Statusüberschrift

Bei Discord und Telegram wird im Fortschrittsmodus die typisierte Präambel des Modells vor der Toolausführung
zur Statusüberschrift des Entwurfs, sobald sie verfügbar ist. Andere
Kanäle im Fortschrittsmodus behalten ihr bestehendes Statusverhalten bei. Die Überschrift ist
standardmäßig aktiviert und umgeht bei kurzen Durchläufen nicht die normale Aktivitätsschwelle;
durch Aktivieren von `streaming.progress.commentary` werden Präambeln stattdessen an die dazwischen eingefügte
Kommentarspur übergeben.

Wenn bei Discord ein Hilfsmodell für den Agenten aufgelöst wird — ein ausdrücklich festgelegtes
[`utilityModel`](/de/gateway/config-agents#utilitymodel) oder der deklarierte Standardwert des primären
Providers für kleine Modelle (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — stellt es einen kurzen, allgemein verständlichen Platzhalter bereit,
wenn das Modell keine Präambel ausgibt oder etwa 20 Sekunden lang inaktiv war
(die Überschrift von Telegram basiert derzeit ausschließlich auf der Präambel):

```text
Das Standardmodell in Ihrer Konfiguration wird aktualisiert und anschließend das Gateway neu gestartet,
damit die Änderung übernommen wird. Ein Aufruf zur Auflistung der Agenten ist fehlgeschlagen und wird erneut versucht.
```

Die Hilfserzählung ist standardmäßig aktiviert (`streaming.progress.narration`, Standardwert
`true`) und greift niemals auf das primäre Modell zurück: Sie wird nur mit einem ausdrücklichen
`utilityModel` oder einem vom Provider deklarierten Standardwert für den primären
Provider des Agenten ausgeführt. Setzen Sie `utilityModel: ""`, um das Hilfsrouting vollständig zu deaktivieren. Toolzeilen
werden darunter weiter angesammelt und kehren zurück, wenn beide Statusquellen stoppen. Entwurfsänderungen
warten weiterhin auf die normale Aktivitätsschwelle und eine tatsächliche
Textänderung. Dies verhindert kurzes Aufblitzen bei schnellen Durchläufen und reduziert die Anzahl der Änderungen in stark ausgelasteten
Kanälen. Setzen Sie `narration: false`, um nur den Platzhalter des Hilfsmodells zu deaktivieren; Überschriften
aus Modellpräambeln bleiben aktiviert:

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

Die Eingabe für die Erzählung ist begrenzt und bereinigt: Das Hilfsmodell erhält den
Text der eingehenden Anfrage sowie dieselben kompakten, bereinigten Toolzusammenfassungen, die der Entwurf
darstellen würde — niemals unverarbeitete Befehlsausgaben oder Toolergebnisse. Mit
`commandText: "status"` lässt die Eingabe für die Erzählung außerdem Exec-/Bash-Befehlstext weg,
entsprechend der Darstellung im Entwurf.

### Zeilenbegrenzungen

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

Fortschrittszeilen werden automatisch komprimiert, um die Neuanordnung der Chatblase zu reduzieren, während
der Entwurf bearbeitet wird. Außerdem kürzt OpenClaw lange Zeilen, damit wiederholte Entwurfsänderungen
nicht bei jeder Aktualisierung zu anderen Zeilenumbrüchen führen. Das standardmäßige Budget pro Zeile beträgt 120
Zeichen; Fließtext wird an einer Wortgrenze abgeschnitten, während lange Details wie Pfade oder
unverarbeitete Befehle mit Auslassungspunkten in der Mitte gekürzt werden, damit das Ende sichtbar bleibt.

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

### Umfangreiche Darstellung (Slack)

Slack kann Fortschrittszeilen als strukturierte Block-Kit-Felder statt als
einfachen Text darstellen:

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

Bei der umfangreichen Darstellung wird neben den Block-Kit-Feldern immer derselbe einfache Textinhalt
gesendet, sodass Clients, die die umfangreichere Struktur nicht darstellen können, weiterhin den kompakten
Fortschrittstext anzeigen.

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
Tool-Fortschrittsmeldungen – der Kanal bleibt visuell ruhig, bis
die endgültige Antwort vorliegt, mit Ausnahme des Labels, sofern eines konfiguriert ist.

## Kanalverhalten

| Kanal           | Fortschrittsübertragung                  | Hinweise                                                                                                                                                  |
| --------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Eine Nachricht senden und dann bearbeiten. | Verwendet standardmäßig den Modus `progress`; die endgültige Antwort enthält einen `-#`-Aktivitätsbeleg, und der Statusentwurf wird gelöscht, nachdem die Antwort eingegangen ist. |
| Matrix          | Ein Ereignis senden und dann bearbeiten. | Die Streaming-Konfiguration auf Kontoebene steuert Entwürfe auf Kontoebene.                                                                               |
| Microsoft Teams | Nativer Teams-Stream in persönlichen Chats. | `streaming.mode: "block"` wird stattdessen der blockweisen Zustellung in Teams zugeordnet.                                                                     |
| Slack           | Nativer Stream oder bearbeitbarer Entwurfsbeitrag. | Erfordert ein Ziel in einem Antwort-Thread; direkte Nachrichten auf oberster Ebene ohne ein solches Ziel erhalten weiterhin Entwurfsvorschauen und Bearbeitungen. |
| Telegram        | Eine Nachricht senden und dann bearbeiten. | Wenn zwischen dem Fortschrittsentwurf und der Antwort eine Nachricht eingeht, wird der Entwurf darunter erneut veröffentlicht (zuerst neu veröffentlichen, dann alten löschen), anstatt im Client einen Scroll-Sprung auszulösen. |
| Mattermost      | Bearbeitbarer Entwurfsbeitrag.           | Der Modus `block` wechselt zwischen abgeschlossenem Text und Beiträgen zur Tool-Aktivität; andere Modi integrieren die Tool-Aktivität in denselben entwurfsartigen Beitrag. |

Kanäle ohne sichere Unterstützung für Bearbeitungen greifen auf Tippindikatoren oder
eine ausschließliche Zustellung der endgültigen Antwort zurück. Unter [Streaming und Aufteilung](/de/concepts/streaming) finden Sie die
vollständige Aufschlüsselung des Laufzeitverhaltens für jeden Kanal.

## Abschluss

Wenn die endgültige Antwort bereit ist, versucht OpenClaw, den Chat übersichtlich zu halten:

- Im Modus `progress` auf Discord wird die endgültige Antwort als neue Nachricht gesendet,
  an die ein kleiner `-#`-Aktivitätsbeleg angehängt wird (zum Beispiel
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`); der Statusentwurf wird
  gelöscht, sobald diese Antwort zugestellt wurde. In stark frequentierten Kanälen bleibt kein verwaistes Tool-
  Protokoll oberhalb der Antwort zurück; bei endgültigen Fehlermeldungen bleibt der Entwurf als sichtbarer Nachweis des
  fehlgeschlagenen Durchlaufs erhalten.
- Wenn der Entwurf sicher in die endgültige Antwort umgewandelt werden kann (Modi `partial`/`block`),
  bearbeitet OpenClaw ihn direkt.
- Wenn der Kanal natives Fortschritts-Streaming verwendet, schließt OpenClaw diesen
  Stream ab, sobald die native Übertragung den endgültigen Text akzeptiert.
- Andernfalls (Medien, eine Genehmigungsaufforderung, ein explizites Antwortziel, zu viele
  Abschnitte oder ein fehlgeschlagenes Bearbeiten/Senden) sendet OpenClaw die endgültige Antwort über den
  normalen Zustellungspfad des Kanals, anstatt den Entwurf zu überschreiben.

Dieses Fallback ist beabsichtigt: Eine neue endgültige Antwort zu senden ist besser, als Text zu verlieren,
eine Antwort dem falschen Thread zuzuordnen oder einen Entwurf mit Nutzdaten zu überschreiben, die der Kanal
nicht sicher darstellen kann.

## Fehlerbehebung

**Ich sehe nur die endgültige Antwort.**

Prüfen Sie, ob `channels.<channel>.streaming.mode` für das Konto
oder den Kanal, der die Nachricht verarbeitet hat, auf `progress` gesetzt ist. Einige Gruppen- oder Pfade für Antworten auf Zitate deaktivieren
Entwurfsvorschauen für einen Durchlauf, wenn der Kanal die richtige
Nachricht nicht sicher bearbeiten kann.

**Ich sehe das Label, aber keine Tool-Zeilen.**

Prüfen Sie `streaming.progress.toolProgress`. Wenn es auf `false` gesetzt ist, behält OpenClaw das
Verhalten mit einem einzelnen Entwurf bei, blendet jedoch die Fortschrittszeilen für Tools und Aufgaben aus.

**Ich sehe eine neue endgültige Nachricht anstelle eines bearbeiteten Entwurfs.**

Dabei handelt es sich um das unter [Abschluss](#finalization) beschriebene Sicherheits-Fallback. Es kann
bei Antworten mit Medien, langen Antworten, expliziten Antwortzielen, alten Telegram-
Entwürfen, fehlenden Slack-Thread-Zielen, gelöschten Vorschaunachrichten oder einem fehlgeschlagenen
Abschluss des nativen Streams auftreten.

**Ich sehe weiterhin eigenständige Fortschrittsmeldungen.**

Der Fortschrittsmodus unterdrückt standardmäßige eigenständige Tool-Fortschrittsmeldungen, solange ein
Entwurf aktiv ist. Wenn weiterhin eigenständige Meldungen erscheinen, prüfen Sie, ob der Durchlauf
tatsächlich den Modus `progress` verwendet und nicht `streaming.mode: "off"` oder einen Kanalpfad,
der für diese Nachricht keinen Entwurf erstellen kann.

**Teams verhält sich anders als Discord oder Telegram.**

Microsoft Teams verwendet in persönlichen Chats einen nativen Stream anstelle der generischen
Vorschauübertragung durch Senden und Bearbeiten und ordnet `streaming.mode: "block"` der blockweisen Zustellung in Teams zu,
da es keinen Blockmodus für Entwurfsvorschauen wie Discord und
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
