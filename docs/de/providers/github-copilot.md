---
read_when:
    - Sie möchten GitHub Copilot als Modellanbieter verwenden
    - Sie benötigen den Ablauf `openclaw models auth login-github-copilot`
summary: Melden Sie sich über den Gerätefluss von OpenClaw aus bei GitHub Copilot an
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T19:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5169839322f64b24b194302b61c5bad67c6cb6595989f9a1ef65867d8b68659
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot ist der KI-Coding-Assistent von GitHub. Er bietet Zugriff auf Copilot-Modelle für Ihr GitHub-Konto und Ihren Tarif. OpenClaw kann Copilot auf zwei verschiedene Arten als Modellanbieter verwenden.

## Zwei Möglichkeiten, Copilot in OpenClaw zu verwenden

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Verwenden Sie den nativen Geräte-Login-Ablauf, um ein GitHub-Token zu erhalten, und tauschen Sie es dann gegen
    Copilot-API-Tokens aus, wenn OpenClaw ausgeführt wird. Dies ist der **Standard** und der einfachste Weg,
    da er kein VS Code erfordert.

    <Steps>
      <Step title="Führen Sie den Login-Befehl aus">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sie werden aufgefordert, eine URL aufzurufen und einen einmaligen Code einzugeben. Lassen Sie
        das Terminal geöffnet, bis der Vorgang abgeschlossen ist.
      </Step>
      <Step title="Legen Sie ein Standardmodell fest">
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

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Verwenden Sie die VS Code-Erweiterung **Copilot Proxy** als lokale Brücke. OpenClaw kommuniziert mit
    dem `/v1`-Endpunkt des Proxys und verwendet die Modellliste, die Sie dort konfigurieren.

    <Note>
    Wählen Sie dies, wenn Sie Copilot Proxy bereits in VS Code ausführen oder den Datenverkehr
    darüber leiten müssen. Sie müssen das Plugin aktivieren und die VS Code-Erweiterung weiter ausführen.
    </Note>

  </Tab>
</Tabs>

## Optionale Flags

| Flag            | Beschreibung                                      |
| --------------- | ------------------------------------------------- |
| `--yes`         | Bestätigungsabfrage überspringen                  |
| `--set-default` | Zusätzlich das empfohlene Standardmodell des Anbieters anwenden |

```bash
# Bestätigung überspringen
openclaw models auth login-github-copilot --yes

# Anmelden und das Standardmodell in einem Schritt festlegen
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Interaktive TTY erforderlich">
    Der Geräte-Login-Ablauf erfordert eine interaktive TTY. Führen Sie ihn direkt in einem
    Terminal aus, nicht in einem nicht interaktiven Skript oder einer CI-Pipeline.
  </Accordion>

  <Accordion title="Die Modellverfügbarkeit hängt von Ihrem Tarif ab">
    Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem GitHub-Tarif ab. Wenn ein Modell
    abgelehnt wird, versuchen Sie eine andere ID (zum Beispiel `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transportauswahl">
    Claude-Modell-IDs verwenden automatisch den Anthropic-Messages-Transport. GPT-,
    o-series- und Gemini-Modelle verwenden weiterhin den OpenAI-Responses-Transport. OpenClaw
    wählt den richtigen Transport anhand der Modell-Referenz aus.
  </Accordion>

  <Accordion title="Auflösungsreihenfolge für Umgebungsvariablen">
    OpenClaw löst die Copilot-Authentifizierung anhand von Umgebungsvariablen in der folgenden
    Prioritätsreihenfolge auf:

    | Priority | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Höchste Priorität, Copilot-spezifisch |
    | 2        | `GH_TOKEN`            | GitHub-CLI-Token (Fallback)      |
    | 3        | `GITHUB_TOKEN`        | Standard-GitHub-Token (niedrigste Priorität)   |

    Wenn mehrere Variablen gesetzt sind, verwendet OpenClaw die mit der höchsten Priorität.
    Der Geräte-Login-Ablauf (`openclaw models auth login-github-copilot`) speichert
    sein Token im Auth-Profile-Store und hat Vorrang vor allen Umgebungsvariablen.

  </Accordion>

  <Accordion title="Tokenspeicherung">
    Beim Login wird ein GitHub-Token im Auth-Profile-Store gespeichert und beim Ausführen von OpenClaw
    gegen ein Copilot-API-Token ausgetauscht. Sie müssen das Token nicht manuell verwalten.
  </Accordion>
</AccordionGroup>

<Warning>
Erfordert eine interaktive TTY. Führen Sie den Login-Befehl direkt in einem Terminal aus, nicht
innerhalb eines Headless-Skripts oder CI-Jobs.
</Warning>

## Einbettungen für die Memory-Suche

GitHub Copilot kann auch als Einbettungsanbieter für die
[memory search](/de/concepts/memory-search) dienen. Wenn Sie ein Copilot-Abonnement haben und
angemeldet sind, kann OpenClaw es ohne separaten API-Schlüssel für Einbettungen verwenden.

### Automatische Erkennung

Wenn `memorySearch.provider` auf `"auto"` gesetzt ist (der Standard), wird GitHub Copilot
mit Priorität 15 versucht – nach lokalen Einbettungen, aber vor OpenAI und anderen kostenpflichtigen
Anbietern. Wenn ein GitHub-Token verfügbar ist, erkennt OpenClaw verfügbare
Einbettungsmodelle über die Copilot-API und wählt automatisch das beste aus.

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

1. OpenClaw löst Ihr GitHub-Token auf (aus Umgebungsvariablen oder dem Auth-Profil).
2. Tauscht es gegen ein kurzlebiges Copilot-API-Token aus.
3. Fragt den Copilot-`/models`-Endpunkt ab, um verfügbare Einbettungsmodelle zu erkennen.
4. Wählt das beste Modell aus (bevorzugt `text-embedding-3-small`).
5. Sendet Einbettungsanfragen an den Copilot-`/embeddings`-Endpunkt.

Die Modellverfügbarkeit hängt von Ihrem GitHub-Tarif ab. Wenn keine Einbettungsmodelle
verfügbar sind, überspringt OpenClaw Copilot und versucht den nächsten Anbieter.

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Anbietern, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
