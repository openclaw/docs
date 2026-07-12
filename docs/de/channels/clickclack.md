---
read_when:
    - OpenClaw mit einem ClickClack-Workspace verbinden
    - ClickClack-Bot-Identitäten testen
summary: Einrichtung des ClickClack-Kanals mit Bot-Token und Zielsyntax
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T14:59:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack verbindet OpenClaw über erstklassige ClickClack-Bot-Tokens mit einem selbst gehosteten ClickClack-Workspace.

Verwenden Sie dies, wenn ein OpenClaw-Agent als ClickClack-Bot-Benutzer auftreten soll. ClickClack unterstützt unabhängige Service-Bots und benutzereigene Bots; benutzereigene Bots behalten eine `owner_user_id` und erhalten nur die von Ihnen gewährten Token-Bereiche.

## Schnelleinrichtung

Erstellen Sie auf dem ClickClack-Server ein Bot-Token:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Fügen Sie für einen benutzereigenen Bot `--owner <user_id>` hinzu.

Konfigurieren Sie OpenClaw:

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

Führen Sie anschließend Folgendes aus:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Ein Konto gilt nur dann als konfiguriert, wenn `baseUrl`, `token` und `workspace` vollständig festgelegt sind. `workspace` akzeptiert eine Workspace-ID (`wsp_...`), einen Slug oder einen Namen; das Gateway löst diesen beim Start in die ID auf.

### Konfigurationsschlüssel für Konten

| Schlüssel               | Standardwert        | Hinweise                                                                                |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | keiner (erforderlich) | ClickClack-Server-URL.                                                                |
| `token`                 | keiner (erforderlich) | Klartextzeichenfolge oder Geheimnisreferenz (`source: "env" \| "file" \| "exec"`).   |
| `workspace`             | keiner (erforderlich) | Workspace-ID, Slug oder Name.                                                         |
| `replyMode`             | `"agent"`           | `"agent"` führt die vollständige Agent-Pipeline aus; `"model"` sendet kurze direkte Modellantworten. |
| `defaultTo`             | `"channel:general"` | Ziel, das verwendet wird, wenn ein ausgehender Pfad kein Ziel angibt.                   |
| `allowFrom`             | `["*"]`             | Zulassungsliste mit Benutzer-IDs für eingehende Direktnachrichten und Kanalnachrichten. |
| `botUserId`             | automatisch erkannt | Wird beim Start aus der Identität des Bot-Tokens aufgelöst.                             |
| `agentId`               | Routenstandard      | Bindet die eingehenden Nachrichten dieses Kontos an einen Agenten.                      |
| `toolsAllow`            | keiner              | Werkzeug-Zulassungsliste für Agentenantworten von diesem Konto.                         |
| `model`, `systemPrompt` | keiner              | Wird für Vervollständigungen mit `replyMode: "model"` verwendet.                        |
| `reconnectMs`           | `1500`              | Verzögerung für die Echtzeit-Wiederverbindung (100 bis 60000).                          |

Wenn `plugins.allow` eine nicht leere, einschränkende Liste ist, wird durch die
explizite Auswahl von ClickClack bei der Kanaleinrichtung oder durch Ausführen
von `openclaw plugins enable clickclack` der Eintrag `clickclack` an diese Liste
angehängt. Die Installation während des Onboardings verwendet dasselbe Verhalten
bei expliziter Auswahl. Diese Pfade überschreiben weder `plugins.deny` noch eine
globale Einstellung `plugins.enabled: false`. Die direkte Ausführung von
`openclaw plugins install @openclaw/clickclack` folgt der normalen
Plugin-Installationsrichtlinie und trägt ClickClack ebenfalls in eine bestehende
Zulassungsliste ein.

## Mehrere Bots

Jedes Konto öffnet eine eigene ClickClack-Echtzeitverbindung und verwendet sein eigenes Bot-Token.

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

- `replyMode: "agent"` (Standardwert) leitet eingehende Nachrichten durch die normale Agent-Pipeline, einschließlich Sitzungsaufzeichnung und Werkzeugrichtlinie.
- `replyMode: "model"` überspringt die Agent-Pipeline und verwendet `llm.complete` der Plugin-Laufzeit für kurze direkte Bot-Antworten (optional durch `model` und `systemPrompt` gesteuert).

Im Modellmodus werden Vervollständigungen für die aufgelöste Bot-Agent-ID
ausgeführt. Dies erfordert das explizite Vertrauens-Flag
`plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

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

Lassen Sie das Vertrauens-Flag deaktiviert, wenn Sie nur den standardmäßigen
Antwortmodus `agent` verwenden; dort wird es nicht benötigt.

Verwenden Sie den Modus `agent` für dienstübergreifende Korrelationsnachweise.
Bei einer maßgeblichen ClickClack-Nachrichten-ID in ihrer kanonischen Form
`msg_<ulid>` leitet der Kanal die deterministische OpenClaw-Ausführungs-ID
`clickclack:<message-id>` ab. Jeder Modellaufruf ist dann in der Diagnose als
`clickclack:<message-id>:model:<n>` sichtbar; wenn dieser Durchlauf ClawRouter
verwendet, wird dieselbe Modellaufruf-ID als `X-Request-ID` gesendet.
Der Modus `model` umgeht die normale Diagnose für Agentenausführungen und
-sitzungen und eignet sich daher nicht für diesen Nachweispfad.

Wenn ein Echtzeitereignis eine validierte `payload.correlation_id` enthält,
überträgt der Kanal diese als `X-Correlation-ID` beim maßgeblichen Abruf der
Nachricht und bei den daraus resultierenden ClickClack-Antwortanfragen. Die Werte
verwenden ClickClacks sicheren Zeichensatz mit 128 Zeichen (`A-Z`, `a-z`, `0-9`,
`.`, `_`, `:` und `-`); ungültige Werte werden ausgelassen. Diese Verknüpfungen
enthalten ausschließlich Bezeichner, niemals Nachrichtentexte, Prompts,
Vervollständigungen, Anmeldedaten oder Werkzeugausgaben.

## Zeilen für Agentenaktivitäten

Standardmäßig zeigt ein ClickClack-Kanal während einer Agentenausführung nichts an; nur die endgültige Antwort wird veröffentlicht. Legen Sie für ein Konto `agentActivity: true` fest, um dauerhafte Nachrichtenzeilen vom Typ `agent_commentary` und `agent_tool` zu veröffentlichen, während die Ausführung läuft:

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
- **Erfordert den Token-Bereich `agent_activity:write`.** Dieser Bereich ist von `bot:write` getrennt und wird nicht von diesem geerbt; erstellen Sie das Bot-Token mit `--scopes bot:write,agent_activity:write` (oder gewähren Sie einem vorhandenen Token den Bereich), bevor Sie die Option aktivieren.
- **Bestmögliche Degradierung.** Wenn dem Token `agent_activity:write` fehlt oder der Server Aktivitätsschreibvorgänge ablehnt, werden die Fehler protokolliert und die endgültige Antwort weiterhin normal zugestellt; es erscheinen keine Aktivitätszeilen.
- Zeilen werden nach Ausführung (`turn_id`) gruppiert und so zusammengeführt, dass ein logischer Schritt einer Zeile entspricht. Werkzeugzeilen verwenden dieselbe Fortschrittsformatierung wie Discord/Slack/Telegram (Werkzeugname plus Befehlsdetails).
- **Zuordnungsmetadaten.** Vom Agenten verfasste Beiträge (Aktivitätszeilen und endgültige Antwort) enthalten die Felder `author_model` und `author_thinking`, die anhand des tatsächlich für die Ausführung verwendeten Modells aufgelöst werden (einschließlich nach einem Fallback). Server, die diese Spalten nicht definieren, ignorieren die unbekannten JSON-Felder; Server, die sie speichern, können für jede Nachricht beantworten, „welches Modell diese Zeile auf welcher Denkstufe ausgegeben hat“.

## Ziele

- `channel:<name-or-id>` sendet an einen Workspace-Kanal. Reine Ziele verwenden standardmäßig `channel:`.
- `dm:<user_id>` erstellt eine Direktunterhaltung mit diesem Benutzer oder verwendet eine bestehende.
- `thread:<message_id>` antwortet in dem Thread, der bei dieser Nachricht beginnt.

Explizite ausgehende Ziele können außerdem das Provider-Präfix `clickclack:` oder `cc:` enthalten.

Beispiele:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Berechtigungen

ClickClack-Token-Bereiche werden von der ClickClack-API durchgesetzt.

- `bot:read`: Workspace-, Kanal-, Nachrichten-, Thread-, Direktnachrichten-, Echtzeit- und Profildaten lesen.
- `bot:write`: `bot:read` sowie Kanalnachrichten, Thread-Antworten, Direktnachrichten und Uploads.
- `bot:admin`: `bot:write` sowie Kanäle erstellen.
- `agent_activity:write`: dauerhafte Agentenaktivitätszeilen (`agent_commentary` / `agent_tool`). Wird nicht von `bot:write` oder `bot:admin` geerbt; nur erforderlich, wenn `agentActivity: true` festgelegt ist.

OpenClaw benötigt für normalen Agentenchat nur `bot:write`. Fügen Sie `agent_activity:write` hinzu, wenn Sie [Zeilen für Agentenaktivitäten](#agent-activity-rows) aktivieren.

## Fehlerbehebung

- `ClickClack is not configured for account "<id>"`: Legen Sie für dieses Konto `baseUrl`, `token` (beispielsweise über `CLICKCLACK_BOT_TOKEN`) und `workspace` fest.
- `ClickClack workspace not found: <value>`: Legen Sie `workspace` auf die von ClickClack zurückgegebene Workspace-ID, den Slug oder den Namen fest.
- Keine eingehenden Antworten: Vergewissern Sie sich, dass das Token über Echtzeit-Lesezugriff verfügt, und beachten Sie, dass der Bot seine eigenen Nachrichten und Nachrichten anderer Bots ignoriert.
- Das Senden an Kanäle schlägt fehl: Stellen Sie sicher, dass der Bot Mitglied des Workspace ist und über `bot:write` verfügt.
