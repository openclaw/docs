---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
    - Sie möchten Claude-CLI- oder Claude-Desktop-Sitzungen auf gekoppelten Computern durchsuchen
summary: Anthropic Claude über API-Schlüssel oder die Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-07-12T15:40:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f15c88c33120f64d0c1c64b291380f4b8824c13262ba0b2a57662003cfb26adc
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic entwickelt die **Claude**-Modellfamilie. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** – direkter Zugriff auf die Anthropic-API mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** – eine vorhandene Claude-Code-Anmeldung auf demselben Host wiederverwenden

## Nutzungs- und Kostenverfolgung

OpenClaw erkennt die verfügbaren Anthropic-Anmeldedaten und wählt die passende Nutzungsansicht aus:

- Anmeldedaten für Claude-Abonnements bzw. die Einrichtung zeigen Kontingentzeiträume und ein optionales Budget für zusätzliche Nutzung an.
- `ANTHROPIC_ADMIN_KEY` oder `ANTHROPIC_ADMIN_API_KEY` zeigt in der Control UI unter **Nutzung** 30 Tage der vom Provider gemeldeten Organisationskosten und Messages-API-Nutzung an, einschließlich täglicher Ausgaben, Token-/Cache-Gesamtsummen, meistgenutzter Modelle und Kostenkategorien.
- In einem Anthropic-Providerprofil gespeicherte `sk-ant-admin...`-Anmeldedaten werden automatisch als Admin-API-Schlüssel erkannt.

Der Kostenverlauf der Admin API stammt aus der [Nutzungs- und Kosten-API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) von Anthropic. Dabei handelt es sich um die tatsächliche Abrechnung des Providers, getrennt von den aus OpenClaw-Sitzungen abgeleiteten geschätzten Kosten.

<Warning>
Das Claude-CLI-Backend von OpenClaw führt die installierte Claude Code CLI im
nicht interaktiven Ausgabemodus (`claude -p`) aus. Die aktuelle Dokumentation
von Anthropic zu Claude Code beschreibt diesen Modus als Agent-SDK- bzw.
programmatische Nutzung. Mit einem Support-Update vom 15. Juni 2026 setzte
Anthropic die angekündigte separate Änderung der Agent-SDK-Abrechnung aus:
Claude Agent SDK, `claude -p` und die Nutzung durch Drittanbieter-Apps werden
weiterhin auf die Nutzungslimits eines angemeldeten Abonnements angerechnet,
und das zuvor angekündigte monatliche Agent-SDK-Guthaben ist nicht verfügbar,
während Anthropic diesen Plan überarbeitet.

Die interaktive Nutzung von Claude Code wird weiterhin auf die Limits des
angemeldeten Claude-Tarifs angerechnet. Die Authentifizierung per API-Schlüssel
wird direkt nach Nutzung abgerechnet und hängt nicht von diesem Tarif ab.
Verwenden Sie für langlebige Gateway-Hosts, gemeinsam genutzte Automatisierung
und planbare Produktionsausgaben einen Anthropic-API-Schlüssel.

Die aktuellen Supportartikel von Anthropic können dieses Verhalten ohne eine
OpenClaw-Veröffentlichung ändern:

- [Claude-Code-CLI-Referenz](https://code.claude.com/docs/en/cli-usage)
- [Claude Agent SDK mit Ihrem Claude-Tarif verwenden](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code mit Ihrem Pro- oder Max-Tarif verwenden](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Tarif verwenden](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude-Code-Kosten verwalten](https://code.claude.com/docs/en/costs)

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
        # auswählen: Anthropic-API-Schlüssel
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

        OpenClaw erkennt die vorhandenen Claude-CLI-Anmeldedaten und verwendet sie wieder.
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
    Die Wiederverwendung der Claude CLI setzt voraus, dass der OpenClaw-Prozess
    auf demselben Host wie die Claude-CLI-Anmeldung ausgeführt wird.
    Docker-Installationen können ein Container-Home-Verzeichnis dauerhaft
    speichern und Claude Code dort anmelden; siehe
    [Claude-CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).
    Andere Container-Installationen wie [Podman](/de/install/podman) binden das
    hostseitige `~/.claude` weder bei der Einrichtung noch zur Laufzeit ein;
    verwenden Sie dort einen Anthropic-API-Schlüssel oder wählen Sie einen
    Provider mit von OpenClaw verwaltetem OAuth, beispielsweise
    [OpenAI Codex](/de/providers/openai).
    </Warning>

    ### Konfigurationsbeispiel

    Verwenden Sie vorzugsweise die kanonische Anthropic-Modellreferenz zusammen mit einer CLI-Laufzeitüberschreibung:

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

    Veraltete Modellreferenzen vom Typ `claude-cli/claude-opus-4-7`
    funktionieren aus Kompatibilitätsgründen weiterhin. Neue Konfigurationen
    sollten die Provider-/Modellauswahl jedoch als `anthropic/*` beibehalten
    und das Ausführungs-Backend in der Provider-/Modell-Laufzeitrichtlinie
    festlegen.

    ### Abrechnung und `claude -p`

    OpenClaw verwendet für Claude-CLI-Ausführungen den nicht interaktiven
    `claude -p`-Pfad von Claude Code. Anthropic behandelt diesen Pfad derzeit
    als Agent-SDK- bzw. programmatische Nutzung:

    - Mit dem Support-Update vom 15. Juni 2026 setzte Anthropic den zuvor
      angekündigten separaten Agent-SDK-Guthabenplan aus.
    - Die Nutzung von Claude Agent SDK, `claude -p` und Drittanbieter-Apps mit
      einem Abonnementtarif wird weiterhin auf die Nutzungslimits des
      angemeldeten Abonnements angerechnet.
    - Das zuvor angekündigte monatliche Agent-SDK-Guthaben ist nicht verfügbar,
      während Anthropic diesen Plan überarbeitet.
    - Anmeldungen über die Console bzw. mit API-Schlüssel verwenden eine
      nutzungsbasierte API-Abrechnung und erhalten kein Agent-SDK-Guthaben des
      Abonnements.

    Den Hinweis zur Aussetzung finden Sie im [Artikel zum Agent-SDK-Tarif
    ](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    von Anthropic. Informationen zum Verhalten der Abonnements finden Sie in den
    Claude-Code-Tarifartikeln für
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    und
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic kann die Abrechnung und das Ratenbegrenzungsverhalten von Claude
    Code ohne eine OpenClaw-Veröffentlichung ändern. Prüfen Sie `claude auth status`,
    `/status` und die verlinkte Dokumentation von Anthropic, wenn eine
    vorhersehbare Abrechnung wichtig ist.

    <Tip>
    Verwenden Sie für gemeinsam genutzte Produktionsautomatisierung einen
    Anthropic-API-Schlüssel anstelle der Claude CLI. OpenClaw unterstützt auch
    abonnementbasierte Optionen von [OpenAI Codex](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und
    [Z.AI / GLM](/de/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Claude-Sitzungen auf mehreren Computern

Das gebündelte Anthropic-Plugin fügt der normalen Sitzungsseitenleiste eine
Gruppe **Claude Code** hinzu. Zeilen werden im normalen Chat-Bereich geöffnet.
Es erkennt nicht archivierte Claude-Code-Sitzungen auf dem Gateway und auf
verbundenen Node-Hosts:

- Claude-CLI-Sitzungen stammen aus gültigen Projektindex-Datensätzen und
  aktuellen JSONL-Dateien, deren begrenztes Metadatenpräfix eine
  Nicht-Sidechain-Sitzung vom Typ `sdk-cli` unter `~/.claude/projects/`
  identifiziert.
- Claude-Desktop-Sitzungen verwenden den Desktop-Titel, die Aktivitätszeit und
  den Archivstatus, wenn ihre Metadaten auf dieselbe Claude-Code-Sitzungs-ID
  verweisen.
- Eine ausschließlich über die CLI bestehende Sitzung besitzt kein
  Archivkennzeichen und bleibt daher sichtbar, solange ihr Transkript vorhanden
  ist.

Es ist keine zusätzliche OpenClaw-Konfiguration erforderlich. Das
Anthropic-Plugin ist gebündelt und standardmäßig aktiviert; eine native
macOS-Node kündigt die schreibgeschützten Claude-Sitzungsbefehle an, wenn das
lokale Verzeichnis `~/.claude/projects/` vorhanden ist. Genehmigen Sie das
Upgrade der Node-Kopplung, wenn diese Befehle erstmals angezeigt werden.

Die Seitenleiste beginnt mit der neuesten begrenzten Seite jedes Hosts und wird
im normalen 30-Sekunden-Takt aktualisiert. Verwenden Sie unterhalb einer
Kataloggruppe **Weitere Sitzungen laden**, um für jeden Host mit weiterem
Verlauf die nächste Seite anzuhängen; angehängte Zeilen bleiben sichtbar und
werden bei Aktualisierungen erneut bis zur gleichen Tiefe abgerufen.
Katalogclients verwenden `sessions.catalog.list`; beim Öffnen einer Zeile wird
`sessions.catalog.read` verwendet.

Beim Auswählen einer Zeile wird zuerst die neueste Transkriptseite gelesen.
**Ältere Transkripteinträge laden** folgt einem undurchsichtigen Byte-Cursor und
liest einen weiteren begrenzten Abschnitt aus der JSONL-Datei, anstatt den
gesamten Verlauf zu laden. Normale Inhalte von Benutzern, Assistenten,
Reasoning, Tool-Aufrufen und Tool-Ergebnissen bleiben erhalten. Ein einzelner
Eintrag, der größer als die Sicherheitsobergrenze der Node bzw. des Gateways
ist, wird eindeutig als abgeschnitten gekennzeichnet.

Wenn Sie in einer Gateway-lokalen `claude-cli`-Zeile Text in den normalen
Eingabebereich eingeben, wird `sessions.catalog.continue` aufgerufen. OpenClaw
löst den lokalen Katalogdatensatz erneut auf, erstellt eine modellgebundene
native Sitzung oder verwendet sie wieder, importiert höchstens 200 sichtbare
Einträge oder 512 KiB und initialisiert die Claude-CLI-Bindung. Der erste
Durchlauf wird mit `--fork-session` fortgesetzt; Claude weist der Abspaltung
eine neue Sitzungs-ID zu, sodass spätere Durchläufe die Abspaltung verwenden und
die Quellsitzung unverändert bleibt. Zeilen von Claude Desktop und gekoppelten
Nodes sind schreibgeschützt.

<Note>
Claude-Sitzungen auf gekoppelten Nodes sind schreibgeschützt. OpenClaw ändert
keine Claude-Desktop-Metadaten, archiviert keine Claude-Sitzungen und startet
keinen zweiten Runner auf dem zugehörigen Computer. Die Seite erfordert eine
Operatorverbindung mit Schreibberechtigung, da sie den authentifizierten
`node.invoke`-Transport verwendet, obwohl beide Claude-Node-Befehle
schreibgeschützt sind.
</Note>

Weitere Informationen zum Node-Befehl und zur Sicherheitsgrenze finden Sie
unter [Nodes: Claude-Sitzungen und Transkripte](/de/nodes#claude-sessions-and-transcripts).

## Standardwerte für Thinking (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 und 4.6)

`anthropic/claude-sonnet-5` verwendet standardmäßig adaptives Thinking mit dem
Aufwand `high`. Verwenden Sie `/think off`, um Thinking zu deaktivieren, oder
`/think xhigh|max` für die höheren nativen Aufwandsstufen des Modells. OpenClaw
lässt manuelle Thinking-Budgets, benutzerdefinierte Sampling-Parameter,
Assistenten-Prefills und Priority Tier für Sonnet 5 aus, da Anthropic diese
Anfragefunktionen bei diesem Modell nicht unterstützt.
Der Katalog verwendet bis zum 31. August 2026 die Einführungspreise von
Anthropic in Höhe von `$2/$10` für Ein-/Ausgabe; die Standardpreise von
`$3/$15` gelten ab dem 1. September 2026.

`anthropic/claude-fable-5` verwendet immer adaptives Thinking und standardmäßig
den Aufwand `high`. Anthropic lässt bei diesem Modell keine Deaktivierung von
Thinking zu, daher werden `/think off` und `/think minimal` stattdessen dem
Aufwand `low` zugeordnet. OpenClaw lässt außerdem benutzerdefinierte
Temperaturwerte für Fable-5-Anfragen aus, da Anthropic eine
Temperaturüberschreibung bei jeder Anfrage mit aktiviertem Thinking ablehnt.

`anthropic/claude-mythos-5` ist ein Modell mit eingeschränktem Zugriff und
demselben Vertrag für dauerhaft aktiviertes adaptives Thinking. OpenClaw
verwendet standardmäßig `high`, ordnet `/think off` und `/think minimal` `low`
zu und lässt vom Aufrufer ausgewählte Sampling-Parameter aus.
Der Katalog veröffentlicht sein Kontextfenster mit 1.000.000 Token, sein
Ausgabelimit von 128.000 Token, die Bildeingabe und die Ein-/Ausgabepreise von
`$10/$50`.

Bei Claude Opus 4.8 ist Thinking in OpenClaw standardmäßig deaktiviert. Wenn Sie
adaptives Thinking ausdrücklich mit `/think high|xhigh|max` aktivieren, sendet
OpenClaw die Aufwandswerte von Anthropic für Opus 4.8; Claude-4.6-Modelle
(Opus 4.6 und Sonnet 4.6) verwenden standardmäßig `adaptive`.

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
- [Adaptives Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Erweitertes Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Fallback bei sicherheitsbedingter Ablehnung (Claude Fable 5)

<Warning>
Die Verwendung von Claude Fable 5 bedeutet zugleich die Verwendung von Claude Opus 4.8. Fable 5 wird mit
Sicherheitsklassifikatoren ausgeliefert, die eine Anfrage ablehnen können, und die von Anthropic vorgesehene
Wiederherstellung besteht darin, diese Anfrage von `claude-opus-4-8` bearbeiten zu lassen. OpenClaw aktiviert dies
bei direkten Anfragen mit API-Schlüssel automatisch, sodass einige Fable-Anfragen
von Claude Opus 4.8 beantwortet und entsprechend abgerechnet werden. Wenn Ihre Richtlinien oder Ihr Budget
keine von Opus bearbeiteten Anfragen zulassen, wählen Sie
`anthropic/claude-fable-5` nicht aus.
</Warning>

### Warum dies existiert

Die Klassifikatoren von Fable 5 geben bei Anfragen in eingeschränkten
Bereichen `stop_reason: "refusal"` zurück und erzeugen außerdem Fehlalarme bei harmlosen, angrenzenden Aufgaben
(Sicherheitstools, Biowissenschaften oder sogar bei der Aufforderung an das Modell, seine unverarbeiteten
Gedankengänge wiederzugeben). Ohne Fallback endet die Anfrage mit einem Fehler, obwohl
ein anderes Claude-Modell sie problemlos bearbeiten könnte – Anthropic weist API-Integratoren in der eigenen Ablehnungsmeldung
darauf hin, ein Fallback-Modell zu konfigurieren.

### Funktionsweise

1. Bei jeder direkten Anfrage mit API-Schlüssel an `anthropic/claude-fable-5` sendet OpenClaw
   die serverseitige Fallback-Einwilligung von Anthropic: den Beta-Header
   `server-side-fallback-2026-06-01` sowie
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 ist das einzige
   Fallback-Ziel, das Anthropic für Fable 5 zulässt.
2. Nur eine Ablehnung durch den Sicherheitsklassifikator löst den Fallback aus. Ratenbegrenzungen,
   Überlastungen und Serverfehler verhalten sich unverändert und durchlaufen
   den normalen [Modell-Failover](/de/concepts/model-failover) von OpenClaw.
3. Die Wiederherstellung erfolgt innerhalb desselben Aufrufs. Eine Ablehnung vor jeglicher Ausgabe ist
   abgesehen von der Latenz nicht sichtbar; die gesamte Antwort stammt von Opus 4.8. Bei einer
   Ablehnung während des Streams bleibt der unvollständige Text als Präfix erhalten, ab dem das Fallback-Modell
   fortfährt, während die Gedankengänge und Tool-Aufrufe des ablehnenden Modells
   gemäß den Wiedergaberegeln von Anthropic verworfen werden (sie dürfen weder zurückgegeben noch
   ausgeführt werden).
4. Wenn auch Claude Opus 4.8 ablehnt, wird die Ablehnung wie vor dieser Funktion
   als Fehler für die Anfrage ausgegeben.

Der Fallback erfolgt auf Ebene der Anthropic-API, daher muss `claude-opus-4-8`
nicht in Ihrer konfigurierten Modellliste oder Fallback-Kette enthalten sein – ein Fable-fähiger
API-Schlüssel kann Opus immer verwenden.

### Beobachtbarkeit und Abrechnung

- Eine per Fallback bearbeitete Anfrage zeichnet in der Assistant-Nachricht eine
  `provider_fallback`-Diagnose auf, die `fromModel` und `toModel` benennt, und
  `responseModel` der Nachricht meldet `claude-opus-4-8`.
- Anthropic rechnet pro Versuch ab: Eine Ablehnung vor der Ausgabe ist kostenlos, und die Wiederherstellung
  wird zu den Tarifen von Claude Opus 4.8 abgerechnet (derzeit halb so hoch wie die Tarife von Fable 5). Die
  Kostenschätzung von OpenClaw pro Anfrage berechnet per Fallback bearbeitete Anfragen entsprechend zu Opus-Tarifen.
- Bei einer Ablehnung während des Streams stellt Anthropic zusätzlich den bereits gestreamten unvollständigen
  Fable-Teil in Rechnung; dieser Anteil wird in der verbrauchsbezogenen Aufschlüsselung pro Versuch der API ausgewiesen,
  fließt jedoch nicht in die Schätzung von OpenClaw pro Anfrage ein.

### Geltungsbereich

Gilt für `anthropic/claude-fable-5` mit API-Schlüssel-Authentifizierung gegenüber
`api.anthropic.com`. OAuth (Wiederverwendung eines Claude-CLI-Abonnements), Proxy-Basis-URLs,
Bedrock-, Vertex- und Foundry-Anfragen bleiben unverändert und geben
Ablehnungen dort weiterhin als Fehler aus.

Live verifiziert: Eine harmlose Aufforderung an Fable 5, seine unverarbeitete Gedankenkette
wiederzugeben, wird ohne Fallbacks mit `category: "reasoning_extraction"`
abgelehnt. Dieselbe Aufforderung über OpenClaw liefert eine normale, von Opus bearbeitete
Antwort mit angehängter `provider_fallback`-Diagnose.

Informationen zum zugrunde liegenden Verhalten finden Sie im Anthropic-Leitfaden zu
[Ablehnungen und Fallbacks](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback).

## Prompt-Caching

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic für die Authentifizierung per API-Schlüssel.

| Wert                  | Cache-Dauer  | Beschreibung                                         |
| --------------------- | ------------ | ---------------------------------------------------- |
| `"short"` (Standard)  | 5 Minuten    | Wird bei Authentifizierung per API-Schlüssel automatisch angewendet |
| `"long"`              | 1 Stunde     | Erweiterter Cache                                    |
| `"none"`              | Kein Caching | Prompt-Caching deaktivieren                          |

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
  <Accordion title="Agent-spezifische Cache-Überschreibungen">
    Verwenden Sie Parameter auf Modellebene als Grundlage und überschreiben Sie anschließend bestimmte Agenten über `agents.list[].params`:

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
    2. `agents.list[].params` (übereinstimmende `id`, Überschreibung nach Schlüssel)

    Dadurch kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent mit demselben Modell das Caching für stark schwankenden Datenverkehr mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Hinweise zu Claude auf Bedrock">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren bei entsprechender Konfiguration die Durchleitung von `cacheRetention`.
    - Bei Bedrock-Modellen, die nicht von Anthropic stammen, wird `cacheRetention: "none"` zur Laufzeit erzwungen.
    - Intelligente Standardwerte für API-Schlüssel setzen auch für Claude-on-Bedrock-Referenzen `cacheRetention: "short"`, wenn kein expliziter Wert festgelegt ist.

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schnellmodus">
    Der gemeinsame `/fast`-Umschalter von OpenClaw setzt das Anthropic-Feld `service_tier` für direkte Anfragen mit API-Schlüssel an `api.anthropic.com`.

    | Befehl | Entspricht |
    |--------|------------|
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
    - Gilt nur für direkte Anfragen an `api.anthropic.com`, die mit einem API-Schlüssel erfolgen. OAuth-/Abonnement-Token-Anfragen und Proxy-Routen erhalten niemals ein `service_tier`-Feld.
    - Explizite Parameter `serviceTier` oder `service_tier` überschreiben `/fast`, wenn beide festgelegt sind.
    - Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.

    </Note>

  </Accordion>

  <Accordion title="Medienerkennung (Bilder und PDF)">
    Das gebündelte Anthropic-Plugin registriert die Erkennung von Bildern und PDF-Dokumenten. OpenClaw
    ermittelt die Medienfunktionen automatisch anhand der konfigurierten Anthropic-Authentifizierung;
    es ist keine zusätzliche Konfiguration erforderlich.

    | Eigenschaft          | Wert                  |
    | -------------------- | --------------------- |
    | Standardmodell       | `claude-opus-4-8`     |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn einer Unterhaltung ein Bild oder PDF-Dokument angehängt wird, leitet OpenClaw
    es automatisch über den Anthropic-Provider für Medienerkennung weiter.

  </Accordion>

  <Accordion title="1M-Kontextfenster">
    Claude Sonnet 5, Mythos 5 und Fable 5 verfügen über ein Eingabefenster von exakt
    1.000.000 Token und unterstützen bis zu 128.000 Ausgabe-Token. Das
    1M-Kontextfenster von Anthropic ist außerdem für Claude-4.x-Modelle mit adaptivem Denken allgemein verfügbar:
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
    diese Modelle ist dies eine wirkungslose, aber unschädliche Einstellung, und OpenClaw sendet den eingestellten
    Beta-Header `context-1m-2025-08-07` unabhängig davon nicht mehr. Ältere `anthropicBeta`-Konfigurationseinträge
    mit diesem Wert werden bei der Auflösung der Anfrage-Header entfernt, und
    nicht unterstützte ältere Claude-Modelle behalten ihr normales Kontextfenster.

    `params.context1m: true` verhält sich beim Claude-CLI-Backend
    (`claude-cli/*`) genauso: Geeignete, allgemein verfügbare Opus- und Sonnet-Modelle erhalten das
    1M-Fenster bereits automatisch, sodass der Parameter auch dort optional ist.

    <Warning>
    Erfordert Zugriff auf lange Kontexte für Ihre Anthropic-Anmeldedaten. Die Authentifizierung per OAuth-/Abonnement-Token behält die erforderlichen Anthropic-Beta-Header bei, OpenClaw entfernt jedoch den eingestellten 1M-Beta-Header, falls dieser noch in einer älteren Konfiguration vorhanden ist.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 mit 1M-Kontext">
    `anthropic/claude-opus-4-8` und dessen `claude-cli`-Variante verfügen standardmäßig über ein
    1M-Kontextfenster; `params.context1m: true` ist nicht erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Die Anthropic-Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Einrichtungen stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für Provider "anthropic" gefunden'>
    Die Anthropic-Authentifizierung erfolgt **pro Agent**; neue Agenten übernehmen die Schlüssel des Haupt-Agenten nicht. Führen Sie das Onboarding für diesen Agenten erneut durch (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und überprüfen Sie den Status anschließend mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Anmeldedaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut durch oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle in Abklingzeit)">
    Prüfen Sie `auth.unusableProfiles` mit `openclaw models status --json`. Abklingzeiten aufgrund von Anthropic-Ratenbegrenzungen können modellspezifisch sein, sodass ein anderes Anthropic-Modell möglicherweise weiterhin verwendbar ist. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie, bis die Abklingzeit abgelaufen ist.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
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
