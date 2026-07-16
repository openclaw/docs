---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
    - Sie möchten Claude-CLI- oder Claude-Desktop-Sitzungen auf gekoppelten Computern durchsuchen
summary: Anthropic Claude über API-Schlüssel oder die Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T13:29:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic entwickelt die Modellfamilie **Claude**. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** – direkter Zugriff auf die Anthropic-API mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** – eine bestehende Claude-Code-Anmeldung auf demselben Host wiederverwenden

## Nutzungs- und Kostenverfolgung

OpenClaw erkennt die verfügbaren Anthropic-Anmeldedaten und wählt die passende Nutzungsansicht aus:

- Claude-Abonnement-/Einrichtungsanmeldedaten zeigen Kontingentzeiträume und ein optionales Budget für zusätzliche Nutzung an.
- `ANTHROPIC_ADMIN_KEY` oder `ANTHROPIC_ADMIN_API_KEY` zeigt in der Control UI unter **Nutzung** die von Anthropic gemeldeten Organisationskosten und die Nutzung der Messages API der letzten 30 Tage an, einschließlich täglicher Ausgaben, Token-/Cache-Gesamtwerte, meistgenutzter Modelle und Kostenkategorien.
- In einem Anthropic-Providerprofil gespeicherte `sk-ant-admin...`-Anmeldedaten werden automatisch als Admin-API-Schlüssel erkannt.

Der Kostenverlauf der Admin API stammt aus der [Usage and Cost API von Anthropic](https://platform.claude.com/docs/en/manage-claude/usage-cost-api). Dabei handelt es sich um die tatsächliche Providerabrechnung, getrennt von den aus OpenClaw-Sitzungen abgeleiteten geschätzten Kosten.

<Warning>
Das Claude-CLI-Backend von OpenClaw führt die installierte Claude Code CLI im
nicht interaktiven Ausgabemodus (`claude -p`) aus. Die aktuelle Dokumentation von Anthropic zu Claude Code
bezeichnet diesen Modus als Agent-SDK-/programmgesteuerte Nutzung. Mit einer Support-Aktualisierung vom 15. Juni 2026
setzte Anthropic die angekündigte separate Änderung der Agent-SDK-Abrechnung
aus: Die Nutzung des Claude Agent SDK, von `claude -p` und von Drittanbieter-Apps wird weiterhin auf die
Nutzungslimits eines angemeldeten Abonnements angerechnet, und das zuvor angekündigte monatliche
Agent-SDK-Guthaben ist nicht verfügbar, während Anthropic diesen Plan überarbeitet.

Die interaktive Nutzung von Claude Code wird weiterhin auf die Limits des angemeldeten Claude-Tarifs angerechnet.
Die Authentifizierung per API-Schlüssel wird direkt nach Nutzung abgerechnet und ist nicht von diesem Tarif abhängig.
Verwenden Sie für langlebige Gateway-Hosts, gemeinsam genutzte Automatisierung und vorhersehbare
Produktionsausgaben einen Anthropic-API-Schlüssel.

Die aktuellen Supportartikel von Anthropic können dieses Verhalten ohne eine
OpenClaw-Veröffentlichung ändern:

- [Claude-Code-CLI-Referenz](https://code.claude.com/docs/en/cli-usage)
- [Claude Agent SDK mit Ihrem Claude-Tarif verwenden](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code mit Ihrem Pro- oder Max-Tarif verwenden](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Tarif verwenden](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Kosten von Claude Code verwalten](https://code.claude.com/docs/en/costs)

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
    **Am besten geeignet für:** die Wiederverwendung einer bestehenden Claude-CLI-Anmeldung ohne separaten API-Schlüssel.

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

        OpenClaw erkennt die vorhandenen Claude-CLI-Anmeldedaten und verwendet sie wieder.
      </Step>
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Details zur Einrichtung und Laufzeit des Claude-CLI-Backends finden Sie unter [CLI-Backends](/de/gateway/cli-backends).
    </Note>

    <Warning>
    Für die Wiederverwendung von Claude CLI muss der OpenClaw-Prozess auf demselben Host wie die
    Claude-CLI-Anmeldung ausgeführt werden. Bei Docker-Installationen kann ein Container-Home-Verzeichnis dauerhaft gespeichert und dort eine Anmeldung bei
    Claude Code vorgenommen werden; siehe
    [Claude-CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).
    Andere Containerinstallationen wie [Podman](/de/install/podman) binden das
    hostseitige `~/.claude` weder bei der Einrichtung noch zur Laufzeit ein; verwenden Sie dort einen Anthropic-API-Schlüssel oder wählen Sie
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

    Bevorzugen Sie die kanonische Anthropic-Modellreferenz zusammen mit einer CLI-Laufzeitüberschreibung:

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
    `anthropic/*` beibehalten und das Ausführungs-Backend in der Laufzeitrichtlinie des Providers/Modells festlegen.

    ### Abrechnung und `claude -p`

    OpenClaw verwendet für Claude-CLI-Ausführungen den nicht interaktiven `claude -p`-Pfad von Claude Code.
    Anthropic behandelt diesen Pfad derzeit als Agent-SDK-/programmgesteuerte Nutzung:

    - Mit der Support-Aktualisierung von Anthropic vom 15. Juni 2026 wurde der zuvor angekündigte
      separate Guthabenplan für das Agent SDK ausgesetzt.
    - Die Nutzung des Claude Agent SDK, von `claude -p` und von Drittanbieter-Apps im Rahmen eines Abonnementtarifs
      wird weiterhin auf die Nutzungslimits des angemeldeten Abonnements angerechnet.
    - Das zuvor angekündigte monatliche Agent-SDK-Guthaben ist nicht verfügbar, während
      Anthropic diesen Plan überarbeitet.
    - Anmeldungen über die Console oder per API-Schlüssel verwenden die nutzungsbasierte API-Abrechnung und erhalten
      das Agent-SDK-Guthaben des Abonnements nicht.

    Den Hinweis zur Aussetzung finden Sie im [Artikel von Anthropic zum Agent-SDK-Tarif](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan).
    Informationen zum Abonnementverhalten finden Sie außerdem in den Claude-Code-Tarifartikeln für
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    und
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic kann das Abrechnungs- und Ratenbegrenzungsverhalten von Claude Code ohne eine
    OpenClaw-Veröffentlichung ändern. Prüfen Sie `claude auth status`, `/status` und
    die verlinkte Dokumentation von Anthropic, wenn die Vorhersehbarkeit der Abrechnung wichtig ist.

    <Tip>
    Verwenden Sie für gemeinsam genutzte Produktionsautomatisierung statt
    Claude CLI einen Anthropic-API-Schlüssel. OpenClaw unterstützt außerdem abonnementartige Optionen von
    [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Claude-Sitzungen auf mehreren Computern

Das gebündelte Anthropic-Plugin fügt der normalen Sitzungsseitenleiste eine Gruppe **Claude Code**
hinzu. Zeilen werden im normalen Chat-Bereich geöffnet. Das Plugin erkennt nicht archivierte Claude-
Code-Sitzungen auf dem Gateway und auf verbundenen Node-Hosts:

- Claude-CLI-Sitzungen stammen aus gültigen Projektindexeinträgen und aktuellen JSONL-
  Dateien, deren begrenztes Metadatenpräfix eine Nicht-Sidechain-Sitzung vom Typ `sdk-cli`
  unter `~/.claude/projects/` identifiziert.
- Claude-Desktop-Sitzungen verwenden den Desktop-Titel, den Aktivitätszeitpunkt und den
  Archivstatus, wenn ihre Metadaten auf dieselbe Claude-Code-Sitzungs-ID verweisen.
- Eine reine CLI-Sitzung besitzt kein Archivkennzeichen und bleibt daher sichtbar, solange ihr
  Transkript vorhanden ist.

Für die Erkennung ist keine zusätzliche OpenClaw-Konfiguration erforderlich. Das Anthropic-Plugin
ist gebündelt und standardmäßig aktiviert; eine native macOS-Node stellt die schreibgeschützten
Claude-Sitzungsbefehle bereit, wenn das lokale Verzeichnis `~/.claude/projects/` vorhanden ist.
Genehmigen Sie das Upgrade der Node-Kopplung, wenn diese Befehle erstmals angezeigt werden.

Die Seitenleiste gruppiert Zeilen nach ihrem Gateway- oder gekoppelten Node-Host, beginnt mit der
neuesten begrenzten Seite jedes Hosts und wird im normalen Intervall von 30 Sekunden
aktualisiert. Verwenden Sie **Weitere Sitzungen laden** unter einer Kataloggruppe, um für
jeden Host mit weiterem Verlauf die nächste Seite anzuhängen; angehängte Zeilen bleiben sichtbar und werden
bei Aktualisierungen erneut bis zur gleichen Tiefe abgerufen. Katalogclients verwenden
`sessions.catalog.list`; beim Öffnen einer Zeile wird `sessions.catalog.read` verwendet.

Bei der Übernahme durch das Terminal wird `claude` anhand des PATH der Anmeldeshell des Benutzers
des zuständigen Hosts aufgelöst, bevor der PATH des Dienstes/Daemons verwendet wird. Dadurch entsprechen von der App gestartete Sitzungen
der Claude CLI, die dem Betreiber in einem normalen Terminal zur Verfügung steht.

Beim Auswählen einer Zeile wird zuerst die neueste Transkriptseite gelesen. **Ältere Transkriptelemente
laden** folgt einem undurchsichtigen Byte-Cursor und liest einen weiteren begrenzten Abschnitt aus der
JSONL-Datei, anstatt den gesamten Verlauf zu laden. Normale Inhalte von Benutzern und Assistenten sowie
Reasoning-, Tool-Aufruf- und Tool-Ergebnisinhalte bleiben erhalten. Ein einzelnes Element,
das die Sicherheitsobergrenze der Node/des Gateways überschreitet, wird deutlich als gekürzt gekennzeichnet.

Wenn Sie in einer Gateway-lokalen `claude-cli`-Zeile im normalen Eingabefeld Text eingeben, wird
`sessions.catalog.continue` aufgerufen. OpenClaw löst den lokalen Katalogeintrag erneut auf,
erstellt eine modellgebundene native Sitzung oder verwendet sie wieder, importiert höchstens 200 sichtbare
Elemente oder 512 KiB und initialisiert die Claude-CLI-Bindung. Der erste Durchlauf wird mit
`--fork-session` fortgesetzt; Claude weist der Abzweigung eine neue Sitzungs-ID zu, sodass spätere Durchläufe
die Abzweigung verwenden und die Quellsitzung unverändert bleibt.

Ein Headless-Node-Host kann seine Claude-CLI-Zeilen ebenfalls fortsetzbar machen, indem die
folgende lokale Node-Einstellung aktiviert und der Node-Host neu gestartet wird:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Die Node stellt `agent.cli.claude.run.v1` nur bereit, wenn die Einstellung aktiviert ist
und die lokale ausführbare Datei `claude` aufgelöst werden kann. OpenClaw löst den Katalogeintrag
auf dieser Node erneut auf, importiert denselben begrenzten Verlauf und bindet die übernommene
Sitzung an die Node und das vom Katalog gemeldete Arbeitsverzeichnis. Jeder Durchlauf führt den
echten `claude -p`-Prozess der Node mit den Claude-Dateien und der Anmeldung dieser Node aus. Die
Richtlinie der Node für Ausführungsgenehmigungen gilt weiterhin; das Gateway kann die Aktivierung nicht erzwingen.

Die Node-Fortsetzung v1 ist nur einmalig möglich. Sie lässt die Gateway-Loopback-MCP-Konfiguration und
Argumente des Gateway-Skills-Plugins aus, initialisiert nicht erneut aus einem Gateway-Transkript und
lehnt Anhänge und Bilder ab. Claude-Desktop-Zeilen bleiben schreibgeschützt. Native
macOS-App-Nodes bleiben ebenfalls schreibgeschützt, bis die App den Ausführungsbefehl bereitstellt.

<Note>
Claude-Sitzungen gekoppelter Nodes bleiben schreibgeschützt, sofern die Headless-Node nicht ausdrücklich
`agent.cli.claude.run.v1` bereitstellt. OpenClaw ändert niemals Metadaten von Claude Desktop
und archiviert keine Claude-Sitzungen. Die Seite erfordert eine Betreiberverbindung
mit Schreibberechtigung, da sie authentifiziertes `node.invoke` verwendet; Auflisten und Lesen
bleiben auch auf einer Node mit aktivierter Fortsetzung schreibgeschützt.
</Note>

Weitere Informationen zum Node-Befehl und zur Sicherheitsgrenze finden Sie unter [Nodes: Claude-Sitzungen und Transkripte](/de/nodes#claude-sessions-and-transcripts).

## Standardwerte für Thinking (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 und 4.6)

`anthropic/claude-sonnet-5` verwendet standardmäßig adaptives Denken mit dem Aufwand `high`.
Verwenden Sie `/think off`, um das Denken zu deaktivieren, oder `/think xhigh|max` für die
höheren nativen Aufwandsstufen des Modells. OpenClaw lässt manuelle Denkbudgets, benutzerdefinierte
Sampling-Parameter, Vorbefüllungen für den Assistenten und Priority Tier für Sonnet 5 weg, da
Anthropic diese Anfragefunktionen für dieses Modell nicht unterstützt.
Der Katalog verwendet bis zum 31. August 2026 die Einführungspreise von Anthropic für Ein- und Ausgabe von `$2/$10`;
ab dem 1. September 2026 gelten die Standardpreise von `$3/$15`.

`anthropic/claude-fable-5` verwendet immer adaptives Denken und standardmäßig den Aufwand `high`.
Anthropic lässt für dieses Modell keine Deaktivierung des Denkens zu, daher
werden `/think off` und `/think minimal` stattdessen dem Aufwand `low` zugeordnet. OpenClaw lässt außerdem
benutzerdefinierte Temperaturwerte für Fable-5-Anfragen weg, da Anthropic
eine Überschreibung der Temperatur bei jeder Anfrage mit aktiviertem Denken ablehnt.

`anthropic/claude-mythos-5` ist ein Modell mit eingeschränktem Zugriff und demselben Vertrag für
stets aktives adaptives Denken. OpenClaw verwendet standardmäßig `high`, ordnet `/think off` und
`/think minimal` `low` zu und lässt vom Aufrufer ausgewählte Sampling-Parameter weg.
Der Katalog veröffentlicht das Kontextfenster mit 1.000.000 Token, das Ausgabelimit
von 128.000 Token, die Bildeingabe und die Ein-/Ausgabepreise von `$10/$50`.

Bei Claude Opus 4.8 bleibt das Denken in OpenClaw standardmäßig deaktiviert. Wenn Sie
adaptives Denken ausdrücklich mit `/think high|xhigh|max` aktivieren, sendet OpenClaw
die Aufwandswerte von Anthropic für Opus 4.8; Claude-4.6-Modelle (Opus 4.6 und Sonnet 4.6)
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
Zugehörige Dokumentation von Anthropic:
- [Adaptives Denken](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Erweitertes Denken](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Sicherheitsbedingter Ablehnungs-Fallback (Claude Fable 5)

<Warning>
Die Verwendung von Claude Fable 5 bedeutet zugleich die Verwendung von Claude Opus 4.8. Fable 5 wird mit
Sicherheitsklassifikatoren ausgeliefert, die eine Anfrage ablehnen können; die von Anthropic vorgesehene
Wiederherstellung besteht darin, diese Anfrage von `claude-opus-4-8` bearbeiten zu lassen. OpenClaw aktiviert dies
automatisch für direkte Anfragen mit API-Schlüssel, sodass einige Fable-Anfragen
von Claude Opus 4.8 beantwortet und entsprechend abgerechnet werden. Wenn Ihre Richtlinien oder Ihr Budget
keine von Opus bearbeiteten Anfragen zulassen, wählen Sie `anthropic/claude-fable-5` nicht aus.
</Warning>

### Warum dies existiert

Die Klassifikatoren von Fable 5 geben bei Anfragen in eingeschränkten
Bereichen `stop_reason: "refusal"` zurück und erzeugen zudem falsch positive Ergebnisse bei harmlosen, angrenzenden Aufgaben
(Sicherheitswerkzeuge, Biowissenschaften oder sogar bei der Aufforderung an das Modell, seine
unverarbeitete Schlussfolgerung wiederzugeben). Ohne einen Fallback schlägt die Anfrage mit einem Fehler fehl, obwohl
ein anderes Claude-Modell sie problemlos bearbeiten würde – die Ablehnungsmeldung von Anthropic selbst
weist API-Integratoren an, ein Fallback-Modell zu konfigurieren.

### Funktionsweise

1. Für jede direkte Anfrage mit API-Schlüssel an `anthropic/claude-fable-5` sendet OpenClaw
   die serverseitige Fallback-Aktivierung von Anthropic: den
   Beta-Header `server-side-fallback-2026-06-01` sowie
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 ist das einzige
   Fallback-Ziel, das Anthropic für Fable 5 zulässt.
2. Nur eine Ablehnung durch den Sicherheitsklassifikator löst den Fallback aus. Ratenbegrenzungen,
   Überlastungen und Serverfehler verhalten sich genau wie zuvor und durchlaufen
   OpenClaws normalen [Modell-Failover](/de/concepts/model-failover).
3. Die Wiederherstellung erfolgt innerhalb desselben Aufrufs. Eine Ablehnung vor jeglicher Ausgabe ist
   abgesehen von der Latenz nicht sichtbar; die gesamte Antwort stammt von Opus 4.8. Bei einer
   Ablehnung während des Streams bleibt der Teiltext als Präfix erhalten, an das das Fallback-Modell
   anknüpft, während die Schlussfolgerungen und Werkzeugaufrufe des ablehnenden Modells
   gemäß den Wiedergaberegeln von Anthropic verworfen werden (sie dürfen weder zurückgegeben noch
   ausgeführt werden).
4. Wenn auch Claude Opus 4.8 ablehnt, wird die Ablehnung für die Anfrage
   genau wie vor dieser Funktion als Fehler ausgegeben.

Der Fallback erfolgt auf Ebene der Anthropic-API, daher muss `claude-opus-4-8` nicht
in Ihrer konfigurierten Modellliste oder Fallback-Kette enthalten sein – ein API-Schlüssel
mit Fable-Berechtigung kann Opus stets verwenden.

### Beobachtbarkeit und Abrechnung

- Eine per Fallback bearbeitete Anfrage zeichnet in der
  Assistentennachricht eine Diagnose vom Typ `provider_fallback` auf, die `fromModel` und `toModel` nennt; der
  Wert `responseModel` der Nachricht gibt `claude-opus-4-8` an.
- Anthropic rechnet pro Versuch ab: Eine Ablehnung vor der Ausgabe ist kostenlos, und die Wiederherstellung
  wird zu den Tarifen von Claude Opus 4.8 abgerechnet (derzeit halb so hoch wie die Tarife von Fable 5). Die
  Kostenschätzung von OpenClaw pro Anfrage berechnet per Fallback bearbeitete Anfragen entsprechend zu Opus-Tarifen.
- Bei einer Ablehnung während des Streams wird zusätzlich der bereits gestreamte Fable-Teil
  seitens Anthropic abgerechnet; dieser Anteil wird in der API-Nutzung pro Versuch
  ausgewiesen, fließt jedoch nicht in die Kostenschätzung von OpenClaw pro Anfrage ein.

### Geltungsbereich

Gilt für `anthropic/claude-fable-5` mit API-Schlüssel-Authentifizierung gegenüber
`api.anthropic.com`. OAuth (Wiederverwendung eines Claude-CLI-Abonnements), Proxy-Basis-URLs,
Bedrock-, Vertex- und Foundry-Anfragen bleiben unverändert und geben
Ablehnungen weiterhin als Fehler aus.

Live verifiziert: Eine harmlose Eingabeaufforderung, die Fable 5 auffordert, seine unverarbeitete
Gedankenkette wiederzugeben, wird beim Senden ohne Fallbacks mit `category: "reasoning_extraction"`
abgelehnt; dieselbe Eingabeaufforderung über OpenClaw liefert eine normale, von Opus bearbeitete
Antwort mit angehängter Diagnose `provider_fallback`.

Das zugrunde liegende Verhalten wird im [Leitfaden zu Ablehnungen und Fallbacks
von Anthropic](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) beschrieben.

## Prompt-Caching

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic für die Authentifizierung per API-Schlüssel.

| Wert                | Cache-Dauer    | Beschreibung                                      |
| ------------------- | -------------- | ------------------------------------------------- |
| `"short"` (Standard) | 5 Minuten      | Wird bei API-Schlüssel-Authentifizierung automatisch angewendet |
| `"long"`            | 1 Stunde       | Erweiterter Cache                                 |
| `"none"`            | Kein Caching   | Prompt-Caching deaktivieren                       |

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
    Verwenden Sie Parameter auf Modellebene als Ausgangsbasis und überschreiben Sie anschließend bestimmte Agenten über `agents.list[].params`:

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

    Reihenfolge der Konfigurationszusammenführung:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (bei Übereinstimmung mit `id`, Überschreibung nach Schlüssel)

    Dadurch kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent beim selben Modell das Caching für stoßartigen Datenverkehr mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Hinweise zu Bedrock Claude">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren die Durchleitung von `cacheRetention`, wenn dies konfiguriert ist.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` festgelegt.
    - Intelligente API-Schlüssel-Standardwerte setzen außerdem `cacheRetention: "short"` für Claude-on-Bedrock-Referenzen, wenn kein expliziter Wert festgelegt ist.

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schnellmodus">
    Der gemeinsame `/fast`-Schalter von OpenClaw setzt das Anthropic-Feld `service_tier` für direkten API-Schlüssel-Datenverkehr auf `api.anthropic.com`.

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
    - Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.

    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bilder und PDF)">
    Das gebündelte Anthropic-Plugin registriert das Verständnis von Bildern und PDF-Dateien. OpenClaw
    ermittelt Medienfunktionen automatisch aus der konfigurierten Anthropic-Authentifizierung; es ist
    keine zusätzliche Konfiguration erforderlich.

    | Eigenschaft          | Wert                  |
    | -------------------- | --------------------- |
    | Standardmodell       | `claude-opus-4-8`     |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder eine PDF-Datei an eine Unterhaltung angehängt wird, leitet OpenClaw
    sie automatisch über den Anthropic-Provider für Medienverständnis weiter.

  </Accordion>

  <Accordion title="1M-Kontextfenster">
    Claude Sonnet 5, Mythos 5 und Fable 5 verfügen über ein Eingabefenster mit exakt
    1,000,000 Token und unterstützen bis zu 128,000 Ausgabe-Token. Das 1M-Kontextfenster
    von Anthropic ist außerdem für Claude-4.x-Modelle mit adaptivem Denken allgemein verfügbar:
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
    diese Modelle ist dies eine harmlose wirkungslose Einstellung, und OpenClaw sendet den eingestellten
    `context-1m-2025-08-07`-Beta-Header unabhängig davon nicht mehr. Ältere `anthropicBeta`-Konfigurationseinträge
    mit diesem Wert werden bei der Auflösung der Anfrage-Header verworfen, und
    nicht unterstützte ältere Claude-Modelle behalten ihr normales Kontextfenster bei.

    `params.context1m: true` verhält sich für das Claude-CLI-Backend
    (`claude-cli/*`) genauso: Geeignete GA-fähige Opus- und Sonnet-Modelle erhalten das
    1M-Fenster bereits automatisch, sodass der Parameter auch dort optional ist.

    <Warning>
    Erfordert Zugriff auf lange Kontexte für Ihre Anthropic-Anmeldedaten. Die Authentifizierung per OAuth-/Abonnement-Token behält ihre erforderlichen Anthropic-Beta-Header bei, OpenClaw entfernt jedoch den eingestellten 1M-Beta-Header, falls er in älteren Konfigurationen noch vorhanden ist.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 mit 1M-Kontext">
    `anthropic/claude-opus-4-8` und seine `claude-cli`-Variante verfügen standardmäßig über ein
    1M-Kontextfenster; `params.context1m: true` ist nicht erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Die Anthropic-Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Einrichtungen stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für Provider "anthropic" gefunden'>
    Die Anthropic-Authentifizierung gilt **pro Agent**; neue Agenten übernehmen die Schlüssel des Hauptagenten nicht. Führen Sie das Onboarding für diesen Agenten erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und überprüfen Sie dies anschließend mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Anmeldedaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle in Abklingzeit)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Abklingzeiten aufgrund von Anthropic-Ratenbegrenzungen können modellspezifisch sein, sodass ein anderes Anthropic-Modell weiterhin nutzbar sein kann. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie das Ende der Abklingzeit ab.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern und Modellreferenzen sowie Konfiguration des Failover-Verhaltens.
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
