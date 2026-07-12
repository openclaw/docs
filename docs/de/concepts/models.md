---
read_when:
    - Ändern des Modell-Fallback-Verhaltens oder der Auswahloberfläche
    - Fehlerbehebung bei „Modell ist nicht zulässig“ oder einem veralteten Fallback auf den Standard-Provider
    - Arbeiten am Zusammenführungs- und Geheimnisverhalten von models.json
sidebarTitle: Models CLI
summary: Wie OpenClaw Provider-/Modellreferenzen, Konfigurationsschlüssel und den Chatbefehl `/model` auflöst
title: Modelle-CLI
x-i18n:
    generated_at: "2026-07-12T15:18:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Modell-Failover" href="/de/concepts/model-failover">
    Rotation von Auth-Profilen, Abklingzeiten und deren Zusammenspiel mit Fallbacks.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers">
    Kurzübersicht über Provider und Beispiele.
  </Card>
  <Card title="CLI-Referenz für Modelle" href="/de/cli/models">
    Vollständige Referenz zu Befehlen und Flags von `openclaw models`.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults">
    Modellkonfigurationsschlüssel, Standardwerte und Beispiele.
  </Card>
</CardGroup>

Eine Modellreferenz (`provider/model`) wählt einen Provider und ein Modell aus, nicht die systemnahe
Agent-Runtime. Wenn keine Runtime-Richtlinie festgelegt ist oder `auto` verwendet wird, kann die
Provider-eigene Routing-Richtlinie von OpenAI Codex nur für eine exakt offizielle HTTPS-Platform-
Responses- oder ChatGPT-Responses-Route ohne vom Autor festgelegte Anfrageüberschreibung auswählen;
das Präfix `openai/*` allein wählt niemals Codex aus. Completions-Adapter, benutzerdefinierte
Endpunkte und vom Autor festgelegtes Anfrageverhalten verbleiben bei OpenClaw. Offizielle
Klartext-HTTP-Endpunkte werden abgelehnt. Siehe [Implizite Agent-Runtime von OpenAI](/de/providers/openai#implicit-agent-runtime).

Copilot-Abonnementreferenzen (`github-copilot/*`) können für das externe
GitHub-Copilot-Agent-Runtime-Plugin aktiviert werden, dieser Pfad ist jedoch immer explizit (und wird
niemals durch `auto` ausgewählt). Runtime-Überschreibungen gehören in die Provider-/Modellrichtlinie,
nicht auf den gesamten Agenten oder die gesamte Sitzung. Die Runtime-Auswahl bestimmt nicht die
Abrechnung: Anmeldedaten für OpenAI-API-Schlüssel und ChatGPT-/Codex-Abonnements bleiben getrennt. Siehe
[Agent-Runtimes](/de/concepts/agent-runtimes) und
[GitHub-Copilot-Agent-Runtime](/de/plugins/copilot).

## Auswahlreihenfolge

<Steps>
  <Step title="Primärmodell">
    `agents.defaults.model.primary` (oder `agents.defaults.model` als einfache Zeichenfolge).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks`, der Reihe nach ausprobiert.
  </Step>
  <Step title="Auth-Failover">
    Die Rotation von Auth-Profilen erfolgt innerhalb eines Providers, bevor OpenClaw zum nächsten Fallback-Modell wechselt.
  </Step>
</Steps>

Zugehörige Oberflächen für die Modellkonfiguration:

- `agents.defaults.models` ist die Zulassungsliste bzw. der Katalog der Modelle, die OpenClaw verwenden kann, einschließlich Aliassen. Verwenden Sie `provider/*`-Einträge, um jedes erkannte Modell eines Providers zuzulassen, ohne jedes einzeln aufzuführen.
- `agents.defaults.utilityModel` ist ein optionales, kostengünstigeres Modell für kurze interne Aufgaben wie generierte Sitzungstitel im Dashboard, unterstützte Thread-/Thementitel von Kanälen und Fortschrittsbeschreibungen. Die agentenspezifische Einstellung `agents.list[].utilityModel` überschreibt sie. Wenn sie nicht festgelegt ist, verwendet OpenClaw den deklarierten Standard des primären Providers für kleine Modelle, sofern vorhanden (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), andernfalls das Primärmodell des Agenten; legen Sie eine leere Zeichenfolge fest, um Utility-Routing zu deaktivieren. Utility-Aufgaben sind separate Modellaufrufe und können begrenzte Aufgabeninhalte an den ausgewählten Modell-Provider senden.
- `agents.defaults.imageModel` wird nur verwendet, wenn das Primärmodell keine Bilder verarbeiten kann.
- `agents.defaults.pdfModel` wird vom `pdf`-Tool verwendet. Wenn es nicht festgelegt ist, greift das Tool zunächst auf `imageModel` und danach auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` und `videoGenerationModel` dienen als Grundlage für die gemeinsamen Tools zur Mediengenerierung. Wenn sie nicht festgelegt sind, leitet jedes Tool einen durch Auth gestützten Provider-Standard ab: zuerst den aktuellen Standard-Provider, danach die übrigen für diese Fähigkeit registrierten Provider in der Reihenfolge ihrer Provider-IDs. Legen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false` fest, um diese Provider-übergreifende Ableitung zu deaktivieren und explizite Fallbacks beizubehalten.
- Die agentenspezifische Einstellung `agents.list[].model` (einschließlich Bindungen) überschreibt `agents.defaults.model` — siehe [Multi-Agent-Routing](/de/concepts/multi-agent).

Vollständige Schlüsselreferenz, Standardwerte und JSON5-Beispiele: [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults).

## Auswahlquelle und Fallback-Strenge

Dasselbe `provider/model` verhält sich je nach Herkunft unterschiedlich:

| Quelle                                                                  | Verhalten                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Konfigurierter Standard (`agents.defaults.model.primary`, agentenspezifisches Primärmodell) | Normaler Ausgangspunkt; verwendet `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Automatischer Fallback                                                   | Temporärer Wiederherstellungszustand, gespeichert als `modelOverrideSource: "auto"`. OpenClaw prüft das ursprüngliche Primärmodell regelmäßig erneut, löscht die automatische Auswahl bei der Wiederherstellung und kündigt Fallback-/Wiederherstellungsübergänge einmal pro Zustandsänderung an.                              |
| Benutzerauswahl für die Sitzung                                         | Exakt und strikt. `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` speichern `modelOverrideSource: "user"`. Wenn dieser Provider bzw. dieses Modell nicht mehr erreichbar ist, schlägt die Ausführung sichtbar fehl, statt auf ein anderes konfiguriertes Modell zurückzugreifen. |
| Cron `--model` / Nutzdatenfeld `model`                                  | Primärmodell pro Auftrag. Verwendet weiterhin konfigurierte Fallbacks, sofern der Auftrag keine eigenen `fallbacks` in den Nutzdaten angibt (`fallbacks: []` erzwingt eine strikte Ausführung).                                                                                                                    |

Weitere Auswahlregeln:

- Das Ändern von `agents.defaults.model.primary` überschreibt bestehende Sitzungsfixierungen nicht. Wenn der Status `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` meldet, führen Sie `/model default` aus, um die Fixierung aufzuheben.
- Auswahloberflächen für das CLI-Standardmodell und die Zulassungsliste berücksichtigen `models.mode: "replace"`, indem sie nur `models.providers.*.models` statt des vollständigen integrierten Katalogs aufführen.
- Die Modellauswahl in der Control UI fragt beim Gateway dessen konfigurierte Modellansicht ab: `agents.defaults.models`, wenn festgelegt (einschließlich `provider/*`-Platzhaltereinträgen), andernfalls `models.providers.*.models` sowie Provider mit verwendbarer Auth. Der vollständige integrierte Katalog ist expliziten Suchansichten vorbehalten (`models.list` mit `view: "all"` oder `openclaw models list --all`).
- Benutzeroberflächen für den Provider-Bestand verwenden `models.list` mit `view: "provider-config"`, um die in der Quelle definierten Zeilen aus `models.providers.*.models` anzuzeigen, ohne Zulassungslisten der Auswahloberfläche anzuwenden.

Vollständiger Ablauf: [Modell-Failover](/de/concepts/model-failover).

## Kurze Modellrichtlinie

- Legen Sie das stärkste Ihnen verfügbare Modell der neuesten Generation als Primärmodell fest.
- Verwenden Sie Fallbacks für kosten- bzw. latenzabhängige Aufgaben und Chats mit geringerem Risiko.
- Vermeiden Sie für Agenten mit aktivierten Tools oder nicht vertrauenswürdige Eingaben ältere bzw. schwächere Modellstufen.

## Onboarding

```bash
openclaw onboard
```

Richtet Modelle und Auth für gängige Provider ein, ohne die Konfiguration manuell bearbeiten zu müssen, einschließlich OAuth für ein OpenAI-Codex-Abonnement und Anthropic (API-Schlüssel oder Wiederverwendung der Claude CLI).

Wenn kein Primärmodell konfiguriert ist, wählt eine neue Einrichtung mit OpenAI-API-Schlüssel
`openai/gpt-5.6` aus; die einfache ID der direkten API wird der Sol-Stufe zugeordnet. Eine neue
ChatGPT-/Codex-OAuth-Einrichtung wählt die exakte Katalogreferenz `openai/gpt-5.6-sol` aus.
Eine erneute Authentifizierung behält ein vorhandenes explizites Primärmodell bei, einschließlich
`openai/gpt-5.5`. Wenn GPT-5.6 für das Konto nicht verfügbar ist, wählen Sie
`openai/gpt-5.5` explizit aus; OpenClaw stuft es nicht stillschweigend herab.

## „Modell ist nicht zulässig“ (und warum Antworten ausbleiben)

Wenn `agents.defaults.models` festgelegt ist, wird es zur Zulassungsliste für `/model` und Sitzungsüberschreibungen. Die Auswahl eines Modells außerhalb dieser Zulassungsliste gibt Folgendes zurück, bevor eine normale Antwort generiert wird:

```text
Modell "provider/model" ist nicht zulässig. Verwenden Sie /models, um Provider aufzulisten, oder /models <provider>, um Modelle aufzulisten.
Fügen Sie es hinzu mit: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Beheben Sie dies, indem Sie das Modell zu `agents.defaults.models` hinzufügen, die Zulassungsliste vollständig löschen (den Schlüssel entfernen) oder ein Modell aus `/model list` auswählen. Wenn der abgelehnte Befehl eine Runtime-Überschreibung wie `/model openai/gpt-5.5 --runtime codex` enthielt, korrigieren Sie zuerst die Zulassungsliste und führen Sie danach denselben Befehl `/model ... --runtime ...` erneut aus.

Für lokale/GGUF-Modelle benötigt die Zulassungsliste die vollständige Referenz mit Provider-Präfix, zum Beispiel `ollama/gemma4:26b` oder `lmstudio/Gemma4-26b-a4-it-gguf` — prüfen Sie mit `openclaw models list --provider <provider>` die exakte Zeichenfolge. Einfache Dateinamen oder Anzeigenamen reichen nicht aus, sobald die Zulassungsliste aktiv ist.

Um Provider einzuschränken, ohne jedes Modell aufzuführen, verwenden Sie `provider/*`-Platzhaltereinträge:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

`/model`, `/models` und Modellauswahloberflächen zeigen dann nur den erkannten Katalog dieser Provider an, und neue Modelle können erscheinen, ohne die Zulassungsliste zu bearbeiten. Kombinieren Sie exakte `provider/model`-Einträge mit `provider/*`-Einträgen, um ein bestimmtes Modell eines anderen Providers einzubeziehen.

Beispiel einer Zulassungsliste mit Aliassen:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Sichere Bearbeitung der Zulassungsliste über die CLI">
Verwenden Sie `--merge` für additive Änderungen:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` lehnt Zuweisungen einfacher Objekte an `agents.defaults.models`, `models.providers` oder `models.providers.<id>.models` ab, wenn dadurch vorhandene Einträge verloren gingen; verwenden Sie `--replace` nur, wenn der neue Wert zum vollständigen Zielwert werden soll. Die interaktive Provider-Einrichtung und `openclaw configure --section model` führen Provider-spezifische Auswahlen bereits mit der Zulassungsliste zusammen, sodass das Hinzufügen eines Providers keine unabhängigen Einträge entfernt; die Konfiguration behält ein vorhandenes `agents.defaults.model.primary` bei. Explizite Befehle wie `openclaw models auth login --provider <id> --set-default` und `openclaw models set <model>` ersetzen weiterhin das Primärmodell.
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

- `/model` und `/model list` zeigen eine kompakte nummerierte Auswahl (Modellfamilie + verfügbare Provider); `/model <#>` wählt daraus aus. Auf Discord werden dadurch Dropdown-Menüs für Provider und Modell mit einem Submit-Schritt geöffnet; auf Telegram gelten Auswahlen nur für die Sitzung und überschreiben niemals den dauerhaften Standard des Agenten in `openclaw.json`. `/models add` ist veraltet und gibt eine Meldung zurück, statt Modelle über den Chat zu registrieren.
- `/model` speichert die neue Sitzungsauswahl sofort. Wenn der Agent inaktiv ist, verwendet der nächste Lauf sie unmittelbar; wenn bereits ein Lauf aktiv ist, wird der Wechsel für den nächsten sauberen Wiederholungspunkt vorgemerkt (oder für einen späteren, falls bereits eine Tool-Aktivität oder die Antwortausgabe begonnen hat).
- `/model default` löscht die Sitzungsauswahl, sodass wieder das konfigurierte primäre Modell übernommen wird.
- Eine vom Benutzer ausgewählte `/model`-Referenz gilt strikt für diese Sitzung: Wenn sie nicht mehr erreichbar ist, schlägt die Antwort sichtbar fehl, statt stillschweigend auf `agents.defaults.model.fallbacks` zurückzugreifen. Konfigurierte Standardmodelle und primäre Modelle von Cron-Aufträgen verwenden weiterhin Fallback-Ketten.
- `/model status` ist die Detailansicht: Authentifizierungskandidaten pro Provider sowie (falls konfiguriert) der Provider-Endpunkt `baseUrl` und der `api`-Modus.
- Modellreferenzen werden durch Aufteilung am ersten `/` geparst; geben Sie `provider/model` ein. Wenn die Modell-ID selbst `/` enthält (wie bei OpenRouter), geben Sie das Provider-Präfix an, z. B. `/model openrouter/moonshotai/kimi-k2`. Wenn Sie den Provider weglassen, versucht OpenClaw Folgendes: (1) Übereinstimmung mit einem Alias, (2) eindeutige Übereinstimmung eines konfigurierten Providers für genau diese Modell-ID ohne Präfix, (3) den konfigurierten Standard-Provider (veralteter Fallback) — und falls dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, stattdessen das erste konfigurierte Provider-/Modellpaar, damit kein veralteter Standard eines entfernten Providers angezeigt wird.
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

`openclaw models` ohne Unterbefehl ist eine Kurzform für `models status`, das außerdem den Ablauf von OAuth-Anmeldedaten für Profile im Authentifizierungsspeicher anzeigt (standardmäßig wird innerhalb von 24h gewarnt). Vollständige Flags, JSON-Strukturen und Unterbefehle für Authentifizierungsprofile: [CLI-Referenz für Modelle](/de/cli/models).

<AccordionGroup>
  <Accordion title="Suche (kostenlose OpenRouter-Modelle)">
    `openclaw models scan` durchsucht den öffentlichen Katalog kostenloser Modelle von OpenRouter und kann Kandidaten live auf Tool- und Bildunterstützung prüfen. Der Katalog selbst ist öffentlich, daher benötigen reine Metadatensuchen (`--no-probe`) keinen Schlüssel; Live-Prüfungen und `--set-default`/`--set-image` erfordern einen OpenRouter-API-Schlüssel (Authentifizierungsprofil oder `OPENROUTER_API_KEY`) und beschränken die Ausgabe ohne einen solchen Schlüssel sicher auf Metadaten.

    Die Ergebnisse werden nach folgenden Kriterien sortiert: Bildunterstützung, dann Tool-Latenz, dann Kontextgröße und schließlich Parameteranzahl. In einem TTY fordern geprüfte Ergebnisse zur interaktiven Auswahl eines Fallbacks auf; im nicht interaktiven Modus ist `--yes` erforderlich, um die Standardwerte zu übernehmen.

  </Accordion>
</AccordionGroup>

## Modellregistrierung (`models.json`)

Unter `models.providers` konfigurierte benutzerdefinierte Provider werden im Agentenverzeichnis in `models.json` geschrieben (Standard: `~/.openclaw/agents/<agentId>/agent/models.json`). Kataloge von Provider-Plugins werden separat als generierte, Plugin-eigene Katalogfragmente gespeichert und automatisch geladen. Diese Datei wird standardmäßig mit der Konfiguration zusammengeführt; legen Sie `models.mode: "replace"` fest, um ausschließlich Ihre konfigurierten Provider zu verwenden.

<AccordionGroup>
  <Accordion title="Priorität im Zusammenführungsmodus">
    Für übereinstimmende Provider-IDs gilt:

    - Eine nicht leere `baseUrl`, die bereits in der `models.json` des Agenten vorhanden ist, hat Vorrang.
    - Ein nicht leerer `apiKey` in `models.json` hat nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Authentifizierungsprofilkontext nicht über SecretRef verwaltet wird.
    - Über SecretRef verwaltete `apiKey`-Werte werden anhand von Quellmarkierungen aktualisiert, statt aufgelöste Geheimnisse dauerhaft zu speichern: der Name der Umgebungsvariablen für Umgebungsreferenzen, `secretref-managed` für Datei-/Ausführungsreferenzen.
    - Über SecretRef verwaltete Header-Werte werden auf dieselbe Weise aktualisiert, wobei für Umgebungsreferenzen `secretref-env:ENV_VAR_NAME` verwendet wird.
    - Leere oder fehlende `apiKey`-/`baseUrl`-Werte in `models.json` greifen auf `models.providers` aus der Konfiguration zurück.
    - Andere Provider-Felder werden anhand der Konfiguration und normalisierter Katalogdaten aktualisiert.

  </Accordion>
</AccordionGroup>

Die dauerhafte Speicherung von Markierungen basiert maßgeblich auf der Quelle: OpenClaw schreibt Markierungen aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung), nicht aus den aufgelösten Geheimniswerten der Laufzeit, wenn `models.json` neu generiert wird — einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.

## Verwandte Themen

- [Agenten-Laufzeitumgebungen](/de/concepts/agent-runtimes) — OpenClaw, Codex und andere Laufzeitumgebungen für Agentenschleifen
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Konfigurationsschlüssel für Modelle
- [Bilderzeugung](/de/tools/image-generation) — Konfiguration von Bildmodellen
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Modell-Provider](/de/concepts/model-providers) — Provider-Routing und Authentifizierung
- [CLI-Referenz für Modelle](/de/cli/models) — vollständige Referenz zu Befehlen und Flags
- [Musikerzeugung](/de/tools/music-generation) — Konfiguration von Musikmodellen
- [Videoerzeugung](/de/tools/video-generation) — Konfiguration von Videomodellen
