---
read_when:
    - Sie haben den alten BlueBubbles-Kanal verwendet und müssen zu iMessage wechseln
    - Sie wählen die unterstützte OpenClaw-iMessage-Einrichtung aus
    - Sie benötigen eine kurze Erklärung zur Entfernung von BlueBubbles
summary: Die Unterstützung für BlueBubbles wurde aus OpenClaw entfernt. Verwenden Sie für neue und migrierte iMessage-Setups das gebündelte iMessage-Plugin mit imsg.
title: Entfernung von BlueBubbles und der imsg-iMessage-Pfad
x-i18n:
    generated_at: "2026-05-11T20:20:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Entfernen von BlueBubbles und der imsg-iMessage-Pfad

OpenClaw liefert den BlueBubbles-Kanal nicht mehr aus. iMessage-Unterstützung läuft jetzt über das gebündelte `imessage`-Plugin, das [`imsg`](https://github.com/steipete/imsg) lokal oder über einen SSH-Wrapper startet und JSON-RPC über stdin/stdout spricht.

Wenn Ihre Konfiguration noch `channels.bluebubbles` enthält, migrieren Sie sie zu `channels.imessage`. Die alte Dokumentations-URL `/channels/bluebubbles` leitet zu [Von BlueBubbles kommend](/de/channels/imessage-from-bluebubbles) weiter. Dort finden Sie die vollständige Tabelle zur Konfigurationsübersetzung und die Cutover-Checkliste.

## Was sich geändert hat

- Im unterstützten OpenClaw-iMessage-Pfad gibt es keinen BlueBubbles-HTTP-Server, keine Webhook-Route, kein REST-Passwort und keine BlueBubbles-Plugin-Runtime.
- OpenClaw liest und überwacht Nachrichten über `imsg` auf dem Mac, auf dem Messages.app angemeldet ist.
- Grundlegendes Senden, Empfangen, Verlauf und Medien verwenden die normalen `imsg`-Oberflächen und macOS-Berechtigungen.
- Erweiterte Aktionen wie Thread-Antworten, Tapbacks, Bearbeiten, Zurückziehen von Nachrichten, Effekte, Lesebestätigungen, Tippindikatoren und Gruppenverwaltung erfordern `imsg launch` mit verfügbarer Private-API-Bridge.
- Linux- und Windows-Gateways können iMessage weiterhin verwenden, indem `channels.imessage.cliPath` auf einen SSH-Wrapper gesetzt wird, der `imsg` auf dem angemeldeten Mac ausführt.

## Was zu tun ist

1. Installieren und verifizieren Sie `imsg` auf dem Messages-Mac:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Erteilen Sie dem Prozesskontext, der `imsg` und OpenClaw ausführt, Full-Disk-Access- und Automationsberechtigungen.

3. Übersetzen Sie die alte Konfiguration:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Starten Sie das Gateway neu und verifizieren Sie es:

   ```bash
   openclaw channels status --probe
   ```

5. Testen Sie DMs, Gruppen, Anhänge und alle Private-API-Aktionen, von denen Sie abhängig sind, bevor Sie Ihren alten BlueBubbles-Server löschen.

## Migrationshinweise

- `channels.bluebubbles.serverUrl` und `channels.bluebubbles.password` haben kein iMessage-Äquivalent.
- `channels.bluebubbles.allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, Attachment-Roots, Mediengrößenlimits, Chunking und Aktionsumschalter haben iMessage-Äquivalente.
- `channels.imessage.includeAttachments` ist weiterhin standardmäßig deaktiviert. Setzen Sie es explizit, wenn Sie erwarten, dass eingehende Fotos, Sprachmemos, Videos oder Dateien den Agenten erreichen.
- Mit `groupPolicy: "allowlist"` kopieren Sie den alten `groups`-Block, einschließlich eines etwaigen `"*"`-Wildcard-Eintrags. Absender-Allowlists für Gruppen und die Gruppenregistrierung sind getrennte Gates.
- ACP-Bindungen, die `channel: "bluebubbles"` entsprachen, müssen zu `channel: "imessage"` geändert werden.
- Alte BlueBubbles-Sitzungsschlüssel werden nicht zu iMessage-Sitzungsschlüsseln. Pairing-Freigaben werden nach Handle übernommen, aber der Konversationsverlauf unter BlueBubbles-Sitzungsschlüsseln nicht.

## Siehe auch

- [Von BlueBubbles kommend](/de/channels/imessage-from-bluebubbles)
- [iMessage](/de/channels/imessage)
- [Konfigurationsreferenz - iMessage](/de/gateway/config-channels#imessage)
