---
read_when:
    - Hinzufügen oder Ändern der Darstellung von Nachrichtenkarten, Diagrammen, Tabellen, Schaltflächen oder Auswahlfeldern
    - Erstellen eines Kanal-Plugins, das ausgehende Rich-Media-Nachrichten unterstützt
    - Darstellung oder Zustellungsfunktionen des Nachrichten-Tools ändern
    - Debugging Provider-spezifischer Rendering-Regressionen bei Karten, Blöcken und Komponenten
summary: Semantische Nachrichtenkarten, Diagramme, Tabellen, Steuerelemente, Fallback-Text und Zustellungshinweise für Kanal-Plugins
title: Nachrichtendarstellung
x-i18n:
    generated_at: "2026-07-24T04:45:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1fce3874c99627eb87ceb83aebe381b8a8466722703ec6322c609f187d15d9ae
    source_path: plugins/message-presentation.md
    workflow: 16
---

Die Nachrichtendarstellung ist der gemeinsame Vertrag von OpenClaw für eine umfassende Benutzeroberfläche ausgehender Chatnachrichten.
Damit können Agenten, CLI-Befehle, Genehmigungsabläufe und Plugins die
Nachrichtenabsicht einmal beschreiben, während jedes Kanal-Plugin die bestmögliche native Form rendert.

Verwenden Sie die Darstellung für eine portable Nachrichtenoberfläche: Textabschnitte, kurze Kontext-/Fußzeilentexte,
Trennlinien, Diagramme, Tabellen, Schaltflächen, Auswahlmenüs sowie Kartentitel und -tonalität.

Fügen Sie dem gemeinsam genutzten Nachrichten-Tool keine neuen Provider-nativen Felder wie Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` oder Feishu `card` hinzu. Dies sind Renderer-Ausgaben, die dem Kanal-Plugin gehören.

## Vertrag

Plugin-Autoren importieren den öffentlichen Vertrag aus:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Struktur:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | {
      type: "question";
      questionId: string;
      optionValue: string;
    }
  | { type: "url"; url: string }
  | {
      type: "web-app";
      url: string;
      widgetId?: string;
    }
  | {
      type: "web-app";
      url?: string;
      widgetId: string;
    };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  /** @deprecated Use an action with type "url". */
  url?: string;
  /** @deprecated Use an action with type "web-app". */
  webApp?: { url: string };
  /** @deprecated Use an action with type "web-app". */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semantik von Schaltflächen:

- `action.type: "command"` führt einen nativen Slash-Befehl über den Befehlspfad des Kerns
  aus. Verwenden Sie dies für integrierte Befehlsschaltflächen und Menüs.
- `action.type: "callback"` überträgt undurchsichtige Plugin-Daten über den Interaktionspfad
  des Kanals. Kanal-Plugins dürfen Callback-Daten nicht als Slash-Befehle
  neu interpretieren.
- `action.type: "approval"` identifiziert eine dauerhafte Betreiberfreigabe, deren
  explizite Art `exec` oder `plugin` und die angeforderte Entscheidung. Kanal-Plugins
  codieren diese Aktion in einen transportspezifischen privaten Callback und lösen sie über
  den Genehmigungsdienst auf; sie dürfen weder den Befehlstext `/approve` analysieren noch
  die Art aus der ID ableiten.
- `action.type: "question"` identifiziert eine Auswahl für eine aktive, zur Laufzeit erstellte
  Frage `ask_user`. Wie `approval` ist dies eine OpenClaw-Laufzeitaktion;
  Agenten und Plugins dürfen keine Frage-IDs erzeugen. Telegram, Discord und
  Slack ordnen sie transportspezifischen privaten nativen Callbacks zu und lösen die Auswahl
  über das Gateway auf. Wenn die Frage beantwortet, abgelaufen oder
  abgebrochen ist, bearbeiten diese Kanäle die zugestellte Nachricht, entfernen deren Aktionen
  und hängen den Endstatus an. WhatsApp, Signal und iMessage rendern bis zu
  vier Einfachauswahlmöglichkeiten als Reaktionen von `1️⃣` bis `4️⃣`. Andere Frageformen
  werden auf Beschriftungstext zurückgestuft, und der Benutzer kann mit einer
  Klartextantwort antworten.
- `action.type: "url"` öffnet einen normalen Link.
- `action.type: "web-app"` startet eine kanalnative Web-App. Legen Sie `url` für eine
  URL-basierte App oder `widgetId` für ein von OpenClaw gehostetes Widget fest, dessen Startmechanismus
  dem Kanal gehört; mindestens eines davon ist erforderlich. Wenn beide
  vorhanden sind, kann ein Kanal den nativen Start seines gehosteten Widgets bevorzugen und die URL
  verwenden, wenn dieser Mechanismus nicht verfügbar ist.
- `value` ist der veraltete undurchsichtige Callback-Wert. Neue Steuerelemente sollten `action`
  verwenden, damit Kanal-Plugins Befehle und Callbacks zuordnen können, ohne anhand des Textes zu raten.
- `url`, `webApp` und `web_app` werden weiterhin als veraltete Eingaben an der Schnittstellengrenze akzeptiert.
  Normalisierer behalten diese Felder bei, damit Renderer ausgelieferte veraltete
  Semantik von expliziten typisierten Aktionen unterscheiden können. Neue Erzeuger sollten `action` verwenden.
- `label` ist erforderlich und wird außerdem beim Text-Fallback verwendet.
- `style` ist eine Empfehlung. Renderer sollten nicht unterstützte Stile einem sicheren
  Standard zuordnen, statt den Versand fehlschlagen zu lassen.
- `priority` ist optional. Wenn ein Kanal Aktionslimits angibt und Steuerelemente
  verworfen werden müssen, behält der Kern Schaltflächen mit höherer Priorität zuerst bei und erhält
  bei Schaltflächen mit gleicher Priorität die ursprüngliche Reihenfolge. Wenn alle Steuerelemente passen, bleibt die vom Autor
  festgelegte Reihenfolge erhalten.
- `disabled` ist optional. Kanäle müssen sich mit `supportsDisabled` ausdrücklich dafür entscheiden; andernfalls
  stuft der Kern das deaktivierte Steuerelement auf nicht interaktiven Fallback-Text zurück. Eine
  deaktivierte Schaltfläche wird im Fallback-Text immer nur mit ihrer Beschriftung dargestellt, selbst wenn sie
  eine Aktion `command` enthält.
- `reusable` ist optional. Kanäle, die wiederverwendbare native Callbacks unterstützen, können
  die Aktion nach einer erfolgreichen Interaktion weiterhin verfügbar halten. Verwenden Sie dies für
  wiederholbare oder idempotente Aktionen wie Aktualisieren, Prüfen oder weitere Details;
  lassen Sie es für normale einmalige Genehmigungen und destruktive Aktionen ungesetzt.

Semantik von Auswahlmenüs:

- `options[].action` akzeptiert nur `command` oder `callback`; Genehmigungs- und Linkaktionen sind nur für Schaltflächen vorgesehen.
- `options[].value` ist der veraltete ausgewählte Anwendungswert.
- `placeholder` ist eine Empfehlung und kann von Kanälen ohne native
  Auswahlunterstützung ignoriert werden.
- Wenn ein Kanal keine Auswahlmenüs unterstützt, führt der Fallback-Text die Beschriftungen auf.

Semantik von Diagrammen:

- `pie` erfordert positive Segmentwerte.
- `bar`, `area` und `line` verwenden ein geordnetes Array `categories`. Jede Reihe
  liefert genau einen endlichen Wert pro Kategorie, jeweils in derselben Reihenfolge.
- Kategoriebezeichnungen und Reihennamen müssen eindeutig sein. Ungültige oder unvollständige Diagrammblöcke
  werden während der Normalisierung verworfen, statt Daten stillschweigend zu verändern.
- Die native Diagrammdarstellung wird über `presentationCapabilities.charts` ausdrücklich aktiviert.
  Andere Kanäle erhalten den Diagrammtitel, die Achsen, Kategorien, Reihen und Werte
  als deterministischen Text. Dies ist zugleich der Barrierefreiheits-Fallback.

Semantik von Tabellen:

- `caption` ist eine erforderliche kurze Überschrift. `headers` muss mindestens eine
  eindeutige, nicht leere Spaltenbezeichnung enthalten.
- `rows` muss mindestens eine Zeile enthalten. Jede Zeile muss genau eine Zelle pro
  Spaltenüberschrift aufweisen, und jede Zelle muss eine nicht leere Zeichenfolge oder eine endliche Zahl sein.
- `rowHeaderColumnIndex` ist ein optionaler nullbasierter Index, der die Spalte
  bezeichnet, deren Zellen von nativen Renderern als Zeilenüberschriften bereitgestellt werden sollen.
- Die Tabellennormalisierung erfolgt atomar. Eine ungültige Beschriftung, Spaltenüberschrift, Zeilenbreite, Zelle
  oder ein ungültiger Zeilenüberschriftenindex führt dazu, dass der Tabellenblock verworfen wird, statt
  seine Daten abzuschneiden oder zu korrigieren.
- Die native Tabellendarstellung wird über `presentationCapabilities.tables` ausdrücklich aktiviert.
  Andere Kanäle erhalten die Beschriftung und jede Zeile als deterministischen linearen
  Text, wobei interne Leerzeichen zusammengefasst werden:

  ```text
  Offene Pipeline (Tabelle)
  - Konto: Acme; Phase: Gewonnen; ARR: 125000
  - Konto: Globex; Phase: Prüfung; ARR: 82000
  ```

Es gibt keinen separaten Diskriminator `report`. Stellen Sie einen Bericht aus `title`,
`tone`, `text`, `context`, `chart`, `table` und Aktionsblöcken zusammen. Dadurch bleibt jeder
Block unabhängig renderbar, und der vollständige Bericht erhält denselben
deterministischen Text-Fallback.

## Erzeugerbeispiele

Einfache Karte:

```json
{
  "title": "Bereitstellung genehmigen",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary kann jetzt hochgestuft werden." },
    { "type": "context", "text": "Build 1234, Staging erfolgreich." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Genehmigen",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "Ablehnen",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

Schaltfläche nur mit URL-Link:

```json
{
  "blocks": [
    { "type": "text", "text": "Die Versionshinweise sind verfügbar." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Hinweise öffnen",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
    }
  ]
}
```

Telegram-Mini-App-Schaltfläche:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Starten",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

Auswahlmenü:

```json
{
  "title": "Umgebung auswählen",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Umgebung",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Produktion", "value": "env:prod" }
      ]
    }
  ]
}
```

Diagramm:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "Quartalsumsatz",
      "categories": ["Q1", "Q2", "Q3"],
      "series": [
        { "name": "Produkt", "values": [120, 145, 138] },
        { "name": "Dienstleistungen", "values": [80, 95, 104] }
      ],
      "xLabel": "Quartal",
      "yLabel": "Umsatz"
    }
  ]
}
```

Tabellenbericht:

```json
{
  "title": "Pipeline-Bericht",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "Aktuelle Verkaufschancen nach Phase." },
    {
      "type": "table",
      "caption": "Offene Pipeline",
      "headers": ["Konto", "Phase", "ARR"],
      "rows": [
        ["Acme", "Gewonnen", 125000],
        ["Globex", "Prüfung", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "Aus dem CRM-Snapshot aktualisiert." }
  ]
}
```

Versand per CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Bereitstellung genehmigen" \
  --presentation '{"title":"Bereitstellung genehmigen","tone":"warning","blocks":[{"type":"text","text":"Canary ist bereit."},{"type":"buttons","buttons":[{"label":"Genehmigen","value":"deploy:approve","style":"success"},{"label":"Ablehnen","value":"deploy:decline","style":"danger"}]}]}'
```

Angeheftete Zustellung:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Thema geöffnet" \
  --pin
```

Angeheftete Zustellung mit explizitem JSON:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderer-Vertrag

Channel-Plugins deklarieren die Rendering-Unterstützung in ihrem ausgehenden Adapter:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Fähigkeitsboolesche Werte beschreiben, welche Elemente der Renderer interaktiv umsetzen kann. Optionale
`limits` beschreiben die generische Hülle, die der Kern anpassen kann, bevor er den
Renderer aufruft:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

Der Kern wendet vor dem Rendering generische Beschränkungen auf semantische Steuerelemente an. Renderer
bleiben für die abschließende providerspezifische Validierung und Kürzung hinsichtlich der nativen Blockanzahl,
Kartengröße, URL-Beschränkungen und Provider-Eigenheiten zuständig, die nicht im
generischen Vertrag ausgedrückt werden können. Wenn Beschränkungen alle Steuerelemente aus einem Block entfernen, behält der Kern
die Beschriftungen als nicht interaktiven Kontexttext bei, damit die zugestellte Nachricht weiterhin über eine
sichtbare Ausweichdarstellung verfügt.

## Rendering-Ablauf im Kern

Im kanonischen ausgehenden Pfad, der von der CLI und standardmäßigen Nachrichtenaktionen verwendet wird, führt der Kern Folgendes aus:

1. Normalisiert die Präsentationsnutzlast.
2. Löst den ausgehenden Adapter des Ziel-Channels auf.
3. Liest `presentationCapabilities`.
4. Wendet generische Fähigkeitsbeschränkungen wie Aktionsanzahl, Beschriftungslänge und
   Anzahl der Auswahloptionen an, wenn der Adapter sie deklariert. Diagramm- und Tabellenblöcke
   werden in deterministischen Text umgewandelt, sofern der Adapter nicht ausdrücklich
   `charts: true` beziehungsweise `tables: true` deklariert.
5. Ruft `renderPresentation` auf, wenn der Adapter die Nutzlast rendern kann.
6. Greift auf konservativen Text zurück, wenn der Adapter fehlt oder nicht rendern kann.
7. Sendet die resultierende Nutzlast über den normalen Zustellungspfad des Channels.
8. Wendet Zustellungsmetadaten wie `delivery.pin` nach der ersten erfolgreich
   gesendeten Nachricht an.

Channel-lokale Antwort- oder Vorschaupfade, die `ReplyPayload` direkt verarbeiten,
müssen entweder diesen kanonischen Pfad verwenden oder dieselbe Präsentations-Ausweichdarstellung
erzeugen, bevor sie die Nutzlast auf einfachen Text/Medien reduzieren.

Der Kern ist für das Ausweichverhalten zuständig, damit Produzenten Channel-unabhängig bleiben können. Channel-
Plugins sind für natives Rendering und die Interaktionsverarbeitung zuständig.

## Regeln für die Herabstufung

Die Präsentation muss auch über eingeschränkte Channels sicher versendet werden können.

Der Ausweichtext enthält:

- `title` als erste Zeile
- `text`-Blöcke als normale Absätze
- `context`-Blöcke als kompakte Kontextzeilen
- `divider`-Blöcke als visuelle Trennlinie
- Schaltflächenbeschriftungen, einschließlich URLs für Link-Schaltflächen
- Beschriftungen von Auswahloptionen
- Diagrammtitel, Typ, Achsen, Kategorien, Reihen und Werte
- Tabellenüberschrift, Spaltenüberschriften und jeden Zeilenwert

### Sichtbarkeit von Schaltflächenwerten in der Ausweichdarstellung

Wenn ein Channel keine interaktiven Steuerelemente rendern kann, werden Schaltflächen- und Auswahlwerte
als einfacher Text dargestellt. Das Ausweichverhalten erhält die Bedienbarkeit und
hält gleichzeitig undurchsichtige Callback-Daten privat:

- **Aktionen vom Typ `command`** werden als `` label: `command` `` gerendert, damit Benutzer
  den Befehl kopieren und manuell im Channel-Eingabefeld ausführen können.
- **Aktionen vom Typ `callback`** und veraltete **`value`**-Felder werden
  ausschließlich mit ihrer Beschriftung gerendert. Der undurchsichtige Callback-Wert wird im Ausweichtext nicht offengelegt.
- **Aktionen vom Typ `approval`** werden ausschließlich mit ihrer Beschriftung gerendert. Genehmigungs-IDs und Entscheidungen sind
  Transportdaten und werden weder über generische Skalar-Hilfsfunktionen noch über Ausweichtext
  offengelegt.
- **`url`-Aktionen**, URL-gestützte **`web-app`-Aktionen** und veraltete **`url` /
  `webApp` / `web_app`**-Eingaben rendern den URL-Text neben der Schaltflächenbeschriftung,
  da die URL für Benutzer sichtbar ist. Aktionen, die ausschließlich für gehostete Widgets bestimmt sind, werden auf
  Channels ohne nativen Widget-Start ausschließlich mit ihrer Beschriftung gerendert.
- **Auswahloptionen** werden ausschließlich mit ihrer Beschriftung gerendert. Der zugrunde liegende Optionswert wird im
  Ausweichtext nicht offengelegt.

Channel-Adapter, die ihrer Ausweich-Benutzeroberfläche Hinweise zur manuellen Befehlseingabe hinzufügen (z. B.
Anweisungen für Feishu-Dokumentkommentare), müssen die Prüfung auf vorhandene Befehle
aus denselben Präsentationsblöcken ableiten, die der Ausweich-Renderer verwendet, damit der
Hinweistext nur erscheint, wenn tatsächlich ein manueller Befehl angezeigt wird.

Nicht unterstützte native Steuerelemente sollten herabgestuft werden, statt den gesamten Versand fehlschlagen zu lassen.
Beispiele:

- Telegram sendet bei deaktivierten Inline-Schaltflächen eine Text-Ausweichdarstellung.
- Ein Channel ohne Unterstützung für Auswahlfelder führt Auswahloptionen als Text auf.
- Ein Channel ohne native Diagrammunterstützung führt die Diagrammdaten als Text auf.
- Ein Channel ohne native Tabellenunterstützung führt jede Tabellenzeile als Text auf.
- Eine reine URL-Schaltfläche wird entweder zu einer nativen Link-Schaltfläche oder einer URL-Zeile in der Ausweichdarstellung.
- Optionale Fehler beim Anheften lassen die zugestellte Nachricht nicht fehlschlagen.

Die wichtigste Ausnahme ist `delivery.pin.required: true`; wenn das Anheften als
erforderlich angefordert wird und der Channel die gesendete Nachricht nicht anheften kann, meldet die Zustellung einen Fehler.

## Provider-Zuordnung

Aktuell gebündelte Renderer:

| Channel         | Natives Rendering-Ziel                    | Hinweise                                                                                                                                                                                                          |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponenten und Komponentencontainer      | Behält veraltetes `channelData.discord.components` für bestehende Produzenten providerspezifischer nativer Nutzlasten bei, neue gemeinsame Sendungen sollten jedoch `presentation` verwenden.                       |
| Feishu          | Interaktive Karten                        | Der Kartenkopf kann `title` verwenden; der Inhalt vermeidet eine Wiederholung dieses Titels.                                                                                                           |
| Matrix          | Text-Ausweichdarstellung plus strukturiertes Ereignisfeld | Schaltflächen/Auswahlfelder werden als unterstützt deklariert, aber jeder Block wird derzeit als `renderMessagePresentationFallbackText`-Ausgabe in einem `com.openclaw.presentation`-Ereignisfeld gerendert, nicht als natives interaktives Widget. |
| Mattermost      | Text plus interaktive Eigenschaften      | Auswahlfelder und Trennlinien werden nicht unterstützt; diese Blöcke werden zu Text herabgestuft.                                                                                                                 |
| Microsoft Teams | Adaptive Cards                            | Einfacher `message`-Text wird zusammen mit der Karte einbezogen, wenn beides bereitgestellt wird. Auswahlfelder, Stile und der deaktivierte Zustand werden nicht unterstützt.                              |
| Slack           | Block Kit                                 | Rendert `chart` als natives `data_visualization` und `table` als natives `data_table`; behält veraltetes `channelData.slack.blocks` bei, neue gemeinsame Sendungen sollten jedoch `presentation` verwenden. |
| Telegram        | Text plus Inline-Tastaturen               | Schaltflächen/Auswahlfelder benötigen die Inline-Schaltflächenfähigkeit für die Zieloberfläche; andernfalls wird die Text-Ausweichdarstellung verwendet.                                                          |
| Einfache Channels | Text-Ausweichdarstellung                | Channels ohne Renderer erhalten weiterhin eine lesbare Ausgabe.                                                                                                                                                  |

Die Kompatibilität mit providerspezifischen nativen Nutzlasten ist eine Übergangshilfe für bestehende
Antwortproduzenten. Sie ist kein Grund, neue gemeinsame native Felder hinzuzufügen.

## Präsentation im Vergleich zu InteractiveReply

`InteractiveReply` ist die ältere interne Teilmenge, die von Hilfsfunktionen für Genehmigungen und Interaktionen
verwendet wird. Sie unterstützt:

- Text
- Schaltflächen
- Auswahlfelder

`MessagePresentation` ist der kanonische gemeinsame Sendevertrag. Er ergänzt:

- Titel
- Ton
- Kontext
- Trennlinie
- Diagramm
- Tabelle
- reine URL-Schaltflächen
- generische Zustellungsmetadaten über `ReplyPayload.delivery`

Verwenden Sie beim Anbinden älteren Codes Hilfsfunktionen aus
`openclaw/plugin-sdk/interactive-runtime`:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  hasMessagePresentationBlocks,
  interactiveReplyToPresentation,
  isMessagePresentationInteractiveBlock,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationChartFallbackText,
  renderMessagePresentationFallbackText,
  renderMessagePresentationTableFallbackText,
  resolveMessagePresentationActionValue,
  resolveMessagePresentationButtonAction,
  resolveMessagePresentationControlValue,
  resolveMessagePresentationOptionAction,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Neuer Code sollte `MessagePresentation` direkt akzeptieren oder erzeugen. Bestehende
`interactive`-Nutzlasten sind eine veraltete Teilmenge von `presentation`; die Laufzeitunterstützung
für ältere Produzenten bleibt bestehen.

Nicht veraltete Hilfsfunktionen, die Sie kennen sollten:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  validieren und konvertieren eine untypisierte Nutzlast (zum Beispiel JSON aus dem
  `--presentation`-Flag der CLI) in `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` schränkt einen Block auf die
  Union `buttons` | `select` ein.
- `resolveMessagePresentationButtonAction(button)` und
  `resolveMessagePresentationOptionAction(option)` geben die kanonische typisierte
  Aktion zurück und akzeptieren dabei veraltete Grenzfelder. Ein explizites `action`
  hat immer Vorrang.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` lesen ausschließlich skalare
  Befehls-/Callback-Werte. Eine nicht skalare kanonische Aktion fällt niemals auf einen
  veralteten Schattenwert `value` zurück, sodass Genehmigungs-IDs und Linkziele typisiert bleiben.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` rendern einen strukturierten
  Datenblock als deterministischen Text für kanalspezifische Fallback-Pfade.

Die veralteten `InteractiveReply*`-Typen und Konvertierungshilfen sind im SDK als
`@deprecated` gekennzeichnet:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton` und
  `InteractiveReplyOption`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` und
`presentationToInteractiveControlsReply(...)` bleiben als Renderer-
Brücken für veraltete Kanalimplementierungen verfügbar. Neuer Producer-Code sollte sie
nicht aufrufen; senden Sie `presentation` und überlassen Sie das Rendering der Core-/Kanalanpassung.

Auch für Genehmigungshilfen gibt es präsentationsorientierte Ersatzlösungen:

- Verwenden Sie `buildApprovalPresentation(...)` anstelle von
  `buildApprovalInteractiveReply(...)`
- Verwenden Sie `buildExecApprovalPresentation(...)` anstelle von
  `buildExecApprovalInteractiveReply(...)`

Diese ausgelieferten Builder bleiben aus Gründen der Plugin-Kompatibilität befehlsbasiert. Gateway-
und gebündelter Kanalcode, der einen dauerhaften Genehmigungstyp verwaltet, sollte
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` oder
`buildTypedPluginApprovalPendingReplyPayload(...)` verwenden, damit Transportsysteme eine
explizite `approval`-Aktion erhalten, anstatt die Semantik aus dem `/approve`-Text abzuleiten.

`renderMessagePresentationFallbackText(...)` gibt für
Präsentationsblöcke ohne Text-Fallback, beispielsweise eine Präsentation, die
ausschließlich aus einer Trennlinie besteht, eine leere Zeichenfolge zurück. Transportsysteme, die einen nicht leeren Sendetext benötigen, können
`emptyFallback` übergeben, um einen minimalen Text zu aktivieren, ohne den standardmäßigen Fallback-
Vertrag zu ändern.

## Anheften bei der Zustellung

Das Anheften ist ein Zustellungsverhalten, keine Präsentation. Verwenden Sie `delivery.pin` anstelle von
Provider-nativen Feldern wie `channelData.telegram.pin`.

Semantik:

- `pin: true` heftet die erste erfolgreich zugestellte Nachricht an.
- `pin.notify` verwendet standardmäßig `false`.
- `pin.required` verwendet standardmäßig `false`.
- Optionale Fehler beim Anheften führen zu einer Herabstufung und lassen die gesendete Nachricht unverändert.
- Erforderliche Fehler beim Anheften lassen die Zustellung fehlschlagen.
- Bei in Blöcke aufgeteilten Nachrichten wird der erste zugestellte Block angeheftet, nicht der letzte Block.

Manuelle Nachrichtenaktionen `pin`, `unpin` und `pins` sind weiterhin für vorhandene
Nachrichten verfügbar, sofern der Provider diese Vorgänge unterstützt.

## Checkliste für Plugin-Autoren

- Deklarieren Sie `presentation` aus `describeMessageTool(...)`, wenn der Kanal eine
  semantische Präsentation rendern oder sicher herabstufen kann.
- Fügen Sie `presentationCapabilities` zum ausgehenden Laufzeitadapter hinzu.
- Implementieren Sie `renderPresentation` im Laufzeitcode, nicht im Plugin-
  Einrichtungscode der Steuerungsebene.
- Halten Sie native UI-Bibliotheken aus häufig durchlaufenen Einrichtungs-/Katalogpfaden heraus.
- Deklarieren Sie generische Fähigkeitsgrenzen in `presentationCapabilities.limits`, wenn
  diese bekannt sind.
- Behalten Sie die endgültigen Plattformgrenzen im Renderer und in den Tests bei.
- Fügen Sie Fallback-Tests für nicht unterstützte Diagramme, Tabellen, Schaltflächen, Auswahlfelder, URL-
  Schaltflächen, die Duplizierung von Titel und Text sowie gemischte Sendevorgänge mit `message` und `presentation`
  hinzu.
- Fügen Sie Unterstützung für das Anheften bei der Zustellung über `deliveryCapabilities.pin` und
  `pinDeliveredMessage` nur hinzu, wenn der Provider die ID der gesendeten Nachricht anheften kann.
- Stellen Sie keine neuen Provider-nativen Karten-/Block-/Komponenten-/Schaltflächenfelder über
  das gemeinsame Nachrichtenaktionsschema bereit.

## Zugehörige Dokumentation

- [Nachrichten-CLI](/de/cli/message)
- [Übersicht über das Plugin-SDK](/de/plugins/sdk-overview)
- [Plugin-Architektur](/de/plugins/architecture-internals#message-tool-schemas)
- [Refaktorierungsplan für die Kanalpräsentation](/de/plan/ui-channels)
