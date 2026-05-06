---
read_when:
    - WhatsApp-Gruppen gezielt konfigurieren
    - WhatsApp-Aktivierungsmodi ändern (`mention` vs. `always`)
    - Feinabstimmung von WhatsApp-Gruppensitzungsschlüsseln oder Kontext für ausstehende Nachrichten
sidebarTitle: WhatsApp groups
summary: Verarbeitung von WhatsApp-Gruppennachrichten — Aktivierung, Zulassungslisten, Sitzungen und Kontextinjektion
title: WhatsApp-Gruppennachrichten
x-i18n:
    generated_at: "2026-05-06T06:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

Für das kanalübergreifende Gruppenmodell (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo) siehe [Gruppen](/de/channels/groups). Diese Seite behandelt das WhatsApp-spezifische Verhalten zusätzlich zu diesem Modell: Aktivierung, Gruppen-Allowlists, Sitzungsschlüssel pro Gruppe und Kontextinjektion aus ausstehenden Nachrichten.

Ziel: OpenClaw kann in WhatsApp-Gruppen sitzen, nur bei einem Ping aufwachen und diesen Thread von der persönlichen DM-Sitzung getrennt halten.

<Note>
`agents.list[].groupChat.mentionPatterns` wird auch von Telegram, Discord, Slack und iMessage verwendet. Legen Sie es bei Multi-Agent-Setups pro Agent fest, oder verwenden Sie `messages.groupChat.mentionPatterns` als globalen Fallback.
</Note>

## Verhalten

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert einen Ping (echte WhatsApp-@-Erwähnungen über `mentionedJids`, sichere Regex-Muster oder die E.164-Nummer des Bots an beliebiger Stelle im Text). `always` weckt den Agent bei jeder Nachricht, er sollte aber nur antworten, wenn er einen sinnvollen Mehrwert liefern kann; andernfalls gibt er das exakte stille Token `NO_REPLY` / `no_reply` zurück. Standardwerte können in der Konfiguration (`channels.whatsapp.groups`) festgelegt und pro Gruppe über `/activation` überschrieben werden. Wenn `channels.whatsapp.groups` gesetzt ist, dient es außerdem als Gruppen-Allowlist (fügen Sie `"*"` hinzu, um alle zu erlauben).
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Fallback: explizites `channels.whatsapp.allowFrom`). Standard ist `allowlist` (blockiert, bis Sie Absender hinzufügen).
- Sitzungen pro Gruppe: Sitzungsschlüssel sehen wie `agent:<agentId>:whatsapp:group:<jid>` aus, sodass Befehle wie `/verbose on`, `/trace on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe beschränkt sind; der persönliche DM-Status bleibt unverändert. Heartbeats werden für Gruppen-Threads übersprungen.
- Kontextinjektion: **nur ausstehende** Gruppennachrichten (Standard 50), die _keinen_ Lauf ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, mit der auslösenden Zeile unter `[Current message - respond to this]`. Nachrichten, die bereits in der Sitzung enthalten sind, werden nicht erneut injiziert.
- Absenderanzeige: Jeder Gruppen-Batch endet jetzt mit `[from: Sender Name (+E164)]`, damit Pi weiß, wer spricht.
- Ephemer/Einmalansicht: Wir entpacken diese Nachrichten vor dem Extrahieren von Text/Erwähnungen, sodass Pings darin weiterhin auslösen.
- Gruppen-System-Prompt: Beim ersten Turn einer Gruppensitzung (und immer dann, wenn `/activation` den Modus ändert) injizieren wir einen kurzen Hinweis in den System-Prompt wie `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Wenn keine Metadaten verfügbar sind, teilen wir dem Agent trotzdem mit, dass es sich um einen Gruppenchat handelt.

## Konfigurationsbeispiel (WhatsApp)

Fügen Sie einen `groupChat`-Block zu `~/.openclaw/openclaw.json` hinzu, damit Pings über Anzeigenamen auch dann funktionieren, wenn WhatsApp das sichtbare `@` im Textkörper entfernt:

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

- Die Regexes sind groß-/kleinschreibungsunabhängig und verwenden dieselben Safe-Regex-Schutzmechanismen wie andere Regex-Oberflächen in der Konfiguration; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt. Der Nummern-Fallback wird daher selten benötigt, ist aber ein nützliches Sicherheitsnetz.

### Aktivierungsbefehl (nur Owner)

Verwenden Sie den Gruppenchat-Befehl:

- `/activation mention`
- `/activation always`

Nur die Owner-Nummer (aus `channels.whatsapp.allowFrom` oder, falls nicht gesetzt, die eigene E.164-Nummer des Bots) kann dies ändern. Senden Sie `/status` als eigenständige Nachricht in der Gruppe, um den aktuellen Aktivierungsmodus zu sehen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (das Konto, auf dem OpenClaw läuft) zur Gruppe hinzu.
2. Schreiben Sie `@openclaw …` (oder fügen Sie die Nummer ein). Nur Absender auf der Allowlist können es auslösen, sofern Sie nicht `groupPolicy: "open"` festlegen.
3. Der Agent-Prompt enthält den aktuellen Gruppenkontext plus die abschließende `[from: …]`-Markierung, damit er die richtige Person ansprechen kann.
4. Sitzungsbezogene Anweisungen (`/verbose on`, `/trace on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche DM-Sitzung bleibt unabhängig.

## Testen / Verifizierung

- Manueller Smoke-Test:
  - Senden Sie einen `@openclaw`-Ping in der Gruppe und bestätigen Sie eine Antwort, die den Namen des Absenders referenziert.
  - Senden Sie einen zweiten Ping und prüfen Sie, dass der Verlaufsblock enthalten ist und beim nächsten Turn gelöscht wird.
- Prüfen Sie die Gateway-Logs (mit `--verbose` ausführen), um Einträge vom Typ `inbound web message` zu sehen, die `from: <groupJid>` und das Suffix `[from: …]` anzeigen.

## Bekannte Hinweise

- Heartbeats werden für Gruppen absichtlich übersprungen, um störende Broadcasts zu vermeiden.
- Echo-Unterdrückung verwendet den kombinierten Batch-String; wenn Sie zweimal identischen Text ohne Erwähnungen senden, erhält nur die erste Nachricht eine Antwort.
- Einträge im Sitzungsspeicher erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im Sitzungsspeicher (standardmäßig `~/.openclaw/agents/<agentId>/sessions/sessions.json`); ein fehlender Eintrag bedeutet lediglich, dass die Gruppe noch keinen Lauf ausgelöst hat.
- Tippindikatoren in Gruppen folgen `agents.defaults.typingMode`. Wenn sichtbare Antworten den Standardmodus nur über das Nachrichten-Tool verwenden, beginnt das Tippen standardmäßig sofort, sodass Gruppenmitglieder sehen können, dass der Agent arbeitet, selbst wenn keine automatische finale Antwort gepostet wird. Eine explizite Tippmodus-Konfiguration hat weiterhin Vorrang.

## Verwandt

- [Gruppen](/de/channels/groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
