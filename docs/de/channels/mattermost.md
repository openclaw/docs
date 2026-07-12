---
read_when:
    - Mattermost einrichten
    - Debugging des Mattermost-Routings
sidebarTitle: Mattermost
summary: Mattermost-Bot-Einrichtung und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T01:25:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Status: herunterladbares Plugin (Bot-Token + WebSocket-Ereignisse). Kanäle, private Kanäle, Gruppen-DMs und DMs werden unterstützt. Mattermost ist eine selbst hostbare Plattform für Teamkommunikation ([mattermost.com](https://mattermost.com)).

## Installation

<Tabs>
  <Tab title="npm-Registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Lokaler Checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

<Steps>
  <Step title="Verfügbarkeit des Plugins sicherstellen">
    Installieren Sie `@openclaw/mattermost` mit dem obigen Befehl und starten Sie anschließend den Gateway neu, falls er bereits ausgeführt wird.
  </Step>
  <Step title="Mattermost-Bot erstellen">
    Erstellen Sie ein Mattermost-Bot-Konto, kopieren Sie das **Bot-Token** und fügen Sie den Bot den Teams und Kanälen hinzu, die er lesen soll.
  </Step>
  <Step title="Basis-URL kopieren">
    Kopieren Sie die Mattermost-**Basis-URL** (z. B. `https://chat.example.com`). Ein abschließendes `/api/v4` wird automatisch entfernt.
  </Step>
  <Step title="OpenClaw konfigurieren und Gateway starten">
    Minimale Konfiguration:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    Nicht interaktive Alternative:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Selbst gehostetes Mattermost unter einer privaten/LAN-/Tailnet-Adresse: Ausgehende Mattermost-API-Anfragen durchlaufen einen SSRF-Schutz, der private und interne IP-Adressen standardmäßig blockiert. Aktivieren Sie den Zugriff mit `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (pro Konto: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Native Slash-Befehle

Native Slash-Befehle müssen explizit aktiviert werden. Wenn sie aktiviert sind, registriert OpenClaw `oc_*`-Slash-Befehle in jedem Team, dem der Bot angehört, und empfängt Callback-POST-Anfragen auf dem HTTP-Server des Gateways.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Verwenden, wenn Mattermost den Gateway nicht direkt erreichen kann (Reverse-Proxy/öffentliche URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Registrierte Befehle: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Mit `nativeSkills: true` werden Skill-Befehle ebenfalls als `/oc_<skill>` registriert.

<AccordionGroup>
  <Accordion title="Hinweise zum Verhalten">
    - `native` und `nativeSkills` haben standardmäßig den Wert `"auto"`, der für Mattermost als deaktiviert aufgelöst wird. Setzen Sie beide explizit auf `true`.
    - `callbackPath` ist standardmäßig `/api/channels/mattermost/command`.
    - Wenn `callbackUrl` nicht angegeben ist, leitet OpenClaw `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` ab. Platzhalter-Bind-Hosts (`0.0.0.0`, `::`) fallen auf `localhost` zurück.
    - Bei Konfigurationen mit mehreren Konten kann `commands` auf oberster Ebene oder unter `channels.mattermost.accounts.<id>.commands` festgelegt werden (Kontowerte überschreiben Felder der obersten Ebene).
    - Vorhandene Slash-Befehle mit demselben Auslöser, die von anderen Integrationen erstellt wurden, bleiben unverändert (die Registrierung überspringt sie). Vom Bot erstellte Befehle werden aktualisiert oder neu erstellt, wenn sich die Callback-URL ändert.
    - Befehls-Callbacks werden anhand der Token validiert, die Mattermost für jeden Befehl zurückgibt, wenn OpenClaw die `oc_*`-Befehle registriert.
    - OpenClaw aktualisiert die aktuelle Mattermost-Befehlsregistrierung, bevor es einen Callback akzeptiert. Dadurch werden veraltete Token gelöschter oder neu generierter Slash-Befehle ohne Neustart des Gateways nicht mehr akzeptiert.
    - Die Callback-Validierung schlägt sicher geschlossen fehl, wenn die Mattermost-API nicht bestätigen kann, dass der Befehl noch aktuell ist. Fehlgeschlagene Validierungen werden kurzzeitig zwischengespeichert, gleichzeitige Abfragen werden zusammengeführt und neue Abfragen werden pro Befehl ratenbegrenzt, um den Replay-Druck zu begrenzen.
    - Slash-Callbacks schlagen sicher geschlossen fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise abgeschlossen wurde oder das Callback-Token nicht mit dem registrierten Token des aufgelösten Befehls übereinstimmt (ein für einen Befehl gültiges Token kann die vorgelagerte Validierung eines anderen Befehls nicht erreichen).
    - Akzeptierte Callbacks werden mit einer kurzlebigen Antwort „Verarbeitung läuft ...“ bestätigt; die eigentliche Antwort trifft als normale Nachricht ein.

  </Accordion>
  <Accordion title="Anforderung an die Erreichbarkeit">
    Der Callback-Endpunkt muss vom Mattermost-Server erreichbar sein.

    - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost wird auf demselben Host bzw. im selben Netzwerk-Namespace wie OpenClaw ausgeführt.
    - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` über einen Reverse-Proxy an OpenClaw weiter.
    - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; eine GET-Anfrage sollte von OpenClaw `405 Method Not Allowed` und nicht `404` zurückgeben.

  </Accordion>
  <Accordion title="Mattermost-Zulassungsliste für ausgehende Verbindungen">
    Wenn Ihr Callback auf private/Tailnet-/interne Adressen verweist, legen Sie Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` so fest, dass der Callback-Host bzw. die Callback-Domain enthalten ist.

    Verwenden Sie Host-/Domain-Einträge, keine vollständigen URLs.

    - Richtig: `gateway.tailnet-name.ts.net`
    - Falsch: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen (Standardkonto)

Legen Sie diese auf dem Gateway-Host fest, wenn Sie Umgebungsvariablen bevorzugen:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Umgebungsvariablen gelten nur für das **Standardkonto** (`default`). Andere Konten müssen Konfigurationswerte verwenden.

`MATTERMOST_URL` kann nicht über eine `.env`-Datei im Workspace festgelegt werden; siehe [`.env`-Dateien im Workspace](/de/gateway/security).
</Note>

## Chat-Modi

Mattermost antwortet automatisch auf DMs. Das Verhalten in Kanälen wird durch `chatmode` gesteuert:

<Tabs>
  <Tab title="oncall (Standard)">
    Nur bei @Erwähnungen in Kanälen antworten.
  </Tab>
  <Tab title="onmessage">
    Auf jede Kanalnachricht antworten.
  </Tab>
  <Tab title="onchar">
    Antworten, wenn eine Nachricht mit einem Auslöserpräfix beginnt.
  </Tab>
</Tabs>

Konfigurationsbeispiel:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // Standard
    },
  },
}
```

Hinweise:

- `onchar` antwortet weiterhin auf explizite @Erwähnungen.
- `channels.mattermost.requireMention` wird weiterhin berücksichtigt, `chatmode` wird jedoch bevorzugt. Kanalspezifische Einstellungen unter `groups.<channelId>.requireMention` haben Vorrang vor beiden.
- Nachdem der Bot eine sichtbare Antwort in einem Kanal-Thread gesendet hat, werden spätere Nachrichten im selben Thread ohne neue @Erwähnung oder neues `onchar`-Präfix beantwortet, sodass mehrteilige Thread-Unterhaltungen fortgeführt werden. Die Teilnahme wird sieben Tage nach der letzten Antwort des Bots in diesem Thread gespeichert und bleibt über Gateway-Neustarts hinweg erhalten. Threads, die der Bot nur beobachtet hat, sind davon nicht betroffen. Beginnen Sie eine neue Nachricht auf oberster Ebene, damit wieder eine explizite Erwähnung erforderlich ist.

## Threads und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Antworten in Kanälen und Gruppen im Hauptkanal verbleiben oder einen Thread unter dem auslösenden Beitrag beginnen.

- `off` (Standard): Nur in einem Thread antworten, wenn sich der eingehende Beitrag bereits in einem Thread befindet.
- `first`: Für Kanal-/Gruppenbeiträge auf oberster Ebene einen Thread unter diesem Beitrag beginnen und die Unterhaltung an eine Thread-bezogene Sitzung weiterleiten.
- `all` und `batched`: derzeit dasselbe Verhalten wie `first` für Mattermost, da nach dem Vorhandensein eines Thread-Stammbeitrags in Mattermost nachfolgende Abschnitte und Medien im selben Thread fortgeführt werden.
- Direktnachrichten verwenden standardmäßig `off`, selbst wenn `replyToMode` festgelegt ist.

Verwenden Sie `channels.mattermost.replyToModeByChatType`, um den Modus für Chats vom Typ `direct`, `group` oder `channel` zu überschreiben. Legen Sie `direct` fest, um Threads für Direktnachrichten zu aktivieren:

- `off` (Standard): Direktnachrichten bleiben ohne Threads in einer fortlaufenden Sitzung.
- `first`, `all` oder `batched`: Jede Direktnachricht auf oberster Ebene startet einen Mattermost-Thread, dem eine neue, unabhängige Sitzung zugrunde liegt.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Hinweise:

- Thread-bezogene Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Stamm.
- `first` und `all` sind derzeit gleichwertig, da nach dem Vorhandensein eines Thread-Stamms in Mattermost nachfolgende Abschnitte und Medien im selben Thread fortgeführt werden.
- Überschreibungen nach Chat-Typ haben Vorrang vor `replyToMode`. Ohne eine Überschreibung für `direct` behalten bestehende Installationen flache DMs ohne Threads bei.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Kopplungscode). Weitere Werte: `allowlist`, `open`, `disabled`.
- Genehmigen über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` zusammen mit `channels.mattermost.allowFrom=["*"]` (das Konfigurationsschema erzwingt den Platzhalter).
- `channels.mattermost.allowFrom` akzeptiert Benutzer-IDs (empfohlen) und Einträge vom Typ `accessGroup:<name>`. Siehe [Zugriffsgruppen](/de/channels/access-groups).

## Kanäle (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (durch Erwähnungen eingeschränkt).
- Lassen Sie Absender mit `channels.mattermost.groupAllowFrom` zu (Benutzer-IDs empfohlen).
- `channels.mattermost.groupAllowFrom` akzeptiert Einträge vom Typ `accessGroup:<name>`. Siehe [Zugriffsgruppen](/de/channels/access-groups).
- Kanalspezifische Überschreibungen für Erwähnungen befinden sich unter `channels.mattermost.groups.<channelId>.requireMention` oder als Standard unter `channels.mattermost.groups["*"].requireMention`.
- Der Abgleich von `@username` ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true` festgelegt ist.
- Offene Kanäle: `channels.mattermost.groupPolicy="open"` (durch Erwähnungen eingeschränkt).
- Auflösungsreihenfolge: `channels.mattermost.groupPolicy`, dann `channels.defaults.groupPolicy`, dann `"allowlist"`.
- Laufzeithinweis: Wenn der Abschnitt `channels.mattermost` vollständig fehlt, verwendet die Laufzeit für Gruppenprüfungen sicher geschlossen `groupPolicy="allowlist"` (selbst wenn `channels.defaults.groupPolicy` festgelegt ist) und protokolliert eine einmalige Warnung.

Beispiel:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Ziele für ausgehende Zustellung

Verwenden Sie diese Zielformate mit `openclaw message send` oder Cron/Webhooks:

| Ziel                                | Zustellung an                                                        |
| ----------------------------------- | -------------------------------------------------------------------- |
| `channel:<id>`                      | Kanal nach ID                                                        |
| `channel:<name>` oder `#channel-name` | Kanal nach Name, gesucht in allen Teams, denen der Bot angehört     |
| `user:<id>` oder `mattermost:<id>`    | DM mit diesem Benutzer                                               |
| `@username`                         | DM (Benutzername wird über die Mattermost-API aufgelöst)             |

Ausgehende Sendungen unterstützen höchstens einen Anhang pro Nachricht. Teilen Sie mehrere Dateien auf separate Sendungen auf.

<Warning>
Reine undurchsichtige IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID oder Kanal-ID).

OpenClaw löst sie **mit Vorrang für Benutzer** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` ist erfolgreich), sendet OpenClaw eine **DM**, indem es den direkten Kanal über `/api/v4/channels/direct` auflöst.
- Andernfalls wird die ID als **Kanal-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).
</Warning>

## Wiederholungsversuche für DM-Kanäle

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und zuerst den direkten Kanal auflösen muss, wiederholt es standardmäßig vorübergehend fehlgeschlagene Erstellungsversuche für direkte Kanäle.

Verwenden Sie `channels.mattermost.dmChannelRetry`, um dieses Verhalten global für das Mattermost-Plugin anzupassen, oder `channels.mattermost.accounts.<id>.dmChannelRetry` für ein einzelnes Konto. Standardwerte:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Hinweise:

- Dies gilt nur für die Erstellung von Direktnachrichtenkanälen (`/api/v4/channels/direct`), nicht für jeden Mattermost-API-Aufruf.
- Wiederholungsversuche verwenden exponentielles Backoff mit Jitter und gelten für vorübergehende Fehler wie Ratenbegrenzungen, 5xx-Antworten sowie Netzwerk- oder Zeitüberschreitungsfehler.
- 4xx-Clientfehler außer `429` werden als dauerhaft behandelt und nicht erneut versucht.

## Vorschau-Streaming

Mattermost streamt Denkprozesse, Werkzeugaktivitäten und Teile des Antworttexts in einen **Vorschauentwurf**, der direkt an Ort und Stelle finalisiert wird, sobald die endgültige Antwort sicher gesendet werden kann. Im Modus `partial` wird die Vorschau unter derselben Beitrags-ID aktualisiert, anstatt den Kanal mit Nachrichten für einzelne Abschnitte zu überfluten. Im Modus `block` wechselt die Vorschau zwischen abgeschlossenen Text- und Werkzeugaktivitätsblöcken, sodass frühere Blöcke als eigene Beiträge sichtbar bleiben, statt vom jeweils nächsten überschrieben zu werden. Abschließende Medien-/Fehlermeldungen brechen ausstehende Vorschauänderungen ab und verwenden die normale Zustellung, anstatt einen verworfenen Vorschaubeitrag zu finalisieren.

Vorschau-Streaming ist im Modus `partial` **standardmäßig aktiviert**. Konfigurieren Sie es über `channels.mattermost.streaming` (eine Moduszeichenfolge, einen booleschen Wert oder ein Objekt wie `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Streaming-Modi">
    - `partial` (Standard): ein Vorschaubeitrag, der mit zunehmender Antwortlänge bearbeitet und anschließend mit der vollständigen Antwort finalisiert wird.
    - `block` wechselt die Vorschau zwischen abgeschlossenem Text und Werkzeugaktivitätsblöcken, sodass jeder Block als eigener Beitrag sichtbar bleibt, statt direkt an Ort und Stelle überschrieben zu werden. Parallele und aufeinanderfolgende Werkzeugaktualisierungen verwenden gemeinsam den aktuellen Werkzeugaktivitätsbeitrag.
    - `progress` zeigt während der Generierung eine Statusvorschau an und veröffentlicht erst nach Abschluss die endgültige Antwort.
    - `off` deaktiviert das Vorschau-Streaming. Mit `blockStreaming: true` werden abgeschlossene Assistentenblöcke weiterhin als normale Blockantworten (separate Beiträge) statt als einzelner zusammengefasster Abschlussbeitrag zugestellt.

  </Accordion>
  <Accordion title="Hinweise zum Streaming-Verhalten">
    - Wenn der Stream nicht direkt an Ort und Stelle finalisiert werden kann (beispielsweise weil der Beitrag während des Streamings gelöscht wurde), sendet OpenClaw ersatzweise einen neuen Abschlussbeitrag, damit die Antwort nie verloren geht.
    - Nutzlasten, die ausschließlich Denkprozesse enthalten, werden in Kanalbeiträgen unterdrückt. Dies gilt auch für Text, der als `> Thinking`-Blockzitat eintrifft. Legen Sie `/reasoning on` fest, um Denkprozesse in anderen Oberflächen anzuzeigen; der Mattermost-Abschlussbeitrag enthält nur die Antwort.
    - Die Zuordnungsmatrix für Kanäle finden Sie unter [Streaming](/de/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Reaktionen (Nachrichtenwerkzeug)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Legen Sie `remove=true` (boolescher Wert) fest, um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die weitergeleitete Agentensitzung übermittelt und unterliegen denselben Richtlinienprüfungen für Direktnachrichten/Gruppen wie Nachrichten.

Beispiele:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (standardmäßig aktiviert).
- Kontospezifische Überschreibung: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Schaltflächen (Nachrichtenwerkzeug)

Senden Sie Nachrichten mit anklickbaren Schaltflächen. Wenn ein Benutzer auf eine Schaltfläche klickt, empfängt der Agent die Auswahl und kann antworten.

Schaltflächen stammen aus der semantischen `presentation`-Nutzlast (in normalen Agentenantworten und in `message action=send`). OpenClaw stellt Wertschaltflächen als interaktive Mattermost-Schaltflächen dar, lässt URL-Schaltflächen im Nachrichtentext sichtbar und stuft Auswahlmenüs zu lesbarem Text herab.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Felder für Präsentationsschaltflächen:

<ParamField path="label" type="string" required>
  Anzeigebeschriftung (Alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Beim Klicken zurückgesendeter Wert, der als Aktions-ID verwendet wird (Aliasse: `callback_data`, `callbackData`). Für eine anklickbare Schaltfläche erforderlich, sofern `url` nicht festgelegt ist.
</ParamField>
<ParamField path="url" type="string">
  Linkschaltfläche; wird im Nachrichtentext als `label: url`-Text statt als interaktive Schaltfläche dargestellt.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Schaltflächenstil. Mattermost wendet auf nicht unterstützte Werte den Standardstil an.
</ParamField>

Um die Schaltflächenunterstützung im Agenten-Systemprompt bekannt zu geben, fügen Sie `inlineButtons` zu den Kanalfunktionen hinzu:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Wenn ein Benutzer auf eine Schaltfläche klickt:

<Steps>
  <Step title="Zugriffsprüfung">
    Die klickende Person muss dieselben Richtlinienprüfungen für Direktnachrichten/Gruppen bestehen wie ein Nachrichtenabsender; bei nicht autorisierten Klicks wird ein vorübergehender Hinweis angezeigt und der Klick ignoriert.
  </Step>
  <Step title="Schaltflächen durch Bestätigung ersetzt">
    Alle Schaltflächen werden durch eine Bestätigungszeile ersetzt (z. B. „✓ **Yes** ausgewählt von @user“).
  </Step>
  <Step title="Agent empfängt die Auswahl">
    Der Agent empfängt die Auswahl als eingehende Nachricht (zusätzlich zu einem Systemereignis) und antwortet.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementierungshinweise">
    - Schaltflächen-Callbacks verwenden eine HMAC-SHA256-Verifizierung (automatisch, keine Konfiguration erforderlich).
    - Beim Klicken wird der gesamte Anhangsblock ersetzt, sodass alle Schaltflächen gemeinsam entfernt werden – eine teilweise Entfernung ist nicht möglich.
    - Aktions-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt (Einschränkung des Mattermost-Routings).
    - Klicks, deren `action_id` keiner Aktion im ursprünglichen Beitrag entspricht, werden mit `403` („Unbekannte Aktion“) abgelehnt.

  </Accordion>
  <Accordion title="Konfiguration und Erreichbarkeit">
    - `channels.mattermost.capabilities`: Array von Funktionszeichenfolgen. Fügen Sie `"inlineButtons"` hinzu, um die Werkzeugbeschreibung für Schaltflächen im Agenten-Systemprompt zu aktivieren.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Schaltflächen-Callbacks (beispielsweise `https://gateway.example.com`). Verwenden Sie diese, wenn Mattermost den Gateway unter seinem Bind-Host nicht direkt erreichen kann.
    - In Konfigurationen mit mehreren Konten können Sie dasselbe Feld auch unter `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` festlegen.
    - Wenn `interactions.callbackBaseUrl` nicht angegeben ist, leitet OpenClaw die Callback-URL aus `gateway.customBindHost` + `gateway.port` (Standardwert 18789) ab und verwendet anschließend ersatzweise `http://localhost:<port>`. Der Callback-Pfad lautet `/mattermost/interactions/<accountId>`.
    - Erreichbarkeitsregel: Die Schaltflächen-Callback-URL muss vom Mattermost-Server aus erreichbar sein. `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host beziehungsweise im selben Netzwerk-Namespace ausgeführt werden.
    - `channels.mattermost.interactions.allowedSourceIps`: Zulassungsliste für Quell-IP-Adressen von Schaltflächen-Callbacks. Ohne diese werden nur local loopback-Quellen (`127.0.0.1`, `::1`) akzeptiert. Daher muss ein entfernter Mattermost-Server hier zugelassen werden, andernfalls werden seine Klicks mit `403` abgelehnt. Legen Sie hinter einem Reverse-Proxy außerdem `gateway.trustedProxies` fest, damit die tatsächliche Client-IP aus weitergeleiteten Headern abgeleitet wird.
    - Wenn Ihr Callback-Ziel privat, im Tailnet oder intern ist, fügen Sie dessen Host/Domain in Mattermost zu `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

  </Accordion>
</AccordionGroup>

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Schaltflächen direkt über die Mattermost-REST-API veröffentlichen, statt das `message`-Werkzeug des Agenten zu verwenden. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus dem Plugin. Wenn Sie unverarbeitetes JSON veröffentlichen, beachten Sie die folgenden Regeln:

**Nutzlaststruktur:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Kritische Regeln**

1. Anhänge gehören in `props.attachments`, nicht in `attachments` auf oberster Ebene (wird ohne Meldung ignoriert).
2. Jede Aktion benötigt `type: "button"` – ohne dieses Feld werden Klicks ohne Meldung verworfen.
3. Jede Aktion benötigt ein `id`-Feld – Mattermost ignoriert Aktionen ohne IDs.
4. Die Aktions-`id` darf **nur alphanumerische Zeichen** (`[a-zA-Z0-9]`) enthalten. Bindestriche und Unterstriche unterbrechen das serverseitige Aktionsrouting von Mattermost (Rückgabe von 404). Entfernen Sie diese vor der Verwendung.
5. `context.action_id` muss mit der `id` der Schaltfläche übereinstimmen; der Gateway lehnt Klicks ab, deren `action_id` im Beitrag nicht vorhanden ist.
6. `context.action_id` ist erforderlich – ohne dieses Feld gibt der Interaktions-Handler 400 zurück.
7. Die Quell-IP-Adresse des Callbacks muss zugelassen sein (siehe `interactions.allowedSourceIps` oben).

</Warning>

**HMAC-Token-Generierung**

Der Gateway verifiziert Schaltflächenklicks mit HMAC-SHA256. Externe Skripte müssen Token generieren, die der Verifizierungslogik des Gateways entsprechen:

<Steps>
  <Step title="Geheimnis aus dem Bot-Token ableiten">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, hexadezimal codiert.
  </Step>
  <Step title="Kontextobjekt erstellen">
    Erstellen Sie das Kontextobjekt mit allen Feldern **außer** `_token`.
  </Step>
  <Step title="Mit sortierten Schlüsseln serialisieren">
    Serialisieren Sie mit **rekursiv sortierten Schlüsseln** und **ohne Leerzeichen** (der Gateway kanonisiert auch verschachtelte Objekte und erzeugt kompaktes JSON).
  </Step>
  <Step title="Nutzlast signieren">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Token hinzufügen">
    Fügen Sie den resultierenden Hex-Digest als `_token` zum Kontext hinzu.
  </Step>
</Steps>

Python-Beispiel:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Häufige HMAC-Fallstricke">
    - Pythons `json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie `separators=(",", ":")`, damit die Ausgabe dem kompakten JavaScript-Format (`{"key":"val"}`) entspricht.
    - Signieren Sie stets **alle** Kontextfelder (mit Ausnahme von `_token`). Der Gateway entfernt `_token` und signiert anschließend alle verbleibenden Felder. Das Signieren nur einer Teilmenge führt zu einem Verifizierungsfehler ohne Meldung.
    - Verwenden Sie `sort_keys=True` – der Gateway sortiert die Schlüssel vor dem Signieren, und Mattermost kann die Kontextfelder beim Speichern der Nutzlast neu anordnen.
    - Leiten Sie das Geheimnis deterministisch aus dem Bot-Token ab, nicht aus zufälligen Bytes. Das Geheimnis muss in dem Prozess, der die Schaltflächen erstellt, und im verifizierenden Gateway identisch sein.

  </Accordion>
</AccordionGroup>

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Kanal- und Benutzernamen über die Mattermost-API auflöst. Dadurch können Ziele im Format `#channel-name` und `@username` in `openclaw message send` sowie bei Cron-/Webhook-Zustellungen verwendet werden.

Es ist keine Konfiguration erforderlich – der Adapter verwendet das Bot-Token aus der Kontokonfiguration.

## Mehrere Konten

Mattermost unterstützt mehrere Konten unter `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primär", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Warnmeldungen", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Kontowerte überschreiben Felder der obersten Ebene; `channels.mattermost.defaultAccount` legt fest, welches Konto verwendet wird, wenn keines angegeben ist.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Stellen Sie sicher, dass sich der Bot im Kanal befindet, und erwähnen Sie ihn (oncall), verwenden Sie ein Auslösepräfix (onchar) oder setzen Sie `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Authentifizierungs- oder Mehrkontofehler">
    - Überprüfen Sie das Bot-Token, die Basis-URL und ob das Konto aktiviert ist.
    - Probleme mit mehreren Konten: Umgebungsvariablen gelten nur für das Konto `default`.
    - Private Mattermost-Hosts oder Mattermost-Hosts im LAN benötigen `network.dangerouslyAllowPrivateNetwork: true` (der SSRF-Schutz blockiert standardmäßig private IP-Adressen).

  </Accordion>
  <Accordion title="Native Slash-Befehle schlagen fehl">
    - `Unauthorized: invalid command token.`: OpenClaw hat das Callback-Token nicht akzeptiert. Typische Ursachen:
      - Die Registrierung des Slash-Befehls ist fehlgeschlagen oder wurde beim Start nur teilweise abgeschlossen.
      - Der Callback erreicht den falschen Gateway oder das falsche Konto.
      - Mattermost verfügt noch über alte Befehle, die auf ein früheres Callback-Ziel verweisen.
      - Der Gateway wurde neu gestartet, ohne die Slash-Befehle erneut zu aktivieren.
    - Wenn native Slash-Befehle nicht mehr funktionieren, suchen Sie in den Protokollen nach `mattermost: failed to register slash commands` oder `mattermost: native slash commands enabled but no commands could be registered`.
    - Wenn `callbackUrl` nicht angegeben ist und die Protokolle davor warnen, dass der Callback in eine Loopback-URL wie `http://localhost:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn Mattermost auf demselben Host bzw. im selben Netzwerk-Namespace wie OpenClaw ausgeführt wird. Legen Sie stattdessen eine explizite, extern erreichbare `commands.callbackUrl` fest.

  </Accordion>
  <Accordion title="Probleme mit Schaltflächen">
    - Schaltflächen werden als weiße Kästchen oder gar nicht angezeigt: Die Schaltflächendaten sind fehlerhaft. Jede Präsentationsschaltfläche benötigt ein `label` und einen `value` (Schaltflächen, denen eines davon fehlt, werden verworfen).
    - Schaltflächen werden dargestellt, aber Klicks bewirken nichts: Überprüfen Sie, ob der Gateway vom Mattermost-Server aus erreichbar ist, ob die IP-Adresse des Mattermost-Servers in `channels.mattermost.interactions.allowedSourceIps` enthalten ist (ohne diese Einstellung wird nur local loopback akzeptiert) und ob `ServiceSettings.AllowedUntrustedInternalConnections` bei privaten Zielen den Callback-Host enthält.
    - Schaltflächen geben beim Klicken den Fehler 404 zurück: Die Schaltflächen-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Der Action-Router von Mattermost funktioniert nicht mit IDs, die nicht alphanumerisch sind. Verwenden Sie ausschließlich `[a-zA-Z0-9]`.
    - Der Gateway protokolliert `rejected callback source`: Der Klick stammt von einer IP-Adresse außerhalb von `interactions.allowedSourceIps`. Setzen Sie den Mattermost-Server oder Ihren Ingress auf die Zulassungsliste und legen Sie bei Verwendung eines Reverse-Proxys `gateway.trustedProxies` fest.
    - Der Gateway protokolliert `invalid _token`: HMAC stimmt nicht überein. Stellen Sie sicher, dass Sie alle Kontextfelder signieren (nicht nur eine Teilmenge), sortierte Schlüssel und kompaktes JSON (ohne Leerzeichen) verwenden. Weitere Informationen finden Sie im obigen HMAC-Abschnitt.
    - Der Gateway protokolliert `missing _token in context`: Das Feld `_token` ist nicht im Kontext der Schaltfläche enthalten. Stellen Sie sicher, dass es beim Erstellen der Integrationsnutzlast einbezogen wird.
    - Der Gateway lehnt den Klick mit `Unknown action` ab: `context.action_id` stimmt mit keiner Action-`id` im Beitrag überein. Setzen Sie beide auf denselben bereinigten Wert.
    - Der Agent bietet keine Schaltflächen an: Fügen Sie der Mattermost-Kanalkonfiguration `capabilities: ["inlineButtons"]` hinzu.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing) – Sitzungs-Routing für Nachrichten
- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) – Verhalten von Gruppenchats und Erwähnungssteuerung
- [Kopplung](/de/channels/pairing) – DM-Authentifizierung und Kopplungsablauf
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Absicherung
