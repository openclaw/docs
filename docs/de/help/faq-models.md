---
read_when:
    - Modelle auswählen oder wechseln, Aliasse konfigurieren
    - Fehlerbehebung bei Modell-Failover / „Alle Modelle sind fehlgeschlagen“
    - Authentifizierungsprofile verstehen und verwalten
sidebarTitle: Models FAQ
summary: 'FAQ: Modellstandards, Auswahl, Aliase, Wechsel, Failover und Authentifizierungsprofile'
title: 'FAQ: Modelle und Authentifizierung'
x-i18n:
    generated_at: "2026-07-12T15:24:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Fragen und Antworten zu Modellen und Authentifizierungsprofilen. Informationen zu Einrichtung, Sitzungen, Gateway, Kanälen und
  Fehlerbehebung finden Sie in den zentralen [häufig gestellten Fragen](/de/help/faq).

  ## Modelle: Standardeinstellungen, Auswahl, Aliasse, Wechsel

  <AccordionGroup>
  <Accordion title='Was ist das „Standardmodell“?'>
    Festgelegt wird es mit:

    ```text
    agents.defaults.model.primary
    ```

    Modelle sind Referenzen im Format `provider/model` (Beispiel: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Geben Sie `provider/model` immer explizit an. Wenn
    Sie den Provider weglassen, versucht OpenClaw zuerst, einen passenden Alias zu finden, dann eine
    eindeutige Übereinstimmung bei den konfigurierten Providern für diese Modell-ID und greift anschließend auf den
    konfigurierten Standard-Provider zurück (veralteter Kompatibilitätspfad). Wenn dieser
    Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw
    auf den ersten konfigurierten Provider mit Modell zurück statt auf eine veraltete Standardeinstellung.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    Verwenden Sie das leistungsfähigste Modell der neuesten Generation, das Ihr Provider-Stack anbietet,
    insbesondere für Agenten mit Werkzeugzugriff oder nicht vertrauenswürdigen Eingaben — schwächere oder
    übermäßig quantisierte Modelle sind anfälliger für Prompt-Injection und unsicheres
    Verhalten (siehe [Sicherheit](/de/gateway/security)). Leiten Sie routinemäßige Chats mit
    geringem Risiko abhängig von der Agentenrolle an günstigere Modelle weiter.

    Leiten Sie Modelle agentenspezifisch weiter und verwenden Sie Unteragenten, um lange Aufgaben zu parallelisieren (jeder
    Unteragent verbraucht eigene Tokens). Siehe [Modelle](/de/concepts/models),
    [Unteragenten](/de/tools/subagents), [MiniMax](/de/providers/minimax) und
    [Lokale Modelle](/de/gateway/local-models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Ändern Sie nur die Modellfelder — vermeiden Sie den vollständigen Austausch der Konfiguration.

    - `/model` im Chat (sitzungsspezifisch, siehe [Slash-Befehle](/de/tools/slash-commands))
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - bearbeiten Sie `agents.defaults.model` direkt in `~/.openclaw/openclaw.json`

    Prüfen Sie bei RPC-Änderungen zuerst mit `config.schema.lookup` (normalisierter
    Pfad, kurze Schemadokumentation, Zusammenfassungen untergeordneter Elemente) und verwenden Sie anschließend vorzugsweise `config.patch`
    mit einem partiellen Objekt statt `config.apply`. Falls Sie die Konfiguration überschrieben haben,
    stellen Sie sie aus einer Sicherung wieder her oder führen Sie zur Reparatur `openclaw doctor` aus.

    Dokumentation: [Modelle](/de/concepts/models), [Konfigurieren](/de/cli/configure),
    [Konfiguration](/de/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja — Ollama ist der einfachste Weg. Schnelle Einrichtung:

    1. Installieren Sie Ollama von `https://ollama.com/download`
    2. Laden Sie ein lokales Modell herunter, z. B. mit `ollama pull gemma4`
    3. Führen Sie für Cloud-Modelle zusätzlich `ollama signin` aus
    4. Führen Sie `openclaw onboard` aus, wählen Sie `Ollama` und anschließend `Local` oder `Cloud + Local`

    `Cloud + Local` bietet Ihnen Cloud-Modelle sowie Ihre lokalen Ollama-Modelle;
    Cloud-Modelle wie `kimi-k2.5:cloud` müssen nicht lokal heruntergeladen werden. So wechseln Sie
    manuell: `openclaw models list`, dann `openclaw models set ollama/<model>`.

    Kleinere/stark quantisierte Modelle sind anfälliger für Prompt-Injection.
    Verwenden Sie für jeden Bot mit Werkzeugzugriff große Modelle; wenn Sie dennoch kleine Modelle
    verwenden, aktivieren Sie Sandboxing und strikte Werkzeug-Zulassungslisten.

    Dokumentation: [Ollama](/de/providers/ollama), [Lokale Modelle](/de/gateway/local-models),
    [Modell-Provider](/de/concepts/model-providers), [Sicherheit](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle spontan (ohne Neustart)?">
    Senden Sie `/model <name>` als eigenständige Nachricht. Unter
    [Slash-Befehle](/de/tools/slash-commands) finden Sie die
    vollständige Befehlsliste, einschließlich der nummerierten Auswahl (`/model`, `/model
    list`, `/model 3`), `/model default` zum Löschen einer Sitzungsüberschreibung und
    `/model status` für Details zum Endpunkt/API-Modus.

    Erzwingen Sie mit `@profile` ein bestimmtes Authentifizierungsprofil pro Sitzung:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Um die Bindung eines mit `@profile` festgelegten Profils aufzuheben, führen Sie `/model` erneut ohne das
    Suffix aus (z. B. `/model anthropic/claude-opus-4-6`) oder wählen Sie den Standard aus
    `/model`. Verwenden Sie `/model status`, um das aktive Authentifizierungsprofil zu bestätigen.

  </Accordion>

  <Accordion title="Wenn zwei Provider dieselbe Modell-ID bereitstellen, welchen verwendet /model?">
    `/model provider/model` wählt genau diese Provider-Route aus. Beispielsweise sind
    `qianfan/deepseek-v4-flash` und `deepseek/deepseek-v4-flash` unterschiedliche
    Referenzen, obwohl die Modell-ID übereinstimmt — OpenClaw wechselt bei einer bloßen Übereinstimmung der ID nicht stillschweigend
    den Provider.

    Eine vom Benutzer ausgewählte `/model`-Referenz ist für den Fallback strikt: Wenn dieses
    Provider-/Modell-Paar nicht mehr verfügbar ist, schlägt die Antwort sichtbar fehl, anstatt
    auf `agents.defaults.model.fallbacks` zurückzufallen. Konfigurierte Fallback-
    Ketten gelten weiterhin für konfigurierte Standardwerte, Primärmodelle von Cron-Aufträgen und
    den automatisch ausgewählten Fallback-Zustand. Wenn ein Lauf ohne Sitzungsüberschreibung
    einen Fallback verwenden darf, versucht OpenClaw zuerst den angeforderten Provider/das angeforderte Modell, dann
    die konfigurierten Fallbacks und anschließend das konfigurierte Primärmodell — identische reine
    Modell-IDs springen daher nie direkt zum Standard-Provider zurück.

    Siehe [Modelle](/de/concepts/models) und [Modell-Failover](/de/concepts/model-failover).

  </Accordion>

  <Accordion title="Kann ich GPT 5.5 für tägliche Aufgaben und Codex 5.5 zum Programmieren verwenden?">
    Ja — Modellauswahl und Laufzeitauswahl sind voneinander getrennt:

    - **Nativer Codex-Programmieragent:** Legen Sie `agents.defaults.model.primary` auf
      `openai/gpt-5.5` fest. Melden Sie sich mit `openclaw models auth login --provider
      openai` für die Authentifizierung per ChatGPT-/Codex-Abonnement an.
    - **Direkte OpenAI-API-Aufgaben außerhalb der Agentenschleife:** Konfigurieren Sie
      `OPENAI_API_KEY` für Bilder, Einbettungen, Sprache, Echtzeit und andere
      OpenAI-API-Oberflächen außerhalb des Agenten.
    - **OpenAI-Agentenauthentifizierung per API-Schlüssel:** `/model openai/gpt-5.5` mit einem geordneten
      `openai`-API-Schlüsselprofil.
    - **Unteragenten:** Leiten Sie Programmieraufgaben an einen Codex-orientierten Agenten mit einem
      eigenen Modell `openai/gpt-5.5` weiter.

    Siehe [Modelle](/de/concepts/models) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich den schnellen Modus für GPT 5.5?">
    - **Pro Sitzung:** Senden Sie `/fast on`, während Sie `openai/gpt-5.5` verwenden.
    - **Als Standard pro Modell:** Setzen Sie
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` auf `true`.
    - **Automatischer Grenzwert:** `/fast auto` oder `params.fastMode: "auto"` führt neue
      Modellaufrufe bis zum Grenzwert schnell aus und führt spätere Wiederholungs-, Fallback-,
      Tool-Ergebnis- oder Fortsetzungsaufrufe anschließend ohne schnellen Modus aus. Der Grenzwert beträgt standardmäßig
      60 Sekunden; überschreiben Sie ihn mit `params.fastAutoOnSeconds` für das Modell.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    Der schnelle Modus entspricht `service_tier = "priority"` bei nativen OpenAI-Responses-
    Anfragen; vorhandene `service_tier`-Werte bleiben erhalten und der schnelle Modus
    ändert weder `reasoning` noch `text.verbosity`. Sitzungsbezogene `/fast`-Überschreibungen haben
    Vorrang vor den Konfigurationsstandards.

    Siehe [Denken und schneller Modus](/de/tools/thinking) sowie den Abschnitt zum schnellen Modus
    unter „Erweiterte Konfiguration“ auf der Provider-Seite
    [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title='Warum sehe ich „Model ... is not allowed“ und erhalte danach keine Antwort?'>
    Wenn `agents.defaults.models` festgelegt ist, wird es zur **Positivliste** für
    `/model` und Sitzungsüberschreibungen. Wenn Sie ein Modell außerhalb dieser Liste auswählen, wird
    anstelle einer normalen Antwort Folgendes zurückgegeben:

    ```text
    Das Modell "provider/model" ist nicht zulässig. Verwenden Sie /models, um Provider aufzulisten, oder /models <provider>, um Modelle aufzulisten.
    Fügen Sie es wie folgt hinzu: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Lösung: Fügen Sie das genaue Modell zu `agents.defaults.models` hinzu, fügen Sie für dynamische Kataloge
    einen Provider-Platzhalter wie `"provider/*": {}` hinzu, entfernen Sie die
    Positivliste oder wählen Sie ein Modell aus `/model list`. Wenn der Befehl außerdem
    `--runtime codex` enthielt, aktualisieren Sie zunächst die Positivliste und wiederholen Sie dann
    denselben Befehl `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Warum sehe ich „Unknown model: minimax/MiniMax-M3“?'>
    Wenn Sie eine ältere OpenClaw-Version verwenden, aktualisieren Sie diese zuerst (oder führen Sie
    `main` aus dem Quellcode aus) und starten Sie den Gateway neu — `MiniMax-M3` ist möglicherweise noch nicht im
    Katalog Ihrer installierten Version enthalten. Andernfalls ist der MiniMax-Provider nicht
    konfiguriert (es wurde kein Provider-Eintrag oder Authentifizierungsprofil gefunden), sodass das Modell nicht
    aufgelöst werden kann. Die vollständige Prüfliste zur Fehlerbehebung,
    die Tabelle der Provider-/Modell-IDs und ein Beispiel für einen Konfigurationsblock finden Sie im Abschnitt zur Fehlerbehebung auf der
    Provider-Seite [MiniMax](/de/providers/minimax).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie MiniMax als Standard und wechseln Sie das Modell pro Sitzung — Fallbacks
    sind für Fehler vorgesehen, nicht für „schwierige Aufgaben“. Verwenden Sie daher `/model` oder einen separaten Agenten.

    **Option A: pro Sitzung wechseln**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Anschließend `/model gpt`.

    **Option B: separate Agenten** — Agent A verwendet standardmäßig MiniMax, Agent B
    standardmäßig OpenAI; leiten Sie nach Agent weiter oder verwenden Sie `/agent`, um zu wechseln.

    Dokumentation: [Modelle](/de/concepts/models), [Multi-Agent-Routing](/de/concepts/multi-agent),
    [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt integrierte Kurzbefehle?">
    Ja — integrierte Kurzformen, die nur angewendet werden, wenn das Zielmodell in
    `agents.defaults.models` vorhanden ist:

    | Alias | Wird aufgelöst zu |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Ihr eigener Alias mit demselben Namen überschreibt den integrierten Alias.

  </Accordion>

  <Accordion title="Wie definiere oder überschreibe ich Modellkurzbefehle (Aliasse)?">
    Aliasse werden unter `agents.defaults.models.<modelId>.alias` festgelegt:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    Anschließend wird `/model sonnet` (oder `/<alias>`, sofern unterstützt) zu dieser
    Modell-ID aufgelöst.

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
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Ein fehlender Provider-Schlüssel für einen referenzierten Provider bzw. ein referenziertes Modell löst zur Laufzeit
    einen Authentifizierungsfehler aus (z. B. `No API key found for provider "zai"`).

    **Nach dem Hinzufügen eines neuen Agenten wurde kein API-Schlüssel für den Provider gefunden**

    Ein neuer Agent besitzt einen leeren Authentifizierungsspeicher — die Authentifizierung erfolgt pro Agent und wird hier gespeichert:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Lösung: Führen Sie `openclaw agents add <id>` aus und konfigurieren Sie die Authentifizierung im Assistenten, oder
    kopieren Sie nur portable statische `api_key`-/`token`-Profile aus dem Speicher
    des Hauptagenten. Melden Sie sich bei OAuth über den neuen Agenten an, wenn dieser ein
    eigenes Konto benötigt. Unter [Multi-Agent-Routing](/de/concepts/multi-agent) finden Sie die
    vollständigen Regeln zur Wiederverwendung von `agentDir` und zur gemeinsamen Nutzung von Anmeldedaten — verwenden Sie
    `agentDir` niemals für mehrere Agenten.

  </Accordion>
</AccordionGroup>

## Modell-Failover und „All models failed“

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Zwei Stufen:

    1. **Rotation der Authentifizierungsprofile** innerhalb desselben Providers.
    2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

    Für fehlschlagende Profile gelten Cooldowns (exponentielles Backoff), sodass OpenClaw
    weiterhin antwortet, wenn ein Provider ratenbegrenzt ist oder vorübergehend ausfällt.

    Die Ratenbegrenzungskategorie umfasst mehr als nur `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungslimits (`weekly/monthly limit reached`) gelten alle als
    Ratenbegrenzungen, die ein Failover rechtfertigen.

    Abrechnungsantworten haben nicht immer den Status `402`, und einige `402`-Antworten verbleiben in der
    Kategorie für vorübergehende Fehler/Ratenbegrenzungen, statt der Abrechnungskategorie zugeordnet zu werden. Explizite
    Abrechnungshinweise bei `401`/`403` können weiterhin der Abrechnung zugeordnet werden; providerspezifische
    Textabgleiche (z. B. OpenRouter `Key limit exceeded`) bleiben auf ihren
    jeweiligen Provider beschränkt. Eine `402`-Antwort, die auf ein wiederholbares Nutzungslimit oder
    ein Ausgabenlimit für Organisation/Arbeitsbereich hindeutet (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), wird als `rate_limit` behandelt und führt nicht zu einer
    langfristigen Deaktivierung wegen der Abrechnung.

    Kontextüberlauf-Fehler bleiben vollständig außerhalb des Fallback-Pfads — Signaturen
    wie `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` oder `ollama error: context length exceeded` führen
    zu Compaction und einem erneuten Versuch, statt zum nächsten Modell-Fallback überzugehen.

    Allgemeiner Serverfehlertext wird enger ausgelegt als „alles, was unknown/error
    enthält“. Auf einen Provider beschränkte vorübergehende Fehlerformen, die als Failover-
    Signale gelten: das alleinstehende Anthropic `An unknown error occurred`, das alleinstehende OpenRouter
    `Provider returned error`, Fehler bei Beendigungsgründen wie `Unhandled stop reason:
    error`, JSON-`api_error`-Nutzlasten mit Text zu vorübergehenden Serverfehlern (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    und Fehler wegen ausgelasteter Provider wie `ModelNotReadyException`, wenn der Provider-
    Kontext übereinstimmt. Allgemeiner interner Fallback-Text wie `LLM request failed
    with an unknown error.` wird konservativ behandelt und löst für sich allein keinen Fallback
    aus.

  </Accordion>

  <Accordion title='Was bedeutet "No credentials found for profile anthropic:default"?'>
    Die Authentifizierungsprofil-ID `anthropic:default` enthält im
    erwarteten Authentifizierungsspeicher keine Anmeldedaten.

    **Checkliste zur Behebung:**

    - Prüfen Sie, wo die Profile gespeichert sind — aktuell:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; veraltet:
      `~/.openclaw/agent/*` (durch `openclaw doctor` migriert).
    - Prüfen Sie, ob der Gateway Ihre Umgebungsvariable lädt. Wenn `ANTHROPIC_API_KEY` nur in
      Ihrer Shell gesetzt ist, erreicht die Variable einen über systemd/launchd ausgeführten Gateway nicht — tragen Sie sie in
      `~/.openclaw/.env` ein oder aktivieren Sie `env.shellEnv`.
    - Prüfen Sie, ob Sie den richtigen Agenten bearbeiten — Multi-Agent-Konfigurationen verfügen über
      mehrere `auth-profiles.json`-Dateien.
    - Führen Sie `openclaw models status` aus, um konfigurierte Modelle und den
      Authentifizierungsstatus des Providers anzuzeigen.

    **Für „No credentials found for profile anthropic“ (ohne E-Mail-Suffix):**

    Der Lauf ist an ein Anthropic-Profil gebunden, das der Gateway nicht finden kann.

    - Verwenden Sie die Claude CLI: Führen Sie `openclaw models auth login --provider anthropic
      --method cli --set-default` auf dem Gateway-Host aus.
    - Verwenden Sie stattdessen vorzugsweise einen API-Schlüssel: Tragen Sie `ANTHROPIC_API_KEY` auf dem Gateway-Host in
      `~/.openclaw/.env` ein und löschen Sie anschließend jede festgelegte Reihenfolge,
      die das fehlende Profil erzwingt:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Remote-Modus: Authentifizierungsprofile befinden sich auf dem Gateway-Rechner, nicht auf Ihrem
      Laptop — stellen Sie sicher, dass Sie die Befehle dort ausführen.

  </Accordion>

  <Accordion title="Warum wurde auch Google Gemini ausprobiert und ist fehlgeschlagen?">
    Wenn Ihre Modellkonfiguration Google Gemini als Fallback enthält (oder Sie
    zu einer Gemini-Kurzform gewechselt haben), versucht OpenClaw während des Fallbacks, dieses Modell zu verwenden. Wenn keine
    Google-Anmeldedaten konfiguriert sind, wird `No API key found for provider
    "google"` ausgegeben. Lösung: Fügen Sie eine Google-Authentifizierung hinzu oder entfernen Sie Google-Modelle aus
    `agents.defaults.model.fallbacks` bzw. den Aliasen.

    **LLM-Anfrage abgelehnt: Thinking-Signatur erforderlich (Google Antigravity)**

    Ursache: Der Sitzungsverlauf enthält Thinking-Blöcke ohne Signaturen (häufig
    aufgrund eines abgebrochenen/unvollständigen Streams); Google Antigravity verlangt Signaturen
    für Thinking-Blöcke. OpenClaw entfernt unsignierte Thinking-Blöcke für Google
    Antigravity Claude; falls der Fehler weiterhin auftritt, starten Sie eine neue Sitzung oder legen Sie
    für diesen Agenten `/thinking off` fest.

  </Accordion>
</AccordionGroup>

## Authentifizierungsprofile: Was sie sind und wie sie verwaltet werden

Verwandt: [/concepts/oauth](/de/concepts/oauth) (OAuth-Abläufe, Token-Speicherung, Muster für mehrere Konten)

<AccordionGroup>
  <Accordion title="Was ist ein Authentifizierungsprofil?">
    Ein benannter, einem Provider zugeordneter Anmeldedatensatz (OAuth oder API-Schlüssel), der
    hier gespeichert wird:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Prüfen Sie gespeicherte Profile, ohne Geheimnisse auszugeben: `openclaw models auth
    list` (optional mit `--provider <id>` oder `--json`). Siehe
    [Modelle-CLI](/de/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Welche Profil-IDs sind üblich?">
    Mit Provider-Präfix: `anthropic:default` (üblich, wenn keine E-Mail-Identität
    vorhanden ist), `anthropic:<email>` für OAuth-Identitäten oder eine benutzerdefinierte ID Ihrer
    Wahl (z. B. `anthropic:work`).

  </Accordion>

  <Accordion title="Kann ich steuern, welches Authentifizierungsprofil zuerst ausprobiert wird?">
    Ja. Die Konfiguration `auth.order.<provider>` legt die Rotationsreihenfolge pro Provider fest
    (nur Metadaten — es werden keine Geheimnisse gespeichert).

    OpenClaw kann ein Profil während eines kurzen **Cooldowns** (Ratenbegrenzungen,
    Zeitüberschreitungen, Authentifizierungsfehler) oder eines längeren **deaktivierten** Zustands
    (Abrechnung/unzureichendes Guthaben) überspringen. Prüfen Sie dies mit `openclaw models status
    --json` und kontrollieren Sie `auth.unusableProfiles`. Passen Sie das Verhalten mit
    `auth.cooldowns.billingBackoffHours*` an. Cooldowns wegen Ratenbegrenzungen können
    modellspezifisch sein — ein Profil, das sich für ein Modell im Cooldown befindet, kann weiterhin ein
    anderes Modell desselben Providers bedienen; Abrechnungs-/Deaktivierungszeiträume sperren das
    gesamte Profil.

    Legen Sie eine agentspezifische Reihenfolgeüberschreibung fest (gespeichert in der `auth-state.json` dieses Agenten):

    ```bash
    # Verwendet standardmäßig den konfigurierten Standardagenten (--agent weglassen)
    openclaw models auth order get --provider anthropic

    # Rotation auf ein einzelnes Profil beschränken
    openclaw models auth order set --provider anthropic anthropic:default

    # Oder eine explizite Reihenfolge festlegen (Fallback innerhalb des Providers)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Überschreibung löschen (auf auth.order aus der Konfiguration/Round-Robin zurückfallen)
    openclaw models auth order clear --provider anthropic

    # Einen bestimmten Agenten ansprechen
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Prüfen Sie mit `openclaw models status --probe`, was tatsächlich ausprobiert wird. Ein
    gespeichertes Profil, das in einer expliziten Reihenfolge fehlt, meldet
    `excluded_by_auth_order`, statt stillschweigend ausprobiert zu werden.

  </Accordion>

  <Accordion title="OAuth oder API-Schlüssel – was ist der Unterschied?">
    - **OAuth-/CLI-Anmeldung** verwendet häufig einen Abonnementzugang, sofern der
      Provider dies unterstützt. Bei Anthropic verwendet das Claude-CLI-Backend von OpenClaw
      Claude Code `claude -p`, was Anthropic derzeit als
      Agent-SDK-/programmatische Nutzung behandelt, die auf die Nutzungslimits des Abonnements angerechnet wird —
      den aktuellen Status der Abrechnungspause und Quellenlinks finden Sie unter [Anthropic](/de/providers/anthropic).
    - **API-Schlüssel** verwenden eine tokenbasierte Abrechnung.

    Der Assistent unterstützt Anthropic Claude CLI, OpenAI Codex OAuth und API-
    Schlüssel.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Häufig gestellte Fragen](/de/help/faq) — die zentralen häufig gestellten Fragen
- [Häufig gestellte Fragen — Schnellstart und Einrichtung beim ersten Start](/de/help/faq-first-run)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
