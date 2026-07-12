---
read_when:
    - OpenClaw auf Render bereitstellen
    - Sie möchten eine deklarative Cloud-Bereitstellung mit Render Blueprints.
summary: OpenClaw auf Render mit Infrastructure-as-Code bereitstellen
title: Render
x-i18n:
    generated_at: "2026-07-12T15:27:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Stellen Sie OpenClaw auf [Render](https://render.com) mithilfe der `render.yaml`-Blueprint des Repositorys bereit. Sie definiert den Dienst, den Datenträger und die Umgebungsvariablen in einer einzigen Datei.

## Voraussetzungen

- Ein [Render-Konto](https://render.com) (kostenloser Tarif verfügbar)
- Ein API-Schlüssel von Ihrem bevorzugten [Modell-Provider](/de/providers)

## Bereitstellung

[Auf Render bereitstellen](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Dadurch wird anhand von `render.yaml` ein Render-Dienst erstellt, das Docker-Image gebaut und bereitgestellt. Ihre Dienst-URL folgt dem Muster `https://<service-name>.onrender.com`.

## Die Blueprint

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
        generateValue: true # generiert automatisch ein sicheres Token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Funktion              | Zweck                                                               |
| --------------------- | ------------------------------------------------------------------- |
| `runtime: docker`     | Erstellt das Image aus dem Dockerfile des Repositorys               |
| `healthCheckPath`     | Render überwacht `/health` und startet fehlerhafte Instanzen neu    |
| `generateValue: true` | Generiert automatisch einen kryptografisch sicheren Wert            |
| `disk`                | Persistenter Speicher, der erneute Bereitstellungen überdauert      |

## Tarif auswählen

| Tarif     | Herunterfahren          | Datenträger    | Am besten geeignet für             |
| --------- | ----------------------- | -------------- | ---------------------------------- |
| Free      | Nach 15 Min. Inaktivität | Nicht verfügbar | Tests, Demos                       |
| Starter   | Nie                     | 1GB+           | Persönliche Nutzung, kleine Teams  |
| Standard+ | Nie                     | 1GB+           | Produktion, mehrere Kanäle         |

Die Blueprint verwendet standardmäßig `starter`. Um den kostenlosen Tarif zu verwenden, ändern Sie `plan: free` in der `render.yaml` Ihres Forks. Beachten Sie, dass der OpenClaw-Zustand ohne persistenten Datenträger bei jeder Bereitstellung zurückgesetzt wird.

## Nach der Bereitstellung

### Auf die Steuerungsoberfläche zugreifen

Das Web-Dashboard ist unter `https://<your-service>.onrender.com/` verfügbar. Stellen Sie die Verbindung mit dem gemeinsamen Geheimnis her: dem automatisch generierten `OPENCLAW_GATEWAY_TOKEN` (Sie finden es unter **Dashboard → your service → Environment**) oder Ihrem Passwort, falls Sie zur Passwortauthentifizierung gewechselt haben.

### Protokolle

**Dashboard → your service → Logs** zeigt Build-Protokolle (Erstellung des Docker-Images), Bereitstellungsprotokolle (Start des Dienstes) und Laufzeitprotokolle (Anwendungsausgabe).

### Shell-Zugriff

**Dashboard → your service → Shell** öffnet eine Shell-Sitzung. Der persistente Datenträger ist unter `/data` eingehängt.

### Umgebungsvariablen

Bearbeiten Sie Variablen unter **Dashboard → your service → Environment**. Änderungen lösen automatisch eine erneute Bereitstellung aus.

### Automatische Bereitstellung

Render führt automatisch eine erneute Bereitstellung durch, wenn der Branch des verbundenen Repositorys einen neuen Commit erhält. Wenn Sie direkt von `openclaw/openclaw` statt von Ihrem eigenen Fork bereitgestellt haben, besitzen Sie keinen Push-Zugriff, um dies auszulösen. Aktualisieren Sie daher über eine manuelle Blueprint-Synchronisierung im Dashboard oder verknüpfen Sie den Dienst mit Ihrem eigenen Fork.

## Benutzerdefinierte Domain

1. **Dashboard → your service → Settings → Custom Domains**
2. Fügen Sie Ihre Domain hinzu
3. Konfigurieren Sie DNS gemäß den Anweisungen (CNAME auf `*.onrender.com`)
4. Render stellt automatisch ein TLS-Zertifikat bereit

## Skalierung

- **Vertikal**: Wechseln Sie den Tarif, um mehr CPU/RAM zu erhalten. Dies reicht für OpenClaw normalerweise aus.
- **Horizontal**: Erhöhen Sie die Anzahl der Instanzen (Standard-Tarif und höher). Dies erfordert Sticky Sessions oder eine externe Zustandsverwaltung, da OpenClaw den Laufzeitzustand auf dem lokalen Datenträger speichert.

## Sicherungen und Migration

Über die Shell des Render-Dashboards können Sie jederzeit Zustand, Konfiguration, Authentifizierungsprofile und Arbeitsbereich exportieren:

```bash
openclaw backup create
```

Dadurch wird ein portables Sicherungsarchiv erstellt. Siehe [Sicherung](/de/cli/backup).

## Fehlerbehebung

### Dienst startet nicht

Prüfen Sie die Bereitstellungsprotokolle im Render-Dashboard. Häufige Probleme:

- Fehlendes `OPENCLAW_GATEWAY_TOKEN` – überprüfen Sie, ob es unter **Dashboard → Environment** festgelegt ist
- Nicht übereinstimmender Port – stellen Sie sicher, dass `OPENCLAW_GATEWAY_PORT=8080` festgelegt ist, damit das Gateway an den von Render erwarteten Port gebunden wird

### Langsame Kaltstarts (kostenloser Tarif)

Dienste im kostenlosen Tarif werden nach 15 Minuten Inaktivität heruntergefahren. Die erste Anfrage nach dem Herunterfahren dauert einige Sekunden, während der Container startet. Wechseln Sie für einen dauerhaften Betrieb zum Starter-Tarif.

### Datenverlust nach erneuter Bereitstellung

Dies tritt im kostenlosen Tarif auf, da kein persistenter Datenträger verfügbar ist. Wechseln Sie zu einem kostenpflichtigen Tarif oder exportieren Sie regelmäßig über die Render-Shell mit `openclaw backup create` eine Sicherung.

### Fehlgeschlagene Integritätsprüfungen

Wenn Builds erfolgreich sind, Bereitstellungen jedoch fehlschlagen, benötigt der Dienst möglicherweise zu lange zum Starten oder `/health` ist möglicherweise nicht erreichbar. Prüfen Sie Folgendes:

- Build-Protokolle auf Fehler
- Ob der Container lokal mit `docker build && docker run` ausgeführt wird

## Nächste Schritte

- Nachrichtenkanäle einrichten: [Kanäle](/de/channels)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Aktualisierung](/de/install/updating)
