---
read_when:
    - Sie möchten GitHub Copilot als Modell-Provider verwenden
    - Sie benötigen den Ablauf `openclaw models auth login-github-copilot`
summary: Bei GitHub Copilot aus OpenClaw heraus per Device Flow anmelden
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T13:54:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot ist der KI-Coding-Assistent von GitHub. Er bietet Zugriff auf Copilot-
Modelle für Ihr GitHub-Konto und Ihren Tarif. OpenClaw kann Copilot auf zwei verschiedene Arten als Modell-
Provider verwenden.

## Zwei Wege, Copilot in OpenClaw zu verwenden

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Verwenden Sie den nativen Device-Login-Flow, um ein GitHub-Token zu erhalten, und tauschen Sie es dann
    gegen Copilot-API-Token aus, wenn OpenClaw ausgeführt wird. Dies ist der **Standard** und der einfachste Weg,
    weil dafür VS Code nicht erforderlich ist.

    <Steps>
      <Step title="Anmeldebefehl ausführen">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sie werden aufgefordert, eine URL zu öffnen und einen Einmalcode einzugeben. Lassen Sie das
        Terminal geöffnet, bis der Vorgang abgeschlossen ist.
      </Step>
      <Step title="Ein Standardmodell setzen">
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
    Verwenden Sie die VS-Code-Erweiterung **Copilot Proxy** als lokale Bridge. OpenClaw spricht mit
    dem Endpunkt `/v1` des Proxys und verwendet die Modellliste, die Sie dort konfigurieren.

    <Note>
    Wählen Sie dies, wenn Sie Copilot Proxy bereits in VS Code ausführen oder Routing
    darüber benötigen. Sie müssen das Plugin aktivieren und die VS-Code-Erweiterung weiter ausführen lassen.
    </Note>

  </Tab>
</Tabs>

## Optionale Flags

| Flag            | Beschreibung                                         |
| --------------- | ---------------------------------------------------- |
| `--yes`         | Die Bestätigungsabfrage überspringen                 |
| `--set-default` | Zusätzlich das empfohlene Standardmodell des Providers anwenden |

```bash
# Bestätigung überspringen
openclaw models auth login-github-copilot --yes

# Anmelden und das Standardmodell in einem Schritt setzen
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Interaktives TTY erforderlich">
    Der Device-Login-Flow erfordert ein interaktives TTY. Führen Sie ihn direkt in einem
    Terminal aus, nicht in einem nicht interaktiven Skript oder einer CI-Pipeline.
  </Accordion>

  <Accordion title="Modellverfügbarkeit hängt von Ihrem Tarif ab">
    Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem GitHub-Tarif ab. Wenn ein Modell
    abgelehnt wird, versuchen Sie eine andere ID (zum Beispiel `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transportauswahl">
    Claude-Modell-IDs verwenden automatisch den Transport Anthropic Messages. GPT-,
    o-series- und Gemini-Modelle behalten den Transport OpenAI Responses. OpenClaw
    wählt anhand der Modell-Ref den korrekten Transport aus.
  </Accordion>

  <Accordion title="Anfragekompatibilität">
    OpenClaw sendet Copilot-IDE-artige Anfrageheader auf Copilot-Transporten,
    einschließlich eingebauter Compaction, Tool-Ergebnissen und Folge-Turns für Bilder. Es
    aktiviert für Copilot keine providerseitige Responses-Fortsetzung, solange
    dieses Verhalten nicht gegen die API von Copilot verifiziert wurde.
  </Accordion>

  <Accordion title="Reihenfolge bei der Auflösung von Umgebungsvariablen">
    OpenClaw löst Copilot-Authentifizierung aus Umgebungsvariablen in der folgenden
    Prioritätsreihenfolge auf:

    | Priorität | Variable               | Hinweise                          |
    | --------- | ---------------------- | --------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Höchste Priorität, Copilot-spezifisch |
    | 2         | `GH_TOKEN`             | GitHub-CLI-Token (Fallback)       |
    | 3         | `GITHUB_TOKEN`         | Standard-GitHub-Token (niedrigste Priorität) |

    Wenn mehrere Variablen gesetzt sind, verwendet OpenClaw die Variable mit der höchsten Priorität.
    Der Device-Login-Flow (`openclaw models auth login-github-copilot`) speichert
    sein Token im Store für Auth-Profile und hat Vorrang vor allen Umgebungsvariablen.

  </Accordion>

  <Accordion title="Token-Speicherung">
    Die Anmeldung speichert ein GitHub-Token im Store für Auth-Profile und tauscht es
    beim Ausführen von OpenClaw gegen ein Copilot-API-Token aus. Sie müssen das
    Token nicht manuell verwalten.
  </Accordion>
</AccordionGroup>

<Warning>
Erfordert ein interaktives TTY. Führen Sie den Anmeldebefehl direkt in einem Terminal aus, nicht
innerhalb eines Headless-Skripts oder eines CI-Jobs.
</Warning>

## Embeddings für Memory-Suche

GitHub Copilot kann auch als Embedding-Provider für
[memory search](/de/concepts/memory-search) dienen. Wenn Sie ein Copilot-Abonnement haben und
angemeldet sind, kann OpenClaw es ohne separaten API-Schlüssel für Embeddings verwenden.

### Automatische Erkennung

Wenn `memorySearch.provider` auf `"auto"` gesetzt ist (Standard), wird GitHub Copilot
mit Priorität 15 versucht — nach lokalen Embeddings, aber vor OpenAI und anderen kostenpflichtigen
Providern. Wenn ein GitHub-Token verfügbar ist, erkennt OpenClaw verfügbare
Embedding-Modelle über die Copilot-API und wählt automatisch das beste aus.

### Explizite Konfiguration

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: das automatisch erkannte Modell überschreiben
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### So funktioniert es

1. OpenClaw löst Ihr GitHub-Token auf (aus Umgebungsvariablen oder Auth-Profil).
2. Tauscht es gegen ein kurzlebiges Copilot-API-Token aus.
3. Fragt den Copilot-Endpunkt `/models` ab, um verfügbare Embedding-Modelle zu erkennen.
4. Wählt das beste Modell aus (bevorzugt `text-embedding-3-small`).
5. Sendet Embedding-Anfragen an den Copilot-Endpunkt `/embeddings`.

Die Modellverfügbarkeit hängt von Ihrem GitHub-Tarif ab. Wenn keine Embedding-Modelle
verfügbar sind, überspringt OpenClaw Copilot und versucht den nächsten Provider.

## Verwandt

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="OAuth and auth" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
