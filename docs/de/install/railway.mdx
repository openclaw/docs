---
read_when:
    - OpenClaw auf Railway bereitstellen
    - Sie möchten eine Cloud-Bereitstellung mit nur einem Klick und browserbasierter Steuerungsoberfläche
summary: OpenClaw mit einer Ein-Klick-Vorlage auf Railway bereitstellen
title: Railway
x-i18n:
    generated_at: "2026-07-12T01:49:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Stellen Sie OpenClaw mit einer Ein-Klick-Vorlage auf Railway bereit und greifen Sie über die webbasierte Control UI darauf zu. Dies ist der einfachste Weg „ohne Terminal auf dem Server“: Railway führt den Gateway für Sie aus.

## Ein-Klick-Bereitstellung

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Auf Railway bereitstellen
</a>

<Steps>
  <Step title="Vorlage bereitstellen">
    Klicken Sie oben auf **Deploy on Railway**.
  </Step>

<Step title="Volume hinzufügen">
  Binden Sie ein unter `/data` eingehängtes Volume ein (für die dauerhafte Speicherung des Zustands erforderlich).
</Step>

  <Step title="Variablen festlegen">
    Legen Sie die erforderlichen **Variables** für den Dienst fest:

    - `OPENCLAW_GATEWAY_PORT=8080` (erforderlich – muss mit dem Port unter Public Networking übereinstimmen)
    - `OPENCLAW_GATEWAY_TOKEN` (erforderlich; wie ein Administratorgeheimnis behandeln)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (empfohlen)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (empfohlen)

  </Step>

<Step title="Öffentlichen Netzwerkzugriff aktivieren">
  Aktivieren Sie unter **Public Networking** für den Dienst auf Port `8080` die Option **HTTP Proxy**.
</Step>

  <Step title="Verbinden">
    Sie finden Ihre öffentliche URL unter **Railway -> your service -> Settings -> Domains** – entweder eine generierte Domain (häufig `https://<something>.up.railway.app`) oder Ihre verknüpfte benutzerdefinierte Domain.

    Öffnen Sie `https://<your-railway-domain>/openclaw` und stellen Sie die Verbindung mit dem konfigurierten gemeinsamen Geheimnis her. Die Vorlage verwendet standardmäßig `OPENCLAW_GATEWAY_TOKEN`; wenn Sie dies durch eine Passwortauthentifizierung ersetzen, verwenden Sie stattdessen dieses Passwort.

  </Step>
</Steps>

## Was Sie erhalten

- Gehosteter OpenClaw Gateway mit Control UI
- Dauerhafter Speicher über das Railway-Volume (`/data`), sodass `openclaw.json`, die agentspezifischen `auth-profiles.json`, der Kanal-/Provider-Zustand, Sitzungen und der Arbeitsbereich erneute Bereitstellungen überdauern

## Kanal verbinden

Verwenden Sie für Anweisungen zur Kanaleinrichtung die Control UI unter `/openclaw` oder führen Sie `openclaw onboard` über die Shell von Railway aus:

- [Discord](/de/channels/discord)
- [Telegram](/de/channels/telegram) (am schnellsten – Sie benötigen lediglich ein Bot-Token)
- [Alle Kanäle](/de/channels)

## Sicherungen und Migration

Exportieren Sie Ihren Zustand, Ihre Konfiguration, Ihre Authentifizierungsprofile und Ihren Arbeitsbereich:

```bash
openclaw backup create
```

Dadurch wird ein portables Sicherungsarchiv mit dem OpenClaw-Zustand und allen konfigurierten Arbeitsbereichen erstellt. Einzelheiten finden Sie unter [Sicherung](/de/cli/backup).

## Nächste Schritte

- Nachrichtenkanäle einrichten: [Kanäle](/de/channels)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- OpenClaw auf dem neuesten Stand halten: [Aktualisierung](/de/install/updating)
