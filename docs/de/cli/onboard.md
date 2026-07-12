---
read_when:
    - Sie möchten die Inferenz einrichten und anschließend die Einrichtung mit Crestodian abschließen.
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: Einrichtung
x-i18n:
    generated_at: "2026-07-12T15:13:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Geführte Einrichtung, bei der die Inferenz zuerst hergestellt wird: Sie erkennt vorhandenen KI-Zugriff,
erfordert eine erfolgreiche Live-Vervollständigung, speichert nur die funktionierende Route und startet
anschließend Crestodian, um den Rest zu konfigurieren. `openclaw setup` ist derselbe Einstiegspunkt;
`openclaw setup --baseline` schreibt nur die Basiskonfiguration und den Workspace.

<CardGroup cols={2}>
  <Card title="CLI-Onboarding-Zentrale" href="/de/start/wizard" icon="rocket">
    Anleitung für den interaktiven CLI-Ablauf.
  </Card>
  <Card title="Onboarding-Übersicht" href="/de/start/onboarding-overview" icon="map">
    Wie die Bestandteile des OpenClaw-Onboardings zusammenspielen.
  </Card>
  <Card title="CLI-Einrichtungsreferenz" href="/de/start/wizard-cli-reference" icon="book">
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
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: Öffnet den vollständigen Schritt-für-Schritt-Assistenten. Es kann nicht mit
  `--non-interactive` kombiniert werden; lassen Sie `--classic` für eine automatisierte Einrichtung weg.
- `--flow quickstart`: Öffnet den klassischen Assistenten mit minimalen Eingabeaufforderungen und
  generiert automatisch ein Gateway-Token.
- `--flow manual` (Alias `advanced`): Öffnet den klassischen Assistenten mit vollständigen Eingabeaufforderungen
  für Port, Bindung und Authentifizierung.
- `--flow import`: Führt einen erkannten Migrations-Provider aus (beispielsweise Hermes über `--import-from hermes`), zeigt eine Vorschau des Plans und wendet ihn nach Bestätigung an. Der Import wird nur bei einer neuen OpenClaw-Einrichtung ausgeführt – setzen Sie zunächst Konfiguration, Anmeldedaten, Sitzungen und Workspace-Status zurück, falls bereits etwas davon vorhanden ist. Verwenden Sie [`openclaw migrate`](/de/cli/migrate) für Probelaufpläne, den Überschreibmodus, Berichte und genaue Zuordnungen.
- `--modern` ist ein Kompatibilitätsalias für den dialogbasierten Crestodian-Einrichtungsassistenten.
  Er verwendet dieselbe Live-Inferenz-Prüfung wie `openclaw crestodian` und
  akzeptiert nur `--workspace`, `--accept-risk`,
  `--non-interactive` und `--json`. Andere Einrichtungs-Flags werden abgelehnt, statt
  stillschweigend ignoriert zu werden.

## Geführter Ablauf

Einfaches `openclaw onboard` startet den geführten Ablauf. Er zeigt den Sicherheitshinweis an,
erkennt bereits verfügbaren KI-Zugriff über konfigurierte Modelle, API-Schlüssel-
Umgebungsvariablen und unterstützte lokale CLIs und testet anschließend den empfohlenen
Kandidaten mit einer echten Vervollständigung. Wenn dieser Kandidat fehlschlägt, zeigt das Onboarding
den Grund an und probiert automatisch den nächsten verwendbaren Kandidaten aus.

Wenn die automatische Erkennung ausgeschöpft ist, wählen Sie einen anderen erkannten Kandidaten aus oder geben Sie
in einer maskierten Eingabeaufforderung einen Provider-API-Schlüssel ein. Ein manuell eingegebener Schlüssel wird über denselben
Live-Vervollständigungspfad getestet. Das geführte Onboarding
bietet weder Crestodian noch einen Abbruch ohne KI an, bevor ein Kandidat die Prüfung bestanden hat. OpenClaw
speichert erst nach erfolgreichem Test ausschließlich die verifizierte Modellroute und die zugehörigen Anmeldedaten;
ein fehlgeschlagener Kandidat ersetzt weder das konfigurierte Modell noch speichert er die
versuchten Anmeldedaten. Die Einrichtung von Workspace und Gateway bleibt unverändert, bis
Crestodian startet.

Im geführten Modus stellt `--workspace <dir>` den vorgeschlagenen Workspace von Crestodian
und den isolierten Inferenzkontext bereit. Er wird erst gespeichert, wenn Sie den
Einrichtungsvorschlag von Crestodian genehmigen. Das klassische und das nicht interaktive Onboarding speichern ihren
Workspace über ihren regulären Einrichtungsablauf.

Nach erfolgreicher Inferenz startet das geführte Onboarding Crestodian sofort mit
dem verifizierten Modell. Crestodian kann anschließend den Workspace, das Gateway,
Kanäle, Agenten, Plugins und weitere optionale Funktionen konfigurieren. Verwenden Sie
innerhalb von Crestodian `open channel wizard for <channel>`, um die Erfassung der Kanal-Anmeldedaten an einen
maskierten Terminal-Assistenten zu übergeben. Um den Modell-Provider oder dessen Authentifizierung zu ändern,
beenden Sie Crestodian und führen Sie `openclaw onboard` aus; Crestodian öffnet weder die geführten
noch die klassischen Provider-Abläufe.

Wenn Sie `openclaw onboard` in einer konfigurierten Installation erneut ausführen, wird zuerst das aktuelle
Standardmodell verifiziert, sodass derselbe Ablauf als Verifizierungs- und Reparaturdurchlauf dient.
Wenn diese Prüfung fehlschlägt, wird das konfigurierte Modell niemals automatisch ersetzt –
das Onboarding hält an und fragt, wie fortgefahren werden soll. Die Prüfung wird außerhalb Ihres
Workspace ausgeführt, sodass ein von einem Workspace-Plugin bereitgestelltes Modell hier fehlschlagen kann, obwohl es
im Agenten weiterhin funktioniert.
Verwenden Sie `openclaw onboard --classic` für providerspezifische Authentifizierung, Kanäle, Skills,
die Einrichtung eines entfernten Gateway, Importe oder vollständige Gateway-Steuerungsmöglichkeiten. Für die dialogbasierte
Einrichtung und Reparatur ohne Inferenz führen Sie `openclaw crestodian` aus; `openclaw onboard
--modern` ist ein Kompatibilitätsalias, der dieselbe Inferenzprüfung durchläuft. Der klassische
Assistent kann das Standardmodell optional mit einer Live-Vervollständigung verifizieren,
Crestodian startet jedoch erst, wenn seine eigene Live-Inferenzprüfung erfolgreich ist.

In einem interaktiven Terminal leitet ein einfaches `openclaw` (ohne Unterbefehl) abhängig vom
Konfigurationsstatus weiter:

- Wenn die aktive Konfigurationsdatei fehlt oder keine vom Benutzer vorgenommenen Einstellungen enthält (leer oder
  nur Metadaten), startet das geführte Onboarding.
- Wenn die Konfigurationsdatei vorhanden ist, aber die Validierung fehlschlägt, startet der klassische
  Onboarding-Pfad mit Hinweisen zu `openclaw doctor`. Crestodian benötigt eine funktionierende
  Inferenz und wird nicht zur Reparatur dieses Zustands vor der Inferenz verwendet.
- Wenn die Konfigurationsdatei gültig ist, wird die normale Agenten-TUI geöffnet. Ein erreichbares,
  konfiguriertes Gateway mit einem Agenten und Modell führt direkt zu dieser Benutzeroberfläche, ohne
  Onboarding oder Crestodian. In einer konfigurierten Installation erreichen Sie Crestodian mit
  `/crestodian` innerhalb der TUI oder mit `openclaw crestodian`.

Unverschlüsseltes `ws://` wird für Loopback, private IP-Literale, `.local` und Tailnet-`*.ts.net`-Gateway-URLs akzeptiert. Legen Sie für andere vertrauenswürdige private DNS-Namen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboardings fest.

## Zurücksetzen

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` löscht den Status vor der Einrichtung. `--reset-scope` steuert den Umfang: `config` (nur Konfiguration), `config+creds+sessions` (Standard, wenn `--reset` ohne Umfang übergeben wird) oder `full` (setzt auch den Workspace zurück). Der Workspace wird nur mit `--reset-scope full` zurückgesetzt.

## Gebietsschema

Das interaktive Onboarding verwendet das Gebietsschema des CLI-Assistenten für fest vorgegebene Einrichtungstexte. Auflösungsreihenfolge:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Englische Rückfalleinstellung

Unterstützte Gebietsschemas des Assistenten sind `en`, `zh-CN` und `zh-TW`. Gebietsschemawerte können Unterstriche oder POSIX-Suffixformen wie `zh_CN.UTF-8` verwenden. Produktnamen, Befehlsnamen, Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs und Plugin-/Kanalbezeichnungen bleiben unverändert.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
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

`--custom-api-key` ist optional; wenn es weggelassen wird, prüft das Onboarding `CUSTOM_API_KEY` in der Umgebung. OpenClaw kennzeichnet verbreitete Vision-Modell-IDs (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral und ähnliche) automatisch als bildfähig. Übergeben Sie `--custom-image-input` für unbekannte benutzerdefinierte Vision-IDs oder `--custom-text-input`, um reine Textmetadaten zu erzwingen. Verwenden Sie `--custom-compatibility openai-responses` für OpenAI-kompatible Endpunkte, die `/v1/responses`, aber nicht `/v1/chat/completions` unterstützen; gültige Werte sind `openai` (Standard), `openai-responses`, `anthropic`.

LM Studio verfügt außerdem über ein providerspezifisches Schlüssel-Flag:

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

`--custom-base-url` verwendet standardmäßig `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es weggelassen wird, verwendet das Onboarding die von Ollama vorgeschlagenen Standardwerte. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Speichern Sie Provider-Schlüssel als Referenzen statt als Klartext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding umgebungsbasierte Referenzen statt Klartext-Schlüsselwerten: Für auf Authentifizierungsprofilen basierende Provider wird `keyRef: { source: "env", provider: "default", id: <envVar> }` geschrieben; für benutzerdefinierte Provider wird `models.providers.<id>.apiKey` auf dieselbe Weise geschrieben (beispielsweise `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Vertrag: Legen Sie die Umgebungsvariable des Providers in der Prozessumgebung des Onboardings fest (beispielsweise `OPENAI_API_KEY`) und übergeben Sie nicht zusätzlich ein Inline-Schlüssel-Flag, sofern diese Umgebungsvariable nicht gesetzt ist – ein Flag-Wert ohne die passende Umgebungsvariable führt mit entsprechenden Hinweisen sofort zum Abbruch.

### Gateway-Authentifizierung (nicht interaktiv)

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token. `token` ist der Standardauthentifizierungsmodus.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als Umgebungs-SecretRef. Erfordert eine nicht leere Umgebungsvariable dieses Namens in der Prozessumgebung des Onboardings.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- Mit `--install-daemon`: Ein durch SecretRef verwaltetes `gateway.auth.token` wird validiert, aber nicht als aufgelöster Klartext in den Umgebungsmetadaten des Supervisor-Dienstes gespeichert; wenn die Referenz nicht aufgelöst werden kann, schlägt die Installation sicher geschlossen mit Hinweisen zur Behebung fehl. Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit festgelegt wurde.
- Das lokale Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn in einer späteren Konfigurationsdatei `gateway.mode` fehlt, weist dies auf eine beschädigte Konfiguration oder eine unvollständige manuelle Bearbeitung hin, nicht auf eine gültige Abkürzung für den lokalen Modus.
- Das lokale Onboarding installiert herunterladbare Plugins, die für den gewählten Einrichtungspfad erforderlich sind (beispielsweise ein Codex- oder Copilot-Laufzeit-Plugin für diese Authentifizierungsoptionen). Das Remote-Onboarding schreibt nur Verbindungsinformationen für das entfernte Gateway – es installiert niemals lokale Plugin-Pakete.
- `--allow-unconfigured` ist ein separater Ausweg für `openclaw gateway run`; es erlaubt dem Onboarding nicht, `gateway.mode` zu überspringen.

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

### Zustand des lokalen Gateway

- Sofern Sie nicht `--skip-health` übergeben, wartet das Onboarding auf ein erreichbares lokales Gateway, bevor es erfolgreich beendet wird.
- `--install-daemon` startet zuerst den verwalteten Gateway-Installationspfad. Ohne dieses Flag muss bereits ein lokales Gateway ausgeführt werden (beispielsweise `openclaw gateway run`).
- `--skip-health` überspringt das Warten, wenn Sie bei einer Automatisierung nur Konfigurations-, Workspace- und Bootstrap-Schreibvorgänge wünschen.
- `--skip-bootstrap` setzt `agents.defaults.skipBootstrap: true` und überspringt das Erstellen von `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md`.
- Unter nativem Windows versucht `--install-daemon` zuerst, geplante Aufgaben zu verwenden, und greift auf ein benutzerspezifisches Anmeldeelement im Autostartordner zurück, wenn die Erstellung der Aufgabe verweigert wird.

### Interaktiver Referenzmodus

- Wählen Sie bei der Aufforderung **Geheimnisreferenz verwenden** und anschließend entweder **Umgebungsvariable** oder einen konfigurierten Geheimnis-Provider (`file` oder `exec`).
- Das Onboarding führt vor dem Speichern der Referenz eine schnelle Vorabvalidierung durch und ermöglicht Ihnen bei einem Fehler einen erneuten Versuch.

### Z.AI-Endpunktauswahl

<Note>
`--auth-choice zai-api-key` erkennt automatisch den besten Z.AI-Endpunkt und das beste Modell für Ihren Schlüssel: Coding-Plan-Endpunkte bevorzugen `zai/glm-5.2` (mit Rückgriff auf `glm-5.1`, falls nicht verfügbar); allgemeine API-Endpunkte verwenden standardmäßig `zai/glm-5.1`. Um einen Coding-Plan-Endpunkt zu erzwingen, wählen Sie direkt `zai-coding-global` oder `zai-coding-cn`.
</Note>

```bash
# Endpunktauswahl ohne Eingabeaufforderung
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Weitere Z.AI-Endpunktoptionen: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Zusätzliche Flags für den nicht interaktiven Modus

Tokenbasierte Modellauthentifizierung (verwendet mit `--auth-choice token`):

| Flag                            | Beschreibung                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | ID des Token-Providers, der das Token ausstellt                                                                                     |
| `--token <token>`               | Tokenwert für die Modellauthentifizierung                                                                                           |
| `--token-profile-id <id>`       | ID des Authentifizierungsprofils (Standard: `<provider>:manual`; einige Provider-eigene Abläufe verwenden einen eigenen Standard, etwa `anthropic:default`) |
| `--token-expires-in <duration>` | Optionale Gültigkeitsdauer des Tokens (z. B. `365d`, `12h`)                                                                         |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Steuerung der Daemon-Installation: `--no-install-daemon` / `--skip-daemon` (Aliasse; Installation des Gateway-Dienstes überspringen), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (Standard: `npm`), `--skip-skills`.

Einrichtung der Benutzeroberfläche und Hooks: `--skip-ui` (Eingabeaufforderungen der Control UI/TUI überspringen), `--skip-hooks` (Einrichtung von Webhooks/Hooks überspringen), `--skip-channels`, `--skip-search`.

Ausgabe: `--suppress-gateway-token-output` unterdrückt tokenhaltige Gateway-/UI-Ausgaben (Tokenhinweise, URL für die automatische Anmeldung mit eingebettetem Token und automatischer Start der Control UI) – nützlich in gemeinsam genutzten Terminals und in CI.

<Note>
`--json` impliziert beim geführten oder klassischen Onboarding keinen nicht interaktiven Modus.
Mit `--modern` liefert JSON einmalig eine Crestodian-Übersicht und beendet sich nach
diesem einzelnen Ergebnis. Verwenden Sie für andere Skripte `--non-interactive`.
</Note>

## Provider-Vorfilterung

Wenn eine Authentifizierungsoption einen bevorzugten Provider vorgibt, filtert das Onboarding die Auswahlfelder für das Standardmodell und die Positivliste auf die Modelle dieses Providers vor. Der Filter berücksichtigt auch andere Provider desselben Plugins und deckt damit Coding-Plan-Varianten wie `volcengine`/`volcengine-plan` und `byteplus`/`byteplus-plan` ab. Wenn der Filter für den bevorzugten Provider keine geladenen Modelle ergibt, greift das Onboarding auf den ungefilterten Katalog zurück, statt das Auswahlfeld leer zu lassen.

## Folgeabfragen für die Websuche

Einige Provider für die Websuche lösen während des Onboardings Provider-spezifische Folgeabfragen aus:

- **Grok** kann eine optionale Einrichtung von `x_search` mit derselben xAI-Authentifizierung und einer Modellauswahl für `x_search` anbieten.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` oder `api.moonshot.cn`) und dem standardmäßigen Kimi-Modell für die Websuche fragen.

## Weitere Verhaltensweisen

- Verhalten des DM-Geltungsbereichs beim lokalen Onboarding: [Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference#outputs-and-internals).
- Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Kanaleinrichtung).
- Benutzerdefinierter Provider: Verbinden Sie einen beliebigen OpenAI- oder Anthropic-kompatiblen Endpunkt, einschließlich nicht aufgeführter gehosteter Provider. Verwenden Sie die Kompatibilität **Unknown**, um diese durch eine Live-Prüfung automatisch zu erkennen.
- Wenn ein Hermes-Status erkannt wird, bietet das Onboarding einen Migrationsablauf an (siehe `--flow import` oben).

## Häufig verwendete Folgebefehle

Verwenden Sie `openclaw configure` später für gezielte Änderungen ohne Inferenz und `openclaw
channels add` für eine reine Kanaleinrichtung. Führen Sie für Änderungen am Modell-Provider oder an der Authentifizierungsroute
stattdessen `openclaw onboard` aus.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
