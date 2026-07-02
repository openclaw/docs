---
summary: Gereedheidsscores voor OpenClaw-releases voor productgebieden, integraties en ondersteunde workflows.
title: Volwassenheidsscorekaart
x-i18n:
    generated_at: "2026-07-02T08:31:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cc55f54773a19369b865994ea22d00f1e07fc7df2b2d5b14cb4067f994fb0e2
    source_path: maturity/scorecard.md
    workflow: 16
---

# Maturiteitsscorekaart

<div className="maturity-hero">
  <p className="maturity-kicker">releasegereedheid - gegenereerd uit taxonomie + QA-bewijs</p>
  <p className="maturity-hero-title">Een praktisch overzicht van wat gereed is, wat bewezen is en wat nog werk nodig heeft.</p>
  <p>50 oppervlakken - 281 capaciteitsgebieden - deterministische dekking plus door mensen beoordeelde kwaliteit en volledigheid.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Oppervlakken bekijken</a> / <a href="#qa-evidence-summary">QA-bewijs inspecteren</a> / <a href="/nl/maturity/taxonomy">De taxonomie lezen</a></p>
</div>

## Waarvoor deze pagina dient

Gebruik deze pagina om één vraag te beantwoorden: welke OpenClaw-oppervlakken zijn geloofwaardige keuzes voor een release, en welk bewijs ondersteunt dat oordeel? Dekking komt uit deterministisch QA-bewijs; kwaliteit en volledigheid worden bijgehouden als beoordeelde maturiteitsscores.

## In één oogopslag

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">68%</span>
      <span>Maturiteitsscore</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "68" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alfa</span>
      <span>Kwaliteit + volledigheid</span>
      <span>Dekking Experimenteel - 4%</span>
      <span>Kwaliteit Alfa - 64%</span>
      <span>Volledigheid Bèta - 71%</span>
    </div>
  </div>
</div>

Dekking wordt bewust door bewijs gestuurd: een gebied wordt niet "gereed" alleen omdat de implementatie bestaat. Het is geen invoer voor de maturiteitsscore, maar OpenClaw streeft ernaar de end-to-enddekking in de loop van de tijd boven 90% te houden voor mature functies op Stabiel-niveau of beter.

## Scorebanden

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alfa</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Bèta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stabiel</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Oppervlakverkenner

<a id="surface-explorer" />

Oppervlakken zijn geordend op maturiteitsniveau, volledigheid en kwaliteit. LTS-ondersteuning wordt naast elke rij weergegeven, zodat releaseklare opties eenvoudig te vergelijken zijn.

  <Tabs>
  <Tab title="All surfaces">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oppervlak</span><span>Dekking</span><span>Kwaliteit</span><span>Volledigheid</span><span>Ondersteuning</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>7 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway-runtime</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>13 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway-host</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway-host</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>7 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android-app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>7 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS-app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>8 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Agent-runtime</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Sessie-, geheugen- en contextengine</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Kanaalframework</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Browserautomatisering, exec- en sandboxtools</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#observability"><span className="maturity-surface-title">Observeerbaarheid</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI- en Codex-providerpad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway-webapp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Webzoektools</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Beveiliging, verificatie, koppeling en geheimen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatisering: Cron, hooks, taken, polling</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker- en Podman-hosting</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows via WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi en kleine Linux-apparaten</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic-providerpad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Volledig - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Volledig - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google-providerpad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage en BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS-begeleidende app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter-providerpad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Mediabegrip en mediageneratie</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Tools voor beeld-, video- en muziekgeneratie</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Lokale modelproviders: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Long-tail gehoste providers</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Spraak en realtime gesprek</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Native Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes-hosting</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, regionale kanalen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix-installatiepad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimenteel</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Spraakoproepkanaal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimenteel</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS-companion-oppervlakken</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimenteel</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux-companion-app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Gepland</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Native Windows-companion-app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Gepland</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Kern">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oppervlak</span><span>Dekking</span><span>Kwaliteit</span><span>Volledigheid</span><span>Ondersteuning</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>7 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Gateway-runtime</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>13 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Agent-runtime</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Sessie-, geheugen- en contextengine</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Kanaalframework</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#observability"><span className="maturity-surface-title">Observeerbaarheid</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Gateway-webapp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugins</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Beveiliging, authenticatie, koppeling en geheimen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automatisering: Cron, hooks, taken, polling</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Mediabegrip en mediageneratie</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Spraak en realtime gesprek</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Platform">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oppervlak</span><span>Dekking</span><span>Kwaliteit</span><span>Volledigheid</span><span>Ondersteuning</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Linux Gateway-host</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">macOS Gateway-host</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>7 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#android-app"><span className="maturity-surface-title">Android-app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>7 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#ios-app"><span className="maturity-surface-title">iOS-app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>8 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Docker- en Podman-hosting</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows via WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi en kleine Linux-apparaten</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">macOS-begeleidende app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows-native</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Kubernetes-hosting</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Nix-installatiepad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimenteel</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">watchOS-companion-oppervlakken</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimenteel</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">Linux-companion-app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Gepland</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">Systeemeigen Windows-companion-app</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Gepland</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Kanaal">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oppervlak</span><span>Dekking</span><span>Kwaliteit</span><span>Volledigheid</span><span>Ondersteuning</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabiel</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabiel</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bèta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Volledig - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bèta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Volledig - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage en BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bèta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bèta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, regionale kanalen</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Spraakoproepkanaal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Experimenteel</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Provider en tool">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Oppervlak</span><span>Dekking</span><span>Kwaliteit</span><span>Volledigheid</span><span>Ondersteuning</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Browserautomatisering, exec en sandbox-tools</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">OpenAI- en Codex-providerpad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Gedeeltelijk - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Webzoektools</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bèta</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Anthropic-providerpad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bèta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Google-providerpad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bèta</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">OpenRouter-providerpad</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Bèta</span></span><span>4 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Bèta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Tools voor het genereren van afbeeldingen, video en muziek</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Lokale modelproviders: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/nl/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Long-tail gehoste providers</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>3 gebieden</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Dekking</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Experimenteel</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Kwaliteit</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Volledigheid</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Geen</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Samenvatting van QA-bewijs

De onderstaande controles tonen welke scorecardgebieden zijn uitgevoerd door bewijs uit QA-profielen.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Volledige taxonomievalidatie</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 controles - 94 geslaagd, 2 geblokkeerd</span>
    <span>0 van 281 (0%) gebieden - 20 van 1675 (1.2%) functies - 77 van 1665 (4.6%) dekkings-ID's</span>
  </div>
</div>

### Gereedheid per gebied

Open een oppervlak om de bewijsstatus van elke categorie te inspecteren. De lijst blijft samengevouwen zodat de pagina in één oogopslag bruikbaar blijft.

<AccordionGroup>
  <Accordion title="Agentruntime - 9 gebieden">
    <p className="maturity-readiness-summary">8 gedeeltelijk beoordeeld / 1 beoordeling nodig</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uitvoering van agentbeurt</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 7 van 24 (29.2%)</span>
        <span>17 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Externe runtimes en subagenten</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 3 van 10 (30%)</span>
        <span>7 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uitvoering via gehoste provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>1 van 5 (20%) / 1 van 5 (20%)</span>
        <span>4 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokale en zelfgehoste providers</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model- en runtimeselectie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 2 van 8 (25%)</span>
        <span>6 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Providerauthenticatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 4 van 17 (23.5%)</span>
        <span>13 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Streaming en voortgang</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 5 van 9 (55.6%)</span>
        <span>4 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toolaanroepen en responsafhandeling</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 15 van 23 (65.2%)</span>
        <span>8 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Besturing van tooluitvoering</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 6 van 12 (50%)</span>
        <span>6 functionaliteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Android-app - 7 gebieden">
    <p className="maturity-readiness-summary">7 beoordeling nodig</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Verbindingsconfiguratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 functionaliteitslacune</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Apparaatruntime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distributie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media vastleggen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 functionaliteitslacune</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mobiele chat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 functionaliteitslacune</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instellingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 functionaliteitslacune</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Spraak</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 functionaliteitslacune</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Anthropic-providerpad - 5 gebieden">
    <p className="maturity-readiness-summary">5 beoordeling nodig</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media-invoer</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model- en runtimeselectie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 12 (0%)</span>
        <span>12 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Promptcache en context</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Providerauthenticatie en herstel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 functionaliteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aanvraagtransport en beurtsemantiek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 functionaliteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automatisering: cron, hooks, taken, polling - 6 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld / 1 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automatiseringshooks</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Achtergrondtaken en flows</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cron-taken</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 15 (0%) / 0 van 15 (0%)</span>
        <span>15 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Event-ingress</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 15 (0%) / 0 van 15 (0%)</span>
        <span>15 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 1 van 7 (14.3%)</span>
        <span>6 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pollingbesturing</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Browserautomatisering, exec en sandboxtools - 3 gebieden">
    <p className="maturity-readiness-summary">2 gedeeltelijk beoordeeld / 1 moet worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browserautomatisering</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>1 van 8 (12.5%) / 1 van 8 (12.5%)</span>
        <span>7 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox- en toolbeleid</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toolaanroep en uitvoering</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>2 van 6 (33.3%) / 4 van 8 (50%)</span>
        <span>4 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway-webapp - 6 gebieden">
    <p className="maturity-readiness-summary">3 moeten worden beoordeeld / 3 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browsertoegang en vertrouwen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Realtime browsergesprek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browser-UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 1 van 12 (8.3%)</span>
        <span>11 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operatorconsole</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 1 van 12 (8.3%)</span>
        <span>11 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat-gesprekken</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 15 (0%) / 2 van 20 (10%)</span>
        <span>18 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kanaalframework - 8 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld / 4 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalacties, opdrachten en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 1 van 7 (14.3%)</span>
        <span>6 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en bezorging</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 5 van 27 (18.5%)</span>
        <span>22 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gedrag voor groepsthreads en omgevingsruimten</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 4 van 11 (36.4%)</span>
        <span>7 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Inkomende toegang en identiteitspoorten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mediabijlagen en rijke kanaalgegevens</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Uitgaande bezorging en antwoordpipeline</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 8 van 21 (38.1%)</span>
        <span>13 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status, gezondheid en operatorbesturing</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 6 (0%)</span>
        <span>6 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Catalogusontdekking</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibiliteit en vertrouwen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 12 (0%) / 0 van 12 (0%)</span>
        <span>12 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin-levenscyclus en gezondheid</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 26 (0%) / 0 van 26 (0%)</span>
        <span>26 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Publicatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 ontbrekende mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld / 2 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI-observeerbaarheid</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI-installatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>1 van 6 (16.7%) / 1 van 6 (16.7%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-servicebeheer</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 1 van 7 (14.3%)</span>
        <span>6 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Onboarding en auth-installatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin- en kanaalinstallatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Updates en upgrades</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 gebieden">
    <p className="maturity-readiness-summary">6 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalinstallatie en bewerkingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en aflevering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 12 (0%) / 0 van 12 (0%)</span>
        <span>12 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke inhoud</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 ontbrekende mogelijkheid</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native bedieningselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Realtime spraak en oproepen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Docker- en Podman-hosting - 4 gebieden">
    <p className="maturity-readiness-summary">3 moeten worden beoordeeld / 1 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Agent-sandbox en tooling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Containerbewerkingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Containerinstallatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Image-release en validatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>1 van 5 (20%) / 2 van 7 (28.6%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, regionale kanalen - 4 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en -operaties</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en aflevering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Gateway-runtime - 13 gebieden">
    <p className="maturity-readiness-summary">9 moeten worden beoordeeld / 4 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Goedkeuringen en uitvoering op afstand</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Apparaatauthenticatie en koppeling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-levenscyclus</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 4 van 12 (33.3%)</span>
        <span>8 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway RPC-API's en events</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 20 (0%) / 2 van 22 (9.1%)</span>
        <span>20 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status, diagnostiek en herstel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gehost weboppervlak</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">HTTP-API's</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>1 van 4 (25%) / 1 van 4 (25%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Netwerktoegang en detectie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Nodes en mogelijkheden op afstand</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Protocolcompatibiliteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rollen en machtigingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Beveiligingscontroles</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebSocket-verbinding</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>1 van 8 (12.5%) / 1 van 8 (12.5%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en -operaties</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 16 (0%) / 0 van 16 (0%)</span>
        <span>16 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en aflevering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native bedieningselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 16 (0%) / 0 van 16 (0%)</span>
        <span>16 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google-providerpad - 5 gebieden">
    <p className="maturity-readiness-summary">5 vereisen beoordeling</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Directe Gemini-runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media, zoeken en realtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modelroutering en endpoints</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Promptcaching</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Providerconfiguratie en aanmeldgegevens</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 ontbrekende mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Tools voor het genereren van afbeeldingen, video en muziek - 5 gebieden">
    <p className="maturity-readiness-summary">5 vereisen beoordeling</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Afbeeldingsgeneratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mediaroutering en ontdekking</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Muziekgeneratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Taaklevenscyclus en levering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 12 (0%) / 0 van 12 (0%)</span>
        <span>12 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Videogeneratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 ontbrekende mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage en BlueBubbles - 5 gebieden">
    <p className="maturity-readiness-summary">5 vereisen beoordeling</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en bewerkingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en levering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke inhoud</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native bedieningselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 ontbrekende mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iOS-app - 8 gebieden">
    <p className="maturity-readiness-summary">8 vereisen beoordeling</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas en scherm</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 ontbrekende mogelijkheid</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat en sessies</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 ontbrekende mogelijkheid</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Apparaatopdrachten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distributie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 ontbrekende mogelijkheid</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-configuratie en diagnostiek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 ontbrekende mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en delen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 ontbrekende mogelijkheid</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Meldingen en achtergrond</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 ontbrekende mogelijkheid</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Spraak</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Vereist beoordeling - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 ontbrekende mogelijkheid</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Kubernetes-hosting - 4 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en blootstelling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Clusterlevenscyclus</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuratie en geheimen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Deploymentconfiguratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux-begeleidende app - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Appdistributie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat en sessies</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Desktopmogelijkheden</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-connectiviteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status en diagnostiek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Linux Gateway-host - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Deploymentdoelen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostiek en herstel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-runtime en servicebeheer</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hostconfiguratie en updates</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Externe toegang en beveiliging</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Lokale modelproviders: Ollama, vLLM, SGLang, LM Studio - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokaal geheugen en embeddings</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native provider-Plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Netwerkveiligheid en promptbesturing</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">OpenAI-compatibele runtimecompatibiliteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Providerconfiguratie, levenscyclus en diagnostiek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 12 (0%) / 0 van 12 (0%)</span>
        <span>12 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Longtail gehoste providers - 3 gebieden">
    <p className="maturity-readiness-summary">3 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gehoste LLM-providers</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 12 (0%) / 0 van 12 (0%)</span>
        <span>12 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gehoste mediaproviders</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provideractiviteiten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 12 (0%) / 0 van 12 (0%)</span>
        <span>12 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS-companion-app - 8 gebieden">
    <p className="maturity-readiness-summary">8 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokale setup</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native mogelijkheden</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Externe verbindingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Externe WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status en instellingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Spraak en gesprek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="macOS Gateway-host - 7 gebieden">
    <p className="maturity-readiness-summary">7 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI-setup</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostiek en observeerbaarheid</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Levenscyclus van de Gateway-service</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokale Gateway-integratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Machtigingen en native mogelijkheden</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Profielen en isolatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Externe Gateway-modus</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 gebieden">
    <p className="maturity-readiness-summary">6 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalsetup en bewerkingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en levering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Versleuteling en verificatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native bedieningselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 capaciteitslacune</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en bewerkingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 capaciteitslacune</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en bezorging</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 capaciteitslacune</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 capaciteitslacune</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mediabegrip en mediageneratie - 6 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld / 2 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Afhandeling van kanaalmedia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mediaconfiguratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 capaciteitslacune</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mediageneratie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>1 van 17 (5.9%) / 1 van 19 (5.3%)</span>
        <span>18 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media-inname en toegang</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mediabegrip</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 12 (0%) / 1 van 14 (7.1%)</span>
        <span>13 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tekst-naar-spraak-levering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en bewerkingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en bezorging</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native besturingselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Native Windows - 4 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-beheer</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Netwerken</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Updates</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Native Windows-begeleidende app - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chatsessies</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Desktoptools en machtigingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-verbinding</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installatie en updates</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Status en herstel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Nix-installatiepad - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Activering en app-UX</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuratie en status</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installatieoverdracht</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin-levenscyclus</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Serviceruntime en beveiligingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenAI- en Codex-providerpad - 5 gebieden">
    <p className="maturity-readiness-summary">2 moeten worden beoordeeld / 3 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Afbeeldings- en multimodale invoer</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Model en authenticatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>1 van 6 (16,7%) / 4 van 9 (44,4%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native Codex-harnas</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 4 van 9 (44,4%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Responses en toolcompatibiliteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>1 van 4 (25%) / 2 van 5 (40%)</span>
        <span>3 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Spraak en realtime audio</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenClaw App SDK - 6 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld / 1 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Agentgesprekken</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Client-API</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibiliteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gebeurtenissen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-toegang</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Resource-helpers</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 1 van 6 (16,7%)</span>
        <span>5 capaciteitslacunes</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="OpenRouter-providerpad - 4 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat-runtime en normalisatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 15 (0%) / 0 van 15 (0%)</span>
        <span>15 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Mediageneratie en spraak</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Providerherstel en diagnostiek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Providerconfiguratie en authenticatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 14 (0%) / 0 van 14 (0%)</span>
        <span>14 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugins - 9 gebieden">
    <p className="maturity-readiness-summary">6 moeten worden beoordeeld / 3 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins maken en verpakken</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gebundelde plugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas-plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalplugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins installeren en uitvoeren</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 7 van 20 (35%)</span>
        <span>13 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin-goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider- en toolplugins</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>1 van 6 (16.7%) / 9 van 21 (42.9%)</span>
        <span>12 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins publiceren</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugins testen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 3 van 11 (27.3%)</span>
        <span>8 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi en kleine Linux-apparaten - 4 gebieden">
    <p className="maturity-readiness-summary">4 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Prestaties en diagnostiek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Externe toegang en authenticatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configuratie en compatibiliteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 12 (0%) / 0 van 12 (0%)</span>
        <span>12 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Beveiliging, authenticatie, koppeling en geheimen - 6 gebieden">
    <p className="maturity-readiness-summary">2 gedeeltelijk beoordeeld / 4 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Goedkeuringsbeleid en toolbeveiligingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 3 van 6 (50%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegangscontrole voor kanalen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hygiëne voor aanmeldgegevens en geheimen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 5 van 11 (45.5%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Apparaat- en Node-koppeling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-authenticatie en externe toegang</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin-vertrouwen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sessie, geheugen en contextengine - 9 gebieden">
    <p className="maturity-readiness-summary">2 moeten worden beoordeeld / 7 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI-sessie- en transcriptbeheer</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Contextengine</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 4 van 7 (57.1%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kernprompts en context</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 3 van 8 (37.5%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geschiedenis over clients heen en sessiepariteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 2 van 5 (40%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostiek, onderhoud en herstel</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 4 van 10 (40%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Geheugen</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 6 van 13 (46.2%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessieroutering</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 1 van 4 (25%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Tokenbeheer</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 2 van 10 (20%)</span>
        <span>8 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Transcriptpersistentie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en -activiteiten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en bezorging</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native besturingselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en -activiteiten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en bezorging</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native besturingselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en -activiteiten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en bezorging</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 lacune in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native besturingselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Observability - 5 areas">
    <p className="maturity-readiness-summary">3 gedeeltelijk beoordeeld / 2 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostische verzameling</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>1 van 8 (12,5%) / 3 van 10 (30%)</span>
        <span>7 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gezondheid en herstel</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>1 van 12 (8,3%) / 5 van 18 (27,8%)</span>
        <span>13 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Logging</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessiediagnostiek</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Telemetrie-export</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>1 van 13 (7,7%) / 7 van 21 (33,3%)</span>
        <span>14 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 areas">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Invoer en opdrachten</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Lokale shell-uitvoering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rendering en uitvoerveiligheid</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime-modi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 14 (0%) / 0 van 14 (0%)</span>
        <span>14 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessiebeheer</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Voice and realtime talk - 6 areas">
    <p className="maturity-readiness-summary">6 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gesprek in native app</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Realtime gesprekssessies</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Spraak en transcriptie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Observeerbaarheid van gesprekken</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksproviders</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voice Wake en routering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Voice Call channel - 5 areas">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Opvolging</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 capability-hiaat</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalconfiguratie en bewerkingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en aflevering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 1 (0%) / 0 van 1 (0%)</span>
        <span>1 capability-hiaat</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 capability-hiaten</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Realtime spraak en oproepen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Moet worden beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 capability-hiaten</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="watchOS companion-oppervlakken - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Levering en herstel</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distributie en ondersteuning</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Exec-goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Meldingen en antwoorden</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Watch-app-UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 3 (0%) / 0 van 3 (0%)</span>
        <span>3 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Tools voor zoeken op het web - 4 gebieden">
    <p className="maturity-readiness-summary">2 moeten worden beoordeeld / 2 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Netwerkveiligheid</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Zoekproviders</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>2 van 19 (10.5%) / 2 van 19 (10.5%)</span>
        <span>17 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installatie en diagnose</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 9 (0%) / 0 van 9 (0%)</span>
        <span>9 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Beschikbaarheid en ophalen van tools</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>2 van 11 (18.2%) / 3 van 12 (25%)</span>
        <span>9 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Toegang en identiteit</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 7 (0%) / 0 van 7 (0%)</span>
        <span>7 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Kanaalinstallatie en bewerkingen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 5 (0%) / 0 van 5 (0%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gespreksroutering en levering</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 4 (0%) / 0 van 4 (0%)</span>
        <span>4 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media en rijke content</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Native bedieningselementen en goedkeuringen</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 2 (0%) / 0 van 2 (0%)</span>
        <span>2 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows via WSL2 - 6 gebieden">
    <p className="maturity-readiness-summary">5 moeten worden beoordeeld / 1 gedeeltelijk beoordeeld</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Gebied</span><span>Functies / dekkings-ID's</span><span>Vervolgactie</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browser en bedienings-UI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 8 (0%) / 0 van 8 (0%)</span>
        <span>8 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnose en herstel</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Gedeeltelijk beoordeeld - Volledige taxonomievalidatie</span>
        </div>
        <span>1 van 6 (16.7%) / 3 van 8 (37.5%)</span>
        <span>5 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gateway-toegang en blootstelling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 11 (0%) / 0 van 11 (0%)</span>
        <span>11 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Levenscyclus van de Gateway-service</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 10 (0%) / 0 van 10 (0%)</span>
        <span>10 lacunes in mogelijkheden</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WSL-installatie</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Beoordeling nodig - Volledige taxonomievalidatie</span>
        </div>
        <span>0 van 6 (0%) / 0 van 6 (0%)</span>
        <span>6 lacunes in mogelijkheden</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Laatst bijgewerkt: 2026-06-22
