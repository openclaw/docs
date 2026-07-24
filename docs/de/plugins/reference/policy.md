---
read_when:
    - Sie installieren, konfigurieren oder prüfen das Richtlinien-Plugin
summary: Fügt richtliniengestützte Doctor-Prüfungen für die Workspace-Konformität hinzu.
title: Richtlinien-Plugin
x-i18n:
    generated_at: "2026-07-24T04:04:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 440f2f46e4149fdd5e65bf0140d4981c6d840e8e8c8a85d05eeb23a0839a61ac
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy-Plugin

Fügt richtliniengestützte Doctor-Prüfungen für die Konformität von Workspaces hinzu.

## Distribution

- Paket: `@openclaw/policy`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Verhalten

Das Policy-Plugin ergänzt Doctor-Zustandsprüfungen für richtlinienverwaltete OpenClaw-
Einstellungen und kontrollierte Workspace-Deklarationen. Policy deckt derzeit die
Konformität von Kanälen, kontrollierte Tool-Metadaten, den Sicherheitsstatus von MCP-Servern,
den Status von Modell-Providern, den Zugriffsstatus für private Netzwerke,
den Expositionsstatus des Gateways, den Workspace-/Tool-Status von Agenten,
den konfigurierten globalen und agentenspezifischen Tool-Status, den Status der
konfigurierten Sandbox-Laufzeit, den Zugriffsstatus für Ingress/Kanäle,
den Datenverarbeitungsstatus sowie den Status von Providern für OpenClaw-
Konfigurationsgeheimnisse und Authentifizierungsprofilen ab.

Policy speichert verfasste Anforderungen in `policy.jsonc`, wertet vorhandene
OpenClaw-Einstellungen und Workspace-Deklarationen als Nachweise aus und meldet
Abweichungen über `openclaw policy check` und `openclaw doctor --lint`. Eine erfolgreiche
Policy-Prüfung gibt Policy-, Nachweis-, Befund- und Bestätigungs-Hashes aus, die
Betreiber für Auditzwecke aufzeichnen können.

`openclaw policy compare --baseline <file>` vergleicht eine Policy-Datei mit einer anderen
Policy-Datei. Dabei wird ausschließlich die Konformität auf Konfigurationsebene geprüft:
Anhand der Metadaten der Policy-Regeln wird verifiziert, dass die geprüfte Policy
gegenüber der verfassten Baseline weder Lücken aufweist noch schwächer ist. Laufzeitstatus,
Anmeldedaten oder Geheimniswerte werden nicht geprüft.

Regeln für den Tool-Status können genehmigte Profile, auf den Workspace beschränkte
Dateisystem-Tools, begrenzte Einstellungen für Exec-Sicherheit, Rückfragen und Hosts,
einen deaktivierten Modus mit erhöhten Berechtigungen, exakte
`alsoAllow`-Einträge und erforderliche Tool-Sperreinträge vorschreiben. Die Nachweise
erfassen zusätzliche `alsoAllow`-Einträge, da diese den effektiven Tool-Status
erweitern können. Diese Prüfungen betrachten ausschließlich die Konformität der
Konfiguration; sie lesen weder den Genehmigungsstatus der Laufzeit aus noch fügen sie
eine Durchsetzung zur Laufzeit hinzu.

Regeln für den Sandbox-Status können genehmigte Sandbox-Modi und -Backends vorschreiben,
Host-Container-Netzwerke und das Beitreten zu Container-Namespaces verbieten,
schreibgeschützte Container-Einhängungen verlangen, das Einhängen von Sockets der
Container-Laufzeit sowie uneingeschränkte Container-Profile verbieten und
CDP-Quellbereiche für Sandbox-Browser verlangen.
Diese Prüfungen betrachten ausschließlich die Konformität der Konfiguration; sie lesen
weder den Genehmigungsstatus der Laufzeit aus noch prüfen sie aktive Container oder
fügen eine Durchsetzung zur Laufzeit hinzu.

Regeln zur Datenverarbeitung können die Schwärzung sensibler Protokolldaten verlangen,
die Erfassung von Inhalten durch Telemetrie verbieten, die Pflege der
Sitzungsaufbewahrung vorschreiben und die Speicherindizierung von
Sitzungstranskripten verbieten. Diese Prüfungen betrachten ausschließlich die
Konformität der Konfiguration; sie prüfen weder Rohprotokolle, Telemetrieexporte,
Transkripte, Speicherdateien, Geheimnisse noch personenbezogene Daten.

Benannte Policy-Geltungsbereiche unter `scopes.<scopeName>` können für den jeweils
aufgeführten Selektor strengere reguläre Policy-Abschnitte hinzufügen.
`agentIds` unterstützt `tools`,
`agents.workspace`, `sandbox` und `dataHandling.memory`;
`channelIds` unterstützt `ingress.channels`.
Laufzeit-Agenten-IDs, die nicht ausdrücklich in `agents.entries.*` aufgeführt sind,
werden anhand des geerbten globalen beziehungsweise standardmäßigen Status geprüft,
anstatt ohne Nachweise stillschweigend als erfolgreich zu gelten. Jeder in
`policy.jsonc` vorhandene Geltungsbereich muss für seinen Selektor gültig und
durchsetzbar sein. Overlay-Regeln stellen zusätzliche Anforderungen dar; daher
schwächen sie die Policy auf oberster Ebene nicht ab und können eigene Befunde
erzeugen, wenn dieselbe beobachtete Konfiguration gegen beide Geltungsbereiche
verstößt.

<!-- openclaw-plugin-reference:manual-end -->

## Verwandte Dokumentation

- [Policy](/de/cli/policy)
