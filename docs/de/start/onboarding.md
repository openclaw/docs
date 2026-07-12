---
read_when:
    - Entwicklung des macOS-Einrichtungsassistenten
    - Authentifizierungs- oder Identitätseinrichtung implementieren
sidebarTitle: 'Onboarding: macOS App'
summary: Ablauf der Ersteinrichtung für OpenClaw (macOS-App)
title: Einrichtung (macOS-App)
x-i18n:
    generated_at: "2026-07-12T02:11:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

Der Ablauf beim ersten Start der macOS-App: Wählen Sie aus, wo der Gateway ausgeführt wird, verbinden Sie ein
verifiziertes KI-Backend, erteilen Sie Berechtigungen und übergeben Sie an das
Bootstrap-Ritual des Agenten.
Informationen zum CLI-Onboarding und einen Vergleich beider Wege finden Sie in der [Onboarding-Übersicht](/de/start/onboarding-overview).

<Steps>
<Step title="macOS-Warnung bestätigen">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Suche nach lokalen Netzwerken erlauben">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Willkommen und Sicherheitshinweis">
<Frame caption="Lesen Sie den angezeigten Sicherheitshinweis und entscheiden Sie entsprechend">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Vertrauensmodell für die Sicherheit:

- Standardmäßig ist OpenClaw ein persönlicher Agent mit einer Vertrauensgrenze für einen vertrauenswürdigen Betreiber.
- Gemeinsam genutzte Konfigurationen und Mehrbenutzerkonfigurationen müssen abgesichert werden: Trennen Sie Vertrauensgrenzen, beschränken Sie den Werkzeugzugriff auf das Nötigste und befolgen Sie die Hinweise unter [Sicherheit](/de/gateway/security).
- Beim lokalen Onboarding wird für neue Konfigurationen standardmäßig `tools.profile: "coding"` verwendet, damit neue Einrichtungen weiterhin über Dateisystem- und Laufzeitwerkzeuge verfügen, jedoch ohne das uneingeschränkte Profil `full`.
- Wenn Hooks, Webhooks oder andere Quellen für nicht vertrauenswürdige Inhalte aktiviert sind, verwenden Sie eine leistungsfähige moderne Modellklasse und behalten Sie strenge Werkzeugrichtlinien sowie Sandboxing bei.

</Step>
<Step title="Lokal oder remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Wo wird der **Gateway** ausgeführt?

- **Dieser Mac (nur lokal):** Das Onboarding konfiguriert die Authentifizierung und speichert die Anmeldedaten lokal.
- **Remote (über SSH/Tailnet):** Das Onboarding konfiguriert **keine** lokale Authentifizierung;
  die Anmeldedaten müssen bereits auf dem Gateway-Host vorhanden sein. Im Feld für das Remote-Gateway-Token
  wird das Token gespeichert, mit dem die macOS-App eine Verbindung zu diesem Gateway herstellt;
  vorhandene SecretRef-Werte für `gateway.remote.token` bleiben erhalten, bis Sie
  sie ersetzen.
- **Später konfigurieren:** Überspringen Sie die Einrichtung und lassen Sie die App unkonfiguriert.

<Tip>
**Tipp zur Gateway-Authentifizierung:**

- Der Gateway-Authentifizierungsmodus ist selbst bei local loopback-Bindungen standardmäßig `token`, sodass sich lokale WS-Clients authentifizieren müssen.
- Mit `gateway.auth.mode: "none"` kann jeder lokale Prozess eine Verbindung herstellen; verwenden Sie dies nur auf vollständig vertrauenswürdigen Computern.
- Verwenden Sie für den Zugriff von mehreren Computern oder für Bindungen außerhalb von local loopback ein Token.

</Tip>
</Step>
<Step title="CLI">
  Bei der lokalen Einrichtung wird die globale `openclaw`-CLI über npm, pnpm oder bun installiert,
  wobei npm zuerst bevorzugt wird. Node bleibt die empfohlene Laufzeit für den Gateway
  selbst. Vorhandene kompatible Installationen werden wiederverwendet.
</Step>
<Step title="KI verbinden">
  Bei einem verbundenen Gateway, für den bereits ein Agentenmodell konfiguriert ist, wird diese
  Seite vollständig übersprungen und die normale Agentenoberfläche geöffnet. Crestodian und die Provider-Einrichtung
  werden nur für einen neuen oder unvollständig konfigurierten Gateway ausgeführt.

Sobald der Gateway bereit ist, sucht das Onboarding nach bereits vorhandenem KI-Zugriff:
einer Anmeldung bei Claude Code oder Codex oder nach `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. Die beste Option wird mit einer echten Vervollständigung getestet und
erst gespeichert, nachdem sie eine Antwort geliefert hat. Wenn ein Test fehlschlägt, versucht die App automatisch
die nächste Option und zeigt an, warum die vorherige fehlgeschlagen ist. Wenn mehrere Optionen
gefunden werden, können Sie vor dem Fortfahren zwischen ihnen wechseln.

Gemini CLI bleibt nach der Einrichtung für normale Agenten verfügbar, wird hier jedoch nicht
angeboten, da es die Inferenzprüfung ohne Werkzeuge nicht erzwingen kann.

Sie können sich auch über den OAuth- oder Gerätekopplungsablauf des Providers anmelden.
Zu den integrierten Optionen gehören OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global und CN sowie Chutes. Die Liste stammt aus den
aktiven Textinferenz-Provider-Plugins des Gateways und nicht aus einer fest vorgegebenen App-Liste,
sodass sich ein weiterer Provider ohne zusätzlichen Provider-spezifischen macOS-Code einbinden kann.

Die manuelle Auswahl für Schlüssel oder Token verwendet dieselbe Provider-Registry. Bei jedem Weg
stellt der Provider sein Startmodell und seine Konfiguration bereit; OpenClaw überprüft
die Anmeldedaten mit demselben Live-Test, bevor das Authentifizierungsprofil gespeichert wird. „Weiter“
bleibt gesperrt, bis ein Backend den Test bestanden hat, sodass der erste Agentenchat nicht
ohne funktionierende Inferenz gestartet werden kann. Nachdem diese Live-Prüfung bestanden wurde, steht Crestodian
zur Verfügung, um Sie bei der Konfiguration des verbleibenden Arbeitsbereichs, des Gateways, der Kanäle und
weiterer optionaler Funktionen zu unterstützen. Crestodian ist auch später unter Settings → Crestodian verfügbar.
</Step>
<Step title="Berechtigungen">

<Frame caption="Wählen Sie aus, welche Berechtigungen Sie OpenClaw erteilen möchten">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Das Onboarding fordert TCC-Berechtigungen für Folgendes an: Automation (AppleScript), Notifications, Accessibility, Screen Recording, Microphone, Speech Recognition, Camera und Location.

</Step>
<Step title="Abschließen">
  Nachdem die Inferenzprüfung bestanden wurde, übernimmt Crestodian die verbleibende optionale Einrichtung und kann
  Sie an den normalen Agentenchat übergeben. Nach Abschluss der Berechtigungsführung
  wird derselbe Chat geöffnet. Die App erstellt keinen Arbeitsbereich und startet vor Crestodian
  keine separate Unterhaltung zur Agenteneinrichtung. Unter
  [Bootstrapping](/de/start/bootstrapping) erfahren Sie, was während der ersten echten Interaktion des Agenten
  auf dem Gateway-Host geschieht.
</Step>
</Steps>

## Verwandte Themen

- [Onboarding-Übersicht](/de/start/onboarding-overview)
- [Erste Schritte](/de/start/getting-started)
