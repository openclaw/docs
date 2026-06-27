---
read_when:
    - Sie möchten GitHub Copilot als Modell-Provider verwenden
    - Sie benötigen den `openclaw models auth login-github-copilot`-Ablauf
    - Sie wählen zwischen dem integrierten Copilot-Provider, dem Copilot SDK-Harness und Copilot Proxy.
summary: Melden Sie sich in OpenClaw über den Gerätefluss oder den nicht interaktiven Token-Import bei GitHub Copilot an
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:04:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot ist der KI-Coding-Assistent von GitHub. Er bietet Zugriff auf Copilot-Modelle für Ihr GitHub-Konto und Ihren Plan. OpenClaw kann Copilot auf drei verschiedene Arten als Modell-Provider oder Agent-Runtime verwenden.

## Drei Möglichkeiten, Copilot in OpenClaw zu verwenden

<Tabs>
  <Tab title="Integrierter Provider (github-copilot)">
    Verwenden Sie den nativen Device-Login-Ablauf, um ein GitHub-Token zu erhalten, und tauschen Sie es dann gegen Copilot-API-Token aus, wenn OpenClaw ausgeführt wird. Dies ist der **standardmäßige** und einfachste Weg, da er VS Code nicht erfordert.

    <Steps>
      <Step title="Anmeldebefehl ausführen">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sie werden aufgefordert, eine URL aufzurufen und einen Einmalcode einzugeben. Lassen Sie das Terminal geöffnet, bis der Vorgang abgeschlossen ist.
      </Step>
      <Step title="Standardmodell festlegen">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Oder in der Konfiguration:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot-SDK-Harness-Plugin (copilot)">
    Installieren Sie das externe `@openclaw/copilot`-Plugin, wenn GitHubs Copilot-CLI und SDK den Low-Level-Agent-Loop für ausgewählte `github-copilot/*`-Modelle übernehmen sollen.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Binden Sie anschließend ein Modell oder einen Provider in die Runtime ein:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Wählen Sie dies, wenn Sie native Copilot-CLI-Sitzungen, SDK-verwalteten Thread-Status und Copilot-eigene Compaction für diese Agent-Turns wünschen. Siehe [Copilot-SDK-Harness](/de/plugins/copilot) für den vollständigen Runtime-Vertrag.

  </Tab>

  <Tab title="Copilot-Proxy-Plugin (copilot-proxy)">
    Verwenden Sie die VS-Code-Erweiterung **Copilot Proxy** als lokale Bridge. OpenClaw kommuniziert mit dem `/v1`-Endpunkt des Proxys und verwendet die dort konfigurierte Modellliste.

    <Note>
    Wählen Sie dies, wenn Sie Copilot Proxy bereits in VS Code ausführen oder darüber routen müssen. Sie müssen das Plugin aktivieren und die VS-Code-Erweiterung weiter ausführen.
    </Note>

  </Tab>
</Tabs>

## Optionale Flags

| Flag            | Beschreibung                                        |
| --------------- | --------------------------------------------------- |
| `--yes`         | Bestätigungsabfrage überspringen                    |
| `--set-default` | Auch das vom Provider empfohlene Standardmodell anwenden |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Nicht interaktives Onboarding

Wenn Sie bereits ein GitHub-OAuth-Zugriffstoken für Copilot haben, importieren Sie es während der Headless-Einrichtung mit `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Sie können `--auth-choice` auch weglassen; durch Übergabe von `--github-copilot-token` wird die Authentifizierungsauswahl für den GitHub-Copilot-Provider abgeleitet. Wenn das Flag weggelassen wird, fällt das Onboarding auf `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` und dann `GITHUB_TOKEN` zurück. Verwenden Sie `--secret-input-mode ref` mit gesetztem `COPILOT_GITHUB_TOKEN`, um statt Klartext in `auth-profiles.json` eine env-gestützte `tokenRef` zu speichern.

<AccordionGroup>
  <Accordion title="Interaktives TTY erforderlich">
    Der Device-Login-Ablauf erfordert ein interaktives TTY. Führen Sie ihn direkt in einem Terminal aus, nicht in einem nicht interaktiven Skript oder einer CI-Pipeline.
  </Accordion>

  <Accordion title="Modellverfügbarkeit hängt von Ihrem Plan ab">
    Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem GitHub-Plan ab. Wenn ein Modell abgelehnt wird, versuchen Sie eine andere ID (zum Beispiel `github-copilot/gpt-5.5`). Siehe GitHubs [unterstützte Modelle pro Copilot-Plan](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan) für die aktuelle Modellliste.
  </Accordion>

  <Accordion title="Live-Katalogaktualisierung aus der Copilot-API">
    Sobald der Authentifizierungspfad per Device-Login (oder Env-Var) ein GitHub-Token aufgelöst hat, aktualisiert OpenClaw den Modellkatalog bei Bedarf von `${baseUrl}/models` (demselben Endpunkt, den VS Code Copilot verwendet), sodass die Runtime kontospezifische Berechtigungen und genaue Kontextfenster ohne Manifest-Änderungen verfolgt. Neu veröffentlichte Copilot-Modelle werden ohne OpenClaw-Upgrade sichtbar, und Kontextfenster spiegeln die realen modellbezogenen Limits wider (z. B. 400k für die gpt-5.x-Serie, 1M für die internen `claude-opus-*-1m`-Varianten).

    Der gebündelte statische Katalog bleibt der sichtbare Fallback, wenn Discovery deaktiviert ist, der Benutzer kein GitHub-Auth-Profil hat, der Token-Austausch fehlschlägt oder der HTTPS-Aufruf von `/models` einen Fehler ausgibt. Um dies abzuwählen und vollständig auf den statischen Manifest-Katalog zu setzen (Offline-/Air-Gapped-Szenarien):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Transportauswahl">
    Claude-Modell-IDs verwenden automatisch den Anthropic-Messages-Transport. GPT-, o-series- und Gemini-Modelle behalten den OpenAI-Responses-Transport. OpenClaw wählt den richtigen Transport anhand der Modellreferenz aus.
  </Accordion>

  <Accordion title="Request-Kompatibilität">
    OpenClaw sendet Copilot-IDE-artige Request-Header auf Copilot-Transporten, einschließlich integrierter Compaction sowie Tool-Ergebnis- und Bild-Follow-up-Turns. Es aktiviert keine Provider-seitige Responses-Fortsetzung für Copilot, es sei denn, dieses Verhalten wurde gegen Copilots API verifiziert.
  </Accordion>

  <Accordion title="Auflösungsreihenfolge für Umgebungsvariablen">
    OpenClaw löst Copilot-Authentifizierung aus Umgebungsvariablen in der folgenden Prioritätsreihenfolge auf:

    | Priorität | Variable              | Hinweise                         |
    | --------- | --------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Höchste Priorität, Copilot-spezifisch |
    | 2         | `GH_TOKEN`            | GitHub-CLI-Token (Fallback)      |
    | 3         | `GITHUB_TOKEN`        | Standard-GitHub-Token (niedrigste Priorität) |

    Wenn mehrere Variablen gesetzt sind, verwendet OpenClaw diejenige mit der höchsten Priorität. Der Device-Login-Ablauf (`openclaw models auth login-github-copilot`) speichert sein Token im Auth-Profil-Speicher und hat Vorrang vor allen Umgebungsvariablen.

  </Accordion>

  <Accordion title="Token-Speicherung">
    Die Anmeldung speichert ein GitHub-Token im Auth-Profil-Speicher und tauscht es gegen ein Copilot-API-Token aus, wenn OpenClaw ausgeführt wird. Sie müssen das Token nicht manuell verwalten.
  </Accordion>
</AccordionGroup>

<Warning>
Der Device-Login-Befehl erfordert ein interaktives TTY. Verwenden Sie nicht interaktives Onboarding, wenn Sie eine Headless-Einrichtung benötigen.
</Warning>

## Memory-Search-Embeddings

GitHub Copilot kann auch als Embedding-Provider für [Memory Search](/de/concepts/memory-search) dienen. Wenn Sie ein Copilot-Abonnement haben und angemeldet sind, kann OpenClaw es ohne separaten API-Schlüssel für Embeddings verwenden.

### Konfiguration

Setzen Sie `memorySearch.provider` explizit, um GitHub-Copilot-Embeddings zu verwenden. Wenn ein GitHub-Token verfügbar ist, ermittelt OpenClaw verfügbare Embedding-Modelle aus der Copilot-API und wählt automatisch das beste aus.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Funktionsweise

1. OpenClaw löst Ihr GitHub-Token auf (aus Env-Vars oder Auth-Profil).
2. Tauscht es gegen ein kurzlebiges Copilot-API-Token aus.
3. Fragt den Copilot-Endpunkt `/models` ab, um verfügbare Embedding-Modelle zu ermitteln.
4. Wählt das beste Modell aus (bevorzugt `text-embedding-3-small`).
5. Sendet Embedding-Requests an den Copilot-Endpunkt `/embeddings`.

Die Modellverfügbarkeit hängt von Ihrem GitHub-Plan ab. Wenn keine Embedding-Modelle verfügbar sind, überspringt OpenClaw Copilot und versucht den nächsten Provider.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
