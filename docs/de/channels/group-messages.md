---
read_when:
    - WhatsApp-Gruppen gezielt konfigurieren
    - Ändern der WhatsApp-Aktivierungsmodi (`mention` gegenüber `always`)
    - Optimierung von WhatsApp-Gruppensitzungsschlüsseln oder des Kontexts ausstehender Nachrichten
sidebarTitle: WhatsApp groups
summary: Verarbeitung von WhatsApp-Gruppennachrichten — Aktivierung, Positivlisten, Sitzungen und Kontextinjektion
title: WhatsApp-Gruppennachrichten
x-i18n:
    generated_at: "2026-07-12T15:00:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Informationen zum kanalübergreifenden Gruppenmodell (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo) finden Sie unter [Gruppen](/de/channels/groups). Diese Seite beschreibt das WhatsApp-spezifische Verhalten, das dieses Modell ergänzt: Aktivierung, Gruppen-Zulassungslisten, sitzungsbezogene Schlüssel pro Gruppe und die Einbindung des Kontexts ausstehenden Nachrichten.

Ziel: OpenClaw soll in WhatsApp-Gruppen präsent sein, nur bei direkter Erwähnung aktiv werden und diesen Thread von der persönlichen Direktnachrichten-Sitzung getrennt halten.

<Note>
`agents.list[].groupChat.mentionPatterns` wird gemeinsam mit der Erwähnungsfilterung der anderen Kanäle verwendet. Legen Sie es bei Multi-Agent-Konfigurationen für jeden Agenten einzeln fest oder verwenden Sie `messages.groupChat.mentionPatterns` als globalen Fallback. Ist keines von beiden festgelegt, werden die Muster aus dem Namen/Emoji der Agentenidentität abgeleitet.
</Note>

## Verhalten

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert einen Ping: eine echte WhatsApp-@-Erwähnung (`mentionedJids`), ein konfiguriertes Regex-Muster, die E.164-Ziffern des Bots an beliebiger Stelle im Text oder eine zitierte Antwort auf eine Nachricht des Bots (außer bei Selbstchat-Konfigurationen mit gemeinsam genutzter Nummer). `always` aktiviert den Agenten bei jeder Nachricht, aber der eingefügte Gruppen-Prompt weist ihn an, nur zu antworten, wenn dies einen Mehrwert bietet, und andernfalls das exakte Stille-Token `NO_REPLY` (ohne Berücksichtigung der Groß-/Kleinschreibung) zurückzugeben. Die Standardwerte stammen aus der Konfiguration (`channels.whatsapp.groups` `requireMention`) und können pro Gruppe über `/activation` überschrieben werden.
- Gruppen-Zulassungsliste: Wenn `channels.whatsapp.groups` festgelegt ist, werden nur aufgeführte Gruppen-JIDs zugelassen (fügen Sie `"*"` hinzu, um alle zuzulassen); Nachrichten aus nicht aufgeführten Gruppen werden verworfen und ein entsprechender Hinweis wird protokolliert.
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Fallback: explizites `channels.whatsapp.allowFrom`). Der Standardwert ist `allowlist` (blockiert, bis Sie Absender hinzufügen).
- Sitzungen pro Gruppe: Sitzungsschlüssel haben das Format `agent:<agentId>:whatsapp:group:<jid>` (bei Konten, die nicht dem Standardkonto entsprechen, wird `:thread:whatsapp-account-<accountId>` angehängt), sodass Direktiven wie `/verbose on`, `/trace on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe beschränkt sind; der Status persönlicher Direktnachrichten bleibt unberührt.
- Kontexteinfügung: **nur ausstehende** Gruppennachrichten (standardmäßig 50), die _keinen_ Lauf ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, wobei die auslösende Zeile unter `[Current message - respond to this]` steht. Das Fenster der ausstehenden Nachrichten wird nach dem Lauf geleert; bereits in der Sitzung enthaltene Nachrichten werden nicht erneut eingefügt.
- Absenderzuordnung: Jede Gruppenzeile enthält die Absenderbezeichnung innerhalb des Nachrichtenumschlags, z. B. `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`; außerdem werden die Absenderidentität sowie Gruppenbetreff und -mitglieder im nicht vertrauenswürdigen Block mit Konversationsmetadaten mitgeführt.
- Flüchtige/einmalig anzeigbare Nachrichten: Wrapper werden vor dem Extrahieren von Text und Erwähnungen entfernt, sodass darin enthaltene Pings weiterhin auslösen.
- Gruppen-System-Prompt: Beim ersten Turn einer Gruppensitzung (und bei jedem Turn, nachdem `/activation` den Modus geändert hat) werden Aktivierungshinweise in den System-Prompt eingefügt (`Activation: trigger-only ...` oder `Activation: always-on ...`, zusätzlich zu „den jeweiligen Absender direkt ansprechen“). Dauerhafte Hinweise zur Zustellung in Gruppenchats („Sie befinden sich in einem WhatsApp-Gruppenchat ...“) sind immer enthalten.

## Konfigurationsbeispiel (WhatsApp)

Sorgen Sie dafür, dass Erwähnungen über den Anzeigenamen auch dann funktionieren, wenn WhatsApp das sichtbare `@` aus dem Textkörper entfernt:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // Kontextfenster für ausstehende Gruppennachrichten (Standardwert: 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Hinweise:

- Bei den regulären Ausdrücken wird die Groß-/Kleinschreibung nicht berücksichtigt, und es gelten dieselben Schutzmechanismen für sichere reguläre Ausdrücke wie bei anderen Konfigurationsoberflächen für reguläre Ausdrücke; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt. Daher ist der Rückgriff auf die Nummer nur selten erforderlich, stellt aber ein nützliches Sicherheitsnetz dar.
- Das Fenster für den ausstehenden Kontext wird in folgender Reihenfolge aufgelöst: `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Aktivierungsbefehl (nur für Eigentümer)

Verwenden Sie den Gruppenchat-Befehl:

- `/activation mention`
- `/activation always`

Nur Inhabernummern (aus `channels.whatsapp.allowFrom` oder, falls nicht festgelegt, die eigene E.164-Nummer des Bots) können dies ändern; `/activation` von allen anderen wird ignoriert und nur als Kontext gespeichert. Senden Sie `/status` als eigenständige Nachricht in der Gruppe, um den aktuellen Aktivierungsmodus anzuzeigen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (auf dem OpenClaw ausgeführt wird) der Gruppe hinzu.
2. Schreiben Sie `@openclaw ...` (oder geben Sie die Nummer an). Nur Absender auf der Zulassungsliste können den Agenten auslösen, sofern Sie nicht `groupPolicy: "open"` festlegen.
3. Der Agenten-Prompt enthält den ausstehenden Gruppenkontext sowie mit Absendern gekennzeichnete Zeilen, damit der Agent die richtige Person ansprechen kann.
4. Sitzungsanweisungen (`/verbose on`, `/trace on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche Direktnachrichtensitzung bleibt davon unabhängig.

## Tests/Überprüfung

- Manueller Smoke-Test:
  - Senden Sie in der Gruppe einen `@openclaw`-Ping und bestätigen Sie, dass die Antwort auf den Namen des Absenders Bezug nimmt.
  - Senden Sie einen zweiten Ping und überprüfen Sie, ob der Verlaufsblock enthalten ist und beim nächsten Durchlauf geleert wird.
- Prüfen Sie die Gateway-Protokolle (mit `--verbose` ausführen) auf Einträge vom Typ `inbound web message`, die `from: <groupJid>` und den mit dem Absender gekennzeichneten Nachrichtentext enthalten.

## Bekannte Aspekte

- Heartbeats werden in der Hauptsitzung des Agenten ausgeführt; in Gruppensitzungen werden niemals Heartbeat-Läufe ausgeführt.
- Die Echounterdrückung merkt sich pro Sitzung den kombinierten Prompt (Verlauf und aktuelle Nachricht), damit die eigenen zugestellten Nachrichten des Bots ihn nicht erneut auslösen; ein identischer wiederholter Stapel kann als Echo übersprungen werden.
- Einträge im Sitzungsspeicher erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im agentenspezifischen SQLite-Sitzungsspeicher; ein fehlender Eintrag bedeutet lediglich, dass die Gruppe noch keinen Lauf ausgelöst hat.
- Tippindikatoren folgen `session.typingMode` / `agents.defaults.typingMode`. Wenn sichtbare Antworten nur über das Nachrichtenwerkzeug aktiviert sind, beginnt die Tippanzeige standardmäßig sofort, sodass Gruppenmitglieder sehen können, dass der Agent arbeitet, auch wenn keine automatische abschließende Antwort veröffentlicht wird. Eine explizite Konfiguration des Tippmodus hat weiterhin Vorrang.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Kanalrouting](/de/channels/channel-routing)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
