---
read_when:
    - WhatsApp-Gruppen gezielt konfigurieren
    - Ändern der WhatsApp-Aktivierungsmodi (`mention` vs. `always`)
    - Abstimmen von WhatsApp-Gruppensitzungsschlüsseln oder Pending-Message-Kontext
sidebarTitle: WhatsApp groups
summary: WhatsApp-Gruppennachrichtenverarbeitung — Aktivierung, Allowlists, Sitzungen und Kontextinjektion
title: WhatsApp-Gruppennachrichten
x-i18n:
    generated_at: "2026-06-27T17:10:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

Für das kanalübergreifende Gruppenmodell (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo) siehe [Gruppen](/de/channels/groups). Diese Seite behandelt das WhatsApp-spezifische Verhalten zusätzlich zu diesem Modell: Aktivierung, Gruppen-Zulassungslisten, sitzungsbezogene Schlüssel pro Gruppe und Kontextinjektion für ausstehende Nachrichten.

Ziel: OpenClaw soll in WhatsApp-Gruppen sitzen, nur bei einer Anpingen aktiv werden und diesen Thread von der persönlichen DM-Sitzung getrennt halten.

<Note>
`agents.list[].groupChat.mentionPatterns` wird auch von Telegram, Discord, Slack und iMessage verwendet. Legen Sie es bei Multi-Agent-Setups pro Agent fest, oder verwenden Sie `messages.groupChat.mentionPatterns` als globalen Fallback.
</Note>

## Verhalten

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert ein Anpingen (echte WhatsApp-@-Erwähnungen über `mentionedJids`, sichere Regex-Muster oder die E.164 des Bots irgendwo im Text). `always` aktiviert den Agent bei jeder Nachricht, er sollte aber nur antworten, wenn er einen sinnvollen Mehrwert liefern kann; andernfalls gibt er exakt das stille Token `NO_REPLY` / `no_reply` zurück. Standards können in der Konfiguration (`channels.whatsapp.groups`) gesetzt und pro Gruppe über `/activation` überschrieben werden. Wenn `channels.whatsapp.groups` gesetzt ist, dient es auch als Gruppen-Zulassungsliste (fügen Sie `"*"` ein, um alle zu erlauben).
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Fallback: explizites `channels.whatsapp.allowFrom`). Standard ist `allowlist` (blockiert, bis Sie Absender hinzufügen).
- Sitzungen pro Gruppe: Sitzungsschlüssel sehen aus wie `agent:<agentId>:whatsapp:group:<jid>`, sodass Befehle wie `/verbose on`, `/trace on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe begrenzt sind; der persönliche DM-Status bleibt unberührt. Heartbeats werden für Gruppen-Threads übersprungen.
- Kontextinjektion: **nur ausstehende** Gruppennachrichten (standardmäßig 50), die _keinen_ Lauf ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, mit der auslösenden Zeile unter `[Current message - respond to this]`. Nachrichten, die bereits in der Sitzung sind, werden nicht erneut injiziert.
- Absenderanzeige: Jeder Gruppen-Batch endet jetzt mit `[from: Sender Name (+E164)]`, damit OpenClaw weiß, wer spricht.
- Flüchtig/einmalig anzeigbar: Wir entpacken diese Nachrichten, bevor Text/Erwähnungen extrahiert werden, sodass Anpingen darin weiterhin auslösen.
- Gruppen-Systemprompt: Beim ersten Turn einer Gruppensitzung (und immer dann, wenn `/activation` den Modus ändert) injizieren wir einen kurzen Hinweis in den Systemprompt wie `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Wenn Metadaten nicht verfügbar sind, teilen wir dem Agent trotzdem mit, dass es sich um einen Gruppenchat handelt.

## Konfigurationsbeispiel (WhatsApp)

Fügen Sie einen `groupChat`-Block zu `~/.openclaw/openclaw.json` hinzu, damit Anzeigenamen-Anpingen auch dann funktionieren, wenn WhatsApp das sichtbare `@` im Textkörper entfernt:

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

- Die Regexes sind nicht groß-/kleinschreibungssensitiv und verwenden dieselben Safe-Regex-Leitplanken wie andere Konfigurations-Regex-Oberflächen; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt. Daher wird der Nummern-Fallback selten benötigt, ist aber ein nützliches Sicherheitsnetz.

### Aktivierungsbefehl (nur Owner)

Verwenden Sie den Gruppenchat-Befehl:

- `/activation mention`
- `/activation always`

Nur die Owner-Nummer (aus `channels.whatsapp.allowFrom` oder die eigene E.164 des Bots, wenn nicht gesetzt) kann dies ändern. Senden Sie `/status` als eigenständige Nachricht in der Gruppe, um den aktuellen Aktivierungsmodus zu sehen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (das OpenClaw ausführt) zur Gruppe hinzu.
2. Schreiben Sie `@openclaw …` (oder geben Sie die Nummer an). Nur Absender auf der Zulassungsliste können es auslösen, sofern Sie nicht `groupPolicy: "open"` setzen.
3. Der Agent-Prompt enthält den aktuellen Gruppenkontext plus die abschließende Markierung `[from: …]`, damit er die richtige Person ansprechen kann.
4. Sitzungsbezogene Direktiven (`/verbose on`, `/trace on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche DM-Sitzung bleibt unabhängig.

## Testen / Verifizierung

- Manueller Smoke-Test:
  - Senden Sie ein `@openclaw`-Anpingen in der Gruppe und bestätigen Sie eine Antwort, die den Absendernamen erwähnt.
  - Senden Sie ein zweites Anpingen und prüfen Sie, dass der Verlaufsblock enthalten ist und beim nächsten Turn geleert wird.
- Prüfen Sie die Gateway-Logs (mit `--verbose` ausführen), um `inbound web message`-Einträge mit `from: <groupJid>` und dem Suffix `[from: …]` zu sehen.

## Bekannte Hinweise

- Heartbeats werden für Gruppen absichtlich übersprungen, um laute Broadcasts zu vermeiden.
- Die Echo-Unterdrückung verwendet den kombinierten Batch-String; wenn Sie identischen Text zweimal ohne Erwähnungen senden, erhält nur der erste eine Antwort.
- Sitzungsspeichereinträge erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im Sitzungsspeicher (standardmäßig `~/.openclaw/agents/<agentId>/sessions/sessions.json`); ein fehlender Eintrag bedeutet lediglich, dass die Gruppe noch keinen Lauf ausgelöst hat.
- Tippindikatoren in Gruppen folgen `agents.defaults.typingMode`. Wenn sichtbare Antworten im Nur-Nachrichtentool-Modus aktiviert sind, beginnt das Tippen standardmäßig sofort, damit Gruppenmitglieder sehen können, dass der Agent arbeitet, auch wenn keine automatische finale Antwort gepostet wird. Eine explizite Konfiguration des Tippmodus hat weiterhin Vorrang.

## Verwandt

- [Gruppen](/de/channels/groups)
- [Kanalrouting](/de/channels/channel-routing)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
