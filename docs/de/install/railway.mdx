---
read_when:
    - OpenClaw auf Railway bereitstellen
    - Sie möchten ein One-Click-Cloud-Deployment mit browserbasierter Control UI
summary: OpenClaw mit der One-Click-Vorlage auf Railway bereitstellen
title: Railway
x-i18n:
    generated_at: "2026-04-23T14:03:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Railway

Stellen Sie OpenClaw mit einer One-Click-Vorlage auf Railway bereit und greifen Sie über die webbasierte Control UI darauf zu.
Dies ist der einfachste Weg „ohne Terminal auf dem Server“: Railway führt das Gateway für Sie aus.

## Schnelle Checkliste (neue Benutzer)

1. Klicken Sie auf **Deploy on Railway** (unten).
2. Fügen Sie ein **Volume** hinzu, das unter `/data` gemountet ist.
3. Setzen Sie die erforderlichen **Variables** (mindestens `OPENCLAW_GATEWAY_PORT` und `OPENCLAW_GATEWAY_TOKEN`).
4. Aktivieren Sie **HTTP Proxy** auf Port `8080`.
5. Öffnen Sie `https://<your-railway-domain>/openclaw` und verbinden Sie sich mit dem konfigurierten Shared Secret. Diese Vorlage verwendet standardmäßig `OPENCLAW_GATEWAY_TOKEN`; wenn Sie es durch Passwortauthentifizierung ersetzen, verwenden Sie stattdessen dieses Passwort.

## One-Click-Deployment

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

Nach der Bereitstellung finden Sie Ihre öffentliche URL unter **Railway → Ihr Dienst → Settings → Domains**.

Railway wird entweder:

- Ihnen eine generierte Domain geben (oft `https://<something>.up.railway.app`), oder
- Ihre benutzerdefinierte Domain verwenden, wenn Sie eine hinzugefügt haben.

Öffnen Sie dann:

- `https://<your-railway-domain>/openclaw` — Control UI

## Was Sie erhalten

- Gehostetes OpenClaw Gateway + Control UI
- Persistenter Speicher über Railway Volume (`/data`), damit `openclaw.json`,
  `auth-profiles.json` pro Agent, Kanal-/Provider-Status, Sitzungen und
  Workspace erneute Bereitstellungen überdauern

## Erforderliche Railway-Einstellungen

### Public Networking

Aktivieren Sie **HTTP Proxy** für den Dienst.

- Port: `8080`

### Volume (erforderlich)

Hängen Sie ein Volume an, das unter folgendem Pfad gemountet ist:

- `/data`

### Variables

Setzen Sie diese Variablen für den Dienst:

- `OPENCLAW_GATEWAY_PORT=8080` (erforderlich — muss mit dem Port in Public Networking übereinstimmen)
- `OPENCLAW_GATEWAY_TOKEN` (erforderlich; als Admin-Geheimnis behandeln)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (empfohlen)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (empfohlen)

## Einen Kanal verbinden

Verwenden Sie die Control UI unter `/openclaw` oder führen Sie `openclaw onboard` über die Railway-Shell aus, um Anweisungen zur Kanaleinrichtung zu erhalten:

- [Telegram](/de/channels/telegram) (am schnellsten — nur ein Bot-Token)
- [Discord](/de/channels/discord)
- [Alle Kanäle](/de/channels)

## Backups und Migration

Exportieren Sie Ihren Status, Ihre Konfiguration, Auth-Profile und Ihren Workspace:

```bash
openclaw backup create
```

Dadurch wird ein portables Backup-Archiv mit dem OpenClaw-Status sowie jedem konfigurierten
Workspace erstellt. Siehe [Backup](/de/cli/backup) für Details.

## Nächste Schritte

- Messaging-Kanäle einrichten: [Channels](/de/channels)
- Das Gateway konfigurieren: [Gateway configuration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Updating](/de/install/updating)
