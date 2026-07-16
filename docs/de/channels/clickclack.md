---
read_when:
    - OpenClaw mit einem ClickClack-Arbeitsbereich verbinden
    - Testen von ClickClack-Bot-Identitäten
summary: Einrichtung des ClickClack-Kanals mit Bot-Token und Zielsyntax
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T12:25:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack verbindet OpenClaw über erstklassige ClickClack-Bot-Tokens mit einem selbst gehosteten ClickClack-Workspace.

Verwenden Sie dies, wenn ein OpenClaw-Agent als ClickClack-Bot-Benutzer erscheinen soll. ClickClack unterstützt unabhängige Service-Bots und benutzereigene Bots; benutzereigene Bots behalten eine `owner_user_id` und erhalten nur die von Ihnen gewährten Token-Berechtigungsbereiche.

## Schnelleinrichtung

Öffnen Sie in ClickClack **Workspace settings → Integrations → OpenClaw**, erstellen Sie einen
Bot und kopieren Sie dessen Token. Konfigurieren Sie anschließend den Kanal:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` akzeptiert eine Workspace-ID (`wsp_...`), einen Slug oder einen Anzeigenamen.
`channels add` überprüft nach dem Speichern Server, Token und Workspace und
meldet anschließend, ob das laufende Gateway das neue Konto übernommen hat. Wenn OpenClaw
bereits ausgeführt wird, stellt ClickClack automatisch eine Verbindung her und es ist kein zweiter Befehl
erforderlich. Starten Sie es andernfalls mit:

```bash
openclaw gateway
```

Führen Sie für die geführte Einrichtung Folgendes aus:

```bash
openclaw onboard
```

Wählen Sie ClickClack aus und geben Sie bei Aufforderung die Server-URL, das Bot-Token und den Workspace
ein. Die geführte Einrichtung überprüft nach dem Speichern Server, Token und Workspace; eine
fehlgeschlagene Prüfung verwirft die Konfiguration nicht.

### Alternative: umgebungsvariablenbasiertes Token

Das Standardkonto kann `CLICKCLACK_BOT_TOKEN` lesen, anstatt ein Token
in der Konfiguration zu speichern:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Benannte Konten müssen ein konfiguriertes Token oder eine Token-Datei verwenden; die gemeinsame
Umgebungsvariable ist absichtlich auf das Standardkonto beschränkt.

### JSON5-Referenz

Die entsprechende Konfigurationsstruktur lautet:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Ein Konto gilt nur dann als konfiguriert, wenn `baseUrl`, eine Token-Quelle und
`workspace` festgelegt sind. Eine Token-Quelle kann für das Standardkonto `token`, `tokenFile` oder
`CLICKCLACK_BOT_TOKEN` sein. `workspace` akzeptiert eine Workspace-
ID (`wsp_...`), einen Slug oder einen Namen; das Gateway löst diesen beim Start in die ID auf.

### Konfigurationsschlüssel für Konten

| Schlüssel                | Standardwert        | Hinweise                                                                                |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | keiner (erforderlich) | ClickClack-Server-URL.                                                                  |
| `token`                 | keiner              | Bot-Token als Klartextzeichenfolge oder Geheimnisreferenz (`source: "env" \| "file" \| "exec"`).        |
| `tokenFile`             | keiner              | Pfad zu einer Bot-Token-Datei; hat Vorrang vor `token`.                                |
| `workspace`             | keiner (erforderlich) | Workspace-ID, Slug oder Name.                                                           |
| `replyMode`             | `"agent"`           | `"agent"` führt die vollständige Agent-Pipeline aus; `"model"` sendet kurze direkte Modellvervollständigungen. |
| `defaultTo`             | `"channel:general"` | Ziel, das verwendet wird, wenn ein ausgehender Pfad kein Ziel angibt.                   |
| `allowFrom`             | `["*"]`             | Zulassungsliste mit Benutzer-IDs für eingehende Direktnachrichten und Kanalnachrichten. |
| `botUserId`             | automatisch erkannt | Wird beim Start aus der Identität des Bot-Tokens ermittelt.                             |
| `agentId`               | Routing-Standardwert | Ordnet die eingehenden Nachrichten dieses Kontos fest einem Agenten zu.                 |
| `toolsAllow`            | keiner              | Werkzeug-Zulassungsliste für Agentenantworten von diesem Konto.                         |
| `model`, `systemPrompt` | keiner              | Wird von `replyMode: "model"`-Vervollständigungen verwendet.                                               |
| `commandMenu`           | `true`              | Veröffentlicht native Befehle für die Autovervollständigung im ClickClack-Editor.       |
| `reconnectMs`           | `1500`              | Verzögerung bei Echtzeit-Wiederverbindungen (100 bis 60000).                            |

Wenn `plugins.allow` eine nicht leere einschränkende Liste ist, wird durch die explizite Auswahl von
ClickClack bei der Kanaleinrichtung oder durch die Ausführung von `openclaw plugins enable clickclack`
`clickclack` an diese Liste angehängt. Die Installation beim Onboarding verwendet dasselbe
Verhalten bei expliziter Auswahl. Diese Pfade überschreiben weder `plugins.deny` noch eine
globale `plugins.enabled: false`-Einstellung. Die direkte Ausführung von
`openclaw plugins install @openclaw/clickclack` folgt der normalen
Plugin-Installationsrichtlinie und trägt ClickClack außerdem in eine vorhandene Zulassungsliste ein.

## Mehrere Bots

Jedes Konto öffnet eine eigene ClickClack-Echtzeitverbindung und verwendet ein eigenes Bot-Token.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Antwortmodi

- `replyMode: "agent"` (Standard) leitet eingehende Nachrichten durch die normale Agent-Pipeline, einschließlich Sitzungsaufzeichnung und Werkzeugrichtlinie.
- `replyMode: "model"` überspringt die Agent-Pipeline und verwendet `llm.complete` der Plugin-Laufzeit für direkte Bot-Antworten, die optional durch `model` und `systemPrompt` gestaltet werden. Der ausgewählte Provider und das Modell bestimmen das Vervollständigungsbudget.

Der Modellmodus führt Vervollständigungen mit der aufgelösten Bot-Agenten-ID aus, wofür das explizite
Vertrauensbit `plugins.entries.clickclack.llm.allowAgentIdOverride: true`
erforderlich ist:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Lassen Sie das Vertrauensbit deaktiviert, wenn Sie nur den standardmäßigen Antwortmodus `agent` verwenden; dort ist es
nicht erforderlich.

## Befehlsmenü

Beim Start des Gateways veröffentlicht jedes konfigurierte Konto die nativen
OpenClaw-Befehle in ClickClack. Sie erscheinen in der Autovervollständigung des Editors und sind mit dem
Handle des Bots gekennzeichnet. Die veröffentlichte Menge wird bei jedem Start vollständig ersetzt.
Dies umfasst auch das Löschen eines veralteten Menüs, wenn der Katalog nativer Befehle leer ist.

Die Synchronisierung des Befehlsmenüs ist standardmäßig aktiviert. Legen Sie für ein Konto `commandMenu: false`
fest, um sie zu deaktivieren:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

Das Token benötigt `commands:write`. Die aktuellen ClickClack-Pakete `bot:write` und
`bot:admin` enthalten diesen Berechtigungsbereich; er kann auch einzeln gewährt
werden. Bei Tokens, die vor der Einführung von Befehlsmenüs erstellt wurden, muss der
Berechtigungsbereich möglicherweise hinzugefügt oder das Token ersetzt werden.

Die Synchronisierung erfolgt nach bestem Bemühen und einmal pro Gateway-Start. Ein fehlender Berechtigungsbereich oder
Netzwerkfehler protokolliert eine Warnung; ein älterer ClickClack-Server ohne den Endpunkt protokolliert
auf Debug-Ebene. Keiner dieser Fehler blockiert den Echtzeitstart. Menüs bleiben
verfügbar, während der Agent offline ist, und werden entfernt, wenn der Bot den
Workspace verlässt.

Diese Version veröffentlicht ausschließlich Spezifikationen nativer Befehle. Aliasse sowie
Skill-, Plugin- oder benutzerdefinierte Befehlskataloge werden dem Menü nicht hinzugefügt. Wenn ein
Name außerdem als HTTP-Slash-Befehl registriert ist, führt ClickClack zuerst diese
Registrierung aus; andere Menübefehle werden weiterhin über die normale
Nachrichtenzustellung verarbeitet.

Verwenden Sie den Modus `agent` für dienstübergreifende Korrelationsnachweise. Für eine maßgebliche
ClickClack-Nachrichten-ID in ihrer kanonischen Form `msg_<ulid>` leitet der Kanal
die deterministische OpenClaw-Ausführungs-ID `clickclack:<message-id>` ab. Jeder Modellaufruf ist
anschließend in der Diagnose als `clickclack:<message-id>:model:<n>` sichtbar; wenn diese
Interaktion ClawRouter verwendet, wird dieselbe Modellaufruf-ID als `X-Request-ID` gesendet.
Der Modus `model` umgeht die normale Diagnose von Agentenausführungen und Sitzungen und ist daher
für diesen Nachweispfad nicht geeignet.

Wenn ein Echtzeitereignis einen validierten `payload.correlation_id` enthält, überträgt der
Kanal ihn als `X-Correlation-ID` beim maßgeblichen Nachrichtenabruf und
den daraus resultierenden ClickClack-Antwortanfragen. Die Werte verwenden ClickClacks sichere
128-Zeichen-Menge (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` und `-`); ungültige Werte
werden ausgelassen. Diese Verknüpfungen enthalten ausschließlich Bezeichner, niemals Nachrichtentexte,
Prompts, Vervollständigungen, Zugangsdaten oder Werkzeugausgaben.

## Dauerhafte Medienzustellung

Agentenantworten mit Medien verwenden zwingend eine dauerhafte Zustellung. OpenClaw weist
vor dem ersten ClickClack-Schreibvorgang stabile Nachrichten- und Upload-Nonces pro Teil zu, sodass
bei einem erneuten Versuch derselbe Upload und dieselbe Nachricht wiederverwendet werden, anstatt Speicherkontingent
zu verbrauchen oder Duplikate zu veröffentlichen. Wenn nach einem Neustart bereits ein Upload vorhanden ist,
liest OpenClaw weder den ursprünglichen lokalen Pfad noch die Remote-Medien-URL erneut.

Dieser Wiederherstellungsvertrag erfordert einen ClickClack-Server, der Folgendes unterstützt:

- `GET /api/uploads/by-nonce` mit
  `X-ClickClack-Upload-Nonce: supported` sowohl bei gefundenen als auch bei fehlenden Ergebnissen.
- `GET /api/messages/by-nonce` mit
  `X-ClickClack-Message-Nonce: supported` sowohl bei gefundenen als auch bei fehlenden Ergebnissen.
- Idempotente Nachrichtenerstellung und Zuordnung von Anhängen für dieselbe
  inhaberbezogene Nonce und denselben Upload.

Der generische 404-Fehler eines älteren Servers gilt nicht als Nachweis dafür, dass eine Sendung nicht vorhanden ist.
OpenClaw lässt die Zustellung ungeklärt, anstatt ein Duplikat zu riskieren; aktualisieren Sie
ClickClack, bevor Sie Agentenantworten aktivieren, die Medien erzeugen.

## Zeilen zur Agentenaktivität

Standardmäßig zeigt ein ClickClack-Kanal während einer laufenden Agenteninteraktion nichts an; nur die endgültige Antwort wird veröffentlicht. Legen Sie für ein Konto `agentActivity: true` fest, um während der laufenden Interaktion dauerhafte Nachrichtenzeilen für `agent_commentary` und `agent_tool` zu veröffentlichen:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Anforderungen und Verhalten:

- **Standardmäßig deaktiviert.** Standardinstallationen und ältere ClickClack-Server bleiben unverändert.
- **Erfordert den Token-Berechtigungsbereich `agent_activity:write`.** Dieser Berechtigungsbereich ist von `bot:write` getrennt und wird nicht von diesem übernommen; erstellen Sie das Bot-Token mit `--scopes bot:write,agent_activity:write` (oder gewähren Sie einem vorhandenen Token den Berechtigungsbereich), bevor Sie die Option aktivieren.
- **Abstufung nach bestem Bemühen.** Wenn dem Token `agent_activity:write` fehlt oder der Server das Schreiben von Aktivitäten ablehnt, werden die Fehler protokolliert und die endgültige Antwort dennoch normal zugestellt; es erscheinen keine Aktivitätszeilen.
- Zeilen werden pro Interaktion gruppiert (`turn_id`) und so zusammengeführt, dass ein logischer Schritt einer Zeile entspricht; Werkzeugzeilen verwenden dieselbe Fortschrittsformatierung wie Discord/Slack/Telegram (Werkzeugname plus Befehlsdetails).
- **Zuordnungsmetadaten.** Vom Agenten verfasste Beiträge (Aktivitätszeilen und die endgültige Antwort) enthalten die Felder `author_model` und `author_thinking`, die aus dem tatsächlich für die Interaktion verwendeten Modell ermittelt werden (auch nach einem Fallback). Server, die diese Spalten nicht definieren, ignorieren die unbekannten JSON-Felder; Server, die sie speichern, können pro Nachricht die Frage „Welches Modell hat diese Zeile auf welcher Denkstufe ausgegeben?“ beantworten.

## Ziele

- `channel:<name-or-id>` sendet an einen Workspace-Kanal. Reine Ziele verwenden standardmäßig `channel:`.
- `dm:<user_id>` erstellt eine Direktunterhaltung mit diesem Benutzer oder verwendet eine vorhandene.
- `thread:<message_id>` antwortet in dem Thread, dessen Ausgangspunkt diese Nachricht ist.

Explizite ausgehende Ziele können auch das Provider-Präfix `clickclack:` oder `cc:` enthalten.

Ausgehende Medien verwenden die Upload-API von ClickClack und hängen anschließend den dauerhaften Upload
an die erstellte Kanalnachricht, Thread-Antwort oder Direktnachricht an. Lokale Dateien und unterstützte
Remote-Medien-URLs unterliegen der normalen Medienzugriffsrichtlinie von OpenClaw, mit einem Limit von 64 MiB
pro Datei. Dauerhaft in die Warteschlange gestellte Sendevorgänge verwenden für jeden Upload und Nachrichtenteil
separate, dem Eigentümer zugeordnete Nonces und versuchen dann erneut, die Anhänge mit denselben
Objekten zu verknüpfen. Informationen zum Serververtrag und Wiederherstellungsverhalten finden Sie unter
[Dauerhafte Medienzustellung](#durable-media-delivery).

Beispiele:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Berechtigungen

ClickClack-Token-Berechtigungsbereiche werden von der ClickClack-API durchgesetzt.

- `bot:read`: Workspace-/Kanal-/Nachrichten-/Thread-/Direktnachrichten-/Echtzeit-/Profildaten lesen.
- `bot:write`: `bot:read` sowie Kanalnachrichten, Thread-Antworten, Direktnachrichten, Uploads und die Veröffentlichung des Befehlsmenüs.
- `bot:admin`: `bot:write` sowie die Kanalerstellung.
- `commands:write`: das Befehlsmenü des Bots veröffentlichen. In den aktuellen Paketen `bot:write` und `bot:admin` enthalten und einzeln erteilbar.
- `agent_activity:write`: dauerhafte Zeilen zur Agentenaktivität (`agent_commentary` / `agent_tool`). Wird nicht von `bot:write` oder `bot:admin` übernommen; nur erforderlich, wenn `agentActivity: true` festgelegt ist.

OpenClaw benötigt für den normalen Agenten-Chat und die Synchronisierung des Befehlsmenüs nur das aktuelle `bot:write`. Fügen Sie `agent_activity:write` hinzu, wenn Sie [Zeilen zur Agentenaktivität](#agent-activity-rows) aktivieren.

## Fehlerbehebung

- `ClickClack is not configured for account "<id>"`: Legen Sie für dieses Konto `baseUrl`, `token` (beispielsweise über `CLICKCLACK_BOT_TOKEN`) und `workspace` fest.
- `ClickClack workspace not found: <value>`: Legen Sie `workspace` auf die von ClickClack zurückgegebene Workspace-ID, den Slug oder den Namen fest.
- Keine eingehenden Antworten: Vergewissern Sie sich, dass das Token über Echtzeit-Lesezugriff verfügt, und beachten Sie, dass der Bot seine eigenen Nachrichten und Nachrichten anderer Bots ignoriert.
- Das Senden an Kanäle schlägt fehl: Vergewissern Sie sich, dass der Bot Mitglied des Workspace ist und über `bot:write` verfügt.
- Kein Befehlsmenü: Vergewissern Sie sich, dass `commandMenu` nicht `false` ist, der ClickClack-Server `PUT /api/bots/self/commands` unterstützt und das Token über `commands:write` verfügt.
