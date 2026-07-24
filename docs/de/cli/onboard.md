---
read_when:
    - Sie möchten die Inferenz einrichten und anschließend die Einrichtung mit OpenClaw abschließen
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: Einrichtung
x-i18n:
    generated_at: "2026-07-24T03:43:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec5cfc564aa14041d1aa67a978a4661e6105b7119a942940f71197c695e788b
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Geführte Einrichtung, bei der zuerst die Inferenz hergestellt wird: Sie erkennt vorhandenen KI-Zugriff,
erfordert eine erfolgreiche Live-Vervollständigung, speichert nur die funktionierende Route dauerhaft und startet dann
OpenClaw, um den Rest zu konfigurieren. `openclaw setup` öffnet diesen Ablauf auf neuen
Systemen oder sobald eine Onboarding-Option angegeben ist; konfigurierte Systeme verwenden
`openclaw setup` ohne weitere Argumente für den Chat mit dem System-Agenten. `openclaw setup --baseline`
schreibt nur die Basiskonfiguration und den Workspace.

<CardGroup cols={2}>
  <Card title="CLI-Onboarding-Zentrale" href="/de/start/wizard" icon="rocket">
    Schritt-für-Schritt-Anleitung für den interaktiven CLI-Ablauf.
  </Card>
  <Card title="Onboarding-Übersicht" href="/de/start/onboarding-overview" icon="map">
    Wie die Bestandteile des OpenClaw-Onboardings zusammenspielen.
  </Card>
  <Card title="Referenz zur CLI-Einrichtung" href="/de/start/wizard-cli-reference" icon="book">
    Ausgaben, interne Abläufe und Verhalten der einzelnen Schritte.
  </Card>
  <Card title="CLI-Automatisierung" href="/de/start/wizard-cli-automation" icon="terminal">
    Nicht interaktive Flags und skriptgesteuerte Einrichtungen.
  </Card>
  <Card title="Onboarding der macOS-App" href="/de/start/onboarding" icon="apple">
    Onboarding-Ablauf für die macOS-Menüleisten-App.
  </Card>
</CardGroup>

## Beispiele

```bash
openclaw onboard
openclaw onboard --tui
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard recommendations --json
openclaw onboard recommendations acknowledge
openclaw onboard recommendations acknowledge --retry "<failed-id>"
openclaw onboard recommendations refresh
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`openclaw onboard recommendations` liest ausstehende Treffer für App-Empfehlungen,
die während des Onboardings gespeichert wurden. Fügen Sie `--json` hinzu, um die maschinenlesbare Liste zu erhalten, die
beim Bootstrap des ersten Starts verwendet wird. Der Befehl durchsucht installierte Apps nicht erneut und ruft kein
Modell auf. Seine Ausgabe enthält ausschließlich validierte Installations-IDs, Quelle und Stufe; nicht vertrauenswürdige
Marketplace-Beschreibungen, Modellbegründungen und lokale App-Bezeichnungen werden bewusst
ausgelassen. Nachdem auf das Empfehlungsangebot reagiert wurde, gibt der Befehl
eine leere Liste zurück, und bei künftigen Onboarding-Durchläufen wird der Schritt vollständig übersprungen.
`openclaw onboard recommendations refresh` löscht das gespeicherte Angebot, sodass beim nächsten
Onboarding-Durchlauf installierte Apps erneut durchsucht und ein neues Angebot erstellt wird.

Bei neuen Workspaces wird die Auswahl der Empfehlungen auf die Bootstrap-Unterhaltung verschoben.
Nachdem diese Unterhaltung die Auswahl des Benutzers verarbeitet hat,
markiert `openclaw onboard recommendations acknowledge` das gespeicherte Angebot als beantwortet.
Die Bestätigung ist idempotent. Wenn eine ausgewählte Installation fehlschlägt, übergeben Sie jede fehlgeschlagene
undurchsichtige ID mit `--retry <id...>`; erfolgreiche und abgelehnte Treffer werden verbraucht,
während fehlgeschlagene Treffer für einen späteren Onboarding-Durchlauf ausstehend bleiben. Unbekannte IDs
führen zu einem Fehler, ohne das gespeicherte Angebot zu ändern. Nach einer unterbrochenen Installation eines ClawHub-Skills
gilt ein vorhandenes Ziel nur dann als erfolgreich, wenn
`openclaw skills verify "@owner/slug"` für dieselbe
durch den Herausgeber qualifizierte Empfehlungs-ID erfolgreich ausgeführt wird und seine JSON-Ausgabe
`openclaw.resolution.source: "installed"` meldet. Die alleinige Überprüfung der Registry ist
kein Nachweis einer lokalen Installation. Lassen Sie diese ID andernfalls mit `--retry` ausstehend und
überschreiben Sie den vorhandenen Skill nicht.

- `--classic`: öffnet den vollständigen Assistenten mit allen Einzelschritten. Die Option kann nicht mit
  `--non-interactive` kombiniert werden; lassen Sie `--classic` für eine automatisierte Einrichtung weg.
- `--flow quickstart`: öffnet den klassischen Assistenten mit minimalen Eingabeaufforderungen, verwendet
  standardmäßig Token-Authentifizierung und erzeugt ein Token, wenn keine gespeicherten oder ausdrücklich angegebenen
  Anmeldedaten zutreffen. Explizite Flags für den lokalen Gateway wie
  `--gateway-port`, `--gateway-bind`, `--gateway-auth` und `--tailscale`
  überschreiben die entsprechenden gespeicherten oder standardmäßigen Schnellstartwerte; nicht angegebene
  Optionen behalten ihre aktuellen Werte.
- `--flow manual` (Alias `advanced`): öffnet den klassischen Assistenten mit vollständigen Eingabeaufforderungen
  für Port, Bindung und Authentifizierung.
- `--flow import`: führt einen erkannten Migrations-Provider (zum Beispiel Hermes über `--import-from hermes`) für eine neue Einrichtung aus. Nach der Bestätigung stellt das Onboarding Konfiguration, Anmeldedaten, Workspace-Dateien, Speicher und Skills unter privaten temporären Zielen bereit; die importierte Inferenz muss eine Live-Vervollständigung erfolgreich durchlaufen, bevor Workspace- und Agentenstatus übernommen und die Konfiguration festgeschrieben werden. Bei einem Fehler oder Abbruch vor der Übernahme bleibt das aktive Ziel unverändert. Externe Aktivierungsschritte, die nicht rückgängig gemacht werden können, etwa die Installation des Codex-Plugins, werden anschließend ausgeführt und können über den Migrationsbericht erneut versucht werden. Setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und Workspace-Status zurück, falls bereits etwas davon vorhanden ist. Verwenden Sie [`openclaw migrate`](/de/cli/migrate) für Probelaufpläne, den Überschreibmodus, verifizierte Sicherungen, Berichte und exakte Zuordnungen.
- `--remote-url` und `--remote-token`: füllen den klassischen Schritt für einen entfernten Gateway vorab aus und überschreiben für diesen Durchlauf gespeicherte Remote-Werte. Beim Ändern der URL werden gespeicherte Anmeldedaten nur wiederverwendet, wenn Sie zusätzlich ein Token übergeben. Das Token bleibt in Eingabeaufforderungen maskiert und folgt der vorhandenen Auswahl des Assistenten zwischen Klartext- und SecretRef-Speicherung.
- `--tailscale-reset-on-exit` und `--no-tailscale-reset-on-exit`: steuern ausdrücklich, ob die Konfiguration von Tailscale Serve oder Funnel beim Beenden des Gateways zurückgesetzt wird. Werden beide weggelassen, bleibt die aktuelle Einstellung bei nicht interaktiven Wiederholungen erhalten.
- `--modern` ist ein Kompatibilitätsalias für den dialogbasierten Einrichtungsassistenten von OpenClaw.
  Er verwendet dieselbe Live-Inferenz-Prüfung wie `openclaw setup` und
  akzeptiert ausschließlich `--workspace`, `--accept-risk`,
  `--non-interactive` und `--json`. Andere Einrichtungs-Flags werden abgelehnt, statt
  stillschweigend ignoriert zu werden.

## Geführter Ablauf

`openclaw onboard` ohne weitere Argumente startet den geführten Ablauf. Nach dem Sicherheitshinweis
wird zunächst eine Frage gestellt: **Vollzugriff** (empfohlen — die Einrichtung sucht automatisch nach
KI-Apps, Schlüsseln und lokalen Laufzeitumgebungen) oder **Zuerst fragen** (die Einrichtung fragt
einmal, bevor sie die Umgebung durchsucht, oder ermöglicht eine manuelle Konfiguration). Die
Auswahl wird dauerhaft als `wizard.accessMode` gespeichert. Wenn die Erkennung erlaubt ist, erkennt das Onboarding
bereits verfügbaren KI-Zugriff über konfigurierte Modelle, Umgebungsvariablen für API-Schlüssel
und unterstützte lokale CLIs und testet anschließend den empfohlenen
Kandidaten mit einer echten Vervollständigung. Wenn ein Kandidat fehlschlägt, versucht das Onboarding unauffällig
den nächsten verwendbaren Kandidaten und fasst alles, was nicht geantwortet hat, in einer
einzigen Zeile zusammen; die funktionierende Route wird zusammen mit einer Option angekündigt, über einen einzigen Tastendruck
stattdessen alle anderen Möglichkeiten anzuzeigen.

Wenn die automatische Erkennung keine Ergebnisse mehr liefert, zeigt die Provider-Auswahl zuerst OpenAI,
Anthropic, xAI (Grok), Google und OpenRouter an. Wählen Sie **Weitere …** für alle
anderen unterstützten Provider, gruppiert nach Provider; Regionen, Tarife und Authentifizierungsmethoden
erscheinen anschließend in einem zweiten Menü. Unterstützte Browser- oder Geräteanmeldungen sowie maskierte
Methoden mit API-Schlüssel oder Token verwenden denselben Pfad zur Live-Vervollständigung. OpenClaw speichert
erst nach einem erfolgreichen Test ausschließlich die verifizierte Modellroute und die zugehörigen Anmeldedaten dauerhaft; ein
fehlgeschlagener Kandidat ersetzt weder das konfigurierte Modell noch werden die versuchten
Anmeldedaten gespeichert. Wählen Sie **Vorerst überspringen**, um den Vorgang zu beenden, ohne OpenClaw zu starten, und
führen Sie `openclaw onboard` erneut aus, wenn Sie bereit sind. Die Einrichtung von Workspace und Gateway bleibt
unverändert, bis OpenClaw gestartet wird.

Im geführten Modus stellt `--workspace <dir>` den von OpenClaw vorgeschlagenen Workspace
und den isolierten Inferenzkontext bereit. Er wird erst dauerhaft gespeichert, wenn Sie dem
Einrichtungsvorschlag von OpenClaw zustimmen. Beim klassischen und nicht interaktiven Onboarding wird der jeweilige
Workspace über den normalen Einrichtungsablauf dauerhaft gespeichert. Bei einer Wiederholung mit einer vorhandenen Agentenliste
behält das Onboarding den konfigurierten Flotten-Workspace bei: Der klassische
Assistent zeigt beide Pfade an und erfordert eine ausdrückliche Bestätigung, bevor er verschoben wird,
während die nicht interaktive Einrichtung eine Warnung ausgibt und den aktuellen Wert beibehält.

Nach erfolgreicher Inferenz sucht das Onboarding nach Speichern unterstützter lokaler KI-
Werkzeuge: automatischer Speicher von Claude Code, konsolidierte Codex-Speicher und Hermes-Speicherdateien.
Wenn welche gefunden werden, bietet eine Seite an, sie zur indizierten Wiederauffindung in den Agenten-Workspace
unter `memory/imports/` zu kopieren. Ohne
Bestätigung wird nichts importiert, bereits importierte Dateien werden übersprungen, und ein späterer Import ist jederzeit
über die [Seite zum Speicherimport](/de/web/control-ui) der Control UI möglich, die
denselben ausschließlich auf Speicher beschränkten Umfang bietet. (Ein vollständiger Durchlauf von [`openclaw migrate`](/de/cli/migrate) ist
umfangreicher: Er kann auch Konfiguration, Skills und Anmeldedaten importieren.) Der klassische
Assistent zeigt dieselbe Seite an, nachdem er den Workspace vorbereitet hat.

Nach erfolgreicher Inferenz und dem Angebot zum Speicherimport wendet das geführte Onboarding
automatisch die Standardeinrichtung an — Workspace, Gateway und Sitzungen,
denselben Plan, den der dialogbasierte `openclaw setup`-Chat bei „Ja“ anwenden würde —
und bietet anschließend Empfehlungen für Plugins und Skills auf Grundlage installierter Apps an; App-Namen
werden mithilfe Ihres konfigurierten Modells und der ClawHub-Suche abgeglichen, und der Schritt kann
mit [`wizard.appRecommendations`](/de/gateway/configuration-reference#wizard) deaktiviert werden.
In einer Desktop-Sitzung unter macOS, Linux oder Windows wird danach das authentifizierte
Dashboard der Control UI geöffnet und bis zu 60 Sekunden auf die Verbindung des Browser-Clients
gewartet. Unter Linux ohne grafische Oberfläche oder über SSH wird eine hervorgehobene, kopierbare
Dashboard-URL ausgegeben, einschließlich eines SSH-Befehls zur Portweiterleitung für einen Gateway auf der Loopback-Schnittstelle,
und bis zu fünf Minuten gewartet. Bei einer erfolgreichen Verbindung wird der Vorgang im Browser fortgesetzt;
bei einem nicht erreichbaren Gateway oder einer Zeitüberschreitung wird auf denselben Terminal-Ausweg wie
zuvor zurückgegriffen. Übergeben Sie `--tui`, um die Browser-Übergabe zu überspringen und diesen Terminal-Ausweg zu erzwingen.
Wenn die Anwendung der Einrichtung fehlschlägt, greift das Onboarding auf den dialogbasierten OpenClaw-
Chat zurück, um sie interaktiv abzuschließen. Kanäle, Agenten,
Plugins und weitere optionale Funktionen verbleiben im Zuständigkeitsbereich des OpenClaw-Chats: Führen Sie
`openclaw` aus und verwenden Sie `open channel wizard for <channel>`, um die Erfassung der
Kanalanmeldedaten an einen maskierten Terminal-Assistenten zu übergeben. Um den Modell-
Provider oder dessen Authentifizierung zu ändern, beenden Sie OpenClaw und führen Sie `openclaw onboard` aus;
OpenClaw öffnet die geführten oder klassischen Provider-Abläufe nicht.

Wenn Sie `openclaw onboard` auf einer konfigurierten Installation erneut ausführen, wird zuerst das aktuelle
Standardmodell überprüft, sodass derselbe Ablauf als Überprüfungs- und Reparaturdurchlauf dient —
die Einrichtung wird weder erneut angewendet noch wird der Gateway-Dienst neu installiert oder neu gestartet.
Wenn diese Prüfung fehlschlägt, wird das konfigurierte Modell niemals automatisch ersetzt —
das Onboarding hält an und fragt, wie fortgefahren werden soll. Die Prüfung wird außerhalb Ihres
Workspace ausgeführt. Daher kann ein von einem Workspace-Plugin bereitgestelltes Modell hier fehlschlagen, obwohl es im
Agenten weiterhin funktioniert.
Verwenden Sie `openclaw onboard --classic` für providerspezifische Authentifizierung, Kanäle, Skills,
die Einrichtung eines entfernten Gateways, Importe oder die vollständige Gateway-Steuerung. Führen Sie für die dialogbasierte
Einrichtung und Reparatur ohne Inferenz `openclaw setup` aus; `openclaw onboard
--modern` ist ein Kompatibilitätsalias, der dieselbe Inferenzprüfung durchläuft. Der klassische
Assistent kann das Standardmodell optional mit einer Live-Vervollständigung überprüfen, doch
OpenClaw wird erst gestartet, wenn seine eigene Live-Inferenz-Prüfung erfolgreich ist.

In einem interaktiven Terminal richtet sich `openclaw` ohne Unterbefehl nach dem
Konfigurationsstatus:

- Wenn die aktive Konfigurationsdatei fehlt oder keine benutzerdefinierten Einstellungen enthält (leer oder
  ausschließlich Metadaten), wird das geführte Onboarding gestartet.
- Wenn die Konfigurationsdatei vorhanden ist, aber die Validierung fehlschlägt, wird der klassische
  Onboarding-Pfad mit Hinweisen von `openclaw doctor` gestartet. OpenClaw benötigt eine funktionierende
  Inferenz und wird nicht zur Reparatur dieses Zustands vor der Inferenz verwendet.
- Wenn die Konfigurationsdatei gültig ist, wird die normale Agenten-TUI geöffnet. Ein erreichbarer,
  konfigurierter Gateway mit einem Agenten und Modell führt direkt zu dieser Oberfläche, ohne
  Onboarding oder OpenClaw. Auf einer konfigurierten Installation erreichen Sie OpenClaw über
  `/openclaw` innerhalb der TUI oder über `openclaw setup`.

Unverschlüsseltes `ws://` wird für Loopback, private IP-Literale, `.local` und Tailnet-`*.ts.net`-Gateway-URLs akzeptiert. Legen Sie für andere vertrauenswürdige private DNS-Namen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboardings fest.

## Zurücksetzen

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` löscht den Zustand vor der Ausführung der Einrichtung. `--reset-scope` steuert den Umfang: `config` (nur Konfiguration), `config+creds+sessions` (Standard, wenn `--reset` ohne Bereich übergeben wird) oder `full` (setzt auch den Arbeitsbereich zurück). Der Arbeitsbereich wird nur mit `--reset-scope full` zurückgesetzt.

## Gebietsschema

Das interaktive Onboarding verwendet das Gebietsschema des CLI-Assistenten für fest vorgegebene Einrichtungstexte. Verwendet wird der erste nicht leere Wert in dieser Reihenfolge:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Englisch als Ausweichoption

Unterstützte Gebietsschemas für den Assistenten sind `en`, `zh-CN` und `zh-TW`. Gebietsschemawerte können Unterstriche oder POSIX-Suffixformen wie `zh_CN.UTF-8` verwenden. Produktnamen, Befehlsnamen, Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs und Plugin-/Kanalbezeichnungen bleiben unverändert.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Explizite Überschreibung mit Englisch
```

## Nicht interaktive Einrichtung

`--non-interactive` erfordert `--accept-risk` (bestätigt, dass Agenten leistungsfähig sind und vollständiger Systemzugriff riskant ist). `--mode` verwendet standardmäßig `local`.

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` ist optional; wenn es weggelassen wird, prüft das Onboarding `CUSTOM_API_KEY` in der Umgebung. OpenClaw kennzeichnet gängige Vision-Modell-IDs (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral und ähnliche) automatisch als bildfähig. Übergeben Sie `--custom-image-input` für unbekannte benutzerdefinierte Vision-IDs oder `--custom-text-input`, um reine Textmetadaten zu erzwingen. Verwenden Sie `--custom-compatibility openai-responses` für OpenAI-kompatible Endpunkte, die `/v1/responses`, aber nicht `/v1/chat/completions` unterstützen; gültige Werte sind `openai` (Standard), `openai-responses`, `anthropic`.

LM Studio verfügt außerdem über ein Provider-spezifisches Schlüssel-Flag:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Nicht interaktives Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` verwendet standardmäßig `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es weggelassen wird, verwendet das Onboarding die von Ollama empfohlenen Standardwerte. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Speichern Sie Provider-Schlüssel als Referenzen statt als Klartext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding umgebungsbasierte Referenzen statt Schlüsselwerte im Klartext: Für Provider mit Authentifizierungsprofil wird `keyRef: { source: "env", provider: "default", id: <envVar> }` geschrieben; für benutzerdefinierte Provider wird `models.providers.<id>.apiKey` auf dieselbe Weise geschrieben (zum Beispiel `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Vertrag: Legen Sie die Umgebungsvariable des Providers in der Prozessumgebung des Onboardings fest (zum Beispiel `OPENAI_API_KEY`) und übergeben Sie nicht zusätzlich ein Inline-Schlüssel-Flag, außer diese Umgebungsvariable ist gesetzt – ein Flag-Wert ohne die passende Umgebungsvariable führt zu einem sofortigen Abbruch mit Hinweisen zur Behebung.

### Gateway-Authentifizierung (nicht interaktiv)

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token. `token` ist der standardmäßige Authentifizierungsmodus.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als umgebungsbasierte SecretRef. Erfordert in der Prozessumgebung des Onboardings eine nicht leere Umgebungsvariable dieses Namens.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- Mit `--install-daemon`: Ein von SecretRef verwaltetes `gateway.auth.token` wird validiert, aber nicht als aufgelöster Klartext in den Umgebungsmetadaten des Supervisor-Dienstes gespeichert; wenn die Referenz nicht aufgelöst werden kann, schlägt die Installation sicher geschlossen mit Hinweisen zur Behebung fehl. Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus ausdrücklich festgelegt wurde.
- Das lokale Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn `gateway.mode` später in einer Konfigurationsdatei fehlt, weist dies auf eine beschädigte Konfiguration oder eine unvollständige manuelle Bearbeitung hin und ist keine gültige Abkürzung für den lokalen Modus.
- Das lokale Onboarding installiert herunterladbare Plugins, die der gewählte Einrichtungspfad erfordert (zum Beispiel ein Codex- oder Copilot-Laufzeit-Plugin für diese Authentifizierungsoptionen). Das Remote-Onboarding schreibt nur Verbindungsinformationen für das Remote-Gateway – es installiert niemals lokale Plugin-Pakete.
- `--allow-unconfigured` ist ein separater `openclaw gateway run`-Notausstieg; damit kann das Onboarding `gateway.mode` nicht überspringen.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Zustand des lokalen Gateways

- Sofern Sie nicht `--skip-health` übergeben, wartet das Onboarding auf ein erreichbares lokales Gateway, bevor es erfolgreich beendet wird.
- `--install-daemon` startet zuerst den verwalteten Installationspfad für das Gateway. Ohne diese Option muss bereits ein lokales Gateway ausgeführt werden (zum Beispiel `openclaw gateway run`).
- `--skip-health` überspringt das Warten, wenn Sie in der Automatisierung nur Konfigurations-/Arbeitsbereichs-/Bootstrap-Schreibvorgänge wünschen.
- `--skip-bootstrap` setzt `agents.defaults.skipBootstrap: true` und überspringt die Erstellung von `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md`.
- Unter nativem Windows versucht `--install-daemon` zuerst, geplante Aufgaben zu verwenden, und greift auf ein benutzerspezifisches Anmeldeelement im Autostartordner zurück, wenn die Aufgabenerstellung verweigert wird.

### Interaktiver Referenzmodus

- Wählen Sie bei der Aufforderung **Geheimnisreferenz verwenden** und anschließend entweder **Umgebungsvariable** oder einen konfigurierten Geheimnis-Provider (`file` oder `exec`).
- Das Onboarding führt vor dem Speichern der Referenz eine schnelle Vorabvalidierung durch und ermöglicht Ihnen bei einem Fehler einen erneuten Versuch.

### Auswahlmöglichkeiten für Z.AI-Endpunkte

<Note>
`--auth-choice zai-api-key` erkennt automatisch den besten Z.AI-Endpunkt und das beste Modell für Ihren Schlüssel: Coding-Plan-Endpunkte bevorzugen `zai/glm-5.2` (mit Rückgriff auf `glm-5.1`, falls nicht verfügbar); allgemeine API-Endpunkte verwenden standardmäßig `zai/glm-5.1`. Um einen Coding-Plan-Endpunkt zu erzwingen, wählen Sie direkt `zai-coding-global` oder `zai-coding-cn`.
</Note>

```bash
# Endpunktauswahl ohne Eingabeaufforderung
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Weitere Z.AI-Endpunktauswahlen: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Zusätzliche nicht interaktive Flags

Tokenbasierte Modellauthentifizierung (verwendet mit `--auth-choice token`):

| Flag                            | Beschreibung                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | ID des Token-Providers, der das Token ausstellt                                                                                         |
| `--token <token>`               | Tokenwert für die Modellauthentifizierung                                                                                        |
| `--token-profile-id <id>`       | ID des Authentifizierungsprofils (Standard `<provider>:manual`; einige Provider-eigene Abläufe verwenden einen eigenen Standard, etwa `anthropic:default`) |
| `--token-expires-in <duration>` | Optionale Gültigkeitsdauer des Tokens (z. B. `365d`, `12h`)                                                                         |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Steuerung der Daemon-Installation: `--no-install-daemon` / `--skip-daemon` (Aliasse; überspringen die Installation des Gateway-Dienstes), `--daemon-runtime <node>`.

Skills: `--node-manager <npm|pnpm|bun>` (Standard `npm`), `--skip-skills`.

Einrichtung von Benutzeroberfläche und Hooks: `--skip-ui` (Eingabeaufforderungen für Control UI/TUI überspringen), `--skip-hooks` (Webhook-/Hook-Einrichtung überspringen), `--skip-channels`, `--skip-search`.

Ausgabe: `--suppress-gateway-token-output` unterdrückt tokenhaltige Gateway-/UI-Ausgaben (Tokenhinweise, URL für die automatische Anmeldung mit eingebettetem Token und automatischer Start der Control UI) – nützlich in gemeinsam genutzten Terminals und in CI.

<Note>
`--json` impliziert beim geführten oder klassischen Onboarding keinen nicht interaktiven Modus.
Mit `--modern` ist JSON eine einmalige OpenClaw-Übersicht und wird nach diesem
einzelnen Ergebnis beendet. Verwenden Sie `--non-interactive` für andere Skripte.
</Note>

## Provider-Vorfilterung

Wenn eine Authentifizierungsoption einen bevorzugten Provider impliziert, filtert das Onboarding die Auswahlfelder für das Standardmodell und die Zulassungsliste nach den Modellen dieses Providers vor. Der Filter berücksichtigt auch andere Provider desselben Plugins und deckt damit Coding-Plan-Varianten wie `volcengine`/`volcengine-plan` und `byteplus`/`byteplus-plan` ab. Wenn der Filter für den bevorzugten Provider keine geladenen Modelle ergibt, greift das Onboarding auf den ungefilterten Katalog zurück, statt das Auswahlfeld leer zu lassen.

## Folgefragen zur Websuche

Einige Provider für die Websuche lösen während des Onboardings Provider-spezifische Folgefragen aus:

- **Grok** kann optional die Einrichtung von `x_search` mit derselben xAI-Authentifizierung und der Auswahl eines `x_search`-Modells anbieten.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` oder `api.moonshot.cn`) und dem standardmäßigen Kimi-Websuchmodell fragen.

## Weitere Verhaltensweisen

- Verhalten des DM-Bereichs beim lokalen Onboarding: [Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference#outputs-and-internals).
- Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Kanaleinrichtung).
- Benutzerdefinierter Provider: Verbinden Sie einen beliebigen OpenAI- oder Anthropic-kompatiblen Endpunkt, einschließlich nicht aufgeführter gehosteter Provider. Verwenden Sie die Kompatibilität **Unbekannt**, um sie über eine Live-Prüfung automatisch zu erkennen.
- Wenn ein Hermes-Zustand erkannt wird, bietet das Onboarding einen Migrationsablauf an (siehe `--flow import` oben).

## Häufige Folgebefehle

Verwenden Sie `openclaw configure` später für gezielte Änderungen ohne Inferenz und `openclaw
channels add` für eine reine Kanaleinrichtung. Führen Sie bei Änderungen am Modell-Provider oder am Authentifizierungsweg
stattdessen `openclaw onboard` aus.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
