---
read_when:
    - Sie haben den alten BlueBubbles-Kanal verwendet und müssen zu iMessage wechseln
    - Sie wählen die unterstützte OpenClaw-iMessage-Einrichtung aus
    - Sie benötigen eine kurze Erklärung zur Entfernung von BlueBubbles.
summary: Die Unterstützung für BlueBubbles wurde aus OpenClaw entfernt. Verwenden Sie für neue und migrierte iMessage-Konfigurationen das gebündelte iMessage-Plugin mit imsg.
title: Entfernung von BlueBubbles und der imsg-Pfad für iMessage
x-i18n:
    generated_at: "2026-07-12T14:59:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Entfernung von BlueBubbles und der imsg-Pfad für iMessage

OpenClaw enthält den BlueBubbles-Kanal nicht mehr. Die iMessage-Unterstützung erfolgt über das gebündelte `imessage`-Plugin: Das Gateway startet [`imsg`](https://github.com/steipete/imsg) lokal oder über einen SSH-Wrapper als untergeordneten Prozess und kommuniziert über stdin/stdout per JSON-RPC. Kein Server, kein Webhook, kein Port.

Wenn Ihre Konfiguration noch `channels.bluebubbles` enthält, migrieren Sie sie zu `channels.imessage`. Die bisherige Dokumentations-URL `/channels/bluebubbles` leitet zu [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) weiter. Dort finden Sie die vollständige Tabelle zur Übertragung der Konfiguration und eine Checkliste für die Umstellung.

## Was sich geändert hat

- Der unterstützte iMessage-Pfad umfasst keinen BlueBubbles-HTTP-Server, keine Webhook-Route, kein REST-Passwort und keine BlueBubbles-Plugin-Laufzeit.
- OpenClaw liest und überwacht Nachrichten über `imsg` auf dem Mac, auf dem Messages.app angemeldet ist.
- Grundlegendes Senden, Empfangen, Abrufen des Verlaufs und Verarbeiten von Medien erfolgt über die normalen `imsg`-Schnittstellen und macOS-Berechtigungen.
- Erweiterte Aktionen (Antworten in Threads, Tapbacks, Bearbeiten, Zurückziehen, Effekte, Lesebestätigungen, Tippindikatoren und Gruppenverwaltung) erfordern die Brücke zur privaten API: Führen Sie `imsg launch` aus; dafür muss SIP deaktiviert sein.
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

4. Starten Sie das Gateway neu und überprüfen Sie es:

   ```bash
   openclaw channels status --probe
   ```

5. Testen Sie Direktnachrichten, Gruppen, Anhänge und alle von Ihnen verwendeten Aktionen der privaten API, bevor Sie Ihren alten BlueBubbles-Server löschen.

## Hinweise zur Migration

- Für `channels.bluebubbles.serverUrl` und `channels.bluebubbles.password` gibt es keine iMessage-Entsprechung; es gibt keinen Server, der erreichbar sein oder authentifiziert werden muss.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` und `actions.*` behalten unter `channels.imessage` ihre Bedeutung.
- `channels.imessage.includeAttachments` ist standardmäßig weiterhin deaktiviert. Legen Sie die Option ausdrücklich fest, wenn eingehende Fotos, Sprachmemos, Videos oder Dateien den Agenten erreichen sollen.
- Kopieren Sie bei `groupPolicy: "allowlist"` den alten `groups`-Block einschließlich eines etwaigen Platzhaltereintrags `"*"`. Zulassungslisten für Gruppenabsender und das Gruppenregister sind getrennte Prüfmechanismen. Ein `groups`-Block mit Einträgen, aber ohne übereinstimmende `chat_id` (oder ohne `"*"`) verwirft die Nachricht zur Laufzeit. Ein leerer `groups`-Block protokolliert beim Start eine Warnung, obwohl Nachrichten die Absenderfilterung weiterhin passieren.
- ACP-Bindungen mit `match.channel: "bluebubbles"` müssen zu `"imessage"` geändert werden.
- Alte BlueBubbles-Sitzungsschlüssel werden nicht zu iMessage-Sitzungsschlüsseln. Kopplungsgenehmigungen basieren auf Absenderkennungen, sodass kopierte `allowFrom`-Einträge weiterhin funktionieren. Der Unterhaltungsverlauf unter BlueBubbles-Sitzungsschlüsseln wird jedoch nicht übernommen.

## Siehe auch

- [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles)
- [iMessage](/de/channels/imessage)
- [Konfigurationsreferenz – iMessage](/de/gateway/config-channels#imessage)
