---
read_when:
    - Ändern des Modell-Fallback-Verhaltens oder der Auswahl-UX
    - Fehlerbehebung bei „Modell ist nicht zulässig“ oder einem veralteten Fallback auf den Standard-Provider
    - Arbeiten am Zusammenführungs- und Geheimnisverhalten von models.json
sidebarTitle: Models CLI
summary: Wie OpenClaw Provider-/Modellreferenzen, Konfigurationsschlüssel und den Chatbefehl `/model` auflöst
title: Modelle-CLI
x-i18n:
    generated_at: "2026-07-24T04:22:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cd13a2aae6575bdfeefb477b7fe8be740b77c66cb76454b07d82481f6612152
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Modell-Failover" href="/de/concepts/model-failover">
    Rotation von Auth-Profilen, Cooldowns und deren Zusammenspiel mit Fallbacks.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers">
    Kurzübersicht über Provider und Beispiele.
  </Card>
  <Card title="CLI-Referenz für Modelle" href="/de/cli/models">
    Vollständige Referenz zu `openclaw models`-Befehlen und -Flags.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults">
    Modellkonfigurationsschlüssel, Standardwerte und Beispiele.
  </Card>
</CardGroup>

Eine Modellreferenz (`provider/model`) wählt einen Provider und ein Modell aus, nicht die zugrunde liegende
Agent-Runtime. Wenn keine Runtime-Richtlinie festgelegt ist oder `auto` verwendet wird, kann die Provider-eigene
Routing-Richtlinie von OpenAI Codex nur für eine exakt übereinstimmende offizielle HTTPS-Platform-
Responses- oder ChatGPT-Responses-Route ohne explizite Anforderungsüberschreibung auswählen; allein das
Präfix `openai/*` wählt Codex niemals aus. Completions-Adapter, benutzerdefinierte
Endpunkte und explizit festgelegtes Anforderungsverhalten verbleiben bei OpenClaw. Offizielle
Klartext-HTTP-Endpunkte werden abgelehnt. Siehe [Implizite OpenAI-Agent-Runtime](/de/providers/openai#implicit-agent-runtime).

Referenzen für ein Copilot-Abonnement (`github-copilot/*`) können für das externe
GitHub-Copilot-Agent-Runtime-Plugin aktiviert werden, dieser Pfad ist jedoch immer explizit (und wird niemals
durch `auto` ausgewählt). Runtime-Überschreibungen gehören in die Provider-/Modellrichtlinie, nicht in
den gesamten Agenten oder die gesamte Sitzung. Die Runtime-Auswahl bestimmt nicht die Abrechnung:
Anmeldedaten für OpenAI-API-Schlüssel und ChatGPT-/Codex-Abonnements bleiben getrennt. Siehe
[Agent-Runtimes](/de/concepts/agent-runtimes) und
[GitHub-Copilot-Agent-Runtime](/de/plugins/copilot).

## Auswahlreihenfolge

<Steps>
  <Step title="Primärmodell">
    `agents.defaults.model.primary` (oder `agents.defaults.model` als einfache Zeichenfolge).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks`, werden der Reihe nach ausprobiert.
  </Step>
  <Step title="Auth-Failover">
    Die Rotation der Auth-Profile erfolgt innerhalb eines Providers, bevor OpenClaw zum nächsten Fallback-Modell wechselt.
  </Step>
</Steps>

Zugehörige Oberflächen für die Modellkonfiguration:

- `agents.defaults.models` speichert Aliasse und modellspezifische Einstellungen. Das Hinzufügen eines Eintrags schränkt Modellüberschreibungen nicht ein.
- `agents.defaults.modelPolicy.allow` ist die optionale Positivliste für Überschreibungen. Verwenden Sie exakte Referenzen oder nachgestellte Präfix-Platzhalter wie `provider/*` und `provider/namespace/*`; lassen Sie den Wert weg oder setzen Sie `[]`, um jedes Modell zuzulassen. Das agentenspezifische `agents.entries.*.modelPolicy.allow` ersetzt die Standardrichtlinie für diesen Agenten.
- `agents.defaults.utilityModel` ist ein optionales kostengünstigeres Modell für kurze interne Aufgaben wie generierte Sitzungstitel im Dashboard, unterstützte Thread-/Thementitel von Kanälen und Fortschrittsbeschreibungen. Das agentenspezifische `agents.entries.*.utilityModel` überschreibt es. Wenn kein Wert festgelegt ist, verwendet OpenClaw den deklarierten Standard des primären Providers für kleine Modelle, sofern vorhanden (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), andernfalls das Primärmodell des Agenten; legen Sie eine leere Zeichenfolge fest, um Utility-Routing zu deaktivieren. Wenn ein separates Utility-Modell fehlschlägt, wird die Generierung von Titeln einmal mit dem Primärmodell wiederholt. Bei Dashboard-Titeln folgen die automatische Utility-Ableitung und der reguläre Fallback dem effektiven Sitzungs-Provider und Auth-Profil; ein explizites Utility-Modell behält seinen konfigurierten Provider und seine konfigurierte Authentifizierung bei. Ein leeres Utility-Modell überspringt nur die alternative Route über ein kleines Modell, nicht die Generierung von Dashboard-Titeln. Utility-Aufgaben sind separate Modellaufrufe und können begrenzte Aufgabeninhalte an den ausgewählten Modell-Provider senden.
- `agents.defaults.imageModel` wird nur verwendet, wenn das Primärmodell keine Bilder verarbeiten kann.
- `agents.defaults.pdfModel` wird vom Tool `pdf` verwendet. Wenn kein Wert festgelegt ist, greift das Tool zunächst auf `imageModel` und anschließend auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `agents.defaults.mediaModels.{image,music,video}` dient als Grundlage für die gemeinsam genutzten Tools zur Mediengenerierung. Wenn kein Wert festgelegt ist, leitet jedes Tool einen durch Authentifizierung gestützten Provider-Standard ab: zuerst den aktuellen Standard-Provider, anschließend die übrigen für diese Funktion registrierten Provider in der Reihenfolge ihrer Provider-IDs. Der Provider-übergreifende Fallback ist das festgelegte Standardverhalten.
- Das agentenspezifische `agents.entries.*.model` (zuzüglich Bindungen) überschreibt `agents.defaults.model` – siehe [Multi-Agent-Routing](/de/concepts/multi-agent).

Vollständige Schlüsselreferenz, Standardwerte und JSON5-Beispiele: [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults).

## Auswahlquelle und Fallback-Striktheit

Dasselbe `provider/model` verhält sich je nach Herkunft unterschiedlich:

| Quelle                                                                  | Verhalten                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Konfigurierter Standard (`agents.defaults.model.primary`, agentenspezifisches Primärmodell) | Normaler Ausgangspunkt; verwendet `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Automatischer Fallback                                                   | Temporärer Wiederherstellungszustand, gespeichert als `modelOverrideSource: "auto"`. OpenClaw prüft das ursprüngliche Primärmodell regelmäßig erneut, hebt die automatische Auswahl nach der Wiederherstellung auf und meldet Fallback-/Wiederherstellungsübergänge einmal pro Zustandsänderung.                              |
| Benutzerauswahl für die Sitzung                                         | Exakt und strikt. `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` speichern `modelOverrideSource: "user"`. Wenn dieser Provider bzw. dieses Modell nicht mehr erreichbar ist, schlägt die Ausführung sichtbar fehl, anstatt auf ein anderes konfiguriertes Modell auszuweichen. |
| Cron `--model` / Nutzlast `model`                                        | Auftragsspezifisches Primärmodell. Verwendet weiterhin konfigurierte Fallbacks, sofern der Auftrag keine eigene Nutzlast `fallbacks` bereitstellt (`fallbacks: []` erzwingt eine strikte Ausführung).                                                                                                                    |

Weitere Auswahlregeln:

- Eine Änderung von `agents.defaults.model.primary` schreibt vorhandene Sitzungsfixierungen nicht neu. Wenn der Status `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` meldet, führen Sie `/model default` aus, um die Fixierung aufzuheben.
- CLI-Auswahldialoge für das Standardmodell und die Positivliste berücksichtigen `models.mode: "replace"`, indem sie nur `models.providers.*.models` statt des vollständigen integrierten Katalogs auflisten.
- Die Modellauswahl der Control UI fragt beim Gateway dessen konfigurierte Modellansicht ab. Ein explizites `modelPolicy.allow` filtert diese Ansicht, einschließlich Einträgen mit nachgestellten Präfix-Platzhaltern; andernfalls zeigt sie konfigurierte Modelle sowie Provider mit verwendbarer Authentifizierung an. Der vollständige integrierte Katalog ist expliziten Suchansichten vorbehalten (`models.list` mit `view: "all"` oder `openclaw models list --all`).
- Provider-Inventaroberflächen verwenden `models.list` mit `view: "provider-config"`, um von der Quelle definierte `models.providers.*.models`-Zeilen anzuzeigen, ohne Positivlisten der Auswahldialoge anzuwenden.

Vollständige Funktionsweise: [Modell-Failover](/de/concepts/model-failover).

## Schnelle Modellrichtlinie

- Legen Sie als Primärmodell das stärkste Modell der neuesten Generation fest, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzsensible Aufgaben und Chats mit geringeren Auswirkungen.
- Vermeiden Sie bei Agenten mit aktivierten Tools oder nicht vertrauenswürdigen Eingaben ältere bzw. schwächere Modellklassen.

## Onboarding

```bash
openclaw onboard
```

Richtet Modell und Authentifizierung für gängige Provider ein, ohne dass die Konfiguration manuell bearbeitet werden muss, einschließlich OAuth für OpenAI-Codex-Abonnements und Anthropic (API-Schlüssel oder Wiederverwendung der Claude CLI).

Wenn kein Primärmodell konfiguriert ist, wählt eine neue Einrichtung mit einem OpenAI-API-Schlüssel
`openai/gpt-5.6` aus; die einfache direkte API-ID wird der Sol-Klasse zugeordnet. Eine neue
ChatGPT-/Codex-OAuth-Einrichtung wählt die exakte Katalogreferenz `openai/gpt-5.6-sol` aus.
Bei einer erneuten Authentifizierung bleibt ein vorhandenes explizites Primärmodell erhalten, einschließlich
`openai/gpt-5.5`. Wenn GPT-5.6 für das Konto nicht verfügbar ist, wählen Sie
`openai/gpt-5.5` explizit aus; OpenClaw stuft es nicht stillschweigend herab.

## „Modell ist nicht zulässig“ (und warum Antworten ausbleiben)

Wenn `agents.defaults.modelPolicy.allow` nicht leer ist, wird es zur Positivliste für `/model`, Sitzungsüberschreibungen und `--model`. Bei Auswahl eines Modells außerhalb dieser Positivliste erfolgt eine Rückgabe, bevor eine normale Antwort generiert wird. Ein agentenspezifisches `agents.entries.*.modelPolicy.allow` ersetzt die Standardrichtlinie für diesen Agenten.

```text
Die Modellüberschreibung „provider/model“ ist durch agents.defaults.modelPolicy.allow nicht zulässig.
Fügen Sie „provider/model“, „provider/*“ oder ein enger gefasstes Präfix „provider/namespace/*“ zu agents.defaults.modelPolicy.allow hinzu oder entfernen/leeren Sie die Liste, um jedes Modell zuzulassen.
```

Beheben Sie das Problem, indem Sie das Modell oder einen Provider-Platzhalter zum genannten Schlüssel `modelPolicy.allow` hinzufügen, diese Liste entfernen/leeren oder ein Modell aus `/model list` auswählen. Wenn der abgelehnte Befehl eine Runtime-Überschreibung wie `/model openai/gpt-5.5 --runtime codex` enthielt, korrigieren Sie zuerst die Positivliste und führen Sie anschließend denselben Befehl erneut aus.

Für lokale/GGUF-Modelle benötigt die Positivliste die vollständige Referenz mit Provider-Präfix, beispielsweise `ollama/gemma4:26b` oder `lmstudio/Gemma4-26b-a4-it-gguf` – prüfen Sie `openclaw models list --provider <provider>` auf die exakte Zeichenfolge. Einfache Dateinamen oder Anzeigenamen reichen nicht aus, sobald die Positivliste aktiv ist.

Um Provider einzuschränken, ohne jedes Modell aufzulisten, verwenden Sie Einträge mit nachgestellten Präfix-Platzhaltern. Ein Provider-weiter Eintrag `provider/*` entspricht jedem Modell dieses Providers; ein engeres Präfix wie `clawrouter/anthropic/*` entspricht nur diesem Namensraum:

```json5
{
  agents: {
    defaults: {
      modelPolicy: {
        allow: ["openai/*", "vllm/*"],
      },
    },
  },
}
```

`/model`, `/models` und Modellauswahldialoge zeigen dann nur den ermittelten Katalog für diese Provider an, und neue Modelle können erscheinen, ohne die Positivliste zu bearbeiten. Kombinieren Sie exakte `provider/model`-Einträge mit `provider/*`-Einträgen, um ein bestimmtes Modell eines anderen Providers einzubeziehen.

Beispiel für eine Positivliste mit Aliasen und modellspezifischen Einstellungen:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      modelPolicy: {
        allow: ["anthropic/claude-sonnet-4-6", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Positivliste explizit bearbeiten">
Legen Sie die vollständige Liste direkt fest:

```bash
openclaw config set agents.defaults.modelPolicy.allow '["openai/gpt-5.4","anthropic/*"]' --strict-json
```

`openclaw models set`, die Provider-Einrichtung und `openclaw models aliases add` können Einträge unter `agents.defaults.models` hinzufügen, ändern jedoch niemals `modelPolicy.allow`. Dadurch bleiben Modellmetadaten und Aliasse von der Überschreibungsrichtlinie unabhängig.
</Accordion>

## `/model` im Chat

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` und `/model list` zeigen eine kompakte nummerierte Auswahl (Modellfamilie + verfügbare Provider); `/model <#>` wählt daraus aus. Auf Discord öffnet dies Provider-/Modell-Dropdowns mit einem Submit-Schritt; auf Telegram gelten Auswahlen nur für die jeweilige Sitzung und überschreiben niemals den dauerhaften Standard des Agenten in `openclaw.json`. `/models add` ist veraltet und gibt eine Meldung zurück, statt Modelle über den Chat zu registrieren.
- `/model` speichert die neue Sitzungsauswahl sofort. Wenn der Agent inaktiv ist, verwendet der nächste Lauf sie unmittelbar; wenn bereits ein Lauf aktiv ist, wird der Wechsel für den nächsten sauberen Wiederholungspunkt vorgemerkt (oder für einen späteren, falls bereits eine Tool-Aktivität oder die Antwortausgabe begonnen hat).
- `/model default` löscht die Sitzungsauswahl, sodass wieder der konfigurierte primäre Wert übernommen wird.
- Eine vom Benutzer ausgewählte `/model`-Referenz gilt strikt für diese Sitzung: Wenn sie nicht mehr erreichbar ist, schlägt die Antwort sichtbar fehl, statt stillschweigend über `agents.defaults.model.fallbacks` auszuweichen. Konfigurierte Standardwerte und primäre Modelle von Cron-Aufträgen verwenden weiterhin Fallback-Ketten.
- `/model status` ist die Detailansicht: Authentifizierungskandidaten pro Provider sowie (falls konfiguriert) der Provider-Endpunkt `baseUrl` und der Modus `api`.
- Modellreferenzen werden durch Aufteilung am ersten `/` geparst; geben Sie `provider/model` ein. Wenn die Modell-ID selbst `/` enthält (im OpenRouter-Stil), geben Sie das Provider-Präfix an, z. B. `/model openrouter/moonshotai/kimi-k2`. Wenn Sie den Provider weglassen, versucht OpenClaw Folgendes: (1) Übereinstimmung mit einem Alias, (2) eindeutige Übereinstimmung mit einem konfigurierten Provider für genau diese Modell-ID ohne Präfix, (3) den konfigurierten Standard-Provider (veralteter Fallback) — und wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, stattdessen das erste konfigurierte Provider-/Modellpaar, damit kein veralteter Standard eines entfernten Providers angezeigt wird.
- Modellreferenzen werden in Kleinbuchstaben normalisiert; Provider-IDs müssen ansonsten exakt übereinstimmen. Verwenden Sie daher die vom Plugin angegebene ID.

Vollständiges Befehlsverhalten und Konfiguration: [Slash-Befehle](/de/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` ohne Unterbefehl ist eine Kurzform für `models status`, das außerdem den Ablaufzeitpunkt von OAuth für Profile im Authentifizierungsspeicher anzeigt (standardmäßig erfolgt innerhalb von 24h eine Warnung). Vollständige Flags, JSON-Strukturen und Unterbefehle für Authentifizierungsprofile: [Models-CLI-Referenz](/de/cli/models).

<AccordionGroup>
  <Accordion title="Durchsuchen (kostenlose OpenRouter-Modelle)">
    `openclaw models scan` untersucht den öffentlichen Katalog kostenloser Modelle von OpenRouter und kann Kandidaten live auf Tool- und Bildunterstützung prüfen. Der Katalog selbst ist öffentlich, daher benötigen reine Metadatenscans (`--no-probe`) keinen Schlüssel; Live-Prüfungen und `--set-default`/`--set-image` erfordern einen OpenRouter-API-Schlüssel (Authentifizierungsprofil oder `OPENROUTER_API_KEY`) und beschränken die Ausgabe ohne einen solchen Schlüssel zwingend auf Metadaten.

    Die Ergebnisse werden nach folgenden Kriterien geordnet: Bildunterstützung, dann Tool-Latenz, dann Kontextgröße, dann Parameteranzahl. In einem TTY fordern geprüfte Ergebnisse zur interaktiven Fallback-Auswahl auf; im nicht interaktiven Modus ist `--yes` erforderlich, um die Standardwerte zu übernehmen.

  </Accordion>
</AccordionGroup>

## Modellregister (`models.json`)

Unter `models.providers` konfigurierte benutzerdefinierte Provider werden im Agentenverzeichnis (Standard: `~/.openclaw/agents/<agentId>/agent/models.json`) in `models.json` geschrieben. Kataloge von Provider-Plugins werden separat als generierte, Plugin-eigene Katalogsegmente gespeichert und automatisch geladen. Diese Datei wird standardmäßig mit der Konfiguration zusammengeführt; setzen Sie `models.mode: "replace"`, um ausschließlich Ihre konfigurierten Provider zu verwenden.

<AccordionGroup>
  <Accordion title="Priorität im Zusammenführungsmodus">
    Für übereinstimmende Provider-IDs:

    - Ein bereits in der Agenten-`models.json` vorhandener, nicht leerer Wert `baseUrl` hat Vorrang.
    - Ein nicht leerer Wert `apiKey` in `models.json` hat nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Authentifizierungsprofilkontext nicht von SecretRef verwaltet wird.
    - Von SecretRef verwaltete `apiKey`-Werte werden anhand von Quellmarkierungen aktualisiert, statt aufgelöste Geheimnisse dauerhaft zu speichern: der Name der Umgebungsvariable für Umgebungsreferenzen, `secretref-managed` für Datei-/Ausführungsreferenzen.
    - Von SecretRef verwaltete Header-Werte werden auf dieselbe Weise aktualisiert; für Umgebungsreferenzen wird `secretref-env:ENV_VAR_NAME` verwendet.
    - Leere oder fehlende Werte `apiKey`/`baseUrl` in `models.json` greifen auf den Konfigurationswert `models.providers` zurück.
    - Andere Provider-Felder werden anhand der Konfiguration und normalisierter Katalogdaten aktualisiert.

  </Accordion>
</AccordionGroup>

Die Persistenz von Markierungen richtet sich maßgeblich nach der Quelle: Wenn OpenClaw `models.json` neu generiert, schreibt es Markierungen aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung), nicht aus den aufgelösten Laufzeitwerten von Geheimnissen — auch bei befehlsgesteuerten Pfaden wie `openclaw agent`.

## Verwandte Themen

- [Agenten-Laufzeitumgebungen](/de/concepts/agent-runtimes) — OpenClaw, Codex und andere Laufzeitumgebungen für Agentenschleifen
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Schlüssel der Modellkonfiguration
- [Bilderzeugung](/de/tools/image-generation) — Konfiguration von Bildmodellen
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Modell-Provider](/de/concepts/model-providers) — Provider-Routing und Authentifizierung
- [Models-CLI-Referenz](/de/cli/models) — vollständige Referenz zu Befehlen und Flags
- [Musikerzeugung](/de/tools/music-generation) — Konfiguration von Musikmodellen
- [Videoerzeugung](/de/tools/video-generation) — Konfiguration von Videomodellen
