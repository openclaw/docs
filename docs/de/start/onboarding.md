---
read_when:
    - Entwicklung des macOS-Einrichtungsassistenten
    - Implementierung der Authentifizierungs- oder Identitätseinrichtung
sidebarTitle: 'Onboarding: macOS App'
summary: Ablauf der Ersteinrichtung für OpenClaw (macOS-App)
title: Onboarding (macOS-App)
x-i18n:
    generated_at: "2026-07-24T05:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55154774886c530de92b2110d367af24e2142fac48b901f288582d8552a6ca10
    source_path: start/onboarding.md
    workflow: 16
---

Der Ersteinrichtungsablauf der macOS-App: Wählen Sie aus, wo der Gateway ausgeführt wird, verbinden Sie ein
verifiziertes KI-Backend, erteilen Sie Berechtigungen und übergeben Sie an das eigene
Bootstrap-Ritual des Agenten.
Informationen zum CLI-Onboarding und einen Vergleich beider Wege finden Sie unter [Onboarding-Übersicht](/de/start/onboarding-overview).

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

Sicherheits- und Vertrauensmodell:

- Standardmäßig ist OpenClaw ein persönlicher Agent: eine Vertrauensgrenze mit einem vertrauenswürdigen Betreiber.
- Gemeinsam genutzte Konfigurationen und Mehrbenutzerkonfigurationen müssen abgesichert werden: Trennen Sie Vertrauensgrenzen, beschränken Sie den Werkzeugzugriff auf ein Minimum und befolgen Sie die Hinweise unter [Sicherheit](/de/gateway/security).
- Beim lokalen Onboarding verwenden neue Konfigurationen standardmäßig `tools.profile: "coding"`, sodass neue Einrichtungen Dateisystem- und Laufzeitwerkzeuge behalten, ohne das uneingeschränkte Profil `full` zu verwenden.
- Wenn Hooks/Webhooks oder andere Quellen nicht vertrauenswürdiger Inhalte aktiviert sind, verwenden Sie eine leistungsfähige moderne Modellklasse und behalten Sie strenge Werkzeugrichtlinien sowie Sandboxing bei.

</Step>
<Step title="Lokal oder remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Wo wird der **Gateway** ausgeführt?

- **Dieser Mac (nur lokal):** Das Onboarding konfiguriert die Authentifizierung und speichert die Anmeldedaten lokal.
- **Remote (über SSH/Tailnet):** Das Onboarding konfiguriert **keine** lokale Authentifizierung;
  die Anmeldedaten müssen bereits auf dem Gateway-Host vorhanden sein. Im Feld für das Remote-Gateway-Token
  wird das Token gespeichert, das die macOS-App für die Verbindung mit diesem Gateway verwendet;
  vorhandene `gateway.remote.token`-SecretRef-Werte bleiben erhalten, bis Sie sie
  ersetzen.
- **Später konfigurieren:** Überspringen Sie die Einrichtung und lassen Sie die App unkonfiguriert.

<Tip>
**Tipp zur Gateway-Authentifizierung:**

- Der Gateway-Authentifizierungsmodus verwendet selbst bei Loopback-Bindungen standardmäßig `token`, daher müssen sich lokale WS-Clients authentifizieren.
- Mit der Einstellung `gateway.auth.mode: "none"` kann jeder lokale Prozess eine Verbindung herstellen; verwenden Sie dies nur auf vollständig vertrauenswürdigen Rechnern.
- Verwenden Sie für den Zugriff von mehreren Rechnern oder für Nicht-Loopback-Bindungen ein Token.

</Tip>
</Step>
<Step title="CLI">
  Bei der lokalen Einrichtung wird die globale CLI `openclaw` über npm, pnpm oder bun installiert,
  wobei npm bevorzugt wird. Node bleibt die empfohlene Laufzeit für den Gateway
  selbst. Vorhandene kompatible Installationen werden wiederverwendet.
</Step>
<Step title="Ihre KI verbinden">
  Bei einem verbundenen Gateway, für den bereits ein Agentenmodell konfiguriert ist, wird diese
  Seite vollständig übersprungen und die normale Agenten-Benutzeroberfläche geöffnet. Die Einrichtung von OpenClaw und des Providers
  wird nur bei einem neuen oder unvollständig konfigurierten Gateway ausgeführt.

Sobald der Gateway bereit ist, sucht das Onboarding nach bereits vorhandenem KI-Zugriff:
einer Claude-Code- oder Codex-Anmeldung, `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` oder einem
werkzeugfähigen Modell mit einem gemessenen effektiven Kontext von mindestens 16K, das bereits
auf einem erreichbaren Ollama- oder LM-Studio-Server installiert ist. Die Erkennung wird auf dem
Gateway-Host ausgeführt, auch wenn die macOS-App eine Verbindung mit einem Linux-Gateway herstellt. Die beste
Option wird mit einer echten Vervollständigung getestet und erst gespeichert,
nachdem sie geantwortet hat. Schlägt ein Test fehl, probiert die App automatisch die nächste Option aus
und zeigt an, warum die vorherige fehlgeschlagen ist. Wenn mehrere Optionen gefunden werden, können Sie
vor dem Fortfahren zwischen ihnen wechseln. Die automatische lokale Erkennung ruft niemals
ein Modell ab und lädt keines herunter.

Um ein Claude-Abonnement zu verwenden, wenn auf dem Gateway-Host keine Claude-CLI-Anmeldung vorhanden ist, führen Sie
`claude setup-token` auf einem beliebigen Rechner mit installiertem Claude Code aus und fügen Sie anschließend das
ausgegebene Token als **Anthropic setup-token** unter **Connect with an API key or
token** ein.

Installierte CLIs für Gemini CLI, Antigravity, Pi und OpenCode werden zur Information angezeigt,
wenn sie nicht als wiederverwendbare Inferenzroute für die geführte Einrichtung ausgewählt werden können.
Gemini und Antigravity können die werkzeugfreie Inferenzprüfung nicht erzwingen. Pi und
OpenCode sind vollständige Agenten-Harnesses und keine Inferenzrouten für die Einrichtung; ihre
Sitzungsintegrationen erfordern eine separate Laufzeit- und Plugin-Einrichtung.

Sie können sich auch über den eigenen OAuth- oder Gerätekopplungsablauf des Providers anmelden.
Zu den integrierten Optionen gehören OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global und CN sowie Chutes. Die Liste stammt aus den
aktiven Textinferenz-Provider-Plugins des Gateways und nicht aus einer festen App-Liste,
sodass sich ein anderer Provider ohne zusätzlichen providerspezifischen macOS-Code beteiligen kann.

Die manuelle Schlüssel-/Token-Auswahl verwendet dieselbe Provider-Registrierung. Bei jedem Weg
stellt der Provider sein Ausgangsmodell und seine Konfiguration bereit; OpenClaw überprüft
die Anmeldedaten mit demselben Live-Test, bevor das Authentifizierungsprofil gespeichert wird. Weiter
bleibt gesperrt, bis ein Backend den Test bestanden hat, sodass der erste Agenten-Chat
nicht ohne funktionierende Inferenz gestartet werden kann. Nachdem diese Live-Prüfung bestanden wurde, ist OpenClaw
verfügbar, um die Konfiguration des übrigen Arbeitsbereichs, des Gateways, der Kanäle und
anderer optionaler Funktionen zu unterstützen. Wenn OpenClaw eine kurze Auswahlliste anbietet, zeigt die App
native Optionskarten an; durch die Auswahl einer Option wird diese übermittelt, und **Skip for
now** lässt die Auswahl stets optional. OpenClaw ist später auch unter
Settings → OpenClaw verfügbar.
</Step>
<Step title="Erinnerungen importieren (wird bei Erkennung angezeigt)">
Bei einem lokalen Gateway sucht das Onboarding auf dem Mac nach Erinnerungen von unterstützten KI-
Werkzeugen: dem automatischen Speicher von Claude Code, konsolidierten Codex-Erinnerungen und Hermes-Speicherdateien.
Wenn welche gefunden werden, führt diese Seite jede Quelle mit der Anzahl ihrer Erinnerungen auf
und ermöglicht den Import der ausgewählten Quellen in den Agenten-Arbeitsbereich unter
`memory/imports/` für den indizierten Abruf. Bereits importierte Dateien werden übersprungen, und
die Seite wird nie angezeigt, wenn nichts importiert werden kann. Das Überspringen ist unbedenklich; die
Seite für den Speicherimport im Dashboard bietet denselben Import später mit Kontrolle
auf Dateiebene an.
</Step>
<Step title="Berechtigungen">

<Frame caption="Wählen Sie aus, welche Berechtigungen Sie OpenClaw erteilen möchten">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Das Onboarding fordert TCC-Berechtigungen für Folgendes an: Automatisierung (AppleScript), Mitteilungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Spracherkennung, Kamera und Standort.

</Step>
<Step title="Abschluss">
  Nachdem die Inferenzprüfung bestanden wurde, übernimmt OpenClaw die verbleibende optionale Einrichtung und kann
  Sie an den normalen Agenten-Chat übergeben. Nach Abschluss der Berechtigungsführung
  wird derselbe Chat geöffnet; die App erstellt vor OpenClaw weder einen Arbeitsbereich noch startet sie eine separate
  Unterhaltung zur Agenteneinrichtung. Unter
  [Bootstrapping](/de/start/bootstrapping) erfahren Sie, was auf dem Gateway-Host
  während der ersten echten Interaktion des Agenten geschieht.
</Step>
</Steps>

## Verwandte Themen

- [Onboarding-Übersicht](/de/start/onboarding-overview)
- [Erste Schritte](/de/start/getting-started)
