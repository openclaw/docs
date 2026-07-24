---
read_when:
    - Modelle auswählen oder wechseln, Aliasse konfigurieren
    - Fehlerbehebung beim Modell-Failover / „Alle Modelle sind fehlgeschlagen“
    - Authentifizierungsprofile verstehen und verwalten
sidebarTitle: Models FAQ
summary: 'FAQ: Modellvorgaben, Auswahl, Aliasse, Wechsel, Failover und Authentifizierungsprofile'
title: 'FAQ: Modelle und Authentifizierung'
x-i18n:
    generated_at: "2026-07-24T05:00:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 73272916f3db17d101c777639c5a5153bfbcfa887929a5726f3c94c3cb29aaf9
    source_path: help/faq-models.md
    workflow: 16
---

Fragen und Antworten zu Modellen und Auth-Profilen. Informationen zu Einrichtung, Sitzungen, Gateway, Kanälen und
Fehlerbehebung finden Sie in den zentralen [FAQ](/de/help/faq).

## Modelle: Standardwerte, Auswahl, Aliasse, Wechsel

<AccordionGroup>
  <Accordion title='Was ist das „Standardmodell“?'>
    Festgelegt mit:

    ```text
    agents.defaults.model.primary
    ```

    Modelle sind `provider/model`-Referenzen (Beispiel: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Legen Sie `provider/model` immer explizit fest. Wenn
    Sie den Provider weglassen, versucht OpenClaw zuerst, einen Alias zuzuordnen,
    dann eine eindeutige Übereinstimmung mit einem konfigurierten Provider für
    diese Modell-ID, und greift anschließend auf den konfigurierten
    Standard-Provider zurück (veralteter Kompatibilitätspfad). Wenn dieser
    Provider das konfigurierte Standardmodell nicht mehr hat, greift OpenClaw
    statt auf einen veralteten Standardwert auf das erste konfigurierte
    Provider-/Modellpaar zurück.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    Verwenden Sie das leistungsstärkste Modell der neuesten Generation, das Ihr
    Provider-Stack anbietet, insbesondere für Agents mit Werkzeugzugriff oder
    nicht vertrauenswürdigen Eingaben — schwächere oder übermäßig quantisierte
    Modelle sind anfälliger für Prompt-Injection und unsicheres Verhalten
    (siehe [Sicherheit](/de/gateway/security)). Weisen Sie günstigere Modelle anhand
    der Agent-Rolle routinemäßigen Chats mit geringem Risiko zu.

    Weisen Sie Modelle pro Agent zu und verwenden Sie Sub-Agents, um lange
    Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht eigene Tokens).
    Siehe [Modelle](/de/concepts/models), [Sub-Agents](/de/tools/subagents),
    [MiniMax](/de/providers/minimax) und
    [Lokale Modelle](/de/gateway/local-models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Ändern Sie nur die Modellfelder — vermeiden Sie das vollständige Ersetzen
    der Konfiguration.

    - `/model` im Chat (pro Sitzung, siehe [Slash-Befehle](/de/tools/slash-commands))
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - `agents.defaults.model` direkt in `~/.openclaw/openclaw.json` bearbeiten

    Prüfen Sie bei RPC-Änderungen zunächst mit `config.schema.lookup`
    (normalisierter Pfad, oberflächliche Schemadokumentation,
    Zusammenfassungen untergeordneter Elemente) und verwenden Sie dann
    vorzugsweise `config.patch` statt `config.apply` mit einem
    partiellen Objekt. Falls Sie die Konfiguration überschrieben haben,
    stellen Sie sie aus einer Sicherung wieder her oder führen Sie zur
    Reparatur `openclaw doctor` aus.

    Dokumentation: [Modelle](/de/concepts/models), [Konfigurieren](/de/cli/configure),
    [Konfiguration](/de/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja — Ollama ist der einfachste Weg. Schnelle Einrichtung:

    1. Installieren Sie Ollama von `https://ollama.com/download`
    2. Laden Sie ein lokales Modell herunter, z. B. `ollama pull gemma4`
    3. Führen Sie auch für Cloud-Modelle `ollama signin` aus
    4. Führen Sie `openclaw onboard` aus, wählen Sie `Ollama` und anschließend `Local` oder `Cloud + Local`

    `Cloud + Local` stellt Ihnen Cloud-Modelle sowie Ihre lokalen
    Ollama-Modelle bereit; Cloud-Modelle wie `kimi-k2.5:cloud` müssen nicht
    lokal heruntergeladen werden. Zum manuellen Wechseln: `openclaw models list`,
    dann `openclaw models set ollama/<model>`.

    Kleinere/stark quantisierte Modelle sind anfälliger für Prompt-Injection.
    Verwenden Sie große Modelle für jeden Bot mit Werkzeugzugriff. Wenn Sie
    dennoch kleine Modelle verwenden, aktivieren Sie Sandboxing und strikte
    Werkzeug-Zulassungslisten.

    Dokumentation: [Ollama](/de/providers/ollama), [Lokale Modelle](/de/gateway/local-models),
    [Modell-Provider](/de/concepts/model-providers), [Sicherheit](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle spontan (ohne Neustart)?">
    Senden Sie `/model <name>` als eigenständige Nachricht. Unter
    [Slash-Befehle](/de/tools/slash-commands) finden Sie die vollständige
    Befehlsliste, einschließlich der nummerierten Auswahl (`/model`,
    `/model
    list`, `/model 3`), `/model default` zum Löschen
    einer Sitzungsüberschreibung und `/model status` für Details zum
    Endpunkt/API-Modus.

    Erzwingen Sie mit `@profile` ein bestimmtes Auth-Profil pro Sitzung:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Um die Bindung eines mit `@profile` festgelegten Profils
    aufzuheben, führen Sie `/model` erneut ohne das Suffix aus
    (z. B. `/model anthropic/claude-opus-4-6`) oder wählen Sie den Standardwert aus
    `/model`. Verwenden Sie `/model status`, um das aktive
    Auth-Profil zu bestätigen.

  </Accordion>

  <Accordion title="Wenn zwei Provider dieselbe Modell-ID bereitstellen, welchen verwendet /model?">
    `/model provider/model` wählt exakt diese Provider-Route. Beispielsweise sind
    `qianfan/deepseek-v4-flash` und `deepseek/deepseek-v4-flash` unterschiedliche Referenzen,
    obwohl die Modell-ID übereinstimmt — OpenClaw wechselt bei einer
    Übereinstimmung der bloßen ID nicht stillschweigend den Provider.

    Eine vom Benutzer ausgewählte `/model`-Referenz ist hinsichtlich
    des Fallbacks strikt: Wenn dieses Provider-/Modellpaar nicht mehr verfügbar
    ist, schlägt die Antwort sichtbar fehl, statt auf `agents.defaults.model.fallbacks`
    zurückzugreifen. Konfigurierte Fallback-Ketten gelten weiterhin für
    konfigurierte Standardwerte, primäre Modelle von Cron-Aufträgen und
    automatisch ausgewählte Fallback-Zustände. Wenn ein Lauf ohne
    Sitzungsüberschreibung einen Fallback verwenden darf, versucht OpenClaw
    zuerst das angeforderte Provider-/Modellpaar, dann konfigurierte Fallbacks
    und schließlich das konfigurierte primäre Modell — identische bloße
    Modell-IDs springen daher nie direkt zum Standard-Provider zurück.

    Siehe [Modelle](/de/concepts/models) und [Modell-Failover](/de/concepts/model-failover).

  </Accordion>

  <Accordion title="Kann ich GPT 5.5 für tägliche Aufgaben und Codex 5.5 zum Programmieren verwenden?">
    Ja — die Auswahl des Modells und der Laufzeit sind voneinander unabhängig:

    - **Nativer Codex-Programmier-Agent:** Legen Sie `agents.defaults.model.primary` auf
      `openai/gpt-5.5` fest. Melden Sie sich mit `openclaw models auth login --provider
      openai` für die Authentifizierung über ein ChatGPT-/Codex-Abonnement an.
    - **Direkte OpenAI-API-Aufgaben außerhalb der Agent-Schleife:** Konfigurieren Sie
      `OPENAI_API_KEY` für Bilder, Embeddings, Sprache, Echtzeit und andere
      OpenAI-API-Oberflächen außerhalb von Agents.
    - **OpenAI-Agent-Authentifizierung per API-Schlüssel:** `/model openai/gpt-5.5` mit einem geordneten
      `openai`-API-Schlüsselprofil.
    - **Sub-Agents:** Weisen Sie Programmieraufgaben einem Codex-orientierten Agent mit eigenem
      `openai/gpt-5.5`-Modell zu.

    Siehe [Modelle](/de/concepts/models) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich den schnellen Modus für GPT 5.5?">
    - **Pro Sitzung:** Senden Sie `/fast on`, während Sie `openai/gpt-5.5` verwenden.
    - **Als Standardwert pro Modell:** Legen Sie
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` auf `true` fest.
    - **Automatischer Grenzwert:** `/fast auto` oder `params.fastMode: "auto"` führt neue
      Modellaufrufe bis zum Grenzwert schnell aus; spätere Wiederholungs-,
      Fallback-, Werkzeugergebnis- oder Fortsetzungsaufrufe werden danach ohne
      schnellen Modus ausgeführt. Der Grenzwert beträgt standardmäßig
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

    Der schnelle Modus wird bei nativen OpenAI-Responses-Anfragen auf
    `service_tier = "priority"` abgebildet; vorhandene `service_tier`-Werte bleiben
    erhalten, und der schnelle Modus ändert `reasoning` oder
    `text.verbosity` nicht. Sitzungsbezogene `/fast`-Überschreibungen
    haben Vorrang vor Konfigurationsstandardwerten.

    Siehe [Denken und schneller Modus](/de/tools/thinking) sowie den Abschnitt
    „Schneller Modus“ unter „Erweiterte Konfiguration“ auf der
    [OpenAI](/de/providers/openai)-Providerseite.

  </Accordion>

  <Accordion title='Warum sehe ich „Model ... is not allowed“ und erhalte anschließend keine Antwort?'>
    Wenn `agents.defaults.modelPolicy.allow` nicht leer ist, wird es zur
    **Zulassungsliste** für `/model`, Sitzungsüberschreibungen und
    `--model`. Bei Auswahl eines Modells außerhalb dieser Liste wird
    statt einer normalen Antwort Folgendes zurückgegeben:

    ```text
    Die Modellüberschreibung "provider/model" ist durch agents.defaults.modelPolicy.allow nicht zulässig.
    ```

    Lösung: Fügen Sie das exakte Modell oder einen Provider-Platzhalter wie
    `"provider/*"` zur genannten `modelPolicy.allow`-Liste hinzu, entfernen
    oder leeren Sie diese Liste oder wählen Sie ein Modell aus
    `/model list`. Falls der Befehl außerdem `--runtime codex` enthielt,
    aktualisieren Sie zuerst die Zulassungsliste und wiederholen Sie dann
    denselben `/model provider/model --runtime codex`-Befehl.

  </Accordion>

  <Accordion title='Warum sehe ich „Unknown model: minimax/MiniMax-M3“?'>
    Wenn Sie eine ältere OpenClaw-Version verwenden, aktualisieren Sie diese
    zuerst (oder führen Sie mit `main` aus dem Quellcode aus) und
    starten Sie das Gateway neu — `MiniMax-M3` ist möglicherweise noch
    nicht im Katalog Ihrer installierten Version enthalten. Andernfalls ist
    der MiniMax-Provider nicht konfiguriert (kein Provider-Eintrag oder
    Auth-Profil gefunden), sodass das Modell nicht aufgelöst werden kann.
    Eine vollständige Checkliste zur Behebung, eine Tabelle der
    Provider-/Modell-IDs und ein Beispiel für einen Konfigurationsblock finden
    Sie im Abschnitt „Fehlerbehebung“ auf der [MiniMax](/de/providers/minimax)-Providerseite.

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie MiniMax als Standard und wechseln Sie Modelle pro Sitzung
    — Fallbacks sind für Fehler vorgesehen, nicht für „schwierige Aufgaben“.
    Verwenden Sie daher `/model` oder einen separaten Agent.

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

    **Option B: separate Agents** — Agent A verwendet standardmäßig MiniMax,
    Agent B standardmäßig OpenAI; wählen Sie anhand des Agents aus oder
    verwenden Sie zum Wechseln `/agent`.

    Dokumentation: [Modelle](/de/concepts/models), [Multi-Agent-Routing](/de/concepts/multi-agent),
    [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt integrierte Kurzformen?">
    Ja — integrierte Kurzformen, die nur angewendet werden, wenn das Zielmodell
    in `agents.defaults.models` vorhanden ist:

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

  <Accordion title="Wie definiere/überschreibe ich Modellkurzformen (Aliasse)?">
    Aliasse befinden sich unter `agents.defaults.models.<modelId>.alias`:

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

    Anschließend wird `/model sonnet` (oder `/<alias>`, sofern
    unterstützt) zu dieser Modell-ID aufgelöst.

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

    Ein fehlender Provider-Schlüssel für ein referenziertes
    Provider-/Modellpaar löst zur Laufzeit einen Authentifizierungsfehler aus
    (z. B. `No API key found for provider "zai"`).

    **Nach dem Hinzufügen eines neuen Agents wurde kein API-Schlüssel für den Provider gefunden**

    Ein neuer Agent hat einen leeren Authentifizierungsspeicher — die
    Authentifizierung wird pro Agent unter folgendem Pfad gespeichert:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Fehlerbehebung: Führen Sie `openclaw agents add <id>` aus und konfigurieren Sie die Authentifizierung im Assistenten, oder
    kopieren Sie nur portable statische `api_key`/`token`-Profile aus dem Speicher
    des Hauptagenten. Melden Sie sich bei OAuth über den neuen Agenten an, wenn dieser ein
    eigenes Konto benötigt. Die vollständigen Regeln zur Wiederverwendung von
    `agentDir` und zur gemeinsamen Nutzung von Anmeldedaten finden Sie unter [Multi-Agent-Routing](/de/concepts/multi-agent) — verwenden Sie
    `agentDir` niemals agentenübergreifend wieder.

  </Accordion>
</AccordionGroup>

## Modell-Failover und „Alle Modelle fehlgeschlagen“

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Zwei Phasen:

    1. **Rotation der Authentifizierungsprofile** innerhalb desselben Providers.
    2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

    Für fehlschlagende Profile gelten Cooldowns (exponentielles Backoff), sodass OpenClaw
    weiterhin antwortet, wenn ein Provider einer Ratenbegrenzung unterliegt oder vorübergehend ausfällt.

    Der Ratenbegrenzungs-Bucket umfasst mehr als nur `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungslimits (`weekly/monthly limit reached`) gelten alle als
    Ratenbegrenzungen, die einen Failover rechtfertigen.

    Abrechnungsantworten sind nicht immer `402`, und einige `402`s verbleiben im
    transienten/Ratenbegrenzungs-Bucket, anstatt dem Abrechnungspfad zugeordnet zu werden. Expliziter
    Abrechnungstext bei `401`/`403` kann weiterhin zur Abrechnung weiterleiten; providerspezifische
    Textabgleicher (z. B. OpenRouter `Key limit exceeded`) bleiben auf ihren
    jeweiligen Provider beschränkt. Ein `402`, der wie ein wiederholbares Nutzungslimit oder
    Ausgabenlimit einer Organisation/eines Arbeitsbereichs formuliert ist (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), wird als `rate_limit` behandelt, nicht als
    langfristige Deaktivierung wegen der Abrechnung.

    Kontextüberlauf-Fehler bleiben vollständig außerhalb des Fallback-Pfads — Signaturen
    wie `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` oder `ollama error: context length exceeded` führen zu
    Compaction und einem erneuten Versuch, statt den Modell-Fallback fortzusetzen.

    Generischer Serverfehlertext ist enger gefasst als „alles, was unknown/error
    enthält“. Providergebundene transiente Formen, die als Failover-
    Signale gelten: Anthropic ohne weiteren Kontext `An unknown error occurred`, OpenRouter ohne weiteren Kontext
    `Provider returned error`, Stop-Grund-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payloads mit transientem Servertext (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    und Fehler wegen eines ausgelasteten Providers wie `ModelNotReadyException`, wenn der Provider-
    Kontext übereinstimmt. Generischer interner Fallback-Text wie `LLM request failed
    with an unknown error.` wird konservativ behandelt und löst
    allein keinen Fallback aus.

  </Accordion>

  <Accordion title='Was bedeutet „No credentials found for profile anthropic:default“?'>
    Für die Authentifizierungsprofil-ID `anthropic:default` sind im
    erwarteten Authentifizierungsspeicher keine Anmeldedaten vorhanden.

    **Checkliste zur Fehlerbehebung:**

    - Prüfen Sie, wo sich die Profile befinden — aktuell:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; veraltet:
      `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).
    - Prüfen Sie, ob der Gateway Ihre Umgebungsvariable lädt. `ANTHROPIC_API_KEY`, das nur in
      Ihrer Shell gesetzt ist, erreicht einen über systemd/launchd ausgeführten Gateway nicht — tragen Sie es in
      `~/.openclaw/.env` ein oder aktivieren Sie `env.shellEnv`.
    - Prüfen Sie, ob Sie den richtigen Agenten bearbeiten — Multi-Agent-Konfigurationen besitzen
      mehrere `auth-profiles.json`-Dateien.
    - Führen Sie `openclaw models status` aus, um konfigurierte Modelle und den
      Authentifizierungsstatus des Providers anzuzeigen.

    **Für „No credentials found for profile anthropic“ (ohne E-Mail-Suffix):**

    Der Lauf ist an ein Anthropic-Profil gebunden, das der Gateway nicht finden kann.

    - Verwenden Sie die Claude CLI: Führen Sie `openclaw models auth login --provider anthropic
      --method cli --set-default` auf dem Gateway-Host aus.
    - Wenn Sie stattdessen einen API-Schlüssel bevorzugen: Tragen Sie `ANTHROPIC_API_KEY` auf dem Gateway-Host in
      `~/.openclaw/.env` ein und löschen Sie anschließend jede festgelegte Reihenfolge,
      die das fehlende Profil erzwingt:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Remote-Modus: Authentifizierungsprofile befinden sich auf dem Gateway-Rechner, nicht auf Ihrem
      Laptop — prüfen Sie, ob Sie die Befehle dort ausführen.

  </Accordion>

  <Accordion title="Warum wurde auch Google Gemini ausprobiert und ist fehlgeschlagen?">
    Wenn Ihre Modellkonfiguration Google Gemini als Fallback enthält (oder Sie
    zu einer Gemini-Kurzform gewechselt haben), versucht OpenClaw es während des Fallbacks. Sind keine
    Google-Anmeldedaten konfiguriert, ergibt sich `No API key found for provider
    "google"`. Fehlerbehebung: Fügen Sie eine Google-Authentifizierung hinzu oder entfernen Sie Google-Modelle aus
    `agents.defaults.model.fallbacks`/Aliasen.

    **LLM-Anfrage abgelehnt: Thinking-Signatur erforderlich (Google Antigravity)**

    Ursache: Der Sitzungsverlauf enthält Thinking-Blöcke ohne Signaturen (häufig
    aufgrund eines abgebrochenen/unvollständigen Streams); Google Antigravity verlangt Signaturen
    für Thinking-Blöcke. OpenClaw entfernt nicht signierte Thinking-Blöcke für Google
    Antigravity Claude. Falls der Fehler weiterhin auftritt, starten Sie eine neue Sitzung oder setzen Sie
    `/thinking off` für diesen Agenten.

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
    list` (optional `--provider <id>` oder `--json`). Siehe
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
    --json` und kontrollieren Sie `auth.unusableProfiles`. Cooldowns aufgrund von Ratenbegrenzungen können
    modellspezifisch sein — ein Profil, das für ein Modell einen Cooldown hat, kann weiterhin ein
    verwandtes Modell desselben Providers bedienen; Abrechnungs-/Deaktivierungszeiträume sperren das
    gesamte Profil.

    Legen Sie eine agentenspezifische Reihenfolgeüberschreibung fest (gespeichert in `auth-state.json` dieses Agenten):

    ```bash
    # Verwendet standardmäßig den konfigurierten Standardagenten (--agent weglassen)
    openclaw models auth order get --provider anthropic

    # Rotation auf ein einzelnes Profil beschränken
    openclaw models auth order set --provider anthropic anthropic:default

    # Oder eine explizite Reihenfolge festlegen (Fallback innerhalb des Providers)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Überschreibung löschen (auf config auth.order / Round-Robin zurückfallen)
    openclaw models auth order clear --provider anthropic

    # Einen bestimmten Agenten ansprechen
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Prüfen Sie, was tatsächlich ausprobiert wird: `openclaw models status --probe`. Ein
    gespeichertes Profil, das in einer expliziten Reihenfolge fehlt, meldet
    `excluded_by_auth_order`, statt stillschweigend ausprobiert zu werden.

  </Accordion>

  <Accordion title="OAuth oder API-Schlüssel – worin besteht der Unterschied?">
    - **OAuth-/CLI-Anmeldung** verwendet häufig Abonnementzugriff, sofern der
      Provider diesen unterstützt. Für Anthropic verwendet das Claude-CLI-Backend von OpenClaw
      Claude Code `claude -p`, das Anthropic derzeit als
      Agent-SDK-/programmatische Nutzung behandelt, die auf die Nutzungslimits des Abonnements angerechnet wird —
      den aktuellen Status der Abrechnungspause und Quellenlinks finden Sie unter [Anthropic](/de/providers/anthropic).
    - **API-Schlüssel** verwenden eine tokenbasierte Abrechnung.

    Der Assistent unterstützt Anthropic Claude CLI, OpenAI Codex OAuth und API-
    Schlüssel.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [FAQ](/de/help/faq) — die Haupt-FAQ
- [FAQ — Schnellstart und Ersteinrichtung](/de/help/faq-first-run)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
