---
read_when:
    - Regeln für Gruppennachrichten oder Erwähnungen ändern
summary: Verhalten und Konfiguration für die Verarbeitung von WhatsApp-Gruppennachrichten (mentionPatterns werden über Oberflächen hinweg gemeinsam genutzt)
title: Gruppennachrichten
x-i18n:
    generated_at: "2026-04-30T06:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Ziel: Clawd soll in WhatsApp-Gruppen sitzen, nur aktiv werden, wenn er angepingt wird, und diesen Thread von der persönlichen DM-Sitzung getrennt halten.

<Note>
`agents.list[].groupChat.mentionPatterns` wird auch von Telegram, Discord, Slack und iMessage verwendet. Diese Dokumentation konzentriert sich auf WhatsApp-spezifisches Verhalten. Für Multi-Agent-Setups legen Sie `agents.list[].groupChat.mentionPatterns` pro Agent fest oder verwenden Sie `messages.groupChat.mentionPatterns` als globalen Fallback.
</Note>

## Aktuelle Implementierung (2025-12-03)

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert einen Ping (echte WhatsApp-@-Erwähnungen über `mentionedJids`, sichere Regex-Muster oder die E.164-Nummer des Bots irgendwo im Text). `always` aktiviert den Agent bei jeder Nachricht, aber er sollte nur antworten, wenn er sinnvollen Mehrwert liefern kann; andernfalls gibt er das exakte stille Token `NO_REPLY` / `no_reply` zurück. Standardwerte können in der Konfiguration (`channels.whatsapp.groups`) festgelegt und pro Gruppe über `/activation` überschrieben werden. Wenn `channels.whatsapp.groups` gesetzt ist, fungiert es außerdem als Allowlist für Gruppen (fügen Sie `"*"` hinzu, um alle zuzulassen).
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Fallback: explizites `channels.whatsapp.allowFrom`). Standard ist `allowlist` (blockiert, bis Sie Absender hinzufügen).
- Sitzungen pro Gruppe: Sitzungsschlüssel sehen aus wie `agent:<agentId>:whatsapp:group:<jid>`, sodass Befehle wie `/verbose on`, `/trace on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe beschränkt sind; der persönliche DM-Zustand bleibt unverändert. Heartbeats werden für Gruppen-Threads übersprungen.
- Kontextinjektion: **nur ausstehende** Gruppennachrichten (standardmäßig 50), die _keinen_ Lauf ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, mit der auslösenden Zeile unter `[Current message - respond to this]`. Nachrichten, die bereits in der Sitzung enthalten sind, werden nicht erneut injiziert.
- Absenderanzeige: Jeder Gruppen-Batch endet jetzt mit `[from: Sender Name (+E164)]`, damit Pi weiß, wer spricht.
- Ephemer/view-once: Diese entpacken wir vor der Texterkennung und Erwähnungsextraktion, sodass Pings darin weiterhin auslösen.
- Gruppen-System-Prompt: Beim ersten Turn einer Gruppensitzung (und immer dann, wenn `/activation` den Modus ändert) injizieren wir einen kurzen Hinweis in den System-Prompt, etwa `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Wenn Metadaten nicht verfügbar sind, teilen wir dem Agent trotzdem mit, dass es sich um einen Gruppenchat handelt.

## Konfigurationsbeispiel (WhatsApp)

Fügen Sie einen `groupChat`-Block zu `~/.openclaw/openclaw.json` hinzu, damit Display-Name-Pings auch dann funktionieren, wenn WhatsApp das sichtbare `@` im Textkörper entfernt:

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

- Die Regexes sind nicht groß-/kleinschreibungssensitiv und verwenden dieselben Safe-Regex-Leitplanken wie andere Regex-Oberflächen in der Konfiguration; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt, daher wird der Nummern-Fallback selten benötigt, ist aber ein nützliches Sicherheitsnetz.

### Aktivierungsbefehl (nur Owner)

Verwenden Sie den Gruppenchat-Befehl:

- `/activation mention`
- `/activation always`

Nur die Owner-Nummer (aus `channels.whatsapp.allowFrom` oder, falls nicht gesetzt, die eigene E.164-Nummer des Bots) kann dies ändern. Senden Sie `/status` als eigenständige Nachricht in der Gruppe, um den aktuellen Aktivierungsmodus zu sehen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (das Konto, auf dem OpenClaw läuft) zur Gruppe hinzu.
2. Schreiben Sie `@openclaw …` (oder fügen Sie die Nummer ein). Nur Absender auf der Allowlist können ihn auslösen, sofern Sie nicht `groupPolicy: "open"` setzen.
3. Der Agent-Prompt enthält den aktuellen Gruppenkontext plus die abschließende Markierung `[from: …]`, damit er die richtige Person ansprechen kann.
4. Sitzungsbezogene Direktiven (`/verbose on`, `/trace on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche DM-Sitzung bleibt unabhängig.

## Tests / Verifizierung

- Manueller Smoke-Test:
  - Senden Sie einen `@openclaw`-Ping in die Gruppe und bestätigen Sie eine Antwort, die den Namen des Absenders erwähnt.
  - Senden Sie einen zweiten Ping und prüfen Sie, dass der Verlaufsblock enthalten ist und beim nächsten Turn gelöscht wird.
- Prüfen Sie die Gateway-Logs (mit `--verbose` ausführen), um Einträge vom Typ `inbound web message` mit `from: <groupJid>` und dem Suffix `[from: …]` zu sehen.

## Bekannte Hinweise

- Heartbeats werden für Gruppen absichtlich übersprungen, um laute Broadcasts zu vermeiden.
- Echo-Unterdrückung verwendet den kombinierten Batch-String; wenn Sie identischen Text zweimal ohne Erwähnungen senden, erhält nur die erste Nachricht eine Antwort.
- Einträge im Sitzungsspeicher erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im Sitzungsspeicher (standardmäßig `~/.openclaw/agents/<agentId>/sessions/sessions.json`); ein fehlender Eintrag bedeutet lediglich, dass die Gruppe noch keinen Lauf ausgelöst hat.
- Tippindikatoren in Gruppen folgen `agents.defaults.typingMode`. Wenn sichtbare Antworten den standardmäßigen Nur-Nachrichten-Tool-Modus verwenden, startet das Tippen standardmäßig sofort, damit Gruppenmitglieder sehen können, dass der Agent arbeitet, selbst wenn keine automatische finale Antwort gepostet wird. Eine explizite Tippmodus-Konfiguration hat weiterhin Vorrang.

## Verwandt

- [Gruppen](/de/channels/groups)
- [Channel-Routing](/de/channels/channel-routing)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
