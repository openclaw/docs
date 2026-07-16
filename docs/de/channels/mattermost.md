---
read_when:
    - Mattermost einrichten
    - Debugging des Mattermost-Routings
sidebarTitle: Mattermost
summary: Mattermost-Bot-Einrichtung und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T12:43:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

Status: herunterladbares Plugin (Bot-Token + WebSocket-Ereignisse). Kanäle, private Kanäle, Gruppen-DMs und DMs werden unterstützt. Mattermost ist eine selbst hostbare Team-Messaging-Plattform ([mattermost.com](https://mattermost.com)).

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
    Minimalkonfiguration:

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

Native Slash-Befehle müssen explizit aktiviert werden. Wenn sie aktiviert sind, registriert OpenClaw `oc_*` Slash-Befehle in jedem Team, dem der Bot angehört, und empfängt Callback-POST-Anfragen auf dem HTTP-Server des Gateways.

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
    - `native` und `nativeSkills` verwenden standardmäßig `"auto"`, was für Mattermost als deaktiviert ausgewertet wird. Setzen Sie sie explizit auf `true`.
    - `callbackPath` verwendet standardmäßig `/api/channels/mattermost/command`.
    - Wenn `callbackUrl` nicht angegeben ist, leitet OpenClaw `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` ab. Wildcard-Bind-Hosts (`0.0.0.0`, `::`) greifen auf `localhost` zurück.
    - Bei Konfigurationen mit mehreren Konten kann `commands` auf oberster Ebene oder unter `channels.mattermost.accounts.<id>.commands` festgelegt werden (Kontowerte überschreiben Felder auf oberster Ebene).
    - Vorhandene Slash-Befehle mit demselben Auslöser, die von anderen Integrationen erstellt wurden, bleiben unverändert (die Registrierung überspringt sie); vom Bot erstellte Befehle werden aktualisiert oder neu erstellt, wenn sich die Callback-URL ändert.
    - Befehls-Callbacks werden anhand der befehlsspezifischen Token validiert, die Mattermost zurückgibt, wenn OpenClaw `oc_*` Befehle registriert.
    - OpenClaw aktualisiert die aktuelle Mattermost-Befehlsregistrierung, bevor jeder Callback akzeptiert wird. Dadurch werden veraltete Token gelöschter oder neu generierter Slash-Befehle ohne Neustart des Gateways nicht mehr akzeptiert.
    - Die Callback-Validierung schlägt sicher geschlossen fehl, wenn die Mattermost-API nicht bestätigen kann, dass der Befehl noch aktuell ist; fehlgeschlagene Validierungen werden kurzzeitig zwischengespeichert, gleichzeitige Abfragen werden zusammengeführt und der Start neuer Abfragen wird pro Befehl ratenbegrenzt, um den durch Replay-Versuche verursachten Druck zu begrenzen.
    - Slash-Callbacks schlagen sicher geschlossen fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise abgeschlossen wurde oder das Callback-Token nicht mit dem registrierten Token des aufgelösten Befehls übereinstimmt (ein für einen Befehl gültiges Token kann die vorgelagerte Validierung für einen anderen Befehl nicht erreichen).
    - Akzeptierte Callbacks werden mit einer flüchtigen Antwort „Verarbeitung läuft ...“ bestätigt; die eigentliche Antwort trifft als normale Nachricht ein.

  </Accordion>
  <Accordion title="Erreichbarkeitsanforderung">
    Der Callback-Endpunkt muss vom Mattermost-Server aus erreichbar sein.

    - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost wird auf demselben Host bzw. im selben Netzwerk-Namespace wie OpenClaw ausgeführt.
    - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` per Reverse-Proxy an OpenClaw weiter.
    - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; eine GET-Anfrage sollte `405 Method Not Allowed` von OpenClaw zurückgeben, nicht `404`.

  </Accordion>
  <Accordion title="Mattermost-Ausgangs-Allowlist">
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

`MATTERMOST_URL` kann nicht über eine Workspace-`.env` festgelegt werden; siehe [Workspace-.env-Dateien](/de/gateway/security).
</Note>

## Chat-Modi

Mattermost antwortet automatisch auf DMs. Das Verhalten in Channels wird durch `chatmode` gesteuert:

<Tabs>
  <Tab title="oncall (default)">
    Nur antworten, wenn in Channels eine @Erwähnung erfolgt.
  </Tab>
  <Tab title="onmessage">
    Auf jede Channel-Nachricht antworten.
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
- `channels.mattermost.requireMention` wird weiterhin berücksichtigt, aber `chatmode` wird bevorzugt. Channelspezifische `groups.<channelId>.requireMention`-Einstellungen haben Vorrang vor beiden.
- Nachdem der Bot eine sichtbare Antwort in einem Channel-Thread gesendet hat, werden spätere Nachrichten im selben Thread ohne eine neue @Erwähnung oder ein `onchar`-Präfix beantwortet, sodass Thread-Unterhaltungen über mehrere Gesprächsrunden hinweg fortgesetzt werden. Die Teilnahme wird nach der letzten Antwort des Bots in diesem Thread 7 Tage lang gespeichert und bleibt über Gateway-Neustarts hinweg erhalten. Threads, die der Bot nur beobachtet hat, sind davon nicht betroffen; beginnen Sie eine neue Nachricht auf oberster Ebene, damit wieder eine explizite Erwähnung erforderlich ist.

## Threads und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Channel- und Gruppenantworten im Haupt-Channel bleiben oder einen Thread unter dem auslösenden Beitrag beginnen.

- `off` (Standard): Nur in einem Thread antworten, wenn sich der eingehende Beitrag bereits in einem Thread befindet.
- `first`: Für Channel-/Gruppenbeiträge auf oberster Ebene einen Thread unter diesem Beitrag beginnen und die Unterhaltung an eine threadbezogene Sitzung weiterleiten.
- `all` und `batched`: Derzeit dasselbe Verhalten wie `first` für Mattermost, da nach dem Vorhandensein eines Thread-Stammbeitrags in Mattermost nachfolgende Teile und Medien im selben Thread fortgesetzt werden.
- Direktnachrichten verwenden standardmäßig `off`, selbst wenn `replyToMode` festgelegt ist.

Verwenden Sie `channels.mattermost.replyToModeByChatType`, um den Modus für Chats vom Typ `direct`, `group` oder `channel` zu überschreiben. Legen Sie `direct` fest, um Threads für Direktnachrichten zu aktivieren:

- `off` (Standard): Direktnachrichten bleiben ohne Threads in einer fortlaufenden Sitzung.
- `first`, `all` oder `batched`: Jede Direktnachricht auf oberster Ebene beginnt einen Mattermost-Thread, dem eine neue, unabhängige Sitzung zugrunde liegt.

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

- Threadbezogene Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Stamm.
- `first` und `all` sind derzeit gleichwertig, da nach dem Vorhandensein eines Thread-Stamms in Mattermost nachfolgende Teile und Medien im selben Thread fortgesetzt werden.
- Überschreibungen pro Chattyp haben Vorrang vor `replyToMode`. Ohne eine `direct`-Überschreibung behalten bestehende Bereitstellungen flache DMs ohne Threads bei.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Kopplungscode). Weitere Werte: `allowlist`, `open`, `disabled`.
- Genehmigung über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` zusammen mit `channels.mattermost.allowFrom=["*"]` (das Konfigurationsschema erzwingt den Platzhalter).
- `channels.mattermost.allowFrom` akzeptiert Benutzer-IDs (empfohlen) und `accessGroup:<name>`-Einträge. Siehe [Zugriffsgruppen](/de/channels/access-groups).

## Channels (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (Erwähnung erforderlich).
- Lassen Sie Absender mit `channels.mattermost.groupAllowFrom` zu (Benutzer-IDs empfohlen).
- `channels.mattermost.groupAllowFrom` akzeptiert `accessGroup:<name>`-Einträge. Siehe [Zugriffsgruppen](/de/channels/access-groups).
- Channelspezifische Überschreibungen der Erwähnungspflicht befinden sich unter `channels.mattermost.groups.<channelId>.requireMention` oder standardmäßig unter `channels.mattermost.groups["*"].requireMention`.
- Der Abgleich von `@username` ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Offene Channels: `channels.mattermost.groupPolicy="open"` (Erwähnung erforderlich).
- Auflösungsreihenfolge: `channels.mattermost.groupPolicy`, dann `channels.defaults.groupPolicy`, dann `"allowlist"`.
- Laufzeithinweis: Wenn der Abschnitt `channels.mattermost` vollständig fehlt, schlägt die Laufzeit bei Gruppenprüfungen geschlossen mit `groupPolicy="allowlist"` fehl (selbst wenn `channels.defaults.groupPolicy` festgelegt ist) und protokolliert einmalig eine Warnung.

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

| Ziel                                | Zustellung an                                                  |
| ----------------------------------- | -------------------------------------------------------------- |
| `channel:<id>`                      | Channel anhand der ID                                          |
| `channel:<name>` oder `#channel-name` | Channel anhand des Namens; gesucht wird in allen Teams, denen der Bot angehört |
| `user:<id>` oder `mattermost:<id>`    | DM mit diesem Benutzer                                         |
| `@username`                         | DM (Benutzername wird über die Mattermost-API aufgelöst)       |

Ausgehende Sendungen unterstützen höchstens einen Anhang pro Nachricht; teilen Sie mehrere Dateien auf separate Sendungen auf.

<Warning>
Nicht präfigierte undurchsichtige IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID oder Channel-ID).

OpenClaw löst sie **mit Vorrang für Benutzer** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` erfolgreich ist), sendet OpenClaw eine **DM**, indem der direkte Channel über `/api/v4/channels/direct` aufgelöst wird.
- Andernfalls wird die ID als **Channel-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).
</Warning>

## Wiederholungsversuche für DM-Channels

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und zuerst den direkten Kanal auflösen muss, wiederholt es standardmäßig vorübergehende Fehler beim Erstellen des direkten Kanals.

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

- Dies gilt nur für die Erstellung von DM-Kanälen (`/api/v4/channels/direct`), nicht für jeden Mattermost-API-Aufruf.
- Wiederholungsversuche verwenden exponentielles Backoff mit Jitter und gelten für vorübergehende Fehler wie Ratenbegrenzungen, 5xx-Antworten sowie Netzwerk- oder Zeitüberschreitungsfehler.
- Andere 4xx-Clientfehler als `429` gelten als dauerhaft und werden nicht erneut versucht.

## Vorschau-Streaming

Mattermost streamt Denkaktivität, Tool-Aktivität und Teile des Antworttexts in einen **Entwurfsvorschau-Beitrag**, der direkt fertiggestellt wird, sobald die endgültige Antwort sicher gesendet werden kann. Im Modus `partial` wird die Vorschau unter derselben Beitrags-ID aktualisiert, statt den Kanal mit Nachrichten für einzelne Abschnitte zu überfluten. Im Modus `block` wechselt die Vorschau zwischen abgeschlossenem Text und Tool-Aktivitätsblöcken, sodass frühere Blöcke als eigene Beiträge sichtbar bleiben, statt vom nächsten überschrieben zu werden. Endgültige Medien-/Fehlermeldungen brechen ausstehende Vorschauänderungen ab und verwenden die normale Zustellung, statt einen verworfenen Vorschau-Beitrag zu veröffentlichen.

Vorschau-Streaming ist standardmäßig **aktiviert** und verwendet den Modus `partial`. Konfigurieren Sie es über `channels.mattermost.streaming.mode` (ältere skalare/boolsche `streaming`-Werte werden durch `openclaw doctor --fix` migriert):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // aus | teilweise | Block | Fortschritt
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Streaming-Modi">
    - `partial` (Standard): ein Vorschau-Beitrag, der mit zunehmender Antwort bearbeitet und anschließend mit der vollständigen Antwort fertiggestellt wird.
    - `block` wechselt die Vorschau zwischen abgeschlossenem Text und Tool-Aktivitätsblöcken, sodass jeder Block als eigener Beitrag sichtbar bleibt, statt direkt überschrieben zu werden. Parallele und aufeinanderfolgende Tool-Aktualisierungen teilen sich den aktuellen Tool-Aktivitätsbeitrag.
    - `progress` zeigt während der Generierung eine Statusvorschau und veröffentlicht die endgültige Antwort erst nach Abschluss.
    - `off` deaktiviert das Vorschau-Streaming. Mit `streaming.block.enabled: true` werden abgeschlossene Assistentenblöcke weiterhin als normale Blockantworten (separate Beiträge) zugestellt und nicht zu einem einzigen endgültigen Beitrag zusammengeführt.

  </Accordion>
  <Accordion title="Hinweise zum Streaming-Verhalten">
    - Wenn der Stream nicht direkt fertiggestellt werden kann (beispielsweise weil der Beitrag während des Streamings gelöscht wurde), sendet OpenClaw ersatzweise einen neuen endgültigen Beitrag, damit die Antwort niemals verloren geht.
    - Nutzlasten, die ausschließlich Denkaktivität enthalten, werden in Kanalbeiträgen unterdrückt. Dies gilt auch für Text, der als `> Thinking`-Blockzitat eintrifft. Legen Sie `/reasoning on` fest, um Denkaktivität auf anderen Oberflächen anzuzeigen; der endgültige Mattermost-Beitrag enthält ausschließlich die Antwort.
    - Die Zuordnungsmatrix für Kanäle finden Sie unter [Streaming](/de/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Reaktionen (Nachrichten-Tool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Legen Sie `remove=true` (boolesch) fest, um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen oder Entfernen von Reaktionen werden als Systemereignisse an die weitergeleitete Agentensitzung übermittelt und unterliegen denselben DM-/Gruppenrichtlinienprüfungen wie Nachrichten.

Beispiele:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard: true).
- Kontospezifische Überschreibung: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Schaltflächen (Nachrichten-Tool)

Senden Sie Nachrichten mit anklickbaren Schaltflächen. Wenn eine Person auf eine Schaltfläche klickt, erhält der Agent die Auswahl und kann antworten.

Schaltflächen stammen aus der semantischen `presentation`-Nutzlast (in normalen Agentenantworten und in `message action=send`). OpenClaw stellt Werteschaltflächen als interaktive Mattermost-Schaltflächen dar, lässt URL-Schaltflächen im Nachrichtentext sichtbar und stuft Auswahlmenüs zu lesbarem Text herab.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Felder für Darstellungsschaltflächen:

<ParamField path="label" type="string" required>
  Anzeigebeschriftung (Alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Beim Klicken zurückgesendeter Wert, der als Aktions-ID verwendet wird (Aliasse: `callback_data`, `callbackData`). Für eine anklickbare Schaltfläche erforderlich, sofern `url` nicht festgelegt ist.
</ParamField>
<ParamField path="url" type="string">
  Link-Schaltfläche; wird als `label: url`-Text im Nachrichtentext statt als interaktive Schaltfläche dargestellt.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Schaltflächenstil. Mattermost wendet auf nicht unterstützte Werte den Standardstil an.
</ParamField>

Um die Unterstützung für Schaltflächen im Agenten-System-Prompt anzugeben, fügen Sie `inlineButtons` den Kanalfunktionen hinzu:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Wenn eine Person auf eine Schaltfläche klickt:

<Steps>
  <Step title="Zugriffsprüfung">
    Die klickende Person muss dieselben DM-/Gruppenrichtlinienprüfungen wie der Absender einer Nachricht bestehen; bei nicht autorisierten Klicks wird ein flüchtiger Hinweis angezeigt und der Klick ignoriert.
  </Step>
  <Step title="Schaltflächen durch Bestätigung ersetzt">
    Alle Schaltflächen werden durch eine Bestätigungszeile ersetzt (z. B. „✓ **Yes** ausgewählt von @user“).
  </Step>
  <Step title="Agent erhält die Auswahl">
    Der Agent erhält die Auswahl als eingehende Nachricht (zusammen mit einem Systemereignis) und antwortet.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementierungshinweise">
    - Schaltflächen-Callbacks verwenden eine HMAC-SHA256-Verifizierung (automatisch, keine Konfiguration erforderlich).
    - Beim Klicken wird der gesamte Anhangsblock ersetzt, sodass alle Schaltflächen gemeinsam entfernt werden – ein teilweises Entfernen ist nicht möglich.
    - Aktions-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt (Einschränkung des Mattermost-Routings).
    - Klicks, deren `action_id` keiner Aktion im ursprünglichen Beitrag entspricht, werden mit `403` („Unbekannte Aktion“) abgelehnt.

  </Accordion>
  <Accordion title="Konfiguration und Erreichbarkeit">
    - `channels.mattermost.capabilities`: Array von Funktionszeichenfolgen. Fügen Sie `"inlineButtons"` hinzu, um die Beschreibung des Schaltflächen-Tools im Agenten-System-Prompt zu aktivieren.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Schaltflächen-Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie diese, wenn Mattermost den Gateway unter dessen Bind-Host nicht direkt erreichen kann.
    - In Konfigurationen mit mehreren Konten können Sie dasselbe Feld auch unter `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` festlegen.
    - Wenn `interactions.callbackBaseUrl` weggelassen wird, leitet OpenClaw die Callback-URL aus `gateway.customBindHost` + `gateway.port` (Standard: 18789) ab und greift anschließend auf `http://localhost:<port>` zurück. Der Callback-Pfad lautet `/mattermost/interactions/<accountId>`.
    - Erreichbarkeitsregel: Die Schaltflächen-Callback-URL muss vom Mattermost-Server erreichbar sein. `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/in demselben Netzwerk-Namespace ausgeführt werden.
    - `channels.mattermost.interactions.allowedSourceIps`: Zulassungsliste für Quell-IP-Adressen von Schaltflächen-Callbacks. Ohne diese werden nur Loopback-Quellen (`127.0.0.1`, `::1`) akzeptiert. Daher muss ein entfernter Mattermost-Server hier in die Zulassungsliste aufgenommen werden, andernfalls werden seine Klicks mit `403` abgelehnt. Hinter einem Reverse-Proxy müssen Sie außerdem `gateway.trustedProxies` festlegen, damit die tatsächliche Client-IP aus weitergeleiteten Headern ermittelt wird.
    - Wenn Ihr Callback-Ziel privat/im Tailnet/intern ist, fügen Sie dessen Host/Domain zu Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

  </Accordion>
</AccordionGroup>

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Schaltflächen direkt über die Mattermost-REST-API veröffentlichen, statt das `message`-Tool des Agenten zu verwenden. Bevorzugen Sie das `message`-Tool von OpenClaw. Importieren Sie für direkte Integrationen `buildButtonAttachments` aus `@openclaw/mattermost/api.js`; wenn Sie unformatiertes JSON veröffentlichen, beachten Sie diese Regeln:

**Nutzlaststruktur:**

```json5
{
  channel_id: "<channelId>",
  message: "Option auswählen:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // nur alphanumerisch – siehe unten
            type: "button", // erforderlich, andernfalls werden Klicks stillschweigend ignoriert
            name: "Genehmigen", // Anzeigebeschriftung
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // muss mit der Schaltflächen-ID übereinstimmen
                action: "approve",
                // ... beliebige benutzerdefinierte Felder ...
                _token: "<hmac>", // siehe HMAC-Abschnitt unten
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

1. Anhänge gehören in `props.attachments`, nicht in `attachments` auf oberster Ebene (wird stillschweigend ignoriert).
2. Jede Aktion benötigt `type: "button"` – ohne dieses Feld werden Klicks stillschweigend verworfen.
3. Jede Aktion benötigt ein `id`-Feld – Mattermost ignoriert Aktionen ohne IDs.
4. Die Aktions-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche beeinträchtigen das serverseitige Aktionsrouting von Mattermost (Antwort 404). Entfernen Sie diese vor der Verwendung.
5. `context.action_id` muss mit der `id` der Schaltfläche übereinstimmen; der Gateway lehnt Klicks ab, deren `action_id` im Beitrag nicht vorhanden ist.
6. `context.action_id` ist erforderlich – der Interaktionshandler gibt ohne dieses Feld 400 zurück.
7. Die Quell-IP-Adresse des Callbacks muss zugelassen sein (siehe `interactions.allowedSourceIps` oben).

</Warning>

**HMAC-Token-Generierung**

Der Gateway verifiziert Schaltflächenklicks mit HMAC-SHA256. Externe Skripte müssen Token erzeugen, die der Verifizierungslogik des Gateways entsprechen:

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
    Fügen Sie den resultierenden hexadezimalen Digest als `_token` zum Kontext hinzu.
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
    - Pythons `json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie `separators=(",", ":")`, damit die Ausgabe dem kompakten Format von JavaScript entspricht (`{"key":"val"}`).
    - Signieren Sie stets **alle** Kontextfelder (außer `_token`). Das Gateway entfernt `_token` und signiert anschließend alle verbleibenden Felder. Wird nur eine Teilmenge signiert, schlägt die Verifizierung ohne Fehlermeldung fehl.
    - Verwenden Sie `sort_keys=True` – das Gateway sortiert die Schlüssel vor dem Signieren, und Mattermost kann die Kontextfelder beim Speichern der Nutzlast neu anordnen.
    - Leiten Sie das Geheimnis deterministisch aus dem Bot-Token ab und verwenden Sie keine zufälligen Bytes. Das Geheimnis muss in dem Prozess, der die Schaltflächen erstellt, und im Gateway, das sie verifiziert, identisch sein.

  </Accordion>
</AccordionGroup>

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Kanal- und Benutzernamen über die Mattermost-API auflöst. Dies ermöglicht Ziele vom Typ `#channel-name` und `@username` in `openclaw message send` sowie bei Cron-/Webhook-Zustellungen.

Es ist keine Konfiguration erforderlich – der Adapter verwendet das Bot-Token aus der Kontokonfiguration.

## Mehrere Konten

Mattermost unterstützt mehrere Konten unter `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Kontowerte überschreiben Felder der obersten Ebene; `channels.mattermost.defaultAccount` legt fest, welches Konto verwendet wird, wenn keines angegeben ist.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Stellen Sie sicher, dass sich der Bot im Kanal befindet, und erwähnen Sie ihn (oncall), verwenden Sie ein Auslöserpräfix (onchar) oder setzen Sie `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Authentifizierungs- oder Mehrkontenfehler">
    - Prüfen Sie das Bot-Token, die Basis-URL und ob das Konto aktiviert ist.
    - Probleme mit mehreren Konten: Umgebungsvariablen gelten nur für das Konto `default`.
    - Private Mattermost-Hosts oder Mattermost-Hosts im LAN benötigen `network.dangerouslyAllowPrivateNetwork: true` (der SSRF-Schutz blockiert private IP-Adressen standardmäßig).

  </Accordion>
  <Accordion title="Native Slash-Befehle schlagen fehl">
    - `Unauthorized: invalid command token.`: OpenClaw hat das Callback-Token nicht akzeptiert. Typische Ursachen:
      - Die Registrierung des Slash-Befehls ist beim Start fehlgeschlagen oder wurde nur teilweise abgeschlossen.
      - Der Callback erreicht das falsche Gateway/Konto.
      - Mattermost enthält noch alte Befehle, die auf ein früheres Callback-Ziel verweisen.
      - Das Gateway wurde neu gestartet, ohne die Slash-Befehle erneut zu aktivieren.
    - Wenn native Slash-Befehle nicht mehr funktionieren, prüfen Sie die Protokolle auf `mattermost: failed to register slash commands` oder `mattermost: native slash commands enabled but no commands could be registered`.
    - Wenn `callbackUrl` nicht angegeben ist und die Protokolle davor warnen, dass der Callback in eine Loopback-URL wie `http://localhost:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn Mattermost auf demselben Host bzw. im selben Netzwerk-Namespace wie OpenClaw ausgeführt wird. Legen Sie stattdessen explizit einen extern erreichbaren Wert für `commands.callbackUrl` fest.

  </Accordion>
  <Accordion title="Probleme mit Schaltflächen">
    - Schaltflächen erscheinen als weiße Kästchen oder gar nicht: Die Schaltflächendaten sind fehlerhaft. Jede Darstellungsschaltfläche benötigt einen Wert für `label` und `value` (Schaltflächen, bei denen einer davon fehlt, werden verworfen).
    - Schaltflächen werden dargestellt, aber Klicks bewirken nichts: Vergewissern Sie sich, dass das Gateway vom Mattermost-Server aus erreichbar ist, die IP-Adresse des Mattermost-Servers in `channels.mattermost.interactions.allowedSourceIps` enthalten ist (ohne diese Angabe wird nur Loopback akzeptiert) und `ServiceSettings.AllowedUntrustedInternalConnections` bei privaten Zielen den Callback-Host enthält.
    - Schaltflächen geben beim Anklicken 404 zurück: Der Wert `id` der Schaltfläche enthält wahrscheinlich Bindestriche oder Unterstriche. Der Aktionsrouter von Mattermost funktioniert nicht mit nicht alphanumerischen IDs. Verwenden Sie ausschließlich `[a-zA-Z0-9]`.
    - Das Gateway protokolliert `rejected callback source`: Der Klick stammt von einer IP-Adresse außerhalb von `interactions.allowedSourceIps`. Setzen Sie den Mattermost-Server oder Ihren Ingress auf die Positivliste und legen Sie hinter einem Reverse-Proxy `gateway.trustedProxies` fest.
    - Das Gateway protokolliert `invalid _token`: Die HMAC-Werte stimmen nicht überein. Prüfen Sie, ob Sie alle Kontextfelder und nicht nur eine Teilmenge signieren, sortierte Schlüssel verwenden und kompaktes JSON ohne Leerzeichen nutzen. Weitere Informationen finden Sie im vorstehenden Abschnitt zu HMAC.
    - Das Gateway protokolliert `missing _token in context`: Das Feld `_token` befindet sich nicht im Kontext der Schaltfläche. Stellen Sie sicher, dass es beim Erstellen der Integrationsnutzlast enthalten ist.
    - Das Gateway weist den Klick mit `Unknown action` zurück: `context.action_id` stimmt mit keiner Aktions-`id` im Beitrag überein. Setzen Sie beide auf denselben bereinigten Wert.
    - Der Agent bietet keine Schaltflächen an: Fügen Sie der Mattermost-Kanalkonfiguration `capabilities: ["inlineButtons"]` hinzu.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing) – Sitzungs-Routing für Nachrichten
- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [Gruppen](/de/channels/groups) – Verhalten von Gruppenchats und Steuerung durch Erwähnungen
- [Kopplung](/de/channels/pairing) – DM-Authentifizierung und Kopplungsablauf
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Absicherung
