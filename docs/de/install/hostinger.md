---
read_when:
    - OpenClaw auf Hostinger einrichten
    - Auf der Suche nach einem verwalteten VPS für OpenClaw
    - Hostinger 1-Click OpenClaw verwenden
summary: OpenClaw auf Hostinger hosten
title: Hostinger
x-i18n:
    generated_at: "2026-07-24T05:02:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Führen Sie ein dauerhaftes OpenClaw Gateway auf [Hostinger](https://www.hostinger.com/openclaw) aus, entweder als verwaltete **1-Click**-Bereitstellung oder als selbst administrierte **VPS**-Installation.

## Voraussetzungen

- Hostinger-Konto ([registrieren](https://www.hostinger.com/openclaw))
- Etwa 5–10 Minuten

## Option A: OpenClaw mit 1-Click

Hostinger übernimmt die Infrastruktur, Docker und automatische Updates. Dies ist der schnellste Weg zu einer laufenden Instanz.

<Steps>
  <Step title="Kaufen und starten">
    1. Wählen Sie auf der [Hostinger-OpenClaw-Seite](https://www.hostinger.com/openclaw) einen Managed-OpenClaw-Tarif aus und schließen Sie den Kauf ab.

    <Note>
    Während des Bezahlvorgangs können Sie vorab erworbene **Ready-to-Use AI**-Guthaben auswählen, die sofort in OpenClaw integriert werden – externe Konten oder API-Schlüssel anderer Provider sind nicht erforderlich. Sie können sofort mit dem Chatten beginnen. Alternativ können Sie während der Einrichtung einen eigenen Schlüssel von Anthropic, OpenAI, Google Gemini oder xAI angeben.
    </Note>

  </Step>

  <Step title="Messaging-Kanal auswählen">
    Wählen Sie einen oder mehrere zu verbindende Kanäle aus:

    - **WhatsApp** – scannen Sie den im Einrichtungsassistenten angezeigten QR-Code.
    - **Telegram** – fügen Sie das Bot-Token von [BotFather](https://t.me/BotFather) ein.

  </Step>

  <Step title="Installation abschließen">
    Klicken Sie auf **Finish**, um die Instanz bereitzustellen. Sobald sie bereit ist, können Sie über **OpenClaw Overview** in hPanel auf das OpenClaw-Dashboard zugreifen.
  </Step>

</Steps>

## Option B: OpenClaw auf einem VPS

Diese Option bietet mehr Kontrolle über den Server. Hostinger stellt OpenClaw über Docker auf Ihrem VPS bereit; Sie verwalten es über den **Docker Manager** in hPanel.

<Steps>
  <Step title="VPS kaufen">
    1. Wählen Sie auf der [Hostinger-OpenClaw-Seite](https://www.hostinger.com/openclaw) einen OpenClaw-on-VPS-Tarif aus und schließen Sie den Kauf ab.

    <Note>
    Während des Bezahlvorgangs können Sie **Ready-to-Use AI**-Guthaben auswählen. Diese werden vorab erworben und sofort in OpenClaw integriert, sodass Sie ohne externe Konten oder API-Schlüssel anderer Provider mit dem Chatten beginnen können.
    </Note>

  </Step>

  <Step title="OpenClaw konfigurieren">
    Sobald der VPS bereitgestellt ist, füllen Sie die Konfigurationsfelder aus:

    - **Gateway token** – wird automatisch generiert; speichern Sie ihn zur späteren Verwendung.
    - **WhatsApp number** – Ihre Nummer mit Ländervorwahl (optional).
    - **Telegram bot token** – von [BotFather](https://t.me/BotFather) (optional).
    - **API keys** – nur erforderlich, wenn Sie während des Bezahlvorgangs keine Ready-to-Use AI-Guthaben ausgewählt haben.

  </Step>

  <Step title="OpenClaw starten">
    Klicken Sie auf **Deploy**. Sobald OpenClaw ausgeführt wird, öffnen Sie das OpenClaw-Dashboard in hPanel, indem Sie auf **Open** klicken.
  </Step>

</Steps>

Protokolle, Neustarts und Updates werden über die Docker-Manager-Oberfläche in hPanel verwaltet. Drücken Sie zum Aktualisieren im Docker Manager auf **Update**, um das neueste Image abzurufen.

## Einrichtung überprüfen

Senden Sie Ihrem Assistenten über den verbundenen Kanal „Hallo“. OpenClaw antwortet und führt Sie durch die anfänglichen Einstellungen.

## Fehlerbehebung

**Dashboard wird nicht geladen** – warten Sie einige Minuten, bis die Bereitstellung des Containers abgeschlossen ist, und prüfen Sie dann die Docker-Manager-Protokolle in hPanel.

**Docker-Container wird ständig neu gestartet** – öffnen Sie die Docker-Manager-Protokolle und suchen Sie nach Konfigurationsfehlern (fehlende Tokens, ungültige API-Schlüssel).

**Telegram-Bot antwortet nicht** – wenn eine DM-Kopplung erforderlich ist, erhält ein unbekannter Absender statt einer Antwort einen kurzen Kopplungscode. Genehmigen Sie ihn im Chat des OpenClaw-Dashboards oder mit `openclaw pairing approve telegram <CODE>`, falls Sie Shell-Zugriff auf den Container haben. Siehe [Kopplung](/de/channels/pairing).

## Nächste Schritte

- [Kanäle](/de/channels) – Telegram, WhatsApp, Discord und weitere verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) – alle Konfigurationsoptionen

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [VPS-Hosting](/de/vps)
- [DigitalOcean](/de/install/digitalocean)
