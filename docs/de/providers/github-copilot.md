---
read_when:
    - Sie möchten GitHub Copilot als Modell-Provider verwenden
    - Sie benötigen den `openclaw models auth login-github-copilot`-Ablauf
summary: Melden Sie sich aus OpenClaw heraus über den Geräte-Flow oder den nicht interaktiven Token-Import bei GitHub Copilot an
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T07:10:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot ist der KI-Coding-Assistent von GitHub. Er bietet Zugriff auf Copilot-
Modelle für Ihr GitHub-Konto und Ihren Plan. OpenClaw kann Copilot auf zwei verschiedene Arten als Modell-
Provider verwenden.

## Zwei Möglichkeiten, Copilot in OpenClaw zu verwenden

<Tabs>
  <Tab title="Integrierter Provider (github-copilot)">
    Verwenden Sie den nativen Geräte-Login-Flow, um ein GitHub-Token abzurufen, und tauschen Sie es anschließend gegen
    Copilot-API-Token aus, wenn OpenClaw ausgeführt wird. Dies ist der **standardmäßige** und einfachste Weg,
    da VS Code dafür nicht erforderlich ist.

    <Steps>
      <Step title="Login-Befehl ausführen">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sie werden aufgefordert, eine URL zu besuchen und einen Einmalcode einzugeben. Lassen Sie das
        Terminal geöffnet, bis der Vorgang abgeschlossen ist.
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

  <Tab title="Copilot-Proxy-Plugin (copilot-proxy)">
    Verwenden Sie die **Copilot Proxy**-VS-Code-Erweiterung als lokale Bridge. OpenClaw kommuniziert mit
    dem `/v1`-Endpunkt des Proxys und verwendet die dort konfigurierte Modellliste.

    <Note>
    Wählen Sie dies, wenn Sie Copilot Proxy bereits in VS Code ausführen oder das Routing
    darüber benötigen. Sie müssen das Plugin aktivieren und die VS-Code-Erweiterung weiter ausführen.
    </Note>

  </Tab>
</Tabs>

## Optionale Flags

| Flag            | Beschreibung                                      |
| --------------- | ------------------------------------------------- |
| `--yes`         | Bestätigungsabfrage überspringen                  |
| `--set-default` | Auch das vom Provider empfohlene Standardmodell anwenden |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Nicht-interaktives Onboarding

Wenn Sie bereits ein GitHub-OAuth-Zugriffstoken für Copilot haben, importieren Sie es während der
Headless-Einrichtung mit `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Sie können `--auth-choice` auch weglassen; die Übergabe von `--github-copilot-token` leitet die
Auth-Auswahl des GitHub-Copilot-Providers ab. Wenn das Flag weggelassen wird, fällt das Onboarding
auf `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` und dann `GITHUB_TOKEN` zurück. Verwenden Sie
`--secret-input-mode ref` mit gesetztem `COPILOT_GITHUB_TOKEN`, um eine env-gestützte
`tokenRef` statt Klartext in `auth-profiles.json` zu speichern.

<AccordionGroup>
  <Accordion title="Interaktives TTY erforderlich">
    Der Geräte-Login-Flow erfordert ein interaktives TTY. Führen Sie ihn direkt in einem
    Terminal aus, nicht in einem nicht-interaktiven Skript oder einer CI-Pipeline.
  </Accordion>

  <Accordion title="Modellverfügbarkeit hängt von Ihrem Plan ab">
    Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem GitHub-Plan ab. Wenn ein Modell
    abgelehnt wird, versuchen Sie eine andere ID (zum Beispiel `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transportauswahl">
    Claude-Modell-IDs verwenden automatisch den Anthropic-Messages-Transport. GPT-,
    o-Series- und Gemini-Modelle behalten den OpenAI-Responses-Transport. OpenClaw
    wählt den korrekten Transport anhand der Modellreferenz aus.
  </Accordion>

  <Accordion title="Anfragekompatibilität">
    OpenClaw sendet Copilot-IDE-artige Anfrage-Header auf Copilot-Transporten,
    einschließlich integrierter Compaction, Tool-Ergebnis- und Bild-Follow-up-Turns. Es
    aktiviert keine Responses-Fortsetzung auf Provider-Ebene für Copilot, es sei denn,
    dieses Verhalten wurde gegenüber der Copilot-API verifiziert.
  </Accordion>

  <Accordion title="Auflösungsreihenfolge für Umgebungsvariablen">
    OpenClaw löst Copilot-Auth aus Umgebungsvariablen in der folgenden
    Prioritätsreihenfolge auf:

    | Priorität | Variable              | Hinweise                         |
    | --------- | --------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Höchste Priorität, Copilot-spezifisch |
    | 2         | `GH_TOKEN`            | GitHub-CLI-Token (Fallback)      |
    | 3         | `GITHUB_TOKEN`        | Standard-GitHub-Token (niedrigste) |

    Wenn mehrere Variablen gesetzt sind, verwendet OpenClaw die mit der höchsten Priorität.
    Der Geräte-Login-Flow (`openclaw models auth login-github-copilot`) speichert
    sein Token im Auth-Profilspeicher und hat Vorrang vor allen Umgebungsvariablen.

  </Accordion>

  <Accordion title="Token-Speicherung">
    Der Login speichert ein GitHub-Token im Auth-Profilspeicher und tauscht es
    gegen ein Copilot-API-Token aus, wenn OpenClaw ausgeführt wird. Sie müssen das
    Token nicht manuell verwalten.
  </Accordion>
</AccordionGroup>

<Warning>
Der Geräte-Login-Befehl erfordert ein interaktives TTY. Verwenden Sie nicht-interaktives
Onboarding, wenn Sie eine Headless-Einrichtung benötigen.
</Warning>

## Embeddings für Speichersuche

GitHub Copilot kann auch als Embedding-Provider für die
[Speichersuche](/de/concepts/memory-search) dienen. Wenn Sie ein Copilot-Abonnement haben und
angemeldet sind, kann OpenClaw es für Embeddings ohne separaten API-Schlüssel verwenden.

### Automatische Erkennung

Wenn `memorySearch.provider` `"auto"` ist (der Standard), wird GitHub Copilot
mit Priorität 15 ausprobiert -- nach lokalen Embeddings, aber vor OpenAI und anderen kostenpflichtigen
Providern. Wenn ein GitHub-Token verfügbar ist, ermittelt OpenClaw verfügbare
Embedding-Modelle aus der Copilot-API und wählt automatisch das beste aus.

### Explizite Konfiguration

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

1. OpenClaw löst Ihr GitHub-Token auf (aus env vars oder dem Auth-Profil).
2. Tauscht es gegen ein kurzlebiges Copilot-API-Token aus.
3. Fragt den Copilot-`/models`-Endpunkt ab, um verfügbare Embedding-Modelle zu ermitteln.
4. Wählt das beste Modell aus (bevorzugt `text-embedding-3-small`).
5. Sendet Embedding-Anfragen an den Copilot-`/embeddings`-Endpunkt.

Die Modellverfügbarkeit hängt von Ihrem GitHub-Plan ab. Wenn keine Embedding-Modelle
verfügbar sind, überspringt OpenClaw Copilot und versucht den nächsten Provider.

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Auth-Details und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
