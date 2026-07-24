---
read_when:
    - CLI-Onboarding ausführen oder konfigurieren
    - Einrichten eines neuen Computers
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: Inferenz überprüfen, dann die verbleibende Einrichtung an OpenClaw übergeben'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-07-24T05:18:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 150adfac1424b42d66fa3035339082574cc631ce0dc3db09ad32376ef139bf1c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Das CLI-Onboarding ist der empfohlene Weg zur Einrichtung im Terminal unter macOS, Linux und
Windows (nativ oder WSL2). Standardmäßig erkennt es bereits auf dem
Rechner verfügbaren KI-Zugriff, überprüft ihn mit einer echten Vervollständigung und startet OpenClaw, um
den Arbeitsbereich, das Gateway und optionale Funktionen zu konfigurieren. `openclaw setup` führt denselben Ablauf aus ([Einrichtung](/de/cli/setup) behandelt
die reine Konfigurationsvariante `--baseline`). Benutzer der Windows-Desktopversion können auch
über den [Windows Hub](/de/platforms/windows) beginnen.

Das geführte Onboarding richtet zuerst die Inferenz ein. Es erkennt verfügbaren KI-Zugriff,
erfordert eine echte Vervollständigung und startet erst dann [OpenClaw](/de/cli/openclaw),
um den Rest von OpenClaw zu konfigurieren. Wenn Sie **Skip for now** auswählen, wird das Onboarding
beendet, ohne OpenClaw zu starten.

Der klassische Assistent bleibt für benutzerdefinierte Provider, die Einrichtung eines entfernten Gateways,
die Kanalkopplung, Daemon-Steuerung, Skills und Importe verfügbar. Starten Sie ihn ausdrücklich
mit `openclaw onboard --classic`; die geführte Inferenz-Auswahl delegiert
nicht an ihn. Nachdem die Inferenzprüfung bestanden wurde, kann OpenClaw mit `open channel wizard for
<channel>` die Kanaleinrichtung, die Geheimnisse benötigt, an einen maskierten Terminal-Assistenten übergeben.
Um den Modell-Provider oder dessen Authentifizierung zu ändern, beenden Sie OpenClaw und führen Sie
`openclaw onboard` aus; OpenClaw öffnet keine geführten oder klassischen Provider-Abläufe.

<Info>
Der schnellste Weg zum ersten Chat: Schließen Sie die geführte Einrichtung ab, führen Sie `openclaw dashboard` aus und chatten Sie
im Browser über die Control UI. Dokumentation: [Dashboard](/de/web/dashboard).
</Info>

## Gebietsschema

Der Assistent lokalisiert fest vorgegebene Onboarding-Texte. Er verwendet den ersten nicht leeren Wert aus
`OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES` und `LANG` in dieser Reihenfolge und
greift anschließend auf Englisch zurück. Unterstützte Gebietsschemata: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Explizite Überschreibung auf Englisch
```

Produktnamen, Befehle, Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs und
Plugin-/Kanalbezeichnungen bleiben unabhängig vom Gebietsschema auf Englisch.

So konfigurieren Sie Einstellungen, die nicht die Inferenz betreffen, später neu:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` bedeutet nicht automatisch einen nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive` (siehe [CLI-Automatisierung](/de/start/wizard-cli-automation)).
</Note>

<Tip>
Der klassische Assistent umfasst einen Schritt zur Websuche, in dem Sie einen Provider auswählen können: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG oder Tavily. Einige benötigen einen API-Schlüssel, andere funktionieren
ohne Schlüssel. Konfigurieren Sie dies später mit `openclaw configure --section web`. Dokumentation:
[Webtools](/de/tools/web).
</Tip>

## Geführter Standardablauf

Ein einfacher Aufruf von `openclaw onboard` folgt diesem Ablauf:

1. Akzeptieren Sie den Sicherheitshinweis.
2. Erkennen Sie konfigurierte Modelle, Umgebungsvariablen für API-Schlüssel, unterstützte lokale KI-
   CLIs und bereits installierte toolfähige Modelle von erreichbaren Ollama- oder LM-
   Studio-Servern auf dem Gateway-Host. Dieser schreibgeschützte Durchlauf lädt niemals ein
   Modell herunter. Installationen von Gemini CLI, Antigravity, Pi und OpenCode werden ebenfalls gemeldet,
   wenn sie nicht als wiederverwendbare Inferenzroute für die geführte Einrichtung dienen können.
   Gemini und Antigravity können die toolfreie Prüfung nicht erzwingen; Pi und OpenCode
   sind vollständige Agent-Harnesses und keine Inferenzrouten für die Einrichtung.
3. Testen Sie den ersten erkannten Kandidaten mit einer echten Vervollständigung. Bei einem Fehler wird der
   Grund angezeigt und mit dem nächsten verwendbaren Kandidaten fortgefahren.
4. Wenn keine weiteren Erkennungsoptionen verfügbar sind, wählen Sie OpenAI, Anthropic, xAI (Grok), Google oder
   OpenRouter oder wählen Sie **More…** für die übrigen Provider. Die Regionen,
   Tarife und unterstützten Browser-, Geräte-, API-Schlüssel- oder Token-Methoden jedes Providers
   werden in einem zweiten Menü angezeigt und mit derselben echten Vervollständigung getestet.
   Wählen Sie **Skip for now**, um den Vorgang zu beenden, ohne OpenClaw zu starten.
5. Speichern Sie nur die verifizierte Modellroute und alle dafür erforderlichen Anmeldedaten-/Plugin-Zustände.
   Die Einstellungen für Arbeitsbereich und Gateway bleiben unverändert.
6. Starten Sie OpenClaw mit dem verifizierten Modell, damit es den Arbeitsbereich,
   das Gateway, die Kanäle, Agenten, Plugins und die verbleibende optionale Einrichtung konfigurieren kann.

Wenn Sie den Befehl in einer konfigurierten Installation erneut ausführen, wird zuerst das aktuelle Standardmodell
getestet, wodurch der geführte Ablauf als Überprüfungs- und Reparaturdurchlauf dient. Eine fehlgeschlagene
Prüfung ersetzt das konfigurierte Modell niemals automatisch; das Onboarding wird angehalten und
fragt, wie fortgefahren werden soll. Führen Sie `openclaw channels add` oder `openclaw configure` für
spätere Ergänzungen aus, die nicht die Inferenz betreffen; verwenden Sie `openclaw onboard` für Änderungen
an Provider- oder Authentifizierungsrouten.

## Klassischer Assistent: QuickStart oder Advanced

Führen Sie `openclaw onboard --classic` aus, um den vollständigen Assistenten zu öffnen. Er beginnt mit einer
Auswahl zwischen **QuickStart** (Standardeinstellungen) und **Advanced** (vollständige Kontrolle). Übergeben Sie
`--flow quickstart` oder `--flow advanced` (Alias `manual`), um den klassischen
Ablauf auszuwählen und diese Abfrage zu überspringen.

<Tabs>
  <Tab title="QuickStart (Standardeinstellungen)">
    - Lokales Gateway, Loopback-Bindung
    - Standardarbeitsbereich (oder vorhandener Arbeitsbereich)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung **Token** (automatisch generiert, auch bei Loopback)
    - Tool-Richtlinie: `tools.profile: "coding"` für neue Einrichtungen (ein vorhandenes explizites Profil bleibt erhalten)
    - DM-Sitzungen: Das Onboarding behält eine explizite Einstellung `session.dmScope` bei und lässt sie andernfalls ungesetzt, sodass die Standardeinstellung `"main"` alle Direktnachrichten kanalübergreifend in der fortlaufenden Hauptsitzung des Agenten hält – die Standardeinstellung für persönliche Agenten. Verwenden Sie für gemeinsam genutzte Posteingänge oder Posteingänge mit mehreren Benutzern `"per-channel-peer"`; `openclaw security audit` empfiehlt eine Isolation, wenn DM-Datenverkehr von mehreren Benutzern erkannt wird. Details: [Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Freigabe **Off**
    - DMs von Telegram und WhatsApp verwenden standardmäßig **allowlist**: Telegram fragt nach einer numerischen Telegram-Benutzer-ID, WhatsApp nach einer Telefonnummer

  </Tab>
  <Tab title="Advanced (vollständige Kontrolle)">
    - Zeigt jeden Schritt an: Modus, Arbeitsbereich, Gateway, Kanäle, Daemon, Skills

  </Tab>
</Tabs>

Der entfernte Modus (`--mode remote`) verwendet immer den erweiterten Ablauf; er
konfiguriert lediglich diesen Rechner für die Verbindung mit einem anderen Gateway und installiert
oder ändert niemals etwas auf dem entfernten Host.

## Was das klassische Onboarding konfiguriert

Der lokale Modus (Standard) führt durch folgende Schritte:

1. **Modell/Authentifizierung** – Wählen Sie einen Authentifizierungsablauf für einen Provider (API-Schlüssel, OAuth oder
   providerspezifische manuelle Authentifizierung), einschließlich eines benutzerdefinierten Providers
   (OpenAI-kompatibel, mit OpenAI Responses kompatibel, Anthropic-kompatibel oder
   automatische Erkennung bei unbekanntem Typ). Wählen Sie ein Standardmodell.
   Eine neue Einrichtung mit OpenAI-API-Schlüssel verwendet standardmäßig `openai/gpt-5.6` (die bloße Direct-API-
   ID wird zu Sol aufgelöst); eine neue ChatGPT-/Codex-Einrichtung verwendet standardmäßig
   `openai/gpt-5.6-sol`. Bei erneuter Ausführung der Einrichtung bleibt ein vorhandenes explizites Modell erhalten,
   einschließlich `openai/gpt-5.5`. Wählen Sie `openai/gpt-5.5` ausdrücklich aus, wenn das
   Konto keinen Zugriff auf GPT-5.6 bietet.
   Sicherheitshinweis: Wenn dieser Agent Tools ausführt oder Webhook-/Hook-
   Inhalte verarbeitet, verwenden Sie vorzugsweise das stärkste verfügbare Modell der neuesten Generation und halten Sie
   die Tool-Richtlinie strikt – schwächere oder ältere Stufen sind anfälliger für Prompt-Injection.
   Bei nicht interaktiven Ausführungen speichert `--secret-input-mode ref` umgebungsvariablenbasierte Referenzen
   anstelle von API-Schlüsselwerten im Klartext; die referenzierte Umgebungsvariable muss bereits
   gesetzt sein, andernfalls schlägt das Onboarding sofort fehl. Der interaktive Modus für Geheimnisreferenzen kann
   auf eine Umgebungsvariable oder eine konfigurierte Provider-Referenz (`file` oder
   `exec`) verweisen, wobei vor dem Speichern eine schnelle Vorabprüfung erfolgt. Nach der Modell-/Authentifizierungseinrichtung
   bietet der Assistent einen optionalen Live-Vervollständigungstest an; bei einem Fehler kann einmal zur
   Modell-/Authentifizierungseinrichtung zurückgekehrt oder der Fehler ignoriert werden, ohne den Rest des
   klassischen Assistenten zu blockieren. Das Ignorieren entsperrt OpenClaw nicht; die dialogbasierte Einrichtung
   erfordert weiterhin eine bestandene Inferenzprüfung.
2. **Arbeitsbereich** – Verzeichnis für Agentendateien (Standard `~/.openclaw/workspace`). Legt Bootstrap-Dateien an.
3. **Gateway** – Port, Bindungsadresse, Authentifizierungsmodus, Tailscale-Freigabe. Wählen Sie im
   interaktiven Token-Modus zwischen der Speicherung des Tokens im Klartext (Standard) und
   einer SecretRef. Nicht interaktiver SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** – integrierte Chatkanäle und offizielle Plugin-Chatkanäle, darunter
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
5. **Daemon** – installiert einen LaunchAgent (macOS), eine systemd-Benutzereinheit
   (Linux/WSL2) oder eine native geplante Windows-Aufgabe mit einem benutzerspezifischen
   Ausweichmechanismus über den Autostartordner.
   Wenn Token-Authentifizierung erforderlich ist und `gateway.auth.token` über SecretRef verwaltet wird,
   validiert die Daemon-Installation diese Referenz, speichert jedoch kein aufgelöstes Token in den
   Umgebungsmetadaten des Supervisor-Dienstes; eine nicht aufgelöste SecretRef blockiert
   die Installation und zeigt entsprechende Anweisungen an. Wenn sowohl `gateway.auth.token` als auch
   `gateway.auth.password` gesetzt sind, während `gateway.auth.mode` nicht gesetzt ist, wird die Installation
   blockiert, bis Sie den Modus ausdrücklich festlegen.
6. **Integritätsprüfung** – startet das Gateway und überprüft dessen Erreichbarkeit.
7. **Skills** – installiert empfohlene Skills und deren optionale Abhängigkeiten.

<Note>
Eine erneute Ausführung des Onboardings löscht **nichts**, sofern Sie nicht ausdrücklich
**Reset** auswählen (oder `--reset` übergeben). CLI `--reset` beschränkt sich standardmäßig auf Konfiguration, Anmeldedaten
und Sitzungen; verwenden Sie `--reset-scope full`, um auch den Arbeitsbereich zu entfernen. Wenn die
Konfiguration ungültig ist oder veraltete Schlüssel enthält, fordert das Onboarding Sie auf, zuerst
`openclaw doctor` auszuführen.
</Note>

`--flow import` führt im klassischen Assistenten einen erkannten Migrationsablauf (zum Beispiel Hermes)
anstelle einer neuen Einrichtung aus; siehe [Migration](/de/cli/migrate) und die Migrationsanleitungen unter
[Installation](/de/install/migrating-hermes). `openclaw onboard --modern` ist ein
Kompatibilitätsalias für [OpenClaw](/de/cli/openclaw). Es verwendet dieselbe
Inferenzschranke wie `openclaw setup`: Eine verifizierte Inferenz startet den
Assistenten, während ein interaktiver Fehler zur geführten Inferenzeinrichtung zurückführt.

## Weiteren Agenten hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agenten mit eigenem
Arbeitsbereich, eigenen Sitzungen und Authentifizierungsprofilen zu erstellen. Bei Ausführung ohne `--workspace` wird
ein interaktiver Ablauf für Name, Arbeitsbereich, Authentifizierung, Kanäle und Bindungen gestartet – dies ist
nicht der vollständige Assistent `openclaw onboard`.

Festgelegte Werte:

- `agents.entries.*.name`
- `agents.entries.*.workspace`
- `agents.entries.*.agentDir`

Hinweise:

- Standardarbeitsbereich: `~/.openclaw/workspace-<agentId>` (oder unter
  `agents.defaults.workspace`, falls dies gesetzt ist).
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten an diesen Agenten weiterzuleiten (das Onboarding kann dies für Sie erledigen).
- Flags für den nicht interaktiven Modus: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Vollständige Referenz

Ausführliche Informationen zum schrittweisen Verhalten und zu den Konfigurationsausgaben finden Sie in der
[Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference).
Nicht interaktive Beispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation).
Die vollständige Flag-Referenz finden Sie unter [`openclaw onboard`](/de/cli/onboard).

## Verwandte Dokumentation

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Onboarding-Übersicht: [Onboarding-Übersicht](/de/start/onboarding-overview)
- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Erststartritual des Agenten: [Agent-Bootstrapping](/de/start/bootstrapping)
