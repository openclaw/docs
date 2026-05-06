---
read_when:
    - Ausführen des Node-Hosts ohne grafische Oberfläche
    - Nicht-macOS-Node für system.run koppeln
summary: CLI-Referenz für `openclaw node` (Node-Host ohne Benutzeroberfläche)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Führen Sie einen **headless Node-Host** aus, der sich mit dem Gateway WebSocket verbindet und
`system.run` / `system.which` auf diesem Rechner bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Agenten **Befehle auf anderen Rechnern** in Ihrem
Netzwerk ausführen sollen, ohne dort eine vollständige macOS-Begleit-App zu installieren.

Typische Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Laborrechner, NAS).
- Exec auf dem Gateway **sandboxed** halten, genehmigte Ausführungen aber an andere Hosts delegieren.
- Ein leichtgewichtiges, headless Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung wird weiterhin durch **Exec-Genehmigungen** und Agent-spezifische Allowlists auf dem
Node-Host abgesichert, sodass Sie den Befehlszugriff begrenzt und explizit halten können.

## Browser-Proxy (ohne Konfiguration)

Node-Hosts kündigen automatisch einen Browser-Proxy an, wenn `browser.enabled` auf dem Node nicht
deaktiviert ist. Dadurch kann der Agent Browser-Automatisierung auf diesem Node
ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browserprofil-Oberfläche des Nodes bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` setzen, wird der Proxy restriktiv:
Nicht in der Allowlist enthaltene Profilziele werden abgelehnt, und Routen zum Erstellen/Löschen
persistenter Profile werden über den Proxy blockiert.

Deaktivieren Sie ihn bei Bedarf auf dem Node:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Ausführen (Vordergrund)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht das Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben

## Gateway-Authentifizierung für den Node-Host

`openclaw node run` und `openclaw node install` lösen die Gateway-Authentifizierung aus Config/Umgebung auf (keine `--token`/`--password`-Flags für Node-Befehle):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Danach lokaler Config-Fallback: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus erbt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit per SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Node-Authentifizierungsauflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
- In `gateway.mode=remote` sind Remote-Client-Felder (`gateway.remote.token` / `gateway.remote.password`) gemäß den Remote-Vorrangregeln ebenfalls zulässig.
- Die Authentifizierungsauflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

Für einen Node, der sich mit einem nicht-loopback `ws://`-Gateway in einem vertrauenswürdigen privaten
Netzwerk verbindet, setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Ohne diese Einstellung schlägt der Node-Start
geschlossen fehl und fordert Sie auf, `wss://`, einen SSH-Tunnel oder Tailscale zu verwenden.
Dies ist eine Opt-in-Einstellung der Prozessumgebung, kein `openclaw.json`-Config-Schlüssel.
`openclaw node install` persistiert sie im überwachten Node-Dienst, wenn sie in der Umgebung
des Installationsbefehls vorhanden ist.

## Dienst (Hintergrund)

Installieren Sie einen headless Node-Host als Benutzerdienst.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht das Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben
- `--runtime <runtime>`: Dienst-Runtime (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, falls bereits installiert

Den Dienst verwalten:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (kein Dienst).

Dienstbefehle akzeptieren `--json` für maschinenlesbare Ausgabe.

Der Node-Host wiederholt Gateway-Neustarts und Netzwerkschließungen im Prozess. Wenn das
Gateway eine terminale Authentifizierungspause für Token/Passwort/Bootstrap meldet, protokolliert der Node-Host
das Schließungsdetail und beendet sich mit einem Wert ungleich null, damit launchd/systemd ihn mit
frischer Config und neuen Anmeldedaten neu starten kann. Pairing-erfordernde Pausen bleiben im Vordergrundablauf,
damit die ausstehende Anfrage genehmigt werden kann.

## Pairing

Die erste Verbindung erstellt eine ausstehende Geräte-Pairing-Anfrage (`role: node`) auf dem Gateway.
Genehmigen Sie sie über:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

In streng kontrollierten Node-Netzwerken kann der Gateway-Betreiber explizit festlegen,
dass erstmaliges Node-Pairing aus vertrauenswürdigen CIDRs automatisch genehmigt wird:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dies ist standardmäßig deaktiviert. Es gilt nur für frisches `role: node`-Pairing ohne
angeforderte Scopes. Operator-/Browser-Clients, Control UI, WebChat sowie Rollen-,
Scope-, Metadaten- oder Public-Key-Upgrades erfordern weiterhin manuelle Genehmigung.

Wenn der Node das Pairing mit geänderten Authentifizierungsdetails (Rolle/Scopes/Public Key) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Gateway-Verbindungsinformationen in
`~/.openclaw/node.json`.

## Exec-Genehmigungen

`system.run` wird durch lokale Exec-Genehmigungen geschützt:

- `~/.openclaw/exec-approvals.json`
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für genehmigtes asynchrones Node-Exec bereitet OpenClaw vor der Abfrage einen kanonischen `systemRunPlan`
vor. Die später genehmigte `system.run`-Weiterleitung verwendet diesen gespeicherten
Plan erneut, sodass Änderungen an Befehls-/cwd-/Session-Feldern nach Erstellung der Genehmigungsanfrage
abgelehnt werden, statt zu ändern, was der Node ausführt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
