---
read_when:
    - WhatsApp-Gruppen gezielt konfigurieren
    - Ändern der WhatsApp-Aktivierungsmodi (`mention` gegenüber `always`)
    - Optimieren von WhatsApp-Gruppensitzungsschlüsseln oder des Kontexts ausstehender Nachrichten
sidebarTitle: WhatsApp groups
summary: Umgang mit WhatsApp-Gruppennachrichten — Aktivierung, Positivlisten, Sitzungen und Kontextinjektion
title: WhatsApp-Gruppennachrichten
x-i18n:
    generated_at: "2026-07-24T03:38:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7325dd3ae64d7abca8c1de0504f294ae280394fa5dd336d2532c5eaefcb03828
    source_path: channels/group-messages.md
    workflow: 16
---

Für das kanalübergreifende Gruppenmodell (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo) siehe [Gruppen](/de/channels/groups). Diese Seite behandelt das WhatsApp-spezifische Verhalten zusätzlich zu diesem Modell: Aktivierung, Gruppen-Zulassungslisten, gruppenspezifische Sitzungsschlüssel und die Einbindung ausstehender Nachrichten als Kontext.

Ziel: OpenClaw soll in WhatsApp-Gruppen aktiv sein, nur bei einem Ping reagieren und diesen Thread von der persönlichen Direktnachrichtensitzung getrennt halten.

<Note>
`agents.entries.*.groupChat.mentionPatterns` wird gemeinsam mit der Erwähnungssteuerung der anderen Kanäle verwendet. Legen Sie den Wert bei Multi-Agent-Konfigurationen pro Agent fest oder verwenden Sie `messages.groupChat.mentionPatterns` als globalen Rückfallwert. Wenn keiner der beiden Werte festgelegt ist, werden die Muster aus Name und Emoji der Agentenidentität abgeleitet.
</Note>

## Verhalten

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert einen Ping: eine echte WhatsApp-@-Erwähnung (`mentionedJids`), ein konfiguriertes Regex-Muster, die E.164-Ziffern des Bots an einer beliebigen Stelle im Text oder eine zitierte Antwort auf eine Nachricht des Bots (außer bei Selbstchat-Konfigurationen mit gemeinsam genutzter Nummer). `always` aktiviert den Agent bei jeder Nachricht, aber der eingebundene Gruppen-Prompt weist ihn an, nur zu antworten, wenn dies einen Mehrwert bietet, und andernfalls exakt das Stille-Token `NO_REPLY` zurückzugeben (Groß-/Kleinschreibung wird nicht berücksichtigt). Die Standardwerte stammen aus der Konfiguration (`channels.whatsapp.groups` `requireMention`) und können über `/activation` pro Gruppe überschrieben werden.
- Gruppen-Zulassungsliste: Wenn `channels.whatsapp.groups` festgelegt ist, werden nur aufgeführte Gruppen-JIDs zugelassen (fügen Sie `"*"` hinzu, um alle zuzulassen); Nachrichten aus nicht aufgeführten Gruppen werden verworfen und ein entsprechender Hinweis wird protokolliert.
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Rückfallwert: explizites `channels.whatsapp.allowFrom`). Der Standardwert ist `allowlist` (blockiert, bis Sie Absender hinzufügen).
- Gruppenspezifische Sitzungen: Sitzungsschlüssel haben die Form `agent:<agentId>:whatsapp:group:<jid>` (bei Nicht-Standardkonten wird `:thread:whatsapp-account-<accountId>` angehängt), sodass Direktiven wie `/verbose on`, `/trace on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe beschränkt sind; der Zustand persönlicher Direktnachrichten bleibt unverändert.
- Kontexteinbindung: **Nur ausstehende** Gruppennachrichten (standardmäßig 50), die _keinen_ Lauf ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, wobei die auslösende Zeile unter `[Current message - respond to this]` steht. Das Fenster ausstehender Nachrichten wird nach dem Lauf geleert; Nachrichten, die bereits in der Sitzung enthalten sind, werden nicht erneut eingebunden.
- Absenderzuordnung: Jede Gruppenzeile enthält die Absenderbezeichnung innerhalb des Nachrichtenumschlags, beispielsweise `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`; außerdem werden die Absenderidentität sowie der Gruppenbetreff und die Mitglieder im Block mit nicht vertrauenswürdigen Konversationsmetadaten übermittelt.
- Flüchtige bzw. einmal anzeigbare Nachrichten: Umschläge werden vor dem Extrahieren von Text und Erwähnungen entfernt, sodass darin enthaltene Pings weiterhin eine Aktivierung auslösen.
- Gruppen-System-Prompt: In der ersten Interaktion einer Gruppensitzung (und in jeder Interaktion, nachdem `/activation` den Modus geändert hat) werden Aktivierungshinweise in den System-Prompt eingebunden (`Activation: trigger-only ...` oder `Activation: always-on ...` sowie „den jeweiligen Absender ansprechen“). Dauerhafte Hinweise zur Zustellung in Gruppenchats („Sie befinden sich in einem WhatsApp-Gruppenchat ...“) sind immer enthalten.

## Konfigurationsbeispiel (WhatsApp)

Ermöglichen Sie Pings über Anzeigenamen, selbst wenn WhatsApp das sichtbare `@` aus dem Textkörper entfernt:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // Fenster für ausstehenden Gruppenkontext (Standard: 50)
    },
  },
  agents: {
    entries: {
      main: {
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    },
  },
}
```

Hinweise:

- Bei den regulären Ausdrücken wird die Groß-/Kleinschreibung nicht berücksichtigt und es gelten dieselben Schutzmechanismen für sichere reguläre Ausdrücke wie für andere Regex-Konfigurationsoberflächen; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt. Daher wird der Rückfall auf die Nummer nur selten benötigt, ist aber ein nützliches Sicherheitsnetz.
- Das Fenster für ausstehenden Kontext wird in folgender Reihenfolge bestimmt: `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Aktivierungsbefehl (nur Eigentümer)

Verwenden Sie den Gruppenchatbefehl:

- `/activation mention`
- `/activation always`

Nur Eigentümernummern (aus `channels.whatsapp.allowFrom` oder, wenn nicht festgelegt, die eigene E.164-Nummer des Bots) können dies ändern; `/activation` von allen anderen Personen wird ignoriert und nur als Kontext gespeichert. Senden Sie `/status` als eigenständige Nachricht in der Gruppe, um den aktuellen Aktivierungsmodus anzuzeigen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (das Konto, auf dem OpenClaw ausgeführt wird) der Gruppe hinzu.
2. Senden Sie `@openclaw ...` (oder geben Sie die Nummer an). Nur Absender auf der Zulassungsliste können eine Aktivierung auslösen, sofern Sie nicht `groupPolicy: "open"` festlegen.
3. Der Agenten-Prompt enthält den ausstehenden Gruppenkontext sowie mit Absenderbezeichnungen versehene Zeilen, damit der Agent die richtige Person ansprechen kann.
4. Sitzungsdirektiven (`/verbose on`, `/trace on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche Direktnachrichtensitzung bleibt davon unabhängig.

## Tests/Überprüfung

- Manueller Smoke-Test:
  - Senden Sie einen `@openclaw`-Ping in der Gruppe und prüfen Sie, ob die Antwort auf den Namen des Absenders Bezug nimmt.
  - Senden Sie einen zweiten Ping und prüfen Sie, ob der Verlaufsblock enthalten ist und bei der nächsten Interaktion geleert wurde.
- Prüfen Sie die Gateway-Protokolle (Ausführung mit `--verbose`) auf `inbound web message`-Einträge, die `from: <groupJid>` und den mit einer Absenderbezeichnung versehenen Nachrichtentext enthalten.

## Bekannte Aspekte

- Heartbeats werden in der Hauptsitzung des Agent ausgeführt; Gruppensitzungen erhalten niemals Heartbeat-Läufe.
- Die Echounterdrückung merkt sich den kombinierten Prompt (Verlauf und aktuelle Nachricht) pro Sitzung, damit die vom Bot selbst zugestellten Nachrichten keine erneute Aktivierung auslösen; ein identischer wiederholter Stapel kann als Echo übersprungen werden.
- Einträge im Sitzungsspeicher erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im agentenspezifischen SQLite-Sitzungsspeicher; ein fehlender Eintrag bedeutet lediglich, dass die Gruppe noch keinen Lauf ausgelöst hat.
- Eingabeindikatoren richten sich nach `agents.entries.*.typingMode` / `agents.defaults.typingMode`. Wenn sichtbare Antworten ausschließlich über das Nachrichten-Tool erfolgen sollen, beginnt der Eingabeindikator standardmäßig sofort, sodass Gruppenmitglieder sehen können, dass der Agent arbeitet, selbst wenn keine automatische abschließende Antwort veröffentlicht wird. Eine explizite Konfiguration des Eingabemodus hat weiterhin Vorrang.

## Verwandte Themen

- [Gruppen](/de/channels/groups)
- [Kanalrouting](/de/channels/channel-routing)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
