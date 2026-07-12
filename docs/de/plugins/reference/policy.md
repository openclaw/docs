---
read_when:
    - Sie installieren, konfigurieren oder überprüfen das Richtlinien-Plugin
summary: Fügt richtliniengestützte Doctor-Prüfungen für die Workspace-Konformität hinzu.
title: Richtlinien-Plugin
x-i18n:
    generated_at: "2026-07-12T02:00:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy-Plugin

Fügt richtliniengestützte Doctor-Prüfungen für die Konformität von Arbeitsbereichen hinzu.

## Verteilung

- Paket: `@openclaw/policy`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Verhalten

Das Policy-Plugin stellt Doctor-Systemprüfungen für richtlinienverwaltete OpenClaw-Einstellungen und regulierte Arbeitsbereichsdeklarationen bereit. Policy deckt derzeit die Konformität von Kanälen, Metadaten regulierter Tools, den Sicherheitsstatus von MCP-Servern, den Status von Modell-Providern, den Status des Zugriffs auf private Netzwerke, den Status der Gateway-Exposition, den Status von Arbeitsbereichen und Tools der Agenten, den konfigurierten globalen und agentenspezifischen Tool-Status, den Status der konfigurierten Sandbox-Laufzeit, den Status des Eingangs- und Kanalzugriffs, den Status der Datenverarbeitung sowie den Status der Provider und Authentifizierungsprofile für Geheimnisse in der OpenClaw-Konfiguration ab.

Policy speichert verfasste Anforderungen in `policy.jsonc`, wertet vorhandene OpenClaw-Einstellungen und Arbeitsbereichsdeklarationen als Nachweise aus und meldet Abweichungen über `openclaw policy check` und `openclaw doctor --lint`. Eine erfolgreiche Richtlinienprüfung gibt Hashes für Richtlinie, Nachweise, Feststellungen und Bestätigung aus, die Betreiber zu Prüfzwecken aufzeichnen können.

`openclaw policy compare --baseline <file>` vergleicht eine Richtliniendatei mit einer anderen Richtliniendatei. Dabei wird ausschließlich die Konformität auf Konfigurationsebene geprüft: Anhand der Metadaten der Richtlinienregeln wird verifiziert, dass die geprüfte Richtlinie gegenüber der verfassten Baseline weder unvollständig noch schwächer ist. Laufzeitstatus, Anmeldedaten oder Werte von Geheimnissen werden nicht geprüft.

Regeln für den Tool-Status können genehmigte Profile, auf den Arbeitsbereich beschränkte Dateisystem-Tools, begrenzte Einstellungen für Sicherheit, Rückfragen und Host bei der Befehlsausführung, einen deaktivierten Modus mit erhöhten Rechten, exakte `alsoAllow`-Einträge und erforderliche Ablehnungseinträge für Tools verlangen. Die Nachweise erfassen zusätzliche `alsoAllow`-Einträge, da diese den effektiven Tool-Status erweitern können. Diese Prüfungen untersuchen ausschließlich die Konformität der Konfiguration; sie lesen weder den Genehmigungsstatus zur Laufzeit aus noch fügen sie eine Durchsetzung zur Laufzeit hinzu.

Regeln für den Sandbox-Status können genehmigte Sandbox-Modi und -Backends verlangen, Host-Container-Netzwerke und den Beitritt zu Container-Namespaces untersagen, schreibgeschützte Container-Einhängungen verlangen, das Einhängen von Sockets der Container-Laufzeit sowie uneingeschränkte Containerprofile untersagen und Quellbereiche für Sandbox-Browser-CDP verlangen. Diese Prüfungen untersuchen ausschließlich die Konformität der Konfiguration; sie lesen weder den Genehmigungsstatus zur Laufzeit aus noch prüfen sie aktive Container oder fügen eine Durchsetzung zur Laufzeit hinzu.

Regeln zur Datenverarbeitung können die Schwärzung sensibler Protokolldaten und die Pflege der Sitzungsaufbewahrung verlangen sowie die Erfassung von Inhalten für Telemetriezwecke und die Speicherindizierung von Sitzungsprotokollen untersagen. Diese Prüfungen untersuchen ausschließlich die Konformität der Konfiguration; sie prüfen weder Rohprotokolle, Telemetrieexporte, Transkripte, Speicherdateien, Geheimnisse noch personenbezogene Daten.

Benannte Richtlinienbereiche unter `scopes.<scopeName>` können für den jeweils aufgeführten Selektor strengere reguläre Richtlinienabschnitte hinzufügen. `agentIds` unterstützt `tools`, `agents.workspace`, `sandbox` und `dataHandling.memory`; `channelIds` unterstützt `ingress.channels`.
Laufzeit-Agenten-IDs, die nicht ausdrücklich in `agents.list[]` aufgeführt sind, werden anhand des geerbten globalen beziehungsweise standardmäßigen Status geprüft, statt ohne Nachweise stillschweigend als konform zu gelten. Jeder in `policy.jsonc` vorhandene Bereich muss für seinen Selektor gültig und durchsetzbar sein. Überlagerungsregeln stellen zusätzliche Anforderungen dar, schwächen daher die übergeordnete Richtlinie nicht und können eigene Feststellungen erzeugen, wenn dieselbe beobachtete Konfiguration gegen beide Bereiche verstößt.

<!-- openclaw-plugin-reference:manual-end -->

## Verwandte Dokumentation

- [Richtlinie](/de/cli/policy)
