---
read_when:
    - Headless-Node-Host ausführen
    - Nicht-macOS-Node für system.run koppeln
summary: CLI-Referenz für `openclaw node` (Headless-Node-Host)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:19:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Führen Sie einen **Headless-Node-Host** aus, der sich mit dem Gateway-WebSocket verbindet und
`system.run` / `system.which` auf diesem Rechner bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Agenten **Befehle auf anderen Rechnern** in Ihrem
Netzwerk ausführen sollen, ohne dort eine vollständige macOS-Companion-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Laborrechner, NAS).
- Exec auf dem Gateway **in einer Sandbox** halten, aber genehmigte Ausführungen an andere Hosts delegieren.
- Ein leichtgewichtiges, Headless-Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung bleibt weiterhin durch **Exec-Genehmigungen** und agentenspezifische Allowlists auf dem
Node-Host geschützt, sodass Sie den Befehlszugriff eng begrenzen und explizit halten können.

## Browser-Proxy (Zero-Config)

Node-Hosts kündigen automatisch einen Browser-Proxy an, wenn `browser.enabled` auf dem Node nicht
deaktiviert ist. Dadurch kann der Agent Browser-Automatisierung auf diesem Node
ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browser-Profiloberfläche des Node bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` festlegen, wird der Proxy restriktiv:
Nicht in der Allowlist enthaltenes Profil-Targeting wird abgelehnt, und persistente Profil-
Erstellungs-/Löschrouten werden über den Proxy blockiert.

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

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerabdruck (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Node überschreiben

## Gateway-Authentifizierung für Node-Host

`openclaw node run` und `openclaw node install` lösen Gateway-Authentifizierung aus Konfiguration/Umgebung auf (keine `--token`-/`--password`-Flags für Node-Befehle):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Danach lokaler Konfigurations-Fallback: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus erbt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Node-Authentifizierungsauflösung geschlossen fehl (keine maskierende Remote-Ausweichlösung).
- In `gateway.mode=remote` kommen Remote-Client-Felder (`gateway.remote.token` / `gateway.remote.password`) ebenfalls gemäß den Remote-Prioritätsregeln infrage.
- Die Authentifizierungsauflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

Für einen Node, der eine Verbindung zu einem Klartext-`ws://`-Gateway herstellt, werden Loopback, private IP-
Literale, `.local` und Tailnet-`*.ts.net`-Hosts akzeptiert. Für andere
vertrauenswürdige Private-DNS-Namen setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; ohne
dies schlägt der Node-Start geschlossen fehl und fordert Sie auf, `wss://`, einen SSH-Tunnel oder
Tailscale zu verwenden. Dies ist eine Opt-in-Einstellung in der Prozessumgebung, kein `openclaw.json`-Konfigurationsschlüssel.
`openclaw node install` speichert sie im überwachten Node-Dienst, wenn sie in der
Umgebung des Installationsbefehls vorhanden ist.

## Dienst (Hintergrund)

Installieren Sie einen Headless-Node-Host als Benutzerdienst.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerabdruck (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Node überschreiben
- `--runtime <runtime>`: Dienst-Runtime (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, wenn bereits installiert

Dienst verwalten:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (kein Dienst).

Dienstbefehle akzeptieren `--json` für maschinenlesbare Ausgabe.

Der Node-Host wiederholt Gateway-Neustarts und Netzwerk-Schließungen im Prozess. Wenn das
Gateway eine terminale Token-/Passwort-/Bootstrap-Authentifizierungspause meldet, protokolliert der Node-Host
das Schließungsdetail und beendet sich mit einem Wert ungleich null, damit launchd/systemd ihn mit
frischer Konfiguration und Anmeldedaten neu starten kann. Pairing-erforderliche Pausen bleiben im Vordergrund-
Ablauf, damit die ausstehende Anfrage genehmigt werden kann.

## Pairing

Die erste Verbindung erstellt eine ausstehende Geräte-Pairing-Anfrage (`role: node`) auf dem Gateway.
Genehmigen Sie sie über:

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
angeforderte Scopes. Operator-/Browser-Clients, Control UI, WebChat sowie Rollen-,
Scope-, Metadaten- oder Public-Key-Upgrades erfordern weiterhin manuelle Genehmigung.

Wenn der Node das Pairing mit geänderten Authentifizierungsdetails (Rolle/Scopes/Public Key) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Gateway-Verbindungsinformationen in
`~/.openclaw/node.json`.

## Exec-Genehmigungen

`system.run` wird durch lokale Exec-Genehmigungen gesteuert:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, oder
  `~/.openclaw/exec-approvals.json`, wenn die Variable nicht gesetzt ist
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für genehmigtes asynchrones Node-Exec bereitet OpenClaw vor der Nachfrage einen kanonischen `systemRunPlan`
vor. Die später genehmigte Weiterleitung von `system.run` verwendet diesen gespeicherten
Plan wieder, sodass Änderungen an Befehls-/cwd-/Sitzungsfeldern nach Erstellung der Genehmigungsanfrage
abgelehnt werden, statt zu ändern, was der Node ausführt.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
