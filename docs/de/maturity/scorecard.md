---
summary: OpenClaw-Bereitschaftsbewertungen für Releases in Produktbereichen, Integrationen und unterstützten Workflows.
title: Reifegrad-Scorecard
x-i18n:
    generated_at: "2026-07-24T04:39:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# Reifegrad-Scorecard

<div className="maturity-hero">
  <p className="maturity-kicker">Release-Bereitschaft – generiert aus Taxonomie und QA-Nachweisen</p>
  <p className="maturity-hero-title">Eine praxisnahe Übersicht darüber, was bereit ist, was nachgewiesen wurde und wo noch Arbeit erforderlich ist.</p>
  <p>50 Oberflächen – 281 Funktionsbereiche – deterministische Abdeckung sowie von Menschen geprüfte Qualität und Vollständigkeit.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Oberflächen durchsuchen</a> / <a href="#qa-evidence-summary">QA-Nachweise prüfen</a> / <a href="/de/maturity/taxonomy">Taxonomie lesen</a></p>
</div>

## Zweck dieser Seite

Diese Seite beantwortet eine Frage: Welche OpenClaw-Oberflächen sind glaubwürdige Optionen für ein Release, und welche Nachweise stützen diese Einschätzung? Die Abdeckung ergibt sich aus deterministischen QA-Nachweisen; Qualität und Vollständigkeit werden als geprüfte Reifegradwerte gepflegt.

## Auf einen Blick

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>Reifegradwert</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alpha</span>
      <span>Qualität und Vollständigkeit</span>
      <span>Abdeckung Experimentell – 4%</span>
      <span>Qualität Alpha – 64%</span>
      <span>Vollständigkeit Beta – 71%</span>
    </div>
  </div>
</div>

Die Abdeckung ist bewusst nachweisorientiert: Ein Bereich gilt nicht allein deshalb als „bereit“, weil die Implementierung vorhanden ist. Sie fließt nicht in den Reifegradwert ein, OpenClaw verfolgt jedoch das Ziel, die End-to-End-Abdeckung für ausgereifte Funktionen der Stufe Stable oder höher dauerhaft über 90% zu halten.

## Bewertungsstufen

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alpha</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stable</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Oberflächen-Explorer

<a id="surface-explorer" />

Die Oberflächen sind nach Reifegrad, Vollständigkeit und Qualität sortiert. Die LTS-Unterstützung wird in jeder Zeile ebenfalls angezeigt, damit sich für Releases geeignete Optionen leicht vergleichen lassen.

  <Tabs>
  <Tab title="Alle Oberflächen">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oberfläche</span><span>Abdeckung</span><span>Qualität</span><span>Vollständigkeit</span><span>Unterstützung</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway-Laufzeit</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>13 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux-Gateway-Host</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS-Gateway-Host</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>8 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Agentenlaufzeit</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Sitzungs-, Speicher- und Kontext-Engine</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Kanal-Framework</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Browserautomatisierungs-, Ausführungs- und Sandbox-Werkzeuge</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#observability"><span className="maturity-surface-title">Beobachtbarkeit</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI- und Codex-Provider-Pfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway-Web-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Websuchwerkzeuge</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Sicherheit, Authentifizierung, Kopplung und Geheimnisse</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatisierung: Cron, Hooks, Aufgaben, Abfragen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hosting mit Docker und Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows über WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi und kleine Linux-Geräte</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic-Provider-Pfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Vollständig - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Vollständig - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google-Provider-Pfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage und BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS-Begleit-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter-Provider-Pfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Medienverständnis und Mediengenerierung</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Tools zur Bild-, Video- und Musikgenerierung</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Lokale Modell-Provider: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Weniger verbreitete gehostete Provider</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Sprachkommunikation und Gespräche in Echtzeit</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Natives Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes-Hosting</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, regionale Kanäle</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw-App-SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix-Installationspfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimentell</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Sprachanrufkanal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimentell</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS-Begleitoberflächen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimentell</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux-Begleit-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Geplant</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Native Windows-Begleit-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Geplant</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Kern">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oberfläche</span><span>Abdeckung</span><span>Qualität</span><span>Vollständigkeit</span><span>Unterstützung</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway-Laufzeit</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>13 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Agentenlaufzeit</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Sitzungs-, Speicher- und Kontext-Engine</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Channel-Framework</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#observability"><span className="maturity-surface-title">Beobachtbarkeit</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway-Web-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Sicherheit, Authentifizierung, Kopplung und Geheimnisse</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise – 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatisierung: Cron, Hooks, Aufgaben, Polling</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Medienverständnis und Mediengenerierung</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Sprache und Echtzeitgespräche</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw-App-SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Plattform">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oberfläche</span><span>Abdeckung</span><span>Qualität</span><span>Vollständigkeit</span><span>Support</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux-Gateway-Host</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS-Gateway-Host</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>7 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>8 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hosting mit Docker und Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows über WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi und kleine Linux-Geräte</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS-Begleit-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Natives Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes-Hosting</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix-Installationspfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimentell</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS-Begleitoberflächen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimentell</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux-Begleit-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Geplant</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Native Windows-Begleit-App</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Geplant</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Kanal">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oberfläche</span><span>Abdeckung</span><span>Qualität</span><span>Vollständigkeit</span><span>Support</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabil</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabil</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Vollständig - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Vollständig - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage und BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, regionale Kanäle</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Sprachanrufkanal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimentell</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Provider und Tool">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oberfläche</span><span>Abdeckung</span><span>Qualität</span><span>Vollständigkeit</span><span>Unterstützung</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Browserautomatisierung, Ausführungs- und Sandbox-Tools</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI- und Codex-Provider-Pfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Teilweise - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Websuchwerkzeuge</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic-Provider-Pfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google-Provider-Pfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter-Provider-Pfad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Werkzeuge zur Bild-, Video- und Musikgenerierung</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Lokale Modell-Provider: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/de/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Gehostete Nischen-Provider</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 Bereiche</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Abdeckung</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimentell</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualität</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Vollständigkeit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Keine</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Zusammenfassung der QA-Nachweise

Die folgenden Prüfungen zeigen, welche Scorecard-Bereiche durch Nachweise aus QA-Profilen abgedeckt wurden.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Vollständige Taxonomievalidierung</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 Prüfungen – 94 bestanden, 2 blockiert</span>
    <span>0 von 281 (0 %) Bereiche – 20 von 1675 (1,2 %) Funktionen – 77 von 1665 (4,6 %) Abdeckungs-IDs</span>
  </div>
</div>

### Bereitschaft nach Bereich

  Öffnen Sie eine Oberfläche, um den Nachweisstatus jeder Kategorie zu prüfen. Die Liste bleibt eingeklappt, damit die Seite auf einen Blick übersichtlich bleibt.

  <AccordionGroup>
  <Accordion title="Agenten-Runtime – 9 Bereiche">
    <p className="maturity-readiness-summary">8 teilweise geprüft / 1 muss geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ausführung von Agenten-Turns</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 7 von 24 (29,2 %)</span>
        <span>17 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Externe Runtimes und Subagenten</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 3 von 10 (30 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ausführung bei gehosteten Providern</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 5 (20 %) / 1 von 5 (20 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokale und selbst gehostete Provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modell- und Runtime-Auswahl</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 2 von 8 (25 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider-Authentifizierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 4 von 17 (23,5 %)</span>
        <span>13 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Streaming und Fortschritt</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 5 von 9 (55,6 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tool-Aufrufe und Antwortverarbeitung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 15 von 23 (65,2 %)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Steuerung der Tool-Ausführung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 6 von 12 (50 %)</span>
        <span>6 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android-App – 7 Bereiche">
    <p className="maturity-readiness-summary">7 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Verbindungseinrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerätelaufzeit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 0 von 2 (0 %)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Verteilung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medienaufnahme</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mobiler Chat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Einstellungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Spracheingabe</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic-Provider-Pfad – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medieneingaben</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modell- und Laufzeitauswahl</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 12 (0 %)</span>
        <span>12 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Prompt-Cache und Kontext</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider-Authentifizierung und Wiederherstellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Anfragetransport und Zugsemantik</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automatisierung: Cron, Hooks, Aufgaben, Abfragen – 6 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden / 1 teilweise geprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automatisierungs-Hooks</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0%) / 0 von 11 (0%)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hintergrundaufgaben und Abläufe</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0%) / 0 von 10 (0%)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cron-Aufträge</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 15 (0%) / 0 von 15 (0%)</span>
        <span>15 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eingehende Ereignisse</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 15 (0%) / 0 von 15 (0%)</span>
        <span>15 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 1 von 7 (14.3%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Abfragesteuerung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0%) / 0 von 10 (0%)</span>
        <span>10 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Browserautomatisierung, Ausführung und Sandbox-Werkzeuge – 3 Bereiche">
    <p className="maturity-readiness-summary">2 teilweise geprüft / 1 muss geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browserautomatisierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 8 (12.5%) / 1 von 8 (12.5%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox- und Werkzeugrichtlinie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Werkzeugaufruf und -ausführung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>2 von 6 (33.3%) / 4 von 8 (50%)</span>
        <span>4 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway-Web-App – 6 Bereiche">
    <p className="maturity-readiness-summary">3 müssen geprüft werden / 3 teilweise geprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browserzugriff und Vertrauen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browser-Echtzeitgespräche</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browser-Benutzeroberfläche</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0%) / 1 von 12 (8.3%)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguration</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Betreiberkonsole</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0%) / 1 von 12 (8.3%)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat-Unterhaltungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 15 (0%) / 2 von 20 (10%)</span>
        <span>18 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Channel-Framework – 8 Bereiche">
    <p className="maturity-readiness-summary">4 müssen geprüft werden / 4 teilweise geprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Channel-Aktionen, Befehle und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Channel-Einrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 1 von 7 (14.3%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Unterhaltungsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0%) / 5 von 27 (18.5%)</span>
        <span>22 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Verhalten von Gruppen-Threads und Umgebungsräumen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 4 von 11 (36.4%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriffs- und Identitätsprüfungen für eingehende Daten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medienanhänge und umfangreiche Channel-Daten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ausgehende Zustellung und Antwort-Pipeline</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 8 von 21 (38.1%)</span>
        <span>13 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Statuszustand und Betreibersteuerung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub – 4 Bereiche">
    <p className="maturity-readiness-summary">4 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Katalogermittlung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kompatibilität und Vertrauenswürdigkeit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 12 (0 %) / 0 von 12 (0 %)</span>
        <span>12 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin-Lebenszyklus und -Integrität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 26 (0 %) / 0 von 26 (0 %)</span>
        <span>26 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Veröffentlichung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI – 7 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden / 2 teilweise überprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI-Beobachtbarkeit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI-Einrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 6 (16,7 %) / 1 von 6 (16,7 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Dienstverwaltung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 1 von 7 (14,3 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Onboarding und Authentifizierungseinrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin- und Kanaleinrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aktualisierungen und Upgrades</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord – 6 Bereiche">
    <p className="maturity-readiness-summary">6 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsweiterleitung und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 12 (0 %) / 0 von 12 (0 %)</span>
        <span>12 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Echtzeit-Sprache und -Anrufe</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker- und Podman-Hosting – 4 Bereiche">
    <p className="maturity-readiness-summary">3 müssen überprüft werden / 1 teilweise überprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Agent-Sandbox und Tooling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Containerbetrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0 %) / 0 von 11 (0 %)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Containereinrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Image-Veröffentlichung und -Validierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 5 (20 %) / 2 von 7 (28,6 %)</span>
        <span>5 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, regionale Kanäle – 4 Bereiche">
    <p className="maturity-readiness-summary">4 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway-Laufzeit – 13 Bereiche">
    <p className="maturity-readiness-summary">9 müssen überprüft werden / 4 teilweise überprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Genehmigungen und Remote-Ausführung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geräteauthentifizierung und Kopplung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Lebenszyklus</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 4 von 12 (33,3 %)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-RPC-APIs und -Ereignisse</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 20 (0 %) / 2 von 22 (9,1 %)</span>
        <span>20 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Systemzustand, Diagnose und Reparatur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gehostete Weboberfläche</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP-APIs</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 4 (25 %) / 1 von 4 (25 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Netzwerkzugriff und -erkennung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodes und Remote-Funktionen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0 %) / 0 von 8 (0 %)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Protokollkompatibilität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rollen und Berechtigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sicherheitskontrollen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket-Verbindung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 8 (12,5 %) / 1 von 8 (12,5 %)</span>
        <span>7 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0 %) / 0 von 11 (0 %)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 16 (0 %) / 0 von 16 (0 %)</span>
        <span>16 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 16 (0 %) / 0 von 16 (0 %)</span>
        <span>16 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google-Provider-Pfad – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Direkte Gemini-Laufzeit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien, Suche und Echtzeit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modell-Routing und Endpunkte</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Prompt-Caching</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider-Einrichtung und Anmeldedaten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Tools zur Bild-, Video- und Musikgenerierung – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bildgenerierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien-Routing und -Erkennung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Musikgenerierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aufgabenlebenszyklus und Zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 12 (0 %) / 0 von 12 (0 %)</span>
        <span>12 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Videogenerierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0 %) / 0 von 11 (0 %)</span>
        <span>11 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage und BlueBubbles – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0 %) / 0 von 11 (0 %)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversations-Routing und -Zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS-App – 8 Bereiche">
    <p className="maturity-readiness-summary">8 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas und Bildschirm</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat und Sitzungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gerätebefehle</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 0 von 2 (0 %)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Verteilung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Einrichtung und -Diagnose</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Teilen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Benachrichtigungen und Hintergrundbetrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sprache</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetes-Hosting – 4 Bereiche">
    <p className="maturity-readiness-summary">4 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Exposition</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cluster-Lebenszyklus</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguration und Geheimnisse</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bereitstellungseinrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux-Begleit-App – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">App-Verteilung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat und Sitzungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Desktop-Funktionen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Konnektivität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status und Diagnose</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux-Gateway-Host – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bereitstellungsziele</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnose und Reparatur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Laufzeit und Dienststeuerung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Host-Einrichtung und Aktualisierungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fernzugriff und Sicherheit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Lokale Modell-Provider: Ollama, vLLM, SGLang, LM Studio – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokaler Speicher und Einbettungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Provider-Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Netzwerksicherheit und Prompt-Steuerung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 0 von 2 (0 %)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kompatibilität mit OpenAI-kompatiblen Laufzeitumgebungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0 %) / 0 von 8 (0 %)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider-Einrichtung, -Lebenszyklus und -Diagnose</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 12 (0 %) / 0 von 12 (0 %)</span>
        <span>12 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Weniger verbreitete gehostete Provider – 3 Bereiche">
    <p className="maturity-readiness-summary">3 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gehostete LLM-Provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 12 (0 %) / 0 von 12 (0 %)</span>
        <span>12 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gehostete Medien-Provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0 %) / 0 von 8 (0 %)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider-Betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 12 (0 %) / 0 von 12 (0 %)</span>
        <span>12 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS-Begleit-App – 8 Bereiche">
    <p className="maturity-readiness-summary">8 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokale Einrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Funktionen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Remoteverbindungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Remote-WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status und Einstellungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sprache und Unterhaltung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS-Gateway-Host – 7 Bereiche">
    <p className="maturity-readiness-summary">7 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI-Einrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnose und Beobachtbarkeit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lebenszyklus des Gateway-Dienstes</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokale Gateway-Integration</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Berechtigungen und native Funktionen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Profile und Isolation</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Remote-Gateway-Modus</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix – 6 Bereiche">
    <p className="maturity-readiness-summary">6 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Verschlüsselung und Verifizierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat – 4 Bereiche">
    <p className="maturity-readiness-summary">4 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Medienverständnis und Mediengenerierung – 6 Bereiche">
    <p className="maturity-readiness-summary">4 müssen überprüft werden / 2 teilweise überprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Verarbeitung von Kanalmedien</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medienkonfiguration</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mediengenerierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 17 (5,9 %) / 1 von 19 (5,3 %)</span>
        <span>18 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medienaufnahme und -zugriff</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0 %) / 0 von 8 (0 %)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medienverständnis</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 12 (0 %) / 1 von 14 (7,1 %)</span>
        <span>13 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Text-zu-Sprache-Zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 0 von 2 (0 %)</span>
        <span>2 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Natives Windows – 4 Bereiche">
    <p className="maturity-readiness-summary">4 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Folgemaßnahme</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Verwaltung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0 %) / 0 von 11 (0 %)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Netzwerk</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aktualisierungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0 %) / 0 von 4 (0 %)</span>
        <span>4 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Native Windows-Begleit-App – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat-Sitzungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Desktop-Werkzeuge und Berechtigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0%) / 0 von 10 (0%)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Verbindung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0%) / 0 von 3 (0%)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installation und Aktualisierungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status und Reparatur</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix-Installationspfad – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aktivierung und App-Benutzererlebnis</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0%) / 0 von 7 (0%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konfiguration und Zustand</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0%) / 0 von 7 (0%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installationsübergabe</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin-Lebenszyklus</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Dienstlaufzeit und Schutzmechanismen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0%) / 0 von 8 (0%)</span>
        <span>8 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI- und Codex-Provider-Pfad – 5 Bereiche">
    <p className="maturity-readiness-summary">2 müssen geprüft werden / 3 teilweise geprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Bild- und multimodale Eingabe</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modell und Authentifizierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 6 (16.7%) / 4 von 9 (44.4%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Codex-Testumgebung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 4 von 9 (44.4%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Antwort- und Werkzeugkompatibilität</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 4 (25%) / 2 von 5 (40%)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sprache und Echtzeit-Audio</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK – 6 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden / 1 teilweise geprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Agent-Unterhaltungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Client-API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kompatibilität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ereignisse und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Zugriff</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Prüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ressourcenhilfen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 1 von 6 (16.7%)</span>
        <span>5 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter-Provider-Pfad – 4 Bereiche">
    <p className="maturity-readiness-summary">4 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat-Laufzeit und Normalisierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 15 (0%) / 0 von 15 (0%)</span>
        <span>15 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mediengenerierung und Sprachausgabe</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0%) / 0 von 7 (0%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider-Wiederherstellung und -Diagnose</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider-Einrichtung und -Authentifizierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 14 (0%) / 0 von 14 (0%)</span>
        <span>14 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins – 9 Bereiche">
    <p className="maturity-readiness-summary">6 müssen überprüft werden / 3 teilweise überprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Entwicklung und Paketierung von Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0%) / 0 von 8 (0%)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mitgelieferte Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas-Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanal-Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installieren und Ausführen von Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 7 von 20 (35%)</span>
        <span>13 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin-Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider- und Werkzeug-Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 6 (16.7%) / 9 von 21 (42.9%)</span>
        <span>12 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Veröffentlichen von Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Testen von Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 3 von 11 (27.3%)</span>
        <span>8 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi und kleine Linux-Geräte – 4 Bereiche">
    <p className="maturity-readiness-summary">4 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Laufzeit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0%) / 0 von 10 (0%)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Leistung und Diagnose</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Fernzugriff und Authentifizierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0%) / 0 von 9 (0%)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Einrichtung und Kompatibilität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 12 (0%) / 0 von 12 (0%)</span>
        <span>12 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sicherheit, Authentifizierung, Kopplung und Geheimnisse – 6 Bereiche">
    <p className="maturity-readiness-summary">2 teilweise überprüft / 4 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Genehmigungsrichtlinie und Werkzeugschutzmaßnahmen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 3 von 6 (50%)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanalzugriffskontrolle</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0%) / 0 von 3 (0%)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sicherer Umgang mit Anmeldedaten und Geheimnissen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 5 von 11 (45.5%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geräte- und Node-Kopplung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0%) / 0 von 11 (0%)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Authentifizierung und Fernzugriff</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0%) / 0 von 9 (0%)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin-Vertrauen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sitzung, Speicher und Kontext-Engine – 9 Bereiche">
    <p className="maturity-readiness-summary">2 müssen überprüft werden / 7 teilweise überprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI-Sitzungs- und Transkriptverwaltung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 0 von 2 (0 %)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kontext-Engine</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 4 von 7 (57,1 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kern-Prompts und Kontext</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 3 von 8 (37,5 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Clientübergreifende Verlaufs- und Sitzungskonsistenz</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 2 von 5 (40 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnose, Wartung und Wiederherstellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 4 von 10 (40 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Speicher</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 6 von 13 (46,2 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sitzungsrouting</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 1 von 4 (25 %)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tokenverwaltung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 2 von 10 (20 %)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transkriptpersistenz</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0 %) / 0 von 2 (0 %)</span>
        <span>2 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0 %) / 0 von 6 (0 %)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0 %) / 0 von 7 (0 %)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0 %) / 0 von 3 (0 %)</span>
        <span>3 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0 %) / 0 von 5 (0 %)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0 %) / 0 von 8 (0 %)</span>
        <span>8 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachbereitung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0 %) / 0 von 10 (0 %)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0 %) / 0 von 1 (0 %)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – Vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0 %) / 0 von 9 (0 %)</span>
        <span>9 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Beobachtbarkeit – 5 Bereiche">
    <p className="maturity-readiness-summary">3 teilweise geprüft / 2 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnosedatenerfassung</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 8 (12.5%) / 3 von 10 (30%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Systemzustand und Reparatur</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 12 (8.3%) / 5 von 18 (27.8%)</span>
        <span>13 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Protokollierung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sitzungsdiagnose</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Telemetrieexport</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise geprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 13 (7.7%) / 7 von 21 (33.3%)</span>
        <span>14 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eingabe und Befehle</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0%) / 0 von 8 (0%)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokale Shell-Ausführung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Darstellung und Ausgabesicherheit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Laufzeitmodi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 14 (0%) / 0 von 14 (0%)</span>
        <span>14 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sitzungsverwaltung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0%) / 0 von 3 (0%)</span>
        <span>3 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sprache und Echtzeitgespräche – 6 Bereiche">
    <p className="maturity-readiness-summary">6 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespräche in nativen Apps</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Echtzeit-Gesprächssitzungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0%) / 0 von 11 (0%)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sprache und Transkription</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Beobachtbarkeit von Gesprächen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gesprächs-Provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0%) / 0 von 7 (0%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sprachaktivierung und Routing</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sprachanrufkanal – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen geprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0%) / 0 von 1 (0%)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gesprächsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 1 (0%) / 0 von 1 (0%)</span>
        <span>1 Funktionslücke</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Echtzeitsprache und Anrufe</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Muss geprüft werden – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS-Begleitoberflächen – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zustellung und Wiederherstellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0%) / 0 von 7 (0%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Verteilung und Support</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ausführungsgenehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0%) / 0 von 3 (0%)</span>
        <span>3 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Benachrichtigungen und Antworten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0%) / 0 von 7 (0%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Benutzeroberfläche der Watch-App</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 3 (0%) / 0 von 3 (0%)</span>
        <span>3 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Websuchwerkzeuge – 4 Bereiche">
    <p className="maturity-readiness-summary">2 müssen überprüft werden / 2 teilweise überprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Netzwerksicherheit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Such-Provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>2 von 19 (10.5%) / 2 von 19 (10.5%)</span>
        <span>17 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Einrichtung und Diagnose</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 9 (0%) / 0 von 9 (0%)</span>
        <span>9 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Werkzeugverfügbarkeit und Abruf</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>2 von 11 (18.2%) / 3 von 12 (25%)</span>
        <span>9 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp – 5 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zugriff und Identität</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 7 (0%) / 0 von 7 (0%)</span>
        <span>7 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaleinrichtung und -betrieb</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 5 (0%) / 0 von 5 (0%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Konversationsrouting und -zustellung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 4 (0%) / 0 von 4 (0%)</span>
        <span>4 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Medien und Rich Content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Steuerelemente und Genehmigungen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 2 (0%) / 0 von 2 (0%)</span>
        <span>2 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows über WSL2 – 6 Bereiche">
    <p className="maturity-readiness-summary">5 müssen überprüft werden / 1 teilweise überprüft</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Bereich</span><span>Funktionen / Abdeckungs-IDs</span><span>Nachverfolgung</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browser und Steuerungsoberfläche</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 8 (0%) / 0 von 8 (0%)</span>
        <span>8 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnose und Reparatur</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Teilweise überprüft – vollständige Taxonomievalidierung</span>
        </div>
        <span>1 von 6 (16.7%) / 3 von 8 (37.5%)</span>
        <span>5 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-Zugriff und -Exposition</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 11 (0%) / 0 von 11 (0%)</span>
        <span>11 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lebenszyklus des Gateway-Dienstes</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 10 (0%) / 0 von 10 (0%)</span>
        <span>10 Funktionslücken</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSL-Einrichtung</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Überprüfung erforderlich – vollständige Taxonomievalidierung</span>
        </div>
        <span>0 von 6 (0%) / 0 von 6 (0%)</span>
        <span>6 Funktionslücken</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Zuletzt aktualisiert: 2026-06-22
