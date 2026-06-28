---
read_when:
    - OpenClaw auf Render bereitstellen
    - Sie möchten eine deklarative Cloud-Bereitstellung mit Render Blueprints
summary: OpenClaw auf Render mit Infrastructure-as-Code bereitstellen
title: Render
x-i18n:
    generated_at: "2026-04-23T14:03:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Render

Stellen Sie OpenClaw auf Render mithilfe von Infrastructure as Code bereit. Das enthaltene `render.yaml`-Blueprint definiert Ihren gesamten Stack deklarativ — Service, Datenträger, Umgebungsvariablen —, sodass Sie mit einem Klick bereitstellen und Ihre Infrastruktur parallel zu Ihrem Code versionieren können.

## Voraussetzungen

- Ein [Render-Konto](https://render.com) (Free-Tier verfügbar)
- Ein API-Schlüssel Ihres bevorzugten [Modell-Providers](/de/providers)

## Mit einem Render-Blueprint bereitstellen

[Deploy to Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Ein Klick auf diesen Link führt Folgendes aus:

1. Es wird ein neuer Render-Service aus dem `render.yaml`-Blueprint im Root dieses Repositorys erstellt.
2. Das Docker-Image wird gebaut und bereitgestellt.

Nach der Bereitstellung folgt Ihre Service-URL dem Muster `https://<service-name>.onrender.com`.

## Das Blueprint verstehen

Render-Blueprints sind YAML-Dateien, die Ihre Infrastruktur definieren. Das `render.yaml` in diesem
Repository konfiguriert alles, was zum Ausführen von OpenClaw benötigt wird:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Verwendete wichtige Blueprint-Funktionen:

| Funktion              | Zweck                                                      |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Baut aus dem Dockerfile des Repositorys                    |
| `healthCheckPath`     | Render überwacht `/health` und startet fehlerhafte Instanzen neu |
| `generateValue: true` | Generiert automatisch einen kryptografisch sicheren Wert   |
| `disk`                | Persistenter Speicher, der Neustarts der Bereitstellung übersteht |

## Einen Tarif wählen

| Tarif     | Spin-down          | Datenträger   | Am besten geeignet für         |
| --------- | ------------------ | ------------- | ------------------------------ |
| Free      | Nach 15 Min. Inaktivität | Nicht verfügbar | Tests, Demos              |
| Starter   | Nie                | 1GB+          | Private Nutzung, kleine Teams  |
| Standard+ | Nie                | 1GB+          | Produktion, mehrere Channels   |

Das Blueprint verwendet standardmäßig `starter`. Um den Free-Tier zu nutzen, ändern Sie `plan: free` in
`render.yaml` Ihres Forks (beachten Sie jedoch: Ohne persistenten Datenträger wird der OpenClaw-Status
bei jeder Bereitstellung zurückgesetzt).

## Nach der Bereitstellung

### Auf die Control UI zugreifen

Das Web-Dashboard ist verfügbar unter `https://<your-service>.onrender.com/`.

Verbinden Sie sich mit dem konfigurierten gemeinsamen Secret. Diese Bereitstellungsvorlage generiert
`OPENCLAW_GATEWAY_TOKEN` automatisch (zu finden unter **Dashboard → Ihr Service →
Environment**); wenn Sie es durch Passwortauthentifizierung ersetzen, verwenden Sie stattdessen
dieses Passwort.

## Funktionen des Render-Dashboards

### Logs

Zeigen Sie Echtzeit-Logs unter **Dashboard → Ihr Service → Logs** an. Filtern nach:

- Build-Logs (Erstellung des Docker-Images)
- Deploy-Logs (Start des Service)
- Runtime-Logs (Ausgabe der Anwendung)

### Shell-Zugriff

Zum Debuggen öffnen Sie eine Shell-Sitzung über **Dashboard → Ihr Service → Shell**. Der persistente Datenträger ist unter `/data` gemountet.

### Umgebungsvariablen

Ändern Sie Variablen unter **Dashboard → Ihr Service → Environment**. Änderungen lösen automatisch eine neue Bereitstellung aus.

### Auto-Deploy

Wenn Sie das ursprüngliche OpenClaw-Repository verwenden, stellt Render Ihr OpenClaw nicht automatisch neu bereit. Zum Aktualisieren führen Sie im Dashboard eine manuelle Blueprint-Synchronisierung aus.

## Benutzerdefinierte Domain

1. Gehen Sie zu **Dashboard → Ihr Service → Settings → Custom Domains**
2. Fügen Sie Ihre Domain hinzu
3. Konfigurieren Sie DNS wie angegeben (CNAME auf `*.onrender.com`)
4. Render stellt automatisch ein TLS-Zertifikat bereit

## Skalierung

Render unterstützt horizontale und vertikale Skalierung:

- **Vertikal**: Ändern Sie den Tarif, um mehr CPU/RAM zu erhalten
- **Horizontal**: Erhöhen Sie die Anzahl der Instanzen (Standard-Tarif und höher)

Für OpenClaw ist vertikale Skalierung in der Regel ausreichend. Horizontale Skalierung erfordert Sticky Sessions oder externe Statusverwaltung.

## Backups und Migration

Exportieren Sie Ihren Status, Ihre Konfiguration, Auth-Profile und den Workspace jederzeit über den
Shell-Zugriff im Render-Dashboard:

```bash
openclaw backup create
```

Dadurch wird ein portables Backup-Archiv mit dem OpenClaw-Status plus einem eventuell konfigurierten
Workspace erstellt. Siehe [Backup](/de/cli/backup) für Details.

## Fehlerbehebung

### Service startet nicht

Prüfen Sie die Deploy-Logs im Render-Dashboard. Häufige Probleme:

- Fehlendes `OPENCLAW_GATEWAY_TOKEN` — prüfen Sie, ob es unter **Dashboard → Environment** gesetzt ist
- Port-Konflikt — stellen Sie sicher, dass `OPENCLAW_GATEWAY_PORT=8080` gesetzt ist, damit sich das Gateway an den von Render erwarteten Port bindet

### Langsame Kaltstarts (Free-Tier)

Services im Free-Tier fahren nach 15 Minuten Inaktivität herunter. Die erste Anfrage danach dauert einige Sekunden, während der Container startet. Wechseln Sie zum Starter-Tarif für Always-on.

### Datenverlust nach erneuter Bereitstellung

Dies passiert im Free-Tier (kein persistenter Datenträger). Wechseln Sie zu einem kostenpflichtigen Tarif oder
exportieren Sie regelmäßig ein vollständiges Backup über `openclaw backup create` in der Render-Shell.

### Fehler bei Health Checks

Render erwartet innerhalb von 30 Sekunden eine Antwort mit Status 200 von `/health`. Wenn Builds erfolgreich sind, Bereitstellungen aber fehlschlagen, startet der Service möglicherweise zu langsam. Prüfen Sie:

- Build-Logs auf Fehler
- Ob der Container lokal mit `docker build && docker run` läuft

## Nächste Schritte

- Messaging-Channels einrichten: [Channels](/de/channels)
- Das Gateway konfigurieren: [Gateway configuration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Updating](/de/install/updating)
