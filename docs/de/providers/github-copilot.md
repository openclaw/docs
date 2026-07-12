---
read_when:
    - Sie möchten GitHub Copilot als Modell-Provider verwenden
    - Sie benötigen den `openclaw models auth login-github-copilot`-Ablauf
    - Sie wählen zwischen dem integrierten Copilot-Provider, dem Copilot-SDK-Harness und dem Copilot Proxy.
summary: Melden Sie sich über OpenClaw mit dem Geräteflow oder dem nicht interaktiven Tokenimport bei GitHub Copilot an
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T15:52:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot ist der KI-Programmierassistent von GitHub. Er bietet Zugriff auf Copilot-
Modelle für Ihr GitHub-Konto und Ihren Tarif. OpenClaw kann Copilot auf drei verschiedene
Arten als Modell-Provider oder Agent-Runtime verwenden.

## Drei Möglichkeiten, Copilot in OpenClaw zu verwenden

<Tabs>
  <Tab title="Integrierter Provider (github-copilot)">
    Verwenden Sie den nativen Geräteanmeldeablauf, um ein GitHub-Token zu erhalten, und tauschen
    Sie es anschließend zur Laufzeit von OpenClaw gegen Copilot-API-Tokens aus. Dies ist der
    **standardmäßige** und einfachste Weg, da dafür kein VS Code erforderlich ist.

    <Steps>
      <Step title="Anmeldebefehl ausführen">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sie werden aufgefordert, eine URL aufzurufen und einen Einmalcode einzugeben. Lassen Sie
        das Terminal geöffnet, bis der Vorgang abgeschlossen ist.
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
    Installieren Sie das externe Plugin `@openclaw/copilot`, wenn die Copilot CLI
    und das SDK von GitHub die untergeordnete Agent-Schleife für ausgewählte
    `github-copilot/*`-Modelle übernehmen sollen.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Aktivieren Sie anschließend die Runtime für ein Modell oder einen Provider:

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

    Wählen Sie dies, wenn Sie native Copilot-CLI-Sitzungen, einen vom SDK verwalteten
    Thread-Zustand und eine von Copilot verwaltete Compaction für diese Agent-Durchläufe
    wünschen. Ohne die ausdrückliche Aktivierung von `agentRuntime` verwenden
    `github-copilot/*`-Modelle weiterhin den integrierten Provider. Den vollständigen
    Runtime-Vertrag finden Sie unter [Copilot-SDK-Harness](/de/plugins/copilot).

  </Tab>

  <Tab title="Copilot-Proxy-Plugin (copilot-proxy)">
    Verwenden Sie die VS-Code-Erweiterung **Copilot Proxy** als lokale Brücke. OpenClaw
    kommuniziert mit dem `/v1`-Endpunkt des Proxys (standardmäßig
    `http://localhost:3000/v1`) und verwendet die von Ihnen konfigurierte Modellliste.

    Das Plugin `copilot-proxy` wird mit OpenClaw ausgeliefert und ist standardmäßig
    aktiviert. Konfigurieren Sie die Basis-URL und die Modell-IDs mit:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Wählen Sie dies, wenn Copilot Proxy bereits in VS Code ausgeführt wird oder Sie
    Anfragen darüber weiterleiten müssen. Die VS-Code-Erweiterung muss weiter ausgeführt werden.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (Datenresidenz)

Wenn Ihre Organisation einen GitHub-Enterprise-Mandanten mit Datenresidenz verwendet
(einen `*.ghe.com`-Host wie `your-org.ghe.com`), befindet sich Copilot auf lokalen
Endpunkten des Mandanten statt auf dem öffentlichen `github.com`. OpenClaw stellt dies
als vollwertige Authentifizierungsoption bereit, sodass Sie URLs nicht manuell bearbeiten müssen.

<Steps>
  <Step title="Enterprise-Authentifizierungsoption auswählen">
    Wählen Sie beim Onboarding oder unter `openclaw models auth`
    **GitHub Copilot (Enterprise / data residency)** aus. Sie werden nach Ihrer
    Enterprise-Domain gefragt (zum Beispiel `your-org.ghe.com`); anschließend
    erfolgt die Geräteanmeldung bei diesem Mandanten.

    Geben Sie nur die Stammadresse des Mandanten (`your-org.ghe.com`) ein. Abgeleitete
    Dienst-Hosts wie `api.your-org.ghe.com` oder `copilot-api.your-org.ghe.com` werden
    nicht akzeptiert; OpenClaw leitet diese Endpunkte automatisch von der Stammadresse
    des Mandanten ab.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="Domain wird in der Konfiguration gespeichert">
    Der ausgewählte Host wird unter den Provider-Parametern gespeichert, sodass spätere
    Token-Aktualisierungen und Vervollständigungen automatisch an den Mandanten gerichtet werden:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

Der Geräteablauf, der Token-Austausch und die Vervollständigungen werden jeweils zu
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` und
`https://copilot-api.your-org.ghe.com` aufgelöst. Datenresidenz-Tokens enthalten
eine Mandantenkennung und keinen Proxy-Hinweis, sodass die Basis-URL für Vervollständigungen
auf den Copilot-Host des Mandanten statt auf den öffentlichen Endpunkt zurückfällt.

<Note>
Beim Wechsel der Domain wird die Geräteanmeldung immer erneut ausgeführt. Wenn bereits ein
Copilot-Token gespeichert ist und Sie eine andere Domain auswählen (öffentliches `github.com`
↔ ein `*.ghe.com`-Mandant oder Wechsel zwischen Mandanten), verwendet OpenClaw das vorhandene
Token nicht erneut — stattdessen wird eine neue Anmeldung erzwungen, damit der Geltungsbereich
des Tokens der in die Konfiguration geschriebenen Domain entspricht. Bei einer erneuten Anmeldung
für dieselbe Domain wird weiterhin angeboten, das aktuelle Token wiederzuverwenden. Beim Wechsel
zurück zum öffentlichen `github.com` wird das gespeicherte `githubDomain` gelöscht, sodass die
Konfiguration zum Standard zurückkehrt.
</Note>

<Note>
Die Umgebungsvariable `COPILOT_GITHUB_DOMAIN` überschreibt die aufgelöste Domain
für jeden Copilot-Pfad, der sie auflöst — die Enterprise-Geräteanmeldung
(`--method device-enterprise`), die eigenständige Kurzform
`openclaw models auth login-github-copilot`, Token-Aktualisierung, Embeddings
und Vervollständigungen. Setzen Sie sie für vollständig monitorlose oder CI-
Einrichtungen auf Ihren `*.ghe.com`-Host. Lassen Sie sie ungesetzt (und den
Konfigurationsparameter weg), um das öffentliche `github.com` zu verwenden.
Anmeldungen speichern die Domain, für die das Token ausgestellt wurde (und löschen
sie bei einer Anmeldung beim öffentlichen `github.com`), sodass das Routing auch
nach dem Entfernen der Umgebungsvariable korrekt bleibt.
</Note>

## Optionale Flags

| Befehl                                                                 | Flag            | Beschreibung                                                         |
| ---------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Vorhandenes Authentifizierungsprofil ohne Rückfrage überschreiben    |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Auch das empfohlene Standardmodell des Providers anwenden            |

```bash
# Bestätigung für die erneute Anmeldung überspringen
openclaw models auth login-github-copilot --yes

# Anmelden und das Standardmodell in einem Schritt festlegen
openclaw models auth login --provider github-copilot --method device --set-default
```

## Nicht interaktives Onboarding

Der Geräteanmeldeablauf erfordert ein interaktives TTY. Importieren Sie für eine
monitorlose Einrichtung mit `openclaw onboard --non-interactive` ein vorhandenes
GitHub-OAuth-Zugriffstoken:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Sie können `--auth-choice` auch weglassen; durch die Übergabe von
`--github-copilot-token` wird die Authentifizierungsoption für den GitHub-Copilot-Provider
abgeleitet. Wenn das Flag weggelassen wird, greift das Onboarding zunächst auf
`COPILOT_GITHUB_TOKEN`, dann auf `GH_TOKEN` und schließlich auf `GITHUB_TOKEN` zurück.
Verwenden Sie `--secret-input-mode ref` bei gesetztem `COPILOT_GITHUB_TOKEN`, um statt
Klartext in `auth-profiles.json` eine umgebungsvariablenbasierte `tokenRef` zu speichern.

<AccordionGroup>
  <Accordion title="Interaktives TTY erforderlich">
    Der Geräteanmeldeablauf erfordert ein interaktives TTY. Führen Sie ihn direkt in
    einem Terminal aus, nicht in einem nicht interaktiven Skript oder einer CI-Pipeline.
  </Accordion>

  <Accordion title="Modellverfügbarkeit hängt von Ihrem Tarif ab">
    Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem GitHub-Tarif ab. Wenn ein
    Modell abgelehnt wird, versuchen Sie eine andere ID (zum Beispiel
    `github-copilot/gpt-5.5`). Die aktuelle Modellliste finden Sie in der GitHub-Dokumentation
    zu den [unterstützten Modellen je Copilot-Tarif](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan).
  </Accordion>

  <Accordion title="Live-Aktualisierung des Katalogs über die Copilot-API">
    Sobald über den Geräteanmeldepfad (oder den Umgebungsvariablenpfad) ein GitHub-Token
    aufgelöst wurde, aktualisiert OpenClaw den Modellkatalog bei Bedarf über
    `${baseUrl}/models` (denselben Endpunkt, den VS Code Copilot verwendet), damit die
    Runtime kontospezifische Berechtigungen und genaue Kontextfenster ohne Änderungen
    am Manifest berücksichtigt. Neu veröffentlichte Copilot-Modelle werden ohne ein
    OpenClaw-Upgrade sichtbar, und Kontextfenster entsprechen den tatsächlichen
    modellspezifischen Grenzwerten (z. B. 400k für die gpt-5.x-Reihe, 1M für die internen
    `claude-opus-*-1m`-Varianten).

    Der mitgelieferte statische Katalog bleibt als sichtbarer Rückfall erhalten, wenn die
    Erkennung deaktiviert ist, der Benutzer kein GitHub-Authentifizierungsprofil besitzt,
    der Token-Austausch fehlschlägt oder der HTTPS-Aufruf von `/models` einen Fehler ergibt.
    Um dies zu deaktivieren und sich vollständig auf den statischen Manifestkatalog zu
    verlassen (Offline-/Air-Gap-Szenarien):

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
    Claude-Modell-IDs verwenden automatisch den Anthropic-Messages-Transport.
    Gemini-Modelle verwenden den OpenAI-Chat-Completions-Transport; GPT- und o-Series-
    Modelle behalten den OpenAI-Responses-Transport bei. OpenClaw wählt den richtigen
    Transport anhand der Modellreferenz aus.
  </Accordion>

  <Accordion title="Anfragekompatibilität">
    OpenClaw sendet auf Copilot-Transporten Anfrage-Header im Copilot-IDE-Stil
    (Versionen des VS-Code-Editors/Plugins und die Integrations-ID `vscode-chat`),
    kennzeichnet auf Werkzeugergebnisse folgende Durchläufe als vom Agent initiiert
    und setzt den Copilot-Vision-Header, wenn ein Durchlauf Bildeingaben enthält.
  </Accordion>

  <Accordion title="Auflösungsreihenfolge der Umgebungsvariablen">
    OpenClaw löst die Copilot-Authentifizierung anhand von Umgebungsvariablen in der
    folgenden Prioritätsreihenfolge auf:

    | Priorität | Variable               | Hinweise                                  |
    | --------- | ---------------------- | ----------------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Höchste Priorität, Copilot-spezifisch     |
    | 2         | `GH_TOKEN`             | GitHub-CLI-Token (Rückfall)               |
    | 3         | `GITHUB_TOKEN`         | Standardmäßiges GitHub-Token (niedrigste) |

    Wenn mehrere Variablen gesetzt sind, verwendet OpenClaw die mit der höchsten Priorität.
    Der Geräteanmeldeablauf (`openclaw models auth login-github-copilot`) speichert sein
    Token im Speicher für Authentifizierungsprofile und hat Vorrang vor allen
    Umgebungsvariablen.

  </Accordion>

  <Accordion title="Token-Speicherung">
    Die Anmeldung speichert ein GitHub-Token im Speicher für Authentifizierungsprofile
    (Profil-ID `github-copilot:github`) und tauscht es zur Laufzeit von OpenClaw gegen
    ein kurzlebiges Copilot-API-Token aus. Sie müssen das Token nicht manuell verwalten.
  </Accordion>
</AccordionGroup>

## Embeddings für die Speichersuche

GitHub Copilot kann auch als Embedding-Provider für die
[Speichersuche](/de/concepts/memory-search) dienen. Wenn Sie ein Copilot-Abonnement besitzen
und angemeldet sind, kann OpenClaw Copilot ohne separaten API-Schlüssel für Embeddings
verwenden.

### Konfiguration

Setzen Sie `memorySearch.provider` ausdrücklich, um GitHub-Copilot-Embeddings zu verwenden.
Wenn ein GitHub-Token verfügbar ist, erkennt OpenClaw verfügbare Embedding-Modelle über
die Copilot-API und wählt automatisch das beste aus.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: automatisch erkanntes Modell überschreiben
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Funktionsweise

1. OpenClaw löst Ihr GitHub-Token auf (aus Umgebungsvariablen oder dem Authentifizierungsprofil).
2. Es tauscht dieses gegen ein kurzlebiges Copilot-API-Token aus.
3. Es fragt den Copilot-Endpunkt `/models` ab, um verfügbare Embedding-Modelle zu erkennen.
4. Es wählt das beste Modell aus (Präferenzreihenfolge: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Es sendet Embedding-Anfragen an den Copilot-Endpunkt `/embeddings`.

Die Modellverfügbarkeit hängt von Ihrem GitHub-Tarif ab. Wenn keine Embedding-Modelle
verfügbar sind, überspringt OpenClaw Copilot und versucht es mit dem nächsten Provider.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
