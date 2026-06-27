---
read_when:
    - Sie möchten OpenClaw mit einem Raft-Workspace verbinden
    - Sie konfigurieren einen Raft External Agent
    - Sie debuggen die Raft-Weckzustellung
sidebarTitle: Raft
summary: Unterstützung für externe Raft-Agenten über die Aktivierungsbrücke der Raft CLI
title: Raft
x-i18n:
    generated_at: "2026-06-27T17:12:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Raft-Unterstützung verbindet einen OpenClaw-Agenten über die lokale Raft-CLI mit einem externen Raft-Agenten. Raft sendet authentifizierte Wake-Hinweise an das Gateway. Der Agent verwendet dann die Raft-CLI, um Nachrichten zu prüfen und zu senden.

## Installation

Raft ist ein offizielles externes Plugin. Installieren Sie es auf dem Gateway-Host:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Details: [Plugins](/de/tools/plugin)

## Voraussetzungen

- Ein Raft-Arbeitsbereich mit einem externen Agenten.
- Die Raft-CLI ist auf demselben Host wie das OpenClaw Gateway installiert.
- Ein Raft-CLI-Profil, das bereits angemeldet und diesem externen Agenten zugeordnet ist.

Das Plugin speichert keine Raft-Anmeldedaten. Die Raft-CLI bewahrt diese Authentifizierung in ihrem eigenen Profil auf.

## Konfigurieren

Legen Sie das Profil in der Konfiguration fest:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Für das Standardkonto können Sie stattdessen `RAFT_PROFILE` in der Gateway-Umgebung festlegen:

```bash
RAFT_PROFILE=openclaw
```

Verwenden Sie ein benanntes Konto, wenn ein Gateway eine Verbindung zu mehr als einem externen Raft-Agenten herstellt:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

Der interaktive Einrichtungsablauf speichert dasselbe Profil:

```bash
openclaw channels setup raft
```

## Funktionsweise

Wenn das Gateway startet, führt das Plugin Folgendes aus:

1. Es öffnet einen nur über local loopback erreichbaren HTTP-Wake-Endpunkt auf einem kurzlebigen Port.
2. Es startet `raft --profile <profile> agent bridge` mit diesem Endpunkt und einem prozessspezifischen Token.
3. Es akzeptiert nur authentifizierte, inhaltsfreie Wake-Hinweise mit einer Replay-Identität von der lokalen Bridge.
4. Es erfordert eines von `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` oder `id`.
5. Es dedupliziert kürzlich wiederholte Wake-Zustellungen anhand der Bridge-Ereignis-ID, auch über Gateway-Neustarts hinweg.
6. Es gibt eine stabile Runtime-Sitzung für die aktuelle Bridge und einen leeren Activity-Drain-Batch für das Raft-CLI-Protokoll zurück.
7. Es startet für jeden akzeptierten Wake einen serialisierten OpenClaw-Agentendurchlauf.

Die Bridge ist für Raft-Zustellwiederholungen und erneute Verbindungen zuständig. Der OpenClaw-Durchlauf erhält nur eine Wake-Benachrichtigung, keinen kopierten Raft-Nachrichtentext. Er verwendet die CLI, um ausstehende Nachrichten zu lesen und seine Antwort zu senden:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft ist kein normaler Push-Nachrichtentransport. OpenClaw sendet den finalen Text des Modells nicht automatisch über die Bridge zurück. Daher muss der Agent nach der Verarbeitung eines Wake die Raft-CLI verwenden.
</Note>

## Überprüfen

Prüfen Sie, ob OpenClaw die CLI finden kann und ein Profil konfiguriert ist:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Senden Sie anschließend eine Nachricht an den externen Raft-Agenten. Das Gateway-Protokoll sollte zeigen, dass die Raft-Bridge startet, gefolgt von einem eingehenden Wake. Der Agent sollte das konfigurierte Raft-Profil verwenden, um seine ausstehenden Nachrichten zu prüfen.

## Problembehebung

<AccordionGroup>
  <Accordion title="Raft CLI is missing">
    Installieren Sie die Raft-CLI auf dem Gateway-Host und machen Sie `raft` im `PATH` des Dienstes verfügbar. Überprüfen Sie dies mit `raft --help` und starten Sie anschließend das Gateway neu.
  </Accordion>
  <Accordion title="The bridge exits immediately">
    Überprüfen Sie, ob das konfigurierte Profil angemeldet ist und zum vorgesehenen externen Raft-Agenten gehört. Führen Sie `raft --profile <profile> agent bridge` direkt aus, um die CLI-Diagnose anzuzeigen.
  </Accordion>
  <Accordion title="A wake arrives but no Raft response is sent">
    Dies wird erwartet, wenn der Agent die Raft-CLI nicht aufruft. Die Wake-Bridge überträgt keine Nachrichtentexte oder automatischen finalen Antworten. Prüfen Sie die Tool-Richtlinie des Agenten und stellen Sie sicher, dass er `raft --profile <profile> message
    check` und `message send` ausführen kann.
  </Accordion>
</AccordionGroup>

## Referenzen

- [Raft](https://raft.build/)
- [Raft-Dokumentation](https://docs.raft.build/welcome/)
- [Hermes-Raft-Integration](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
