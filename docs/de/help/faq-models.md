---
read_when:
    - Modelle auswählen oder wechseln, Aliasnamen konfigurieren
    - Fehlerbehebung beim Modell-Failover / „Alle Modelle sind fehlgeschlagen“
    - Authentifizierungsprofile verstehen und verwalten
sidebarTitle: Models FAQ
summary: 'FAQ: Modell-Standardwerte, Auswahl, Aliasse, Wechsel, Failover und Authentifizierungsprofile'
title: 'FAQ: Modelle und Authentifizierung'
x-i18n:
    generated_at: "2026-05-07T13:18:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  Model- und Auth-Profil-Fragen und -Antworten. Informationen zu Einrichtung, Sitzungen, Gateway, Kanälen und
  Fehlerbehebung finden Sie in der Haupt-[FAQ](/de/help/faq).

  ## Modelle: Defaults, Auswahl, Aliasse, Wechsel

  <AccordionGroup>
  <Accordion title='Was ist das "Default-Modell"?'>
    Das Default-Modell von OpenClaw ist das, was Sie als Folgendes festlegen:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.5` oder `anthropic/claude-sonnet-4-6`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer für den exakt konfigurierten Provider mit dieser Modell-ID, und fällt erst danach als veralteten Kompatibilitätspfad auf den konfigurierten Default-Provider zurück. Wenn dieser Provider das konfigurierte Default-Modell nicht mehr bereitstellt, fällt OpenClaw auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, statt einen veralteten Default eines entfernten Providers anzuzeigen. Sie sollten dennoch `provider/model` **explizit** festlegen.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    **Empfohlener Default:** Verwenden Sie das stärkste verfügbare Modell der neuesten Generation in Ihrem Provider-Stack.
    **Für Agents mit Tools oder nicht vertrauenswürdigen Eingaben:** Priorisieren Sie Modellstärke vor Kosten.
    **Für routinemäßige Chats mit geringem Risiko:** Verwenden Sie günstigere Fallback-Modelle und routen Sie nach Agent-Rolle.

    MiniMax hat eigene Dokumentation: [MiniMax](/de/providers/minimax) und
    [Lokale Modelle](/de/gateway/local-models).

    Faustregel: Verwenden Sie für Arbeit mit hohem Risiko das **beste Modell, das Sie sich leisten können**, und ein günstigeres
    Modell für routinemäßige Chats oder Zusammenfassungen. Sie können Modelle pro Agent routen und Sub-Agents verwenden, um
    lange Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht Tokens). Siehe [Modelle](/de/concepts/models) und
    [Sub-Agents](/de/tools/subagents).

    Deutliche Warnung: Schwächere oder zu stark quantisierte Modelle sind anfälliger für Prompt
    Injection und unsicheres Verhalten. Siehe [Sicherheit](/de/gateway/security).

    Mehr Kontext: [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Verwenden Sie **Modellbefehle** oder bearbeiten Sie nur die **model**-Felder. Vermeiden Sie vollständige Konfigurationsersetzungen.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Sitzung)
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - `agents.defaults.model` in `~/.openclaw/openclaw.json` bearbeiten

    Vermeiden Sie `config.apply` mit einem Teilobjekt, es sei denn, Sie möchten die gesamte Konfiguration ersetzen.
    Prüfen Sie bei RPC-Bearbeitungen zuerst mit `config.schema.lookup` und bevorzugen Sie `config.patch`. Die Lookup-Nutzlast liefert Ihnen den normalisierten Pfad, flache Schemadokumentation/-Einschränkungen und Zusammenfassungen unmittelbarer untergeordneter Elemente.
    für Teilaktualisierungen.
    Wenn Sie die Konfiguration überschrieben haben, stellen Sie sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus, um sie zu reparieren.

    Dokumentation: [Modelle](/de/concepts/models), [Konfigurieren](/de/cli/configure), [Konfiguration](/de/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Weg für lokale Modelle.

    Schnellste Einrichtung:

    1. Installieren Sie Ollama von `https://ollama.com/download`
    2. Rufen Sie ein lokales Modell ab, zum Beispiel `ollama pull gemma4`
    3. Wenn Sie auch Cloud-Modelle möchten, führen Sie `ollama signin` aus
    4. Führen Sie `openclaw onboard` aus und wählen Sie `Ollama`
    5. Wählen Sie `Local` oder `Cloud + Local`

    Hinweise:

    - `Cloud + Local` gibt Ihnen Cloud-Modelle plus Ihre lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Abruf
    - für manuelles Wechseln verwenden Sie `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt
    Injection. Wir empfehlen nachdrücklich **große Modelle** für jeden Bot, der Tools verwenden kann.
    Wenn Sie dennoch kleine Modelle verwenden möchten, aktivieren Sie Sandboxing und strikte Tool-Allowlisten.

    Dokumentation: [Ollama](/de/providers/ollama), [Lokale Modelle](/de/gateway/local-models),
    [Modell-Provider](/de/concepts/model-providers), [Sicherheit](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können sich unterscheiden und im Laufe der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfen Sie die aktuelle Laufzeiteinstellung auf jedem Gateway mit `openclaw models status`.
    - Verwenden Sie für sicherheitssensible Agents oder Agents mit Tools das stärkste verfügbare Modell der neuesten Generation.

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle spontan (ohne Neustart)?">
    Verwenden Sie den Befehl `/model` als eigenständige Nachricht:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Dies sind die integrierten Aliasse. Benutzerdefinierte Aliasse können über `agents.defaults.models` hinzugefügt werden.

    Sie können verfügbare Modelle mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt eine kompakte, nummerierte Auswahl. Wählen Sie per Nummer aus:

    ```
    /model 3
    ```

    Sie können auch ein bestimmtes Auth-Profil für den Provider erzwingen (pro Sitzung):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche Datei `auth-profiles.json` verwendet wird und welches Auth-Profil als Nächstes versucht wird.
    Außerdem werden der konfigurierte Provider-Endpunkt (`baseUrl`) und der API-Modus (`api`) angezeigt, wenn verfügbar.

    **Wie hebe ich die Fixierung eines Profils auf, das ich mit @profile festgelegt habe?**

    Führen Sie `/model` erneut **ohne** das Suffix `@profile` aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn Sie zum Default zurückkehren möchten, wählen Sie ihn über `/model` aus (oder senden Sie `/model <default provider/model>`).
    Verwenden Sie `/model status`, um zu bestätigen, welches Auth-Profil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.5 für tägliche Aufgaben und Codex 5.5 fürs Programmieren verwenden?">
    Ja. Behandeln Sie Modellwahl und Laufzeitwahl getrennt:

    - **Nativer Codex-Programmier-Agent:** Setzen Sie `agents.defaults.model.primary` auf `openai/gpt-5.5`. Melden Sie sich mit `openclaw models auth login --provider openai-codex` an, wenn Sie ChatGPT/Codex-Abonnement-Authentifizierung verwenden möchten.
    - **Direkte OpenAI-API-Aufgaben außerhalb der Agent-Schleife:** Konfigurieren Sie `OPENAI_API_KEY` für Bilder, Embeddings, Sprache, Realtime und andere OpenAI-API-Oberflächen außerhalb von Agents.
    - **OpenAI-Agent-API-Key-Authentifizierung:** Verwenden Sie `/model openai/gpt-5.5` mit einem geordneten `openai-codex`-API-Key-Profil.
    - **Sub-Agents:** Routen Sie Programmieraufgaben an einen reinen Codex-Agent mit eigenem Modell und eigenem `agentRuntime`-Default.

    Siehe [Modelle](/de/concepts/models) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich den Schnellmodus für GPT 5.5?">
    Verwenden Sie entweder einen Sitzungs-Umschalter oder einen Konfigurations-Default:

    - **Pro Sitzung:** Senden Sie `/fast on`, während die Sitzung `openai/gpt-5.5` verwendet.
    - **Pro Modell-Default:** Setzen Sie `agents.defaults.models["openai/gpt-5.5"].params.fastMode` auf `true`.

    Beispiel:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Für OpenAI wird der Schnellmodus bei unterstützten nativen Responses-Anfragen auf `service_tier = "priority"` abgebildet. Sitzungs-Overrides per `/fast` haben Vorrang vor Konfigurations-Defaults.

    Siehe [Denken und Schnellmodus](/de/tools/thinking) und [OpenAI-Schnellmodus](/de/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und dann keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und alle
    Sitzungs-Overrides. Wenn Sie ein Modell wählen, das nicht in dieser Liste enthalten ist, wird Folgendes zurückgegeben:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Dieser Fehler wird **anstelle** einer normalen Antwort zurückgegeben. Behebung: Fügen Sie das Modell zu
    `agents.defaults.models` hinzu, entfernen Sie die Allowlist oder wählen Sie ein Modell aus `/model list`.
    Wenn der Befehl auch `--runtime codex` enthielt, fügen Sie zuerst das Modell hinzu und versuchen Sie dann
    denselben Befehl `/model provider/model --runtime codex` erneut.

  </Accordion>

  <Accordion title='Warum sehe ich "Unknown model: minimax/MiniMax-M2.7"?'>
    Das bedeutet, dass der **Provider nicht konfiguriert ist** (keine MiniMax-Provider-Konfiguration oder kein Auth-
    Profil wurde gefunden), sodass das Modell nicht aufgelöst werden kann.

    Checkliste zur Behebung:

    1. Aktualisieren Sie auf eine aktuelle OpenClaw-Version (oder führen Sie vom Quellbranch `main` aus), und starten Sie dann das Gateway neu.
    2. Stellen Sie sicher, dass MiniMax konfiguriert ist (Assistent oder JSON) oder dass MiniMax-Authentifizierung
       in Env/Auth-Profilen vorhanden ist, damit der passende Provider injiziert werden kann
       (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeichertes MiniMax-
       OAuth für `minimax-portal`).
    3. Verwenden Sie die exakte Modell-ID (Groß-/Kleinschreibung beachten) für Ihren Auth-Pfad:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für die API-Key-
       Einrichtung oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für die OAuth-Einrichtung.
    4. Führen Sie Folgendes aus:

       ```bash
       openclaw models list
       ```

       und wählen Sie aus der Liste aus (oder `/model list` im Chat).

    Siehe [MiniMax](/de/providers/minimax) und [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Default und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie **MiniMax als Default** und wechseln Sie Modelle bei Bedarf **pro Sitzung**.
    Fallbacks sind für **Fehler** gedacht, nicht für „schwere Aufgaben“, verwenden Sie also `/model` oder einen separaten Agent.

    **Option A: pro Sitzung wechseln**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Dann:

    ```
    /model gpt
    ```

    **Option B: separate Agents**

    - Default von Agent A: MiniMax
    - Default von Agent B: OpenAI
    - Routen Sie nach Agent oder verwenden Sie `/agent` zum Wechseln

    Dokumentation: [Modelle](/de/concepts/models), [Multi-Agent-Routing](/de/concepts/multi-agent), [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt integrierte Kurzbefehle?">
    Ja. OpenClaw liefert einige Standard-Kurzformen mit (werden nur angewendet, wenn das Modell in `agents.defaults.models` vorhanden ist):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Wenn Sie einen eigenen Alias mit demselben Namen festlegen, hat Ihr Wert Vorrang.

  </Accordion>

  <Accordion title="Wie definiere/überschreibe ich Modell-Kurzbefehle (Aliasse)?">
    Aliasse stammen aus `agents.defaults.models.<modelId>.alias`. Beispiel:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Dann wird `/model sonnet` (oder `/<alias>`, wenn unterstützt) zu dieser Modell-ID aufgelöst.

  </Accordion>

  <Accordion title="Wie füge ich Modelle anderer Provider wie OpenRouter oder Z.AI hinzu?">
    OpenRouter (Abrechnung pro Token; viele Modelle):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM-Modelle):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Wenn Sie auf einen Provider/ein Modell verweisen, aber der erforderliche Provider-Schlüssel fehlt, erhalten Sie einen Laufzeit-Authentifizierungsfehler (z. B. `No API key found for provider "zai"`).

    **Kein API-Schlüssel für Provider gefunden, nachdem ein neuer Agent hinzugefügt wurde**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Speicher hat. Auth ist agentbezogen und wird gespeichert in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Behebungsoptionen:

    - Führen Sie `openclaw agents add <id>` aus und konfigurieren Sie Auth im Assistenten.
    - Oder kopieren Sie nur portable statische `api_key`- / `token`-Profile aus dem Auth-Speicher des Hauptagenten in den Auth-Speicher des neuen Agenten.
    - Melden Sie sich bei OAuth-Profilen vom neuen Agent aus an, wenn er ein eigenes Konto benötigt; andernfalls kann OpenClaw ohne Klonen von Refresh-Tokens auf den Standard-/Hauptagenten zugreifen.

    Verwenden Sie `agentDir` **nicht** für mehrere Agenten; das verursacht Auth-/Sitzungskollisionen.

  </Accordion>
</AccordionGroup>

## Modell-Failover und „Alle Modelle fehlgeschlagen“

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover erfolgt in zwei Stufen:

    1. **Auth-Profilrotation** innerhalb desselben Providers.
    2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

    Cooldowns gelten für fehlschlagende Profile (exponentieller Backoff), sodass OpenClaw weiter antworten kann, auch wenn ein Provider rate-limitiert ist oder vorübergehend fehlschlägt.

    Der Rate-Limit-Bucket umfasst mehr als reine `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfensterlimits (`weekly/monthly limit reached`) als Rate-Limits,
    die Failover rechtfertigen.

    Einige nach Abrechnung aussehende Antworten sind nicht `402`, und einige HTTP-`402`-
    Antworten bleiben ebenfalls in diesem vorübergehenden Bucket. Wenn ein Provider
    expliziten Abrechnungstext bei `401` oder `403` zurückgibt, kann OpenClaw dies dennoch
    in der Abrechnungsspur halten, aber providerspezifische Text-Matcher bleiben auf den
    Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Meldung stattdessen wie ein erneut versuchbares Nutzungsfenster- oder
    Organisations-/Workspace-Ausgabenlimit aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw sie als
    `rate_limit`, nicht als langfristige Abrechnungsdeaktivierung.

    Kontextüberlauf-Fehler sind anders: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben auf dem Compaction-/Retry-Pfad, anstatt den Modell-
    Fallback voranzutreiben.

    Allgemeiner Serverfehlertext ist absichtlich enger gefasst als „alles mit
    unknown/error darin“. OpenClaw behandelt providerbezogene vorübergehende Formen
    wie Anthropic pur `An unknown error occurred`, OpenRouter pur
    `Provider returned error`, Stop-Reason-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payloads mit vorübergehendem Servertext
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) und Provider-Busy-Fehler wie `ModelNotReadyException` als
    Timeout-/Überlastungssignale, die Failover rechtfertigen, wenn der Provider-Kontext
    passt.
    Allgemeiner interner Fallback-Text wie `LLM request failed with an unknown
    error.` bleibt konservativ und löst für sich allein keinen Modell-Fallback aus.

  </Accordion>

  <Accordion title='Was bedeutet „No credentials found for profile anthropic:default“?'>
    Es bedeutet, dass das System versucht hat, die Auth-Profil-ID `anthropic:default` zu verwenden, aber keine Anmeldedaten dafür im erwarteten Auth-Speicher finden konnte.

    **Checkliste zur Behebung:**

    - **Bestätigen Sie, wo Auth-Profile gespeichert sind** (neue vs. Legacy-Pfade)
      - Aktuell: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`)
    - **Bestätigen Sie, dass Ihre Umgebungsvariable vom Gateway geladen wird**
      - Wenn Sie `ANTHROPIC_API_KEY` in Ihrer Shell setzen, das Gateway aber über systemd/launchd ausführen, übernimmt es diese möglicherweise nicht. Legen Sie sie in `~/.openclaw/.env` ab oder aktivieren Sie `env.shellEnv`.
    - **Stellen Sie sicher, dass Sie den richtigen Agent bearbeiten**
      - Multi-Agent-Setups bedeuten, dass mehrere `auth-profiles.json`-Dateien vorhanden sein können.
    - **Prüfen Sie Modell-/Auth-Status grob auf Plausibilität**
      - Verwenden Sie `openclaw models status`, um konfigurierte Modelle zu sehen und ob Provider authentifiziert sind.

    **Checkliste zur Behebung für „No credentials found for profile anthropic“**

    Das bedeutet, dass der Lauf an ein Anthropic-Auth-Profil gebunden ist, das Gateway
    es aber nicht in seinem Auth-Speicher finden kann.

    - **Claude CLI verwenden**
      - Führen Sie `openclaw models auth login --provider anthropic --method cli --set-default` auf dem Gateway-Host aus.
    - **Wenn Sie stattdessen einen API-Schlüssel verwenden möchten**
      - Legen Sie `ANTHROPIC_API_KEY` in `~/.openclaw/.env` auf dem **Gateway-Host** ab.
      - Löschen Sie jede festgelegte Reihenfolge, die ein fehlendes Profil erzwingt:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Bestätigen Sie, dass Sie Befehle auf dem Gateway-Host ausführen**
      - Im Remote-Modus liegen Auth-Profile auf dem Gateway-Rechner, nicht auf Ihrem Laptop.

  </Accordion>

  <Accordion title="Warum wurde auch Google Gemini ausprobiert und ist fehlgeschlagen?">
    Wenn Ihre Modellkonfiguration Google Gemini als Fallback enthält (oder Sie zu einer Gemini-Kurzform gewechselt haben), versucht OpenClaw es während des Modell-Fallbacks. Wenn Sie keine Google-Anmeldedaten konfiguriert haben, sehen Sie `No API key found for provider "google"`.

    Behebung: Stellen Sie entweder Google-Auth bereit oder entfernen/vermeiden Sie Google-Modelle in `agents.defaults.model.fallbacks` / Aliasen, damit der Fallback nicht dorthin weiterleitet.

    **LLM-Anfrage abgelehnt: Thinking-Signatur erforderlich (Google Antigravity)**

    Ursache: Der Sitzungsverlauf enthält **Thinking-Blöcke ohne Signaturen** (häufig aus
    einem abgebrochenen/teilweisen Stream). Google Antigravity erfordert Signaturen für Thinking-Blöcke.

    Behebung: OpenClaw entfernt jetzt unsignierte Thinking-Blöcke für Google Antigravity Claude. Wenn es weiterhin auftritt, starten Sie eine **neue Sitzung** oder setzen Sie `/thinking off` für diesen Agent.

  </Accordion>
</AccordionGroup>

## Auth-Profile: was sie sind und wie Sie sie verwalten

Verwandt: [/concepts/oauth](/de/concepts/oauth) (OAuth-Flows, Token-Speicherung, Multi-Account-Muster)

<AccordionGroup>
  <Accordion title="Was ist ein Auth-Profil?">
    Ein Auth-Profil ist ein benannter Anmeldedatensatz (OAuth oder API-Schlüssel), der an einen Provider gebunden ist. Profile befinden sich in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Um gespeicherte Profile zu prüfen, ohne Secrets auszugeben, führen Sie `openclaw models auth list` aus (optional `--provider <id>` oder `--json`). Details finden Sie unter [Models CLI](/de/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Was sind typische Profil-IDs?">
    OpenClaw verwendet providerpräfixierte IDs wie:

    - `anthropic:default` (üblich, wenn keine E-Mail-Identität vorhanden ist)
    - `anthropic:<email>` für OAuth-Identitäten
    - benutzerdefinierte IDs, die Sie wählen (z. B. `anthropic:work`)

  </Accordion>

  <Accordion title="Kann ich steuern, welches Auth-Profil zuerst versucht wird?">
    Ja. Die Konfiguration unterstützt optionale Metadaten für Profile und eine Reihenfolge pro Provider (`auth.order.<provider>`). Dies speichert **keine** Secrets; es ordnet IDs Provider/Modus zu und legt die Rotationsreihenfolge fest.

    OpenClaw kann ein Profil vorübergehend überspringen, wenn es sich in einem kurzen **Cooldown** (Rate-Limits/Timeouts/Auth-Fehler) oder in einem längeren **deaktivierten** Zustand (Abrechnung/unzureichendes Guthaben) befindet. Um dies zu prüfen, führen Sie `openclaw models status --json` aus und prüfen Sie `auth.unusableProfiles`. Tuning: `auth.cooldowns.billingBackoffHours*`.

    Rate-Limit-Cooldowns können modellbezogen sein. Ein Profil, das für ein Modell
    abkühlt, kann für ein verwandtes Modell beim selben Provider weiterhin nutzbar sein,
    während Abrechnungs-/Deaktivierungsfenster weiterhin das gesamte Profil blockieren.

    Sie können auch eine **agentbezogene** Reihenfolgenüberschreibung (gespeichert in `auth-state.json` dieses Agenten) über die CLI setzen:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Um einen bestimmten Agenten anzusprechen:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Um zu überprüfen, was tatsächlich versucht wird, verwenden Sie:

    ```bash
    openclaw models status --probe
    ```

    Wenn ein gespeichertes Profil in der expliziten Reihenfolge ausgelassen wird, meldet Probe
    `excluded_by_auth_order` für dieses Profil, anstatt es stillschweigend zu versuchen.

  </Accordion>

  <Accordion title="OAuth vs. API-Schlüssel - was ist der Unterschied?">
    OpenClaw unterstützt beides:

    - **OAuth** nutzt häufig Abonnementzugriff (sofern zutreffend).
    - **API-Schlüssel** verwenden Pay-per-Token-Abrechnung.

    Der Assistent unterstützt ausdrücklich Anthropic Claude CLI, OpenAI Codex OAuth und API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — die Haupt-FAQ
- [FAQ — Schnellstart und Einrichtung beim ersten Lauf](/de/help/faq-first-run)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
