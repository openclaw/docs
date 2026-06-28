---
read_when:
    - OpenClaw auf Hostinger einrichten
    - Suche nach einem verwalteten VPS für OpenClaw
    - Hostinger 1-Click OpenClaw nutzen
summary: OpenClaw auf Hostinger hosten
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T06:44:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Ein persistentes OpenClaw Gateway auf [Hostinger](https://www.hostinger.com/openclaw) über eine verwaltete **1-Click**-Bereitstellung oder eine **VPS**-Installation ausführen.

## Voraussetzungen

- Hostinger-Konto ([Registrierung](https://www.hostinger.com/openclaw))
- Etwa 5–10 Minuten

## Option A: 1-Click OpenClaw

Der schnellste Weg für den Einstieg. Hostinger übernimmt Infrastruktur, Docker und automatische Updates.

<Steps>
  <Step title="Kaufen und starten">
    1. Wählen Sie auf der [Hostinger-OpenClaw-Seite](https://www.hostinger.com/openclaw) einen Managed-OpenClaw-Plan und schließen Sie den Checkout ab.

    <Note>
    Während des Checkouts können Sie Credits für **Ready-to-Use AI** auswählen, die vorab gekauft und sofort in OpenClaw integriert werden -- keine externen Konten oder API-Schlüssel anderer Provider erforderlich. Sie können sofort loschatten. Alternativ können Sie während der Einrichtung Ihren eigenen Schlüssel von Anthropic, OpenAI, Google Gemini oder xAI angeben.
    </Note>

  </Step>

  <Step title="Einen Messaging-Channel auswählen">
    Wählen Sie einen oder mehrere Channels, die verbunden werden sollen:

    - **WhatsApp** -- scannen Sie den im Setup-Assistenten angezeigten QR-Code.
    - **Telegram** -- fügen Sie den Bot-Token von [BotFather](https://t.me/BotFather) ein.

  </Step>

  <Step title="Installation abschließen">
    Klicken Sie auf **Finish**, um die Instanz bereitzustellen. Sobald sie bereit ist, greifen Sie über **OpenClaw Overview** in hPanel auf das OpenClaw-Dashboard zu.
  </Step>

</Steps>

## Option B: OpenClaw auf VPS

Mehr Kontrolle über Ihren Server. Hostinger stellt OpenClaw über Docker auf Ihrem VPS bereit, und Sie verwalten es über den **Docker Manager** in hPanel.

<Steps>
  <Step title="Einen VPS kaufen">
    1. Wählen Sie auf der [Hostinger-OpenClaw-Seite](https://www.hostinger.com/openclaw) einen Plan „OpenClaw on VPS“ und schließen Sie den Checkout ab.

    <Note>
    Sie können während des Checkouts Credits für **Ready-to-Use AI** auswählen -- diese werden vorab gekauft und sofort in OpenClaw integriert, sodass Sie ohne externe Konten oder API-Schlüssel anderer Provider loschatten können.
    </Note>

  </Step>

  <Step title="OpenClaw konfigurieren">
    Sobald der VPS bereitgestellt ist, füllen Sie die Konfigurationsfelder aus:

    - **Gateway token** -- automatisch generiert; speichern Sie es für die spätere Verwendung.
    - **WhatsApp-Nummer** -- Ihre Nummer mit Landesvorwahl (optional).
    - **Telegram bot token** -- von [BotFather](https://t.me/BotFather) (optional).
    - **API keys** -- nur erforderlich, wenn Sie beim Checkout keine Credits für Ready-to-Use AI ausgewählt haben.

  </Step>

  <Step title="OpenClaw starten">
    Klicken Sie auf **Deploy**. Sobald es läuft, öffnen Sie das OpenClaw-Dashboard in hPanel durch Klick auf **Open**.
  </Step>

</Steps>

Logs, Neustarts und Updates werden direkt über die Oberfläche des Docker Manager in hPanel verwaltet. Zum Aktualisieren klicken Sie im Docker Manager auf **Update**; dadurch wird das neueste Image gezogen.

## Ihr Setup verifizieren

Senden Sie „Hi“ an Ihren Assistant in dem verbundenen Channel. OpenClaw antwortet und führt Sie durch die ersten Einstellungen.

## Fehlerbehebung

**Dashboard lädt nicht** -- Warten Sie einige Minuten, bis der Container die Bereitstellung abgeschlossen hat. Prüfen Sie die Logs im Docker Manager in hPanel.

**Docker-Container startet ständig neu** -- Öffnen Sie die Logs im Docker Manager und suchen Sie nach Konfigurationsfehlern (fehlende Tokens, ungültige API keys).

**Telegram-Bot antwortet nicht** -- Senden Sie Ihre Pairing-Code-Nachricht direkt aus Telegram als Nachricht in Ihren OpenClaw-Chat, um die Verbindung abzuschließen.

## Nächste Schritte

- [Channels](/de/channels) -- Telegram, WhatsApp, Discord und weitere verbinden
- [Gateway configuration](/de/gateway/configuration) -- alle Konfigurationsoptionen

## Verwandt

- [Install overview](/de/install)
- [VPS hosting](/de/vps)
- [DigitalOcean](/de/install/digitalocean)
