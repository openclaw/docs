---
read_when:
    - Sie haben den alten BlueBubbles-Kanal verwendet und müssen zu iMessage wechseln
    - Sie wählen die unterstützte OpenClaw-iMessage-Einrichtung aus
    - Sie benötigen eine kurze Erklärung zur Entfernung von BlueBubbles.
summary: Die Unterstützung für BlueBubbles wurde aus OpenClaw entfernt. Verwenden Sie für neue und migrierte iMessage-Einrichtungen das mitgelieferte iMessage-Plugin mit imsg.
title: Entfernung von BlueBubbles und der imsg-iMessage-Pfad
x-i18n:
    generated_at: "2026-07-12T01:21:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Entfernung von BlueBubbles und der iMessage-Pfad über imsg

OpenClaw liefert den BlueBubbles-Kanal nicht mehr mit. Die iMessage-Unterstützung erfolgt über das gebündelte `imessage`-Plugin: Das Gateway startet [`imsg`](https://github.com/steipete/imsg) lokal oder über einen SSH-Wrapper als untergeordneten Prozess und kommuniziert über stdin/stdout mittels JSON-RPC. Kein Server, kein Webhook, kein Port.

Wenn Ihre Konfiguration noch `channels.bluebubbles` enthält, migrieren Sie diesen Eintrag zu `channels.imessage`. Die bisherige Dokumentations-URL `/channels/bluebubbles` leitet zu [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) weiter. Dort finden Sie die vollständige Tabelle zur Übertragung der Konfiguration und eine Checkliste für die Umstellung.

## Was sich geändert hat

- Der unterstützte iMessage-Pfad benötigt weder einen BlueBubbles-HTTP-Server noch eine Webhook-Route, ein REST-Passwort oder eine BlueBubbles-Plugin-Laufzeit.
- OpenClaw liest und überwacht Nachrichten über `imsg` auf dem Mac, auf dem Messages.app angemeldet ist.
- Grundlegende Funktionen zum Senden und Empfangen sowie Verlauf und Medien verwenden die regulären `imsg`-Schnittstellen und macOS-Berechtigungen.
- Erweiterte Aktionen (Antworten in Threads, Tapbacks, Bearbeiten, Zurückziehen, Effekte, Lesebestätigungen, Tippindikatoren und Gruppenverwaltung) benötigen die Bridge zur privaten API: Führen Sie `imsg launch` aus. Dafür muss SIP deaktiviert sein.
- Gateways unter Linux und Windows können iMessage weiterhin verwenden, indem `channels.imessage.cliPath` auf einen SSH-Wrapper verweist, der `imsg` auf dem angemeldeten Mac ausführt.

## Vorgehensweise

1. Installieren und überprüfen Sie `imsg` auf dem Mac mit Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Gewähren Sie dem Prozesskontext, in dem `imsg` und OpenClaw ausgeführt werden, Festplattenvollzugriff und Automatisierungsberechtigungen.

3. Übertragen Sie die alte Konfiguration:

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

4. Starten Sie das Gateway neu und überprüfen Sie den Status:

   ```bash
   openclaw channels status --probe
   ```

5. Testen Sie Direktnachrichten, Gruppen, Anhänge und alle von Ihnen benötigten Aktionen der privaten API, bevor Sie Ihren bisherigen BlueBubbles-Server löschen.

## Hinweise zur Migration

- Für `channels.bluebubbles.serverUrl` und `channels.bluebubbles.password` gibt es keine iMessage-Entsprechung; es ist kein Server vorhanden, der erreichbar sein oder an dem eine Authentifizierung erfolgen müsste.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` und `actions.*` behalten unter `channels.imessage` ihre Bedeutung.
- `channels.imessage.includeAttachments` ist standardmäßig weiterhin deaktiviert. Aktivieren Sie die Option ausdrücklich, wenn eingehende Fotos, Sprachmemos, Videos oder Dateien den Agenten erreichen sollen.
- Kopieren Sie bei `groupPolicy: "allowlist"` den bisherigen `groups`-Block einschließlich eines gegebenenfalls vorhandenen Platzhaltereintrags `"*"`. Absender-Zulassungslisten für Gruppen und das Gruppenregister sind separate Prüfstellen. Ein `groups`-Block mit Einträgen, aber ohne übereinstimmende `chat_id` (oder ohne `"*"`) verwirft die Nachricht zur Laufzeit. Ein leerer `groups`-Block protokolliert beim Start eine Warnung, obwohl die Absenderfilterung Nachrichten weiterhin passieren lässt.
- ACP-Bindungen mit `match.channel: "bluebubbles"` müssen zu `"imessage"` geändert werden.
- Alte BlueBubbles-Sitzungsschlüssel werden nicht zu iMessage-Sitzungsschlüsseln. Kopplungsgenehmigungen basieren auf Absenderkennungen, sodass kopierte `allowFrom`-Einträge weiterhin funktionieren. Der Konversationsverlauf unter BlueBubbles-Sitzungsschlüsseln wird jedoch nicht übernommen.

## Siehe auch

- [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles)
- [iMessage](/de/channels/imessage)
- [Konfigurationsreferenz – iMessage](/de/gateway/config-channels#imessage)
