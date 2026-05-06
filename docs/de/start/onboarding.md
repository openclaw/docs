---
read_when:
    - Konzeption des macOS-Onboarding-Assistenten
    - Authentifizierung oder Identitätseinrichtung implementieren
sidebarTitle: 'Onboarding: macOS App'
summary: Einrichtungsablauf beim ersten Start für OpenClaw (macOS-App)
title: Onboarding (macOS-App)
x-i18n:
    generated_at: "2026-05-06T07:03:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Dieses Dokument beschreibt den **aktuellen** Einrichtungsablauf beim ersten Start. Ziel ist eine
reibungslose „Tag 0“-Erfahrung: auswählen, wo der Gateway ausgeführt wird, Authentifizierung verbinden, den
Assistenten ausführen und den Agenten sich selbst bootstrappen lassen.
Eine allgemeine Übersicht über Onboarding-Pfade finden Sie unter [Onboarding-Übersicht](/de/start/onboarding-overview).

<Steps>
<Step title="macOS-Warnung bestätigen">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Suche nach lokalen Netzwerken genehmigen">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Willkommen und Sicherheitshinweis">
<Frame caption="Lesen Sie den angezeigten Sicherheitshinweis und entscheiden Sie entsprechend">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Sicherheits-Vertrauensmodell:

- Standardmäßig ist OpenClaw ein persönlicher Agent: eine vertrauenswürdige Betreibergrenze.
- Gemeinsame/Mehrbenutzer-Setups erfordern Absicherung (Vertrauensgrenzen trennen, Tool-Zugriff minimal halten und [Sicherheit](/de/gateway/security) befolgen).
- Lokales Onboarding setzt neue Konfigurationen jetzt standardmäßig auf `tools.profile: "coding"`, damit frische lokale Setups Dateisystem-/Runtime-Tools behalten, ohne das uneingeschränkte Profil `full` zu erzwingen.
- Wenn Hooks/Webhooks oder andere Feeds mit nicht vertrauenswürdigen Inhalten aktiviert sind, verwenden Sie eine starke moderne Modellstufe und halten Sie Tool-Richtlinien/Sandboxing streng.

</Step>
<Step title="Lokal vs. Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Wo wird der **Gateway** ausgeführt?

- **Dieser Mac (nur lokal):** Das Onboarding kann Authentifizierung konfigurieren und Anmeldedaten
  lokal schreiben.
- **Remote (über SSH/Tailnet):** Das Onboarding konfiguriert **keine** lokale Authentifizierung;
  Anmeldedaten müssen auf dem Gateway-Host vorhanden sein.
- **Später konfigurieren:** Einrichtung überspringen und die App unkonfiguriert lassen.

<Tip>
**Tipp zur Gateway-Authentifizierung:**

- Der Assistent erzeugt jetzt auch für Loopback ein **Token**, daher müssen sich lokale WS-Clients authentifizieren.
- Wenn Sie die Authentifizierung deaktivieren, kann jeder lokale Prozess eine Verbindung herstellen; verwenden Sie das nur auf vollständig vertrauenswürdigen Maschinen.
- Verwenden Sie ein **Token** für Zugriff von mehreren Maschinen oder Bindings außerhalb von Loopback.

</Tip>
</Step>
<Step title="Berechtigungen">
<Frame caption="Wählen Sie aus, welche Berechtigungen Sie OpenClaw erteilen möchten">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Das Onboarding fordert TCC-Berechtigungen an, die benötigt werden für:

- Automatisierung (AppleScript)
- Benachrichtigungen
- Bedienungshilfen
- Bildschirmaufnahme
- Mikrofon
- Spracherkennung
- Kamera
- Standort

</Step>
<Step title="CLI">
  <Info>Dieser Schritt ist optional</Info>
  Die App kann die globale `openclaw`-CLI über npm, pnpm oder bun installieren.
  Sie bevorzugt zuerst npm, dann pnpm und danach bun, wenn dies der einzige erkannte
  Paketmanager ist. Für die Gateway-Runtime bleibt Node der empfohlene Weg.
</Step>
<Step title="Onboarding-Chat (dedizierte Sitzung)">
  Nach der Einrichtung öffnet die App eine dedizierte Onboarding-Chat-Sitzung, damit der Agent sich
  vorstellen und durch die nächsten Schritte führen kann. Dadurch bleibt die Anleitung beim ersten Start von
  Ihrer normalen Unterhaltung getrennt. Unter [Bootstrapping](/de/start/bootstrapping) erfahren Sie,
  was beim ersten Agentenlauf auf dem Gateway-Host passiert.
</Step>
</Steps>

## Verwandt

- [Onboarding-Übersicht](/de/start/onboarding-overview)
- [Erste Schritte](/de/start/getting-started)
