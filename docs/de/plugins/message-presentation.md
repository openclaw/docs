---
read_when:
    - Hinzufügen oder Ändern der Darstellung von Nachrichtenkarten, Diagrammen, Tabellen, Schaltflächen oder Auswahlfeldern
    - Erstellen eines Kanal-Plugins, das umfangreiche ausgehende Nachrichten unterstützt
    - Darstellungs- oder Zustellungsfunktionen des Nachrichten-Tools ändern
    - Debugging von Regressionen beim Provider-spezifischen Rendering von Karten, Blöcken und Komponenten
summary: Semantische Nachrichtendarstellungen, Diagramme, Tabellen, Steuerelemente, Fallback-Text und Zustellungshinweise für Kanal-Plugins
title: Nachrichtendarstellung
x-i18n:
    generated_at: "2026-07-12T15:34:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

Die Nachrichtendarstellung ist der gemeinsame Vertrag von OpenClaw für eine umfangreiche Benutzeroberfläche ausgehender Chats.
Damit können Agenten, CLI-Befehle, Genehmigungsabläufe und Plugins die Absicht einer Nachricht
einmal beschreiben, während jedes Kanal-Plugin sie in der bestmöglichen nativen Form darstellt.

Verwenden Sie die Darstellung für eine portable Nachrichtenoberfläche: Textabschnitte, kurze Kontext-/Fußzeilentexte,
Trennlinien, Diagramme, Tabellen, Schaltflächen, Auswahlmenüs sowie Kartentitel und -tonalität.

Fügen Sie dem gemeinsamen Nachrichtenwerkzeug keine neuen Provider-nativen Felder wie Discord-`components`, Slack-
`blocks`, Telegram-`buttons`, Teams-`card` oder Feishu-`card` hinzu. Diese sind Ausgaben des Renderers,
für die das Kanal-Plugin verantwortlich ist.

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
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Veralteter Callback-Wert. Bevorzugen Sie action für neue Steuerelemente. */
  value?: string;
  /** @deprecated Verwenden Sie eine action mit dem Typ "url". */
  url?: string;
  /** @deprecated Verwenden Sie eine action mit dem Typ "web-app". */
  webApp?: { url: string };
  /** @deprecated Verwenden Sie eine action mit dem Typ "web-app". */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** Veralteter Callback-Wert. Bevorzugen Sie action für neue Steuerelemente. */
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

- `action.type: "command"` führt einen nativen Slash-Befehl über den Befehlspfad
  des Kerns aus. Verwenden Sie dies für integrierte Befehlsschaltflächen und Menüs.
- `action.type: "callback"` überträgt undurchsichtige Plugin-Daten über den
  Interaktionspfad des Kanals. Kanal-Plugins dürfen Callback-Daten nicht als Slash-
  Befehle neu interpretieren.
- `action.type: "approval"` identifiziert eine dauerhafte Bedienergenehmigung, ihren
  expliziten Typ `exec` oder `plugin` und die angeforderte Entscheidung. Kanal-Plugins
  codieren diese Aktion in einen transportspezifischen privaten Callback und lösen sie über
  den Genehmigungsdienst auf; sie dürfen weder `/approve`-Befehlstext analysieren noch
  den Typ aus der ID ableiten.
- `action.type: "url"` öffnet einen normalen Link.
- `action.type: "web-app"` startet eine kanalnative Web-App.
- `value` ist der veraltete undurchsichtige Callback-Wert. Neue Steuerelemente sollten `action`
  verwenden, damit Kanal-Plugins Befehle und Callbacks zuordnen können, ohne anhand von Text zu raten.
- `url`, `webApp` und `web_app` werden weiterhin als veraltete Eingaben an der Schnittstellengrenze akzeptiert.
  Normalisierer bewahren diese Felder, damit Renderer zwischen ausgelieferter veralteter
  Semantik und expliziten typisierten Aktionen unterscheiden können. Neue Erzeuger sollten `action` verwenden.
- `label` ist erforderlich und wird auch im Text-Fallback verwendet.
- `style` ist eine Empfehlung. Renderer sollten nicht unterstützte Stile einem sicheren
  Standard zuordnen, statt das Senden fehlschlagen zu lassen.
- `priority` ist optional. Wenn ein Kanal Aktionslimits angibt und Steuerelemente
  entfernt werden müssen, behält der Kern zuerst Schaltflächen mit höherer Priorität bei und wahrt
  bei Schaltflächen mit gleicher Priorität die ursprüngliche Reihenfolge. Wenn alle Steuerelemente Platz finden,
  bleibt die vom Autor festgelegte Reihenfolge erhalten.
- `disabled` ist optional. Kanäle müssen die Unterstützung mit `supportsDisabled` aktivieren; andernfalls
  stuft der Kern das deaktivierte Steuerelement zu nicht interaktivem Fallback-Text herab. Eine
  deaktivierte Schaltfläche wird im Fallback-Text stets nur mit ihrer Beschriftung dargestellt, selbst wenn sie
  eine `command`-Aktion enthält.
- `reusable` ist optional. Kanäle, die wiederverwendbare native Callbacks unterstützen, können
  die Aktion nach einer erfolgreichen Interaktion weiterhin verfügbar halten. Verwenden Sie dies für
  wiederholbare oder idempotente Aktionen wie Aktualisieren, Prüfen oder weitere Details;
  lassen Sie es für normale einmalige Genehmigungen und destruktive Aktionen ungesetzt.

Semantik von Auswahlmenüs:

- `options[].action` akzeptiert nur `command` oder `callback`; Genehmigungs- und Linkaktionen sind ausschließlich für Schaltflächen vorgesehen.
- `options[].value` ist der veraltete ausgewählte Anwendungswert.
- `placeholder` ist eine Empfehlung und kann von Kanälen ohne native
  Auswahlunterstützung ignoriert werden.
- Wenn ein Kanal keine Auswahlmenüs unterstützt, listet der Fallback-Text die Beschriftungen auf.

Semantik von Diagrammen:

- `pie` erfordert positive Segmentwerte.
- `bar`, `area` und `line` verwenden ein geordnetes `categories`-Array. Jede Datenreihe
  liefert in derselben Reihenfolge genau einen endlichen Wert pro Kategorie.
- Kategoriebezeichnungen und Namen von Datenreihen müssen eindeutig sein. Ungültige oder unvollständige Diagramm-
  blöcke werden während der Normalisierung verworfen, statt Daten stillschweigend zu verändern.
- Die native Diagrammdarstellung wird über `presentationCapabilities.charts` aktiviert.
  Andere Kanäle erhalten Diagrammtitel, Achsen, Kategorien, Datenreihen und Werte
  als deterministischen Text. Dies dient zugleich als Barrierefreiheits-Fallback.

Semantik von Tabellen:

- `caption` ist eine erforderliche kurze Überschrift. `headers` muss mindestens eine
  eindeutige, nicht leere Spaltenbezeichnung enthalten.
- `rows` muss mindestens eine Zeile enthalten. Jede Zeile muss genau eine Zelle pro
  Kopfzeile besitzen, und jede Zelle muss eine nicht leere Zeichenfolge oder eine endliche Zahl sein.
- `rowHeaderColumnIndex` ist ein optionaler nullbasierter Index, der die Spalte
  angibt, deren Zellen von nativen Renderern als Zeilenüberschriften bereitgestellt werden sollen.
- Die Tabellennormalisierung ist atomar. Eine ungültige Beschriftung, Kopfzeile, Zeilenbreite, Zelle
  oder ein ungültiger Zeilenüberschriftenindex verwirft den Tabellenblock, statt
  seine Daten zu kürzen oder zu reparieren.
- Die native Tabellendarstellung wird über `presentationCapabilities.tables` aktiviert.
  Andere Kanäle erhalten die Beschriftung und jede Zeile als deterministischen linearen
  Text, wobei interne Leerzeichen zusammengefasst werden:

  ```text
  Offene Pipeline (Tabelle)
  - Konto: Acme; Phase: Gewonnen; ARR: 125000
  - Konto: Globex; Phase: Prüfung; ARR: 82000
  ```

Es gibt keinen separaten `report`-Diskriminator. Stellen Sie einen Bericht aus `title`,
`tone`, `text`, `context`, `chart`, `table` und Aktionsblöcken zusammen. Dadurch bleibt jeder
Block unabhängig darstellbar und der vollständige Bericht erhält denselben
deterministischen Text-Fallback.

## Beispiele für Erzeuger

Einfache Karte:

```json
{
  "title": "Bereitstellungsgenehmigung",
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

Schaltfläche ausschließlich mit URL-Link:

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

Senden per CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Bereitstellungsgenehmigung" \
  --presentation '{"title":"Bereitstellungsgenehmigung","tone":"warning","blocks":[{"type":"text","text":"Canary ist bereit."},{"type":"buttons","buttons":[{"label":"Genehmigen","value":"deploy:approve","style":"success"},{"label":"Ablehnen","value":"deploy:decline","style":"danger"}]}]}'
```

Angeheftete Zustellung:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Thema eröffnet" \
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

Kanal-Plugins deklarieren die Darstellungsunterstützung in ihrem Adapter für ausgehende Nachrichten:

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

Capability-Boolesche Werte beschreiben, was der Renderer interaktiv umsetzen kann. Optionale
`limits` beschreiben den generischen Rahmen, den der Kern anpassen kann, bevor er den
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

Der Core wendet vor dem Rendern generische Beschränkungen auf semantische Steuerelemente an. Renderer
bleiben für die abschließende providerspezifische Validierung und Begrenzung der Anzahl nativer Blöcke,
der Kartengröße, der URL-Limits und der Provider-Eigenheiten verantwortlich, die sich nicht im
generischen Vertrag ausdrücken lassen. Wenn die Beschränkungen alle Steuerelemente aus einem Block entfernen, behält der Core
die Beschriftungen als nicht interaktiven Kontexttext bei, sodass die zugestellte Nachricht weiterhin über eine
sichtbare Ausweichdarstellung verfügt.

## Renderablauf des Cores

Im kanonischen ausgehenden Pfad, den die CLI und standardmäßige Nachrichtenaktionen verwenden, führt der Core Folgendes aus:

1. Normalisiert die Präsentationsnutzlast.
2. Ermittelt den ausgehenden Adapter des Zielkanals.
3. Liest `presentationCapabilities`.
4. Wendet generische Funktionsbeschränkungen wie die Anzahl der Aktionen, die Länge der Beschriftungen und
   die Anzahl der Auswahloptionen an, wenn der Adapter diese angibt. Diagramm- und Tabellenblöcke
   werden in deterministischen Text umgewandelt, sofern der Adapter nicht ausdrücklich
   `charts: true` beziehungsweise `tables: true` angibt.
5. Ruft `renderPresentation` auf, wenn der Adapter die Nutzlast rendern kann.
6. Greift auf konservativen Text zurück, wenn der Adapter fehlt oder nicht rendern kann.
7. Sendet die resultierende Nutzlast über den normalen Zustellungspfad des Kanals.
8. Wendet Zustellungsmetadaten wie `delivery.pin` nach der ersten erfolgreich
   gesendeten Nachricht an.

Kanallokale Antwort- oder Vorschaupfade, die `ReplyPayload` direkt verarbeiten,
müssen entweder in diesen kanonischen Pfad eintreten oder dieselbe Ausweichdarstellung der Präsentation
erzeugen, bevor sie die Nutzlast auf einfachen Text bzw. Medien reduzieren.

Der Core ist für das Ausweichverhalten verantwortlich, damit Produzenten kanalunabhängig bleiben können. Kanal-
Plugins sind für das native Rendering und die Interaktionsverarbeitung verantwortlich.

## Regeln für die eingeschränkte Darstellung

Die Präsentation muss auch auf eingeschränkten Kanälen sicher gesendet werden können.

Der Ausweichtext enthält:

- `title` als erste Zeile
- `text`-Blöcke als normale Absätze
- `context`-Blöcke als kompakte Kontextzeilen
- `divider`-Blöcke als visuelle Trennlinie
- Schaltflächenbeschriftungen, einschließlich URLs für Link-Schaltflächen
- Beschriftungen von Auswahloptionen
- Diagrammtitel, -typ, -achsen, -kategorien, -datenreihen und -werte
- Tabellenbeschriftung, Spaltenüberschriften und jeder Zeilenwert

### Sichtbarkeit des Ersatzwerts für Schaltflächenwerte

Wenn ein Kanal keine interaktiven Steuerelemente darstellen kann, werden Schaltflächen- und Auswahlwerte als einfacher Text ausgegeben. Dieses Ausweichverhalten erhält die Benutzerfreundlichkeit und schützt gleichzeitig nicht transparent lesbare Callback-Daten:

- **`command`-typisierte Aktionen** werden als `label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`** dargestellt.
  Eingaben zeigen den URL-Text neben der Schaltflächenbeschriftung an, da die URL für
  Benutzer sichtbar ist.
- **Auswahloptionen** werden nur mit ihrer Beschriftung dargestellt. Der zugrunde liegende Optionswert wird im
  Fallback-Text nicht offengelegt.

Channel-Adapter, die in ihrer Fallback-Benutzeroberfläche Hinweise zu manuellen Befehlen ergänzen (z. B.
Anweisungen für Feishu-Dokumentkommentare), müssen die Prüfung auf das Vorhandensein eines Befehls
aus denselben Darstellungsblöcken ableiten, die der Fallback-Renderer verwendet, damit der
Hinweistext nur erscheint, wenn tatsächlich ein manueller Befehl angezeigt wird.

Nicht unterstützte native Steuerelemente sollten auf eine einfachere Darstellung zurückfallen, statt den gesamten Sendevorgang fehlschlagen zu lassen.
Beispiele:

- Wenn Inline-Schaltflächen für Telegram deaktiviert sind, wird ersatzweise Text gesendet.
- Ein Kanal ohne Unterstützung für Auswahlelemente führt die Auswahloptionen als Text auf.
- Ein Kanal ohne native Diagrammunterstützung führt die Diagrammdaten als Text auf.
- Ein Kanal ohne native Tabellenunterstützung führt jede Tabellenzeile als Text auf.
- Eine reine URL-Schaltfläche wird entweder zu einer nativen Link-Schaltfläche oder zu einer ersatzweisen URL-Zeile.
- Fehler beim optionalen Anheften führen nicht dazu, dass die zugestellte Nachricht fehlschlägt.

Die wichtigste Ausnahme ist `delivery.pin.required: true`: Wenn das Anheften als
erforderlich angefordert wird und der Kanal die gesendete Nachricht nicht anheften kann, meldet die Zustellung einen Fehler.

## Provider-Zuordnung

Aktuelle mitgelieferte Renderer:

| Kanal          | Natives Darstellungsziel                         | Hinweise                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord        | Komponenten und Komponentencontainer             | Behält das bisherige `channelData.discord.components` für vorhandene Erzeuger Provider-nativer Payloads bei; neue gemeinsame Sendevorgänge sollten jedoch `presentation` verwenden.                                                                                   |
| Feishu         | Interaktive Karten                               | Der Kartenkopf kann `title` verwenden; der Textkörper vermeidet eine Wiederholung dieses Titels.                                                                                                                                                                    |
| Matrix         | Text-Fallback plus strukturiertes Ereignisfeld   | Schaltflächen/Auswahlfelder werden als unterstützt ausgewiesen, aber jeder Block wird derzeit als Ausgabe von `renderMessagePresentationFallbackText` dargestellt, die in einem `com.openclaw.presentation`-Ereignisfeld übertragen wird, nicht als native interaktive Widgets. |
| Mattermost     | Text plus interaktive Props                      | Auswahlfelder und Trennlinien werden nicht unterstützt; diese Blöcke werden zu Text herabgestuft.                                                                                                                                                                   |
| Microsoft Teams | Adaptive Cards                                  | Einfacher `message`-Text wird zusammen mit der Karte eingefügt, wenn beides bereitgestellt wird. Auswahlfelder, Stile und der deaktivierte Zustand werden nicht unterstützt.                                                                                           |
| Slack          | Block Kit                                        | Stellt `chart` nativ als `data_visualization` und `table` nativ als `data_table` dar; behält das bisherige `channelData.slack.blocks` bei, neue gemeinsame Sendevorgänge sollten jedoch `presentation` verwenden.                                                       |
| Telegram       | Text plus Inline-Tastaturen                      | Schaltflächen/Auswahlfelder erfordern Inline-Schaltflächen-Unterstützung für die Zieloberfläche; andernfalls wird der Text-Fallback verwendet.                                                                                                                       |
| Einfache Kanäle | Text-Fallback                                   | Kanäle ohne Renderer erhalten dennoch eine lesbare Ausgabe.                                                                                                                                                                                                         |

Die Kompatibilität mit Provider-nativen Payloads ist eine Übergangshilfe für vorhandene
Antworterzeuger. Sie ist kein Grund, neue gemeinsame native Felder hinzuzufügen.

## Presentation im Vergleich zu InteractiveReply

`InteractiveReply` ist die ältere interne Teilmenge, die von Hilfsfunktionen für Genehmigungen und Interaktionen
verwendet wird. Sie unterstützt:

- Text
- Schaltflächen
- Auswahlfelder

`MessagePresentation` ist der kanonische gemeinsame Sendevertrag. Er ergänzt:

- Titel
- Tonalität
- Kontext
- Trennlinie
- Diagramm
- Tabelle
- Schaltflächen nur mit URL
- generische Zustellungsmetadaten über `ReplyPayload.delivery`

Verwenden Sie Hilfsfunktionen aus `openclaw/plugin-sdk/interactive-runtime`, wenn Sie eine Brücke zu älterem
Code herstellen:
__OC_I18N_900014__
Neuer Code sollte `MessagePresentation` direkt akzeptieren oder erzeugen. Vorhandene
`interactive`-Payloads sind eine veraltete Teilmenge von `presentation`; die Laufzeitunterstützung
für ältere Erzeuger bleibt bestehen.

Nicht veraltete Hilfsfunktionen, die Sie kennen sollten:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  validieren und konvertieren einen untypisierten Payload (beispielsweise JSON aus dem CLI-Flag
  `--presentation`) in `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` grenzt einen Block auf die Union
  `buttons` | `select` ein.
- `resolveMessagePresentationButtonAction(button)` und
  `resolveMessagePresentationOptionAction(option)` geben die kanonische typisierte
  Aktion zurück und akzeptieren dabei veraltete Grenzflächenfelder. Ein explizites `action`
  hat immer Vorrang.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` lesen nur skalare Befehls-/Callback-
  Werte. Eine nicht skalare kanonische Aktion fällt niemals auf einen
  veralteten Schattenwert `value` zurück, sodass Genehmigungs-IDs und Linkziele typisiert bleiben.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` stellen jeweils einen strukturierten
  Datenblock als deterministischen Text für kanalspezifische Fallback-Pfade dar.

Die bisherigen `InteractiveReply*`-Typen und Konvertierungshilfen sind im SDK als
`@deprecated` gekennzeichnet:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` und
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` und
`presentationToInteractiveControlsReply(...)` bleiben als Renderer-
Brücken für bisherige Kanalimplementierungen verfügbar. Neuer Erzeugercode sollte sie
nicht aufrufen; senden Sie `presentation` und überlassen Sie die Darstellung der Core-/Kanalanpassung.

Für Genehmigungshilfen gibt es ebenfalls Presentation-first-Ersatzfunktionen:

- Verwenden Sie `buildApprovalPresentationFromActionDescriptors(...)` anstelle von
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- Verwenden Sie `buildApprovalPresentation(...)` anstelle von
  `buildApprovalInteractiveReply(...)`
- Verwenden Sie `buildExecApprovalPresentation(...)` anstelle von
  `buildExecApprovalInteractiveReply(...)`

Diese ausgelieferten Builder bleiben für die Plugin-Kompatibilität befehlsbasiert. Gateway-
und gebündelter Kanalcode, der für eine dauerhafte Genehmigungsart zuständig ist, sollte
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` oder
`buildTypedPluginApprovalPendingReplyPayload(...)` verwenden, damit Transporte eine
explizite `approval`-Aktion erhalten, statt die Semantik aus `/approve`-Text abzuleiten.

`renderMessagePresentationFallbackText(...)` gibt für
Presentation-Blöcke ohne Text-Fallback eine leere Zeichenfolge zurück, beispielsweise bei einer Presentation,
die nur aus einer Trennlinie besteht. Transporte, die einen nicht leeren Sendetext benötigen, können
`emptyFallback` übergeben, um sich für einen minimalen Textkörper zu entscheiden, ohne den standardmäßigen Fallback-
Vertrag zu ändern.

## Zustellungs-Pin

Das Anheften ist ein Zustellverhalten, keine Darstellung. Verwenden Sie `delivery.pin` anstelle von
Provider-nativen Feldern wie `channelData.telegram.pin`.

Semantik:

- `pin: true` heftet die erste erfolgreich zugestellte Nachricht an.
- `pin.notify` ist standardmäßig `false`.
- `pin.required` ist standardmäßig `false`.
- Optionale Fehler beim Anheften führen zu einer abgestuften Beeinträchtigung und lassen die gesendete Nachricht unverändert.
- Erforderliche Fehler beim Anheften führen zum Fehlschlagen der Zustellung.
- Bei in Abschnitte aufgeteilten Nachrichten wird der erste zugestellte Abschnitt angeheftet, nicht der letzte Abschnitt.

Die manuellen Nachrichtenaktionen `pin`, `unpin` und `pins` sind weiterhin für vorhandene
Nachrichten verfügbar, sofern der Provider diese Vorgänge unterstützt.

## Checkliste für Plugin-Autoren

- Deklarieren Sie `presentation` über `describeMessageTool(...)`, wenn der Kanal
  die semantische Darstellung rendern oder sicher abgestuft beeinträchtigen kann.
- Fügen Sie dem ausgehenden Laufzeitadapter `presentationCapabilities` hinzu.
- Implementieren Sie `renderPresentation` im Laufzeitcode, nicht im
  Plugin-Einrichtungscode der Steuerungsebene.
- Halten Sie native UI-Bibliotheken aus häufig ausgeführten Einrichtungs- und Katalogpfaden heraus.
- Deklarieren Sie generische Fähigkeitsgrenzen unter `presentationCapabilities.limits`, wenn
  sie bekannt sind.
- Berücksichtigen Sie die endgültigen Plattformgrenzen im Renderer und in den Tests.
- Fügen Sie Fallback-Tests für nicht unterstützte Diagramme, Tabellen, Schaltflächen, Auswahlfelder, URL-
  Schaltflächen, die Duplizierung von Titel und Text sowie gemischte Sendevorgänge mit `message` und `presentation`
  hinzu.
- Fügen Sie Unterstützung für das Anheften bei der Zustellung nur über `deliveryCapabilities.pin` und
  `pinDeliveredMessage` hinzu, wenn der Provider die ID der gesendeten Nachricht anheften kann.
- Stellen Sie keine neuen Provider-nativen Karten-, Block-, Komponenten- oder Schaltflächenfelder über
  das gemeinsame Schema für Nachrichtenaktionen bereit.

## Zugehörige Dokumentation

- [Nachrichten-CLI](/de/cli/message)
- [Überblick über das Plugin SDK](/de/plugins/sdk-overview)
- [Plugin-Architektur](/de/plugins/architecture-internals#message-tool-schemas)
- [Refaktorierungsplan für die Kanaldarstellung](/de/plan/ui-channels)
