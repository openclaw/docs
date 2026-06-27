---
read_when:
    - Entwurf des macOS-Onboarding-Assistenten
    - Authentifizierung oder Identitätseinrichtung implementieren
sidebarTitle: 'Onboarding: macOS App'
summary: Ablauf der Ersteinrichtung für OpenClaw (macOS-App)
title: Onboarding (macOS-App)
x-i18n:
    generated_at: "2026-06-27T18:14:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Dieses Dokument beschreibt den **aktuellen** Einrichtungsablauf beim ersten Start. Ziel ist ein
reibungsloses Erlebnis an „Tag 0“: auswählen, wo der Gateway ausgeführt wird, Authentifizierung verbinden, den
Assistenten ausführen und den Agenten sich selbst initialisieren lassen.
Eine allgemeine Übersicht über Onboarding-Pfade finden Sie unter [Onboarding-Übersicht](/de/start/onboarding-overview).

<Steps>
<Step title="macOS-Warnung genehmigen">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Lokale Netzwerke finden genehmigen">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Begrüßung und Sicherheitshinweis">
<Frame caption="Lesen Sie den angezeigten Sicherheitshinweis und entscheiden Sie entsprechend">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Sicherheits-Vertrauensmodell:

- Standardmäßig ist OpenClaw ein persönlicher Agent: eine vertrauenswürdige Betreibergrenze.
- Geteilte/Multi-User-Setups erfordern Absicherung (Vertrauensgrenzen trennen, Tool-Zugriff minimal halten und [Sicherheit](/de/gateway/security) befolgen).
- Lokales Onboarding setzt neue Konfigurationen jetzt standardmäßig auf `tools.profile: "coding"`, damit neue lokale Setups Dateisystem-/Runtime-Tools behalten, ohne das uneingeschränkte Profil `full` zu erzwingen.
- Wenn Hooks/Webhooks oder andere nicht vertrauenswürdige Inhaltsfeeds aktiviert sind, verwenden Sie eine starke moderne Modellstufe und halten Sie Tool-Richtlinien/Sandboxing strikt.

</Step>
<Step title="Lokal vs. Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Wo wird der **Gateway** ausgeführt?

- **Dieser Mac (nur lokal):** Onboarding kann Authentifizierung konfigurieren und Zugangsdaten
  lokal schreiben.
- **Remote (über SSH/Tailnet):** Onboarding konfiguriert **keine** lokale Authentifizierung;
  Zugangsdaten müssen auf dem Gateway-Host vorhanden sein. Das Feld für den Remote-Gateway-Token
  speichert den Token, den die macOS-App verwendet, um sich mit diesem Gateway zu verbinden; vorhandene
  nicht im Klartext gespeicherte `gateway.remote.token`-Werte bleiben erhalten, bis Sie sie ersetzen.
- **Später konfigurieren:** Einrichtung überspringen und die App unkonfiguriert lassen.

<Tip>
**Gateway-Authentifizierungstipp:**

- Der Assistent erzeugt jetzt auch für loopback einen **Token**, sodass lokale WS-Clients sich authentifizieren müssen.
- Wenn Sie Authentifizierung deaktivieren, kann sich jeder lokale Prozess verbinden; verwenden Sie das nur auf vollständig vertrauenswürdigen Rechnern.
- Verwenden Sie einen **Token** für Zugriff von mehreren Rechnern oder Nicht-loopback-Bindings.

</Tip>
</Step>
<Step title="Berechtigungen">
<Frame caption="Wählen Sie aus, welche Berechtigungen Sie OpenClaw erteilen möchten">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding fordert TCC-Berechtigungen an, die benötigt werden für:

- Automatisierung (AppleScript)
- Mitteilungen
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
  Sie bevorzugt zuerst npm, dann pnpm und dann bun, falls dies der einzige erkannte
  Paketmanager ist. Für die Gateway-Runtime bleibt Node der empfohlene Weg.
</Step>
<Step title="Onboarding-Chat (dedizierte Sitzung)">
  Nach der Einrichtung öffnet die App eine dedizierte Onboarding-Chat-Sitzung, damit der Agent
  sich vorstellen und die nächsten Schritte anleiten kann. Dadurch bleibt die Anleitung beim ersten Start von
  Ihrer normalen Unterhaltung getrennt. Unter [Bootstrapping](/de/start/bootstrapping) erfahren Sie,
  was auf dem Gateway-Host während des ersten Agentenlaufs geschieht.
</Step>
</Steps>

## Verwandt

- [Onboarding-Übersicht](/de/start/onboarding-overview)
- [Erste Schritte](/de/start/getting-started)
