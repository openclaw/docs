---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
    - Sie möchten Claude-CLI- oder Claude-Desktop-Sitzungen auf gekoppelten Computern durchsuchen
summary: Anthropic Claude über API-Schlüssel oder die Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-07-24T04:35:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b044f4c0acb8e158cea7d6dc6fdac3763fc86f45d6c6bbbcc2256d42033f1b5
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic entwickelt die Modellfamilie **Claude**. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** – direkter Zugriff auf die Anthropic API mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** – eine vorhandene Claude-Code-Anmeldung auf demselben Host wiederverwenden

## Nutzungs- und Kostenverfolgung

OpenClaw erkennt die verfügbaren Anthropic-Anmeldedaten und wählt die passende Nutzungsansicht aus:

- Anmeldedaten für ein Claude-Abonnement bzw. die Einrichtung zeigen Kontingentzeiträume und ein optionales Budget für zusätzliche Nutzung.
- `ANTHROPIC_ADMIN_KEY` oder `ANTHROPIC_ADMIN_API_KEY` zeigt in der Control UI unter **Nutzung** die von Anthropic gemeldeten Organisationskosten und die Nutzung der Messages API der letzten 30 Tage, einschließlich täglicher Ausgaben, Token-/Cache-Gesamtsummen, meistgenutzter Modelle und Kostenkategorien.
- In einem Anthropic-Provider-Profil gespeicherte `sk-ant-admin...`-Anmeldedaten werden automatisch als Admin-API-Schlüssel erkannt.

Der Kostenverlauf der Admin API stammt aus Anthropics [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api). Dabei handelt es sich um die tatsächliche Abrechnung des Providers, getrennt von den sitzungsbasierten Kostenschätzungen von OpenClaw.

<Warning>
Das Claude-CLI-Backend von OpenClaw führt die installierte Claude Code CLI im
nicht interaktiven Ausgabemodus (`claude -p`) aus. In der aktuellen Dokumentation zu Claude Code von Anthropic
wird dieser Modus als Agent-SDK-/programmatische Nutzung beschrieben. Mit einem Support-Update vom 15. Juni 2026
setzte Anthropic die angekündigte separate Änderung der Agent-SDK-Abrechnung
aus: Die Nutzung des Claude Agent SDK, von `claude -p` und von Drittanbieter-Apps wird weiterhin
auf die Nutzungslimits des angemeldeten Abonnements angerechnet, und das zuvor angekündigte monatliche
Agent-SDK-Guthaben ist nicht verfügbar, während Anthropic diesen Plan überarbeitet.

Die interaktive Nutzung von Claude Code wird weiterhin auf die Limits des angemeldeten Claude-Tarifs angerechnet.
Die Authentifizierung per API-Schlüssel wird direkt nach Verbrauch abgerechnet und ist nicht von diesem Tarif abhängig.
Verwenden Sie für langlebige Gateway-Hosts, gemeinsam genutzte Automatisierungen und planbare Produktionsausgaben
einen Anthropic-API-Schlüssel.

Die aktuellen Support-Artikel von Anthropic können dieses Verhalten ohne eine
OpenClaw-Veröffentlichung ändern:

- [Claude Code CLI – Referenz](https://code.claude.com/docs/en/cli-usage)
- [Das Claude Agent SDK mit Ihrem Claude-Tarif verwenden](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code mit Ihrem Pro- oder Max-Tarif verwenden](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Tarif verwenden](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Kosten für Claude Code verwalten](https://code.claude.com/docs/en/costs)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie in der [Anthropic Console](https://console.anthropic.com/) einen API-Schlüssel.
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # auswählen: Anthropic API key
        ```

        Alternativ können Sie den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Am besten geeignet für:** die Wiederverwendung einer vorhandenen Claude-CLI-Anmeldung ohne separaten API-Schlüssel.

    <Steps>
      <Step title="Sicherstellen, dass Claude CLI installiert und angemeldet ist">
        Überprüfen Sie dies mit:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # auswählen: Claude CLI
        ```

        OpenClaw erkennt die vorhandenen Claude-CLI-Anmeldedaten und verwendet sie erneut.
      </Step>
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Einzelheiten zur Einrichtung und Laufzeit des Claude-CLI-Backends finden Sie unter [CLI-Backends](/de/gateway/cli-backends).
    </Note>

    <Warning>
    Die Wiederverwendung der Claude CLI setzt voraus, dass der OpenClaw-Prozess auf demselben Host wie die
    Claude-CLI-Anmeldung ausgeführt wird. Bei Docker-Installationen kann ein Container-Home-Verzeichnis dauerhaft gespeichert und
    Claude Code dort angemeldet werden; siehe
    [Claude-CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).
    Andere Container-Installationen wie [Podman](/de/install/podman) binden das
    `~/.claude` des Hosts weder bei der Einrichtung noch zur Laufzeit ein; verwenden Sie dort einen Anthropic-API-Schlüssel oder wählen Sie
    einen Provider mit von OpenClaw verwaltetem OAuth, beispielsweise
    [OpenAI Codex](/de/providers/openai).
    </Warning>

    ### Einrichtungstoken abrufen

    Führen Sie `claude setup-token` auf einem beliebigen Computer aus, auf dem Claude Code installiert ist. Der Befehl gibt
    ein langlebiges Token aus, das mit `sk-ant-oat01-` beginnt.

    Fügen Sie das Token während des Onboardings in der macOS-App ein, indem Sie
    **Anthropic setup-token** unter **Connect with an API key or token** auswählen, oder verwenden Sie:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Konfigurationsbeispiel

    Verwenden Sie bevorzugt die kanonische Anthropic-Modellreferenz zusammen mit einer CLI-Laufzeitüberschreibung:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Veraltete `claude-cli/claude-opus-4-7`-Modellreferenzen funktionieren aus
    Kompatibilitätsgründen weiterhin, neue Konfigurationen sollten die Provider-/Modellauswahl jedoch als
    `anthropic/*` beibehalten und das Ausführungs-Backend in der Provider-/Modell-Laufzeitrichtlinie festlegen.

    ### Abrechnung und `claude -p`

    OpenClaw verwendet für Ausführungen mit Claude CLI den nicht interaktiven `claude -p`-Pfad von Claude Code.
    Anthropic behandelt diesen Pfad derzeit als Agent-SDK-/programmatische Nutzung:

    - Mit dem Support-Update von Anthropic vom 15. Juni 2026 wurde der zuvor angekündigte
      separate Plan für Agent-SDK-Guthaben ausgesetzt.
    - Die Nutzung des Claude Agent SDK im Abonnementtarif, von `claude -p` und von Drittanbieter-Apps
      wird weiterhin auf die Nutzungslimits des angemeldeten Abonnements angerechnet.
    - Das zuvor angekündigte monatliche Agent-SDK-Guthaben ist nicht verfügbar, während
      Anthropic diesen Plan überarbeitet.
    - Anmeldungen über Console/API-Schlüssel werden verbrauchsabhängig über die API abgerechnet und erhalten
      kein Agent-SDK-Guthaben des Abonnements.

    Den Hinweis zur Aussetzung finden Sie in Anthropics [Artikel zum Agent-SDK-Tarif
    ](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan); Informationen zum Abonnementverhalten finden Sie in den Artikeln zu den Claude-Code-Tarifen
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    und
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic kann das Abrechnungs- und Ratenbegrenzungsverhalten von Claude Code ohne eine
    OpenClaw-Veröffentlichung ändern. Prüfen Sie `claude auth status`, `/status` und
    die verlinkte Dokumentation von Anthropic, wenn eine planbare Abrechnung wichtig ist.

    <Tip>
    Verwenden Sie für gemeinsam genutzte Produktionsautomatisierungen statt
    Claude CLI einen Anthropic-API-Schlüssel. OpenClaw unterstützt außerdem abonnementähnliche Optionen von
    [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Claude-Sitzungen auf mehreren Computern

Das mitgelieferte Anthropic-Plugin fügt der normalen Seitenleiste für Sitzungen eine Gruppe **Claude Code**
hinzu. Zeilen werden im normalen Chat-Bereich geöffnet. Das Plugin erkennt nicht archivierte Claude-
Code-Sitzungen auf dem Gateway und auf verbundenen Node-Hosts:

- Claude-CLI-Sitzungen stammen aus gültigen Projektindex-Datensätzen. Bei nicht indizierten
  Transkripten erkennt ein begrenzter Metadaten-Fallback gleichzeitig ausgeführte, nicht zu einem Nebenstrang gehörende
  interaktive (`cli`) und monitorlose Agent-SDK-CLI-Sitzungen (`sdk-cli`) unter
  `~/.claude/projects/`.
- Claude-Desktop-Sitzungen verwenden den Desktop-Titel, den Aktivitätszeitpunkt und
  den Archivstatus, wenn ihre Metadaten auf dieselbe Claude-Code-Sitzungs-ID verweisen.
- Eine reine CLI-Sitzung besitzt kein Archivierungskennzeichen und bleibt daher sichtbar, solange ihr
  Transkript vorhanden ist.

Für die Erkennung ist keine zusätzliche OpenClaw-Konfiguration erforderlich. Das Anthropic-Plugin
ist im Lieferumfang enthalten und standardmäßig aktiviert. Ein nativer macOS-Node stellt die schreibgeschützten
Claude-Sitzungsbefehle bereit, wenn das lokale Verzeichnis `~/.claude/projects/` vorhanden ist.
Genehmigen Sie das Upgrade der Node-Kopplung, wenn diese Befehle erstmals angezeigt werden.

Die Seitenleiste gruppiert Zeilen nach ihrem Gateway- oder gekoppelten Node-Host und zeigt die
neueste begrenzte Seite jedes Hosts an, sobald der jeweilige Computer antwortet. Sie gleicht die Daten erneut ab,
wenn sich die Hostverbindung ändert, die Seite wieder den Fokus erhält und während der Anzeige höchstens alle
30 Sekunden, sodass außerhalb von OpenClaw erstellte Claude-Sitzungen
ohne Neuladen erscheinen. Bei einem geänderten Katalog erfolgt schneller ein weiterer Durchlauf. Verwenden Sie **Weitere
Sitzungen laden** unter einer Kataloggruppe, um für jeden Host mit
weiterem Verlauf die nächste Seite anzuhängen. Angehängte Zeilen bleiben sichtbar und werden bei
Aktualisierungen erneut bis zur gleichen Tiefe abgerufen. Katalog-Clients verwenden `sessions.catalog.list`; beim Öffnen einer Zeile wird
`sessions.catalog.read` verwendet.

Bei der Übernahme des Terminals wird `claude` zuerst über den Anmelde-Shell-
PATH des Benutzers des zuständigen Hosts und erst danach über den PATH des Dienstes/Daemons aufgelöst. Dadurch bleiben von der App gestartete Sitzungen
mit der Claude CLI konsistent, die der Betreiber in einem normalen Terminal verwendet.

Beim Auswählen einer Zeile wird zuerst die neueste Transkriptseite gelesen. **Ältere Transkript-
elemente laden** folgt einem undurchsichtigen Byte-Cursor und liest einen weiteren begrenzten Abschnitt aus der
JSONL-Datei, anstatt den gesamten Verlauf zu laden. Normale Inhalte von Benutzern, Assistenten,
Denkprozessen, Tool-Aufrufen und Tool-Ergebnissen bleiben erhalten. Ein einzelnes Element,
das die Sicherheitsobergrenze des Node/Gateways überschreitet, wird deutlich als gekürzt gekennzeichnet.

Wenn Sie in einer Gateway-lokalen `claude-cli`-Zeile im normalen Eingabefeld Text eingeben, wird
`sessions.catalog.continue` aufgerufen. OpenClaw löst den lokalen Katalogdatensatz erneut auf,
erstellt eine modellgebundene native Sitzung oder verwendet sie erneut, importiert höchstens 200 sichtbare
Elemente oder 512 KiB und initialisiert die Claude-CLI-Bindung. Der erste Durchlauf wird mit
`--fork-session` fortgesetzt. Claude weist dem Fork eine neue Sitzungs-ID zu, sodass spätere Durchläufe
den Fork verwenden und die Quellsitzung unverändert bleibt.

Ein monitorloser Node-Host kann die Fortsetzung seiner Claude-CLI-Zeilen ebenfalls ermöglichen, indem
die nachstehende lokale Node-Einstellung aktiviert und der Node-Host neu gestartet wird:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Der Node stellt `agent.cli.claude.run.v1` nur bereit, wenn die Einstellung aktiviert ist
und die lokale ausführbare Datei `claude` aufgelöst werden kann. OpenClaw löst den Katalogdatensatz
auf diesem Node erneut auf, importiert denselben begrenzten Verlauf und bindet die übernommene
Sitzung an den Node sowie an das vom Katalog gemeldete Arbeitsverzeichnis. Bei jedem Durchlauf wird der
reale `claude -p`-Prozess des Nodes mit den Claude-Dateien und der Anmeldung dieses Nodes ausgeführt. Die
Richtlinie des Nodes zur Genehmigung von Ausführungen gilt weiterhin; das Gateway kann die Aktivierung nicht erzwingen.

Node-Fortsetzung v1 ist nur für eine einmalige Verwendung vorgesehen. Sie lässt die Gateway-Loopback-MCP-Konfiguration und
die Argumente des Gateway-Skills-Plugins aus, initialisiert nicht erneut aus einem Gateway-Transkript und
lehnt Anhänge und Bilder ab. Claude-Desktop-Zeilen bleiben schreibgeschützt. Native
macOS-App-Nodes bleiben ebenfalls schreibgeschützt, bis die App den Ausführungsbefehl bereitstellt.

<Note>
Claude-Sitzungen gekoppelter Nodes bleiben schreibgeschützt, sofern der monitorlose Node nicht ausdrücklich
`agent.cli.claude.run.v1` bereitstellt. OpenClaw ändert niemals Claude-Desktop-
Metadaten und archiviert keine Claude-Sitzungen. Die Seite erfordert eine Betreiberverbindung
mit Schreibberechtigung, weil sie authentifiziertes `node.invoke` verwendet. Auflisten und Lesen
bleiben selbst auf einem Node mit aktivierter Fortsetzung schreibgeschützt.
</Note>

Siehe [Nodes: Claude-Sitzungen und -Transkripte](/de/nodes#claude-sessions-and-transcripts)
für den Node-Befehl und die Sicherheitsgrenze.

## Standardwerte für Thinking (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 und 4.6)

`anthropic/claude-sonnet-5` verwendet standardmäßig adaptives Thinking mit dem Aufwand `high`.
Verwenden Sie `/think off`, um Thinking zu deaktivieren, oder `/think xhigh|max` für die
höheren nativen Aufwandsstufen des Modells. OpenClaw lässt manuelle Thinking-Budgets, benutzerdefinierte
Sampling-Parameter, Assistant-Prefills und Priority Tier für Sonnet 5 aus, da
Anthropic diese Anfragefunktionen bei diesem Modell nicht unterstützt.
Der Katalog verwendet bis zum 31. August 2026 die Einführungspreise von Anthropic in Höhe von `$2/$10` für Ein-/Ausgabe;
die Standardpreise von `$3/$15` gelten ab dem 1. September 2026.

`anthropic/claude-fable-5` verwendet immer adaptives Thinking und standardmäßig den Aufwand `high`.
Anthropic erlaubt es bei diesem Modell nicht, Thinking zu deaktivieren, daher werden
`/think off` und `/think minimal` stattdessen dem Aufwand `low` zugeordnet. OpenClaw lässt außerdem
benutzerdefinierte Temperaturwerte für Fable-5-Anfragen aus, da Anthropic
eine Überschreibung der Temperatur bei allen Anfragen mit aktiviertem Thinking ablehnt.

`anthropic/claude-mythos-5` ist ein Modell mit eingeschränktem Zugriff und demselben Vertrag für
ständig aktives adaptives Thinking. OpenClaw verwendet standardmäßig `high`, ordnet `/think off` und
`/think minimal` `low` zu und lässt vom Aufrufer ausgewählte Sampling-Parameter aus.
Der Katalog veröffentlicht sein Kontextfenster mit 1.000.000 Token, sein Ausgabelimit
von 128.000 Token, die Bildeingabe und die Ein-/Ausgabepreise von `$10/$50`.

Bei Claude Opus 4.8 bleibt Thinking in OpenClaw standardmäßig deaktiviert. Wenn Sie
adaptives Thinking explizit mit `/think high|xhigh|max` aktivieren, sendet OpenClaw
die Opus-4.8-Aufwandswerte von Anthropic; Claude-4.6-Modelle (Opus 4.6 und Sonnet 4.6)
verwenden standardmäßig `adaptive`.

Überschreiben Sie dies pro Nachricht mit `/think:<level>` oder in den Modellparametern:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Zugehörige Anthropic-Dokumentation:
- [Adaptives Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Erweitertes Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Sicherheitsbedingter Fallback bei Ablehnung (Claude Fable 5)

<Warning>
Die Verwendung von Claude Fable 5 bedeutet zugleich die Verwendung von Claude Opus 4.8. Fable 5 wird mit
Sicherheitsklassifikatoren ausgeliefert, die eine Anfrage ablehnen können; die von Anthropic genehmigte
Wiederherstellung besteht darin, diese Anfrage von `claude-opus-4-8` bearbeiten zu lassen. OpenClaw aktiviert dies
bei direkten Anfragen mit API-Schlüssel automatisch, sodass einige Fable-Anfragen
von Claude Opus 4.8 beantwortet und entsprechend abgerechnet werden. Wenn Ihre Richtlinien oder Ihr Budget
keine von Opus bearbeiteten Anfragen zulassen, wählen Sie `anthropic/claude-fable-5` nicht aus.
</Warning>

### Warum dies vorhanden ist

Die Klassifikatoren von Fable 5 geben bei Anfragen in eingeschränkten
Bereichen `stop_reason: "refusal"` zurück und erzeugen auch falsch positive Ergebnisse bei harmlosen, angrenzenden Aufgaben
(Sicherheitstools, Biowissenschaften oder sogar bei der Aufforderung an das Modell, seine
unverarbeitete Argumentation wiederzugeben). Ohne Fallback endet die Anfrage mit einem Fehler, obwohl
ein anderes Claude-Modell sie problemlos bearbeiten würde – Anthropics eigene Ablehnungsmeldung
weist API-Integratoren an, ein Fallback-Modell zu konfigurieren.

### Funktionsweise

1. Bei jeder direkten Anfrage mit API-Schlüssel an `anthropic/claude-fable-5` sendet OpenClaw
   die serverseitige Fallback-Einwilligung von Anthropic: den
   Beta-Header `server-side-fallback-2026-06-01` sowie
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 ist das einzige
   Fallback-Ziel, das Anthropic für Fable 5 zulässt.
2. Nur eine Ablehnung durch den Sicherheitsklassifikator löst den Fallback aus. Ratenbegrenzungen,
   Überlastungen und Serverfehler verhalten sich genau wie zuvor und durchlaufen
   den normalen [Modell-Failover](/de/concepts/model-failover) von OpenClaw.
3. Die Wiederherstellung erfolgt innerhalb desselben Aufrufs. Eine Ablehnung vor jeglicher Ausgabe ist
   abgesehen von der Latenz nicht sichtbar; die gesamte Antwort stammt von Opus 4.8. Bei einer
   Ablehnung während des Streams bleibt der Teiltext als Präfix erhalten, ab dem das Fallback-Modell
   fortfährt, während die Argumentation und Tool-Aufrufe des ablehnenden Modells
   gemäß den Wiedergaberegeln von Anthropic verworfen werden (sie dürfen weder zurückgegeben noch
   ausgeführt werden).
4. Wenn Claude Opus 4.8 ebenfalls ablehnt, wird die Ablehnung für die Anfrage wie
   vor dieser Funktion als Fehler ausgegeben.

Der Fallback erfolgt auf Ebene der Anthropic-API, daher muss `claude-opus-4-8`
nicht in Ihrer konfigurierten Modellliste oder Fallback-Kette enthalten sein – ein Fable-fähiger
API-Schlüssel kann immer Opus verwenden.

### Beobachtbarkeit und Abrechnung

- Eine über den Fallback bearbeitete Anfrage zeichnet in der Assistant-Nachricht eine
  `provider_fallback`-Diagnose auf, die `fromModel` und `toModel` nennt, und
  `responseModel` der Nachricht meldet `claude-opus-4-8`.
- Anthropic rechnet pro Versuch ab: Eine Ablehnung vor der Ausgabe ist kostenlos, und die Wiederherstellung
  wird zu den Tarifen von Claude Opus 4.8 abgerechnet (derzeit halb so hoch wie die Tarife von Fable 5). Die
  Kostenschätzung von OpenClaw pro Anfrage berechnet über den Fallback bearbeitete Anfragen entsprechend zu Opus-Tarifen.
- Bei einer Ablehnung während des Streams wird aufseiten von Anthropic zusätzlich der bereits gestreamte Fable-Teil
  abgerechnet; dieser Anteil wird in der nutzungsbezogenen Aufschlüsselung pro Versuch der API ausgewiesen,
  fließt jedoch nicht in die Schätzung von OpenClaw pro Anfrage ein.

### Geltungsbereich

Gilt für `anthropic/claude-fable-5` mit API-Schlüssel-Authentifizierung gegenüber
`api.anthropic.com`. OAuth (Wiederverwendung des Claude-CLI-Abonnements), Proxy-Basis-URLs,
Bedrock-, Vertex- und Foundry-Anfragen bleiben unverändert und geben
Ablehnungen dort weiterhin als Fehler aus.

Live verifiziert: Eine harmlose Eingabeaufforderung, die Fable 5 auffordert, seine unverarbeitete Gedankenkette
wiederzugeben, wird beim Senden ohne Fallbacks mit `category: "reasoning_extraction"`
abgelehnt; dieselbe Eingabeaufforderung über OpenClaw liefert eine normale, von Opus bearbeitete
Antwort mit angehängter `provider_fallback`-Diagnose.

Siehe Anthropics [Leitfaden zu Ablehnungen und Fallbacks](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
zum zugrunde liegenden Verhalten.

## Prompt-Caching

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic für die Authentifizierung per API-Schlüssel.

| Wert               | Cache-Dauer | Beschreibung                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (Standard) | 5 Minuten      | Wird bei der Authentifizierung per API-Schlüssel automatisch angewendet |
| `"long"`            | 1 Stunde         | Erweiterter Cache                         |
| `"none"`            | Kein Caching     | Prompt-Caching deaktivieren                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cache-Überschreibungen pro Agent">
    Verwenden Sie die Parameter auf Modellebene als Ausgangsbasis und überschreiben Sie dann bestimmte Agenten über `agents.entries.*.params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Reihenfolge beim Zusammenführen der Konfiguration:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.entries.*.params` (bei übereinstimmender `id`, Überschreibung nach Schlüssel)

    Dadurch kann ein Agent einen langlebigen Cache beibehalten, während ein anderer Agent mit demselben Modell das Caching für stoßartigen Datenverkehr mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Hinweise zu Bedrock Claude">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren bei entsprechender Konfiguration die Durchleitung von `cacheRetention`.
    - Nicht von Anthropic stammende Bedrock-Modelle werden zur Laufzeit zwingend auf `cacheRetention: "none"` gesetzt.
    - Intelligente Standardwerte für API-Schlüssel legen außerdem `cacheRetention: "short"` für Claude-on-Bedrock-Referenzen fest, wenn kein expliziter Wert gesetzt ist.

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schnellmodus">
    Der gemeinsame `/fast`-Schalter von OpenClaw setzt für direkten Datenverkehr mit API-Schlüssel das Anthropic-Feld `service_tier` auf `api.anthropic.com`.

    | Befehl | Wird abgebildet auf |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Gilt nur für direkte `api.anthropic.com`-Anfragen, die mit einem API-Schlüssel gestellt werden. Anfragen mit OAuth-/Abonnement-Token und Proxy-Routen erhalten niemals ein `service_tier`-Feld.
    - Explizite Parameter `serviceTier` oder `service_tier` überschreiben `/fast`, wenn beide gesetzt sind.
    - Bei Konten ohne Kapazität für die Priority Tier kann `service_tier: "auto"` als `standard` aufgelöst werden.

    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bilder und PDF)">
    Das gebündelte Anthropic-Plugin registriert das Verständnis von Bildern und PDF-Dokumenten. OpenClaw
    ermittelt die Medienfunktionen automatisch anhand der konfigurierten Anthropic-Authentifizierung;
    es ist keine zusätzliche Konfiguration erforderlich.

    | Eigenschaft          | Wert                   |
    | -------------------- | ---------------------- |
    | Standardmodell       | `claude-opus-4-8`     |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente  |

    Wenn ein Bild oder PDF-Dokument an eine Unterhaltung angehängt wird, leitet OpenClaw
    es automatisch über den Anthropic-Provider für Medienverständnis weiter.

  </Accordion>

  <Accordion title="1M-Kontextfenster">
    Claude Sonnet 5, Mythos 5 und Fable 5 verfügen über ein Eingabefenster mit exakt
    1.000.000 Token und unterstützen bis zu 128.000 Ausgabe-Token. Das 1M-Kontextfenster
    von Anthropic ist außerdem allgemein verfügbar (GA) für Claude-4.x-Modelle mit adaptivem Denken:
    Opus 4.8, Opus 4.7, Opus 4.6 und Sonnet 4.6. OpenClaw dimensioniert diese Modelle
    automatisch; `params.context1m` ist nicht erforderlich:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Ältere Konfigurationen können `params.context1m: true` beibehalten; für
    diese Modelle hat dies keine Auswirkungen, und OpenClaw sendet den eingestellten
    `context-1m-2025-08-07`-Beta-Header ohnehin nicht mehr. Ältere `anthropicBeta`-Konfigurationseinträge
    mit diesem Wert werden bei der Auflösung der Anfrage-Header verworfen, und nicht
    unterstützte ältere Claude-Modelle behalten ihr normales Kontextfenster.

    `params.context1m: true` verhält sich für das Claude-CLI-Backend
    (`claude-cli/*`) genauso: Geeignete GA-fähige Opus- und Sonnet-Modelle erhalten
    das 1M-Fenster bereits automatisch, sodass der Parameter auch dort optional ist.

    <Warning>
    Erfordert Zugriff auf lange Kontexte für Ihre Anthropic-Anmeldedaten. Die OAuth-/Abonnementtoken-Authentifizierung behält ihre erforderlichen Anthropic-Beta-Header bei, OpenClaw entfernt jedoch den eingestellten 1M-Beta-Header, falls er noch in einer älteren Konfiguration enthalten ist.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 – 1M-Kontext">
    `anthropic/claude-opus-4-8` und dessen Variante `claude-cli` verfügen standardmäßig über ein
    1M-Kontextfenster; `params.context1m: true` ist nicht erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Die Anthropic-Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Einrichtungen stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für den Provider „anthropic“ gefunden'>
    Die Anthropic-Authentifizierung gilt **pro Agent**; neue Agenten übernehmen die Schlüssel des Hauptagenten nicht. Führen Sie das Onboarding für diesen Agenten erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und überprüfen Sie dies anschließend mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Anmeldedaten für das Profil „anthropic:default“ gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle in der Abklingzeit)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Abklingzeiten aufgrund von Anthropic-Ratenbegrenzungen können modellspezifisch sein, sodass ein anderes Anthropic-Modell möglicherweise weiterhin verwendet werden kann. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie, bis die Abklingzeit abgelaufen ist.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern und Modellreferenzen sowie Festlegung des Failover-Verhaltens.
  </Card>
  <Card title="CLI-Backends" href="/de/gateway/cli-backends" icon="terminal">
    Einrichtung des Claude-CLI-Backends und Details zur Laufzeit.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    Funktionsweise des Prompt-Cachings über verschiedene Provider hinweg.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln für die Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
