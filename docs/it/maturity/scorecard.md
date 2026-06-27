---
summary: Punteggi di preparazione al rilascio di OpenClaw per aree di prodotto, integrazioni e flussi di lavoro supportati.
title: Scheda di valutazione della maturità
x-i18n:
    generated_at: "2026-06-27T17:41:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 916f070ca42778dc1cc41e47cdb4ace502f073c4e888f21526b762226a856d40
    source_path: maturity/scorecard.md
    workflow: 16
---

# Scheda di maturità

<div className="maturity-hero">
  <p className="maturity-kicker">preparazione al rilascio - generata da tassonomia + evidenze QA</p>
  <p className="maturity-hero-title">Una visione pratica di ciò che è pronto, ciò che è dimostrato e ciò che richiede ancora lavoro.</p>
  <p>50 superfici - 281 aree di capacità - copertura deterministica più qualità e completezza revisionate da persone.</p>
  <p className="maturity-jump-links"><a href="#surface-explorer">Sfoglia le superfici</a> / <a href="#qa-evidence-summary">Ispeziona le evidenze QA</a> / <a href="/it/maturity/taxonomy">Leggi la tassonomia</a></p>
</div>

## A cosa serve questa pagina

Usa questa pagina per rispondere a una domanda: quali superfici di OpenClaw sono scelte credibili per un rilascio, e quali evidenze supportano questo giudizio? La copertura deriva da evidenze QA deterministiche; qualità e completezza sono mantenute come punteggi di maturità revisionati.

## In sintesi

<div className="maturity-summary-grid">
  <div className="maturity-summary-item maturity-score-alpha">
    <div className="maturity-summary-heading">
      <span className="maturity-summary-value">67%</span>
      <span>Punteggio di maturità</span>
    </div>
    <div className="maturity-summary-bar" style={{ "--score": "67" }}><span /></div>
    <div className="maturity-summary-meta">
      <span className="maturity-level-pill maturity-level-alpha">Alpha</span>
      <span>Qualità + completezza</span>
      <span>Copertura Sperimentale - 4%</span>
      <span>Qualità Alpha - 63%</span>
      <span>Completezza Beta - 70%</span>
    </div>
  </div>
</div>

La copertura è deliberatamente guidata dalle evidenze: un'area non diventa "pronta" solo perché l'implementazione esiste. Non è un input per il punteggio di maturità, ma OpenClaw mira a mantenere nel tempo la copertura end-to-end sopra il 90% per le funzionalità mature Stabili o superiori.

## Fasce di punteggio

<div className="maturity-band-list">
  <div className="maturity-band maturity-band-experimental"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span></span><span>0-50%</span></div>
  <div className="maturity-band maturity-band-alpha"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-alpha">Alpha</span></span><span>50-70%</span></div>
  <div className="maturity-band maturity-band-beta"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-beta">Beta</span></span><span>70-80%</span></div>
  <div className="maturity-band maturity-band-stable"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-stable">Stabile</span></span><span>80-95%</span></div>
  <div className="maturity-band maturity-band-clawesome"><span className="maturity-band-title"><span className="maturity-level-pill maturity-level-clawesome">Clawesome</span></span><span>95-100%</span></div>
</div>

## Esploratore delle superfici

<a id="surface-explorer" />

Le superfici sono ordinate per livello di maturità, completezza e qualità. Il supporto LTS è mostrato accanto a ogni riga, così le opzioni pronte per il rilascio sono facili da confrontare.

  <Tabs>
  <Tab title="Tutte le superfici">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Copertura</span><span>Qualità</span><span>Completezza</span><span>Supporto</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>7 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Runtime Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>13 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">Host Gateway Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">Host Gateway macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>7 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Runtime dell'agente</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Motore di sessione, memoria e contesto</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Framework dei canali</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Strumenti di automazione del browser, exec e sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#observability"><span className="maturity-surface-title">Osservabilità</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Percorso del provider OpenAI e Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">Web App del Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Strumenti di ricerca web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Sicurezza, autenticazione, pairing e segreti</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automazione: Cron, hook, attività, polling</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">Hosting Docker e Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows tramite WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi e piccoli dispositivi Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Percorso provider Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Percorso provider Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage e BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">app complementare macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Percorso del provider OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Comprensione dei media e generazione di media</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Strumenti di generazione di immagini, video e musica</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Provider di modelli locali: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Provider ospitati a coda lunga</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Voce e conversazioni in tempo reale</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#android-app"><span className="maturity-surface-title">App Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>7 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows nativo</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">Hosting Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canali regionali</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#ios-app"><span className="maturity-surface-title">app iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Sperimentale</span></span><span>8 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Percorso di installazione Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Sperimentale</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Canale di chiamata vocale</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Sperimentale</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Superfici complementari watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Sperimentale</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">app complementare Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Pianificato</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">app complementare nativa per Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Pianificato</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Nucleo">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Copertura</span><span>Qualità</span><span>Completezza</span><span>Supporto</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#cli"><span className="maturity-surface-title">CLI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>7 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>83%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "83%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#gateway-runtime"><span className="maturity-surface-title">Runtime del Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>13 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>81%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "81%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 12</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#agent-runtime"><span className="maturity-surface-title">Runtime dell'agente</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#session-memory-and-context-engine"><span className="maturity-surface-title">Motore di sessione, memoria e contesto</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 6</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#channel-framework"><span className="maturity-surface-title">Framework dei canali</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>76%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "76%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#observability"><span className="maturity-surface-title">Osservabilità</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>18%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "18%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#gateway-web-app"><span className="maturity-surface-title">App web Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>4%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "4%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#plugins"><span className="maturity-surface-title">Plugin</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>12%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "12%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 7</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#security-auth-pairing-and-secrets"><span className="maturity-surface-title">Sicurezza, autenticazione, associazione e segreti</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>16%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "16%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#automation-cron-hooks-tasks-polling"><span className="maturity-surface-title">Automazione: Cron, hook, attività, interrogazione periodica</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>72%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "72%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#media-understanding-and-media-generation"><span className="maturity-surface-title">Comprensione e generazione dei media</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>2%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "2%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#voice-and-realtime-talk"><span className="maturity-surface-title">Voce e conversazione in tempo reale</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#tui"><span className="maturity-surface-title">TUI</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#clawhub"><span className="maturity-surface-title">ClawHub</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#openclaw-app-sdk"><span className="maturity-surface-title">OpenClaw App SDK</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>3%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "3%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Piattaforma">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Copertura</span><span>Qualità</span><span>Completezza</span><span>Supporto</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#linux-gateway-host"><span className="maturity-surface-title">host Linux Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#macos-gateway-host"><span className="maturity-surface-title">host macOS Gateway</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>7 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#docker-and-podman-hosting"><span className="maturity-surface-title">hosting Docker e Podman</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#windows-via-wsl2"><span className="maturity-surface-title">Windows tramite WSL2</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>6%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "6%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#raspberry-pi-and-small-linux-devices"><span className="maturity-surface-title">Raspberry Pi e piccoli dispositivi Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#macos-companion-app"><span className="maturity-surface-title">app companion macOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#android-app"><span className="maturity-surface-title">app Android</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>7 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#native-windows"><span className="maturity-surface-title">Windows nativo</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 1</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#kubernetes-hosting"><span className="maturity-surface-title">hosting Kubernetes</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#ios-app"><span className="maturity-surface-title">app iOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Sperimentale</span></span><span>8 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#nix-install-path"><span className="maturity-surface-title">Percorso di installazione Nix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Sperimentale</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#watchos-companion-surfaces"><span className="maturity-surface-title">Superfici complementari watchOS</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Sperimentale</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#linux-companion-app"><span className="maturity-surface-title">App complementare Linux</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Pianificato</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#native-windows-companion-app"><span className="maturity-surface-title">App complementare nativa per Windows</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Pianificato</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Canale">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Copertura</span><span>Qualità</span><span>Completezza</span><span>Supporto</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#discord"><span className="maturity-surface-title">Discord</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Stabile</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Stabile</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 4</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#telegram"><span className="maturity-surface-title">Telegram</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#slack"><span className="maturity-surface-title">Slack</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-full">Completo - 5</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#imessage-and-bluebubbles"><span className="maturity-surface-title">iMessage e BlueBubbles</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#whatsapp"><span className="maturity-surface-title">WhatsApp</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#matrix"><span className="maturity-surface-title">Matrix</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>6 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#google-chat"><span className="maturity-surface-title">Google Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#microsoft-teams"><span className="maturity-surface-title">Microsoft Teams</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alfa</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alfa</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#signal"><span className="maturity-surface-title">Signal</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels"><span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canali regionali</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>58%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "58%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat"><span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#voice-call-channel"><span className="maturity-surface-title">Canale Voice Call</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Sperimentale</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
    </div>
  </Tab>
  <Tab title="Provider e strumento">
    <div className="maturity-surface-table">
      <div className="maturity-surface-row maturity-surface-row-header"><span>Superficie</span><span>Copertura</span><span>Qualità</span><span>Completezza</span><span>Supporto</span></div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#browser-automation-exec-and-sandbox-tools"><span className="maturity-surface-title">Automazione del browser, exec e strumenti sandbox</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 2</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#openai-and-codex-provider-path"><span className="maturity-surface-title">Percorso provider OpenAI e Codex</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>26%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "26%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-partial">Parziale - 3</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#web-search-tools"><span className="maturity-surface-title">Strumenti di ricerca web</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#anthropic-provider-path"><span className="maturity-surface-title">Percorso del provider Anthropic</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>71%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "71%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#google-provider-path"><span className="maturity-surface-title">Percorso del provider Google</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#openrouter-provider-path"><span className="maturity-surface-title">Percorso del provider OpenRouter</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#image-video-and-music-generation-tools"><span className="maturity-surface-title">Strumenti di generazione di immagini, video e musica</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#local-model-providers-ollama-vllm-sglang-lm-studio"><span className="maturity-surface-title">Provider di modelli locali: Ollama, vLLM, SGLang, LM Studio</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
      <div className="maturity-surface-row">
        <a className="maturity-surface-name" href="/it/maturity/taxonomy#long-tail-hosted-providers"><span className="maturity-surface-title">Provider ospitati a coda lunga</span><span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 aree</span></span></a>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Copertura</span><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Sperimentale</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Qualità</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-surface-metric"><span className="maturity-surface-metric-label">Completezza</span><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-surface-support"><span className="maturity-lts maturity-lts-none">Nessuno</span></div>
      </div>
    </div>
  </Tab>
</Tabs>

## Riepilogo delle evidenze QA

I controlli seguenti mostrano quali aree della scorecard sono state esercitate dalle evidenze del profilo QA.

<div className="maturity-evidence-grid">
  <div className="maturity-evidence-card">
    <span className="maturity-evidence-title">Validazione completa della tassonomia</span>
    <span>2026-06-23T07:24:36.128Z</span>
    <span>96 controlli - 94 superati, 2 bloccati</span>
    <span>0 di 281 (0%) aree - 20 di 1675 (1.2%) funzionalità - 77 di 1665 (4.6%) ID di copertura</span>
  </div>
</div>

### Prontezza per area

Apri una superficie per ispezionare lo stato delle evidenze di ciascuna categoria. L'elenco resta compresso, così la pagina rimane utile a colpo d'occhio.

<AccordionGroup>
  <Accordion title="Runtime agente - 9 aree">
    <p className="maturity-readiness-summary">8 parzialmente revisionate / 1 da revisionare</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Esecuzione dei turni dell'agente</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 7 di 24 (29.2%)</span>
        <span>17 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime esterni e subagenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 3 di 10 (30%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Esecuzione del provider ospitato</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>1 di 5 (20%) / 1 di 5 (20%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider locali e autogestiti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Selezione del modello e del runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 2 di 8 (25%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticazione provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 4 di 17 (23.5%)</span>
        <span>13 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Streaming e avanzamento</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 5 di 9 (55.6%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chiamate agli strumenti e gestione delle risposte</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 15 di 23 (65.2%)</span>
        <span>8 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli di esecuzione degli strumenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 6 di 12 (50%)</span>
        <span>6 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="App Android - 7 aree">
    <p className="maturity-readiness-summary">7 da revisionare</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione della connessione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime del dispositivo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribuzione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acquisizione di contenuti multimediali</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat mobile</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Impostazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voce</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Percorso provider Anthropic - 5 aree">
    <p className="maturity-readiness-summary">5 da revisionare</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Input multimediali</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Selezione del modello e del runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 12 (0%)</span>
        <span>12 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cache dei prompt e contesto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticazione e recupero del provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Trasporto delle richieste e semantica dei turni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automazione: Cron, hook, attività, polling - 6 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione / 1 parzialmente revisionata</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azione successiva</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Hook di automazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 11 (0%) / 0 di 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Attività e flussi in background</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Job Cron</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 15 (0%) / 0 di 15 (0%)</span>
        <span>15 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ingresso eventi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 15 (0%) / 0 di 15 (0%)</span>
        <span>15 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Heartbeat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 1 di 7 (14.3%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli di polling</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Automazione del browser, exec e strumenti sandbox - 3 aree">
    <p className="maturity-readiness-summary">2 parzialmente revisionate / 1 richiede revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azione successiva</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Automazione del browser</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>1 di 8 (12.5%) / 1 di 8 (12.5%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Policy di sandbox e strumenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Invocazione ed esecuzione degli strumenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>2 di 6 (33.3%) / 4 di 8 (50%)</span>
        <span>4 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="App web Gateway - 6 aree">
    <p className="maturity-readiness-summary">3 richiedono revisione / 3 parzialmente revisionate</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azione successiva</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e attendibilità del browser</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversazione in tempo reale nel browser</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Interfaccia utente del browser</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 1 di 12 (8.3%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Console operatore</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 1 di 12 (8.3%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversazioni WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 15 (0%) / 2 di 20 (10%)</span>
        <span>18 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Framework dei canali - 8 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione / 4 parzialmente revisionate</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azione successiva</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Azioni, comandi e approvazioni dei canali</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 1 di 7 (14.3%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e consegna delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 5 di 27 (18.5%)</span>
        <span>22 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comportamento di thread di gruppo e stanze ambientali</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 4 di 11 (36.4%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso in ingresso e gate di identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Allegati multimediali e dati avanzati dei canali</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Consegna in uscita e pipeline di risposta</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 8 di 21 (38.1%)</span>
        <span>13 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integrità dello stato e controlli operatore</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="ClawHub - 4 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rilevamento del catalogo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilità e fiducia</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 12 (0%) / 0 di 12 (0%)</span>
        <span>12 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo di vita e integrità dei Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 26 (0%) / 0 di 26 (0%)</span>
        <span>26 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pubblicazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="CLI - 7 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione / 2 parzialmente revisionate</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Osservabilità della CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione della CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>1 di 6 (16.7%) / 1 di 6 (16.7%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Doctor</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestione del servizio Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 1 di 7 (14.3%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Onboarding e configurazione dell'autenticazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione di Plugin e canali</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aggiornamenti e upgrade</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Discord - 6 aree">
    <p className="maturity-readiness-summary">6 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routing e consegna delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 12 (0%) / 0 di 12 (0%)</span>
        <span>12 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli nativi e approvazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voce in tempo reale e chiamate</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hosting Docker e Podman - 4 aree">
    <p className="maturity-readiness-summary">3 richiedono revisione / 1 parzialmente revisionata</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sandbox dell'agente e strumenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operazioni dei container</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 11 (0%) / 0 di 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione dei container</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rilascio e validazione delle immagini</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionata - Validazione completa della tassonomia</span>
        </div>
        <span>1 di 5 (20%) / 2 di 7 (28.6%)</span>
        <span>5 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, canali regionali - 4 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e recapito delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Runtime Gateway - 13 aree">
    <p className="maturity-readiness-summary">9 richiedono revisione / 4 parzialmente revisionate</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Approvazioni ed esecuzione remota</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticazione e associazione dei dispositivi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo di vita del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 4 di 12 (33.3%)</span>
        <span>8 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API RPC ed eventi del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 20 (0%) / 2 di 22 (9.1%)</span>
        <span>20 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integrità, diagnostica e riparazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Superficie web ospitata</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API HTTP</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Convalida completa della tassonomia</span>
        </div>
        <span>1 di 4 (25%) / 1 di 4 (25%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e individuazione della rete</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Node e capacità remote</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 8 (0%) / 0 di 8 (0%)</span>
        <span>8 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilità del protocollo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ruoli e autorizzazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli di sicurezza</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Connessione WebSocket</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Convalida completa della tassonomia</span>
        </div>
        <span>1 di 8 (12.5%) / 1 di 8 (12.5%)</span>
        <span>7 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Google Chat - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Follow-up</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 11 (0%) / 0 di 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 16 (0%) / 0 di 16 (0%)</span>
        <span>16 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e recapito delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli e approvazioni nativi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 16 (0%) / 0 di 16 (0%)</span>
        <span>16 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Percorso del provider Google - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime diretto Gemini</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media, ricerca e tempo reale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento dei modelli ed endpoint</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memorizzazione nella cache dei prompt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e credenziali del provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Strumenti di generazione di immagini, video e musica - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generazione di immagini</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e individuazione dei media</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generazione di musica</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo di vita e consegna delle attività</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 12 (0%) / 0 di 12 (0%)</span>
        <span>12 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generazione di video</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 11 (0%) / 0 di 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="iMessage e BlueBubbles - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 11 (0%) / 0 di 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e consegna delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli nativi e approvazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="App iOS - 8 aree">
    <p className="maturity-readiness-summary">8 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Area di disegno e schermo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat e sessioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comandi del dispositivo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribuzione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e diagnostica del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e condivisione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notifiche e background</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voce</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Hosting Kubernetes - 4 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso ed esposizione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo di vita del cluster</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e segreti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione della distribuzione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di funzionalità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="App complementare Linux - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribuzione dell'app</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Chat e sessioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Funzionalità desktop</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Connettività Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Stato e diagnostica</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di funzionalità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Host Gateway Linux - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Target di distribuzione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostica e riparazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime Gateway e controllo del servizio</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e aggiornamenti dell'host</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso remoto e sicurezza</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di funzionalità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Provider di modelli locali: Ollama, vLLM, SGLang, LM Studio - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memoria locale ed embedding</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin di provider nativi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sicurezza di rete e controlli dei prompt</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilità del runtime compatibile con OpenAI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 8 (0%) / 0 di 8 (0%)</span>
        <span>8 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione, ciclo di vita e diagnostica dei provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 12 (0%) / 0 di 12 (0%)</span>
        <span>12 lacune di funzionalità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Provider ospitati di nicchia - 3 aree">
    <p className="maturity-readiness-summary">3 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider LLM ospitati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 12 (0%) / 0 di 12 (0%)</span>
        <span>12 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider multimediali ospitati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 8 (0%) / 0 di 8 (0%)</span>
        <span>8 lacune di funzionalità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Operazioni dei provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 12 (0%) / 0 di 12 (0%)</span>
        <span>12 lacune di funzionalità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="app complementare per macOS - 8 aree">
    <p className="maturity-readiness-summary">8 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azione successiva</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione locale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Capacità native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Connessioni remote</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat remota</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Stato e impostazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voce e conversazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">WebChat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="host Gateway macOS - 7 aree">
    <p className="maturity-readiness-summary">7 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azione successiva</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione della CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostica e osservabilità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo di vita del servizio Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integrazione del Gateway locale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Permessi e capacità native</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Profili e isolamento</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modalità Gateway remoto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Matrix - 6 aree">
    <p className="maturity-readiness-summary">6 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azione successiva</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routing e recapito delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Crittografia e verifica</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli nativi e approvazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - 4 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 1 (0%) / 0 su 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 1 (0%) / 0 su 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e consegna delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 1 (0%) / 0 su 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 1 (0%) / 0 su 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Comprensione dei media e generazione di media - 6 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione / 2 parzialmente revisionate</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestione dei media del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 5 (0%) / 0 su 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione dei media</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 1 (0%) / 0 su 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generazione di media</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>1 su 17 (5.9%) / 1 su 19 (5.3%)</span>
        <span>18 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Acquisizione e accesso ai media</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 8 (0%) / 0 su 8 (0%)</span>
        <span>8 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Comprensione dei media</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 12 (0%) / 1 su 14 (7.1%)</span>
        <span>13 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Consegna della sintesi vocale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 2 (0%) / 0 su 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Microsoft Teams - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 9 (0%) / 0 su 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 9 (0%) / 0 su 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e consegna delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 5 (0%) / 0 su 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 5 (0%) / 0 su 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli nativi e approvazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 5 (0%) / 0 su 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows nativo - 4 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 9 (0%) / 0 su 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestione del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 11 (0%) / 0 su 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rete</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 4 (0%) / 0 su 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Aggiornamenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 su 4 (0%) / 0 su 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="App companion nativa per Windows - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessioni di chat</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Strumenti desktop e autorizzazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Connessione Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installazione e aggiornamenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Stato e riparazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Percorso di installazione Nix - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Attivazione e UX dell'app</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e stato</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Passaggio dell'installazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo di vita del Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime del servizio e protezioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 8 (0%) / 0 di 8 (0%)</span>
        <span>8 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Percorso del provider OpenAI e Codex - 5 aree">
    <p className="maturity-readiness-summary">2 richiedono revisione / 3 revisionate parzialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Input di immagini e multimodale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modello e autenticazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisionata parzialmente - Validazione completa della tassonomia</span>
        </div>
        <span>1 di 6 (16,7%) / 4 di 9 (44,4%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Harness Codex nativo</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisionata parzialmente - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 4 di 9 (44,4%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Risposte e compatibilità degli strumenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisionata parzialmente - Validazione completa della tassonomia</span>
        </div>
        <span>1 di 4 (25%) / 2 di 5 (40%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voce e audio in tempo reale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="SDK dell'app OpenClaw - 6 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione / 1 revisionata parzialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversazioni degli agenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">API client</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Compatibilità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Eventi e approvazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Helper per risorse</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisionata parzialmente - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 1 di 6 (16,7%)</span>
        <span>5 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Percorso del provider OpenRouter - 4 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime di chat e normalizzazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 15 (0%) / 0 di 15 (0%)</span>
        <span>15 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Generazione di contenuti multimediali e voce</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ripristino e diagnostica del provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e autenticazione del provider</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 14 (0%) / 0 di 14 (0%)</span>
        <span>14 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Plugin - 9 aree">
    <p className="maturity-readiness-summary">6 richiedono revisione / 3 parzialmente revisionate</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Creazione e pacchettizzazione dei Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 8 (0%) / 0 di 8 (0%)</span>
        <span>8 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin inclusi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin Canvas</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin di canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Installazione ed esecuzione dei Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 7 di 20 (35%)</span>
        <span>13 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Approvazioni dei Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Plugin di provider e strumenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>1 di 6 (16.7%) / 9 di 21 (42.9%)</span>
        <span>12 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Pubblicazione dei Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Test dei Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 3 di 11 (27.3%)</span>
        <span>8 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Raspberry Pi e piccoli dispositivi Linux - 4 aree">
    <p className="maturity-readiness-summary">4 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Runtime del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Prestazioni e diagnostica</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso remoto e autenticazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e compatibilità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 12 (0%) / 0 di 12 (0%)</span>
        <span>12 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sicurezza, autenticazione, associazione e segreti - 6 aree">
    <p className="maturity-readiness-summary">2 parzialmente revisionate / 4 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Criteri di approvazione e protezioni degli strumenti</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 3 di 6 (50%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controllo dell'accesso ai canali</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Igiene di credenziali e segreti</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 5 di 11 (45.5%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Associazione di dispositivi e Node</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 11 (0%) / 0 di 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Autenticazione del Gateway e accesso remoto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Attendibilità dei Plugin</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Sessione, memoria e motore di contesto - 9 aree">
    <p className="maturity-readiness-summary">2 richiedono revisione / 7 parzialmente revisionate</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestione delle sessioni CLI e delle trascrizioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Motore di contesto</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 4 di 7 (57.1%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Prompt e contesto principali</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 3 di 8 (37.5%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Cronologia tra client e parità delle sessioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 2 di 5 (40%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostica, manutenzione e ripristino</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 4 di 10 (40%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Memoria</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 6 di 13 (46.2%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento delle sessioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 1 di 4 (25%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestione dei token</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 2 di 10 (20%)</span>
        <span>8 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Persistenza delle trascrizioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Signal - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e recapito delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli nativi e approvazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Slack - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e recapito delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli nativi e approvazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 8 (0%) / 0 di 8 (0%)</span>
        <span>8 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Telegram - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e recapito delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli nativi e approvazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Osservabilità - 5 aree">
    <p className="maturity-readiness-summary">3 parzialmente revisionate / 2 da revisionare</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Raccolta diagnostica</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Convalida completa della tassonomia</span>
        </div>
        <span>1 di 8 (12.5%) / 3 di 10 (30%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Integrità e riparazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Convalida completa della tassonomia</span>
        </div>
        <span>1 di 12 (8.3%) / 5 di 18 (27.8%)</span>
        <span>13 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Registrazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostica della sessione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Esportazione della telemetria</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Parzialmente revisionato - Convalida completa della tassonomia</span>
        </div>
        <span>1 di 13 (7.7%) / 7 di 21 (33.3%)</span>
        <span>14 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="TUI - 5 aree">
    <p className="maturity-readiness-summary">5 da revisionare</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Input e comandi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 8 (0%) / 0 di 8 (0%)</span>
        <span>8 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Esecuzione della shell locale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Rendering e sicurezza dell'output</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Modalità di runtime</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 14 (0%) / 0 di 14 (0%)</span>
        <span>14 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Gestione delle sessioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Voce e conversazione in tempo reale - 6 aree">
    <p className="maturity-readiness-summary">6 da revisionare</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Conversazione nell'app nativa</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sessioni di conversazione in tempo reale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 11 (0%) / 0 di 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voce e trascrizione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Osservabilità della conversazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider di conversazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Attivazione vocale e routing</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Canale Chiamata vocale - 5 aree">
    <p className="maturity-readiness-summary">5 da revisionare</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Routing e consegna delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 1 (0%) / 0 di 1 (0%)</span>
        <span>1 lacuna di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Voce e chiamate in tempo reale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Da revisionare - Convalida completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="superfici companion watchOS - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Consegna e ripristino</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Distribuzione e supporto</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Approvazioni esecutive</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Notifiche e risposte</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">UI dell'app Watch</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 3 (0%) / 0 di 3 (0%)</span>
        <span>3 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Strumenti di ricerca web - 4 aree">
    <p className="maturity-readiness-summary">2 richiedono revisione / 2 revisionati parzialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Sicurezza di rete</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Provider di ricerca</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisionato parzialmente - Validazione completa della tassonomia</span>
        </div>
        <span>2 di 19 (10.5%) / 2 di 19 (10.5%)</span>
        <span>17 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e diagnostica</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 9 (0%) / 0 di 9 (0%)</span>
        <span>9 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Disponibilità degli strumenti e recupero</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisionato parzialmente - Validazione completa della tassonomia</span>
        </div>
        <span>2 di 11 (18.2%) / 3 di 12 (25%)</span>
        <span>9 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="WhatsApp - 5 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso e identità</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 7 (0%) / 0 di 7 (0%)</span>
        <span>7 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione e operazioni del canale</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 5 (0%) / 0 di 5 (0%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Instradamento e consegna delle conversazioni</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 4 (0%) / 0 di 4 (0%)</span>
        <span>4 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Media e contenuti avanzati</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Controlli e approvazioni nativi</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 2 (0%) / 0 di 2 (0%)</span>
        <span>2 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

  <Accordion title="Windows tramite WSL2 - 6 aree">
    <p className="maturity-readiness-summary">5 richiedono revisione / 1 revisionato parzialmente</p>
    <div className="maturity-readiness-list">
      <div className="maturity-readiness-row maturity-readiness-row-header"><span>Area</span><span>Funzionalità / ID di copertura</span><span>Azioni successive</span></div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Browser e UI di controllo</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">CLI</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 8 (0%) / 0 di 8 (0%)</span>
        <span>8 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Diagnostica e riparazione</span>
          <span className="maturity-readiness-status maturity-readiness-status-partially-reviewed">Revisionato parzialmente - Validazione completa della tassonomia</span>
        </div>
        <span>1 di 6 (16.7%) / 3 di 8 (37.5%)</span>
        <span>5 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Accesso ed esposizione del Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 11 (0%) / 0 di 11 (0%)</span>
        <span>11 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Ciclo di vita del servizio Gateway</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 10 (0%) / 0 di 10 (0%)</span>
        <span>10 lacune di capacità</span>
      </div>
      <div className="maturity-readiness-row">
        <div className="maturity-readiness-area">
          <span className="maturity-readiness-title">Configurazione WSL</span>
          <span className="maturity-readiness-status maturity-readiness-status-needs-review">Richiede revisione - Validazione completa della tassonomia</span>
        </div>
        <span>0 di 6 (0%) / 0 di 6 (0%)</span>
        <span>6 lacune di capacità</span>
      </div>
    </div>
  </Accordion>

</AccordionGroup>

> Ultimo aggiornamento: 2026-06-22
