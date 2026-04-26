---
read_when:
    - Den Headless-Node-Host ausführen
    - Einen Nicht-macOS-Node für `system.run` koppeln
summary: CLI-Referenz für `openclaw node` (Headless-Node-Host)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Einen **Headless-Node-Host** ausführen, der sich mit dem Gateway-WebSocket verbindet und auf diesem Rechner
`system.run` / `system.which` bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Sie möchten, dass Agenten **Befehle auf anderen Maschinen** in Ihrem
Netzwerk ausführen, ohne dort eine vollständige macOS-Companion-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Labormaschinen, NAS).
- Exec auf dem Gateway **sandboxed** halten, aber genehmigte Ausführungen an andere Hosts delegieren.
- Ein leichtgewichtiges, headless Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung wird weiterhin durch **Exec-Genehmigungen** und hostlokale Allowlists pro Agent abgesichert,
sodass der Befehlszugriff begrenzt und explizit bleibt.

## Browser-Proxy (Zero-Config)

Node-Hosts kündigen automatisch einen Browser-Proxy an, wenn `browser.enabled` auf
dem Node nicht deaktiviert ist. Dadurch kann der Agent Browser-Automatisierung auf diesem Node
ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browserprofil-Oberfläche des Nodes bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` setzen, wird der Proxy restriktiv:
Zielauswahl für nicht auf der Allowlist stehende Profile wird abgelehnt, und Routen zum Erstellen/Löschen
persistenter Profile werden über den Proxy blockiert.

Bei Bedarf auf dem Node deaktivieren:

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

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht das Pairing-Token)
- `--display-name <name>`: Den Anzeigenamen des Nodes überschreiben

## Gateway-Authentifizierung für den Node-Host

`openclaw node run` und `openclaw node install` lösen die Gateway-Authentifizierung aus Konfiguration/Umgebung auf (keine `--token`-/`--password`-Flags für Node-Befehle):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Danach lokales Konfigurations-Fallback: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus übernimmt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar sind, schlägt die Auflösung der Node-Authentifizierung fail-closed fehl (kein Maskieren durch Remote-Fallback).
- In `gateway.mode=remote` kommen Remote-Client-Felder (`gateway.remote.token` / `gateway.remote.password`) gemäß den Prioritätsregeln für Remote ebenfalls infrage.
- Die Auflösung der Node-Host-Authentifizierung berücksichtigt nur `OPENCLAW_GATEWAY_*`-Env-Variablen.

Für einen Node, der sich mit einem nicht auf Loopback laufenden `ws://`-Gateway in einem vertrauenswürdigen privaten
Netzwerk verbindet, setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Ohne diese Einstellung schlägt
der Start des Nodes fail-closed fehl und fordert Sie auf, `wss://`, einen SSH-Tunnel oder Tailscale zu verwenden.
Dies ist ein Prozess-Umgebungs-Opt-in, kein Konfigurationsschlüssel in `openclaw.json`.
`openclaw node install` speichert es im überwachten Node-Service, wenn es
in der Umgebung des Installationsbefehls vorhanden ist.

## Service (Hintergrund)

Installieren Sie einen Headless-Node-Host als Benutzerdienst.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht das Pairing-Token)
- `--display-name <name>`: Den Anzeigenamen des Nodes überschreiben
- `--runtime <runtime>`: Service-Laufzeit (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, wenn bereits installiert

Den Service verwalten:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (ohne Service).

Service-Befehle akzeptieren `--json` für maschinenlesbare Ausgabe.

Der Node-Host behandelt Gateway-Neustarts und Netzwerkschließungen im Prozess per Retry. Wenn das
Gateway eine terminale Token-/Passwort-/Bootstrap-Authentifizierungspause meldet, protokolliert der
Node-Host die Details der Schließung und beendet sich mit einem Wert ungleich null, damit launchd/systemd ihn mit
frischer Konfiguration und neuen Anmeldedaten neu starten kann. Pairing-erforderliche Pausen bleiben im Vordergrundablauf,
damit die ausstehende Anfrage genehmigt werden kann.

## Pairing

Die erste Verbindung erstellt auf dem Gateway eine ausstehende Device-Pairing-Anfrage (`role: node`).
Genehmigen Sie sie mit:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

In streng kontrollierten Node-Netzwerken kann der Gateway-Betreiber explizit aktivieren,
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
angeforderte Scopes. Operator-/Browser-Clients, Control UI, WebChat sowie Upgrades von Rolle,
Scope, Metadaten oder öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

Wenn der Node das Pairing mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Gateway-Verbindungsinformationen in
`~/.openclaw/node.json`.

## Exec-Genehmigungen

`system.run` wird durch lokale Exec-Genehmigungen abgesichert:

- `~/.openclaw/exec-approvals.json`
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für genehmigte asynchrone Node-Execs erstellt OpenClaw vor der Eingabeaufforderung einen kanonischen `systemRunPlan`.
Die spätere genehmigte Weiterleitung von `system.run` verwendet diesen gespeicherten Plan erneut, sodass Änderungen an
`command`-/`cwd`-/`session`-Feldern, nachdem die Genehmigungsanfrage erstellt wurde, abgelehnt werden, statt zu ändern,
was der Node ausführt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
