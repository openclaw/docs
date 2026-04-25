---
read_when:
    - Regeln für Gruppennachrichten oder Erwähnungen ändern
summary: Verhalten und Konfiguration für die Behandlung von WhatsApp-Gruppennachrichten (`mentionPatterns` werden übergreifend gemeinsam genutzt)
title: Gruppennachrichten
x-i18n:
    generated_at: "2026-04-25T13:41:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Ziel: Clawd in WhatsApp-Gruppen sitzen lassen, nur bei einer Erwähnung aktivieren und diesen Thread getrennt von der persönlichen DM-Sitzung halten.

Hinweis: `agents.list[].groupChat.mentionPatterns` wird jetzt auch von Telegram/Discord/Slack/iMessage verwendet; diese Dokumentation konzentriert sich auf WhatsApp-spezifisches Verhalten. Für Multi-Agent-Setups setzen Sie `agents.list[].groupChat.mentionPatterns` pro Agent (oder verwenden Sie `messages.groupChat.mentionPatterns` als globale Ausweichoption).

## Aktuelle Implementierung (2025-12-03)

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert eine Erwähnung (echte WhatsApp-@-Erwähnungen über `mentionedJids`, sichere Regex-Muster oder die E.164 des Bots irgendwo im Text). `always` aktiviert den Agenten bei jeder Nachricht, aber er sollte nur antworten, wenn er einen sinnvollen Mehrwert bieten kann; andernfalls gibt er das exakte Stille-Token `NO_REPLY` / `no_reply` zurück. Standards können in der Konfiguration gesetzt werden (`channels.whatsapp.groups`) und pro Gruppe über `/activation` überschrieben werden. Wenn `channels.whatsapp.groups` gesetzt ist, dient es auch als Gruppen-Allowlist (fügen Sie `"*"` hinzu, um alle zu erlauben).
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Ausweichoption: explizites `channels.whatsapp.allowFrom`). Standard ist `allowlist` (blockiert, bis Sie Absender hinzufügen).
- Sitzungen pro Gruppe: Sitzungsschlüssel sehen aus wie `agent:<agentId>:whatsapp:group:<jid>`, sodass Befehle wie `/verbose on`, `/trace on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe beschränkt sind; der Zustand persönlicher DMs bleibt unberührt. Heartbeats werden für Gruppen-Threads übersprungen.
- Kontexteinfügung: **nur ausstehende** Gruppennachrichten (Standard 50), die _keine_ Ausführung ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, mit der auslösenden Zeile unter `[Current message - respond to this]`. Nachrichten, die bereits in der Sitzung enthalten sind, werden nicht erneut eingefügt.
- Sichtbarkeit des Absenders: Jeder Gruppen-Batch endet jetzt mit `[from: Sender Name (+E164)]`, damit Pi weiß, wer spricht.
- Ephemeral-/View-once-Nachrichten: Wir entpacken diese vor dem Extrahieren von Text/Erwähnungen, sodass Erwähnungen darin trotzdem eine Ausführung auslösen.
- Gruppen-Systemprompt: Beim ersten Turn einer Gruppensitzung (und immer dann, wenn `/activation` den Modus ändert) fügen wir einen kurzen Hinweis in den Systemprompt ein, etwa `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Wenn Metadaten nicht verfügbar sind, teilen wir dem Agenten dennoch mit, dass es sich um einen Gruppenchat handelt.

## Konfigurationsbeispiel (WhatsApp)

Fügen Sie `~/.openclaw/openclaw.json` einen `groupChat`-Block hinzu, damit Erwähnungen über Anzeigenamen funktionieren, auch wenn WhatsApp das sichtbare `@` im Nachrichtentext entfernt:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Hinweise:

- Die Regexe sind nicht case-sensitiv und verwenden dieselben Safe-Regex-Schutzmaßnahmen wie andere Regex-Oberflächen in der Konfiguration; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt; die Ausweichoption über die Nummer wird daher selten benötigt, ist aber ein nützliches Sicherheitsnetz.

### Aktivierungsbefehl (nur Eigentümer)

Verwenden Sie den Gruppenchat-Befehl:

- `/activation mention`
- `/activation always`

Nur die Eigentümernummer (aus `channels.whatsapp.allowFrom` oder die eigene E.164 des Bots, wenn nicht gesetzt) kann dies ändern. Senden Sie `/status` als eigenständige Nachricht in der Gruppe, um den aktuellen Aktivierungsmodus anzuzeigen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (dasjenige, auf dem OpenClaw läuft) der Gruppe hinzu.
2. Sagen Sie `@openclaw …` (oder geben Sie die Nummer an). Nur Absender auf der Allowlist können dies auslösen, es sei denn, Sie setzen `groupPolicy: "open"`.
3. Der Agenten-Prompt enthält den aktuellen Gruppenkontext plus den abschließenden Marker `[from: …]`, sodass er die richtige Person ansprechen kann.
4. Direktiven auf Sitzungsebene (`/verbose on`, `/trace on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche DM-Sitzung bleibt unabhängig.

## Testen / Verifizierung

- Manueller Smoke-Test:
  - Senden Sie eine `@openclaw`-Erwähnung in der Gruppe und bestätigen Sie eine Antwort, die sich auf den Namen des Absenders bezieht.
  - Senden Sie eine zweite Erwähnung und prüfen Sie, dass der Verlaufsblock enthalten ist und dann beim nächsten Turn gelöscht wird.
- Prüfen Sie die Gateway-Logs (mit `--verbose` ausführen), um `inbound web message`-Einträge mit `from: <groupJid>` und dem Suffix `[from: …]` zu sehen.

## Bekannte Punkte

- Heartbeats werden für Gruppen absichtlich übersprungen, um laute Broadcasts zu vermeiden.
- Die Echo-Unterdrückung verwendet den kombinierten Batch-String; wenn Sie denselben Text zweimal ohne Erwähnungen senden, erhält nur der erste eine Antwort.
- Einträge im Sitzungsspeicher erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im Sitzungsspeicher (`~/.openclaw/agents/<agentId>/sessions/sessions.json` standardmäßig); ein fehlender Eintrag bedeutet nur, dass die Gruppe noch keine Ausführung ausgelöst hat.
- Tippindikatoren in Gruppen folgen `agents.defaults.typingMode` (Standard: `message`, wenn keine Erwähnung erfolgt).

## Verwandt

- [Groups](/de/channels/groups)
- [Channel routing](/de/channels/channel-routing)
- [Broadcast groups](/de/channels/broadcast-groups)
